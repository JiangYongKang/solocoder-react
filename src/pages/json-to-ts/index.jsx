import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './json-to-ts.css'
import {
  TYPE_MODE,
  parseJson,
  formatJson,
  generateTypeScript,
  extractOptionalMarkers,
  debounce,
  copyToClipboard,
  downloadTsFile,
  getJsonPreviewSummary,
  toPascalCase,
} from './jsonToTsUtils'
import {
  loadHistory,
  addHistoryItem,
  deleteHistoryItem,
  clearAllHistory,
  formatTimestamp,
} from './storage'
import {
  STORAGE_KEY,
  MAX_HISTORY_ITEMS,
  DEBOUNCE_DELAY,
  DEFAULT_ROOT_NAME,
  SAMPLE_JSON,
} from './constants'

const JsonToTsPage = () => {
  const [jsonText, setJsonText] = useState(SAMPLE_JSON)
  const [rootName, setRootName] = useState(DEFAULT_ROOT_NAME)
  const [listName, setListName] = useState(`${DEFAULT_ROOT_NAME}List`)
  const [typeMode, setTypeMode] = useState(TYPE_MODE.INTERFACE_ONLY)
  const [customNames, setCustomNames] = useState({})
  const [editingTypeName, setEditingTypeName] = useState(null)
  const [editingTypeValue, setEditingTypeValue] = useState('')
  const [toast, setToast] = useState(null)
  const [history, setHistory] = useState(() => loadHistory())

  const textareaRef = useRef(null)
  const lineNumbersRef = useRef(null)
  const scrollerRef = useRef(null)
  const debouncedSaveHistoryRef = useRef(null)
  const editingInputRef = useRef(null)

  const parseResult = useMemo(() => {
    if (!jsonText.trim()) {
      return { success: false, error: null, value: null, line: null, column: null }
    }
    return parseJson(jsonText)
  }, [jsonText])

  const optionalMarkers = useMemo(() => {
    return extractOptionalMarkers(jsonText)
  }, [jsonText])

  const generationResult = useMemo(() => {
    if (!parseResult.success || parseResult.value === null) {
      return { code: '', typeDefs: [], rootTypeName: rootName, rootListName: null }
    }
    const mergedCustomNames = { ...customNames }
    if (rootName !== DEFAULT_ROOT_NAME) {
      mergedCustomNames[DEFAULT_ROOT_NAME] = rootName
    }
    const defaultListName = `${DEFAULT_ROOT_NAME}List`
    if (listName !== defaultListName) {
      mergedCustomNames[defaultListName] = listName
    }
    return generateTypeScript(parseResult.value, {
      rootName,
      mode: typeMode,
      optionalMarkers,
      customNames: mergedCustomNames,
    })
  }, [parseResult, rootName, listName, typeMode, optionalMarkers, customNames])

  const { code, typeDefs, rootTypeName, rootListName } = generationResult

  const lineCount = useMemo(() => {
    return jsonText.split('\n').length
  }, [jsonText])

  const lineNumbers = useMemo(() => {
    const arr = []
    for (let i = 1; i <= lineCount; i++) {
      arr.push(i)
    }
    return arr.join('\n')
  }, [lineCount])

  useEffect(() => {
    debouncedSaveHistoryRef.current = debounce(() => {
      if (!parseResult.success || !jsonText.trim()) return
      const summary = getJsonPreviewSummary(jsonText, 80)
      setHistory((prevHistory) => {
        return addHistoryItem(
          {
            jsonText,
            rootName,
            generatedCode: code,
            summary,
          },
          prevHistory
        )
      })
    }, DEBOUNCE_DELAY)
    return () => {
      if (debouncedSaveHistoryRef.current?.cancel) {
        debouncedSaveHistoryRef.current.cancel()
      }
    }
  }, [jsonText, rootName, code, parseResult.success])

  useEffect(() => {
    if (parseResult.success && jsonText.trim()) {
      debouncedSaveHistoryRef.current?.()
    }
  }, [parseResult.success, jsonText, rootName, code])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    if (editingTypeName && editingInputRef.current) {
      editingInputRef.current.focus()
      editingInputRef.current.select()
    }
  }, [editingTypeName])

  const handleScroll = useCallback(() => {
    if (lineNumbersRef.current && scrollerRef.current) {
      lineNumbersRef.current.scrollTop = scrollerRef.current.scrollTop
    }
  }, [])

  const handleJsonChange = useCallback((e) => {
    setJsonText(e.target.value)
  }, [])

  const handleFormat = useCallback(() => {
    const result = formatJson(jsonText)
    if (result.success) {
      setJsonText(result.formatted)
    } else {
      setToast({ type: 'error', message: `格式化失败：${result.error}` })
    }
  }, [jsonText])

  const handleRootNameChange = useCallback((e) => {
    const val = e.target.value.trim()
    if (val) {
      setRootName(toPascalCase(val))
      setListName(`${toPascalCase(val)}List`)
    }
  }, [])

  const handleListNameChange = useCallback((e) => {
    const val = e.target.value.trim()
    if (val) {
      setListName(toPascalCase(val))
    }
  }, [])

  const handleModeToggle = useCallback((e) => {
    const checked = e.target.checked
    setTypeMode(checked ? TYPE_MODE.PREFER_TYPE : TYPE_MODE.INTERFACE_ONLY)
  }, [])

  const handleCopy = useCallback(async () => {
    if (!code) return
    const success = await copyToClipboard(code)
    if (success) {
      setToast({ type: 'success', message: '已复制' })
    } else {
      setToast({ type: 'error', message: '复制失败' })
    }
  }, [code])

  const handleDownload = useCallback(() => {
    if (!code) return
    const filename = `${rootTypeName}.ts`
    const success = downloadTsFile(code, filename)
    if (success) {
      setToast({ type: 'success', message: `已下载 ${filename}` })
    } else {
      setToast({ type: 'error', message: '下载失败' })
    }
  }, [code, rootTypeName])

  const handleTypeNameClick = useCallback((typeDef) => {
    setEditingTypeName(typeDef.name)
    setEditingTypeValue(typeDef.name)
  }, [])

  const handleTypeNameBlur = useCallback(() => {
    if (editingTypeName && editingTypeValue.trim()) {
      const newName = toPascalCase(editingTypeValue.trim())
      if (newName && newName !== editingTypeName) {
        setCustomNames((prev) => ({
          ...prev,
          [editingTypeName]: newName,
        }))
      }
    }
    setEditingTypeName(null)
    setEditingTypeValue('')
  }, [editingTypeName, editingTypeValue])

  const handleTypeNameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleTypeNameBlur()
    } else if (e.key === 'Escape') {
      setEditingTypeName(null)
      setEditingTypeValue('')
    }
  }, [handleTypeNameBlur])

  const handleRestoreHistory = useCallback((item) => {
    setJsonText(item.jsonText)
    setRootName(item.rootName || DEFAULT_ROOT_NAME)
    setListName(`${item.rootName || DEFAULT_ROOT_NAME}List`)
    setCustomNames({})
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

  const handleClear = useCallback(() => {
    setJsonText('')
    setCustomNames({})
  }, [])

  const handleLoadSample = useCallback(() => {
    setJsonText(SAMPLE_JSON)
    setRootName(DEFAULT_ROOT_NAME)
    setListName(`${DEFAULT_ROOT_NAME}List`)
    setCustomNames({})
  }, [])

  const renderOutputWithEditableNames = () => {
    if (!code) {
      return <div className="jtt-output-empty">请输入有效的 JSON 以生成 TypeScript 类型</div>
    }

    const lines = code.split('\n')
    const typeNameRegex = /^(export\s+(interface|type))\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/

    return (
      <pre className="jtt-output-code">
        {lines.map((line, idx) => {
          const match = line.match(typeNameRegex)
          if (match) {
            const [, keyword, , typeName] = match
            const beforeKeyword = line.slice(0, line.indexOf(keyword))
            const afterName = line.slice(line.indexOf(typeName) + typeName.length)

            if (editingTypeName === typeName) {
              return (
                <div key={idx}>
                  {beforeKeyword}
                  {keyword}{' '}
                  <input
                    ref={editingInputRef}
                    className="jtt-type-name-input"
                    value={editingTypeValue}
                    onChange={(e) => setEditingTypeValue(e.target.value)}
                    onBlur={handleTypeNameBlur}
                    onKeyDown={handleTypeNameKeyDown}
                    spellCheck={false}
                  />
                  {afterName}
                </div>
              )
            }

            const typeDef = typeDefs.find((d) => d.name === typeName)
            return (
              <div key={idx}>
                {beforeKeyword}
                {keyword}{' '}
                <span
                  className="jtt-type-name-editable"
                  onClick={() => typeDef && handleTypeNameClick(typeDef)}
                  title="点击编辑类型名"
                >
                  {typeName}
                </span>
                {afterName}
              </div>
            )
          }
          return <div key={idx}>{line}</div>
        })}
      </pre>
    )
  }

  return (
    <div className="jtt-page">
      <div className="jtt-container">
        <header className="jtt-header">
          <Link to="/" className="jtt-back-link">
            ← 返回首页
          </Link>
          <h1 className="jtt-title">JSON 转 TypeScript 类型生成器</h1>
          <div style={{ width: '80px' }} />
        </header>

        <div className="jtt-main-layout">
          <div className="jtt-toolbar-row">
            <label className="jtt-label" htmlFor="root-name-input">
              根类型名称：
            </label>
            <input
              id="root-name-input"
              type="text"
              className="jtt-input"
              value={rootName}
              onChange={handleRootNameChange}
              spellCheck={false}
              style={{ width: '160px' }}
            />
            {rootListName && (
              <>
                <label className="jtt-label" htmlFor="list-name-input">
                  列表类型名：
                </label>
                <input
                  id="list-name-input"
                  type="text"
                  className="jtt-input"
                  value={listName}
                  onChange={handleListNameChange}
                  spellCheck={false}
                  style={{ width: '160px' }}
                />
              </>
            )}
            <label className="jtt-switch">
              <input
                type="checkbox"
                checked={typeMode === TYPE_MODE.PREFER_TYPE}
                onChange={handleModeToggle}
              />
              优先使用 type
            </label>
            <div style={{ flex: 1 }} />
            <button className="jtt-btn" onClick={handleLoadSample}>
              加载示例
            </button>
            <button className="jtt-btn" onClick={handleClear}>
              清空
            </button>
          </div>

          <div className="jtt-panels-row">
            <div className="jtt-panel">
              <div className="jtt-panel-header">
                <h3 className="jtt-panel-title">JSON 输入</h3>
                <button className="jtt-btn jtt-btn-sm" onClick={handleFormat}>
                  格式化
                </button>
              </div>
              <div className="jtt-panel-body">
                <div className="jtt-editor-wrap">
                  <div className="jtt-editor-scroller" ref={scrollerRef} onScroll={handleScroll}>
                    <div className="jtt-line-numbers" ref={lineNumbersRef}>
                      {lineNumbers}
                    </div>
                    <textarea
                      ref={textareaRef}
                      className="jtt-code-textarea"
                      value={jsonText}
                      onChange={handleJsonChange}
                      placeholder="在此粘贴或输入 JSON..."
                      spellCheck={false}
                    />
                  </div>
                </div>
                {parseResult.error && (
                  <div className="jtt-error-box">
                    {parseResult.line ? `第 ${parseResult.line} 行` : ''}
                    {parseResult.column ? `，第 ${parseResult.column} 列` : ''}
                    {parseResult.line || parseResult.column ? '：' : ''}
                    {parseResult.error}
                  </div>
                )}
              </div>
            </div>

            <div className="jtt-panel">
              <div className="jtt-panel-header">
                <h3 className="jtt-panel-title">TypeScript 输出</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="jtt-btn jtt-btn-sm"
                    onClick={handleCopy}
                    disabled={!code}
                  >
                    复制
                  </button>
                  <button
                    className="jtt-btn jtt-btn-sm jtt-btn-primary"
                    onClick={handleDownload}
                    disabled={!code}
                  >
                    下载 .ts 文件
                  </button>
                </div>
              </div>
              <div className="jtt-panel-body">
                <div className="jtt-output-wrap">{renderOutputWithEditableNames()}</div>
              </div>
            </div>
          </div>

          <div className="jtt-history-panel">
            <div className="jtt-history-header">
              <h3 className="jtt-history-title">
                历史记录
                <span className="jtt-history-meta" style={{ marginLeft: '8px' }}>
                  （最多 {MAX_HISTORY_ITEMS} 条）
                </span>
              </h3>
              {history.length > 0 && (
                <button
                  className="jtt-btn jtt-btn-sm jtt-btn-danger"
                  onClick={handleClearAllHistory}
                >
                  清空全部
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="jtt-history-empty">
                暂无历史记录，输入 JSON 并成功生成类型后将自动保存
              </div>
            ) : (
              <>
                <div className="jtt-history-list">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="jtt-history-item"
                      onClick={() => handleRestoreHistory(item)}
                    >
                      <div className="jtt-history-item-top">
                        <span className="jtt-history-root-name">{item.rootName}</span>
                        <div className="jtt-history-actions">
                          <button
                            className="jtt-icon-btn danger"
                            onClick={(e) => handleDeleteHistory(item.id, e)}
                            title="删除"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="jtt-history-summary">{item.summary}</div>
                      <div className="jtt-history-time">
                        {formatTimestamp(item.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="jtt-history-footer">
                  <span className="jtt-history-meta">
                    共 {history.length} 条记录 · 存储于 localStorage（{STORAGE_KEY}）
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          className="jtt-toast"
          style={{
            background:
              toast.type === 'error'
                ? 'var(--jtt-error-bg)'
                : 'var(--jtt-success-bg)',
            color:
              toast.type === 'error'
                ? 'var(--jtt-error-text)'
                : 'var(--jtt-success-text)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default JsonToTsPage
