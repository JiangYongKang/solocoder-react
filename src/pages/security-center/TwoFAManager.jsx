import { useEffect, useRef, useState } from 'react'
import { OPERATION_TYPES } from './constants'
import {
    generateBase32Secret,
    validateVerificationCode,
} from './securityCenterCore'

export default function TwoFAManager({ enabled, secret: initialSecret, onToggle, onRecord }) {
  const [showEnableModal, setShowEnableModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [currentSecret, setCurrentSecret] = useState(initialSecret || '')
  const [tempSecret, setTempSecret] = useState('')
  const [codeError, setCodeError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    setCurrentSecret(initialSecret || '')
  }, [initialSecret])

  const drawQrMock = (secret) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 180
    canvas.width = size
    canvas.height = size

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    const cellSize = 6
    const gridSize = Math.floor(size / cellSize)
    const seed = secret.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    let rand = seed
    const nextRand = () => {
      rand = (rand * 9301 + 49297) % 233280
      return rand / 233280
    }

    ctx.fillStyle = '#111827'
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (nextRand() > 0.5) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1)
        }
      }
    }

    const drawFinder = (ox, oy) => {
      ctx.fillStyle = '#111827'
      ctx.fillRect(ox, oy, cellSize * 7, cellSize * 7)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(ox + cellSize, oy + cellSize, cellSize * 5, cellSize * 5)
      ctx.fillStyle = '#111827'
      ctx.fillRect(ox + cellSize * 2, oy + cellSize * 2, cellSize * 3, cellSize * 3)
    }
    drawFinder(0, 0)
    drawFinder(size - cellSize * 7, 0)
    drawFinder(0, size - cellSize * 7)

    const cx = size / 2
    const cy = size / 2
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 20, cy - 20, 40, 40)
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(cx - 20, cy - 20, 40, 40)
    ctx.fillStyle = '#3b82f6'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('2FA', cx, cy)
  }

  const handleOpenEnable = () => {
    const newSecret = currentSecret || generateBase32Secret(16)
    setTempSecret(newSecret)
    setVerificationCode('')
    setCodeError('')
    setShowEnableModal(true)
    setTimeout(() => drawQrMock(newSecret), 10)
  }

  const handleCloseEnable = () => {
    setShowEnableModal(false)
    setVerificationCode('')
    setCodeError('')
  }

  const handleVerifyEnable = () => {
    const validation = validateVerificationCode(verificationCode)
    if (!validation.valid) {
      setCodeError(validation.error)
      return
    }
    onToggle(true, tempSecret)
    onRecord(OPERATION_TYPES.TWOFA_ENABLE, '已通过 Authenticator 应用验证并开启两步验证')
    handleCloseEnable()
  }

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(tempSecret)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      setCopySuccess(false)
    }
  }

  const handleOpenDisable = () => {
    setDisablePassword('')
    setVerificationCode('')
    setCodeError('')
    setShowDisableModal(true)
  }

  const handleCloseDisable = () => {
    setShowDisableModal(false)
    setDisablePassword('')
    setVerificationCode('')
    setCodeError('')
  }

  const handleConfirmDisable = () => {
    if (verificationCode) {
      const validation = validateVerificationCode(verificationCode)
      if (!validation.valid) {
        setCodeError(validation.error)
        return
      }
    } else if (!disablePassword) {
      setCodeError('请输入当前密码或 6 位验证码')
      return
    }
    onToggle(false, '')
    onRecord(OPERATION_TYPES.TWOFA_DISABLE, '已确认关闭两步验证')
    handleCloseDisable()
  }

  const formatSecret = (s) => {
    if (!s) return ''
    return s.match(/.{1,4}/g)?.join(' ') || s
  }

  const handleToggleClick = () => {
    if (enabled) {
      handleOpenDisable()
    } else {
      handleOpenEnable()
    }
  }

  return (
    <div>
      <div className="sc-section-header">
        <h2 className="sc-section-title">两步验证</h2>
        <span className={`sc-tfa-badge ${enabled ? 'sc-tfa-badge-on' : 'sc-tfa-badge-off'}`}>
          {enabled ? '已开启' : '已关闭'}
        </span>
      </div>

      <div className="sc-section-body" style={{ paddingTop: '12px' }}>
        <div className="sc-tfa-status">
          <div>
            <div className="sc-tfa-label">两步验证</div>
            <div className="sc-tfa-desc" style={{ marginTop: '4px' }}>
              {enabled
                ? '登录时除密码外还需输入动态验证码，大幅提升账户安全性'
                : '开启后，登录时除密码外还需输入 Authenticator 应用生成的动态验证码'}
            </div>
            {enabled && currentSecret && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text)' }}>
                密钥：<code>{formatSecret(currentSecret)}</code>
              </div>
            )}
          </div>

          <div
            className={`sc-toggle ${enabled ? 'active' : ''}`}
            onClick={handleToggleClick}
            role="switch"
            aria-checked={enabled}
          >
            <div className="sc-toggle-knob" />
          </div>
        </div>
      </div>

      {showEnableModal && (
        <div className="sc-modal-overlay" onClick={handleCloseEnable}>
          <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sc-modal-title">开启两步验证</h3>
            <div className="sc-modal-body">
              <div className="sc-qrcode-section">
                <canvas ref={canvasRef} className="sc-qrcode-canvas" />
                <div className="sc-qrcode-hint">请使用 Authenticator 应用扫描</div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '6px' }}>
                  或手动输入密钥：
                </div>
                <div className="sc-secret-row">
                  <span className="sc-secret-value">{formatSecret(tempSecret)}</span>
                  <button
                    type="button"
                    className="sc-btn sc-btn-sm"
                    onClick={handleCopySecret}
                  >
                    {copySuccess ? '已复制' : '复制'}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
                  输入 6 位验证码：
                </label>
                <div className="sc-verify-row">
                  <input
                    type="text"
                    className="sc-verify-input"
                    placeholder="000000"
                    value={verificationCode}
                    maxLength={6}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      setVerificationCode(val)
                      if (codeError) setCodeError('')
                    }}
                  />
                  <button
                    type="button"
                    className="sc-btn sc-btn-primary"
                    onClick={handleVerifyEnable}
                  >
                    验证
                  </button>
                </div>
                {codeError && (
                  <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '12px' }}>
                    {codeError}
                  </div>
                )}
              </div>
            </div>
            <div className="sc-modal-actions">
              <button className="sc-btn" onClick={handleCloseEnable}>取消</button>
            </div>
          </div>
        </div>
      )}

      {showDisableModal && (
        <div className="sc-modal-overlay" onClick={handleCloseDisable}>
          <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sc-modal-title">关闭两步验证</h3>
            <div className="sc-modal-body">
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#f97316',
                }}
              >
                ⚠️ 关闭两步验证会降低账户安全性，请谨慎操作。
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '6px' }}>
                方式一：输入当前密码
              </div>
              <input
                type="password"
                className="sc-password-input"
                placeholder="请输入当前登录密码"
                value={disablePassword}
                onChange={(e) => {
                  setDisablePassword(e.target.value)
                  if (codeError) setCodeError('')
                }}
                style={{ marginBottom: '12px', width: '100%' }}
              />

              <div style={{ textAlign: 'center', color: 'var(--text)', fontSize: '12px', margin: '8px 0' }}>
                —— 或 ——
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '6px' }}>
                方式二：输入 6 位验证码
              </div>
              <input
                type="text"
                className="sc-verify-input"
                placeholder="000000"
                value={verificationCode}
                maxLength={6}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  setVerificationCode(val)
                  if (codeError) setCodeError('')
                }}
                style={{ marginBottom: '8px', width: '140px' }}
              />

              {codeError && (
                <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '12px' }}>
                  {codeError}
                </div>
              )}
            </div>
            <div className="sc-modal-actions">
              <button className="sc-btn" onClick={handleCloseDisable}>取消</button>
              <button className="sc-btn sc-btn-danger" onClick={handleConfirmDisable}>
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
