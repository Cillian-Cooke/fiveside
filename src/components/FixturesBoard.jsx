import { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  BAY_TIMES,
  DAYS,
  DAY_LONG,
  DAY_SHORT,
  HALL_VENUES,
  TIME_SHORT,
  VENUE_LABEL,
} from '../constants.js'
import {
  baySlot,
  fixturesForDay,
  hallCellFixtures,
  isMatchVisible,
} from '../lib/fixtures.js'
import MatchCard from './MatchCard.jsx'
import Legend from './Legend.jsx'
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

export function RescheduledList({ games }) {
  if (!games?.length) return null
  return (
    <section className="rescheduled" aria-label="To be rescheduled">
      <h2 className="section-title">To be rescheduled</h2>
      <p className="lede">Catch-up games from the sheet that don’t have a slot yet.</p>
      {games.map((game) => (
        <MatchCard key={game.id} fixture={game} quiet />
      ))}
    </section>
  )
}

function DayDetails({ fixtures, day, query, league, searching, note }) {
  const slots = fixturesForDay(fixtures, day)
  const visible = slots.filter((fixture) => keepSlot(fixture, query, league, searching))
  const closed = !searching && slots.length > 0 && slots.every((slot) => slot.status === 'unavailable')
  const listed = searching ? visible : visible.filter((fixture) => fixture.status !== 'unavailable')
  const groups = groupByTime(listed)

  if (closed) {
    return (
      <article className="placeholder-card">
        <h2>{DAY_LONG[day]} is closed</h2>
        <p>{note || 'No matches this day.'}</p>
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
      {note ? <p className="day-note">{note}</p> : null}
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

function slotLabel(fixture, day) {
  const when = DAY_LONG[day]
  if (!fixture || fixture.status === 'unavailable') return `${when}, unavailable`
  if (fixture.status === 'free') return `${when}, free slot`
  return `${when}, ${fixture.home} versus ${fixture.away}`
}

function DayHeading({ day, selectedDay, todayName, onSelectDay }) {
  const selected = day === selectedDay
  return (
    <th className={selected ? 'is-on' : undefined}>
      <button
        type="button"
        className="day-col-btn"
        aria-pressed={selected}
        onClick={() => onSelectDay(day)}
      >
        <span className="day-short">{DAY_SHORT[day]}</span>
        <span className="day-long">{DAY_LONG[day]}</span>
        {day === todayName ? <small>Today</small> : null}
      </button>
    </th>
  )
}

function GridCell({ fixture, day, selectedDay, onSelectDay, query, league, searching }) {
  const selected = day === selectedDay
  const blank = slotIsBlank(fixture, query, league, searching)
  return (
    <td className={selected ? 'is-on' : undefined}>
      <button
        type="button"
        className="slot-select mobile-only"
        aria-pressed={selected}
        aria-label={slotLabel(fixture, day)}
        onClick={() => onSelectDay(day)}
      >
        <MatchCard fixture={fixture} compact plain blank={blank} />
      </button>
      <div className="desktop-only">
        <MatchCard fixture={fixture} compact blank={blank} />
      </div>
    </td>
  )
}

function DesktopGrid({ fixtures, query, league, searching, selectedDay, todayName, onSelectDay }) {
  return (
    <div className="fixture-grids">
      <div className="grid-wrap">
        <h2 className="grid-title">Botany Bay</h2>
        <table className="timetable">
          <thead>
            <tr>
              <th className="time-cell" />
              {DAYS.map((day) => (
                <DayHeading
                  key={day}
                  day={day}
                  selectedDay={selectedDay}
                  todayName={todayName}
                  onSelectDay={onSelectDay}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {BAY_TIMES.map((time) => (
              <tr key={time}>
                <th className="time-cell">{TIME_SHORT[time]}</th>
                {DAYS.map((day) => (
                  <GridCell
                    key={day}
                    fixture={baySlot(fixtures, day, time)}
                    day={day}
                    selectedDay={selectedDay}
                    onSelectDay={onSelectDay}
                    query={query}
                    league={league}
                    searching={searching}
                  />
                ))}
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
                <DayHeading
                  key={day}
                  day={day}
                  selectedDay={selectedDay}
                  todayName={todayName}
                  onSelectDay={onSelectDay}
                />
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
                  const halls = hallCellFixtures(fixtures, day, venue)
                  return (
                    <td key={day} className={day === selectedDay ? 'is-on' : undefined}>
                      {halls.map((hall) => (
                        <span key={hall.id} className="hall-slot">
                          <button
                            type="button"
                            className="slot-select mobile-only"
                            aria-pressed={day === selectedDay}
                            aria-label={slotLabel(hall, day)}
                            onClick={() => onSelectDay(day)}
                          >
                            <MatchCard
                              fixture={hall}
                              compact
                              plain
                              blank={slotIsBlank(hall, query, league, searching)}
                            />
                          </button>
                          <span className="desktop-only">
                            <MatchCard
                              fixture={hall}
                              compact
                              blank={slotIsBlank(hall, query, league, searching)}
                            />
                          </span>
                        </span>
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
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.15) return
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
  fixtures,
  rescheduled = [],
  dayNotes = {},
  showLeagueFilters = false,
  searchPlaceholder = 'Search a team or division…',
  weekId,
  initialDay = 'monday',
  todayName = null,
  onPrevWeek,
  onNextWeek,
  rescheduledOnly = false,
}) {
  const location = useLocation()
  const snap = readSnapshot(location.key)
  const [day, setDay] = useState(DAYS.includes(snap?.day) ? snap.day : initialDay)
  const [query, setQuery] = useState(snap?.query ?? '')
  const [league, setLeague] = useState(snap?.league ?? 'all')
  const searching = query.trim().length > 0 || league !== 'all'
  const swipe = useWeekSwipe(onPrevWeek, onNextWeek)
  const visibleRescheduled = searching
    ? rescheduled.filter((game) => isMatchVisible(game, query, league))
    : rescheduled
  const playedWithoutSlot = (fixtures || []).filter((fixture) => {
    if (!fixture.resultOnly) return false
    if (!searching) return true
    return isMatchVisible(fixture, query, league)
  })

  useStackPage({ day, query, league, weekId }, true)

  if (rescheduledOnly) return <RescheduledList games={rescheduled} />

  return (
    <>
      <SearchBar value={query} onChange={setQuery} placeholder={searchPlaceholder} />
      {showLeagueFilters ? <LeagueFilters value={league} onChange={setLeague} /> : null}

      <div className="day-notes">
        {Object.entries(dayNotes).map(([name, note]) => (
          <p className="day-note" key={name}>
            {DAY_LONG[name]}: {note}
          </p>
        ))}
      </div>

      <DesktopGrid
        fixtures={fixtures}
        query={query}
        league={league}
        searching={searching}
        selectedDay={day}
        todayName={todayName}
        onSelectDay={setDay}
      />

      <div {...swipe}>
        <div className="mobile-only day-details" aria-label={DAY_LONG[day]}>
          <DayDetails
            fixtures={fixtures}
            day={day}
            query={query}
            league={league}
            searching={searching}
            note={dayNotes[day]}
          />
        </div>
      </div>

      {playedWithoutSlot.length ? (
        <section className="rescheduled" aria-label="Played, not on the timetable">
          <h2 className="section-title">Played, not on the timetable</h2>
          <p className="lede">These results are in, and this week’s grid has no slot for them.</p>
          {playedWithoutSlot.map((fixture) => (
            <MatchCard key={fixture.id} fixture={fixture} />
          ))}
        </section>
      ) : null}

      {searching ? (
        <div className="desktop-only">
          <RescheduledList games={visibleRescheduled} />
        </div>
      ) : (
        <RescheduledList games={rescheduled} />
      )}
      <Legend />
    </>
  )
}
