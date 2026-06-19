import { DEFAULT_COLOR, PRESET_COLORS, RESOURCE_TYPES, RESOURCE_NAMES } from './constants.js'

export function generateTagId() {
  return 'tag_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function validateHexColor(color) {
  if (typeof color !== 'string') return false
  return /^#[0-9A-Fa-f]{6}$/.test(color.trim())
}

export function validateTagName(name) {
  if (typeof name !== 'string') return false
  const trimmed = name.trim()
  return trimmed.length > 0
}

export function isDuplicateName(tags, name, parentId, excludeId = null) {
  if (!validateTagName(name)) return false
  const trimmedName = name.trim()
  return tags.some(
    (t) =>
      t.id !== excludeId &&
      t.parentId === parentId &&
      t.name.trim() === trimmedName
  )
}

export function validateTagData(tags, data, excludeId = null) {
  const errors = {}
  if (!validateTagName(data.name)) {
    errors.name = '标签名称不能为空'
  } else if (isDuplicateName(tags, data.name, data.parentId, excludeId)) {
    errors.name = '同级标签下名称已存在'
  }
  if (data.color && !validateHexColor(data.color)) {
    errors.color = '颜色格式不正确，请输入 # 开头的 6 位 HEX 值'
  }
  if (data.resourceCount !== undefined && data.resourceCount !== null) {
    const count = Number(data.resourceCount)
    if (isNaN(count) || count < 0 || !Number.isInteger(count)) {
      errors.resourceCount = '资源计数必须为非负整数'
    }
  }
  return errors
}

export function flatToTree(flatTags) {
  if (!Array.isArray(flatTags)) return []
  const map = new Map()
  const roots = []
  const sorted = [...flatTags].sort((a, b) => {
    if (a.parentId !== b.parentId) return 0
    return (a.order ?? 0) - (b.order ?? 0)
  })
  sorted.forEach((tag) => {
    map.set(tag.id, { ...tag, children: [] })
  })
  sorted.forEach((tag) => {
    const node = map.get(tag.id)
    if (!tag.parentId || !map.has(tag.parentId)) {
      roots.push(node)
    } else {
      const parent = map.get(tag.parentId)
      parent.children.push(node)
    }
  })
  return roots
}

export function treeToFlat(tree) {
  const result = []
  function walk(nodes) {
    nodes.forEach((node) => {
      const { children, ...rest } = node
      result.push(rest)
      if (children && children.length > 0) {
        walk(children)
      }
    })
  }
  walk(Array.isArray(tree) ? tree : [])
  return result
}

export function getChildIds(tagId, flatTags) {
  const childIds = []
  function findChildren(parentId) {
    flatTags.forEach((tag) => {
      if (tag.parentId === parentId) {
        childIds.push(tag.id)
        findChildren(tag.id)
      }
    })
  }
  findChildren(tagId)
  return childIds
}

export function getAncestorIds(tagId, flatTags) {
  const ancestors = []
  let currentId = tagId
  const tagMap = new Map(flatTags.map((t) => [t.id, t]))
  while (currentId) {
    const tag = tagMap.get(currentId)
    if (tag && tag.parentId) {
      ancestors.unshift(tag.parentId)
      currentId = tag.parentId
    } else {
      break
    }
  }
  return ancestors
}

export function getTagById(flatTags, tagId) {
  if (!Array.isArray(flatTags)) return null
  return flatTags.find((t) => t.id === tagId) || null
}

export function getTagPath(flatTags, tagId) {
  const path = []
  const tagMap = new Map(flatTags.map((t) => [t.id, t]))
  let currentId = tagId
  while (currentId) {
    const tag = tagMap.get(currentId)
    if (tag) {
      path.unshift(tag)
      currentId = tag.parentId
    } else {
      break
    }
  }
  return path
}

export function isDescendant(ancestorId, descendantId, flatTags) {
  if (ancestorId === descendantId) return true
  const childIds = getChildIds(ancestorId, flatTags)
  return childIds.includes(descendantId)
}

export function canMoveTag(sourceId, targetId, flatTags, position) {
  if (sourceId === targetId) return false
  if (position === 'inside' && isDescendant(sourceId, targetId, flatTags)) {
    return false
  }
  return true
}

export function calculateMaxDepth(flatTags) {
  if (!Array.isArray(flatTags) || flatTags.length === 0) return 0
  let maxDepth = 0
  flatTags.forEach((tag) => {
    const depth = getTagPath(flatTags, tag.id).length
    if (depth > maxDepth) maxDepth = depth
  })
  return maxDepth
}

export function countRootTags(flatTags) {
  if (!Array.isArray(flatTags)) return 0
  return flatTags.filter((t) => !t.parentId).length
}

export function getTotalResourceCount(flatTags) {
  if (!Array.isArray(flatTags)) return 0
  return flatTags.reduce((sum, tag) => sum + (tag.resourceCount || 0), 0)
}

export function mergeTags(flatTags, sourceIds, targetId) {
  const sources = sourceIds.filter((id) => id !== targetId)
  if (sources.length === 0) {
    return { success: false, tags: flatTags, error: '请选择要合并的标签' }
  }
  const target = getTagById(flatTags, targetId)
  if (!target) {
    return { success: false, tags: flatTags, error: '目标标签不存在' }
  }
  const invalidSources = sources.filter((id) => !getTagById(flatTags, id))
  if (invalidSources.length > 0) {
    return { success: false, tags: flatTags, error: '存在无效的源标签' }
  }
  const mergedCount = sources.reduce((sum, id) => {
    const tag = getTagById(flatTags, id)
    return sum + (tag?.resourceCount || 0)
  }, 0)
  const updatedTags = flatTags
    .map((tag) => {
      if (tag.id === targetId) {
        return { ...tag, resourceCount: (tag.resourceCount || 0) + mergedCount }
      }
      return tag
    })
    .filter((tag) => !sources.includes(tag.id))
  return {
    success: true,
    tags: updatedTags,
    mergedCount: sources.length,
    transferredResources: mergedCount,
  }
}

export function splitTag(flatTags, sourceId, newTagName, newTagColor = DEFAULT_COLOR) {
  const source = getTagById(flatTags, sourceId)
  if (!source) {
    return { success: false, tags: flatTags, error: '源标签不存在' }
  }
  if (!validateTagName(newTagName)) {
    return { success: false, tags: flatTags, error: '新标签名称不能为空' }
  }
  if (isDuplicateName(flatTags, newTagName, source.parentId)) {
    return { success: false, tags: flatTags, error: '同级标签下名称已存在' }
  }
  const sourceCount = source.resourceCount || 0
  const transferCount = Math.floor(sourceCount / 2)
  const newTag = {
    id: generateTagId(),
    name: newTagName.trim(),
    parentId: source.parentId,
    color: newTagColor,
    resourceCount: transferCount,
    order: (source.order ?? 0) + 1,
  }
  const updatedTags = flatTags
    .map((tag) => {
      if (tag.id === sourceId) {
        return { ...tag, resourceCount: sourceCount - transferCount }
      }
      return tag
    })
    .concat(newTag)
  return {
    success: true,
    tags: updatedTags,
    newTag,
    transferredResources: transferCount,
  }
}

export function moveTag(flatTags, sourceId, targetId, position) {
  if (!canMoveTag(sourceId, targetId, flatTags, position)) {
    return { success: false, tags: flatTags, error: '不能将标签移动到自身的子标签下' }
  }
  const source = getTagById(flatTags, sourceId)
  if (!source) {
    return { success: false, tags: flatTags, error: '源标签不存在' }
  }
  let result = [...flatTags]
  if (position === 'inside') {
    result = result.map((tag) =>
      tag.id === sourceId ? { ...tag, parentId: targetId } : tag
    )
  } else {
    const target = getTagById(flatTags, targetId)
    if (!target) {
      return { success: false, tags: flatTags, error: '目标标签不存在' }
    }
    result = result.map((tag) =>
      tag.id === sourceId ? { ...tag, parentId: target.parentId } : tag
    )
    const siblings = result
      .filter((t) => t.parentId === target.parentId && t.id !== sourceId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const targetIndex = siblings.findIndex((t) => t.id === targetId)
    const newIndex = position === 'before' ? targetIndex : targetIndex + 1
    siblings.splice(newIndex, 0, source)
    siblings.forEach((tag, idx) => {
      const tagIndex = result.findIndex((t) => t.id === tag.id)
      if (tagIndex !== -1) {
        result[tagIndex] = { ...result[tagIndex], order: idx }
      }
    })
  }
  return { success: true, tags: result }
}

export function filterTagsByKeyword(flatTags, keyword) {
  if (!Array.isArray(flatTags)) return { filtered: [], matchedIds: new Set(), expandedIds: new Set() }
  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return {
      filtered: [...flatTags],
      matchedIds: new Set(),
      expandedIds: new Set(),
    }
  }
  const kw = keyword.trim().toLowerCase()
  const matchedIds = new Set()
  const expandedIds = new Set()
  flatTags.forEach((tag) => {
    if (tag.name.toLowerCase().includes(kw)) {
      matchedIds.add(tag.id)
      const ancestors = getAncestorIds(tag.id, flatTags)
      ancestors.forEach((id) => expandedIds.add(id))
    }
  })
  const filtered = flatTags.filter((tag) => {
    if (matchedIds.has(tag.id)) return true
    const descendants = getChildIds(tag.id, flatTags)
    return descendants.some((id) => matchedIds.has(id))
  })
  return { filtered, matchedIds, expandedIds }
}

export function generateResources(tagId, count) {
  const resources = []
  for (let i = 0; i < count; i++) {
    const nameIndex = i % RESOURCE_NAMES.length
    const typeIndex = (i * 3 + 7) % RESOURCE_TYPES.length
    resources.push({
      id: `res_${tagId}_${i}`,
      name: `${RESOURCE_NAMES[nameIndex]} ${Math.floor(i / RESOURCE_NAMES.length) + 1 || ''}`.trim(),
      type: RESOURCE_TYPES[typeIndex],
    })
  }
  return resources
}

export function paginateList(list, page, pageSize) {
  if (!Array.isArray(list)) {
    return { items: [], total: 0, totalPage: 1, currentPage: 1, pageSize }
  }
  const total = list.length
  const totalPage = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: list.slice(start, end),
    total,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function generateTrendData(flatTags, days = 7) {
  const result = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    const dayData = { date: dateStr }
    flatTags.forEach((tag) => {
      const seed = tag.id.charCodeAt(0) + i + date.getDate()
      dayData[tag.id] = Math.floor(Math.abs(Math.sin(seed) * 10)) % 11
    })
    result.push(dayData)
  }
  return result
}

export function getTopTags(flatTags, limit = 5) {
  if (!Array.isArray(flatTags)) return []
  return [...flatTags]
    .sort((a, b) => (b.resourceCount || 0) - (a.resourceCount || 0))
    .slice(0, limit)
}

function escapeCSVValue(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

export function tagsToCSV(flatTags, getParentName) {
  if (!Array.isArray(flatTags) || flatTags.length === 0) {
    return ''
  }
  const headers = ['标签名称', '父标签名称', '颜色 HEX', '资源计数']
  const rows = flatTags.map((tag) => [
    tag.name || '',
    getParentName ? getParentName(tag.parentId) : '',
    tag.color || DEFAULT_COLOR,
    tag.resourceCount || 0,
  ])
  const allRows = [headers, ...rows]
  return allRows.map((row) => row.map(escapeCSVValue).join(',')).join('\n')
}

export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { success: false, error: 'CSV 内容为空' }
  }
  try {
    const normalized = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalized.split('\n').filter((line) => line.trim().length > 0)
    if (lines.length === 0) {
      return { success: false, error: 'CSV 文件为空' }
    }
    const headers = parseCSVLine(lines[0]).map((h) => h.trim())
    const headerMap = {
      '标签名称': 'name',
      '父标签名称': 'parentName',
      '颜色 HEX': 'color',
      '资源计数': 'resourceCount',
    }
    const data = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row = {}
      headers.forEach((header, idx) => {
        const field = headerMap[header]
        if (field) {
          row[field] = (values[idx] || '').trim()
        }
      })
      data.push(row)
    }
    return { success: true, data, headers }
  } catch {
    return { success: false, error: 'CSV 解析失败' }
  }
}

export function validateCSVRow(row, existingTags, rowIndex) {
  const errors = {}
  if (!validateTagName(row.name)) {
    errors.name = '标签名称不能为空'
  }
  if (row.color && row.color !== '' && !validateHexColor(row.color)) {
    errors.color = '颜色格式不正确'
  }
  if (row.parentName && row.parentName !== '') {
    const parentExists = existingTags.some(
      (t) => t.name.trim() === row.parentName.trim()
    )
    if (!parentExists) {
      errors.parentName = '父标签不存在'
    }
  }
  if (row.resourceCount !== undefined && row.resourceCount !== '') {
    const count = Number(row.resourceCount)
    if (isNaN(count) || count < 0 || !Number.isInteger(count)) {
      errors.resourceCount = '资源计数必须为非负整数'
    }
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    rowIndex,
  }
}

export function validateImportData(rows, existingTags = []) {
  if (!Array.isArray(rows)) {
    return { valid: [], invalid: [] }
  }
  const valid = []
  const invalid = []
  const tempNameMap = new Map()
  rows.forEach((row, index) => {
    const validation = validateCSVRow(row, existingTags, index + 2)
    const trimmedName = row.name?.trim() || ''
    if (validation.valid) {
      const parentTag = existingTags.find(
        (t) => t.name.trim() === (row.parentName?.trim() || '')
      )
      const parentId = parentTag ? parentTag.id : null
      const count =
        row.resourceCount !== undefined && row.resourceCount !== ''
          ? parseInt(row.resourceCount, 10)
          : Math.floor(Math.random() * 51)
      const color = validateHexColor(row.color) ? row.color : DEFAULT_COLOR
      const duplicateName = existingTags.some(
        (t) => t.parentId === parentId && t.name.trim() === trimmedName
      )
      const tempDuplicate = tempNameMap.has(`${parentId}_${trimmedName}`)
      if (duplicateName || tempDuplicate) {
        invalid.push({
          row,
          index: index + 2,
          errors: { name: '同级标签下名称已存在' },
        })
      } else {
        tempNameMap.set(`${parentId}_${trimmedName}`, true)
        valid.push({
          name: trimmedName,
          parentId,
          parentName: row.parentName?.trim() || '',
          color,
          resourceCount: count,
        })
      }
    } else {
      invalid.push({
        row,
        index: index + 2,
        errors: validation.errors,
      })
    }
  })
  return { valid, invalid }
}

export function batchCreateTags(existingTags, validRows) {
  if (!Array.isArray(validRows) || validRows.length === 0) {
    return { tags: existingTags, created: 0 }
  }
  const maxOrders = new Map()
  existingTags.forEach((tag) => {
    const key = tag.parentId || 'root'
    const currentMax = maxOrders.get(key) ?? -1
    if ((tag.order ?? 0) > currentMax) {
      maxOrders.set(key, tag.order ?? 0)
    }
  })
  const newTags = validRows.map((row) => {
    const key = row.parentId || 'root'
    const currentMax = maxOrders.get(key) ?? -1
    const newOrder = currentMax + 1
    maxOrders.set(key, newOrder)
    return {
      id: generateTagId(),
      name: row.name,
      parentId: row.parentId,
      color: row.color || DEFAULT_COLOR,
      resourceCount: row.resourceCount ?? Math.floor(Math.random() * 51),
      order: newOrder,
    }
  })
  return {
    tags: [...existingTags, ...newTags],
    created: newTags.length,
  }
}

export function downloadCSV(content, filename = 'tags.csv') {
  if (typeof window === 'undefined' || !window.Blob) return false
  try {
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export function getRandomResourceCount() {
  return Math.floor(Math.random() * 51)
}

export function getRandomPresetColor() {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
}
