import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './data-importer.css'
import StepIndicator from './components/StepIndicator.jsx'
import FileUploadStep from './components/FileUploadStep.jsx'
import FieldMappingStep from './components/FieldMappingStep.jsx'
import ValidationStep from './components/ValidationStep.jsx'
import ImportExecutionStep from './components/ImportExecutionStep.jsx'
import { STEPS, TARGET_FIELDS } from './constants.js'
import { validateMapping, applyMapping } from './utils.js'

export default function DataImporterPage() {
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [parsedData, setParsedData] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [mapping, setMapping] = useState({})
  const [mappedData, setMappedData] = useState([])
  const [validatedData, setValidatedData] = useState(null)
  const [importCompleted, setImportCompleted] = useState(false)

  const handleParsed = useCallback((data) => {
    setParsedData(data)
    setMapping({})
    setMappedData([])
    setValidatedData(null)
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep === 0) {
      if (!parsedData) return
      setCurrentStep(1)
    } else if (currentStep === 1) {
      const mappingValidation = validateMapping(mapping, TARGET_FIELDS)
      if (!mappingValidation.valid) return
      const mapped = applyMapping(parsedData.data, mapping, TARGET_FIELDS)
      setMappedData(mapped)
      setValidatedData(null)
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!validatedData) return
      setCurrentStep(3)
    }
  }, [currentStep, parsedData, mapping, validatedData])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
    setParsedData(null)
    setParseError(null)
    setMapping({})
    setMappedData([])
    setValidatedData(null)
    setImportCompleted(false)
  }, [])

  const handleValidatedDataChange = useCallback((data) => {
    setValidatedData(data)
  }, [])

  const handleImportComplete = useCallback(() => {
    setImportCompleted(true)
  }, [])

  const canGoNext = () => {
    if (currentStep === 0) {
      return !!parsedData
    }
    if (currentStep === 1) {
      const validation = validateMapping(mapping, TARGET_FIELDS)
      return validation.valid
    }
    if (currentStep === 2) {
      return !!validatedData && validatedData.stats.total > 0
    }
    return false
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <FileUploadStep
            parsedData={parsedData}
            onParsed={handleParsed}
            parseError={parseError}
            onParseError={setParseError}
          />
        )
      case 1:
        return (
          <FieldMappingStep
            sourceHeaders={parsedData?.headers || []}
            mapping={mapping}
            onMappingChange={setMapping}
          />
        )
      case 2:
        return (
          <ValidationStep
            mappedData={mappedData}
            onValidatedDataChange={handleValidatedDataChange}
          />
        )
      case 3:
        return (
          <ImportExecutionStep
            validatedRows={validatedData?.rows || []}
            onImportComplete={handleImportComplete}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="page data-importer-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="page-title">数据导入向导</h1>
      </div>

      <div className="importer-card">
        <StepIndicator currentStep={currentStep} />

        <div className="importer-body">
          {renderStepContent()}
        </div>

        <div className="importer-footer">
          <div>
            {currentStep > 0 && !importCompleted && (
              <button className="btn btn-secondary" onClick={handlePrev}>
                上一步
              </button>
            )}
          </div>
          <div className="importer-footer-right">
            {currentStep < STEPS.length - 1 && (
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!canGoNext()}
              >
                {currentStep === STEPS.length - 2 ? '开始数据校验' : '下一步'}
              </button>
            )}
            {currentStep === STEPS.length - 1 && importCompleted && (
              <>
                <button className="btn btn-secondary" onClick={handleReset}>
                  🔄 重新导入
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                  返回首页
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
