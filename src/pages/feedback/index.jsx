import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

import {
  FEEDBACK_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  FEEDBACK_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
  PAGE_SIZE,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  TREND_DAYS,
} from './constants.js'

import {
  loadFeedbacks,
  saveFeedbacks,
  createFeedback,
  transitionStatus,
  setRating,
  getFilteredAndPaginatedList,
  getOverviewStats,
  getCategoryTrendData,
  formatDate,
  validateAttachment,
  validateAttachmentCount,
  validateTitle,
  validateDescription,
  isValidCategory,
} from './utils.js'

import './feedback.css'

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function FeedbackForm({ onSubmit }) {
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState([])
  const [errors, setErrors] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const resetForm = useCallback(() => {
    setCategory('')
    setTitle('')
    setDescription('')
    setAttachments([])
    setErrors({})
  }, [])

  const handleFiles = useCallback(async (files) => {
    const fileList = Array.from(files)
    const newAttachments = [...attachments]
    const newErrors = { ...errors }

    for (const file of fileList) {
      const validation = validateAttachment(file, newAttachments.length)
      if (!validation.valid) {
        Object.assign(newErrors, validation.errors)
        continue
      }
      try {
        const dataUrl = await readFileAsDataURL(file)
        newAttachments.push({
          id: 'att_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        })
      } catch {
        newErrors.file = '文件读取失败'
      }
    }

    setAttachments(newAttachments)
    setErrors(newErrors)
  }, [attachments, errors])

  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
      e.target.value = ''
    }
  }, [handleFiles])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeAttachment = useCallback((id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const newErrors = {}
    if (!isValidCategory(category)) {
      newErrors.category = '请选择反馈分类'
    }
    if (!validateTitle(title)) {
      newErrors.title = `标题不能为空且不超过 ${MAX_TITLE_LENGTH} 字`
    }
    if (!validateDescription(description)) {
      newErrors.description = `描述不能为空且不超过 ${MAX_DESCRIPTION_LENGTH} 字`
    }
    if (!validateAttachmentCount(attachments.length)) {
      newErrors.attachments = `附件数量不能超过 ${MAX_ATTACHMENTS} 张`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    const result = onSubmit({
      category,
      title,
      description,
      attachments: attachments.map(({ id, name, type, dataUrl }) => ({ id, name, type, dataUrl })),
    })

    setIsSubmitting(false)

    if (result && result.success) {
      resetForm()
    } else if (result && result.errors) {
      setErrors(result.errors)
    }
  }, [category, title, description, attachments, onSubmit, resetForm])

  const canUploadMore = attachments.length < MAX_ATTACHMENTS

  return (
    <section className="fb-section">
      <h2 className="fb-section-title">提交反馈</h2>
      <form onSubmit={handleSubmit}>
        <div className="fb-form-grid">
          <div className="fb-form-group">
            <label className="fb-label">
              反馈分类<span className="required">*</span>
            </label>
            <select
              className="fb-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">请选择分类</option>
              {Object.values(FEEDBACK_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            {errors.category && <span className="fb-error-text">{errors.category}</span>}
          </div>

          <div className="fb-form-group">
            <label className="fb-label">
              标题<span className="required">*</span>
              <span className="fb-hint" style={{ marginLeft: 8 }}>
                ({title.length}/{MAX_TITLE_LENGTH})
              </span>
            </label>
            <input
              type="text"
              className="fb-input"
              placeholder="请简要描述问题或建议"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
              maxLength={MAX_TITLE_LENGTH}
            />
            {errors.title && <span className="fb-error-text">{errors.title}</span>}
          </div>

          <div className="fb-form-group full-width">
            <label className="fb-label">
              详细描述<span className="required">*</span>
              <span className="fb-hint" style={{ marginLeft: 8 }}>
                ({description.length}/{MAX_DESCRIPTION_LENGTH})
              </span>
            </label>
            <textarea
              className="fb-textarea"
              placeholder="请详细描述您遇到的问题或建议，包括复现步骤、期望结果等..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            {errors.description && <span className="fb-error-text">{errors.description}</span>}
          </div>

          <div className="fb-form-group full-width">
            <label className="fb-label">
              附件上传
              <span className="fb-hint" style={{ marginLeft: 8 }}>
                支持 JPG/PNG/GIF/WebP 格式，最多 {MAX_ATTACHMENTS} 张，单张不超过 {MAX_ATTACHMENT_SIZE / 1024 / 1024}MB
              </span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            {canUploadMore && (
              <div
                className={`fb-upload-area ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="fb-upload-icon">📁</div>
                <div className="fb-upload-text">点击上传或拖拽图片到此处</div>
                <div className="fb-upload-hint">
                  已上传 {attachments.length}/{MAX_ATTACHMENTS} 张
                </div>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="fb-attachment-list">
                {attachments.map((att) => (
                  <div key={att.id} className="fb-attachment-item">
                    <img src={att.dataUrl} alt={att.name} />
                    <button
                      type="button"
                      className="fb-attachment-remove"
                      onClick={() => removeAttachment(att.id)}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.type && <span className="fb-error-text">{errors.type}</span>}
            {errors.size && <span className="fb-error-text">{errors.size}</span>}
            {errors.count && <span className="fb-error-text">{errors.count}</span>}
          </div>
        </div>

        <div className="fb-form-actions">
          <button
            type="button"
            className="fb-btn fb-btn-secondary"
            onClick={resetForm}
          >
            重置
          </button>
          <button
            type="submit"
            className="fb-btn fb-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交反馈'}
          </button>
        </div>
      </form>
    </section>
  )
}

function StarRating({ rating, onRate, interactive = true, size = 'normal' }) {
  const [hover, setHover] = useState(0)
  const displayValue = hover || rating || 0

  return (
    <div className="fb-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`fb-star ${interactive ? 'interactive' : ''} ${star <= displayValue ? 'active' : ''}`}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          style={size === 'small' ? { fontSize: '16px' } : {}}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function FeedbackCard({ feedback, onTransition, onRate, expanded, onToggleExpand }) {
  const handleTransition = () => {
    onTransition(feedback.id)
  }

  const handleRate = (rating) => {
    onRate(feedback.id, rating)
  }

  const canTransition = feedback.status !== FEEDBACK_STATUS.RESOLVED
  const transitionLabel =
    feedback.status === FEEDBACK_STATUS.SUBMITTED ? '开始处理' :
    feedback.status === FEEDBACK_STATUS.PROCESSING ? '标记解决' : ''

  return (
    <div className="fb-card">
      <div className="fb-card-header">
        <div className="fb-card-tags">
          <span
            className="fb-tag"
            style={{ backgroundColor: `${CATEGORY_COLORS[feedback.category]}15`, color: CATEGORY_COLORS[feedback.category] }}
          >
            {CATEGORY_LABELS[feedback.category]}
          </span>
          <span
            className="fb-tag"
            style={{ backgroundColor: `${STATUS_COLORS[feedback.status]}15`, color: STATUS_COLORS[feedback.status] }}
          >
            {STATUS_LABELS[feedback.status]}
          </span>
        </div>
        <button
          className="fb-card-details-toggle"
          onClick={() => onToggleExpand(feedback.id)}
        >
          {expanded ? '收起详情 ▲' : '查看详情 ▼'}
        </button>
      </div>

      <h3 className="fb-card-title">{feedback.title}</h3>

      <div className="fb-card-meta">
        <span>提交时间：{formatDate(feedback.createdAt)}</span>
        {feedback.statusTimeline && feedback.statusTimeline.length > 0 && (
          <span>状态变更 {feedback.statusTimeline.length} 次</span>
        )}
      </div>

      {!expanded && (
        <p className="fb-card-description">{feedback.description}</p>
      )}

      {expanded && (
        <div className="fb-card-details">
          <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {feedback.description}
          </p>
          {feedback.attachments && feedback.attachments.length > 0 && (
            <div className="fb-card-attachments">
              {feedback.attachments.map((att) => (
                <img
                  key={att.id}
                  src={att.dataUrl}
                  alt={att.name}
                  title={att.name}
                  onClick={() => window.open(att.dataUrl, '_blank')}
                />
              ))}
            </div>
          )}
          {feedback.statusTimeline && feedback.statusTimeline.length > 0 && (
            <div className="fb-timeline">
              <div className="fb-timeline-title">状态流转时间线</div>
              <div className="fb-timeline-list">
                {feedback.statusTimeline.map((item, idx) => (
                  <div key={idx} className="fb-timeline-item">
                    <span
                      className="fb-timeline-dot"
                      style={{ backgroundColor: STATUS_COLORS[item.status] }}
                    />
                    <span>
                      {STATUS_LABELS[item.status]} - {formatDate(item.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fb-card-footer">
        <div>
          {feedback.status === FEEDBACK_STATUS.RESOLVED && (
            <div className="fb-rating-display">
              <span>满意度：</span>
              {typeof feedback.rating === 'number' ? (
                <>
                  <StarRating rating={feedback.rating} interactive={false} size="small" />
                  <span className="fb-rating-score">{feedback.rating.toFixed(1)} 分</span>
                </>
              ) : (
                <StarRating rating={0} onRate={handleRate} interactive={true} />
              )}
            </div>
          )}
        </div>
        <div className="fb-card-actions">
          {canTransition && (
            <button
              className={`fb-btn fb-btn-sm ${feedback.status === FEEDBACK_STATUS.SUBMITTED ? 'fb-btn-secondary' : 'fb-btn-success'}`}
              onClick={handleTransition}
            >
              {transitionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Pagination({ pagination, onChange }) {
  const { currentPage, totalPage, total } = pagination
  const pages = []

  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPage, startPage + 4)
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="fb-pagination">
      <div className="fb-pagination-info">
        共 {total} 条，第 {currentPage} / {totalPage} 页
      </div>
      <div className="fb-pagination-buttons">
        <button
          className="fb-page-btn"
          onClick={() => onChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          上一页
        </button>
        {pages.map((page) => (
          <button
            key={page}
            className={`fb-page-btn ${page === currentPage ? 'active' : ''}`}
            onClick={() => onChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="fb-page-btn"
          onClick={() => onChange(currentPage + 1)}
          disabled={currentPage >= totalPage}
        >
          下一页
        </button>
      </div>
    </div>
  )
}

function TrendChart({ trendData, categories, colors }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 })

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 40
        setDimensions({ width: Math.max(w, 400), height: 320 })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = dimensions
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const padding = { top: 30, right: 20, bottom: 50, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    const days = trendData.map((d) => d.date)
    const catKeys = categories

    let maxValue = 1
    trendData.forEach((d) => {
      catKeys.forEach((k) => {
        if (d[k] > maxValue) maxValue = d[k]
      })
    })
    maxValue = Math.max(maxValue, 2)

    ctx.font = '11px -apple-system, sans-serif'
    ctx.fillStyle = '#9ca3af'
    ctx.strokeStyle = '#f3f4f6'
    ctx.lineWidth = 1

    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
      const value = Math.round(maxValue - (maxValue / gridLines) * i)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(value), padding.left - 8, y)
    }

    const barGroupWidth = chartWidth / days.length
    const barPadding = 6
    const barWidth = (barGroupWidth - barPadding * 2 - (catKeys.length - 1) * 2) / catKeys.length

    days.forEach((day, dayIdx) => {
      const groupX = padding.left + dayIdx * barGroupWidth + barPadding
      catKeys.forEach((cat, catIdx) => {
        const value = trendData[dayIdx][cat] || 0
        const barHeight = (value / maxValue) * chartHeight
        const x = groupX + catIdx * (barWidth + 2)
        const y = padding.top + chartHeight - barHeight

        ctx.fillStyle = colors[cat] + 'cc'
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, 2)
        ctx.fill()

        if (value > 0) {
          ctx.fillStyle = colors[cat]
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(String(value), x + barWidth / 2, y - 3)
        }
      })

      const label = day.slice(5)
      ctx.fillStyle = '#6b7280'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(label, padding.left + dayIdx * barGroupWidth + barGroupWidth / 2, padding.top + chartHeight + 10)
    })

    ctx.fillStyle = '#6b7280'
    ctx.textAlign = 'left'
    ctx.font = '12px -apple-system, sans-serif'
    ctx.fillText(`最近 ${TREND_DAYS} 天反馈趋势`, padding.left, 16)
  }, [trendData, categories, colors, dimensions])

  return (
    <div ref={containerRef} className="fb-chart-canvas-container">
      <canvas ref={canvasRef} />
      <div className="fb-chart-legend">
        {categories.map((cat) => (
          <div key={cat} className="fb-legend-item">
            <span className="fb-legend-dot" style={{ backgroundColor: colors[cat] }} />
            <span>{CATEGORY_LABELS[cat]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState(() => loadFeedbacks())
  const [keyword, setKeyword] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [chartFilterCategory, setChartFilterCategory] = useState('all')
  const [chartFilterStatus, setChartFilterStatus] = useState('all')
  const [expandedIds, setExpandedIds] = useState(new Set())

  useEffect(() => {
    saveFeedbacks(feedbacks)
  }, [feedbacks])

  const handleSubmit = useCallback((data) => {
    const result = createFeedback(feedbacks, data)
    if (result.success) {
      setFeedbacks(result.feedbacks)
      setPage(1)
    }
    return result
  }, [feedbacks])

  const handleTransition = useCallback((id) => {
    const result = transitionStatus(feedbacks, id)
    if (result.success) {
      setFeedbacks(result.feedbacks)
    }
  }, [feedbacks])

  const handleRate = useCallback((id, rating) => {
    const result = setRating(feedbacks, id, rating)
    if (result.success) {
      setFeedbacks(result.feedbacks)
    }
  }, [feedbacks])

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const pagination = useMemo(
    () =>
      getFilteredAndPaginatedList(feedbacks, {
        keyword,
        category: filterCategory,
        status: filterStatus,
        page,
        pageSize: PAGE_SIZE,
      }),
    [feedbacks, keyword, filterCategory, filterStatus, page]
  )

  const overview = useMemo(() => getOverviewStats(feedbacks), [feedbacks])

  const trendCategories = useMemo(() => {
    if (chartFilterCategory === 'all') {
      return Object.values(FEEDBACK_CATEGORIES)
    }
    return [chartFilterCategory]
  }, [chartFilterCategory])

  const trendData = useMemo(
    () => getCategoryTrendData(feedbacks, chartFilterCategory, chartFilterStatus),
    [feedbacks, chartFilterCategory, chartFilterStatus]
  )

  return (
    <div className="fb-container">
      <div className="fb-header">
        <h1 className="fb-title">用户反馈收集系统</h1>
        <p className="fb-subtitle">提交反馈、跟踪处理进度、统计分析一站式管理</p>
      </div>

      <FeedbackForm onSubmit={handleSubmit} />

      <section className="fb-section">
        <h2 className="fb-section-title">反馈列表</h2>
        <div className="fb-filter-bar">
          <div className="fb-form-group">
            <label className="fb-label">关键词搜索</label>
            <input
              type="text"
              className="fb-input"
              placeholder="搜索标题或描述..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="fb-form-group">
            <label className="fb-label">分类筛选</label>
            <select
              className="fb-select"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">全部分类</option>
              {Object.values(FEEDBACK_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <div className="fb-form-group">
            <label className="fb-label">状态筛选</label>
            <select
              className="fb-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">全部状态</option>
              {Object.values(FEEDBACK_STATUS).map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </div>
          <div className="fb-form-group">
            <label className="fb-label">每页数量</label>
            <select className="fb-select" disabled value={PAGE_SIZE}>
              <option value={PAGE_SIZE}>{PAGE_SIZE} 条 / 页</option>
            </select>
          </div>
        </div>

        {pagination.items.length === 0 ? (
          <div className="fb-empty">
            <div className="fb-empty-icon">📋</div>
            <div className="fb-empty-text">暂无符合条件的反馈记录</div>
          </div>
        ) : (
          <div className="fb-card-list">
            {pagination.items.map((fb) => (
              <FeedbackCard
                key={fb.id}
                feedback={fb}
                onTransition={handleTransition}
                onRate={handleRate}
                expanded={expandedIds.has(fb.id)}
                onToggleExpand={toggleExpand}
              />
            ))}
          </div>
        )}

        {pagination.total > 0 && (
          <Pagination
            pagination={pagination}
            onChange={(p) => setPage(p)}
          />
        )}
      </section>

      <section className="fb-section">
        <h2 className="fb-section-title">数据统计与趋势</h2>
        <div className="fb-stats-grid">
          <div className="fb-stat-card">
            <div className="fb-stat-value total">{overview.total}</div>
            <div className="fb-stat-label">总反馈数</div>
          </div>
          <div className="fb-stat-card">
            <div className="fb-stat-value pending">{overview.pending}</div>
            <div className="fb-stat-label">待处理数</div>
          </div>
          <div className="fb-stat-card">
            <div className="fb-stat-value resolved">{overview.resolved}</div>
            <div className="fb-stat-label">已解决数</div>
          </div>
          <div className="fb-stat-card">
            <div className="fb-stat-value rating">{overview.averageRating > 0 ? overview.averageRating.toFixed(1) : '-'}</div>
            <div className="fb-stat-label">平均满意度</div>
          </div>
        </div>

        <div className="fb-chart-section">
          <div>
            <div className="fb-chart-filters">
              <div className="fb-form-group" style={{ minWidth: 160 }}>
                <label className="fb-label">按分类</label>
                <select
                  className="fb-select"
                  value={chartFilterCategory}
                  onChange={(e) => setChartFilterCategory(e.target.value)}
                >
                  <option value="all">全部分类</option>
                  {Object.values(FEEDBACK_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fb-form-group" style={{ minWidth: 160 }}>
                <label className="fb-label">按状态</label>
                <select
                  className="fb-select"
                  value={chartFilterStatus}
                  onChange={(e) => setChartFilterStatus(e.target.value)}
                >
                  <option value="all">全部状态</option>
                  {Object.values(FEEDBACK_STATUS).map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <TrendChart
              trendData={trendData}
              categories={trendCategories}
              colors={CATEGORY_COLORS}
            />
          </div>
          <div className="fb-overview-panel">
            <h3 className="fb-overview-title">分类分布</h3>
            {Object.values(FEEDBACK_CATEGORIES).map((cat) => {
              const count = feedbacks.filter((f) => f.category === cat).length
              return (
                <div key={cat} className="fb-overview-item">
                  <span className="fb-overview-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: CATEGORY_COLORS[cat],
                      }}
                    />
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="fb-overview-value">{count}</span>
                </div>
              )
            })}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
              <h3 className="fb-overview-title">处理率</h3>
              <div className="fb-overview-item">
                <span className="fb-overview-label">总反馈数</span>
                <span className="fb-overview-value">{overview.total}</span>
              </div>
              <div className="fb-overview-item">
                <span className="fb-overview-label">解决率</span>
                <span className="fb-overview-value">
                  {overview.total > 0 ? Math.round((overview.resolved / overview.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
