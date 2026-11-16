/**
 * Cloud Functions for the Smart IoT Geyser app.
 *
 * runSchedules
 *   Cloud Scheduler calls this once a minute (one job for all users).
 *   It reads every schedule, decides which geysers to turn on or off
 *   (see scheduleLogic.ts) and writes all changes in one database update.
 *   The ESP32 is already listening to DEVICES/{deviceId}, so it reacts at once.
 *   This works even when the user's phone is off.
 */
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { DEFAULT_TIMEZONE, planDevice, Schedule } from './scheduleLogic';

initializeApp();

export const runSchedules = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: DEFAULT_TIMEZONE,
    // Same region as the Realtime Database (us-central1), for speed and no cross-region traffic.
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 50,
    // Only one copy at a time, so two runs can never fight over the same geyser.
    maxInstances: 1,
    // Don't retry a failed minute: the next run a minute later fixes things anyway.
    retryCount: 0,
  },
  async () => {
    const db = getDatabase();
    const now = new Date();

    const schedulesSnap = await db.ref('schedules').get();
    if (!schedulesSnap.exists()) return;
    const allSchedules = schedulesSnap.val() as Record<string, Record<string, Partial<Schedule> | null>>;

    const updates: Record<string, unknown> = {};

    await Promise.all(
      Object.entries(allSchedules).map(async ([deviceId, schedules]) => {
        // Read only the two small fields we need, not the whole device.
        const [ownerSnap, activeSnap] = await Promise.all([
          db.ref(`DEVICES/${deviceId}/userId`).get(),
          db.ref(`DEVICES/${deviceId}/activeScheduleId`).get(),
        ]);

        // Skip schedules of devices that don't exist or have no owner,
        // so we never create a fake device entry by writing to it.
        if (!ownerSnap.exists()) {
          logger.debug(`Skipping ${deviceId}: device missing or unclaimed`);
          return;
        }

        const plan = planDevice(schedules, { activeScheduleId: activeSnap.val() }, now);

        for (const [field, value] of Object.entries(plan.deviceUpdates)) {
          updates[`DEVICES/${deviceId}/${field}`] = value;
        }
        for (const [scheduleId, fields] of Object.entries(plan.scheduleUpdates)) {
          for (const [field, value] of Object.entries(fields)) {
            updates[`schedules/${deviceId}/${scheduleId}/${field}`] = value;
          }
        }
        if (plan.log.length > 0) {
          logger.info(`Device ${deviceId}: ${plan.log.join(' | ')}`);
        }
      }),
    );

    if (Object.keys(updates).length > 0) {
      // One multi-path update: either every change is saved, or none is.
      await db.ref().update(updates);
    }
  },
);
