import { buildEmptyWeekFixtures } from '../data/seed.js'
import { applyPitchSlotRules } from './fixtures.js'
import { currentWeekMonday, formatWeekRange, shiftStartsOn } from './week-dates.js'

export { currentWeekMonday, formatWeekRange, shiftStartsOn }

export function sortWeekEntries(entries) {
  return [...entries].sort((a, b) =>
    String(a.week.startsOn || a.week.id).localeCompare(String(b.week.startsOn || b.week.id)),
  )
}

export function makeEmptyWeek(startsOn) {
  const rangeLabel = formatWeekRange(startsOn)
  const monday = currentWeekMonday()
  return {
    week: {
      id: startsOn,
      label: startsOn === monday ? 'Current week' : rangeLabel,
      rangeLabel,
      startsOn,
      isCurrent: startsOn === monday,
      placeholder: true,
    },
    fixtures: applyPitchSlotRules(buildEmptyWeekFixtures(startsOn), startsOn),
  }
}

export function markCurrentWeeks(entries, now = new Date()) {
  const monday = currentWeekMonday(now)
  return sortWeekEntries(entries).map((entry) => {
    const startsOn = entry.week.startsOn || entry.week.id
    const isCurrent = startsOn === monday
    return {
      ...entry,
      week: {
        ...entry.week,
        isCurrent,
        label: isCurrent ? 'Current week' : entry.week.rangeLabel || formatWeekRange(startsOn),
      },
    }
  })
}

export function weekEntryId(entry) {
  return entry?.week?.id || entry?.week?.startsOn
}

export function currentWeekId(list) {
  const monday = currentWeekMonday()
  return (
    list.find((item) => item.week.startsOn === monday || item.week.id === monday)?.week.id ||
    list.find((item) => item.week.isCurrent)?.week.id ||
    list[0]?.week.id ||
    null
  )
}
