import { useState } from 'react'
import ColorPicker from './ColorPicker.jsx'
import { DEFAULT_COLOR } from './constants.js'

export default function TagFormModal({
  open,
  mode = 'create',
  title = '新建标签',
  initialData = {},
  allTags = [],
  onConfirm,
  onCancel,
}) {
  const [name, setName] = useState(initialData.name || '')
  const [parentId, setParentId] = useState(
    initialData.parentId !== undefined ? initialData.parentId : null
  )
  const [color, setColor] = useState(initialData.color || DEFAULT_COLOR)
  const [errors, setErrors] = useState({})

  if (!open) return null

  const effectiveName = initialData.name !== undefined ? initialData.name : name
  const effectiveParentId =
    initialData.parentId !== undefined ? initialData.parentId : parentId
  const effectiveColor = initialData.color !== undefined ? initialData.color : color

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!effectiveName.trim()) {
      newErrors.name = '标签名称不能为空'
    }
    const parentTags = allTags.filter(
      (t) => t.parentId === (effectiveParentId || null) && t.id !== initialData.id
    )
    const duplicate = parentTags.some((t) => t.name.trim() === effectiveName.trim())
    if (duplicate) {
      newErrors.name = '同级标签下名称已存在'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onConfirm({
      name: effectiveName.trim(),
      parentId: effectiveParentId || null,
      color: effectiveColor,
    })
  }

  const availableParents = allTags.filter((t) => {
    if (t.id === initialData.id) return false
    return true
  })

  const parentOptions = [
    { id: null, name: '根标签' },
    ...availableParents.map((t) => ({ id: t.id, name: t.name })),
  ]

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <label className="form-label">标签名称</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入标签名称"
                autoFocus
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {mode === 'create' && (
              <div className="form-row">
                <label className="form-label">父级标签</label>
                <select
                  className="form-input"
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value || null)}
                >
                  {parentOptions.map((opt) => (
                    <option key={opt.id || 'root'} value={opt.id || ''}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-row">
              <label className="form-label">标签颜色</label>
              <ColorPicker
                value={color}
                onChange={setColor}
                onReset={() => setColor(DEFAULT_COLOR)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'create' ? '创建' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
