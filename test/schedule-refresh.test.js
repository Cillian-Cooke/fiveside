import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  FIXTURES_REFRESH_MS,
  liveScheduleKey,
  scheduleSignature,
  startFixturesRefresh,
} from '../src/lib/schedule-refresh.js'

const FRIDAY = Date.parse('2026-10-30T18:00:00.000Z')
const SATURDAY = Date.parse('2026-10-31T18:00:00.000Z')

function sheet(matches, updatedAt = '2026-10-30T12:00:00.000Z') {
  return {
    updatedAt,
    legend: { 'Division 1': '#EA9999' },
    teams: { 'Egg Fried Reus': { division: 'Division 1', color: '#EA9999' } },
    weeks: [{ weekNumber: 1, startsOn: '2026-09-28', matches }],
  }
}

function createClock(start = FRIDAY) {
  let time = start
  const timers = new Map()
  let nextId = 1
  return {
    now: () => time,
    setTime(next) {
      time = next
    },
    setTimer(fn, ms) {
      const id = nextId++
      timers.set(id, { fn, at: time + ms })
      return id
    },
    clearTimer(id) {
      timers.delete(id)
    },
    async advance(ms) {
      const target = time + ms
      while (true) {
        let next = null
        for (const [id, timer] of timers) {
          if (timer.at <= target && (!next || timer.at < next.at)) {
            next = { id, at: timer.at, fn: timer.fn }
          }
        }
        if (!next) break
        time = next.at
        timers.delete(next.id)
        next.fn()
        await settle()
      }
      time = target
    },
    pendingTimers() {
      return timers.size
    },
  }
}

function createTarget() {
  const listeners = new Set()
  return {
    visibilityState: 'visible',
    addEventListener(_type, fn) {
      listeners.add(fn)
    },
    removeEventListener(_type, fn) {
      listeners.delete(fn)
    },
    emit() {
      for (const fn of [...listeners]) fn()
    },
    listenerCount() {
      return listeners.size
    },
  }
}

function settle() {
  return new Promise((resolve) => setImmediate(resolve))
}

async function settled() {
  for (let i = 0; i < 4; i += 1) await settle()
}

function harness({ start = FRIDAY, fetchPayload }) {
  const clock = createClock(start)
  const documentRef = createTarget()
  const focusTarget = createTarget()
  const live = []
  const fallback = []
  const stop = startFixturesRefresh({
    fetchPayload,
    onLive(payload) {
      live.push(payload)
    },
    onFallback(error) {
      fallback.push(error)
    },
    documentRef,
    focusTarget,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    now: clock.now,
  })
  return { clock, documentRef, focusTarget, live, fallback, stop }
}

test('signature ignores updatedAt and object key order', () => {
  const left = {
    updatedAt: 'first',
    b: 1,
    a: { d: true, c: ['x', 'y'] },
  }
  const right = {
    a: { c: ['x', 'y'], d: true },
    updatedAt: 'second',
    b: 1,
  }
  assert.equal(scheduleSignature(left), scheduleSignature(right))
  assert.notEqual(
    scheduleSignature({ weeks: [{ matches: [] }] }),
    scheduleSignature({ weeks: [{ matches: [{ home: 'A' }] }] }),
  )
})

test('live key changes on the next Dublin day', () => {
  const payload = sheet([])
  const friday = new Date(FRIDAY)
  const saturday = new Date(SATURDAY)
  assert.equal(liveScheduleKey(payload, friday), liveScheduleKey(sheet([], 'later'), friday))
  assert.notEqual(liveScheduleKey(payload, friday), liveScheduleKey(payload, saturday))
})

test('live key changes at Friday 17:00 Dublin and ignores a cache timestamp', () => {
  const payload = sheet([])
  const before = new Date('2026-10-30T16:59:00Z')
  const after = new Date('2026-10-30T17:00:00Z')
  assert.notEqual(liveScheduleKey(payload, before), liveScheduleKey(payload, after))
  assert.equal(liveScheduleKey(payload, after), liveScheduleKey(sheet([], 'later'), after))
})

test('refreshes on an interval and stays quiet when the sheet body is unchanged', async () => {
  const pending = []
  const env = harness({
    fetchPayload: () =>
      new Promise((resolve) => {
        pending.push(resolve)
      }),
  })
  await settled()
  assert.equal(pending.length, 1)
  assert.equal(FIXTURES_REFRESH_MS, 60_000)

  pending[0](sheet([{ home: 'A' }], '2026-10-30T12:00:00.000Z'))
  await settled()
  assert.equal(env.live.length, 1)
  assert.equal(env.clock.pendingTimers(), 1)

  await env.clock.advance(59_000)
  assert.equal(pending.length, 1)

  await env.clock.advance(1_000)
  assert.equal(pending.length, 2)
  pending[1](sheet([{ home: 'A' }], '2026-10-30T12:01:00.000Z'))
  await settled()
  assert.equal(env.live.length, 1)

  env.documentRef.visibilityState = 'hidden'
  await env.clock.advance(FIXTURES_REFRESH_MS)
  assert.equal(pending.length, 3)
  pending[2](sheet([{ home: 'B' }], '2026-10-30T12:02:00.000Z'))
  await settled()
  assert.equal(env.live.length, 2)
  assert.equal(env.live[1].weeks[0].matches[0].home, 'B')
  env.stop()
})

test('refetches when the tab becomes visible or the window is focused', async () => {
  const pending = []
  const env = harness({
    fetchPayload: () =>
      new Promise((resolve) => {
        pending.push(resolve)
      }),
  })
  await settled()
  pending[0](sheet([]))
  await settled()
  await env.clock.advance(2_000)

  env.documentRef.visibilityState = 'hidden'
  env.documentRef.emit()
  await settled()
  assert.equal(pending.length, 1)

  env.documentRef.visibilityState = 'visible'
  env.documentRef.emit()
  env.focusTarget.emit()
  await settled()
  assert.equal(pending.length, 2)

  pending[1](sheet([]))
  await settled()
  assert.equal(env.live.length, 1)
  env.stop()
  assert.equal(env.documentRef.listenerCount(), 0)
  assert.equal(env.focusTarget.listenerCount(), 0)
})

test('a tab left open past Friday 17:00 Dublin applies the same sheet again', async () => {
  const pending = []
  const env = harness({
    start: Date.parse('2026-10-30T16:00:00.000Z'),
    fetchPayload: () =>
      new Promise((resolve) => {
        pending.push(resolve)
      }),
  })
  await settled()
  pending[0](sheet([{ home: 'A' }]))
  await settled()

  env.clock.setTime(Date.parse('2026-10-30T17:00:00.000Z'))
  env.documentRef.emit()
  await settled()
  assert.equal(pending.length, 2)
  pending[1](sheet([{ home: 'A' }], '2026-10-30T17:00:00.000Z'))
  await settled()
  assert.equal(env.live.length, 2)
  env.stop()
})

test('a tab left open overnight applies the same sheet again on the next Dublin day', async () => {
  const pending = []
  const env = harness({
    start: FRIDAY,
    fetchPayload: () =>
      new Promise((resolve) => {
        pending.push(resolve)
      }),
  })
  await settled()
  pending[0](sheet([{ home: 'A' }]))
  await settled()

  env.clock.setTime(SATURDAY)
  env.documentRef.emit()
  await settled()
  assert.equal(pending.length, 2)
  pending[1](sheet([{ home: 'A' }], '2026-10-31T18:00:00.000Z'))
  await settled()
  assert.equal(env.live.length, 2)
  env.stop()
})

test('first failure falls back, later failures keep the current fixtures, and a later success replaces them', async () => {
  const pending = []
  const env = harness({
    fetchPayload: () =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, reject })
      }),
  })
  await settled()
  pending[0].reject(new Error('Could not load the sheet (502)'))
  await settled()
  assert.equal(env.fallback.length, 1)
  assert.equal(env.live.length, 0)
  assert.equal(env.fallback[0].message, 'Could not load the sheet (502)')

  await env.clock.advance(FIXTURES_REFRESH_MS)
  assert.equal(pending.length, 2)
  pending[1].reject(new Error('Could not load the sheet (502)'))
  await settled()
  assert.equal(env.fallback.length, 1)
  assert.equal(env.live.length, 0)

  await env.clock.advance(FIXTURES_REFRESH_MS)
  pending[2].resolve(sheet([{ home: 'A' }]))
  await settled()
  assert.equal(env.live.length, 1)
  assert.equal(env.fallback.length, 1)
  env.stop()
})

test('a failed refresh keeps live fixtures on screen', async () => {
  const pending = []
  const env = harness({
    fetchPayload: () =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, reject })
      }),
  })
  await settled()
  pending[0].resolve(sheet([{ home: 'A' }]))
  await settled()

  await env.clock.advance(FIXTURES_REFRESH_MS)
  pending[1].reject(new Error('network down'))
  await settled()
  assert.equal(env.live.length, 1)
  assert.equal(env.fallback.length, 0)
  env.stop()
})

test('stopping cancels further refreshes and ignores a response already in flight', async () => {
  const pending = []
  const env = harness({
    fetchPayload: () =>
      new Promise((resolve) => {
        pending.push(resolve)
      }),
  })
  await settled()
  env.stop()
  pending[0](sheet([]))
  await settled()
  assert.equal(env.live.length, 0)

  env.documentRef.emit()
  env.focusTarget.emit()
  await env.clock.advance(FIXTURES_REFRESH_MS * 3)
  assert.equal(pending.length, 1)
  assert.equal(env.clock.pendingTimers(), 0)
})
