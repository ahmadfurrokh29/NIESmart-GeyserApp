import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert, showConfirm, showError } from '../../components/CustomAlert';
import { DarkCard } from '../../components/DarkCard';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

const ACCOUNT_SETTINGS = [
  { key: 'profile', label: 'Profile Settings', icon: 'account', desc: 'Manage your account' },
  { key: 'change_password', label: 'Security', icon: 'shield-lock', desc: 'Password & security' },
  { key: 'notifications', label: 'Notifications', icon: 'bell-ring', desc: 'Alert preferences' },
] as const;



const SUPPORT_SETTINGS = [
  { key: 'about', label: 'About App', icon: 'information', desc: 'Version & info' },
  { key: 'support', label: 'Help & Support', icon: 'help-circle', desc: 'Get assistance' },
  { key: 'feedback', label: 'Feedback', icon: 'message-star', desc: 'Share your thoughts' },
] as const;

const SettingsScreen = () => {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [energySaver, setEnergySaver] = useState(true);
  const [alertConfig, setAlertConfig] = useState<any>(null);

  const handlePress = (key: string) => {
    if (key === 'logout') {
      setAlertConfig(showConfirm('Logout', 'Logout?', async () => {
        try {
          await logout();
          // Ensure we return to auth screens explicitly
          router.replace('/auth/login');
        } catch (error: any) {
          setAlertConfig(showError('Error', 'Logout failed'));
        }
      }));
    } else {
      router.push(`/settings/${key}` as any);
    }
  };

  const renderSettingItem = (item: any, showToggle = false, toggleValue?: boolean, onToggle?: (value: boolean) => void) => (
    <Pressable 
      key={item.key}
      style={styles.settingItem} 
      onPress={() => showToggle ? onToggle?.(!toggleValue) : handlePress(item.key)}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          <Text style={styles.settingDesc}>{item.desc}</Text>
        </View>
      </View>
      
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          thumbColor={toggleValue ? theme.colors.primary : theme.colors.textMuted}
          trackColor={{ 
            true: theme.colors.primary + '40', 
            false: theme.colors.surface 
          }}
        />
      ) : (
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={20} 
          color={theme.colors.textMuted} 
        />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <MaterialCommunityIcons name="cog" size={24} color={theme.colors.primary} />
        </View>

        {/* Profile Card */}
        <DarkCard style={styles.profileCard}>
          <View style={styles.profileContent}>
            <ProfileAvatar name={user?.displayName || 'User'} size={60} showBorder={true} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
              <Text style={styles.profilePhone}>{user?.phone || 'No phone number'}</Text>
              <Text style={styles.profileStatus}>Premium Member</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => handlePress('profile')}>
              <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.primary} />
            </Pressable>
          </View>
        </DarkCard>





        {/* Account Settings */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          {ACCOUNT_SETTINGS.map(item => renderSettingItem(item))}
        </DarkCard>



        {/* Support */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support</Text>
          {SUPPORT_SETTINGS.map(item => renderSettingItem(item))}
        </DarkCard>

        {/* Logout */}
        <DarkCard style={styles.sectionCard}>
          <Pressable style={styles.logoutButton} onPress={() => handlePress('logout')}>
            <MaterialCommunityIcons name="logout" size={20} color={theme.colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </DarkCard>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Smart Geyser v1.2.0</Text>
          <Text style={styles.versionSubtext}>Build 2024.1.15</Text>
        </View>

        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig?.visible || false}
          title={alertConfig?.title || ''}
          message={alertConfig?.message || ''}
          type={alertConfig?.type || 'info'}
          onConfirm={alertConfig?.onConfirm || (() => setAlertConfig(null))}
          onCancel={alertConfig?.onCancel || (() => setAlertConfig(null))}
          showCancel={alertConfig?.showCancel || false}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  profileCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  profileStatus: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  editButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  versionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
