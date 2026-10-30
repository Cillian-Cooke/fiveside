import { readFileSync } from 'node:fs'
import { loadPublishedSchedule } from '../src/lib/live-schedule.js'
import { renderSharePng } from '../src/lib/render-og.js'

const fallbackPayload = JSON.parse(
  readFileSync(new URL('../src/data/seed-payload.json', import.meta.url), 'utf8'),
)

function shareQuery(req) {
  const url = new URL(req.url || '/', 'https://fiveside.vercel.app')
  const week = url.searchParams.get('week') || ''
  const team = url.searchParams.get('team') || ''
  return {
    weekId: /^[a-z0-9-]{1,32}$/i.test(week) ? week : '',
    teamSlug: /^[a-z0-9-]{1,120}$/i.test(team) ? team : '',
  }
}

export default async function handler(req, res) {
  try {
    let payload
    try {
      payload = await loadPublishedSchedule()
    } catch (error) {
      console.error('[og] sheet', error)
      payload = fallbackPayload
    }
    const query = shareQuery(req)
    const png = await renderSharePng(payload, query.weekId, query.teamSlug)
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
    res.status(200).end(png)
  } catch (error) {
    console.error('[og]', error)
    res.setHeader('Cache-Control', 'no-store')
    res.status(500).json({ error: 'Could not draw the fixtures image' })
  }
}
