/**
 * Pull Trinity five-a-side fixtures from the league Google Sheet
 * (one tab per week) and update src/data/seed.js.
 *
 * Usage:
 *   node scripts/sync-fixtures-from-sheet.mjs [options]
 *
 * Options:
 *   --sheet-id ID     (default: league fixtures sheet)
 *   --dry-run         Print summary only; do not write seed.js
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { writeDivisionColors } from './division-colors.mjs'
import {
  currentWeekMonday,
  mondayFromTabName,
  shiftStartsOn,
} from '../src/lib/week-dates.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const DEFAULT_SHEET_ID = '19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o'

/** Fallback when xlsx legend is missing (matches sheet legend row on fixtures tab). */
const DEFAULT_COLOR_TO_DIVISION = {
  '#EA9999': 'Division 1',
  '#F9CB9C': 'Division 2',
  '#FFE599': 'Division 3',
  '#B6D7A8': 'Division 4',
  '#A4C2F4': 'Division 5',
  '#B4A7D6': 'Division 6',
  '#D5A6BD': 'Division 7',
  '#6AA84F': 'Mixed Division',
  '#B7B7B7': 'Mixed Division',
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

function detectGridLayout(rows) {
  for (const row of rows) {
    const texts = row.map((cell) => normalizeCell(cellText(cell)).toLowerCase())
    const firstMon = texts.indexOf('monday')
    if (firstMon < 0) continue
    if (!DAYS.every((day, i) => texts[firstMon + i] === day)) continue
    const hallStart = texts.indexOf('monday', firstMon + DAYS.length)
    return {
      timeCol: Math.max(0, firstMon - 1),
      bayStart: firstMon,
      hallLabelCol: hallStart > 0 ? hallStart - 1 : firstMon + DAYS.length,
      hallStart: hallStart > 0 ? hallStart : null,
    }
  }
  return { timeCol: 0, bayStart: 1, hallLabelCol: 7, hallStart: 8 }
}

function parseArgs(argv) {
  const opts = {
    sheetId: DEFAULT_SHEET_ID,
    dryRun: false,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') opts.dryRun = true
    else if (a === '--sheet-id') opts.sheetId = argv[++i]
  }
  return opts
}

function startsOnForTab(name, index) {
  return mondayFromTabName(name) || shiftStartsOn(currentWeekMonday(), index)
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

function fetchSheetCells(sheetId) {
  const py = join(dirname(fileURLToPath(import.meta.url)), 'fetch-sheet-cells.py')
  const result = spawnSync('python3', [py, '--sheet-id', sheetId], {
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(result.stdout || result.stderr || 'fetch-sheet-cells.py failed')
  }
  const payload = JSON.parse(result.stdout)
  if (payload.error) throw new Error(payload.error)
  return payload
}

const MIXED_COLOR = '#6AA84F'
const NEAREST_COLOR_MAX = 4800

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '')
  if (h.length !== 6) return null
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function colorDistance(a, b) {
  const left = hexToRgb(a)
  const right = hexToRgb(b)
  if (!left || !right) return Infinity
  return (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2
}

function invertColorMap(colorToDivision) {
  const out = {}
  for (const [hex, division] of Object.entries(colorToDivision || {})) {
    if (division === 'Mixed Division' && hex !== MIXED_COLOR) continue
    if (!out[division]) out[division] = hex
  }
  if (!out['Mixed Division']) out['Mixed Division'] = MIXED_COLOR
  return out
}

function nearestLegendHex(color, colorToDivision) {
  if (!color) return null
  if (colorToDivision[color]) return color
  let best = null
  let bestDist = Infinity
  for (const hex of Object.keys(colorToDivision)) {
    const dist = colorDistance(color, hex)
    if (dist < bestDist) {
      bestDist = dist
      best = hex
    }
  }
  return bestDist <= NEAREST_COLOR_MAX ? best : null
}

function loadTeamLookup() {
  try {
    return JSON.parse(readFileSync(join(root, 'src/data/team-divisions.json'), 'utf8'))
  } catch {
    return {}
  }
}

function lookupTeam(lookup, name) {
  if (!name) return null
  if (lookup[name]) return lookup[name]
  const needle = normalizeCell(name).toLowerCase()
  for (const [team, info] of Object.entries(lookup)) {
    if (normalizeCell(team).toLowerCase() === needle) return info
  }
  return null
}

function divisionFromTeams(lookup, home, away) {
  const homeInfo = lookupTeam(lookup, home)
  const awayInfo = lookupTeam(lookup, away)
  if (homeInfo && awayInfo && homeInfo.division === awayInfo.division) return homeInfo
  if (homeInfo && awayInfo) return null
  return homeInfo || awayInfo || null
}

function resolveMatchStyle(color, home, away, colorToDivision, divisionColors, teamLookup, warnings) {
  const matchedHex = nearestLegendHex(color, colorToDivision)
  if (matchedHex) {
    const division = colorToDivision[matchedHex]
    return { division, color: divisionColors[division] || matchedHex }
  }

  const fromTeams = divisionFromTeams(teamLookup, home, away)
  if (fromTeams?.division) {
    warnings.push(
      `Used team list for ${home} vs ${away} (${fromTeams.division}${color ? `; cell ${color}` : ''})`,
    )
    return {
      division: fromTeams.division,
      color: divisionColors[fromTeams.division] || fromTeams.color || MIXED_COLOR,
    }
  }

  warnings.push(`No colour/team match (${home} vs ${away}${color ? `; cell ${color}` : ''}); Mixed Division`)
  return { division: 'Mixed Division', color: divisionColors['Mixed Division'] || MIXED_COLOR }
}

function isHallNoise(text) {
  const value = normalizeCell(text)
  if (!value) return true
  return /^(division \d+|mixed|mixed division|games to be played\.?|\.)$/i.test(value)
}

function mergeColorMap(sheetMap) {
  return { ...DEFAULT_COLOR_TO_DIVISION, ...(sheetMap || {}) }
}

function cellText(cell) {
  if (cell == null) return ''
  if (typeof cell === 'string') return cell
  return cell.text ?? ''
}

function cellColor(cell) {
  if (cell == null || typeof cell === 'string') return null
  const c = cell.color
  return c ? c.toUpperCase() : null
}

function parseTimeLabel(label) {
  const m = normalizeCell(label).match(/^(\d{1,2}-\d{1,2}(?:am|pm))/)
  return m ? m[1] : null
}

function pushSlotOverride(slotOverrides, entry) {
  const key = `${entry.day}|${entry.time}|${entry.venue}`
  slotOverrides.set(key, entry.status)
}

function parseSheetRows(rows, colorToDivision, teamLookup = {}) {
  const matches = []
  const slotOverrides = new Map()
  const warnings = []
  const layout = detectGridLayout(rows)
  const divisionColors = invertColorMap(colorToDivision)
  const hallState = new Map()
  const overflowByDay = new Map()

  const rememberHall = (day, venue, entry) => {
    hallState.set(`${day}|${venue}`, entry)
  }

  const styleFor = (cell, home, away) =>
    resolveMatchStyle(
      cellColor(cell),
      home,
      away,
      colorToDivision,
      divisionColors,
      teamLookup,
      warnings,
    )

  for (const row of rows) {
    const time = parseTimeLabel(cellText(row[layout.timeCol]))
    const hallLabel = normalizeCell(cellText(row[layout.hallLabelCol]))
    let hallVenue = null
    if (/\bhall\s*a\b/i.test(hallLabel)) hallVenue = 'hall_a'
    else if (/\bhall\s*b\b/i.test(hallLabel)) hallVenue = 'hall_b'
    else {
      for (const cell of row) {
        const label = normalizeCell(cellText(cell))
        if (/\bhall\s*a\b/i.test(label)) {
          hallVenue = 'hall_a'
          break
        }
        if (/\bhall\s*b\b/i.test(label)) {
          hallVenue = 'hall_b'
          break
        }
      }
    }

    if (time) {
      const importBayMatches = time !== '1-2pm'
      for (let i = 0; i < DAYS.length; i++) {
        if (!importBayMatches) continue
        const idx = layout.bayStart + i
        const day = DAYS[i]
        const parsed = parseVsCell(cellText(row[idx]))
        if (parsed?.kind === 'match') {
          const { division, color } = styleFor(row[idx], parsed.home, parsed.away)
          matches.push({
            day,
            time,
            venue: 'botany_bay',
            home: parsed.home,
            away: parsed.away,
            color,
            division,
          })
        } else if (parsed?.kind === 'free' || parsed?.kind === 'unavailable') {
          pushSlotOverride(slotOverrides, {
            day,
            time,
            venue: 'botany_bay',
            status: parsed.kind,
          })
        }
      }
    }

    if (layout.hallStart == null) continue

    if (hallVenue) {
      for (let i = 0; i < DAYS.length; i++) {
        const idx = layout.hallStart + i
        const day = DAYS[i]
        const parsed = parseVsCell(cellText(row[idx]))
        if (parsed?.kind === 'match') {
          const { division, color } = styleFor(row[idx], parsed.home, parsed.away)
          rememberHall(day, hallVenue, {
            kind: 'match',
            day,
            time: '12-1pm',
            venue: hallVenue,
            home: parsed.home,
            away: parsed.away,
            color,
            division,
          })
        } else if (parsed?.kind === 'free' || parsed?.kind === 'unavailable') {
          rememberHall(day, hallVenue, { kind: parsed.kind, day, venue: hallVenue })
        }
      }
    } else if (time) {
      for (let i = 0; i < DAYS.length; i++) {
        const idx = layout.hallStart + i
        const text = cellText(row[idx])
        if (isHallNoise(text)) continue
        const parsed = parseVsCell(text)
        if (parsed?.kind !== 'match') continue
        const day = DAYS[i]
        const { division, color } = styleFor(row[idx], parsed.home, parsed.away)
        if (!overflowByDay.has(day)) overflowByDay.set(day, [])
        overflowByDay.get(day).push({
          kind: 'match',
          day,
          time: '12-1pm',
          home: parsed.home,
          away: parsed.away,
          color,
          division,
        })
      }
    }
  }

  for (const day of DAYS) {
    for (const venue of ['hall_a', 'hall_b']) {
      if (hallState.has(`${day}|${venue}`)) continue
      const kind = day === 'wednesday' || day === 'friday' ? 'unavailable' : 'free'
      rememberHall(day, venue, { kind, day, venue })
    }
  }

  for (const day of DAYS) {
    for (const extra of overflowByDay.get(day) || []) {
      const venue = ['hall_a', 'hall_b'].find((name) => {
        const current = hallState.get(`${day}|${name}`)
        return !current || current.kind === 'free'
      })
      if (!venue) {
        warnings.push(
          `No free hall slot on ${day} for ${extra.home} vs ${extra.away}`,
        )
        continue
      }
      rememberHall(day, venue, { ...extra, venue })
    }
  }

  for (const entry of hallState.values()) {
    if (entry.kind === 'match') {
      matches.push({
        day: entry.day,
        time: '12-1pm',
        venue: entry.venue,
        home: entry.home,
        away: entry.away,
        color: entry.color,
        division: entry.division,
      })
    } else {
      pushSlotOverride(slotOverrides, {
        day: entry.day,
        time: '12-1pm',
        venue: entry.venue,
        status: entry.kind,
      })
    }
  }

  const key = (m) => `${m.day}|${m.time}|${m.venue}|${m.home}|${m.away}`
  const deduped = [...new Map(matches.map((m) => [key(m), m])).values()]
  const taken = new Set(deduped.map((m) => `${m.day}|${m.time}|${m.venue}`))
  const overrides = [...slotOverrides.entries()]
    .map(([k, status]) => {
      const [day, time, venue] = k.split('|')
      return { day, time, venue, status }
    })
    .filter((slot) => !taken.has(`${slot.day}|${slot.time}|${slot.venue}`))
  overrides.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      a.time.localeCompare(b.time) ||
      a.venue.localeCompare(b.venue),
  )
  return { matches: deduped, slotOverrides: overrides, warnings }
}

function jsString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function formatMatchesJs(matches, indent = 2) {
  const pad = ' '.repeat(indent)
  const lines = matches.map((m) => {
    const home = jsString(m.home)
    const away = jsString(m.away)
    return `${pad}{ day: '${m.day}', time: '${m.time}', venue: '${m.venue}', home: '${home}', away: '${away}', color: '${m.color}', division: '${jsString(m.division)}' },`
  })
  return lines.join('\n')
}

function formatSlotOverridesJs(overrides, indent = 2) {
  const pad = ' '.repeat(indent)
  return overrides
    .map(
      (s) =>
        `${pad}{ day: '${s.day}', time: '${s.time}', venue: '${s.venue}', status: '${s.status}' },`,
    )
    .join('\n')
}

function formatWeeksJs(weeks) {
  const chunks = weeks.map((week) => {
    const matches = formatMatchesJs(week.matches, 6)
    const overrides = formatSlotOverridesJs(week.slotOverrides, 6)
    return `  {
    startsOn: '${week.startsOn}',
    tab: '${jsString(week.tab)}',
    matches: [
${matches}
    ],
    slotOverrides: [
${overrides}
    ],
  },`
  })
  return `const WEEKS = [\n${chunks.join('\n')}\n]\n`
}

function patchSeedJs(seedText, weeksBlock) {
  const start = '/* SHEET-WEEKS:START */'
  const end = '/* SHEET-WEEKS:END */'
  const a = seedText.indexOf(start)
  const b = seedText.indexOf(end)
  if (a < 0 || b < 0) {
    throw new Error('seed.js missing SHEET-WEEKS markers')
  }
  return `${seedText.slice(0, a)}${start}\n${weeksBlock}${end}${seedText.slice(b + end.length)}`
}

function refreshTeamDivisionsFromSheet(sheetId) {
  const script = join(dirname(fileURLToPath(import.meta.url)), 'sync-team-divisions-from-sheet.mjs')
  const result = spawnSync('node', [script, '--sheet-id', sheetId], { encoding: 'utf8', cwd: root })
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'sync-team-divisions-from-sheet.mjs failed')
  }
  console.log(result.stdout.trim())
}

async function main() {
  const opts = parseArgs(process.argv)

  const sheet = fetchSheetCells(opts.sheetId)
  const tabs = sheet.tabs || (sheet.rows ? [{ name: 'Fixtures', rows: sheet.rows }] : [])
  if (!tabs.length || tabs.every((tab) => !tab.rows || tab.rows.length < 5)) {
    throw new Error('Sheet export looked empty; refusing to overwrite seed.js')
  }
  if (sheet.legend && Object.keys(sheet.legend).length) {
    writeDivisionColors(sheet.legend)
    console.log('Updated src/data/division-colors.json from sheet legend')
  }

  refreshTeamDivisionsFromSheet(opts.sheetId)
  const teamLookup = loadTeamLookup()

  const colorToDivision = mergeColorMap(sheet.colorToDivision)
  const weeks = []
  const allWarnings = []

  for (const [index, tab] of tabs.entries()) {
    if (!tab.rows || tab.rows.length < 5) continue
    const startsOn = startsOnForTab(tab.name, index)
    const { matches, slotOverrides, warnings } = parseSheetRows(
      tab.rows,
      colorToDivision,
      teamLookup,
    )
    weeks.push({ startsOn, tab: tab.name, matches, slotOverrides })
    allWarnings.push(...warnings.map((w) => `${tab.name}: ${w}`))
    console.log(
      `Tab "${tab.name}" → ${startsOn}: ${matches.length} fixtures, ${slotOverrides.length} slot overrides`,
    )
  }

  if (!weeks.length) {
    throw new Error('No fixture tabs parsed; refusing to overwrite seed.js')
  }

  weeks.sort((a, b) => a.startsOn.localeCompare(b.startsOn))

  if (sheet.legend && Object.keys(sheet.legend).length) {
    console.log('Division colours from sheet legend:', sheet.legend)
  }
  if (allWarnings.length) {
    console.log('\nWarnings:')
    for (const w of allWarnings) console.log(`  - ${w}`)
  }

  const weeksBlock = formatWeeksJs(weeks)
  const seedPath = join(root, 'src/data/seed.js')
  const seedText = readFileSync(seedPath, 'utf8')

  if (opts.dryRun) {
    console.log('\n--- WEEKS preview ---')
    for (const week of weeks) {
      console.log(week.tab, week.startsOn, 'matches', week.matches.length)
      console.log(week.matches.slice(0, 3))
    }
    return
  }

  const next = patchSeedJs(seedText, weeksBlock)
  writeFileSync(seedPath, next)
  console.log(`Updated ${seedPath}`)

  const shareMeta = join(dirname(fileURLToPath(import.meta.url)), 'share-metadata.mjs')
  const metaResult = spawnSync('node', [shareMeta], { encoding: 'utf8', cwd: root })
  if (metaResult.status !== 0) {
    throw new Error(metaResult.stderr || metaResult.stdout || 'share-metadata.mjs failed')
  }
  console.log(metaResult.stdout.trim())
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
