import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './weekly-report.css'
import {
  FIELD_SUMMARY,
  FIELD_PLAN,
  FIELD_PROBLEMS,
  TEMPLATE_OPTIONS
} from './constants.js'
import {
  createEmptyReport,
  getTemplateContent,
  assembleReportText,
  generateEmailSubject,
  getSummaryPreview,
  createReportRecord,
  upsertReport,
  extractReportFields,
  isReportEmpty,
  formatWeekLabel,
  getWeekDateRange
} from './utils.js'
import {
  loadReports,
  saveReports,
  loadCurrentDraft,
  saveCurrentDraft,
  loadSelectedTemplate,
  saveSelectedTemplate
} from './storage.js'

function EmailPreviewModal({ report, onClose, onCopy }) {
  const today = new Date()
  const subject = generateEmailSubject(today)
  const weekLabel = formatWeekLabel(today)
  const dateRange = getWeekDateRange(today)
  const body = assembleReportText(report)

  return (
    <div className="wr-modal-overlay" onClick={onClose}>
      <div className="wr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wr-modal-header">
          <h3 className="wr-modal-title">邮件预览</h3>
          <button className="wr-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="wr-modal-body">
          <div className="wr-email">
            <div className="wr-email-header">
              <div className="wr-email-row">
                <span className="wr-email-label">收件人</span>
                <span className="wr-email-value">team@company.com</span>
              </div>
              <div className="wr-email-row">
                <span className="wr-email-label">发件人</span>
                <span className="wr-email-value">me@company.com</span>
              </div>
              <div className="wr-email-row">
                <span className="wr-email-label">日期</span>
                <span className="wr-email-value">{dateRange.start} ~ {dateRange.end}（{weekLabel}）</span>
              </div>
            </div>
            <h4 className="wr-email-subject">主题：{subject}</h4>
            <div className="wr-email-content">{body}</div>
          </div>
        </div>
        <div className="wr-modal-footer">
          <button className="wr-btn" onClick={onClose}>关闭</button>
          <button className="wr-btn wr-btn-primary" onClick={() => onCopy(body)}>复制内容</button>
        </div>
      </div>
    </div>
  )
}

export default function WeeklyReportPage() {
  const navigate = useNavigate()

  const [reports, setReports] = useState(() => loadReports())
  const [selectedTemplate, setSelectedTemplate] = useState(() => loadSelectedTemplate())
  const [draft, setDraft] = useState(() => {
    const saved = loadCurrentDraft()
    if (saved) return saved
    return getTemplateContent(loadSelectedTemplate())
  })
  const [activeReportId, setActiveReportId] = useState(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    saveReports(reports)
  }, [reports])

  useEffect(() => {
    saveCurrentDraft(draft)
  }, [draft])

  useEffect(() => {
    saveSelectedTemplate(selectedTemplate)
  }, [selectedTemplate])

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])

  const handleFieldChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId)
  }

  const handleResetToTemplate = () => {
    const content = getTemplateContent(selectedTemplate)
    setDraft(content)
    showToast('已重置为模板')
  }

  const handleSaveReport = useCallback(() => {
    if (isReportEmpty(draft)) {
      showToast('请先填写内容')
      return
    }
    const record = createReportRecord(draft)
    setReports((prev) => upsertReport(prev, record))
    setActiveReportId(record.id)
    showToast('周报已保存')
  }, [draft, showToast])

  const handleLoadReport = (report) => {
    const fields = extractReportFields(report)
    setDraft(fields)
    setActiveReportId(report.id)
  }

  const handleCopyReport = useCallback(async () => {
    const text = assembleReportText(draft)
    try {
      await navigator.clipboard.writeText(text)
      showToast('已复制到剪贴板')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      showToast('已复制到剪贴板')
    }
  }, [draft, showToast])

  const handleEmailCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('已复制到剪贴板')
    } catch {
      showToast('复制失败')
    }
  }, [showToast])

  const handleNewReport = () => {
    setDraft(createEmptyReport())
    setActiveReportId(null)
    showToast('已创建新周报')
  }

  return (
    <div className="wr-page">
      <div className="wr-header">
        <h1 className="wr-title">周报生成器</h1>
        <button className="wr-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
      </div>

      <div className="wr-main-layout">
        <aside className="wr-sidebar">
          <h3 className="wr-sidebar-title">历史周报</h3>
          {reports.length === 0 ? (
            <div className="wr-empty-history">暂无历史周报</div>
          ) : (
            <ul className="wr-history-list">
              {reports.map((report) => (
                <li key={report.id}>
                  <button
                    className={`wr-history-item ${activeReportId === report.id ? 'wr-active' : ''}`}
                    onClick={() => handleLoadReport(report)}
                  >
                    <p className="wr-history-week">{report.weekLabel}</p>
                    <p className="wr-history-range">{report.dateRange.start} ~ {report.dateRange.end}</p>
                    <p className="wr-history-preview">
                      {getSummaryPreview(report[FIELD_SUMMARY])}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="wr-content">
          <div className="wr-toolbar">
            <div className="wr-template-group">
              <label className="wr-template-label">模板：</label>
              <select
                className="wr-template-select"
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                {TEMPLATE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button className="wr-btn" onClick={handleResetToTemplate}>重置为模板</button>
              <button className="wr-btn" onClick={handleNewReport}>新建</button>
              <button className="wr-btn" onClick={handleSaveReport}>保存周报</button>
            </div>
            <div className="wr-action-group">
              <button className="wr-btn" onClick={() => setShowEmailPreview(true)}>邮件预览</button>
              <button className="wr-btn wr-btn-primary" onClick={handleCopyReport}>一键复制</button>
            </div>
          </div>

          <div className="wr-editors">
            <div className="wr-editor-panel">
              <h3 className="wr-editor-title">本周工作总结</h3>
              <textarea
                className="wr-editor-textarea"
                placeholder="请填写本周完成的工作..."
                value={draft[FIELD_SUMMARY]}
                onChange={(e) => handleFieldChange(FIELD_SUMMARY, e.target.value)}
              />
            </div>
            <div className="wr-editor-panel">
              <h3 className="wr-editor-title">下周工作计划</h3>
              <textarea
                className="wr-editor-textarea"
                placeholder="请填写下周计划的工作..."
                value={draft[FIELD_PLAN]}
                onChange={(e) => handleFieldChange(FIELD_PLAN, e.target.value)}
              />
            </div>
            <div className="wr-editor-panel">
              <h3 className="wr-editor-title">遇到的问题</h3>
              <textarea
                className="wr-editor-textarea"
                placeholder="请填写遇到的问题和需要的支持..."
                value={draft[FIELD_PROBLEMS]}
                onChange={(e) => handleFieldChange(FIELD_PROBLEMS, e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {showEmailPreview && (
        <EmailPreviewModal
          report={draft}
          onClose={() => setShowEmailPreview(false)}
          onCopy={handleEmailCopy}
        />
      )}

      {toast && <div className="wr-toast">{toast}</div>}
    </div>
  )
}
