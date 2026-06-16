import {
  DEVICE_TYPES,
  DEVICE_TYPE_DEFAULT_NAMES,
  NODE_WIDTH,
  NODE_HEIGHT,
  PORT_RADIUS,
  MIN_ZOOM,
  MAX_ZOOM,
  LINE_STYLES,
  LINE_CURVE_STYLES,
  DEFAULT_LINE_WIDTH,
  LAYOUT_DIRECTION,
  STORAGE_KEY,
  DATA_VERSION,
} from './constants.js'

let idCounter = 0

export function generateId(prefix = 'id') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createDeviceNode(type, x = 100, y = 100, customName = null) {
  if (!Object.values(DEVICE_TYPES).includes(type)) {
    return null
  }
  const defaultName = customName || DEVICE_TYPE_DEFAULT_NAMES[type] || '设备'
  return {
    id: generateId('node'),
    type,
    name: defaultName,
    x,
    y,
  }
}

export function createLink(fromNodeId, fromPort, toNodeId, toPort) {
  return {
    id: generateId('link'),
    fromNodeId,
    fromPort,
    toNodeId,
    toPort,
    style: LINE_STYLES.SOLID,
    curveStyle: LINE_CURVE_STYLES.BEZIER,
    width: DEFAULT_LINE_WIDTH,
    label: '',
  }
}

export function getNodeById(nodes, nodeId) {
  if (!Array.isArray(nodes)) return null
  return nodes.find((n) => n.id === nodeId) || null
}

export function getLinkById(links, linkId) {
  if (!Array.isArray(links)) return null
  return links.find((l) => l.id === linkId) || null
}

export function updateNode(nodes, nodeId, updates) {
  if (!Array.isArray(nodes)) return []
  return nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
}

export function deleteNode(nodes, nodeId) {
  if (!Array.isArray(nodes)) return []
  return nodes.filter((n) => n.id !== nodeId)
}

export function updateLink(links, linkId, updates) {
  if (!Array.isArray(links)) return []
  return links.map((l) => (l.id === linkId ? { ...l, ...updates } : l))
}

export function deleteLink(links, linkId) {
  if (!Array.isArray(links)) return []
  return links.filter((l) => l.id !== linkId)
}

export function deleteLinksByNodeId(links, nodeId) {
  if (!Array.isArray(links)) return []
  return links.filter((l) => l.fromNodeId !== nodeId && l.toNodeId !== nodeId)
}

export function getLinksByNodeId(links, nodeId) {
  if (!Array.isArray(links)) return []
  return links.filter((l) => l.fromNodeId === nodeId || l.toNodeId === nodeId)
}

export function validateLinkCreation(nodes, links, fromNodeId, fromPort, toNodeId, toPort) {
  if (!fromNodeId || !toNodeId) {
    return { valid: false, error: '缺少节点 ID' }
  }
  if (fromNodeId === toNodeId) {
    return { valid: false, error: '不能连接同一设备' }
  }
  if (!fromPort || !toPort) {
    return { valid: false, error: '缺少端口信息' }
  }
  const fromNode = getNodeById(nodes, fromNodeId)
  const toNode = getNodeById(nodes, toNodeId)
  if (!fromNode || !toNode) {
    return { valid: false, error: '节点不存在' }
  }
  const exists = links.some(
    (l) =>
      (l.fromNodeId === fromNodeId && l.fromPort === fromPort && l.toNodeId === toNodeId && l.toPort === toPort) ||
      (l.fromNodeId === toNodeId && l.fromPort === toPort && l.toNodeId === fromNodeId && l.toPort === fromPort)
  )
  if (exists) {
    return { valid: false, error: '连接已存在' }
  }
  return { valid: true }
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

export function getNodePorts(node) {
  if (!node) return {}
  const cx = node.x + NODE_WIDTH / 2
  const cy = node.y + NODE_HEIGHT / 2
  return {
    top: { x: cx, y: node.y },
    bottom: { x: cx, y: node.y + NODE_HEIGHT },
    left: { x: node.x, y: cy },
    right: { x: node.x + NODE_WIDTH, y: cy },
  }
}

export function getPortPosition(node, portName) {
  const ports = getNodePorts(node)
  return ports[portName] || { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT / 2 }
}

export function getLinkPath(link, nodes) {
  const fromNode = getNodeById(nodes, link.fromNodeId)
  const toNode = getNodeById(nodes, link.toNodeId)
  if (!fromNode || !toNode) return ''

  const from = getPortPosition(fromNode, link.fromPort)
  const to = getPortPosition(toNode, link.toPort)

  const curveStyle = link.curveStyle || LINE_CURVE_STYLES.BEZIER
  if (curveStyle === LINE_CURVE_STYLES.STRAIGHT) {
    return buildDirectPath(from, to)
  }
  return buildBezierPath(from, to, link.fromPort, link.toPort)
}

export function buildBezierPath(from, to, fromPort = null, toPort = null) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const controlLength = dist * 0.5

  let c1x = from.x
  let c1y = from.y
  let c2x = to.x
  let c2y = to.y

  if (fromPort && toPort) {
    if (fromPort === 'left') {
      c1x = from.x - controlLength
      c1y = from.y
    } else if (fromPort === 'right') {
      c1x = from.x + controlLength
      c1y = from.y
    } else if (fromPort === 'top') {
      c1x = from.x
      c1y = from.y - controlLength
    } else if (fromPort === 'bottom') {
      c1x = from.x
      c1y = from.y + controlLength
    }

    if (toPort === 'left') {
      c2x = to.x - controlLength
      c2y = to.y
    } else if (toPort === 'right') {
      c2x = to.x + controlLength
      c2y = to.y
    } else if (toPort === 'top') {
      c2x = to.x
      c2y = to.y - controlLength
    } else if (toPort === 'bottom') {
      c2x = to.x
      c2y = to.y + controlLength
    }
  } else {
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx >= absDy) {
      c1x = from.x + controlLength * Math.sign(dx || 1)
      c1y = from.y
      c2x = to.x - controlLength * Math.sign(dx || 1)
      c2y = to.y
    } else {
      c1x = from.x
      c1y = from.y + controlLength * Math.sign(dy || 1)
      c2x = to.x
      c2y = to.y - controlLength * Math.sign(dy || 1)
    }
  }

  return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`
}

export function buildDirectPath(from, to) {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
}

export function getLinkMidpoint(link, nodes) {
  const fromNode = getNodeById(nodes, link.fromNodeId)
  const toNode = getNodeById(nodes, link.toNodeId)
  if (!fromNode || !toNode) return { x: 0, y: 0 }

  const from = getPortPosition(fromNode, link.fromPort)
  const to = getPortPosition(toNode, link.toPort)
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  }
}

export function autoLayout(nodes, links, direction = LAYOUT_DIRECTION.VERTICAL, startX = 100, startY = 100) {
  if (!Array.isArray(nodes) || nodes.length === 0) return nodes

  const inDegree = new Map()
  const graph = new Map()
  nodes.forEach((n) => {
    inDegree.set(n.id, 0)
    graph.set(n.id, [])
  })

  links.forEach((l) => {
    if (graph.has(l.fromNodeId) && inDegree.has(l.toNodeId)) {
      graph.get(l.fromNodeId).push(l.toNodeId)
      inDegree.set(l.toNodeId, (inDegree.get(l.toNodeId) || 0) + 1)
    }
  })

  const levels = []
  const visited = new Set()
  const remaining = new Set(nodes.map((n) => n.id))

  while (remaining.size > 0) {
    const currentLevel = []
    remaining.forEach((id) => {
      if ((inDegree.get(id) || 0) === 0) {
        currentLevel.push(id)
      }
    })

    if (currentLevel.length === 0) {
      currentLevel.push(...remaining)
    }

    levels.push(currentLevel)
    currentLevel.forEach((id) => {
      visited.add(id)
      remaining.delete(id)
      const outs = graph.get(id) || []
      outs.forEach((outId) => {
        if (inDegree.has(outId)) {
          inDegree.set(outId, (inDegree.get(outId) || 0) - 1)
        }
      })
    })
  }

  const gapX = 80
  const gapY = 60
  const newNodes = nodes.map((n) => ({ ...n }))
  const nodeMap = new Map()
  newNodes.forEach((n) => nodeMap.set(n.id, n))

  if (direction === LAYOUT_DIRECTION.VERTICAL) {
    let currentY = startY
    levels.forEach((level) => {
      const levelWidth = level.length * NODE_WIDTH + (level.length - 1) * gapX
      const levelStartX = startX - levelWidth / 2 + NODE_WIDTH / 2
      level.forEach((nodeId, idx) => {
        const node = nodeMap.get(nodeId)
        if (node) {
          node.x = levelStartX + idx * (NODE_WIDTH + gapX) - NODE_WIDTH / 2
          node.y = currentY
        }
      })
      currentY += NODE_HEIGHT + gapY
    })
  } else {
    let currentX = startX
    levels.forEach((level) => {
      const levelHeight = level.length * NODE_HEIGHT + (level.length - 1) * gapY
      const levelStartY = startY - levelHeight / 2 + NODE_HEIGHT / 2
      level.forEach((nodeId, idx) => {
        const node = nodeMap.get(nodeId)
        if (node) {
          node.x = currentX
          node.y = levelStartY + idx * (NODE_HEIGHT + gapY) - NODE_HEIGHT / 2
        }
      })
      currentX += NODE_WIDTH + gapX
    })
  }

  return newNodes
}

export function forceDirectedLayout(nodes, links, iterations = 100, width = 800, height = 600) {
  if (!Array.isArray(nodes) || nodes.length === 0) return nodes

  const newNodes = nodes.map((n) => ({ ...n }))
  const nodeMap = new Map()
  newNodes.forEach((n) => {
    nodeMap.set(n.id, n)
    if (n.x === undefined || n.y === undefined) {
      n.x = width / 2 + (Math.random() - 0.5) * 100
      n.y = height / 2 + (Math.random() - 0.5) * 100
    }
  })

  const repulsion = 5000
  const attraction = 0.005
  const damping = 0.85
  const centerGravity = 0.01

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map()
    newNodes.forEach((n) => forces.set(n.id, { fx: 0, fy: 0 }))

    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const a = newNodes[i]
        const b = newNodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 1) dist = 1
        const force = repulsion / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        forces.get(a.id).fx -= fx
        forces.get(a.id).fy -= fy
        forces.get(b.id).fx += fx
        forces.get(b.id).fy += fy
      }
    }

    links.forEach((l) => {
      const a = nodeMap.get(l.fromNodeId)
      const b = nodeMap.get(l.toNodeId)
      if (!a || !b) return
      const dx = b.x - a.x
      const dy = b.y - a.y
      let dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 1) dist = 1
      const force = (dist - 150) * attraction
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      forces.get(a.id).fx += fx
      forces.get(a.id).fy += fy
      forces.get(b.id).fx -= fx
      forces.get(b.id).fy -= fy
    })

    const cx = width / 2
    const cy = height / 2
    newNodes.forEach((n) => {
      const f = forces.get(n.id)
      f.fx += (cx - n.x) * centerGravity
      f.fy += (cy - n.y) * centerGravity
    })

    newNodes.forEach((n) => {
      const f = forces.get(n.id)
      const temp = 1 - iter / iterations
      n.x += f.fx * damping * temp
      n.y += f.fy * damping * temp
    })
  }

  return newNodes
}

export function fitToView(nodes, containerWidth, containerHeight, padding = 80) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return { panX: containerWidth / 2, panY: containerHeight / 2, zoom: 1 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((n) => {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + NODE_WIDTH)
    maxY = Math.max(maxY, n.y + NODE_HEIGHT)
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

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { nodes: [], links: [], error: 'localStorage 不可用' }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { nodes: [], links: [], error: null }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.links)) {
      return { nodes: [], links: [], error: '存储数据格式损坏' }
    }
    return { nodes: parsed.nodes, links: parsed.links, error: null }
  } catch (e) {
    const msg = e?.message ? `: ${e.message}` : ''
    return { nodes: [], links: [], error: `读取存储数据失败${msg}` }
  }
}

export function saveToStorage(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { success: false, error: 'localStorage 不可用' }
  try {
    const toSave = {
      nodes: state.nodes || [],
      links: state.links || [],
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    return { success: true, error: null }
  } catch (e) {
    const msg = e?.message ? `: ${e.message}` : ''
    return { success: false, error: `保存数据失败${msg}` }
  }
}

export function clearStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { success: false, error: 'localStorage 不可用' }
  try {
    storage.removeItem(STORAGE_KEY)
    return { success: true, error: null }
  } catch (e) {
    const msg = e?.message ? `: ${e.message}` : ''
    return { success: false, error: `清除存储失败${msg}` }
  }
}

export function exportToJson(state) {
  return {
    version: DATA_VERSION,
    nodes: state.nodes || [],
    links: state.links || [],
    exportedAt: new Date().toISOString(),
  }
}

export function downloadJson(state, filename = 'network-topology.json') {
  if (typeof window === 'undefined' || !window.document) {
    return { success: false, error: '当前环境不支持文件下载' }
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
    return { success: true, error: null }
  } catch (e) {
    const msg = e?.message ? `: ${e.message}` : ''
    return { success: false, error: `文件下载失败${msg}` }
  }
}

export function importFromJson(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    return { valid: false, error: '无效的 JSON 数据' }
  }
  if (!Array.isArray(jsonData.nodes)) {
    return { valid: false, error: '缺少 nodes 数组' }
  }
  if (!Array.isArray(jsonData.links)) {
    return { valid: false, error: '缺少 links 数组' }
  }

  const validTypes = Object.values(DEVICE_TYPES)
  const validLineStyles = Object.values(LINE_STYLES)
  const validCurveStyles = Object.values(LINE_CURVE_STYLES)
  const validPorts = ['top', 'bottom', 'left', 'right']

  for (const node of jsonData.nodes) {
    if (!node || typeof node !== 'object') {
      return { valid: false, error: '存在无效的节点' }
    }
    if (!node.id || typeof node.id !== 'string') {
      return { valid: false, error: '节点缺少有效的 id' }
    }
    if (!node.type || typeof node.type !== 'string') {
      return { valid: false, error: `节点 ${node.id} 缺少有效的 type` }
    }
    if (!validTypes.includes(node.type)) {
      return { valid: false, error: `节点 ${node.id} 类型无效: ${node.type}` }
    }
    if (!node.name || typeof node.name !== 'string') {
      return { valid: false, error: `节点 ${node.id} 缺少有效的 name` }
    }
    if (typeof node.x !== 'number' || typeof node.y !== 'number') {
      return { valid: false, error: `节点 ${node.id} 缺少坐标` }
    }
  }

  const nodeIds = new Set(jsonData.nodes.map((n) => n.id))

  for (const link of jsonData.links) {
    if (!link || typeof link !== 'object') {
      return { valid: false, error: '存在无效的连线' }
    }
    if (!link.id || typeof link.id !== 'string') {
      return { valid: false, error: '连线缺少有效的 id' }
    }
    if (!nodeIds.has(link.fromNodeId)) {
      return { valid: false, error: `连线 ${link.id} 引用了不存在的源节点: ${link.fromNodeId}` }
    }
    if (!nodeIds.has(link.toNodeId)) {
      return { valid: false, error: `连线 ${link.id} 引用了不存在的目标节点: ${link.toNodeId}` }
    }
    if (!validPorts.includes(link.fromPort)) {
      return { valid: false, error: `连线 ${link.id} 源端口无效: ${link.fromPort}` }
    }
    if (!validPorts.includes(link.toPort)) {
      return { valid: false, error: `连线 ${link.id} 目标端口无效: ${link.toPort}` }
    }
    if (typeof link.style === 'string' && !validLineStyles.includes(link.style)) {
      return { valid: false, error: `连线 ${link.id} 线型无效: ${link.style}` }
    }
    if (typeof link.curveStyle === 'string' && !validCurveStyles.includes(link.curveStyle)) {
      return { valid: false, error: `连线 ${link.id} 曲线类型无效: ${link.curveStyle}` }
    }
    if (link.width !== undefined && (typeof link.width !== 'number' || link.width < 0)) {
      return { valid: false, error: `连线 ${link.id} 线宽无效` }
    }
  }

  return {
    valid: true,
    data: {
      nodes: jsonData.nodes,
      links: jsonData.links,
    },
  }
}

export function getNodesBoundingBox(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((n) => {
    minX = Math.min(minX, n.x - PORT_RADIUS * 2)
    minY = Math.min(minY, n.y - PORT_RADIUS * 2)
    maxX = Math.max(maxX, n.x + NODE_WIDTH + PORT_RADIUS * 2)
    maxY = Math.max(maxY, n.y + NODE_HEIGHT + PORT_RADIUS * 2)
  })

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
