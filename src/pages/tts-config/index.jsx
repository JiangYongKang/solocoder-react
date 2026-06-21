import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './tts-config.css'
import {
  MAX_TEXT_LENGTH,
  MIN_SPEED,
  MAX_SPEED,
  SPEED_STEP,
  MIN_PITCH,
  MAX_PITCH,
  PITCH_STEP,
  MIN_VOLUME,
  MAX_VOLUME,
  VOLUME_STEP,
  PAUSE_DURATION_OPTIONS,
  VOICE_PRESETS,
  SAMPLE_TEXT,
  countChars,
  splitParagraphs,
  parsePauseMarkers,
  insertPauseMarker,
  removeAllPauseMarkers,
  calculateProgress,
  getVoiceById,
  getVoiceName,
  formatPauseDuration,
  buildAuditionText,
  parseSegmentsWithPauses,
  flattenTextSegments,
  normalizeHistoryRecord,
} from './ttsConfigCore.js'
import {
  loadHistory,
  addRecordToHistory,
  loadSavedConfigs,
  saveConfigPreset,
  deleteConfigPreset,
  loadDefaultConfig,
} from './storage.js'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function renderParagraphsWithHighlight(text, currentParaIndex, isPlaying) {
  const paragraphs = splitParagraphs(text)
  if (paragraphs.length === 0 && text.trim()) {
    return <span className={isPlaying && currentParaIndex === 0 ? 'tts-highlight-para' : ''}>{renderTextWithPauseTags(text)}</span>
  }
  return paragraphs.map((para, i) => (
    <span key={i}>
      {i > 0 && <br />}
      <span className={isPlaying && currentParaIndex === i ? 'tts-highlight-para' : ''}>
        {renderTextWithPauseTags(para)}
      </span>
    </span>
  ))
}

function renderTextWithPauseTags(text) {
  const parts = []
  let keyIdx = 0
  const regex = /<pause=(\d+)>/g
  let match
  let lastIdx = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={keyIdx}>{text.slice(lastIdx, match.index)}</span>)
    }
    keyIdx += 1
    parts.push(<span key={keyIdx} className="tts-pause-tag">{`⏸${formatPauseDuration(parseInt(match[1], 10))}`}</span>)
    lastIdx = match.index + match[0].length
    keyIdx += 1
  }
  if (lastIdx < text.length) {
    parts.push(<span key={keyIdx}>{text.slice(lastIdx)}</span>)
  }
  return parts
}

export default function TtsConfigPage() {
  const navigate = useNavigate()
  const textareaRef = useRef(null)
  const playTimerRef = useRef(null)

  const [text, setText] = useState('')
  const initDefaults = loadDefaultConfig()
  const [speed, setSpeed] = useState(initDefaults.speed)
  const [pitch, setPitch] = useState(initDefaults.pitch)
  const [volume, setVolume] = useState(initDefaults.volume)
  const [voiceId, setVoiceId] = useState(initDefaults.voiceId)
  const [pauseDuration, setPauseDuration] = useState(500)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentParaIndex, setCurrentParaIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [playStatus, setPlayStatus] = useState('')
  const [inPause, setInPause] = useState(false)

  const [isAuditioning, setIsAuditioning] = useState(false)
  const auditionTimerRef = useRef(null)
  const auditionText = useMemo(() => buildAuditionText(getVoiceById(voiceId).name), [voiceId])

  const pauseTimeoutRef = useRef(null)
  const playStepRef = useRef({ segmentIdx: 0, segmentCharIdx: 0 })

  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState(() => loadHistory())

  const [savedConfigs, setSavedConfigs] = useState(() => loadSavedConfigs())
  const [configName, setConfigName] = useState('')
  const [selectedConfigId, setSelectedConfigId] = useState('')

  const paragraphs = useMemo(() => splitParagraphs(text), [text])
  const charCount = useMemo(() => countChars(text), [text])
  const pauseMarkers = useMemo(() => parsePauseMarkers(text), [text])

  const stopPlayback = () => {
    setIsPlaying(false)
    setIsPaused(false)
    setInPause(false)
    setCurrentParaIndex(0)
    setCurrentCharIndex(0)
    setPlayStatus('')
    playStepRef.current = { segmentIdx: 0, segmentCharIdx: 0 }
    if (playTimerRef.current) clearInterval(playTimerRef.current)
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
  }

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
      if (auditionTimerRef.current) clearTimeout(auditionTimerRef.current)
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    }
  }, [])

  const handleTextChange = (e) => {
    const val = e.target.value
    if (val.length <= MAX_TEXT_LENGTH) {
      setText(val)
    }
  }

  const handleClear = () => {
    setText('')
    stopPlayback()
  }

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      const limited = clip.slice(0, MAX_TEXT_LENGTH - text.length)
      setText((prev) => (prev + limited).slice(0, MAX_TEXT_LENGTH))
    } catch {
      void 0
    }
  }

  const handleSample = () => {
    setText(SAMPLE_TEXT)
    stopPlayback()
  }

  const handleInsertPause = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const pos = textarea.selectionStart
    const newText = insertPauseMarker(text, pos, pauseDuration)
    setText(newText)
    setTimeout(() => {
      const newPos = pos + `<pause=${pauseDuration}>`.length
      textarea.selectionStart = newPos
      textarea.selectionEnd = newPos
      textarea.focus()
    }, 0)
  }

  const handleDeletePause = (index) => {
    const markers = parsePauseMarkers(text)
    if (index < 0 || index >= markers.length) return
    const marker = markers[index]
    const before = text.slice(0, marker.index)
    const after = text.slice(marker.index + marker.fullMatch.length)
    setText(before + after)
  }

  const handleClearAllPauses = () => {
    setText(removeAllPauseMarkers(text))
  }

  const handleVoiceSelect = (id) => {
    setVoiceId(id)
  }

  const handleAudition = () => {
    if (isAuditioning) {
      setIsAuditioning(false)
      if (auditionTimerRef.current) clearTimeout(auditionTimerRef.current)
      return
    }
    setIsAuditioning(true)
    auditionTimerRef.current = setTimeout(() => {
      setIsAuditioning(false)
    }, 2000)
  }

  const currentParaSegments = useMemo(() => {
    if (paragraphs.length === 0) return []
    const idx = Math.min(currentParaIndex, paragraphs.length - 1)
    return parseSegmentsWithPauses(paragraphs[idx] || '')
  }, [paragraphs, currentParaIndex])

  const currentParaText = useMemo(
    () => flattenTextSegments(currentParaSegments),
    [currentParaSegments]
  )

  const progress = useMemo(
    () => calculateProgress(currentParaIndex, paragraphs.length, currentCharIndex, currentParaText.length || 1),
    [currentParaIndex, paragraphs.length, currentCharIndex, currentParaText.length]
  )

  const startPlayback = () => {
    if (text.trim().length === 0) return
    if (paragraphs.length === 0) return

    if (isPaused) {
      setIsPaused(false)
      setIsPlaying(true)
      setPlayStatus(`正在朗读第 ${currentParaIndex + 1}/${paragraphs.length} 段...`)
      return
    }

    addRecordToHistory(text, voiceId, speed, pitch, volume)
    setHistory(loadHistory())

    playStepRef.current = { segmentIdx: 0, segmentCharIdx: 0 }
    setIsPlaying(true)
    setIsPaused(false)
    setInPause(false)
    setCurrentParaIndex(0)
    setCurrentCharIndex(0)
    setPlayStatus(`正在朗读第 1/${paragraphs.length} 段...`)
  }

  const pausePlayback = () => {
    setIsPlaying(false)
    setIsPaused(true)
    setPlayStatus('已暂停')
    if (playTimerRef.current) clearInterval(playTimerRef.current)
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    setInPause(false)
  }

  const prevParagraph = () => {
    if (currentParaIndex > 0) {
      setCurrentParaIndex((prev) => prev - 1)
      setCurrentCharIndex(0)
      if (isPlaying) {
        setPlayStatus(`正在朗读第 ${currentParaIndex}/${paragraphs.length} 段...`)
      }
    }
  }

  const nextParagraph = () => {
    if (currentParaIndex < paragraphs.length - 1) {
      setCurrentParaIndex((prev) => prev + 1)
      setCurrentCharIndex(0)
      if (isPlaying) {
        setPlayStatus(`正在朗读第 ${currentParaIndex + 2}/${paragraphs.length} 段...`)
      }
    }
  }

  useEffect(() => {
    if (!isPlaying) return
    if (paragraphs.length === 0) {
      setTimeout(stopPlayback, 0)
      return
    }
    if (inPause) return

    const segs = currentParaSegments
    if (!segs || segs.length === 0) {
      setTimeout(() => {
        if (currentParaIndex >= paragraphs.length - 1) {
          setIsPlaying(false)
          setIsPaused(false)
          setPlayStatus('播放完成')
        } else {
          setCurrentParaIndex((pi) => pi + 1)
          playStepRef.current = { segmentIdx: 0, segmentCharIdx: 0 }
          setCurrentCharIndex(0)
          setPlayStatus(`正在朗读第 ${currentParaIndex + 2}/${paragraphs.length} 段...`)
        }
      }, 0)
      return
    }

    const step = playStepRef.current
    if (step.segmentIdx >= segs.length) {
      setTimeout(() => {
        if (currentParaIndex >= paragraphs.length - 1) {
          setIsPlaying(false)
          setIsPaused(false)
          setPlayStatus('播放完成')
        } else {
          setCurrentParaIndex((pi) => pi + 1)
          playStepRef.current = { segmentIdx: 0, segmentCharIdx: 0 }
          setCurrentCharIndex(0)
          setPlayStatus(`正在朗读第 ${currentParaIndex + 2}/${paragraphs.length} 段...`)
        }
      }, 0)
      return
    }

    const currentSegment = segs[step.segmentIdx]
    if (currentSegment.type === 'pause') {
      setInPause(true)
      const actualDuration = Math.max(10, Math.round(currentSegment.duration / speed))
      setPlayStatus(`停顿中（${formatPauseDuration(currentSegment.duration)}）...`)
      pauseTimeoutRef.current = setTimeout(() => {
        step.segmentIdx += 1
        step.segmentCharIdx = 0
        setInPause(false)
        setPlayStatus(`正在朗读第 ${currentParaIndex + 1}/${paragraphs.length} 段...`)
      }, actualDuration)
      return
    }

    const textContent = currentSegment.content
    if (step.segmentCharIdx >= textContent.length) {
      step.segmentIdx += 1
      step.segmentCharIdx = 0
      if (playTimerRef.current) clearInterval(playTimerRef.current)
      return
    }

    if (playTimerRef.current) clearInterval(playTimerRef.current)

    const interval = Math.max(20, Math.round(100 / speed))
    playTimerRef.current = setInterval(() => {
      const curStep = playStepRef.current
      const curSegs = currentParaSegments
      if (!curSegs || curSegs.length === 0) return
      if (curStep.segmentIdx >= curSegs.length) {
        if (playTimerRef.current) clearInterval(playTimerRef.current)
        return
      }
      const seg = curSegs[curStep.segmentIdx]
      if (seg.type !== 'text') {
        if (playTimerRef.current) clearInterval(playTimerRef.current)
        return
      }
      if (curStep.segmentCharIdx >= seg.content.length) {
        curStep.segmentIdx += 1
        curStep.segmentCharIdx = 0
        if (playTimerRef.current) clearInterval(playTimerRef.current)
        return
      }
      curStep.segmentCharIdx += 1
      setCurrentCharIndex((prev) => prev + 1)
    }, interval)

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [isPlaying, inPause, currentParaIndex, currentParaSegments, speed, paragraphs.length])

  const handleHistoryClick = (record) => {
    const safe = normalizeHistoryRecord(record)
    setText(safe.text)
    setVoiceId(safe.voiceId)
    setSpeed(safe.speed)
    setPitch(safe.pitch)
    setVolume(safe.volume)
    stopPlayback()
  }

  const handleSaveConfig = () => {
    if (!configName.trim()) return
    const updated = saveConfigPreset(configName.trim(), { speed, pitch, volume, voiceId })
    setSavedConfigs(updated)
    setConfigName('')
  }

  const handleLoadConfig = (id) => {
    setSelectedConfigId(id)
    const cfg = savedConfigs.find((c) => c.id === id)
    if (cfg && cfg.config) {
      setSpeed(cfg.config.speed)
      setPitch(cfg.config.pitch)
      setVolume(cfg.config.volume)
      setVoiceId(cfg.config.voiceId)
    }
  }

  const handleDeleteConfig = (id) => {
    const updated = deleteConfigPreset(id)
    setSavedConfigs(updated)
    if (selectedConfigId === id) setSelectedConfigId('')
  }

  return (
    <div className="tts-page">
      <div className="tts-back-bar">
        <button className="tts-back-btn" onClick={() => navigate('/')}>← 返回首页</button>
      </div>

      <h1 className="tts-title">文字转语音配置器</h1>

      <div className="tts-layout">
        <div className="tts-left">
          <div className="tts-textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="tts-textarea"
              value={text}
              onChange={handleTextChange}
              placeholder="请输入或粘贴需要朗读的文本内容..."
            />
          </div>
          <div className={`tts-char-count ${charCount > MAX_TEXT_LENGTH ? 'over' : ''}`}>
            共 {charCount} 字
          </div>
          <div className="tts-toolbar">
            <button className="tts-toolbar-btn" onClick={handleClear}>清空</button>
            <button className="tts-toolbar-btn" onClick={handlePaste}>粘贴</button>
            <button className="tts-toolbar-btn primary" onClick={handleSample}>使用示例文本</button>
            <select
              className="tts-pause-select"
              value={pauseDuration}
              onChange={(e) => setPauseDuration(Number(e.target.value))}
            >
              {PAUSE_DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button className="tts-toolbar-btn" onClick={handleInsertPause}>插入停顿标记</button>
          </div>

          {pauseMarkers.length > 0 && (
            <div className="tts-pause-panel">
              <h3 className="tts-pause-panel-title">停顿标记列表</h3>
              <ul className="tts-pause-list">
                {pauseMarkers.map((m, i) => (
                  <li key={i} className="tts-pause-item">
                    <div className="tts-pause-item-info">
                      <span className="tts-pause-item-pos">位置 {m.index}</span>
                      <span className="tts-pause-item-dur">{formatPauseDuration(m.duration)}</span>
                    </div>
                    <button className="tts-pause-del-btn" onClick={() => handleDeletePause(i)}>×</button>
                  </li>
                ))}
              </ul>
              <button className="tts-pause-clear-btn" onClick={handleClearAllPauses}>清除全部停顿标记</button>
            </div>
          )}

          <div className="tts-play-bar">
            <div className="tts-play-controls">
              <button
                className="tts-ctrl-btn"
                onClick={prevParagraph}
                disabled={currentParaIndex === 0 && !isPlaying}
                title="上一段"
              >
                ⏮
              </button>
              <button
                className="tts-play-btn"
                onClick={isPlaying ? pausePlayback : startPlayback}
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                className="tts-ctrl-btn"
                onClick={stopPlayback}
                disabled={!isPlaying && !isPaused}
                title="停止"
              >
                ⏹
              </button>
              <button
                className="tts-ctrl-btn"
                onClick={nextParagraph}
                disabled={currentParaIndex >= paragraphs.length - 1 && !isPlaying}
                title="下一段"
              >
                ⏭
              </button>
              <div className="tts-progress-wrapper">
                <div className="tts-progress-bar">
                  <div className="tts-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
            {playStatus && <div className="tts-play-status">{playStatus}</div>}
          </div>

          <div className="tts-history-section">
            <button className="tts-history-toggle" onClick={() => setShowHistory((v) => !v)}>
              <span>朗读历史（{history.length}）</span>
              <span className={`tts-history-toggle-arrow ${showHistory ? 'open' : ''}`}>▶</span>
            </button>
            {showHistory && (
              <div className="tts-history-body">
                {history.length === 0 ? (
                  <div className="tts-history-empty">暂无朗读历史</div>
                ) : (
                  history.map((record) => (
                    <div
                      key={record.id}
                      className="tts-history-item"
                      onClick={() => handleHistoryClick(record)}
                    >
                      <span className="tts-history-time">{formatTime(record.timestamp)}</span>
                      <span className="tts-history-title">{record.title || '（空）'}</span>
                      <span className="tts-history-meta">{getVoiceName(record.voiceId)} {record.speed}x</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="tts-right">
          <div className="tts-param-panel">
            <h2 className="tts-param-title">语音参数</h2>

            <div className="tts-slider-group">
              <div className="tts-slider-label">
                <span className="tts-slider-label-text">语速</span>
                <span className="tts-slider-value">{speed.toFixed(1)}x</span>
              </div>
              <div className="tts-slider-row">
                <span className="tts-slider-icon">🐢</span>
                <input
                  type="range"
                  className="tts-slider"
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  step={SPEED_STEP}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                />
                <span className="tts-slider-icon">🐇</span>
              </div>
            </div>

            <div className="tts-slider-group">
              <div className="tts-slider-label">
                <span className="tts-slider-label-text">音调</span>
                <span className="tts-slider-value">{pitch > 0 ? `+${pitch}` : pitch} 半音</span>
              </div>
              <div className="tts-slider-row">
                <span className="tts-slider-icon">⬇</span>
                <input
                  type="range"
                  className="tts-slider"
                  min={MIN_PITCH}
                  max={MAX_PITCH}
                  step={PITCH_STEP}
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                />
                <span className="tts-slider-icon">⬆</span>
              </div>
            </div>

            <div className="tts-slider-group">
              <div className="tts-slider-label">
                <span className="tts-slider-label-text">音量</span>
                <span className="tts-slider-value">{volume}%</span>
              </div>
              <div className="tts-slider-row">
                <span className="tts-slider-icon">🔇</span>
                <input
                  type="range"
                  className="tts-slider"
                  min={MIN_VOLUME}
                  max={MAX_VOLUME}
                  step={VOLUME_STEP}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                />
                <span className="tts-slider-icon">🔊</span>
              </div>
            </div>

            <div className="tts-voice-section">
              <div className="tts-slider-label">
                <span className="tts-slider-label-text">音色选择</span>
              </div>
              <div className="tts-voice-grid">
                {VOICE_PRESETS.map((v) => (
                  <div
                    key={v.id}
                    className={`tts-voice-card ${v.id === voiceId ? 'selected' : ''}`}
                    onClick={() => handleVoiceSelect(v.id)}
                  >
                    <div className="tts-voice-name">{v.name}</div>
                    <div className="tts-voice-desc">{v.description}</div>
                  </div>
                ))}
              </div>
              <div className="tts-voice-audition">
                <button
                  className={`tts-audition-btn ${isAuditioning ? 'playing' : ''}`}
                  onClick={handleAudition}
                >
                  {isAuditioning ? '停止试听' : `试听 · ${getVoiceById(voiceId).name}`}
                </button>
              </div>
              <div style={{ marginTop: 10, padding: '8px 10px', background: isAuditioning ? '#eff6ff' : '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, color: isAuditioning ? '#1d4ed8' : '#4b5563', transition: 'background 0.2s' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>试听文本：</div>
                <div style={{ lineHeight: 1.5 }}>{auditionText}</div>
              </div>
            </div>
          </div>

          <div className="tts-config-section">
            <h3 className="tts-param-title" style={{ fontSize: 14 }}>配置方案</h3>
            <div className="tts-config-row">
              <input
                className="tts-config-input"
                placeholder="配置名称"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
              />
              <button className="tts-config-btn primary" onClick={handleSaveConfig}>保存当前配置</button>
            </div>
            <div className="tts-config-row">
              <select
                className="tts-config-select"
                value={selectedConfigId}
                onChange={(e) => handleLoadConfig(e.target.value)}
              >
                <option value="">-- 加载配置 --</option>
                {savedConfigs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {savedConfigs.length > 0 && (
              <div className="tts-config-list">
                {savedConfigs.map((c) => (
                  <div key={c.id} className="tts-config-item">
                    <span className="tts-config-item-name">{c.name}</span>
                    <button className="tts-config-btn" onClick={() => handleLoadConfig(c.id)}>加载</button>
                    <button className="tts-config-btn danger" onClick={() => handleDeleteConfig(c.id)}>删除</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="tts-param-panel" style={{ padding: 10 }}>
              <h3 className="tts-param-title" style={{ fontSize: 14, marginBottom: 6 }}>文本预览</h3>
              <div style={{ fontSize: 14, lineHeight: 1.8, maxHeight: 200, overflowY: 'auto' }}>
                {text.trim() ? renderParagraphsWithHighlight(text, currentParaIndex, isPlaying) : (
                  <span style={{ color: '#9ca3af' }}>暂无文本内容</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
