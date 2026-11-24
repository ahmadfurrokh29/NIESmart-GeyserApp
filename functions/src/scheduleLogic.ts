/**
 * Pure scheduling logic: no Firebase calls here, so it can be unit-tested.
 *
 * Every minute the Cloud Function gives this file:
 *   - the current time,
 *   - all schedules of one device,
 *   - which schedule (if any) is currently running on that device,
 * and gets back the exact database changes to make.
 *
 * Rules, in plain English:
 *   1. A schedule is "open" from its start time until (not including) its
 *      end time, on one of its selected days (in its timezone).
 *      If the end time is earlier than the start time (e.g. 23:00 → 01:00),
 *      the window crosses midnight and belongs to the day it started on.
 *   2. Each schedule starts at most once per occurrence. We remember the
 *      occurrence date in `lastStartDate`. So if the user turns the geyser
 *      off by hand halfway, the schedule does NOT switch it back on.
 *   3. When an open, not-yet-started schedule is found, the geyser is
 *      turned on with that schedule's temperature and mode. If several
 *      start together, the one that started most recently wins.
 *   4. When the running schedule (`activeScheduleId`) ends, or is disabled
 *      or deleted, the function goes BACK to another schedule whose window
 *      is still open (e.g. A 7:00-8:00 and B 7:15-7:45: at 7:45 the geyser
 *      returns to A's temperature and mode until 8:00). If several are
 *      still open, the one that started most recently is used. If none is
 *      open, the geyser is turned off.
 *   5. Before the first schedule takes control, the geyser's own settings
 *      (isOn, target_Temp, mode) are saved in DEVICES/{id}/beforeSchedule.
 *      When no schedule is open any more, they are RESTORED: e.g. geyser on
 *      by hand at 40 °C, schedule 7:00-7:30 at 60 °C, at 7:30 it goes back
 *      to 40 °C and stays on. If it was off before, it is turned off.
 *   6. When the user changes on/off, temperature or mode by hand, the app
 *      clears `activeScheduleId` and `beforeSchedule`: the running schedule
 *      stops controlling the geyser for today (it still runs on its next
 *      day), nothing is restored, and the manual choice is never overridden.
 */

export type Mode = 'electric' | 'gas' | 'hybrid';

export interface Schedule {
  name?: string;
  /** Local start time, 24-hour "HH:mm", e.g. "19:00". */
  startTime: string;
  /** Local end time, 24-hour "HH:mm". Earlier than startTime = ends next day. */
  endTime: string;
  /** @deprecated Old field, only read when endTime is missing. */
  durationMinutes?: number;
  temperature: number;
  mode: Mode;
  /** Days of the week the schedule runs on. 0 = Sunday … 6 = Saturday. */
  days: number[];
  enabled: boolean;
  /** IANA timezone, e.g. "Asia/Karachi". */
  timezone?: string;
  /** Local date ("YYYY-MM-DD") of the occurrence this schedule last started. */
  lastStartDate?: string | null;
}

/** The geyser's own settings, saved before a schedule takes control. */
export interface SavedSettings {
  isOn: boolean;
  target_Temp?: number;
  mode?: string;
}

/** What the function reads from DEVICES/{deviceId}. */
export interface DeviceScheduleState {
  activeScheduleId?: string | null;
  isOn?: boolean;
  target_Temp?: number;
  mode?: string;
  beforeSchedule?: SavedSettings | null;
}

/** Copies only the settings that are present and valid. */
function snapshotSettings(device: DeviceScheduleState | null | undefined): SavedSettings {
  const saved: SavedSettings = { isOn: device?.isOn === true };
  if (typeof device?.target_Temp === 'number' && Number.isFinite(device.target_Temp)) {
    saved.target_Temp = device.target_Temp;
  }
  if (typeof device?.mode === 'string' && device.mode) saved.mode = device.mode;
  return saved;
}

export interface DevicePlan {
  /** Fields to write under DEVICES/{deviceId}. Empty when nothing changes. */
  deviceUpdates: Record<string, unknown>;
  /** Fields to write under schedules/{deviceId}/{scheduleId}. */
  scheduleUpdates: Record<string, Record<string, unknown>>;
  /** Short human-readable notes, used for logging. */
  log: string[];
}

export const DEFAULT_TIMEZONE = 'Asia/Karachi';
export const MIN_TEMPERATURE = 30;
export const MAX_TEMPERATURE = 100;
const VALID_MODES: readonly Mode[] = ['electric', 'gas', 'hybrid'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface LocalDay {
  /** "YYYY-MM-DD" */
  date: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

interface LocalNow {
  today: LocalDay;
  yesterday: LocalDay;
  /** Minutes since local midnight, 0–1439. */
  minuteOfDay: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Breaks `now` into the local date, weekday and minute in `timeZone`. */
export function getLocalNow(now: Date, timeZone: string): LocalNow {
  const parts: Record<string, string> = {};
  for (const part of getFormatter(timeZone).formatToParts(now)) {
    parts[part.type] = part.value;
  }
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const weekday = WEEKDAYS.indexOf(parts.weekday);

  // Calendar arithmetic on a UTC date, so it is not affected by timezones.
  const prev = new Date(Date.UTC(year, month - 1, day - 1));

  return {
    today: { date: `${year}-${pad(month)}-${pad(day)}`, weekday },
    yesterday: {
      date: `${prev.getUTCFullYear()}-${pad(prev.getUTCMonth() + 1)}-${pad(prev.getUTCDate())}`,
      weekday: (weekday + 6) % 7,
    },
    minuteOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Parses "HH:mm" (24-hour) into minutes since midnight, or null if invalid. */
export function parseStartTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Returns why a schedule is invalid, or null if it is usable. */
export function validateSchedule(schedule: Partial<Schedule> | null | undefined): string | null {
  if (!schedule || typeof schedule !== 'object') return 'not an object';
  if (parseStartTime(schedule.startTime) === null) return `bad startTime "${schedule.startTime}"`;
  if (getWindowMinutes(schedule) === null) {
    return parseStartTime(schedule.endTime) === null && schedule.endTime !== undefined
      ? `bad endTime "${schedule.endTime}"`
      : 'end time missing or same as start time';
  }
  const temp = schedule.temperature;
  if (typeof temp !== 'number' || !Number.isFinite(temp) || temp < MIN_TEMPERATURE || temp > MAX_TEMPERATURE) {
    return `bad temperature "${temp}"`;
  }
  if (!VALID_MODES.includes(schedule.mode as Mode)) return `bad mode "${schedule.mode}"`;
  if (!Array.isArray(schedule.days) || schedule.days.length === 0) return 'no days selected';
  if (!schedule.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return 'bad days';
  return null;
}

/**
 * How long the schedule's window is, in minutes (1–1439), worked out from
 * startTime and endTime. Returns null if invalid or if end equals start.
 * Older schedules that only have `durationMinutes` are still understood.
 */
export function getWindowMinutes(schedule: Partial<Schedule>): number | null {
  const start = parseStartTime(schedule.startTime);
  if (start === null) return null;
  if (schedule.endTime !== undefined) {
    const end = parseStartTime(schedule.endTime);
    if (end === null || end === start) return null;
    return (end - start + 24 * 60) % (24 * 60);
  }
  const legacy = schedule.durationMinutes;
  if (typeof legacy === 'number' && Number.isFinite(legacy) && legacy >= 1 && legacy < 24 * 60) return legacy;
  return null;
}

/**
 * Firebase Realtime Database may return arrays as objects ({"0": 1, "1": 3}).
 * This turns either shape into a plain number array.
 */
export function normalizeDays(days: unknown): number[] {
  if (Array.isArray(days)) return days.filter((d) => d !== null && d !== undefined).map(Number);
  if (days && typeof days === 'object') return Object.values(days).map(Number);
  return [];
}

export interface OpenOccurrence {
  /** Local date the occurrence started on, "YYYY-MM-DD". */
  date: string;
  /** Minutes since the occurrence started. */
  elapsedMinutes: number;
}

/**
 * If the schedule's window is open right now, returns which occurrence it is.
 * Checks today's start and, for windows that cross midnight, yesterday's start.
 */
export function findOpenOccurrence(schedule: Schedule, now: Date): OpenOccurrence | null {
  const startMinute = parseStartTime(schedule.startTime);
  const windowMinutes = getWindowMinutes(schedule);
  if (startMinute === null || windowMinutes === null) return null;
  const local = getLocalNow(now, schedule.timezone || DEFAULT_TIMEZONE);
  const days = normalizeDays(schedule.days);

  const candidates: Array<{ day: LocalDay; elapsed: number }> = [
    { day: local.today, elapsed: local.minuteOfDay - startMinute },
    { day: local.yesterday, elapsed: local.minuteOfDay + 24 * 60 - startMinute },
  ];

  for (const { day, elapsed } of candidates) {
    if (elapsed >= 0 && elapsed < windowMinutes && days.includes(day.weekday)) {
      return { date: day.date, elapsedMinutes: elapsed };
    }
  }
  return null;
}

/**
 * Decides what to change for ONE device, given all its schedules.
 * Never throws on bad data: invalid schedules are skipped and logged.
 */
export function planDevice(
  schedules: Record<string, Partial<Schedule> | null> | null | undefined,
  device: DeviceScheduleState | null | undefined,
  now: Date,
): DevicePlan {
  const plan: DevicePlan = { deviceUpdates: {}, scheduleUpdates: {}, log: [] };
  const activeId = device?.activeScheduleId || null;

  // Collect every valid, enabled schedule whose window is open right now:
  // `starting` = not yet started for this occurrence, `resumable` = already started.
  const starting: { id: string; schedule: Schedule; occurrence: OpenOccurrence }[] = [];
  const resumable: { id: string; schedule: Schedule; occurrence: OpenOccurrence }[] = [];
  let activeStillOpen = false;

  for (const [id, raw] of Object.entries(schedules || {})) {
    if (!raw) continue;
    const schedule = { ...raw, days: normalizeDays(raw.days) } as Schedule;
    const problem = validateSchedule(schedule);
    if (problem) {
      plan.log.push(`skip ${id}: ${problem}`);
      continue;
    }
    if (!schedule.enabled) continue;

    const occurrence = findOpenOccurrence(schedule, now);
    if (!occurrence) continue;

    if (id === activeId) activeStillOpen = true;
    if (schedule.lastStartDate !== occurrence.date) {
      starting.push({ id, schedule, occurrence });
    } else if (id !== activeId) {
      resumable.push({ id, schedule, occurrence });
    }
  }

  // Most recently started first (smallest elapsed). Ties: stable order by id.
  type Candidate = { id: string; occurrence: OpenOccurrence };
  const byMostRecent = (a: Candidate, b: Candidate) =>
    a.occurrence.elapsedMinutes - b.occurrence.elapsedMinutes || a.id.localeCompare(b.id);

  if (starting.length > 0) {
    starting.sort(byMostRecent);
    const winner = starting[0];

    plan.deviceUpdates = {
      isOn: true,
      target_Temp: winner.schedule.temperature,
      mode: winner.schedule.mode,
      activeScheduleId: winner.id,
    };
    // First schedule taking control: remember the geyser's own settings.
    // (When one schedule takes over from another, keep the original ones.)
    if (!activeId) plan.deviceUpdates.beforeSchedule = snapshotSettings(device);
    // Mark every schedule that opened as started, so a losing schedule
    // doesn't take over later in the same window.
    for (const { id, occurrence } of starting) {
      plan.scheduleUpdates[id] = { lastStartDate: occurrence.date };
    }
    plan.log.push(
      `start ${winner.id} (${winner.schedule.startTime}–${winner.schedule.endTime ?? '?'}, ${winner.schedule.temperature}°C, ${winner.schedule.mode})` +
        (starting.length > 1 ? `; also marked ${starting.slice(1).map((s) => s.id).join(', ')}` : ''),
    );
    return plan;
  }

  // Nothing new to start. If the running schedule is over (or was disabled /
  // deleted / became invalid), go back to another schedule that is still
  // open, or turn the geyser off.
  if (activeId && !activeStillOpen) {
    if (resumable.length > 0) {
      resumable.sort(byMostRecent);
      const back = resumable[0];
      plan.deviceUpdates = {
        isOn: true,
        target_Temp: back.schedule.temperature,
        mode: back.schedule.mode,
        activeScheduleId: back.id,
      };
      plan.log.push(`${activeId} ended; back to ${back.id} (${back.schedule.temperature}°C, ${back.schedule.mode})`);
    } else {
      const saved = device?.beforeSchedule;
      if (saved) {
        // Put back what the geyser was doing before the schedules.
        plan.deviceUpdates = { ...saved, isOn: saved.isOn === true, activeScheduleId: null, beforeSchedule: null };
        plan.log.push(`stop ${activeId}; restored ${saved.isOn ? 'ON' : 'OFF'} ${saved.target_Temp ?? ''} ${saved.mode ?? ''}`);
      } else {
        plan.deviceUpdates = { isOn: false, activeScheduleId: null };
        plan.log.push(`stop ${activeId}`);
      }
    }
  }

  return plan;
}
