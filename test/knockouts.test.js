import assert from 'node:assert/strict'
import { test } from 'node:test'
import teamDirectory from '../src/data/team-divisions.json' with { type: 'json' }
import {
  canonicalSlot,
  isPlaceholderName,
  KNOCKOUT_DRAW,
  knockoutDrawFromTies,
  knockoutRoundLabel,
  setKnockoutDraw,
} from '../src/data/knockouts.js'
import { buildLeagueTables, uniqueTeams } from '../src/lib/fixtures.js'

test('a paired knockout tie is labeled with its round', () => {
  const draw = KNOCKOUT_DRAW['Division 4']
  const previous = {
    quarters: [...draw.quarters],
    semis: [...draw.semis],
    final: [...draw.final],
  }
  draw.quarters[0] = 'CSB FC'
  draw.quarters[1] = 'Inter Milanagement'
  draw.semis[0] = 'CSB FC'
  draw.semis[1] = 'Sools fc'
  draw.final[0] = 'CSB FC'
  draw.final[1] = 'Real Medrid'

  try {
    assert.equal(
      knockoutRoundLabel({
        home: 'Inter Milanagement',
        away: 'CSB FC',
        division: 'Division 4',
        status: 'match',
      }),
      'Quarter-final',
    )
    assert.equal(
      knockoutRoundLabel({
        home: 'CSB FC',
        away: 'Sools fc',
        division: 'Division 4',
        status: 'match',
      }),
      'Semi-final',
    )
    assert.equal(
      knockoutRoundLabel({
        home: 'Real Medrid',
        away: 'CSB FC',
        division: 'Division 4',
        status: 'match',
      }),
      'Final',
    )
    assert.equal(
      knockoutRoundLabel({
        home: 'CSB FC',
        away: 'Ø Zone',
        division: 'Division 4',
        status: 'match',
      }),
      '',
    )
  } finally {
    draw.quarters.splice(0, draw.quarters.length, ...previous.quarters)
    draw.semis.splice(0, draw.semis.length, ...previous.semis)
    draw.final.splice(0, draw.final.length, ...previous.final)
  }
})

test('Results-sheet ties fill the bracket and label that matchup', () => {
  const ties = [
    { division: 'Div 4', home: 'CSB FC', away: 'Inter Milanagement', knockoutRound: 'Quarter-final' },
    { division: 'Division 4', home: 'Sools fc', away: 'CSB FC', stage: 'semi' },
  ]
  const bracket = knockoutDrawFromTies(ties)
  assert.deepEqual(bracket['Division 4'].quarters.slice(0, 2), ['CSB FC', 'Inter Milanagement'])
  assert.deepEqual(bracket['Division 4'].semis.slice(0, 2), ['Sools fc', 'CSB FC'])
  assert.equal(bracket['Division 1'].quarters.every((slot) => slot == null), true)

  setKnockoutDraw(ties)
  try {
    assert.equal(
      knockoutRoundLabel({
        home: 'Inter Milanagement',
        away: 'CSB FC',
        division: 'Division 4',
        status: 'match',
      }),
      'Quarter-final',
    )
    assert.equal(
      knockoutRoundLabel({
        home: 'CSB FC',
        away: 'Ø Zone',
        division: 'Division 4',
        status: 'match',
      }),
      '',
    )
  } finally {
    setKnockoutDraw([])
  }
})

test('a slot pins the tie, and a blank slot still follows sheet order', () => {
  const bracket = knockoutDrawFromTies([
    { division: 'Division 4', home: 'Sheet Order FC', away: 'Next Side', knockoutRound: 'Semi-final' },
    { division: 'Div 4', home: 'Real Medrid', away: '5th place', knockoutRound: 'Semi-final', slot: 'QF1' },
    { division: 'Division 4', home: 'CSB FC', away: 'Ø Zone', stage: 'quarter', slot: 'quarter 4' },
    { division: 'Division 4', home: 'Inter Milanagement', away: '', knockoutRound: 'Quarter-final', slot: 'QF3' },
    { division: 'Division 4', home: 'Sools fc', away: 'The Fish Tank', knockoutRound: 'Quarter-final', slot: 'QF9' },
    { division: 'Division 4', home: 'Winner QF1', away: 'TBD', slot: 'SF2' },
    { division: 'Division 4', home: 'Late Home', away: 'Late Away', knockoutRound: 'Quarter-final', slot: 'QF1' },
  ])
  const division = bracket['Division 4']

  assert.deepEqual(division.quarters.slice(0, 2), ['Real Medrid', '5th place'])
  assert.deepEqual(division.quarters.slice(2, 4), ['Sools fc', 'The Fish Tank'])
  assert.deepEqual(division.quarters.slice(4, 6), ['Inter Milanagement', null])
  assert.deepEqual(division.quarters.slice(6, 8), ['CSB FC', 'Ø Zone'])
  assert.equal(division.quarters.includes('Late Home'), false)
  assert.deepEqual(division.semis.slice(0, 2), ['Sheet Order FC', 'Next Side'])
  assert.deepEqual(division.semis.slice(2, 4), ['Winner QF1', 'TBD'])
  assert.equal(division.scores.quarters[0], null)
  assert.equal(division.scores.quarters[1], null)
  assert.equal(canonicalSlot('semi-final 1'), 'SF1')
  assert.equal(canonicalSlot(''), '')
})

test('a later score fills the same tie and a blank score is not 0–0', () => {
  const bracket = knockoutDrawFromTies([
    {
      division: 'Division 4',
      home: 'CSB FC',
      away: 'Ø Zone',
      knockoutRound: 'Quarter-final',
      slot: 'QF4',
    },
    {
      division: 'Division 4',
      home: 'Ø Zone',
      away: 'CSB FC',
      knockoutRound: 'Quarter-final',
      homeScore: 1,
      awayScore: 2,
    },
    {
      division: 'Division 4',
      home: 'Real Medrid',
      away: 'Inter Milanagement',
      knockoutRound: 'Final',
      slot: 'F',
      homeScore: 0,
      awayScore: 0,
    },
    {
      division: 'Division 4',
      home: 'Sools fc',
      away: 'The Fish Tank',
      knockoutRound: 'Semi-final',
      slot: 'SF1',
      homeScore: 3,
    },
  ])
  const division = bracket['Division 4']
  assert.deepEqual(division.quarters.slice(6, 8), ['CSB FC', 'Ø Zone'])
  assert.deepEqual(division.scores.quarters[3], { homeScore: 2, awayScore: 1 })
  assert.deepEqual(division.scores.final[0], { homeScore: 0, awayScore: 0 })
  assert.equal(division.scores.semis[0], null)
  assert.equal(division.scores.quarters[0], null)
})

test('placeholder labels are not clubs, links, or table rows', () => {
  for (const name of ['TBD', 'tbc', '5th place', '8th', 'Division 4 8th', 'Div. 4 8th', '8th in Division 4', 'Winner QF1', 'Winner of SF2', 'QF1 winner']) {
    assert.equal(isPlaceholderName(name), true, name)
  }
  for (const name of Object.keys(teamDirectory)) {
    assert.equal(isPlaceholderName(name), false, name)
  }
  assert.equal(isPlaceholderName('Winner'), false)
  assert.equal(isPlaceholderName('QF1'), false)
  assert.equal(isPlaceholderName(''), false)

  const fixtures = [
    {
      status: 'match',
      weekId: '2026-11-16',
      home: 'Real Medrid',
      away: 'CSB FC',
      division: 'Division 4',
      color: '#6AA84F',
      homeScore: 2,
      awayScore: 0,
    },
    {
      status: 'match',
      weekId: '2026-11-23',
      home: 'Real Medrid',
      away: '5th place',
      division: 'Division 4',
      color: '#6AA84F',
      homeScore: 9,
      awayScore: 0,
    },
  ]
  const table = buildLeagueTables(fixtures).get('Division 4')
  assert.equal(table.some((row) => row.name === '5th place'), false)
  const real = table.find((row) => row.name === 'Real Medrid')
  assert.equal(real.played, 1)
  assert.equal(real.points, 3)
  assert.equal(real.gf, 2)

  const clubs = uniqueTeams(fixtures)
  assert.equal(clubs.some((club) => club.name === '5th place'), false)
  assert.equal(clubs.some((club) => club.name === 'Real Medrid'), true)

  setKnockoutDraw([
    { division: 'Division 4', home: 'Real Medrid', away: '5th place', knockoutRound: 'Quarter-final', slot: 'QF1' },
    { division: 'Division 4', home: 'CSB FC', away: 'Ø Zone', knockoutRound: 'Quarter-final', slot: 'QF4' },
  ])
  try {
    assert.equal(
      knockoutRoundLabel({
        home: 'Ø Zone',
        away: 'CSB FC',
        division: 'Division 4',
        status: 'match',
      }),
      'Quarter-final',
    )
    assert.equal(
      knockoutRoundLabel({
        home: 'Real Medrid',
        away: 'CSB FC',
        division: 'Division 4',
        status: 'match',
      }),
      '',
    )
  } finally {
    setKnockoutDraw([])
  }
})
