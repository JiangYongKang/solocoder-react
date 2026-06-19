import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_GOALS,
  BMI_RANGES,
} from '../../health-tracker/constants'
import {
  generateId,
  formatDate,
  getTodayKey,
  calculateBMI,
  getBMICategory,
  getBMIColor,
  isAbnormal,
  validateField,
  validateRecord,
  createRecord,
  deleteRecord,
  countAbnormalRecords,
  filterRecords,
  paginateRecords,
  buildTrendData,
  generateTrendSummary,
  calculateWeightProgress,
  calculateExerciseProgress,
  loadRecords,
  saveRecords,
  loadGoals,
  saveGoals,
  validateGoals,
  setGoals,
  getLatestValues,
  generateReportContent,
} from '../../health-tracker/utils'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
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

describe('generateId', () => {
  it('生成的ID以 ht_ 开头', () => {
    expect(generateId()).toMatch(/^ht_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) ids.add(generateId())
    expect(ids.size).toBe(100)
  })
})

describe('formatDate', () => {
  it('格式化日期为 YYYY-MM-DD', () => {
    expect(formatDate('2025-01-15')).toBe('2025-01-15')
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
  })
})

describe('getTodayKey', () => {
  it('返回当天日期字符串', () => {
    const today = getTodayKey()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('calculateBMI', () => {
  it('正常计算BMI', () => {
    expect(calculateBMI(70, 170)).toBe(24.2)
    expect(calculateBMI(60, 160)).toBe(23.4)
  })

  it('身高为0返回null', () => {
    expect(calculateBMI(70, 0)).toBe(null)
  })

  it('体重为0返回null', () => {
    expect(calculateBMI(0, 170)).toBe(null)
  })

  it('参数缺失返回null', () => {
    expect(calculateBMI(null, 170)).toBe(null)
    expect(calculateBMI(70, null)).toBe(null)
    expect(calculateBMI()).toBe(null)
  })

  it('负数返回null', () => {
    expect(calculateBMI(-70, 170)).toBe(null)
    expect(calculateBMI(70, -170)).toBe(null)
  })

  it('精确到一位小数', () => {
    const bmi = calculateBMI(65, 175)
    expect(bmi).toBe(Math.round((65 / 1.75 / 1.75) * 10) / 10)
  })
})

describe('getBMICategory', () => {
  it('偏瘦', () => {
    expect(getBMICategory(17)).toBe('underweight')
    expect(getBMICategory(18.4)).toBe('underweight')
  })

  it('正常', () => {
    expect(getBMICategory(18.5)).toBe('normal')
    expect(getBMICategory(22)).toBe('normal')
    expect(getBMICategory(23.9)).toBe('normal')
  })

  it('偏胖', () => {
    expect(getBMICategory(24)).toBe('overweight')
    expect(getBMICategory(27.9)).toBe('overweight')
  })

  it('肥胖', () => {
    expect(getBMICategory(28)).toBe('obese')
    expect(getBMICategory(35)).toBe('obese')
  })

  it('null返回null', () => {
    expect(getBMICategory(null)).toBe(null)
    expect(getBMICategory(undefined)).toBe(null)
  })
})

describe('getBMIColor', () => {
  it('偏瘦为蓝色', () => {
    expect(getBMIColor(17)).toBe(BMI_RANGES.underweight.color)
  })

  it('正常为绿色', () => {
    expect(getBMIColor(22)).toBe(BMI_RANGES.normal.color)
  })

  it('偏胖为黄色', () => {
    expect(getBMIColor(26)).toBe(BMI_RANGES.overweight.color)
  })

  it('肥胖为红色', () => {
    expect(getBMIColor(30)).toBe(BMI_RANGES.obese.color)
  })

  it('null返回灰色', () => {
    expect(getBMIColor(null)).toBe('#999')
  })
})

describe('isAbnormal', () => {
  it('收缩压异常', () => {
    expect(isAbnormal('systolic', 150)).toBe(true)
    expect(isAbnormal('systolic', 80)).toBe(true)
    expect(isAbnormal('systolic', 120)).toBe(false)
  })

  it('舒张压异常', () => {
    expect(isAbnormal('diastolic', 100)).toBe(true)
    expect(isAbnormal('diastolic', 50)).toBe(true)
    expect(isAbnormal('diastolic', 75)).toBe(false)
  })

  it('血糖异常', () => {
    expect(isAbnormal('bloodSugar', 7.0)).toBe(true)
    expect(isAbnormal('bloodSugar', 3.5)).toBe(true)
    expect(isAbnormal('bloodSugar', 5.0)).toBe(false)
  })

  it('身高体重无正常范围定义返回false', () => {
    expect(isAbnormal('height', 300)).toBe(false)
    expect(isAbnormal('weight', 500)).toBe(false)
  })

  it('边界值正常', () => {
    expect(isAbnormal('systolic', 90)).toBe(false)
    expect(isAbnormal('systolic', 140)).toBe(false)
    expect(isAbnormal('diastolic', 60)).toBe(false)
    expect(isAbnormal('diastolic', 90)).toBe(false)
    expect(isAbnormal('bloodSugar', 3.9)).toBe(false)
    expect(isAbnormal('bloodSugar', 6.1)).toBe(false)
  })

  it('空值返回false', () => {
    expect(isAbnormal('systolic', null)).toBe(false)
    expect(isAbnormal('systolic', '')).toBe(false)
    expect(isAbnormal('systolic', undefined)).toBe(false)
  })
})

describe('validateField', () => {
  it('身高超出范围提示', () => {
    expect(validateField('height', 30)).toBeTruthy()
    expect(validateField('height', 300)).toBeTruthy()
    expect(validateField('height', 170)).toBe('')
  })

  it('体重超出范围提示', () => {
    expect(validateField('weight', 10)).toBeTruthy()
    expect(validateField('weight', 400)).toBeTruthy()
    expect(validateField('weight', 65)).toBe('')
  })

  it('收缩压超出范围提示', () => {
    expect(validateField('systolic', 50)).toBeTruthy()
    expect(validateField('systolic', 260)).toBeTruthy()
    expect(validateField('systolic', 120)).toBe('')
  })

  it('舒张压超出范围提示', () => {
    expect(validateField('diastolic', 20)).toBeTruthy()
    expect(validateField('diastolic', 160)).toBeTruthy()
    expect(validateField('diastolic', 80)).toBe('')
  })

  it('血糖超出范围提示', () => {
    expect(validateField('bloodSugar', 1.0)).toBeTruthy()
    expect(validateField('bloodSugar', 35)).toBeTruthy()
    expect(validateField('bloodSugar', 5.5)).toBe('')
  })

  it('空值通过', () => {
    expect(validateField('height', '')).toBe('')
    expect(validateField('height', null)).toBe('')
    expect(validateField('height', undefined)).toBe('')
  })

  it('非数字提示', () => {
    expect(validateField('height', 'abc')).toBeTruthy()
  })
})

describe('validateRecord', () => {
  it('所有字段为空时报错', () => {
    const errors = validateRecord({ date: '2025-01-01', height: '', weight: '', systolic: '', diastolic: '', bloodSugar: '' })
    expect(errors._form).toBeTruthy()
  })

  it('至少一项有值时通过_form', () => {
    const errors = validateRecord({ date: '2025-01-01', height: '170', weight: '', systolic: '', diastolic: '', bloodSugar: '' })
    expect(errors._form).toBeUndefined()
  })

  it('日期为空时报错', () => {
    const errors = validateRecord({ date: '', height: '170' })
    expect(errors.date).toBeTruthy()
  })

  it('字段超范围报错', () => {
    const errors = validateRecord({ date: '2025-01-01', height: '500' })
    expect(errors.height).toBeTruthy()
  })

  it('有效数据通过', () => {
    const errors = validateRecord({ date: '2025-01-01', height: '170', weight: '65' })
    expect(Object.keys(errors).length).toBe(0)
  })
})

describe('createRecord', () => {
  it('数据无效时返回失败', () => {
    const result = createRecord([], { date: '', height: '', weight: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建记录', () => {
    const result = createRecord([], { date: '2025-01-01', height: '170', weight: '65' })
    expect(result.success).toBe(true)
    expect(result.record.height).toBe(170)
    expect(result.record.weight).toBe(65)
    expect(result.record.bmi).toBe(calculateBMI(65, 170))
    expect(result.record.id).toBeTruthy()
    expect(result.records.length).toBe(1)
  })

  it('BMI仅在有身高和体重时计算', () => {
    const result = createRecord([], { date: '2025-01-01', height: '170' })
    expect(result.success).toBe(true)
    expect(result.record.bmi).toBeUndefined()
  })

  it('异常字段标记', () => {
    const result = createRecord([], { date: '2025-01-01', systolic: '160' })
    expect(result.success).toBe(true)
    expect(result.record.abnormalFields).toContain('systolic')
  })

  it('新记录放在最前面', () => {
    const existing = [{ id: 'old' }]
    const result = createRecord(existing, { date: '2025-01-01', height: '170' })
    expect(result.records[0].id).toBe(result.record.id)
    expect(result.records[1].id).toBe('old')
  })
})

describe('deleteRecord', () => {
  it('记录不存在时返回失败', () => {
    const result = deleteRecord([], 'not-exist')
    expect(result.success).toBe(false)
  })

  it('成功删除记录', () => {
    const records = [{ id: '1' }, { id: '2' }]
    const result = deleteRecord(records, '1')
    expect(result.success).toBe(true)
    expect(result.records.length).toBe(1)
  })
})

describe('countAbnormalRecords', () => {
  it('计算异常记录数', () => {
    const records = [
      { id: '1', abnormalFields: ['systolic'] },
      { id: '2', abnormalFields: [] },
      { id: '3', abnormalFields: ['bloodSugar', 'diastolic'] },
    ]
    expect(countAbnormalRecords(records)).toBe(2)
  })

  it('无异常记录返回0', () => {
    expect(countAbnormalRecords([])).toBe(0)
    expect(countAbnormalRecords([{ id: '1', abnormalFields: [] }])).toBe(0)
  })
})

describe('filterRecords', () => {
  const records = [
    { id: '1', abnormalFields: ['systolic'] },
    { id: '2', abnormalFields: [] },
    { id: '3', abnormalFields: ['bloodSugar'] },
  ]

  it('不筛选时返回全部', () => {
    expect(filterRecords(records, false).length).toBe(3)
  })

  it('筛选异常记录', () => {
    expect(filterRecords(records, true).length).toBe(2)
  })
})

describe('paginateRecords', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('第一页正确', () => {
    const result = paginateRecords(items, 1)
    expect(result.items.length).toBe(10)
    expect(result.currentPage).toBe(1)
    expect(result.total).toBe(25)
    expect(result.totalPage).toBe(3)
  })

  it('最后一页正确', () => {
    const result = paginateRecords(items, 3)
    expect(result.items.length).toBe(5)
  })

  it('页码超出范围修正', () => {
    const result = paginateRecords(items, 100)
    expect(result.currentPage).toBe(3)
  })

  it('空列表返回第一页', () => {
    const result = paginateRecords([], 1)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })
})

describe('buildTrendData', () => {
  it('生成30天数据', () => {
    const data = buildTrendData([], 30)
    expect(data.length).toBe(30)
    data.forEach((d) => {
      expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(d.label).toBeTruthy()
    })
  })

  it('正确映射每日数据', () => {
    const today = getTodayKey()
    const records = [{ id: '1', date: today, height: 170, weight: 65, bmi: 22.5 }]
    const data = buildTrendData(records, 1)
    expect(data.length).toBe(1)
    expect(data[0].height).toBe(170)
    expect(data[0].weight).toBe(65)
    expect(data[0].bmi).toBe(22.5)
  })

  it('无数据的日期为null', () => {
    const data = buildTrendData([], 1)
    expect(data[0].height).toBeNull()
    expect(data[0].weight).toBeNull()
  })
})

describe('generateTrendSummary', () => {
  it('数据不足时返回数据不足', () => {
    const trendData = Array.from({ length: 30 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      label: `1/${i + 1}`,
      height: null, weight: null, systolic: null, diastolic: null, bloodSugar: null, bmi: null,
    }))
    trendData[15].systolic = 120
    const summary = generateTrendSummary(trendData)
    expect(summary.systolic.trend).toBe('数据不足')
  })

  it('上升趋势', () => {
    const trendData = []
    for (let i = 0; i < 30; i++) {
      trendData.push({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        label: `1/${i + 1}`,
        height: 170,
        weight: 60 + i * 0.2,
        systolic: 110 + i,
        diastolic: 70 + i,
        bloodSugar: 4.5 + i * 0.1,
        bmi: 20.8 + i * 0.07,
      })
    }
    const summary = generateTrendSummary(trendData)
    expect(summary.weight.trend).toBe('rising')
    expect(summary.systolic.trend).toBe('rising')
  })

  it('下降趋势', () => {
    const trendData = []
    for (let i = 0; i < 30; i++) {
      trendData.push({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        label: `1/${i + 1}`,
        height: 170,
        weight: 80 - i * 0.2,
        systolic: 150 - i,
        diastolic: 95 - i,
        bloodSugar: 7.5 - i * 0.1,
        bmi: 27.7 - i * 0.07,
      })
    }
    const summary = generateTrendSummary(trendData)
    expect(summary.weight.trend).toBe('falling')
  })

  it('稳定趋势', () => {
    const trendData = []
    for (let i = 0; i < 30; i++) {
      trendData.push({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        label: `1/${i + 1}`,
        height: 170,
        weight: 65,
        systolic: 120,
        diastolic: 80,
        bloodSugar: 5.0,
        bmi: 22.5,
      })
    }
    const summary = generateTrendSummary(trendData)
    expect(summary.weight.trend).toBe('stable')
  })
})

describe('calculateWeightProgress', () => {
  it('计算体重进度', () => {
    const progress = calculateWeightProgress(70, 65)
    expect(progress).toBeTruthy()
    expect(progress.targetWeight).toBe(65)
  })

  it('当前等于目标时完成', () => {
    const progress = calculateWeightProgress(65, 65)
    expect(progress.isCompleted).toBe(true)
    expect(progress.percent).toBe(100)
  })

  it('参数缺失返回null', () => {
    expect(calculateWeightProgress(null, 65)).toBe(null)
    expect(calculateWeightProgress(70, null)).toBe(null)
  })
})

describe('calculateExerciseProgress', () => {
  it('计算运动进度', () => {
    const progress = calculateExerciseProgress(2, 5)
    expect(progress.percent).toBe(40)
    expect(progress.isCompleted).toBe(false)
  })

  it('目标完成', () => {
    const progress = calculateExerciseProgress(5, 5)
    expect(progress.isCompleted).toBe(true)
    expect(progress.percent).toBe(100)
  })

  it('超额完成', () => {
    const progress = calculateExerciseProgress(7, 5)
    expect(progress.isCompleted).toBe(true)
    expect(progress.percent).toBe(100)
  })

  it('目标为0返回null', () => {
    expect(calculateExerciseProgress(2, 0)).toBe(null)
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveRecords 保存到 localStorage', () => {
    const records = [{ id: '1', height: 170 }]
    expect(saveRecords(records)).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_RECORDS)).toBe(JSON.stringify(records))
  })

  it('loadRecords 从 localStorage 读取', () => {
    const records = [{ id: '1', height: 170 }]
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
    expect(loadRecords()).toEqual(records)
  })

  it('loadRecords 为空时返回空数组', () => {
    expect(loadRecords()).toEqual([])
  })

  it('loadRecords 数据损坏返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_RECORDS, 'invalid-json')
    expect(loadRecords()).toEqual([])
  })

  it('saveGoals 保存到 localStorage', () => {
    const goals = { weightTarget: 65, weightDeadline: '2025-12-31', weeklyExercise: 3, weeklyExerciseDone: 1 }
    expect(saveGoals(goals)).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_GOALS)).toBe(JSON.stringify(goals))
  })

  it('loadGoals 从 localStorage 读取', () => {
    const goals = { weightTarget: 65, weightDeadline: '2025-12-31', weeklyExercise: 3, weeklyExerciseDone: 1 }
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals))
    const loaded = loadGoals()
    expect(loaded.weightTarget).toBe(65)
    expect(loaded.weeklyExercise).toBe(3)
  })

  it('loadGoals 为空时返回默认值', () => {
    const loaded = loadGoals()
    expect(loaded.weightTarget).toBe(null)
    expect(loaded.weeklyExercise).toBe(3)
  })
})

describe('validateGoals', () => {
  it('有效数据通过', () => {
    const errors = validateGoals({ weightTarget: 65, weightDeadline: '2025-12-31', weeklyExercise: 3 })
    expect(Object.keys(errors).length).toBe(0)
  })

  it('体重目标超范围报错', () => {
    const errors = validateGoals({ weightTarget: 500, weeklyExercise: 3 })
    expect(errors.weightTarget).toBeTruthy()
  })

  it('每周运动次数超范围报错', () => {
    const errors = validateGoals({ weeklyExercise: 10 })
    expect(errors.weeklyExercise).toBeTruthy()
  })

  it('每周运动次数为空报错', () => {
    const errors = validateGoals({ weeklyExercise: '' })
    expect(errors.weeklyExercise).toBeTruthy()
  })

  it('体重目标为空不报错', () => {
    const errors = validateGoals({ weightTarget: '', weeklyExercise: 3 })
    expect(errors.weightTarget).toBeUndefined()
  })
})

describe('setGoals', () => {
  it('无效数据返回失败', () => {
    const result = setGoals({ weeklyExerciseDone: 0 }, { weeklyExercise: 10 })
    expect(result.success).toBe(false)
  })

  it('有效数据返回成功', () => {
    const result = setGoals({ weeklyExerciseDone: 0 }, { weightTarget: '65', weightDeadline: '2025-12-31', weeklyExercise: '3' })
    expect(result.success).toBe(true)
    expect(result.goals.weightTarget).toBe(65)
    expect(result.goals.weeklyExercise).toBe(3)
  })
})

describe('getLatestValues', () => {
  it('获取各项指标最新值', () => {
    const records = [
      { id: '2', date: '2025-01-02', weight: 66, systolic: 118, bmi: 22.8 },
      { id: '1', date: '2025-01-01', height: 170, weight: 65, systolic: 120, bmi: 22.5 },
    ]
    const latest = getLatestValues(records)
    expect(latest.height).toBe(170)
    expect(latest.weight).toBe(66)
    expect(latest.systolic).toBe(118)
    expect(latest.bmi).toBe(22.8)
  })

  it('无记录返回空对象', () => {
    expect(getLatestValues([])).toEqual({})
  })
})

describe('generateReportContent', () => {
  it('生成报告内容', () => {
    const records = [
      { id: '1', date: '2025-01-01', height: 170, weight: 65, systolic: 120, diastolic: 80, bloodSugar: 5.0, bmi: 22.5, abnormalFields: [] },
    ]
    const trendSummary = {
      weight: { trend: 'stable', description: '体重近30天基本稳定' },
      systolic: { trend: 'stable', description: '收缩压近30天基本稳定' },
      diastolic: { trend: 'stable', description: '舒张压近30天基本稳定' },
      bloodSugar: { trend: 'stable', description: '空腹血糖近30天基本稳定' },
      height: { trend: '数据不足', description: '数据点不足，无法判断趋势' },
      bmi: { trend: '数据不足', description: '数据点不足，无法判断趋势' },
    }
    const report = generateReportContent(records, trendSummary)
    expect(report.title).toBe('个人健康报告')
    expect(report.date).toBeTruthy()
    expect(report.latestValues.height).toBe(170)
    expect(report.abnormalList.length).toBe(0)
    expect(report.trendLines.length).toBeGreaterThan(0)
  })

  it('标记异常项', () => {
    const records = [
      { id: '1', date: '2025-01-01', systolic: 160, diastolic: 100, bloodSugar: 7.5, abnormalFields: ['systolic', 'diastolic', 'bloodSugar'] },
    ]
    const report = generateReportContent(records, {})
    expect(report.abnormalList.length).toBe(3)
  })
})
