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

export function shiftStartsOn(startsOn, weeks) {
  const [year, month, day] = String(startsOn).split('-').map(Number)
  return isoFromUtc(year, month, day + weeks * 7)
}

export function mondayOnOrBefore(iso) {
  const [year, month, day] = String(iso).split('-').map(Number)
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  const offset = (dow + 6) % 7
  return isoFromUtc(year, month, day - offset)
}

/** Read a Monday from tab names like "Week 1 28th" or "Week 2 5th". */
export function mondayFromTabName(name, now = new Date()) {
  const match = String(name).match(/(\d{1,2})(?:st|nd|rd|th)/i)
  if (!match) return null
  const dayNum = Number(match[1])
  const { year, month, day } = dublinParts(now)
  const todayUtc = Date.UTC(year, month - 1, day)
  const candidates = []
  for (const delta of [-1, 0, 1]) {
    let nextYear = year
    let nextMonth = month + delta
    if (nextMonth < 1) {
      nextMonth += 12
      nextYear -= 1
    } else if (nextMonth > 12) {
      nextMonth -= 12
      nextYear += 1
    }
    const lastDay = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate()
    if (dayNum > lastDay) continue
    const utc = Date.UTC(nextYear, nextMonth - 1, dayNum)
    candidates.push({ iso: isoFromUtc(nextYear, nextMonth, dayNum), dist: Math.abs(utc - todayUtc) })
  }
  if (!candidates.length) return null
  candidates.sort((a, b) => a.dist - b.dist)
  return mondayOnOrBefore(candidates[0].iso)
}
