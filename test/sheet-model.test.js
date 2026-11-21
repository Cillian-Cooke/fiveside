import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { readWorkbook } from '../src/lib/xlsx.js'
import { parseFixtureTab, workbookToPayload } from '../src/lib/sheet-model.js'
import { decorateWeeks } from '../src/lib/schedule.js'
import { buildLeagueTables, uniqueTeams } from '../src/lib/fixtures.js'
import { upcomingGames } from '../src/lib/teams.js'
import fallback from '../src/data/seed-payload.json' with { type: 'json' }

const cell = (text, color = null) => ({ text, color })
const blank = () => cell('')

test('catch-up block is listed separately and the grey 1–2pm row is ignored', () => {
  const rows = [
    [blank(), cell('Monday'), cell('Tuesday'), cell('Wednesday'), cell('Thursday'), cell('Friday'), blank(), blank(), cell('Monday'), cell('Tuesday'), cell('Wednesday'), cell('Thursday'), cell('Friday'), cell('Games to be played.', '#FF0000')],
    [cell('9-10am'), cell('Carling F.C. V Chicken Chasers', '#9FC5E8'), blank(), blank(), blank(), blank(), blank(), cell('12-1pm (Hall A)'), blank(), blank(), blank(), blank(), blank(), cell('Mountjoy FC V Barely Athletic FC', '#EA9999')],
    [cell('1-2pm', '#B7B7B7'), cell('Spartak Zubi Piski V Team Football', '#B7B7B7'), cell('Unavailable', '#B7B7B7'), blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank()],
    [blank(), cell('Division 5', '#A4C2F4'), cell('Division 1', '#EA9999'), blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank()],
  ]
  const legend = { 'Division 5': '#A4C2F4', 'Division 1': '#EA9999' }
  const teams = new Map([
    ['carling f c', { name: 'Carling F.C.', meta: { division: 'Division 5' } }],
    ['chicken chasers', { name: 'Chicken Chasers', meta: { division: 'Division 5' } }],
    ['mountjoy fc', { name: 'Mountjoy FC', meta: { division: 'Division 1' } }],
    ['barely athletic fc', { name: 'Barely Athletic FC', meta: { division: 'Division 1' } }],
  ])
  const { week, warnings } = parseFixtureTab(
    rows,
    { tab: 'Week 4 19th', startsOn: '2026-10-19', weekNumber: 4, reading: false },
    legend,
    legend,
    teams,
  )
  assert.deepEqual(week.matches.map((match) => [match.home, match.away, match.division, match.color]), [
    ['Carling F.C.', 'Chicken Chasers', 'Division 5', '#A4C2F4'],
  ])
  assert.equal(week.rescheduled.length, 1)
  assert.equal(week.rescheduled[0].home, 'Mountjoy FC')
  assert.equal(week.matches.some((match) => /zubi/i.test(match.home)), false)
  assert.equal(warnings.length, 0)
})

test('playoff week 1 is Home V Away, and week 2 stage cells stay booked text', () => {
  const header = [
    blank(),
    cell('Monday'),
    cell('Tuesday'),
    cell('Wednesday'),
    cell('Thursday'),
    cell('Friday'),
    blank(),
    blank(),
    cell('Monday'),
    cell('Tuesday'),
    cell('Wednesday'),
    cell('Thursday'),
    cell('Friday'),
  ]
  const legend = {
    'Division 6': '#B4A7D6',
    'Division 7': '#D5A6BD',
    'Mixed Division': '#6AA84F',
  }
  const teams = new Map([
    ['visiting ballers', { name: 'Visiting Ballers', meta: { division: 'Division 7', color: '#D5A6BD' } }],
    ['the stoppable force', { name: 'The Stoppable Force', meta: { division: 'Division 7', color: '#D5A6BD' } }],
    ['pbb fc', { name: 'PBB FC', meta: { division: 'Division 6', color: '#B4A7D6' } }],
    ['wings of a sparrow', { name: 'Wings of a Sparrow', meta: { division: 'Division 6', color: '#B4A7D6' } }],
  ])
  const dated = {
    week1: {
      tab: 'PLAYOFFS WEEK 1',
      startsOn: '2026-11-23',
      weekNumber: null,
      reading: false,
      playoff: true,
      playoffNumber: 1,
    },
    week2: {
      tab: 'PLAYOFFS WEEK 2',
      startsOn: '2026-11-30',
      weekNumber: null,
      reading: false,
      playoff: true,
      playoffNumber: 2,
    },
  }
  const week1Rows = [
    header,
    [
      cell('8-9am'),
      cell('Unavailable'),
      blank(),
      blank(),
      blank(),
      blank(),
    ],
    [
      cell('9-10am'),
      cell('Visiting Ballers\nV\nThe Stoppable Force', '#D5A6BD'),
      cell('Staff meeting'),
      cell('SEMIS'),
      blank(),
      blank(),
    ],
    [
      cell('12-1pm'),
      cell('Gold Digger FC V Ateltico Unatletico', '#D5A6BD'),
      blank(),
      blank(),
      blank(),
      blank(),
    ],
    [
      cell('1-2pm', '#B7B7B7'),
      cell('Spartak Zubi Piski\n V\n Team Football', '#B7B7B7'),
      cell('Unavailable', '#B7B7B7'),
      blank(),
      blank(),
      blank(),
    ],
    [
      cell('4-5pm'),
      cell('PBB FC V Wings of a Sparrow', '#B4A7D6'),
      cell('Free Slot'),
      blank(),
      blank(),
      blank(),
    ],
  ]
  const week2Rows = [
    header,
    [
      cell('9-10am'),
      cell('DIVISION MIXED\n1\nSEMIS', '#6AA84F'),
      cell('DIVISION SIX / 1 / FINAL', '#B4A7D6'),
      cell('Free Slot'),
      blank(),
      blank(),
    ],
    [
      cell('10-11am'),
      cell('DIVISION SIX\n1\nFINAL', '#B4A7D6'),
      blank(),
      blank(),
      blank(),
      blank(),
    ],
    [
      cell('1-2pm', '#B7B7B7'),
      cell('DIVISION ONE\n1\nSEMIS', '#B7B7B7'),
      blank(),
      blank(),
      blank(),
      blank(),
    ],
  ]

  const first = parseFixtureTab(week1Rows, dated.week1, legend, legend, teams)
  assert.deepEqual(
    first.week.matches
      .filter((match) => match.venue === 'botany_bay')
      .map((match) => [match.day, match.time, match.home, match.away, match.division]),
    [
      ['monday', '9-10am', 'Visiting Ballers', 'The Stoppable Force', 'Division 7'],
      ['monday', '12-1pm', 'Gold Digger FC', 'Ateltico Unatletico', 'Division 7'],
      ['monday', '4-5pm', 'PBB FC', 'Wings of a Sparrow', 'Division 6'],
    ],
  )
  assert.equal(first.week.matches.some((match) => match.time === '1-2pm'), false)
  assert.equal(first.week.matches.some((match) => /zubi|spartak/i.test(match.home)), false)
  assert.equal(first.warnings.some((warning) => /Gold Digger FC/.test(warning)), true)
  assert.equal(first.warnings.some((warning) => /zubi|spartak|SEMIS/i.test(warning)), false)

  const second = parseFixtureTab(week2Rows, dated.week2, legend, legend, teams)
  assert.deepEqual(
    second.week.matches.map((match) => [match.day, match.time, match.label, match.division, match.placeholder]),
    [
      ['monday', '9-10am', 'DIVISION MIXED\n1\nSEMIS', 'Mixed Division', true],
      ['tuesday', '9-10am', 'DIVISION SIX / 1 / FINAL', 'Division 6', true],
      ['monday', '10-11am', 'DIVISION SIX\n1\nFINAL', 'Division 6', true],
    ],
  )
  assert.equal(second.week.matches.every((match) => match.home === '' && match.away === ''), true)
  assert.equal(second.week.matches.some((match) => match.time === '1-2pm'), false)
  assert.equal(second.warnings.some((warning) => /DIVISION|SEMIS|FINAL/.test(warning)), false)

  const view = decorateWeeks(
    {
      results: [],
      weeks: [
        { ...first.week, matches: first.week.matches, rescheduled: [] },
        { ...second.week, matches: second.week.matches, rescheduled: [] },
      ],
    },
    new Date('2026-11-23T12:00:00Z'),
  )
  const pw1 = view.weeks[0].fixtures
  const pw2 = view.weeks[1].fixtures
  const bay = (fixtures, day, time) =>
    fixtures.find((fixture) => fixture.day === day && fixture.time === time && fixture.venue === 'botany_bay')

  assert.equal(bay(pw1, 'monday', '9-10am').status, 'match')
  assert.equal(bay(pw1, 'monday', '9-10am').away, 'The Stoppable Force')
  assert.equal(bay(pw1, 'monday', '4-5pm').home, 'PBB FC')
  assert.equal(bay(pw1, 'tuesday', '9-10am').status, 'free')
  assert.equal(bay(pw1, 'wednesday', '9-10am').status, 'free')
  assert.equal(bay(pw1, 'tuesday', '4-5pm').status, 'free')
  assert.equal(bay(pw1, 'monday', '8-9am').status, 'unavailable')
  assert.equal(bay(pw1, 'monday', '1-2pm').status, 'unavailable')
  assert.equal(pw1.some((fixture) => /zubi|spartak/i.test(fixture.home || '')), false)

  const mixed = bay(pw2, 'monday', '9-10am')
  assert.equal(mixed.status, 'match')
  assert.equal(mixed.placeholder, true)
  assert.equal(mixed.label, 'DIVISION MIXED\n1\nSEMIS')
  assert.equal(mixed.home, '')
  assert.equal(bay(pw2, 'tuesday', '9-10am').label, 'DIVISION SIX / 1 / FINAL')
  assert.equal(bay(pw2, 'wednesday', '9-10am').status, 'free')
  assert.equal(bay(pw2, 'monday', '1-2pm').status, 'unavailable')

  const clubs = uniqueTeams([...pw1, ...pw2])
  assert.equal(clubs.some((club) => club.name === 'Visiting Ballers'), true)
  assert.equal(clubs.some((club) => club.name === 'Gold Digger FC'), true)
  assert.equal(clubs.some((club) => club.name === 'Goaldiggers fc'), false)
  assert.equal(clubs.some((club) => /SEMIS|FINAL|DIVISION MIXED/.test(club.name)), false)

  const scored = pw2.map((fixture) =>
    fixture.placeholder ? { ...fixture, homeScore: 4, awayScore: 0 } : fixture,
  )
  for (const rows of buildLeagueTables(scored).values()) {
    assert.equal(rows.some((row) => row.played > 0), false)
    assert.equal(rows.some((row) => /SEMIS|FINAL/.test(row.name)), false)
  }

  assert.deepEqual(
    upcomingGames('Visiting Ballers', pw1, 'Division 7').map((fixture) => [fixture.day, fixture.time, fixture.away]),
    [['monday', '9-10am', 'The Stoppable Force']],
  )
  assert.equal(upcomingGames('Goaldiggers fc', pw1, 'Division 7').length, 0)
  assert.equal(upcomingGames('Visiting Ballers', pw2, 'Division 7').length, 0)
})

test('bundled fallback and the sheet snapshot agree on the current week', () => {
  const payload = workbookToPayload(
    readWorkbook(readFileSync(new URL('./fixtures/league.xlsx', import.meta.url))),
  )
  assert.equal(payload.weeks[3].tab, 'Week 4 19th')
  assert.equal(payload.weeks[3].startsOn, '2026-10-19')
  assert.equal(payload.weeks[4].reading, true)
  assert.equal(payload.weeks[5].startsOn, '2026-11-02')
  assert.equal(payload.weeks[5].weekNumber, 5)
  assert.equal(payload.warnings.length, 0)

  const chicken = payload.weeks
    .flatMap((week) => week.matches)
    .find((match) => match.home === 'Iteam' && match.away === 'Chicken Chasers')
  assert.equal(chicken.division, 'Division 5')
  assert.equal(chicken.color, '#A4C2F4')
  assert.ok(payload.weeks[2].rescheduled.length > 0)
  assert.ok(payload.weeks[3].rescheduled.length > 0)
  const reading = payload.weeks.find((week) => week.reading)
  assert.equal(reading.matches.length, 1)
  assert.equal(reading.matches[0].home, 'Iteam')
  assert.equal(reading.matches[0].away, 'Carling F.C.')
  for (const week of payload.weeks) {
    const booked = new Set(
      week.matches.map((match) => [match.home, match.away].sort().join('|')),
    )
    for (const game of week.rescheduled) {
      assert.equal(
        booked.has([game.home, game.away].sort().join('|')),
        false,
        `${week.tab} lists ${game.home} vs ${game.away} in a slot and as catch-up`,
      )
    }
  }
  assert.match(payload.weeks[2].dayNotes.wednesday, /Wednesday/)
  assert.equal(
    payload.weeks.some((week) => week.matches.some((match) => /zubi|soso/i.test(match.home))),
    false,
  )
  assert.equal(payload.teams['Choose Football'].division, 'Division 1')
  assert.ok(payload.teams['FC TRISS'].byDivision['Mixed Division'])

  assert.equal(fallback.weeks[3].startsOn, '2026-10-19')
  assert.equal(fallback.weeks[3].tab, 'Week 4 19th')
  assert.equal(fallback.weeks.at(-2).tab, 'PLAYOFFS WEEK 1')
  assert.equal(fallback.weeks.at(-2).startsOn, '2026-11-23')
  assert.equal(fallback.weeks.at(-1).tab, 'PLAYOFFS WEEK 2')
  assert.equal(fallback.weeks.at(-1).playoffNumber, 2)
  assert.equal(
    fallback.weeks.every((week) => (week.rescheduled || []).length === 0),
    true,
  )

  const view = decorateWeeks(payload, new Date('2026-10-22T12:00:00Z'))
  const current = view.weeks.find((entry) => entry.week.isCurrent)
  assert.equal(current.week.pickerLabel, 'Week 4 · 19–23 Oct')
  const scored = view.weeks[0].fixtures.filter((fixture) => typeof fixture.homeScore === 'number')
  assert.ok(scored.length >= 20)
})
