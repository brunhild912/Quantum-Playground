export default function LandingOverlay({
  onBeginJourney,
  hidden,
}: {
  onBeginJourney: () => void
  hidden: boolean
}) {
  return (
    <>
      <nav className="mission-nav" aria-label="Mission">
        <p className="mission-label reveal-fade reveal-mission">Mission 1</p>
        <p className="mission-title reveal-fade reveal-genesis">Quantum Playground</p>
      </nav>

      <section className={hidden ? 'content-stage landing-hidden' : 'content-stage'}>
        <h1 className="hero-title reveal-fade reveal-title">Quantum Playground</h1>

        <p className="tagline reveal-fade reveal-tagline">See the Invisible.</p>

        <p className="body-text reveal-fade reveal-body">
          An interactive journey through the mathematics and beauty of quantum
          mechanics.
        </p>

        <button
          type="button"
          className="begin-button reveal-fade reveal-button"
          onClick={onBeginJourney}
        >
          Begin Journey
        </button>
      </section>
    </>
  )
}
