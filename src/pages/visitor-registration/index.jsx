import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './visitor-registration.css'
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  HOST_LIST,
  STATUS_FILTER_OPTIONS,
  VISITOR_STATUS,
  VISITOR_STATUS_LABELS,
} from './constants'
import {
  validateName,
  validatePhone,
  validateIdCard,
  validateReason,
  validateHost,
  validateImageFile,
} from './validators'
import {
  formatDateTime,
  maskPhone,
  maskIdCard,
  getVisitorStatus,
  sortRecords,
  filterRecords,
  paginateRecords,
  exportRecordsToCsv,
  downloadCsv,
  updateRecentHosts,
  searchHosts,
  checkOutRecord,
  batchCheckOutRecords,
  createFormInitialState,
  createRegistrationRecord,
} from './utils'
import {
  loadRecords,
  saveRecords,
  loadRecentHosts,
  saveRecentHosts,
} from './storage'

function HostAvatar({ name, size = 32 }) {
  const initial = name ? name.charAt(0) : '?'
  return (
    <div className="vr-host-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initial}
    </div>
  )
}

const VisitorRegistrationPage = () => {
  const navigate = useNavigate()

  const [records, setRecords] = useState(() => loadRecords())
  const [recentHosts, setRecentHosts] = useState(() => loadRecentHosts())

  const [showSuccess, setShowSuccess] = useState(false)
  const successTimerRef = useRef(null)

  const [formData, setFormData] = useState(() => createFormInitialState())

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    idCard: '',
    reason: '',
    host: '',
    photo: '',
  })

  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    idCard: false,
    reason: false,
    host: false,
  })

  const [hostSearchOpen, setHostSearchOpen] = useState(false)
  const [hostSearchKeyword, setHostSearchKeyword] = useState('')
  const hostSearchRef = useRef(null)

  const [imageViewer, setImageViewer] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const [checkOutModal, setCheckOutModal] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'all',
    startDate: '',
    endDate: '',
  })
  const [now, setNow] = useState(() => Date.now())

  const debounceRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    saveRecords(records)
  }, [records])

  useEffect(() => {
    saveRecentHosts(recentHosts)
  }, [recentHosts])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (hostSearchRef.current && !hostSearchRef.current.contains(e.target)) {
        setHostSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  const filteredHosts = useMemo(
    () => searchHosts(HOST_LIST, hostSearchKeyword),
    [hostSearchKeyword]
  )

  const sortedRecords = useMemo(
    () => sortRecords(records, now),
    [records, now]
  )

  const filteredRecords = useMemo(
    () => filterRecords(sortedRecords, filters, now),
    [sortedRecords, filters, now]
  )

  const pagination = useMemo(
    () => paginateRecords(filteredRecords, page, pageSize),
    [filteredRecords, page, pageSize]
  )

  const overdueCount = useMemo(
    () =>
      sortedRecords.filter(
        (r) => getVisitorStatus(r, now) === VISITOR_STATUS.OVERDUE
      ).length,
    [sortedRecords, now]
  )

  const handleBlur = useCallback((field, validator) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const error = validator(formData[field])
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [formData])

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      let error = ''
      if (field === 'name') error = validateName(value)
      else if (field === 'phone') error = validatePhone(value)
      else if (field === 'idCard') error = validateIdCard(value)
      else if (field === 'reason') error = validateReason(value)
      else if (field === 'host') error = validateHost(value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }, [touched])

  const handleFileSelect = useCallback((file) => {
    const fileError = validateImageFile(file)
    if (fileError) {
      setErrors((prev) => ({ ...prev, photo: fileError }))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setFormData((prev) => ({ ...prev, photo: e.target.result }))
      setErrors((prev) => ({ ...prev, photo: '' }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleRemovePhoto = useCallback(() => {
    setFormData((prev) => ({ ...prev, photo: '' }))
  }, [])

  const handleSelectHost = useCallback((host) => {
    setFormData((prev) => ({ ...prev, host }))
    setErrors((prev) => ({ ...prev, host: '' }))
    setTouched((prev) => ({ ...prev, host: true }))
    setHostSearchOpen(false)
    setHostSearchKeyword('')
  }, [])

  const handleClearHost = useCallback(() => {
    setFormData((prev) => ({ ...prev, host: null }))
  }, [])

  const validateForm = useCallback(() => {
    const newErrors = {
      name: validateName(formData.name),
      phone: validatePhone(formData.phone),
      idCard: validateIdCard(formData.idCard),
      reason: validateReason(formData.reason),
      host: validateHost(formData.host),
      photo: '',
    }
    setErrors(newErrors)
    setTouched({
      name: true, phone: true, idCard: true, reason: true, host: true,
    })
    return !Object.values(newErrors).every((e) => e === '')
  }, [formData])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!validateForm()) return

    const newRecord = createRegistrationRecord(formData)

    setRecords((prev) => [newRecord, ...prev])
    setRecentHosts((prev) => updateRecentHosts(prev, formData.host))

    setFormData(createFormInitialState())
    setErrors({ name: '', phone: '', idCard: '', reason: '', host: '', photo: '' })
    setTouched({ name: false, phone: false, idCard: false, reason: false, host: false })

    setShowSuccess(true)
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    successTimerRef.current = setTimeout(() => setShowSuccess(false), 3000)
  }, [formData, validateForm])

  const handleSingleCheckOut = useCallback((record) => {
    setCheckOutModal({ ...record, _checkOutTime: Date.now() })
  }, [])

  const confirmCheckOut = useCallback(() => {
    if (!checkOutModal) return
    setRecords((prev) =>
      prev.map((r) =>
        r.id === checkOutModal.id ? checkOutRecord(r) : r
      )
    )
    setCheckOutModal(null)
  }, [checkOutModal])

  const handleBatchCheckOut = useCallback(() => {
    if (selectedIds.length === 0) return
    setRecords((prev) => batchCheckOutRecords(prev, selectedIds))
    setSelectedIds([])
  }, [selectedIds])

  const toggleSelectId = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    const uncheckOutIds = pagination.items
      .filter((r) => !r.checkOutTime)
      .map((r) => r.id)
    const allSelected = uncheckOutIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !uncheckOutIds.includes(id)))
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...uncheckOutIds])])
    }
  }, [pagination.items, selectedIds])

  const handleFilterChange = useCallback((key, value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    }, key === 'keyword' ? 300 : 0)
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters({ keyword: '', status: 'all', startDate: '', endDate: '' })
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const handleExport = useCallback(() => {
    if (filteredRecords.length === 0) return
    const csv = exportRecordsToCsv(filteredRecords, now)
    const d = new Date(now)
    const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
    downloadCsv(csv, `访客登记记录_${ts}.csv`)
  }, [filteredRecords, now])

  const renderPagination = () => {
    const { total, totalPage, currentPage } = pagination
    return (
      <div className="vr-pagination">
        <div className="vr-pagination-info">
          <span>共 {total} 条</span>
          <span>共 {totalPage} 页</span>
          <label>
            每页
            <select
              className="vr-page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            条
          </label>
        </div>
        <div className="vr-pagination-controls">
          <button
            className="vr-page-btn"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            上一页
          </button>
          {Array.from({ length: totalPage }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPage <= 7) return true
              if (p === 1 || p === totalPage) return true
              if (Math.abs(p - currentPage) <= 2) return true
              return false
            })
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text)' }}>…</span>
              ) : (
                <button
                  key={p}
                  className={`vr-page-btn ${p === currentPage ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            )}
          <button
            className="vr-page-btn"
            disabled={currentPage === totalPage}
            onClick={() => setPage(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="vr-page">
      <div className="vr-header">
        <button className="vr-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="vr-title">访客登记系统</h1>
      </div>

      {showSuccess && (
        <div className="vr-success-banner">
          ✓ 登记成功，请等待审批
        </div>
      )}

      {overdueCount > 0 && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '20px',
          color: '#dc2626',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⚠ 当前有 {overdueCount} 位访客超时未签退，请关注
        </div>
      )}

      <div className="vr-section">
        <h2 className="vr-section-title">访客登记</h2>
        <form onSubmit={handleSubmit}>
          <div className="vr-form-grid">
            <div className="vr-form-item">
              <label className="vr-form-label">
                登记时间<span className="required">*</span>
              </label>
              <div className="vr-form-static">{formData.registerTime}</div>
            </div>

            <div className="vr-form-item">
              <label className="vr-form-label">
                访客姓名<span className="required">*</span>
              </label>
              <input
                type="text"
                className={`vr-form-input ${touched.name && errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name', validateName)}
                placeholder="请输入访客姓名"
              />
              <div className="vr-form-error">{errors.name}</div>
            </div>

            <div className="vr-form-item">
              <label className="vr-form-label">
                手机号<span className="required">*</span>
              </label>
              <input
                type="text"
                className={`vr-form-input ${touched.phone && errors.phone ? 'error' : ''}`}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone', validatePhone)}
                placeholder="请输入手机号"
                maxLength={11}
              />
              <div className="vr-form-error">{errors.phone}</div>
            </div>

            <div className="vr-form-item">
              <label className="vr-form-label">
                身份证号<span className="required">*</span>
              </label>
              <input
                type="text"
                className={`vr-form-input ${touched.idCard && errors.idCard ? 'error' : ''}`}
                value={formData.idCard}
                onChange={(e) => handleChange('idCard', e.target.value)}
                onBlur={() => handleBlur('idCard', validateIdCard)}
                placeholder="请输入18位身份证号"
                maxLength={18}
              />
              <div className="vr-form-error">{errors.idCard}</div>
            </div>

            <div className="vr-form-item full-width">
              <label className="vr-form-label">
                访问事由<span className="required">*</span>
              </label>
              <textarea
                className={`vr-form-textarea ${touched.reason && errors.reason ? 'error' : ''}`}
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                onBlur={() => handleBlur('reason', validateReason)}
                placeholder="请输入访问事由"
                maxLength={200}
              />
              <div className="vr-form-error">{errors.reason}</div>
            </div>

            <div className="vr-form-item full-width">
              <label className="vr-form-label">证件照片</label>
              {formData.photo ? (
                <div>
                  <div className="vr-upload-preview">
                    <img
                      src={formData.photo}
                      alt="证件照片"
                      onClick={() => setImageViewer(formData.photo)}
                    />
                  </div>
                  <div className="vr-upload-actions">
                    <button
                      type="button"
                      className="vr-btn vr-btn-secondary vr-btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      重新上传
                    </button>
                    <button
                      type="button"
                      className="vr-btn vr-btn-secondary vr-btn-sm"
                      onClick={handleRemovePhoto}
                    >
                      删除
                    </button>
                  </div>
                  <div className="vr-form-error">{errors.photo}</div>
                </div>
              ) : (
                <div
                  className={`vr-upload-area ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="vr-upload-icon">📷</div>
                  <div className="vr-upload-text">点击或拖拽上传证件照片</div>
                  <div className="vr-upload-hint">支持 JPG/PNG 格式，5MB 以内</div>
                  <div className="vr-form-error" style={{ marginTop: 8 }}>{errors.photo}</div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                  e.target.value = ''
                }}
              />
            </div>

            <div className="vr-form-item full-width" ref={hostSearchRef}>
              <label className="vr-form-label">
                被访人<span className="required">*</span>
              </label>
              {formData.host ? (
                <div>
                  <div className="vr-selected-host">
                    <HostAvatar name={formData.host.name} />
                    <div className="vr-selected-host-info">
                      <span className="vr-selected-host-name">{formData.host.name}</span>
                      <span className="vr-selected-host-meta">
                        {formData.host.department} · {formData.host.position} · 工号 {formData.host.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="vr-host-clear"
                      onClick={handleClearHost}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    className={`vr-form-input ${touched.host && errors.host ? 'error' : ''}`}
                    placeholder="搜索并选择被访人"
                    value={hostSearchKeyword}
                    onChange={(e) => {
                      setHostSearchKeyword(e.target.value)
                      setHostSearchOpen(true)
                    }}
                    onFocus={() => {
                      setTouched((prev) => ({ ...prev, host: true }))
                      setHostSearchOpen(true)
                    }}
                    onBlur={() => handleBlur('host', validateHost)}
                  />
                  {hostSearchOpen && filteredHosts.length > 0 && (
                    <div className="vr-host-dropdown">
                      {filteredHosts.map((host) => (
                        <div
                          key={host.id}
                          className="vr-host-option"
                          onMouseDown={() => handleSelectHost(host)}
                        >
                          <HostAvatar name={host.name} />
                          <div className="vr-host-info">
                            <span className="vr-host-name">{host.name}</span>
                            <span className="vr-host-dept">
                              {host.department} · {host.position}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {hostSearchOpen && filteredHosts.length === 0 && (
                    <div className="vr-host-dropdown">
                      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text)', fontSize: 13 }}>
                        未找到匹配的被访人
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="vr-form-error">{errors.host}</div>

              {recentHosts.length > 0 && (
                <div className="vr-recent-hosts">
                  <div className="vr-recent-label">最近被访：</div>
                  <div className="vr-recent-list">
                    {recentHosts.map((host) => (
                      <div
                        key={host.id}
                        className="vr-recent-chip"
                        onClick={() => handleSelectHost(host)}
                      >
                        <HostAvatar name={host.name} size={20} />
                        <span>{host.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="vr-form-actions">
              <button type="submit" className="vr-btn vr-btn-primary">
                提交登记
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="vr-section">
        <div className="vr-toolbar">
          <h2 className="vr-section-title" style={{ margin: 0 }}>登记记录</h2>
          <div className="vr-toolbar-right">
            <button
              type="button"
              className="vr-btn vr-btn-primary vr-btn-sm"
              onClick={handleBatchCheckOut}
              disabled={selectedIds.length === 0}
              title={selectedIds.length === 0 ? '请先选择要签退的记录' : '批量签退'}
            >
              批量签退 {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </button>
            <button
              type="button"
              className="vr-btn vr-btn-secondary vr-btn-sm"
              onClick={handleExport}
              disabled={filteredRecords.length === 0}
              title={filteredRecords.length === 0 ? '当前筛选条件下无数据可导出' : '导出 CSV'}
            >
              导出 CSV
            </button>
          </div>
        </div>

        <div className="vr-filter-bar">
          <div className="vr-filter-group">
            <span className="vr-filter-label">姓名/手机号</span>
            <input
              className="vr-form-input"
              type="text"
              placeholder="搜索..."
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
            />
          </div>
          <div className="vr-filter-group">
            <span className="vr-filter-label">状态</span>
            <select
              className="vr-form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="vr-filter-group">
            <span className="vr-filter-label">起始日期</span>
            <input
              className="vr-form-input"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="vr-filter-group">
            <span className="vr-filter-label">结束日期</span>
            <input
              className="vr-form-input"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <span className="vr-filter-count">匹配 {filteredRecords.length} 条</span>
        </div>
        <div>
          <button className="vr-btn vr-btn-secondary vr-btn-sm" onClick={handleResetFilters}>
            重置筛选
          </button>
        </div>

        <div className="vr-table-wrapper">
          <table className="vr-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={(() => {
                      const uncheckOutIds = pagination.items
                        .filter((r) => !r.checkOutTime)
                        .map((r) => r.id)
                      return uncheckOutIds.length > 0 && uncheckOutIds.every((id) => selectedIds.includes(id))
                    })()}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>姓名</th>
                <th>手机号</th>
                <th>身份证</th>
                <th>访问事由</th>
                <th>被访人</th>
                <th>登记时间</th>
                <th>签退时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagination.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="vr-empty">暂无登记记录</td>
                </tr>
              ) : (
                pagination.items.map((record) => {
                  const status = getVisitorStatus(record, now)
                  const isOverdue = status === VISITOR_STATUS.OVERDUE
                  return (
                    <tr key={record.id} className={isOverdue ? 'overdue-row' : ''}>
                      <td>
                        {!record.checkOutTime && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelectId(record.id)}
                          />
                        )}
                      </td>
                      <td>{record.name}</td>
                      <td>{maskPhone(record.phone)}</td>
                      <td>{maskIdCard(record.idCard)}</td>
                      <td
                        style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={record.reason}
                      >
                        {record.reason}
                      </td>
                      <td>{record.host?.name || '-'}</td>
                      <td>{formatDateTime(record.registerTime)}</td>
                      <td>{formatDateTime(record.checkOutTime) || '-'}</td>
                      <td>
                        <span className={`vr-status-tag ${status}`}>
                          {VISITOR_STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td>
                        {!record.checkOutTime && (
                          <button
                            type="button"
                            className={`vr-action-btn ${isOverdue ? 'danger' : ''}`}
                            onClick={() => handleSingleCheckOut(record)}
                          >
                            签退
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>

      {imageViewer && (
        <div className="vr-image-modal" onClick={() => setImageViewer(null)}>
          <img src={imageViewer} alt="预览" />
        </div>
      )}

      {checkOutModal && (
        <div
          className="vr-modal-backdrop"
          onClick={() => setCheckOutModal(null)}
        >
          <div className="vr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vr-modal-header">
              <h2 className="vr-modal-title">确认签退</h2>
              <button
                type="button"
                className="vr-modal-close"
                onClick={() => setCheckOutModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="vr-modal-body">
              <div className="vr-modal-info">
                <div className="vr-modal-info-row">
                  <span className="vr-modal-info-label">访客姓名</span>
                  <span className="vr-modal-info-value">{checkOutModal.name}</span>
                </div>
                <div className="vr-modal-info-row">
                  <span className="vr-modal-info-label">登记时间</span>
                  <span className="vr-modal-info-value">
                    {formatDateTime(checkOutModal.registerTime)}
                  </span>
                </div>
                <div className="vr-modal-info-row">
                  <span className="vr-modal-info-label">签退时间</span>
                  <span className="vr-modal-info-value">
                    {checkOutModal && formatDateTime(checkOutModal._checkOutTime)}
                  </span>
                </div>
              </div>
            </div>
            <div className="vr-modal-footer">
              <button
                type="button"
                className="vr-btn vr-btn-secondary"
                onClick={() => setCheckOutModal(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="vr-btn vr-btn-primary"
                onClick={confirmCheckOut}
              >
                确认签退
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitorRegistrationPage
