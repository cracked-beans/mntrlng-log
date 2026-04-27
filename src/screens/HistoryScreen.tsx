import { useMemo, useState } from 'react';
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
  monthlyCounts,
  ratingsTrend,
  streaks,
  totalGpxMeters,
  variableMix
} from '@/domain/stats';
import { fmtMeters } from '@/lib/format';

const SLICE_COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#22c55e', '#eab308', '#ef4444', '#14b8a6', '#6366f1'];

export default function HistoryScreen() {
  const navigate = useNavigate();
  const entries = useLiveQuery(() => db.entries.orderBy('date').toArray(), [], [] as Entry[]);
  const attachments = useLiveQuery(() => db.attachments.toArray(), [], [] as Attachment[]);

  const [dayFilter, setDayFilter] = useState<string | undefined>();
  const dayEntries = useMemo(
    () => (dayFilter ? entries.filter((e) => e.date === dayFilter) : []),
    [dayFilter, entries]
  );

  const monthly = useMemo(() => monthlyCounts(entries), [entries]);
  const compStats = useMemo(() => componentStats(entries), [entries]);
  const surfaceMix = useMemo(() => variableMix(entries, (e) => e.surface), [entries]);
  const areaMix = useMemo(() => variableMix(entries, (e) => e.area?.kind), [entries]);
  const ageMix = useMemo(() => variableMix(entries, (e) => e.ageOfTrail), [entries]);
  const trend = useMemo(() => ratingsTrend(entries, 90), [entries]);
  const { current, longest } = useMemo(() => streaks(entries), [entries]);
  const km = useMemo(() => totalGpxMeters(attachments), [attachments]);

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
        <Stat title="Streak" value={`${current} / ${longest}`} sub="current / longest" />
        <Stat title="Dog tracks" value={fmtMeters(km)} />
      </div>

      <Chart title="Trails per month">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.2)" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
            <Tooltip cursor={{ fill: 'rgba(127,127,127,0.08)' }} />
            <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DonutChart title="Surface" data={surfaceMix} />
        <DonutChart title="Area" data={areaMix} />
        <DonutChart title="Age of trail" data={ageMix} />
      </div>

      <Chart title="Handler & dog ratings (90 days)">
        {trend.length === 0 ? (
          <p className="text-sm text-muted px-3 pb-3">No ratings in the last 90 days.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.2)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} width={24} />
              <Tooltip />
              <Line type="monotone" dataKey="handler" stroke="#0ea5e9" dot={false} connectNulls />
              <Line type="monotone" dataKey="dog" stroke="#f97316" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Chart>
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

function Chart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <h3 className="font-medium px-3 pt-3">{title}</h3>
      <div className="pt-2">{children}</div>
    </section>
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
