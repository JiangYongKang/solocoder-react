import { TEMPLATES, FIELD_SUMMARY, FIELD_PLAN, FIELD_PROBLEMS } from './constants.js'

export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export function getWeekKey(date) {
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

export function formatWeekLabel(date) {
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}年第${week}周`
}

export function getWeekDateRange(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  }
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function createEmptyReport() {
  return {
    [FIELD_SUMMARY]: '',
    [FIELD_PLAN]: '',
    [FIELD_PROBLEMS]: ''
  }
}

export function getTemplateContent(templateId) {
  const template = TEMPLATES[templateId]
  if (!template) return createEmptyReport()
  return {
    [FIELD_SUMMARY]: template[FIELD_SUMMARY],
    [FIELD_PLAN]: template[FIELD_PLAN],
    [FIELD_PROBLEMS]: template[FIELD_PROBLEMS]
  }
}

export function assembleReportText(report) {
  const sections = [
    { title: '本周工作总结', content: report[FIELD_SUMMARY] },
    { title: '下周工作计划', content: report[FIELD_PLAN] },
    { title: '遇到的问题', content: report[FIELD_PROBLEMS] }
  ]
  return sections
    .map(({ title, content }) => `## ${title}\n\n${content || '（未填写）'}`)
    .join('\n\n---\n\n')
}

export function generateEmailSubject(date) {
  const week = getWeekNumber(date)
  return `周报 - 第${week}周`
}

export function getSummaryPreview(summary, length = 30) {
  if (!summary) return '（未填写）'
  const clean = summary
    .replace(/#/g, '')
    .replace(/\*/g, '')
    .replace(/-/g, '')
    .replace(/\|/g, '')
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/\n/g, ' ')
    .trim()
  if (clean.length <= length) return clean
  return clean.slice(0, length) + '...'
}

export function createReportRecord(report, date = new Date()) {
  const weekKey = getWeekKey(date)
  return {
    id: `report-${weekKey}`,
    weekKey,
    weekLabel: formatWeekLabel(date),
    dateRange: getWeekDateRange(date),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...report
  }
}

export function upsertReport(reports, newReport) {
  const existingIndex = reports.findIndex(r => r.weekKey === newReport.weekKey)
  if (existingIndex >= 0) {
    const updated = [...reports]
    updated[existingIndex] = {
      ...updated[existingIndex],
      ...newReport,
      updatedAt: Date.now()
    }
    return updated
  }
  return [newReport, ...reports]
}

export function sortReportsByDate(reports) {
  return [...reports].sort((a, b) => b.updatedAt - a.updatedAt)
}

export function findReportByWeekKey(reports, weekKey) {
  return reports.find(r => r.weekKey === weekKey) || null
}

export function extractReportFields(report) {
  return {
    [FIELD_SUMMARY]: report[FIELD_SUMMARY] || '',
    [FIELD_PLAN]: report[FIELD_PLAN] || '',
    [FIELD_PROBLEMS]: report[FIELD_PROBLEMS] || ''
  }
}

export function isReportEmpty(report) {
  return (
    !report[FIELD_SUMMARY]?.trim() &&
    !report[FIELD_PLAN]?.trim() &&
    !report[FIELD_PROBLEMS]?.trim()
  )
}
