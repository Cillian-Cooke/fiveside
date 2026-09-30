import { seedFixtures, seedWeek } from '../data/seed.js'
import { applyPitchSlotRules } from './fixtures.js'

let currentWeekCache
let pastWeeksCache

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

export function peekCurrentWeek() {
  return currentWeekCache
}

export function peekPastWeeks() {
  return pastWeeksCache
}

export async function loadCurrentWeek() {
  if (currentWeekCache) return currentWeekCache

  const { config, ready } = readConfig()
  if (!ready) {
    currentWeekCache = {
      week: seedWeek,
      fixtures: applyPitchSlotRules(seedFixtures, seedWeek.id),
      source: 'local',
    }
    return currentWeekCache
  }

  try {
    const { initializeApp } = await import('firebase/app')
    const { collection, getDocs, getFirestore, query, where } = await import(
      'firebase/firestore'
    )
    const db = getFirestore(initializeApp(config))
    const weeksSnap = await getDocs(
      query(collection(db, 'weeks'), where('isCurrent', '==', true)),
    )
    const weekDoc = weeksSnap.docs[0]
    const week = weekDoc ? { id: weekDoc.id, ...weekDoc.data() } : seedWeek
    const fixturesSnap = await getDocs(
      query(collection(db, 'fixtures'), where('weekId', '==', week.id)),
    )
    const fixtures = fixturesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    if (!fixtures.length) {
      currentWeekCache = {
        week: seedWeek,
        fixtures: applyPitchSlotRules(seedFixtures, seedWeek.id),
        source: 'local',
      }
      return currentWeekCache
    }

    currentWeekCache = {
      week,
      fixtures: applyPitchSlotRules(fixtures, week.id),
      source: 'firebase',
    }
    return currentWeekCache
  } catch (error) {
    console.warn('Firebase unavailable, using local fixtures', error)
    currentWeekCache = {
      week: seedWeek,
      fixtures: applyPitchSlotRules(seedFixtures, seedWeek.id),
      source: 'local',
    }
    return currentWeekCache
  }
}

export async function loadPastWeeks() {
  if (pastWeeksCache) return pastWeeksCache

  const { pastWeeks } = await import('../data/seed.js')
  const { config, ready } = readConfig()
  if (!ready) {
    pastWeeksCache = pastWeeks
    return pastWeeksCache
  }

  try {
    const { initializeApp } = await import('firebase/app')
    const { collection, getDocs, getFirestore, query, where } = await import(
      'firebase/firestore'
    )
    const db = getFirestore(initializeApp(config))
    const weeksSnap = await getDocs(
      query(collection(db, 'weeks'), where('isCurrent', '==', false)),
    )
    const weeks = weeksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    if (!weeks.length) {
      pastWeeksCache = pastWeeks
      return pastWeeksCache
    }

    const result = []
    for (const week of weeks) {
      const fixturesSnap = await getDocs(
        query(collection(db, 'fixtures'), where('weekId', '==', week.id)),
      )
      const fixtures = fixturesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      result.push({
        week,
        fixtures: applyPitchSlotRules(fixtures, week.id),
      })
    }
    pastWeeksCache = result.length ? result : pastWeeks
    return pastWeeksCache
  } catch (error) {
    console.warn('Firebase unavailable, using local results', error)
    pastWeeksCache = pastWeeks
    return pastWeeksCache
  }
}
