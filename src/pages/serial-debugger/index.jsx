import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import './serial-debugger.css'
import {
  COM_PORTS,
  PRESET_BAUD_RATES,
  DATA_BITS,
  STOP_BITS,
  PARITY_OPTIONS,
  DEFAULT_CONFIG,
  DISPLAY_MODES,
  DIRECTIONS,
  EXPORT_FORMATS,
  MAX_HISTORY_ITEMS,
  MAX_PINNED_ITEMS,
} from './constants'
import {
  asciiToHex,
  hexToAscii,
  isValidHex,
  formatHexString,
  formatTimestamp,
  validateConfig,
  formatConfigSummary,
  addHistoryItem,
  filterHistoryByKeyword,
  togglePinnedItem,
  truncateText,
  formatLogEntry,
  buildExportContent,
  downloadTextFile,
  loadConfigFromStorage,
  saveConfigToStorage,
  loadHistoryFromStorage,
  saveHistoryToStorage,
  loadPinnedFromStorage,
  savePinnedToStorage,
} from './utils'

export default function SerialDebuggerPage() {
  const [config, setConfig] = useState(() => {
    const saved = loadConfigFromStorage()
    return saved && validateConfig(saved).valid ? saved : DEFAULT_CONFIG
  })
  const [isOpen, setIsOpen] = useState(false)
  const [sendMode, setSendMode] = useState(DISPLAY_MODES.ASCII)
  const [receiveMode, setReceiveMode] = useState(DISPLAY_MODES.ASCII)
  const [sendContent, setSendContent] = useState('')
  const [receiveLog, setReceiveLog] = useState([])
  const [history, setHistory] = useState(() => loadHistoryFromStorage())
  const [pinned, setPinned] = useState(() => loadPinnedFromStorage())
  const [searchKeyword, setSearchKeyword] = useState('')
  const [autoWrap, setAutoWrap] = useState(true)
  const [showTimestamp, setShowTimestamp] = useState(true)
  const [showDirection, setShowDirection] = useState(true)
  const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS.PLAIN_TEXT)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [baudRateInput, setBaudRateInput] = useState(String(config.baudRate))
  const [isCustomBaudRate, setIsCustomBaudRate] = useState(!PRESET_BAUD_RATES.includes(config.baudRate))

  const receiveLogRef = useRef(null)

  useEffect(() => {
    saveConfigToStorage(config)
  }, [config])

  useEffect(() => {
    saveHistoryToStorage(history)
  }, [history])

  useEffect(() => {
    savePinnedToStorage(pinned)
  }, [pinned])

  useEffect(() => {
    if (receiveLogRef.current) {
      receiveLogRef.current.scrollTop = receiveLogRef.current.scrollHeight
    }
  }, [receiveLog])

  const configSummary = useMemo(() => formatConfigSummary(config), [config])

  const filteredHistory = useMemo(() => {
    const pinnedIds = new Set(pinned.map((p) => p.id))
    return filterHistoryByKeyword(history, searchKeyword).filter(
      (item) => !pinnedIds.has(item.id)
    )
  }, [history, searchKeyword, pinned])

  const displayReceiveContent = useMemo(() => {
    return receiveLog
      .map((entry) =>
        formatLogEntry(entry, {
          showTimestamp,
          showDirection,
          autoWrap,
          isHex: receiveMode === DISPLAY_MODES.HEX,
        })
      )
      .join('')
  }, [receiveLog, showTimestamp, showDirection, autoWrap, receiveMode])

  const handleSend = useCallback(() => {
    if (!isOpen) return
    if (!sendContent.trim()) return

    let content = sendContent
    let format = sendMode

    if (sendMode === DISPLAY_MODES.HEX) {
      if (!isValidHex(sendContent)) {
        alert('请输入有效的十六进制数据')
        return
      }
      content = formatHexString(sendContent)
    }

    const sendEntry = {
      content,
      format,
      direction: DIRECTIONS.SEND,
      timestamp: Date.now(),
    }

    const receiveEntry = {
      content,
      format,
      direction: DIRECTIONS.RECEIVE,
      timestamp: Date.now(),
    }

    setReceiveLog((prev) => [...prev, sendEntry, receiveEntry])

    const result = addHistoryItem(
      history,
      { content, format },
      MAX_HISTORY_ITEMS
    )
    setHistory(result.history)
  }, [isOpen, sendContent, sendMode, history])

  const handleTogglePort = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleConfigChange = useCallback(
    (key, value) => {
      if (isOpen) return
      setConfig((prev) => ({ ...prev, [key]: value }))
    },
    [isOpen]
  )

  const handleBaudRateChange = useCallback(
    (value) => {
      if (isOpen) return
      setBaudRateInput(value)
      const num = Number(value)
      if (!isNaN(num) && Number.isInteger(num) && num > 0) {
        setConfig((prev) => ({ ...prev, baudRate: num }))
      }
    },
    [isOpen]
  )

  const handleSendModeChange = useCallback((mode) => {
    if (sendContent.trim()) {
      if (mode === DISPLAY_MODES.HEX && sendMode === DISPLAY_MODES.ASCII) {
        setSendContent(asciiToHex(sendContent))
      } else if (mode === DISPLAY_MODES.ASCII && sendMode === DISPLAY_MODES.HEX) {
        if (isValidHex(sendContent)) {
          setSendContent(hexToAscii(sendContent))
        }
      }
    }
    setSendMode(mode)
  }, [sendContent, sendMode])

  const handleHistoryClick = useCallback(
    (item) => {
      if (item.format === DISPLAY_MODES.HEX) {
        setSendMode(DISPLAY_MODES.HEX)
        setSendContent(item.content)
      } else {
        setSendMode(DISPLAY_MODES.ASCII)
        setSendContent(item.content)
      }
    },
    []
  )

  const handleTogglePin = useCallback(
    (item) => {
      const result = togglePinnedItem(pinned, item, MAX_PINNED_ITEMS)
      if (result.error) {
        alert(result.error)
        return
      }
      setPinned(result.pinned)
    },
    [pinned]
  )

  const handleClearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const handleClearReceive = useCallback(() => {
    setReceiveLog([])
    setShowClearConfirm(false)
  }, [])

  const handleExport = useCallback(() => {
    const isHexMode = receiveMode === DISPLAY_MODES.HEX
    const content = buildExportContent(receiveLog, history, config, exportFormat, isHexMode)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    downloadTextFile(content, `serial-log-${timestamp}.txt`)
  }, [receiveLog, history, config, exportFormat, receiveMode])

  const isPinned = useCallback(
    (item) => {
      return pinned.some((p) => p.id === item.id)
    },
    [pinned]
  )

  return (
    <div className="serial-debugger-page">
      <h1 className="page-title">🔌 串口调试工具</h1>

      <div className="config-panel">
        <div className="config-form">
          <div className="config-row">
            <div className="config-item">
              <label>串口号</label>
              <select
                value={config.port}
                onChange={(e) => handleConfigChange('port', e.target.value)}
                disabled={isOpen}
              >
                {COM_PORTS.map((port) => (
                  <option key={port} value={port}>
                    {port}
                  </option>
                ))}
              </select>
            </div>

            <div className="config-item">
              <label>波特率</label>
              <div className="baud-rate-group">
                <select
                  value={isCustomBaudRate ? 'custom' : config.baudRate}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomBaudRate(true)
                    } else {
                      setIsCustomBaudRate(false)
                      handleBaudRateChange(e.target.value)
                    }
                  }}
                  disabled={isOpen}
                >
                  {PRESET_BAUD_RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}
                    </option>
                  ))}
                  <option value="custom">自定义...</option>
                </select>
                {isCustomBaudRate && (
                  <input
                    type="number"
                    value={baudRateInput}
                    onChange={(e) => handleBaudRateChange(e.target.value)}
                    disabled={isOpen}
                    placeholder="自定义波特率"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="config-row">
            <div className="config-item">
              <label>数据位</label>
              <div className="radio-group">
                {DATA_BITS.map((bits) => (
                  <label key={bits} className="radio-label">
                    <input
                      type="radio"
                      name="dataBits"
                      value={bits}
                      checked={config.dataBits === bits}
                      onChange={() => handleConfigChange('dataBits', bits)}
                      disabled={isOpen}
                    />
                    {bits}
                  </label>
                ))}
              </div>
            </div>

            <div className="config-item">
              <label>停止位</label>
              <div className="radio-group">
                {STOP_BITS.map((bits) => (
                  <label key={bits} className="radio-label">
                    <input
                      type="radio"
                      name="stopBits"
                      value={bits}
                      checked={config.stopBits === bits}
                      onChange={() => handleConfigChange('stopBits', bits)}
                      disabled={isOpen}
                    />
                    {bits}
                  </label>
                ))}
              </div>
            </div>

            <div className="config-item">
              <label>校验位</label>
              <div className="radio-group">
                {PARITY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="radio-label">
                    <input
                      type="radio"
                      name="parity"
                      value={opt.value}
                      checked={config.parity === opt.value}
                      onChange={() => handleConfigChange('parity', opt.value)}
                      disabled={isOpen}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="config-summary">
          <div className="summary-text">{configSummary}</div>
          <button
            className={`port-toggle-btn ${isOpen ? 'open' : 'closed'}`}
            onClick={handleTogglePort}
          >
            {isOpen ? '● 已连接' : '○ 打开串口'}
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="send-receive-area">
          <div className="panel send-panel">
            <div className="panel-header">
              <h3>📤 发送区</h3>
              <div className="mode-switcher">
                <button
                  className={`mode-btn ${sendMode === DISPLAY_MODES.ASCII ? 'active' : ''}`}
                  onClick={() => handleSendModeChange(DISPLAY_MODES.ASCII)}
                >
                  ASCII
                </button>
                <button
                  className={`mode-btn ${sendMode === DISPLAY_MODES.HEX ? 'active' : ''}`}
                  onClick={() => handleSendModeChange(DISPLAY_MODES.HEX)}
                >
                  Hex
                </button>
              </div>
            </div>
            <textarea
              className="send-textarea"
              value={sendContent}
              onChange={(e) => setSendContent(e.target.value)}
              placeholder={sendMode === DISPLAY_MODES.HEX ? '输入十六进制数据，如：48 65 6C 6C 6F' : '输入要发送的文本...'}
              disabled={!isOpen}
            />
            <div className="send-footer">
              <button
                className="btn btn-primary send-btn"
                onClick={handleSend}
                disabled={!isOpen}
              >
                发送
              </button>
            </div>
          </div>

          <div className="panel receive-panel">
            <div className="panel-header">
              <h3>📥 接收区</h3>
              <div className="mode-switcher">
                <button
                  className={`mode-btn ${receiveMode === DISPLAY_MODES.ASCII ? 'active' : ''}`}
                  onClick={() => setReceiveMode(DISPLAY_MODES.ASCII)}
                >
                  ASCII
                </button>
                <button
                  className={`mode-btn ${receiveMode === DISPLAY_MODES.HEX ? 'active' : ''}`}
                  onClick={() => setReceiveMode(DISPLAY_MODES.HEX)}
                >
                  Hex
                </button>
              </div>
            </div>

            <div className="receive-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoWrap}
                  onChange={(e) => setAutoWrap(e.target.checked)}
                />
                自动换行
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showTimestamp}
                  onChange={(e) => setShowTimestamp(e.target.checked)}
                />
                显示时间戳
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showDirection}
                  onChange={(e) => setShowDirection(e.target.checked)}
                />
                显示方向标记
              </label>
            </div>

            <div className="receive-log" ref={receiveLogRef}>
              <pre>{displayReceiveContent || '暂无数据'}</pre>
            </div>

            <div className="receive-footer">
              <div className="export-options">
                <span>导出格式：</span>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={EXPORT_FORMATS.PLAIN_TEXT}
                    checked={exportFormat === EXPORT_FORMATS.PLAIN_TEXT}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  纯文本
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={EXPORT_FORMATS.WITH_HEADER}
                    checked={exportFormat === EXPORT_FORMATS.WITH_HEADER}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  带配置头
                </label>
              </div>
              <div className="footer-buttons">
                <button className="btn btn-secondary" onClick={handleExport}>
                  导出日志
                </button>
                <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
                  清空接收区
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="history-panel">
          <div className="panel-header">
            <h3>📋 发送历史</h3>
            <span className="history-count">{history.length}/{MAX_HISTORY_ITEMS}</span>
          </div>

          <div className="history-search">
            <input
              type="text"
              placeholder="搜索历史记录..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          {pinned.length > 0 && (
            <div className="pinned-section">
              <h4>📌 常用 (最多{MAX_PINNED_ITEMS}条)</h4>
              <div className="history-list">
                {pinned.map((item, index) => (
                  <div
                    key={item.id}
                    className="history-item pinned"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <div className="history-item-header">
                      <span className="history-index">★ {index + 1}</span>
                      <span className={`history-format ${item.format}`}>
                        {item.format === DISPLAY_MODES.HEX ? 'Hex' : 'ASCII'}
                      </span>
                      <button
                        className="pin-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTogglePin(item)
                        }}
                        title="取消固定"
                      >
                        取消固定
                      </button>
                    </div>
                    <div className="history-time">{formatTimestamp(item.timestamp)}</div>
                    <div className="history-content" title={item.content}>
                      {truncateText(item.content, 50)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="history-section">
            <h4>历史记录</h4>
            <div className="history-list">
              {filteredHistory.length === 0 ? (
                <div className="history-empty">暂无历史记录</div>
              ) : (
                filteredHistory.map((item, index) => (
                  <div
                    key={item.id}
                    className="history-item"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <div className="history-item-header">
                      <span className="history-index">#{index + 1}</span>
                      <span className={`history-format ${item.format}`}>
                        {item.format === DISPLAY_MODES.HEX ? 'Hex' : 'ASCII'}
                      </span>
                      <button
                        className="pin-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTogglePin(item)
                        }}
                        disabled={!isPinned(item) && pinned.length >= MAX_PINNED_ITEMS}
                        title={isPinned(item) ? '取消固定' : '固定到常用'}
                      >
                        {isPinned(item) ? '★' : '☆'}
                      </button>
                    </div>
                    <div className="history-time">{formatTimestamp(item.timestamp)}</div>
                    <div className="history-content" title={item.content}>
                      {truncateText(item.content, 50)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="history-footer">
            <button className="btn btn-danger" onClick={handleClearHistory}>
              清空历史
            </button>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>确认清空</h3>
            <p>确定要清空接收区的所有内容吗？</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={handleClearReceive}>
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
