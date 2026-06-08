import { highlightText, formatDate, findCategoryById } from './kbUtils'

function renderHighlightedText(text, keyword) {
  if (!keyword) return text
  const highlighted = highlightText(text, keyword)
  const parts = highlighted.split(/\|\|\|(?:HIGHLIGHT|\/HIGHLIGHT)\|\|\|/)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="kb-highlight">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function getPreviewText(content) {
  if (!content) return ''
  const text = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, 100)
}

export default function ArticleList({
  articles,
  selectedArticleId,
  searchKeyword,
  categories,
  onSelect,
  onCreate,
  onToggleFavorite,
  onDelete,
  showCreateButton = true,
  emptyText = '暂无文章',
  title = '文章列表',
}) {
  return (
    <div className="kb-article-list">
      <div className="kb-article-list-header">
        <span className="kb-article-list-title">
          {title} {articles.length > 0 && <span style={{ color: '#9ca3af', fontWeight: 400 }}>({articles.length})</span>}
        </span>
        {showCreateButton && (
          <button type="button" className="kb-btn kb-btn-primary" onClick={onCreate}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新建
          </button>
        )}
      </div>
      <div className="kb-article-list-body">
        {articles.length === 0 ? (
          <div className="kb-article-empty">{emptyText}</div>
        ) : (
          articles.map((article) => {
            const category = findCategoryById(categories, article.categoryId)
            return (
              <div
                key={article.id}
                className={`kb-article-item ${selectedArticleId === article.id ? 'active' : ''}`}
                onClick={() => onSelect(article.id)}
              >
                <div className="kb-article-item-top">
                  <span className="kb-article-item-title">
                    {renderHighlightedText(article.title, searchKeyword)}
                  </span>
                  <button
                    type="button"
                    className="kb-article-item-fav"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(article.id)
                    }}
                    title={article.isFavorite ? '取消收藏' : '收藏'}
                    style={{ color: article.isFavorite ? '#f59e0b' : '#d1d5db' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={article.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
                <div className="kb-article-item-meta">
                  {category && <span>{category.name}</span>}
                  <span>·</span>
                  <span>{formatDate(article.updatedAt)}</span>
                </div>
                <div className="kb-article-item-preview">
                  {renderHighlightedText(getPreviewText(article.content), searchKeyword)}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
