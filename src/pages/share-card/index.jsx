import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TEMPLATES,
  PRESET_COLORS,
  BACKGROUND_MODES,
  GRADIENT_DIRECTION_LABELS,
  TEXT_ALIGNMENT_LABELS,
  CARD_SIZE_LABELS,
  CARD_SIZES,
} from './constants.js'
import {
  createDefaultConfig,
  deepMerge,
  switchBackgroundMode,
  applyTemplate,
  loadImageFromFile,
  imageToDataURL,
  dataURLToImage,
  saveLastConfig,
  loadLastConfig,
  loadSavedConfigs,
  saveConfigToList,
  deleteConfigFromList,
  deserializeConfig,
  formatTimestamp,
} from './utils.js'
import {
  renderShareCard,
  downloadCanvasAsPNG,
  copyCanvasToClipboard,
} from './canvasRenderer.js'
import './share-card.css'

function ShareCardGenerator() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const logoInputRef = useRef(null)
  const bgInputRef = useRef(null)

  const [config, setConfig] = useState(() => {
    const saved = loadLastConfig()
    return saved || createDefaultConfig()
  })

  const [backgroundImage, setBackgroundImage] = useState(null)
  const [logoImage, setLogoImage] = useState(null)
  const [savedConfigs, setSavedConfigs] = useState(() => loadSavedConfigs())
  const [toast, setToast] = useState(null)

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return
    renderShareCard(canvasRef.current, config, {
      backgroundImage,
      logoImage,
    })
  }, [config, backgroundImage, logoImage])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  useEffect(() => {
    saveLastConfig(config)
  }, [config])

  useEffect(() => {
    if (config.background.image) {
      dataURLToImage(config.background.image).then((img) => {
        setBackgroundImage(img)
      }).catch(() => {
        // ignore image load errors
      })
    } else {
      const timer = setTimeout(() => setBackgroundImage(null), 0)
      return () => clearTimeout(timer)
    }
  }, [config.background.image])

  useEffect(() => {
    if (config.logo.image) {
      dataURLToImage(config.logo.image).then((img) => {
        setLogoImage(img)
      }).catch(() => {
        // ignore image load errors
      })
    } else {
      const timer = setTimeout(() => setLogoImage(null), 0)
      return () => clearTimeout(timer)
    }
  }, [config.logo.image])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const updateConfig = (updater) => {
    setConfig((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : deepMerge(prev, updater)
      next.templateId = null
      return next
    })
  }

  const handleTemplateClick = (template) => {
    setConfig((prev) => {
      const applied = applyTemplate(prev, template.id)
      return applied
    })
    showToast(`已应用模板：${template.name}`)
  }

  const handleCardSizeChange = (size) => {
    updateConfig({ cardSize: size })
  }

  const handleBackgroundModeChange = (mode) => {
    setConfig((prev) => switchBackgroundMode(prev, mode))
  }

  const handleBgImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const img = await loadImageFromFile(file)
      const dataUrl = imageToDataURL(img)
      updateConfig({ background: { image: dataUrl } })
      setBackgroundImage(img)
    } catch {
      showToast('图片加载失败', 'error')
    }
    e.target.value = ''
  }

  const handleBgImageRemove = () => {
    updateConfig({ background: { image: null } })
    setBackgroundImage(null)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const img = await loadImageFromFile(file)
      const dataUrl = imageToDataURL(img)
      updateConfig({ logo: { image: dataUrl, enabled: true } })
      setLogoImage(img)
    } catch {
      showToast('Logo 加载失败', 'error')
    }
    e.target.value = ''
  }

  const handleLogoRemove = () => {
    updateConfig({ logo: { image: null, enabled: false } })
    setLogoImage(null)
  }

  const handleExportPNG = () => {
    if (!canvasRef.current) return
    const filename = `share-card-${Date.now()}.png`
    downloadCanvasAsPNG(canvasRef.current, filename)
    showToast('图片已导出')
  }

  const handleCopyImage = async () => {
    if (!canvasRef.current) return
    try {
      await copyCanvasToClipboard(canvasRef.current)
      showToast('图片已复制到剪贴板')
    } catch (err) {
      showToast(err.message || '复制失败', 'error')
    }
  }

  const handleSaveConfig = () => {
    const newList = saveConfigToList(config)
    setSavedConfigs(newList)
    showToast('配置已保存')
  }

  const handleLoadConfig = (item) => {
    const loaded = deserializeConfig(item.config)
    setConfig(loaded)
    showToast('配置已加载')
  }

  const handleDeleteConfig = (e, id) => {
    e.stopPropagation()
    const newList = deleteConfigFromList(id)
    setSavedConfigs(newList)
    showToast('配置已删除')
  }

  const cardSize = CARD_SIZES[config.cardSize]
  const canvasScale = cardSize.height > 600 ? 0.55 : 0.9

  const overlayAlphaPercent = useMemo(() => {
    const match = config.background.overlayColor.match(/[\d.]+$/)
    const alpha = match ? parseFloat(match[0]) : 0
    return Math.round(alpha * 100)
  }, [config.background.overlayColor])

  return (
    <div className="share-card-page">
      <div className="share-card-header">
        <button className="share-card-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="share-card-title">分享卡生成器</h1>
      </div>

      <div className="share-card-main">
        {/* Left Panel - Editor */}
        <div className="share-card-panel">
          {/* Templates */}
          <div className="share-card-section">
            <h3 className="share-card-section-title">模板选择</h3>
            <div className="templates-scroll">
              {TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={`template-thumb ${config.templateId === template.id ? 'active' : ''} ${template.config.cardSize === 'portrait' ? 'template-portrait' : ''}`}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div
                    className="template-preview"
                    style={{
                      background:
                        template.config.background.mode === BACKGROUND_MODES.GRADIENT
                          ? `linear-gradient(${
                              template.config.background.gradientDirection === 'horizontal'
                                ? '90deg'
                                : template.config.background.gradientDirection === 'vertical'
                                ? '180deg'
                                : '135deg'
                            }, ${template.config.background.gradientStart}, ${template.config.background.gradientEnd})`
                          : template.config.background.color,
                    }}
                  >
                    {template.name.slice(0, 2)}
                  </div>
                  <div className="template-name">{template.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Size */}
          <div className="share-card-section">
            <h3 className="share-card-section-title">卡片尺寸</h3>
            <div className="card-size-switch">
              {Object.entries(CARD_SIZE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`size-btn ${config.cardSize === key ? 'active' : ''}`}
                  onClick={() => handleCardSizeChange(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="share-card-section">
            <h3 className="share-card-section-title">背景设置</h3>

            <div className="mode-tabs">
              <button
                className={`mode-tab ${config.background.mode === BACKGROUND_MODES.IMAGE ? 'active' : ''}`}
                onClick={() => handleBackgroundModeChange(BACKGROUND_MODES.IMAGE)}
              >
                背景图
              </button>
              <button
                className={`mode-tab ${config.background.mode === BACKGROUND_MODES.GRADIENT ? 'active' : ''}`}
                onClick={() => handleBackgroundModeChange(BACKGROUND_MODES.GRADIENT)}
              >
                渐变色
              </button>
              <button
                className={`mode-tab ${config.background.mode === BACKGROUND_MODES.COLOR ? 'active' : ''}`}
                onClick={() => handleBackgroundModeChange(BACKGROUND_MODES.COLOR)}
              >
                纯色
              </button>
            </div>

            {config.background.mode === BACKGROUND_MODES.IMAGE && (
              <>
                <label className="file-upload-btn">
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBgImageUpload}
                  />
                  📷 点击上传背景图片
                </label>

                {config.background.image && (
                  <div className="image-preview-wrap">
                    <img
                      src={config.background.image}
                      alt="背景图"
                      className="image-preview-thumb"
                    />
                    <div className="image-preview-info">
                      <div className="image-preview-name">已上传背景图</div>
                    </div>
                    <button className="image-remove-btn" onClick={handleBgImageRemove}>
                      移除
                    </button>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">
                    模糊度: {config.background.blur}px
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      className="slider"
                      min="0"
                      max="30"
                      value={config.background.blur}
                      onChange={(e) =>
                        updateConfig({ background: { blur: Number(e.target.value) } })
                      }
                    />
                    <span className="slider-value">{config.background.blur}px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">叠加颜色</label>
                  <div className="color-input-row">
                    <input
                      type="color"
                      className="color-picker"
                      value="#000000"
                      onChange={(e) => {
                        const alpha = 0.3
                        const hex = e.target.value
                        const r = parseInt(hex.slice(1, 3), 16)
                        const g = parseInt(hex.slice(3, 5), 16)
                        const b = parseInt(hex.slice(5, 7), 16)
                        updateConfig({
                          background: { overlayColor: `rgba(${r},${g},${b},${alpha})` },
                        })
                      }}
                    />
                    <input
                      type="range"
                      className="slider"
                      min="0"
                      max="100"
                      value={overlayAlphaPercent}
                      onChange={(e) => {
                        const alpha = Number(e.target.value) / 100
                        const match = config.background.overlayColor.match(
                          /rgba?\((\d+),(\d+),(\d+)/
                        )
                        const r = match ? match[1] : 0
                        const g = match ? match[2] : 0
                        const b = match ? match[3] : 0
                        updateConfig({
                          background: { overlayColor: `rgba(${r},${g},${b},${alpha})` },
                        })
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </>
            )}

            {config.background.mode === BACKGROUND_MODES.GRADIENT && (
              <>
                <div className="color-row">
                  <div className="color-input-wrap">
                    <label>起始色</label>
                    <div className="color-input-row">
                      <input
                        type="color"
                        className="color-picker"
                        value={config.background.gradientStart}
                        onChange={(e) =>
                          updateConfig({ background: { gradientStart: e.target.value } })
                        }
                      />
                      <input
                        type="text"
                        className="color-hex-input"
                        value={config.background.gradientStart}
                        onChange={(e) =>
                          updateConfig({ background: { gradientStart: e.target.value } })
                        }
                      />
                    </div>
                  </div>
                  <div className="color-input-wrap">
                    <label>结束色</label>
                    <div className="color-input-row">
                      <input
                        type="color"
                        className="color-picker"
                        value={config.background.gradientEnd}
                        onChange={(e) =>
                          updateConfig({ background: { gradientEnd: e.target.value } })
                        }
                      />
                      <input
                        type="text"
                        className="color-hex-input"
                        value={config.background.gradientEnd}
                        onChange={(e) =>
                          updateConfig({ background: { gradientEnd: e.target.value } })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">渐变方向</label>
                  <div className="align-buttons">
                    {Object.entries(GRADIENT_DIRECTION_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        className={`align-btn ${config.background.gradientDirection === key ? 'active' : ''}`}
                        onClick={() =>
                          updateConfig({ background: { gradientDirection: key } })
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {config.background.mode === BACKGROUND_MODES.COLOR && (
              <>
                <div className="color-input-row" style={{ marginBottom: 12 }}>
                  <input
                    type="color"
                    className="color-picker"
                    value={config.background.color}
                    onChange={(e) => updateConfig({ background: { color: e.target.value } })}
                  />
                  <input
                    type="text"
                    className="color-hex-input"
                    value={config.background.color}
                    onChange={(e) => updateConfig({ background: { color: e.target.value } })}
                    placeholder="#FFFFFF"
                  />
                </div>
                <div className="preset-colors">
                  {PRESET_COLORS.map((color) => (
                    <div
                      key={color}
                      className={`preset-color ${config.background.color === color ? 'selected' : ''}`}
                      style={{ background: color, border: color === '#FFFFFF' ? '2px solid #e5e7eb' : '2px solid transparent' }}
                      onClick={() => updateConfig({ background: { color } })}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content - Title & Description */}
          <div className="share-card-section">
            <h3 className="share-card-section-title">内容编辑</h3>

            <div className="form-group">
              <label className="form-label">标题</label>
              <input
                type="text"
                className="form-input"
                value={config.title.text}
                onChange={(e) => updateConfig({ title: { text: e.target.value } })}
                placeholder="输入分享卡标题..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                字体大小: {config.title.fontSize}px
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  className="slider"
                  min="16"
                  max="72"
                  value={config.title.fontSize}
                  onChange={(e) =>
                    updateConfig({ title: { fontSize: Number(e.target.value) } })
                  }
                />
                <span className="slider-value">{config.title.fontSize}px</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">字体颜色</label>
              <div className="color-input-row">
                <input
                  type="color"
                  className="color-picker"
                  value={config.title.color.startsWith('#') ? config.title.color : '#ffffff'}
                  onChange={(e) => updateConfig({ title: { color: e.target.value } })}
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={config.title.color}
                  onChange={(e) => updateConfig({ title: { color: e.target.value } })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">对齐方式</label>
              <div className="align-buttons">
                {Object.entries(TEXT_ALIGNMENT_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    className={`align-btn ${config.title.alignment === key ? 'active' : ''}`}
                    onClick={() => updateConfig({ title: { alignment: key } })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="toggle-row">
                <span className="toggle-label">粗体</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.title.bold}
                    onChange={(e) => updateConfig({ title: { bold: e.target.checked } })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 20, borderTop: '1px dashed #e5e7eb', paddingTop: 16 }}>
              <label className="form-label">描述</label>
              <textarea
                className="form-textarea"
                value={config.description.text}
                onChange={(e) => updateConfig({ description: { text: e.target.value } })}
                placeholder="输入分享卡描述..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                字体大小: {config.description.fontSize}px
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  className="slider"
                  min="12"
                  max="40"
                  value={config.description.fontSize}
                  onChange={(e) =>
                    updateConfig({ description: { fontSize: Number(e.target.value) } })
                  }
                />
                <span className="slider-value">{config.description.fontSize}px</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">字体颜色</label>
              <div className="color-input-row">
                <input
                  type="color"
                  className="color-picker"
                  value={config.description.color.startsWith('#') ? config.description.color : '#ffffff'}
                  onChange={(e) => updateConfig({ description: { color: e.target.value } })}
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={config.description.color}
                  onChange={(e) => updateConfig({ description: { color: e.target.value } })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">对齐方式</label>
              <div className="align-buttons">
                {Object.entries(TEXT_ALIGNMENT_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    className={`align-btn ${config.description.alignment === key ? 'active' : ''}`}
                    onClick={() => updateConfig({ description: { alignment: key } })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="toggle-row">
                <span className="toggle-label">粗体</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.description.bold}
                    onChange={(e) => updateConfig({ description: { bold: e.target.checked } })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Elements - Logo & QRCode */}
          <div className="share-card-section">
            <h3 className="share-card-section-title">元素设置</h3>

            <div className="form-group">
              <div className="toggle-row">
                <span className="toggle-label">显示 Logo</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.logo.enabled}
                    onChange={(e) => updateConfig({ logo: { enabled: e.target.checked } })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {config.logo.enabled && (
              <>
                <label className="file-upload-btn">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  🏷️ 上传 Logo 图片
                </label>

                {config.logo.image && (
                  <div className="image-preview-wrap">
                    <img
                      src={config.logo.image}
                      alt="Logo"
                      className="image-preview-thumb"
                    />
                    <div className="image-preview-info">
                      <div className="image-preview-name">已上传 Logo</div>
                    </div>
                    <button className="image-remove-btn" onClick={handleLogoRemove}>
                      移除
                    </button>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">
                    Logo 大小: {config.logo.size}px
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      className="slider"
                      min="40"
                      max="160"
                      value={config.logo.size}
                      onChange={(e) =>
                        updateConfig({ logo: { size: Number(e.target.value) } })
                      }
                    />
                    <span className="slider-value">{config.logo.size}px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Logo 位置</label>
                  <div className="align-buttons">
                    <button
                      className={`align-btn ${config.logo.position === 'top' ? 'active' : ''}`}
                      onClick={() => updateConfig({ logo: { position: 'top' } })}
                    >
                      顶部
                    </button>
                    <button
                      className={`align-btn ${config.logo.position === 'bottom' ? 'active' : ''}`}
                      onClick={() => updateConfig({ logo: { position: 'bottom' } })}
                    >
                      底部
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="form-group" style={{ marginTop: 20, borderTop: '1px dashed #e5e7eb', paddingTop: 16 }}>
              <div className="toggle-row">
                <span className="toggle-label">显示二维码</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.qrcode.enabled}
                    onChange={(e) => updateConfig({ qrcode: { enabled: e.target.checked } })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {config.qrcode.enabled && (
              <>
                <div className="form-group">
                  <label className="form-label">二维码内容（URL 或文本）</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.qrcode.content}
                    onChange={(e) => updateConfig({ qrcode: { content: e.target.value } })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    二维码大小: {config.qrcode.size}px
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      className="slider"
                      min="80"
                      max="200"
                      value={config.qrcode.size}
                      onChange={(e) =>
                        updateConfig({ qrcode: { size: Number(e.target.value) } })
                      }
                    />
                    <span className="slider-value">{config.qrcode.size}px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">二维码位置</label>
                  <div className="align-buttons">
                    <button
                      className={`align-btn ${config.qrcode.position === 'top' ? 'active' : ''}`}
                      onClick={() => updateConfig({ qrcode: { position: 'top' } })}
                    >
                      顶部
                    </button>
                    <button
                      className={`align-btn ${config.qrcode.position === 'bottom' ? 'active' : ''}`}
                      onClick={() => updateConfig({ qrcode: { position: 'bottom' } })}
                    >
                      底部
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Config Management */}
          <div className="config-section">
            <h3 className="share-card-section-title">配置管理</h3>

            {savedConfigs.length > 0 ? (
              <div className="config-list">
                {savedConfigs.map((item) => (
                  <div
                    key={item.id}
                    className="config-item"
                    onClick={() => handleLoadConfig(item)}
                  >
                    <div className="config-item-info">
                      <div className="config-item-name">{item.name}</div>
                      <div className="config-item-time">{formatTimestamp(item.timestamp)}</div>
                    </div>
                    <button
                      className="config-item-delete"
                      onClick={(e) => handleDeleteConfig(e, item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="config-empty">暂无保存的配置</div>
            )}

            <div className="config-buttons-row">
              <button className="preview-btn preview-btn-secondary" onClick={handleSaveConfig}>
                💾 保存配置
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="share-card-preview-wrap">
          <div className="preview-title-row">
            <h2 className="preview-panel-title">实时预览</h2>
            <div className="preview-actions">
              <button className="preview-btn preview-btn-secondary" onClick={handleCopyImage}>
                📋 复制图片
              </button>
              <button className="preview-btn preview-btn-primary" onClick={handleExportPNG}>
                ⬇️ 导出 PNG
              </button>
            </div>
          </div>

          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              className={`share-canvas ${config.cardSize === 'portrait' ? 'portrait' : ''}`}
              style={{
                width: `${cardSize.width * canvasScale}px`,
                height: `${cardSize.height * canvasScale}px`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </div>
  )
}

export default ShareCardGenerator
