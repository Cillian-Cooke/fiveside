import { normalizeTeamKey } from '../lib/names.js'

/** Team names for each knockout place. Null stays blank. A name links to that team's stats. */
const DIVISIONS = [
  'Division 1',
  'Division 2',
  'Division 3',
  'Division 4',
  'Division 5',
  'Division 6',
  'Division 7',
  'Mixed Division',
]

function emptyDraw() {
  return {
    quarters: [null, null, null, null, null, null, null, null],
    semis: [null, null, null, null],
    final: [null, null],
  }
}

export const KNOCKOUT_DRAW = Object.fromEntries(DIVISIONS.map((name) => [name, emptyDraw()]))

export function knockoutDraw(division) {
  return KNOCKOUT_DRAW[division] || emptyDraw()
}

const ROUND_LABEL = {
  quarters: 'Quarter-final',
  semis: 'Semi-final',
  final: 'Final',
}

function divisionName(name) {
  if (name === 'Mixed League' || name === 'Mixed') return 'Mixed Division'
  return name || ''
}

function pairKey(home, away) {
  return [normalizeTeamKey(home), normalizeTeamKey(away)].sort().join('|')
}

/** Round name when this fixture is a paired knockout tie. League games stay unlabeled. */
export function knockoutRoundLabel(fixture) {
  if (!fixture || fixture.status === 'free' || fixture.status === 'unavailable') return ''
  if (fixture.knockoutRound) return fixture.knockoutRound
  const draw = KNOCKOUT_DRAW[divisionName(fixture.division)]
  if (!draw || !fixture.home || !fixture.away) return ''
  const key = pairKey(fixture.home, fixture.away)
  for (const id of ['final', 'semis', 'quarters']) {
    const slots = draw[id] || []
    for (let index = 0; index < slots.length; index += 2) {
      if (!slots[index] || !slots[index + 1]) continue
      if (pairKey(slots[index], slots[index + 1]) === key) return ROUND_LABEL[id]
    }
  }
  return ''
}

export function annotateKnockout(fixture) {
  const knockoutRound = knockoutRoundLabel(fixture)
  if (!knockoutRound || fixture.knockoutRound === knockoutRound) return fixture
  return { ...fixture, knockoutRound }
}
