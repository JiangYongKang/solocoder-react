import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BACKGROUND_MODES,
  BACKGROUND_MODE_LABELS,
  GRADIENT_DIRECTION_LABELS,
  IMAGE_FIT_MODE_LABELS,
  SKIP_BUTTON_POSITION_LABELS,
  PRESET_COLORS,
  PRESET_SCREEN_RATIOS,
  MIN_LOGO_SIZE,
  MAX_LOGO_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_COUNTDOWN_SECONDS,
  MAX_COUNTDOWN_SECONDS,
  TEMPLATES,
} from './constants.js'
import {
  createDefaultConfig,
  loadLastConfig,
  saveLastConfig,
  loadSavedConfigs,
  saveConfigToList,
  deleteConfigFromList,
  renameConfigInList,
  deepMerge,
  deepClone,
  normalizeLogoSize,
  normalizeFontSize,
  normalizeCountdownSeconds,
  getTemplateById,
  applyTemplate,
  switchBackgroundMode,
  buildBackgroundStyle,
  getSkipButtonPositionStyle,
  getScreenDimensions,
  formatCountdownText,
  formatTimestamp,
  downloadConfigAsJson,
  fileToDataURL,
  parseJsonFile,
  validateLogoFile,
  validateImportedConfig,
  validateConfig,
} from './utils.js'
import './splash-config.css'

function SplashScreenPreview({ config, countdownValue, isAnimated = true, onSkip }) {
  const bgStyle = buildBackgroundStyle(config.background)
  const dims = getScreenDimensions(config.preview?.screenRatio || 'IPHONE_X')
  const scale = 300 / dims.width
  const height = dims.height * scale

  const titleStyle = {
    fontSize: config.brand.title.fontSize * scale,
    color: config.brand.title.color,
    fontWeight: config.brand.title.bold ? 700 : 400,
  }

  const subtitleStyle = {
    fontSize: config.brand.subtitle.fontSize * scale,
    color: config.brand.subtitle.color,
    fontWeight: config.brand.subtitle.bold ? 700 : 400,
  }

  const logoSize = config.brand.logo.size * scale

  const skipBtnStyle = {
    ...getSkipButtonPositionStyle(config.interaction.skipButton.position),
    color: config.interaction.skipButton.color,
    backgroundColor: config.interaction.skipButton.backgroundColor,
  }

  const logoStyle = isAnimated ? {} : { opacity: 1, animation: 'none' }
  const titleStyleFinal = isAnimated ? titleStyle : { ...titleStyle, opacity: 1, animation: 'none' }
  const subtitleStyleFinal = isAnimated ? subtitleStyle : { ...subtitleStyle, opacity: 1, animation: 'none' }

  return (
    <div className="phone-frame" style={{ width: 300 + 20 }}>
      <div className="phone-notch" />
      <div
        className="phone-screen"
        style={{
          width: 300,
          height,
        }}
      >
        <div className="splash-screen" style={bgStyle}>
          <div
            className="splash-logo"
            style={{
              width: logoSize,
              height: logoSize,
              ...logoStyle,
            }}
          >
            {config.brand.logo.image ? (
              <img
                src={config.brand.logo.image}
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div
                className="splash-logo-placeholder"
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: Math.max(10, logoSize * 0.3),
                }}
              >
                LOGO
              </div>
            )}
          </div>

          <h2 className="splash-title" style={titleStyleFinal}>
            {config.brand.title.text || '应用名称'}
          </h2>

          <p className="splash-subtitle" style={subtitleStyleFinal}>
            {config.brand.subtitle.text || 'Slogan'}
          </p>

          {config.interaction.skipButton.enabled && (
            <button
              className={`skip-btn-element ${config.interaction.skipButton.position}`}
              style={{
                ...skipBtnStyle,
                animation: isAnimated ? undefined : 'none',
                opacity: isAnimated ? undefined : 1,
              }}
              onClick={onSkip}
            >
              {config.interaction.countdown.enabled
                ? formatCountdownText(config.interaction.skipButton.text + (countdownValue != null ? ` ${config.interaction.countdown.format.replace('{n}', countdownValue)}` : ''), 0)
                    .replace(config.interaction.skipButton.text + ' ', '')
                    ? config.interaction.skipButton.text +
                      ' ' +
                      formatCountdownText(config.interaction.countdown.format, countdownValue)
                    : config.interaction.skipButton.text
                : config.interaction.skipButton.text}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FullscreenPreview({ config, onExit }) {
  const [countdown, setCountdown] = useState(config.interaction.countdown.seconds)
  const dims = getScreenDimensions(config.preview?.screenRatio || 'IPHONE_X')
  const maxWidth = Math.min(window.innerWidth - 80, dims.width)
  const scale = maxWidth / dims.width
  const previewHeight = dims.height * scale

  useEffect(() => {
    if (!config.interaction.countdown.enabled) return
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [config.interaction.countdown.enabled, countdown])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit])

  const bgStyle = buildBackgroundStyle(config.background)

  const titleStyle = {
    fontSize: config.brand.title.fontSize * scale,
    color: config.brand.title.color,
    fontWeight: config.brand.title.bold ? 700 : 400,
  }

  const subtitleStyle = {
    fontSize: config.brand.subtitle.fontSize * scale,
    color: config.brand.subtitle.color,
    fontWeight: config.brand.subtitle.bold ? 700 : 400,
  }

  const logoSize = config.brand.logo.size * scale

  const skipBtnStyle = {
    ...getSkipButtonPositionStyle(config.interaction.skipButton.position),
    color: config.interaction.skipButton.color,
    backgroundColor: config.interaction.skipButton.backgroundColor,
  }

  return (
    <div className="fullscreen-overlay" onClick={onExit}>
      <button className="exit-fullscreen-btn" onClick={onExit}>
        ESC 退出预览
      </button>
      <div className="fullscreen-phone" onClick={(e) => e.stopPropagation()}>
        <div
          className="phone-frame"
          style={{ width: maxWidth + 20, borderRadius: 36 * scale }}
        >
          <div
            className="phone-notch"
            style={{ width: 120 * scale, height: 24 * scale, borderRadius: `0 0 ${14 * scale}px ${14 * scale}px` }}
          />
          <div
            className="phone-screen"
            style={{ width: maxWidth, height: previewHeight, borderRadius: 28 * scale }}
          >
            <div className="splash-screen" style={bgStyle}>
              <div
                className="splash-logo"
                style={{
                  width: logoSize,
                  height: logoSize,
                }}
              >
                {config.brand.logo.image ? (
                  <img
                    src={config.brand.logo.image}
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div
                    className="splash-logo-placeholder"
                    style={{
                      width: '100%',
                      height: '100%',
                      fontSize: Math.max(10, logoSize * 0.3),
                    }}
                  >
                    LOGO
                  </div>
                )}
              </div>

              <h2 className="splash-title" style={titleStyle}>
                {config.brand.title.text || '应用名称'}
              </h2>

              <p className="splash-subtitle" style={subtitleStyle}>
                {config.brand.subtitle.text || 'Slogan'}
              </p>

              {config.interaction.skipButton.enabled && (
                <button
                  className={`skip-btn-element ${config.interaction.skipButton.position}`}
                  style={{
                    ...skipBtnStyle,
                    fontSize: 13 * scale,
                    padding: `${6 * scale}px ${14 * scale}px`,
                    borderRadius: 20 * scale,
                  }}
                  onClick={onExit}
                >
                  {config.interaction.countdown.enabled
                    ? config.interaction.skipButton.text +
                      (countdown > 0 ? ` ${formatCountdownText(config.interaction.countdown.format, countdown)}` : '')
                    : config.interaction.skipButton.text}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplateThumbnail({ template }) {
  const thumb = template.thumbnail || {}
  const bgStyle = thumb.bg?.startsWith('linear-gradient')
    ? { backgroundImage: thumb.bg }
    : { backgroundColor: thumb.bg || '#fff' }

  return (
    <div className="template-thumbnail" style={bgStyle}>
      <div className="template-thumb-logo" style={{ color: thumb.logoColor || '#333' }} />
      <div className="template-thumb-title" style={{ color: thumb.logoColor || '#333' }} />
      <div className="template-thumb-subtitle" style={{ color: thumb.logoColor || '#333' }} />
    </div>
  )
}

function ColorPicker({ value, onChange, showPresets = true }) {
  const [hexValue, setHexValue] = useState(() =>
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) ? value : value
  )
  const [lastValue, setLastValue] = useState(value)

  if (value !== lastValue) {
    setLastValue(value)
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)) {
      setHexValue(value)
    }
  }

  const handleHexChange = (e) => {
    const v = e.target.value
    setHexValue(v)
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) {
      onChange(v)
    }
  }

  return (
    <div>
      <div className="color-row">
        <div className="color-picker-wrapper">
          <input
            type="color"
            value={/^#([0-9A-Fa-f]{6})$/.test(hexValue) ? hexValue : '#ffffff'}
            onChange={(e) => {
              onChange(e.target.value)
              setHexValue(e.target.value)
            }}
          />
          <div className="color-picker-display" style={{ backgroundColor: value }} />
        </div>
        <input
          type="text"
          className="color-input-hex"
          value={hexValue}
          onChange={handleHexChange}
          placeholder="#FFFFFF"
        />
      </div>
      {showPresets && (
        <div className="preset-colors">
          {PRESET_COLORS.map((c) => (
            <div
              key={c}
              className={`preset-color-swatch ${value === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => {
                onChange(c)
                setHexValue(c)
              }}
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  return <div className={`toast ${toast.type}`}>{toast.message}</div>
}

function ConfirmModal({ modal, onClose, onConfirm }) {
  if (!modal) return null
  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal-title">{modal.title}</h3>
        <p className="confirm-modal-message">{modal.message}</p>
        <div className="confirm-modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            取消
          </button>
          <button className="primary-btn" onClick={onConfirm}>
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SplashConfigPage() {
  const navigate = useNavigate()
  const logoInputRef = useRef(null)
  const bgImageInputRef = useRef(null)
  const importInputRef = useRef(null)

  const [config, setConfig] = useState(() => {
    const saved = loadLastConfig()
    return saved || createDefaultConfig()
  })

  const [savedConfigs, setSavedConfigs] = useState(() => loadSavedConfigs())
  const [saveName, setSaveName] = useState('')
  const [toast, setToast] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(config.templateId)
  const [pendingTemplate, setPendingTemplate] = useState(null)
  const [renameId, setRenameId] = useState(null)
  const [renameText, setRenameText] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    saveLastConfig(config)
  }, [config])

  const updateConfig = useCallback((updater) => {
    setConfig((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : deepMerge(prev, updater)
      return next
    })
    setSelectedTemplateId(null)
  }, [])

  const handleLogoUpload = useCallback(async (file) => {
    if (!file) return
    const validation = validateLogoFile(file)
    if (!validation.valid) {
      showToast(validation.error, 'error')
      return
    }
    try {
      const dataUrl = await fileToDataURL(file)
      updateConfig((prev) => ({
        ...prev,
        brand: { ...prev.brand, logo: { ...prev.brand.logo, image: dataUrl } },
      }))
      showToast('Logo 上传成功', 'success')
    } catch {
      showToast('Logo 上传失败', 'error')
    }
  }, [updateConfig, showToast])

  const handleBackgroundImageUpload = useCallback(async (file) => {
    if (!file) return
    if (!file.type || !file.type.startsWith('image/')) {
      showToast('请上传图片文件', 'error')
      return
    }
    try {
      const dataUrl = await fileToDataURL(file)
      updateConfig((prev) => ({
        ...prev,
        background: { ...prev.background, image: dataUrl },
      }))
      showToast('背景图上传成功', 'success')
    } catch {
      showToast('背景图上传失败', 'error')
    }
  }, [updateConfig, showToast])

  const handleTemplateClick = useCallback(
    (templateId) => {
      if (templateId === selectedTemplateId) return
      const template = getTemplateById(templateId)
      if (!template) return
      setPendingTemplate(templateId)
      setConfirmModal({
        title: '切换模板',
        message: '切换模板将覆盖当前配置，是否继续？',
      })
    },
    [selectedTemplateId]
  )

  const confirmTemplateSwitch = useCallback(() => {
    if (pendingTemplate) {
      const newConfig = applyTemplate(createDefaultConfig(), pendingTemplate)
      setConfig(newConfig)
      setSelectedTemplateId(pendingTemplate)
      showToast('模板应用成功', 'success')
    }
    setPendingTemplate(null)
    setConfirmModal(null)
  }, [pendingTemplate, showToast])

  const handleSaveConfig = useCallback(() => {
    const name = saveName.trim()
    if (!name) {
      showToast('请输入配置名称', 'error')
      return
    }
    const newList = saveConfigToList(config, name)
    setSavedConfigs(newList)
    setSaveName('')
    showToast('配置已保存', 'success')
  }, [config, saveName, showToast])

  const handleLoadConfig = useCallback(
    (savedItem) => {
      setConfirmModal({
        title: '加载配置',
        message: `加载配置「${savedItem.name}」将覆盖当前配置，是否继续？`,
      })
      setPendingTemplate(savedItem)
    },
    []
  )

  const confirmLoadConfig = useCallback(() => {
    if (pendingTemplate && pendingTemplate.config) {
      setConfig(deepClone(pendingTemplate.config))
      setSelectedTemplateId(pendingTemplate.config.templateId || null)
      showToast('配置已加载', 'success')
    }
    setPendingTemplate(null)
    setConfirmModal(null)
  }, [pendingTemplate, showToast])

  const handleDeleteConfig = useCallback(
    (id, name) => {
      setConfirmModal({
        title: '删除配置',
        message: `确定要删除配置「${name}」吗？此操作不可恢复。`,
      })
      setPendingTemplate({ __delete: true, id })
    },
    []
  )

  const confirmDeleteConfig = useCallback(() => {
    if (pendingTemplate && pendingTemplate.__delete) {
      const newList = deleteConfigFromList(pendingTemplate.id)
      setSavedConfigs(newList)
      showToast('配置已删除', 'success')
    }
    setPendingTemplate(null)
    setConfirmModal(null)
  }, [pendingTemplate, showToast])

  const handleRenameConfig = useCallback((item) => {
    setRenameId(item.id)
    setRenameText(item.name)
  }, [])

  const handleRenameSubmit = useCallback(
    (id) => {
      const name = renameText.trim()
      if (!name) {
        showToast('名称不能为空', 'error')
        return
      }
      const newList = renameConfigInList(id, name)
      setSavedConfigs(newList)
      setRenameId(null)
      setRenameText('')
      showToast('重命名成功', 'success')
    },
    [renameText, showToast]
  )

  const handleExportJson = useCallback(() => {
    const filename = `splash-config-${formatTimestamp(Date.now()).replace(/[:\s]/g, '-')}.json`
    downloadConfigAsJson(config, filename)
    showToast('配置已导出', 'success')
  }, [config, showToast])

  const handleImportJson = useCallback(async (file) => {
    if (!file) return
    try {
      const parsed = await parseJsonFile(file)
      const validation = validateImportedConfig(parsed)
      if (!validation.valid) {
        showToast(validation.errors.join('；'), 'error')
        return
      }
      setConfig(validateConfig(parsed) ? parsed : createDefaultConfig())
      setSelectedTemplateId(parsed.templateId || null)
      showToast('配置导入成功', 'success')
    } catch (err) {
      showToast(err.message || '导入失败', 'error')
    }
  }, [showToast])

  const [previewCountdown, setPreviewCountdown] = useState(config.interaction.countdown.seconds)
  const [resetCounter, setResetCounter] = useState(0)
  const [lastTemplateId, setLastTemplateId] = useState(config.templateId)
  const [lastFullscreen, setLastFullscreen] = useState(isFullscreen)

  if (config.templateId !== lastTemplateId || isFullscreen !== lastFullscreen) {
    setLastTemplateId(config.templateId)
    setLastFullscreen(isFullscreen)
    setPreviewCountdown(config.interaction.countdown.seconds)
    setResetCounter((c) => c + 1)
  }

  useEffect(() => {
    if (!config.interaction.countdown.enabled) return
    const timer = setInterval(() => {
      setPreviewCountdown((c) => {
        if (c <= 1) return config.interaction.countdown.seconds
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [config.interaction.countdown.enabled, config.interaction.countdown.seconds, resetCounter])

  const handleCancelModal = useCallback(() => {
    setConfirmModal(null)
    setPendingTemplate(null)
  }, [])

  return (
    <div className="splash-config-page">
      <Toast toast={toast} />
      <ConfirmModal
        modal={confirmModal}
        onClose={handleCancelModal}
        onConfirm={() => {
          if (pendingTemplate && pendingTemplate.__delete) {
            confirmDeleteConfig()
          } else if (pendingTemplate && pendingTemplate.config) {
            confirmLoadConfig()
          } else {
            confirmTemplateSwitch()
          }
        }}
      />
      {isFullscreen && (
        <FullscreenPreview config={config} onExit={() => setIsFullscreen(false)} />
      )}

      <header className="splash-config-header">
        <div className="splash-config-header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>应用启动页配置器</h1>
        </div>
        <div className="splash-config-header-right">
          <button
            className="secondary-btn"
            onClick={() => importInputRef.current?.click()}
          >
            导入 JSON
          </button>
          <button className="secondary-btn" onClick={handleExportJson}>
            导出 JSON
          </button>
          <button className="primary-btn" onClick={() => setIsFullscreen(true)}>
            全屏预览
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden-input"
          onChange={(e) => {
            handleImportJson(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </header>

      <div className="splash-config-body">
        <aside className="editor-panel">
          <section className="editor-section">
            <h3 className="editor-section-title">模板</h3>
            <div className="template-grid">
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  className={`template-card ${selectedTemplateId === t.id ? 'selected' : ''}`}
                  onClick={() => handleTemplateClick(t.id)}
                  title={t.name}
                >
                  <TemplateThumbnail template={t} />
                  <div className="template-name">{t.name}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="editor-section">
            <h3 className="editor-section-title">品牌</h3>

            <div className="form-group">
              <label className="form-label">Logo 图片 (PNG/JPG/SVG，≤1MB)</label>
              {config.brand.logo.image ? (
                <div className="upload-preview">
                  <img src={config.brand.logo.image} alt="Logo" />
                  <button
                    className="upload-remove-btn"
                    onClick={() =>
                      updateConfig((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, logo: { ...prev.brand.logo, image: null } },
                      }))
                    }
                    title="移除"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  className="file-input-wrapper"
                  style={{ display: 'block' }}
                >
                  <div className="upload-area" onClick={() => logoInputRef.current?.click()}>
                    <div className="upload-icon">📁</div>
                    <p className="upload-text">点击上传 Logo</p>
                    <p className="upload-hint">支持 PNG、JPG、SVG，最大 1MB</p>
                  </div>
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                className="hidden-input"
                onChange={(e) => {
                  handleLogoUpload(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Logo 尺寸：{config.brand.logo.size}px
              </label>
              <div className="slider-row">
                <input
                  type="range"
                  className="slider-input"
                  min={MIN_LOGO_SIZE}
                  max={MAX_LOGO_SIZE}
                  value={config.brand.logo.size}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      brand: {
                        ...prev.brand,
                        logo: {
                          ...prev.brand.logo,
                          size: normalizeLogoSize(Number(e.target.value)),
                        },
                      },
                    }))
                  }
                />
                <span className="slider-value">{config.brand.logo.size}px</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">标题</label>
              <input
                type="text"
                className="text-input"
                value={config.brand.title.text}
                placeholder="应用名称"
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, title: { ...prev.brand.title, text: e.target.value } },
                  }))
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  字号：{config.brand.title.fontSize}px
                </label>
                <div className="slider-row">
                  <input
                    type="range"
                    className="slider-input"
                    min={MIN_FONT_SIZE}
                    max={MAX_FONT_SIZE}
                    value={config.brand.title.fontSize}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        brand: {
                          ...prev.brand,
                          title: {
                            ...prev.brand.title,
                            fontSize: normalizeFontSize(Number(e.target.value)),
                          },
                        },
                      }))
                    }
                  />
                  <span className="slider-value">{config.brand.title.fontSize}px</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">标题颜色</label>
              <ColorPicker
                value={config.brand.title.color}
                onChange={(c) =>
                  updateConfig((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, title: { ...prev.brand.title, color: c } },
                  }))
                }
              />
            </div>

            <div className="form-group">
              <div className="checkbox-row">
                <span className="checkbox-label">加粗</span>
                <div
                  className={`switch ${config.brand.title.bold ? 'active' : ''}`}
                  onClick={() =>
                    updateConfig((prev) => ({
                      ...prev,
                      brand: {
                        ...prev.brand,
                        title: { ...prev.brand.title, bold: !prev.brand.title.bold },
                      },
                    }))
                  }
                >
                  <div className="switch-knob" />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">副标题</label>
              <input
                type="text"
                className="text-input"
                value={config.brand.subtitle.text}
                placeholder="Slogan"
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    brand: {
                      ...prev.brand,
                      subtitle: { ...prev.brand.subtitle, text: e.target.value },
                    },
                  }))
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  字号：{config.brand.subtitle.fontSize}px
                </label>
                <div className="slider-row">
                  <input
                    type="range"
                    className="slider-input"
                    min={MIN_FONT_SIZE}
                    max={MAX_FONT_SIZE}
                    value={config.brand.subtitle.fontSize}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        brand: {
                          ...prev.brand,
                          subtitle: {
                            ...prev.brand.subtitle,
                            fontSize: normalizeFontSize(Number(e.target.value)),
                          },
                        },
                      }))
                    }
                  />
                  <span className="slider-value">{config.brand.subtitle.fontSize}px</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">副标题颜色</label>
              <ColorPicker
                value={config.brand.subtitle.color}
                onChange={(c) =>
                  updateConfig((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, subtitle: { ...prev.brand.subtitle, color: c } },
                  }))
                }
              />
            </div>

            <div className="form-group">
              <div className="checkbox-row">
                <span className="checkbox-label">加粗</span>
                <div
                  className={`switch ${config.brand.subtitle.bold ? 'active' : ''}`}
                  onClick={() =>
                    updateConfig((prev) => ({
                      ...prev,
                      brand: {
                        ...prev.brand,
                        subtitle: {
                          ...prev.brand.subtitle,
                          bold: !prev.brand.subtitle.bold,
                        },
                      },
                    }))
                  }
                >
                  <div className="switch-knob" />
                </div>
              </div>
            </div>
          </section>

          <section className="editor-section">
            <h3 className="editor-section-title">背景</h3>

            <div className="form-group">
              <div className="segmented-control">
                {Object.entries(BACKGROUND_MODE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    className={`segmented-btn ${config.background.mode === key ? 'active' : ''}`}
                    onClick={() =>
                      updateConfig((prev) => switchBackgroundMode(prev, key))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {config.background.mode === BACKGROUND_MODES.COLOR && (
              <div className="form-group">
                <label className="form-label">背景颜色</label>
                <ColorPicker
                  value={config.background.color}
                  onChange={(c) =>
                    updateConfig((prev) => ({
                      ...prev,
                      background: { ...prev.background, color: c },
                    }))
                  }
                />
              </div>
            )}

            {config.background.mode === BACKGROUND_MODES.IMAGE && (
              <>
                <div className="form-group">
                  <label className="form-label">背景图片</label>
                  {config.background.image ? (
                    <div className="upload-preview">
                      <img src={config.background.image} alt="Background" />
                      <button
                        className="upload-remove-btn"
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            background: { ...prev.background, image: null },
                          }))
                        }
                        title="移除"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      className="file-input-wrapper"
                      style={{ display: 'block' }}
                    >
                      <div
                        className="upload-area"
                        onClick={() => bgImageInputRef.current?.click()}
                      >
                        <div className="upload-icon">🖼️</div>
                        <p className="upload-text">点击上传背景图</p>
                        <p className="upload-hint">支持 JPG、PNG 等图片格式</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={bgImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden-input"
                    onChange={(e) => {
                      handleBackgroundImageUpload(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">填充模式</label>
                  <div className="segmented-control">
                    {Object.entries(IMAGE_FIT_MODE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        className={`segmented-btn ${config.background.imageFit === key ? 'active' : ''}`}
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            background: { ...prev.background, imageFit: key },
                          }))
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">无图时的背景色</label>
                  <ColorPicker
                    value={config.background.color}
                    onChange={(c) =>
                      updateConfig((prev) => ({
                        ...prev,
                        background: { ...prev.background, color: c },
                      }))
                    }
                    showPresets={false}
                  />
                </div>
              </>
            )}

            {config.background.mode === BACKGROUND_MODES.GRADIENT && (
              <>
                <div className="form-group">
                  <label className="form-label">起始颜色</label>
                  <ColorPicker
                    value={config.background.gradientStart}
                    onChange={(c) =>
                      updateConfig((prev) => ({
                        ...prev,
                        background: { ...prev.background, gradientStart: c },
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">结束颜色</label>
                  <ColorPicker
                    value={config.background.gradientEnd}
                    onChange={(c) =>
                      updateConfig((prev) => ({
                        ...prev,
                        background: { ...prev.background, gradientEnd: c },
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">渐变方向</label>
                  <div className="segmented-control">
                    {Object.entries(GRADIENT_DIRECTION_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        className={`segmented-btn ${config.background.gradientDirection === key ? 'active' : ''}`}
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            background: { ...prev.background, gradientDirection: key },
                          }))
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="editor-section">
            <h3 className="editor-section-title">交互</h3>

            <div className="form-group">
              <div className="checkbox-row">
                <span className="checkbox-label">启用倒计时</span>
                <div
                  className={`switch ${config.interaction.countdown.enabled ? 'active' : ''}`}
                  onClick={() =>
                    updateConfig((prev) => ({
                      ...prev,
                      interaction: {
                        ...prev.interaction,
                        countdown: {
                          ...prev.interaction.countdown,
                          enabled: !prev.interaction.countdown.enabled,
                        },
                      },
                    }))
                  }
                >
                  <div className="switch-knob" />
                </div>
              </div>
            </div>

            {config.interaction.countdown.enabled && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    倒计时秒数：{config.interaction.countdown.seconds}s
                  </label>
                  <div className="slider-row">
                    <input
                      type="range"
                      className="slider-input"
                      min={MIN_COUNTDOWN_SECONDS}
                      max={MAX_COUNTDOWN_SECONDS}
                      value={config.interaction.countdown.seconds}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          interaction: {
                            ...prev.interaction,
                            countdown: {
                              ...prev.interaction.countdown,
                              seconds: normalizeCountdownSeconds(Number(e.target.value)),
                            },
                          },
                        }))
                      }
                    />
                    <span className="slider-value">{config.interaction.countdown.seconds}s</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">文字格式（{'{n}'} 代表秒数）</label>
                  <input
                    type="text"
                    className="text-input"
                    value={config.interaction.countdown.format}
                    placeholder="跳过 {n}s"
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        interaction: {
                          ...prev.interaction,
                          countdown: {
                            ...prev.interaction.countdown,
                            format: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <div className="checkbox-row">
                <span className="checkbox-label">启用跳过按钮</span>
                <div
                  className={`switch ${config.interaction.skipButton.enabled ? 'active' : ''}`}
                  onClick={() =>
                    updateConfig((prev) => ({
                      ...prev,
                      interaction: {
                        ...prev.interaction,
                        skipButton: {
                          ...prev.interaction.skipButton,
                          enabled: !prev.interaction.skipButton.enabled,
                        },
                      },
                    }))
                  }
                >
                  <div className="switch-knob" />
                </div>
              </div>
            </div>

            {config.interaction.skipButton.enabled && (
              <>
                <div className="form-group">
                  <label className="form-label">按钮文字</label>
                  <input
                    type="text"
                    className="text-input"
                    value={config.interaction.skipButton.text}
                    placeholder="跳过"
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        interaction: {
                          ...prev.interaction,
                          skipButton: {
                            ...prev.interaction.skipButton,
                            text: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">按钮位置</label>
                  <div className="segmented-control">
                    {Object.entries(SKIP_BUTTON_POSITION_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        className={`segmented-btn ${config.interaction.skipButton.position === key ? 'active' : ''}`}
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            interaction: {
                              ...prev.interaction,
                              skipButton: {
                                ...prev.interaction.skipButton,
                                position: key,
                              },
                            },
                          }))
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">文字颜色</label>
                  <ColorPicker
                    value={config.interaction.skipButton.color}
                    onChange={(c) =>
                      updateConfig((prev) => ({
                        ...prev,
                        interaction: {
                          ...prev.interaction,
                          skipButton: { ...prev.interaction.skipButton, color: c },
                        },
                      }))
                    }
                    showPresets={false}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">背景颜色</label>
                  <ColorPicker
                    value={config.interaction.skipButton.backgroundColor}
                    onChange={(c) =>
                      updateConfig((prev) => ({
                        ...prev,
                        interaction: {
                          ...prev.interaction,
                          skipButton: { ...prev.interaction.skipButton, backgroundColor: c },
                        },
                      }))
                    }
                    showPresets={false}
                  />
                </div>
              </>
            )}
          </section>

          <section className="editor-section">
            <h3 className="editor-section-title">保存与导出</h3>

            <div className="form-group">
              <label className="form-label">配置名称</label>
              <div className="save-name-input-row">
                <input
                  type="text"
                  className="save-name-input"
                  placeholder="输入配置名称..."
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
                <button className="primary-btn" onClick={handleSaveConfig}>
                  保存
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">已保存配置</label>
              {savedConfigs.length === 0 ? (
                <div className="empty-hint">暂无保存的配置</div>
              ) : (
                <div className="config-list">
                  {savedConfigs.map((item) => (
                    <div key={item.id} className="config-list-item">
                      <div className="config-list-info">
                        {renameId === item.id ? (
                          <input
                            autoFocus
                            className="rename-input"
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            onBlur={() => handleRenameSubmit(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(item.id)
                              if (e.key === 'Escape') {
                                setRenameId(null)
                                setRenameText('')
                              }
                            }}
                          />
                        ) : (
                          <>
                            <p className="config-list-name">{item.name}</p>
                            <p className="config-list-time">
                              {formatTimestamp(item.timestamp)}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="config-list-actions">
                        <button
                          className="icon-btn"
                          title="加载"
                          onClick={() => handleLoadConfig(item)}
                        >
                          📂
                        </button>
                        <button
                          className="icon-btn"
                          title="重命名"
                          onClick={() => handleRenameConfig(item)}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn danger"
                          title="删除"
                          onClick={() => handleDeleteConfig(item.id, item.name)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="editor-section">
            <h3 className="editor-section-title">预览设置</h3>
            <div className="form-group">
              <label className="form-label">屏幕比例</label>
              <div className="segmented-control">
                {Object.entries(PRESET_SCREEN_RATIOS).map(([key]) => (
                  <button
                    key={key}
                    className={`segmented-btn ${config.preview?.screenRatio === key ? 'active' : ''}`}
                    onClick={() =>
                      updateConfig((prev) => ({
                        ...prev,
                        preview: { ...prev.preview, screenRatio: key },
                      }))
                    }
                  >
                    {key === 'IPHONE_X' ? 'iPhone' : 'Android'}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </aside>

        <main className="preview-panel">
          <div className="preview-toolbar">
            <div className="segmented-control" style={{ background: 'transparent' }}>
              {Object.entries(PRESET_SCREEN_RATIOS).map(([key, val]) => (
                <button
                  key={key}
                  className={`segmented-btn ${config.preview?.screenRatio === key ? 'active' : ''}`}
                  style={{
                    background: config.preview?.screenRatio === key ? '#fff' : 'rgba(255,255,255,0.6)',
                  }}
                  onClick={() =>
                    updateConfig((prev) => ({
                      ...prev,
                      preview: { ...prev.preview, screenRatio: key },
                    }))
                  }
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          <SplashScreenPreview
            key={resetCounter}
            config={config}
            countdownValue={previewCountdown}
            onSkip={() => showToast('已跳过启动页', 'info')}
          />
        </main>
      </div>
    </div>
  )
}
