import { PRESET_COLORS } from './constants.js'
import { validateHexColor } from './utils.js'

export default function ColorPicker({ value, onChange, onReset }) {
  const handleColorClick = (color) => {
    onChange(color)
  }

  const handleHexChange = (e) => {
    const val = e.target.value
    if (val === '' || validateHexColor(val)) {
      onChange(val)
    }
  }

  return (
    <div className="color-picker">
      <div className="color-picker-presets">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-swatch ${value === color ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorClick(color)}
            title={color}
          />
        ))}
      </div>
      <div className="color-picker-custom">
        <input
          type="text"
          className="form-input"
          placeholder="#000000"
          value={value}
          onChange={handleHexChange}
          style={{ textTransform: 'uppercase' }}
        />
        <div
          className="color-preview"
          style={{ backgroundColor: validateHexColor(value) ? value : '#ccc' }}
        />
        {onReset && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onReset}
          >
            重置
          </button>
        )}
      </div>
    </div>
  )
}
