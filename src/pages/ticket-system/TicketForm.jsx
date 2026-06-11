import { useState, useRef } from 'react'
import { CATEGORY_LABELS, PRIORITY_LABELS } from './constants.js'

const INITIAL_FORM = {
  title: '',
  category: '',
  priority: '',
  description: '',
}

function getFileTypeIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return '🖼'
  if (['pdf'].includes(ext)) return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx'].includes(ext)) return '📊'
  if (['zip', 'rar', '7z'].includes(ext)) return '📦'
  return '📎'
}

export default function TicketForm({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [attachments, setAttachments] = useState([])
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)
  const fileInputRef = useRef(null)

  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setAttachments([])
    setErrors({})
    setTouched(false)
  }

  const handleOpen = () => {
    resetForm()
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (touched) {
      setErrors((prev) => ({ ...prev, [field]: value.trim() ? undefined : prev[field] }))
    }
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const newAttachments = files.map((f) => ({
      name: f.name,
      type: f.type || 'application/octet-stream',
    }))
    setAttachments((prev) => [...prev, ...newAttachments])
    e.target.value = ''
  }

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const next = {}
    if (!formData.title.trim()) next.title = '请输入标题'
    if (!formData.category) next.category = '请选择分类'
    if (!formData.priority) next.priority = '请选择优先级'
    if (!formData.description.trim()) next.description = '请输入描述'
    return next
  }

  const handleSubmit = () => {
    setTouched(true)
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    onSave({
      title: formData.title.trim(),
      category: formData.category,
      priority: formData.priority,
      description: formData.description.trim(),
      attachments: attachments.map((a) => ({ name: a.name, type: a.type })),
    })
  }

  if (!isOpen) return null

  return (
    <div className="ts-modal-overlay" onClick={() => { onClose(); handleOpen() }}>
      <div className="ts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ts-modal-header">
          <h3 className="ts-modal-title">创建工单</h3>
          <button className="ts-modal-close" onClick={() => { onClose(); handleOpen() }}>✕</button>
        </div>
        <div className="ts-modal-body">
          <div className="ts-form-group">
            <label className="ts-form-label">
              标题<span className="ts-form-required">*</span>
            </label>
            <input
              type="text"
              className="ts-form-input"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            {errors.title && <div className="ts-form-error">{errors.title}</div>}
          </div>
          <div className="ts-form-group">
            <label className="ts-form-label">
              分类<span className="ts-form-required">*</span>
            </label>
            <select
              className="ts-form-select"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="">请选择分类</option>
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            {errors.category && <div className="ts-form-error">{errors.category}</div>}
          </div>
          <div className="ts-form-group">
            <label className="ts-form-label">
              优先级<span className="ts-form-required">*</span>
            </label>
            <select
              className="ts-form-select"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
            >
              <option value="">请选择优先级</option>
              {Object.entries(PRIORITY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            {errors.priority && <div className="ts-form-error">{errors.priority}</div>}
          </div>
          <div className="ts-form-group">
            <label className="ts-form-label">
              描述<span className="ts-form-required">*</span>
            </label>
            <textarea
              className="ts-form-textarea"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            {errors.description && <div className="ts-form-error">{errors.description}</div>}
          </div>
          <div className="ts-form-group">
            <label className="ts-form-label">附件</label>
            <div className="ts-attachment-area" onClick={handleFileClick}>
              点击上传附件
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            {attachments.length > 0 && (
              <div className="ts-attachment-list">
                {attachments.map((file, index) => (
                  <div key={index} className="ts-attachment-item">
                    <span className="ts-attachment-icon">{getFileTypeIcon(file.name)}</span>
                    {file.name}
                    <span className="ts-attachment-remove" onClick={() => handleRemoveAttachment(index)}>✕</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="ts-modal-footer">
          <button className="ts-btn" onClick={() => { onClose(); handleOpen() }}>取消</button>
          <button className="ts-btn ts-btn-primary" onClick={handleSubmit}>创建</button>
        </div>
      </div>
    </div>
  )
}
