import { TEMPLATES, TEMPLATE_INFO, MODULE_TYPES } from './constants'
import { getModuleLabel, getVisibleModules } from './resumeCore'

function BasicInfoContent({ data }) {
  if (!data) return null
  const rows = []
  if (data.phone) rows.push({ label: '电话', value: data.phone })
  if (data.email) rows.push({ label: '邮箱', value: data.email })
  if (data.location) rows.push({ label: '所在地', value: data.location })
  if (data.homepage) rows.push({ label: '主页', value: data.homepage })
  return rows
}

function JobIntentionContent({ data }) {
  if (!data) return null
  const parts = []
  if (data.position) parts.push(data.position)
  if (data.salary) parts.push(`薪资：${data.salary}`)
  if (data.city) parts.push(`城市：${data.city}`)
  if (data.status) parts.push(data.status)
  return parts.join(' · ')
}

function ClassicTemplate({ modules }) {
  const visible = getVisibleModules(modules)
  const basicMod = visible.find((m) => m.type === MODULE_TYPES.BASIC_INFO)
  const otherMods = visible.filter((m) => m.type !== MODULE_TYPES.BASIC_INFO)
  const basicInfo = basicMod?.data || {}
  const contactRows = BasicInfoContent({ data: basicInfo })

  return (
    <div className="re-tpl-classic">
      <div className="re-cv-header">
        {basicInfo.name && <h1 className="re-cv-name">{basicInfo.name}</h1>}
        {contactRows.length > 0 && (
          <div className="re-cv-contact">
            {contactRows.map((r, i) => (
              <span key={i}>{r.label}：{r.value}</span>
            ))}
          </div>
        )}
      </div>

      {otherMods.map((mod) => (
        <div key={mod.id} className="re-cv-section">
          <h2 className="re-cv-section-title">{getModuleLabel(mod)}</h2>

          {mod.type === MODULE_TYPES.JOB_INTENTION && (
            <div className="re-cv-text-content">
              {JobIntentionContent({ data: mod.data })}
            </div>
          )}

          {(mod.type === MODULE_TYPES.EDUCATION ||
            mod.type === MODULE_TYPES.WORK_EXPERIENCE ||
            mod.type === MODULE_TYPES.PROJECT_EXPERIENCE) && (
            <div>
              {Array.isArray(mod.data?.items) &&
                mod.data.items.map((item) => {
                  const dateRange =
                    item.startDate || item.endDate
                      ? `${item.startDate || ''} - ${item.endDate || ''}`
                      : ''
                  let title = ''
                  let sub = ''
                  if (mod.type === MODULE_TYPES.EDUCATION) {
                    title = item.school || ''
                    const parts = []
                    if (item.major) parts.push(item.major)
                    if (item.degree) parts.push(item.degree)
                    sub = parts.join(' · ')
                  } else if (mod.type === MODULE_TYPES.WORK_EXPERIENCE) {
                    title = item.company || ''
                    sub = item.position || ''
                  } else if (mod.type === MODULE_TYPES.PROJECT_EXPERIENCE) {
                    title = item.name || ''
                    sub = item.role || ''
                  }
                  return (
                    <div key={item.id} className="re-cv-item">
                      <div className="re-cv-item-head">
                        <div>
                          <span className="re-cv-item-title">{title}</span>
                          {sub && <span className="re-cv-item-sub"> · {sub}</span>}
                        </div>
                        {dateRange && (
                          <span className="re-cv-item-date">{dateRange}</span>
                        )}
                      </div>
                      {item.description && (
                        <div className="re-cv-item-desc">{item.description}</div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}

          {(mod.type === MODULE_TYPES.SKILLS ||
            mod.type === MODULE_TYPES.SELF_EVALUATION ||
            mod.type === MODULE_TYPES.CUSTOM) && (
            <div className="re-cv-text-content">{mod.data?.content || ''}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function ModernTemplate({ modules }) {
  const visible = getVisibleModules(modules)
  const basicMod = visible.find((m) => m.type === MODULE_TYPES.BASIC_INFO)
  const sidebarMods = visible.filter(
    (m) => m.type === MODULE_TYPES.JOB_INTENTION || m.type === MODULE_TYPES.SKILLS
  )
  const mainMods = visible.filter(
    (m) =>
      m.type !== MODULE_TYPES.BASIC_INFO &&
      m.type !== MODULE_TYPES.JOB_INTENTION &&
      m.type !== MODULE_TYPES.SKILLS
  )
  const basicInfo = basicMod?.data || {}
  const contactRows = BasicInfoContent({ data: basicInfo })

  return (
    <div className="re-tpl-modern">
      <div className="re-cv-sidebar">
        {basicInfo.name && <h1 className="re-cv-name">{basicInfo.name}</h1>}

        {contactRows.length > 0 && (
          <div className="re-cv-sidebar-section">
            <h3 className="re-cv-sidebar-title">联系方式</h3>
            {contactRows.map((r, i) => (
              <div key={i} className="re-cv-sidebar-row">
                <span className="re-cv-sidebar-row-label">{r.label}：</span>
                {r.value}
              </div>
            ))}
          </div>
        )}

        {sidebarMods.map((mod) => (
          <div key={mod.id} className="re-cv-sidebar-section">
            <h3 className="re-cv-sidebar-title">{getModuleLabel(mod)}</h3>
            {mod.type === MODULE_TYPES.JOB_INTENTION && (
              <div>
                {mod.data?.position && (
                  <div className="re-cv-sidebar-row">
                    <span className="re-cv-sidebar-row-label">职位：</span>
                    {mod.data.position}
                  </div>
                )}
                {mod.data?.salary && (
                  <div className="re-cv-sidebar-row">
                    <span className="re-cv-sidebar-row-label">薪资：</span>
                    {mod.data.salary}
                  </div>
                )}
                {mod.data?.city && (
                  <div className="re-cv-sidebar-row">
                    <span className="re-cv-sidebar-row-label">城市：</span>
                    {mod.data.city}
                  </div>
                )}
                {mod.data?.status && (
                  <div className="re-cv-sidebar-row">{mod.data.status}</div>
                )}
              </div>
            )}
            {(mod.type === MODULE_TYPES.SKILLS ||
              mod.type === MODULE_TYPES.CUSTOM) && (
              <div className="re-cv-sidebar-row" style={{ whiteSpace: 'pre-wrap' }}>
                {mod.data?.content || ''}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="re-cv-main">
        {mainMods.map((mod) => (
          <div key={mod.id} className="re-cv-main-section">
            <h2 className="re-cv-main-section-title">{getModuleLabel(mod)}</h2>

            {(mod.type === MODULE_TYPES.EDUCATION ||
              mod.type === MODULE_TYPES.WORK_EXPERIENCE ||
              mod.type === MODULE_TYPES.PROJECT_EXPERIENCE) && (
              <div>
                {Array.isArray(mod.data?.items) &&
                  mod.data.items.map((item) => {
                    const dateRange =
                      item.startDate || item.endDate
                        ? `${item.startDate || ''} - ${item.endDate || ''}`
                        : ''
                    let title = ''
                    let sub = ''
                    if (mod.type === MODULE_TYPES.EDUCATION) {
                      title = item.school || ''
                      const parts = []
                      if (item.major) parts.push(item.major)
                      if (item.degree) parts.push(item.degree)
                      sub = parts.join(' · ')
                    } else if (mod.type === MODULE_TYPES.WORK_EXPERIENCE) {
                      title = item.company || ''
                      sub = item.position || ''
                    } else if (mod.type === MODULE_TYPES.PROJECT_EXPERIENCE) {
                      title = item.name || ''
                      sub = item.role || ''
                    }
                    return (
                      <div key={item.id} className="re-cv-item">
                        <div className="re-cv-item-head">
                          <div>
                            <span className="re-cv-item-title">{title}</span>
                            {sub && <span className="re-cv-item-sub"> · {sub}</span>}
                          </div>
                          {dateRange && (
                            <span className="re-cv-item-date">{dateRange}</span>
                          )}
                        </div>
                        {item.description && (
                          <div className="re-cv-item-desc">{item.description}</div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}

            {(mod.type === MODULE_TYPES.SELF_EVALUATION ||
              mod.type === MODULE_TYPES.CUSTOM) && (
              <div className="re-cv-text-content">{mod.data?.content || ''}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MinimalTemplate({ modules }) {
  const visible = getVisibleModules(modules)
  const basicMod = visible.find((m) => m.type === MODULE_TYPES.BASIC_INFO)
  const otherMods = visible.filter((m) => m.type !== MODULE_TYPES.BASIC_INFO)
  const basicInfo = basicMod?.data || {}
  const contactRows = BasicInfoContent({ data: basicInfo })

  return (
    <div className="re-tpl-minimal">
      <div className="re-cv-header">
        {basicInfo.name && <h1 className="re-cv-name">{basicInfo.name}</h1>}
        {contactRows.length > 0 && (
          <div className="re-cv-contact">
            {contactRows.map((r, i) => (
              <span key={i}>
                <strong>{r.label}</strong> {r.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {otherMods.map((mod) => (
        <div key={mod.id} className="re-cv-section">
          <h2 className="re-cv-section-title">{getModuleLabel(mod)}</h2>

          {mod.type === MODULE_TYPES.JOB_INTENTION && (
            <div className="re-cv-text-content">
              {JobIntentionContent({ data: mod.data })}
            </div>
          )}

          {(mod.type === MODULE_TYPES.EDUCATION ||
            mod.type === MODULE_TYPES.WORK_EXPERIENCE ||
            mod.type === MODULE_TYPES.PROJECT_EXPERIENCE) && (
            <div>
              {Array.isArray(mod.data?.items) &&
                mod.data.items.map((item) => {
                  const dateRange =
                    item.startDate || item.endDate
                      ? `${item.startDate || ''} - ${item.endDate || ''}`
                      : ''
                  let title = ''
                  let sub = ''
                  if (mod.type === MODULE_TYPES.EDUCATION) {
                    title = item.school || ''
                    const parts = []
                    if (item.major) parts.push(item.major)
                    if (item.degree) parts.push(item.degree)
                    sub = parts.join(' · ')
                  } else if (mod.type === MODULE_TYPES.WORK_EXPERIENCE) {
                    title = item.company || ''
                    sub = item.position || ''
                  } else if (mod.type === MODULE_TYPES.PROJECT_EXPERIENCE) {
                    title = item.name || ''
                    sub = item.role || ''
                  }
                  return (
                    <div key={item.id} className="re-cv-item">
                      <div className="re-cv-item-head">
                        <div>
                          <span className="re-cv-item-title">{title}</span>
                          {sub && <span className="re-cv-item-sub"> · {sub}</span>}
                        </div>
                        {dateRange && (
                          <span className="re-cv-item-date">{dateRange}</span>
                        )}
                      </div>
                      {item.description && (
                        <div className="re-cv-item-desc">{item.description}</div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}

          {(mod.type === MODULE_TYPES.SKILLS ||
            mod.type === MODULE_TYPES.SELF_EVALUATION ||
            mod.type === MODULE_TYPES.CUSTOM) && (
            <div className="re-cv-text-content">{mod.data?.content || ''}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function ResumePreview({ templateId, modules, printArea = false }) {
  const templateInfo = TEMPLATE_INFO[templateId] || TEMPLATE_INFO[TEMPLATES.CLASSIC]
  const style = {
    '--re-primary': templateInfo.primaryColor,
    '--re-accent': templateInfo.accentColor,
  }

  let Template = ClassicTemplate
  if (templateId === TEMPLATES.MODERN) Template = ModernTemplate
  else if (templateId === TEMPLATES.MINIMAL) Template = MinimalTemplate

  return (
    <div
      className={printArea ? 're-print-area' : ''}
      style={printArea ? {} : undefined}
    >
      <div className="re-a4-page" style={style}>
        <Template modules={modules} />
      </div>
    </div>
  )
}

export default ResumePreview
