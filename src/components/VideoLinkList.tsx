import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Plus, X, Link as LinkIcon } from 'lucide-react';
import type { Attachment } from '@/db/schema';

interface Props {
  entryId: string;
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
}

const isLikelyUrl = (s: string) => /^https?:\/\//i.test(s.trim());

export function VideoLinkList({ entryId, value, onChange }: Props) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');

  const add = () => {
    if (!isLikelyUrl(url)) return;
    onChange([
      ...value,
      {
        id: nanoid(),
        entryId,
        kind: 'video_link',
        url: url.trim(),
        caption: caption.trim() || undefined,
        createdAt: Date.now()
      }
    ]);
    setUrl('');
    setCaption('');
  };

  const removeAt = (id: string) => onChange(value.filter((a) => a.id !== id));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <input
          type="url"
          inputMode="url"
          className="field"
          placeholder="https://youtube.com/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          type="text"
          className="field"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button type="button" onClick={add} disabled={!isLikelyUrl(url)} className="btn-primary">
          <Plus size={16} /> Add link
        </button>
      </div>

      <ul className="space-y-2">
        {value.map((a) => (
          <li key={a.id} className="rounded-xl border border-line p-3 flex items-start gap-2">
            <LinkIcon size={16} className="text-muted mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-brand break-all underline"
              >
                {a.url}
              </a>
              {a.caption && <p className="text-xs text-muted mt-0.5">{a.caption}</p>}
            </div>
            <button type="button" onClick={() => removeAt(a.id)} className="btn-ghost p-1.5" aria-label="Remove link">
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
