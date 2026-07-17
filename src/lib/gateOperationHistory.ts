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

export function createBellPreparationRecord(input: {
  index: number
  bellLabel: string
  operations: string[]
}): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-bell-${input.index}-${timestamp}`,
    index: input.index,
    kind: 'gate',
    gate: 'BELL',
    title: 'Prepared Bell State',
    rotation: input.operations.join(' → '),
    result: input.bellLabel,
    observation: 'Status: Entangled',
    timestamp,
    gateSequence: input.operations,
    registerLabel: input.bellLabel,
  }
}

export function createBellMeasurementRecord(input: {
  index: number
  bellLabel: string
  outcome: string
}): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-bell-measure-${input.index}-${timestamp}`,
    index: input.index,
    kind: 'gate',
    gate: 'BELL_MEASURE',
    title: 'Measured Bell State',
    rotation: input.bellLabel,
    result: input.outcome,
    observation: `Outcome: ${input.outcome}`,
    timestamp,
    gateSequence: [],
    registerLabel: input.bellLabel,
  }
}

export function createTeleportationRecord(input: {
  index: number
  classicalBits: string
  correction: string
}): GateOperationRecord {
  const timestamp = Date.now()
  return {
    id: `gate-teleport-${input.index}-${timestamp}`,
    index: input.index,
    kind: 'gate',
    gate: 'TELEPORT',
    title: 'Quantum Teleportation',
    rotation: 'Prepared Bell Pair → Bell Measurement',
    result: 'Complete',
    observation: `Classical Bits: ${input.classicalBits}. ${input.correction}. State reconstructed on Bob.`,
    timestamp,
    gateSequence: [
      'Prepared Bell Pair',
      'Bell Measurement',
      `Classical Bits: ${input.classicalBits}`,
      input.correction,
      'State reconstructed on Bob',
    ],
    registerLabel: 'Alice → Bob',
  }
}

export function createBellCorrelationExperimentRecord(input: {
  index: number
  bellLabel: string
  trials: number
  agreementPercent: number
  oppositePercent: number
}): GateOperationRecord {
  const timestamp = Date.now()
  const dominant =
    input.agreementPercent >= input.oppositePercent
      ? `Agreement ${input.agreementPercent}%`
      : `Opposite ${input.oppositePercent}%`
  return {
    id: `gate-bell-corr-${input.index}-${timestamp}`,
    index: input.index,
    kind: 'gate',
    gate: 'BELL_CORR',
    title: 'Bell Correlation Experiment',
    rotation: input.bellLabel,
    result: dominant,
    observation: `Trials: ${input.trials}. Agreement ${input.agreementPercent}%. Opposite ${input.oppositePercent}%.`,
    timestamp,
    gateSequence: [
      `Bell State: ${input.bellLabel}`,
      `Trials: ${input.trials}`,
      dominant,
    ],
    registerLabel: input.bellLabel,
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
  const link = `${input.controlLabel} → ${input.targetLabel}`
  return {
    id: `gate-cnot-${input.index}-${timestamp}`,
    index: input.index,
    kind: 'gate',
    gate: 'CNOT',
    title: input.entangled ? 'Created Bell State' : 'Applied CNOT',
    rotation: input.entangled
      ? `H(${input.controlLabel}) → CNOT(${link})`
      : `Control: ${input.controlLabel} → Target: ${input.targetLabel}`,
    result: input.result,
    observation: input.entangled
      ? 'Status: Entangled'
      : `Control: ${input.controlLabel}. Target: ${input.targetLabel}.`,
    timestamp,
    gateSequence: input.entangled
      ? [`H(${input.controlLabel})`, `CNOT(${link})`]
      : ['CNOT'],
    registerLabel: link,
  }
}
