import { ANIMATION_TYPES, PARAM_RANGES, PARAM_LABELS } from './constants.js'

function SliderControl({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className="control-group">
      <label className="control-label">
        {label}
        <span className="control-value">{value}{unit}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="control-slider"
      />
    </div>
  )
}

function ColorControl({ label, value, onChange }) {
  return (
    <div className="control-group">
      <label className="control-label">{label}</label>
      <div className="color-picker-row">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="color-picker"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="color-input"
        />
      </div>
    </div>
  )
}

export default function ControlPanel({ animationType, config, onChange }) {
  const animType = ANIMATION_TYPES[animationType]
  if (!animType) {
    return (
      <div className="control-panel empty">
        <p>请选择一个动画类型</p>
      </div>
    )
  }

  const { supportedParams, defaultConfig } = animType

  const handleParamChange = (param, value) => {
    onChange({
      ...config,
      [param]: value,
    })
  }

  return (
    <div className="control-panel">
      <h3 className="panel-title">参数调节</h3>
      <div className="controls">
        {supportedParams.includes('primaryColor') && (
          <ColorControl
            label={PARAM_LABELS.primaryColor}
            value={config.primaryColor ?? defaultConfig.primaryColor}
            onChange={(v) => handleParamChange('primaryColor', v)}
          />
        )}

        {supportedParams.includes('secondaryColor') && (
          <ColorControl
            label={PARAM_LABELS.secondaryColor}
            value={config.secondaryColor ?? defaultConfig.secondaryColor}
            onChange={(v) => handleParamChange('secondaryColor', v)}
          />
        )}

        {supportedParams.includes('size') && (
          <SliderControl
            label={PARAM_LABELS.size}
            value={config.size ?? defaultConfig.size}
            min={PARAM_RANGES.size.min}
            max={PARAM_RANGES.size.max}
            step={PARAM_RANGES.size.step}
            unit={PARAM_RANGES.size.unit}
            onChange={(v) => handleParamChange('size', v)}
          />
        )}

        {supportedParams.includes('speed') && (
          <SliderControl
            label={PARAM_LABELS.speed}
            value={config.speed ?? defaultConfig.speed}
            min={PARAM_RANGES.speed.min}
            max={PARAM_RANGES.speed.max}
            step={PARAM_RANGES.speed.step}
            unit={PARAM_RANGES.speed.unit}
            onChange={(v) => handleParamChange('speed', v)}
          />
        )}

        {supportedParams.includes('thickness') && (
          <SliderControl
            label={PARAM_LABELS.thickness}
            value={config.thickness ?? defaultConfig.thickness}
            min={PARAM_RANGES.thickness.min}
            max={PARAM_RANGES.thickness.max}
            step={PARAM_RANGES.thickness.step}
            unit={PARAM_RANGES.thickness.unit}
            onChange={(v) => handleParamChange('thickness', v)}
          />
        )}

        {supportedParams.includes('count') && (
          <SliderControl
            label={PARAM_LABELS.count}
            value={config.count ?? defaultConfig.count}
            min={PARAM_RANGES.count.min}
            max={PARAM_RANGES.count.max}
            step={PARAM_RANGES.count.step}
            unit={PARAM_RANGES.count.unit}
            onChange={(v) => handleParamChange('count', v)}
          />
        )}
      </div>
    </div>
  )
}
