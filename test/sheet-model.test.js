import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { readWorkbook } from '../src/lib/xlsx.js'
import { parseFixtureTab, workbookToPayload } from '../src/lib/sheet-model.js'
import { decorateWeeks } from '../src/lib/schedule.js'
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
  assert.match(payload.weeks[2].dayNotes.wednesday, /Wednesday/)
  assert.equal(
    payload.weeks.some((week) => week.matches.some((match) => /zubi|soso/i.test(match.home))),
    false,
  )
  assert.equal(payload.teams['Choose Football'].division, 'Division 1')
  assert.ok(payload.teams['FC TRISS'].byDivision['Mixed Division'])

  assert.equal(fallback.weeks[3].startsOn, '2026-10-19')
  assert.equal(fallback.weeks[3].tab, 'Week 4 19th')

  const view = decorateWeeks(payload, new Date('2026-10-22T12:00:00Z'))
  const current = view.weeks.find((entry) => entry.week.isCurrent)
  assert.equal(current.week.pickerLabel, 'Week 4 · 19–23 Oct')
  const scored = view.weeks[0].fixtures.filter((fixture) => typeof fixture.homeScore === 'number')
  assert.ok(scored.length >= 20)
})
