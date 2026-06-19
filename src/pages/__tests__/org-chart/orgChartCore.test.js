import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isValidNode,
  findNodeById,
  findParentNode,
  isDescendant,
  getNodeDepth,
  countDescendants,
  traverseBFS,
  traverseDFS,
  addChildNode,
  addSiblingNode,
  updateNode,
  deleteNode,
  moveNode,
  reorderSiblings,
  cloneTree,
  calculateLayout,
  getLayoutBounds,
  fitToView,
  clampZoom,
  changeNodeType,
  exportToJson,
  importFromJson,
  loadFromStorage,
  saveToStorage,
  getSiblings,
  getPrevSibling,
  getNextSibling,
  getNodePath,
  countNodesByType,
  getMaxDepth,
} from '../../org-chart/orgChartCore'
import {
  STORAGE_KEY,
  NODE_TYPES,
  LAYOUT_DIRECTIONS,
  NODE_WIDTH,
  NODE_HEIGHT,
  MIN_ZOOM,
  MAX_ZOOM,
  getDefaultData,
  generateId,
} from '../../org-chart/constants'

const createTestTree = () => ({
  id: 'root',
  type: NODE_TYPES.DEPARTMENT,
  name: '总公司',
  email: '',
  phone: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  children: [
    {
      id: 'dept1',
      type: NODE_TYPES.DEPARTMENT,
      name: '技术部',
      email: '',
      phone: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      children: [
        {
          id: 'pos1',
          type: NODE_TYPES.POSITION,
          name: '工程师',
          email: '',
          phone: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          children: [
            {
              id: 'person1',
              type: NODE_TYPES.PERSON,
              name: '张三',
              email: 'zhangsan@test.com',
              phone: '13800000001',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              children: [],
            },
            {
              id: 'person2',
              type: NODE_TYPES.PERSON,
              name: '李四',
              email: 'lisi@test.com',
              phone: '13800000002',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'dept2',
      type: NODE_TYPES.DEPARTMENT,
      name: '产品部',
      email: '',
      phone: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      children: [],
    },
  ],
})

describe('基础工具函数', () => {
  describe('generateId', () => {
    it('应该生成带前缀的唯一 ID', () => {
      const id1 = generateId('node')
      const id2 = generateId('dept')
      expect(id1.startsWith('node-')).toBe(true)
      expect(id2.startsWith('dept-')).toBe(true)
      expect(id1).not.toBe(id2)
    })

    it('连续调用应该生成不同的 ID', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('isValidNode', () => {
    it('应该正确验证有效节点', () => {
      const validNode = createTestTree()
      expect(isValidNode(validNode)).toBe(true)
    })

    it('应该拒绝 null 或 undefined', () => {
      expect(isValidNode(null)).toBe(false)
      expect(isValidNode(undefined)).toBe(false)
    })

    it('应该拒绝缺少 id 的节点', () => {
      const node = { ...createTestTree(), id: undefined }
      expect(isValidNode(node)).toBe(false)
    })

    it('应该拒绝无效类型的节点', () => {
      const node = { ...createTestTree(), type: 'invalid-type' }
      expect(isValidNode(node)).toBe(false)
    })

    it('应该拒绝 children 不是数组的节点', () => {
      const node = { ...createTestTree(), children: 'not-array' }
      expect(isValidNode(node)).toBe(false)
    })

    it('应该递归验证子节点', () => {
      const tree = createTestTree()
      tree.children[0].children[0].type = 'invalid'
      expect(isValidNode(tree)).toBe(false)
    })
  })
})

describe('树形结构查询', () => {
  let testTree

  beforeEach(() => {
    testTree = createTestTree()
  })

  describe('findNodeById', () => {
    it('应该找到根节点', () => {
      const node = findNodeById(testTree, 'root')
      expect(node).not.toBeNull()
      expect(node.name).toBe('总公司')
    })

    it('应该找到深层子节点', () => {
      const node = findNodeById(testTree, 'person1')
      expect(node).not.toBeNull()
      expect(node.name).toBe('张三')
    })

    it('找不到时应该返回 null', () => {
      expect(findNodeById(testTree, 'not-exist')).toBeNull()
    })

    it('根节点为 null 时应该返回 null', () => {
      expect(findNodeById(null, 'root')).toBeNull()
    })
  })

  describe('findParentNode', () => {
    it('应该找到子节点的父节点', () => {
      const parent = findParentNode(testTree, 'dept1')
      expect(parent).not.toBeNull()
      expect(parent.id).toBe('root')
    })

    it('应该找到深层节点的父节点', () => {
      const parent = findParentNode(testTree, 'person1')
      expect(parent).not.toBeNull()
      expect(parent.id).toBe('pos1')
    })

    it('根节点没有父节点应该返回 null', () => {
      expect(findParentNode(testTree, 'root')).toBeNull()
    })
  })

  describe('isDescendant', () => {
    it('应该正确判断后代关系', () => {
      expect(isDescendant(testTree, 'root', 'dept1')).toBe(true)
      expect(isDescendant(testTree, 'dept1', 'person1')).toBe(true)
      expect(isDescendant(testTree, 'root', 'person1')).toBe(true)
      expect(isDescendant(testTree, 'dept1', 'dept2')).toBe(false)
    })

    it('节点不应该是自己的后代', () => {
      expect(isDescendant(testTree, 'root', 'root')).toBe(false)
    })
  })

  describe('getNodeDepth', () => {
    it('根节点深度应该为 0', () => {
      expect(getNodeDepth(testTree, 'root')).toBe(0)
    })

    it('应该正确计算各级深度', () => {
      expect(getNodeDepth(testTree, 'dept1')).toBe(1)
      expect(getNodeDepth(testTree, 'pos1')).toBe(2)
      expect(getNodeDepth(testTree, 'person1')).toBe(3)
    })

    it('不存在的节点应该返回 -1', () => {
      expect(getNodeDepth(testTree, 'not-exist')).toBe(-1)
    })
  })

  describe('countDescendants', () => {
    it('应该正确计算后代数量', () => {
      expect(countDescendants(testTree)).toBe(5)
      const dept1 = findNodeById(testTree, 'dept1')
      expect(countDescendants(dept1)).toBe(3)
      const pos1 = findNodeById(testTree, 'pos1')
      expect(countDescendants(pos1)).toBe(2)
    })

    it('叶子节点后代数量应该为 0', () => {
      const person1 = findNodeById(testTree, 'person1')
      expect(countDescendants(person1)).toBe(0)
    })
  })

  describe('traverseBFS', () => {
    it('应该按广度优先顺序遍历', () => {
      const visited = []
      traverseBFS(testTree, (node) => visited.push(node.id))
      expect(visited).toEqual(['root', 'dept1', 'dept2', 'pos1', 'person1', 'person2'])
    })
  })

  describe('traverseDFS', () => {
    it('应该按深度优先顺序遍历', () => {
      const visited = []
      traverseDFS(testTree, (node) => visited.push(node.id))
      expect(visited).toEqual(['root', 'dept1', 'pos1', 'person1', 'person2', 'dept2'])
    })
  })

  describe('getSiblings', () => {
    it('根节点的兄弟节点应该只有自己', () => {
      expect(getSiblings(testTree, 'root')).toHaveLength(1)
    })

    it('应该返回所有同级节点', () => {
      const siblings = getSiblings(testTree, 'dept1')
      expect(siblings).toHaveLength(2)
      expect(siblings.map((s) => s.id)).toContain('dept2')
    })
  })

  describe('getPrevSibling', () => {
    it('应该返回前一个兄弟节点', () => {
      const prev = getPrevSibling(testTree, 'dept2')
      expect(prev).not.toBeNull()
      expect(prev.id).toBe('dept1')
    })

    it('第一个兄弟节点应该返回 null', () => {
      expect(getPrevSibling(testTree, 'dept1')).toBeNull()
    })
  })

  describe('getNextSibling', () => {
    it('应该返回后一个兄弟节点', () => {
      const next = getNextSibling(testTree, 'dept1')
      expect(next).not.toBeNull()
      expect(next.id).toBe('dept2')
    })

    it('最后一个兄弟节点应该返回 null', () => {
      expect(getNextSibling(testTree, 'dept2')).toBeNull()
    })
  })

  describe('getNodePath', () => {
    it('应该返回从根到节点的完整路径', () => {
      const path = getNodePath(testTree, 'person1')
      expect(path).toHaveLength(4)
      expect(path[0].id).toBe('root')
      expect(path[path.length - 1].id).toBe('person1')
    })

    it('根节点路径应该只包含自己', () => {
      const path = getNodePath(testTree, 'root')
      expect(path).toHaveLength(1)
    })

    it('不存在的节点应该返回空路径', () => {
      expect(getNodePath(testTree, 'not-exist')).toEqual([])
    })
  })

  describe('countNodesByType', () => {
    it('应该正确统计各类型节点数量', () => {
      const counts = countNodesByType(testTree)
      expect(counts[NODE_TYPES.DEPARTMENT]).toBe(3)
      expect(counts[NODE_TYPES.POSITION]).toBe(1)
      expect(counts[NODE_TYPES.PERSON]).toBe(2)
    })
  })

  describe('getMaxDepth', () => {
    it('应该返回树的最大深度', () => {
      expect(getMaxDepth(testTree)).toBe(3)
    })
  })
})

describe('树形结构增删改操作', () => {
  let testTree

  beforeEach(() => {
    testTree = createTestTree()
  })

  describe('addChildNode', () => {
    it('应该添加子节点', () => {
      const { tree, newNodeId } = addChildNode(testTree, 'dept2', NODE_TYPES.POSITION, '产品经理')
      expect(newNodeId).not.toBeNull()
      const dept2 = findNodeById(tree, 'dept2')
      expect(dept2.children).toHaveLength(1)
      expect(dept2.children[0].name).toBe('产品经理')
    })

    it('不指定名称时应该使用默认名称', () => {
      const { tree, newNodeId } = addChildNode(testTree, 'dept2', NODE_TYPES.PERSON)
      const newNode = findNodeById(tree, newNodeId)
      expect(newNode.name).toBe('新人员')
    })

    it('无效父节点应该返回原结构', () => {
      const { tree, newNodeId } = addChildNode(testTree, 'not-exist', NODE_TYPES.POSITION)
      expect(newNodeId).toBeNull()
      expect(tree).toEqual(testTree)
    })

    it('不应该修改原树', () => {
      const originalCount = countDescendants(testTree)
      addChildNode(testTree, 'dept2', NODE_TYPES.POSITION)
      expect(countDescendants(testTree)).toBe(originalCount)
    })
  })

  describe('addSiblingNode', () => {
    it('应该在兄弟节点后添加', () => {
      const { tree, newNodeId } = addSiblingNode(testTree, 'dept1', NODE_TYPES.DEPARTMENT, '运营部')
      const parent = findNodeById(tree, 'root')
      expect(parent.children).toHaveLength(3)
      const idx = parent.children.findIndex((c) => c.id === 'dept1')
      expect(parent.children[idx + 1].id).toBe(newNodeId)
    })

    it('根节点添加兄弟应该作为子节点添加', () => {
      const { tree, newNodeId } = addSiblingNode(testTree, 'root', NODE_TYPES.DEPARTMENT)
      expect(newNodeId).not.toBeNull()
      expect(findNodeById(tree, newNodeId)).not.toBeNull()
    })
  })

  describe('updateNode', () => {
    it('应该正确更新节点字段', () => {
      const oldTime = testTree.children[0].children[0].children[0].updatedAt
      vi.useFakeTimers().setSystemTime(oldTime + 100000)
      const updated = updateNode(testTree, 'person1', { name: '张小三', email: 'new@test.com' })
      vi.useRealTimers()
      const node = findNodeById(updated, 'person1')
      expect(node.name).toBe('张小三')
      expect(node.email).toBe('new@test.com')
      expect(node.updatedAt).toBeGreaterThan(oldTime)
    })

    it('不应该修改不允许的字段', () => {
      const updated = updateNode(testTree, 'pos1', { id: 'hacked-pos1', children: [] })
      const node = findNodeById(updated, 'pos1')
      expect(node).not.toBeNull()
      expect(node.id).toBe('pos1')
      expect(node.children).toHaveLength(2)
      const hackedNode = findNodeById(updated, 'hacked-pos1')
      expect(hackedNode).toBeNull()
    })

    it('不存在的节点应该返回原树', () => {
      const updated = updateNode(testTree, 'not-exist', { name: 'x' })
      expect(updated).toEqual(testTree)
    })
  })

  describe('deleteNode', () => {
    it('应该删除节点及其所有子节点', () => {
      const deleted = deleteNode(testTree, 'dept1')
      expect(findNodeById(deleted, 'dept1')).toBeNull()
      expect(findNodeById(deleted, 'pos1')).toBeNull()
      expect(findNodeById(deleted, 'person1')).toBeNull()
    })

    it('不应该删除根节点', () => {
      const deleted = deleteNode(testTree, 'root')
      expect(deleted).toBe(testTree)
    })

    it('不存在的节点应该返回原树', () => {
      const deleted = deleteNode(testTree, 'not-exist')
      expect(deleted).toEqual(testTree)
    })
  })

  describe('moveNode', () => {
    it('应该将节点移动为目标节点的子节点', () => {
      const moved = moveNode(testTree, 'dept2', 'dept1', 'child')
      const dept1 = findNodeById(moved, 'dept1')
      expect(dept1.children.map((c) => c.id)).toContain('dept2')
      const root = findNodeById(moved, 'root')
      expect(root.children.map((c) => c.id)).not.toContain('dept2')
    })

    it('不应该将节点移动到自己的后代中', () => {
      const moved = moveNode(testTree, 'dept1', 'person1', 'child')
      expect(moved).toEqual(testTree)
    })

    it('不应该将节点移动到自己', () => {
      const moved = moveNode(testTree, 'dept1', 'dept1', 'child')
      expect(moved).toEqual(testTree)
    })

    it('应该支持在兄弟节点前插入', () => {
      const moved = moveNode(testTree, 'dept2', 'dept1', 'before')
      const root = findNodeById(moved, 'root')
      expect(root.children[0].id).toBe('dept2')
      expect(root.children[1].id).toBe('dept1')
    })
  })

  describe('reorderSiblings', () => {
    it('应该正确调整同级顺序', () => {
      let tree = addChildNode(testTree, 'root', NODE_TYPES.DEPARTMENT, 'C').tree
      tree = addChildNode(tree, 'root', NODE_TYPES.DEPARTMENT, 'D').tree
      const root = findNodeById(tree, 'root')
      const dept2Id = root.children.findIndex((c) => c.id === 'dept2')
      const reordered = reorderSiblings(tree, 'dept2', 0)
      const newRoot = findNodeById(reordered, 'root')
      expect(newRoot.children[0].id).toBe('dept2')
    })

    it('超出范围的索引应该被限制', () => {
      const reordered = reorderSiblings(testTree, 'dept1', 999)
      const root = findNodeById(reordered, 'root')
      expect(root.children[root.children.length - 1].id).toBe('dept1')
    })
  })

  describe('cloneTree', () => {
    it('应该深度克隆整个树', () => {
      const cloned = cloneTree(testTree)
      expect(cloned).toEqual(testTree)
      expect(cloned).not.toBe(testTree)
      expect(cloned.children[0]).not.toBe(testTree.children[0])
    })

    it('应该正确克隆子节点数组', () => {
      const cloned = cloneTree(testTree)
      cloned.children[0].children.push({ id: 'fake' })
      expect(testTree.children[0].children).not.toContainEqual({ id: 'fake' })
    })
  })

  describe('changeNodeType', () => {
    it('应该正确切换节点类型', () => {
      const changed = changeNodeType(testTree, 'pos1', NODE_TYPES.DEPARTMENT)
      const node = findNodeById(changed, 'pos1')
      expect(node.type).toBe(NODE_TYPES.DEPARTMENT)
    })

    it('无效类型应该返回原树', () => {
      const changed = changeNodeType(testTree, 'pos1', 'invalid')
      expect(changed).toEqual(testTree)
    })
  })
})

describe('布局计算', () => {
  let testTree

  beforeEach(() => {
    testTree = createTestTree()
  })

  describe('calculateLayout (纵向布局)', () => {
    it('应该为每个节点生成位置信息', () => {
      const positions = calculateLayout(testTree, LAYOUT_DIRECTIONS.VERTICAL)
      expect(positions.size).toBe(6)
      for (const pos of positions.values()) {
        expect(pos).toHaveProperty('x')
        expect(pos).toHaveProperty('y')
        expect(pos).toHaveProperty('width')
        expect(pos).toHaveProperty('height')
        expect(pos).toHaveProperty('depth')
      }
    })

    it('根节点应该在最顶部', () => {
      const positions = calculateLayout(testTree, LAYOUT_DIRECTIONS.VERTICAL)
      const rootPos = positions.get('root')
      expect(rootPos.y).toBe(0)
      expect(rootPos.depth).toBe(0)
    })

    it('子节点 y 坐标应该大于父节点', () => {
      const positions = calculateLayout(testTree, LAYOUT_DIRECTIONS.VERTICAL)
      const rootPos = positions.get('root')
      const dept1Pos = positions.get('dept1')
      expect(dept1Pos.y).toBeGreaterThan(rootPos.y)
    })
  })

  describe('calculateLayout (横向布局)', () => {
    it('根节点应该在最左侧', () => {
      const positions = calculateLayout(testTree, LAYOUT_DIRECTIONS.HORIZONTAL)
      const rootPos = positions.get('root')
      expect(rootPos.x).toBe(0)
      expect(rootPos.depth).toBe(0)
    })

    it('子节点 x 坐标应该大于父节点', () => {
      const positions = calculateLayout(testTree, LAYOUT_DIRECTIONS.HORIZONTAL)
      const rootPos = positions.get('root')
      const dept1Pos = positions.get('dept1')
      expect(dept1Pos.x).toBeGreaterThan(rootPos.x)
    })
  })

  describe('getLayoutBounds', () => {
    it('应该正确计算布局边界', () => {
      const positions = calculateLayout(testTree, LAYOUT_DIRECTIONS.VERTICAL)
      const bounds = getLayoutBounds(positions)
      expect(bounds.minX).toBe(0)
      expect(bounds.minY).toBe(0)
      expect(bounds.width).toBeGreaterThan(0)
      expect(bounds.height).toBeGreaterThan(0)
      expect(bounds.maxX).toBe(bounds.minX + bounds.width)
      expect(bounds.maxY).toBe(bounds.minY + bounds.height)
    })

    it('空 Map 应该返回零边界', () => {
      const bounds = getLayoutBounds(new Map())
      expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 })
    })
  })

  describe('fitToView', () => {
    it('应该计算正确的平移和缩放', () => {
      const positions = calculateLayout(testTree, LAYOUT_DIRECTIONS.VERTICAL)
      const result = fitToView(positions, 1200, 800, 50)
      expect(result).toHaveProperty('panX')
      expect(result).toHaveProperty('panY')
      expect(result).toHaveProperty('zoom')
      expect(result.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
      expect(result.zoom).toBeLessThanOrEqual(MAX_ZOOM)
    })

    it('空布局应该返回默认值', () => {
      const result = fitToView(new Map(), 1000, 800)
      expect(result.zoom).toBe(1)
    })
  })

  describe('clampZoom', () => {
    it('应该将缩放值限制在范围内', () => {
      expect(clampZoom(0.1)).toBe(MIN_ZOOM)
      expect(clampZoom(3.0)).toBe(MAX_ZOOM)
      expect(clampZoom(1.0)).toBe(1.0)
      expect(clampZoom(0.5)).toBe(0.5)
    })
  })
})

describe('序列化与持久化', () => {
  let testTree

  beforeEach(() => {
    testTree = createTestTree()
  })

  describe('exportToJson', () => {
    it('应该生成包含 root 和 version 的对象', () => {
      const exported = exportToJson(testTree)
      expect(exported).toHaveProperty('root')
      expect(exported).toHaveProperty('version')
      expect(exported).toHaveProperty('exportedAt')
      expect(exported.root).toEqual(testTree)
    })
  })

  describe('importFromJson', () => {
    it('应该成功导入有效数据', () => {
      const exported = exportToJson(testTree)
      const result = importFromJson(exported)
      expect(result.valid).toBe(true)
      expect(result.data.root).toEqual(testTree)
    })

    it('应该拒绝 null', () => {
      const result = importFromJson(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('应该拒绝缺少 root 的对象', () => {
      const result = importFromJson({ foo: 'bar' })
      expect(result.valid).toBe(false)
    })

    it('应该拒绝无效节点结构', () => {
      const result = importFromJson({ root: { id: 'x' } })
      expect(result.valid).toBe(false)
    })
  })

  describe('saveToStorage 和 loadFromStorage', () => {
    let mockStorage
    let store = {}

    beforeEach(() => {
      store = {}
      mockStorage = {
        getItem: vi.fn((key) => (key in store ? store[key] : null)),
        setItem: vi.fn((key, value) => {
          store[key] = String(value)
        }),
      }
    })

    it('应该成功保存和加载数据', () => {
      const data = { root: testTree, version: 1 }
      const saveResult = saveToStorage(data, mockStorage)
      expect(saveResult).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(data)
      )

      const loaded = loadFromStorage(mockStorage)
      expect(loaded.root).toEqual(testTree)
    })

    it('localStorage 为空时应该返回默认数据', () => {
      const loaded = loadFromStorage(mockStorage)
      const defaults = getDefaultData()
      expect(loaded.root.id).toBe(defaults.root.id)
    })

    it('损坏的数据应该回退到默认值', () => {
      mockStorage.getItem = vi.fn(() => 'invalid json')
      const loaded = loadFromStorage(mockStorage)
      expect(loaded).toBeTruthy()
      expect(loaded.root).toBeTruthy()
    })

    it('缺少 root 的数据应该回退到默认值', () => {
      store[STORAGE_KEY] = JSON.stringify({ foo: 'bar' })
      const loaded = loadFromStorage(mockStorage)
      expect(loaded.root).toBeTruthy()
    })

    it('localStorage 抛错时 saveToStorage 应该返回 false', () => {
      const badStorage = {
        setItem: vi.fn(() => {
          throw new Error('full')
        }),
      }
      expect(saveToStorage({}, badStorage)).toBe(false)
    })
  })
})
