import { useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate, useNavigationType, useParams } from 'react-router-dom'
import { DAY_LONG, VENUE_LABEL } from '../constants.js'
import { uniqueTeams } from '../lib/fixtures.js'
import { useSchedule } from '../lib/useSchedule.jsx'
import { teamHorizon } from '../lib/schedule.js'
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
import { normalizeTeamKey } from '../lib/match-results.js'

function playedWhen(fixture) {
  const parts = [fixture.weekLabel]
  if (DAY_LONG[fixture.day]) parts.push(DAY_LONG[fixture.day])
  if (fixture.time) parts.push(fixture.time)
  return parts.filter(Boolean).join(' · ')
}

function nextMatchLine(fixture) {
  const day = DAY_LONG[fixture.day]
  const place = VENUE_LABEL[fixture.venue] || 'Venue to be confirmed'
  const when = [day, fixture.time].filter(Boolean).join(', ')
  return when ? `${when} at ${place}` : place
}

function shareData(title, text, url) {
  const candidates = [
    { title, text, url },
    { text: `${title}. ${text}`, url },
    { url },
  ]
  if (typeof navigator.canShare !== 'function') return candidates[0]
  return candidates.find((data) => navigator.canShare(data)) || null
}

function ShareIcon() {
  return (
    <svg className="share-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3v10M8.5 6.5 12 3l3.5 3.5M6 11v8a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19v-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Team() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const navType = useNavigationType()
  const [shareNote, setShareNote] = useState('')
  const { status, weeks, catchups = [], open, instagram = {} } = useSchedule()
  const ready = status === 'ready'

  useLayoutEffect(() => {
    if (navType === 'POP') return
    window.scrollTo(0, 0)
  }, [slug, navType])

  useStackPage(null, ready)

  const horizon = teamHorizon(open)

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
      .filter((item) => String(item.week.startsOn || item.week.id) >= horizon)
      .flatMap((item) =>
        upcomingGames(team.name, item.fixtures, team.division).map((fixture) => ({
          ...fixture,
          weekLabel: item.week?.label || item.week?.rangeLabel,
          startsOn: item.week?.startsOn,
          routeId: item.week?.routeId,
        })),
      )
  }, [team, weeks, horizon])

  const rescheduled = useMemo(() => {
    if (!team) return []
    return catchups.filter(
      (game) =>
        (game.home === team.name || game.away === team.name) &&
        game.division === team.division,
    )
  }, [team, catchups])

  const history = useMemo(() => {
    if (!team) return []
    const games = weeks
      .filter((item) => String(item.week.startsOn || item.week.id) < horizon)
      .flatMap((item) =>
        item.fixtures.map((fixture) => ({
          ...fixture,
          weekLabel: item.week.label || item.week.rangeLabel,
          startsOn: item.week.startsOn,
        })),
      )
    return pastGames(team.name, games, team.division)
  }, [team, weeks, horizon])

  async function shareNextMatch() {
    if (!next) return
    const url = new URL(`/teams/${slug}`, window.location.origin).href
    const title = `${next.home} v ${next.away}`
    const text = nextMatchLine(next)
    const data = shareData(title, text, url)
    const phone = window.matchMedia('(max-width: 960px), (pointer: coarse)').matches
    if (data && typeof navigator.share === 'function') {
      try {
        await navigator.share(data)
        return
      } catch (error) {
        if (error?.name === 'AbortError' || phone) return
      }
    }
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`)
      setShareNote('Link copied')
    } catch {
      setShareNote(url)
    }
  }

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
  const instagramUrl = instagram[normalizeTeamKey(team.name)] || ''

  return (
    <>
      <button type="button" className="text-link" onClick={goBack}>
        ← Back
      </button>
      <p className="page-kicker">{team.division}</p>
      <h1 className="page-title team-title">{teamDisplayName(team.name, team.division)}</h1>
      {instagramUrl ? (
        <p className="team-instagram">
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            Team Instagram
          </a>
        </p>
      ) : null}

      <h2 className="section-title">Next game</h2>
      {next ? (
        <div className="next-game">
          <MatchCard fixture={next} />
          <button type="button" className="share-next" onClick={shareNextMatch}>
            <ShareIcon />
            Share next match
          </button>
          {shareNote ? <p className="share-note">{shareNote}</p> : null}
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
            <MatchCard key={fixture.id} fixture={fixture} quiet />
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
                  <small>{playedWhen(fixture)}</small>
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
