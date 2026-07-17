import type { MeasurementOutcome } from './measureQubit'

/**
 * In-session measurement log entry.
 * Optional fields are reserved for future gates / multi-qubit work.
 */
export type MeasurementRecord = {
  id: string
  /** 1-based measurement number (Measurement #N). */
  index: number
  probabilityZero: number
  probabilityOne: number
  measuredState: MeasurementOutcome
  /** Epoch ms when collapse completed. */
  timestamp: number
  /** Future: gate applied immediately before this measurement. */
  appliedGate?: string | null
  /** Future: ordered gate sequence leading to this state. */
  gateSequence?: string[]
  /** Future: repeated-measurement batch id. */
  batchId?: string | null
  /** Future: two-qubit / register label. */
  registerLabel?: string | null
  /** Level 7D: correlated collapse in an entangled two-qubit state. */
  correlatedRegisterLabel?: string | null
  correlatedMeasuredState?: MeasurementOutcome | null
}

export function createMeasurementRecord(input: {
  index: number
  probabilityZero: number
  probabilityOne: number
  measuredState: MeasurementOutcome
  timestamp?: number
  registerLabel?: string | null
  correlatedRegisterLabel?: string | null
  correlatedMeasuredState?: MeasurementOutcome | null
}): MeasurementRecord {
  const timestamp = input.timestamp ?? Date.now()
  return {
    id: `measurement-${input.index}-${timestamp}`,
    index: input.index,
    probabilityZero: input.probabilityZero,
    probabilityOne: input.probabilityOne,
    measuredState: input.measuredState,
    timestamp,
    appliedGate: null,
    gateSequence: [],
    batchId: null,
    registerLabel: input.registerLabel ?? null,
    correlatedRegisterLabel: input.correlatedRegisterLabel ?? null,
    correlatedMeasuredState: input.correlatedMeasuredState ?? null,
  }
}

export function formatRelativeTimestamp(
  timestamp: number,
  now: number = Date.now(),
): string {
  const deltaSec = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (deltaSec < 8) return 'Just now'
  if (deltaSec < 60) return `${deltaSec}s ago`
  const deltaMin = Math.floor(deltaSec / 60)
  if (deltaMin < 60) return `${deltaMin}m ago`
  const deltaHr = Math.floor(deltaMin / 60)
  return `${deltaHr}h ago`
}
