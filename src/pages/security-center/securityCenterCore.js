import {
    BROWSER_LIST,
    CITIES,
    DEFAULT_FREQUENT_LOCATIONS,
    DEFAULT_PAGE_SIZE,
    DEVICE_NAMES,
    FREQUENT_CITY,
    OPERATION_RESULTS,
    OPERATION_TYPES,
    OS_LIST,
    PASSWORD_STRENGTH,
    SCORE_COLORS,
    SCORE_WEIGHTS,
    STORAGE_KEY_DEVICES,
    STORAGE_KEY_FREQUENT_LOCATIONS,
    STORAGE_KEY_OPERATIONS,
    STORAGE_KEY_TWOFA,
    WEAK_PASSWORDS,
} from './constants'

export function generateId() {
  return 'sc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

export function generateIpAddress() {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`
}

export function generateBase32Secret(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\`~]/

export function checkPasswordCharTypes(password) {
  if (!password) return { uppercase: false, lowercase: false, number: false, special: false, count: 0 }
  const uppercase = /[A-Z]/.test(password)
  const lowercase = /[a-z]/.test(password)
  const number = /[0-9]/.test(password)
  const special = SPECIAL_CHAR_REGEX.test(password)
  const count = [uppercase, lowercase, number, special].filter(Boolean).length
  return { uppercase, lowercase, number, special, count }
}

export function hasConsecutiveRepeats(password, minRepeat = 3) {
  if (!password || password.length < minRepeat) return false
  for (let i = 0; i <= password.length - minRepeat; i++) {
    const ch = password[i]
    let repeat = 1
    for (let j = i + 1; j < password.length && password[j] === ch; j++) {
      repeat++
    }
    if (repeat >= minRepeat) return true
  }
  return false
}

const WEAK_PASSWORD_REGEX_CACHE = new Map()
const MAX_WEAK_SUFFIX_LEN = 4
const LETTERS_ONLY_REGEX = /^[a-z]+$/
const SUFFIX_CHARS = '0-9!@#$%^&*()_+\\-=[\\]{}|;:\'",.<>?/\\\\`~'

function getWeakPasswordPattern(wp) {
  if (WEAK_PASSWORD_REGEX_CACHE.has(wp)) {
    return WEAK_PASSWORD_REGEX_CACHE.get(wp)
  }
  const escaped = wp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `^${escaped}[${SUFFIX_CHARS}]{0,${MAX_WEAK_SUFFIX_LEN}}$`,
    'i'
  )
  WEAK_PASSWORD_REGEX_CACHE.set(wp, pattern)
  return pattern
}

export function isCommonWeakPassword(password) {
  if (!password) return false
  const lower = password.toLowerCase()
  return WEAK_PASSWORDS.some((wp) => {
    if (lower === wp) return true
    if (!LETTERS_ONLY_REGEX.test(wp)) return false
    if (password.length > wp.length + MAX_WEAK_SUFFIX_LEN) return false
    const pattern = getWeakPasswordPattern(wp)
    return pattern.test(password)
  })
}

export function evaluatePasswordStrength(password) {
  if (!password) {
    return {
      ...PASSWORD_STRENGTH.VERY_WEAK,
      progress: 0,
      suggestions: [],
    }
  }

  const len = password.length
  const types = checkPasswordCharTypes(password)
  const suggestions = []
  const hasRepeats = hasConsecutiveRepeats(password)
  const isWeak = isCommonWeakPassword(password)

  if (len < 6) {
    suggestions.push('密码长度至少为 6 位')
  }
  if (!types.uppercase) {
    suggestions.push('建议包含大写字母')
  }
  if (!types.lowercase) {
    suggestions.push('建议包含小写字母')
  }
  if (!types.number) {
    suggestions.push('建议包含数字')
  }
  if (!types.special) {
    suggestions.push('建议包含特殊字符（如 !@#$% 等）')
  }
  if (len >= 6 && len < 8) {
    suggestions.push('建议将密码长度增加到 8 位以上')
  } else if (len >= 8 && len < 12) {
    suggestions.push('建议将密码长度增加到 12 位以上以获得最高强度')
  }
  if (hasRepeats) {
    suggestions.push('避免连续重复字符（如 AAAA、1111）')
  }
  if (isWeak) {
    suggestions.push('避免使用常见弱密码（如 password、123456、qwerty）')
  }

  let strength
  let progress

  if (len < 6) {
    strength = PASSWORD_STRENGTH.VERY_WEAK
    progress = 10
  } else if (len >= 6 && len < 8) {
    if (types.count <= 1) {
      strength = PASSWORD_STRENGTH.WEAK
      progress = 20
    } else {
      strength = PASSWORD_STRENGTH.MEDIUM
      progress = 40 + types.count * 10
    }
  } else if (len >= 8 && len < 12) {
    if (types.count >= 3) {
      strength = PASSWORD_STRENGTH.STRONG
      progress = 80
    } else if (types.count === 2) {
      strength = PASSWORD_STRENGTH.MEDIUM
      progress = 50
    } else {
      strength = PASSWORD_STRENGTH.WEAK
      progress = 25
    }
  } else {
    if (types.count === 4) {
      strength = PASSWORD_STRENGTH.VERY_STRONG
      progress = 100
    } else if (types.count >= 3) {
      strength = PASSWORD_STRENGTH.STRONG
      progress = 85
    } else if (types.count === 2) {
      strength = PASSWORD_STRENGTH.MEDIUM
      progress = 55
    } else {
      strength = PASSWORD_STRENGTH.WEAK
      progress = 30
    }
  }

  if (hasRepeats) {
    if (strength.level >= PASSWORD_STRENGTH.STRONG.level) {
      strength = PASSWORD_STRENGTH.MEDIUM
      progress = Math.min(progress, 55)
    } else if (strength.level >= PASSWORD_STRENGTH.MEDIUM.level) {
      progress = Math.min(progress, 40)
    }
  }

  if (isWeak) {
    strength = PASSWORD_STRENGTH.WEAK
    progress = Math.min(progress, 20)
  }

  return {
    ...strength,
    progress,
    suggestions,
  }
}

export function getPasswordScore(password) {
  if (!password) return 0
  const result = evaluatePasswordStrength(password)
  return Math.round((result.progress / 100) * SCORE_WEIGHTS.PASSWORD)
}

export function generateMockDevices(frequentLocations = DEFAULT_FREQUENT_LOCATIONS) {
  const now = Date.now()
  const devices = []
  const primaryCity = frequentLocations[0] || FREQUENT_CITY

  devices.push({
    id: generateId(),
    name: 'Windows PC',
    os: 'Windows 11',
    browser: 'Chrome 120',
    ip: '192.168.1.100',
    loginTime: now,
    location: primaryCity,
    isCurrent: true,
  })

  const remoteCities = CITIES.filter(c => !frequentLocations.includes(c))
  const localCities = CITIES.filter(c => frequentLocations.includes(c))
  const remoteIndices = new Set()
  while (remoteIndices.size < 2) {
    remoteIndices.add(randomInt(0, 2))
  }

  for (let i = 0; i < 4; i++) {
    const isRemote = remoteIndices.has(i)
    const hoursAgo = randomInt(1, 720)
    const location = isRemote
      ? (remoteCities.length > 0 ? randomItem(remoteCities) : randomItem(CITIES.filter(c => c !== primaryCity)))
      : (localCities.length > 0 ? randomItem(localCities) : primaryCity)
    devices.push({
      id: generateId(),
      name: randomItem(DEVICE_NAMES),
      os: randomItem(OS_LIST),
      browser: randomItem(BROWSER_LIST),
      ip: generateIpAddress(),
      loginTime: now - hoursAgo * 60 * 60 * 1000,
      location,
      isCurrent: false,
    })
  }

  devices.sort((a, b) => b.loginTime - a.loginTime)
  return devices
}

export function removeDevice(devices, deviceId) {
  return devices.filter(d => d.id !== deviceId)
}

export function hasRemoteLogin(devices, frequentLocations = DEFAULT_FREQUENT_LOCATIONS) {
  return devices.some(d => !d.isCurrent && !frequentLocations.includes(d.location))
}

export function isDeviceRemote(device, frequentLocations = DEFAULT_FREQUENT_LOCATIONS) {
  if (device.isCurrent) return false
  return !frequentLocations.includes(device.location)
}

export function loadFrequentLocations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FREQUENT_LOCATIONS)
    if (!raw) return [...DEFAULT_FREQUENT_LOCATIONS]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_FREQUENT_LOCATIONS]
    return parsed.filter(item => typeof item === 'string' && item.trim().length > 0)
  } catch {
    return [...DEFAULT_FREQUENT_LOCATIONS]
  }
}

export function saveFrequentLocations(locations) {
  try {
    localStorage.setItem(STORAGE_KEY_FREQUENT_LOCATIONS, JSON.stringify(locations))
    return true
  } catch {
    return false
  }
}

export function loadDevices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEVICES)
    if (!raw) return generateMockDevices()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return generateMockDevices()
    if (parsed.length === 0) return generateMockDevices()
    return parsed
  } catch {
    return generateMockDevices()
  }
}

export function saveDevices(devices) {
  try {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devices))
    return true
  } catch {
    return false
  }
}

export function loadTwoFAStatus() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TWOFA)
    if (!raw) return { enabled: false, secret: '' }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return { enabled: false, secret: '' }
    }
    return {
      enabled: !!parsed.enabled,
      secret: parsed.secret || '',
    }
  } catch {
    return { enabled: false, secret: '' }
  }
}

export function saveTwoFAStatus(status) {
  try {
    localStorage.setItem(STORAGE_KEY_TWOFA, JSON.stringify(status))
    return true
  } catch {
    return false
  }
}

export function validateVerificationCode(code) {
  if (!code) return { valid: false, error: '请输入 6 位验证码' }
  const trimmed = code.trim()
  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false, error: '验证码必须是 6 位数字' }
  }
  return { valid: true, value: trimmed }
}

export function createOperationRecord(type, detail, ip, result = OPERATION_RESULTS.SUCCESS) {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type,
    detail,
    ip,
    result,
    isAnomaly: result === OPERATION_RESULTS.FAILURE,
  }
}

export function generateMockOperations(count = 15) {
  const now = Date.now()
  const records = []
  const types = Object.values(OPERATION_TYPES)

  for (let i = 0; i < count; i++) {
    const type = randomItem(types)
    const result = Math.random() < 0.9 ? OPERATION_RESULTS.SUCCESS : OPERATION_RESULTS.FAILURE
    const hoursAgo = randomInt(0, 720)
    let detail = ''
    switch (type) {
      case OPERATION_TYPES.LOGIN:
        detail = `通过 ${randomItem(BROWSER_LIST)} 登录系统`
        break
      case OPERATION_TYPES.PASSWORD_CHANGE:
        detail = result === OPERATION_RESULTS.SUCCESS ? '密码修改成功' : '密码修改失败（原密码错误）'
        break
      case OPERATION_TYPES.DEVICE_LOGOUT:
        detail = `强制下线设备 ${randomItem(DEVICE_NAMES)}`
        break
      case OPERATION_TYPES.TWOFA_ENABLE:
        detail = '两步验证已开启'
        break
      case OPERATION_TYPES.TWOFA_DISABLE:
        detail = '两步验证已关闭'
        break
      case OPERATION_TYPES.SETTINGS_CHANGE:
        detail = '更新安全通知设置'
        break
    }
    records.push({
      id: generateId(),
      timestamp: now - hoursAgo * 60 * 60 * 1000,
      type,
      detail,
      ip: generateIpAddress(),
      result,
      isAnomaly: result === OPERATION_RESULTS.FAILURE,
    })
  }

  records.sort((a, b) => b.timestamp - a.timestamp)
  return records
}

export function loadOperations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPERATIONS)
    if (!raw) return generateMockOperations(15)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return generateMockOperations(15)
    if (parsed.length === 0) return generateMockOperations(15)
    return parsed
  } catch {
    return generateMockOperations(15)
  }
}

export function saveOperations(operations) {
  try {
    localStorage.setItem(STORAGE_KEY_OPERATIONS, JSON.stringify(operations))
    return true
  } catch {
    return false
  }
}

export function appendOperation(operations, record) {
  return [record, ...operations]
}

export function hasRecentAnomaly(operations, hours = 72) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return operations.some(op => op.timestamp >= cutoff && op.isAnomaly)
}

export function paginateOperations(operations, page, pageSize = DEFAULT_PAGE_SIZE) {
  const total = operations.length
  const totalPage = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: operations.slice(start, end),
    total,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function calculateScoreBreakdown(password, twoFAEnabled, devices, operations, frequentLocations = DEFAULT_FREQUENT_LOCATIONS) {
  const passwordScore = getPasswordScore(password)
  const twoFAScore = twoFAEnabled ? SCORE_WEIGHTS.TWOFA : 0
  const remoteScore = hasRemoteLogin(devices, frequentLocations) ? 0 : SCORE_WEIGHTS.REMOTE_LOGIN
  const anomalyScore = hasRecentAnomaly(operations) ? 0 : SCORE_WEIGHTS.ANOMALY

  const total = passwordScore + twoFAScore + remoteScore + anomalyScore

  return {
    password: { score: passwordScore, max: SCORE_WEIGHTS.PASSWORD, label: '密码强度' },
    twoFA: { score: twoFAScore, max: SCORE_WEIGHTS.TWOFA, label: '两步验证' },
    remoteLogin: { score: remoteScore, max: SCORE_WEIGHTS.REMOTE_LOGIN, label: '异地登录' },
    anomaly: { score: anomalyScore, max: SCORE_WEIGHTS.ANOMALY, label: '异常操作' },
    total,
  }
}

export function getScoreColor(score) {
  if (score >= 80) return SCORE_COLORS.EXCELLENT
  if (score >= 60) return SCORE_COLORS.GOOD
  if (score >= 40) return SCORE_COLORS.WARNING
  return SCORE_COLORS.DANGER
}

export function getScoreLabel(score) {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  return '危险'
}

export function generateSecurityAdvice(breakdown) {
  const advice = []

  if (breakdown.password.score < breakdown.password.max) {
    advice.push({
      id: 'password',
      priority: breakdown.password.score < breakdown.password.max * 0.5 ? 'high' : 'medium',
      text: '建议修改为更强密码（包含大小写字母、数字和特殊字符，长度 12 位以上）',
    })
  }
  if (breakdown.twoFA.score === 0) {
    advice.push({
      id: 'twofa',
      priority: 'high',
      text: '建议开启两步验证以增强账户安全性',
    })
  }
  if (breakdown.remoteLogin.score === 0) {
    advice.push({
      id: 'remote',
      priority: 'high',
      text: '检测到异地登录记录，请确认是否为本人操作，否则请立即下线异常设备',
    })
  }
  if (breakdown.anomaly.score === 0) {
    advice.push({
      id: 'anomaly',
      priority: 'medium',
      text: '近期存在异常操作记录，建议检查操作详情并确认账户安全',
    })
  }

  if (advice.length === 0) {
    advice.push({
      id: 'excellent',
      priority: 'low',
      text: '您的账户安全性很高，继续保持良好的安全习惯！',
    })
  }

  return advice
}

export function copyToClipboardMock(text) {
  return typeof text === 'string' && text.length > 0
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < day * 30) return `${Math.floor(diff / day)} 天前`
  return formatDateTime(timestamp)
}
