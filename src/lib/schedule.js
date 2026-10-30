import { applyPitchSlotRules } from './fixtures.js'
import { overlayMatchScores } from './match-results.js'
import { buildFixtures } from './build-fixtures.js'
import {
  currentWeekMonday,
  dublinToday,
  formatCompactRange,
  formatPickerLabel,
  formatWeekRange,
  shiftStartsOn,
} from './week-dates.js'

export function weekRouteId(week) {
  if (week?.routeId) return week.routeId
  if (week?.reading) return 'reading'
  return String(week?.weekNumber || '')
}

export function weekPath(week) {
  return `/week/${weekRouteId(week)}`
}

/**
 * The week the site should open on.
 * From Friday 17:00 Dublin through Sunday the round is over, so the next tab is shown with a note.
 * Saturday and Sunday are between rounds, so the next tab is shown with a note.
 */
export function selectOpenWeek(weeks, now = new Date()) {
  const list = weeks || []
  if (!list.length) return { week: null, between: false, finished: null }
  const today = dublinToday(now)
  const weekend =
    today.dayName === 'saturday' ||
    today.dayName === 'sunday' ||
    (today.dayName === 'friday' && today.hour >= 17)
  let containing = null
  for (const week of list) {
    const nextMonday = shiftStartsOn(week.startsOn, 1)
    if (today.iso >= week.startsOn && today.iso < nextMonday) containing = week
  }
  if (!containing) {
    if (today.iso < list[0].startsOn) return { week: list[0], between: false, finished: null }
    return { week: list[list.length - 1], between: false, finished: null }
  }
  if (weekend) {
    const index = list.indexOf(containing)
    const next = list[index + 1]
    if (next) return { week: next, between: true, finished: containing }
  }
  return { week: containing, between: false, finished: null }
}

/** Monday the team page treats as the start of what is coming up. Weekends follow the next round. */
export function teamHorizon(open) {
  return open?.week?.startsOn || currentWeekMonday()
}

export function betweenNote(open) {
  if (!open?.between || !open.finished) return null
  return `Games for ${formatCompactRange(open.finished.startsOn)} are finished. Showing the next week.`
}

export function initialDay(week, fixtures, now = new Date()) {
  const today = dublinToday(now)
  const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const hasMatch = (day) =>
    (fixtures || []).some((fixture) => fixture.day === day && fixture.status === 'match')
  const nextWithMatch = (fromIndex) => {
    for (let index = fromIndex; index < order.length; index += 1) {
      if (hasMatch(order[index])) return order[index]
    }
    for (let index = 0; index < fromIndex; index += 1) {
      if (hasMatch(order[index])) return order[index]
    }
    return 'monday'
  }

  const inThisWeek =
    today.iso >= week.startsOn && today.iso < shiftStartsOn(week.startsOn, 1)
  if (inThisWeek && order.includes(today.dayName)) {
    if (hasMatch(today.dayName)) return today.dayName
    return nextWithMatch(order.indexOf(today.dayName))
  }
  return nextWithMatch(0)
}

export function decorateWeeks(payload, now = new Date()) {
  const source = payload?.weeks || []
  const scoreRows = Array.isArray(payload?.results) ? payload.results : undefined
  const open = selectOpenWeek(source, now)
  const openStartsOn = open.week?.startsOn
  const weeks = source.map((entry) => {
    const fixtures = overlayMatchScores(
      applyPitchSlotRules(buildFixtures(entry.startsOn, entry.matches, entry.slotOverrides), entry.startsOn),
      scoreRows,
    )
    return {
      week: {
        id: entry.startsOn,
        routeId: weekRouteId(entry),
        label: entry.reading ? 'Reading week' : `Week ${entry.weekNumber}`,
        rangeLabel: formatWeekRange(entry.startsOn),
        pickerLabel: formatPickerLabel(entry),
        startsOn: entry.startsOn,
        weekNumber: entry.weekNumber,
        reading: Boolean(entry.reading),
        tab: entry.tab,
        isCurrent: entry.startsOn === open.week?.startsOn,
        dayNotes: entry.dayNotes || {},
      },
      fixtures,
      rescheduled: (entry.rescheduled || []).map((game, index) => ({
        ...game,
        id: `rescheduled-${entry.startsOn}-${index}`,
        weekId: entry.startsOn,
        status: 'match',
      })),
    }
  })
  const openEntry = weeks.find((item) => item.week.startsOn === openStartsOn)
  return {
    weeks,
    open: { ...open, week: openEntry?.week || null },
    between: betweenNote(open),
  }
}

export function findWeek(weeks, routeId) {
  return (weeks || []).find((entry) => entry.week.routeId === String(routeId || '')) || null
}
