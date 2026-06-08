import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import {
  PHASES,
  DEFAULT_SETTINGS,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_TIMER_STATE,
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
  updateDocumentTitle,
  resetDocumentTitle,
  requestNotificationPermission,
  sendNotification,
  playBeep,
  saveTimerState,
  loadTimerState,
  clearTimerState,
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
let originalDocument
let originalNotification
let originalAudioContext
let originalWebkitAudioContext

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
  originalDocument = globalThis.document
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
  globalThis.document = originalDocument
  if (originalNotification !== undefined) {
    globalThis.Notification = originalNotification
  } else {
    delete globalThis.Notification
  }
  if (originalAudioContext !== undefined) {
    globalThis.AudioContext = originalAudioContext
  } else {
    delete globalThis.AudioContext
  }
  if (originalWebkitAudioContext !== undefined) {
    globalThis.webkitAudioContext = originalWebkitAudioContext
  } else {
    delete globalThis.webkitAudioContext
  }
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

  it('records 为 undefined 时返回空数组', () => {
    const result = addRecord(undefined, { id: 'new' })
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('new')
  })

  it('records 为 null 时返回空数组', () => {
    const result = addRecord(null, { id: 'new' })
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(1)
  })

  it('records 为非数组时返回只包含新记录的数组', () => {
    const result = addRecord('not-array', { id: 'new' })
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([{ id: 'new' }])
  })

  it('records 无效且新记录也无效时返回空数组', () => {
    expect(addRecord(undefined, null)).toEqual([])
    expect(addRecord(null, undefined)).toEqual([])
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

describe('updateDocumentTitle', () => {
  it('document 不存在时不报错', () => {
    const origDoc = globalThis.document
    delete globalThis.document
    expect(() => updateDocumentTitle(1500, '工作中')).not.toThrow()
    globalThis.document = origDoc
  })

  it('剩余秒数大于0时更新标题', () => {
    globalThis.document = { title: '' }
    updateDocumentTitle(1500, '工作中')
    expect(globalThis.document.title).toBe('25:00 - 工作中')
  })

  it('剩余秒数为0时显示默认标题', () => {
    globalThis.document = { title: '' }
    updateDocumentTitle(0, '工作中')
    expect(globalThis.document.title).toBe('番茄钟计时器')
  })
})

describe('resetDocumentTitle', () => {
  it('document 不存在时不报错', () => {
    const origDoc = globalThis.document
    delete globalThis.document
    expect(() => resetDocumentTitle()).not.toThrow()
    globalThis.document = origDoc
  })

  it('重置标题为默认值', () => {
    globalThis.document = { title: '25:00 - 工作中' }
    resetDocumentTitle()
    expect(globalThis.document.title).toBe('番茄钟计时器')
  })
})

describe('requestNotificationPermission', () => {
  it('Notification 不存在时返回 unsupported', async () => {
    const origNotif = globalThis.Notification
    delete globalThis.Notification
    const result = await requestNotificationPermission()
    expect(result).toBe('unsupported')
    globalThis.Notification = origNotif
  })

  it('权限已授权时返回 granted', async () => {
    globalThis.Notification = { permission: 'granted' }
    const result = await requestNotificationPermission()
    expect(result).toBe('granted')
  })

  it('权限已拒绝时返回 denied', async () => {
    globalThis.Notification = { permission: 'denied' }
    const result = await requestNotificationPermission()
    expect(result).toBe('denied')
  })

  it('用户授权时返回 granted', async () => {
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    }
    const result = await requestNotificationPermission()
    expect(result).toBe('granted')
    expect(globalThis.Notification.requestPermission).toHaveBeenCalled()
  })

  it('用户拒绝时返回 denied', async () => {
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('denied'),
    }
    const result = await requestNotificationPermission()
    expect(result).toBe('denied')
  })

  it('requestPermission 抛错时返回 denied', async () => {
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockRejectedValue(new Error('denied')),
    }
    const result = await requestNotificationPermission()
    expect(result).toBe('denied')
  })
})

describe('sendNotification', () => {
  it('Notification 不存在时返回 false', () => {
    const origNotif = globalThis.Notification
    delete globalThis.Notification
    expect(sendNotification('test', 'body')).toBe(false)
    globalThis.Notification = origNotif
  })

  it('权限未授权时返回 false', () => {
    globalThis.Notification = { permission: 'denied' }
    expect(sendNotification('test', 'body')).toBe(false)
  })

  it('权限已授权时成功发送通知', () => {
    const mockNotification = vi.fn()
    globalThis.Notification = {
      permission: 'granted',
    }
    globalThis.Notification = mockNotification
    globalThis.Notification.permission = 'granted'

    const result = sendNotification('测试标题', '测试内容')
    expect(result).toBe(true)
  })

  it('构造 Notification 抛错时返回 false', () => {
    globalThis.Notification = function () {
      throw new Error('error')
    }
    globalThis.Notification.permission = 'granted'
    const result = sendNotification('test', 'body')
    expect(result).toBe(false)
  })
})

describe('playBeep', () => {
  it('AudioContext 和 webkitAudioContext 都不存在时返回 false', () => {
    const origAC = globalThis.AudioContext
    const origWAC = globalThis.webkitAudioContext
    delete globalThis.AudioContext
    delete globalThis.webkitAudioContext
    expect(playBeep()).toBe(false)
    globalThis.AudioContext = origAC
    globalThis.webkitAudioContext = origWAC
  })

  it('AudioContext 存在时成功播放', () => {
    const mockGain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    }
    const mockOscillator = {
      connect: vi.fn(),
      frequency: { value: 0 },
      start: vi.fn(),
      stop: vi.fn(),
    }
    const mockCtx = {
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
      destination: {},
      currentTime: 0,
    }
    function MockAudioContext() {
      return mockCtx
    }
    const spy = vi.fn(MockAudioContext)

    globalThis.AudioContext = spy
    delete globalThis.webkitAudioContext

    const result = playBeep()
    expect(result).toBe(true)
    expect(spy).toHaveBeenCalled()
    expect(mockCtx.createOscillator).toHaveBeenCalled()
    expect(mockCtx.createGain).toHaveBeenCalled()
    expect(mockOscillator.frequency.value).toBe(880)
    expect(mockOscillator.start).toHaveBeenCalled()
    expect(mockOscillator.stop).toHaveBeenCalled()
  })

  it('AudioContext 抛错时返回 false', () => {
    globalThis.AudioContext = function () {
      throw new Error('error')
    }
    const result = playBeep()
    expect(result).toBe(false)
  })
})

describe('timer state localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveTimerState 保存到 localStorage', () => {
    const state = {
      currentPhase: PHASES.WORK,
      remainingSeconds: 1000,
      totalSeconds: 1500,
      completedWorkPomodoros: 2,
      currentTask: '测试任务',
    }
    const result = saveTimerState(state)
    expect(result).toBe(true)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_TIMER_STATE))
    expect(saved.currentPhase).toBe(PHASES.WORK)
    expect(saved.remainingSeconds).toBe(1000)
    expect(saved.totalSeconds).toBe(1500)
    expect(saved.completedWorkPomodoros).toBe(2)
    expect(saved.currentTask).toBe('测试任务')
    expect(typeof saved.savedAt).toBe('number')
  })

  it('saveTimerState 出错时返回 false', () => {
    const origSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const result = saveTimerState({ currentPhase: PHASES.WORK, remainingSeconds: 0, totalSeconds: 0, completedWorkPomodoros: 0, currentTask: '' })
    expect(result).toBe(false)
    localStorage.setItem = origSetItem
  })

  it('loadTimerState 从 localStorage 读取并验证', () => {
    const saved = {
      currentPhase: PHASES.WORK,
      remainingSeconds: 1000,
      totalSeconds: 1500,
      completedWorkPomodoros: 2,
      currentTask: '测试任务',
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY_TIMER_STATE, JSON.stringify(saved))
    const result = loadTimerState(DEFAULT_SETTINGS)
    expect(result).not.toBeNull()
    expect(result.currentPhase).toBe(PHASES.WORK)
    expect(result.remainingSeconds).toBe(1000)
    expect(result.totalSeconds).toBe(1500)
    expect(result.completedWorkPomodoros).toBe(2)
    expect(result.currentTask).toBe('测试任务')
  })

  it('loadTimerState localStorage 为空时返回 null', () => {
    expect(loadTimerState(DEFAULT_SETTINGS)).toBeNull()
  })

  it('loadTimerState 数据损坏时返回 null', () => {
    localStorage.setItem(STORAGE_KEY_TIMER_STATE, 'invalid json')
    expect(loadTimerState(DEFAULT_SETTINGS)).toBeNull()
  })

  it('loadTimerState 阶段无效时返回 null', () => {
    localStorage.setItem(STORAGE_KEY_TIMER_STATE, JSON.stringify({ currentPhase: 'invalid' }))
    expect(loadTimerState(DEFAULT_SETTINGS)).toBeNull()
  })

  it('loadTimerState 限制 remainingSeconds 不超过阶段时长', () => {
    const saved = {
      currentPhase: PHASES.WORK,
      remainingSeconds: 9999,
      totalSeconds: 9999,
      completedWorkPomodoros: 0,
      currentTask: '',
    }
    localStorage.setItem(STORAGE_KEY_TIMER_STATE, JSON.stringify(saved))
    const result = loadTimerState(DEFAULT_SETTINGS)
    expect(result.remainingSeconds).toBe(25 * 60)
    expect(result.totalSeconds).toBe(25 * 60)
  })

  it('loadTimerState 负数的 remainingSeconds 被限制为 0', () => {
    const saved = {
      currentPhase: PHASES.WORK,
      remainingSeconds: -100,
      totalSeconds: 1500,
      completedWorkPomodoros: 0,
      currentTask: '',
    }
    localStorage.setItem(STORAGE_KEY_TIMER_STATE, JSON.stringify(saved))
    const result = loadTimerState(DEFAULT_SETTINGS)
    expect(result.remainingSeconds).toBe(0)
  })

  it('loadTimerState 处理 completedWorkPomodoros 无效值', () => {
    const saved = {
      currentPhase: PHASES.WORK,
      remainingSeconds: 100,
      totalSeconds: 1500,
      completedWorkPomodoros: 'invalid',
      currentTask: '',
    }
    localStorage.setItem(STORAGE_KEY_TIMER_STATE, JSON.stringify(saved))
    const result = loadTimerState(DEFAULT_SETTINGS)
    expect(result.completedWorkPomodoros).toBe(0)
  })

  it('loadTimerState currentTask 非字符串时返回空字符串', () => {
    const saved = {
      currentPhase: PHASES.WORK,
      remainingSeconds: 100,
      totalSeconds: 1500,
      completedWorkPomodoros: 0,
      currentTask: 123,
    }
    localStorage.setItem(STORAGE_KEY_TIMER_STATE, JSON.stringify(saved))
    const result = loadTimerState(DEFAULT_SETTINGS)
    expect(result.currentTask).toBe('')
  })

  it('clearTimerState 清除存储的状态', () => {
    localStorage.setItem(STORAGE_KEY_TIMER_STATE, JSON.stringify({ foo: 'bar' }))
    const result = clearTimerState()
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_TIMER_STATE)).toBeNull()
  })

  it('clearTimerState 出错时返回 false', () => {
    const origRemoveItem = localStorage.removeItem
    localStorage.removeItem = vi.fn().mockImplementation(() => {
      throw new Error('error')
    })
    const result = clearTimerState()
    expect(result).toBe(false)
    localStorage.removeItem = origRemoveItem
  })
})
