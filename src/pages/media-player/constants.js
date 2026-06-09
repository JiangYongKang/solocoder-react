export const STORAGE_KEY_PLAYLIST = 'media_player_playlist'
export const STORAGE_KEY_PLAYBACK_STATE = 'media_player_playback_state'
export const STORAGE_KEY_LYRICS = 'media_player_lyrics'
export const STORAGE_KEY_SETTINGS = 'media_player_settings'
export const STORAGE_KEY_QUEUE = 'media_player_queue'

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export const DEFAULT_MEDIA_TYPE = 'audio'

export const MEDIA_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video',
}

export const MEDIA_SOURCES = {
  DEFAULT: 'default',
  USER: 'user',
}

export const DEFAULT_SETTINGS = {
  volume: 0.8,
  playbackSpeed: 1,
  showLyrics: true,
}

export const DEFAULT_PLAYLIST = [
  {
    id: 'default_1',
    title: '示例音频 - SoundHelix Song 1',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    type: 'audio',
    source: 'default',
  },
  {
    id: 'default_2',
    title: '示例视频 - Big Buck Bunny',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'video',
    source: 'default',
  },
]

export const SAMPLE_LRC = `[00:00.00]示例歌词
[00:05.00]这是第一行歌词
[00:10.00]这是第二行歌词
[00:15.00]这是第三行歌词
[00:20.00]歌词会跟随播放进度同步滚动
[00:25.00]当前播放的歌词会高亮居中显示
[00:30.00]已播放的歌词会变灰
[00:35.00]你可以粘贴自己的 LRC 格式歌词`
