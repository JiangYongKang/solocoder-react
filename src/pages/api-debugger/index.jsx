import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HTTP_METHODS,
  CONTENT_TYPE_PRESETS,
  isBodyMethod,
  createEmptyKeyValue,
  formatJson,
  minifyJson,
  isValidJson,
  replaceEnvVariables,
  buildUrl,
  getStatusCodeCategory,
  formatBytes,
  formatDuration,
  formatTimestamp,
  createHistoryRecord,
  addHistory,
  deleteHistory,
  clearHistory,
  toggleHistoryFavorite,
  sortHistory,
  loadHistory,
  saveHistory,
  createEnvironment,
  addEnvironment,
  deleteEnvironment,
  updateEnvironment,
  envToVariablesObject,
  loadEnvironments,
  saveEnvironments,
  buildHeaders,
  ensureContentTypeHeader,
  highlightJson,
  extractResponseContentType,
  tryParseResponseBody,
  generateId,
} from './apiDebuggerUtils'
import './api-debugger.css'

function Toast({ message, type }) {
  if (!message) return null
  return <div className={`ad-toast ${type === 'error' ? 'ad-toast-error' : ''}`}>{message}</div>
}

function ConfirmDialog({ visible, title, message, onCancel, onConfirm }) {
  if (!visible) return null
  return (
    <div className="ad-dialog-mask" onClick={onCancel}>
      <div className="ad-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ad-dialog-header">
          <h3 className="ad-dialog-title">{title}</h3>
          <button className="ad-dialog-close" onClick={onCancel}>×</button>
        </div>
        <div className="ad-dialog-body">
          <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="ad-dialog-footer">
          <button className="ad-btn" onClick={onCancel}>取消</button>
          <button className="ad-btn ad-btn-danger" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  )
}

function EnvNameDialog({ visible, initialName = '', onCancel, onConfirm }) {
  const [name, setName] = useState(initialName)

  if (!visible) return null

  return (
    <div className="ad-dialog-mask" onClick={onCancel}>
      <div className="ad-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ad-dialog-header">
          <h3 className="ad-dialog-title">{initialName ? '重命名环境' : '新建环境'}</h3>
          <button className="ad-dialog-close" onClick={onCancel}>×</button>
        </div>
        <div className="ad-dialog-body">
          <div className="ad-form-row">
            <label className="ad-form-label">环境名称</label>
            <input
              className="ad-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：测试环境"
              autoFocus
            />
          </div>
        </div>
        <div className="ad-dialog-footer">
          <button className="ad-btn" onClick={onCancel}>取消</button>
          <button
            className="ad-btn ad-btn-primary"
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

function KeyValueTable({ rows, onChange, onAdd, onDelete, onToggle, placeholderKey = 'Key', placeholderValue = 'Value' }) {
  return (
    <div>
      <table className="ad-kv-table">
        <thead>
          <tr>
            <th></th>
            <th>{placeholderKey}</th>
            <th>{placeholderValue}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  className="ad-checkbox"
                  checked={row.enabled}
                  onChange={() => onToggle(idx)}
                />
              </td>
              <td>
                <input
                  className="ad-kv-input"
                  value={row.key}
                  onChange={(e) => onChange(idx, 'key', e.target.value)}
                  placeholder={placeholderKey}
                  disabled={!row.enabled}
                />
              </td>
              <td>
                <input
                  className="ad-kv-input"
                  value={row.value}
                  onChange={(e) => onChange(idx, 'value', e.target.value)}
                  placeholder={placeholderValue}
                  disabled={!row.enabled}
                />
              </td>
              <td>
                <button className="ad-btn ad-btn-sm ad-btn-icon ad-btn-danger" onClick={() => onDelete(idx)}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="ad-btn ad-btn-sm" style={{ marginTop: 8 }} onClick={onAdd}>
        + 添加一行
      </button>
    </div>
  )
}

function HistoryPanel({ history, onSelect, onToggleFavorite, onDelete, onClear }) {
  const sorted = useMemo(() => sortHistory(history), [history])
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h3 className="ad-panel-title">历史记录</h3>
        <button className="ad-clear-btn" onClick={() => setConfirmClear(true)} disabled={history.length === 0}>
          清空
        </button>
      </div>
      <div className="ad-panel-body">
        {sorted.length === 0 ? (
          <div className="ad-history-empty">暂无历史记录</div>
        ) : (
          <div className="ad-history-list">
            {sorted.map((item) => (
              <div key={item.id} className="ad-history-item" onClick={() => onSelect(item)}>
                <div className="ad-history-top">
                  <span className={`ad-history-method ad-method-${item.method}`}>{item.method}</span>
                  <span className="ad-history-url" title={item.url}>{item.url}</span>
                </div>
                <div className="ad-history-bottom">
                  <span className="ad-history-time">{formatTimestamp(item.timestamp)}</span>
                  <div className="ad-history-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`ad-favorite-btn ${item.favorite ? 'is-active' : ''}`}
                      onClick={() => onToggleFavorite(item.id)}
                      title={item.favorite ? '取消收藏' : '收藏'}
                    >
                      {item.favorite ? '★' : '☆'}
                    </button>
                    <button
                      className="ad-btn ad-btn-sm ad-btn-icon ad-btn-danger"
                      onClick={() => onDelete(item.id)}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        visible={confirmClear}
        title="清空历史记录"
        message="确定要清空所有历史记录吗？此操作不可撤销。"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          onClear()
          setConfirmClear(false)
        }}
      />
    </div>
  )
}

function EnvPanel({
  environments,
  currentEnvId,
  onEnvChange,
  onAddEnv,
  onDeleteEnv,
  onUpdateEnv,
}) {
  const currentEnv = environments.find((e) => e.id === currentEnvId)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [editingEnv, setEditingEnv] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleAddEnv = () => {
    setEditingEnv(null)
    setShowNameDialog(true)
  }

  const handleRenameEnv = () => {
    if (currentEnv) {
      setEditingEnv(currentEnv)
      setShowNameDialog(true)
    }
  }

  const handleConfirmName = (name) => {
    if (editingEnv) {
      onUpdateEnv(editingEnv.id, { name })
    } else {
      onAddEnv(name)
    }
    setShowNameDialog(false)
    setEditingEnv(null)
  }

  const handleVarChange = (idx, field, value) => {
    if (!currentEnv) return
    const newVars = [...currentEnv.variables]
    newVars[idx] = { ...newVars[idx], [field]: value }
    onUpdateEnv(currentEnv.id, { variables: newVars })
  }

  const handleVarToggle = (idx) => {
    if (!currentEnv) return
    const newVars = [...currentEnv.variables]
    newVars[idx] = { ...newVars[idx], enabled: !newVars[idx].enabled }
    onUpdateEnv(currentEnv.id, { variables: newVars })
  }

  const handleVarAdd = () => {
    if (!currentEnv) return
    onUpdateEnv(currentEnv.id, {
      variables: [...currentEnv.variables, createEmptyKeyValue()],
    })
  }

  const handleVarDelete = (idx) => {
    if (!currentEnv) return
    const newVars = currentEnv.variables.filter((_, i) => i !== idx)
    onUpdateEnv(currentEnv.id, { variables: newVars })
  }

  return (
    <div className="ad-panel">
      <div className="ad-panel-header">
        <h3 className="ad-panel-title">环境变量</h3>
      </div>
      <div className="ad-panel-body">
        <div className="ad-env-selector">
          <select
            className="ad-env-select"
            value={currentEnvId || ''}
            onChange={(e) => onEnvChange(e.target.value)}
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </select>
        </div>

        <div className="ad-env-actions">
          <button className="ad-btn ad-btn-sm" onClick={handleAddEnv}>+ 新建</button>
          <button className="ad-btn ad-btn-sm" onClick={handleRenameEnv} disabled={!currentEnv}>重命名</button>
          <button
            className="ad-btn ad-btn-sm ad-btn-danger"
            onClick={() => currentEnv && setConfirmDelete(currentEnv.id)}
            disabled={!currentEnv || environments.length <= 1}
          >
            删除
          </button>
        </div>

        {currentEnv && (
          <div className="ad-env-list">
            {currentEnv.variables.length === 0 ? (
              <div className="ad-empty-vars">暂无变量，点击下方添加</div>
            ) : (
              <KeyValueTable
                rows={currentEnv.variables}
                onChange={handleVarChange}
                onAdd={handleVarAdd}
                onDelete={handleVarDelete}
                onToggle={handleVarToggle}
                placeholderKey="变量名"
                placeholderValue="变量值"
              />
            )}
            {currentEnv.variables.length > 0 && null}
          </div>
        )}

        <p style={{ fontSize: 12, color: 'var(--text)', marginTop: 12, lineHeight: 1.5 }}>
          在 URL 和参数中使用 <code style={{ fontSize: 11 }}>{`{{变量名}}`}</code> 引用环境变量
        </p>
      </div>

      <EnvNameDialog
        key={`${showNameDialog}-${editingEnv?.id || 'new'}-${editingEnv?.name || ''}`}
        visible={showNameDialog}
        initialName={editingEnv?.name || ''}
        onCancel={() => {
          setShowNameDialog(false)
          setEditingEnv(null)
        }}
        onConfirm={handleConfirmName}
      />

      <ConfirmDialog
        visible={!!confirmDelete}
        title="删除环境"
        message={`确定要删除环境「${environments.find((e) => e.id === confirmDelete)?.name}」吗？`}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) onDeleteEnv(confirmDelete)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}

function ApiDebuggerPage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [queryParams, setQueryParams] = useState([createEmptyKeyValue()])
  const [headers, setHeaders] = useState([
    { id: generateId(), key: 'Content-Type', value: 'application/json', enabled: true },
  ])
  const [body, setBody] = useState('')
  const [activeRequestTab, setActiveRequestTab] = useState('params')
  const [activeResponseTab, setActiveResponseTab] = useState('body')

  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  const [history, setHistory] = useState(() => loadHistory())
  const [environments, setEnvironments] = useState(() => loadEnvironments())
  const [currentEnvId, setCurrentEnvId] = useState(() => {
    const envs = loadEnvironments()
    return envs[0]?.id || ''
  })

  useEffect(() => {
    saveHistory(history)
  }, [history])

  useEffect(() => {
    saveEnvironments(environments)
  }, [environments])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }, [])

  const currentEnv = useMemo(
    () => environments.find((e) => e.id === currentEnvId),
    [environments, currentEnvId]
  )

  const envVars = useMemo(() => envToVariablesObject(currentEnv), [currentEnv])

  const handleParamChange = useCallback((idx, field, value) => {
    setQueryParams((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }, [])

  const handleParamToggle = useCallback((idx) => {
    setQueryParams((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], enabled: !next[idx].enabled }
      return next
    })
  }, [])

  const handleParamAdd = useCallback(() => {
    setQueryParams((prev) => [...prev, createEmptyKeyValue()])
  }, [])

  const handleParamDelete = useCallback((idx) => {
    setQueryParams((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const handleHeaderChange = useCallback((idx, field, value) => {
    setHeaders((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }, [])

  const handleHeaderToggle = useCallback((idx) => {
    setHeaders((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], enabled: !next[idx].enabled }
      return next
    })
  }, [])

  const handleHeaderAdd = useCallback(() => {
    setHeaders((prev) => [...prev, createEmptyKeyValue()])
  }, [])

  const handleHeaderDelete = useCallback((idx) => {
    setHeaders((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const handlePresetContentType = useCallback((contentType) => {
    setHeaders((prev) => ensureContentTypeHeader(prev, contentType))
    showToast('已设置 Content-Type')
  }, [showToast])

  const handleFormatBody = useCallback(() => {
    const formatted = formatJson(body)
    if (formatted === body && !isValidJson(body)) {
      showToast('JSON 格式错误，无法格式化', 'error')
      return
    }
    setBody(formatted)
  }, [body, showToast])

  const handleMinifyBody = useCallback(() => {
    const minified = minifyJson(body)
    if (minified === body && !isValidJson(body)) {
      showToast('JSON 格式错误，无法压缩', 'error')
      return
    }
    setBody(minified)
  }, [body, showToast])

  const handleSendRequest = useCallback(async () => {
    if (!url.trim()) {
      showToast('请输入请求 URL', 'error')
      return
    }

    setLoading(true)
    setResponse(null)

    const processedHeaders = buildHeaders(headers, envVars)
    const fullUrl = buildUrl(url, queryParams, envVars)
    const processedBody = replaceEnvVariables(body, envVars)

    let bodyToSend = processedBody
    const hasJsonCT = Object.keys(processedHeaders).some(
      (k) => k.toLowerCase() === 'content-type' && processedHeaders[k].toLowerCase().includes('json')
    )

    if (hasJsonCT && processedBody && isValidJson(processedBody)) {
      bodyToSend = processedBody
    }

    const requestData = {
      method,
      url: fullUrl,
      queryParams: queryParams.map((p) => ({ ...p })),
      headers: headers.map((h) => ({ ...h })),
      body,
    }

    const startTime = performance.now()

    try {
      const fetchOptions = {
        method,
        headers: processedHeaders,
      }

      if (isBodyMethod(method) && bodyToSend) {
        fetchOptions.body = bodyToSend
      }

      const resp = await fetch(fullUrl, fetchOptions)
      const duration = Math.round(performance.now() - startTime)

      const respHeaders = {}
      resp.headers.forEach((value, key) => {
        respHeaders[key] = value
      })

      const respText = await resp.text()
      const respContentType = extractResponseContentType(respHeaders)
      const parsedBody = tryParseResponseBody(respText, respContentType)

      const responseData = {
        statusCode: resp.status,
        statusText: resp.statusText,
        duration,
        size: new Blob([respText]).size,
        headers: respHeaders,
        contentType: respContentType,
        body: parsedBody.formatted,
        bodyRaw: respText,
        isJson: parsedBody.isJson,
      }

      setResponse(responseData)

      const historyRecord = createHistoryRecord({
        method,
        url: fullUrl,
        request: requestData,
        response: responseData,
      })
      setHistory((prev) => addHistory(prev, historyRecord))

      showToast('请求成功')
    } catch (err) {
      const duration = Math.round(performance.now() - startTime)
      setResponse({
        statusCode: 0,
        statusText: err.message || 'Network Error',
        duration,
        size: 0,
        headers: {},
        contentType: '',
        body: `请求失败：${err.message || '网络错误'}`,
        bodyRaw: `请求失败：${err.message || '网络错误'}`,
        isJson: false,
        isError: true,
      })
      showToast('请求失败：' + (err.message || '网络错误'), 'error')
    } finally {
      setLoading(false)
    }
  }, [url, method, headers, queryParams, body, envVars, showToast])

  const handleHistorySelect = useCallback((item) => {
    const req = item.request
    if (!req) return
    setMethod(req.method || 'GET')
    setUrl(req.url || '')
    setQueryParams(req.queryParams && req.queryParams.length > 0
      ? req.queryParams.map((p) => ({ ...p, id: p.id || generateId() }))
      : [createEmptyKeyValue()])
    setHeaders(req.headers && req.headers.length > 0
      ? req.headers.map((h) => ({ ...h, id: h.id || generateId() }))
      : [createEmptyKeyValue()])
    setBody(req.body || '')
    setActiveRequestTab('params')
    showToast('已回填请求配置')
  }, [showToast])

  const handleHistoryToggleFavorite = useCallback((id) => {
    setHistory((prev) => toggleHistoryFavorite(prev, id))
  }, [])

  const handleHistoryDelete = useCallback((id) => {
    setHistory((prev) => deleteHistory(prev, id))
    showToast('已删除')
  }, [showToast])

  const handleHistoryClear = useCallback(() => {
    setHistory(clearHistory())
    showToast('已清空历史记录')
  }, [showToast])

  const handleEnvChange = useCallback((id) => {
    setCurrentEnvId(id)
  }, [])

  const handleAddEnv = useCallback((name) => {
    const newEnv = createEnvironment(name, [createEmptyKeyValue()])
    setEnvironments((prev) => addEnvironment(prev, newEnv))
    setCurrentEnvId(newEnv.id)
    showToast('已创建环境')
  }, [showToast])

  const handleDeleteEnv = useCallback((id) => {
    setEnvironments((prev) => {
      const next = deleteEnvironment(prev, id)
      if (currentEnvId === id && next.length > 0) {
        setCurrentEnvId(next[0].id)
      }
      return next
    })
    showToast('已删除环境')
  }, [currentEnvId, showToast])

  const handleUpdateEnv = useCallback((id, updates) => {
    setEnvironments((prev) => updateEnvironment(prev, id, updates))
  }, [])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const statusCategory = response ? getStatusCodeCategory(response.statusCode) : 'unknown'
  const bodyIsValidJson = isValidJson(body)

  return (
    <div className="ad-page">
      <div className="ad-header">
        <button className="ad-back-btn" onClick={handleBack}>← 返回首页</button>
        <h1 className="ad-title">API 调试工具</h1>
      </div>

      <div className="ad-main">
        <HistoryPanel
          history={history}
          onSelect={handleHistorySelect}
          onToggleFavorite={handleHistoryToggleFavorite}
          onDelete={handleHistoryDelete}
          onClear={handleHistoryClear}
        />

        <div className="ad-center">
          <div className="ad-request-section">
            <div className="ad-url-bar">
              <select
                className={`ad-method-select ad-method-${method}`}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                className="ad-url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="请输入请求 URL，例如：https://api.example.com/users"
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendRequest()}
              />
              <button
                className="ad-send-btn"
                onClick={handleSendRequest}
                disabled={loading}
              >
                {loading ? '发送中...' : '发送'}
              </button>
            </div>

            <div className="ad-tabs">
              <button
                className={`ad-tab ${activeRequestTab === 'params' ? 'is-active' : ''}`}
                onClick={() => setActiveRequestTab('params')}
              >
                Query Params
              </button>
              <button
                className={`ad-tab ${activeRequestTab === 'headers' ? 'is-active' : ''}`}
                onClick={() => setActiveRequestTab('headers')}
              >
                Headers
              </button>
              {isBodyMethod(method) && (
                <button
                  className={`ad-tab ${activeRequestTab === 'body' ? 'is-active' : ''}`}
                  onClick={() => setActiveRequestTab('body')}
                >
                  Body
                </button>
              )}
            </div>

            {activeRequestTab === 'params' && (
              <KeyValueTable
                rows={queryParams}
                onChange={handleParamChange}
                onAdd={handleParamAdd}
                onDelete={handleParamDelete}
                onToggle={handleParamToggle}
                placeholderKey="参数名"
                placeholderValue="参数值"
              />
            )}

            {activeRequestTab === 'headers' && (
              <div>
                <div className="ad-preset-row">
                  {CONTENT_TYPE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      className="ad-preset-tag"
                      onClick={() => handlePresetContentType(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <KeyValueTable
                  rows={headers}
                  onChange={handleHeaderChange}
                  onAdd={handleHeaderAdd}
                  onDelete={handleHeaderDelete}
                  onToggle={handleHeaderToggle}
                  placeholderKey="Header 名"
                  placeholderValue="Header 值"
                />
              </div>
            )}

            {activeRequestTab === 'body' && isBodyMethod(method) && (
              <div>
                <div className="ad-body-toolbar">
                  <button className="ad-btn ad-btn-sm" onClick={handleFormatBody}>格式化 JSON</button>
                  <button className="ad-btn ad-btn-sm" onClick={handleMinifyBody}>压缩 JSON</button>
                  {!bodyIsValidJson && body && (
                    <span style={{ fontSize: 12, color: '#e74c3c', alignSelf: 'center' }}>
                      ⚠ JSON 格式有误
                    </span>
                  )}
                </div>
                <textarea
                  className={`ad-body-textarea ${!bodyIsValidJson && body ? 'has-error' : ''}`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='请输入 JSON 请求体，例如：{"name": "test", "age": 18}'
                  spellCheck={false}
                />
                <div className="ad-body-hint">
                  提示：可以使用 <code style={{ fontSize: 11 }}>{`{{变量名}}`}</code> 引用环境变量
                </div>
              </div>
            )}
          </div>

          <div className="ad-response-section">
            <div className="ad-tabs">
              <button
                className={`ad-tab ${activeResponseTab === 'body' ? 'is-active' : ''}`}
                onClick={() => setActiveResponseTab('body')}
              >
                响应体
              </button>
              <button
                className={`ad-tab ${activeResponseTab === 'headers' ? 'is-active' : ''}`}
                onClick={() => setActiveResponseTab('headers')}
              >
                响应头
              </button>
            </div>

            {!response ? (
              <div className="ad-response-empty">
                {loading ? '请求中...' : '尚未发送请求，发送后响应将显示在这里'}
              </div>
            ) : (
              <>
                <div className="ad-response-meta">
                  <span className={`ad-status-badge ad-status-${statusCategory}`}>
                    {response.statusCode || 'ERR'} {response.statusText || ''}
                  </span>
                  <span className="ad-meta-item">
                    <span className="ad-meta-label">耗时：</span>
                    <span className="ad-meta-value">{formatDuration(response.duration)}</span>
                  </span>
                  <span className="ad-meta-item">
                    <span className="ad-meta-label">大小：</span>
                    <span className="ad-meta-value">{formatBytes(response.size)}</span>
                  </span>
                </div>

                {activeResponseTab === 'body' && (
                  <pre
                    className="ad-response-body"
                    dangerouslySetInnerHTML={{
                      __html: response.isJson
                        ? highlightJson(response.body)
                        : escapeHtmlForDisplay(response.body),
                    }}
                  />
                )}

                {activeResponseTab === 'headers' && (
                  <div className="ad-headers-list">
                    {Object.keys(response.headers).length === 0 ? (
                      <div className="ad-empty-vars">无响应头</div>
                    ) : (
                      Object.entries(response.headers).map(([k, v]) => (
                        <div key={k} className="ad-header-item">
                          <span className="ad-header-key">{k}</span>
                          <span className="ad-header-value">{v}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <EnvPanel
          environments={environments}
          currentEnvId={currentEnvId}
          onEnvChange={handleEnvChange}
          onAddEnv={handleAddEnv}
          onDeleteEnv={handleDeleteEnv}
          onUpdateEnv={handleUpdateEnv}
        />
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </div>
  )
}

function escapeHtmlForDisplay(text) {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export default ApiDebuggerPage
