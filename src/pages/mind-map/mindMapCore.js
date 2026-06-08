import {
  STORAGE_KEY,
  MIN_ZOOM,
  MAX_ZOOM,
  NODE_WIDTH,
  NODE_HEIGHT,
  HORIZONTAL_GAP,
  VERTICAL_GAP,
  ROOT_HORIZONTAL_GAP,
  DEFAULT_ROOT_COLOR,
  DEFAULT_CHILD_COLOR,
  PRESET_ICONS,
} from './constants.js'

let idCounter = 0

export function generateId(prefix = 'node') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createNode(text = '新节点', color = DEFAULT_CHILD_COLOR) {
  return {
    id: generateId(),
    text,
    color,
    icon: null,
    collapsed: false,
    children: [],
  }
}

export function createRootNode(text = '中心主题') {
  const root = createNode(text, DEFAULT_ROOT_COLOR)
  root.children = [
    { ...createNode('分支主题 1', DEFAULT_CHILD_COLOR) },
    { ...createNode('分支主题 2', DEFAULT_CHILD_COLOR) },
  ]
  return root
}

export function findNodeById(root, nodeId) {
  if (!root) return null
  if (root.id === nodeId) return root
  if (!Array.isArray(root.children)) return null
  for (const child of root.children) {
    const found = findNodeById(child, nodeId)
    if (found) return found
  }
  return null
}

export function findParentNode(root, nodeId, parent = null) {
  if (!root) return null
  if (root.id === nodeId) return parent
  if (!Array.isArray(root.children)) return null
  for (const child of root.children) {
    const found = findParentNode(child, nodeId, root)
    if (found !== null || (found === null && child.id === nodeId)) {
      if (child.id === nodeId) return root
      if (found) return found
    }
  }
  return null
}

export function updateNode(root, nodeId, updates) {
  if (!root) return root
  if (root.id === nodeId) {
    return { ...root, ...updates }
  }
  if (!Array.isArray(root.children)) return root
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, nodeId, updates)),
  }
}

export function addChildNode(root, parentId, childText = '新节点') {
  const newNode = createNode(childText)
  const addToParent = (node) => {
    if (node.id === parentId) {
      const children = Array.isArray(node.children) ? [...node.children, newNode] : [newNode]
      return { ...node, children, collapsed: false }
    }
    if (!Array.isArray(node.children)) return node
    return {
      ...node,
      children: node.children.map(addToParent),
    }
  }
  return { tree: addToParent(root), newNodeId: newNode.id }
}

export function addSiblingNode(root, nodeId, siblingText = '新节点') {
  const newNode = createNode(siblingText)
  const parent = findParentNode(root, nodeId)
  if (!parent) return { tree: root, newNodeId: null }
  const idx = parent.children.findIndex((c) => c.id === nodeId)
  if (idx === -1) return { tree: root, newNodeId: null }
  const insertAtParent = (node) => {
    if (node.id === parent.id) {
      const newChildren = [...node.children]
      newChildren.splice(idx + 1, 0, newNode)
      return { ...node, children: newChildren }
    }
    if (!Array.isArray(node.children)) return node
    return {
      ...node,
      children: node.children.map(insertAtParent),
    }
  }
  return { tree: insertAtParent(root), newNodeId: newNode.id }
}

export function deleteNode(root, nodeId) {
  if (root.id === nodeId) return null
  if (!Array.isArray(root.children)) return root
  const filtered = root.children
    .filter((child) => child.id !== nodeId)
    .map((child) => deleteNode(child, nodeId))
  return { ...root, children: filtered }
}

export function getSiblings(root, nodeId) {
  const parent = findParentNode(root, nodeId)
  if (!parent) return []
  return parent.children.map((c) => c.id)
}

export function getPrevSibling(root, nodeId) {
  const siblings = getSiblings(root, nodeId)
  const idx = siblings.indexOf(nodeId)
  if (idx <= 0) return null
  return siblings[idx - 1]
}

export function getNextSibling(root, nodeId) {
  const siblings = getSiblings(root, nodeId)
  const idx = siblings.indexOf(nodeId)
  if (idx === -1 || idx >= siblings.length - 1) return null
  return siblings[idx + 1]
}

export function isDescendant(root, ancestorId, descendantId) {
  if (ancestorId === descendantId) return true
  const ancestor = findNodeById(root, ancestorId)
  if (!ancestor || !Array.isArray(ancestor.children)) return false
  for (const child of ancestor.children) {
    if (isDescendant(root, child.id, descendantId)) return true
  }
  return false
}

export function moveNode(root, sourceId, targetId, position = 'child') {
  if (sourceId === targetId) return root
  if (isDescendant(root, sourceId, targetId)) return root

  const sourceNode = findNodeById(root, sourceId)
  if (!sourceNode) return root

  let treeWithoutSource = deleteNode(root, sourceId)
  if (treeWithoutSource === null) return root

  const nodeCopy = JSON.parse(JSON.stringify(sourceNode))

  if (position === 'child') {
    const addAsChild = (node) => {
      if (node.id === targetId) {
        const children = Array.isArray(node.children) ? [...node.children, nodeCopy] : [nodeCopy]
        return { ...node, children, collapsed: false }
      }
      if (!Array.isArray(node.children)) return node
      return { ...node, children: node.children.map(addAsChild) }
    }
    return addAsChild(treeWithoutSource)
  }

  if (position === 'before' || position === 'after') {
    const targetParent = findParentNode(treeWithoutSource, targetId)
    if (!targetParent) return root
    const targetIdx = targetParent.children.findIndex((c) => c.id === targetId)
    if (targetIdx === -1) return root

    const insertAt = (node) => {
      if (node.id === targetParent.id) {
        const newChildren = [...node.children]
        const insertIdx = position === 'before' ? targetIdx : targetIdx + 1
        newChildren.splice(insertIdx, 0, nodeCopy)
        return { ...node, children: newChildren }
      }
      if (!Array.isArray(node.children)) return node
      return { ...node, children: node.children.map(insertAt) }
    }
    return insertAt(treeWithoutSource)
  }

  return root
}

export function toggleCollapse(root, nodeId) {
  const node = findNodeById(root, nodeId)
  if (!node) return root
  return updateNode(root, nodeId, { collapsed: !node.collapsed })
}

export function getVisibleChildren(node) {
  if (!node || node.collapsed || !Array.isArray(node.children)) return []
  return node.children
}

export function cloneTree(root) {
  if (!root) return null
  return {
    ...root,
    children: Array.isArray(root.children) ? root.children.map(cloneTree) : [],
  }
}

export function calculateSubtreeHeight(node) {
  if (!node || node.collapsed || !Array.isArray(node.children) || node.children.length === 0) {
    return NODE_HEIGHT
  }
  const visibleChildren = node.children
  let totalHeight = 0
  visibleChildren.forEach((child, idx) => {
    totalHeight += calculateSubtreeHeight(child)
    if (idx < visibleChildren.length - 1) {
      totalHeight += VERTICAL_GAP
    }
  })
  return Math.max(NODE_HEIGHT, totalHeight)
}

export function calculateLayout(root, startX = 0, startY = 0) {
  const positions = new Map()

  const layoutNode = (node, x, y, direction = 'right') => {
    positions.set(node.id, {
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      direction,
    })

    const visibleChildren = getVisibleChildren(node)
    if (visibleChildren.length === 0) return

    const subtreeHeights = visibleChildren.map((child) => calculateSubtreeHeight(child))
    const totalHeight = subtreeHeights.reduce((a, b) => a + b, 0) + (visibleChildren.length - 1) * VERTICAL_GAP

    let currentY = y + NODE_HEIGHT / 2 - totalHeight / 2

    const childX = direction === 'right'
      ? x + NODE_WIDTH + HORIZONTAL_GAP
      : x - NODE_WIDTH - HORIZONTAL_GAP

    visibleChildren.forEach((child, idx) => {
      const childY = currentY + subtreeHeights[idx] / 2 - NODE_HEIGHT / 2
      layoutNode(child, childX, childY, direction)
      currentY += subtreeHeights[idx] + VERTICAL_GAP
    })
  }

  const totalTreeHeight = calculateSubtreeHeight(root)
  const rootY = startY + totalTreeHeight / 2 - NODE_HEIGHT / 2
  layoutNode(root, startX, rootY, 'right')

  return positions
}

export function calculateLayoutBalanced(root, centerX = 0, centerY = 0) {
  const positions = new Map()

  if (!root) return positions

  if (!Array.isArray(root.children) || root.children.length === 0) {
    positions.set(root.id, {
      x: centerX - NODE_WIDTH / 2,
      y: centerY - NODE_HEIGHT / 2,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      direction: 'right',
    })
    return positions
  }

  const children = root.children
  const midIdx = Math.ceil(children.length / 2)
  const leftChildren = children.slice(0, midIdx)
  const rightChildren = children.slice(midIdx)

  positions.set(root.id, {
    x: centerX - NODE_WIDTH / 2,
    y: centerY - NODE_HEIGHT / 2,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    direction: 'center',
  })

  const layoutSide = (sideChildren, direction) => {
    if (sideChildren.length === 0) return

    const subtreeHeights = sideChildren.map((child) => calculateSubtreeHeight(child))
    const totalHeight = subtreeHeights.reduce((a, b) => a + b, 0) + (sideChildren.length - 1) * VERTICAL_GAP

    const childX = direction === 'right'
      ? centerX + NODE_WIDTH / 2 + ROOT_HORIZONTAL_GAP
      : centerX - NODE_WIDTH / 2 - ROOT_HORIZONTAL_GAP - NODE_WIDTH

    let currentY = centerY - totalHeight / 2

    sideChildren.forEach((child, idx) => {
      const childY = currentY + subtreeHeights[idx] / 2 - NODE_HEIGHT / 2

      const layoutNode = (node, x, y, dir) => {
        positions.set(node.id, {
          x,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          direction: dir,
        })

        const visibleChildren = getVisibleChildren(node)
        if (visibleChildren.length === 0) return

        const subHeights = visibleChildren.map((c) => calculateSubtreeHeight(c))
        const subTotal = subHeights.reduce((a, b) => a + b, 0) + (visibleChildren.length - 1) * VERTICAL_GAP

        let subY = y + NODE_HEIGHT / 2 - subTotal / 2
        const subX = dir === 'right'
          ? x + NODE_WIDTH + HORIZONTAL_GAP
          : x - NODE_WIDTH - HORIZONTAL_GAP

        visibleChildren.forEach((c, i) => {
          const cy = subY + subHeights[i] / 2 - NODE_HEIGHT / 2
          layoutNode(c, subX, cy, dir)
          subY += subHeights[i] + VERTICAL_GAP
        })
      }

      layoutNode(child, childX, childY, direction)
      currentY += subtreeHeights[idx] + VERTICAL_GAP
    })
  }

  layoutSide(leftChildren, 'left')
  layoutSide(rightChildren, 'right')

  return positions
}

export function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
}

export function screenToWorld(screenX, screenY, panX, panY, zoom) {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  }
}

export function worldToScreen(worldX, worldY, panX, panY, zoom) {
  return {
    x: worldX * zoom + panX,
    y: worldY * zoom + panY,
  }
}

export function getConnectionPath(fromPos, toPos) {
  const fromCenterX = fromPos.direction === 'left'
    ? fromPos.x
    : fromPos.x + (fromPos.direction === 'center' ? fromPos.width / 2 : fromPos.width)
  const fromCenterY = fromPos.y + fromPos.height / 2

  const toCenterX = toPos.direction === 'left'
    ? toPos.x + toPos.width
    : toPos.x
  const toCenterY = toPos.y + toPos.height / 2

  const midX = (fromCenterX + toCenterX) / 2

  return `M ${fromCenterX} ${fromCenterY} L ${midX} ${fromCenterY} L ${midX} ${toCenterY} L ${toCenterX} ${toCenterY}`
}

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return createRootNode()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createRootNode()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.id) return createRootNode()
    return parsed
  } catch {
    return createRootNode()
  }
}

export function saveToStorage(tree, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tree))
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

export function exportToJson(tree) {
  return {
    version: '1.0',
    tree,
    exportedAt: new Date().toISOString(),
  }
}

export function downloadJson(tree, filename = 'mindmap.json') {
  if (typeof window === 'undefined' || !window.document) return false
  try {
    const data = exportToJson(tree)
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
    return { valid: false, error: '无效的 JSON 数据' }
  }
  if (!jsonData.tree || typeof jsonData.tree !== 'object') {
    return { valid: false, error: '缺少 tree 数据' }
  }
  if (!jsonData.tree.id || typeof jsonData.tree.id !== 'string') {
    return { valid: false, error: '根节点缺少有效的 id' }
  }
  if (typeof jsonData.tree.text !== 'string') {
    return { valid: false, error: '根节点缺少有效的 text' }
  }
  return { valid: true, data: jsonData.tree }
}

export function isValidIcon(iconId) {
  if (!iconId) return false
  return PRESET_ICONS.some((icon) => icon.id === iconId)
}

export function getIconEmoji(iconId) {
  const icon = PRESET_ICONS.find((i) => i.id === iconId)
  return icon ? icon.emoji : null
}

export function countNodes(root) {
  if (!root) return 0
  let count = 1
  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      count += countNodes(child)
    }
  }
  return count
}

export function getMaxDepth(root, current = 0) {
  if (!root) return current
  if (!Array.isArray(root.children) || root.children.length === 0) return current
  let max = current
  for (const child of root.children) {
    const depth = getMaxDepth(child, current + 1)
    if (depth > max) max = depth
  }
  return max
}

export function collectAllNodeIds(root) {
  if (!root) return []
  const ids = [root.id]
  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      ids.push(...collectAllNodeIds(child))
    }
  }
  return ids
}

export function fitToView(positions, containerWidth, containerHeight, padding = 80) {
  if (!positions || positions.size === 0) {
    return { panX: containerWidth / 2, panY: containerHeight / 2, zoom: 1 }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  positions.forEach((pos) => {
    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + pos.width)
    maxY = Math.max(maxY, pos.y + pos.height)
  })

  const contentWidth = maxX - minX
  const contentHeight = maxY - minY
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const availableWidth = containerWidth - padding * 2
  const availableHeight = containerHeight - padding * 2

  const zoom = clampZoom(
    Math.min(
      availableWidth / (contentWidth || 1),
      availableHeight / (contentHeight || 1)
    )
  )

  const panX = containerWidth / 2 - centerX * zoom
  const panY = containerHeight / 2 - centerY * zoom

  return { panX, panY, zoom }
}
