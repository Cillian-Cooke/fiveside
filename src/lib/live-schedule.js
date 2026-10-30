import { loadLiveFixtures } from './live-fixtures.js'
import { loadLiveResults } from './live-results.js'

/**
 * Fixtures plus live Results rows when the score sheet can be read.
 * A results failure leaves the fixtures payload unchanged so the client
 * can keep using the baked match-results file.
 */
export async function loadPublishedSchedule(options) {
  const [fixtures, results] = await Promise.allSettled([
    loadLiveFixtures(options),
    loadLiveResults(options),
  ])
  if (fixtures.status === 'rejected') throw fixtures.reason
  if (results.status === 'rejected') {
    console.error('[results]', results.reason)
    return fixtures.value
  }
  return { ...fixtures.value, results: results.value.results }
}
