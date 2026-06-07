export const NODE_TYPES = {
  START: 'start',
  END: 'end',
  TASK: 'task',
  CONDITION: 'condition',
  PARALLEL: 'parallel',
}

export const NODE_TYPE_LABELS = {
  [NODE_TYPES.START]: '开始节点',
  [NODE_TYPES.END]: '结束节点',
  [NODE_TYPES.TASK]: '任务节点',
  [NODE_TYPES.CONDITION]: '条件分支',
  [NODE_TYPES.PARALLEL]: '并行网关',
}

export const NODE_TYPE_ICONS = {
  [NODE_TYPES.START]: '▶',
  [NODE_TYPES.END]: '■',
  [NODE_TYPES.TASK]: '📋',
  [NODE_TYPES.CONDITION]: '◇',
  [NODE_TYPES.PARALLEL]: '⋈',
}

export const NODE_WIDTH = 140
export const NODE_HEIGHT = 60

const STORAGE_KEY = 'workflow-orchestrator-state'
let idCounter = 0

export function generateId(prefix = 'node') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createNode(type, x = 100, y = 100) {
  const base = {
    id: generateId('node'),
    type,
    x,
    y,
    label: NODE_TYPE_LABELS[type],
  }

  switch (type) {
    case NODE_TYPES.START:
      return { ...base, label: '开始' }
    case NODE_TYPES.END:
      return { ...base, label: '结束' }
    case NODE_TYPES.TASK:
      return { ...base, label: '任务节点', assignee: '' }
    case NODE_TYPES.CONDITION:
      return { ...base, label: '条件判断', expression: '' }
    case NODE_TYPES.PARALLEL:
      return { ...base, label: '并行网关' }
    default:
      return base
  }
}

export function createEdge(sourceId, targetId) {
  return {
    id: generateId('edge'),
    source: sourceId,
    target: targetId,
  }
}

export function updateNode(nodes, nodeId, updates) {
  if (!Array.isArray(nodes)) return []
  return nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
}

export function deleteNode(nodes, nodeId) {
  if (!Array.isArray(nodes)) return []
  return nodes.filter((n) => n.id !== nodeId)
}

export function deleteEdgesByNodeId(edges, nodeId) {
  if (!Array.isArray(edges)) return []
  return edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
}

export function updateEdge(edges, edgeId, updates) {
  if (!Array.isArray(edges)) return []
  return edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e))
}

export function deleteEdge(edges, edgeId) {
  if (!Array.isArray(edges)) return []
  return edges.filter((e) => e.id !== edgeId)
}

export function hasStartNode(nodes) {
  if (!Array.isArray(nodes)) return false
  return nodes.some((n) => n.type === NODE_TYPES.START)
}

export function hasEndNode(nodes) {
  if (!Array.isArray(nodes)) return false
  return nodes.some((n) => n.type === NODE_TYPES.END)
}

export function getNodeById(nodes, nodeId) {
  if (!Array.isArray(nodes)) return null
  return nodes.find((n) => n.id === nodeId) || null
}

export function getOutgoingEdges(edges, nodeId) {
  if (!Array.isArray(edges)) return []
  return edges.filter((e) => e.source === nodeId)
}

export function getIncomingEdges(edges, nodeId) {
  if (!Array.isArray(edges)) return []
  return edges.filter((e) => e.target === nodeId)
}

export function getOutputAnchor(node) {
  if (!node) return { x: 0, y: 0 }
  return {
    x: node.x + NODE_WIDTH,
    y: node.y + NODE_HEIGHT / 2,
  }
}

export function getInputAnchor(node) {
  if (!node) return { x: 0, y: 0 }
  return {
    x: node.x,
    y: node.y + NODE_HEIGHT / 2,
  }
}

export function buildBezierPath(from, to) {
  const dx = Math.max(Math.abs(to.x - from.x) * 0.5, 40)
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
}

export function loadFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { nodes: [], edges: [] }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { nodes: [], edges: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return { nodes: [], edges: [] }
    }
    return parsed
  } catch {
    return { nodes: [], edges: [] }
  }
}

export function saveToStorage(state) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }
  try {
    const toSave = {
      nodes: state.nodes || [],
      edges: state.edges || [],
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    return true
  } catch {
    return false
  }
}

export function clearStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function exportToJson(state) {
  return {
    version: '1.0',
    nodes: state.nodes || [],
    edges: state.edges || [],
    exportedAt: new Date().toISOString(),
  }
}

export function downloadJson(state, filename = 'workflow.json') {
  if (typeof window === 'undefined' || !window.document) {
    return false
  }
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
    return { valid: false, error: '无效的 JSON 数据' }
  }
  if (!Array.isArray(jsonData.nodes)) {
    return { valid: false, error: '缺少 nodes 数组' }
  }
  if (!Array.isArray(jsonData.edges)) {
    return { valid: false, error: '缺少 edges 数组' }
  }

  const validNodeTypes = Object.values(NODE_TYPES)
  for (const node of jsonData.nodes) {
    if (!node || typeof node !== 'object') {
      return { valid: false, error: '存在无效的节点' }
    }
    if (!node.id || typeof node.id !== 'string') {
      return { valid: false, error: '节点缺少有效的 id' }
    }
    if (!validNodeTypes.includes(node.type)) {
      return { valid: false, error: `节点 ${node.id} 类型无效: ${node.type}` }
    }
    if (typeof node.x !== 'number' || typeof node.y !== 'number') {
      return { valid: false, error: `节点 ${node.id} 缺少坐标` }
    }
  }

  const nodeIds = new Set(jsonData.nodes.map((n) => n.id))
  for (const edge of jsonData.edges) {
    if (!edge || typeof edge !== 'object') {
      return { valid: false, error: '存在无效的连线' }
    }
    if (!nodeIds.has(edge.source)) {
      return { valid: false, error: `连线引用了不存在的源节点: ${edge.source}` }
    }
    if (!nodeIds.has(edge.target)) {
      return { valid: false, error: `连线引用了不存在的目标节点: ${edge.target}` }
    }
  }

  return {
    valid: true,
    data: {
      nodes: jsonData.nodes,
      edges: jsonData.edges,
    },
  }
}

export function simulateExecution(nodes, edges, randomFn = Math.random) {
  const visitedNodeIds = []
  const visitedEdgeIds = []
  const path = []

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return { visitedNodeIds, visitedEdgeIds, path, error: '没有节点' }
  }

  const startNode = nodes.find((n) => n.type === NODE_TYPES.START)
  if (!startNode) {
    return { visitedNodeIds, visitedEdgeIds, path, error: '缺少开始节点' }
  }

  const visited = new Set()
  let currentNodeId = startNode.id
  let maxSteps = nodes.length * 3 + edges.length + 10
  let steps = 0

  while (currentNodeId && steps < maxSteps) {
    steps++
    if (visited.has(currentNodeId)) {
      path.push({ type: 'loop', nodeId: currentNodeId })
      break
    }
    visited.add(currentNodeId)
    visitedNodeIds.push(currentNodeId)
    path.push({ type: 'node', nodeId: currentNodeId })

    const currentNode = getNodeById(nodes, currentNodeId)
    if (!currentNode || currentNode.type === NODE_TYPES.END) {
      break
    }

    const outEdges = getOutgoingEdges(edges, currentNodeId)
    if (outEdges.length === 0) {
      path.push({ type: 'dead-end', nodeId: currentNodeId })
      break
    }

    let nextEdge
    if (currentNode.type === NODE_TYPES.CONDITION && outEdges.length > 1) {
      const idx = Math.floor(randomFn() * outEdges.length)
      nextEdge = outEdges[idx]
    } else if (currentNode.type === NODE_TYPES.PARALLEL) {
      for (const edge of outEdges) {
        visitedEdgeIds.push(edge.id)
        path.push({ type: 'edge', edgeId: edge.id })
      }
      const firstEdge = outEdges[0]
      currentNodeId = firstEdge.target
      continue
    } else {
      nextEdge = outEdges[0]
    }

    if (nextEdge) {
      visitedEdgeIds.push(nextEdge.id)
      path.push({ type: 'edge', edgeId: nextEdge.id })
      currentNodeId = nextEdge.target
    } else {
      break
    }
  }

  return { visitedNodeIds, visitedEdgeIds, path, error: null }
}
