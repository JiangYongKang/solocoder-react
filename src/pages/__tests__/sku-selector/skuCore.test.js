import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  createSpecGroup,
  createSpecValue,
  addSpecGroup,
  updateSpecGroup,
  deleteSpecGroup,
  addSpecValue,
  updateSpecValue,
  deleteSpecValue,
  getGroupById,
  getValueById,
  cartesianProduct,
  generateSkuList,
  syncSkuList,
  updateSku,
  batchSetStock,
  batchSetPrice,
  isSelectionComplete,
  findSkuBySelection,
  getSelectedSummary,
  getDisabledValues,
  getImagesForSelection,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  DEFAULT_SPEC_GROUPS,
} from '../../sku-selector/skuCore'

const mockGroups = [
  {
    id: 'g1',
    name: '颜色',
    values: [
      { id: 'v1', name: '红色', image: '' },
      { id: 'v2', name: '蓝色', image: '' },
    ],
  },
  {
    id: 'g2',
    name: '尺寸',
    values: [
      { id: 'v3', name: 'S', image: '' },
      { id: 'v4', name: 'M', image: '' },
    ],
  },
]

describe('generateId', () => {
  it('should generate unique ids with prefix', () => {
    const id1 = generateId('test')
    const id2 = generateId('test')
    expect(id1).toContain('test_')
    expect(id2).toContain('test_')
    expect(id1).not.toBe(id2)
  })

  it('should use default prefix when not provided', () => {
    const id = generateId()
    expect(id).toContain('id_')
  })
})

describe('createSpecGroup', () => {
  it('should create a spec group with default name', () => {
    const group = createSpecGroup()
    expect(group).toHaveProperty('id')
    expect(group.name).toBe('规格组')
    expect(group.values).toEqual([])
  })

  it('should create a spec group with custom name', () => {
    const group = createSpecGroup('颜色')
    expect(group.name).toBe('颜色')
    expect(Array.isArray(group.values)).toBe(true)
  })
})

describe('createSpecValue', () => {
  it('should create a spec value with default name and empty image', () => {
    const value = createSpecValue()
    expect(value).toHaveProperty('id')
    expect(value.name).toBe('规格值')
    expect(value.image).toBe('')
  })

  it('should create a spec value with custom name and image', () => {
    const value = createSpecValue('红色', 'data:image/png;base64,xxx')
    expect(value.name).toBe('红色')
    expect(value.image).toBe('data:image/png;base64,xxx')
  })
})

describe('addSpecGroup', () => {
  it('should add a spec group to empty array', () => {
    const result = addSpecGroup([], '颜色')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('颜色')
  })

  it('should add a spec group to existing groups', () => {
    const result = addSpecGroup(mockGroups, '版本')
    expect(result).toHaveLength(3)
    expect(result[2].name).toBe('版本')
  })

  it('should handle non-array input', () => {
    const result = addSpecGroup(null, '颜色')
    expect(result).toHaveLength(1)
  })
})

describe('updateSpecGroup', () => {
  it('should update a spec group by id', () => {
    const result = updateSpecGroup(mockGroups, 'g1', { name: 'Colour' })
    expect(result.find((g) => g.id === 'g1').name).toBe('Colour')
    expect(result.find((g) => g.id === 'g2').name).toBe('尺寸')
  })

  it('should return empty array for non-array input', () => {
    const result = updateSpecGroup(null, 'g1', { name: 'x' })
    expect(result).toEqual([])
  })
})

describe('deleteSpecGroup', () => {
  it('should delete a spec group by id', () => {
    const result = deleteSpecGroup(mockGroups, 'g1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('g2')
  })

  it('should handle deleting non-existent group', () => {
    const result = deleteSpecGroup(mockGroups, 'not-exist')
    expect(result).toHaveLength(2)
  })
})

describe('addSpecValue', () => {
  it('should add a spec value to a group', () => {
    const result = addSpecValue(mockGroups, 'g1', '绿色')
    const group = result.find((g) => g.id === 'g1')
    expect(group.values).toHaveLength(3)
    expect(group.values[2].name).toBe('绿色')
  })

  it('should not affect other groups', () => {
    const result = addSpecValue(mockGroups, 'g1', '绿色')
    const group2 = result.find((g) => g.id === 'g2')
    expect(group2.values).toHaveLength(2)
  })
})

describe('updateSpecValue', () => {
  it('should update a spec value', () => {
    const result = updateSpecValue(mockGroups, 'g1', 'v1', { name: 'Red' })
    const value = result.find((g) => g.id === 'g1').values.find((v) => v.id === 'v1')
    expect(value.name).toBe('Red')
  })

  it('should update spec value image', () => {
    const result = updateSpecValue(mockGroups, 'g1', 'v1', { image: 'img1' })
    const value = result.find((g) => g.id === 'g1').values.find((v) => v.id === 'v1')
    expect(value.image).toBe('img1')
  })
})

describe('deleteSpecValue', () => {
  it('should delete a spec value from a group', () => {
    const result = deleteSpecValue(mockGroups, 'g1', 'v1')
    const group = result.find((g) => g.id === 'g1')
    expect(group.values).toHaveLength(1)
    expect(group.values[0].id).toBe('v2')
  })
})

describe('getGroupById', () => {
  it('should find group by id', () => {
    const group = getGroupById(mockGroups, 'g1')
    expect(group.name).toBe('颜色')
  })

  it('should return null for non-existent id', () => {
    expect(getGroupById(mockGroups, 'not-exist')).toBe(null)
    expect(getGroupById(null, 'g1')).toBe(null)
  })
})

describe('getValueById', () => {
  it('should find value by id', () => {
    const group = mockGroups[0]
    const value = getValueById(group, 'v1')
    expect(value.name).toBe('红色')
  })

  it('should return null for non-existent value', () => {
    const group = mockGroups[0]
    expect(getValueById(group, 'not-exist')).toBe(null)
    expect(getValueById(null, 'v1')).toBe(null)
  })
})

describe('cartesianProduct', () => {
  it('should compute cartesian product of multiple arrays', () => {
    const result = cartesianProduct([[1, 2], ['a', 'b']])
    expect(result).toHaveLength(4)
    expect(result).toContainEqual([1, 'a'])
    expect(result).toContainEqual([1, 'b'])
    expect(result).toContainEqual([2, 'a'])
    expect(result).toContainEqual([2, 'b'])
  })

  it('should return empty array for empty input', () => {
    expect(cartesianProduct([])).toEqual([])
  })

  it('should return empty array if any array is empty', () => {
    expect(cartesianProduct([[1, 2], []])).toEqual([])
  })

  it('should handle single array', () => {
    const result = cartesianProduct([[1, 2, 3]])
    expect(result).toEqual([[1], [2], [3]])
  })
})

describe('generateSkuList', () => {
  it('should generate SKU list from spec groups', () => {
    const skus = generateSkuList(mockGroups)
    expect(skus).toHaveLength(4)
    skus.forEach((sku) => {
      expect(sku).toHaveProperty('id')
      expect(sku).toHaveProperty('specs')
      expect(sku).toHaveProperty('specDetails')
      expect(sku.stock).toBe(0)
      expect(sku.price).toBe(0)
      expect(sku.specDetails).toHaveLength(2)
    })
  })

  it('should return empty array for empty groups', () => {
    expect(generateSkuList([])).toEqual([])
    expect(generateSkuList(null)).toEqual([])
  })

  it('should filter out groups with no values', () => {
    const groupsWithEmpty = [
      ...mockGroups,
      { id: 'g3', name: '版本', values: [] },
    ]
    const skus = generateSkuList(groupsWithEmpty)
    expect(skus).toHaveLength(4)
  })
})

describe('syncSkuList', () => {
  it('should preserve stock and price when syncing', () => {
    const oldSkus = [
      {
        id: 'old1',
        specs: { g1: 'v1', g2: 'v3' },
        stock: 100,
        price: 99.9,
      },
    ]
    const newSkus = generateSkuList(mockGroups)
    const synced = syncSkuList(oldSkus, newSkus, mockGroups)
    const matched = synced.find(
      (s) => s.specs.g1 === 'v1' && s.specs.g2 === 'v3'
    )
    expect(matched.stock).toBe(100)
    expect(matched.price).toBe(99.9)
    expect(matched.id).toBe('old1')
  })

  it('should return new skus when no old skus', () => {
    const newSkus = generateSkuList(mockGroups)
    const synced = syncSkuList([], newSkus, mockGroups)
    expect(synced).toBe(newSkus)
  })
})

describe('updateSku', () => {
  it('should update a sku by id', () => {
    const skus = generateSkuList(mockGroups)
    const targetId = skus[0].id
    const updated = updateSku(skus, targetId, { stock: 50, price: 199 })
    const target = updated.find((s) => s.id === targetId)
    expect(target.stock).toBe(50)
    expect(target.price).toBe(199)
  })
})

describe('batchSetStock', () => {
  it('should set stock for all skus', () => {
    const skus = generateSkuList(mockGroups)
    const result = batchSetStock(skus, 100)
    result.forEach((sku) => expect(sku.stock).toBe(100))
  })

  it('should handle invalid stock value', () => {
    const skus = generateSkuList(mockGroups)
    const result = batchSetStock(skus, 'invalid')
    result.forEach((sku) => expect(sku.stock).toBe(0))
  })
})

describe('batchSetPrice', () => {
  it('should set price for all skus', () => {
    const skus = generateSkuList(mockGroups)
    const result = batchSetPrice(skus, 99.99)
    result.forEach((sku) => expect(sku.price).toBe(99.99))
  })
})

describe('isSelectionComplete', () => {
  it('should return true when all groups have selection', () => {
    const selection = { g1: 'v1', g2: 'v3' }
    expect(isSelectionComplete(mockGroups, selection)).toBe(true)
  })

  it('should return false when selection is incomplete', () => {
    expect(isSelectionComplete(mockGroups, { g1: 'v1' })).toBe(false)
    expect(isSelectionComplete(mockGroups, {})).toBe(false)
  })

  it('should return false for invalid input', () => {
    expect(isSelectionComplete([], {})).toBe(false)
    expect(isSelectionComplete(mockGroups, null)).toBe(false)
  })
})

describe('findSkuBySelection', () => {
  it('should find sku by selection', () => {
    const skus = generateSkuList(mockGroups)
    const selection = { g1: 'v1', g2: 'v3' }
    const found = findSkuBySelection(skus, selection)
    expect(found).not.toBe(null)
    expect(found.specs.g1).toBe('v1')
    expect(found.specs.g2).toBe('v3')
  })

  it('should return null when no match', () => {
    const skus = generateSkuList(mockGroups)
    expect(findSkuBySelection(skus, { g1: 'not-exist' })).toBe(null)
  })
})

describe('getSelectedSummary', () => {
  it('should generate summary for complete selection', () => {
    const selection = { g1: 'v1', g2: 'v3' }
    const summary = getSelectedSummary(mockGroups, selection)
    expect(summary).toContain('已选：')
    expect(summary).toContain('红色')
    expect(summary).toContain('S')
  })

  it('should return prompt for no selection', () => {
    expect(getSelectedSummary(mockGroups, {})).toBe('请选择规格')
  })

  it('should handle partial selection', () => {
    const summary = getSelectedSummary(mockGroups, { g1: 'v1' })
    expect(summary).toContain('已选：')
    expect(summary).toContain('红色')
  })
})

describe('getDisabledValues', () => {
  it('should mark values as disabled when no stock available', () => {
    const skus = generateSkuList(mockGroups)
    const skusWithStock = skus.map((sku, idx) => ({
      ...sku,
      stock: idx === 0 ? 10 : 0,
    }))
    const selection = { g1: 'v2' }
    const disabled = getDisabledValues(mockGroups, skusWithStock, selection)
    expect(disabled.g2).toContain('v3')
    expect(disabled.g2).toContain('v4')
  })

  it('should not disable currently selected value', () => {
    const skus = generateSkuList(mockGroups).map((sku) => ({
      ...sku,
      stock: 10,
    }))
    skus[0].stock = 0
    const selection = { g1: 'v1' }
    const disabled = getDisabledValues(mockGroups, skus, selection)
    expect(disabled.g1).toBeUndefined()
  })

  it('should return empty object for invalid input', () => {
    expect(getDisabledValues([], [], {})).toEqual({})
  })
})

describe('getImagesForSelection', () => {
  it('should return images for selected values', () => {
    const groups = [
      {
        id: 'g1',
        name: '颜色',
        values: [
          { id: 'v1', name: '红色', image: 'red.png' },
          { id: 'v2', name: '蓝色', image: 'blue.png' },
        ],
      },
    ]
    const selection = { g1: 'v1' }
    const images = getImagesForSelection(groups, selection)
    expect(images).toHaveLength(1)
    expect(images[0].image).toBe('red.png')
    expect(images[0].valueName).toBe('红色')
  })

  it('should skip values without images', () => {
    const groups = [
      {
        id: 'g1',
        name: '颜色',
        values: [{ id: 'v1', name: '红色', image: '' }],
      },
    ]
    const selection = { g1: 'v1' }
    expect(getImagesForSelection(groups, selection)).toEqual([])
  })
})

describe('storage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = {
      data: {},
      getItem(key) {
        return key in this.data ? this.data[key] : null
      },
      setItem(key, value) {
        this.data[key] = value
      },
      removeItem(key) {
        delete this.data[key]
      },
    }
  })

  it('should save and load from storage', () => {
    const state = { groups: mockGroups, skus: generateSkuList(mockGroups) }
    const saveResult = saveToStorage(state, mockStorage)
    expect(saveResult.success).toBe(true)

    const loadResult = loadFromStorage(mockStorage)
    expect(loadResult.groups).toHaveLength(2)
    expect(loadResult.skus).toHaveLength(4)
    expect(loadResult.error).toBe(null)
  })

  it('should clear storage', () => {
    saveToStorage({ groups: mockGroups, skus: [] }, mockStorage)
    const clearResult = clearStorage(mockStorage)
    expect(clearResult.success).toBe(true)
    const loadResult = loadFromStorage(mockStorage)
    expect(loadResult.groups).toEqual([])
  })

  it('should handle null storage', () => {
    const loadResult = loadFromStorage(null)
    expect(loadResult.error).toBeTruthy()
    const saveResult = saveToStorage({}, null)
    expect(saveResult.success).toBe(false)
  })

  it('should handle corrupted data', () => {
    mockStorage.setItem('sku-selector-state', 'not-json')
    const result = loadFromStorage(mockStorage)
    expect(result.error).toBeTruthy()
    expect(result.groups).toEqual([])
  })
})

describe('DEFAULT_SPEC_GROUPS', () => {
  it('should have 3 default spec groups', () => {
    expect(DEFAULT_SPEC_GROUPS).toHaveLength(3)
  })

  it('should have color, size, and version groups', () => {
    const names = DEFAULT_SPEC_GROUPS.map((g) => g.name)
    expect(names).toContain('颜色')
    expect(names).toContain('尺寸')
    expect(names).toContain('版本')
  })

  it('each group should have values', () => {
    DEFAULT_SPEC_GROUPS.forEach((g) => {
      expect(Array.isArray(g.values)).toBe(true)
      expect(g.values.length).toBeGreaterThan(0)
    })
  })
})
