import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  PASSWORD_STRENGTH,
  SCORE_WEIGHTS,
  SCORE_COLORS,
  OPERATION_TYPES,
  OPERATION_RESULTS,
  STORAGE_KEY_DEVICES,
  STORAGE_KEY_TWOFA,
  STORAGE_KEY_OPERATIONS,
  STORAGE_KEY_FREQUENT_LOCATIONS,
  FREQUENT_CITY,
  DEFAULT_FREQUENT_LOCATIONS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  WEAK_PASSWORDS,
} from '../../security-center/constants'
import {
  generateId,
  formatDateTime,
  formatRelativeTime,
  generateIpAddress,
  generateBase32Secret,
  checkPasswordCharTypes,
  hasConsecutiveRepeats,
  isCommonWeakPassword,
  evaluatePasswordStrength,
  getPasswordScore,
  generateMockDevices,
  removeDevice,
  hasRemoteLogin,
  isDeviceRemote,
  loadFrequentLocations,
  saveFrequentLocations,
  loadDevices,
  saveDevices,
  loadTwoFAStatus,
  saveTwoFAStatus,
  validateVerificationCode,
  createOperationRecord,
  generateMockOperations,
  loadOperations,
  saveOperations,
  appendOperation,
  hasRecentAnomaly,
  paginateOperations,
  calculateScoreBreakdown,
  getScoreColor,
  getScoreLabel,
  generateSecurityAdvice,
  copyToClipboardMock,
} from '../../security-center/securityCenterCore'

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

describe('generateId', () => {
  it('生成的ID以 sc_ 开头', () => {
    expect(generateId()).toMatch(/^sc_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为 yyyy-MM-dd HH:mm:ss', () => {
    const ts = new Date(2025, 5, 15, 10, 30, 45).getTime()
    expect(formatDateTime(ts)).toBe('2025-06-15 10:30:45')
  })

  it('空值返回空字符串', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime('')).toBe('')
  })

  it('无效日期返回空字符串', () => {
    expect(formatDateTime('invalid')).toBe('')
  })

  it('补零正确', () => {
    const ts = new Date(2025, 0, 5, 3, 7, 9).getTime()
    expect(formatDateTime(ts)).toBe('2025-01-05 03:07:09')
  })
})

describe('formatRelativeTime', () => {
  it('空值返回空字符串', () => {
    expect(formatRelativeTime(null)).toBe('')
    expect(formatRelativeTime(undefined)).toBe('')
  })

  it('1分钟内返回"刚刚"', () => {
    const ts = Date.now() - 30 * 1000
    expect(formatRelativeTime(ts)).toBe('刚刚')
  })

  it('1小时内返回分钟', () => {
    const ts = Date.now() - 25 * 60 * 1000
    expect(formatRelativeTime(ts)).toContain('分钟前')
  })

  it('1天内返回小时', () => {
    const ts = Date.now() - 5 * 60 * 60 * 1000
    expect(formatRelativeTime(ts)).toContain('小时前')
  })

  it('30天内返回天数', () => {
    const ts = Date.now() - 10 * 24 * 60 * 60 * 1000
    expect(formatRelativeTime(ts)).toContain('天前')
  })

  it('超过30天返回完整日期', () => {
    const ts = Date.now() - 60 * 24 * 60 * 60 * 1000
    const result = formatRelativeTime(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })
})

describe('generateIpAddress', () => {
  it('返回合法的 IP 地址格式', () => {
    const ip = generateIpAddress()
    expect(ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/)
  })

  it('每段数字在 0-255 范围内', () => {
    const ip = generateIpAddress()
    const parts = ip.split('.').map(Number)
    expect(parts.length).toBe(4)
    parts.forEach((p) => {
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(255)
    })
  })
})

describe('generateBase32Secret', () => {
  it('生成指定长度的密钥', () => {
    const secret = generateBase32Secret(16)
    expect(secret.length).toBe(16)
  })

  it('默认长度为 16', () => {
    const secret = generateBase32Secret()
    expect(secret.length).toBe(16)
  })

  it('只包含 Base32 字符（A-Z 和 2-7）', () => {
    const secret = generateBase32Secret(32)
    expect(secret).toMatch(/^[A-Z2-7]+$/)
  })

  it('生成的密钥不重复', () => {
    const secrets = new Set()
    for (let i = 0; i < 50; i++) {
      secrets.add(generateBase32Secret())
    }
    expect(secrets.size).toBe(50)
  })
})

describe('checkPasswordCharTypes', () => {
  it('空密码返回全 false', () => {
    const result = checkPasswordCharTypes('')
    expect(result.uppercase).toBe(false)
    expect(result.lowercase).toBe(false)
    expect(result.number).toBe(false)
    expect(result.special).toBe(false)
    expect(result.count).toBe(0)
  })

  it('只包含小写字母', () => {
    const result = checkPasswordCharTypes('abcdef')
    expect(result.uppercase).toBe(false)
    expect(result.lowercase).toBe(true)
    expect(result.number).toBe(false)
    expect(result.special).toBe(false)
    expect(result.count).toBe(1)
  })

  it('只包含大写字母', () => {
    const result = checkPasswordCharTypes('ABCDEF')
    expect(result.uppercase).toBe(true)
    expect(result.lowercase).toBe(false)
    expect(result.number).toBe(false)
    expect(result.special).toBe(false)
    expect(result.count).toBe(1)
  })

  it('只包含数字', () => {
    const result = checkPasswordCharTypes('123456')
    expect(result.uppercase).toBe(false)
    expect(result.lowercase).toBe(false)
    expect(result.number).toBe(true)
    expect(result.special).toBe(false)
    expect(result.count).toBe(1)
  })

  it('只包含特殊字符', () => {
    const result = checkPasswordCharTypes('!@#$%^')
    expect(result.uppercase).toBe(false)
    expect(result.lowercase).toBe(false)
    expect(result.number).toBe(false)
    expect(result.special).toBe(true)
    expect(result.count).toBe(1)
  })

  it('包含大小写字母和数字', () => {
    const result = checkPasswordCharTypes('Abc123')
    expect(result.uppercase).toBe(true)
    expect(result.lowercase).toBe(true)
    expect(result.number).toBe(true)
    expect(result.special).toBe(false)
    expect(result.count).toBe(3)
  })

  it('包含四种字符类型', () => {
    const result = checkPasswordCharTypes('Abc123!@#')
    expect(result.uppercase).toBe(true)
    expect(result.lowercase).toBe(true)
    expect(result.number).toBe(true)
    expect(result.special).toBe(true)
    expect(result.count).toBe(4)
  })

  it('识别各种特殊字符', () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:\\",.<>?/`~'
    for (const c of specialChars) {
      const result = checkPasswordCharTypes(c)
      expect(result.special).toBe(true)
    }
  })

  it('识别波浪号 ~ 为特殊字符', () => {
    expect(checkPasswordCharTypes('~').special).toBe(true)
    expect(checkPasswordCharTypes('abc~def').special).toBe(true)
  })

  it('识别反引号 ` 为特殊字符', () => {
    expect(checkPasswordCharTypes('`').special).toBe(true)
    expect(checkPasswordCharTypes('abc`def').special).toBe(true)
  })
})

describe('hasConsecutiveRepeats', () => {
  it('空密码返回 false', () => {
    expect(hasConsecutiveRepeats('')).toBe(false)
    expect(hasConsecutiveRepeats(null)).toBe(false)
    expect(hasConsecutiveRepeats(undefined)).toBe(false)
  })

  it('密码长度小于 minRepeat 返回 false', () => {
    expect(hasConsecutiveRepeats('aa', 3)).toBe(false)
  })

  it('检测 3 个连续重复字符', () => {
    expect(hasConsecutiveRepeats('AAA')).toBe(true)
    expect(hasConsecutiveRepeats('111')).toBe(true)
    expect(hasConsecutiveRepeats('aaa')).toBe(true)
  })

  it('4 个连续重复字符', () => {
    expect(hasConsecutiveRepeats('AAAA1234')).toBe(true)
    expect(hasConsecutiveRepeats('1111abcd')).toBe(true)
  })

  it('无连续重复返回 false', () => {
    expect(hasConsecutiveRepeats('Abcdefg123')).toBe(false)
    expect(hasConsecutiveRepeats('aabbcc')).toBe(false)
  })

  it('连续重复在中间位置也能检测', () => {
    expect(hasConsecutiveRepeats('AbBBBcdef')).toBe(true)
    expect(hasConsecutiveRepeats('abc111def')).toBe(true)
  })

  it('自定义 minRepeat 参数', () => {
    expect(hasConsecutiveRepeats('aa', 2)).toBe(true)
    expect(hasConsecutiveRepeats('aa', 3)).toBe(false)
    expect(hasConsecutiveRepeats('aaaa', 4)).toBe(true)
  })
})

describe('isCommonWeakPassword', () => {
  it('空密码返回 false', () => {
    expect(isCommonWeakPassword('')).toBe(false)
    expect(isCommonWeakPassword(null)).toBe(false)
    expect(isCommonWeakPassword(undefined)).toBe(false)
  })

  it('检测完全匹配的常见弱密码', () => {
    expect(isCommonWeakPassword('password')).toBe(true)
    expect(isCommonWeakPassword('123456')).toBe(true)
    expect(isCommonWeakPassword('qwerty')).toBe(true)
    expect(isCommonWeakPassword('admin')).toBe(true)
  })

  it('大小写不敏感', () => {
    expect(isCommonWeakPassword('Password')).toBe(true)
    expect(isCommonWeakPassword('PASSWORD')).toBe(true)
    expect(isCommonWeakPassword('Qwerty')).toBe(true)
  })

  it('检测包含常见弱密码的密码', () => {
    expect(isCommonWeakPassword('Password123!')).toBe(true)
    expect(isCommonWeakPassword('myadmin2024')).toBe(true)
  })

  it('正常密码返回 false', () => {
    expect(isCommonWeakPassword('Kx9#mP2$vL5')).toBe(false)
    expect(isCommonWeakPassword('Zf8!nQ4@wR7')).toBe(false)
  })
})

describe('evaluatePasswordStrength', () => {
  it('空密码返回极弱等级，进度为 0', () => {
    const result = evaluatePasswordStrength('')
    expect(result.level).toBe(PASSWORD_STRENGTH.VERY_WEAK.level)
    expect(result.progress).toBe(0)
    expect(result.suggestions).toEqual([])
  })

  it('长度小于 6 位为弱（1星）', () => {
    const result = evaluatePasswordStrength('abc')
    expect(result.stars).toBe(1)
    expect(result.color).toBe('#ef4444')
    expect(result.progress).toBeLessThanOrEqual(20)
  })

  it('6-8 位仅含一种字符类型为弱', () => {
    const result = evaluatePasswordStrength('abcdef')
    expect(result.stars).toBe(1)
    expect(result.level).toBeLessThanOrEqual(PASSWORD_STRENGTH.WEAK.level)
  })

  it('6-8 位包含两种及以上为中', () => {
    const result = evaluatePasswordStrength('Abcdefg')
    expect(result.stars).toBeGreaterThanOrEqual(2)
    expect(result.stars).toBeLessThanOrEqual(3)
    expect(result.color).toBe('#f59e0b')
  })

  it('8-11 位包含三种及以上为强', () => {
    const result = evaluatePasswordStrength('Abcdefg12')
    expect(result.stars).toBe(4)
    expect(result.color).toBe('#3b82f6')
  })

  it('12 位及以上且包含四种类型为很强', () => {
    const result = evaluatePasswordStrength('Abcdefg123!@#')
    expect(result.stars).toBe(5)
    expect(result.color).toBe('#10b981')
    expect(result.progress).toBe(100)
  })

  it('12位以上只有一种类型为弱', () => {
    const result = evaluatePasswordStrength('abcdefghijkl')
    expect(result.stars).toBe(1)
  })

  it('12位以上有两种类型为中', () => {
    const result = evaluatePasswordStrength('Abcdefghijkl')
    expect(result.stars).toBe(2)
  })

  it('12位以上有三种类型为强', () => {
    const result = evaluatePasswordStrength('Abcdefghijkl123')
    expect(result.stars).toBe(4)
  })

  it('连续重复字符降低强度等级', () => {
    const result = evaluatePasswordStrength('AAAA1234!')
    expect(result.level).toBeLessThanOrEqual(PASSWORD_STRENGTH.MEDIUM.level)
    expect(result.suggestions.some((s) => s.includes('连续重复'))).toBe(true)
  })

  it('常见弱密码被降级为弱', () => {
    const result = evaluatePasswordStrength('Password123!')
    expect(result.level).toBe(PASSWORD_STRENGTH.WEAK.level)
    expect(result.suggestions.some((s) => s.includes('常见弱密码'))).toBe(true)
  })

  it('连续重复字符建议', () => {
    const result = evaluatePasswordStrength('AAAAbcdefgh1!')
    expect(result.suggestions.some((s) => s.includes('连续重复'))).toBe(true)
  })

  it('常见弱密码建议', () => {
    const result = evaluatePasswordStrength('qwerty123!')
    expect(result.suggestions.some((s) => s.includes('常见弱密码'))).toBe(true)
  })

  it('包含密码长度建议', () => {
    const result = evaluatePasswordStrength('abc')
    expect(result.suggestions.some((s) => s.includes('长度'))).toBe(true)
  })

  it('缺少大写字母时有对应建议', () => {
    const result = evaluatePasswordStrength('abcdefghijkl')
    expect(result.suggestions.some((s) => s.includes('大写字母'))).toBe(true)
  })

  it('缺少数字时有对应建议', () => {
    const result = evaluatePasswordStrength('Abcdefghijkl')
    expect(result.suggestions.some((s) => s.includes('数字'))).toBe(true)
  })

  it('缺少特殊字符时有对应建议', () => {
    const result = evaluatePasswordStrength('Abcdefg12345')
    expect(result.suggestions.some((s) => s.includes('特殊字符'))).toBe(true)
  })

  it('强密码建议增加到 12 位以上', () => {
    const result = evaluatePasswordStrength('Abcdefg12')
    expect(result.suggestions.some((s) => s.includes('12 位以上'))).toBe(true)
  })

  it('很强密码且无异常模式的建议不包含"建议包含"类建议', () => {
    const result = evaluatePasswordStrength('Abcdefg123!@#')
    const hasTypeSuggestion = result.suggestions.some(
      (s) => s.includes('建议包含') || s.includes('大写字母') || s.includes('小写字母')
    )
    expect(hasTypeSuggestion).toBe(false)
  })
})

describe('getPasswordScore', () => {
  it('空密码得 0 分', () => {
    expect(getPasswordScore('')).toBe(0)
  })

  it('弱密码得分低于满分的 50%', () => {
    const score = getPasswordScore('abc')
    expect(score).toBeLessThan(SCORE_WEIGHTS.PASSWORD * 0.5)
  })

  it('很强密码得满分 30', () => {
    const score = getPasswordScore('Abcdefg123!@#')
    expect(score).toBe(SCORE_WEIGHTS.PASSWORD)
  })

  it('进度为 100 时密码得分等于维度满分', () => {
    const score = getPasswordScore('Abcdefg123!@#')
    expect(score).toBe(30)
  })

  it('进度为 50 时密码得分约为维度满分的 50%', () => {
    const score = getPasswordScore('Abcdefg12')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(SCORE_WEIGHTS.PASSWORD)
  })

  it('常见弱密码得分很低', () => {
    const score = getPasswordScore('Password123!')
    expect(score).toBeLessThanOrEqual(Math.round(0.2 * SCORE_WEIGHTS.PASSWORD))
  })

  it('连续重复字符降低密码得分', () => {
    const normalScore = getPasswordScore('Abcdefg123!@')
    const repeatScore = getPasswordScore('AAAAefg123!@')
    expect(repeatScore).toBeLessThan(normalScore)
  })
})

describe('generateMockDevices', () => {
  it('生成 5 台设备（1 台当前 + 4 台历史）', () => {
    const devices = generateMockDevices()
    expect(devices.length).toBe(5)
  })

  it('包含且仅包含 1 台当前设备', () => {
    const devices = generateMockDevices()
    const currentDevices = devices.filter((d) => d.isCurrent)
    expect(currentDevices.length).toBe(1)
    expect(currentDevices[0].location).toBe(FREQUENT_CITY)
  })

  it('当前设备不在异地', () => {
    const devices = generateMockDevices(['北京市'])
    const current = devices.find((d) => d.isCurrent)
    expect(isDeviceRemote(current, ['北京市'])).toBe(false)
  })

  it('每台设备包含所有必需字段', () => {
    const devices = generateMockDevices()
    devices.forEach((device) => {
      expect(device.id).toBeTruthy()
      expect(device.name).toBeTruthy()
      expect(device.os).toBeTruthy()
      expect(device.browser).toBeTruthy()
      expect(device.ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/)
      expect(typeof device.loginTime).toBe('number')
      expect(device.location).toBeTruthy()
      expect(typeof device.isCurrent).toBe('boolean')
    })
  })

  it('按登录时间降序排列', () => {
    const devices = generateMockDevices()
    for (let i = 1; i < devices.length; i++) {
      expect(devices[i - 1].loginTime).toBeGreaterThanOrEqual(devices[i].loginTime)
    }
  })

  it('使用自定义常用城市生成设备', () => {
    const devices = generateMockDevices(['上海市', '杭州市'])
    const current = devices.find((d) => d.isCurrent)
    expect(current.location).toBe('上海市')
  })
})

describe('removeDevice', () => {
  it('从列表中移除指定设备', () => {
    const devices = [
      { id: '1', name: '设备1' },
      { id: '2', name: '设备2' },
      { id: '3', name: '设备3' },
    ]
    const result = removeDevice(devices, '2')
    expect(result.length).toBe(2)
    expect(result.find((d) => d.id === '2')).toBeUndefined()
  })

  it('设备不存在时返回原列表', () => {
    const devices = [
      { id: '1', name: '设备1' },
      { id: '2', name: '设备2' },
    ]
    const result = removeDevice(devices, '999')
    expect(result.length).toBe(2)
  })

  it('不修改原数组', () => {
    const devices = [
      { id: '1', name: '设备1' },
      { id: '2', name: '设备2' },
    ]
    const originalLength = devices.length
    removeDevice(devices, '1')
    expect(devices.length).toBe(originalLength)
  })
})

describe('hasRemoteLogin', () => {
  it('存在异地登录时返回 true', () => {
    const devices = [
      { id: '1', location: '北京市', isCurrent: true },
      { id: '2', location: '上海市', isCurrent: false },
    ]
    expect(hasRemoteLogin(devices, ['北京市'])).toBe(true)
  })

  it('无异地登录时返回 false', () => {
    const devices = [
      { id: '1', location: '北京市', isCurrent: true },
      { id: '2', location: '北京市', isCurrent: false },
    ]
    expect(hasRemoteLogin(devices, ['北京市'])).toBe(false)
  })

  it('当前设备标记为异地时不计入', () => {
    const devices = [
      { id: '1', location: '上海市', isCurrent: true },
      { id: '2', location: '北京市', isCurrent: false },
    ]
    expect(hasRemoteLogin(devices, ['北京市'])).toBe(false)
  })

  it('空列表返回 false', () => {
    expect(hasRemoteLogin([])).toBe(false)
  })

  it('多常用城市时正确检测', () => {
    const devices = [
      { id: '1', location: '北京市', isCurrent: true },
      { id: '2', location: '上海市', isCurrent: false },
      { id: '3', location: '广州市', isCurrent: false },
    ]
    expect(hasRemoteLogin(devices, ['北京市', '上海市'])).toBe(true)
    expect(hasRemoteLogin(devices, ['北京市', '上海市', '广州市'])).toBe(false)
  })

  it('默认使用 DEFAULT_FREQUENT_LOCATIONS', () => {
    const devices = [
      { id: '1', location: '北京市', isCurrent: true },
      { id: '2', location: '北京市', isCurrent: false },
    ]
    expect(hasRemoteLogin(devices)).toBe(false)
  })
})

describe('isDeviceRemote', () => {
  it('当前设备返回 false', () => {
    const device = { id: '1', location: '上海市', isCurrent: true }
    expect(isDeviceRemote(device, ['北京市'])).toBe(false)
  })

  it('非当前设备位置不在常用城市返回 true', () => {
    const device = { id: '1', location: '上海市', isCurrent: false }
    expect(isDeviceRemote(device, ['北京市'])).toBe(true)
  })

  it('非当前设备位置在常用城市返回 false', () => {
    const device = { id: '1', location: '北京市', isCurrent: false }
    expect(isDeviceRemote(device, ['北京市'])).toBe(false)
  })

  it('多常用城市匹配', () => {
    const device = { id: '1', location: '上海市', isCurrent: false }
    expect(isDeviceRemote(device, ['北京市', '上海市'])).toBe(false)
    expect(isDeviceRemote(device, ['北京市', '广州市'])).toBe(true)
  })
})

describe('localStorage - frequentLocations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveFrequentLocations 保存到 localStorage', () => {
    const locations = ['北京市', '上海市']
    const result = saveFrequentLocations(locations)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_FREQUENT_LOCATIONS)).toBe(JSON.stringify(locations))
  })

  it('loadFrequentLocations 从 localStorage 读取', () => {
    const locations = ['北京市', '上海市']
    localStorage.setItem(STORAGE_KEY_FREQUENT_LOCATIONS, JSON.stringify(locations))
    expect(loadFrequentLocations()).toEqual(locations)
  })

  it('loadFrequentLocations localStorage 为空时返回默认值', () => {
    const result = loadFrequentLocations()
    expect(result).toEqual(DEFAULT_FREQUENT_LOCATIONS)
  })

  it('loadFrequentLocations 数据损坏时返回默认值', () => {
    localStorage.setItem(STORAGE_KEY_FREQUENT_LOCATIONS, 'invalid-json')
    expect(loadFrequentLocations()).toEqual(DEFAULT_FREQUENT_LOCATIONS)
  })

  it('loadFrequentLocations 非数组时返回默认值', () => {
    localStorage.setItem(STORAGE_KEY_FREQUENT_LOCATIONS, JSON.stringify({ not: 'array' }))
    expect(loadFrequentLocations()).toEqual(DEFAULT_FREQUENT_LOCATIONS)
  })

  it('loadFrequentLocations 空数组时返回默认值', () => {
    localStorage.setItem(STORAGE_KEY_FREQUENT_LOCATIONS, '[]')
    expect(loadFrequentLocations()).toEqual(DEFAULT_FREQUENT_LOCATIONS)
  })

  it('loadFrequentLocations 过滤非字符串项', () => {
    localStorage.setItem(STORAGE_KEY_FREQUENT_LOCATIONS, JSON.stringify(['北京市', 123, null, '']))
    const result = loadFrequentLocations()
    expect(result).toEqual(['北京市'])
  })

  it('返回新数组而非默认引用', () => {
    const result1 = loadFrequentLocations()
    const result2 = loadFrequentLocations()
    expect(result1).toEqual(result2)
    expect(result1).not.toBe(result2)
  })
})

describe('localStorage - devices', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveDevices 保存到 localStorage', () => {
    const devices = [{ id: '1', name: 'test' }]
    const result = saveDevices(devices)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_DEVICES)).toBe(JSON.stringify(devices))
  })

  it('loadDevices 从 localStorage 读取', () => {
    const devices = [{ id: '1', name: 'test' }]
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devices))
    expect(loadDevices()).toEqual(devices)
  })

  it('loadDevices localStorage 为空时生成模拟数据', () => {
    const devices = loadDevices()
    expect(Array.isArray(devices)).toBe(true)
    expect(devices.length).toBe(5)
  })

  it('loadDevices 数据损坏时生成模拟数据', () => {
    localStorage.setItem(STORAGE_KEY_DEVICES, 'invalid-json')
    const devices = loadDevices()
    expect(Array.isArray(devices)).toBe(true)
    expect(devices.length).toBe(5)
  })

  it('loadDevices 数据非数组时生成模拟数据', () => {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify({ not: 'array' }))
    const devices = loadDevices()
    expect(Array.isArray(devices)).toBe(true)
    expect(devices.length).toBe(5)
  })

  it('loadDevices 空数组时生成模拟数据', () => {
    localStorage.setItem(STORAGE_KEY_DEVICES, '[]')
    const devices = loadDevices()
    expect(Array.isArray(devices)).toBe(true)
    expect(devices.length).toBe(5)
  })
})

describe('localStorage - twoFA', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveTwoFAStatus 保存到 localStorage', () => {
    const status = { enabled: true, secret: 'ABC123' }
    const result = saveTwoFAStatus(status)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_TWOFA)).toBe(JSON.stringify(status))
  })

  it('loadTwoFAStatus 从 localStorage 读取', () => {
    const status = { enabled: true, secret: 'ABC123' }
    localStorage.setItem(STORAGE_KEY_TWOFA, JSON.stringify(status))
    const result = loadTwoFAStatus()
    expect(result.enabled).toBe(true)
    expect(result.secret).toBe('ABC123')
  })

  it('loadTwoFAStatus 为空时返回默认状态（关闭）', () => {
    const result = loadTwoFAStatus()
    expect(result.enabled).toBe(false)
    expect(result.secret).toBe('')
  })

  it('loadTwoFAStatus 数据损坏时返回默认状态', () => {
    localStorage.setItem(STORAGE_KEY_TWOFA, 'invalid')
    const result = loadTwoFAStatus()
    expect(result.enabled).toBe(false)
  })

  it('loadTwoFAStatus 非对象时返回默认状态', () => {
    localStorage.setItem(STORAGE_KEY_TWOFA, '123')
    const result = loadTwoFAStatus()
    expect(result.enabled).toBe(false)
  })

  it('loadTwoFAStatus 缺失 secret 时补空字符串', () => {
    localStorage.setItem(STORAGE_KEY_TWOFA, JSON.stringify({ enabled: true }))
    const result = loadTwoFAStatus()
    expect(result.secret).toBe('')
  })
})

describe('validateVerificationCode', () => {
  it('6位数字验证通过', () => {
    const result = validateVerificationCode('123456')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('123456')
  })

  it('空值验证失败', () => {
    expect(validateVerificationCode('').valid).toBe(false)
    expect(validateVerificationCode(null).valid).toBe(false)
    expect(validateVerificationCode(undefined).valid).toBe(false)
  })

  it('非数字验证失败', () => {
    expect(validateVerificationCode('abcdef').valid).toBe(false)
  })

  it('少于 6 位验证失败', () => {
    expect(validateVerificationCode('12345').valid).toBe(false)
  })

  it('多于 6 位验证失败', () => {
    expect(validateVerificationCode('1234567').valid).toBe(false)
  })

  it('包含空格时会 trim 后验证', () => {
    const result = validateVerificationCode(' 123456 ')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('123456')
  })

  it('返回错误信息', () => {
    const result = validateVerificationCode('abc')
    expect(result.error).toBeTruthy()
    expect(typeof result.error).toBe('string')
  })
})

describe('createOperationRecord', () => {
  it('创建包含所有字段的操作记录', () => {
    const record = createOperationRecord(
      OPERATION_TYPES.LOGIN,
      '测试详情',
      '192.168.1.1',
      OPERATION_RESULTS.SUCCESS
    )
    expect(record.id).toBeTruthy()
    expect(record.type).toBe(OPERATION_TYPES.LOGIN)
    expect(record.detail).toBe('测试详情')
    expect(record.ip).toBe('192.168.1.1')
    expect(record.result).toBe(OPERATION_RESULTS.SUCCESS)
    expect(typeof record.timestamp).toBe('number')
    expect(typeof record.isAnomaly).toBe('boolean')
  })

  it('成功操作不标记为异常', () => {
    const record = createOperationRecord(
      OPERATION_TYPES.LOGIN,
      'test',
      '1.1.1.1',
      OPERATION_RESULTS.SUCCESS
    )
    expect(record.isAnomaly).toBe(false)
  })

  it('失败操作标记为异常', () => {
    const record = createOperationRecord(
      OPERATION_TYPES.LOGIN,
      'test',
      '1.1.1.1',
      OPERATION_RESULTS.FAILURE
    )
    expect(record.isAnomaly).toBe(true)
  })

  it('默认结果为成功', () => {
    const record = createOperationRecord(OPERATION_TYPES.LOGIN, 'test', '1.1.1.1')
    expect(record.result).toBe(OPERATION_RESULTS.SUCCESS)
  })

  it('时间戳接近当前时间', () => {
    const before = Date.now()
    const record = createOperationRecord(OPERATION_TYPES.LOGIN, 'test', '1.1.1.1')
    const after = Date.now()
    expect(record.timestamp).toBeGreaterThanOrEqual(before)
    expect(record.timestamp).toBeLessThanOrEqual(after)
  })
})

describe('generateMockOperations', () => {
  it('生成指定数量的操作记录', () => {
    const records = generateMockOperations(15)
    expect(records.length).toBe(15)
  })

  it('默认生成 15 条', () => {
    const records = generateMockOperations()
    expect(records.length).toBe(15)
  })

  it('每条记录包含所有必需字段', () => {
    const records = generateMockOperations(5)
    records.forEach((record) => {
      expect(record.id).toBeTruthy()
      expect(record.type).toBeTruthy()
      expect(record.detail).toBeTruthy()
      expect(record.ip).toBeTruthy()
      expect(record.result).toBeTruthy()
      expect(typeof record.timestamp).toBe('number')
      expect(typeof record.isAnomaly).toBe('boolean')
    })
  })

  it('操作类型为已知类型之一', () => {
    const records = generateMockOperations(20)
    const types = Object.values(OPERATION_TYPES)
    records.forEach((record) => {
      expect(types).toContain(record.type)
    })
  })

  it('按时间戳降序排列', () => {
    const records = generateMockOperations(10)
    for (let i = 1; i < records.length; i++) {
      expect(records[i - 1].timestamp).toBeGreaterThanOrEqual(records[i].timestamp)
    }
  })
})

describe('localStorage - operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveOperations 保存到 localStorage', () => {
    const operations = [{ id: '1', type: 'test' }]
    const result = saveOperations(operations)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_OPERATIONS)).toBe(JSON.stringify(operations))
  })

  it('loadOperations 从 localStorage 读取', () => {
    const operations = [{ id: '1', type: 'test' }]
    localStorage.setItem(STORAGE_KEY_OPERATIONS, JSON.stringify(operations))
    expect(loadOperations()).toEqual(operations)
  })

  it('loadOperations localStorage 为空时生成模拟数据', () => {
    const operations = loadOperations()
    expect(Array.isArray(operations)).toBe(true)
    expect(operations.length).toBe(15)
  })

  it('loadOperations 数据损坏时生成模拟数据', () => {
    localStorage.setItem(STORAGE_KEY_OPERATIONS, 'invalid-json')
    const operations = loadOperations()
    expect(Array.isArray(operations)).toBe(true)
    expect(operations.length).toBe(15)
  })

  it('loadOperations 数据非数组时生成模拟数据', () => {
    localStorage.setItem(STORAGE_KEY_OPERATIONS, JSON.stringify({ not: 'array' }))
    const operations = loadOperations()
    expect(Array.isArray(operations)).toBe(true)
    expect(operations.length).toBe(15)
  })

  it('loadOperations 空数组时生成模拟数据', () => {
    localStorage.setItem(STORAGE_KEY_OPERATIONS, '[]')
    const operations = loadOperations()
    expect(Array.isArray(operations)).toBe(true)
    expect(operations.length).toBe(15)
  })
})

describe('appendOperation', () => {
  it('将新记录添加到列表顶部', () => {
    const operations = [
      { id: '1', timestamp: 100 },
      { id: '2', timestamp: 50 },
    ]
    const newRecord = { id: '3', timestamp: 200 }
    const result = appendOperation(operations, newRecord)
    expect(result[0].id).toBe('3')
    expect(result.length).toBe(3)
  })

  it('不修改原数组', () => {
    const operations = [{ id: '1' }]
    const originalLength = operations.length
    appendOperation(operations, { id: '2' })
    expect(operations.length).toBe(originalLength)
  })
})

describe('hasRecentAnomaly', () => {
  it('存在近期异常操作返回 true', () => {
    const operations = [
      { id: '1', timestamp: Date.now() - 1000, isAnomaly: true },
      { id: '2', timestamp: Date.now() - 2000, isAnomaly: false },
    ]
    expect(hasRecentAnomaly(operations)).toBe(true)
  })

  it('无近期异常操作返回 false', () => {
    const operations = [
      { id: '1', timestamp: Date.now() - 1000, isAnomaly: false },
      { id: '2', timestamp: Date.now() - 2000, isAnomaly: false },
    ]
    expect(hasRecentAnomaly(operations)).toBe(false)
  })

  it('超过时间范围的异常不计入', () => {
    const operations = [
      { id: '1', timestamp: Date.now() - 200 * 60 * 60 * 1000, isAnomaly: true },
    ]
    expect(hasRecentAnomaly(operations, 72)).toBe(false)
  })

  it('空列表返回 false', () => {
    expect(hasRecentAnomaly([])).toBe(false)
  })

  it('支持自定义小时数', () => {
    const ts = Date.now() - 5 * 60 * 60 * 1000
    const operations = [{ id: '1', timestamp: ts, isAnomaly: true }]
    expect(hasRecentAnomaly(operations, 3)).toBe(false)
    expect(hasRecentAnomaly(operations, 6)).toBe(true)
  })
})

describe('paginateOperations', () => {
  const operations = Array.from({ length: 35 }, (_, i) => ({ id: String(i + 1) }))

  it('第一页正确', () => {
    const result = paginateOperations(operations, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.items[9].id).toBe('10')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(4)
    expect(result.total).toBe(35)
  })

  it('最后一页正确', () => {
    const result = paginateOperations(operations, 4, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(4)
  })

  it('页码超出范围时修正', () => {
    const result = paginateOperations(operations, 100, 10)
    expect(result.currentPage).toBe(4)
  })

  it('页码小于1时修正', () => {
    const result = paginateOperations(operations, 0, 10)
    expect(result.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateOperations([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })

  it('默认每页条数为 DEFAULT_PAGE_SIZE', () => {
    const result = paginateOperations(operations, 1)
    expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE)
  })

  it('自定义每页条数', () => {
    const result = paginateOperations(operations, 1, 20)
    expect(result.pageSize).toBe(20)
    expect(result.items.length).toBe(20)
    expect(result.totalPage).toBe(2)
  })
})

describe('calculateScoreBreakdown', () => {
  it('全项满分总分为 100', () => {
    const devices = [
      { id: '1', location: '北京市', isCurrent: true },
    ]
    const operations = [
      { id: '1', timestamp: Date.now(), isAnomaly: false },
    ]
    const breakdown = calculateScoreBreakdown(
      'Abcdefg123!@#',
      true,
      devices,
      operations,
      ['北京市']
    )
    expect(breakdown.total).toBe(100)
  })

  it('密码强度得分正确', () => {
    const devices = [{ id: '1', location: '北京市', isCurrent: true }]
    const operations = [{ id: '1', timestamp: Date.now(), isAnomaly: false }]
    const breakdown = calculateScoreBreakdown('', true, devices, operations, ['北京市'])
    expect(breakdown.password.score).toBe(0)
    expect(breakdown.password.max).toBe(SCORE_WEIGHTS.PASSWORD)
  })

  it('两步验证开启得满分', () => {
    const devices = [{ id: '1', location: '北京市', isCurrent: true }]
    const operations = [{ id: '1', timestamp: Date.now(), isAnomaly: false }]
    const breakdown = calculateScoreBreakdown('Abcdefg123!@#', true, devices, operations, ['北京市'])
    expect(breakdown.twoFA.score).toBe(SCORE_WEIGHTS.TWOFA)
  })

  it('两步验证关闭得 0 分', () => {
    const devices = [{ id: '1', location: '北京市', isCurrent: true }]
    const operations = [{ id: '1', timestamp: Date.now(), isAnomaly: false }]
    const breakdown = calculateScoreBreakdown('Abcdefg123!@#', false, devices, operations, ['北京市'])
    expect(breakdown.twoFA.score).toBe(0)
  })

  it('无异地登录得满分', () => {
    const devices = [
      { id: '1', location: '北京市', isCurrent: true },
      { id: '2', location: '北京市', isCurrent: false },
    ]
    const operations = [{ id: '1', timestamp: Date.now(), isAnomaly: false }]
    const breakdown = calculateScoreBreakdown('Abcdefg123!@#', true, devices, operations, ['北京市'])
    expect(breakdown.remoteLogin.score).toBe(SCORE_WEIGHTS.REMOTE_LOGIN)
  })

  it('有异地登录得 0 分', () => {
    const devices = [
      { id: '1', location: '北京市', isCurrent: true },
      { id: '2', location: '上海市', isCurrent: false },
    ]
    const operations = [{ id: '1', timestamp: Date.now(), isAnomaly: false }]
    const breakdown = calculateScoreBreakdown('Abcdefg123!@#', true, devices, operations, ['北京市'])
    expect(breakdown.remoteLogin.score).toBe(0)
  })

  it('无异常操作得满分', () => {
    const devices = [{ id: '1', location: '北京市', isCurrent: true }]
    const operations = [
      { id: '1', timestamp: Date.now(), isAnomaly: false },
    ]
    const breakdown = calculateScoreBreakdown('Abcdefg123!@#', true, devices, operations, ['北京市'])
    expect(breakdown.anomaly.score).toBe(SCORE_WEIGHTS.ANOMALY)
  })

  it('有异常操作得 0 分', () => {
    const devices = [{ id: '1', location: '北京市', isCurrent: true }]
    const operations = [
      { id: '1', timestamp: Date.now(), isAnomaly: true },
    ]
    const breakdown = calculateScoreBreakdown('Abcdefg123!@#', true, devices, operations, ['北京市'])
    expect(breakdown.anomaly.score).toBe(0)
  })

  it('各维度标签正确', () => {
    const devices = [{ id: '1', location: '北京市', isCurrent: true }]
    const operations = [{ id: '1', timestamp: Date.now(), isAnomaly: false }]
    const breakdown = calculateScoreBreakdown('', false, devices, operations, ['北京市'])
    expect(breakdown.password.label).toBe('密码强度')
    expect(breakdown.twoFA.label).toBe('两步验证')
    expect(breakdown.remoteLogin.label).toBe('异地登录')
    expect(breakdown.anomaly.label).toBe('异常操作')
  })

  it('总分等于各维度分数之和', () => {
    const devices = [
      { id: '1', location: '上海市', isCurrent: false },
    ]
    const operations = [
      { id: '1', timestamp: Date.now(), isAnomaly: true },
    ]
    const breakdown = calculateScoreBreakdown('abc', false, devices, operations, ['北京市'])
    const sum = breakdown.password.score + breakdown.twoFA.score +
      breakdown.remoteLogin.score + breakdown.anomaly.score
    expect(breakdown.total).toBe(sum)
  })

  it('常用城市包含设备城市时不算异地', () => {
    const devices = [
      { id: '1', location: '北京市', isCurrent: true },
      { id: '2', location: '上海市', isCurrent: false },
    ]
    const operations = [{ id: '1', timestamp: Date.now(), isAnomaly: false }]
    const breakdown = calculateScoreBreakdown('Abcdefg123!@#', true, devices, operations, ['北京市', '上海市'])
    expect(breakdown.remoteLogin.score).toBe(SCORE_WEIGHTS.REMOTE_LOGIN)
  })

  it('密码维度满分可达 30 分（归一化）', () => {
    const devices = [{ id: '1', location: '北京市', isCurrent: true }]
    const operations = [{ id: '1', timestamp: Date.now(), isAnomaly: false }]
    const breakdown = calculateScoreBreakdown('Abcdefg123!@#', true, devices, operations, ['北京市'])
    expect(breakdown.password.score).toBe(30)
  })
})

describe('getScoreColor', () => {
  it('80-100 分返回绿色', () => {
    expect(getScoreColor(100)).toBe(SCORE_COLORS.EXCELLENT)
    expect(getScoreColor(80)).toBe(SCORE_COLORS.EXCELLENT)
    expect(getScoreColor(90)).toBe(SCORE_COLORS.EXCELLENT)
  })

  it('60-79 分返回蓝色', () => {
    expect(getScoreColor(79)).toBe(SCORE_COLORS.GOOD)
    expect(getScoreColor(60)).toBe(SCORE_COLORS.GOOD)
    expect(getScoreColor(70)).toBe(SCORE_COLORS.GOOD)
  })

  it('40-59 分返回橙色', () => {
    expect(getScoreColor(59)).toBe(SCORE_COLORS.WARNING)
    expect(getScoreColor(40)).toBe(SCORE_COLORS.WARNING)
    expect(getScoreColor(50)).toBe(SCORE_COLORS.WARNING)
  })

  it('0-39 分返回红色', () => {
    expect(getScoreColor(39)).toBe(SCORE_COLORS.DANGER)
    expect(getScoreColor(0)).toBe(SCORE_COLORS.DANGER)
    expect(getScoreColor(20)).toBe(SCORE_COLORS.DANGER)
  })
})

describe('getScoreLabel', () => {
  it('80-100 分返回"优秀"', () => {
    expect(getScoreLabel(100)).toBe('优秀')
    expect(getScoreLabel(80)).toBe('优秀')
  })

  it('60-79 分返回"良好"', () => {
    expect(getScoreLabel(79)).toBe('良好')
    expect(getScoreLabel(60)).toBe('良好')
  })

  it('40-59 分返回"一般"', () => {
    expect(getScoreLabel(59)).toBe('一般')
    expect(getScoreLabel(40)).toBe('一般')
  })

  it('0-39 分返回"危险"', () => {
    expect(getScoreLabel(39)).toBe('危险')
    expect(getScoreLabel(0)).toBe('危险')
  })
})

describe('generateSecurityAdvice', () => {
  const createBreakdown = (overrides = {}) => ({
    password: { score: 30, max: 30, label: '密码强度' },
    twoFA: { score: 30, max: 30, label: '两步验证' },
    remoteLogin: { score: 20, max: 20, label: '异地登录' },
    anomaly: { score: 20, max: 20, label: '异常操作' },
    total: 100,
    ...overrides,
  })

  it('满分时返回优秀提示', () => {
    const breakdown = createBreakdown()
    const advice = generateSecurityAdvice(breakdown)
    expect(advice.length).toBe(1)
    expect(advice[0].priority).toBe('low')
    expect(advice[0].text).toContain('继续保持')
  })

  it('密码强度不足时有密码建议', () => {
    const breakdown = createBreakdown({
      password: { score: 10, max: 30, label: '密码强度' },
    })
    const advice = generateSecurityAdvice(breakdown)
    expect(advice.some((a) => a.id === 'password')).toBe(true)
  })

  it('密码强度低时优先级为 high', () => {
    const breakdown = createBreakdown({
      password: { score: 5, max: 30, label: '密码强度' },
    })
    const advice = generateSecurityAdvice(breakdown)
    const passwordAdvice = advice.find((a) => a.id === 'password')
    expect(passwordAdvice.priority).toBe('high')
  })

  it('两步验证关闭时有两步验证建议', () => {
    const breakdown = createBreakdown({
      twoFA: { score: 0, max: 30, label: '两步验证' },
    })
    const advice = generateSecurityAdvice(breakdown)
    expect(advice.some((a) => a.id === 'twofa')).toBe(true)
    const twoFAAdvice = advice.find((a) => a.id === 'twofa')
    expect(twoFAAdvice.priority).toBe('high')
  })

  it('有异地登录时有异地登录建议', () => {
    const breakdown = createBreakdown({
      remoteLogin: { score: 0, max: 20, label: '异地登录' },
    })
    const advice = generateSecurityAdvice(breakdown)
    expect(advice.some((a) => a.id === 'remote')).toBe(true)
    expect(advice.find((a) => a.id === 'remote').priority).toBe('high')
  })

  it('有异常操作时有异常操作建议', () => {
    const breakdown = createBreakdown({
      anomaly: { score: 0, max: 20, label: '异常操作' },
    })
    const advice = generateSecurityAdvice(breakdown)
    expect(advice.some((a) => a.id === 'anomaly')).toBe(true)
    expect(advice.find((a) => a.id === 'anomaly').priority).toBe('medium')
  })

  it('多项问题时有多条建议', () => {
    const breakdown = createBreakdown({
      password: { score: 10, max: 30, label: '密码强度' },
      twoFA: { score: 0, max: 30, label: '两步验证' },
      remoteLogin: { score: 0, max: 20, label: '异地登录' },
      anomaly: { score: 0, max: 20, label: '异常操作' },
    })
    const advice = generateSecurityAdvice(breakdown)
    expect(advice.length).toBe(4)
  })

  it('每条建议包含 id、priority、text 字段', () => {
    const breakdown = createBreakdown({
      password: { score: 10, max: 30, label: '密码强度' },
    })
    const advice = generateSecurityAdvice(breakdown)
    advice.forEach((a) => {
      expect(a.id).toBeTruthy()
      expect(a.priority).toBeTruthy()
      expect(a.text).toBeTruthy()
    })
  })
})

describe('copyToClipboardMock', () => {
  it('非空字符串返回 true', () => {
    expect(copyToClipboardMock('test')).toBe(true)
    expect(copyToClipboardMock('a')).toBe(true)
  })

  it('空字符串返回 false', () => {
    expect(copyToClipboardMock('')).toBe(false)
  })

  it('非字符串返回 false', () => {
    expect(copyToClipboardMock(null)).toBe(false)
    expect(copyToClipboardMock(undefined)).toBe(false)
    expect(copyToClipboardMock(123)).toBe(false)
    expect(copyToClipboardMock({})).toBe(false)
  })
})

describe('constants', () => {
  it('PAGE_SIZE_OPTIONS 包含合理的选项', () => {
    expect(PAGE_SIZE_OPTIONS).toContain(10)
    expect(PAGE_SIZE_OPTIONS).toContain(20)
    expect(PAGE_SIZE_OPTIONS).toContain(50)
  })

  it('WEAK_PASSWORDS 包含常见的弱密码', () => {
    expect(WEAK_PASSWORDS).toContain('password')
    expect(WEAK_PASSWORDS).toContain('123456')
    expect(WEAK_PASSWORDS).toContain('qwerty')
    expect(WEAK_PASSWORDS).toContain('admin')
  })

  it('STORAGE_KEY_FREQUENT_LOCATIONS 已定义', () => {
    expect(STORAGE_KEY_FREQUENT_LOCATIONS).toBeTruthy()
    expect(typeof STORAGE_KEY_FREQUENT_LOCATIONS).toBe('string')
  })

  it('DEFAULT_FREQUENT_LOCATIONS 包含默认常用城市', () => {
    expect(DEFAULT_FREQUENT_LOCATIONS).toContain('北京市')
    expect(DEFAULT_FREQUENT_LOCATIONS.length).toBeGreaterThanOrEqual(1)
  })
})
