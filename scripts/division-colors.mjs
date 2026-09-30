import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export const DIVISION_ORDER = [
  'Division 1',
  'Division 2',
  'Division 3',
  'Division 4',
  'Division 5',
  'Division 6',
  'Division 7',
  'Mixed Division',
]

export const divisionColorsPath = join(root, 'src/data/division-colors.json')

export function normalizeLegend(legend) {
  const out = {}
  for (const name of DIVISION_ORDER) {
    const hex = legend?.[name]
    if (hex) out[name] = hex.toUpperCase()
  }
  return out
}

export function writeDivisionColors(legend) {
  const out = normalizeLegend(legend)
  if (Object.keys(out).length < DIVISION_ORDER.length) {
    throw new Error(
      `Sheet legend missing division colours (got ${Object.keys(out).join(', ')})`,
    )
  }
  writeFileSync(divisionColorsPath, `${JSON.stringify(out, null, 2)}\n`)
  return out
}

export function readDivisionColors() {
  return JSON.parse(readFileSync(divisionColorsPath, 'utf8'))
}

export function fetchSheetLegend(sheetId) {
  const py = join(dirname(fileURLToPath(import.meta.url)), 'fetch-sheet-cells.py')
  const result = spawnSync('python3', [py, '--sheet-id', sheetId], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(result.stdout || result.stderr || 'fetch-sheet-cells.py failed')
  }
  const payload = JSON.parse(result.stdout)
  if (payload.error) throw new Error(payload.error)
  return payload.legend || {}
}

export function loadDivisionColors(sheetId) {
  try {
    return readDivisionColors()
  } catch {
    return writeDivisionColors(fetchSheetLegend(sheetId))
  }
}
