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
  /** Optional educational observation (e.g. phase vs probability). */
  observation?: string
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

export function createYGateOperationRecord(index: number): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-y-${index}-${timestamp}`,
    index,
    kind: 'gate',
    gate: 'Y',
    title: 'Applied Y Gate',
    rotation: '180° around Y axis',
    result: 'State updated.',
    timestamp,
    gateSequence: ['Y'],
  }
}

export function createZGateOperationRecord(index: number): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-z-${index}-${timestamp}`,
    index,
    kind: 'gate',
    gate: 'Z',
    title: 'Applied Z Gate',
    rotation: '180° around Z axis',
    result: 'State updated successfully.',
    observation:
      'Measurement probabilities remained unchanged. The quantum phase changed.',
    timestamp,
    gateSequence: ['Z'],
  }
}

export function createSGateOperationRecord(index: number): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-s-${index}-${timestamp}`,
    index,
    kind: 'gate',
    gate: 'S',
    title: 'Applied S Gate',
    rotation: '+90°',
    result: 'Quantum state updated.',
    observation: 'Phase rotation. Measurement probabilities unchanged.',
    timestamp,
    gateSequence: ['S'],
  }
}
