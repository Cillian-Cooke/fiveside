/**
 * Refresh src/data/team-divisions.json from the sheet Contact Info tab
 * (division headers in column B, teams listed under each header).
 */
import { writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const DEFAULT_SHEET_ID = '19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o'
const DEFAULT_SHEET_NAME = 'Contact Info'

const DIVISION_COLORS = {
  'Division 1': '#F9CB9C',
  'Division 2': '#FFE599',
  'Division 3': '#CFE2F3',
  'Division 4': '#EA9999',
  'Division 5': '#B4A7D6',
  'Division 6': '#D9EAD3',
  'Division 7': '#FF9900',
  'Mixed Division': '#1155CC',
  Mixed: '#1155CC',
}

function parseArgs(argv) {
  const opts = { sheetId: DEFAULT_SHEET_ID, sheetName: DEFAULT_SHEET_NAME }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--sheet-id') opts.sheetId = argv[++i]
    else if (a === '--sheet-name') opts.sheetName = argv[++i]
  }
  return opts
}

function fetchDivisions(sheetId, sheetName) {
  const py = join(dirname(fileURLToPath(import.meta.url)), 'fetch-team-divisions-from-sheet.py')
  const result = spawnSync(
    'python3',
    [py, '--sheet-id', sheetId, '--sheet-name', sheetName],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(result.stdout || result.stderr || 'fetch-team-divisions-from-sheet.py failed')
  }
  const payload = JSON.parse(result.stdout)
  if (payload.error) throw new Error(payload.error)
  return payload.teams
}

function main() {
  const opts = parseArgs(process.argv)
  const raw = fetchDivisions(opts.sheetId, opts.sheetName)
  const out = {}
  for (const [name, division] of Object.entries(raw).sort(([a], [b]) => a.localeCompare(b))) {
    const div = division === 'Mixed' ? 'Mixed Division' : division
    out[name] = { division: div, color: DIVISION_COLORS[div] || DIVISION_COLORS['Mixed Division'] }
  }
  const path = join(root, 'src/data/team-divisions.json')
  writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`)
  console.log(`Wrote ${Object.keys(out).length} teams from "${opts.sheetName}" → ${path}`)
}

main()
