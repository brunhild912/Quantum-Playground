import LandingOverlay from './components/LandingOverlay'
import OpeningCurtain from './components/OpeningCurtain'
import Scene from './components/Scene'

export default function App() {
  return (
    <div className="app-shell">
      <div className="space-gradient pointer-events-none absolute inset-0" />
      <div className="vignette pointer-events-none absolute inset-0" />

      <section className="hero-stage" aria-label="Bloch Sphere exhibit">
        <Scene />
      </section>

      <LandingOverlay />
      <OpeningCurtain />
    </div>
  )
}
