import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  createMouseEventRecord,
  filterMouseEvents,
  renumberEvents,
  formatTimestamp,
  exportToJson,
  downloadJsonFile,
  throttle,
  MOUSE_EVENT_TYPES,
  MOUSE_EVENT_COLORS,
  MOUSE_EVENT_LABELS,
  getMouseButtonLabel,
} from './eventDebuggerUtils'

function MouseCapturePanel({ onEvent }) {
  const [events, setEvents] = useState([])
  const [keyword, setKeyword] = useState('')
  const [selectedEventTypes, setSelectedEventTypes] = useState([])
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [highlightedId, setHighlightedId] = useState(null)

  const logRef = useRef(null)
  const panelRef = useRef(null)
  const sequenceRef = useRef(0)

  const filteredEvents = useMemo(() => {
    const filtered = filterMouseEvents(events, {
      keyword,
      eventTypes: selectedEventTypes,
    })
    return renumberEvents(filtered)
  }, [events, keyword, selectedEventTypes])

  const addEvent = useCallback(
    (record) => {
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
    [onEvent]
  )

  const handleMouseEvent = useCallback(
    (e) => {
      const panel = panelRef.current
      if (!panel) return

      const rect = panel.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      sequenceRef.current += 1
      const record = createMouseEventRecord(e, sequenceRef.current, offsetX, offsetY)
      addEvent(record)
    },
    [addEvent]
  )

  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault()
      const panel = panelRef.current
      if (!panel) return

      const rect = panel.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      sequenceRef.current += 1
      const record = createMouseEventRecord(e, sequenceRef.current, offsetX, offsetY)
      addEvent(record)
    },
    [addEvent]
  )

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [filteredEvents.length])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const throttledMouseMove = throttle(handleMouseEvent, 100)

    const handlers = {}
    MOUSE_EVENT_TYPES.forEach((type) => {
      if (type === 'contextmenu') {
        handlers[type] = handleContextMenu
      } else if (type === 'mousemove') {
        handlers[type] = throttledMouseMove
      } else {
        handlers[type] = handleMouseEvent
      }
      panel.addEventListener(type, handlers[type])
    })

    return () => {
      MOUSE_EVENT_TYPES.forEach((type) => {
        panel.removeEventListener(type, handlers[type])
      })
    }
  }, [handleMouseEvent, handleContextMenu])

  const handleClear = () => {
    setEvents([])
    sequenceRef.current = 0
    setShowConfirmClear(false)
  }

  const handleExport = () => {
    const json = exportToJson(events)
    const fileName = `mouse-events-${Date.now()}.json`
    downloadJsonFile(json, fileName)
  }

  const toggleEventType = (type) => {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const resetFilters = () => {
    setKeyword('')
    setSelectedEventTypes([])
  }

  return (
    <div className="ed-panel">
      <div className="ed-panel-header">
        <h3 className="ed-panel-title">鼠标事件</h3>
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
        </div>
        <div className="ed-filter-row">
          <span className="ed-filter-label">事件类型：</span>
          {MOUSE_EVENT_TYPES.map((type) => (
            <label
              key={type}
              className={`ed-event-type-tag ${selectedEventTypes.includes(type) ? 'is-active' : ''}`}
              style={{ '--event-color': MOUSE_EVENT_COLORS[type] }}
            >
              <input
                type="checkbox"
                checked={selectedEventTypes.includes(type)}
                onChange={() => toggleEventType(type)}
              />
              {MOUSE_EVENT_LABELS[type]}
            </label>
          ))}
          {(keyword || selectedEventTypes.length > 0) && (
            <button className="ed-reset-btn" onClick={resetFilters}>
              重置
            </button>
          )}
        </div>
      </div>

      <div ref={panelRef} className="ed-capture-area ed-mouse-area">
        <div className="ed-capture-status">在此区域内移动或点击鼠标</div>
      </div>

      <div className="ed-log-list" ref={logRef}>
        {filteredEvents.length === 0 ? (
          <div className="ed-empty-state">
            {events.length === 0 ? '暂无鼠标事件' : '没有匹配的鼠标事件'}
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`ed-log-item ${highlightedId === event.id ? 'is-highlighted' : ''}`}
            >
              <div className="ed-log-sequence">#{event.sequence}</div>
              <div className="ed-log-main">
                <div className="ed-log-event-type">
                  <span
                    className="ed-event-type-badge"
                    style={{ backgroundColor: MOUSE_EVENT_COLORS[event.eventType] }}
                  >
                    {MOUSE_EVENT_LABELS[event.eventType]}
                  </span>
                </div>
                <div className="ed-log-meta">
                  <span className="ed-coord">
                    X: {Math.round(event.x)}, Y: {Math.round(event.y)}
                  </span>
                  <span className="ed-button">按钮: {getMouseButtonLabel(event.button)}</span>
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
              <p>确定要清空所有鼠标日志吗？此操作不可撤销。</p>
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

export default MouseCapturePanel
