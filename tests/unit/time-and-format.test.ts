import { describe, expect, it } from 'vitest';
import { addDays, floridaToUtc, fromDbDate, fromMinutes, nowMinutesInFlorida, slotLabel, toDbDate, todayInFlorida, toMinutes } from '@/app/lib/server/time';
import { durationLabel, formatDate, initials, money, timeLabel, windowLabel } from '@/app/lib/api/format';

describe('Florida time', () => {
  it('converts Florida wall-clock time to UTC across daylight saving', () => {
    expect(floridaToUtc('2026-07-01', '08:00').toISOString()).toBe('2026-07-01T12:00:00.000Z'); // EDT, UTC-4
    expect(floridaToUtc('2026-12-01', '08:00').toISOString()).toBe('2026-12-01T13:00:00.000Z'); // EST, UTC-5
    expect(floridaToUtc('2026-11-01', '09:00').toISOString()).toBe('2026-11-01T14:00:00.000Z'); // the day DST ends
  });

  it("uses Florida's date, not UTC's, near midnight", () => {
    const lateEvening = new Date('2026-11-06T03:30:00Z'); // 10:30 PM on Nov 5 in Florida
    expect(todayInFlorida(lateEvening)).toBe('2026-11-05');
    expect(nowMinutesInFlorida(lateEvening)).toBe(22 * 60 + 30);
  });

  it('round-trips DATE columns and adds days across months and years', () => {
    expect(fromDbDate(toDbDate('2026-02-28'))).toBe('2026-02-28');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('converts HH:MM to minutes and back, and labels slots', () => {
    expect(toMinutes('13:30')).toBe(810);
    expect(fromMinutes(810)).toBe('13:30');
    expect(slotLabel('00:00')).toBe('12:00 AM');
    expect(slotLabel('12:00')).toBe('12:00 PM');
    expect(slotLabel('19:00')).toBe('7:00 PM');
  });
});

describe('UI formatting', () => {
  it('formats calendar dates without a time-zone shift', () => {
    expect(formatDate('2026-11-08')).toBe('Nov 8, 2026');
    expect(formatDate(null)).toBe('—');
    expect(formatDate('garbage')).toBe('—');
  });
  it('shows a confirmed window, or the requested slot', () => {
    expect(windowLabel({ windowStart: '08:00', windowEnd: '10:00', preferredSlot: '08:00' })).toBe('8:00 AM - 10:00 AM');
    expect(windowLabel({ windowStart: null, windowEnd: null, preferredSlot: '14:00' })).toBe('2:00 PM (requested)');
    expect(timeLabel(undefined)).toBe('');
  });
  it('formats money and durations', () => {
    expect(money(21000)).toBe('$210');
    expect(money(1050)).toBe('$10.50');
    expect(money(null)).toBe('—');
    expect(durationLabel(45)).toBe('45 min');
    expect(durationLabel(60)).toBe('1 hour');
    expect(durationLabel(90)).toBe('1.5 hours');
  });
  it('builds initials', () => {
    expect(initials('John Doe')).toBe('JD');
    expect(initials('Mary Ann Smith')).toBe('MS');
    expect(initials('cher')).toBe('CH');
  });
});
