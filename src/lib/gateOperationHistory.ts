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
  /** Which qubit produced this operation (Level 7A+). */
  registerLabel?: string | null
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

export function createHGateOperationRecord(index: number): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-h-${index}-${timestamp}`,
    index,
    kind: 'gate',
    gate: 'H',
    title: 'Applied Hadamard Gate',
    rotation: '180° around Hadamard axis',
    result: 'Superposition prepared.',
    timestamp,
    gateSequence: ['H'],
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

export function createTGateOperationRecord(index: number): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-t-${index}-${timestamp}`,
    index,
    kind: 'gate',
    gate: 'T',
    title: 'Applied T Gate',
    rotation: '+45°',
    result: 'Quantum state updated.',
    observation: 'Phase rotation. Measurement probabilities unchanged.',
    timestamp,
    gateSequence: ['T'],
  }
}

export function createCNOTOperationRecord(input: {
  index: number
  controlLabel: string
  targetLabel: string
  result: string
  entangled?: boolean
}): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-cnot-${input.index}-${timestamp}`,
    index: input.index,
    kind: 'gate',
    gate: 'CNOT',
    title: input.entangled ? 'Created Bell State' : 'Applied CNOT',
    rotation: `Control: ${input.controlLabel} → Target: ${input.targetLabel}`,
    result: input.result,
    observation: input.entangled
      ? 'Qubits are now entangled.'
      : `Control: ${input.controlLabel}. Target: ${input.targetLabel}.`,
    timestamp,
    gateSequence: ['CNOT'],
    registerLabel: `${input.controlLabel} → ${input.targetLabel}`,
  }
}
