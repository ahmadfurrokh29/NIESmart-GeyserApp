import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { MetricCard } from '../../components/MetricCard';
import { getIconName } from '../../constants/iconMappings';
import { gradients, theme } from '../../constants/theme';
import { useGeyser } from '../../contexts/GeyserContext';
import { geyserControlService } from '../../services/geyserControlService';
import { ActiveSchedule, Schedule, scheduleService } from '../../services/scheduleService';

const SchedulingScreen = () => {
  const router = useRouter();
  const geyserCtx = useGeyser();

  // Initialize geyser control service
  useEffect(() => {
    geyserControlService.setContext(geyserCtx);
  }, [geyserCtx]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedHour, setSelectedHour] = useState(7);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [scheduleTemperature, setScheduleTemperature] = useState(40);
  const [duration, setDuration] = useState(1); // Duration in minutes (changed from hours)
  // Removed maintainTemp state

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSchedule, setActiveSchedule] = useState<ActiveSchedule | null>(null);

  // Load schedules when component mounts
  useEffect(() => {
    loadSchedules();
    initializeScheduleService();
    loadActiveSchedule();
  }, []);

  // Load active schedule
  const loadActiveSchedule = async () => {
    try {
      const currentActive = await scheduleService.getCurrentActiveSchedule();
      setActiveSchedule(currentActive);
    } catch (error) {
      console.error('Error loading active schedule:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      const savedSchedules = await scheduleService.getSchedules();
      setSchedules(savedSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
              Alert.alert('Error', 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeScheduleService = async () => {
    try {
      await scheduleService.initializeBackgroundTask();
    } catch (error) {
      console.error('Error initializing schedule service:', error);
    }
  };

  const handleToggleSchedule = (scheduleId: number) => {
    Alert.alert(
      'Toggle Schedule',
      'Enable/disable this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Toggle', 
          onPress: async () => {
            try {
              const updatedSchedules = schedules.map(schedule => 
                schedule.id === scheduleId 
                  ? { ...schedule, enabled: !schedule.enabled }
                  : schedule
              );
              await scheduleService.saveSchedules(updatedSchedules);
              setSchedules(updatedSchedules);
              Alert.alert('Success', 'Schedule updated!');
            } catch (error) {
              console.error('Error toggling schedule:', error);
              Alert.alert('Error', 'Update failed');
            }
          }
        },
      ]
    );
  };

  const handleDeleteSchedule = (scheduleId: number) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    Alert.alert(
      'Delete Schedule',
      `Delete "${schedule?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
              await scheduleService.saveSchedules(updatedSchedules);
              setSchedules(updatedSchedules);
              
              // Check if the deleted schedule was active and clear it
              if (activeSchedule && activeSchedule.scheduleId === scheduleId) {
                await scheduleService.clearActiveSchedule();
                setActiveSchedule(null);
              }
              
              Alert.alert('Success', 'Schedule deleted!');
            } catch (error) {
              console.error('Error deleting schedule:', error);
              Alert.alert('Error', 'Delete failed');
            }
          }
        },
      ]
    );
  };

  const handleCreateNewSchedule = () => {
    setSelectedHour(7);
    setSelectedMinute(0);
    setSelectedPeriod('AM');
    setScheduleTemperature(45);
    setModalStep(1);
    setShowModal(true);
  };

  const handleManualCheck = async () => {
    try {
      await scheduleService.forceCheckSchedules();
      await loadActiveSchedule(); // Refresh active schedule
      Alert.alert('Success', 'Check complete!');
    } catch (error) {
      console.error('Error in manual check:', error);
      Alert.alert('Error', 'Check failed');
    }
  };

  const handleModalNext = async () => {
    if (modalStep === 1) {
      setModalStep(2);
    } else if (modalStep === 2) {
      if (scheduleTemperature < 30 || scheduleTemperature > 100) {
        Alert.alert('Error', 'Temperature 30-100°C');
        return;
      }
      
      // Format time
      const formattedTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`;
      
      // Calculate end time based on duration
      const startDate = new Date();
      startDate.setHours(selectedPeriod === 'PM' && selectedHour !== 12 ? selectedHour + 12 : selectedHour);
      startDate.setMinutes(selectedMinute);
      const endDate = new Date(startDate.getTime() + (duration * 60 * 1000));
      const endHour = endDate.getHours();
      const endMinute = endDate.getMinutes();
      const endPeriod = endHour >= 12 ? 'PM' : 'AM';
      const formattedEndTime = `${(endHour % 12 || 12).toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')} ${endPeriod}`;
      
      // Generate sequential schedule name
      const scheduleNumber = schedules.length + 1;
      const autoName = `Schedule ${scheduleNumber}`;
      
      try {
        const newSchedule: Schedule = {
          id: Date.now(),
          name: autoName,
          time: formattedTime,
          endTime: formattedEndTime,
          temperature: scheduleTemperature,
          duration: duration,
          enabled: true,
          icon: selectedPeriod === 'AM' && selectedHour < 12 ? 'weather-sunny' : 
                selectedPeriod === 'PM' && selectedHour >= 6 ? 'weather-night' : 'weather-partly-cloudy'
        };
        
        const updatedSchedules = [...schedules, newSchedule];
        await scheduleService.saveSchedules(updatedSchedules);
        setSchedules(updatedSchedules);
        setShowModal(false);
      } catch (error) {
        console.error('Error creating schedule:', error);
        Alert.alert('Error', 'Creation failed');
        return;
      }
      
      Alert.alert('Success', 'Schedule created!');
    }
  };

  const handleModalBack = () => {
    if (modalStep > 1) {
      setModalStep(modalStep - 1);
    } else {
      setShowModal(false);
    }
  };

  const renderTimePicker = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    const periods = ['AM', 'PM'];

    return (
      <View style={styles.timePickerContainer}>
        {/* Hour Picker */}
        <View style={styles.pickerColumn}>
          <Text style={styles.pickerLabel}>Hour</Text>
          <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
            {hours.map((hour) => (
              <Pressable
                key={hour}
                style={[
                  styles.pickerItem,
                  selectedHour === hour && styles.pickerItemSelected
                ]}
                onPress={() => setSelectedHour(hour)}
              >
                <Text style={[
                  styles.pickerText,
                  selectedHour === hour && styles.pickerTextSelected
                ]}>
                  {hour.toString().padStart(2, '0')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Minute Picker */}
        <View style={styles.pickerColumn}>
          <Text style={styles.pickerLabel}>Min</Text>
          <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
            {minutes.map((minute) => (
              <Pressable
                key={minute}
                style={[
                  styles.pickerItem,
                  selectedMinute === minute && styles.pickerItemSelected
                ]}
                onPress={() => setSelectedMinute(minute)}
              >
                <Text style={[
                  styles.pickerText,
                  selectedMinute === minute && styles.pickerTextSelected
                ]}>
                  {minute.toString().padStart(2, '0')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Period Picker */}
        <View style={styles.pickerColumn}>
          <Text style={styles.pickerLabel}>Period</Text>
          <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
            {periods.map((period) => (
              <Pressable
                key={period}
                style={[
                  styles.pickerItem,
                  selectedPeriod === period && styles.pickerItemSelected
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.pickerText,
                  selectedPeriod === period && styles.pickerTextSelected
                ]}>
                  {period}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderTemperatureSlider = () => {
    const temperatures = Array.from({ length: 8 }, (_, i) => 30 + (i * 10)); // 30-100°C in steps of 10

    return (
      <View style={styles.temperatureContainer}>
        <View style={styles.temperatureDisplay}>
          <MaterialCommunityIcons name="thermometer" size={32} color={theme.colors.primary} />
          <Text style={styles.temperatureValue}>{scheduleTemperature}°C</Text>
        </View>
        
        <ScrollView 
          horizontal 
          style={styles.temperatureSlider} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.temperatureSliderContent}
        >
          {temperatures.map((temp) => (
            <Pressable
              key={temp}
              style={[
                styles.temperatureItem,
                scheduleTemperature === temp && styles.temperatureItemSelected
              ]}
              onPress={() => setScheduleTemperature(temp)}
            >
              <View style={[
                styles.temperatureDot,
                scheduleTemperature === temp && styles.temperatureDotSelected
              ]} />
              <Text style={[
                styles.temperatureText,
                scheduleTemperature === temp && styles.temperatureTextSelected
              ]}>
                {temp}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderDurationPicker = () => {
    // Allow minute-level scheduling: 1, 5, 10, 15, 30 minutes, then hourly options
    const durations = [1, 5, 10, 15, 30, 60, 120, 180, 240, 360]; // minutes

    return (
      <View style={styles.durationContainer}>
        <View style={styles.durationDisplay}>
          <MaterialCommunityIcons name="clock-time-four" size={32} color={theme.colors.primary} />
          <Text style={styles.durationValue}>
            {duration < 60 ? `${duration} min` : `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}min` : ''}`}
          </Text>
        </View>
        
        <ScrollView 
          horizontal 
          style={styles.durationSlider} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.durationSliderContent}
        >
          {durations.map((minutes) => (
            <Pressable
              key={minutes}
              style={[
                styles.durationItem,
                duration === minutes && styles.durationItemSelected
              ]}
              onPress={() => setDuration(minutes)}
            >
              <View style={[
                styles.durationDot,
                duration === minutes && styles.durationDotSelected
              ]} />
              <Text style={[
                styles.durationText,
                duration === minutes && styles.durationTextSelected
              ]}>
                {minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderModalContent = () => {
    switch (modalStep) {
      case 1:
        return (
          <>
            <Text style={styles.modalTitle}>Set Schedule Time</Text>
            <Text style={styles.modalSubtitle}>Choose when you want the geyser to turn on</Text>
            
            <View style={styles.timeDisplayContainer}>
              <MaterialCommunityIcons name="clock" size={24} color={theme.colors.primary} />
              <Text style={styles.timeDisplay}>
                {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
              </Text>
            </View>
            
            {renderTimePicker()}
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.modalTitle}>Set Temperature</Text>
            <Text style={styles.modalSubtitle}>Choose your target water temperature (30-100°C)</Text>
            {renderTemperatureSlider()}
            
            {/* Removed maintainTempContainer */}

            {renderDurationPicker()}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>Scheduling</Text>
          </View>
          <MaterialCommunityIcons name="calendar-clock" size={24} color={theme.colors.primary} />
        </View>

        {/* Schedule Stats */}
        <View style={styles.statsRow}>
          <MetricCard
            title="Active Schedules"
            value={schedules.filter(s => s.enabled).length.toString()}
            color={theme.colors.success}
            icon={<MaterialCommunityIcons name="clock-check" size={20} color={theme.colors.success} />}
          />
          <MetricCard
            title="Total Schedules"
            value={schedules.length.toString()}
            subtitle="Created"
            color={theme.colors.primary}
            icon={<MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primary} />}
          />
        </View>





        {/* Schedules List */}
        <DarkCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Schedules</Text>
            <Pressable style={styles.addButton} onPress={handleCreateNewSchedule}>
              <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading schedules...</Text>
            </View>
          ) : schedules.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-plus" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyStateTitle}>No Schedules Yet</Text>
              <Text style={styles.emptyStateDesc}>Create your first schedule to automate your geyser</Text>
            </View>
          ) : (
            schedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleItem}>
                <View style={styles.scheduleLeft}>
                  <View style={[styles.scheduleIcon, { backgroundColor: schedule.enabled ? theme.colors.primary + '20' : theme.colors.surface }]}>
                    <MaterialCommunityIcons 
                      name={getIconName(schedule.icon)} 
                      size={24} 
                      color={schedule.enabled ? theme.colors.primary : theme.colors.textMuted} 
                    />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <Text style={[styles.scheduleName, { color: schedule.enabled ? theme.colors.text : theme.colors.textMuted }]}>
                      {schedule.name}
                    </Text>
                    <View style={styles.scheduleTimeRow}>
                      <MaterialCommunityIcons name="clock-start" size={16} color={theme.colors.primary} />
                      <Text style={styles.scheduleTime}>{schedule.time}</Text>
                      <MaterialCommunityIcons name="clock-end" size={16} color={theme.colors.primary} />
                      <Text style={styles.scheduleTime}>{schedule.endTime}</Text>
                    </View>
                    <View style={styles.scheduleDetails}>
                      <Text style={styles.scheduleTemp}>{schedule.temperature}°C</Text>
                      {/* Removed maintainTag */}
                    </View>
                  </View>
                </View>
                <View style={styles.scheduleActions}>
                  <Pressable 
                    style={styles.actionButton}
                    onPress={() => handleToggleSchedule(schedule.id)}
                  >
                    <MaterialCommunityIcons 
                      name={schedule.enabled ? 'pause' : 'play'} 
                      size={20} 
                      color={schedule.enabled ? theme.colors.warning : theme.colors.success} 
                    />
                  </Pressable>
                  <Pressable 
                    style={styles.actionButton}
                    onPress={() => handleDeleteSchedule(schedule.id)}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={theme.colors.error} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </DarkCard>

        {/* Create Schedule Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Create New Schedule"
            onPress={handleCreateNewSchedule}
            colors={gradients.primary}
            size="large"
          />
        </View>
      </ScrollView>

      {/* Custom Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <DarkCard style={styles.modalCard}>
            {renderModalContent()}
            
            <View style={styles.modalActions}>
              <GradientButton
                title={modalStep === 1 ? "Cancel" : "Back"}
                onPress={handleModalBack}
                colors={[theme.colors.surface, theme.colors.surface]}
                size="medium"
                textStyle={{ color: theme.colors.textSecondary }}
                style={{ flex: 1, marginRight: theme.spacing.sm }}
              />
              <GradientButton
                title={modalStep === 2 ? "Create Schedule" : "Next"}
                onPress={handleModalNext}
                colors={gradients.primary}
                size="medium"
                style={{ flex: 1, marginLeft: theme.spacing.sm }}
              />
            </View>
          </DarkCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SchedulingScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },

  manualCheckContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  maintainTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  scheduleTemp: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  maintainTempContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  maintainTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  maintainTempText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  maintainTempDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  durationValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  durationSlider: {
    height: 80,
  },
  durationSliderContent: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  durationItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    minWidth: 40,
  },
  durationItemSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
  },
  durationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  durationDotSelected: {
    backgroundColor: theme.colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  durationTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // Extra padding to clear the navbar
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  textInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  unitText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  timeDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  timeDisplay: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  timePickerContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  picker: {
    height: 180,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  pickerItemSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  pickerTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  temperatureContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  temperatureDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  temperatureValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  temperatureSlider: {
    height: 80,
  },
  temperatureSliderContent: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  temperatureItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    minWidth: 40,
  },
  temperatureItemSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
  },
  temperatureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  temperatureDotSelected: {
    backgroundColor: theme.colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  temperatureText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  temperatureTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
