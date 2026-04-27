import { useRef } from 'react';
import { nanoid } from 'nanoid';
import { Upload, X } from 'lucide-react';
import type { Attachment, GpxRole } from '@/db/schema';
import { defaultColorFor, extractTracks, parseGpx } from '@/lib/gpx';
import { fmtMeters } from '@/lib/format';

interface Props {
  entryId: string;
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
}

const ROLES: { value: GpxRole; label: string }[] = [
  { value: 'dog', label: 'Dog' },
  { value: 'runner', label: 'Runner' },
  { value: 'custom', label: 'Custom' }
];

export function GpxPicker({ entryId, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const newOnes: Attachment[] = [];
    for (const file of Array.from(files)) {
      const text = await file.text();
      let lengthM: number | undefined;
      try {
        const tracks = extractTracks(parseGpx(text));
        lengthM = tracks.reduce((s, t) => s + t.lengthM, 0);
      } catch { /* ignore parse errors */ }
      const role: GpxRole = newOnes.length === 0 && !value.some((a) => a.gpxRole === 'dog') ? 'dog' : 'runner';
      newOnes.push({
        id: nanoid(),
        entryId,
        kind: 'gpx',
        gpxRole: role,
        gpxLabel: file.name.replace(/\.gpx$/i, ''),
        gpxColor: defaultColorFor(role),
        gpxText: text,
        gpxLengthM: lengthM,
        createdAt: Date.now()
      });
    }
    onChange([...value, ...newOnes]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const updateAt = (id: string, patch: Partial<Attachment>) => {
    onChange(value.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };
  const removeAt = (id: string) => onChange(value.filter((a) => a.id !== id));

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => inputRef.current?.click()} className="btn-outline w-full">
        <Upload size={16} /> Add GPX file(s)
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value.length === 0 && (
        <p className="text-xs text-muted">Attach the dog's collar track and the runner's phone trace.</p>
      )}

      <ul className="space-y-2">
        {value.map((a) => (
          <li key={a.id} className="rounded-xl border border-line p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="size-3 rounded-full shrink-0" style={{ background: a.gpxColor }} />
                <input
                  className="field py-1.5 text-sm flex-1"
                  value={a.gpxLabel ?? ''}
                  onChange={(e) => updateAt(a.id, { gpxLabel: e.target.value })}
                  placeholder="Track name"
                />
              </div>
              <button type="button" onClick={() => removeAt(a.id)} className="btn-ghost p-1.5" aria-label="Remove">
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex gap-1.5" role="radiogroup" aria-label="Role">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    role="radio"
                    aria-checked={a.gpxRole === r.value}
                    onClick={() => updateAt(a.id, { gpxRole: r.value, gpxColor: a.gpxColor ?? defaultColorFor(r.value) })}
                    className={`chip ${a.gpxRole === r.value ? 'chip-on' : ''}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <input
                type="color"
                value={a.gpxColor ?? '#0ea5e9'}
                onChange={(e) => updateAt(a.id, { gpxColor: e.target.value })}
                aria-label="Track colour"
                className="size-8 rounded"
              />
            </div>

            {typeof a.gpxLengthM === 'number' && (
              <p className="text-xs text-muted">Length: {fmtMeters(a.gpxLengthM)}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
