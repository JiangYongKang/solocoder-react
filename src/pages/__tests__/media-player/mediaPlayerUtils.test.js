import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import {
  STORAGE_KEY_PLAYLIST,
  STORAGE_KEY_PLAYBACK_STATE,
  STORAGE_KEY_LYRICS,
  STORAGE_KEY_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_PLAYLIST,
  PLAYBACK_SPEEDS,
  MEDIA_TYPES,
} from '../../media-player/constants'
import {
  formatTime,
  parseLrcTime,
  parseLrc,
  findCurrentLyricIndex,
  generateMediaId,
  detectMediaType,
  validateMediaItem,
  createMediaItem,
  loadPlaylist,
  savePlaylist,
  savePlaybackState,
  loadPlaybackState,
  clearPlaybackState,
  loadLyrics,
  saveLyrics,
  loadSettings,
  saveSettings,
  clampVolume,
  clampPlaybackSpeed,
  reorderPlaylist,
  getNextMediaIndex,
  getPrevMediaIndex,
  findMediaIndexById,
  seekWithinDuration,
} from '../../media-player/mediaPlayerUtils'

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

describe('formatTime', () => {
  it('格式化小于1小时的时间为 MM:SS', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(59)).toBe('00:59')
    expect(formatTime(60)).toBe('01:00')
    expect(formatTime(599)).toBe('09:59')
  })

  it('格式化大于等于1小时的时间为 HH:MM:SS', () => {
    expect(formatTime(3600)).toBe('01:00:00')
    expect(formatTime(3661)).toBe('01:01:01')
    expect(formatTime(7265)).toBe('02:01:05')
  })

  it('处理负数和无效值返回 00:00', () => {
    expect(formatTime(-1)).toBe('00:00')
    expect(formatTime(-100)).toBe('00:00')
    expect(formatTime(NaN)).toBe('00:00')
    expect(formatTime(Infinity)).toBe('00:00')
    expect(formatTime(null)).toBe('00:00')
    expect(formatTime(undefined)).toBe('00:00')
  })

  it('处理浮点数时向下取整', () => {
    expect(formatTime(59.9)).toBe('00:59')
    expect(formatTime(60.1)).toBe('01:00')
  })
})

describe('parseLrcTime', () => {
  it('解析 [mm:ss.xx] 格式', () => {
    expect(parseLrcTime('[00:00.00]')).toBe(0)
    expect(parseLrcTime('[00:05.50]')).toBe(5.5)
    expect(parseLrcTime('[01:30.00]')).toBe(90)
    expect(parseLrcTime('[10:00.00]')).toBe(600)
  })

  it('解析 [mm:ss:xx] 冒号分隔的毫秒', () => {
    expect(parseLrcTime('[00:05:500]')).toBe(5.5)
    expect(parseLrcTime('[01:30:100]')).toBe(90.1)
  })

  it('解析不带毫秒的格式', () => {
    expect(parseLrcTime('[00:05]')).toBe(5)
    expect(parseLrcTime('[01:30]')).toBe(90)
  })

  it('解析一位数分钟', () => {
    expect(parseLrcTime('[0:05.00]')).toBe(5)
    expect(parseLrcTime('[1:30.00]')).toBe(90)
  })

  it('无效格式返回 null', () => {
    expect(parseLrcTime('')).toBeNull()
    expect(parseLrcTime('invalid')).toBeNull()
    expect(parseLrcTime('[invalid]')).toBeNull()
    expect(parseLrcTime('[abc:def]')).toBeNull()
  })
})

describe('parseLrc', () => {
  it('解析简单的 LRC 文本', () => {
    const lrc = `[00:00.00]第一行歌词
[00:05.00]第二行歌词
[00:10.00]第三行歌词`
    const result = parseLrc(lrc)
    expect(result.length).toBe(3)
    expect(result[0]).toEqual({ time: 0, text: '第一行歌词' })
    expect(result[1]).toEqual({ time: 5, text: '第二行歌词' })
    expect(result[2]).toEqual({ time: 10, text: '第三行歌词' })
  })

  it('按时间排序返回结果', () => {
    const lrc = `[00:10.00]第三行
[00:00.00]第一行
[00:05.00]第二行`
    const result = parseLrc(lrc)
    expect(result[0].time).toBe(0)
    expect(result[1].time).toBe(5)
    expect(result[2].time).toBe(10)
  })

  it('处理一行多个时间标签', () => {
    const lrc = '[00:00.00][00:05.00]重复的歌词'
    const result = parseLrc(lrc)
    expect(result.length).toBe(2)
    expect(result[0]).toEqual({ time: 0, text: '重复的歌词' })
    expect(result[1]).toEqual({ time: 5, text: '重复的歌词' })
  })

  it('处理空行和无效行', () => {
    const lrc = `[00:00.00]第一行

无效行
[00:05.00]第二行`
    const result = parseLrc(lrc)
    expect(result.length).toBe(2)
    expect(result[0].text).toBe('第一行')
    expect(result[1].text).toBe('第二行')
  })

  it('处理空文本和无效输入返回空数组', () => {
    expect(parseLrc('')).toEqual([])
    expect(parseLrc(null)).toEqual([])
    expect(parseLrc(undefined)).toEqual([])
    expect(parseLrc(123)).toEqual([])
  })

  it('处理空歌词文本显示 ♪', () => {
    const lrc = '[00:00.00]'
    const result = parseLrc(lrc)
    expect(result.length).toBe(1)
    expect(result[0].text).toBe('')
  })

  it('处理 Windows 换行符 \\r\\n', () => {
    const lrc = '[00:00.00]第一行\r\n[00:05.00]第二行'
    const result = parseLrc(lrc)
    expect(result.length).toBe(2)
  })

  it('歌词文本去除首尾空格', () => {
    const lrc = '[00:00.00]  带空格的歌词  '
    const result = parseLrc(lrc)
    expect(result[0].text).toBe('带空格的歌词')
  })
})

describe('findCurrentLyricIndex', () => {
  const lyrics = [
    { time: 0, text: '第一行' },
    { time: 5, text: '第二行' },
    { time: 10, text: '第三行' },
    { time: 15, text: '第四行' },
  ]

  it('找到当前时间对应的歌词索引', () => {
    expect(findCurrentLyricIndex(lyrics, 0)).toBe(0)
    expect(findCurrentLyricIndex(lyrics, 3)).toBe(0)
    expect(findCurrentLyricIndex(lyrics, 5)).toBe(1)
    expect(findCurrentLyricIndex(lyrics, 7)).toBe(1)
    expect(findCurrentLyricIndex(lyrics, 10)).toBe(2)
    expect(findCurrentLyricIndex(lyrics, 20)).toBe(3)
  })

  it('空歌词数组返回 -1', () => {
    expect(findCurrentLyricIndex([], 0)).toBe(-1)
  })

  it('null 或 undefined 歌词返回 -1', () => {
    expect(findCurrentLyricIndex(null, 0)).toBe(-1)
    expect(findCurrentLyricIndex(undefined, 0)).toBe(-1)
  })

  it('播放时间在第一行之前返回 -1', () => {
    const shiftedLyrics = [
      { time: 5, text: '第一行' },
      { time: 10, text: '第二行' },
    ]
    expect(findCurrentLyricIndex(shiftedLyrics, 0)).toBe(-1)
    expect(findCurrentLyricIndex(shiftedLyrics, 3)).toBe(-1)
  })
})

describe('generateMediaId', () => {
  it('生成的ID以 media_ 开头', () => {
    expect(generateMediaId()).toMatch(/^media_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateMediaId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('detectMediaType', () => {
  it('根据视频文件扩展名识别视频', () => {
    expect(detectMediaType('https://example.com/video.mp4')).toBe(MEDIA_TYPES.VIDEO)
    expect(detectMediaType('https://example.com/video.webm')).toBe(MEDIA_TYPES.VIDEO)
    expect(detectMediaType('https://example.com/video.mov')).toBe(MEDIA_TYPES.VIDEO)
    expect(detectMediaType('https://example.com/video.m4v')).toBe(MEDIA_TYPES.VIDEO)
    expect(detectMediaType('https://example.com/video.avi')).toBe(MEDIA_TYPES.VIDEO)
  })

  it('根据音频文件扩展名识别音频', () => {
    expect(detectMediaType('https://example.com/audio.mp3')).toBe(MEDIA_TYPES.AUDIO)
    expect(detectMediaType('https://example.com/audio.wav')).toBe(MEDIA_TYPES.AUDIO)
    expect(detectMediaType('https://example.com/audio.flac')).toBe(MEDIA_TYPES.AUDIO)
    expect(detectMediaType('https://example.com/audio.aac')).toBe(MEDIA_TYPES.AUDIO)
    expect(detectMediaType('https://example.com/audio.m4a')).toBe(MEDIA_TYPES.AUDIO)
  })

  it('忽略URL查询参数识别类型', () => {
    expect(detectMediaType('https://example.com/video.mp4?token=123')).toBe(MEDIA_TYPES.VIDEO)
    expect(detectMediaType('https://example.com/audio.mp3?t=10')).toBe(MEDIA_TYPES.AUDIO)
  })

  it('未知扩展名默认返回音频', () => {
    expect(detectMediaType('https://example.com/media.unknown')).toBe(MEDIA_TYPES.AUDIO)
    expect(detectMediaType('https://example.com/media')).toBe(MEDIA_TYPES.AUDIO)
  })

  it('无效URL默认返回音频', () => {
    expect(detectMediaType('')).toBe(MEDIA_TYPES.AUDIO)
    expect(detectMediaType(null)).toBe(MEDIA_TYPES.AUDIO)
    expect(detectMediaType(undefined)).toBe(MEDIA_TYPES.AUDIO)
  })

  it('扩展名大小写不敏感', () => {
    expect(detectMediaType('https://example.com/video.MP4')).toBe(MEDIA_TYPES.VIDEO)
    expect(detectMediaType('https://example.com/audio.MP3')).toBe(MEDIA_TYPES.AUDIO)
  })
})

describe('validateMediaItem', () => {
  it('验证有效的媒体项', () => {
    const result = validateMediaItem({
      title: '测试标题',
      url: 'https://example.com/audio.mp3',
    })
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })

  it('检测空标题', () => {
    const result = validateMediaItem({
      title: '',
      url: 'https://example.com/audio.mp3',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeTruthy()
  })

  it('检测空白标题', () => {
    const result = validateMediaItem({
      title: '   ',
      url: 'https://example.com/audio.mp3',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeTruthy()
  })

  it('检测空URL', () => {
    const result = validateMediaItem({
      title: '测试',
      url: '',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.url).toBeTruthy()
  })

  it('检测无效URL协议', () => {
    const result = validateMediaItem({
      title: '测试',
      url: 'ftp://example.com/audio.mp3',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.url).toBeTruthy()
  })

  it('同时检测多个错误', () => {
    const result = validateMediaItem({
      title: '',
      url: 'invalid-url',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeTruthy()
    expect(result.errors.url).toBeTruthy()
  })

  it('接受 http 和 https 协议', () => {
    expect(validateMediaItem({ title: 't', url: 'http://example.com/a.mp3' }).valid).toBe(true)
    expect(validateMediaItem({ title: 't', url: 'https://example.com/a.mp3' }).valid).toBe(true)
  })

  it('URL 协议大小写不敏感', () => {
    expect(validateMediaItem({ title: 't', url: 'HTTP://example.com/a.mp3' }).valid).toBe(true)
    expect(validateMediaItem({ title: 't', url: 'HTTPS://example.com/a.mp3' }).valid).toBe(true)
  })

  it('无效或 null 的 item 返回错误', () => {
    expect(validateMediaItem(null).valid).toBe(false)
    expect(validateMediaItem(undefined).valid).toBe(false)
    expect(validateMediaItem('string').valid).toBe(false)
  })
})

describe('createMediaItem', () => {
  it('创建有效的媒体项', () => {
    const item = createMediaItem('测试标题', 'https://example.com/video.mp4')
    expect(item.id).toMatch(/^media_/)
    expect(item.title).toBe('测试标题')
    expect(item.url).toBe('https://example.com/video.mp4')
    expect(item.type).toBe(MEDIA_TYPES.VIDEO)
  })

  it('自动检测类型', () => {
    const audioItem = createMediaItem('音频', 'https://example.com/audio.mp3')
    expect(audioItem.type).toBe(MEDIA_TYPES.AUDIO)
    const videoItem = createMediaItem('视频', 'https://example.com/video.mp4')
    expect(videoItem.type).toBe(MEDIA_TYPES.VIDEO)
  })

  it('使用指定的类型', () => {
    const item = createMediaItem('测试', 'https://example.com/media', MEDIA_TYPES.VIDEO)
    expect(item.type).toBe(MEDIA_TYPES.VIDEO)
  })

  it('去除标题和 URL 的首尾空格', () => {
    const item = createMediaItem('  测试标题  ', '  https://example.com/audio.mp3  ')
    expect(item.title).toBe('测试标题')
    expect(item.url).toBe('https://example.com/audio.mp3')
  })
})

describe('playlist localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('savePlaylist 保存到 localStorage', () => {
    const playlist = [{ id: '1', title: 'test', url: 'http://test.com/a.mp3', type: 'audio' }]
    const result = savePlaylist(playlist)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_PLAYLIST)).toBe(JSON.stringify(playlist))
  })

  it('savePlaylist 出错时返回 false', () => {
    const origSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const result = savePlaylist([])
    expect(result).toBe(false)
    localStorage.setItem = origSetItem
  })

  it('loadPlaylist 从 localStorage 读取', () => {
    const playlist = [
      { id: '1', title: 'test', url: 'http://test.com/a.mp3', type: 'audio' },
    ]
    localStorage.setItem(STORAGE_KEY_PLAYLIST, JSON.stringify(playlist))
    const result = loadPlaylist()
    expect(result).toEqual(playlist)
  })

  it('loadPlaylist localStorage 为空时返回默认播放列表', () => {
    const result = loadPlaylist()
    expect(result).toEqual(DEFAULT_PLAYLIST)
  })

  it('loadPlaylist localStorage 数据损坏时返回默认播放列表', () => {
    localStorage.setItem(STORAGE_KEY_PLAYLIST, 'invalid json')
    const result = loadPlaylist()
    expect(result).toEqual(DEFAULT_PLAYLIST)
  })

  it('loadPlaylist localStorage 数据非数组时返回默认播放列表', () => {
    localStorage.setItem(STORAGE_KEY_PLAYLIST, JSON.stringify({ not: 'array' }))
    const result = loadPlaylist()
    expect(result).toEqual(DEFAULT_PLAYLIST)
  })

  it('loadPlaylist 过滤无效的媒体项', () => {
    const invalidPlaylist = [
      { id: '1', title: 'valid', url: 'http://test.com/a.mp3', type: 'audio' },
      null,
      { id: '2' },
      'invalid-string',
      { id: 123, title: 'id-not-string', url: 'http://test.com/b.mp3', type: 'audio' },
    ]
    localStorage.setItem(STORAGE_KEY_PLAYLIST, JSON.stringify(invalidPlaylist))
    const result = loadPlaylist()
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('loadPlaylist 过滤后为空时返回默认播放列表', () => {
    localStorage.setItem(STORAGE_KEY_PLAYLIST, JSON.stringify([null, { invalid: true }]))
    const result = loadPlaylist()
    expect(result).toEqual(DEFAULT_PLAYLIST)
  })
})

describe('playback state localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('savePlaybackState 保存到 localStorage', () => {
    const result = savePlaybackState({
      currentMediaId: 'media_test123',
      currentTime: 123.45,
    })
    expect(result).toBe(true)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYBACK_STATE))
    expect(saved.currentMediaId).toBe('media_test123')
    expect(saved.currentTime).toBe(123)
    expect(typeof saved.savedAt).toBe('number')
  })

  it('savePlaybackState 处理负数 currentTime', () => {
    savePlaybackState({ currentMediaId: 'test', currentTime: -10 })
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYBACK_STATE))
    expect(saved.currentTime).toBe(0)
  })

  it('savePlaybackState 处理无效的 currentTime', () => {
    savePlaybackState({ currentMediaId: 'test', currentTime: 'invalid' })
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYBACK_STATE))
    expect(saved.currentTime).toBe(0)
  })

  it('savePlaybackState 处理 null currentMediaId', () => {
    savePlaybackState({ currentMediaId: null, currentTime: 0 })
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYBACK_STATE))
    expect(saved.currentMediaId).toBeNull()
  })

  it('savePlaybackState 出错时返回 false', () => {
    const origSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('error')
    })
    const result = savePlaybackState({ currentMediaId: 'test', currentTime: 0 })
    expect(result).toBe(false)
    localStorage.setItem = origSetItem
  })

  it('loadPlaybackState 从 localStorage 读取', () => {
    const saved = {
      currentMediaId: 'media_test',
      currentTime: 42,
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY_PLAYBACK_STATE, JSON.stringify(saved))
    const result = loadPlaybackState()
    expect(result).not.toBeNull()
    expect(result.currentMediaId).toBe('media_test')
    expect(result.currentTime).toBe(42)
  })

  it('loadPlaybackState localStorage 为空时返回 null', () => {
    expect(loadPlaybackState()).toBeNull()
  })

  it('loadPlaybackState 数据损坏时返回 null', () => {
    localStorage.setItem(STORAGE_KEY_PLAYBACK_STATE, 'invalid json')
    expect(loadPlaybackState()).toBeNull()
  })

  it('loadPlaybackState 非对象时返回 null', () => {
    localStorage.setItem(STORAGE_KEY_PLAYBACK_STATE, JSON.stringify('not object'))
    expect(loadPlaybackState()).toBeNull()
  })

  it('loadPlaybackState 验证并规范化 currentMediaId 类型', () => {
    localStorage.setItem(STORAGE_KEY_PLAYBACK_STATE, JSON.stringify({
      currentMediaId: 123,
      currentTime: 10,
    }))
    const result = loadPlaybackState()
    expect(result.currentMediaId).toBeNull()
  })

  it('clearPlaybackState 清除存储的状态', () => {
    localStorage.setItem(STORAGE_KEY_PLAYBACK_STATE, JSON.stringify({ foo: 'bar' }))
    const result = clearPlaybackState()
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_PLAYBACK_STATE)).toBeNull()
  })

  it('clearPlaybackState 出错时返回 false', () => {
    const origRemoveItem = localStorage.removeItem
    localStorage.removeItem = vi.fn().mockImplementation(() => {
      throw new Error('error')
    })
    const result = clearPlaybackState()
    expect(result).toBe(false)
    localStorage.removeItem = origRemoveItem
  })
})

describe('lyrics localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveLyrics 保存到 localStorage', () => {
    const lrc = '[00:00.00]测试歌词'
    const result = saveLyrics(lrc)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_LYRICS)).toBe(lrc)
  })

  it('saveLyrics 处理空字符串', () => {
    const result = saveLyrics('')
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_LYRICS)).toBe('')
  })

  it('saveLyrics 非字符串转换为空字符串', () => {
    const result = saveLyrics(null)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_LYRICS)).toBe('')
  })

  it('loadLyrics 从 localStorage 读取', () => {
    const lrc = '[00:00.00]测试歌词'
    localStorage.setItem(STORAGE_KEY_LYRICS, lrc)
    expect(loadLyrics()).toBe(lrc)
  })

  it('loadLyrics localStorage 为空时返回空字符串', () => {
    expect(loadLyrics()).toBe('')
  })

  it('saveLyrics 出错时返回 false', () => {
    const origSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('error')
    })
    expect(saveLyrics('test')).toBe(false)
    localStorage.setItem = origSetItem
  })
})

describe('settings localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveSettings 保存到 localStorage', () => {
    const settings = { volume: 0.5, playbackSpeed: 1.5, showLyrics: false }
    const result = saveSettings(settings)
    expect(result).toBe(true)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS))
    expect(saved.volume).toBe(0.5)
    expect(saved.playbackSpeed).toBe(1.5)
    expect(saved.showLyrics).toBe(false)
  })

  it('loadSettings 从 localStorage 读取', () => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
      volume: 0.3,
      playbackSpeed: 2,
      showLyrics: false,
    }))
    const result = loadSettings()
    expect(result.volume).toBe(0.3)
    expect(result.playbackSpeed).toBe(2)
    expect(result.showLyrics).toBe(false)
  })

  it('loadSettings localStorage 为空时返回默认设置', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('loadSettings 数据损坏时返回默认设置', () => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, 'invalid json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('loadSettings 非对象时返回默认设置', () => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify('string'))
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('loadSettings 规范化 volume 和 playbackSpeed', () => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
      volume: 2,
      playbackSpeed: 99,
      showLyrics: 'not-bool',
    }))
    const result = loadSettings()
    expect(result.volume).toBe(1)
    expect(PLAYBACK_SPEEDS.includes(result.playbackSpeed)).toBe(true)
    expect(result.showLyrics).toBe(DEFAULT_SETTINGS.showLyrics)
  })

  it('saveSettings 处理 null 和 undefined settings', () => {
    expect(saveSettings(null)).toBe(true)
    expect(saveSettings(undefined)).toBe(true)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS))
    expect(saved.volume).toBe(DEFAULT_SETTINGS.volume)
    expect(saved.playbackSpeed).toBe(DEFAULT_SETTINGS.playbackSpeed)
  })

  it('saveSettings 出错时返回 false', () => {
    const origSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('error')
    })
    expect(saveSettings(DEFAULT_SETTINGS)).toBe(false)
    localStorage.setItem = origSetItem
  })
})

describe('clampVolume', () => {
  it('返回有效的音量值在 0-1 之间', () => {
    expect(clampVolume(0)).toBe(0)
    expect(clampVolume(0.5)).toBe(0.5)
    expect(clampVolume(1)).toBe(1)
  })

  it('限制超出范围的值', () => {
    expect(clampVolume(-0.5)).toBe(0)
    expect(clampVolume(1.5)).toBe(1)
    expect(clampVolume(-100)).toBe(0)
    expect(clampVolume(100)).toBe(1)
  })

  it('处理无效值返回默认音量', () => {
    expect(clampVolume(NaN)).toBe(DEFAULT_SETTINGS.volume)
    expect(clampVolume(Infinity)).toBe(DEFAULT_SETTINGS.volume)
    expect(clampVolume('invalid')).toBe(DEFAULT_SETTINGS.volume)
    expect(clampVolume(null)).toBe(DEFAULT_SETTINGS.volume)
    expect(clampVolume(undefined)).toBe(DEFAULT_SETTINGS.volume)
  })
})

describe('clampPlaybackSpeed', () => {
  it('返回有效的播放速度之一', () => {
    for (const speed of PLAYBACK_SPEEDS) {
      expect(clampPlaybackSpeed(speed)).toBe(speed)
    }
  })

  it('舍入到最近的有效速度', () => {
    expect(clampPlaybackSpeed(0.6)).toBe(0.5)
    expect(clampPlaybackSpeed(0.7)).toBe(0.75)
    expect(clampPlaybackSpeed(1.1)).toBe(1)
    expect(clampPlaybackSpeed(1.4)).toBe(1.5)
    expect(clampPlaybackSpeed(1.8)).toBe(2)
  })

  it('处理无效值返回默认速度', () => {
    expect(clampPlaybackSpeed(NaN)).toBe(DEFAULT_SETTINGS.playbackSpeed)
    expect(clampPlaybackSpeed(Infinity)).toBe(DEFAULT_SETTINGS.playbackSpeed)
    expect(clampPlaybackSpeed('invalid')).toBe(DEFAULT_SETTINGS.playbackSpeed)
    expect(clampPlaybackSpeed(null)).toBe(DEFAULT_SETTINGS.playbackSpeed)
  })
})

describe('reorderPlaylist', () => {
  it('重新排序播放列表', () => {
    const playlist = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
    ]
    const result = reorderPlaylist(playlist, 1, 3)
    expect(result[0].id).toBe('1')
    expect(result[1].id).toBe('3')
    expect(result[2].id).toBe('4')
    expect(result[3].id).toBe('2')
  })

  it('向前移动项目', () => {
    const playlist = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ]
    const result = reorderPlaylist(playlist, 2, 0)
    expect(result[0].id).toBe('3')
    expect(result[1].id).toBe('1')
    expect(result[2].id).toBe('2')
  })

  it('无效索引返回原数组', () => {
    const playlist = [{ id: '1' }, { id: '2' }]
    expect(reorderPlaylist(playlist, -1, 0)).toEqual(playlist)
    expect(reorderPlaylist(playlist, 0, -1)).toEqual(playlist)
    expect(reorderPlaylist(playlist, 10, 0)).toEqual(playlist)
    expect(reorderPlaylist(playlist, 0, 10)).toEqual(playlist)
  })

  it('非数组播放列表返回空数组', () => {
    expect(reorderPlaylist(null, 0, 1)).toEqual([])
    expect(reorderPlaylist(undefined, 0, 1)).toEqual([])
    expect(reorderPlaylist('string', 0, 1)).toEqual([])
  })

  it('不修改原数组', () => {
    const playlist = [{ id: '1' }, { id: '2' }, { id: '3' }]
    const original = [...playlist]
    reorderPlaylist(playlist, 0, 2)
    expect(playlist).toEqual(original)
  })
})

describe('getNextMediaIndex', () => {
  it('获取下一个媒体索引', () => {
    const playlist = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ]
    expect(getNextMediaIndex(playlist, 0)).toBe(1)
    expect(getNextMediaIndex(playlist, 1)).toBe(2)
  })

  it('最后一个媒体的下一个是第一个（循环）', () => {
    const playlist = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ]
    expect(getNextMediaIndex(playlist, 2)).toBe(0)
  })

  it('空数组返回 -1', () => {
    expect(getNextMediaIndex([], 0)).toBe(-1)
  })

  it('无效当前索引返回第一个', () => {
    const playlist = [{ id: '1' }, { id: '2' }]
    expect(getNextMediaIndex(playlist, -1)).toBe(0)
    expect(getNextMediaIndex(playlist, 100)).toBe(0)
  })

  it('非数组播放列表返回 -1', () => {
    expect(getNextMediaIndex(null, 0)).toBe(-1)
    expect(getNextMediaIndex(undefined, 0)).toBe(-1)
  })
})

describe('getPrevMediaIndex', () => {
  it('获取上一个媒体索引', () => {
    const playlist = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ]
    expect(getPrevMediaIndex(playlist, 2)).toBe(1)
    expect(getPrevMediaIndex(playlist, 1)).toBe(0)
  })

  it('第一个媒体的上一个是最后一个（循环）', () => {
    const playlist = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ]
    expect(getPrevMediaIndex(playlist, 0)).toBe(2)
  })

  it('空数组返回 -1', () => {
    expect(getPrevMediaIndex([], 0)).toBe(-1)
  })

  it('无效当前索引返回最后一个', () => {
    const playlist = [{ id: '1' }, { id: '2' }]
    expect(getPrevMediaIndex(playlist, -1)).toBe(1)
    expect(getPrevMediaIndex(playlist, 100)).toBe(1)
  })

  it('非数组播放列表返回 -1', () => {
    expect(getPrevMediaIndex(null, 0)).toBe(-1)
    expect(getPrevMediaIndex(undefined, 0)).toBe(-1)
  })
})

describe('findMediaIndexById', () => {
  it('通过 ID 找到正确的索引', () => {
    const playlist = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ]
    expect(findMediaIndexById(playlist, 'a')).toBe(0)
    expect(findMediaIndexById(playlist, 'b')).toBe(1)
    expect(findMediaIndexById(playlist, 'c')).toBe(2)
  })

  it('未找到返回 -1', () => {
    const playlist = [{ id: 'a' }, { id: 'b' }]
    expect(findMediaIndexById(playlist, 'not-exist')).toBe(-1)
  })

  it('空播放列表返回 -1', () => {
    expect(findMediaIndexById([], 'a')).toBe(-1)
  })

  it('无效参数返回 -1', () => {
    expect(findMediaIndexById(null, 'a')).toBe(-1)
    expect(findMediaIndexById(undefined, 'a')).toBe(-1)
    expect(findMediaIndexById([{ id: 'a' }], null)).toBe(-1)
    expect(findMediaIndexById([{ id: 'a' }], '')).toBe(-1)
  })
})

describe('seekWithinDuration', () => {
  it('在有效范围内跳转', () => {
    expect(seekWithinDuration(30, 10, 100)).toBe(40)
    expect(seekWithinDuration(30, -10, 100)).toBe(20)
  })

  it('跳转不超过 0', () => {
    expect(seekWithinDuration(5, -10, 100)).toBe(0)
    expect(seekWithinDuration(0, -10, 100)).toBe(0)
  })

  it('跳转不超过总时长', () => {
    expect(seekWithinDuration(95, 10, 100)).toBe(100)
    expect(seekWithinDuration(100, 10, 100)).toBe(100)
  })

  it('无限时长时不设上限', () => {
    expect(seekWithinDuration(100, 100, Infinity)).toBe(200)
    expect(seekWithinDuration(100, 100)).toBe(200)
  })

  it('处理无效值', () => {
    expect(seekWithinDuration(null, 10, 100)).toBe(10)
    expect(seekWithinDuration(30, null, 100)).toBe(30)
    expect(seekWithinDuration('invalid', 10, 100)).toBe(10)
    expect(seekWithinDuration(30, 'invalid', 100)).toBe(30)
  })
})
