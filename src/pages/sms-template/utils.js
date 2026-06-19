import {
  PRESET_VARIABLES,
  MAX_SMS_LENGTH,
  SINGLE_SMS_THRESHOLD,
  TEMPLATE_STATUS,
  STATUS_TRANSITIONS,
  SUMMARY_MAX_LENGTH,
  MAX_REJECT_REASON_LENGTH,
  PRESET_GROUPS,
  DEFAULT_SIGNATURE,
} from './constants.js'

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

export function isChineseChar(char) {
  return /[\u4e00-\u9fa5]/.test(char)
}

export function getVariableInfo(variableName) {
  return PRESET_VARIABLES.find((v) => v.name === variableName)
}

export function getVariableSampleLength(variableName) {
  const info = getVariableInfo(variableName)
  return info ? info.sampleLength : variableName.length
}

export function getVariableSampleValue(variableName, customSamples = {}) {
  if (customSamples[variableName]) return customSamples[variableName]
  const info = getVariableInfo(variableName)
  return info ? info.sampleValue : ''
}

export function extractVariables(content) {
  if (!content || typeof content !== 'string') return []
  const regex = /\{([^{}]+)\}/g
  const matches = content.matchAll(regex)
  const variables = []
  const seen = new Set()
  for (const match of matches) {
    const name = match[1].trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      variables.push(name)
    }
  }
  return variables
}

export function validateVariableFormat(content) {
  if (!content || typeof content !== 'string') return { valid: true, errors: [] }
  const errors = []
  const openBraces = (content.match(/\{/g) || []).length
  const closeBraces = (content.match(/\}/g) || []).length
  if (openBraces !== closeBraces) {
    errors.push(`占位符括号不匹配：左括号${openBraces}个，右括号${closeBraces}个`)
  }
  const regex = /\{([^{}]*)\}/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const name = match[1].trim()
    if (!name) {
      errors.push(`位置${match.index}存在空变量占位符`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export function calculateCharCount(content) {
  if (!content || typeof content !== 'string') {
    return { totalChars: 0, billingChars: 0, variableCount: 0 }
  }
  let totalChars = 0
  let billingChars = 0
  let variableCount = 0
  let i = 0
  while (i < content.length) {
    if (content[i] === '{') {
      const endIdx = content.indexOf('}', i)
      if (endIdx !== -1) {
        const varName = content.slice(i + 1, endIdx).trim()
        totalChars += endIdx - i + 1
        billingChars += getVariableSampleLength(varName)
        variableCount++
        i = endIdx + 1
        continue
      }
    }
    const char = content[i]
    totalChars++
    if (char === '{' || char === '}') {
      i++
      continue
    }
    billingChars++
    i++
  }
  return { totalChars, billingChars, variableCount }
}

export function getSmsLengthWarning(billingChars) {
  if (billingChars > MAX_SMS_LENGTH) {
    return { level: 'error', message: `短信总字数${billingChars}字，超过上限${MAX_SMS_LENGTH}字，无法保存` }
  }
  if (billingChars > SINGLE_SMS_THRESHOLD) {
    return { level: 'warning', message: `单条短信超过${SINGLE_SMS_THRESHOLD}字将按多条计费，当前${billingChars}字` }
  }
  return { level: 'success', message: `当前${billingChars}字，计费正常` }
}

export function canSaveTemplate(billingChars) {
  return billingChars <= MAX_SMS_LENGTH
}

export function replaceVariables(content, variableSamples = {}) {
  if (!content || typeof content !== 'string') return ''
  return content.replace(/\{([^{}]+)\}/g, (match, varName) => {
    const name = varName.trim()
    return getVariableSampleValue(name, variableSamples)
  })
}

export function getContentSummary(content, maxLength = SUMMARY_MAX_LENGTH) {
  if (!content) return ''
  const plain = replaceVariables(content)
  if (plain.length <= maxLength) return plain
  return plain.slice(0, maxLength) + '...'
}

export function canTransitionStatus(currentStatus, action) {
  const transitions = STATUS_TRANSITIONS[currentStatus]
  if (!transitions) return false
  return transitions[action] === true
}

export function getStatusCapabilities(status) {
  return STATUS_TRANSITIONS[status] || {
    canSubmit: false,
    canEdit: false,
    canDelete: false,
    canCreateRevision: false,
    canApprove: false,
    canReject: false,
  }
}

export function transitionStatus(template, action, payload = {}) {
  if (!template) return null
  const capabilities = getStatusCapabilities(template.status)
  if (!capabilities[action]) return template

  const now = Date.now()
  const updated = { ...template, updatedAt: now }

  switch (action) {
    case 'canSubmit':
      return { ...updated, status: TEMPLATE_STATUS.PENDING, rejectReason: '' }
    case 'canApprove':
      return { ...updated, status: TEMPLATE_STATUS.APPROVED, rejectReason: '' }
    case 'canReject':
      if (!payload.rejectReason || !payload.rejectReason.trim()) {
        return template
      }
      if (payload.rejectReason.length > MAX_REJECT_REASON_LENGTH) {
        return template
      }
      return { ...updated, status: TEMPLATE_STATUS.REJECTED, rejectReason: payload.rejectReason.trim() }
    default:
      return updated
  }
}

export function searchItems(items, keyword, searchFields = ['name', 'title']) {
  if (!Array.isArray(items)) return []
  if (!keyword || !keyword.trim()) return items
  const kw = keyword.trim().toLowerCase()
  return items.filter((item) =>
    searchFields.some((field) => {
      const val = item[field]
      return typeof val === 'string' && val.toLowerCase().includes(kw)
    })
  )
}

export function filterTemplatesByGroup(templates, groupId) {
  if (!Array.isArray(templates)) return []
  if (!groupId) return templates
  return templates.filter((t) => t.groupId === groupId)
}

export function sortTemplates(templates, sortBy = 'updatedAt') {
  if (!Array.isArray(templates)) return []
  return [...templates].sort((a, b) => {
    const aVal = a[sortBy] || 0
    const bVal = b[sortBy] || 0
    return bVal - aVal
  })
}

export function getTemplatesInGroup(templates, groupId) {
  return filterTemplatesByGroup(templates, groupId)
}

export function hasTemplatesInGroup(templates, groupId) {
  return getTemplatesInGroup(templates, groupId).length > 0
}

export function isGroupNameDuplicate(groups, name, excludeId = null) {
  if (!Array.isArray(groups)) return false
  const trimmed = name.trim()
  return groups.some(
    (g) => g.name.trim() === trimmed && (excludeId ? g.id !== excludeId : true)
  )
}

export function createGroup(groups, name) {
  if (!name || !name.trim()) return { success: false, groups, error: '分组名称不能为空' }
  if (isGroupNameDuplicate(groups, name)) {
    return { success: false, groups, error: '分组名称已存在' }
  }
  const newGroup = {
    id: generateId('group'),
    name: name.trim(),
    isPreset: false,
  }
  return { success: true, groups: [...groups, newGroup], group: newGroup }
}

export function renameGroup(groups, groupId, newName) {
  if (!groupId || !newName || !newName.trim()) {
    return { success: false, groups, error: '参数无效' }
  }
  const group = groups.find((g) => g.id === groupId)
  if (!group) return { success: false, groups, error: '分组不存在' }
  if (group.isPreset) return { success: false, groups, error: '预设分组不能重命名' }
  if (isGroupNameDuplicate(groups, newName, groupId)) {
    return { success: false, groups, error: '分组名称已存在' }
  }
  const updated = groups.map((g) =>
    g.id === groupId ? { ...g, name: newName.trim() } : g
  )
  return { success: true, groups: updated }
}

export function deleteGroup(groups, templates, groupId) {
  if (!groupId) return { success: false, groups, templates, error: '参数无效' }
  const group = groups.find((g) => g.id === groupId)
  if (!group) return { success: false, groups, templates, error: '分组不存在' }
  if (group.isPreset) return { success: false, groups, templates, error: '预设分组不能删除' }
  if (hasTemplatesInGroup(templates, groupId)) {
    return { success: false, groups, templates, error: '该分组下存在模板，无法删除' }
  }
  return {
    success: true,
    groups: groups.filter((g) => g.id !== groupId),
    templates,
  }
}

export function validateTemplateTitle(templates, title, excludeId = null) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { valid: false, error: '模板标题不能为空' }
  }
  const trimmed = title.trim()
  const isDuplicate = templates.some(
    (t) => t.title.trim() === trimmed && (excludeId ? t.id !== excludeId : true)
  )
  if (isDuplicate) {
    return { valid: false, error: '模板标题已存在' }
  }
  return { valid: true }
}

export function createTemplate(templates, data) {
  const titleValidation = validateTemplateTitle(templates, data.title)
  if (!titleValidation.valid) {
    return { success: false, templates, error: titleValidation.error }
  }
  const varValidation = validateVariableFormat(data.content)
  if (!varValidation.valid) {
    return { success: false, templates, error: varValidation.errors.join('；') }
  }
  const charCount = calculateCharCount(data.content)
  if (!canSaveTemplate(charCount.billingChars)) {
    return { success: false, templates, error: `短信字数超过${MAX_SMS_LENGTH}字上限` }
  }
  const now = Date.now()
  const newTemplate = {
    id: generateId('tpl'),
    title: data.title.trim(),
    content: data.content || '',
    groupId: data.groupId,
    status: TEMPLATE_STATUS.DRAFT,
    signature: data.signature || DEFAULT_SIGNATURE,
    variables: extractVariables(data.content),
    variableSamples: data.variableSamples || {},
    rejectReason: '',
    createdAt: now,
    updatedAt: now,
    revisionOf: null,
    version: 1,
  }
  return { success: true, templates: [newTemplate, ...templates], template: newTemplate }
}

export function updateTemplate(templates, templateId, data) {
  const template = templates.find((t) => t.id === templateId)
  if (!template) return { success: false, templates, error: '模板不存在' }
  const capabilities = getStatusCapabilities(template.status)
  if (!capabilities.canEdit) {
    return { success: false, templates, error: '当前状态不允许编辑' }
  }
  if (data.title !== undefined) {
    const titleValidation = validateTemplateTitle(templates, data.title, templateId)
    if (!titleValidation.valid) {
      return { success: false, templates, error: titleValidation.error }
    }
  }
  if (data.content !== undefined) {
    const varValidation = validateVariableFormat(data.content)
    if (!varValidation.valid) {
      return { success: false, templates, error: varValidation.errors.join('；') }
    }
    const charCount = calculateCharCount(data.content)
    if (!canSaveTemplate(charCount.billingChars)) {
      return { success: false, templates, error: `短信字数超过${MAX_SMS_LENGTH}字上限` }
    }
  }
  const updated = templates.map((t) => {
    if (t.id !== templateId) return t
    const merged = { ...t, ...data, updatedAt: Date.now() }
    if (data.content !== undefined) {
      merged.variables = extractVariables(data.content)
    }
    if (data.title !== undefined) {
      merged.title = data.title.trim()
    }
    return merged
  })
  const updatedTemplate = updated.find((t) => t.id === templateId)
  return { success: true, templates: updated, template: updatedTemplate }
}

export function deleteTemplate(templates, templateId) {
  const template = templates.find((t) => t.id === templateId)
  if (!template) return { success: false, templates, error: '模板不存在' }
  const capabilities = getStatusCapabilities(template.status)
  if (!capabilities.canDelete) {
    return { success: false, templates, error: '当前状态不允许删除' }
  }
  return { success: true, templates: templates.filter((t) => t.id !== templateId) }
}

export function createRevision(templates, templateId) {
  const original = templates.find((t) => t.id === templateId)
  if (!original) return { success: false, templates, error: '模板不存在' }
  const capabilities = getStatusCapabilities(original.status)
  if (!capabilities.canCreateRevision) {
    return { success: false, templates, error: '当前状态不允许创建修订版' }
  }
  const now = Date.now()
  const revision = {
    ...original,
    id: generateId('tpl'),
    title: `${original.title}(修订版)`,
    status: TEMPLATE_STATUS.DRAFT,
    rejectReason: '',
    createdAt: now,
    updatedAt: now,
    revisionOf: original.id,
    version: (original.version || 1) + 1,
  }
  const existsDuplicate = templates.some((t) => t.title === revision.title)
  if (existsDuplicate) {
    revision.title = `${original.title}(修订版${revision.version})`
  }
  return { success: true, templates: [revision, ...templates], template: revision }
}

export function ensureGroupExists(groups, groupName) {
  if (!groupName || !groupName.trim()) return { groups, groupId: null }
  const trimmed = groupName.trim()
  const existing = groups.find((g) => g.name === trimmed)
  if (existing) return { groups, groupId: existing.id }
  const preset = PRESET_GROUPS.find((g) => g.name === trimmed)
  if (preset) {
    return { groups: [...groups, { ...preset }], groupId: preset.id }
  }
  const newGroup = {
    id: generateId('group'),
    name: trimmed,
    isPreset: false,
  }
  return { groups: [...groups, newGroup], groupId: newGroup.id }
}

export function validateImportTemplate(template, existingTemplates = []) {
  const issues = []
  if (!template || typeof template !== 'object') {
    return { valid: false, issues: ['不是有效的对象'] }
  }
  if (!template.title || typeof template.title !== 'string' || !template.title.trim()) {
    issues.push('模板标题必填')
  }
  const title = (template.title || '').trim()
  const duplicate = existingTemplates.some((t) => t.title.trim() === title)
  if (duplicate) {
    issues.push(`模板标题"${title}"已存在`)
  }
  if (typeof template.content !== 'string') {
    issues.push('模板内容必须是字符串')
  }
  if (template.content) {
    const varValidation = validateVariableFormat(template.content)
    if (!varValidation.valid) {
      issues.push(...varValidation.errors)
    }
  }
  if (template.status && !Object.values(TEMPLATE_STATUS).includes(template.status)) {
    issues.push(`无效的审核状态：${template.status}`)
  }
  return { valid: issues.length === 0, issues }
}

export function importTemplates(groups, templates, importData) {
  const result = {
    success: [],
    skipped: [],
    groups: [...groups],
    templates: [...templates],
  }
  if (!importData) return result
  const items = Array.isArray(importData) ? importData : [importData]
  const tempTitleSet = new Set(result.templates.map((t) => t.title.trim()))

  for (const raw of items) {
    const validation = validateImportTemplate(raw, result.templates)
    if (!validation.valid) {
      result.skipped.push({
        template: raw,
        reason: validation.issues.join('；'),
      })
      continue
    }
    if (tempTitleSet.has(raw.title.trim())) {
      result.skipped.push({
        template: raw,
        reason: '本次导入中已存在相同标题',
      })
      continue
    }
    let groupId = raw.groupId
    if (!groupId && raw.group) {
      const ensureRes = ensureGroupExists(result.groups, raw.group)
      result.groups = ensureRes.groups
      groupId = ensureRes.groupId
    } else if (groupId && !result.groups.some((g) => g.id === groupId)) {
      if (raw.group) {
        const ensureRes = ensureGroupExists(result.groups, raw.group)
        result.groups = ensureRes.groups
        groupId = ensureRes.groupId
      } else {
        const ensureRes = ensureGroupExists(result.groups, '自定义分组')
        result.groups = ensureRes.groups
        groupId = ensureRes.groupId
      }
    }
    const variables = raw.variables && Array.isArray(raw.variables)
      ? raw.variables
      : extractVariables(raw.content)
    const now = Date.now()
    const imported = {
      id: generateId('tpl'),
      title: raw.title.trim(),
      content: raw.content || '',
      groupId,
      status: raw.status || TEMPLATE_STATUS.DRAFT,
      signature: raw.signature || DEFAULT_SIGNATURE,
      variables,
      variableSamples: raw.variableSamples || {},
      rejectReason: raw.rejectReason || '',
      createdAt: raw.createdAt || now,
      updatedAt: raw.updatedAt || now,
      revisionOf: raw.revisionOf || null,
      version: raw.version || 1,
    }
    result.templates.unshift(imported)
    tempTitleSet.add(imported.title.trim())
    result.success.push(imported)
  }
  return result
}

export function exportTemplatesToJSON(templates, groups, options = {}) {
  const { selectedIds = null, groupId = null, includeGroupDetails = true } = options
  let toExport = templates
  if (groupId) {
    toExport = filterTemplatesByGroup(templates, groupId)
  }
  if (selectedIds && selectedIds.length > 0) {
    toExport = toExport.filter((t) => selectedIds.includes(t.id))
  }
  const exported = toExport.map((t) => {
    const group = groups.find((g) => g.id === t.groupId)
    return {
      title: t.title,
      content: t.content,
      group: group ? group.name : '',
      groupId: t.groupId,
      signature: t.signature,
      variables: t.variables,
      status: t.status,
      variableSamples: t.variableSamples,
      version: t.version,
    }
  })
  if (!includeGroupDetails) {
    return JSON.stringify(exported, null, 2)
  }
  const exportObj = {
    exportedAt: Date.now(),
    groups: groups.map((g) => ({ id: g.id, name: g.name, isPreset: g.isPreset })),
    templates: exported,
  }
  return JSON.stringify(exportObj, null, 2)
}

export function parseImportJSON(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed)) {
      return { success: true, data: parsed }
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.templates)) {
      return { success: true, data: parsed.templates }
    }
    if (parsed && typeof parsed === 'object' && parsed.title) {
      return { success: true, data: [parsed] }
    }
    return { success: false, error: '无法识别的 JSON 结构' }
  } catch (e) {
    return { success: false, error: `JSON 解析失败：${e.message}` }
  }
}

export function buildVariableSamplesMap(variableNames, customValues = {}) {
  const result = {}
  for (const name of variableNames) {
    result[name] = customValues[name] || getVariableSampleValue(name)
  }
  return result
}

export function buildPreviewContent(template, customSamples = {}) {
  if (!template) return ''
  const signature = template.signature || DEFAULT_SIGNATURE
  const content = template.content || ''
  const samples = buildVariableSamplesMap(extractVariables(content), customSamples)
  return signature + replaceVariables(content, samples)
}
