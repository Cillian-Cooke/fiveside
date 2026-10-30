import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadPublishedSchedule } from './src/lib/live-schedule.js'

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
    },
  }
}

export default defineConfig({
  plugins: [react(), fixturesApi()],
  cacheDir: '/tmp/fiveside-vite-cache',
})
