import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkCard } from '../../components/DarkCard';
import { MetricCard } from '../../components/MetricCard';
import { SCHEDULE_MODES, ScheduleEditorSheet, ScheduleFormValues } from '../../components/ScheduleEditorSheet';
import { theme } from '../../constants/theme';
import { useGeyser } from '../../contexts/GeyserContext';
import { endsNextDay, formatDays, formatTime12, Schedule, scheduleService } from '../../services/scheduleService';

/**
 * Schedules are saved to Firebase and run by the Cloud Function `runSchedules`,
 * so they work even when this phone is off.
 *
 * - Tap a schedule (or its pencil) to edit it in the sheet.
 * - The power button turns a schedule on/off without deleting it.
 * - The bin deletes it.
 */
const SchedulingScreen = () => {
  const router = useRouter();
  const { device } = useGeyser();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [online, setOnline] = useState(scheduleService.isOnline());

  // The sheet is open when `editor` is set: 'new' for a new schedule, or the schedule being edited.
  const [editor, setEditor] = useState<'new' | Schedule | null>(null);

  // Live schedule list (cached on the phone, kept in sync with Firebase).
  // The service also notifies us when the connection goes up or down.
  useEffect(() => {
    return scheduleService.subscribe((list) => {
      setSchedules(list);
      setOnline(scheduleService.isOnline());
      setIsLoading(false);
    });
  }, []);

  const handleAdd = () => {
    if (!device) {
      Alert.alert('No device', 'Claim a geyser before creating schedules.');
      return;
    }
    setEditor('new');
  };

  const handleSave = async (values: ScheduleFormValues) => {
    try {
      if (editor && editor !== 'new') {
        // Send only what changed. (Changing time or days lets the schedule run again today.)
        const changes: Partial<ScheduleFormValues> = {};
        if (values.startTime !== editor.startTime) changes.startTime = values.startTime;
        if (values.endTime !== editor.endTime) changes.endTime = values.endTime;
        if ([...values.days].sort().join() !== [...editor.days].sort().join()) changes.days = values.days;
        if (values.temperature !== editor.temperature) changes.temperature = values.temperature;
        if (values.mode !== editor.mode) changes.mode = values.mode;
        if (Object.keys(changes).length > 0) await scheduleService.updateSchedule(editor.id, changes);
      } else {
        await scheduleService.createSchedule(values);
      }
      setEditor(null);
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Could not save the schedule. Please try again.');
    }
  };

  const handleToggle = async (schedule: Schedule) => {
    try {
      // If it is running, the Cloud Function turns the geyser off on its next run.
      await scheduleService.setEnabled(schedule.id, !schedule.enabled);
    } catch (error) {
      console.error('Error toggling schedule:', error);
      Alert.alert('Error', 'Update failed');
    }
  };

  const handleDelete = (schedule: Schedule) => {
    Alert.alert('Delete Schedule', `Delete "${schedule.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // If it is running, the Cloud Function turns the geyser off on its next run.
            await scheduleService.deleteSchedule(schedule.id);
          } catch (error) {
            console.error('Error deleting schedule:', error);
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  const renderSchedule = (schedule: Schedule) => {
    const running = schedule.enabled && device?.activeScheduleId === schedule.id;
    const disabled = !schedule.enabled;
    const mode = SCHEDULE_MODES.find((m) => m.key === schedule.mode);
    const muted = theme.colors.textMuted;

    return (
      <Pressable
        key={schedule.id}
        style={[styles.scheduleCard, running && styles.scheduleCardRunning, disabled && styles.scheduleCardDisabled]}
        onPress={() => setEditor(schedule)}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${schedule.name}`}
      >
        {/* Name + status */}
        <View style={styles.cardTopRow}>
          <Text style={[styles.scheduleName, disabled && { color: muted }]} numberOfLines={1}>
            {schedule.name}
          </Text>
          {running && (
            <View style={styles.runningBadge}>
              <View style={styles.runningDot} />
              <Text style={styles.runningText}>Running now</Text>
            </View>
          )}
          {disabled && <Text style={styles.disabledText}>Disabled</Text>}
        </View>

        {/* Time */}
        <Text style={[styles.scheduleTime, disabled && { color: muted }]}>
          {formatTime12(schedule.startTime)} → {formatTime12(schedule.endTime)}
          {endsNextDay(schedule.startTime, schedule.endTime) ? ' (next day)' : ''}
        </Text>

        {/* Days · temperature · mode */}
        <View style={styles.detailsRow}>
          <Text style={styles.detailsText}>
            {formatDays(schedule.days)} · {schedule.temperature} °C ·{' '}
          </Text>
          {mode && (
            <MaterialCommunityIcons name={mode.icon} size={14} color={disabled ? muted : mode.color} />
          )}
          <Text style={styles.detailsText}> {mode?.label ?? schedule.mode}</Text>
        </View>

        {/* Sync status + actions */}
        <View style={styles.cardBottomRow}>
          {schedule.synced ? (
            <View style={styles.syncRow}>
              <MaterialCommunityIcons name="cloud-check-outline" size={14} color={muted} />
              <Text style={styles.syncText}>Synced</Text>
            </View>
          ) : (
            <View style={styles.waitingBadge}>
              <MaterialCommunityIcons name="timer-sand" size={13} color={theme.colors.warning} />
              <Text style={styles.waitingText}>Waiting to sync</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => setEditor(schedule)}
              accessibilityLabel={`Edit ${schedule.name}`}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.secondary} />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleToggle(schedule)}
              accessibilityLabel={schedule.enabled ? `Disable ${schedule.name}` : `Enable ${schedule.name}`}
            >
              <MaterialCommunityIcons
                name="power"
                size={18}
                color={schedule.enabled ? theme.colors.success : theme.colors.textMuted}
              />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleDelete(schedule)}
              accessibilityLabel={`Delete ${schedule.name}`}
            >
              <MaterialCommunityIcons name="delete" size={18} color={theme.colors.error} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Back">
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>Scheduling</Text>
          </View>
          <MaterialCommunityIcons name="calendar-clock" size={24} color={theme.colors.primary} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <MetricCard
            title="Active Schedules"
            value={schedules.filter((s) => s.enabled).length.toString()}
            subtitle="Enabled"
            color={theme.colors.success}
          />
          <MetricCard
            title="Total Schedules"
            value={schedules.length.toString()}
            subtitle="Created"
            color={theme.colors.secondary}
          />
        </View>

        {/* Offline banner */}
        {!online && !isLoading && (
          <View style={styles.offlineBanner}>
            <MaterialCommunityIcons name="cloud-off-outline" size={18} color={theme.colors.warning} />
            <Text style={styles.offlineText}>
              You&apos;re offline. New schedules are saved on this phone and will sync when you&apos;re back online.
            </Text>
          </View>
        )}

        {/* Schedules */}
        <DarkCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Schedules</Text>
            <Pressable style={styles.addButton} onPress={handleAdd} accessibilityLabel="Add schedule">
              <MaterialCommunityIcons name="plus" size={24} color={theme.colors.background} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading schedules...</Text>
            </View>
          ) : schedules.length === 0 ? (
            <Pressable style={styles.emptyState} onPress={handleAdd}>
              <MaterialCommunityIcons name="calendar-plus" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyStateTitle}>No Schedules Yet</Text>
              <Text style={styles.emptyStateDesc}>Tap + to create your first schedule</Text>
            </Pressable>
          ) : (
            <View style={styles.list}>{schedules.map(renderSchedule)}</View>
          )}
        </DarkCard>
      </ScrollView>

      <ScheduleEditorSheet
        visible={editor !== null}
        initial={editor && editor !== 'new' ? editor : null}
        onClose={() => setEditor(null)}
        onSave={handleSave}
        schedules={schedules}
        defaultMode={device?.mode}
      />
    </SafeAreaView>
  );
};

export default SchedulingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 120, // clear the tab bar
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

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning + '80',
    backgroundColor: theme.colors.warning + '14',
  },
  offlineText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.warning,
  },

  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  list: {
    gap: theme.spacing.md,
  },
  scheduleCard: {
    backgroundColor: theme.colors.cardSecondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border + '80',
    padding: theme.spacing.md,
  },
  scheduleCardRunning: {
    borderColor: theme.colors.primary,
  },
  scheduleCardDisabled: {
    opacity: 0.6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  scheduleName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  runningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + '26',
  },
  runningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  runningText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  disabledText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
  detailsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.warning + '26',
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
