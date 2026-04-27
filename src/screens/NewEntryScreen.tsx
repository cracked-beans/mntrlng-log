import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { ArrowLeft, MapPin, Save, Trash2 } from 'lucide-react';
import { db } from '@/db/db';
import type { Entry } from '@/db/schema';
import { todayISO } from '@/lib/format';
import { Section } from '@/components/form/Section';
import { Segmented } from '@/components/form/Segmented';
import { ChipMulti } from '@/components/form/ChipMulti';
import {
  AGE_OF_TRAIL,
  AREA_KIND,
  AREA_SUB,
  RUNNER_PROFILE,
  SCENT_ARTICLE,
  SURFACE,
  TIME_OF_DAY,
  TRAIL_KNOWLEDGE,
  TRAIL_LENGTH,
  TYPE_OF_START,
  WEATHER,
  END_POSITION_VISIBILITY,
  END_POSITION_SUB,
  type AreaKind,
  type EndPositionVisibility
} from '@/domain/variables';

function blankEntry(dogId: string): Entry {
  const now = Date.now();
  return {
    id: nanoid(),
    dogId,
    date: todayISO(),
    components: [],
    tags: [],
    weather: [],
    scentArticle: [],
    createdAt: now,
    updatedAt: now
  };
}

export default function NewEntryScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const dogs = useLiveQuery(() => db.dogs.orderBy('name').toArray(), [], []);
  const defaultDogId = useMemo(() => dogs?.find((d) => d.isDefault)?.id ?? dogs?.[0]?.id, [dogs]);

  const [entry, setEntry] = useState<Entry | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isEdit && id) {
        const existing = await db.entries.get(id);
        if (!cancelled && existing) setEntry(existing);
      } else if (defaultDogId && !entry) {
        setEntry(blankEntry(defaultDogId));
      }
    })();
    return () => { cancelled = true; };
  }, [isEdit, id, defaultDogId, entry]);

  if (!entry) {
    return (
      <div className="p-6 text-muted">
        {dogs && dogs.length === 0
          ? 'Add a dog in Settings first.'
          : 'Loading…'}
      </div>
    );
  }

  const update = <K extends keyof Entry>(key: K, value: Entry[K]) =>
    setEntry((e) => (e ? { ...e, [key]: value, updatedAt: Date.now() } : e));

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      update('geo', { lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    await db.entries.put({ ...entry, updatedAt: Date.now() });
    setSaving(false);
    navigate('/', { replace: true });
  };

  const handleDelete = async () => {
    if (!isEdit || !entry) return;
    if (!confirm('Delete this entry?')) return;
    await db.attachments.where({ entryId: entry.id }).delete();
    await db.entries.delete(entry.id);
    navigate('/', { replace: true });
  };

  const areaKind = (entry.area?.kind ?? undefined) as AreaKind | undefined;
  const endVis = (entry.endPosition?.visibility ?? undefined) as EndPositionVisibility | undefined;

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost px-2"><ArrowLeft size={18} /></button>
        <h1 className="font-semibold">{isEdit ? 'Edit entry' : 'New entry'}</h1>
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          <Save size={16} /> Save
        </button>
      </header>

      <Section title="Basics">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="label">Date</span>
            <input
              type="date" className="field"
              value={entry.date}
              onChange={(e) => update('date', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">Time</span>
            <input
              type="time" className="field"
              value={entry.time ?? ''}
              onChange={(e) => update('time', e.target.value || undefined)}
            />
          </label>
        </div>
        <label className="block">
          <span className="label">Dog</span>
          <select
            className="field"
            value={entry.dogId}
            onChange={(e) => update('dogId', e.target.value)}
          >
            {(dogs ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Location</span>
          <div className="flex gap-2">
            <input
              className="field"
              value={entry.location ?? ''}
              onChange={(e) => update('location', e.target.value || undefined)}
              placeholder="Riverside Park"
            />
            <button type="button" onClick={useMyLocation} className="btn-outline px-3" aria-label="Use my location">
              <MapPin size={16} />
            </button>
          </div>
          {entry.geo && (
            <p className="text-xs text-muted mt-1">
              📍 {entry.geo.lat.toFixed(5)}, {entry.geo.lng.toFixed(5)}
              <button onClick={() => update('geo', undefined)} className="ml-2 underline">clear</button>
            </p>
          )}
        </label>
        <label className="block">
          <span className="label">Instructor</span>
          <input
            className="field"
            value={entry.instructor ?? ''}
            onChange={(e) => update('instructor', e.target.value || undefined)}
            placeholder="Optional"
          />
        </label>
      </Section>

      <Section title="Trail setup">
        <Segmented label="Type of start" options={TYPE_OF_START} value={entry.typeOfStart}
          onChange={(v) => update('typeOfStart', v)} />
        <Segmented label="Trail knowledge" options={TRAIL_KNOWLEDGE} value={entry.trailKnowledge}
          onChange={(v) => update('trailKnowledge', v)} />
        <div className="grid grid-cols-2 gap-2">
          <Segmented label="Age of trail" options={AGE_OF_TRAIL} value={entry.ageOfTrail}
            onChange={(v) => update('ageOfTrail', v)} />
          <Segmented label="Time of day" options={TIME_OF_DAY} value={entry.timeOfDay}
            onChange={(v) => update('timeOfDay', v)} />
        </div>
        <Segmented label="Length (m)" options={TRAIL_LENGTH} value={entry.length}
          onChange={(v) => update('length', v)} />
        <div>
          <span className="label">Area</span>
          <Segmented options={AREA_KIND} value={areaKind} ariaLabel="Area kind"
            onChange={(v) => update('area', v ? { kind: v, sub: undefined } : undefined)} />
          {areaKind && AREA_SUB[areaKind].length > 0 && (
            <div className="mt-2">
              <Segmented options={AREA_SUB[areaKind] as readonly string[]} value={entry.area?.sub}
                ariaLabel="Area sub-type"
                onChange={(v) => update('area', { kind: areaKind, sub: v })} />
            </div>
          )}
        </div>
        <Segmented label="Surface" options={SURFACE} value={entry.surface}
          onChange={(v) => update('surface', v)} />
        <ChipMulti label="Weather" options={WEATHER} value={entry.weather ?? []}
          onChange={(v) => update('weather', v)} />
      </Section>

      <Section title="Runner & scent article">
        <Segmented label="Runner" options={RUNNER_PROFILE} value={entry.runner}
          onChange={(v) => update('runner', v)} />
        <ChipMulti label="Scent article" options={SCENT_ARTICLE} value={entry.scentArticle ?? []}
          onChange={(v) => update('scentArticle', v)} />
        <div>
          <span className="label">End position</span>
          <Segmented options={END_POSITION_VISIBILITY} value={endVis} ariaLabel="End visibility"
            onChange={(v) => update('endPosition', v ? { visibility: v, sub: undefined } : undefined)} />
          {endVis && END_POSITION_SUB[endVis].length > 0 && (
            <div className="mt-2">
              <Segmented options={END_POSITION_SUB[endVis] as readonly string[]}
                value={entry.endPosition?.sub} ariaLabel="End position detail"
                onChange={(v) => update('endPosition', { visibility: endVis, sub: v })} />
            </div>
          )}
        </div>
      </Section>

      <p className="text-xs text-muted text-center">More sections (components, ratings, attachments) coming next.</p>

      {isEdit && (
        <button onClick={handleDelete} className="btn-ghost w-full text-bad">
          <Trash2 size={16} /> Delete entry
        </button>
      )}
    </div>
  );
}
