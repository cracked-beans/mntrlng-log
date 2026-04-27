import { Routes, Route, Navigate } from 'react-router-dom';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted mt-2">Coming next.</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      <main className="flex-1 max-w-app mx-auto w-full">
        <Routes>
          <Route path="/" element={<Placeholder title="Mantrailing Log" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
