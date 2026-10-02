import { seedWeeks } from '../data/seed.js'
import { applyPitchSlotRules } from './fixtures.js'
import { currentWeekMonday, markCurrentWeeks, sortWeekEntries } from './weeks.js'

let currentWeekCache
let pastWeeksCache
let allWeeksCache

function readConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  return { config, ready: Boolean(config.apiKey && config.projectId) }
}

export function isFirebaseConfigured() {
  return readConfig().ready
}

function asWeekEntry(item) {
  if (!item?.week) return null
  return { week: item.week, fixtures: item.fixtures || [] }
}

function fromSeed() {
  return markCurrentWeeks(sortWeekEntries(seedWeeks.map(asWeekEntry).filter(Boolean)))
}

/** Scores may live in Firestore; schedule always follows git seed (sheet sync). */
function overlayRemoteScores(seedFixtures, remoteFixtures) {
  const remoteById = new Map((remoteFixtures || []).map((fixture) => [fixture.id, fixture]))
  return (seedFixtures || []).map((fixture) => {
    const remote = remoteById.get(fixture.id)
    if (!remote) return fixture
    const patch = {}
    if (typeof remote.homeScore === 'number') patch.homeScore = remote.homeScore
    if (typeof remote.awayScore === 'number') patch.awayScore = remote.awayScore
    return Object.keys(patch).length ? { ...fixture, ...patch } : fixture
  })
}

function mergeSeedWithRemote(seedList, remoteList) {
  if (!remoteList?.length) return seedList
  const remoteByWeek = new Map(remoteList.map((entry) => [entry.week.id, entry]))
  const merged = seedList.map((seedEntry) => {
    const remoteEntry = remoteByWeek.get(seedEntry.week.id)
    if (!remoteEntry) return seedEntry
    return {
      week: {
        ...remoteEntry.week,
        ...seedEntry.week,
        label: seedEntry.week.label,
        rangeLabel: seedEntry.week.rangeLabel,
        isCurrent: seedEntry.week.isCurrent,
        tab: seedEntry.week.tab,
      },
      fixtures: applyPitchSlotRules(
        overlayRemoteScores(seedEntry.fixtures, remoteEntry.fixtures),
        seedEntry.week.id,
      ),
    }
  })
  for (const remoteEntry of remoteList) {
    if (!seedList.some((entry) => entry.week.id === remoteEntry.week.id)) {
      merged.push(remoteEntry)
    }
  }
  return merged
}

export function peekCurrentWeek() {
  return currentWeekCache
}

export function peekPastWeeks() {
  return pastWeeksCache
}

export function peekAllWeeks() {
  return allWeeksCache
}

function cacheSlices(list) {
  const monday = currentWeekMonday()
  currentWeekCache = list.find((item) => item.week.isCurrent) || list[0] || null
  pastWeeksCache = list.filter((item) => String(item.week.startsOn || item.week.id) < monday)
  allWeeksCache = list
}

async function loadWeeksFromFirebase(config) {
  const { initializeApp } = await import('firebase/app')
  const { collection, getDocs, getFirestore } = await import('firebase/firestore')
  const db = getFirestore(initializeApp(config))
  const weeksSnap = await getDocs(collection(db, 'weeks'))
  const weeks = weeksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  if (!weeks.length) return []

  const fixturesSnap = await getDocs(collection(db, 'fixtures'))
  const fixtures = fixturesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  const byWeek = new Map()
  for (const fixture of fixtures) {
    const key = fixture.weekId
    if (!byWeek.has(key)) byWeek.set(key, [])
    byWeek.get(key).push(fixture)
  }

  return weeks.map((week) => ({
    week,
    fixtures: applyPitchSlotRules(byWeek.get(week.id) || [], week.id),
  }))
}

export async function loadAllWeeks() {
  if (allWeeksCache) return allWeeksCache

  const { config, ready } = readConfig()
  if (!ready) {
    cacheSlices(fromSeed())
    return allWeeksCache
  }

  try {
    const remote = await loadWeeksFromFirebase(config)
    const seedList = fromSeed()
    const list = markCurrentWeeks(
      sortWeekEntries(mergeSeedWithRemote(seedList, remote).map(asWeekEntry).filter(Boolean)),
    )
    cacheSlices(list)
    return allWeeksCache
  } catch (error) {
    console.warn('Firebase unavailable, using local fixtures', error)
    cacheSlices(fromSeed())
    return allWeeksCache
  }
}

export async function loadCurrentWeek() {
  if (currentWeekCache) return currentWeekCache
  const weeks = await loadAllWeeks()
  return weeks.find((item) => item.week.isCurrent) || weeks[0] || null
}

export async function loadPastWeeks() {
  if (pastWeeksCache) return pastWeeksCache
  await loadAllWeeks()
  return pastWeeksCache || []
}
