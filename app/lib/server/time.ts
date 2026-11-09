// Jobs happen in South Florida, so service dates and windows are Florida local time (README 9.4).
export const SERVICE_TZ = 'America/New_York';

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: SERVICE_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function floridaParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

/** Today's date in Florida as YYYY-MM-DD. */
export function todayInFlorida(now = new Date()) {
  const { y, m, d } = floridaParts(now);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Minutes since midnight, Florida time. */
export function nowMinutesInFlorida(now = new Date()) {
  const { h, mi } = floridaParts(now);
  return h * 60 + mi;
}

/** The UTC instant for a Florida local date + "HH:MM" (handles DST). */
export function floridaToUtc(isoDate: string, time: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const asUtc = Date.UTC(y, m - 1, d, h, mi);
  // Offset = how far Florida wall-clock is from UTC at that moment; check twice for DST edges.
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = floridaParts(new Date(guess));
    const wall = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
    guess = asUtc - (wall - guess);
  }
  return new Date(guess);
}

// Postgres DATE columns come back as midnight-UTC Date objects.
export const toDbDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const fromDbDate = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, days: number) {
  const d = toDbDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromDbDate(d);
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (min: number) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** "14:00" → "2:00 PM" */
export function slotLabel(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
