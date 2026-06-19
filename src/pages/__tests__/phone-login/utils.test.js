import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  validatePhone,
  formatPhone,
  parsePhone,
  maskPhone,
  generateSmsCode,
  validateSmsCode,
  verifySmsCode,
  validateSliderPosition,
  generateSliderTarget,
  saveLoginInfo,
  getLoginInfo,
  isLoginExpired,
  hasValidLogin,
  clearLoginInfo,
  formatLoginTime,
  getProtocolText,
  SMS_COUNTDOWN_SECONDS,
  ERROR_LOCK_SECONDS,
  getCountdownButtonText,
  getNextCountdownValue,
  isCountdownActive,
  shouldResetOnPhoneChange,
  canRequestCode,
  getLockButtonText,
  getNextLockValue,
  isLocked,
  shouldTriggerLock,
} from '@/pages/phone-login/utils'

describe('validatePhone', () => {
  it('空手机号应返回错误', () => {
    expect(validatePhone('')).toBe('请输入手机号码')
    expect(validatePhone(null)).toBe('请输入手机号码')
    expect(validatePhone(undefined)).toBe('请输入手机号码')
  })

  it('非 1 开头的手机号应返回错误', () => {
    expect(validatePhone('23800138000')).toBe('请输入正确的手机号码')
    expect(validatePhone('01012345678')).toBe('请输入正确的手机号码')
  })

  it('长度不是 11 位应返回错误', () => {
    expect(validatePhone('1380013800')).toBe('请输入正确的手机号码')
    expect(validatePhone('138001380000')).toBe('请输入正确的手机号码')
    expect(validatePhone('138')).toBe('请输入正确的手机号码')
  })

  it('包含非数字字符应返回错误', () => {
    expect(validatePhone('1380013800a')).toBe('请输入正确的手机号码')
    expect(validatePhone('138-0013-8000')).toBe('请输入正确的手机号码')
  })

  it('合法手机号应返回空字符串', () => {
    expect(validatePhone('13800138000')).toBe('')
    expect(validatePhone('15912345678')).toBe('')
    expect(validatePhone('18888888888')).toBe('')
    expect(validatePhone('19999999999')).toBe('')
  })
})

describe('formatPhone', () => {
  it('空字符串应返回空字符串', () => {
    expect(formatPhone('')).toBe('')
    expect(formatPhone(null)).toBe('')
    expect(formatPhone(undefined)).toBe('')
  })

  it('3 位及以内不添加空格', () => {
    expect(formatPhone('1')).toBe('1')
    expect(formatPhone('13')).toBe('13')
    expect(formatPhone('138')).toBe('138')
  })

  it('4-7 位在第 3 位后加空格', () => {
    expect(formatPhone('1380')).toBe('138 0')
    expect(formatPhone('13800')).toBe('138 00')
    expect(formatPhone('1380013')).toBe('138 0013')
  })

  it('8-11 位添加两个空格', () => {
    expect(formatPhone('13800138')).toBe('138 0013 8')
    expect(formatPhone('13800138000')).toBe('138 0013 8000')
  })

  it('自动过滤非数字字符', () => {
    expect(formatPhone('138a0013b8000')).toBe('138 0013 8000')
    expect(formatPhone('138-0013-8000')).toBe('138 0013 8000')
    expect(formatPhone(' 138 0013 8000 ')).toBe('138 0013 8000')
  })
})

describe('parsePhone', () => {
  it('空值应返回空字符串', () => {
    expect(parsePhone('')).toBe('')
    expect(parsePhone(null)).toBe('')
  })

  it('应移除所有非数字字符', () => {
    expect(parsePhone('138 0013 8000')).toBe('13800138000')
    expect(parsePhone('138-0013-8000')).toBe('13800138000')
    expect(parsePhone('(138) 0013-8000')).toBe('13800138000')
  })

  it('纯数字应原样返回', () => {
    expect(parsePhone('13800138000')).toBe('13800138000')
  })
})

describe('maskPhone', () => {
  it('长度不足 7 位应原样返回', () => {
    expect(maskPhone('')).toBe('')
    expect(maskPhone('138')).toBe('138')
    expect(maskPhone('138001')).toBe('138001')
  })

  it('11 位手机号中间 4 位应脱敏为 ****', () => {
    expect(maskPhone('13800138000')).toBe('138****8000')
    expect(maskPhone('15912345678')).toBe('159****5678')
  })
})

describe('generateSmsCode', () => {
  it('应生成 6 位纯数字字符串', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateSmsCode()
      expect(code).toHaveLength(6)
      expect(/^\d{6}$/.test(code)).toBe(true)
    }
  })

  it('多次生成不应全部相同', () => {
    const codes = new Set()
    for (let i = 0; i < 20; i++) {
      codes.add(generateSmsCode())
    }
    expect(codes.size).toBeGreaterThan(1)
  })
})

describe('validateSmsCode', () => {
  it('空值应返回错误', () => {
    expect(validateSmsCode('')).toBe('请输入验证码')
    expect(validateSmsCode(null)).toBe('请输入验证码')
  })

  it('非 6 位应返回错误', () => {
    expect(validateSmsCode('12345')).toBe('请输入 6 位数字验证码')
    expect(validateSmsCode('1234567')).toBe('请输入 6 位数字验证码')
  })

  it('包含非数字应返回错误', () => {
    expect(validateSmsCode('12345a')).toBe('请输入 6 位数字验证码')
    expect(validateSmsCode('123 456')).toBe('请输入 6 位数字验证码')
  })

  it('6 位纯数字应返回空字符串', () => {
    expect(validateSmsCode('123456')).toBe('')
    expect(validateSmsCode('000000')).toBe('')
    expect(validateSmsCode('999999')).toBe('')
  })
})

describe('verifySmsCode', () => {
  it('相同验证码应返回 true', () => {
    expect(verifySmsCode('123456', '123456')).toBe(true)
    expect(verifySmsCode('000000', '000000')).toBe(true)
  })

  it('不同验证码应返回 false', () => {
    expect(verifySmsCode('123456', '123457')).toBe(false)
    expect(verifySmsCode('123456', '654321')).toBe(false)
  })

  it('大小写或类型不一致应返回 false', () => {
    expect(verifySmsCode('123456', 123456)).toBe(false)
  })
})

describe('validateSliderPosition', () => {
  it('完全相等应返回 true', () => {
    expect(validateSliderPosition(100, 100)).toBe(true)
    expect(validateSliderPosition(50, 50, 5)).toBe(true)
  })

  it('默认容差 ±5px 内应返回 true', () => {
    expect(validateSliderPosition(100, 95)).toBe(true)
    expect(validateSliderPosition(100, 105)).toBe(true)
    expect(validateSliderPosition(100, 98)).toBe(true)
    expect(validateSliderPosition(100, 102)).toBe(true)
  })

  it('超出默认容差应返回 false', () => {
    expect(validateSliderPosition(100, 94)).toBe(false)
    expect(validateSliderPosition(100, 106)).toBe(false)
    expect(validateSliderPosition(100, 50)).toBe(false)
  })

  it('自定义容差应生效', () => {
    expect(validateSliderPosition(100, 90, 10)).toBe(true)
    expect(validateSliderPosition(100, 110, 10)).toBe(true)
    expect(validateSliderPosition(100, 89, 10)).toBe(false)
    expect(validateSliderPosition(100, 111, 10)).toBe(false)
  })

  it('容差为 0 时必须完全相等', () => {
    expect(validateSliderPosition(100, 100, 0)).toBe(true)
    expect(validateSliderPosition(100, 101, 0)).toBe(false)
    expect(validateSliderPosition(100, 99, 0)).toBe(false)
  })
})

describe('generateSliderTarget', () => {
  it('应在合理范围内生成位置', () => {
    const trackWidth = 300
    const sliderWidth = 42
    for (let i = 0; i < 100; i++) {
      const target = generateSliderTarget(trackWidth, sliderWidth)
      expect(target).toBeGreaterThanOrEqual(10)
      expect(target).toBeLessThanOrEqual(trackWidth - sliderWidth - 10)
      expect(Number.isInteger(target)).toBe(true)
    }
  })

  it('多轮生成不应全部相同', () => {
    const values = new Set()
    for (let i = 0; i < 50; i++) {
      values.add(generateSliderTarget(300, 42))
    }
    expect(values.size).toBeGreaterThan(1)
  })
})

describe('login storage functions', () => {
  const TEST_KEY = 'phone_login_info'
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

  describe('saveLoginInfo', () => {
    it('应成功保存登录信息到 localStorage', () => {
      const result = saveLoginInfo('13800138000')
      expect(result).toBe(true)
      const raw = localStorage.getItem(TEST_KEY)
      expect(raw).toBeTruthy()
      const data = JSON.parse(raw)
      expect(data.phone).toBe('13800138000')
      expect(typeof data.loginTime).toBe('number')
    })
  })

  describe('getLoginInfo', () => {
    it('无数据时应返回 null', () => {
      expect(getLoginInfo()).toBe(null)
    })

    it('格式错误应返回 null', () => {
      localStorage.setItem(TEST_KEY, 'not-json')
      expect(getLoginInfo()).toBe(null)
    })

    it('缺少字段应返回 null', () => {
      localStorage.setItem(TEST_KEY, JSON.stringify({ phone: '13800138000' }))
      expect(getLoginInfo()).toBe(null)
      localStorage.setItem(TEST_KEY, JSON.stringify({ loginTime: Date.now() }))
      expect(getLoginInfo()).toBe(null)
    })

    it('应正确读取有效数据', () => {
      const now = Date.now()
      localStorage.setItem(TEST_KEY, JSON.stringify({ phone: '13800138000', loginTime: now }))
      const info = getLoginInfo()
      expect(info).toEqual({ phone: '13800138000', loginTime: now })
    })
  })

  describe('isLoginExpired', () => {
    it('刚登录未过期应返回 false', () => {
      const now = Date.now()
      expect(isLoginExpired(now, now)).toBe(false)
      expect(isLoginExpired(now - 1000 * 60 * 60, now)).toBe(false)
      expect(isLoginExpired(now - 1000 * 60 * 60 * 23, now)).toBe(false)
    })

    it('刚好 24 小时应返回 true', () => {
      const now = Date.now()
      expect(isLoginExpired(now - 1000 * 60 * 60 * 24, now)).toBe(true)
    })

    it('超过 24 小时应返回 true', () => {
      const now = Date.now()
      expect(isLoginExpired(now - 1000 * 60 * 60 * 48, now)).toBe(true)
      expect(isLoginExpired(now - 1000 * 60 * 60 * 24 * 7, now)).toBe(true)
    })
  })

  describe('hasValidLogin', () => {
    it('无登录信息应返回 false', () => {
      expect(hasValidLogin()).toBe(false)
    })

    it('登录过期应返回 false', () => {
      const oldTime = Date.now() - 1000 * 60 * 60 * 48
      localStorage.setItem(TEST_KEY, JSON.stringify({ phone: '13800138000', loginTime: oldTime }))
      expect(hasValidLogin()).toBe(false)
    })

    it('有效登录信息应返回 true', () => {
      localStorage.setItem(TEST_KEY, JSON.stringify({ phone: '13800138000', loginTime: Date.now() }))
      expect(hasValidLogin()).toBe(true)
    })
  })

  describe('clearLoginInfo', () => {
    it('应清除登录信息并返回 true', () => {
      localStorage.setItem(TEST_KEY, JSON.stringify({ phone: '13800138000', loginTime: Date.now() }))
      const result = clearLoginInfo()
      expect(result).toBe(true)
      expect(localStorage.getItem(TEST_KEY)).toBe(null)
    })

    it('无数据时清除也应返回 true', () => {
      expect(clearLoginInfo()).toBe(true)
    })
  })
})

describe('formatLoginTime', () => {
  it('应正确格式化时间戳', () => {
    const ts = new Date(2025, 0, 15, 9, 30, 45).getTime()
    expect(formatLoginTime(ts)).toBe('2025-01-15 09:30:45')
  })

  it('个位数月日时分秒应补零', () => {
    const ts = new Date(2025, 0, 5, 8, 5, 3).getTime()
    expect(formatLoginTime(ts)).toBe('2025-01-05 08:05:03')
  })
})

describe('getProtocolText', () => {
  it('用户服务协议应返回非空内容', () => {
    const text = getProtocolText('service')
    expect(text).toBeTruthy()
    expect(text.length).toBeGreaterThan(100)
    expect(text).toContain('用户服务协议')
  })

  it('隐私政策应返回非空内容', () => {
    const text = getProtocolText('privacy')
    expect(text).toBeTruthy()
    expect(text.length).toBeGreaterThan(100)
    expect(text).toContain('隐私政策')
  })

  it('未知类型应返回空字符串', () => {
    expect(getProtocolText('unknown')).toBe('')
    expect(getProtocolText('')).toBe('')
  })
})

describe('countdown constants', () => {
  it('SMS_COUNTDOWN_SECONDS 应为 60', () => {
    expect(SMS_COUNTDOWN_SECONDS).toBe(60)
  })

  it('ERROR_LOCK_SECONDS 应为 30', () => {
    expect(ERROR_LOCK_SECONDS).toBe(30)
  })
})

describe('getCountdownButtonText', () => {
  it('倒计时大于 0 时应显示倒计时文案', () => {
    expect(getCountdownButtonText(60, false)).toBe('60 秒后重新发送')
    expect(getCountdownButtonText(30, false)).toBe('30 秒后重新发送')
    expect(getCountdownButtonText(1, true)).toBe('1 秒后重新发送')
  })

  it('倒计时为 0 且从未请求过应显示获取验证码', () => {
    expect(getCountdownButtonText(0, false)).toBe('获取验证码')
  })

  it('倒计时为 0 且之前请求过应显示重新获取验证码', () => {
    expect(getCountdownButtonText(0, true)).toBe('重新获取验证码')
  })

  it('倒计时优先于历史状态显示', () => {
    expect(getCountdownButtonText(10, true)).toBe('10 秒后重新发送')
    expect(getCountdownButtonText(10, false)).toBe('10 秒后重新发送')
  })
})

describe('getNextCountdownValue', () => {
  it('大于 1 时应减 1', () => {
    expect(getNextCountdownValue(60)).toBe(59)
    expect(getNextCountdownValue(2)).toBe(1)
    expect(getNextCountdownValue(100)).toBe(99)
  })

  it('等于 1 时应归零', () => {
    expect(getNextCountdownValue(1)).toBe(0)
  })

  it('小于等于 0 时应归零', () => {
    expect(getNextCountdownValue(0)).toBe(0)
    expect(getNextCountdownValue(-1)).toBe(0)
  })
})

describe('isCountdownActive', () => {
  it('大于 0 应返回 true', () => {
    expect(isCountdownActive(1)).toBe(true)
    expect(isCountdownActive(60)).toBe(true)
    expect(isCountdownActive(100)).toBe(true)
  })

  it('等于 0 应返回 false', () => {
    expect(isCountdownActive(0)).toBe(false)
  })

  it('小于 0 应返回 false', () => {
    expect(isCountdownActive(-1)).toBe(false)
  })
})

describe('shouldResetOnPhoneChange', () => {
  it('倒计时中手机号变更应返回 true', () => {
    expect(shouldResetOnPhoneChange('13800138000', '15912345678', 60)).toBe(true)
    expect(shouldResetOnPhoneChange('13800138000', '15912345678', 1)).toBe(true)
    expect(shouldResetOnPhoneChange('13800138000', '13800138001', 30)).toBe(true)
  })

  it('倒计时中手机号未变更应返回 false', () => {
    expect(shouldResetOnPhoneChange('13800138000', '13800138000', 60)).toBe(false)
    expect(shouldResetOnPhoneChange('13800138000', '13800138000', 1)).toBe(false)
  })

  it('不在倒计时中手机号变更应返回 false', () => {
    expect(shouldResetOnPhoneChange('13800138000', '15912345678', 0)).toBe(false)
    expect(shouldResetOnPhoneChange('13800138000', '15912345678', -1)).toBe(false)
  })

  it('不在倒计时中手机号未变更应返回 false', () => {
    expect(shouldResetOnPhoneChange('13800138000', '13800138000', 0)).toBe(false)
  })
})

describe('canRequestCode', () => {
  it('手机号有效且不在倒计时中应返回 true', () => {
    expect(canRequestCode(true, 0)).toBe(true)
  })

  it('手机号无效即使不在倒计时也应返回 false', () => {
    expect(canRequestCode(false, 0)).toBe(false)
  })

  it('倒计时中即使手机号有效也应返回 false', () => {
    expect(canRequestCode(true, 60)).toBe(false)
    expect(canRequestCode(true, 1)).toBe(false)
  })

  it('两者都不满足应返回 false', () => {
    expect(canRequestCode(false, 30)).toBe(false)
  })
})

describe('getLockButtonText', () => {
  it('锁定中应显示锁定倒计时文案', () => {
    expect(getLockButtonText(30)).toBe('30 秒后重试')
    expect(getLockButtonText(1)).toBe('1 秒后重试')
    expect(getLockButtonText(10)).toBe('10 秒后重试')
  })

  it('未锁定应显示登录', () => {
    expect(getLockButtonText(0)).toBe('登录')
  })
})

describe('getNextLockValue', () => {
  it('大于 1 时应减 1', () => {
    expect(getNextLockValue(30)).toBe(29)
    expect(getNextLockValue(2)).toBe(1)
    expect(getNextLockValue(10)).toBe(9)
  })

  it('等于 1 时应归零', () => {
    expect(getNextLockValue(1)).toBe(0)
  })

  it('小于等于 0 时应归零', () => {
    expect(getNextLockValue(0)).toBe(0)
    expect(getNextLockValue(-5)).toBe(0)
  })
})

describe('isLocked', () => {
  it('大于 0 应返回 true', () => {
    expect(isLocked(1)).toBe(true)
    expect(isLocked(30)).toBe(true)
  })

  it('等于 0 应返回 false', () => {
    expect(isLocked(0)).toBe(false)
  })

  it('小于 0 应返回 false', () => {
    expect(isLocked(-1)).toBe(false)
  })
})

describe('shouldTriggerLock', () => {
  it('错误次数大于等于 3 应返回 true', () => {
    expect(shouldTriggerLock(3)).toBe(true)
    expect(shouldTriggerLock(4)).toBe(true)
    expect(shouldTriggerLock(100)).toBe(true)
  })

  it('错误次数小于 3 应返回 false', () => {
    expect(shouldTriggerLock(0)).toBe(false)
    expect(shouldTriggerLock(1)).toBe(false)
    expect(shouldTriggerLock(2)).toBe(false)
  })
})
