import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  PHASES,
  DEFAULT_SETTINGS,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_RECORDS,
} from '../../pomodoro/constants'
import {
  formatTime,
  getPhaseDuration,
  getNextPhase,
  validateSettings,
  normalizeSettings,
  loadSettings,
  saveSettings,
  generateRecordId,
  createPomodoroRecord,
  loadRecords,
  saveRecords,
  addRecord,
  getDateKey,
  getLastNDays,
  buildDailyStats,
  calculateSummary,
} from '../../pomodoro/pomodoroUtils'

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

describe('formatTime', () => {
  it('正确格式化秒数为 MM:SS', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(59)).toBe('00:59')
    expect(formatTime(60)).toBe('01:00')
    expect(formatTime(1500)).toBe('25:00')
    expect(formatTime(1501)).toBe('25:01')
    expect(formatTime(3600)).toBe('60:00')
  })

  it('处理负数时返回 00:00', () => {
    expect(formatTime(-1)).toBe('00:00')
    expect(formatTime(-100)).toBe('00:00')
  })

  it('处理浮点数时取整', () => {
    expect(formatTime(1500.9)).toBe('25:00')
    expect(formatTime(1500.1)).toBe('25:00')
  })
})

describe('getPhaseDuration', () => {
  it('获取各阶段默认时长', () => {
    expect(getPhaseDuration(PHASES.WORK, DEFAULT_SETTINGS)).toBe(25 * 60)
    expect(getPhaseDuration(PHASES.SHORT_BREAK, DEFAULT_SETTINGS)).toBe(5 * 60)
    expect(getPhaseDuration(PHASES.LONG_BREAK, DEFAULT_SETTINGS)).toBe(15 * 60)
  })

  it('使用自定义设置时长', () => {
    const customSettings = {
      workMinutes: 30,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      longBreakInterval: 4,
    }
    expect(getPhaseDuration(PHASES.WORK, customSettings)).toBe(30 * 60)
    expect(getPhaseDuration(PHASES.SHORT_BREAK, customSettings)).toBe(10 * 60)
    expect(getPhaseDuration(PHASES.LONG_BREAK, customSettings)).toBe(20 * 60)
  })

  it('设置不完整时使用默认值', () => {
    expect(getPhaseDuration(PHASES.WORK, {})).toBe(25 * 60)
    expect(getPhaseDuration(PHASES.WORK, { workMinutes: undefined })).toBe(25 * 60)
  })

  it('未知阶段返回工作时长', () => {
    expect(getPhaseDuration('unknown', DEFAULT_SETTINGS)).toBe(25 * 60)
  })
})

describe('getNextPhase', () => {
  it('工作后进入短休息', () => {
    const result = getNextPhase(PHASES.WORK, 0, DEFAULT_SETTINGS)
    expect(result.phase).toBe(PHASES.SHORT_BREAK)
    expect(result.completedWorkPomodoros).toBe(1)
  })

  it('每4个工作番茄后进入长休息', () => {
    const result = getNextPhase(PHASES.WORK, 3, DEFAULT_SETTINGS)
    expect(result.phase).toBe(PHASES.LONG_BREAK)
    expect(result.completedWorkPomodoros).toBe(4)
  })

  it('第8个工作番茄后也进入长休息', () => {
    const result = getNextPhase(PHASES.WORK, 7, DEFAULT_SETTINGS)
    expect(result.phase).toBe(PHASES.LONG_BREAK)
    expect(result.completedWorkPomodoros).toBe(8)
  })

  it('自定义长休间隔为2时，第2个番茄后长休', () => {
    const settings = { ...DEFAULT_SETTINGS, longBreakInterval: 2 }
    const result = getNextPhase(PHASES.WORK, 1, settings)
    expect(result.phase).toBe(PHASES.LONG_BREAK)
    expect(result.completedWorkPomodoros).toBe(2)
  })

  it('短休息后回到工作', () => {
    const result = getNextPhase(PHASES.SHORT_BREAK, 1, DEFAULT_SETTINGS)
    expect(result.phase).toBe(PHASES.WORK)
    expect(result.completedWorkPomodoros).toBe(1)
  })

  it('长休息后回到工作', () => {
    const result = getNextPhase(PHASES.LONG_BREAK, 4, DEFAULT_SETTINGS)
    expect(result.phase).toBe(PHASES.WORK)
    expect(result.completedWorkPomodoros).toBe(4)
  })
})

describe('validateSettings', () => {
  it('合法设置返回空错误对象', () => {
    const errors = validateSettings(DEFAULT_SETTINGS)
    expect(Object.keys(errors).length).toBe(0)
  })

  it('工作时长为 1-120 分钟', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, workMinutes: 0 }).workMinutes).toBeTruthy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, workMinutes: 121 }).workMinutes).toBeTruthy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, workMinutes: 1 }).workMinutes).toBeFalsy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, workMinutes: 120 }).workMinutes).toBeFalsy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, workMinutes: 'abc' }).workMinutes).toBeTruthy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, workMinutes: '' }).workMinutes).toBeTruthy()
  })

  it('短休时长为 1-60 分钟', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, shortBreakMinutes: 0 }).shortBreakMinutes).toBeTruthy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, shortBreakMinutes: 61 }).shortBreakMinutes).toBeTruthy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, shortBreakMinutes: 1 }).shortBreakMinutes).toBeFalsy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, shortBreakMinutes: 60 }).shortBreakMinutes).toBeFalsy()
  })

  it('长休时长为 1-120 分钟', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, longBreakMinutes: 0 }).longBreakMinutes).toBeTruthy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, longBreakMinutes: 121 }).longBreakMinutes).toBeTruthy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, longBreakMinutes: 1 }).longBreakMinutes).toBeFalsy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, longBreakMinutes: 120 }).longBreakMinutes).toBeFalsy()
  })

  it('长休间隔为 2-6', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, longBreakInterval: 1 }).longBreakInterval).toBeTruthy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, longBreakInterval: 7 }).longBreakInterval).toBeTruthy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, longBreakInterval: 2 }).longBreakInterval).toBeFalsy()
    expect(validateSettings({ ...DEFAULT_SETTINGS, longBreakInterval: 6 }).longBreakInterval).toBeFalsy()
  })
})

describe('normalizeSettings', () => {
  it('合法设置成功规范化', () => {
    const result = normalizeSettings({
      workMinutes: '30',
      shortBreakMinutes: '5',
      longBreakMinutes: '15',
      longBreakInterval: '4',
    })
    expect(result.success).toBe(true)
    expect(result.settings.workMinutes).toBe(30)
    expect(result.settings.shortBreakMinutes).toBe(5)
    expect(result.settings.longBreakMinutes).toBe(15)
    expect(result.settings.longBreakInterval).toBe(4)
  })

  it('不合法设置返回失败', () => {
    const result = normalizeSettings({
      workMinutes: 0,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      longBreakInterval: 4,
    })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })
})

describe('settings localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveSettings 保存到 localStorage', () => {
    const result = saveSettings(DEFAULT_SETTINGS)
    expect(result.success).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_SETTINGS)).toBe(JSON.stringify(DEFAULT_SETTINGS))
  })

  it('saveSettings 不合法设置保存失败', () => {
    const result = saveSettings({ ...DEFAULT_SETTINGS, workMinutes: 0 })
    expect(result.success).toBe(false)
  })

  it('loadSettings 从 localStorage 读取', () => {
    const custom = { workMinutes: 30, shortBreakMinutes: 10, longBreakMinutes: 20, longBreakInterval: 3 }
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(custom))
    const result = loadSettings()
    expect(result).toEqual(custom)
  })

  it('loadSettings localStorage 为空时返回默认设置', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('loadSettings localStorage 数据损坏时返回默认设置', () => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, 'invalid-json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('loadSettings 设置不合法时返回默认设置', () => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ workMinutes: 0 }))
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('generateRecordId', () => {
  it('生成的ID以 pom_ 开头', () => {
    expect(generateRecordId()).toMatch(/^pom_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateRecordId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('createPomodoroRecord', () => {
  it('创建工作番茄记录', () => {
    const now = Date.now()
    const record = createPomodoroRecord('测试任务', 25, PHASES.WORK)
    expect(record.id).toMatch(/^pom_/)
    expect(record.taskName).toBe('测试任务')
    expect(record.durationMinutes).toBe(25)
    expect(record.phase).toBe(PHASES.WORK)
    expect(record.completedAt).toBeGreaterThanOrEqual(now)
  })

  it('任务名为空时使用默认值', () => {
    const record = createPomodoroRecord('', 25, PHASES.WORK)
    expect(record.taskName).toBe('未命名任务')
  })

  it('任务名去除首尾空格', () => {
    const record = createPomodoroRecord('  测试任务  ', 25, PHASES.WORK)
    expect(record.taskName).toBe('测试任务')
  })
})

describe('records localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveRecords 保存到 localStorage', () => {
    const records = [{ id: '1', completedAt: Date.now(), durationMinutes: 25 }]
    const result = saveRecords(records)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_RECORDS)).toBe(JSON.stringify(records))
  })

  it('loadRecords 从 localStorage 读取', () => {
    const records = [
      { id: '1', completedAt: Date.now(), durationMinutes: 25, phase: PHASES.WORK, taskName: 'test' },
    ]
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
    const result = loadRecords()
    expect(result).toEqual(records)
  })

  it('loadRecords localStorage 为空时返回空数组', () => {
    expect(loadRecords()).toEqual([])
  })

  it('loadRecords 数据损坏时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_RECORDS, 'invalid')
    expect(loadRecords()).toEqual([])
  })

  it('loadRecords 数据非数组时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify({ not: 'array' }))
    expect(loadRecords()).toEqual([])
  })

  it('loadRecords 过滤无效记录', () => {
    const records = [
      { id: '1', completedAt: Date.now(), durationMinutes: 25 },
      null,
      { id: '2' },
      'invalid',
      { id: '3', completedAt: 'not-number', durationMinutes: 25 },
    ]
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
    const result = loadRecords()
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })
})

describe('addRecord', () => {
  it('添加记录到列表开头', () => {
    const existing = [{ id: 'old' }]
    const newRecord = { id: 'new' }
    const result = addRecord(existing, newRecord)
    expect(result.length).toBe(2)
    expect(result[0].id).toBe('new')
    expect(result[1].id).toBe('old')
  })

  it('不添加无效记录', () => {
    const existing = [{ id: '1' }]
    const result = addRecord(existing, null)
    expect(result).toBe(existing)
  })
})

describe('getDateKey', () => {
  it('提取日期 key 为 YYYY-MM-DD', () => {
    const d = new Date(2025, 0, 15).getTime()
    expect(getDateKey(d)).toBe('2025-01-15')
  })

  it('正确处理月份和日期前导零', () => {
    const d = new Date(2025, 0, 5).getTime()
    expect(getDateKey(d)).toBe('2025-01-05')
  })
})

describe('getLastNDays', () => {
  it('获取最近7天', () => {
    const days = getLastNDays(7)
    expect(days.length).toBe(7)
    days.forEach((d) => {
      expect(d.key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(typeof d.timestamp).toBe('number')
    })
  })

  it('获取最近30天', () => {
    const days = getLastNDays(30)
    expect(days.length).toBe(30)
  })

  it('按时间顺序排列（最早到最晚）', () => {
    const days = getLastNDays(7)
    for (let i = 1; i < days.length; i++) {
      expect(days[i].timestamp).toBeGreaterThan(days[i - 1].timestamp)
    }
  })
})

describe('buildDailyStats', () => {
  it('构建每日统计数据', () => {
    const days = getLastNDays(3)
    const today = days[2].timestamp
    const yesterday = days[1].timestamp

    const records = [
      createPomodoroRecord('任务1', 25, PHASES.WORK),
      createPomodoroRecord('任务2', 25, PHASES.WORK),
      createPomodoroRecord('任务3', 25, PHASES.SHORT_BREAK),
    ]
    records[0].completedAt = today
    records[1].completedAt = yesterday
    records[2].completedAt = today

    const stats = buildDailyStats(records, days)
    expect(stats.length).toBe(3)
    expect(stats[2].count).toBe(1)
    expect(stats[2].minutes).toBe(25)
    expect(stats[1].count).toBe(1)
    expect(stats[1].minutes).toBe(25)
    expect(stats[0].count).toBe(0)
  })

  it('无记录时每天都是0', () => {
    const days = getLastNDays(7)
    const stats = buildDailyStats([], days)
    stats.forEach((s) => {
      expect(s.count).toBe(0)
      expect(s.minutes).toBe(0)
    })
  })
})

describe('calculateSummary', () => {
  it('计算汇总统计', () => {
    const records = [
      { ...createPomodoroRecord('任务1', 25, PHASES.WORK), completedAt: Date.now() },
      { ...createPomodoroRecord('任务2', 30, PHASES.WORK), completedAt: Date.now() },
      { ...createPomodoroRecord('任务3', 5, PHASES.SHORT_BREAK), completedAt: Date.now() },
    ]
    const summary = calculateSummary(records)
    expect(summary.totalPomodoros).toBe(2)
    expect(summary.totalMinutes).toBe(55)
    expect(summary.totalHours).toBe(0)
    expect(summary.remainingMinutes).toBe(55)
    expect(summary.dailyAvg).toBeGreaterThan(0)
  })

  it('超过60分钟正确转换为小时', () => {
    const records = [
      { ...createPomodoroRecord('任务1', 25, PHASES.WORK), completedAt: Date.now() },
      { ...createPomodoroRecord('任务2', 25, PHASES.WORK), completedAt: Date.now() },
      { ...createPomodoroRecord('任务3', 25, PHASES.WORK), completedAt: Date.now() },
    ]
    const summary = calculateSummary(records)
    expect(summary.totalMinutes).toBe(75)
    expect(summary.totalHours).toBe(1)
    expect(summary.remainingMinutes).toBe(15)
  })

  it('无记录时返回0', () => {
    const summary = calculateSummary([])
    expect(summary.totalPomodoros).toBe(0)
    expect(summary.totalMinutes).toBe(0)
    expect(summary.totalHours).toBe(0)
    expect(summary.remainingMinutes).toBe(0)
    expect(summary.dailyAvg).toBe(0)
  })
})
