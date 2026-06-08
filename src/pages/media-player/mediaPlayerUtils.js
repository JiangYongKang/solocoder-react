import {
  STORAGE_KEY_PLAYLIST,
  STORAGE_KEY_PLAYBACK_STATE,
  STORAGE_KEY_LYRICS,
  STORAGE_KEY_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_PLAYLIST,
  PLAYBACK_SPEEDS,
  MEDIA_TYPES,
} from './constants'

export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) {
    return '00:00'
  }
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function parseLrcTime(timeStr) {
  const match = timeStr.match(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?]/)
  if (!match) return null
  const minutes = parseInt(match[1], 10)
  const seconds = parseInt(match[2], 10)
  const millis = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0
  return minutes * 60 + seconds + millis / 1000
}

export function parseLrc(lrcText) {
  if (!lrcText || typeof lrcText !== 'string') {
    return []
  }
  const lines = lrcText.split(/\r?\n/)
  const result = []
  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue
    const matches = trimmed.matchAll(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?]/g)
    const timeMatches = matches ? [...matches] : []
    if (timeMatches.length === 0) continue
    let text = trimmed.replace(/\[\d{1,2}:\d{1,2}(?:[.:]\d{1,3})?]/g, '').trim()
    for (const timeMatch of timeMatches) {
      const time = parseLrcTime(timeMatch[0])
      if (time !== null) {
        result.push({ time, text })
      }
    }
  }
  result.sort((a, b) => a.time - b.time)
  return result
}

export function findCurrentLyricIndex(lyrics, currentTime) {
  if (!Array.isArray(lyrics) || lyrics.length === 0) {
    return -1
  }
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (lyrics[i].time <= currentTime) {
      return i
    }
  }
  return -1
}

export function generateMediaId() {
  return 'media_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function detectMediaType(url) {
  if (!url || typeof url !== 'string') {
    return MEDIA_TYPES.AUDIO
  }
  const lower = url.toLowerCase().split('?')[0]
  const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.avi']
  const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg']
  for (const ext of videoExts) {
    if (lower.endsWith(ext)) return MEDIA_TYPES.VIDEO
  }
  for (const ext of audioExts) {
    if (lower.endsWith(ext)) return MEDIA_TYPES.AUDIO
  }
  return MEDIA_TYPES.AUDIO
}

export function validateMediaItem(item) {
  if (!item || typeof item !== 'object') {
    return { valid: false, errors: { item: '无效的媒体项' } }
  }
  const errors = {}
  const title = (item.title || '').trim()
  const url = (item.url || '').trim()
  if (!title) {
    errors.title = '标题不能为空'
  }
  if (!url) {
    errors.url = 'URL 不能为空'
  } else if (!/^https?:\/\//i.test(url)) {
    errors.url = 'URL 必须以 http:// 或 https:// 开头'
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function createMediaItem(title, url, type) {
  return {
    id: generateMediaId(),
    title: (title || '').trim(),
    url: (url || '').trim(),
    type: type || detectMediaType(url),
  }
}

export function loadPlaylist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAYLIST)
    if (!raw) return [...DEFAULT_PLAYLIST]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_PLAYLIST]
    const validItems = parsed.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.url === 'string'
    )
    return validItems.length > 0 ? validItems : [...DEFAULT_PLAYLIST]
  } catch {
    return [...DEFAULT_PLAYLIST]
  }
}

export function savePlaylist(playlist) {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYLIST, JSON.stringify(playlist))
    return true
  } catch {
    return false
  }
}

export function savePlaybackState(state) {
  try {
    const data = {
      currentMediaId: state.currentMediaId || null,
      currentTime: Math.floor(Math.max(0, Number(state.currentTime) || 0)),
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY_PLAYBACK_STATE, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function loadPlaybackState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAYBACK_STATE)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      currentMediaId: typeof parsed.currentMediaId === 'string' ? parsed.currentMediaId : null,
      currentTime: Math.max(0, Number(parsed.currentTime) || 0),
    }
  } catch {
    return null
  }
}

export function clearPlaybackState() {
  try {
    localStorage.removeItem(STORAGE_KEY_PLAYBACK_STATE)
    return true
  } catch {
    return false
  }
}

export function loadLyrics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LYRICS)
    return typeof raw === 'string' ? raw : ''
  } catch {
    return ''
  }
}

export function saveLyrics(lrcText) {
  try {
    localStorage.setItem(STORAGE_KEY_LYRICS, typeof lrcText === 'string' ? lrcText : '')
    return true
  } catch {
    return false
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS }
    return {
      volume: clampVolume(parsed.volume),
      playbackSpeed: clampPlaybackSpeed(parsed.playbackSpeed),
      showLyrics: typeof parsed.showLyrics === 'boolean' ? parsed.showLyrics : DEFAULT_SETTINGS.showLyrics,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    const data = {
      volume: clampVolume(settings?.volume),
      playbackSpeed: clampPlaybackSpeed(settings?.playbackSpeed),
      showLyrics: typeof settings?.showLyrics === 'boolean' ? settings.showLyrics : DEFAULT_SETTINGS.showLyrics,
    }
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function clampVolume(volume) {
  if (volume === null || volume === undefined) return DEFAULT_SETTINGS.volume
  const v = Number(volume)
  if (!isFinite(v)) return DEFAULT_SETTINGS.volume
  return Math.max(0, Math.min(1, v))
}

export function clampPlaybackSpeed(speed) {
  if (speed === null || speed === undefined) return DEFAULT_SETTINGS.playbackSpeed
  const s = Number(speed)
  if (!isFinite(s)) return DEFAULT_SETTINGS.playbackSpeed
  if (PLAYBACK_SPEEDS.includes(s)) return s
  let closest = PLAYBACK_SPEEDS[0]
  let minDiff = Math.abs(s - PLAYBACK_SPEEDS[0])
  for (const sp of PLAYBACK_SPEEDS) {
    const diff = Math.abs(s - sp)
    if (diff < minDiff) {
      minDiff = diff
      closest = sp
    }
  }
  return closest
}

export function reorderPlaylist(playlist, fromIndex, toIndex) {
  if (!Array.isArray(playlist)) return []
  const result = [...playlist]
  if (fromIndex < 0 || fromIndex >= result.length) return result
  if (toIndex < 0 || toIndex >= result.length) return result
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export function getNextMediaIndex(playlist, currentIndex) {
  if (!Array.isArray(playlist) || playlist.length === 0) return -1
  const idx = typeof currentIndex === 'number' ? currentIndex : -1
  if (idx < 0 || idx >= playlist.length - 1) {
    return 0
  }
  return idx + 1
}

export function getPrevMediaIndex(playlist, currentIndex) {
  if (!Array.isArray(playlist)) return -1
  const idx = typeof currentIndex === 'number' ? currentIndex : -1
  if (idx <= 0 || idx >= playlist.length) {
    return playlist.length - 1
  }
  return idx - 1
}

export function findMediaIndexById(playlist, mediaId) {
  if (!Array.isArray(playlist) || !mediaId) return -1
  return playlist.findIndex((item) => item.id === mediaId)
}

export function seekWithinDuration(currentTime, seconds, duration) {
  const ct = Number(currentTime) || 0
  const s = Number(seconds) || 0
  const d = isFinite(duration) && duration > 0 ? duration : Infinity
  return Math.max(0, Math.min(d, ct + s))
}
