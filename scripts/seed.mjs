import { initializeApp } from 'firebase/app'
import { collection, doc, getFirestore, setDoc } from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { seedFixtures, seedWeek } from '../src/data/seed.js'

function loadEnv() {
  const env = { ...process.env }
  for (const file of ['.env.local', '.env']) {
    try {
      const text = readFileSync(file, 'utf8')
      for (const line of text.split('\n')) {
        const match = line.match(/^([^#=]+)=(.*)$/)
        if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
      }
    } catch {
      // optional env files
    }
  }
  return env
}

const env = loadEnv()
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

if (!config.apiKey || !config.projectId) {
  console.error('Add Firebase keys to .env.local first. The site still runs from local JavaScript data until then.')
  process.exit(1)
}

const db = getFirestore(initializeApp(config))

await setDoc(doc(db, 'weeks', seedWeek.id), {
  label: seedWeek.label,
  rangeLabel: seedWeek.rangeLabel,
  startsOn: seedWeek.startsOn,
  isCurrent: seedWeek.isCurrent,
  pitch: seedWeek.pitch,
  halls: seedWeek.halls,
})

const fixturesRef = collection(db, 'fixtures')
for (const fixture of seedFixtures) {
  const { id, ...data } = fixture
  await setDoc(doc(fixturesRef, id), data)
}

console.log(`Seeded week ${seedWeek.id} with ${seedFixtures.length} slots.`)
