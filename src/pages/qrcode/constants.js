export const STORAGE_KEY = 'qrcode_history'

export const ERROR_CORRECTION_LEVELS = {
  L: 'L',
  M: 'M',
  Q: 'Q',
  H: 'H',
}

export const EC_LEVEL_ORDER = ['L', 'M', 'Q', 'H']

export const MODE = {
  TERMINATOR: 0,
  NUMERIC: 1,
  ALPHANUMERIC: 2,
  STRUCTURED_APPEND: 3,
  BYTE: 4,
  ECI: 5,
  KANJI: 6,
  FNC1_FIRST_POSITION: 7,
  FNC1_SECOND_POSITION: 8,
  HANZI: 9,
}

export const MODE_INDICATOR_BITS = {
  [MODE.NUMERIC]: [10, 12, 14],
  [MODE.ALPHANUMERIC]: [9, 11, 13],
  [MODE.BYTE]: [8, 16, 16],
  [MODE.KANJI]: [8, 10, 12],
}

export const ALPHANUMERIC_TABLE =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'

export const MASK_PATTERNS = [
  (r, c) => (r + c) % 2 === 0,
  (r, c) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

export const FORMAT_INFO_GPOLY = 0x537

export const FORMAT_INFO_MASK = 0x5412

export const VERSION_INFO_GPOLY = 0x1f25

export const PENALTY_RULES = {
  RULE1: 3,
  RULE2: 3,
  RULE3: 40,
  RULE4: 10,
}
