import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  STORAGE_KEY_HABITS,
  STORAGE_KEY_CHECKINS,
  STORAGE_KEY_REMINDERS,
  HABIT_ICONS,
  FREQUENCY_TYPES,
} from '../../habit-tracker/constants'
import {
  generateId,
  formatDate,
  getTodayKey,
  parseDate,
  addDays,
  getDaysInRange,
  getWeekMonday,
  getDaysInCurrentMonth,
  loadHabits,
  saveHabits,
  loadCheckins,
  saveCheckins,
  loadReminders,
  saveReminders,
  validateHabit,
  createHabit,
  archiveHabit,
  activateHabit,
  checkin,
  uncheckin,
  getCheckinCount,
  isCheckedIn,
  calculateStreak,
  calculateMaxStreak,
  getWeekTarget,
  getMonthTarget,
  calculateWeekCompletion,
  calculateMonthCompletion,
  calculateOverallCompletion,
  buildHeatmapGrid,
  getHeatmapColor,
  getProgressColor,
  getMilestones,
  getFrequencyLabel,
} from '../../habit-tracker/habitUtils'

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

const makeValidHabitData = (overrides = {}) => ({
  name: '跑步',
  description: '每天跑步30分钟',
  icon: '🏃',
  frequencyType: 'daily',
  frequencyCount: '',
  ...overrides,
})

const makeHabit = (overrides = {}) => ({
  id: 'hb_test1',
  name: '跑步',
  description: '',
  icon: '🏃',
  frequencyType: 'daily',
  frequencyCount: 1,
  archived: false,
  createdAt: Date.now(),
  ...overrides,
})

describe('generateId', () => {
  it('生成的ID以 hb_ 开头', () => {
    expect(generateId()).toMatch(/^hb_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatDate', () => {
  it('格式化日期为 YYYY-MM-DD', () => {
    expect(formatDate('2025-06-08')).toBe('2025-06-08')
  })

  it('接受时间戳', () => {
    const ts = new Date(2025, 5, 8).getTime()
    expect(formatDate(ts)).toBe('2025-06-08')
  })

  it('空值返回空字符串', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
  })
})

describe('parseDate', () => {
  it('解析 YYYY-MM-DD 为 Date 对象', () => {
    const d = parseDate('2025-06-08')
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(8)
  })
})

describe('addDays', () => {
  it('正数加天', () => {
    expect(addDays('2025-06-08', 1)).toBe('2025-06-09')
    expect(addDays('2025-06-08', 7)).toBe('2025-06-15')
  })

  it('负数减天', () => {
    expect(addDays('2025-06-08', -1)).toBe('2025-06-07')
  })

  it('0 返回同一天', () => {
    expect(addDays('2025-06-08', 0)).toBe('2025-06-08')
  })

  it('跨月', () => {
    expect(addDays('2025-06-30', 1)).toBe('2025-07-01')
    expect(addDays('2025-01-01', -1)).toBe('2024-12-31')
  })
})

describe('getDaysInRange', () => {
  it('返回日期范围内的所有日期', () => {
    const days = getDaysInRange('2025-06-01', '2025-06-03')
    expect(days).toEqual(['2025-06-01', '2025-06-02', '2025-06-03'])
  })

  it('起始等于结束返回一天', () => {
    expect(getDaysInRange('2025-06-01', '2025-06-01')).toEqual(['2025-06-01'])
  })
})

describe('getWeekMonday', () => {
  it('周一返回自身', () => {
    expect(getWeekMonday('2025-06-09')).toBe('2025-06-09')
  })

  it('周日返回上一个周一', () => {
    expect(getWeekMonday('2025-06-08')).toBe('2025-06-02')
  })

  it('周三返回所在周周一', () => {
    expect(getWeekMonday('2025-06-11')).toBe('2025-06-09')
  })
})

describe('getDaysInCurrentMonth', () => {
  it('返回当前月份的天数', () => {
    const days = getDaysInCurrentMonth()
    expect(days).toBeGreaterThanOrEqual(28)
    expect(days).toBeLessThanOrEqual(31)
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveHabits / loadHabits 正常读写', () => {
    const habits = [makeHabit()]
    saveHabits(habits)
    expect(loadHabits()).toEqual(habits)
  })

  it('loadHabits 空时返回空数组', () => {
    expect(loadHabits()).toEqual([])
  })

  it('loadHabits 数据损坏时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_HABITS, 'invalid')
    expect(loadHabits()).toEqual([])
  })

  it('loadHabits 非数组时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify({}))
    expect(loadHabits()).toEqual([])
  })

  it('saveCheckins / loadCheckins 正常读写', () => {
    const data = { hb_1: { '2025-06-08': 2 } }
    saveCheckins(data)
    expect(loadCheckins()).toEqual(data)
  })

  it('loadCheckins 空时返回空对象', () => {
    expect(loadCheckins()).toEqual({})
  })

  it('loadCheckins 数据损坏时返回空对象', () => {
    localStorage.setItem(STORAGE_KEY_CHECKINS, 'invalid')
    expect(loadCheckins()).toEqual({})
  })

  it('saveReminders / loadReminders 正常读写', () => {
    const data = { hb_1: { enabled: true, time: '08:00' } }
    saveReminders(data)
    expect(loadReminders()).toEqual(data)
  })

  it('loadReminders 空时返回空对象', () => {
    expect(loadReminders()).toEqual({})
  })
})

describe('validateHabit', () => {
  it('验证通过返回空对象', () => {
    const errors = validateHabit(makeValidHabitData())
    expect(Object.keys(errors).length).toBe(0)
  })

  it('名称为空时报错', () => {
    expect(validateHabit(makeValidHabitData({ name: '' })).name).toBeTruthy()
  })

  it('名称超过50字符报错', () => {
    expect(validateHabit(makeValidHabitData({ name: 'a'.repeat(51) })).name).toBeTruthy()
  })

  it('图标为空时报错', () => {
    expect(validateHabit(makeValidHabitData({ icon: '' })).icon).toBeTruthy()
  })

  it('频率类型为空时报错', () => {
    expect(validateHabit(makeValidHabitData({ frequencyType: '' })).frequencyType).toBeTruthy()
  })

  it('每周频率次数无效时报错', () => {
    expect(validateHabit(makeValidHabitData({ frequencyType: 'weekly', frequencyCount: '' })).frequencyCount).toBeTruthy()
    expect(validateHabit(makeValidHabitData({ frequencyType: 'weekly', frequencyCount: 0 })).frequencyCount).toBeTruthy()
    expect(validateHabit(makeValidHabitData({ frequencyType: 'weekly', frequencyCount: 8 })).frequencyCount).toBeTruthy()
  })

  it('每周频率次数有效时通过', () => {
    expect(validateHabit(makeValidHabitData({ frequencyType: 'weekly', frequencyCount: 3 })).frequencyCount).toBeFalsy()
  })

  it('每月频率天数无效时报错', () => {
    expect(validateHabit(makeValidHabitData({ frequencyType: 'monthly', frequencyCount: '' })).frequencyCount).toBeTruthy()
    expect(validateHabit(makeValidHabitData({ frequencyType: 'monthly', frequencyCount: 0 })).frequencyCount).toBeTruthy()
    expect(validateHabit(makeValidHabitData({ frequencyType: 'monthly', frequencyCount: 32 })).frequencyCount).toBeTruthy()
  })

  it('每月频率天数有效时通过', () => {
    expect(validateHabit(makeValidHabitData({ frequencyType: 'monthly', frequencyCount: 20 })).frequencyCount).toBeFalsy()
  })
})

describe('createHabit', () => {
  it('数据无效时返回失败', () => {
    const result = createHabit([], { name: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建每日习惯', () => {
    const result = createHabit([], makeValidHabitData())
    expect(result.success).toBe(true)
    expect(result.habit.name).toBe('跑步')
    expect(result.habit.frequencyType).toBe('daily')
    expect(result.habit.frequencyCount).toBe(1)
    expect(result.habit.archived).toBe(false)
    expect(result.habits.length).toBe(1)
  })

  it('成功创建每周习惯', () => {
    const result = createHabit([], makeValidHabitData({
      frequencyType: 'weekly',
      frequencyCount: '3',
    }))
    expect(result.success).toBe(true)
    expect(result.habit.frequencyCount).toBe(3)
  })

  it('新习惯添加到列表末尾', () => {
    const existing = [makeHabit({ id: 'old' })]
    const result = createHabit(existing, makeValidHabitData({ name: '读书' }))
    expect(result.habits.length).toBe(2)
    expect(result.habits[0].id).toBe('old')
  })
})

describe('archiveHabit / activateHabit', () => {
  it('归档习惯', () => {
    const habits = [makeHabit({ id: '1' }), makeHabit({ id: '2' })]
    const result = archiveHabit(habits, '1')
    expect(result[0].archived).toBe(true)
    expect(result[1].archived).toBe(false)
  })

  it('激活习惯', () => {
    const habits = [makeHabit({ id: '1', archived: true })]
    const result = activateHabit(habits, '1')
    expect(result[0].archived).toBe(false)
  })
})

describe('checkin / uncheckin', () => {
  it('首次打卡', () => {
    const result = checkin({}, 'hb_1', '2025-06-08')
    expect(result.hb_1['2025-06-08']).toBe(1)
  })

  it('同一天多次打卡递增', () => {
    let data = checkin({}, 'hb_1', '2025-06-08')
    data = checkin(data, 'hb_1', '2025-06-08')
    expect(data.hb_1['2025-06-08']).toBe(2)
  })

  it('撤销打卡减1', () => {
    let data = checkin({}, 'hb_1', '2025-06-08')
    data = checkin(data, 'hb_1', '2025-06-08')
    data = uncheckin(data, 'hb_1', '2025-06-08')
    expect(data.hb_1['2025-06-08']).toBe(1)
  })

  it('撤销打卡到0时删除记录', () => {
    let data = checkin({}, 'hb_1', '2025-06-08')
    data = uncheckin(data, 'hb_1', '2025-06-08')
    expect(data.hb_1['2025-06-08']).toBeUndefined()
  })

  it('不同习惯的打卡互不影响', () => {
    let data = checkin({}, 'hb_1', '2025-06-08')
    data = checkin(data, 'hb_2', '2025-06-08')
    expect(data.hb_1['2025-06-08']).toBe(1)
    expect(data.hb_2['2025-06-08']).toBe(1)
  })
})

describe('getCheckinCount / isCheckedIn', () => {
  const checkins = { hb_1: { '2025-06-08': 2, '2025-06-09': 0 } }

  it('获取打卡次数', () => {
    expect(getCheckinCount(checkins, 'hb_1', '2025-06-08')).toBe(2)
    expect(getCheckinCount(checkins, 'hb_1', '2025-06-10')).toBe(0)
    expect(getCheckinCount(checkins, 'hb_2', '2025-06-08')).toBe(0)
  })

  it('判断是否已打卡', () => {
    expect(isCheckedIn(checkins, 'hb_1', '2025-06-08')).toBe(true)
    expect(isCheckedIn(checkins, 'hb_1', '2025-06-10')).toBe(false)
  })
})

describe('calculateStreak', () => {
  const today = getTodayKey()
  const yesterday = addDays(today, -1)
  const dayBefore = addDays(today, -2)

  it('今天打卡，昨天也打卡时连续3天', () => {
    const checkins = {
      hb_1: { [today]: 1, [yesterday]: 1, [dayBefore]: 1 },
    }
    expect(calculateStreak(checkins, 'hb_1')).toBe(3)
  })

  it('今天未打卡，昨天打卡时连续从昨天算', () => {
    const checkins = {
      hb_1: { [yesterday]: 1, [dayBefore]: 1 },
    }
    expect(calculateStreak(checkins, 'hb_1')).toBe(2)
  })

  it('今天和昨天都未打卡时返回0', () => {
    const checkins = {
      hb_1: { [dayBefore]: 1 },
    }
    expect(calculateStreak(checkins, 'hb_1')).toBe(0)
  })

  it('无打卡记录时返回0', () => {
    expect(calculateStreak({}, 'hb_1')).toBe(0)
    expect(calculateStreak({ hb_1: {} }, 'hb_1')).toBe(0)
  })

  it('仅今天打卡时返回1', () => {
    const checkins = { hb_1: { [today]: 1 } }
    expect(calculateStreak(checkins, 'hb_1')).toBe(1)
  })
})

describe('calculateMaxStreak', () => {
  it('连续5天记录返回5', () => {
    const checkins = {
      hb_1: {
        '2025-06-01': 1, '2025-06-02': 1, '2025-06-03': 1,
        '2025-06-04': 1, '2025-06-05': 1,
      },
    }
    expect(calculateMaxStreak(checkins, 'hb_1')).toBe(5)
  })

  it('中间断开取最长连续', () => {
    const checkins = {
      hb_1: {
        '2025-06-01': 1, '2025-06-02': 1, '2025-06-03': 1,
        '2025-06-05': 1, '2025-06-06': 1, '2025-06-07': 1, '2025-06-08': 1,
      },
    }
    expect(calculateMaxStreak(checkins, 'hb_1')).toBe(4)
  })

  it('无记录返回0', () => {
    expect(calculateMaxStreak({}, 'hb_1')).toBe(0)
  })

  it('仅一天记录返回1', () => {
    const checkins = { hb_1: { '2025-06-01': 1 } }
    expect(calculateMaxStreak(checkins, 'hb_1')).toBe(1)
  })
})

describe('getWeekTarget / getMonthTarget', () => {
  it('每天：周目标7，月目标为当月天数', () => {
    expect(getWeekTarget('daily', 1)).toBe(7)
    expect(getMonthTarget('daily', 1)).toBe(getDaysInCurrentMonth())
  })

  it('每周X次：周目标X', () => {
    expect(getWeekTarget('weekly', 3)).toBe(3)
  })

  it('每月X天：月目标X', () => {
    expect(getMonthTarget('monthly', 20)).toBe(20)
  })
})

describe('calculateWeekCompletion', () => {
  it('本周打卡数据正确计算', () => {
    const today = getTodayKey()
    const checkins = { hb_1: { [today]: 1 } }
    const result = calculateWeekCompletion(checkins, 'hb_1', 'daily', 1)
    expect(result.completed).toBe(1)
    expect(result.target).toBe(7)
    expect(result.rate).toBeCloseTo((1 / 7) * 100)
  })

  it('无打卡时完成0', () => {
    const result = calculateWeekCompletion({}, 'hb_1', 'daily', 1)
    expect(result.completed).toBe(0)
  })
})

describe('calculateMonthCompletion', () => {
  it('本月打卡数据正确计算', () => {
    const today = getTodayKey()
    const yesterday = addDays(today, -1)
    const checkins = { hb_1: { [today]: 1, [yesterday]: 1 } }
    const result = calculateMonthCompletion(checkins, 'hb_1', 'daily', 1)
    expect(result.completed).toBe(2)
    expect(result.target).toBe(getDaysInCurrentMonth())
  })
})

describe('calculateOverallCompletion', () => {
  it('无活跃习惯时返回0', () => {
    expect(calculateOverallCompletion([], {})).toEqual({ rate: 0, completed: 0, target: 0 })
    expect(calculateOverallCompletion([makeHabit({ archived: true })], {})).toEqual({ rate: 0, completed: 0, target: 0 })
  })

  it('有活跃习惯时计算整体完成率', () => {
    const today = getTodayKey()
    const habits = [makeHabit({ id: 'hb_1' })]
    const checkins = { hb_1: { [today]: 1 } }
    const result = calculateOverallCompletion(habits, checkins)
    expect(result.completed).toBeGreaterThan(0)
    expect(result.target).toBeGreaterThan(0)
    expect(result.rate).toBeGreaterThan(0)
  })
})

describe('buildHeatmapGrid', () => {
  it('默认生成53-54周的网格', () => {
    const grid = buildHeatmapGrid({}, 'hb_1', 0)
    expect(grid.length).toBeGreaterThanOrEqual(53)
    expect(grid.length).toBeLessThanOrEqual(55)
  })

  it('每周7天', () => {
    const grid = buildHeatmapGrid({}, 'hb_1', 0)
    grid.forEach(week => {
      expect(week.length).toBe(7)
    })
  })

  it('打卡数据正确填充', () => {
    const recentDate = addDays(getTodayKey(), -10)
    const checkins = { hb_1: { [recentDate]: 3 } }
    const grid = buildHeatmapGrid(checkins, 'hb_1', 0)
    let found = false
    grid.forEach(week => {
      week.forEach(cell => {
        if (cell.date === recentDate) {
          expect(cell.count).toBe(3)
          found = true
        }
      })
    })
    expect(found).toBe(true)
  })

  it('年偏移量改变数据范围', () => {
    const grid0 = buildHeatmapGrid({}, 'hb_1', 0)
    const grid1 = buildHeatmapGrid({}, 'hb_1', 1)
    expect(grid0).not.toEqual(grid1)
  })
})

describe('getHeatmapColor', () => {
  it('0次返回灰色', () => {
    expect(getHeatmapColor(0)).toBe('#ebedf0')
  })

  it('1次返回浅绿', () => {
    expect(getHeatmapColor(1)).toBe('#9be9a8')
  })

  it('2次返回中绿', () => {
    expect(getHeatmapColor(2)).toBe('#40c463')
  })

  it('3次返回深绿', () => {
    expect(getHeatmapColor(3)).toBe('#30a14e')
  })

  it('4次以上返回最深绿', () => {
    expect(getHeatmapColor(4)).toBe('#216e39')
    expect(getHeatmapColor(10)).toBe('#216e39')
  })

  it('负数返回灰色', () => {
    expect(getHeatmapColor(-1)).toBe('#ebedf0')
  })
})

describe('getProgressColor', () => {
  it('0-60% 返回灰色', () => {
    expect(getProgressColor(0)).toBe('#9ca3af')
    expect(getProgressColor(50)).toBe('#9ca3af')
    expect(getProgressColor(59)).toBe('#9ca3af')
  })

  it('60-80% 返回蓝色', () => {
    expect(getProgressColor(60)).toBe('#3b82f6')
    expect(getProgressColor(70)).toBe('#3b82f6')
    expect(getProgressColor(79)).toBe('#3b82f6')
  })

  it('80-100% 返回绿色', () => {
    expect(getProgressColor(80)).toBe('#10b981')
    expect(getProgressColor(100)).toBe('#10b981')
  })

  it('超过100% 返回金色', () => {
    expect(getProgressColor(101)).toBe('#fbbf24')
  })
})

describe('getMilestones', () => {
  it('0天无里程碑', () => {
    expect(getMilestones(0)).toEqual([])
  })

  it('7天获得🌟', () => {
    const m = getMilestones(7)
    expect(m.length).toBe(1)
    expect(m[0].days).toBe(7)
    expect(m[0].icon).toBe('🌟')
  })

  it('30天获得🌟和💪', () => {
    const m = getMilestones(30)
    expect(m.length).toBe(2)
    expect(m[0].days).toBe(7)
    expect(m[1].days).toBe(30)
  })

  it('100天获得三个徽章', () => {
    const m = getMilestones(100)
    expect(m.length).toBe(3)
    expect(m[2].days).toBe(100)
    expect(m[2].icon).toBe('👑')
  })
})

describe('getFrequencyLabel', () => {
  it('每天', () => {
    expect(getFrequencyLabel('daily', 1)).toBe('每天')
  })

  it('每周X次', () => {
    expect(getFrequencyLabel('weekly', 3)).toBe('每周 3 次')
  })

  it('每月X天', () => {
    expect(getFrequencyLabel('monthly', 20)).toBe('每月 20 天')
  })
})

describe('constants verification', () => {
  it('HABIT_ICONS 包含正确的 emoji 列表', () => {
    expect(HABIT_ICONS).toContain('🏃')
    expect(HABIT_ICONS).toContain('📚')
    expect(HABIT_ICONS).toContain('💧')
    expect(HABIT_ICONS.length).toBe(9)
  })

  it('FREQUENCY_TYPES 包含三种频率', () => {
    expect(FREQUENCY_TYPES.length).toBe(3)
    const types = FREQUENCY_TYPES.map(f => f.type)
    expect(types).toContain('daily')
    expect(types).toContain('weekly')
    expect(types).toContain('monthly')
  })
})
