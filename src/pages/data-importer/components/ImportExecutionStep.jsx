import { useState, useEffect, useRef, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { TARGET_FIELDS, FAILURE_REASONS, VALIDATION_MESSAGES } from '../constants.js'
import {
  generateImportDelay,
  shouldSkipRow,
  exportFailedRowsToCSV,
  downloadCSV,
  buildRowDisplayText,
} from '../utils.js'

export default function ImportExecutionStep({ validatedRows, onImportComplete }) {
  const [importState, setImportState] = useState('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [failedRows, setFailedRows] = useState([])
  const [currentRowText, setCurrentRowText] = useState('')
  const [filterReason, setFilterReason] = useState('all')
  const isPausedRef = useRef(false)
  const timerRef = useRef(null)
  const indexRef = useRef(0)
  const successRef = useRef(0)
  const skippedRef = useRef(0)
  const failedRowsRef = useRef([])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const processNextRow = useCallback(() => {
    const totalRows = validatedRows.length
    const idx = indexRef.current

    if (idx >= totalRows) {
      setImportState('completed')
      onImportComplete({
        successCount: successRef.current,
        skippedCount: skippedRef.current,
        skippedRows: failedRowsRef.current,
      })
      return
    }

    if (isPausedRef.current) {
      setImportState('paused')
      return
    }

    const row = validatedRows[idx]
    indexRef.current = idx + 1
    setCurrentIndex(idx + 1)
    setCurrentRowText(buildRowDisplayText(row, TARGET_FIELDS))

    const delay = generateImportDelay()
    timerRef.current = setTimeout(() => {
      if (shouldSkipRow(row)) {
        skippedRef.current += 1
        setSkippedCount(skippedRef.current)
        const reasons = []
        if (row.issues.some((i) => i.message === VALIDATION_MESSAGES.REQUIRED_EMPTY)) {
          reasons.push(FAILURE_REASONS.REQUIRED_MISSING)
        }
        const hasFormatIssue = row.issues.some((i) =>
          i.message === VALIDATION_MESSAGES.INVALID_EMAIL ||
          i.message === VALIDATION_MESSAGES.INVALID_PHONE ||
          i.message === VALIDATION_MESSAGES.INVALID_DATE
        )
        if (hasFormatIssue) {
          reasons.push(FAILURE_REASONS.FORMAT_ERROR)
        }
        if (row.issues.some((i) => i.message === VALIDATION_MESSAGES.DUPLICATE_ROW)) {
          reasons.push(FAILURE_REASONS.DUPLICATE_ROW)
        }
        const newFailedRow = {
          ...row,
          reasons: [...new Set(reasons)],
        }
        failedRowsRef.current = [...failedRowsRef.current, newFailedRow]
        setFailedRows(failedRowsRef.current)
      } else {
        successRef.current += 1
        setSuccessCount(successRef.current)
      }
      processNextRow()
    }, delay)
  }, [validatedRows, onImportComplete])

  const handleStart = () => {
    indexRef.current = currentIndex
    successRef.current = successCount
    skippedRef.current = skippedCount
    failedRowsRef.current = failedRows
    isPausedRef.current = false
    setImportState('running')
    processNextRow()
  }

  const handlePause = () => {
    isPausedRef.current = true
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setImportState('paused')
  }

  const handleResume = () => {
    isPausedRef.current = false
    setImportState('running')
    processNextRow()
  }

  const handleExportFailed = () => {
    const content = exportFailedRowsToCSV(failedRows, TARGET_FIELDS)
    if (content) {
      downloadCSV(content, `failed_rows_${Date.now()}.csv`)
    }
  }

  const totalRows = validatedRows.length
  const progressPercent = totalRows > 0 ? Math.round((currentIndex / totalRows) * 100) : 0
  const isCompleted = importState === 'completed'
  const successRate = totalRows > 0 ? Math.round((successCount / totalRows) * 100) : 0

  const pieData = [
    { name: '成功', value: successCount, color: '#10b981' },
    { name: '跳过', value: skippedCount, color: '#ef4444' },
  ]

  const skippedByReason = {}
  failedRows.forEach((row) => {
    row.reasons.forEach((r) => {
      skippedByReason[r] = (skippedByReason[r] || 0) + 1
    })
  })

  const filteredFailedRows = filterReason === 'all'
    ? failedRows
    : failedRows.filter((row) => row.reasons.includes(filterReason))

  return (
    <div className="import-progress-section">
      {!isCompleted ? (
        <div>
          <div className="progress-container">
            <div className="progress-header">
              <span className="progress-label">导入进度</span>
              <span className="progress-percent">{progressPercent}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              >
                {progressPercent > 15 ? `${currentIndex}/${totalRows}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 8, textAlign: 'right' }}>
              已处理 {currentIndex} / {totalRows} 行 · 成功 {successCount} · 跳过 {skippedCount}
            </div>
          </div>

          {importState !== 'idle' && (
            <div className="current-row-display">
              <div className="current-row-label">
                {importState === 'paused' ? '⏸ 已暂停，当前行：' : `📝 正在导入第 ${currentIndex} 行：`}
              </div>
              <div className="current-row-content">
                {currentRowText || '...'}
              </div>
            </div>
          )}

          <div className="import-controls">
            {importState === 'idle' && (
              <button className="btn btn-primary" onClick={handleStart}>
                ▶️ 开始导入
              </button>
            )}
            {importState === 'running' && (
              <button className="btn btn-secondary" onClick={handlePause}>
                ⏸ 暂停
              </button>
            )}
            {importState === 'paused' && (
              <button className="btn btn-primary" onClick={handleResume}>
                ▶️ 继续
              </button>
            )}
            {(importState === 'running' || importState === 'paused') && (
              <span style={{ fontSize: 13, color: 'var(--text)', alignSelf: 'center' }}>
                每行模拟延迟 50-200ms...
              </span>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ marginBottom: 8, fontSize: 24 }}>
              ✅ 导入完成
            </h2>
            <p style={{ color: 'var(--text)', fontSize: 14 }}>
              共处理 {totalRows} 行数据
            </p>
          </div>

          <div className="import-summary">
            <div className="success-rate-ring">
              <div style={{ position: 'relative', width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-h)' }}>
                    {successRate}%
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text)' }}>
                    成功率
                  </div>
                </div>
              </div>
            </div>

            <div className="summary-stats">
              <div className="summary-item success">
                <div className="summary-count">{successCount}</div>
                <div className="summary-label">成功导入（行）</div>
              </div>
              <div className="summary-item skipped">
                <div className="summary-count">{skippedCount}</div>
                <div className="summary-label">
                  跳过（行）
                  {Object.keys(skippedByReason).length > 0 && (
                    <div className="skip-breakdown">
                      {Object.entries(skippedByReason).map(([r, c]) => (
                        <span key={r} className="skip-reason-tag">
                          {r}: {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {failedRows.length > 0 && (
            <div className="failed-rows-section">
              <div className="section-title">
                <span>失败行明细（共 {failedRows.length} 行）</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportFailed}
                >
                  📥 导出失败行 CSV
                </button>
              </div>

              <div className="filter-bar">
                <span style={{ fontSize: 13, color: 'var(--text)' }}>按原因筛选：</span>
                <select
                  className="form-select filter-select"
                  value={filterReason}
                  onChange={(e) => setFilterReason(e.target.value)}
                >
                  <option value="all">全部</option>
                  <option value={FAILURE_REASONS.REQUIRED_MISSING}>必填缺失</option>
                  <option value={FAILURE_REASONS.FORMAT_ERROR}>格式错误</option>
                  <option value={FAILURE_REASONS.DUPLICATE_ROW}>重复行</option>
                </select>
              </div>

              <div className="validation-table-wrap">
                <table className="validation-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>行号</th>
                      {TARGET_FIELDS.map((field) => (
                        <th key={field.key}>{field.label}</th>
                      ))}
                      <th style={{ width: 160 }}>失败原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFailedRows.map((row, idx) => (
                      <tr key={idx} className="row-error">
                        <td>{row.index + 1}</td>
                        {TARGET_FIELDS.map((field) => (
                          <td key={field.key}>{row.data[field.key] || ''}</td>
                        ))}
                        <td>
                          {row.reasons.map((r, i) => (
                            <span
                              key={i}
                              className="issue-badge issue-error"
                              style={{ marginRight: 4, marginTop: 2 }}
                            >
                              {r}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
