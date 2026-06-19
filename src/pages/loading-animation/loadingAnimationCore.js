import { ANIMATION_TYPES, PARAM_RANGES, generateId } from './constants.js'

export function buildSpinnerKeyframes() {
  return `@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`
}

export function buildPulseKeyframes() {
  return `@keyframes pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
}`
}

export function buildWaveKeyframes(config) {
  const count = config.count || 5
  let keyframes = ''
  for (let i = 0; i < count; i++) {
    keyframes += `@keyframes wave-${i} {
  0%, 40%, 100% { transform: scaleY(0.4); }
  20% { transform: scaleY(1); }
}
`
  }
  return keyframes.trim()
}

export function buildSkeletonKeyframes() {
  return `@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}`
}

export function buildDotsKeyframes() {
  return `@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
}`
}

export function buildProgressKeyframes() {
  return `@keyframes progress {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}`
}

export function buildCircleProgressKeyframes(config) {
  const size = config?.size || 60
  const thickness = config?.thickness || 6
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  return `@keyframes circle-progress {
  0% { stroke-dashoffset: ${circumference.toFixed(1)}; }
  100% { stroke-dashoffset: 0; }
}`
}

const KEYFRAME_BUILDERS = {
  spinner: buildSpinnerKeyframes,
  pulse: buildPulseKeyframes,
  wave: buildWaveKeyframes,
  skeleton: buildSkeletonKeyframes,
  dots: buildDotsKeyframes,
  progress: buildProgressKeyframes,
  circleProgress: buildCircleProgressKeyframes,
}

export function buildKeyframes(animationType, config) {
  const builder = KEYFRAME_BUILDERS[animationType]
  if (!builder) return ''
  return builder(config)
}

export function buildSpinnerCSS(config, className = 'spinner') {
  const { primaryColor, secondaryColor, size, speed, thickness } = config
  return `.${className} {
  width: ${size}px;
  height: ${size}px;
  border: ${thickness}px solid ${secondaryColor};
  border-top: ${thickness}px solid ${primaryColor};
  border-radius: 50%;
  animation: spin ${speed}s linear infinite;
}`
}

export function buildPulseCSS(config, className = 'pulse-dot') {
  const { primaryColor, size, speed } = config
  return `.${className}-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.${className} {
  width: ${size}px;
  height: ${size}px;
  background-color: ${primaryColor};
  border-radius: 50%;
  animation: pulse ${speed}s ease-in-out infinite;
}`
}

export function buildWaveCSS(config, className = 'wave-bar') {
  const { primaryColor, size, speed, thickness, count } = config
  const barCount = count || 5
  let css = `.${className}-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: ${size}px;
}

`
  for (let i = 0; i < barCount; i++) {
    const delay = i * 0.1
    const delayStr = delay % 1 === 0 ? String(delay) : delay.toFixed(1)
    css += `.${className}-${i} {
  width: ${thickness}px;
  height: 100%;
  background-color: ${primaryColor};
  border-radius: ${thickness / 2}px;
  animation: wave-${i} ${speed}s ease-in-out ${delayStr}s infinite;
}
`
  }
  return css.trim()
}

export function buildSkeletonCSS(config, className = 'skeleton-block') {
  const { primaryColor, secondaryColor, size, speed, thickness, count } = config
  const blockCount = count || 3
  let css = `.${className}-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: ${size}px;
}

.${className} {
  height: ${thickness}px;
  background: linear-gradient(90deg, ${primaryColor} 25%, ${secondaryColor} 50%, ${primaryColor} 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer ${speed}s linear infinite;
}
`
  for (let i = 1; i < blockCount; i++) {
    const width = 100 - i * 15
    css += `.${className}:nth-child(${i + 1}) {
  width: ${width}%;
}
`
  }
  return css.trim()
}

export function buildDotsCSS(config, className = 'bounce-dot') {
  const { primaryColor, size, speed, count } = config
  const dotCount = count || 3
  let css = `.${className}-container {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
}

`
  for (let i = 0; i < dotCount; i++) {
    const delay = (i * 0.1).toFixed(1)
    css += `.${className}-${i} {
  width: ${size}px;
  height: ${size}px;
  background-color: ${primaryColor};
  border-radius: 50%;
  animation: bounce ${speed}s ease-in-out ${delay}s infinite;
}
`
  }
  return css.trim()
}

export function buildProgressCSS(config, className = 'progress-bar') {
  const { primaryColor, secondaryColor, size, speed, thickness } = config
  return `.${className}-container {
  width: ${size}px;
  height: ${thickness}px;
  background-color: ${secondaryColor};
  border-radius: ${thickness / 2}px;
  overflow: hidden;
}

.${className} {
  height: 100%;
  background-color: ${primaryColor};
  border-radius: ${thickness / 2}px;
  animation: progress ${speed}s ease-in-out infinite;
}`
}

export function buildCircleProgressCSS(config, className = 'circle-progress') {
  const { primaryColor, secondaryColor, size, speed, thickness } = config
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  return `.${className} {
  width: ${size}px;
  height: ${size}px;
}

.${className} .bg {
  fill: none;
  stroke: ${secondaryColor};
  stroke-width: ${thickness};
}

.${className} .progress {
  fill: none;
  stroke: ${primaryColor};
  stroke-width: ${thickness};
  stroke-linecap: round;
  stroke-dasharray: ${circumference.toFixed(1)};
  transform: rotate(-90deg);
  transform-origin: center;
  animation: circle-progress ${speed}s ease-out forwards;
}`
}

const CSS_BUILDERS = {
  spinner: buildSpinnerCSS,
  pulse: buildPulseCSS,
  wave: buildWaveCSS,
  skeleton: buildSkeletonCSS,
  dots: buildDotsCSS,
  progress: buildProgressCSS,
  circleProgress: buildCircleProgressCSS,
}

export function buildAnimationCSS(animationType, config, className) {
  const builder = CSS_BUILDERS[animationType]
  if (!builder) return ''
  const animType = ANIMATION_TYPES[animationType]
  const finalClassName = className || animType?.className || 'loading-animation'
  return builder(config, finalClassName)
}

export function buildSpinnerHTML(className = 'spinner') {
  return `<!-- 旋转加载 -->
<div class="${className}"></div>`
}

export function buildPulseHTML(className = 'pulse-dot') {
  return `<!-- 脉冲加载 -->
<div class="${className}-container">
  <div class="${className}"></div>
</div>`
}

export function buildWaveHTML(config, className = 'wave-bar') {
  const count = config.count || 5
  let html = `<!-- 波浪加载 -->
<div class="${className}-container">
`
  for (let i = 0; i < count; i++) {
    html += `  <div class="${className}-${i}"></div>
`
  }
  html += `</div>`
  return html
}

export function buildSkeletonHTML(config, className = 'skeleton-block') {
  const count = config.count || 3
  let html = `<!-- 骨架屏 -->
<div class="${className}-container">
`
  for (let i = 0; i < count; i++) {
    html += `  <div class="${className}"></div>
`
  }
  html += `</div>`
  return html
}

export function buildDotsHTML(config, className = 'bounce-dot') {
  const count = config.count || 3
  let html = `<!-- 三点跳动 -->
<div class="${className}-container">
`
  for (let i = 0; i < count; i++) {
    html += `  <div class="${className}-${i}"></div>
`
  }
  html += `</div>`
  return html
}

export function buildProgressHTML(className = 'progress-bar') {
  return `<!-- 进度条 -->
<div class="${className}-container">
  <div class="${className}"></div>
</div>`
}

export function buildCircleProgressHTML(config, className = 'circle-progress') {
  const size = config.size || 60
  const radius = (size - (config.thickness || 6)) / 2
  const center = size / 2
  return `<!-- 圆环进度 -->
<svg class="${className}" viewBox="0 0 ${size} ${size}">
  <circle class="bg" cx="${center}" cy="${center}" r="${radius.toFixed(1)}"></circle>
  <circle class="progress" cx="${center}" cy="${center}" r="${radius.toFixed(1)}"></circle>
</svg>`
}

const HTML_BUILDERS = {
  spinner: buildSpinnerHTML,
  pulse: buildPulseHTML,
  wave: buildWaveHTML,
  skeleton: buildSkeletonHTML,
  dots: buildDotsHTML,
  progress: buildProgressHTML,
  circleProgress: buildCircleProgressHTML,
}

export function buildHTML(animationType, config, className) {
  const builder = HTML_BUILDERS[animationType]
  if (!builder) return ''
  const animType = ANIMATION_TYPES[animationType]
  const finalClassName = className || animType?.className || 'loading-animation'
  if (animationType === 'wave' || animationType === 'skeleton' || animationType === 'dots' || animationType === 'circleProgress') {
    return builder(config, finalClassName)
  }
  return builder(finalClassName)
}

export function generateFullCSS(animationType, config, className) {
  const keyframes = buildKeyframes(animationType, config)
  const animationCSS = buildAnimationCSS(animationType, config, className)
  if (!keyframes && !animationCSS) return ''
  return `${keyframes}\n\n${animationCSS}`
}

export function generateFullHTML(animationType, config, className) {
  return buildHTML(animationType, config, className)
}

export function serializeConfig(animationType, config) {
  return JSON.stringify({
    animationType,
    config,
    version: 1,
    timestamp: Date.now(),
  })
}

export function deserializeConfig(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (!data.animationType || !data.config) {
      return { valid: false, error: 'Invalid config format' }
    }
    if (!ANIMATION_TYPES[data.animationType]) {
      return { valid: false, error: `Unknown animation type: ${data.animationType}` }
    }
    return { valid: true, data }
  } catch (e) {
    return { valid: false, error: `JSON parse error: ${e.message}` }
  }
}

export function validateConfig(animationType, config) {
  const animType = ANIMATION_TYPES[animationType]
  if (!animType) {
    return { valid: false, error: `Unknown animation type: ${animationType}` }
  }

  const errors = []

  if (config.primaryColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(config.primaryColor)) {
    errors.push('Invalid primaryColor format')
  }
  if (config.secondaryColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(config.secondaryColor)) {
    errors.push('Invalid secondaryColor format')
  }

  if (typeof config.size === 'number') {
    if (config.size < PARAM_RANGES.size.min || config.size > PARAM_RANGES.size.max) {
      errors.push(`size must be between ${PARAM_RANGES.size.min} and ${PARAM_RANGES.size.max}`)
    }
  }

  if (typeof config.speed === 'number') {
    if (config.speed < PARAM_RANGES.speed.min || config.speed > PARAM_RANGES.speed.max) {
      errors.push(`speed must be between ${PARAM_RANGES.speed.min} and ${PARAM_RANGES.speed.max}`)
    }
  }

  if (typeof config.thickness === 'number') {
    if (config.thickness < PARAM_RANGES.thickness.min || config.thickness > PARAM_RANGES.thickness.max) {
      errors.push(`thickness must be between ${PARAM_RANGES.thickness.min} and ${PARAM_RANGES.thickness.max}`)
    }
  }

  if (typeof config.count === 'number') {
    if (config.count < PARAM_RANGES.count.min || config.count > PARAM_RANGES.count.max) {
      errors.push(`count must be between ${PARAM_RANGES.count.min} and ${PARAM_RANGES.count.max}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function createAnimationConfig(animationType, overrides = {}) {
  const animType = ANIMATION_TYPES[animationType]
  if (!animType) return null

  return {
    id: generateId(),
    animationType,
    config: {
      ...animType.defaultConfig,
      ...overrides,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createCompositionElement(animationType, config, position = { x: 50, y: 50 }) {
  const animConfig = createAnimationConfig(animationType, config)
  if (!animConfig) return null

  return {
    ...animConfig,
    compositionId: generateId(),
    position: { ...position },
  }
}

export function generateCompositionCSS(elements) {
  if (!Array.isArray(elements) || elements.length === 0) return ''

  const keyframeEntries = []
  const elementKeyframeRefs = []
  let styleCSS = ''

  elements.forEach((element, index) => {
    const { animationType, config, position } = element
    const className = `anim-${index}`

    const keyframes = buildKeyframes(animationType, config)
    const kfNames = parseKeyframeNames(keyframes)
    const refs = []
    kfNames.forEach(name => {
      keyframeEntries.push({ name, animationType, config, elementIndex: index })
      refs.push(name)
    })
    elementKeyframeRefs.push({ index, refs })

    const animCSS = buildAnimationCSS(animationType, config, className)
    styleCSS += `\n/* 元素 ${index + 1} */
.composition-container .${className}-wrapper {
  position: absolute;
  left: ${position.x}%;
  top: ${position.y}%;
  transform: translate(-50%, -50%);
}

${animCSS.replace(new RegExp(`\\.${className}`, 'g'), `.composition-container .${className}`)}
`
  })

  const { keyframesCSS: kfCSS, elementRenameMap } = deduplicateKeyframes(keyframeEntries)

  elementKeyframeRefs.forEach(({ index, refs }) => {
    const renameMap = elementRenameMap[index] || {}
    refs.forEach(originalName => {
      const renamed = renameMap[originalName]
      if (renamed && renamed !== originalName) {
        const sectionMarker = `/* 元素 ${index + 1} */`
        const sectionStart = styleCSS.indexOf(sectionMarker)
        if (sectionStart !== -1) {
          const nextSection = styleCSS.indexOf('/* 元素 ', sectionStart + sectionMarker.length)
          const sectionEnd = nextSection === -1 ? styleCSS.length : nextSection
          const before = styleCSS.slice(0, sectionStart)
          const section = styleCSS.slice(sectionStart, sectionEnd)
          const after = styleCSS.slice(sectionEnd)
          const updated = section.replace(
            new RegExp(`(animation:\\s*)${escapeRegex(originalName)}`, 'g'),
            `$1${renamed}`
          )
          styleCSS = before + updated + after
        }
      }
    })
  })

  return `${kfCSS}${styleCSS}`.trim()
}

function parseKeyframeNames(keyframesStr) {
  const names = []
  const regex = /@keyframes\s+([^{]+)/g
  let match
  while ((match = regex.exec(keyframesStr)) !== null) {
    names.push(match[1].trim())
  }
  return names
}

function configSignature(config) {
  const keys = ['speed', 'size', 'thickness', 'count']
  return keys.map(k => String(config[k] ?? '')).join('|')
}

function deduplicateKeyframes(entries) {
  const seen = new Map()
  let cssOutput = ''
  const elementRenameMap = {}

  entries.forEach(({ name, config, elementIndex }) => {
    const sig = `${name}::${configSignature(config)}`
    if (!seen.has(sig)) {
      const renamedName = seen.size === 0
        ? name
        : `${name}-${seen.size}`
      seen.set(sig, renamedName)

      const builder = KEYFRAME_BUILDERS[findAnimationTypeForKeyframe(name)]
      if (builder) {
        const raw = builder(config)
        let replaced = raw
        if (renamedName !== name) {
          replaced = raw.replace(
            new RegExp(`@keyframes\\s+${escapeRegex(name)}\\s*\\{`),
            `@keyframes ${renamedName} {`
          )
        }
        cssOutput += replaced + '\n\n'
      }
    }

    const renamedName = seen.get(sig)
    if (renamedName !== name) {
      if (!elementRenameMap[elementIndex]) {
        elementRenameMap[elementIndex] = {}
      }
      elementRenameMap[elementIndex][name] = renamedName
    }
  })

  return { keyframesCSS: cssOutput, elementRenameMap }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findAnimationTypeForKeyframe(keyframeName) {
  const map = {
    'spin': 'spinner',
    'pulse': 'pulse',
    'shimmer': 'skeleton',
    'bounce': 'dots',
    'progress': 'progress',
    'circle-progress': 'circleProgress',
  }
  if (keyframeName.startsWith('wave-')) return 'wave'
  return map[keyframeName]
}

export function generateCompositionHTML(elements) {
  if (!Array.isArray(elements) || elements.length === 0) return ''

  let html = '<!-- 组合动画 -->\n<div class="composition-container">\n'

  elements.forEach((element, index) => {
    const { animationType, config } = element
    const className = `anim-${index}`
    const elementHTML = buildHTML(animationType, config, className)
    html += `  <div class="${className}-wrapper">\n`
    const lines = elementHTML.split('\n')
    lines.forEach((line) => {
      if (line.trim()) {
        html += `    ${line}\n`
      }
    })
    html += `  </div>\n`
  })

  html += '</div>'
  return html
}

export function serializeComposition(elements, name = 'My Composition') {
  return JSON.stringify({
    name,
    elements,
    version: 1,
    timestamp: Date.now(),
  })
}

export function deserializeComposition(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (!Array.isArray(data.elements)) {
      return { valid: false, error: 'Invalid composition format: elements must be array' }
    }
    for (const elem of data.elements) {
      if (!elem.animationType || !ANIMATION_TYPES[elem.animationType]) {
        return { valid: false, error: `Invalid animation type in element: ${elem.animationType}` }
      }
    }
    return { valid: true, data }
  } catch (e) {
    return { valid: false, error: `JSON parse error: ${e.message}` }
  }
}

export function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function mergeWithDefaults(animationType, partialConfig) {
  const animType = ANIMATION_TYPES[animationType]
  if (!animType) return null

  const merged = { ...animType.defaultConfig }
  animType.supportedParams.forEach(param => {
    if (partialConfig[param] !== undefined) {
      const range = PARAM_RANGES[param]
      if (range && typeof partialConfig[param] === 'number') {
        merged[param] = clampValue(partialConfig[param], range.min, range.max)
      } else {
        merged[param] = partialConfig[param]
      }
    }
  })

  return merged
}
