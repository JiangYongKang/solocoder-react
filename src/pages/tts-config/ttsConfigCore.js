export const MAX_TEXT_LENGTH = 5000

export const DEFAULT_SPEED = 1.0
export const MIN_SPEED = 0.5
export const MAX_SPEED = 3.0
export const SPEED_STEP = 0.1

export const DEFAULT_PITCH = 0
export const MIN_PITCH = -12
export const MAX_PITCH = 12
export const PITCH_STEP = 1

export const DEFAULT_VOLUME = 80
export const MIN_VOLUME = 0
export const MAX_VOLUME = 100
export const VOLUME_STEP = 5

export const PAUSE_DURATION_OPTIONS = [
  { label: '200ms', value: 200 },
  { label: '500ms', value: 500 },
  { label: '800ms', value: 800 },
  { label: '1s', value: 1000 },
  { label: '1.5s', value: 1500 },
  { label: '2s', value: 2000 },
]

export const PAUSE_MARKER_REGEX = /<pause=(\d+)>/g

export const VOICE_PRESETS = [
  { id: 'standard-female', name: '标准女声', description: '清晰自然的通用女声' },
  { id: 'standard-male', name: '标准男声', description: '沉稳大气的通用男声' },
  { id: 'gentle-female', name: '温柔女声', description: '柔和温暖的女性声音' },
  { id: 'magnetic-male', name: '磁性男声', description: '低沉有磁性的男性声音' },
  { id: 'child', name: '童声', description: '天真活泼的儿童声音' },
  { id: 'news-anchor', name: '新闻播报', description: '专业正式的播报声音' },
]

export const DEFAULT_VOICE_ID = 'standard-female'

export const SAMPLE_TEXT = '春日的清晨，阳光透过薄雾洒在湖面上，波光粼粼如碎金铺水。远处的山峦在晨曦中若隐若现，宛如一幅淡彩水墨画。微风拂过，带来泥土与花草的芬芳，鸟儿在枝头欢快地歌唱，一切都充满了生机与希望。'

export const MAX_HISTORY_ITEMS = 20

export function countChars(text) {
  if (!text || typeof text !== 'string') return 0
  const cleaned = text.replace(PAUSE_MARKER_REGEX, '')
  return cleaned.length
}

export function splitParagraphs(text) {
  if (!text || typeof text !== 'string') return []
  const paragraphs = text.split(/\n\s*\n/)
  return paragraphs.map((p) => p.trim()).filter((p) => p.length > 0)
}

export function parsePauseMarkers(text) {
  if (!text || typeof text !== 'string') return []
  const markers = []
  let match
  PAUSE_MARKER_REGEX.lastIndex = 0
  while ((match = PAUSE_MARKER_REGEX.exec(text)) !== null) {
    markers.push({
      fullMatch: match[0],
      duration: parseInt(match[1], 10),
      index: match.index,
    })
  }
  return markers
}

export function extractPauseDuration(markerStr) {
  if (!markerStr || typeof markerStr !== 'string') return 0
  const match = markerStr.match(/^<pause=(\d+)>$/)
  if (!match) return 0
  return parseInt(match[1], 10)
}

export function removePauseMarkers(text) {
  if (!text || typeof text !== 'string') return ''
  return text.replace(PAUSE_MARKER_REGEX, '')
}

export function insertPauseMarker(text, position, duration) {
  if (!text || typeof text !== 'string') return text
  const pos = Math.max(0, Math.min(position, text.length))
  const marker = `<pause=${duration}>`
  return text.slice(0, pos) + marker + text.slice(pos)
}

export function removeAllPauseMarkers(text) {
  return removePauseMarkers(text)
}

export function calculateProgress(currentParaIndex, totalParas, charOffsetInPara, paraCharCount) {
  const safeTotal = Math.max(totalParas, 1)
  const safeIndex = Math.max(0, Math.min(currentParaIndex, safeTotal - 1))
  const safeOffset = Math.max(0, charOffsetInPara)
  const safeParaLen = Math.max(paraCharCount, 1)

  const paraFraction = safeOffset / safeParaLen
  const totalFraction = (safeIndex + paraFraction) / safeTotal
  return Math.min(Math.max(totalFraction * 100, 0), 100)
}

export function addToHistory(history, record, maxItems) {
  if (!Array.isArray(history)) return [record]
  const limit = maxItems || MAX_HISTORY_ITEMS
  const updated = [record, ...history]
  if (updated.length > limit) {
    return updated.slice(0, limit)
  }
  return updated
}

export function createHistoryRecord(text, voiceId, speed, pitch, volume) {
  const cleaned = removePauseMarkers(text || '')
  const title = (cleaned || '').slice(0, 30)
  return {
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    title,
    voiceId,
    speed,
    pitch: pitch ?? DEFAULT_PITCH,
    volume: volume ?? DEFAULT_VOLUME,
    text: text || '',
  }
}

export function serializeConfig(config) {
  if (!config || typeof config !== 'object') return '{}'
  const safe = {
    speed: config.speed ?? DEFAULT_SPEED,
    pitch: config.pitch ?? DEFAULT_PITCH,
    volume: config.volume ?? DEFAULT_VOLUME,
    voiceId: config.voiceId ?? DEFAULT_VOICE_ID,
  }
  return JSON.stringify(safe)
}

export function deserializeConfig(json) {
  if (!json || typeof json !== 'string') return null
  try {
    const obj = JSON.parse(json)
    if (!obj || typeof obj !== 'object') return null
    return {
      speed: typeof obj.speed === 'number' ? obj.speed : DEFAULT_SPEED,
      pitch: typeof obj.pitch === 'number' ? obj.pitch : DEFAULT_PITCH,
      volume: typeof obj.volume === 'number' ? obj.volume : DEFAULT_VOLUME,
      voiceId: typeof obj.voiceId === 'string' ? obj.voiceId : DEFAULT_VOICE_ID,
    }
  } catch {
    return null
  }
}

export function validateConfig(obj) {
  if (!obj || typeof obj !== 'object') return false
  if (typeof obj.speed !== 'number') return false
  if (typeof obj.pitch !== 'number') return false
  if (typeof obj.volume !== 'number') return false
  if (typeof obj.voiceId !== 'string') return false
  return true
}

export function getVoiceById(voiceId) {
  return VOICE_PRESETS.find((v) => v.id === voiceId) || VOICE_PRESETS[0]
}

export function getVoiceName(voiceId) {
  const voice = getVoiceById(voiceId)
  return voice ? voice.name : VOICE_PRESETS[0].name
}

export function formatPauseDuration(ms) {
  if (ms >= 1000) {
    const sec = ms / 1000
    return Number.isInteger(sec) ? `${sec}s` : `${sec.toFixed(1).replace(/\.0$/, '')}s`
  }
  return `${ms}ms`
}

export function getTextWithoutPauseMarkersForParagraph(paragraph) {
  return removePauseMarkers(paragraph)
}

export function buildAuditionText(voiceName) {
  return `你好，这是语音助手，当前音色为${voiceName || '标准女声'}。`
}

export function parseSegmentsWithPauses(text) {
  if (!text || typeof text !== 'string') return []
  const segments = []
  let lastIdx = 0
  let match
  PAUSE_MARKER_REGEX.lastIndex = 0
  while ((match = PAUSE_MARKER_REGEX.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push({
        type: 'text',
        content: text.slice(lastIdx, match.index),
        duration: 0,
      })
    }
    segments.push({
      type: 'pause',
      content: match[0],
      duration: parseInt(match[1], 10),
    })
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIdx),
      duration: 0,
    })
  }
  return segments
}

export function flattenTextSegments(segments) {
  if (!Array.isArray(segments)) return ''
  return segments
    .filter((s) => s && s.type === 'text')
    .map((s) => s.content)
    .join('')
}

export function normalizeHistoryRecord(record) {
  if (!record || typeof record !== 'object') {
    return {
      text: '',
      voiceId: DEFAULT_VOICE_ID,
      speed: DEFAULT_SPEED,
      pitch: DEFAULT_PITCH,
      volume: DEFAULT_VOLUME,
    }
  }
  return {
    text: typeof record.text === 'string' ? record.text : '',
    voiceId: typeof record.voiceId === 'string' ? record.voiceId : DEFAULT_VOICE_ID,
    speed: typeof record.speed === 'number' ? record.speed : DEFAULT_SPEED,
    pitch: typeof record.pitch === 'number' ? record.pitch : DEFAULT_PITCH,
    volume: typeof record.volume === 'number' ? record.volume : DEFAULT_VOLUME,
  }
}
