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

const MONTH_LOOKUP = Object.fromEntries(
  MONTHS.flatMap((name, index) => {
    const short = name.slice(0, 3).toLowerCase()
    const full = name.toLowerCase()
    const entries = [
      [short, index + 1],
      [full, index + 1],
    ]
    if (short === 'sep') entries.push(['sept', 9])
    return entries
  }),
)

/** Read a Monday from tab names like "Week 1 28th", "Week 2 5th", or "Week 5 2nd Nov". */
export function mondayFromTabName(name, now = new Date(), afterMonday = null) {
  const text = String(name)
  const match = text.match(/(\d{1,2})(?:st|nd|rd|th)/i)
  if (!match) return null
  const dayNum = Number(match[1])
  const monthMatch = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
  )
  const { year, month, day } = dublinParts(now)
  const todayUtc = Date.UTC(year, month - 1, day)
  const monthHint = monthMatch
    ? MONTH_LOOKUP[monthMatch[1].slice(0, 3).toLowerCase()] || MONTH_LOOKUP[monthMatch[1].toLowerCase()]
    : null

  const seen = new Set()
  const candidates = []
  const addMonth = (nextYear, nextMonth) => {
    const key = `${nextYear}-${nextMonth}`
    if (seen.has(key)) return
    seen.add(key)
    const lastDay = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate()
    if (dayNum > lastDay) return
    const utc = Date.UTC(nextYear, nextMonth - 1, dayNum)
    candidates.push({
      iso: mondayOnOrBefore(isoFromUtc(nextYear, nextMonth, dayNum)),
      dist: Math.abs(utc - todayUtc),
    })
  }

  if (monthHint) {
    for (const nextYear of [year - 1, year, year + 1]) addMonth(nextYear, monthHint)
  } else {
    for (let delta = -2; delta <= 10; delta++) {
      let nextYear = year
      let nextMonth = month + delta
      while (nextMonth < 1) {
        nextMonth += 12
        nextYear -= 1
      }
      while (nextMonth > 12) {
        nextMonth -= 12
        nextYear += 1
      }
      addMonth(nextYear, nextMonth)
    }
  }

  if (!candidates.length) return null
  const later = afterMonday ? candidates.filter((item) => item.iso > afterMonday) : []
  const pool = later.length ? later : candidates
  pool.sort((a, b) => (later.length ? a.iso.localeCompare(b.iso) : a.dist - b.dist))
  return pool[0].iso
}
