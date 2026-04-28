import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import MainScreen from '@/screens/MainScreen';
import { useUI } from '@/store/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

const NewEntryScreen = lazy(() => import('@/screens/NewEntryScreen'));
const EntryDetailScreen = lazy(() => import('@/screens/EntryDetailScreen'));
const HistoryScreen = lazy(() => import('@/screens/HistoryScreen'));
const SearchScreen = lazy(() => import('@/screens/SearchScreen'));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'));

function ScreenFallback() {
  return <div className="p-6 text-muted text-sm">Loading…</div>;
}

const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

export default function App() {
  const applyTheme = useUI((s) => s.applyTheme);
  const installPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [applyTheme]);

  useEffect(() => {
    if (isStandalone) return;
    const handler = (e: Event) => {
      e.preventDefault();
      installPrompt.current = e as BeforeInstallPromptEvent;
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    await installPrompt.current?.prompt();
    setShowInstall(false);
  };

  return (
    <div className="min-h-screen flex flex-col safe-top">
      <main className="flex-1 max-w-app mx-auto w-full pb-2">
        <Suspense fallback={<ScreenFallback />}>
          <Routes>
            <Route path="/" element={<MainScreen />} />
            <Route path="/new" element={<NewEntryScreen />} />
            <Route path="/entry/:id" element={<EntryDetailScreen />} />
            <Route path="/entry/:id/edit" element={<NewEntryScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <BottomNav />
      {showInstall && (
        <div className="fixed bottom-16 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="bg-brand text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 max-w-sm w-full pointer-events-auto">
            <span className="text-sm flex-1">Install Mantrailing Log for offline use</span>
            <button onClick={handleInstall} className="font-semibold text-sm shrink-0 underline underline-offset-2">
              Install
            </button>
            <button onClick={() => setShowInstall(false)} aria-label="Dismiss" className="opacity-70 hover:opacity-100 shrink-0">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
