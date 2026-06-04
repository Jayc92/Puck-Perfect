# Puck Perfect

Puck Perfect is a frontend-only single-page draft game where you build an all-time six-player hockey lineup and try to finish a perfect regular season. The default target is `82-0`, but the simulator also supports `84-0` to account for alternate historical or future schedule formats.

## Run locally

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

To run the automated game-logic checks:

```bash
npm test
```

To build a larger historical NHL dataset from the public stats API:

```bash
npm run build:data
```

Optional flags:

```bash
npm run build:data -- --start-season=19701971 --end-season=20242025 --min-games=100
```

More precise cutoff flags are also supported:

```bash
npm run build:data -- --min-skater-games=40 --min-skater-points=80 --min-goalie-games=30 --min-goalie-wins=20
```

## How the draft works

1. The game spins a franchise and decade prompt such as `Detroit, 1990s`.
2. It shows `3-5` eligible players from that franchise-era pool.
3. You draft one player and assign them to an open lineup slot:
   - `LW`
   - `C`
   - `RW`
   - `D1`
   - `D2`
   - `G`
4. Duplicate players are blocked.
5. If a franchise/decade pool cannot offer at least three eligible players for the current open positions, the game rerolls automatically before the prompt is shown.
6. Once all six slots are filled, the season is simulated with deterministic randomness so the result is reproducible from the final lineup and season length.

## Scoring rules

The scoring model lives in [`src/lib/scoring.ts`](/Users/joseph.carfagno/Documents/82%20Tool/src/lib/scoring.ts) and is intentionally transparent.

- Skaters use per-game production with position-aware weighting.
- Centers lean more on assists, points, and two-way value.
- Wingers lean more on goals, points, and offensive finishing.
- Defensemen get extra weight for defensive impact and blue-line-adjusted offense.
- Goalies use save percentage, goals-against average, shutouts, and win rate.
- Era multipliers normalize players from different scoring environments.
- Awards only add a small bonus when award data exists.
- Older defensive stats are estimated conservatively when coverage is incomplete.

Team score weights:

- Forwards: `42%`
- Defense: `27%`
- Goalie: `23%`
- Chemistry and fit: `8%`

Position fit matters. Balanced lineups usually simulate better than six pure scorers.

## Data notes

The included roster in [`src/data/samplePlayers.ts`](/Users/joseph.carfagno/Documents/82%20Tool/src/data/samplePlayers.ts) is a deliberately small sample dataset so the MVP works offline right away. It is not a complete all-time NHL player pool.

- `sourceQuality: "sample"` is used to make that limitation explicit.
- Franchise alias handling lives in [`src/data/sampleFranchises.ts`](/Users/joseph.carfagno/Documents/82%20Tool/src/data/sampleFranchises.ts).
- The loader in [`src/data/playerDataset.ts`](/Users/joseph.carfagno/Documents/82%20Tool/src/data/playerDataset.ts) isolates data access so game logic does not need to change when a larger dataset is added.

## Replacing the sample data

To swap in a larger dataset later:

1. Create a richer player source such as a JSON asset or generated data file.
2. Keep the same core player and franchise types from [`src/types.ts`](/Users/joseph.carfagno/Documents/82%20Tool/src/types.ts).
3. Update only [`src/data/playerDataset.ts`](/Users/joseph.carfagno/Documents/82%20Tool/src/data/playerDataset.ts) to load the new dataset.
4. Leave the draft, scoring, simulation, and UI logic untouched.

The importer at [`scripts/build-nhl-data.ts`](/Users/joseph.carfagno/Documents/82%20Tool/scripts/build-nhl-data.ts) fetches public NHL team, skater, and goalie summaries, normalizes franchise lineage, and writes a runtime asset at [`public/data/nhl-dataset.json`](/Users/joseph.carfagno/Documents/82%20Tool/public/data/nhl-dataset.json). The app will prefer that generated asset automatically and fall back to the bundled sample roster if the asset is empty or missing.

Notes on the generated import:

- It targets regular-season data only.
- It currently supports historical pulls from `1970-71` forward for the live game pool.
- It resolves older team rows through NHL tri-codes when stat rows do not include franchise IDs directly.
- By default it filters out very short careers with separate skater and goalie thresholds:
  skaters need `40` games or `80` career points, and goalies need `30` games or `20` wins.
- Players are tagged into every supported decade they played for a franchise. That means a long-tenure player can appear in multiple decade pools for the same club.
- The current import uses aggregated player stat lines rather than fully decade-sliced card stats, so multi-era players are not yet split into separate per-decade stat profiles.

## Why `seasonGames` supports 82 and 84

The current NHL standard is 82 games, so that is the default target. The alternate 84-game mode exists to support historical/future schedule experimentation and to keep the simulation logic flexible without rewriting the app.

## Shareable testing link

Puck Perfect is a frontend-only Vite app, so it is easy to publish for a couple of testers. There is no backend required for the MVP, and the generated NHL dataset already ships as a static JSON asset in [`public/data/nhl-dataset.json`](/Users/joseph.carfagno/Documents/82%20Tool/public/data/nhl-dataset.json).

Fastest options:

1. Vercel
2. Netlify
3. Cloudflare Pages

### Quickest Vercel path

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Keep the default build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy and share the generated preview URL.

This repo already includes a small [`vercel.json`](/Users/joseph.carfagno/Documents/82%20Tool/vercel.json) rewrite so future client-side routes stay safe even if the app moves beyond hash-based result sharing.

### Quickest Netlify path

1. Push this repo to GitHub, or drag-and-drop the built `dist/` folder into Netlify.
2. If connecting the repo, use:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Deploy and share the generated site URL.

This repo includes [`netlify.toml`](/Users/joseph.carfagno/Documents/82%20Tool/netlify.toml) and [`public/_redirects`](/Users/joseph.carfagno/Documents/82%20Tool/public/_redirects) so single-page-app refreshes resolve correctly.

### What to sanity-check after deploying

- Open the deployed home page on desktop and mobile.
- Complete a full draft and confirm the season sim runs.
- Open a copied result link with the hash intact and confirm it loads the shared result.
- Test the generated PNG share card in the deployed browser.
- Refresh the page once on a result URL to confirm the host serves the app shell cleanly.
