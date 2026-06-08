import { GF_EXP, GF_LOG, VERSION_INFORMATION, ALIGNMENT_PATTERN_POSITIONS } from './tables.js'
import { MODE, MODE_INDICATOR_BITS, ALPHANUMERIC_TABLE, FORMAT_INFO_GPOLY, FORMAT_INFO_MASK, VERSION_INFO_GPOLY, ERROR_CORRECTION_LEVELS } from './constants.js'

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function gfInv(x) {
  return GF_EXP[255 - GF_LOG[x]]
}

export function imageToGrayscale(imageData) {
  const { width, height, data } = imageData
  const gray = new Uint8ClampedArray(width * height)
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    gray[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) | 0
  }
  return { gray, width, height }
}

export function binarize(grayData) {
  const { gray, width, height } = grayData
  let sum = 0
  for (let i = 0; i < gray.length; i++) sum += gray[i]
  const threshold = sum / gray.length

  const binary = new Uint8ClampedArray(width * height)
  for (let i = 0; i < gray.length; i++) {
    binary[i] = gray[i] < threshold ? 1 : 0
  }
  return { binary, width, height }
}

export function findFinderPatterns(binaryData) {
  const { binary, width, height } = binaryData
  const patterns = []
  const run = [0, 0, 0, 0, 0]

  for (let r = 0; r < height; r++) {
    run.fill(0)
    let current = 0
    let count = 0
    for (let c = 0; c < width; c++) {
      if (binary[r * width + c] === current) {
        run[count]++
      } else {
        if (count === 4) {
          const total = run[0] + run[1] + run[2] + run[3] + run[4]
          if (total >= 7) {
            const moduleSize = total / 7
            if (
              Math.abs(run[0] - moduleSize) < moduleSize * 0.5 &&
              Math.abs(run[1] - moduleSize) < moduleSize * 0.5 &&
              Math.abs(run[2] - moduleSize * 3) < moduleSize * 1.5 &&
              Math.abs(run[3] - moduleSize) < moduleSize * 0.5 &&
              Math.abs(run[4] - moduleSize) < moduleSize * 0.5
            ) {
              const centerCol = c - run[4] - run[3] - run[2] / 2
              patterns.push({ row: r, col: centerCol, size: moduleSize })
            }
          }
          for (let i = 0; i < 4; i++) run[i] = run[i + 1]
          run[4] = 1
          current = current ^ 1
          count = 4
        } else {
          count++
          run[count] = 1
          current = current ^ 1
        }
      }
    }
  }

  const merged = []
  for (const p of patterns) {
    let found = false
    for (const m of merged) {
      if (Math.abs(p.row - m.row) < 5 && Math.abs(p.col - m.col) < 5) {
        m.row = (m.row + p.row) / 2
        m.col = (m.col + p.col) / 2
        m.size = (m.size + p.size) / 2
        found = true
        break
      }
    }
    if (!found) merged.push({ ...p })
  }

  return merged
}

export function estimateVersion(topLeft, topRight, bottomLeft) {
  const tlToTr = Math.hypot(topRight.col - topLeft.col, topRight.row - topLeft.row)
  const tlToBl = Math.hypot(bottomLeft.col - topLeft.col, bottomLeft.row - topLeft.row)
  const moduleSize = (topLeft.size + topRight.size + bottomLeft.size) / 3
  const modules = Math.round(((tlToTr + tlToBl) / 2) / moduleSize / 7) * 7 + 1
  const version = (modules - 17) / 4
  return Math.max(1, Math.min(40, Math.round(version)))
}

export function getVersionSize(version) {
  return 17 + 4 * version
}

export function sampleGrid(binaryData, version, tl, tr, bl) {
  const size = getVersionSize(version)
  const grid = new Array(size)
  for (let r = 0; r < size; r++) grid[r] = new Array(size)
  const { binary, width } = binaryData
  const moduleSize = (tl.size + tr.size + bl.size) / 3

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const fx = tl.col + (tr.col - tl.col) * (c / (size - 1)) + (bl.col - tl.col) * (r / (size - 1))
      const fy = tl.row + (tr.row - tl.row) * (c / (size - 1)) + (bl.row - tl.row) * (r / (size - 1))
      let sum = 0
      let count = 0
      const radius = moduleSize * 0.4
      for (let dy = -radius; dy <= radius; dy += moduleSize * 0.5) {
        for (let dx = -radius; dx <= radius; dx += moduleSize * 0.5) {
          const px = Math.round(fx + dx)
          const py = Math.round(fy + dy)
          if (px >= 0 && px < binaryData.width && py >= 0 && py < binaryData.height) {
            sum += binary[py * width + px]
            count++
          }
        }
      }
      grid[r][c] = sum / count > 0.5
    }
  }

  return grid
}

export function readFormatInfo(grid) {
  let bits1 = 0
  for (let i = 0; i <= 5; i++) bits1 |= (grid[8][i] ? 1 : 0) << i
  bits1 |= (grid[8][7] ? 1 : 0) << 6
  bits1 |= (grid[8][8] ? 1 : 0) << 7
  bits1 |= (grid[7][8] ? 1 : 0) << 8
  for (let i = 9; i < 15; i++) bits1 |= (grid[14 - i][8] ? 1 : 0) << i

  const size = grid.length
  let bits2 = 0
  for (let i = 0; i < 8; i++) bits2 |= (grid[size - 1 - i][8] ? 1 : 0) << i
  for (let i = 8; i < 15; i++) bits2 |= (grid[8][size - 15 + i] ? 1 : 0) << i

  const ecBitsTable = [ERROR_CORRECTION_LEVELS.M, ERROR_CORRECTION_LEVELS.L, ERROR_CORRECTION_LEVELS.H, ERROR_CORRECTION_LEVELS.Q]
  const ecLookup = { L: 0x01, M: 0x00, Q: 0x03, H: 0x02 }

  function tryDecode(bits) {
    const masked = bits ^ FORMAT_INFO_MASK
    for (let ec = 0; ec < 4; ec++) {
      for (let mask = 0; mask < 8; mask++) {
        const data = (ecLookup[ecBitsTable[ec]] << 3) | mask
        let rem = data << 10
        for (let i = 4; i >= 0; i--) {
          if ((rem >> (i + 10)) & 1) rem ^= FORMAT_INFO_GPOLY << i
        }
        const expected = ((data << 10) | rem)
        if (expected === masked) {
          return { ecLevel: ecBitsTable[ec], maskIndex: mask }
        }
      }
    }
    return null
  }

  return tryDecode(bits1) || tryDecode(bits2)
}

function isReservedFunction(r, c, size, version) {
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

export function applyMask(grid, maskIndex, version) {
  const size = grid.length
  const patterns = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ]
  const mask = patterns[maskIndex]

  const result = new Array(size)
  for (let r = 0; r < size; r++) {
    result[r] = new Array(size)
    for (let c = 0; c < size; c++) {
      result[r][c] = grid[r][c]
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isReservedFunction(r, c, size, version)) {
        if (mask(r, c)) result[r][c] = !result[r][c]
      }
    }
  }
  return result
}

function isDataArea(r, c, size, version) {
  return !isReservedFunction(r, c, size, version)
}

export function readDataCodewords(grid, version) {
  const size = grid.length
  const codewords = []
  let currentByte = 0
  let bitCount = 0
  let upward = true

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i
      for (let cc = 0; cc < 2; cc++) {
        const actualCol = col - cc
        if (isDataArea(row, actualCol, size, version)) {
          currentByte = (currentByte << 1) | (grid[row][actualCol] ? 1 : 0)
          bitCount++
          if (bitCount === 8) {
            codewords.push(currentByte)
            currentByte = 0
            bitCount = 0
          }
        }
      }
    }
    upward = !upward
  }

  return codewords
}

export function rsDecode(data, ecLen) {
  const n = data.length
  const k = n - ecLen
  const syndromes = new Array(ecLen).fill(0)

  for (let i = 0; i < ecLen; i++) {
    for (let j = 0; j < n; j++) {
      syndromes[i] ^= gfMul(data[j], GF_EXP[(i * j) % 255])
    }
  }

  let error = false
  for (const s of syndromes) {
    if (s !== 0) {
      error = true
      break
    }
  }
  if (!error) return data.slice(0, k)

  let errorLocator = [1]
  let oldLocator = [1]

  for (let i = 0; i < ecLen; i++) {
    let delta = syndromes[i]
    for (let j = 1; j < errorLocator.length; j++) {
      delta ^= gfMul(errorLocator[errorLocator.length - 1 - j], syndromes[i - j])
    }

    const newOld = errorLocator.slice()
    if (delta !== 0) {
      if (oldLocator.length > errorLocator.length) {
        const scaled = oldLocator.map((x) => gfMul(x, delta))
        while (errorLocator.length < scaled.length) errorLocator.unshift(0)
        for (let j = 0; j < errorLocator.length; j++) {
          errorLocator[j] ^= scaled[scaled.length - errorLocator.length + j]
        }
      } else {
        const scaled = oldLocator.map((x) => gfMul(x, delta))
        while (scaled.length < errorLocator.length) scaled.unshift(0)
        for (let j = 0; j < errorLocator.length; j++) {
          errorLocator[j] ^= scaled[scaled.length - errorLocator.length + j]
        }
      }
    }
    oldLocator = newOld
  }

  const errorPositions = []
  for (let i = 0; i < 255; i++) {
    let sum = 0
    for (let j = 0; j < errorLocator.length; j++) {
      sum ^= gfMul(errorLocator[errorLocator.length - 1 - j], GF_EXP[(i * j) % 255])
    }
    if (sum === 0) {
      const pos = (255 - i) % 255
      if (pos < n) errorPositions.push(pos)
    }
  }

  if (errorPositions.length * 2 > ecLen) return null

  const errorEvaluator = new Array(errorPositions.length).fill(0)
  for (let i = 0; i < errorEvaluator.length; i++) {
    for (let j = 0; j < ecLen; j++) {
      errorEvaluator[i] ^= gfMul(syndromes[j], GF_EXP[(j * (255 - errorPositions[i])) % 255])
    }
  }

  const errorMagnitudes = []
  for (let i = 0; i < errorPositions.length; i++) {
    let denom = 1
    const xInv = GF_EXP[255 - errorPositions[i]]
    for (let j = 0; j < errorPositions.length; j++) {
      if (i !== j) {
        denom = gfMul(denom, 1 ^ gfMul(xInv, GF_EXP[errorPositions[j]]))
      }
    }
    errorMagnitudes.push(gfMul(errorEvaluator[i], gfInv(denom)))
  }

  const result = data.slice()
  for (let i = 0; i < errorPositions.length; i++) {
    result[n - 1 - errorPositions[i]] ^= errorMagnitudes[i]
  }

  return result.slice(0, k)
}

export function extractDataBlocks(codewords, version, ecLevel) {
  const ecIndex = { L: 0, M: 1, Q: 2, H: 3 }[ecLevel]
  const info = VERSION_INFORMATION[version - 1][ecIndex]
  const [totalCodewords, ecPerBlock, g1Blocks, g1DataLen, g2Blocks, g2DataLen] = info
  const totalBlocks = g1Blocks + g2Blocks

  const blocks = []
  for (let i = 0; i < totalBlocks; i++) {
    blocks.push({ data: [], ec: [] })
  }

  const maxDataLen = Math.max(g1DataLen, g2DataLen)
  let idx = 0
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      const dataLen = b < g1Blocks ? g1DataLen : g2DataLen
      if (i < dataLen) {
        blocks[b].data.push(codewords[idx++])
      }
    }
  }

  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      blocks[b].ec.push(codewords[idx++])
    }
  }

  const dataBytes = []
  for (const block of blocks) {
    const combined = block.data.concat(block.ec)
    const decoded = rsDecode(combined, ecPerBlock)
    if (!decoded) return null
    dataBytes.push(...decoded)
  }

  return dataBytes
}

function numericDecode(bits, startIdx, count) {
  let result = ''
  let idx = startIdx
  for (let i = 0; i < count; i += 3) {
    const remaining = Math.min(3, count - i)
    const bitCount = [1, 4, 7, 10][remaining]
    let num = 0
    for (let j = 0; j < bitCount; j++) {
      num = (num << 1) | bits[idx++]
    }
    result += String(num).padStart(remaining, '0')
  }
  return { text: result, idx }
}

function alphanumericDecode(bits, startIdx, count) {
  let result = ''
  let idx = startIdx
  for (let i = 0; i < count; i += 2) {
    if (i + 1 < count) {
      let val = 0
      for (let j = 0; j < 11; j++) val = (val << 1) | bits[idx++]
      result += ALPHANUMERIC_TABLE[Math.floor(val / 45)]
      result += ALPHANUMERIC_TABLE[val % 45]
    } else {
      let val = 0
      for (let j = 0; j < 6; j++) val = (val << 1) | bits[idx++]
      result += ALPHANUMERIC_TABLE[val]
    }
  }
  return { text: result, idx }
}

function byteDecode(bits, startIdx, count) {
  const bytes = []
  let idx = startIdx
  for (let i = 0; i < count; i++) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[idx++]
    bytes.push(b)
  }
  const decoder = new TextDecoder('utf-8')
  return { text: decoder.decode(new Uint8Array(bytes)), idx }
}

export function decodeData(dataBytes) {
  const bits = []
  for (const b of dataBytes) {
    for (let j = 7; j >= 0; j--) bits.push((b >> j) & 1)
  }

  let result = ''
  let idx = 0

  while (idx < bits.length - 3) {
    let mode = 0
    for (let i = 0; i < 4; i++) mode = (mode << 1) | bits[idx++]

    if (mode === MODE.TERMINATOR) break

    const version = 1
    const charCountBits = MODE_INDICATOR_BITS[mode]
      ? (version <= 9 ? MODE_INDICATOR_BITS[mode][0] : version <= 26 ? MODE_INDICATOR_BITS[mode][1] : MODE_INDICATOR_BITS[mode][2])
      : 8

    let charCount = 0
    for (let i = 0; i < charCountBits; i++) charCount = (charCount << 1) | bits[idx++]

    let decoded
    if (mode === MODE.NUMERIC) decoded = numericDecode(bits, idx, charCount)
    else if (mode === MODE.ALPHANUMERIC) decoded = alphanumericDecode(bits, idx, charCount)
    else if (mode === MODE.BYTE) decoded = byteDecode(bits, idx, charCount)
    else break

    result += decoded.text
    idx = decoded.idx
  }

  return result
}

export function decodeQRImage(imageData) {
  try {
    const grayData = imageToGrayscale(imageData)
    const binaryData = binarize(grayData)
    const patterns = findFinderPatterns(binaryData)

    if (patterns.length < 3) {
      throw new Error('Could not find enough finder patterns')
    }

    patterns.sort((a, b) => b.col - a.col)
    const rightMost = patterns[0]
    const leftPatterns = patterns.slice(1).sort((a, b) => a.row - b.row)
    const topLeft = leftPatterns[0]
    const bottomLeft = leftPatterns[leftPatterns.length - 1]
    const topRight = rightMost

    const version = estimateVersion(topLeft, topRight, bottomLeft)
    const grid = sampleGrid(binaryData, version, topLeft, topRight, bottomLeft)

    const formatInfo = readFormatInfo(grid)
    if (!formatInfo) {
      throw new Error('Could not read format info')
    }

    const unmasked = applyMask(grid, formatInfo.maskIndex)
    const codewords = readDataCodewords(unmasked, version)
    const dataBytes = extractDataBlocks(codewords, version, formatInfo.ecLevel)

    if (!dataBytes) {
      throw new Error('Error correction failed')
    }

    const text = decodeData(dataBytes)
    return { text, version, ecLevel: formatInfo.ecLevel }
  } catch (e) {
    throw new Error('Failed to decode QR code: ' + e.message)
  }
}
