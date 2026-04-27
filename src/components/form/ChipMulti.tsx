interface Props<T extends string> {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  label?: string;
}

export function ChipMulti<T extends string>({ options, value, onChange, label }: Props<T>) {
  const toggle = (opt: T) => {
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt]);
  };
  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((opt) => {
          const on = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(opt)}
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
