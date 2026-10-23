import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getTeamDirectory } from '../src/lib/fixtures.js'
import { teamShortName } from '../src/lib/teams.js'

test('timetable initials stay short and unique', () => {
  const names = Object.keys(getTeamDirectory())
  const labels = names.map((name) => teamShortName(name))
  assert.equal(new Set(labels).size, names.length)
  assert.ok(labels.every((label) => label.length > 0 && label.length <= 8))
  assert.equal(teamShortName('Chicken Chasers'), 'CC')
  assert.equal(teamShortName('TBXI'), 'TBXI')
  assert.equal(teamShortName('TPSG'), 'TPSG')
  assert.notEqual(teamShortName('Real MAldrid'), teamShortName('Real Medrid'))
  assert.notEqual(teamShortName('Integer Milan'), teamShortName('Inter Milanagement'))
})
