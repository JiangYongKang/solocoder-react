import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  STORAGE_KEY,
  MIN_STEPS,
  MAX_STEPS,
  MAX_GROUPS,
  DEFAULT_STEPS,
  GROUP_COLORS,
  DROP_OFF_LEVELS,
  DATE_PRESETS,
} from '../../funnel-analysis/constants'
import {
  generateStepId,
  generateGroupId,
  getDefaultState,
  loadState,
  saveState,
  getToday,
  getDateNDaysAgo,
  formatDateToStr,
  getDatePresetRange,
  isValidDateRange,
  addStep,
  removeStep,
  updateStepName,
  reorderSteps,
  addGroup,
  removeGroup,
  updateGroupName,
  updateGroupData,
  generateRandomData,
  fillGroupWithRandomData,
  calculateConversionRate,
  calculateOverallConversionRate,
  calculateDropOff,
  getDropOffLevel,
  getDropOffColor,
  getBarWidthPercentage,
  getBarGradientColor,
  validateFunnelData,
  escapeCSVValue,
  exportToCSV,
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
})

describe('日期函数', () => {
  it('getToday 返回 YYYY-MM-DD 格式', () => {
    expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('getDateNDaysAgo 返回正确的日期', () => {
    const today = new Date()
    const result = new Date(getDateNDaysAgo(7))
    const diff = Math.round((today - result) / 86400000)
    expect(diff).toBe(6)
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
