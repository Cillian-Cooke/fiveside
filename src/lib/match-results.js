import matchResults from '../data/match-results.json' with { type: 'json' }
import { canonicalDivision, getTeamDirectory } from './fixtures.js'

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

/** Same fixture regardless of which side is listed as home in WhatsApp vs the sheet. */
function pairKey(weekId, home, away) {
  const a = normalizeTeamKey(home)
  const b = normalizeTeamKey(away)
  const [left, right] = a < b ? [a, b] : [b, a]
  return `${weekId}|${left}|${right}`
}

function indexResults(rows) {
  const byExact = new Map()
  const byPair = new Map()
  for (const row of rows || []) {
    if (typeof row?.homeScore !== 'number' || typeof row?.awayScore !== 'number') continue
    byExact.set(resultKey(row.weekStartsOn, row.home, row.away), row)
    byPair.set(pairKey(row.weekStartsOn, row.home, row.away), row)
  }
  return { byExact, byPair }
}

function lookupResult(index, weekId, fixtureHome, fixtureAway) {
  const direct = index.byExact.get(resultKey(weekId, fixtureHome, fixtureAway))
  if (direct) return { row: direct, swap: false }
  const flipped = index.byPair.get(pairKey(weekId, fixtureHome, fixtureAway))
  if (!flipped) return null
  const swap =
    normalizeTeamKey(flipped.home) !== normalizeTeamKey(fixtureHome) ||
    normalizeTeamKey(flipped.away) !== normalizeTeamKey(fixtureAway)
  return { row: flipped, swap }
}

function scoresForFixture(fixtureHome, fixtureAway, row, swap) {
  if (!swap) {
    return { homeScore: row.homeScore, awayScore: row.awayScore }
  }
  return { homeScore: row.awayScore, awayScore: row.homeScore }
}

function lookupTeamMeta(name, fallbackDivision) {
  const teamDivisions = getTeamDirectory()
  let meta = teamDivisions[name]
  if (!meta) {
    const key = normalizeTeamKey(name)
    for (const [team, entry] of Object.entries(teamDivisions)) {
      if (normalizeTeamKey(team) === key) {
        meta = entry
        break
      }
    }
  }
  if (meta?.byDivision && fallbackDivision) {
    const wanted = canonicalDivision(fallbackDivision)
    const variant = meta.byDivision[wanted]
    if (variant) return variant
  }
  if (meta) return meta
  return { division: fallbackDivision || 'Unassigned', color: '#93C47D' }
}

function inferResultDivision(home, away, homeMeta, awayMeta) {
  const homeDiv = canonicalDivision(homeMeta.division)
  const awayDiv = canonicalDivision(awayMeta.division)
  if (homeMeta.byDivision && !awayMeta.byDivision) {
    const pick = metaDivisionForOpponent(homeMeta, awayDiv)
    if (pick) return pick
  }
  if (awayMeta.byDivision && !homeMeta.byDivision) {
    const pick = metaDivisionForOpponent(awayMeta, homeDiv)
    if (pick) return pick
  }
  if (homeMeta.byDivision && awayMeta.byDivision) {
    const fromHome = metaDivisionForOpponent(homeMeta, awayDiv)
    const fromAway = metaDivisionForOpponent(awayMeta, homeDiv)
    if (fromHome && fromAway && fromHome === fromAway) return fromHome
    if (fromHome) return fromHome
    if (fromAway) return fromAway
  }
  if (homeDiv === 'Mixed Division' || awayDiv === 'Mixed Division') {
    return 'Mixed Division'
  }
  if (homeDiv === awayDiv) return homeDiv
  if (homeDiv !== 'Unassigned') return homeDiv
  return awayDiv
}

function metaDivisionForOpponent(meta, opponentDivision) {
  if (!meta?.byDivision || !opponentDivision) return null
  const wanted = canonicalDivision(opponentDivision)
  if (meta.byDivision[wanted]) return wanted
  return null
}

function resultAppliedToFixtures(row, fixtures) {
  const want = pairKey(row.weekStartsOn, row.home, row.away)
  return fixtures.some(
    (fixture) =>
      fixture.status === 'match' &&
      typeof fixture.homeScore === 'number' &&
      typeof fixture.awayScore === 'number' &&
      fixture.weekId === row.weekStartsOn &&
      pairKey(fixture.weekId, fixture.home, fixture.away) === want,
  )
}

function weekIdFromFixtures(fixtures) {
  for (const fixture of fixtures) {
    if (fixture?.weekId) return fixture.weekId
  }
  return null
}

function syntheticFixturesFromResults(fixtures, rows) {
  const weekId = weekIdFromFixtures(fixtures)
  if (!weekId) return []

  const extras = []
  for (const row of rows || []) {
    if (typeof row?.homeScore !== 'number' || typeof row?.awayScore !== 'number') continue
    if (row.weekStartsOn !== weekId) continue
    if (resultAppliedToFixtures(row, fixtures)) continue
    const homeMeta = lookupTeamMeta(row.home)
    const awayMeta = lookupTeamMeta(row.away)
    const division = inferResultDivision(row.home, row.away, homeMeta, awayMeta)
    const color =
      lookupTeamMeta(row.home, division).color ||
      lookupTeamMeta(row.away, division).color ||
      '#93C47D'
    extras.push({
      id: `result-${pairKey(row.weekStartsOn, row.home, row.away)}`,
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

/** `results` defaults to the baked JSON. Pass an array to use those rows instead. */
export function overlayMatchScores(fixtures, results) {
  const rows = results === undefined ? matchResults.results || [] : results || []
  const index = indexResults(rows)
  if (!index.byExact.size && !index.byPair.size) return fixtures
  const overlaid = fixtures.map((fixture) => {
    if (fixture.status !== 'match') return fixture
    const hit = lookupResult(index, fixture.weekId, fixture.home, fixture.away)
    if (!hit) return fixture
    const scores = scoresForFixture(fixture.home, fixture.away, hit.row, hit.swap)
    return {
      ...fixture,
      ...scores,
    }
  })
  const extras = syntheticFixturesFromResults(overlaid, rows)
  if (!extras.length) return overlaid
  return [...overlaid, ...extras]
}
