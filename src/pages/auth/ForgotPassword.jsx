import { useState, useEffect } from 'react'
import { validateEmail } from './validators'

export default function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        onBackToLogin && onBackToLogin()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [step, onBackToLogin])

  const handleBlur = () => {
    setTouched(true)
    setError(validateEmail(email))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    const err = validateEmail(email)
    setError(err)
    if (err) return
    setStep(2)
  }

  if (step === 2) {
    return (
      <div className="auth-result">
        <div className="auth-result-icon">✉️</div>
        <h3 className="auth-result-title">重置链接已发送</h3>
        <p className="auth-result-desc">请查收邮箱 {email}，点击邮件中的链接重置密码。</p>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label" htmlFor="forgot-email">邮箱</label>
        <input
          id="forgot-email"
          className="auth-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleBlur}
          placeholder="请输入注册时使用的邮箱"
        />
        {touched && error && <div className="auth-error">{error}</div>}
      </div>
      <button type="submit" className="auth-submit">发送重置链接</button>
    </form>
  )
}
