import { VENUE_LABEL, divisionLabel } from '../constants.js'
import { isPlaceholderName } from '../data/knockouts.js'
import { canonicalMatchColor, contrastText } from '../lib/fixtures.js'
import TeamLink from './TeamLink.jsx'
import { teamDisplayName, teamShortName } from '../lib/teams.js'

function TeamName({ name, division, compact }) {
  const full = teamDisplayName(name, division)
  const body = compact ? (
    <>
      <span className="team-short">{teamShortName(name)}</span>
      <span className="team-full">{full}</span>
    </>
  ) : (
    full
  )
  if (isPlaceholderName(name)) {
    return <span className="team-name">{body}</span>
  }
  return (
    <TeamLink className="team-name team-link" name={name} division={division}>
      {body}
    </TeamLink>
  )
}

export default function MatchCard({
  fixture,
  compact = false,
  blank = false,
  quiet = false,
}) {
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
      <article
        className={`match-card unavailable ${compact ? 'grid-slot' : ''}`}
        aria-label={compact ? 'Unavailable' : undefined}
      >
        {compact ? null : <p className="closed-copy">Unavailable</p>}
      </article>
    )
  }

  const color = canonicalMatchColor(fixture)
  const text = contrastText(color)
  if (fixture.placeholder) {
    return (
      <article
        className={`match-card booking ${compact ? 'grid-slot' : ''} ${quiet ? 'quiet' : ''}`}
        style={quiet ? { '--accent': color } : { background: color, color: text }}
        aria-label={String(fixture.label || '').replace(/\s*\n\s*/g, ', ')}
      >
        {compact ? null : (
          <div className="card-meta">
            <span>{fixture.venue ? VENUE_LABEL[fixture.venue] : 'No slot yet'}</span>
            <span className="division-label">{divisionLabel(fixture.division)}</span>
          </div>
        )}
        <p className="booking-label">{fixture.label}</p>
      </article>
    )
  }

  const hasScore =
    typeof fixture.homeScore === 'number' && typeof fixture.awayScore === 'number'

  return (
    <article
      className={`match-card ${compact ? 'grid-slot' : ''} ${quiet ? 'quiet' : ''}`}
      style={quiet ? { '--accent': color } : { background: color, color: text }}
    >
      <div className="card-meta">
        {compact ? null : (
          <span>{fixture.venue ? VENUE_LABEL[fixture.venue] : 'No slot yet'}</span>
        )}
        <span className="division-label">
          {!compact && fixture.knockoutRound
            ? fixture.knockoutRound
            : divisionLabel(fixture.division, { short: compact })}
        </span>
      </div>
      <div className="teams">
        <TeamName name={fixture.home} division={fixture.division} compact={compact} />
        <div className="vs">v</div>
        <TeamName name={fixture.away} division={fixture.division} compact={compact} />
      </div>
      {hasScore ? (
        <p className="score">
          {fixture.homeScore} – {fixture.awayScore}
        </p>
      ) : null}
    </article>
  )
}
