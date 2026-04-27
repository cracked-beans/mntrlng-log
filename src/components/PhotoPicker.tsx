import { useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { Camera, X } from 'lucide-react';
import type { Attachment } from '@/db/schema';
import { blobURL, makeThumbnail } from '@/lib/images';

interface Props {
  entryId: string;
  value: Attachment[]; // photos only
  onChange: (next: Attachment[]) => void;
}

export function PhotoPicker({ entryId, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const a of value) {
      const blob = a.thumbBlob ?? a.photoBlob;
      const url = blobURL(blob);
      if (url) next[a.id] = url;
    }
    setUrls(next);
    return () => Object.values(next).forEach((u) => URL.revokeObjectURL(u));
  }, [value]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    const additions: Attachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const t = await makeThumbnail(file);
        additions.push({
          id: nanoid(),
          entryId,
          kind: 'photo',
          photoBlob: file,
          thumbBlob: t.blob,
          width: t.origW,
          height: t.origH,
          createdAt: Date.now()
        });
      } catch { /* skip non-images */ }
    }
    onChange([...value, ...additions]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (id: string) => onChange(value.filter((a) => a.id !== id));

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="btn-outline w-full"
      >
        <Camera size={16} /> {busy ? 'Processing…' : 'Add photo(s)'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {value.map((a) => (
            <li key={a.id} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-line/30">
              {urls[a.id] ? (
                <img src={urls[a.id]} alt="" className="w-full h-full object-cover" />
              ) : null}
              <button
                type="button"
                onClick={() => removeAt(a.id)}
                aria-label="Remove photo"
                className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
