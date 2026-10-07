/**
 * Build team → { division, color, byDivision? } from src/data/seed.js for sheet sync lookups.
 * Duplicate names (same team in Div 3 + Mixed) are keyed by fixture division/colour, not captain.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const seedText = readFileSync(join(root, 'src/data/seed.js'), 'utf8')

function canonicalDivision(name) {
  if (name === 'Mixed League' || name === 'Mixed') return 'Mixed Division'
  return name
}

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
    const label = canonicalDivision(division)
    const variant = { division, color: color || '' }
    const prev = teams.get(name)
    if (!prev) {
      teams.set(name, { ...variant })
      continue
    }
    if (canonicalDivision(prev.division) === label) continue
    const byDiv = { ...(prev.byDivision || {}) }
    if (!prev.byDivision) {
      byDiv[canonicalDivision(prev.division)] = {
        division: prev.division,
        color: prev.color,
      }
    }
    byDiv[label] = variant
    teams.set(name, { ...prev, byDivision: byDiv })
  }
}

const out = Object.fromEntries([...teams.entries()].sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(join(root, 'src/data/team-divisions.json'), `${JSON.stringify(out, null, 2)}\n`)
console.log(`Wrote ${Object.keys(out).length} teams to src/data/team-divisions.json`)
