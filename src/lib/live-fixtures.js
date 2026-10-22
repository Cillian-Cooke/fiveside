import { readWorkbook } from './xlsx.js'
import { workbookToPayload } from './sheet-model.js'

export const SHEET_ID = '19BtON4CVCeKyevCYjbYeH58gZ9_lcoyEtK4fFoFrW3o'

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`
const MEMORY_TTL_MS = 60_000

let cached = null
let cachedAt = 0

export async function loadLiveFixtures({ now = new Date(), fetchImpl = fetch } = {}) {
  if (cached && now.getTime() - cachedAt < MEMORY_TTL_MS) return cached

  const response = await fetchImpl(SHEET_URL, {
    headers: { 'user-agent': 'fiveside/1.0 (fixtures)' },
    redirect: 'follow',
  })
  if (!response.ok) {
    throw new Error(`Sheet export failed (${response.status})`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  const payload = workbookToPayload(readWorkbook(bytes))
  if (!payload.weeks?.length) throw new Error('Sheet export had no fixture tabs')

  if (payload.warnings?.length) {
    for (const warning of payload.warnings) console.warn(`[fixtures] ${warning}`)
  }

  const { warnings, ...publicPayload } = payload
  void warnings
  cached = { ...publicPayload, updatedAt: now.toISOString() }
  cachedAt = now.getTime()
  return cached
}

export function clearFixturesCache() {
  cached = null
  cachedAt = 0
}
