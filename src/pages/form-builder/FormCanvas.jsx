import { useState } from 'react'
import FormField from './FormField'

function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onDropField,
  onReorderFields,
  isPreview,
  formValues,
  onFormValueChange,
}) {
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleDragOver = (e) => {
    if (isPreview) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e) => {
    if (isPreview) return
    e.preventDefault()
    setDragOverIndex(null)
    const type = e.dataTransfer.getData('application/x-form-field-type')
    if (type) {
      onDropField(type)
    }
  }

  const handleFieldDragStart = (e, field, index) => {
    if (isPreview) return
    e.dataTransfer.setData('application/x-form-field-id', field.id)
    e.dataTransfer.setData('application/x-form-field-index', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleFieldDragOver = (e, index) => {
    if (isPreview) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'

    const rect = e.currentTarget.getBoundingClientRect()
    const isBefore = e.clientY < rect.top + rect.height / 2
    setDragOverIndex(isBefore ? index : index + 1)
  }

  const handleFieldDragLeave = (e) => {
    if (isPreview) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      setDragOverIndex(null)
    }
  }

  const handleFieldDrop = (e, targetIndex) => {
    if (isPreview) return
    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const isBefore = e.clientY < rect.top + rect.height / 2
    const insertIndex = isBefore ? targetIndex : targetIndex + 1

    setDragOverIndex(null)

    const draggedId = e.dataTransfer.getData('application/x-form-field-id')
    const fromIndexStr = e.dataTransfer.getData('application/x-form-field-index')
    if (draggedId && fromIndexStr !== '') {
      const fromIndex = Number(fromIndexStr)
      let adjustedTo = insertIndex
      if (fromIndex < adjustedTo) {
        adjustedTo -= 1
      }
      onReorderFields(fromIndex, adjustedTo)
    } else {
      const type = e.dataTransfer.getData('application/x-form-field-type')
      if (type) {
        onDropField(type, insertIndex)
      }
    }
  }

  const handleContainerDragLeave = (e) => {
    if (isPreview) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      setDragOverIndex(null)
    }
  }

  if (isPreview) {
    return (
      <div className="fb-canvas fb-canvas-preview">
        <h3 className="fb-canvas-title">表单预览</h3>
        {fields.length === 0 ? (
          <div className="fb-empty-hint">
            暂无字段，请先在左侧添加字段
          </div>
        ) : (
          <div className="fb-preview-form">
            {fields.map((field) => (
              <FormField
                key={field.id}
                field={field}
                isPreview={true}
                formValue={formValues[field.id]}
                onFormValueChange={onFormValueChange}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="fb-canvas"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleContainerDragLeave}
    >
      <h3 className="fb-canvas-title">画布区域</h3>
      {fields.length === 0 ? (
        <div className="fb-drop-placeholder">
          将左侧字段拖拽到此处添加
        </div>
      ) : (
        <div className="fb-field-container">
          {dragOverIndex === 0 && (
            <div className="fb-drop-indicator fb-drop-indicator-active" />
          )}
          {fields.map((field, index) => {
            const isSelected = selectedFieldId === field.id
            const showIndicatorAfter = dragOverIndex === index + 1
            return (
              <div key={field.id}>
                <div
                  className={`fb-canvas-field ${isSelected ? 'fb-field-selected' : ''}`}
                  draggable={!isPreview}
                  onDragStart={(e) => handleFieldDragStart(e, field, index)}
                  onDragOver={(e) => handleFieldDragOver(e, index)}
                  onDragLeave={handleFieldDragLeave}
                  onDrop={(e) => handleFieldDrop(e, index)}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectField(field.id)
                  }}
                >
                  <div className="fb-field-actions">
                    <span className="fb-field-drag-handle" title="拖动排序">
                      ⋮⋮
                    </span>
                    <button
                      type="button"
                      className="fb-field-delete"
                      title="删除字段"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteField(field.id)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <FormField field={field} isPreview={false} />
                </div>
                {showIndicatorAfter && (
                  <div className="fb-drop-indicator fb-drop-indicator-active" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FormCanvas
