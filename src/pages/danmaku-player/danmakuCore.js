import {
  DANMAKU_POSITIONS,
  MAX_DANMAKU_LENGTH,
  SCROLL_DURATION,
  FIXED_DURATION,
  FADE_DURATION,
  FONT_SIZE_PX,
  DENSITY_CONFIG,
  DEFAULT_SETTINGS,
  STORAGE_KEY_SETTINGS,
  RANDOM_USERNAMES,
  DANMAKU_COLORS,
  FONT_SIZES,
  DENSITY_LEVELS,
  VIDEO_DURATION,
  PLAYBACK_SPEEDS,
} from './constants.js'

let danmakuIdCounter = 0
let danmakuIdRandomSuffix = 0

function getRandomSuffix() {
  danmakuIdRandomSuffix++
  const hasCrypto =
    typeof crypto !== 'undefined' &&
    crypto !== null &&
    typeof crypto.getRandomValues === 'function'
  if (hasCrypto) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0].toString(36)
  }
  return (
    Math.floor(Math.random() * 0xffffffff).toString(36) +
    danmakuIdRandomSuffix.toString(36)
  )
}

export function generateDanmakuId() {
  danmakuIdCounter++
  const randomPart = getRandomSuffix()
  return 'danmaku_' + randomPart + '_' + danmakuIdCounter
}

export function resetDanmakuIdCounter() {
  danmakuIdCounter = 0
}

export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) {
    return '00:00'
  }
  const totalSeconds = Math.floor(seconds)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function validateDanmakuText(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, trimmed: '', error: '弹幕内容不能为空' }
  }
  const trimmed = text.trim()
  if (!trimmed) {
    return { valid: false, trimmed: '', error: '弹幕内容不能为空' }
  }
  if (trimmed.length > MAX_DANMAKU_LENGTH) {
    const truncated = trimmed.slice(0, MAX_DANMAKU_LENGTH)
    return { valid: true, trimmed: truncated, truncated: true, error: `弹幕内容超过${MAX_DANMAKU_LENGTH}字符，已自动截断` }
  }
  return { valid: true, trimmed, truncated: false, error: null }
}

export function getRandomUsername(usernames) {
  const names = arguments.length === 0 ? RANDOM_USERNAMES : usernames
  if (!Array.isArray(names) || names.length === 0) {
    return '匿名用户'
  }
  return names[Math.floor(Math.random() * names.length)]
}

export function isValidColor(color) {
  if (!color || typeof color !== 'string') return false
  return DANMAKU_COLORS.includes(color)
}

export function isValidFontSize(size) {
  if (!size || typeof size !== 'string') return false
  return Object.values(FONT_SIZES).includes(size)
}

export function isValidPosition(position) {
  if (!position || typeof position !== 'string') return false
  return Object.values(DANMAKU_POSITIONS).includes(position)
}

export function isValidDensity(density) {
  if (!density || typeof density !== 'string') return false
  return Object.values(DENSITY_LEVELS).includes(density)
}

export function createDanmaku(options = {}) {
  const {
    text,
    position = DANMAKU_POSITIONS.SCROLL,
    color = DANMAKU_COLORS[0],
    fontSize = FONT_SIZES.MEDIUM,
    videoTime = 0,
    username,
  } = options

  const validation = validateDanmakuText(text)
  if (!validation.valid) {
    return null
  }

  return {
    id: generateDanmakuId(),
    text: validation.trimmed,
    position: isValidPosition(position) ? position : DANMAKU_POSITIONS.SCROLL,
    color: isValidColor(color) ? color : DANMAKU_COLORS[0],
    fontSize: isValidFontSize(fontSize) ? fontSize : FONT_SIZES.MEDIUM,
    videoTime: Math.max(0, Math.min(VIDEO_DURATION, Number(videoTime) || 0)),
    username: username || getRandomUsername(),
    createdAt: Date.now(),
  }
}

export function getFontSizePx(fontSize) {
  return FONT_SIZE_PX[fontSize] || FONT_SIZE_PX[FONT_SIZES.MEDIUM]
}

export function getDensityConfig(density) {
  return DENSITY_CONFIG[density] || DENSITY_CONFIG[DENSITY_LEVELS.MEDIUM]
}

export function measureTextWidth(ctx, text, fontSize) {
  if (!ctx) {
    return text.length * getFontSizePx(fontSize) * 0.6
  }
  const size = getFontSizePx(fontSize)
  ctx.font = `${size}px sans-serif`
  return ctx.measureText(text).width
}

export function calculateScrollSpeed(canvasWidth, duration = SCROLL_DURATION) {
  return canvasWidth / (duration / 1000)
}

export function initializeScrollTracks(trackCount) {
  const tracks = []
  for (let i = 0; i < trackCount; i++) {
    tracks.push([])
  }
  return tracks
}

export function findAvailableScrollTrack(tracks, currentTime, canvasWidth, textWidth, speed) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return -1
  }

  let bestTrack = 0
  let minCount = Infinity
  let emptyTrack = -1
  let safeTrack = -1

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    const activeDanmakus = track.filter((d) => {
      if (d.removed) return false
      const elapsed = (currentTime - d.startTime) / 1000
      const x = canvasWidth - elapsed * speed
      return x + textWidth > 0
    })

    if (activeDanmakus.length === 0 && emptyTrack === -1) {
      emptyTrack = i
    }

    const lastDanmaku = activeDanmakus[activeDanmakus.length - 1]
    if (lastDanmaku && safeTrack === -1 && emptyTrack === -1) {
      const elapsed = (currentTime - lastDanmaku.startTime) / 1000
      const lastX = canvasWidth - elapsed * speed
      if (lastX < canvasWidth - lastDanmaku.textWidth - 20) {
        safeTrack = i
      }
    }

    if (activeDanmakus.length < minCount) {
      minCount = activeDanmakus.length
      bestTrack = i
    }
  }

  if (emptyTrack !== -1) return emptyTrack
  if (safeTrack !== -1) return safeTrack
  return bestTrack
}

export function getTrackYPosition(trackIndex, density, canvasHeight, fontSize) {
  const config = getDensityConfig(density)
  const fontSizePx = getFontSizePx(fontSize)
  const topPadding = fontSizePx + 10
  const availableHeight = canvasHeight - topPadding * 2
  const totalTrackHeight = config.trackCount * config.verticalSpacing
  const startY = topPadding + Math.max(0, (availableHeight - totalTrackHeight) / 2)
  return startY + trackIndex * config.verticalSpacing
}

export function getFixedYPosition(position, canvasHeight, fontSize) {
  const fontSizePx = getFontSizePx(fontSize)
  switch (position) {
    case DANMAKU_POSITIONS.TOP:
      return canvasHeight * 0.15 + fontSizePx
    case DANMAKU_POSITIONS.MIDDLE:
      return canvasHeight / 2 + fontSizePx / 2
    case DANMAKU_POSITIONS.BOTTOM:
      return canvasHeight * 0.75
    default:
      return canvasHeight / 2
  }
}

export function checkFixedPositionConflict(activeFixedDanmakus, position, canvasHeight, fontSize) {
  if (!Array.isArray(activeFixedDanmakus) || activeFixedDanmakus.length === 0) {
    return false
  }

  const targetY = getFixedYPosition(position, canvasHeight, fontSize)
  const fontSizePx = getFontSizePx(fontSize)
  const tolerance = fontSizePx + 5

  for (const d of activeFixedDanmakus) {
    if (d.removed) continue
    if (d.position !== position) continue
    const dY = getFixedYPosition(d.position, canvasHeight, d.fontSize)
    if (Math.abs(targetY - dY) < tolerance) {
      return true
    }
  }

  return false
}

export function updateScrollDanmaku(danmaku, currentTime, canvasWidth, speed) {
  if (!danmaku || danmaku.position !== DANMAKU_POSITIONS.SCROLL) {
    return danmaku
  }

  const elapsed = (currentTime - danmaku.startTime) / 1000
  const x = canvasWidth - elapsed * speed
  const opacity = danmaku.opacity ?? 1

  if (x + danmaku.textWidth < 0) {
    return { ...danmaku, x, opacity, removed: true }
  }

  return { ...danmaku, x, opacity }
}

export function updateFixedDanmaku(danmaku, currentTime) {
  if (!danmaku || danmaku.position === DANMAKU_POSITIONS.SCROLL) {
    return danmaku
  }

  const elapsed = currentTime - danmaku.startTime

  if (elapsed >= FIXED_DURATION + FADE_DURATION) {
    return { ...danmaku, opacity: 0, removed: true }
  }

  if (elapsed >= FIXED_DURATION) {
    const fadeElapsed = elapsed - FIXED_DURATION
    const opacity = 1 - fadeElapsed / FADE_DURATION
    return { ...danmaku, opacity: Math.max(0, opacity) }
  }

  return { ...danmaku, opacity: 1 }
}

export function updateAllDanmakus(activeDanmakus, currentTime, canvasWidth, speed, canvasHeight) {
  if (!Array.isArray(activeDanmakus)) {
    return []
  }

  return activeDanmakus.map((d) => {
    if (d.removed) return d
    if (d.position === DANMAKU_POSITIONS.SCROLL) {
      return updateScrollDanmaku(d, currentTime, canvasWidth, speed)
    }
    return updateFixedDanmaku(d, currentTime)
  })
}

export function removeExpiredDanmakus(activeDanmakus) {
  if (!Array.isArray(activeDanmakus)) {
    return []
  }
  return activeDanmakus.filter((d) => !d.removed)
}

export function clampOpacity(value) {
  const v = Number(value)
  if (!isFinite(v)) return DEFAULT_SETTINGS.danmakuOpacity
  return Math.max(0.1, Math.min(1, v))
}

export function clampVolume(value) {
  const v = Number(value)
  if (!isFinite(v)) return DEFAULT_SETTINGS.volume
  return Math.max(0, Math.min(1, v))
}

export function clampPlaybackSpeed(speed) {
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

export function loadSettings(storage) {
  const defaultStorage =
    typeof window !== 'undefined' && window.localStorage
      ? window.localStorage
      : typeof globalThis !== 'undefined' && globalThis.localStorage
        ? globalThis.localStorage
        : null
  const _storage = arguments.length === 0 ? defaultStorage : storage
  if (!_storage) return { ...DEFAULT_SETTINGS }
  try {
    const raw = _storage.getItem(STORAGE_KEY_SETTINGS)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS }
    return {
      danmakuEnabled: typeof parsed.danmakuEnabled === 'boolean' ? parsed.danmakuEnabled : DEFAULT_SETTINGS.danmakuEnabled,
      danmakuOpacity: clampOpacity(parsed.danmakuOpacity),
      density: isValidDensity(parsed.density) ? parsed.density : DEFAULT_SETTINGS.density,
      volume: clampVolume(parsed.volume),
      playbackSpeed: clampPlaybackSpeed(parsed.playbackSpeed),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings, storage) {
  const defaultStorage =
    typeof window !== 'undefined' && window.localStorage
      ? window.localStorage
      : typeof globalThis !== 'undefined' && globalThis.localStorage
        ? globalThis.localStorage
        : null
  const _storage = arguments.length < 2 ? defaultStorage : storage
  if (!_storage) return false
  try {
    const data = {
      danmakuEnabled: typeof settings?.danmakuEnabled === 'boolean' ? settings.danmakuEnabled : DEFAULT_SETTINGS.danmakuEnabled,
      danmakuOpacity: clampOpacity(settings?.danmakuOpacity),
      density: isValidDensity(settings?.density) ? settings.density : DEFAULT_SETTINGS.density,
      volume: clampVolume(settings?.volume),
      playbackSpeed: clampPlaybackSpeed(settings?.playbackSpeed),
    }
    _storage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function calculateProgressPercent(currentTime, duration) {
  const ct = Number(currentTime) || 0
  const d = Number(duration) || 0
  if (d <= 0 || !isFinite(d)) return 0
  return Math.max(0, Math.min(100, (ct / d) * 100))
}

export function calculateTimeFromPercent(percent, duration) {
  const p = Number(percent) || 0
  const d = Number(duration) || 0
  if (d <= 0 || !isFinite(d)) return 0
  return Math.max(0, Math.min(d, (p / 100) * d))
}

export function sortDanmakuListByTime(danmakuList) {
  if (!Array.isArray(danmakuList)) return []
  return [...danmakuList].sort((a, b) => b.videoTime - a.videoTime)
}

export function getDanmakuPositionIcon(position) {
  switch (position) {
    case DANMAKU_POSITIONS.SCROLL:
      return '↔'
    case DANMAKU_POSITIONS.TOP:
      return '↑'
    case DANMAKU_POSITIONS.MIDDLE:
      return '●'
    case DANMAKU_POSITIONS.BOTTOM:
      return '↓'
    default:
      return '·'
  }
}

export function evictOldestIfOverCapacity(activeDanmakus, maxCapacity) {
  if (!Array.isArray(activeDanmakus)) return []
  if (activeDanmakus.length <= maxCapacity) return activeDanmakus

  const scrollDanmakus = activeDanmakus.filter((d) => d.position === DANMAKU_POSITIONS.SCROLL && !d.removed)

  if (scrollDanmakus.length > maxCapacity) {
    const toRemove = scrollDanmakus.length - maxCapacity
    const sorted = [...scrollDanmakus].sort((a, b) => a.startTime - b.startTime)
    const toRemoveIds = new Set(sorted.slice(0, toRemove).map((d) => d.id))
    return [...activeDanmakus.map((d) => (toRemoveIds.has(d.id) ? { ...d, removed: true } : d))]
  }

  return activeDanmakus
}

export function cleanupOutOfRangeScrollDanmakus(activeDanmakus, newTrackCount) {
  if (!Array.isArray(activeDanmakus)) return []
  const count = Number(newTrackCount)
  if (!isFinite(count) || count < 0) return activeDanmakus

  let changed = false
  const result = activeDanmakus.map((d) => {
    if (d.position === DANMAKU_POSITIONS.SCROLL && !d.removed) {
      const trackIdx = Number(d.trackIndex)
      if (!isNaN(trackIdx) && (trackIdx < 0 || trackIdx >= count)) {
        changed = true
        return { ...d, removed: true }
      }
    }
    return d
  })

  return changed ? result : activeDanmakus
}
