import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import KeyCapturePanel from './KeyCapturePanel'
import MouseCapturePanel from './MouseCapturePanel'
import FrequencyChart from './FrequencyChart'
import './event-debugger.css'

function EventDebuggerPage() {
  const navigate = useNavigate()
  const [keyEvents, setKeyEvents] = useState([])
  const [mouseEvents, setMouseEvents] = useState([])

  const handleKeyEvent = useCallback((event) => {
    setKeyEvents((prev) => [...prev, event].slice(-1000))
  }, [])

  const handleMouseEvent = useCallback((event) => {
    setMouseEvents((prev) => [...prev, event].slice(-1000))
  }, [])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  return (
    <div className="ed-page">
      <div className="ed-header">
        <button className="ed-back-btn" onClick={handleBack}>
          ← 返回首页
        </button>
        <h1 className="ed-title">事件调试器</h1>
      </div>

      <div className="ed-main">
        <div className="ed-panels-row">
          <KeyCapturePanel onEvent={handleKeyEvent} />
          <MouseCapturePanel onEvent={handleMouseEvent} />
        </div>

        <div className="ed-chart-section">
          <FrequencyChart keyEvents={keyEvents} mouseEvents={mouseEvents} />
        </div>
      </div>
    </div>
  )
}

export default EventDebuggerPage
