import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { crc32 } from 'node:zlib'
import { clearFixturesCache } from '../src/lib/live-fixtures.js'
import { loadPublishedSchedule } from '../src/lib/live-schedule.js'
import {
  RESULTS_GID,
  RESULTS_SHEET_ID,
  clearResultsCache,
  loadLiveResults,
  parseResultsCsv,
  parseResultsWorkbook,
} from '../src/lib/live-results.js'
import { buildLeagueTables } from '../src/lib/fixtures.js'
import { overlayMatchScores } from '../src/lib/match-results.js'
import { decorateWeeks } from '../src/lib/schedule.js'
import { readWorkbook } from '../src/lib/xlsx.js'

function u16(n) {
  const buf = Buffer.alloc(2)
  buf.writeUInt16LE(n)
  return buf
}

function u32(n) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32LE(n >>> 0)
  return buf
}

function zipFiles(files) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(file.name)
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data)
    const crc = crc32(data) >>> 0
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ])
    locals.push(local)
    centrals.push(Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]))
    offset += local.length
  }
  const centralDir = Buffer.concat(centrals)
  const eocd = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ])
  return Buffer.concat([...locals, centralDir, eocd])
}

function xml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function colName(index) {
  let n = index + 1
  let out = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    out = String.fromCharCode(65 + rem) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

function sheetXml(rows) {
  const body = rows.map((row, r) => {
    const cells = row.map((value, c) => {
      if (value == null || value === '') return ''
      const ref = `${colName(c)}${r + 1}`
      if (typeof value === 'object') return `<c r="${ref}"><v>${xml(value.number)}</v></c>`
      return `<c r="${ref}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`
    }).join('')
    return `<row r="${r + 1}">${cells}</row>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`
}

function workbook(sheets) {
  const styles = `<?xml version="1.0" encoding="UTF-8"?><styleSheet><fills count="1"><fill><patternFill patternType="none"/></fill></fills><cellXfs count="1"><xf fillId="0"/></cellXfs></styleSheet>`
  const sheetXmls = sheets.map((sheet, index) => ({
    name: `xl/worksheets/sheet${index + 1}.xml`,
    data: sheetXml(sheet.rows),
  }))
  const workbookXml = `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, index) => `<sheet name="${xml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}</sheets></workbook>`
  const rels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')}</Relationships>`
  return zipFiles([
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', data: rels },
    { name: 'xl/styles.xml', data: styles },
    ...sheetXmls,
  ])
}

const HEADER = ['weekStartsOn', 'playedOn', 'division', 'home', 'away', 'homeScore', 'awayScore', 'fixtureMatched', 'sourceNote', 'unresolved', 'chatSnippet']

function resultsWorkbook() {
  return workbook([
    {
      name: 'Unresolved',
      rows: [
        ['weekStartsOn', 'home', 'away', 'homeScore', 'awayScore'],
        ['2026-09-28', 'Egg Fried Reus', 'Barely Athletic FC', { number: '12' }, { number: '10' }],
      ],
    },
    {
      name: 'Instructions',
      rows: [['Who can edit'], ['not a score row']],
    },
    {
      name: 'Results',
      rows: [
        HEADER,
        ['2026-09-28', '2026-09-29', 'Division 1', 'Pavillionaires', 'Integer Milan', { number: '4.0' }, { number: '7.0' }, 'yes (Week 1 28th)', 'chat 29/09/2026', '', 'ignored snippet'],
        [{ number: '46293' }, '', 'Division 1', 'Mountjoy FC', 'Eng ballers', { number: '7' }, { number: '13' }, '', '', '', ''],
        ['2026-10-05', '', 'Division 2', 'Missing Score FC', 'Other', '', { number: '3' }, '', '', '', ''],
        ['2026-10-05', '', '', '', '', { number: '1' }, { number: '1' }, '', '', '', ''],
        ['28/09/2026', '1/10/2026', 'Division 5', 'Iteam', 'Carling F.C.', { number: '0' }, { number: '6' }, '', '', '', ''],
      ],
    },
  ])
}

const leagueBytes = readFileSync(new URL('./fixtures/league.xlsx', import.meta.url))

function sheetResponse(url) {
  const href = String(url)
  const body = href.includes(RESULTS_SHEET_ID) ? resultsWorkbook() : leagueBytes
  return new Response(body)
}

test('Results xlsx keeps score rows and ignores Unresolved', () => {
  assert.equal(RESULTS_GID, '1')
  const results = parseResultsWorkbook(readWorkbook(resultsWorkbook()))
  assert.equal(results.length, 3)
  assert.deepEqual(results[0], {
    weekStartsOn: '2026-09-28',
    playedOn: '2026-09-29',
    division: 'Division 1',
    home: 'Pavillionaires',
    away: 'Integer Milan',
    homeScore: 4,
    awayScore: 7,
    fixtureMatched: 'yes (Week 1 28th)',
    sourceNote: 'chat 29/09/2026',
  })
  assert.equal(typeof results[0].homeScore, 'number')
  assert.equal(results[1].weekStartsOn, '2026-09-28')
  assert.equal(results[1].home, 'Mountjoy FC')
  assert.equal(results[1].playedOn, undefined)
  assert.equal(results[2].weekStartsOn, '2026-09-28')
  assert.equal(results[2].playedOn, '2026-10-01')
  assert.equal(results[2].homeScore, 0)
  assert.equal(results.some((row) => row.home === 'Egg Fried Reus'), false)
  assert.equal(results.some((row) => row.home === 'Missing Score FC'), false)
  assert.equal('chatSnippet' in results[0], false)
})

test('Results csv keeps quoted snippets from shifting columns', () => {
  const csv = [
    'weekStartsOn,playedOn,division,home,away,homeScore,awayScore,fixtureMatched,sourceNote,unresolved,chatSnippet',
    '2026-10-26,2026-10-27,Division 5,Iteam,Carling F.C.,8,8,yes,,,"8-8, ""after extra time"""',
    '2026-10-26,2026-10-27,Division 5,Ghost,Team,,4,,,,',
    '2026-10-19,2026-10-20,Division 1,Barely Athletic FC,Engibeering,5,10,yes,,, "line one',
    'line two"',
  ].join('\n')
  const results = parseResultsCsv(csv)
  assert.equal(results.length, 2)
  assert.equal(results[0].home, 'Iteam')
  assert.equal(results[0].away, 'Carling F.C.')
  assert.equal(results[0].homeScore, 8)
  assert.equal(results[0].awayScore, 8)
  assert.equal(results[1].home, 'Barely Athletic FC')
  assert.equal(results[1].awayScore, 10)
  assert.equal(results.some((row) => row.home === 'Ghost'), false)
})

test('a match posted twice in one week counts once', () => {
  const warnings = []
  const originalWarn = console.warn
  console.warn = (...args) => warnings.push(args.join(' '))
  let rows
  let conflict
  try {
    rows = parseResultsCsv([
      'weekStartsOn,home,away,homeScore,awayScore',
      '2026-10-26,Iteam,Carling F.C.,8,3',
      '2026-10-26,Iteam,Carling F.C.,8,3',
      '2026-10-26,Carling F.C.,Iteam,3,8',
      '2026-11-02,Iteam,Carling F.C.,2,1',
    ].join('\n'))
    conflict = parseResultsCsv([
      'weekStartsOn,home,away,homeScore,awayScore',
      '2026-10-26,Iteam,Carling F.C.,8,3',
      '2026-10-26,Carling F.C.,Iteam,9,1',
    ].join('\n'))
  } finally {
    console.warn = originalWarn
  }

  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /keeping 8-3/)
  assert.match(warnings[0], /ignoring Carling F\.C\. 9-1 Iteam/)
  assert.equal(rows.length, 2)
  assert.deepEqual(
    rows.map((row) => [row.weekStartsOn, row.home, row.away, row.homeScore, row.awayScore]),
    [
      ['2026-10-26', 'Iteam', 'Carling F.C.', 8, 3],
      ['2026-11-02', 'Iteam', 'Carling F.C.', 2, 1],
    ],
  )
  assert.equal(conflict.length, 1)
  assert.equal(conflict[0].homeScore, 8)
  assert.equal(conflict[0].awayScore, 3)

  const fixtures = [
    { status: 'match', weekId: '2026-10-26', home: 'Iteam', away: 'Carling F.C.', division: 'Division 5', color: '#A4C2F4' },
    { status: 'match', weekId: '2026-11-02', home: 'Carling F.C.', away: 'Iteam', division: 'Division 5', color: '#A4C2F4' },
  ]
  const overlaid = overlayMatchScores(fixtures, rows)
  const scored = overlaid.filter((fixture) => typeof fixture.homeScore === 'number')
  assert.equal(scored.length, 2)
  assert.equal(scored[0].homeScore, 8)
  assert.equal(scored[0].awayScore, 3)
  assert.equal(scored[1].homeScore, 1)
  assert.equal(scored[1].awayScore, 2)

  const iteam = buildLeagueTables(overlaid).get('Division 5').find((row) => row.name === 'Iteam')
  assert.equal(iteam.played, 2)
  assert.equal(iteam.gf, 10)
  assert.equal(iteam.ga, 4)
  assert.equal(iteam.points, 6)
})

test('baked scores still apply, and live rows replace them', () => {
  const baked = overlayMatchScores([
    { status: 'match', weekId: '2026-09-28', home: 'CSB FC', away: 'Sools fc' },
  ])
  assert.equal(baked[0].homeScore, 7)
  assert.equal(baked[0].awayScore, 9)

  const live = overlayMatchScores(
    [
      { status: 'match', weekId: '2026-10-26', home: 'Iteam', away: 'Carling F.C.', division: 'Division 5', color: '#A4C2F4' },
      { status: 'match', weekId: '2026-09-28', home: 'CSB FC', away: 'Sools fc' },
    ],
    [
      { weekStartsOn: '2026-10-26', home: 'Carling F.C.', away: 'Iteam', homeScore: 3, awayScore: 8 },
      { weekStartsOn: '2026-10-26', home: 'Shabadoo', away: 'MAMAs Revenge', homeScore: 1, awayScore: 2 },
    ],
  )
  assert.equal(live[0].homeScore, 8)
  assert.equal(live[0].awayScore, 3)
  assert.equal(live[1].homeScore, undefined)
  const extra = live.find((fixture) => fixture.resultOnly)
  assert.equal(extra.home, 'Shabadoo')
  assert.equal(extra.homeScore, 1)
  assert.equal(live.some((fixture) => fixture.home === 'CSB FC' && fixture.resultOnly), false)
})

test('decorateWeeks stamps payload results onto the week', () => {
  const without = decorateWeeks({
    weeks: [{
      startsOn: '2026-10-26',
      weekNumber: null,
      reading: true,
      tab: 'READING WEEK',
      matches: [{
        day: 'tuesday',
        time: '9-10am',
        venue: 'botany_bay',
        home: 'Iteam',
        away: 'Carling F.C.',
        division: 'Division 5',
        color: '#A4C2F4',
      }],
    }],
  }, new Date('2026-10-26T12:00:00Z'))
  const bare = without.weeks[0].fixtures.find((fixture) => fixture.home === 'Iteam')
  assert.equal(bare.homeScore, undefined)

  const view = decorateWeeks({
    weeks: [{
      startsOn: '2026-10-26',
      weekNumber: null,
      reading: true,
      tab: 'READING WEEK',
      matches: [{
        day: 'tuesday',
        time: '9-10am',
        venue: 'botany_bay',
        home: 'Iteam',
        away: 'Carling F.C.',
        division: 'Division 5',
        color: '#A4C2F4',
      }],
    }],
    results: [
      { weekStartsOn: '2026-10-26', home: 'Iteam', away: 'Carling F.C.', homeScore: 8, awayScore: 8 },
    ],
  }, new Date('2026-10-26T12:00:00Z'))
  const match = view.weeks[0].fixtures.find((fixture) => fixture.home === 'Iteam' && fixture.away === 'Carling F.C.')
  assert.equal(match.homeScore, 8)
  assert.equal(match.awayScore, 8)
})

test('live results are cached, and a results failure still returns fixtures', async () => {
  clearFixturesCache()
  clearResultsCache()
  let resultFetches = 0
  const fetchImpl = (url) => {
    if (String(url).includes(RESULTS_SHEET_ID)) resultFetches += 1
    return Promise.resolve(sheetResponse(url))
  }
  const first = await loadLiveResults({ fetchImpl, now: new Date(0) })
  const second = await loadLiveResults({ fetchImpl, now: new Date(30_000) })
  assert.equal(resultFetches, 1)
  assert.equal(second.results.length, first.results.length)
  await loadLiveResults({ fetchImpl, now: new Date(61_000) })
  assert.equal(resultFetches, 2)

  clearFixturesCache()
  clearResultsCache()
  const published = await loadPublishedSchedule({
    fetchImpl,
    now: new Date('2026-10-30T12:00:00Z'),
  })
  assert.ok(published.weeks.length > 0)
  assert.equal(published.results.length, 3)
  assert.equal(published.results.some((row) => /edit/i.test(JSON.stringify(row))), false)

  clearFixturesCache()
  clearResultsCache()
  const failed = await loadPublishedSchedule({
    fetchImpl: (url) => {
      if (String(url).includes(RESULTS_SHEET_ID)) return Promise.resolve(new Response('nope', { status: 403 }))
      return Promise.resolve(sheetResponse(url))
    },
    now: new Date('2026-10-30T12:00:00Z'),
  })
  assert.ok(failed.weeks.length > 0)
  assert.equal(Object.hasOwn(failed, 'results'), false)
})

test('a hanging or non-xlsx results export is rejected and not cached', async () => {
  clearResultsCache()
  const keepAlive = setInterval(() => {}, 1000)
  try {
    await assert.rejects(
      loadLiveResults({
        timeoutMs: 40,
        now: new Date(0),
        fetchImpl: (_url, init) =>
          new Promise((_resolve, reject) => {
            const fail = () => reject(init.signal.reason || new Error('aborted'))
            if (init.signal.aborted) {
              fail()
              return
            }
            init.signal.addEventListener('abort', fail, { once: true })
          }),
      }),
    )
  } finally {
    clearInterval(keepAlive)
  }

  clearResultsCache()
  await assert.rejects(
    loadLiveResults({
      now: new Date(0),
      fetchImpl: async () => new Response('<html>Sign in</html>'),
    }),
    /xlsx/,
  )

  const calls = { n: 0 }
  const fetchImpl = () => {
    calls.n += 1
    return Promise.resolve(new Response(resultsWorkbook()))
  }
  const loaded = await loadLiveResults({ fetchImpl, now: new Date(10_000) })
  assert.equal(calls.n, 1)
  assert.equal(loaded.results.length, 3)
})
