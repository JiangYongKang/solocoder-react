import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateQRCode } from './qrcodeEncoder.js'
import { decodeQRImage } from './qrcodeDecoder.js'
import {
  loadHistory,
  saveHistory,
  addHistoryItem,
  deleteHistoryItem,
  clearHistory,
  renderQRToCanvas,
  drawLogoOnCanvas,
  downloadCanvas,
  loadImageFromFile,
  getImageData,
  truncateText,
  formatTimestamp,
  clamp,
} from './utils.js'
import { ERROR_CORRECTION_LEVELS, EC_LEVEL_ORDER } from './constants.js'
import './qrcode.css'

const MIN_SIZE = 150
const MAX_SIZE = 400
const DEFAULT_SIZE = 256
const MIN_LOGO_RATIO = 0.05
const MAX_LOGO_RATIO = 0.3
const DEFAULT_LOGO_RATIO = 0.2

function QRCodePage() {
  const navigate = useNavigate()

  const [text, setText] = useState('https://example.com')
  const [qrSize, setQrSize] = useState(DEFAULT_SIZE)
  const [ecLevel, setEcLevel] = useState(ERROR_CORRECTION_LEVELS.M)
  const [foreground, setForeground] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')
  const [logoImage, setLogoImage] = useState(null)
  const [logoRatio, setLogoRatio] = useState(DEFAULT_LOGO_RATIO)
  const [history, setHistory] = useState([])
  const [decodeResult, setDecodeResult] = useState(null)
  const [decodeError, setDecodeError] = useState(null)
  const [qrData, setQrData] = useState(null)

  const canvasRef = useRef(null)
  const textInputRef = useRef(null)
  const logoInputRef = useRef(null)
  const decodeInputRef = useRef(null)

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  useEffect(() => {
    saveHistory(history)
  }, [history])

  const generateQR = useCallback(() => {
    if (!text.trim()) {
      setQrData(null)
      return
    }
    try {
      const result = generateQRCode(text.trim(), ecLevel)
      setQrData(result)
    } catch (e) {
      console.error('QR generation error:', e)
      setQrData(null)
    }
  }, [text, ecLevel])

  useEffect(() => {
    generateQR()
  }, [generateQR])

  useEffect(() => {
    if (!qrData || !canvasRef.current) return
    renderQRToCanvas(qrData.matrix, canvasRef.current, qrSize, {
      foreground,
      background,
    })
    if (logoImage) {
      drawLogoOnCanvas(canvasRef.current, logoImage, logoRatio)
    }
  }, [qrData, qrSize, foreground, background, logoImage, logoRatio])

  const saveToHistory = useCallback(
    (type, content, extraOptions = {}) => {
      let thumbnail = null
      if (canvasRef.current && type === 'generate') {
        try {
          const thumbCanvas = document.createElement('canvas')
          renderQRToCanvas(qrData.matrix, thumbCanvas, 80, { foreground, background })
          if (logoImage) drawLogoOnCanvas(thumbCanvas, logoImage, logoRatio)
          thumbnail = thumbCanvas.toDataURL('image/png')
        } catch {
          thumbnail = null
        }
      }
      setHistory((prev) =>
        addHistoryItem(prev, {
          content,
          type,
          thumbnail,
          options: {
            ecLevel,
            qrSize,
            foreground,
            background,
            logoRatio,
            ...extraOptions,
          },
        })
      )
    },
    [qrData, logoImage, logoRatio, ecLevel, qrSize, foreground, background]
  )

  const handleDownload = () => {
    if (!canvasRef.current || !qrData) return
    downloadCanvas(canvasRef.current, `qrcode-${Date.now()}.png`)
    saveToHistory('generate', text)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const img = await loadImageFromFile(file)
      setLogoImage(img)
    } catch (err) {
      console.error('Logo load error:', err)
    }
    e.target.value = ''
  }

  const handleRemoveLogo = () => {
    setLogoImage(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleDecodeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDecodeError(null)
    setDecodeResult(null)
    try {
      const img = await loadImageFromFile(file)
      const imageData = getImageData(img)
      const result = decodeQRImage(imageData)
      setDecodeResult(result)
      saveToHistory('decode', result.text, { decodeVersion: result.version })
    } catch (err) {
      console.error('Decode error:', err)
      setDecodeError(err.message || '解析二维码失败，请确保图片清晰且包含有效的二维码')
    }
    e.target.value = ''
  }

  const handleHistoryClick = (item) => {
    setText(item.content)
    if (item.options) {
      if (item.options.ecLevel) setEcLevel(item.options.ecLevel)
      if (item.options.qrSize) setQrSize(clamp(item.options.qrSize, MIN_SIZE, MAX_SIZE))
      if (item.options.foreground) setForeground(item.options.foreground)
      if (item.options.background) setBackground(item.options.background)
      if (item.options.logoRatio) setLogoRatio(clamp(item.options.logoRatio, MIN_LOGO_RATIO, MAX_LOGO_RATIO))
    }
    if (textInputRef.current) {
      textInputRef.current.focus()
    }
  }

  const handleHistoryDelete = (e, id) => {
    e.stopPropagation()
    setHistory((prev) => deleteHistoryItem(prev, id))
  }

  const handleClearHistory = () => {
    if (history.length === 0) return
    if (window.confirm('确定要清空所有历史记录吗？')) {
      setHistory(clearHistory())
    }
  }

  return (
    <div className="qrcode-page">
      <div className="qrcode-header">
        <button className="qrcode-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="qrcode-title">二维码工具</h1>
      </div>

      <div className="qrcode-main">
        <div className="qrcode-panel">
          <h2 className="qrcode-panel-title">生成二维码</h2>

          <div className="qrcode-form-group">
            <label className="qrcode-form-label">文本内容</label>
            <textarea
              ref={textInputRef}
              className="qrcode-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入要生成二维码的文本或URL..."
            />
          </div>

          <div className="qrcode-form-group">
            <label className="qrcode-form-label">
              尺寸: {qrSize}px
            </label>
            <div className="qrcode-slider-container">
              <input
                type="range"
                className="qrcode-slider"
                min={MIN_SIZE}
                max={MAX_SIZE}
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
              />
              <span className="qrcode-slider-value">{qrSize}px</span>
            </div>
          </div>

          <div className="qrcode-form-group">
            <label className="qrcode-form-label">容错级别</label>
            <select
              className="qrcode-select"
              value={ecLevel}
              onChange={(e) => setEcLevel(e.target.value)}
            >
              {EC_LEVEL_ORDER.map((level) => (
                <option key={level} value={level}>
                  Level {level} ({{ L: '7%', M: '15%', Q: '25%', H: '30%' }[level]})
                </option>
              ))}
            </select>
          </div>

          <div className="qrcode-form-group">
            <label className="qrcode-form-label">颜色设置</label>
            <div className="qrcode-color-row">
              <div className="qrcode-color-input">
                <input
                  type="color"
                  value={foreground}
                  onChange={(e) => setForeground(e.target.value)}
                />
                <span className="qrcode-color-text">前景色</span>
              </div>
              <div className="qrcode-color-input">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                />
                <span className="qrcode-color-text">背景色</span>
              </div>
            </div>
          </div>

          <div className="qrcode-form-group">
            <label className="qrcode-form-label">Logo 图标 (可选)</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="qrcode-file-input"
              id="logo-upload"
              onChange={handleLogoUpload}
            />
            <label className="qrcode-file-label" htmlFor="logo-upload">
              点击上传 Logo 图片
            </label>
            {logoImage && (
              <div className="qrcode-logo-preview">
                <img src={logoImage.src} alt="Logo预览" />
                <button className="qrcode-logo-remove" onClick={handleRemoveLogo}>
                  移除 Logo
                </button>
              </div>
            )}
          </div>

          {logoImage && (
            <div className="qrcode-form-group">
              <label className="qrcode-form-label">
                Logo 大小: {Math.round(logoRatio * 100)}%
              </label>
              <div className="qrcode-slider-container">
                <input
                  type="range"
                  className="qrcode-slider"
                  min={MIN_LOGO_RATIO * 100}
                  max={MAX_LOGO_RATIO * 100}
                  value={logoRatio * 100}
                  onChange={(e) => setLogoRatio(Number(e.target.value) / 100)}
                />
                <span className="qrcode-slider-value">
                  {Math.round(logoRatio * 100)}%
                </span>
              </div>
            </div>
          )}

          <div className="qrcode-form-group">
            <label className="qrcode-form-label">解析二维码</label>
            <input
              ref={decodeInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif"
              className="qrcode-file-input"
              id="decode-upload"
              onChange={handleDecodeUpload}
            />
            <label className="qrcode-file-label" htmlFor="decode-upload">
              上传图片解析二维码
            </label>
            {decodeResult && (
              <div className="qrcode-decode-result">
                <p className="qrcode-decode-title">解析成功:</p>
                <p className="qrcode-decode-text">{decodeResult.text}</p>
              </div>
            )}
            {decodeError && <div className="qrcode-decode-error">{decodeError}</div>}
          </div>
        </div>

        <div className="qrcode-panel">
          <h2 className="qrcode-panel-title">预览</h2>
          <div className="qrcode-preview-area">
            <div className="qrcode-canvas-wrapper">
              {qrData ? (
                <canvas ref={canvasRef} className="qrcode-canvas" />
              ) : (
                <span style={{ color: '#999' }}>请输入内容生成二维码</span>
              )}
            </div>
            <div className="qrcode-actions">
              <button
                className="qrcode-btn qrcode-btn-primary"
                onClick={handleDownload}
                disabled={!qrData}
              >
                下载 PNG
              </button>
              <button
                className="qrcode-btn qrcode-btn-secondary"
                onClick={() => saveToHistory('generate', text)}
                disabled={!qrData}
              >
                保存到历史
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="qrcode-history">
        <div className="qrcode-history-header">
          <h2 className="qrcode-history-title">历史记录</h2>
          <button
            className="qrcode-clear-btn"
            onClick={handleClearHistory}
            disabled={history.length === 0}
          >
            清空全部
          </button>
        </div>
        {history.length === 0 ? (
          <div className="qrcode-history-empty">暂无历史记录</div>
        ) : (
          <div className="qrcode-history-list">
            {history.map((item) => (
              <div
                key={item.id}
                className="qrcode-history-item"
                onClick={() => handleHistoryClick(item)}
              >
                <div className="qrcode-history-thumb">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="预览" />
                  ) : (
                    <span className="qrcode-history-thumb-placeholder">
                      {item.type === 'decode' ? '解析' : 'QR'}
                    </span>
                  )}
                </div>
                <div className="qrcode-history-content">
                  <p className="qrcode-history-text">{truncateText(item.content)}</p>
                  <div className="qrcode-history-meta">
                    <span className={`qrcode-history-type ${item.type}`}>
                      {item.type === 'decode' ? '解析' : '生成'}
                    </span>
                    <span className="qrcode-history-time">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                </div>
                <button
                  className="qrcode-history-delete"
                  onClick={(e) => handleHistoryDelete(e, item.id)}
                  aria-label="删除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default QRCodePage
