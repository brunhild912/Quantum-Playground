import { useMemo } from 'react'

type QuantumState = {
  ket: string
}

export default function ControlPanel({ state }: { state: QuantumState }) {
  const items = useMemo(() => [{ label: 'State', value: state.ket }], [state.ket])

  return (
    <div className="control-panel" role="region" aria-label="Quantum controls">
      {items.map((item) => (
        <div key={item.label} className="control-row">
          <span className="control-label">{item.label}</span>
          <span className="control-value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

