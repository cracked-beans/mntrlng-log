import { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useUI } from '@/store/ui';

interface Props {
  allTags: string[];
  defaultOpen?: boolean;
  /** When true, the bar is always visible without the Filters toggle (for /search). */
  alwaysOpen?: boolean;
  resultCount?: number;
}

export function FilterBar({ allTags, defaultOpen = false, alwaysOpen = false, resultCount }: Props) {
  const filters = useUI((s) => s.filters);
  const setFilters = useUI((s) => s.setFilters);
  const reset = useUI((s) => s.resetFilters);
  const [open, setOpen] = useState(defaultOpen || alwaysOpen);

  const hasAny = !!(filters.query || filters.tags.length || filters.dateFrom || filters.dateTo);

  const toggleTag = (t: string) => {
    setFilters({
      tags: filters.tags.includes(t) ? filters.tags.filter((x) => x !== t) : [...filters.tags, t]
    });
  };

  return (
    <div className="card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            placeholder="Search location, goal, comments…"
            className="field pl-9"
            type="search"
            aria-label="Search"
          />
        </div>
        {!alwaysOpen && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="btn-outline px-3 py-2.5"
            aria-expanded={open}
            aria-controls="filter-extra"
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="hidden sm:inline">Filters</span>
          </button>
        )}
        {hasAny && (
          <button onClick={reset} className="btn-ghost px-2 py-2.5" aria-label="Clear filters">
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div id="filter-extra" className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="label">From</span>
              <input
                type="date"
                value={filters.dateFrom ?? ''}
                onChange={(e) => setFilters({ dateFrom: e.target.value || undefined })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="label">To</span>
              <input
                type="date"
                value={filters.dateTo ?? ''}
                onChange={(e) => setFilters({ dateTo: e.target.value || undefined })}
                className="field"
              />
            </label>
          </div>

          {allTags.length > 0 && (
            <div>
              <span className="label">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`chip ${filters.tags.includes(t) ? 'chip-on' : ''}`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {typeof resultCount === 'number' && (
        <div className="text-xs text-muted">{resultCount} result{resultCount === 1 ? '' : 's'}</div>
      )}
    </div>
  );
}
