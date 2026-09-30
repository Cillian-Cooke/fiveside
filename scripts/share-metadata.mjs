/**
 * Refresh index.html Open Graph / WhatsApp meta + og-timetable.png from seed data.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { seedFixtures, seedWeek } from '../src/data/seed.js'
import { generateOgImage } from './generate-og-image.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = join(root, 'index.html')
const SITE_URL = (process.env.VITE_SITE_URL || 'https://fiveside.vercel.app').replace(/\/$/, '')

const DAY_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
}

const TIME_SHORT = {
  '8-9am': '8–9',
  '9-10am': '9–10',
  '10-11am': '10–11',
  '11-12pm': '11–12',
  '12-1pm': '12–1',
  '1-2pm': '1–2',
  '2-3pm': '2–3',
  '3-4pm': '3–4',
  '4-5pm': '4–5',
}

const VENUE_SHORT = {
  botany_bay: 'Bay',
  hall_a: 'Hall A',
  hall_b: 'Hall B',
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '&#10;')
}

function fixtureLabel(f) {
  const t = TIME_SHORT[f.time] || f.time
  const v = VENUE_SHORT[f.venue] || f.venue
  if (f.status === 'match') {
    return `${t} (${v}): ${f.home} v ${f.away}`
  }
  if (f.status === 'free') return `${t} (${v}): Free slot`
  return `${t} (${v}): Unavailable`
}

function buildSharePayload() {
  const range = seedWeek.rangeLabel || seedWeek.id
  const title = `TCD Men's Five-a-side — ${range}`
  const byDay = new Map(DAY_ORDER.map((d) => [d, []]))

  for (const f of seedFixtures) {
    if (f.status === 'match' || f.status === 'free') {
      byDay.get(f.day)?.push(f)
    }
  }

  for (const day of DAY_ORDER) {
    const list = byDay.get(day) || []
    list.sort((a, b) => {
      const times = Object.keys(TIME_SHORT)
      const ti = times.indexOf(a.time) - times.indexOf(b.time)
      if (ti !== 0) return ti
      return (a.venue || '').localeCompare(b.venue || '')
    })
  }

  const descriptionLines = []
  for (const day of DAY_ORDER) {
    const items = byDay.get(day) || []
    if (!items.length) continue
    descriptionLines.push(`${DAY_SHORT[day]}:`)
    for (const f of items) {
      descriptionLines.push(`• ${fixtureLabel(f)}`)
    }
  }

  const description = descriptionLines.join('\n').trim()
  const ogColumns = DAY_ORDER.map((day) => ({
    label: DAY_SHORT[day],
    lines: (byDay.get(day) || []).map((f) => {
      if (f.status === 'match') {
        const t = TIME_SHORT[f.time] || f.time
        return `${t}: ${f.home} v ${f.away}`
      }
      const t = TIME_SHORT[f.time] || f.time
      return `${t}: ${f.status === 'free' ? 'Free' : '—'}`
    }),
  }))

  return { title, subtitle: `Fixtures ${range}`, description, ogColumns }
}

function patchIndexHtml({ title, description }) {
  const imageUrl = `${SITE_URL}/og-timetable.png?v=${seedWeek.id}`
  const pageUrl = `${SITE_URL}/`
  const block = `<!-- SHARE-META:START -->
    <meta name="description" content="${escapeHtmlAttr(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="TCD Men's Five-a-side" />
    <meta property="og:url" content="${escapeHtmlAttr(pageUrl)}" />
    <meta property="og:title" content="${escapeHtmlAttr(title)}" />
    <meta property="og:description" content="${escapeHtmlAttr(description)}" />
    <meta property="og:image" content="${escapeHtmlAttr(imageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtmlAttr(title)}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(description)}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(imageUrl)}" />
    <!-- SHARE-META:END -->`

  let html = readFileSync(indexPath, 'utf8')
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(title)}</title>`)

  if (/<!-- SHARE-META:START -->[\s\S]*<!-- SHARE-META:END -->/.test(html)) {
    html = html.replace(/<!-- SHARE-META:START -->[\s\S]*<!-- SHARE-META:END -->/, block)
  } else {
    html = html.replace(
      /<meta name="theme-color"[^/]*\/>/,
      `$&\n    ${block}`,
    )
  }

  writeFileSync(indexPath, html)
}

const { title, subtitle, description, ogColumns } = buildSharePayload()
const ogPath = join(root, 'public', 'og-timetable.png')
await generateOgImage({ title, subtitle, columns: ogColumns }, ogPath)
console.log(ogPath)
patchIndexHtml({ title, description })
console.log(`Updated share metadata for ${seedWeek.rangeLabel}`)
