export const DIFFICULTY = {
  EASY: {
    id: 'easy',
    name: '简单',
    wordCount: 200,
    aiDelay: 1500,
    preferRareEndChar: false,
    description: '词库 200 条，AI 思考较慢',
  },
  MEDIUM: {
    id: 'medium',
    name: '中等',
    wordCount: 500,
    aiDelay: 1000,
    preferRareEndChar: false,
    description: '词库 500 条，AI 思考正常',
  },
  HARD: {
    id: 'hard',
    name: '困难',
    wordCount: 800,
    aiDelay: 800,
    preferRareEndChar: true,
    description: '词库 800 条，AI 思考较快且爱用生僻字',
  },
}

export const TIME_LIMIT = 30

export const BASE_SCORE = 10

export const RARE_CHAR_BONUS = 20

export const RARE_PINYIN_INITIALS = new Set(['x', 'z', 'q'])

export const HINT_PENALTY = 15

export const STORAGE_KEYS = {
  STREAK: 'idiom_chain_streak_record',
}

export const PLAYER = {
  HUMAN: 'human',
  AI: 'ai',
}

export const GAME_STATUS = {
  IDLE: 'idle',
  SELECT_DIFFICULTY: 'select_difficulty',
  PLAYING: 'playing',
  AI_THINKING: 'ai_thinking',
  GAME_OVER: 'game_over',
}

export const GAME_OVER_REASON = {
  TIMEOUT: 'timeout',
  AI_CANNOT_RESPOND: 'ai_cannot_respond',
  PLAYER_SURRENDER: 'player_surrender',
  INVALID_INPUT: 'invalid_input',
}

export const VALIDATION_ERROR = {
  NOT_IN_DICTIONARY: 'NOT_IN_DICTIONARY',
  FIRST_CHAR_MISMATCH: 'FIRST_CHAR_MISMATCH',
  ALREADY_USED: 'ALREADY_USED',
}

export const WIN_STREAK_BONUS = 5
