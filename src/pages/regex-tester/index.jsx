import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './regex-tester.css'
import {
  DEFAULT_FLAGS,
  buildFlagsString,
  findAllMatches,
  hasCaptureGroups,
  replaceText,
  buildHighlightSegments,
  truncateText,
  createRegex,
} from './regexUtils'
import {
  loadHistory,
  addHistoryItem,
  deleteHistoryItem,
  clearAllHistory,
  toggleFavorite,
  formatTimestamp,
} from './storage'
import { REGEX_TEMPLATES } from './templates'

const SAMPLE_PATTERN = '(\\w+)@(\\w+)\\.(\\w+)'
const SAMPLE_TEXT = `请联系以下邮箱获取更多信息：

1. 技术支持：support@example.com
2. 销售咨询：sales@company.org
3. 行政事务：admin@test.cn
4. 个人邮箱：john.doe@gmail.com

这是一些非邮箱文本：
- hello world
- 123456
- @invalid.com`

const GROUP_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

const getGroupColor = (index) => GROUP_COLORS[index % GROUP_COLORS.length]

const renderDiffSegments = (original, modified) => {
  if (original === modified) {
    return [<span key="same">{original}</span>]
  }
  const segments = []
  const minLen = Math.min(original.length, modified.length)
  let i = 0
  while (i < minLen && original[i] === modified[i]) {
    i++
  }
  if (i > 0) {
    segments.push(<span key={`prefix-${i}`}>{original.slice(0, i)}</span>)
  }
  if (original.length > i) {
    segments.push(
      <span key={`removed-${i}`} className="rt-diff-remove">
        {original.slice(i)}
      </span>
    )
  }
  if (modified.length > i) {
    segments.push(
      <span key={`added-${i}`} className="rt-diff-add">
        {modified.slice(i)}
      </span>
    )
  }
  return segments
}

const RegexTesterPage = () => {
  const [pattern, setPattern] = useState(SAMPLE_PATTERN)
  const [flags, setFlags] = useState(DEFAULT_FLAGS)
  const [testText, setTestText] = useState(SAMPLE_TEXT)
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1)
  const [expandedCategories, setExpandedCategories] = useState(() => {
    return REGEX_TEMPLATES.reduce((acc, cat) => {
      acc[cat.category] = false
      return acc
    }, {})
  })
  const [history, setHistory] = useState(() => loadHistory())
  const [historyFilter, setHistoryFilter] = useState('all')
  const [replacement, setReplacement] = useState('')
  const [replaceResult, setReplaceResult] = useState(null)

  const textEditorRef = useRef(null)
  const textareaRef = useRef(null)

  const regexValidation = useMemo(() => {
    if (!pattern) return { valid: true, error: null }
    return createRegex(pattern, flags)
  }, [pattern, flags])

  const matchResult = useMemo(() => {
    return findAllMatches(pattern, flags, testText)
  }, [pattern, flags, testText])

  const { matches, error: matchError } = matchResult

  const hasGroups = useMemo(() => hasCaptureGroups(pattern), [pattern])

  const highlightSegments = useMemo(() => {
    return buildHighlightSegments(testText, matches)
  }, [testText, matches])

  const flagString = useMemo(() => buildFlagsString(flags), [flags])

  useEffect(() => {
    if (activeMatchIndex >= 0) {
      const timer = setTimeout(() => setActiveMatchIndex(-1), 2000)
      return () => clearTimeout(timer)
    }
  }, [activeMatchIndex])

  const handlePatternChange = useCallback((e) => {
    setPattern(e.target.value)
  }, [])

  const handleTestTextChange = useCallback((e) => {
    setTestText(e.target.value)
  }, [])

  const toggleFlag = useCallback((flagKey) => {
    setFlags((prev) => ({ ...prev, [flagKey]: !prev[flagKey] }))
  }, [])

  const handleMatchClick = useCallback(
    (match) => {
      setActiveMatchIndex(match.index)
      if (textareaRef.current) {
        const textarea = textareaRef.current
        const text = testText
        const linesBefore = text.slice(0, match.start).split('\n').length - 1
        textarea.focus()
        try {
          textarea.setSelectionRange(match.start, match.end)
        } catch {
          // no-op
        }
        const lineHeight = 23.8
        const scrollTop = Math.max(0, linesBefore * lineHeight - textarea.clientHeight / 3)
        textarea.scrollTop = scrollTop
      }
    },
    [testText]
  )

  const handleSaveHistory = useCallback(() => {
    if (!pattern) return
    const newHistory = addHistoryItem(pattern, flags, testText, history)
    setHistory(newHistory)
  }, [pattern, flags, testText, history])

  const handleRestoreHistory = useCallback((item) => {
    setPattern(item.pattern)
    setFlags({ ...DEFAULT_FLAGS, ...(item.flags || {}) })
    setTestText(item.testText || '')
  }, [])

  const handleDeleteHistory = useCallback(
    (id, e) => {
      e.stopPropagation()
      const newHistory = deleteHistoryItem(id, history)
      setHistory(newHistory)
    },
    [history]
  )

  const handleClearAllHistory = useCallback(() => {
    const newHistory = clearAllHistory()
    setHistory(newHistory)
  }, [])

  const handleToggleFavorite = useCallback(
    (id, e) => {
      e.stopPropagation()
      const newHistory = toggleFavorite(id, history)
      setHistory(newHistory)
    },
    [history]
  )

  const toggleCategory = useCallback((category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }, [])

  const handleTemplateClick = useCallback((tpl) => {
    setPattern(tpl.pattern)
  }, [])

  const handleReplace = useCallback(
    (replaceAll) => {
      const result = replaceText(pattern, flags, testText, replacement, replaceAll)
      setReplaceResult(result)
    },
    [pattern, flags, testText, replacement]
  )

  const handleCopyResult = useCallback(async () => {
    if (!replaceResult?.success) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(replaceResult.result)
      }
    } catch {
      // no-op
    }
  }, [replaceResult])

  const handleLoadSample = useCallback(() => {
    setPattern(SAMPLE_PATTERN)
    setFlags(DEFAULT_FLAGS)
    setTestText(SAMPLE_TEXT)
    setReplaceResult(null)
  }, [])

  const handleClear = useCallback(() => {
    setPattern('')
    setTestText('')
    setReplaceResult(null)
    setActiveMatchIndex(-1)
  }, [])

  const filteredHistory = useMemo(() => {
    let list = history
    if (historyFilter === 'favorites') {
      list = list.filter((item) => item.favorite)
    }
    return list
  }, [history, historyFilter])

  const renderHighlightedText = () => {
    if (testText === '') {
      return <span className="rt-text-highlight" />
    }
    return (
      <div className="rt-text-highlight" ref={textEditorRef} aria-hidden="true">
        {highlightSegments.map((seg, idx) => {
          if (seg.type === 'match') {
            return (
              <span
                key={idx}
                className={`rt-match-highlight ${
                  seg.matchIndex === activeMatchIndex ? 'active' : ''
                }`}
              >
                {seg.value}
              </span>
            )
          }
          return <span key={idx}>{seg.value}</span>
        })}
      </div>
    )
  }

  return (
    <div className="rt-page">
      <div className="rt-container">
        <header className="rt-header">
          <Link to="/" className="rt-back-link">
            ← 返回首页
          </Link>
          <h1 className="rt-title">正则表达式测试器</h1>
          <div className="rt-stats">
            <span className="rt-stat-badge">{matches.length} 个匹配</span>
          </div>
        </header>

        <div className="rt-main-layout">
          <div className="rt-main-col">
            <div className="rt-panel">
              <div className="rt-panel-header">
                <h3 className="rt-panel-title">正则表达式</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="rt-btn rt-btn-sm" onClick={handleLoadSample}>
                    示例
                  </button>
                  <button className="rt-btn rt-btn-sm" onClick={handleClear}>
                    清空
                  </button>
                </div>
              </div>
              <div className="rt-panel-body">
                <div className="rt-regex-input-wrap">
                  <span className="rt-regex-delim">/</span>
                  <input
                    type="text"
                    className={`rt-regex-input ${
                      !regexValidation.valid && pattern ? 'error' : ''
                    }`}
                    value={pattern}
                    onChange={handlePatternChange}
                    placeholder="输入正则表达式..."
                    spellCheck={false}
                  />
                  <span className="rt-regex-delim">/{flagString}</span>
                </div>

                <div className="rt-flags-row">
                  <label className="rt-flag">
                    <input
                      type="checkbox"
                      checked={flags.global}
                      onChange={() => toggleFlag('global')}
                    />
                    <span className="rt-flag-char">g</span>
                    <span className="rt-flag-label">全局匹配</span>
                  </label>
                  <label className="rt-flag">
                    <input
                      type="checkbox"
                      checked={flags.ignoreCase}
                      onChange={() => toggleFlag('ignoreCase')}
                    />
                    <span className="rt-flag-char">i</span>
                    <span className="rt-flag-label">忽略大小写</span>
                  </label>
                  <label className="rt-flag">
                    <input
                      type="checkbox"
                      checked={flags.multiline}
                      onChange={() => toggleFlag('multiline')}
                    />
                    <span className="rt-flag-char">m</span>
                    <span className="rt-flag-label">多行模式</span>
                  </label>
                  <label className="rt-flag">
                    <input
                      type="checkbox"
                      checked={flags.dotAll}
                      onChange={() => toggleFlag('dotAll')}
                    />
                    <span className="rt-flag-char">s</span>
                    <span className="rt-flag-label">点匹配换行</span>
                  </label>
                </div>

                {!regexValidation.valid && pattern && (
                  <div className="rt-error-msg">正则语法错误：{regexValidation.error}</div>
                )}
                {matchError && !regexValidation.error && (
                  <div className="rt-error-msg">匹配错误：{matchError}</div>
                )}
              </div>
            </div>

            <div className="rt-panel" style={{ flex: 1, minHeight: 0 }}>
              <div className="rt-panel-header">
                <h3 className="rt-panel-title">测试文本</h3>
                <button className="rt-btn rt-btn-sm rt-btn-primary" onClick={handleSaveHistory}>
                  保存到历史
                </button>
              </div>
              <div className="rt-panel-body" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="rt-text-editor-wrap">
                  <div className="rt-text-editor">
                    {renderHighlightedText()}
                    <textarea
                      ref={textareaRef}
                      className="rt-text-textarea"
                      value={testText}
                      onChange={handleTestTextChange}
                      placeholder="在此输入要测试的文本..."
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rt-panel">
              <div className="rt-panel-header">
                <h3 className="rt-panel-title">替换功能</h3>
              </div>
              <div className="rt-panel-body">
                <div className="rt-replace-section">
                  <div className="rt-replace-row">
                    <input
                      type="text"
                      className="rt-replace-input"
                      placeholder="替换文本 (支持 $1, $2 等捕获组引用)"
                      value={replacement}
                      onChange={(e) => setReplacement(e.target.value)}
                      spellCheck={false}
                    />
                  </div>
                  <div className="rt-replace-btns">
                    <button
                      className="rt-btn rt-btn-primary"
                      onClick={() => handleReplace(false)}
                    >
                      替换第一个
                    </button>
                    <button
                      className="rt-btn rt-btn-primary"
                      onClick={() => handleReplace(true)}
                    >
                      全部替换
                    </button>
                    {replaceResult?.success && (
                      <button className="rt-btn" onClick={handleCopyResult}>
                        复制结果
                      </button>
                    )}
                  </div>

                  {replaceResult && !replaceResult.success && (
                    <div className="rt-error-msg">替换错误：{replaceResult.error}</div>
                  )}

                  {replaceResult?.success && (
                    <div className="rt-diff-preview">
                      <div className="rt-diff-pane">
                        <div className="rt-diff-pane-label">原文本</div>
                        <div className="rt-diff-pane-body">{testText || '(空)'}</div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--rt-border)' }} />
                      <div className="rt-diff-pane">
                        <div className="rt-diff-pane-label">替换结果</div>
                        <div className="rt-diff-pane-body">
                          {testText === replaceResult.result ? (
                            replaceResult.result || '(空)'
                          ) : (
                            renderDiffSegments(testText, replaceResult.result)
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rt-side-panel">
            <div className="rt-panel">
              <div className="rt-panel-header">
                <h3 className="rt-panel-title">
                  匹配结果
                  {matches.length > 0 && (
                    <span
                      style={{
                        marginLeft: '6px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(var(--rt-primary-rgb), 0.1)',
                        color: 'var(--rt-primary)',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      {matches.length}
                    </span>
                  )}
                </h3>
              </div>
              <div className="rt-panel-body">
                {matches.length === 0 ? (
                  <div className="rt-empty">暂无匹配结果</div>
                ) : (
                  <div className="rt-matches-list">
                    {matches.map((match) => (
                      <div
                        key={match.index}
                        className={`rt-match-item ${
                          activeMatchIndex === match.index ? 'active' : ''
                        }`}
                        onClick={() => handleMatchClick(match)}
                      >
                        <div className="rt-match-header">
                          <span className="rt-match-index">#{match.index + 1}</span>
                          <span className="rt-match-pos">
                            [{match.start}, {match.end})
                          </span>
                        </div>
                        <div className="rt-match-text">
                          {match.text || <span style={{ color: 'var(--rt-text-secondary)', fontStyle: 'italic' }}>(空字符串)</span>}
                        </div>
                        {hasGroups && match.groups.length > 0 && (
                          <div className="rt-match-groups">
                            <div className="rt-match-groups-title">捕获组</div>
                            {match.groups.map((g) => (
                              <div key={g.index} className="rt-group-item">
                                <span className="rt-group-label">
                                  <span
                                    className="rt-group-tag"
                                    style={{ background: getGroupColor(g.index - 1) }}
                                  >
                                    ${g.index}
                                  </span>
                                </span>
                                <span
                                  className={`rt-group-value ${
                                    g.value == null ? 'empty' : ''
                                  }`}
                                >
                                  {g.value == null ? '(未匹配)' : g.value}
                                </span>
                              </div>
                            ))}
                            {Object.keys(match.namedGroups).length > 0 &&
                              Object.entries(match.namedGroups).map(([name, val]) => (
                                <div key={`named-${name}`} className="rt-group-item">
                                  <span className="rt-group-label">
                                    <span
                                      className="rt-group-tag"
                                      style={{ background: getGroupColor(0) }}
                                    >
                                      {name}
                                    </span>
                                  </span>
                                  <span
                                    className={`rt-group-value ${
                                      val == null ? 'empty' : ''
                                    }`}
                                  >
                                    {val == null ? '(未匹配)' : val}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rt-side-panel">
            <div className="rt-panel">
              <div className="rt-panel-header">
                <h3 className="rt-panel-title">常用正则</h3>
              </div>
              <div className="rt-panel-body">
                {REGEX_TEMPLATES.map((cat) => (
                  <div key={cat.category} className="rt-collapsible-section">
                    <div
                      className="rt-collapsible-header"
                      onClick={() => toggleCategory(cat.category)}
                    >
                      <span>{cat.category}</span>
                      <span
                        className={`rt-collapsible-arrow ${
                          expandedCategories[cat.category] ? 'expanded' : ''
                        }`}
                      >
                        ▶
                      </span>
                    </div>
                    {expandedCategories[cat.category] && (
                      <div className="rt-template-list">
                        {cat.items.map((tpl, idx) => (
                          <div
                            key={idx}
                            className="rt-template-item"
                            onClick={() => handleTemplateClick(tpl)}
                            title={tpl.description}
                          >
                            <div className="rt-template-name">{tpl.name}</div>
                            <div className="rt-template-pattern">{tpl.pattern}</div>
                            <div className="rt-template-desc">{tpl.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rt-panel" style={{ flex: 1, minHeight: 0 }}>
              <div className="rt-panel-header">
                <h3 className="rt-panel-title">历史记录</h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <select
                    className="rt-btn rt-btn-sm"
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    style={{
                      padding: '3px 8px',
                      fontFamily: 'inherit',
                      fontSize: '11px',
                      background: 'var(--rt-background)',
                    }}
                  >
                    <option value="all">全部</option>
                    <option value="favorites">收藏</option>
                  </select>
                </div>
              </div>
              <div className="rt-panel-body">
                {filteredHistory.length === 0 ? (
                  <div className="rt-empty">暂无历史记录</div>
                ) : (
                  <>
                    <div className="rt-history-list">
                      {filteredHistory.map((item) => (
                        <div
                          key={item.id}
                          className="rt-history-item"
                          onClick={() => handleRestoreHistory(item)}
                        >
                          <div className="rt-history-top">
                            <div className="rt-history-pattern">
                              {truncateText(item.pattern, 40)}
                            </div>
                            <div className="rt-history-actions">
                              <button
                                className={`rt-icon-btn ${item.favorite ? 'active' : ''}`}
                                onClick={(e) => handleToggleFavorite(item.id, e)}
                                title={item.favorite ? '取消收藏' : '收藏'}
                              >
                                {item.favorite ? '★' : '☆'}
                              </button>
                              <button
                                className="rt-icon-btn danger"
                                onClick={(e) => handleDeleteHistory(item.id, e)}
                                title="删除"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          <div className="rt-history-meta">
                            <span>{formatTimestamp(item.timestamp)}</span>
                            <span className="rt-history-flags">
                              {Object.entries(item.flags || {})
                                .filter(([, v]) => v)
                                .map(([k]) => {
                                  const charMap = {
                                    global: 'g',
                                    ignoreCase: 'i',
                                    multiline: 'm',
                                    dotAll: 's',
                                  }
                                  return (
                                    <span key={k} className="rt-flag-chip">
                                      {charMap[k]}
                                    </span>
                                  )
                                })}
                            </span>
                          </div>
                          <div className="rt-history-text-preview">
                            {truncateText(item.testText || '', 60)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {history.length > 0 && (
                      <div className="rt-actions-row">
                        <button
                          className="rt-btn rt-btn-sm rt-btn-danger"
                          onClick={handleClearAllHistory}
                        >
                          清空全部
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegexTesterPage
