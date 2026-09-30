/**
 * Pull Trinity five-a-side fixtures from the league Google Sheet (CSV export)
 * and update src/data/seed.js MATCHES + week metadata.
 *
 * Usage:
 *   node scripts/sync-fixtures-from-sheet.mjs [options]
 *
 * Options:
 *   --sheet-id ID     (default: league fixtures sheet)
 *   --gid 0           Sheet tab gid for export URL
 *   --week-id YYYY-MM-DD
 *   --starts-on YYYY-MM-DD
 *   --range-label "29 Sep – 3 Oct"
 *   --dry-run         Print summary only; do not write seed.js
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const DEFAULT_SHEET_ID = '19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o'

const DIVISION_COLORS = {
  'Division 1': '#F9CB9C',
  'Division 2': '#FFE599',
  'Division 3': '#CFE2F3',
  'Division 4': '#EA9999',
  'Division 5': '#B4A7D6',
  'Division 6': '#D9EAD3',
  'Division 7': '#FF9900',
  'Mixed Division': '#1155CC',
  Mixed: '#1155CC',
}

const DAY_BY_COL = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  8: 'monday',
  9: 'tuesday',
  10: 'wednesday',
  11: 'thursday',
  12: 'friday',
}

function parseArgs(argv) {
  const opts = {
    sheetId: DEFAULT_SHEET_ID,
    gid: '0',
    weekId: null,
    startsOn: null,
    rangeLabel: null,
    dryRun: false,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') opts.dryRun = true
    else if (a === '--sheet-id') opts.sheetId = argv[++i]
    else if (a === '--gid') opts.gid = argv[++i]
    else if (a === '--week-id') opts.weekId = argv[++i]
    else if (a === '--starts-on') opts.startsOn = argv[++i]
    else if (a === '--range-label') opts.rangeLabel = argv[++i]
  }
  return opts
}

function normalizeCell(text) {
  return (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseVsCell(text) {
  const cell = normalizeCell(text)
  if (!cell) return null
  const lower = cell.toLowerCase()
  if (lower === 'unavailable' || lower === 'free slot' || lower === '.' || lower === 'free') {
    return { kind: lower === 'unavailable' ? 'unavailable' : 'free' }
  }
  const parts = cell.split(/\s+V\s+/i).map((p) => normalizeCell(p))
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return { kind: 'match', home: parts[0], away: parts[1] }
}

function fetchSheetRows(sheetId, gid) {
  const py = join(dirname(fileURLToPath(import.meta.url)), 'fetch-sheet-rows.py')
  const result = spawnSync('python3', [py, '--sheet-id', sheetId, '--gid', gid], {
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(result.stdout || result.stderr || 'fetch-sheet-rows.py failed')
  }
  const payload = JSON.parse(result.stdout)
  if (payload.error) throw new Error(payload.error)
  return payload.rows
}

function loadTeamLookup() {
  const path = join(root, 'src/data/team-divisions.json')
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return {}
  }
}

function normalizeTeamName(name) {
  return name.trim().replace(/\s+/g, ' ')
}

function lookupDivision(home, away, teams, warnings) {
  const h = normalizeTeamName(home)
  const a = normalizeTeamName(away)
  const th = teams[h] || teams[h.toLowerCase()] || teams[Object.keys(teams).find((k) => k.toLowerCase() === h.toLowerCase())]
  const ta = teams[a] || teams[a.toLowerCase()] || teams[Object.keys(teams).find((k) => k.toLowerCase() === a.toLowerCase())]
  if (th?.division && ta?.division && th.division !== ta.division) {
    warnings.push(`Division mismatch ${h} (${th.division}) vs ${a} (${ta.division}); using ${th.division}`)
  }
  const division = th?.division || ta?.division || 'Mixed Division'
  const color =
    th?.color ||
    ta?.color ||
    DIVISION_COLORS[division] ||
    DIVISION_COLORS['Mixed Division']
  if (!th && !ta) {
    warnings.push(`Unknown teams (default Mixed): ${h} vs ${a}`)
  }
  return { division: division === 'Mixed' ? 'Mixed Division' : division, color }
}

function parseTimeLabel(label) {
  const m = normalizeCell(label).match(/^(\d{1,2}-\d{1,2}(?:am|pm))/)
  return m ? m[1] : null
}

function parseSheetRows(rows, teamLookup) {
  const matches = []
  const warnings = []

  for (const row of rows) {
    const time = parseTimeLabel(row[0])
    const hallLabel = normalizeCell(row[7])
    let hallVenue = null
    if (hallLabel.includes('Hall A')) hallVenue = 'hall_a'
    else if (hallLabel.includes('Hall B')) hallVenue = 'hall_b'

    if (time) {
      for (let idx = 1; idx <= 5; idx++) {
        const day = DAY_BY_COL[idx]
        const parsed = parseVsCell(row[idx])
        if (parsed?.kind === 'match') {
          const { division, color } = lookupDivision(parsed.home, parsed.away, teamLookup, warnings)
          matches.push({
            day,
            time,
            venue: 'botany_bay',
            home: parsed.home,
            away: parsed.away,
            color,
            division,
          })
        }
      }

      if (hallVenue) {
        for (let idx = 8; idx <= 12; idx++) {
          const day = DAY_BY_COL[idx]
          const parsed = parseVsCell(row[idx])
          if (parsed?.kind === 'match') {
            const { division, color } = lookupDivision(parsed.home, parsed.away, teamLookup, warnings)
            matches.push({
              day,
              time: '12-1pm',
              venue: hallVenue,
              home: parsed.home,
              away: parsed.away,
              color,
              division,
            })
          }
        }
      } else {
        for (let idx = 8; idx <= 12; idx++) {
          const parsed = parseVsCell(row[idx])
          if (parsed?.kind !== 'match') continue
          const day = DAY_BY_COL[idx]
          const { division, color } = lookupDivision(parsed.home, parsed.away, teamLookup, warnings)
          matches.push({
            day,
            time: '12-1pm',
            venue: 'hall_a',
            home: parsed.home,
            away: parsed.away,
            color,
            division,
          })
        }
      }
    }
  }

  const key = (m) => `${m.day}|${m.time}|${m.venue}|${m.home}|${m.away}`
  const deduped = [...new Map(matches.map((m) => [key(m), m])).values()]
  return { matches: deduped, warnings }
}

function formatMatchesJs(matches) {
  const lines = matches.map((m) => {
    const home = m.home.replace(/'/g, "\\'")
    const away = m.away.replace(/'/g, "\\'")
    return `  { day: '${m.day}', time: '${m.time}', venue: '${m.venue}', home: '${home}', away: '${away}', color: '${m.color}', division: '${m.division}' },`
  })
  return `const MATCHES = [\n${lines.join('\n')}\n]`
}

function patchSeedJs(seedText, matchesBlock, opts) {
  let out = seedText.replace(/const MATCHES = \[[\s\S]*?\n\]/, matchesBlock)
  if (opts.weekId) {
    out = out.replace(/const CURRENT_WEEK_ID = '[^']+'/, `const CURRENT_WEEK_ID = '${opts.weekId}'`)
    out = out.replace(
      /id: CURRENT_WEEK_ID,\n  label: '[^']*',\n  rangeLabel: '[^']*',\n  startsOn: '[^']*'/,
      `id: CURRENT_WEEK_ID,\n  label: 'Current week',\n  rangeLabel: '${opts.rangeLabel || opts.weekId}',\n  startsOn: '${opts.startsOn || opts.weekId}'`,
    )
  }
  return out
}

async function main() {
  const opts = parseArgs(process.argv)
  const teamLookup = loadTeamLookup()

  const rows = fetchSheetRows(opts.sheetId, opts.gid)
  const { matches, warnings } = parseSheetRows(rows, teamLookup)

  console.log(`Parsed ${matches.length} fixtures from sheet ${opts.sheetId}`)
  if (warnings.length) {
    console.log('\nWarnings:')
    for (const w of warnings) console.log(`  - ${w}`)
  }

  const matchesBlock = formatMatchesJs(matches)
  const seedPath = join(root, 'src/data/seed.js')
  const seedText = readFileSync(seedPath, 'utf8')

  if (opts.dryRun) {
    console.log('\n--- MATCHES preview (first 5) ---')
    console.log(matches.slice(0, 5))
    return
  }

  const next = patchSeedJs(seedText, matchesBlock, opts)
  writeFileSync(seedPath, next)
  console.log(`Updated ${seedPath}`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
