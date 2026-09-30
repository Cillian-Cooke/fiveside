/**
 * Render public/og-timetable.png for link previews (1200×630). Node-only (Vercel-safe).
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const W = 1200
const H = 630
const BG = '#33363b'
const TEXT = '#f6f6f5'
const MUTED = '#b4b8bc'
const ACCENT = '#005aa8'
const COL_BG = '#2a2d32'

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Rough word wrap for SVG (no canvas measure in Node). */
function wrapLine(text, maxChars) {
  const words = String(text).split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word
    if (trial.length <= maxChars) {
      current = trial
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function buildSvg({ title, subtitle, columns }) {
  const titleEsc = escapeXml(title)
  const subEsc = escapeXml(subtitle)
  const colCount = Math.max(columns.length, 1)
  const gap = 16
  const left = 48
  const top = 150
  const colW = Math.floor((W - left * 2 - gap * (colCount - 1)) / colCount)
  const colH = H - top - 48
  const maxChars = Math.max(12, Math.floor((colW - 28) / 9))

  let body = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <text x="48" y="78" fill="${TEXT}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="44" font-weight="700">${titleEsc}</text>`
  if (subtitle) {
    body += `\n  <text x="48" y="118" fill="${MUTED}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="26">${subEsc}</text>`
  }

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]
    const x0 = left + i * (colW + gap)
    body += `\n  <rect x="${x0}" y="${top}" width="${colW}" height="${colH}" rx="12" ry="12" fill="${COL_BG}"/>`
    body += `\n  <text x="${x0 + 14}" y="${top + 32}" fill="${ACCENT}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="22" font-weight="700">${escapeXml(col.label || '')}</text>`
    let y = top + 68
    for (const entry of col.lines || []) {
      for (const line of wrapLine(entry, maxChars)) {
        if (y > top + colH - 12) break
        body += `\n  <text x="${x0 + 14}" y="${y}" fill="${TEXT}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="17">${escapeXml(line)}</text>`
        y += 22
      }
      y += 4
    }
  }

  body += '\n</svg>'
  return body
}

/**
 * @param {object} payload
 * @param {string} outPath
 */
export async function generateOgImage(payload, outPath) {
  const svg = buildSvg(payload)
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(outPath, png)
  return outPath
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const out = join(root, 'public', 'og-timetable.png')
  await generateOgImage(payload, out)
  console.log(out)
}
