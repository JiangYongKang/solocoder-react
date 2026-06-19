import {
  STORAGE_KEY,
  MOCK_TAGS,
  DEFAULT_COLOR,
  TREND_DAYS,
} from './constants.js'
import {
  generateTagId,
  validateTagData,
  generateTrendData,
  getRandomResourceCount,
} from './utils.js'

export function loadTags() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return [...MOCK_TAGS]
}

export function saveTags(tags) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags))
    return true
  } catch {
    return false
  }
}

export function loadTrendData(tags) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + '_trend')
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return generateTrendData(tags, TREND_DAYS)
}

export function saveTrendData(trendData) {
  try {
    localStorage.setItem(STORAGE_KEY + '_trend', JSON.stringify(trendData))
    return true
  } catch {
    return false
  }
}

export function createTag(tags, data) {
  const errors = validateTagData(tags, data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const siblings = tags.filter((t) => t.parentId === data.parentId)
  const maxOrder = siblings.reduce(
    (max, t) => Math.max(max, t.order ?? 0),
    -1
  )
  const newTag = {
    id: generateTagId(),
    name: data.name.trim(),
    parentId: data.parentId || null,
    color: data.color || DEFAULT_COLOR,
    resourceCount:
      data.resourceCount !== undefined ? data.resourceCount : getRandomResourceCount(),
    order: maxOrder + 1,
  }
  return {
    success: true,
    tag: newTag,
    tags: [...tags, newTag],
  }
}

export function updateTag(tags, id, data) {
  const index = tags.findIndex((t) => t.id === id)
  if (index === -1) {
    return { success: false, errors: { id: '标签不存在' } }
  }
  const existing = tags[index]
  const parentId = data.parentId !== undefined ? data.parentId : existing.parentId
  const name = data.name !== undefined ? data.name : existing.name
  const color = data.color !== undefined ? data.color : existing.color
  const validationData = {
    ...data,
    name,
    parentId,
    color,
  }
  const errors = validateTagData(tags, validationData, id)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const updated = [...tags]
  updated[index] = {
    ...updated[index],
    name: data.name !== undefined ? data.name.trim() : updated[index].name,
    color: data.color !== undefined ? data.color : updated[index].color,
    parentId: parentId,
  }
  return {
    success: true,
    tag: updated[index],
    tags: updated,
  }
}

export function deleteTag(tags, id) {
  const exists = tags.some((t) => t.id === id)
  if (!exists) {
    return { success: false, tags, error: '标签不存在' }
  }
  const tagToDelete = tags.find((t) => t.id === id)
  const childIdsToDelete = []
  function findChildren(parentId) {
    tags.forEach((tag) => {
      if (tag.parentId === parentId) {
        childIdsToDelete.push(tag.id)
        findChildren(tag.id)
      }
    })
  }
  findChildren(id)
  const allIdsToDelete = [id, ...childIdsToDelete]
  const updatedTags = tags.filter((t) => !allIdsToDelete.includes(t.id))
  return {
    success: true,
    tags: updatedTags,
    deletedCount: allIdsToDelete.length,
    resourceCount: tagToDelete?.resourceCount || 0,
  }
}
