# Mantrailing Log

Mobile-first PWA prototype for journaling mantrailing training sessions.

- All data is local — IndexedDB via Dexie. No backend, no accounts.
- Attach GPX (Dog / Runner / Custom), photos (with thumbnails), and video links.
- 365-day GitHub-style heatmap with emoji per dominant component.
- Per-component status (Good / Problems / With Help / Not Solved) + ratings + free notes.
- Faithful to the source spreadsheets (TRAINING_LOG, VARIABLES, CRITERIA).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or load it on your phone over LAN).

## Build

```bash
npm run build
npm run preview
```

## See also

- [docs/PLAN.md](./docs/PLAN.md) — full design (domain model, screens, build steps).
- [CLAUDE.md](./CLAUDE.md) — Claude Code project notes.

## Stack

Vite · React 18 · TypeScript · Tailwind · Dexie · React Router · Zustand · Leaflet · @tmcw/togeojson · Recharts · vite-plugin-pwa.
