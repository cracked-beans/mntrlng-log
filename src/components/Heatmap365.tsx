import { useMemo, useState } from 'react';
import { addDays, format, startOfWeek, subDays } from 'date-fns';
import type { Entry } from '@/db/schema';
import { bucketByDay, type DayBucket } from '@/domain/stats';

interface Props {
  entries: Entry[];
  onSelect?: (date: string, bucket: DayBucket) => void;
}

const WEEKS = 53;

export function Heatmap365({ entries, onSelect }: Props) {
  const buckets = useMemo(() => bucketByDay(entries), [entries]);
  const [hover, setHover] = useState<DayBucket | null>(null);

  const cells = useMemo(() => {
    // Anchor: today is the last column's bottom-right; go back to the Monday-aligned grid start.
    const today = new Date();
    const end = today;
    const start = startOfWeek(subDays(end, WEEKS * 7 - 1), { weekStartsOn: 1 });
    const days: { date: Date; iso: string }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = addDays(start, i);
      days.push({ date: d, iso: format(d, 'yyyy-MM-dd') });
    }
    return days;
  }, []);

  const maxCount = useMemo(() => {
    let m = 0;
    for (const b of buckets.values()) if (b.entries.length > m) m = b.entries.length;
    return Math.max(1, m);
  }, [buckets]);

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Last 12 months</h2>
        <div className="text-xs text-muted">{buckets.size} active days</div>
      </div>
      <div className="overflow-x-auto">
        <div
          className="grid grid-flow-col grid-rows-7 gap-[3px]"
          style={{ gridAutoColumns: '12px' }}
          role="grid"
          aria-label="Activity heatmap"
        >
          {cells.map(({ iso, date }) => {
            const b = buckets.get(iso);
            const intensity = b ? b.entries.length / maxCount : 0;
            const bg =
              !b
                ? 'rgb(var(--line))'
                : `rgba(14,165,233, ${0.25 + intensity * 0.65})`;
            return (
              <button
                key={iso}
                role="gridcell"
                aria-label={`${iso}${b ? ` — ${b.entries.length} entr${b.entries.length === 1 ? 'y' : 'ies'}` : ''}`}
                title={`${format(date, 'EEE d MMM yyyy')}${b ? ` · ${b.entries.length}` : ''}`}
                onMouseEnter={() => setHover(b ?? null)}
                onMouseLeave={() => setHover((h) => (h?.date === iso ? null : h))}
                onClick={() => b && onSelect?.(iso, b)}
                className="size-3 rounded-[3px] flex items-center justify-center text-[8px] leading-none"
                style={{ background: bg }}
              >
                {b?.emoji ?? ''}
              </button>
            );
          })}
        </div>
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
          {format(new Date(hover.date), 'EEE d MMM yyyy')} — {hover.entries.length} entr{hover.entries.length === 1 ? 'y' : 'ies'}
          {hover.dominantKey ? ` · top: ${hover.emoji} ${hover.entries[0].components.find((c) => c.key === hover.dominantKey)?.customLabel ?? hover.dominantKey}` : ''}
        </p>
      )}
    </div>
  );
}
