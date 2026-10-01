import { VENUE_LABEL } from '../constants.js'
import { canonicalMatchColor, contrastText } from '../lib/fixtures.js'
import TeamLink from './TeamLink.jsx'

export default function MatchCard({ fixture, compact = false, blank = false }) {
  if (blank) {
    return (
      <article
        className={`match-card blank ${compact ? 'grid-slot' : ''}`}
        aria-hidden="true"
      />
    )
  }

  if (!fixture) return null

  if (fixture.status === 'free') {
    return (
      <article className={`match-card free ${compact ? 'grid-slot' : ''}`}>
        <p className="free-copy">Free</p>
      </article>
    )
  }

  if (fixture.status === 'unavailable') {
    return (
      <article className={`match-card unavailable ${compact ? 'grid-slot' : ''}`}>
        <p className="closed-copy">Unavailable</p>
      </article>
    )
  }

  const color = canonicalMatchColor(fixture)
  const text = contrastText(color)
  const hasScore =
    typeof fixture.homeScore === 'number' && typeof fixture.awayScore === 'number'

  return (
    <article
      className={`match-card ${compact ? 'grid-slot' : ''}`}
      style={{ background: color, color: text }}
    >
      <div className="card-meta">
        <span>{VENUE_LABEL[fixture.venue]}</span>
        <span>{fixture.division}</span>
      </div>
      <div className="teams">
        <TeamLink className="team-name team-link" name={fixture.home}>
          {fixture.home}
        </TeamLink>
        <div className="vs">v</div>
        <TeamLink className="team-name team-link" name={fixture.away}>
          {fixture.away}
        </TeamLink>
      </div>
      {hasScore ? (
        <p className="score">
          {fixture.homeScore} – {fixture.awayScore}
        </p>
      ) : null}
    </article>
  )
}
