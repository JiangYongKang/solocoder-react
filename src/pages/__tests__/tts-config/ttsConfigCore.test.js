import { describe, it, expect } from 'vitest'
import {
  MAX_TEXT_LENGTH,
  DEFAULT_SPEED,
  MIN_SPEED,
  MAX_SPEED,
  DEFAULT_PITCH,
  MIN_PITCH,
  MAX_PITCH,
  DEFAULT_VOLUME,
  MIN_VOLUME,
  MAX_VOLUME,
  PAUSE_DURATION_OPTIONS,
  VOICE_PRESETS,
  DEFAULT_VOICE_ID,
  SAMPLE_TEXT,
  MAX_HISTORY_ITEMS,
  countChars,
  splitParagraphs,
  parsePauseMarkers,
  extractPauseDuration,
  removePauseMarkers,
  insertPauseMarker,
  removeAllPauseMarkers,
  calculateProgress,
  addToHistory,
  createHistoryRecord,
  serializeConfig,
  deserializeConfig,
  validateConfig,
  getVoiceById,
  getVoiceName,
  formatPauseDuration,
  buildAuditionText,
  parseSegmentsWithPauses,
  flattenTextSegments,
} from '../../tts-config/ttsConfigCore'

describe('countChars', () => {
  it('should return 0 for null', () => {
    expect(countChars(null)).toBe(0)
  })

  it('should return 0 for undefined', () => {
    expect(countChars(undefined)).toBe(0)
  })

  it('should return 0 for empty string', () => {
    expect(countChars('')).toBe(0)
  })

  it('should count characters correctly', () => {
    expect(countChars('你好世界')).toBe(4)
  })

  it('should exclude pause markers from count', () => {
    expect(countChars('你好<pause=500>世界')).toBe(4)
  })

  it('should exclude multiple pause markers', () => {
    expect(countChars('A<pause=200>B<pause=800>C')).toBe(3)
  })

  it('should count mixed content', () => {
    expect(countChars('Hello<pause=500>世界')).toBe(7)
  })
})

describe('splitParagraphs', () => {
  it('should return empty array for null', () => {
    expect(splitParagraphs(null)).toEqual([])
  })

  it('should return empty array for empty string', () => {
    expect(splitParagraphs('')).toEqual([])
  })

  it('should return single paragraph for text without empty lines', () => {
    expect(splitParagraphs('这是一段文字')).toEqual(['这是一段文字'])
  })

  it('should split by empty lines', () => {
    const text = '第一段\n\n第二段\n\n第三段'
    expect(splitParagraphs(text)).toEqual(['第一段', '第二段', '第三段'])
  })

  it('should handle multiple consecutive empty lines', () => {
    const text = '第一段\n\n\n\n第二段'
    expect(splitParagraphs(text)).toEqual(['第一段', '第二段'])
  })

  it('should trim whitespace from paragraphs', () => {
    const text = '  第一段  \n\n  第二段  '
    expect(splitParagraphs(text)).toEqual(['第一段', '第二段'])
  })

  it('should filter out empty paragraphs', () => {
    const text = '第一段\n\n   \n\n第二段'
    expect(splitParagraphs(text)).toEqual(['第一段', '第二段'])
  })

  it('should handle text with only whitespace', () => {
    expect(splitParagraphs('   \n\n   ')).toEqual([])
  })

  it('should preserve pause markers within paragraphs', () => {
    const text = '第一段<pause=500>内容\n\n第二段'
    expect(splitParagraphs(text)).toEqual(['第一段<pause=500>内容', '第二段'])
  })
})

describe('parsePauseMarkers', () => {
  it('should return empty array for null', () => {
    expect(parsePauseMarkers(null)).toEqual([])
  })

  it('should return empty array for text without markers', () => {
    expect(parsePauseMarkers('没有标记的文本')).toEqual([])
  })

  it('should parse a single pause marker', () => {
    const result = parsePauseMarkers('你好<pause=500>世界')
    expect(result).toHaveLength(1)
    expect(result[0].fullMatch).toBe('<pause=500>')
    expect(result[0].duration).toBe(500)
    expect(result[0].index).toBe(2)
  })

  it('should parse multiple pause markers', () => {
    const result = parsePauseMarkers('A<pause=200>B<pause=800>C')
    expect(result).toHaveLength(2)
    expect(result[0].duration).toBe(200)
    expect(result[1].duration).toBe(800)
  })

  it('should parse markers at different positions', () => {
    const result = parsePauseMarkers('<pause=1000>开头文本')
    expect(result).toHaveLength(1)
    expect(result[0].index).toBe(0)
    expect(result[0].duration).toBe(1000)
  })
})

describe('extractPauseDuration', () => {
  it('should return 0 for null', () => {
    expect(extractPauseDuration(null)).toBe(0)
  })

  it('should return 0 for invalid string', () => {
    expect(extractPauseDuration('not a marker')).toBe(0)
  })

  it('should extract duration from valid marker', () => {
    expect(extractPauseDuration('<pause=500>')).toBe(500)
  })

  it('should extract 200ms', () => {
    expect(extractPauseDuration('<pause=200>')).toBe(200)
  })

  it('should extract 2000ms', () => {
    expect(extractPauseDuration('<pause=2000>')).toBe(2000)
  })

  it('should return 0 for malformed marker', () => {
    expect(extractPauseDuration('<pause=abc>')).toBe(0)
    expect(extractPauseDuration('pause=500')).toBe(0)
  })
})

describe('removePauseMarkers', () => {
  it('should return empty string for null', () => {
    expect(removePauseMarkers(null)).toBe('')
  })

  it('should return unchanged text without markers', () => {
    expect(removePauseMarkers('普通文本')).toBe('普通文本')
  })

  it('should remove all pause markers', () => {
    expect(removePauseMarkers('你好<pause=500>世界')).toBe('你好世界')
  })

  it('should remove multiple pause markers', () => {
    expect(removePauseMarkers('A<pause=200>B<pause=800>C')).toBe('ABC')
  })
})

describe('insertPauseMarker', () => {
  it('should insert marker at the beginning', () => {
    expect(insertPauseMarker('你好', 0, 500)).toBe('<pause=500>你好')
  })

  it('should insert marker in the middle', () => {
    expect(insertPauseMarker('你好世界', 2, 500)).toBe('你好<pause=500>世界')
  })

  it('should insert marker at the end', () => {
    expect(insertPauseMarker('你好', 2, 800)).toBe('你好<pause=800>')
  })

  it('should clamp position to valid range', () => {
    expect(insertPauseMarker('你好', 100, 500)).toBe('你好<pause=500>')
    expect(insertPauseMarker('你好', -1, 500)).toBe('<pause=500>你好')
  })
})

describe('removeAllPauseMarkers', () => {
  it('should behave same as removePauseMarkers', () => {
    expect(removeAllPauseMarkers('A<pause=200>B<pause=800>C')).toBe('ABC')
  })
})

describe('calculateProgress', () => {
  it('should return 0 at the very beginning', () => {
    expect(calculateProgress(0, 3, 0, 10)).toBe(0)
  })

  it('should calculate progress within first paragraph', () => {
    expect(calculateProgress(0, 3, 5, 10)).toBeCloseTo(5 / 3 / 10 * 100, 5)
  })

  it('should calculate progress across paragraphs', () => {
    expect(calculateProgress(1, 3, 0, 10)).toBeCloseTo(100 / 3, 5)
  })

  it('should return 100 at the end', () => {
    expect(calculateProgress(2, 3, 10, 10)).toBe(100)
  })

  it('should handle single paragraph', () => {
    expect(calculateProgress(0, 1, 0, 10)).toBe(0)
    expect(calculateProgress(0, 1, 5, 10)).toBe(50)
    expect(calculateProgress(0, 1, 10, 10)).toBe(100)
  })

  it('should clamp to 0-100 range', () => {
    expect(calculateProgress(-1, 3, 0, 10)).toBe(0)
    expect(calculateProgress(5, 3, 0, 10)).toBeLessThanOrEqual(100)
  })

  it('should handle zero total paragraphs safely', () => {
    expect(calculateProgress(0, 0, 0, 10)).toBe(0)
  })

  it('should handle zero paragraph length safely', () => {
    expect(calculateProgress(0, 3, 0, 0)).toBe(0)
  })
})

describe('addToHistory', () => {
  it('should add record to empty history', () => {
    const record = { id: '1' }
    expect(addToHistory([], record)).toEqual([record])
  })

  it('should add record to existing history', () => {
    const h = [{ id: '1' }]
    const record = { id: '2' }
    expect(addToHistory(h, record)).toEqual([record, { id: '1' }])
  })

  it('should handle null history', () => {
    const record = { id: '1' }
    expect(addToHistory(null, record)).toEqual([record])
  })

  it('should evict oldest records when exceeding maxItems', () => {
    const h = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }))
    const record = { id: 'new' }
    const result = addToHistory(h, record, 20)
    expect(result).toHaveLength(20)
    expect(result[0]).toEqual(record)
    expect(result[result.length - 1].id).toBe('18')
  })

  it('should use MAX_HISTORY_ITEMS as default limit', () => {
    const h = Array.from({ length: MAX_HISTORY_ITEMS }, (_, i) => ({ id: String(i) }))
    const record = { id: 'new' }
    const result = addToHistory(h, record)
    expect(result).toHaveLength(MAX_HISTORY_ITEMS)
  })

  it('should not evict when under limit', () => {
    const h = [{ id: '1' }, { id: '2' }]
    const record = { id: '3' }
    const result = addToHistory(h, record, 5)
    expect(result).toHaveLength(3)
  })
})

describe('createHistoryRecord', () => {
  it('should create a record with correct fields', () => {
    const record = createHistoryRecord('你好世界', 'standard-female', 1.0)
    expect(record.id).toBeDefined()
    expect(record.timestamp).toBeGreaterThan(0)
    expect(record.title).toBe('你好世界')
    expect(record.voiceId).toBe('standard-female')
    expect(record.speed).toBe(1.0)
    expect(record.pitch).toBe(DEFAULT_PITCH)
    expect(record.volume).toBe(DEFAULT_VOLUME)
    expect(record.text).toBe('你好世界')
  })

  it('should store explicit pitch and volume values', () => {
    const record = createHistoryRecord('测试文本', 'standard-male', 1.5, 3, 60)
    expect(record.pitch).toBe(3)
    expect(record.volume).toBe(60)
    expect(record.speed).toBe(1.5)
    expect(record.voiceId).toBe('standard-male')
  })

  it('should store negative pitch and zero volume', () => {
    const record = createHistoryRecord('测试', 'child', 2.0, -5, 0)
    expect(record.pitch).toBe(-5)
    expect(record.volume).toBe(0)
  })

  it('should default pitch and volume when not provided', () => {
    const record = createHistoryRecord('测试', 'news-anchor', 1.2)
    expect(record.pitch).toBe(DEFAULT_PITCH)
    expect(record.volume).toBe(DEFAULT_VOLUME)
  })

  it('should truncate title to 30 chars', () => {
    const longText = '这是一段很长的文本内容超过三十个字符应该被截断处理掉多余的字符部分'
    const record = createHistoryRecord(longText, 'standard-male', 1.5)
    expect(record.title).toBe(longText.slice(0, 30))
    expect(record.title.length).toBe(30)
  })

  it('should strip pause markers from title', () => {
    const record = createHistoryRecord('你好<pause=500>世界', 'standard-female', 1.0)
    expect(record.title).toBe('你好世界')
  })

  it('should handle empty text', () => {
    const record = createHistoryRecord('', 'standard-female', 1.0)
    expect(record.title).toBe('')
    expect(record.text).toBe('')
  })

  it('should handle null text', () => {
    const record = createHistoryRecord(null, 'standard-female', 1.0)
    expect(record.title).toBe('')
  })
})

describe('serializeConfig', () => {
  it('should serialize a config object', () => {
    const config = { speed: 1.5, pitch: 3, volume: 60, voiceId: 'gentle-female' }
    const json = serializeConfig(config)
    const parsed = JSON.parse(json)
    expect(parsed.speed).toBe(1.5)
    expect(parsed.pitch).toBe(3)
    expect(parsed.volume).toBe(60)
    expect(parsed.voiceId).toBe('gentle-female')
  })

  it('should fill defaults for missing fields', () => {
    const json = serializeConfig({})
    const parsed = JSON.parse(json)
    expect(parsed.speed).toBe(DEFAULT_SPEED)
    expect(parsed.pitch).toBe(DEFAULT_PITCH)
    expect(parsed.volume).toBe(DEFAULT_VOLUME)
    expect(parsed.voiceId).toBe(DEFAULT_VOICE_ID)
  })

  it('should handle null', () => {
    expect(serializeConfig(null)).toBe('{}')
  })
})

describe('deserializeConfig', () => {
  it('should deserialize valid JSON', () => {
    const json = JSON.stringify({ speed: 2.0, pitch: 5, volume: 90, voiceId: 'child' })
    const config = deserializeConfig(json)
    expect(config.speed).toBe(2.0)
    expect(config.pitch).toBe(5)
    expect(config.volume).toBe(90)
    expect(config.voiceId).toBe('child')
  })

  it('should fill defaults for missing fields', () => {
    const json = JSON.stringify({ speed: 1.5 })
    const config = deserializeConfig(json)
    expect(config.speed).toBe(1.5)
    expect(config.pitch).toBe(DEFAULT_PITCH)
    expect(config.volume).toBe(DEFAULT_VOLUME)
    expect(config.voiceId).toBe(DEFAULT_VOICE_ID)
  })

  it('should return null for invalid JSON', () => {
    expect(deserializeConfig('not json')).toBe(null)
  })

  it('should return null for null input', () => {
    expect(deserializeConfig(null)).toBe(null)
  })

  it('should return null for empty string', () => {
    expect(deserializeConfig('')).toBe(null)
  })

  it('should return null for non-object JSON', () => {
    expect(deserializeConfig('"hello"')).toBe(null)
    expect(deserializeConfig('42')).toBe(null)
  })
})

describe('validateConfig', () => {
  it('should return true for valid config', () => {
    expect(validateConfig({ speed: 1.0, pitch: 0, volume: 80, voiceId: 'standard-female' })).toBe(true)
  })

  it('should return false for null', () => {
    expect(validateConfig(null)).toBe(false)
  })

  it('should return false for missing fields', () => {
    expect(validateConfig({ speed: 1.0, pitch: 0, volume: 80 })).toBe(false)
  })

  it('should return false for wrong types', () => {
    expect(validateConfig({ speed: '1.0', pitch: 0, volume: 80, voiceId: 'standard-female' })).toBe(false)
  })
})

describe('getVoiceById', () => {
  it('should return matching voice', () => {
    const voice = getVoiceById('child')
    expect(voice.id).toBe('child')
    expect(voice.name).toBe('童声')
  })

  it('should return first voice for unknown id', () => {
    const voice = getVoiceById('unknown')
    expect(voice.id).toBe(VOICE_PRESETS[0].id)
  })
})

describe('getVoiceName', () => {
  it('should return voice name by id', () => {
    expect(getVoiceName('standard-female')).toBe('标准女声')
  })

  it('should return first voice name for unknown id', () => {
    expect(getVoiceName('unknown')).toBe(VOICE_PRESETS[0].name)
  })
})

describe('formatPauseDuration', () => {
  it('should format milliseconds below 1000', () => {
    expect(formatPauseDuration(200)).toBe('200ms')
    expect(formatPauseDuration(500)).toBe('500ms')
    expect(formatPauseDuration(800)).toBe('800ms')
  })

  it('should format whole seconds', () => {
    expect(formatPauseDuration(1000)).toBe('1s')
    expect(formatPauseDuration(2000)).toBe('2s')
    expect(formatPauseDuration(3000)).toBe('3s')
  })

  it('should format fractional seconds correctly', () => {
    expect(formatPauseDuration(1500)).toBe('1.5s')
    expect(formatPauseDuration(1200)).toBe('1.2s')
    expect(formatPauseDuration(2500)).toBe('2.5s')
    expect(formatPauseDuration(800)).toBe('800ms')
  })
})

describe('buildAuditionText', () => {
  it('should build audition text with provided voice name', () => {
    expect(buildAuditionText('标准女声')).toBe('你好，这是语音助手，当前音色为标准女声。')
    expect(buildAuditionText('童声')).toBe('你好，这是语音助手，当前音色为童声。')
  })

  it('should default to 标准女声 when voice name is missing', () => {
    expect(buildAuditionText('')).toBe('你好，这是语音助手，当前音色为标准女声。')
    expect(buildAuditionText(null)).toBe('你好，这是语音助手，当前音色为标准女声。')
    expect(buildAuditionText(undefined)).toBe('你好，这是语音助手，当前音色为标准女声。')
  })
})

describe('parseSegmentsWithPauses', () => {
  it('should return empty array for null or empty', () => {
    expect(parseSegmentsWithPauses(null)).toEqual([])
    expect(parseSegmentsWithPauses(undefined)).toEqual([])
    expect(parseSegmentsWithPauses('')).toEqual([])
  })

  it('should return single text segment for text without pauses', () => {
    const result = parseSegmentsWithPauses('你好世界')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'text', content: '你好世界', duration: 0 })
  })

  it('should parse a single pause marker at beginning', () => {
    const result = parseSegmentsWithPauses('<pause=500>你好')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ type: 'pause', content: '<pause=500>', duration: 500 })
    expect(result[1]).toEqual({ type: 'text', content: '你好', duration: 0 })
  })

  it('should parse a single pause marker at end', () => {
    const result = parseSegmentsWithPauses('你好<pause=500>')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ type: 'text', content: '你好', duration: 0 })
    expect(result[1]).toEqual({ type: 'pause', content: '<pause=500>', duration: 500 })
  })

  it('should parse text with pause in the middle', () => {
    const result = parseSegmentsWithPauses('你好<pause=500>世界')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ type: 'text', content: '你好', duration: 0 })
    expect(result[1]).toEqual({ type: 'pause', content: '<pause=500>', duration: 500 })
    expect(result[2]).toEqual({ type: 'text', content: '世界', duration: 0 })
  })

  it('should parse multiple pause markers', () => {
    const result = parseSegmentsWithPauses('A<pause=200>B<pause=800>C')
    expect(result).toHaveLength(5)
    expect(result[0].type).toBe('text')
    expect(result[0].content).toBe('A')
    expect(result[1].type).toBe('pause')
    expect(result[1].duration).toBe(200)
    expect(result[2].type).toBe('text')
    expect(result[2].content).toBe('B')
    expect(result[3].type).toBe('pause')
    expect(result[3].duration).toBe(800)
    expect(result[4].type).toBe('text')
    expect(result[4].content).toBe('C')
  })

  it('should parse consecutive pause markers', () => {
    const result = parseSegmentsWithPauses('A<pause=500><pause=1000>B')
    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ type: 'text', content: 'A', duration: 0 })
    expect(result[1]).toEqual({ type: 'pause', content: '<pause=500>', duration: 500 })
    expect(result[2]).toEqual({ type: 'pause', content: '<pause=1000>', duration: 1000 })
    expect(result[3]).toEqual({ type: 'text', content: 'B', duration: 0 })
  })

  it('should parse 2 second pause correctly', () => {
    const result = parseSegmentsWithPauses('开始<pause=2000>结束')
    expect(result).toHaveLength(3)
    expect(result[1].type).toBe('pause')
    expect(result[1].duration).toBe(2000)
  })
})

describe('flattenTextSegments', () => {
  it('should return empty string for null or non-array', () => {
    expect(flattenTextSegments(null)).toBe('')
    expect(flattenTextSegments(undefined)).toBe('')
    expect(flattenTextSegments('not-array')).toBe('')
    expect(flattenTextSegments([])).toBe('')
  })

  it('should join all text segments', () => {
    const segments = [
      { type: 'text', content: '你好', duration: 0 },
      { type: 'pause', content: '<pause=500>', duration: 500 },
      { type: 'text', content: '世界', duration: 0 },
    ]
    expect(flattenTextSegments(segments)).toBe('你好世界')
  })

  it('should skip pause segments and non-object entries', () => {
    const segments = [
      { type: 'pause', content: '<pause=200>', duration: 200 },
      null,
      undefined,
      { type: 'text', content: 'A', duration: 0 },
      { type: 'text', content: 'BC', duration: 0 },
      { type: 'pause', content: '<pause=800>', duration: 800 },
    ]
    expect(flattenTextSegments(segments)).toBe('ABC')
  })

  it('should return original text equivalent from parseSegmentsWithPauses result', () => {
    const original = '你好<pause=500>世界<pause=1000>结束'
    const segs = parseSegmentsWithPauses(original)
    const flattened = flattenTextSegments(segs)
    const cleaned = original.replace(/<pause=\d+>/g, '')
    expect(flattened).toBe(cleaned)
  })
})

describe('PAUSE_DURATION_OPTIONS', () => {
  it('should have 6 options', () => {
    expect(PAUSE_DURATION_OPTIONS).toHaveLength(6)
  })

  it('should have correct values', () => {
    expect(PAUSE_DURATION_OPTIONS[0].value).toBe(200)
    expect(PAUSE_DURATION_OPTIONS[5].value).toBe(2000)
  })
})

describe('VOICE_PRESETS', () => {
  it('should have at least 6 presets', () => {
    expect(VOICE_PRESETS.length).toBeGreaterThanOrEqual(6)
  })

  it('should have id, name, description for each preset', () => {
    VOICE_PRESETS.forEach((v) => {
      expect(v.id).toBeDefined()
      expect(v.name).toBeDefined()
      expect(v.description).toBeDefined()
    })
  })
})

describe('SAMPLE_TEXT', () => {
  it('should be non-empty string', () => {
    expect(typeof SAMPLE_TEXT).toBe('string')
    expect(SAMPLE_TEXT.length).toBeGreaterThan(0)
  })

  it('should be around 100 characters', () => {
    expect(SAMPLE_TEXT.length).toBeLessThanOrEqual(150)
  })
})
