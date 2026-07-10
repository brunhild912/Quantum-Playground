import type { MissionCardIcon as IconId } from '../content/observationLogTypes'

type MissionCardIconProps = {
  icon: IconId
}

export default function MissionCardIcon({ icon }: MissionCardIconProps) {
  return (
    <span className="mission-card-icon" aria-hidden="true">
      {icon === 'brief' && (
        <svg viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
      {icon === 'seeing' && (
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        </svg>
      )}
      {icon === 'discovery' && (
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2l1.2 3.6H13l-3 2.2 1.1 3.6L8 9.2 4.9 11.4 6 7.8 3 5.6h3.8L8 2z"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {icon === 'special' && (
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2v12M2 8h12M4.5 4.5l7 7M11.5 4.5l-7 7"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
      )}
      {icon === 'experiment' && (
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M6 3h4l1 4.5-2 5.5H7L5 7.5 6 3z"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path d="M5.5 7h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      )}
    </span>
  )
}
