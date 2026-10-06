import matchResults from '../data/match-results.json'

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

export function overlayMatchScores(fixtures) {
  if (!scoreIndex.size) return fixtures
  return fixtures.map((fixture) => {
    if (fixture.status !== 'match') return fixture
    const hit = scoreIndex.get(resultKey(fixture.weekId, fixture.home, fixture.away))
    if (!hit) return fixture
    return {
      ...fixture,
      homeScore: hit.homeScore,
      awayScore: hit.awayScore,
    }
  })
}
