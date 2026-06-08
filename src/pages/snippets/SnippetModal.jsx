import { useState } from 'react'
import CodeEditor from './CodeEditor'
import { LANGUAGES, LANGUAGE_LABELS } from './snippetsUtils'

function SnippetModal({ visible, snippet, onClose, onSave }) {
  const [title, setTitle] = useState(snippet?.title || '')
  const [language, setLanguage] = useState(snippet?.language || LANGUAGES.JAVASCRIPT)
  const [code, setCode] = useState(snippet?.code || '')
  const [notes, setNotes] = useState(snippet?.notes || '')
  const [errors, setErrors] = useState({})

  if (!visible) return null

  const validate = () => {
    const nextErrors = {}
    if (!title.trim()) {
      nextErrors.title = '请输入标题'
    }
    if (!code.trim()) {
      nextErrors.code = '请输入代码内容'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      title: title.trim(),
      language,
      code,
      notes,
    })
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="sn-modal-mask" onClick={handleOverlayClick}>
      <div className="sn-modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="sn-modal-header">
            <h2>{snippet ? '编辑代码片段' : '新建代码片段'}</h2>
            <button type="button" className="sn-modal-close" onClick={onClose} aria-label="关闭">
              ×
            </button>
          </div>
          <div className="sn-modal-body">
            <div className="sn-form-row">
              <label className="sn-form-label">标题</label>
              <input
                type="text"
                className={`sn-form-input ${errors.title ? 'has-error' : ''}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给你的代码片段起个名字"
              />
              {errors.title && <span className="sn-form-error">{errors.title}</span>}
            </div>

            <div className="sn-form-row">
              <label className="sn-form-label">语言</label>
              <select
                className="sn-form-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {Object.values(LANGUAGES).map((lang) => (
                  <option key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </option>
                ))}
              </select>
            </div>

            <div className="sn-form-row">
              <label className="sn-form-label">代码内容</label>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                placeholder="在此粘贴或输入代码..."
              />
              {errors.code && <span className="sn-form-error">{errors.code}</span>}
            </div>

            <div className="sn-form-row">
              <label className="sn-form-label">备注 (Markdown)</label>
              <textarea
                className="sn-form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="可以用 Markdown 写一些说明..."
                rows={4}
              />
            </div>
          </div>
          <div className="sn-modal-footer">
            <button type="button" className="sn-btn" onClick={onClose}>取消</button>
            <button type="submit" className="sn-btn sn-btn-primary">
              {snippet ? '保存修改' : '创建片段'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SnippetModal
