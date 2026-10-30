import { findWeek, teamHorizon } from './schedule.js'
import { baySlot, uniqueTeams } from './fixtures.js'
import { BAY_TIMES, DAY_LONG, DAYS, VENUE_LABEL } from '../constants.js'
import { findTeamBySlug, teamDisplayName, teamShortName, upcomingGames } from './teams.js'

const SITE_NAME = "TCD Men's Five-a-side"
const PRODUCTION_ORIGIN = 'https://fiveside.vercel.app'

function safePathPart(pathname, pattern, max) {
  const match = String(pathname || '').match(pattern)
  if (!match) return null
  try {
    const id = decodeURIComponent(match[1])
    return new RegExp(`^[a-z0-9-]{1,${max}}$`, 'i').test(id) ? id : null
  } catch {
    return null
  }
}

export function weekIdFromPath(pathname) {
  return safePathPart(pathname, /^\/week\/([^/?#]+)/, 32)
}

export function teamSlugFromPath(pathname) {
  return safePathPart(pathname, /^\/teams\/([^/?#]+)/, 120)
}

export function nextTeamFixture(schedule, slug) {
  const roster = uniqueTeams((schedule?.weeks || []).flatMap((item) => item.fixtures))
  const team = findTeamBySlug(roster, slug)
  if (!team) return { team: null, fixture: null }
  const horizon = teamHorizon(schedule.open)
  const upcoming = (schedule.weeks || [])
    .filter((item) => String(item.week.startsOn || item.week.id) >= horizon)
    .flatMap((item) =>
      upcomingGames(team.name, item.fixtures, team.division).map((fixture) => ({
        ...fixture,
        weekLabel: item.week?.pickerLabel || item.week?.label || '',
      })),
    )
  return { team, fixture: upcoming[0] || null }
}

function matchWhen(fixture) {
  const day = DAY_LONG[fixture.day] || ''
  const time = fixture.time || ''
  return [day, time].filter(Boolean).join(', ')
}

function matchPlace(fixture) {
  return VENUE_LABEL[fixture.venue] || 'Venue to be confirmed'
}

function chosenWeek(schedule, pathname) {
  const weeks = schedule?.weeks || []
  const requested = weekIdFromPath(pathname)
  if (requested) {
    const found = findWeek(weeks, requested)
    if (found) return found
  }
  return weeks.find((item) => item.week.isCurrent) || weeks[0] || null
}

export function ogPlain(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function ogTeamLabel(name) {
  const full = ogPlain(name)
  const label = full.length > 0 && full.length <= 18 ? full : teamShortName(name)
  return ogPlain(label)
}

export function bayMatchCount(entry) {
  return (entry?.fixtures || []).filter(
    (fixture) => fixture.venue === 'botany_bay' && fixture.status === 'match',
  ).length
}

function teamSharePreview(schedule, slug) {
  const { team, fixture } = nextTeamFixture(schedule, slug)
  const imagePath = `/api/og?team=${encodeURIComponent(slug)}`
  if (!fixture) {
    const name = team ? teamDisplayName(team.name, team.division) : 'Team'
    const description = `${name} has no game coming up.`
    return {
      kind: 'match',
      title: name,
      description,
      imageAlt: description,
      imagePath,
      fixture: null,
      teamName: name,
    }
  }
  const home = teamDisplayName(fixture.home, fixture.division)
  const away = teamDisplayName(fixture.away, fixture.division)
  const title = `${home} v ${away}`
  const when = matchWhen(fixture)
  const place = matchPlace(fixture)
  const description = when ? `${when} at ${place}.` : place
  return {
    kind: 'match',
    title,
    description,
    imageAlt: `${title}. ${description}`,
    imagePath,
    fixture,
    teamName: team ? teamDisplayName(team.name, team.division) : '',
  }
}

export function sharePreview(schedule, pathname = '/') {
  const slug = teamSlugFromPath(pathname)
  if (slug) return teamSharePreview(schedule, slug)
  const entry = chosenWeek(schedule, pathname)
  const week = entry?.week
  const label = week?.pickerLabel || week?.label || 'This week'
  const games = bayMatchCount(entry)
  const gameLine =
    games === 1 ? '1 game at Botany Bay' : `${games} games at Botany Bay`
  const title = week ? `${label} — ${SITE_NAME}` : SITE_NAME
  const description = week
    ? `Botany Bay fixtures for ${label}. ${gameLine}, Monday to Friday.`
    : "This week's Botany Bay fixtures for the Trinity College Dublin men's five-a-side league."
  const weekId = week?.routeId || ''
  return {
    kind: 'week',
    title,
    description,
    imageAlt: week ? `Botany Bay fixtures for ${label}` : 'Botany Bay fixtures',
    weekId,
    imagePath: weekId ? `/api/og?week=${encodeURIComponent(weekId)}` : '/api/og',
    entry,
  }
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

export function shareTagBlock(preview, pageUrl, origin = PRODUCTION_ORIGIN) {
  const title = escapeHtml(preview.title)
  const description = escapeHtml(preview.description)
  const alt = escapeHtml(preview.imageAlt)
  const url = escapeHtml(pageUrl)
  const image = escapeHtml(`${origin}${preview.imagePath}`)
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:secure_url" content="${image}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${alt}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${alt}" />`,
  ].join('\n    ')
}

export function applyShareDocument(html, preview, pageUrl, origin) {
  const block = shareTagBlock(preview, pageUrl, origin)
  return String(html)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(
      /<!-- share-meta:start -->[\s\S]*?<!-- share-meta:end -->/,
      `<!-- share-meta:start -->\n    ${block}\n    <!-- share-meta:end -->`,
    )
}

export function botanyGrid(entry) {
  return BAY_TIMES.map((time) =>
    DAYS.map((day) => baySlot(entry?.fixtures, day, time)),
  )
}
