# Born Here

An interactive map of the most famous person born in every district of an Indian state.

- **Home**: an India map. Tap a state to open its district map. All 36 states and UTs have district maps.
- **State page**: a district map in poster style. It has a state switcher, search, category filters, a hover/tap side panel (a bottom sheet on mobile), "Suggest a change" (saved to localStorage) and "Download as image" (a PNG poster).
- **About**: explains the method.

Stack: React, Vite, TypeScript, Tailwind v4, d3-geo / d3-zoom and topojson. There is no backend.

## Run

```sh
npm install
npm run dev      # local dev
npm run build    # static site in dist/ (works from any sub-path)
```

## Data

People data lives in `public/data/<state-slug>.json`, one array per state:

```json
{ "district": "Hyderabad", "person": "", "knownFor": "", "category": "", "birthplace": "",
  "birthYear": "", "confidence": "Open slot", "note": "", "sourceUrl": "" }
```

- `district` must match the `district` property in the GeoJSON. Matching ignores case and punctuation.
- `category` is one of: Politics, Film & Music, Literature, Sports, Freedom Struggle, Religion & Spirituality, Military.
- `confidence` is one of: Verified, Disputed, Legendary, Open slot.
- If `person` is empty, the map shows a grey "?".

### Add a state

1. Create `public/data/<slug>.json`. The slugs are listed in `public/geo/state-list.json`.
2. Add the state to `FEATURED_STATES` in `src/states.ts` so it shows up as a tab.
3. To force a district's label outside the map, add it to `FORCE_CALLOUT` in the same file. Tiny districts get an outside label automatically.

## Map geometry

Boundaries come from [udit-001/india-maps-data](https://github.com/udit-001/india-maps-data). They have been simplified into TopoJSON. To regenerate them:

```sh
git clone --depth 1 https://github.com/udit-001/india-maps-data /tmp/imd
scripts/build-geo.sh /tmp/imd
```
