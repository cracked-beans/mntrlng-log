import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X } from 'lucide-react';
import { db } from '@/db/db';
import type { Entry } from '@/db/schema';
import { FilterBar } from '@/components/FilterBar';
import { EntryTile } from '@/components/EntryTile';
import { applyFilters, collectAllTags } from '@/lib/filter';
import { useUI } from '@/store/ui';

type Sort = 'newest' | 'oldest' | 'longest';

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'longest', label: 'Longest trail' }
];

const lengthOrder = ['<100', '100-200', '200-300', '400-600', '600-800', '>800'];

export default function SearchScreen() {
  const density = useUI((s) => s.density);
  const filters = useUI((s) => s.filters);
  const presets = useUI((s) => s.presets);
  const savePreset = useUI((s) => s.savePreset);
  const deletePreset = useUI((s) => s.deletePreset);
  const loadPreset = useUI((s) => s.loadPreset);
  const [sort, setSort] = useState<Sort>('newest');

  const dogs = useLiveQuery(() => db.dogs.orderBy('name').toArray(), [], []);
  const entries = useLiveQuery(() => db.entries.toArray(), [], [] as Entry[]);

  const allTags = useMemo(() => collectAllTags(entries), [entries]);
  const filtered = useMemo(() => {
    const f = applyFilters(entries, filters, { dogs });
    const cmp = (a: Entry, b: Entry) => {
      if (sort === 'oldest') return a.date.localeCompare(b.date);
      if (sort === 'longest') {
        const ai = a.length ? lengthOrder.indexOf(a.length) : -1;
        const bi = b.length ? lengthOrder.indexOf(b.length) : -1;
        return bi - ai;
      }
      return b.date.localeCompare(a.date);
    };
    return [...f].sort(cmp);
  }, [entries, filters, dogs, sort]);

  const dogById = useMemo(() => {
    const m = new Map<string, (typeof dogs)[number]>();
    (dogs ?? []).forEach((d) => m.set(d.id, d));
    return m;
  }, [dogs]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Search</h1>

      <FilterBar allTags={allTags} alwaysOpen resultCount={filtered.length} />

      <div className="flex gap-1.5" role="radiogroup" aria-label="Sort">
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={sort === o.value}
            onClick={() => setSort(o.value)}
            className={`chip ${sort === o.value ? 'chip-on' : ''}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          className="btn-outline text-xs shrink-0 py-1 px-2"
          onClick={() => {
            const name = prompt('Preset name?')?.trim();
            if (name) savePreset(name, filters);
          }}
        >
          + Save preset
        </button>
        {presets.map((p) => (
          <span key={p.id} className="chip chip-on flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => loadPreset(p.id)} className="leading-none">
              {p.name}
            </button>
            <button
              type="button"
              aria-label={`Delete preset ${p.name}`}
              onClick={() => deletePreset(p.id)}
              className="leading-none opacity-60 hover:opacity-100"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-6 text-center space-y-2">
          <div className="text-3xl">🔍</div>
          <p className="font-medium">No results</p>
          <p className="text-sm text-muted">Try different filters or clear them to see all entries.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((e) => (
            <li key={e.id}>
              <EntryTile entry={e} dog={dogById.get(e.dogId)} density={density} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
