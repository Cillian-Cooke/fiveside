import { useEffect, useState } from 'react'
import FixturesBoard from '../components/FixturesBoard.jsx'
import { loadCurrentWeek, peekCurrentWeek } from '../lib/firebase.js'

export default function Home() {
  const cached = peekCurrentWeek()
  const [state, setState] = useState(
    cached ? { loading: false, ...cached } : { loading: true, week: null, fixtures: [] },
  )

  useEffect(() => {
    let ignore = false
    loadCurrentWeek().then((result) => {
      if (!ignore) setState({ loading: false, ...result })
    })
    return () => {
      ignore = true
    }
  }, [])

  if (state.loading) {
    return <p className="lede">Loading this week’s fixtures…</p>
  }

  return (
    <FixturesBoard
      title="Current week"
      rangeLabel={state.week?.rangeLabel}
      fixtures={state.fixtures}
      searchPlaceholder="Search a team or division…"
    />
  )
}
