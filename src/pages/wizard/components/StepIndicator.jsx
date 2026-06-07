import { STEP_NAMES } from '../data/cities'

export default function StepIndicator({ currentStep }) {
  return (
    <div className="wizard-steps">
      {STEP_NAMES.map((name, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const statusClass = isCompleted
          ? 'step-completed'
          : isActive
            ? 'step-active'
            : 'step-pending'

        return (
          <div className={`step-item ${statusClass}`} key={index}>
            <div className="step-number">
              {isCompleted ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="step-label">{name}</div>
            {index < STEP_NAMES.length - 1 && <div className="step-line" />}
          </div>
        )
      })}
    </div>
  )
}
