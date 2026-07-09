export default function LandingOverlay() {
  return (
    <>
      <nav className="mission-nav" aria-label="Mission">
        <p className="mission-label reveal-fade reveal-mission">Mission 01</p>
        <p className="mission-title reveal-fade reveal-genesis">Genesis</p>
      </nav>

      <section className="content-stage">
        <h1 className="hero-title reveal-fade reveal-title">Quantum Playground</h1>

        <p className="tagline reveal-fade reveal-tagline">See the Invisible.</p>

        <p className="body-text reveal-fade reveal-body">
          An interactive journey through the mathematics and beauty of quantum
          mechanics.
        </p>

        <button type="button" className="begin-button reveal-fade reveal-button">
          Begin Journey
        </button>
      </section>
    </>
  )
}
