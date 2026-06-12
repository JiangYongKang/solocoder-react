import { useState, useEffect, useRef, useMemo } from 'react'
import { ANIMATION_PROPERTIES, PLAYBACK_SPEEDS, TRANSFORM_PROPERTIES } from './constants.js'
import { generateKeyframesCSS } from './cssAnimationCore.js'

export default function PreviewPanel({ animation, onUpdateSettings }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const animationRef = useRef(null)
  const startTimeRef = useRef(null)
  const frameRef = useRef(null)

  const keyframesCSS = useMemo(() => {
    return generateKeyframesCSS(animation, 'previewAnimation')
  }, [animation])

  const animationStyle = useMemo(() => {
    const visibleTracks = animation.tracks.filter((t) => t.visible)
    const transforms = []
    const styles = {}

    visibleTracks.forEach((track) => {
      const keyframe = track.keyframes[0]
      if (!keyframe) return

      if (TRANSFORM_PROPERTIES.includes(track.property)) {
        const value = keyframe.value
        const unit = track.unit
        switch (track.property) {
          case 'translateX':
          case 'translateY':
            transforms.push(`${track.property}(${value}${unit})`)
            break
          case 'scale':
            transforms.push(`scale(${value})`)
            break
          case 'rotate':
            transforms.push(`rotate(${value}${unit})`)
            break
        }
      } else {
        const config = ANIMATION_PROPERTIES[track.property]
        if (config) {
          styles[config.cssProp] = track.unit
            ? `${keyframe.value}${track.unit}`
            : keyframe.value
        }
      }
    })

    if (transforms.length > 0) {
      styles.transform = transforms.join(' ')
    }

    if (isPlaying) {
      const duration = animation.duration / animation.playbackSpeed
      styles.animation = `previewAnimation ${duration}s linear ${animation.iterations} ${animation.direction} ${animation.fillMode}`
    }

    return styles
  }, [animation, isPlaying])

  useEffect(() => {
    const styleElement = document.getElementById('preview-keyframes')
    if (styleElement) {
      styleElement.textContent = keyframesCSS
    } else {
      const style = document.createElement('style')
      style.id = 'preview-keyframes'
      style.textContent = keyframesCSS
      document.head.appendChild(style)
    }

    return () => {
      const el = document.getElementById('preview-keyframes')
      if (el) el.remove()
    }
  }, [keyframesCSS])

  useEffect(() => {
    if (!isPlaying) return

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const duration = (animation.duration / animation.playbackSpeed) * 1000
      const progress = (elapsed % duration) / duration
      setCurrentTime(progress * 100)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [isPlaying, animation.duration, animation.playbackSpeed])

  const handlePlay = () => {
    setIsPlaying(true)
    startTimeRef.current = null
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    startTimeRef.current = null
    if (animationRef.current) {
      animationRef.current.style.animation = 'none'
      void animationRef.current.offsetWidth
    }
  }

  const handleDurationChange = (e) => {
    const duration = parseFloat(e.target.value)
    onUpdateSettings({ duration })
  }

  const handleSpeedChange = (speed) => {
    onUpdateSettings({ playbackSpeed: speed })
  }

  const handleIterationsChange = (e) => {
    if (e.target.type === 'checkbox') {
      onUpdateSettings({ iterations: e.target.checked ? 'infinite' : 1 })
    } else {
      const value = parseInt(e.target.value)
      if (!isNaN(value) && value > 0) {
        onUpdateSettings({ iterations: value })
      }
    }
  }

  const isInfinite = animation.iterations === 'infinite'

  return (
    <div className="preview-section">
      <h3 className="section-title">动画预览</h3>
      <div className="preview-container">
        <div
          ref={animationRef}
          className="preview-element"
          style={animationStyle}
        />
      </div>

      <div className="preview-controls">
        <div className="control-group">
          {!isPlaying ? (
            <button className="playback-btn" onClick={handlePlay}>
              ▶ 播放
            </button>
          ) : (
            <button className="playback-btn" onClick={handlePause}>
              ⏸ 暂停
            </button>
          )}
          <button className="playback-btn secondary" onClick={handleReset}>
            ↺ 重置
          </button>
        </div>

        <div className="control-group">
          <label>时长:</label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={animation.duration}
            onChange={handleDurationChange}
          />
          <input
            type="number"
            min="0.5"
            max="5"
            step="0.1"
            value={animation.duration}
            onChange={handleDurationChange}
          />
          <span className="property-unit">s</span>
        </div>

        <div className="control-group">
          <label>速度:</label>
          {PLAYBACK_SPEEDS.map((speed) => (
            <button
              key={speed}
              className={`speed-btn ${animation.playbackSpeed === speed ? 'active' : ''}`}
              onClick={() => handleSpeedChange(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="control-group">
          <label>循环:</label>
          <div className="iterations-input">
            <label>
              <input
                type="checkbox"
                checked={isInfinite}
                onChange={handleIterationsChange}
              />
              无限
            </label>
            {!isInfinite && (
              <input
                type="number"
                min="1"
                max="100"
                value={animation.iterations}
                onChange={handleIterationsChange}
              />
            )}
            {!isInfinite && <span className="property-unit">次</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
