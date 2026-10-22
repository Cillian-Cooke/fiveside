/**
 * Refresh the bundled fallback from the public sheet.
 * The site reads live data from /api/fixtures; this file is only the offline copy.
 *
 *   node scripts/refresh-seed.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { clearFixturesCache, loadLiveFixtures } from '../src/lib/live-fixtures.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

clearFixturesCache()
const payload = await loadLiveFixtures()
const json = `${JSON.stringify(payload, null, 2)}\n`
writeFileSync(join(root, 'src/data/seed-payload.json'), json)
writeFileSync(join(root, 'src/data/division-colors.json'), `${JSON.stringify(payload.legend, null, 2)}\n`)
writeFileSync(join(root, 'src/data/team-divisions.json'), `${JSON.stringify(payload.teams, null, 2)}\n`)
console.log(
  `Saved ${payload.weeks.length} weeks, ${Object.keys(payload.teams).length} teams, updated ${payload.updatedAt}`,
)
