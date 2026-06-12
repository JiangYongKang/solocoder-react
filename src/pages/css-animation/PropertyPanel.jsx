import { useState } from 'react'
import { ANIMATION_PROPERTIES, COLOR_PROPERTIES } from './constants.js'

export default function PropertyPanel({ animation, selectedKeyframe, onUpdateKeyframeValue, onUpdateKeyframeUnit }) {
  const track = selectedKeyframe
    ? animation.tracks.find((t) => t.id === selectedKeyframe.trackId)
    : null
  const keyframe = track
    ? track.keyframes.find((k) => k.id === selectedKeyframe.keyframeId)
    : null
  const config = track ? ANIMATION_PROPERTIES[track.property] : null

  if (!selectedKeyframe || !track || !keyframe || !config) {
    return (
      <div className="properties-panel">
        <h3 className="panel-title">属性编辑</h3>
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-text">
            点击时间轴上的关键帧以编辑属性
          </div>
        </div>
      </div>
    )
  }

  const isColor = COLOR_PROPERTIES.includes(track.property)
  const hasUnit = config.unit && !isColor
  const canToggleUnit = ['translateX', 'translateY', 'border-radius', 'width', 'height'].includes(track.property)

  const handleValueChange = (e) => {
    if (isColor) {
      onUpdateKeyframeValue(selectedKeyframe.trackId, selectedKeyframe.keyframeId, e.target.value)
    } else {
      const value = parseFloat(e.target.value)
      if (!isNaN(value)) {
        const clampedValue = Math.max(config.min, Math.min(config.max, value))
        onUpdateKeyframeValue(selectedKeyframe.trackId, selectedKeyframe.keyframeId, clampedValue)
      }
    }
  }

  const handleUnitToggle = () => {
    const newUnit = track.unit === 'px' ? '%' : 'px'
    onUpdateKeyframeUnit(selectedKeyframe.trackId, newUnit)
  }

  return (
    <div className="properties-panel">
      <h3 className="panel-title">属性编辑</h3>

      <div className="property-group">
        <label className="property-label">属性</label>
        <div className="property-value">
          <input
            type="text"
            value={config.label || track.property}
            readOnly
            style={{ background: '#0a0a1a', color: '#8892b0' }}
          />
        </div>
      </div>

      <div className="property-group">
        <label className="property-label">时间位置</label>
        <div className="property-value">
          <input
            type="text"
            value={`${keyframe.time}%`}
            readOnly
            style={{ background: '#0a0a1a', color: '#8892b0' }}
          />
        </div>
      </div>

      <div className="property-group">
        <label className="property-label">值</label>
        <div className="property-value">
          {isColor ? (
            <>
              <input
                type="color"
                value={keyframe.value}
                onChange={handleValueChange}
              />
              <input
                type="text"
                value={keyframe.value}
                onChange={handleValueChange}
                style={{ flex: 1 }}
              />
            </>
          ) : (
            <>
              <input
                type="number"
                min={config.min}
                max={config.max}
                step={config.step}
                value={keyframe.value}
                onChange={handleValueChange}
              />
              {hasUnit && (
                canToggleUnit ? (
                  <button
                    className={`unit-toggle ${track.unit === 'px' ? 'active' : ''}`}
                    onClick={handleUnitToggle}
                  >
                    px
                  </button>
                ) : (
                  <span className="property-unit">{track.unit}</span>
                )
              )}
              {hasUnit && canToggleUnit && (
                <button
                  className={`unit-toggle ${track.unit === '%' ? 'active' : ''}`}
                  onClick={handleUnitToggle}
                >
                  %
                </button>
              )}
            </>
          )}
        </div>
        {!isColor && (
          <div style={{ marginTop: 12 }}>
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step}
              value={keyframe.value}
              onChange={handleValueChange}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8892b0', marginTop: 4 }}>
              <span>{config.min}</span>
              <span>{config.max}</span>
            </div>
          </div>
        )}
      </div>

      <div className="property-group">
        <label className="property-label">缓动函数</label>
        <div className="property-value">
          <input
            type="text"
            value={keyframe.easing}
            readOnly
            style={{ background: '#0a0a1a', color: '#8892b0' }}
          />
        </div>
        <div style={{ fontSize: 11, color: '#8892b0', marginTop: 8 }}>
          点击关键帧之间的连线编辑缓动曲线
        </div>
      </div>

      {(keyframe.time === 0 || keyframe.time === 100) && (
        <div style={{ fontSize: 11, color: '#fc8181', padding: 8, background: 'rgba(252, 129, 129, 0.1)', borderRadius: 4 }}>
          ⚠️ 0% 和 100% 关键帧不可删除
        </div>
      )}
    </div>
  )
}
