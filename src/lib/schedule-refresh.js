import { dublinToday } from './week-dates.js'

/** How often an open tab asks `/api/fixtures` for a newer sheet. */
export const FIXTURES_REFRESH_MS = 60_000

/**
 * Visibility and window focus often fire together when someone returns to the
 * tab. Treat those as one refresh.
 */
const FOCUS_COALESCE_MS = 1_000

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

/** Sheet body only. `updatedAt` changes when the server cache refreshes, even if no cell changed. */
export function scheduleSignature(payload) {
  if (!payload || typeof payload !== 'object') return ''
  const data = { ...payload }
  delete data.updatedAt
  return stableStringify(data)
}

/**
 * Identity of what the page is showing. The Dublin date is included so a tab
 * left open overnight can move to the next week without a sheet edit.
 */
export function liveScheduleKey(payload, now = new Date()) {
  return `${dublinToday(now).iso}\n${scheduleSignature(payload)}`
}

/**
 * Poll `/api/fixtures` while the page is open, and again when the tab is shown
 * or the window is focused. Calls `onLive` only when the sheet body or the
 * Dublin day changed. The first failed load calls `onFallback`; later failures
 * leave the current fixtures in place.
 *
 * Returns a stop function for effect cleanup.
 */
export function startFixturesRefresh({
  fetchPayload,
  onLive,
  onFallback,
  intervalMs = FIXTURES_REFRESH_MS,
  documentRef = globalThis.document,
  focusTarget = globalThis.window,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  now = Date.now,
}) {
  let stopped = false
  let generation = 0
  let timer = null
  let inflight = null
  let lastStartedAt = Number.NEGATIVE_INFINITY
  let view = { ready: false, source: null, signature: null }

  function arm() {
    clearTimer(timer)
    timer = setTimer(() => {
      void run(false)
    }, intervalMs)
  }

  async function run(isInitial) {
    if (stopped) return
    const startedAt = now()
    if (!isInitial && startedAt - lastStartedAt < FOCUS_COALESCE_MS) return
    if (inflight) return inflight

    lastStartedAt = startedAt
    const requestGeneration = ++generation
    let finishInflight = () => {}
    const job = new Promise((resolve) => {
      finishInflight = resolve
    })
    inflight = job

    try {
      let payload
      try {
        payload = await fetchPayload()
      } catch (error) {
        if (stopped || requestGeneration !== generation) return
        if (!isInitial && view.ready) return
        view = { ready: true, source: 'seed', signature: null }
        onFallback(error)
        return
      }

      if (stopped || requestGeneration !== generation) return
      const signature = liveScheduleKey(payload, new Date(now()))
      if (view.source === 'live' && view.signature === signature) return
      view = { ready: true, source: 'live', signature }
      onLive(payload)
    } finally {
      finishInflight()
      if (inflight === job) inflight = null
      if (!stopped && requestGeneration === generation) arm()
    }
  }

  function refreshIfShown() {
    if (documentRef?.visibilityState === 'hidden') return
    void run(false)
  }

  documentRef?.addEventListener?.('visibilitychange', refreshIfShown)
  focusTarget?.addEventListener?.('focus', refreshIfShown)
  void run(true)

  return function stop() {
    stopped = true
    generation += 1
    clearTimer(timer)
    documentRef?.removeEventListener?.('visibilitychange', refreshIfShown)
    focusTarget?.removeEventListener?.('focus', refreshIfShown)
  }
}
