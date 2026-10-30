import { readFileSync } from 'node:fs'
import { next } from '@vercel/functions'
import { loadPublishedSchedule } from './src/lib/live-schedule.js'
import { applyShareDocument, sharePreview } from './src/lib/share-meta.js'
import { decorateWeeks } from './src/lib/schedule.js'
import { setDivisionColors } from './src/constants.js'
import { setTeamDirectory } from './src/lib/fixtures.js'

const fallbackPayload = JSON.parse(
  readFileSync(new URL('./src/data/seed-payload.json', import.meta.url), 'utf8'),
)

const PREVIEW_BOT =
  /whatsapp|facebookexternalhit|facebot|twitterbot|slackbot|telegrambot|linkedinbot|discordbot|applebot|imessage|embedly|pinterest|redditbot/i

export const config = {
  runtime: 'nodejs',
  matcher: ['/', '/week/:path*', '/tables', '/tournament', '/teams/:path*'],
}

async function scheduleForShare() {
  try {
    const payload = await loadPublishedSchedule()
    setTeamDirectory(payload.teams)
    setDivisionColors(payload.legend)
    return decorateWeeks(payload)
  } catch (error) {
    console.error('[share]', error)
    setTeamDirectory(fallbackPayload.teams)
    setDivisionColors(fallbackPayload.legend)
    return decorateWeeks(fallbackPayload)
  }
}

export default async function middleware(request) {
  const url = new URL(request.url)
  const agent = request.headers.get('user-agent') || ''
  if (!PREVIEW_BOT.test(agent)) return next()

  try {
    const schedule = await scheduleForShare()
    const preview = sharePreview(schedule, url.pathname)
    const htmlResponse = await fetch(new URL('/index.html', url.origin), {
      headers: { 'user-agent': 'fiveside-share' },
    })
    const html = applyShareDocument(
      await htmlResponse.text(),
      preview,
      url.href,
      url.origin,
    )
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('[share]', error)
    return next()
  }
}
