import { NavLink } from 'react-router-dom';
import { Home, Plus, CalendarDays, Search, Settings } from 'lucide-react';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/new', label: 'New', icon: Plus, end: false },
  { to: '/history', label: 'History', icon: CalendarDays, end: false },
  { to: '/search', label: 'Search', icon: Search, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false }
];

export function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 z-30 bg-surface/95 backdrop-blur border-t border-line safe-bottom"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5 max-w-app mx-auto">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs ${
                  isActive ? 'text-brand' : 'text-muted'
                }`
              }
            >
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
