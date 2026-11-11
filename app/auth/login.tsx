import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert, showError } from '../../components/CustomAlert';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { gradients, theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const params = useLocalSearchParams();
  const prefilledEmail = params.email as string;
  const deviceId = params.deviceId as string;
  const [email, setEmail] = useState(prefilledEmail || '');
  const [password, setPassword] = useState('');
  
  // Debug state changes
  console.log('Login screen - email:', email, 'password:', password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>(null);

  const handleLogin = async () => {
    if (loading) return; // Prevent multiple clicks while loading

    // Basic validation
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setAlertConfig(showError('Error', 'Fill all fields'));
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAlertConfig(showError('Error', 'Invalid email'));
      return;
    }

    // Basic password length check
    if (trimmedPassword.length < 6) {
      setAlertConfig(showError('Error', 'Password too short'));
      return;
    }

    setLoading(true);
    try {
      console.log('LoginScreen - Starting login process...');
      await login(trimmedEmail, trimmedPassword);
      
      // Store device ID in AsyncStorage if provided, so we can claim it after login
      if (deviceId) {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem('pendingDeviceId', deviceId);
        await AsyncStorage.default.setItem('pendingDeviceName', 'My Smart Geyser');
        console.log('LoginScreen - Stored pending device claim:', deviceId);
      }
      
      // No need to navigate - AppRouter will handle routing based on auth state
      console.log('LoginScreen - Login successful, AppRouter will handle navigation');
    } catch (error: any) {
      console.error('LoginScreen - Login failed:', error.message);
      setAlertConfig(showError('Error', 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/claim-device');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="water-boiler" size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.appName}>Smart Geyser</Text>
            <Text style={styles.tagline}>Intelligent Water Heating Control</Text>
          </View>

          {/* Login Form */}
          <DarkCard style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer} pointerEvents="box-none">
                <MaterialCommunityIcons name="email" size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    console.log('Email input changed:', text);
                    setEmail(text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                  selectTextOnFocus={false}
                  onFocus={() => console.log('Email input focused')}
                  onBlur={() => console.log('Email input blurred')}
                  clearButtonMode="while-editing"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer} pointerEvents="box-none">
                <MaterialCommunityIcons name="lock" size={20} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    console.log('Password input changed:', text);
                    setPassword(text);
                  }}
                  secureTextEntry={!showPassword}
                  editable={true}
                  selectTextOnFocus={false}
                  returnKeyType="done"
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

            <Pressable style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>

            <GradientButton
              title={loading ? "Signing In..." : "Sign In"}
              onPress={handleLogin}
              disabled={loading}
              colors={gradients.primary}
              size="large"
            />
          </DarkCard>

          {/* Sign Up Link */}
          <View style={styles.signupSection}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Pressable onPress={handleSignUp}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>

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

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  appName: {
    fontSize: 28,
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
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  formSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});