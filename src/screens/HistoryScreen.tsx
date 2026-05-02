import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { db } from '@/db/db';
import type { Attachment, Entry } from '@/db/schema';
import { Heatmap365 } from '@/components/Heatmap365';
import {
  componentStats,
  monthlyCountsByType,
  RATING_MEASURES,
  type RatingMeasureKey,
  ratingsTrend,
  totalGpxMeters,
  variableMix
} from '@/domain/stats';
import { fmtMeters } from '@/lib/format';

const SLICE_COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#22c55e', '#eab308', '#ef4444', '#14b8a6', '#6366f1'];

const MEASURE_COLORS: Record<string, string> = {
  handler: '#0ea5e9', dog: '#f97316',
  startingRoutine: '#a855f7', leashHandling: '#22c55e',
  bodyPosition: '#eab308', readingTheDog: '#ef4444',
  motivation: '#14b8a6', confidence: '#6366f1',
  negatives: '#f43f5e', other: '#84cc16',
};

const START_TYPE_COLORS: Record<string, string> = {
  'Intensity':     '#f97316',
  'Delayed Start': '#0ea5e9',
  'Scent Article': '#a855f7',
  'Casting':       '#22c55e',
  'Flip':          '#eab308',
};

export default function HistoryScreen() {
  const navigate = useNavigate();
  const entries = useLiveQuery(() => db.entries.orderBy('date').toArray(), [], [] as Entry[]);
  const attachments = useLiveQuery(() => db.attachments.toArray(), [], [] as Attachment[]);

  const [activeKeys, setActiveKeys] = useState<RatingMeasureKey[]>(['handler', 'dog']);
  const [ratingDays, setRatingDays] = useState<number>(90);
  const [dayFilter, setDayFilter] = useState<string | undefined>();
  const dayEntries = useMemo(
    () => (dayFilter ? entries.filter((e) => e.date === dayFilter) : []),
    [dayFilter, entries]
  );

  const monthly = useMemo(() => monthlyCountsByType(entries), [entries]);
  const compStats = useMemo(() => componentStats(entries), [entries]);
  const areaMix = useMemo(() => variableMix(entries, (e) => e.area?.kind), [entries]);
  const ageMix = useMemo(() => variableMix(entries, (e) => e.ageOfTrail), [entries]);
  const trend = useMemo(() => ratingsTrend(entries, ratingDays), [entries, ratingDays]);

  const km = useMemo(() => totalGpxMeters(attachments), [attachments]);

  if (entries.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-semibold">History</h1>
        <div className="card p-8 text-center space-y-3">
          <div className="text-4xl">📅</div>
          <h2 className="font-medium">No trails yet</h2>
          <p className="text-sm text-muted">Start logging trails to see your history and stats here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">History</h1>

      <Heatmap365 entries={entries} onSelect={(date) => setDayFilter(date)} />

      {dayFilter && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{dayFilter}</h3>
            <button onClick={() => setDayFilter(undefined)} className="btn-ghost text-xs">close</button>
          </div>
          {dayEntries.length === 0 ? (
            <p className="text-sm text-muted">No entries on this day.</p>
          ) : (
            <ul className="space-y-1">
              {dayEntries.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => navigate(`/entry/${e.id}`)}
                    className="w-full text-left rounded-lg border border-line px-3 py-2 text-sm hover:bg-line/30"
                  >
                    {e.time ? `${e.time} · ` : ''}{e.location ?? 'Trail'} — {e.components.length} comp.
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Stat title="Trails" value={String(entries.length)} />

        <Stat title="Dog tracks" value={fmtMeters(km)} />
      </div>

      <Chart title="Trails per month">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.2)" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
            <Tooltip cursor={{ fill: 'rgba(127,127,127,0.08)' }} content={<StartTypeTooltip />} />
            {Object.entries(START_TYPE_COLORS).map(([type, color]) => (
              <Bar key={type} dataKey={type} stackId="a" fill={color} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 pb-3">
          {Object.entries(START_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1 text-xs text-muted">
              <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: color }} />
              {type}
            </div>
          ))}
        </div>
      </Chart>

      <Chart title="Components: frequency and % Good">
        {compStats.length === 0 ? (
          <p className="text-sm text-muted px-3 pb-3">No components logged yet.</p>
        ) : (
          <ul className="space-y-1.5 px-3 pb-3">
            {compStats.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-sm">
                <span className="text-base">{c.emoji}</span>
                <span className="flex-1 truncate">{c.label}</span>
                <span className="text-muted text-xs w-10 text-right">{c.goodPct}%</span>
                <div className="w-24 h-2 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${(c.count / Math.max(...compStats.map((s) => s.count))) * 100}%`,
                      background: `hsl(${(c.goodPct / 100) * 130}, 70%, 50%)`
                    }}
                  />
                </div>
                <span className="w-6 text-right text-xs">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Chart>

      <StartTypeChart entries={entries} />

      <div className="grid grid-cols-2 gap-3">
        <DonutChart title="Area" data={areaMix} />
        <DonutChart title="Age of trail" data={ageMix} />
      </div>

      <Chart
        title="Ratings"
        action={
          <div className="flex gap-0.5">
            {([30, 90, 180, 365, Infinity] as const).map((d) => {
              const label = d === Infinity ? 'All' : d === 365 ? '1y' : `${d}d`;
              return (
                <button
                  key={d}
                  onClick={() => setRatingDays(d)}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${ratingDays === d ? 'bg-sky-500 text-white' : 'text-muted hover:text-white'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        }
      >
        {trend.length === 0 ? (
          <p className="text-sm text-muted px-3 pb-3">No ratings for this period.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {RATING_MEASURES.map((m) => {
                const isActive = activeKeys.includes(m.key);
                return (
                  <button
                    key={m.key}
                    className={isActive ? 'text-xs px-2 py-0.5 rounded-full text-white' : 'bg-line text-muted text-xs px-2 py-0.5 rounded-full'}
                    style={isActive ? { backgroundColor: MEASURE_COLORS[m.key] } : undefined}
                    onClick={() => {
                      setActiveKeys((prev) => {
                        if (prev.includes(m.key)) {
                          return prev.length > 1 ? prev.filter((k) => k !== m.key) : prev;
                        }
                        return [...prev, m.key];
                      });
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.2)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} width={24} />
                <Tooltip content={<RatingsTooltip activeKeys={activeKeys} />} />
                {activeKeys.map((k) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={MEASURE_COLORS[k]} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </Chart>
    </div>
  );
}

function StartTypeTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.value > 0);
  return (
    <div className="card px-2.5 py-2 text-xs shadow-lg space-y-1">
      <div className="font-medium">{label}</div>
      {items.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-muted">{p.dataKey}:</span>
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function RatingsTooltip({ active, payload, label, activeKeys }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string; activeKeys: RatingMeasureKey[] }) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.value != null && activeKeys.includes(p.dataKey as RatingMeasureKey));
  return (
    <div className="card px-2.5 py-2 text-xs shadow-lg space-y-1">
      <div className="font-medium">{label}</div>
      {items.map((p) => {
        const measure = RATING_MEASURES.find((m) => m.key === p.dataKey);
        return (
          <div key={p.dataKey} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: MEASURE_COLORS[p.dataKey] }} />
            <span className="text-muted">{measure?.label ?? p.dataKey}:</span>
            <span>{p.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-xs text-muted">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
      {sub && <div className="text-[10px] text-muted">{sub}</div>}
    </div>
  );
}

function Chart({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-3">
        <h3 className="font-medium">{title}</h3>
        {action}
      </div>
      <div className="pt-2">{children}</div>
    </section>
  );
}

const BASE = 8;  // px resting dot size (w-2)
const GAP  = 2;  // px resting gap (gap-0.5)
const CELL = BASE + GAP;

function StartTypeChart({ entries }: { entries: Entry[] }) {
  const withType = entries.filter((e) => e.typeOfStart);
  const total = withType.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos]       = useState<{ x: number; y: number } | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<(typeof withType)[0] | null>(null);
  const [cardBg, setCardBg] = useState('rgb(15,23,42)');

  useEffect(() => {
    const card = containerRef.current?.closest('.card') as HTMLElement | null;
    if (card) setCardBg(window.getComputedStyle(card).backgroundColor);
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    withType.forEach((e) => { map[e.typeOfStart!] = (map[e.typeOfStart!] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const getScale = (i: number): number => {
    if (!mousePos || !containerRef.current) return 1;
    const cols = Math.max(1, Math.floor(containerRef.current.offsetWidth / CELL));
    const row  = Math.floor(i / cols);
    const col  = i % cols;
    const cx   = col * CELL + BASE / 2;
    const cy   = row * CELL + BASE / 2;
    const dist = Math.sqrt((cx - mousePos.x) ** 2 + (cy - mousePos.y) ** 2);
    const radius = 64;
    if (dist >= radius) return 1;
    return 1 + Math.pow(1 - dist / radius, 1.5) * 5;
  };

  const onMove = (x: number, y: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    setMousePos({ x: x - rect.left, y: y - rect.top });
  };

  return (
    <Chart title="Start types">
      {total === 0 ? (
        <p className="text-sm text-muted px-3 pb-3">No data.</p>
      ) : (
        <div className="px-3 pb-3 space-y-3">
          <div
            ref={containerRef}
            className="flex flex-wrap py-2 cursor-crosshair"
            style={{ gap: `${GAP}px` }}
            onMouseMove={(ev) => onMove(ev.clientX, ev.clientY)}
            onMouseLeave={() => { setMousePos(null); setHoveredEntry(null); }}
            onTouchMove={(ev) => { ev.preventDefault(); onMove(ev.touches[0].clientX, ev.touches[0].clientY); }}
            onTouchEnd={() => { setMousePos(null); setHoveredEntry(null); }}
          >
            {withType.map((e, i) => {
              const scale = getScale(i);
              const color = START_TYPE_COLORS[e.typeOfStart!] ?? '#666';
              return (
                <div
                  key={i}
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{
                    backgroundColor: color,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center',
                    outline: scale > 1.2 ? `0.5px solid ${cardBg.replace(')', `, ${((scale - 1) / 5).toFixed(2)})`).replace('rgb(', 'rgba(')}` : 'none',
                    outlineOffset: '0px',
                    zIndex: scale > 1 ? Math.round(scale * 10) : 'auto',
                    position: 'relative',
                    transition: mousePos ? 'none' : 'transform 200ms ease-out, outline 200ms ease-out',
                  }}
                  onMouseEnter={() => setHoveredEntry(e)}
                />
              );
            })}
          </div>
          <div className="h-4 text-xs text-muted flex items-center gap-1.5">
            {hoveredEntry ? (
              <>
                <span className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: START_TYPE_COLORS[hoveredEntry.typeOfStart!] ?? '#666' }} />
                <span>{hoveredEntry.date}</span>
                <span className="text-white/60">·</span>
                <span>{hoveredEntry.typeOfStart}</span>
              </>
            ) : (
              <span className="opacity-40">Hover to inspect</span>
            )}
          </div>
          <div className="space-y-1.5">
            {counts.map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: START_TYPE_COLORS[type] ?? '#666' }} />
                <span className="w-24 text-muted truncate">{type}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, backgroundColor: START_TYPE_COLORS[type] ?? '#666' }} />
                </div>
                <span className="w-5 text-right tabular-nums">{count}</span>
                <span className="w-7 text-right text-muted tabular-nums">{Math.round((count / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Chart>
  );
}

function DonutChart({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  return (
    <Chart title={title}>
      {data.length === 0 ? (
        <p className="text-sm text-muted px-3 pb-3">No data.</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={32} outerRadius={56} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Chart>
  );
}
