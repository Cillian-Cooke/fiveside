import { useStackPage } from '../lib/navStack.js'

export default function Tournament() {
  useStackPage(null, true)

  return (
    <>
      <h1 className="page-title">Tournament</h1>
      <p className="week-range">Knockout brackets for every division</p>
      <article className="placeholder-card">
        <h2>Coming soon</h2>
        <p>Tournament tables will appear here once the cup draw is published.</p>
      </article>
    </>
  )
}
