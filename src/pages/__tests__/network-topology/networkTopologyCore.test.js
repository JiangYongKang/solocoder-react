import { beforeEach, describe, expect, it } from 'vitest'
import {
    DATA_VERSION,
    DEFAULT_LINE_WIDTH,
    DEFAULT_ZOOM,
    DEVICE_TYPES,
    DEVICE_TYPE_COLORS,
    DEVICE_TYPE_ICONS,
    DEVICE_TYPE_LABELS,
    DEVICE_TYPE_SHAPES,
    LAYOUT_DIRECTION,
    LAYOUT_DIRECTION_LABELS,
    LINE_STYLES,
    LINE_STYLE_LABELS,
    LINE_CURVE_STYLES,
    LINE_CURVE_STYLE_LABELS,
    MAX_ZOOM,
    MIN_ZOOM,
    NODE_HEIGHT,
    NODE_WIDTH,
    PORT_RADIUS,
    STORAGE_KEY,
} from '../../network-topology/constants.js'
import {
    autoLayout,
    buildBezierPath,
    buildDirectPath,
    clampZoom,
    clearStorage,
    createDeviceNode,
    createLink,
    deleteLink,
    deleteLinksByNodeId,
    deleteNode,
    exportToJson,
    fitToView,
    forceDirectedLayout,
    generateId,
    getLinkById,
    getLinkMidpoint,
    getLinkPath,
    getLinksByNodeId,
    getNodeById,
    getNodePorts,
    getNodesBoundingBox,
    getPortPosition,
    importFromJson,
    loadFromStorage,
    saveToStorage,
    screenToWorld,
    updateLink,
    updateNode,
    validateLinkCreation,
    worldToScreen,
} from '../../network-topology/networkTopologyCore.js'

describe('DEVICE_TYPES constants', () => {
  it('should define 6 device types', () => {
    expect(Object.keys(DEVICE_TYPES)).toHaveLength(6)
    expect(DEVICE_TYPES.SERVER).toBe('server')
    expect(DEVICE_TYPES.ROUTER).toBe('router')
    expect(DEVICE_TYPES.SWITCH).toBe('switch')
    expect(DEVICE_TYPES.FIREWALL).toBe('firewall')
    expect(DEVICE_TYPES.WORKSTATION).toBe('workstation')
    expect(DEVICE_TYPES.CLOUD).toBe('cloud')
  })

  it('should have labels for all device types', () => {
    Object.values(DEVICE_TYPES).forEach((type) => {
      expect(DEVICE_TYPE_LABELS[type]).toBeDefined()
      expect(typeof DEVICE_TYPE_LABELS[type]).toBe('string')
    })
  })

  it('should have icons for all device types', () => {
    Object.values(DEVICE_TYPES).forEach((type) => {
      expect(DEVICE_TYPE_ICONS[type]).toBeDefined()
    })
  })

  it('should have shapes for all device types', () => {
    const validShapes = ['rect', 'circle', 'square', 'hexagon', 'diamond', 'cloud']
    Object.values(DEVICE_TYPES).forEach((type) => {
      expect(DEVICE_TYPE_SHAPES[type]).toBeDefined()
      expect(validShapes).toContain(DEVICE_TYPE_SHAPES[type])
    })
  })

  it('should have color schemes for all device types', () => {
    Object.values(DEVICE_TYPES).forEach((type) => {
      expect(DEVICE_TYPE_COLORS[type]).toBeDefined()
      expect(DEVICE_TYPE_COLORS[type]).toHaveProperty('fill')
      expect(DEVICE_TYPE_COLORS[type]).toHaveProperty('stroke')
      expect(DEVICE_TYPE_COLORS[type]).toHaveProperty('border')
    })
  })
})

describe('dimension constants', () => {
  it('should define positive dimension values', () => {
    expect(NODE_WIDTH).toBeGreaterThan(0)
    expect(NODE_HEIGHT).toBeGreaterThan(0)
    expect(PORT_RADIUS).toBeGreaterThan(0)
  })

  it('should define zoom bounds correctly', () => {
    expect(MIN_ZOOM).toBeGreaterThan(0)
    expect(MAX_ZOOM).toBeGreaterThan(MIN_ZOOM)
    expect(DEFAULT_ZOOM).toBeGreaterThanOrEqual(MIN_ZOOM)
    expect(DEFAULT_ZOOM).toBeLessThanOrEqual(MAX_ZOOM)
  })
})

describe('line style constants', () => {
  it('should define solid and dashed styles', () => {
    expect(LINE_STYLES.SOLID).toBe('solid')
    expect(LINE_STYLES.DASHED).toBe('dashed')
    expect(LINE_STYLE_LABELS[LINE_STYLES.SOLID]).toBe('实线')
    expect(LINE_STYLE_LABELS[LINE_STYLES.DASHED]).toBe('虚线')
    expect(DEFAULT_LINE_WIDTH).toBeGreaterThan(0)
  })
})

describe('line curve style constants', () => {
  it('should define bezier and straight curve styles', () => {
    expect(LINE_CURVE_STYLES.BEZIER).toBe('bezier')
    expect(LINE_CURVE_STYLES.STRAIGHT).toBe('straight')
    expect(LINE_CURVE_STYLE_LABELS[LINE_CURVE_STYLES.BEZIER]).toBe('曲线')
    expect(LINE_CURVE_STYLE_LABELS[LINE_CURVE_STYLES.STRAIGHT]).toBe('直线')
  })
})

describe('layout direction constants', () => {
  it('should define vertical and horizontal directions', () => {
    expect(LAYOUT_DIRECTION.VERTICAL).toBe('vertical')
    expect(LAYOUT_DIRECTION.HORIZONTAL).toBe('horizontal')
    expect(LAYOUT_DIRECTION_LABELS[LAYOUT_DIRECTION.VERTICAL]).toBe('垂直布局')
    expect(LAYOUT_DIRECTION_LABELS[LAYOUT_DIRECTION.HORIZONTAL]).toBe('水平布局')
  })
})

describe('storage constants', () => {
  it('should define storage key and data version', () => {
    expect(typeof STORAGE_KEY).toBe('string')
    expect(STORAGE_KEY.length).toBeGreaterThan(0)
    expect(typeof DATA_VERSION).toBe('string')
  })
})

describe('generateId', () => {
  it('should generate unique string IDs with prefix', () => {
    const id1 = generateId('test')
    const id2 = generateId('test')
    expect(typeof id1).toBe('string')
    expect(id1.startsWith('test_')).toBe(true)
    expect(id1).not.toBe(id2)
  })

  it('should use default prefix when not provided', () => {
    const id = generateId()
    expect(id.startsWith('id_')).toBe(true)
  })
})

describe('createDeviceNode', () => {
  it('should create a server node with correct properties', () => {
    const node = createDeviceNode(DEVICE_TYPES.SERVER, 100, 200)
    expect(node).not.toBeNull()
    expect(node.type).toBe(DEVICE_TYPES.SERVER)
    expect(node.name).toBe('服务器')
    expect(node.x).toBe(100)
    expect(node.y).toBe(200)
    expect(typeof node.id).toBe('string')
  })

  it('should create nodes for all 6 device types', () => {
    Object.values(DEVICE_TYPES).forEach((type) => {
      const node = createDeviceNode(type, 0, 0)
      expect(node).not.toBeNull()
      expect(node.type).toBe(type)
      expect(typeof node.name).toBe('string')
      expect(node.name.length).toBeGreaterThan(0)
    })
  })

  it('should return null for invalid device type', () => {
    const node = createDeviceNode('invalid_type', 0, 0)
    expect(node).toBeNull()
  })

  it('should use custom name when provided', () => {
    const node = createDeviceNode(DEVICE_TYPES.ROUTER, 0, 0, '我的路由器')
    expect(node.name).toBe('我的路由器')
  })

  it('should have default position of 100, 100', () => {
    const node = createDeviceNode(DEVICE_TYPES.SWITCH)
    expect(node.x).toBe(100)
    expect(node.y).toBe(100)
  })
})

describe('createLink', () => {
  it('should create a link with correct properties', () => {
    const link = createLink('node1', 'right', 'node2', 'left')
    expect(link.fromNodeId).toBe('node1')
    expect(link.fromPort).toBe('right')
    expect(link.toNodeId).toBe('node2')
    expect(link.toPort).toBe('left')
    expect(link.style).toBe(LINE_STYLES.SOLID)
    expect(link.curveStyle).toBe(LINE_CURVE_STYLES.BEZIER)
    expect(link.width).toBe(DEFAULT_LINE_WIDTH)
    expect(link.label).toBe('')
    expect(typeof link.id).toBe('string')
  })
})

describe('getNodeById', () => {
  const nodes = [
    { id: 'n1', type: DEVICE_TYPES.SERVER, name: '服务器', x: 0, y: 0 },
    { id: 'n2', type: DEVICE_TYPES.ROUTER, name: '路由器', x: 200, y: 0 },
  ]

  it('should find existing node', () => {
    expect(getNodeById(nodes, 'n1')).toBe(nodes[0])
    expect(getNodeById(nodes, 'n2')).toBe(nodes[1])
  })

  it('should return null for non-existent node', () => {
    expect(getNodeById(nodes, 'n999')).toBeNull()
  })

  it('should return null for invalid input', () => {
    expect(getNodeById(null, 'n1')).toBeNull()
    expect(getNodeById('not_array', 'n1')).toBeNull()
  })
})

describe('getLinkById', () => {
  const links = [
    { id: 'l1', fromNodeId: 'n1', fromPort: 'right', toNodeId: 'n2', toPort: 'left' },
    { id: 'l2', fromNodeId: 'n2', fromPort: 'right', toNodeId: 'n3', toPort: 'left' },
  ]

  it('should find existing link', () => {
    expect(getLinkById(links, 'l1')).toBe(links[0])
  })

  it('should return null for non-existent link', () => {
    expect(getLinkById(links, 'l999')).toBeNull()
  })

  it('should return null for invalid input', () => {
    expect(getLinkById(null, 'l1')).toBeNull()
  })
})

describe('updateNode', () => {
  const nodes = [
    { id: 'n1', type: DEVICE_TYPES.SERVER, name: '服务器', x: 0, y: 0 },
    { id: 'n2', type: DEVICE_TYPES.ROUTER, name: '路由器', x: 200, y: 0 },
  ]

  it('should update name of a node', () => {
    const result = updateNode(nodes, 'n1', { name: '新服务器' })
    expect(result[0].name).toBe('新服务器')
    expect(result[1].name).toBe('路由器')
  })

  it('should update position of a node', () => {
    const result = updateNode(nodes, 'n1', { x: 500, y: 300 })
    expect(result[0].x).toBe(500)
    expect(result[0].y).toBe(300)
  })

  it('should not mutate original array', () => {
    const result = updateNode(nodes, 'n1', { name: 'changed' })
    expect(nodes[0].name).toBe('服务器')
    expect(result[0].name).toBe('changed')
  })

  it('should return empty array for invalid input', () => {
    expect(updateNode(null, 'n1', {})).toEqual([])
  })
})

describe('deleteNode', () => {
  const nodes = [
    { id: 'n1', type: DEVICE_TYPES.SERVER, name: '服务器', x: 0, y: 0 },
    { id: 'n2', type: DEVICE_TYPES.ROUTER, name: '路由器', x: 200, y: 0 },
    { id: 'n3', type: DEVICE_TYPES.SWITCH, name: '交换机', x: 400, y: 0 },
  ]

  it('should delete specified node', () => {
    const result = deleteNode(nodes, 'n2')
    expect(result).toHaveLength(2)
    expect(result.find((n) => n.id === 'n2')).toBeUndefined()
  })

  it('should not mutate original array', () => {
    const result = deleteNode(nodes, 'n1')
    expect(nodes).toHaveLength(3)
    expect(result).toHaveLength(2)
  })

  it('should return empty array for invalid input', () => {
    expect(deleteNode(null, 'n1')).toEqual([])
  })
})

describe('updateLink', () => {
  const links = [
    { id: 'l1', style: LINE_STYLES.SOLID, width: 2, label: '' },
    { id: 'l2', style: LINE_STYLES.SOLID, width: 2, label: '' },
  ]

  it('should update link style to dashed', () => {
    const result = updateLink(links, 'l1', { style: LINE_STYLES.DASHED })
    expect(result[0].style).toBe(LINE_STYLES.DASHED)
    expect(result[1].style).toBe(LINE_STYLES.SOLID)
  })

  it('should update link width and label', () => {
    const result = updateLink(links, 'l1', { width: 4, label: '千兆光纤' })
    expect(result[0].width).toBe(4)
    expect(result[0].label).toBe('千兆光纤')
  })
})

describe('deleteLink', () => {
  const links = [
    { id: 'l1', fromNodeId: 'n1', toNodeId: 'n2' },
    { id: 'l2', fromNodeId: 'n2', toNodeId: 'n3' },
  ]

  it('should delete specified link', () => {
    const result = deleteLink(links, 'l1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('l2')
  })
})

describe('deleteLinksByNodeId', () => {
  const links = [
    { id: 'l1', fromNodeId: 'n1', toNodeId: 'n2' },
    { id: 'l2', fromNodeId: 'n2', toNodeId: 'n3' },
    { id: 'l3', fromNodeId: 'n3', toNodeId: 'n4' },
  ]

  it('should delete all links connected to a node', () => {
    const result = deleteLinksByNodeId(links, 'n2')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('l3')
  })

  it('should delete links where node is source or target', () => {
    const result = deleteLinksByNodeId(links, 'n3')
    expect(result.map((l) => l.id)).toEqual(['l1'])
  })
})

describe('getLinksByNodeId', () => {
  const links = [
    { id: 'l1', fromNodeId: 'n1', toNodeId: 'n2' },
    { id: 'l2', fromNodeId: 'n2', toNodeId: 'n3' },
    { id: 'l3', fromNodeId: 'n4', toNodeId: 'n5' },
  ]

  it('should get all links connected to a node', () => {
    const result = getLinksByNodeId(links, 'n2')
    expect(result).toHaveLength(2)
    expect(result.map((l) => l.id).sort()).toEqual(['l1', 'l2'])
  })

  it('should return empty array for node with no links', () => {
    expect(getLinksByNodeId(links, 'n999')).toEqual([])
  })
})

describe('validateLinkCreation', () => {
  const nodes = [
    { id: 'n1', type: DEVICE_TYPES.SERVER, name: 's1', x: 0, y: 0 },
    { id: 'n2', type: DEVICE_TYPES.SWITCH, name: 'sw1', x: 200, y: 0 },
    { id: 'n3', type: DEVICE_TYPES.ROUTER, name: 'r1', x: 400, y: 0 },
  ]
  const links = [
    { id: 'l1', fromNodeId: 'n1', fromPort: 'right', toNodeId: 'n2', toPort: 'left' },
  ]

  it('should pass for valid new link', () => {
    const result = validateLinkCreation(nodes, links, 'n2', 'right', 'n3', 'left')
    expect(result.valid).toBe(true)
  })

  it('should reject same node connection', () => {
    const result = validateLinkCreation(nodes, links, 'n1', 'right', 'n1', 'left')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('同一设备')
  })

  it('should reject missing node IDs', () => {
    const result = validateLinkCreation(nodes, links, null, 'right', 'n2', 'left')
    expect(result.valid).toBe(false)
  })

  it('should reject missing port info', () => {
    const result = validateLinkCreation(nodes, links, 'n1', null, 'n2', 'left')
    expect(result.valid).toBe(false)
  })

  it('should reject non-existent nodes', () => {
    const result = validateLinkCreation(nodes, links, 'n999', 'right', 'n2', 'left')
    expect(result.valid).toBe(false)
  })

  it('should reject duplicate link (same direction)', () => {
    const result = validateLinkCreation(nodes, links, 'n1', 'right', 'n2', 'left')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('已存在')
  })

  it('should reject duplicate link (reverse direction)', () => {
    const result = validateLinkCreation(nodes, links, 'n2', 'left', 'n1', 'right')
    expect(result.valid).toBe(false)
  })
})

describe('clampZoom', () => {
  it('should keep zoom within bounds', () => {
    expect(clampZoom(MIN_ZOOM - 1)).toBe(MIN_ZOOM)
    expect(clampZoom(MAX_ZOOM + 1)).toBe(MAX_ZOOM)
    expect(clampZoom(1)).toBe(1)
    expect(clampZoom(0.5)).toBe(0.5)
  })
})

describe('coordinate transforms', () => {
  const pan = { x: 50, y: 30 }
  const zoom = 2

  it('screenToWorld should transform correctly', () => {
    const world = screenToWorld(250, 130, pan.x, pan.y, zoom)
    expect(world.x).toBe(100)
    expect(world.y).toBe(50)
  })

  it('worldToScreen should transform correctly', () => {
    const screen = worldToScreen(100, 50, pan.x, pan.y, zoom)
    expect(screen.x).toBe(250)
    expect(screen.y).toBe(130)
  })

  it('should be inverse operations', () => {
    const worldX = 123
    const worldY = 456
    const screen = worldToScreen(worldX, worldY, pan.x, pan.y, zoom)
    const world = screenToWorld(screen.x, screen.y, pan.x, pan.y, zoom)
    expect(world.x).toBeCloseTo(worldX)
    expect(world.y).toBeCloseTo(worldY)
  })
})

describe('getNodePorts', () => {
  it('should return 4 ports at correct positions', () => {
    const node = { x: 100, y: 200 }
    const ports = getNodePorts(node)
    expect(Object.keys(ports)).toEqual(['top', 'bottom', 'left', 'right'])
    expect(ports.top).toEqual({ x: 100 + NODE_WIDTH / 2, y: 200 })
    expect(ports.bottom).toEqual({ x: 100 + NODE_WIDTH / 2, y: 200 + NODE_HEIGHT })
    expect(ports.left).toEqual({ x: 100, y: 200 + NODE_HEIGHT / 2 })
    expect(ports.right).toEqual({ x: 100 + NODE_WIDTH, y: 200 + NODE_HEIGHT / 2 })
  })

  it('should return empty object for null node', () => {
    expect(getNodePorts(null)).toEqual({})
  })
})

describe('getPortPosition', () => {
  it('should return position for each port', () => {
    const node = { x: 0, y: 0 }
    expect(getPortPosition(node, 'top').y).toBe(0)
    expect(getPortPosition(node, 'bottom').y).toBe(NODE_HEIGHT)
    expect(getPortPosition(node, 'left').x).toBe(0)
    expect(getPortPosition(node, 'right').x).toBe(NODE_WIDTH)
  })

  it('should fallback to center for invalid port', () => {
    const node = { x: 0, y: 0 }
    const pos = getPortPosition(node, 'invalid_port')
    expect(pos.x).toBe(NODE_WIDTH / 2)
    expect(pos.y).toBe(NODE_HEIGHT / 2)
  })
})

describe('path building functions', () => {
  const from = { x: 0, y: 50 }
  const to = { x: 300, y: 50 }

  it('buildBezierPath should return SVG path string', () => {
    const path = buildBezierPath(from, to)
    expect(path.startsWith('M 0 50')).toBe(true)
    expect(path).toContain('C ')
  })

  it('buildBezierPath with horizontal ports should have horizontal control points', () => {
    const path = buildBezierPath(from, to, 'right', 'left')
    expect(path.startsWith('M 0 50')).toBe(true)
    expect(path).toContain('C ')
    const parts = path.split('C ')[1].split(', ')
    const c1 = parts[0].split(' ')
    expect(Number(c1[0])).toBeGreaterThan(0)
    expect(Number(c1[1])).toBe(50)
  })

  it('buildBezierPath with vertical ports should have vertical control points', () => {
    const top = { x: 150, y: 0 }
    const bottom = { x: 150, y: 300 }
    const path = buildBezierPath(top, bottom, 'bottom', 'top')
    expect(path.startsWith('M 150 0')).toBe(true)
    const parts = path.split('C ')[1].split(', ')
    const c1 = parts[0].split(' ')
    expect(Number(c1[0])).toBe(150)
    expect(Number(c1[1])).toBeGreaterThan(0)
  })

  it('buildDirectPath should return SVG line string', () => {
    const path = buildDirectPath(from, to)
    expect(path).toBe('M 0 50 L 300 50')
  })
})

describe('getLinkPath and getLinkMidpoint', () => {
  const nodes = [
    { id: 'n1', type: DEVICE_TYPES.SERVER, name: 's1', x: 0, y: 0 },
    { id: 'n2', type: DEVICE_TYPES.SWITCH, name: 'sw1', x: 300, y: 0 },
  ]
  const link = {
    id: 'l1',
    fromNodeId: 'n1',
    fromPort: 'right',
    toNodeId: 'n2',
    toPort: 'left',
  }

  it('getLinkPath should return non-empty path', () => {
    const path = getLinkPath(link, nodes)
    expect(typeof path).toBe('string')
    expect(path.length).toBeGreaterThan(0)
  })

  it('getLinkPath should return empty for missing nodes', () => {
    const badLink = { ...link, fromNodeId: 'missing' }
    expect(getLinkPath(badLink, nodes)).toBe('')
  })

  it('getLinkMidpoint should return center between ports', () => {
    const mid = getLinkMidpoint(link, nodes)
    const from = getPortPosition(nodes[0], 'right')
    const to = getPortPosition(nodes[1], 'left')
    expect(mid.x).toBeCloseTo((from.x + to.x) / 2)
    expect(mid.y).toBeCloseTo((from.y + to.y) / 2)
  })

  it('getLinkPath with bezier curveStyle should contain bezier command', () => {
    const bezierLink = { ...link, curveStyle: LINE_CURVE_STYLES.BEZIER }
    const path = getLinkPath(bezierLink, nodes)
    expect(path).toContain('C ')
  })

  it('getLinkPath with straight curveStyle should contain line command', () => {
    const straightLink = { ...link, curveStyle: LINE_CURVE_STYLES.STRAIGHT }
    const path = getLinkPath(straightLink, nodes)
    expect(path).toContain('L ')
    expect(path).not.toContain('C ')
  })

  it('getLinkPath default curveStyle should be bezier', () => {
    const path = getLinkPath(link, nodes)
    expect(path).toContain('C ')
  })
})

describe('autoLayout', () => {
  it('should return nodes array unchanged if empty', () => {
    expect(autoLayout([], [])).toEqual([])
  })

  it('should assign coordinates to all nodes', () => {
    const nodes = [
      { id: 'n1', type: DEVICE_TYPES.SERVER, name: 's', x: 0, y: 0 },
      { id: 'n2', type: DEVICE_TYPES.SWITCH, name: 'sw', x: 0, y: 0 },
      { id: 'n3', type: DEVICE_TYPES.WORKSTATION, name: 'w', x: 0, y: 0 },
    ]
    const links = [
      { fromNodeId: 'n1', toNodeId: 'n2' },
      { fromNodeId: 'n2', toNodeId: 'n3' },
    ]
    const result = autoLayout(nodes, links, LAYOUT_DIRECTION.VERTICAL)
    expect(result).toHaveLength(3)
    result.forEach((n) => {
      expect(typeof n.x).toBe('number')
      expect(typeof n.y).toBe('number')
    })
  })

  it('should arrange nodes top to bottom in vertical layout', () => {
    const nodes = [
      { id: 'n1', type: DEVICE_TYPES.SERVER, name: 's', x: 0, y: 0 },
      { id: 'n2', type: DEVICE_TYPES.SWITCH, name: 'sw', x: 0, y: 0 },
    ]
    const links = [{ fromNodeId: 'n1', toNodeId: 'n2' }]
    const result = autoLayout(nodes, links, LAYOUT_DIRECTION.VERTICAL, 100, 100)
    const n1 = result.find((n) => n.id === 'n1')
    const n2 = result.find((n) => n.id === 'n2')
    expect(n2.y).toBeGreaterThan(n1.y)
  })

  it('should arrange nodes left to right in horizontal layout', () => {
    const nodes = [
      { id: 'n1', type: DEVICE_TYPES.SERVER, name: 's', x: 0, y: 0 },
      { id: 'n2', type: DEVICE_TYPES.SWITCH, name: 'sw', x: 0, y: 0 },
    ]
    const links = [{ fromNodeId: 'n1', toNodeId: 'n2' }]
    const result = autoLayout(nodes, links, LAYOUT_DIRECTION.HORIZONTAL, 100, 100)
    const n1 = result.find((n) => n.id === 'n1')
    const n2 = result.find((n) => n.id === 'n2')
    expect(n2.x).toBeGreaterThan(n1.x)
  })

  it('should not mutate original nodes', () => {
    const nodes = [
      { id: 'n1', type: DEVICE_TYPES.SERVER, name: 's', x: 111, y: 222 },
    ]
    const result = autoLayout(nodes, [], LAYOUT_DIRECTION.VERTICAL)
    expect(nodes[0].x).toBe(111)
    expect(nodes[0].y).toBe(222)
    expect(result[0]).not.toBe(nodes[0])
  })
})

describe('forceDirectedLayout', () => {
  it('should handle empty nodes', () => {
    expect(forceDirectedLayout([], [])).toEqual([])
  })

  it('should assign positions to all nodes', () => {
    const nodes = [
      { id: 'n1', type: DEVICE_TYPES.SERVER, name: 's', x: 0, y: 0 },
      { id: 'n2', type: DEVICE_TYPES.SWITCH, name: 'sw', x: 0, y: 0 },
      { id: 'n3', type: DEVICE_TYPES.WORKSTATION, name: 'w', x: 0, y: 0 },
      { id: 'n4', type: DEVICE_TYPES.ROUTER, name: 'r', x: 0, y: 0 },
    ]
    const links = [
      { fromNodeId: 'n1', toNodeId: 'n2' },
      { fromNodeId: 'n2', toNodeId: 'n3' },
      { fromNodeId: 'n2', toNodeId: 'n4' },
    ]
    const result = forceDirectedLayout(nodes, links, 10, 800, 600)
    expect(result).toHaveLength(4)
    result.forEach((n) => {
      expect(typeof n.x).toBe('number')
      expect(typeof n.y).toBe('number')
      expect(Number.isFinite(n.x)).toBe(true)
      expect(Number.isFinite(n.y)).toBe(true)
    })
  })
})

describe('fitToView', () => {
  it('should return default values for empty nodes', () => {
    const result = fitToView([], 1024, 768)
    expect(result.panX).toBe(512)
    expect(result.panY).toBe(384)
    expect(result.zoom).toBe(1)
  })

  it('should compute zoom and pan for content', () => {
    const nodes = [
      { id: 'n1', x: 0, y: 0 },
      { id: 'n2', x: 400, y: 0 },
    ]
    const result = fitToView(nodes, 1000, 800, 50)
    expect(result.zoom).toBeGreaterThan(0)
    expect(result.zoom).toBeLessThanOrEqual(MAX_ZOOM)
    expect(result.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
    expect(typeof result.panX).toBe('number')
    expect(typeof result.panY).toBe('number')
  })
})

describe('localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = (() => {
      const store = {}
      return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v) },
        removeItem: (k) => { delete store[k] },
      }
    })()
  })

  it('saveToStorage should succeed and persist data', () => {
    const state = {
      nodes: [{ id: 'n1', type: DEVICE_TYPES.SERVER, name: 's', x: 0, y: 0 }],
      links: [{ id: 'l1', fromNodeId: 'n1', toNodeId: 'n2' }],
    }
    const result = saveToStorage(state, mockStorage)
    expect(result.success).toBe(true)
    expect(result.error).toBeNull()

    const raw = mockStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw)
    expect(parsed.nodes).toHaveLength(1)
    expect(parsed.links).toHaveLength(1)
  })

  it('loadFromStorage should return empty for missing key', () => {
    const result = loadFromStorage(mockStorage)
    expect(result.nodes).toEqual([])
    expect(result.links).toEqual([])
    expect(result.error).toBeNull()
  })

  it('loadFromStorage should load saved data', () => {
    const data = { nodes: [{ id: 'n1' }], links: [{ id: 'l1' }] }
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const result = loadFromStorage(mockStorage)
    expect(result.nodes).toEqual(data.nodes)
    expect(result.links).toEqual(data.links)
  })

  it('loadFromStorage should handle corrupt data', () => {
    mockStorage.setItem(STORAGE_KEY, 'not valid json{{{')
    const result = loadFromStorage(mockStorage)
    expect(result.nodes).toEqual([])
    expect(result.links).toEqual([])
    expect(result.error).not.toBeNull()
  })

  it('clearStorage should remove data', () => {
    mockStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: [], links: [] }))
    const result = clearStorage(mockStorage)
    expect(result.success).toBe(true)
    expect(mockStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('should handle null storage gracefully', () => {
    expect(loadFromStorage(null).error).not.toBeNull()
    expect(saveToStorage({}, null).success).toBe(false)
    expect(clearStorage(null).success).toBe(false)
  })
})

describe('exportToJson', () => {
  it('should include version, nodes, links and timestamp', () => {
    const state = {
      nodes: [{ id: 'n1' }],
      links: [{ id: 'l1' }],
    }
    const result = exportToJson(state)
    expect(result.version).toBe(DATA_VERSION)
    expect(result.nodes).toBe(state.nodes)
    expect(result.links).toBe(state.links)
    expect(typeof result.exportedAt).toBe('string')
    expect(new Date(result.exportedAt).toString()).not.toBe('Invalid Date')
  })

  it('should use empty arrays for missing state', () => {
    const result = exportToJson({})
    expect(result.nodes).toEqual([])
    expect(result.links).toEqual([])
  })
})

describe('importFromJson', () => {
  const makeValidData = () => ({
    nodes: [
      { id: 'n1', type: DEVICE_TYPES.SERVER, name: '服务器', x: 0, y: 0 },
      { id: 'n2', type: DEVICE_TYPES.SWITCH, name: '交换机', x: 200, y: 0 },
    ],
    links: [
      {
        id: 'l1',
        fromNodeId: 'n1',
        fromPort: 'right',
        toNodeId: 'n2',
        toPort: 'left',
        style: LINE_STYLES.SOLID,
        width: 2,
        label: '',
      },
    ],
  })

  it('should validate and accept valid data', () => {
    const data = makeValidData()
    const result = importFromJson(data)
    expect(result.valid).toBe(true)
    expect(result.data.nodes).toHaveLength(2)
    expect(result.data.links).toHaveLength(1)
  })

  it('should reject null input', () => {
    expect(importFromJson(null).valid).toBe(false)
  })

  it('should reject missing nodes array', () => {
    const data = { links: [] }
    expect(importFromJson(data).valid).toBe(false)
  })

  it('should reject missing links array', () => {
    const data = { nodes: [] }
    expect(importFromJson(data).valid).toBe(false)
  })

  it('should reject node with invalid type', () => {
    const data = makeValidData()
    data.nodes[0].type = 'invalid_type'
    expect(importFromJson(data).valid).toBe(false)
  })

  it('should reject node missing id', () => {
    const data = makeValidData()
    delete data.nodes[0].id
    expect(importFromJson(data).valid).toBe(false)
  })

  it('should reject node with non-numeric coordinates', () => {
    const data = makeValidData()
    data.nodes[0].x = 'not a number'
    expect(importFromJson(data).valid).toBe(false)
  })

  it('should reject link referencing non-existent node', () => {
    const data = makeValidData()
    data.links[0].fromNodeId = 'missing_node'
    expect(importFromJson(data).valid).toBe(false)
  })

  it('should reject link with invalid port', () => {
    const data = makeValidData()
    data.links[0].fromPort = 'invalid_port'
    expect(importFromJson(data).valid).toBe(false)
  })

  it('should reject link with invalid style', () => {
    const data = makeValidData()
    data.links[0].style = 'invalid_style'
    expect(importFromJson(data).valid).toBe(false)
  })

  it('should reject link with invalid curveStyle', () => {
    const data = makeValidData()
    data.links[0].curveStyle = 'invalid_curve'
    expect(importFromJson(data).valid).toBe(false)
  })

  it('should accept link with valid curveStyle', () => {
    const data = makeValidData()
    data.links[0].curveStyle = LINE_CURVE_STYLES.STRAIGHT
    expect(importFromJson(data).valid).toBe(true)
  })

  it('should accept link without optional style/width', () => {
    const data = makeValidData()
    delete data.links[0].style
    delete data.links[0].width
    expect(importFromJson(data).valid).toBe(true)
  })
})

describe('getNodesBoundingBox', () => {
  it('should return zero box for empty nodes', () => {
    const bbox = getNodesBoundingBox([])
    expect(bbox.minX).toBe(0)
    expect(bbox.minY).toBe(0)
    expect(bbox.maxX).toBe(0)
    expect(bbox.maxY).toBe(0)
    expect(bbox.width).toBe(0)
    expect(bbox.height).toBe(0)
  })

  it('should compute bounding box including port radius padding', () => {
    const nodes = [
      { id: 'n1', x: 0, y: 0 },
      { id: 'n2', x: 300, y: 200 },
    ]
    const bbox = getNodesBoundingBox(nodes)
    expect(bbox.minX).toBeLessThanOrEqual(0 - PORT_RADIUS * 2)
    expect(bbox.minY).toBeLessThanOrEqual(0 - PORT_RADIUS * 2)
    expect(bbox.maxX).toBeGreaterThanOrEqual(300 + NODE_WIDTH + PORT_RADIUS * 2)
    expect(bbox.maxY).toBeGreaterThanOrEqual(200 + NODE_HEIGHT + PORT_RADIUS * 2)
    expect(bbox.width).toBe(bbox.maxX - bbox.minX)
    expect(bbox.height).toBe(bbox.maxY - bbox.minY)
  })
})
