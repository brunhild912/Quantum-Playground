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
  return (
    <div className="control-dock" role="region" aria-label="Quantum controls">
      <div className="control-dock-state">
        <span className="control-label">State</span>
        <span className="control-value">{stateLabel}</span>
      </div>

      <label className="control-dock-slider">
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
          className="control-dock-range"
        />
      </label>

      <label className="control-dock-slider">
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
          className="control-dock-range"
        />
      </label>
    </div>
  )
}
