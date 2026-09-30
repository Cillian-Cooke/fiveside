export function teamSlug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function findTeamBySlug(teams, slug) {
  return teams.find((team) => teamSlug(team.name) === slug)
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

export function teamGames(name, fixtures) {
  return fixtures.filter(
    (fixture) =>
      fixture.status === 'match' && (fixture.home === name || fixture.away === name),
  )
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

export function upcomingGames(name, fixtures) {
  return sortGames(
    teamGames(name, fixtures).filter(
      (fixture) => typeof fixture.homeScore !== 'number',
    ),
  )
}

export function pastGames(name, fixtures) {
  return sortGames(
    teamGames(name, fixtures).filter(
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
