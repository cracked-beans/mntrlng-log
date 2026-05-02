import { differenceInCalendarDays, parseISO, startOfMonth } from 'date-fns';
import type { Attachment, Entry } from '@/db/schema';
import { COMPONENT_LIST, type ComponentStatus, getComponentEmoji, getComponentLabel } from './components';

export interface DayBucket {
  date: string;
  entries: Entry[];
  /** Most-trained component on that day, used as the heatmap glyph. */
  dominantKey?: string;
  emoji?: string;
}

/** Map YYYY-MM-DD → DayBucket. */
export function bucketByDay(entries: Entry[]): Map<string, DayBucket> {
  const byDay = new Map<string, DayBucket>();
  for (const e of entries) {
    let b = byDay.get(e.date);
    if (!b) {
      b = { date: e.date, entries: [] };
      byDay.set(e.date, b);
    }
    b.entries.push(e);
  }
  for (const b of byDay.values()) {
    const counts = new Map<string, number>();
    for (const e of b.entries) {
      for (const c of e.components) {
        counts.set(c.key, (counts.get(c.key) ?? 0) + 1);
      }
    }
    let topKey: string | undefined;
    let topCount = 0;
    for (const [k, n] of counts) {
      if (n > topCount) { topCount = n; topKey = k; }
    }
    if (topKey) {
      b.dominantKey = topKey;
      b.emoji = getComponentEmoji(topKey);
    }
  }
  return byDay;
}

export interface ComponentStat {
  key: string;
  label: string;
  emoji: string;
  count: number;
  goodPct: number;
}

export function componentStats(entries: Entry[]): ComponentStat[] {
  const acc = new Map<string, { total: number; good: number; customLabel?: string }>();
  for (const e of entries) {
    for (const c of e.components) {
      const a = acc.get(c.key) ?? { total: 0, good: 0, customLabel: c.customLabel };
      a.total += 1;
      if ((c.status as ComponentStatus) === 'good') a.good += 1;
      acc.set(c.key, a);
    }
  }
  return [...acc.entries()]
    .map(([key, v]) => ({
      key,
      label: getComponentLabel(key, v.customLabel),
      emoji: getComponentEmoji(key),
      count: v.total,
      goodPct: v.total ? Math.round((v.good / v.total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

/** Count entries per month, last 12 months including current, in chronological order. */
export function monthlyCounts(entries: Entry[]): Array<{ month: string; count: number }> {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const counts: Record<string, number> = Object.fromEntries(labels.map((l) => [l, 0]));
  for (const e of entries) {
    const k = e.date.slice(0, 7);
    if (k in counts) counts[k] += 1;
  }
  return labels.map((m) => ({ month: m, count: counts[m] }));
}

export type MonthlyByType = {
  month: string;
  Intensity: number;
  'Delayed Start': number;
  'Scent Article': number;
  Casting: number;
  Flip: number;
};

/** Count entries per month by typeOfStart, last 12 months including current, in chronological order. */
export function monthlyCountsByType(entries: Entry[]): MonthlyByType[] {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const zero = () => ({ Intensity: 0, 'Delayed Start': 0, 'Scent Article': 0, Casting: 0, Flip: 0 });
  const counts: Record<string, ReturnType<typeof zero>> = Object.fromEntries(labels.map((l) => [l, zero()]));
  for (const e of entries) {
    const k = e.date.slice(0, 7);
    if (k in counts && e.typeOfStart && e.typeOfStart in counts[k]) {
      (counts[k] as Record<string, number>)[e.typeOfStart] += 1;
    }
  }
  return labels.map((m) => ({ month: m, ...counts[m] }));
}

export interface MixSlice { name: string; value: number }
export function variableMix(entries: Entry[], pick: (e: Entry) => string | undefined): MixSlice[] {
  const m = new Map<string, number>();
  for (const e of entries) {
    const v = pick(e);
    if (!v) continue;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export const RATING_MEASURES = [
  { key: 'handler',         label: 'Handler avg',      group: 'handler' },
  { key: 'dog',             label: 'Dog avg',           group: 'dog'     },
  { key: 'startingRoutine', label: 'Starting routine',  group: 'handler' },
  { key: 'leashHandling',   label: 'Leash handling',    group: 'handler' },
  { key: 'bodyPosition',    label: 'Body position',     group: 'handler' },
  { key: 'readingTheDog',   label: 'Reading the dog',   group: 'handler' },
  { key: 'motivation',      label: 'Motivation',        group: 'dog'     },
  { key: 'confidence',      label: 'Confidence',        group: 'dog'     },
  { key: 'negatives',       label: 'Negatives',         group: 'dog'     },
  { key: 'other',           label: 'Other',             group: 'dog'     },
] as const;
export type RatingMeasureKey = typeof RATING_MEASURES[number]['key'];

export interface RatingPoint {
  date: string;
  handler?: number; dog?: number;
  startingRoutine?: number; leashHandling?: number; bodyPosition?: number; readingTheDog?: number;
  motivation?: number; confidence?: number; negatives?: number; other?: number;
}
export function ratingsTrend(entries: Entry[], days = 90): RatingPoint[] {
  const cutoffISO = isFinite(days)
    ? (() => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); })()
    : '0000-00-00';
  return entries
    .filter((e) => e.date >= cutoffISO)
    .map((e) => {
      const handler = avg([e.handlerEval?.startingRoutine, e.handlerEval?.leashHandling, e.handlerEval?.bodyPosition, e.handlerEval?.readingTheDog]);
      const dog = avg([e.dogEval?.motivation, e.dogEval?.confidence, e.dogEval?.negatives, e.dogEval?.other]);
      return {
        date: e.date,
        handler,
        dog,
        startingRoutine: e.handlerEval?.startingRoutine,
        leashHandling: e.handlerEval?.leashHandling,
        bodyPosition: e.handlerEval?.bodyPosition,
        readingTheDog: e.handlerEval?.readingTheDog,
        motivation: e.dogEval?.motivation,
        confidence: e.dogEval?.confidence,
        negatives: e.dogEval?.negatives,
        other: e.dogEval?.other,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function avg(xs: (number | undefined)[]): number | undefined {
  const v = xs.filter((x): x is number => typeof x === 'number');
  if (!v.length) return undefined;
  return Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(2));
}

export function streaks(entries: Entry[]): { current: number; longest: number } {
  if (!entries.length) return { current: 0, longest: 0 };
  const dates = [...new Set(entries.map((e) => e.date))].sort();
  let longest = 1, current = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(parseISO(dates[i]), parseISO(dates[i - 1]));
    if (diff === 1) current += 1; else current = 1;
    if (current > longest) longest = current;
  }
  // current run continues only if the last date is within 1 day of today
  const lastDiff = differenceInCalendarDays(new Date(), parseISO(dates[dates.length - 1]));
  return { current: lastDiff <= 1 ? current : 0, longest };
}

export function totalGpxMeters(attachments: Attachment[]): number {
  return attachments.filter((a) => a.kind === 'gpx' && a.gpxRole === 'dog')
    .reduce((s, a) => s + (a.gpxLengthM ?? 0), 0);
}

export const STANDARD_COMPONENT_KEYS = COMPONENT_LIST.map((c) => c.key);
