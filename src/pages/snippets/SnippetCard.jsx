import { useMemo } from 'react'
import { LANGUAGE_LABELS, highlightCode, highlightSearchTerm, formatDate, copyToClipboard } from './snippetsUtils'

function SnippetCard({ snippet, viewMode, searchTerm, onToggleFavorite, onCopy, onEdit, onDelete }) {
  const previewHtml = useMemo(() => {
    const preview = (snippet.code || '').split('\n').slice(0, 5).join('\n')
    return highlightCode(preview, snippet.language)
  }, [snippet.code, snippet.language])

  const titleHtml = useMemo(() => {
    return highlightSearchTerm(snippet.title || '', searchTerm)
  }, [snippet.title, searchTerm])

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await copyToClipboard(snippet.code || '')
      onCopy?.(snippet.id)
    } catch {
      // ignore
    }
  }

  const handleFavorite = (e) => {
    e.stopPropagation()
    onToggleFavorite?.(snippet.id)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit?.(snippet)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(snippet.id)
  }

  if (viewMode === 'list') {
    return (
      <div className="sn-card sn-card--list" onClick={() => onEdit?.(snippet)}>
        <button
          className={`sn-favorite-btn ${snippet.favorite ? 'is-active' : ''}`}
          onClick={handleFavorite}
          aria-label={snippet.favorite ? '取消收藏' : '收藏'}
        >
          {snippet.favorite ? '★' : '☆'}
        </button>
        <div className="sn-card-list-title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        <span className={`sn-lang-tag sn-lang-${snippet.language}`}>
          {LANGUAGE_LABELS[snippet.language] || snippet.language}
        </span>
        <span className="sn-card-date">{formatDate(snippet.createdAt)}</span>
        <div className="sn-card-actions">
          <button className="sn-btn sn-btn-sm" onClick={handleCopy}>复制</button>
          <button className="sn-btn sn-btn-sm sn-btn-danger" onClick={handleDelete}>删除</button>
        </div>
      </div>
    )
  }

  return (
    <div className="sn-card sn-card--grid" onClick={() => onEdit?.(snippet)}>
      <div className="sn-card-header">
        <h3 className="sn-card-title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        <button
          className={`sn-favorite-btn ${snippet.favorite ? 'is-active' : ''}`}
          onClick={handleFavorite}
          aria-label={snippet.favorite ? '取消收藏' : '收藏'}
        >
          {snippet.favorite ? '★' : '☆'}
        </button>
      </div>
      <div className="sn-card-meta">
        <span className={`sn-lang-tag sn-lang-${snippet.language}`}>
          {LANGUAGE_LABELS[snippet.language] || snippet.language}
        </span>
        <span className="sn-card-date">{formatDate(snippet.createdAt)}</span>
      </div>
      <pre
        className="sn-card-preview"
        dangerouslySetInnerHTML={{ __html: previewHtml || '<span class="sn-empty">暂无代码</span>' }}
      />
      {snippet.notes && (
        <p className="sn-card-notes">{snippet.notes}</p>
      )}
      <div className="sn-card-actions">
        <button className="sn-btn sn-btn-sm" onClick={handleCopy}>复制代码</button>
        <button className="sn-btn sn-btn-sm" onClick={handleEdit}>编辑</button>
        <button className="sn-btn sn-btn-sm sn-btn-danger" onClick={handleDelete}>删除</button>
      </div>
    </div>
  )
}

export default SnippetCard
