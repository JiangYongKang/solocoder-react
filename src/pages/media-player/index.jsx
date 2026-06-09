import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './media-player.css'
import { PLAYBACK_SPEEDS, SAMPLE_LRC, MEDIA_TYPES } from './constants'
import {
  formatTime,
  parseLrc,
  findCurrentLyricIndex,
  validateMediaItem,
  createMediaItem,
  loadPlaylist,
  savePlaylist,
  savePlaybackState,
  loadPlaybackState,
  loadLyrics,
  saveLyrics,
  loadSettings,
  saveSettings,
  reorderPlaylist,
  getNextMediaIndex,
  getPrevMediaIndex,
  findMediaIndexById,
  seekWithinDuration,
  calculateProgressPercent,
  calculateTimeFromPercent,
  mergePlaylistItems,
  generateDefaultPlaylistItems,
  findBufferedEnd,
  clampPercent,
} from './mediaPlayerUtils'

const CLICK_DELAY = 250

const MediaPlayerPage = () => {
  const navigate = useNavigate()

  const [playlist, setPlaylist] = useState(() => loadPlaylist())
  const [settings, setSettings] = useState(() => loadSettings())
  const [playbackState, setPlaybackState] = useState(() => loadPlaybackState())
  const [lrcText, setLrcText] = useState(() => loadLyrics() || SAMPLE_LRC)

  const initialIndex = useMemo(() => {
    if (playbackState && playbackState.currentMediaId) {
      const idx = findMediaIndexById(playlist, playbackState.currentMediaId)
      return idx >= 0 ? idx : 0
    }
    return 0
  }, [playbackState, playlist])

  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => (playbackState ? playbackState.currentTime : 0))
  const [duration, setDuration] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayType, setOverlayType] = useState('play')

  const [isDraggingProgress, setIsDraggingProgress] = useState(false)
  const [dragHoverTime, setDragHoverTime] = useState(null)
  const [dragHoverX, setDragHoverX] = useState(0)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenControlsVisible, setFullscreenControlsVisible] = useState(true)

  const [newMediaTitle, setNewMediaTitle] = useState('')
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [addMediaErrors, setAddMediaErrors] = useState({})

  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const [draggedItemId, setDraggedItemId] = useState(null)
  const [dragOverItemId, setDragOverItemId] = useState(null)

  const mediaRef = useRef(null)
  const pageRef = useRef(null)
  const lyricsContentRef = useRef(null)
  const fullscreenHideTimerRef = useRef(null)
  const progressTrackRef = useRef(null)
  const clickTimerRef = useRef(null)
  const currentTimeRef = useRef(0)
  const currentMediaIdRef = useRef(null)

  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])

  useEffect(() => {
    currentMediaIdRef.current = currentMedia?.id || null
  }, [currentMedia])

  const parsedLyrics = useMemo(() => parseLrc(lrcText), [lrcText])
  const currentLyricIndex = useMemo(
    () => findCurrentLyricIndex(parsedLyrics, currentTime),
    [parsedLyrics, currentTime]
  )

  const currentMedia = playlist[currentIndex] || null
  const isVideo = currentMedia?.type === MEDIA_TYPES.VIDEO

  useEffect(() => {
    savePlaylist(playlist)
  }, [playlist])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    saveLyrics(lrcText)
  }, [lrcText])

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentMediaIdRef.current) {
        savePlaybackState({
          currentMediaId: currentMediaIdRef.current,
          currentTime: Math.floor(currentTimeRef.current),
        })
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (mediaRef.current && settings.volume !== undefined) {
      mediaRef.current.volume = settings.volume
    }
  }, [settings.volume])

  useEffect(() => {
    if (mediaRef.current && settings.playbackSpeed !== undefined) {
      mediaRef.current.playbackRate = settings.playbackSpeed
    }
  }, [settings.playbackSpeed])

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
      if (fullscreenHideTimerRef.current) {
        clearTimeout(fullscreenHideTimerRef.current)
      }
      if (currentMediaIdRef.current) {
        savePlaybackState({
          currentMediaId: currentMediaIdRef.current,
          currentTime: Math.floor(currentTimeRef.current),
        })
      }
    }
  }, [])

  useEffect(() => {
    if (currentLyricIndex >= 0 && lyricsContentRef.current) {
      const lines = lyricsContentRef.current.querySelectorAll('.lyrics-line')
      const currentLine = lines[currentLyricIndex]
      if (currentLine) {
        const container = lyricsContentRef.current
        const containerHeight = container.clientHeight
        const lineTop = currentLine.offsetTop
        const lineHeight = currentLine.offsetHeight
        container.scrollTo({
          top: lineTop - containerHeight / 2 + lineHeight / 2,
          behavior: 'smooth',
        })
      }
    }
  }, [currentLyricIndex])

  const resetFullscreenHideTimer = useCallback(() => {
    if (!document.fullscreenElement) return
    if (fullscreenHideTimerRef.current) {
      clearTimeout(fullscreenHideTimerRef.current)
    }
    setFullscreenControlsVisible(true)
    fullscreenHideTimerRef.current = setTimeout(() => {
      setFullscreenControlsVisible(false)
    }, 3000)
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (document.fullscreenElement) {
        resetFullscreenHideTimer()
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [resetFullscreenHideTimer])

  useEffect(() => {
    return () => {
      if (fullscreenHideTimerRef.current) {
        clearTimeout(fullscreenHideTimerRef.current)
      }
    }
  }, [])

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration || 0)
      if (playbackState && playbackState.currentMediaId === currentMedia?.id && playbackState.currentTime > 0) {
        mediaRef.current.currentTime = playbackState.currentTime
        setPlaybackState(null)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (mediaRef.current && !isDraggingProgress) {
      setCurrentTime(mediaRef.current.currentTime)
    }
  }

  const handleProgress = () => {
    if (mediaRef.current) {
      const end = findBufferedEnd(mediaRef.current.buffered, duration)
      setBufferedEnd(end)
    }
  }

  const handleEnded = () => {
    const nextIdx = getNextMediaIndex(playlist, currentIndex)
    if (nextIdx >= 0) {
      setCurrentIndex(nextIdx)
      setCurrentTime(0)
      setTimeout(() => {
        if (mediaRef.current) {
          mediaRef.current.play().catch(() => {})
          setIsPlaying(true)
        }
      }, 100)
    } else {
      setIsPlaying(false)
    }
  }

  const togglePlay = useCallback(() => {
    if (!mediaRef.current || !currentMedia) return
    if (isPlaying) {
      mediaRef.current.pause()
      setIsPlaying(false)
      setOverlayType('pause')
    } else {
      mediaRef.current.play().catch(() => {})
      setIsPlaying(true)
      setOverlayType('play')
    }
    setShowOverlay(true)
    setTimeout(() => setShowOverlay(false), 500)
  }, [isPlaying, currentMedia])

  const handleMediaClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      return
    }
    clickTimerRef.current = setTimeout(() => {
      togglePlay()
      clickTimerRef.current = null
    }, CLICK_DELAY)
  }

  const handleVideoDoubleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }
    if (isVideo) {
      toggleFullscreen()
    }
  }

  const handleSeek = (time) => {
    if (mediaRef.current && duration > 0) {
      const clampedTime = Math.max(0, Math.min(duration, time))
      mediaRef.current.currentTime = clampedTime
      setCurrentTime(clampedTime)
    }
  }

  const handleFastForward = () => {
    if (mediaRef.current) {
      const newTime = seekWithinDuration(currentTime, 10, duration)
      handleSeek(newTime)
    }
  }

  const handleRewind = () => {
    if (mediaRef.current) {
      const newTime = seekWithinDuration(currentTime, -10, duration)
      handleSeek(newTime)
    }
  }

  const handleNext = () => {
    const nextIdx = getNextMediaIndex(playlist, currentIndex)
    if (nextIdx >= 0) {
      setCurrentIndex(nextIdx)
      setCurrentTime(0)
      setTimeout(() => {
        if (mediaRef.current) {
          mediaRef.current.play().catch(() => {})
          setIsPlaying(true)
        }
      }, 100)
    }
  }

  const handlePrev = () => {
    const prevIdx = getPrevMediaIndex(playlist, currentIndex)
    if (prevIdx >= 0) {
      setCurrentIndex(prevIdx)
      setCurrentTime(0)
      setTimeout(() => {
        if (mediaRef.current) {
          mediaRef.current.play().catch(() => {})
          setIsPlaying(true)
        }
      }, 100)
    }
  }

  const handleVolumeChange = (e) => {
    setSettings((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))
  }

  const handleSpeedChange = (e) => {
    setSettings((prev) => ({ ...prev, playbackSpeed: parseFloat(e.target.value) }))
  }

  const toggleLyrics = () => {
    setSettings((prev) => ({ ...prev, showLyrics: !prev.showLyrics }))
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      pageRef.current?.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const handleAddMedia = () => {
    const validation = validateMediaItem({ title: newMediaTitle, url: newMediaUrl })
    if (!validation.valid) {
      setAddMediaErrors(validation.errors)
      return
    }
    const newItem = createMediaItem(newMediaTitle, newMediaUrl)
    setPlaylist((prev) => [...prev, newItem])
    setNewMediaTitle('')
    setNewMediaUrl('')
    setAddMediaErrors({})
  }

  const handleAddAllDefaults = () => {
    const defaults = generateDefaultPlaylistItems()
    setPlaylist((prev) => mergePlaylistItems(prev, defaults))
  }

  const handleDeleteMedia = (id) => {
    const idx = playlist.findIndex((item) => item.id === id)
    if (idx < 0) return
    setPlaylist((prev) => prev.filter((item) => item.id !== id))
    if (idx === currentIndex) {
      setIsPlaying(false)
      if (playlist.length > 1) {
        setCurrentIndex(idx === playlist.length - 1 ? idx - 1 : idx)
      }
      setCurrentTime(0)
    } else if (idx < currentIndex) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handlePlaylistItemClick = (idx) => {
    if (idx === currentIndex) {
      togglePlay()
    } else {
      setCurrentIndex(idx)
      setCurrentTime(0)
      setTimeout(() => {
        if (mediaRef.current) {
          mediaRef.current.play().catch(() => {})
          setIsPlaying(true)
        }
      }, 100)
    }
  }

  const handleRenameStart = (item) => {
    setRenamingId(item.id)
    setRenameValue(item.title)
  }

  const handleRenameSave = (id) => {
    const newTitle = renameValue.trim()
    if (newTitle) {
      setPlaylist((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
      )
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const handleRenameKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      handleRenameSave(id)
    } else if (e.key === 'Escape') {
      setRenamingId(null)
      setRenameValue('')
    }
  }

  const handleClearPlaylist = () => {
    setPlaylist([])
    setCurrentIndex(0)
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const getPositionFromMouseEvent = useCallback((clientX) => {
    if (!progressTrackRef.current || duration <= 0) return null
    const rect = progressTrackRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const percent = clampPercent((x / rect.width) * 100)
    const time = calculateTimeFromPercent(percent, duration)
    return { x, percent, time }
  }, [duration])

  const handleProgressMouseDown = (e) => {
    setIsDraggingProgress(true)
    const pos = getPositionFromMouseEvent(e.clientX)
    if (pos) {
      setDragHoverX(pos.x)
      setDragHoverTime(pos.time)
    }
  }

  const handleProgressMouseMove = (e) => {
    if (!isDraggingProgress && dragHoverTime === null) return
    const pos = getPositionFromMouseEvent(e.clientX)
    if (pos) {
      setDragHoverX(pos.x)
      setDragHoverTime(pos.time)
    }
  }

  const handleProgressMouseUp = () => {
    if (isDraggingProgress && dragHoverTime !== null) {
      handleSeek(dragHoverTime)
    }
    setIsDraggingProgress(false)
    setDragHoverTime(null)
  }

  const handleProgressMouseLeave = () => {
    if (!isDraggingProgress) {
      setDragHoverTime(null)
    }
  }

  const handleDragStart = (e, itemId) => {
    setDraggedItemId(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, itemId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItemId(itemId)
  }

  const handleDragLeave = () => {
    setDragOverItemId(null)
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null)
      setDragOverItemId(null)
      return
    }
    const fromIndex = playlist.findIndex((item) => item.id === draggedItemId)
    const toIndex = playlist.findIndex((item) => item.id === targetId)
    if (fromIndex >= 0 && toIndex >= 0) {
      const newPlaylist = reorderPlaylist(playlist, fromIndex, toIndex)
      let newCurrentIndex = currentIndex
      if (currentIndex === fromIndex) {
        newCurrentIndex = toIndex
      } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
        newCurrentIndex = currentIndex - 1
      } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
        newCurrentIndex = currentIndex + 1
      }
      setPlaylist(newPlaylist)
      setCurrentIndex(newCurrentIndex)
    }
    setDraggedItemId(null)
    setDragOverItemId(null)
  }

  const handleDragEnd = () => {
    setDraggedItemId(null)
    setDragOverItemId(null)
  }

  const progressPercent = calculateProgressPercent(currentTime, duration)
  const bufferedPercent = calculateProgressPercent(bufferedEnd, duration)
  const dragPercent = dragHoverTime !== null ? calculateProgressPercent(dragHoverTime, duration) : null

  return (
    <div
      className="media-player-page"
      ref={pageRef}
      onMouseMove={resetFullscreenHideTimer}
    >
      <div className="media-player-header">
        <button className="media-player-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="media-player-title">音视频播放器</h1>
      </div>

      <div className="media-player-body">
        <div className="media-player-main">
          <div className="media-display-area">
            <div
              className={`media-player-wrapper ${!isVideo ? 'audio-only' : ''}`}
              onClick={handleMediaClick}
              onDoubleClick={handleVideoDoubleClick}
            >
              {currentMedia ? (
                isVideo ? (
                  <video
                    ref={mediaRef}
                    className="media-player-video"
                    src={currentMedia.url}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onProgress={handleProgress}
                    onEnded={handleEnded}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : (
                  <div className="audio-visualizer">
                    <div className="audio-placeholder">
                      <div className="audio-icon">🎵</div>
                      <div className="audio-title-display">{currentMedia.title}</div>
                    </div>
                    <audio
                      ref={mediaRef}
                      className="media-player-audio"
                      src={currentMedia.url}
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={handleTimeUpdate}
                      onProgress={handleProgress}
                      onEnded={handleEnded}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  </div>
                )
              ) : (
                <div className="audio-placeholder">
                  <div className="audio-icon">🎬</div>
                  <div className="audio-title-display">请从右侧播放列表选择媒体</div>
                </div>
              )}
              {showOverlay && (
                <div className="play-overlay">
                  <div className="play-overlay-icon">{overlayType === 'play' ? '▶' : '❚❚'}</div>
                </div>
              )}
            </div>

            <div className={`lyrics-panel ${settings.showLyrics ? '' : 'hidden'}`}>
              <div className="lyrics-header">
                <h3 className="lyrics-title">歌词字幕</h3>
                <button className="lyrics-toggle-btn" onClick={toggleLyrics}>
                  隐藏
                </button>
              </div>
              <div className="lyrics-content" ref={lyricsContentRef}>
                {parsedLyrics.length > 0 ? (
                  parsedLyrics.map((lyric, idx) => (
                    <div
                      key={idx}
                      className={`lyrics-line ${
                        idx < currentLyricIndex
                          ? 'past'
                          : idx === currentLyricIndex
                          ? 'current'
                          : 'future'
                      }`}
                    >
                      {lyric.text || '♪'}
                    </div>
                  ))
                ) : (
                  <div className="lyrics-empty">暂无歌词，请在下方粘贴 LRC 格式歌词</div>
                )}
              </div>
              <div className="lyrics-input">
                <textarea
                  className="lyrics-textarea"
                  value={lrcText}
                  onChange={(e) => setLrcText(e.target.value)}
                  placeholder="[mm:ss.xx]歌词内容&#10;例如：&#10;[00:00.00]第一行歌词&#10;[00:05.00]第二行歌词"
                />
                <div className="lyrics-hint">支持 LRC 格式，一行一句，时间格式 [mm:ss.xx]</div>
              </div>
            </div>
          </div>
        </div>

        <div className="playlist-panel">
          <div className="playlist-header">
            <h3 className="playlist-title">播放列表 ({playlist.length})</h3>
            <div className="playlist-actions">
              <button
                className="playlist-action-btn"
                onClick={handleAddAllDefaults}
                title="添加示例媒体到播放列表"
              >
                + 添加示例
              </button>
              <button
                className="playlist-action-btn danger"
                onClick={handleClearPlaylist}
                disabled={playlist.length === 0}
              >
                清空
              </button>
            </div>
          </div>

          <div className="add-media-form">
            <input
              className={`add-media-input ${addMediaErrors.title ? 'error' : ''}`}
              type="text"
              placeholder="输入标题"
              value={newMediaTitle}
              onChange={(e) => {
                setNewMediaTitle(e.target.value)
                if (addMediaErrors.title) {
                  setAddMediaErrors((prev) => ({ ...prev, title: undefined }))
                }
              }}
            />
            {addMediaErrors.title && <div className="add-media-error">{addMediaErrors.title}</div>}
            <input
              className={`add-media-input ${addMediaErrors.url ? 'error' : ''}`}
              type="text"
              placeholder="输入媒体 URL (http:// 或 https://)"
              value={newMediaUrl}
              onChange={(e) => {
                setNewMediaUrl(e.target.value)
                if (addMediaErrors.url) {
                  setAddMediaErrors((prev) => ({ ...prev, url: undefined }))
                }
              }}
            />
            {addMediaErrors.url && <div className="add-media-error">{addMediaErrors.url}</div>}
            <button className="add-media-btn" onClick={handleAddMedia}>
              + 添加到播放列表
            </button>
          </div>

          <div className="playlist-list">
            {playlist.length > 0 ? (
              playlist.map((item, idx) => (
                <div
                  key={item.id}
                  className={`playlist-item ${currentIndex === idx ? 'playing' : ''} ${
                    draggedItemId === item.id ? 'dragging' : ''
                  } ${dragOverItemId === item.id ? 'drag-over' : ''}`}
                  draggable={renamingId !== item.id}
                  onClick={() => renamingId !== item.id && handlePlaylistItemClick(idx)}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    handleRenameStart(item)
                  }}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item.id)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="playlist-item-index">{idx + 1}</span>
                  <div className="playlist-item-info">
                    {renamingId === item.id ? (
                      <input
                        className="playlist-item-rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSave(item.id)}
                        onKeyDown={(e) => handleRenameKeyDown(e, item.id)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <>
                        <div className="playlist-item-title">{item.title}</div>
                        <div className="playlist-item-type">
                          {item.type === MEDIA_TYPES.VIDEO ? '🎬 视频' : '🎵 音频'}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    className="playlist-item-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteMedia(item.id)
                    }}
                    title="删除"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="playlist-empty">播放列表为空，请添加媒体文件</div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`media-player-controls ${
          isFullscreen
            ? fullscreenControlsVisible
              ? 'fullscreen-visible'
              : 'fullscreen-hidden'
            : ''
        }`}
      >
        <div
          className={`progress-bar-wrapper ${isDraggingProgress ? 'dragging' : ''}`}
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleProgressMouseMove}
          onMouseUp={handleProgressMouseUp}
          onMouseLeave={handleProgressMouseLeave}
        >
          <div className="progress-bar-track" ref={progressTrackRef}>
            <div
              className="progress-bar-buffered"
              style={{ width: `${bufferedPercent}%` }}
            />
            <div
              className="progress-bar-filled"
              style={{ width: `${dragPercent !== null ? dragPercent : progressPercent}%` }}
            />
            <div
              className="progress-bar-thumb"
              style={{ left: `${dragPercent !== null ? dragPercent : progressPercent}%` }}
            />
          </div>
          {dragHoverTime !== null && (
            <div
              className="progress-time-tooltip"
              style={{ left: `${dragHoverX}px` }}
            >
              {formatTime(dragHoverTime)}
            </div>
          )}
          <div className="progress-time">
            {formatTime(dragHoverTime !== null ? dragHoverTime : currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button
              className="toggle-lyrics-btn"
              onClick={toggleLyrics}
            >
              {settings.showLyrics ? '隐藏歌词' : '显示歌词'}
            </button>
          </div>

          <div className="controls-center">
            <button className="control-btn" onClick={handleRewind} title="后退 10 秒">
              ⏪
            </button>
            <button className="control-btn" onClick={handlePrev} title="上一首">
              ⏮
            </button>
            <button className="control-btn play-pause" onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button className="control-btn" onClick={handleNext} title="下一首">
              ⏭
            </button>
            <button className="control-btn" onClick={handleFastForward} title="快进 10 秒">
              ⏩
            </button>
          </div>

          <div className="controls-right">
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
            <button className="fullscreen-btn" onClick={toggleFullscreen}>
              {isFullscreen ? '退出全屏' : '全屏'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaPlayerPage
