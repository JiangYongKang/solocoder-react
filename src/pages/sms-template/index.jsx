import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './sms-template.css'
import {
  TEMPLATE_STATUS,
  TEMPLATE_STATUS_LABELS,
  TEMPLATE_STATUS_COLORS,
  PRESET_VARIABLES,
  DEFAULT_SIGNATURE,
  DEFAULT_SAMPLE_PHONE,
  MAX_REJECT_REASON_LENGTH,
} from './constants.js'
import {
  loadData,
  saveData,
  downloadJSONFile,
  readFileAsText,
} from './storage.js'
import {
  generateId,
  formatDateTime,
  calculateCharCount,
  getSmsLengthWarning,
  canSaveTemplate,
  extractVariables,
  validateVariableFormat,
  getStatusCapabilities,
  transitionStatus,
  searchItems,
  filterTemplatesByGroup,
  sortTemplates,
  hasTemplatesInGroup,
  createGroup,
  renameGroup,
  deleteGroup,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createRevision,
  importTemplates,
  exportTemplatesToJSON,
  parseImportJSON,
  buildPreviewContent,
  getContentSummary,
} from './utils.js'

const StatusTag = ({ status }) => (
  <span
    className="sms-template-status-tag"
    style={{ background: TEMPLATE_STATUS_COLORS[status] + '20', color: TEMPLATE_STATUS_COLORS[status] }}
  >
    {TEMPLATE_STATUS_LABELS[status]}
  </span>
)

const VariablePanelModal = ({ onClose, onSelect }) => (
  <div className="sms-template-modal-overlay" onClick={onClose}>
    <div className="sms-template-modal" onClick={(e) => e.stopPropagation()}>
      <div className="sms-template-modal-header">
        <h3>选择变量</h3>
        <button className="sms-template-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="sms-template-modal-body">
        <div className="sms-template-variable-grid">
          {PRESET_VARIABLES.map((v) => (
            <div
              key={v.name}
              className="sms-template-variable-item"
              onClick={() => {
                onSelect(v)
                onClose()
              }}
            >
              <span className="sms-template-variable-item-name">{v.name}</span>
              <span className="sms-template-variable-item-desc">示例：{v.sampleValue}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sms-template-modal-footer">
        <button className="sms-template-btn" onClick={onClose}>取消</button>
      </div>
    </div>
  </div>
)

const CustomSamplesModal = ({ variables, currentSamples, onClose, onSave }) => {
  const [localSamples, setLocalSamples] = useState(currentSamples || {})

  const handleChange = (name, value) => {
    setLocalSamples((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="sms-template-modal-overlay" onClick={onClose}>
      <div className="sms-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sms-template-modal-header">
          <h3>自定义示例值</h3>
          <button className="sms-template-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sms-template-modal-body">
          {variables.length === 0 ? (
            <div className="sms-template-empty">
              <div className="sms-template-empty-icon">📝</div>
              <div>当前模板暂无变量</div>
            </div>
          ) : (
            <div className="sms-template-samples-list">
              {variables.map((name) => {
                const preset = PRESET_VARIABLES.find((v) => v.name === name)
                return (
                  <div key={name} className="sms-template-samples-item">
                    <label>{name} {preset && `(默认：${preset.sampleValue})`}</label>
                    <input
                      type="text"
                      value={localSamples[name] || ''}
                      placeholder={`请输入${name}的示例值`}
                      onChange={(e) => handleChange(name, e.target.value)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="sms-template-modal-footer">
          <button className="sms-template-btn" onClick={onClose}>取消</button>
          <button className="sms-template-btn sms-template-btn-primary" onClick={() => { onSave(localSamples); onClose() }}>保存</button>
        </div>
      </div>
    </div>
  )
}

const RejectModal = ({ onClose, onConfirm }) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('驳回原因为必填项')
      return
    }
    if (reason.length > MAX_REJECT_REASON_LENGTH) {
      setError(`驳回原因不能超过${MAX_REJECT_REASON_LENGTH}字`)
      return
    }
    onConfirm(reason.trim())
    onClose()
  }

  return (
    <div className="sms-template-modal-overlay" onClick={onClose}>
      <div className="sms-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sms-template-modal-header">
          <h3>驳回模板</h3>
          <button className="sms-template-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sms-template-modal-body">
          <label className="sms-template-form-label"><span className="required">*</span>请输入驳回原因：</label>
          <textarea
            className="sms-template-reject-textarea"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError('')
            }}
            placeholder="请说明驳回的具体原因..."
            maxLength={MAX_REJECT_REASON_LENGTH}
          />
          <div className="sms-template-reject-counter">
            {reason.length} / {MAX_REJECT_REASON_LENGTH}
          </div>
          {error && <div className="sms-template-text-error" style={{ marginTop: 8, fontSize: 12 }}>{error}</div>}
        </div>
        <div className="sms-template-modal-footer">
          <button className="sms-template-btn" onClick={onClose}>取消</button>
          <button className="sms-template-btn sms-template-btn-danger" onClick={handleConfirm}>确认驳回</button>
        </div>
      </div>
    </div>
  )
}

const ExportModal = ({ groups, templates, currentGroupId, selectedTemplateId, onClose }) => {
  const [mode, setMode] = useState('current')
  const [selectedIds, setSelectedIds] = useState(selectedTemplateId ? [selectedTemplateId] : [])

  const groupTemplates = useMemo(() => {
    return filterTemplatesByGroup(templates, currentGroupId)
  }, [templates, currentGroupId])

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleExport = () => {
    let options = {}
    if (mode === 'current' && selectedTemplateId) {
      options.selectedIds = [selectedTemplateId]
    } else if (mode === 'selected') {
      options.selectedIds = selectedIds
    } else if (mode === 'group') {
      options.groupId = currentGroupId
    } else if (mode === 'all') {
      // no filter
    }
    const json = exportTemplatesToJSON(templates, groups, options)
    downloadJSONFile(json, `sms-templates-${Date.now()}.json`)
    onClose()
  }

  return (
    <div className="sms-template-modal-overlay" onClick={onClose}>
      <div className="sms-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sms-template-modal-header">
          <h3>导出模板</h3>
          <button className="sms-template-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sms-template-modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={mode === 'current'}
                disabled={!selectedTemplateId}
                onChange={() => setMode('current')}
              />
              <span>导出当前选中模板 {selectedTemplateId && `(${templates.find(t => t.id === selectedTemplateId)?.title || ''})`}</span>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'selected'} onChange={() => setMode('selected')} />
              <span>导出选定模板</span>
            </label>
            {mode === 'selected' && (
              <div style={{ marginLeft: 28, maxHeight: 180, overflowY: 'auto', border: '1px solid #e4e7ed', borderRadius: 4, padding: 8 }}>
                {groupTemplates.length === 0 ? (
                  <div style={{ color: '#909399', fontSize: 12, textAlign: 'center', padding: 20 }}>当前分组暂无模板</div>
                ) : (
                  groupTemplates.map((t) => (
                    <div key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 4 }}>
                      <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => handleToggle(t.id)} />
                      <span style={{ fontSize: 13 }}>{t.title}</span>
                      <StatusTag status={t.status} />
                    </div>
                  ))
                )}
              </div>
            )}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'group'} onChange={() => setMode('group')} />
              <span>导出当前分组所有模板 ({groupTemplates.length}个)</span>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'all'} onChange={() => setMode('all')} />
              <span>导出全部分组模板 ({templates.length}个)</span>
            </label>
          </div>
        </div>
        <div className="sms-template-modal-footer">
          <button className="sms-template-btn" onClick={onClose}>取消</button>
          <button className="sms-template-btn sms-template-btn-primary" onClick={handleExport}>确认导出</button>
        </div>
      </div>
    </div>
  )
}

const ImportResultModal = ({ result, onClose }) => (
  <div className="sms-template-modal-overlay" onClick={onClose}>
    <div className="sms-template-modal" onClick={(e) => e.stopPropagation()}>
      <div className="sms-template-modal-header">
        <h3>导入结果</h3>
        <button className="sms-template-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="sms-template-modal-body">
        <div className="sms-template-import-result">
          <div className="sms-template-import-summary">
            <div className="sms-template-import-stat">
              <span className="sms-template-import-stat-value sms-template-text-success">{result.success.length}</span>
              <span className="sms-template-import-stat-label">成功导入</span>
            </div>
            <div className="sms-template-import-stat">
              <span className="sms-template-import-stat-value sms-template-text-error">{result.skipped.length}</span>
              <span className="sms-template-import-stat-label">跳过</span>
            </div>
          </div>
          {result.skipped.length > 0 && (
            <>
              <h4 style={{ margin: '16px 0 8px', fontSize: 13 }}>跳过的模板：</h4>
              <div className="sms-template-import-skipped-list">
                {result.skipped.map((item, idx) => (
                  <div key={idx} className="sms-template-import-skipped-item">
                    <span>【{item.template?.title || '未知标题'}】</span>
                    <span>{item.reason}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="sms-template-modal-footer">
        <button className="sms-template-btn sms-template-btn-primary" onClick={onClose}>确定</button>
      </div>
    </div>
  </div>
)

const SimpleInputModal = ({ title, initialValue, placeholder, maxLength, onClose, onConfirm, confirmText = '确定' }) => {
  const [value, setValue] = useState(initialValue || '')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!value.trim()) {
      setError('名称不能为空')
      return
    }
    if (maxLength && value.length > maxLength) {
      setError(`长度不能超过${maxLength}字`)
      return
    }
    onConfirm(value.trim())
    onClose()
  }

  return (
    <div className="sms-template-modal-overlay" onClick={onClose}>
      <div className="sms-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sms-template-modal-header">
          <h3>{title}</h3>
          <button className="sms-template-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sms-template-modal-body">
          <input
            type="text"
            className="sms-template-form-input"
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
            autoFocus
          />
          {error && <div style={{ marginTop: 8, color: '#f56c6c', fontSize: 12 }}>{error}</div>}
        </div>
        <div className="sms-template-modal-footer">
          <button className="sms-template-btn" onClick={onClose}>取消</button>
          <button className="sms-template-btn sms-template-btn-primary" onClick={handleConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

const ConfirmDialog = ({ message, onClose, onConfirm }) => (
  <div className="sms-template-modal-overlay" onClick={onClose}>
    <div className="sms-template-modal" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
      <div className="sms-template-modal-header">
        <h3>确认操作</h3>
        <button className="sms-template-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="sms-template-modal-body">
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>{message}</div>
      </div>
      <div className="sms-template-modal-footer">
        <button className="sms-template-btn" onClick={onClose}>取消</button>
        <button className="sms-template-btn sms-template-btn-danger" onClick={() => { onConfirm(); onClose() }}>确认</button>
      </div>
    </div>
  </div>
)

const SmsTemplatePage = () => {
  const [state, setState] = useState(() => loadData())
  const [currentGroupId, setCurrentGroupId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [editingSignature, setEditingSignature] = useState(DEFAULT_SIGNATURE)
  const [editingGroupId, setEditingGroupId] = useState('')
  const [editingSamples, setEditingSamples] = useState({})

  const [groupSearch, setGroupSearch] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')

  const [showVariablePanel, setShowVariablePanel] = useState(false)
  const [showSamplesModal, setShowSamplesModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportResult, setShowImportResult] = useState(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [renameGroupInfo, setRenameGroupInfo] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [operationToast, setOperationToast] = useState('')

  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    saveData(state)
  }, [state])

  useEffect(() => {
    if (operationToast) {
      const timer = setTimeout(() => setOperationToast(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [operationToast])

  const showToast = (msg) => setOperationToast(msg)

  const filteredGroups = useMemo(() => {
    return searchItems(state.groups, groupSearch, ['name'])
  }, [state.groups, groupSearch])

  const filteredTemplates = useMemo(() => {
    let list = currentGroupId
      ? filterTemplatesByGroup(state.templates, currentGroupId)
      : state.templates
    list = searchItems(list, templateSearch, ['title', 'content'])
    return sortTemplates(list, 'updatedAt')
  }, [state.templates, currentGroupId, templateSearch])

  const selectedTemplate = useMemo(
    () => state.templates.find((t) => t.id === selectedTemplateId) || null,
    [state.templates, selectedTemplateId]
  )

  const editingVariables = useMemo(
    () => extractVariables(editingContent),
    [editingContent]
  )

  const charCountResult = useMemo(
    () => calculateCharCount(editingContent),
    [editingContent]
  )

  const lengthWarning = useMemo(
    () => getSmsLengthWarning(charCountResult.billingChars),
    [charCountResult.billingChars]
  )

  const varFormatValidation = useMemo(
    () => validateVariableFormat(editingContent),
    [editingContent]
  )

  const capabilities = useMemo(
    () => getStatusCapabilities(selectedTemplate?.status || TEMPLATE_STATUS.DRAFT),
    [selectedTemplate]
  )

  const previewContent = useMemo(() => {
    if (!editingContent) return ''
    const samples = { ...editingSamples }
    editingVariables.forEach((name) => {
      if (!samples[name]) {
        const preset = PRESET_VARIABLES.find((v) => v.name === name)
        if (preset) samples[name] = preset.sampleValue
      }
    })
    return (editingSignature || '') + (selectedTemplate ? buildPreviewContent({ content: editingContent, signature: '' }, samples) : '')
  }, [editingContent, editingSignature, selectedTemplate, editingSamples, editingVariables])

  const loadTemplateToEditor = useCallback((template) => {
    setSelectedTemplateId(template.id)
    setEditingTitle(template.title)
    setEditingContent(template.content)
    setEditingSignature(template.signature || DEFAULT_SIGNATURE)
    setEditingGroupId(template.groupId || currentGroupId)
    setEditingSamples(template.variableSamples || {})
    setSaveError('')
  }, [currentGroupId])

  const createNewTemplate = useCallback(() => {
    const initialGroupId = currentGroupId || state.groups[0]?.id
    const newTpl = {
      title: '新建短信模板',
      content: '',
      groupId: initialGroupId,
      signature: DEFAULT_SIGNATURE,
      variableSamples: {},
    }
    setSelectedTemplateId(null)
    setEditingTitle(newTpl.title)
    setEditingContent(newTpl.content)
    setEditingSignature(newTpl.signature)
    setEditingGroupId(newTpl.groupId)
    setEditingSamples({})
    setSaveError('')
  }, [currentGroupId, state.groups])

  const handleInsertVariable = useCallback((variable) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const placeholder = variable.placeholder
    const newContent = editingContent.slice(0, start) + placeholder + editingContent.slice(end)
    setEditingContent(newContent)
    setTimeout(() => {
      textarea.focus()
      const newPos = start + placeholder.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }, [editingContent])

  const handleSaveTemplate = useCallback(() => {
    setSaveError('')
    if (!editingTitle.trim()) {
      setSaveError('模板标题不能为空')
      return
    }
    if (!varFormatValidation.valid) {
      setSaveError(varFormatValidation.errors.join('；'))
      return
    }
    if (!canSaveTemplate(charCountResult.billingChars)) {
      setSaveError(`短信字数超过上限，无法保存`)
      return
    }

    const data = {
      title: editingTitle,
      content: editingContent,
      groupId: editingGroupId,
      signature: editingSignature,
      variableSamples: editingSamples,
    }

    if (selectedTemplateId) {
      const result = updateTemplate(state.templates, selectedTemplateId, data)
      if (!result.success) {
        setSaveError(result.error)
        return
      }
      setState((prev) => ({ ...prev, templates: result.templates }))
      showToast('保存成功')
    } else {
      const result = createTemplate(state.templates, data)
      if (!result.success) {
        setSaveError(result.error)
        return
      }
      setState((prev) => ({ ...prev, templates: result.templates }))
      setSelectedTemplateId(result.template.id)
      showToast('创建成功')
    }
  }, [
    editingTitle,
    editingContent,
    editingGroupId,
    editingSignature,
    editingSamples,
    selectedTemplateId,
    state.templates,
    varFormatValidation,
    charCountResult,
  ])

  const handleSubmitReview = useCallback(() => {
    if (!selectedTemplate) return
    const updated = transitionStatus(selectedTemplate, 'canSubmit')
    if (updated === selectedTemplate) return
    setState((prev) => ({
      ...prev,
      templates: prev.templates.map((t) => (t.id === updated.id ? updated : t)),
    }))
    showToast('已提交审核')
  }, [selectedTemplate])

  const handleApprove = useCallback(() => {
    if (!selectedTemplate) return
    const updated = transitionStatus(selectedTemplate, 'canApprove')
    if (updated === selectedTemplate) return
    setState((prev) => ({
      ...prev,
      templates: prev.templates.map((t) => (t.id === updated.id ? updated : t)),
    }))
    showToast('审核通过')
  }, [selectedTemplate])

  const handleReject = useCallback((reason) => {
    if (!selectedTemplate) return
    const updated = transitionStatus(selectedTemplate, 'canReject', { rejectReason: reason })
    if (updated === selectedTemplate) return
    setState((prev) => ({
      ...prev,
      templates: prev.templates.map((t) => (t.id === updated.id ? updated : t)),
    }))
    showToast('已驳回')
  }, [selectedTemplate])

  const handleCreateRevision = useCallback(() => {
    if (!selectedTemplate) return
    const result = createRevision(state.templates, selectedTemplate.id)
    if (!result.success) {
      showToast(result.error)
      return
    }
    setState((prev) => ({ ...prev, templates: result.templates }))
    loadTemplateToEditor(result.template)
    showToast('已创建修订版')
  }, [selectedTemplate, state.templates, loadTemplateToEditor])

  const handleDeleteTemplate = useCallback(() => {
    if (!selectedTemplate) return
    setConfirmDialog({
      message: `确定要删除模板「${selectedTemplate.title}」吗？此操作不可撤销。`,
      onConfirm: () => {
        const result = deleteTemplate(state.templates, selectedTemplate.id)
        if (!result.success) {
          showToast(result.error)
          return
        }
        setState((prev) => ({ ...prev, templates: result.templates }))
        setSelectedTemplateId(null)
        showToast('删除成功')
      },
    })
  }, [selectedTemplate, state.templates])

  const handleCreateGroup = useCallback((name) => {
    const result = createGroup(state.groups, name)
    if (!result.success) {
      showToast(result.error)
      return
    }
    setState((prev) => ({ ...prev, groups: result.groups }))
    setCurrentGroupId(result.group.id)
    showToast('分组创建成功')
  }, [state.groups])

  const handleRenameGroup = useCallback((groupId, newName) => {
    const result = renameGroup(state.groups, groupId, newName)
    if (!result.success) {
      showToast(result.error)
      return
    }
    setState((prev) => ({ ...prev, groups: result.groups }))
    showToast('重命名成功')
  }, [state.groups])

  const handleDeleteGroup = useCallback((groupId) => {
    const group = state.groups.find((g) => g.id === groupId)
    if (!group) return
    setConfirmDialog({
      message: `确定要删除分组「${group.name}」吗？空分组才可以删除。`,
      onConfirm: () => {
        const result = deleteGroup(state.groups, state.templates, groupId)
        if (!result.success) {
          showToast(result.error)
          return
        }
        setState((prev) => ({ ...prev, groups: result.groups, templates: result.templates }))
        if (currentGroupId === groupId) setCurrentGroupId('')
        showToast('分组删除成功')
      },
    })
  }, [state.groups, state.templates, currentGroupId])

  const handleExport = useCallback(() => {
    setShowExportModal(true)
  }, [])

  const handleImportClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }, [])

  const handleImportFile = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await readFileAsText(file)
      const parseResult = parseImportJSON(text)
      if (!parseResult.success) {
        showToast(parseResult.error)
        return
      }
      const importResult = importTemplates(state.groups, state.templates, parseResult.data)
      setState((prev) => ({ ...prev, groups: importResult.groups, templates: importResult.templates }))
      setShowImportResult(importResult)
    } catch (err) {
      showToast('文件读取失败')
    }
  }, [state.groups, state.templates])

  const renderHighlightedContent = (content) => {
    if (!content) return null
    const parts = []
    let lastIndex = 0
    const regex = /\{([^{}]+)\}/g
    let match
    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>)
      }
      parts.push(
        <span key={`var-${match.index}`} className="sms-variable">
          {match[0]}
        </span>
      )
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>)
    }
    return parts
  }

  return (
    <div className="sms-template-page">
      <div className="sms-template-topbar">
        <h1>📱 短信模板编辑器</h1>
        <div className="sms-template-toolbar">
          <button className="sms-template-btn" onClick={handleExport}>
            📤 导出模板
          </button>
          <button className="sms-template-btn" onClick={handleImportClick}>
            📥 导入模板
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div className="sms-template-main">
        <div className="sms-template-sidebar">
          <div className="sms-template-sidebar-section">
            <div className="sms-template-sidebar-title">
              <h3>📂 分组管理</h3>
              <button className="sms-template-icon-btn" title="新建分组" onClick={() => setShowCreateGroup(true)}>
                ➕
              </button>
            </div>
            <input
              className="sms-template-search"
              placeholder="搜索分组..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />
          </div>
          <div className="sms-template-group-list">
            <div
              className={`sms-template-group-item ${!currentGroupId ? 'active' : ''}`}
              onClick={() => setCurrentGroupId('')}
            >
              <span>📋</span>
              <span className="sms-template-group-name">全部分组</span>
              <span className="sms-template-group-count">{state.templates.length}</span>
            </div>
            {filteredGroups.map((group) => {
              const count = hasTemplatesInGroup(state.templates, group.id)
                ? state.templates.filter((t) => t.groupId === group.id).length
                : 0
              return (
                <div
                  key={group.id}
                  className={`sms-template-group-item ${currentGroupId === group.id ? 'active' : ''}`}
                  onClick={() => setCurrentGroupId(group.id)}
                >
                  <span>{group.isPreset ? '🏷️' : '📁'}</span>
                  <span className="sms-template-group-name">{group.name}</span>
                  <span className="sms-template-group-count">{count}</span>
                  {!group.isPreset && (
                    <div className="sms-template-group-actions">
                      <button
                        className="sms-template-icon-btn"
                        title="重命名"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRenameGroupInfo({ id: group.id, name: group.name })
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="sms-template-icon-btn"
                        title="删除"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group.id)
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="sms-template-content-area">
          <div className="sms-template-template-list">
            <div className="sms-template-template-header">
              <div className="sms-template-template-header-actions">
                <button className="sms-template-btn sms-template-btn-primary" onClick={createNewTemplate}>
                  ➕ 新建模板
                </button>
              </div>
              <input
                className="sms-template-search"
                placeholder="搜索模板标题或内容..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
              />
            </div>
            <div className="sms-template-template-grid">
              {filteredTemplates.length === 0 ? (
                <div className="sms-template-empty">
                  <div className="sms-template-empty-icon">📄</div>
                  <div>暂无模板，点击「新建模板」开始创建</div>
                </div>
              ) : (
                filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`sms-template-card ${selectedTemplateId === tpl.id ? 'active' : ''}`}
                    onClick={() => loadTemplateToEditor(tpl)}
                  >
                    <div className="sms-template-card-title">
                      <h4>{tpl.title}</h4>
                      <StatusTag status={tpl.status} />
                    </div>
                    <div className="sms-template-card-summary">
                      {getContentSummary(tpl.content) || '(模板内容为空)'}
                    </div>
                    <div className="sms-template-card-meta">
                      <span>更新于 {formatDateTime(tpl.updatedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sms-template-editor-panel">
            {!editingTitle && !selectedTemplate ? (
              <div className="sms-template-empty" style={{ flex: 1 }}>
                <div className="sms-template-empty-icon">✨</div>
                <div>选择左侧模板开始编辑，或新建一个模板</div>
              </div>
            ) : (
              <>
                <div className="sms-template-editor">
                  <div className="sms-template-editor-left">
                    <div className="sms-template-form-item">
                      <label className="sms-template-form-label">
                        <span className="required">*</span>模板标题
                      </label>
                      <input
                        className="sms-template-form-input"
                        placeholder="请输入模板标题"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        disabled={selectedTemplate && !capabilities.canEdit}
                      />
                    </div>

                    <div className="sms-template-form-item">
                      <label className="sms-template-form-label">
                        <span className="required">*</span>模板内容
                      </label>
                      <div className="sms-template-editor-toolbar">
                        <button
                          className="sms-template-btn"
                          onClick={() => setShowVariablePanel(true)}
                          disabled={selectedTemplate && !capabilities.canEdit}
                        >
                          🧩 插入变量
                        </button>
                        {editingVariables.length > 0 && (
                          <span style={{ fontSize: 12, color: '#606266', alignSelf: 'center' }}>
                            已使用变量：{editingVariables.join('、')}
                          </span>
                        )}
                      </div>
                      <div className="sms-template-textarea-wrapper">
                        <textarea
                          ref={textareaRef}
                          className="sms-template-textarea"
                          placeholder="请输入短信内容，可插入变量占位符..."
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          disabled={selectedTemplate && !capabilities.canEdit}
                        />
                      </div>
                      <div className="sms-template-stats-bar">
                        <span className="sms-template-stats-item">
                          总字符：<span className="sms-template-stats-value">{charCountResult.totalChars}</span>
                        </span>
                        <span className="sms-template-stats-item">
                          计费字数：<span className="sms-template-stats-value">{charCountResult.billingChars}</span>
                        </span>
                        <span className="sms-template-stats-item">
                          变量数：<span className="sms-template-stats-value">{charCountResult.variableCount}</span>
                        </span>
                      </div>
                      {(lengthWarning.level === 'warning' || lengthWarning.level === 'error') && (
                        <div
                          className={`sms-template-alert ${
                            lengthWarning.level === 'error'
                              ? 'sms-template-alert-error'
                              : 'sms-template-alert-warning'
                          }`}
                        >
                          {lengthWarning.level === 'error' ? '⛔' : '⚠️'}
                          {lengthWarning.message}
                        </div>
                      )}
                      {!varFormatValidation.valid && (
                        <div className="sms-template-alert sms-template-alert-error">
                          ❌ {varFormatValidation.errors.join('；')}
                        </div>
                      )}
                    </div>

                    <div className="sms-template-settings-section">
                      <h4>📎 模板设置</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="sms-template-form-item">
                          <label className="sms-template-form-label">签名前缀</label>
                          <input
                            className="sms-template-form-input"
                            placeholder="如：【XX平台】"
                            value={editingSignature}
                            onChange={(e) => setEditingSignature(e.target.value)}
                            disabled={selectedTemplate && !capabilities.canEdit}
                          />
                        </div>
                        <div className="sms-template-form-item">
                          <label className="sms-template-form-label">所属分组</label>
                          <select
                            className="sms-template-select"
                            value={editingGroupId}
                            onChange={(e) => setEditingGroupId(e.target.value)}
                            disabled={selectedTemplate && !capabilities.canEdit}
                          >
                            {state.groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {selectedTemplate?.status === TEMPLATE_STATUS.REJECTED && selectedTemplate.rejectReason && (
                      <div className="sms-template-reject-reason-banner">
                        <strong>❌ 驳回原因：</strong>
                        {selectedTemplate.rejectReason}
                      </div>
                    )}

                    {saveError && (
                      <div className="sms-template-alert sms-template-alert-error">
                        ❌ {saveError}
                      </div>
                    )}
                  </div>

                  <div className="sms-template-editor-right">
                    <div className="sms-template-preview-header">
                      <h3>📱 实时预览</h3>
                      <button
                        className="sms-template-btn"
                        size="small"
                        onClick={() => setShowSamplesModal(true)}
                        disabled={editingVariables.length === 0}
                      >
                        自定义示例值
                      </button>
                    </div>
                    <div className="sms-template-phone-frame">
                      <div className="sms-template-phone-notch"></div>
                      <div className="sms-template-phone-header">
                        <span>9:41</span>
                        <span>100%</span>
                      </div>
                      <div className="sms-template-phone-screen">
                        <div className="sms-template-phone-recipient">
                          发送至：{DEFAULT_SAMPLE_PHONE}
                        </div>
                        <div className="sms-template-sms-bubble">
                          {previewContent ? (
                            renderHighlightedContent(
                              (editingSignature || '') +
                              (selectedTemplate
                                ? buildPreviewContent(
                                    { content: editingContent, signature: '' },
                                    editingSamples
                                  )
                                : '')
                            )
                          ) : (
                            <span style={{ color: '#909399' }}>输入模板内容后显示预览...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sms-template-editor-actions">
                  {selectedTemplate && (
                    <StatusTag status={selectedTemplate.status} />
                  )}
                  {!selectedTemplate && <StatusTag status={TEMPLATE_STATUS.DRAFT} />}
                  <span style={{ flex: 1 }} />
                  {selectedTemplate && capabilities.canEdit === false && capabilities.canCreateRevision && (
                    <button className="sms-template-btn sms-template-btn-warning" onClick={handleCreateRevision}>
                      📋 创建修订版
                    </button>
                  )}
                  {selectedTemplate && capabilities.canApprove && (
                    <>
                      <button className="sms-template-btn sms-template-btn-danger" onClick={() => setShowRejectModal(true)}>
                        ❌ 驳回
                      </button>
                      <button className="sms-template-btn sms-template-btn-success" onClick={handleApprove}>
                        ✅ 通过
                      </button>
                    </>
                  )}
                  {selectedTemplate && capabilities.canSubmit && (
                    <button className="sms-template-btn sms-template-btn-warning" onClick={handleSubmitReview}>
                      📤 提交审核
                    </button>
                  )}
                  {selectedTemplate && capabilities.canDelete && (
                    <button className="sms-template-btn sms-template-btn-danger" onClick={handleDeleteTemplate}>
                      🗑️ 删除
                    </button>
                  )}
                  {(capabilities.canEdit || !selectedTemplate) && (
                    <button className="sms-template-btn sms-template-btn-primary" onClick={handleSaveTemplate}>
                      💾 保存
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {operationToast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            borderRadius: 4,
            fontSize: 13,
            zIndex: 9999,
          }}
        >
          {operationToast}
        </div>
      )}

      {showVariablePanel && (
        <VariablePanelModal
          onClose={() => setShowVariablePanel(false)}
          onSelect={handleInsertVariable}
        />
      )}

      {showSamplesModal && (
        <CustomSamplesModal
          variables={editingVariables}
          currentSamples={editingSamples}
          onClose={() => setShowSamplesModal(false)}
          onSave={(samples) => setEditingSamples(samples)}
        />
      )}

      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
        />
      )}

      {showExportModal && (
        <ExportModal
          groups={state.groups}
          templates={state.templates}
          currentGroupId={currentGroupId}
          selectedTemplateId={selectedTemplateId}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showImportResult && (
        <ImportResultModal
          result={showImportResult}
          onClose={() => setShowImportResult(null)}
        />
      )}

      {showCreateGroup && (
        <SimpleInputModal
          title="新建分组"
          initialValue=""
          placeholder="请输入分组名称"
          onClose={() => setShowCreateGroup(false)}
          onConfirm={handleCreateGroup}
        />
      )}

      {renameGroupInfo && (
        <SimpleInputModal
          title="重命名分组"
          initialValue={renameGroupInfo.name}
          placeholder="请输入新分组名称"
          onClose={() => setRenameGroupInfo(null)}
          onConfirm={(newName) => handleRenameGroup(renameGroupInfo.id, newName)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </div>
  )
}

export default SmsTemplatePage
