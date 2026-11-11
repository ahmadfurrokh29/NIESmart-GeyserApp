import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { gradients, theme } from '../../constants/theme';

const ChangePasswordScreen = () => {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: 'weak', color: theme.colors.error };
    if (password.length < 8) return { strength: 'fair', color: theme.colors.warning };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 'strong', color: theme.colors.success };
    }
    return { strength: 'good', color: theme.colors.primary };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields required');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords don\'t match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password too short');
      return;
    }
    
            Alert.alert('Success', 'Password changed!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    showPassword: boolean,
    toggleShow: () => void,
    showStrength = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="lock" size={20} color={theme.colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={!showPassword}
          style={styles.input}
        />
        <Pressable onPress={toggleShow} style={styles.eyeButton}>
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>
      {showStrength && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color }]} />
          <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
            Password strength: {passwordStrength.strength}
          </Text>
        </View>
      )}
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
            <Text style={styles.title}>Security</Text>
          </View>
          <MaterialCommunityIcons name="shield-lock" size={24} color={theme.colors.primary} />
        </View>

        {/* Password Change Form */}
        <DarkCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Text style={styles.sectionSubtitle}>
            Keep your account secure by using a strong password
          </Text>

          {renderPasswordInput(
            'Current Password',
            oldPassword,
            setOldPassword,
            'Enter current password',
            showOld,
            () => setShowOld(!showOld)
          )}

          {renderPasswordInput(
            'New Password',
            newPassword,
            setNewPassword,
            'Enter new password',
            showNew,
            () => setShowNew(!showNew),
            true
          )}

          {renderPasswordInput(
            'Confirm New Password',
            confirmPassword,
            setConfirmPassword,
            'Confirm new password',
            showConfirm,
            () => setShowConfirm(!showConfirm)
          )}
        </DarkCard>



        {/* Security Tips */}
        <DarkCard style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>Security Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="lightbulb" size={16} color={theme.colors.warning} />
              <Text style={styles.tipText}>Use a unique password for this account</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="shield-check" size={16} color={theme.colors.success} />
              <Text style={styles.tipText}>Enable two-factor authentication when available</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="refresh" size={16} color={theme.colors.primary} />
              <Text style={styles.tipText}>Change your password regularly</Text>
            </View>
          </View>
        </DarkCard>

        {/* Update Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Update Password"
            onPress={handleChangePassword}
            colors={gradients.primary}
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

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
  formCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  eyeButton: {
    padding: theme.spacing.xs,
  },
  strengthContainer: {
    marginTop: theme.spacing.sm,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },

  tipsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tipsList: {
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
