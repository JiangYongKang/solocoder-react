import { filterTemplates, isFavorite, getRating } from './resumeTemplatesCore'

function StarRating({ rating, onRate, readonly = false }) {
  const stars = [1, 2, 3, 4, 5]

  const handleClick = (star) => {
    if (readonly) return
    if (onRate) {
      onRate(star === rating ? 0 : star)
    }
  }

  return (
    <div className={`rt-rating${readonly ? '' : ' rt-rating-input'}`}>
      {stars.map((star) => (
        <span
          key={star}
          className={`rt-star${star <= rating ? ' filled' : ''}`}
          onClick={() => handleClick(star)}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function TemplatePreview({ templateId }) {
  const previewClass = `rt-template-preview rt-template-preview-${templateId}`

  if (templateId === 'classic') {
    return (
      <div className={previewClass}>
        <div className="rt-preview-line" style={{ width: '70%' }}></div>
        <div className="rt-preview-line short"></div>
        <div className="rt-preview-line" style={{ width: '90%', marginTop: '12px' }}></div>
        <div className="rt-preview-line short" style={{ width: '50%' }}></div>
        <div className="rt-preview-line" style={{ width: '85%' }}></div>
      </div>
    )
  }

  if (templateId === 'modern') {
    return (
      <div className={previewClass}>
        <div className="rt-preview-line" style={{ width: '65%' }}></div>
        <div className="rt-preview-line short"></div>
        <div className="rt-preview-line" style={{ width: '80%', marginTop: '10px' }}></div>
        <div className="rt-preview-line short" style={{ width: '45%' }}></div>
        <div className="rt-preview-line" style={{ width: '75%' }}></div>
      </div>
    )
  }

  if (templateId === 'minimal') {
    return (
      <div className={previewClass}>
        <div className="rt-preview-line" style={{ width: '60%' }}></div>
        <div className="rt-preview-line short" style={{ width: '35%' }}></div>
        <div className="rt-preview-line" style={{ width: '85%', marginTop: '12px' }}></div>
        <div className="rt-preview-line short" style={{ width: '40%' }}></div>
        <div className="rt-preview-line" style={{ width: '70%' }}></div>
      </div>
    )
  }

  if (templateId === 'creative') {
    return (
      <div className={previewClass}>
        <div className="rt-preview-card">
          <div className="rt-preview-line" style={{ width: '70%' }}></div>
          <div className="rt-preview-line short"></div>
        </div>
        <div className="rt-preview-card">
          <div className="rt-preview-line" style={{ width: '80%' }}></div>
          <div className="rt-preview-line short" style={{ width: '50%' }}></div>
        </div>
      </div>
    )
  }

  if (templateId === 'two-column') {
    return (
      <div className={previewClass}>
        <div className="rt-preview-col left"></div>
        <div className="rt-preview-col right">
          <div className="rt-preview-line" style={{ width: '80%' }}></div>
          <div className="rt-preview-line short"></div>
          <div className="rt-preview-line" style={{ width: '90%', marginTop: '10px' }}></div>
          <div className="rt-preview-line short" style={{ width: '40%' }}></div>
        </div>
      </div>
    )
  }

  if (templateId === 'dark') {
    return (
      <div className={previewClass}>
        <div className="rt-preview-line" style={{ width: '65%' }}></div>
        <div className="rt-preview-line short"></div>
        <div className="rt-preview-line" style={{ width: '80%', marginTop: '12px' }}></div>
        <div className="rt-preview-line short" style={{ width: '45%' }}></div>
        <div className="rt-preview-line" style={{ width: '75%' }}></div>
      </div>
    )
  }

  return (
    <div className={previewClass}>
      <div className="rt-preview-line"></div>
      <div className="rt-preview-line short"></div>
    </div>
  )
}

export default function TemplateSelector({
  templates,
  selectedTemplateId,
  filterMode,
  favorites,
  ratings,
  onSelectTemplate,
  onToggleFavorite,
  onRateTemplate,
  onFilterChange,
}) {
  const filteredTemplates = filterTemplates(templates, filterMode, favorites)

  return (
    <div className="rt-template-section">
      <div className="rt-template-header">
        <span className="rt-template-title">选择模板</span>
        <div className="rt-filter-tabs">
          <button
            className={`rt-filter-tab${filterMode === 'all' ? ' active' : ''}`}
            onClick={() => onFilterChange && onFilterChange('all')}
          >
            全部
          </button>
          <button
            className={`rt-filter-tab${filterMode === 'favorites' ? ' active' : ''}`}
            onClick={() => onFilterChange && onFilterChange('favorites')}
          >
            收藏
          </button>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="rt-empty-favorites">
          <div className="rt-empty-favorites-icon">💔</div>
          <div className="rt-empty-favorites-text">暂无收藏的模板</div>
        </div>
      ) : (
        <div className="rt-template-carousel">
          {filteredTemplates.map((template) => {
            const isSelected = template.id === selectedTemplateId
            const fav = isFavorite(favorites, template.id)
            const rating = getRating(ratings, template.id)

            return (
              <div
                key={template.id}
                className={`rt-template-card${isSelected ? ' selected' : ''}`}
                onClick={() => onSelectTemplate && onSelectTemplate(template.id)}
              >
                <TemplatePreview templateId={template.id} />
                <div className="rt-template-info">
                  <div className="rt-template-name">{template.name}</div>
                  <div className="rt-template-meta">
                    <StarRating rating={rating} onRate={(r) => onRateTemplate && onRateTemplate(template.id, r)} />
                    <button
                      className={`rt-favorite-btn${fav ? ' active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite && onToggleFavorite(template.id)
                      }}
                    >
                      <span className="rt-heart">{fav ? '❤️' : '🤍'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
