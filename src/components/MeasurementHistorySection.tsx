import { useEffect, useState } from 'react'
import {
  formatRelativeTimestamp,
  type MeasurementRecord,
} from '../lib/measurementHistory'
import MissionCardIcon from './MissionCardIcon'

type MeasurementHistorySectionProps = {
  records: MeasurementRecord[]
  isOpen: boolean
  onToggle: () => void
}

function HistoryEntry({ record }: { record: MeasurementRecord }) {
  const [relative, setRelative] = useState(() =>
    formatRelativeTimestamp(record.timestamp),
  )

  useEffect(() => {
    setRelative(formatRelativeTimestamp(record.timestamp))
    const id = window.setInterval(() => {
      setRelative(formatRelativeTimestamp(record.timestamp))
    }, 15000)
    return () => window.clearInterval(id)
  }, [record.timestamp])

  return (
    <div className="measurement-history-entry">
      <p className="measurement-history-entry-title">#{record.index}</p>

      <p className="measurement-history-label">Previous</p>
      <p className="measurement-history-line">
        <span>|0⟩</span>
        <span>{record.probabilityZero}%</span>
      </p>
      <p className="measurement-history-line">
        <span>|1⟩</span>
        <span>{record.probabilityOne}%</span>
      </p>

      <p className="measurement-history-label">Result</p>
      <p className="measurement-history-result">{record.measuredState}</p>

      <p className="measurement-history-time">{relative}</p>
    </div>
  )
}

export default function MeasurementHistorySection({
  records,
  isOpen,
  onToggle,
}: MeasurementHistorySectionProps) {
  const panelId = 'mission-card-panel-measurement-history'
  // Newest first for display; storage appends chronologically.
  const newestFirst = [...records].reverse()

  return (
    <article
      className={`mission-card${isOpen ? ' mission-card--open' : ''}`}
    >
      <button
        type="button"
        className="mission-card-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <MissionCardIcon icon="experiment" />
        <span className="mission-card-title">Measurement History</span>
        <span className="mission-card-chevron" aria-hidden="true" />
      </button>

      <div id={panelId} className="mission-card-panel" aria-hidden={!isOpen}>
        <div className="mission-card-panel-inner">
          <div className="mission-card-body measurement-history-body">
            {newestFirst.length === 0 ? (
              <p className="measurement-history-empty">
                No measurements yet.
                <br />
                Press MEASURE to observe your first quantum state.
              </p>
            ) : (
              newestFirst.map((record, i) => (
                <div key={record.id}>
                  {i > 0 ? (
                    <div
                      className="measurement-history-divider"
                      aria-hidden="true"
                    />
                  ) : null}
                  <HistoryEntry record={record} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
