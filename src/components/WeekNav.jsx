import { Link } from 'react-router-dom'
import { weekPath } from '../lib/schedule.js'

export default function WeekNav({ weeks, entry, openWeek, onSelect }) {
  const index = weeks.findIndex((item) => item.week.routeId === entry.week.routeId)
  const prev = index > 0 ? weeks[index - 1] : null
  const next = index >= 0 && index < weeks.length - 1 ? weeks[index + 1] : null
  const away = openWeek && entry.week.routeId !== openWeek.routeId

  return (
    <div className="week-nav-wrap">
      <div className="week-nav">
        <button
          type="button"
          className="week-nav-btn"
          aria-label="Previous week"
          disabled={!prev}
          onClick={() => prev && onSelect(prev.week.routeId)}
        >
          ‹
        </button>
        <h1 className="week-select-title">
          <label>
            <span className="visually-hidden">Choose a week</span>
            <select
              aria-label="Choose a week"
              value={entry.week.routeId}
              onChange={(event) => onSelect(event.target.value)}
            >
              {weeks.map((item) => (
                <option key={item.week.routeId} value={item.week.routeId}>
                  {item.week.pickerLabel}
                </option>
              ))}
            </select>
          </label>
        </h1>
        <button
          type="button"
          className="week-nav-btn"
          aria-label="Next week"
          disabled={!next}
          onClick={() => next && onSelect(next.week.routeId)}
        >
          ›
        </button>
      </div>
      {away ? (
        <Link className="this-week" to={weekPath(openWeek)}>
          This week
        </Link>
      ) : null}
    </div>
  )
}
