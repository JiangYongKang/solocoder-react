import { ANIMATION_TYPE_LIST, ANIMATION_TYPES } from './constants.js'

function AnimationThumbnail({ type, config }) {
  const { primaryColor, secondaryColor, size } = config

  switch (type) {
    case 'spinner':
      return (
        <div
          className="thumb-spinner"
          style={{
            width: size / 2,
            height: size / 2,
            border: `${Math.max(2, 4 / 2)}px solid ${secondaryColor}`,
            borderTop: `${Math.max(2, 4 / 2)}px solid ${primaryColor}`,
          }}
        />
      )
    case 'pulse':
      return (
        <div
          className="thumb-pulse"
          style={{
            width: size / 2,
            height: size / 2,
            backgroundColor: primaryColor,
          }}
        />
      )
    case 'wave':
      return (
        <div className="thumb-wave" style={{ height: size / 2 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="thumb-wave-bar"
              style={{
                width: Math.max(2, 4 / 2),
                backgroundColor: primaryColor,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )
    case 'skeleton':
      return (
        <div className="thumb-skeleton" style={{ width: size / 2 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="thumb-skeleton-block"
              style={{
                height: 16 / 2,
                background: `linear-gradient(90deg, ${primaryColor} 25%, ${secondaryColor} 50%, ${primaryColor} 75%)`,
                backgroundSize: '200% 100%',
                width: `${100 - i * 15}%`,
              }}
            />
          ))}
        </div>
      )
    case 'dots':
      return (
        <div className="thumb-dots">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="thumb-dot"
              style={{
                width: size / 2,
                height: size / 2,
                backgroundColor: primaryColor,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )
    case 'progress':
      return (
        <div className="thumb-progress" style={{ width: size / 2, height: 8 / 2 }}>
          <div
            className="thumb-progress-bar"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
      )
    case 'circleProgress': {
      const thumbSize = size / 2
      const radius = (thumbSize - 6 / 2) / 2
      const center = thumbSize / 2
      return (
        <svg className="thumb-circle" width={thumbSize} height={thumbSize}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke={secondaryColor} strokeWidth={6 / 2} />
          <circle cx={center} cy={center} r={radius} fill="none" stroke={primaryColor} strokeWidth={6 / 2} strokeLinecap="round" />
        </svg>
      )
    }
    default:
      return null
  }
}

export default function AnimationTypeSelector({ onSelect, selectedType, onDragStart }) {
  return (
    <div className="animation-type-selector">
      <h3 className="panel-title">动画类型</h3>
      <div className="animation-grid">
        {ANIMATION_TYPE_LIST.map((animType) => {
          const anim = ANIMATION_TYPES[animType.id]
          const isSelected = selectedType === animType.id
          return (
            <div
              key={animType.id}
              className={`animation-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(animType.id)}
              draggable
              onDragStart={(e) => onDragStart && onDragStart(e, animType.id)}
            >
              <div className="animation-thumb">
                <AnimationThumbnail type={animType.id} config={anim.defaultConfig} />
              </div>
              <div className="animation-info">
                <span className="animation-name">{anim.name}</span>
                <span className="animation-desc">{anim.description}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
