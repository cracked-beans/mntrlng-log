import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import MainScreen from '@/screens/MainScreen';
import NewEntryScreen from '@/screens/NewEntryScreen';
import EntryDetailScreen from '@/screens/EntryDetailScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SearchScreen from '@/screens/SearchScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { useUI } from '@/store/ui';

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
      </main>
      <BottomNav />
    </div>
  );
}
