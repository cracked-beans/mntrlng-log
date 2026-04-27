import type { Rating } from '@/domain/variables';

interface Props {
  value?: Rating;
  onChange: (next?: Rating) => void;
  label?: string;
}

export function Rating5({ value, onChange, label }: Props) {
  return (
    <div className="flex items-center justify-between gap-2">
      {label && <span className="text-sm">{label}</span>}
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = (value ?? 0) >= n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} of 5`}
              onClick={() => onChange(value === n ? undefined : (n as Rating))}
              className={`size-7 rounded-full border ${
                on ? 'bg-brand border-brand text-white' : 'border-line text-muted'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
