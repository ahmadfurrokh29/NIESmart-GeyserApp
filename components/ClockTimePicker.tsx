/**
 * Clock-face time picker drawn in the app's own colours.
 *
 * Why not the phone's built-in picker? On Android its colours come from the
 * app's native theme, which Expo Go doesn't let us change (it stays blue), and
 * its AM/PM buttons can't be moved. This one works the same on Android, iPhone
 * and web.
 *
 * Use: pick the hour on the clock (it then jumps to minutes), pick the
 * minutes, choose AM or PM, press OK. Tap or drag on the clock.
 * Render it inside an existing screen or modal; it covers that area.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { theme } from '../constants/theme';

interface Props {
  visible: boolean;
  /** Title above the time, e.g. "Start time". */
  title: string;
  /** 24-hour "HH:mm". */
  value: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

type Period = 'AM' | 'PM';
type View12 = 'hour' | 'minute';

const SIZE = 256;
const CENTER = SIZE / 2;
const NUMBER_RADIUS = 98;
const SELECT_RADIUS = 20;

const HOUR_LABELS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_LABELS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const pad = (n: number) => n.toString().padStart(2, '0');

/** Point on the clock for an angle in degrees, measured clockwise from 12. */
function pointAt(angle: number, radius = NUMBER_RADIUS) {
  const rad = (angle * Math.PI) / 180;
  return { x: CENTER + radius * Math.sin(rad), y: CENTER - radius * Math.cos(rad) };
}

export function ClockTimePicker({ visible, title, value, onCancel, onConfirm }: Props) {
  const [hour12, setHour12] = useState(7);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<Period>('AM');
  const [view, setView] = useState<View12>('hour');

  // The pan handlers are created once, so they read the current view from a ref.
  const viewRef = useRef<View12>('hour');
  viewRef.current = view;

  useEffect(() => {
    if (!visible) return;
    const [h, m] = value.split(':').map(Number);
    setHour12(h % 12 || 12);
    setMinute(m);
    setPeriod(h >= 12 ? 'PM' : 'AM');
    setView('hour');
  }, [visible, value]);

  const pan = useMemo(() => {
    const pick = (x: number, y: number) => {
      let angle = (Math.atan2(x - CENTER, CENTER - y) * 180) / Math.PI;
      if (angle < 0) angle += 360;
      if (viewRef.current === 'hour') {
        setHour12(Math.round(angle / 30) % 12 || 12);
      } else {
        setMinute(Math.round(angle / 6) % 60);
      }
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => pick(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) => pick(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderRelease: () => {
        // After choosing the hour, move on to the minutes, like most clocks do.
        if (viewRef.current === 'hour') setTimeout(() => setView('minute'), 250);
      },
    });
  }, []);

  if (!visible) return null;

  const isHour = view === 'hour';
  const labels = isHour ? HOUR_LABELS : MINUTE_LABELS;
  const handAngle = isHour ? (hour12 % 12) * 30 : minute * 6;
  const hand = pointAt(handAngle);
  const handEnd = pointAt(handAngle, NUMBER_RADIUS - SELECT_RADIUS);
  const isLabelSelected = (label: number) => (isHour ? label === hour12 : label === minute);

  const confirm = () => {
    const hour24 = (hour12 % 12) + (period === 'PM' ? 12 : 0);
    onConfirm(`${pad(hour24)}:${pad(minute)}`);
  };

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Cancel" />
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>

        {/* Big time: tap the hour or minutes to change them. */}
        <View style={styles.timeRow}>
          <Pressable onPress={() => setView('hour')} accessibilityLabel="Change hour">
            <Text style={[styles.timeSegment, isHour && styles.timeSegmentActive]}>{pad(hour12)}</Text>
          </Pressable>
          <Text style={styles.timeColon}>:</Text>
          <Pressable onPress={() => setView('minute')} accessibilityLabel="Change minutes">
            <Text style={[styles.timeSegment, !isHour && styles.timeSegmentActive]}>{pad(minute)}</Text>
          </Pressable>
        </View>

        {/* AM / PM: its own row, clearly apart from the time. */}
        <View style={styles.periodRow}>
          {(['AM', 'PM'] as const).map((p) => {
            const selected = period === p;
            return (
              <Pressable
                key={p}
                style={[styles.periodButton, selected && styles.periodButtonSelected]}
                onPress={() => setPeriod(p)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.periodText, selected && styles.periodTextSelected]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Clock face */}
        <View style={styles.clock} {...pan.panHandlers}>
          <Svg width={SIZE} height={SIZE} pointerEvents="none">
            <Circle cx={CENTER} cy={CENTER} r={CENTER} fill={theme.colors.card} />
            <Line
              x1={CENTER}
              y1={CENTER}
              x2={handEnd.x}
              y2={handEnd.y}
              stroke={theme.colors.primary}
              strokeWidth={2}
            />
            <Circle cx={CENTER} cy={CENTER} r={4} fill={theme.colors.primary} />
            <Circle cx={hand.x} cy={hand.y} r={SELECT_RADIUS} fill={theme.colors.primary} />
            {labels.map((label, i) => {
              const p = pointAt(i * 30);
              const selected = isLabelSelected(label);
              return (
                <SvgText
                  key={label}
                  x={p.x}
                  y={p.y + 5}
                  fontSize={15}
                  fontWeight={selected ? '700' : '500'}
                  fill={selected ? theme.colors.background : theme.colors.text}
                  textAnchor="middle"
                >
                  {isHour ? String(label) : pad(label)}
                </SvgText>
              );
            })}
          </Svg>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onCancel}>
            <Text style={styles.actionTextMuted}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={confirm}>
            <Text style={styles.actionText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  card: {
    width: SIZE + 48,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 24,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  timeSegment: {
    fontSize: 52,
    fontWeight: '600',
    color: theme.colors.textMuted,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  timeSegmentActive: {
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '1A',
  },
  timeColon: {
    fontSize: 52,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  periodRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: theme.colors.cardSecondary,
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: theme.borderRadius.full,
  },
  periodButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  periodText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  periodTextSelected: {
    color: theme.colors.background,
  },
  clock: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
  },
  actionButton: {
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  actionTextMuted: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});
