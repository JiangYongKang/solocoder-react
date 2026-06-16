import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HTTP_METHODS,
  MOCK_TEMPLATES,
  generateId,
  createEmptyKeyValue,
  matchAllRules,
  createRequestRule,
  createResponseRule,
  moveRule,
  enableAllRules,
  disableAllRules,
  formatJson,
  minifyJson,
  isValidJson,
  getJsonErrorLine,
  highlightJson,
  createMockTemplate,
  createLogEntry,
  filterLogs,
  sortLogsByTime,
  getStatusCodeCategory,
  formatTimestamp,
  formatDuration,
  executeInterceptorChain,
  exportRulesToJson,
  importRulesFromJson,
} from './networkInterceptorUtils'
import {
  loadRequestRules,
  saveRequestRules,
  loadResponseRules,
  saveResponseRules,
  loadMockTemplates,
  saveMockTemplates,
  loadLogs,
  saveLogs,
} from './storage'
import './network-interceptor.css'

function JsonEditorWithLineNumbers({
  value,
  onChange,
  placeholder,
  readOnly = false,
  minHeight,
}) {
  const textareaRef = useRef(null)
  const valid = isValidJson(value)
  const errorLine = valid ? null : getJsonErrorLine(value)
  const lineHeight = 19.5

  const lines = useMemo(() => {
    const content = value || ''
    const count = content.split('\n').length
    const minLines = 15
    const total = Math.max(count, minLines)
    return Array.from({ length: total }, (_, i) => i + 1)
  }, [value])

  const wrapperStyle = minHeight ? { minHeight } : undefined

  return (
    <div
      className={`ni-json-editor-wrapper ${!valid && value ? 'has-error' : ''}`}
      style={wrapperStyle}
    >
      <div className="ni-json-line-numbers">
        {lines.map((n) => (
          <span
            key={n}
            className={`ni-json-line-number ${errorLine === n ? 'is-error-line' : ''}`}
          >
            {n}
          </span>
        ))}
      </div>
      <div className="ni-json-textarea-wrapper">
        {errorLine && (
          <div
            className="ni-json-error-highlight"
            style={{ top: `${(errorLine - 1) * lineHeight + 12}px` }}
          />
        )}
        <textarea
          ref={textareaRef}
          className={`ni-json-textarea ${!valid && value ? 'has-error' : ''}`}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          readOnly={readOnly}
        />
      </div>
    </div>
  )
}

function Toast({ message, type }) {
  if (!message) return null
  return <div className={`ni-toast ${type === 'error' ? 'ni-toast-error' : ''}`}>{message}</div>
}

function ConfirmDialog({ visible, title, message, onCancel, onConfirm }) {
  if (!visible) return null
  return (
    <div className="ni-dialog-mask" onClick={onCancel}>
      <div className="ni-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ni-dialog-header">
          <h3 className="ni-dialog-title">{title}</h3>
          <button className="ni-dialog-close" onClick={onCancel}>×</button>
        </div>
        <div className="ni-dialog-body">
          <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="ni-dialog-footer">
          <button className="ni-btn" onClick={onCancel}>取消</button>
          <button className="ni-btn ni-btn-danger" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  )
}

function RequestRuleDialog({ visible, initialRule, onCancel, onSave }) {
  const [name, setName] = useState(initialRule?.name || '')
  const [urlPattern, setUrlPattern] = useState(initialRule?.urlPattern || '')
  const [headers, setHeaders] = useState(
    initialRule?.modifyHeaders?.length > 0
      ? initialRule.modifyHeaders.map((h) => ({ ...h }))
      : [createEmptyKeyValue()]
  )

  const handleHeaderChange = (idx, field, value) => {
    setHeaders((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const handleHeaderToggle = (idx) => {
    setHeaders((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], enabled: !next[idx].enabled }
      return next
    })
  }

  const handleHeaderAdd = () => {
    setHeaders((prev) => [...prev, createEmptyKeyValue()])
  }

  const handleHeaderDelete = (idx) => {
    setHeaders((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    if (!name.trim() || !urlPattern.trim()) return
    onSave({
      name: name.trim(),
      urlPattern: urlPattern.trim(),
      modifyHeaders: headers.filter((h) => h.key.trim() !== ''),
    })
  }

  if (!visible) return null

  return (
    <div className="ni-dialog-mask" onClick={onCancel}>
      <div className="ni-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ni-dialog-header">
          <h3 className="ni-dialog-title">{initialRule ? '编辑请求拦截规则' : '新增请求拦截规则'}</h3>
          <button className="ni-dialog-close" onClick={onCancel}>×</button>
        </div>
        <div className="ni-dialog-body">
          <div className="ni-form-row">
            <label className="ni-form-label">规则名称</label>
            <input
              className="ni-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：添加认证头"
              autoFocus
            />
          </div>
          <div className="ni-form-row">
            <label className="ni-form-label">URL 模式</label>
            <input
              className="ni-form-input"
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
              placeholder="例如：/api/user* 或 /api/login"
            />
            <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 4 }}>
              支持通配符 *，例如 <code>/api/*</code> 匹配所有 /api/ 开头的 URL
            </div>
          </div>
          <div className="ni-form-row">
            <label className="ni-form-label">修改请求头</label>
            <table className="ni-kv-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>Header 名</th>
                  <th>Header 值</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h, idx) => (
                  <tr key={h.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="ni-checkbox"
                        checked={h.enabled}
                        onChange={() => handleHeaderToggle(idx)}
                      />
                    </td>
                    <td>
                      <input
                        className="ni-kv-input"
                        value={h.key}
                        onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                        placeholder="Authorization"
                      />
                    </td>
                    <td>
                      <input
                        className="ni-kv-input"
                        value={h.value}
                        onChange={(e) => handleHeaderChange(idx, 'value', e.target.value)}
                        placeholder="Bearer token..."
                      />
                    </td>
                    <td>
                      <button
                        className="ni-btn ni-btn-sm ni-btn-icon ni-btn-danger"
                        onClick={() => handleHeaderDelete(idx)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="ni-btn ni-btn-sm" style={{ marginTop: 8 }} onClick={handleHeaderAdd}>
              + 添加请求头
            </button>
          </div>
        </div>
        <div className="ni-dialog-footer">
          <button className="ni-btn" onClick={onCancel}>取消</button>
          <button
            className="ni-btn ni-btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || !urlPattern.trim()}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function ResponseRuleDialog({ visible, initialRule, onCancel, onSave }) {
  const [name, setName] = useState(initialRule?.name || '')
  const [urlPattern, setUrlPattern] = useState(initialRule?.urlPattern || '')
  const [mockBody, setMockBody] = useState(initialRule?.mockBody || '')

  const validJson = isValidJson(mockBody)

  const handleFormat = () => {
    const formatted = formatJson(mockBody)
    if (formatted) setMockBody(formatted)
  }

  const handleSave = () => {
    if (!name.trim() || !urlPattern.trim()) return
    onSave({
      name: name.trim(),
      urlPattern: urlPattern.trim(),
      mockBody,
    })
  }

  if (!visible) return null

  return (
    <div className="ni-dialog-mask" onClick={onCancel}>
      <div className="ni-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ni-dialog-header">
          <h3 className="ni-dialog-title">{initialRule ? '编辑响应拦截规则' : '新增响应拦截规则'}</h3>
          <button className="ni-dialog-close" onClick={onCancel}>×</button>
        </div>
        <div className="ni-dialog-body">
          <div className="ni-form-row">
            <label className="ni-form-label">规则名称</label>
            <input
              className="ni-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：Mock 用户数据"
              autoFocus
            />
          </div>
          <div className="ni-form-row">
            <label className="ni-form-label">URL 模式</label>
            <input
              className="ni-form-input"
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
              placeholder="例如：/api/user*"
            />
          </div>
          <div className="ni-form-row">
            <label className="ni-form-label">
              Mock 响应体（JSON）
              {!validJson && mockBody && (
                <span className="ni-json-error-message" style={{ marginLeft: 8 }}>
                  JSON 错误（第 {getJsonErrorLine(mockBody)} 行）
                </span>
              )}
            </label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <button className="ni-btn ni-btn-sm" onClick={handleFormat}>格式化</button>
              <select
                className="ni-btn ni-btn-sm"
                onChange={(e) => {
                  const template = MOCK_TEMPLATES.find((t) => t.name === e.target.value)
                  if (template) setMockBody(template.value)
                  e.target.value = ''
                }}
                defaultValue=""
              >
                <option value="" disabled>快速填充</option>
                {MOCK_TEMPLATES.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <JsonEditorWithLineNumbers
              value={mockBody}
              onChange={setMockBody}
              placeholder='{ "code": 0, "data": { ... } }'
            />
          </div>
        </div>
        <div className="ni-dialog-footer">
          <button className="ni-btn" onClick={onCancel}>取消</button>
          <button
            className="ni-btn ni-btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || !urlPattern.trim()}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function ImportDialog({ visible, onCancel, onConfirm }) {
  const [jsonText, setJsonText] = useState('')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result || ''
      setJsonText(String(text))
      validateAndPreview(String(text))
    }
    reader.readAsText(file)
  }

  const validateAndPreview = (text) => {
    const result = importRulesFromJson(text)
    if (!result.success) {
      setError(result.error || '格式错误')
      setPreview(null)
      return
    }

    setError('')
    setPreview(result.data)
  }

  const handleJsonChange = (text) => {
    setJsonText(text)
    if (text.trim()) {
      validateAndPreview(text)
    } else {
      setError('')
      setPreview(null)
    }
  }

  const handleConfirm = () => {
    if (!preview) return
    onConfirm(preview)
  }

  if (!visible) return null

  const jsonErrorLine = !isValidJson(jsonText) && jsonText ? getJsonErrorLine(jsonText) : null

  return (
    <div className="ni-dialog-mask" onClick={onCancel}>
      <div className="ni-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ni-dialog-header">
          <h3 className="ni-dialog-title">导入规则</h3>
          <button className="ni-dialog-close" onClick={onCancel}>×</button>
        </div>
        <div className="ni-dialog-body">
          <div className="ni-form-row">
            <label className="ni-form-label">选择文件</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ fontSize: 13 }}
            />
          </div>
          <div className="ni-form-row">
            <label className="ni-form-label">
              或粘贴 JSON
              {jsonErrorLine && (
                <span className="ni-json-error-message" style={{ marginLeft: 8 }}>
                  JSON 错误（第 {jsonErrorLine} 行）
                </span>
              )}
            </label>
            <JsonEditorWithLineNumbers
              value={jsonText}
              onChange={handleJsonChange}
              placeholder='{ "requestRules": [...], "responseRules": [...] }'
              minHeight="120px"
            />
            {error && <div className="ni-form-error">{error}</div>}
          </div>

          {preview && (
            <div className="ni-import-preview">
              <div style={{ fontWeight: 500, marginBottom: 8, color: 'var(--text-h)' }}>
                导入预览
              </div>
              <div className="ni-import-preview-item">
                请求拦截规则：<strong>{preview.requestRules.length}</strong> 条
              </div>
              {preview.requestRules.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text)', paddingLeft: 16, marginBottom: 8 }}>
                  {preview.requestRules.slice(0, 3).map((r) => (
                    <div key={r.id}>• {r.name}</div>
                  ))}
                  {preview.requestRules.length > 3 && (
                    <div>... 还有 {preview.requestRules.length - 3} 条</div>
                  )}
                </div>
              )}
              <div className="ni-import-preview-item">
                响应拦截规则：<strong>{preview.responseRules.length}</strong> 条
              </div>
              {preview.responseRules.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text)', paddingLeft: 16, marginBottom: 8 }}>
                  {preview.responseRules.slice(0, 3).map((r) => (
                    <div key={r.id}>• {r.name}</div>
                  ))}
                  {preview.responseRules.length > 3 && (
                    <div>... 还有 {preview.responseRules.length - 3} 条</div>
                  )}
                </div>
              )}
              <div className="ni-import-preview-item">
                Mock 模板：<strong>{preview.mockTemplates?.length || 0}</strong> 个
              </div>
            </div>
          )}
        </div>
        <div className="ni-dialog-footer">
          <button className="ni-btn" onClick={onCancel}>取消</button>
          <button
            className="ni-btn ni-btn-primary"
            onClick={handleConfirm}
            disabled={!preview}
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  )
}

function SaveTemplateDialog({ visible, onCancel, onSave }) {
  const [name, setName] = useState('')

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim())
  }

  if (!visible) return null

  return (
    <div className="ni-dialog-mask" onClick={onCancel}>
      <div className="ni-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ni-dialog-header">
          <h3 className="ni-dialog-title">保存为模板</h3>
          <button className="ni-dialog-close" onClick={onCancel}>×</button>
        </div>
        <div className="ni-dialog-body">
          <div className="ni-form-row">
            <label className="ni-form-label">模板名称</label>
            <input
              className="ni-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入模板名称"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <div className="ni-dialog-footer">
          <button className="ni-btn" onClick={onCancel}>取消</button>
          <button
            className="ni-btn ni-btn-primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function LogItem({ log, expanded, onToggle }) {
  const statusCategory = getStatusCodeCategory(log.statusCode)

  return (
    <div className={`ni-log-item ${log.intercepted ? 'is-intercepted' : ''}`}>
      <div className="ni-log-dot"></div>
      <div className={`ni-log-card ${expanded ? 'is-expanded' : ''}`} onClick={onToggle}>
        <div className="ni-log-header">
          <span className={`ni-method-tag ni-method-${log.method}`}>{log.method}</span>
          <span className={`ni-status-tag ni-status-${statusCategory}`}>{log.statusCode}</span>
          {log.intercepted && <span className="ni-intercepted-tag">已拦截</span>}
          <span style={{ fontSize: 12, color: 'var(--text)', marginLeft: 'auto' }}>
            {formatTimestamp(log.timestamp)}
          </span>
        </div>
        <div className="ni-log-url">{log.url}</div>
        <div className="ni-log-meta">
          <span>耗时：{formatDuration(log.duration)}</span>
          {log.hitRequestRule && <span>请求规则：{log.hitRequestRule.name}</span>}
          {log.hitResponseRule && <span>响应规则：{log.hitResponseRule.name}</span>}
        </div>

        {expanded && (
          <div className="ni-log-detail">
            <div className="ni-log-detail-section">
              <div className="ni-log-detail-title">请求头</div>
              <pre className="ni-log-detail-body">
                {JSON.stringify(log.requestHeaders, null, 2)}
              </pre>
            </div>

            {log.requestBody && (
              <div className="ni-log-detail-section">
                <div className="ni-log-detail-title">请求体</div>
                <pre
                  className="ni-log-detail-body"
                  dangerouslySetInnerHTML={{ __html: highlightJson(log.requestBody) }}
                />
              </div>
            )}

            <div className="ni-log-detail-section">
              <div className="ni-log-detail-title">响应对比</div>
              <div className="ni-log-detail-compare">
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>原始响应</div>
                  <pre
                    className="ni-log-detail-body"
                    style={{ maxHeight: 150 }}
                    dangerouslySetInnerHTML={{ __html: highlightJson(log.originalResponseBody) }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>最终响应</div>
                  <pre
                    className="ni-log-detail-body"
                    style={{ maxHeight: 150 }}
                    dangerouslySetInnerHTML={{ __html: highlightJson(log.finalResponseBody) }}
                  />
                </div>
              </div>
            </div>

            <div className="ni-log-detail-section">
              <div className="ni-log-detail-title">响应头</div>
              <pre className="ni-log-detail-body">
                {JSON.stringify(log.responseHeaders, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NetworkInterceptorPage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  const [requestRules, setRequestRules] = useState(() => loadRequestRules())
  const [responseRules, setResponseRules] = useState(() => loadResponseRules())
  const [mockTemplates, setMockTemplates] = useState(() => loadMockTemplates())
  const [logs, setLogs] = useState(() => loadLogs())

  const [testUrl, setTestUrl] = useState('')

  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [editingRequestRule, setEditingRequestRule] = useState(null)

  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [editingResponseRule, setEditingResponseRule] = useState(null)

  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)

  const [confirmClearLogs, setConfirmClearLogs] = useState(false)

  const [sendMethod, setSendMethod] = useState('GET')
  const [sendUrl, setSendUrl] = useState('/api/user/123')
  const [sendBody, setSendBody] = useState('')
  const [sending, setSending] = useState(false)

  const [mockOriginal, setMockOriginal] = useState(MOCK_TEMPLATES[0].value)
  const [mockReplacement, setMockReplacement] = useState('')

  const [logFilterMethod, setLogFilterMethod] = useState('')
  const [logFilterStatus, setLogFilterStatus] = useState('')
  const [logFilterIntercepted, setLogFilterIntercepted] = useState('')
  const [expandedLogId, setExpandedLogId] = useState(null)

  const logContainerRef = useRef(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragType, setDragType] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    saveRequestRules(requestRules)
  }, [requestRules])

  useEffect(() => {
    saveResponseRules(responseRules)
  }, [responseRules])

  useEffect(() => {
    saveMockTemplates(mockTemplates)
  }, [mockTemplates])

  useEffect(() => {
    saveLogs(logs)
  }, [logs])

  const matchedRuleIds = useMemo(() => {
    if (!testUrl.trim()) {
      return { request: [], response: [] }
    }

    const reqMatches = matchAllRules(requestRules, testUrl).map((r) => r.id)
    const resMatches = matchAllRules(responseRules, testUrl).map((r) => r.id)
    return { request: reqMatches, response: resMatches }
  }, [testUrl, requestRules, responseRules])

  const filteredLogs = useMemo(() => {
    const filters = {}
    if (logFilterMethod) filters.method = logFilterMethod
    if (logFilterStatus) filters.statusCode = logFilterStatus
    if (logFilterIntercepted !== '') filters.intercepted = logFilterIntercepted === 'true'

    const filtered = filterLogs(logs, filters)
    return sortLogsByTime(filtered, true)
  }, [logs, logFilterMethod, logFilterStatus, logFilterIntercepted])

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0
    }
  }, [logs.length, filteredLogs.length])

  const handleAddRequestRule = () => {
    setEditingRequestRule(null)
    setShowRequestDialog(true)
  }

  const handleEditRequestRule = (rule) => {
    setEditingRequestRule(rule)
    setShowRequestDialog(true)
  }

  const handleSaveRequestRule = (data) => {
    if (editingRequestRule) {
      setRequestRules((prev) =>
        prev.map((r) =>
          r.id === editingRequestRule.id
            ? { ...r, ...data }
            : r
        )
      )
      showToast('规则已更新')
    } else {
      const newRule = createRequestRule(data.name, data.urlPattern)
      newRule.modifyHeaders = data.modifyHeaders
      setRequestRules((prev) => [newRule, ...prev])
      showToast('规则已添加')
    }
    setShowRequestDialog(false)
  }

  const handleDeleteRequestRule = (id) => {
    setRequestRules((prev) => prev.filter((r) => r.id !== id))
    showToast('规则已删除')
  }

  const handleToggleRequestRule = (id) => {
    setRequestRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    )
  }

  const handleMoveRequestRule = (fromIndex, toIndex) => {
    setRequestRules((prev) => moveRule(prev, fromIndex, toIndex))
  }

  const handleEnableAllRequestRules = () => {
    setRequestRules((prev) => enableAllRules(prev))
    showToast('已全部启用')
  }

  const handleDisableAllRequestRules = () => {
    setRequestRules((prev) => disableAllRules(prev))
    showToast('已全部禁用')
  }

  const handleAddResponseRule = () => {
    setEditingResponseRule(null)
    setShowResponseDialog(true)
  }

  const handleEditResponseRule = (rule) => {
    setEditingResponseRule(rule)
    setShowResponseDialog(true)
  }

  const handleSaveResponseRule = (data) => {
    if (editingResponseRule) {
      setResponseRules((prev) =>
        prev.map((r) =>
          r.id === editingResponseRule.id
            ? { ...r, ...data }
            : r
        )
      )
      showToast('规则已更新')
    } else {
      const newRule = createResponseRule(data.name, data.urlPattern, data.mockBody)
      setResponseRules((prev) => [newRule, ...prev])
      showToast('规则已添加')
    }
    setShowResponseDialog(false)
  }

  const handleDeleteResponseRule = (id) => {
    setResponseRules((prev) => prev.filter((r) => r.id !== id))
    showToast('规则已删除')
  }

  const handleToggleResponseRule = (id) => {
    setResponseRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    )
  }

  const handleMoveResponseRule = (fromIndex, toIndex) => {
    setResponseRules((prev) => moveRule(prev, fromIndex, toIndex))
  }

  const handleEnableAllResponseRules = () => {
    setResponseRules((prev) => enableAllRules(prev))
    showToast('已全部启用')
  }

  const handleDisableAllResponseRules = () => {
    setResponseRules((prev) => disableAllRules(prev))
    showToast('已全部禁用')
  }

  const handleDragStart = (e, index, type) => {
    setDraggedIndex(index)
    setDragType(type)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetIndex, type) => {
    e.preventDefault()
    if (draggedIndex === null || dragType !== type) return
    if (draggedIndex === targetIndex) return

    if (type === 'request') {
      handleMoveRequestRule(draggedIndex, targetIndex)
    } else {
      handleMoveResponseRule(draggedIndex, targetIndex)
    }

    setDraggedIndex(null)
    setDragType(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragType(null)
  }

  const handleFormatMockOriginal = () => {
    setMockOriginal(formatJson(mockOriginal))
  }

  const handleMinifyMockOriginal = () => {
    setMockOriginal(minifyJson(mockOriginal))
  }

  const handleFormatMockReplacement = () => {
    setMockReplacement(formatJson(mockReplacement))
  }

  const handleMinifyMockReplacement = () => {
    setMockReplacement(minifyJson(mockReplacement))
  }

  const handleQuickFill = (templateValue) => {
    setMockReplacement(templateValue)
  }

  const handleSaveTemplate = (name) => {
    const newTemplate = createMockTemplate(name, mockReplacement)
    setMockTemplates((prev) => [...prev, newTemplate])
    setShowSaveTemplateDialog(false)
    showToast('模板已保存')
  }

  const handleLoadTemplate = (template) => {
    setMockReplacement(template.body)
    showToast('模板已加载')
  }

  const handleDeleteTemplate = (id) => {
    setMockTemplates((prev) => prev.filter((t) => t.id !== id))
    showToast('模板已删除')
  }

  const handleSendRequest = useCallback(async () => {
    if (!sendUrl.trim()) {
      showToast('请输入请求 URL', 'error')
      return
    }

    setSending(true)

    const startTime = performance.now()

    const requestHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    setTimeout(() => {
      const result = executeInterceptorChain({
        method: sendMethod,
        url: sendUrl,
        requestHeaders,
        requestBody: sendBody,
        requestRules,
        responseRules,
        mockOriginalResponse: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Powered-By': 'MockServer',
          },
          body: mockOriginal,
        },
      })

      const duration = Math.round(performance.now() - startTime)

      const log = createLogEntry({
        method: sendMethod,
        url: sendUrl,
        statusCode: result.finalResponse.statusCode,
        duration,
        intercepted: result.intercepted,
        requestHeaders: result.finalRequestHeaders,
        requestBody: sendBody,
        responseHeaders: result.finalResponse.headers,
        originalResponseBody: result.originalResponse.body,
        finalResponseBody: result.finalResponse.body,
        hitRequestRule: result.hitRequestRule
          ? { id: result.hitRequestRule.id, name: result.hitRequestRule.name }
          : null,
        hitResponseRule: result.hitResponseRule
          ? { id: result.hitResponseRule.id, name: result.hitResponseRule.name }
          : null,
      })

      setLogs((prev) => [log, ...prev].slice(0, 100))
      setExpandedLogId(log.id)
      setSending(false)
      showToast(result.intercepted ? '请求已被拦截' : '请求完成')
    }, 200 + Math.random() * 300)
  }, [sendMethod, sendUrl, sendBody, requestRules, responseRules, mockOriginal, showToast])

  const handleClearLogs = () => {
    setLogs([])
    setExpandedLogId(null)
    setConfirmClearLogs(false)
    showToast('日志已清空')
  }

  const handleExport = () => {
    const jsonStr = exportRulesToJson({
      requestRules,
      responseRules,
      mockTemplates,
    })

    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `network-interceptor-rules-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('导出成功')
  }

  const handleImport = (data) => {
    if (data.requestRules) {
      setRequestRules(data.requestRules.map((r) => ({ ...r, id: r.id || generateId() })))
    }
    if (data.responseRules) {
      setResponseRules(data.responseRules.map((r) => ({ ...r, id: r.id || generateId() })))
    }
    if (data.mockTemplates) {
      setMockTemplates(data.mockTemplates.map((t) => ({ ...t, id: t.id || generateId() })))
    }
    setShowImportDialog(false)
    showToast('导入成功')
  }

  const handleBack = () => {
    navigate('/')
  }

  const originalValid = isValidJson(mockOriginal)
  const replacementValid = isValidJson(mockReplacement)
  const sendBodyValid = isValidJson(sendBody)
  const showBody = sendMethod === 'POST' || sendMethod === 'PUT'

  return (
    <div className="ni-page">
      <div className="ni-header">
        <button className="ni-back-btn" onClick={handleBack}>← 返回首页</button>
        <h1 className="ni-title">网络请求拦截器</h1>
        <div className="ni-header-actions">
          <button className="ni-btn" onClick={() => setShowImportDialog(true)}>导入规则</button>
          <button className="ni-btn ni-btn-primary" onClick={handleExport}>导出规则</button>
        </div>
      </div>

      <div className="ni-send-section">
        <div className="ni-send-header">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-h)' }}>
            发送测试请求
          </h3>
        </div>
        <div className="ni-send-body">
          <div className="ni-send-url-bar">
            <select
              className="ni-method-select"
              value={sendMethod}
              onChange={(e) => setSendMethod(e.target.value)}
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              className="ni-url-input"
              value={sendUrl}
              onChange={(e) => setSendUrl(e.target.value)}
              placeholder="请输入请求 URL，例如：/api/user/123"
              onKeyDown={(e) => e.key === 'Enter' && !sending && handleSendRequest()}
            />
            <button
              className="ni-send-btn"
              onClick={handleSendRequest}
              disabled={sending}
            >
              {sending ? '发送中...' : '发送'}
            </button>
          </div>

          {showBody && (
            <div className="ni-send-body-editor">
              <div className="ni-send-body-toolbar">
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>请求体 (JSON)</span>
                <button className="ni-btn ni-btn-sm" onClick={() => setSendBody(formatJson(sendBody))}>
                  格式化
                </button>
                <button className="ni-btn ni-btn-sm" onClick={() => setSendBody(minifyJson(sendBody))}>
                  压缩
                </button>
                {!sendBodyValid && sendBody && (
                  <span className="ni-json-error-message">
                    JSON 错误（第 {getJsonErrorLine(sendBody)} 行）
                  </span>
                )}
              </div>
              <JsonEditorWithLineNumbers
                value={sendBody}
                onChange={setSendBody}
                placeholder='{ "key": "value" }'
                minHeight="140px"
              />
            </div>
          )}
        </div>
      </div>

      <div className="ni-main">
        <div className="ni-panel">
          <div className="ni-panel-header">
            <h3 className="ni-panel-title">请求拦截规则</h3>
            <div className="ni-panel-actions">
              <button className="ni-btn ni-btn-sm" onClick={handleEnableAllRequestRules}>全部启用</button>
              <button className="ni-btn ni-btn-sm" onClick={handleDisableAllRequestRules}>全部禁用</button>
              <button className="ni-btn ni-btn-sm ni-btn-primary" onClick={handleAddRequestRule}>
                + 新增规则
              </button>
            </div>
          </div>

          <div className="ni-panel-body">
            <div className="ni-test-url">
              <input
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="输入 URL 测试匹配，例如：/api/user/123"
              />
              <span className="ni-badge">测试匹配</span>
            </div>

            <div className="ni-rule-list">
              {requestRules.length === 0 ? (
                <div className="ni-empty">暂无请求拦截规则，点击「新增规则」添加</div>
              ) : (
                requestRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className={`ni-rule-item ${!rule.enabled ? 'is-disabled' : ''} ${
                      matchedRuleIds.request.includes(rule.id) ? 'is-matched' : ''
                    } ${draggedIndex === index && dragType === 'request' ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, 'request')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, 'request')}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="ni-rule-header">
                      <span className="ni-rule-drag-handle">⋮⋮</span>
                      <span className="ni-rule-name">{rule.name}</span>
                      <div
                        className={`ni-switch ${rule.enabled ? 'is-active' : ''}`}
                        onClick={() => handleToggleRequestRule(rule.id)}
                      >
                        <div className="ni-switch-knob"></div>
                      </div>
                    </div>
                    <div className="ni-rule-url">{rule.urlPattern}</div>

                    {rule.modifyHeaders && rule.modifyHeaders.filter((h) => h.enabled && h.key).length > 0 && (
                      <div className="ni-rule-detail">
                        <div className="ni-rule-detail-title">修改的请求头：</div>
                        <div className="ni-rule-headers-preview">
                          {rule.modifyHeaders
                            .filter((h) => h.enabled && h.key)
                            .map((h) => `${h.key}: ${h.value}`)
                            .join('\n')}
                        </div>
                      </div>
                    )}

                    <div className="ni-rule-actions" style={{ marginTop: 8 }}>
                      <button
                        className="ni-btn ni-btn-sm"
                        onClick={() => handleEditRequestRule(rule)}
                      >
                        编辑
                      </button>
                      <button
                        className="ni-btn ni-btn-sm ni-btn-danger"
                        onClick={() => handleDeleteRequestRule(rule.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="ni-panel">
          <div className="ni-panel-header">
            <h3 className="ni-panel-title">响应拦截规则</h3>
            <div className="ni-panel-actions">
              <button className="ni-btn ni-btn-sm" onClick={handleEnableAllResponseRules}>全部启用</button>
              <button className="ni-btn ni-btn-sm" onClick={handleDisableAllResponseRules}>全部禁用</button>
              <button className="ni-btn ni-btn-sm ni-btn-primary" onClick={handleAddResponseRule}>
                + 新增规则
              </button>
            </div>
          </div>

          <div className="ni-panel-body">
            <div className="ni-test-url">
              <input
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="输入 URL 测试匹配，例如：/api/user/123"
              />
            </div>

            <div className="ni-rule-list">
              {responseRules.length === 0 ? (
                <div className="ni-empty">暂无响应拦截规则，点击「新增规则」添加</div>
              ) : (
                responseRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className={`ni-rule-item ${!rule.enabled ? 'is-disabled' : ''} ${
                      matchedRuleIds.response.includes(rule.id) ? 'is-matched' : ''
                    } ${draggedIndex === index && dragType === 'response' ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, 'response')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, 'response')}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="ni-rule-header">
                      <span className="ni-rule-drag-handle">⋮⋮</span>
                      <span className="ni-rule-name">{rule.name}</span>
                      <div
                        className={`ni-switch ${rule.enabled ? 'is-active' : ''}`}
                        onClick={() => handleToggleResponseRule(rule.id)}
                      >
                        <div className="ni-switch-knob"></div>
                      </div>
                    </div>
                    <div className="ni-rule-url">{rule.urlPattern}</div>

                    {rule.mockBody && (
                      <div className="ni-rule-detail">
                        <div className="ni-rule-detail-title">Mock 响应体：</div>
                        <div className="ni-rule-body-preview" title={rule.mockBody}>
                          {rule.mockBody.substring(0, 100)}
                          {rule.mockBody.length > 100 ? '...' : ''}
                        </div>
                      </div>
                    )}

                    <div className="ni-rule-actions" style={{ marginTop: 8 }}>
                      <button
                        className="ni-btn ni-btn-sm"
                        onClick={() => handleEditResponseRule(rule)}
                      >
                        编辑
                      </button>
                      <button
                        className="ni-btn ni-btn-sm ni-btn-danger"
                        onClick={() => handleDeleteResponseRule(rule.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="ni-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="ni-panel-header">
            <h3 className="ni-panel-title">Mock 数据编辑器</h3>
          </div>
          <div className="ni-panel-body">
            <div className="ni-mock-editor">
              <div className="ni-mock-pane">
                <div className="ni-mock-pane-header">
                  <span className="ni-mock-pane-title">原始响应数据</span>
                  <div className="ni-mock-actions">
                    <button className="ni-btn ni-btn-sm" onClick={handleFormatMockOriginal}>格式化</button>
                    <button className="ni-btn ni-btn-sm" onClick={handleMinifyMockOriginal}>压缩</button>
                    {!originalValid && mockOriginal && (
                      <span className="ni-json-error-message">
                        JSON 错误（第 {getJsonErrorLine(mockOriginal)} 行）
                      </span>
                    )}
                  </div>
                </div>
                <JsonEditorWithLineNumbers
                  value={mockOriginal}
                  onChange={setMockOriginal}
                  placeholder="模拟服务器返回的原始 JSON..."
                />
              </div>

              <div className="ni-mock-pane">
                <div className="ni-mock-pane-header">
                  <span className="ni-mock-pane-title">Mock 替换数据</span>
                  <div className="ni-mock-actions">
                    <button className="ni-btn ni-btn-sm" onClick={handleFormatMockReplacement}>格式化</button>
                    <button className="ni-btn ni-btn-sm" onClick={handleMinifyMockReplacement}>压缩</button>
                    <button
                      className="ni-btn ni-btn-sm ni-btn-primary"
                      onClick={() => setShowSaveTemplateDialog(true)}
                      disabled={!replacementValid || !mockReplacement}
                    >
                      保存模板
                    </button>
                    {!replacementValid && mockReplacement && (
                      <span className="ni-json-error-message">
                        JSON 错误（第 {getJsonErrorLine(mockReplacement)} 行）
                      </span>
                    )}
                  </div>
                </div>
                <JsonEditorWithLineNumbers
                  value={mockReplacement}
                  onChange={setMockReplacement}
                  placeholder="在此输入要替换的 JSON 数据..."
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-h)', marginBottom: 8 }}>
                快速填充
              </div>
              <div className="ni-template-list">
                {MOCK_TEMPLATES.map((t) => (
                  <span
                    key={t.name}
                    className="ni-template-tag"
                    onClick={() => handleQuickFill(t.value)}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>

            {mockTemplates.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-h)', marginBottom: 8 }}>
                  我的模板
                </div>
                <div className="ni-template-list">
                  {mockTemplates.map((t) => (
                    <span
                      key={t.id}
                      className="ni-template-tag"
                      style={{ position: 'relative', paddingRight: 24 }}
                      onClick={() => handleLoadTemplate(t)}
                    >
                      {t.name}
                      <span
                        style={{
                          position: 'absolute',
                          right: 4,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          cursor: 'pointer',
                          fontSize: 14,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTemplate(t.id)
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ni-panel ni-log-section">
          <div className="ni-panel-header">
            <h3 className="ni-panel-title">请求日志时间线</h3>
            <button
              className="ni-btn ni-btn-sm ni-btn-danger"
              onClick={() => setConfirmClearLogs(true)}
              disabled={logs.length === 0}
            >
              清空日志
            </button>
          </div>

          <div className="ni-log-toolbar">
            <div className="ni-log-filter">
              <label>方法：</label>
              <select
                value={logFilterMethod}
                onChange={(e) => setLogFilterMethod(e.target.value)}
              >
                <option value="">全部</option>
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="ni-log-filter">
              <label>状态码：</label>
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
              >
                <option value="">全部</option>
                <option value="2xx">2xx (成功)</option>
                <option value="4xx">4xx (客户端错误)</option>
                <option value="5xx">5xx (服务端错误)</option>
              </select>
            </div>
            <div className="ni-log-filter">
              <label>是否拦截：</label>
              <select
                value={logFilterIntercepted}
                onChange={(e) => setLogFilterIntercepted(e.target.value)}
              >
                <option value="">全部</option>
                <option value="true">已拦截</option>
                <option value="false">未拦截</option>
              </select>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text)' }}>
              共 {filteredLogs.length} 条记录
            </div>
          </div>

          <div className="ni-log-timeline" ref={logContainerRef}>
            {filteredLogs.length === 0 ? (
              <div className="ni-empty">暂无请求日志，发送请求后将显示在这里</div>
            ) : (
              filteredLogs.map((log) => (
                <LogItem
                  key={log.id}
                  log={log}
                  expanded={expandedLogId === log.id}
                  onToggle={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} />

      <RequestRuleDialog
        key={`req-${showRequestDialog}-${editingRequestRule?.id || 'new'}`}
        visible={showRequestDialog}
        initialRule={editingRequestRule}
        onCancel={() => setShowRequestDialog(false)}
        onSave={handleSaveRequestRule}
      />

      <ResponseRuleDialog
        key={`res-${showResponseDialog}-${editingResponseRule?.id || 'new'}`}
        visible={showResponseDialog}
        initialRule={editingResponseRule}
        onCancel={() => setShowResponseDialog(false)}
        onSave={handleSaveResponseRule}
      />

      <ImportDialog
        key={`import-${showImportDialog}`}
        visible={showImportDialog}
        onCancel={() => setShowImportDialog(false)}
        onConfirm={handleImport}
      />

      <SaveTemplateDialog
        key={`save-tpl-${showSaveTemplateDialog}`}
        visible={showSaveTemplateDialog}
        onCancel={() => setShowSaveTemplateDialog(false)}
        onSave={handleSaveTemplate}
      />

      <ConfirmDialog
        visible={confirmClearLogs}
        title="清空日志"
        message="确定要清空所有请求日志吗？此操作不可撤销。"
        onCancel={() => setConfirmClearLogs(false)}
        onConfirm={handleClearLogs}
      />
    </div>
  )
}

export default NetworkInterceptorPage
