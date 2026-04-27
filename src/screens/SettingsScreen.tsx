import { useUI, type Theme } from '@/store/ui';
import { seedDemoData, clearAllData } from '@/db/seed';
import { useState } from 'react';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
];

export default function SettingsScreen() {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();

  const handleSeed = async () => {
    setBusy(true);
    const r = await seedDemoData();
    setBusy(false);
    setMsg(r.inserted ? 'Demo data inserted.' : 'Existing data found — nothing inserted.');
  };

  const handleClear = async () => {
    if (!confirm('Delete ALL local data? This cannot be undone.')) return;
    setBusy(true);
    await clearAllData();
    setBusy(false);
    setMsg('All local data cleared.');
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Appearance</h2>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`chip ${theme === t.value ? 'chip-on' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Data (prototype)</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={handleSeed} disabled={busy}>
            Load demo data
          </button>
          <button className="btn-outline" onClick={handleClear} disabled={busy}>
            Clear all data
          </button>
        </div>
        {msg && <p className="text-sm text-muted">{msg}</p>}
        <p className="text-xs text-muted">
          Dogs / handlers CRUD and JSON export-import will be added in a later step.
        </p>
      </section>
    </div>
  );
}
