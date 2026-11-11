import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert, showError } from '../../components/CustomAlert';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { gradients, theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

const SignUpScreen = () => {
  const router = useRouter();
  const { signup } = useAuth();
  const params = useLocalSearchParams();
  const deviceId = params.deviceId as string;
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  // Debug state changes
  console.log('Signup screen - formData:', formData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      setAlertConfig(showError('Error', 'Enter your name'));
      return false;
    }
    if (!formData.email.trim()) {
      setAlertConfig(showError('Error', 'Enter your email'));
      return false;
    }
    if (!formData.email.includes('@')) {
      setAlertConfig(showError('Error', 'Invalid email'));
      return false;
    }
    if (!formData.phone.trim()) {
      setAlertConfig(showError('Error', 'Enter your phone'));
      return false;
    }
    if (formData.phone.trim().length < 10) {
      setAlertConfig(showError('Error', 'Invalid phone'));
      return false;
    }
    if (formData.password.length < 6) {
      setAlertConfig(showError('Error', 'Password too short'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setAlertConfig(showError('Error', 'Passwords don\'t match'));
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('SignUpScreen - Starting signup process with deviceId:', deviceId);
      // Store device ID in AsyncStorage BEFORE signup to avoid race with auth routing
      let didPreStore = false;
      if (deviceId) {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem('pendingDeviceId', deviceId);
        await AsyncStorage.default.setItem('pendingDeviceName', `${formData.displayName.trim()}'s Geyser`);
        didPreStore = true;
        console.log('SignUpScreen - Pre-stored pending device claim:', deviceId);
      }

      // Create user account
      await signup(
        formData.email.trim(),
        formData.password,
        formData.displayName.trim(),
        formData.phone.trim()
      );

      console.log('SignUpScreen - Signup completed, redirecting to main app');
      // Redirect to main index - AppRouter will handle the rest
      router.replace('/');
    } catch (error: any) {
      console.error('SignUpScreen - Signup failed:', error);
      // Cleanup pending claim if we pre-stored and signup failed
      if (deviceId) {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.removeItem('pendingDeviceId');
        await AsyncStorage.default.removeItem('pendingDeviceName');
        console.log('SignUpScreen - Cleared pending device claim due to signup failure');
      }
      setAlertConfig(showError('Error', 'Sign up failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.keyboardView}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="water-boiler" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.tagline}>
              {deviceId ? `Claiming Device: ${deviceId}` : 'Join Smart Geyser today'}
            </Text>
          </View>

          {/* Sign Up Form */}
          <DarkCard style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer} pointerEvents="box-none">
                <MaterialCommunityIcons name="account" size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.textMuted}
                  value={formData.displayName}
                  onChangeText={(value) => {
                    console.log('Display name input changed:', value);
                    handleInputChange('displayName', value);
                  }}
                  autoCapitalize="words"
                  editable={true}
                  selectTextOnFocus={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer} pointerEvents="box-none">
                <MaterialCommunityIcons name="email" size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textMuted}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                  selectTextOnFocus={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer} pointerEvents="box-none">
                <MaterialCommunityIcons name="phone" size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.colors.textMuted}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                  selectTextOnFocus={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer} pointerEvents="box-none">
                <MaterialCommunityIcons name="lock" size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={theme.colors.textMuted}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  editable={true}
                  selectTextOnFocus={false}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer} pointerEvents="box-none">
                <MaterialCommunityIcons name="lock-check" size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.colors.textMuted}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  editable={true}
                  selectTextOnFocus={false}
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>



            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementItem}>
                <MaterialCommunityIcons
                  name={formData.password.length >= 6 ? "check-circle" : "circle-outline"}
                  size={16}
                  color={formData.password.length >= 6 ? theme.colors.success : theme.colors.textMuted}
                />
                <Text style={[
                  styles.requirementText,
                  { color: formData.password.length >= 6 ? theme.colors.success : theme.colors.textMuted }
                ]}>
                  At least 6 characters
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <MaterialCommunityIcons
                  name={formData.password === formData.confirmPassword && formData.password.length > 0 ? "check-circle" : "circle-outline"}
                  size={16}
                  color={formData.password === formData.confirmPassword && formData.password.length > 0 ? theme.colors.success : theme.colors.textMuted}
                />
                <Text style={[
                  styles.requirementText,
                  { color: formData.password === formData.confirmPassword && formData.password.length > 0 ? theme.colors.success : theme.colors.textMuted }
                ]}>
                  Passwords match
                </Text>
              </View>
            </View>

            <GradientButton
              title={loading ? "Creating Account..." : "Create Account"}
              onPress={handleSignUp}
              disabled={loading}
              colors={gradients.primary}
              size="large"
            />
          </DarkCard>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable onPress={handleLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig?.visible || false}
          title={alertConfig?.title || ''}
          message={alertConfig?.message || ''}
          type={alertConfig?.type || 'info'}
          onConfirm={() => setAlertConfig(null)}
        />
      </View>
    </SafeAreaView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
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
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 20,
  },
  requirementsContainer: {
    marginBottom: theme.spacing.lg,
  },
  requirementsTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  requirementText: {
    fontSize: 12,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
  },
  loginText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },

});