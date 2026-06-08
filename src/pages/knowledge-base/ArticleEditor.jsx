import { useState, useEffect, useMemo, useRef } from 'react'
import { markdownToHtml, extractTOC, formatDate } from './kbUtils'

export default function ArticleEditor({
  article,
  onUpdate,
  onToggleFavorite,
  onDelete,
  onBackToList,
}) {
  const [title, setTitle] = useState(article?.title || '')
  const [content, setContent] = useState(article?.content || '')
  const [editMode, setEditMode] = useState('split')
  const [activeHeading, setActiveHeading] = useState('')
  const previewRef = useRef(null)
  const saveTimerRef = useRef(null)
  const pendingChangesRef = useRef({})

  useEffect(() => {
    setTitle(article?.title || '')
    setContent(article?.content || '')
    pendingChangesRef.current = {}
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }, [article?.id])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const scheduleSave = (changes) => {
    pendingChangesRef.current = { ...pendingChangesRef.current, ...changes }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      const toSave = pendingChangesRef.current
      pendingChangesRef.current = {}
      saveTimerRef.current = null
      if (Object.keys(toSave).length > 0) {
        onUpdate(toSave)
      }
    }, 300)
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    scheduleSave({ title: newTitle })
  }

  const handleContentChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)
    scheduleSave({ content: newContent })
  }

  const previewHtml = useMemo(() => markdownToHtml(content), [content])
  const toc = useMemo(() => extractTOC(content), [content])

  const handleScroll = () => {
    if (!previewRef.current || toc.length === 0) return
    const headings = previewRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let current = ''
    for (const heading of headings) {
      const rect = heading.getBoundingClientRect()
      if (rect.top <= 80) {
        current = heading.id
      } else {
        break
      }
    }
    setActiveHeading(current)
  }

  const scrollToHeading = (slug) => {
    if (!previewRef.current) return
    const el = previewRef.current.querySelector(`#${CSS.escape(slug)}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (!article) {
    return (
      <div className="kb-editor">
        <div className="kb-editor-empty">
          <div className="kb-editor-empty-icon">📄</div>
          <div className="kb-editor-empty-text">请选择一篇文章，或新建一篇文章开始编写</div>
          {onBackToList && (
            <button type="button" className="kb-btn kb-btn-primary" onClick={onBackToList}>
              返回列表
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="kb-editor">
      <div className="kb-editor-toolbar">
        <input
          type="text"
          className="kb-editor-title-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="文章标题"
        />
        <div className="kb-editor-meta">{formatDate(article.updatedAt)}</div>
        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              type="button"
              className="kb-btn"
              style={{ borderRadius: 0, border: 'none', borderRight: editMode !== 'preview' ? '1px solid #d1d5db' : 'none', background: editMode === 'edit' ? '#eef2ff' : '#fff', color: editMode === 'edit' ? '#4f46e5' : '#374151' }}
              onClick={() => setEditMode('edit')}
            >
              编辑
            </button>
            <button
              type="button"
              className="kb-btn"
              style={{ borderRadius: 0, border: 'none', borderRight: editMode === 'preview' ? 'none' : '1px solid #d1d5db', background: editMode === 'split' ? '#eef2ff' : '#fff', color: editMode === 'split' ? '#4f46e5' : '#374151' }}
              onClick={() => setEditMode('split')}
            >
              分栏
            </button>
            <button
              type="button"
              className="kb-btn"
              style={{ borderRadius: 0, border: 'none', background: editMode === 'preview' ? '#eef2ff' : '#fff', color: editMode === 'preview' ? '#4f46e5' : '#374151' }}
              onClick={() => setEditMode('preview')}
            >
              预览
            </button>
          </div>
          <button
            type="button"
            className="kb-btn"
            onClick={() => onToggleFavorite(article.id)}
            title={article.isFavorite ? '取消收藏' : '收藏'}
            style={{ color: article.isFavorite ? '#f59e0b' : undefined }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={article.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {article.isFavorite ? '已收藏' : '收藏'}
          </button>
          <button
            type="button"
            className="kb-btn kb-btn-danger"
            onClick={() => onDelete(article.id)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
            删除
          </button>
        </div>
      </div>
      <div className="kb-editor-body">
        {(editMode === 'edit' || editMode === 'split') && (
          <div className="kb-editor-pane">
            <div className="kb-pane-header">
              <span className="kb-pane-title">Markdown 编辑</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{content.length} 字符</span>
            </div>
            <textarea
              className="kb-textarea"
              value={content}
              onChange={handleContentChange}
              placeholder="在此输入 Markdown 内容..."
              spellCheck={false}
            />
          </div>
        )}
        {(editMode === 'preview' || editMode === 'split') && (
          <div className="kb-editor-pane">
            <div className="kb-pane-header">
              <span className="kb-pane-title">实时预览</span>
            </div>
            <div className="kb-preview-scroll" ref={previewRef} onScroll={handleScroll}>
              <div
                className="kb-preview-content"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        )}
        {toc.length > 0 && (
          <div className="kb-toc">
            <div className="kb-toc-title">目录</div>
            <ul className="kb-toc-list">
              {toc.map((item) => (
                <li key={item.slug} className="kb-toc-item">
                  <a
                    className={`kb-toc-link ${activeHeading === item.slug ? 'active' : ''}`}
                    style={{ paddingLeft: `${8 + (item.level - 1) * 12}px` }}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToHeading(item.slug)
                    }}
                    href={`#${item.slug}`}
                    title={item.text}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
