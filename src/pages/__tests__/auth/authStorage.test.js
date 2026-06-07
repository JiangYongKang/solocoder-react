import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getToken,
  setToken,
  getUser,
  setUser,
  clearAuth,
  isLoggedIn,
} from '@/pages/auth/authStorage'

describe('authStorage', () => {
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

  describe('getToken / setToken', () => {
    it('初始状态 token 为空字符串', () => {
      expect(getToken()).toBe('')
    })

    it('setToken 后能通过 getToken 获取', () => {
      setToken('abc123')
      expect(getToken()).toBe('abc123')
    })

    it('多次 setToken 会覆盖前值', () => {
      setToken('first')
      setToken('second')
      expect(getToken()).toBe('second')
    })
  })

  describe('getUser / setUser', () => {
    it('初始状态 user 为 null', () => {
      expect(getUser()).toBe(null)
    })

    it('setUser 后能通过 getUser 获取对象', () => {
      const user = { email: 'test@example.com', nickname: 'Tester' }
      setUser(user)
      expect(getUser()).toEqual(user)
    })

    it('getUser 返回的是对象深拷贝（从 JSON 反序列化）', () => {
      const user = { email: 'a@b.com', nickname: 'A' }
      setUser(user)
      const retrieved = getUser()
      expect(retrieved).not.toBe(user)
      expect(retrieved).toEqual(user)
    })
  })

  describe('clearAuth', () => {
    it('clearAuth 会清空 token 和 user', () => {
      setToken('tok')
      setUser({ email: 'a@b.com' })
      clearAuth()
      expect(getToken()).toBe('')
      expect(getUser()).toBe(null)
    })

    it('未登录时 clearAuth 也能正常执行', () => {
      expect(clearAuth()).toBe(true)
    })
  })

  describe('isLoggedIn', () => {
    it('未设置 token 时返回 false', () => {
      expect(isLoggedIn()).toBe(false)
    })

    it('设置 token 后返回 true', () => {
      setToken('any')
      expect(isLoggedIn()).toBe(true)
    })

    it('clearAuth 后返回 false', () => {
      setToken('any')
      clearAuth()
      expect(isLoggedIn()).toBe(false)
    })
  })

  describe('localStorage 异常处理', () => {
    it('localStorage.getItem 抛错时 getToken 返回空字符串', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => {
          throw new Error('quota exceeded')
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      })
      expect(getToken()).toBe('')
    })

    it('localStorage 解析异常时 getUser 返回 null', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => (key === 'auth_user' ? '{invalid json' : null)),
        setItem: vi.fn((key, value) => {
          store[key] = String(value)
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      })
      expect(getUser()).toBe(null)
    })
  })
})
