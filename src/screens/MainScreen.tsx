import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, LayoutGrid, List, Rows3 } from 'lucide-react';
import { db } from '@/db/db';
import { useUI, type Density } from '@/store/ui';
import { EntryTile } from '@/components/EntryTile';

const DENSITY_OPTIONS: { value: Density; label: string; Icon: typeof LayoutGrid }[] = [
  { value: 'small', label: 'Small', Icon: List },
  { value: 'compact', label: 'Compact', Icon: Rows3 },
  { value: 'detailed', label: 'Detailed', Icon: LayoutGrid }
];

export default function MainScreen() {
  const density = useUI((s) => s.density);
  const setDensity = useUI((s) => s.setDensity);
  const activeDogId = useUI((s) => s.activeDogId);

  const dogs = useLiveQuery(() => db.dogs.orderBy('name').toArray(), [], []);
  const entries = useLiveQuery(
    () => db.entries.orderBy('date').reverse().toArray(),
    [],
    []
  );

  const dogById = useMemo(() => {
    const m = new Map<string, (typeof dogs)[number]>();
    (dogs ?? []).forEach((d) => m.set(d.id, d));
    return m;
  }, [dogs]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    if (!activeDogId) return entries;
    return entries.filter((e) => e.dogId === activeDogId);
  }, [entries, activeDogId]);

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Mantrailing Log</h1>
        <div className="flex gap-1 rounded-full border border-line p-0.5" role="group" aria-label="Density">
          {DENSITY_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setDensity(value)}
              aria-pressed={density === value}
              aria-label={label}
              className={`rounded-full px-2 py-1.5 text-xs flex items-center gap-1 ${
                density === value ? 'bg-brand text-white' : 'text-muted'
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {filtered.map((e) => (
            <li key={e.id}>
              <EntryTile entry={e} dog={dogById.get(e.dogId)} density={density} />
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/new"
        aria-label="New entry"
        className="fixed right-5 bottom-20 z-20 rounded-full bg-brand text-white shadow-lg p-4 hover:opacity-90 active:opacity-80"
      >
        <Plus size={22} />
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-6 text-center space-y-3">
      <div className="text-3xl">🐾</div>
      <h2 className="font-medium">No entries yet</h2>
      <p className="text-sm text-muted">
        Tap the <strong>+</strong> button to log your first trail, or load a small set of demo entries from Settings.
      </p>
    </div>
  );
}
