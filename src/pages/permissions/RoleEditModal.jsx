import { useState } from 'react'
import { validateRole } from './utils'
import PermissionTree from './PermissionTree'

export default function RoleEditModal({ role, allRoles, open, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions ? [...role.permissions] : [],
  })
  const [errors, setErrors] = useState({})

  if (!open) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handlePermissionChange = (permissions) => {
    setFormData((prev) => ({ ...prev, permissions }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validateRole(formData, allRoles, role ? role.id : null)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    onSave && onSave(role ? role.id : null, formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{role ? '编辑角色' : '新建角色'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">
              角色名称 <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.name ? 'has-error' : ''}`}
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="请输入角色名称"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-row">
            <label className="form-label">角色描述</label>
            <textarea
              className={`form-input form-textarea ${errors.description ? 'has-error' : ''}`}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="请输入角色描述（可选）"
              rows={3}
            />
            {errors.description && (
              <span className="form-error">{errors.description}</span>
            )}
          </div>

          <div className="form-row">
            <label className="form-label">分配权限</label>
            <div className="permission-tree-wrap">
              <PermissionTree
                checkedIds={formData.permissions}
                onChange={handlePermissionChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
