import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
    DATE_PRESETS,
    DEFAULT_STEPS,
    DROP_OFF_LEVELS,
    GROUP_COLORS,
    MAX_GROUPS,
    MAX_STEPS,
    MIN_STEPS,
    STORAGE_KEY,
} from '../../funnel-analysis/constants'
import {
    addGroup,
    addStep,
    calculateConversionRate,
    calculateDropOff,
    calculateOverallConversionRate,
    escapeCSVValue,
    exportToCSV,
    fillGroupWithRandomData,
    formatDateToStr,
    generateGroupId,
    generateRandomData,
    generateStepId,
    getBarGradientColor,
    getBarWidthPercentage,
    getDateNDaysAgo,
    getDatePresetRange,
    getDefaultState,
    getDropOffCause,
    getDropOffColor,
    getDropOffLevel,
    getToday,
    hashString,
    isValidDateRange,
    isValidGroup,
    isValidStep,
    loadState,
    removeGroup,
    removeStep,
    reorderSteps,
    saveState,
    updateGroupData,
    updateGroupName,
    updateStepName,
    validateFunnelData,
    validateStateStructure
} from '../../funnel-analysis/utils'

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

describe('generateStepId', () => {
  it('生成的ID以 s_ 开头', () => {
    expect(generateStepId()).toMatch(/^s_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateStepId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('generateGroupId', () => {
  it('生成的ID以 g_ 开头', () => {
    expect(generateGroupId()).toMatch(/^g_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateGroupId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('getDefaultState', () => {
  it('返回默认5个步骤', () => {
    const state = getDefaultState()
    expect(state.steps.length).toBe(5)
  })

  it('步骤名称正确', () => {
    const state = getDefaultState()
    expect(state.steps[0].name).toBe('页面访问')
    expect(state.steps[1].name).toBe('注册')
    expect(state.steps[2].name).toBe('加购')
    expect(state.steps[3].name).toBe('下单')
    expect(state.steps[4].name).toBe('支付')
  })

  it('默认有1个对照组', () => {
    const state = getDefaultState()
    expect(state.groups.length).toBe(1)
    expect(state.groups[0].name).toBe('对照组')
  })

  it('对照组有每个步骤的数据', () => {
    const state = getDefaultState()
    const data = state.groups[0].data
    state.steps.forEach((s) => {
      expect(data[s.id]).toBeDefined()
      expect(data[s.id]).toBeGreaterThan(0)
    })
  })

  it('数据满足漏斗递减特性', () => {
    const state = getDefaultState()
    const data = state.groups[0].data
    for (let i = 1; i < state.steps.length; i++) {
      expect(data[state.steps[i].id]).toBeLessThan(data[state.steps[i - 1].id])
    }
  })

  it('日期范围默认为最近30天', () => {
    const state = getDefaultState()
    const today = getToday()
    const thirtyAgo = getDateNDaysAgo(30)
    expect(state.dateRange.endDate).toBe(today)
    expect(state.dateRange.startDate).toBe(thirtyAgo)
  })
})

describe('loadState / saveState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveState 成功保存', () => {
    const state = getDefaultState()
    expect(saveState(state)).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  it('loadState 读取保存的数据', () => {
    const state = getDefaultState()
    saveState(state)
    const loaded = loadState()
    expect(loaded).toBeTruthy()
    expect(loaded.steps.length).toBe(5)
  })

  it('loadState localStorage 为空时返回 null', () => {
    expect(loadState()).toBeNull()
  })

  it('loadState 数据损坏时返回 null', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json')
    expect(loadState()).toBeNull()
  })

  it('loadState steps 非数组时返回 null', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ steps: 'not-array' }))
    expect(loadState()).toBeNull()
  })

  it('loadState groups 非数组时返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, groups: 'not-array' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState groups 为空数组时返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, groups: [] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState step 缺少 id 时返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, steps: [{ name: 'test' }] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState step 缺少 name 时返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, steps: [{ id: 'test' }] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState group 缺少 data 时返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, groups: [{ id: 'g1', name: 'test' }] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState dateRange 无效时返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, dateRange: null }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState dateRange 缺少 startDate 时返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, dateRange: { endDate: state.dateRange.endDate } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState steps 少于 MIN_STEPS 时返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, steps: state.steps.slice(0, MIN_STEPS - 1) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState steps 多于 MAX_STEPS 时返回 null', () => {
    const state = getDefaultState()
    const manySteps = Array.from({ length: MAX_STEPS + 1 }, (_, i) => ({
      id: `s${i}`,
      name: `步骤${i + 1}`,
    }))
    const invalidState = { ...state, steps: manySteps }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState group.data 是数组时返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, groups: [{ id: 'g1', name: 'test', data: [1, 2, 3] }] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState dateRange startDate 大于 endDate 返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, dateRange: { startDate: '2026-12-31', endDate: '2026-01-01' } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState group 缺少 name 返回 null', () => {
    const state = getDefaultState()
    const invalidState = { ...state, groups: [{ id: 'g1', data: {} }] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState steps 有重复 id 返回 null', () => {
    const state = getDefaultState()
    const dupSteps = [...state.steps, { ...state.steps[0], name: '重复' }]
    const invalidState = { ...state, steps: dupSteps }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })

  it('loadState groups 超过 MAX_GROUPS 返回 null', () => {
    const state = getDefaultState()
    const manyGroups = Array.from({ length: MAX_GROUPS + 1 }, (_, i) => ({
      id: `g${i}`,
      name: `组${i + 1}`,
      data: {},
    }))
    const invalidState = { ...state, groups: manyGroups }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidState))
    expect(loadState()).toBeNull()
  })
})

describe('hashString', () => {
  it('相同输入返回相同 hash', () => {
    const h1 = hashString('step1')
    const h2 = hashString('step1')
    expect(h1).toBe(h2)
  })

  it('不同输入返回不同 hash', () => {
    const h1 = hashString('step1')
    const h2 = hashString('step2')
    expect(h1).not.toBe(h2)
  })

  it('空字符串返回 0', () => {
    expect(hashString('')).toBe(0)
  })

  it('null 返回 0', () => {
    expect(hashString(null)).toBe(0)
  })

  it('返回非负数', () => {
    expect(hashString('any-string')).toBeGreaterThanOrEqual(0)
  })
})

describe('isValidStep', () => {
  it('有效 step 返回 true', () => {
    expect(isValidStep({ id: 's1', name: '页面访问' })).toBe(true)
  })

  it('null 返回 false', () => {
    expect(isValidStep(null)).toBe(false)
  })

  it('非对象返回 false', () => {
    expect(isValidStep('not-an-object')).toBe(false)
  })

  it('缺少 id 返回 false', () => {
    expect(isValidStep({ name: '页面访问' })).toBe(false)
  })

  it('id 不是字符串返回 false', () => {
    expect(isValidStep({ id: 123, name: '页面访问' })).toBe(false)
  })

  it('id 为空字符串返回 false', () => {
    expect(isValidStep({ id: '', name: '页面访问' })).toBe(false)
  })

  it('缺少 name 返回 false', () => {
    expect(isValidStep({ id: 's1' })).toBe(false)
  })

  it('name 不是字符串返回 false', () => {
    expect(isValidStep({ id: 's1', name: 123 })).toBe(false)
  })

  it('name 为空字符串返回 false', () => {
    expect(isValidStep({ id: 's1', name: '' })).toBe(false)
  })

  it('step 是数组返回 false', () => {
    expect(isValidStep(['s1', '页面访问'])).toBe(false)
  })
})

describe('isValidGroup', () => {
  it('有效 group 返回 true', () => {
    expect(isValidGroup({ id: 'g1', name: '对照组', data: {} })).toBe(true)
  })

  it('null 返回 false', () => {
    expect(isValidGroup(null)).toBe(false)
  })

  it('非对象返回 false', () => {
    expect(isValidGroup('not-an-object')).toBe(false)
  })

  it('缺少 id 返回 false', () => {
    expect(isValidGroup({ name: '对照组', data: {} })).toBe(false)
  })

  it('id 不是字符串返回 false', () => {
    expect(isValidGroup({ id: 123, name: '对照组', data: {} })).toBe(false)
  })

  it('id 为空字符串返回 false', () => {
    expect(isValidGroup({ id: '', name: '对照组', data: {} })).toBe(false)
  })

  it('缺少 name 返回 false', () => {
    expect(isValidGroup({ id: 'g1', data: {} })).toBe(false)
  })

  it('name 不是字符串返回 false', () => {
    expect(isValidGroup({ id: 'g1', name: 123, data: {} })).toBe(false)
  })

  it('name 为空字符串返回 false', () => {
    expect(isValidGroup({ id: 'g1', name: '', data: {} })).toBe(false)
  })

  it('缺少 data 返回 false', () => {
    expect(isValidGroup({ id: 'g1', name: '对照组' })).toBe(false)
  })

  it('data 不是对象返回 false', () => {
    expect(isValidGroup({ id: 'g1', name: '对照组', data: 'not-object' })).toBe(false)
  })

  it('group 是数组返回 false', () => {
    expect(isValidGroup(['g1', '对照组', {}])).toBe(false)
  })

  it('data 是数组返回 false', () => {
    expect(isValidGroup({ id: 'g1', name: '对照组', data: [1, 2, 3] })).toBe(false)
  })
})

describe('validateStateStructure', () => {
  it('有效状态返回 true', () => {
    const state = getDefaultState()
    expect(validateStateStructure(state)).toBe(true)
  })

  it('null 返回 false', () => {
    expect(validateStateStructure(null)).toBe(false)
  })

  it('非对象返回 false', () => {
    expect(validateStateStructure('not-object')).toBe(false)
  })

  it('缺少 steps 返回 false', () => {
    const state = getDefaultState()
    delete state.steps
    expect(validateStateStructure(state)).toBe(false)
  })

  it('steps 非数组返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, steps: 'not-array' })).toBe(false)
  })

  it('steps 长度小于 MIN_STEPS 返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, steps: state.steps.slice(0, MIN_STEPS - 1) })).toBe(false)
  })

  it('steps 长度大于 MAX_STEPS 返回 false', () => {
    const state = getDefaultState()
    const manySteps = Array.from({ length: MAX_STEPS + 1 }, (_, i) => ({
      id: `s${i}`,
      name: `步骤${i + 1}`,
    }))
    expect(validateStateStructure({ ...state, steps: manySteps })).toBe(false)
  })

  it('steps 包含无效 step 返回 false', () => {
    const state = getDefaultState()
    const badSteps = [...state.steps, { id: '', name: '' }]
    expect(validateStateStructure({ ...state, steps: badSteps })).toBe(false)
  })

  it('缺少 groups 返回 false', () => {
    const state = getDefaultState()
    delete state.groups
    expect(validateStateStructure(state)).toBe(false)
  })

  it('groups 非数组返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, groups: 'not-array' })).toBe(false)
  })

  it('groups 为空数组返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, groups: [] })).toBe(false)
  })

  it('groups 长度大于 MAX_GROUPS 返回 false', () => {
    const state = getDefaultState()
    const manyGroups = Array.from({ length: MAX_GROUPS + 1 }, (_, i) => ({
      id: `g${i}`,
      name: `组${i + 1}`,
      data: {},
    }))
    expect(validateStateStructure({ ...state, groups: manyGroups })).toBe(false)
  })

  it('groups 包含无效 group 返回 false', () => {
    const state = getDefaultState()
    const badGroups = [...state.groups, { id: '', name: '', data: {} }]
    expect(validateStateStructure({ ...state, groups: badGroups })).toBe(false)
  })

  it('缺少 dateRange 返回 false', () => {
    const state = getDefaultState()
    delete state.dateRange
    expect(validateStateStructure(state)).toBe(false)
  })

  it('dateRange 非对象返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, dateRange: 'not-object' })).toBe(false)
  })

  it('dateRange 缺少 startDate 返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, dateRange: { endDate: state.dateRange.endDate } })).toBe(false)
  })

  it('dateRange 缺少 endDate 返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, dateRange: { startDate: state.dateRange.startDate } })).toBe(false)
  })

  it('dateRange startDate 非字符串返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, dateRange: { startDate: 123, endDate: state.dateRange.endDate } })).toBe(false)
  })

  it('state 本身是数组返回 false', () => {
    expect(validateStateStructure([1, 2, 3])).toBe(false)
  })

  it('dateRange 是数组返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, dateRange: ['2026-01-01', '2026-06-01'] })).toBe(false)
  })

  it('dateRange endDate 非字符串返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, dateRange: { startDate: state.dateRange.startDate, endDate: 456 } })).toBe(false)
  })

  it('dateRange 中 startDate > endDate 返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, dateRange: { startDate: '2026-12-31', endDate: '2026-01-01' } })).toBe(false)
  })

  it('dateRange 中无效日期格式返回 false', () => {
    const state = getDefaultState()
    expect(validateStateStructure({ ...state, dateRange: { startDate: 'not-date', endDate: 'also-invalid' } })).toBe(false)
  })

  it('steps 有重复 id 返回 false', () => {
    const state = getDefaultState()
    const dupSteps = [...state.steps, { ...state.steps[0], name: '重复ID' }]
    expect(validateStateStructure({ ...state, steps: dupSteps })).toBe(false)
  })
})

describe('getDropOffCause', () => {
  it('LOW 级别返回固定文案', () => {
    const result = getDropOffCause(20, 'step1')
    expect(result).toBe('该环节转化良好，无明显流失问题')
  })

  it('相同 stepId 和 rate 返回相同原因', () => {
    const cause1 = getDropOffCause(60, 'step_register')
    const cause2 = getDropOffCause(60, 'step_register')
    expect(cause1).toBe(cause2)
  })

  it('不同 stepId 可能返回不同原因', () => {
    const causes = new Set()
    for (let i = 0; i < 10; i++) {
      causes.add(getDropOffCause(60, `step_${i}`))
    }
    expect(causes.size).toBeGreaterThan(1)
  })

  it('MEDIUM 级别返回原因文案', () => {
    const result = getDropOffCause(40, 'step_purchase')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('HIGH 级别返回原因文案', () => {
    const result = getDropOffCause(70, 'step_payment')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('空 stepId 也能返回确定结果', () => {
    const cause1 = getDropOffCause(60, '')
    const cause2 = getDropOffCause(60, '')
    expect(cause1).toBe(cause2)
  })

  it('stepId 为 null 也能返回确定结果', () => {
    const cause1 = getDropOffCause(60, null)
    const cause2 = getDropOffCause(60, null)
    expect(cause1).toBe(cause2)
  })

  it('多次调用同一参数结果一致', () => {
    const stepId = 'test_step_123'
    const results = []
    for (let i = 0; i < 20; i++) {
      results.push(getDropOffCause(55, stepId))
    }
    const uniqueResults = new Set(results)
    expect(uniqueResults.size).toBe(1)
  })
})

describe('日期函数', () => {
  it('getToday 返回 YYYY-MM-DD 格式', () => {
    expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('getDateNDaysAgo 返回正确的日期 - 完整n天包含两端', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const result = new Date(getDateNDaysAgo(7))
    result.setHours(0, 0, 0, 0)
    const diff = Math.round((today - result) / 86400000)
    expect(diff).toBe(6)
  })

  it('getDateNDaysAgo(1) 返回今天（因为包含今天）', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const result = new Date(getDateNDaysAgo(1))
    result.setHours(0, 0, 0, 0)
    const diff = Math.round((today - result) / 86400000)
    expect(diff).toBe(0)
  })

  it('getDateNDaysAgo(7) 与 today 之间相差6天间隔共7个自然日', () => {
    const todayStr = getToday()
    const startStr = getDateNDaysAgo(7)
    const days = []
    let cursor = new Date(startStr)
    const end = new Date(todayStr)
    while (cursor <= end) {
      days.push(formatDateToStr(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    expect(days.length).toBe(7)
  })

  it('getDateNDaysAgo 不修改原始日期对象', () => {
    const d = new Date()
    const originalTime = d.getTime()
    getDateNDaysAgo(7)
    expect(d.getTime()).toBe(originalTime)
  })

  it('formatDateToStr 格式化正确', () => {
    const d = new Date(2026, 5, 12)
    expect(formatDateToStr(d)).toBe('2026-06-12')
  })

  it('getDatePresetRange last7', () => {
    const range = getDatePresetRange('last7')
    expect(range.startDate).toBeTruthy()
    expect(range.endDate).toBe(getToday())
  })

  it('getDatePresetRange last30', () => {
    const range = getDatePresetRange('last30')
    expect(range.startDate).toBe(getDateNDaysAgo(30))
  })

  it('getDatePresetRange thisMonth', () => {
    const range = getDatePresetRange('thisMonth')
    const today = new Date()
    expect(range.startDate).toBe(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`)
  })

  it('getDatePresetRange thisQuarter', () => {
    const range = getDatePresetRange('thisQuarter')
    const today = new Date()
    const quarter = Math.floor(today.getMonth() / 3)
    const qStart = quarter * 3 + 1
    expect(range.startDate).toBe(`${today.getFullYear()}-${String(qStart).padStart(2, '0')}-01`)
  })

  it('getDatePresetRange 无效key返回空startDate', () => {
    const range = getDatePresetRange('invalid')
    expect(range.startDate).toBe('')
  })

  it('isValidDateRange 有效日期范围', () => {
    expect(isValidDateRange('2026-01-01', '2026-06-12')).toBe(true)
  })

  it('isValidDateRange 起始大于结束返回 false', () => {
    expect(isValidDateRange('2026-06-12', '2026-01-01')).toBe(false)
  })

  it('isValidDateRange 空值返回 false', () => {
    expect(isValidDateRange('', '2026-01-01')).toBe(false)
    expect(isValidDateRange('2026-01-01', '')).toBe(false)
  })

  it('isValidDateRange 无效日期返回 false', () => {
    expect(isValidDateRange('not-a-date', '2026-01-01')).toBe(false)
  })

  it('isValidDateRange 相同日期返回 true', () => {
    expect(isValidDateRange('2026-01-01', '2026-01-01')).toBe(true)
  })
})

describe('addStep', () => {
  it('成功添加步骤', () => {
    const steps = [...DEFAULT_STEPS]
    const result = addStep(steps)
    expect(result.success).toBe(true)
    expect(result.steps.length).toBe(6)
    expect(result.steps[5].name).toBeTruthy()
  })

  it('达到最大步骤数时失败', () => {
    const steps = Array.from({ length: MAX_STEPS }, (_, i) => ({
      id: `s${i}`,
      name: `步骤${i + 1}`,
    }))
    const result = addStep(steps)
    expect(result.success).toBe(false)
  })
})

describe('removeStep', () => {
  it('成功删除步骤并清理数据', () => {
    const steps = [...DEFAULT_STEPS]
    const groups = [{ id: 'g1', name: '组1', data: {} }]
    steps.forEach((s) => { groups[0].data[s.id] = 100 })
    const result = removeStep(steps, steps[2].id, groups)
    expect(result.success).toBe(true)
    expect(result.steps.length).toBe(4)
    expect(result.groups[0].data[steps[2].id]).toBeUndefined()
  })

  it('步骤数等于最小值时失败', () => {
    const steps = DEFAULT_STEPS.slice(0, MIN_STEPS)
    const result = removeStep(steps, steps[0].id, [])
    expect(result.success).toBe(false)
  })
})

describe('updateStepName', () => {
  it('更新步骤名称', () => {
    const steps = [...DEFAULT_STEPS]
    const result = updateStepName(steps, steps[0].id, '新名称')
    expect(result[0].name).toBe('新名称')
  })

  it('不修改原数组', () => {
    const steps = [...DEFAULT_STEPS]
    updateStepName(steps, steps[0].id, '新名称')
    expect(steps[0].name).toBe('页面访问')
  })
})

describe('reorderSteps', () => {
  it('成功移动步骤顺序', () => {
    const steps = DEFAULT_STEPS.map((s) => ({ ...s }))
    const result = reorderSteps(steps, steps[0].id, steps[2].id)
    expect(result[2].id).toBe(DEFAULT_STEPS[0].id)
    expect(result[0].id).toBe(DEFAULT_STEPS[1].id)
    expect(result[1].id).toBe(DEFAULT_STEPS[2].id)
  })

  it('无效ID不修改', () => {
    const steps = [...DEFAULT_STEPS]
    const result = reorderSteps(steps, 'invalid', 'also-invalid')
    expect(result.map((s) => s.id)).toEqual(steps.map((s) => s.id))
  })

  it('相同ID不修改', () => {
    const steps = [...DEFAULT_STEPS]
    const result = reorderSteps(steps, steps[0].id, steps[0].id)
    expect(result.map((s) => s.id)).toEqual(steps.map((s) => s.id))
  })
})

describe('addGroup', () => {
  it('成功添加组', () => {
    const groups = [{ id: 'g1', name: '组1', data: {} }]
    const result = addGroup(groups)
    expect(result.success).toBe(true)
    expect(result.groups.length).toBe(2)
  })

  it('达到最大组数时失败', () => {
    const groups = Array.from({ length: MAX_GROUPS }, (_, i) => ({
      id: `g${i}`,
      name: `组${i + 1}`,
      data: {},
    }))
    const result = addGroup(groups)
    expect(result.success).toBe(false)
  })
})

describe('removeGroup', () => {
  it('成功删除组', () => {
    const groups = [
      { id: 'g1', name: '组1', data: {} },
      { id: 'g2', name: '组2', data: {} },
    ]
    const result = removeGroup(groups, 'g2')
    expect(result.success).toBe(true)
    expect(result.groups.length).toBe(1)
  })

  it('只剩1个组时失败', () => {
    const groups = [{ id: 'g1', name: '组1', data: {} }]
    const result = removeGroup(groups, 'g1')
    expect(result.success).toBe(false)
  })
})

describe('updateGroupName', () => {
  it('更新组名称', () => {
    const groups = [{ id: 'g1', name: '组1', data: {} }]
    const result = updateGroupName(groups, 'g1', '实验组A')
    expect(result[0].name).toBe('实验组A')
  })
})

describe('updateGroupData', () => {
  it('更新步骤用户数', () => {
    const groups = [{ id: 'g1', name: '组1', data: { s1: 100 } }]
    const result = updateGroupData(groups, 'g1', 's1', 200)
    expect(result[0].data.s1).toBe(200)
  })

  it('不影响其他组', () => {
    const groups = [
      { id: 'g1', name: '组1', data: { s1: 100 } },
      { id: 'g2', name: '组2', data: { s1: 50 } },
    ]
    const result = updateGroupData(groups, 'g1', 's1', 200)
    expect(result[1].data.s1).toBe(50)
  })
})

describe('generateRandomData', () => {
  it('为所有步骤生成数据', () => {
    const steps = DEFAULT_STEPS
    const data = generateRandomData(steps)
    steps.forEach((s) => {
      expect(data[s.id]).toBeDefined()
      expect(data[s.id]).toBeGreaterThan(0)
    })
  })

  it('数据满足漏斗递减', () => {
    const steps = DEFAULT_STEPS
    for (let t = 0; t < 20; t++) {
      const data = generateRandomData(steps)
      for (let i = 1; i < steps.length; i++) {
        expect(data[steps[i].id]).toBeLessThanOrEqual(data[steps[i - 1].id])
      }
    }
  })

  it('第一步数据在合理范围', () => {
    const steps = DEFAULT_STEPS
    for (let t = 0; t < 20; t++) {
      const data = generateRandomData(steps)
      expect(data[steps[0].id]).toBeGreaterThanOrEqual(10000)
      expect(data[steps[0].id]).toBeLessThan(13000)
    }
  })
})

describe('fillGroupWithRandomData', () => {
  it('填充指定组的随机数据', () => {
    const groups = [{ id: 'g1', name: '组1', data: {} }]
    const steps = DEFAULT_STEPS
    const result = fillGroupWithRandomData(groups, 'g1', steps)
    steps.forEach((s) => {
      expect(result[0].data[s.id]).toBeGreaterThan(0)
    })
  })

  it('不影响其他组', () => {
    const groups = [
      { id: 'g1', name: '组1', data: { s1: 100 } },
      { id: 'g2', name: '组2', data: {} },
    ]
    const steps = DEFAULT_STEPS
    const result = fillGroupWithRandomData(groups, 'g2', steps)
    expect(result[0].data.s1).toBe(100)
  })
})

describe('calculateConversionRate', () => {
  it('计算转化率', () => {
    expect(calculateConversionRate(7500, 10000)).toBe(75)
  })

  it('上一步为0返回0', () => {
    expect(calculateConversionRate(100, 0)).toBe(0)
  })

  it('保留两位小数', () => {
    const rate = calculateConversionRate(3333, 10000)
    expect(rate).toBe(33.33)
  })

  it('完全转化返回100', () => {
    expect(calculateConversionRate(10000, 10000)).toBe(100)
  })
})

describe('calculateOverallConversionRate', () => {
  it('计算总转化率', () => {
    expect(calculateOverallConversionRate(2000, 10000)).toBe(20)
  })

  it('第一步为0返回0', () => {
    expect(calculateOverallConversionRate(100, 0)).toBe(0)
  })
})

describe('calculateDropOff', () => {
  it('计算流失数和流失率', () => {
    const result = calculateDropOff(7500, 10000)
    expect(result.count).toBe(2500)
    expect(result.rate).toBe(25)
  })

  it('上一步为0返回0', () => {
    const result = calculateDropOff(100, 0)
    expect(result.count).toBe(0)
    expect(result.rate).toBe(0)
  })

  it('无流失返回0', () => {
    const result = calculateDropOff(10000, 10000)
    expect(result.count).toBe(0)
    expect(result.rate).toBe(0)
  })

  it('完全流失', () => {
    const result = calculateDropOff(0, 10000)
    expect(result.count).toBe(10000)
    expect(result.rate).toBe(100)
  })
})

describe('getDropOffLevel', () => {
  it('高于50%为HIGH', () => {
    expect(getDropOffLevel(60)).toBe('HIGH')
    expect(getDropOffLevel(50.1)).toBe('HIGH')
  })

  it('30%-50%为MEDIUM', () => {
    expect(getDropOffLevel(40)).toBe('MEDIUM')
    expect(getDropOffLevel(30.1)).toBe('MEDIUM')
  })

  it('低于30%为LOW', () => {
    expect(getDropOffLevel(20)).toBe('LOW')
    expect(getDropOffLevel(30)).toBe('LOW')
    expect(getDropOffLevel(0)).toBe('LOW')
  })
})

describe('getDropOffColor', () => {
  it('HIGH返回红色', () => {
    expect(getDropOffColor(60)).toBe(DROP_OFF_LEVELS.HIGH.color)
  })

  it('MEDIUM返回橙色', () => {
    expect(getDropOffColor(40)).toBe(DROP_OFF_LEVELS.MEDIUM.color)
  })

  it('LOW返回灰色', () => {
    expect(getDropOffColor(20)).toBe(DROP_OFF_LEVELS.LOW.color)
  })
})

describe('getBarWidthPercentage', () => {
  it('最大值返回100', () => {
    expect(getBarWidthPercentage(10000, 10000)).toBe(100)
  })

  it('按比例计算', () => {
    expect(getBarWidthPercentage(5000, 10000)).toBe(50)
  })

  it('最大值为0返回0', () => {
    expect(getBarWidthPercentage(5000, 0)).toBe(0)
  })

  it('保留两位小数', () => {
    const result = getBarWidthPercentage(3333, 10000)
    expect(result).toBe(33.33)
  })
})

describe('getBarGradientColor', () => {
  it('返回rgb格式颜色', () => {
    const color = getBarGradientColor(0, 5)
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it('第一个步骤颜色最深', () => {
    const first = getBarGradientColor(0, 5)
    const last = getBarGradientColor(4, 5)
    expect(first).not.toBe(last)
  })
})

describe('validateFunnelData', () => {
  const steps = [
    { id: 's1', name: '步骤1' },
    { id: 's2', name: '步骤2' },
    { id: 's3', name: '步骤3' },
  ]

  it('有效数据返回空错误', () => {
    const data = { s1: 10000, s2: 7500, s3: 5000 }
    const errors = validateFunnelData(steps, data)
    expect(Object.keys(errors).length).toBe(0)
  })

  it('后一步大于前一步报错', () => {
    const data = { s1: 10000, s2: 15000, s3: 5000 }
    const errors = validateFunnelData(steps, data)
    expect(errors.s2).toBeTruthy()
    expect(errors.s2).toContain('上一步')
  })

  it('负数报错', () => {
    const data = { s1: 10000, s2: -5, s3: 5000 }
    const errors = validateFunnelData(steps, data)
    expect(errors.s2).toBeTruthy()
    expect(errors.s2).toContain('负数')
  })

  it('缺失值视为0不报错', () => {
    const data = { s1: 10000, s3: 5000 }
    const errors = validateFunnelData(steps, data)
    expect(errors.s2).toBeFalsy()
  })

  it('多步违反都报错', () => {
    const data = { s1: 10000, s2: 15000, s3: 20000 }
    const errors = validateFunnelData(steps, data)
    expect(errors.s2).toBeTruthy()
    expect(errors.s3).toBeTruthy()
  })
})

describe('escapeCSVValue', () => {
  it('普通字符串不转义', () => {
    expect(escapeCSVValue('hello')).toBe('hello')
  })

  it('包含逗号用双引号包裹', () => {
    expect(escapeCSVValue('a,b')).toBe('"a,b"')
  })

  it('包含双引号转义', () => {
    expect(escapeCSVValue('a"b')).toBe('"a""b"')
  })

  it('null 返回空字符串', () => {
    expect(escapeCSVValue(null)).toBe('')
  })

  it('undefined 返回空字符串', () => {
    expect(escapeCSVValue(undefined)).toBe('')
  })

  it('数字转为字符串', () => {
    expect(escapeCSVValue(100)).toBe('100')
  })
})

describe('exportToCSV', () => {
  const steps = [
    { id: 's1', name: '页面访问' },
    { id: 's2', name: '注册' },
    { id: 's3', name: '支付' },
  ]

  it('单组导出正确', () => {
    const groups = [
      { id: 'g1', name: '对照组', data: { s1: 10000, s2: 7500, s3: 5000 } },
    ]
    const csv = exportToCSV(steps, groups)
    expect(csv).toContain('步骤名称')
    expect(csv).toContain('对照组 用户数')
    expect(csv).toContain('对照组 转化率(%)')
    expect(csv).toContain('页面访问')
    expect(csv).toContain('10000')
    expect(csv).toContain('7500')
    expect(csv).toContain('5000')
    expect(csv).toContain('总转化率')
  })

  it('多组导出包含所有组', () => {
    const groups = [
      { id: 'g1', name: '对照组', data: { s1: 10000, s2: 7500, s3: 5000 } },
      { id: 'g2', name: '实验组', data: { s1: 10000, s2: 8000, s3: 6000 } },
    ]
    const csv = exportToCSV(steps, groups)
    expect(csv).toContain('对照组 用户数')
    expect(csv).toContain('实验组 用户数')
    expect(csv).toContain('对照组 转化率(%)')
    expect(csv).toContain('实验组 转化率(%)')
  })

  it('空步骤返回空字符串', () => {
    expect(exportToCSV([], [{ id: 'g1', name: '组1', data: {} }])).toBe('')
  })

  it('空组返回空字符串', () => {
    expect(exportToCSV(steps, [])).toBe('')
  })

  it('转化率计算正确', () => {
    const groups = [
      { id: 'g1', name: '对照组', data: { s1: 10000, s2: 7500, s3: 5000 } },
    ]
    const csv = exportToCSV(steps, groups)
    const lines = csv.split('\n')
    const dataLines = lines.slice(1)
    const step2Line = dataLines.find((l) => l.includes('注册'))
    expect(step2Line).toContain('75')
    const step3Line = dataLines.find((l) => l.includes('支付'))
    expect(step3Line).toContain('66.67')
  })

  it('总转化率行存在', () => {
    const groups = [
      { id: 'g1', name: '对照组', data: { s1: 10000, s2: 7500, s3: 5000 } },
    ]
    const csv = exportToCSV(steps, groups)
    const lines = csv.split('\n')
    const lastLine = lines[lines.length - 1]
    expect(lastLine).toContain('总转化率')
    expect(lastLine).toContain('50')
  })

  it('缺失数据视为0', () => {
    const groups = [
      { id: 'g1', name: '对照组', data: { s1: 10000 } },
    ]
    const csv = exportToCSV(steps, groups)
    expect(csv).toContain('0')
  })
})

describe('constants', () => {
  it('MIN_STEPS 为 3', () => {
    expect(MIN_STEPS).toBe(3)
  })

  it('MAX_STEPS 为 10', () => {
    expect(MAX_STEPS).toBe(10)
  })

  it('MAX_GROUPS 为 5', () => {
    expect(MAX_GROUPS).toBe(5)
  })

  it('GROUP_COLORS 有5种颜色', () => {
    expect(GROUP_COLORS.length).toBe(5)
  })

  it('DATE_PRESETS 有4个选项', () => {
    expect(DATE_PRESETS.length).toBe(4)
  })

  it('DROP_OFF_LEVELS 有3个级别', () => {
    expect(Object.keys(DROP_OFF_LEVELS).length).toBe(3)
  })

  it('DEFAULT_STEPS 有5个步骤', () => {
    expect(DEFAULT_STEPS.length).toBe(5)
  })

  it('每个DEFAULT_STEP有id和name', () => {
    DEFAULT_STEPS.forEach((s) => {
      expect(s.id).toBeTruthy()
      expect(s.name).toBeTruthy()
    })
  })
})
