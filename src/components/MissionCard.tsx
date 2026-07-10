import type { MissionCardIcon as IconId } from '../content/observationLogTypes'
import MissionCardIcon from './MissionCardIcon'

type MissionCardProps = {
  id: string
  title: string
  icon: IconId
  lines: string[]
  isOpen: boolean
  onToggle: () => void
}

export default function MissionCard({
  id,
  title,
  icon,
  lines,
  isOpen,
  onToggle,
}: MissionCardProps) {
  const panelId = `mission-card-panel-${id}`

  return (
    <article className={`mission-card${isOpen ? ' mission-card--open' : ''}`}>
      <button
        type="button"
        className="mission-card-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <MissionCardIcon icon={icon} />
        <span className="mission-card-title">{title}</span>
        <span className="mission-card-chevron" aria-hidden="true" />
      </button>

      <div id={panelId} className="mission-card-panel" aria-hidden={!isOpen}>
        <div className="mission-card-panel-inner">
          <div className="mission-card-body">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
