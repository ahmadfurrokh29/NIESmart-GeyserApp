import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert, showError, showSuccess } from '../../components/CustomAlert';
import { DarkCard } from '../../components/DarkCard';
import { GradientButton } from '../../components/GradientButton';
import { MetricCard } from '../../components/MetricCard';
import { getIconName } from '../../constants/iconMappings';
import { gradients, theme } from '../../constants/theme';
import { useGeyser } from '../../contexts/GeyserContext';

const screenWidth = Dimensions.get("window").width;

const SetTempScreen = () => {
  const { device, updateDeviceSettings } = useGeyser();
  const [temp, setTemp] = useState(() => Number(device?.target_Temp) || 40);
  // True only while the user's finger is on the slider. On Android the slider
  // also reports changes made by the app itself; ignoring those stops the
  // screen and the slider from overwriting each other (the 40 <-> 60 flicker).
  const isSliding = useRef(false);
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
    console.warn('SetTemp - Unknown mode format:', mode, 'falling back to electric');
    return 'electric';
  };

  // Follow the device's target temperature, but only when IT changes.
  // (Not on every device update: the ESP32 sends current_Temp every few seconds.)
  const deviceTarget = Number(device?.target_Temp) || 40;
  useEffect(() => {
    if (!isSliding.current) setTemp(deviceTarget);
  }, [deviceTarget]);

  // Get current temperature from device data
  const currentTemp = device ? parseInt(device.current_Temp) : 25;
  const targetTemp = deviceTarget;

  // Valid temperature values (10-degree gaps)
  const validTemperatures = [30, 40, 50, 60, 70, 80, 90, 100];

  // Function to snap to nearest valid temperature
  const snapToValidTemperature = (value: number): number => {
    return validTemperatures.reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  };

  const isHeating = temp > currentTemp;
  const heatingTime = Math.max(1, Math.round((temp - currentTemp) / 2));

  const getColorFromTemp = (t: number) => {
    if (t <= 40) return theme.colors.success;
    if (t <= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  const getStatusColor = () => {
    return isHeating ? theme.colors.accent : theme.colors.success;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>Temperature Control</Text>
          </View>
          <MaterialCommunityIcons name="thermometer" size={24} color={theme.colors.primary} />
        </View>

      {/* Current Status Cards */}
      <View style={styles.statusCards}>
        <MetricCard
          title="Current Temp"
          value={`${currentTemp}°C`}
          color={theme.colors.secondary}
          icon={<MaterialCommunityIcons name="thermometer" size={20} color={theme.colors.secondary} />}
        />
        <MetricCard
          title="Target Temp"
          value={`${temp}°C`}
          color={getColorFromTemp(temp)}
          trend={{ value: `${temp - currentTemp > 0 ? '+' : ''}${temp - currentTemp}°C`, isPositive: temp > currentTemp }}
          icon={<MaterialCommunityIcons name="target" size={20} color={getColorFromTemp(temp)} />}
        />
      </View>

      {/* Main Thermostat Card */}
      <DarkCard style={styles.thermoCard}>
        <Text style={styles.cardTitle}>Thermostat Control</Text>
        
        <View style={styles.thermoContainer}>
          <AnimatedCircularProgress
            size={220}
            width={16}
            fill={((temp - 30) / 70) * 100}
            tintColor={getColorFromTemp(temp)}
            backgroundColor={theme.colors.surface}
            rotation={0}
            lineCap="round"
          >
            {() => (
              <View style={styles.centerContent}>
                <Text style={[styles.tempDisplay, { color: getColorFromTemp(temp) }]}>
                  {temp}°C
                </Text>
                <Text style={styles.tempLabel}>Target</Text>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                  <Text style={[styles.statusText, { color: getStatusColor() }]}>
                    {isHeating ? "Heating" : "Idle"}
                  </Text>
                </View>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>

        {/* Temperature Range */}
        <View style={styles.rangeContainer}>
          <Text style={styles.rangeLabel}>30°C</Text>
          <Text style={styles.rangeLabel}>100°C</Text>
        </View>
      </DarkCard>

      {/* Slider Control */}
      <DarkCard style={styles.sliderCard}>
        <View style={styles.sliderHeader}>
          <Text style={styles.cardTitle}>Adjust Temperature</Text>
          <Text style={styles.timeEstimate}>Est. Time: ~{heatingTime} min</Text>
        </View>
        
        <Slider
          style={styles.slider}
          minimumValue={30}
          maximumValue={100}
          step={10}
          value={temp}
          onSlidingStart={() => {
            isSliding.current = true;
          }}
          onValueChange={(value) => {
            if (isSliding.current) setTemp(snapToValidTemperature(value));
          }}
          onSlidingComplete={(value) => {
            isSliding.current = false;
            setTemp(snapToValidTemperature(value));
          }}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.surface}
          thumbTintColor={theme.colors.primary}
        />
        
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>Cool</Text>
          <Text style={styles.sliderLabel}>Hot</Text>
        </View>
      </DarkCard>

      {/* Quick Presets */}
      <DarkCard style={styles.presetsCard}>
        <Text style={styles.cardTitle}>Quick Presets</Text>
        <View style={styles.presetButtons}>
          {[
            { label: "Eco", temp: 40, icon: "leaf" },
            { label: "Comfort", temp: 60, icon: "home" },
            { label: "Hot", temp: 80, icon: "fire" },
          ].map((preset, index) => (
            <Pressable
              key={index}
              style={[
                styles.presetButton,
                temp === preset.temp && styles.presetButtonActive
              ]}
              onPress={() => setTemp(preset.temp)}
            >
              <MaterialCommunityIcons 
                name={getIconName(preset.icon)} 
                size={20} 
                color={temp === preset.temp ? theme.colors.background : theme.colors.textSecondary} 
              />
              <Text style={[
                styles.presetText,
                temp === preset.temp && styles.presetTextActive
              ]}>
                {preset.label}
              </Text>
              <Text style={[
                styles.presetTemp,
                temp === preset.temp && styles.presetTempActive
              ]}>
                {preset.temp}°C
              </Text>
            </Pressable>
          ))}
        </View>
      </DarkCard>

        {/* Apply Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title={isApplying ? "Applying..." : "Apply Temperature"}
            onPress={async () => {
                  if (!device) {
      setAlertConfig(showError('Error', 'No device'));
      return;
    }

              setIsApplying(true);
              try {
                // Normalize the mode before sending to ensure consistency
                const normalizedMode = normalizeMode(device.mode);
                await updateDeviceSettings(temp, normalizedMode);
                setAlertConfig(showSuccess('Success', 'Temperature set!'));
              } catch (error) {
                console.error('Error updating temperature:', error);
                setAlertConfig(showError('Error', 'Update failed'));
              } finally {
                setIsApplying(false);
              }
            }}
            disabled={isApplying || !device || temp === targetTemp}
            colors={gradients.primary}
            size="large"
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

export default SetTempScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    flexShrink: 1,
  },
  statusCards: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  thermoCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  thermoContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  tempDisplay: {
    fontSize: 48,
    fontWeight: "800",
    marginBottom: theme.spacing.xs,
  },
  tempLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingHorizontal: theme.spacing.md,
  },
  rangeLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  sliderCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  timeEstimate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  slider: {
    width: "100%",
    height: 40,
    marginBottom: theme.spacing.sm,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  presetsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  presetButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  presetButton: {
    flex: 1,
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  presetButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  presetText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  presetTextActive: {
    color: theme.colors.background,
  },
  presetTemp: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  presetTempActive: {
    color: theme.colors.background,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120, // Extra padding to clear the navbar
  },
});
