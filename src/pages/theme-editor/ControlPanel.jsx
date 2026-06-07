import { useRef, useState } from 'react'
import { COLOR_LABELS, THEME_MODES } from './themeConfig'
import { getContrastColor, isValidHexColor } from './themeUtils'

const ControlPanel = ({
  config,
  onModeChange,
  onToggleMode,
  onColorChange,
  onTypographyChange,
  onReset,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef(null)
  const [colorDraft, setColorDraft] = useState({})
  const [colorErrors, setColorErrors] = useState({})

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      onImport(file)
    }
    e.target.value = ''
  }

  const handleColorTextChange = (key, value) => {
    setColorDraft((prev) => ({ ...prev, [key]: value }))
    if (isValidHexColor(value)) {
      setColorErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      onColorChange(key, value)
    } else {
      setColorErrors((prev) => ({ ...prev, [key]: true }))
    }
  }

  const handleColorTextBlur = (key) => {
    setColorDraft((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setColorErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleColorPickerChange = (key, value) => {
    setColorErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setColorDraft((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    onColorChange(key, value)
  }

  const getColorDisplayValue = (key) =>
    colorDraft[key] !== undefined ? colorDraft[key] : config.colors[key]

  return (
    <aside className="te-panel">
      <div className="te-panel-header">
        <h2 className="te-panel-title">控制面板</h2>
      </div>

      <section className="te-section">
        <h3 className="te-section-title">主题模式</h3>
        <div className="te-mode-switch">
          <button
            type="button"
            className={`te-mode-btn ${config.mode === THEME_MODES.LIGHT ? 'active' : ''}`}
            onClick={() => onModeChange(THEME_MODES.LIGHT)}
          >
            ☀️ 亮色
          </button>
          <button
            type="button"
            className={`te-mode-btn ${config.mode === THEME_MODES.DARK ? 'active' : ''}`}
            onClick={() => onModeChange(THEME_MODES.DARK)}
          >
            🌙 暗色
          </button>
        </div>
        <button type="button" className="te-toggle-btn" onClick={onToggleMode}>
          一键切换
        </button>
      </section>

      <section className="te-section">
        <h3 className="te-section-title">颜色编辑器</h3>
        <div className="te-color-grid">
          {Object.entries(COLOR_LABELS).map(([key, label]) => {
            const displayValue = getColorDisplayValue(key)
            const hasError = colorErrors[key]
            return (
              <div className="te-color-item" key={key}>
                <label className="te-color-label">
                  <span>{label}</span>
                  <span className="te-color-hex">{config.colors[key]}</span>
                </label>
                <div className="te-color-input-wrap">
                  <input
                    type="color"
                    className="te-color-picker"
                    value={config.colors[key]}
                    onChange={(e) => handleColorPickerChange(key, e.target.value)}
                    style={{
                      background: config.colors[key],
                      color: getContrastColor(config.colors[key]),
                    }}
                  />
                  <input
                    type="text"
                    className={`te-color-text ${hasError ? 'te-color-text-error' : ''}`}
                    value={displayValue}
                    onChange={(e) => handleColorTextChange(key, e.target.value)}
                    onBlur={() => handleColorTextBlur(key)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="te-section">
        <h3 className="te-section-title">字体与间距</h3>
        <div className="te-range-group">
          <label className="te-range-label">
            <span>字体大小</span>
            <span className="te-range-value">{config.typography.fontSize}px</span>
          </label>
          <input
            type="range"
            min="12"
            max="24"
            step="1"
            value={config.typography.fontSize}
            onChange={(e) => onTypographyChange('fontSize', Number(e.target.value))}
            className="te-range-input"
          />
        </div>
        <div className="te-range-group">
          <label className="te-range-label">
            <span>行高</span>
            <span className="te-range-value">{config.typography.lineHeight.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={config.typography.lineHeight}
            onChange={(e) => onTypographyChange('lineHeight', Number(e.target.value))}
            className="te-range-input"
          />
        </div>
        <div className="te-range-group">
          <label className="te-range-label">
            <span>段落间距</span>
            <span className="te-range-value">{config.typography.paragraphSpacing}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="48"
            step="2"
            value={config.typography.paragraphSpacing}
            onChange={(e) => onTypographyChange('paragraphSpacing', Number(e.target.value))}
            className="te-range-input"
          />
        </div>
      </section>

      <section className="te-section">
        <h3 className="te-section-title">配置管理</h3>
        <div className="te-action-row">
          <button type="button" className="te-action-btn primary" onClick={onExport}>
            导出 JSON
          </button>
          <button type="button" className="te-action-btn" onClick={handleImportClick}>
            导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        <button type="button" className="te-action-btn danger" onClick={onReset}>
          恢复默认
        </button>
      </section>
    </aside>
  )
}

export default ControlPanel
