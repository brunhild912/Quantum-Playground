import { useMemo } from 'react'
import { sphericalComponents } from '../lib/spherical'

function formatRadians(value: number): string {
  return value.toFixed(2)
}

function formatDegrees(value: number): string {
  return `${Math.round((value * 180) / Math.PI)}°`
}

type ControlPanelProps = {
  stateLabel: string
  theta: number
  phi: number
  onThetaChange: (value: number) => void
  onPhiChange: (value: number) => void
}

export default function ControlPanel({
  stateLabel,
  theta,
  phi,
  onThetaChange,
  onPhiChange,
}: ControlPanelProps) {
  const direction = useMemo(
    () => sphericalComponents(theta, phi),
    [theta, phi],
  )

  return (
    <div className="control-panel" role="region" aria-label="Quantum controls">
      <div className="control-row">
        <span className="control-label">State</span>
        <span className="control-value">{stateLabel}</span>
      </div>

      <label style={{ display: 'block', marginTop: '0.9rem' }}>
        <span className="control-label">
          θ = {formatRadians(theta)} rad ({formatDegrees(theta)})
        </span>
        <input
          type="range"
          min={0}
          max={Math.PI}
          step={0.01}
          value={theta}
          onChange={(e) => onThetaChange(Number(e.target.value))}
          style={{ width: '100%', marginTop: '0.35rem' }}
        />
      </label>

      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        <span className="control-label">
          φ = {formatRadians(phi)} rad ({formatDegrees(phi)})
        </span>
        <input
          type="range"
          min={0}
          max={Math.PI * 2}
          step={0.01}
          value={phi}
          onChange={(e) => onPhiChange(Number(e.target.value))}
          style={{ width: '100%', marginTop: '0.35rem' }}
        />
      </label>

      <div style={{ marginTop: '0.9rem' }}>
        <p className="control-label" style={{ marginBottom: '0.35rem' }}>
          Direction
        </p>
        <p className="control-value" style={{ fontSize: '0.75rem', opacity: 0.85 }}>
          x = {direction.x.toFixed(3)}
        </p>
        <p className="control-value" style={{ fontSize: '0.75rem', opacity: 0.85 }}>
          y = {direction.y.toFixed(3)}
        </p>
        <p className="control-value" style={{ fontSize: '0.75rem', opacity: 0.85 }}>
          z = {direction.z.toFixed(3)}
        </p>
      </div>
    </div>
  )
}
