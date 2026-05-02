import { useMemo, useState } from 'react';
import {
  addDays, format, startOfWeek, subDays,
  startOfMonth, getISOWeek, getYear,
  eachWeekOfInterval, eachMonthOfInterval, addMonths,
} from 'date-fns';
import type { Entry } from '@/db/schema';
import { bucketByDay, type DayBucket } from '@/domain/stats';
import { getComponentEmoji } from '@/domain/components';

interface Props {
  entries: Entry[];
  onSelect?: (date: string, bucket: DayBucket) => void;
}

type Mode = 'daily' | 'weekly' | 'monthly';

interface Cell {
  key: string;
  label: string;
  firstIso: string;
  entries: Entry[];
  emoji?: string;
  dominantKey?: string;
}

const WEEKS = 53;

function calcDominant(es: Entry[]): { emoji?: string; dominantKey?: string } {
  const counts = new Map<string, number>();
  for (const e of es) for (const c of e.components) counts.set(c.key, (counts.get(c.key) ?? 0) + 1);
  let topKey: string | undefined; let topN = 0;
  for (const [k, n] of counts) if (n > topN) { topN = n; topKey = k; }
  if (!topKey) return {};
  return { dominantKey: topKey, emoji: getComponentEmoji(topKey) };
}

export function Heatmap365({ entries, onSelect }: Props) {
  const buckets = useMemo(() => bucketByDay(entries), [entries]);
  const [hover, setHover] = useState<Cell | null>(null);
  const [mode, setMode] = useState<Mode>('daily');

  const dailyCells = useMemo((): Cell[] => {
    const today = new Date();
    const start = startOfWeek(subDays(today, WEEKS * 7 - 1), { weekStartsOn: 1 });
    return Array.from({ length: WEEKS * 7 }, (_, i) => {
      const d = addDays(start, i);
      const iso = format(d, 'yyyy-MM-dd');
      const b = buckets.get(iso);
      return {
        key: iso,
        label: format(d, 'EEE d MMM yyyy'),
        firstIso: iso,
        entries: b?.entries ?? [],
        emoji: b?.emoji,
        dominantKey: b?.dominantKey,
      };
    });
  }, [buckets]);

  const weeklyCells = useMemo((): Cell[] => {
    const today = new Date();
    const weeks = eachWeekOfInterval(
      { start: subDays(today, 52 * 7), end: today },
      { weekStartsOn: 1 },
    ).slice(-52);
    return weeks.map((weekStart) => {
      const isoWeek = `${getYear(weekStart)}-W${String(getISOWeek(weekStart)).padStart(2, '0')}`;
      const es: Entry[] = [];
      for (let j = 0; j < 7; j++) {
        const b = buckets.get(format(addDays(weekStart, j), 'yyyy-MM-dd'));
        if (b) es.push(...b.entries);
      }
      return { key: isoWeek, label: isoWeek, firstIso: format(weekStart, 'yyyy-MM-dd'), entries: es, ...calcDominant(es) };
    });
  }, [buckets]);

  const monthlyCells = useMemo((): Cell[] => {
    const today = new Date();
    const months = eachMonthOfInterval({ start: addMonths(startOfMonth(today), -11), end: startOfMonth(today) });
    return months.map((ms) => {
      const label = format(ms, 'yyyy-MM');
      const es: Entry[] = [];
      for (let j = 0; j < 31; j++) {
        const d = addDays(ms, j);
        if (format(startOfMonth(d), 'yyyy-MM') !== label) break;
        const b = buckets.get(format(d, 'yyyy-MM-dd'));
        if (b) es.push(...b.entries);
      }
      return { key: label, label, firstIso: format(ms, 'yyyy-MM-dd'), entries: es, ...calcDominant(es) };
    });
  }, [buckets]);

  const cells = mode === 'daily' ? dailyCells : mode === 'weekly' ? weeklyCells : monthlyCells;
  const maxCount = useMemo(() => Math.max(1, ...cells.map(c => c.entries.length)), [cells]);
  const activeCount = cells.filter(c => c.entries.length > 0).length;
  const activeLabel = mode === 'daily' ? 'active days' : mode === 'weekly' ? 'active weeks' : 'active months';
  const cellSize = mode === 'monthly' ? '24px' : '12px';

  const cellBg = (count: number) =>
    count === 0 ? 'rgb(var(--line))' : `rgba(14,165,233,${0.25 + (count / maxCount) * 0.65})`;

  const renderCell = (cell: Cell) => {
    const bg = cellBg(cell.entries.length);
    const sz = cellSize;
    const handleClick = () =>
      cell.entries.length &&
      onSelect?.(cell.firstIso, { date: cell.firstIso, entries: cell.entries, emoji: cell.emoji, dominantKey: cell.dominantKey });
    return (
      <button
        key={cell.key}
        role="gridcell"
        aria-label={cell.label}
        title={`${cell.label}${cell.entries.length ? ` · ${cell.entries.length}` : ''}`}
        onMouseEnter={() => setHover(cell)}
        onMouseLeave={() => setHover(h => h?.key === cell.key ? null : h)}
        onClick={handleClick}
        className="rounded-[3px] flex items-center justify-center text-[8px] leading-none flex-shrink-0"
        style={{ background: bg, width: sz, height: sz }}
      >
        {cell.emoji ?? ''}
      </button>
    );
  };

  const modeBtn = (m: Mode, label: string) => (
    <button
      key={m}
      onClick={() => setMode(m)}
      className={`px-1.5 py-0.5 rounded text-xs transition-opacity ${mode === m ? 'bg-line opacity-100' : 'opacity-40 hover:opacity-70'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">Last 12 months</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-md border border-line p-0.5">
            {modeBtn('daily', 'Daily')}
            {modeBtn('weekly', 'Weekly')}
            {modeBtn('monthly', 'Monthly')}
          </div>
          <div className="text-xs text-muted whitespace-nowrap">{activeCount} {activeLabel}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        {mode === 'daily' ? (
          <div
            className="grid grid-flow-col grid-rows-7 gap-[3px]"
            style={{ gridAutoColumns: '12px' }}
            role="grid"
            aria-label="Activity heatmap"
          >
            {cells.map(renderCell)}
          </div>
        ) : (
          <div className="flex gap-[3px]" role="grid" aria-label="Activity heatmap">
            {cells.map(renderCell)}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0.15, 0.4, 0.6, 0.8, 1].map((a) => (
            <span key={a} className="size-3 rounded-[3px]" style={{ background: `rgba(14,165,233,${a})` }} />
          ))}
        </div>
        <span>More</span>
      </div>
      {hover && (
        <p className="text-xs text-muted">
          {hover.label} — {hover.entries.length} entr{hover.entries.length === 1 ? 'y' : 'ies'}
          {hover.dominantKey ? ` · top: ${hover.emoji ?? ''} ${hover.dominantKey}` : ''}
        </p>
      )}
    </div>
  );
}
