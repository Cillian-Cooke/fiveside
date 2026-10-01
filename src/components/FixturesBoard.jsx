import { useMemo, useRef, useState } from 'react'
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

function slotIsBlank(fixture, query, league, searching) {
  if (!searching) return false
  if (!fixture || fixture.status !== 'match') return false
  return !isMatchVisible(fixture, query, league)
}

function DesktopGrid({ fixtures, query, league, searching }) {
  return (
    <div className="desktop-only">
      <div className="grid-wrap">
        <h2 className="grid-title">Botany Bay</h2>
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
                  return (
                    <td key={day}>
                      <MatchCard
                        fixture={bay}
                        compact
                        blank={slotIsBlank(bay, query, league, searching)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-wrap">
        <h2 className="grid-title">Hall</h2>
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
                <th className="time-cell hall-time-cell">
                  <span>{VENUE_LABEL[venue].replace('Hall ', '')}</span>
                  <small>{TIME_SHORT['12-1pm']}</small>
                </th>
                {DAYS.map((day) => {
                  const hall = hallSlot(fixtures, day, venue)
                  return (
                    <td key={day}>
                      <MatchCard
                        fixture={hall}
                        compact
                        blank={slotIsBlank(hall, query, league, searching)}
                      />
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

function useWeekSwipe(onPrev, onNext) {
  const origin = useRef(null)
  const swiping = useRef(false)
  const suppressClick = useRef(false)

  return {
    onPointerDown(event) {
      if (window.matchMedia('(min-width: 960px)').matches) return
      origin.current = { x: event.clientX, y: event.clientY }
      swiping.current = false
    },
    onPointerMove(event) {
      if (!origin.current) return
      const dx = event.clientX - origin.current.x
      const dy = event.clientY - origin.current.y
      if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
        swiping.current = true
      }
    },
    onPointerUp(event) {
      if (!origin.current) return
      const dx = event.clientX - origin.current.x
      const dy = event.clientY - origin.current.y
      origin.current = null
      if (!swiping.current) return
      swiping.current = false
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.15) return
      suppressClick.current = true
      if (dx < 0) onNext?.()
      else onPrev?.()
    },
    onPointerCancel() {
      origin.current = null
      swiping.current = false
    },
    onClickCapture(event) {
      if (!suppressClick.current) return
      event.preventDefault()
      event.stopPropagation()
      suppressClick.current = false
    },
  }
}

export default function FixturesBoard({
  title = 'Current week',
  rangeLabel,
  fixtures,
  showLeagueFilters = false,
  searchPlaceholder,
  weekId,
  onPrevWeek,
  onNextWeek,
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
  const swipe = useWeekSwipe(onPrevWeek, onNextWeek)
  const canPage = Boolean(onPrevWeek && onNextWeek)

  useStackPage({ day, query, league, weekId }, true)

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

      <div className="week-stage">
        {canPage ? (
          <button
            type="button"
            className="week-arrow week-arrow-prev desktop-only"
            aria-label="Previous week"
            onClick={onPrevWeek}
          >
            ‹
          </button>
        ) : null}

        <div className="week-stage-main" {...(canPage ? swipe : {})}>
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
        </div>

        {canPage ? (
          <button
            type="button"
            className="week-arrow week-arrow-next desktop-only"
            aria-label="Next week"
            onClick={onNextWeek}
          >
            ›
          </button>
        ) : null}
      </div>
      <Legend />
    </>
  )
}
