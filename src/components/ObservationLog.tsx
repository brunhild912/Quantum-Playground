import { useMemo, useState } from 'react'
import type { MissionConsoleContent } from '../content/observationLogTypes'
import { discoveryReadout } from '../lib/discoveryReadout'
import MissionCard from './MissionCard'

export type ObservationLogProps = {
  content: MissionConsoleContent
  theta: number
  phi: number
}

export default function ObservationLog({
  content,
  theta,
  phi,
}: ObservationLogProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const discoveryLines = useMemo(
    () => discoveryReadout(theta, phi),
    [theta, phi],
  )

  const togglePanel = () => {
    setPanelOpen((prev) => !prev)
  }

  const toggleCard = (cardId: string) => {
    setOpenCardId((prev) => (prev === cardId ? null : cardId))
  }

  const cardLines = (kind: string, staticLines?: string[]) => {
    if (kind === 'discovery') return discoveryLines
    return staticLines ?? []
  }

  return (
    <aside
      className={`observation-log${panelOpen ? ' observation-log--open' : ''}`}
      aria-label="Observation Log"
    >
      <button
        type="button"
        className="observation-log-header"
        onClick={togglePanel}
        aria-expanded={panelOpen}
        aria-controls="observation-log-body"
      >
        <div className="observation-log-header-top">
          <span className="observation-log-pulse" aria-hidden="true" />
          <span className="observation-log-heading">Observation Log</span>
          <span className="observation-log-chevron" aria-hidden="true" />
        </div>

        <div className="observation-log-meta">
          <span className="observation-log-meta-row">
            <span className="observation-log-meta-label">Mission</span>
            <span className="observation-log-meta-value">{content.missionName}</span>
          </span>
          <span className="observation-log-meta-divider" aria-hidden="true" />
          <span className="observation-log-meta-row">
            <span className="observation-log-meta-label">Status</span>
            <span className="observation-log-meta-value observation-log-meta-value--live">
              {content.status}
            </span>
          </span>
        </div>

        {!panelOpen ? (
          <p className="observation-log-teaser">{content.collapsedTeaser}</p>
        ) : null}
      </button>

      <div
        id="observation-log-body"
        className="observation-log-body"
        aria-hidden={!panelOpen}
      >
        <div className="observation-log-body-inner">
          <div className="observation-log-separator" aria-hidden="true" />
          {content.cards.map((card) => (
            <MissionCard
              key={card.id}
              id={card.id}
              title={card.title}
              icon={card.icon}
              lines={cardLines(
                card.kind,
                card.kind === 'static' ? card.lines : undefined,
              )}
              isOpen={openCardId === card.id}
              onToggle={() => toggleCard(card.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
