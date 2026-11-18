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
  const source = liveDraw || KNOCKOUT_DRAW
  return source[divisionName(division)] || emptyDraw()
}

const ROUND_LABEL = {
  quarters: 'Quarter-final',
  semis: 'Semi-final',
  final: 'Final',
}

export function canonicalStage(value) {
  const text = String(value || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
  if (!text) return ''
  if (['quarter', 'quarters', 'quarterfinal', 'quarterfinals', 'qf'].includes(text)) {
    return 'Quarter-final'
  }
  if (['semi', 'semis', 'semifinal', 'semifinals', 'sf'].includes(text)) return 'Semi-final'
  if (['final', 'finals'].includes(text)) return 'Final'
  return ''
}

function divisionName(name) {
  const text = String(name || '').replace(/\s+/g, ' ').trim()
  if (/^mixed(?:\s+(?:division|league))?$/i.test(text)) return 'Mixed Division'
  const match = text.match(/^(?:div(?:ision)?\.?\s*)(\d+)$/i)
  if (match) return `Division ${match[1]}`
  return text
}

const ROUND_ID = {
  'Quarter-final': 'quarters',
  'Semi-final': 'semis',
  Final: 'final',
}

/** Places Results-sheet ties into each division's bracket, in sheet order. */
export function knockoutDrawFromTies(ties) {
  const draws = Object.fromEntries(DIVISIONS.map((name) => [name, emptyDraw()]))
  for (const tie of ties || []) {
    const division = divisionName(tie.division)
    const round = ROUND_ID[tie.knockoutRound] || ROUND_ID[canonicalStage(tie.stage || tie.knockoutRound)]
    const slots = draws[division]?.[round]
    if (!slots || !tie.home || !tie.away) continue
    const key = pairKey(tie.home, tie.away)
    let placed = false
    for (let index = 0; index < slots.length; index += 2) {
      if (slots[index] && slots[index + 1] && pairKey(slots[index], slots[index + 1]) === key) {
        placed = true
        break
      }
    }
    if (placed) continue
    for (let index = 0; index < slots.length; index += 2) {
      if (!slots[index] && !slots[index + 1]) {
        slots[index] = tie.home
        slots[index + 1] = tie.away
        break
      }
    }
  }
  return draws
}

let liveDraw = null

/** Ties from the Results sheet. An empty list clears back to blank brackets. */
export function setKnockoutDraw(ties) {
  liveDraw = Array.isArray(ties) && ties.length ? knockoutDrawFromTies(ties) : null
}

function pairKey(home, away) {
  return [normalizeTeamKey(home), normalizeTeamKey(away)].sort().join('|')
}

/** Round name when this fixture is a paired knockout tie. League games stay unlabeled. */
export function knockoutRoundLabel(fixture) {
  if (!fixture || fixture.status === 'free' || fixture.status === 'unavailable') return ''
  if (fixture.knockoutRound) return fixture.knockoutRound
  const draw = (liveDraw || KNOCKOUT_DRAW)[divisionName(fixture.division)]
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
