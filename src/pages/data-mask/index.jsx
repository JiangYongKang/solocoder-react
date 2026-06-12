import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './data-mask.css'
import { PRESET_RULES, SAMPLE_TEXT } from './constants'
import {
  applyRules,
  countSensitiveInfo,
  buildHighlightSegments,
  processBatchLines,
  generateCSV,
  downloadCSV,
  validateRegex,
  debounce,
  getStatsSummary,
} from './dataMaskUtils'
import {
  loadCustomRules,
  addCustomRule,
  deleteCustomRule,
  loadSchemes,
  addScheme,
  deleteScheme,
  saveEnabledRuleIds,
  loadEnabledRuleIds,
} from './storage'

const DataMaskPage = () => {
  const [inputText, setInputText] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newRuleName, setNewRuleName] = useState('')
  const [newRulePattern, setNewRulePattern] = useState('')
  const [newRuleReplacement, setNewRuleReplacement] = useState('***')
  const [patternError, setPatternError] = useState('')
  const [customRules, setCustomRules] = useState(() => loadCustomRules())
  const [schemes, setSchemes] = useState(() => loadSchemes())
  const [activeSchemeId, setActiveSchemeId] = useState(null)
  const [schemeName, setSchemeName] = useState('')
  const [debouncedText, setDebouncedText] = useState('')

  const [presetEnabled, setPresetEnabled] = useState(() => {
    const saved = loadEnabledRuleIds()
    if (saved) {
      const map = {}
      PRESET_RULES.forEach((r) => {
        map[r.id] = saved.includes(r.id)
      })
      return map
    }
    const map = {}
    PRESET_RULES.forEach((r) => {
      map[r.id] = true
    })
    return map
  })

  const [customEnabled, setCustomEnabled] = useState(() => {
    const map = {}
    customRules.forEach((r) => {
      map[r.id] = r.enabled !== false
    })
    return map
  })

  const inputRef = useRef(null)
  const previewRef = useRef(null)
  const batchPreviewRef = useRef(null)

  const allRules = useMemo(() => {
    const presets = PRESET_RULES.map((r) => ({
      ...r,
      enabled: presetEnabled[r.id] !== false,
    }))
    const customs = customRules.map((r) => ({
      ...r,
      enabled: customEnabled[r.id] !== false,
    }))
    return [...presets, ...customs]
  }, [presetEnabled, customRules, customEnabled])

  const enabledRuleIds = useMemo(() => {
    return allRules.filter((r) => r.enabled).map((r) => r.id)
  }, [allRules])

  useEffect(() => {
    saveEnabledRuleIds(enabledRuleIds)
  }, [enabledRuleIds])

  useEffect(() => {
    const debouncedUpdate = debounce((text) => {
      setDebouncedText(text)
    }, 300)
    debouncedUpdate(inputText)
    return () => debouncedUpdate.cancel()
  }, [inputText])

  const maskResult = useMemo(() => {
    if (!debouncedText) return { result: '', matches: [], stats: {} }
    return applyRules(debouncedText, allRules)
  }, [debouncedText, allRules])

  const sensitiveCount = useMemo(() => {
    return countSensitiveInfo(inputText, allRules)
  }, [inputText, allRules])

  const highlightSegments = useMemo(() => {
    if (!debouncedText) return []
    return buildHighlightSegments(debouncedText, debouncedText, allRules)
  }, [debouncedText, allRules])

  const batchResults = useMemo(() => {
    if (!batchMode || !debouncedText) return []
    return processBatchLines(debouncedText, allRules)
  }, [batchMode, debouncedText, allRules])

  const statsSummary = useMemo(() => {
    return getStatsSummary(maskResult.stats, allRules)
  }, [maskResult.stats, allRules])

  const handleTogglePreset = useCallback((id) => {
    setPresetEnabled((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleToggleCustom = useCallback((id) => {
    setCustomEnabled((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleAddCustomRule = useCallback(() => {
    const validation = validateRegex(newRulePattern)
    if (!validation.valid) {
      setPatternError(validation.error)
      return
    }
    setPatternError('')
    const { rules: updated } = addCustomRule(newRuleName, newRulePattern, newRuleReplacement, customRules)
    setCustomRules(updated)
    const newId = updated[updated.length - 1].id
    setCustomEnabled((prev) => ({ ...prev, [newId]: true }))
    setNewRuleName('')
    setNewRulePattern('')
    setNewRuleReplacement('***')
  }, [newRuleName, newRulePattern, newRuleReplacement, customRules])

  const handleDeleteCustomRule = useCallback((id) => {
    const updated = deleteCustomRule(id, customRules)
    setCustomRules(updated)
    setCustomEnabled((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [customRules])

  const handleCopy = useCallback(async () => {
    const textToCopy = batchMode
      ? batchResults.map((r) => r.masked).join('\n')
      : maskResult.result
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // no-op
    }
  }, [batchMode, batchResults, maskResult.result])

  const handleExportCSV = useCallback(() => {
    let csvContent
    if (batchMode) {
      csvContent = generateCSV(batchResults, true)
    } else {
      csvContent = generateCSV([{ original: inputText, masked: maskResult.result }], false)
    }
    downloadCSV(csvContent, 'data-mask-result.csv')
  }, [batchMode, batchResults, inputText, maskResult.result])

  const handleLoadSample = useCallback(() => {
    setInputText(SAMPLE_TEXT)
  }, [])

  const handleClear = useCallback(() => {
    setInputText('')
  }, [])

  const handleSaveScheme = useCallback(() => {
    if (!schemeName.trim()) return
    const { schemes: updated } = addScheme(schemeName, enabledRuleIds, schemes)
    setSchemes(updated)
    setSchemeName('')
  }, [schemeName, enabledRuleIds, schemes])

  const handleDeleteScheme = useCallback((id) => {
    const updated = deleteScheme(id, schemes)
    setSchemes(updated)
    if (activeSchemeId === id) setActiveSchemeId(null)
  }, [schemes, activeSchemeId])

  const handleApplyScheme = useCallback((scheme) => {
    setActiveSchemeId(scheme.id)
    const presetMap = {}
    PRESET_RULES.forEach((r) => {
      presetMap[r.id] = scheme.enabledRuleIds.includes(r.id)
    })
    setPresetEnabled(presetMap)
    const customMap = {}
    customRules.forEach((r) => {
      customMap[r.id] = scheme.enabledRuleIds.includes(r.id)
    })
    setCustomEnabled(customMap)
  }, [customRules])

  const handleInputScroll = useCallback((e) => {
    if (batchMode || !previewRef.current) return
    previewRef.current.scrollTop = e.target.scrollTop
  }, [batchMode])

  const charCount = inputText.length

  const renderPreviewContent = () => {
    if (!debouncedText) {
      return <div className="dm-empty">在左侧输入文本后，此处将显示脱敏预览</div>
    }
    if (highlightSegments.length === 0) {
      return <span>{maskResult.result}</span>
    }
    return highlightSegments.map((seg, idx) => {
      if (seg.type === 'masked') {
        return (
          <span key={idx} className="dm-highlight" title={`规则: ${seg.ruleName}`}>
            {seg.value}
          </span>
        )
      }
      return <span key={idx}>{seg.value}</span>
    })
  }

  const renderBatchTable = () => {
    if (!debouncedText) {
      return <div className="dm-empty">在左侧输入文本后，此处将显示批量脱敏结果</div>
    }
    return (
      <div className="dm-scroll-container" ref={batchPreviewRef} style={{ maxHeight: 500 }}>
        <table className="dm-batch-table">
          <thead>
            <tr>
              <th>#</th>
              <th>原文本</th>
              <th>脱敏结果</th>
            </tr>
          </thead>
          <tbody>
            {batchResults.map((row) => (
              <tr key={row.lineNum}>
                <td className="dm-line-num">{row.lineNum}</td>
                <td>{row.original}</td>
                <td>{row.masked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="dm-page">
      <div className="dm-container">
        <header className="dm-header">
          <Link to="/" className="dm-back-link">← 返回首页</Link>
          <h1 className="dm-title">数据脱敏工具</h1>
          <div className="dm-stats">
            <span className="dm-stat-badge">已处理 {statsSummary.total} 处</span>
          </div>
        </header>

        <div className="dm-toolbar">
          <div className="dm-toolbar-group">
            <button
              className={`dm-toolbar-btn ${!batchMode ? 'active' : ''}`}
              onClick={() => setBatchMode(false)}
            >
              普通模式
            </button>
            <button
              className={`dm-toolbar-btn ${batchMode ? 'active' : ''}`}
              onClick={() => setBatchMode(true)}
            >
              批量模式
            </button>
          </div>
          <div className="dm-toolbar-group">
            <button className="dm-toolbar-btn" onClick={handleLoadSample}>示例数据</button>
            <button className="dm-toolbar-btn" onClick={handleClear}>清空</button>
          </div>
          <div className="dm-toolbar-group">
            <button className="dm-toolbar-btn" onClick={handleCopy}>
              {copied ? <span className="dm-copied-tip">已复制 ✓</span> : '复制脱敏结果'}
            </button>
            <button className="dm-toolbar-btn" onClick={handleExportCSV}>导出 CSV</button>
          </div>
        </div>

        <div className="dm-main-layout">
          <div className="dm-panel">
            <div className="dm-panel-header">
              <h3 className="dm-panel-title">
                {batchMode ? '批量数据输入（每行一条记录）' : '数据输入'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text)' }}>
                {charCount} 字符
              </span>
            </div>
            <div className="dm-panel-body" style={{ display: 'flex', flexDirection: 'column' }}>
              <textarea
                ref={inputRef}
                className="dm-textarea"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onScroll={handleInputScroll}
                placeholder={batchMode ? '每行输入一条待处理记录...' : '在此粘贴或输入包含敏感信息的文本...'}
                spellCheck={false}
              />
              <div className="dm-input-stats">
                <span>总字符数: <b className="dm-stat-count">{charCount}</b></span>
                <span>敏感信息: <b className="dm-stat-count">{sensitiveCount.total}</b> 条</span>
                {Object.entries(sensitiveCount.details).map(([id, info]) => (
                  info.count > 0 && (
                    <span key={id}>{info.name}: <b className="dm-stat-count">{info.count}</b></span>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className="dm-panel">
            <div className="dm-panel-header">
              <h3 className="dm-panel-title">脱敏规则</h3>
            </div>
            <div className="dm-panel-body dm-rules-scroll">
              <div className="dm-section-label">预设规则</div>
              {PRESET_RULES.map((rule) => (
                <div key={rule.id} className={`dm-rule-card ${presetEnabled[rule.id] ? '' : 'disabled'}`}>
                  <div className="dm-rule-card-header">
                    <span className="dm-rule-name">{rule.name}</span>
                    <div
                      className={`dm-rule-toggle ${presetEnabled[rule.id] ? 'active' : ''}`}
                      onClick={() => handleTogglePreset(rule.id)}
                    >
                      <div className="dm-rule-toggle-knob" />
                    </div>
                  </div>
                  <div className="dm-rule-desc">{rule.description}</div>
                  <div className="dm-rule-example">{rule.example}</div>
                </div>
              ))}

              {customRules.length > 0 && (
                <>
                  <div className="dm-section-label">自定义规则</div>
                  {customRules.map((rule) => (
                    <div key={rule.id} className={`dm-rule-card ${customEnabled[rule.id] ? '' : 'disabled'}`}>
                      <div className="dm-rule-card-header">
                        <span className="dm-rule-name">{rule.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            className={`dm-rule-toggle ${customEnabled[rule.id] ? 'active' : ''}`}
                            onClick={() => handleToggleCustom(rule.id)}
                          >
                            <div className="dm-rule-toggle-knob" />
                          </div>
                          <button
                            className="dm-rule-delete"
                            onClick={() => handleDeleteCustomRule(rule.id)}
                            title="删除规则"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="dm-rule-desc">{rule.description}</div>
                      <div className="dm-rule-example">{rule.example}</div>
                    </div>
                  ))}
                </>
              )}

              <div className="dm-add-rule-section">
                <h4 className="dm-add-rule-title">+ 添加自定义规则</h4>
                <div className="dm-add-rule-form">
                  <input
                    className="dm-input"
                    placeholder="规则名称"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                  />
                  <input
                    className={`dm-input ${patternError ? 'dm-input-error' : ''}`}
                    placeholder="正则表达式 (如: \\d{4})"
                    value={newRulePattern}
                    onChange={(e) => {
                      setNewRulePattern(e.target.value)
                      setPatternError('')
                    }}
                    spellCheck={false}
                  />
                  {patternError && <div className="dm-error-msg">{patternError}</div>}
                  <input
                    className="dm-input"
                    placeholder="替换模板 (如: *** 或 $1***$2)"
                    value={newRuleReplacement}
                    onChange={(e) => setNewRuleReplacement(e.target.value)}
                    spellCheck={false}
                  />
                  <button className="dm-btn dm-btn-primary dm-btn-sm" onClick={handleAddCustomRule}>
                    添加规则
                  </button>
                </div>
              </div>

              <div className="dm-scheme-section">
                <h4 className="dm-scheme-title">规则方案</h4>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <input
                    className="dm-input"
                    placeholder="方案名称"
                    value={schemeName}
                    onChange={(e) => setSchemeName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="dm-btn dm-btn-primary dm-btn-sm" onClick={handleSaveScheme}>
                    保存
                  </button>
                </div>
                {schemes.length > 0 && (
                  <div className="dm-scheme-list">
                    {schemes.map((scheme) => (
                      <div
                        key={scheme.id}
                        className={`dm-scheme-item ${activeSchemeId === scheme.id ? 'active' : ''}`}
                        onClick={() => handleApplyScheme(scheme)}
                      >
                        <span className="dm-scheme-name">{scheme.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text)' }}>
                          {scheme.enabledRuleIds.length} 条规则
                        </span>
                        <button
                          className="dm-rule-delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteScheme(scheme.id)
                          }}
                          title="删除方案"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dm-panel">
            <div className="dm-panel-header">
              <h3 className="dm-panel-title">脱敏预览</h3>
              <div className="dm-preview-stats">
                {statsSummary.total > 0 && (
                  <span className="dm-stat-item">
                    共处理 <b className="dm-stat-count">{statsSummary.total}</b> 处
                  </span>
                )}
                {statsSummary.details.map((d, i) => (
                  <span key={i} className="dm-stat-item">
                    {d.name} <b className="dm-stat-count">{d.count}</b>
                  </span>
                ))}
              </div>
            </div>
            <div className="dm-panel-body">
              {batchMode ? renderBatchTable() : (
                <div className="dm-preview-content" ref={previewRef}>
                  {renderPreviewContent()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataMaskPage
