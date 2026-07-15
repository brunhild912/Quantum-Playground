import { useMemo, useState } from 'react'
import type { MissionConsoleContent } from '../content/observationLogTypes'
import type { MeasurementRecord } from '../lib/measurementHistory'
import type { GateOperationRecord } from '../lib/gateOperationHistory'
import { discoveryReadout } from '../lib/discoveryReadout'
import MissionBriefingIcon from './MissionBriefingIcon'
import MissionCard from './MissionCard'
import MeasurementHistorySection from './MeasurementHistorySection'

export type ObservationLogProps = {
  content: MissionConsoleContent
  theta: number
  phi: number
  measurementHistory?: MeasurementRecord[]
  gateOperations?: GateOperationRecord[]
}

type ConsoleView = 'closed' | 'open' | 'minimized'

export default function ObservationLog({
  content,
  theta,
  phi,
  measurementHistory = [],
  gateOperations = [],
}: ObservationLogProps) {
  const [view, setView] = useState<ConsoleView>('closed')
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const discoveryLines = useMemo(
    () => discoveryReadout(theta, phi),
    [theta, phi],
  )

  const toggleCard = (cardId: string) => {
    setOpenCardId((prev) => (prev === cardId ? null : cardId))
  }

  const cardLines = (kind: string, staticLines?: string[]) => {
    if (kind === 'discovery') return discoveryLines
    return staticLines ?? []
  }

  const openConsole = () => {
    if (view !== 'open') setView('open')
  }

  return (
    <>
      <button
        type="button"
        className={`mission-console-fab${view === 'open' ? ' mission-console-fab--active' : ''}`}
        onClick={openConsole}
        aria-label="Open Observation Log"
        aria-expanded={view === 'open'}
      >
        <MissionBriefingIcon className="mission-console-fab-icon" />
      </button>

      {view === 'open' ? (
        <div className="mission-console-backdrop" aria-hidden="true" />
      ) : null}

      {view === 'open' ? (
        <aside className="mission-console-window" aria-label="Observation Log">
          <header className="mission-console-window-header">
            <div className="mission-console-window-title-group">
              <span className="mission-console-window-pulse" aria-hidden="true" />
              <span className="mission-console-window-title">Observation Log</span>
            </div>

            <div className="mission-console-window-actions">
              <button
                type="button"
                className="mission-console-window-btn"
                onClick={() => setView('minimized')}
                aria-label="Minimize console"
              >
                —
              </button>
              <button
                type="button"
                className="mission-console-window-btn mission-console-window-btn--close"
                onClick={() => setView('closed')}
                aria-label="Close console"
              >
                ×
              </button>
            </div>
          </header>

          <div className="mission-console-window-meta">
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

          <div className="mission-console-window-body">
            <div className="observation-log-separator" aria-hidden="true" />
            <div className="observation-log-body-inner scrollbar-quantum">
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

              <MeasurementHistorySection
                records={measurementHistory}
                gateOperations={gateOperations}
                isOpen={openCardId === 'measurement-history'}
                onToggle={() => toggleCard('measurement-history')}
              />
            </div>
          </div>
        </aside>
      ) : null}
    </>
  )
}
