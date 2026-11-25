/**
 * Where schedules are carried out.
 *
 * 'local' – TEST MODE. This phone runs the schedules (services/localScheduler.ts):
 *           every 10 s; in our own APK also in the background/closed (a
 *           foreground service with a notification), in Expo Go only while open
 *           (closed: Android runs a background task every 15+ minutes).
 *           Nothing runs while the phone is off.
 *
 * 'cloud' – The Firebase Cloud Function `runSchedules` (functions/src/index.ts)
 *           runs the schedules every minute, even when the phone is off.
 *           Needs the Firebase Blaze plan and `firebase deploy --only functions`.
 *
 * Both use the same rules (functions/src/scheduleLogic.ts).
 * Never run both at once: when switching to 'cloud', deploy the function and
 * set this to 'cloud' in the same release.
 */
export const SCHEDULER_MODE: 'local' | 'cloud' = 'local';
