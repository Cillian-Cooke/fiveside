import { useLayoutEffect, useMemo } from 'react'
import { Link, useNavigate, useNavigationType, useParams } from 'react-router-dom'
import { DAY_LONG, VENUE_LABEL } from '../constants.js'
import { uniqueTeams } from '../lib/fixtures.js'
import { useSchedule } from '../lib/useSchedule.jsx'
import { weekPath } from '../lib/schedule.js'
import { currentWeekMonday } from '../lib/week-dates.js'
import {
  findTeamBySlug,
  pastGames,
  resultFor,
  teamDisplayName,
  upcomingGames,
} from '../lib/teams.js'
import MatchCard from '../components/MatchCard.jsx'
import TeamLink from '../components/TeamLink.jsx'
import { useStackPage } from '../lib/navStack.js'

export default function Team() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const navType = useNavigationType()
  const { status, weeks } = useSchedule()
  const ready = status === 'ready'

  useLayoutEffect(() => {
    if (navType === 'POP') return
    window.scrollTo(0, 0)
  }, [slug, navType])

  useStackPage(null, ready)

  const monday = currentWeekMonday()

  const roster = useMemo(() => {
    const merged = new Map()
    for (const side of uniqueTeams(weeks.flatMap((item) => item.fixtures))) {
      merged.set(`${side.name}\0${side.division}`, side)
    }
    return [...merged.values()]
  }, [weeks])

  const team = findTeamBySlug(roster, slug)

  const upcoming = useMemo(() => {
    if (!team) return []
    return weeks
      .filter((item) => String(item.week.startsOn || item.week.id) >= monday)
      .flatMap((item) =>
        upcomingGames(team.name, item.fixtures, team.division).map((fixture) => ({
          ...fixture,
          weekLabel: item.week?.label || item.week?.rangeLabel,
          startsOn: item.week?.startsOn,
          routeId: item.week?.routeId,
        })),
      )
  }, [team, weeks, monday])

  const rescheduled = useMemo(() => {
    if (!team) return []
    return weeks.flatMap((item) =>
      (item.rescheduled || [])
        .filter(
          (game) =>
            (game.home === team.name || game.away === team.name) &&
            game.division === team.division,
        )
        .map((game) => ({
          ...game,
          weekLabel: item.week.label,
          routeId: item.week.routeId,
        })),
    )
  }, [team, weeks])

  const history = useMemo(() => {
    if (!team) return []
    const games = weeks
      .filter((item) => String(item.week.startsOn || item.week.id) < monday)
      .flatMap((item) =>
        item.fixtures.map((fixture) => ({
          ...fixture,
          weekLabel: item.week.label || item.week.rangeLabel,
          startsOn: item.week.startsOn,
        })),
      )
    return pastGames(team.name, games, team.division)
  }, [team, weeks, monday])

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
      <h1 className="page-title">{teamDisplayName(team.name, team.division)}</h1>

      <h2 className="section-title">Next game</h2>
      {next ? (
        <div className="next-game">
          <p className="week-range">
            {next.weekLabel ? `${next.weekLabel} · ` : ''}
            {DAY_LONG[next.day]} · {next.time}
            {next.venue ? ` · ${VENUE_LABEL[next.venue]}` : ''}
            {next.routeId ? (
              <>
                {' · '}
                <Link to={weekPath({ routeId: next.routeId })}>
                  Fixtures
                </Link>
              </>
            ) : null}
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
          <h2 className="section-title">Also coming up</h2>
          {upcoming.slice(1).map((fixture) => (
            <MatchCard key={fixture.id} fixture={fixture} />
          ))}
        </>
      ) : null}

      {rescheduled.length ? (
        <>
          <h2 className="section-title">To be rescheduled</h2>
          {rescheduled.map((fixture) => (
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
                  <TeamLink className="team-link" name={opponent} division={fixture.division}>
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
