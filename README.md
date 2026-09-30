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

League grid: [Google Sheet](https://docs.google.com/spreadsheets/d/19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o/edit). Sync into local seed data:

```bash
node scripts/sync-fixtures-from-sheet.mjs --dry-run --week-id YYYY-MM-DD --starts-on YYYY-MM-DD --range-label "Mon – Fri dates"
node scripts/sync-fixtures-from-sheet.mjs --week-id YYYY-MM-DD --starts-on YYYY-MM-DD --range-label "Mon – Fri dates"
```

See `npm run sync:sheet` (runs team lookup refresh first).
