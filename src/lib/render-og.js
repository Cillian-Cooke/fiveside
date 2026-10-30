import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import satori from 'satori'
import { Resvg, initWasm } from '@resvg/resvg-wasm'
import { setDivisionColors } from '../constants.js'
import { setTeamDirectory } from './fixtures.js'
import { ogCard } from './og-card.js'
import { decorateWeeks } from './schedule.js'
import { sharePreview } from './share-meta.js'

const require = createRequire(import.meta.url)
const fontData = readFileSync(new URL('../../assets/fonts/Sora-Bold.ttf', import.meta.url))

let wasmReady
function ensureWasm() {
  if (!wasmReady) {
    wasmReady = initWasm(readFileSync(require.resolve('@resvg/resvg-wasm/index_bg.wasm')))
  }
  return wasmReady
}

export async function renderSharePng(payload, weekId) {
  setTeamDirectory(payload?.teams)
  setDivisionColors(payload?.legend)
  const schedule = decorateWeeks(payload)
  const preview = sharePreview(schedule, weekId ? `/week/${weekId}` : '/')
  await ensureWasm()
  const svg = await satori(ogCard(preview.entry), {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Sora',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  })
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  }).render().asPng()
  return Buffer.from(png)
}
