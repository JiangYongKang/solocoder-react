import {
  STORAGE_KEY,
  NODE_TYPES,
  LAYOUT_DIRECTIONS,
  NODE_WIDTH,
  NODE_HEIGHT,
  HORIZONTAL_GAP,
  VERTICAL_GAP,
  SIBLING_GAP,
  MIN_ZOOM,
  MAX_ZOOM,
  getDefaultData,
  generateId,
} from './constants.js'

export function loadFromStorage(storage) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return getDefaultData()
  try {
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = getDefaultData()
      saveToStorage(defaults, s)
      return defaults
    }
    const parsed = JSON.parse(raw)
    if (!parsed.root || !isValidNode(parsed.root)) {
      return getDefaultData()
    }
    return parsed
  } catch {
    return getDefaultData()
  }
}

export function saveToStorage(data, storage) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return false
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function isValidNode(node) {
  if (!node || typeof node !== 'object') return false
  if (typeof node.id !== 'string' || node.id.length === 0) return false
  if (!Object.values(NODE_TYPES).includes(node.type)) return false
  if (typeof node.name !== 'string') return false
  if (!Array.isArray(node.children)) return false
  return node.children.every(isValidNode)
}

export function findNodeById(root, nodeId) {
  if (!root) return null
  if (root.id === nodeId) return root
  for (const child of root.children || []) {
    const found = findNodeById(child, nodeId)
    if (found) return found
  }
  return null
}

export function findParentNode(root, nodeId, parent = null) {
  if (!root) return null
  if (root.id === nodeId) return parent
  for (const child of root.children || []) {
    const found = findParentNode(child, nodeId, root)
    if (found !== null) return found
  }
  return null
}

export function isDescendant(root, ancestorId, descendantId) {
  if (ancestorId === descendantId) return false
  const ancestor = findNodeById(root, ancestorId)
  if (!ancestor) return false
  return findNodeById(ancestor, descendantId) !== null
}

export function getNodeDepth(root, nodeId, depth = 0) {
  if (!root) return -1
  if (root.id === nodeId) return depth
  for (const child of root.children || []) {
    const found = getNodeDepth(child, nodeId, depth + 1)
    if (found !== -1) return found
  }
  return -1
}

export function countDescendants(node) {
  if (!node || !node.children || node.children.length === 0) return 0
  let count = node.children.length
  for (const child of node.children) {
    count += countDescendants(child)
  }
  return count
}

export function traverseBFS(root, callback) {
  if (!root) return
  const queue = [root]
  while (queue.length > 0) {
    const node = queue.shift()
    callback(node)
    if (node.children) {
      for (const child of node.children) {
        queue.push(child)
      }
    }
  }
}

export function traverseDFS(root, callback) {
  if (!root) return
  callback(root)
  if (root.children) {
    for (const child of root.children) {
      traverseDFS(child, callback)
    }
  }
}

export function addChildNode(root, parentId, type, name) {
  const nodeType = type || NODE_TYPES.POSITION
  const nodeName = name?.trim() || `新${nodeType === NODE_TYPES.DEPARTMENT ? '部门' : nodeType === NODE_TYPES.POSITION ? '职位' : '人员'}`
  const now = Date.now()
  const newNode = {
    id: generateId('node'),
    type: nodeType,
    name: nodeName,
    email: '',
    phone: '',
    createdAt: now,
    updatedAt: now,
    children: [],
  }

  const cloned = cloneTree(root)
  const parent = findNodeById(cloned, parentId)
  if (!parent) {
    return { tree: cloned, newNodeId: null }
  }
  parent.children = parent.children || []
  parent.children.push(newNode)
  parent.updatedAt = now
  return { tree: cloned, newNodeId: newNode.id }
}

export function addSiblingNode(root, siblingId, type, name) {
  const parent = findParentNode(root, siblingId)
  if (!parent) {
    return addChildNode(root, root.id, type, name)
  }
  const siblingIndex = parent.children.findIndex((c) => c.id === siblingId)
  const nodeType = type || NODE_TYPES.POSITION
  const nodeName = name?.trim() || `新${nodeType === NODE_TYPES.DEPARTMENT ? '部门' : nodeType === NODE_TYPES.POSITION ? '职位' : '人员'}`
  const now = Date.now()
  const newNode = {
    id: generateId('node'),
    type: nodeType,
    name: nodeName,
    email: '',
    phone: '',
    createdAt: now,
    updatedAt: now,
    children: [],
  }

  const cloned = cloneTree(root)
  const clonedParent = findNodeById(cloned, parent.id)
  clonedParent.children.splice(siblingIndex + 1, 0, newNode)
  clonedParent.updatedAt = now
  return { tree: cloned, newNodeId: newNode.id }
}

export function updateNode(root, nodeId, updates) {
  const cloned = cloneTree(root)
  const node = findNodeById(cloned, nodeId)
  if (!node) return cloned

  const allowedKeys = ['name', 'type', 'email', 'phone']
  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      node[key] = updates[key]
    }
  }
  node.updatedAt = Date.now()
  return cloned
}

export function deleteNode(root, nodeId) {
  if (root.id === nodeId) return root
  const cloned = cloneTree(root)
  const parent = findParentNode(cloned, nodeId)
  if (!parent) return cloned
  parent.children = parent.children.filter((c) => c.id !== nodeId)
  parent.updatedAt = Date.now()
  return cloned
}

export function moveNode(root, sourceId, targetId, position = 'child') {
  if (sourceId === targetId) return root
  if (isDescendant(root, sourceId, targetId)) return root

  const cloned = cloneTree(root)
  const sourceParent = findParentNode(cloned, sourceId)
  if (!sourceParent) return cloned

  const sourceIndex = sourceParent.children.findIndex((c) => c.id === sourceId)
  const [sourceNode] = sourceParent.children.splice(sourceIndex, 1)
  sourceParent.updatedAt = Date.now()

  const targetNode = findNodeById(cloned, targetId)
  if (!targetNode) return cloned

  if (position === 'child') {
    targetNode.children = targetNode.children || []
    targetNode.children.push(sourceNode)
    targetNode.updatedAt = Date.now()
  } else if (position === 'before' || position === 'after') {
    const targetParent = findParentNode(cloned, targetId)
    if (!targetParent) {
      targetNode.children = targetNode.children || []
      targetNode.children.push(sourceNode)
    } else {
      const targetIndex = targetParent.children.findIndex((c) => c.id === targetId)
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
      targetParent.children.splice(insertIndex, 0, sourceNode)
      targetParent.updatedAt = Date.now()
    }
  }

  return cloned
}

export function reorderSiblings(root, nodeId, newIndex) {
  const cloned = cloneTree(root)
  const parent = findParentNode(cloned, nodeId)
  if (!parent) return cloned

  const currentIndex = parent.children.findIndex((c) => c.id === nodeId)
  if (currentIndex === -1) return cloned

  const clampedIndex = Math.max(0, Math.min(newIndex, parent.children.length - 1))
  if (clampedIndex === currentIndex) return cloned

  const [node] = parent.children.splice(currentIndex, 1)
  parent.children.splice(clampedIndex, 0, node)
  parent.updatedAt = Date.now()
  return cloned
}

export function cloneTree(root) {
  if (!root) return null
  return {
    ...root,
    children: (root.children || []).map((child) => cloneTree(child)),
  }
}

export function calculateLayout(root, direction = LAYOUT_DIRECTIONS.VERTICAL) {
  const positions = new Map()
  if (!root) return positions

  const getSubtreeWidth = (node) => {
    if (!node.children || node.children.length === 0) {
      return NODE_WIDTH
    }
    let totalWidth = 0
    for (let i = 0; i < node.children.length; i++) {
      totalWidth += getSubtreeWidth(node.children[i])
      if (i > 0) totalWidth += SIBLING_GAP
    }
    return Math.max(NODE_WIDTH, totalWidth)
  }

  const getSubtreeHeight = (node) => {
    if (!node.children || node.children.length === 0) {
      return NODE_HEIGHT
    }
    let totalHeight = 0
    for (let i = 0; i < node.children.length; i++) {
      totalHeight += getSubtreeHeight(node.children[i])
      if (i > 0) totalHeight += SIBLING_GAP
    }
    return Math.max(NODE_HEIGHT, totalHeight)
  }

  if (direction === LAYOUT_DIRECTIONS.VERTICAL) {
    const layoutVertical = (node, x, y, depth) => {
      const subtreeWidth = getSubtreeWidth(node)
      const nodeX = x + (subtreeWidth - NODE_WIDTH) / 2
      positions.set(node.id, {
        id: node.id,
        x: nodeX,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        depth,
      })

      let childX = x
      const childY = y + NODE_HEIGHT + VERTICAL_GAP
      for (const child of node.children || []) {
        const childWidth = getSubtreeWidth(child)
        layoutVertical(child, childX, childY, depth + 1)
        childX += childWidth + SIBLING_GAP
      }
    }
    layoutVertical(root, 0, 0, 0)
  } else {
    const layoutHorizontal = (node, x, y, depth) => {
      const subtreeHeight = getSubtreeHeight(node)
      const nodeY = y + (subtreeHeight - NODE_HEIGHT) / 2
      positions.set(node.id, {
        id: node.id,
        x,
        y: nodeY,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        depth,
      })

      let childY = y
      const childX = x + NODE_WIDTH + HORIZONTAL_GAP
      for (const child of node.children || []) {
        const childHeight = getSubtreeHeight(child)
        layoutHorizontal(child, childX, childY, depth + 1)
        childY += childHeight + SIBLING_GAP
      }
    }
    layoutHorizontal(root, 0, 0, 0)
  }

  return positions
}

export function getLayoutBounds(positions) {
  if (!positions || positions.size === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + pos.width)
    maxY = Math.max(maxY, pos.y + pos.height)
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function fitToView(positions, containerWidth, containerHeight, padding = 100) {
  const bounds = getLayoutBounds(positions)
  if (bounds.width === 0 || bounds.height === 0) {
    return { panX: containerWidth / 2, panY: containerHeight / 2, zoom: 1 }
  }

  const contentWidth = bounds.width + padding * 2
  const contentHeight = bounds.height + padding * 2
  const scaleX = containerWidth / contentWidth
  const scaleY = containerHeight / contentHeight
  const zoom = clampZoom(Math.min(scaleX, scaleY, MAX_ZOOM))

  const centerX = bounds.minX + bounds.width / 2
  const centerY = bounds.minY + bounds.height / 2
  const panX = containerWidth / 2 - centerX * zoom
  const panY = containerHeight / 2 - centerY * zoom

  return { panX, panY, zoom }
}

export function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
}

export function changeNodeType(root, nodeId, newType) {
  if (!Object.values(NODE_TYPES).includes(newType)) {
    return root
  }
  return updateNode(root, nodeId, { type: newType })
}

export function exportToJson(root) {
  return {
    root: cloneTree(root),
    version: 1,
    exportedAt: Date.now(),
  }
}

export function importFromJson(json) {
  try {
    if (!json || typeof json !== 'object') {
      return { valid: false, error: '无效的 JSON 格式' }
    }
    if (!json.root || !isValidNode(json.root)) {
      return { valid: false, error: '缺少有效的 root 节点或节点格式不正确' }
    }
    return {
      valid: true,
      data: {
        root: cloneTree(json.root),
        version: json.version || 1,
      },
    }
  } catch (e) {
    return { valid: false, error: `解析失败: ${e.message}` }
  }
}

export function downloadJson(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `org-chart-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getSiblings(root, nodeId) {
  const parent = findParentNode(root, nodeId)
  if (!parent) return [root]
  return [...parent.children]
}

export function getPrevSibling(root, nodeId) {
  const siblings = getSiblings(root, nodeId)
  const idx = siblings.findIndex((s) => s.id === nodeId)
  return idx > 0 ? siblings[idx - 1] : null
}

export function getNextSibling(root, nodeId) {
  const siblings = getSiblings(root, nodeId)
  const idx = siblings.findIndex((s) => s.id === nodeId)
  return idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null
}

export function getNodePath(root, nodeId) {
  const path = []
  const findPath = (node, currentPath) => {
    if (!node) return false
    currentPath.push({ id: node.id, name: node.name, type: node.type })
    if (node.id === nodeId) return true
    for (const child of node.children || []) {
      if (findPath(child, currentPath)) return true
    }
    currentPath.pop()
    return false
  }
  findPath(root, path)
  return path
}

export function countNodesByType(root) {
  const counts = {
    [NODE_TYPES.DEPARTMENT]: 0,
    [NODE_TYPES.POSITION]: 0,
    [NODE_TYPES.PERSON]: 0,
  }
  traverseBFS(root, (node) => {
    if (counts[node.type] !== undefined) {
      counts[node.type]++
    }
  })
  return counts
}

export function getMaxDepth(root) {
  let max = 0
  traverseBFS(root, (node) => {
    const depth = getNodeDepth(root, node.id)
    max = Math.max(max, depth)
  })
  return max
}
