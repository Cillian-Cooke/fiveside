import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decorateWeeks } from '../src/lib/schedule.js'
import {
  applyShareDocument,
  ogTeamLabel,
  sharePreview,
  weekIdFromPath,
} from '../src/lib/share-meta.js'

function payload() {
  return {
    weeks: [
      {
        startsOn: '2026-10-26',
        weekNumber: null,
        reading: true,
        tab: 'Reading week',
        matches: [],
        rescheduled: [],
      },
      {
        startsOn: '2026-11-02',
        weekNumber: 5,
        reading: false,
        tab: 'Week 5',
        matches: [
          {
            day: 'tuesday',
            time: '11-12pm',
            venue: 'botany_bay',
            home: 'Shabadoo Balompié Calcio',
            away: 'Carling F.C.',
            division: 'Division 5',
            color: '#A4C2F4',
          },
          {
            day: 'wednesday',
            time: '4-5pm',
            venue: 'hall_a',
            home: 'Iteam',
            away: 'Carling F.C.',
            division: 'Division 5',
            color: '#A4C2F4',
          },
        ],
        rescheduled: [],
      },
    ],
    legend: { 'Division 5': '#A4C2F4' },
    teams: {},
  }
}

test('a shared week link points at that week’s Botany Bay card', () => {
  const schedule = decorateWeeks(payload(), new Date('2026-11-03T12:00:00Z'))
  const preview = sharePreview(schedule, '/week/5')
  assert.equal(preview.weekId, '5')
  assert.equal(preview.imagePath, '/api/og?week=5')
  assert.match(preview.title, /Week 5/)
  assert.match(preview.description, /Botany Bay/)
  assert.match(preview.description, /1 game/)
  assert.equal(weekIdFromPath('/week/5'), '5')
  assert.equal(weekIdFromPath('/tables'), null)
})

test('the homepage card is the open week', () => {
  const schedule = decorateWeeks(payload(), new Date('2026-11-03T12:00:00Z'))
  const preview = sharePreview(schedule, '/')
  assert.equal(preview.weekId, '5')
})

test('long names on the share image use the short label', () => {
  assert.equal(ogTeamLabel('Carling F.C.'), 'Carling F.C.')
  assert.notEqual(ogTeamLabel('Shabadoo Balompié Calcio'), 'Shabadoo Balompié Calcio')
})

test('preview tags replace the share block and name the image', () => {
  const html = `<head>
    <title>Old</title>
    <!-- share-meta:start -->
    <title>Old</title>
    <meta property="og:image" content="https://example.com/old.png" />
    <!-- share-meta:end -->
  </head>`
  const next = applyShareDocument(
    html,
    {
      title: 'Week 5 — TCD',
      description: 'Botany Bay fixtures',
      imageAlt: 'Botany Bay fixtures for Week 5',
      imagePath: '/api/og?week=5',
    },
    'https://fiveside.vercel.app/week/5',
    'https://fiveside.vercel.app',
  )
  assert.match(next, /property="og:image" content="https:\/\/fiveside\.vercel\.app\/api\/og\?week=5"/)
  assert.match(next, /summary_large_image/)
  assert.match(next, /og:image:width" content="1200"/)
  assert.equal((next.match(/<title>/g) || []).length, 1)
})
