const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const BAY_TIMES = [
  '8-9am',
  '9-10am',
  '10-11am',
  '11-12pm',
  '12-1pm',
  '1-2pm',
  '2-3pm',
  '3-4pm',
  '4-5pm',
]

function slotId(weekId, day, time, venue) {
  return `${weekId}-${day}-${time}-${venue}`.replaceAll(' ', '')
}

export function buildFixtures(weekId, matches = [], slotOverrides = []) {
  const fixtures = []
  const key = (day, time, venue) => `${day}|${time}|${venue}`
  const matchMap = new Map(matches.map((match) => [key(match.day, match.time, match.venue), match]))
  const overrideMap = new Map(
    slotOverrides.map((slot) => [key(slot.day, slot.time, slot.venue), slot.status]),
  )

  for (const day of DAYS) {
    for (const time of BAY_TIMES) {
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
      const match = matchMap.get(key(day, time, 'botany_bay'))
      if (match) {
        fixtures.push({
          ...match,
          id: slotId(weekId, day, time, 'botany_bay'),
          weekId,
          status: 'match',
        })
        continue
      }
      fixtures.push({
        id: slotId(weekId, day, time, 'botany_bay'),
        weekId,
        day,
        time,
        venue: 'botany_bay',
        status: overrideMap.get(key(day, time, 'botany_bay')) || 'free',
      })
    }
  }

  for (const day of DAYS) {
    for (const venue of ['hall_a', 'hall_b']) {
      const time = '12-1pm'
      const group = matches.filter(
        (match) => match.day === day && match.venue === venue && match.time === time,
      )
      if (group.length) {
        group.forEach((match, index) => {
          fixtures.push({
            ...match,
            id: `${slotId(weekId, day, time, venue)}${group.length > 1 ? `-${index}` : ''}`,
            weekId,
            status: 'match',
          })
        })
        continue
      }
      const fallback = day === 'wednesday' || day === 'friday' ? 'unavailable' : 'free'
      fixtures.push({
        id: slotId(weekId, day, time, venue),
        weekId,
        day,
        time,
        venue,
        status: overrideMap.get(key(day, time, venue)) || fallback,
      })
    }
  }

  return fixtures
}
