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

const WEEKDAY_OFFSET = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }

function pad2(value) {
  return String(value).padStart(2, '0')
}

export function isoFromUtc(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day))
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
}

export function dublinParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Dublin',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(now)
  const get = (type) => parts.find((part) => part.type === type)?.value
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: get('weekday'),
  }
}

export function currentWeekMonday(now = new Date()) {
  const { year, month, day, weekday } = dublinParts(now)
  const offset = WEEKDAY_OFFSET[weekday] ?? 0
  return isoFromUtc(year, month, day - offset)
}

export function formatWeekRange(startsOn) {
  const [year, month, day] = String(startsOn).split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day))
  const end = new Date(Date.UTC(year, month - 1, day + 4))
  const fmt = (date) => `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
  return `${fmt(start)} – ${fmt(end)}`
}

/** Monday of Week 1. Later tabs are this date plus seven days each, in sheet order. */
export const SEASON_START = '2026-09-28'

export function isReadingTab(name) {
  return /^reading(\s+week)?\b/i.test(String(name || '').trim())
}

/**
 * Fixture tabs only. A tab counts when it starts with "Week 4" or "Reading week".
 * Names that merely contain those words, such as "Midweek" or "Week notes", do not.
 */
export function isScheduleTab(name) {
  const text = String(name || '').trim()
  return /^week\s+\d+\b/i.test(text) || isReadingTab(text)
}

/**
 * Dates come from tab order, not from names like "Week 5 2nd Nov".
 * Reading week still occupies a Monday so the following round stays on the right week.
 */
export function assignTabDates(tabNames, seasonStart = SEASON_START) {
  const dated = []
  let startsOn = seasonStart
  for (const tab of tabNames) {
    if (!isScheduleTab(tab)) continue
    const reading = isReadingTab(tab)
    dated.push({
      tab,
      startsOn,
      reading,
      weekNumber: reading ? null : weekNumberFromTab(tab),
    })
    startsOn = shiftStartsOn(startsOn, 1)
  }
  return dated
}

const WEEKDAY_NAME = {
  Mon: 'monday',
  Tue: 'tuesday',
  Wed: 'wednesday',
  Thu: 'thursday',
  Fri: 'friday',
  Sat: 'saturday',
  Sun: 'sunday',
}

export function dublinToday(now = new Date()) {
  const parts = dublinParts(now)
  return {
    ...parts,
    iso: isoFromUtc(parts.year, parts.month, parts.day),
    dayName: WEEKDAY_NAME[parts.weekday] || null,
  }
}

/** Mon–Fri range, compact when both days share a month: "19–23 Oct". */
export function formatCompactRange(startsOn) {
  const [year, month, day] = String(startsOn).split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day))
  const end = new Date(Date.UTC(year, month - 1, day + 4))
  const startMonth = MONTHS[start.getUTCMonth()]
  const endMonth = MONTHS[end.getUTCMonth()]
  if (startMonth === endMonth) {
    return `${start.getUTCDate()}–${end.getUTCDate()} ${endMonth}`
  }
  return `${start.getUTCDate()} ${startMonth}–${end.getUTCDate()} ${endMonth}`
}

export function formatUpdatedAt(iso) {
  if (!iso) return ''
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Dublin',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
  return formatted.replace(',', ' ·')
}

export function formatPickerLabel(week) {
  const range = formatCompactRange(week.startsOn)
  if (week.reading) return `Reading week · ${range}`
  return `Week ${week.weekNumber} · ${range}`
}

export function weekNumberFromTab(tab) {
  const match = String(tab || '').match(/week\s+(\d+)/i)
  if (!match) return null
  const number = Number(match[1])
  return Number.isFinite(number) && number > 0 ? number : null
}

export function shiftStartsOn(startsOn, weeks) {
  const [year, month, day] = String(startsOn).split('-').map(Number)
  return isoFromUtc(year, month, day + weeks * 7)
}
