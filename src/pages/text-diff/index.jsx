import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './text-diff.css'
import {
  computeAllDiffStats,
  computeCombinedWordFrequency,
  buildLineDiffPairs,
  computeCharDiffForLine,
  getSimilarityColor,
} from './textDiffStats'
import { loadHistory, addHistoryItem, removeHistoryItem, clearHistory } from './storage'

const SAMPLE_TEXT_A = `The quick brown fox jumps over the lazy dog.
This is a sample text for testing.
Hello world!
Programming is fun.
Learning React components.`

const SAMPLE_TEXT_B = `The quick brown cat jumps over the lazy dog.
This is a example text for testing.
Hello there!
Coding is fun.
Building React applications.`

const SimilarityRing = ({ value, label, size = 80, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = getSimilarityColor(value)

  return (
    <div className="tds-similarity-ring" title={`相似度: ${value}%`}>
      <svg width={size} height={size}>
        <circle
          className="tds-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="tds-ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={color}
        />
      </svg>
      <div className="tds-ring-content">
        <span className="tds-ring-value" style={{ color }}>{value}%</span>
        <span className="tds-ring-label">{label}</span>
      </div>
    </div>
  )
}

const CharDiffSpan = ({ charDiff, side }) => {
  if (!charDiff || charDiff.length === 0) return null
  return charDiff.map((segment, idx) => {
    if (segment.type === 'added' && side === 'left') return null
    if (segment.type === 'removed' && side === 'right') return null

    const isDiff = (side === 'left' && segment.type === 'removed') ||
                   (side === 'right' && segment.type === 'added')

    if (isDiff) {
      return (
        <span key={idx} className="tds-char-diff">
          {segment.value}
        </span>
      )
    }
    return <span key={idx}>{segment.value}</span>
  })
}

const TextDiffStatsPage = () => {
  const [titleA, setTitleA] = useState('文本 A')
  const [titleB, setTitleB] = useState('文本 B')
  const [textA, setTextA] = useState(SAMPLE_TEXT_A)
  const [textB, setTextB] = useState(SAMPLE_TEXT_B)
  const [showDiffOnly, setShowDiffOnly] = useState(false)
  const [syncScroll, setSyncScroll] = useState(true)
  const [wordFreqTopN, setWordFreqTopN] = useState(20)
  const [showDiffWordsOnly, setShowDiffWordsOnly] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState(() => {
    if (typeof window === 'undefined') return []
    return loadHistory()
  })

  const leftTextareaRef = useRef(null)
  const rightTextareaRef = useRef(null)
  const diffScrollRef = useRef(null)
  const leftFileInputRef = useRef(null)
  const rightFileInputRef = useRef(null)
  const isSyncingRef = useRef(false)

  const saveToHistory = useCallback(() => {
    const updated = addHistoryItem({ titleA, titleB, textA, textB })
    setHistory(updated)
  }, [titleA, titleB, textA, textB])

  const diffStats = useMemo(() => {
    return computeAllDiffStats(textA, textB)
  }, [textA, textB])

  const lineDiffResult = useMemo(() => {
    return buildLineDiffPairs(textA, textB)
  }, [textA, textB])

  const wordFrequency = useMemo(() => {
    return computeCombinedWordFrequency(textA, textB, wordFreqTopN, showDiffWordsOnly)
  }, [textA, textB, wordFreqTopN, showDiffWordsOnly])

  const filteredPairs = useMemo(() => {
    if (!showDiffOnly) return lineDiffResult.pairs
    return lineDiffResult.pairs.filter((p) => p.type !== 'equal')
  }, [lineDiffResult.pairs, showDiffOnly])

  const handleClear = useCallback(() => {
    setTextA('')
    setTextB('')
  }, [])

  const handleLoadSample = useCallback(() => {
    setTextA(SAMPLE_TEXT_A)
    setTextB(SAMPLE_TEXT_B)
    setTitleA('文本 A')
    setTitleB('文本 B')
  }, [])

  const handleFileSelect = useCallback(async (e, side) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const content = await file.text()
      if (side === 'left') {
        setTextA(content)
      } else {
        setTextB(content)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleScrollSync = useCallback((sourceSide, e) => {
    if (!syncScroll || isSyncingRef.current) return
    isSyncingRef.current = true

    const source = e.target
    const scrollRatio = source.scrollTop / (source.scrollHeight - source.clientHeight)

    const targets = []
    if (sourceSide === 'left-input') {
      if (rightTextareaRef.current) targets.push(rightTextareaRef.current)
      if (diffScrollRef.current) targets.push(diffScrollRef.current)
    } else if (sourceSide === 'right-input') {
      if (leftTextareaRef.current) targets.push(leftTextareaRef.current)
      if (diffScrollRef.current) targets.push(diffScrollRef.current)
    } else if (sourceSide === 'diff') {
      if (leftTextareaRef.current) targets.push(leftTextareaRef.current)
      if (rightTextareaRef.current) targets.push(rightTextareaRef.current)
    }

    targets.forEach((target) => {
      const targetScrollTop = scrollRatio * (target.scrollHeight - target.clientHeight)
      target.scrollTop = targetScrollTop
    })

    requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }, [syncScroll])

  const handleHistorySelect = useCallback((item) => {
    setTitleA(item.titleA)
    setTitleB(item.titleB)
    setTextA(item.textA)
    setTextB(item.textB)
    setShowHistory(false)
  }, [])

  const handleHistoryDelete = useCallback((id, e) => {
    e.stopPropagation()
    const updated = removeHistoryItem(id)
    setHistory(updated)
  }, [])

  const handleClearHistory = useCallback(() => {
    clearHistory()
    setHistory([])
  }, [])

  return (
    <div className="tds-page">
      <div className="tds-container">
        <header className="tds-header">
          <Link to="/" className="tds-back-link">← 返回首页</Link>
          <h1 className="tds-title">文本差异统计工具</h1>
          <div className="tds-header-actions">
            <button
              type="button"
              className="tds-btn tds-btn-secondary"
              onClick={() => setShowHistory(!showHistory)}
            >
              📜 历史记录
            </button>
            <button
              type="button"
              className="tds-btn tds-btn-primary"
              onClick={saveToHistory}
            >
              💾 保存
            </button>
          </div>
        </header>

        {showHistory && (
          <div className="tds-history-panel">
            <div className="tds-history-header">
              <span className="tds-history-title">历史记录</span>
              <button
                type="button"
                className="tds-btn tds-btn-ghost"
                onClick={handleClearHistory}
              >
                清空全部
              </button>
            </div>
            <div className="tds-history-list">
              {history.length === 0 ? (
                <div className="tds-history-empty">暂无历史记录</div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="tds-history-item"
                    onClick={() => handleHistorySelect(item)}
                  >
                    <div className="tds-history-item-content">
                      <div className="tds-history-item-titles">
                        <span className="tds-history-item-title">{item.titleA}</span>
                        <span className="tds-history-item-vs">vs</span>
                        <span className="tds-history-item-title">{item.titleB}</span>
                      </div>
                      <div className="tds-history-item-time">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="tds-history-item-delete"
                      onClick={(e) => handleHistoryDelete(item.id, e)}
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="tds-stats-bar">
          <div className="tds-stats-counts">
            <div className="tds-stat-item">
              <span className="tds-stat-label">字符差异</span>
              <span className="tds-stat-value tds-stat-diff">{diffStats.char.diff}</span>
            </div>
            <div className="tds-stat-item">
              <span className="tds-stat-label">单词差异</span>
              <span className="tds-stat-value tds-stat-diff">{diffStats.word.diff}</span>
            </div>
            <div className="tds-stat-item">
              <span className="tds-stat-label">行差异</span>
              <span className="tds-stat-value tds-stat-diff">{diffStats.line.diff}</span>
            </div>
          </div>
          <div className="tds-similarity-rings">
            <SimilarityRing value={diffStats.char.similarity} label="字符" />
            <SimilarityRing value={diffStats.word.similarity} label="单词" />
            <SimilarityRing value={diffStats.line.similarity} label="行" />
          </div>
        </div>

        <div className="tds-toolbar">
          <div className="tds-toolbar-left">
            <label className="tds-toggle">
              <input
                type="checkbox"
                checked={syncScroll}
                onChange={(e) => setSyncScroll(e.target.checked)}
              />
              <span>锁定同步滚动</span>
            </label>
            <label className="tds-toggle">
              <input
                type="checkbox"
                checked={showDiffOnly}
                onChange={(e) => setShowDiffOnly(e.target.checked)}
              />
              <span>仅显示差异行</span>
            </label>
          </div>
          <div className="tds-toolbar-right">
            <button type="button" className="tds-btn tds-btn-ghost" onClick={handleClear}>
              清空
            </button>
            <button type="button" className="tds-btn tds-btn-ghost" onClick={handleLoadSample}>
              使用示例文本
            </button>
          </div>
        </div>

        <div className="tds-input-section">
          <div className="tds-input-pane">
            <div className="tds-pane-header">
              <input
                type="text"
                className="tds-title-input"
                value={titleA}
                onChange={(e) => setTitleA(e.target.value)}
                placeholder="输入标题..."
              />
              <div className="tds-pane-actions">
                <button
                  type="button"
                  className="tds-pane-btn"
                  onClick={() => leftFileInputRef.current?.click()}
                  title="从文件加载"
                >
                  📁 文件
                </button>
                <button
                  type="button"
                  className="tds-pane-btn"
                  onClick={handleClear}
                  title="清空"
                >
                  🗑️ 清空
                </button>
              </div>
            </div>
            <textarea
              ref={leftTextareaRef}
              className="tds-textarea"
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              onScroll={(e) => handleScrollSync('left-input', e)}
              placeholder="在此输入或粘贴文本..."
              spellCheck={false}
            />
            <div className="tds-pane-footer">
              <span>{textA.length} 字符 · {textA.split('\n').length} 行</span>
            </div>
          </div>

          <div className="tds-input-pane">
            <div className="tds-pane-header">
              <input
                type="text"
                className="tds-title-input"
                value={titleB}
                onChange={(e) => setTitleB(e.target.value)}
                placeholder="输入标题..."
              />
              <div className="tds-pane-actions">
                <button
                  type="button"
                  className="tds-pane-btn"
                  onClick={() => rightFileInputRef.current?.click()}
                  title="从文件加载"
                >
                  📁 文件
                </button>
                <button
                  type="button"
                  className="tds-pane-btn"
                  onClick={handleClear}
                  title="清空"
                >
                  🗑️ 清空
                </button>
              </div>
            </div>
            <textarea
              ref={rightTextareaRef}
              className="tds-textarea"
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              onScroll={(e) => handleScrollSync('right-input', e)}
              placeholder="在此输入或粘贴文本..."
              spellCheck={false}
            />
            <div className="tds-pane-footer">
              <span>{textB.length} 字符 · {textB.split('\n').length} 行</span>
            </div>
          </div>
        </div>

        <input
          ref={leftFileInputRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          className="tds-hidden-file"
          onChange={(e) => handleFileSelect(e, 'left')}
        />
        <input
          ref={rightFileInputRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          className="tds-hidden-file"
          onChange={(e) => handleFileSelect(e, 'right')}
        />

        <div className="tds-main-content">
          <div className="tds-diff-section">
            <div className="tds-section-header">
              <h2 className="tds-section-title">差异对比视图</h2>
            </div>
            <div className="tds-diff-container">
              <div className="tds-diff-headers-row">
                <div className="tds-diff-header-col">#</div>
                <div className="tds-diff-header-col">{titleA || '文本 A'}</div>
                <div className="tds-diff-header-col">#</div>
                <div className="tds-diff-header-col">{titleB || '文本 B'}</div>
              </div>
              <div
                ref={diffScrollRef}
                className="tds-diff-content"
                onScroll={(e) => handleScrollSync('diff', e)}
              >
                <div className="tds-side-by-side">
                  {filteredPairs.map((pair, idx) => {
                    const showCharDiff = pair.type === 'modified'
                    return (
                      <div key={idx} className="tds-diff-row" style={{ display: 'contents' }}>
                        <div className={`tds-line-num tds-line-num-left ${pair.leftIndex != null ? '' : 'tds-line-num-empty'}`}>
                          {pair.leftIndex != null ? pair.leftIndex + 1 : ''}
                        </div>
                        <div className={`tds-line-content tds-line-content-left ${
                          (pair.type === 'removed' || pair.type === 'modified')
                            ? 'tds-line-diff'
                            : ''
                        }`}>
                          {showCharDiff
                            ? <CharDiffSpan charDiff={computeCharDiffForLine(pair.leftContent, pair.rightContent)} side="left" />
                            : <span>{pair.leftContent || '\u00A0'}</span>
                          }
                        </div>
                        <div className={`tds-line-num tds-line-num-right ${pair.rightIndex != null ? '' : 'tds-line-num-empty'}`}>
                          {pair.rightIndex != null ? pair.rightIndex + 1 : ''}
                        </div>
                        <div className={`tds-line-content tds-line-content-right ${
                          (pair.type === 'added' || pair.type === 'modified')
                            ? 'tds-line-diff'
                            : ''
                        }`}>
                          {showCharDiff
                            ? <CharDiffSpan charDiff={computeCharDiffForLine(pair.leftContent, pair.rightContent)} side="right" />
                            : <span>{pair.rightContent || '\u00A0'}</span>
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="tds-wordfreq-section">
            <div className="tds-section-header">
              <h2 className="tds-section-title">词频统计</h2>
              <div className="tds-section-actions">
                <label className="tds-toggle">
                  <input
                    type="checkbox"
                    checked={showDiffWordsOnly}
                    onChange={(e) => setShowDiffWordsOnly(e.target.checked)}
                  />
                  <span>只显示差异词语</span>
                </label>
                <select
                  className="tds-select"
                  value={wordFreqTopN}
                  onChange={(e) => setWordFreqTopN(Number(e.target.value))}
                >
                  <option value={20}>Top 20</option>
                  <option value={50}>Top 50</option>
                  <option value={0}>全部</option>
                </select>
              </div>
            </div>
            <div className="tds-wordfreq-table-container">
              <table className="tds-wordfreq-table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>词语</th>
                    <th className="tds-text-right">文本 A</th>
                    <th className="tds-text-right">文本 B</th>
                    <th className="tds-text-right">A 占比</th>
                    <th className="tds-text-right">B 占比</th>
                  </tr>
                </thead>
                <tbody>
                  {wordFrequency.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="tds-empty-cell">暂无数据</td>
                    </tr>
                  ) : (
                    wordFrequency.map((item, idx) => (
                      <tr key={item.word}>
                        <td>{idx + 1}</td>
                        <td className="tds-word-cell">{item.word}</td>
                        <td className="tds-text-right">{item.countA}</td>
                        <td className="tds-text-right">{item.countB}</td>
                        <td className="tds-text-right">{item.percentageA}%</td>
                        <td className="tds-text-right">{item.percentageB}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextDiffStatsPage
