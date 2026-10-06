import { seedWeeks } from '../data/seed.js'
import { applyPitchSlotRules } from './fixtures.js'
import { overlayMatchScores } from './match-results.js'
import { currentWeekMonday, markCurrentWeeks, sortWeekEntries } from './weeks.js'

let currentWeekCache
let pastWeeksCache
let allWeeksCache

function asWeekEntry(item) {
  if (!item?.week) return null
  const fixtures = applyPitchSlotRules(item.fixtures || [], item.week.id)
  return {
    week: item.week,
    fixtures: overlayMatchScores(fixtures),
  }
}

function fromSeed() {
  return markCurrentWeeks(sortWeekEntries(seedWeeks.map(asWeekEntry).filter(Boolean)))
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

export async function loadAllWeeks() {
  if (allWeeksCache) return allWeeksCache
  cacheSlices(fromSeed())
  return allWeeksCache
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
