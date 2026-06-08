import { GF_EXP, GF_LOG, VERSION_INFORMATION, ALIGNMENT_PATTERN_POSITIONS } from './tables.js'
import { MODE, MODE_INDICATOR_BITS, ALPHANUMERIC_TABLE, MASK_PATTERNS, FORMAT_INFO_GPOLY, FORMAT_INFO_MASK, VERSION_INFO_GPOLY, PENALTY_RULES, ERROR_CORRECTION_LEVELS } from './constants.js'

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function createGeneratorPoly(degree) {
  let result = [1]
  for (let i = 0; i < degree; i++) {
    const newResult = new Array(result.length + 1).fill(0)
    for (let j = 0; j < result.length; j++) {
      newResult[j] ^= result[j]
      newResult[j + 1] ^= gfMul(result[j], GF_EXP[i])
    }
    result = newResult
  }
  return result
}

function rsEncode(data, ecLen) {
  const gen = createGeneratorPoly(ecLen)
  const result = new Array(ecLen).fill(0)
  for (const b of data) {
    const factor = b ^ result.shift()
    result.push(0)
    if (factor !== 0) {
      for (let i = 0; i < gen.length - 1; i++) {
        result[i] ^= gfMul(gen[i + 1], factor)
      }
    }
  }
  return result
}

export function getModeForText(text) {
  let hasNumeric = true
  let hasAlphanumeric = true
  for (const c of text) {
    if (c < '0' || c > '9') {
      hasNumeric = false
      if (ALPHANUMERIC_TABLE.indexOf(c) === -1) {
        hasAlphanumeric = false
        break
      }
    }
  }
  if (hasNumeric) return MODE.NUMERIC
  if (hasAlphanumeric) return MODE.ALPHANUMERIC
  return MODE.BYTE
}

export function getCharCountBits(mode, version) {
  const bits = MODE_INDICATOR_BITS[mode]
  if (version <= 9) return bits[0]
  if (version <= 26) return bits[1]
  return bits[2]
}

export function getVersionSize(version) {
  return 17 + 4 * version
}

export function getTotalDataCodewords(version, ecLevel) {
  const ecIndex = { L: 0, M: 1, Q: 2, H: 3 }[ecLevel]
  const info = VERSION_INFORMATION[version - 1][ecIndex]
  return info[2] * info[3] + info[4] * info[5]
}

function numericEncode(text) {
  const bits = []
  for (let i = 0; i < text.length; i += 3) {
    const chunk = text.substr(i, 3)
    const num = parseInt(chunk, 10)
    let bitCount = [1, 4, 7, 10][chunk.length]
    for (let j = bitCount - 1; j >= 0; j--) {
      bits.push((num >> j) & 1)
    }
  }
  return bits
}

function alphanumericEncode(text) {
  const bits = []
  for (let i = 0; i < text.length; i += 2) {
    if (i + 1 < text.length) {
      const val = ALPHANUMERIC_TABLE.indexOf(text[i]) * 45 + ALPHANUMERIC_TABLE.indexOf(text[i + 1])
      for (let j = 10; j >= 0; j--) bits.push((val >> j) & 1)
    } else {
      const val = ALPHANUMERIC_TABLE.indexOf(text[i])
      for (let j = 5; j >= 0; j--) bits.push((val >> j) & 1)
    }
  }
  return bits
}

function byteEncode(text) {
  const bits = []
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  for (const b of bytes) {
    for (let j = 7; j >= 0; j--) bits.push((b >> j) & 1)
  }
  return bits
}

export function encodeData(text, mode, version, ecLevel) {
  let dataBits = []

  const modeIndicator = [
    [0, 0, 0, 1], // NUMERIC (1)
    [0, 0, 1, 0], // ALPHANUMERIC (2)
    [0, 0, 1, 1], // STRUCTURED_APPEND (3)
    [0, 1, 0, 0], // BYTE (4)
  ][mode - 1]
  dataBits = dataBits.concat(modeIndicator)

  const charCount = mode === MODE.BYTE ? new TextEncoder().encode(text).length : text.length
  const charCountBits = getCharCountBits(mode, version)
  for (let i = charCountBits - 1; i >= 0; i--) {
    dataBits.push((charCount >> i) & 1)
  }

  if (mode === MODE.NUMERIC) dataBits = dataBits.concat(numericEncode(text))
  else if (mode === MODE.ALPHANUMERIC) dataBits = dataBits.concat(alphanumericEncode(text))
  else dataBits = dataBits.concat(byteEncode(text))

  const totalDataBits = getTotalDataCodewords(version, ecLevel) * 8

  if (dataBits.length <= totalDataBits - 4) {
    dataBits = dataBits.concat([0, 0, 0, 0])
  } else {
    while (dataBits.length < totalDataBits) dataBits.push(0)
  }

  while (dataBits.length % 8 !== 0) dataBits.push(0)

  let padByte = 0xec
  while (dataBits.length < totalDataBits) {
    for (let i = 7; i >= 0; i--) dataBits.push((padByte >> i) & 1)
    padByte = padByte === 0xec ? 0x11 : 0xec
  }

  const dataBytes = []
  for (let i = 0; i < dataBits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | dataBits[i + j]
    dataBytes.push(b)
  }

  return dataBytes
}

export function addErrorCorrection(dataBytes, version, ecLevel) {
  const ecIndex = { L: 0, M: 1, Q: 2, H: 3 }[ecLevel]
  const info = VERSION_INFORMATION[version - 1][ecIndex]
  const [, ecPerBlock, g1Blocks, g1DataLen, g2Blocks, g2DataLen] = info

  const blocks = []
  let offset = 0
  for (let i = 0; i < g1Blocks; i++) {
    const data = dataBytes.slice(offset, offset + g1DataLen)
    blocks.push({ data, ec: rsEncode(data, ecPerBlock) })
    offset += g1DataLen
  }
  for (let i = 0; i < g2Blocks; i++) {
    const data = dataBytes.slice(offset, offset + g2DataLen)
    blocks.push({ data, ec: rsEncode(data, ecPerBlock) })
    offset += g2DataLen
  }

  const maxDataLen = Math.max(g1DataLen, g2DataLen)
  const result = []

  for (let i = 0; i < maxDataLen; i++) {
    for (const block of blocks) {
      if (i < block.data.length) result.push(block.data[i])
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of blocks) {
      result.push(block.ec[i])
    }
  }

  return result
}

export function initMatrix(size) {
  const matrix = new Array(size)
  for (let r = 0; r < size; r++) {
    matrix[r] = new Array(size).fill(null)
  }
  return matrix
}

export function isReservedFunction(matrix, r, c, size, version) {
  if (r < 8 && c < 8) return true
  if (r < 8 && c >= size - 8) return true
  if (r >= size - 8 && c < 8) return true
  if (version >= 7) {
    if (r < 6 && c >= size - 11 && c < size - 8) return true
    if (c < 6 && r >= size - 11 && r < size - 8) return true
  }
  if (r === 6 || c === 6) return true
  if (r === 8 || c === 8) return true
  const alignment = ALIGNMENT_PATTERN_POSITIONS[version]
  if (alignment) {
    for (const ar of alignment) {
      for (const ac of alignment) {
        if (Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2) {
          if (!(ar === 6 && ac === 6) && !(ar === 6 && ac === size - 7) && !(ar === size - 7 && ac === 6)) {
            return true
          }
        }
      }
    }
  }
  return false
}

export function placeFinderPattern(matrix, row, col) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isOuter = r === 0 || r === 6 || c === 0 || c === 6
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
      matrix[row + r][col + c] = isOuter || isInner ? true : false
    }
  }
}

export function placeAlignmentPattern(matrix, row, col) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isCenter = r === 0 && c === 0
      const isOuter = Math.abs(r) === 2 || Math.abs(c) === 2
      matrix[row + r][col + c] = isCenter || isOuter ? true : false
    }
  }
}

export function placeTimingPatterns(matrix, size) {
  for (let i = 0; i < size; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0
  }
}

export function placeDarkModule(matrix, version) {
  matrix[4 * version + 9][8] = true
}

export function placeFormatInfo(matrix, size, formatInfo) {
  for (let i = 0; i <= 5; i++) matrix[8][i] = !!((formatInfo >> i) & 1)
  matrix[8][7] = !!((formatInfo >> 6) & 1)
  matrix[8][8] = !!((formatInfo >> 7) & 1)
  matrix[7][8] = !!((formatInfo >> 8) & 1)
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = !!((formatInfo >> i) & 1)

  for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = !!((formatInfo >> i) & 1)
  for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = !!((formatInfo >> i) & 1)
  matrix[size - 8][8] = true
}

export function placeVersionInfo(matrix, size, versionInfo) {
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      const bit = (versionInfo >> (i * 3 + j)) & 1
      matrix[j][size - 11 + i] = !!bit
      matrix[size - 11 + i][j] = !!bit
    }
  }
}

export function fillSeparatorsAndRemainder(matrix, size) {
  for (let i = 0; i < 8; i++) {
    if (matrix[7][i] === null) matrix[7][i] = false
    if (matrix[i][7] === null) matrix[i][7] = false
    if (matrix[7][size - 1 - i] === null) matrix[7][size - 1 - i] = false
    if (matrix[size - 1 - i][7] === null) matrix[size - 1 - i][7] = false
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === null) matrix[r][c] = false
    }
  }
}

export function placeData(matrix, size, codewords, maskPattern, version) {
  let idx = 0
  const totalBits = codewords.length * 8
  let upward = true

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i
      for (let c = 0; c < 2; c++) {
        const actualCol = col - c
        if (matrix[row][actualCol] === null && !isReservedFunction(matrix, row, actualCol, size, version)) {
          let bit = false
          if (idx < totalBits) {
            bit = (codewords[Math.floor(idx / 8)] >> (7 - (idx % 8))) & 1
            idx++
          }
          if (maskPattern(row, actualCol)) bit = !bit
          matrix[row][actualCol] = !!bit
        }
      }
    }
    upward = !upward
  }
}

export function calculateFormatInfo(ecLevel, maskIndex) {
  const ecBits = { L: 0x01, M: 0x00, Q: 0x03, H: 0x02 }[ecLevel]
  let data = (ecBits << 3) | maskIndex
  let rem = data << 10
  for (let i = 4; i >= 0; i--) {
    if ((rem >> (i + 10)) & 1) rem ^= FORMAT_INFO_GPOLY << i
  }
  return ((data << 10) | rem) ^ FORMAT_INFO_MASK
}

export function calculateVersionInfo(version) {
  let rem = version << 12
  for (let i = 5; i >= 0; i--) {
    if ((rem >> (i + 12)) & 1) rem ^= VERSION_INFO_GPOLY << i
  }
  return (version << 12) | rem
}

export function copyMatrix(matrix) {
  return matrix.map((row) => row.slice())
}

export function applyMask(matrix, size, maskIndex, version) {
  const result = copyMatrix(matrix)
  const maskFn = MASK_PATTERNS[maskIndex]
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (result[r][c] === null) continue
      if (!isReservedFunction(result, r, c, size, version)) {
        if (maskFn(r, c)) result[r][c] = !result[r][c]
      }
    }
  }
  return result
}

export function calculatePenalty(matrix, size) {
  let penalty = 0

  for (let r = 0; r < size; r++) {
    let count = 1
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) {
        count++
      } else {
        if (count >= 5) penalty += PENALTY_RULES.RULE1 + (count - 5)
        count = 1
      }
    }
    if (count >= 5) penalty += PENALTY_RULES.RULE1 + (count - 5)
  }

  for (let c = 0; c < size; c++) {
    let count = 1
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) {
        count++
      } else {
        if (count >= 5) penalty += PENALTY_RULES.RULE1 + (count - 5)
        count = 1
      }
    }
    if (count >= 5) penalty += PENALTY_RULES.RULE1 + (count - 5)
  }

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r][c]
      if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) {
        penalty += PENALTY_RULES.RULE2
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 6 < size) {
        if (
          matrix[r][c] && !matrix[r][c + 1] && matrix[r][c + 2] && matrix[r][c + 3] &&
          matrix[r][c + 4] && !matrix[r][c + 5] && matrix[r][c + 6]
        ) {
          penalty += PENALTY_RULES.RULE3
        }
      }
      if (r + 6 < size) {
        if (
          matrix[r][c] && !matrix[r + 1][c] && matrix[r + 2][c] && matrix[r + 3][c] &&
          matrix[r + 4][c] && !matrix[r + 5][c] && matrix[r + 6][c]
        ) {
          penalty += PENALTY_RULES.RULE3
        }
      }
    }
  }

  let darkCount = 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) darkCount++
    }
  }
  const ratio = Math.abs(darkCount * 20 / (size * size) - 10)
  penalty += ratio * PENALTY_RULES.RULE4

  return penalty
}

export function buildMatrix(text, version, ecLevel) {
  const size = getVersionSize(version)
  const mode = getModeForText(text)
  const dataBytes = encodeData(text, mode, version, ecLevel)
  const codewords = addErrorCorrection(dataBytes, version, ecLevel)

  let bestMask = 0
  let bestPenalty = Infinity
  let bestMatrix = null

  for (let maskIdx = 0; maskIdx < 8; maskIdx++) {
    const matrix = initMatrix(size)
    placeFinderPattern(matrix, 0, 0)
    placeFinderPattern(matrix, 0, size - 7)
    placeFinderPattern(matrix, size - 7, 0)

    const alignment = ALIGNMENT_PATTERN_POSITIONS[version]
    if (alignment) {
      for (const ar of alignment) {
        for (const ac of alignment) {
          if (!((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6))) {
            placeAlignmentPattern(matrix, ar, ac)
          }
        }
      }
    }

    placeTimingPatterns(matrix, size)
    placeDarkModule(matrix, version)

    placeData(matrix, size, codewords, MASK_PATTERNS[maskIdx], version)

    const formatInfo = calculateFormatInfo(ecLevel, maskIdx)
    placeFormatInfo(matrix, size, formatInfo)

    if (version >= 7) {
      const versionInfo = calculateVersionInfo(version)
      placeVersionInfo(matrix, size, versionInfo)
    }

    fillSeparatorsAndRemainder(matrix, size)

    const penalty = calculatePenalty(matrix, size)
    if (penalty < bestPenalty) {
      bestPenalty = penalty
      bestMask = maskIdx
      bestMatrix = matrix
    }
  }

  return { matrix: bestMatrix, mask: bestMask, mode, version, ecLevel, size }
}

export function findMinVersion(text, ecLevel) {
  const mode = getModeForText(text)
  for (let version = 1; version <= 40; version++) {
    const dataBitsNeeded = 4 + getCharCountBits(mode, version)
    let contentBits = 0
    if (mode === MODE.NUMERIC) {
      contentBits = Math.ceil(text.length / 3) * 10
      if (text.length % 3 === 1) contentBits -= 6
      else if (text.length % 3 === 2) contentBits -= 3
    } else if (mode === MODE.ALPHANUMERIC) {
      contentBits = Math.floor(text.length / 2) * 11 + (text.length % 2) * 6
    } else {
      contentBits = new TextEncoder().encode(text).length * 8
    }
    const totalNeeded = dataBitsNeeded + contentBits + 4
    const totalAvailable = getTotalDataCodewords(version, ecLevel) * 8
    if (totalNeeded <= totalAvailable) return version
  }
  throw new Error('Text too long for any QR code version')
}

export function generateQRCode(text, ecLevel = ERROR_CORRECTION_LEVELS.M) {
  const version = findMinVersion(text, ecLevel)
  return buildMatrix(text, version, ecLevel)
}
