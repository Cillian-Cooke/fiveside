import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { NAV } from '../constants.js'
import { ScheduleProvider } from '../lib/useSchedule.jsx'

export default function Layout() {
  const location = useLocation()
  return (
    <ScheduleProvider>
      <ScrollRestoration getKey={(loc) => loc.key} />
      <header className="site-header">
        <div className="brand-row">
          <p className="wordmark">TCD 5-A-SIDE</p>
        </div>
        <nav className="nav-scroll" aria-label="Site">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => {
                const onFixtures =
                  item.to === '/' &&
                  (location.pathname === '/' || location.pathname.startsWith('/week'))
                return isActive || onFixtures ? 'nav-link active' : 'nav-link'
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="site-footer">Trinity College Dublin · Botany Bay · Halls A & B</footer>
    </ScheduleProvider>
  )
}
