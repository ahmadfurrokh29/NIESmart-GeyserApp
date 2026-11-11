import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import { CustomAlert, showError, showSuccess } from '../components/CustomAlert';
import { DarkCard } from '../components/DarkCard';
import { GradientButton } from '../components/GradientButton';
import { gradients, theme } from '../constants/theme';

const ManualEntryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [qrCode, setQrCode] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [alertConfig, setAlertConfig] = useState<any>(null);

  const handleSubmit = () => {
    if (!qrCode.trim() && !deviceId.trim() && !serialNumber.trim()) {
      setAlertConfig(showError('Error', 'Enter identifier'));
      return;
    }

    // Use QR code if provided, otherwise construct from device ID and serial
    const finalQrCode = qrCode.trim() || `${deviceId.trim()}-${serialNumber.trim()}`;

    // Navigate back to add-geyser with the QR code
    router.back();
    // In a real implementation, you would pass this data back to the parent screen
    // For now, we'll show a success message
    setTimeout(() => {
      setAlertConfig(showSuccess('Success', 'QR code entered!'));
    }, 500);
  };

  const generateSampleQR = () => {
    const sampleCodes = [
      'GYS-2024-001-MAIN',
      'GYS-2024-002-BATH',
      'GYS-2024-003-KITCHEN',
      'SMART-GYS-001',
      'SMART-GYS-002'
    ];
    const randomCode = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];
    setQrCode(randomCode);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="Manual Entry" 
        subtitle="Enter device information manually"
        showBackButton={true}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <DarkCard style={styles.instructionsCard}>
          <View style={styles.instructionHeader}>
            <MaterialCommunityIcons name="information" size={24} color={theme.colors.primary} />
            <Text style={styles.instructionTitle}>How to find device information</Text>
          </View>
          
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <MaterialCommunityIcons name="qrcode" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.instructionText}>Look for QR code on device label</Text>
            </View>
            <View style={styles.instructionItem}>
              <MaterialCommunityIcons name="identifier" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.instructionText}>Find Device ID on the back panel</Text>
            </View>
            <View style={styles.instructionItem}>
              <MaterialCommunityIcons name="barcode" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.instructionText}>Serial number is usually below the QR code</Text>
            </View>
          </View>
        </DarkCard>

        {/* QR Code Entry */}
        <DarkCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Option 1: QR Code</Text>
          <Text style={styles.sectionSubtitle}>
            Enter the complete QR code from your device
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>QR Code</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="qrcode" size={20} color={theme.colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="e.g., GYS-2024-001-MAIN"
                placeholderTextColor={theme.colors.textMuted}
                value={qrCode}
                onChangeText={setQrCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>

          <GradientButton
            title="Generate Sample QR"
            onPress={generateSampleQR}
            colors={[theme.colors.surface, theme.colors.surface]}
            size="medium"
            textStyle={{ color: theme.colors.primary }}
          />
        </DarkCard>

        {/* Alternative Entry */}
        <DarkCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Option 2: Device Information</Text>
          <Text style={styles.sectionSubtitle}>
            Enter device ID and serial number separately
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device ID</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="identifier" size={20} color={theme.colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="e.g., GYS-2024-001"
                placeholderTextColor={theme.colors.textMuted}
                value={deviceId}
                onChangeText={setDeviceId}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Serial Number</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="barcode" size={20} color={theme.colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="e.g., MAIN"
                placeholderTextColor={theme.colors.textMuted}
                value={serialNumber}
                onChangeText={setSerialNumber}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>

          {(deviceId.trim() || serialNumber.trim()) && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Generated QR Code:</Text>
              <Text style={styles.previewText}>{deviceId.trim()}-{serialNumber.trim()}</Text>
            </View>
          )}
        </DarkCard>

        {/* Common Issues */}
        <DarkCard style={styles.troubleshootCard}>
          <Text style={styles.troubleshootTitle}>Common Issues</Text>
          
          <View style={styles.troubleshootList}>
            <View style={styles.troubleshootItem}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={theme.colors.warning} />
              <View style={styles.troubleshootContent}>
                <Text style={styles.troubleshootQuestion}>QR code is damaged or unreadable?</Text>
                <Text style={styles.troubleshootAnswer}>Use Option 2 to enter device information manually</Text>
              </View>
            </View>
            
            <View style={styles.troubleshootItem}>
              <MaterialCommunityIcons name="help-circle" size={16} color={theme.colors.info} />
              <View style={styles.troubleshootContent}>
                <Text style={styles.troubleshootQuestion}>Can't find device information?</Text>
                <Text style={styles.troubleshootAnswer}>Check the device manual or contact support</Text>
              </View>
            </View>
            
            <View style={styles.troubleshootItem}>
              <MaterialCommunityIcons name="wifi-off" size={16} color={theme.colors.error} />
              <View style={styles.troubleshootContent}>
                <Text style={styles.troubleshootQuestion}>Device not connecting?</Text>
                <Text style={styles.troubleshootAnswer}>Ensure device is powered on and on same WiFi network</Text>
              </View>
            </View>
          </View>
        </DarkCard>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Use This Information"
            onPress={handleSubmit}
            colors={gradients.primary}
            size="large"
            disabled={!qrCode.trim() && !deviceId.trim() && !serialNumber.trim()}
          />
        </View>

        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig?.visible || false}
          title={alertConfig?.title || ''}
          message={alertConfig?.message || ''}
          type={alertConfig?.type || 'info'}
          onConfirm={() => setAlertConfig(null)}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  instructionsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  instructionsList: {
    gap: theme.spacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  formCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
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
  previewContainer: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  previewLabel: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  previewText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  troubleshootCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  troubleshootList: {
    gap: theme.spacing.md,
  },
  troubleshootItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  troubleshootContent: {
    flex: 1,
  },
  troubleshootQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  troubleshootAnswer: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
});

export default ManualEntryScreen;