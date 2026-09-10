import { NavLink, Outlet, ScrollRestoration } from 'react-router-dom'
import { NAV } from '../constants.js'

export default function Layout() {
  return (
    <>
      <ScrollRestoration getKey={(location) => location.key} />
      <header className="site-header">
        <div className="brand-row">
          <p className="wordmark">TCD 5-A-SIDE</p>
          <button type="button" className="login-btn">
            Log in
          </button>
        </div>
        <nav className="nav-scroll" aria-label="Site">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
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
    </>
  )
}
