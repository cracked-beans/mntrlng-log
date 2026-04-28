import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import MainScreen from '@/screens/MainScreen';
import { useUI } from '@/store/ui';

const NewEntryScreen = lazy(() => import('@/screens/NewEntryScreen'));
const EntryDetailScreen = lazy(() => import('@/screens/EntryDetailScreen'));
const HistoryScreen = lazy(() => import('@/screens/HistoryScreen'));
const SearchScreen = lazy(() => import('@/screens/SearchScreen'));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'));

function ScreenFallback() {
  return <div className="p-6 text-muted text-sm">Loading…</div>;
}

export default function App() {
  const applyTheme = useUI((s) => s.applyTheme);

  useEffect(() => {
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [applyTheme]);

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
    </div>
  );
}
