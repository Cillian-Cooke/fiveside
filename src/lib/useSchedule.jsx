import { createContext, useContext, useEffect, useState } from 'react'
import fallbackPayload from '../data/seed-payload.json' with { type: 'json' }
import { setDivisionColors } from '../constants.js'
import { setTeamDirectory } from './fixtures.js'
import { decorateWeeks } from './schedule.js'

const ScheduleContext = createContext(null)

function applyPayload(payload) {
  setTeamDirectory(payload.teams)
  setDivisionColors(payload.legend)
  return decorateWeeks(payload)
}

const REFRESH_MS = 60_000

async function fetchPayload() {
  const response = await fetch('/api/fixtures', {
    headers: { accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`Could not load the sheet (${response.status})`)
  const payload = await response.json()
  if (!payload?.weeks?.length) throw new Error('The sheet response was empty')
  return payload
}

export function ScheduleProvider({ children }) {
  const [state, setState] = useState({
    status: 'loading',
    error: null,
    source: null,
    updatedAt: null,
    weeks: [],
    open: null,
    between: null,
  })

  useEffect(() => {
    let ignore = false

    async function load(initial) {
      try {
        const payload = await fetchPayload()
        if (ignore) return
        setState({
          status: 'ready',
          error: null,
          source: 'live',
          updatedAt: payload.updatedAt,
          ...applyPayload(payload),
        })
      } catch (error) {
        if (ignore || !initial) return
        setState({
          status: 'ready',
          error: error?.message || 'Could not load the sheet',
          source: 'seed',
          updatedAt: fallbackPayload.updatedAt,
          ...applyPayload(fallbackPayload),
        })
      }
    }

    load(true)
    const timer = setInterval(() => load(false), REFRESH_MS)
    return () => {
      ignore = true
      clearInterval(timer)
    }
  }, [])

  return <ScheduleContext.Provider value={state}>{children}</ScheduleContext.Provider>
}

export function useSchedule() {
  const value = useContext(ScheduleContext)
  if (!value) throw new Error('useSchedule must be used inside ScheduleProvider')
  return value
}
