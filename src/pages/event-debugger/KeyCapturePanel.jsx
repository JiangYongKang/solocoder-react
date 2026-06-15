import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  createKeyEventRecord,
  filterKeyEvents,
  renumberEvents,
  formatTimestamp,
  exportToJson,
  downloadJsonFile,
  MODIFIER_KEYS,
  MODIFIER_KEY_LABELS,
  MODIFIER_KEY_COLORS,
} from './eventDebuggerUtils'

function KeyCapturePanel({ onEvent }) {
  const [events, setEvents] = useState([])
  const [isFocused, setIsFocused] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [keyFilter, setKeyFilter] = useState('')
  const [selectedModifiers, setSelectedModifiers] = useState([])
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [highlightedId, setHighlightedId] = useState(null)

  const logRef = useRef(null)
  const panelRef = useRef(null)
  const sequenceRef = useRef(0)

  const filteredEvents = useMemo(() => {
    const filtered = filterKeyEvents(events, {
      keyword,
      keyFilter,
      modifiers: selectedModifiers,
    })
    return renumberEvents(filtered)
  }, [events, keyword, keyFilter, selectedModifiers])

  const handleKeyDown = useCallback(
    (e) => {
      if (!isFocused) return
      e.preventDefault()

      sequenceRef.current += 1
      const record = createKeyEventRecord(e, sequenceRef.current)

      setEvents((prev) => {
        const next = [...prev, record]
        return next.slice(-500)
      })

      setHighlightedId(record.id)
      setTimeout(() => setHighlightedId(null), 500)

      if (onEvent) {
        onEvent(record)
      }
    },
    [isFocused, onEvent]
  )

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [filteredEvents.length])

  useEffect(() => {
    const panel = panelRef.current
    if (panel) {
      const handleKey = (e) => {
        if (isFocused) {
          handleKeyDown(e)
        }
      }
      panel.addEventListener('keydown', handleKey)
      return () => panel.removeEventListener('keydown', handleKey)
    }
  }, [isFocused, handleKeyDown])

  const handleClear = () => {
    setEvents([])
    sequenceRef.current = 0
    setShowConfirmClear(false)
  }

  const handleExport = () => {
    const json = exportToJson(events)
    const fileName = `key-events-${Date.now()}.json`
    downloadJsonFile(json, fileName)
  }

  const toggleModifier = (mod) => {
    setSelectedModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    )
  }

  const resetFilters = () => {
    setKeyword('')
    setKeyFilter('')
    setSelectedModifiers([])
  }

  return (
    <div className="ed-panel">
      <div className="ed-panel-header">
        <h3 className="ed-panel-title">按键事件</h3>
        <div className="ed-panel-actions">
          <span className="ed-count-badge">共 {filteredEvents.length} 条</span>
          <button className="ed-btn ed-btn-sm" onClick={handleExport} disabled={events.length === 0}>
            导出
          </button>
          <button
            className="ed-btn ed-btn-sm ed-btn-danger"
            onClick={() => setShowConfirmClear(true)}
            disabled={events.length === 0}
          >
            清空
          </button>
        </div>
      </div>

      <div className="ed-filter-bar">
        <div className="ed-filter-row">
          <input
            type="text"
            className="ed-filter-input"
            placeholder="搜索关键字..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <input
            type="text"
            className="ed-filter-input ed-filter-input-sm"
            placeholder="键名过滤"
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value)}
          />
        </div>
        <div className="ed-filter-row">
          <span className="ed-filter-label">修饰键：</span>
          {MODIFIER_KEYS.map((mod) => (
            <label
              key={mod}
              className={`ed-modifier-tag ${selectedModifiers.includes(mod) ? 'is-active' : ''}`}
              style={{ '--mod-color': MODIFIER_KEY_COLORS[mod] }}
            >
              <input
                type="checkbox"
                checked={selectedModifiers.includes(mod)}
                onChange={() => toggleModifier(mod)}
              />
              {MODIFIER_KEY_LABELS[mod]}
            </label>
          ))}
          {(keyword || keyFilter || selectedModifiers.length > 0) && (
            <button className="ed-reset-btn" onClick={resetFilters}>
              重置
            </button>
          )}
        </div>
      </div>

      <div
        ref={panelRef}
        className={`ed-capture-area ${isFocused ? 'is-focused' : ''}`}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {isFocused ? (
          <div className="ed-capture-status is-listening">
            <span className="ed-status-dot"></span>
            正在监听按键...
          </div>
        ) : (
          <div className="ed-capture-status">点击此区域开始捕获按键</div>
        )}
      </div>

      <div className="ed-log-list" ref={logRef}>
        {filteredEvents.length === 0 ? (
          <div className="ed-empty-state">
            {events.length === 0 ? '暂无按键事件' : '没有匹配的按键事件'}
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`ed-log-item ${highlightedId === event.id ? 'is-highlighted' : ''}`}
            >
              <div className="ed-log-sequence">#{event.sequence}</div>
              <div className="ed-log-main">
                <div className="ed-log-key">{event.key}</div>
                <div className="ed-log-meta">
                  <span className="ed-keycode">keyCode: {event.keyCode}</span>
                  <span className="ed-code">code: {event.code}</span>
                </div>
                <div className="ed-modifiers">
                  {MODIFIER_KEYS.map((mod) => {
                    const isActive = event[`${mod}Key`]
                    return (
                      <span
                        key={mod}
                        className={`ed-mod-badge ${isActive ? 'is-active' : ''}`}
                        style={{ '--mod-color': MODIFIER_KEY_COLORS[mod] }}
                      >
                        {MODIFIER_KEY_LABELS[mod]}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="ed-log-time">{formatTimestamp(event.timestamp)}</div>
            </div>
          ))
        )}
      </div>

      {showConfirmClear && (
        <div className="ed-dialog-mask" onClick={() => setShowConfirmClear(false)}>
          <div className="ed-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ed-dialog-header">
              <h3 className="ed-dialog-title">确认清空</h3>
              <button className="ed-dialog-close" onClick={() => setShowConfirmClear(false)}>
                ×
              </button>
            </div>
            <div className="ed-dialog-body">
              <p>确定要清空所有按键日志吗？此操作不可撤销。</p>
            </div>
            <div className="ed-dialog-footer">
              <button className="ed-btn" onClick={() => setShowConfirmClear(false)}>
                取消
              </button>
              <button className="ed-btn ed-btn-danger" onClick={handleClear}>
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KeyCapturePanel
