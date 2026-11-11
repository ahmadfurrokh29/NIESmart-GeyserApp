import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/theme';
import { backgroundScheduleService } from '../services/backgroundScheduleService';
import { scheduleService } from '../services/scheduleService';
import { CustomAlert, showError, showSuccess } from './CustomAlert';

export const BackgroundScheduleTest: React.FC = () => {
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<any>({});
  const [executionLog, setExecutionLog] = useState<any[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<any>(null);

  useEffect(() => {
    loadData();
    // Refresh data every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [notifications, status, logs, lastCheck] = await Promise.all([
        backgroundScheduleService.getScheduledNotifications(),
        backgroundScheduleService.getServiceStatus(),
        backgroundScheduleService.getExecutionLog(),
        backgroundScheduleService.getLastCheckTime()
      ]);
      
      setScheduledNotifications(notifications);
      setServiceStatus(status);
      setExecutionLog(logs);
      setLastCheckTime(lastCheck);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const initializeBackgroundService = async () => {
    try {
      await backgroundScheduleService.initialize();
      setIsInitialized(true);
      setAlertConfig(showSuccess('Success', 'Service started!'));
      loadData();
    } catch (error) {
      console.error('Error initializing background service:', error);
      setAlertConfig(showError('Error', 'Service failed'));
    }
  };

  const testScheduleNotification = async () => {
    try {
      // Create a test schedule for 1 minute from now
      const now = new Date();
      const testTime = new Date(now.getTime() + 60000); // 1 minute from now
      const hour = testTime.getHours();
      const minute = testTime.getMinutes();
      const period = hour >= 12 ? 'PM' : 'AM';
      const timeString = `${(hour % 12 || 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
      
      const testSchedule = {
        id: Date.now(),
        name: 'Test Schedule',
        time: timeString,
        endTime: new Date(testTime.getTime() + 300000).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
        temperature: 45,
        duration: 5,
        enabled: true,
        icon: 'thermometer'
      };

      // Save the test schedule
      const existingSchedules = await scheduleService.getSchedules();
      await scheduleService.saveSchedules([...existingSchedules, testSchedule]);
      
      setAlertConfig(showSuccess('Success', 'Test schedule created!'));
      loadData();
    } catch (error) {
      console.error('Error creating test schedule:', error);
      setAlertConfig(showError('Error', 'Creation failed'));
    }
  };

  const cancelAllSchedules = async () => {
    try {
      await backgroundScheduleService.cancelAllSchedules();
      setAlertConfig(showSuccess('Success', 'Schedules cancelled'));
      loadData();
    } catch (error) {
      console.error('Error cancelling schedules:', error);
      setAlertConfig(showError('Error', 'Cancellation failed'));
    }
  };

  const forceCheckSchedules = async () => {
    try {
      await scheduleService.forceCheckSchedules();
      setAlertConfig(showSuccess('Success', 'Check complete'));
      loadData();
    } catch (error) {
      console.error('Error checking schedules:', error);
      setAlertConfig(showError('Error', 'Check failed'));
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString();
    } catch {
      return timeString;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Background Schedule Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Service Status: {serviceStatus.isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
        </Text>
        <Text style={styles.statusText}>
          Schedule Checking: {serviceStatus.isChecking ? '✅ Active' : '❌ Inactive'}
        </Text>
        {lastCheckTime && (
          <Text style={styles.statusText}>
            Last Check: {formatTime(lastCheckTime)}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={initializeBackgroundService}
        >
          <Text style={styles.buttonText}>Initialize Background Service</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={testScheduleNotification}
        >
          <Text style={styles.buttonText}>Create Test Schedule (1 min)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={forceCheckSchedules}
        >
          <Text style={styles.buttonText}>Force Check Schedules</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={cancelAllSchedules}
        >
          <Text style={styles.buttonText}>Cancel All Schedules</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notificationsContainer}>
        <Text style={styles.sectionTitle}>Scheduled Schedules ({scheduledNotifications.length})</Text>
        {scheduledNotifications.map((notification, index) => (
          <View key={index} style={styles.notificationItem}>
            <Text style={styles.notificationText}>
              {notification.content.title}: {notification.content.body}
            </Text>
            <Text style={styles.notificationTime}>
              Time: {notification.trigger.time}
            </Text>
          </View>
        ))}
        {scheduledNotifications.length === 0 && (
          <Text style={styles.noNotifications}>No scheduled schedules</Text>
        )}
      </View>

      <View style={styles.executionContainer}>
        <Text style={styles.sectionTitle}>Recent Executions ({executionLog.length})</Text>
        {executionLog.slice(0, 5).map((log, index) => (
          <View key={index} style={styles.executionItem}>
            <Text style={styles.executionText}>
              {log.action}: {log.scheduleName}
            </Text>
            <Text style={styles.executionTime}>
              {formatTime(log.executionTime)}
            </Text>
          </View>
        ))}
        {executionLog.length === 0 && (
          <Text style={styles.noNotifications}>No executions yet</Text>
        )}

        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig?.visible || false}
          title={alertConfig?.title || ''}
          message={alertConfig?.message || ''}
          type={alertConfig?.type || 'info'}
          onConfirm={() => setAlertConfig(null)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  statusContainer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  buttonContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  notificationsContainer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  executionContainer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  notificationItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  executionItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  notificationText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  executionText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  executionTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  noNotifications: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
