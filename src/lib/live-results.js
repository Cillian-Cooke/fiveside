import { normalizeTeamKey, pairKey } from './match-results.js'
import { readWorkbook } from './xlsx.js'

export const RESULTS_SHEET_ID = '1FP8_MLzGjGBecs3EUyjHZT_rASMqTODmItUFqzstqcA'
/** Workbook sheetId of the Results tab (`export?format=csv&gid=1`). */
export const RESULTS_GID = '1'

const XLSX_URL = `https://docs.google.com/spreadsheets/d/${RESULTS_SHEET_ID}/export?format=xlsx`
const MEMORY_TTL_MS = 60_000
const SHEET_TIMEOUT_MS = 8_000

const REQUIRED_HEADERS = ['weekstartson', 'home', 'away', 'homescore', 'awayscore']

let cached = null
let cachedAt = 0

function clean(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function textOf(cell) {
  if (cell && typeof cell === 'object') return cell.text ?? ''
  return cell ?? ''
}

function headerKey(value) {
  return clean(value).toLowerCase().replace(/[^a-z]/g, '')
}

/** Excel serial 46293 is 2026-09-28. Dates before that range are left alone. */
function parseDate(value) {
  const text = clean(value)
  if (!text) return null
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const serial = Number(text)
    if (serial < 20000 || serial > 80000) return null
    const utc = Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000
    return new Date(utc).toISOString().slice(0, 10)
  }
  return null
}

/** Sheet numbers often arrive as "4.0". Scores are non-negative integers. */
function parseScore(value) {
  const text = clean(value)
  if (!/^\d+(?:\.0+)?$/.test(text)) return null
  return Number(text)
}

function headerIndex(cells) {
  const map = new Map()
  ;(cells || []).forEach((cell, index) => {
    const key = headerKey(textOf(cell))
    if (key && !map.has(key)) map.set(key, index)
  })
  return map
}

function valueAt(row, headers, key) {
  const index = headers.get(key)
  if (index == null) return ''
  return textOf(row[index])
}

/**
 * Rows shaped like match-results.json: weekStartsOn, home, away, homeScore, awayScore.
 * Incomplete rows are dropped. `rows` may be xlsx cells (`{ text }`) or plain strings.
 */
export function parseResultsRows(rows) {
  const list = rows || []
  let headerRow = -1
  let headers = null
  const scan = Math.min(list.length, 8)
  for (let i = 0; i < scan; i += 1) {
    const map = headerIndex(list[i] || [])
    if (REQUIRED_HEADERS.every((key) => map.has(key))) {
      headerRow = i
      headers = map
      break
    }
  }
  if (!headers) throw new Error('Results sheet is missing a header row')

  const results = []
  for (let i = headerRow + 1; i < list.length; i += 1) {
    const row = list[i] || []
    const home = clean(valueAt(row, headers, 'home'))
    const away = clean(valueAt(row, headers, 'away'))
    const homeScore = parseScore(valueAt(row, headers, 'homescore'))
    const awayScore = parseScore(valueAt(row, headers, 'awayscore'))
    const weekStartsOn = parseDate(valueAt(row, headers, 'weekstartson'))
    if (!home || !away || homeScore == null || awayScore == null || !weekStartsOn) continue

    const parsed = { weekStartsOn, home, away, homeScore, awayScore }
    const playedOn = parseDate(valueAt(row, headers, 'playedon'))
    const division = clean(valueAt(row, headers, 'division'))
    const fixtureMatched = clean(valueAt(row, headers, 'fixturematched'))
    const sourceNote = clean(valueAt(row, headers, 'sourcenote'))
    if (playedOn) parsed.playedOn = playedOn
    if (division) parsed.division = division
    if (fixtureMatched) parsed.fixtureMatched = fixtureMatched
    if (sourceNote) parsed.sourceNote = sourceNote
    results.push(parsed)
  }
  return dedupeResultRows(results)
}

/** Same week and the same two sides, even if the captains swapped home and away. */
function samePostedScore(kept, row) {
  const sameEnds = normalizeTeamKey(kept.home) === normalizeTeamKey(row.home)
  if (sameEnds) return kept.homeScore === row.homeScore && kept.awayScore === row.awayScore
  return kept.homeScore === row.awayScore && kept.awayScore === row.homeScore
}

function dedupeResultRows(rows) {
  const keptByPair = new Map()
  const unique = []
  for (const row of rows) {
    const key = pairKey(row.weekStartsOn, row.home, row.away)
    const kept = keptByPair.get(key)
    if (!kept) {
      keptByPair.set(key, row)
      unique.push(row)
      continue
    }
    if (!samePostedScore(kept, row)) {
      console.warn(
        `[results] Duplicate match ${row.weekStartsOn} ${kept.home} vs ${kept.away}: keeping ${kept.homeScore}-${kept.awayScore}, ignoring ${row.home} ${row.homeScore}-${row.awayScore} ${row.away}`,
      )
    }
  }
  return unique
}

/** Results tab only. Unresolved and Instructions are not score rows. */
export function parseResultsWorkbook(sheets) {
  const sheet = (sheets || []).find((item) => clean(item?.name).toLowerCase() === 'results')
  if (!sheet) throw new Error('Results sheet export had no Results tab')
  return parseResultsRows(sheet.rows)
}

/** Only http(s) links count; anything else (blank, "n/a") means no link. */
function cleanInstagramUrl(value) {
  let text = clean(value)
  if (!text) return ''
  if (/^@?[A-Za-z0-9._]+$/.test(text) && !/^https?:/i.test(text)) {
    text = `https://www.instagram.com/${text.replace(/^@/, '')}/`
  } else if (/^(www\.)?instagram\.com\//i.test(text)) {
    text = `https://${text}`
  }
  try {
    const url = new URL(text)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''
    return url.toString()
  } catch {
    return ''
  }
}

/**
 * Optional Teams tab: "Team" + "Instagram" columns. Returns
 * { [normalizeTeamKey(team)]: url } for rows with a usable link only.
 */
export function parseTeamLinksWorkbook(sheets) {
  const sheet = (sheets || []).find((item) => clean(item?.name).toLowerCase() === 'teams')
  if (!sheet) return {}
  const rows = sheet.rows || []
  const headers = headerIndex(rows[0] || [])
  const teamCol = headers.has('team') ? 'team' : headers.has('teamname') ? 'teamname' : null
  if (!teamCol || !headers.has('instagram')) return {}
  const links = {}
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] || []
    const name = clean(valueAt(row, headers, teamCol))
    const url = cleanInstagramUrl(valueAt(row, headers, 'instagram'))
    if (name && url) links[normalizeTeamKey(name)] = url
  }
  return links
}

function parseCsv(text) {
  const source = String(text ?? '').replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
      continue
    }
    if (char === ',') {
      row.push(field)
      field = ''
      continue
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }
    field += char
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

export function parseResultsCsv(text) {
  return parseResultsRows(parseCsv(text))
}

function assertXlsx(bytes) {
  if (!bytes || bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error('Results export was not an xlsx file')
  }
}

export async function loadLiveResults({
  now = new Date(),
  fetchImpl = fetch,
  timeoutMs = SHEET_TIMEOUT_MS,
} = {}) {
  if (cached && now.getTime() - cachedAt < MEMORY_TTL_MS) return cached

  const response = await fetchImpl(XLSX_URL, {
    headers: { 'user-agent': 'fiveside/1.0 (results)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`Results export failed (${response.status})`)
  const bytes = Buffer.from(await response.arrayBuffer())
  assertXlsx(bytes)
  const sheets = readWorkbook(bytes)
  const results = parseResultsWorkbook(sheets)
  if (!results.length) throw new Error('Results sheet had no score rows')
  let instagram = {}
  try {
    instagram = parseTeamLinksWorkbook(sheets)
  } catch (error) {
    console.error('[results] Teams tab', error)
  }

  cached = { results, instagram, updatedAt: now.toISOString() }
  cachedAt = now.getTime()
  return cached
}

export function clearResultsCache() {
  cached = null
  cachedAt = 0
}
