import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  generateTagId,
  validateHexColor,
  validateTagName,
  isDuplicateName,
  validateTagData,
  flatToTree,
  treeToFlat,
  getChildIds,
  getAncestorIds,
  getTagById,
  getTagPath,
  isDescendant,
  canMoveTag,
  calculateMaxDepth,
  countRootTags,
  getTotalResourceCount,
  mergeTags,
  splitTag,
  moveTag,
  filterTagsByKeyword,
  paginateList,
  generateTrendData,
  getTopTags,
  tagsToCSV,
  parseCSV,
  validateCSVRow,
  validateImportData,
  batchCreateTags,
  getRandomResourceCount,
  getRandomPresetColor,
  computeTreeLines,
  computeChartNiceMax,
} from '../../tag-manager/utils.js'
import {
  DEFAULT_COLOR,
  PRESET_COLORS,
} from '../../tag-manager/constants.js'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

const makeFlatTags = () => [
  { id: 'tag_1', name: '前端', parentId: null, color: '#3b82f6', resourceCount: 10, order: 0 },
  { id: 'tag_2', name: '后端', parentId: null, color: '#22c55e', resourceCount: 8, order: 1 },
  { id: 'tag_3', name: 'React', parentId: 'tag_1', color: '#0ea5e9', resourceCount: 6, order: 0 },
  { id: 'tag_4', name: 'Vue', parentId: 'tag_1', color: '#10b981', resourceCount: 4, order: 1 },
  { id: 'tag_5', name: 'Hooks', parentId: 'tag_3', color: '#6366f1', resourceCount: 3, order: 0 },
  { id: 'tag_6', name: 'Node.js', parentId: 'tag_2', color: '#84cc16', resourceCount: 5, order: 0 },
]

const makeNestedTree = () => [
  {
    id: 'tag_1',
    name: '前端',
    parentId: null,
    color: '#3b82f6',
    resourceCount: 10,
    order: 0,
    children: [
      {
        id: 'tag_3',
        name: 'React',
        parentId: 'tag_1',
        color: '#0ea5e9',
        resourceCount: 6,
        order: 0,
        children: [
          {
            id: 'tag_5',
            name: 'Hooks',
            parentId: 'tag_3',
            color: '#6366f1',
            resourceCount: 3,
            order: 0,
            children: [],
          },
        ],
      },
      {
        id: 'tag_4',
        name: 'Vue',
        parentId: 'tag_1',
        color: '#10b981',
        resourceCount: 4,
        order: 1,
        children: [],
      },
    ],
  },
  {
    id: 'tag_2',
    name: '后端',
    parentId: null,
    color: '#22c55e',
    resourceCount: 8,
    order: 1,
    children: [
      {
        id: 'tag_6',
        name: 'Node.js',
        parentId: 'tag_2',
        color: '#84cc16',
        resourceCount: 5,
        order: 0,
        children: [],
      },
    ],
  },
]

describe('generateTagId', () => {
  it('生成的ID以 tag_ 开头', () => {
    expect(generateTagId()).toMatch(/^tag_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateTagId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('validateHexColor', () => {
  it('正确的HEX颜色返回true', () => {
    expect(validateHexColor('#3b82f6')).toBe(true)
    expect(validateHexColor('#FFFFFF')).toBe(true)
    expect(validateHexColor('#000000')).toBe(true)
    expect(validateHexColor('#AbCdEf')).toBe(true)
  })

  it('不正确的格式返回false', () => {
    expect(validateHexColor('3b82f6')).toBe(false)
    expect(validateHexColor('#3b82f')).toBe(false)
    expect(validateHexColor('#3b82f67')).toBe(false)
    expect(validateHexColor('#gggggg')).toBe(false)
    expect(validateHexColor('red')).toBe(false)
    expect(validateHexColor(null)).toBe(false)
    expect(validateHexColor(undefined)).toBe(false)
    expect(validateHexColor(123)).toBe(false)
  })

  it('自动trim空格', () => {
    expect(validateHexColor('  #3b82f6  ')).toBe(true)
  })
})

describe('validateTagName', () => {
  it('有效的标签名返回true', () => {
    expect(validateTagName('前端')).toBe(true)
    expect(validateTagName(' React ')).toBe(true)
    expect(validateTagName('A')).toBe(true)
    expect(validateTagName('123')).toBe(true)
  })

  it('无效的标签名返回false', () => {
    expect(validateTagName('')).toBe(false)
    expect(validateTagName('   ')).toBe(false)
    expect(validateTagName(null)).toBe(false)
    expect(validateTagName(undefined)).toBe(false)
    expect(validateTagName(123)).toBe(false)
  })
})

describe('isDuplicateName', () => {
  const tags = makeFlatTags()

  it('同级下重复名称返回true', () => {
    expect(isDuplicateName(tags, 'React', 'tag_1')).toBe(true)
    expect(isDuplicateName(tags, '前端', null)).toBe(true)
  })

  it('同级下不重复名称返回false', () => {
    expect(isDuplicateName(tags, 'Angular', 'tag_1')).toBe(false)
    expect(isDuplicateName(tags, 'DevOps', null)).toBe(false)
  })

  it('不同级下同名称不视为重复', () => {
    const tagsWithSameNameDiffLevel = [
      ...tags,
      { id: 'tag_7', name: 'React', parentId: 'tag_2', color: '#ef4444', resourceCount: 2, order: 1 },
    ]
    expect(isDuplicateName(tagsWithSameNameDiffLevel, 'React', 'tag_2')).toBe(true)
    expect(isDuplicateName(tagsWithSameNameDiffLevel, 'React', 'tag_1')).toBe(true)
    expect(isDuplicateName(tagsWithSameNameDiffLevel, 'React', null)).toBe(false)
  })

  it('排除自身ID', () => {
    expect(isDuplicateName(tags, 'React', 'tag_1', 'tag_3')).toBe(false)
  })

  it('空名称返回false', () => {
    expect(isDuplicateName(tags, '', null)).toBe(false)
  })
})

describe('validateTagData', () => {
  const tags = makeFlatTags()

  it('有效的数据返回空错误对象', () => {
    const result = validateTagData(tags, {
      name: 'Angular',
      parentId: 'tag_1',
      color: '#ef4444',
      resourceCount: 5,
    })
    expect(Object.keys(result).length).toBe(0)
  })

  it('名称为空时报错', () => {
    const result = validateTagData(tags, { name: '', parentId: null })
    expect(result.name).toBeTruthy()
  })

  it('同级名称重复时报错', () => {
    const result = validateTagData(tags, { name: 'React', parentId: 'tag_1' })
    expect(result.name).toBeTruthy()
  })

  it('颜色格式不正确时报错', () => {
    const result = validateTagData(tags, {
      name: '新标签',
      parentId: null,
      color: 'invalid',
    })
    expect(result.color).toBeTruthy()
  })

  it('颜色为空时不报错', () => {
    const result = validateTagData(tags, {
      name: '新标签',
      parentId: null,
      color: '',
    })
    expect(result.color).toBeFalsy()
  })

  it('资源计数为负时报错', () => {
    const result = validateTagData(tags, {
      name: '新标签',
      parentId: null,
      resourceCount: -1,
    })
    expect(result.resourceCount).toBeTruthy()
  })

  it('资源计数为小数时报错', () => {
    const result = validateTagData(tags, {
      name: '新标签',
      parentId: null,
      resourceCount: 3.14,
    })
    expect(result.resourceCount).toBeTruthy()
  })

  it('资源计数为非负整数时不报错', () => {
    const result1 = validateTagData(tags, { name: '新标签', parentId: null, resourceCount: 0 })
    const result2 = validateTagData(tags, { name: '新标签', parentId: null, resourceCount: 10 })
    expect(result1.resourceCount).toBeFalsy()
    expect(result2.resourceCount).toBeFalsy()
  })

  it('排除自身ID进行重复检查', () => {
    const result = validateTagData(tags, { name: 'React', parentId: 'tag_1' }, 'tag_3')
    expect(result.name).toBeFalsy()
  })
})

describe('flatToTree & treeToFlat', () => {
  it('flatToTree 正确转换扁平结构为树结构', () => {
    const flat = makeFlatTags()
    const tree = flatToTree(flat)
    expect(Array.isArray(tree)).toBe(true)
    expect(tree.length).toBe(2)
    expect(tree[0].id).toBe('tag_1')
    expect(tree[1].id).toBe('tag_2')
    expect(tree[0].children.length).toBe(2)
    expect(tree[0].children[0].id).toBe('tag_3')
    expect(tree[0].children[1].id).toBe('tag_4')
    expect(tree[0].children[0].children.length).toBe(1)
    expect(tree[0].children[0].children[0].id).toBe('tag_5')
  })

  it('treeToFlat 正确转换树结构为扁平结构', () => {
    const tree = makeNestedTree()
    const flat = treeToFlat(tree)
    expect(flat.length).toBe(6)
    expect(flat.every((t) => !t.children)).toBe(true)
    const ids = flat.map((t) => t.id).sort()
    expect(ids).toEqual(['tag_1', 'tag_2', 'tag_3', 'tag_4', 'tag_5', 'tag_6'])
  })

  it('flatToTree 保持同级的order排序', () => {
    const flat = [
      { id: 'b', name: 'B', parentId: null, color: '#000', resourceCount: 0, order: 1 },
      { id: 'a', name: 'A', parentId: null, color: '#000', resourceCount: 0, order: 0 },
      { id: 'c', name: 'C', parentId: null, color: '#000', resourceCount: 0, order: 2 },
    ]
    const tree = flatToTree(flat)
    expect(tree[0].id).toBe('a')
    expect(tree[1].id).toBe('b')
    expect(tree[2].id).toBe('c')
  })

  it('非数组输入返回空数组', () => {
    expect(flatToTree(null)).toEqual([])
    expect(flatToTree(undefined)).toEqual([])
    expect(treeToFlat(null)).toEqual([])
    expect(treeToFlat(undefined)).toEqual([])
  })

  it('双向转换保持数据一致性', () => {
    const original = makeFlatTags()
    const tree = flatToTree(original)
    const flat = treeToFlat(tree)
    const sortedOriginal = [...original].sort((a, b) => a.id.localeCompare(b.id))
    const sortedFlat = [...flat].sort((a, b) => a.id.localeCompare(b.id))
    expect(sortedFlat).toEqual(sortedOriginal)
  })
})

describe('getChildIds', () => {
  const tags = makeFlatTags()

  it('正确获取所有后代ID', () => {
    const childIds = getChildIds('tag_1', tags)
    expect(childIds.sort()).toEqual(['tag_3', 'tag_4', 'tag_5'].sort())
  })

  it('叶子节点返回空数组', () => {
    expect(getChildIds('tag_5', tags)).toEqual([])
    expect(getChildIds('tag_4', tags)).toEqual([])
  })

  it('不存在的节点返回空数组', () => {
    expect(getChildIds('not_exist', tags)).toEqual([])
  })
})

describe('getAncestorIds', () => {
  const tags = makeFlatTags()

  it('正确获取所有祖先ID', () => {
    const ancestors = getAncestorIds('tag_5', tags)
    expect(ancestors).toEqual(['tag_1', 'tag_3'])
  })

  it('根节点返回空数组', () => {
    expect(getAncestorIds('tag_1', tags)).toEqual([])
  })

  it('不存在的节点返回空数组', () => {
    expect(getAncestorIds('not_exist', tags)).toEqual([])
  })
})

describe('getTagById', () => {
  const tags = makeFlatTags()

  it('正确获取标签', () => {
    const tag = getTagById(tags, 'tag_3')
    expect(tag).toBeTruthy()
    expect(tag.id).toBe('tag_3')
    expect(tag.name).toBe('React')
  })

  it('不存在的ID返回null', () => {
    expect(getTagById(tags, 'not_exist')).toBe(null)
    expect(getTagById(null, 'tag_1')).toBe(null)
  })
})

describe('getTagPath', () => {
  const tags = makeFlatTags()

  it('正确获取标签路径', () => {
    const path = getTagPath(tags, 'tag_5')
    expect(path.length).toBe(3)
    expect(path[0].id).toBe('tag_1')
    expect(path[1].id).toBe('tag_3')
    expect(path[2].id).toBe('tag_5')
  })

  it('根节点路径只包含自己', () => {
    const path = getTagPath(tags, 'tag_1')
    expect(path.length).toBe(1)
    expect(path[0].id).toBe('tag_1')
  })

  it('不存在的节点返回空数组', () => {
    expect(getTagPath(tags, 'not_exist')).toEqual([])
  })
})

describe('isDescendant', () => {
  const tags = makeFlatTags()

  it('正确判断后代关系', () => {
    expect(isDescendant('tag_1', 'tag_5', tags)).toBe(true)
    expect(isDescendant('tag_1', 'tag_3', tags)).toBe(true)
    expect(isDescendant('tag_3', 'tag_5', tags)).toBe(true)
    expect(isDescendant('tag_1', 'tag_1', tags)).toBe(true)
  })

  it('正确判断非后代关系', () => {
    expect(isDescendant('tag_2', 'tag_5', tags)).toBe(false)
    expect(isDescendant('tag_5', 'tag_1', tags)).toBe(false)
    expect(isDescendant('tag_3', 'tag_4', tags)).toBe(false)
  })
})

describe('canMoveTag', () => {
  const tags = makeFlatTags()

  it('不能移动到自己', () => {
    expect(canMoveTag('tag_1', 'tag_1', tags, 'inside')).toBe(false)
  })

  it('不能移动到自己的子标签下', () => {
    expect(canMoveTag('tag_1', 'tag_5', tags, 'inside')).toBe(false)
    expect(canMoveTag('tag_1', 'tag_3', tags, 'inside')).toBe(false)
  })

  it('可以移动到非后代标签下', () => {
    expect(canMoveTag('tag_5', 'tag_2', tags, 'inside')).toBe(true)
    expect(canMoveTag('tag_3', 'tag_2', tags, 'inside')).toBe(true)
  })

  it('before/after 位置不检查后代', () => {
    expect(canMoveTag('tag_1', 'tag_3', tags, 'before')).toBe(true)
    expect(canMoveTag('tag_1', 'tag_5', tags, 'after')).toBe(true)
  })
})

describe('calculateMaxDepth', () => {
  const tags = makeFlatTags()

  it('正确计算最大层级深度', () => {
    expect(calculateMaxDepth(tags)).toBe(3)
  })

  it('空数组返回0', () => {
    expect(calculateMaxDepth([])).toBe(0)
    expect(calculateMaxDepth(null)).toBe(0)
  })

  it('只有根节点返回1', () => {
    expect(calculateMaxDepth([{ id: '1', parentId: null }])).toBe(1)
  })
})

describe('countRootTags', () => {
  const tags = makeFlatTags()

  it('正确计算根标签数量', () => {
    expect(countRootTags(tags)).toBe(2)
  })

  it('空数组返回0', () => {
    expect(countRootTags([])).toBe(0)
    expect(countRootTags(null)).toBe(0)
  })
})

describe('getTotalResourceCount', () => {
  const tags = makeFlatTags()

  it('正确计算总资源数', () => {
    expect(getTotalResourceCount(tags)).toBe(10 + 8 + 6 + 4 + 3 + 5)
  })

  it('空数组返回0', () => {
    expect(getTotalResourceCount([])).toBe(0)
    expect(getTotalResourceCount(null)).toBe(0)
  })
})

describe('mergeTags', () => {
  const tags = makeFlatTags()

  it('成功合并多个标签', () => {
    const result = mergeTags(tags, ['tag_3', 'tag_4', 'tag_5'], 'tag_1')
    expect(result.success).toBe(true)
    expect(result.mergedCount).toBe(3)
    expect(result.transferredResources).toBe(6 + 4 + 3)
    expect(result.tags.length).toBe(3)
    const mainTag = result.tags.find((t) => t.id === 'tag_1')
    expect(mainTag.resourceCount).toBe(10 + 6 + 4 + 3)
    expect(result.tags.some((t) => t.id === 'tag_3')).toBe(false)
    expect(result.tags.some((t) => t.id === 'tag_4')).toBe(false)
    expect(result.tags.some((t) => t.id === 'tag_5')).toBe(false)
  })

  it('合并两个标签', () => {
    const result = mergeTags(tags, ['tag_2'], 'tag_1')
    expect(result.success).toBe(true)
    expect(result.mergedCount).toBe(1)
    expect(result.transferredResources).toBe(8)
    const mainTag = result.tags.find((t) => t.id === 'tag_1')
    expect(mainTag.resourceCount).toBe(10 + 8)
  })

  it('目标标签包含在源ID中时自动过滤', () => {
    const result = mergeTags(tags, ['tag_1', 'tag_2'], 'tag_1')
    expect(result.success).toBe(true)
    expect(result.mergedCount).toBe(1)
  })

  it('源ID为空时返回失败', () => {
    const result = mergeTags(tags, [], 'tag_1')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('目标标签不存在时返回失败', () => {
    const result = mergeTags(tags, ['tag_2'], 'not_exist')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('splitTag', () => {
  const tags = makeFlatTags()

  it('成功拆分偶数资源的标签', () => {
    const result = splitTag(tags, 'tag_3', 'React Hooks 2')
    expect(result.success).toBe(true)
    expect(result.transferredResources).toBe(3)
    const original = result.tags.find((t) => t.id === 'tag_3')
    const newTag = result.tags.find((t) => t.id === result.newTag.id)
    expect(original.resourceCount).toBe(3)
    expect(newTag.resourceCount).toBe(3)
    expect(newTag.name).toBe('React Hooks 2')
    expect(newTag.parentId).toBe('tag_1')
  })

  it('成功拆分奇数资源的标签（向下取整）', () => {
    const tagsWithOdd = [
      ...tags,
      { id: 'tag_odd', name: '奇数', parentId: null, color: '#000', resourceCount: 7, order: 2 },
    ]
    const result = splitTag(tagsWithOdd, 'tag_odd', '奇数2')
    expect(result.success).toBe(true)
    expect(result.transferredResources).toBe(3)
    const original = result.tags.find((t) => t.id === 'tag_odd')
    expect(original.resourceCount).toBe(4)
    expect(result.newTag.resourceCount).toBe(3)
  })

  it('资源数为0时拆分成功（转移0个资源）', () => {
    const tagsWithZero = [
      { id: 'tag_zero', name: '零资源', parentId: null, color: '#000', resourceCount: 0, order: 0 },
    ]
    const result = splitTag(tagsWithZero, 'tag_zero', '零资源2')
    expect(result.success).toBe(true)
    expect(result.transferredResources).toBe(0)
  })

  it('新标签名为空时返回失败', () => {
    const result = splitTag(tags, 'tag_3', '')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('同级名称重复时返回失败', () => {
    const result = splitTag(tags, 'tag_3', 'Vue')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('源标签不存在时返回失败', () => {
    const result = splitTag(tags, 'not_exist', '新标签')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('使用默认颜色', () => {
    const result = splitTag(tags, 'tag_3', '新标签')
    expect(result.newTag.color).toBe(DEFAULT_COLOR)
  })

  it('使用指定颜色', () => {
    const result = splitTag(tags, 'tag_3', '新标签', '#ef4444')
    expect(result.newTag.color).toBe('#ef4444')
  })
})

describe('moveTag', () => {
  const tags = makeFlatTags()

  it('成功移入为子标签', () => {
    const result = moveTag(tags, 'tag_6', 'tag_1', 'inside')
    expect(result.success).toBe(true)
    const moved = result.tags.find((t) => t.id === 'tag_6')
    expect(moved.parentId).toBe('tag_1')
  })

  it('成功移到上方', () => {
    const result = moveTag(tags, 'tag_2', 'tag_1', 'before')
    expect(result.success).toBe(true)
    const tag1 = result.tags.find((t) => t.id === 'tag_1')
    const tag2 = result.tags.find((t) => t.id === 'tag_2')
    expect(tag1.parentId).toBe(null)
    expect(tag2.parentId).toBe(null)
    expect(tag2.order).toBeLessThan(tag1.order)
  })

  it('成功移到下方', () => {
    const result = moveTag(tags, 'tag_1', 'tag_2', 'after')
    expect(result.success).toBe(true)
    const tag1 = result.tags.find((t) => t.id === 'tag_1')
    const tag2 = result.tags.find((t) => t.id === 'tag_2')
    expect(tag1.order).toBeGreaterThan(tag2.order)
  })

  it('不能移动到自身的子标签下', () => {
    const result = moveTag(tags, 'tag_1', 'tag_5', 'inside')
    expect(result.success).toBe(false)
    expect(result.error).toContain('不能将标签移动到自身的子标签下')
  })

  it('不能移动到自己', () => {
    const result = moveTag(tags, 'tag_1', 'tag_1', 'inside')
    expect(result.success).toBe(false)
  })
})

describe('filterTagsByKeyword', () => {
  const tags = makeFlatTags()

  it('空关键词返回所有标签', () => {
    const result = filterTagsByKeyword(tags, '')
    expect(result.filtered.length).toBe(tags.length)
    expect(result.matchedIds.size).toBe(0)
    expect(result.expandedIds.size).toBe(0)
  })

  it('正确过滤匹配的标签', () => {
    const result = filterTagsByKeyword(tags, 'React')
    expect(result.matchedIds.has('tag_3')).toBe(true)
    expect(result.expandedIds.has('tag_1')).toBe(true)
    expect(result.filtered.some((t) => t.id === 'tag_3')).toBe(true)
    expect(result.filtered.some((t) => t.id === 'tag_1')).toBe(true)
    expect(result.filtered.some((t) => t.id === 'tag_5')).toBe(false)
    expect(result.filtered.length).toBe(2)
  })

  it('子节点匹配时自动展开父路径', () => {
    const result = filterTagsByKeyword(tags, 'Hooks')
    expect(result.matchedIds.has('tag_5')).toBe(true)
    expect(result.expandedIds.has('tag_1')).toBe(true)
    expect(result.expandedIds.has('tag_3')).toBe(true)
  })

  it('非数组输入返回空结果', () => {
    const result = filterTagsByKeyword(null, 'React')
    expect(result.filtered).toEqual([])
    expect(result.matchedIds.size).toBe(0)
  })

  it('不匹配时返回空数组', () => {
    const result = filterTagsByKeyword(tags, '不存在的关键词')
    expect(result.filtered).toEqual([])
    expect(result.matchedIds.size).toBe(0)
  })

  it('搜索不区分大小写', () => {
    const result1 = filterTagsByKeyword(tags, 'react')
    const result2 = filterTagsByKeyword(tags, 'REACT')
    expect(result1.matchedIds.size).toBe(result2.matchedIds.size)
  })
})

describe('paginateList', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }))

  it('正确分页第一页', () => {
    const result = paginateList(items, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe(1)
    expect(result.items[9].id).toBe(10)
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(25)
  })

  it('正确分页最后一页', () => {
    const result = paginateList(items, 3, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateList(items, 100, 10)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于1时修正', () => {
    const result = paginateList(items, 0, 10)
    expect(result.currentPage).toBe(1)
  })

  it('空数组返回第一页', () => {
    const result = paginateList([], 1, 10)
    expect(result.items).toEqual([])
    expect(result.totalPage).toBe(1)
  })

  it('非数组返回空分页结果', () => {
    const result = paginateList(null, 1, 10)
    expect(result.items).toEqual([])
    expect(result.totalPage).toBe(1)
  })
})

describe('generateTrendData', () => {
  const tags = makeFlatTags()

  it('生成正确天数的数据', () => {
    const result = generateTrendData(tags, 7)
    expect(result.length).toBe(7)
    result.forEach((day) => {
      expect(day.date).toBeTruthy()
      tags.forEach((tag) => {
        expect(day[tag.id]).toBeGreaterThanOrEqual(0)
        expect(day[tag.id]).toBeLessThanOrEqual(10)
        expect(Number.isInteger(day[tag.id])).toBe(true)
      })
    })
  })

  it('使用默认天数', () => {
    const result = generateTrendData(tags)
    expect(result.length).toBe(7)
  })

  it('日期格式正确', () => {
    const result = generateTrendData(tags, 1)
    expect(result[0].date).toMatch(/^\d{1,2}\/\d{1,2}$/)
  })
})

describe('getTopTags', () => {
  const tags = makeFlatTags()

  it('正确获取资源数最多的前N个标签', () => {
    const result = getTopTags(tags, 3)
    expect(result.length).toBe(3)
    expect(result[0].resourceCount).toBe(10)
    expect(result[1].resourceCount).toBe(8)
    expect(result[2].resourceCount).toBe(6)
  })

  it('标签数不足时返回全部', () => {
    const result = getTopTags(tags, 100)
    expect(result.length).toBe(6)
  })

  it('非数组返回空数组', () => {
    expect(getTopTags(null, 3)).toEqual([])
  })
})

describe('CSV operations', () => {
  const tags = makeFlatTags()

  describe('tagsToCSV', () => {
    it('空数组返回空字符串', () => {
      expect(tagsToCSV([], () => {})).toBe('')
      expect(tagsToCSV(null, () => {})).toBe('')
    })

    it('正确生成CSV内容', () => {
      const getParentName = (parentId) => {
        if (!parentId) return ''
        const parent = tags.find((t) => t.id === parentId)
        return parent ? parent.name : ''
      }
      const csv = tagsToCSV(tags, getParentName)
      expect(csv).toContain('标签名称')
      expect(csv).toContain('父标签名称')
      expect(csv).toContain('颜色 HEX')
      expect(csv).toContain('资源计数')
      expect(csv).toContain('前端')
      expect(csv).toContain('React')
      expect(csv).toContain('#3b82f6')
    })

    it('正确转义特殊字符', () => {
      const specialTags = [
        { id: '1', name: '标签,带逗号', parentId: null, color: '#000000', resourceCount: 5 },
        { id: '2', name: '标签"带引号"', parentId: null, color: '#ffffff', resourceCount: 3 },
      ]
      const csv = tagsToCSV(specialTags, () => '')
      expect(csv).toContain('"标签,带逗号"')
      expect(csv).toContain('"标签""带引号"""')
    })
  })

  describe('parseCSV', () => {
    it('空内容返回失败', () => {
      expect(parseCSV('').success).toBe(false)
      expect(parseCSV(null).success).toBe(false)
    })

    it('正确解析简单CSV', () => {
      const csv = '标签名称,父标签名称,颜色 HEX,资源计数\n前端,,#3b82f6,10\nReact,前端,#0ea5e9,6'
      const result = parseCSV(csv)
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(2)
      expect(result.data[0].name).toBe('前端')
      expect(result.data[0].color).toBe('#3b82f6')
      expect(result.data[1].parentName).toBe('前端')
    })

    it('正确处理带引号的字段', () => {
      const csv = '标签名称,父标签名称\n"标签,带逗号",'
      const result = parseCSV(csv)
      expect(result.success).toBe(true)
      expect(result.data[0].name).toBe('标签,带逗号')
    })

    it('正确处理BOM头', () => {
      const csv = '\uFEFF标签名称,父标签名称\n前端,'
      const result = parseCSV(csv)
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1)
    })

    it('跳过空行', () => {
      const csv = '标签名称\n\n前端\n\n'
      const result = parseCSV(csv)
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1)
    })
  })

  describe('validateCSVRow', () => {
    const existingTags = makeFlatTags()

    it('有效的行返回验证通过', () => {
      const result = validateCSVRow(
        { name: '新标签', parentName: '前端', color: '#ef4444', resourceCount: '5' },
        existingTags,
        2
      )
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })

    it('名称为空时报错', () => {
      const result = validateCSVRow(
        { name: '', parentName: '', color: '#ef4444', resourceCount: '5' },
        existingTags,
        2
      )
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBeTruthy()
    })

    it('颜色格式不正确时报错', () => {
      const result = validateCSVRow(
        { name: '新标签', parentName: '', color: 'invalid', resourceCount: '5' },
        existingTags,
        2
      )
      expect(result.valid).toBe(false)
      expect(result.errors.color).toBeTruthy()
    })

    it('父标签不存在时报错', () => {
      const result = validateCSVRow(
        { name: '新标签', parentName: '不存在', color: '#ef4444', resourceCount: '5' },
        existingTags,
        2
      )
      expect(result.valid).toBe(false)
      expect(result.errors.parentName).toBeTruthy()
    })

    it('资源计数为负时报错', () => {
      const result = validateCSVRow(
        { name: '新标签', parentName: '', color: '#ef4444', resourceCount: '-1' },
        existingTags,
        2
      )
      expect(result.valid).toBe(false)
      expect(result.errors.resourceCount).toBeTruthy()
    })

    it('资源计数为小数时报错', () => {
      const result = validateCSVRow(
        { name: '新标签', parentName: '', color: '#ef4444', resourceCount: '3.14' },
        existingTags,
        2
      )
      expect(result.valid).toBe(false)
      expect(result.errors.resourceCount).toBeTruthy()
    })
  })

  describe('validateImportData', () => {
    const existingTags = makeFlatTags()

    it('正确识别有效和无效数据', () => {
      const rows = [
        { name: '有效标签', parentName: '', color: '#ef4444', resourceCount: '5' },
        { name: '', parentName: '', color: '#ef4444', resourceCount: '5' },
        { name: '前端', parentName: '', color: '#ef4444', resourceCount: '5' },
      ]
      const result = validateImportData(rows, existingTags)
      expect(result.valid.length).toBe(1)
      expect(result.invalid.length).toBe(2)
    })

    it('检测导入数据内部的重复名称', () => {
      const rows = [
        { name: '新标签1', parentName: '', color: '#ef4444', resourceCount: '5' },
        { name: '新标签1', parentName: '', color: '#0ea5e9', resourceCount: '3' },
      ]
      const result = validateImportData(rows, [])
      expect(result.valid.length).toBe(1)
      expect(result.invalid.length).toBe(1)
    })

    it('非数组返回空结果', () => {
      const result = validateImportData(null, [])
      expect(result.valid).toEqual([])
      expect(result.invalid).toEqual([])
    })

    it('正确处理父标签名称映射', () => {
      const rows = [
        { name: '子标签', parentName: '前端', color: '#ef4444', resourceCount: '5' },
      ]
      const result = validateImportData(rows, existingTags)
      expect(result.valid.length).toBe(1)
      expect(result.valid[0].parentId).toBe('tag_1')
    })

    it('空颜色使用默认颜色', () => {
      const rows = [
        { name: '新标签', parentName: '', color: '', resourceCount: '5' },
      ]
      const result = validateImportData(rows, [])
      expect(result.valid[0].color).toBe(DEFAULT_COLOR)
    })

    it('空资源计数生成随机值', () => {
      const rows = [
        { name: '新标签', parentName: '', color: '#ef4444', resourceCount: '' },
      ]
      const result = validateImportData(rows, [])
      expect(result.valid[0].resourceCount).toBeGreaterThanOrEqual(0)
      expect(result.valid[0].resourceCount).toBeLessThanOrEqual(50)
    })
  })

  describe('batchCreateTags', () => {
    const existingTags = makeFlatTags()

    it('空数组返回原数据', () => {
      const result = batchCreateTags(existingTags, [])
      expect(result.tags).toBe(existingTags)
      expect(result.created).toBe(0)
    })

    it('成功批量创建标签', () => {
      const validRows = [
        { name: '新标签1', parentId: null, color: '#ef4444', resourceCount: 10 },
        { name: '新标签2', parentId: 'tag_1', color: '#f59e0b', resourceCount: 5 },
      ]
      const result = batchCreateTags(existingTags, validRows)
      expect(result.created).toBe(2)
      expect(result.tags.length).toBe(existingTags.length + 2)
      expect(result.tags[result.tags.length - 2].name).toBe('新标签1')
      expect(result.tags[result.tags.length - 1].name).toBe('新标签2')
    })

    it('正确设置order', () => {
      const rootCount = existingTags.filter((t) => !t.parentId).length
      const validRows = [
        { name: '新根标签', parentId: null, color: '#ef4444', resourceCount: 10 },
      ]
      const result = batchCreateTags(existingTags, validRows)
      const newRootTag = result.tags.find((t) => t.name === '新根标签')
      expect(newRootTag.order).toBe(rootCount)
    })

    it('新标签有正确的ID', () => {
      const validRows = [
        { name: '新标签', parentId: null, color: '#ef4444', resourceCount: 10 },
      ]
      const result = batchCreateTags([], validRows)
      expect(result.tags[0].id).toMatch(/^tag_/)
    })
  })
})

describe('getRandomResourceCount', () => {
  it('返回0-50之间的整数', () => {
    for (let i = 0; i < 100; i++) {
      const count = getRandomResourceCount()
      expect(count).toBeGreaterThanOrEqual(0)
      expect(count).toBeLessThanOrEqual(50)
      expect(Number.isInteger(count)).toBe(true)
    }
  })
})

describe('getRandomPresetColor', () => {
  it('返回预设颜色之一', () => {
    for (let i = 0; i < 100; i++) {
      const color = getRandomPresetColor()
      expect(PRESET_COLORS.includes(color)).toBe(true)
    }
  })
})

describe('computeTreeLines', () => {
  const tags = makeFlatTags()

  it('根标签的 isLast 根据同级位置判断', () => {
    const result1 = computeTreeLines(tags, 'tag_1')
    expect(result1.parentExpandedLines).toEqual([])
    expect(result1.isLast).toBe(false)

    const result2 = computeTreeLines(tags, 'tag_2')
    expect(result2.parentExpandedLines).toEqual([])
    expect(result2.isLast).toBe(true)
  })

  it('子节点的 parentExpandedLines 反映祖先是否还有后续兄弟', () => {
    const resultReact = computeTreeLines(tags, 'tag_3')
    expect(resultReact.parentExpandedLines).toEqual([true])
    expect(resultReact.isLast).toBe(false)

    const resultVue = computeTreeLines(tags, 'tag_4')
    expect(resultVue.parentExpandedLines).toEqual([true])
    expect(resultVue.isLast).toBe(true)
  })

  it('深层嵌套节点有多层连线', () => {
    const resultHooks = computeTreeLines(tags, 'tag_5')
    expect(resultHooks.parentExpandedLines).toEqual([true, true])
    expect(resultHooks.isLast).toBe(true)
  })

  it('另一个父节点下的子节点', () => {
    const resultNode = computeTreeLines(tags, 'tag_6')
    expect(resultNode.parentExpandedLines).toEqual([false])
    expect(resultNode.isLast).toBe(true)
  })

  it('空标签数组返回空连线', () => {
    const result = computeTreeLines([], 'nonexist')
    expect(result.parentExpandedLines).toEqual([])
    expect(result.isLast).toBe(true)
  })

  it('不存在的节点返回空连线', () => {
    const result = computeTreeLines(tags, 'nonexist')
    expect(result.parentExpandedLines).toEqual([])
    expect(result.isLast).toBe(true)
  })

  it('唯一根标签的 isLast 为 true', () => {
    const singleRoot = [{ id: 'only', name: '唯一', parentId: null, color: '#000', resourceCount: 5, order: 0 }]
    const result = computeTreeLines(singleRoot, 'only')
    expect(result.isLast).toBe(true)
    expect(result.parentExpandedLines).toEqual([])
  })

  it('多个兄弟节点的中间节点 isLast 为 false', () => {
    const multiSiblings = [
      { id: 'a', name: 'A', parentId: null, color: '#000', resourceCount: 1, order: 0 },
      { id: 'b', name: 'B', parentId: null, color: '#000', resourceCount: 1, order: 1 },
      { id: 'c', name: 'C', parentId: null, color: '#000', resourceCount: 1, order: 2 },
      { id: 'd', name: 'D', parentId: null, color: '#000', resourceCount: 1, order: 3 },
    ]
    expect(computeTreeLines(multiSiblings, 'a').isLast).toBe(false)
    expect(computeTreeLines(multiSiblings, 'b').isLast).toBe(false)
    expect(computeTreeLines(multiSiblings, 'c').isLast).toBe(false)
    expect(computeTreeLines(multiSiblings, 'd').isLast).toBe(true)
  })
})

describe('computeChartNiceMax', () => {
  it('计算5的倍数的最大值', () => {
    const data = [{ tag_1: 3, tag_2: 7 }]
    expect(computeChartNiceMax(data, ['tag_1', 'tag_2'])).toBe(10)
  })

  it('最大值已经是5的倍数时不变', () => {
    const data = [{ tag_1: 10 }]
    expect(computeChartNiceMax(data, ['tag_1'])).toBe(10)
  })

  it('所有值为0时返回5', () => {
    const data = [{ tag_1: 0, tag_2: 0 }]
    expect(computeChartNiceMax(data, ['tag_1', 'tag_2'])).toBe(5)
  })

  it('空数据返回5', () => {
    expect(computeChartNiceMax([], [])).toBe(5)
  })

  it('非数组输入返回5', () => {
    expect(computeChartNiceMax(null, null)).toBe(5)
    expect(computeChartNiceMax(undefined, undefined)).toBe(5)
  })

  it('缺失的标签键值视为0', () => {
    const data = [{ tag_1: 0 }]
    expect(computeChartNiceMax(data, ['tag_1', 'tag_2'])).toBe(5)
  })

  it('多天数据取最大值', () => {
    const data = [
      { tag_1: 3 },
      { tag_1: 12 },
      { tag_1: 8 },
    ]
    expect(computeChartNiceMax(data, ['tag_1'])).toBe(15)
  })

  it('大数值正确向上取整', () => {
    const data = [{ tag_1: 48 }]
    expect(computeChartNiceMax(data, ['tag_1'])).toBe(50)
  })

  it('值为1时返回5', () => {
    const data = [{ tag_1: 1 }]
    expect(computeChartNiceMax(data, ['tag_1'])).toBe(5)
  })
})

describe('splitTag with color parameter', () => {
  const tags = makeFlatTags()

  it('不传颜色参数时使用默认颜色', () => {
    const result = splitTag(tags, 'tag_3', '新标签')
    expect(result.newTag.color).toBe(DEFAULT_COLOR)
  })

  it('传入自定义颜色时使用指定颜色', () => {
    const result = splitTag(tags, 'tag_3', '新标签', '#ef4444')
    expect(result.newTag.color).toBe('#ef4444')
  })

  it('传入不同的自定义颜色', () => {
    const result = splitTag(tags, 'tag_3', '新标签', '#22c55e')
    expect(result.newTag.color).toBe('#22c55e')
  })

  it('拆分后资源计数正确（偶数）', () => {
    const result = splitTag(tags, 'tag_3', '新标签', '#a855f7')
    const original = result.tags.find((t) => t.id === 'tag_3')
    expect(original.resourceCount).toBe(3)
    expect(result.newTag.resourceCount).toBe(3)
  })

  it('拆分后资源计数正确（奇数）', () => {
    const tagsOdd = [
      { id: 't1', name: '奇数', parentId: null, color: '#000', resourceCount: 7, order: 0 },
    ]
    const result = splitTag(tagsOdd, 't1', '新标签', '#f59e0b')
    const original = result.tags.find((t) => t.id === 't1')
    expect(original.resourceCount).toBe(4)
    expect(result.newTag.resourceCount).toBe(3)
    expect(result.newTag.color).toBe('#f59e0b')
  })
})
