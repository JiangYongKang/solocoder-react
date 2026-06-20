import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  formatTimestamp,
  encodeBase64,
  decodeBase64,
} from '../../password-manager/utils'
import {
  loadEntries,
  saveEntries,
  loadMasterPassword,
  saveMasterPassword,
} from '../../password-manager/storage'

function createLocalStorageMock() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    clear: () => { store.clear() },
    get length() { return store.size },
    key: (index) => Array.from(store.keys())[index] ?? null,
  }
}

const originalLocalStorage = typeof globalThis.localStorage !== 'undefined'
  ? globalThis.localStorage
  : undefined

beforeEach(() => {
  globalThis.localStorage = createLocalStorageMock()
})

afterEach(() => {
  if (originalLocalStorage !== undefined) {
    globalThis.localStorage = originalLocalStorage
  } else {
    delete globalThis.localStorage
  }
})

describe('formatTimestamp', () => {
  it('should handle timestamp 0 as a valid value', () => {
    const result = formatTimestamp(0)
    expect(result).toBeTruthy()
    expect(result).toContain('1970')
  })

  it('should return empty string for null', () => {
    expect(formatTimestamp(null)).toBe('')
  })

  it('should return empty string for undefined', () => {
    expect(formatTimestamp(undefined)).toBe('')
  })

  it('should return empty string for NaN', () => {
    expect(formatTimestamp(NaN)).toBe('')
  })

  it('should return empty string for non-number type', () => {
    expect(formatTimestamp('2024-01-01')).toBe('')
    expect(formatTimestamp({})).toBe('')
    expect(formatTimestamp([])).toBe('')
  })

  it('should format a normal timestamp correctly', () => {
    const ts = new Date('2024-06-15T10:30:00Z').getTime()
    const result = formatTimestamp(ts)
    expect(result).toContain('2024')
    expect(result).toContain('06')
    expect(result).toContain('15')
  })
})

describe('saveEntries / loadEntries (Base64 password encoding in storage)', () => {
  const STORAGE_KEY = 'pm_entries_v1'

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should encode passwords with Base64 when saving entries to localStorage', () => {
    const entries = [
      { id: '1', title: 'Test', account: 'a@b.com', password: 'secret123', groupId: 'g1' },
      { id: '2', title: 'Test2', account: 'c@d.com', password: '中文密码🔑', groupId: 'g2' },
    ]
    saveEntries(entries)
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(raw[0].password).toBe(encodeBase64('secret123'))
    expect(raw[1].password).toBe(encodeBase64('中文密码🔑'))
    expect(raw[0].password).not.toBe('secret123')
  })

  it('should decode Base64 passwords when loading entries from localStorage', () => {
    const entries = [
      { id: '1', title: 'Test', account: 'a@b.com', password: 'secret123', groupId: 'g1' },
      { id: '2', title: 'Test2', account: 'c@d.com', password: '中文密码🔑', groupId: 'g2' },
    ]
    saveEntries(entries)
    const loaded = loadEntries()
    expect(loaded).toHaveLength(2)
    expect(loaded[0].password).toBe('secret123')
    expect(loaded[1].password).toBe('中文密码🔑')
  })

  it('should handle empty entries list', () => {
    saveEntries([])
    expect(loadEntries()).toEqual([])
  })

  it('should handle missing localStorage value', () => {
    expect(loadEntries()).toEqual([])
  })

  it('should handle corrupted localStorage value (non-array)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: 'object' }))
    expect(loadEntries()).toEqual([])
  })

  it('should handle entries with empty password', () => {
    const entries = [
      { id: '1', title: 'Test', account: 'a@b.com', password: '', groupId: 'g1' },
    ]
    saveEntries(entries)
    const loaded = loadEntries()
    expect(loaded[0].password).toBe('')
  })

  it('should preserve non-password fields after save/load round-trip', () => {
    const entry = {
      id: '1',
      title: '微信',
      account: 'user@wx.com',
      password: 'mypassword',
      note: '我的主账号',
      url: 'https://weixin.qq.com',
      groupId: 'social',
      createdAt: 1700000000000,
      updatedAt: 1700000000001,
    }
    saveEntries([entry])
    const loaded = loadEntries()
    expect(loaded[0]).toEqual(entry)
    expect(loaded[0].password).toBe('mypassword')
  })
})

describe('saveMasterPassword / loadMasterPassword', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should save master password as Base64 encoded string', () => {
    saveMasterPassword('mymaster123')
    const raw = localStorage.getItem('pm_master_v1')
    expect(raw).toBe(encodeBase64('mymaster123'))
    expect(raw).not.toBe('mymaster123')
  })

  it('should load empty string when no master password is set', () => {
    expect(loadMasterPassword()).toBe('')
  })

  it('should load the Base64 encoded master password (not decoded)', () => {
    saveMasterPassword('hello世界')
    expect(loadMasterPassword()).toBe(encodeBase64('hello世界'))
  })
})
