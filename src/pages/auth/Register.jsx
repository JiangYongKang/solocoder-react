import { useState } from 'react'
import {
  validateEmail,
  validateRegisterPassword,
  validateConfirmPassword,
  validateNickname,
} from './validators'
import { setToken, setUser } from './authStorage'

export default function Register({ onRegisterSuccess }) {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', nickname: '' })
  const [errors, setErrors] = useState({ email: '', password: '', confirmPassword: '', nickname: '' })
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false, nickname: false })

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value })
  }

  const runValidation = (fieldName) => {
    const newErrors = { ...errors }
    if (fieldName === 'email' || fieldName === 'all') {
      newErrors.email = validateEmail(form.email)
    }
    if (fieldName === 'password' || fieldName === 'all') {
      newErrors.password = validateRegisterPassword(form.password)
    }
    if (fieldName === 'confirmPassword' || fieldName === 'password' || fieldName === 'all') {
      newErrors.confirmPassword = validateConfirmPassword(form.password, form.confirmPassword)
    }
    if (fieldName === 'nickname' || fieldName === 'all') {
      newErrors.nickname = validateNickname(form.nickname)
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
    setTouched({ email: true, password: true, confirmPassword: true, nickname: true })
    const newErrors = runValidation('all')
    if (newErrors.email || newErrors.password || newErrors.confirmPassword || newErrors.nickname) return

    const token = 'mock_token_' + Date.now()
    const user = { email: form.email.trim(), nickname: form.nickname.trim() }
    setToken(token)
    setUser(user)
    onRegisterSuccess && onRegisterSuccess()
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-email">邮箱</label>
        <input
          id="reg-email"
          className="auth-input"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="请输入邮箱"
        />
        {touched.email && errors.email && <div className="auth-error">{errors.email}</div>}
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-password">密码</label>
        <input
          id="reg-password"
          className="auth-input"
          type="password"
          value={form.password}
          onChange={(e) => updateField('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          placeholder="6-20位，需同时包含字母和数字"
        />
        {touched.password && errors.password && <div className="auth-error">{errors.password}</div>}
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-confirm">确认密码</label>
        <input
          id="reg-confirm"
          className="auth-input"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          placeholder="请再次输入密码"
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <div className="auth-error">{errors.confirmPassword}</div>
        )}
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-nickname">昵称</label>
        <input
          id="reg-nickname"
          className="auth-input"
          type="text"
          value={form.nickname}
          onChange={(e) => updateField('nickname', e.target.value)}
          onBlur={() => handleBlur('nickname')}
          placeholder="请输入昵称"
        />
        {touched.nickname && errors.nickname && <div className="auth-error">{errors.nickname}</div>}
      </div>
      <button type="submit" className="auth-submit">注册</button>
    </form>
  )
}
