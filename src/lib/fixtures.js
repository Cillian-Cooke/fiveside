import { BAY_TIMES } from '../constants.js'

const VENUE_ORDER = { botany_bay: 0, hall_a: 1, hall_b: 2 }

export function contrastText(hex) {
  if (!hex) return '#14211c'
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  const luminance = (r * 299 + g * 587 + b * 114) / 1000
  return luminance < 165 ? '#ffffff' : '#14211c'
}

export function fixturesForDay(fixtures, day) {
  return fixtures
    .filter((fixture) => fixture.day === day)
    .sort((a, b) => {
      const time = BAY_TIMES.indexOf(a.time) - BAY_TIMES.indexOf(b.time)
      if (time !== 0) return time
      return (VENUE_ORDER[a.venue] ?? 9) - (VENUE_ORDER[b.venue] ?? 9)
    })
}

export function baySlot(fixtures, day, time) {
  return fixtures.find(
    (fixture) =>
      fixture.day === day && fixture.time === time && fixture.venue === 'botany_bay',
  )
}

export function hallSlots(fixtures, day) {
  return fixtures.filter(
    (fixture) =>
      fixture.day === day &&
      fixture.time === '12-1pm' &&
      (fixture.venue === 'hall_a' || fixture.venue === 'hall_b'),
  )
}

export function hallSlot(fixtures, day, venue) {
  return (
    fixtures.find(
      (fixture) =>
        fixture.day === day &&
        fixture.time === '12-1pm' &&
        fixture.venue === venue,
    ) || {
      id: `closed-${day}-${venue}`,
      day,
      time: '12-1pm',
      venue,
      status: 'unavailable',
    }
  )
}

export function uniqueTeams(fixtures) {
  const teams = new Map()
  for (const fixture of fixtures) {
    if (fixture.status !== 'match') continue
    for (const name of [fixture.home, fixture.away]) {
      if (!teams.has(name)) {
        teams.set(name, {
          name,
          division: fixture.division,
          color: fixture.color,
        })
      }
    }
  }
  return [...teams.values()].sort((a, b) => a.name.localeCompare(b.name))
}

const NUMBER_WORDS = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
}

export function divisionFromQuery(query) {
  let needle = query.trim().toLowerCase()
  if (!needle) return null
  needle = needle.replaceAll('devision', 'division')

  if (needle === 'mixed' || needle === 'mix' || needle === 'mixed division') {
    return 'Mixed Division'
  }

  const stripped = needle
    .replace(/^(the\s+)?/, '')
    .replace(/^(div(?:ision)?s?|league)\s*/, '')
    .replace(/^(div(?:ision)?s?)/, '')
    .trim()

  if (NUMBER_WORDS[stripped]) return `Division ${NUMBER_WORDS[stripped]}`
  if (/^[1-7]$/.test(stripped)) return `Division ${stripped}`
  return null
}

export function isMatchVisible(fixture, query = '', league = 'all') {
  if (!fixture || fixture.status !== 'match') return false
  if (league && league !== 'all' && fixture.division !== league) return false

  const needle = query.trim().toLowerCase()
  if (!needle) return true

  const wanted = divisionFromQuery(query)
  if (wanted) return fixture.division === wanted

  const division = (fixture.division || '').toLowerCase()
  return (
    (fixture.home || '').toLowerCase().includes(needle) ||
    (fixture.away || '').toLowerCase().includes(needle) ||
    division.includes(needle)
  )
}

export function teamMatchesQuery(row, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const wanted = divisionFromQuery(query)
  if (wanted) return row.division === wanted
  return row.name.toLowerCase().includes(needle)
}

export function slotFill(fixture, query = '', league = 'all') {
  if (!fixture || fixture.status === 'unavailable') return '#3d3d3d'
  if (fixture.status === 'free') return '#ffffff'
  if (fixture.status === 'match' && !isMatchVisible(fixture, query, league)) {
    return '#ffffff'
  }
  return fixture.color || '#ffffff'
}

function emptyRow(name, division, color) {
  return {
    name,
    division,
    color,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    points: 0,
  }
}

export function buildLeagueTables(fixtures) {
  const rows = new Map()

  const rowFor = (name, division, color) => {
    if (!rows.has(name)) rows.set(name, emptyRow(name, division, color))
    return rows.get(name)
  }

  for (const fixture of fixtures) {
    if (fixture.status !== 'match') continue
    if (typeof fixture.homeScore !== 'number' || typeof fixture.awayScore !== 'number') continue

    const home = rowFor(fixture.home, fixture.division, fixture.color)
    const away = rowFor(fixture.away, fixture.division, fixture.color)
    home.played += 1
    away.played += 1
    home.gf += fixture.homeScore
    home.ga += fixture.awayScore
    away.gf += fixture.awayScore
    away.ga += fixture.homeScore

    if (fixture.homeScore > fixture.awayScore) {
      home.won += 1
      home.points += 3
      away.lost += 1
    } else if (fixture.homeScore < fixture.awayScore) {
      away.won += 1
      away.points += 3
      home.lost += 1
    } else {
      home.drawn += 1
      away.drawn += 1
      home.points += 1
      away.points += 1
    }
  }

  const grouped = new Map()
  for (const row of rows.values()) {
    row.gd = row.gf - row.ga
    if (!grouped.has(row.division)) grouped.set(row.division, [])
    grouped.get(row.division).push(row)
  }

  for (const table of grouped.values()) {
    table.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name))
  }

  return grouped
}
