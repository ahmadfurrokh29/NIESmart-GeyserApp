/**
 * Schedules, stored in Firebase so the Cloud Function `runSchedules`
 * (see functions/src/index.ts) can switch the geyser on and off even when
 * this phone is off. The phone NEVER switches the geyser for a schedule itself.
 *
 * Firebase:  schedules/{deviceId}/{scheduleId}
 *
 * AsyncStorage is used for two things only:
 *   1. a cache, so schedules show instantly and while offline;
 *   2. an OUTBOX: every change is saved here first, then sent to Firebase.
 *      If the phone is offline (or the app is closed before the write
 *      finishes), the change is sent the next time the phone is online.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onValue, push, ref, remove, set, update } from 'firebase/database';
import { auth, database } from '../config/firebase';

export type ScheduleMode = 'electric' | 'gas' | 'hybrid';

export const DEFAULT_TIMEZONE = 'Asia/Karachi';
export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** What is stored in Firebase for one schedule. */
export interface ScheduleData {
  name: string;
  /** 24-hour local start time, "HH:mm". */
  startTime: string;
  durationMinutes: number;
  temperature: number;
  mode: ScheduleMode;
  /** 0 = Sunday … 6 = Saturday */
  days: number[];
  enabled: boolean;
  timezone: string;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  /** Written by the Cloud Function: local date this schedule last started. */
  lastStartDate?: string | null;
}

/** A schedule as shown in the app. */
export interface Schedule extends ScheduleData {
  id: string;
  /** false while the latest change is still waiting in the outbox. */
  synced: boolean;
}

export type NewSchedule = Pick<ScheduleData, 'startTime' | 'durationMinutes' | 'temperature' | 'mode' | 'days'> &
  Partial<Pick<ScheduleData, 'name' | 'enabled'>>;

type OutboxOp =
  | { type: 'set'; id: string; data: ScheduleData }
  | { type: 'update'; id: string; data: Partial<ScheduleData> }
  | { type: 'delete'; id: string };

const cacheKey = (deviceId: string) => `@schedules_cache:${deviceId}`;
const outboxKey = (deviceId: string) => `@schedules_outbox:${deviceId}`;

// Keys of the old phone-based scheduler, removed after migration.
const LEGACY_SCHEDULES_KEY = '@geyser_schedules';
const LEGACY_KEYS = [
  LEGACY_SCHEDULES_KEY,
  '@active_schedule',
  '@schedule_execution_log',
  '@last_schedule_check',
  '@device_id',
];

// ---------------------------------------------------------------- helpers

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('scheduleService - could not save to phone storage', error);
  }
}

/** Firebase may return arrays as objects; always give back a sorted number[]. */
function normalizeDays(days: unknown): number[] {
  const list = Array.isArray(days) ? days : days && typeof days === 'object' ? Object.values(days) : [];
  return Array.from(new Set(list.filter((d) => d !== null && d !== undefined).map(Number))).sort((a, b) => a - b);
}

function fromFirebase(id: string, raw: any, synced: boolean): Schedule {
  return { ...(raw as ScheduleData), id, days: normalizeDays(raw?.days), synced };
}

/** Converts "07:30 AM" / "12:05 AM" style text into 24-hour "HH:mm". */
export function to24Hour(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  const hour24 = (hour12 % 12) + (period === 'PM' ? 12 : 0);
  return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/** "19:05" -> "07:05 PM" */
export function formatTime12(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${(h % 12 || 12).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

/** End time of a schedule as "HH:mm" (wraps past midnight). */
export function getEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const total = (h * 60 + m + durationMinutes) % (24 * 60);
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** [1,2,3,4,5] -> "Mon–Fri", all -> "Every day", [0,6] -> "Weekends" */
export function formatDays(days: number[]): string {
  const set = normalizeDays(days);
  if (set.length === 7) return 'Every day';
  if (set.length === 5 && [1, 2, 3, 4, 5].every((d) => set.includes(d))) return 'Mon–Fri';
  if (set.length === 2 && set.includes(0) && set.includes(6)) return 'Weekends';
  // Show Monday first.
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => set.includes(d)).map((d) => DAY_SHORT[d]).join(', ');
}

/** Icon name based on the start time of day. */
export function getScheduleIcon(startTime: string): string {
  const hour = Number(startTime.split(':')[0]);
  if (hour >= 5 && hour < 12) return 'weather-sunny';
  if (hour >= 12 && hour < 18) return 'weather-partly-cloudy';
  return 'weather-night';
}

// ---------------------------------------------------------------- service

type Listener = (schedules: Schedule[]) => void;

class ScheduleService {
  private deviceId: string | null = null;
  private remote: Record<string, Schedule> = {};
  private outbox: OutboxOp[] = [];
  private listeners = new Set<Listener>();
  private unsubscribers: Array<() => void> = [];
  private online = false;
  private flushing = false;

  /**
   * Start syncing schedules for a device. Called by GeyserContext when the
   * user's claimed device is known. Calling it again for the same device
   * does nothing; for another device it switches over.
   */
  async start(deviceId: string): Promise<void> {
    if (this.deviceId === deviceId) return;
    this.stop();
    this.deviceId = deviceId;

    // Show the cached copy immediately, then keep it fresh from Firebase.
    const cached = await readJson<Schedule[]>(cacheKey(deviceId), []);
    this.outbox = await readJson<OutboxOp[]>(outboxKey(deviceId), []);
    if (this.deviceId !== deviceId) return; // switched while loading
    this.remote = Object.fromEntries(cached.map((s) => [s.id, s]));
    this.emit();

    await this.migrateLegacySchedules(deviceId);

    this.unsubscribers.push(
      onValue(
        ref(database, `schedules/${deviceId}`),
        (snapshot) => {
          const data = (snapshot.val() || {}) as Record<string, unknown>;
          this.remote = Object.fromEntries(
            Object.entries(data).map(([id, raw]) => [id, fromFirebase(id, raw, true)]),
          );
          writeJson(cacheKey(deviceId), Object.values(this.remote));
          this.emit();
        },
        (error) => console.warn('scheduleService - schedules listener error', error),
      ),
    );

    // Firebase tells us when the connection goes up or down.
    this.unsubscribers.push(
      onValue(ref(database, '.info/connected'), (snapshot) => {
        this.online = snapshot.val() === true;
        this.emit();
        if (this.online) this.flush();
      }),
    );
  }

  /** Stop syncing (logout, unclaim, or switching device). */
  stop(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.deviceId = null;
    this.remote = {};
    this.outbox = [];
    this.online = false;
    this.emit();
  }

  /** Subscribe to the schedule list. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSchedules());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** True when the phone is connected to Firebase. */
  isOnline(): boolean {
    return this.online;
  }

  /** Current list: Firebase data with any not-yet-sent changes applied on top. */
  getSchedules(): Schedule[] {
    const merged: Record<string, Schedule> = { ...this.remote };
    for (const op of this.outbox) {
      if (op.type === 'delete') {
        delete merged[op.id];
      } else if (op.type === 'set') {
        merged[op.id] = { ...op.data, id: op.id, days: normalizeDays(op.data.days), synced: false };
      } else if (merged[op.id]) {
        merged[op.id] = { ...merged[op.id], ...op.data, synced: false };
      }
    }
    return Object.values(merged).sort(
      (a, b) => a.startTime.localeCompare(b.startTime) || (a.createdAt ?? 0) - (b.createdAt ?? 0),
    );
  }

  async createSchedule(input: NewSchedule): Promise<string> {
    const deviceId = this.requireDevice();
    const id = push(ref(database, `schedules/${deviceId}`)).key!; // generated offline too
    const now = Date.now();
    const data: ScheduleData = {
      name: input.name?.trim() || `Schedule ${this.getSchedules().length + 1}`,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      temperature: input.temperature,
      mode: input.mode,
      days: normalizeDays(input.days),
      enabled: input.enabled ?? true,
      timezone: DEFAULT_TIMEZONE,
      createdBy: auth.currentUser?.uid ?? '',
      createdAt: now,
      updatedAt: now,
      lastStartDate: null,
    };
    await this.enqueue({ type: 'set', id, data });
    return id;
  }

  /**
   * Change a schedule. If the time or days change, `lastStartDate` is reset
   * so the edited schedule can still run today.
   */
  async updateSchedule(id: string, changes: Partial<NewSchedule>): Promise<void> {
    const data: Partial<ScheduleData> = { ...changes, updatedAt: Date.now() };
    if (changes.days) data.days = normalizeDays(changes.days);
    if (changes.startTime !== undefined || changes.days !== undefined || changes.durationMinutes !== undefined) {
      data.lastStartDate = null;
    }
    await this.enqueue({ type: 'update', id, data });
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await this.enqueue({ type: 'update', id, data: { enabled, updatedAt: Date.now() } });
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.enqueue({ type: 'delete', id });
  }

  /** Remove every schedule of a device, in Firebase and on the phone (used on unclaim). */
  async deleteAllForDevice(deviceId: string): Promise<void> {
    if (this.deviceId === deviceId) this.stop();
    await AsyncStorage.multiRemove([cacheKey(deviceId), outboxKey(deviceId)]).catch(() => undefined);
    await remove(ref(database, `schedules/${deviceId}`));
  }

  // ------------------------------------------------------------ internals

  private requireDevice(): string {
    if (!this.deviceId) throw new Error('No device claimed');
    return this.deviceId;
  }

  private emit(): void {
    const schedules = this.getSchedules();
    this.listeners.forEach((listener) => listener(schedules));
  }

  /** Save a change in the outbox (on the phone) first, then try to send it. */
  private async enqueue(op: OutboxOp): Promise<void> {
    const deviceId = this.requireDevice();
    this.outbox.push(op);
    await writeJson(outboxKey(deviceId), this.outbox);
    this.emit();
    // Don't make the UI wait for the network: offline, this would never resolve.
    this.flush();
  }

  /** Send queued changes to Firebase, in order. Stops at the first failure. */
  private async flush(): Promise<void> {
    if (this.flushing || !this.deviceId || !this.online) return;
    this.flushing = true;
    const deviceId = this.deviceId;
    try {
      while (this.outbox.length > 0 && this.deviceId === deviceId) {
        const op = this.outbox[0];
        const path = `schedules/${deviceId}/${op.id}`;
        if (op.type === 'set') await set(ref(database, path), op.data);
        else if (op.type === 'update') await update(ref(database, path), op.data);
        else await remove(ref(database, path));

        this.outbox.shift();
        await writeJson(outboxKey(deviceId), this.outbox);
        this.emit();
      }
    } catch (error) {
      console.warn('scheduleService - sync failed, will retry when online', error);
    } finally {
      this.flushing = false;
    }
  }

  /**
   * One-time move of schedules from the old phone-based scheduler
   * ("07:00 AM" text times, stored only on this phone) into Firebase.
   * Old schedules become "every day" with the "electric" mode.
   */
  private async migrateLegacySchedules(deviceId: string): Promise<void> {
    const legacy = await readJson<any[]>(LEGACY_SCHEDULES_KEY, []);
    for (const old of legacy) {
      // Stop (and keep the old data for next time) if the user switched device meanwhile.
      if (this.deviceId !== deviceId) return;
      const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(old?.time ?? '').trim());
      if (!match) continue;
      await this.createSchedule({
        name: old.name,
        startTime: to24Hour(Number(match[1]), Number(match[2]), match[3].toUpperCase() as 'AM' | 'PM'),
        durationMinutes: Math.min(1440, Math.max(1, Number(old.duration) || 30)),
        temperature: Math.min(100, Math.max(30, Number(old.temperature) || 45)),
        mode: 'electric',
        days: EVERY_DAY,
        enabled: old.enabled !== false,
      });
    }
    // The old phone scheduler's keys are no longer used.
    await AsyncStorage.multiRemove(LEGACY_KEYS).catch(() => undefined);
  }
}

export const scheduleService = new ScheduleService();
