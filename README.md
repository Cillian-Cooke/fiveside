# Five-a-side

JavaScript React app (Vite). The homepage is the current week’s fixtures, using last year’s 23 March slot layout and colours.

## Run

```bash
npm install
npm run dev
```

Fixture data is bundled from `src/data/seed.js` (updated by sheet sync).

## Fixtures sheet

The [Google Sheet](https://docs.google.com/spreadsheets/d/19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o/edit) is the source of truth. Edit the sheet; the site follows.

A GitHub Action runs `npm run sync:sheet` every 10 minutes and on demand. If seed data changed, it commits and Vercel redeploys.

- **Sync now:** [Actions → Sync fixtures from sheet → Run workflow](https://github.com/Cillian-Cooke/fiveside/actions/workflows/sync-sheet.yml)
- Optional repo secrets (only if Vercel ignores `github-actions[bot]` pushes):
  - `SYNC_GIT_TOKEN` — personal access token with `contents: write`, so the commit is yours and Vercel deploys it
  - `VERCEL_DEPLOY_HOOK` — Deploy Hook URL from the Vercel project Git settings

Each fixture tab in the sheet is a week. Tab names like `Week 1 28th` and `Week 2 5th` set the Monday date; the site opens on the week that matches today in Europe/Dublin.

```bash
npm run sync:sheet -- --dry-run
npm run sync:sheet
```

Match scores can be added to `seed.js` later (e.g. from the sheet); the UI already shows scores when `homeScore` / `awayScore` are present on fixtures.
