import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  BAY_TIMES,
  DAYS,
  DAY_LONG,
  HALL_VENUES,
  TIME_SHORT,
  VENUE_LABEL,
} from '../constants.js'
import {
  baySlot,
  fixturesForDay,
  hallSlot,
  isMatchVisible,
} from '../lib/fixtures.js'
import MatchCard from './MatchCard.jsx'
import Legend from './Legend.jsx'
import WeekCalendar from './WeekCalendar.jsx'
import SearchBar from './SearchBar.jsx'
import LeagueFilters from './LeagueFilters.jsx'
import { readSnapshot, useStackPage } from '../lib/navStack.js'

function groupByTime(fixtures) {
  const groups = []
  for (const time of BAY_TIMES) {
    const slots = fixtures.filter((fixture) => fixture.time === time)
    if (slots.length) groups.push({ time, slots })
  }
  return groups
}

function keepSlot(fixture, query, league, searching) {
  if (!fixture) return false
  if (fixture.status === 'free') return true
  if (!searching) return true
  if (fixture.status === 'unavailable') return true
  return isMatchVisible(fixture, query, league)
}

function DayDetails({ fixtures, day, query, league, searching }) {
  const slots = fixturesForDay(fixtures, day)
  const visible = slots.filter((fixture) => keepSlot(fixture, query, league, searching))
  const groups = groupByTime(visible)
  const closed = !searching && slots.length > 0 && slots.every((slot) => slot.status === 'unavailable')

  if (closed) {
    return (
      <article className="placeholder-card">
        <h2>{DAY_LONG[day]} is closed</h2>
        <p>No matches this day.</p>
      </article>
    )
  }

  if (searching && !visible.length) {
    return (
      <article className="placeholder-card">
        <h2>No matches</h2>
        <p>Nothing on {DAY_LONG[day]} for that search.</p>
      </article>
    )
  }

  return (
    <>
      <h2 className="details-title">{DAY_LONG[day]}</h2>
      {groups.map((group) => (
        <section className="slot-group" key={group.time}>
          <h3 className="slot-time">{group.time}</h3>
          {group.slots.map((fixture) => (
            <MatchCard key={fixture.id} fixture={fixture} />
          ))}
        </section>
      ))}
    </>
  )
}

function DesktopGrid({ fixtures, query, league, searching }) {
  return (
    <div className="desktop-only">
      <div className="grid-wrap">
        <table className="timetable">
          <thead>
            <tr>
              <th className="time-cell" />
              {DAYS.map((day) => (
                <th key={day}>{DAY_LONG[day]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BAY_TIMES.map((time) => (
              <tr key={time}>
                <th className="time-cell">{TIME_SHORT[time]}</th>
                {DAYS.map((day) => {
                  const bay = baySlot(fixtures, day, time)
                  const shown = [bay].filter((fixture) =>
                    keepSlot(fixture, query, league, searching),
                  )
                  return (
                    <td key={day}>
                      {shown.map((fixture) => (
                        <MatchCard key={fixture.id} fixture={fixture} compact />
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-wrap">
        <table className="timetable">
          <thead>
            <tr>
              <th className="time-cell" />
              {DAYS.map((day) => (
                <th key={day}>{DAY_LONG[day]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HALL_VENUES.map((venue) => (
              <tr key={venue}>
                <th className="time-cell">{VENUE_LABEL[venue].replace('Hall ', '')}</th>
                {DAYS.map((day) => {
                  const hall = hallSlot(fixtures, day, venue)
                  const shown = keepSlot(hall, query, league, searching) ? [hall] : []
                  return (
                    <td key={day}>
                      {shown.map((fixture) => (
                        <MatchCard key={fixture.id} fixture={fixture} compact />
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function FixturesBoard({
  title = 'Current week',
  rangeLabel,
  fixtures,
  showLeagueFilters = false,
  searchPlaceholder,
}) {
  const location = useLocation()
  const snap = readSnapshot(location.key)
  const todayIndex = useMemo(() => {
    const weekday = new Date().getDay()
    if (weekday >= 1 && weekday <= 5) return weekday - 1
    return 0
  }, [])
  const [day, setDay] = useState(
    DAYS.includes(snap?.day) ? snap.day : (DAYS[todayIndex] ?? 'monday'),
  )
  const [query, setQuery] = useState(snap?.query ?? '')
  const [league, setLeague] = useState(snap?.league ?? 'all')
  const searching = query.trim().length > 0 || league !== 'all'

  useStackPage({ day, query, league }, true)

  return (
    <>
      <h1 className="page-title">{title}</h1>
      {rangeLabel ? <p className="week-range">{rangeLabel}</p> : null}

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={searchPlaceholder}
      />
      {showLeagueFilters ? (
        <LeagueFilters value={league} onChange={setLeague} />
      ) : null}

      <WeekCalendar
        fixtures={fixtures}
        selectedDay={day}
        onSelectDay={setDay}
        query={query}
        league={league}
      />

      <div className="mobile-only day-details">
        <DayDetails
          fixtures={fixtures}
          day={day}
          query={query}
          league={league}
          searching={searching}
        />
      </div>

      <DesktopGrid
        fixtures={fixtures}
        query={query}
        league={league}
        searching={searching}
      />
      <Legend />
    </>
  )
}
