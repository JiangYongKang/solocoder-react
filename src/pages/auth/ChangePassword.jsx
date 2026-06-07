import { useState } from 'react'
import { validateRegisterPassword, validateConfirmPassword, validateLoginPassword } from './validators'

export default function ChangePassword({ onPasswordChanged }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [touched, setTouched] = useState({ oldPassword: false, newPassword: false, confirmPassword: false })
  const [success, setSuccess] = useState(false)

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value })
  }

  const runValidation = (fieldName) => {
    const newErrors = { ...errors }
    if (fieldName === 'oldPassword' || fieldName === 'all') {
      newErrors.oldPassword = validateLoginPassword(form.oldPassword)
    }
    if (fieldName === 'newPassword' || fieldName === 'all') {
      newErrors.newPassword = validateRegisterPassword(form.newPassword)
      if (!newErrors.newPassword && form.oldPassword && form.oldPassword === form.newPassword) {
        newErrors.newPassword = '新密码不能与旧密码相同'
      }
    }
    if (fieldName === 'confirmPassword' || fieldName === 'newPassword' || fieldName === 'all') {
      newErrors.confirmPassword = validateConfirmPassword(form.newPassword, form.confirmPassword)
    }
    setErrors(newErrors)
    return newErrors
  }

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true })
    runValidation(field)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched({ oldPassword: true, newPassword: true, confirmPassword: true })
    const newErrors = runValidation('all')
    if (newErrors.oldPassword || newErrors.newPassword || newErrors.confirmPassword) return

    setSuccess(true)
    setTimeout(() => {
      onPasswordChanged && onPasswordChanged()
    }, 1000)
  }

  if (success) {
    return (
      <div className="auth-result">
        <div className="auth-result-icon">✅</div>
        <h3 className="auth-result-title">密码修改成功</h3>
        <p className="auth-result-desc">即将退出登录并跳转至登录页...</p>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label" htmlFor="chg-old">旧密码</label>
        <input
          id="chg-old"
          className="auth-input"
          type="password"
          value={form.oldPassword}
          onChange={(e) => updateField('oldPassword', e.target.value)}
          onBlur={() => handleBlur('oldPassword')}
          placeholder="请输入旧密码"
        />
        {touched.oldPassword && errors.oldPassword && <div className="auth-error">{errors.oldPassword}</div>}
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="chg-new">新密码</label>
        <input
          id="chg-new"
          className="auth-input"
          type="password"
          value={form.newPassword}
          onChange={(e) => updateField('newPassword', e.target.value)}
          onBlur={() => handleBlur('newPassword')}
          placeholder="6-20位，需同时包含字母和数字"
        />
        {touched.newPassword && errors.newPassword && <div className="auth-error">{errors.newPassword}</div>}
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="chg-confirm">确认新密码</label>
        <input
          id="chg-confirm"
          className="auth-input"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          placeholder="请再次输入新密码"
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <div className="auth-error">{errors.confirmPassword}</div>
        )}
      </div>
      <button type="submit" className="auth-submit">修改密码</button>
    </form>
  )
}
