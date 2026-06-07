import { useState } from 'react'
import { validateUser } from './utils'

export default function UserEditPanel({ user, allUsers, roles, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    roleIds: user?.roleIds ? [...user.roleIds] : [],
  })
  const [errors, setErrors] = useState({})

  if (!user) return null

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

  const toggleRole = (roleId) => {
    setFormData((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validateUser(formData, allUsers, user.id)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    onSave && onSave(user.id, formData)
  }

  return (
    <div className="user-edit-panel">
      <div className="panel-header">
        <h3 className="panel-title">编辑用户：{user.username}</h3>
        <button className="panel-close" onClick={onCancel}>
          ×
        </button>
      </div>
      <form className="panel-body" onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="form-label">
            用户名 <span className="required">*</span>
          </label>
          <input
            className={`form-input ${errors.username ? 'has-error' : ''}`}
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="请输入用户名"
          />
          {errors.username && (
            <span className="form-error">{errors.username}</span>
          )}
        </div>

        <div className="form-row">
          <label className="form-label">
            邮箱 <span className="required">*</span>
          </label>
          <input
            className={`form-input ${errors.email ? 'has-error' : ''}`}
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="请输入邮箱"
          />
          {errors.email && (
            <span className="form-error">{errors.email}</span>
          )}
        </div>

        <div className="form-row">
          <label className="form-label">分配角色</label>
          <div className="role-checkboxes">
            {roles.length === 0 ? (
              <span className="empty-hint">暂无角色，请先创建角色</span>
            ) : (
              roles.map((role) => (
                <label key={role.id} className="role-checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  <span className="role-checkbox-name">{role.name}</span>
                  {role.description && (
                    <span className="role-checkbox-desc">
                      - {role.description}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="btn btn-primary">
            保存
          </button>
        </div>
      </form>
    </div>
  )
}
