import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateId,
  formatTime,
  formatFileSize,
  safeGetItem,
  safeSetItem,
  getLastMessagePreview,
  createTextMessage,
  createImageMessage,
  createFileMessage,
  createRandomReply,
  markAllRead,
  insertEmojiAtCursor,
  getRandomInterval,
  createInitialMessages,
  loadAllMessages,
  saveAllMessages,
  loadMessagesForContact,
  saveMessagesForContact,
  loadAllUnread,
  saveAllUnread,
  getUnreadCount,
  incrementUnread,
  clearUnread,
} from '../../chat/utils.js'
import { PRESET_REPLIES, STORAGE_KEY_MESSAGES, STORAGE_KEY_UNREAD } from '../../chat/data.js'

describe('chat utils', () => {
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

  describe('generateId', () => {
    it('应该生成以 msg- 开头的字符串', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.startsWith('msg-')).toBe(true)
    })

    it('应该生成不同的 ID', () => {
      const a = generateId()
      const b = generateId()
      expect(a).not.toBe(b)
    })
  })

  describe('formatTime', () => {
    it('应该正确格式化时间 HH:MM', () => {
      const d = new Date(2024, 0, 1, 9, 5, 0).getTime()
      expect(formatTime(d)).toBe('09:05')
    })

    it('应该对小时和分钟补零', () => {
      const d = new Date(2024, 0, 1, 0, 0, 0).getTime()
      expect(formatTime(d)).toBe('00:00')
    })
  })

  describe('formatFileSize', () => {
    it('应该返回字节单位', () => {
      expect(formatFileSize(100)).toBe('100 B')
    })

    it('应该返回 KB 单位', () => {
      expect(formatFileSize(2048)).toBe('2.0 KB')
    })

    it('应该返回 MB 单位', () => {
      expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB')
    })
  })

  describe('safeGetItem / safeSetItem', () => {
    it('应该正确写入和读取 JSON', () => {
      safeSetItem('k', { a: 1 })
      expect(safeGetItem('k', null)).toEqual({ a: 1 })
    })

    it('当 key 不存在时应返回 fallback', () => {
      expect(safeGetItem('not-exist', 42)).toBe(42)
    })

    it('当值不是合法 JSON 时应返回 fallback', () => {
      localStorage.setItem('bad', '{not json')
      expect(safeGetItem('bad', 'fallback')).toBe('fallback')
    })

    it('safeSetItem 失败时返回 false', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error('quota exceeded')
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      })
      expect(safeSetItem('k', 'v')).toBe(false)
    })
  })

  describe('loadAllMessages / saveAllMessages', () => {
    it('初始状态应返回空对象', () => {
      expect(loadAllMessages()).toEqual({})
    })

    it('saveAllMessages 之后能通过 loadAllMessages 读取', () => {
      const data = { 'contact-1': [{ id: 'a', content: 'hi' }] }
      expect(saveAllMessages(data)).toBe(true)
      expect(loadAllMessages()).toEqual(data)
    })

    it('多次 saveAllMessages 应该覆盖之前的值', () => {
      saveAllMessages({ 'contact-1': [1] })
      saveAllMessages({ 'contact-2': [2] })
      expect(loadAllMessages()).toEqual({ 'contact-2': [2] })
    })
  })

  describe('loadMessagesForContact / saveMessagesForContact', () => {
    it('contact 首次读取应返回初始消息', () => {
      const msgs = loadMessagesForContact('contact-1')
      expect(Array.isArray(msgs)).toBe(true)
      expect(msgs.length).toBeGreaterThan(0)
    })

    it('保存后能再次读取到相同内容', () => {
      const sample = [{ id: 'x', content: 'saved' }]
      saveMessagesForContact('contact-1', sample)
      expect(loadMessagesForContact('contact-1')).toEqual(sample)
    })

    it('不同联系人的消息相互独立', () => {
      saveMessagesForContact('contact-1', [{ id: 'a' }])
      saveMessagesForContact('contact-2', [{ id: 'b' }])
      expect(loadMessagesForContact('contact-1')).toEqual([{ id: 'a' }])
      expect(loadMessagesForContact('contact-2')).toEqual([{ id: 'b' }])
    })

    it('对不存在的 contact 返回空数组', () => {
      expect(loadMessagesForContact('nonexistent')).toEqual([])
    })
  })

  describe('createInitialMessages', () => {
    it('应为存在的 contact 返回 3 条消息', () => {
      const msgs = createInitialMessages('contact-1')
      expect(Array.isArray(msgs)).toBe(true)
      expect(msgs).toHaveLength(3)
      expect(msgs[0].senderId).toBe('contact-1')
      expect(msgs[1].senderId).toBe('me')
    })

    it('对不存在的 contact 返回空数组', () => {
      expect(createInitialMessages('not-exist')).toEqual([])
    })
  })

  describe('loadAllUnread / saveAllUnread', () => {
    it('初始状态应返回空对象', () => {
      expect(loadAllUnread()).toEqual({})
    })

    it('saveAllUnread 后可通过 loadAllUnread 读取', () => {
      const data = { 'contact-1': 3, 'contact-2': 0 }
      expect(saveAllUnread(data)).toBe(true)
      expect(loadAllUnread()).toEqual(data)
    })
  })

  describe('getUnreadCount / incrementUnread / clearUnread', () => {
    it('contact 初始未读数为 0', () => {
      expect(getUnreadCount('contact-1')).toBe(0)
    })

    it('incrementUnread 每次 +1 并返回新值', () => {
      expect(incrementUnread('contact-1')).toBe(1)
      expect(incrementUnread('contact-1')).toBe(2)
      expect(incrementUnread('contact-1')).toBe(3)
    })

    it('getUnreadCount 能读取 incrementUnread 的结果', () => {
      incrementUnread('contact-1')
      incrementUnread('contact-1')
      expect(getUnreadCount('contact-1')).toBe(2)
    })

    it('不同联系人的未读数相互独立', () => {
      incrementUnread('contact-1')
      incrementUnread('contact-1')
      incrementUnread('contact-2')
      expect(getUnreadCount('contact-1')).toBe(2)
      expect(getUnreadCount('contact-2')).toBe(1)
    })

    it('clearUnread 会将未读数清零并返回 0', () => {
      incrementUnread('contact-1')
      incrementUnread('contact-1')
      expect(clearUnread('contact-1')).toBe(0)
      expect(getUnreadCount('contact-1')).toBe(0)
    })

    it('clearUnread 不影响其他联系人', () => {
      incrementUnread('contact-1')
      incrementUnread('contact-2')
      clearUnread('contact-1')
      expect(getUnreadCount('contact-1')).toBe(0)
      expect(getUnreadCount('contact-2')).toBe(1)
    })
  })

  describe('getLastMessagePreview', () => {
    it('空数组应返回 暂无消息', () => {
      expect(getLastMessagePreview([])).toBe('暂无消息')
    })

    it('应该截断超过 30 字符的文本', () => {
      const long = 'a'.repeat(40)
      const msgs = [{ type: 'text', content: long, senderId: 'contact-1' }]
      const preview = getLastMessagePreview(msgs)
      expect(preview.endsWith('...')).toBe(true)
      expect(preview.length).toBeLessThanOrEqual(33)
    })

    it('自己的消息应加前缀 我: ', () => {
      const msgs = [{ type: 'text', content: 'hello', senderId: 'me' }]
      expect(getLastMessagePreview(msgs)).toBe('我: hello')
    })

    it('图片消息应显示 [图片]', () => {
      const msgs = [{ type: 'image', senderId: 'me' }]
      expect(getLastMessagePreview(msgs)).toBe('我: [图片]')
    })

    it('文件消息应显示 [文件]', () => {
      const msgs = [{ type: 'file', senderId: 'contact-1' }]
      expect(getLastMessagePreview(msgs)).toBe('[文件]')
    })
  })

  describe('createTextMessage', () => {
    it('应该创建正确的文本消息结构', () => {
      vi.useFakeTimers().setSystemTime(1234567890000)
      const msg = createTextMessage('hi', 'me')
      expect(msg.type).toBe('text')
      expect(msg.content).toBe('hi')
      expect(msg.senderId).toBe('me')
      expect(msg.timestamp).toBe(1234567890000)
      expect(msg.read).toBe(true)
      expect(msg.id.startsWith('msg-')).toBe(true)
      vi.useRealTimers()
    })

    it('对方消息默认 read 为 false', () => {
      const msg = createTextMessage('hi', 'contact-1')
      expect(msg.read).toBe(false)
    })
  })

  describe('createImageMessage', () => {
    it('应该创建正确的图片消息结构', () => {
      const msg = createImageMessage('data:image/png;base64,xxx', 'a.png')
      expect(msg.type).toBe('image')
      expect(msg.fileName).toBe('a.png')
      expect(msg.senderId).toBe('me')
    })
  })

  describe('createFileMessage', () => {
    it('应该创建正确的文件消息结构', () => {
      const msg = createFileMessage('data:text/plain;base64,xxx', 'doc.txt', 1024)
      expect(msg.type).toBe('file')
      expect(msg.fileName).toBe('doc.txt')
      expect(msg.fileSize).toBe(1024)
    })
  })

  describe('createRandomReply', () => {
    it('应该返回来自预设回复的文本消息', () => {
      const msg = createRandomReply('contact-1')
      expect(msg.type).toBe('text')
      expect(msg.senderId).toBe('contact-1')
      expect(PRESET_REPLIES.includes(msg.content)).toBe(true)
      expect(msg.read).toBe(false)
    })
  })

  describe('markAllRead', () => {
    it('应该将所有消息的 read 置为 true', () => {
      const msgs = [
        { read: false },
        { read: true },
        { read: false },
      ]
      const result = markAllRead(msgs)
      expect(result.every((m) => m.read === true)).toBe(true)
    })

    it('不应该修改原数组对象', () => {
      const original = { read: false }
      const msgs = [original]
      const result = markAllRead(msgs)
      expect(result[0]).not.toBe(original)
    })
  })

  describe('insertEmojiAtCursor', () => {
    it('cursor 为 null 时应追加到末尾', () => {
      const res = insertEmojiAtCursor('abc', null, '😀')
      expect(res.text).toBe('abc😀')
      expect(res.pos).toBe(5)
    })

    it('应在指定位置插入表情', () => {
      const res = insertEmojiAtCursor('abcde', 2, '😀')
      expect(res.text).toBe('ab😀cde')
      expect(res.pos).toBe(4)
    })

    it('text 为空时应正确处理', () => {
      const res = insertEmojiAtCursor('', 0, '😀')
      expect(res.text).toBe('😀')
      expect(res.pos).toBe(2)
    })

    it('text 为 undefined 时应正确处理', () => {
      const res = insertEmojiAtCursor(undefined, 0, '😀')
      expect(res.text).toBe('😀')
    })
  })

  describe('getRandomInterval', () => {
    it('应该在 5000 到 10000 之间', () => {
      for (let i = 0; i < 50; i++) {
        const interval = getRandomInterval()
        expect(interval).toBeGreaterThanOrEqual(5000)
        expect(interval).toBeLessThanOrEqual(10000)
        expect(Number.isInteger(interval)).toBe(true)
      }
    })
  })

  describe('localStorage 消息持久化集成测试', () => {
    it('消息能正确保存和读取', () => {
      const msg = createTextMessage('hello')
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY_MESSAGES) || '{}')
      all['contact-1'] = [msg]
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(all))

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_MESSAGES))
      expect(stored['contact-1'][0].content).toBe('hello')
    })

    it('未读计数能正确存取', () => {
      localStorage.setItem(STORAGE_KEY_UNREAD, JSON.stringify({ 'contact-1': 5 }))
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY_UNREAD))
      expect(data['contact-1']).toBe(5)
    })
  })
})
