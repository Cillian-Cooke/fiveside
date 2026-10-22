import { loadLiveFixtures } from '../src/lib/live-fixtures.js'

export default async function handler(_req, res) {
  try {
    const payload = await loadLiveFixtures()
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).json(payload)
  } catch (error) {
    console.error('[fixtures]', error)
    res.setHeader('Cache-Control', 'no-store')
    res.status(502).json({ error: 'Could not read the fixtures sheet' })
  }
}
