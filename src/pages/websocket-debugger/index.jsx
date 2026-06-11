import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CONNECTION_STATUS,
  DIRECTION,
  DEFAULT_WS_URL,
  MESSAGE_TEMPLATES,
  DEFAULT_HEARTBEAT_INTERVAL,
  DEFAULT_HEARTBEAT_TIMEOUT_THRESHOLD,
  DEFAULT_RECONNECT_MAX_RETRIES,
  DEFAULT_RECONNECT_INTERVAL,
  formatTimestampMs,
  formatConnectionDuration,
  isValidJson,
  formatJson,
  createLogEntry,
  createSystemLog,
  createHistoryEntry,
  addHistory,
  deleteHistory,
  clearHistory,
  loadHistory,
  saveHistory,
  loadSettings,
  saveSettings,
  clampValue,
  getStatusText,
  filterLogs,
  shouldAutoScroll,
  isEchoServer,
  isPongResponse,
  formatMessageForDisplay,
} from './wsDebuggerUtils'
import './websocket-debugger.css'

function HistoryPanel({ history, currentUrl, onSelect, onDelete, onClear }) {
  return (
    <div className="ws-panel">
      <div className="ws-panel-header">
        <h3 className="ws-panel-title">连接历史</h3>
        <button className="ws-clear-btn" onClick={onClear} disabled={history.length === 0}>
          清空
        </button>
      </div>
      <div className="ws-panel-body">
        {history.length === 0 ? (
          <div className="ws-history-empty">暂无连接历史</div>
        ) : (
          <div className="ws-history-list">
            {history.map((item) => (
              <div
                key={item.id}
                className={`ws-history-item ${item.url === currentUrl ? 'is-active' : ''}`}
                onClick={() => onSelect(item)}
              >
                <span className="ws-history-url" title={item.url}>{item.url}</span>
                <div className="ws-history-bottom">
                  <span className="ws-history-time">
                    {item.lastConnectedAt ? formatTimestampMs(item.lastConnectedAt) : ''}
                  </span>
                  <button
                    className="ws-history-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(item.id)
                    }}
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SettingsPanel({ settings, url, onChange }) {
  const handleToggle = (field) => {
    onChange({ ...settings, [field]: !settings[field] })
  }

  const handleNumberChange = (field, value, min, max, fallback) => {
    const clamped = clampValue(value, min, max, fallback)
    onChange({ ...settings, [field]: clamped })
  }

  return (
    <div className="ws-panel">
      <div className="ws-panel-header">
        <h3 className="ws-panel-title">设置</h3>
      </div>
      <div className="ws-panel-body">
        <div className="ws-settings-group">
          <span className="ws-settings-label">心跳检测</span>
          <div className="ws-settings-row">
            <span className="ws-settings-row-label">启用</span>
            <button
              className={`ws-settings-toggle ${settings.heartbeatEnabled ? 'is-active' : ''}`}
              onClick={() => handleToggle('heartbeatEnabled')}
            >
              <span className="ws-settings-toggle-knob" />
            </button>
          </div>
          <div className="ws-settings-row" style={{ opacity: settings.heartbeatEnabled ? 1 : 0.5 }}>
            <span className="ws-settings-row-label">间隔（秒）</span>
            <input
              className="ws-settings-input"
              type="number"
              min={5}
              max={60}
              value={settings.heartbeatInterval}
              onChange={(e) => handleNumberChange('heartbeatInterval', e.target.value, 5, 60, DEFAULT_HEARTBEAT_INTERVAL)}
              disabled={!settings.heartbeatEnabled}
            />
          </div>
          <div className="ws-settings-row" style={{ opacity: settings.heartbeatEnabled ? 1 : 0.5 }}>
            <span className="ws-settings-row-label">超时阈值（次）</span>
            <input
              className="ws-settings-input"
              type="number"
              min={1}
              max={10}
              value={settings.heartbeatTimeoutThreshold}
              onChange={(e) => handleNumberChange('heartbeatTimeoutThreshold', e.target.value, 1, 10, DEFAULT_HEARTBEAT_TIMEOUT_THRESHOLD)}
              disabled={!settings.heartbeatEnabled}
            />
          </div>
          {isEchoServer(url) && (
            <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 8 }}>
              检测到 Echo 服务器，心跳已自动禁用
            </div>
          )}
        </div>

        <div className="ws-settings-group">
          <span className="ws-settings-label">自动重连</span>
          <div className="ws-settings-row">
            <span className="ws-settings-row-label">启用</span>
            <button
              className={`ws-settings-toggle ${settings.reconnectEnabled ? 'is-active' : ''}`}
              onClick={() => handleToggle('reconnectEnabled')}
            >
              <span className="ws-settings-toggle-knob" />
            </button>
          </div>
          <div className="ws-settings-row" style={{ opacity: settings.reconnectEnabled ? 1 : 0.5 }}>
            <span className="ws-settings-row-label">最大重连次数</span>
            <input
              className="ws-settings-input"
              type="number"
              min={1}
              max={20}
              value={settings.reconnectMaxRetries}
              onChange={(e) => handleNumberChange('reconnectMaxRetries', e.target.value, 1, 20, DEFAULT_RECONNECT_MAX_RETRIES)}
              disabled={!settings.reconnectEnabled}
            />
          </div>
          <div className="ws-settings-row" style={{ opacity: settings.reconnectEnabled ? 1 : 0.5 }}>
            <span className="ws-settings-row-label">重连间隔（秒）</span>
            <input
              className="ws-settings-input"
              type="number"
              min={1}
              max={30}
              value={settings.reconnectInterval}
              onChange={(e) => handleNumberChange('reconnectInterval', e.target.value, 1, 30, DEFAULT_RECONNECT_INTERVAL)}
              disabled={!settings.reconnectEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function LogEntry({ log, searchKeyword, onClick }) {
  const isSystem = log.direction === DIRECTION.SYSTEM
  const isSent = log.direction === DIRECTION.SENT
  const isLong = log.content && String(log.content).length > 100
  const displayContent = useMemo(() => {
    return formatMessageForDisplay(log.content, log.expanded, searchKeyword)
  }, [log.content, log.expanded, searchKeyword])

  const directionLabel = isSystem ? '[系统]' : isSent ? '↑' : '↓'
  const directionClass = isSystem
    ? 'ws-log-direction-system'
    : isSent
      ? 'ws-log-direction-sent'
      : 'ws-log-direction-received'

  return (
    <div className="ws-log-entry" onClick={onClick}>
      <div className="ws-log-meta">
        <span className="ws-log-timestamp">{formatTimestampMs(log.timestamp)}</span>
        <span className={`ws-log-direction ${directionClass}`}>{directionLabel}</span>
      </div>
      <div
        className={`ws-log-content ${!log.expanded && isLong ? 'ws-log-content-collapsed' : ''}`}
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
      {isLong && !log.expanded && (
        <div className="ws-log-expand-hint">点击展开完整内容</div>
      )}
    </div>
  )
}

function WsDebuggerPage() {
  const navigate = useNavigate()

  const [url, setUrl] = useState(DEFAULT_WS_URL)
  const [status, setStatus] = useState(CONNECTION_STATUS.DISCONNECTED)
  const [errorReason, setErrorReason] = useState('')
  const [logs, setLogs] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [history, setHistory] = useState(() => loadHistory())
  const [settings, setSettings] = useState(() => loadSettings())

  const [connectionDuration, setConnectionDuration] = useState(0)
  const [heartbeatFailCount, setHeartbeatFailCount] = useState(0)
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState(null)
  const [lastHeartbeatResult, setLastHeartbeatResult] = useState(null)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const [hasNewMessages, setHasNewMessages] = useState(false)

  const wsRef = useRef(null)
  const durationTimerRef = useRef(null)
  const heartbeatTimerRef = useRef(null)
  const heartbeatTimeoutRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const logListRef = useRef(null)
  const autoScrollRef = useRef(true)
  const intentionalDisconnectRef = useRef(false)
  const connectedAtRef = useRef(null)
  const doConnectRef = useRef(null)

  useEffect(() => {
    saveHistory(history)
  }, [history])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const addLog = useCallback((entry) => {
    setLogs((prev) => [...prev, { ...entry, expanded: false }])
  }, [])

  const addSystemLog = useCallback((message) => {
    addLog(createSystemLog(message))
  }, [addLog])

  useEffect(() => {
    const container = logListRef.current
    if (!container) return
    if (autoScrollRef.current) {
      container.scrollTop = container.scrollHeight
      setHasNewMessages(false)
    } else {
      setHasNewMessages(true)
    }
  }, [logs])

  const handleLogScroll = useCallback(() => {
    const container = logListRef.current
    if (!container) return
    autoScrollRef.current = shouldAutoScroll(container)
    if (autoScrollRef.current) {
      setHasNewMessages(false)
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    const container = logListRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
      autoScrollRef.current = true
      setHasNewMessages(false)
    }
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    stopHeartbeat()
    setHeartbeatFailCount(0)

    heartbeatTimerRef.current = setInterval(() => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      const pingMsg = '{"type":"ping"}'
      ws.send(pingMsg)
      addLog(createLogEntry(DIRECTION.SENT, pingMsg, { heartbeat: true }))

      heartbeatTimeoutRef.current = setTimeout(() => {
        setHeartbeatFailCount((prev) => {
          const next = prev + 1
          setLastHeartbeatResult('timeout')
          if (next >= settings.heartbeatTimeoutThreshold) {
            addSystemLog('连接已断开（心跳超时）')
            if (wsRef.current) {
              intentionalDisconnectRef.current = true
              wsRef.current.close()
            }
            setStatus(CONNECTION_STATUS.ERROR)
            setErrorReason('心跳超时')
          }
          return next
        })
      }, 5000)

      setLastHeartbeatTime(Date.now())
      setLastHeartbeatResult('pending')
    }, settings.heartbeatInterval * 1000)
  }, [settings.heartbeatInterval, settings.heartbeatTimeoutThreshold, addLog, addSystemLog, stopHeartbeat])

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }
  }, [])

  const startDurationTimer = useCallback(() => {
    stopDurationTimer()
    connectedAtRef.current = Date.now()
    setConnectionDuration(0)
    durationTimerRef.current = setInterval(() => {
      if (connectedAtRef.current) {
        setConnectionDuration(Math.floor((Date.now() - connectedAtRef.current) / 1000))
      }
    }, 1000)
  }, [stopDurationTimer])

  const stopReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    setReconnectAttempt(0)
  }, [])

  const attemptReconnect = useCallback(() => {
    if (intentionalDisconnectRef.current) return
    if (!settings.reconnectEnabled) return

    setReconnectAttempt((prev) => {
      const next = prev + 1
      if (next > settings.reconnectMaxRetries) {
        addSystemLog('重连失败，已达最大重连次数')
        return prev
      }
      addSystemLog(`正在重连（第 ${next} 次）...`)

      reconnectTimerRef.current = setTimeout(() => {
        if (doConnectRef.current) {
          doConnectRef.current()
        }
      }, settings.reconnectInterval * 1000)

      return next
    })
  }, [settings, addSystemLog])

  const doConnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    intentionalDisconnectRef.current = false
    stopHeartbeat()
    stopDurationTimer()

    setStatus(CONNECTION_STATUS.CONNECTING)
    setErrorReason('')

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus(CONNECTION_STATUS.CONNECTED)
        setErrorReason('')
        setReconnectAttempt(0)
        addSystemLog('连接成功')
        startDurationTimer()

        const shouldUseHeartbeat = settings.heartbeatEnabled && !isEchoServer(url)
        if (shouldUseHeartbeat) {
          startHeartbeat()
        } else if (isEchoServer(url)) {
          addSystemLog('检测到 Echo 服务器，心跳检测已自动禁用')
        }

        const entry = createHistoryEntry(url)
        setHistory((prev) => addHistory(prev, entry))
      }

      ws.onmessage = (event) => {
        const content = typeof event.data === 'string' ? event.data : String(event.data)
        addLog(createLogEntry(DIRECTION.RECEIVED, content))

        setLastHeartbeatResult((prev) => {
          if (prev === 'pending' && isPongResponse(content)) {
            setHeartbeatFailCount(0)
            if (heartbeatTimeoutRef.current) {
              clearTimeout(heartbeatTimeoutRef.current)
              heartbeatTimeoutRef.current = null
            }
            return 'success'
          }
          return prev
        })
      }

      ws.onclose = (event) => {
        stopHeartbeat()
        stopDurationTimer()

        if (intentionalDisconnectRef.current) {
          setStatus(CONNECTION_STATUS.DISCONNECTED)
          setErrorReason('')
          addSystemLog('已断开连接')
          intentionalDisconnectRef.current = false
        } else {
          setStatus(CONNECTION_STATUS.ERROR)
          const reason = event.reason || (event.code === 1000 ? '服务器正常关闭' : '服务器关闭连接')
          setErrorReason(reason)
          addSystemLog(`连接断开：${reason}`)
          attemptReconnect()
        }
      }

      ws.onerror = () => {
        setStatus(CONNECTION_STATUS.ERROR)
        setErrorReason('连接失败')
        addSystemLog('连接失败')
      }
    } catch (err) {
      setStatus(CONNECTION_STATUS.ERROR)
      setErrorReason(err.message || '无法建立连接')
      addSystemLog(`连接错误：${err.message || '无法建立连接'}`)
    }
  }, [url, addLog, addSystemLog, startDurationTimer, startHeartbeat, stopHeartbeat, stopDurationTimer, attemptReconnect, settings.heartbeatEnabled])

  useEffect(() => {
    doConnectRef.current = doConnect
  }, [doConnect])

  const handleConnect = useCallback(() => {
    if (!url.trim()) return
    stopReconnect()
    setReconnectAttempt(0)
    doConnect()
  }, [url, doConnect, stopReconnect])

  const handleDisconnect = useCallback(() => {
    intentionalDisconnectRef.current = true
    stopReconnect()
    stopHeartbeat()
    stopDurationTimer()
    if (wsRef.current) {
      wsRef.current.close(1000, '用户主动断开')
      wsRef.current = null
    }
    setStatus(CONNECTION_STATUS.DISCONNECTED)
    setErrorReason('')
    addSystemLog('已断开连接')
  }, [addSystemLog, stopHeartbeat, stopDurationTimer, stopReconnect])

  useEffect(() => {
    return () => {
      stopHeartbeat()
      stopDurationTimer()
      stopReconnect()
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [stopHeartbeat, stopDurationTimer, stopReconnect])

  const handleSendMessage = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const msg = messageInput.trim()
    if (!msg) return

    ws.send(msg)
    addLog(createLogEntry(DIRECTION.SENT, msg))
    setMessageInput('')
  }, [messageInput, addLog])

  const handleFormatJson = useCallback(() => {
    if (isValidJson(messageInput)) {
      setMessageInput(formatJson(messageInput))
    }
  }, [messageInput])

  const handleTemplateClick = useCallback((template) => {
    setMessageInput(template.content)
  }, [])

  const handleHistorySelect = useCallback((item) => {
    setUrl(item.url)
  }, [])

  const handleHistoryDelete = useCallback((id) => {
    setHistory((prev) => deleteHistory(prev, id))
  }, [])

  const handleHistoryClear = useCallback(() => {
    setHistory(clearHistory())
  }, [])

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings)
  }, [])

  const handleToggleExpand = useCallback((logId) => {
    setLogs((prev) =>
      prev.map((log) =>
        log.id === logId ? { ...log, expanded: !log.expanded } : log
      )
    )
  }, [])

  const handleClearLogs = useCallback(() => {
    setLogs([])
  }, [])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const isConnected = status === CONNECTION_STATUS.CONNECTED
  const isConnecting = status === CONNECTION_STATUS.CONNECTING
  const filteredLogs = useMemo(() => filterLogs(logs, searchKeyword), [logs, searchKeyword])

  const statusDotClass = `ws-status-dot ws-status-dot-${status}`
  const statusDotStyle = reconnectAttempt > 0 && isConnecting
    ? { animation: 'ws-flash 0.8s infinite' }
    : {}

  return (
    <div className="ws-page">
      <div className="ws-header">
        <button className="ws-back-btn" onClick={handleBack}>← 返回首页</button>
        <h1 className="ws-title">WebSocket 调试工具</h1>
      </div>

      <div className="ws-main">
        <HistoryPanel
          history={history}
          currentUrl={url}
          onSelect={handleHistorySelect}
          onDelete={handleHistoryDelete}
          onClear={handleHistoryClear}
        />

        <div className="ws-center">
          <div className="ws-connect-section">
            <div className="ws-url-bar">
              <input
                className="ws-url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="请输入 WebSocket URL"
                onKeyDown={(e) => e.key === 'Enter' && !isConnected && handleConnect()}
                disabled={isConnecting}
              />
              {!isConnected && !isConnecting && (
                <button className="ws-btn ws-btn-success" onClick={handleConnect}>
                  连接
                </button>
              )}
              {isConnecting && (
                <button className="ws-btn" disabled>
                  连接中...
                </button>
              )}
              {(isConnected || isConnecting) && (
                <button className="ws-btn ws-btn-danger" onClick={handleDisconnect}>
                  断开
                </button>
              )}
            </div>

            <div className="ws-status-bar">
              <div className="ws-status-indicator">
                <span className={statusDotClass} style={statusDotStyle} />
                <span>{getStatusText(status, errorReason)}</span>
              </div>
              {isConnected && (
                <span className="ws-duration">
                  {formatConnectionDuration(connectionDuration)}
                </span>
              )}
              {errorReason && (
                <span className="ws-error-reason">{errorReason}</span>
              )}
              {isConnected && lastHeartbeatTime && (
                <div className="ws-heartbeat-info">
                  <span
                    className={`ws-heartbeat-dot ${lastHeartbeatResult === 'success' ? 'ws-heartbeat-dot-success' : lastHeartbeatResult === 'timeout' ? 'ws-heartbeat-dot-timeout' : ''}`}
                  />
                  <span>
                    心跳：{lastHeartbeatResult === 'success' ? '正常' : lastHeartbeatResult === 'timeout' ? `超时(${heartbeatFailCount}/${settings.heartbeatTimeoutThreshold})` : '等待中'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={`ws-send-section ${!isConnected ? 'is-disabled' : ''}`}>
            <textarea
              className="ws-send-textarea"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder='输入消息内容，支持 JSON 格式。Ctrl+Enter 发送'
              disabled={!isConnected}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <div className="ws-send-toolbar">
              <button
                className="ws-btn ws-btn-sm"
                onClick={handleFormatJson}
                disabled={!isValidJson(messageInput)}
              >
                格式化 JSON
              </button>
              <button
                className="ws-btn ws-btn-primary ws-btn-sm"
                onClick={handleSendMessage}
                disabled={!isConnected || !messageInput.trim()}
              >
                发送
              </button>
              <span style={{ fontSize: 12, color: 'var(--text)', marginLeft: 'auto' }}>
                Ctrl+Enter 发送
              </span>
            </div>
            <div className="ws-templates">
              {MESSAGE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  className="ws-template-tag"
                  onClick={() => handleTemplateClick(tpl)}
                  disabled={!isConnected}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ws-log-section">
            <div className="ws-log-header">
              <h3 className="ws-log-title">消息日志</h3>
              <span className="ws-log-count">{logs.length}</span>
              <input
                className="ws-log-search"
                type="text"
                placeholder="搜索日志..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <button className="ws-log-clear-btn" onClick={handleClearLogs}>
                清空
              </button>
            </div>
            <div className="ws-log-list" ref={logListRef} onScroll={handleLogScroll}>
              {filteredLogs.length === 0 ? (
                <div className="ws-log-empty">
                  {logs.length === 0 ? '暂无消息，连接后发送和接收的消息将显示在这里' : '没有匹配的日志'}
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <LogEntry
                    key={log.id}
                    log={log}
                    searchKeyword={searchKeyword}
                    onClick={() => handleToggleExpand(log.id)}
                  />
                ))
              )}
              {hasNewMessages && (
                <button className="ws-new-msg-btn" onClick={scrollToBottom}>
                  ↓ 有新消息
                </button>
              )}
            </div>
          </div>
        </div>

        <SettingsPanel
          settings={settings}
          url={url}
          onChange={handleSettingsChange}
        />
      </div>
    </div>
  )
}

export default WsDebuggerPage
