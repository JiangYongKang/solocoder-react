import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
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
} from '../../danmaku-player/constants.js'
import {
  generateDanmakuId,
  resetDanmakuIdCounter,
  formatTime,
  validateDanmakuText,
  getRandomUsername,
  isValidColor,
  isValidFontSize,
  isValidPosition,
  isValidDensity,
  createDanmaku,
  getFontSizePx,
  getDensityConfig,
  measureTextWidth,
  calculateScrollSpeed,
  initializeScrollTracks,
  findAvailableScrollTrack,
  getTrackYPosition,
  getFixedYPosition,
  checkFixedPositionConflict,
  updateScrollDanmaku,
  updateFixedDanmaku,
  updateAllDanmakus,
  removeExpiredDanmakus,
  clampOpacity,
  clampVolume,
  clampPlaybackSpeed,
  loadSettings,
  saveSettings,
  calculateProgressPercent,
  calculateTimeFromPercent,
  sortDanmakuListByTime,
  getDanmakuPositionIcon,
  evictOldestIfOverCapacity,
  cleanupOutOfRangeScrollDanmakus,
} from '../../danmaku-player/danmakuCore.js'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

describe('generateDanmakuId', () => {
  beforeEach(() => {
    resetDanmakuIdCounter()
  })

  it('生成的ID以 danmaku_ 开头', () => {
    expect(generateDanmakuId()).toMatch(/^danmaku_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateDanmakuId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('resetDanmakuIdCounter', () => {
  it('重置计数器后ID重新递增', () => {
    resetDanmakuIdCounter()
    const id1 = generateDanmakuId()
    resetDanmakuIdCounter()
    const id2 = generateDanmakuId()
    expect(id1).not.toBe(id2)
    const idPart1 = id1.split('_').pop()
    const idPart2 = id2.split('_').pop()
    expect(idPart1).toBe(idPart2)
  })

  it('重置后生成的ID依然保持唯一', () => {
    resetDanmakuIdCounter()
    const a = generateDanmakuId()
    resetDanmakuIdCounter()
    const b = generateDanmakuId()
    const c = generateDanmakuId()
    expect(a).not.toBe(b)
    expect(b).not.toBe(c)
    expect(new Set([a, b, c]).size).toBe(3)
  })
})

describe('formatTime', () => {
  it('格式化0秒为 00:00', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('格式化小于60秒的时间', () => {
    expect(formatTime(30)).toBe('00:30')
    expect(formatTime(59)).toBe('00:59')
  })

  it('格式化分钟和秒', () => {
    expect(formatTime(60)).toBe('01:00')
    expect(formatTime(90)).toBe('01:30')
    expect(formatTime(599)).toBe('09:59')
  })

  it('处理负数返回 00:00', () => {
    expect(formatTime(-1)).toBe('00:00')
    expect(formatTime(-100)).toBe('00:00')
  })

  it('处理 NaN 和 Infinity 返回 00:00', () => {
    expect(formatTime(NaN)).toBe('00:00')
    expect(formatTime(Infinity)).toBe('00:00')
  })

  it('处理无效值返回 00:00', () => {
    expect(formatTime(null)).toBe('00:00')
    expect(formatTime(undefined)).toBe('00:00')
  })

  it('处理浮点数时向下取整', () => {
    expect(formatTime(59.9)).toBe('00:59')
    expect(formatTime(60.1)).toBe('01:00')
  })

  it('格式化大数值', () => {
    expect(formatTime(300)).toBe('05:00')
    expect(formatTime(3600)).toBe('60:00')
  })
})

describe('validateDanmakuText', () => {
  it('有效的弹幕文本通过验证', () => {
    const result = validateDanmakuText('你好世界')
    expect(result.valid).toBe(true)
    expect(result.trimmed).toBe('你好世界')
    expect(result.truncated).toBe(false)
    expect(result.error).toBeNull()
  })

  it('空文本验证失败', () => {
    const result = validateDanmakuText('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('空白文本验证失败', () => {
    const result = validateDanmakuText('   ')
    expect(result.valid).toBe(false)
  })

  it('null 验证失败', () => {
    const result = validateDanmakuText(null)
    expect(result.valid).toBe(false)
  })

  it('undefined 验证失败', () => {
    const result = validateDanmakuText(undefined)
    expect(result.valid).toBe(false)
  })

  it('非字符串验证失败', () => {
    const result = validateDanmakuText(123)
    expect(result.valid).toBe(false)
  })

  it('超过最大长度的文本被截断', () => {
    const longText = 'a'.repeat(MAX_DANMAKU_LENGTH + 10)
    const result = validateDanmakuText(longText)
    expect(result.valid).toBe(true)
    expect(result.truncated).toBe(true)
    expect(result.trimmed.length).toBe(MAX_DANMAKU_LENGTH)
    expect(result.error).toContain(String(MAX_DANMAKU_LENGTH))
  })

  it('正好最大长度的文本不截断', () => {
    const exactText = 'a'.repeat(MAX_DANMAKU_LENGTH)
    const result = validateDanmakuText(exactText)
    expect(result.valid).toBe(true)
    expect(result.truncated).toBe(false)
  })

  it('去除首尾空格', () => {
    const result = validateDanmakuText('  你好  ')
    expect(result.valid).toBe(true)
    expect(result.trimmed).toBe('你好')
  })
})

describe('getRandomUsername', () => {
  it('返回随机用户名', () => {
    const name = getRandomUsername()
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(0)
  })

  it('从默认列表中选择用户名', () => {
    const name = getRandomUsername()
    expect(RANDOM_USERNAMES.includes(name)).toBe(true)
  })

  it('从自定义列表中选择用户名', () => {
    const custom = ['用户A', '用户B']
    const name = getRandomUsername(custom)
    expect(custom.includes(name)).toBe(true)
  })

  it('空数组返回默认用户名', () => {
    expect(getRandomUsername([])).toBe('匿名用户')
  })

  it('非数组返回默认用户名', () => {
    expect(getRandomUsername(null)).toBe('匿名用户')
    expect(getRandomUsername(undefined)).toBe('匿名用户')
  })
})

describe('isValidColor', () => {
  it('有效颜色返回 true', () => {
    for (const color of DANMAKU_COLORS) {
      expect(isValidColor(color)).toBe(true)
    }
  })

  it('无效颜色返回 false', () => {
    expect(isValidColor('#invalid')).toBe(false)
    expect(isValidColor('red')).toBe(false)
  })

  it('空值返回 false', () => {
    expect(isValidColor(null)).toBe(false)
    expect(isValidColor(undefined)).toBe(false)
    expect(isValidColor('')).toBe(false)
  })
})

describe('isValidFontSize', () => {
  it('有效字号返回 true', () => {
    for (const size of Object.values(FONT_SIZES)) {
      expect(isValidFontSize(size)).toBe(true)
    }
  })

  it('无效字号返回 false', () => {
    expect(isValidFontSize('huge')).toBe(false)
    expect(isValidFontSize('22')).toBe(false)
  })

  it('空值返回 false', () => {
    expect(isValidFontSize(null)).toBe(false)
    expect(isValidFontSize(undefined)).toBe(false)
  })
})

describe('isValidPosition', () => {
  it('有效位置返回 true', () => {
    for (const pos of Object.values(DANMAKU_POSITIONS)) {
      expect(isValidPosition(pos)).toBe(true)
    }
  })

  it('无效位置返回 false', () => {
    expect(isValidPosition('center')).toBe(false)
  })

  it('空值返回 false', () => {
    expect(isValidPosition(null)).toBe(false)
    expect(isValidPosition(undefined)).toBe(false)
  })
})

describe('isValidDensity', () => {
  it('有效密度返回 true', () => {
    for (const d of Object.values(DENSITY_LEVELS)) {
      expect(isValidDensity(d)).toBe(true)
    }
  })

  it('无效密度返回 false', () => {
    expect(isValidDensity('ultra')).toBe(false)
  })

  it('空值返回 false', () => {
    expect(isValidDensity(null)).toBe(false)
    expect(isValidDensity(undefined)).toBe(false)
  })
})

describe('createDanmaku', () => {
  it('创建有效的弹幕对象', () => {
    const d = createDanmaku({ text: '测试弹幕', videoTime: 30 })
    expect(d).not.toBeNull()
    expect(d.id).toMatch(/^danmaku_/)
    expect(d.text).toBe('测试弹幕')
    expect(d.position).toBe(DANMAKU_POSITIONS.SCROLL)
    expect(d.color).toBe(DANMAKU_COLORS[0])
    expect(d.fontSize).toBe(FONT_SIZES.MEDIUM)
    expect(d.videoTime).toBe(30)
    expect(d.username).toBeTruthy()
    expect(d.createdAt).toBeGreaterThan(0)
  })

  it('空文本返回 null', () => {
    expect(createDanmaku({ text: '' })).toBeNull()
    expect(createDanmaku({ text: null })).toBeNull()
  })

  it('使用自定义参数', () => {
    const d = createDanmaku({
      text: '自定义弹幕',
      position: DANMAKU_POSITIONS.TOP,
      color: DANMAKU_COLORS[1],
      fontSize: FONT_SIZES.LARGE,
      videoTime: 100,
      username: '测试用户',
    })
    expect(d.position).toBe(DANMAKU_POSITIONS.TOP)
    expect(d.color).toBe(DANMAKU_COLORS[1])
    expect(d.fontSize).toBe(FONT_SIZES.LARGE)
    expect(d.videoTime).toBe(100)
    expect(d.username).toBe('测试用户')
  })

  it('无效位置回退为默认滚动', () => {
    const d = createDanmaku({ text: '测试', position: 'invalid' })
    expect(d.position).toBe(DANMAKU_POSITIONS.SCROLL)
  })

  it('无效颜色回退为默认白色', () => {
    const d = createDanmaku({ text: '测试', color: '#invalid' })
    expect(d.color).toBe(DANMAKU_COLORS[0])
  })

  it('无效字号回退为默认中号', () => {
    const d = createDanmaku({ text: '测试', fontSize: 'huge' })
    expect(d.fontSize).toBe(FONT_SIZES.MEDIUM)
  })

  it('videoTime 被限制在 0 到 VIDEO_DURATION 之间', () => {
    const d1 = createDanmaku({ text: '测试', videoTime: -10 })
    expect(d1.videoTime).toBe(0)
    const d2 = createDanmaku({ text: '测试', videoTime: VIDEO_DURATION + 100 })
    expect(d2.videoTime).toBe(VIDEO_DURATION)
  })

  it('超长文本被截断', () => {
    const longText = 'a'.repeat(MAX_DANMAKU_LENGTH + 10)
    const d = createDanmaku({ text: longText })
    expect(d.text.length).toBe(MAX_DANMAKU_LENGTH)
  })
})

describe('getFontSizePx', () => {
  it('返回各字号对应的像素值', () => {
    expect(getFontSizePx(FONT_SIZES.SMALL)).toBe(FONT_SIZE_PX[FONT_SIZES.SMALL])
    expect(getFontSizePx(FONT_SIZES.MEDIUM)).toBe(FONT_SIZE_PX[FONT_SIZES.MEDIUM])
    expect(getFontSizePx(FONT_SIZES.LARGE)).toBe(FONT_SIZE_PX[FONT_SIZES.LARGE])
  })

  it('无效字号返回中号默认值', () => {
    expect(getFontSizePx('invalid')).toBe(FONT_SIZE_PX[FONT_SIZES.MEDIUM])
    expect(getFontSizePx(null)).toBe(FONT_SIZE_PX[FONT_SIZES.MEDIUM])
  })
})

describe('getDensityConfig', () => {
  it('返回各密度对应的配置', () => {
    for (const level of Object.values(DENSITY_LEVELS)) {
      const config = getDensityConfig(level)
      expect(config).toHaveProperty('trackCount')
      expect(config).toHaveProperty('verticalSpacing')
      expect(config).toHaveProperty('label')
    }
  })

  it('低密度配置正确', () => {
    const config = getDensityConfig(DENSITY_LEVELS.LOW)
    expect(config.trackCount).toBe(3)
    expect(config.verticalSpacing).toBe(40)
  })

  it('中密度配置正确', () => {
    const config = getDensityConfig(DENSITY_LEVELS.MEDIUM)
    expect(config.trackCount).toBe(5)
    expect(config.verticalSpacing).toBe(30)
  })

  it('高密度配置正确', () => {
    const config = getDensityConfig(DENSITY_LEVELS.HIGH)
    expect(config.trackCount).toBe(8)
    expect(config.verticalSpacing).toBe(20)
  })

  it('无效密度返回中密度', () => {
    const config = getDensityConfig('invalid')
    expect(config.trackCount).toBe(DENSITY_CONFIG[DENSITY_LEVELS.MEDIUM].trackCount)
  })
})

describe('measureTextWidth', () => {
  it('无 ctx 时使用估算宽度', () => {
    const width = measureTextWidth(null, '测试', FONT_SIZES.MEDIUM)
    expect(typeof width).toBe('number')
    expect(width).toBeGreaterThan(0)
  })

  it('有 ctx 时使用 measureText', () => {
    const mockCtx = {
      measureText: vi.fn().mockReturnValue({ width: 100 }),
    }
    const width = measureTextWidth(mockCtx, '测试', FONT_SIZES.MEDIUM)
    expect(width).toBe(100)
    expect(mockCtx.measureText).toHaveBeenCalled()
  })
})

describe('calculateScrollSpeed', () => {
  it('计算滚动速度', () => {
    const speed = calculateScrollSpeed(800)
    expect(speed).toBeCloseTo(800 / (SCROLL_DURATION / 1000), 2)
  })

  it('自定义持续时间', () => {
    const speed = calculateScrollSpeed(800, 4000)
    expect(speed).toBeCloseTo(800 / 4, 2)
  })

  it('宽度为0时速度为0', () => {
    const speed = calculateScrollSpeed(0)
    expect(speed).toBe(0)
  })
})

describe('initializeScrollTracks', () => {
  it('初始化指定数量的轨道', () => {
    const tracks = initializeScrollTracks(5)
    expect(tracks.length).toBe(5)
    for (const track of tracks) {
      expect(Array.isArray(track)).toBe(true)
      expect(track.length).toBe(0)
    }
  })

  it('0个轨道返回空数组', () => {
    const tracks = initializeScrollTracks(0)
    expect(tracks.length).toBe(0)
  })
})

describe('findAvailableScrollTrack', () => {
  it('空轨道返回轨道0', () => {
    const tracks = [[], [], []]
    const result = findAvailableScrollTrack(tracks, Date.now(), 800, 100, 100)
    expect(result).toBe(0)
  })

  it('空数组返回 -1', () => {
    const result = findAvailableScrollTrack([], Date.now(), 800, 100, 100)
    expect(result).toBe(-1)
  })

  it('非数组返回 -1', () => {
    expect(findAvailableScrollTrack(null, Date.now(), 800, 100, 100)).toBe(-1)
    expect(findAvailableScrollTrack(undefined, Date.now(), 800, 100, 100)).toBe(-1)
  })

  it('选择弹幕最少的轨道', () => {
    const now = Date.now()
    const tracks = [
      [{ id: 'a', startTime: now - 1000, textWidth: 50, removed: false }],
      [],
      [{ id: 'b', startTime: now - 1000, textWidth: 50, removed: false }],
    ]
    const result = findAvailableScrollTrack(tracks, now, 800, 100, 100)
    expect(result).toBe(1)
  })

  it('跳过已移除弹幕的轨道', () => {
    const now = Date.now()
    const tracks = [
      [{ id: 'a', startTime: now - 1000, textWidth: 50, removed: true }],
    ]
    const result = findAvailableScrollTrack(tracks, now, 800, 100, 100)
    expect(result).toBe(0)
  })
})

describe('getTrackYPosition', () => {
  it('返回轨道的Y坐标', () => {
    const y = getTrackYPosition(0, DENSITY_LEVELS.MEDIUM, 450, FONT_SIZES.MEDIUM)
    expect(typeof y).toBe('number')
    expect(y).toBeGreaterThan(0)
  })

  it('高轨道索引返回更大的Y值', () => {
    const y0 = getTrackYPosition(0, DENSITY_LEVELS.MEDIUM, 450, FONT_SIZES.MEDIUM)
    const y4 = getTrackYPosition(4, DENSITY_LEVELS.MEDIUM, 450, FONT_SIZES.MEDIUM)
    expect(y4).toBeGreaterThan(y0)
  })

  it('不同密度配置产生不同的Y位置', () => {
    const yLow = getTrackYPosition(0, DENSITY_LEVELS.LOW, 450, FONT_SIZES.MEDIUM)
    const yHigh = getTrackYPosition(0, DENSITY_LEVELS.HIGH, 450, FONT_SIZES.MEDIUM)
    expect(yLow).not.toBe(yHigh)
  })
})

describe('getFixedYPosition', () => {
  it('顶部弹幕在上1/4区域', () => {
    const y = getFixedYPosition(DANMAKU_POSITIONS.TOP, 450, FONT_SIZES.MEDIUM)
    expect(y).toBeLessThan(450 * 0.3)
  })

  it('中间弹幕在视频中间区域', () => {
    const y = getFixedYPosition(DANMAKU_POSITIONS.MIDDLE, 450, FONT_SIZES.MEDIUM)
    expect(y).toBeCloseTo(450 / 2 + FONT_SIZE_PX[FONT_SIZES.MEDIUM] / 2, 0)
  })

  it('底部弹幕在下3/4区域', () => {
    const y = getFixedYPosition(DANMAKU_POSITIONS.BOTTOM, 450, FONT_SIZES.MEDIUM)
    expect(y).toBeGreaterThan(450 * 0.5)
  })

  it('默认返回中间位置', () => {
    const y = getFixedYPosition('invalid', 450, FONT_SIZES.MEDIUM)
    expect(y).toBe(450 / 2)
  })
})

describe('checkFixedPositionConflict', () => {
  it('无弹幕时无冲突', () => {
    expect(checkFixedPositionConflict([], DANMAKU_POSITIONS.TOP, 450, FONT_SIZES.MEDIUM)).toBe(false)
  })

  it('空数组无冲突', () => {
    expect(checkFixedPositionConflict([], DANMAKU_POSITIONS.TOP, 450, FONT_SIZES.MEDIUM)).toBe(false)
  })

  it('不同位置不冲突', () => {
    const active = [
      { position: DANMAKU_POSITIONS.TOP, fontSize: FONT_SIZES.MEDIUM, removed: false },
    ]
    expect(checkFixedPositionConflict(active, DANMAKU_POSITIONS.BOTTOM, 450, FONT_SIZES.MEDIUM)).toBe(false)
  })

  it('相同位置有冲突', () => {
    const active = [
      { position: DANMAKU_POSITIONS.TOP, fontSize: FONT_SIZES.MEDIUM, removed: false },
    ]
    expect(checkFixedPositionConflict(active, DANMAKU_POSITIONS.TOP, 450, FONT_SIZES.MEDIUM)).toBe(true)
  })

  it('已移除的弹幕不造成冲突', () => {
    const active = [
      { position: DANMAKU_POSITIONS.TOP, fontSize: FONT_SIZES.MEDIUM, removed: true },
    ]
    expect(checkFixedPositionConflict(active, DANMAKU_POSITIONS.TOP, 450, FONT_SIZES.MEDIUM)).toBe(false)
  })

  it('非数组输入返回 false', () => {
    expect(checkFixedPositionConflict(null, DANMAKU_POSITIONS.TOP, 450, FONT_SIZES.MEDIUM)).toBe(false)
    expect(checkFixedPositionConflict(undefined, DANMAKU_POSITIONS.TOP, 450, FONT_SIZES.MEDIUM)).toBe(false)
  })
})

describe('updateScrollDanmaku', () => {
  it('滚动弹幕更新位置', () => {
    const now = Date.now()
    const danmaku = {
      id: 'test',
      position: DANMAKU_POSITIONS.SCROLL,
      startTime: now,
      textWidth: 100,
      opacity: 1,
    }
    const speed = 100
    const updated = updateScrollDanmaku(danmaku, now + 1000, 800, speed)
    expect(updated.x).toBe(800 - 1 * speed)
  })

  it('滚动弹幕移出左侧后标记为移除', () => {
    const now = Date.now()
    const danmaku = {
      id: 'test',
      position: DANMAKU_POSITIONS.SCROLL,
      startTime: now,
      textWidth: 100,
      opacity: 1,
    }
    const updated = updateScrollDanmaku(danmaku, now + 30000, 800, 100)
    expect(updated.removed).toBe(true)
  })

  it('非滚动弹幕不变', () => {
    const danmaku = {
      id: 'test',
      position: DANMAKU_POSITIONS.TOP,
    }
    const updated = updateScrollDanmaku(danmaku, Date.now(), 800, 100)
    expect(updated).toBe(danmaku)
  })

  it('空弹幕返回原值', () => {
    expect(updateScrollDanmaku(null, Date.now(), 800, 100)).toBeNull()
  })
})

describe('updateFixedDanmaku', () => {
  it('固定弹幕在显示时间内不透明', () => {
    const now = Date.now()
    const danmaku = {
      id: 'test',
      position: DANMAKU_POSITIONS.TOP,
      startTime: now,
      opacity: 1,
    }
    const updated = updateFixedDanmaku(danmaku, now + 1000)
    expect(updated.opacity).toBe(1)
  })

  it('固定弹幕在淡出阶段降低透明度', () => {
    const now = Date.now()
    const danmaku = {
      id: 'test',
      position: DANMAKU_POSITIONS.TOP,
      startTime: now,
      opacity: 1,
    }
    const elapsed = FIXED_DURATION + FADE_DURATION / 2
    const updated = updateFixedDanmaku(danmaku, now + elapsed)
    expect(updated.opacity).toBeLessThan(1)
    expect(updated.opacity).toBeGreaterThan(0)
  })

  it('固定弹幕在完全消失后标记为移除', () => {
    const now = Date.now()
    const danmaku = {
      id: 'test',
      position: DANMAKU_POSITIONS.TOP,
      startTime: now,
      opacity: 1,
    }
    const elapsed = FIXED_DURATION + FADE_DURATION + 100
    const updated = updateFixedDanmaku(danmaku, now + elapsed)
    expect(updated.removed).toBe(true)
    expect(updated.opacity).toBe(0)
  })

  it('滚动弹幕不变', () => {
    const danmaku = {
      id: 'test',
      position: DANMAKU_POSITIONS.SCROLL,
    }
    const updated = updateFixedDanmaku(danmaku, Date.now())
    expect(updated).toBe(danmaku)
  })

  it('空弹幕返回原值', () => {
    expect(updateFixedDanmaku(null, Date.now())).toBeNull()
  })
})

describe('updateAllDanmakus', () => {
  it('批量更新所有弹幕', () => {
    const now = Date.now()
    const danmakus = [
      {
        id: '1',
        position: DANMAKU_POSITIONS.SCROLL,
        startTime: now,
        textWidth: 100,
        opacity: 1,
        removed: false,
      },
      {
        id: '2',
        position: DANMAKU_POSITIONS.TOP,
        startTime: now,
        opacity: 1,
        removed: false,
      },
    ]
    const updated = updateAllDanmakus(danmakus, now + 500, 800, 100, 450)
    expect(updated.length).toBe(2)
  })

  it('空数组返回空数组', () => {
    expect(updateAllDanmakus([], Date.now(), 800, 100, 450)).toEqual([])
  })

  it('非数组返回空数组', () => {
    expect(updateAllDanmakus(null, Date.now(), 800, 100, 450)).toEqual([])
    expect(updateAllDanmakus(undefined, Date.now(), 800, 100, 450)).toEqual([])
  })

  it('已移除弹幕不变', () => {
    const danmakus = [
      { id: '1', position: DANMAKU_POSITIONS.SCROLL, removed: true },
    ]
    const updated = updateAllDanmakus(danmakus, Date.now(), 800, 100, 450)
    expect(updated[0]).toBe(danmakus[0])
  })
})

describe('removeExpiredDanmakus', () => {
  it('移除已过期的弹幕', () => {
    const danmakus = [
      { id: '1', removed: true },
      { id: '2', removed: false },
      { id: '3', removed: true },
    ]
    const result = removeExpiredDanmakus(danmakus)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('没有过期弹幕时不变', () => {
    const danmakus = [
      { id: '1', removed: false },
      { id: '2', removed: false },
    ]
    const result = removeExpiredDanmakus(danmakus)
    expect(result.length).toBe(2)
  })

  it('空数组返回空数组', () => {
    expect(removeExpiredDanmakus([])).toEqual([])
  })

  it('非数组返回空数组', () => {
    expect(removeExpiredDanmakus(null)).toEqual([])
    expect(removeExpiredDanmakus(undefined)).toEqual([])
  })
})

describe('clampOpacity', () => {
  it('返回有效的透明度值', () => {
    expect(clampOpacity(0.5)).toBe(0.5)
    expect(clampOpacity(1)).toBe(1)
    expect(clampOpacity(0.1)).toBe(0.1)
  })

  it('限制最小值为 0.1', () => {
    expect(clampOpacity(0)).toBe(0.1)
    expect(clampOpacity(-1)).toBe(0.1)
  })

  it('限制最大值为 1', () => {
    expect(clampOpacity(2)).toBe(1)
    expect(clampOpacity(100)).toBe(1)
  })

  it('无效值返回默认透明度', () => {
    expect(clampOpacity(NaN)).toBe(DEFAULT_SETTINGS.danmakuOpacity)
    expect(clampOpacity(Infinity)).toBe(DEFAULT_SETTINGS.danmakuOpacity)
    expect(clampOpacity('invalid')).toBe(DEFAULT_SETTINGS.danmakuOpacity)
  })
})

describe('clampVolume', () => {
  it('返回有效的音量值', () => {
    expect(clampVolume(0)).toBe(0)
    expect(clampVolume(0.5)).toBe(0.5)
    expect(clampVolume(1)).toBe(1)
  })

  it('限制在 0-1 范围内', () => {
    expect(clampVolume(-1)).toBe(0)
    expect(clampVolume(2)).toBe(1)
  })

  it('无效值返回默认音量', () => {
    expect(clampVolume(NaN)).toBe(DEFAULT_SETTINGS.volume)
    expect(clampVolume(Infinity)).toBe(DEFAULT_SETTINGS.volume)
  })
})

describe('clampPlaybackSpeed', () => {
  it('返回有效的播放速度', () => {
    for (const speed of PLAYBACK_SPEEDS) {
      expect(clampPlaybackSpeed(speed)).toBe(speed)
    }
  })

  it('舍入到最近的有效速度', () => {
    expect(clampPlaybackSpeed(0.6)).toBe(0.5)
    expect(clampPlaybackSpeed(1.1)).toBe(1)
    expect(clampPlaybackSpeed(1.4)).toBe(1.5)
    expect(clampPlaybackSpeed(1.8)).toBe(2)
  })

  it('无效值返回默认速度', () => {
    expect(clampPlaybackSpeed(NaN)).toBe(DEFAULT_SETTINGS.playbackSpeed)
    expect(clampPlaybackSpeed(Infinity)).toBe(DEFAULT_SETTINGS.playbackSpeed)
    expect(clampPlaybackSpeed('invalid')).toBe(DEFAULT_SETTINGS.playbackSpeed)
  })
})

describe('loadSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('从 localStorage 读取设置', () => {
    const data = {
      danmakuEnabled: false,
      danmakuOpacity: 0.5,
      density: DENSITY_LEVELS.HIGH,
      volume: 0.3,
      playbackSpeed: 1.5,
    }
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data))
    const result = loadSettings()
    expect(result.danmakuEnabled).toBe(false)
    expect(result.danmakuOpacity).toBe(0.5)
    expect(result.density).toBe(DENSITY_LEVELS.HIGH)
    expect(result.volume).toBe(0.3)
    expect(result.playbackSpeed).toBe(1.5)
  })

  it('localStorage 为空时返回默认设置', () => {
    const result = loadSettings()
    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('数据损坏时返回默认设置', () => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, 'invalid json')
    const result = loadSettings()
    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('非对象时返回默认设置', () => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify('string'))
    const result = loadSettings()
    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('规范化无效值', () => {
    const data = {
      danmakuEnabled: 'not-bool',
      danmakuOpacity: 2,
      density: 'invalid',
      volume: -1,
      playbackSpeed: 99,
    }
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data))
    const result = loadSettings()
    expect(result.danmakuEnabled).toBe(DEFAULT_SETTINGS.danmakuEnabled)
    expect(result.danmakuOpacity).toBe(1)
    expect(result.density).toBe(DEFAULT_SETTINGS.density)
    expect(result.volume).toBe(0)
    expect(PLAYBACK_SPEEDS.includes(result.playbackSpeed)).toBe(true)
  })

  it('无 storage 返回默认设置', () => {
    const result = loadSettings(null)
    expect(result).toEqual(DEFAULT_SETTINGS)
  })
})

describe('saveSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('保存设置到 localStorage', () => {
    const settings = {
      danmakuEnabled: true,
      danmakuOpacity: 0.8,
      density: DENSITY_LEVELS.LOW,
      volume: 0.5,
      playbackSpeed: 1,
    }
    const result = saveSettings(settings)
    expect(result).toBe(true)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS))
    expect(saved.danmakuEnabled).toBe(true)
    expect(saved.danmakuOpacity).toBe(0.8)
    expect(saved.density).toBe(DENSITY_LEVELS.LOW)
  })

  it('保存时规范化无效值', () => {
    const settings = {
      danmakuEnabled: 'yes',
      danmakuOpacity: 2,
      density: 'invalid',
      volume: 5,
      playbackSpeed: 99,
    }
    saveSettings(settings)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS))
    expect(saved.danmakuEnabled).toBe(DEFAULT_SETTINGS.danmakuEnabled)
    expect(saved.danmakuOpacity).toBe(1)
    expect(saved.density).toBe(DEFAULT_SETTINGS.density)
  })

  it('无 storage 返回 false', () => {
    expect(saveSettings(DEFAULT_SETTINGS, null)).toBe(false)
  })

  it('保存出错返回 false', () => {
    const origSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('error')
    })
    expect(saveSettings(DEFAULT_SETTINGS)).toBe(false)
    localStorage.setItem = origSetItem
  })
})

describe('calculateProgressPercent', () => {
  it('计算正确的进度百分比', () => {
    expect(calculateProgressPercent(0, 300)).toBe(0)
    expect(calculateProgressPercent(150, 300)).toBe(50)
    expect(calculateProgressPercent(300, 300)).toBe(100)
  })

  it('限制在 0-100 范围内', () => {
    expect(calculateProgressPercent(-10, 300)).toBe(0)
    expect(calculateProgressPercent(600, 300)).toBe(100)
  })

  it('无效时长返回 0', () => {
    expect(calculateProgressPercent(50, 0)).toBe(0)
    expect(calculateProgressPercent(50, -10)).toBe(0)
    expect(calculateProgressPercent(50, NaN)).toBe(0)
  })

  it('无效时间值返回 0', () => {
    expect(calculateProgressPercent(null, 300)).toBe(0)
    expect(calculateProgressPercent(undefined, 300)).toBe(0)
    expect(calculateProgressPercent(NaN, 300)).toBe(0)
  })
})

describe('calculateTimeFromPercent', () => {
  it('根据百分比计算正确的时间', () => {
    expect(calculateTimeFromPercent(0, 300)).toBe(0)
    expect(calculateTimeFromPercent(50, 300)).toBe(150)
    expect(calculateTimeFromPercent(100, 300)).toBe(300)
  })

  it('限制百分比范围', () => {
    expect(calculateTimeFromPercent(-10, 300)).toBe(0)
    expect(calculateTimeFromPercent(150, 300)).toBe(300)
  })

  it('无效时长返回 0', () => {
    expect(calculateTimeFromPercent(50, 0)).toBe(0)
    expect(calculateTimeFromPercent(50, -10)).toBe(0)
  })

  it('无效百分比返回 0', () => {
    expect(calculateTimeFromPercent(null, 300)).toBe(0)
    expect(calculateTimeFromPercent(undefined, 300)).toBe(0)
  })
})

describe('sortDanmakuListByTime', () => {
  it('按时间倒序排列弹幕', () => {
    const list = [
      { id: '1', videoTime: 10 },
      { id: '2', videoTime: 200 },
      { id: '3', videoTime: 50 },
    ]
    const sorted = sortDanmakuListByTime(list)
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('3')
    expect(sorted[2].id).toBe('1')
  })

  it('不修改原数组', () => {
    const list = [
      { id: '1', videoTime: 10 },
      { id: '2', videoTime: 200 },
    ]
    const original = [...list]
    sortDanmakuListByTime(list)
    expect(list).toEqual(original)
  })

  it('空数组返回空数组', () => {
    expect(sortDanmakuListByTime([])).toEqual([])
  })

  it('非数组返回空数组', () => {
    expect(sortDanmakuListByTime(null)).toEqual([])
    expect(sortDanmakuListByTime(undefined)).toEqual([])
  })
})

describe('getDanmakuPositionIcon', () => {
  it('滚动弹幕显示 ↔', () => {
    expect(getDanmakuPositionIcon(DANMAKU_POSITIONS.SCROLL)).toBe('↔')
  })

  it('顶部弹幕显示 ↑', () => {
    expect(getDanmakuPositionIcon(DANMAKU_POSITIONS.TOP)).toBe('↑')
  })

  it('中间弹幕显示 ●', () => {
    expect(getDanmakuPositionIcon(DANMAKU_POSITIONS.MIDDLE)).toBe('●')
  })

  it('底部弹幕显示 ↓', () => {
    expect(getDanmakuPositionIcon(DANMAKU_POSITIONS.BOTTOM)).toBe('↓')
  })

  it('未知位置显示 ·', () => {
    expect(getDanmakuPositionIcon('invalid')).toBe('·')
  })
})

describe('evictOldestIfOverCapacity', () => {
  it('未超容量时不变', () => {
    const danmakus = [
      { id: '1', position: DANMAKU_POSITIONS.SCROLL, startTime: 100, removed: false },
    ]
    const result = evictOldestIfOverCapacity(danmakus, 10)
    expect(result).toEqual(danmakus)
  })

  it('超容量时移除最早的滚动弹幕', () => {
    const danmakus = [
      { id: '1', position: DANMAKU_POSITIONS.SCROLL, startTime: 100, removed: false },
      { id: '2', position: DANMAKU_POSITIONS.SCROLL, startTime: 200, removed: false },
      { id: '3', position: DANMAKU_POSITIONS.SCROLL, startTime: 300, removed: false },
    ]
    const result = evictOldestIfOverCapacity(danmakus, 2)
    const removedItem = result.find((d) => d.id === '1')
    expect(removedItem.removed).toBe(true)
  })

  it('固定弹幕不计入滚动容量限制', () => {
    const danmakus = [
      { id: '1', position: DANMAKU_POSITIONS.TOP, startTime: 100, removed: false },
      { id: '2', position: DANMAKU_POSITIONS.SCROLL, startTime: 200, removed: false },
    ]
    const result = evictOldestIfOverCapacity(danmakus, 5)
    expect(result.every((d) => !d.removed)).toBe(true)
  })

  it('空数组返回空数组', () => {
    expect(evictOldestIfOverCapacity([], 10)).toEqual([])
  })

  it('非数组返回空数组', () => {
    expect(evictOldestIfOverCapacity(null, 10)).toEqual([])
    expect(evictOldestIfOverCapacity(undefined, 10)).toEqual([])
  })

  it('已移除弹幕不重复移除', () => {
    const danmakus = [
      { id: '1', position: DANMAKU_POSITIONS.SCROLL, startTime: 100, removed: true },
    ]
    const result = evictOldestIfOverCapacity(danmakus, 0)
    expect(result.length).toBe(1)
  })
})

describe('cleanupOutOfRangeScrollDanmakus', () => {
  it('非数组返回空数组', () => {
    expect(cleanupOutOfRangeScrollDanmakus(null, 3)).toEqual([])
    expect(cleanupOutOfRangeScrollDanmakus(undefined, 3)).toEqual([])
  })

  it('空数组返回空数组', () => {
    expect(cleanupOutOfRangeScrollDanmakus([], 5)).toEqual([])
  })

  it('轨道数量足够时弹幕都保留', () => {
    const danmakus = [
      { id: 'a', position: DANMAKU_POSITIONS.SCROLL, trackIndex: 0, removed: false },
      { id: 'b', position: DANMAKU_POSITIONS.SCROLL, trackIndex: 2, removed: false },
    ]
    const result = cleanupOutOfRangeScrollDanmakus(danmakus, 5)
    expect(result.every((d) => !d.removed)).toBe(true)
  })

  it('轨道不足时超轨滚动弹幕被标记移除', () => {
    const danmakus = [
      { id: 'a', position: DANMAKU_POSITIONS.SCROLL, trackIndex: 0, removed: false },
      { id: 'b', position: DANMAKU_POSITIONS.SCROLL, trackIndex: 3, removed: false },
      { id: 'c', position: DANMAKU_POSITIONS.SCROLL, trackIndex: 7, removed: false },
    ]
    const result = cleanupOutOfRangeScrollDanmakus(danmakus, 3)
    expect(result.find((d) => d.id === 'a').removed).toBe(false)
    expect(result.find((d) => d.id === 'b').removed).toBe(true)
    expect(result.find((d) => d.id === 'c').removed).toBe(true)
  })

  it('固定弹幕不受轨道数影响', () => {
    const danmakus = [
      { id: 'a', position: DANMAKU_POSITIONS.TOP, removed: false },
      { id: 'b', position: DANMAKU_POSITIONS.BOTTOM, removed: false },
      { id: 'c', position: DANMAKU_POSITIONS.SCROLL, trackIndex: 5, removed: false },
    ]
    const result = cleanupOutOfRangeScrollDanmakus(danmakus, 3)
    expect(result.find((d) => d.id === 'a').removed).toBe(false)
    expect(result.find((d) => d.id === 'b').removed).toBe(false)
    expect(result.find((d) => d.id === 'c').removed).toBe(true)
  })

  it('已移除的弹幕保持不变', () => {
    const danmakus = [
      { id: 'a', position: DANMAKU_POSITIONS.SCROLL, trackIndex: 10, removed: true },
    ]
    const result = cleanupOutOfRangeScrollDanmakus(danmakus, 3)
    expect(result[0].removed).toBe(true)
  })

  it('无效 newTrackCount 返回原数组', () => {
    const danmakus = [
      { id: 'a', position: DANMAKU_POSITIONS.SCROLL, trackIndex: 5, removed: false },
    ]
    const r1 = cleanupOutOfRangeScrollDanmakus(danmakus, NaN)
    const r2 = cleanupOutOfRangeScrollDanmakus(danmakus, 'abc')
    expect(r1).toEqual(danmakus)
    expect(r2).toEqual(danmakus)
  })

  it('负数 trackIndex 也视为超轨', () => {
    const danmakus = [
      { id: 'a', position: DANMAKU_POSITIONS.SCROLL, trackIndex: -1, removed: false },
    ]
    const result = cleanupOutOfRangeScrollDanmakus(danmakus, 3)
    expect(result[0].removed).toBe(true)
  })
})
