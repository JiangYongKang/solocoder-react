import { ANIMATION_TYPES } from '@/pages/loading-animation/constants.js'
import {
    buildAnimationCSS,
    buildCircleProgressCSS,
    buildCircleProgressHTML,
    buildCircleProgressKeyframes,
    buildDotsCSS,
    buildDotsHTML,
    buildDotsKeyframes,
    buildHTML,
    buildKeyframes,
    buildProgressCSS,
    buildProgressKeyframes,
    buildPulseCSS,
    buildPulseKeyframes,
    buildSkeletonCSS,
    buildSkeletonHTML,
    buildSkeletonKeyframes,
    buildSpinnerCSS,
    buildSpinnerHTML,
    buildSpinnerKeyframes,
    buildWaveCSS,
    buildWaveHTML,
    buildWaveKeyframes,
    clampValue,
    createAnimationConfig,
    createCompositionElement,
    deserializeComposition,
    deserializeConfig,
    generateCompositionCSS,
    generateCompositionHTML,
    generateFullCSS,
    generateFullHTML,
    mergeWithDefaults,
    serializeComposition,
    serializeConfig,
    validateConfig
} from '@/pages/loading-animation/loadingAnimationCore.js'
import { describe, expect, it } from 'vitest'

const defaultTestConfig = {
  primaryColor: '#3b82f6',
  secondaryColor: '#e5e7eb',
  size: 48,
  speed: 1,
  thickness: 4,
  count: 5,
}

describe('Keyframe builders', () => {
  describe('buildSpinnerKeyframes', () => {
    it('should generate valid spin keyframes', () => {
      const result = buildSpinnerKeyframes(defaultTestConfig)
      expect(result).toContain('@keyframes spin')
      expect(result).toContain('transform: rotate(0deg)')
      expect(result).toContain('transform: rotate(360deg)')
    })
  })

  describe('buildPulseKeyframes', () => {
    it('should generate valid pulse keyframes', () => {
      const result = buildPulseKeyframes(defaultTestConfig)
      expect(result).toContain('@keyframes pulse')
      expect(result).toContain('scale(0.8)')
      expect(result).toContain('scale(1.2)')
    })
  })

  describe('buildWaveKeyframes', () => {
    it('should generate wave keyframes for default count', () => {
      const result = buildWaveKeyframes(defaultTestConfig)
      expect(result).toContain('@keyframes wave-0')
      expect(result).toContain('@keyframes wave-4')
      expect(result).not.toContain('@keyframes wave-5')
    })

    it('should generate correct number of wave keyframes', () => {
      const config = { ...defaultTestConfig, count: 3 }
      const result = buildWaveKeyframes(config)
      expect(result).toContain('@keyframes wave-0')
      expect(result).toContain('@keyframes wave-1')
      expect(result).toContain('@keyframes wave-2')
      expect(result).not.toContain('@keyframes wave-3')
    })
  })

  describe('buildSkeletonKeyframes', () => {
    it('should generate valid shimmer keyframes', () => {
      const result = buildSkeletonKeyframes(defaultTestConfig)
      expect(result).toContain('@keyframes shimmer')
      expect(result).toContain('background-position: -200% 0')
      expect(result).toContain('background-position: 200% 0')
    })
  })

  describe('buildDotsKeyframes', () => {
    it('should generate valid bounce keyframes', () => {
      const result = buildDotsKeyframes(defaultTestConfig)
      expect(result).toContain('@keyframes bounce')
      expect(result).toContain('translateY(0)')
      expect(result).toContain('translateY(-10px)')
    })
  })

  describe('buildProgressKeyframes', () => {
    it('should generate valid progress keyframes', () => {
      const result = buildProgressKeyframes(defaultTestConfig)
      expect(result).toContain('@keyframes progress')
      expect(result).toContain('width: 0%')
      expect(result).toContain('width: 70%')
      expect(result).toContain('width: 100%')
    })
  })

  describe('buildCircleProgressKeyframes', () => {
    it('should generate valid circle progress keyframes', () => {
      const result = buildCircleProgressKeyframes(defaultTestConfig)
      expect(result).toContain('@keyframes circle-progress')
      expect(result).toContain('stroke-dashoffset: 188.5')
      expect(result).toContain('stroke-dashoffset: 0')
    })
  })

  describe('buildKeyframes', () => {
    it('should return empty string for unknown animation type', () => {
      const result = buildKeyframes('unknown', defaultTestConfig)
      expect(result).toBe('')
    })

    it('should dispatch to correct builder for each type', () => {
      expect(buildKeyframes('spinner', defaultTestConfig)).toContain('@keyframes spin')
      expect(buildKeyframes('pulse', defaultTestConfig)).toContain('@keyframes pulse')
      expect(buildKeyframes('skeleton', defaultTestConfig)).toContain('@keyframes shimmer')
      expect(buildKeyframes('dots', defaultTestConfig)).toContain('@keyframes bounce')
      expect(buildKeyframes('progress', defaultTestConfig)).toContain('@keyframes progress')
      expect(buildKeyframes('circleProgress', defaultTestConfig)).toContain('@keyframes circle-progress')
    })
  })
})

describe('CSS builders', () => {
  describe('buildSpinnerCSS', () => {
    it('should include config values in CSS', () => {
      const config = { primaryColor: '#ff0000', secondaryColor: '#000000', size: 50, speed: 2, thickness: 5 }
      const result = buildSpinnerCSS(config)
      expect(result).toContain('width: 50px')
      expect(result).toContain('height: 50px')
      expect(result).toContain('border: 5px solid #000000')
      expect(result).toContain('border-top: 5px solid #ff0000')
      expect(result).toContain('animation: spin 2s linear infinite')
    })

    it('should use custom class name', () => {
      const result = buildSpinnerCSS(defaultTestConfig, 'my-spinner')
      expect(result).toContain('.my-spinner')
      expect(result).not.toContain('.spinner {')
    })
  })

  describe('buildPulseCSS', () => {
    it('should generate container and dot styles', () => {
      const result = buildPulseCSS(defaultTestConfig)
      expect(result).toContain('.pulse-dot-container')
      expect(result).toContain('.pulse-dot')
      expect(result).toContain('display: flex')
    })
  })

  describe('buildWaveCSS', () => {
    it('should generate correct number of bar styles', () => {
      const config = { ...defaultTestConfig, count: 3 }
      const result = buildWaveCSS(config)
      expect(result).toContain('.wave-bar-0')
      expect(result).toContain('.wave-bar-1')
      expect(result).toContain('.wave-bar-2')
      expect(result).not.toContain('.wave-bar-3')
      expect(result).toContain('0s infinite')
      expect(result).toContain('0.1s infinite')
      expect(result).toContain('0.2s infinite')
    })
  })

  describe('buildSkeletonCSS', () => {
    it('should include gradient background', () => {
      const config = { ...defaultTestConfig, primaryColor: '#e5e7eb', secondaryColor: '#f3f4f6' }
      const result = buildSkeletonCSS(config)
      expect(result).toContain('linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)')
    })

    it('should have varying widths for blocks', () => {
      const result = buildSkeletonCSS(defaultTestConfig)
      expect(result).toContain('width: 85%')
      expect(result).toContain('width: 70%')
    })
  })

  describe('buildDotsCSS', () => {
    it('should generate correct number of dot styles', () => {
      const config = { ...defaultTestConfig, count: 3 }
      const result = buildDotsCSS(config)
      expect(result).toContain('.bounce-dot-0')
      expect(result).toContain('.bounce-dot-1')
      expect(result).toContain('.bounce-dot-2')
    })
  })

  describe('buildProgressCSS', () => {
    it('should include container and bar styles', () => {
      const result = buildProgressCSS(defaultTestConfig)
      expect(result).toContain('.progress-bar-container')
      expect(result).toContain('.progress-bar')
      expect(result).toContain('overflow: hidden')
    })
  })

  describe('buildCircleProgressCSS', () => {
    it('should calculate circumference correctly', () => {
      const config = { size: 60, thickness: 6 }
      const result = buildCircleProgressCSS(config)
      const radius = (60 - 6) / 2
      const circumference = 2 * Math.PI * radius
      expect(result).toContain(`stroke-dasharray: ${circumference.toFixed(1)}`)
    })
  })

  describe('buildAnimationCSS', () => {
    it('should return empty string for unknown type', () => {
      const result = buildAnimationCSS('unknown', defaultTestConfig)
      expect(result).toBe('')
    })
  })
})

describe('HTML builders', () => {
  describe('buildSpinnerHTML', () => {
    it('should generate simple div with class', () => {
      const result = buildSpinnerHTML()
      expect(result).toContain('<!-- 旋转加载 -->')
      expect(result).toContain('<div class="spinner"></div>')
    })

    it('should use custom class name', () => {
      const result = buildSpinnerHTML('custom-spinner')
      expect(result).toContain('class="custom-spinner"')
    })
  })

  describe('buildWaveHTML', () => {
    it('should generate correct number of bar elements', () => {
      const result = buildWaveHTML({ count: 3 })
      expect(result).toContain('class="wave-bar-0"')
      expect(result).toContain('class="wave-bar-1"')
      expect(result).toContain('class="wave-bar-2"')
      expect(result).not.toContain('class="wave-bar-3"')
    })
  })

  describe('buildSkeletonHTML', () => {
    it('should generate correct number of block elements', () => {
      const result = buildSkeletonHTML({ count: 3 })
      const matches = result.match(/class="skeleton-block"/g)
      expect(matches).toHaveLength(3)
    })
  })

  describe('buildDotsHTML', () => {
    it('should generate correct number of dot elements', () => {
      const result = buildDotsHTML({ count: 5 })
      const matches = result.match(/class="bounce-dot-\d"/g)
      expect(matches).toHaveLength(5)
    })
  })

  describe('buildCircleProgressHTML', () => {
    it('should generate SVG with two circles', () => {
      const result = buildCircleProgressHTML({ size: 60, thickness: 6 })
      expect(result).toContain('<svg')
      expect(result).toContain('class="bg"')
      expect(result).toContain('class="progress"')
      expect(result).toContain('cx="30"')
      expect(result).toContain('cy="30"')
    })
  })

  describe('buildHTML', () => {
    it('should return empty string for unknown type', () => {
      const result = buildHTML('unknown', defaultTestConfig)
      expect(result).toBe('')
    })
  })
})

describe('Code generation', () => {
  describe('generateFullCSS', () => {
    it('should combine keyframes and animation CSS', () => {
      const result = generateFullCSS('spinner', defaultTestConfig)
      expect(result).toContain('@keyframes spin')
      expect(result).toContain('.spinner')
    })

    it('should return empty string for unknown type', () => {
      const result = generateFullCSS('unknown', defaultTestConfig)
      expect(result).toBe('')
    })
  })

  describe('generateFullHTML', () => {
    it('should return HTML structure', () => {
      const result = generateFullHTML('spinner', defaultTestConfig)
      expect(result).toContain('<!-- 旋转加载 -->')
    })
  })
})

describe('Serialization', () => {
  describe('serializeConfig', () => {
    it('should produce valid JSON', () => {
      const result = serializeConfig('spinner', defaultTestConfig)
      const parsed = JSON.parse(result)
      expect(parsed.animationType).toBe('spinner')
      expect(parsed.config).toEqual(defaultTestConfig)
      expect(parsed.version).toBe(1)
      expect(typeof parsed.timestamp).toBe('number')
    })
  })

  describe('deserializeConfig', () => {
    it('should validate and parse valid config', () => {
      const serialized = serializeConfig('spinner', defaultTestConfig)
      const result = deserializeConfig(serialized)
      expect(result.valid).toBe(true)
      expect(result.data.animationType).toBe('spinner')
    })

    it('should return invalid for bad JSON', () => {
      const result = deserializeConfig('not valid json')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should return invalid for missing fields', () => {
      const result = deserializeConfig(JSON.stringify({}))
      expect(result.valid).toBe(false)
    })

    it('should return invalid for unknown animation type', () => {
      const result = deserializeConfig(JSON.stringify({ animationType: 'unknown', config: {} }))
      expect(result.valid).toBe(false)
    })
  })
})

describe('Validation', () => {
  describe('validateConfig', () => {
    it('should return valid for correct config', () => {
      const result = validateConfig('spinner', defaultTestConfig)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for unknown animation type', () => {
      const result = validateConfig('unknown', defaultTestConfig)
      expect(result.valid).toBe(false)
    })

    it('should detect invalid color format', () => {
      const config = { ...defaultTestConfig, primaryColor: 'not-a-color' }
      const result = validateConfig('spinner', config)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid primaryColor format')
    })

    it('should detect out of range size', () => {
      const config = { ...defaultTestConfig, size: 300 }
      const result = validateConfig('spinner', config)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('size must be between')
    })

    it('should detect out of range speed', () => {
      const config = { ...defaultTestConfig, speed: 0.1 }
      const result = validateConfig('spinner', config)
      expect(result.valid).toBe(false)
    })

    it('should detect out of range thickness', () => {
      const config = { ...defaultTestConfig, thickness: 0 }
      const result = validateConfig('spinner', config)
      expect(result.valid).toBe(false)
    })

    it('should detect out of range count', () => {
      const config = { ...defaultTestConfig, count: 2 }
      const result = validateConfig('wave', config)
      expect(result.valid).toBe(false)
    })
  })
})

describe('Configuration creation', () => {
  describe('createAnimationConfig', () => {
    it('should create config with all required fields', () => {
      const result = createAnimationConfig('spinner', { size: 60 })
      expect(result.id).toBeDefined()
      expect(result.animationType).toBe('spinner')
      expect(result.config.size).toBe(60)
      expect(result.config.primaryColor).toBe(ANIMATION_TYPES.spinner.defaultConfig.primaryColor)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should return null for unknown type', () => {
      const result = createAnimationConfig('unknown')
      expect(result).toBeNull()
    })
  })

  describe('createCompositionElement', () => {
    it('should create element with position', () => {
      const result = createCompositionElement('spinner', defaultTestConfig, { x: 25, y: 75 })
      expect(result.compositionId).toBeDefined()
      expect(result.position).toEqual({ x: 25, y: 75 })
      expect(result.animationType).toBe('spinner')
    })

    it('should use default position', () => {
      const result = createCompositionElement('spinner', defaultTestConfig)
      expect(result.position).toEqual({ x: 50, y: 50 })
    })

    it('should return null for unknown type', () => {
      const result = createCompositionElement('unknown', defaultTestConfig)
      expect(result).toBeNull()
    })
  })
})

describe('Composition', () => {
  describe('generateCompositionCSS', () => {
    it('should return empty string for empty elements', () => {
      const result = generateCompositionCSS([])
      expect(result).toBe('')
    })

    it('should generate CSS for multiple elements', () => {
      const elements = [
        createCompositionElement('spinner', defaultTestConfig, { x: 25, y: 50 }),
        createCompositionElement('dots', { ...defaultTestConfig, count: 3 }, { x: 75, y: 50 }),
      ]
      const result = generateCompositionCSS(elements)
      expect(result).toContain('.composition-container')
      expect(result).toContain('left: 25%')
      expect(result).toContain('left: 75%')
      expect(result).toContain('@keyframes spin')
    })
  })

  describe('generateCompositionHTML', () => {
    it('should return empty string for empty elements', () => {
      const result = generateCompositionHTML([])
      expect(result).toBe('')
    })

    it('should generate HTML wrapper for all elements', () => {
      const elements = [
        createCompositionElement('spinner', defaultTestConfig, { x: 50, y: 50 }),
      ]
      const result = generateCompositionHTML(elements)
      expect(result).toContain('<!-- 组合动画 -->')
      expect(result).toContain('<div class="composition-container">')
      expect(result).toContain('anim-0-wrapper')
    })
  })

  describe('serializeComposition', () => {
    it('should serialize composition data', () => {
      const elements = [createCompositionElement('spinner', defaultTestConfig)]
      const result = serializeComposition(elements, 'Test Composition')
      const parsed = JSON.parse(result)
      expect(parsed.name).toBe('Test Composition')
      expect(parsed.elements).toHaveLength(1)
      expect(parsed.version).toBe(1)
    })

    it('should use default name', () => {
      const elements = [createCompositionElement('spinner', defaultTestConfig)]
      const result = serializeComposition(elements)
      const parsed = JSON.parse(result)
      expect(parsed.name).toBe('My Composition')
    })
  })

  describe('deserializeComposition', () => {
    it('should validate and parse valid composition', () => {
      const elements = [createCompositionElement('spinner', defaultTestConfig)]
      const serialized = serializeComposition(elements)
      const result = deserializeComposition(serialized)
      expect(result.valid).toBe(true)
      expect(result.data.elements).toHaveLength(1)
    })

    it('should return invalid for bad JSON', () => {
      const result = deserializeComposition('not json')
      expect(result.valid).toBe(false)
    })

    it('should return invalid for missing elements array', () => {
      const result = deserializeComposition(JSON.stringify({ name: 'test' }))
      expect(result.valid).toBe(false)
    })

    it('should return invalid for bad animation type in elements', () => {
      const badData = {
        elements: [{ animationType: 'unknown' }],
      }
      const result = deserializeComposition(JSON.stringify(badData))
      expect(result.valid).toBe(false)
    })
  })
})

describe('Utilities', () => {
  describe('clampValue', () => {
    it('should clamp value within range', () => {
      expect(clampValue(5, 0, 10)).toBe(5)
      expect(clampValue(-5, 0, 10)).toBe(0)
      expect(clampValue(15, 0, 10)).toBe(10)
      expect(clampValue(0, 0, 10)).toBe(0)
      expect(clampValue(10, 0, 10)).toBe(10)
    })
  })

  describe('mergeWithDefaults', () => {
    it('should merge partial config with defaults', () => {
      const result = mergeWithDefaults('spinner', { size: 100 })
      expect(result.size).toBe(100)
      expect(result.primaryColor).toBe(ANIMATION_TYPES.spinner.defaultConfig.primaryColor)
      expect(result.speed).toBe(ANIMATION_TYPES.spinner.defaultConfig.speed)
    })

    it('should clamp numeric values to valid range', () => {
      const result = mergeWithDefaults('spinner', { size: 500 })
      expect(result.size).toBe(200)
    })

    it('should return null for unknown type', () => {
      const result = mergeWithDefaults('unknown', {})
      expect(result).toBeNull()
    })

    it('should only include supported params', () => {
      const result = mergeWithDefaults('pulse', { thickness: 10 })
      expect(result.thickness).toBe(ANIMATION_TYPES.pulse.defaultConfig.thickness)
    })
  })
})
