/**
 * Gate / operation log entries for the Mission Console history section.
 * Kept separate from measurement records but rendered alongside them.
 */
export type GateOperationRecord = {
  id: string
  /** 1-based gate operation number. */
  index: number
  kind: 'gate'
  gate: 'X' | 'H' | 'Y' | 'Z' | string
  title: string
  rotation: string
  result: string
  timestamp: number
  /** Future: full circuit prefix. */
  gateSequence?: string[]
}

export function createXGateOperationRecord(index: number): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-x-${index}-${timestamp}`,
    index,
    kind: 'gate',
    gate: 'X',
    title: 'Applied X Gate',
    rotation: '180° around X axis',
    result: 'State updated successfully.',
    timestamp,
    gateSequence: ['X'],
  }
}
