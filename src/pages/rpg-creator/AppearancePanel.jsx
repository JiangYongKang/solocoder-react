import { HAIR_STYLES, HAIR_COLORS, SKIN_TONES, EYE_STYLES, OUTFITS } from './constants'

export default function AppearancePanel({ appearance, onChange }) {
  const update = (key, value) => {
    onChange({ ...appearance, [key]: value })
  }

  return (
    <div className="rpg-card">
      <h3 className="rpg-card-title">🎨 外观定制</h3>

      <div className="rpg-appearance-section">
        <div className="rpg-appearance-label">发型</div>
        <div className="rpg-option-row">
          {HAIR_STYLES.map((style, idx) => (
            <div
              key={style.id}
              className={`rpg-option-item ${appearance.hairStyle === idx ? 'active' : ''}`}
              onClick={() => update('hairStyle', idx)}
              title={style.name}
            >
              {style.name}
            </div>
          ))}
        </div>
      </div>

      <div className="rpg-appearance-section">
        <div className="rpg-appearance-label">发色</div>
        <div className="rpg-option-row">
          {HAIR_COLORS.map((color, idx) => (
            <div
              key={color.id}
              className={`rpg-option-item ${appearance.hairColor === idx ? 'active' : ''}`}
              onClick={() => update('hairColor', idx)}
              title={color.name}
            >
              <div className="rpg-color-swatch" style={{ background: color.color }} />
            </div>
          ))}
        </div>
      </div>

      <div className="rpg-appearance-section">
        <div className="rpg-appearance-label">肤色</div>
        <div className="rpg-option-row">
          {SKIN_TONES.map((tone, idx) => (
            <div
              key={tone.id}
              className={`rpg-option-item ${appearance.skinTone === idx ? 'active' : ''}`}
              onClick={() => update('skinTone', idx)}
              title={tone.name}
            >
              <div className="rpg-color-swatch" style={{ background: tone.color }} />
            </div>
          ))}
        </div>
      </div>

      <div className="rpg-appearance-section">
        <div className="rpg-appearance-label">眼睛样式</div>
        <div className="rpg-option-row">
          {EYE_STYLES.map((style, idx) => (
            <div
              key={style.id}
              className={`rpg-option-item ${appearance.eyeStyle === idx ? 'active' : ''}`}
              onClick={() => update('eyeStyle', idx)}
              title={style.name}
            >
              {style.name}
            </div>
          ))}
        </div>
      </div>

      <div className="rpg-appearance-section">
        <div className="rpg-appearance-label">服装</div>
        <div className="rpg-option-row">
          {OUTFITS.map((o) => (
            <div
              key={o.key}
              className={`rpg-option-item outfit-option ${appearance.outfit === o.key ? 'active' : ''}`}
              onClick={() => update('outfit', o.key)}
              title={o.name}
            >
              {o.icon} {o.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
