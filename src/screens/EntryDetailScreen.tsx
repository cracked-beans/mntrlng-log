import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Edit, Link as LinkIcon, Trash2 } from 'lucide-react';
import { db } from '@/db/db';
import type { Attachment, Entry } from '@/db/schema';
import { COMPONENT_STATUS, getComponentEmoji, getComponentLabel } from '@/domain/components';
import { fmtDate, fmtMeters } from '@/lib/format';
import { TrailMap } from '@/components/TrailMap';
import { blobURL } from '@/lib/images';

const statusBg: Record<string, string> = {
  good: 'bg-good/15 text-good',
  problems: 'bg-warn/15 text-warn',
  with_help: 'bg-help/15 text-help',
  not_solved: 'bg-bad/15 text-bad'
};

export default function EntryDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entry = useLiveQuery(() => (id ? db.entries.get(id) : undefined), [id]);
  const attachments = useLiveQuery(
    () => (id ? db.attachments.where({ entryId: id }).toArray() : Promise.resolve([] as Attachment[])),
    [id],
    [] as Attachment[]
  );
  const dog = useLiveQuery(() => (entry?.dogId ? db.dogs.get(entry.dogId) : undefined), [entry?.dogId]);

  if (!entry) {
    return <div className="p-6 text-muted">Loading…</div>;
  }
  return <Detail entry={entry} dogName={dog?.name} attachments={attachments ?? []} onBack={() => navigate(-1)} />;
}

function Detail({
  entry,
  dogName,
  attachments,
  onBack
}: {
  entry: Entry;
  dogName?: string;
  attachments: Attachment[];
  onBack: () => void;
}) {
  const photos = attachments.filter((a) => a.kind === 'photo');
  const gpx = attachments.filter((a) => a.kind === 'gpx');
  const videos = attachments.filter((a) => a.kind === 'video_link');

  const [lightbox, setLightbox] = useState<string | undefined>();
  const photoUrls = useMemo(() => {
    const m: Record<string, { thumb?: string; full?: string }> = {};
    for (const p of photos) {
      m[p.id] = { thumb: blobURL(p.thumbBlob), full: blobURL(p.photoBlob) };
    }
    return m;
  }, [photos]);
  useEffect(() => () => Object.values(photoUrls).forEach((u) => {
    if (u.thumb) URL.revokeObjectURL(u.thumb);
    if (u.full) URL.revokeObjectURL(u.full);
  }), [photoUrls]);

  const handleDelete = async () => {
    if (!confirm('Delete this entry?')) return;
    await db.transaction('rw', db.entries, db.attachments, async () => {
      await db.attachments.where({ entryId: entry.id }).delete();
      await db.entries.delete(entry.id);
    });
    onBack();
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <button onClick={onBack} className="btn-ghost px-2"><ArrowLeft size={18} /></button>
        <h1 className="font-semibold truncate">{fmtDate(entry.date)}</h1>
        <Link to={`/entry/${entry.id}/edit`} className="btn-primary"><Edit size={16} /> Edit</Link>
      </header>

      <section className="card p-4 space-y-1">
        <div className="text-sm text-muted">{entry.time && <>🕘 {entry.time} · </>}🐶 {dogName ?? '—'}</div>
        {entry.location && <div>📍 {entry.location}</div>}
        {entry.instructor && <div className="text-sm text-muted">Instructor: {entry.instructor}</div>}
        {entry.goal && <p className="pt-2">🎯 {entry.goal}</p>}
      </section>

      <section className="card p-4 space-y-2">
        <h2 className="font-medium">Trail setup</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <KV k="Type of start" v={entry.typeOfStart} />
          <KV k="Trail" v={entry.trailKnowledge} />
          <KV k="Age" v={entry.ageOfTrail} />
          <KV k="Time of day" v={entry.timeOfDay} />
          <KV k="Length" v={entry.length && `${entry.length} m`} />
          <KV k="Surface" v={entry.surface} />
          <KV k="Area" v={entry.area && `${entry.area.kind}${entry.area.sub ? ' / ' + entry.area.sub : ''}`} />
          <KV k="Weather" v={entry.weather?.join(', ')} />
          <KV k="Runner" v={entry.runner} />
          <KV k="Scent article" v={entry.scentArticle?.join(', ')} />
          <KV k="End position" v={entry.endPosition && `${entry.endPosition.visibility}${entry.endPosition.sub ? ' / ' + entry.endPosition.sub : ''}`} />
        </div>
      </section>

      {entry.components.length > 0 && (
        <section className="card p-4 space-y-2">
          <h2 className="font-medium">Components</h2>
          <ul className="space-y-2">
            {entry.components.map((c, i) => (
              <li key={i} className={`rounded-xl px-3 py-2 ${statusBg[c.status]}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {getComponentEmoji(c.key)} {getComponentLabel(c.key, c.customLabel)}
                  </span>
                  <span className="text-xs">{COMPONENT_STATUS[c.status].emoji} {COMPONENT_STATUS[c.status].label}</span>
                </div>
                {c.comments && <p className="text-sm mt-1">{c.comments}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(entry.handlerEval || entry.dogEval || entry.trailComments || entry.observations) && (
        <section className="card p-4 space-y-3">
          <h2 className="font-medium">Assessment</h2>
          {entry.handlerEval && (
            <div className="text-sm">
              <h3 className="font-medium">Handler</h3>
              <RatingsRow values={[
                ['Routine', entry.handlerEval.startingRoutine],
                ['Leash', entry.handlerEval.leashHandling],
                ['Body', entry.handlerEval.bodyPosition],
                ['Reading', entry.handlerEval.readingTheDog]
              ]} />
              {entry.handlerEval.comments && <p className="text-muted mt-1">{entry.handlerEval.comments}</p>}
            </div>
          )}
          {entry.dogEval && (
            <div className="text-sm">
              <h3 className="font-medium">Dog</h3>
              <RatingsRow values={[
                ['Motivation', entry.dogEval.motivation],
                ['Confidence', entry.dogEval.confidence],
                ['Negatives', entry.dogEval.negatives],
                ['Other', entry.dogEval.other]
              ]} />
              {entry.dogEval.comments && <p className="text-muted mt-1">{entry.dogEval.comments}</p>}
            </div>
          )}
          {entry.trailComments && <div><h3 className="font-medium text-sm">Trail comments</h3><p className="text-sm text-muted">{entry.trailComments}</p></div>}
          {entry.observations && <div><h3 className="font-medium text-sm">Observations</h3><p className="text-sm text-muted">{entry.observations}</p></div>}
        </section>
      )}

      {gpx.length > 0 && (
        <section className="card p-3 space-y-2">
          <h2 className="font-medium px-1">Map</h2>
          <TrailMap
            attachments={gpx}
            startMarker={entry.geo ? [entry.geo.lat, entry.geo.lng] : undefined}
            height={320}
          />
          <ul className="px-1 text-xs space-y-0.5">
            {gpx.map((g) => (
              <li key={g.id} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: g.gpxColor }} />
                <span>{g.gpxLabel ?? g.gpxRole}</span>
                {typeof g.gpxLengthM === 'number' && <span className="text-muted">· {fmtMeters(g.gpxLengthM)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {photos.length > 0 && (
        <section className="card p-3 space-y-2">
          <h2 className="font-medium px-1">Photos</h2>
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setLightbox(photoUrls[p.id]?.full)}
                  className="block w-full aspect-square overflow-hidden rounded-xl border border-line"
                >
                  {photoUrls[p.id]?.thumb && (
                    <img src={photoUrls[p.id]!.thumb} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {videos.length > 0 && (
        <section className="card p-3 space-y-2">
          <h2 className="font-medium px-1">Video links</h2>
          <ul className="space-y-2">
            {videos.map((v) => (
              <li key={v.id} className="flex items-start gap-2">
                <LinkIcon size={16} className="text-muted mt-0.5" />
                <div className="min-w-0">
                  <a className="text-sm text-brand underline break-all" href={v.url} target="_blank" rel="noreferrer noopener">{v.url}</a>
                  {v.caption && <p className="text-xs text-muted">{v.caption}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((t) => <span key={t} className="chip text-xs">#{t}</span>)}
        </div>
      )}

      <button onClick={handleDelete} className="btn-ghost w-full text-bad">
        <Trash2 size={16} /> Delete entry
      </button>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(undefined)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <>
      <div className="text-muted">{k}</div>
      <div>{v}</div>
    </>
  );
}

function RatingsRow({ values }: { values: Array<[string, number | undefined]> }) {
  return (
    <ul className="flex flex-wrap gap-2 mt-1">
      {values.filter(([, v]) => typeof v === 'number').map(([k, v]) => (
        <li key={k} className="chip text-xs">
          <span className="text-muted">{k}</span> <span>{v}/5</span>
        </li>
      ))}
    </ul>
  );
}
