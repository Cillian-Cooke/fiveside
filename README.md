# Five-a-side

JavaScript React app (Vite) for the TCD five-a-side league. The homepage opens on this week's fixtures.

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

Match scores come from the [Results sheet](https://docs.google.com/spreadsheets/d/1FP8_MLzGjGBecs3EUyjHZT_rASMqTODmItUFqzstqcA/edit). `/api/fixtures` reads that workbook’s Results tab (public xlsx export, same one-minute cache as the fixtures). Scores are matched onto fixtures by week Monday and the two team names. If the export cannot be reached, the site uses `src/data/match-results.json` so the tables stay up.

To record a score, append a row on the Results tab with `weekStartsOn` (that week’s Monday), `home`, `away`, `homeScore`, and `awayScore`. Anyone-with-the-link viewer sharing has to stay on, or the export stops loading and the site falls back to the saved file. The Unresolved tab is ignored.
