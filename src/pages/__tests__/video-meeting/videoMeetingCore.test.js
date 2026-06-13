import { describe, it, expect } from 'vitest'
import {
  getInitials,
  generateAvatarColor,
  calculateGridLayout,
  createParticipant,
  generateInitialParticipants,
  toggleParticipantProperty,
  sortParticipantsSelfFirst,
  filterParticipants,
  formatTimestamp,
  createChatMessage,
  generateRandomChatMessage,
  getRandomChatInterval,
  parseMentions,
  insertMention,
  getMentionSuggestions,
  calculateCanvasCellSize,
} from '../../video-meeting/videoMeetingCore.js'
import {
  AVATAR_COLORS,
  CHAT_SIMULATE_INTERVAL_MAX,
  CHAT_SIMULATE_INTERVAL_MIN,
  SIMULATED_CHAT_MESSAGES,
} from '../../video-meeting/constants.js'

describe('getInitials', () => {
  it('should return initials for two-character names', () => {
    expect(getInitials('张伟')).toBe('张伟')
    expect(getInitials('李娜')).toBe('李娜')
  })

  it('should return single character for one-character names', () => {
    expect(getInitials('我')).toBe('我')
  })

  it('should return ? for empty string', () => {
    expect(getInitials('')).toBe('?')
  })

  it('should return ? for null or undefined', () => {
    expect(getInitials(null)).toBe('?')
    expect(getInitials(undefined)).toBe('?')
  })

  it('should return ? for non-string input', () => {
    expect(getInitials(123)).toBe('?')
  })

  it('should trim whitespace', () => {
    expect(getInitials('  张伟  ')).toBe('张伟')
  })

  it('should handle English names', () => {
    expect(getInitials('Alice')).toBe('Ae')
    expect(getInitials('Bob')).toBe('Bb')
  })
})

describe('generateAvatarColor', () => {
  it('should return a color from the palette for valid names', () => {
    const color = generateAvatarColor('张伟')
    expect(AVATAR_COLORS).toContain(color)
  })

  it('should return consistent color for same name', () => {
    const c1 = generateAvatarColor('李娜')
    const c2 = generateAvatarColor('李娜')
    expect(c1).toBe(c2)
  })

  it('should return first color for null', () => {
    expect(generateAvatarColor(null)).toBe(AVATAR_COLORS[0])
  })

  it('should return first color for undefined', () => {
    expect(generateAvatarColor(undefined)).toBe(AVATAR_COLORS[0])
  })

  it('should return first color for non-string', () => {
    expect(generateAvatarColor(123)).toBe(AVATAR_COLORS[0])
  })

  it('should return different colors for different names (usually)', () => {
    const colors = new Set()
    for (let i = 0; i < 12; i++) {
      colors.add(generateAvatarColor(`测试${i}`))
    }
    expect(colors.size).toBeGreaterThan(1)
  })
})

describe('calculateGridLayout', () => {
  it('should return 1x1 for 1 participant', () => {
    expect(calculateGridLayout(1)).toEqual({ cols: 1, rows: 1 })
  })

  it('should return 2x1 for 2 participants', () => {
    expect(calculateGridLayout(2)).toEqual({ cols: 2, rows: 1 })
  })

  it('should return 2x2 for 3-4 participants', () => {
    expect(calculateGridLayout(3)).toEqual({ cols: 2, rows: 2 })
    expect(calculateGridLayout(4)).toEqual({ cols: 2, rows: 2 })
  })

  it('should return 3x2 for 5-6 participants', () => {
    expect(calculateGridLayout(5)).toEqual({ cols: 3, rows: 2 })
    expect(calculateGridLayout(6)).toEqual({ cols: 3, rows: 2 })
  })

  it('should return 3x3 for 7-9 participants', () => {
    expect(calculateGridLayout(7)).toEqual({ cols: 3, rows: 3 })
    expect(calculateGridLayout(9)).toEqual({ cols: 3, rows: 3 })
  })

  it('should handle 0 or negative participants', () => {
    expect(calculateGridLayout(0)).toEqual({ cols: 1, rows: 1 })
    expect(calculateGridLayout(-1)).toEqual({ cols: 1, rows: 1 })
  })

  it('should handle large number of participants', () => {
    const layout = calculateGridLayout(16)
    expect(layout.cols).toBeGreaterThanOrEqual(4)
    expect(layout.rows).toBeGreaterThanOrEqual(4)
    expect(layout.cols * layout.rows).toBeGreaterThanOrEqual(16)
  })
})

describe('createParticipant', () => {
  it('should create participant with correct defaults', () => {
    const p = createParticipant('p1', '张伟')
    expect(p.id).toBe('p1')
    expect(p.name).toBe('张伟')
    expect(p.isSelf).toBe(false)
    expect(p.isMuted).toBe(false)
    expect(p.isVideoOff).toBe(false)
    expect(p.isScreenSharing).toBe(false)
    expect(p.isHandRaised).toBe(false)
  })

  it('should create self participant', () => {
    const p = createParticipant('self', '我', true)
    expect(p.isSelf).toBe(true)
  })
})

describe('generateInitialParticipants', () => {
  it('should return 6 participants', () => {
    const participants = generateInitialParticipants()
    expect(participants).toHaveLength(6)
  })

  it('should have one self participant', () => {
    const participants = generateInitialParticipants()
    const self = participants.filter((p) => p.isSelf)
    expect(self).toHaveLength(1)
    expect(self[0].id).toBe('self')
    expect(self[0].name).toBe('我')
  })

  it('should have 5 non-self participants', () => {
    const participants = generateInitialParticipants()
    const others = participants.filter((p) => !p.isSelf)
    expect(others).toHaveLength(5)
  })
})

describe('toggleParticipantProperty', () => {
  const participants = [
    createParticipant('self', '我', true),
    createParticipant('p1', '张伟'),
  ]

  it('should toggle mute for self', () => {
    const result = toggleParticipantProperty(participants, 'self', 'isMuted')
    expect(result[0].isMuted).toBe(true)
    expect(result[1].isMuted).toBe(false)
  })

  it('should toggle video off for other participant', () => {
    const result = toggleParticipantProperty(participants, 'p1', 'isVideoOff')
    expect(result[0].isVideoOff).toBe(false)
    expect(result[1].isVideoOff).toBe(true)
  })

  it('should toggle back', () => {
    const once = toggleParticipantProperty(participants, 'self', 'isMuted')
    const twice = toggleParticipantProperty(once, 'self', 'isMuted')
    expect(twice[0].isMuted).toBe(false)
  })

  it('should not mutate original', () => {
    const original = [...participants]
    toggleParticipantProperty(participants, 'self', 'isMuted')
    expect(participants[0].isMuted).toBe(false)
  })
})

describe('sortParticipantsSelfFirst', () => {
  it('should put self participant first', () => {
    const participants = [
      createParticipant('p1', '张伟'),
      createParticipant('self', '我', true),
      createParticipant('p2', '李娜'),
    ]
    const sorted = sortParticipantsSelfFirst(participants)
    expect(sorted[0].isSelf).toBe(true)
    expect(sorted[0].id).toBe('self')
  })

  it('should not mutate original', () => {
    const participants = [
      createParticipant('p1', '张伟'),
      createParticipant('self', '我', true),
    ]
    sortParticipantsSelfFirst(participants)
    expect(participants[0].id).toBe('p1')
  })

  it('should handle no self participant', () => {
    const participants = [
      createParticipant('p1', '张伟'),
      createParticipant('p2', '李娜'),
    ]
    const sorted = sortParticipantsSelfFirst(participants)
    expect(sorted).toHaveLength(2)
  })
})

describe('filterParticipants', () => {
  const participants = [
    createParticipant('self', '我', true),
    createParticipant('p1', '张伟'),
    createParticipant('p2', '李娜'),
    createParticipant('p3', '王磊'),
  ]

  it('should filter by name', () => {
    const result = filterParticipants(participants, '张')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('张伟')
  })

  it('should return all for empty search', () => {
    expect(filterParticipants(participants, '')).toHaveLength(4)
  })

  it('should return all for null search', () => {
    expect(filterParticipants(participants, null)).toHaveLength(4)
  })

  it('should return all for undefined search', () => {
    expect(filterParticipants(participants, undefined)).toHaveLength(4)
  })

  it('should be case-insensitive', () => {
    const ps = [
      createParticipant('p1', 'Alice'),
      createParticipant('p2', 'alice'),
    ]
    expect(filterParticipants(ps, 'alice')).toHaveLength(2)
  })

  it('should return empty for no match', () => {
    expect(filterParticipants(participants, '赵')).toHaveLength(0)
  })
})

describe('formatTimestamp', () => {
  it('should format Date object', () => {
    const date = new Date(2024, 0, 1, 9, 30)
    expect(formatTimestamp(date)).toBe('09:30')
  })

  it('should pad hours and minutes', () => {
    const date = new Date(2024, 0, 1, 1, 5)
    expect(formatTimestamp(date)).toBe('01:05')
  })

  it('should handle midnight', () => {
    const date = new Date(2024, 0, 1, 0, 0)
    expect(formatTimestamp(date)).toBe('00:00')
  })

  it('should handle ISO string input', () => {
    const result = formatTimestamp('2024-01-01T14:30:00')
    expect(result).toBe('14:30')
  })

  it('should return empty string for invalid date', () => {
    expect(formatTimestamp('invalid')).toBe('')
  })
})

describe('createChatMessage', () => {
  it('should create message with correct properties', () => {
    const msg = createChatMessage('p1', '张伟', '大家好！')
    expect(msg.senderId).toBe('p1')
    expect(msg.senderName).toBe('张伟')
    expect(msg.content).toBe('大家好！')
    expect(msg.timestamp).toBeInstanceOf(Date)
    expect(typeof msg.id).toBe('string')
    expect(msg.id.length).toBeGreaterThan(0)
  })

  it('should generate unique IDs', () => {
    const ids = new Set()
    for (let i = 0; i < 50; i++) {
      const msg = createChatMessage('p1', '张伟', 'test')
      ids.add(msg.id)
    }
    expect(ids.size).toBe(50)
  })
})

describe('generateRandomChatMessage', () => {
  const participants = generateInitialParticipants()

  it('should generate a message from another participant', () => {
    const msg = generateRandomChatMessage(participants, null, SIMULATED_CHAT_MESSAGES)
    expect(msg).not.toBeNull()
    expect(msg.senderId).not.toBe('self')
    expect(typeof msg.content).toBe('string')
    expect(msg.content.length).toBeGreaterThan(0)
  })

  it('should return null when no other participants', () => {
    const onlySelf = [createParticipant('self', '我', true)]
    const msg = generateRandomChatMessage(onlySelf, null, SIMULATED_CHAT_MESSAGES)
    expect(msg).toBeNull()
  })

  it('should exclude a specific participant', () => {
    const msg = generateRandomChatMessage(participants, 'p1', SIMULATED_CHAT_MESSAGES)
    if (msg) {
      expect(msg.senderId).not.toBe('p1')
    }
  })
})

describe('getRandomChatInterval', () => {
  it('should return a number within range', () => {
    for (let i = 0; i < 100; i++) {
      const interval = getRandomChatInterval(5000, 15000)
      expect(interval).toBeGreaterThanOrEqual(5000)
      expect(interval).toBeLessThanOrEqual(15000)
    }
  })

  it('should return min when min equals max', () => {
    expect(getRandomChatInterval(10000, 10000)).toBe(10000)
  })
})

describe('parseMentions', () => {
  const participants = [
    createParticipant('self', '我', true),
    createParticipant('p1', '张伟'),
    createParticipant('p2', '李娜'),
  ]

  it('should parse @mention', () => {
    const mentions = parseMentions('@张伟 你好', participants)
    expect(mentions).toHaveLength(1)
    expect(mentions[0].name).toBe('张伟')
  })

  it('should parse multiple mentions', () => {
    const mentions = parseMentions('@张伟 @李娜 你们好', participants)
    expect(mentions).toHaveLength(2)
  })

  it('should return empty for no mentions', () => {
    expect(parseMentions('大家好', participants)).toEqual([])
  })

  it('should return empty for null text', () => {
    expect(parseMentions(null, participants)).toEqual([])
  })

  it('should return empty for undefined text', () => {
    expect(parseMentions(undefined, participants)).toEqual([])
  })

  it('should return empty for non-string text', () => {
    expect(parseMentions(123, participants)).toEqual([])
  })

  it('should only match existing participants', () => {
    const mentions = parseMentions('@不存在的 @张伟', participants)
    expect(mentions).toHaveLength(1)
    expect(mentions[0].name).toBe('张伟')
  })
})

describe('insertMention', () => {
  it('should insert mention at @ position', () => {
    const result = insertMention('你好@张', 4, '张伟')
    expect(result.text).toBe('你好@张伟 ')
    expect(result.cursorPosition).toBe(6)
  })

  it('should return unchanged text if no @ found', () => {
    const result = insertMention('你好世界', 4, '张伟')
    expect(result.text).toBe('你好世界')
  })

  it('should handle @ at beginning', () => {
    const result = insertMention('@张', 2, '张伟')
    expect(result.text).toBe('@张伟 ')
  })

  it('should handle @ in middle of text', () => {
    const result = insertMention('发送给@李 消息', 4, '李娜')
    expect(result.text).toBe('发送给@李娜 消息')
  })
})

describe('getMentionSuggestions', () => {
  const participants = [
    createParticipant('self', '我', true),
    createParticipant('p1', '张伟'),
    createParticipant('p2', '李娜'),
  ]

  it('should suggest participants after @', () => {
    const suggestions = getMentionSuggestions('@张', 2, participants)
    expect(suggestions.length).toBeGreaterThanOrEqual(1)
    expect(suggestions.some((s) => s.name === '张伟')).toBe(true)
  })

  it('should return empty for no @', () => {
    expect(getMentionSuggestions('你好', 2, participants)).toEqual([])
  })

  it('should return empty for null text', () => {
    expect(getMentionSuggestions(null, 0, participants)).toEqual([])
  })

  it('should return empty if space after @ query', () => {
    expect(getMentionSuggestions('@张 伟', 4, participants)).toEqual([])
  })

  it('should show all participants for just @', () => {
    const suggestions = getMentionSuggestions('@', 1, participants)
    expect(suggestions.length).toBeGreaterThan(0)
  })
})

describe('calculateCanvasCellSize', () => {
  it('should calculate cell size for 3x2 grid', () => {
    const result = calculateCanvasCellSize(1200, 600, 3, 2)
    expect(result.cellWidth).toBeGreaterThan(0)
    expect(result.cellHeight).toBeGreaterThan(0)
    expect(result.gap).toBe(8)
  })

  it('should respect minimum cell sizes', () => {
    const result = calculateCanvasCellSize(200, 150, 3, 3)
    expect(result.cellWidth).toBeGreaterThanOrEqual(100)
    expect(result.cellHeight).toBeGreaterThanOrEqual(75)
  })

  it('should use custom gap', () => {
    const result = calculateCanvasCellSize(1000, 600, 2, 2, 16)
    expect(result.gap).toBe(16)
  })

  it('should handle single cell', () => {
    const result = calculateCanvasCellSize(800, 600, 1, 1)
    expect(result.cellWidth).toBeLessThanOrEqual(800)
    expect(result.cellHeight).toBeLessThanOrEqual(600)
  })
})
