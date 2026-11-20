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
    scores: {
      quarters: [null, null, null, null],
      semis: [null, null],
      final: [null],
    },
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

const SLOT_ROUND = {
  QF1: 'quarters',
  QF2: 'quarters',
  QF3: 'quarters',
  QF4: 'quarters',
  SF1: 'semis',
  SF2: 'semis',
  F: 'final',
}

const SLOT_MATCH = {
  QF1: 0,
  QF2: 1,
  QF3: 2,
  QF4: 3,
  SF1: 0,
  SF2: 1,
  F: 0,
}

/**
 * Optional Results `slot` (also `tie`). Blank means "next open tie, in sheet order".
 * QF1–QF4 are top to bottom, then SF1–SF2, then F.
 * Accepts "quarter 2", "semi-final 1", and "final". Anything else is ignored.
 */
export function canonicalSlot(value) {
  const text = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  if (!text) return ''
  let match = text.match(/^(?:qf|quarter|quarters|quarterfinal|quarterfinals)([1-4])$/)
  if (match) return `QF${match[1]}`
  match = text.match(/^(?:sf|semi|semis|semifinal|semifinals)([12])$/)
  if (match) return `SF${match[1]}`
  if (/^(?:f|f1|final|finals)$/.test(text)) return 'F'
  return ''
}

/** Round name implied by a slot id. Empty when the slot is blank or unknown. */
export function roundFromSlot(value) {
  const round = SLOT_ROUND[canonicalSlot(value)]
  return round ? ROUND_LABEL[round] : ''
}

const ORDINAL = '(?:[1-9]|1[0-6])(?:st|nd|rd|th)'
const DIVISION_PLACE = '(?:div(?:ision)?\\s*[1-7]|mixed(?:\\s+division)?)'
const FEEDER = '(?:qf\\s*[1-4]|sf\\s*[12]|quarter\\s*final\\s*[1-4]|semi\\s*final\\s*[12]|final)'

function placeholderText(name) {
  return String(name ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[._/]+/g, ' ')
    .replace(/-+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * A side that is not a club yet. The whole cell has to match, ignoring case,
 * extra spaces, and light punctuation. Real club names stay clubs.
 *
 * - TBD, TBC, TBA
 * - 5th, 5th place, 8th position
 * - Division 4 8th, Div 4 8th, 8th in Division 4
 * - Winner QF1, Winner of SF2, QF1 winner
 */
export function isPlaceholderName(name) {
  const text = placeholderText(name)
  if (!text) return false
  if (/^(?:tbd|tbc|tba)$/.test(text)) return true
  if (new RegExp(`^${ORDINAL}(?:\\s+place|\\s+position)?$`).test(text)) return true
  if (new RegExp(`^${DIVISION_PLACE}\\s+${ORDINAL}(?:\\s+place)?$`).test(text)) return true
  if (new RegExp(`^${ORDINAL}(?:\\s+place)?\\s+(?:in\\s+)?${DIVISION_PLACE}$`).test(text)) return true
  if (new RegExp(`^winner(?:\\s+of)?\\s+${FEEDER}$`).test(text)) return true
  if (new RegExp(`^${FEEDER}\\s+winner$`).test(text)) return true
  return false
}

function sideName(value) {
  const text = String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text || null
}

function sideKey(name) {
  return name ? normalizeTeamKey(name) : ''
}

function pairIdentity(home, away) {
  return [sideKey(home), sideKey(away)].sort().join('|')
}

function playedScore(tie) {
  if (typeof tie?.homeScore !== 'number' || typeof tie?.awayScore !== 'number') return null
  return { homeScore: tie.homeScore, awayScore: tie.awayScore }
}

/** Scores follow the side on display, including when a later row swaps home and away. */
function scoreForSides(displayedHome, displayedAway, tie) {
  const score = playedScore(tie)
  if (!score) return null
  const homeKey = sideKey(tie.home)
  const awayKey = sideKey(tie.away)
  if (sideKey(displayedHome) === homeKey && sideKey(displayedAway) === awayKey) return score
  if (sideKey(displayedHome) === awayKey && sideKey(displayedAway) === homeKey) {
    return { homeScore: score.awayScore, awayScore: score.homeScore }
  }
  return null
}

/**
 * Places Results-sheet ties into each division's bracket.
 * A `slot` pins the tie (QF1–QF4, SF1–SF2, F). A blank slot keeps sheet order,
 * filling the next open pair after slotted rows have taken theirs.
 * One blank side stays an empty slot. Scores are recorded only when both are numbers.
 */
export function knockoutDrawFromTies(ties) {
  const draws = Object.fromEntries(DIVISIONS.map((name) => [name, emptyDraw()]))
  const prepared = []
  for (const tie of ties || []) {
    const division = divisionName(tie.division)
    const draw = draws[division]
    if (!draw) continue
    const slotId = canonicalSlot(tie.slot)
    const stageRound = ROUND_ID[tie.knockoutRound] || ROUND_ID[canonicalStage(tie.stage || tie.knockoutRound)]
    const round = (slotId && SLOT_ROUND[slotId]) || stageRound
    if (!round || !draw[round]) continue
    const home = sideName(tie.home)
    const away = sideName(tie.away)
    if (!home && !away) continue
    prepared.push({
      division,
      round,
      match: slotId ? SLOT_MATCH[slotId] : null,
      home,
      away,
      tie,
    })
  }

  const place = (item) => {
    const draw = draws[item.division]
    const slots = draw[item.round]
    const scores = draw.scores[item.round]
    let existing = -1
    for (let index = 0; index < slots.length; index += 2) {
      if (!slots[index] && !slots[index + 1]) continue
      if (pairIdentity(slots[index], slots[index + 1]) === pairIdentity(item.home, item.away)) {
        existing = index / 2
        break
      }
    }
    if (existing >= 0) {
      if (!scores[existing]) {
        const next = scoreForSides(slots[existing * 2], slots[existing * 2 + 1], item.tie)
        if (next) scores[existing] = next
      }
      return
    }

    let match = item.match
    if (match == null) {
      match = -1
      for (let index = 0; index < slots.length; index += 2) {
        if (!slots[index] && !slots[index + 1]) {
          match = index / 2
          break
        }
      }
      if (match < 0) return
    } else if (slots[match * 2] || slots[match * 2 + 1]) {
      return
    }

    slots[match * 2] = item.home
    slots[match * 2 + 1] = item.away
    const next = scoreForSides(item.home, item.away, item.tie)
    if (next) scores[match] = next
  }

  for (const item of prepared) {
    if (item.match != null) place(item)
  }
  for (const item of prepared) {
    if (item.match == null) place(item)
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
