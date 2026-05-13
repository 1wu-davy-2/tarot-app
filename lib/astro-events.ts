// Astronomical events for transit calendar & electional divination.
// Pure JS — no external library needed for calendar markers (±1 day precision).

export type AstroEventType = "new-moon" | "full-moon" | "mercury-rx" | "venus-rx";

export interface AstroEvent {
  type: AstroEventType;
  label: string;      // Chinese label
  icon: string;       // Unicode symbol
  date: string;       // "YYYY-MM-DD"
}

// ── Moon Phase Calculation ──

// Known new moon reference: January 6, 2000, 18:14 UTC
const NEW_MOON_REF = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime();
const SYNODIC_MONTH = 29.53058867; // days

function getMoonPhase(date: Date): number {
  // Returns phase from 0 (new moon) to 1 (next new moon)
  const msPerDay = 86400000;
  const elapsed = (date.getTime() - NEW_MOON_REF) / msPerDay;
  const phase = (elapsed % SYNODIC_MONTH) / SYNODIC_MONTH;
  return phase < 0 ? phase + 1 : phase;
}

export function getMoonPhaseEmoji(date: Date): string {
  const phase = getMoonPhase(date);
  if (phase < 0.03 || phase > 0.97) return "🌑";     // new moon (±1 day)
  if (phase > 0.47 && phase < 0.53) return "🌕";      // full moon (±1 day)
  if (phase < 0.25) return "🌒";                       // waxing crescent
  if (phase < 0.50) return "🌓";                       // waxing gibbous
  if (phase < 0.75) return "🌖";                       // waning gibbous
  return "🌘";                                         // waning crescent
}

export function getMoonPhaseName(date: Date): string {
  const phase = getMoonPhase(date);
  if (phase < 0.03 || phase > 0.97) return "新月";
  if (phase > 0.47 && phase < 0.53) return "满月";
  if (phase < 0.25) return "蛾眉月";
  if (phase < 0.50) return "上弦月";
  if (phase < 0.75) return "亏月";
  return "残月";
}

export function isNewMoon(date: Date): boolean {
  const p = getMoonPhase(date);
  return p < 0.03 || p > 0.97;
}

export function isFullMoon(date: Date): boolean {
  const p = getMoonPhase(date);
  return p > 0.47 && p < 0.53;
}

// ── Planetary Retrograde Periods 2026 ──

interface RetrogradePeriod {
  start: string;   // "YYYY-MM-DD"
  end: string;     // "YYYY-MM-DD"
}

// Source: Swiss Ephemeris / astro.com ephemeris
const MERCURY_RETROGRADE_2026: RetrogradePeriod[] = [
  { start: "2026-02-26", end: "2026-03-20" },
  { start: "2026-06-20", end: "2026-07-14" },
  { start: "2026-10-13", end: "2026-11-06" },
];

const VENUS_RETROGRADE_2026: RetrogradePeriod[] = [
  // No Venus retrograde in 2026 (next one starts Jan 2027)
];

export function getRetrogradeStatus(dateStr: string): AstroEventType | null {
  for (const p of MERCURY_RETROGRADE_2026) {
    if (dateStr >= p.start && dateStr <= p.end) return "mercury-rx";
  }
  for (const p of VENUS_RETROGRADE_2026) {
    if (dateStr >= p.start && dateStr <= p.end) return "venus-rx";
  }
  return null;
}

// ── Astro events for a given date ──

export function getAstroEventsForDate(dateStr: string): AstroEvent[] {
  const events: AstroEvent[] = [];
  const date = new Date(dateStr + "T12:00:00"); // noon UTC to avoid timezone issues

  // Moon phase
  if (isNewMoon(date)) {
    events.push({ type: "new-moon", label: "新月", icon: "🌑", date: dateStr });
  } else if (isFullMoon(date)) {
    events.push({ type: "full-moon", label: "满月", icon: "🌕", date: dateStr });
  }

  // Retrograde
  const rxType = getRetrogradeStatus(dateStr);
  if (rxType === "mercury-rx") {
    events.push({ type: "mercury-rx", label: "水逆", icon: "☿", date: dateStr });
  } else if (rxType === "venus-rx") {
    events.push({ type: "venus-rx", label: "金逆", icon: "♀", date: dateStr });
  }

  return events;
}

// ── Month-level event map ──

export function getAstroEventsForMonth(year: number, month: number): Map<string, AstroEvent[]> {
  const map = new Map<string, AstroEvent[]>();
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const events = getAstroEventsForDate(dateStr);
    if (events.length > 0) {
      map.set(dateStr, events);
    }
  }

  return map;
}

// ── Electional divination templates ──

export const ELECTIONAL_TEMPLATES = [
  { label: "这天适合表白吗？", question: "今天适合表白/推进感情吗？请结合天象给出建议。" },
  { label: "这天适合签约吗？", question: "今天适合签订重要合约或做重大决定吗？" },
  { label: "这天适合出行吗？", question: "今天适合出行/旅行吗？有什么需要注意的？" },
  { label: "这天运势如何？", question: "今天我的运势如何？有什么需要留意的？" },
];
