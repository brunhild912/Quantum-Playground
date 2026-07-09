import { useState } from 'react'
import type { MissionConsoleContent } from '../content/observationLogTypes'
import MissionCard from './MissionCard'

export type ObservationLogProps = {
  content: MissionConsoleContent
  liveReadout: {
    label: string
    explanation: string
  }
}

export default function ObservationLog({
  content,
  liveReadout,
}: ObservationLogProps) {
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const toggleConsole = () => {
    setConsoleOpen((prev) => !prev)
  }

  const toggleCard = (cardId: string) => {
    setOpenCardId((prev) => (prev === cardId ? null : cardId))
  }

  return (
    <article
      className={`observation-console${consoleOpen ? ' observation-console--open' : ''}`}
      aria-label="Observation Log"
    >
      <button
        type="button"
        className="observation-console-trigger"
        onClick={toggleConsole}
        aria-expanded={consoleOpen}
        aria-controls="observation-console-body"
      >
        <span className="observation-console-status" aria-hidden="true">
          {consoleOpen ? '◉' : '○'}
        </span>
        <span className="observation-console-title">
          {consoleOpen ? 'MISSION LOG // OPEN' : 'MISSION LOG // LOCKED'}
        </span>
        <span className="observation-console-chevron" aria-hidden="true" />
      </button>

      {!consoleOpen ? (
        <div className="observation-console-preview">
          <p className="observation-console-preview-hint">{content.collapsedHint}</p>
          <p className="observation-console-preview-subhint">
            {content.collapsedSubhint}
          </p>
        </div>
      ) : null}

      <div
        id="observation-console-body"
        className="observation-console-body"
        aria-hidden={!consoleOpen}
      >
        <div className="observation-console-body-inner">
          {content.cards.map((card) => (
            <MissionCard
              key={card.id}
              card={card}
              isOpen={openCardId === card.id}
              onToggle={() => toggleCard(card.id)}
              liveReadout={
                card.kind === 'live-readout' ? liveReadout : undefined
              }
            />
          ))}
        </div>
      </div>
    </article>
  )
}
