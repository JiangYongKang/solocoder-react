import { useMemo } from 'react'
import {
  markdownToHtml,
  generateResumeMarkdown,
  getVisibleModules,
  getTemplateById,
} from './resumeTemplatesCore'
import { MODULE_TYPES } from './constants'

export default function ResumePreview({
  modules,
  templateId,
  isPrintMode = false,
}) {
  const template = getTemplateById(templateId)
  const templateClass = `rt-template-${templateId}`

  const htmlContent = useMemo(() => {
    const markdown = generateResumeMarkdown(modules)
    return markdownToHtml(markdown)
  }, [modules])

  const visibleModules = getVisibleModules(modules)
  const personalInfoModule = visibleModules.find(
    (m) => m.type === MODULE_TYPES.PERSONAL_INFO
  )
  const otherModules = visibleModules.filter(
    (m) => m.type !== MODULE_TYPES.PERSONAL_INFO
  )

  const renderContent = () => {
    if (template.layout === 'two-column') {
      const leftModules = otherModules.slice(0, Math.ceil(otherModules.length / 2))
      const rightModules = otherModules.slice(Math.ceil(otherModules.length / 2))

      const leftHtml = leftModules.map((m) => markdownToHtml(m.content)).join('\n\n')
      const rightHtml = rightModules.map((m) => markdownToHtml(m.content)).join('\n\n')
      const personalHtml = personalInfoModule ? markdownToHtml(personalInfoModule.content) : ''

      return (
        <div className="rt-resume-content">
          <div dangerouslySetInnerHTML={{ __html: personalHtml }} />
          <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
            <div className="rt-resume-left" style={{ flex: '0.7' }}>
              <div dangerouslySetInnerHTML={{ __html: leftHtml }} />
            </div>
            <div className="rt-resume-right" style={{ flex: '1.3' }}>
              <div dangerouslySetInnerHTML={{ __html: rightHtml }} />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        className="rt-resume-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    )
  }

  if (isPrintMode) {
    return (
      <div className={templateClass}>
        <div className="rt-a4-page">{renderContent()}</div>
      </div>
    )
  }

  return (
    <div className="rt-right-panel">
      <div className="rt-preview-toolbar">
        <span className="rt-panel-title">实时预览</span>
      </div>
      <div className="rt-preview-container">
        <div className={templateClass} style={{ transition: 'all 0.3s ease' }}>
          <div className="rt-a4-page">{renderContent()}</div>
        </div>
      </div>
    </div>
  )
}
