# Mantrailing Training Log — Mobile-First PWA Prototype

## Context

Mantrailing is a scent-tracking discipline where a dog follows a specific person's trail. The handler must plan, run, and analyse each trail (THINK → PLAN → DO → ANALYSE) and progress is tracked across many *components* (Door ID, Split Trail, High/Low Find, Back Track, Casting, Blind Trail, etc.) and many *variables* (type of start, age of trail, surface, area, runner, scent article, weather, length…).

Today the user records this on paper / Excel (`TRAINING_LOG_EN.xlsx`, `VARIABLES_ENTRENAMIENTO_eng.xlsx`, `Criterios.xlsx`). That doesn't scale: it's hard to see progression over time, hard to filter, and impossible to attach the GPX traces from the dog's GPS collar plus the runner's phone, photos, or video links to the right entry.

This plan delivers a **mobile-first cross-platform PWA prototype** that lets a handler:
- Log a trail with full fidelity to the source spreadsheets.
- Attach GPX (Dog, Runner, custom) and visualise them on a map.
- Attach photos and video links.
- Browse history as a list (3 densities) and as a GitHub-style 365-day heatmap with emoji-coded components.
- Filter / search across entries and see aggregate statistics.

**Decisions confirmed with the user:**
- Stack: Vite + React + TypeScript (PWA, installable to home screen, works offline).
- Storage: local-only (IndexedDB via Dexie) — no backend, no auth, no cost.
- Multiple dogs from day one.
- Full fidelity to the Excel variables.

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Build | **Vite + React 18 + TypeScript** | Fast HMR, mobile-friendly bundle, easy PWA. |
| Styling | **TailwindCSS** + CSS variables for theme | Mobile-first utilities, dark mode trivial. |
| Routing | **react-router-dom v6** | Standard SPA routing. |
| State | **Zustand** | Lightweight global store for filters/UI; data lives in Dexie. |
| Local DB | **Dexie.js** (IndexedDB) | Stores entries + blobs (GPX text, photos) reliably; live queries via `dexie-react-hooks`. |
| Forms | **react-hook-form** + **zod** | Big form, conditional fields, validation. |
| Maps | **Leaflet** + **react-leaflet** + OpenStreetMap tiles | No API key, free, works offline-cached. |
| GPX parsing | **@tmcw/togeojson** (+ `xmldom`) | GPX → GeoJSON, render as polylines. |
| Charts | **Recharts** | Stats screen (bar/line/donut). |
| Icons | **lucide-react** | Consistent icon set. |
| PWA | **vite-plugin-pwa** (Workbox) | Installable, offline shell, manifest. |
| Date | **date-fns** | Heatmap math, formatting. |
| IDs | **nanoid** | Stable local IDs. |

## Domain model (mantrailing)

Sourced from the three spreadsheets and the PDF (Hungary progression deck).

**Components** (assessed individually per trail; emojis used in heatmap):
`TARGET 🎯 · WEATHER ☁️ · DOOR/OBSTACLE ID 🚪 · SPLIT TRAIL 🍴 · OBSTACLE CROSSING 🪜 · HIGH FIND ⬆️ · LOW FIND ⬇️ · BACK TRACK ↩️ · STOP/GO 🛑 · CHANGE SURFACE 🛣️ · LINE UP 👥 · WALKING ID 🚶 · CONTAMINATED SCENT ART. 🧪 · NSI ❌ · VPU 🚗 · CONTROLLED CASTING 🎣 · CASTING IN INTERSECTION ➕ · BLIND TRAIL 🙈 · BRIDGE 🌉 · RIVER 🌊` (+ user-defined "OTHER").

**Variables (we decide):** type of start (Intensity / Delayed / Scent Art / Casting / Flip), known vs blind trail (Known / 100% Blind / Blind w help / Blind start / Blind end / Double blind), area (Rural[Soil/Farm/Bushes/Woods/Meadows/Beach/Mix] · Urban[City Center/Outskirts/Town/Residential/Shopping/Industrial/Sports] · Mixed), age of trail (Fresh / 3h / 6h / 12h / 24h / 25h+), time of day (Dawn/Morning/Midday/Afternoon/Evening/Night), surface (Asphalt/Cement/Earth/Grass/Gravel/Mud/Sand/Mixed), runner (Unknown/Known/Frequent/Favourite/Child/Youth/Adult/Elderly/Handicapped), end position (On sight: Sitting/Standing/Crouching/Walking/Lying · Hidden: High/Low/Behind obstacle/Lying covered · No runner), length (<100, 100-200, 200-300, 400-600, 600-800, >800), scent article (Soft/Hard/Big/Small/Target/Contaminated/Bag/No bag), weather (Sun, 50% Cloudy, 100% Cloudy, Light rain, Heavy rain, Breeze, Wind, Storm, Fog, Snow).

**We do NOT decide:** weather changes, distractions, unexpected situations, problems of runner / dog / handler — captured as free-text observations in the assessment.

**Per-trail assessment grid:** for each chosen component → status ∈ { Good · Problems · With Help · Not Solved } + comments.

**Handler eval:** Starting routine, Leash handling, Body position, Reading the dog (1–5 + notes).
**Dog eval:** Motivation, Confidence, Negatives, Other (1–5 + notes).

## Data model (TypeScript + Dexie)

```ts
// src/db/schema.ts
type ID = string;

interface Dog { id: ID; name: string; breed?: string; dob?: string; photoBlobId?: ID; notes?: string; createdAt: number; }
interface Handler { id: ID; name: string; isDefault?: boolean; }

interface Entry {
  id: ID;
  dogId: ID;
  handlerId?: ID;
  date: string;            // YYYY-MM-DD (used by heatmap & filters)
  time?: string;           // HH:mm
  location?: string;       // free text label
  geo?: { lat: number; lng: number };
  instructor?: string;

  // Variables we decide
  typeOfStart?: TypeOfStart;
  trailKnowledge?: TrailKnowledge;     // Known / Blind variants
  ageOfTrail?: AgeOfTrail;
  timeOfDay?: TimeOfDay;
  area?: { kind: 'Rural'|'Urban'|'Mixed'|'Other'; sub?: string };
  surface?: Surface;
  weather?: Weather[];                  // multi
  length?: TrailLength;
  runner?: RunnerProfile;
  scentArticle?: ScentArticle[];
  endPosition?: EndPosition;

  // Components performed + per-component assessment
  components: Array<{
    key: ComponentKey | string;          // string for "OTHER:" custom
    customLabel?: string;
    status: 'good'|'problems'|'with_help'|'not_solved';
    comments?: string;
  }>;

  goal?: string;                         // "GOAL OF THE TRAIL"
  trailComments?: string;                // free text (assessment of the trail)
  observations?: string;                 // distractions, unexpected, problems

  handlerEval?: { startingRoutine?: 1|2|3|4|5; leashHandling?: 1|2|3|4|5; bodyPosition?: 1|2|3|4|5; readingTheDog?: 1|2|3|4|5; comments?: string; };
  dogEval?:     { motivation?: 1|2|3|4|5; confidence?: 1|2|3|4|5; negatives?: 1|2|3|4|5; other?: 1|2|3|4|5; comments?: string; };

  tags: string[];                        // user-defined, used for search
  createdAt: number;
  updatedAt: number;
}

interface Attachment {
  id: ID;
  entryId: ID;
  kind: 'gpx'|'photo'|'video_link';
  // gpx
  gpxRole?: 'dog'|'runner'|'custom';
  gpxLabel?: string;                     // custom name when role=custom
  gpxColor?: string;                     // hex
  gpxText?: string;                      // raw XML stored in DB
  // photo
  photoBlob?: Blob;
  thumbBlob?: Blob;
  // video_link
  url?: string;
  caption?: string;
  createdAt: number;
}
```

Dexie stores: `dogs`, `handlers`, `entries`, `attachments`. Indexes on `entries.date`, `entries.dogId`, `entries.tags*` (multi), `attachments.entryId`.

## Project layout

```
mntrlng-log/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tailwind.config.js
├─ postcss.config.js
├─ tsconfig.json
├─ public/
│  └─ icons/ (PWA icons)
└─ src/
   ├─ main.tsx
   ├─ App.tsx                       # router shell + bottom nav
   ├─ db/
   │  ├─ schema.ts                  # types
   │  ├─ db.ts                      # Dexie instance
   │  └─ seed.ts                    # demo data toggle
   ├─ domain/
   │  ├─ components.ts              # COMPONENT registry (key, label, emoji)
   │  ├─ variables.ts               # enums for all dropdowns from Excel
   │  └─ stats.ts                   # aggregations for History screen
   ├─ lib/
   │  ├─ gpx.ts                     # GPX → GeoJSON helper
   │  ├─ images.ts                  # photo → thumbnail (canvas)
   │  └─ format.ts                  # date/length helpers
   ├─ store/
   │  └─ ui.ts                      # Zustand: density, filters
   ├─ components/
   │  ├─ BottomNav.tsx
   │  ├─ EntryTile.tsx              # 3 densities: small/compact/detailed
   │  ├─ FilterBar.tsx              # text · tags · date range
   │  ├─ Heatmap365.tsx             # GH-style grid with emojis
   │  ├─ TrailMap.tsx               # Leaflet w/ multi-GPX layers
   │  ├─ AttachmentList.tsx
   │  ├─ PhotoPicker.tsx
   │  ├─ GpxPicker.tsx
   │  └─ form/
   │     ├─ Section.tsx             # collapsible form section
   │     ├─ ChipMulti.tsx           # multi-select chips
   │     ├─ Segmented.tsx           # single-select chips
   │     ├─ Rating5.tsx             # 1–5 dots
   │     └─ ComponentAssessor.tsx   # add/remove components + status
   ├─ screens/
   │  ├─ MainScreen.tsx             # list + density toggle + filters
   │  ├─ NewEntryScreen.tsx         # create / edit entry
   │  ├─ EntryDetailScreen.tsx      # view single entry
   │  ├─ HistoryScreen.tsx          # heatmap + stats
   │  ├─ SearchScreen.tsx           # full-text + tags + date
   │  └─ SettingsScreen.tsx         # dogs/handlers, export/import
   └─ styles/
      └─ index.css
```

## Screen specs

### Main (`/`)
- Top: app title + active dog selector pill + density toggle (`◻ small · ▢ compact · ▣ detailed`).
- `FilterBar` collapsible: text query, tag chips (suggested from existing tags), date-range picker.
- Virtualised list of `EntryTile` cards. Tap → Entry detail.
- FAB (bottom-right above nav): `+ New entry`.
- **Densities** (the same data, different reveal):
  - **small**: 1 line — date · 🐶 dog · 3 component emojis · status dot.
  - **compact**: 2–3 lines — date · location · components row · trail length · 1 attachment thumb.
  - **detailed**: tile preview — date+time, dog, location, full component chips with status colour, mini map preview if GPX present, photo strip.

### New / Edit entry (`/new`, `/entry/:id/edit`)
Single scrollable form, grouped into collapsible `Section`s in this order so nothing is hidden behind tabs (mobile-friendly):
1. **Basics** — date (default today), time, dog selector, location (text), "use my location" button (geolocation API), instructor.
2. **Trail setup** — type of start, trail knowledge, age of trail, time of day, length, area (kind + sub), surface, weather (multi).
3. **Runner & scent article** — runner profile, scent article (multi), end position.
4. **Components** — `ComponentAssessor`: add component chips from the registry (or "+ Other"); for each, set status (Good/Problems/With Help/Not Solved) + comments. Goal of the trail field above.
5. **Assessment** — handler eval (4 ratings), dog eval (4 ratings), free-text observations (distractions/unexpected/problems).
6. **Attachments** —
   - **GPX**: pick files (`<input accept=".gpx" multiple>`). Each file gets a role selector (Dog / Runner / Custom + name) and colour. Live-preview map below as files are added.
   - **Photos**: gallery+camera picker, generates 256-px thumb on-device.
   - **Video links**: URL list with caption.
7. **Tags & notes** — comma-chip input, free notes.

Save persists the entry + attachments transactionally in Dexie.

### Entry detail (`/entry/:id`)
Read-only render of the form sections + full-screen map showing all GPX layers with a legend, photo lightbox, video link cards. Edit button → `/entry/:id/edit`. Delete with confirm.

### History (`/history`)
- **Heatmap365**: 53 × 7 grid of day cells. Cell is empty (light) if no entry, else coloured by entry count and **shows the dominant component emoji** for that day (multiple entries → most-trained component that day, badge dot for count). Tooltip on long-press; tap → list of that day's entries → entry detail.
- **Stats** (Recharts):
  - Trails per month (bar).
  - Components trained — frequency + % "Good" outcome (horizontal bar, sorted).
  - Variable mix donuts: surface, area kind, age of trail.
  - Handler & Dog ratings trend over last 90 days (line).
  - Streak: current / longest.
  - Total trails, total km (sum from GPX dog-track length).

### Search (`/search`)
Dedicated screen with the same filters as Main but always-expanded plus result count, sort options (newest, oldest, longest), and saved filter presets stored in Zustand.

### Settings (`/settings`)
Dogs CRUD, handlers CRUD, default dog, theme (light/dark/system), export all data as JSON+blobs zip, import from same.

## Build steps (one task at a time, in order)

Each step ends with the app still running (`npm run dev`) and the user able to verify in a browser.

1. **Repo bootstrap**: create CLAUDE.md (with the stream-timeout + incremental-edit rules below), `.gitignore`, scaffold Vite React-TS app, install deps (tailwind, dexie, dexie-react-hooks, react-router-dom, zustand, react-hook-form, zod, leaflet, react-leaflet, @tmcw/togeojson, @xmldom/xmldom, recharts, lucide-react, date-fns, nanoid, vite-plugin-pwa). Configure Tailwind, base CSS, PWA manifest + icons. Commit.
2. **Domain registries**: write `domain/components.ts` (component key/label/emoji table) and `domain/variables.ts` (all enums from the Excel). Pure data, no UI.
3. **DB layer**: `db/schema.ts` types and `db/db.ts` Dexie setup with versioned schema + `seed.ts` (one demo dog + 3 demo entries). Add a tiny dev-only "Load demo data" button later.
4. **App shell**: `App.tsx` with router, `BottomNav` (Main / New / History / Search / Settings), theme toggle, mobile-safe layout (safe-area insets, sticky bottom nav).
5. **Main screen v1**: list of entries from Dexie (live query), 3-density toggle wired to Zustand, `EntryTile` for each density, FAB to `/new`. No filters yet.
6. **FilterBar**: text/tag/date-range filters, applied client-side over the live query.
7. **New entry form skeleton**: react-hook-form + zod, sections 1–3 (Basics, Trail setup, Runner & scent). Save round-trips through Dexie. Edit route reuses same component.
8. **Components assessor**: add/remove component chips with per-item status + comments; ensure "Other" custom labels work.
9. **Assessment & ratings**: handler/dog eval blocks, observations, goal, tags, notes.
10. **GPX attachments + map**: `GpxPicker` accepts files, `lib/gpx.ts` parses to GeoJSON, `TrailMap` overlays each track with role colour and legend. Compute total length from "Dog" track for stats.
11. **Photo + video link attachments**: thumbnail generation via canvas, lightbox view, URL list with simple validation.
12. **Entry detail screen**: read-only render of everything saved + map + media.
13. **History heatmap + stats**: `Heatmap365` (53×7), aggregate emojis per day, click-through; Recharts panels for the stats listed in the History spec.
14. **Search screen**: re-use FilterBar in always-expanded mode, sort dropdown, saved presets in Zustand.
15. **Settings**: dogs/handlers CRUD, default dog selector, JSON+blob export/import (use a single `.mtlog.zip`).
16. **Polish**: empty states, loading skeletons, dark mode pass, accessibility (label/aria), bundle audit, install-prompt copy. Verify dev server in mobile emulation.

Commits after each step on branch `claude/mantrailing-app-prototype-NmZYz`.

## CLAUDE.md to be created at repo root

```
# Mantrailing Log — Project Notes

This is a mobile-first PWA prototype for logging mantrailing training sessions.
Stack: Vite + React + TypeScript + Tailwind + Dexie (IndexedDB) + Leaflet + Recharts.
All data is local-only. See plan file for the full domain model.

## Stream Timeout Prevention

1. Do each numbered task ONE AT A TIME. Complete one task fully,
   confirm it worked, then move to the next.
2. Never write a file longer than ~150 lines in a single tool call.
   If a file will be longer, write it in multiple append/edit passes.
3. Start a fresh session if the conversation gets long (20+ tool calls).
   The error gets worse as the session grows.
4. Keep individual grep/search outputs short. Use flags like
   --include and -l (list files only) to limit output size.
5. If you do hit the timeout, retry the same step in a shorter form.
   Don't repeat the entire task from scratch.

Please DO NOT write the entire the plan file at once, use the Edit tool to append.
```

## Critical files to create / modify

- `CLAUDE.md` (new) — see block above.
- `package.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `index.html`, `public/manifest.webmanifest` + icons — Vite/Tailwind/PWA scaffold.
- `src/main.tsx`, `src/App.tsx` — shell + router.
- `src/db/schema.ts`, `src/db/db.ts`, `src/db/seed.ts` — Dexie + types.
- `src/domain/components.ts`, `src/domain/variables.ts`, `src/domain/stats.ts` — domain registries.
- `src/lib/gpx.ts`, `src/lib/images.ts`, `src/lib/format.ts` — utilities.
- `src/store/ui.ts` — Zustand store.
- `src/components/*` — `BottomNav`, `EntryTile`, `FilterBar`, `Heatmap365`, `TrailMap`, `AttachmentList`, `PhotoPicker`, `GpxPicker`, `form/*`.
- `src/screens/*` — `MainScreen`, `NewEntryScreen`, `EntryDetailScreen`, `HistoryScreen`, `SearchScreen`, `SettingsScreen`.

No existing files to refactor (repo currently has only `README.md`).

## Verification

End-to-end check after step 16:
1. `npm install && npm run dev` → open Chrome DevTools mobile emulation (iPhone 14).
2. Settings → add a dog "Rex". Set as default.
3. Main → FAB → fill a new entry: today, location "Park", area Rural/Woods, surface Mixed, weather Sun + Breeze, age 3h, type-of-start Delayed; pick components Door ID (Good) + Split Trail (Problems, "lost it at the Y") + High Find (With Help); rating sliders; tag `green-belt`; attach a sample `.gpx` from `public/sample/dog.gpx` as Dog and `runner.gpx` as Runner; attach 1 photo from disk; add YouTube URL. Save.
4. Main → confirm tile renders in all 3 densities (toggle).
5. Tap tile → detail screen → map shows two coloured polylines, photo opens lightbox, video link opens new tab.
6. History → today cell is filled and shows 🚪 (or other dominant emoji); stats panels populate.
7. Search → search "split", filter tag `green-belt`, date range = today → entry shows.
8. Edit entry → change one component status → save → list/heatmap reflect change.
9. Refresh browser → data persists (IndexedDB). Toggle airplane mode → app still loads (PWA cache).
10. Settings → Export → re-import on a fresh profile → entries restored with attachments.

Tests are not in scope for the prototype; verification is manual via the steps above.
