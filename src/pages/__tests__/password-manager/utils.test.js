import { describe, it, expect } from 'vitest'
import {
  encodeBase64,
  decodeBase64,
  evaluatePasswordStrength,
  buildCharsetString,
  generatePassword,
  hasAtLeastOneCharset,
  maskAccount,
  getMaskedPassword,
  validateMasterPassword,
  verifyMasterPassword,
  createLockState,
  checkLock,
  recordFailedAttempt,
  resetLockState,
  isDuplicateEntry,
  filterEntriesByGroup,
  searchEntries,
  getGroupEntryCount,
  formatTimestamp,
  exportData,
  importData,
} from '../../password-manager/utils'
import { STRENGTH_LEVELS, PASSWORD_MASK } from '../../password-manager/constants'

describe('encodeBase64 / decodeBase64', () => {
  it('should encode and decode a simple string', () => {
    const original = 'hello world'
    const encoded = encodeBase64(original)
    expect(encoded).toBe(btoa(unescape(encodeURIComponent(original))))
    expect(decodeBase64(encoded)).toBe(original)
  })

  it('should handle unicode characters', () => {
    const original = '密码管理器🔑'
    const encoded = encodeBase64(original)
    expect(decodeBase64(encoded)).toBe(original)
  })

  it('should return empty string for null/undefined input', () => {
    expect(encodeBase64(null)).toBe('')
    expect(encodeBase64(undefined)).toBe('')
    expect(decodeBase64(null)).toBe('')
    expect(decodeBase64(undefined)).toBe('')
  })

  it('should return empty string for invalid base64 on decode', () => {
    expect(decodeBase64('!!!invalid!!!')).toBe('')
  })

  it('should handle empty string', () => {
    expect(encodeBase64('')).toBe('')
    expect(decodeBase64('')).toBe('')
  })
})

describe('evaluatePasswordStrength', () => {
  it('should return weak for null/undefined', () => {
    expect(evaluatePasswordStrength(null, null)).toEqual(STRENGTH_LEVELS.weak)
    expect(evaluatePasswordStrength(undefined, undefined)).toEqual(STRENGTH_LEVELS.weak)
  })

  it('should return weak for single charset', () => {
    const flags = { uppercase: true, lowercase: false, digits: false, symbols: false }
    expect(evaluatePasswordStrength('ABCDEF', flags)).toEqual(STRENGTH_LEVELS.weak)
  })

  it('should return medium for two charsets', () => {
    const flags = { uppercase: true, lowercase: true, digits: false, symbols: false }
    expect(evaluatePasswordStrength('Abcdef', flags)).toEqual(STRENGTH_LEVELS.medium)
  })

  it('should return medium for three+ charsets with length < 12', () => {
    const flags = { uppercase: true, lowercase: true, digits: true, symbols: false }
    expect(evaluatePasswordStrength('Abc123', flags)).toEqual(STRENGTH_LEVELS.medium)
  })

  it('should return strong for three+ charsets with length >= 12', () => {
    const flags = { uppercase: true, lowercase: true, digits: true, symbols: false }
    expect(evaluatePasswordStrength('Abcdefgh1234', flags)).toEqual(STRENGTH_LEVELS.strong)
  })

  it('should return strong for four charsets with length >= 12', () => {
    const flags = { uppercase: true, lowercase: true, digits: true, symbols: true }
    expect(evaluatePasswordStrength('Abcdefgh1234!@', flags)).toEqual(STRENGTH_LEVELS.strong)
  })
})

describe('buildCharsetString', () => {
  it('should return empty string when all flags are false', () => {
    const flags = { uppercase: false, lowercase: false, digits: false, symbols: false }
    expect(buildCharsetString(flags)).toBe('')
  })

  it('should include uppercase characters', () => {
    const flags = { uppercase: true, lowercase: false, digits: false, symbols: false }
    expect(buildCharsetString(flags)).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  })

  it('should include lowercase characters', () => {
    const flags = { uppercase: false, lowercase: true, digits: false, symbols: false }
    expect(buildCharsetString(flags)).toBe('abcdefghijklmnopqrstuvwxyz')
  })

  it('should combine multiple charsets', () => {
    const flags = { uppercase: true, lowercase: true, digits: true, symbols: false }
    const result = buildCharsetString(flags)
    expect(result).toContain('A')
    expect(result).toContain('a')
    expect(result).toContain('0')
    expect(result).not.toContain('!')
  })
})

describe('generatePassword', () => {
  it('should return empty string when no charsets selected', () => {
    const flags = { uppercase: false, lowercase: false, digits: false, symbols: false }
    expect(generatePassword(16, flags)).toBe('')
  })

  it('should generate password of specified length', () => {
    const flags = { uppercase: true, lowercase: true, digits: true, symbols: false }
    const pwd = generatePassword(20, flags)
    expect(pwd.length).toBe(20)
  })

  it('should include at least one character from each selected charset', () => {
    const flags = { uppercase: true, lowercase: true, digits: true, symbols: false }
    for (let i = 0; i < 20; i += 1) {
      const pwd = generatePassword(16, flags)
      expect(/[A-Z]/.test(pwd)).toBe(true)
      expect(/[a-z]/.test(pwd)).toBe(true)
      expect(/[0-9]/.test(pwd)).toBe(true)
    }
  })

  it('should generate different passwords on successive calls (probabilistic)', () => {
    const flags = { uppercase: true, lowercase: true, digits: true, symbols: false }
    const passwords = new Set()
    for (let i = 0; i < 10; i += 1) {
      passwords.add(generatePassword(16, flags))
    }
    expect(passwords.size).toBeGreaterThan(1)
  })

  it('should handle minimum length with guaranteed chars', () => {
    const flags = { uppercase: true, lowercase: false, digits: false, symbols: false }
    const pwd = generatePassword(1, flags)
    expect(pwd.length).toBe(1)
    expect(/[A-Z]/.test(pwd)).toBe(true)
  })
})

describe('hasAtLeastOneCharset', () => {
  it('should return false when all are false', () => {
    expect(hasAtLeastOneCharset({ uppercase: false, lowercase: false, digits: false, symbols: false })).toBe(false)
  })

  it('should return true when at least one is true', () => {
    expect(hasAtLeastOneCharset({ uppercase: true, lowercase: false, digits: false, symbols: false })).toBe(true)
  })

  it('should return true when all are true', () => {
    expect(hasAtLeastOneCharset({ uppercase: true, lowercase: true, digits: true, symbols: true })).toBe(true)
  })
})

describe('maskAccount', () => {
  it('should return empty string for falsy input', () => {
    expect(maskAccount('')).toBe('')
    expect(maskAccount(null)).toBe('')
    expect(maskAccount(undefined)).toBe('')
  })

  it('should mask email with @ symbol', () => {
    expect(maskAccount('vince@gmail.com')).toBe('vin***@gmail.com')
  })

  it('should mask email with short local part', () => {
    expect(maskAccount('ab@test.com')).toBe('ab***@test.com')
  })

  it('should mask non-email string', () => {
    expect(maskAccount('username123')).toBe('use***')
  })

  it('should handle short string without @', () => {
    expect(maskAccount('abc')).toBe('abc')
  })

  it('should handle 4-char string without @', () => {
    expect(maskAccount('abcd')).toBe('abc***')
  })

  it('should handle local part exactly 3 chars', () => {
    expect(maskAccount('abc@domain.com')).toBe('abc***@domain.com')
  })
})

describe('getMaskedPassword', () => {
  it('should return fixed mask string', () => {
    expect(getMaskedPassword()).toBe(PASSWORD_MASK)
    expect(getMaskedPassword()).toBe('••••••••')
  })
})

describe('validateMasterPassword', () => {
  it('should reject null/undefined', () => {
    expect(validateMasterPassword(null).valid).toBe(false)
    expect(validateMasterPassword(undefined).valid).toBe(false)
  })

  it('should reject empty string', () => {
    expect(validateMasterPassword('').valid).toBe(false)
  })

  it('should reject password shorter than 6 characters', () => {
    expect(validateMasterPassword('12345').valid).toBe(false)
  })

  it('should accept password with exactly 6 characters', () => {
    expect(validateMasterPassword('123456').valid).toBe(true)
  })

  it('should accept long password', () => {
    expect(validateMasterPassword('this-is-a-long-password').valid).toBe(true)
  })

  it('should return error message', () => {
    const result = validateMasterPassword('123')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('verifyMasterPassword', () => {
  it('should return false for null inputs', () => {
    expect(verifyMasterPassword(null, null)).toBe(false)
    expect(verifyMasterPassword('test', null)).toBe(false)
    expect(verifyMasterPassword(null, 'encoded')).toBe(false)
  })

  it('should return true for matching password', () => {
    const password = 'mypassword123'
    const encoded = encodeBase64(password)
    expect(verifyMasterPassword(password, encoded)).toBe(true)
  })

  it('should return false for wrong password', () => {
    const encoded = encodeBase64('correct-password')
    expect(verifyMasterPassword('wrong-password', encoded)).toBe(false)
  })
})

describe('createLockState', () => {
  it('should create initial lock state', () => {
    const state = createLockState()
    expect(state.attempts).toBe(0)
    expect(state.lockedUntil).toBeNull()
  })
})

describe('checkLock', () => {
  it('should return not locked for null state', () => {
    const result = checkLock(null)
    expect(result.locked).toBe(false)
    expect(result.remainingMs).toBe(0)
  })

  it('should return not locked when lock has expired', () => {
    const state = { attempts: 3, lockedUntil: Date.now() - 1000 }
    const result = checkLock(state)
    expect(result.locked).toBe(false)
    expect(result.remainingMs).toBe(0)
  })

  it('should return locked when still within lock period', () => {
    const state = { attempts: 3, lockedUntil: Date.now() + 10000 }
    const result = checkLock(state)
    expect(result.locked).toBe(true)
    expect(result.remainingMs).toBeGreaterThan(0)
  })

  it('should return not locked when lockedUntil is null', () => {
    const state = { attempts: 1, lockedUntil: null }
    const result = checkLock(state)
    expect(result.locked).toBe(false)
  })
})

describe('recordFailedAttempt', () => {
  it('should increment attempts from null state', () => {
    const result = recordFailedAttempt(null)
    expect(result.attempts).toBe(1)
    expect(result.lockedUntil).toBeNull()
  })

  it('should increment attempts', () => {
    const state = { attempts: 1, lockedUntil: null }
    const result = recordFailedAttempt(state)
    expect(result.attempts).toBe(2)
    expect(result.lockedUntil).toBeNull()
  })

  it('should lock after 3 failed attempts', () => {
    const state = { attempts: 2, lockedUntil: null }
    const result = recordFailedAttempt(state)
    expect(result.attempts).toBe(3)
    expect(result.lockedUntil).toBeGreaterThan(Date.now())
  })

  it('should not lock before 3 attempts', () => {
    const state1 = { attempts: 0, lockedUntil: null }
    expect(recordFailedAttempt(state1).lockedUntil).toBeNull()

    const state2 = { attempts: 1, lockedUntil: null }
    expect(recordFailedAttempt(state2).lockedUntil).toBeNull()
  })
})

describe('resetLockState', () => {
  it('should return fresh lock state', () => {
    const state = resetLockState()
    expect(state.attempts).toBe(0)
    expect(state.lockedUntil).toBeNull()
  })
})

describe('isDuplicateEntry', () => {
  const existing = [
    { id: '1', title: '微信', account: 'user1@wx.com' },
    { id: '2', title: 'Gmail', account: 'user2@gmail.com' },
  ]

  it('should return false for null entry', () => {
    expect(isDuplicateEntry(null, existing)).toBe(false)
  })

  it('should return false for null entries list', () => {
    expect(isDuplicateEntry({ title: 'test', account: 'a@b.com' }, null)).toBe(false)
  })

  it('should detect duplicate by title + account', () => {
    expect(isDuplicateEntry({ title: '微信', account: 'user1@wx.com' }, existing)).toBe(true)
  })

  it('should not match when only title matches', () => {
    expect(isDuplicateEntry({ title: '微信', account: 'other@wx.com' }, existing)).toBe(false)
  })

  it('should not match when only account matches', () => {
    expect(isDuplicateEntry({ title: '其他', account: 'user1@wx.com' }, existing)).toBe(false)
  })

  it('should not match when neither matches', () => {
    expect(isDuplicateEntry({ title: '新条目', account: 'new@test.com' }, existing)).toBe(false)
  })

  it('should return false for empty entries', () => {
    expect(isDuplicateEntry({ title: 'test', account: 'a@b.com' }, [])).toBe(false)
  })
})

describe('filterEntriesByGroup', () => {
  const entries = [
    { id: '1', groupId: 'g1', title: 'A' },
    { id: '2', groupId: 'g2', title: 'B' },
    { id: '3', groupId: 'g1', title: 'C' },
  ]

  it('should return all entries for "all" group', () => {
    expect(filterEntriesByGroup(entries, 'all')).toHaveLength(3)
  })

  it('should return all entries for null groupId', () => {
    expect(filterEntriesByGroup(entries, null)).toHaveLength(3)
  })

  it('should filter by specific group', () => {
    expect(filterEntriesByGroup(entries, 'g1')).toHaveLength(2)
    expect(filterEntriesByGroup(entries, 'g2')).toHaveLength(1)
  })

  it('should return empty for non-existent group', () => {
    expect(filterEntriesByGroup(entries, 'g99')).toHaveLength(0)
  })
})

describe('searchEntries', () => {
  const entries = [
    { id: '1', title: '微信', account: 'wechat@user.com' },
    { id: '2', title: 'Gmail邮箱', account: 'user@gmail.com' },
    { id: '3', title: '银行App', account: 'bank@user.com' },
  ]

  it('should return all entries for empty keyword', () => {
    expect(searchEntries(entries, '')).toHaveLength(3)
    expect(searchEntries(entries, null)).toHaveLength(3)
    expect(searchEntries(entries, '   ')).toHaveLength(3)
  })

  it('should search by title (case insensitive)', () => {
    expect(searchEntries(entries, '微信')).toHaveLength(1)
    expect(searchEntries(entries, 'gmail')).toHaveLength(1)
  })

  it('should search by account', () => {
    expect(searchEntries(entries, 'gmail.com')).toHaveLength(1)
    expect(searchEntries(entries, 'user.com')).toHaveLength(2)
  })

  it('should return empty for no matches', () => {
    expect(searchEntries(entries, 'notfound')).toHaveLength(0)
  })
})

describe('getGroupEntryCount', () => {
  const entries = [
    { id: '1', groupId: 'g1' },
    { id: '2', groupId: 'g2' },
    { id: '3', groupId: 'g1' },
  ]

  it('should return total count for "all"', () => {
    expect(getGroupEntryCount(entries, 'all')).toBe(3)
  })

  it('should return count for specific group', () => {
    expect(getGroupEntryCount(entries, 'g1')).toBe(2)
    expect(getGroupEntryCount(entries, 'g2')).toBe(1)
  })

  it('should return 0 for non-existent group', () => {
    expect(getGroupEntryCount(entries, 'g99')).toBe(0)
  })
})

describe('formatTimestamp', () => {
  it('should treat timestamp 0 as a valid value (not empty)', () => {
    const result = formatTimestamp(0)
    expect(result).toBeTruthy()
    expect(result).toContain('1970')
  })

  it('should return empty string for null/undefined/NaN', () => {
    expect(formatTimestamp(null)).toBe('')
    expect(formatTimestamp(undefined)).toBe('')
    expect(formatTimestamp(NaN)).toBe('')
  })

  it('should return empty string for non-number types', () => {
    expect(formatTimestamp('2024-01-01')).toBe('')
    expect(formatTimestamp({})).toBe('')
  })

  it('should format valid timestamp', () => {
    const ts = new Date('2024-06-15T10:30:00').getTime()
    const result = formatTimestamp(ts)
    expect(result).toContain('2024')
    expect(result).toContain('06')
    expect(result).toContain('15')
    expect(result).toContain('10')
    expect(result).toContain('30')
  })
})

describe('exportData', () => {
  it('should export entries with Base64 encoded passwords', () => {
    const entries = [
      { id: '1', title: 'Test', account: 'a@b.com', password: 'secret123', groupId: 'g1' },
    ]
    const groups = [
      { id: 'all', name: '全部', isPreset: true },
      { id: 'g1', name: '社交', isPreset: true },
    ]
    const result = exportData(entries, groups)
    expect(result.version).toBe(1)
    expect(result.warning).toContain('Base64')
    expect(result.entries[0].password).toBe(encodeBase64('secret123'))
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].id).toBe('g1')
  })

  it('should filter out "all" group from export', () => {
    const groups = [
      { id: 'all', name: '全部', isPreset: true },
      { id: 'g1', name: '社交', isPreset: true },
    ]
    const result = exportData([], groups)
    expect(result.groups).toHaveLength(1)
  })
})

describe('importData', () => {
  const existingEntries = [
    { id: '1', title: '微信', account: 'a@b.com', password: 'pass1' },
  ]
  const existingGroups = [
    { id: 'all', name: '全部', isPreset: true },
    { id: 'g1', name: '社交', isPreset: true },
  ]

  it('should handle null/invalid import data', () => {
    const result = importData(null, existingEntries, existingGroups)
    expect(result.imported).toBe(0)
    expect(result.skipped).toBe(0)
  })

  it('should import new entries and decode passwords', () => {
    const jsonData = {
      groups: [],
      entries: [
        { id: '2', title: '新条目', account: 'c@d.com', password: encodeBase64('newpass') },
      ],
    }
    const result = importData(jsonData, existingEntries, existingGroups)
    expect(result.imported).toBe(1)
    expect(result.skipped).toBe(0)
    expect(result.entries[1].password).toBe('newpass')
  })

  it('should skip duplicate entries', () => {
    const jsonData = {
      groups: [],
      entries: [
        { id: '2', title: '微信', account: 'a@b.com', password: encodeBase64('pass2') },
      ],
    }
    const result = importData(jsonData, existingEntries, existingGroups)
    expect(result.imported).toBe(0)
    expect(result.skipped).toBe(1)
  })

  it('should import new groups', () => {
    const jsonData = {
      groups: [{ id: 'g2', name: '新分组', isPreset: false }],
      entries: [],
    }
    const result = importData(jsonData, existingEntries, existingGroups)
    expect(result.groups).toHaveLength(3)
    expect(result.groups[2].name).toBe('新分组')
  })

  it('should not duplicate existing groups', () => {
    const jsonData = {
      groups: [{ id: 'g1', name: '社交', isPreset: true }],
      entries: [],
    }
    const result = importData(jsonData, existingEntries, existingGroups)
    expect(result.groups).toHaveLength(2)
  })
})
