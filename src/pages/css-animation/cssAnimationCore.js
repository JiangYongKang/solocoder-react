import { STORAGE_KEY, MAX_ANIMATIONS, ANIMATION_PROPERTIES, TRANSFORM_PROPERTIES, COLOR_PROPERTIES } from './constants.js'

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function createKeyframe(time, value, easing = 'linear') {
  return {
    id: generateId(),
    time: Math.round(time * 100) / 100,
    value,
    easing,
  }
}

export function createPropertyTrack(propertyName) {
  const config = ANIMATION_PROPERTIES[propertyName]
  if (!config) return null

  return {
    id: generateId(),
    property: propertyName,
    visible: true,
    unit: config.unit,
    keyframes: [
      createKeyframe(0, config.default),
      createKeyframe(100, config.default),
    ],
  }
}

export function createAnimation(name = 'myAnimation') {
  return {
    id: generateId(),
    name,
    duration: 2,
    playbackSpeed: 1,
    iterations: 'infinite',
    direction: 'normal',
    fillMode: 'forwards',
    tracks: [
      createPropertyTrack('translateX'),
      createPropertyTrack('translateY'),
      createPropertyTrack('opacity'),
    ].filter(Boolean),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function addPropertyTrack(animation, propertyName) {
  const existingTrack = animation.tracks.find((t) => t.property === propertyName)
  if (existingTrack) return animation

  const newTrack = createPropertyTrack(propertyName)
  if (!newTrack) return animation

  return {
    ...animation,
    tracks: [...animation.tracks, newTrack],
    updatedAt: Date.now(),
  }
}

export function removePropertyTrack(animation, trackId) {
  const track = animation.tracks.find((t) => t.id === trackId)
  if (!track) return animation
  if (animation.tracks.length <= 1) return animation

  return {
    ...animation,
    tracks: animation.tracks.filter((t) => t.id !== trackId),
    updatedAt: Date.now(),
  }
}

export function toggleTrackVisibility(animation, trackId) {
  return {
    ...animation,
    tracks: animation.tracks.map((t) =>
      t.id === trackId ? { ...t, visible: !t.visible } : t
    ),
    updatedAt: Date.now(),
  }
}

export function addKeyframe(animation, trackId, time, value) {
  const clampedTime = Math.max(0, Math.min(100, time))
  const track = animation.tracks.find((t) => t.id === trackId)
  if (!track) return animation

  const existingKeyframe = track.keyframes.find((k) => Math.abs(k.time - clampedTime) < 0.01)
  if (existingKeyframe) return animation

  const newValue = value !== undefined ? value : interpolateValue(track, clampedTime)
  const newKeyframe = createKeyframe(clampedTime, newValue, getEasingBetween(track, clampedTime))

  const newKeyframes = [...track.keyframes, newKeyframe].sort((a, b) => a.time - b.time)

  return {
    ...animation,
    tracks: animation.tracks.map((t) =>
      t.id === trackId ? { ...t, keyframes: newKeyframes } : t
    ),
    updatedAt: Date.now(),
  }
}

export function removeKeyframe(animation, trackId, keyframeId) {
  const track = animation.tracks.find((t) => t.id === trackId)
  if (!track) return animation
  if (track.keyframes.length <= 2) return animation

  const keyframe = track.keyframes.find((k) => k.id === keyframeId)
  if (!keyframe) return animation
  if (keyframe.time === 0 || keyframe.time === 100) return animation

  return {
    ...animation,
    tracks: animation.tracks.map((t) =>
      t.id === trackId
        ? { ...t, keyframes: t.keyframes.filter((k) => k.id !== keyframeId) }
        : t
    ),
    updatedAt: Date.now(),
  }
}

export function updateKeyframeValue(animation, trackId, keyframeId, value) {
  return {
    ...animation,
    tracks: animation.tracks.map((t) =>
      t.id === trackId
        ? {
            ...t,
            keyframes: t.keyframes.map((k) =>
              k.id === keyframeId ? { ...k, value } : k
            ),
          }
        : t
    ),
    updatedAt: Date.now(),
  }
}

export function moveKeyframe(animation, trackId, keyframeId, newTime) {
  const clampedTime = Math.max(0, Math.min(100, newTime))
  const track = animation.tracks.find((t) => t.id === trackId)
  if (!track) return animation

  const keyframe = track.keyframes.find((k) => k.id === keyframeId)
  if (!keyframe) return animation
  if (keyframe.time === 0 || keyframe.time === 100) return animation

  const conflict = track.keyframes.find(
    (k) => k.id !== keyframeId && Math.abs(k.time - clampedTime) < 0.01
  )
  if (conflict) return animation

  const newKeyframes = track.keyframes
    .map((k) => (k.id === keyframeId ? { ...k, time: clampedTime } : k))
    .sort((a, b) => a.time - b.time)

  return {
    ...animation,
    tracks: animation.tracks.map((t) =>
      t.id === trackId ? { ...t, keyframes: newKeyframes } : t
    ),
    updatedAt: Date.now(),
  }
}

export function updateEasing(animation, trackId, fromKeyframeId, easing) {
  const track = animation.tracks.find((t) => t.id === trackId)
  if (!track) return animation

  return {
    ...animation,
    tracks: animation.tracks.map((t) =>
      t.id === trackId
        ? {
            ...t,
            keyframes: t.keyframes.map((k) =>
              k.id === fromKeyframeId ? { ...k, easing } : k
            ),
          }
        : t
    ),
    updatedAt: Date.now(),
  }
}

function getEasingBetween(track, time) {
  const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      return sorted[i].easing
    }
  }
  return 'linear'
}

function interpolateValue(track, time) {
  const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)

  if (time <= sorted[0].time) return sorted[0].value
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value

  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      const from = sorted[i]
      const to = sorted[i + 1]
      const progress = (time - from.time) / (to.time - from.time)

      if (typeof from.value === 'number' && typeof to.value === 'number') {
        return Math.round((from.value + (to.value - from.value) * progress) * 100) / 100
      }
      return from.value
    }
  }
  return sorted[0].value
}

export function getSurroundingKeyframes(track, keyframeId) {
  const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)
  const index = sorted.findIndex((k) => k.id === keyframeId)
  if (index === -1) return null

  return {
    prev: index > 0 ? sorted[index - 1] : null,
    current: sorted[index],
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  }
}

export function updateAnimationSettings(animation, settings) {
  return {
    ...animation,
    ...settings,
    updatedAt: Date.now(),
  }
}

export function generateKeyframesCSS(animation, name = animation.name) {
  const visibleTracks = animation.tracks.filter((t) => t.visible)
  if (visibleTracks.length === 0) return ''

  const allTimes = new Set()
  visibleTracks.forEach((track) => {
    track.keyframes.forEach((k) => allTimes.add(k.time))
  })

  const sortedTimes = [...allTimes].sort((a, b) => a.time - b.time)

  let css = `@keyframes ${name} {\n`

  sortedTimes.forEach((time) => {
    css += `  ${time}% {\n`

    const transformParts = []

    visibleTracks.forEach((track) => {
      const keyframe = track.keyframes.find((k) => k.time === time)
      if (!keyframe) {
        const interpolated = interpolateValue(track, time)
        if (TRANSFORM_PROPERTIES.includes(track.property)) {
          transformParts.push(formatTransformValue(track.property, interpolated, track.unit))
        } else {
          css += `    ${ANIMATION_PROPERTIES[track.property].cssProp}: ${formatValue(interpolated, track.unit)};\n`
        }
      } else {
        if (TRANSFORM_PROPERTIES.includes(track.property)) {
          transformParts.push(formatTransformValue(track.property, keyframe.value, track.unit))
        } else {
          css += `    ${ANIMATION_PROPERTIES[track.property].cssProp}: ${formatValue(keyframe.value, track.unit)};\n`
        }
      }
    })

    if (transformParts.length > 0) {
      css += `    transform: ${transformParts.join(' ')};\n`
    }

    css += `  }\n`
  })

  css += '}'
  return css
}

function formatValue(value, unit) {
  if (COLOR_PROPERTIES.includes(unit === '' ? value : unit)) {
    return value
  }
  if (typeof value === 'number' && unit) {
    return `${value}${unit}`
  }
  return String(value)
}

function formatTransformValue(property, value, unit) {
  switch (property) {
    case 'translateX':
    case 'translateY':
      return `${property}(${value}${unit})`
    case 'scale':
      return `scale(${value})`
    case 'rotate':
      return `rotate(${value}${unit})`
    default:
      return `${property}(${value})`
  }
}

export function generateAnimationCSS(animation, name = animation.name) {
  return `.animated-element {
  animation: ${name} ${animation.duration}s ${animation.tracks[0]?.keyframes[0]?.easing || 'linear'} ${animation.iterations} ${animation.direction} ${animation.fillMode};
}`
}

export function generateFullCSS(animation, name = animation.name) {
  return `${generateKeyframesCSS(animation, name)}\n\n${generateAnimationCSS(animation, name)}`
}

export function saveAnimations(animations, storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!s) return
    s.setItem(STORAGE_KEY, JSON.stringify(animations))
  } catch { /* storage unavailable */ }
}

export function loadAnimations(storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!s) return []
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

export function saveAnimationToList(animations, animation, maxCount = MAX_ANIMATIONS) {
  const existingIndex = animations.findIndex((a) => a.id === animation.id)
  const updatedAnimation = { ...animation, updatedAt: Date.now() }

  let newList
  if (existingIndex >= 0) {
    newList = animations.map((a, i) => (i === existingIndex ? updatedAnimation : a))
  } else {
    newList = [updatedAnimation, ...animations]
    if (newList.length > maxCount) {
      newList = newList.slice(0, maxCount)
    }
  }
  return newList
}

export function deleteAnimationFromList(animations, animationId) {
  return animations.filter((a) => a.id !== animationId)
}

export function renameAnimationInList(animations, animationId, newName) {
  return animations.map((a) =>
    a.id === animationId ? { ...a, name: newName, updatedAt: Date.now() } : a
  )
}

export function exportAnimationJSON(animation) {
  return JSON.stringify(animation, null, 2)
}

export function validateAnimationJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString)

    if (typeof data !== 'object' || data === null) {
      return { valid: false, error: '数据必须是对象' }
    }

    if (!data.id || typeof data.id !== 'string') {
      return { valid: false, error: '缺少有效的 id 字段' }
    }

    if (!data.name || typeof data.name !== 'string') {
      return { valid: false, error: '缺少有效的 name 字段' }
    }

    if (!Array.isArray(data.tracks)) {
      return { valid: false, error: 'tracks 必须是数组' }
    }

    if (data.tracks.length === 0) {
      return { valid: false, error: '至少需要一个属性轨道' }
    }

    for (const track of data.tracks) {
      if (!track.property || !ANIMATION_PROPERTIES[track.property]) {
        return { valid: false, error: `无效的属性: ${track.property}` }
      }
      if (!Array.isArray(track.keyframes) || track.keyframes.length < 2) {
        return { valid: false, error: `属性 ${track.property} 至少需要2个关键帧` }
      }

      const hasStart = track.keyframes.some((k) => k.time === 0)
      const hasEnd = track.keyframes.some((k) => k.time === 100)
      if (!hasStart || !hasEnd) {
        return { valid: false, error: `属性 ${track.property} 必须包含 0% 和 100% 关键帧` }
      }
    }

    return { valid: true, data }
  } catch (e) {
    return { valid: false, error: 'JSON 格式解析失败: ' + e.message }
  }
}

export function downloadJSON(content, filename) {
  if (typeof document === 'undefined') return

  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function cubicBezierToString(p1x, p1y, p2x, p2y) {
  return `cubic-bezier(${p1x}, ${p1y}, ${p2x}, ${p2y})`
}

export function parseCubicBezier(easingString) {
  const match = easingString.match(/cubic-bezier\(([^)]+)\)/)
  if (!match) return null

  const values = match[1].split(',').map((v) => parseFloat(v.trim()))
  if (values.length !== 4 || values.some(isNaN)) return null

  const [p1x, p1y, p2x, p2y] = values
  if (p1x < 0 || p1x > 1 || p2x < 0 || p2x > 1) return null

  return { p1x, p1y, p2x, p2y }
}

export function formatDate(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
