import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  loadCustomRules,
  saveCustomRules,
  addCustomRule,
  deleteCustomRule,
  updateCustomRule,
  loadSchemes,
  saveSchemes,
  addScheme,
  deleteScheme,
  updateScheme,
  loadEnabledRuleIds,
  saveEnabledRuleIds,
  generateId,
  isBrowser,
  safeParseJSON,
} from '../../data-mask/storage'

const createMockStorage = () => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
}

let mockLocalStorage

beforeEach(() => {
  mockLocalStorage = createMockStorage()
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  delete globalThis.localStorage
  delete globalThis.window
})

describe('safeParseJSON', () => {
  it('应该正确解析有效JSON', () => {
    expect(safeParseJSON('{"a":1}')).toEqual({ a: 1 })
  })

  it('应该解析数组', () => {
    expect(safeParseJSON('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('无效JSON应返回null', () => {
    expect(safeParseJSON('invalid')).toBeNull()
  })

  it('空字符串应返回null', () => {
    expect(safeParseJSON('')).toBeNull()
  })

  it('null应返回null', () => {
    expect(safeParseJSON(null)).toBeNull()
  })
})

describe('isBrowser', () => {
  it('在浏览器环境下应返回true', () => {
    expect(isBrowser()).toBe(true)
  })
})

describe('generateId', () => {
  it('应该生成唯一ID', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(0)
  })
})

describe('Custom Rules Storage', () => {
  describe('loadCustomRules', () => {
    it('localStorage无数据时应返回空数组', () => {
      expect(loadCustomRules()).toEqual([])
    })

    it('应该正确加载保存的规则', () => {
      const rules = [{ id: 'custom_1', name: 'test', pattern: '\\d+' }]
      mockLocalStorage.setItem('data-mask-custom-rules', JSON.stringify(rules))
      const loaded = loadCustomRules()
      expect(loaded).toEqual(rules)
    })

    it('损坏的JSON应返回空数组', () => {
      mockLocalStorage.setItem('data-mask-custom-rules', 'invalid json')
      expect(loadCustomRules()).toEqual([])
    })

    it('非数组数据应返回空数组', () => {
      mockLocalStorage.setItem('data-mask-custom-rules', '{"not":"array"}')
      expect(loadCustomRules()).toEqual([])
    })
  })

  describe('saveCustomRules', () => {
    it('应该保存规则到localStorage', () => {
      const rules = [{ id: 'custom_1', name: 'test' }]
      saveCustomRules(rules)
      const saved = mockLocalStorage.getItem('data-mask-custom-rules')
      expect(JSON.parse(saved)).toEqual(rules)
    })

    it('非数组应转为空数组保存', () => {
      saveCustomRules('not array')
      const saved = mockLocalStorage.getItem('data-mask-custom-rules')
      expect(JSON.parse(saved)).toEqual([])
    })
  })

  describe('addCustomRule', () => {
    it('应该添加新规则', () => {
      const { rules, newRule } = addCustomRule('IP脱敏', '\\d+\\.\\d+', '***', [])
      expect(rules.length).toBe(1)
      expect(newRule.name).toBe('IP脱敏')
      expect(newRule.pattern).toBe('\\d+\\.\\d+')
      expect(newRule.replacement).toBe('***')
      expect(newRule.category).toBe('custom')
      expect(newRule.enabled).toBe(true)
      expect(newRule.id).toMatch(/^custom_/)
    })

    it('应该追加到已有规则', () => {
      const existing = [{ id: 'custom_1', name: 'rule1' }]
      const { rules } = addCustomRule('rule2', '\\d+', '***', existing)
      expect(rules.length).toBe(2)
    })

    it('空名称应使用默认值', () => {
      const { newRule } = addCustomRule('', '\\d+', '***', [])
      expect(newRule.name).toBe('自定义规则')
    })

    it('空替换模板应使用默认值', () => {
      const { newRule } = addCustomRule('test', '\\d+', '', [])
      expect(newRule.replacement).toBe('***')
    })
  })

  describe('deleteCustomRule', () => {
    it('应该删除指定规则', () => {
      const rules = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
      const result = deleteCustomRule('b', rules)
      expect(result.length).toBe(2)
      expect(result.find((r) => r.id === 'b')).toBeUndefined()
    })

    it('删除不存在的规则不应报错', () => {
      const rules = [{ id: 'a' }]
      const result = deleteCustomRule('z', rules)
      expect(result.length).toBe(1)
    })
  })

  describe('updateCustomRule', () => {
    it('应该更新指定规则', () => {
      const rules = [{ id: 'a', name: 'old', pattern: '\\d+' }]
      const result = updateCustomRule('a', { name: 'new' }, rules)
      expect(result[0].name).toBe('new')
    })

    it('更新pattern应同步更新description', () => {
      const rules = [{ id: 'a', name: 'test', pattern: 'old', description: '自定义正则: old' }]
      const result = updateCustomRule('a', { pattern: 'new' }, rules)
      expect(result[0].pattern).toBe('new')
      expect(result[0].groupPattern).toBe('new')
      expect(result[0].description).toBe('自定义正则: new')
    })

    it('更新不存在的规则不应报错', () => {
      const rules = [{ id: 'a', name: 'test' }]
      const result = updateCustomRule('z', { name: 'new' }, rules)
      expect(result.length).toBe(1)
      expect(result[0].name).toBe('test')
    })
  })
})

describe('Schemes Storage', () => {
  describe('loadSchemes', () => {
    it('localStorage无数据时应返回空数组', () => {
      expect(loadSchemes()).toEqual([])
    })

    it('应该正确加载保存的方案', () => {
      const schemes = [{ id: 'scheme_1', name: 'test', enabledRuleIds: ['phone', 'email'] }]
      mockLocalStorage.setItem('data-mask-schemes', JSON.stringify(schemes))
      const loaded = loadSchemes()
      expect(loaded).toEqual(schemes)
    })
  })

  describe('saveSchemes', () => {
    it('应该保存方案到localStorage', () => {
      const schemes = [{ id: 'scheme_1', name: 'test' }]
      saveSchemes(schemes)
      const saved = mockLocalStorage.getItem('data-mask-schemes')
      expect(JSON.parse(saved)).toEqual(schemes)
    })
  })

  describe('addScheme', () => {
    it('应该添加新方案', () => {
      const { schemes, newScheme } = addScheme('默认方案', ['phone', 'email'], [])
      expect(schemes.length).toBe(1)
      expect(newScheme.name).toBe('默认方案')
      expect(newScheme.enabledRuleIds).toEqual(['phone', 'email'])
      expect(newScheme.id).toMatch(/^scheme_/)
    })

    it('空名称应使用默认值', () => {
      const { newScheme } = addScheme('', ['phone'], [])
      expect(newScheme.name).toBe('未命名方案')
    })

    it('应该追加到已有方案', () => {
      const existing = [{ id: 'scheme_1', name: '方案1' }]
      const { schemes } = addScheme('方案2', ['email'], existing)
      expect(schemes.length).toBe(2)
    })
  })

  describe('deleteScheme', () => {
    it('应该删除指定方案', () => {
      const schemes = [{ id: 's1' }, { id: 's2' }]
      const result = deleteScheme('s1', schemes)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('s2')
    })

    it('删除不存在的方案不应报错', () => {
      const schemes = [{ id: 's1' }]
      const result = deleteScheme('zzz', schemes)
      expect(result.length).toBe(1)
    })
  })

  describe('updateScheme', () => {
    it('应该更新指定方案', () => {
      const schemes = [{ id: 's1', name: 'old', enabledRuleIds: ['phone'] }]
      const result = updateScheme('s1', { name: 'new' }, schemes)
      expect(result[0].name).toBe('new')
    })

    it('更新不存在的方案不应报错', () => {
      const schemes = [{ id: 's1', name: 'test' }]
      const result = updateScheme('z', { name: 'new' }, schemes)
      expect(result[0].name).toBe('test')
    })
  })
})

describe('Enabled Rule IDs Storage', () => {
  describe('loadEnabledRuleIds', () => {
    it('localStorage无数据时应返回null', () => {
      expect(loadEnabledRuleIds()).toBeNull()
    })

    it('应该正确加载保存的ID列表', () => {
      const ids = ['phone', 'email']
      mockLocalStorage.setItem('data-mask-enabled-rules', JSON.stringify(ids))
      expect(loadEnabledRuleIds()).toEqual(ids)
    })

    it('非数组数据应返回null', () => {
      mockLocalStorage.setItem('data-mask-enabled-rules', '{"not":"array"}')
      expect(loadEnabledRuleIds()).toBeNull()
    })
  })

  describe('saveEnabledRuleIds', () => {
    it('应该保存ID列表', () => {
      saveEnabledRuleIds(['phone', 'email'])
      const saved = mockLocalStorage.getItem('data-mask-enabled-rules')
      expect(JSON.parse(saved)).toEqual(['phone', 'email'])
    })

    it('非数组应转为空数组', () => {
      saveEnabledRuleIds('not array')
      const saved = mockLocalStorage.getItem('data-mask-enabled-rules')
      expect(JSON.parse(saved)).toEqual([])
    })
  })
})
