import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clearFixturesCache, loadLiveFixtures } from '../src/lib/live-fixtures.js'

test('a hanging sheet export is aborted', async () => {
  clearFixturesCache()
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
})
