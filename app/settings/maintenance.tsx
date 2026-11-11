import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { getIconName } from '../../constants/iconMappings';
import { theme } from '../../constants/theme';

const MaintenanceScreen = () => {
  const router = useRouter();
  const [autoReminders, setAutoReminders] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [performanceMonitoring, setPerformanceMonitoring] = useState(true);

  const maintenanceTasks = [
    {
      id: 1,
      title: 'Clean Heating Element',
      description: 'Remove mineral deposits',
      dueDate: '2024-02-15',
      priority: 'high',
      status: 'overdue',
      icon: 'fire',
    },
    {
      id: 2,
      title: 'Check Thermostat',
      description: 'Calibrate temperature sensor',
      dueDate: '2024-02-20',
      priority: 'medium',
      status: 'upcoming',
      icon: 'thermometer',
    },
    {
      id: 3,
      title: 'Inspect Insulation',
      description: 'Check for heat loss',
      dueDate: '2024-03-01',
      priority: 'low',
      status: 'scheduled',
      icon: 'shield',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return theme.colors.error;
      case 'upcoming': return theme.colors.warning;
      case 'scheduled': return theme.colors.success;
      default: return theme.colors.textMuted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.textMuted;
    }
  };

  const handleTaskComplete = (taskId: number) => {
    Alert.alert('Confirm', 'Mark as complete?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => console.log('Task completed:', taskId) },
    ]);
  };

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: string,
    iconColor: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={getIconName(icon)} size={20} color={iconColor} />
        </View>
        <View style={styles.itemText}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? theme.colors.primary : theme.colors.textMuted}
        trackColor={{ 
          true: theme.colors.primary + '40', 
          false: theme.colors.surface 
        }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>Maintenance</Text>
          </View>
          <MaterialCommunityIcons name="wrench" size={24} color={theme.colors.accent} />
        </View>





        {/* Maintenance Tasks */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Maintenance Tasks</Text>
          {maintenanceTasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskLeft}>
                <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                  <MaterialCommunityIcons name={getIconName(task.icon)} size={20} color={getPriorityColor(task.priority)} />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  <View style={styles.taskMeta}>
                    <Text style={styles.taskDate}>Due: {task.dueDate}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                        {task.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <Pressable 
                style={styles.completeButton}
                onPress={() => handleTaskComplete(task.id)}
              >
                <MaterialCommunityIcons name="check" size={20} color={theme.colors.success} />
              </Pressable>
            </View>
          ))}
        </DarkCard>



        {/* Maintenance Tips */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Maintenance Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="water" size={16} color={theme.colors.secondary} />
              <Text style={styles.tipText}>Drain tank monthly to remove sediment buildup</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="thermometer" size={16} color={theme.colors.warning} />
              <Text style={styles.tipText}>Check temperature settings regularly</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="eye" size={16} color={theme.colors.primary} />
              <Text style={styles.tipText}>Inspect for leaks and corrosion monthly</Text>
            </View>
          </View>
        </DarkCard>

        {/* Emergency Contact */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Emergency Service Call"
                          onPress={() => Alert.alert('Emergency', 'Calling service...')}
            colors={[theme.colors.error, theme.colors.warning]}
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MaintenanceScreen;

const styles = StyleSheet.create({
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  itemLeft: {
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
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  taskDate: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  completeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  tipsContainer: {
    gap: theme.spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // Extra padding to clear the navbar
  },
});