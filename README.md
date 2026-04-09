# Interactive Network Plus

Interactive React study app for CompTIA Network+ (`N10-009`).

## Run locally

- Install deps: `npm install`
- Start dev server: `npm run dev`
- Build production bundle: `npm run build`
- Preview production build: `npm run preview`
- Lint: `npm run lint`

## Editing guide

- Content/data updates:
  - `src/data/fundamentalsData.js`
  - `src/interactive-viewer.jsx` (remaining topic data still lives here)
- Shared UI primitives:
  - `src/components/primitives.jsx`
- Section-level UI:
  - `src/sections/fundamentals.jsx` (currently modularized: OSI + Appliances)
  - `src/interactive-viewer.jsx` (remaining sections)
- Navigation labels/icons:
  - `src/constants/navigation.js`

## Modularization status

- Vite runtime + hot reload is configured.
- Initial modular split is in place.
- Additional sections/data can be migrated incrementally from `src/interactive-viewer.jsx` into `src/sections/*` and `src/data/*` with no behavior change.
