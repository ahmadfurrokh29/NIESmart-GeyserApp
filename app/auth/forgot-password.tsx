import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { gradients, theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Enter your email');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Invalid email');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setEmailSent(true);
    } catch (error: any) {
              Alert.alert('Error', 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Success Section */}
          <View style={styles.successSection}>
            <View style={styles.successIcon}>
              <MaterialCommunityIcons name="email-check" size={64} color={theme.colors.success} />
            </View>
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to {email}. Please check your email and follow the instructions to reset your password.
            </Text>
          </View>

          <DarkCard style={styles.actionCard}>
            <Text style={styles.actionTitle}>Didn't receive the email?</Text>
            <Text style={styles.actionSubtitle}>
              Check your spam folder or try again with a different email address.
            </Text>
            
            <View style={styles.buttonGroup}>
              <GradientButton
                title="Resend Email"
                onPress={() => setEmailSent(false)}
                colors={gradients.secondary}
                size="medium"
              />
              <GradientButton
                title="Back to Login"
                onPress={handleBackToLogin}
                colors={gradients.primary}
                size="medium"
              />
            </View>
          </DarkCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="lock-reset" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        {/* Reset Form */}
        <DarkCard style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email" size={20} color={theme.colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <GradientButton
            title={loading ? "Sending..." : "Send Reset Link"}
            onPress={handleResetPassword}
            disabled={loading}
            colors={gradients.primary}
            size="large"
          />
        </DarkCard>

        {/* Back to Login */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Remember your password? </Text>
          <Pressable onPress={handleBackToLogin}>
            <Text style={styles.loginLink}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
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
    paddingTop: theme.spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  successSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  successMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionCard: {
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  buttonGroup: {
    width: '100%',
    gap: theme.spacing.md,
  },
});