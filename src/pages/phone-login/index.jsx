import { useState, useEffect, useRef, useCallback } from 'react'
import './phone-login.css'
import {
  validatePhone,
  formatPhone,
  parsePhone,
  maskPhone,
  generateSmsCode,
  validateSmsCode,
  verifySmsCode,
  validateSliderPosition,
  generateSliderTarget,
  saveLoginInfo,
  getLoginInfo,
  isLoginExpired,
  clearLoginInfo,
  formatLoginTime,
  getProtocolText,
  SMS_COUNTDOWN_SECONDS,
  ERROR_LOCK_SECONDS,
  getCountdownButtonText,
  getNextCountdownValue,
  isCountdownActive,
  shouldResetOnPhoneChange,
  canRequestCode,
  getLockButtonText,
  getNextLockValue,
  isLocked,
  shouldTriggerLock,
} from './utils'

const CANVAS_WIDTH = 300
const CANVAS_HEIGHT = 150
const SLIDER_WIDTH = 42
const TRACK_WIDTH = 300
const PIECE_SIZE = 42

function drawCaptcha(canvas, targetX) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  const colors = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
  ]
  const picked = colors[Math.floor(Math.random() * colors.length)]
  gradient.addColorStop(0, picked[0])
  gradient.addColorStop(1, picked[1])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`
    const shapeType = Math.floor(Math.random() * 3)
    const x = Math.random() * CANVAS_WIDTH
    const y = Math.random() * CANVAS_HEIGHT
    const size = Math.random() * 40 + 20
    if (shapeType === 0) {
      ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    } else if (shapeType === 1) {
      ctx.rect(x, y, size, size * 0.6)
    } else {
      ctx.moveTo(x, y - size / 2)
      ctx.lineTo(x + size / 2, y + size / 2)
      ctx.lineTo(x - size / 2, y + size / 2)
      ctx.closePath()
    }
    ctx.fill()
  }

  const gapY = Math.floor(Math.random() * (CANVAS_HEIGHT - PIECE_SIZE - 20)) + 10

  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.beginPath()
  const r = PIECE_SIZE / 2 - 2
  const cx = targetX + r
  const cy = gapY + r
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r, cy - r)
  ctx.lineTo(cx + r, cy)
  ctx.arc(cx, cy, r, Math.PI * 0.5, Math.PI, false)
  ctx.lineTo(cx - r, cy + r)
  ctx.lineTo(cx - r, cy - r)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r, cy - r)
  ctx.lineTo(cx + r, cy)
  ctx.arc(cx, cy, r, Math.PI * 0.5, Math.PI, false)
  ctx.lineTo(cx - r, cy + r)
  ctx.lineTo(cx - r, cy - r)
  ctx.closePath()
  ctx.stroke()
  ctx.restore()

  return gapY
}

export default function PhoneLoginPage() {
  const initRef = useRef(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginInfo, setLoginInfo] = useState(null)

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      const info = getLoginInfo()
      if (info && !isLoginExpired(info.loginTime)) {
        setIsLoggedIn(true)
        setLoginInfo(info)
      }
    }
  }, [])

  const [phoneDisplay, setPhoneDisplay] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [smsError, setSmsError] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [hasRequestedBefore, setHasRequestedBefore] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [errorCount, setErrorCount] = useState(0)
  const [lockCountdown, setLockCountdown] = useState(0)

  const [showSlider, setShowSlider] = useState(false)
  const [sliderTargetX, setSliderTargetX] = useState(0)
  const [sliderX, setSliderX] = useState(0)
  const [sliderMsg, setSliderMsg] = useState('')
  const [sliderMsgType, setSliderMsgType] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const sliderDragStartX = useRef(0)
  const sliderCurrentX = useRef(0)
  const canvasRef = useRef(null)
  const sliderBtnRef = useRef(null)

  const [showProtocol, setShowProtocol] = useState(null)

  const countdownRef = useRef(null)
  const lockCountdownRef = useRef(null)
  const sliderSuccessTimerRef = useRef(null)
  const sliderFailTimerRef = useRef(null)
  const drawCaptchaTimerRef = useRef(null)

  const clearAllTimers = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    if (lockCountdownRef.current) {
      clearInterval(lockCountdownRef.current)
      lockCountdownRef.current = null
    }
    if (sliderSuccessTimerRef.current) {
      clearTimeout(sliderSuccessTimerRef.current)
      sliderSuccessTimerRef.current = null
    }
    if (sliderFailTimerRef.current) {
      clearTimeout(sliderFailTimerRef.current)
      sliderFailTimerRef.current = null
    }
    if (drawCaptchaTimerRef.current) {
      clearTimeout(drawCaptchaTimerRef.current)
      drawCaptchaTimerRef.current = null
    }
  }, [])

  const rawPhone = parsePhone(phoneDisplay)

  useEffect(() => {
    return clearAllTimers
  }, [clearAllTimers])

  useEffect(() => {
    if (!isCountdownActive(countdown)) return
    countdownRef.current = setInterval(() => {
      setCountdown((c) => getNextCountdownValue(c))
    }, 1000)
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [countdown])

  useEffect(() => {
    if (!isLocked(lockCountdown)) return
    lockCountdownRef.current = setInterval(() => {
      setLockCountdown((c) => {
        const next = getNextLockValue(c)
        if (next === 0) {
          setErrorCount(0)
        }
        return next
      })
    }, 1000)
    return () => {
      if (lockCountdownRef.current) {
        clearInterval(lockCountdownRef.current)
        lockCountdownRef.current = null
      }
    }
  }, [lockCountdown])

  const runPhoneValidation = useCallback((value) => {
    const phone = parsePhone(value)
    const err = validatePhone(phone)
    setPhoneError(err)
    return err
  }, [])

  const handlePhoneChange = (e) => {
    const value = e.target.value
    const digits = value.replace(/\D/g, '').slice(0, 11)
    const formatted = formatPhone(digits)
    setPhoneDisplay(formatted)
    if (phoneTouched) {
      runPhoneValidation(formatted)
    }
    if (shouldResetOnPhoneChange(rawPhone, digits, countdown)) {
      setCountdown(0)
      setHasRequestedBefore(false)
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }

  const handlePhoneBlur = () => {
    setPhoneTouched(true)
    runPhoneValidation(phoneDisplay)
  }

  const handleGetCode = () => {
    setPhoneTouched(true)
    const err = runPhoneValidation(phoneDisplay)
    if (err) return
    setSliderTargetX(generateSliderTarget(TRACK_WIDTH, SLIDER_WIDTH))
    setSliderX(0)
    setSliderMsg('')
    setSliderMsgType('')
    setShowSlider(true)
  }

  const closeSliderModal = useCallback(() => {
    if (sliderSuccessTimerRef.current) {
      clearTimeout(sliderSuccessTimerRef.current)
      sliderSuccessTimerRef.current = null
    }
    if (sliderFailTimerRef.current) {
      clearTimeout(sliderFailTimerRef.current)
      sliderFailTimerRef.current = null
    }
    setShowSlider(false)
  }, [])

  useEffect(() => {
    if (!showSlider) return
    drawCaptchaTimerRef.current = setTimeout(() => {
      if (canvasRef.current) {
        drawCaptcha(canvasRef.current, sliderTargetX)
      }
    }, 0)
    return () => {
      if (drawCaptchaTimerRef.current) {
        clearTimeout(drawCaptchaTimerRef.current)
        drawCaptchaTimerRef.current = null
      }
    }
  }, [showSlider, sliderTargetX])

  const startDrag = (clientX) => {
    setIsDragging(true)
    sliderDragStartX.current = clientX
    sliderCurrentX.current = sliderX
    setSliderMsg('')
    setSliderMsgType('')
  }

  const onSliderMouseDown = (e) => {
    e.preventDefault()
    startDrag(e.clientX)
  }

  const onSliderTouchStart = (e) => {
    if (e.touches.length > 0) {
      startDrag(e.touches[0].clientX)
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      const delta = e.clientX - sliderDragStartX.current
      let newX = sliderCurrentX.current + delta
      if (newX < 0) newX = 0
      if (newX > TRACK_WIDTH - SLIDER_WIDTH) newX = TRACK_WIDTH - SLIDER_WIDTH
      setSliderX(newX)
    }
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const delta = e.touches[0].clientX - sliderDragStartX.current
        let newX = sliderCurrentX.current + delta
        if (newX < 0) newX = 0
        if (newX > TRACK_WIDTH - SLIDER_WIDTH) newX = TRACK_WIDTH - SLIDER_WIDTH
        setSliderX(newX)
      }
    }
    const handleEnd = () => {
      setIsDragging(false)
      const passed = validateSliderPosition(sliderX, sliderTargetX)
      if (passed) {
        setSliderMsg('验证通过')
        setSliderMsgType('success')
        if (sliderSuccessTimerRef.current) {
          clearTimeout(sliderSuccessTimerRef.current)
        }
        sliderSuccessTimerRef.current = setTimeout(() => {
          sliderSuccessTimerRef.current = null
          setShowSlider(false)
          const code = generateSmsCode()
          console.log('[短信验证码] 发送到手机:', rawPhone, '验证码:', code)
          setGeneratedCode(code)
          setHasRequestedBefore(true)
          setCountdown(SMS_COUNTDOWN_SECONDS)
        }, 500)
      } else {
        setSliderMsg('验证失败，请重试')
        setSliderMsgType('error')
        if (sliderFailTimerRef.current) {
          clearTimeout(sliderFailTimerRef.current)
        }
        sliderFailTimerRef.current = setTimeout(() => {
          sliderFailTimerRef.current = null
          setSliderX(0)
          setSliderTargetX(generateSliderTarget(TRACK_WIDTH, SLIDER_WIDTH))
          setSliderMsg('')
          setSliderMsgType('')
        }, 800)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, sliderX, sliderTargetX, rawPhone])

  const handleSmsChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setSmsCode(value)
    if (smsError) setSmsError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setPhoneTouched(true)
    const phoneErr = runPhoneValidation(phoneDisplay)
    const smsErr = validateSmsCode(smsCode)

    if (phoneErr) return
    if (smsErr) {
      setSmsError(smsErr)
      return
    }
    if (!agreed) {
      setSmsError('请先阅读并同意相关协议')
      return
    }
    if (isLocked(lockCountdown)) return

    if (verifySmsCode(smsCode, generatedCode)) {
      saveLoginInfo(rawPhone)
      const info = getLoginInfo()
      setIsLoggedIn(true)
      setLoginInfo(info)
    } else {
      setSmsError('验证码错误，请重新输入')
      setSmsCode('')
      const newCount = errorCount + 1
      setErrorCount(newCount)
      if (shouldTriggerLock(newCount)) {
        setLockCountdown(ERROR_LOCK_SECONDS)
      }
    }
  }

  const handleLogout = () => {
    clearLoginInfo()
    setIsLoggedIn(false)
    setLoginInfo(null)
    setPhoneDisplay('')
    setSmsCode('')
    setPhoneError('')
    setSmsError('')
    setPhoneTouched(false)
    setAgreed(false)
    setCountdown(0)
    setHasRequestedBefore(false)
    setGeneratedCode('')
    setErrorCount(0)
    setLockCountdown(0)
  }

  const isPhoneValid = !validatePhone(rawPhone)
  const _canGetCode = canRequestCode(isPhoneValid, countdown)
  const canSubmit = isPhoneValid && smsCode.length === 6 && agreed && !isLocked(lockCountdown)

  if (isLoggedIn && loginInfo) {
    return (
      <div className="phone-login-container">
        <div className="phone-login-card phone-logged-card">
          <div className="phone-logged-avatar">
            {maskPhone(loginInfo.phone).charAt(0)}
          </div>
          <div className="phone-logged-phone">{maskPhone(loginInfo.phone)}</div>
          <div className="phone-logged-time">登录时间：{formatLoginTime(loginInfo.loginTime)}</div>
          <button className="phone-logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="phone-login-container">
      <div className="phone-login-card">
        <h1 className="phone-login-title">手机号登录</h1>
        <p className="phone-login-subtitle">输入手机号和验证码快速登录</p>

        <form className="phone-login-form" onSubmit={handleSubmit} noValidate>
          <div className="phone-field">
            <label className="phone-label" htmlFor="phone-input">手机号</label>
            <input
              id="phone-input"
              className={`phone-input ${phoneTouched && phoneError ? 'error' : ''}`}
              type="tel"
              value={phoneDisplay}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              placeholder="请输入手机号码"
              maxLength={13}
              autoComplete="tel"
            />
            {phoneTouched && phoneError && (
              <div className="phone-error">{phoneError}</div>
            )}
          </div>

          <div className="phone-field">
            <label className="phone-label" htmlFor="sms-input">验证码</label>
            <div className="phone-input-wrapper">
              <input
                id="sms-input"
                className={`phone-input phone-input-with-btn ${smsError ? 'error' : ''}`}
                type="text"
                value={smsCode}
                onChange={handleSmsChange}
                placeholder="请输入 6 位验证码"
                maxLength={6}
                autoComplete="one-time-code"
                disabled={!generatedCode}
              />
              <button
                type="button"
                className="phone-get-code-btn"
                onClick={handleGetCode}
                disabled={!_canGetCode}
              >
                {getCountdownButtonText(countdown, hasRequestedBefore)}
              </button>
            </div>
            {smsError && <div className="phone-error">{smsError}</div>}
            {isLocked(lockCountdown) && (
              <div className="phone-tip">错误次数过多，请 {lockCountdown} 秒后重试</div>
            )}
          </div>

          <div className="phone-agreement">
            <input
              type="checkbox"
              className="phone-checkbox"
              id="agreement-check"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="agreement-check" className="phone-agreement-text">
              我已阅读并同意
              <span className="phone-agreement-link" onClick={(e) => { e.preventDefault(); setShowProtocol('service') }}>《用户服务协议》</span>
              和
              <span className="phone-agreement-link" onClick={(e) => { e.preventDefault(); setShowProtocol('privacy') }}>《隐私政策》</span>
            </label>
          </div>

          <button
            type="submit"
            className="phone-submit-btn"
            disabled={!canSubmit}
          >
            {getLockButtonText(lockCountdown)}
          </button>
        </form>
      </div>

      {showSlider && (
        <div className="phone-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeSliderModal() }}>
          <div className="phone-modal">
            <div className="phone-modal-header">
              <span className="phone-modal-title">请完成安全验证</span>
              <button className="phone-modal-close" onClick={closeSliderModal}>×</button>
            </div>
            <div className="phone-modal-body">
              <div className="phone-slider-captcha">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="phone-slider-canvas"
                />
                <div className="phone-slider-track">
                  <div className="phone-slider-track-bg" style={{ width: sliderX + SLIDER_WIDTH }} />
                  <div className="phone-slider-track-tip" style={{ opacity: sliderX > 0 ? 0 : 1 }}>
                    向右拖动滑块完成拼图
                  </div>
                  <div
                    ref={sliderBtnRef}
                    className={`phone-slider-btn ${isDragging ? 'dragging' : ''}`}
                    style={{ transform: `translateX(${sliderX}px)` }}
                    onMouseDown={onSliderMouseDown}
                    onTouchStart={onSliderTouchStart}
                  >
                    →
                  </div>
                </div>
                <div className={`phone-slider-msg ${sliderMsgType}`}>{sliderMsg}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProtocol && (
        <div className="phone-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowProtocol(null) }}>
          <div className="phone-modal">
            <div className="phone-modal-header">
              <span className="phone-modal-title">
                {showProtocol === 'service' ? '用户服务协议' : '隐私政策'}
              </span>
              <button className="phone-modal-close" onClick={() => setShowProtocol(null)}>×</button>
            </div>
            <div className="phone-modal-body">
              <div className="phone-protocol-content">
                {getProtocolText(showProtocol)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
