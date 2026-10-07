import { Link, useLocation } from 'react-router-dom'
import { freezeSnapshot } from '../lib/navStack.js'
import { teamDisplayName, teamSlug } from '../lib/teams.js'

export default function TeamLink({ name, division, className, children }) {
  const location = useLocation()

  return (
    <Link
      className={className}
      to={`/teams/${teamSlug(name, division)}`}
      onClick={() => freezeSnapshot(location.key)}
    >
      {children ?? teamDisplayName(name, division)}
    </Link>
  )
}
