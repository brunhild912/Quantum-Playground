import { useEffect, useMemo, useState } from 'react'
import {
  formatRelativeTimestamp,
  type MeasurementRecord,
} from '../lib/measurementHistory'
import type { GateOperationRecord } from '../lib/gateOperationHistory'
import MissionCardIcon from './MissionCardIcon'

type MeasurementHistorySectionProps = {
  records: MeasurementRecord[]
  gateOperations?: GateOperationRecord[]
  isOpen: boolean
  onToggle: () => void
}

type MergedEntry =
  | { type: 'measurement'; record: MeasurementRecord; timestamp: number }
  | { type: 'gate'; record: GateOperationRecord; timestamp: number }

function MeasurementEntry({ record }: { record: MeasurementRecord }) {
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

      {record.registerLabel ? (
        <>
          <p className="measurement-history-label">Qubit</p>
          <p className="measurement-history-line">
            <span>{record.registerLabel}</span>
          </p>
        </>
      ) : null}

      <p className="measurement-history-time">{relative}</p>
    </div>
  )
}

function GateEntry({ record }: { record: GateOperationRecord }) {
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
      <p className="measurement-history-entry-title">Operation</p>

      <p className="measurement-history-result">{record.title}</p>

      {record.registerLabel ? (
        <>
          <p className="measurement-history-label">Qubit</p>
          <p className="measurement-history-line">
            <span>{record.registerLabel}</span>
          </p>
        </>
      ) : null}

      <p className="measurement-history-label">Rotation</p>
      <p className="measurement-history-line">
        <span>{record.rotation}</span>
      </p>

      <p className="measurement-history-label">Result</p>
      <p className="measurement-history-line">
        <span>{record.result}</span>
      </p>

      {record.observation ? (
        <>
          <p className="measurement-history-label">Observation</p>
          <p className="measurement-history-line">
            <span>{record.observation}</span>
          </p>
        </>
      ) : null}

      <p className="measurement-history-time">{relative}</p>
    </div>
  )
}

export default function MeasurementHistorySection({
  records,
  gateOperations = [],
  isOpen,
  onToggle,
}: MeasurementHistorySectionProps) {
  const panelId = 'mission-card-panel-measurement-history'

  const newestFirst = useMemo(() => {
    const merged: MergedEntry[] = [
      ...records.map((record) => ({
        type: 'measurement' as const,
        record,
        timestamp: record.timestamp,
      })),
      ...gateOperations.map((record) => ({
        type: 'gate' as const,
        record,
        timestamp: record.timestamp,
      })),
    ]
    return merged.sort((a, b) => b.timestamp - a.timestamp)
  }, [records, gateOperations])

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
              newestFirst.map((entry, i) => (
                <div key={entry.record.id}>
                  {i > 0 ? (
                    <div
                      className="measurement-history-divider"
                      aria-hidden="true"
                    />
                  ) : null}
                  {entry.type === 'measurement' ? (
                    <MeasurementEntry record={entry.record} />
                  ) : (
                    <GateEntry record={entry.record} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
