import { describe, it, expect } from 'vitest'
import {
  DEVICE_TYPES,
  DEVICE_STATUS,
  METRIC_TYPES,
  ALERT_CONDITIONS,
  ALERT_LEVELS,
  ALERT_STATUS,
  DATA_POINT_COUNT,
  DEFAULT_METRIC_RANGES,
} from '../../device-monitor/constants.js'
import {
  generateDeviceId,
  generateAlertId,
  generateRuleId,
  generateMACAddress,
  randomInRange,
  randomInt,
  randomChoice,
  generateInitialDataPoints,
  generateMockDevices,
  getDeviceStatistics,
  groupDevicesByType,
  getGroupStatistics,
  filterDevicesBySearch,
  generateNextDataPoint,
  updateRandomDeviceStatuses,
  formatMetricValue,
  formatDateTime,
  formatTimeOnly,
  checkAlertCondition,
  getApplicableRules,
  evaluateDeviceAlerts,
  createAlertRecord,
  buildAlertMessage,
  validateAlertRule,
  addAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  getRuleSummary,
  filterAlertRecords,
  sortAlertRecords,
  confirmAlertRecords,
  resolveAlertRecords,
  getAlertLevelColor,
  isNumericMetric,
  isValueNormal,
} from '../../device-monitor/deviceUtils.js'

describe('ID生成函数', () => {
  it('generateDeviceId 应生成以 dev_ 开头的ID', () => {
    const id = generateDeviceId()
    expect(id).toMatch(/^dev_[a-z0-9]+$/)
    expect(id.length).toBeGreaterThan(10)
  })

  it('generateAlertId 应生成以 alert_ 开头的ID', () => {
    const id = generateAlertId()
    expect(id).toMatch(/^alert_[a-z0-9]+$/)
  })

  it('generateRuleId 应生成以 rule_ 开头的ID', () => {
    const id = generateRuleId()
    expect(id).toMatch(/^rule_[a-z0-9]+$/)
  })

  it('generateMACAddress 应生成有效的MAC地址格式', () => {
    const mac = generateMACAddress()
    expect(mac).toMatch(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/)
  })

  it('两次调用应生成不同的ID', () => {
    const id1 = generateDeviceId()
    const id2 = generateDeviceId()
    expect(id1).not.toBe(id2)
  })
})

describe('随机数工具函数', () => {
  it('randomInRange 应返回指定范围内的数字', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInRange(10, 20)
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

  it('randomChoice 应从数组中返回一个元素', () => {
    const arr = ['a', 'b', 'c', 'd']
    for (let i = 0; i < 50; i++) {
      const val = randomChoice(arr)
      expect(arr).toContain(val)
    }
  })
})

describe('数据点生成', () => {
  it('generateInitialDataPoints 应生成指定数量的数据点', () => {
    const points = generateInitialDataPoints(METRIC_TYPES.TEMPERATURE, 50)
    expect(points).toHaveLength(50)
  })

  it('generateInitialDataPoints 默认生成 DATA_POINT_COUNT 个点', () => {
    const points = generateInitialDataPoints(METRIC_TYPES.HUMIDITY)
    expect(points).toHaveLength(DATA_POINT_COUNT)
  })

  it('数据点应包含 timestamp 和 value 字段', () => {
    const points = generateInitialDataPoints(METRIC_TYPES.TEMPERATURE, 10)
    points.forEach((p) => {
      expect(p).toHaveProperty('timestamp')
      expect(p).toHaveProperty('value')
      expect(typeof p.timestamp).toBe('number')
      expect(typeof p.value).toBe('number')
    })
  })

  it('数值应在合理范围内', () => {
    const range = DEFAULT_METRIC_RANGES[METRIC_TYPES.TEMPERATURE]
    const points = generateInitialDataPoints(METRIC_TYPES.TEMPERATURE, 100)
    points.forEach((p) => {
      expect(p.value).toBeGreaterThanOrEqual(range.min - 0.1)
      expect(p.value).toBeLessThanOrEqual(range.max + 0.1)
    })
  })

  it('时间戳应按升序排列', () => {
    const points = generateInitialDataPoints(METRIC_TYPES.TEMPERATURE, 20)
    for (let i = 1; i < points.length; i++) {
      expect(points[i].timestamp).toBeGreaterThan(points[i - 1].timestamp)
    }
  })
})

describe('模拟设备生成', () => {
  it('generateMockDevices 应生成指定数量的设备', () => {
    const devices = generateMockDevices(10)
    expect(devices).toHaveLength(10)
  })

  it('默认生成20个设备', () => {
    const devices = generateMockDevices()
    expect(devices).toHaveLength(20)
  })

  it('每个设备应包含必需字段', () => {
    const devices = generateMockDevices(5)
    devices.forEach((d) => {
      expect(d).toHaveProperty('id')
      expect(d).toHaveProperty('name')
      expect(d).toHaveProperty('type')
      expect(d).toHaveProperty('mac')
      expect(d).toHaveProperty('location')
      expect(d).toHaveProperty('firmwareVersion')
      expect(d).toHaveProperty('status')
      expect(d).toHaveProperty('lastOnline')
      expect(d).toHaveProperty('currentValue')
      expect(d).toHaveProperty('metricType')
      expect(d).toHaveProperty('dataPoints')
      expect(d).toHaveProperty('isAlerting')
    })
  })

  it('设备类型应均匀分布', () => {
    const devices = generateMockDevices(20)
    const typeCounts = {}
    devices.forEach((d) => {
      typeCounts[d.type] = (typeCounts[d.type] || 0) + 1
    })
    Object.values(DEVICE_TYPES).forEach((type) => {
      expect(typeCounts[type]).toBe(4)
    })
  })

  it('新生成设备默认为在线状态', () => {
    const devices = generateMockDevices(10)
    devices.forEach((d) => {
      expect(d.status).toBe(DEVICE_STATUS.ONLINE)
    })
  })
})

describe('设备统计函数', () => {
  it('getDeviceStatistics 应正确统计各类设备数量', () => {
    const devices = [
      { id: '1', status: DEVICE_STATUS.ONLINE, isAlerting: false },
      { id: '2', status: DEVICE_STATUS.ONLINE, isAlerting: false },
      { id: '3', status: DEVICE_STATUS.OFFLINE, isAlerting: false },
      { id: '4', status: DEVICE_STATUS.ONLINE, isAlerting: true },
    ]
    const stats = getDeviceStatistics(devices)
    expect(stats.total).toBe(4)
    expect(stats.online).toBe(2)
    expect(stats.offline).toBe(1)
    expect(stats.alert).toBe(1)
  })

  it('getDeviceStatistics 对非数组输入返回零值', () => {
    const stats = getDeviceStatistics(null)
    expect(stats).toEqual({ total: 0, online: 0, offline: 0, alert: 0 })
  })

  it('groupDevicesByType 应按类型分组设备', () => {
    const devices = [
      { id: '1', type: DEVICE_TYPES.TEMPERATURE },
      { id: '2', type: DEVICE_TYPES.HUMIDITY },
      { id: '3', type: DEVICE_TYPES.TEMPERATURE },
    ]
    const groups = groupDevicesByType(devices)
    expect(groups[DEVICE_TYPES.TEMPERATURE]).toHaveLength(2)
    expect(groups[DEVICE_TYPES.HUMIDITY]).toHaveLength(1)
  })

  it('groupDevicesByType 对非数组返回空对象', () => {
    const groups = groupDevicesByType(null)
    expect(Object.keys(groups).length).toBe(5)
    Object.values(groups).forEach((arr) => {
      expect(arr).toEqual([])
    })
  })

  it('getGroupStatistics 应正确计算分组统计', () => {
    const groupDevices = [
      { id: '1', status: DEVICE_STATUS.ONLINE, isAlerting: false },
      { id: '2', status: DEVICE_STATUS.OFFLINE, isAlerting: false },
    ]
    const stats = getGroupStatistics(groupDevices)
    expect(stats.total).toBe(2)
    expect(stats.online).toBe(1)
    expect(stats.offline).toBe(1)
    expect(stats.alert).toBe(0)
  })
})

describe('设备搜索过滤', () => {
  const devices = [
    { id: 'dev_001_temp', name: '温度传感器001' },
    { id: 'dev_002_humi', name: '湿度传感器002' },
    { id: 'dev_003_door', name: '门禁设备003' },
  ]

  it('filterDevicesBySearch 空关键词返回全部设备', () => {
    const result = filterDevicesBySearch(devices, '')
    expect(result).toHaveLength(3)
  })

  it('filterDevicesBySearch 按名称搜索', () => {
    const result = filterDevicesBySearch(devices, '温度')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('温度传感器001')
  })

  it('filterDevicesBySearch 按ID搜索', () => {
    const result = filterDevicesBySearch(devices, 'humi')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('dev_002_humi')
  })

  it('filterDevicesBySearch 不区分大小写', () => {
    const result = filterDevicesBySearch(devices, 'DEV_003')
    expect(result).toHaveLength(1)
  })

  it('filterDevicesBySearch 对非数组返回空数组', () => {
    const result = filterDevicesBySearch(null, '温度')
    expect(result).toEqual([])
  })
})

describe('数据点更新', () => {
  it('generateNextDataPoint 应返回新的设备状态', () => {
    const device = {
      id: 'test',
      type: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      status: DEVICE_STATUS.ONLINE,
      currentValue: 25,
      dataPoints: [],
      lastOnline: Date.now(),
    }
    const result = generateNextDataPoint(device)
    expect(result).not.toBe(device)
    expect(result.currentValue).toBeDefined()
    expect(result.dataPoints).toHaveLength(1)
  })

  it('generateNextDataPoint 保持数据点数量不超过 DATA_POINT_COUNT', () => {
    const points = []
    for (let i = 0; i < DATA_POINT_COUNT + 10; i++) {
      points.push({ timestamp: Date.now() - i * 3000, value: 20 + i * 0.1 })
    }
    const device = {
      id: 'test',
      type: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      status: DEVICE_STATUS.ONLINE,
      currentValue: 25,
      dataPoints: points,
      lastOnline: Date.now(),
    }
    const result = generateNextDataPoint(device)
    expect(result.dataPoints.length).toBe(DATA_POINT_COUNT)
  })

  it('generateNextDataPoint 对 null 输入返回 null', () => {
    const result = generateNextDataPoint(null)
    expect(result).toBeNull()
  })

  it('generateNextDataPoint 数值应在合理范围内', () => {
    const range = DEFAULT_METRIC_RANGES[METRIC_TYPES.TEMPERATURE]
    const device = {
      id: 'test',
      type: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      status: DEVICE_STATUS.ONLINE,
      currentValue: 25,
      dataPoints: [],
      lastOnline: Date.now(),
    }
    let current = device
    for (let i = 0; i < 50; i++) {
      current = generateNextDataPoint(current)
      expect(current.currentValue).toBeGreaterThanOrEqual(range.min)
      expect(current.currentValue).toBeLessThanOrEqual(range.max)
    }
  })
})

describe('设备状态随机更新', () => {
  it('updateRandomDeviceStatuses 应返回相同长度的数组', () => {
    const devices = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      status: DEVICE_STATUS.ONLINE,
    }))
    const result = updateRandomDeviceStatuses(devices)
    expect(result).toHaveLength(10)
  })

  it('updateRandomDeviceStatuses 不应修改原数组', () => {
    const devices = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      status: DEVICE_STATUS.ONLINE,
    }))
    const originalStatuses = devices.map((d) => d.status)
    updateRandomDeviceStatuses(devices)
    expect(devices.map((d) => d.status)).toEqual(originalStatuses)
  })

  it('updateRandomDeviceStatuses 对空数组返回空数组', () => {
    const result = updateRandomDeviceStatuses([])
    expect(result).toEqual([])
  })

  it('updateRandomDeviceStatuses 对非数组返回原输入', () => {
    const result = updateRandomDeviceStatuses(null)
    expect(result).toBeNull()
  })
})

describe('格式化函数', () => {
  it('formatMetricValue 对温度添加摄氏度单位', () => {
    const result = formatMetricValue(METRIC_TYPES.TEMPERATURE, 25.5)
    expect(result).toContain('25.50')
    expect(result).toContain('°C')
  })

  it('formatMetricValue 对湿度添加百分比单位', () => {
    const result = formatMetricValue(METRIC_TYPES.HUMIDITY, 65)
    expect(result).toContain('65.00')
    expect(result).toContain('%')
  })

  it('formatMetricValue 对门禁状态返回文字描述', () => {
    expect(formatMetricValue(METRIC_TYPES.ACCESS_STATE, 0)).toBe('关')
    expect(formatMetricValue(METRIC_TYPES.ACCESS_STATE, 1)).toBe('开')
  })

  it('formatMetricValue 对摄像头状态返回文字描述', () => {
    expect(formatMetricValue(METRIC_TYPES.CAMERA_STATUS, 0)).toBe('空闲')
    expect(formatMetricValue(METRIC_TYPES.CAMERA_STATUS, 1)).toBe('录制中')
  })

  it('formatMetricValue 对 null/undefined 返回 -', () => {
    expect(formatMetricValue(METRIC_TYPES.TEMPERATURE, null)).toBe('-')
    expect(formatMetricValue(METRIC_TYPES.TEMPERATURE, undefined)).toBe('-')
    expect(formatMetricValue(METRIC_TYPES.TEMPERATURE, NaN)).toBe('-')
  })

  it('formatDateTime 应返回正确格式的时间字符串', () => {
    const timestamp = new Date(2024, 0, 15, 10, 30, 45).getTime()
    const result = formatDateTime(timestamp)
    expect(result).toBe('2024-01-15 10:30:45')
  })

  it('formatDateTime 对无效时间返回 -', () => {
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime(0)).not.toBe('-')
  })

  it('formatTimeOnly 应只返回时分秒', () => {
    const timestamp = new Date(2024, 0, 15, 10, 30, 45).getTime()
    const result = formatTimeOnly(timestamp)
    expect(result).toBe('10:30:45')
  })

  it('formatTimeOnly 对无效时间返回空字符串', () => {
    expect(formatTimeOnly(null)).toBe('')
  })
})

describe('告警条件判断', () => {
  it('checkAlertCondition 大于条件', () => {
    const rule = { condition: ALERT_CONDITIONS.GREATER_THAN, threshold: 30 }
    expect(checkAlertCondition(rule, 35)).toBe(true)
    expect(checkAlertCondition(rule, 25)).toBe(false)
    expect(checkAlertCondition(rule, 30)).toBe(false)
  })

  it('checkAlertCondition 小于条件', () => {
    const rule = { condition: ALERT_CONDITIONS.LESS_THAN, threshold: 10 }
    expect(checkAlertCondition(rule, 5)).toBe(true)
    expect(checkAlertCondition(rule, 15)).toBe(false)
    expect(checkAlertCondition(rule, 10)).toBe(false)
  })

  it('checkAlertCondition 等于条件', () => {
    const rule = { condition: ALERT_CONDITIONS.EQUAL, threshold: 1 }
    expect(checkAlertCondition(rule, 1)).toBe(true)
    expect(checkAlertCondition(rule, 0)).toBe(false)
  })

  it('checkAlertCondition 对 null 规则返回 false', () => {
    expect(checkAlertCondition(null, 30)).toBe(false)
  })

  it('checkAlertCondition 对 null 值返回 false', () => {
    const rule = { condition: ALERT_CONDITIONS.GREATER_THAN, threshold: 30 }
    expect(checkAlertCondition(rule, null)).toBe(false)
    expect(checkAlertCondition(rule, undefined)).toBe(false)
  })
})

describe('告警规则匹配', () => {
  const rules = [
    {
      id: 'r1',
      enabled: true,
      deviceType: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      threshold: 35,
      level: ALERT_LEVELS.WARNING,
    },
    {
      id: 'r2',
      enabled: false,
      deviceType: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      threshold: 40,
      level: ALERT_LEVELS.CRITICAL,
    },
    {
      id: 'r3',
      enabled: true,
      deviceType: DEVICE_TYPES.HUMIDITY,
      metricType: METRIC_TYPES.HUMIDITY,
      condition: ALERT_CONDITIONS.LESS_THAN,
      threshold: 30,
      level: ALERT_LEVELS.INFO,
    },
  ]

  it('getApplicableRules 应返回设备适用的已启用规则', () => {
    const device = {
      type: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
    }
    const applicable = getApplicableRules(rules, device)
    expect(applicable).toHaveLength(1)
    expect(applicable[0].id).toBe('r1')
  })

  it('getApplicableRules 不匹配类型的规则不应返回', () => {
    const device = {
      type: DEVICE_TYPES.CAMERA,
      metricType: METRIC_TYPES.CAMERA_STATUS,
    }
    const applicable = getApplicableRules(rules, device)
    expect(applicable).toHaveLength(0)
  })

  it('evaluateDeviceAlerts 应正确评估设备告警状态', () => {
    const device = {
      type: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      currentValue: 38,
    }
    const result = evaluateDeviceAlerts(device, rules)
    expect(result.isAlerting).toBe(true)
    expect(result.triggeredRules).toHaveLength(1)
    expect(result.alertLevel).toBe(ALERT_LEVELS.WARNING)
  })

  it('evaluateDeviceAlerts 数值正常时不应告警', () => {
    const device = {
      type: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      currentValue: 25,
    }
    const result = evaluateDeviceAlerts(device, rules)
    expect(result.isAlerting).toBe(false)
    expect(result.triggeredRules).toHaveLength(0)
    expect(result.alertLevel).toBeNull()
  })

  it('evaluateDeviceAlerts 应返回最高告警级别', () => {
    const multiRules = [
      {
        id: 'r1',
        enabled: true,
        deviceType: DEVICE_TYPES.TEMPERATURE,
        metricType: METRIC_TYPES.TEMPERATURE,
        condition: ALERT_CONDITIONS.GREATER_THAN,
        threshold: 30,
        level: ALERT_LEVELS.INFO,
      },
      {
        id: 'r2',
        enabled: true,
        deviceType: DEVICE_TYPES.TEMPERATURE,
        metricType: METRIC_TYPES.TEMPERATURE,
        condition: ALERT_CONDITIONS.GREATER_THAN,
        threshold: 35,
        level: ALERT_LEVELS.CRITICAL,
      },
    ]
    const device = {
      type: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      currentValue: 38,
    }
    const result = evaluateDeviceAlerts(device, multiRules)
    expect(result.triggeredRules).toHaveLength(2)
    expect(result.alertLevel).toBe(ALERT_LEVELS.CRITICAL)
  })
})

describe('告警记录创建', () => {
  it('createAlertRecord 应生成完整的告警记录', () => {
    const device = {
      id: 'dev_001',
      name: '温度传感器001',
      type: DEVICE_TYPES.TEMPERATURE,
    }
    const rule = {
      id: 'rule_001',
      metricType: METRIC_TYPES.TEMPERATURE,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      threshold: 35,
      level: ALERT_LEVELS.WARNING,
    }
    const record = createAlertRecord(device, rule, 38.5)
    expect(record.id).toMatch(/^alert_/)
    expect(record.deviceId).toBe(device.id)
    expect(record.deviceName).toBe(device.name)
    expect(record.ruleId).toBe(rule.id)
    expect(record.value).toBe(38.5)
    expect(record.threshold).toBe(35)
    expect(record.level).toBe(ALERT_LEVELS.WARNING)
    expect(record.status).toBe(ALERT_STATUS.PENDING)
    expect(record.triggeredAt).toBeDefined()
    expect(record.message).toBeDefined()
  })

  it('buildAlertMessage 应生成人类可读的告警消息', () => {
    const device = { name: '温度传感器001' }
    const rule = {
      metricType: METRIC_TYPES.TEMPERATURE,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      threshold: 35,
      level: ALERT_LEVELS.WARNING,
    }
    const msg = buildAlertMessage(device, rule, 38.5)
    expect(msg).toContain('温度传感器001')
    expect(msg).toContain('温度')
    expect(msg).toContain('35°C')
    expect(msg).toContain('警告')
  })
})

describe('告警规则验证与管理', () => {
  it('validateAlertRule 对完整数据应无错误', () => {
    const data = {
      deviceType: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      level: ALERT_LEVELS.WARNING,
      threshold: 35,
    }
    const errors = validateAlertRule(data)
    expect(Object.keys(errors).length).toBe(0)
  })

  it('validateAlertRule 对缺少字段应返回错误', () => {
    const data = {
      deviceType: DEVICE_TYPES.TEMPERATURE,
    }
    const errors = validateAlertRule(data)
    expect(errors).toHaveProperty('metricType')
    expect(errors).toHaveProperty('condition')
    expect(errors).toHaveProperty('level')
    expect(errors).toHaveProperty('threshold')
  })

  it('validateAlertRule 对无效阈值应返回错误', () => {
    const data = {
      deviceType: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      level: ALERT_LEVELS.WARNING,
      threshold: 'abc',
    }
    const errors = validateAlertRule(data)
    expect(errors).toHaveProperty('threshold')
  })

  it('addAlertRule 应成功添加有效规则', () => {
    const rules = []
    const data = {
      deviceType: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      level: ALERT_LEVELS.WARNING,
      threshold: 35,
    }
    const result = addAlertRule(rules, data)
    expect(result.success).toBe(true)
    expect(result.rules).toHaveLength(1)
    expect(result.rule).toBeDefined()
    expect(result.rule.enabled).toBe(true)
  })

  it('addAlertRule 对无效数据应返回错误', () => {
    const rules = []
    const data = { deviceType: DEVICE_TYPES.TEMPERATURE }
    const result = addAlertRule(rules, data)
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('deleteAlertRule 应删除指定规则', () => {
    const rules = [
      { id: 'r1', name: 'rule1' },
      { id: 'r2', name: 'rule2' },
    ]
    const result = deleteAlertRule(rules, 'r1')
    expect(result.success).toBe(true)
    expect(result.rules).toHaveLength(1)
    expect(result.rules[0].id).toBe('r2')
  })

  it('deleteAlertRule 对不存在的ID返回失败', () => {
    const rules = [{ id: 'r1', name: 'rule1' }]
    const result = deleteAlertRule(rules, 'r999')
    expect(result.success).toBe(false)
  })

  it('toggleAlertRule 应切换规则启用状态', () => {
    const rules = [{ id: 'r1', enabled: true }]
    const result = toggleAlertRule(rules, 'r1')
    expect(result.success).toBe(true)
    expect(result.rules[0].enabled).toBe(false)
  })

  it('getRuleSummary 应生成规则摘要', () => {
    const rule = {
      deviceType: DEVICE_TYPES.TEMPERATURE,
      metricType: METRIC_TYPES.TEMPERATURE,
      condition: ALERT_CONDITIONS.GREATER_THAN,
      threshold: 35,
      level: ALERT_LEVELS.CRITICAL,
    }
    const summary = getRuleSummary(rule)
    expect(summary).toContain('温度传感器')
    expect(summary).toContain('温度')
    expect(summary).toContain('大于')
    expect(summary).toContain('35°C')
    expect(summary).toContain('严重')
  })
})

describe('告警记录过滤与排序', () => {
  const baseRecords = [
    {
      id: 'a1',
      level: ALERT_LEVELS.CRITICAL,
      status: ALERT_STATUS.PENDING,
      triggeredAt: new Date(2024, 0, 15, 10, 0, 0).getTime(),
      deviceName: '温度传感器001',
      message: '温度过高告警',
    },
    {
      id: 'a2',
      level: ALERT_LEVELS.WARNING,
      status: ALERT_STATUS.CONFIRMED,
      triggeredAt: new Date(2024, 0, 16, 14, 0, 0).getTime(),
      deviceName: '湿度传感器002',
      message: '湿度过低告警',
    },
    {
      id: 'a3',
      level: ALERT_LEVELS.INFO,
      status: ALERT_STATUS.RESOLVED,
      triggeredAt: new Date(2024, 0, 17, 9, 0, 0).getTime(),
      deviceName: '门禁设备003',
      message: '门禁状态异常',
    },
  ]

  it('filterAlertRecords 按告警级别过滤', () => {
    const result = filterAlertRecords(baseRecords, { level: ALERT_LEVELS.CRITICAL })
    expect(result).toHaveLength(1)
    expect(result[0].level).toBe(ALERT_LEVELS.CRITICAL)
  })

  it('filterAlertRecords 按处理状态过滤', () => {
    const result = filterAlertRecords(baseRecords, { status: ALERT_STATUS.PENDING })
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe(ALERT_STATUS.PENDING)
  })

  it('filterAlertRecords 按时间范围过滤', () => {
    const result = filterAlertRecords(baseRecords, {
      startTime: '2024-01-15',
      endTime: '2024-01-16',
    })
    expect(result).toHaveLength(2)
  })

  it('filterAlertRecords 按关键字搜索设备名', () => {
    const result = filterAlertRecords(baseRecords, { keyword: '温度' })
    expect(result).toHaveLength(1)
    expect(result[0].deviceName).toBe('温度传感器001')
  })

  it('filterAlertRecords 按关键字搜索告警内容', () => {
    const result = filterAlertRecords(baseRecords, { keyword: '湿度' })
    expect(result).toHaveLength(1)
  })

  it('sortAlertRecords 默认按触发时间降序', () => {
    const result = sortAlertRecords(baseRecords)
    expect(result[0].id).toBe('a3')
    expect(result[2].id).toBe('a1')
  })

  it('sortAlertRecords 按触发时间升序', () => {
    const result = sortAlertRecords(baseRecords, 'triggeredAt', 'asc')
    expect(result[0].id).toBe('a1')
    expect(result[2].id).toBe('a3')
  })
})

describe('告警记录批量操作', () => {
  it('confirmAlertRecords 应批量确认告警', () => {
    const records = [
      { id: 'a1', status: ALERT_STATUS.PENDING },
      { id: 'a2', status: ALERT_STATUS.PENDING },
      { id: 'a3', status: ALERT_STATUS.RESOLVED },
    ]
    const result = confirmAlertRecords(records, ['a1', 'a2'])
    expect(result.success).toBe(true)
    expect(result.records[0].status).toBe(ALERT_STATUS.CONFIRMED)
    expect(result.records[1].status).toBe(ALERT_STATUS.CONFIRMED)
    expect(result.records[2].status).toBe(ALERT_STATUS.RESOLVED)
  })

  it('confirmAlertRecords 不应重复确认已确认的记录', () => {
    const records = [
      { id: 'a1', status: ALERT_STATUS.CONFIRMED, confirmedAt: 1000 },
    ]
    const result = confirmAlertRecords(records, ['a1'])
    expect(result.records[0].confirmedAt).toBe(1000)
  })

  it('resolveAlertRecords 应批量解决告警', () => {
    const records = [
      { id: 'a1', status: ALERT_STATUS.PENDING, triggeredAt: Date.now() - 5000 },
      { id: 'a2', status: ALERT_STATUS.CONFIRMED, triggeredAt: Date.now() - 3000 },
    ]
    const result = resolveAlertRecords(records, ['a1', 'a2'])
    expect(result.success).toBe(true)
    expect(result.records[0].status).toBe(ALERT_STATUS.RESOLVED)
    expect(result.records[1].status).toBe(ALERT_STATUS.RESOLVED)
    expect(result.records[0].duration).toBeGreaterThan(0)
  })

  it('confirmAlertRecords 对空ID数组返回失败', () => {
    const result = confirmAlertRecords([], [])
    expect(result.success).toBe(false)
  })
})

describe('辅助工具函数', () => {
  it('getAlertLevelColor 应返回各级别颜色', () => {
    expect(getAlertLevelColor(ALERT_LEVELS.INFO)).toBe('#1890ff')
    expect(getAlertLevelColor(ALERT_LEVELS.WARNING)).toBe('#fa8c16')
    expect(getAlertLevelColor(ALERT_LEVELS.CRITICAL)).toBe('#f5222d')
  })

  it('getAlertLevelColor 对未知级别返回默认颜色', () => {
    expect(getAlertLevelColor('unknown')).toBe('#999')
  })

  it('isNumericMetric 对数值型指标返回 true', () => {
    expect(isNumericMetric(METRIC_TYPES.TEMPERATURE)).toBe(true)
    expect(isNumericMetric(METRIC_TYPES.HUMIDITY)).toBe(true)
    expect(isNumericMetric(METRIC_TYPES.NETWORK_QUALITY)).toBe(true)
  })

  it('isNumericMetric 对非数值型指标返回 false', () => {
    expect(isNumericMetric(METRIC_TYPES.ACCESS_STATE)).toBe(false)
    expect(isNumericMetric(METRIC_TYPES.CAMERA_STATUS)).toBe(false)
  })

  it('isValueNormal 对正常范围值返回 true', () => {
    const device = {
      metricType: METRIC_TYPES.TEMPERATURE,
      currentValue: 25,
    }
    expect(isValueNormal(device)).toBe(true)
  })

  it('isValueNormal 对极端值返回 false', () => {
    const device = {
      metricType: METRIC_TYPES.TEMPERATURE,
      currentValue: 15,
    }
    expect(isValueNormal(device)).toBe(false)
  })

  it('isValueNormal 对 null 设备返回 true', () => {
    expect(isValueNormal(null)).toBe(true)
  })
})
