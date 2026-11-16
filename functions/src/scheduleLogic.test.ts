import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  findOpenOccurrence,
  getWindowMinutes,
  getLocalNow,
  normalizeDays,
  parseStartTime,
  planDevice,
  Schedule,
  validateSchedule,
} from './scheduleLogic';

/** Builds a Date for a wall-clock time in Pakistan (UTC+5, no daylight saving). */
function pkt(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h - 5, min));
}

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

function schedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    startTime: '07:00',
    endTime: '07:30',
    temperature: 50,
    mode: 'gas',
    days: EVERY_DAY,
    enabled: true,
    timezone: 'Asia/Karachi',
    ...overrides,
  };
}

// Reference dates (2026): 16 Nov = Monday, 17 Nov = Tuesday, 21 Nov = Saturday.
const MON = '2026-11-16';
const TUE = '2026-11-17';
const SAT = '2026-11-21';

describe('getLocalNow', () => {
  it('converts UTC to Pakistan date, weekday and minute', () => {
    const local = getLocalNow(new Date('2026-11-15T20:30:00Z'), 'Asia/Karachi');
    assert.deepEqual(local.today, { date: MON, weekday: 1 });
    assert.deepEqual(local.yesterday, { date: '2026-11-15', weekday: 0 });
    assert.equal(local.minuteOfDay, 90); // 01:30
  });

  it('handles month and year boundaries for "yesterday"', () => {
    const local = getLocalNow(pkt('2027-01-01', '06:00'), 'Asia/Karachi');
    assert.equal(local.today.date, '2027-01-01');
    assert.equal(local.yesterday.date, '2026-12-31');
  });
});

describe('parseStartTime / validateSchedule / normalizeDays', () => {
  it('parses valid 24-hour times', () => {
    assert.equal(parseStartTime('00:00'), 0);
    assert.equal(parseStartTime('07:05'), 425);
    assert.equal(parseStartTime('23:59'), 1439);
    assert.equal(parseStartTime('7:05'), 425);
  });

  it('rejects invalid times', () => {
    for (const bad of ['24:00', '12:60', '07:00 AM', '', 'abc', undefined, 700]) {
      assert.equal(parseStartTime(bad), null, String(bad));
    }
  });

  it('accepts a good schedule and explains bad ones', () => {
    assert.equal(validateSchedule(schedule()), null);
    assert.match(validateSchedule(schedule({ mode: 'solar' as never }))!, /mode/);
    assert.match(validateSchedule(schedule({ days: [] }))!, /no days/);
    assert.match(validateSchedule(schedule({ days: [7] }))!, /bad days/);
    assert.match(validateSchedule(schedule({ temperature: 120 }))!, /temperature/);
    assert.match(validateSchedule(schedule({ endTime: '07:00' }))!, /same as start/);
    assert.match(validateSchedule(schedule({ endTime: '25:00' }))!, /bad endTime/);
    assert.match(validateSchedule(null)!, /not an object/);
  });

  it('accepts days stored by Firebase as an object', () => {
    assert.deepEqual(normalizeDays({ 0: 1, 1: 3 }), [1, 3]);
    assert.deepEqual(normalizeDays([1, null, 3]), [1, 3]);
    assert.deepEqual(normalizeDays(undefined), []);
  });
});

describe('getWindowMinutes', () => {
  it('works out the length from start and end time', () => {
    assert.equal(getWindowMinutes(schedule({ startTime: '07:00', endTime: '07:30' })), 30);
    assert.equal(getWindowMinutes(schedule({ startTime: '23:00', endTime: '01:00' })), 120); // overnight
    assert.equal(getWindowMinutes(schedule({ startTime: '07:00', endTime: '06:59' })), 1439);
    assert.equal(getWindowMinutes(schedule({ startTime: '07:00', endTime: '07:00' })), null);
  });

  it('still understands old schedules that only have durationMinutes', () => {
    const old = { ...schedule(), endTime: undefined, durationMinutes: 45 };
    assert.equal(getWindowMinutes(old), 45);
    assert.equal(validateSchedule(old), null);
  });
});

describe('findOpenOccurrence', () => {
  it('is open from the start minute until just before the end', () => {
    const s = schedule({ startTime: '07:00', endTime: '07:30' });
    assert.equal(findOpenOccurrence(s, pkt(MON, '06:59')), null);
    assert.deepEqual(findOpenOccurrence(s, pkt(MON, '07:00')), { date: MON, elapsedMinutes: 0 });
    assert.deepEqual(findOpenOccurrence(s, pkt(MON, '07:29')), { date: MON, elapsedMinutes: 29 });
    assert.equal(findOpenOccurrence(s, pkt(MON, '07:30')), null);
  });

  it('respects the selected days of the week', () => {
    const s = schedule({ days: WEEKDAYS });
    assert.ok(findOpenOccurrence(s, pkt(MON, '07:10')));
    assert.equal(findOpenOccurrence(s, pkt(SAT, '07:10')), null);
  });

  it('handles a window that crosses midnight, counting it on the start day', () => {
    const s = schedule({ startTime: '23:30', endTime: '00:30', days: [1] }); // Monday only
    assert.deepEqual(findOpenOccurrence(s, pkt(MON, '23:45')), { date: MON, elapsedMinutes: 15 });
    assert.deepEqual(findOpenOccurrence(s, pkt(TUE, '00:15')), { date: MON, elapsedMinutes: 45 });
    assert.equal(findOpenOccurrence(s, pkt(TUE, '00:30')), null);
  });

  it('does not run an overnight window if the start day is not selected', () => {
    const s = schedule({ startTime: '23:30', endTime: '00:30', days: [2] }); // Tuesday only
    assert.equal(findOpenOccurrence(s, pkt(TUE, '00:15')), null); // that window started Monday
  });

  it('uses Asia/Karachi when the timezone is missing', () => {
    const s = schedule({ timezone: undefined });
    assert.ok(findOpenOccurrence(s, pkt(MON, '07:05')));
  });
});

describe('planDevice', () => {
  it('turns the geyser on when a schedule opens', () => {
    const plan = planDevice({ a: schedule() }, {}, pkt(MON, '07:00'));
    assert.deepEqual(plan.deviceUpdates, { isOn: true, target_Temp: 50, mode: 'gas', activeScheduleId: 'a' });
    assert.deepEqual(plan.scheduleUpdates, { a: { lastStartDate: MON } });
  });

  it('still starts a schedule that syncs late, while its window is open', () => {
    const plan = planDevice({ a: schedule({ startTime: '19:00' }) }, {}, pkt(MON, '19:10'));
    assert.equal(plan.deviceUpdates.isOn, true);
  });

  it('does nothing while the running schedule is still open', () => {
    const plan = planDevice({ a: schedule({ lastStartDate: MON }) }, { activeScheduleId: 'a' }, pkt(MON, '07:15'));
    assert.deepEqual(plan.deviceUpdates, {});
    assert.deepEqual(plan.scheduleUpdates, {});
  });

  it('turns the geyser off when the running schedule ends', () => {
    const plan = planDevice({ a: schedule({ lastStartDate: MON }) }, { activeScheduleId: 'a' }, pkt(MON, '07:30'));
    assert.deepEqual(plan.deviceUpdates, { isOn: false, activeScheduleId: null });
  });

  it('respects a manual "off" mid-schedule (does not switch it back on)', () => {
    // The app clears activeScheduleId when the user toggles the geyser by hand.
    const plan = planDevice({ a: schedule({ lastStartDate: MON }) }, { activeScheduleId: null }, pkt(MON, '07:15'));
    assert.deepEqual(plan.deviceUpdates, {});
  });

  it('respects a manual "on" (does not switch it off when the window ends)', () => {
    const plan = planDevice({ a: schedule({ lastStartDate: MON }) }, { activeScheduleId: null }, pkt(MON, '07:45'));
    assert.deepEqual(plan.deviceUpdates, {});
  });

  it('runs again on the next selected day', () => {
    const plan = planDevice({ a: schedule({ lastStartDate: MON }) }, {}, pkt(TUE, '07:00'));
    assert.deepEqual(plan.scheduleUpdates, { a: { lastStartDate: TUE } });
    assert.equal(plan.deviceUpdates.isOn, true);
  });

  it('does not run on days that are not selected', () => {
    const plan = planDevice({ a: schedule({ days: WEEKDAYS }) }, {}, pkt(SAT, '07:05'));
    assert.deepEqual(plan.deviceUpdates, {});
  });

  it('lets a later overlapping schedule take over, then stops at its end', () => {
    const schedules = {
      a: schedule({ startTime: '07:00', endTime: '08:00', temperature: 40, lastStartDate: MON }),
      b: schedule({ startTime: '07:15', endTime: '07:45', temperature: 70, mode: 'electric' }),
    };
    const takeover = planDevice(schedules, { activeScheduleId: 'a' }, pkt(MON, '07:15'));
    assert.deepEqual(takeover.deviceUpdates, { isOn: true, target_Temp: 70, mode: 'electric', activeScheduleId: 'b' });

    schedules.b.lastStartDate = MON;
    const end = planDevice(schedules, { activeScheduleId: 'b' }, pkt(MON, '07:45'));
    // "a" is still open but already ran today, so it does not restart.
    assert.deepEqual(end.deviceUpdates, { isOn: false, activeScheduleId: null });
  });

  it('when two open schedules start together, the most recent start wins and both are marked', () => {
    const schedules = {
      a: schedule({ startTime: '07:00', endTime: '08:00', temperature: 40 }),
      b: schedule({ startTime: '07:15', endTime: '07:45', temperature: 70 }),
    };
    const plan = planDevice(schedules, {}, pkt(MON, '07:20'));
    assert.equal(plan.deviceUpdates.activeScheduleId, 'b');
    assert.deepEqual(plan.scheduleUpdates, { a: { lastStartDate: MON }, b: { lastStartDate: MON } });
  });

  it('stops the geyser if the running schedule is disabled', () => {
    const plan = planDevice(
      { a: schedule({ lastStartDate: MON, enabled: false }) },
      { activeScheduleId: 'a' },
      pkt(MON, '07:10'),
    );
    assert.deepEqual(plan.deviceUpdates, { isOn: false, activeScheduleId: null });
  });

  it('stops the geyser if the running schedule is deleted', () => {
    const plan = planDevice({}, { activeScheduleId: 'gone' }, pkt(MON, '07:10'));
    assert.deepEqual(plan.deviceUpdates, { isOn: false, activeScheduleId: null });
  });

  it('skips invalid schedules without crashing and logs why', () => {
    const plan = planDevice(
      { bad: { startTime: '7am' } as Partial<Schedule>, empty: null, good: schedule() },
      {},
      pkt(MON, '07:00'),
    );
    assert.equal(plan.deviceUpdates.activeScheduleId, 'good');
    assert.ok(plan.log.some((line) => line.startsWith('skip bad')));
  });

  it('does nothing when there are no schedules and nothing is running', () => {
    const plan = planDevice(null, null, pkt(MON, '07:00'));
    assert.deepEqual(plan, { deviceUpdates: {}, scheduleUpdates: {}, log: [] });
  });
});
