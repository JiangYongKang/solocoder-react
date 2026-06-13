import { useMemo, useState, useEffect } from 'react'
import { checkPasswordCharTypes, evaluatePasswordStrength } from './securityCenterCore'

export default function PasswordChecker({ onPasswordChange }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const strength = useMemo(() => evaluatePasswordStrength(password), [password])
  const charTypes = useMemo(() => checkPasswordCharTypes(password), [password])

  useEffect(() => {
    if (onPasswordChange) {
      onPasswordChange(password)
    }
  }, [password, onPasswordChange])

  const stars = Array.from({ length: 5 }, (_, i) => i < strength.stars)

  const checkItems = [
    { key: 'uppercase', label: '包含大写字母 (A-Z)', done: charTypes.uppercase },
    { key: 'lowercase', label: '包含小写字母 (a-z)', done: charTypes.lowercase },
    { key: 'number', label: '包含数字 (0-9)', done: charTypes.number },
    { key: 'special', label: '包含特殊字符 (!@#$% 等)', done: charTypes.special },
  ]

  return (
    <div>
      <div className="sc-section-header">
        <h2 className="sc-section-title">密码强度检测</h2>
      </div>

      <div className="sc-password-section">
        <div className="sc-password-input-row">
          <input
            type={showPassword ? 'text' : 'password'}
            className="sc-password-input"
            placeholder="请输入密码以检测强度..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="sc-btn sc-btn-sm"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '隐藏' : '显示'}
          </button>
        </div>

        {password && (
          <>
            <div className="sc-strength-display">
              <div className="sc-strength-bar-container">
                <div
                  className="sc-strength-bar-fill"
                  style={{
                    width: `${strength.progress}%`,
                    background: strength.color,
                  }}
                />
              </div>
              <div className="sc-strength-stars">
                {stars.map((filled, i) => (
                  <span key={i} className={`sc-star ${filled ? 'filled' : ''}`}>
                    ★
                  </span>
                ))}
              </div>
              <span
                className="sc-strength-level"
                style={{ background: strength.color }}
              >
                {strength.label}
              </span>
            </div>

            <div className="sc-password-suggestions">
              {checkItems.map((item) => (
                <div key={item.key} className="sc-password-suggestion">
                  <span
                    className="sc-password-suggestion-dot"
                    style={{
                      background: item.done ? '#10b981' : '#ef4444',
                    }}
                  />
                  <span style={{ color: item.done ? '#10b981' : undefined }}>
                    {item.done ? '✓' : '○'} {item.label}
                  </span>
                </div>
              ))}

              {strength.suggestions.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                  {strength.suggestions.map((s, i) => (
                    <div key={i} className="sc-password-suggestion">
                      <span
                        className="sc-password-suggestion-dot"
                        style={{ background: '#f59e0b' }}
                      />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!password && (
          <div className="sc-empty" style={{ padding: '20px' }}>
            请输入密码以检测强度
          </div>
        )}
      </div>
    </div>
  )
}
