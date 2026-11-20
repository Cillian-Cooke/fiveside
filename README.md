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

Playoff ties use the same Results tab. Leave `stage` blank on a league game. One tie is one row, added as soon as either side is known. The fixtures sheet is unchanged and still says when and where a game is played. The site matches the two sheets by the week Monday and the two club names, then shows that stage on the bracket and on each club’s next game and past results.

`stage` is `Quarter-final`, `Semi-final`, or `Final`. Shorter forms (`quarter`, `qf`, `semi`, `sf`, `final`) are fine. `division` is required (`Division 4`, `Div 4`, or `Mixed`). `home` is the top of the tie and `away` is the bottom. One of them can be blank; that side stays an empty slot. `weekStartsOn`, `playedOn`, `homeScore`, and `awayScore` stay blank until the match is played.

`slot` is optional, so existing rows and other tooling keep working if the column is missing or the cell is empty. A blank slot fills the next open tie in that round, in sheet order. A filled slot pins the row: `QF1` to `QF4` (top quarter to bottom), `SF1` and `SF2`, and `F` for the final. `quarter 2` and `semi-final 1` mean the same thing. If `stage` and `slot` disagree, `slot` wins. The first row to claim a slot keeps it. The header can be `slot` or `tie`.

Leave both score cells empty for an upcoming tie. The bracket does not show that as 0–0. Write both scores, including a real 0, only after the match is played.

A side that is not a club yet is a placeholder. The whole cell has to match, in any capitalisation:

- `TBD`, `TBC`, or `TBA`
- a place, such as `5th` or `5th place`
- a division place, such as `Division 4 8th`, `Div 4 8th`, or `8th in Division 4`
- a feeder, such as `Winner QF1`, `Winner of SF2`, or `QF1 winner`

Placeholders are drawn in the bracket and are not club links. They are left out of the league tables and team pages, even when the row has scores. Put the club’s name in that cell before a score should count.

```
division,home,away,homeScore,awayScore,stage,slot
Division 4,Real Medrid,5th place,,,Quarter-final,QF1
Division 4,Inter Milanagement,,,,Quarter-final,QF2
Division 4,CSB FC,Ø Zone,2,1,Quarter-final,QF4
Division 4,Winner QF1,Winner QF2,,,Semi-final,SF1
```

QF2’s bottom side is empty. QF3 has no row, so both of its slots stay empty. The QF4 score is shown. The other ties are upcoming.

## Deep links

The app is a client-side router. Vercel only serves a file when one exists, so a direct open of `/teams` or `/teams/<slug>` used to come back as plain text `NOT_FOUND`. `vercel.json` rewrites every other path to `index.html` after the filesystem is checked. `/api/*` (including `/api/fixtures` and `/api/og`) and built files under `/assets/` are excluded from that rewrite. Link-preview bots still get share HTML from `middleware.js` on `/`, `/week/*`, `/tables`, `/playoffs`, and `/teams/*`.

After a production deploy, these should be `200` with `content-type: text/html` and a document that contains `<div id="root">`. A `text/plain` body of `NOT_FOUND` means the rewrite did not apply:

```bash
curl -sI https://fiveside.vercel.app/teams
curl -sI https://fiveside.vercel.app/tables
curl -sI https://fiveside.vercel.app/teams/git-gud-division-7
```

`/api/fixtures` should stay `application/json`. A WhatsApp user-agent on `/teams/<slug>` should stay `200` HTML with `cache-control` containing `s-maxage=120`.
