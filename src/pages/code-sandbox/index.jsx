import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import './code-sandbox.css'
import { LANGUAGES, LANGUAGE_LABELS, DEFAULT_CODE, OUTPUT_LINE_PREFIX } from './constants'
import {
  highlightSyntax,
  handleTabKey,
  handleBracketCompletion,
  executeCode,
  formatOutputLines,
  measureExecution,
} from './codeSandboxUtils'
import {
  loadSnippets,
  saveSnippets,
  createSnippet,
  addSnippet,
  renameSnippet,
  deleteSnippet,
  loadHistory,
  saveHistory,
  createHistoryItem,
  addHistoryItem,
  clearHistory,
  formatTimestamp,
  truncateCode,
  countLines,
} from './storage'

const CodeSandboxPage = () => {
  const [language, setLanguage] = useState(LANGUAGES.JAVASCRIPT)
  const [code, setCode] = useState(DEFAULT_CODE[LANGUAGES.JAVASCRIPT])
  const [output, setOutput] = useState([])
  const [duration, setDuration] = useState(0)
  const [stdin, setStdin] = useState('')
  const [stdinExpanded, setStdinExpanded] = useState(false)
  const [snippets, setSnippets] = useState(() => loadSnippets())
  const [history, setHistory] = useState(() => loadHistory())
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [snippetName, setSnippetName] = useState('')
  const [editingSnippetId, setEditingSnippetId] = useState(null)
  const [editingSnippetName, setEditingSnippetName] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const textareaRef = useRef(null)
  const highlightRef = useRef(null)
  const gutterRef = useRef(null)
  const consoleRef = useRef(null)

  const highlightedCode = useMemo(() => {
    return highlightSyntax(code, language)
  }, [code, language])

  const lineCount = useMemo(() => {
    return countLines(code)
  }, [code])

  const gutterLines = useMemo(() => {
    const lines = []
    for (let i = 1; i <= lineCount; i++) {
      lines.push(i)
    }
    return lines
  }, [lineCount])

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    if (highlightRef.current && textareaRef.current) {
      const syncScroll = () => {
        if (highlightRef.current && textareaRef.current) {
          highlightRef.current.scrollTop = textareaRef.current.scrollTop
          highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
        }
        if (gutterRef.current && textareaRef.current) {
          gutterRef.current.scrollTop = textareaRef.current.scrollTop
        }
      }
      textareaRef.current.addEventListener('scroll', syncScroll)
      return () => {
        textareaRef.current?.removeEventListener('scroll', syncScroll)
      }
    }
  }, [])

  const handleCodeChange = useCallback((e) => {
    setCode(e.target.value)
  }, [])

  const handleKeyDown = useCallback((e) => {
    const tabResult = handleTabKey(e)
    if (tabResult && textareaRef.current) {
      e.preventDefault()
      const textarea = textareaRef.current
      textarea.value = tabResult.newValue
      textarea.selectionStart = tabResult.newCursorStart
      textarea.selectionEnd = tabResult.newCursorEnd
      setCode(tabResult.newValue)
      return
    }

    const bracketResult = handleBracketCompletion(e)
    if (bracketResult && textareaRef.current) {
      e.preventDefault()
      const textarea = textareaRef.current
      textarea.value = bracketResult.newValue
      textarea.selectionStart = bracketResult.newCursorStart
      textarea.selectionEnd = bracketResult.newCursorEnd
      setCode(bracketResult.newValue)
      return
    }
  }, [])

  const handleLanguageChange = useCallback((e) => {
    const newLang = e.target.value
    setLanguage(newLang)
    if (code === DEFAULT_CODE[LANGUAGES.JAVASCRIPT] || code === DEFAULT_CODE[LANGUAGES.PYTHON]) {
      setCode(DEFAULT_CODE[newLang])
    }
  }, [code])

  const handleRun = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)

    const { result, duration: execDuration } = measureExecution(() => {
      return executeCode(code, language, stdin)
    })

    const formattedOutput = formatOutputLines(result.output)
    setOutput(formattedOutput)
    setDuration(execDuration)

    const historyItem = createHistoryItem({
      language,
      code,
      duration: execDuration,
      success: result.success,
      error: result.error,
    })

    const newHistory = addHistoryItem(history, historyItem)
    setHistory(newHistory)
    saveHistory(newHistory)

    setIsRunning(false)
  }, [code, language, stdin, isRunning, history])

  const handleClearOutput = useCallback(() => {
    setOutput([])
    setDuration(0)
  }, [])

  const handleSaveClick = useCallback(() => {
    setSnippetName('')
    setShowSaveModal(true)
  }, [])

  const handleSaveConfirm = useCallback(() => {
    if (!snippetName.trim()) return

    const snippet = createSnippet({
      name: snippetName.trim(),
      language,
      code,
    })

    const newSnippets = addSnippet(snippets, snippet)
    setSnippets(newSnippets)
    saveSnippets(newSnippets)
    setShowSaveModal(false)
    setSnippetName('')
  }, [snippetName, language, code, snippets])

  const handleLoadClick = useCallback(() => {
    setShowLoadModal(true)
  }, [])

  const handleLoadSnippet = useCallback((snippet) => {
    setLanguage(snippet.language)
    setCode(snippet.code)
    setShowLoadModal(false)
  }, [])

  const handleRenameClick = useCallback((e, snippet) => {
    e.stopPropagation()
    setEditingSnippetId(snippet.id)
    setEditingSnippetName(snippet.name)
  }, [])

  const handleRenameConfirm = useCallback((e, snippetId) => {
    e.stopPropagation()
    if (!editingSnippetName.trim()) return

    const newSnippets = renameSnippet(snippets, snippetId, editingSnippetName.trim())
    setSnippets(newSnippets)
    saveSnippets(newSnippets)
    setEditingSnippetId(null)
    setEditingSnippetName('')
  }, [editingSnippetName, snippets])

  const handleDeleteSnippet = useCallback((e, snippetId) => {
    e.stopPropagation()
    const newSnippets = deleteSnippet(snippets, snippetId)
    setSnippets(newSnippets)
    saveSnippets(newSnippets)
  }, [snippets])

  const handleHistoryClick = useCallback((item) => {
    setLanguage(item.language)
    setCode(item.code)
  }, [])

  const handleClearHistory = useCallback(() => {
    clearHistory()
    setHistory([])
  }, [])

  const formatOutput = (outputItem, index) => {
    return (
      <p
        key={index}
        className={`cs-console-line ${outputItem.type === 'error' ? 'error' : ''}`}
      >
        {outputItem.content}
      </p>
    )
  }

  return (
    <div className="cs-page">
      <div className="cs-container">
        <header className="cs-header">
          <Link to="/" className="cs-back-link">
            ← 返回首页
          </Link>
          <h1 className="cs-title">代码执行沙箱</h1>
          <div className="cs-toolbar">
            <select
              className="cs-select"
              value={language}
              onChange={handleLanguageChange}
            >
              {Object.entries(LANGUAGES).map(([key, value]) => (
                <option key={key} value={value}>
                  {LANGUAGE_LABELS[value]}
                </option>
              ))}
            </select>
            <button
              className="cs-btn cs-btn-primary"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? '运行中...' : '▶ 运行'}
            </button>
            <button className="cs-btn" onClick={handleSaveClick}>
              💾 保存
            </button>
            <button className="cs-btn" onClick={handleLoadClick}>
              📂 加载
            </button>
          </div>
        </header>

        <div className="cs-main-layout">
          <div className="cs-panel">
            <div className="cs-panel-header">
              <h3 className="cs-panel-title">
                代码编辑器 - {LANGUAGE_LABELS[language]}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--cs-text-secondary)' }}>
                {lineCount} 行
              </span>
            </div>
            <div className="cs-panel-body">
              <div className="cs-editor-wrapper">
                <div className="cs-editor-gutter" ref={gutterRef}>
                  {gutterLines.map((num) => (
                    <div key={num} className="cs-editor-gutter-line">
                      {num}
                    </div>
                  ))}
                </div>
                <div className="cs-editor-container">
                  <div
                    className="cs-editor-highlight"
                    ref={highlightRef}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                  <textarea
                    ref={textareaRef}
                    className="cs-editor-textarea"
                    value={code}
                    onChange={handleCodeChange}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="cs-panel">
            <div className="cs-panel-header">
              <h3 className="cs-panel-title">输出控制台</h3>
              <button className="cs-btn cs-btn-sm" onClick={handleClearOutput}>
                清空
              </button>
            </div>
            <div className="cs-panel-body">
              <div className="cs-stdin-section">
                <div
                  className="cs-stdin-toggle"
                  onClick={() => setStdinExpanded(!stdinExpanded)}
                >
                  <span>
                    {stdinExpanded ? '标准输入' : '标准输入（已折叠，点击展开）'}
                  </span>
                  <span>{stdinExpanded ? '▲' : '▼'}</span>
                </div>
                {stdinExpanded && (
                  <div className="cs-stdin-body">
                    <textarea
                      className="cs-stdin-textarea"
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="在此输入标准输入内容，每行一个输入..."
                      spellCheck={false}
                    />
                  </div>
                )}
              </div>
              <div className="cs-console-wrapper">
                <div className="cs-console-output" ref={consoleRef}>
                  {output.length === 0 ? (
                    <p className="cs-console-line" style={{ color: 'var(--cs-text-secondary)' }}>
                      {OUTPUT_LINE_PREFIX}点击"运行"按钮执行代码...
                    </p>
                  ) : (
                    output.map(formatOutput)
                  )}
                </div>
              </div>
              {duration > 0 && (
                <div className="cs-console-duration">
                  执行耗时: {duration} ms
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cs-bottom-section">
          <div className="cs-panel">
            <div className="cs-panel-header">
              <h3 className="cs-panel-title">
                执行历史
                {history.length > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(var(--cs-primary-rgb), 0.1)',
                      color: 'var(--cs-primary)',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {history.length}
                  </span>
                )}
              </h3>
              {history.length > 0 && (
                <button
                  className="cs-btn cs-btn-sm cs-btn-danger"
                  onClick={handleClearHistory}
                >
                  清空全部
                </button>
              )}
            </div>
            <div className="cs-panel-body cs-history-panel">
              {history.length === 0 ? (
                <div className="cs-empty">暂无执行历史</div>
              ) : (
                <div className="cs-history-list">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="cs-history-item"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <div className="cs-history-item-header">
                        <span className="cs-history-time">
                          {formatTimestamp(item.timestamp)}
                        </span>
                        <span className="cs-history-lang">
                          {LANGUAGE_LABELS[item.language]}
                        </span>
                      </div>
                      <div className="cs-history-code">
                        {truncateCode(item.code, 50)}
                      </div>
                      <div className="cs-history-meta">
                        <span>耗时: {item.duration} ms</span>
                        <span
                          className={`cs-status-badge ${item.success ? 'success' : 'error'}`}
                        >
                          {item.success ? '成功' : '失败'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="cs-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="cs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cs-modal-header">
              <h3 className="cs-modal-title">保存代码片段</h3>
            </div>
            <div className="cs-modal-body">
              <input
                className="cs-input"
                placeholder="请输入代码片段名称"
                value={snippetName}
                onChange={(e) => setSnippetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveConfirm()
                }}
                autoFocus
              />
            </div>
            <div className="cs-modal-footer">
              <button className="cs-btn" onClick={() => setShowSaveModal(false)}>
                取消
              </button>
              <button
                className="cs-btn cs-btn-primary"
                onClick={handleSaveConfirm}
                disabled={!snippetName.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="cs-modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="cs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cs-modal-header">
              <h3 className="cs-modal-title">加载代码片段</h3>
            </div>
            <div className="cs-modal-body">
              {snippets.length === 0 ? (
                <div className="cs-empty">暂无保存的代码片段</div>
              ) : (
                <div className="cs-snippet-list">
                  {snippets.map((snippet) => (
                    <div
                      key={snippet.id}
                      className="cs-snippet-item"
                      onClick={() => handleLoadSnippet(snippet)}
                    >
                      <div className="cs-snippet-header">
                        {editingSnippetId === snippet.id ? (
                          <input
                            className="cs-input"
                            style={{ flex: 1, marginRight: '8px' }}
                            value={editingSnippetName}
                            onChange={(e) => setEditingSnippetName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameConfirm(e, snippet.id)
                              }
                              if (e.key === 'Escape') {
                                setEditingSnippetId(null)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="cs-snippet-name">{snippet.name}</span>
                        )}
                        <div className="cs-snippet-actions">
                          {editingSnippetId === snippet.id ? (
                            <>
                              <button
                                className="cs-icon-btn"
                                onClick={(e) => handleRenameConfirm(e, snippet.id)}
                              >
                                ✓
                              </button>
                              <button
                                className="cs-icon-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingSnippetId(null)
                                }}
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="cs-icon-btn"
                                onClick={(e) => handleRenameClick(e, snippet)}
                                title="重命名"
                              >
                                ✎
                              </button>
                              <button
                                className="cs-icon-btn danger"
                                onClick={(e) => handleDeleteSnippet(e, snippet.id)}
                                title="删除"
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="cs-snippet-meta">
                        <span>{LANGUAGE_LABELS[snippet.language]}</span>
                        <span>{formatTimestamp(snippet.createdAt)}</span>
                        <span>{snippet.lineCount} 行</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="cs-modal-footer">
              <button className="cs-btn" onClick={() => setShowLoadModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeSandboxPage
