import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DIVISIONS } from '../constants.js'
import SearchBar from '../components/SearchBar.jsx'
import LeagueFilters from '../components/LeagueFilters.jsx'
import TeamLink from '../components/TeamLink.jsx'
import { buildLeagueTables, contrastText, divisionFromQuery, teamMatchesQuery } from '../lib/fixtures.js'
import { loadPastWeeks, peekPastWeeks } from '../lib/firebase.js'
import { readSnapshot, useStackPage } from '../lib/navStack.js'

export default function Tables() {
  const location = useLocation()
  const snap = readSnapshot(location.key)
  const cached = peekPastWeeks()
  const [fixtures, setFixtures] = useState(() =>
    cached ? cached.flatMap((item) => item.fixtures) : [],
  )
  const [ready, setReady] = useState(() => cached !== undefined)
  const [query, setQuery] = useState(snap?.query ?? '')
  const [league, setLeague] = useState(snap?.league ?? 'all')

  useEffect(() => {
    loadPastWeeks().then((weeks) => {
      setFixtures(weeks.flatMap((item) => item.fixtures))
      setReady(true)
    })
  }, [])

  useStackPage({ query, league }, ready)

  const tables = useMemo(() => buildLeagueTables(fixtures), [fixtures])
  const wantedDivision = divisionFromQuery(query)

  const divisions = DIVISIONS.filter((division) => {
    if (league !== 'all' && division.name !== league) return false
    if (wantedDivision && division.name !== wantedDivision) return false
    return tables.has(division.name)
  })

  const hasStandings = fixtures.length > 0

  return (
    <>
      <h1 className="page-title">Tables</h1>
      <p className="week-range">Semester standings from played matches</p>
      {!ready ? (
        <p className="lede">Loading tables…</p>
      ) : !hasStandings ? (
        <article className="placeholder-card">
          <h2>Coming soon</h2>
          <p>League tables will appear here once match results are published.</p>
        </article>
      ) : (
        <>
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search a team or division…"
      />
      <LeagueFilters value={league} onChange={setLeague} />

      {divisions.map((division) => {
        const rows = (tables.get(division.name) || []).filter((row) =>
          wantedDivision ? true : teamMatchesQuery(row, query),
        )
        if (!rows.length) return null

        return (
          <section
            className={
              wantedDivision === division.name
                ? 'league-table is-highlighted'
                : 'league-table'
            }
            key={division.name}
          >
            <header
              className="league-table-head"
              style={{ background: division.color, color: contrastText(division.color) }}
            >
              <h2>{division.name}</h2>
            </header>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th className="pos">#</th>
                    <th className="club">Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GD</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.name}>
                      <td className="pos">{index + 1}</td>
                      <td className="club">
                        <TeamLink className="team-link" name={row.name} />
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                      <td className="pts">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
        </>
      )}
    </>
  )
}
