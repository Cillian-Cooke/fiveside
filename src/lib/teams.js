import { canonicalDivision } from './fixtures.js'
import teamDivisions from '../data/team-divisions.json'

function teamMeta(name) {
  let meta = teamDivisions[name]
  if (meta) return meta
  const key = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  for (const [team, entry] of Object.entries(teamDivisions)) {
    if (
      String(team)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim() === key
    ) {
      return entry
    }
  }
  return null
}

/** Short label when the same name is registered in more than one sheet section (colour/league). */
export function teamDisplayName(name, division) {
  const meta = teamMeta(name)
  if (!meta?.byDivision || !division) return name
  const canon = canonicalDivision(division)
  if (canon === 'Mixed Division') return `${name} (Mixed)`
  const match = String(canon).match(/Division\s+(\d+)/i)
  if (match) return `${name} (Div ${match[1]})`
  return name
}

function divisionSlugPart(division) {
  const canon = canonicalDivision(division)
  if (canon === 'Mixed Division') return 'mixed'
  const match = String(canon).match(/Division\s+(\d+)/i)
  if (match) return `div-${match[1]}`
  return String(canon)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function teamSlug(name, division) {
  const base = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!division) return base
  return `${base}-${divisionSlugPart(division)}`
}

export function findTeamBySlug(teams, slug) {
  const withDivision = teams.find(
    (team) => teamSlug(team.name, team.division) === slug,
  )
  if (withDivision) return withDivision
  return teams.find((team) => teamSlug(team.name) === slug)
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

function fixtureDivision(fixture) {
  return canonicalDivision(fixture?.division)
}

export function teamGames(name, fixtures, division) {
  const want = division ? canonicalDivision(division) : null
  return fixtures.filter((fixture) => {
    if (fixture.status !== 'match') return false
    if (fixture.home !== name && fixture.away !== name) return false
    if (want && fixtureDivision(fixture) !== want) return false
    return true
  })
}

export function sortGames(fixtures) {
  return [...fixtures].sort((a, b) => {
    const week = String(a.startsOn || a.weekId || '').localeCompare(String(b.startsOn || b.weekId || ''))
    if (week !== 0) return week
    const day = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    if (day !== 0) return day
    return String(a.time).localeCompare(String(b.time))
  })
}

export function upcomingGames(name, fixtures, division) {
  return sortGames(
    teamGames(name, fixtures, division).filter(
      (fixture) => typeof fixture.homeScore !== 'number',
    ),
  )
}

export function pastGames(name, fixtures, division) {
  return sortGames(
    teamGames(name, fixtures, division).filter(
      (fixture) => typeof fixture.homeScore === 'number',
    ),
  ).reverse()
}

export function resultFor(name, fixture) {
  if (typeof fixture.homeScore !== 'number') return null
  const scored = fixture.home === name ? fixture.homeScore : fixture.awayScore
  const conceded = fixture.home === name ? fixture.awayScore : fixture.homeScore
  if (scored > conceded) return 'W'
  if (scored < conceded) return 'L'
  return 'D'
}
