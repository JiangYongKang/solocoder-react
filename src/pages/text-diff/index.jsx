import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './text-diff.css'
import {
  DIFF_TYPE,
  buildSideBySideDiff,
  extractChangeBlocks,
  getChangeTypeLabel,
  getDiffStats,
  isSupportedFileType,
  readClipboardText,
  readFileAsText,
  splitLines,
} from './diffUtils'

const VIEW_MODE = {
  SIDE_BY_SIDE: 'side-by-side',
  UNIFIED: 'unified',
}

const SAMPLE_OLD = `function hello(name) {
  console.log("Hello, " + name);
  return true;
}

const users = ["Alice", "Bob"];
for (let i = 0; i < users.length; i++) {
  hello(users[i]);
}`

const SAMPLE_NEW = `function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!");
  return name.length > 0;
}

const people = ["Alice", "Bob", "Charlie"];
for (const person of people) {
  greet(person, "Hi");
}`

const renderCharDiff = (charDiff) => {
  if (!charDiff || charDiff.length === 0) return null
  return charDiff.map((segment, idx) => {
    let className = ''
    if (segment.type === DIFF_TYPE.ADDED) {
      className = 'td-char-added'
    } else if (segment.type === DIFF_TYPE.REMOVED) {
      className = 'td-char-removed'
    } else if (segment.type === DIFF_TYPE.MODIFIED) {
      className = 'td-char-modified'
    }
    if (className) {
      return (
        <span key={idx} className={className}>
          {segment.value}
        </span>
      )
    }
    return <span key={idx}>{segment.value}</span>
  })
}

const getLineClassName = (type) => {
  switch (type) {
    case DIFF_TYPE.ADDED:
      return 'td-line-added'
    case DIFF_TYPE.REMOVED:
      return 'td-line-removed'
    case DIFF_TYPE.MODIFIED:
      return 'td-line-modified'
    default:
      return ''
  }
}

const TextDiffPage = () => {
  const [oldText, setOldText] = useState(SAMPLE_OLD)
  const [newText, setNewText] = useState(SAMPLE_NEW)
  const [viewMode, setViewMode] = useState(VIEW_MODE.SIDE_BY_SIDE)
  const [activeBlockIndex, setActiveBlockIndex] = useState(-1)
  const [error, setError] = useState('')

  const diffContentRef = useRef(null)
  const leftFileInputRef = useRef(null)
  const rightFileInputRef = useRef(null)

  const diffResult = useMemo(() => {
    return buildSideBySideDiff(oldText, newText)
  }, [oldText, newText])

  const changeBlocks = useMemo(() => {
    return extractChangeBlocks(diffResult.lineDiff)
  }, [diffResult])

  const stats = useMemo(() => {
    return getDiffStats(diffResult.lineDiff)
  }, [diffResult])

  const handleFileSelect = useCallback(async (e, side) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setError('')

    if (!file) return

    if (!isSupportedFileType(file)) {
      setError('仅支持 .txt 和 .md 文件')
      return
    }

    try {
      const content = await readFileAsText(file)
      if (side === 'left') {
        setOldText(content)
      } else {
        setNewText(content)
      }
    } catch {
      setError('文件读取失败')
    }
  }, [])

  const handleClipboardPaste = useCallback(async (side) => {
    setError('')
    const result = await readClipboardText()
    if (result.success) {
      if (side === 'left') {
        setOldText(result.text)
      } else {
        setNewText(result.text)
      }
    } else {
      setError(result.error || '无法读取剪贴板')
    }
  }, [])

  const scrollToBlock = useCallback((blockIndex) => {
    if (blockIndex < 0 || blockIndex >= changeBlocks.length) return

    const block = changeBlocks[blockIndex]
    if (!block) return

    setActiveBlockIndex(blockIndex)

    const contentEl = diffContentRef.current
    if (!contentEl) return

    const targetRow = block.startIndex
    const rows = contentEl.querySelectorAll('[data-row-index]')
    if (rows && rows.length > 0) {
      const targetEl = rows[targetRow]
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [changeBlocks])

  const handleSwap = useCallback(() => {
    setOldText(newText)
    setNewText(oldText)
  }, [oldText, newText])

  const handleClear = useCallback(() => {
    setOldText('')
    setNewText('')
  }, [])

  const handleLoadSample = useCallback(() => {
    setOldText(SAMPLE_OLD)
    setNewText(SAMPLE_NEW)
  }, [])

  useEffect(() => {
    if (activeBlockIndex >= 0 && activeBlockIndex < changeBlocks.length) {
      const timer = setTimeout(() => setActiveBlockIndex(-1), 1500)
      return () => clearTimeout(timer)
    }
  }, [activeBlockIndex, changeBlocks.length])

  const renderSideBySide = () => {
    const { leftRows, rightRows } = diffResult
    const rowCount = Math.max(leftRows.length, rightRows.length)
    const rows = []

    for (let i = 0; i < rowCount; i++) {
      const leftRow = leftRows[i] || {}
      const rightRow = rightRows[i] || {}
      const isEmptyRow = leftRow.empty && rightRow.empty
      const lineClass = getLineClassName(leftRow.type !== DIFF_TYPE.EQUAL ? leftRow.type : rightRow.type)

      if (isEmptyRow) continue

      rows.push(
        <div key={i} data-row-index={i} style={{ display: 'contents' }}>
          <div className={`td-line-num ${leftRow.lineNum ? '' : 'td-line-num-empty'}`}>
            {leftRow.lineNum || ''}
          </div>
          <div className={`td-line-content ${leftRow.empty ? 'td-line-empty' : ''} ${lineClass}`}>
            {leftRow.charDiff ? renderCharDiff(leftRow.charDiff) : (leftRow.content || '\u00A0')}
          </div>
          <div className={`td-line-num ${rightRow.lineNum ? '' : 'td-line-num-empty'}`}>
            {rightRow.lineNum || ''}
          </div>
          <div className={`td-line-content ${rightRow.empty ? 'td-line-empty' : ''} ${lineClass}`}>
            {rightRow.charDiff ? renderCharDiff(rightRow.charDiff) : (rightRow.content || '\u00A0')}
          </div>
        </div>
      )
    }

    return rows
  }

  const renderUnified = () => {
    const { unifiedRows } = diffResult
    return unifiedRows.map((row, idx) => {
      const lineClass = getLineClassName(row.type)
      const prefixClass = row.prefix === '+'
        ? 'td-unified-prefix-added'
        : row.prefix === '-'
          ? 'td-unified-prefix-removed'
          : ''

      return (
        <div key={idx} data-row-index={idx} style={{ display: 'contents' }}>
          <div className={`td-line-num ${row.leftLineNum ? '' : 'td-line-num-empty'}`}>
            {row.leftLineNum || ''}
          </div>
          <div className={`td-line-num ${row.rightLineNum ? '' : 'td-line-num-empty'}`}>
            {row.rightLineNum || ''}
          </div>
          <div className={`td-unified-prefix ${prefixClass}`}>
            {row.prefix}
          </div>
          <div className={`td-unified-content ${lineClass}`}>
            {row.charDiff ? renderCharDiff(row.charDiff) : (row.content || '\u00A0')}
          </div>
        </div>
      )
    })
  }

  const oldLineCount = splitLines(oldText).length
  const newLineCount = splitLines(newText).length

  return (
    <div className="td-page">
      <div className="td-container">
        <header className="td-header">
          <Link to="/" className="td-back-link">← 返回首页</Link>
          <h1 className="td-title">文本差异对比工具</h1>
          <div className="td-stats">
            <span className="td-stat td-stat-added">+{stats.added}</span>
            <span className="td-stat td-stat-removed">-{stats.removed}</span>
            {stats.modified > 0 && (
              <span className="td-stat td-stat-modified">~{stats.modified}</span>
            )}
          </div>
        </header>

        <div className="td-toolbar">
          <div className="td-toolbar-group">
            <button
              type="button"
              className={`td-toolbar-btn ${viewMode === VIEW_MODE.SIDE_BY_SIDE ? 'active' : ''}`}
              onClick={() => setViewMode(VIEW_MODE.SIDE_BY_SIDE)}
            >
              左右对比
            </button>
            <button
              type="button"
              className={`td-toolbar-btn ${viewMode === VIEW_MODE.UNIFIED ? 'active' : ''}`}
              onClick={() => setViewMode(VIEW_MODE.UNIFIED)}
            >
              统一视图
            </button>
          </div>
          <div className="td-toolbar-group">
            <button
              type="button"
              className="td-toolbar-btn"
              onClick={handleSwap}
            >
              ⇄ 交换
            </button>
            <button
              type="button"
              className="td-toolbar-btn"
              onClick={handleClear}
            >
              清空
            </button>
            <button
              type="button"
              className="td-toolbar-btn"
              onClick={handleLoadSample}
            >
              示例
            </button>
          </div>
        </div>

        {error && <div className="td-error">{error}</div>}

        <div className="td-input-section">
          <div className="td-input-pane">
            <div className="td-pane-header">
              <span className="td-pane-title">原始文本 · {oldLineCount} 行</span>
              <div className="td-pane-actions">
                <button
                  type="button"
                  className="td-pane-action-btn"
                  onClick={() => handleClipboardPaste('left')}
                  title="从剪贴板粘贴"
                >
                  📋 粘贴
                </button>
                <button
                  type="button"
                  className="td-pane-action-btn"
                  onClick={() => leftFileInputRef.current?.click()}
                  title="上传 .txt 或 .md 文件"
                >
                  📁 上传
                </button>
              </div>
            </div>
            <textarea
              className="td-textarea"
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              placeholder="在此输入或粘贴原始文本..."
              spellCheck={false}
            />
          </div>

          <div className="td-input-pane">
            <div className="td-pane-header">
              <span className="td-pane-title">修改后文本 · {newLineCount} 行</span>
              <div className="td-pane-actions">
                <button
                  type="button"
                  className="td-pane-action-btn"
                  onClick={() => handleClipboardPaste('right')}
                  title="从剪贴板粘贴"
                >
                  📋 粘贴
                </button>
                <button
                  type="button"
                  className="td-pane-action-btn"
                  onClick={() => rightFileInputRef.current?.click()}
                  title="上传 .txt 或 .md 文件"
                >
                  📁 上传
                </button>
              </div>
            </div>
            <textarea
              className="td-textarea"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="在此输入或粘贴修改后的文本..."
              spellCheck={false}
            />
          </div>
        </div>

        <input
          ref={leftFileInputRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          className="td-hidden-file"
          onChange={(e) => handleFileSelect(e, 'left')}
        />
        <input
          ref={rightFileInputRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          className="td-hidden-file"
          onChange={(e) => handleFileSelect(e, 'right')}
        />

        <div className="td-main-layout">
          <div className="td-diff-area">
            {viewMode === VIEW_MODE.SIDE_BY_SIDE ? (
              <>
                <div className="td-diff-headers-row">
                  <div className="td-diff-header-col">#</div>
                  <div className="td-diff-header-col">原始</div>
                  <div className="td-diff-header-col">#</div>
                  <div className="td-diff-header-col">修改后</div>
                </div>
                <div
                  ref={diffContentRef}
                  className="td-diff-content"
                >
                  <div className="td-side-by-side">
                    {renderSideBySide()}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="td-diff-headers-row" style={{ gridTemplateColumns: '50px 50px 24px 1fr' }}>
                  <div className="td-diff-header-col">原</div>
                  <div className="td-diff-header-col">新</div>
                  <div className="td-diff-header-col"></div>
                  <div className="td-diff-header-col">内容</div>
                </div>
                <div
                  ref={diffContentRef}
                  className="td-diff-content"
                >
                  <div className="td-unified">
                    {renderUnified()}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="td-nav-panel">
            <div className="td-nav-header">
              变更块 · {changeBlocks.length}
            </div>
            <div className="td-nav-list">
              {changeBlocks.length === 0 ? (
                <div className="td-nav-empty">暂无差异</div>
              ) : (
                changeBlocks.map((block, idx) => {
                  const firstRow = block.rows?.[0] || {}
                  const previewText = firstRow.oldLine || firstRow.newLine || ''
                  const preview = previewText.length > 40
                    ? previewText.slice(0, 40) + '...'
                    : previewText

                  let badgeClass = ''
                  switch (block.type) {
                    case DIFF_TYPE.ADDED:
                      badgeClass = 'td-nav-badge-added'
                      break
                    case DIFF_TYPE.REMOVED:
                      badgeClass = 'td-nav-badge-removed'
                      break
                    case DIFF_TYPE.MODIFIED:
                      badgeClass = 'td-nav-badge-modified'
                      break
                    default:
                      break
                  }

                  const location = firstRow.oldIndex != null && firstRow.newIndex != null
                    ? `行 ${firstRow.oldIndex + 1} → ${firstRow.newIndex + 1}`
                    : firstRow.oldIndex != null
                      ? `行 ${firstRow.oldIndex + 1}`
                      : firstRow.newIndex != null
                        ? `行 ${firstRow.newIndex + 1}`
                        : ''

                  return (
                    <div
                      key={idx}
                      className={`td-nav-item ${activeBlockIndex === idx ? 'active' : ''}`}
                      onClick={() => scrollToBlock(idx)}
                    >
                      <span className={`td-nav-badge ${badgeClass}`}>
                        {getChangeTypeLabel(block.type)}
                      </span>
                      <div className="td-nav-info">
                        <div className="td-nav-location">{location}</div>
                        <div className="td-nav-preview">{preview || '(空行)'}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextDiffPage
