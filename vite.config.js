import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadPublishedSchedule } from './src/lib/live-schedule.js'
import { renderSharePng } from './src/lib/render-og.js'
import fallbackPayload from './src/data/seed-payload.json' with { type: 'json' }

function fixturesApi() {
  return {
    name: 'fixtures-api',
    configureServer(server) {
      server.middlewares.use('/api/fixtures', async (_req, res) => {
        try {
          const payload = await loadPublishedSchedule()
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
          res.end(JSON.stringify(payload))
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ error: error?.message || 'Could not read the fixtures sheet' }))
        }
      })
      server.middlewares.use('/api/og', async (req, res) => {
        try {
          const url = new URL(req.url || '/', 'http://localhost')
          const week = url.searchParams.get('week') || ''
          const weekId = /^[a-z0-9-]{1,32}$/i.test(week) ? week : ''
          let payload = fallbackPayload
          try {
            payload = await loadPublishedSchedule()
          } catch (error) {
            console.error('[og]', error)
          }
          const png = await renderSharePng(payload, weekId)
          res.setHeader('Content-Type', 'image/png')
          res.setHeader('Cache-Control', 'public, max-age=60')
          res.end(png)
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: error?.message || 'Could not draw the fixtures image' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), fixturesApi()],
  cacheDir: '/tmp/fiveside-vite-cache',
})
