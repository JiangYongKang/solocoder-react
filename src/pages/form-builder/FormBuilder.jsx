import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import FieldPanel from './FieldPanel'
import FormCanvas from './FormCanvas'
import PropertyPanel from './PropertyPanel'
import {
  createField,
  reorderFields,
  deleteField,
  updateField,
  loadFromStorage,
  saveToStorage,
  exportToJsonSchema,
  downloadJsonSchema,
} from './formBuilderCore'
import './form-builder.css'

function FormBuilder() {
  const navigate = useNavigate()
  const [fields, setFields] = useState(() => {
    const saved = loadFromStorage()
    return saved.fields || []
  })
  const [selectedFieldId, setSelectedFieldId] = useState(null)
  const [isPreview, setIsPreview] = useState(false)
  const [formValues, setFormValues] = useState({})

  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage({ fields })
    }, 0)
    return () => clearTimeout(timer)
  }, [fields])

  const handleDropField = useCallback((type, insertIndex) => {
    const newField = createField(type)
    setFields((prev) => {
      if (typeof insertIndex === 'number') {
        const next = [...prev]
        next.splice(insertIndex, 0, newField)
        return next
      }
      return [...prev, newField]
    })
    setSelectedFieldId(newField.id)
  }, [])

  const handleReorderFields = useCallback((fromIndex, toIndex) => {
    setFields((prev) => reorderFields(prev, fromIndex, toIndex))
  }, [])

  const handleDeleteField = useCallback((fieldId) => {
    setFields((prev) => deleteField(prev, fieldId))
    setSelectedFieldId((prev) => (prev === fieldId ? null : prev))
  }, [])

  const handleSelectField = useCallback((fieldId) => {
    setSelectedFieldId(fieldId)
  }, [])

  const handleUpdateField = useCallback((fieldId, updates) => {
    setFields((prev) => updateField(prev, fieldId, updates))
  }, [])

  const handleExport = useCallback(() => {
    const schema = exportToJsonSchema(fields)
    downloadJsonSchema(schema)
  }, [fields])

  const handleFormValueChange = useCallback((fieldId, value) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }, [])

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null

  return (
    <div className="fb-page">
      <header className="fb-header">
        <div className="fb-header-left">
          <button
            type="button"
            className="fb-btn fb-btn-back"
            onClick={() => navigate('/')}
          >
            ← 返回
          </button>
          <h1 className="fb-title">表单构建器</h1>
        </div>
        <div className="fb-header-actions">
          <button
            type="button"
            className={`fb-btn ${isPreview ? 'fb-btn-primary' : ''}`}
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? '✏️ 编辑' : '👁 预览'}
          </button>
          <button
            type="button"
            className="fb-btn fb-btn-primary"
            onClick={handleExport}
          >
            ⬇ 导出 JSON
          </button>
        </div>
      </header>

      <div className="fb-main">
        {!isPreview && (
          <FieldPanel />
        )}

        <FormCanvas
          fields={fields}
          selectedFieldId={selectedFieldId}
          onSelectField={handleSelectField}
          onDeleteField={handleDeleteField}
          onDropField={handleDropField}
          onReorderFields={handleReorderFields}
          isPreview={isPreview}
          formValues={formValues}
          onFormValueChange={handleFormValueChange}
        />

        {!isPreview && (
          <PropertyPanel
            selectedField={selectedField}
            onUpdateField={handleUpdateField}
          />
        )}
      </div>
    </div>
  )
}

export default FormBuilder
