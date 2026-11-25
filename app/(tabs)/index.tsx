import { useAuth } from "@/contexts/AuthContext";
import { isOfflineError, useGeyser } from "@/contexts/GeyserContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircularProgress } from '../../components/CircularProgress';
import { CustomAlert, showError } from '../../components/CustomAlert';
import { DarkCard } from '../../components/DarkCard';
import { MetricCard } from '../../components/MetricCard';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { getIconName } from '../../constants/iconMappings';
import { theme } from '../../constants/theme';
import { scheduleService } from '../../services/scheduleService';
import { usageService } from '../../services/usageService';

// Quick Actions List
const quickActions = [
  { title: "Set Temperature", icon: "thermometer", color: theme.colors.primary },
  { title: "Select Mode", icon: "tune", color: theme.colors.secondary },
  { title: "Settings", icon: "cog", color: theme.colors.accent },
  { title: "Scheduling", icon: "calendar-clock", color: theme.colors.accentPurple },
] as const;

const screenWidth = Dimensions.get('window').width;

// Image chooser based on temperature
function getTemperatureImage(temp: number) {
  if (temp >= 60) {
    return require("../../assets/images/temp-hot.jpeg");
  } else if (temp >= 30) {
    return require("../../assets/images/temp-warm.jpeg");
  } else {
    return require("../../assets/images/temp-cold.jpeg");
  }
}

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();
  const { device, isOnline, updateDeviceSettings, updateGeyserOnOff, claimDevice } = useGeyser();
  const [energyUsage, setEnergyUsage] = useState(0); // kWh today - will be calculated
  const [geyserUsageTime, setGeyserUsageTime] = useState(0); // Hours today - will be calculated
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeSchedulesCount, setActiveSchedulesCount] = useState(0);
  const [alertConfig, setAlertConfig] = useState<any>(null);

  // Helper function to normalize mode case - now accepts both formats
  const normalizeMode = (mode: string): 'electric' | 'gas' | 'hybrid' => {
    if (!mode) return 'electric';
    
    // Handle both capitalized and lowercase formats
    const modeLower = mode.toLowerCase();
    
    // Check lowercase first
    if (modeLower === 'electric' || modeLower === 'gas' || modeLower === 'hybrid') {
      return modeLower;
    }
    
    // Check exact matches for any case variations
    if (mode === 'Electric' || mode === 'ELECTRIC' || mode === 'electric') return 'electric';
    if (mode === 'Gas' || mode === 'GAS' || mode === 'gas') return 'gas';
    if (mode === 'Hybrid' || mode === 'HYBRID' || mode === 'hybrid') return 'hybrid';
    
    // Default fallback
    console.warn('Index - Unknown mode format:', mode, 'falling back to electric');
    return 'electric';
  };

  // Get real device data from Firebase
  const isGeyserOn = device?.isOn ?? false;
  // Reported by the hardware: is the geyser really heating right now?
  const isHeatingNow = device?.Geyser_state === true;
  const currentMode = normalizeMode(device?.mode ?? '');
  const temperature = device ? parseInt(device.current_Temp) : 25;
  const targetTemperature = device?.target_Temp ?? 40;
  const deviceMode = device?.mode ? normalizeMode(device.mode) : 'electric';

  // Debug device mode (can be removed after testing)
  if (device) {
    console.log('Index - Device mode:', deviceMode, 'from database mode:', device.mode);
  }

  // Calculate efficiency percentage based on temperature and usage
  const efficiency = Math.round((temperature / 100) * 100);
  
  // Dynamic color based on temperature
  const getTemperatureColor = (temp: number) => {
    if (temp <= 30) return '#3B82F6'; // Blue for cold
    if (temp <= 45) return '#10B981'; // Green for warm
    if (temp <= 60) return '#F59E0B'; // Orange for hot
    return '#EF4444'; // Red for very hot
  };
  
  // Progress segments for circular chart with dynamic color
  const progressSegments = [
    { value: efficiency, color: getTemperatureColor(temperature), label: 'Temperature' },
    { value: 100 - efficiency, color: theme.colors.surface, label: 'Remaining' },
  ];

  // Function to get time ago string
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  // Update last updated time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date(Date.now() - Math.random() * 300000)); // Random time within last 5 minutes
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Load usage tracking data
  useEffect(() => {
    const loadUsageData = async () => {
      try {
        const usage = await usageService.getUsageTracking();
        setGeyserUsageTime(usage.totalTime);
      } catch (error) {
        console.error('Error loading usage data:', error);
        setGeyserUsageTime(0);
      }
    };

    loadUsageData();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadUsageData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate real-time usage data
  useEffect(() => {
    const calculateUsageData = async () => {
      if (!device) return;
      
      // Update usage tracking when geyser is on
      if (isGeyserOn) {
        try {
          await usageService.updateUsageTracking(0.083); // Add 5 minutes

          // Refresh usage display
          const usage = await usageService.getUsageTracking();
          setGeyserUsageTime(usage.totalTime);
        } catch (error) {
          console.error('Error updating usage tracking:', error);
        }
      }
    };

    // Calculate immediately
    calculateUsageData();
    
    // Update every 5 minutes
    const interval = setInterval(calculateUsageData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [device, isGeyserOn]);

  // Active schedules count, live from Firebase (via scheduleService)
  useEffect(() => {
    return scheduleService.subscribe((schedules) => {
      setActiveSchedulesCount(schedules.filter((s) => s.enabled).length);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../assets/images/nie-monogram.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">Smart Geyser</Text>
              <Text style={styles.subtitle}>Control Panel</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable 
              style={styles.notificationButton}
              onPress={() => router.push("/notifications")}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => router.push("/settings/profile")}>
              <ProfileAvatar name={user?.displayName || "User"} size={40} showBorder={true} />
            </Pressable>
          </View>
        </View>

        {/* Status Overview Cards */}
        <View style={styles.metricsRow}>
          <MetricCard
            title="Today's Usage"
            value={`${geyserUsageTime < 1 ? Math.round(geyserUsageTime * 60) + 'm' : Math.round(geyserUsageTime) + 'h'}`}
            subtitle="Geyser active time"
            color={theme.colors.secondary}
          />
          <MetricCard
            title="Active Schedules"
            value={activeSchedulesCount.toString()}
            subtitle="Running today"
            color={theme.colors.accent}
          />
        </View>

        {/* Main Geyser Status Card */}
        <View style={styles.mainCard}>
          <ImageBackground
            source={getTemperatureImage(temperature)}
            resizeMode="cover"
            imageStyle={styles.backgroundImage}
            style={styles.statusBackground}
          >
            <View style={styles.statusOverlay}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>Geyser Status</Text>
                {/* Offline: no icons at all, since the geyser data may be out of date. */}
                {isOnline && (
                  <View style={styles.statusIcons}>
                    {/* Mode icon(s): only while the hardware says the geyser is really heating. */}
                    {isHeatingNow && (currentMode === 'gas' || currentMode === 'hybrid') && (
                      <MaterialCommunityIcons name="fire" size={20} color={theme.colors.accent} accessibilityLabel="Heating with gas" />
                    )}
                    {isHeatingNow && (currentMode === 'electric' || currentMode === 'hybrid') && (
                      <MaterialCommunityIcons name="flash" size={20} color={theme.colors.warning} accessibilityLabel="Heating with electricity" />
                    )}
                    {/* Wi-Fi: this phone is connected to the internet. */}
                    <MaterialCommunityIcons name="wifi" size={20} color={theme.colors.success} accessibilityLabel="Phone is online" />
                  </View>
                )}
              </View>

              <View style={styles.temperatureDisplay}>
                <CircularProgress
                  segments={progressSegments}
                  size={140}
                  strokeWidth={8}
                  centerContent={
                    <View style={styles.temperatureCenter}>
                      <Text style={styles.temperatureValue}>{temperature}</Text>
                      <Text style={styles.temperatureUnit}>°C</Text>
                    </View>
                  }
                />
              </View>

              <View style={styles.controlsContainer}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>
                    Geyser {isGeyserOn ? "ON" : "OFF"}
                  </Text>
                  <Switch
                    value={isGeyserOn}
                    onValueChange={async (value) => {
                      try {
                        await updateGeyserOnOff(value);
                      } catch (error) {
                        if (isOfflineError(error)) return; // the "No internet" popup is already shown
                        console.error('Error updating geyser state:', error);
                        setAlertConfig(showError('Error', 'Update failed'));
                      }
                    }}
                    thumbColor={isGeyserOn ? theme.colors.primary : theme.colors.textMuted}
                    trackColor={{ 
                      true: theme.colors.primary + '40', 
                      false: theme.colors.surface 
                    }}
                  />
                </View>
              </View>

              <Text style={styles.lastUpdated}>Last Updated: {getTimeAgo(lastUpdated)}</Text>

              {temperature > 70 && (
                <View style={styles.alertContainer}>
                  <MaterialCommunityIcons name="alert" size={16} color={theme.colors.warning} />
                  <Text style={styles.alertText}>
                    High temperature detected!
                  </Text>
                </View>
              )}
            </View>
          </ImageBackground>
        </View>





        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((item, index) => (
            <Pressable
              key={index}
              style={styles.quickActionCard}
              onPress={() => {
                if (item.title === "Settings") {
                  router.push("/(tabs)/settings");
                } else if (item.title === "Select Mode") {
                  router.push("/(tabs)/mode");
                } else {
                  const id = item.title.toLowerCase().replace(/ /g, "_");
                  router.push(`/quickActions/${id}`);
                }
              }}
            >
              <DarkCard style={styles.quickActionContent}>
                <MaterialCommunityIcons
                  name={getIconName(item.icon)}
                  size={28}
                  color={item.color || theme.colors.primary}
                />
                <Text style={styles.quickActionText}>{item.title}</Text>
              </DarkCard>
            </Pressable>
          ))}
        </View>

        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig?.visible || false}
          title={alertConfig?.title || ''}
          message={alertConfig?.message || ''}
          type={alertConfig?.type || 'info'}
          onConfirm={() => setAlertConfig(null)}
        />

      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexShrink: 0,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minWidth: 0,
  },
  logo: {
    width: 40,
    height: 40,
  },
  notificationButton: {
    padding: theme.spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  mainCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
  },
  statusBackground: {
    minHeight: 280,
    justifyContent: 'space-between',
  },
  backgroundImage: {
    borderRadius: theme.borderRadius.lg,
  },
  statusOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  temperatureDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.lg,
  },
  temperatureCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  temperatureValue: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.text,
  },
  temperatureUnit: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: -4,
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  lastUpdated: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 146, 60, 0.9)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  alertText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  efficiencyCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  efficiencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  efficiencyCenter: {
    alignItems: 'center',
  },
  efficiencyValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  efficiencyLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  efficiencyStats: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    paddingBottom: 120, // Extra padding to clear the navbar
  },
  quickActionCard: {
    width: (screenWidth - theme.spacing.lg * 2 - theme.spacing.md) / 2,
  },
  quickActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    minHeight: 80,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  geyserManagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  managementCard: {
    width: (screenWidth - theme.spacing.lg * 2 - theme.spacing.md) / 2,
  },
  managementContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    minHeight: 120,
  },
  managementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  managementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  managementDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  actionButtons: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // Extra padding to clear the navbar
  },
});