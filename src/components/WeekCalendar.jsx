import {
  BAY_TIMES,
  DAYS,
  DAY_SHORT,
  HALL_VENUES,
  TIME_SHORT,
  VENUE_LABEL,
} from '../constants.js'
import { baySlot, hallSlot, slotFill } from '../lib/fixtures.js'

function Cell({ fixture, selected, onSelect, query, league }) {
  const fill = slotFill(fixture, query, league)
  const booked = fixture?.status === 'match'
  const isFree = fixture?.status === 'free'

  return (
    <button
      type="button"
      className={selected ? 'cal-cell is-on' : 'cal-cell'}
      style={{ background: fill, color: isFree ? '#5a6573' : undefined }}
      aria-pressed={selected}
      aria-label={
        booked
          ? `${fixture.home} versus ${fixture.away}`
          : isFree
            ? 'Free slot'
            : 'Unavailable'
      }
      onClick={onSelect}
    >
      {isFree ? 'Free' : null}
    </button>
  )
}

export default function WeekCalendar({
  fixtures,
  selectedDay,
  onSelectDay,
  query = '',
  league = 'all',
}) {
  return (
    <div className="mobile-only">
      <section className="cal-block">
        <div className="cal-grid">
          <div className="cal-time" aria-hidden="true" />
          {DAYS.map((day) => (
            <button
              key={`bay-h-${day}`}
              type="button"
              className={day === selectedDay ? 'cal-head is-on' : 'cal-head'}
              onClick={() => onSelectDay(day)}
            >
              {DAY_SHORT[day]}
            </button>
          ))}
          {BAY_TIMES.map((time) => (
            <div key={time} className="cal-contents">
              <div className="cal-time">{TIME_SHORT[time]}</div>
              {DAYS.map((day) => (
                <Cell
                  key={day}
                  fixture={baySlot(fixtures, day, time)}
                  selected={day === selectedDay}
                  onSelect={() => onSelectDay(day)}
                  query={query}
                  league={league}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="cal-block">
        <div className="cal-grid">
          <div className="cal-time" aria-hidden="true" />
          {DAYS.map((day) => (
            <button
              key={`hall-h-${day}`}
              type="button"
              className={day === selectedDay ? 'cal-head is-on' : 'cal-head'}
              onClick={() => onSelectDay(day)}
            >
              {DAY_SHORT[day]}
            </button>
          ))}
          {HALL_VENUES.map((venue) => (
            <div key={venue} className="cal-contents">
              <div className="cal-time">{VENUE_LABEL[venue].replace('Hall ', '')}</div>
              {DAYS.map((day) => (
                <Cell
                  key={day}
                  fixture={hallSlot(fixtures, day, venue)}
                  selected={day === selectedDay}
                  onSelect={() => onSelectDay(day)}
                  query={query}
                  league={league}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
