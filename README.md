# Five-a-side

JavaScript React app (Vite) for the TCD men's five-a-side league. The homepage opens on this week's fixtures.

## Run

```bash
npm install
npm test
npm run dev
```

## Fixtures

The [Google Sheet](https://docs.google.com/spreadsheets/d/19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o/edit) is the source of truth. Organisers keep the existing tab layout (one tab per week, plus Contact Info).

The site loads that sheet through `/api/fixtures` (the public xlsx export, so cell colours are available). Vercel caches the response for about a minute. If the sheet cannot be reached, the app shows the bundled copy in `src/data/seed-payload.json` and says so.

Week dates follow tab order from Monday 28 Sep 2026, seven days at a time. Reading week counts, so Week 5 stays in November 2026.

```bash
node scripts/refresh-seed.mjs
```

That refreshes the bundled fallback only. It is not scheduled.

Match scores live in `src/data/match-results.json` and are matched onto fixtures by week Monday and the two team names.
