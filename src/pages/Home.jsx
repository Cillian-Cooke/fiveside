import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import FixturesBoard from '../components/FixturesBoard.jsx'
import { loadAllWeeks, peekAllWeeks } from '../lib/firebase.js'
import { readSnapshot } from '../lib/navStack.js'
import { makeEmptyWeek, shiftStartsOn, sortWeekEntries } from '../lib/weeks.js'

function currentId(list) {
  return list.find((item) => item.week.isCurrent)?.week.id || list[0]?.week.id || null
}

export default function Home() {
  const location = useLocation()
  const snap = readSnapshot(location.key)
  const cached = peekAllWeeks()
  const [weeks, setWeeks] = useState(cached || [])
  const [weekId, setWeekId] = useState(
    () => snap?.weekId || currentId(cached || []),
  )
  const [loading, setLoading] = useState(!cached?.length)

  useEffect(() => {
    let ignore = false
    loadAllWeeks().then((list) => {
      if (ignore) return
      setWeeks(list)
      setWeekId((id) => (list.some((item) => item.week.id === id) ? id : currentId(list)))
      setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [])

  function goWeek(delta) {
    const idx = weeks.findIndex((item) => item.week.id === weekId)
    const target = idx + delta
    if (target >= 0 && target < weeks.length) {
      setWeekId(weeks[target].week.id)
      return
    }
    const anchor = weeks[Math.max(idx, 0)]
    if (!anchor) return
    const startsOn = shiftStartsOn(anchor.week.startsOn, delta)
    const existing = weeks.find(
      (item) => item.week.id === startsOn || item.week.startsOn === startsOn,
    )
    if (existing) {
      setWeekId(existing.week.id)
      return
    }
    const empty = makeEmptyWeek(startsOn)
    setWeeks(sortWeekEntries([...weeks, empty]))
    setWeekId(empty.week.id)
  }

  if (loading) {
    return <p className="lede">Loading this week’s fixtures…</p>
  }

  const entry = weeks.find((item) => item.week.id === weekId) || weeks[0]
  if (!entry) {
    return <p className="lede">No fixtures to show yet.</p>
  }

  return (
    <FixturesBoard
      title={entry.week.isCurrent ? 'Current week' : 'Fixtures'}
      rangeLabel={entry.week.rangeLabel}
      fixtures={entry.fixtures}
      weekId={entry.week.id}
      onPrevWeek={() => goWeek(-1)}
      onNextWeek={() => goWeek(1)}
      searchPlaceholder="Search a team or division…"
    />
  )
}
