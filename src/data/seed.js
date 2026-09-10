const CURRENT_WEEK_ID = '2026-03-23'

const MATCHES = [
  { day: 'monday', time: '9-10am', venue: 'botany_bay', home: 'Himmy Saville', away: 'The Palpators', color: '#B4A7D6', division: 'Division 5' },
  { day: 'monday', time: '10-11am', venue: 'botany_bay', home: 'Takin the PH', away: 'Red Light BESStrict', color: '#EA9999', division: 'Division 4' },
  { day: 'monday', time: '11-12pm', venue: 'botany_bay', home: 'Ctrl Alt Defeat', away: 'CSB FC', color: '#D9EAD3', division: 'Division 6' },
  { day: 'monday', time: '12-1pm', venue: 'botany_bay', home: 'Palantir FC', away: 'Chicken Chasers', color: '#B4A7D6', division: 'Division 5' },
  { day: 'monday', time: '1-2pm', venue: 'botany_bay', home: 'Spartak Zubi Piski', away: 'Team Football', color: '#FF9900', division: 'Division 7' },
  { day: 'monday', time: '2-3pm', venue: 'botany_bay', home: 'Gneiss One FC', away: 'DU Divas', color: '#1155CC', division: 'Mixed Division' },
  { day: 'monday', time: '3-4pm', venue: 'botany_bay', home: 'Gneiss One FC', away: 'H5aSide', color: '#1155CC', division: 'Mixed Division' },
  { day: 'monday', time: '4-5pm', venue: 'botany_bay', home: 'River Dodder Rodents', away: 'SLAYMAR', color: '#1155CC', division: 'Mixed Division' },
  { day: 'monday', time: '12-1pm', venue: 'hall_a', home: 'The Stoppable Force', away: 'Goal Diggers', color: '#FF9900', division: 'Division 7' },
  { day: 'monday', time: '12-1pm', venue: 'hall_b', home: 'Meath4Sam', away: 'The Good Ending', color: '#D9EAD3', division: 'Division 6' },

  { day: 'tuesday', time: '9-10am', venue: 'botany_bay', home: 'FC TwenteBenson', away: 'Elche C.F', color: '#F9CB9C', division: 'Division 1' },
  { day: 'tuesday', time: '10-11am', venue: 'botany_bay', home: 'Hedley Burnley', away: 'Hamilton Hammers', color: '#FFE599', division: 'Division 2' },
  { day: 'tuesday', time: '11-12pm', venue: 'botany_bay', home: 'Integer Milan', away: 'CSBGM', color: '#F9CB9C', division: 'Division 1' },
  { day: 'tuesday', time: '12-1pm', venue: 'botany_bay', home: 'Scutch V', away: 'Sporting Unc', color: '#EA9999', division: 'Division 4' },
  { day: 'tuesday', time: '1-2pm', venue: 'botany_bay', home: 'Pavillionaires', away: 'Real SosoBad', color: '#FFE599', division: 'Division 2' },
  { day: 'tuesday', time: '2-3pm', venue: 'botany_bay', home: 'Ballymun Goats', away: 'Himmy Saville', color: '#D9D2E9', division: 'Division 5' },
  { day: 'tuesday', time: '3-4pm', venue: 'botany_bay', home: 'Ballymun Goats', away: 'The Palpators', color: '#D9D2E9', division: 'Division 5' },
  { day: 'tuesday', time: '4-5pm', venue: 'botany_bay', home: 'Dropouts FC', away: 'Real SosoBad', color: '#FFE599', division: 'Division 2' },
  { day: 'tuesday', time: '12-1pm', venue: 'hall_a', home: 'Spartak Zubi Piski', away: 'Goal Diggers', color: '#FF9900', division: 'Division 7' },
  { day: 'tuesday', time: '12-1pm', venue: 'hall_b', home: 'Dairy B FC', away: 'Madeleine Milan', color: '#A4C2F4', division: 'Mixed Division' },

  { day: 'wednesday', time: '9-10am', venue: 'botany_bay', home: 'Git Gud', away: 'DU Divas', color: '#1155CC', division: 'Mixed Division' },
  { day: 'wednesday', time: '10-11am', venue: 'botany_bay', home: 'Dairy B FC', away: 'Lionel MSISS', color: '#A4C2F4', division: 'Mixed Division' },
  { day: 'wednesday', time: '11-12pm', venue: 'botany_bay', home: 'Ctrl Alt Defeat', away: 'The Good Ending', color: '#D9EAD3', division: 'Division 6' },
  { day: 'wednesday', time: '12-1pm', venue: 'botany_bay', home: 'CSBGM', away: 'Elche C.F', color: '#F9CB9C', division: 'Division 1' },
  { day: 'wednesday', time: '1-2pm', venue: 'botany_bay', home: 'Kiss My Pass', away: 'Goal Diggers', color: '#FF9900', division: 'Division 7' },
  { day: 'wednesday', time: '2-3pm', venue: 'botany_bay', home: 'Real Medrid', away: 'Red Light BESStrict', color: '#EA9999', division: 'Division 4' },
  { day: 'wednesday', time: '3-4pm', venue: 'botany_bay', home: 'Gneiss One FC', away: 'SLAYMAR', color: '#1155CC', division: 'Mixed Division' },
  { day: 'wednesday', time: '4-5pm', venue: 'botany_bay', home: 'Ballymun Goats', away: 'TBXI', color: '#D9D2E9', division: 'Division 5' },
]

function slotId(weekId, day, time, venue) {
  return `${weekId}-${day}-${time}-${venue}`.replaceAll(' ', '')
}

function withScores(matches, offset) {
  return matches.map((match, index) => ({
    ...match,
    homeScore: (index + offset) % 6,
    awayScore: (index * 2 + offset) % 5,
  }))
}

const DIVISION_3 = [
  { day: 'monday', time: '8-9am', venue: 'botany_bay', home: 'Academy Reps FC', away: 'Loch Bess Monster', color: '#CFE2F3', division: 'Division 3' },
  { day: 'tuesday', time: '8-9am', venue: 'botany_bay', home: 'Goldsmith Gooners', away: 'Mount Joy FC', color: '#CFE2F3', division: 'Division 3' },
  { day: 'wednesday', time: '8-9am', venue: 'botany_bay', home: 'The Vincibles FC', away: 'Engibeering', color: '#CFE2F3', division: 'Division 3' },
  { day: 'thursday', time: '12-1pm', venue: 'hall_a', home: 'Loch Bess Monster', away: 'Engibeering', color: '#CFE2F3', division: 'Division 3' },
]

export function buildFixtures(weekId, matches) {
  const fixtures = []
  const matchKey = (day, time, venue) => `${day}|${time}|${venue}`
  const matchMap = new Map(
    matches.map((match) => [matchKey(match.day, match.time, match.venue), match]),
  )

  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) {
    for (const time of [
      '8-9am',
      '9-10am',
      '10-11am',
      '11-12pm',
      '12-1pm',
      '1-2pm',
      '2-3pm',
      '3-4pm',
      '4-5pm',
    ]) {
      const match = matchMap.get(matchKey(day, time, 'botany_bay'))
      if (match) {
        fixtures.push({
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          status: 'match',
          ...match,
        })
      } else if (day === 'thursday' || day === 'friday') {
        fixtures.push({
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          day,
          time,
          venue: 'botany_bay',
          status: 'unavailable',
        })
      } else {
        fixtures.push({
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          day,
          time,
          venue: 'botany_bay',
          status: 'free',
        })
      }
    }
  }

  for (const day of ['monday', 'tuesday', 'thursday']) {
    for (const venue of ['hall_a', 'hall_b']) {
      const time = '12-1pm'
      const match = matchMap.get(matchKey(day, time, venue))
      if (match) {
        fixtures.push({
          id: slotId(weekId, day, time, venue),
          weekId,
          status: 'match',
          ...match,
        })
      } else {
        fixtures.push({
          id: slotId(weekId, day, time, venue),
          weekId,
          day,
          time,
          venue,
          status: 'unavailable',
        })
      }
    }
  }

  return fixtures
}

export const seedWeek = {
  id: CURRENT_WEEK_ID,
  label: 'Current week',
  rangeLabel: '23–27 March',
  startsOn: '2026-03-23',
  isCurrent: true,
}

export const seedFixtures = buildFixtures(CURRENT_WEEK_ID, MATCHES)

export const pastWeeks = [
  {
    week: {
      id: '2026-03-16',
      label: 'Week of 16 March',
      rangeLabel: '16–20 March',
      startsOn: '2026-03-16',
      isCurrent: false,
    },
    fixtures: buildFixtures('2026-03-16', withScores([...MATCHES, ...DIVISION_3], 1)),
  },
  {
    week: {
      id: '2026-03-09',
      label: 'Week of 9 March',
      rangeLabel: '9–13 March',
      startsOn: '2026-03-09',
      isCurrent: false,
    },
    fixtures: buildFixtures('2026-03-09', withScores([...MATCHES, ...DIVISION_3], 3)),
  },
  {
    week: {
      id: '2026-03-02',
      label: 'Week of 2 March',
      rangeLabel: '2–6 March',
      startsOn: '2026-03-02',
      isCurrent: false,
    },
    fixtures: buildFixtures('2026-03-02', withScores([...MATCHES, ...DIVISION_3], 4)),
  },
]
