/**
 * Minimal xlsx reader (zip + spreadsheet XML) so a Vercel function can see
 * cell text and fill colours without a spreadsheet dependency.
 */
import { inflateRawSync } from 'node:zlib'

const SKIP_RGB = new Set([
  'FFFFFFFF',
  '00000000',
  'FFF0F0F0',
  'FFE7E6E6',
  'FFD3D3D3',
  'FFCCCCCC',
])

function decodeXml(text) {
  return String(text)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function localName(tag) {
  const name = String(tag || '')
  const cut = name.lastIndexOf(':')
  return cut >= 0 ? name.slice(cut + 1) : name
}

/** Small XML reader for the well-formed spreadsheet parts we actually need. */
export function parseXml(xml) {
  const source = String(xml).replace(/^\uFEFF/, '')
  let index = 0

  function skipPreamble() {
    while (index < source.length) {
      while (source[index] && /\s/.test(source[index])) index += 1
      if (source.startsWith('<?', index)) {
        const end = source.indexOf('?>', index)
        index = end < 0 ? source.length : end + 2
        continue
      }
      if (source.startsWith('<!--', index)) {
        const end = source.indexOf('-->', index)
        index = end < 0 ? source.length : end + 3
        continue
      }
      break
    }
  }

  function readAttributes() {
    const attrs = {}
    while (index < source.length) {
      while (source[index] && /\s/.test(source[index])) index += 1
      if (!source[index] || source[index] === '>' || source[index] === '/') break
      const start = index
      while (source[index] && /[^\s=/>]/.test(source[index])) index += 1
      const key = localName(source.slice(start, index))
      while (source[index] && /\s/.test(source[index])) index += 1
      if (source[index] !== '=') continue
      index += 1
      while (source[index] && /\s/.test(source[index])) index += 1
      const quote = source[index]
      index += 1
      const valueStart = index
      while (source[index] && source[index] !== quote) index += 1
      attrs[key] = decodeXml(source.slice(valueStart, index))
      if (source[index] === quote) index += 1
    }
    return attrs
  }

  function readNode() {
    skipPreamble()
    if (source[index] !== '<') return null
    index += 1
    if (source[index] === '/') return null
    const start = index
    while (source[index] && /[^\s/>]/.test(source[index])) index += 1
    const name = localName(source.slice(start, index))
    const attrs = readAttributes()
    while (source[index] && /\s/.test(source[index])) index += 1
    let selfClosing = false
    if (source[index] === '/') {
      selfClosing = true
      index += 1
    }
    if (source[index] === '>') index += 1
    const node = { name, attrs, children: [], text: '' }
    if (selfClosing) return node

    let text = ''
    while (index < source.length) {
      if (source[index] === '<') {
        if (text) {
          node.text += decodeXml(text)
          text = ''
        }
        if (source[index + 1] === '/') {
          const end = source.indexOf('>', index)
          index = end < 0 ? source.length : end + 1
          break
        }
        const child = readNode()
        if (child) node.children.push(child)
        continue
      }
      text += source[index]
      index += 1
    }
    if (text) node.text += decodeXml(text)
    return node
  }

  skipPreamble()
  return readNode()
}

function findAll(node, name, out = []) {
  if (!node) return out
  if (node.name === name) out.push(node)
  for (const child of node.children || []) findAll(child, name, out)
  return out
}

function childText(node) {
  if (!node) return ''
  let text = node.text || ''
  for (const child of node.children || []) text += childText(child)
  return text
}

export function unzip(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
  let eocd = -1
  const min = Math.max(0, buf.length - 22 - 0xffff)
  for (let i = buf.length - 22; i >= min; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Spreadsheet export was not a valid xlsx file')

  const count = buf.readUInt16LE(eocd + 10)
  let cursor = buf.readUInt32LE(eocd + 16)
  const files = new Map()

  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error('Spreadsheet export has a broken zip directory')
    }
    const method = buf.readUInt16LE(cursor + 10)
    const compressedSize = buf.readUInt32LE(cursor + 20)
    const nameLength = buf.readUInt16LE(cursor + 28)
    const extraLength = buf.readUInt16LE(cursor + 30)
    const commentLength = buf.readUInt16LE(cursor + 32)
    const localOffset = buf.readUInt32LE(cursor + 42)
    const name = buf.slice(cursor + 46, cursor + 46 + nameLength).toString('utf8')
    cursor += 46 + nameLength + extraLength + commentLength

    if (buf.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Spreadsheet export is missing ${name}`)
    }
    const localNameLength = buf.readUInt16LE(localOffset + 26)
    const localExtraLength = buf.readUInt16LE(localOffset + 28)
    const start = localOffset + 30 + localNameLength + localExtraLength
    const compressed = buf.subarray(start, start + compressedSize)
    let bytes
    if (method === 0) bytes = compressed
    else if (method === 8) bytes = inflateRawSync(compressed)
    else throw new Error(`Unsupported compression in ${name}`)
    files.set(name, bytes)
  }

  return files
}

function columnIndex(letters) {
  let n = 0
  for (const char of letters) n = n * 26 + (char.charCodeAt(0) - 64)
  return n - 1
}

function cellRef(ref) {
  const match = String(ref || '').match(/^([A-Z]+)(\d+)$/)
  if (!match) return [0, 0]
  return [Number(match[2]) - 1, columnIndex(match[1])]
}

function applyTint(rgb, tint) {
  if (!rgb || rgb.length !== 6 || !tint) return rgb
  let out = ''
  for (let i = 0; i < 6; i += 2) {
    const channel = parseInt(rgb.slice(i, i + 2), 16)
    const value = tint < 0 ? channel * (1 + tint) : channel * (1 - tint) + 255 * tint
    out += Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
  }
  return out.toUpperCase()
}

function loadTheme(files) {
  const raw = files.get('xl/theme/theme1.xml')
  if (!raw) return []
  const root = parseXml(raw.toString('utf8'))
  const scheme = findAll(root, 'clrScheme')[0]
  if (!scheme) return []
  return (scheme.children || []).map((child) => {
    const srgb = findAll(child, 'srgbClr')[0]
    if (srgb?.attrs?.val) return String(srgb.attrs.val).toUpperCase()
    const sys = findAll(child, 'sysClr')[0]
    if (sys?.attrs?.lastClr) return String(sys.attrs.lastClr).toUpperCase()
    return '000000'
  })
}

function rgbFromFill(fill, theme) {
  const fg = findAll(fill, 'fgColor')[0]
  if (!fg) return null
  const rgb = fg.attrs?.rgb
  if (rgb && !SKIP_RGB.has(rgb) && rgb.length === 8) return `#${rgb.slice(2).toUpperCase()}`
  if (fg.attrs?.theme == null || !theme.length) return null
  const idx = Number(fg.attrs.theme)
  if (!Number.isFinite(idx) || idx >= theme.length) return null
  const tint = Number(fg.attrs.tint || 0)
  const hex = applyTint(theme[idx], tint)
  if (!hex || hex === 'FFFFFF' || hex === '000000') return null
  return `#${hex}`
}

function loadStyleFills(files, theme) {
  const root = parseXml(files.get('xl/styles.xml').toString('utf8'))
  const fills = findAll(root, 'fill').map((fill) => rgbFromFill(fill, theme))
  const cellXfs = findAll(root, 'cellXfs')[0]
  const xfs = (cellXfs?.children || []).filter((node) => node.name === 'xf')
  return { fills, xfs }
}

function loadSharedStrings(files) {
  const raw = files.get('xl/sharedStrings.xml')
  if (!raw) return []
  const root = parseXml(raw.toString('utf8'))
  return findAll(root, 'si').map((si) => childText(si))
}

function sheetTargets(files) {
  const workbook = parseXml(files.get('xl/workbook.xml').toString('utf8'))
  const rels = parseXml(files.get('xl/_rels/workbook.xml.rels').toString('utf8'))
  const relMap = new Map()
  for (const rel of findAll(rels, 'Relationship')) {
    relMap.set(rel.attrs.Id, rel.attrs.Target)
  }
  const out = []
  for (const sheet of findAll(workbook, 'sheet')) {
    if (sheet.attrs.state === 'hidden') continue
    const target = relMap.get(sheet.attrs.id)
    if (!target) continue
    const path = target.startsWith('xl/') ? target : `xl/${target.replace(/^\//, '')}`
    out.push({ name: sheet.attrs.name || '', path })
  }
  return out
}

function cellValue(cell, shared) {
  const inline = (cell.children || []).find((child) => child.name === 'is')
  if (inline) return childText(inline)
  const value = (cell.children || []).find((child) => child.name === 'v')
  if (!value) return ''
  const text = childText(value)
  if (cell.attrs.t === 's') return shared[Number(text)] || ''
  return text
}

function readSheet(bytes, shared, fills, xfs) {
  const root = parseXml(bytes.toString('utf8'))
  const sparse = new Map()
  let maxRow = 0
  let maxCol = 0
  for (const cell of findAll(root, 'c')) {
    const [row, col] = cellRef(cell.attrs.r)
    const style = Number(cell.attrs.s || 0)
    const fillId = Number(xfs[style]?.attrs?.fillId || 0)
    const color = fills[fillId] || null
    sparse.set(`${row},${col}`, { text: cellValue(cell, shared), color })
    if (row > maxRow) maxRow = row
    if (col > maxCol) maxCol = col
  }
  const rows = []
  for (let row = 0; row <= maxRow; row += 1) {
    const line = []
    for (let col = 0; col <= maxCol; col += 1) {
      line.push(sparse.get(`${row},${col}`) || { text: '', color: null })
    }
    rows.push(line)
  }
  return rows
}

export function readWorkbook(data) {
  const files = unzip(data)
  const theme = loadTheme(files)
  const { fills, xfs } = loadStyleFills(files, theme)
  const shared = loadSharedStrings(files)
  return sheetTargets(files).map((sheet) => ({
    name: sheet.name,
    rows: readSheet(files.get(sheet.path), shared, fills, xfs),
  }))
}
