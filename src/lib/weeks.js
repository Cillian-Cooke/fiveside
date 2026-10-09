import { buildEmptyWeekFixtures } from '../data/seed.js'
import { applyPitchSlotRules } from './fixtures.js'
import {
  currentWeekMonday,
  formatWeekName,
  formatWeekRange,
  shiftStartsOn,
  weekNumberFromStartsOn,
  weekNumberFromTab,
} from './week-dates.js'

export { currentWeekMonday, formatWeekRange, shiftStartsOn }

export function sortWeekEntries(entries) {
  return [...entries].sort((a, b) =>
    String(a.week.startsOn || a.week.id).localeCompare(String(b.week.startsOn || b.week.id)),
  )
}

export function makeEmptyWeek(startsOn) {
  const rangeLabel = formatWeekRange(startsOn)
  const monday = currentWeekMonday()
  const weekNumber = weekNumberFromStartsOn(startsOn)
  return {
    week: {
      id: startsOn,
      label: formatWeekName(weekNumber) || rangeLabel,
      rangeLabel,
      startsOn,
      isCurrent: startsOn === monday,
      weekNumber,
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
    const weekNumber =
      entry.week.weekNumber ||
      weekNumberFromTab(entry.week.tab) ||
      weekNumberFromStartsOn(startsOn)
    return {
      ...entry,
      week: {
        ...entry.week,
        isCurrent,
        weekNumber,
        label: formatWeekName(weekNumber) || entry.week.rangeLabel || formatWeekRange(startsOn),
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
