import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './product-review.css'
import {
  SORT_OPTIONS,
  FILTER_RATINGS,
  PAGE_SIZE,
  MAX_IMAGES,
  CURRENT_USER,
} from './constants'
import {
  loadReviews,
  saveReviews,
  loadVotes,
  saveVotes,
  createReview,
  calculateRatingStats,
  getReviewList,
  hasUserVoted,
  getUserVote,
  castVote,
  addFollowUp,
  addMerchantReply,
  fileToDataURL,
  formatDate,
  formatRatingOneDecimal,
} from './utils'

function StarRating({ value, onChange, hoverValue, onHover, readonly = false, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5]
  const displayValue = hoverValue !== undefined ? hoverValue : value
  return (
    <div className={`star-rating star-rating-${size}`}>
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= displayValue ? 'active' : ''} ${readonly ? 'readonly' : ''}`}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && onHover && onHover(star)}
          onMouseLeave={() => !readonly && onHover && onHover(undefined)}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function ImageLightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  if (currentIndex === undefined || currentIndex === null) return null
  const img = images[currentIndex]
  if (!img) return null
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>×</button>
        {images.length > 1 && (
          <>
            <button className="lightbox-prev" onClick={onPrev}>‹</button>
            <button className="lightbox-next" onClick={onNext}>›</button>
          </>
        )}
        <img src={img} alt="预览" className="lightbox-image" />
        <div className="lightbox-counter">{currentIndex + 1} / {images.length}</div>
      </div>
    </div>
  )
}

function ReviewImageGrid({ images, onImageClick }) {
  if (!images || images.length === 0) return null
  return (
    <div className={`review-images review-images-${images.length}`}>
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`评价图片${idx + 1}`}
          className="review-thumb"
          onClick={() => onImageClick(idx)}
        />
      ))}
    </div>
  )
}

export default function ProductReviewPage() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState(() => loadReviews())
  const [votes, setVotes] = useState(() => loadVotes())

  const [filterRating, setFilterRating] = useState(FILTER_RATINGS.ALL)
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.NEWEST)
  const [page, setPage] = useState(1)
  const prevFilterRef = useRef(FILTER_RATINGS.ALL)
  const prevSortRef = useRef(SORT_OPTIONS.NEWEST)

  const [isMerchant, setIsMerchant] = useState(false)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(undefined)
  const [content, setContent] = useState('')
  const [previewImages, setPreviewImages] = useState([])
  const [formErrors, setFormErrors] = useState({})
  const fileInputRef = useRef(null)

  const [expandedFollows, setExpandedFollows] = useState({})
  const [followContents, setFollowContents] = useState({})
  const [expandedMerchant, setExpandedMerchant] = useState({})
  const [merchantContents, setMerchantContents] = useState({})

  const [lightboxImages, setLightboxImages] = useState([])
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const handleReviewsUpdate = (next) => {
    setReviews(next)
    queueMicrotask(() => saveReviews(next))
  }

  const handleVotesUpdate = (next) => {
    setVotes(next)
    queueMicrotask(() => saveVotes(next))
  }

  const handleFilterChange = (value) => {
    setFilterRating(value)
    if (value !== prevFilterRef.current) {
      prevFilterRef.current = value
      setPage(1)
    }
  }

  const handleSortChange = (value) => {
    setSortOption(value)
    if (value !== prevSortRef.current) {
      prevSortRef.current = value
      setPage(1)
    }
  }

  const stats = useMemo(() => calculateRatingStats(reviews), [reviews])

  const pagination = useMemo(
    () =>
      getReviewList(reviews, {
        rating: filterRating,
        sort: sortOption,
        page,
        pageSize: PAGE_SIZE,
      }),
    [reviews, filterRating, sortOption, page]
  )

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    const remaining = MAX_IMAGES - previewImages.length
    const toProcess = files.slice(0, remaining)
    const results = []
    for (const file of toProcess) {
      try {
        const dataUrl = await fileToDataURL(file)
        results.push(dataUrl)
      } catch {}
    }
    setPreviewImages((prev) => [...prev, ...results])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (idx) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmitReview = () => {
    const result = createReview(reviews, {
      rating,
      content,
      images: previewImages,
    })
    if (!result.success) {
      setFormErrors(result.errors)
      return
    }
    handleReviewsUpdate(result.reviews)
    setRating(0)
    setHoverRating(undefined)
    setContent('')
    setPreviewImages([])
    setFormErrors({})
    setPage(1)
  }

  const handleVote = (reviewId, voteType) => {
    if (hasUserVoted(votes, CURRENT_USER, reviewId)) {
      return
    }
    const result = castVote(reviews, votes, CURRENT_USER, reviewId, voteType)
    if (result.success) {
      handleReviewsUpdate(result.reviews)
      handleVotesUpdate(result.votes)
    }
  }

  const toggleFollowUp = (reviewId) => {
    setExpandedFollows((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const handleFollowUpContentChange = (reviewId, value) => {
    setFollowContents((prev) => ({
      ...prev,
      [reviewId]: value,
    }))
  }

  const handleSubmitFollowUp = (reviewId) => {
    const text = followContents[reviewId] || ''
    const result = addFollowUp(reviews, reviewId, text)
    if (result.success) {
      handleReviewsUpdate(result.reviews)
      setFollowContents((prev) => ({
        ...prev,
        [reviewId]: '',
      }))
    }
  }

  const toggleMerchantReply = (reviewId) => {
    setExpandedMerchant((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const handleMerchantContentChange = (reviewId, value) => {
    setMerchantContents((prev) => ({
      ...prev,
      [reviewId]: value,
    }))
  }

  const handleSubmitMerchantReply = (reviewId) => {
    const text = merchantContents[reviewId] || ''
    const result = addMerchantReply(reviews, reviewId, text)
    if (result.success) {
      handleReviewsUpdate(result.reviews)
      setMerchantContents((prev) => ({
        ...prev,
        [reviewId]: '',
      }))
    }
  }

  const openLightbox = (images, idx) => {
    setLightboxImages(images)
    setLightboxIndex(idx)
  }

  const closeLightbox = () => {
    setLightboxImages([])
    setLightboxIndex(null)
  }

  const lightboxPrev = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length)
  }

  const lightboxNext = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % lightboxImages.length)
  }

  const renderPagination = () => {
    const { total, totalPage, currentPage } = pagination
    const pages = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPage, start + 4)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return (
      <div className="pagination">
        <div className="pagination-info">
          共 {total} 条评价，每页 {PAGE_SIZE} 条
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            上一页
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`page-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
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
    <div className="product-review-page">
      <div className="page-header">
        <button className="btn btn-back" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="page-title">商品评价评分系统</h1>
        <div className="role-switch">
          <label className="switch-label">
            <input
              type="checkbox"
              checked={isMerchant}
              onChange={(e) => setIsMerchant(e.target.checked)}
            />
            <span>商家身份</span>
          </label>
        </div>
      </div>

      <div className="stats-section card">
        <div className="stats-main">
          <div className="avg-score">{formatRatingOneDecimal(stats.average)}</div>
          <div className="avg-stars">
            <StarRating value={Math.round(stats.average)} readonly size="lg" />
          </div>
          <div className="total-count">共 {stats.total} 条评价</div>
        </div>
        <div className="stats-distribution">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="dist-row">
              <span className="dist-star">{star}星</span>
              <div className="dist-bar-bg">
                <div
                  className="dist-bar-fill"
                  style={{ width: `${stats.percentages[star]}%` }}
                />
              </div>
              <span className="dist-percent">{stats.percentages[star]}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section card">
        <h2 className="section-title">发表评价</h2>
        <div className="form-row">
          <label className="form-label">评分</label>
          <StarRating
            value={rating}
            onChange={setRating}
            hoverValue={hoverRating}
            onHover={setHoverRating}
            size="lg"
          />
          {formErrors.rating && <div className="form-error">{formErrors.rating}</div>}
        </div>
        <div className="form-row">
          <label className="form-label">评价内容</label>
          <textarea
            className="form-input form-textarea"
            rows={4}
            placeholder="请输入您的评价..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="char-count">{content.length}/500</div>
          {formErrors.content && <div className="form-error">{formErrors.content}</div>}
        </div>
        <div className="form-row">
          <label className="form-label">图片（最多 {MAX_IMAGES} 张）</label>
          <div className="image-upload-area">
            {previewImages.map((img, idx) => (
              <div key={idx} className="image-preview-wrap">
                <img src={img} alt={`预览${idx + 1}`} className="image-preview" />
                <button
                  className="btn-remove-image"
                  onClick={() => handleRemoveImage(idx)}
                >
                  删除
                </button>
              </div>
            ))}
            {previewImages.length < MAX_IMAGES && (
              <label className="image-upload-label">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <div className="image-upload-placeholder">
                  <span className="upload-icon">+</span>
                  <span>上传图片</span>
                </div>
              </label>
            )}
          </div>
          {formErrors.images && <div className="form-error">{formErrors.images}</div>}
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSubmitReview}>
            提交评价
          </button>
        </div>
      </div>

      <div className="filter-section card">
        <div className="filter-row">
          <span className="filter-label">评分筛选：</span>
          <div className="filter-buttons">
            {[
              { key: FILTER_RATINGS.ALL, label: '全部' },
              { key: FILTER_RATINGS.FIVE, label: '5星' },
              { key: FILTER_RATINGS.FOUR, label: '4星' },
              { key: FILTER_RATINGS.THREE, label: '3星' },
              { key: FILTER_RATINGS.TWO, label: '2星' },
              { key: FILTER_RATINGS.ONE, label: '1星' },
            ].map((item) => (
              <button
                key={String(item.key)}
                className={`filter-btn ${filterRating === item.key ? 'active' : ''}`}
                onClick={() => handleFilterChange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-row">
          <span className="filter-label">排序方式：</span>
          <select
            className="inline-select"
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value={SORT_OPTIONS.NEWEST}>最新</option>
            <option value={SORT_OPTIONS.OLDEST}>最早</option>
            <option value={SORT_OPTIONS.MOST_USEFUL}>有用数</option>
          </select>
        </div>
      </div>

      <div className="review-list">
        {pagination.items.length === 0 ? (
          <div className="card empty-state">暂无评价</div>
        ) : (
          pagination.items.map((review) => {
            const userVote = getUserVote(votes, CURRENT_USER, review.id)
            const isOwner = review.userId === CURRENT_USER
            const isFollowExpanded = expandedFollows[review.id]
            const isMerchantExpanded = expandedMerchant[review.id]
            return (
              <div key={review.id} className="review-card card">
                <div className="review-header">
                  <div className="review-user">
                    <div className="avatar">{review.username.charAt(0)}</div>
                    <div className="user-info">
                      <div className="username">{review.username}</div>
                      <div className="review-meta">
                        <StarRating value={review.rating} readonly size="sm" />
                        <span className="review-time">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="review-content">{review.content}</div>
                {review.images && review.images.length > 0 && (
                  <ReviewImageGrid
                    images={review.images}
                    onImageClick={(idx) => openLightbox(review.images, idx)}
                  />
                )}
                {review.followUps && review.followUps.length > 0 && (
                  <div className="follow-ups">
                    {review.followUps.map((fu) => (
                      <div key={fu.id} className="follow-up-item">
                        <span className="follow-up-tag">追评</span>
                        <span className="follow-up-content">{fu.content}</span>
                        <span className="follow-up-time">{formatDate(fu.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {review.merchantReply && (
                  <div className="merchant-reply">
                    <span className="merchant-tag">商家回复：</span>
                    <span className="merchant-content">{review.merchantReply.content}</span>
                    <span className="merchant-time">{formatDate(review.merchantReply.createdAt)}</span>
                  </div>
                )}
                <div className="review-actions">
                  <button
                    className={`vote-btn ${userVote === 'useful' ? 'voted' : ''}`}
                    disabled={userVote !== null}
                    onClick={() => handleVote(review.id, 'useful')}
                  >
                    👍 有用 ({review.usefulCount})
                  </button>
                  <button
                    className={`vote-btn ${userVote === 'useless' ? 'voted' : ''}`}
                    disabled={userVote !== null}
                    onClick={() => handleVote(review.id, 'useless')}
                  >
                    👎 无用 ({review.uselessCount})
                  </button>
                  {isOwner && (
                    <button className="action-btn" onClick={() => toggleFollowUp(review.id)}>
                      {isFollowExpanded ? '收起追评' : '追加评价'}
                    </button>
                  )}
                  {isMerchant && (
                    <button className="action-btn" onClick={() => toggleMerchantReply(review.id)}>
                      {isMerchantExpanded ? '收起回复' : '商家回复'}
                    </button>
                  )}
                </div>
                {isFollowExpanded && (
                  <div className="follow-up-input">
                    <textarea
                      className="form-input form-textarea"
                      rows={3}
                      placeholder="写下您的追评..."
                      value={followContents[review.id] || ''}
                      onChange={(e) => handleFollowUpContentChange(review.id, e.target.value)}
                    />
                    <div className="form-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleSubmitFollowUp(review.id)}>
                        提交追评
                      </button>
                    </div>
                  </div>
                )}
                {isMerchantExpanded && (
                  <div className="merchant-reply-input">
                    <textarea
                      className="form-input form-textarea"
                      rows={3}
                      placeholder="以商家身份回复..."
                      value={merchantContents[review.id] || ''}
                      onChange={(e) => handleMerchantContentChange(review.id, e.target.value)}
                    />
                    <div className="form-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleSubmitMerchantReply(review.id)}>
                        提交回复
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {pagination.totalPage > 1 && renderPagination()}

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onClose={closeLightbox}
        onPrev={lightboxPrev}
        onNext={lightboxNext}
      />
    </div>
  )
}
