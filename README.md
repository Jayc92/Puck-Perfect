# Puck Perfect

Puck Perfect is a frontend-only single-page NHL draft game where you hire a coach, build a seven-round all-time hockey team, and try to finish a perfect `84-0` season.

The live game currently supports two modes:

- `84-0 without cap`
- `84-0 with a $20 salary cap`

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run automated checks:

```bash
npm test
```

Rebuild the generated NHL dataset:

```bash
npm run build:data
```

Example importer flags:

```bash
npm run build:data -- --start-season=19701971 --end-season=20252026
```

## How the draft works

1. Choose either `84-0 without cap` or `84-0 with $20 cap`.
2. Round 1 always drafts a head coach.
3. The next six rounds spin a franchise and decade prompt such as `Edmonton Oilers, 1980s`.
4. You draft one player from that franchise-era pool and place them into an eligible open slot:
   - `LW`
   - `C`
   - `RW`
   - `D1`
   - `D2`
   - `G`
5. Duplicate players are blocked.
6. If a franchise/decade pool cannot offer enough valid candidates for the current board state, the game rerolls automatically.
7. Once the coach and all six lineup slots are filled, the season sim runs with deterministic randomness so the result is reproducible from the final build.

## Salary cap mode

The `$20` cap mode prices players by their decade scoring output:

- `850+` decade points = `$5`
- `700-849` = `$4`
- `550-699` = `$3`
- `400-549` = `$2`
- `<400` = `$1`

The coach is not charged against the cap in the current build.

## Scoring rules

The scoring model lives in [`src/lib/scoring.ts`](/Users/joseph.carfagno/Documents/82%20Tool/src/lib/scoring.ts).

Current skater priorities:

- decade point totals are the main rating driver
- points per game separates elite peak scorers from merely long-lived scorers
- goals are weighted slightly above assists
- games played / longevity tiers help prevent tiny-sample seasons from floating too high
- awards add a small trophy bump

Current goalie priorities:

- wins
- save percentage
- awards
- goals-against average
- shutouts

Current team score weights:

- forwards: `36%`
- defense: `20%`
- goalie: `20%`
- coach: `6%`
- chemistry and fit: `18%`

## Data notes

- The generated historical pool currently covers the `1970s` through the `2020s` for live gameplay.
- The importer writes a runtime asset to [`public/data/nhl-dataset.json`](/Users/joseph.carfagno/Documents/82%20Tool/public/data/nhl-dataset.json).
- The app prefers that generated asset automatically and falls back to the bundled sample roster if it is missing.
- Player cards now use decade-sliced stat profiles, so a player's `1980s` version can rate very differently from that same player's `1990s` version.
- Primary positions are tightened post-import, and we can patch obvious bad labels through the override layer without regenerating the whole scoring model.

## Import pipeline

The importer at [`scripts/build-nhl-data.ts`](/Users/joseph.carfagno/Documents/82%20Tool/scripts/build-nhl-data.ts):

- fetches public NHL team, skater, and goalie summaries
- normalizes franchise lineage
- groups stats into `player + franchise + decade` cards
- writes the runtime JSON asset used by the app

The current generated pool is intended for game balance first, not as a complete archival database.

## Deployment

Puck Perfect is a static Vite app, so it deploys cleanly to Vercel or Netlify.

### Vercel

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Keep:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy.

### Netlify

1. Push the repo to GitHub, or drag the built `dist/` folder into Netlify.
2. If connecting the repo, use:
   - Build command: `npm run build`
   - Publish directory: `dist`

## What to sanity-check after deploying

- start both open mode and cap mode
- finish a full seven-round draft
- confirm cap mode blocks unaffordable players
- open a shared result link and confirm the board restores correctly
- test the share preview / PNG export on desktop and mobile
