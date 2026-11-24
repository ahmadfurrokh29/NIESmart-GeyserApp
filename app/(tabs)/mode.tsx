import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert, showError, showInfo, showSuccess } from '../../components/CustomAlert';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { gradients, theme } from '../../constants/theme';
import { isOfflineError, useGeyser } from '../../contexts/GeyserContext';

const screenWidth = Dimensions.get('window').width;

const MODES = [
  {
    key: 'electric',
    label: 'Electric',
    icon: 'flash',
    desc: 'Pure electric heating',
    efficiency: '95%',
    cost: 'High',
    color: theme.colors.secondary
  },
  {
    key: 'hybrid',
    label: 'Hybrid',
    icon: 'sync',
    desc: 'Electric + Gas combo',
    efficiency: '88%',
    cost: 'Medium',
    color: theme.colors.primary
  },
  {
    key: 'gas',
    label: 'Gas',
    icon: 'fire',
    desc: 'Gas-based heating',
    efficiency: '82%',
    cost: 'Low',
    color: theme.colors.accent
  },
] as const;

const ModeScreen = () => {
  const { device, updateDeviceMode } = useGeyser();
  const [selectedMode, setSelectedMode] = useState<'electric' | 'gas' | 'hybrid'>('electric');
  const [isApplying, setIsApplying] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>(null);
  const router = useRouter();

  // Helper function to normalize mode case - now accepts both formats
  const normalizeMode = (mode: string): 'electric' | 'gas' | 'hybrid' => {
    if (!mode) return 'electric';
    
    // Handle both capitalized and lowercase formats
    const modeLower = mode.toLowerCase();
    
    // Check lowercase first
    if (modeLower === 'electric' || modeLower === 'gas' || modeLower === 'hybrid') {
      return modeLower;
    }
    
    // Check exact matches for any case variations
    if (mode === 'Electric' || mode === 'ELECTRIC' || mode === 'electric') return 'electric';
    if (mode === 'Gas' || mode === 'GAS' || mode === 'gas') return 'gas';
    if (mode === 'Hybrid' || mode === 'HYBRID' || mode === 'hybrid') return 'hybrid';
    
    // Default fallback
    console.warn('ModeScreen - Unknown mode format:', mode, 'falling back to electric');
    return 'electric';
  };

  // Initialize with device data
  useEffect(() => {
    console.log('ModeScreen - Device data changed:', device);
    if (device && device.mode) {
      const normalizedMode = normalizeMode(device.mode);
      console.log('ModeScreen - Setting selected mode to:', normalizedMode, 'from database mode:', device.mode);
      setSelectedMode(normalizedMode);
    } else if (device) {
      console.log('ModeScreen - Device exists but no mode, defaulting to electric');
      setSelectedMode('electric');
    }
  }, [device]);

  // Use selected mode for display
  const currentMode = MODES.find(mode => mode.key === selectedMode);
  const selectedModeData = MODES.find(mode => mode.key === selectedMode);

  // Debug current mode calculation (can be removed after testing)
  if (device) {
    console.log('ModeScreen - Device mode from database:', device?.mode);
    console.log('ModeScreen - Selected mode (user choice):', selectedMode);
  }

  const handleApply = async () => {
        if (!device) {
      setAlertConfig(showError('Error', 'No device'));
      return;
    }

    // Normalize device mode for comparison
    const normalizedDeviceMode = normalizeMode(device.mode);
    if (selectedMode === normalizedDeviceMode) {
              setAlertConfig(showInfo('Info', 'Mode already set'));
      return;
    }

    setIsApplying(true);
    try {
      await updateDeviceMode(selectedMode);
      setAlertConfig(showSuccess('Success', 'Mode changed!'));
    } catch (error) {
      if (isOfflineError(error)) return; // the "No internet" popup is already shown
      console.error('Error updating mode:', error);
              setAlertConfig(showError('Error', 'Update failed'));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>Mode Selection</Text>
          </View>
          <View style={styles.headerActions}>
            <MaterialCommunityIcons name="thermometer-low" size={24} color={theme.colors.primary} />
          </View>
        </View>

        {/* Current Mode Status */}
        {currentMode && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <MaterialCommunityIcons name={currentMode.icon} size={24} color={currentMode.color} />
              <Text style={styles.statusTitle}>Current Mode</Text>
            </View>
            <Text style={[styles.statusMode, { color: currentMode.color }]}>
              {currentMode.label}
            </Text>
            <Text style={styles.statusDesc}>{currentMode.desc}</Text>
          </View>
        )}

        {/* Mode Selection */}
        <DarkCard style={styles.modesCard}>
          <Text style={styles.cardTitle}>Select Heating Mode</Text>
          <Text style={styles.cardSubtitle}>Choose the most suitable heating method for your needs</Text>

          <View style={styles.modesGrid}>
            {MODES.map((mode) => {
              const isSelected = selectedMode === mode.key;
              return (
                <Pressable
                  key={mode.key}
                  style={[
                    styles.modeCard,
                    isSelected && { borderColor: mode.color, backgroundColor: mode.color + '10' }
                  ]}
                  onPress={() => setSelectedMode(mode.key)}
                >
                  <View style={styles.modeHeader}>
                    <View style={[styles.modeIcon, { backgroundColor: mode.color + '20' }]}>
                      <MaterialCommunityIcons name={mode.icon} size={32} color={mode.color} />
                    </View>
                    <View style={styles.modeInfo}>
                      <Text style={styles.modeLabel}>{mode.label}</Text>
                      <Text style={styles.modeDesc}>{mode.desc}</Text>
                    </View>
                  </View>

                  <View style={styles.modeStats}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Efficiency:</Text>
                      <Text style={[styles.statValue, { color: mode.color }]}>{mode.efficiency}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Cost:</Text>
                      <Text style={styles.statValue}>{mode.cost}</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </DarkCard>

        {/* Apply Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title={isApplying ? "Applying..." : "Apply Mode"}
            onPress={handleApply}
            colors={gradients.primary}
            size="large"
            disabled={isApplying}
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

export default ModeScreen;

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  refreshButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statusTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  statusMode: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  statusDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  modesCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  modesGrid: {
    gap: theme.spacing.md,
  },
  modeCard: {
    borderWidth: 2,
    borderColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    position: 'relative',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  modeInfo: {
    flex: 1,
  },
  modeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  modeDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  modeStats: {
    gap: theme.spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // Extra padding to clear the navbar
  },
});
