import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export type Density = 'small' | 'compact' | 'detailed';
export type Theme = 'light' | 'dark' | 'system';

export interface FilterState {
  query: string;
  tags: string[];
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  dogId?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
}

interface UIState {
  density: Density;
  setDensity: (d: Density) => void;

  theme: Theme;
  setTheme: (t: Theme) => void;
  applyTheme: () => void;

  activeDogId?: string;
  setActiveDogId: (id?: string) => void;

  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  resetFilters: () => void;

  presets: FilterPreset[];
  savePreset: (name: string, filters: FilterState) => void;
  deletePreset: (id: string) => void;
  loadPreset: (id: string) => void;
}

const emptyFilters: FilterState = { query: '', tags: [] };

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      density: 'compact',
      setDensity: (density) => set({ density }),

      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        get().applyTheme();
      },
      applyTheme: () => {
        const { theme } = get();
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark', dark);
      },

      activeDogId: undefined,
      setActiveDogId: (id) => set({ activeDogId: id }),

      filters: emptyFilters,
      setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
      resetFilters: () => set({ filters: emptyFilters }),

      presets: [],
      savePreset: (name, filters) =>
        set({ presets: [...get().presets, { id: nanoid(), name, filters }] }),
      deletePreset: (id) =>
        set({ presets: get().presets.filter((p) => p.id !== id) }),
      loadPreset: (id) => {
        const preset = get().presets.find((p) => p.id === id);
        if (preset) set({ filters: preset.filters });
      }
    }),
    { name: 'mtlog.ui' }
  )
);
