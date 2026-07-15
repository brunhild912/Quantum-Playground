type GateInfoPanelProps = {
  readout: {
    title: string
    body: string[]
  }
  onClose: () => void
}

/** Compact educational readout — reuses measurement-result panel styling. */
export default function GateInfoPanel({ readout, onClose }: GateInfoPanelProps) {
  return (
    <aside
      className="measurement-result-panel gate-info-panel scrollbar-quantum"
      role="status"
      aria-live="polite"
      aria-label={readout.title}
    >
      <header className="measurement-result-header">
        <h2 className="measurement-result-title">{readout.title}</h2>
        <button
          type="button"
          className="measurement-result-close"
          onClick={onClose}
          aria-label="Close gate explanation"
        >
          ×
        </button>
      </header>

      <div className="measurement-result-rule" aria-hidden="true" />

      {readout.body.map((line) => (
        <p key={line} className="measurement-result-note">
          {line}
        </p>
      ))}
    </aside>
  )
}
