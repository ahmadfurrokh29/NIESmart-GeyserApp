import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getIconName } from '../../constants/iconMappings';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { MetricCard } from '../../components/MetricCard';
import { gradients, theme } from '../../constants/theme';

const EnergySettingsScreen = () => {
  const router = useRouter();
  const [ecoMode, setEcoMode] = useState(true);
  const [peakHourOptimization, setPeakHourOptimization] = useState(false);
  const [smartScheduling, setSmartScheduling] = useState(true);
  const [energyAlerts, setEnergyAlerts] = useState(true);
  const [maxDailyUsage, setMaxDailyUsage] = useState(8); // kWh

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: string,
    iconColor: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={getIconName(icon)} size={20} color={iconColor} />
        </View>
        <View style={styles.itemText}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? theme.colors.primary : theme.colors.textMuted}
        trackColor={{ 
          true: theme.colors.primary + '40', 
          false: theme.colors.surface 
        }}
      />
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
            <Text style={styles.title}>Energy Settings</Text>
          </View>
          <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.colors.accent} />
        </View>

        {/* Current Usage Stats */}
        <View style={styles.statsRow}>
          <MetricCard
            title="Today's Usage"
            value="4.2 kWh"
            trend={{ value: "12%", isPositive: false }}
            color={theme.colors.success}
            icon={<MaterialCommunityIcons name="flash" size={20} color={theme.colors.success} />}
          />
          <MetricCard
            title="Monthly Avg"
            value="124 kWh"
            subtitle="vs 138 last month"
            color={theme.colors.secondary}
            icon={<MaterialCommunityIcons name="chart-line" size={20} color={theme.colors.secondary} />}
          />
        </View>

        {/* Energy Optimization */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Energy Optimization</Text>
          {renderSettingItem(
            'Eco Mode',
            'Reduce energy consumption automatically',
            ecoMode,
            setEcoMode,
            'leaf',
            theme.colors.success
          )}
          {renderSettingItem(
            'Peak Hour Optimization',
            'Avoid heating during peak hours',
            peakHourOptimization,
            setPeakHourOptimization,
            'clock-alert',
            theme.colors.warning
          )}
          {renderSettingItem(
            'Smart Scheduling',
            'AI-powered heating schedule',
            smartScheduling,
            setSmartScheduling,
            'brain',
            theme.colors.primary
          )}
        </DarkCard>

        {/* Usage Limits */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Usage Limits</Text>
          <View style={styles.limitContainer}>
            <View style={styles.limitHeader}>
              <MaterialCommunityIcons name="speedometer" size={24} color={theme.colors.accent} />
              <View style={styles.limitText}>
                <Text style={styles.limitTitle}>Daily Usage Limit</Text>
                <Text style={styles.limitSubtitle}>Current: {maxDailyUsage} kWh per day</Text>
              </View>
            </View>
            <View style={styles.limitControls}>
              <Pressable 
                style={styles.limitButton}
                onPress={() => setMaxDailyUsage(Math.max(1, maxDailyUsage - 1))}
              >
                <MaterialCommunityIcons name="minus" size={20} color={theme.colors.text} />
              </Pressable>
              <Text style={styles.limitValue}>{maxDailyUsage} kWh</Text>
              <Pressable 
                style={styles.limitButton}
                onPress={() => setMaxDailyUsage(Math.min(20, maxDailyUsage + 1))}
              >
                <MaterialCommunityIcons name="plus" size={20} color={theme.colors.text} />
              </Pressable>
            </View>
          </View>
        </DarkCard>

        {/* Alerts & Notifications */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Alerts & Monitoring</Text>
          {renderSettingItem(
            'Energy Alerts',
            'Get notified when usage is high',
            energyAlerts,
            setEnergyAlerts,
            'bell-alert',
            theme.colors.error
          )}
          
          <Pressable style={styles.actionItem}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary + '20' }]}>
                <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={theme.colors.secondary} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Usage History</Text>
                <Text style={styles.itemDescription}>View detailed energy reports</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
          </Pressable>
        </DarkCard>

        {/* Energy Tips */}
        <DarkCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Energy Saving Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="lightbulb-on" size={16} color={theme.colors.warning} />
              <Text style={styles.tipText}>Lower temperature by 5°C to save 15% energy</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="timer" size={16} color={theme.colors.primary} />
              <Text style={styles.tipText}>Use timer to heat water only when needed</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="wrench" size={16} color={theme.colors.accent} />
              <Text style={styles.tipText}>Regular maintenance improves efficiency</Text>
            </View>
          </View>
        </DarkCard>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Save Energy Settings"
            onPress={() => {
              // Save settings logic here
              router.back();
            }}
            colors={gradients.success}
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EnergySettingsScreen;

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
  itemLeft: {
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
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  limitContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  limitText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  limitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  limitSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  limitControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  limitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    minWidth: 80,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  tipsContainer: {
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