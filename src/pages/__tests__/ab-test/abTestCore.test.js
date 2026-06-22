import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateId,
  generateGroupId,
  createExperiment,
  createGroup,
  adjustTrafficAllocation,
  validateTrafficAllocation,
  canStartExperiment,
  canStopExperiment,
  startExperiment,
  stopExperiment,
  generateInitialTimeSeriesData,
  updateTimeSeriesData,
  calculateSignificance,
  calculatePValue,
  getControlGroup,
  getExperimentGroups,
  hasSignificantResult,
} from '../../ab-test/abTestCore.js'
import { EXPERIMENT_STATUS, METRICS, P_VALUE_THRESHOLD } from '../../ab-test/constants.js'
import {
  loadExperiments,
  saveExperiments,
  addExperiment,
  updateExperiment,
  removeExperiment,
  getExperimentById,
  safeGetItem,
  safeSetItem,
} from '../../ab-test/storage.js'

describe('abTestCore - ID 生成', () => {
  describe('generateId', () => {
    it('应该生成以指定前缀开头的字符串', () => {
      const id = generateId('test')
      expect(typeof id).toBe('string')
      expect(id.startsWith('test_')).toBe(true)
    })

    it('默认前缀应为 exp', () => {
      const id = generateId()
      expect(id.startsWith('exp_')).toBe(true)
    })

    it('应该生成不同的 ID', () => {
      const a = generateId()
      const b = generateId()
      expect(a).not.toBe(b)
    })
  })

  describe('generateGroupId', () => {
    it('应该生成以 group_ 开头的字符串', () => {
      const id = generateGroupId()
      expect(id.startsWith('group_')).toBe(true)
    })
  })
})

describe('abTestCore - 实验创建', () => {
  describe('createGroup', () => {
    it('应该创建正确的组结构', () => {
      const group = createGroup('测试组', 30, { feature: 'test' })
      expect(group.name).toBe('测试组')
      expect(group.traffic).toBe(30)
      expect(group.config).toEqual({ feature: 'test' })
    })

    it('默认流量应为 50', () => {
      const group = createGroup('测试组')
      expect(group.traffic).toBe(50)
    })
  })

  describe('createExperiment', () => {
    it('应该创建正确的实验结构', () => {
      const controlGroup = createGroup('对照组 A', 50)
      const expGroup = createGroup('实验组 B', 50)

      const exp = createExperiment({
        name: '测试实验',
        description: '测试描述',
        controlGroup,
        experimentGroups: [expGroup],
        metrics: ['click_rate', 'conversion_rate'],
      })

      expect(exp.id).toBeDefined()
      expect(exp.name).toBe('测试实验')
      expect(exp.description).toBe('测试描述')
      expect(exp.status).toBe(EXPERIMENT_STATUS.NOT_STARTED)
      expect(exp.metrics).toEqual(['click_rate', 'conversion_rate'])
      expect(exp.groups).toHaveLength(2)
      expect(exp.groups[0].isControl).toBe(true)
      expect(exp.groups[1].isControl).toBe(false)
      expect(exp.createdAt).toBeDefined()
      expect(exp.startedAt).toBeNull()
      expect(exp.endedAt).toBeNull()
    })

    it('实验组应该有唯一 ID', () => {
      const controlGroup = createGroup('对照组 A', 50)
      const expGroup = createGroup('实验组 B', 50)

      const exp = createExperiment({
        name: '测试实验',
        description: '',
        controlGroup,
        experimentGroups: [expGroup],
        metrics: [],
      })

      expect(exp.groups[0].id).not.toBe(exp.groups[1].id)
    })
  })
})

describe('abTestCore - 流量分配', () => {
  const createTestGroups = () => [
    { id: 'g1', name: '对照组', traffic: 50, isControl: true },
    { id: 'g2', name: '实验组 B', traffic: 50, isControl: false },
  ]

  describe('adjustTrafficAllocation', () => {
    it('调整一个组时，其他组应该自动调整，总和保持 100%', () => {
      const groups = createTestGroups()
      const updated = adjustTrafficAllocation(groups, 'g1', 70)

      expect(updated[0].traffic).toBe(70)
      expect(updated[1].traffic).toBe(30)
      expect(updated[0].traffic + updated[1].traffic).toBe(100)
    })

    it('三个组时，调整一个组，其他组按比例分配', () => {
      const groups = [
        { id: 'g1', name: '对照组', traffic: 40, isControl: true },
        { id: 'g2', name: '实验组 B', traffic: 30, isControl: false },
        { id: 'g3', name: '实验组 C', traffic: 30, isControl: false },
      ]

      const updated = adjustTrafficAllocation(groups, 'g1', 60)

      expect(updated[0].traffic).toBe(60)
      expect(updated[1].traffic + updated[2].traffic).toBe(40)
      expect(updated.reduce((s, g) => s + g.traffic, 0)).toBeCloseTo(100, 1)
      expect(updated[1].traffic).toBeCloseTo(20, 1)
      expect(updated[2].traffic).toBeCloseTo(20, 1)
    })

    it('流量值应该被限制在 0-100 之间', () => {
      const groups = createTestGroups()
      const updated = adjustTrafficAllocation(groups, 'g1', 150)

      expect(updated[0].traffic).toBe(100)
      expect(updated[1].traffic).toBe(0)
    })

    it('流量值为负时应被限制为 0', () => {
      const groups = createTestGroups()
      const updated = adjustTrafficAllocation(groups, 'g1', -10)

      expect(updated[0].traffic).toBe(0)
      expect(updated[1].traffic).toBe(100)
    })

    it('组 ID 不存在时应返回原数组', () => {
      const groups = createTestGroups()
      const updated = adjustTrafficAllocation(groups, 'not-exist', 50)

      expect(updated).toEqual(groups)
    })

    it('空数组应返回原数组', () => {
      const updated = adjustTrafficAllocation([], 'g1', 50)
      expect(updated).toEqual([])
    })

    it('只有一个组时应返回原数组', () => {
      const groups = [{ id: 'g1', name: '对照组', traffic: 100, isControl: true }]
      const updated = adjustTrafficAllocation(groups, 'g1', 50)
      expect(updated).toEqual(groups)
    })
  })

  describe('validateTrafficAllocation', () => {
    it('总和为 100 且有对照组时应返回 valid', () => {
      const groups = [
        { id: 'g1', name: '对照组', traffic: 50, isControl: true },
        { id: 'g2', name: '实验组', traffic: 50, isControl: false },
      ]

      const result = validateTrafficAllocation(groups)
      expect(result.valid).toBe(true)
    })

    it('总和不为 100 时应返回 invalid', () => {
      const groups = [
        { id: 'g1', name: '对照组', traffic: 60, isControl: true },
        { id: 'g2', name: '实验组', traffic: 50, isControl: false },
      ]

      const result = validateTrafficAllocation(groups)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('100%')
    })

    it('没有对照组时应返回 invalid', () => {
      const groups = [
        { id: 'g1', name: '实验组 A', traffic: 50, isControl: false },
        { id: 'g2', name: '实验组 B', traffic: 50, isControl: false },
      ]

      const result = validateTrafficAllocation(groups)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('对照组')
    })

    it('空数组应返回 invalid', () => {
      const result = validateTrafficAllocation([])
      expect(result.valid).toBe(false)
    })

    it('组流量为负时应返回 invalid', () => {
      const groups = [
        { id: 'g1', name: '对照组', traffic: -10, isControl: true },
        { id: 'g2', name: '实验组', traffic: 110, isControl: false },
      ]

      const result = validateTrafficAllocation(groups)
      expect(result.valid).toBe(false)
    })

    it('组流量超过 100 时应返回 invalid', () => {
      const groups = [
        { id: 'g1', name: '对照组', traffic: 105, isControl: true },
        { id: 'g2', name: '实验组', traffic: -5, isControl: false },
      ]

      const result = validateTrafficAllocation(groups)
      expect(result.valid).toBe(false)
    })

    it('总和在误差范围内应该通过验证', () => {
      const groups = [
        { id: 'g1', name: '对照组', traffic: 33.33, isControl: true },
        { id: 'g2', name: '实验组 B', traffic: 33.33, isControl: false },
        { id: 'g3', name: '实验组 C', traffic: 33.34, isControl: false },
      ]

      const result = validateTrafficAllocation(groups)
      expect(result.valid).toBe(true)
    })
  })
})

describe('abTestCore - 实验状态转换', () => {
  const createTestExperiment = (status) => ({
    id: 'exp-1',
    name: '测试实验',
    groups: [
      { id: 'g1', name: '对照组', traffic: 50, isControl: true },
      { id: 'g2', name: '实验组', traffic: 50, isControl: false },
    ],
    metrics: ['click_rate'],
    status,
    createdAt: Date.now(),
    startedAt: null,
    endedAt: null,
    timeSeriesData: {},
  })

  describe('canStartExperiment', () => {
    it('未启动的实验可以启动', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.NOT_STARTED)
      expect(canStartExperiment(exp)).toBe(true)
    })

    it('运行中的实验不能启动', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.RUNNING)
      expect(canStartExperiment(exp)).toBe(false)
    })

    it('已结束的实验不能启动', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.ENDED)
      expect(canStartExperiment(exp)).toBe(false)
    })

    it('null 实验不能启动', () => {
      expect(canStartExperiment(null)).toBe(false)
    })
  })

  describe('canStopExperiment', () => {
    it('运行中的实验可以停止', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.RUNNING)
      expect(canStopExperiment(exp)).toBe(true)
    })

    it('未启动的实验不能停止', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.NOT_STARTED)
      expect(canStopExperiment(exp)).toBe(false)
    })

    it('已结束的实验不能停止', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.ENDED)
      expect(canStopExperiment(exp)).toBe(false)
    })

    it('null 实验不能停止', () => {
      expect(canStopExperiment(null)).toBe(false)
    })
  })

  describe('startExperiment', () => {
    it('应该将实验状态改为运行中并设置开始时间', () => {
      vi.useFakeTimers().setSystemTime(1234567890000)
      const exp = createTestExperiment(EXPERIMENT_STATUS.NOT_STARTED)
      const updated = startExperiment(exp)

      expect(updated.status).toBe(EXPERIMENT_STATUS.RUNNING)
      expect(updated.startedAt).toBe(1234567890000)
      expect(updated.timeSeriesData).toBeDefined()
      expect(updated.timeSeriesData.click_rate).toBeDefined()
      expect(Array.isArray(updated.timeSeriesData.click_rate)).toBe(true)
      vi.useRealTimers()
    })

    it('不应该修改原对象', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.NOT_STARTED)
      const updated = startExperiment(exp)

      expect(updated).not.toBe(exp)
      expect(exp.status).toBe(EXPERIMENT_STATUS.NOT_STARTED)
    })

    it('不能启动的实验应该返回原对象', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.RUNNING)
      const updated = startExperiment(exp)

      expect(updated).toBe(exp)
    })
  })

  describe('stopExperiment', () => {
    it('应该将实验状态改为已结束并设置结束时间', () => {
      vi.useFakeTimers().setSystemTime(1234567890000)
      const exp = createTestExperiment(EXPERIMENT_STATUS.RUNNING)
      const updated = stopExperiment(exp)

      expect(updated.status).toBe(EXPERIMENT_STATUS.ENDED)
      expect(updated.endedAt).toBe(1234567890000)
      vi.useRealTimers()
    })

    it('不应该修改原对象', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.RUNNING)
      const updated = stopExperiment(exp)

      expect(updated).not.toBe(exp)
      expect(exp.status).toBe(EXPERIMENT_STATUS.RUNNING)
    })

    it('不能停止的实验应该返回原对象', () => {
      const exp = createTestExperiment(EXPERIMENT_STATUS.NOT_STARTED)
      const updated = stopExperiment(exp)

      expect(updated).toBe(exp)
    })
  })
})

describe('abTestCore - 时间序列数据', () => {
  const createTestExperiment = () => ({
    id: 'exp-1',
    name: '测试实验',
    groups: [
      { id: 'g1', name: '对照组', traffic: 50, isControl: true },
      { id: 'g2', name: '实验组', traffic: 50, isControl: false },
    ],
    metrics: ['click_rate', 'conversion_rate'],
    status: EXPERIMENT_STATUS.RUNNING,
    createdAt: Date.now(),
    startedAt: Date.now(),
    endedAt: null,
    timeSeriesData: {},
  })

  describe('generateInitialTimeSeriesData', () => {
    it('应该为每个指标生成时间序列数据', () => {
      const exp = createTestExperiment()
      const data = generateInitialTimeSeriesData(exp)

      expect(data.click_rate).toBeDefined()
      expect(data.conversion_rate).toBeDefined()
      expect(Array.isArray(data.click_rate)).toBe(true)
      expect(data.click_rate.length).toBeGreaterThan(0)
    })

    it('每天的数据应该包含所有组的值', () => {
      const exp = createTestExperiment()
      const data = generateInitialTimeSeriesData(exp)
      const firstDay = data.click_rate[0]

      expect(firstDay.date).toBeDefined()
      expect(firstDay.g1).toBeDefined()
      expect(firstDay.g2).toBeDefined()
      expect(firstDay.g1_samples).toBeDefined()
      expect(firstDay.g2_samples).toBeDefined()
      expect(typeof firstDay.g1).toBe('number')
      expect(typeof firstDay.g2).toBe('number')
    })

    it('数据值应该合理（基于基准值）', () => {
      const exp = createTestExperiment()
      const data = generateInitialTimeSeriesData(exp)

      const clickRateMetric = METRICS.find((m) => m.key === 'click_rate')
      data.click_rate.forEach((day) => {
        expect(day.g1).toBeGreaterThanOrEqual(0)
        expect(day.g2).toBeGreaterThanOrEqual(0)
        expect(day.g1).toBeLessThan(clickRateMetric.baseValue * 2)
      })
    })
  })

  describe('updateTimeSeriesData', () => {
    it('运行中的实验应该追加新数据点', () => {
      const exp = createTestExperiment()
      exp.timeSeriesData = generateInitialTimeSeriesData(exp)
      const originalLength = exp.timeSeriesData.click_rate.length
      const originalLastDay = exp.timeSeriesData.click_rate[exp.timeSeriesData.click_rate.length - 1]

      const updated = updateTimeSeriesData(exp)
      const newData = updated.timeSeriesData.click_rate

      expect(newData.length).toBe(originalLength + 1)
      expect(newData[newData.length - 2]).toEqual(originalLastDay)
    })

    it('追加的新数据点应该包含所有组的值且样本数递增', () => {
      const exp = createTestExperiment()
      exp.timeSeriesData = generateInitialTimeSeriesData(exp)
      const originalLastDay = exp.timeSeriesData.click_rate[exp.timeSeriesData.click_rate.length - 1]

      const updated = updateTimeSeriesData(exp)
      const newLastDay = updated.timeSeriesData.click_rate[updated.timeSeriesData.click_rate.length - 1]

      expect(newLastDay.g1).toBeDefined()
      expect(newLastDay.g2).toBeDefined()
      expect(newLastDay.g1_samples).toBeGreaterThan(originalLastDay.g1_samples)
      expect(newLastDay.g2_samples).toBeGreaterThan(originalLastDay.g2_samples)
    })

    it('新数据点的日期应为最后一天的次日', () => {
      const exp = createTestExperiment()
      exp.timeSeriesData = generateInitialTimeSeriesData(exp)
      const originalLastDay = exp.timeSeriesData.click_rate[exp.timeSeriesData.click_rate.length - 1]

      const updated = updateTimeSeriesData(exp)
      const newLastDay = updated.timeSeriesData.click_rate[updated.timeSeriesData.click_rate.length - 1]

      expect(newLastDay.date).toBeDefined()
      expect(newLastDay.date).not.toBe(originalLastDay.date)
    })

    it('未运行的实验不应该更新数据', () => {
      const exp = createTestExperiment()
      exp.status = EXPERIMENT_STATUS.ENDED
      exp.timeSeriesData = generateInitialTimeSeriesData(exp)

      const updated = updateTimeSeriesData(exp)
      expect(updated).toBe(exp)
    })
  })
})

describe('abTestCore - 显著性计算', () => {
  describe('calculatePValue', () => {
    it('t 值为 0 时 p 值应为 1', () => {
      expect(calculatePValue(0, 100)).toBeCloseTo(1, 3)
    })

    it('t 值很大时 p 值应接近 0', () => {
      expect(calculatePValue(10, 100)).toBeLessThan(0.001)
    })

    it('自由度很小时应该返回合理值', () => {
      expect(calculatePValue(2, 1)).toBeGreaterThan(0)
      expect(calculatePValue(2, 1)).toBeLessThan(1)
    })

    it('自由度 <= 0 时应该返回 1', () => {
      expect(calculatePValue(5, 0)).toBe(1)
      expect(calculatePValue(5, -1)).toBe(1)
    })
  })

  describe('calculateSignificance', () => {
    const createExperimentWithData = () => {
      const exp = {
        id: 'exp-1',
        name: '测试实验',
        groups: [
          { id: 'g1', name: '对照组', traffic: 50, isControl: true },
          { id: 'g2', name: '实验组 B', traffic: 50, isControl: false },
        ],
        metrics: ['click_rate'],
        status: EXPERIMENT_STATUS.RUNNING,
        timeSeriesData: {
          click_rate: [],
        },
      }

      for (let i = 0; i < 7; i++) {
        exp.timeSeriesData.click_rate.push({
          date: `${i + 1}/1`,
          g1: 5 + Math.random() * 0.5,
          g2: 6 + Math.random() * 0.5,
          g1_samples: 1000,
          g2_samples: 1000,
        })
      }

      return exp
    }

    it('应该返回每个实验组的显著性结果', () => {
      const exp = createExperimentWithData()
      const results = calculateSignificance(exp, 'click_rate')

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(1)
      expect(results[0].groupName).toBe('实验组 B')
      expect(results[0].metricKey).toBe('click_rate')
      expect(typeof results[0].controlMean).toBe('number')
      expect(typeof results[0].expMean).toBe('number')
      expect(typeof results[0].liftPercent).toBe('number')
      expect(typeof results[0].pValue).toBe('number')
      expect(typeof results[0].isSignificant).toBe('boolean')
    })

    it('实验组均值更高时提升幅度应为正', () => {
      const exp = {
        id: 'exp-1',
        name: '测试实验',
        groups: [
          { id: 'g1', name: '对照组', traffic: 50, isControl: true },
          { id: 'g2', name: '实验组 B', traffic: 50, isControl: false },
        ],
        metrics: ['click_rate'],
        status: EXPERIMENT_STATUS.RUNNING,
        timeSeriesData: {
          click_rate: [
            { date: '1/1', g1: 5, g2: 6, g1_samples: 1000, g2_samples: 1000 },
            { date: '1/2', g1: 5, g2: 6, g1_samples: 1000, g2_samples: 1000 },
            { date: '1/3', g1: 5, g2: 6, g1_samples: 1000, g2_samples: 1000 },
          ],
        },
      }

      const results = calculateSignificance(exp, 'click_rate')
      expect(results[0].liftPercent).toBeGreaterThan(0)
    })

    it('样本量很大且差异明显时应该显著', () => {
      const exp = {
        id: 'exp-1',
        name: '测试实验',
        groups: [
          { id: 'g1', name: '对照组', traffic: 50, isControl: true },
          { id: 'g2', name: '实验组 B', traffic: 50, isControl: false },
        ],
        metrics: ['click_rate'],
        status: EXPERIMENT_STATUS.RUNNING,
        timeSeriesData: {
          click_rate: [],
        },
      }

      for (let i = 0; i < 30; i++) {
        exp.timeSeriesData.click_rate.push({
          date: `${i + 1}/1`,
          g1: 5,
          g2: 5.5,
          g1_samples: 10000,
          g2_samples: 10000,
        })
      }

      const results = calculateSignificance(exp, 'click_rate')
      expect(results[0].pValue).toBeLessThan(P_VALUE_THRESHOLD)
      expect(results[0].isSignificant).toBe(true)
    })

    it('没有时间序列数据时应该返回空数组', () => {
      const exp = {
        id: 'exp-1',
        groups: [
          { id: 'g1', name: '对照组', isControl: true },
          { id: 'g2', name: '实验组', isControl: false },
        ],
        metrics: ['click_rate'],
        timeSeriesData: {},
      }

      const results = calculateSignificance(exp, 'click_rate')
      expect(results).toEqual([])
    })

    it('没有对照组时应该返回空数组', () => {
      const exp = {
        id: 'exp-1',
        groups: [
          { id: 'g1', name: '实验组 A', isControl: false },
          { id: 'g2', name: '实验组 B', isControl: false },
        ],
        metrics: ['click_rate'],
        timeSeriesData: { click_rate: [{ date: '1/1', g1: 5, g2: 6 }] },
      }

      const results = calculateSignificance(exp, 'click_rate')
      expect(results).toEqual([])
    })
  })

  describe('hasSignificantResult', () => {
    it('有显著结果时应该返回 true', () => {
      const exp = {
        id: 'exp-1',
        status: EXPERIMENT_STATUS.RUNNING,
        groups: [
          { id: 'g1', name: '对照组', isControl: true },
          { id: 'g2', name: '实验组', isControl: false },
        ],
        metrics: ['click_rate'],
        timeSeriesData: { click_rate: [] },
      }

      for (let i = 0; i < 30; i++) {
        exp.timeSeriesData.click_rate.push({
          date: `${i + 1}/1`,
          g1: 5,
          g2: 5.5,
          g1_samples: 10000,
          g2_samples: 10000,
        })
      }

      expect(hasSignificantResult(exp)).toBe(true)
    })

    it('没有显著结果时应该返回 false', () => {
      const exp = {
        id: 'exp-1',
        status: EXPERIMENT_STATUS.RUNNING,
        groups: [
          { id: 'g1', name: '对照组', isControl: true },
          { id: 'g2', name: '实验组', isControl: false },
        ],
        metrics: ['click_rate'],
        timeSeriesData: {
          click_rate: [
            { date: '1/1', g1: 5.0, g2: 5.1, g1_samples: 10, g2_samples: 10 },
            { date: '1/2', g1: 4.9, g2: 4.8, g1_samples: 10, g2_samples: 10 },
            { date: '1/3', g1: 5.1, g2: 5.2, g1_samples: 10, g2_samples: 10 },
            { date: '1/4', g1: 4.8, g2: 5.0, g1_samples: 10, g2_samples: 10 },
            { date: '1/5', g1: 5.2, g2: 4.9, g1_samples: 10, g2_samples: 10 },
          ],
        },
      }

      expect(hasSignificantResult(exp)).toBe(false)
    })

    it('未运行的实验应该返回 false', () => {
      const exp = {
        id: 'exp-1',
        status: EXPERIMENT_STATUS.NOT_STARTED,
        groups: [
          { id: 'g1', name: '对照组', isControl: true },
          { id: 'g2', name: '实验组', isControl: false },
        ],
        metrics: ['click_rate'],
        timeSeriesData: {},
      }

      expect(hasSignificantResult(exp)).toBe(false)
    })
  })
})

describe('abTestCore - 组辅助函数', () => {
  const groups = [
    { id: 'g1', name: '对照组', isControl: true },
    { id: 'g2', name: '实验组 B', isControl: false },
    { id: 'g3', name: '实验组 C', isControl: false },
  ]

  describe('getControlGroup', () => {
    it('应该返回对照组', () => {
      const control = getControlGroup(groups)
      expect(control.id).toBe('g1')
      expect(control.isControl).toBe(true)
    })

    it('没有对照组时返回 undefined', () => {
      const noControl = groups.filter((g) => !g.isControl)
      const control = getControlGroup(noControl)
      expect(control).toBeUndefined()
    })
  })

  describe('getExperimentGroups', () => {
    it('应该返回所有实验组', () => {
      const expGroups = getExperimentGroups(groups)
      expect(expGroups).toHaveLength(2)
      expect(expGroups.every((g) => !g.isControl)).toBe(true)
    })

    it('没有实验组时返回空数组', () => {
      const onlyControl = [groups[0]]
      const expGroups = getExperimentGroups(onlyControl)
      expect(expGroups).toEqual([])
    })
  })
})

describe('storage - localStorage 操作', () => {
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

    it('key 不存在时返回 fallback', () => {
      expect(safeGetItem('not-exist', 'fallback')).toBe('fallback')
    })

    it('值不是合法 JSON 时返回 fallback', () => {
      localStorage.setItem('bad-json', '{not valid json')
      expect(safeGetItem('bad-json', {})).toEqual({})
    })

    it('setItem 失败时返回 false', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error('quota exceeded')
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      })
      expect(safeSetItem('key', 'value')).toBe(false)
    })
  })

  describe('loadExperiments / saveExperiments', () => {
    it('初始状态应返回空数组', () => {
      expect(loadExperiments()).toEqual([])
    })

    it('保存后能读取', () => {
      const experiments = [{ id: 'exp-1', name: '测试' }]
      expect(saveExperiments(experiments)).toBe(true)
      expect(loadExperiments()).toEqual(experiments)
    })
  })

  describe('addExperiment', () => {
    it('应该添加实验并保存', () => {
      const experiments = [{ id: 'exp-1', name: '实验1' }]
      const newExp = { id: 'exp-2', name: '实验2' }
      const updated = addExperiment(experiments, newExp)

      expect(updated).toHaveLength(2)
      expect(updated[1]).toEqual(newExp)
      expect(loadExperiments()).toEqual(updated)
    })
  })

  describe('updateExperiment', () => {
    it('应该更新指定实验并保存', () => {
      const experiments = [
        { id: 'exp-1', name: '实验1' },
        { id: 'exp-2', name: '实验2' },
      ]
      const updated = updateExperiment(experiments, 'exp-1', { id: 'exp-1', name: '更新后的实验1' })

      expect(updated[0].name).toBe('更新后的实验1')
      expect(updated[1].name).toBe('实验2')
      expect(loadExperiments()).toEqual(updated)
    })

    it('支持函数式更新', () => {
      const experiments = [{ id: 'exp-1', count: 1 }]
      const updated = updateExperiment(experiments, 'exp-1', (exp) => ({ ...exp, count: exp.count + 1 }))

      expect(updated[0].count).toBe(2)
    })
  })

  describe('removeExperiment', () => {
    it('应该删除指定实验并保存', () => {
      const experiments = [
        { id: 'exp-1', name: '实验1' },
        { id: 'exp-2', name: '实验2' },
      ]
      const updated = removeExperiment(experiments, 'exp-1')

      expect(updated).toHaveLength(1)
      expect(updated[0].id).toBe('exp-2')
      expect(loadExperiments()).toEqual(updated)
    })
  })

  describe('getExperimentById', () => {
    it('应该返回指定 ID 的实验', () => {
      const experiments = [
        { id: 'exp-1', name: '实验1' },
        { id: 'exp-2', name: '实验2' },
      ]
      const exp = getExperimentById(experiments, 'exp-2')

      expect(exp.name).toBe('实验2')
    })

    it('不存在时返回 null', () => {
      const experiments = [{ id: 'exp-1', name: '实验1' }]
      const exp = getExperimentById(experiments, 'not-exist')

      expect(exp).toBeNull()
    })
  })
})
