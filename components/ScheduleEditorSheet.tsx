/**
 * Bottom sheet to create (or edit) a schedule on one page:
 * From / To time (clock picker), repeat days, temperature, mode.
 * Close it with the X, by tapping outside, or by dragging the top bar down.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gradients, theme } from "../constants/theme";
import {
  endsNextDay,
  EVERY_DAY,
  findOverlap,
  formatTime12,
  getWindowMinutes,
  Schedule,
  ScheduleMode,
} from "../services/scheduleService";
import { ClockTimePicker } from "./ClockTimePicker";
import { GradientButton } from "./GradientButton";

export interface ScheduleFormValues {
  startTime: string;
  endTime: string;
  days: number[];
  temperature: number;
  mode: ScheduleMode;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (values: ScheduleFormValues) => Promise<void> | void;
  /** All schedules of the device, used for the overlap warning. */
  schedules: Schedule[];
  /** Pass a schedule to edit it; leave empty to create a new one. */
  initial?: Schedule | null;
  defaultMode?: ScheduleMode;
}

// Monday first, as people read a week. Values: 0 = Sunday … 6 = Saturday.
const DAYS = [
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
  { value: 0, label: "S" },
];

const TEMPERATURES = [30, 40, 50, 60, 70, 80, 90, 100];

export const SCHEDULE_MODES: {
  key: ScheduleMode;
  label: string;
  icon: "flash" | "sync" | "fire";
  color: string;
}[] = [
  {
    key: "electric",
    label: "Electric",
    icon: "flash",
    color: theme.colors.secondary,
  },
  { key: "hybrid", label: "Hybrid", icon: "sync", color: theme.colors.primary },
  { key: "gas", label: "Gas", icon: "fire", color: theme.colors.accent },
];

/** 90 -> "1h 30min", 45 -> "45 min" */
const formatLength = (minutes: number) =>
  minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`;

export function ScheduleEditorSheet({
  visible,
  onClose,
  onSave,
  schedules,
  initial,
  defaultMode = "electric",
}: Props) {
  const insets = useSafeAreaInsets();
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("07:30");
  const [days, setDays] = useState<number[]>(EVERY_DAY);
  const [temperature, setTemperature] = useState(50);
  const [mode, setMode] = useState<ScheduleMode>(defaultMode);
  const [picking, setPicking] = useState<"start" | "end" | null>(null);
  const [saving, setSaving] = useState(false);

  // Drag the top bar (handle + title) down to close the sheet.
  // Runs on the UI thread (gesture-handler + reanimated), so it follows the finger smoothly.
  const dragY = useSharedValue(0);
  // Read on the JS side: gesture callbacks run on the UI thread, and calling a
  // normal JS function (like Dimensions.get) from there crashes the app.
  const { height: screenHeight } = useWindowDimensions();
  const dragToClose = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(4) // start as soon as the finger moves down a little
        .failOffsetX([-24, 24]) // ignore sideways swipes
        .onUpdate((e) => {
          dragY.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          if (e.translationY > 120 || e.velocityY > 800) {
            dragY.value = withTiming(
              screenHeight,
              { duration: 180 },
              (finished) => {
                if (finished) runOnJS(onClose)();
              },
            );
          } else {
            dragY.value = withSpring(0, { damping: 20, stiffness: 250 });
          }
        }),
    [dragY, onClose, screenHeight],
  );
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  // Reset the form every time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setStartTime(initial?.startTime ?? "07:00");
    setEndTime(initial?.endTime ?? "07:30");
    setDays(initial?.days ?? EVERY_DAY);
    setTemperature(initial?.temperature ?? 50);
    setMode(initial?.mode ?? defaultMode);
    setPicking(null);
    setSaving(false);
    dragY.value = 0;
  }, [visible, initial, defaultMode, dragY]);

  const length = getWindowMinutes(startTime, endTime);
  const sameTime = length === 0;
  const noDays = days.length === 0;
  const canSave = !sameTime && !noDays && !saving;

  const overlap = useMemo(
    () =>
      canSave
        ? findOverlap({ startTime, endTime, days }, schedules, initial?.id)
        : null,
    [canSave, startTime, endTime, days, schedules, initial?.id],
  );

  const toggleDay = (value: number) =>
    setDays((current) =>
      current.includes(value)
        ? current.filter((d) => d !== value)
        : [...current, value],
    );

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({ startTime, endTime, days, temperature, mode });
    } finally {
      setSaving(false);
    }
  };

  const timeHint = sameTime
    ? "End time must be different from start time."
    : endsNextDay(startTime, endTime)
      ? `Runs past midnight, into the next morning · ${formatLength(length)}`
      : `Runs for ${formatLength(length)}`;

  const renderTimeBox = (
    which: "start" | "end",
    label: string,
    value: string,
  ) => {
    const active = picking === which;
    return (
      <Pressable
        style={[styles.timeBox, active && styles.timeBoxActive]}
        onPress={() => setPicking(which)}
        accessibilityRole="button"
        accessibilityLabel={`${label} time, ${formatTime12(value)}`}
      >
        <Text
          style={[
            styles.timeBoxLabel,
            active && { color: theme.colors.primary },
          ]}
        >
          {label}
        </Text>
        <Text style={styles.timeBoxValue}>{formatTime12(value)}</Text>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // Draw behind the status and navigation bars (the app is edge-to-edge).
      // Without this, a strip at the bottom showed the screen underneath.
      statusBarTranslucent
      navigationBarTranslucent
    >
      {/* Gesture handler needs its own root inside a Modal on Android. */}
      <GestureHandlerRootView style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + theme.spacing.md },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={dragToClose}>
            <View collapsable={false}>
              <View style={styles.handleArea}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>
                  {initial ? "Edit Schedule" : "New Schedule"}
                </Text>
                <Pressable
                  style={styles.closeButton}
                  onPress={onClose}
                  accessibilityLabel="Close"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color={theme.colors.text}
                  />
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* TIME */}
            <Text style={styles.sectionLabel}>TIME</Text>
            <View style={styles.timeRow}>
              {renderTimeBox("start", "From", startTime)}
              {renderTimeBox("end", "To", endTime)}
            </View>
            <Text
              style={[styles.hint, sameTime && { color: theme.colors.error }]}
            >
              {timeHint}
            </Text>

            {/* REPEAT */}
            <Text style={styles.sectionLabel}>REPEAT</Text>
            <View style={styles.circleRow}>
              {DAYS.map(({ value, label }) => {
                const selected = days.includes(value);
                return (
                  <Pressable
                    key={value}
                    style={[styles.circle, selected && styles.circleSelected]}
                    onPress={() => toggleDay(value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text
                      style={[
                        styles.circleText,
                        selected && styles.circleTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {noDays && (
              <Text style={[styles.hint, { color: theme.colors.error }]}>
                Select at least one day.
              </Text>
            )}

            {/* TEMPERATURE */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>TEMPERATURE</Text>
              <Text style={styles.sectionValue}>{temperature} °C</Text>
            </View>
            <View style={styles.circleRow}>
              {TEMPERATURES.map((t) => {
                const selected = temperature === t;
                return (
                  <Pressable
                    key={t}
                    style={[styles.circle, selected && styles.circleSelected]}
                    onPress={() => setTemperature(t)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${t} degrees`}
                  >
                    <Text
                      style={[
                        styles.circleText,
                        styles.circleTextSmall,
                        selected && styles.circleTextSelected,
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* MODE */}
            <Text style={styles.sectionLabel}>MODE</Text>
            <View style={styles.modeRow}>
              {SCHEDULE_MODES.map(({ key, label, icon, color }) => {
                const selected = mode === key;
                return (
                  <Pressable
                    key={key}
                    style={[
                      styles.modeItem,
                      selected && {
                        borderColor: color,
                        backgroundColor: color + "1A",
                      },
                    ]}
                    onPress={() => setMode(key)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <MaterialCommunityIcons
                      name={icon}
                      size={16}
                      color={selected ? color : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.modeText,
                        selected && { color, fontWeight: "600" },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* OVERLAP WARNING + ACTIONS */}
          <View style={styles.footer}>
            {overlap && (
              <View style={styles.warningRow}>
                <MaterialCommunityIcons
                  name="alert"
                  size={16}
                  color={theme.colors.warning}
                />
                <Text
                  style={[styles.warningText, { color: theme.colors.warning }]}
                >
                  Overlaps &quot;{overlap.name}&quot; (
                  {formatTime12(overlap.startTime)} –{" "}
                  {formatTime12(overlap.endTime)})
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <GradientButton
                title="Cancel"
                onPress={onClose}
                colors={[theme.colors.card, theme.colors.card]}
                size="medium"
                textStyle={{ color: theme.colors.text }}
                style={{ flex: 1 }}
              />
              <GradientButton
                title={
                  saving
                    ? "Saving…"
                    : initial
                      ? "Save Changes"
                      : "Save Schedule"
                }
                onPress={handleSave}
                colors={gradients.primary}
                size="medium"
                disabled={!canSave}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </Animated.View>

        <ClockTimePicker
          visible={picking !== null}
          title={picking === "end" ? "End time" : "Start time"}
          value={picking === "end" ? endTime : startTime}
          onCancel={() => setPicking(null)}
          onConfirm={(value) => {
            (picking === "end" ? setEndTime : setStartTime)(value);
            setPicking(null);
          }}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    paddingTop: theme.spacing.sm,
  },
  handleArea: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  // From / To boxes: outlined, with the label sitting on the border.
  timeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  timeBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.textMuted,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm + 2,
  },
  timeBoxActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  timeBoxLabel: {
    position: "absolute",
    top: -9,
    left: 10,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.surface,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  timeBoxValue: {
    fontSize: 22,
    fontWeight: "600",
    color: theme.colors.text,
  },

  // Round buttons for days and temperatures.
  circleRow: {
    flexDirection: "row",
    gap: 6,
  },
  circle: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  circleSelected: {
    backgroundColor: theme.colors.primary,
  },
  circleText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  circleTextSmall: {
    fontSize: 13,
  },
  circleTextSelected: {
    color: theme.colors.background,
    fontWeight: "700",
  },

  modeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.cardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  modeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  modeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    gap: 6,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
});
