import { useState, useMemo, useEffect, useRef } from 'react'
import { TARGET_FIELDS, VALIDATION_STATUS } from '../constants.js'
import { validateAllRows } from '../utils.js'

function isDataEqual(data1, data2) {
  if (data1 === data2) return true
  if (!Array.isArray(data1) || !Array.isArray(data2)) return false
  if (data1.length !== data2.length) return false
  for (let i = 0; i < data1.length; i++) {
    const row1 = data1[i]
    const row2 = data2[i]
    const keys1 = Object.keys(row1)
    const keys2 = Object.keys(row2)
    if (keys1.length !== keys2.length) return false
    for (let j = 0; j < keys1.length; j++) {
      const key = keys1[j]
      if (row1[key] !== row2[key]) return false
    }
  }
  return true
}

export default function ValidationStep({ mappedData, onValidatedDataChange }) {
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [localData, setLocalData] = useState(mappedData)
  const lastSyncedDataRef = useRef(mappedData)

  useEffect(() => {
    if (!isDataEqual(mappedData, lastSyncedDataRef.current)) {
      setLocalData(mappedData)
      lastSyncedDataRef.current = mappedData
    }
  }, [mappedData])

  const validationResult = useMemo(() => {
    return validateAllRows(localData, TARGET_FIELDS)
  }, [localData])

  useEffect(() => {
    onValidatedDataChange(validationResult)
  }, [validationResult, onValidatedDataChange])

  const handleDoubleClick = (rowIdx, fieldKey) => {
    setEditingCell({ rowIdx, fieldKey })
    setEditValue(localData[rowIdx][fieldKey] || '')
  }

  const handleCellBlur = () => {
    if (editingCell) {
      const newData = [...localData]
      newData[editingCell.rowIdx] = {
        ...newData[editingCell.rowIdx],
        [editingCell.fieldKey]: editValue.trim(),
      }
      setLocalData(newData)
      setEditingCell(null)
    }
  }

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur()
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const getRowClass = (row) => {
    switch (row.status) {
      case VALIDATION_STATUS.ERROR:
        return 'row-error'
      case VALIDATION_STATUS.WARNING:
        return 'row-warning'
      case VALIDATION_STATUS.DUPLICATE:
        return 'row-duplicate'
      default:
        return ''
    }
  }

  const getCellIssues = (rowResult, fieldKey) => {
    return rowResult.issues.filter((issue) => issue.field === fieldKey)
  }

  const getIssueClass = (type) => {
    switch (type) {
      case VALIDATION_STATUS.ERROR:
        return 'issue-error'
      case VALIDATION_STATUS.WARNING:
        return 'issue-warning'
      case VALIDATION_STATUS.DUPLICATE:
        return 'issue-duplicate'
      default:
        return ''
    }
  }

  return (
    <div>
      <div className="stats-cards">
        <div className="stat-card total">
          <div className="stat-label">总行数</div>
          <div className="stat-value">{validationResult.stats.total}</div>
        </div>
        <div className="stat-card valid">
          <div className="stat-label">有效行</div>
          <div className="stat-value">{validationResult.stats.valid}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">警告行</div>
          <div className="stat-value">{validationResult.stats.warning}</div>
        </div>
        <div className="stat-card error">
          <div className="stat-label">错误行</div>
          <div className="stat-value">{validationResult.stats.error}</div>
        </div>
        <div className="stat-card duplicate">
          <div className="stat-label">重复行</div>
          <div className="stat-value">{validationResult.stats.duplicate}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-color legend-valid"></div>
          <span>有效</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-error"></div>
          <span>错误（必填缺失）</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-warning"></div>
          <span>警告（格式问题）</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-duplicate"></div>
          <span>重复行</span>
        </div>
      </div>

      <div className="section-title" style={{ marginBottom: 12 }}>
        <span>数据表格（双击单元格可编辑）</span>
      </div>

      <div className="validation-table-wrap">
        <table className="validation-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th style={{ width: 70 }}>状态</th>
              {TARGET_FIELDS.map((field) => (
                <th key={field.key}>
                  {field.label}
                  {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {validationResult.rows.map((rowResult, idx) => {
              const isEditing = editingCell && editingCell.rowIdx === idx
              return (
                <tr key={idx} className={getRowClass(rowResult)}>
                  <td>{idx + 1}</td>
                  <td>
                    {rowResult.status === VALIDATION_STATUS.VALID ? (
                      <span className="issue-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        ✓
                      </span>
                    ) : rowResult.issues.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {rowResult.issues.slice(0, 2).map((issue, i) => (
                          <span
                            key={i}
                            className={`issue-badge ${getIssueClass(issue.type)}`}
                            title={issue.message}
                          >
                            {issue.field
                              ? `${TARGET_FIELDS.find((f) => f.key === issue.field)?.label || issue.field}问题`
                              : issue.message}
                          </span>
                        ))}
                        {rowResult.issues.length > 2 && (
                          <span className="issue-badge" style={{ opacity: 0.7 }}>
                            +{rowResult.issues.length - 2}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </td>
                  {TARGET_FIELDS.map((field) => {
                    const isCellEditing = isEditing && editingCell.fieldKey === field.key
                    const cellIssues = getCellIssues(rowResult, field.key)
                    const hasCellIssue = cellIssues.length > 0
                    return (
                      <td
                        key={field.key}
                        onDoubleClick={() => handleDoubleClick(idx, field.key)}
                        style={{
                          background: hasCellIssue && !isCellEditing
                            ? cellIssues[0].type === VALIDATION_STATUS.ERROR
                              ? 'rgba(239,68,68,0.1)'
                              : cellIssues[0].type === VALIDATION_STATUS.WARNING
                                ? 'rgba(245,158,11,0.1)'
                                : undefined
                            : undefined,
                        }}
                      >
                        {isCellEditing ? (
                          <input
                            className="cell-input"
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleCellKeyDown}
                            autoFocus
                          />
                        ) : (
                          <div className="cell-display" title={cellIssues.map((i) => i.message).join('; ')}>
                            {rowResult.data[field.key] || <span style={{ opacity: 0.3 }}>空</span>}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
