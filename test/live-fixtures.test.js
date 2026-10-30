import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clearFixturesCache, loadLiveFixtures } from '../src/lib/live-fixtures.js'

test('a hanging sheet export is aborted', async () => {
  clearFixturesCache()
  // AbortSignal.timeout does not keep the event loop alive on its own.
  // A real socket would. Hold the loop until the abort fires.
  const keepAlive = setInterval(() => {}, 1000)
  try {
    await assert.rejects(
      loadLiveFixtures({
        timeoutMs: 40,
        fetchImpl: (_url, init) =>
          new Promise((_resolve, reject) => {
            const fail = () => reject(init.signal.reason || new Error('aborted'))
            if (init.signal.aborted) {
              fail()
              return
            }
            init.signal.addEventListener('abort', fail, { once: true })
          }),
      }),
    )
  } finally {
    clearInterval(keepAlive)
  }
})
