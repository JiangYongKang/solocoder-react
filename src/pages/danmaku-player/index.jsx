import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './danmaku-player.css'
import {
  VIDEO_DURATION,
  DANMAKU_POSITIONS,
  DANMAKU_COLORS,
  COLOR_LABELS,
  FONT_SIZES,
  FONT_SIZE_LABELS,
  POSITION_LABELS,
  DENSITY_LEVELS,
  DENSITY_CONFIG,
  PLAYBACK_SPEEDS,
  DEFAULT_SETTINGS,
} from './constants.js'
import {
  formatTime,
  validateDanmakuText,
  createDanmaku,
  getFontSizePx,
  getDensityConfig,
  measureTextWidth,
  calculateScrollSpeed,
  initializeScrollTracks,
  findAvailableScrollTrack,
  getTrackYPosition,
  getFixedYPosition,
  checkFixedPositionConflict,
  updateScrollDanmaku,
  updateFixedDanmaku,
  updateAllDanmakus,
  removeExpiredDanmakus,
  clampOpacity,
  clampVolume,
  clampPlaybackSpeed,
  loadSettings,
  saveSettings,
  calculateProgressPercent,
  calculateTimeFromPercent,
  sortDanmakuListByTime,
  getDanmakuPositionIcon,
  evictOldestIfOverCapacity,
  cleanupOutOfRangeScrollDanmakus,
} from './danmakuCore.js'

const DanmakuPlayerPage = () => {
  const navigate = useNavigate()

  const [settings, setSettings] = useState(() => loadSettings())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [danmakuText, setDanmakuText] = useState('')
  const [danmakuPosition, setDanmakuPosition] = useState(DANMAKU_POSITIONS.SCROLL)
  const [danmakuColor, setDanmakuColor] = useState(DANMAKU_COLORS[0])
  const [danmakuFontSize, setDanmakuFontSize] = useState(FONT_SIZES.MEDIUM)
  const [danmakuList, setDanmakuList] = useState([])
  const [activeDanmakus, setActiveDanmakus] = useState([])
  const [validationError, setValidationError] = useState(null)

  const [listExpanded, setListExpanded] = useState(true)

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneCanvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const playTimerRef = useRef(null)
  const scrollTracksRef = useRef(initializeScrollTracks(DENSITY_CONFIG[settings.density].trackCount))
  const progressTrackRef = useRef(null)
  const isDraggingRef = useRef(false)
  const lastRenderSignatureRef = useRef(null)
  const nativeFullscreenRef = useRef(false)

  useEffect(() => {
    setSettings((prev) => {
      const updated = { ...prev }
      saveSettings(updated)
      return updated
    })
  }, [])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const config = getDensityConfig(settings.density)
    scrollTracksRef.current = initializeScrollTracks(config.trackCount)
    setActiveDanmakus((prev) => cleanupOutOfRangeScrollDanmakus(prev, config.trackCount))
  }, [settings.density])

  useEffect(() => {
    if (!sceneCanvasRef.current) return
    const canvas = sceneCanvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(0.5, '#16213e')
    grad.addColorStop(1, '#0f3460')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(233, 69, 96, 0.15)'
    ctx.beginPath()
    ctx.arc(w * 0.2, h * 0.8, h * 0.4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(15, 52, 96, 0.3)'
    ctx.beginPath()
    ctx.arc(w * 0.8, h * 0.2, h * 0.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('▶ 弹幕播放器模拟', w / 2, h / 2 - 10)
    ctx.font = '16px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.fillText('播放视频时弹幕将在此区域显示', w / 2, h / 2 + 20)
  }, [isFullscreen])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
  }, [isFullscreen])

  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + settings.playbackSpeed * 0.1
          if (next >= VIDEO_DURATION) {
            setIsPlaying(false)
            return VIDEO_DURATION
          }
          return next
        })
      }, 100)
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
    }
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
    }
  }, [isPlaying, settings.playbackSpeed])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const renderFrame = (timestamp) => {
      const canvasW = canvas.width / dpr
      const canvasH = canvas.height / dpr
      const speed = calculateScrollSpeed(canvasW)
      const now = Date.now()
      const activeIds = activeDanmakus.map((d) => `${d.id}:${d.startTime}:${d.opacity}`).join('|')
      const renderSignature = `${isPlaying}|${settings.danmakuEnabled}|${settings.danmakuOpacity}|${settings.density}|${activeIds}|${canvasW}x${canvasH}|${isPlaying ? now : 'paused'}`

      if (!isPlaying && lastRenderSignatureRef.current === renderSignature) {
        animFrameRef.current = requestAnimationFrame(renderFrame)
        return
      }
      lastRenderSignatureRef.current = renderSignature

      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvasW, canvasH)

      if (!settings.danmakuEnabled) {
        ctx.restore()
        animFrameRef.current = requestAnimationFrame(renderFrame)
        return
      }

      const updated = updateAllDanmakus(activeDanmakus, now, canvasW, speed, canvasH)
      const cleaned = removeExpiredDanmakus(updated)

      if (cleaned.length !== updated.length) {
        setActiveDanmakus(cleaned)
      }

      const config = getDensityConfig(settings.density)
      const maxCapacity = config.trackCount * 10
      const evicted = evictOldestIfOverCapacity(cleaned, maxCapacity)
      if (evicted !== cleaned) {
        setActiveDanmakus(evicted)
      }

      const danmakusToRender = evicted

      for (const d of danmakusToRender) {
        const fontSize = getFontSizePx(d.fontSize)
        const globalAlpha = (d.opacity ?? 1) * settings.danmakuOpacity

        ctx.save()
        ctx.globalAlpha = Math.max(0, Math.min(1, globalAlpha))
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.fillStyle = d.color

        if (d.position === DANMAKU_POSITIONS.SCROLL) {
          ctx.textAlign = 'left'
          ctx.fillText(d.text, d.x, d.y)
        } else {
          ctx.textAlign = 'center'
          ctx.fillText(d.text, canvasW / 2, d.y)
        }

        ctx.restore()
      }

      ctx.restore()
      animFrameRef.current = requestAnimationFrame(renderFrame)
    }

    animFrameRef.current = requestAnimationFrame(renderFrame)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [isPlaying, settings.danmakuEnabled, settings.danmakuOpacity, settings.density, activeDanmakus])

  const handleSendDanmaku = useCallback(() => {
    const validation = validateDanmakuText(danmakuText)
    if (!validation.valid) {
      setValidationError(validation.error)
      return
    }
    if (validation.truncated) {
      setValidationError(validation.error)
    } else {
      setValidationError(null)
    }

    const danmaku = createDanmaku({
      text: validation.trimmed,
      position: danmakuPosition,
      color: danmakuColor,
      fontSize: danmakuFontSize,
      videoTime: currentTime,
    })

    if (!danmaku) return

    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const canvasW = canvas.width / dpr
    const canvasH = canvas.height / dpr
    const speed = calculateScrollSpeed(canvasW)
    const now = Date.now()
    const ctx = canvas.getContext('2d')
    const textWidth = measureTextWidth(ctx, danmaku.text, danmaku.fontSize)
    const fontSize = getFontSizePx(danmaku.fontSize)

    let enrichedDanmaku = { ...danmaku, startTime: now, textWidth, opacity: 1 }

    if (danmaku.position === DANMAKU_POSITIONS.SCROLL) {
      const config = getDensityConfig(settings.density)
      const trackIndex = findAvailableScrollTrack(
        scrollTracksRef.current,
        now,
        canvasW,
        textWidth,
        speed
      )
      const y = getTrackYPosition(trackIndex, settings.density, canvasH, danmaku.fontSize)
      enrichedDanmaku = { ...enrichedDanmaku, trackIndex, y, x: canvasW }
      scrollTracksRef.current[trackIndex] = [
        ...scrollTracksRef.current[trackIndex],
        enrichedDanmaku,
      ]
    } else {
      const y = getFixedYPosition(danmaku.position, canvasH, danmaku.fontSize)
      const hasConflict = checkFixedPositionConflict(
        activeDanmakus,
        danmaku.position,
        canvasH,
        danmaku.fontSize
      )
      if (hasConflict) {
        enrichedDanmaku = {
          ...enrichedDanmaku,
          y,
          startTime: now + 500,
          opacity: 0,
        }
        setTimeout(() => {
          setActiveDanmakus((prev) =>
            prev.map((d) => (d.id === danmaku.id ? { ...d, opacity: 1 } : d))
          )
        }, 500)
      } else {
        enrichedDanmaku = { ...enrichedDanmaku, y }
      }
    }

    setActiveDanmakus((prev) => [...prev, enrichedDanmaku])
    setDanmakuList((prev) => [...prev, danmaku])
    setDanmakuText('')
    if (!validation.truncated) {
      setValidationError(null)
    }
  }, [danmakuText, danmakuPosition, danmakuColor, danmakuFontSize, currentTime, settings.density, activeDanmakus])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSendDanmaku()
      }
    },
    [handleSendDanmaku]
  )

  const togglePlay = useCallback(() => {
    if (currentTime >= VIDEO_DURATION) {
      setCurrentTime(0)
      setActiveDanmakus([])
      scrollTracksRef.current = initializeScrollTracks(
        getDensityConfig(settings.density).trackCount
      )
      setIsPlaying(true)
      return
    }
    setIsPlaying((prev) => !prev)
  }, [currentTime, settings.density])

  const handleProgressMouseDown = useCallback((e) => {
    isDraggingRef.current = true
    handleProgressSeek(e)
  }, [])

  const handleProgressMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return
    handleProgressSeek(e)
  }, [])

  const handleProgressMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  const handleProgressSeek = useCallback((e) => {
    if (!progressTrackRef.current) return
    const rect = progressTrackRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const percent = (x / rect.width) * 100
    const time = calculateTimeFromPercent(percent, VIDEO_DURATION)
    setCurrentTime(time)
  }, [])

  const handleVolumeChange = useCallback((e) => {
    setSettings((prev) => ({ ...prev, volume: clampVolume(parseFloat(e.target.value)) }))
  }, [])

  const handleSpeedChange = useCallback((e) => {
    setSettings((prev) => ({
      ...prev,
      playbackSpeed: clampPlaybackSpeed(parseFloat(e.target.value)),
    }))
  }, [])

  const handleOpacityChange = useCallback((e) => {
    setSettings((prev) => ({ ...prev, danmakuOpacity: clampOpacity(parseFloat(e.target.value)) }))
  }, [])

  const toggleDanmaku = useCallback(() => {
    setSettings((prev) => ({ ...prev, danmakuEnabled: !prev.danmakuEnabled }))
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) {
      setIsFullscreen((prev) => !prev)
      return
    }

    const isCurrentlyFull =
      !!document.fullscreenElement ||
      !!document.webkitFullscreenElement ||
      !!document.msFullscreenElement ||
      nativeFullscreenRef.current

    const exitFullscreen =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen

    const requestFullscreen =
      container.requestFullscreen ||
      container.webkitRequestFullscreen ||
      container.msRequestFullscreen

    if (isCurrentlyFull) {
      nativeFullscreenRef.current = false
      setIsFullscreen(false)
      if (exitFullscreen && document.fullscreenElement) {
        try { exitFullscreen.call(document).catch(() => {}) } catch (_) { /* noop */ }
      }
    } else {
      nativeFullscreenRef.current = true
      setIsFullscreen(true)
      if (requestFullscreen) {
        try {
          requestFullscreen.call(container).catch(() => {
            nativeFullscreenRef.current = false
            setIsFullscreen(false)
          })
        } catch (_) {
          nativeFullscreenRef.current = false
          setIsFullscreen(false)
        }
      } else {
        nativeFullscreenRef.current = false
        setIsFullscreen(false)
      }
    }
  }, [])

  const handleReload = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setActiveDanmakus([])
    scrollTracksRef.current = initializeScrollTracks(
      getDensityConfig(settings.density).trackCount
    )
    lastRenderSignatureRef.current = null
  }, [settings.density])

  const handleDensityChange = useCallback((density) => {
    setSettings((prev) => ({ ...prev, density }))
  }, [])

  const handleDanmakuListClick = useCallback((videoTime) => {
    setCurrentTime(videoTime)
  }, [])

  const handleClearDanmakuList = useCallback(() => {
    setDanmakuList([])
  }, [])

  const handleStop = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setActiveDanmakus([])
    scrollTracksRef.current = initializeScrollTracks(
      getDensityConfig(settings.density).trackCount
    )
    lastRenderSignatureRef.current = null
  }, [settings.density])

  useEffect(() => {
    const handleFsChange = () => {
      const isFs =
        !!document.fullscreenElement ||
        !!document.webkitFullscreenElement ||
        !!document.msFullscreenElement
      setIsFullscreen(isFs)
      nativeFullscreenRef.current = isFs
      lastRenderSignatureRef.current = null
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    document.addEventListener('msfullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
      document.removeEventListener('msfullscreenchange', handleFsChange)
    }
  }, [])

  const progressPercent = useMemo(
    () => calculateProgressPercent(currentTime, VIDEO_DURATION),
    [currentTime]
  )

  const sortedDanmakuList = useMemo(() => sortDanmakuListByTime(danmakuList), [danmakuList])

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
      }
      if (sceneCanvasRef.current) {
        const canvas = sceneCanvasRef.current
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        const w = rect.width
        const h = rect.height
        const grad = ctx.createLinearGradient(0, 0, w, h)
        grad.addColorStop(0, '#1a1a2e')
        grad.addColorStop(0.5, '#16213e')
        grad.addColorStop(1, '#0f3460')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = 'rgba(233, 69, 96, 0.15)'
        ctx.beginPath()
        ctx.arc(w * 0.2, h * 0.8, h * 0.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(15, 52, 96, 0.3)'
        ctx.beginPath()
        ctx.arc(w * 0.8, h * 0.2, h * 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('▶ 弹幕播放器模拟', w / 2, h / 2 - 10)
        ctx.font = '16px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.fillText('播放视频时弹幕将在此区域显示', w / 2, h / 2 + 20)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="danmaku-player-page">
      <div className="danmaku-player-header">
        <button className="danmaku-player-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="danmaku-player-title">弹幕播放器</h1>
      </div>

      <div className="danmaku-player-body">
        <div className="danmaku-player-main">
          <div
            className={`video-container ${isFullscreen ? 'fullscreen' : ''}`}
            ref={containerRef}
          >
            <div className="video-scene">
              <canvas ref={sceneCanvasRef} className="video-scene-canvas" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
              <canvas ref={canvasRef} className="danmaku-canvas" />
            </div>

            <div className="danmaku-controls-bar">
              <div
                className="progress-bar-wrapper"
                ref={progressTrackRef}
                onMouseDown={handleProgressMouseDown}
                onMouseMove={handleProgressMouseMove}
                onMouseUp={handleProgressMouseUp}
                onMouseLeave={handleProgressMouseUp}
              >
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-filled"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div
                    className="progress-bar-thumb"
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>
                <div className="progress-time">
                  {formatTime(currentTime)} / {formatTime(VIDEO_DURATION)}
                </div>
              </div>

              <div className="controls-row">
                <div className="controls-left">
                  <button className="control-btn play-pause" onClick={togglePlay}>
                    {isPlaying ? '❚❚' : '▶'}
                  </button>
                  <button className="control-btn" onClick={handleStop} title="停止">
                    ■
                  </button>
                  <button className="control-btn" onClick={handleReload} title="重新加载">
                    ⟳
                  </button>
                </div>

                <div className="controls-center">
                  <div className="volume-control">
                    <span>🔊</span>
                    <input
                      type="range"
                      className="volume-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.volume}
                      onChange={handleVolumeChange}
                    />
                  </div>
                  <select
                    className="speed-select"
                    value={settings.playbackSpeed}
                    onChange={handleSpeedChange}
                  >
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <option key={speed} value={speed}>
                        {speed}x
                      </option>
                    ))}
                  </select>
                </div>

                <div className="controls-right">
                  <button
                    className={`danmaku-toggle-btn ${settings.danmakuEnabled ? 'active' : ''}`}
                    onClick={toggleDanmaku}
                  >
                    弹幕 {settings.danmakuEnabled ? 'ON' : 'OFF'}
                  </button>
                  <div className="opacity-control">
                    <span>透明度</span>
                    <input
                      type="range"
                      className="opacity-slider"
                      min="0.1"
                      max="1"
                      step="0.01"
                      value={settings.danmakuOpacity}
                      onChange={handleOpacityChange}
                    />
                    <span>{Math.round(settings.danmakuOpacity * 100)}%</span>
                  </div>
                  <button className="fullscreen-btn" onClick={toggleFullscreen}>
                    {isFullscreen ? '退出全屏' : '全屏'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="danmaku-input-section">
            <div className="danmaku-input-row">
              <input
                className="danmaku-input"
                type="text"
                placeholder="输入弹幕内容（最多50个字符）"
                value={danmakuText}
                onChange={(e) => {
                  setDanmakuText(e.target.value)
                  setValidationError(null)
                }}
                onKeyDown={handleKeyDown}
                maxLength={60}
              />
              <button className="danmaku-send-btn" onClick={handleSendDanmaku}>
                发送
              </button>
            </div>
            {validationError && (
              <div className="danmaku-input-hint">{validationError}</div>
            )}
            <div className="danmaku-options">
              <div className="option-group">
                <span className="option-label">位置：</span>
                <div className="position-options">
                  {Object.values(DANMAKU_POSITIONS).map((pos) => (
                    <button
                      key={pos}
                      className={`option-btn ${danmakuPosition === pos ? 'active' : ''}`}
                      onClick={() => setDanmakuPosition(pos)}
                    >
                      {POSITION_LABELS[pos]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <span className="option-label">颜色：</span>
                <div className="color-options">
                  {DANMAKU_COLORS.map((color, idx) => (
                    <button
                      key={color}
                      className={`color-btn ${danmakuColor === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setDanmakuColor(color)}
                      title={COLOR_LABELS[idx]}
                    />
                  ))}
                </div>
              </div>

              <div className="option-group">
                <span className="option-label">字号：</span>
                <div className="fontsize-options">
                  {Object.values(FONT_SIZES).map((size) => (
                    <button
                      key={size}
                      className={`option-btn ${danmakuFontSize === size ? 'active' : ''}`}
                      onClick={() => setDanmakuFontSize(size)}
                    >
                      {FONT_SIZE_LABELS[size]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="danmaku-list-panel">
          <div className="danmaku-list-header">
            <h3 className="danmaku-list-title" onClick={() => setListExpanded((p) => !p)} style={{ cursor: 'pointer' }}>
              弹幕列表 {listExpanded ? '▼' : '▶'}
            </h3>
            <div className="danmaku-list-actions">
              <button className="danmaku-list-btn danger" onClick={handleClearDanmakuList}>
                清空
              </button>
            </div>
          </div>

          <div className="danmaku-density-control">
            <span className="option-label">密度：</span>
            <div className="density-options">
              {Object.values(DENSITY_LEVELS).map((level) => (
                <button
                  key={level}
                  className={`density-btn ${settings.density === level ? 'active' : ''}`}
                  onClick={() => handleDensityChange(level)}
                >
                  {DENSITY_CONFIG[level].label}
                </button>
              ))}
            </div>
          </div>

          {listExpanded && (
            <div className="danmaku-list">
              {sortedDanmakuList.length > 0 ? (
                sortedDanmakuList.map((d) => (
                  <div
                    key={d.id}
                    className="danmaku-list-item"
                    onClick={() => handleDanmakuListClick(d.videoTime)}
                  >
                    <div className="danmaku-item-meta">
                      <span className="danmaku-item-time">{formatTime(d.videoTime)}</span>
                      <span className="danmaku-item-type">
                        {getDanmakuPositionIcon(d.position)}
                      </span>
                      <span className="danmaku-item-user">{d.username}</span>
                    </div>
                    <div className="danmaku-item-text" style={{ color: d.color }}>
                      {d.text}
                    </div>
                  </div>
                ))
              ) : (
                <div className="danmaku-list-empty">暂无弹幕，快来发送第一条吧！</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DanmakuPlayerPage
