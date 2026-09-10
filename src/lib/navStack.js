import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

const memory = new Map()

function storageKey(key) {
  return `nav:${key}`
}

export function readSnapshot(key) {
  if (!key) return null
  if (memory.has(key)) return memory.get(key)
  try {
    const raw = sessionStorage.getItem(storageKey(key))
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed) memory.set(key, parsed)
    return parsed
  } catch {
    return null
  }
}

export function writeSnapshot(key, patch) {
  if (!key) return
  const next = { ...readSnapshot(key), ...patch }
  memory.set(key, next)
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
}

export function freezeSnapshot(key, patch = {}) {
  writeSnapshot(key, { ...patch, scrollY: window.scrollY })
}

export function useStackPage(state, ready) {
  const location = useLocation()
  const key = location.key
  const stateKey = JSON.stringify(state ?? {})

  useLayoutEffect(() => {
    if (!ready) return
    const snap = readSnapshot(key)
    if (typeof snap?.scrollY !== 'number') return
    const restore = () => window.scrollTo(0, snap.scrollY)
    restore()
    const frame = requestAnimationFrame(restore)
    return () => cancelAnimationFrame(frame)
  }, [key, ready])

  useEffect(() => {
    if (!ready) return
    const persist = () => {
      writeSnapshot(key, { ...(state ?? {}), scrollY: window.scrollY })
    }
    persist()
    window.addEventListener('scroll', persist, { passive: true })
    return () => {
      persist()
      window.removeEventListener('scroll', persist)
    }
  }, [key, ready, stateKey])
}
