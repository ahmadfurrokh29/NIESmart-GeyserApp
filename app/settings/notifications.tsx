import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getIconName } from '../../constants/iconMappings';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { theme } from '../../constants/theme';

const NotificationsScreen = () => {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [temperatureAlerts, setTemperatureAlerts] = useState(true);
  const [maintenanceReminders, setMaintenanceReminders] = useState(true);
  const [energyReports, setEnergyReports] = useState(false);
  const [systemUpdates, setSystemUpdates] = useState(true);

  const renderNotificationItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: string
  ) => (
    <View style={styles.notificationItem}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <MaterialCommunityIcons name={getIconName(icon)} size={20} color={theme.colors.primary} />
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
            <Text style={styles.title}>Notifications</Text>
          </View>
          <MaterialCommunityIcons name="bell-ring" size={24} color={theme.colors.primary} />
        </View>

        {/* General Notifications */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>General</Text>
          {renderNotificationItem(
            'Push Notifications',
            'Receive alerts on your device',
            pushEnabled,
            setPushEnabled,
            'cellphone'
          )}
          {renderNotificationItem(
            'Email Notifications',
            'Get updates via email',
            emailEnabled,
            setEmailEnabled,
            'email'
          )}
        </DarkCard>

        {/* Geyser Alerts */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Geyser Alerts</Text>
          {renderNotificationItem(
            'Temperature Alerts',
            'High/low temperature warnings',
            temperatureAlerts,
            setTemperatureAlerts,
            'thermometer-alert'
          )}
          {renderNotificationItem(
            'Maintenance Reminders',
            'Service and maintenance alerts',
            maintenanceReminders,
            setMaintenanceReminders,
            'wrench'
          )}
        </DarkCard>

        {/* Reports */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Reports & Updates</Text>
          {renderNotificationItem(
            'Energy Reports',
            'Weekly energy usage summaries',
            energyReports,
            setEnergyReports,
            'chart-line'
          )}
          {renderNotificationItem(
            'System Updates',
            'App and firmware updates',
            systemUpdates,
            setSystemUpdates,
            'update'
          )}
        </DarkCard>

        {/* Notification Schedule */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <Pressable style={styles.scheduleItem}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent + '20' }]}>
                <MaterialCommunityIcons name="clock" size={20} color={theme.colors.accent} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Quiet Hours</Text>
                <Text style={styles.itemDescription}>10:00 PM - 7:00 AM</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
          </Pressable>
        </DarkCard>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

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
  notificationItem: {
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
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
});
