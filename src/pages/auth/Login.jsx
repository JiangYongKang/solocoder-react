import { useState } from 'react'
import { validateEmail, validateLoginPassword } from './validators'
import { setToken, setUser } from './authStorage'

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })

  const runValidation = (fieldName, valueEmail, valuePassword) => {
    const newErrors = { ...errors }
    if (fieldName === 'email' || fieldName === 'all') {
      newErrors.email = validateEmail(valueEmail)
    }
    if (fieldName === 'password' || fieldName === 'all') {
      newErrors.password = validateLoginPassword(valuePassword)
    }
    setErrors(newErrors)
    return newErrors
  }

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true })
    runValidation(field, email, password)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const newErrors = runValidation('all', email, password)
    if (newErrors.email || newErrors.password) return

    const token = 'mock_token_' + Date.now()
    const user = { email: email.trim(), nickname: email.trim().split('@')[0] }
    setToken(token)
    setUser(user)
    onLoginSuccess && onLoginSuccess()
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label" htmlFor="login-email">邮箱</label>
        <input
          id="login-email"
          className="auth-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="请输入邮箱"
        />
        {touched.email && errors.email && (
          <div className="auth-error">{errors.email}</div>
        )}
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="login-password">密码</label>
        <input
          id="login-password"
          className="auth-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => handleBlur('password')}
          placeholder="请输入密码"
        />
        {touched.password && errors.password && (
          <div className="auth-error">{errors.password}</div>
        )}
      </div>
      <button type="submit" className="auth-submit">登录</button>
    </form>
  )
}
