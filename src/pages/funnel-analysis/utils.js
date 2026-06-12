import {
    DEFAULT_STEPS,
    DROP_OFF_CAUSES,
    DROP_OFF_LEVELS,
    GROUP_COLORS,
    MAX_GROUPS,
    MAX_STEPS,
    MIN_STEPS,
    STORAGE_KEY,
} from './constants'

export function generateStepId() {
  return 's_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36)
}

export function generateGroupId() {
  return 'g_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36)
}

export function getDefaultState() {
  const steps = DEFAULT_STEPS.map((s) => ({ ...s }))
  const defaultData = {}
  steps.forEach((s, i) => {
    defaultData[s.id] = Math.round(10000 * Math.pow(0.72, i))
  })
  return {
    steps,
    groups: [
      { id: generateGroupId(), name: '对照组', data: defaultData },
    ],
    dateRange: {
      startDate: getDateNDaysAgo(30),
      endDate: getToday(),
    },
  }
}

export function isValidStep(step) {
  if (!step || typeof step !== 'object') return false
  if (Array.isArray(step)) return false
  if (typeof step.id !== 'string' || step.id.length === 0) return false
  if (typeof step.name !== 'string' || step.name.length === 0) return false
  return true
}

export function isValidGroup(group) {
  if (!group || typeof group !== 'object') return false
  if (Array.isArray(group)) return false
  if (typeof group.id !== 'string' || group.id.length === 0) return false
  if (typeof group.name !== 'string' || group.name.length === 0) return false
  if (!group.data || typeof group.data !== 'object' || Array.isArray(group.data)) return false
  return true
}

export function validateStateStructure(state) {
  if (!state || typeof state !== 'object') return false
  if (Array.isArray(state)) return false
  if (!Array.isArray(state.steps) || state.steps.length < MIN_STEPS || state.steps.length > MAX_STEPS) return false
  if (!state.steps.every(isValidStep)) return false
  if (!Array.isArray(state.groups) || state.groups.length < 1 || state.groups.length > MAX_GROUPS) return false
  if (!state.groups.every(isValidGroup)) return false
  if (!state.dateRange || typeof state.dateRange !== 'object' || Array.isArray(state.dateRange)) return false
  if (typeof state.dateRange.startDate !== 'string' || typeof state.dateRange.endDate !== 'string') return false
  if (!isValidDateRange(state.dateRange.startDate, state.dateRange.endDate)) return false
  const stepIds = new Set(state.steps.map((s) => s.id))
  if (stepIds.size !== state.steps.length) return false
  return true
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!validateStateStructure(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function getToday() {
  const d = new Date()
  return formatDateToStr(d)
}

export function getDateNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n + 1)
  return formatDateToStr(d)
}

export function formatDateToStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getDatePresetRange(presetKey) {
  const today = new Date()
  const endDate = formatDateToStr(today)
  let startDate = ''

  if (presetKey === 'last7') {
    startDate = getDateNDaysAgo(7)
  } else if (presetKey === 'last30') {
    startDate = getDateNDaysAgo(30)
  } else if (presetKey === 'thisMonth') {
    startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  } else if (presetKey === 'thisQuarter') {
    const quarter = Math.floor(today.getMonth() / 3)
    const quarterStartMonth = quarter * 3
    startDate = `${today.getFullYear()}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`
  }

  return { startDate, endDate }
}

export function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false
  return start <= end
}

export function addStep(steps) {
  if (steps.length >= MAX_STEPS) {
    return { success: false, error: `最多支持 ${MAX_STEPS} 个步骤` }
  }
  const newStep = { id: generateStepId(), name: `步骤 ${steps.length + 1}` }
  return { success: true, steps: [...steps, newStep] }
}

export function removeStep(steps, stepId, groups) {
  if (steps.length <= MIN_STEPS) {
    return { success: false, error: `最少需要 ${MIN_STEPS} 个步骤` }
  }
  const newSteps = steps.filter((s) => s.id !== stepId)
  const newGroups = groups.map((g) => {
    const newData = { ...g.data }
    delete newData[stepId]
    return { ...g, data: newData }
  })
  return { success: true, steps: newSteps, groups: newGroups }
}

export function updateStepName(steps, stepId, name) {
  return steps.map((s) => (s.id === stepId ? { ...s, name } : s))
}

export function reorderSteps(steps, activeId, overId) {
  const oldIndex = steps.findIndex((s) => s.id === activeId)
  const newIndex = steps.findIndex((s) => s.id === overId)
  if (oldIndex === -1 || newIndex === -1) return steps
  const newSteps = [...steps]
  const [moved] = newSteps.splice(oldIndex, 1)
  newSteps.splice(newIndex, 0, moved)
  return newSteps
}

export function addGroup(groups) {
  if (groups.length >= MAX_GROUPS) {
    return { success: false, error: `最多支持 ${MAX_GROUPS} 个对比组` }
  }
  const newGroup = {
    id: generateGroupId(),
    name: `组 ${groups.length + 1}`,
    data: {},
  }
  return { success: true, groups: [...groups, newGroup] }
}

export function removeGroup(groups, groupId) {
  if (groups.length <= 1) {
    return { success: false, error: '至少保留一个组' }
  }
  return { success: true, groups: groups.filter((g) => g.id !== groupId) }
}

export function updateGroupName(groups, groupId, name) {
  return groups.map((g) => (g.id === groupId ? { ...g, name } : g))
}

export function updateGroupData(groups, groupId, stepId, value) {
  return groups.map((g) => {
    if (g.id !== groupId) return g
    return { ...g, data: { ...g.data, [stepId]: value } }
  })
}

export function generateRandomData(steps) {
  const data = {}
  let current = 10000 + Math.floor(Math.random() * 2000)
  steps.forEach((s, i) => {
    if (i === 0) {
      data[s.id] = current
    } else {
      const dropRate = 0.15 + Math.random() * 0.35
      current = Math.round(current * (1 - dropRate))
      data[s.id] = current
    }
  })
  return data
}

export function fillGroupWithRandomData(groups, groupId, steps) {
  const data = generateRandomData(steps)
  return groups.map((g) => (g.id === groupId ? { ...g, data } : g))
}

export function calculateConversionRate(current, previous) {
  if (!previous || previous === 0) return 0
  return Math.round((current / previous) * 10000) / 100
}

export function calculateOverallConversionRate(current, first) {
  if (!first || first === 0) return 0
  return Math.round((current / first) * 10000) / 100
}

export function calculateDropOff(current, previous) {
  if (!previous || previous === 0) return { count: 0, rate: 0 }
  const count = previous - current
  const rate = Math.round((count / previous) * 10000) / 100
  return { count: Math.max(0, count), rate: Math.max(0, rate) }
}

export function getDropOffLevel(rate) {
  if (rate > DROP_OFF_LEVELS.HIGH.threshold) return 'HIGH'
  if (rate > DROP_OFF_LEVELS.MEDIUM.threshold) return 'MEDIUM'
  return 'LOW'
}

export function getDropOffColor(rate) {
  const level = getDropOffLevel(rate)
  return DROP_OFF_LEVELS[level].color
}

export function hashString(str) {
  if (!str) return 0
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function getDropOffCause(rate, stepId = '') {
  const level = getDropOffLevel(rate)
  if (level === 'LOW') return '该环节转化良好，无明显流失问题'
  const idx = hashString(stepId) % DROP_OFF_CAUSES.length
  return DROP_OFF_CAUSES[idx]
}

export function getBarWidthPercentage(value, maxValue) {
  if (!maxValue || maxValue === 0) return 0
  return Math.round((value / maxValue) * 10000) / 100
}

export function getStepColor(index) {
  return GROUP_COLORS[index % GROUP_COLORS.length]
}

export function getBarGradientColor(index, total) {
  const ratio = total <= 1 ? 0 : index / (total - 1)
  const r = Math.round(79 + ratio * (143 - 79))
  const g = Math.round(110 + ratio * (164 - 110))
  const b = Math.round(247 + ratio * (249 - 247))
  return `rgb(${r}, ${g}, ${b})`
}

export function validateFunnelData(steps, data) {
  const errors = {}
  const stepIds = steps.map((s) => s.id)
  for (let i = 0; i < stepIds.length; i++) {
    const currentVal = Number(data[stepIds[i]]) || 0
    if (currentVal < 0) {
      errors[stepIds[i]] = '用户数不能为负数'
    }
    if (i > 0) {
      const prevVal = Number(data[stepIds[i - 1]]) || 0
      if (currentVal > prevVal) {
        errors[stepIds[i]] = `用户数不能大于上一步（${prevVal}）`
      }
    }
  }
  return errors
}

export function escapeCSVValue(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function exportToCSV(steps, groups) {
  if (!steps.length || !groups.length) return ''

  const headers = ['步骤名称']
  groups.forEach((g) => headers.push(g.name + ' 用户数'))
  groups.forEach((g) => headers.push(g.name + ' 转化率(%)'))

  const rows = steps.map((step, i) => {
    const row = [step.name]
    groups.forEach((g) => {
      const val = g.data[step.id] != null ? g.data[step.id] : 0
      row.push(val)
    })
    groups.forEach((g) => {
      const val = g.data[step.id] != null ? g.data[step.id] : 0
      if (i === 0) {
        row.push(100)
      } else {
        const prevStepId = steps[i - 1].id
        const prevVal = g.data[prevStepId] != null ? g.data[prevStepId] : 0
        row.push(calculateConversionRate(val, prevVal))
      }
    })
    return row
  })

  const summaryRow = ['总转化率']
  groups.forEach((g) => {
    const firstStepId = steps[0].id
    const lastStepId = steps[steps.length - 1].id
    const firstVal = g.data[firstStepId] != null ? g.data[firstStepId] : 0
    const lastVal = g.data[lastStepId] != null ? g.data[lastStepId] : 0
    summaryRow.push(lastVal)
    summaryRow.push(calculateOverallConversionRate(lastVal, firstVal))
  })
  rows.push(summaryRow)

  return [headers, ...rows].map((row) => row.map(escapeCSVValue).join(',')).join('\n')
}

export function downloadCSV(content, prefix = 'funnel') {
  if (typeof window === 'undefined' || !window.Blob) return false
  try {
    const now = new Date()
    const ts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${prefix}_${ts}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}
