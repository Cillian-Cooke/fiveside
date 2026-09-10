import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate, useNavigationType, useParams } from 'react-router-dom'
import { DAY_LONG, VENUE_LABEL } from '../constants.js'
import { uniqueTeams } from '../lib/fixtures.js'
import { loadCurrentWeek, loadPastWeeks } from '../lib/firebase.js'
import {
  findTeamBySlug,
  pastGames,
  resultFor,
  teamProfile,
  upcomingGames,
} from '../lib/teams.js'
import MatchCard from '../components/MatchCard.jsx'
import TeamLink from '../components/TeamLink.jsx'
import { useStackPage } from '../lib/navStack.js'

export default function Team() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const navType = useNavigationType()
  const [current, setCurrent] = useState({ week: null, fixtures: [] })
  const [pastWeeks, setPastWeeks] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([loadCurrentWeek(), loadPastWeeks()]).then(([week, past]) => {
      setCurrent(week)
      setPastWeeks(past)
      setReady(true)
    })
  }, [])

  useLayoutEffect(() => {
    if (navType === 'POP') return
    window.scrollTo(0, 0)
  }, [slug, navType])

  useStackPage(null, ready)

  const roster = useMemo(() => {
    const fromCurrent = uniqueTeams(current.fixtures)
    const fromPast = uniqueTeams(pastWeeks.flatMap((item) => item.fixtures))
    const merged = new Map()
    for (const team of [...fromPast, ...fromCurrent]) merged.set(team.name, team)
    return [...merged.values()]
  }, [current.fixtures, pastWeeks])

  const team = findTeamBySlug(roster, slug)
  const profile = team ? teamProfile(team.name) : null

  const upcoming = useMemo(() => {
    if (!team) return []
    return upcomingGames(team.name, current.fixtures).map((fixture) => ({
      ...fixture,
      weekLabel: current.week?.rangeLabel,
    }))
  }, [team, current])

  const history = useMemo(() => {
    if (!team) return []
    const games = pastWeeks.flatMap((item) =>
      item.fixtures.map((fixture) => ({
        ...fixture,
        weekLabel: item.week.rangeLabel,
        startsOn: item.week.startsOn,
      })),
    )
    return pastGames(team.name, games)
  }, [team, pastWeeks])

  function goBack() {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  if (!ready) return <p className="lede">Loading team…</p>

  if (!team) {
    return (
      <>
        <p className="page-kicker">Team</p>
        <h1 className="page-title">Not found</h1>
        <p className="lede">No side matches that link.</p>
        <button type="button" className="text-link" onClick={goBack}>
          ← Back
        </button>
      </>
    )
  }

  const next = upcoming[0]

  return (
    <>
      <button type="button" className="text-link" onClick={goBack}>
        ← Back
      </button>
      <p className="page-kicker">{team.division}</p>
      <h1 className="page-title">{team.name}</h1>
      <p className="team-meta">
        Captain {profile.captain}
        <span aria-hidden="true">·</span>
        <a href={profile.instagram} target="_blank" rel="noreferrer">
          {profile.instagramHandle}
        </a>
        <span aria-hidden="true">·</span>
        <a href={profile.tiktok} target="_blank" rel="noreferrer">
          TikTok
        </a>
      </p>

      <h2 className="section-title">Next game</h2>
      {next ? (
        <div className="next-game">
          <p className="week-range">
            {DAY_LONG[next.day]} · {next.time} · {VENUE_LABEL[next.venue]}
          </p>
          <MatchCard fixture={next} />
        </div>
      ) : (
        <article className="placeholder-card">
          <h2>No game this week</h2>
          <p>Nothing scheduled for {team.name} on the current timetable.</p>
        </article>
      )}

      {upcoming.length > 1 ? (
        <>
          <h2 className="section-title">Also this week</h2>
          {upcoming.slice(1).map((fixture) => (
            <MatchCard key={fixture.id} fixture={fixture} />
          ))}
        </>
      ) : null}

      <h2 className="section-title">Past results</h2>
      {history.length ? (
        <div className="result-list">
          {history.map((fixture) => {
            const opponent = fixture.home === team.name ? fixture.away : fixture.home
            const result = resultFor(team.name, fixture)
            const scored = fixture.home === team.name ? fixture.homeScore : fixture.awayScore
            const conceded = fixture.home === team.name ? fixture.awayScore : fixture.homeScore
            return (
              <article className="result-row" key={fixture.id}>
                <span className={`result-pill result-${result}`}>{result}</span>
                <div>
                  vs{' '}
                  <TeamLink className="team-link" name={opponent}>
                    {opponent}
                  </TeamLink>
                  <small>
                    {fixture.weekLabel} · {DAY_LONG[fixture.day]} · {fixture.time}
                  </small>
                </div>
                <strong>
                  {scored}–{conceded}
                </strong>
              </article>
            )
          })}
        </div>
      ) : (
        <article className="placeholder-card">
          <h2>No results yet</h2>
          <p>Played matches will show up here.</p>
        </article>
      )}
    </>
  )
}
