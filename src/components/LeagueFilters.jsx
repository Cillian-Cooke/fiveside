import { LEAGUE_FILTERS } from '../constants.js'

export default function LeagueFilters({ value, onChange }) {
  return (
    <div className="league-filters" role="tablist" aria-label="Filter by league">
      {LEAGUE_FILTERS.map((league) => (
        <button
          key={league.id}
          type="button"
          className={value === league.id ? 'filter-chip is-on' : 'filter-chip'}
          onClick={() => onChange(league.id)}
        >
          {league.label}
        </button>
      ))}
    </div>
  )
}
