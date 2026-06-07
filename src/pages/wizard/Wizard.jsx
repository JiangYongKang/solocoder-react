import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import StepIndicator from './components/StepIndicator'
import Step1BasicInfo from './components/Step1BasicInfo'
import Step2Address from './components/Step2Address'
import Step3Preferences from './components/Step3Preferences'
import Step4Review from './components/Step4Review'
import { validateStep } from './utils/validation'
import {
  loadDraft,
  saveDraft,
  clearDraft,
  createEmptyDraft,
} from './utils/storage'
import './Wizard.css'

const TOTAL_STEPS = 4

export default function Wizard() {
  const navigate = useNavigate()

  const [initialDraft] = useState(() => loadDraft())
  const [currentStep, setCurrentStep] = useState(initialDraft.currentStep)
  const [formData, setFormData] = useState(initialDraft.data)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    saveDraft({ currentStep, data: formData })
  }, [currentStep, formData])

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      return next
    })
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev }
        delete next[field]
        return next
      }
      return prev
    })
  }, [])

  const handleNext = () => {
    const validation = validateStep(currentStep, formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1)
      setErrors({})
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
      setErrors({})
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
    clearDraft()
  }

  const handleReset = () => {
    const empty = createEmptyDraft()
    setCurrentStep(empty.currentStep)
    setFormData(empty.data)
    setErrors({})
    setSubmitted(false)
    clearDraft()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1BasicInfo data={formData} errors={errors} onChange={handleChange} />
      case 1:
        return <Step2Address data={formData} errors={errors} onChange={handleChange} />
      case 2:
        return <Step3Preferences data={formData} errors={errors} onChange={handleChange} />
      case 3:
        return <Step4Review data={formData} />
      default:
        return null
    }
  }

  if (submitted) {
    return (
      <div className="page wizard-page">
        <h1 className="page-title">多步骤向导</h1>
        <div className="wizard-card">
          <div className="success-box">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="success-title">提交成功！</h2>
            <p className="success-desc">感谢您完成所有步骤，信息已成功提交。</p>
            <div className="success-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/')}>返回首页</button>
              <button className="btn btn-primary" onClick={handleReset}>重新开始</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page wizard-page">
      <h1 className="page-title">多步骤向导</h1>
      <div className="wizard-card">
        <StepIndicator currentStep={currentStep} />

        <div className="wizard-body">
          {renderStep()}
        </div>

        <div className="wizard-footer">
          <button
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            上一步
          </button>
          {currentStep < TOTAL_STEPS - 1 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              下一步
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit}>
              提交
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
