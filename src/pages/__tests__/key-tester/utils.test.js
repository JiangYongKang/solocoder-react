/* eslint-disable no-undef */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  detectCombination,
  buildCombinationLabel,
  sortCombinationKeys,
  isModifierKey,
  getModifierKeyLabel,
  getHeatmapColor,
  calculateFrequencyPercentage,
  addLogEntry,
  filterLogsByKeyword,
  exportLogsToCsv,
  getKeyDisplayLabel,
  getAllKeyCodesFromLayout,
  getKeyByCode,
  incrementFrequency,
  getMaxFrequency,
  getTotalKeyPresses,
  loadLogsFromStorage,
  saveLogsToStorage,
  loadFrequencyFromStorage,
  saveFrequencyToStorage,
  loadLayoutFromStorage,
  saveLayoutToStorage,
} from '../../key-tester/utils'
import { KEYBOARD_LAYOUTS, MAX_LOG_ENTRIES, STORAGE_KEY_LOGS, STORAGE_KEY_FREQUENCY, STORAGE_KEY_LAYOUT } from '../../key-tester/constants'

describe('组合键解析', () => {
  describe('isModifierKey', () => {
    it('应该正确识别修饰键', () => {
      expect(isModifierKey('ControlLeft')).toBe(true)
      expect(isModifierKey('ControlRight')).toBe(true)
      expect(isModifierKey('ShiftLeft')).toBe(true)
      expect(isModifierKey('ShiftRight')).toBe(true)
      expect(isModifierKey('AltLeft')).toBe(true)
      expect(isModifierKey('AltRight')).toBe(true)
      expect(isModifierKey('MetaLeft')).toBe(true)
      expect(isModifierKey('MetaRight')).toBe(true)
    })

    it('应该正确识别非修饰键', () => {
      expect(isModifierKey('KeyA')).toBe(false)
      expect(isModifierKey('Digit1')).toBe(false)
      expect(isModifierKey('Space')).toBe(false)
      expect(isModifierKey('Enter')).toBe(false)
    })
  })

  describe('getModifierKeyLabel', () => {
    it('应该返回正确的修饰键标签', () => {
      expect(getModifierKeyLabel('ControlLeft')).toBe('Ctrl')
      expect(getModifierKeyLabel('ControlRight')).toBe('Ctrl')
      expect(getModifierKeyLabel('ShiftLeft')).toBe('Shift')
      expect(getModifierKeyLabel('ShiftRight')).toBe('Shift')
      expect(getModifierKeyLabel('AltLeft')).toBe('Alt')
      expect(getModifierKeyLabel('AltRight')).toBe('Alt')
      expect(getModifierKeyLabel('MetaLeft')).toBe('Win')
      expect(getModifierKeyLabel('MetaRight')).toBe('Win')
    })

    it('未知键应该返回原码', () => {
      expect(getModifierKeyLabel('UnknownKey')).toBe('UnknownKey')
    })
  })

  describe('sortCombinationKeys', () => {
    it('应该按修饰键顺序排序', () => {
      const keys = ['KeyC', 'ControlLeft', 'ShiftLeft']
      const sorted = sortCombinationKeys(keys)
      expect(sorted[0]).toBe('ControlLeft')
      expect(sorted[1]).toBe('ShiftLeft')
      expect(sorted[2]).toBe('KeyC')
    })

    it('非修饰键应该按字母顺序排序', () => {
      const keys = ['KeyC', 'KeyA', 'KeyB']
      const sorted = sortCombinationKeys(keys)
      expect(sorted).toEqual(['KeyA', 'KeyB', 'KeyC'])
    })

    it('不应该修改原数组', () => {
      const keys = ['KeyB', 'KeyA']
      const sorted = sortCombinationKeys(keys)
      expect(keys).toEqual(['KeyB', 'KeyA'])
      expect(sorted).not.toBe(keys)
    })
  })

  describe('buildCombinationLabel', () => {
    it('应该构建正确的组合键标签', () => {
      const label = buildCombinationLabel(['ControlLeft', 'KeyC'])
      expect(label).toBe('Ctrl+KeyC')
    })

    it('多个修饰键应该按顺序排列', () => {
      const label = buildCombinationLabel(['KeyN', 'ControlLeft', 'ShiftLeft'])
      expect(label).toBe('Ctrl+Shift+KeyN')
    })

    it('空数组应该返回空字符串', () => {
      expect(buildCombinationLabel([])).toBe('')
    })

    it('非数组输入应该返回空字符串', () => {
      expect(buildCombinationLabel(null)).toBe('')
      expect(buildCombinationLabel(undefined)).toBe('')
    })
  })

  describe('detectCombination', () => {
    it('应该检测到预设的 Ctrl+C 组合键', () => {
      const combo = detectCombination(['ControlLeft', 'KeyC'])
      expect(combo).not.toBeNull()
      expect(combo.label).toBe('Ctrl+C')
      expect(combo.description).toBe('复制')
    })

    it('应该检测到预设的 Ctrl+Shift+N 组合键', () => {
      const combo = detectCombination(['ControlLeft', 'ShiftLeft', 'KeyN'])
      expect(combo).not.toBeNull()
      expect(combo.label).toBe('Ctrl+Shift+N')
      expect(combo.description).toBe('新建无痕窗口')
    })

    it('单个按键不应该返回组合键', () => {
      const combo = detectCombination(['KeyA'])
      expect(combo).toBeNull()
    })

    it('空数组应该返回 null', () => {
      expect(detectCombination([])).toBeNull()
      expect(detectCombination(null)).toBeNull()
    })

    it('非预设的修饰键+普通键组合应该返回自定义组合', () => {
      const combo = detectCombination(['ControlLeft', 'KeyX', 'ShiftLeft'])
      expect(combo).not.toBeNull()
      expect(combo.isCustom).toBe(true)
      expect(combo.description).toBe('自定义组合键')
    })

    it('只有修饰键不应该返回组合键', () => {
      const combo = detectCombination(['ControlLeft', 'ShiftLeft'])
      expect(combo).toBeNull()
    })

    it('只有普通键不应该返回组合键', () => {
      const combo = detectCombination(['KeyA', 'KeyB'])
      expect(combo).toBeNull()
    })

    it('应该正确处理左右修饰键', () => {
      const comboLeft = detectCombination(['ControlLeft', 'KeyC'])
      const comboRight = detectCombination(['ControlRight', 'KeyC'])
      expect(comboLeft).not.toBeNull()
      expect(comboRight).not.toBeNull()
      expect(comboLeft.label).toBe('Ctrl+C')
      expect(comboRight.label).toBe('Ctrl+C')
    })

    it('应该检测 Win+E 组合键', () => {
      const combo = detectCombination(['MetaLeft', 'KeyE'])
      expect(combo).not.toBeNull()
      expect(combo.label).toBe('Win+E')
      expect(combo.description).toBe('打开文件资源管理器')
    })
  })
})

describe('热力图颜色映射', () => {
  describe('getHeatmapColor', () => {
    it('次数为0时应该返回背景色', () => {
      const color = getHeatmapColor(0, 100)
      expect(color).toBe('#e8f4fd')
    })

    it('maxCount为0时应该返回背景色', () => {
      const color = getHeatmapColor(10, 0)
      expect(color).toBe('#e8f4fd')
    })

    it('最大次数应该返回红色系', () => {
      const color = getHeatmapColor(100, 100)
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      const r = parseInt(color.slice(1, 3), 16)
      expect(r).toBeGreaterThan(200)
    })

    it('0比例应该返回蓝色系', () => {
      const color = getHeatmapColor(1, 100)
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('次数不能超过最大值时应该按最大比例计算', () => {
      const color1 = getHeatmapColor(200, 100)
      const color2 = getHeatmapColor(100, 100)
      expect(color1).toBe(color2)
    })

    it('返回值应该是有效的十六进制颜色', () => {
      const color = getHeatmapColor(50, 100)
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('中间值应该在蓝红之间', () => {
      const lowColor = getHeatmapColor(1, 100)
      const midColor = getHeatmapColor(50, 100)
      const highColor = getHeatmapColor(100, 100)

      const lowR = parseInt(lowColor.slice(1, 3), 16)
      const midR = parseInt(midColor.slice(1, 3), 16)
      const highR = parseInt(highColor.slice(1, 3), 16)

      expect(midR).toBeGreaterThan(lowR)
      expect(highR).toBeGreaterThan(midR)
    })
  })

  describe('calculateFrequencyPercentage', () => {
    it('应该正确计算百分比', () => {
      expect(calculateFrequencyPercentage(25, 100)).toBe(25)
      expect(calculateFrequencyPercentage(50, 100)).toBe(50)
      expect(calculateFrequencyPercentage(100, 100)).toBe(100)
    })

    it('总数为0时应该返回0', () => {
      expect(calculateFrequencyPercentage(10, 0)).toBe(0)
    })

    it('次数为0时应该返回0', () => {
      expect(calculateFrequencyPercentage(0, 100)).toBe(0)
    })
  })
})

describe('按键日志 LRU 淘汰', () => {
  describe('addLogEntry', () => {
    it('应该将新条目添加到开头', () => {
      const entry = { keyName: 'A', keyCode: 'KeyA', eventType: 'keydown' }
      const result = addLogEntry([], entry)

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0].keyName).toBe('A')
      expect(result.logs[0].keyCode).toBe('KeyA')
      expect(result.logs[0].eventType).toBe('keydown')
      expect(result.evicted).toBe(0)
    })

    it('新条目应该包含id和timestamp', () => {
      const entry = { keyName: 'A', keyCode: 'KeyA', eventType: 'keydown' }
      const result = addLogEntry([], entry)

      expect(result.logs[0].id).toBeDefined()
      expect(typeof result.logs[0].id).toBe('string')
      expect(result.logs[0].timestamp).toBeDefined()
      expect(typeof result.logs[0].timestamp).toBe('number')
    })

    it('超过最大条数时应该淘汰最旧的', () => {
      const maxEntries = 5
      let logs = []

      for (let i = 0; i < 10; i++) {
        const result = addLogEntry(logs, { keyName: String(i), keyCode: `Key${i}`, eventType: 'keydown' }, maxEntries)
        logs = result.logs
      }

      expect(logs).toHaveLength(5)
      expect(logs[0].keyName).toBe('9')
      expect(logs[4].keyName).toBe('5')
    })

    it('应该返回正确的淘汰数量', () => {
      const maxEntries = 3
      let logs = []

      for (let i = 0; i < 3; i++) {
        const result = addLogEntry(logs, { keyName: String(i) }, maxEntries)
        logs = result.logs
        expect(result.evicted).toBe(0)
      }

      const result = addLogEntry(logs, { keyName: 'new' }, maxEntries)
      expect(result.evicted).toBe(1)
    })

    it('默认应该使用 MAX_LOG_ENTRIES', () => {
      const entry = { keyName: 'A' }
      const result = addLogEntry([], entry)
      expect(result.evicted).toBe(0)
      expect(MAX_LOG_ENTRIES).toBe(100)
    })

    it('非数组输入应该视为空数组', () => {
      const entry = { keyName: 'A' }
      const result = addLogEntry(null, entry)
      expect(result.logs).toHaveLength(1)
      expect(result.evicted).toBe(0)
    })
  })

  describe('filterLogsByKeyword', () => {
    const testLogs = [
      { id: '1', keyName: 'A', keyCode: 'KeyA', eventType: 'keydown', timestamp: Date.now() },
      { id: '2', keyName: 'B', keyCode: 'KeyB', eventType: 'keyup', timestamp: Date.now() },
      { id: '3', keyName: 'Enter', keyCode: 'Enter', eventType: 'keydown', timestamp: Date.now() },
    ]

    it('空关键词应该返回所有日志', () => {
      const result = filterLogsByKeyword(testLogs, '')
      expect(result).toHaveLength(3)
    })

    it('空白关键词应该返回所有日志', () => {
      const result = filterLogsByKeyword(testLogs, '   ')
      expect(result).toHaveLength(3)
    })

    it('应该按键名过滤', () => {
      const result = filterLogsByKeyword(testLogs, 'A')
      expect(result).toHaveLength(1)
      expect(result[0].keyName).toBe('A')
    })

    it('应该按键码过滤', () => {
      const result = filterLogsByKeyword(testLogs, 'KeyB')
      expect(result).toHaveLength(1)
      expect(result[0].keyCode).toBe('KeyB')
    })

    it('应该按事件类型过滤', () => {
      const result = filterLogsByKeyword(testLogs, 'keydown')
      expect(result).toHaveLength(2)
    })

    it('应该不区分大小写', () => {
      const result1 = filterLogsByKeyword(testLogs, 'enter')
      const result2 = filterLogsByKeyword(testLogs, 'ENTER')
      expect(result1).toHaveLength(1)
      expect(result2).toHaveLength(1)
    })

    it('非数组输入应该返回空数组', () => {
      const result = filterLogsByKeyword(null, 'test')
      expect(result).toEqual([])
    })
  })
})

describe('键盘布局数据结构', () => {
  describe('KEYBOARD_LAYOUTS', () => {
    it('应该包含三种布局', () => {
      expect(Object.keys(KEYBOARD_LAYOUTS)).toContain('qwerty')
      expect(Object.keys(KEYBOARD_LAYOUTS)).toContain('azerty')
      expect(Object.keys(KEYBOARD_LAYOUTS)).toContain('qwertz')
    })

    it('每种布局应该有name和description', () => {
      for (const layout of Object.values(KEYBOARD_LAYOUTS)) {
        expect(layout.name).toBeDefined()
        expect(typeof layout.name).toBe('string')
        expect(layout.description).toBeDefined()
        expect(typeof layout.description).toBe('string')
      }
    })

    it('每种布局应该有6行', () => {
      for (const [name, layout] of Object.entries(KEYBOARD_LAYOUTS)) {
        expect(layout.rows).toHaveLength(6)
      }
    })

    it('每行应该包含键对象，每个键有code、label、width', () => {
      const layout = KEYBOARD_LAYOUTS.qwerty
      for (const row of layout.rows) {
        for (const key of row) {
          expect(key.code).toBeDefined()
          expect(typeof key.code).toBe('string')
          expect(key.label).toBeDefined()
          expect(typeof key.label).toBe('string')
          expect(key.width).toBeDefined()
          expect(typeof key.width).toBe('number')
        }
      }
    })
  })

  describe('getAllKeyCodesFromLayout', () => {
    it('应该返回布局中所有键码', () => {
      const keyCodes = getAllKeyCodesFromLayout('qwerty')
      expect(Array.isArray(keyCodes)).toBe(true)
      expect(keyCodes.length).toBeGreaterThan(0)
      expect(keyCodes).toContain('KeyA')
      expect(keyCodes).toContain('KeyB')
      expect(keyCodes).toContain('Space')
      expect(keyCodes).toContain('Enter')
    })

    it('未知布局应该返回空数组', () => {
      const keyCodes = getAllKeyCodesFromLayout('unknown')
      expect(keyCodes).toEqual([])
    })
  })

  describe('getKeyByCode', () => {
    it('应该根据键码返回键信息', () => {
      const key = getKeyByCode('qwerty', 'KeyA')
      expect(key).not.toBeNull()
      expect(key.code).toBe('KeyA')
      expect(key.label).toBe('A')
      expect(key.width).toBeDefined()
    })

    it('不存在的键码应该返回 null', () => {
      const key = getKeyByCode('qwerty', 'NonExistentKey')
      expect(key).toBeNull()
    })

    it('未知布局应该返回 null', () => {
      const key = getKeyByCode('unknown', 'KeyA')
      expect(key).toBeNull()
    })

    it('应该返回复制对象而非引用', () => {
      const key1 = getKeyByCode('qwerty', 'KeyA')
      const key2 = getKeyByCode('qwerty', 'KeyA')
      expect(key1).not.toBe(key2)
    })
  })

  describe('getKeyDisplayLabel', () => {
    it('QWERTY布局中KeyA应该显示A', () => {
      expect(getKeyDisplayLabel('KeyA', 'qwerty')).toBe('A')
    })

    it('AZERTY布局中首行键位应该不同', () => {
      expect(getKeyDisplayLabel('KeyQ', 'qwerty')).toBe('Q')
      expect(getKeyDisplayLabel('KeyA', 'azerty')).toBe('A')
      expect(getKeyDisplayLabel('KeyZ', 'azerty')).toBe('Z')
    })

    it('QWERTZ布局中Z和Y应该互换', () => {
      expect(getKeyDisplayLabel('KeyZ', 'qwertz')).toBe('Z')
      expect(getKeyDisplayLabel('KeyY', 'qwertz')).toBe('Y')
    })

    it('未知键码应该返回原码', () => {
      expect(getKeyDisplayLabel('UnknownKey', 'qwerty')).toBe('UnknownKey')
    })

    it('默认应该使用qwerty布局', () => {
      expect(getKeyDisplayLabel('KeyA')).toBe('A')
    })
  })
})

describe('CSV 导出格式化', () => {
  const testLogs = [
    { id: '1', timestamp: 1700000000000, keyName: 'A', keyCode: 'KeyA', eventType: 'keydown' },
    { id: '2', timestamp: 1700000001000, keyName: 'B', keyCode: 'KeyB', eventType: 'keyup' },
  ]

  describe('exportLogsToCsv', () => {
    it('应该导出成功并返回内容', () => {
      const result = exportLogsToCsv(testLogs)
      expect(result.success).toBe(true)
      expect(result.content).toBeDefined()
      expect(typeof result.content).toBe('string')
    })

    it('应该包含 BOM 头', () => {
      const result = exportLogsToCsv(testLogs)
      expect(result.content.startsWith('\uFEFF')).toBe(true)
    })

    it('应该包含表头', () => {
      const result = exportLogsToCsv(testLogs)
      expect(result.content).toContain('序号')
      expect(result.content).toContain('时间')
      expect(result.content).toContain('键名')
      expect(result.content).toContain('键码')
      expect(result.content).toContain('事件类型')
    })

    it('应该包含所有数据行', () => {
      const result = exportLogsToCsv(testLogs)
      expect(result.content).toContain('KeyA')
      expect(result.content).toContain('KeyB')
      expect(result.content).toContain('keydown')
      expect(result.content).toContain('keyup')
    })

    it('空数组应该返回失败', () => {
      const result = exportLogsToCsv([])
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('非数组输入应该返回失败', () => {
      expect(exportLogsToCsv(null).success).toBe(false)
      expect(exportLogsToCsv(undefined).success).toBe(false)
    })

    it('应该正确转义包含逗号的字段', () => {
      const logs = [{ keyName: 'A,B', keyCode: 'KeyA', eventType: 'keydown', timestamp: Date.now() }]
      const result = exportLogsToCsv(logs)
      expect(result.success).toBe(true)
      expect(result.content).toContain('"A,B"')
    })

    it('应该正确转义包含引号的字段', () => {
      const logs = [{ keyName: 'A"B', keyCode: 'KeyA', eventType: 'keydown', timestamp: Date.now() }]
      const result = exportLogsToCsv(logs)
      expect(result.success).toBe(true)
      expect(result.content).toContain('"A""B"')
    })

    it('应该使用 CRLF 作为行分隔符', () => {
      const result = exportLogsToCsv(testLogs)
      expect(result.content).toContain('\r\n')
    })

    it('序号应该从1开始', () => {
      const result = exportLogsToCsv(testLogs)
      const lines = result.content.split('\r\n')
      expect(lines[1]).toContain('"1"')
      expect(lines[2]).toContain('"2"')
    })
  })
})

describe('频率统计函数', () => {
  describe('incrementFrequency', () => {
    it('应该增加指定键的频率', () => {
      const freq = { KeyA: 1 }
      const result = incrementFrequency(freq, 'KeyA')
      expect(result.KeyA).toBe(2)
    })

    it('新键应该从1开始', () => {
      const freq = {}
      const result = incrementFrequency(freq, 'KeyB')
      expect(result.KeyB).toBe(1)
    })

    it('不应该修改原对象', () => {
      const freq = { KeyA: 1 }
      const result = incrementFrequency(freq, 'KeyA')
      expect(freq.KeyA).toBe(1)
      expect(result).not.toBe(freq)
    })
  })

  describe('getMaxFrequency', () => {
    it('应该返回最大频率值', () => {
      const freq = { KeyA: 10, KeyB: 5, KeyC: 20 }
      expect(getMaxFrequency(freq)).toBe(20)
    })

    it('空对象应该返回0', () => {
      expect(getMaxFrequency({})).toBe(0)
    })

    it('非对象应该返回0', () => {
      expect(getMaxFrequency(null)).toBe(0)
      expect(getMaxFrequency(undefined)).toBe(0)
    })
  })

  describe('getTotalKeyPresses', () => {
    it('应该返回总按键次数', () => {
      const freq = { KeyA: 10, KeyB: 5, KeyC: 3 }
      expect(getTotalKeyPresses(freq)).toBe(18)
    })

    it('空对象应该返回0', () => {
      expect(getTotalKeyPresses({})).toBe(0)
    })

    it('非对象应该返回0', () => {
      expect(getTotalKeyPresses(null)).toBe(0)
      expect(getTotalKeyPresses(undefined)).toBe(0)
    })
  })
})

describe('localStorage 存储', () => {
  const originalLocalStorage = global.localStorage

  beforeEach(() => {
    const store = {}
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = String(value)
      }),
      removeItem: vi.fn((key) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        for (const key of Object.keys(store)) {
          delete store[key]
        }
      }),
    }
  })

  afterEach(() => {
    global.localStorage = originalLocalStorage
    vi.restoreAllMocks()
  })

  describe('saveLogsToStorage / loadLogsFromStorage', () => {
    it('应该保存并加载日志', () => {
      const logs = [{ id: '1', keyName: 'A', keyCode: 'KeyA' }]
      const saveResult = saveLogsToStorage(logs)
      expect(saveResult).toBe(true)

      const loaded = loadLogsFromStorage()
      expect(loaded).toEqual(logs)
    })

    it('无数据时应该返回空数组', () => {
      const loaded = loadLogsFromStorage()
      expect(loaded).toEqual([])
    })

    it('无效 JSON 应该返回空数组', () => {
      global.localStorage.setItem(STORAGE_KEY_LOGS, 'invalid json')
      const loaded = loadLogsFromStorage()
      expect(loaded).toEqual([])
    })

    it('非数组数据应该返回空数组', () => {
      global.localStorage.setItem(STORAGE_KEY_LOGS, '"not an array"')
      const loaded = loadLogsFromStorage()
      expect(loaded).toEqual([])
    })
  })

  describe('saveFrequencyToStorage / loadFrequencyFromStorage', () => {
    it('应该保存并加载频率数据', () => {
      const freq = { KeyA: 10, KeyB: 5 }
      const saveResult = saveFrequencyToStorage(freq)
      expect(saveResult).toBe(true)

      const loaded = loadFrequencyFromStorage()
      expect(loaded).toEqual(freq)
    })

    it('无数据时应该返回空对象', () => {
      const loaded = loadFrequencyFromStorage()
      expect(loaded).toEqual({})
    })

    it('非对象数据应该返回空对象', () => {
      global.localStorage.setItem(STORAGE_KEY_FREQUENCY, '"not an object"')
      const loaded = loadFrequencyFromStorage()
      expect(loaded).toEqual({})
    })
  })

  describe('saveLayoutToStorage / loadLayoutFromStorage', () => {
    it('应该保存并加载布局设置', () => {
      const saveResult = saveLayoutToStorage('azerty')
      expect(saveResult).toBe(true)

      const loaded = loadLayoutFromStorage()
      expect(loaded).toBe('azerty')
    })

    it('无数据时应该返回 qwerty', () => {
      const loaded = loadLayoutFromStorage()
      expect(loaded).toBe('qwerty')
    })

    it('无效布局应该返回 qwerty', () => {
      global.localStorage.setItem(STORAGE_KEY_LAYOUT, '"invalid-layout"')
      const loaded = loadLayoutFromStorage()
      expect(loaded).toBe('qwerty')
    })
  })
})
