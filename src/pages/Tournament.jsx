import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { divisionPalette } from '../constants.js'
import LeagueFilters from '../components/LeagueFilters.jsx'
import TeamLink from '../components/TeamLink.jsx'
import { isPlaceholderName, knockoutDrawFromTies } from '../data/knockouts.js'
import { contrastText } from '../lib/fixtures.js'
import { useSchedule } from '../lib/useSchedule.jsx'
import { readSnapshot, useStackPage } from '../lib/navStack.js'

const ROUNDS = [
  { id: 'quarters', label: 'Quarters', matches: 4 },
  { id: 'semis', label: 'Semis', matches: 2 },
  { id: 'final', label: 'Final', matches: 1 },
]

function Slot({ name, division }) {
  if (!name) return <div className="bracket-slot" />
  if (isPlaceholderName(name)) {
    return <div className="bracket-slot bracket-placeholder">{name}</div>
  }
  return <TeamLink className="bracket-slot bracket-team" name={name} division={division} />
}

function matchLabel(round, matchIndex, home, away, score) {
  const label = `${round.label}, match ${matchIndex + 1}`
  if (!home && !away) return label
  const versus = `${home || 'Empty'} versus ${away || 'Empty'}`
  const result = score ? `${score.homeScore}–${score.awayScore}` : 'upcoming'
  return `${label}, ${versus}, ${result}`
}

function Bracket({ color, division, draw }) {
  return (
    <div className="bracket" style={{ '--division': color }}>
      {ROUNDS.map((round, roundIndex) => (
        <div className="bracket-round" key={round.id}>
          <p className="bracket-round-label">{round.label}</p>
          <div className="bracket-round-matches">
            {Array.from({ length: round.matches }, (_, matchIndex) => {
              const home = draw?.[round.id]?.[matchIndex * 2]
              const away = draw?.[round.id]?.[matchIndex * 2 + 1]
              const score = draw?.scores?.[round.id]?.[matchIndex] || null
              const upcoming = Boolean(home || away) && !score
              return (
                <div
                  className="bracket-match"
                  key={matchIndex}
                  aria-label={matchLabel(round, matchIndex, home, away, score)}
                >
                  <Slot name={home} division={division} />
                  {score ? (
                    <p className="bracket-score">
                      {score.homeScore} – {score.awayScore}
                    </p>
                  ) : upcoming ? (
                    <p className="bracket-score is-upcoming">Upcoming</p>
                  ) : null}
                  <Slot name={away} division={division} />
                  {roundIndex < ROUNDS.length - 1 ? <span className="bracket-join" aria-hidden="true" /> : null}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Tournament() {
  const location = useLocation()
  const snap = readSnapshot(location.key)
  const [league, setLeague] = useState(snap?.league ?? 'all')
  const { knockouts = [] } = useSchedule()

  useStackPage({ league }, true)

  const draws = useMemo(() => knockoutDrawFromTies(knockouts), [knockouts])

  const divisions = useMemo(
    () => divisionPalette().filter((division) => league === 'all' || division.name === league),
    [league],
  )

  return (
    <>
      <h1 className="page-title">Playoffs</h1>
      <p className="week-range">Eight-team bracket for every division</p>
      <LeagueFilters value={league} onChange={setLeague} />

      {divisions.map((division) => (
        <section className="league-table" key={division.name}>
          <header
            className="league-table-head"
            style={{ background: division.color, color: contrastText(division.color) }}
          >
            <h2>{division.name}</h2>
          </header>
          <Bracket color={division.color} division={division.name} draw={draws[division.name]} />
        </section>
      ))}
    </>
  )
}
