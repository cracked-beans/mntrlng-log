interface Props<T extends string> {
  options: readonly T[];
  value?: T;
  onChange: (next: T | undefined) => void;
  allowClear?: boolean;
  label?: string;
  ariaLabel?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  allowClear = true,
  label,
  ariaLabel
}: Props<T>) {
  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={ariaLabel ?? label}>
        {options.map((opt) => {
          const on = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(allowClear && on ? undefined : opt)}
              className={`chip ${on ? 'chip-on' : ''}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
