import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert, showConfirm, showError, showSuccess } from '../components/CustomAlert';
import { DarkCard } from '../components/DarkCard';
import { GradientButton } from '../components/GradientButton';
import { gradients, theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { geyserService } from '../services/geyserService';

type ScreenState = 'input' | 'role-selection' | 'error';

interface GeyserValidationResult {
  exists: boolean;
  geyserData?: any;
  error?: string;
}

const AddGeyserScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [screenState, setScreenState] = useState<ScreenState>('input');
  const [geyserID, setGeyserID] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<GeyserValidationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [role, setRole] = useState<'master' | 'slave' | null>(null);
  const [alertConfig, setAlertConfig] = useState<any>(null);

  // Validate Geyser ID against database
  const validateGeyserID = async (id: string): Promise<GeyserValidationResult> => {
    try {
      // Check if geyser exists in database
      const geyserData = await geyserService.getDeviceData(id);
      
      if (geyserData) {
        return {
          exists: true,
          geyserData
        };
      } else {
        return {
          exists: false,
          error: "Geyser ID doesn't exist"
        };
      }
    } catch (error: any) {
      console.error('Geyser validation error:', error);
      return {
        exists: false,
        error: error.message || 'Network error occurred'
      };
    }
  };

  const handleCheckGeyser = async () => {
    if (!geyserID.trim()) {
      setAlertConfig(showError('Error', 'Enter Geyser ID'));
      return;
    }

    const formattedID = geyserID.trim().toUpperCase();
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await validateGeyserID(formattedID);
      setValidationResult(result);

      if (result.exists) {
        setScreenState('role-selection');
      } else {
        setErrorMessage(result.error || "Geyser ID doesn't exist");
        setScreenState('error');
      }
    } catch (error) {
      setErrorMessage('Network error. Please check your connection and try again.');
      setScreenState('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async () => {
    if (!user || !validationResult?.geyserData) return;

    setLoading(true);
    try {
      if (role === 'master') {
        // Register as master - full control
        setAlertConfig(showConfirm('Register as Master', 'Full control over geyser?', () => {
          // Navigate to master registration flow
          setAlertConfig(showSuccess('Success', 'Master registered!', () => router.replace('/(tabs)')));
        }));
      } else {
        // Register as slave - request access from master
        setAlertConfig(showConfirm('Register as Slave', 'Request access from master?', async () => {
          try {
            // For now, just show success message
            setAlertConfig(showSuccess('Success', 'Request sent!'));
          } catch (error: any) {
            setAlertConfig(showError('Error', 'Request failed'));
          }
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setScreenState('input');
    setGeyserID('');
    setErrorMessage('');
    setValidationResult(null);
  };

  const handleBack = () => {
    if (screenState === 'input') {
      router.back();
    } else {
      setScreenState('input');
      setErrorMessage('');
      setValidationResult(null);
    }
  };

  const renderInputScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <DarkCard style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="water-boiler" size={32} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>Add Geyser</Text>
        </View>
        <Text style={styles.cardDescription}>
          Enter the Geyser ID to connect to an existing smart geyser system
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Geyser ID</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="identifier" size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="GYS-123456"
              placeholderTextColor={theme.colors.textMuted}
              value={geyserID}
              onChangeText={setGeyserID}
              autoCapitalize="characters"
              maxLength={15}
            />
          </View>
          <Text style={styles.inputHint}>
            Enter the unique ID found on your geyser device or documentation
          </Text>
        </View>

        <GradientButton
          title={loading ? "Checking..." : "Check Geyser"}
          onPress={handleCheckGeyser}
          disabled={loading || !geyserID.trim()}
          colors={gradients.primary}
          size="large"
        />
      </DarkCard>

      {/* Help Section */}
      <DarkCard style={styles.helpCard}>
        <View style={styles.helpHeader}>
          <MaterialCommunityIcons name="help-circle" size={20} color={theme.colors.accent} />
          <Text style={styles.helpTitle}>Need Help?</Text>
        </View>
        <Text style={styles.helpText}>
          • Geyser ID is usually found on a sticker on your device
        </Text>
        <Text style={styles.helpText}>
          • Format: GYS-XXXXXX (6 digits)
        </Text>
        <Text style={styles.helpText}>
          • Contact support if you can't find your ID
        </Text>
      </DarkCard>
    </ScrollView>
  );

  const renderRoleSelectionScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <DarkCard style={styles.successCard}>
        <View style={styles.successHeader}>
          <MaterialCommunityIcons name="check-circle" size={48} color={theme.colors.success} />
          <Text style={styles.successTitle}>Geyser ID Found!</Text>
          <Text style={styles.successMessage}>
            Geyser ID "{geyserID}" exists in our system. Choose your role:
          </Text>
        </View>
      </DarkCard>

      <Text style={styles.sectionTitle}>Select Your Role</Text>

      {/* Master Role */}
      <Pressable
        style={styles.roleCard}
        onPress={() => {
          setRole('master');
          handleRoleSelection();
        }}
        disabled={loading}
      >
        <DarkCard style={styles.roleContent}>
          <View style={styles.roleHeader}>
            <View style={[styles.roleIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <MaterialCommunityIcons name="crown" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>Register as Master</Text>
              <Text style={styles.roleSubtitle}>Full control of the geyser system</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
          </View>
          <View style={styles.roleFeatures}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.success} />
              <Text style={styles.featureText}>Complete geyser control</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.success} />
              <Text style={styles.featureText}>Manage slave devices</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.success} />
              <Text style={styles.featureText}>Set permissions</Text>
            </View>
          </View>
        </DarkCard>
      </Pressable>

      {/* Slave Role */}
      <Pressable
        style={styles.roleCard}
        onPress={() => {
          setRole('slave');
          handleRoleSelection();
        }}
        disabled={loading}
      >
        <DarkCard style={styles.roleContent}>
          <View style={styles.roleHeader}>
            <View style={[styles.roleIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
              <MaterialCommunityIcons name="account-group" size={32} color={theme.colors.secondary} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>Register as Slave</Text>
              <Text style={styles.roleSubtitle}>Limited access, controlled by master</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
          </View>
          <View style={styles.roleFeatures}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.success} />
              <Text style={styles.featureText}>Basic geyser control</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.success} />
              <Text style={styles.featureText}>Permission-based access</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.success} />
              <Text style={styles.featureText}>No account required</Text>
            </View>
          </View>
        </DarkCard>
      </Pressable>
    </ScrollView>
  );

  const renderErrorScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <DarkCard style={styles.errorCard}>
        <View style={styles.errorHeader}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Geyser ID Not Found</Text>
          <Text style={styles.errorMessage}>
            {errorMessage || "The Geyser ID you entered doesn't exist in our system."}
          </Text>
        </View>
      </DarkCard>

      <DarkCard style={styles.suggestionCard}>
        <Text style={styles.suggestionTitle}>Please check:</Text>
        <View style={styles.suggestionList}>
          <Text style={styles.suggestionText}>• Verify the ID is entered correctly</Text>
          <Text style={styles.suggestionText}>• Ensure all characters are included</Text>
          <Text style={styles.suggestionText}>• Check if the geyser is registered</Text>
          <Text style={styles.suggestionText}>• Contact the geyser owner for the correct ID</Text>
        </View>
      </DarkCard>

      <View style={styles.errorActions}>
        <GradientButton
          title="Try Again"
          onPress={handleTryAgain}
          colors={gradients.primary}
          size="large"
        />
        
        <Pressable style={styles.supportButton}>
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>
          {screenState === 'input' ? 'Add Geyser' : 
           screenState === 'role-selection' ? 'Select Role' : 
           'Geyser Not Found'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {screenState === 'input' && renderInputScreen()}
      {screenState === 'role-selection' && renderRoleSelectionScreen()}
      {screenState === 'error' && renderErrorScreen()}

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
    </SafeAreaView>
  );
};

export default AddGeyserScreen;

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
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  
  // Input Screen Styles
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  helpCard: {
    backgroundColor: theme.colors.accent + '10',
    borderWidth: 1,
    borderColor: theme.colors.accent + '30',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },

  // Role Selection Screen Styles
  successCard: {
    backgroundColor: theme.colors.success + '10',
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
    marginBottom: theme.spacing.lg,
  },
  successHeader: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.success,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  successMessage: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  roleCard: {
    marginBottom: theme.spacing.md,
  },
  roleContent: {
    padding: theme.spacing.lg,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  roleSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  roleFeatures: {
    gap: theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  // Error Screen Styles
  errorCard: {
    backgroundColor: theme.colors.error + '10',
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
    marginBottom: theme.spacing.lg,
  },
  errorHeader: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  suggestionCard: {
    marginBottom: theme.spacing.lg,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  suggestionList: {
    gap: theme.spacing.sm,
  },
  suggestionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  errorActions: {
    gap: theme.spacing.md,
  },
  supportButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent + '40',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.accent,
  },
});