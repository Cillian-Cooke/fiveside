import React from 'react'
import { BAY_TIMES, DAY_SHORT, DAYS, TIME_SHORT } from '../constants.js'
import { baySlot, canonicalMatchColor, contrastText } from './fixtures.js'
import { ogTeamLabel } from './share-meta.js'

const W = 1200
const H = 630

function cellStyle(background, color) {
  return {
    width: 214,
    height: 48,
    marginRight: 6,
    borderRadius: 4,
    background,
    color,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 1.05,
  }
}

function MatchCell({ fixture }) {
  if (!fixture || fixture.status === 'unavailable') {
    return React.createElement('div', { style: cellStyle('#3d3d3d', '#f3f3f2') })
  }
  if (fixture.status !== 'match') {
    return React.createElement(
      'div',
      { style: cellStyle('#ffffff', '#5a5e63') },
      React.createElement('div', { style: { fontSize: 16, fontWeight: 700 } }, 'Free'),
    )
  }
  const background = canonicalMatchColor(fixture)
  const color = contrastText(background)
  const home = ogTeamLabel(fixture.home)
  const away = ogTeamLabel(fixture.away)
  const size = home.length > 14 || away.length > 14 ? 13 : 15
  return React.createElement(
    'div',
    { style: cellStyle(background, color) },
    React.createElement('div', { style: { fontSize: size, fontWeight: 700 } }, home),
    React.createElement('div', { style: { fontSize: 11, fontWeight: 700, opacity: 0.72 } }, 'v'),
    React.createElement('div', { style: { fontSize: size, fontWeight: 700 } }, away),
  )
}

function TimeLabel({ time }) {
  return React.createElement(
    'div',
    {
      style: {
        width: 58,
        height: 48,
        marginRight: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        color: '#5a5e63',
        fontSize: 15,
        fontWeight: 700,
      },
    },
    String(TIME_SHORT[time] || time).replace('–', '-'),
  )
}

export function ogCard(entry) {
  const label = entry?.week?.pickerLabel || 'This week'
  const rows = BAY_TIMES.map((time) =>
    React.createElement(
      'div',
      {
        key: time,
        style: { display: 'flex', flexDirection: 'row', marginBottom: 4 },
      },
      React.createElement(TimeLabel, { time }),
      ...DAYS.map((day) =>
        React.createElement(MatchCell, {
          key: day,
          fixture: baySlot(entry?.fixtures, day, time),
        }),
      ),
    ),
  )

  return React.createElement(
    'div',
    {
      style: {
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        background: '#f6f6f5',
        padding: 16,
        fontFamily: 'Sora',
      },
    },
    React.createElement(
      'div',
      {
        style: {
          height: 72,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#33363b',
          color: '#ffffff',
          borderRadius: 6,
          borderTop: '4px solid #005aa8',
          padding: '0 20px',
          marginBottom: 10,
        },
      },
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        React.createElement(
          'div',
          { style: { fontSize: 28, fontWeight: 700, letterSpacing: 1 } },
          'TCD 5-A-SIDE',
        ),
        React.createElement(
          'div',
          { style: { fontSize: 18, fontWeight: 700, color: '#d7d8d6' } },
          'Botany Bay',
        ),
      ),
      React.createElement(
        'div',
        { style: { fontSize: 26, fontWeight: 700 } },
        label,
      ),
    ),
    React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'row', marginBottom: 4 } },
      React.createElement('div', { style: { width: 64 } }),
      ...DAYS.map((day) =>
        React.createElement(
          'div',
          {
            key: day,
            style: {
              width: 214,
              marginRight: 6,
              textAlign: 'center',
              color: '#2c3034',
              fontSize: 16,
              fontWeight: 700,
            },
          },
          DAY_SHORT[day],
        ),
      ),
    ),
    ...rows,
  )
}
