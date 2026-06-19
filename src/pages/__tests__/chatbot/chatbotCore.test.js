import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  FAQ_PAIRS,
  DEFAULT_QUICK_OPTIONS,
  REFERENCE_KEYWORDS,
  matchFAQ,
  createContextCache,
  isReferenceExpression,
  resolveReference,
  generateBotReply,
  formatTimestamp,
  exportChatToTxt,
  generateId,
  createMessage,
  truncatePreview,
  createNewSession,
  parseQuickOptions,
  serializeQuickOptions,
  downloadTxtFile,
} from '../../chatbot/chatbotCore.js'

describe('chatbotCore', () => {
  describe('FAQ_PAIRS', () => {
    it('应该至少包含 15 条问答对', () => {
      expect(FAQ_PAIRS.length).toBeGreaterThanOrEqual(15)
    })

    it('每条问答对都应有 keywords、category、answer 字段', () => {
      for (const pair of FAQ_PAIRS) {
        expect(Array.isArray(pair.keywords)).toBe(true)
        expect(pair.keywords.length).toBeGreaterThan(0)
        expect(typeof pair.category).toBe('string')
        expect(typeof pair.answer).toBe('string')
        expect(pair.answer.length).toBeGreaterThan(0)
      }
    })

    it('应覆盖指定场景：欢迎语、产品咨询、价格查询、售后服务、退款流程、物流查询、工作时间、联系方式', () => {
      const categories = FAQ_PAIRS.map((p) => p.category)
      expect(categories).toContain('greeting')
      expect(categories).toContain('product')
      expect(categories).toContain('price')
      expect(categories).toContain('after-sales')
      expect(categories).toContain('refund')
      expect(categories).toContain('logistics')
      expect(categories).toContain('hours')
      expect(categories).toContain('contact')
    })
  })

  describe('DEFAULT_QUICK_OPTIONS', () => {
    it('应该包含 4-6 个快捷选项', () => {
      expect(DEFAULT_QUICK_OPTIONS.length).toBeGreaterThanOrEqual(4)
      expect(DEFAULT_QUICK_OPTIONS.length).toBeLessThanOrEqual(6)
    })

    it('每个选项都应有 id、label、question 字段', () => {
      for (const opt of DEFAULT_QUICK_OPTIONS) {
        expect(typeof opt.id).toBe('string')
        expect(typeof opt.label).toBe('string')
        expect(typeof opt.question).toBe('string')
      }
    })
  })

  describe('matchFAQ', () => {
    it('应该匹配欢迎语关键词', () => {
      const result = matchFAQ('你好')
      expect(result).not.toBeNull()
      expect(result.category).toBe('greeting')
    })

    it('应该匹配价格查询关键词', () => {
      const result = matchFAQ('这个产品多少钱？')
      expect(result).not.toBeNull()
      expect(result.category).toBe('price')
    })

    it('应该匹配退款流程关键词', () => {
      const result = matchFAQ('我想申请退款，流程是什么？')
      expect(result).not.toBeNull()
      expect(result.category).toBe('refund')
    })

    it('应该匹配物流查询关键词', () => {
      const result = matchFAQ('我的快递几天能到？')
      expect(result).not.toBeNull()
      expect(result.category).toBe('logistics')
    })

    it('应该匹配工作时间关键词', () => {
      const result = matchFAQ('你们几点下班？')
      expect(result).not.toBeNull()
      expect(result.category).toBe('hours')
    })

    it('应该匹配联系方式关键词', () => {
      const result = matchFAQ('怎么联系你们客服？')
      expect(result).not.toBeNull()
      expect(result.category).toBe('contact')
    })

    it('匹配失败时应返回 null', () => {
      const result = matchFAQ('完全不相关的问题xyz123')
      expect(result).toBeNull()
    })

    it('空字符串应返回 null', () => {
      expect(matchFAQ('')).toBeNull()
      expect(matchFAQ(null)).toBeNull()
      expect(matchFAQ(undefined)).toBeNull()
    })

    it('非字符串应返回 null', () => {
      expect(matchFAQ(123)).toBeNull()
      expect(matchFAQ({})).toBeNull()
    })

    it('应进行不区分大小写的匹配', () => {
      const result1 = matchFAQ('HELLO')
      const result2 = matchFAQ('hello')
      expect(result1).not.toBeNull()
      expect(result2).not.toBeNull()
      expect(result1.category).toBe(result2.category)
    })

    it('应返回命中关键词最多的问答对（优先选择更匹配的）', () => {
      const customFAQs = [
        { keywords: ['价格'], category: 'price', answer: 'A' },
        { keywords: ['价格', '优惠', '折扣'], category: 'price-deal', answer: 'B' },
      ]
      const result = matchFAQ('有什么价格优惠和折扣吗？', customFAQs)
      expect(result).not.toBeNull()
      expect(result.category).toBe('price-deal')
    })

    it('应该匹配人工客服关键词', () => {
      const result = matchFAQ('我要转人工')
      expect(result).not.toBeNull()
      expect(result.category).toBe('human')
    })
  })

  describe('createContextCache', () => {
    it('应该创建一个空的上下文缓存', () => {
      const cache = createContextCache(5)
      expect(cache.size()).toBe(0)
      expect(cache.maxPairs).toBe(5)
    })

    it('添加对话对后 size 应该增加', () => {
      const cache = createContextCache(5)
      cache.add('你好', '你好！我是客服', 'greeting')
      expect(cache.size()).toBe(1)
      cache.add('价格', '价格是xxx', 'price')
      expect(cache.size()).toBe(2)
    })

    it('getLatest 应该返回最近添加的对话对', () => {
      const cache = createContextCache(5)
      cache.add('问题1', '回答1', 'cat1')
      cache.add('问题2', '回答2', 'cat2')
      const latest = cache.getLatest()
      expect(latest.user).toBe('问题2')
      expect(latest.bot).toBe('回答2')
      expect(latest.category).toBe('cat2')
    })

    it('空缓存 getLatest 应返回 null', () => {
      const cache = createContextCache(5)
      expect(cache.getLatest()).toBeNull()
    })

    it('超过 maxPairs 时应淘汰最旧的对话对', () => {
      const cache = createContextCache(3)
      cache.add('q1', 'a1', 'c1')
      cache.add('q2', 'a2', 'c2')
      cache.add('q3', 'a3', 'c3')
      cache.add('q4', 'a4', 'c4')
      expect(cache.size()).toBe(3)
      const all = cache.getAll()
      expect(all[0].user).toBe('q2')
      expect(all[2].user).toBe('q4')
    })

    it('getAll 应返回所有对话对的副本', () => {
      const cache = createContextCache(5)
      cache.add('q1', 'a1', 'c1')
      cache.add('q2', 'a2', 'c2')
      const all = cache.getAll()
      expect(all).toHaveLength(2)
      all[0].user = '修改过'
      expect(cache.getLatest().user).toBe('q2')
    })

    it('getByIndexFromEnd 应按从末尾的索引获取', () => {
      const cache = createContextCache(5)
      cache.add('q1', 'a1', 'c1')
      cache.add('q2', 'a2', 'c2')
      cache.add('q3', 'a3', 'c3')
      expect(cache.getByIndexFromEnd(0).user).toBe('q3')
      expect(cache.getByIndexFromEnd(1).user).toBe('q2')
      expect(cache.getByIndexFromEnd(2).user).toBe('q1')
    })

    it('getByIndexFromEnd 越界应返回 null', () => {
      const cache = createContextCache(5)
      cache.add('q1', 'a1', 'c1')
      expect(cache.getByIndexFromEnd(-1)).toBeNull()
      expect(cache.getByIndexFromEnd(5)).toBeNull()
    })

    it('findByCategory 应查找指定类别的最近对话', () => {
      const cache = createContextCache(5)
      cache.add('你好', '你好', 'greeting')
      cache.add('价格', '100元', 'price')
      cache.add('物流', '3天到', 'logistics')
      const found = cache.findByCategory('price')
      expect(found).not.toBeNull()
      expect(found.user).toBe('价格')
      expect(found.bot).toBe('100元')
    })

    it('findByCategory 找不到时返回 null', () => {
      const cache = createContextCache(5)
      cache.add('你好', '你好', 'greeting')
      expect(cache.findByCategory('price')).toBeNull()
    })

    it('clear 应清空缓存', () => {
      const cache = createContextCache(5)
      cache.add('q1', 'a1', 'c1')
      cache.clear()
      expect(cache.size()).toBe(0)
      expect(cache.getLatest()).toBeNull()
    })

    it('不同缓存实例之间相互独立', () => {
      const cache1 = createContextCache(5)
      const cache2 = createContextCache(5)
      cache1.add('q1', 'a1', 'c1')
      expect(cache1.size()).toBe(1)
      expect(cache2.size()).toBe(0)
    })
  })

  describe('isReferenceExpression', () => {
    it('应该识别「上一个」为指代性表达', () => {
      expect(isReferenceExpression('上一个问题')).toBe(true)
    })

    it('应该识别「刚才」为指代性表达', () => {
      expect(isReferenceExpression('刚才说的是什么？')).toBe(true)
    })

    it('应该识别「之前」为指代性表达', () => {
      expect(isReferenceExpression('之前那个')).toBe(true)
    })

    it('应该识别「那个」为指代性表达', () => {
      expect(isReferenceExpression('那个问题再说说')).toBe(true)
    })

    it('普通问题不应被识别为指代', () => {
      expect(isReferenceExpression('你们的产品价格是多少？')).toBe(false)
    })

    it('空值应返回 false', () => {
      expect(isReferenceExpression('')).toBe(false)
      expect(isReferenceExpression(null)).toBe(false)
      expect(isReferenceExpression(undefined)).toBe(false)
    })

    it('非字符串应返回 false', () => {
      expect(isReferenceExpression(123)).toBe(false)
      expect(isReferenceExpression({})).toBe(false)
    })
  })

  describe('resolveReference', () => {
    it('指代性表达 + 有上下文时应返回上下文', () => {
      const cache = createContextCache(5)
      cache.add('价格多少？', '100元', 'price')
      const result = resolveReference('刚才说的', cache)
      expect(result).not.toBeNull()
      expect(result.type).toBe('repeat')
      expect(result.pair.user).toBe('价格多少？')
    })

    it('非指代性表达应返回 null', () => {
      const cache = createContextCache(5)
      cache.add('价格多少？', '100元', 'price')
      const result = resolveReference('新问题', cache)
      expect(result).toBeNull()
    })

    it('指代性表达 + 无上下文应返回 null', () => {
      const cache = createContextCache(5)
      const result = resolveReference('刚才说的', cache)
      expect(result).toBeNull()
    })

    it('「上上」「前两个」应返回倒数第二个', () => {
      const cache = createContextCache(5)
      cache.add('价格多少？', '100元', 'price')
      cache.add('物流多久？', '3天', 'logistics')
      const result = resolveReference('上上个问题', cache)
      expect(result).not.toBeNull()
      expect(result.pair.user).toBe('价格多少？')
    })
  })

  describe('generateBotReply', () => {
    it('匹配 FAQ 时应返回 matched 类型', () => {
      const cache = createContextCache(5)
      const reply = generateBotReply('你好', cache)
      expect(reply.type).toBe('matched')
      expect(reply.category).toBe('greeting')
      expect(typeof reply.answer).toBe('string')
      expect(reply.answer.length).toBeGreaterThan(0)
    })

    it('不匹配 FAQ 时应返回 unknown 类型', () => {
      const cache = createContextCache(5)
      const reply = generateBotReply('完全随机的问题 xyz123', cache)
      expect(reply.type).toBe('unknown')
      expect(reply.category).toBeNull()
      expect(reply.answer).toContain('无法回答')
    })

    it('空值应返回 unknown', () => {
      const cache = createContextCache(5)
      const reply = generateBotReply('', cache)
      expect(reply.type).toBe('unknown')
    })

    it('有上下文时指代性表达应返回 context 类型', () => {
      const cache = createContextCache(5)
      cache.add('价格多少？', '100元', 'price')
      const reply = generateBotReply('刚才说的', cache)
      expect(reply.type).toBe('context')
      expect(reply.answer).toContain('价格多少？')
      expect(reply.answer).toContain('100元')
    })

    it('指代性表达但无上下文时应返回 unknown', () => {
      const cache = createContextCache(5)
      const reply = generateBotReply('刚才说的', cache)
      expect(reply.type).toBe('unknown')
    })

    it('匹配到人工转接关键词', () => {
      const cache = createContextCache(5)
      const reply = generateBotReply('转人工', cache)
      expect(reply.type).toBe('matched')
      expect(reply.category).toBe('human')
    })

    it('matched 回复应包含 matchedFAQ 字段', () => {
      const cache = createContextCache(5)
      const reply = generateBotReply('价格是多少', cache)
      expect(reply.matchedFAQ).toBeDefined()
      expect(reply.matchedFAQ.category).toBe('price')
    })

    it('context 回复应包含 contextPair 字段', () => {
      const cache = createContextCache(5)
      cache.add('物流多久到？', '3天', 'logistics')
      const reply = generateBotReply('之前那个', cache)
      expect(reply.contextPair).toBeDefined()
      expect(reply.contextPair.category).toBe('logistics')
    })
  })

  describe('formatTimestamp', () => {
    it('应该正确格式化时间戳', () => {
      const ts = new Date(2024, 0, 15, 9, 30, 45).getTime()
      const formatted = formatTimestamp(ts)
      expect(formatted).toContain('2024-01-15')
      expect(formatted).toContain('09:30:45')
    })

    it('应该对月日时分秒补零', () => {
      const ts = new Date(2024, 0, 1, 0, 0, 0).getTime()
      const formatted = formatTimestamp(ts)
      expect(formatted).toContain('2024-01-01')
      expect(formatted).toContain('00:00:00')
    })
  })

  describe('exportChatToTxt', () => {
    it('应该正确格式化聊天记录为 TXT', () => {
      vi.useFakeTimers().setSystemTime(new Date(2024, 5, 1, 10, 0, 0))
      const messages = [
        { sender: 'user', content: '你好', timestamp: new Date(2024, 5, 1, 9, 0, 0).getTime() },
        { sender: 'bot', content: '你好！有什么可以帮您？', timestamp: new Date(2024, 5, 1, 9, 0, 1).getTime() },
      ]
      const txt = exportChatToTxt(messages, '测试会话')
      expect(txt).toContain('聊天记录：测试会话')
      expect(txt).toContain('导出时间：')
      expect(txt).toContain('用户：你好')
      expect(txt).toContain('机器人：你好！有什么可以帮您？')
      expect(txt).toContain('[2024-06-01 09:00:00]')
      vi.useRealTimers()
    })

    it('空数组应返回带标题的内容', () => {
      const txt = exportChatToTxt([], '空会话')
      expect(txt).toContain('聊天记录：空会话')
    })

    it('非数组应返回空字符串', () => {
      expect(exportChatToTxt(null)).toBe('')
      expect(exportChatToTxt(undefined)).toBe('')
      expect(exportChatToTxt('not array')).toBe('')
    })

    it('无 timestamp 的消息应使用当前时间', () => {
      vi.useFakeTimers().setSystemTime(new Date(2024, 5, 1, 10, 0, 0))
      const messages = [{ sender: 'user', content: '无时间戳的消息' }]
      const txt = exportChatToTxt(messages)
      expect(txt).toContain('用户：无时间戳的消息')
      expect(txt).toContain('2024-06-01')
      vi.useRealTimers()
    })
  })

  describe('generateId', () => {
    it('应该生成以指定前缀开头的 ID', () => {
      expect(generateId('msg').startsWith('msg-')).toBe(true)
      expect(generateId('session').startsWith('session-')).toBe(true)
    })

    it('应该生成不同的 ID', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('createMessage', () => {
    it('应该创建结构正确的用户消息', () => {
      vi.useFakeTimers().setSystemTime(1234567890000)
      const msg = createMessage('hello', 'user')
      expect(msg.sender).toBe('user')
      expect(msg.content).toBe('hello')
      expect(msg.timestamp).toBe(1234567890000)
      expect(typeof msg.id).toBe('string')
      expect(msg.id.startsWith('msg-')).toBe(true)
      vi.useRealTimers()
    })

    it('应该创建结构正确的机器人消息', () => {
      const msg = createMessage('world', 'bot')
      expect(msg.sender).toBe('bot')
      expect(msg.content).toBe('world')
    })

    it('默认 sender 为 user', () => {
      const msg = createMessage('default')
      expect(msg.sender).toBe('user')
    })
  })

  describe('truncatePreview', () => {
    it('短文本不应被截断', () => {
      expect(truncatePreview('短文本', 30)).toBe('短文本')
    })

    it('长文本应被截断并添加省略号', () => {
      const long = 'a'.repeat(50)
      const result = truncatePreview(long, 30)
      expect(result.endsWith('...')).toBe(true)
      expect(result.length).toBe(33)
    })

    it('空值应返回空字符串', () => {
      expect(truncatePreview('')).toBe('')
      expect(truncatePreview(null)).toBe('')
      expect(truncatePreview(undefined)).toBe('')
    })

    it('默认 maxLen 为 30', () => {
      const exactly30 = 'a'.repeat(30)
      const exactly31 = 'a'.repeat(31)
      expect(truncatePreview(exactly30)).toBe(exactly30)
      expect(truncatePreview(exactly31).endsWith('...')).toBe(true)
    })
  })

  describe('createNewSession', () => {
    it('应该创建结构正确的会话对象', () => {
      const session = createNewSession('测试会话')
      expect(typeof session.id).toBe('string')
      expect(session.name).toBe('测试会话')
      expect(Array.isArray(session.messages)).toBe(true)
      expect(session.messages.length).toBeGreaterThan(0)
      expect(session.messages[0].sender).toBe('bot')
      expect(typeof session.createdAt).toBe('number')
      expect(typeof session.updatedAt).toBe('number')
      expect(session.isHuman).toBe(false)
    })

    it('默认名称应为「新会话」', () => {
      const session = createNewSession()
      expect(session.name).toBe('新会话')
    })

    it('初始消息应为欢迎语', () => {
      const session = createNewSession()
      const firstMsg = session.messages[0]
      expect(firstMsg.sender).toBe('bot')
      expect(firstMsg.content).toContain('智能客服助手')
    })
  })

  describe('parseQuickOptions', () => {
    it('空字符串应返回默认选项', () => {
      const result = parseQuickOptions('', [{ id: 'x', label: 'L', question: 'Q' }])
      expect(result).toEqual([{ id: 'x', label: 'L', question: 'Q' }])
    })

    it('null/undefined 应返回默认选项', () => {
      const fallback = [{ id: 'd', label: 'D', question: 'Q' }]
      expect(parseQuickOptions(null, fallback)).toEqual(fallback)
      expect(parseQuickOptions(undefined, fallback)).toEqual(fallback)
    })

    it('合法 JSON 数组应被正确解析', () => {
      const json = JSON.stringify([
        { id: 'a', label: '价格', question: '多少钱？' },
        { id: 'b', label: '物流', question: '多久到？' },
      ])
      const result = parseQuickOptions(json, [])
      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('价格')
    })

    it('不合法 JSON 应返回默认选项', () => {
      const fallback = [{ id: 'd', label: 'D', question: 'Q' }]
      expect(parseQuickOptions('{not json', fallback)).toEqual(fallback)
    })

    it('非数组 JSON 应返回默认选项', () => {
      const fallback = [{ id: 'd', label: 'D', question: 'Q' }]
      expect(parseQuickOptions('{"a":1}', fallback)).toEqual(fallback)
    })

    it('应过滤掉缺少 label 或 question 的无效项', () => {
      const json = JSON.stringify([
        { id: 'a', label: '好', question: '有' },
        { id: 'b', label: '', question: '缺label' },
        { id: 'c', label: '缺q', question: '' },
        { id: 'd', label: '类型', question: '错误' },
        null,
      ])
      const result = parseQuickOptions(json, [])
      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('好')
    })

    it('过滤后为空时应返回默认选项', () => {
      const json = JSON.stringify([{ label: '', question: '' }])
      const fallback = [{ id: 'd', label: 'D', question: 'Q' }]
      expect(parseQuickOptions(json, fallback)).toEqual(fallback)
    })
  })

  describe('serializeQuickOptions', () => {
    it('应正确序列化为 JSON 字符串', () => {
      const options = [
        { id: 'a', label: 'L', question: 'Q' },
      ]
      const json = serializeQuickOptions(options)
      const parsed = JSON.parse(json)
      expect(parsed).toEqual(options)
    })

    it('非数组应使用默认选项序列化', () => {
      const json = serializeQuickOptions(null)
      const parsed = JSON.parse(json)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toEqual(DEFAULT_QUICK_OPTIONS)
    })
  })

  describe('downloadTxtFile', () => {
    it('在没有 document 的环境中应返回 false', () => {
      const result = downloadTxtFile('content', 'file.txt')
      expect(typeof result).toBe('boolean')
    })
  })
})
