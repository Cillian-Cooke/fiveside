import matchResults from '../data/match-results.json'
import teamDivisions from '../data/team-divisions.json'
import { canonicalDivision } from './fixtures.js'

function normalizeTeamKey(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function resultKey(weekId, home, away) {
  return `${weekId}|${normalizeTeamKey(home)}|${normalizeTeamKey(away)}`
}

function buildScoreIndex() {
  const index = new Map()
  for (const row of matchResults.results || []) {
    index.set(resultKey(row.weekStartsOn, row.home, row.away), row)
  }
  return index
}

const scoreIndex = buildScoreIndex()

function lookupTeamMeta(name) {
  if (teamDivisions[name]) return teamDivisions[name]
  const key = normalizeTeamKey(name)
  for (const [team, meta] of Object.entries(teamDivisions)) {
    if (normalizeTeamKey(team) === key) return meta
  }
  return { division: 'Unassigned', color: '#93C47D' }
}

function inferResultDivision(homeMeta, awayMeta) {
  const homeDiv = canonicalDivision(homeMeta.division)
  const awayDiv = canonicalDivision(awayMeta.division)
  if (homeDiv === 'Mixed Division' || awayDiv === 'Mixed Division') {
    return 'Mixed Division'
  }
  if (homeDiv === awayDiv) return homeDiv
  if (homeDiv !== 'Unassigned') return homeDiv
  return awayDiv
}

function resultAppliedToFixtures(row, fixtures) {
  return fixtures.some(
    (fixture) =>
      fixture.status === 'match' &&
      typeof fixture.homeScore === 'number' &&
      typeof fixture.awayScore === 'number' &&
      fixture.weekId === row.weekStartsOn &&
      normalizeTeamKey(fixture.home) === normalizeTeamKey(row.home) &&
      normalizeTeamKey(fixture.away) === normalizeTeamKey(row.away),
  )
}

function syntheticFixturesFromResults(fixtures) {
  const extras = []
  for (const row of matchResults.results || []) {
    if (resultAppliedToFixtures(row, fixtures)) continue
    const homeMeta = lookupTeamMeta(row.home)
    const awayMeta = lookupTeamMeta(row.away)
    const division = inferResultDivision(
      { division: canonicalDivision(homeMeta.division) },
      { division: canonicalDivision(awayMeta.division) },
    )
    const color =
      homeMeta.division === division ? homeMeta.color : awayMeta.color || homeMeta.color
    extras.push({
      id: `result-${resultKey(row.weekStartsOn, row.home, row.away)}`,
      weekId: row.weekStartsOn,
      status: 'match',
      home: row.home,
      away: row.away,
      homeScore: row.homeScore,
      awayScore: row.awayScore,
      division,
      color,
      resultOnly: true,
    })
  }
  return extras
}

export function overlayMatchScores(fixtures) {
  if (!scoreIndex.size) return fixtures
  const overlaid = fixtures.map((fixture) => {
    if (fixture.status !== 'match') return fixture
    const hit = scoreIndex.get(resultKey(fixture.weekId, fixture.home, fixture.away))
    if (!hit) return fixture
    return {
      ...fixture,
      homeScore: hit.homeScore,
      awayScore: hit.awayScore,
    }
  })
  const extras = syntheticFixturesFromResults(overlaid)
  if (!extras.length) return overlaid
  return [...overlaid, ...extras]
}
