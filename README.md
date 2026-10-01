# Five-a-side

JavaScript React app (Vite). The homepage is the current week’s fixtures, using last year’s 23 March slot layout and colours.

## Run

```bash
npm install
npm run dev
```

The board works from local JavaScript seed data until Firebase is connected.

## Firebase

1. Create a Firestore project.
2. Copy `.env.example` to `.env.local` and fill in the Vite keys.
3. Deploy rules: `npx firebase deploy --only firestore:rules`
4. Temporarily allow writes, run `npm run seed`, then lock writes again.

Collections: `weeks`, `fixtures`.

## Fixtures sheet

The [Google Sheet](https://docs.google.com/spreadsheets/d/19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o/edit) is the source of truth. Edit the sheet; the site follows.

A GitHub Action runs `npm run sync:sheet` every 30 minutes and on demand. If seed data changed, it commits and Vercel redeploys.

- **Sync now:** [Actions → Sync fixtures from sheet → Run workflow](https://github.com/Cillian-Cooke/fiveside/actions/workflows/sync-sheet.yml)
- Optional repo secrets (only if Vercel ignores `github-actions[bot]` pushes):
  - `SYNC_GIT_TOKEN` — personal access token with `contents: write`, so the commit is yours and Vercel deploys it
  - `VERCEL_DEPLOY_HOOK` — Deploy Hook URL from the Vercel project Git settings

Local dry-run / manual sync:

```bash
npm run sync:sheet -- --dry-run
npm run sync:sheet
```

Week dates default to the current Monday in Europe/Dublin. Override with `--week-id`, `--starts-on`, and `--range-label` if needed.
