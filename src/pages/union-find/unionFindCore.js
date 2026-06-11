import {
  NODE_RADIUS,
  NODE_DIAMETER,
  HORIZONTAL_GAP,
  VERTICAL_GAP,
  TREE_HORIZONTAL_GAP,
  MIN_ZOOM,
  MAX_ZOOM,
  OPERATION_TYPE,
} from './constants.js'

export function createInitialState() {
  return {
    nodes: new Map(),
    parent: new Map(),
    rank: new Map(),
    positions: new Map(),
    nextId: 0,
  }
}

export function serializeState(state) {
  return {
    nodes: Array.from(state.nodes.entries()),
    parent: Array.from(state.parent.entries()),
    rank: Array.from(state.rank.entries()),
    positions: Array.from(state.positions.entries()),
    nextId: state.nextId,
  }
}

export function deserializeState(data) {
  return {
    nodes: new Map(data.nodes),
    parent: new Map(data.parent),
    rank: new Map(data.rank),
    positions: new Map(data.positions),
    nextId: data.nextId,
  }
}

export function cloneState(state) {
  return deserializeState(serializeState(state))
}

export function generateNodeName(id) {
  if (id < 26) {
    return String.fromCharCode(65 + id)
  }
  const letters = []
  let n = id
  while (n >= 0) {
    letters.unshift(String.fromCharCode(65 + (n % 26)))
    n = Math.floor(n / 26) - 1
    if (n < 0) break
  }
  return letters.join('')
}

export function addNode(state, customName = null) {
  const id = `node_${state.nextId}`
  const name = customName || generateNodeName(state.nextId)

  const newState = cloneState(state)
  newState.nodes.set(id, { id, name })
  newState.parent.set(id, id)
  newState.rank.set(id, 1)

  const pos = findNewNodePosition(newState)
  newState.positions.set(id, pos)
  newState.nextId += 1

  return {
    state: newState,
    nodeId: id,
    nodeName: name,
  }
}

function findNewNodePosition(state) {
  if (state.positions.size === 0) {
    return { x: NODE_RADIUS + 50, y: NODE_RADIUS + 50 }
  }

  let maxX = -Infinity
  for (const [, pos] of state.positions) {
    const right = pos.x + NODE_DIAMETER
    if (right > maxX) {
      maxX = right
    }
  }

  return { x: maxX + TREE_HORIZONTAL_GAP, y: NODE_RADIUS + 50 }
}

export function find(state, nodeId, enablePathCompression = true) {
  const path = []
  let current = nodeId

  while (state.parent.get(current) !== current) {
    path.push(current)
    current = state.parent.get(current)
  }

  const root = current
  const compressedNodes = []

  if (enablePathCompression && path.length > 1) {
    const newState = cloneState(state)
    for (let i = 0; i < path.length - 1; i++) {
      const node = path[i]
      if (newState.parent.get(node) !== root) {
        newState.parent.set(node, root)
        compressedNodes.push(node)
      }
    }
    return {
      state: newState,
      root,
      path: [...path, root],
      compressedNodes,
    }
  }

  return {
    state: cloneState(state),
    root,
    path: [...path, root],
    compressedNodes,
  }
}

export function findNoCompression(state, nodeId) {
  return find(state, nodeId, false)
}

export function union(state, nodeId1, nodeId2) {
  const f1 = findNoCompression(state, nodeId1)
  const f2 = findNoCompression(state, nodeId2)
  const root1 = f1.root
  const root2 = f2.root

  if (root1 === root2) {
    return {
      state: cloneState(state),
      success: false,
      root1,
      root2: root1,
      message: '已在同一集合中，无需合并',
      childRoot: null,
      parentRoot: null,
    }
  }

  const newState = cloneState(state)
  const rank1 = newState.rank.get(root1)
  const rank2 = newState.rank.get(root2)

  let childRoot, parentRoot

  if (rank1 < rank2) {
    newState.parent.set(root1, root2)
    childRoot = root1
    parentRoot = root2
  } else if (rank1 > rank2) {
    newState.parent.set(root2, root1)
    childRoot = root2
    parentRoot = root1
  } else {
    newState.parent.set(root2, root1)
    newState.rank.set(root1, rank1 + 1)
    childRoot = root2
    parentRoot = root1
  }

  const childNode = newState.nodes.get(childRoot)
  const parentNode = newState.nodes.get(parentRoot)

  return {
    state: newState,
    success: true,
    root1,
    root2,
    childRoot,
    parentRoot,
    message: `将 ${childNode.name} 的父节点设置为 ${parentNode.name}`,
  }
}

export function getRoot(state, nodeId) {
  let current = nodeId
  while (state.parent.get(current) !== current) {
    current = state.parent.get(current)
  }
  return current
}

export function getSetMembers(state, rootId) {
  const members = []
  for (const [id] of state.nodes) {
    if (getRoot(state, id) === rootId) {
      members.push(id)
    }
  }
  return members
}

export function getAllSets(state) {
  const sets = new Map()
  for (const [id] of state.nodes) {
    const root = getRoot(state, id)
    if (!sets.has(root)) {
      sets.set(root, [])
    }
    sets.get(root).push(id)
  }
  return sets
}

export function isRoot(state, nodeId) {
  return state.parent.get(nodeId) === nodeId
}

export function getChildren(state, parentId) {
  const children = []
  for (const [id, parent] of state.parent) {
    if (parent === parentId && id !== parentId) {
      children.push(id)
    }
  }
  return children
}

function calculateSubtreeWidth(state, nodeId, visited = new Set()) {
  if (visited.has(nodeId)) return 0
  visited.add(nodeId)

  const children = getChildren(state, nodeId)
  if (children.length === 0) {
    return NODE_DIAMETER
  }

  let totalWidth = 0
  children.forEach((child, idx) => {
    totalWidth += calculateSubtreeWidth(state, child, visited)
    if (idx < children.length - 1) {
      totalWidth += HORIZONTAL_GAP
    }
  })

  return Math.max(NODE_DIAMETER, totalWidth)
}

function layoutTree(state, nodeId, startX, y, positions, visited = new Set()) {
  if (visited.has(nodeId)) return positions
  visited.add(nodeId)

  const children = getChildren(state, nodeId)
  const subtreeWidth = calculateSubtreeWidth(state, nodeId)
  const nodeX = startX + subtreeWidth / 2 - NODE_RADIUS

  positions.set(nodeId, { x: nodeX, y })

  if (children.length === 0) {
    return positions
  }

  let currentX = startX
  const childY = y + NODE_DIAMETER + VERTICAL_GAP

  children.forEach((childId) => {
    const childWidth = calculateSubtreeWidth(state, childId)
    layoutTree(state, childId, currentX, childY, positions, visited)
    currentX += childWidth + HORIZONTAL_GAP
  })

  return positions
}

export function calculateForestLayout(state) {
  const positions = new Map()
  const roots = []
  const visited = new Set()

  for (const [id] of state.nodes) {
    if (isRoot(state, id)) {
      roots.push(id)
    }
  }

  let currentX = NODE_RADIUS + 50
  const startY = NODE_RADIUS + 50

  roots.forEach((rootId) => {
    layoutTree(state, rootId, currentX, startY, positions, visited)
    const subtreeWidth = calculateSubtreeWidth(state, rootId)
    currentX += subtreeWidth + TREE_HORIZONTAL_GAP
  })

  for (const [id, pos] of positions) {
    state.positions.set(id, pos)
  }

  return cloneState(state)
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

export function createOperationLog(type, params, result, duration, timestamp = Date.now()) {
  return {
    id: `op_${timestamp}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    params,
    result,
    duration,
    timestamp,
  }
}

export function randomDuration() {
  return Math.floor(Math.random() * 5) + 1
}

export function formatTimestamp(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

export function exportLogsToJson(logs) {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    logs: logs.map((log) => ({
      ...log,
      typeLabel: OPERATION_TYPE[log.type] ? Object.keys(OPERATION_TYPE).find((k) => OPERATION_TYPE[k] === log.type) : log.type,
    })),
  }
}

export function downloadJson(data, filename = 'union-find-logs.json') {
  if (typeof window === 'undefined' || !window.document) return false
  try {
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

export function getNodeById(state, nodeId) {
  return state.nodes.get(nodeId) || null
}

export function getParentOf(state, nodeId) {
  return state.parent.get(nodeId)
}

export function getAllNodeIds(state) {
  return Array.from(state.nodes.keys())
}

export function hasNode(state, nodeId) {
  return state.nodes.has(nodeId)
}

export function getNodeCount(state) {
  return state.nodes.size
}

export function getSetCount(state) {
  return getAllSets(state).size
}
