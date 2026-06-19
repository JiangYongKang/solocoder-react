import { useState, useEffect, useCallback, useMemo } from 'react'
import './key-tester.css'
import { KEYBOARD_LAYOUTS, PRESET_COMBINATIONS, MAX_LOG_ENTRIES } from './constants'
import {
  getHeatmapColor,
  detectCombination,
  formatTimestamp,
  addLogEntry,
  filterLogsByKeyword,
  exportLogsToCsv,
  downloadCsvFile,
  loadLogsFromStorage,
  saveLogsToStorage,
  loadFrequencyFromStorage,
  saveFrequencyToStorage,
  loadLayoutFromStorage,
  saveLayoutToStorage,
  incrementFrequency,
  getMaxFrequency,
  getTotalKeyPresses,
  calculateFrequencyPercentage,
  getKeyDisplayLabel,
  isModifierKey,
  getModifierKeyLabel,
} from './utils'

export default function KeyTesterPage() {
  const [activeKeys, setActiveKeys] = useState(new Set())
  const [currentKey, setCurrentKey] = useState(null)
  const [currentEvent, setCurrentEvent] = useState('')
  const [layout, setLayout] = useState(loadLayoutFromStorage())
  const [logs, setLogs] = useState(loadLogsFromStorage())
  const [frequency, setFrequency] = useState(loadFrequencyFromStorage())
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [comboHint, setComboHint] = useState(null)

  const keyboardLayout = KEYBOARD_LAYOUTS[layout]
  const maxFrequency = getMaxFrequency(frequency)
  const totalPresses = getTotalKeyPresses(frequency)

  const currentCombination = useMemo(() => {
    return detectCombination(Array.from(activeKeys))
  }, [activeKeys])

  const filteredLogs = useMemo(() => {
    return filterLogsByKeyword(logs, searchKeyword)
  }, [logs, searchKeyword])

  const handleKeyDown = useCallback(
    (e) => {
      const code = e.code

      setActiveKeys((prev) => {
        const next = new Set(prev)
        next.add(code)
        return next
      })

      setCurrentKey(code)
      setCurrentEvent('keydown')

      setFrequency((prev) => {
        const next = incrementFrequency(prev, code)
        saveFrequencyToStorage(next)
        return next
      })

      const keyLabel = getKeyDisplayLabel(code, layout)
      const logEntry = {
        keyName: keyLabel,
        keyCode: code,
        eventType: 'keydown',
      }

      setLogs((prev) => {
        const result = addLogEntry(prev, logEntry, MAX_LOG_ENTRIES)
        saveLogsToStorage(result.logs)
        return result.logs
      })

      const combo = detectCombination([...activeKeys, code])
      if (combo && !combo.isCustom) {
        setComboHint(combo)
        setTimeout(() => setComboHint(null), 2000)
      }
    },
    [layout, activeKeys]
  )

  const handleKeyUp = useCallback(
    (e) => {
      const code = e.code

      setActiveKeys((prev) => {
        const next = new Set(prev)
        next.delete(code)
        return next
      })

      setCurrentKey(code)
      setCurrentEvent('keyup')

      const keyLabel = getKeyDisplayLabel(code, layout)
      const logEntry = {
        keyName: keyLabel,
        keyCode: code,
        eventType: 'keyup',
      }

      setLogs((prev) => {
        const result = addLogEntry(prev, logEntry, MAX_LOG_ENTRIES)
        saveLogsToStorage(result.logs)
        return result.logs
      })
    },
    [layout]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout)
    saveLayoutToStorage(newLayout)
  }

  const handleClearLogs = () => {
    setLogs([])
    saveLogsToStorage([])
  }

  const handleResetHeatmap = () => {
    setFrequency({})
    saveFrequencyToStorage({})
  }

  const handleExportCsv = () => {
    const result = exportLogsToCsv(logs)
    if (result.success) {
      downloadCsvFile(result.content, `key-logs-${Date.now()}.csv`)
    }
  }

  const renderKey = (key) => {
    const isActive = activeKeys.has(key.code)
    const pressCount = frequency[key.code] || 0
    const heatColor = showHeatmap ? getHeatmapColor(pressCount, maxFrequency) : null
    const percentage = totalPresses > 0 ? calculateFrequencyPercentage(pressCount, totalPresses) : 0

    const keyStyle = {
      flex: key.width,
      minWidth: `${key.width * 48}px`,
      ...(heatColor && { backgroundColor: heatColor }),
    }

    const keyClasses = ['key']
    if (isActive) keyClasses.push('active')
    if (showHeatmap) keyClasses.push('heatmap-key')

    return (
      <div key={key.code} className={keyClasses.join(' ')} style={keyStyle}>
        {key.label}
        {showHeatmap && pressCount > 0 && (
          <div className="key-tooltip">
            按下 {pressCount} 次 ({percentage.toFixed(1)}%)
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="key-tester-page">
      <h1 className="page-title">⌨️ 键盘键位测试器</h1>

      <div className="toolbar">
        <div className="layout-switcher">
          {Object.entries(KEYBOARD_LAYOUTS).map(([key, value]) => (
            <button
              key={key}
              className={`layout-btn ${layout === key ? 'active' : ''}`}
              onClick={() => handleLayoutChange(key)}
              title={value.description}
            >
              {value.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowHeatmap(!showHeatmap)}>
            {showHeatmap ? '隐藏热力图' : '显示热力图'}
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="left-panel">
          <div className="key-info-panel">
            <div className="current-key-info">
              <h3>当前按键</h3>
              <div className="key-display">{currentKey ? getKeyDisplayLabel(currentKey, layout) : '-'}</div>
              <div className="key-details">
                <span>键码: {currentKey || '-'}</span>
                <span>状态: {currentEvent === 'keydown' ? '按下' : currentEvent === 'keyup' ? '抬起' : '-'}</span>
                <span>事件: {currentEvent || '-'}</span>
              </div>
            </div>
            <div className="combination-panel">
              <h3>当前组合键</h3>
              <div className="combination-tags">
                {currentCombination ? (
                  <span className="combo-tag">{currentCombination.label}</span>
                ) : activeKeys.size > 0 ? (
                  Array.from(activeKeys).map((code) => (
                    <span key={code} className="combo-tag">
                      {isModifierKey(code) ? getModifierKeyLabel(code) : getKeyDisplayLabel(code, layout)}
                    </span>
                  ))
                ) : (
                  <span className="combo-tag" style={{ opacity: 0.6 }}>
                    无
                  </span>
                )}
              </div>
              {currentCombination && currentCombination.description && (
                <div className="combo-desc">{currentCombination.description}</div>
              )}
              {comboHint && (
                <div className="preset-combo-hint">
                  ✨ 检测到 {comboHint.label}：{comboHint.description}
                </div>
              )}
            </div>
          </div>

          <div className="keyboard-section">
            <h2 className="section-title">虚拟键盘</h2>
            <div className="keyboard-container">
              {keyboardLayout.rows.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                  {row.map((key) => renderKey(key))}
                </div>
              ))}
            </div>
            {showHeatmap && (
              <div className="heatmap-controls">
                <div className="heatmap-stats">
                  总按键次数: <strong>{totalPresses}</strong> | 最高频: {maxFrequency} 次
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="heatmap-legend">
                    <span>低频</span>
                    <div className="heatmap-legend-bar"></div>
                    <span>高频</span>
                  </div>
                  <button className="btn btn-secondary" onClick={handleResetHeatmap}>
                    重置热力图
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="preset-combinations">
            <h4>📋 预设组合键速查</h4>
            <div className="preset-combo-list">
              {PRESET_COMBINATIONS.slice(0, 15).map((combo, index) => (
                <span key={index} className="preset-combo-item" title={combo.description}>
                  {combo.label} - {combo.description}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="log-panel">
          <div className="log-header">
            <h3>📝 按键历史</h3>
            <div className="log-actions">
              <button className="btn btn-primary" onClick={handleExportCsv} title="导出 CSV">
                导出
              </button>
              <button className="btn btn-danger" onClick={handleClearLogs} title="清空日志">
                清空
              </button>
            </div>
          </div>
          <div className="log-search">
            <input
              type="text"
              placeholder="搜索按键名、键码..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          <div className="log-table-container">
            {filteredLogs.length === 0 ? (
              <div className="log-empty">暂无按键记录</div>
            ) : (
              <table className="log-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>时间</th>
                    <th>键名</th>
                    <th>键码</th>
                    <th>事件</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={log.id}>
                      <td>{index + 1}</td>
                      <td>{formatTimestamp(log.timestamp)}</td>
                      <td>{log.keyName}</td>
                      <td style={{ fontSize: '11px', color: '#95a5a6' }}>{log.keyCode}</td>
                      <td className={`event-type-${log.eventType}`}>{log.eventType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
