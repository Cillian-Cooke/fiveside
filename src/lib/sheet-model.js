import { cleanCellText, normalizeTeamKey } from './names.js'
import { assignTabDates } from './week-dates.js'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const DIVISION_LABEL = /^Division \d+$/i

/** Squared RGB distance. #9FC5E8 vs legend #A4C2F4 is 178; wrong divisions are much further. */
const NEAREST_COLOR_MAX = 4800

function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '')
  if (value.length !== 6) return null
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

export function colorDistance(a, b) {
  const left = hexToRgb(a)
  const right = hexToRgb(b)
  if (!left || !right) return Infinity
  return (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2
}

export function isGrey(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  const max = Math.max(...rgb)
  const min = Math.min(...rgb)
  return max - min <= 12 && max < 230
}

export function canonicalDivision(name) {
  if (name === 'Mixed League' || name === 'Mixed') return 'Mixed Division'
  return name
}

function legendName(text) {
  const label = cleanCellText(text)
  if (DIVISION_LABEL.test(label)) {
    const match = label.match(/(\d+)/)
    return match ? `Division ${match[1]}` : null
  }
  if (/^mixed(?:\s+division)?$/i.test(label)) return 'Mixed Division'
  return null
}

export function legendFromRows(rows) {
  const legend = {}
  for (const row of rows || []) {
    for (const cell of row || []) {
      const name = legendName(cell?.text)
      const color = cell?.color ? String(cell.color).toUpperCase() : null
      if (!name || !color || isGrey(color)) continue
      legend[name] = color
    }
  }
  return legend
}

export function nearestDivision(color, legend) {
  const hex = String(color || '').toUpperCase()
  if (!hex || isGrey(hex) || !legend) return null
  let exact = null
  let best = null
  let bestDist = Infinity
  for (const [division, legendColor] of Object.entries(legend)) {
    const swatch = String(legendColor).toUpperCase()
    if (swatch === hex) exact = { division, color: swatch }
    const dist = colorDistance(hex, swatch)
    if (dist < bestDist) {
      bestDist = dist
      best = { division, color: swatch }
    }
  }
  if (exact) return exact
  if (best && bestDist <= NEAREST_COLOR_MAX) return best
  return null
}

function detectGridLayout(rows) {
  for (const row of rows) {
    const texts = row.map((cell) => cleanCellText(cell?.text).toLowerCase())
    const firstMon = texts.indexOf('monday')
    if (firstMon < 0) continue
    if (!DAYS.every((day, index) => texts[firstMon + index] === day)) continue
    const hallStart = texts.indexOf('monday', firstMon + DAYS.length)
    return {
      timeCol: Math.max(0, firstMon - 1),
      bayStart: firstMon,
      hallLabelCol: hallStart > 0 ? hallStart - 1 : null,
      hallStart: hallStart > 0 ? hallStart : null,
    }
  }
  return null
}

function parseTimeLabel(label) {
  const match = cleanCellText(label).match(/^(\d{1,2}-\d{1,2}(?:am|pm))/)
  return match ? match[1] : null
}

function hallVenueFromLabel(label) {
  const text = cleanCellText(label)
  if (/\bhall\s*a\b/i.test(text)) return 'hall_a'
  if (/\bhall\s*b\b/i.test(text)) return 'hall_b'
  return null
}

function parseVsCell(text) {
  const cell = cleanCellText(text).replace(/^[\s./]+/, '')
  if (!cell) return null
  const lower = cell.toLowerCase()
  if (lower === 'unavailable') return { kind: 'unavailable' }
  if (lower === 'free slot' || lower === 'free' || lower === '.') return { kind: 'free' }
  if (/cancel/i.test(cell)) return { kind: 'cancelled', note: cell }
  const parts = cell.split(/\s+V\s+/i).map((part) => cleanCellText(part))
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return { kind: 'match', home: parts[0], away: parts[1] }
}

function readableNote(text) {
  const clean = cleanCellText(text)
  if (!clean || clean !== clean.toUpperCase()) return clean
  const lower = clean.toLowerCase()
  const sentence = lower.charAt(0).toUpperCase() + lower.slice(1)
  return sentence.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g, (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1)
  })
}

function buildTeamDirectory(rows, legend) {
  const teams = {}
  let division = null
  for (const row of rows || []) {
    const name = cleanCellText(row?.[1]?.text)
    if (!name) continue
    const header = legendName(name)
    if (header) {
      division = header
      continue
    }
    if (/^mixed league$/i.test(name)) {
      division = 'Mixed Division'
      continue
    }
    if (!division) continue
    const color = legend[division] || null
    const entry = { division, color }
    const existing = teams[name]
    if (!existing) {
      teams[name] = entry
      continue
    }
    if (existing.division === division) continue
    const byDivision = { ...(existing.byDivision || {}) }
    if (!Object.keys(byDivision).length) {
      byDivision[canonicalDivision(existing.division)] = {
        division: existing.division,
        color: existing.color,
      }
    }
    byDivision[division] = entry
    teams[name] = { ...existing, byDivision }
  }
  return teams
}

function indexTeams(teams) {
  const byKey = new Map()
  for (const [name, meta] of Object.entries(teams || {})) {
    byKey.set(normalizeTeamKey(name), { name, meta })
  }
  return byKey
}

function styleFor(cell, home, away, tabLegend, mergedLegend, teams, warnings) {
  const matched =
    nearestDivision(cell?.color, tabLegend) || nearestDivision(cell?.color, mergedLegend)
  if (matched) return matched

  const homeInfo = teams.get(normalizeTeamKey(home))
  const awayInfo = teams.get(normalizeTeamKey(away))
  const homeDiv = homeInfo?.meta?.division
  const awayDiv = awayInfo?.meta?.division
  if (homeDiv && awayDiv && canonicalDivision(homeDiv) === canonicalDivision(awayDiv)) {
    const division = canonicalDivision(homeDiv)
    warnings.push(`Used Contact Info for ${home} vs ${away} (${division})`)
    return { division, color: mergedLegend[division] || homeInfo.meta.color }
  }
  if (homeDiv && !awayInfo) {
    const division = canonicalDivision(homeDiv)
    return { division, color: mergedLegend[division] || homeInfo.meta.color }
  }
  warnings.push(
    `No colour match for ${home} vs ${away}${cell?.color ? ` (${cell.color})` : ''}; left as Mixed`,
  )
  return { division: 'Mixed Division', color: mergedLegend['Mixed Division'] || '#6AA84F' }
}

function canonicalTeam(name, teams, unknown) {
  const cleaned = cleanCellText(name)
  const hit = teams.get(normalizeTeamKey(cleaned))
  if (!hit) {
    unknown.add(cleaned)
    return cleaned
  }
  return hit.name
}

function emptyWeek(dated) {
  return {
    tab: dated.tab,
    startsOn: dated.startsOn,
    weekNumber: dated.weekNumber,
    reading: dated.reading,
    matches: [],
    slotOverrides: [],
    rescheduled: [],
    dayNotes: {},
  }
}

export function parseFixtureTab(rows, dated, tabLegend, mergedLegend, teams) {
  const week = emptyWeek(dated)
  const layout = detectGridLayout(rows)
  if (!layout) return { week, warnings: [`${dated.tab}: could not find the Monday–Friday header`] }

  const warnings = []
  const unknown = new Set()
  const matches = []
  const slotOverrides = new Map()
  const cancelledDays = new Set()
  const bayCols = new Set(DAYS.map((_, index) => layout.bayStart + index))
  const hallCols =
    layout.hallStart == null ? new Set() : new Set(DAYS.map((_, index) => layout.hallStart + index))

  const nameOf = (name) => canonicalTeam(name, teams, unknown)
  const paint = (cell, home, away) =>
    styleFor(cell, home, away, tabLegend, mergedLegend, teams, warnings)

  for (const row of rows) {
    const time = parseTimeLabel(row[layout.timeCol]?.text)
    const hallVenue = hallVenueFromLabel(row[layout.hallLabelCol]?.text)

    if (time && time !== '1-2pm') {
      for (let index = 0; index < DAYS.length; index += 1) {
        const day = DAYS[index]
        const cell = row[layout.bayStart + index]
        const parsed = parseVsCell(cell?.text)
        if (parsed?.kind === 'match') {
          if (isGrey(cell?.color)) continue
          const home = nameOf(parsed.home)
          const away = nameOf(parsed.away)
          const { division, color } = paint(cell, home, away)
          matches.push({ day, time, venue: 'botany_bay', home, away, color, division })
        } else if (parsed?.kind === 'cancelled') {
          cancelledDays.add(day)
          week.dayNotes[day] = readableNote(parsed.note)
        } else if (parsed?.kind === 'free' || parsed?.kind === 'unavailable') {
          slotOverrides.set(`${day}|${time}|botany_bay`, parsed.kind)
        } else if (isGrey(cell?.color)) {
          slotOverrides.set(`${day}|${time}|botany_bay`, 'unavailable')
        }
      }
    }

    if (!hallVenue || layout.hallStart == null) continue
    for (let index = 0; index < DAYS.length; index += 1) {
      const day = DAYS[index]
      const cell = row[layout.hallStart + index]
      const parsed = parseVsCell(cell?.text)
      const key = `${day}|12-1pm|${hallVenue}`
      if (parsed?.kind === 'match' && !isGrey(cell?.color)) {
        const home = nameOf(parsed.home)
        const away = nameOf(parsed.away)
        const { division, color } = paint(cell, home, away)
        matches.push({ day, time: '12-1pm', venue: hallVenue, home, away, color, division })
      } else if (parsed?.kind === 'free' || parsed?.kind === 'unavailable') {
        slotOverrides.set(key, parsed.kind)
      } else if (isGrey(cell?.color) || parsed?.kind === 'cancelled') {
        slotOverrides.set(key, 'unavailable')
      }
    }
  }

  for (const day of cancelledDays) {
    for (const row of rows) {
      const time = parseTimeLabel(row[layout.timeCol]?.text)
      if (!time || time === '1-2pm') continue
      const key = `${day}|${time}|botany_bay`
      if (matches.some((match) => `${match.day}|${match.time}|${match.venue}` === key)) continue
      slotOverrides.set(key, 'unavailable')
    }
  }

  const seenPairs = new Set()
  if (layout.hallStart != null) {
    for (const row of rows) {
      const time = parseTimeLabel(row[layout.timeCol]?.text)
      const hallVenue = hallVenueFromLabel(row[layout.hallLabelCol]?.text)
      for (let col = 0; col < row.length; col += 1) {
        if (bayCols.has(col) && time) continue
        if (hallCols.has(col) && hallVenue) continue
        if (col < (layout.hallLabelCol ?? layout.hallStart)) continue
        const cell = row[col]
        if (isGrey(cell?.color)) continue
        const parsed = parseVsCell(cell?.text)
        if (parsed?.kind !== 'match') continue
        const home = nameOf(parsed.home)
        const away = nameOf(parsed.away)
        const pair = [normalizeTeamKey(home), normalizeTeamKey(away)].sort().join('|')
        if (seenPairs.has(pair)) continue
        seenPairs.add(pair)
        const { division, color } = paint(cell, home, away)
        week.rescheduled.push({ home, away, division, color })
      }
    }
  }

  week.rescheduled.sort(
    (a, b) => a.division.localeCompare(b.division) || a.home.localeCompare(b.home),
  )

  const slotKey = (match) => `${match.day}|${match.time}|${match.venue}|${match.home}|${match.away}`
  week.matches = [...new Map(matches.map((match) => [slotKey(match), match])).values()]
  const taken = new Set(week.matches.map((match) => `${match.day}|${match.time}|${match.venue}`))
  week.slotOverrides = [...slotOverrides.entries()]
    .map(([key, status]) => {
      const [day, time, venue] = key.split('|')
      return { day, time, venue, status }
    })
    .filter((slot) => !taken.has(`${slot.day}|${slot.time}|${slot.venue}`))

  if (unknown.size) {
    warnings.push(`${dated.tab}: unknown teams not on Contact Info: ${[...unknown].sort().join(', ')}`)
  }
  return { week, warnings }
}

export function workbookToPayload(sheets, seasonStart) {
  const list = sheets || []
  const contact = list.find((sheet) => /contact/i.test(sheet.name))
  const scheduleSheets = list.filter((sheet) => assignTabDates([sheet.name]).length === 1)
  const dated = assignTabDates(
    scheduleSheets.map((sheet) => sheet.name),
    seasonStart,
  )
  const legends = scheduleSheets.map((sheet) => legendFromRows(sheet.rows))
  const mergedLegend = Object.assign({}, ...legends)
  const teams = buildTeamDirectory(contact?.rows || [], mergedLegend)
  const teamIndex = indexTeams(teams)
  const weeks = []
  const warnings = []

  dated.forEach((entry, index) => {
    const sheet = scheduleSheets[index]
    const parsed = parseFixtureTab(sheet.rows, entry, legends[index], mergedLegend, teamIndex)
    weeks.push(parsed.week)
    warnings.push(...parsed.warnings.map((warning) => warning.startsWith(entry.tab) ? warning : `${entry.tab}: ${warning}`))
  })

  return {
    legend: mergedLegend,
    teams,
    weeks,
    warnings,
  }
}
