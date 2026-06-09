const STORAGE_KEY = 'sku-selector-state'

let idCounter = 0

export function generateId(prefix = 'id') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createSpecGroup(name = '规格组') {
  return {
    id: generateId('group'),
    name,
    values: [],
  }
}

export function createSpecValue(name = '规格值', image = '') {
  return {
    id: generateId('value'),
    name,
    image,
  }
}

export function addSpecGroup(groups, name = '规格组') {
  if (!Array.isArray(groups)) return [createSpecGroup(name)]
  return [...groups, createSpecGroup(name)]
}

export function updateSpecGroup(groups, groupId, updates) {
  if (!Array.isArray(groups)) return []
  return groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
}

export function deleteSpecGroup(groups, groupId) {
  if (!Array.isArray(groups)) return []
  return groups.filter((g) => g.id !== groupId)
}

export function addSpecValue(groups, groupId, name = '规格值') {
  if (!Array.isArray(groups)) return groups
  return groups.map((g) => {
    if (g.id !== groupId) return g
    return {
      ...g,
      values: [...(g.values || []), createSpecValue(name)],
    }
  })
}

export function updateSpecValue(groups, groupId, valueId, updates) {
  if (!Array.isArray(groups)) return groups
  return groups.map((g) => {
    if (g.id !== groupId) return g
    return {
      ...g,
      values: (g.values || []).map((v) =>
        v.id === valueId ? { ...v, ...updates } : v
      ),
    }
  })
}

export function deleteSpecValue(groups, groupId, valueId) {
  if (!Array.isArray(groups)) return groups
  return groups.map((g) => {
    if (g.id !== groupId) return g
    return {
      ...g,
      values: (g.values || []).filter((v) => v.id !== valueId),
    }
  })
}

export function getGroupById(groups, groupId) {
  if (!Array.isArray(groups)) return null
  return groups.find((g) => g.id === groupId) || null
}

export function getValueById(group, valueId) {
  if (!group || !Array.isArray(group.values)) return null
  return group.values.find((v) => v.id === valueId) || null
}

export function cartesianProduct(arrays) {
  if (!Array.isArray(arrays) || arrays.length === 0) return []
  return arrays.reduce(
    (acc, curr) => {
      if (!Array.isArray(curr) || curr.length === 0) return []
      const result = []
      for (const a of acc) {
        for (const b of curr) {
          result.push([...a, b])
        }
      }
      return result
    },
    [[]]
  )
}

export function generateSkuList(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return []
  const validGroups = groups.filter(
    (g) => Array.isArray(g.values) && g.values.length > 0
  )
  if (validGroups.length === 0) return []

  const valueArrays = validGroups.map((g) =>
    g.values.map((v) => ({
      groupId: g.id,
      groupName: g.name,
      valueId: v.id,
      valueName: v.name,
      valueImage: v.image || '',
    }))
  )

  const combinations = cartesianProduct(valueArrays)

  return combinations.map((combo, index) => {
    const specMap = {}
    combo.forEach((item) => {
      specMap[item.groupId] = item.valueId
    })
    return {
      id: generateId('sku'),
      index: index + 1,
      specs: specMap,
      specDetails: combo,
      stock: 0,
      price: 0,
    }
  })
}

export function syncSkuList(oldSkus, newSkus) {
  if (!Array.isArray(oldSkus) || oldSkus.length === 0) return newSkus
  if (!Array.isArray(newSkus)) return []

  const buildKey = (specs) => {
    if (!specs || typeof specs !== 'object') return ''
    return Object.keys(specs)
      .sort()
      .map((k) => `${k}:${specs[k]}`)
      .join('|')
  }

  const oldMap = new Map()
  oldSkus.forEach((sku) => {
    oldMap.set(buildKey(sku.specs), sku)
  })

  return newSkus.map((newSku) => {
    const key = buildKey(newSku.specs)
    const oldSku = oldMap.get(key)
    if (oldSku) {
      return {
        ...newSku,
        id: oldSku.id,
        stock: oldSku.stock ?? 0,
        price: oldSku.price ?? 0,
      }
    }
    return newSku
  })
}

export function updateSku(skus, skuId, updates) {
  if (!Array.isArray(skus)) return []
  return skus.map((s) => (s.id === skuId ? { ...s, ...updates } : s))
}

export function batchSetStock(skus, stock) {
  if (!Array.isArray(skus)) return []
  const safeStock = Number.isFinite(Number(stock)) ? Number(stock) : 0
  return skus.map((s) => ({ ...s, stock: safeStock }))
}

export function batchSetPrice(skus, price) {
  if (!Array.isArray(skus)) return []
  const safePrice = Number.isFinite(Number(price)) ? Number(price) : 0
  return skus.map((s) => ({ ...s, price: safePrice }))
}

export function isSelectionComplete(groups, selection) {
  if (!Array.isArray(groups) || groups.length === 0) return false
  if (!selection || typeof selection !== 'object') return false
  return groups.every((g) => {
    if (!g.values || g.values.length === 0) return true
    return selection[g.id] != null
  })
}

export function findSkuBySelection(skus, selection) {
  if (!Array.isArray(skus) || skus.length === 0) return null
  if (!selection || typeof selection !== 'object') return null
  return (
    skus.find((sku) => {
      const specs = sku.specs || {}
      return Object.keys(selection).every((k) => specs[k] === selection[k])
    }) || null
  )
}

export function getSelectedSummary(groups, selection) {
  if (!Array.isArray(groups) || !selection || typeof selection !== 'object') {
    return '请选择规格'
  }
  const parts = []
  groups.forEach((g) => {
    const valueId = selection[g.id]
    if (valueId != null) {
      const value = getValueById(g, valueId)
      if (value) {
        parts.push(value.name)
      }
    }
  })
  if (parts.length === 0) return '请选择规格'
  return `已选：${parts.join(' / ')}`
}

export function getDisabledValues(groups, skus, selection) {
  if (!Array.isArray(groups) || groups.length === 0) return {}
  if (!Array.isArray(skus) || skus.length === 0) return {}
  if (!selection || typeof selection !== 'object') return {}

  const disabled = {}

  groups.forEach((currentGroup) => {
    if (!Array.isArray(currentGroup.values)) return
    currentGroup.values.forEach((value) => {
      if (selection[currentGroup.id] === value.id) return

      const testSelection = { ...selection, [currentGroup.id]: value.id }

      const hasAvailableSku = skus.some((sku) => {
        const specs = sku.specs || {}
        const matchesAllSelected = Object.keys(testSelection).every(
          (k) => testSelection[k] == null || specs[k] === testSelection[k]
        )
        const hasStock = (sku.stock ?? 0) > 0
        return matchesAllSelected && hasStock
      })

      if (!hasAvailableSku) {
        if (!disabled[currentGroup.id]) {
          disabled[currentGroup.id] = new Set()
        }
        disabled[currentGroup.id].add(value.id)
      }
    })
  })

  const result = {}
  Object.keys(disabled).forEach((groupId) => {
    result[groupId] = Array.from(disabled[groupId])
  })
  return result
}

export function getImagesForSelection(groups, selection) {
  if (!Array.isArray(groups) || !selection || typeof selection !== 'object') {
    return []
  }
  const images = []
  groups.forEach((g) => {
    const valueId = selection[g.id]
    if (valueId != null) {
      const value = getValueById(g, valueId)
      if (value && value.image) {
        images.push({
          groupId: g.id,
          groupName: g.name,
          valueId: value.id,
          valueName: value.name,
          image: value.image,
        })
      }
    }
  })
  return images
}

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { groups: [], skus: [], error: 'localStorage 不可用' }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { groups: [], skus: [], error: null }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.groups) || !Array.isArray(parsed.skus)) {
      return { groups: [], skus: [], error: '存储数据格式损坏' }
    }
    return { groups: parsed.groups, skus: parsed.skus, error: null }
  } catch (e) {
    const msg = e?.message ? `: ${e.message}` : ''
    return { groups: [], skus: [], error: `读取存储数据失败${msg}` }
  }
}

export function saveToStorage(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { success: false, error: 'localStorage 不可用' }
  try {
    const toSave = {
      groups: state.groups || [],
      skus: state.skus || [],
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

export const DEFAULT_SPEC_GROUPS = [
  {
    id: 'default_group_color',
    name: '颜色',
    values: [
      { id: 'default_color_red', name: '红色', image: '' },
      { id: 'default_color_blue', name: '蓝色', image: '' },
      { id: 'default_color_black', name: '黑色', image: '' },
    ],
  },
  {
    id: 'default_group_size',
    name: '尺寸',
    values: [
      { id: 'default_size_s', name: 'S', image: '' },
      { id: 'default_size_m', name: 'M', image: '' },
      { id: 'default_size_l', name: 'L', image: '' },
      { id: 'default_size_xl', name: 'XL', image: '' },
    ],
  },
  {
    id: 'default_group_version',
    name: '版本',
    values: [
      { id: 'default_version_standard', name: '标准版', image: '' },
      { id: 'default_version_pro', name: 'Pro版', image: '' },
      { id: 'default_version_flagship', name: '旗舰版', image: '' },
    ],
  },
]
