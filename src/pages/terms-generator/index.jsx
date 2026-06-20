import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import './terms-generator.css'
import { DEFAULT_TEMPLATES, VIEW_MODES, MAX_VERSIONS, VARIABLE_TYPES } from './constants.js'
import {
  loadVariables,
  saveVariables,
  loadVersions,
  addVersion,
  deleteVersion,
  loadCustomTemplates,
  addCustomTemplate,
  deleteCustomTemplate,
} from './storage.js'
import {
  replaceVariables,
  extractVariables,
  getTemplateSections,
  renderMarkdownToHtml,
  computeLineDiff,
  validateTemplate,
  buildExportHtml,
  mergeVariableDefinitions,
  formatTimestamp,
  copyToClipboard,
  downloadHtmlFile,
  createCustomTemplate,
} from './utils.js'

const Toast = ({ message, type }) => {
  if (!message) return null
  return <div className={`tg-toast ${type}`}>{message}</div>
}

const Modal = ({ title, onClose, children, footer, large }) => (
  <div className="tg-modal-backdrop" onClick={onClose}>
    <div className={`tg-modal ${large ? 'large' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="tg-modal-header">
        <span className="tg-modal-title">{title}</span>
        <button type="button" className="tg-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="tg-modal-body">{children}</div>
      {footer && <div className="tg-modal-footer">{footer}</div>}
    </div>
  </div>
)

const VariableInput = ({ variable, value, onChange }) => {
  const placeholder = variable.placeholder || ''

  if (variable.type === VARIABLE_TYPES.SELECT) {
    return (
      <div className="tg-variable-field">
        <label className="tg-variable-label">
          {variable.label}
          <span className="tg-variable-tag">{'{' + variable.key + '}'}</span>
        </label>
        <select
          className="tg-select"
          value={value || ''}
          onChange={(e) => onChange(variable.key, e.target.value)}
        >
          <option value="">请选择...</option>
          {(variable.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="tg-variable-field">
      <label className="tg-variable-label">
        {variable.label}
        <span className="tg-variable-tag">{'{' + variable.key + '}'}</span>
      </label>
      <input
        type={variable.type || 'text'}
        className="tg-input"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(variable.key, e.target.value)}
      />
    </div>
  )
}

const TemplateCard = ({ template, active, onClick, onDelete }) => {
  const sections = getTemplateSections(template.content).slice(0, 3)
  return (
    <div
      className={`tg-template-card ${active ? 'active' : ''}`}
      onClick={() => onClick(template)}
    >
      <div className="tg-template-card-header">
        <span className="tg-template-name">{template.name}</span>
        {!template.isDefault && (
          <button
            type="button"
            className="tg-btn tg-btn-sm tg-btn-danger"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(template.id)
            }}
          >
            删除
          </button>
        )}
      </div>
      <div className="tg-template-desc">{template.description}</div>
      {sections.length > 0 && (
        <div className="tg-template-sections">
          {sections.map((s, i) => (
            <div key={i} className="tg-template-section">{s.title}</div>
          ))}
        </div>
      )}
    </div>
  )
}

const VersionDiffView = ({ versionA, versionB }) => {
  const diffLines = useMemo(() => {
    if (!versionA || !versionB) return []
    return computeLineDiff(versionA.content || '', versionB.content || '')
  }, [versionA, versionB])

  let lineNum = 0
  return (
    <div className="tg-diff-container">
      {diffLines.map((line, idx) => {
        if (line.type === 'equal') lineNum++
        return (
          <div key={idx} className={`tg-diff-row ${line.type}`}>
            <div className="tg-diff-line-num">{line.type === 'equal' ? lineNum : ''}</div>
            <div className="tg-diff-content">{line.value || '\u00A0'}</div>
          </div>
        )
      })}
    </div>
  )
}

const TermsGeneratorPage = () => {
  const [customTemplates, setCustomTemplates] = useState(() => loadCustomTemplates())
  const [versions, setVersions] = useState(() => loadVersions())

  const allTemplates = useMemo(() => {
    return [...DEFAULT_TEMPLATES, ...customTemplates]
  }, [customTemplates])

  const initialTemplate = allTemplates[0]
  const initialContent = initialTemplate?.content || ''
  const initialExtractedVars = extractVariables(initialContent)
  const initialMergedVars = mergeVariableDefinitions(initialTemplate?.variables || [], initialExtractedVars)

  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate?.id || '')
  const [editorContent, setEditorContent] = useState(initialContent)
  const [variables, setVariables] = useState(() => {
    const saved = loadVariables()
    const merged = { ...saved }
    for (const v of initialMergedVars) {
      if (merged[v.key] === undefined) {
        merged[v.key] = ''
      }
    }
    return merged
  })
  const [viewMode, setViewMode] = useState(VIEW_MODES.SPLIT)
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [showSaveVersionModal, setShowSaveVersionModal] = useState(false)
  const [versionNote, setVersionNote] = useState('')
  const [selectedVersionIds, setSelectedVersionIds] = useState([])
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDesc, setNewTemplateDesc] = useState('')
  const exportPreviewRef = useRef(null)

  const selectedTemplate = useMemo(() => {
    return allTemplates.find((t) => t.id === selectedTemplateId) || allTemplates[0]
  }, [allTemplates, selectedTemplateId])

  useEffect(() => {
    saveVariables(variables)
  }, [variables])

  const finalVariables = useMemo(() => {
    const extractedVars = extractVariables(editorContent)
    const baseVars = selectedTemplate?.variables || []
    return mergeVariableDefinitions(baseVars, extractedVars)
  }, [editorContent, selectedTemplate])

  const replacedContent = useMemo(() => {
    return replaceVariables(editorContent, variables)
  }, [editorContent, variables])

  const previewHtml = useMemo(() => {
    return renderMarkdownToHtml(replacedContent)
  }, [replacedContent])

  const documentTitle = useMemo(() => {
    const firstSection = getTemplateSections(replacedContent)[0]
    return firstSection?.title || selectedTemplate?.name || '条款文档'
  }, [replacedContent, selectedTemplate])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: 'success' }), 2500)
  }, [])

  const handleVariableChange = useCallback((key, value) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleTemplateSelect = useCallback((template) => {
    setSelectedTemplateId(template.id)
    setEditorContent(template.content || '')
    const extractedVars = extractVariables(template.content || '')
    const mergedVars = mergeVariableDefinitions(template.variables || [], extractedVars)
    setVariables((prev) => {
      const newVars = { ...prev }
      for (const v of mergedVars) {
        if (newVars[v.key] === undefined) {
          newVars[v.key] = ''
        }
      }
      return newVars
    })
  }, [])

  const handleDeleteCustomTemplate = useCallback((templateId) => {
    const updated = deleteCustomTemplate(templateId)
    setCustomTemplates(updated)
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(DEFAULT_TEMPLATES[0]?.id || '')
    }
    showToast('自定义模板已删除')
  }, [selectedTemplateId, showToast])

  const handleSaveVersion = useCallback(() => {
    setShowSaveVersionModal(true)
    setVersionNote('')
  }, [])

  const confirmSaveVersion = useCallback(() => {
    if (versions.length >= MAX_VERSIONS) {
      showToast(`版本数量已达上限（${MAX_VERSIONS}），请先删除旧版本`, 'error')
      return
    }
    const result = addVersion({
      content: editorContent,
      variables: { ...variables },
      templateId: selectedTemplateId,
      note: versionNote.trim(),
    })
    setVersions(result.versions)
    setShowSaveVersionModal(false)
    showToast(`V${result.newVersion.versionNumber} 版本已保存`)
  }, [editorContent, variables, selectedTemplateId, versionNote, versions.length, showToast])

  const handleLoadVersion = useCallback((version) => {
    setEditorContent(version.content || '')
    setVariables(version.variables || {})
    if (version.templateId) {
      setSelectedTemplateId(version.templateId)
    }
    showToast(`已加载 V${version.versionNumber} 版本`)
  }, [showToast])

  const handleDeleteVersion = useCallback((versionId) => {
    const updated = deleteVersion(versionId)
    setVersions(updated)
    setSelectedVersionIds((prev) => prev.filter((id) => id !== versionId))
    showToast('版本已删除')
  }, [showToast])

  const handleVersionSelect = useCallback((versionId) => {
    setSelectedVersionIds((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId)
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]
      }
      return [...prev, versionId]
    })
  }, [])

  const handleShowDiff = useCallback(() => {
    if (selectedVersionIds.length !== 2) {
      showToast('请选择两个版本进行对比', 'error')
      return
    }
    setShowDiffModal(true)
  }, [selectedVersionIds.length, showToast])

  const handleCopyMarkdown = useCallback(async () => {
    const result = await copyToClipboard(replacedContent)
    if (result.success) {
      showToast('Markdown 源码已复制到剪贴板')
    } else {
      showToast('复制失败：' + (result.error || '未知错误'), 'error')
    }
  }, [replacedContent, showToast])

  const handleExportHtml = useCallback(() => {
    setShowExportModal(true)
  }, [])

  const confirmExportHtml = useCallback(() => {
    const companyName = variables['公司名称'] || ''
    const generateDate = new Date().toLocaleDateString('zh-CN')
    const fullHtml = buildExportHtml(previewHtml, documentTitle, companyName, generateDate)
    const filename = `${documentTitle}.html`
    const result = downloadHtmlFile(fullHtml, filename)
    if (result.success) {
      showToast('HTML 文件已下载')
      setShowExportModal(false)
    } else {
      showToast('导出失败：' + (result.error || '未知错误'), 'error')
    }
  }, [previewHtml, documentTitle, variables, showToast])

  const handleAddCustomTemplate = useCallback(() => {
    setShowCustomTemplateModal(true)
    setNewTemplateName('')
    setNewTemplateDesc('')
  }, [])

  const confirmAddCustomTemplate = useCallback(() => {
    const name = newTemplateName.trim()
    if (!name) {
      showToast('请输入模板名称', 'error')
      return
    }
    const newTemplate = createCustomTemplate(name, newTemplateDesc.trim())
    const validation = validateTemplate(newTemplate)
    if (!validation.valid) {
      showToast(validation.errors[0] || '模板校验失败', 'error')
      return
    }
    const updated = addCustomTemplate(newTemplate)
    setCustomTemplates(updated)
    setShowCustomTemplateModal(false)
    showToast('自定义模板已创建')
  }, [newTemplateName, newTemplateDesc, showToast])

  const diffVersions = useMemo(() => {
    const v1 = versions.find((v) => v.id === selectedVersionIds[0])
    const v2 = versions.find((v) => v.id === selectedVersionIds[1])
    return [v1, v2]
  }, [versions, selectedVersionIds])

  return (
    <div className="tg-page">
      <Toast message={toast.message} type={toast.type} />

      <div className="tg-container">
        <header className="tg-header">
          <div className="tg-header-left">
            <Link to="/" className="tg-back-link">← 返回首页</Link>
            <h1 className="tg-title">协议条款生成器</h1>
          </div>
          <div className="tg-header-actions">
            <button
              type="button"
              className="tg-btn tg-btn-secondary"
              onClick={handleCopyMarkdown}
            >
              📋 复制 Markdown
            </button>
            <button
              type="button"
              className="tg-btn tg-btn-secondary"
              onClick={handleSaveVersion}
            >
              💾 保存版本
            </button>
            <button
              type="button"
              className="tg-btn tg-btn-primary"
              onClick={handleExportHtml}
            >
              📤 导出 HTML
            </button>
          </div>
        </header>

        <div className="tg-variables-panel">
          <div className="tg-variables-header">
            <span className="tg-variables-title">变量配置</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              修改变量后预览将实时更新，变量值自动保存到本地
            </span>
          </div>
          <div className="tg-variables-grid">
            {finalVariables.map((v) => (
              <VariableInput
                key={v.key}
                variable={v}
                value={variables[v.key] || ''}
                onChange={handleVariableChange}
              />
            ))}
            {finalVariables.length === 0 && (
              <div className="tg-empty">当前内容中未检测到变量</div>
            )}
          </div>
        </div>

        <div className="tg-main-layout">
          <aside className="tg-sidebar">
            <div className="tg-panel">
              <div className="tg-panel-header">
                <span className="tg-panel-title">模板选择</span>
              </div>
              <div className="tg-template-list">
                {allTemplates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    active={selectedTemplateId === t.id}
                    onClick={handleTemplateSelect}
                    onDelete={t.isDefault ? undefined : handleDeleteCustomTemplate}
                  />
                ))}
              </div>
              <button
                type="button"
                className="tg-add-template-btn"
                onClick={handleAddCustomTemplate}
                style={{ marginTop: 12 }}
              >
                + 创建自定义模板
              </button>
            </div>

            <div className="tg-panel">
              <div className="tg-panel-header">
                <span className="tg-panel-title">版本历史</span>
                <div className="tg-version-actions">
                  {selectedVersionIds.length === 2 && (
                    <button
                      type="button"
                      className="tg-btn tg-btn-sm tg-btn-secondary"
                      onClick={handleShowDiff}
                    >
                      对比选中
                    </button>
                  )}
                </div>
              </div>
              {versions.length >= MAX_VERSIONS && (
                <div className="tg-warning">
                  版本数量已达上限（{MAX_VERSIONS}），请删除部分旧版本后再保存
                </div>
              )}
              <div className="tg-version-list">
                {versions.length === 0 ? (
                  <div className="tg-empty">暂无版本记录，点击「保存版本」创建快照</div>
                ) : (
                  versions.map((v) => (
                    <div key={v.id} className="tg-version-item">
                      <input
                        type="checkbox"
                        className="tg-version-checkbox"
                        checked={selectedVersionIds.includes(v.id)}
                        onChange={() => handleVersionSelect(v.id)}
                        title="选择用于对比"
                      />
                      <div className="tg-version-info">
                        <div className="tg-version-meta">
                          <span className="tg-version-number">V{v.versionNumber}</span>
                          <span className="tg-version-time">{formatTimestamp(v.timestamp)}</span>
                        </div>
                        {v.note && <div className="tg-version-note">{v.note}</div>}
                      </div>
                      <div className="tg-version-item-actions">
                        <button
                          type="button"
                          className="tg-btn tg-btn-sm tg-btn-ghost"
                          onClick={() => handleLoadVersion(v)}
                        >
                          加载
                        </button>
                        <button
                          type="button"
                          className="tg-btn tg-btn-sm tg-btn-danger"
                          onClick={() => handleDeleteVersion(v.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          <div className="tg-editor-section">
            <div className="tg-editor-toolbar">
              <span className="tg-editor-title">
                {selectedTemplate?.name || '条款编辑'} · {editorContent.length} 字符
              </span>
              <div className="tg-view-toggle">
                <button
                  type="button"
                  className={`tg-view-btn ${viewMode === VIEW_MODES.EDITOR_ONLY ? 'active' : ''}`}
                  onClick={() => setViewMode(VIEW_MODES.EDITOR_ONLY)}
                >
                  纯编辑
                </button>
                <button
                  type="button"
                  className={`tg-view-btn ${viewMode === VIEW_MODES.SPLIT ? 'active' : ''}`}
                  onClick={() => setViewMode(VIEW_MODES.SPLIT)}
                >
                  分栏
                </button>
                <button
                  type="button"
                  className={`tg-view-btn ${viewMode === VIEW_MODES.PREVIEW_ONLY ? 'active' : ''}`}
                  onClick={() => setViewMode(VIEW_MODES.PREVIEW_ONLY)}
                >
                  纯预览
                </button>
              </div>
            </div>
            <div className={`tg-editor-content ${viewMode === VIEW_MODES.SPLIT ? 'split' : ''}`}>
              {viewMode !== VIEW_MODES.PREVIEW_ONLY && (
                <div className="tg-editor-pane">
                  <div className="tg-editor-pane-header">
                    <span>✏️ Markdown 编辑</span>
                  </div>
                  <textarea
                    className="tg-editor-textarea"
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    spellCheck={false}
                    placeholder="在此编辑 Markdown 格式的条款内容..."
                  />
                </div>
              )}
              {viewMode !== VIEW_MODES.EDITOR_ONLY && (
                <div className="tg-editor-pane">
                  <div className="tg-editor-pane-header">
                    <span>👁️ 实时预览</span>
                  </div>
                  <div
                    className="tg-preview-content md-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSaveVersionModal && (
        <Modal
          title="保存版本"
          onClose={() => setShowSaveVersionModal(false)}
          footer={
            <>
              <button
                type="button"
                className="tg-btn tg-btn-ghost"
                onClick={() => setShowSaveVersionModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="tg-btn tg-btn-primary"
                onClick={confirmSaveVersion}
              >
                确认保存
              </button>
            </>
          }
        >
          <div className="tg-form-group">
            <label className="tg-form-label">版本备注（可选）</label>
            <textarea
              className="tg-form-textarea"
              rows={3}
              placeholder="描述本次修改的内容..."
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            将保存当前编辑内容和所有变量值为快照版本
          </div>
        </Modal>
      )}

      {showDiffModal && diffVersions[0] && diffVersions[1] && (
        <Modal
          title={`版本对比：V${diffVersions[0].versionNumber} ↔ V${diffVersions[1].versionNumber}`}
          onClose={() => setShowDiffModal(false)}
          large
        >
          <VersionDiffView versionA={diffVersions[0]} versionB={diffVersions[1]} />
          <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 13 }}>
            <span>
              <span style={{ display: 'inline-block', width: 12, height: 12, background: '#dcfce7', borderRadius: 2, marginRight: 6 }} />
              新增内容
            </span>
            <span>
              <span style={{ display: 'inline-block', width: 12, height: 12, background: '#fee2e2', borderRadius: 2, marginRight: 6 }} />
              删除内容
            </span>
          </div>
        </Modal>
      )}

      {showExportModal && (
        <Modal
          title="导出 HTML 预览"
          onClose={() => setShowExportModal(false)}
          large
          footer={
            <>
              <button
                type="button"
                className="tg-btn tg-btn-ghost"
                onClick={() => setShowExportModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="tg-btn tg-btn-primary"
                onClick={confirmExportHtml}
              >
                确认下载
              </button>
            </>
          }
        >
          <iframe
            ref={exportPreviewRef}
            className="tg-html-preview-frame"
            title="HTML 导出预览"
            srcDoc={buildExportHtml(
              previewHtml,
              documentTitle,
              variables['公司名称'] || '',
              new Date().toLocaleDateString('zh-CN')
            )}
          />
        </Modal>
      )}

      {showCustomTemplateModal && (
        <Modal
          title="创建自定义模板"
          onClose={() => setShowCustomTemplateModal(false)}
          footer={
            <>
              <button
                type="button"
                className="tg-btn tg-btn-ghost"
                onClick={() => setShowCustomTemplateModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="tg-btn tg-btn-primary"
                onClick={confirmAddCustomTemplate}
              >
                创建模板
              </button>
            </>
          }
        >
          <div className="tg-form-group">
            <label className="tg-form-label">模板名称 *</label>
            <input
              type="text"
              className="tg-input"
              placeholder="例如：服务条款"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
          </div>
          <div className="tg-form-group">
            <label className="tg-form-label">模板描述</label>
            <textarea
              className="tg-form-textarea"
              rows={2}
              placeholder="简要描述该模板的用途..."
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            创建后可在编辑器中自定义章节结构和变量占位符（使用 {'{变量名}'} 格式）
          </div>
        </Modal>
      )}
    </div>
  )
}

export default TermsGeneratorPage
