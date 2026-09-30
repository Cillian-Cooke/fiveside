/**
 * Build team → { division, color } from src/data/seed.js for sheet sync lookups.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const seedText = readFileSync(join(root, 'src/data/seed.js'), 'utf8')

const teams = new Map()
const blockRe = /\{[^{}]*day:\s*'[^']+'[^{}]*\}/gs
for (const block of seedText.match(blockRe) || []) {
  const division = block.match(/division:\s*'([^']+)'/)?.[1]
  const color = block.match(/color:\s*'([^']+)'/)?.[1]
  const home = block.match(/home:\s*'([^']+)'/)?.[1]
  const away = block.match(/away:\s*'([^']+)'/)?.[1]
  if (!division) continue
  for (const name of [home, away]) {
    if (!name) continue
    const prev = teams.get(name)
    if (!prev || prev.division === division) {
      teams.set(name, { division, color: color || prev?.color })
    }
  }
}

const out = Object.fromEntries([...teams.entries()].sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(join(root, 'src/data/team-divisions.json'), `${JSON.stringify(out, null, 2)}\n`)
console.log(`Wrote ${Object.keys(out).length} teams to src/data/team-divisions.json`)
