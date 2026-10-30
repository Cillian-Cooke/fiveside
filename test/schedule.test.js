import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assignTabDates,
  formatPickerLabel,
} from '../src/lib/week-dates.js'
import { betweenNote, initialDay, selectOpenWeek, teamHorizon } from '../src/lib/schedule.js'
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
