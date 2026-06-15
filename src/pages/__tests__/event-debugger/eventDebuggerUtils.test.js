import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  MOUSE_EVENT_TYPES,
  MOUSE_EVENT_COLORS,
  MOUSE_EVENT_LABELS,
  MOUSE_BUTTONS,
  MODIFIER_KEYS,
  MODIFIER_KEY_LABELS,
  MODIFIER_KEY_COLORS,
  generateId,
  formatTimestamp,
  createKeyEventRecord,
  createMouseEventRecord,
  filterKeyEvents,
  filterMouseEvents,
  renumberEvents,
  calculateFrequency,
  getMaxFrequency,
  exportToJson,
  throttle,
  getMouseButtonLabel,
  getActiveModifiers,
} from '@/pages/event-debugger/eventDebuggerUtils'

describe('常量定义', () => {
  it('MOUSE_EVENT_TYPES 包含所有鼠标事件类型', () => {
    expect(MOUSE_EVENT_TYPES).toEqual([
      'click',
      'dblclick',
      'mousedown',
      'mouseup',
      'mousemove',
      'contextmenu',
    ])
  })

  it('MOUSE_EVENT_COLORS 为每种事件类型定义颜色', () => {
    MOUSE_EVENT_TYPES.forEach((type) => {
      expect(MOUSE_EVENT_COLORS[type]).toBeDefined()
      expect(typeof MOUSE_EVENT_COLORS[type]).toBe('string')
      expect(MOUSE_EVENT_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  it('MOUSE_EVENT_LABELS 为每种事件类型定义标签', () => {
    MOUSE_EVENT_TYPES.forEach((type) => {
      expect(MOUSE_EVENT_LABELS[type]).toBeDefined()
      expect(typeof MOUSE_EVENT_LABELS[type]).toBe('string')
      expect(MOUSE_EVENT_LABELS[type].length).toBeGreaterThan(0)
    })
  })

  it('MOUSE_BUTTONS 定义三个鼠标按钮', () => {
    expect(MOUSE_BUTTONS[0]).toBe('左键')
    expect(MOUSE_BUTTONS[1]).toBe('中键')
    expect(MOUSE_BUTTONS[2]).toBe('右键')
  })

  it('MODIFIER_KEYS 包含四个修饰键', () => {
    expect(MODIFIER_KEYS).toEqual(['ctrl', 'shift', 'alt', 'meta'])
  })

  it('MODIFIER_KEY_COLORS 为每个修饰键定义颜色', () => {
    MODIFIER_KEYS.forEach((key) => {
      expect(MODIFIER_KEY_COLORS[key]).toBeDefined()
      expect(MODIFIER_KEY_COLORS[key]).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  it('MODIFIER_KEY_LABELS 为每个修饰键定义标签', () => {
    MODIFIER_KEYS.forEach((key) => {
      expect(MODIFIER_KEY_LABELS[key]).toBeDefined()
      expect(typeof MODIFIER_KEY_LABELS[key]).toBe('string')
      expect(MODIFIER_KEY_LABELS[key].length).toBeGreaterThan(0)
    })
  })
})

describe('generateId', () => {
  it('生成非空字符串 ID', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(id.startsWith('evt-')).toBe(true)
  })

  it('生成不重复的 ID', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatTimestamp', () => {
  it('格式化时间戳为 HH:mm:ss.SSS 格式', () => {
    const date = new Date('2024-01-15T09:30:45.123')
    const result = formatTimestamp(date.getTime())
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)
    expect(result).toContain('09:30:45')
    expect(result).toContain('.123')
  })

  it('null 或 undefined 返回空字符串', () => {
    expect(formatTimestamp(null)).toBe('')
    expect(formatTimestamp(undefined)).toBe('')
  })

  it('无效时间戳返回空字符串', () => {
    expect(formatTimestamp('invalid')).toBe('')
    expect(formatTimestamp(NaN)).toBe('')
  })

  it('毫秒部分补零到三位', () => {
    const date = new Date('2024-01-15T09:30:45.005')
    const result = formatTimestamp(date.getTime())
    expect(result).toContain('.005')
  })

  it('秒、分、时部分补零', () => {
    const date = new Date('2024-01-15T05:03:02.001')
    const result = formatTimestamp(date.getTime())
    expect(result).toContain('05:03:02')
    expect(result).toContain('.001')
  })

  it('0 时间戳返回格式化结果', () => {
    const result = formatTimestamp(0)
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)
  })
})

describe('createKeyEventRecord', () => {
  it('创建按键事件记录', () => {
    const mockEvent = {
      key: 'a',
      keyCode: 65,
      code: 'KeyA',
      ctrlKey: false,
      shiftKey: true,
      altKey: false,
      metaKey: false,
      repeat: false,
      timestamp: 1234567890,
    }

    const record = createKeyEventRecord(mockEvent, 1)

    expect(record.id).toBeTruthy()
    expect(record.type).toBe('key')
    expect(record.sequence).toBe(1)
    expect(record.key).toBe('a')
    expect(record.keyCode).toBe(65)
    expect(record.code).toBe('KeyA')
    expect(record.ctrlKey).toBe(false)
    expect(record.shiftKey).toBe(true)
    expect(record.altKey).toBe(false)
    expect(record.metaKey).toBe(false)
    expect(record.repeat).toBe(false)
    expect(record.timestamp).toBe(1234567890)
  })

  it('缺失字段有默认值', () => {
    const record = createKeyEventRecord({}, 1)
    expect(record.key).toBe('')
    expect(record.keyCode).toBe(0)
    expect(record.code).toBe('')
    expect(record.ctrlKey).toBe(false)
    expect(record.shiftKey).toBe(false)
    expect(record.altKey).toBe(false)
    expect(record.metaKey).toBe(false)
  })

  it('记录 type 始终为 key', () => {
    const record = createKeyEventRecord({ type: 'keydown' }, 1)
    expect(record.type).toBe('key')
  })

  it('修饰键布尔值强制转换', () => {
    const record = createKeyEventRecord(
      { ctrlKey: 'true', shiftKey: 0, altKey: null, metaKey: undefined },
      1
    )
    expect(record.ctrlKey).toBe(true)
    expect(record.shiftKey).toBe(false)
    expect(record.altKey).toBe(false)
    expect(record.metaKey).toBe(false)
  })

  it('没有 timestamp 时使用当前时间', () => {
    const before = Date.now()
    const record = createKeyEventRecord({ key: 'a' }, 1)
    const after = Date.now()
    expect(record.timestamp).toBeGreaterThanOrEqual(before)
    expect(record.timestamp).toBeLessThanOrEqual(after)
  })
})

describe('createMouseEventRecord', () => {
  it('创建鼠标事件记录', () => {
    const mockEvent = {
      type: 'click',
      button: 0,
      buttons: 1,
      clientX: 100,
      clientY: 200,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      timestamp: 1234567890,
    }

    const record = createMouseEventRecord(mockEvent, 1, 50, 80)

    expect(record.id).toBeTruthy()
    expect(record.type).toBe('mouse')
    expect(record.sequence).toBe(1)
    expect(record.eventType).toBe('click')
    expect(record.button).toBe(0)
    expect(record.buttons).toBe(1)
    expect(record.x).toBe(50)
    expect(record.y).toBe(80)
    expect(record.ctrlKey).toBe(true)
    expect(record.shiftKey).toBe(false)
    expect(record.timestamp).toBe(1234567890)
  })

  it('使用 clientX/Y 作为默认坐标', () => {
    const mockEvent = {
      type: 'mousemove',
      button: -1,
      clientX: 100,
      clientY: 200,
    }

    const record = createMouseEventRecord(mockEvent, 1)
    expect(record.x).toBe(100)
    expect(record.y).toBe(200)
  })

  it('缺失字段有默认值', () => {
    const record = createMouseEventRecord({}, 1)
    expect(record.eventType).toBe('')
    expect(record.button).toBe(-1)
    expect(record.buttons).toBe(0)
    expect(record.x).toBe(0)
    expect(record.y).toBe(0)
  })

  it('记录 type 始终为 mouse', () => {
    const record = createMouseEventRecord({ type: 'click' }, 1)
    expect(record.type).toBe('mouse')
  })

  it('修饰键布尔值强制转换', () => {
    const record = createMouseEventRecord(
      { ctrlKey: 'true', shiftKey: 0, altKey: null, metaKey: undefined },
      1
    )
    expect(record.ctrlKey).toBe(true)
    expect(record.shiftKey).toBe(false)
    expect(record.altKey).toBe(false)
    expect(record.metaKey).toBe(false)
  })
})

describe('filterKeyEvents', () => {
  function makeKeyEvent(overrides = {}) {
    return {
      id: generateId(),
      type: 'key',
      sequence: 1,
      key: 'a',
      keyCode: 65,
      code: 'KeyA',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      repeat: false,
      timestamp: Date.now(),
      ...overrides,
    }
  }

  it('空数组或非数组返回空数组', () => {
    expect(filterKeyEvents([], {})).toEqual([])
    expect(filterKeyEvents(null, {})).toEqual([])
    expect(filterKeyEvents(undefined, {})).toEqual([])
  })

  it('只返回 type 为 key 的事件', () => {
    const events = [
      makeKeyEvent({ key: 'a' }),
      { id: '1', type: 'mouse', eventType: 'click' },
      makeKeyEvent({ key: 'b' }),
    ]
    const result = filterKeyEvents(events, {})
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.type === 'key')).toBe(true)
  })

  it('按键名过滤', () => {
    const events = [
      makeKeyEvent({ key: 'a' }),
      makeKeyEvent({ key: 'b' }),
      makeKeyEvent({ key: 'A' }),
    ]
    const result = filterKeyEvents(events, { keyFilter: 'a' })
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.key.toLowerCase() === 'a')).toBe(true)
  })

  it('按单个修饰键过滤', () => {
    const events = [
      makeKeyEvent({ key: 'a', ctrlKey: true }),
      makeKeyEvent({ key: 'b', ctrlKey: false }),
      makeKeyEvent({ key: 'c', ctrlKey: true, shiftKey: true }),
    ]
    const result = filterKeyEvents(events, { modifiers: ['ctrl'] })
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.ctrlKey)).toBe(true)
  })

  it('按多个修饰键过滤（同时按下）', () => {
    const events = [
      makeKeyEvent({ key: 'a', ctrlKey: true }),
      makeKeyEvent({ key: 'b', ctrlKey: true, shiftKey: true }),
      makeKeyEvent({ key: 'c', shiftKey: true }),
    ]
    const result = filterKeyEvents(events, { modifiers: ['ctrl', 'shift'] })
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('b')
  })

  it('按关键字搜索', () => {
    const events = [
      makeKeyEvent({ key: 'Enter', keyCode: 13, code: 'Enter' }),
      makeKeyEvent({ key: 'a', keyCode: 65, code: 'KeyA' }),
      makeKeyEvent({ key: 'ArrowUp', keyCode: 38, code: 'ArrowUp' }),
    ]
    const result = filterKeyEvents(events, { keyword: 'Arrow' })
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('ArrowUp')
  })

  it('组合多个过滤条件', () => {
    const events = [
      makeKeyEvent({ key: 'a', ctrlKey: true }),
      makeKeyEvent({ key: 'b', ctrlKey: true }),
      makeKeyEvent({ key: 'a', ctrlKey: false }),
    ]
    const result = filterKeyEvents(events, { keyFilter: 'a', modifiers: ['ctrl'] })
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('a')
    expect(result[0].ctrlKey).toBe(true)
  })

  it('空过滤条件返回所有按键事件', () => {
    const events = [makeKeyEvent({ key: 'a' }), makeKeyEvent({ key: 'b' })]
    const result = filterKeyEvents(events, {})
    expect(result).toHaveLength(2)
  })
})

describe('filterMouseEvents', () => {
  function makeMouseEvent(overrides = {}) {
    return {
      id: generateId(),
      type: 'mouse',
      sequence: 1,
      eventType: 'click',
      button: 0,
      x: 100,
      y: 200,
      timestamp: Date.now(),
      ...overrides,
    }
  }

  it('空数组或非数组返回空数组', () => {
    expect(filterMouseEvents([], {})).toEqual([])
    expect(filterMouseEvents(null, {})).toEqual([])
  })

  it('只返回 type 为 mouse 的事件', () => {
    const events = [
      makeMouseEvent({ eventType: 'click' }),
      { id: '1', type: 'key', key: 'a' },
      makeMouseEvent({ eventType: 'mousemove' }),
    ]
    const result = filterMouseEvents(events, {})
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.type === 'mouse')).toBe(true)
  })

  it('按事件类型过滤（单个）', () => {
    const events = [
      makeMouseEvent({ eventType: 'click' }),
      makeMouseEvent({ eventType: 'mousemove' }),
      makeMouseEvent({ eventType: 'click' }),
    ]
    const result = filterMouseEvents(events, { eventTypes: ['click'] })
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.eventType === 'click')).toBe(true)
  })

  it('按事件类型过滤（多个）', () => {
    const events = [
      makeMouseEvent({ eventType: 'click' }),
      makeMouseEvent({ eventType: 'dblclick' }),
      makeMouseEvent({ eventType: 'mousemove' }),
      makeMouseEvent({ eventType: 'mousedown' }),
    ]
    const result = filterMouseEvents(events, { eventTypes: ['click', 'dblclick'] })
    expect(result).toHaveLength(2)
  })

  it('按关键字搜索', () => {
    const events = [
      makeMouseEvent({ eventType: 'click', x: 50, y: 100, button: 0 }),
      makeMouseEvent({ eventType: 'contextmenu', x: 200, y: 300, button: 2 }),
    ]
    const result = filterMouseEvents(events, { keyword: '右键' })
    expect(result).toHaveLength(1)
    expect(result[0].eventType).toBe('contextmenu')
  })

  it('按坐标搜索', () => {
    const events = [
      makeMouseEvent({ eventType: 'click', x: 50, y: 100 }),
      makeMouseEvent({ eventType: 'click', x: 200, y: 300 }),
    ]
    const result = filterMouseEvents(events, { keyword: 'X:50' })
    expect(result).toHaveLength(1)
    expect(result[0].x).toBe(50)
  })

  it('空事件类型数组返回所有鼠标事件', () => {
    const events = [
      makeMouseEvent({ eventType: 'click' }),
      makeMouseEvent({ eventType: 'mousemove' }),
    ]
    const result = filterMouseEvents(events, { eventTypes: [] })
    expect(result).toHaveLength(2)
  })
})

describe('renumberEvents', () => {
  it('重新编号事件序列', () => {
    const events = [
      { id: '1', sequence: 10, type: 'key' },
      { id: '2', sequence: 5, type: 'key' },
      { id: '3', sequence: 1, type: 'key' },
    ]
    const result = renumberEvents(events)
    expect(result[0].sequence).toBe(1)
    expect(result[1].sequence).toBe(2)
    expect(result[2].sequence).toBe(3)
  })

  it('空数组返回空数组', () => {
    expect(renumberEvents([])).toEqual([])
    expect(renumberEvents(null)).toEqual([])
    expect(renumberEvents(undefined)).toEqual([])
  })

  it('不修改原始事件的其他属性', () => {
    const events = [{ id: 'test1', sequence: 5, key: 'a', type: 'key' }]
    const result = renumberEvents(events)
    expect(result[0].id).toBe('test1')
    expect(result[0].key).toBe('a')
    expect(result[0].sequence).toBe(1)
  })
})

describe('calculateFrequency', () => {
  it('空事件返回全零数组', () => {
    const result = calculateFrequency([], 10)
    expect(result).toHaveLength(10)
    expect(result.every((v) => v === 0)).toBe(true)
  })

  it('非数组返回全零数组', () => {
    const result = calculateFrequency(null, 5)
    expect(result).toHaveLength(5)
    expect(result.every((v) => v === 0)).toBe(true)
  })

  it('统计每秒事件数量', () => {
    const now = 100000
    const events = [
      { timestamp: now - 500 },
      { timestamp: now - 1500 },
      { timestamp: now - 1500 },
      { timestamp: now - 2500 },
    ]
    const result = calculateFrequency(events, 5, now)
    expect(result[result.length - 1]).toBe(1)
    expect(result[result.length - 2]).toBe(2)
    expect(result[result.length - 3]).toBe(1)
  })

  it('窗口外的事件不统计', () => {
    const now = 100000
    const events = [
      { timestamp: now - 5000 },
      { timestamp: now - 500 },
    ]
    const result = calculateFrequency(events, 3, now)
    expect(result[result.length - 1]).toBe(1)
    expect(result.reduce((a, b) => a + b, 0)).toBe(1)
  })

  it('默认窗口为 30 秒', () => {
    const result = calculateFrequency([])
    expect(result).toHaveLength(30)
  })

  it('事件正好在窗口边界上的处理', () => {
    const now = 100000
    const events = [
      { timestamp: now - 30000 + 1 },
      { timestamp: now - 30000 },
      { timestamp: now - 29999 },
    ]
    const result = calculateFrequency(events, 30, now)
    expect(result[0]).toBe(3)
  })

  it('事件时间晚于 now 不统计', () => {
    const now = 100000
    const events = [
      { timestamp: now - 500 },
      { timestamp: now + 500 },
    ]
    const result = calculateFrequency(events, 5, now)
    expect(result.reduce((a, b) => a + b, 0)).toBe(1)
  })

  it('多事件分布在不同秒', () => {
    const now = 100000
    const events = []
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < i + 1; j++) {
        events.push({ timestamp: now - i * 1000 - 500 })
      }
    }
    const result = calculateFrequency(events, 10, now)
    expect(result[9]).toBe(1)
    expect(result[8]).toBe(2)
    expect(result[0]).toBe(10)
  })
})

describe('getMaxFrequency', () => {
  it('返回最大值并向上取整到 10 的倍数', () => {
    expect(getMaxFrequency([5, 12, 8])).toBe(20)
    expect(getMaxFrequency([15, 20, 3])).toBe(20)
    expect(getMaxFrequency([100])).toBe(100)
    expect(getMaxFrequency([7])).toBe(10)
  })

  it('全零或空数组返回 10', () => {
    expect(getMaxFrequency([0, 0, 0])).toBe(10)
    expect(getMaxFrequency([])).toBe(0)
  })

  it('非数组返回 0', () => {
    expect(getMaxFrequency(null)).toBe(0)
    expect(getMaxFrequency(undefined)).toBe(0)
  })
})

describe('exportToJson', () => {
  it('导出为 JSON 字符串', () => {
    const events = [
      { id: '1', type: 'key', key: 'a' },
      { id: '2', type: 'mouse', eventType: 'click' },
    ]
    const json = exportToJson(events)
    const parsed = JSON.parse(json)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].key).toBe('a')
    expect(parsed[1].eventType).toBe('click')
  })

  it('空数组返回空数组 JSON', () => {
    expect(exportToJson([])).toBe('[]')
  })

  it('非数组返回空数组 JSON', () => {
    expect(exportToJson(null)).toBe('[]')
    expect(exportToJson(undefined)).toBe('[]')
  })

  it('返回格式化的 JSON（有缩进）', () => {
    const events = [{ id: '1', key: 'a' }]
    const json = exportToJson(events)
    expect(json).toContain('\n')
    expect(json).toContain('  ')
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('延迟时间内只执行一次', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled()
    throttled()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('延迟过后可以再次执行', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(150)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('返回最后一次执行结果', () => {
    const fn = vi.fn((x) => x * 2)
    const throttled = throttle(fn, 100)

    const result1 = throttled(5)
    const result2 = throttled(10)

    expect(result1).toBe(10)
    expect(result2).toBe(10)
  })

  it('延迟期内多次调用不重置延迟计时器', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(50)
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(49)
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(2)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('this 上下文正确', () => {
    const context = { value: 42 }
    function fn() {
      return this.value
    }
    const throttled = throttle(fn, 100)

    const result = throttled.call(context)
    expect(result).toBe(42)
  })

  it('参数正确传递', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a', 'b', 'c')
    expect(fn).toHaveBeenCalledWith('a', 'b', 'c')
  })
})

describe('getMouseButtonLabel', () => {
  it('返回正确的按钮标签', () => {
    expect(getMouseButtonLabel(0)).toBe('左键')
    expect(getMouseButtonLabel(1)).toBe('中键')
    expect(getMouseButtonLabel(2)).toBe('右键')
  })

  it('未知按钮返回默认值', () => {
    expect(getMouseButtonLabel(99)).toBe('未知')
    expect(getMouseButtonLabel(-1)).toBe('未知')
  })
})

describe('getActiveModifiers', () => {
  it('返回所有按下的修饰键', () => {
    const event = {
      ctrlKey: true,
      shiftKey: true,
      altKey: false,
      metaKey: false,
    }
    const result = getActiveModifiers(event)
    expect(result).toEqual(['ctrl', 'shift'])
  })

  it('没有修饰键按下返回空数组', () => {
    const event = {
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    }
    expect(getActiveModifiers(event)).toEqual([])
  })

  it('所有修饰键都按下', () => {
    const event = {
      ctrlKey: true,
      shiftKey: true,
      altKey: true,
      metaKey: true,
    }
    const result = getActiveModifiers(event)
    expect(result).toHaveLength(4)
    expect(result).toContain('ctrl')
    expect(result).toContain('shift')
    expect(result).toContain('alt')
    expect(result).toContain('meta')
  })

  it('返回数组顺序为 ctrl, shift, alt, meta', () => {
    const event = {
      metaKey: true,
      altKey: true,
      shiftKey: true,
      ctrlKey: true,
    }
    const result = getActiveModifiers(event)
    expect(result).toEqual(['ctrl', 'shift', 'alt', 'meta'])
  })
})
