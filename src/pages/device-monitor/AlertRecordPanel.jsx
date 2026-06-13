import { useState, useMemo } from 'react'
import {
  ALERT_LEVELS,
  ALERT_LEVEL_LABELS,
  ALERT_LEVEL_COLORS,
  ALERT_STATUS,
  ALERT_STATUS_LABELS,
  METRIC_UNITS,
  METRIC_LABELS,
  ALERT_CONDITION_LABELS,
} from './constants.js'
import {
  filterAlertRecords,
  sortAlertRecords,
  confirmAlertRecords,
  resolveAlertRecords,
  formatDateTime,
  formatMetricValue,
  getAlertLevelColor,
} from './deviceUtils.js'

const AlertRecordPanel = ({ records, onRecordsChange, onClose }) => {
  const [filters, setFilters] = useState({
    level: 'all',
    status: 'all',
    startTime: '',
    endTime: '',
    keyword: '',
  })
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [sortBy, setSortBy] = useState('triggeredAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const filteredRecords = useMemo(() => {
    const filtered = filterAlertRecords(records, filters)
    return sortAlertRecords(filtered, sortBy, sortOrder)
  }, [records, filters, sortBy, sortOrder])

  const filteredRecordIds = useMemo(
    () => new Set(filteredRecords.map((r) => r.id)),
    [filteredRecords]
  )

  const allSelected = useMemo(() => {
    if (filteredRecords.length === 0) return false
    return filteredRecords.every((r) => selectedIds.has(r.id))
  }, [filteredRecords, selectedIds])

  const someSelected = useMemo(() => {
    return filteredRecords.some((r) => selectedIds.has(r.id))
  }, [filteredRecords, selectedIds])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggleSelect = (recordId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(recordId)) {
        next.delete(recordId)
      } else {
        next.add(recordId)
      }
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredRecordIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredRecordIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const handleToggleExpand = (recordId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(recordId)) {
        next.delete(recordId)
      } else {
        next.add(recordId)
      }
      return next
    })
  }

  const handleBatchConfirm = () => {
    const ids = Array.from(selectedIds)
    const result = confirmAlertRecords(records, ids)
    if (result.success) {
      onRecordsChange(result.records)
      setSelectedIds(new Set())
    }
  }

  const handleBatchResolve = () => {
    const ids = Array.from(selectedIds)
    const result = resolveAlertRecords(records, ids)
    if (result.success) {
      onRecordsChange(result.records)
      setSelectedIds(new Set())
    }
  }

  const handleSingleConfirm = (recordId) => {
    const result = confirmAlertRecords(records, [recordId])
    if (result.success) {
      onRecordsChange(result.records)
    }
  }

  const handleSingleResolve = (recordId) => {
    const result = resolveAlertRecords(records, [recordId])
    if (result.success) {
      onRecordsChange(result.records)
    }
  }

  const handleToggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const clearFilters = () => {
    setFilters({
      level: 'all',
      status: 'all',
      startTime: '',
      endTime: '',
      keyword: '',
    })
  }

  const pendingCount = records.filter((r) => r.status === ALERT_STATUS.PENDING).length
  const confirmedCount = records.filter((r) => r.status === ALERT_STATUS.CONFIRMED).length
  const resolvedCount = records.filter((r) => r.status === ALERT_STATUS.RESOLVED).length

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal alert-record-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 className="modal-title">告警记录</h2>
            <div className="record-stats-mini">
              <span className="record-stat-mini" style={{ color: ALERT_LEVEL_COLORS[ALERT_LEVELS.CRITICAL] }}>
                未处理 {pendingCount}
              </span>
              <span className="record-stat-mini" style={{ color: ALERT_LEVEL_COLORS[ALERT_LEVELS.WARNING] }}>
                已确认 {confirmedCount}
              </span>
              <span className="record-stat-mini" style={{ color: '#52c41a' }}>
                已解决 {resolvedCount}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="record-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">告警级别</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <option value="all">全部级别</option>
                  {Object.values(ALERT_LEVELS).map((level) => (
                    <option key={level} value={level}>
                      {ALERT_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">处理状态</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">全部状态</option>
                  {Object.values(ALERT_STATUS).map((status) => (
                    <option key={status} value={status}>
                      {ALERT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">开始日期</label>
                <input
                  type="date"
                  className="form-input form-input-sm"
                  value={filters.startTime}
                  onChange={(e) => handleFilterChange('startTime', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">结束日期</label>
                <input
                  type="date"
                  className="form-input form-input-sm"
                  value={filters.endTime}
                  onChange={(e) => handleFilterChange('endTime', e.target.value)}
                />
              </div>
              <div className="filter-group filter-group-search">
                <label className="filter-label">关键字</label>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="搜索设备/告警内容"
                  value={filters.keyword}
                  onChange={(e) => handleFilterChange('keyword', e.target.value)}
                />
              </div>
              <div className="filter-group filter-group-actions">
                <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                  清除筛选
                </button>
              </div>
            </div>
          </div>

          <div className="batch-actions">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = !allSelected && someSelected
                }}
                onChange={handleToggleSelectAll}
              />
              全选 ({selectedIds.size})
            </label>
            <div className="batch-buttons">
              <button
                className="btn btn-warning btn-sm"
                disabled={selectedIds.size === 0}
                onClick={handleBatchConfirm}
              >
                批量确认
              </button>
              <button
                className="btn btn-success btn-sm"
                disabled={selectedIds.size === 0}
                onClick={handleBatchResolve}
              >
                批量解决
              </button>
            </div>
          </div>

          <div className="record-sort-header">
            <div className="sort-col sort-col-check" />
            <div
              className={`sort-col sort-col-time ${sortBy === 'triggeredAt' ? 'sorted' : ''}`}
              onClick={() => handleToggleSort('triggeredAt')}
            >
              告警时间 {sortBy === 'triggeredAt' && (sortOrder === 'desc' ? '↓' : '↑')}
            </div>
            <div className="sort-col sort-col-device">设备</div>
            <div className="sort-col sort-col-content">告警内容</div>
            <div
              className={`sort-col sort-col-level ${sortBy === 'level' ? 'sorted' : ''}`}
              onClick={() => handleToggleSort('level')}
            >
              级别 {sortBy === 'level' && (sortOrder === 'desc' ? '↓' : '↑')}
            </div>
            <div
              className={`sort-col sort-col-status ${sortBy === 'status' ? 'sorted' : ''}`}
              onClick={() => handleToggleSort('status')}
            >
              状态 {sortBy === 'status' && (sortOrder === 'desc' ? '↓' : '↑')}
            </div>
            <div className="sort-col sort-col-actions">操作</div>
          </div>

          <div className="record-list">
            {filteredRecords.length === 0 ? (
              <div className="empty-records">暂无告警记录</div>
            ) : (
              filteredRecords.map((record) => {
                const isExpanded = expandedIds.has(record.id)
                const isSelected = selectedIds.has(record.id)
                const levelColor = getAlertLevelColor(record.level)

                return (
                  <div key={record.id} className={`record-item ${isSelected ? 'selected' : ''}`}>
                    <div className="record-main-row">
                      <div className="record-col record-col-check">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(record.id)}
                        />
                      </div>
                      <div
                        className="record-col record-col-time"
                        onClick={() => handleToggleExpand(record.id)}
                      >
                        {formatDateTime(record.triggeredAt)}
                        <span className="expand-arrow">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      <div className="record-col record-col-device">
                        <div className="record-device-name">{record.deviceName}</div>
                        <div className="record-device-id">{record.deviceId}</div>
                      </div>
                      <div className="record-col record-col-content">
                        {record.message}
                      </div>
                      <div className="record-col record-col-level">
                        <span
                          className="level-tag"
                          style={{
                            backgroundColor: levelColor + '20',
                            color: levelColor,
                            borderColor: levelColor + '40',
                          }}
                        >
                          {ALERT_LEVEL_LABELS[record.level]}
                        </span>
                      </div>
                      <div className="record-col record-col-status">
                        <span className={`status-tag status-tag-${record.status}`}>
                          {ALERT_STATUS_LABELS[record.status]}
                        </span>
                      </div>
                      <div className="record-col record-col-actions">
                        {record.status === ALERT_STATUS.PENDING && (
                          <button
                            className="btn btn-warning btn-xs"
                            onClick={() => handleSingleConfirm(record.id)}
                          >
                            确认
                          </button>
                        )}
                        {record.status !== ALERT_STATUS.RESOLVED && (
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => handleSingleResolve(record.id)}
                          >
                            解决
                          </button>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="record-detail-row">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">监控指标</span>
                            <span className="detail-value">
                              {METRIC_LABELS[record.metricType] || record.metricType}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">告警条件</span>
                            <span className="detail-value">
                              {ALERT_CONDITION_LABELS[record.condition] || record.condition}{' '}
                              {record.threshold}
                              {METRIC_UNITS[record.metricType] || ''}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">触发时数值</span>
                            <span className="detail-value">
                              {formatMetricValue(record.metricType, record.value)}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">持续时间</span>
                            <span className="detail-value">
                              {record.duration ? `${record.duration} 秒` : '-'}
                            </span>
                          </div>
                          {record.confirmedAt && (
                            <div className="detail-item">
                              <span className="detail-label">确认时间</span>
                              <span className="detail-value">
                                {formatDateTime(record.confirmedAt)}
                              </span>
                            </div>
                          )}
                          {record.resolvedAt && (
                            <div className="detail-item">
                              <span className="detail-label">解决时间</span>
                              <span className="detail-value">
                                {formatDateTime(record.resolvedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="record-footer-info">
            共 {filteredRecords.length} 条告警记录
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertRecordPanel
