import { useState, useCallback } from 'react'
import {
  MODAL_TYPES,
  MODAL_TYPE_LABELS,
  ANIMATION_TYPES,
  ANIMATION_TYPE_LABELS,
  PRESET_COLORS,
  MIN_WIDTH,
  MAX_WIDTH,
  MIN_MASK_OPACITY,
  MAX_MASK_OPACITY,
  MIN_ANIMATION_DURATION,
  MAX_ANIMATION_DURATION,
  MIN_FORM_FIELDS,
  MAX_FORM_FIELDS,
} from './constants'
import {
  generateCallCode,
  highlightSyntax,
  clampWidth,
  clampMaskOpacity,
  clampAnimationDuration,
  clampFormFieldCount,
  updateFormFieldsCount,
  updateFormField,
  hasConfirmButton,
  hasCancelButton,
  hasFormFields,
} from './modalGeneratorCore'

function ColorPicker({ label, value, onChange }) {
  const handlePresetClick = (color) => {
    onChange(color)
  }

  const handleHexChange = (e) => {
    onChange(e.target.value)
  }

  return (
    <div className="mg-field">
      <label className="mg-field-label">{label}</label>
      <div className="mg-color-picker">
        <div className="mg-color-presets">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`mg-color-swatch ${value === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handlePresetClick(color)}
              aria-label={`颜色 ${color}`}
            />
          ))}
        </div>
        <input
          type="text"
          className="mg-hex-input"
          value={value}
          onChange={handleHexChange}
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

function ConfigPanel({ config, onConfigChange, onPreviewAnimation, generatedCode, onGeneratedCodeChange }) {
  const [copied, setCopied] = useState(false)

  const handleTypeChange = useCallback((type) => {
    onConfigChange({ type })
  }, [onConfigChange])

  const handleInputChange = useCallback((key, value) => {
    onConfigChange({ [key]: value })
  }, [onConfigChange])

  const handleWidthChange = useCallback((e) => {
    const value = Number(e.target.value)
    onConfigChange({ width: clampWidth(value) })
  }, [onConfigChange])

  const handleMaskOpacityChange = useCallback((e) => {
    const value = Number(e.target.value)
    onConfigChange({ maskOpacity: clampMaskOpacity(value) })
  }, [onConfigChange])

  const handleAnimationDurationChange = useCallback((e) => {
    const value = Number(e.target.value)
    onConfigChange({ animationDuration: clampAnimationDuration(value) })
  }, [onConfigChange])

  const handleFormFieldCountChange = useCallback((e) => {
    const count = clampFormFieldCount(Number(e.target.value))
    const newFields = updateFormFieldsCount(config.formFields, count)
    onConfigChange({ formFields: newFields })
  }, [config.formFields, onConfigChange])

  const handleFormFieldUpdate = useCallback((fieldId, updates) => {
    const newFields = updateFormField(config.formFields, fieldId, updates)
    onConfigChange({ formFields: newFields })
  }, [config.formFields, onConfigChange])

  const handleToggle = useCallback((key) => {
    onConfigChange({ [key]: !config[key] })
  }, [config, onConfigChange])

  const handleGenerateCode = useCallback(() => {
    const code = generateCallCode(config)
    onGeneratedCodeChange(code)
  }, [config, onGeneratedCodeChange])

  const handleCopyCode = useCallback(async () => {
    if (!generatedCode) return
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }, [generatedCode])

  const showConfirmBtn = hasConfirmButton(config.type)
  const showCancelBtn = hasCancelButton(config.type)
  const showForm = hasFormFields(config.type)

  return (
    <div className="mg-config-panel">
      <div className="mg-panel-section">
        <h4 className="mg-section-title">弹窗类型</h4>
        <div className="mg-type-selector">
          {Object.values(MODAL_TYPES).map((type) => (
            <button
              key={type}
              type="button"
              className={`mg-type-btn ${config.type === type ? 'active' : ''}`}
              onClick={() => handleTypeChange(type)}
            >
              {MODAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="mg-panel-section">
        <h4 className="mg-section-title">内容</h4>

        <div className="mg-field">
          <label className="mg-field-label">标题</label>
          <input
            type="text"
            className="mg-input"
            value={config.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="请输入弹窗标题"
          />
        </div>

        <div className="mg-field">
          <label className="mg-field-label">正文内容</label>
          <textarea
            className="mg-textarea"
            value={config.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="请输入弹窗内容"
            rows={4}
          />
        </div>

        {showForm && (
          <>
            <div className="mg-field">
              <label className="mg-field-label">
                输入框数量：{config.formFields ? config.formFields.length : 0}
              </label>
              <input
                type="range"
                className="mg-slider"
                min={MIN_FORM_FIELDS}
                max={MAX_FORM_FIELDS}
                value={config.formFields ? config.formFields.length : MIN_FORM_FIELDS}
                onChange={handleFormFieldCountChange}
              />
            </div>

            {config.formFields && config.formFields.map((field, index) => (
              <div key={field.id} className="mg-form-field-config">
                <div className="mg-form-field-header">
                  <span className="mg-form-field-index">输入框 {index + 1}</span>
                </div>
                <div className="mg-field">
                  <label className="mg-field-label">标签文字</label>
                  <input
                    type="text"
                    className="mg-input"
                    value={field.label}
                    onChange={(e) => handleFormFieldUpdate(field.id, { label: e.target.value })}
                  />
                </div>
                <div className="mg-field">
                  <label className="mg-field-label">占位符</label>
                  <input
                    type="text"
                    className="mg-input"
                    value={field.placeholder}
                    onChange={(e) => handleFormFieldUpdate(field.id, { placeholder: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </>
        )}

        {showConfirmBtn && (
          <div className="mg-field">
            <label className="mg-field-label">确定按钮文字</label>
            <input
              type="text"
              className="mg-input"
              value={config.confirmText}
              onChange={(e) => handleInputChange('confirmText', e.target.value)}
            />
          </div>
        )}

        {showCancelBtn && (
          <div className="mg-field">
            <label className="mg-field-label">取消按钮文字</label>
            <input
              type="text"
              className="mg-input"
              value={config.cancelText}
              onChange={(e) => handleInputChange('cancelText', e.target.value)}
            />
          </div>
        )}

        {showConfirmBtn && (
          <ColorPicker
            label="确定按钮颜色"
            value={config.confirmColor}
            onChange={(color) => handleInputChange('confirmColor', color)}
          />
        )}

        {showCancelBtn && (
          <ColorPicker
            label="取消按钮颜色"
            value={config.cancelColor}
            onChange={(color) => handleInputChange('cancelColor', color)}
          />
        )}

        <div className="mg-field">
          <label className="mg-field-label">弹窗宽度：{config.width}px</label>
          <input
            type="range"
            className="mg-slider"
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            value={config.width}
            onChange={handleWidthChange}
          />
        </div>
      </div>

      <div className="mg-panel-section">
        <h4 className="mg-section-title">遮罩</h4>

        <div className="mg-field">
          <label className="mg-field-label">遮罩透明度：{config.maskOpacity}%</label>
          <input
            type="range"
            className="mg-slider"
            min={MIN_MASK_OPACITY}
            max={MAX_MASK_OPACITY}
            value={config.maskOpacity}
            onChange={handleMaskOpacityChange}
          />
        </div>

        <div className="mg-field mg-toggle-field">
          <label className="mg-field-label">点击遮罩关闭</label>
          <button
            type="button"
            className={`mg-toggle ${config.closeOnMaskClick ? 'active' : ''}`}
            onClick={() => handleToggle('closeOnMaskClick')}
            role="switch"
            aria-checked={config.closeOnMaskClick}
          >
            <span className="mg-toggle-thumb" />
          </button>
        </div>

        <div className="mg-field mg-toggle-field">
          <label className="mg-field-label">显示关闭按钮</label>
          <button
            type="button"
            className={`mg-toggle ${config.showCloseButton ? 'active' : ''}`}
            onClick={() => handleToggle('showCloseButton')}
            role="switch"
            aria-checked={config.showCloseButton}
          >
            <span className="mg-toggle-thumb" />
          </button>
        </div>
      </div>

      <div className="mg-panel-section">
        <h4 className="mg-section-title">动画</h4>

        <div className="mg-field">
          <label className="mg-field-label">入场动画</label>
          <div className="mg-animation-grid">
            {Object.values(ANIMATION_TYPES).map((anim) => (
              <button
                key={anim}
                type="button"
                className={`mg-animation-btn ${config.animation === anim ? 'active' : ''}`}
                onClick={() => handleInputChange('animation', anim)}
              >
                {ANIMATION_TYPE_LABELS[anim]}
              </button>
            ))}
          </div>
        </div>

        <div className="mg-field">
          <label className="mg-field-label">动画时长：{config.animationDuration}ms</label>
          <input
            type="range"
            className="mg-slider"
            min={MIN_ANIMATION_DURATION}
            max={MAX_ANIMATION_DURATION}
            step={50}
            value={config.animationDuration}
            onChange={handleAnimationDurationChange}
          />
        </div>

        <button type="button" className="mg-btn mg-btn-primary mg-btn-block" onClick={onPreviewAnimation}>
          预览动画
        </button>
      </div>

      <div className="mg-panel-section">
        <h4 className="mg-section-title">调用代码</h4>

        <button
          type="button"
          className="mg-btn mg-btn-secondary mg-btn-block"
          onClick={handleGenerateCode}
        >
          生成代码
        </button>

        <div className="mg-code-panel">
          <pre className="mg-code-block">
            <code>
              {generatedCode ? (
                highlightSyntax(generatedCode).map((token, idx) => (
                  <span key={idx} className={`mg-token-${token.type}`}>
                    {token.value}
                  </span>
                ))
              ) : (
                <span className="mg-code-placeholder">点击"生成代码"按钮生成</span>
              )}
            </code>
          </pre>
        </div>

        <button
          type="button"
          className={`mg-btn mg-btn-primary mg-btn-block ${copied ? 'mg-btn-copied' : ''}`}
          onClick={handleCopyCode}
        >
          {copied ? '已复制' : '复制代码'}
        </button>
      </div>
    </div>
  )
}

export default ConfigPanel
