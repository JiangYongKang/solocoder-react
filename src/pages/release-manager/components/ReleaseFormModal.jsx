import { useState, useMemo } from 'react'
import { validateReleaseForm, isReleaseEditable, simpleMarkdownToHtml } from '../utils.js'

export default function ReleaseFormModal({ open, editingRelease, existingReleases, onClose, onSubmit }) {
  const [version, setVersion] = useState(editingRelease?.version || '')
  const [title, setTitle] = useState(editingRelease?.title || '')
  const [changelog, setChangelog] = useState(editingRelease?.changelog || '')
  const [releaseDate, setReleaseDate] = useState(editingRelease?.releaseDate || '')
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState({})

  const isEdit = !!editingRelease
  const readOnly = isEdit && !isReleaseEditable(editingRelease)

  const previewHtml = useMemo(() => simpleMarkdownToHtml(changelog), [changelog])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = { version, title, changelog, releaseDate }
    const excludeId = editingRelease ? editingRelease.id : null
    const validationErrors = validateReleaseForm(formData, existingReleases, excludeId)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    const result = onSubmit(formData)
    if (result && !result.success && result.errors) {
      setErrors(result.errors)
    }
  }

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="rm-modal rm-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="rm-modal-header">
          <h3>
            {readOnly ? '查看版本' : isEdit ? '编辑版本' : '新建版本'}
            {readOnly && <span className="rm-readonly-tag">只读（非草稿状态）</span>}
          </h3>
          <button className="rm-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rm-modal-body">
            <div className="rm-form-row">
              <div className="rm-form-item" style={{ flex: '0 0 50%' }}>
                <label className="rm-form-label">
                  版本号 <span className="rm-required">*</span>
                </label>
                <input
                  type="text"
                  className={`rm-input ${errors.version ? 'error' : ''}`}
                  placeholder="如 v1.2.3 或 1.2.3"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={readOnly}
                />
                {errors.version && <div className="rm-form-error">{errors.version}</div>}
              </div>
              <div className="rm-form-item" style={{ flex: '0 0 50%' }}>
                <label className="rm-form-label">发布日期</label>
                <input
                  type="date"
                  className={`rm-input ${errors.releaseDate ? 'error' : ''}`}
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  disabled={readOnly}
                />
                {errors.releaseDate && <div className="rm-form-error">{errors.releaseDate}</div>}
              </div>
            </div>

            <div className="rm-form-item">
              <label className="rm-form-label">
                发布标题 <span className="rm-required">*</span>
              </label>
              <input
                type="text"
                className={`rm-input ${errors.title ? 'error' : ''}`}
                placeholder="请输入发布标题（不超过 100 字符）"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={readOnly}
              />
              <div className="rm-form-help">{title.length}/100</div>
              {errors.title && <div className="rm-form-error">{errors.title}</div>}
            </div>

            <div className="rm-form-item">
              <div className="rm-changelog-header">
                <label className="rm-form-label" style={{ marginBottom: 0 }}>
                  变更日志（支持 Markdown）
                </label>
                <div className="rm-changelog-toggle">
                  <button
                    type="button"
                    className={`rm-toggle-btn ${!showPreview ? 'active' : ''}`}
                    onClick={() => setShowPreview(false)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className={`rm-toggle-btn ${showPreview ? 'active' : ''}`}
                    onClick={() => setShowPreview(true)}
                  >
                    预览
                  </button>
                </div>
              </div>
              {!showPreview ? (
                <textarea
                  className="rm-textarea"
                  rows={10}
                  placeholder="请输入变更日志，支持 Markdown 语法..."
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  disabled={readOnly}
                />
              ) : (
                <div
                  className="rm-md-preview"
                  dangerouslySetInnerHTML={{ __html: previewHtml || '<p style="color:#999">暂无内容</p>' }}
                />
              )}
            </div>
          </div>

          <div className="rm-modal-footer">
            <button type="button" className="rm-btn rm-btn-default" onClick={onClose}>
              取消
            </button>
            {!readOnly && (
              <button type="submit" className="rm-btn rm-btn-primary">
                {isEdit ? '保存修改' : '创建版本'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
