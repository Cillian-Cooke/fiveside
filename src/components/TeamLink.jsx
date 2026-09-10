import { Link, useLocation } from 'react-router-dom'
import { freezeSnapshot } from '../lib/navStack.js'
import { teamSlug } from '../lib/teams.js'

export default function TeamLink({ name, className, children }) {
  const location = useLocation()

  return (
    <Link
      className={className}
      to={`/teams/${teamSlug(name)}`}
      onClick={() => freezeSnapshot(location.key)}
    >
      {children ?? name}
    </Link>
  )
}
