import assert from 'node:assert/strict'
import { test } from 'node:test'
import { KNOCKOUT_DRAW, knockoutRoundLabel } from '../src/data/knockouts.js'

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
