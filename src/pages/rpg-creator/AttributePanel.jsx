import { ATTRIBUTES, ATTR_MAX, ATTR_INITIAL } from './constants'
import { calculateFreePoints, calculateDerivedStats, incrementAttribute, decrementAttribute } from './utils'

const ATTR_BAR_CLASSES = {
  strength: 'str',
  agility: 'agi',
  intelligence: 'int',
  stamina: 'sta',
  spirit: 'spi',
  charisma: 'cha',
}

export default function AttributePanel({ attributes, onChange }) {
  const freePoints = calculateFreePoints(attributes)
  const derived = calculateDerivedStats(attributes)

  const handleIncrement = (key) => {
    const result = incrementAttribute(attributes, key)
    if (result.success) onChange(result.attributes)
  }

  const handleDecrement = (key) => {
    const result = decrementAttribute(attributes, key)
    if (result.success) onChange(result.attributes)
  }

  const barPercent = (val) => ((val - ATTR_INITIAL) / (ATTR_MAX - ATTR_INITIAL)) * 100

  return (
    <div className="rpg-card">
      <h3 className="rpg-card-title">📊 属性分配</h3>

      <div className="rpg-attrs-header">
        <span className="rpg-points-remaining">
          可分配点数: {freePoints}
          {freePoints > 0 && (
            <span className="rpg-points-warning">（还有 {freePoints} 点未分配）</span>
          )}
        </span>
      </div>

      {ATTRIBUTES.map((attr) => {
        const val = attributes[attr.key]
        const pct = barPercent(val)
        return (
          <div className="rpg-attr-row" key={attr.key}>
            <span className="rpg-attr-icon">{attr.icon}</span>
            <span className="rpg-attr-name">{attr.label}</span>
            <span className="rpg-attr-desc">{attr.desc}</span>
            <div className="rpg-attr-bar-wrapper">
              <div
                className={`rpg-attr-bar ${ATTR_BAR_CLASSES[attr.key] || ''}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="rpg-attr-value">{val}</span>
            <button
              className="rpg-attr-btn"
              onClick={() => handleDecrement(attr.key)}
              disabled={val <= ATTR_INITIAL}
            >
              −
            </button>
            <button
              className="rpg-attr-btn"
              onClick={() => handleIncrement(attr.key)}
              disabled={val >= ATTR_MAX || freePoints <= 0}
            >
              +
            </button>
          </div>
        )
      })}

      <div className="rpg-derived-stats">
        <div className="rpg-derived-item">
          <div className="rpg-derived-label">生命值</div>
          <div className="rpg-derived-value">{derived.hp}</div>
        </div>
        <div className="rpg-derived-item">
          <div className="rpg-derived-label">物理攻击</div>
          <div className="rpg-derived-value">{derived.physicalAttack}</div>
        </div>
        <div className="rpg-derived-item">
          <div className="rpg-derived-label">魔法攻击</div>
          <div className="rpg-derived-value">{derived.magicalAttack}</div>
        </div>
        <div className="rpg-derived-item">
          <div className="rpg-derived-label">魔法防御</div>
          <div className="rpg-derived-value">{derived.magicalDefense}</div>
        </div>
        <div className="rpg-derived-item">
          <div className="rpg-derived-label">暴击率</div>
          <div className="rpg-derived-value">{derived.critRate}</div>
        </div>
        <div className="rpg-derived-item">
          <div className="rpg-derived-label">闪避率</div>
          <div className="rpg-derived-value">{derived.dodgeRate}</div>
        </div>
      </div>
    </div>
  )
}
