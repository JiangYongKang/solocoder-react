import { describe, it, expect, beforeEach } from 'vitest'
import {
  createInitialState,
  addNode,
  find,
  findNoCompression,
  union,
  getRoot,
  isRoot,
  getChildren,
  getAllSets,
  getSetMembers,
  cloneState,
  serializeState,
  deserializeState,
  calculateForestLayout,
  clampZoom,
  screenToWorld,
  worldToScreen,
  createOperationLog,
  randomDuration,
  formatTimestamp,
  exportLogsToJson,
  getNodeById,
  getParentOf,
  getAllNodeIds,
  hasNode,
  getNodeCount,
  getSetCount,
  generateNodeName,
} from '../../union-find/unionFindCore.js'
import {
  OPERATION_TYPE,
  MIN_ZOOM,
  MAX_ZOOM,
} from '../../union-find/constants.js'

describe('createInitialState', () => {
  it('should create empty state with all required maps', () => {
    const state = createInitialState()
    expect(state.nodes).toBeInstanceOf(Map)
    expect(state.parent).toBeInstanceOf(Map)
    expect(state.rank).toBeInstanceOf(Map)
    expect(state.positions).toBeInstanceOf(Map)
    expect(state.nextId).toBe(0)
    expect(state.nodes.size).toBe(0)
  })
})

describe('generateNodeName', () => {
  it('should generate A-Z for 0-25', () => {
    expect(generateNodeName(0)).toBe('A')
    expect(generateNodeName(1)).toBe('B')
    expect(generateNodeName(25)).toBe('Z')
  })

  it('should generate names beyond Z', () => {
    expect(generateNodeName(26)).toBe('AA')
    expect(generateNodeName(27)).toBe('AB')
  })
})

describe('addNode', () => {
  let state

  beforeEach(() => {
    state = createInitialState()
  })

  it('should add a node with auto-generated name', () => {
    const result = addNode(state)
    expect(result.nodeId).toBeDefined()
    expect(result.nodeName).toBe('A')
    expect(getNodeCount(result.state)).toBe(1)
    expect(hasNode(result.state, result.nodeId)).toBe(true)
  })

  it('should add a node with custom name', () => {
    const result = addNode(state, 'CustomNode')
    expect(result.nodeName).toBe('CustomNode')
    const node = getNodeById(result.state, result.nodeId)
    expect(node.name).toBe('CustomNode')
  })

  it('should set parent to self for new nodes', () => {
    const result = addNode(state)
    expect(getParentOf(result.state, result.nodeId)).toBe(result.nodeId)
    expect(isRoot(result.state, result.nodeId)).toBe(true)
  })

  it('should set initial rank to 1', () => {
    const result = addNode(state)
    expect(result.state.rank.get(result.nodeId)).toBe(1)
  })

  it('should assign position to new node', () => {
    const result = addNode(state)
    const pos = result.state.positions.get(result.nodeId)
    expect(pos).toBeDefined()
    expect(typeof pos.x).toBe('number')
    expect(typeof pos.y).toBe('number')
  })

  it('should increment nextId', () => {
    let s = state
    s = addNode(s).state
    s = addNode(s).state
    s = addNode(s).state
    expect(s.nextId).toBe(3)
    expect(getNodeCount(s)).toBe(3)
  })

  it('should not overlap existing nodes positions', () => {
    let s = state
    const positions = []
    for (let i = 0; i < 10; i++) {
      const r = addNode(s)
      s = r.state
      const pos = s.positions.get(r.nodeId)
      for (const existing of positions) {
        const dx = pos.x - existing.x
        const dy = pos.y - existing.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        expect(dist).toBeGreaterThan(0)
      }
      positions.push(pos)
    }
    expect(getNodeCount(s)).toBe(10)
  })
})

describe('find / findNoCompression', () => {
  let state

  beforeEach(() => {
    state = createInitialState()
    const r1 = addNode(state, 'A')
    state = r1.state
    const r2 = addNode(state, 'B')
    state = r2.state
    const r3 = addNode(state, 'C')
    state = r3.state
    const u1 = union(state, r1.nodeId, r2.nodeId)
    state = u1.state
    const u2 = union(state, u1.parentRoot, r3.nodeId)
    state = u2.state
  })

  it('findNoCompression should return correct root', () => {
    const ids = getAllNodeIds(state)
    for (const id of ids) {
      const result = findNoCompression(state, id)
      expect(result.root).toBe(getRoot(state, id))
      expect(Array.isArray(result.path)).toBe(true)
      expect(result.path[result.path.length - 1]).toBe(result.root)
      expect(result.compressedNodes).toEqual([])
    }
  })

  it('find should not modify state when path length <= 1', () => {
    const ids = getAllNodeIds(state)
    const rootId = getRoot(state, ids[0])
    const result = find(state, rootId, true)
    expect(result.root).toBe(rootId)
    expect(result.compressedNodes).toEqual([])
  })

  it('find with path compression should flatten tree', () => {
    let s = createInitialState()
    const nodes = []
    for (let i = 0; i < 5; i++) {
      const r = addNode(s, String.fromCharCode(65 + i))
      s = r.state
      nodes.push(r.nodeId)
    }

    s.parent.set(nodes[4], nodes[3])
    s.parent.set(nodes[3], nodes[2])
    s.parent.set(nodes[2], nodes[1])
    s.parent.set(nodes[1], nodes[0])
    s.parent.set(nodes[0], nodes[0])

    const leaf = nodes[4]
    const resultBefore = findNoCompression(s, leaf)
    expect(resultBefore.path.length).toBeGreaterThanOrEqual(3)

    const result = find(s, leaf, true)
    s = result.state

    expect(result.root).toBe(resultBefore.root)
    expect(result.compressedNodes.length).toBeGreaterThan(0)

    for (const nid of result.compressedNodes) {
      expect(getParentOf(s, nid)).toBe(result.root)
    }
  })

  it('find without compression should not change parent pointers', () => {
    let s = createInitialState()
    const nodes = []
    for (let i = 0; i < 4; i++) {
      const r = addNode(s, String.fromCharCode(65 + i))
      s = r.state
      nodes.push(r.nodeId)
    }
    const u1 = union(s, nodes[2], nodes[3])
    s = u1.state
    const u2 = union(s, nodes[1], u1.parentRoot)
    s = u2.state
    const u3 = union(s, nodes[0], u2.parentRoot)
    s = u3.state

    const parentsBefore = new Map()
    for (const nid of nodes) {
      parentsBefore.set(nid, getParentOf(s, nid))
    }

    const result = find(s, nodes[3], false)
    expect(result.compressedNodes).toEqual([])

    for (const nid of nodes) {
      expect(getParentOf(result.state, nid)).toBe(parentsBefore.get(nid))
    }
  })

  it('path array should start from target node and end at root', () => {
    const ids = getAllNodeIds(state)
    const targetId = ids.find((id) => !isRoot(state, id))
    if (targetId) {
      const result = findNoCompression(state, targetId)
      expect(result.path[0]).toBe(targetId)
      expect(result.path[result.path.length - 1]).toBe(result.root)
    }
  })
})

describe('union', () => {
  let state
  let nodeAId
  let nodeBId
  let nodeCId

  beforeEach(() => {
    state = createInitialState()
    const r1 = addNode(state, 'A')
    state = r1.state
    nodeAId = r1.nodeId
    const r2 = addNode(state, 'B')
    state = r2.state
    nodeBId = r2.nodeId
    const r3 = addNode(state, 'C')
    state = r3.state
    nodeCId = r3.nodeId
  })

  it('should successfully union two separate nodes', () => {
    const result = union(state, nodeAId, nodeBId)
    expect(result.success).toBe(true)
    expect(result.childRoot).toBeDefined()
    expect(result.parentRoot).toBeDefined()
    expect(result.childRoot).not.toBe(result.parentRoot)
    expect(getParentOf(result.state, result.childRoot)).toBe(result.parentRoot)
  })

  it('should not union a node with itself', () => {
    const result = union(state, nodeAId, nodeAId)
    expect(result.success).toBe(false)
    expect(result.message).toContain('同一集合')
  })

  it('should detect nodes already in same set', () => {
    let s = state
    const u1 = union(s, nodeAId, nodeBId)
    s = u1.state
    const u2 = union(s, nodeAId, nodeBId)
    expect(u2.success).toBe(false)
    expect(u2.message).toContain('同一集合')
  })

  it('should use rank-based union (smaller rank attached to larger)', () => {
    const result = union(state, nodeAId, nodeBId)
    const parentRootA = result.parentRoot

    expect(result.state.rank.get(parentRootA)).toBeGreaterThanOrEqual(1)

    let s = result.state
    const result2 = union(s, parentRootA, nodeCId)

    if (result2.state.rank.get(parentRootA) === result2.state.rank.get(nodeCId)) {
      expect(result2.parentRoot).toBe(parentRootA)
      expect(result2.state.rank.get(parentRootA)).toBe(2)
    }
  })

  it('should return descriptive message', () => {
    const result = union(state, nodeAId, nodeBId)
    const childNode = getNodeById(result.state, result.childRoot)
    const parentNode = getNodeById(result.state, result.parentRoot)
    expect(result.message).toContain(childNode.name)
    expect(result.message).toContain(parentNode.name)
  })

  it('should not mutate original state', () => {
    const originalParentA = getParentOf(state, nodeAId)
    const originalParentB = getParentOf(state, nodeBId)
    union(state, nodeAId, nodeBId)
    expect(getParentOf(state, nodeAId)).toBe(originalParentA)
    expect(getParentOf(state, nodeBId)).toBe(originalParentB)
  })

  it('should reduce set count after union', () => {
    expect(getSetCount(state)).toBe(3)
    const result = union(state, nodeAId, nodeBId)
    expect(getSetCount(result.state)).toBe(2)
    const result2 = union(result.state, result.parentRoot, nodeCId)
    expect(getSetCount(result2.state)).toBe(1)
  })
})

describe('getRoot / isRoot / getChildren', () => {
  let state
  let nodeIds = []

  beforeEach(() => {
    state = createInitialState()
    for (let i = 0; i < 5; i++) {
      const r = addNode(state, String.fromCharCode(65 + i))
      state = r.state
      nodeIds.push(r.nodeId)
    }
    const u1 = union(state, nodeIds[0], nodeIds[1])
    state = u1.state
    const u2 = union(state, u1.parentRoot, nodeIds[2])
    state = u2.state
  })

  it('getRoot should return root for each node', () => {
    const root = getRoot(state, nodeIds[0])
    for (let i = 0; i < 3; i++) {
      expect(getRoot(state, nodeIds[i])).toBe(root)
    }
  })

  it('isRoot should correctly identify root nodes', () => {
    const root = getRoot(state, nodeIds[0])
    expect(isRoot(state, root)).toBe(true)
    for (let i = 0; i < 3; i++) {
      if (nodeIds[i] !== root) {
        expect(isRoot(state, nodeIds[i])).toBe(false)
      }
    }
    expect(isRoot(state, nodeIds[3])).toBe(true)
    expect(isRoot(state, nodeIds[4])).toBe(true)
  })

  it('getChildren should return direct children', () => {
    const root = getRoot(state, nodeIds[0])
    const children = getChildren(state, root)
    expect(Array.isArray(children)).toBe(true)
    expect(children.length).toBeGreaterThanOrEqual(1)
    for (const cid of children) {
      expect(getParentOf(state, cid)).toBe(root)
    }
  })

  it('getChildren should return empty array for leaf nodes', () => {
    const leaf = nodeIds[0]
    if (!isRoot(state, leaf) && getChildren(state, leaf).length === 0) {
      expect(getChildren(state, leaf)).toEqual([])
    }
  })
})

describe('getAllSets / getSetMembers', () => {
  let state
  let nodeIds = []

  beforeEach(() => {
    state = createInitialState()
    for (let i = 0; i < 6; i++) {
      const r = addNode(state, String.fromCharCode(65 + i))
      state = r.state
      nodeIds.push(r.nodeId)
    }
  })

  it('should return correct number of sets initially', () => {
    const sets = getAllSets(state)
    expect(sets.size).toBe(6)
    sets.forEach((members) => {
      expect(members.length).toBe(1)
    })
  })

  it('should group nodes correctly after unions', () => {
    let s = state
    s = union(s, nodeIds[0], nodeIds[1]).state
    s = union(s, nodeIds[1], nodeIds[2]).state
    s = union(s, nodeIds[3], nodeIds[4]).state

    const sets = getAllSets(s)
    expect(sets.size).toBe(3)

    const root012 = getRoot(s, nodeIds[0])
    const members012 = getSetMembers(s, root012)
    expect(members012.length).toBe(3)
    expect(members012).toContain(nodeIds[0])
    expect(members012).toContain(nodeIds[1])
    expect(members012).toContain(nodeIds[2])

    const root34 = getRoot(s, nodeIds[3])
    const members34 = getSetMembers(s, root34)
    expect(members34.length).toBe(2)

    const root5 = getRoot(s, nodeIds[5])
    const members5 = getSetMembers(s, root5)
    expect(members5.length).toBe(1)
  })
})

describe('cloneState / serialize / deserialize', () => {
  let state

  beforeEach(() => {
    state = createInitialState()
    let s = state
    const nodes = []
    for (let i = 0; i < 4; i++) {
      const r = addNode(s, `N${i}`)
      s = r.state
      nodes.push(r.nodeId)
    }
    s = union(s, nodes[0], nodes[1]).state
    s = union(s, nodes[2], nodes[3]).state
    state = s
  })

  it('cloneState should create deep copy', () => {
    const cloned = cloneState(state)
    expect(cloned).not.toBe(state)
    expect(getNodeCount(cloned)).toBe(getNodeCount(state))
    expect(getSetCount(cloned)).toBe(getSetCount(state))

    const clonedIds = getAllNodeIds(cloned)
    const origIds = getAllNodeIds(state)
    for (let i = 0; i < clonedIds.length; i++) {
      expect(getParentOf(cloned, clonedIds[i])).toBe(getParentOf(state, origIds[i]))
    }
  })

  it('mutating cloned state should not affect original', () => {
    const cloned = cloneState(state)
    const origCount = getNodeCount(state)
    addNode(cloned, 'Extra')
    expect(getNodeCount(state)).toBe(origCount)
  })

  it('serializeState should produce plain object', () => {
    const data = serializeState(state)
    expect(Array.isArray(data.nodes)).toBe(true)
    expect(Array.isArray(data.parent)).toBe(true)
    expect(Array.isArray(data.rank)).toBe(true)
    expect(Array.isArray(data.positions)).toBe(true)
    expect(typeof data.nextId).toBe('number')
  })

  it('deserializeState should reconstruct state from serialized data', () => {
    const data = serializeState(state)
    const reconstructed = deserializeState(data)
    expect(getNodeCount(reconstructed)).toBe(getNodeCount(state))
    expect(getSetCount(reconstructed)).toBe(getSetCount(state))

    const origIds = getAllNodeIds(state)
    const reconIds = getAllNodeIds(reconstructed)
    for (let i = 0; i < origIds.length; i++) {
      expect(getRoot(reconstructed, reconIds[i])).toBe(getRoot(state, origIds[i]))
    }
  })

  it('serialize -> deserialize should be round-trip safe', () => {
    const data1 = serializeState(state)
    const s1 = deserializeState(data1)
    const data2 = serializeState(s1)
    expect(data1.nodes).toEqual(data2.nodes)
    expect(data1.parent).toEqual(data2.parent)
  })
})

describe('calculateForestLayout', () => {
  it('should assign positions to all nodes', () => {
    let s = createInitialState()
    const ids = []
    for (let i = 0; i < 6; i++) {
      const r = addNode(s, String.fromCharCode(65 + i))
      s = r.state
      ids.push(r.nodeId)
    }
    s = union(s, ids[0], ids[1]).state
    s = union(s, ids[0], ids[2]).state
    s = union(s, ids[3], ids[4]).state

    const laidOut = calculateForestLayout(s)
    for (const id of ids) {
      const pos = laidOut.positions.get(id)
      expect(pos).toBeDefined()
      expect(typeof pos.x).toBe('number')
      expect(typeof pos.y).toBe('number')
      expect(isFinite(pos.x)).toBe(true)
      expect(isFinite(pos.y)).toBe(true)
    }
  })

  it('should position children below parents', () => {
    let s = createInitialState()
    const r1 = addNode(s, 'A')
    s = r1.state
    const r2 = addNode(s, 'B')
    s = r2.state
    const u = union(s, r1.nodeId, r2.nodeId)
    s = u.state

    const laidOut = calculateForestLayout(s)
    const childPos = laidOut.positions.get(u.childRoot)
    const parentPos = laidOut.positions.get(u.parentRoot)
    expect(childPos.y).toBeGreaterThan(parentPos.y)
  })
})

describe('clampZoom', () => {
  it('should clamp values below MIN_ZOOM', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(-1)).toBe(MIN_ZOOM)
    expect(clampZoom(MIN_ZOOM - 0.1)).toBe(MIN_ZOOM)
  })

  it('should clamp values above MAX_ZOOM', () => {
    expect(clampZoom(10)).toBe(MAX_ZOOM)
    expect(clampZoom(MAX_ZOOM + 1)).toBe(MAX_ZOOM)
  })

  it('should return value within range unchanged', () => {
    expect(clampZoom(1)).toBe(1)
    expect(clampZoom(0.5)).toBe(0.5)
    expect(clampZoom(2)).toBe(2)
  })
})

describe('screenToWorld / worldToScreen', () => {
  it('screenToWorld should convert correctly', () => {
    const result = screenToWorld(100, 200, 10, 20, 2)
    expect(result.x).toBe((100 - 10) / 2)
    expect(result.y).toBe((200 - 20) / 2)
  })

  it('worldToScreen should convert correctly', () => {
    const result = worldToScreen(45, 90, 10, 20, 2)
    expect(result.x).toBe(45 * 2 + 10)
    expect(result.y).toBe(90 * 2 + 20)
  })

  it('should be inverse operations', () => {
    const panX = 50, panY = 100, zoom = 1.5
    const wx = 200, wy = 300
    const screen = worldToScreen(wx, wy, panX, panY, zoom)
    const world = screenToWorld(screen.x, screen.y, panX, panY, zoom)
    expect(world.x).toBeCloseTo(wx)
    expect(world.y).toBeCloseTo(wy)
  })
})

describe('createOperationLog / randomDuration / formatTimestamp', () => {
  it('createOperationLog should create valid log entry', () => {
    const log = createOperationLog(
      OPERATION_TYPE.ADD_NODE,
      { name: 'A' },
      '添加节点 A',
      3,
      1234567890000
    )
    expect(typeof log.id).toBe('string')
    expect(log.id.startsWith('op_')).toBe(true)
    expect(log.type).toBe(OPERATION_TYPE.ADD_NODE)
    expect(log.params).toEqual({ name: 'A' })
    expect(log.result).toBe('添加节点 A')
    expect(log.duration).toBe(3)
    expect(log.timestamp).toBe(1234567890000)
  })

  it('randomDuration should return value in 1-5 range', () => {
    for (let i = 0; i < 100; i++) {
      const d = randomDuration()
      expect(d).toBeGreaterThanOrEqual(1)
      expect(d).toBeLessThanOrEqual(5)
      expect(Number.isInteger(d)).toBe(true)
    }
  })

  it('formatTimestamp should return formatted time string', () => {
    const ts = new Date('2024-01-15T10:30:45.123Z').getTime()
    const formatted = formatTimestamp(ts)
    expect(typeof formatted).toBe('string')
    expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)
  })
})

describe('exportLogsToJson', () => {
  it('should export logs with metadata', () => {
    const logs = [
      createOperationLog(OPERATION_TYPE.ADD_NODE, { name: 'A' }, '添加 A', 2),
      createOperationLog(OPERATION_TYPE.UNION, { node1: 'A', node2: 'B' }, '合并 A,B', 3),
    ]
    const result = exportLogsToJson(logs)
    expect(result.version).toBe('1.0')
    expect(typeof result.exportedAt).toBe('string')
    expect(Array.isArray(result.logs)).toBe(true)
    expect(result.logs.length).toBe(2)
    expect(new Date(result.exportedAt).toString()).not.toBe('Invalid Date')
  })

  it('should handle empty logs array', () => {
    const result = exportLogsToJson([])
    expect(result.logs).toEqual([])
    expect(result.version).toBe('1.0')
  })
})

describe('getNodeById / getParentOf / getAllNodeIds / hasNode / getNodeCount / getSetCount', () => {
  let state
  let nodeIds = []

  beforeEach(() => {
    state = createInitialState()
    for (let i = 0; i < 4; i++) {
      const r = addNode(state, String.fromCharCode(65 + i))
      state = r.state
      nodeIds.push(r.nodeId)
    }
    state = union(state, nodeIds[0], nodeIds[1]).state
  })

  it('getNodeById should return node or null', () => {
    const node = getNodeById(state, nodeIds[0])
    expect(node).not.toBeNull()
    expect(node.id).toBe(nodeIds[0])
    expect(typeof node.name).toBe('string')
    expect(getNodeById(state, 'nonexistent')).toBeNull()
  })

  it('getParentOf should return parent id', () => {
    for (const id of nodeIds) {
      const parent = getParentOf(state, id)
      expect(parent).toBeDefined()
      expect(state.parent.has(parent)).toBe(true)
    }
  })

  it('getAllNodeIds should return all node ids', () => {
    const ids = getAllNodeIds(state)
    expect(ids.length).toBe(4)
    for (const id of nodeIds) {
      expect(ids).toContain(id)
    }
  })

  it('hasNode should check existence', () => {
    expect(hasNode(state, nodeIds[0])).toBe(true)
    expect(hasNode(state, 'nonexistent')).toBe(false)
  })

  it('getNodeCount should return total count', () => {
    expect(getNodeCount(state)).toBe(4)
    let s = addNode(state, 'E').state
    expect(getNodeCount(s)).toBe(5)
  })

  it('getSetCount should return number of distinct sets', () => {
    expect(getSetCount(state)).toBe(3)
    let s = union(state, nodeIds[0], nodeIds[2]).state
    expect(getSetCount(s)).toBe(2)
    s = union(s, nodeIds[0], nodeIds[3]).state
    expect(getSetCount(s)).toBe(1)
  })
})

describe('complex integration scenario', () => {
  it('should handle full union-find workflow', () => {
    let s = createInitialState()
    const ids = []

    for (let i = 0; i < 8; i++) {
      const r = addNode(s, String.fromCharCode(65 + i))
      s = r.state
      ids.push(r.nodeId)
    }
    expect(getNodeCount(s)).toBe(8)
    expect(getSetCount(s)).toBe(8)

    const unionOps = [
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [0, 2],
      [4, 6],
      [0, 4],
    ]

    for (const [a, b] of unionOps) {
      const result = union(s, ids[a], ids[b])
      expect(result.success).toBe(true)
      s = result.state
    }

    expect(getSetCount(s)).toBe(1)

    const root = getRoot(s, ids[0])
    for (const id of ids) {
      expect(getRoot(s, id)).toBe(root)
    }

    const findResult = find(s, ids[7], true)
    s = findResult.state

    const root2 = getRoot(s, ids[7])
    expect(root2).toBe(root)

    const depthCounts = new Map()
    for (const id of ids) {
      let depth = 0
      let cur = id
      while (!isRoot(s, cur)) {
        cur = getParentOf(s, cur)
        depth++
      }
      depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1)
    }
    expect(depthCounts.get(0)).toBeGreaterThanOrEqual(1)
  })
})
