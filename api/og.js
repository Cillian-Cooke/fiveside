import { readFileSync } from 'node:fs'
import { loadPublishedSchedule } from '../src/lib/live-schedule.js'
import { renderSharePng } from '../src/lib/render-og.js'

const fallbackPayload = JSON.parse(
  readFileSync(new URL('../src/data/seed-payload.json', import.meta.url), 'utf8'),
)

function weekIdFrom(req) {
  const url = new URL(req.url || '/', 'https://fiveside.vercel.app')
  const week = url.searchParams.get('week') || ''
  return /^[a-z0-9-]{1,32}$/i.test(week) ? week : ''
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
    const png = await renderSharePng(payload, weekIdFrom(req))
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
    res.status(200).end(png)
  } catch (error) {
    console.error('[og]', error)
    res.setHeader('Cache-Control', 'no-store')
    res.status(500).json({ error: 'Could not draw the fixtures image' })
  }
}
