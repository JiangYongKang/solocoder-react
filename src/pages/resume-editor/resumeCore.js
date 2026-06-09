import {
  TEMPLATES,
  MODULE_TYPES,
  MODULE_LABELS,
  NON_DELETABLE_MODULES,
  LIST_MODULE_TYPES,
  PHONE_REGEX,
  EMAIL_REGEX,
  STORAGE_KEY,
} from './constants'

let idCounter = 0

export function generateId(prefix = 'mod') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createBasicInfoModule() {
  return {
    id: generateId(MODULE_TYPES.BASIC_INFO),
    type: MODULE_TYPES.BASIC_INFO,
    visible: true,
    data: {
      name: '',
      phone: '',
      email: '',
      location: '',
      homepage: '',
    },
  }
}

export function createJobIntentionModule() {
  return {
    id: generateId(MODULE_TYPES.JOB_INTENTION),
    type: MODULE_TYPES.JOB_INTENTION,
    visible: true,
    data: {
      position: '',
      salary: '',
      city: '',
      status: '',
    },
  }
}

export function createEducationItem() {
  return {
    id: generateId('edu'),
    startDate: '',
    endDate: '',
    school: '',
    major: '',
    degree: '',
    description: '',
  }
}

export function createEducationModule() {
  return {
    id: generateId(MODULE_TYPES.EDUCATION),
    type: MODULE_TYPES.EDUCATION,
    visible: true,
    title: MODULE_LABELS[MODULE_TYPES.EDUCATION],
    data: {
      items: [createEducationItem()],
    },
  }
}

export function createWorkItem() {
  return {
    id: generateId('work'),
    startDate: '',
    endDate: '',
    company: '',
    position: '',
    description: '',
  }
}

export function createWorkExperienceModule() {
  return {
    id: generateId(MODULE_TYPES.WORK_EXPERIENCE),
    type: MODULE_TYPES.WORK_EXPERIENCE,
    visible: true,
    title: MODULE_LABELS[MODULE_TYPES.WORK_EXPERIENCE],
    data: {
      items: [createWorkItem()],
    },
  }
}

export function createProjectItem() {
  return {
    id: generateId('proj'),
    startDate: '',
    endDate: '',
    name: '',
    role: '',
    description: '',
  }
}

export function createProjectExperienceModule() {
  return {
    id: generateId(MODULE_TYPES.PROJECT_EXPERIENCE),
    type: MODULE_TYPES.PROJECT_EXPERIENCE,
    visible: true,
    title: MODULE_LABELS[MODULE_TYPES.PROJECT_EXPERIENCE],
    data: {
      items: [createProjectItem()],
    },
  }
}

export function createSkillsModule() {
  return {
    id: generateId(MODULE_TYPES.SKILLS),
    type: MODULE_TYPES.SKILLS,
    visible: true,
    title: MODULE_LABELS[MODULE_TYPES.SKILLS],
    data: {
      content: '',
    },
  }
}

export function createSelfEvaluationModule() {
  return {
    id: generateId(MODULE_TYPES.SELF_EVALUATION),
    type: MODULE_TYPES.SELF_EVALUATION,
    visible: true,
    title: MODULE_LABELS[MODULE_TYPES.SELF_EVALUATION],
    data: {
      content: '',
    },
  }
}

export function createCustomModule(name) {
  return {
    id: generateId(MODULE_TYPES.CUSTOM),
    type: MODULE_TYPES.CUSTOM,
    visible: true,
    title: name || '自定义模块',
    data: {
      content: '',
    },
  }
}

export function createDefaultResumeState() {
  return {
    templateId: TEMPLATES.CLASSIC,
    modules: [
      createBasicInfoModule(),
      createJobIntentionModule(),
      createEducationModule(),
      createWorkExperienceModule(),
      createProjectExperienceModule(),
      createSkillsModule(),
      createSelfEvaluationModule(),
    ],
  }
}

export function reorderModules(modules, fromIndex, toIndex) {
  if (!Array.isArray(modules)) return []
  if (fromIndex < 0 || fromIndex >= modules.length) return modules
  if (toIndex < 0 || toIndex >= modules.length) return modules
  if (fromIndex === toIndex) return modules

  const result = [...modules]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export function deleteModule(modules, moduleId) {
  if (!Array.isArray(modules)) return []
  return modules.filter((m) => {
    if (m.id !== moduleId) return true
    return NON_DELETABLE_MODULES.includes(m.type)
  })
}

export function canDeleteModule(module) {
  if (!module) return false
  return !NON_DELETABLE_MODULES.includes(module.type)
}

export function toggleModuleVisibility(modules, moduleId) {
  if (!Array.isArray(modules)) return []
  return modules.map((m) =>
    m.id === moduleId ? { ...m, visible: !m.visible } : m
  )
}

export function updateModuleData(modules, moduleId, dataUpdates) {
  if (!Array.isArray(modules)) return []
  return modules.map((m) =>
    m.id === moduleId ? { ...m, data: { ...m.data, ...dataUpdates } } : m
  )
}

export function updateModuleTitle(modules, moduleId, title) {
  if (!Array.isArray(modules)) return []
  return modules.map((m) => (m.id === moduleId ? { ...m, title } : m))
}

export function addModule(modules, newModule, insertIndex) {
  if (!Array.isArray(modules)) return [newModule]
  if (!newModule) return modules
  if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= modules.length) {
    const next = [...modules]
    next.splice(insertIndex, 0, newModule)
    return next
  }
  return [...modules, newModule]
}

export function addListItem(modules, moduleId) {
  if (!Array.isArray(modules)) return []
  return modules.map((m) => {
    if (m.id !== moduleId) return m
    if (!LIST_MODULE_TYPES.includes(m.type)) return m
    let createItem
    if (m.type === MODULE_TYPES.EDUCATION) createItem = createEducationItem
    else if (m.type === MODULE_TYPES.WORK_EXPERIENCE) createItem = createWorkItem
    else if (m.type === MODULE_TYPES.PROJECT_EXPERIENCE) createItem = createProjectItem
    else return m
    const newItem = createItem()
    const items = Array.isArray(m.data?.items) ? [...m.data.items, newItem] : [newItem]
    return { ...m, data: { ...m.data, items } }
  })
}

export function deleteListItem(modules, moduleId, itemId) {
  if (!Array.isArray(modules)) return []
  return modules.map((m) => {
    if (m.id !== moduleId) return m
    if (!LIST_MODULE_TYPES.includes(m.type)) return m
    if (!Array.isArray(m.data?.items)) return m
    const items = m.data.items.filter((it) => it.id !== itemId)
    return { ...m, data: { ...m.data, items } }
  })
}

export function updateListItem(modules, moduleId, itemId, updates) {
  if (!Array.isArray(modules)) return []
  return modules.map((m) => {
    if (m.id !== moduleId) return m
    if (!LIST_MODULE_TYPES.includes(m.type)) return m
    if (!Array.isArray(m.data?.items)) return m
    const items = m.data.items.map((it) =>
      it.id === itemId ? { ...it, ...updates } : it
    )
    return { ...m, data: { ...m.data, items } }
  })
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return { valid: false, message: '请输入联系电话' }
  const trimmed = phone.trim()
  if (!trimmed) return { valid: false, message: '请输入联系电话' }
  if (!PHONE_REGEX.test(trimmed)) return { valid: false, message: '请输入正确的手机号码' }
  return { valid: true, message: '' }
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return { valid: false, message: '请输入邮箱' }
  const trimmed = email.trim()
  if (!trimmed) return { valid: false, message: '请输入邮箱' }
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, message: '请输入正确的邮箱格式' }
  return { valid: true, message: '' }
}

export function validateBasicInfo(data) {
  const errors = {}
  if (!data) return errors

  if (data.phone) {
    const phoneResult = validatePhone(data.phone)
    if (!phoneResult.valid) errors.phone = phoneResult.message
  }
  if (data.email) {
    const emailResult = validateEmail(data.email)
    if (!emailResult.valid) errors.email = emailResult.message
  }
  return errors
}

export function loadFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultResumeState()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultResumeState()
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.templateId || !Array.isArray(parsed.modules)) {
      return createDefaultResumeState()
    }
    return parsed
  } catch {
    return createDefaultResumeState()
  }
}

export function saveToStorage(state) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function validateResumeData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, message: '简历数据格式无效' }
  }
  if (!data.templateId || !Object.values(TEMPLATES).includes(data.templateId)) {
    return { valid: false, message: '模板ID无效' }
  }
  if (!Array.isArray(data.modules)) {
    return { valid: false, message: '模块列表格式无效' }
  }
  const hasBasicInfo = data.modules.some((m) => m && m.type === MODULE_TYPES.BASIC_INFO)
  if (!hasBasicInfo) {
    return { valid: false, message: '缺少基本信息模块' }
  }
  for (const mod of data.modules) {
    if (!mod || typeof mod !== 'object') {
      return { valid: false, message: '存在无效模块' }
    }
    if (!mod.id || typeof mod.id !== 'string') {
      return { valid: false, message: '模块缺少有效ID' }
    }
    if (!mod.type || typeof mod.type !== 'string') {
      return { valid: false, message: '模块缺少类型' }
    }
    if (typeof mod.visible !== 'boolean') {
      return { valid: false, message: '模块可见性格式错误' }
    }
    if (!mod.data || typeof mod.data !== 'object') {
      return { valid: false, message: '模块数据格式无效' }
    }
  }
  return { valid: true, message: '' }
}

export function exportToJson(state) {
  return JSON.stringify(state, null, 2)
}

export function downloadJson(jsonStr, filename = 'resume-data.json') {
  if (typeof window === 'undefined' || !window.document) {
    return false
  }
  try {
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export function parseJsonImport(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr)
    const validation = validateResumeData(parsed)
    if (!validation.valid) {
      return { success: false, data: null, message: validation.message }
    }
    return { success: true, data: parsed, message: '' }
  } catch {
    return { success: false, data: null, message: 'JSON 格式解析失败' }
  }
}

export function getModuleLabel(module) {
  if (!module) return ''
  if (module.type === MODULE_TYPES.CUSTOM || module.type === MODULE_TYPES.SKILLS || module.type === MODULE_TYPES.SELF_EVALUATION) {
    return module.title || MODULE_LABELS[module.type] || ''
  }
  return MODULE_LABELS[module.type] || module.type
}

export function getVisibleModules(modules) {
  if (!Array.isArray(modules)) return []
  return modules.filter((m) => m && m.visible)
}
