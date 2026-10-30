import { useEffect } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import FixturesBoard from '../components/FixturesBoard.jsx'
import WeekNav from '../components/WeekNav.jsx'
import { findWeek, initialDay, weekPath } from '../lib/schedule.js'
import { useSchedule } from '../lib/useSchedule.jsx'
import { dublinToday, formatUpdatedAt, shiftStartsOn } from '../lib/week-dates.js'

function Loading({ label }) {
  return (
    <div className="loading-state" role="status">
      <p>{label}</p>
      <div className="loading-block" />
      <div className="loading-block" />
      <div className="loading-block short" />
    </div>
  )
}

export function WeekRedirect() {
  const { status, open, weeks } = useSchedule()
  if (status === 'loading') return <Loading label="Loading this week’s fixtures…" />
  const target = open?.week || weeks[0]?.week
  if (!target) return <p className="lede">No fixtures to show yet.</p>
  return <Navigate to={weekPath(target)} replace />
}

export default function WeekPage() {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const { status, error, source, updatedAt, weeks, catchups = [], open, between } = useSchedule()

  const entry = findWeek(weeks, weekId)
  const index = weeks.findIndex((item) => item.week.routeId === entry?.week.routeId)
  const prev = index > 0 ? weeks[index - 1] : null
  const next = index >= 0 && index < weeks.length - 1 ? weeks[index + 1] : null

  useEffect(() => {
    if (!entry) return
    document.title = `${entry.week.pickerLabel} — TCD Five-a-side`
  }, [entry])

  if (status === 'loading') return <Loading label="Loading this week’s fixtures…" />

  if (!entry) {
    return (
      <>
        <h1 className="page-title">Week not found</h1>
        <p className="lede">That week isn’t on the sheet.</p>
        <Link className="this-week" to="/">
          This week
        </Link>
      </>
    )
  }

  const stamp = formatUpdatedAt(updatedAt)
  const showBetween = Boolean(between) && entry.week.isCurrent
  const listed = entry.fixtures.some((fixture) => fixture.status === 'match')
  const catchup = catchups.length > 0
  const readingQuiet = entry.week.reading && !listed && !catchup

  return (
    <>
      {error ? (
        <p className="banner banner-error" role="alert">
          Couldn’t refresh the sheet. Showing the saved copy.
        </p>
      ) : null}
      <WeekNav
        weeks={weeks}
        entry={entry}
        openWeek={open?.week}
        onSelect={(routeId) => navigate(`/week/${routeId}`)}
      />
      {showBetween ? <p className="between-note">{between}</p> : null}
      {readingQuiet ? (
        <article className="placeholder-card">
          <h2>Reading week – no league games</h2>
          <p>No fixtures at Botany Bay or the halls this week. League games resume afterwards.</p>
        </article>
      ) : (
        <>
          {entry.week.reading ? (
            <p className="between-note">Reading week. These games are still on the sheet.</p>
          ) : null}
          <FixturesBoard
            key={entry.week.id}
            fixtures={entry.fixtures}
            rescheduled={catchups}
            dayNotes={entry.week.dayNotes}
            weekId={entry.week.id}
            initialDay={initialDay(entry.week, entry.fixtures)}
            todayName={
              dublinToday().iso >= entry.week.startsOn &&
              dublinToday().iso < shiftStartsOn(entry.week.startsOn, 1)
                ? dublinToday().dayName
                : null
            }
            onPrevWeek={prev ? () => navigate(weekPath(prev.week)) : null}
            onNextWeek={next ? () => navigate(weekPath(next.week)) : null}
          />
        </>
      )}
      <p className="sheet-stamp">
        {source === 'seed' ? 'Saved copy' : 'Sheet'}
        {stamp ? ` · ${stamp}` : ''}
      </p>
    </>
  )
}
