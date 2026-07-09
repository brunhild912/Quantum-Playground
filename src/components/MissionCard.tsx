import type { MissionCardDefinition } from '../content/observationLogTypes'

type MissionCardProps = {
  card: MissionCardDefinition
  isOpen: boolean
  onToggle: () => void
  liveReadout?: {
    label: string
    explanation: string
  }
}

export default function MissionCard({
  card,
  isOpen,
  onToggle,
  liveReadout,
}: MissionCardProps) {
  const panelId = `mission-card-panel-${card.id}`

  return (
    <article
      className={`mission-card${isOpen ? ' mission-card--open' : ''}`}
      data-kind={card.kind}
    >
      <button
        type="button"
        className="mission-card-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="mission-card-indicator" aria-hidden="true">
          {isOpen ? '◉' : '○'}
        </span>
        <span className="mission-card-heading">
          <span className="mission-card-title">{card.title}</span>
          <span className="mission-card-tagline">{card.tagline}</span>
        </span>
        <span className="mission-card-chevron" aria-hidden="true" />
      </button>

      <div
        id={panelId}
        className="mission-card-panel"
        aria-hidden={!isOpen}
      >
        <div className="mission-card-panel-inner">
          {card.kind === 'live-readout' && liveReadout ? (
            <div className="mission-card-live-readout">
              <p className="mission-card-state-value">{liveReadout.label}</p>
              <p className="mission-card-live-explanation">{liveReadout.explanation}</p>
            </div>
          ) : card.kind !== 'live-readout' ? (
            <div className="mission-card-body">
              {card.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
