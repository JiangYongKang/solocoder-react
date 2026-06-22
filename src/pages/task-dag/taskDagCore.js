export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 3
export const NODE_WIDTH = 160
export const NODE_HEIGHT = 60
export const NODE_VERTICAL_GAP = 80
export const NODE_HORIZONTAL_GAP = 120

const STORAGE_KEY = 'task-dag-state'
let idCounter = 0

export function generateId(prefix = 'id') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createNode(name = '新任务', x = 200, y = 200) {
  return {
    id: generateId('node'),
    name: name.trim() || '新任务',
    x,
    y,
  }
}

export function updateNode(nodes, nodeId, updates) {
  if (!Array.isArray(nodes)) return []
  return nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
}

export function deleteNode(nodes, edges, nodeId) {
  if (!Array.isArray(nodes)) return { nodes: [], edges: [] }
  const newNodes = nodes.filter((n) => n.id !== nodeId)
  const newEdges = Array.isArray(edges)
    ? edges.filter((e) => e.from !== nodeId && e.to !== nodeId)
    : []
  return { nodes: newNodes, edges: newEdges }
}

export function getNodeById(nodes, nodeId) {
  if (!Array.isArray(nodes)) return null
  return nodes.find((n) => n.id === nodeId) || null
}

export function createEdge(from, to) {
  return {
    id: generateId('edge'),
    from,
    to,
  }
}

export function deleteEdge(edges, edgeId) {
  if (!Array.isArray(edges)) return []
  return edges.filter((e) => e.id !== edgeId)
}

export function deleteEdgesByNodeId(edges, nodeId) {
  if (!Array.isArray(edges)) return []
  return edges.filter((e) => e.from !== nodeId && e.to !== nodeId)
}

export function getEdgeById(edges, edgeId) {
  if (!Array.isArray(edges)) return null
  return edges.find((e) => e.id === edgeId) || null
}

export function hasCycle(nodes, edges) {
  if (!Array.isArray(nodes) || nodes.length === 0) return false
  if (!Array.isArray(edges) || edges.length === 0) return false

  const adj = new Map()
  nodes.forEach((n) => adj.set(n.id, []))
  edges.forEach((e) => {
    if (adj.has(e.from) && adj.has(e.to)) {
      adj.get(e.from).push(e.to)
    }
  })

  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map()
  nodes.forEach((n) => color.set(n.id, WHITE))

  function dfs(nodeId) {
    color.set(nodeId, GRAY)
    const neighbors = adj.get(nodeId) || []
    for (const neighbor of neighbors) {
      const c = color.get(neighbor)
      if (c === GRAY) return true
      if (c === WHITE && dfs(neighbor)) return true
    }
    color.set(nodeId, BLACK)
    return false
  }

  for (const node of nodes) {
    if (color.get(node.id) === WHITE) {
      if (dfs(node.id)) return true
    }
  }
  return false
}

export function validateEdge(nodes, edges, from, to) {
  if (!from || !to) {
    return { valid: false, error: '缺少节点参数' }
  }
  if (from === to) {
    return { valid: false, error: '不能连接到自身' }
  }
  const fromNode = getNodeById(nodes, from)
  const toNode = getNodeById(nodes, to)
  if (!fromNode || !toNode) {
    return { valid: false, error: '节点不存在' }
  }
  const exists = edges.some((e) => e.from === from && e.to === to)
  if (exists) {
    return { valid: false, error: '依赖关系已存在' }
  }
  const testEdges = [...edges, { from, to }]
  if (hasCycle(nodes, testEdges)) {
    return { valid: false, error: '该连线会形成环路，违反有向无环图约束' }
  }
  return { valid: true }
}

export function topologicalSort(nodes, edges) {
  if (!Array.isArray(nodes) || nodes.length === 0) return []
  if (!Array.isArray(edges)) edges = []

  const inDegree = new Map()
  const adj = new Map()
  nodes.forEach((n) => {
    inDegree.set(n.id, 0)
    adj.set(n.id, [])
  })
  edges.forEach((e) => {
    if (adj.has(e.from) && adj.has(e.to)) {
      adj.get(e.from).push(e.to)
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1)
    }
  })

  const queue = []
  nodes.forEach((n) => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id)
    }
  })

  const result = []
  while (queue.length > 0) {
    const nodeId = queue.shift()
    result.push(nodeId)
    const neighbors = adj.get(nodeId) || []
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) {
        queue.push(neighbor)
      }
    }
  }

  if (result.length !== nodes.length) {
    return []
  }

  const nodeMap = new Map()
  nodes.forEach((n) => nodeMap.set(n.id, n))
  return result.map((id) => nodeMap.get(id)).filter(Boolean)
}

export function findStartNodes(nodes, edges) {
  if (!Array.isArray(nodes) || nodes.length === 0) return []
  if (!Array.isArray(edges)) edges = []

  const hasIncoming = new Set()
  edges.forEach((e) => hasIncoming.add(e.to))
  return nodes.filter((n) => !hasIncoming.has(n.id))
}

export function findEndNodes(nodes, edges) {
  if (!Array.isArray(nodes) || nodes.length === 0) return []
  if (!Array.isArray(edges)) edges = []

  const hasOutgoing = new Set()
  edges.forEach((e) => hasOutgoing.add(e.from))
  return nodes.filter((n) => !hasOutgoing.has(n.id))
}

export function criticalPath(nodes, edges) {
  const sorted = topologicalSort(nodes, edges)
  if (sorted.length === 0) return { nodes: [], edges: [] }

  const adj = new Map()
  const edgeMap = new Map()
  nodes.forEach((n) => adj.set(n.id, []))
  edges.forEach((e) => {
    if (adj.has(e.from)) {
      adj.get(e.from).push(e.to)
      edgeMap.set(`${e.from}-${e.to}`, e.id)
    }
  })

  const dist = new Map()
  const prev = new Map()
  nodes.forEach((n) => {
    dist.set(n.id, 1)
    prev.set(n.id, null)
  })

  for (const node of sorted) {
    const neighbors = adj.get(node.id) || []
    for (const neighbor of neighbors) {
      const newDist = dist.get(node.id) + 1
      if (newDist > (dist.get(neighbor) || 0)) {
        dist.set(neighbor, newDist)
        prev.set(neighbor, node.id)
      }
    }
  }

  let endId = null
  let maxDist = 0
  nodes.forEach((n) => {
    const d = dist.get(n.id) || 0
    if (d > maxDist) {
      maxDist = d
      endId = n.id
    }
  })

  if (endId === null) return { nodes: [], edges: [] }

  const pathNodeIds = []
  let current = endId
  while (current !== null) {
    pathNodeIds.unshift(current)
    current = prev.get(current)
  }

  const pathEdgeIds = []
  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const edgeId = edgeMap.get(`${pathNodeIds[i]}-${pathNodeIds[i + 1]}`)
    if (edgeId) pathEdgeIds.push(edgeId)
  }

  return {
    nodes: pathNodeIds,
    edges: pathEdgeIds,
    length: maxDist,
  }
}

export function autoLayout(nodes, edges) {
  if (!Array.isArray(nodes) || nodes.length === 0) return []
  if (!Array.isArray(edges)) edges = []

  const sorted = topologicalSort(nodes, edges)
  if (sorted.length === 0) {
    return nodes.map((n, i) => ({
      ...n,
      x: 100 + (i % 3) * NODE_HORIZONTAL_GAP,
      y: 100 + Math.floor(i / 3) * NODE_VERTICAL_GAP,
    }))
  }

  const inDegree = new Map()
  const adj = new Map()
  const level = new Map()
  nodes.forEach((n) => {
    inDegree.set(n.id, 0)
    adj.set(n.id, [])
    level.set(n.id, 0)
  })
  edges.forEach((e) => {
    if (adj.has(e.from) && adj.has(e.to)) {
      adj.get(e.from).push(e.to)
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1)
    }
  })

  const queue = []
  nodes.forEach((n) => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id)
      level.set(n.id, 0)
    }
  })

  while (queue.length > 0) {
    const nodeId = queue.shift()
    const neighbors = adj.get(nodeId) || []
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, newDegree)
      level.set(neighbor, Math.max(level.get(neighbor) || 0, (level.get(nodeId) || 0) + 1))
      if (newDegree === 0) {
        queue.push(neighbor)
      }
    }
  }

  const levelMap = new Map()
  sorted.forEach((n) => {
    const l = level.get(n.id) || 0
    if (!levelMap.has(l)) levelMap.set(l, [])
    levelMap.get(l).push(n.id)
  })

  const nodeMap = new Map()
  nodes.forEach((n) => nodeMap.set(n.id, n))

  const result = []
  for (const [lvl, nodeIds] of levelMap) {
    const startY = 100
    nodeIds.forEach((id, idx) => {
      const node = nodeMap.get(id)
      if (node) {
        result.push({
          ...node,
          x: 100 + lvl * (NODE_WIDTH + NODE_HORIZONTAL_GAP),
          y: startY + idx * NODE_VERTICAL_GAP,
        })
      }
    })
  }

  const originalIds = new Set(nodes.map((n) => n.id))
  result.forEach((n) => originalIds.delete(n.id))
  if (originalIds.size > 0) {
    const remaining = nodes.filter((n) => originalIds.has(n.id))
    remaining.forEach((n, idx) => {
      result.push({
        ...n,
        x: 100,
        y: 100 + (sorted.length + idx) * NODE_VERTICAL_GAP,
      })
    })
  }

  return result
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

export function getNodePort(node, port) {
  if (!node) return { x: 0, y: 0 }
  const centerY = node.y + NODE_HEIGHT / 2
  if (port === 'output') {
    return { x: node.x + NODE_WIDTH, y: centerY }
  }
  if (port === 'input') {
    return { x: node.x, y: centerY }
  }
  return { x: node.x + NODE_WIDTH / 2, y: centerY }
}

export function buildBezierPath(from, to) {
  const dx = Math.max(Math.abs(to.x - from.x) * 0.5, 50)
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
}

export function fitToView(nodes, containerWidth, containerHeight, padding = 80) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return { panX: containerWidth / 2, panY: containerHeight / 2, zoom: 1 }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  nodes.forEach((n) => {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + NODE_WIDTH)
    maxY = Math.max(maxY, n.y + NODE_HEIGHT)
  })

  const contentWidth = maxX - minX
  const contentHeight = maxY - minY

  const availableWidth = containerWidth - padding * 2
  const availableHeight = containerHeight - padding * 2

  const scaleX = availableWidth / contentWidth
  const scaleY = availableHeight / contentHeight
  const zoom = clampZoom(Math.min(scaleX, scaleY, 1))

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const panX = containerWidth / 2 - centerX * zoom
  const panY = containerHeight / 2 - centerY * zoom

  return { panX, panY, zoom }
}

export function safeGetItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null || raw === undefined) {
      return { nodes: [], edges: [] }
    }
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      return { nodes: [], edges: [], error: '存储数据已损坏，已重置为空图' }
    }
    if (!data || typeof data !== 'object') {
      return { nodes: [], edges: [], error: '存储数据格式无效，已重置为空图' }
    }
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      return { nodes: [], edges: [], error: '存储数据格式无效，已重置为空图' }
    }
    return { nodes: data.nodes, edges: data.edges }
  } catch {
    return { nodes: [], edges: [], error: '读取本地存储失败，已重置为空图' }
  }
}

export function saveToStorage(nodes, edges) {
  return safeSetItem(STORAGE_KEY, { nodes, edges })
}

export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return { success: true }
  } catch (err) {
    return { success: false, error: err?.message || '清除失败' }
  }
}

export function exportToJson(nodes, edges) {
  return {
    version: '1.0',
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.name,
      x: n.x,
      y: n.y,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
    })),
  }
}

export function downloadJson(nodes, edges, filename) {
  try {
    const data = exportToJson(nodes, edges)
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `task-dag-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return { success: true }
  } catch (err) {
    return { success: false, error: err?.message || '导出失败' }
  }
}

export function importFromJson(json) {
  try {
    if (!json || typeof json !== 'object') {
      return { valid: false, error: '无效的 JSON 数据' }
    }
    if (!Array.isArray(json.nodes)) {
      return { valid: false, error: '缺少 nodes 数组' }
    }
    if (!Array.isArray(json.edges)) {
      return { valid: false, error: '缺少 edges 数组' }
    }

    const validNodes = []
    for (const n of json.nodes) {
      if (!n.id || typeof n.id !== 'string') {
        return { valid: false, error: '节点 id 无效' }
      }
      if (typeof n.name !== 'string') {
        return { valid: false, error: '节点 name 无效' }
      }
      if (typeof n.x !== 'number' || typeof n.y !== 'number') {
        return { valid: false, error: '节点坐标无效' }
      }
      validNodes.push({
        id: n.id,
        name: n.name,
        x: n.x,
        y: n.y,
      })
    }

    const validEdges = []
    for (const e of json.edges) {
      if (!e.id || typeof e.id !== 'string') {
        return { valid: false, error: '边 id 无效' }
      }
      if (!e.from || typeof e.from !== 'string') {
        return { valid: false, error: '边 from 无效' }
      }
      if (!e.to || typeof e.to !== 'string') {
        return { valid: false, error: '边 to 无效' }
      }
      const nodeIds = new Set(validNodes.map((n) => n.id))
      if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) {
        return { valid: false, error: '边引用不存在的节点' }
      }
      validEdges.push({
        id: e.id,
        from: e.from,
        to: e.to,
      })
    }

    if (hasCycle(validNodes, validEdges)) {
      return { valid: false, error: '导入的图包含环路' }
    }

    return {
      valid: true,
      data: { nodes: validNodes, edges: validEdges },
    }
  } catch (err) {
    return { valid: false, error: err?.message || '解析失败' }
  }
}
