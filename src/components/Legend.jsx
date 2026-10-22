import { divisionPalette } from '../constants.js'

export default function Legend() {
  return (
    <section className="legend" aria-label="Division colours">
      {divisionPalette().map((division) => (
        <div className="legend-item" key={division.name}>
          <span className="swatch" style={{ background: division.color }} />
          {division.name}
        </div>
      ))}
    </section>
  )
}
