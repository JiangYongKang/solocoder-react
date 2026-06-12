import { useState, useRef, useEffect, useCallback } from 'react'
import { ANIMATION_PROPERTIES, TIMELINE_TICKS, TRANSFORM_PROPERTIES, COLOR_PROPERTIES } from './constants.js'
import { getSurroundingKeyframes } from './cssAnimationCore.js'

export default function Timeline({
  animation,
  selectedKeyframe,
  onSelectKeyframe,
  onAddKeyframe,
  onRemoveKeyframe,
  onMoveKeyframe,
  onUpdateKeyframeValue,
  onToggleVisibility,
  onRemoveTrack,
  onAddTrack,
  onEditEasing,
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [hoveredKeyframe, setHoveredKeyframe] = useState(null)
  const timelineRef = useRef(null)

  const availableProperties = Object.keys(ANIMATION_PROPERTIES).filter(
    (prop) => !animation.tracks.some((t) => t.property === prop)
  )
  const [newTrackProperty, setNewTrackProperty] = useState(availableProperties[0] || '')

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const getTimeFromPosition = useCallback((clientX, trackElement) => {
    const rect = trackElement.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = (x / rect.width) * 100
    return Math.max(0, Math.min(100, Math.round(percentage * 10) / 10))
  }, [])

  const handleTrackClick = (e, trackId) => {
    if (e.target.closest('.keyframe-point') || e.target.closest('.easing-line')) return
    const time = getTimeFromPosition(e.clientX, e.currentTarget)
    onAddKeyframe(trackId, time)
  }

  const handleKeyframeClick = (e, trackId, keyframeId) => {
    e.stopPropagation()
    onSelectKeyframe({ trackId, keyframeId })
  }

  const handleKeyframeMouseDown = (e, trackId, keyframeId) => {
    e.stopPropagation()
    setDragging({ trackId, keyframeId, startX: e.clientX })
    onSelectKeyframe({ trackId, keyframeId })
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    const trackElement = document.querySelector(`[data-track-id="${dragging.trackId}"]`)
    if (!trackElement) return
    const time = getTimeFromPosition(e.clientX, trackElement)
    onMoveKeyframe(dragging.trackId, dragging.keyframeId, time)
  }, [dragging, getTimeFromPosition, onMoveKeyframe])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  const handleContextMenu = (e, trackId, keyframeId) => {
    e.preventDefault()
    e.stopPropagation()
    const track = animation.tracks.find((t) => t.id === trackId)
    const keyframe = track?.keyframes.find((k) => k.id === keyframeId)
    if (keyframe?.time === 0 || keyframe?.time === 100) return

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      trackId,
      keyframeId,
    })
  }

  const handleDeleteKeyframe = () => {
    if (contextMenu) {
      onRemoveKeyframe(contextMenu.trackId, contextMenu.keyframeId)
      setContextMenu(null)
    }
  }

  const handleEasingLineClick = (e, trackId, fromKeyframeId) => {
    e.stopPropagation()
    const track = animation.tracks.find((t) => t.id === trackId)
    const keyframe = track?.keyframes.find((k) => k.id === fromKeyframeId)
    onEditEasing(trackId, fromKeyframeId, keyframe?.easing || 'linear')
  }

  const handleAddTrack = () => {
    if (newTrackProperty) {
      onAddTrack(newTrackProperty)
      const nextAvailable = Object.keys(ANIMATION_PROPERTIES).filter(
        (prop) => prop !== newTrackProperty && !animation.tracks.some((t) => t.property === prop)
      )
      setNewTrackProperty(nextAvailable[0] || '')
    }
  }

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Delete' && selectedKeyframe) {
      const track = animation.tracks.find((t) => t.id === selectedKeyframe.trackId)
      const keyframe = track?.keyframes.find((k) => k.id === selectedKeyframe.keyframeId)
      if (keyframe && keyframe.time !== 0 && keyframe.time !== 100 && track.keyframes.length > 2) {
        onRemoveKeyframe(selectedKeyframe.trackId, selectedKeyframe.keyframeId)
      }
    }
  }, [selectedKeyframe, animation.tracks, onRemoveKeyframe])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const getEasingLineStyle = (from, to) => {
    const left = `${from}%`
    const width = `${to - from}%`
    return { left, width }
  }

  return (
    <div className="timeline-section">
      <h3 className="section-title">关键帧时间轴</h3>
      <div className="timeline-container" ref={timelineRef}>
        <div className="timeline-header">
          {TIMELINE_TICKS.map((tick) => (
            <div key={tick} className="timeline-tick">
              {tick}%
            </div>
          ))}
        </div>

        <div className="timeline-body">
          {animation.tracks.map((track) => {
            const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time)
            const config = ANIMATION_PROPERTIES[track.property]

            return (
              <div key={track.id} className="track">
                <div className="track-label">
                  <span className="track-name">{config?.label || track.property}</span>
                  <button
                    className={`visibility-toggle ${track.visible ? 'visible' : ''}`}
                    onClick={() => onToggleVisibility(track.id)}
                    title={track.visible ? '隐藏' : '显示'}
                  >
                    {track.visible ? '👁' : '👁‍🗨'}
                  </button>
                  {animation.tracks.length > 1 && (
                    <button
                      className="remove-track-btn"
                      onClick={() => onRemoveTrack(track.id)}
                      title="移除轨道"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div
                  className="track-timeline"
                  data-track-id={track.id}
                  onClick={(e) => handleTrackClick(e, track.id)}
                >
                  <div className="track-grid-lines">
                    {TIMELINE_TICKS.map((tick) => (
                      <div
                        key={tick}
                        className="grid-line"
                        style={{ left: `${tick}%` }}
                      />
                    ))}
                  </div>

                  {sortedKeyframes.slice(0, -1).map((keyframe, idx) => {
                    const nextKeyframe = sortedKeyframes[idx + 1]
                    return (
                      <div
                        key={`easing-${keyframe.id}`}
                        className="easing-line"
                        style={getEasingLineStyle(keyframe.time, nextKeyframe.time)}
                        onClick={(e) => handleEasingLineClick(e, track.id, keyframe.id)}
                        title={`缓动: ${keyframe.easing}`}
                      />
                    )
                  })}

                  {track.keyframes.map((keyframe) => (
                    <div
                      key={keyframe.id}
                      className={`keyframe-point ${
                        selectedKeyframe?.trackId === track.id &&
                        selectedKeyframe?.keyframeId === keyframe.id
                          ? 'selected'
                          : ''
                      } ${dragging?.trackId === track.id && dragging?.keyframeId === keyframe.id ? 'dragging' : ''}`}
                      style={{ left: `${keyframe.time}%` }}
                      onClick={(e) => handleKeyframeClick(e, track.id, keyframe.id)}
                      onMouseDown={(e) => handleKeyframeMouseDown(e, track.id, keyframe.id)}
                      onContextMenu={(e) => handleContextMenu(e, track.id, keyframe.id)}
                      onMouseEnter={() => setHoveredKeyframe({ trackId: track.id, keyframeId: keyframe.id })}
                      onMouseLeave={() => setHoveredKeyframe(null)}
                    >
                      {hoveredKeyframe?.trackId === track.id &&
                        hoveredKeyframe?.keyframeId === keyframe.id && (
                          <div className="track-time-indicator">
                            {keyframe.time}%
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {availableProperties.length > 0 && (
            <div className="add-track-container">
              <select
                className="add-track-select"
                value={newTrackProperty}
                onChange={(e) => setNewTrackProperty(e.target.value)}
              >
                {availableProperties.map((prop) => (
                  <option key={prop} value={prop}>
                    {ANIMATION_PROPERTIES[prop]?.label || prop}
                  </option>
                ))}
              </select>
              <button className="add-track-btn" onClick={handleAddTrack}>
                + 添加属性
              </button>
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="context-menu-item danger"
            onClick={handleDeleteKeyframe}
          >
            删除关键帧
          </div>
        </div>
      )}
    </div>
  )
}
