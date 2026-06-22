import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateId,
  createNode,
  updateNode,
  deleteNode,
  getNodeById,
  createEdge,
  deleteEdge,
  deleteEdgesByNodeId,
  hasCycle,
  validateEdge,
  topologicalSort,
  findStartNodes,
  findEndNodes,
  criticalPath,
  autoLayout,
  clampZoom,
  screenToWorld,
  worldToScreen,
  getNodePort,
  buildBezierPath,
  fitToView,
  safeGetItem,
  safeSetItem,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  exportToJson,
  importFromJson,
  MIN_ZOOM,
  MAX_ZOOM,
  NODE_WIDTH,
  NODE_HEIGHT,
} from '../../task-dag/taskDagCore.js'

describe('taskDagCore', () => {
  describe('generateId', () => {
    it('应该生成以指定前缀开头的字符串', () => {
      const id = generateId('test')
      expect(typeof id).toBe('string')
      expect(id.startsWith('test_')).toBe(true)
    })

    it('每次调用应生成不同的 ID', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId('node'))
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('createNode', () => {
    it('应该创建正确结构的节点', () => {
      const node = createNode('任务1', 100, 200)
      expect(node.id).toBeDefined()
      expect(node.name).toBe('任务1')
      expect(node.x).toBe(100)
      expect(node.y).toBe(200)
    })

    it('空名称应使用默认值', () => {
      const node = createNode('   ', 100, 200)
      expect(node.name).toBe('新任务')
    })

    it('未指定坐标应使用默认值', () => {
      const node = createNode('任务')
      expect(node.x).toBe(200)
      expect(node.y).toBe(200)
    })
  })

  describe('updateNode', () => {
    it('应该更新指定节点的属性', () => {
      const nodes = [
        { id: 'n1', name: 'A', x: 0, y: 0 },
        { id: 'n2', name: 'B', x: 100, y: 100 },
      ]
      const updated = updateNode(nodes, 'n1', { name: 'A2', x: 50 })
      expect(updated[0].name).toBe('A2')
      expect(updated[0].x).toBe(50)
      expect(updated[1]).toEqual(nodes[1])
    })

    it('非数组输入应返回空数组', () => {
      expect(updateNode(null, 'n1', {})).toEqual([])
    })
  })

  describe('deleteNode', () => {
    it('应该删除节点及相关边', () => {
      const nodes = [
        { id: 'n1', name: 'A', x: 0, y: 0 },
        { id: 'n2', name: 'B', x: 100, y: 100 },
        { id: 'n3', name: 'C', x: 200, y: 200 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
        { id: 'e3', from: 'n1', to: 'n3' },
      ]
      const result = deleteNode(nodes, edges, 'n2')
      expect(result.nodes).toHaveLength(2)
      expect(result.nodes.map((n) => n.id)).toEqual(['n1', 'n3'])
      expect(result.edges).toHaveLength(1)
      expect(result.edges[0].id).toBe('e3')
    })

    it('非数组输入应返回空结果', () => {
      const result = deleteNode(null, null, 'n1')
      expect(result.nodes).toEqual([])
      expect(result.edges).toEqual([])
    })
  })

  describe('getNodeById', () => {
    it('应该返回正确的节点', () => {
      const nodes = [
        { id: 'n1', name: 'A' },
        { id: 'n2', name: 'B' },
      ]
      expect(getNodeById(nodes, 'n1')).toEqual(nodes[0])
      expect(getNodeById(nodes, 'not-exist')).toBeNull()
    })

    it('非数组输入应返回 null', () => {
      expect(getNodeById(null, 'n1')).toBeNull()
    })
  })

  describe('createEdge', () => {
    it('应该创建正确结构的边', () => {
      const edge = createEdge('n1', 'n2')
      expect(edge.id).toBeDefined()
      expect(edge.from).toBe('n1')
      expect(edge.to).toBe('n2')
    })
  })

  describe('deleteEdge', () => {
    it('应该删除指定边', () => {
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
      ]
      const result = deleteEdge(edges, 'e1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('e2')
    })
  })

  describe('deleteEdgesByNodeId', () => {
    it('应该删除与节点相关的所有边', () => {
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
        { id: 'e3', from: 'n3', to: 'n4' },
      ]
      const result = deleteEdgesByNodeId(edges, 'n2')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('e3')
    })
  })

  describe('hasCycle', () => {
    it('空图应该无环', () => {
      expect(hasCycle([], [])).toBe(false)
    })

    it('单边无环图应该返回 false', () => {
      const nodes = [
        { id: 'n1', name: 'A', x: 0, y: 0 },
        { id: 'n2', name: 'B', x: 100, y: 0 },
      ]
      const edges = [{ id: 'e1', from: 'n1', to: 'n2' }]
      expect(hasCycle(nodes, edges)).toBe(false)
    })

    it('有环图应该返回 true', () => {
      const nodes = [
        { id: 'n1', name: 'A', x: 0, y: 0 },
        { id: 'n2', name: 'B', x: 100, y: 0 },
        { id: 'n3', name: 'C', x: 200, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
        { id: 'e3', from: 'n3', to: 'n1' },
      ]
      expect(hasCycle(nodes, edges)).toBe(true)
    })

    it('自环应该返回 true', () => {
      const nodes = [{ id: 'n1', name: 'A', x: 0, y: 0 }]
      const edges = [{ id: 'e1', from: 'n1', to: 'n1' }]
      expect(hasCycle(nodes, edges)).toBe(true)
    })

    it('复杂无环图应该返回 false', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 100, y: 0 },
        { id: 'n3', name: '3', x: 200, y: 0 },
        { id: 'n4', name: '4', x: 300, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n1', to: 'n3' },
        { id: 'e3', from: 'n2', to: 'n4' },
        { id: 'e4', from: 'n3', to: 'n4' },
      ]
      expect(hasCycle(nodes, edges)).toBe(false)
    })
  })

  describe('validateEdge', () => {
    it('缺少参数应返回错误', () => {
      const result = validateEdge([], [], null, 'n2')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('自连接应返回错误', () => {
      const nodes = [{ id: 'n1', name: 'A', x: 0, y: 0 }]
      const result = validateEdge(nodes, [], 'n1', 'n1')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('自身')
    })

    it('节点不存在应返回错误', () => {
      const nodes = [{ id: 'n1', name: 'A', x: 0, y: 0 }]
      const result = validateEdge(nodes, [], 'n1', 'n2')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('不存在')
    })

    it('重复边应返回错误', () => {
      const nodes = [
        { id: 'n1', name: 'A', x: 0, y: 0 },
        { id: 'n2', name: 'B', x: 100, y: 0 },
      ]
      const edges = [{ id: 'e1', from: 'n1', to: 'n2' }]
      const result = validateEdge(nodes, edges, 'n1', 'n2')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('已存在')
    })

    it('形成环路应返回错误', () => {
      const nodes = [
        { id: 'n1', name: 'A', x: 0, y: 0 },
        { id: 'n2', name: 'B', x: 100, y: 0 },
        { id: 'n3', name: 'C', x: 200, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
      ]
      const result = validateEdge(nodes, edges, 'n3', 'n1')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('环路')
    })

    it('有效边应返回成功', () => {
      const nodes = [
        { id: 'n1', name: 'A', x: 0, y: 0 },
        { id: 'n2', name: 'B', x: 100, y: 0 },
      ]
      const result = validateEdge(nodes, [], 'n1', 'n2')
      expect(result.valid).toBe(true)
    })
  })

  describe('topologicalSort', () => {
    it('空图应返回空数组', () => {
      expect(topologicalSort([], [])).toEqual([])
    })

    it('单节点应返回包含该节点的数组', () => {
      const nodes = [{ id: 'n1', name: 'A', x: 0, y: 0 }]
      const result = topologicalSort(nodes, [])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('n1')
    })

    it('线性链应正确排序', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 100, y: 0 },
        { id: 'n3', name: '3', x: 200, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
      ]
      const result = topologicalSort(nodes, edges)
      expect(result).toHaveLength(3)
      const ids = result.map((n) => n.id)
      expect(ids.indexOf('n1')).toBeLessThan(ids.indexOf('n2'))
      expect(ids.indexOf('n2')).toBeLessThan(ids.indexOf('n3'))
    })

    it('复杂 DAG 应满足拓扑顺序', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 100, y: 0 },
        { id: 'n3', name: '3', x: 200, y: 0 },
        { id: 'n4', name: '4', x: 300, y: 0 },
        { id: 'n5', name: '5', x: 400, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n1', to: 'n3' },
        { id: 'e3', from: 'n2', to: 'n4' },
        { id: 'e4', from: 'n3', to: 'n4' },
        { id: 'e5', from: 'n4', to: 'n5' },
      ]
      const result = topologicalSort(nodes, edges)
      expect(result).toHaveLength(5)
      const pos = new Map()
      result.forEach((n, i) => pos.set(n.id, i))
      expect(pos.get('n1')).toBeLessThan(pos.get('n2'))
      expect(pos.get('n1')).toBeLessThan(pos.get('n3'))
      expect(pos.get('n2')).toBeLessThan(pos.get('n4'))
      expect(pos.get('n3')).toBeLessThan(pos.get('n4'))
      expect(pos.get('n4')).toBeLessThan(pos.get('n5'))
    })

    it('有环图应返回空数组', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 100, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n1' },
      ]
      expect(topologicalSort(nodes, edges)).toEqual([])
    })
  })

  describe('findStartNodes', () => {
    it('应该找到所有入度为 0 的节点', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 100, y: 0 },
        { id: 'n3', name: '3', x: 200, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
      ]
      const result = findStartNodes(nodes, edges)
      expect(result.map((n) => n.id).sort()).toEqual(['n1', 'n3'])
    })
  })

  describe('findEndNodes', () => {
    it('应该找到所有出度为 0 的节点', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 100, y: 0 },
        { id: 'n3', name: '3', x: 200, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
      ]
      const result = findEndNodes(nodes, edges)
      expect(result.map((n) => n.id).sort()).toEqual(['n2', 'n3'])
    })
  })

  describe('criticalPath', () => {
    it('空图应返回空结果', () => {
      const result = criticalPath([], [])
      expect(result.nodes).toEqual([])
      expect(result.edges).toEqual([])
    })

    it('线性链关键路径应为整条链', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 100, y: 0 },
        { id: 'n3', name: '3', x: 200, y: 0 },
        { id: 'n4', name: '4', x: 300, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
        { id: 'e3', from: 'n3', to: 'n4' },
      ]
      const result = criticalPath(nodes, edges)
      expect(result.nodes).toEqual(['n1', 'n2', 'n3', 'n4'])
      expect(result.edges).toEqual(['e1', 'e2', 'e3'])
      expect(result.length).toBe(4)
    })

    it('多路径应选择最长的', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 100, y: 0 },
        { id: 'n3', name: '3', x: 100, y: 100 },
        { id: 'n4', name: '4', x: 200, y: 0 },
        { id: 'n5', name: '5', x: 200, y: 100 },
        { id: 'n6', name: '6', x: 300, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n1', to: 'n3' },
        { id: 'e3', from: 'n2', to: 'n4' },
        { id: 'e4', from: 'n3', to: 'n5' },
        { id: 'e5', from: 'n4', to: 'n6' },
        { id: 'e6', from: 'n5', to: 'n6' },
      ]
      const result = criticalPath(nodes, edges)
      expect(result.length).toBe(4)
      expect(result.nodes).toHaveLength(4)
    })

    it('有环图应返回空结果', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 100, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n1' },
      ]
      const result = criticalPath(nodes, edges)
      expect(result.nodes).toEqual([])
      expect(result.edges).toEqual([])
    })
  })

  describe('autoLayout', () => {
    it('空图应返回空数组', () => {
      expect(autoLayout([], [])).toEqual([])
    })

    it('单节点应设置合理坐标', () => {
      const nodes = [{ id: 'n1', name: 'A', x: 0, y: 0 }]
      const result = autoLayout(nodes, [])
      expect(result).toHaveLength(1)
      expect(result[0].x).toBeGreaterThan(0)
      expect(result[0].y).toBeGreaterThan(0)
    })

    it('线性链应按层次从左到右排列', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 0, y: 0 },
        { id: 'n3', name: '3', x: 0, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
      ]
      const result = autoLayout(nodes, edges)
      expect(result).toHaveLength(3)
      const nodeMap = new Map()
      result.forEach((n) => nodeMap.set(n.id, n))
      expect(nodeMap.get('n1').x).toBeLessThan(nodeMap.get('n2').x)
      expect(nodeMap.get('n2').x).toBeLessThan(nodeMap.get('n3').x)
    })

    it('多分支应按层次排列', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 0, y: 0 },
        { id: 'n3', name: '3', x: 0, y: 0 },
        { id: 'n4', name: '4', x: 0, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n1', to: 'n3' },
        { id: 'e3', from: 'n2', to: 'n4' },
        { id: 'e4', from: 'n3', to: 'n4' },
      ]
      const result = autoLayout(nodes, edges)
      expect(result).toHaveLength(4)
      const nodeMap = new Map()
      result.forEach((n) => nodeMap.set(n.id, n))
      expect(nodeMap.get('n1').x).toBeLessThan(nodeMap.get('n2').x)
      expect(nodeMap.get('n1').x).toBeLessThan(nodeMap.get('n3').x)
      expect(nodeMap.get('n2').x).toBeLessThan(nodeMap.get('n4').x)
      expect(nodeMap.get('n3').x).toBeLessThan(nodeMap.get('n4').x)
    })

    it('有环图应使用备用布局', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 0, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n1' },
      ]
      const result = autoLayout(nodes, edges)
      expect(result).toHaveLength(2)
    })

    it('所有节点都应在结果中', () => {
      const nodes = [
        { id: 'n1', name: '1', x: 0, y: 0 },
        { id: 'n2', name: '2', x: 0, y: 0 },
        { id: 'n3', name: '3', x: 0, y: 0 },
      ]
      const edges = []
      const result = autoLayout(nodes, edges)
      expect(result).toHaveLength(3)
      const ids = new Set(result.map((n) => n.id))
      expect(ids.has('n1')).toBe(true)
      expect(ids.has('n2')).toBe(true)
      expect(ids.has('n3')).toBe(true)
    })
  })

  describe('clampZoom', () => {
    it('应该将缩放限制在范围内', () => {
      expect(clampZoom(0.1)).toBe(MIN_ZOOM)
      expect(clampZoom(5)).toBe(MAX_ZOOM)
      expect(clampZoom(1)).toBe(1)
      expect(clampZoom(MIN_ZOOM)).toBe(MIN_ZOOM)
      expect(clampZoom(MAX_ZOOM)).toBe(MAX_ZOOM)
    })
  })

  describe('screenToWorld / worldToScreen', () => {
    it('应该正确转换坐标', () => {
      const panX = 50
      const panY = 100
      const zoom = 2

      const world = screenToWorld(250, 300, panX, panY, zoom)
      expect(world.x).toBe(100)
      expect(world.y).toBe(100)

      const screen = worldToScreen(100, 100, panX, panY, zoom)
      expect(screen.x).toBe(250)
      expect(screen.y).toBe(300)
    })

    it('两个转换应该互为逆操作', () => {
      const panX = 10
      const panY = 20
      const zoom = 0.5

      for (let x = 0; x <= 500; x += 100) {
        for (let y = 0; y <= 500; y += 100) {
          const world = screenToWorld(x, y, panX, panY, zoom)
          const screen = worldToScreen(world.x, world.y, panX, panY, zoom)
          expect(Math.abs(screen.x - x)).toBeLessThan(0.001)
          expect(Math.abs(screen.y - y)).toBeLessThan(0.001)
        }
      }
    })
  })

  describe('getNodePort', () => {
    it('应该返回正确的输出端口位置', () => {
      const node = { x: 100, y: 200 }
      const port = getNodePort(node, 'output')
      expect(port.x).toBe(100 + NODE_WIDTH)
      expect(port.y).toBe(200 + NODE_HEIGHT / 2)
    })

    it('应该返回正确的输入端口位置', () => {
      const node = { x: 100, y: 200 }
      const port = getNodePort(node, 'input')
      expect(port.x).toBe(100)
      expect(port.y).toBe(200 + NODE_HEIGHT / 2)
    })
  })

  describe('buildBezierPath', () => {
    it('应该生成有效的 SVG 贝塞尔曲线路径', () => {
      const from = { x: 0, y: 0 }
      const to = { x: 200, y: 100 }
      const path = buildBezierPath(from, to)
      expect(path.startsWith('M 0 0 C ')).toBe(true)
      expect(path.endsWith(', 200 100')).toBe(true)
    })
  })

  describe('fitToView', () => {
    it('空图应返回中心位置', () => {
      const result = fitToView([], 800, 600)
      expect(result.panX).toBe(400)
      expect(result.panY).toBe(300)
      expect(result.zoom).toBe(1)
    })

    it('单节点应居中显示', () => {
      const nodes = [{ id: 'n1', name: 'A', x: 0, y: 0 }]
      const result = fitToView(nodes, 800, 600)
      expect(result.zoom).toBeLessThanOrEqual(1)
      expect(result.zoom).toBeGreaterThan(0)
    })

    it('多个节点应全部可见', () => {
      const nodes = [
        { id: 'n1', name: 'A', x: 0, y: 0 },
        { id: 'n2', name: 'B', x: 500, y: 400 },
      ]
      const result = fitToView(nodes, 800, 600, 80)
      expect(result.zoom).toBeLessThanOrEqual(1)
      expect(result.zoom).toBeGreaterThan(0)
    })
  })

  describe('localStorage 操作', () => {
    let store = {}

    beforeEach(() => {
      store = {}
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => (key in store ? store[key] : null)),
        setItem: vi.fn((key, value) => {
          store[key] = String(value)
        }),
        removeItem: vi.fn((key) => {
          delete store[key]
        }),
        clear: vi.fn(() => {
          store = {}
        }),
      })
    })

    describe('safeGetItem / safeSetItem', () => {
      it('应该正确写入和读取 JSON', () => {
        safeSetItem('test-key', { a: 1, b: 'test' })
        expect(safeGetItem('test-key', null)).toEqual({ a: 1, b: 'test' })
      })

      it('key 不存在时应返回 fallback', () => {
        expect(safeGetItem('not-exist', 'fallback')).toBe('fallback')
      })

      it('无效 JSON 应返回 fallback', () => {
        localStorage.setItem('bad-key', '{invalid json')
        expect(safeGetItem('bad-key', 'fallback')).toBe('fallback')
      })

      it('setItem 失败时应返回 false', () => {
        vi.stubGlobal('localStorage', {
          getItem: vi.fn(),
          setItem: vi.fn(() => {
            throw new Error('quota exceeded')
          }),
          removeItem: vi.fn(),
          clear: vi.fn(),
        })
        expect(safeSetItem('k', 'v')).toBe(false)
      })
    })

    describe('loadFromStorage / saveToStorage', () => {
      it('初始状态应返回空图且无错误', () => {
        const result = loadFromStorage()
        expect(result.nodes).toEqual([])
        expect(result.edges).toEqual([])
        expect(result.error).toBeUndefined()
      })

      it('保存后应能读取且无错误', () => {
        const nodes = [{ id: 'n1', name: 'A', x: 0, y: 0 }]
        const edges = []
        expect(saveToStorage(nodes, edges)).toBe(true)
        const loaded = loadFromStorage()
        expect(loaded.nodes).toEqual(nodes)
        expect(loaded.edges).toEqual(edges)
        expect(loaded.error).toBeUndefined()
      })

      it('损坏的数据应返回空图和错误信息', () => {
        localStorage.setItem('task-dag-state', 'not json')
        const result = loadFromStorage()
        expect(result.nodes).toEqual([])
        expect(result.edges).toEqual([])
        expect(result.error).toBeDefined()
        expect(typeof result.error).toBe('string')
        expect(result.error.length).toBeGreaterThan(0)
      })

      it('格式错误的数据应返回空图和错误信息', () => {
        localStorage.setItem('task-dag-state', JSON.stringify({ invalid: true }))
        const result = loadFromStorage()
        expect(result.nodes).toEqual([])
        expect(result.edges).toEqual([])
        expect(result.error).toBeDefined()
        expect(typeof result.error).toBe('string')
        expect(result.error.length).toBeGreaterThan(0)
      })

      it('localStorage 异常时应返回错误信息', () => {
        const originalGetItem = localStorage.getItem
        vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
          throw new Error('Quota exceeded')
        })
        const result = loadFromStorage()
        expect(result.nodes).toEqual([])
        expect(result.edges).toEqual([])
        expect(result.error).toBeDefined()
        expect(result.error).toContain('读取本地存储失败')
        localStorage.getItem = originalGetItem
      })
    })

    describe('clearStorage', () => {
      it('应该清除存储', () => {
        saveToStorage([{ id: 'n1', name: 'A', x: 0, y: 0 }], [])
        const result = clearStorage()
        expect(result.success).toBe(true)
        expect(loadFromStorage().nodes).toEqual([])
      })
    })
  })

  describe('exportToJson', () => {
    it('应该导出正确的 JSON 结构', () => {
      const nodes = [
        { id: 'n1', name: '任务1', x: 100, y: 200 },
        { id: 'n2', name: '任务2', x: 300, y: 200 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
      ]
      const result = exportToJson(nodes, edges)
      expect(result.version).toBe('1.0')
      expect(result.nodes).toHaveLength(2)
      expect(result.nodes[0]).toEqual({
        id: 'n1',
        name: '任务1',
        x: 100,
        y: 200,
      })
      expect(result.edges[0]).toEqual({
        id: 'e1',
        from: 'n1',
        to: 'n2',
      })
    })
  })

  describe('importFromJson', () => {
    it('应该导入有效的 JSON 数据', () => {
      const json = {
        version: '1.0',
        nodes: [
          { id: 'n1', name: '任务1', x: 100, y: 200 },
          { id: 'n2', name: '任务2', x: 300, y: 200 },
        ],
        edges: [
          { id: 'e1', from: 'n1', to: 'n2' },
        ],
      }
      const result = importFromJson(json)
      expect(result.valid).toBe(true)
      expect(result.data.nodes).toHaveLength(2)
      expect(result.data.edges).toHaveLength(1)
    })

    it('无效的 JSON 应返回错误', () => {
      expect(importFromJson(null).valid).toBe(false)
      expect(importFromJson({}).valid).toBe(false)
      expect(importFromJson({ nodes: [] }).valid).toBe(false)
    })

    it('节点 id 无效应返回错误', () => {
      const json = {
        nodes: [{ id: 123, name: 'A', x: 0, y: 0 }],
        edges: [],
      }
      expect(importFromJson(json).valid).toBe(false)
    })

    it('边引用不存在的节点应返回错误', () => {
      const json = {
        nodes: [{ id: 'n1', name: 'A', x: 0, y: 0 }],
        edges: [{ id: 'e1', from: 'n1', to: 'n2' }],
      }
      expect(importFromJson(json).valid).toBe(false)
    })

    it('有环的图应拒绝导入', () => {
      const json = {
        nodes: [
          { id: 'n1', name: 'A', x: 0, y: 0 },
          { id: 'n2', name: 'B', x: 100, y: 0 },
        ],
        edges: [
          { id: 'e1', from: 'n1', to: 'n2' },
          { id: 'e2', from: 'n2', to: 'n1' },
        ],
      }
      const result = importFromJson(json)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('环路')
    })
  })

  describe('图数据结构集成测试', () => {
    it('完整工作流：创建图 → 检测无环 → 拓扑排序 → 关键路径', () => {
      const nodes = [
        createNode('需求分析', 0, 0),
        createNode('系统设计', 0, 0),
        createNode('编码开发', 0, 0),
        createNode('单元测试', 0, 0),
        createNode('集成测试', 0, 0),
        createNode('部署上线', 0, 0),
      ]

      const edges = [
        createEdge(nodes[0].id, nodes[1].id),
        createEdge(nodes[1].id, nodes[2].id),
        createEdge(nodes[2].id, nodes[3].id),
        createEdge(nodes[2].id, nodes[4].id),
        createEdge(nodes[3].id, nodes[4].id),
        createEdge(nodes[4].id, nodes[5].id),
      ]

      expect(hasCycle(nodes, edges)).toBe(false)

      const sorted = topologicalSort(nodes, edges)
      expect(sorted).toHaveLength(6)
      const pos = new Map()
      sorted.forEach((n, i) => pos.set(n.id, i))
      expect(pos.get(nodes[0].id)).toBeLessThan(pos.get(nodes[1].id))
      expect(pos.get(nodes[1].id)).toBeLessThan(pos.get(nodes[2].id))
      expect(pos.get(nodes[2].id)).toBeLessThan(pos.get(nodes[3].id))
      expect(pos.get(nodes[3].id)).toBeLessThan(pos.get(nodes[4].id))
      expect(pos.get(nodes[4].id)).toBeLessThan(pos.get(nodes[5].id))

      const cp = criticalPath(nodes, edges)
      expect(cp.length).toBe(6)
      expect(cp.nodes[0]).toBe(nodes[0].id)
      expect(cp.nodes[cp.nodes.length - 1]).toBe(nodes[5].id)
    })

    it('validateEdge 正确阻止环路形成', () => {
      const nodes = [
        { id: 'n1', name: 'A', x: 0, y: 0 },
        { id: 'n2', name: 'B', x: 100, y: 0 },
        { id: 'n3', name: 'C', x: 200, y: 0 },
      ]
      const edges = [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
      ]

      expect(validateEdge(nodes, edges, 'n1', 'n3').valid).toBe(true)

      const cycleResult = validateEdge(nodes, edges, 'n3', 'n1')
      expect(cycleResult.valid).toBe(false)
      expect(cycleResult.error).toContain('环路')

      const selfResult = validateEdge(nodes, edges, 'n2', 'n2')
      expect(selfResult.valid).toBe(false)
    })
  })
})
