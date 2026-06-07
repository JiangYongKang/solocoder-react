import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  NODE_TYPES,
  NODE_TYPE_LABELS,
  NODE_TYPE_ICONS,
  NODE_WIDTH,
  NODE_HEIGHT,
  createNode,
  createEdge,
  updateNode,
  deleteNode,
  deleteEdgesByNodeId,
  updateEdge,
  deleteEdge,
  hasStartNode,
  hasEndNode,
  getNodeById,
  getOutgoingEdges,
  getIncomingEdges,
  getOutputAnchor,
  getInputAnchor,
  buildBezierPath,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  exportToJson,
  importFromJson,
  simulateExecution,
} from '../../workflow/workflowCore'

describe('NODE_TYPES', () => {
  it('should contain all 5 node types', () => {
    expect(Object.keys(NODE_TYPES)).toHaveLength(5)
    expect(NODE_TYPES.START).toBe('start')
    expect(NODE_TYPES.END).toBe('end')
    expect(NODE_TYPES.TASK).toBe('task')
    expect(NODE_TYPES.CONDITION).toBe('condition')
    expect(NODE_TYPES.PARALLEL).toBe('parallel')
  })
})

describe('NODE_TYPE_LABELS', () => {
  it('should map all types to Chinese labels', () => {
    expect(NODE_TYPE_LABELS[NODE_TYPES.START]).toBe('开始节点')
    expect(NODE_TYPE_LABELS[NODE_TYPES.END]).toBe('结束节点')
    expect(NODE_TYPE_LABELS[NODE_TYPES.TASK]).toBe('任务节点')
    expect(NODE_TYPE_LABELS[NODE_TYPES.CONDITION]).toBe('条件分支')
    expect(NODE_TYPE_LABELS[NODE_TYPES.PARALLEL]).toBe('并行网关')
  })
})

describe('NODE_TYPE_ICONS', () => {
  it('should map all types to icons', () => {
    expect(NODE_TYPE_ICONS[NODE_TYPES.START]).toBe('▶')
    expect(NODE_TYPE_ICONS[NODE_TYPES.END]).toBe('■')
    expect(NODE_TYPE_ICONS[NODE_TYPES.TASK]).toBe('📋')
    expect(NODE_TYPE_ICONS[NODE_TYPES.CONDITION]).toBe('◇')
    expect(NODE_TYPE_ICONS[NODE_TYPES.PARALLEL]).toBe('⋈')
  })
})

describe('NODE_DIMENSIONS', () => {
  it('should export dimension constants', () => {
    expect(typeof NODE_WIDTH).toBe('number')
    expect(typeof NODE_HEIGHT).toBe('number')
    expect(NODE_WIDTH).toBeGreaterThan(0)
    expect(NODE_HEIGHT).toBeGreaterThan(0)
  })
})

describe('createNode', () => {
  it('should create a start node with default properties', () => {
    const node = createNode(NODE_TYPES.START)
    expect(node).toHaveProperty('id')
    expect(typeof node.id).toBe('string')
    expect(node.type).toBe(NODE_TYPES.START)
    expect(node.label).toBe('开始')
    expect(typeof node.x).toBe('number')
    expect(typeof node.y).toBe('number')
  })

  it('should create an end node', () => {
    const node = createNode(NODE_TYPES.END, 200, 300)
    expect(node.type).toBe(NODE_TYPES.END)
    expect(node.label).toBe('结束')
    expect(node.x).toBe(200)
    expect(node.y).toBe(300)
  })

  it('should create a task node with assignee', () => {
    const node = createNode(NODE_TYPES.TASK)
    expect(node.type).toBe(NODE_TYPES.TASK)
    expect(node.label).toBe('任务节点')
    expect(node.assignee).toBe('')
  })

  it('should create a condition node with expression', () => {
    const node = createNode(NODE_TYPES.CONDITION)
    expect(node.type).toBe(NODE_TYPES.CONDITION)
    expect(node.label).toBe('条件判断')
    expect(node.expression).toBe('')
  })

  it('should create a parallel gateway node', () => {
    const node = createNode(NODE_TYPES.PARALLEL)
    expect(node.type).toBe(NODE_TYPES.PARALLEL)
    expect(node.label).toBe('并行网关')
  })

  it('should generate unique IDs', () => {
    const n1 = createNode(NODE_TYPES.TASK)
    const n2 = createNode(NODE_TYPES.TASK)
    expect(n1.id).not.toBe(n2.id)
  })
})

describe('createEdge', () => {
  it('should create an edge with source and target', () => {
    const edge = createEdge('source_1', 'target_1')
    expect(edge).toHaveProperty('id')
    expect(typeof edge.id).toBe('string')
    expect(edge.source).toBe('source_1')
    expect(edge.target).toBe('target_1')
  })
})

describe('updateNode', () => {
  it('should return empty array for non-array input', () => {
    expect(updateNode(null, 'x', {})).toEqual([])
    expect(updateNode(undefined, 'x', {})).toEqual([])
  })

  it('should update a node by id', () => {
    const nodes = [
      { id: 'a', label: 'Old' },
      { id: 'b', label: 'B' },
    ]
    const result = updateNode(nodes, 'a', { label: 'New', assignee: 'Alice' })
    expect(result[0].label).toBe('New')
    expect(result[0].assignee).toBe('Alice')
    expect(result[1].label).toBe('B')
  })

  it('should return same array when id not found', () => {
    const nodes = [{ id: 'a', label: 'A' }]
    const result = updateNode(nodes, 'x', { label: 'New' })
    expect(result[0].label).toBe('A')
  })

  it('should not mutate original array', () => {
    const nodes = [{ id: 'a', label: 'Old' }]
    updateNode(nodes, 'a', { label: 'New' })
    expect(nodes[0].label).toBe('Old')
  })
})

describe('deleteNode', () => {
  it('should return empty array for non-array input', () => {
    expect(deleteNode(null, 'x')).toEqual([])
  })

  it('should delete node by id', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = deleteNode(nodes, 'b')
    expect(result.map((n) => n.id)).toEqual(['a', 'c'])
  })

  it('should not mutate original array', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }]
    deleteNode(nodes, 'a')
    expect(nodes).toHaveLength(2)
  })
})

describe('deleteEdgesByNodeId', () => {
  it('should return empty array for non-array input', () => {
    expect(deleteEdgesByNodeId(null, 'x')).toEqual([])
  })

  it('should delete edges connected to node', () => {
    const edges = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
      { id: 'e3', source: 'c', target: 'd' },
    ]
    const result = deleteEdgesByNodeId(edges, 'b')
    expect(result.map((e) => e.id)).toEqual(['e3'])
  })
})

describe('updateEdge', () => {
  it('should return empty array for non-array input', () => {
    expect(updateEdge(null, 'x', {})).toEqual([])
  })

  it('should update an edge by id', () => {
    const edges = [{ id: 'e1', source: 'a', target: 'b' }]
    const result = updateEdge(edges, 'e1', { source: 'x' })
    expect(result[0].source).toBe('x')
  })
})

describe('deleteEdge', () => {
  it('should delete edge by id', () => {
    const edges = [{ id: 'e1' }, { id: 'e2' }]
    const result = deleteEdge(edges, 'e1')
    expect(result.map((e) => e.id)).toEqual(['e2'])
  })
})

describe('hasStartNode', () => {
  it('should detect start node presence', () => {
    expect(hasStartNode(null)).toBe(false)
    expect(hasStartNode([])).toBe(false)
    expect(hasStartNode([{ type: NODE_TYPES.TASK }])).toBe(false)
    expect(hasStartNode([{ type: NODE_TYPES.START }])).toBe(true)
  })
})

describe('hasEndNode', () => {
  it('should detect end node presence', () => {
    expect(hasEndNode(null)).toBe(false)
    expect(hasEndNode([])).toBe(false)
    expect(hasEndNode([{ type: NODE_TYPES.TASK }])).toBe(false)
    expect(hasEndNode([{ type: NODE_TYPES.END }])).toBe(true)
  })
})

describe('getNodeById', () => {
  it('should return null for invalid input', () => {
    expect(getNodeById(null, 'x')).toBe(null)
    expect(getNodeById([], 'x')).toBe(null)
  })

  it('should find node by id', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }]
    expect(getNodeById(nodes, 'a')).toEqual({ id: 'a' })
    expect(getNodeById(nodes, 'b')).toEqual({ id: 'b' })
  })
})

describe('getOutgoingEdges', () => {
  it('should return empty array for invalid input', () => {
    expect(getOutgoingEdges(null, 'x')).toEqual([])
  })

  it('should find edges from node', () => {
    const edges = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ]
    expect(getOutgoingEdges(edges, 'a')).toHaveLength(1)
    expect(getOutgoingEdges(edges, 'a')[0].id).toBe('e1')
    expect(getOutgoingEdges(edges, 'b')[0].id).toBe('e2')
  })
})

describe('getIncomingEdges', () => {
  it('should return empty array for invalid input', () => {
    expect(getIncomingEdges(null, 'x')).toEqual([])
  })

  it('should find edges to node', () => {
    const edges = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ]
    expect(getIncomingEdges(edges, 'b')).toHaveLength(1)
    expect(getIncomingEdges(edges, 'b')[0].id).toBe('e1')
    expect(getIncomingEdges(edges, 'c')[0].id).toBe('e2')
  })
})

describe('anchor calculations', () => {
  it('getOutputAnchor should return right-middle point', () => {
    const node = { x: 100, y: 200 }
    const anchor = getOutputAnchor(node)
    expect(anchor.x).toBe(100 + NODE_WIDTH)
    expect(anchor.y).toBe(200 + NODE_HEIGHT / 2)
  })

  it('getInputAnchor should return left-middle point', () => {
    const node = { x: 100, y: 200 }
    const anchor = getInputAnchor(node)
    expect(anchor.x).toBe(100)
    expect(anchor.y).toBe(200 + NODE_HEIGHT / 2)
  })

  it('should handle null node', () => {
    expect(getOutputAnchor(null)).toEqual({ x: 0, y: 0 })
    expect(getInputAnchor(null)).toEqual({ x: 0, y: 0 })
  })
})

describe('buildBezierPath', () => {
  it('should return a valid bezier path string', () => {
    const from = { x: 0, y: 0 }
    const to = { x: 100, y: 0 }
    const path = buildBezierPath(from, to)
    expect(typeof path).toBe('string')
    expect(path.startsWith('M ')).toBe(true)
    expect(path.includes('C ')).toBe(true)
  })
})

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    clear: () => { store.clear() },
  }
}

describe('localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('should return default state when nothing stored', () => {
    const result = loadFromStorage()
    expect(result).toEqual({ nodes: [], edges: [] })
  })

  it('should save and load state correctly', () => {
    const testState = { nodes: [{ id: 'a', type: 'start' }], edges: [] }
    const saved = saveToStorage(testState)
    expect(saved).toBe(true)
    const loaded = loadFromStorage()
    expect(loaded).toEqual(testState)
  })

  it('should return default state for invalid JSON', () => {
    mockStorage.setItem('workflow-orchestrator-state', 'invalid-json')
    const result = loadFromStorage()
    expect(result).toEqual({ nodes: [], edges: [] })
  })

  it('should clear storage correctly', () => {
    saveToStorage({ nodes: [{ id: 'a' }], edges: [] })
    const cleared = clearStorage()
    expect(cleared).toBe(true)
    const loaded = loadFromStorage()
    expect(loaded).toEqual({ nodes: [], edges: [] })
  })

  it('should handle localStorage throws', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => { throw new Error('fail') },
        setItem: () => { throw new Error('fail') },
        removeItem: () => { throw new Error('fail') },
      },
    })
    expect(loadFromStorage()).toEqual({ nodes: [], edges: [] })
    expect(saveToStorage({ nodes: [], edges: [] })).toBe(false)
    expect(clearStorage()).toBe(false)
  })
})

describe('exportToJson', () => {
  it('should export with version and data', () => {
    const state = { nodes: [{ id: 'a' }], edges: [{ id: 'e1' }] }
    const result = exportToJson(state)
    expect(result.version).toBe('1.0')
    expect(result.nodes).toEqual(state.nodes)
    expect(result.edges).toEqual(state.edges)
    expect(result.exportedAt).toBeDefined()
  })
})

describe('importFromJson', () => {
  it('should reject non-object input', () => {
    expect(importFromJson(null).valid).toBe(false)
    expect(importFromJson('string').valid).toBe(false)
  })

  it('should reject missing nodes array', () => {
    const result = importFromJson({ edges: [] })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('nodes')
  })

  it('should reject missing edges array', () => {
    const result = importFromJson({ nodes: [] })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('edges')
  })

  it('should reject invalid node type', () => {
    const data = {
      nodes: [{ id: 'a', type: 'invalid', x: 0, y: 0 }],
      edges: [],
    }
    const result = importFromJson(data)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('无效')
  })

  it('should reject edge referencing non-existent node', () => {
    const data = {
      nodes: [{ id: 'a', type: NODE_TYPES.START, x: 0, y: 0 }],
      edges: [{ id: 'e1', source: 'a', target: 'missing' }],
    }
    const result = importFromJson(data)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('不存在')
  })

  it('should reject edge without id', () => {
    const data = {
      nodes: [
        { id: 'a', type: NODE_TYPES.START, x: 0, y: 0 },
        { id: 'b', type: NODE_TYPES.END, x: 100, y: 100 },
      ],
      edges: [{ source: 'a', target: 'b' }],
    }
    const result = importFromJson(data)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('id')
  })

  it('should reject edge with non-string id', () => {
    const data = {
      nodes: [
        { id: 'a', type: NODE_TYPES.START, x: 0, y: 0 },
        { id: 'b', type: NODE_TYPES.END, x: 100, y: 100 },
      ],
      edges: [{ id: 123, source: 'a', target: 'b' }],
    }
    const result = importFromJson(data)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('id')
  })

  it('should accept valid data', () => {
    const data = {
      nodes: [
        { id: 'a', type: NODE_TYPES.START, x: 0, y: 0, label: '开始' },
        { id: 'b', type: NODE_TYPES.END, x: 100, y: 100, label: '结束' },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b' }],
    }
    const result = importFromJson(data)
    expect(result.valid).toBe(true)
    expect(result.data).toEqual(data)
  })
})

describe('simulateExecution', () => {
  it('should return error when no nodes', () => {
    const result = simulateExecution([], [])
    expect(result.error).toBe('没有节点')
    expect(result.visitedNodeIds).toEqual([])
  })

  it('should return error when no start node', () => {
    const nodes = [{ id: 'e', type: NODE_TYPES.END, x: 0, y: 0 }]
    const result = simulateExecution(nodes, [])
    expect(result.error).toBe('缺少开始节点')
  })

  it('should execute simple linear flow', () => {
    const nodes = [
      { id: 's', type: NODE_TYPES.START, x: 0, y: 0 },
      { id: 't', type: NODE_TYPES.TASK, x: 100, y: 0 },
      { id: 'e', type: NODE_TYPES.END, x: 200, y: 0 },
    ]
    const edges = [
      { id: 'e1', source: 's', target: 't' },
      { id: 'e2', source: 't', target: 'e' },
    ]
    const result = simulateExecution(nodes, edges)
    expect(result.visitedNodeIds).toEqual(['s', 't', 'e'])
    expect(result.visitedEdgeIds).toEqual(['e1', 'e2'])
    expect(result.error).toBe(null)
  })

  it('should handle condition node with deterministic random', () => {
    const nodes = [
      { id: 's', type: NODE_TYPES.START, x: 0, y: 0 },
      { id: 'c', type: NODE_TYPES.CONDITION, x: 100, y: 0 },
      { id: 't1', type: NODE_TYPES.TASK, x: 200, y: -50 },
      { id: 't2', type: NODE_TYPES.TASK, x: 200, y: 50 },
      { id: 'e', type: NODE_TYPES.END, x: 300, y: 0 },
    ]
    const edges = [
      { id: 'e1', source: 's', target: 'c' },
      { id: 'e2', source: 'c', target: 't1' },
      { id: 'e3', source: 'c', target: 't2' },
      { id: 'e4', source: 't1', target: 'e' },
      { id: 'e5', source: 't2', target: 'e' },
    ]
    const result = simulateExecution(nodes, edges, () => 0.9)
    expect(result.visitedNodeIds).toContain('s')
    expect(result.visitedNodeIds).toContain('c')
    expect(result.visitedNodeIds).toContain('t2')
    expect(result.visitedNodeIds).toContain('e')
    expect(result.visitedNodeIds).not.toContain('t1')
  })

  it('should detect dead end', () => {
    const nodes = [
      { id: 's', type: NODE_TYPES.START, x: 0, y: 0 },
      { id: 't', type: NODE_TYPES.TASK, x: 100, y: 0 },
    ]
    const edges = [{ id: 'e1', source: 's', target: 't' }]
    const result = simulateExecution(nodes, edges)
    expect(result.path).toContainEqual({ type: 'dead-end', nodeId: 't' })
  })

  it('should detect loops gracefully without infinite processing', () => {
    const nodes = [
      { id: 's', type: NODE_TYPES.START, x: 0, y: 0 },
      { id: 't', type: NODE_TYPES.TASK, x: 100, y: 0 },
    ]
    const edges = [
      { id: 'e1', source: 's', target: 't' },
      { id: 'e2', source: 't', target: 's' },
    ]
    const result = simulateExecution(nodes, edges)
    expect(result.error).toBe(null)
    expect(new Set(result.visitedNodeIds)).toEqual(new Set(['s', 't']))
    expect(new Set(result.visitedEdgeIds)).toEqual(new Set(['e1', 'e2']))
    expect(result.visitedNodeIds.filter((id) => id === 's').length).toBe(1)
    expect(result.visitedNodeIds.filter((id) => id === 't').length).toBe(1)
  })

  it('should traverse all branches from parallel gateway', () => {
    const nodes = [
      { id: 's', type: NODE_TYPES.START, x: 0, y: 0 },
      { id: 'p', type: NODE_TYPES.PARALLEL, x: 100, y: 0 },
      { id: 't1', type: NODE_TYPES.TASK, x: 200, y: -50 },
      { id: 't2', type: NODE_TYPES.TASK, x: 200, y: 50 },
      { id: 't3', type: NODE_TYPES.TASK, x: 200, y: 100 },
      { id: 'e', type: NODE_TYPES.END, x: 300, y: 0 },
    ]
    const edges = [
      { id: 'e1', source: 's', target: 'p' },
      { id: 'e2', source: 'p', target: 't1' },
      { id: 'e3', source: 'p', target: 't2' },
      { id: 'e4', source: 'p', target: 't3' },
      { id: 'e5', source: 't1', target: 'e' },
      { id: 'e6', source: 't2', target: 'e' },
      { id: 'e7', source: 't3', target: 'e' },
    ]
    const result = simulateExecution(nodes, edges)
    expect(result.error).toBe(null)
    expect(result.visitedNodeIds).toContain('s')
    expect(result.visitedNodeIds).toContain('p')
    expect(result.visitedNodeIds).toContain('t1')
    expect(result.visitedNodeIds).toContain('t2')
    expect(result.visitedNodeIds).toContain('t3')
    expect(result.visitedNodeIds).toContain('e')
    expect(result.visitedEdgeIds).toContain('e1')
    expect(result.visitedEdgeIds).toContain('e2')
    expect(result.visitedEdgeIds).toContain('e3')
    expect(result.visitedEdgeIds).toContain('e4')
    expect(result.visitedEdgeIds).toContain('e5')
    expect(result.visitedEdgeIds).toContain('e6')
    expect(result.visitedEdgeIds).toContain('e7')
  })

  it('should handle parallel gateway with single branch', () => {
    const nodes = [
      { id: 's', type: NODE_TYPES.START, x: 0, y: 0 },
      { id: 'p', type: NODE_TYPES.PARALLEL, x: 100, y: 0 },
      { id: 't', type: NODE_TYPES.TASK, x: 200, y: 0 },
      { id: 'e', type: NODE_TYPES.END, x: 300, y: 0 },
    ]
    const edges = [
      { id: 'e1', source: 's', target: 'p' },
      { id: 'e2', source: 'p', target: 't' },
      { id: 'e3', source: 't', target: 'e' },
    ]
    const result = simulateExecution(nodes, edges)
    expect(result.error).toBe(null)
    expect(result.visitedNodeIds).toEqual(['s', 'p', 't', 'e'])
    expect(result.visitedEdgeIds).toEqual(['e1', 'e2', 'e3'])
  })
})
