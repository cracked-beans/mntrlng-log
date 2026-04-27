import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

const normalize = (raw: string) => raw.trim().toLowerCase().replace(/\s+/g, '-');

export function TagInput({ value, onChange, suggestions = [], placeholder = 'Add a tag…' }: Props) {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const t = normalize(raw);
    if (!t || value.includes(t)) { setDraft(''); return; }
    onChange([...value, t]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = suggestions.filter((s) => !value.includes(s)).slice(0, 12);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand/60">
        {value.map((t) => (
          <span key={t} className="chip chip-on">
            #{t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              className="ml-0.5"
              aria-label={`Remove ${t}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && commit(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-32 bg-transparent outline-none text-sm py-1.5"
        />
      </div>
      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {remaining.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => commit(t)}
              className="chip text-xs"
            >
              #{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
