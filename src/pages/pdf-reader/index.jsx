import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './pdf-reader.css'
import {
  DEFAULT_PAGE_WIDTH,
  DEFAULT_PAGE_HEIGHT,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_MARGIN,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
} from './constants'
import {
  clampZoom,
  validatePageNumber,
  saveCurrentPage,
  loadCurrentPage,
  saveZoom,
  loadZoom,
  createBookmark,
  saveBookmarks,
  loadBookmarks,
  addBookmark,
  removeBookmark,
  findBookmarkByPage,
  extractTableOfContents,
  searchTextInPages,
  findNextMatch,
  findPrevMatch,
  calculateFitWidthZoom,
  calculateFitPageZoom,
  saveCustomDocument,
  clearCustomDocument,
  initializePages,
  measureTextLines,
  getLineYPosition,
  paginatePlainText,
} from './pdfReaderUtils'

function PdfReaderPage() {
  const navigate = useNavigate()

  const [pages, setPages] = useState(() => initializePages())
  const [currentPage, setCurrentPage] = useState(() => {
    const p = loadCurrentPage()
    const total = initializePages().length
    return p > total ? 1 : p
  })
  const [zoom, setZoom] = useState(() => loadZoom())
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks())
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [showBookmarks, setShowBookmarks] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)
  const [jumpInput, setJumpInput] = useState('')
  const [docName, setDocName] = useState('模拟文档 - 星际探索')

  const mainCanvasRef = useRef(null)
  const viewerContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const thumbnailCanvasesRef = useRef({})

  const totalPages = pages.length
  const tableOfContents = useMemo(() => extractTableOfContents(pages), [pages])

  useEffect(() => {
    saveCurrentPage(currentPage)
  }, [currentPage])

  useEffect(() => {
    saveZoom(zoom)
  }, [zoom])

  useEffect(() => {
    saveBookmarks(bookmarks)
  }, [bookmarks])

  const drawPageToCanvas = useCallback(
    (canvas, pageIndex, scale = 1, highlightMatches = [], activeMatchIdx = -1) => {
      if (!canvas) return
      const page = pages[pageIndex]
      if (!page) return

      const ctx = canvas.getContext('2d')
      const width = DEFAULT_PAGE_WIDTH * scale
      const height = DEFAULT_PAGE_HEIGHT * scale
      canvas.width = width
      canvas.height = height

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = '#e5e4e7'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, width - 1, height - 1)

      const fontSize = DEFAULT_FONT_SIZE * scale
      const lineHeight = DEFAULT_LINE_HEIGHT * scale
      const margin = DEFAULT_MARGIN * scale

      ctx.fillStyle = '#08060d'
      ctx.font = `${fontSize}px system-ui, sans-serif`
      ctx.textBaseline = 'alphabetic'

      const lines = measureTextLines(page.content, DEFAULT_PAGE_WIDTH, DEFAULT_FONT_SIZE, DEFAULT_MARGIN)

      const scaledLines = []
      const scaledMatches = highlightMatches.map((m) => ({
        ...m,
      }))

      let charCursor = 0
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx]
        const lineY = getLineYPosition(lineIdx, fontSize, lineHeight, margin)
        scaledLines.push({ text: line, y: lineY })

        for (let i = 0; i < scaledMatches.length; i++) {
          const m = scaledMatches[i]
          const matchStart = m.index
          const matchEnd = m.index + m.length

          const lineStart = charCursor
          const lineEnd = charCursor + line.length

          if (matchStart < lineEnd && matchEnd > lineStart) {
            const startInLine = Math.max(0, matchStart - lineStart)
            const endInLine = Math.min(line.length, matchEnd - lineStart)
            const beforeText = line.substring(0, startInLine)
            const matchText = line.substring(startInLine, endInLine)

            let xBefore = margin
            if (beforeText) {
              xBefore += ctx.measureText(beforeText).width
            }
            const matchWidth = ctx.measureText(matchText).width

            const isActive = i === activeMatchIdx
            ctx.fillStyle = isActive ? '#ff6b35' : '#fff176'
            ctx.fillRect(xBefore, lineY - fontSize + 2 * scale, matchWidth, fontSize * 1.1 * scale)
            ctx.fillStyle = '#08060d'
          }
        }
        charCursor += line.length + 1
      }

      ctx.fillStyle = '#08060d'
      let x = margin
      for (const lineObj of scaledLines) {
        if (lineObj.text === '') continue
        ctx.fillText(lineObj.text, x, lineObj.y)
      }

      if (page.isChapterStart && page.chapterTitle) {
        ctx.fillStyle = '#aa3bff'
        ctx.font = `bold ${fontSize * 1.2}px system-ui, sans-serif`
        ctx.fillText(page.chapterTitle, margin, margin + fontSize * 1.2)
      }

      ctx.fillStyle = '#6b6375'
      ctx.font = `${fontSize * 0.75}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`第 ${pageIndex + 1} 页 / 共 ${pages.length} 页`, width / 2, height - margin / 2)
      ctx.textAlign = 'left'
    },
    [pages]
  )

  const renderMainCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current
    if (!canvas) return
    const matches = searchKeyword
      ? searchResults.filter((r) => r.page === currentPage)
      : []
    const activeInPage = searchResults[currentMatchIndex]?.page === currentPage
      ? searchResults.slice(0, currentMatchIndex + 1).filter((r) => r.page === currentPage).length - 1
      : -1
    drawPageToCanvas(canvas, currentPage - 1, zoom / 100, matches, activeInPage)
  }, [drawPageToCanvas, currentPage, zoom, searchKeyword, searchResults, currentMatchIndex])

  const renderThumbnails = useCallback(() => {
    if (!showThumbnails) return
    const scale = 0.2
    for (let i = 0; i < pages.length; i++) {
      const canvas = thumbnailCanvasesRef.current[i]
      if (canvas) {
        drawPageToCanvas(canvas, i, scale, [], -1)
      }
    }
  }, [drawPageToCanvas, pages, showThumbnails])

  useEffect(() => {
    renderMainCanvas()
  }, [renderMainCanvas])

  useEffect(() => {
    renderThumbnails()
  }, [renderThumbnails])

  const goToPage = useCallback(
    (pageNum) => {
      const valid = validatePageNumber(pageNum, totalPages)
      if (valid !== null) {
        setCurrentPage(valid)
      }
    },
    [totalPages]
  )

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1)
    }
  }, [currentPage])

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1)
    }
  }, [currentPage, totalPages])

  const handleJumpSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const valid = validatePageNumber(parseInt(jumpInput, 10), totalPages)
      if (valid !== null) {
        setCurrentPage(valid)
      }
      setJumpInput('')
    },
    [jumpInput, totalPages]
  )

  const handleZoomChange = useCallback((e) => {
    setZoom(clampZoom(parseInt(e.target.value, 10)))
  }, [])

  const handleFitWidth = useCallback(() => {
    if (viewerContainerRef.current) {
      const w = viewerContainerRef.current.clientWidth - 40
      setZoom(calculateFitWidthZoom(w, DEFAULT_PAGE_WIDTH))
    }
  }, [])

  const handleFitPage = useCallback(() => {
    if (viewerContainerRef.current) {
      const w = viewerContainerRef.current.clientWidth - 40
      const h = viewerContainerRef.current.clientHeight - 40
      setZoom(calculateFitPageZoom(w, h, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT))
    }
  }, [])

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault()
      const keyword = searchKeyword.trim()
      if (!keyword) {
        setSearchResults([])
        setCurrentMatchIndex(-1)
        return
      }
      const results = searchTextInPages(pages, keyword)
      setSearchResults(results)
      if (results.length > 0) {
        setCurrentMatchIndex(0)
        if (results[0].page !== currentPage) {
          setCurrentPage(results[0].page)
        }
      } else {
        setCurrentMatchIndex(-1)
      }
    },
    [searchKeyword, pages, currentPage]
  )

  const handleNextMatch = useCallback(() => {
    if (searchResults.length === 0) return
    const next = findNextMatch(searchResults, currentMatchIndex)
    if (next) {
      const idx = searchResults.indexOf(next)
      setCurrentMatchIndex(idx)
      if (next.page !== currentPage) {
        setCurrentPage(next.page)
      }
    }
  }, [searchResults, currentMatchIndex, currentPage])

  const handlePrevMatch = useCallback(() => {
    if (searchResults.length === 0) return
    const prev = findPrevMatch(searchResults, currentMatchIndex)
    if (prev) {
      const idx = searchResults.indexOf(prev)
      setCurrentMatchIndex(idx)
      if (prev.page !== currentPage) {
        setCurrentPage(prev.page)
      }
    }
  }, [searchResults, currentMatchIndex, currentPage])

  const handleToggleBookmark = useCallback(() => {
    const existing = findBookmarkByPage(bookmarks, currentPage)
    if (existing) {
      setBookmarks(removeBookmark(bookmarks, existing.id))
    } else {
      const page = pages[currentPage - 1]
      const firstLine = page?.content?.split('\n')?.[0]?.slice(0, 30) || ''
      const newBm = createBookmark(currentPage, firstLine || `第${currentPage}页`)
      setBookmarks(addBookmark(bookmarks, newBm))
    }
  }, [bookmarks, currentPage, pages])

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = String(evt.target?.result || '')
      saveCustomDocument(text)
      const newPages = paginatePlainText(text)
      setPages(newPages)
      setCurrentPage(1)
      setBookmarks([])
      setSearchKeyword('')
      setSearchResults([])
      setCurrentMatchIndex(-1)
      setDocName(file.name)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleResetDocument = useCallback(() => {
    clearCustomDocument()
    setPages(initializePages())
    setCurrentPage(1)
    setBookmarks([])
    setSearchKeyword('')
    setSearchResults([])
    setCurrentMatchIndex(-1)
    setDocName('模拟文档 - 星际探索')
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevPage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextPage()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrevPage, handleNextPage])

  const handleWheel = useCallback(
    (e) => {
      if (e.deltaY > 30) {
        handleNextPage()
      } else if (e.deltaY < -30) {
        handlePrevPage()
      }
    },
    [handleNextPage, handlePrevPage]
  )

  const isCurrentPageBookmarked = findBookmarkByPage(bookmarks, currentPage) !== null

  const scaledWidth = (DEFAULT_PAGE_WIDTH * zoom) / 100
  const scaledHeight = (DEFAULT_PAGE_HEIGHT * zoom) / 100

  return (
    <div className="pdf-reader-page">
      <div className="pdf-reader-header">
        <button className="pdf-reader-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="pdf-reader-title">PDF 阅读器</h1>
        <span className="pdf-reader-doc-name">{docName}</span>
        <div className="pdf-reader-header-spacer" />
        <div className="pdf-reader-search-box">
          <input
            type="text"
            className="pdf-reader-search-input"
            placeholder="搜索文本..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
          />
          <button className="pdf-reader-search-btn" onClick={handleSearch}>
            🔍
          </button>
          {searchResults.length > 0 && (
            <>
              <span className="pdf-reader-search-count">
                {currentMatchIndex + 1}/{searchResults.length}
              </span>
              <button className="pdf-reader-nav-btn" onClick={handlePrevMatch} title="上一个">
                ↑
              </button>
              <button className="pdf-reader-nav-btn" onClick={handleNextMatch} title="下一个">
                ↓
              </button>
            </>
          )}
        </div>
        <div className="pdf-reader-zoom-controls">
          <button className="pdf-reader-nav-btn" onClick={handleFitWidth} title="适应宽度">
            ⇔
          </button>
          <button className="pdf-reader-nav-btn" onClick={handleFitPage} title="适应页面">
            ⊞
          </button>
          <input
            type="range"
            className="pdf-reader-zoom-slider"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={10}
            value={zoom}
            onChange={handleZoomChange}
          />
          <span className="pdf-reader-zoom-value">{zoom}%</span>
        </div>
        <label className="pdf-reader-upload-btn" title="上传 TXT 文件">
          📄
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </label>
        <button
          className={`pdf-reader-bookmark-btn ${isCurrentPageBookmarked ? 'active' : ''}`}
          onClick={handleToggleBookmark}
          title={isCurrentPageBookmarked ? '移除书签' : '添加书签'}
        >
          {isCurrentPageBookmarked ? '⭐' : '☆'}
        </button>
        <button className="pdf-reader-reset-btn" onClick={handleResetDocument} title="重置为默认文档">
          ↺
        </button>
      </div>

      <div className="pdf-reader-body">
        {showThumbnails && (
          <div className="pdf-reader-sidebar pdf-reader-thumbnails">
            <div className="pdf-reader-sidebar-header">
              <h3>缩略图</h3>
              <button className="pdf-reader-sidebar-toggle" onClick={() => setShowThumbnails(false)}>
                ×
              </button>
            </div>
            <div className="pdf-reader-thumbnails-list">
              {pages.map((_, idx) => (
                <div
                  key={idx}
                  className={`pdf-reader-thumbnail-item ${idx + 1 === currentPage ? 'active' : ''}`}
                  onClick={() => goToPage(idx + 1)}
                >
                  <canvas
                    ref={(el) => {
                      thumbnailCanvasesRef.current[idx] = el
                    }}
                    className="pdf-reader-thumbnail-canvas"
                  />
                  <span className="pdf-reader-thumbnail-label">第 {idx + 1} 页</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="pdf-reader-viewer-container"
          ref={viewerContainerRef}
          onWheel={handleWheel}
        >
          {!showThumbnails && (
            <button
              className="pdf-reader-toggle-left"
              onClick={() => setShowThumbnails(true)}
              title="显示缩略图"
            >
              ◀
            </button>
          )}
          <div className="pdf-reader-canvas-wrapper" style={{ width: scaledWidth, height: scaledHeight }}>
            <canvas ref={mainCanvasRef} className="pdf-reader-main-canvas" />
          </div>
          {!showBookmarks && (
            <button
              className="pdf-reader-toggle-right"
              onClick={() => setShowBookmarks(true)}
              title="显示书签/目录"
            >
              ▶
            </button>
          )}
        </div>

        {showBookmarks && (
          <div className="pdf-reader-sidebar pdf-reader-bookmarks-panel">
            <div className="pdf-reader-sidebar-header">
              <h3>书签 / 目录</h3>
              <button className="pdf-reader-sidebar-toggle" onClick={() => setShowBookmarks(false)}>
                ×
              </button>
            </div>

            <div className="pdf-reader-toc-section">
              <h4>📚 目录</h4>
              {tableOfContents.length > 0 ? (
                <ul className="pdf-reader-toc-list">
                  {tableOfContents.map((item, idx) => (
                    <li
                      key={idx}
                      className={`pdf-reader-toc-item ${item.page === currentPage ? 'active' : ''}`}
                      onClick={() => goToPage(item.page)}
                    >
                      <span className="pdf-reader-toc-title">{item.title}</span>
                      <span className="pdf-reader-toc-page">p.{item.page}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pdf-reader-empty">暂无目录</p>
              )}
            </div>

            <div className="pdf-reader-bookmarks-section">
              <h4>⭐ 书签</h4>
              {bookmarks.length > 0 ? (
                <ul className="pdf-reader-bookmarks-list">
                  {bookmarks.map((bm) => (
                    <li
                      key={bm.id}
                      className={`pdf-reader-bookmark-item ${bm.page === currentPage ? 'active' : ''}`}
                    >
                      <span className="pdf-reader-bookmark-content" onClick={() => goToPage(bm.page)}>
                        <span className="pdf-reader-bookmark-title">{bm.title}</span>
                        <span className="pdf-reader-bookmark-page">p.{bm.page}</span>
                      </span>
                      <button
                        className="pdf-reader-bookmark-delete"
                        onClick={() => setBookmarks(removeBookmark(bookmarks, bm.id))}
                        title="删除书签"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pdf-reader-empty">暂无书签，点击工具栏 ☆ 添加</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pdf-reader-footer">
        <button
          className="pdf-reader-page-btn"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
        >
          ← 上一页
        </button>

        <form className="pdf-reader-jump-form" onSubmit={handleJumpSubmit}>
          <input
            type="number"
            className="pdf-reader-jump-input"
            placeholder={String(currentPage)}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            min={1}
            max={totalPages}
          />
          <span className="pdf-reader-page-info">
            / {totalPages} 页
          </span>
        </form>

        <button
          className="pdf-reader-page-btn"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          下一页 →
        </button>

        <div className="pdf-reader-footer-hint">
          ← → 翻页 · 滚轮翻页
        </div>
      </div>
    </div>
  )
}

export default PdfReaderPage
