import { Link } from 'react-router-dom';
import { Dog as DogIcon, MapPin, Tag } from 'lucide-react';
import type { Entry, Dog } from '@/db/schema';
import { COMPONENT_STATUS, getComponentEmoji, getComponentLabel } from '@/domain/components';
import type { Density } from '@/store/ui';
import { fmtShortDate, fmtDate } from '@/lib/format';

interface Props {
  entry: Entry;
  dog?: Dog;
  density: Density;
}

const statusBg: Record<string, string> = {
  good: 'bg-good/15 text-good',
  problems: 'bg-warn/15 text-warn',
  with_help: 'bg-help/15 text-help',
  not_solved: 'bg-bad/15 text-bad'
};

export function EntryTile({ entry, dog, density }: Props) {
  if (density === 'small') return <SmallTile entry={entry} dog={dog} />;
  if (density === 'compact') return <CompactTile entry={entry} dog={dog} />;
  return <DetailedTile entry={entry} dog={dog} />;
}

function SmallTile({ entry, dog }: { entry: Entry; dog?: Dog }) {
  const top = entry.components.slice(0, 4);
  return (
    <Link to={`/entry/${entry.id}`} className="card flex items-center gap-3 px-3 py-2.5">
      <div className="text-xs text-muted w-16 shrink-0">{fmtShortDate(entry.date)}</div>
      <div className="text-sm font-medium truncate flex-1">{dog?.name ?? '—'}</div>
      <div className="flex gap-0.5 text-base" aria-label="components">
        {top.map((c, i) => (
          <span key={i} title={getComponentLabel(c.key, c.customLabel)}>
            {getComponentEmoji(c.key)}
          </span>
        ))}
      </div>
    </Link>
  );
}

function CompactTile({ entry, dog }: { entry: Entry; dog?: Dog }) {
  return (
    <Link to={`/entry/${entry.id}`} className="card block px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted">{fmtShortDate(entry.date)}{entry.time ? ` · ${entry.time}` : ''}</div>
        {entry.length && <span className="text-xs text-muted">{entry.length} m</span>}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
        <DogIcon size={14} className="text-muted" />
        <span className="truncate">{dog?.name ?? '—'}</span>
        {entry.location && (
          <>
            <MapPin size={14} className="text-muted ml-2" />
            <span className="truncate text-muted font-normal">{entry.location}</span>
          </>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {entry.components.map((c, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${statusBg[c.status]}`}
          >
            <span>{getComponentEmoji(c.key)}</span>
            <span>{getComponentLabel(c.key, c.customLabel)}</span>
          </span>
        ))}
      </div>
    </Link>
  );
}

function DetailedTile({ entry, dog }: { entry: Entry; dog?: Dog }) {
  const handler = entry.handlerEval;
  const dogE = entry.dogEval;
  const avg = (xs: (number | undefined)[]) => {
    const v = xs.filter((x): x is number => typeof x === 'number');
    if (!v.length) return undefined;
    return (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1);
  };
  return (
    <Link to={`/entry/${entry.id}`} className="card block p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted">{fmtDate(entry.date)}{entry.time ? ` · ${entry.time}` : ''}</div>
          <div className="font-semibold">{dog?.name ?? '—'} · {entry.location ?? 'Location'}</div>
        </div>
        {entry.length && <span className="text-xs text-muted">{entry.length} m</span>}
      </div>

      {entry.goal && <p className="text-sm text-muted line-clamp-2">🎯 {entry.goal}</p>}

      <div className="flex flex-wrap gap-1.5">
        {entry.components.map((c, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${statusBg[c.status]}`}
            title={c.comments}
          >
            <span>{getComponentEmoji(c.key)}</span>
            <span>{getComponentLabel(c.key, c.customLabel)}</span>
            <span className="opacity-70">{COMPONENT_STATUS[c.status].emoji}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-muted">
        {handler && <div>Handler ★ {avg([handler.startingRoutine, handler.leashHandling, handler.bodyPosition, handler.readingTheDog]) ?? '—'}</div>}
        {dogE && <div>Dog ★ {avg([dogE.motivation, dogE.confidence, dogE.negatives, dogE.other]) ?? '—'}</div>}
      </div>

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted">
          <Tag size={12} />
          {entry.tags.map((t) => <span key={t}>#{t}</span>)}
        </div>
      )}
    </Link>
  );
}
