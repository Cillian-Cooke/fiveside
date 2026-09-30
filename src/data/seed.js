const CURRENT_WEEK_ID = '2026-09-29'

const MATCHES = [
  { day: 'tuesday', time: '9-10am', venue: 'botany_bay', home: 'East Cavan Gaels', away: 'Dropouts FC', color: '#F9CB9C', division: 'Division 2' },
  { day: 'monday', time: '10-11am', venue: 'botany_bay', home: 'Pavillionaires', away: 'Integer Milan', color: '#EA9999', division: 'Division 1' },
  { day: 'tuesday', time: '10-11am', venue: 'botany_bay', home: 'HurriKanes', away: 'River dodder rodent', color: '#B4A7D6', division: 'Division 6' },
  { day: 'wednesday', time: '10-11am', venue: 'botany_bay', home: 'Liampool', away: 'Pavaria', color: '#F9CB9C', division: 'Division 2' },
  { day: 'thursday', time: '10-11am', venue: 'botany_bay', home: 'Lawdz and Bizches', away: 'Fiery Middle Aged Women', color: '#6AA84F', division: 'Mixed Division' },
  { day: 'friday', time: '10-11am', venue: 'botany_bay', home: 'Ajaxidative Phosphorylation', away: 'Visiting Ballers', color: '#D5A6BD', division: 'Division 7' },
  { day: 'tuesday', time: '11-12pm', venue: 'botany_bay', home: 'The Fish Tank', away: 'Real Medrid', color: '#B6D7A8', division: 'Division 4' },
  { day: 'wednesday', time: '11-12pm', venue: 'botany_bay', home: 'Engibeering', away: 'Choose Football', color: '#EA9999', division: 'Division 1' },
  { day: 'thursday', time: '11-12pm', venue: 'botany_bay', home: 'git gud', away: 'Euro football studs', color: '#6AA84F', division: 'Mixed Division' },
  { day: 'friday', time: '11-12pm', venue: 'botany_bay', home: 'The BESS Around', away: 'Lads on toure', color: '#F9CB9C', division: 'Division 2' },
  { day: 'thursday', time: '12-1pm', venue: 'hall_a', home: 'The Palpators 2.0', away: 'Mauled by the trinners', color: '#A4C2F4', division: 'Division 5' },
  { day: 'monday', time: '12-1pm', venue: 'botany_bay', home: 'PBB FC', away: 'Wings of a Sparrow', color: '#B4A7D6', division: 'Division 6' },
  { day: 'tuesday', time: '12-1pm', venue: 'botany_bay', home: 'Hangover97', away: 'Lochbessmonster', color: '#FFE599', division: 'Division 3' },
  { day: 'wednesday', time: '12-1pm', venue: 'botany_bay', home: 'Hedley Burnley', away: 'Navier Stokes', color: '#F9CB9C', division: 'Division 2' },
  { day: 'thursday', time: '12-1pm', venue: 'botany_bay', home: 'The Screaming Goafers', away: 'FC TRISS', color: '#6AA84F', division: 'Mixed Division' },
  { day: 'friday', time: '12-1pm', venue: 'botany_bay', home: 'Ponzie Prowlers', away: 'Strokes Academy', color: '#D5A6BD', division: 'Division 7' },
  { day: 'thursday', time: '12-1pm', venue: 'hall_a', home: 'FC TRISS', away: 'Lionel MSISS', color: '#FFE599', division: 'Division 3' },
  { day: 'thursday', time: '12-1pm', venue: 'hall_a', home: 'Ctrl Alt Defeat', away: 'Hack Tuah', color: '#B4A7D6', division: 'Division 6' },
  { day: 'monday', time: '2-3pm', venue: 'botany_bay', home: 'Himmy Saville', away: 'Carling F.C.', color: '#A4C2F4', division: 'Division 5' },
  { day: 'wednesday', time: '2-3pm', venue: 'botany_bay', home: 'Goaldiggers fc', away: 'Ateltico Unatletico', color: '#D5A6BD', division: 'Division 7' },
  { day: 'thursday', time: '2-3pm', venue: 'botany_bay', home: 'Ø Zone', away: 'Reels Betis', color: '#B6D7A8', division: 'Division 4' },
  { day: 'thursday', time: '12-1pm', venue: 'hall_a', home: 'Iteam', away: 'TBXI', color: '#A4C2F4', division: 'Division 5' },
  { day: 'tuesday', time: '3-4pm', venue: 'botany_bay', home: 'Unathletic Bilbao', away: 'Inter Milanagement', color: '#B6D7A8', division: 'Division 4' },
  { day: 'wednesday', time: '3-4pm', venue: 'botany_bay', home: 'Real MAldrid', away: 'The Stoppable Force', color: '#D5A6BD', division: 'Division 7' },
  { day: 'thursday', time: '3-4pm', venue: 'botany_bay', home: 'CSB FC', away: 'Sools fc', color: '#B6D7A8', division: 'Division 4' },
  { day: 'friday', time: '3-4pm', venue: 'botany_bay', home: 'Chicken Chasers', away: 'SpVgg F.K. Spartak Ussher 04', color: '#A4C2F4', division: 'Division 5' },
  { day: 'monday', time: '4-5pm', venue: 'botany_bay', home: 'Egg Fried Reus', away: 'Barely Athletic FC', color: '#EA9999', division: 'Division 1' },
  { day: 'tuesday', time: '4-5pm', venue: 'botany_bay', home: 'Buenos Aires ballers XI', away: 'Pav Furniture', color: '#FFE599', division: 'Division 3' },
  { day: 'wednesday', time: '4-5pm', venue: 'botany_bay', home: 'Coolock says Goal', away: 'TPSG', color: '#FFE599', division: 'Division 3' },
  { day: 'thursday', time: '4-5pm', venue: 'botany_bay', home: 'Mountjoy FC', away: 'Eng ballers', color: '#EA9999', division: 'Division 1' },
  { day: 'friday', time: '4-5pm', venue: 'botany_bay', home: 'Trin Tigers', away: 'Roman Empire', color: '#B4A7D6', division: 'Division 6' },
]

const SLOT_OVERRIDES = [
  { day: 'friday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
  { day: 'friday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
  { day: 'friday', time: '2-3pm', venue: 'botany_bay', status: 'free' },
  { day: 'friday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
  { day: 'friday', time: '9-10am', venue: 'botany_bay', status: 'free' },
  { day: 'monday', time: '11-12pm', venue: 'botany_bay', status: 'free' },
  { day: 'monday', time: '12-1pm', venue: 'hall_a', status: 'free' },
  { day: 'monday', time: '12-1pm', venue: 'hall_b', status: 'free' },
  { day: 'monday', time: '3-4pm', venue: 'botany_bay', status: 'free' },
  { day: 'monday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
  { day: 'monday', time: '9-10am', venue: 'botany_bay', status: 'free' },
  { day: 'thursday', time: '12-1pm', venue: 'hall_a', status: 'free' },
  { day: 'thursday', time: '12-1pm', venue: 'hall_b', status: 'free' },
  { day: 'thursday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
  { day: 'thursday', time: '9-10am', venue: 'botany_bay', status: 'free' },
  { day: 'tuesday', time: '12-1pm', venue: 'hall_a', status: 'free' },
  { day: 'tuesday', time: '12-1pm', venue: 'hall_b', status: 'free' },
  { day: 'tuesday', time: '2-3pm', venue: 'botany_bay', status: 'free' },
  { day: 'tuesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
  { day: 'wednesday', time: '12-1pm', venue: 'hall_a', status: 'unavailable' },
  { day: 'wednesday', time: '12-1pm', venue: 'hall_b', status: 'unavailable' },
  { day: 'wednesday', time: '8-9am', venue: 'botany_bay', status: 'unavailable' },
  { day: 'wednesday', time: '9-10am', venue: 'botany_bay', status: 'free' },
]

function slotId(weekId, day, time, venue) {
  return `${weekId}-${day}-${time}-${venue}`.replaceAll(' ', '')
}

export function buildFixtures(weekId, matches, slotOverrides = SLOT_OVERRIDES) {
  const fixtures = []
  const matchKey = (day, time, venue) => `${day}|${time}|${venue}`
  const matchMap = new Map(
    matches.map((match) => [matchKey(match.day, match.time, match.venue), match]),
  )
  const overrideMap = new Map(
    slotOverrides.map((slot) => [matchKey(slot.day, slot.time, slot.venue), slot.status]),
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
      if (time === '1-2pm') {
        fixtures.push({
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          day,
          time,
          venue: 'botany_bay',
          status: 'unavailable',
        })
        continue
      }

      const match = matchMap.get(matchKey(day, time, 'botany_bay'))
      if (match) {
        fixtures.push({
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          status: 'match',
          ...match,
        })
      } else {
        const override = overrideMap.get(matchKey(day, time, 'botany_bay'))
        let status = override
        if (!status) {
          status = day === 'thursday' || day === 'friday' ? 'unavailable' : 'free'
        }
        fixtures.push({
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          day,
          time,
          venue: 'botany_bay',
          status,
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
        const override = overrideMap.get(matchKey(day, time, venue))
        fixtures.push({
          id: slotId(weekId, day, time, venue),
          weekId,
          day,
          time,
          venue,
          status: override || 'unavailable',
        })
      }
    }
  }

  return fixtures
}

export const seedWeek = {
  id: CURRENT_WEEK_ID,
  label: 'Current week',
  rangeLabel: '29 Sep – 3 Oct',
  startsOn: '2026-09-29',
  isCurrent: true,
}

export const seedFixtures = buildFixtures(CURRENT_WEEK_ID, MATCHES)

/** Played weeks + scores — filled when results are published. */
export const pastWeeks = []
