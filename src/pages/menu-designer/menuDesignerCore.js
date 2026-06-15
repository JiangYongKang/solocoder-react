import {
  STORAGE_KEY,
  DEFAULT_STATE,
  MENU_TYPES,
  LAYOUT_TYPES,
  TARGET_TYPES,
  PRESET_ICONS,
} from './constants.js'

let idCounter = 0

export function generateId(prefix = 'menu') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createMenuItem(
  type = MENU_TYPES.LINK,
  name = '新菜单',
  overrides = {}
) {
  const base = {
    id: generateId(),
    name,
    type,
    icon: type === MENU_TYPES.DIVIDER ? '' : '',
    link: type === MENU_TYPES.LINK ? '#/' : '',
    target: TARGET_TYPES.SELF,
    permission: '',
    children: [],
  }
  if (type === MENU_TYPES.DIVIDER) {
    base.name = '---'
  }
  return { ...base, ...overrides }
}

export function isValidMenuType(type) {
  return Object.values(MENU_TYPES).includes(type)
}

export function isValidLayoutType(layout) {
  return Object.values(LAYOUT_TYPES).includes(layout)
}

export function isValidTargetType(target) {
  return Object.values(TARGET_TYPES).includes(target)
}

export function isValidIcon(iconId) {
  if (!iconId) return true
  return PRESET_ICONS.some((icon) => icon.id === iconId)
}

export function getIconEmoji(iconId) {
  if (!iconId) return ''
  const icon = PRESET_ICONS.find((i) => i.id === iconId)
  return icon ? icon.emoji : ''
}

export function flattenMenu(menu, level = 0, parentId = null) {
  const result = []
  if (!Array.isArray(menu)) return result
  for (const item of menu) {
    result.push({ ...item, level, parentId })
    if (Array.isArray(item.children) && item.children.length > 0) {
      result.push(...flattenMenu(item.children, level + 1, item.id))
    }
  }
  return result
}

export function findMenuItemById(menu, id) {
  if (!Array.isArray(menu)) return null
  for (const item of menu) {
    if (item.id === id) return item
    if (Array.isArray(item.children)) {
      const found = findMenuItemById(item.children, id)
      if (found) return found
    }
  }
  return null
}

export function findParentInfo(menu, id, parent = null) {
  if (!Array.isArray(menu)) return null
  for (let i = 0; i < menu.length; i++) {
    if (menu[i].id === id) {
      return { parent, index: i, siblings: menu }
    }
    if (Array.isArray(menu[i].children)) {
      const found = findParentInfo(menu[i].children, id, menu[i])
      if (found) return found
    }
  }
  return null
}

export function findParentId(menu, id) {
  const info = findParentInfo(menu, id)
  if (!info) return null
  if (!info.parent) return null
  return info.parent.id
}

export function hasChildren(item) {
  return !!(item && Array.isArray(item.children) && item.children.length > 0)
}

export function countMenuItems(menu) {
  if (!Array.isArray(menu)) return 0
  let count = menu.length
  for (const item of menu) {
    if (Array.isArray(item.children)) {
      count += countMenuItems(item.children)
    }
  }
  return count
}

export function getMenuDepth(menu, current = 0) {
  if (!Array.isArray(menu) || menu.length === 0) return current
  let maxDepth = current
  for (const item of menu) {
    if (Array.isArray(item.children) && item.children.length > 0) {
      const depth = getMenuDepth(item.children, current + 1)
      if (depth > maxDepth) maxDepth = depth
    }
  }
  return maxDepth
}

export function isDescendant(menu, ancestorId, descendantId) {
  if (ancestorId === descendantId) return true
  const ancestor = findMenuItemById(menu, ancestorId)
  if (!ancestor || !Array.isArray(ancestor.children)) return false
  for (const child of ancestor.children) {
    if (isDescendant(menu, child.id, descendantId)) return true
  }
  return false
}

export function updateMenuItem(menu, id, updates) {
  if (!Array.isArray(menu)) return menu
  return menu.map((item) => {
    if (item.id === id) {
      return { ...item, ...updates }
    }
    if (Array.isArray(item.children)) {
      return { ...item, children: updateMenuItem(item.children, id, updates) }
    }
    return item
  })
}

export function addChildMenuItem(menu, parentId, newItem = null) {
  const item = newItem || createMenuItem()
  const addToParent = (items) => {
    if (!Array.isArray(items)) return items
    return items.map((it) => {
      if (it.id === parentId) {
        const children = Array.isArray(it.children) ? [...it.children, item] : [item]
        return { ...it, children, collapsed: false }
      }
      if (Array.isArray(it.children)) {
        return { ...it, children: addToParent(it.children) }
      }
      return it
    })
  }
  return { menu: addToParent(menu), newItemId: item.id }
}

export function addSiblingMenuItem(menu, siblingId, position = 'after', newItem = null) {
  const item = newItem || createMenuItem()
  const info = findParentInfo(menu, siblingId)
  if (!info) return { menu, newItemId: null }

  const insertIntoList = (items) => {
    if (!Array.isArray(items)) return items
    const idx = items.findIndex((it) => it.id === siblingId)
    if (idx === -1) {
      return items.map((it) => {
        if (Array.isArray(it.children)) {
          return { ...it, children: insertIntoList(it.children) }
        }
        return it
      })
    }
    const newList = [...items]
    const insertIdx = position === 'before' ? idx : idx + 1
    newList.splice(insertIdx, 0, item)
    return newList
  }

  if (!info.parent) {
    return { menu: insertIntoList(menu), newItemId: item.id }
  }

  const result = updateMenuItem(menu, info.parent.id, {
    children: insertIntoList(info.siblings),
  })
  return { menu: result, newItemId: item.id }
}

export function deleteMenuItem(menu, id) {
  if (!Array.isArray(menu)) return menu
  const filtered = menu
    .filter((item) => item.id !== id)
    .map((item) => {
      if (Array.isArray(item.children)) {
        return { ...item, children: deleteMenuItem(item.children, id) }
      }
      return item
    })
  return filtered
}

export function collectDescendantIds(menu, id) {
  const item = findMenuItemById(menu, id)
  if (!item) return []
  const ids = [id]
  if (Array.isArray(item.children)) {
    for (const child of item.children) {
      ids.push(...collectDescendantIds(menu, child.id))
    }
  }
  return ids
}

export function moveMenuItem(menu, sourceId, targetId, position = 'after') {
  if (sourceId === targetId) return menu
  if (isDescendant(menu, sourceId, targetId)) return menu

  const sourceItem = findMenuItemById(menu, sourceId)
  if (!sourceItem) return menu

  let menuWithoutSource = deleteMenuItem(menu, sourceId)
  const itemCopy = deepCloneMenuItem(sourceItem)

  if (position === 'child') {
    const { menu: result } = addChildMenuItem(menuWithoutSource, targetId, itemCopy)
    return result
  }

  if (position === 'before' || position === 'after') {
    const { menu: result } = addSiblingMenuItem(menuWithoutSource, targetId, position, itemCopy)
    return result
  }

  return menu
}

export function deepCloneMenuItem(item) {
  if (!item) return null
  return {
    ...item,
    children: Array.isArray(item.children) ? item.children.map(deepCloneMenuItem) : [],
  }
}

export function deepCloneMenu(menu) {
  if (!Array.isArray(menu)) return []
  return menu.map(deepCloneMenuItem)
}

export function reorderSiblings(menu, id, newIndex) {
  const info = findParentInfo(menu, id)
  if (!info) return menu
  const { siblings, index } = info
  if (index < 0 || newIndex < 0 || newIndex >= siblings.length) return menu
  if (index === newIndex) return menu

  const newSiblings = [...siblings]
  const [removed] = newSiblings.splice(index, 1)
  newSiblings.splice(newIndex, 0, removed)

  if (!info.parent) {
    return newSiblings
  }

  return updateMenuItem(menu, info.parent.id, { children: newSiblings })
}

export function toggleCollapse(menu, id) {
  const item = findMenuItemById(menu, id)
  if (!item) return menu
  return updateMenuItem(menu, id, { collapsed: !item.collapsed })
}

export function validateMenuItem(item) {
  const errors = []
  if (!item || typeof item !== 'object') {
    return { valid: false, errors: ['菜单项必须是对象'] }
  }
  if (!item.id || typeof item.id !== 'string') {
    errors.push('缺少有效的 id')
  }
  if (typeof item.name !== 'string') {
    errors.push('name 必须是字符串')
  }
  if (!isValidMenuType(item.type)) {
    errors.push(`无效的菜单项类型: ${item.type}`)
  }
  if (item.type === MENU_TYPES.LINK && typeof item.link !== 'string') {
    errors.push('链接类型菜单项必须有 link 字段')
  }
  if (!isValidTargetType(item.target)) {
    errors.push(`无效的打开方式: ${item.target}`)
  }
  if (!isValidIcon(item.icon)) {
    errors.push(`无效的图标: ${item.icon}`)
  }
  if (item.children !== undefined && !Array.isArray(item.children)) {
    errors.push('children 必须是数组')
  }
  if (Array.isArray(item.children)) {
    for (let i = 0; i < item.children.length; i++) {
      const childResult = validateMenuItem(item.children[i])
      if (!childResult.valid) {
        errors.push(`子菜单 ${i + 1}: ${childResult.errors.join(', ')}`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}

export function validateMenuConfig(config) {
  const errors = []
  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['配置必须是对象'] }
  }
  if (!isValidLayoutType(config.layout)) {
    errors.push(`无效的布局类型: ${config.layout}`)
  }
  if (typeof config.title !== 'string') {
    errors.push('title 必须是字符串')
  }
  if (!Array.isArray(config.menu)) {
    errors.push('menu 必须是数组')
  } else {
    for (let i = 0; i < config.menu.length; i++) {
      const result = validateMenuItem(config.menu[i])
      if (!result.valid) {
        errors.push(`菜单项 ${i + 1}: ${result.errors.join(', ')}`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}

export function exportToJson(state) {
  return {
    version: '1.0',
    title: state.title,
    layout: state.layout,
    menu: state.menu,
    exportedAt: new Date().toISOString(),
  }
}

export function downloadJson(state, filename = 'menu-config.json') {
  if (typeof window === 'undefined' || !window.document) return false
  try {
    const data = exportToJson(state)
    const jsonStr = JSON.stringify(data, null, 2)
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

export function importFromJson(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    return { valid: false, errors: ['无效的 JSON 数据'] }
  }

  if (jsonData.menu !== undefined) {
    const normalized = {
      title: typeof jsonData.title === 'string' ? jsonData.title : DEFAULT_STATE.title,
      layout: isValidLayoutType(jsonData.layout) ? jsonData.layout : DEFAULT_STATE.layout,
      menu: jsonData.menu,
    }
    const result = validateMenuConfig(normalized)
    if (!result.valid) {
      return result
    }
    return {
      valid: true,
      data: normalized,
    }
  }

  const menuResult = validateMenuConfig({
    title: DEFAULT_STATE.title,
    layout: DEFAULT_STATE.layout,
    menu: Array.isArray(jsonData) ? jsonData : [],
  })

  if (!menuResult.valid) {
    return { valid: false, errors: menuResult.errors }
  }

  return {
    valid: true,
    data: {
      title: DEFAULT_STATE.title,
      layout: DEFAULT_STATE.layout,
      menu: Array.isArray(jsonData) ? jsonData : [],
    },
  }
}

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { ...DEFAULT_STATE }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_STATE }
    const result = validateMenuConfig({
      title: typeof parsed.title === 'string' ? parsed.title : DEFAULT_STATE.title,
      layout: isValidLayoutType(parsed.layout) ? parsed.layout : DEFAULT_STATE.layout,
      menu: Array.isArray(parsed.menu) ? parsed.menu : DEFAULT_STATE.menu,
    })
    if (!result.valid) return { ...DEFAULT_STATE }
    return {
      title: typeof parsed.title === 'string' ? parsed.title : DEFAULT_STATE.title,
      layout: isValidLayoutType(parsed.layout) ? parsed.layout : DEFAULT_STATE.layout,
      menu: Array.isArray(parsed.menu) ? parsed.menu : DEFAULT_STATE.menu,
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveToStorage(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function parseJsonString(jsonString) {
  try {
    const parsed = JSON.parse(jsonString)
    return { success: true, data: parsed }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export function checkPermission(permission, userRoles = []) {
  if (!permission || permission === '') return true
  if (!Array.isArray(userRoles) || userRoles.length === 0) return false
  const required = permission.split(',').map((p) => p.trim()).filter(Boolean)
  return required.some((role) => userRoles.includes(role))
}
