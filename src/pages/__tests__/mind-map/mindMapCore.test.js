import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateId,
  createNode,
  createRootNode,
  findNodeById,
  findParentNode,
  updateNode,
  addChildNode,
  addSiblingNode,
  deleteNode,
  getSiblings,
  getPrevSibling,
  getNextSibling,
  isDescendant,
  moveNode,
  toggleCollapse,
  getVisibleChildren,
  cloneTree,
  calculateSubtreeHeight,
  calculateLayout,
  calculateLayoutBalanced,
  clampZoom,
  screenToWorld,
  worldToScreen,
  getConnectionPath,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  exportToJson,
  importFromJson,
  isValidIcon,
  getIconEmoji,
  countNodes,
  getMaxDepth,
  collectAllNodeIds,
  fitToView,
} from '../../mind-map/mindMapCore.js'
import {
  MIN_ZOOM,
  MAX_ZOOM,
  NODE_WIDTH,
  NODE_HEIGHT,
  PRESET_ICONS,
  DEFAULT_ROOT_COLOR,
  DEFAULT_CHILD_COLOR,
} from '../../mind-map/constants.js'

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
})

describe('createNode', () => {
  it('should create a node with default values', () => {
    const node = createNode()
    expect(node).toHaveProperty('id')
    expect(typeof node.id).toBe('string')
    expect(node.text).toBe('新节点')
    expect(node.color).toBe(DEFAULT_CHILD_COLOR)
    expect(node.icon).toBeNull()
    expect(node.collapsed).toBe(false)
    expect(Array.isArray(node.children)).toBe(true)
    expect(node.children).toHaveLength(0)
  })

  it('should create a node with custom text and color', () => {
    const node = createNode('Custom Text', '#ff0000')
    expect(node.text).toBe('Custom Text')
    expect(node.color).toBe('#ff0000')
  })
})

describe('createRootNode', () => {
  it('should create a root node with default children', () => {
    const root = createRootNode()
    expect(root.text).toBe('中心主题')
    expect(root.color).toBe(DEFAULT_ROOT_COLOR)
    expect(Array.isArray(root.children)).toBe(true)
    expect(root.children.length).toBeGreaterThan(0)
  })
})

describe('findNodeById', () => {
  it('should return null for null tree', () => {
    expect(findNodeById(null, 'x')).toBeNull()
  })

  it('should find root node', () => {
    const root = createRootNode()
    expect(findNodeById(root, root.id)).toBe(root)
  })

  it('should find child node', () => {
    const root = createRootNode()
    const child = root.children[0]
    expect(findNodeById(root, child.id)).toBe(child)
  })

  it('should return null for missing node', () => {
    const root = createRootNode()
    expect(findNodeById(root, 'nonexistent')).toBeNull()
  })

  it('should find deeply nested node', () => {
    const root = createRootNode()
    const { tree } = addChildNode(root, root.children[0].id, 'nested')
    const nested = findNodeById(tree, tree.children[0].children[0].id)
    expect(nested).toBeDefined()
    expect(nested.text).toBe('nested')
  })
})

describe('findParentNode', () => {
  it('should return null for root node', () => {
    const root = createRootNode()
    expect(findParentNode(root, root.id)).toBeNull()
  })

  it('should find parent of child node', () => {
    const root = createRootNode()
    const child = root.children[0]
    expect(findParentNode(root, child.id)).toBe(root)
  })

  it('should find parent of deeply nested node', () => {
    let root = createRootNode()
    const { tree: t1, newNodeId } = addChildNode(root, root.children[0].id, 'level2')
    root = t1
    const parent = findParentNode(root, newNodeId)
    expect(parent.id).toBe(root.children[0].id)
  })
})

describe('updateNode', () => {
  it('should return original for null tree', () => {
    expect(updateNode(null, 'x', {})).toBeNull()
  })

  it('should update root node', () => {
    const root = createRootNode()
    const updated = updateNode(root, root.id, { text: 'Updated' })
    expect(updated.text).toBe('Updated')
    expect(root.text).toBe('中心主题')
  })

  it('should update child node without mutating', () => {
    const root = createRootNode()
    const childId = root.children[0].id
    const updated = updateNode(root, childId, { text: 'Updated Child', color: '#fff' })
    expect(updated.children[0].text).toBe('Updated Child')
    expect(updated.children[0].color).toBe('#fff')
    expect(root.children[0].text).not.toBe('Updated Child')
  })
})

describe('addChildNode', () => {
  it('should add child node to root', () => {
    const root = createRootNode()
    const { tree, newNodeId } = addChildNode(root, root.id, 'New Child')
    expect(newNodeId).toBeDefined()
    const added = findNodeById(tree, newNodeId)
    expect(added.text).toBe('New Child')
    expect(tree.children.some((c) => c.id === newNodeId)).toBe(true)
  })

  it('should auto-expand parent when adding child', () => {
    let root = createRootNode()
    root = updateNode(root, root.id, { collapsed: true })
    const { tree } = addChildNode(root, root.id, 'Test')
    expect(tree.collapsed).toBe(false)
  })

  it('should add to nested parent', () => {
    let root = createRootNode()
    const childId = root.children[0].id
    const { tree, newNodeId } = addChildNode(root, childId, 'Grandchild')
    const parent = findNodeById(tree, childId)
    expect(parent.children.some((c) => c.id === newNodeId)).toBe(true)
  })
})

describe('addSiblingNode', () => {
  it('should add sibling after existing node', () => {
    const root = createRootNode()
    const firstChildId = root.children[0].id
    const { tree, newNodeId } = addSiblingNode(root, firstChildId, 'New Sibling')
    const siblings = tree.children.map((c) => c.id)
    const firstIdx = siblings.indexOf(firstChildId)
    expect(siblings.indexOf(newNodeId)).toBe(firstIdx + 1)
  })

  it('should return null newNodeId for root (no parent)', () => {
    const root = createRootNode()
    const { tree, newNodeId } = addSiblingNode(root, root.id, 'As Child')
    expect(newNodeId).toBeNull()
    expect(tree).toBe(root)
  })
})

describe('deleteNode', () => {
  it('should return null when deleting root', () => {
    const root = createRootNode()
    expect(deleteNode(root, root.id)).toBeNull()
  })

  it('should delete child node', () => {
    const root = createRootNode()
    const childId = root.children[0].id
    const result = deleteNode(root, childId)
    expect(result.children.some((c) => c.id === childId)).toBe(false)
  })

  it('should delete deeply nested node', () => {
    let root = createRootNode()
    const { tree: t1, newNodeId } = addChildNode(root, root.children[0].id, 'toDelete')
    const result = deleteNode(t1, newNodeId)
    expect(findNodeById(result, newNodeId)).toBeNull()
  })

  it('should not mutate original tree', () => {
    const root = createRootNode()
    const childId = root.children[0].id
    deleteNode(root, childId)
    expect(root.children.some((c) => c.id === childId)).toBe(true)
  })
})

describe('getSiblings', () => {
  it('should return empty array for root', () => {
    const root = createRootNode()
    expect(getSiblings(root, root.id)).toEqual([])
  })

  it('should return all sibling ids', () => {
    const root = createRootNode()
    const child = root.children[0]
    const siblings = getSiblings(root, child.id)
    expect(siblings).toEqual(root.children.map((c) => c.id))
  })
})

describe('getPrevSibling / getNextSibling', () => {
  it('should return null for first child prev', () => {
    const root = createRootNode()
    expect(getPrevSibling(root, root.children[0].id)).toBeNull()
  })

  it('should find previous sibling', () => {
    const root = createRootNode()
    const second = root.children[1]?.id
    if (second) {
      expect(getPrevSibling(root, second)).toBe(root.children[0].id)
    }
  })

  it('should return null for last child next', () => {
    const root = createRootNode()
    const last = root.children[root.children.length - 1].id
    expect(getNextSibling(root, last)).toBeNull()
  })

  it('should find next sibling', () => {
    const root = createRootNode()
    const first = root.children[0].id
    if (root.children.length > 1) {
      expect(getNextSibling(root, first)).toBe(root.children[1].id)
    }
  })
})

describe('isDescendant', () => {
  it('should return true for same node', () => {
    const root = createRootNode()
    expect(isDescendant(root, root.id, root.id)).toBe(true)
  })

  it('should detect direct child as descendant', () => {
    const root = createRootNode()
    expect(isDescendant(root, root.id, root.children[0].id)).toBe(true)
  })

  it('should detect non-descendant', () => {
    const root = createRootNode()
    expect(isDescendant(root, root.children[0].id, root.id)).toBe(false)
  })

  it('should detect nested descendant', () => {
    let root = createRootNode()
    const { tree: t1, newNodeId } = addChildNode(root, root.children[0].id, 'nested')
    root = t1
    expect(isDescendant(root, root.id, newNodeId)).toBe(true)
    expect(isDescendant(root, root.children[0].id, newNodeId)).toBe(true)
  })
})

describe('moveNode', () => {
  it('should not move node to itself', () => {
    const root = createRootNode()
    const result = moveNode(root, root.children[0].id, root.children[0].id, 'child')
    expect(result).toBe(root)
  })

  it('should not move ancestor into descendant', () => {
    let root = createRootNode()
    const childId = root.children[0].id
    const { tree: t1, newNodeId } = addChildNode(root, childId, 'nested')
    root = t1
    const result = moveNode(root, childId, newNodeId, 'child')
    expect(result).toBe(root)
  })

  it('should move node as child of target', () => {
    const root = createRootNode()
    if (root.children.length < 2) return
    const sourceId = root.children[0].id
    const targetId = root.children[1].id
    const result = moveNode(root, sourceId, targetId, 'child')
    const target = findNodeById(result, targetId)
    expect(target.children.some((c) => c.id === sourceId)).toBe(true)
    expect(result.children.some((c) => c.id === sourceId)).toBe(false)
  })

  it('should move node before target', () => {
    const root = createRootNode()
    if (root.children.length < 2) return
    const sourceId = root.children[root.children.length - 1].id
    const targetId = root.children[0].id
    const result = moveNode(root, sourceId, targetId, 'before')
    const ids = result.children.map((c) => c.id)
    expect(ids.indexOf(sourceId)).toBeLessThan(ids.indexOf(targetId))
  })

  it('should move node after target', () => {
    const root = createRootNode()
    if (root.children.length < 2) return
    const sourceId = root.children[0].id
    const targetId = root.children[root.children.length - 1].id
    const result = moveNode(root, sourceId, targetId, 'after')
    const ids = result.children.map((c) => c.id)
    expect(ids.indexOf(sourceId)).toBeGreaterThan(ids.indexOf(targetId))
  })
})

describe('toggleCollapse', () => {
  it('should toggle collapsed state', () => {
    const root = createRootNode()
    expect(root.collapsed).toBe(false)
    const toggled = toggleCollapse(root, root.id)
    expect(toggled.collapsed).toBe(true)
    const toggled2 = toggleCollapse(toggled, root.id)
    expect(toggled2.collapsed).toBe(false)
  })
})

describe('getVisibleChildren', () => {
  it('should return empty array for null', () => {
    expect(getVisibleChildren(null)).toEqual([])
  })

  it('should return children when not collapsed', () => {
    const root = createRootNode()
    const visible = getVisibleChildren(root)
    expect(visible.length).toBe(root.children.length)
  })

  it('should return empty array when collapsed', () => {
    const root = createRootNode()
    root.collapsed = true
    expect(getVisibleChildren(root)).toEqual([])
  })
})

describe('cloneTree', () => {
  it('should return null for null input', () => {
    expect(cloneTree(null)).toBeNull()
  })

  it('should deep clone tree structure', () => {
    const root = createRootNode()
    const cloned = cloneTree(root)
    expect(cloned).not.toBe(root)
    expect(cloned.id).toBe(root.id)
    expect(cloned.children[0]).not.toBe(root.children[0])
    expect(cloned.children[0].id).toBe(root.children[0].id)
  })
})

describe('calculateSubtreeHeight', () => {
  it('should return NODE_HEIGHT for leaf node', () => {
    const node = createNode('leaf')
    expect(calculateSubtreeHeight(node)).toBe(NODE_HEIGHT)
  })

  it('should return NODE_HEIGHT for collapsed node', () => {
    const node = createRootNode()
    node.collapsed = true
    expect(calculateSubtreeHeight(node)).toBe(NODE_HEIGHT)
  })

  it('should calculate height with children', () => {
    const root = createRootNode()
    const height = calculateSubtreeHeight(root)
    expect(height).toBeGreaterThan(NODE_HEIGHT)
  })
})

describe('calculateLayout', () => {
  it('should return a Map with positions', () => {
    const root = createRootNode()
    const positions = calculateLayout(root, 0, 0)
    expect(positions instanceof Map).toBe(true)
    expect(positions.has(root.id)).toBe(true)
    const pos = positions.get(root.id)
    expect(typeof pos.x).toBe('number')
    expect(typeof pos.y).toBe('number')
    expect(pos.width).toBe(NODE_WIDTH)
    expect(pos.height).toBe(NODE_HEIGHT)
  })

  it('should position all visible nodes', () => {
    const root = createRootNode()
    const positions = calculateLayout(root, 0, 0)
    const allIds = collectAllNodeIds(root)
    allIds.forEach((id) => {
      expect(positions.has(id)).toBe(true)
    })
  })
})

describe('calculateLayoutBalanced', () => {
  it('should return a Map with positions', () => {
    const root = createRootNode()
    const positions = calculateLayoutBalanced(root, 0, 0)
    expect(positions instanceof Map).toBe(true)
    expect(positions.has(root.id)).toBe(true)
  })

  it('should position root at center', () => {
    const root = createRootNode()
    const positions = calculateLayoutBalanced(root, 100, 200)
    const pos = positions.get(root.id)
    expect(pos.x).toBeCloseTo(100 - NODE_WIDTH / 2, 0)
    expect(pos.y).toBeCloseTo(200 - NODE_HEIGHT / 2, 0)
  })

  it('should handle single node without children', () => {
    const node = createNode('solo')
    node.children = []
    const positions = calculateLayoutBalanced(node, 0, 0)
    expect(positions.size).toBe(1)
    expect(positions.has(node.id)).toBe(true)
  })
})

describe('clampZoom', () => {
  it('should clamp to MIN_ZOOM', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(-1)).toBe(MIN_ZOOM)
  })

  it('should clamp to MAX_ZOOM', () => {
    expect(clampZoom(10)).toBe(MAX_ZOOM)
  })

  it('should return value within range', () => {
    expect(clampZoom(1.0)).toBe(1.0)
    expect(clampZoom(0.5)).toBe(0.5)
  })
})

describe('screenToWorld / worldToScreen', () => {
  it('should convert screen to world coords', () => {
    const world = screenToWorld(100, 200, 10, 20, 2)
    expect(world.x).toBe((100 - 10) / 2)
    expect(world.y).toBe((200 - 20) / 2)
  })

  it('should convert world to screen coords', () => {
    const screen = worldToScreen(45, 90, 10, 20, 2)
    expect(screen.x).toBe(45 * 2 + 10)
    expect(screen.y).toBe(90 * 2 + 20)
  })

  it('should be inverse operations', () => {
    const panX = 50, panY = 100, zoom = 1.5
    const worldX = 200, worldY = 300
    const screen = worldToScreen(worldX, worldY, panX, panY, zoom)
    const world = screenToWorld(screen.x, screen.y, panX, panY, zoom)
    expect(world.x).toBeCloseTo(worldX)
    expect(world.y).toBeCloseTo(worldY)
  })
})

describe('getConnectionPath', () => {
  it('should return a valid SVG path string with polyline (L segments)', () => {
    const fromPos = { x: 0, y: 0, width: 100, height: 40, direction: 'center' }
    const toPos = { x: 200, y: 0, width: 100, height: 40, direction: 'right' }
    const path = getConnectionPath(fromPos, toPos)
    expect(typeof path).toBe('string')
    expect(path.startsWith('M ')).toBe(true)
    expect(path.includes('L ')).toBe(true)
    expect(path.includes('C ')).toBe(false)
  })

  it('should handle left direction (polyline)', () => {
    const fromPos = { x: 200, y: 0, width: 100, height: 40, direction: 'center' }
    const toPos = { x: 0, y: 0, width: 100, height: 40, direction: 'left' }
    const path = getConnectionPath(fromPos, toPos)
    expect(path.startsWith('M ')).toBe(true)
    expect(path.includes('L ')).toBe(true)
  })

  it('should produce orthogonal polyline with correct anchor points (right child)', () => {
    const fromPos = { x: 0, y: 0, width: 100, height: 40, direction: 'right' }
    const toPos = { x: 200, y: 100, width: 100, height: 40, direction: 'right' }
    const path = getConnectionPath(fromPos, toPos)
    const parts = path.split(/[ML]\s+/).filter(Boolean).map((s) => s.trim())
    expect(parts).toHaveLength(4)
    const start = parts[0].split(' ').map(Number)
    expect(start[0]).toBe(100)
    expect(start[1]).toBe(20)
    const end = parts[3].split(' ').map(Number)
    expect(end[0]).toBe(200)
    expect(end[1]).toBe(120)
  })

  it('should produce orthogonal polyline with correct anchor points (left child)', () => {
    const fromPos = { x: 300, y: 0, width: 100, height: 40, direction: 'center' }
    const toPos = { x: 0, y: 100, width: 100, height: 40, direction: 'left' }
    const path = getConnectionPath(fromPos, toPos)
    const parts = path.split(/[ML]\s+/).filter(Boolean).map((s) => s.trim())
    expect(parts).toHaveLength(4)
    const start = parts[0].split(' ').map(Number)
    expect(start[0]).toBe(350)
    expect(start[1]).toBe(20)
    const end = parts[3].split(' ').map(Number)
    expect(end[0]).toBe(100)
    expect(end[1]).toBe(120)
  })

  it('should produce horizontal-first then vertical polyline shape', () => {
    const fromPos = { x: 0, y: 0, width: 100, height: 40, direction: 'right' }
    const toPos = { x: 300, y: 200, width: 100, height: 40, direction: 'right' }
    const path = getConnectionPath(fromPos, toPos)
    const parts = path.split(/[ML]\s+/).filter(Boolean).map((s) => s.trim())
    const p0 = parts[0].split(' ').map(Number)
    const p1 = parts[1].split(' ').map(Number)
    const p2 = parts[2].split(' ').map(Number)
    const p3 = parts[3].split(' ').map(Number)
    expect(p1[1]).toBe(p0[1])
    expect(p1[0]).toBe(p2[0])
    expect(p2[1]).toBe(p3[1])
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
    expect(result.id).toBeDefined()
  })

  it('saveToStorage should persist data', () => {
    const root = createRootNode()
    const saved = saveToStorage(root, mockStorage)
    expect(saved).toBe(true)
    const loaded = loadFromStorage(mockStorage)
    expect(loaded.id).toBe(root.id)
  })

  it('loadFromStorage should handle invalid JSON', () => {
    mockStorage.setItem('mind-map-editor-state', 'invalid')
    const result = loadFromStorage(mockStorage)
    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
  })

  it('clearStorage should remove data', () => {
    saveToStorage(createRootNode(), mockStorage)
    const cleared = clearStorage(mockStorage)
    expect(cleared).toBe(true)
    const loaded = loadFromStorage(mockStorage)
    expect(loaded.id).not.toBe(undefined)
  })

  it('should handle storage being unavailable', () => {
    expect(loadFromStorage(null)).toBeDefined()
    expect(saveToStorage({}, null)).toBe(false)
    expect(clearStorage(null)).toBe(false)
  })

  it('should handle storage errors gracefully', () => {
    const badStorage = {
      getItem: () => { throw new Error('fail') },
      setItem: () => { throw new Error('fail') },
      removeItem: () => { throw new Error('fail') },
    }
    expect(loadFromStorage(badStorage)).toBeDefined()
    expect(saveToStorage({}, badStorage)).toBe(false)
    expect(clearStorage(badStorage)).toBe(false)
  })
})

describe('exportToJson', () => {
  it('should export with version, tree and timestamp', () => {
    const tree = createRootNode()
    const result = exportToJson(tree)
    expect(result.version).toBe('1.0')
    expect(result.tree).toBe(tree)
    expect(typeof result.exportedAt).toBe('string')
    expect(new Date(result.exportedAt).toString()).not.toBe('Invalid Date')
  })
})

describe('importFromJson', () => {
  it('should reject non-object input', () => {
    expect(importFromJson(null).valid).toBe(false)
    expect(importFromJson('string').valid).toBe(false)
  })

  it('should reject missing tree', () => {
    expect(importFromJson({}).valid).toBe(false)
  })

  it('should reject tree without id', () => {
    expect(importFromJson({ tree: { text: 'x' } }).valid).toBe(false)
  })

  it('should reject tree without text', () => {
    expect(importFromJson({ tree: { id: 'x' } }).valid).toBe(false)
  })

  it('should accept valid data', () => {
    const tree = createRootNode()
    const result = importFromJson({ tree })
    expect(result.valid).toBe(true)
    expect(result.data.id).toBe(tree.id)
  })
})

describe('icon functions', () => {
  it('isValidIcon should validate icon ids', () => {
    expect(isValidIcon(null)).toBe(false)
    expect(isValidIcon('invalid')).toBe(false)
    expect(isValidIcon(PRESET_ICONS[0].id)).toBe(true)
  })

  it('getIconEmoji should return emoji for valid id', () => {
    expect(getIconEmoji(PRESET_ICONS[0].id)).toBe(PRESET_ICONS[0].emoji)
    expect(getIconEmoji('invalid')).toBeNull()
  })
})

describe('tree utilities', () => {
  it('countNodes should count all nodes', () => {
    expect(countNodes(null)).toBe(0)
    const root = createRootNode()
    const initialCount = countNodes(root)
    expect(initialCount).toBeGreaterThan(1)
    const { tree } = addChildNode(root, root.id, 'extra')
    expect(countNodes(tree)).toBe(initialCount + 1)
  })

  it('getMaxDepth should return tree depth', () => {
    const root = createRootNode()
    expect(getMaxDepth(root)).toBeGreaterThanOrEqual(0)
    const { tree } = addChildNode(root, root.children[0].id, 'deeper')
    expect(getMaxDepth(tree)).toBeGreaterThanOrEqual(2)
  })

  it('collectAllNodeIds should collect all ids', () => {
    expect(collectAllNodeIds(null)).toEqual([])
    const root = createRootNode()
    const ids = collectAllNodeIds(root)
    expect(Array.isArray(ids)).toBe(true)
    expect(ids.length).toBe(countNodes(root))
    expect(ids.includes(root.id)).toBe(true)
  })
})

describe('fitToView', () => {
  it('should return defaults for empty positions', () => {
    const result = fitToView(new Map(), 800, 600, 80)
    expect(result.zoom).toBe(1)
    expect(typeof result.panX).toBe('number')
    expect(typeof result.panY).toBe('number')
  })

  it('should calculate fit for positions', () => {
    const positions = new Map()
    positions.set('a', { x: 0, y: 0, width: 100, height: 50 })
    positions.set('b', { x: 200, y: 100, width: 100, height: 50 })
    const result = fitToView(positions, 1000, 800, 80)
    expect(result.zoom).toBeLessThanOrEqual(MAX_ZOOM)
    expect(result.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
    expect(typeof result.panX).toBe('number')
    expect(typeof result.panY).toBe('number')
  })

  it('should handle single node', () => {
    const positions = new Map()
    positions.set('a', { x: 50, y: 50, width: NODE_WIDTH, height: NODE_HEIGHT })
    const result = fitToView(positions, 500, 400, 20)
    expect(result.zoom).toBeGreaterThan(0)
  })
})
