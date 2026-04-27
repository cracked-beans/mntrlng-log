import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { Download, Plus, Star, Trash2, Upload } from 'lucide-react';
import { db } from '@/db/db';
import type { Dog, Handler } from '@/db/schema';
import { useUI, type Theme } from '@/store/ui';
import { clearAllData, seedDemoData } from '@/db/seed';
import { downloadBlob, exportAll, importAll } from '@/lib/io';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
];

export default function SettingsScreen() {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const dogs = useLiveQuery(() => db.dogs.orderBy('name').toArray(), [], [] as Dog[]);
  const handlers = useLiveQuery(() => db.handlers.orderBy('name').toArray(), [], [] as Handler[]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const addDog = async () => {
    const name = prompt('Dog name?')?.trim();
    if (!name) return;
    await db.dogs.add({ id: nanoid(), name, isDefault: dogs.length === 0, createdAt: Date.now() });
  };
  const renameDog = async (d: Dog) => {
    const name = prompt('Dog name', d.name)?.trim();
    if (!name) return;
    await db.dogs.update(d.id, { name });
  };
  const setDefaultDog = async (id: string) => {
    await db.transaction('rw', db.dogs, async () => {
      await db.dogs.toCollection().modify({ isDefault: false });
      await db.dogs.update(id, { isDefault: true });
    });
  };
  const deleteDog = async (d: Dog) => {
    const linked = await db.entries.where({ dogId: d.id }).count();
    if (linked > 0) {
      alert(`${d.name} has ${linked} entr${linked === 1 ? 'y' : 'ies'}. Delete or reassign them first.`);
      return;
    }
    if (!confirm(`Delete ${d.name}?`)) return;
    await db.dogs.delete(d.id);
  };

  const addHandler = async () => {
    const name = prompt('Handler name?')?.trim();
    if (!name) return;
    await db.handlers.add({ id: nanoid(), name, isDefault: handlers.length === 0, createdAt: Date.now() });
  };
  const renameHandler = async (h: Handler) => {
    const name = prompt('Handler name', h.name)?.trim();
    if (!name) return;
    await db.handlers.update(h.id, { name });
  };
  const setDefaultHandler = async (id: string) => {
    await db.transaction('rw', db.handlers, async () => {
      await db.handlers.toCollection().modify({ isDefault: false });
      await db.handlers.update(id, { isDefault: true });
    });
  };
  const deleteHandler = async (h: Handler) => {
    if (!confirm(`Delete handler ${h.name}?`)) return;
    await db.handlers.delete(h.id);
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const blob = await exportAll();
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      downloadBlob(blob, `mtlog-${ts}.json`);
      setMsg('Exported.');
    } finally { setBusy(false); }
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await importAll(file);
      setMsg(`Imported ${r.entries} entries and ${r.dogs} dogs.`);
    } catch (err) {
      setMsg(`Import failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

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
            <button key={t.value} onClick={() => setTheme(t.value)}
              className={`chip ${theme === t.value ? 'chip-on' : ''}`}>{t.label}</button>
          ))}
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Dogs</h2>
          <button onClick={addDog} className="btn-outline px-3 py-1.5 text-sm"><Plus size={14} /> Add</button>
        </div>
        {dogs.length === 0 ? (
          <p className="text-sm text-muted">No dogs yet. Add one to start logging.</p>
        ) : (
          <ul className="space-y-2">
            {dogs.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <button onClick={() => setDefaultDog(d.id)} aria-label="Set default" className="p-1.5">
                  <Star size={16} className={d.isDefault ? 'text-warn fill-warn' : 'text-muted'} />
                </button>
                <button onClick={() => renameDog(d)} className="flex-1 text-left">{d.name}</button>
                <button onClick={() => deleteDog(d)} className="btn-ghost p-1.5 text-bad" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Handlers</h2>
          <button onClick={addHandler} className="btn-outline px-3 py-1.5 text-sm"><Plus size={14} /> Add</button>
        </div>
        {handlers.length === 0 ? (
          <p className="text-sm text-muted">No handlers yet.</p>
        ) : (
          <ul className="space-y-2">
            {handlers.map((h) => (
              <li key={h.id} className="flex items-center gap-2">
                <button onClick={() => setDefaultHandler(h.id)} aria-label="Set default" className="p-1.5">
                  <Star size={16} className={h.isDefault ? 'text-warn fill-warn' : 'text-muted'} />
                </button>
                <button onClick={() => renameHandler(h)} className="flex-1 text-left">{h.name}</button>
                <button onClick={() => deleteHandler(h)} className="btn-ghost p-1.5 text-bad" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Backup</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} disabled={busy} className="btn-outline">
            <Download size={16} /> Export JSON
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-outline">
            <Upload size={16} /> Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0])}
          />
        </div>
        <p className="text-xs text-muted">
          Photos and GPX tracks are embedded (base64) inside the JSON file.
        </p>
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="font-medium">Data (prototype)</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={handleSeed} disabled={busy}>Load demo data</button>
          <button className="btn-outline text-bad" onClick={handleClear} disabled={busy}>Clear all data</button>
        </div>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </section>
    </div>
  );
}
