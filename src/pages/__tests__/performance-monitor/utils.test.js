import { describe, it, expect } from 'vitest'
import {
  METRIC_TYPES,
  METRIC_RANGES,
  ALERT_CONDITIONS,
  ALERT_STATUS,
  RESOURCE_TYPES,
  MAX_ALERT_HISTORY,
  SMOOTHING_FACTOR,
} from '../../performance-monitor/constants'
import {
  generateId,
  randomInRange,
  randomInt,
  clamp,
  smoothValue,
  generateSimulatedTargetValue,
  getFpsStatus,
  checkAlertCondition,
  evaluateAlerts,
  getRuleDescription,
  addAlertRule,
  validateAlertRule,
  toggleAlertRule,
  deleteAlertRule,
  updateRuleLastTriggered,
  createAlertRecord,
  addAlertRecord,
  confirmAlertRecord,
  confirmAllAlertRecords,
  sortAlertRecords,
  exportAlertRecordsToCsv,
  generateWaterfallData,
  sortWaterfallPhases,
  generateMockResourceList,
  aggregateResourceByType,
  formatFileSize,
  sortResources,
  calculateTreemapLayout,
  formatDateTime,
  formatDuration,
  formatTimeOnly,
  calculateDuration,
} from '../../performance-monitor/utils'

describe('ID生成函数', () => {
  it('generateId 应生成指定前缀的ID', () => {
    const id = generateId('test')
    expect(id).toMatch(/^test_[a-z0-9]+_[a-z0-9]+$/)
  })

  it('两次调用应生成不同的ID', () => {
    const id1 = generateId('rule')
    const id2 = generateId('rule')
    expect(id1).not.toBe(id2)
  })
})

describe('随机数与数学工具函数', () => {
  it('randomInRange 应返回指定范围内的数字', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInRange(10, 20)
      expect(val).toBeGreaterThanOrEqual(10)
      expect(val).toBeLessThanOrEqual(20)
    }
  })

  it('randomInRange 处理 min > max 的情况', () => {
    for (let i = 0; i < 50; i++) {
      const val = randomInRange(20, 10)
      expect(val).toBeGreaterThanOrEqual(10)
      expect(val).toBeLessThanOrEqual(20)
    }
  })

  it('randomInt 应返回指定范围内的整数', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInt(1, 10)
      expect(Number.isInteger(val)).toBe(true)
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(10)
    }
  })

  it('clamp 应将值限制在范围内', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('平滑过渡算法', () => {
  it('smoothValue 当前值为 NaN 时返回目标值', () => {
    expect(smoothValue(NaN, 50)).toBe(50)
  })

  it('smoothValue 目标值为 NaN 时返回当前值', () => {
    expect(smoothValue(50, NaN)).toBe(50)
  })

  it('smoothValue 应平滑过渡到目标值', () => {
    const current = 10
    const target = 20
    const factor = 0.3
    const result = smoothValue(current, target, factor)
    const expected = current + (target - current) * factor
    expect(result).toBeCloseTo(expected)
  })

  it('smoothValue 多次迭代应趋近于目标值', () => {
    let current = 0
    const target = 100
    for (let i = 0; i < 50; i++) {
      current = smoothValue(current, target, SMOOTHING_FACTOR)
    }
    expect(current).toBeGreaterThan(99)
    expect(current).toBeLessThanOrEqual(target)
  })

  it('smoothValue 当当前值等于目标值时保持不变', () => {
    expect(smoothValue(50, 50, 0.3)).toBe(50)
  })
})

describe('模拟数据生成', () => {
  it('generateSimulatedTargetValue FPS应在合理范围内', () => {
    for (let i = 0; i < 100; i++) {
      const val = generateSimulatedTargetValue(METRIC_TYPES.FPS)
      expect(val).toBeGreaterThanOrEqual(METRIC_RANGES[METRIC_TYPES.FPS].min)
      expect(val).toBeLessThanOrEqual(METRIC_RANGES[METRIC_TYPES.FPS].max)
    }
  })

  it('generateSimulatedTargetValue 内存应在合理范围内', () => {
    for (let i = 0; i < 100; i++) {
      const val = generateSimulatedTargetValue(METRIC_TYPES.MEMORY)
      expect(val).toBeGreaterThanOrEqual(50)
      expect(val).toBeLessThanOrEqual(800)
    }
  })

  it('generateSimulatedTargetValue CPU应在合理范围内', () => {
    for (let i = 0; i < 100; i++) {
      const val = generateSimulatedTargetValue(METRIC_TYPES.CPU)
      expect(val).toBeGreaterThanOrEqual(METRIC_RANGES[METRIC_TYPES.CPU].min)
      expect(val).toBeLessThanOrEqual(METRIC_RANGES[METRIC_TYPES.CPU].max)
    }
  })

  it('generateSimulatedTargetValue 未知类型返回0', () => {
    expect(generateSimulatedTargetValue('unknown')).toBe(0)
  })
})

describe('FPS状态判断', () => {
  it('FPS高于30返回流畅（绿色）状态', () => {
    const status = getFpsStatus(45)
    expect(status.label).toBe('流畅')
    expect(status.color).toBe('#10b981')
  })

  it('FPS在15-30之间返回卡顿（黄色）状态', () => {
    const status = getFpsStatus(22)
    expect(status.label).toBe('卡顿')
    expect(status.color).toBe('#f59e0b')
  })

  it('FPS低于15返回严重卡顿（红色）状态', () => {
    const status = getFpsStatus(10)
    expect(status.label).toBe('严重卡顿')
    expect(status.color).toBe('#ef4444')
  })

  it('FPS边界值测试', () => {
    expect(getFpsStatus(30).label).toBe('流畅')
    expect(getFpsStatus(15).label).toBe('卡顿')
    expect(getFpsStatus(0).label).toBe('严重卡顿')
  })
})

describe('告警条件判断', () => {
  it('checkAlertCondition 低于条件', () => {
    const rule = { condition: ALERT_CONDITIONS.LESS_THAN, threshold: 20 }
    expect(checkAlertCondition(rule, 15)).toBe(true)
    expect(checkAlertCondition(rule, 25)).toBe(false)
    expect(checkAlertCondition(rule, 20)).toBe(false)
  })

  it('checkAlertCondition 高于条件', () => {
    const rule = { condition: ALERT_CONDITIONS.GREATER_THAN, threshold: 80 }
    expect(checkAlertCondition(rule, 90)).toBe(true)
    expect(checkAlertCondition(rule, 70)).toBe(false)
    expect(checkAlertCondition(rule, 80)).toBe(false)
  })

  it('checkAlertCondition 对 null 规则返回 false', () => {
    expect(checkAlertCondition(null, 30)).toBe(false)
    expect(checkAlertCondition(undefined, 30)).toBe(false)
  })

  it('checkAlertCondition 对 null/NaN 值返回 false', () => {
    const rule = { condition: ALERT_CONDITIONS.GREATER_THAN, threshold: 30 }
    expect(checkAlertCondition(rule, null)).toBe(false)
    expect(checkAlertCondition(rule, undefined)).toBe(false)
    expect(checkAlertCondition(rule, NaN)).toBe(false)
  })

  it('checkAlertCondition 无效阈值返回 false', () => {
    const rule = { condition: ALERT_CONDITIONS.GREATER_THAN, threshold: 'abc' }
    expect(checkAlertCondition(rule, 50)).toBe(false)
  })
})

describe('告警评估', () => {
  const rules = [
    {
      id: 'r1',
      enabled: true,
      metricType: METRIC_TYPES.FPS,
      condition: ALERT_CONDITIONS.LESS_THAN,
      threshold: 20,
    },
    {
      id: 'r2',
      enabled: false,
      metricType: METRIC_TYPES.FPS,
      condition: ALERT_CONDITIONS.LESS_THAN,
      threshold: 10,
    },
    {
      id: 'r3',
      enabled: true,
      metricType: METRIC_TYPES.MEMORY,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      threshold: 800,
    },
  ]

  it('evaluateAlerts 非数组规则返回空结果', () => {
    const result = evaluateAlerts({ fps: 10 }, null)
    expect(result.isAlerting).toBe(false)
    expect(result.triggeredRules).toHaveLength(0)
  })

  it('evaluateAlerts 正常数据不触发告警', () => {
    const metrics = { [METRIC_TYPES.FPS]: 45, [METRIC_TYPES.MEMORY]: 300, [METRIC_TYPES.CPU]: 30 }
    const result = evaluateAlerts(metrics, rules)
    expect(result.isAlerting).toBe(false)
    expect(result.triggeredRules).toHaveLength(0)
  })

  it('evaluateAlerts FPS过低触发告警', () => {
    const metrics = { [METRIC_TYPES.FPS]: 15, [METRIC_TYPES.MEMORY]: 300, [METRIC_TYPES.CPU]: 30 }
    const result = evaluateAlerts(metrics, rules)
    expect(result.isAlerting).toBe(true)
    expect(result.triggeredRules).toHaveLength(1)
    expect(result.triggeredRules[0].id).toBe('r1')
  })

  it('evaluateAlerts 禁用的规则不触发', () => {
    const metrics = { [METRIC_TYPES.FPS]: 5, [METRIC_TYPES.MEMORY]: 300, [METRIC_TYPES.CPU]: 30 }
    const result = evaluateAlerts(metrics, rules)
    const triggeredIds = result.triggeredRules.map((r) => r.id)
    expect(triggeredIds).not.toContain('r2')
  })

  it('evaluateAlerts 内存过高触发告警', () => {
    const metrics = { [METRIC_TYPES.FPS]: 45, [METRIC_TYPES.MEMORY]: 850, [METRIC_TYPES.CPU]: 30 }
    const result = evaluateAlerts(metrics, rules)
    expect(result.isAlerting).toBe(true)
    expect(result.triggeredRules).toHaveLength(1)
    expect(result.triggeredRules[0].id).toBe('r3')
  })

  it('evaluateAlerts 多个条件同时触发', () => {
    const metrics = { [METRIC_TYPES.FPS]: 10, [METRIC_TYPES.MEMORY]: 900, [METRIC_TYPES.CPU]: 30 }
    const result = evaluateAlerts(metrics, rules)
    expect(result.isAlerting).toBe(true)
    expect(result.triggeredRules).toHaveLength(2)
  })
})

describe('规则描述生成', () => {
  it('getRuleDescription FPS低于阈值', () => {
    const rule = {
      metricType: METRIC_TYPES.FPS,
      condition: ALERT_CONDITIONS.LESS_THAN,
      threshold: 20,
    }
    expect(getRuleDescription(rule)).toBe('FPS 低于 20帧')
  })

  it('getRuleDescription 内存高于阈值', () => {
    const rule = {
      metricType: METRIC_TYPES.MEMORY,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      threshold: 800,
    }
    expect(getRuleDescription(rule)).toBe('内存 高于 800MB')
  })

  it('getRuleDescription CPU高于阈值', () => {
    const rule = {
      metricType: METRIC_TYPES.CPU,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      threshold: 90,
    }
    expect(getRuleDescription(rule)).toBe('CPU 高于 90%')
  })

  it('getRuleDescription 对null规则返回空字符串', () => {
    expect(getRuleDescription(null)).toBe('')
  })
})

describe('告警规则管理', () => {
  it('validateAlertRule 有效规则无错误', () => {
    const data = {
      metricType: METRIC_TYPES.FPS,
      condition: ALERT_CONDITIONS.LESS_THAN,
      threshold: 20,
    }
    const errors = validateAlertRule(data)
    expect(Object.keys(errors).length).toBe(0)
  })

  it('validateAlertRule 缺少字段返回错误', () => {
    const errors = validateAlertRule({ metricType: METRIC_TYPES.FPS })
    expect(errors).toHaveProperty('condition')
    expect(errors).toHaveProperty('threshold')
  })

  it('validateAlertRule 无效阈值返回错误', () => {
    const errors = validateAlertRule({
      metricType: METRIC_TYPES.FPS,
      condition: ALERT_CONDITIONS.LESS_THAN,
      threshold: 'abc',
    })
    expect(errors).toHaveProperty('threshold')
  })

  it('validateAlertRule 阈值超出范围返回错误', () => {
    const errors = validateAlertRule({
      metricType: METRIC_TYPES.FPS,
      condition: ALERT_CONDITIONS.LESS_THAN,
      threshold: 100,
    })
    expect(errors).toHaveProperty('threshold')
  })

  it('validateAlertRule 空阈值返回错误', () => {
    const errors = validateAlertRule({
      metricType: METRIC_TYPES.FPS,
      condition: ALERT_CONDITIONS.LESS_THAN,
      threshold: '',
    })
    expect(errors).toHaveProperty('threshold')
  })

  it('addAlertRule 成功添加规则', () => {
    const result = addAlertRule([], {
      metricType: METRIC_TYPES.FPS,
      condition: ALERT_CONDITIONS.LESS_THAN,
      threshold: 20,
    })
    expect(result.success).toBe(true)
    expect(result.rules).toHaveLength(1)
    expect(result.rule).toBeDefined()
    expect(result.rule.enabled).toBe(true)
  })

  it('addAlertRule 无效数据返回失败', () => {
    const result = addAlertRule([], { metricType: METRIC_TYPES.FPS })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('toggleAlertRule 切换状态', () => {
    const rules = [{ id: 'r1', enabled: true }]
    const result = toggleAlertRule(rules, 'r1')
    expect(result.success).toBe(true)
    expect(result.rules[0].enabled).toBe(false)
  })

  it('toggleAlertRule 不存在的ID返回失败', () => {
    const rules = [{ id: 'r1', enabled: true }]
    const result = toggleAlertRule(rules, 'r999')
    expect(result.success).toBe(false)
  })

  it('deleteAlertRule 删除规则', () => {
    const rules = [
      { id: 'r1' },
      { id: 'r2' },
    ]
    const result = deleteAlertRule(rules, 'r1')
    expect(result.success).toBe(true)
    expect(result.rules).toHaveLength(1)
    expect(result.rules[0].id).toBe('r2')
  })

  it('updateRuleLastTriggered 更新指定规则的触发时间', () => {
    const ts = 1234567890
    const rules = [
      { id: 'r1', lastTriggeredAt: null },
      { id: 'r2', lastTriggeredAt: null },
    ]
    const result = updateRuleLastTriggered(rules, ['r1'], ts)
    expect(result[0].lastTriggeredAt).toBe(ts)
    expect(result[1].lastTriggeredAt).toBeNull()
  })
})

describe('告警记录管理', () => {
  const baseRule = {
    id: 'rule_001',
    metricType: METRIC_TYPES.FPS,
    condition: ALERT_CONDITIONS.LESS_THAN,
    threshold: 20,
  }

  it('createAlertRecord 创建完整记录', () => {
    const record = createAlertRecord(baseRule, 15, 1234567890)
    expect(record.id).toMatch(/^alert_/)
    expect(record.ruleId).toBe('rule_001')
    expect(record.value).toBe(15)
    expect(record.threshold).toBe(20)
    expect(record.status).toBe(ALERT_STATUS.PENDING)
    expect(record.triggeredAt).toBe(1234567890)
    expect(record.triggerInfo).toContain('FPS=15.0')
    expect(record.triggerInfo).toContain('低于')
    expect(record.triggerInfo).toContain('20')
  })

  it('addAlertRecord 添加记录并限制数量', () => {
    const records = []
    const now = Date.now()
    for (let i = 0; i < MAX_ALERT_HISTORY + 10; i++) {
      const record = { ...createAlertRecord(baseRule, 10, now - i * 1000) }
      const result = addAlertRecord(records.length === 0 ? [] : records, record)
      records.length = 0
      records.push(...result)
    }
    expect(records.length).toBe(MAX_ALERT_HISTORY)
  })

  it('confirmAlertRecord 确认告警', () => {
    const records = [{ id: 'a1', status: ALERT_STATUS.PENDING }]
    const result = confirmAlertRecord(records, 'a1')
    expect(result.success).toBe(true)
    expect(result.records[0].status).toBe(ALERT_STATUS.CONFIRMED)
    expect(result.records[0].confirmedAt).toBeDefined()
  })

  it('confirmAlertRecord 不重复确认已确认的记录', () => {
    const ts = 1000
    const records = [{ id: 'a1', status: ALERT_STATUS.CONFIRMED, confirmedAt: ts }]
    const result = confirmAlertRecord(records, 'a1')
    expect(result.records[0].confirmedAt).toBe(ts)
  })

  it('confirmAllAlertRecords 批量确认所有待确认记录', () => {
    const records = [
      { id: 'a1', status: ALERT_STATUS.PENDING },
      { id: 'a2', status: ALERT_STATUS.CONFIRMED },
      { id: 'a3', status: ALERT_STATUS.PENDING },
    ]
    const result = confirmAllAlertRecords(records)
    expect(result.success).toBe(true)
    expect(result.records.filter((r) => r.status === ALERT_STATUS.CONFIRMED)).toHaveLength(3)
  })

  it('sortAlertRecords 默认按触发时间降序', () => {
    const records = [
      { id: 'a1', triggeredAt: 1000 },
      { id: 'a3', triggeredAt: 3000 },
      { id: 'a2', triggeredAt: 2000 },
    ]
    const sorted = sortAlertRecords(records)
    expect(sorted[0].id).toBe('a3')
    expect(sorted[2].id).toBe('a1')
  })

  it('sortAlertRecords 按触发时间升序', () => {
    const records = [
      { id: 'a1', triggeredAt: 3000 },
      { id: 'a2', triggeredAt: 1000 },
    ]
    const sorted = sortAlertRecords(records, 'triggeredAt', 'asc')
    expect(sorted[0].id).toBe('a2')
  })

  it('exportAlertRecordsToCsv 空数组返回空字符串', () => {
    expect(exportAlertRecordsToCsv([])).toBe('')
  })

  it('exportAlertRecordsToCsv 生成有效CSV', () => {
    const records = [
      {
        id: 'a1',
        ruleDescription: 'FPS 低于 20帧',
        metricType: METRIC_TYPES.FPS,
        value: 15,
        threshold: 20,
        condition: ALERT_CONDITIONS.LESS_THAN,
        status: ALERT_STATUS.PENDING,
        triggeredAt: new Date(2024, 0, 15, 10, 30, 45).getTime(),
        confirmedAt: null,
      },
    ]
    const csv = exportAlertRecordsToCsv(records)
    expect(csv).toContain('触发时间')
    expect(csv).toContain('FPS')
    expect(csv).toContain('2024-01-15')
  })
})

describe('瀑布图数据', () => {
  it('generateWaterfallData 返回正确结构', () => {
    const result = generateWaterfallData()
    expect(result).toHaveProperty('phases')
    expect(result).toHaveProperty('totalTime')
    expect(Array.isArray(result.phases)).toBe(true)
    expect(result.phases.length).toBeGreaterThan(0)
    expect(result.totalTime).toBeGreaterThan(0)
  })

  it('generateWaterfallData 每个阶段有正确字段', () => {
    const { phases } = generateWaterfallData()
    phases.forEach((phase) => {
      expect(phase).toHaveProperty('key')
      expect(phase).toHaveProperty('name')
      expect(phase).toHaveProperty('color')
      expect(phase).toHaveProperty('start')
      expect(phase).toHaveProperty('duration')
      expect(typeof phase.start).toBe('number')
      expect(typeof phase.duration).toBe('number')
      expect(phase.duration).toBeGreaterThan(0)
    })
  })

  it('generateWaterfallData 总时间为所有阶段最大结束时间', () => {
    const { phases, totalTime } = generateWaterfallData()
    const calcTotal = phases.reduce((max, p) => Math.max(max, p.start + p.duration), 0)
    expect(totalTime).toBeCloseTo(calcTotal, 0)
  })

  it('sortWaterfallPhases 按start时间排序', () => {
    const phases = [
      { key: 'b', start: 100 },
      { key: 'a', start: 50 },
      { key: 'c', start: 200 },
    ]
    const sorted = sortWaterfallPhases(phases)
    expect(sorted[0].key).toBe('a')
    expect(sorted[1].key).toBe('b')
    expect(sorted[2].key).toBe('c')
  })

  it('sortWaterfallPhases 对非数组返回空数组', () => {
    expect(sortWaterfallPhases(null)).toEqual([])
  })
})

describe('资源统计聚合', () => {
  it('generateMockResourceList 生成资源列表', () => {
    const resources = generateMockResourceList()
    expect(Array.isArray(resources)).toBe(true)
    expect(resources.length).toBeGreaterThan(0)
    resources.forEach((r) => {
      expect(r).toHaveProperty('id')
      expect(r).toHaveProperty('path')
      expect(r).toHaveProperty('type')
      expect(r).toHaveProperty('size')
      expect(r).toHaveProperty('loadTime')
    })
  })

  it('aggregateResourceByType 按类型聚合大小', () => {
    const resources = [
      { type: RESOURCE_TYPES.JS, size: 100 },
      { type: RESOURCE_TYPES.JS, size: 200 },
      { type: RESOURCE_TYPES.CSS, size: 50 },
    ]
    const aggregated = aggregateResourceByType(resources)
    const jsEntry = aggregated.find((a) => a.type === RESOURCE_TYPES.JS)
    const cssEntry = aggregated.find((a) => a.type === RESOURCE_TYPES.CSS)
    expect(jsEntry.totalSize).toBe(300)
    expect(jsEntry.count).toBe(2)
    expect(cssEntry.totalSize).toBe(50)
    expect(cssEntry.count).toBe(1)
  })

  it('aggregateResourceByType 包含所有类型', () => {
    const aggregated = aggregateResourceByType([])
    expect(aggregated).toHaveLength(6)
    const types = aggregated.map((a) => a.type)
    Object.values(RESOURCE_TYPES).forEach((t) => {
      expect(types).toContain(t)
    })
  })

  it('aggregateResourceByType 返回总大小', () => {
    const resources = [
      { type: RESOURCE_TYPES.JS, size: 100 },
      { type: RESOURCE_TYPES.CSS, size: 50 },
    ]
    const aggregated = aggregateResourceByType(resources)
    expect(aggregated.totalSize).toBe(150)
  })

  it('formatFileSize 小于1024KB显示KB', () => {
    expect(formatFileSize(500)).toContain('KB')
    expect(formatFileSize(1023)).toContain('KB')
  })

  it('formatFileSize 大于等于1024KB显示MB', () => {
    expect(formatFileSize(1024)).toContain('MB')
    expect(formatFileSize(2048)).toContain('2.00')
  })

  it('sortResources 按大小降序', () => {
    const resources = [
      { id: '1', size: 100, path: 'a', loadTime: 50 },
      { id: '2', size: 300, path: 'c', loadTime: 150 },
      { id: '3', size: 200, path: 'b', loadTime: 100 },
    ]
    const sorted = sortResources(resources, 'size', 'desc')
    expect(sorted[0].id).toBe('2')
    expect(sorted[2].id).toBe('1')
  })

  it('sortResources 按路径升序', () => {
    const resources = [
      { id: '1', size: 100, path: 'c', loadTime: 50 },
      { id: '2', size: 300, path: 'a', loadTime: 150 },
    ]
    const sorted = sortResources(resources, 'path', 'asc')
    expect(sorted[0].path).toBe('a')
  })
})

describe('树图布局计算', () => {
  it('calculateTreemapLayout 空数组返回空布局', () => {
    expect(calculateTreemapLayout([], 100, 100)).toEqual([])
  })

  it('calculateTreemapLayout 无效尺寸返回空布局', () => {
    const items = [{ totalSize: 100 }]
    expect(calculateTreemapLayout(items, 0, 100)).toEqual([])
  })

  it('calculateTreemapLayout 正确计算布局', () => {
    const items = [
      { type: 'js', label: 'JS', color: '#f00', totalSize: 60, count: 2 },
      { type: 'css', label: 'CSS', color: '#0f0', totalSize: 30, count: 1 },
      { type: 'image', label: 'Image', color: '#00f', totalSize: 10, count: 2 },
    ]
    const layout = calculateTreemapLayout(items, 100, 100)
    expect(layout).toHaveLength(3)
    layout.forEach((item) => {
      expect(item).toHaveProperty('x')
      expect(item).toHaveProperty('y')
      expect(item).toHaveProperty('width')
      expect(item).toHaveProperty('height')
      expect(item.width).toBeGreaterThan(0)
      expect(item.height).toBeGreaterThan(0)
    })
  })

  it('calculateTreemapLayout 所有矩形不超出边界', () => {
    const items = [
      { type: 'js', totalSize: 50 },
      { type: 'css', totalSize: 30 },
      { type: 'image', totalSize: 20 },
    ]
    const w = 200
    const h = 150
    const layout = calculateTreemapLayout(items, w, h)
    layout.forEach((item) => {
      expect(item.x).toBeGreaterThanOrEqual(0)
      expect(item.y).toBeGreaterThanOrEqual(0)
      expect(item.x + item.width).toBeLessThanOrEqual(w)
      expect(item.y + item.height).toBeLessThanOrEqual(h)
    })
  })
})

describe('格式化函数', () => {
  it('formatDateTime 正确格式化日期', () => {
    const ts = new Date(2024, 0, 15, 10, 30, 45).getTime()
    expect(formatDateTime(ts)).toBe('2024-01-15 10:30:45')
  })

  it('formatDateTime 无效时间返回 -', () => {
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime(undefined)).toBe('-')
    expect(formatDateTime(NaN)).toBe('-')
  })

  it('formatTimeOnly 只返回时分秒', () => {
    const ts = new Date(2024, 0, 15, 10, 30, 45).getTime()
    expect(formatTimeOnly(ts)).toBe('10:30:45')
  })

  it('formatTimeOnly 无效时间返回空字符串', () => {
    expect(formatTimeOnly(null)).toBe('')
  })

  it('formatDuration 毫秒直接显示', () => {
    expect(formatDuration(500)).toBe('500ms')
  })

  it('formatDuration 秒级显示', () => {
    expect(formatDuration(2500)).toBe('2s 500ms')
  })

  it('formatDuration 分钟级显示', () => {
    expect(formatDuration(61000)).toBe('1m 1s')
  })

  it('calculateDuration 计算差值', () => {
    expect(calculateDuration(1000, 3000)).toBe(2000)
  })

  it('calculateDuration 无效值返回0', () => {
    expect(calculateDuration(null, 3000)).toBe(0)
  })
})
