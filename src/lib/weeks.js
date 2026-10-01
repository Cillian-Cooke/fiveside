import { buildFixtures } from '../data/seed.js'
import { applyPitchSlotRules } from './fixtures.js'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function atNoon(startsOn) {
  return new Date(`${startsOn}T12:00:00`)
}

export function formatWeekRange(startsOn) {
  const start = atNoon(startsOn)
  const end = new Date(start)
  end.setDate(start.getDate() + 4)
  const fmt = (date) => `${date.getDate()} ${MONTHS[date.getMonth()]}`
  return `${fmt(start)} – ${fmt(end)}`
}

export function shiftStartsOn(startsOn, weeks) {
  const date = atNoon(startsOn)
  date.setDate(date.getDate() + weeks * 7)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function sortWeekEntries(entries) {
  return [...entries].sort((a, b) =>
    String(a.week.startsOn || a.week.id).localeCompare(String(b.week.startsOn || b.week.id)),
  )
}

export function makeEmptyWeek(startsOn) {
  const rangeLabel = formatWeekRange(startsOn)
  return {
    week: {
      id: startsOn,
      label: rangeLabel,
      rangeLabel,
      startsOn,
      isCurrent: false,
      placeholder: true,
    },
    fixtures: applyPitchSlotRules(buildFixtures(startsOn, []), startsOn),
  }
}

export function weekEntryId(entry) {
  return entry?.week?.id || entry?.week?.startsOn
}
