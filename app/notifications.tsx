import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../components/DarkCard';
import { theme } from '../constants/theme';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
}

const NotificationsScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Geyser Temperature Alert',
      message: 'Main Bathroom Geyser has reached optimal temperature (45°C)',
      time: '2 minutes ago',
      type: 'success',
      read: false,
    },
    {
      id: '2',
      title: 'Energy Efficiency Update',
      message: 'Your energy usage is 15% lower than yesterday. Great job!',
      time: '1 hour ago',
      type: 'info',
      read: false,
    },
    {
      id: '3',
      title: 'High Temperature Warning',
      message: 'Kitchen Geyser temperature exceeded 70°C. Please check.',
      time: '3 hours ago',
      type: 'warning',
      read: true,
    },
    {
      id: '4',
      title: 'Geyser Added Successfully',
      message: 'Geyser 2 has been added to your system and is now online.',
      time: '1 day ago',
      type: 'success',
      read: true,
    },
    {
      id: '5',
      title: 'Maintenance Reminder',
      message: 'Schedule maintenance for your geyser system next week.',
      time: '2 days ago',
      type: 'info',
      read: true,
    },
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'alert';
      case 'error': return 'alert-circle';
      default: return 'information';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return theme.colors.success;
      case 'warning': return theme.colors.warning;
      case 'error': return theme.colors.error;
      default: return theme.colors.primary;
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All',
      'Clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => setNotifications([])
        },
      ]
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
            <View>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={styles.unreadCount}>{unreadCount} unread</Text>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <Pressable style={styles.actionButton} onPress={handleMarkAllAsRead}>
                <Text style={styles.actionText}>Mark All Read</Text>
              </Pressable>
            )}
            <Pressable style={styles.actionButton} onPress={handleClearAll}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
            </Pressable>
          </View>
        </View>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <DarkCard style={styles.emptyCard}>
            <MaterialCommunityIcons name="bell-off" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              You're all caught up! New notifications will appear here.
            </Text>
          </DarkCard>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <Pressable
                key={notification.id}
                onPress={() => handleMarkAsRead(notification.id)}
              >
                <DarkCard style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard
                ].filter(Boolean) as any}>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationLeft}>
                      <View style={[
                        styles.notificationIcon,
                        { backgroundColor: getNotificationColor(notification.type) + '20' }
                      ]}>
                        <MaterialCommunityIcons 
                          name={getNotificationIcon(notification.type)} 
                          size={20} 
                          color={getNotificationColor(notification.type)} 
                        />
                      </View>
                      <View style={styles.notificationText}>
                        <Text style={[
                          styles.notificationTitle,
                          !notification.read && styles.unreadTitle
                        ]}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationMessage}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {notification.time}
                        </Text>
                      </View>
                    </View>
                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                </DarkCard>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
  unreadCount: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  actionText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  emptyCard: {
    margin: theme.spacing.lg,
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  notificationCard: {
    marginBottom: theme.spacing.md,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
});

export default NotificationsScreen;