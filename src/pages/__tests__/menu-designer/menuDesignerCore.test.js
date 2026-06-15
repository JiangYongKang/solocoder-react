import { beforeEach, describe, expect, it } from 'vitest'
import {
    DEFAULT_MENU,
    DEFAULT_STATE,
    DEFAULT_TITLE,
    LAYOUT_TYPES,
    MENU_TYPES,
    PRESET_ICONS,
    STORAGE_KEY,
    TARGET_TYPES,
} from '../../menu-designer/constants.js'
import {
    addChildMenuItem,
    addSiblingMenuItem,
    checkPermission,
    clearStorage,
    collectDescendantIds,
    countMenuItems,
    createMenuItem,
    deepCloneMenu,
    deepCloneMenuItem,
    deleteMenuItem,
    downloadJson,
    exportToJson,
    findMenuItemById,
    findParentId,
    findParentInfo,
    flattenMenu,
    generateId,
    getIconEmoji,
    getMenuDepth,
    hasChildren,
    importFromJson,
    isDescendant,
    isValidIcon,
    isValidLayoutType,
    isValidMenuType,
    isValidTargetType,
    loadFromStorage,
    moveMenuItem,
    parseJsonString,
    reorderSiblings,
    saveToStorage,
    toggleCollapse,
    updateMenuItem,
    validateMenuConfig,
    validateMenuItem,
} from '../../menu-designer/menuDesignerCore.js'

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    clear: () => { store.clear() },
  }
}

describe('generateId', () => {
  it('should generate string IDs', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('should generate unique IDs', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('should use custom prefix', () => {
    const id = generateId('custom')
    expect(id.startsWith('custom_')).toBe(true)
  })
})

describe('createMenuItem', () => {
  it('should create a link menu item with default values', () => {
    const item = createMenuItem()
    expect(item).toHaveProperty('id')
    expect(typeof item.id).toBe('string')
    expect(item.name).toBe('新菜单')
    expect(item.type).toBe(MENU_TYPES.LINK)
    expect(item.link).toBe('#/')
    expect(item.target).toBe(TARGET_TYPES.SELF)
    expect(item.permission).toBe('')
    expect(Array.isArray(item.children)).toBe(true)
    expect(item.children).toHaveLength(0)
  })

  it('should create a divider item', () => {
    const item = createMenuItem(MENU_TYPES.DIVIDER)
    expect(item.type).toBe(MENU_TYPES.DIVIDER)
    expect(item.name).toBe('---')
  })

  it('should create a group menu item', () => {
    const item = createMenuItem(MENU_TYPES.GROUP, '分组菜单')
    expect(item.type).toBe(MENU_TYPES.GROUP)
    expect(item.name).toBe('分组菜单')
  })

  it('should apply overrides', () => {
    const item = createMenuItem(MENU_TYPES.LINK, '自定义', {
      link: '#/custom',
      permission: 'admin',
      icon: 'home',
    })
    expect(item.link).toBe('#/custom')
    expect(item.permission).toBe('admin')
    expect(item.icon).toBe('home')
  })
})

describe('validation functions', () => {
  it('isValidMenuType should validate menu types', () => {
    expect(isValidMenuType(MENU_TYPES.LINK)).toBe(true)
    expect(isValidMenuType(MENU_TYPES.GROUP)).toBe(true)
    expect(isValidMenuType(MENU_TYPES.DIVIDER)).toBe(true)
    expect(isValidMenuType('invalid')).toBe(false)
    expect(isValidMenuType(null)).toBe(false)
  })

  it('isValidLayoutType should validate layout types', () => {
    expect(isValidLayoutType(LAYOUT_TYPES.HORIZONTAL)).toBe(true)
    expect(isValidLayoutType(LAYOUT_TYPES.VERTICAL)).toBe(true)
    expect(isValidLayoutType(LAYOUT_TYPES.COLLAPSIBLE)).toBe(true)
    expect(isValidLayoutType('invalid')).toBe(false)
  })

  it('isValidTargetType should validate target types', () => {
    expect(isValidTargetType(TARGET_TYPES.SELF)).toBe(true)
    expect(isValidTargetType(TARGET_TYPES.BLANK)).toBe(true)
    expect(isValidTargetType('_parent')).toBe(false)
  })

  it('isValidIcon should validate icon ids', () => {
    expect(isValidIcon('')).toBe(true)
    expect(isValidIcon(null)).toBe(true)
    expect(isValidIcon(PRESET_ICONS[0].id)).toBe(true)
    expect(isValidIcon('invalid-icon')).toBe(false)
  })

  it('getIconEmoji should return emoji for valid id', () => {
    expect(getIconEmoji('')).toBe('')
    expect(getIconEmoji(null)).toBe('')
    expect(getIconEmoji(PRESET_ICONS[0].id)).toBe(PRESET_ICONS[0].emoji)
    expect(getIconEmoji('invalid')).toBe('')
  })
})

describe('flattenMenu', () => {
  it('should return empty array for non-array input', () => {
    expect(flattenMenu(null)).toEqual([])
    expect(flattenMenu(undefined)).toEqual([])
    expect(flattenMenu({})).toEqual([])
  })

  it('should flatten multi-level menu', () => {
    const menu = [
      { id: 'a', name: 'A', children: [
        { id: 'a1', name: 'A1', children: [
          { id: 'a11', name: 'A11', children: [] },
        ]},
        { id: 'a2', name: 'A2', children: [] },
      ]},
      { id: 'b', name: 'B', children: [] },
    ]
    const flattened = flattenMenu(menu)
    expect(flattened).toHaveLength(5)
    expect(flattened[0].id).toBe('a')
    expect(flattened[0].level).toBe(0)
    expect(flattened[1].id).toBe('a1')
    expect(flattened[1].level).toBe(1)
    expect(flattened[1].parentId).toBe('a')
    expect(flattened[2].id).toBe('a11')
    expect(flattened[2].level).toBe(2)
    expect(flattened[2].parentId).toBe('a1')
  })
})

describe('findMenuItemById', () => {
  it('should return null for invalid input', () => {
    expect(findMenuItemById(null, 'x')).toBeNull()
    expect(findMenuItemById([], 'x')).toBeNull()
  })

  it('should find item at root level', () => {
    const item = findMenuItemById(DEFAULT_MENU, 'root')
    expect(item).toBeDefined()
    expect(item.id).toBe('root')
  })

  it('should find nested item', () => {
    const item = findMenuItemById(DEFAULT_MENU, 'user-mgr')
    expect(item).toBeDefined()
    expect(item.id).toBe('user-mgr')
  })

  it('should find deeply nested item', () => {
    const item = findMenuItemById(DEFAULT_MENU, 'basic-settings')
    expect(item).toBeDefined()
    expect(item.id).toBe('basic-settings')
  })

  it('should return null for missing id', () => {
    expect(findMenuItemById(DEFAULT_MENU, 'nonexistent')).toBeNull()
  })
})

describe('findParentInfo / findParentId', () => {
  it('should return null for root items', () => {
    const info = findParentInfo(DEFAULT_MENU, 'root')
    expect(info).toBeDefined()
    expect(info.parent).toBeNull()
    expect(findParentId(DEFAULT_MENU, 'root')).toBeNull()
  })

  it('should find parent info for nested items', () => {
    const info = findParentInfo(DEFAULT_MENU, 'user-mgr')
    expect(info).toBeDefined()
    expect(info.parent.id).toBe('system')
    expect(info.index).toBe(0)
    expect(findParentId(DEFAULT_MENU, 'user-mgr')).toBe('system')
  })

  it('should find parent for deeply nested items', () => {
    expect(findParentId(DEFAULT_MENU, 'basic-settings')).toBe('settings-mgr')
  })

  it('should return null for missing id', () => {
    expect(findParentInfo(DEFAULT_MENU, 'nonexistent')).toBeNull()
    expect(findParentId(DEFAULT_MENU, 'nonexistent')).toBeNull()
  })
})

describe('hasChildren', () => {
  it('should return false for items without children', () => {
    const item = { id: 'x', children: [] }
    expect(hasChildren(item)).toBe(false)
    expect(hasChildren(null)).toBe(false)
  })

  it('should return true for items with children', () => {
    const item = findMenuItemById(DEFAULT_MENU, 'system')
    expect(hasChildren(item)).toBe(true)
  })
})

describe('countMenuItems and getMenuDepth', () => {
  it('countMenuItems should count all items recursively', () => {
    expect(countMenuItems(null)).toBe(0)
    expect(countMenuItems([])).toBe(0)
    expect(countMenuItems(DEFAULT_MENU)).toBeGreaterThan(4)
  })

  it('getMenuDepth should return max depth', () => {
    expect(getMenuDepth([])).toBe(0)
    expect(getMenuDepth(DEFAULT_MENU)).toBeGreaterThanOrEqual(2)
    const simple = [{ id: 'a', children: [] }]
    expect(getMenuDepth(simple)).toBe(0)
    const nested = [{ id: 'a', children: [{ id: 'b', children: [{ id: 'c', children: [] }] }] }]
    expect(getMenuDepth(nested)).toBe(2)
  })
})

describe('isDescendant', () => {
  it('should return true for same id', () => {
    expect(isDescendant(DEFAULT_MENU, 'system', 'system')).toBe(true)
  })

  it('should detect direct child as descendant', () => {
    expect(isDescendant(DEFAULT_MENU, 'system', 'user-mgr')).toBe(true)
  })

  it('should detect nested descendant', () => {
    expect(isDescendant(DEFAULT_MENU, 'system', 'basic-settings')).toBe(true)
    expect(isDescendant(DEFAULT_MENU, 'settings-mgr', 'basic-settings')).toBe(true)
  })

  it('should return false for non-descendant', () => {
    expect(isDescendant(DEFAULT_MENU, 'user-mgr', 'system')).toBe(false)
    expect(isDescendant(DEFAULT_MENU, 'root', 'system')).toBe(false)
  })
})

describe('updateMenuItem', () => {
  it('should return original for invalid input', () => {
    expect(updateMenuItem(null, 'x', {})).toBeNull()
  })

  it('should update item without mutating original', () => {
    const original = deepCloneMenu(DEFAULT_MENU)
    const updated = updateMenuItem(DEFAULT_MENU, 'root', { name: '新首页', icon: 'star' })
    const updatedItem = findMenuItemById(updated, 'root')
    expect(updatedItem.name).toBe('新首页')
    expect(updatedItem.icon).toBe('star')
    const originalItem = findMenuItemById(original, 'root')
    expect(originalItem.name).toBe('首页')
  })

  it('should update nested items', () => {
    const updated = updateMenuItem(DEFAULT_MENU, 'user-mgr', { name: '用户列表', permission: 'user' })
    const item = findMenuItemById(updated, 'user-mgr')
    expect(item.name).toBe('用户列表')
    expect(item.permission).toBe('user')
  })
})

describe('addChildMenuItem', () => {
  it('should add child to parent', () => {
    const { menu, newItemId } = addChildMenuItem(DEFAULT_MENU, 'system')
    expect(newItemId).toBeDefined()
    const parent = findMenuItemById(menu, 'system')
    expect(parent.children.some((c) => c.id === newItemId)).toBe(true)
  })

  it('should expand collapsed parent when adding child', () => {
    let menu = updateMenuItem(DEFAULT_MENU, 'system', { collapsed: true })
    const { menu: newMenu } = addChildMenuItem(menu, 'system')
    const parent = findMenuItemById(newMenu, 'system')
    expect(parent.collapsed).toBe(false)
  })

  it('should add to deeply nested parent', () => {
    const { menu, newItemId } = addChildMenuItem(DEFAULT_MENU, 'settings-mgr')
    const parent = findMenuItemById(menu, 'settings-mgr')
    expect(parent.children.some((c) => c.id === newItemId)).toBe(true)
  })
})

describe('addSiblingMenuItem', () => {
  it('should add sibling after target', () => {
    const { menu, newItemId } = addSiblingMenuItem(DEFAULT_MENU, 'root', 'after')
    const info = findParentInfo(menu, newItemId)
    const idx = info.siblings.findIndex((s) => s.id === newItemId)
    const rootIdx = info.siblings.findIndex((s) => s.id === 'root')
    expect(idx).toBe(rootIdx + 1)
  })

  it('should add sibling before target', () => {
    const { menu, newItemId } = addSiblingMenuItem(DEFAULT_MENU, 'content', 'before')
    const info = findParentInfo(menu, newItemId)
    const idx = info.siblings.findIndex((s) => s.id === newItemId)
    const contentIdx = info.siblings.findIndex((s) => s.id === 'content')
    expect(idx + 1).toBe(contentIdx)
  })

  it('should add sibling to nested items', () => {
    const { menu, newItemId } = addSiblingMenuItem(DEFAULT_MENU, 'user-mgr', 'after')
    const info = findParentInfo(menu, newItemId)
    expect(info.parent.id).toBe('system')
    const userIdx = info.siblings.findIndex((s) => s.id === 'user-mgr')
    const newIdx = info.siblings.findIndex((s) => s.id === newItemId)
    expect(newIdx).toBe(userIdx + 1)
  })
})

describe('deleteMenuItem', () => {
  it('should delete root level item', () => {
    const result = deleteMenuItem(DEFAULT_MENU, 'notifications')
    expect(findMenuItemById(result, 'notifications')).toBeNull()
  })

  it('should delete nested item', () => {
    const result = deleteMenuItem(DEFAULT_MENU, 'user-mgr')
    expect(findMenuItemById(result, 'user-mgr')).toBeNull()
    const parent = findMenuItemById(result, 'system')
    expect(parent.children.some((c) => c.id === 'user-mgr')).toBe(false)
  })

  it('should delete all descendants', () => {
    const result = deleteMenuItem(DEFAULT_MENU, 'system')
    expect(findMenuItemById(result, 'system')).toBeNull()
    expect(findMenuItemById(result, 'user-mgr')).toBeNull()
    expect(findMenuItemById(result, 'basic-settings')).toBeNull()
  })

  it('should not mutate original', () => {
    const original = deepCloneMenu(DEFAULT_MENU)
    deleteMenuItem(DEFAULT_MENU, 'system')
    expect(findMenuItemById(original, 'system')).toBeDefined()
  })
})

describe('collectDescendantIds', () => {
  it('should collect all descendant ids including self', () => {
    const ids = collectDescendantIds(DEFAULT_MENU, 'system')
    expect(ids.includes('system')).toBe(true)
    expect(ids.includes('user-mgr')).toBe(true)
    expect(ids.includes('settings-mgr')).toBe(true)
    expect(ids.includes('basic-settings')).toBe(true)
    expect(ids.includes('security-settings')).toBe(true)
  })

  it('should return empty for missing id', () => {
    expect(collectDescendantIds(DEFAULT_MENU, 'nonexistent')).toEqual([])
  })
})

describe('moveMenuItem', () => {
  it('should not move to itself', () => {
    const result = moveMenuItem(DEFAULT_MENU, 'root', 'root', 'child')
    expect(result).toBe(DEFAULT_MENU)
  })

  it('should not move ancestor into descendant', () => {
    const result = moveMenuItem(DEFAULT_MENU, 'system', 'basic-settings', 'child')
    expect(result).toBe(DEFAULT_MENU)
  })

  it('should move as child', () => {
    const result = moveMenuItem(DEFAULT_MENU, 'notifications', 'content', 'child')
    expect(findMenuItemById(result, 'notifications')).toBeDefined()
    const content = findMenuItemById(result, 'content')
    expect(content.children.some((c) => c.id === 'notifications')).toBe(true)
    expect(result.some((c) => c.id === 'notifications')).toBe(false)
  })

  it('should move before target', () => {
    const result = moveMenuItem(DEFAULT_MENU, 'notifications', 'root', 'before')
    const ids = result.map((r) => r.id)
    expect(ids.indexOf('notifications')).toBeLessThan(ids.indexOf('root'))
  })

  it('should move after target', () => {
    const result = moveMenuItem(DEFAULT_MENU, 'root', 'notifications', 'after')
    const ids = result.map((r) => r.id)
    expect(ids.indexOf('root')).toBeGreaterThan(ids.indexOf('notifications'))
  })
})

describe('deepCloneMenuItem and deepCloneMenu', () => {
  it('deepCloneMenuItem should return null for null input', () => {
    expect(deepCloneMenuItem(null)).toBeNull()
  })

  it('should deep clone menu', () => {
    const cloned = deepCloneMenu(DEFAULT_MENU)
    expect(cloned).not.toBe(DEFAULT_MENU)
    expect(cloned[0]).not.toBe(DEFAULT_MENU[0])
    expect(cloned[0].id).toBe(DEFAULT_MENU[0].id)
    expect(cloned[1].children).not.toBe(DEFAULT_MENU[1].children)
    expect(cloned[1].children[0].id).toBe(DEFAULT_MENU[1].children[0].id)
  })
})

describe('reorderSiblings', () => {
  it('should reorder items at root level', () => {
    const menu = [
      { id: 'a', children: [] },
      { id: 'b', children: [] },
      { id: 'c', children: [] },
    ]
    const result = reorderSiblings(menu, 'c', 0)
    expect(result.map((r) => r.id)).toEqual(['c', 'a', 'b'])
  })

  it('should reorder nested siblings', () => {
    const menu = [{ id: 'parent', children: [
      { id: 'a', children: [] },
      { id: 'b', children: [] },
      { id: 'c', children: [] },
    ]}]
    const result = reorderSiblings(menu, 'a', 2)
    const parent = findMenuItemById(result, 'parent')
    expect(parent.children.map((c) => c.id)).toEqual(['b', 'c', 'a'])
  })

  it('should handle same index', () => {
    const menu = [
      { id: 'a', children: [] },
      { id: 'b', children: [] },
    ]
    const result = reorderSiblings(menu, 'a', 0)
    expect(result).toBe(menu)
  })

  it('should handle invalid indices', () => {
    const menu = [
      { id: 'a', children: [] },
      { id: 'b', children: [] },
    ]
    const result = reorderSiblings(menu, 'a', 99)
    expect(result).toBe(menu)
  })
})

describe('toggleCollapse', () => {
  it('should toggle collapsed state', () => {
    const item = findMenuItemById(DEFAULT_MENU, 'system')
    expect(item.collapsed).toBeUndefined()
    const collapsed = toggleCollapse(DEFAULT_MENU, 'system')
    expect(findMenuItemById(collapsed, 'system').collapsed).toBe(true)
    const expanded = toggleCollapse(collapsed, 'system')
    expect(findMenuItemById(expanded, 'system').collapsed).toBe(false)
  })
})

describe('validateMenuItem', () => {
  it('should reject non-object', () => {
    expect(validateMenuItem(null).valid).toBe(false)
    expect(validateMenuItem('string').valid).toBe(false)
  })

  it('should require id', () => {
    const result = validateMenuItem({ name: 'x', type: 'link' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('id'))).toBe(true)
  })

  it('should require name as string', () => {
    const result = validateMenuItem({ id: 'x', type: 'link' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('name'))).toBe(true)
  })

  it('should validate type', () => {
    const result = validateMenuItem({ id: 'x', name: 'x', type: 'invalid' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('类型'))).toBe(true)
  })

  it('should validate link for link type', () => {
    const result = validateMenuItem({ id: 'x', name: 'x', type: 'link', link: 123, target: '_self' })
    expect(result.valid).toBe(false)
  })

  it('should validate target', () => {
    const result = validateMenuItem({ id: 'x', name: 'x', type: 'link', link: '#/', target: 'invalid' })
    expect(result.valid).toBe(false)
  })

  it('should validate icon', () => {
    const result = validateMenuItem({ id: 'x', name: 'x', type: 'link', link: '#/', target: '_self', icon: 'invalid' })
    expect(result.valid).toBe(false)
  })

  it('should validate children', () => {
    const result = validateMenuItem({ id: 'x', name: 'x', type: 'link', link: '#/', target: '_self', children: 'not-array' })
    expect(result.valid).toBe(false)
  })

  it('should validate nested children', () => {
    const result = validateMenuItem({
      id: 'x', name: 'x', type: 'link', link: '#/', target: '_self',
      children: [{ name: 'no id' }],
    })
    expect(result.valid).toBe(false)
  })

  it('should accept valid menu item', () => {
    const result = validateMenuItem({
      id: 'x', name: 'x', type: 'link', link: '#/', target: '_self',
      icon: '', permission: '', children: [],
    })
    expect(result.valid).toBe(true)
  })
})

describe('validateMenuConfig', () => {
  it('should reject non-object', () => {
    expect(validateMenuConfig(null).valid).toBe(false)
  })

  it('should validate layout', () => {
    const result = validateMenuConfig({ title: 'x', layout: 'invalid', menu: [] })
    expect(result.valid).toBe(false)
  })

  it('should validate title', () => {
    const result = validateMenuConfig({ layout: 'vertical', menu: [] })
    expect(result.valid).toBe(false)
  })

  it('should validate menu is array', () => {
    const result = validateMenuConfig({ title: 'x', layout: 'vertical', menu: 'not-array' })
    expect(result.valid).toBe(false)
  })

  it('should validate each menu item', () => {
    const result = validateMenuConfig({
      title: 'x', layout: 'vertical',
      menu: [{ name: 'no id' }],
    })
    expect(result.valid).toBe(false)
  })

  it('should accept valid config', () => {
    const result = validateMenuConfig(DEFAULT_STATE)
    expect(result.valid).toBe(true)
  })
})

describe('exportToJson', () => {
  it('should export with version, title, layout, menu and timestamp', () => {
    const result = exportToJson(DEFAULT_STATE)
    expect(result.version).toBe('1.0')
    expect(result.title).toBe(DEFAULT_TITLE)
    expect(result.layout).toBe(DEFAULT_STATE.layout)
    expect(result.menu).toBe(DEFAULT_STATE.menu)
    expect(typeof result.exportedAt).toBe('string')
    expect(new Date(result.exportedAt).toString()).not.toBe('Invalid Date')
  })
})

describe('importFromJson', () => {
  it('should reject non-object input', () => {
    expect(importFromJson(null).valid).toBe(false)
    expect(importFromJson('string').valid).toBe(false)
  })

  it('should accept config with menu, title, layout', () => {
    const result = importFromJson({
      version: '1.0',
      title: 'Custom Title',
      layout: LAYOUT_TYPES.HORIZONTAL,
      menu: [
        { id: 'x', name: 'Test', type: 'link', link: '#/', target: '_self', children: [] },
      ],
    })
    expect(result.valid).toBe(true)
    expect(result.data.title).toBe('Custom Title')
    expect(result.data.layout).toBe(LAYOUT_TYPES.HORIZONTAL)
    expect(result.data.menu.length).toBe(1)
  })

  it('should accept plain menu array', () => {
    const result = importFromJson([
      { id: 'x', name: 'Test', type: 'link', link: '#/', target: '_self', children: [] },
    ])
    expect(result.valid).toBe(true)
    expect(result.data.title).toBe(DEFAULT_TITLE)
    expect(result.data.layout).toBe(DEFAULT_STATE.layout)
  })

  it('should use defaults for missing fields', () => {
    const result = importFromJson({
      menu: [
        { id: 'x', name: 'Test', type: 'link', link: '#/', target: '_self', children: [] },
      ],
    })
    expect(result.valid).toBe(true)
    expect(result.data.title).toBe(DEFAULT_TITLE)
    expect(result.data.layout).toBe(DEFAULT_STATE.layout)
  })

  it('should reject invalid menu config', () => {
    const result = importFromJson({
      title: 'x', layout: 'vertical',
      menu: [{ name: 'no id' }],
    })
    expect(result.valid).toBe(false)
  })
})

describe('localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    mockStorage.clear()
  })

  it('loadFromStorage should return default for empty storage', () => {
    const result = loadFromStorage(mockStorage)
    expect(result).toBeDefined()
    expect(result.title).toBe(DEFAULT_TITLE)
    expect(Array.isArray(result.menu)).toBe(true)
  })

  it('saveToStorage should persist data', () => {
    const saved = saveToStorage(DEFAULT_STATE, mockStorage)
    expect(saved).toBe(true)
    const loaded = loadFromStorage(mockStorage)
    expect(loaded.title).toBe(DEFAULT_STATE.title)
    expect(loaded.layout).toBe(DEFAULT_STATE.layout)
    expect(loaded.menu.length).toBe(DEFAULT_STATE.menu.length)
  })

  it('loadFromStorage should handle invalid JSON', () => {
    mockStorage.setItem(STORAGE_KEY, 'invalid json')
    const result = loadFromStorage(mockStorage)
    expect(result).toBeDefined()
    expect(result.title).toBe(DEFAULT_TITLE)
  })

  it('clearStorage should remove data', () => {
    saveToStorage(DEFAULT_STATE, mockStorage)
    const cleared = clearStorage(mockStorage)
    expect(cleared).toBe(true)
    const loaded = loadFromStorage(mockStorage)
    expect(loaded.title).toBe(DEFAULT_TITLE)
  })

  it('should handle storage being unavailable', () => {
    expect(loadFromStorage(null).title).toBe(DEFAULT_TITLE)
    expect(saveToStorage({}, null)).toBe(false)
    expect(clearStorage(null)).toBe(false)
  })

  it('should handle storage errors gracefully', () => {
    const badStorage = {
      getItem: () => { throw new Error('fail') },
      setItem: () => { throw new Error('fail') },
      removeItem: () => { throw new Error('fail') },
    }
    expect(loadFromStorage(badStorage).title).toBe(DEFAULT_TITLE)
    expect(saveToStorage({}, badStorage)).toBe(false)
    expect(clearStorage(badStorage)).toBe(false)
  })
})

describe('parseJsonString', () => {
  it('should parse valid JSON', () => {
    const result = parseJsonString('{"a": 1, "b": [2, 3]}')
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ a: 1, b: [2, 3] })
  })

  it('should return error for invalid JSON', () => {
    const result = parseJsonString('not valid json')
    expect(result.success).toBe(false)
    expect(typeof result.error).toBe('string')
  })
})

describe('checkPermission', () => {
  it('should pass when no permission required', () => {
    expect(checkPermission('', [])).toBe(true)
    expect(checkPermission(null, [])).toBe(true)
    expect(checkPermission(undefined, [])).toBe(true)
  })

  it('should fail when permission required but no roles', () => {
    expect(checkPermission('admin', [])).toBe(false)
  })

  it('should check single role', () => {
    expect(checkPermission('admin', ['admin'])).toBe(true)
    expect(checkPermission('admin', ['user'])).toBe(false)
  })

  it('should check multiple comma-separated roles (OR)', () => {
    expect(checkPermission('admin, editor', ['admin'])).toBe(true)
    expect(checkPermission('admin, editor', ['editor'])).toBe(true)
    expect(checkPermission('admin, editor', ['user'])).toBe(false)
  })

  it('should handle whitespace in permission string', () => {
    expect(checkPermission('  admin  ,  editor  ', ['admin'])).toBe(true)
    expect(checkPermission('  admin  ,  editor  ', ['editor'])).toBe(true)
  })
})

describe('PRESET_ICONS', () => {
  it('should have at least 16 preset icons', () => {
    expect(PRESET_ICONS.length).toBeGreaterThanOrEqual(16)
  })

  it('should have unique icon ids', () => {
    const ids = PRESET_ICONS.map((icon) => icon.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('each icon should have id, emoji, and label', () => {
    PRESET_ICONS.forEach((icon) => {
      expect(icon).toHaveProperty('id')
      expect(icon).toHaveProperty('emoji')
      expect(icon).toHaveProperty('label')
      expect(typeof icon.id).toBe('string')
      expect(typeof icon.emoji).toBe('string')
      expect(typeof icon.label).toBe('string')
      expect(icon.id.length).toBeGreaterThan(0)
      expect(icon.emoji.length).toBeGreaterThan(0)
      expect(icon.label.length).toBeGreaterThan(0)
    })
  })

  it('all preset icon ids should be recognized by isValidIcon', () => {
    PRESET_ICONS.forEach((icon) => {
      expect(isValidIcon(icon.id)).toBe(true)
    })
  })

  it('all preset icons should resolve to emoji via getIconEmoji', () => {
    PRESET_ICONS.forEach((icon) => {
      expect(getIconEmoji(icon.id)).toBe(icon.emoji)
    })
  })
})

describe('downloadJson', () => {
  it('should return false when window is not available', () => {
    const originalWindow = globalThis.window
    delete globalThis.window
    try {
      const result = downloadJson(DEFAULT_STATE)
      expect(result).toBe(false)
    } finally {
      globalThis.window = originalWindow
    }
  })
})

describe('isValidIcon', () => {
  it('should return true for empty icon ids (optional field)', () => {
    expect(isValidIcon('')).toBe(true)
    expect(isValidIcon(null)).toBe(true)
    expect(isValidIcon(undefined)).toBe(true)
  })

  it('should return false for non-existent icon ids', () => {
    expect(isValidIcon('non-existent-icon')).toBe(false)
    expect(isValidIcon(123)).toBe(false)
  })
})

describe('validateMenuItem edge cases', () => {
  it('should reject item with invalid children type', () => {
    const item = createMenuItem()
    item.children = 'not an array'
    const result = validateMenuItem(item)
    expect(result.valid).toBe(false)
  })

  it('should reject item with missing name', () => {
    const item = createMenuItem()
    delete item.name
    const result = validateMenuItem(item)
    expect(result.valid).toBe(false)
  })

  it('should reject item with missing type', () => {
    const item = createMenuItem()
    delete item.type
    const result = validateMenuItem(item)
    expect(result.valid).toBe(false)
  })

  it('should reject item with missing id', () => {
    const item = createMenuItem()
    delete item.id
    const result = validateMenuItem(item)
    expect(result.valid).toBe(false)
  })
})

describe('moveMenuItem edge cases', () => {
  it('should not move item to be its own child', () => {
    const result = moveMenuItem(DEFAULT_MENU, 'system', 'system', 'child')
    expect(result).toBe(DEFAULT_MENU)
  })

  it('should not move ancestor into descendant', () => {
    const result = moveMenuItem(DEFAULT_MENU, 'system', 'basic-settings', 'child')
    expect(result).toBe(DEFAULT_MENU)
  })

  it('should not move non-existent source', () => {
    const result = moveMenuItem(DEFAULT_MENU, 'non-existent', 'home', 'after')
    expect(result).toBe(DEFAULT_MENU)
  })

  it('should not move to non-existent target', () => {
    const result = moveMenuItem(DEFAULT_MENU, 'home', 'non-existent', 'after')
    expect(result).toBe(DEFAULT_MENU)
  })
})

describe('deleteMenuItem edge cases', () => {
  it('should return structurally equal menu when deleting non-existent id', () => {
    const result = deleteMenuItem(DEFAULT_MENU, 'non-existent-id')
    expect(result).toEqual(DEFAULT_MENU)
  })

  it('should return empty array when deleting only root item', () => {
    const singleMenu = [createMenuItem(MENU_TYPES.LINK, 'Single')]
    const id = singleMenu[0].id
    const result = deleteMenuItem(singleMenu, id)
    expect(result).toHaveLength(0)
  })
})

describe('findParentInfo edge cases', () => {
  it('should return null for non-existent id', () => {
    const result = findParentInfo(DEFAULT_MENU, 'non-existent-id')
    expect(result).toBeNull()
  })

  it('should return null for empty menu', () => {
    const result = findParentInfo([], 'home')
    expect(result).toBeNull()
  })

  it('should return null for invalid menu input', () => {
    expect(findParentInfo(null, 'home')).toBeNull()
    expect(findParentInfo(undefined, 'home')).toBeNull()
    expect(findParentInfo('not an array', 'home')).toBeNull()
  })
})

describe('countMenuItems edge cases', () => {
  it('should return 0 for empty menu', () => {
    expect(countMenuItems([])).toBe(0)
  })

  it('should return 0 for invalid input', () => {
    expect(countMenuItems(null)).toBe(0)
    expect(countMenuItems(undefined)).toBe(0)
    expect(countMenuItems('not an array')).toBe(0)
  })

  it('should count nested items correctly', () => {
    const simpleMenu = [
      { id: 'a', children: [] },
      { id: 'b', children: [
        { id: 'b1', children: [] },
        { id: 'b2', children: [
          { id: 'b2a', children: [] }
        ]}
      ]},
    ]
    expect(countMenuItems(simpleMenu)).toBe(5)
  })
})

describe('getMenuDepth edge cases', () => {
  it('should return 0 for empty menu (default)', () => {
    expect(getMenuDepth([])).toBe(0)
  })

  it('should return 0 for invalid input (default)', () => {
    expect(getMenuDepth(null)).toBe(0)
    expect(getMenuDepth(undefined)).toBe(0)
  })

  it('should return 0 for flat menu (only roots)', () => {
    const flatMenu = [
      { id: 'a', children: [] },
      { id: 'b', children: [] },
    ]
    expect(getMenuDepth(flatMenu)).toBe(0)
  })

  it('should calculate depth correctly for deeply nested menu', () => {
    const deepMenu = [
      { id: 'l0', children: [
        { id: 'l1', children: [
          { id: 'l2', children: [
            { id: 'l3', children: [] }
          ]}
        ]}
      ]}
    ]
    expect(getMenuDepth(deepMenu)).toBe(3)
  })
})

describe('isDescendant edge cases', () => {
  it('should return true for same id (trivial case)', () => {
    expect(isDescendant(DEFAULT_MENU, 'system', 'system')).toBe(true)
  })

  it('should return false for non-existent ancestor', () => {
    expect(isDescendant(DEFAULT_MENU, 'non-existent', 'basic-settings')).toBe(false)
  })

  it('should return false for non-existent descendant', () => {
    expect(isDescendant(DEFAULT_MENU, 'system', 'non-existent')).toBe(false)
  })
})

describe('flattenMenu edge cases', () => {
  it('should return empty array for empty menu', () => {
    expect(flattenMenu([])).toHaveLength(0)
  })

  it('should return correct structure for each flat item', () => {
    const result = flattenMenu([
      { id: 'a', name: 'A', children: [] }
    ])
    expect(result[0]).toHaveProperty('id', 'a')
    expect(result[0]).toHaveProperty('name', 'A')
    expect(result[0]).toHaveProperty('level', 0)
    expect(result[0]).toHaveProperty('parentId', null)
  })

  it('should assign correct parentId for nested items', () => {
    const menu = [
      { id: 'a', name: 'A', children: [
        { id: 'a1', name: 'A1', children: [] }
      ]}
    ]
    const result = flattenMenu(menu)
    const a1 = result.find((r) => r.id === 'a1')
    expect(a1.parentId).toBe('a')
    expect(a1.level).toBe(1)
  })
})

describe('collectDescendantIds edge cases', () => {
  it('should return empty array for non-existent id', () => {
    const result = collectDescendantIds(DEFAULT_MENU, 'non-existent')
    expect(result).toHaveLength(0)
  })

  it('should return only the item id for leaf node', () => {
    const result = collectDescendantIds(DEFAULT_MENU, 'basic-settings')
    expect(result).toEqual(['basic-settings'])
  })

  it('should collect all descendants for parent node', () => {
    const result = collectDescendantIds(DEFAULT_MENU, 'settings-mgr')
    expect(result).toContain('settings-mgr')
    expect(result).toContain('basic-settings')
    expect(result).toContain('security-settings')
    expect(result.length).toBe(3)
  })
})

describe('reorderSiblings edge cases', () => {
  it('should return same menu for non-existent id', () => {
    const result = reorderSiblings(DEFAULT_MENU, 'non-existent', 0)
    expect(result).toBe(DEFAULT_MENU)
  })

  it('should return same menu for out-of-bounds index', () => {
    const menu = [
      { id: 'a', children: [] },
      { id: 'b', children: [] },
      { id: 'c', children: [] },
    ]
    const result = reorderSiblings(menu, 'b', -100)
    expect(result).toBe(menu)
    const result2 = reorderSiblings(menu, 'b', 100)
    expect(result2).toBe(menu)
  })
})

describe('addSiblingMenuItem edge cases', () => {
  it('should return same menu and null id for non-existent sibling', () => {
    const { menu, newItemId } = addSiblingMenuItem(DEFAULT_MENU, 'non-existent', 'after')
    expect(menu).toBe(DEFAULT_MENU)
    expect(newItemId).toBeNull()
  })

  it('should use provided newItem instead of creating one', () => {
    const customItem = { id: 'custom-123', name: 'Custom', type: 'link', icon: 'star', link: '#/custom', target: '_self', permission: '', children: [] }
    const { menu, newItemId } = addSiblingMenuItem(DEFAULT_MENU, 'root', 'after', customItem)
    expect(newItemId).toBe('custom-123')
    const found = findMenuItemById(menu, 'custom-123')
    expect(found).toBeDefined()
    expect(found.name).toBe('Custom')
  })
})

describe('addChildMenuItem edge cases', () => {
  it('should return structurally equal menu for non-existent parent', () => {
    const { menu, newItemId } = addChildMenuItem(DEFAULT_MENU, 'non-existent')
    expect(menu).toEqual(DEFAULT_MENU)
    expect(typeof newItemId).toBe('string')
  })
})

describe('updateMenuItem edge cases', () => {
  it('should return structurally equal menu for non-existent id', () => {
    const result = updateMenuItem(DEFAULT_MENU, 'non-existent', { name: 'Updated' })
    expect(result).toEqual(DEFAULT_MENU)
  })

  it('should update multiple fields at once', () => {
    const result = updateMenuItem(DEFAULT_MENU, 'root', {
      name: '首页Updated',
      icon: 'star',
      link: '#/new-home',
    })
    const item = findMenuItemById(result, 'root')
    expect(item.name).toBe('首页Updated')
    expect(item.icon).toBe('star')
    expect(item.link).toBe('#/new-home')
  })
})
