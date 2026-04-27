import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { COMPONENT_LIST, COMPONENT_STATUS, getComponentEmoji, getComponentLabel, type ComponentStatus } from '@/domain/components';
import type { ComponentResult } from '@/db/schema';

interface Props {
  value: ComponentResult[];
  onChange: (next: ComponentResult[]) => void;
}

const STATUSES: ComponentStatus[] = ['good', 'problems', 'with_help', 'not_solved'];

export function ComponentAssessor({ value, onChange }: Props) {
  const [picking, setPicking] = useState(false);
  const [customLabel, setCustomLabel] = useState('');

  const usedKeys = new Set(value.map((v) => v.key));
  const available = COMPONENT_LIST.filter((c) => !usedKeys.has(c.key));

  const addComponent = (key: string, label?: string) => {
    onChange([...value, { key, customLabel: label, status: 'good' }]);
    setPicking(false);
    setCustomLabel('');
  };

  const updateAt = (i: number, patch: Partial<ComponentResult>) => {
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted">Add the components you trained on this trail.</p>
      )}

      <ul className="space-y-2">
        {value.map((c, i) => (
          <li key={`${c.key}-${i}`} className="rounded-xl border border-line p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getComponentEmoji(c.key)}</span>
                <span className="font-medium">{getComponentLabel(c.key, c.customLabel)}</span>
              </div>
              <button type="button" onClick={() => removeAt(i)} className="btn-ghost p-1.5" aria-label="Remove">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => {
                const on = c.status === s;
                const cls = `text-${COMPONENT_STATUS[s].color}`;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={COMPONENT_STATUS[s].label}
                    onClick={() => updateAt(i, { status: s })}
                    className={`chip ${on ? 'chip-on' : ''} ${on ? cls : ''}`}
                  >
                    <span>{COMPONENT_STATUS[s].emoji}</span>
                    {COMPONENT_STATUS[s].label}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              className="field"
              placeholder="Comments (optional)"
              value={c.comments ?? ''}
              onChange={(e) => updateAt(i, { comments: e.target.value || undefined })}
            />
          </li>
        ))}
      </ul>

      {!picking && (
        <button type="button" onClick={() => setPicking(true)} className="btn-outline w-full">
          <Plus size={16} /> Add component
        </button>
      )}

      {picking && (
        <div className="rounded-xl border border-line p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {available.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => addComponent(c.key)}
                className="chip"
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="field"
              placeholder='Other (custom name)'
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={!customLabel.trim()}
              onClick={() => addComponent(`custom_${Date.now()}`, customLabel.trim())}
            >
              Add
            </button>
          </div>
          <button type="button" onClick={() => setPicking(false)} className="btn-ghost w-full text-muted">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
