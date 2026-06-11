import { STEPS } from './constants.js'

export default function StepIndicator({ currentStep }) {
  return (
    <div className="step-indicator">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentStep
        const isCompleted = idx < currentStep
        return (
          <div
            key={step.id}
            className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div className="step-circle">
              {isCompleted ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <div className="step-title">{step.title}</div>
            <div className="step-desc">{step.description}</div>
          </div>
        )
      })}
    </div>
  )
}
