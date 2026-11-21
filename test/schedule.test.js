import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assignTabDates,
  formatPickerLabel,
} from '../src/lib/week-dates.js'
import { betweenNote, decorateWeeks, initialDay, selectOpenWeek, teamHorizon } from '../src/lib/schedule.js'
import { isGrey, nearestDivision } from '../src/lib/sheet-model.js'

const TABS = [
  'Contact Info',
  'Week 1 28th',
  'Week 2 5th',
  'Week 3 12th',
  'Week 4 19th',
  'READING WEEK',
  'Week 5 2nd Nov',
  'Week 6 9th',
  'Week 7 16th',
]

const LEGEND = {
  'Division 1': '#EA9999',
  'Division 5': '#A4C2F4',
  'Division 6': '#B4A7D6',
  'Mixed Division': '#6AA84F',
}

test('tab order sets Mondays, and reading week keeps the following round in 2026', () => {
  const dated = assignTabDates(TABS)
  assert.deepEqual(
    dated.map((week) => [week.tab, week.startsOn, week.weekNumber, week.reading]),
    [
      ['Week 1 28th', '2026-09-28', 1, false],
      ['Week 2 5th', '2026-10-05', 2, false],
      ['Week 3 12th', '2026-10-12', 3, false],
      ['Week 4 19th', '2026-10-19', 4, false],
      ['READING WEEK', '2026-10-26', null, true],
      ['Week 5 2nd Nov', '2026-11-02', 5, false],
      ['Week 6 9th', '2026-11-09', 6, false],
      ['Week 7 16th', '2026-11-16', 7, false],
    ],
  )
  assert.equal(formatPickerLabel(dated[3]), 'Week 4 · 19–23 Oct')
  assert.equal(formatPickerLabel(dated[0]), 'Week 1 · 28 Sep–2 Oct')
  assert.equal(formatPickerLabel(dated[4]), 'Reading week · 26–30 Oct')
})

test('playoff tabs follow the league in order, with their own labels and routes', () => {
  const dated = assignTabDates([
    ...TABS,
    'PLAYOFFS WEEK 1',
    'PLAYOFFS WEEK 2',
    'Week notes',
    'Midweek fixtures',
    'Playoff notes',
    'Notes about week 9',
  ])
  assert.equal(dated.length, 10)
  assert.equal(dated.some((week) => /notes|midweek/i.test(week.tab)), false)

  const playoffs = dated.filter((week) => week.playoff)
  assert.deepEqual(
    playoffs.map((week) => [week.tab, week.startsOn, week.weekNumber, week.playoffNumber, week.reading]),
    [
      ['PLAYOFFS WEEK 1', '2026-11-23', null, 1, false],
      ['PLAYOFFS WEEK 2', '2026-11-30', null, 2, false],
    ],
  )
  assert.equal(formatPickerLabel(playoffs[0]), 'Playoffs week 1 · 23–27 Nov')
  assert.equal(formatPickerLabel(playoffs[1]), 'Playoffs week 2 · 30 Nov–4 Dec')

  const view = decorateWeeks(
    {
      results: [],
      weeks: dated.map((week) => ({ ...week, matches: [], rescheduled: [] })),
    },
    new Date('2026-11-21T12:00:00Z'),
  )
  const route = (id) => view.weeks.find((entry) => entry.week.routeId === id).week
  assert.equal(route('1').label, 'Week 1')
  assert.equal(route('1').pickerLabel, 'Week 1 · 28 Sep–2 Oct')
  assert.equal(route('2').label, 'Week 2')
  assert.equal(route('playoffs-1').label, 'Playoffs week 1')
  assert.equal(route('playoffs-1').pickerLabel, 'Playoffs week 1 · 23–27 Nov')
  assert.equal(route('playoffs-1').startsOn, '2026-11-23')
  assert.equal(route('playoffs-2').label, 'Playoffs week 2')
  assert.equal(route('playoffs-2').pickerLabel, 'Playoffs week 2 · 30 Nov–4 Dec')
  assert.equal(view.weeks.filter((entry) => entry.week.routeId === '1').length, 1)
  assert.equal(view.weeks.filter((entry) => entry.week.routeId === '2').length, 1)

  const saturday = selectOpenWeek(dated, new Date('2026-11-21T12:00:00Z'))
  assert.equal(saturday.week.playoffNumber, 1)
  assert.equal(saturday.week.startsOn, '2026-11-23')
  assert.equal(saturday.between, true)
  assert.match(betweenNote(saturday), /16–20 Nov/)
  assert.equal(view.open.week.routeId, 'playoffs-1')
  assert.equal(view.weeks.find((entry) => entry.week.isCurrent).week.routeId, 'playoffs-1')

  assert.equal(selectOpenWeek(dated, new Date('2026-11-20T16:59:00Z')).week.weekNumber, 7)
  assert.equal(selectOpenWeek(dated, new Date('2026-11-20T17:00:00Z')).week.playoffNumber, 1)
})

test('a tab name has to be a numbered week or reading week', () => {
  const dated = assignTabDates([
    'Contact Info',
    'Week notes',
    'Midweek fixtures',
    'Week 1 28th',
    'READING WEEK',
    'Week 2 5th',
  ])
  assert.deepEqual(
    dated.map((week) => [week.tab, week.startsOn, week.reading]),
    [
      ['Week 1 28th', '2026-09-28', false],
      ['READING WEEK', '2026-10-05', true],
      ['Week 2 5th', '2026-10-12', false],
    ],
  )
})

test('nearby division shades map to that tab legend, and grey does not', () => {
  assert.equal(nearestDivision('#9FC5E8', LEGEND).division, 'Division 5')
  assert.equal(nearestDivision('#9FC5E8', LEGEND).color, '#A4C2F4')
  assert.equal(nearestDivision('#A4C2F4', LEGEND).division, 'Division 5')
  assert.equal(isGrey('#B7B7B7'), true)
  assert.equal(nearestDivision('#B7B7B7', LEGEND), null)
})

function season() {
  return assignTabDates(TABS).map((week) => ({
    startsOn: week.startsOn,
    weekNumber: week.weekNumber,
    reading: week.reading,
    tab: week.tab,
  }))
}

test('22 Oct 2026 opens Week 4, and the weekend opens the next round', () => {
  const weeks = season()
  const thursday = selectOpenWeek(weeks, new Date('2026-10-22T12:00:00Z'))
  assert.equal(thursday.week.weekNumber, 4)
  assert.equal(thursday.between, false)

  const saturday = selectOpenWeek(weeks, new Date('2026-10-24T12:00:00Z'))
  assert.equal(saturday.week.reading, true)
  assert.equal(saturday.between, true)
  assert.match(betweenNote(saturday), /19–23 Oct/)

  const readingMonday = selectOpenWeek(weeks, new Date('2026-10-26T12:00:00Z'))
  assert.equal(readingMonday.week.reading, true)
  assert.equal(readingMonday.between, false)

  assert.equal(teamHorizon(saturday), '2026-10-26')
  assert.equal(teamHorizon(thursday), '2026-10-19')
})

test('mobile day jumps to today, or the next day that has a game', () => {
  const week = { startsOn: '2026-10-19' }
  const fixtures = [
    { day: 'thursday', status: 'match' },
    { day: 'friday', status: 'match' },
  ]
  assert.equal(initialDay(week, fixtures, new Date('2026-10-22T12:00:00Z')), 'thursday')
  assert.equal(
    initialDay(week, [{ day: 'friday', status: 'match' }], new Date('2026-10-22T12:00:00Z')),
    'friday',
  )
  assert.equal(
    initialDay({ startsOn: '2026-11-02' }, [{ day: 'tuesday', status: 'match' }], new Date('2026-10-22T12:00:00Z')),
    'tuesday',
  )
})

test('Friday 17:00 Dublin flips to next week, 16:59 does not', async () => {
  const { selectOpenWeek } = await import('../src/lib/schedule.js')
  const weeks = [
    { startsOn: '2026-10-26', weekNumber: 5 },
    { startsOn: '2026-11-02', weekNumber: 6 },
  ]
  assert.equal(selectOpenWeek(weeks, new Date('2026-10-30T16:59:00Z')).week.weekNumber, 5)
  assert.equal(selectOpenWeek(weeks, new Date('2026-10-30T17:00:00Z')).week.weekNumber, 6)
  assert.equal(selectOpenWeek(weeks, new Date('2026-11-02T09:00:00Z')).week.weekNumber, 6)
})

test('catch-up games are listed once and shared by every week page', () => {
  const view = decorateWeeks(
    {
      weeks: [
        {
          startsOn: '2026-10-05',
          weekNumber: 2,
          tab: 'Week 2',
          matches: [],
          rescheduled: [],
        },
        {
          startsOn: '2026-10-12',
          weekNumber: 3,
          tab: 'Week 3',
          matches: [],
          rescheduled: [
            { home: 'Lads on toure', away: 'Liampool', division: 'Division 2', color: '#F9CB9C' },
            { home: 'Egg Fried Reus', away: 'Integer Milan', division: 'Division 1', color: '#EA9999' },
          ],
        },
        {
          startsOn: '2026-10-19',
          weekNumber: 4,
          tab: 'Week 4',
          matches: [],
          rescheduled: [
            { home: 'Integer Milan', away: 'Egg Fried Reus', division: 'Division 1', color: '#EA9999' },
            { home: 'Buenos Aires ballers XI', away: 'Lionel MSISS', division: 'Division 3', color: '#FFE599' },
          ],
        },
      ],
    },
    new Date('2026-10-22T12:00:00Z'),
  )

  assert.equal(view.weeks[0].rescheduled.length, 0)
  assert.equal(view.weeks[1].rescheduled.length, 2)
  assert.deepEqual(
    view.catchups.map((game) => [game.home, game.away, game.division]),
    [
      ['Egg Fried Reus', 'Integer Milan', 'Division 1'],
      ['Lads on toure', 'Liampool', 'Division 2'],
      ['Buenos Aires ballers XI', 'Lionel MSISS', 'Division 3'],
    ],
  )
  assert.equal(new Set(view.catchups.map((game) => game.id)).size, view.catchups.length)
})
