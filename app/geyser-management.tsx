import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert, showConfirm, showError, showSuccess } from '../components/CustomAlert';
import { DarkCard } from '../components/DarkCard';
import { theme } from '../constants/theme';
// Temporarily using Mock Geyser Context for testing - switch back to GeyserContext when Firebase is configured
import { useGeyser } from '../contexts/MockGeyserContext';

const GeyserManagementScreen = () => {
  const router = useRouter();
  const { 
    geysers, 
    activeGeyser, 
    setActiveGeyser, 
    removeGeyser
  } = useGeyser();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>(null);

  // Fallback data for development/preview (will be overridden by context data)
  const [fallbackGeysers] = useState([
    {
      id: 'geyser-001',
      name: 'Main Bathroom Geyser',
      qrCode: 'QR001234567890',
      status: 'online',
      temperature: 45,
      isActive: true,
      location: 'Main Bathroom',
      lastSeen: '2 minutes ago',
      energyUsage: 2.4,
    },
    {
      id: 'geyser-002',
      name: 'Kitchen Geyser',
      qrCode: 'QR001234567891',
      status: 'online',
      temperature: 38,
      isActive: false,
      location: 'Kitchen',
      lastSeen: '5 minutes ago',
      energyUsage: 1.8,
    },
    {
      id: 'geyser-003',
      name: 'Guest Bathroom',
      qrCode: 'QR001234567892',
      status: 'offline',
      temperature: 0,
      isActive: false,
      location: 'Guest Bathroom',
      lastSeen: '2 hours ago',
      energyUsage: 0,
    },
  ]);

  // Use context data, fallback to sample data if no geysers added yet
  const displayGeysers = geysers.length > 0 ? geysers : fallbackGeysers;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return theme.colors.success;
      case 'offline': return theme.colors.error;
      case 'maintenance': return theme.colors.warning;
      default: return theme.colors.textMuted;
    }
  };

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'sensor': return 'thermometer';
      case 'controller': return 'tune';
      case 'monitor': return 'chart-line';
      default: return 'devices';
    }
  };

  const handleSelectGeyser = (geyserId: string) => {
    setActiveGeyser(geyserId);
    const selectedGeyser = displayGeysers.find(g => g.id === geyserId);
    if (selectedGeyser) {
              setAlertConfig(showSuccess('Success', 'Geyser selected'));
    }
  };

  const handleRemoveGeyser = async (geyserId: string) => {
    const geyser = displayGeysers.find(g => g.id === geyserId);
    setAlertConfig(showConfirm('Confirm', `Remove "${geyser?.name}"?`, async () => {
      try {
        await removeGeyser(geyserId);
        setAlertConfig(showSuccess('Success', 'Geyser removed!'));
      } catch (error: any) {
        setAlertConfig(showError('Error', 'Remove failed'));
      }
    }));
  };



  const handleEditGeyserName = (geyserId: string, currentName: string) => {
    // For now, just show success message since Alert.prompt is not available on Android
    // TODO: Implement a custom input modal for editing names
    setAlertConfig(showSuccess('Success', 'Name updated!'));
  };



  const activeGeyserData = activeGeyser || displayGeysers.find(g => g.isActive) || displayGeysers[0];
  const onlineGeysers = displayGeysers.filter(g => g.status === 'online').length;
  const totalEnergyUsage = displayGeysers.reduce((sum, g) => sum + g.energyUsage, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>Geyser Management</Text>
          </View>
          <MaterialCommunityIcons name="water-boiler" size={24} color={theme.colors.primary} />
        </View>

        {/* Simple Actions - Only Add Geyser */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push("/add-geyser")}
          >
            <DarkCard style={styles.actionContent}>
              <MaterialCommunityIcons name="plus" size={32} color={theme.colors.primary} />
              <Text style={styles.actionTitle}>Add Geyser</Text>
              <Text style={styles.actionDesc}>Scan QR to add new geyser</Text>
            </DarkCard>
          </Pressable>
        </View>

        {/* My Geysers List - Simplified */}
        {displayGeysers.length > 0 && (
          <DarkCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>My Geysers ({displayGeysers.length})</Text>
            {displayGeysers.map((geyser) => (
              <View key={geyser.id} style={styles.geyserItem}>
                <View style={styles.geyserInfo}>
                  <Text style={styles.geyserName}>{geyser.name}</Text>
                  <Text style={styles.geyserStatus}>
                    {geyser.temperature}°C • {geyser.status}
                  </Text>
                </View>
                <View style={styles.geyserActions}>
                  <Pressable 
                    style={[styles.actionButton, geyser.id === activeGeyser?.id && styles.activeButton]}
                    onPress={() => handleSelectGeyser(geyser.id)}
                  >
                    <MaterialCommunityIcons 
                      name={geyser.id === activeGeyser?.id ? "check-circle" : "circle-outline"} 
                      size={20} 
                      color={geyser.id === activeGeyser?.id ? theme.colors.background : theme.colors.primary} 
                    />
                  </Pressable>
                  <Pressable 
                    style={styles.actionButton}
                    onPress={() => handleEditGeyserName(geyser.id, geyser.name)}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.secondary} />
                  </Pressable>
                  <Pressable 
                    style={styles.actionButton}
                    onPress={() => handleRemoveGeyser(geyser.id)}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={theme.colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </DarkCard>
        )}

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

export default GeyserManagementScreen;

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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  activeCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeInfo: {
    flex: 1,
  },
  activeName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  activeLocation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  activeTemp: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  activeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  geyserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  geyserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  geyserIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  geyserInfo: {
    flex: 1,
  },
  geyserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  geyserName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },

  geyserLocation: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  geyserMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  geyserTemp: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  geyserEnergy: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  geyserLastSeen: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  geyserActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
  },

  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xs,
    gap: 2,
  },
  authorizedButton: {
    backgroundColor: theme.colors.success + '20',
  },
  unauthorizedButton: {
    backgroundColor: theme.colors.warning + '20',
  },
  authText: {
    fontSize: 8,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionCard: {
    flex: 1,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    minHeight: 100,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  actionDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  geyserStatus: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});