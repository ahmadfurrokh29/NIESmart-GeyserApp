/**
 * LOCAL (phone) scheduler – TEST MODE ONLY (see constants/scheduler.ts).
 *
 * Does the same job as the Cloud Function `runSchedules`, but on this phone
 * and only for this user's geyser. It uses the very same rules
 * (functions/src/scheduleLogic.ts), so behaviour is identical: end time,
 * overlaps, going back to an earlier schedule, restoring manual settings.
 *
 * It listens to this geyser's schedules and device data (no extra downloads)
 * and checks right away on every change and every 10 seconds.
 *
 * When does it run?
 *   - Our own APK (Android): a FOREGROUND SERVICE keeps it running every
 *     10 seconds while the app is open, in the background, or swiped away.
 *     Android shows a permanent notification "Geyser schedules active".
 *   - Expo Go (no foreground service there): every 10 s while the app is
 *     open; when closed, a background task that Android runs about every
 *     15+ minutes.
 *   - Fallback everywhere: the background task above, which also restarts
 *     after a phone reboot (until the app is opened again).
 *   - Phone off: nothing runs.
 *
 * Because the rules check "is the schedule's time window open right now?",
 * a late run still starts or stops the geyser correctly, just late.
 *
 * The background task must be defined when the JS bundle loads, so this file
 * is imported at the top of app/_layout.tsx.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { get, onValue, ref, update } from 'firebase/database';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { database } from '../config/firebase';
import { SCHEDULER_MODE } from '../constants/scheduler';
import { DeviceScheduleState, planDevice, Schedule } from '../functions/src/scheduleLogic';

export const LOCAL_SCHEDULER_TASK = 'local-geyser-scheduler';
const DEVICE_KEY = '@local_scheduler_device';
const LAST_RUN_KEY = '@local_scheduler_last_run';
const FOREGROUND_INTERVAL_MS = 10_000;

let running = false;
/** Device the scheduler is currently running for (start is idempotent). */
let activeDeviceId: string | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let appStateSub: NativeEventSubscription | null = null;

// Live copies kept by the foreground listeners (app open).
type DeviceRecord = DeviceScheduleState & { userId?: string };
type ScheduleMap = Record<string, Partial<Schedule> | null>;
let liveUnsubscribers: (() => void)[] = [];
let liveSchedules: ScheduleMap | undefined;
let liveDevice: DeviceRecord | null | undefined;
let liveOnline = false;

export interface LocalRunResult {
  ran: boolean;
  changed: boolean;
  log: string[];
}

/** Runs the rules on the given data and writes any needed change in one update. */
async function applyPlan(
  deviceId: string,
  schedules: ScheduleMap,
  device: DeviceRecord | null,
): Promise<LocalRunResult> {
  if (!device?.userId) return { ran: true, changed: false, log: ['device missing or unclaimed'] };
  const plan = planDevice(schedules, device, new Date());

  const updates: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(plan.deviceUpdates)) {
    updates[`DEVICES/${deviceId}/${field}`] = value;
  }
  for (const [scheduleId, fields] of Object.entries(plan.scheduleUpdates)) {
    for (const [field, value] of Object.entries(fields)) {
      updates[`schedules/${deviceId}/${scheduleId}/${field}`] = value;
    }
  }
  const changed = Object.keys(updates).length > 0;
  if (changed) await update(ref(database), updates); // one multi-path update: all or nothing

  await AsyncStorage.setItem(LAST_RUN_KEY, new Date().toISOString()).catch(() => undefined);
  if (plan.log.length > 0) console.log('localScheduler -', plan.log.join(' | '));
  return { ran: true, changed, log: plan.log };
}

/**
 * Checks this geyser's schedules once and writes any needed change
 * (same as one minute of the Cloud Function, for one device).
 */
export async function runLocalSchedulerOnce(deviceIdArg?: string): Promise<LocalRunResult> {
  if (running) return { ran: false, changed: false, log: ['already running'] };
  running = true;
  try {
    const deviceId = deviceIdArg ?? (await AsyncStorage.getItem(DEVICE_KEY));
    if (!deviceId) return { ran: false, changed: false, log: ['no device'] };

    // get() fails when the phone is offline, so we never queue stale writes.
    const [schedulesSnap, deviceSnap] = await Promise.all([
      get(ref(database, `schedules/${deviceId}`)),
      get(ref(database, `DEVICES/${deviceId}`)),
    ]);
    return await applyPlan(
      deviceId,
      (schedulesSnap.val() || {}) as ScheduleMap,
      deviceSnap.val() as DeviceRecord | null,
    );
  } catch (error) {
    console.warn('localScheduler - run failed (offline?)', error);
    return { ran: false, changed: false, log: [String(error)] };
  } finally {
    running = false;
  }
}

/** Time of the last successful check, or null. Handy for testing. */
export async function getLastLocalRun(): Promise<Date | null> {
  const value = await AsyncStorage.getItem(LAST_RUN_KEY).catch(() => null);
  return value ? new Date(value) : null;
}

// Background task: must be defined at load time, outside any component.
if (SCHEDULER_MODE === 'local') {
  TaskManager.defineTask(LOCAL_SCHEDULER_TASK, async () => {
    const result = await runLocalSchedulerOnce();
    if (!result.ran) return BackgroundFetch.BackgroundFetchResult.Failed;
    return result.changed
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  });
}

/** One foreground check using the live data (no download). */
async function checkLive(deviceId: string): Promise<void> {
  // Wait until both listeners have delivered data, and only act while online:
  // offline, writes would be queued and sent later, maybe at the wrong time.
  if (running || liveSchedules === undefined || liveDevice === undefined || !liveOnline) return;
  running = true;
  try {
    await applyPlan(deviceId, liveSchedules, liveDevice);
  } catch (error) {
    console.warn('localScheduler - foreground check failed', error);
  } finally {
    running = false;
  }
}

/** Keep live copies of this geyser's schedules, device data and connection state. */
function startLiveListeners(deviceId: string) {
  stopLiveListeners();
  const check = () => checkLive(deviceId);
  liveUnsubscribers = [
    onValue(ref(database, `schedules/${deviceId}`), (snap) => {
      liveSchedules = (snap.val() || {}) as ScheduleMap;
      check(); // a schedule was added or changed: react at once
    }),
    onValue(ref(database, `DEVICES/${deviceId}`), (snap) => {
      liveDevice = snap.val() as DeviceRecord | null;
      check();
    }),
    onValue(ref(database, '.info/connected'), (snap) => {
      liveOnline = snap.val() === true;
      check();
    }),
  ];
}

function stopLiveListeners() {
  liveUnsubscribers.forEach((unsubscribe) => unsubscribe());
  liveUnsubscribers = [];
  liveSchedules = undefined;
  liveDevice = undefined;
  liveOnline = false;
}

// ------------------------------------------------ Expo Go: timer while open

function startForegroundTimer(deviceId: string) {
  stopForegroundTimer();
  startLiveListeners(deviceId);
  timer = setInterval(() => checkLive(deviceId), FOREGROUND_INTERVAL_MS);
}

function stopForegroundTimer() {
  if (timer) clearInterval(timer);
  timer = null;
  stopLiveListeners();
}

// ------------------------------------------- Our APK: 10 s foreground service

/** True in our own Android APK (not Expo Go, not web), where the service exists. */
function canUseKeepAliveService(): boolean {
  return (
    Platform.OS === 'android' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    !!NativeModules.RNBackgroundActions
  );
}

// Loaded lazily, so Expo Go never touches the missing native module.
function getBackgroundService() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-background-actions').default as typeof import('react-native-background-actions').default;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function startKeepAliveService(deviceId: string): Promise<void> {
  const BackgroundService = getBackgroundService();
  // Android 13+: ask to show the (required) service notification.
  if (Number(Platform.Version) >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS).catch(() => undefined);
  }
  if (BackgroundService.isRunning()) await BackgroundService.stop(); // e.g. another device before

  startLiveListeners(deviceId);
  await BackgroundService.start(
    async () => {
      // Runs until stop(): check every 10 s, even with the app closed.
      while (BackgroundService.isRunning()) {
        await checkLive(deviceId);
        await sleep(FOREGROUND_INTERVAL_MS);
      }
    },
    {
      taskName: 'GeyserScheduler',
      taskTitle: 'Geyser schedules active',
      taskDesc: 'Checking your schedules every 10 seconds',
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#4ADE80',
      linkingURI: 'smartiotgeyser://',
      foregroundServiceType: ['specialUse'],
    },
  );
}

async function stopKeepAliveService(): Promise<void> {
  if (!canUseKeepAliveService()) return;
  const BackgroundService = getBackgroundService();
  if (BackgroundService.isRunning()) await BackgroundService.stop();
}

/**
 * Start running schedules for this device from this phone.
 * Called by GeyserContext when the user's claimed device is known.
 */
export async function startLocalScheduler(deviceId: string): Promise<void> {
  if (SCHEDULER_MODE !== 'local') return;
  if (activeDeviceId === deviceId) return; // already running for this device
  activeDeviceId = deviceId;
  await AsyncStorage.setItem(DEVICE_KEY, deviceId);

  let keepAliveStarted = false;
  if (canUseKeepAliveService()) {
    try {
      await startKeepAliveService(deviceId);
      keepAliveStarted = true;
    } catch (error) {
      console.warn('localScheduler - could not start the 10 s service, using the app-open timer', error);
    }
  }

  if (!keepAliveStarted) {
    // Expo Go: listen + check every 10 s while open. Pause in the background
    // (the background task takes over), check again right away when reopened.
    startForegroundTimer(deviceId);
    appStateSub?.remove();
    appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') startForegroundTimer(deviceId);
      else stopForegroundTimer();
    });
  }

  // Fallback: background task (also starts again after a phone reboot).
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.warn('localScheduler - background tasks are not available on this phone (status', status, ')');
      return;
    }
    if (!(await TaskManager.isTaskRegisteredAsync(LOCAL_SCHEDULER_TASK))) {
      await BackgroundFetch.registerTaskAsync(LOCAL_SCHEDULER_TASK, {
        minimumInterval: 60, // seconds; Android usually waits 15+ minutes anyway
        stopOnTerminate: false, // keep running after the app is swiped away (Android)
        startOnBoot: true, // and after the phone restarts (Android)
      });
    }
  } catch (error) {
    console.warn('localScheduler - could not register background task', error);
  }
}

/** Stop the local scheduler (logout, unclaim). */
export async function stopLocalScheduler(): Promise<void> {
  activeDeviceId = null;
  await stopKeepAliveService().catch(() => undefined);
  stopForegroundTimer();
  appStateSub?.remove();
  appStateSub = null;
  await AsyncStorage.multiRemove([DEVICE_KEY, LAST_RUN_KEY]).catch(() => undefined);
  try {
    if (await TaskManager.isTaskRegisteredAsync(LOCAL_SCHEDULER_TASK)) {
      await BackgroundFetch.unregisterTaskAsync(LOCAL_SCHEDULER_TASK);
    }
  } catch {
    // Not supported here (e.g. web); nothing to stop.
  }
}

/**
 * On app start: remove background tasks we don't use any more (old app
 * versions), and in 'cloud' mode also our own local task.
 */
export async function cleanUpBackgroundTasks(): Promise<void> {
  try {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    for (const task of tasks) {
      if (SCHEDULER_MODE === 'local' && task.taskName === LOCAL_SCHEDULER_TASK) continue;
      await TaskManager.unregisterTaskAsync(task.taskName);
    }
  } catch {
    // Not supported in some environments (e.g. web).
  }
}
