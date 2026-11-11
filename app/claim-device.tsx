import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert, showError, showInfo } from '../components/CustomAlert';
import { DarkCard } from '../components/DarkCard';
import { GradientButton } from '../components/GradientButton';
import { gradients, theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { geyserService } from '../services/geyserService';

const ClaimDeviceScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'unclaimed'>('input');
  const [alertConfig, setAlertConfig] = useState<any>(null);

  // If user is already authenticated, they shouldn't be on this page
  useEffect(() => {
    if (user) {
      console.log('User is authenticated, redirecting to main app');
      router.replace('/(tabs)');
    }
  }, [user, router]);

  const handleScanQR = () => {
    // TODO: Implement QR code scanning
          setAlertConfig(showInfo('Coming Soon', 'QR scanning later'));
  };

  const checkDeviceStatus = async () => {
    const trimmedDeviceId = deviceId.trim();
    if (!trimmedDeviceId) {
      setAlertConfig(showError('Error', 'Enter device ID'));
      return;
    }

    setLoading(true);
    try {
      const deviceData = await geyserService.getDeviceData(trimmedDeviceId);
      
      if (!deviceData) {
        setAlertConfig(showError('Error', 'Device not found'));
        return;
      }

      if (deviceData.userId) {
        // Device is claimed, show popup
        const userData = await geyserService.getUserData(deviceData.userId);
        if (userData) {
          setAlertConfig(showError('Error', 'Device already claimed'));
        } else {
                      setAlertConfig(showError('Error', 'Device data missing'));
        }
      } else {
        // Device is unclaimed
        setStep('unclaimed');
      }
    } catch (error: any) {
              setAlertConfig(showError('Error', 'Check failed'));
    } finally {
      setLoading(false);
    }
  };



  const handleNewUserRegistration = () => {
    // Store device ID for registration flow
    router.push({
      pathname: '/auth/signup',
      params: { deviceId: deviceId.trim() }
    });
  };

  const renderInputStep = () => (
    <>
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="water-boiler" size={64} color={theme.colors.primary} />
        </View>
        <Text style={styles.appName}>Smart Geyser</Text>
        <Text style={styles.tagline}>Claim Your Device</Text>
      </View>

      <DarkCard style={styles.formCard}>
        <Text style={styles.formTitle}>Enter Device ID</Text>
        <Text style={styles.formSubtitle}>Enter your geyser's device ID or scan the QR code</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Device ID</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="identifier" size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Enter device ID (e.g., GYS123456)"
              placeholderTextColor={theme.colors.textMuted}
              value={deviceId}
              onChangeText={setDeviceId}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        </View>

        <GradientButton
          title={loading ? "Checking..." : "Check Device"}
          onPress={checkDeviceStatus}
          disabled={loading}
          colors={gradients.primary}
          size="large"
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <GradientButton
          title="Scan QR Code"
          onPress={handleScanQR}
          colors={gradients.primary}
          size="large"
        />
      </DarkCard>
    </>
  );



  const renderUnclaimedStep = () => (
    <>
      <View style={styles.logoSection}>
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.success + '20' }]}>
          <MaterialCommunityIcons name="check-circle" size={64} color={theme.colors.success} />
        </View>
        <Text style={styles.appName}>Device Available</Text>
        <Text style={styles.tagline}>This device is ready to be claimed</Text>
      </View>

      <DarkCard style={styles.formCard}>
        <View style={styles.successInfo}>
          <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.success} />
          <Text style={styles.successText}>
            Device ID: {deviceId} is available for registration
          </Text>
        </View>

        <Text style={styles.formTitle}>Create Your Account</Text>
        <Text style={styles.formSubtitle}>Register to claim this device and start controlling your geyser</Text>

        <GradientButton
          title="Create Account"
          onPress={handleNewUserRegistration}
          colors={gradients.primary}
          size="large"
        />

        <Pressable style={styles.backButton} onPress={() => setStep('input')}>
          <Text style={styles.backButtonText}>← Back to Device ID</Text>
        </Pressable>
      </DarkCard>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {step === 'input' && renderInputStep()}
          {step === 'unclaimed' && renderUnclaimedStep()}
        </View>

        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig?.visible || false}
          title={alertConfig?.title || ''}
          message={alertConfig?.message || ''}
          type={alertConfig?.type || 'info'}
          onConfirm={() => setAlertConfig(null)}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.surface,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  claimedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  claimedText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning,
    fontWeight: '500',
  },
  successInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '500',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.lg,
    padding: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default ClaimDeviceScreen;