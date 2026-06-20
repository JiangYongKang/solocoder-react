import { describe, it, expect, vi } from 'vitest'
import {
  loadVariables,
  saveVariables,
  loadVersions,
  saveVersions,
  addVersion,
  deleteVersion,
  clearVersions,
  loadCustomTemplates,
  saveCustomTemplates,
  addCustomTemplate,
  deleteCustomTemplate,
} from '../../terms-generator/storage.js'
import { MAX_VERSIONS } from '../../terms-generator/constants.js'

const createMockStorage = () => {
  const store = {}
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k])
    }),
    _store: store,
  }
}

describe('loadVariables / saveVariables', () => {
  it('默认情况下返回空对象', () => {
    const storage = createMockStorage()
    expect(loadVariables(storage)).toEqual({})
  })

  it('应该能正确保存和加载变量', () => {
    const storage = createMockStorage()
    const vars = { '公司名称': '测试公司', '生效日期': '2024-01-01' }
    saveVariables(vars, storage)
    const loaded = loadVariables(storage)
    expect(loaded).toEqual(vars)
  })

  it('保存 null/undefined 应该存储空对象', () => {
    const storage = createMockStorage()
    saveVariables(null, storage)
    expect(loadVariables(storage)).toEqual({})
    saveVariables(undefined, storage)
    expect(loadVariables(storage)).toEqual({})
  })

  it('损坏的 JSON 数据应该返回空对象', () => {
    const storage = createMockStorage()
    storage.setItem('terms-generator-variables', '{invalid json')
    expect(loadVariables(storage)).toEqual({})
  })

  it('非对象 JSON 数据应该返回空对象', () => {
    const storage = createMockStorage()
    storage.setItem('terms-generator-variables', JSON.stringify('string'))
    expect(loadVariables(storage)).toEqual({})
  })
})

describe('loadVersions / saveVersions', () => {
  it('默认情况下返回空数组', () => {
    const storage = createMockStorage()
    expect(loadVersions(storage)).toEqual([])
  })

  it('应该能正确保存和加载版本列表', () => {
    const storage = createMockStorage()
    const versions = [
      { id: 'v1', versionNumber: 1, timestamp: 12345, content: 'content1', variables: {} },
    ]
    saveVersions(versions, storage)
    const loaded = loadVersions(storage)
    expect(loaded).toEqual(versions)
    expect(Array.isArray(loaded)).toBe(true)
  })

  it('保存非数组应该存储空数组', () => {
    const storage = createMockStorage()
    saveVersions('not-array', storage)
    expect(loadVersions(storage)).toEqual([])
  })

  it('损坏的 JSON 数据应该返回空数组', () => {
    const storage = createMockStorage()
    storage.setItem('terms-generator-versions', '{bad')
    expect(loadVersions(storage)).toEqual([])
  })

  it('加载时最多返回 MAX_VERSIONS 个版本', () => {
    const storage = createMockStorage()
    const versions = Array(MAX_VERSIONS + 10)
      .fill(null)
      .map((_, i) => ({ id: `v${i}`, versionNumber: i + 1 }))
    saveVersions(versions, storage)
    const loaded = loadVersions(storage)
    expect(loaded.length).toBe(MAX_VERSIONS)
  })

  it('保存时最多存储 MAX_VERSIONS 个版本', () => {
    const storage = createMockStorage()
    const versions = Array(MAX_VERSIONS + 5)
      .fill(null)
      .map((_, i) => ({ id: `v${i}`, versionNumber: i + 1 }))
    saveVersions(versions, storage)
    const stored = JSON.parse(storage._store['terms-generator-versions'])
    expect(stored.length).toBe(MAX_VERSIONS)
  })
})

describe('addVersion', () => {
  it('应该添加一个新版本到列表顶部', () => {
    const storage = createMockStorage()
    const result = addVersion({ content: 'test content', note: 'test note' }, storage)
    expect(result.versions.length).toBe(1)
    expect(result.versions[0].content).toBe('test content')
    expect(result.versions[0].note).toBe('test note')
  })

  it('新版本应该有自增的 versionNumber', () => {
    const storage = createMockStorage()
    addVersion({ content: 'v1' }, storage)
    const result = addVersion({ content: 'v2' }, storage)
    expect(result.versions[0].versionNumber).toBe(2)
    expect(result.versions[1].versionNumber).toBe(1)
  })

  it('新版本应该有唯一的 id', () => {
    const storage = createMockStorage()
    const r1 = addVersion({ content: 'a' }, storage)
    const r2 = addVersion({ content: 'b' }, storage)
    expect(r1.newVersion.id).not.toBe(r2.newVersion.id)
  })

  it('新版本应该有 timestamp', () => {
    const storage = createMockStorage()
    const before = Date.now()
    const result = addVersion({ content: 'test' }, storage)
    const after = Date.now()
    expect(result.newVersion.timestamp).toBeGreaterThanOrEqual(before)
    expect(result.newVersion.timestamp).toBeLessThanOrEqual(after)
  })

  it('应该保留变量快照', () => {
    const storage = createMockStorage()
    const variables = { '公司名称': '测试公司' }
    const result = addVersion({ content: 'test', variables }, storage)
    expect(result.newVersion.variables).toEqual(variables)
  })

  it('达到 MAX_VERSIONS 时 isMaxReached 为 true', () => {
    const storage = createMockStorage()
    let result
    for (let i = 0; i < MAX_VERSIONS; i++) {
      result = addVersion({ content: `v${i}` }, storage)
    }
    expect(result.isMaxReached).toBe(true)
  })

  it('未达到上限时 isMaxReached 为 false', () => {
    const storage = createMockStorage()
    const result = addVersion({ content: 'v1' }, storage)
    expect(result.isMaxReached).toBe(false)
  })

  it('超出 MAX_VERSIONS 时自动限制数量', () => {
    const storage = createMockStorage()
    for (let i = 0; i < MAX_VERSIONS + 3; i++) {
      addVersion({ content: `v${i}` }, storage)
    }
    const versions = loadVersions(storage)
    expect(versions.length).toBe(MAX_VERSIONS)
  })
})

describe('deleteVersion', () => {
  it('应该删除指定 id 的版本', () => {
    const storage = createMockStorage()
    const r1 = addVersion({ content: 'v1' }, storage)
    addVersion({ content: 'v2' }, storage)
    const remaining = deleteVersion(r1.newVersion.id, storage)
    expect(remaining.length).toBe(1)
    expect(remaining[0].content).toBe('v2')
  })

  it('删除后应该重新编号 versionNumber', () => {
    const storage = createMockStorage()
    addVersion({ content: 'v1' }, storage)
    const r2 = addVersion({ content: 'v2' }, storage)
    addVersion({ content: 'v3' }, storage)
    const remaining = deleteVersion(r2.newVersion.id, storage)
    expect(remaining.length).toBe(2)
    expect(remaining[0].versionNumber).toBe(2)
    expect(remaining[1].versionNumber).toBe(1)
  })

  it('删除不存在的 id 应该保持不变', () => {
    const storage = createMockStorage()
    addVersion({ content: 'v1' }, storage)
    const remaining = deleteVersion('non-existent', storage)
    expect(remaining.length).toBe(1)
  })
})

describe('clearVersions', () => {
  it('应该清除所有版本', () => {
    const storage = createMockStorage()
    addVersion({ content: 'v1' }, storage)
    addVersion({ content: 'v2' }, storage)
    const result = clearVersions(storage)
    expect(result).toEqual([])
    expect(loadVersions(storage)).toEqual([])
  })
})

describe('loadCustomTemplates / saveCustomTemplates', () => {
  it('默认情况下返回空数组', () => {
    const storage = createMockStorage()
    expect(loadCustomTemplates(storage)).toEqual([])
  })

  it('应该能正确保存和加载自定义模板', () => {
    const storage = createMockStorage()
    const templates = [
      { id: 't1', name: '模板1', content: '# 1', variables: [] },
    ]
    saveCustomTemplates(templates, storage)
    const loaded = loadCustomTemplates(storage)
    expect(loaded).toEqual(templates)
  })

  it('保存非数组应该存储空数组', () => {
    const storage = createMockStorage()
    saveCustomTemplates('not-array', storage)
    expect(loadCustomTemplates(storage)).toEqual([])
  })

  it('损坏的 JSON 数据应该返回空数组', () => {
    const storage = createMockStorage()
    storage.setItem('terms-generator-custom-templates', '{bad')
    expect(loadCustomTemplates(storage)).toEqual([])
  })
})

describe('addCustomTemplate', () => {
  it('应该添加一个自定义模板', () => {
    const storage = createMockStorage()
    const updated = addCustomTemplate(
      { name: '我的模板', description: 'test', content: '# t' },
      storage
    )
    expect(updated.length).toBe(1)
    expect(updated[0].name).toBe('我的模板')
    expect(updated[0].isDefault).toBe(false)
  })

  it('如果模板已有 id 应该使用该 id', () => {
    const storage = createMockStorage()
    const template = { id: 'my-custom-id', name: 'T', content: '' }
    const updated = addCustomTemplate(template, storage)
    expect(updated[0].id).toBe('my-custom-id')
  })

  it('如果模板没有 id 应该自动生成', () => {
    const storage = createMockStorage()
    const template = { name: 'T', content: '' }
    const updated = addCustomTemplate(template, storage)
    expect(typeof updated[0].id).toBe('string')
    expect(updated[0].id.length).toBeGreaterThan(0)
  })

  it('缺失字段应该使用默认值', () => {
    const storage = createMockStorage()
    const updated = addCustomTemplate({}, storage)
    expect(updated[0].name).toBe('自定义模板')
    expect(updated[0].description).toBe('')
    expect(Array.isArray(updated[0].variables)).toBe(true)
    expect(updated[0].content).toBe('')
  })

  it('应该设置 createdAt 时间戳', () => {
    const storage = createMockStorage()
    const before = Date.now()
    const updated = addCustomTemplate({ name: 't' }, storage)
    const after = Date.now()
    expect(updated[0].createdAt).toBeGreaterThanOrEqual(before)
    expect(updated[0].createdAt).toBeLessThanOrEqual(after)
  })
})

describe('deleteCustomTemplate', () => {
  it('应该删除指定 id 的模板', () => {
    const storage = createMockStorage()
    addCustomTemplate({ id: 't1', name: '模板1' }, storage)
    addCustomTemplate({ id: 't2', name: '模板2' }, storage)
    const remaining = deleteCustomTemplate('t1', storage)
    expect(remaining.length).toBe(1)
    expect(remaining[0].id).toBe('t2')
  })

  it('删除不存在的 id 应该保持不变', () => {
    const storage = createMockStorage()
    addCustomTemplate({ id: 't1', name: '模板1' }, storage)
    const remaining = deleteCustomTemplate('non-existent', storage)
    expect(remaining.length).toBe(1)
  })
})
