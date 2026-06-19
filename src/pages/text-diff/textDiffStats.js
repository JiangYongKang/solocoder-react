import {
  splitLines,
  computeLCSMatrix,
  computeLineDiff,
  computeCharDiff as computeCharDiffUtil,
  mergeModifiedLines,
  DIFF_TYPE,
} from './diffUtils'

export const normalizeText = (text) => {
  if (typeof text !== 'string') return ''
  return text.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, '')
}

export const tokenizeWords = (text) => {
  if (typeof text !== 'string' || text.trim() === '') return []
  const normalized = normalizeText(text)
  const words = normalized.split(/\s+/).filter((w) => w.length > 0)
  return words
}

export const splitIntoChars = (text) => {
  if (typeof text !== 'string') return []
  return text.split('')
}

export const splitIntoLines = splitLines

export const computeDiffCount = (arrA, arrB) => {
  if (!Array.isArray(arrA) || !Array.isArray(arrB)) {
    return { diff: 0, totalA: 0, totalB: 0, lcsLength: 0 }
  }

  const m = arrA.length
  const n = arrB.length

  if (m === 0 && n === 0) {
    return { diff: 0, totalA: 0, totalB: 0, lcsLength: 0 }
  }

  const dp = computeLCSMatrix(arrA, arrB)
  const lcsLength = dp[m][n]
  const diffCount = Math.max(m, n) - lcsLength

  return {
    diff: diffCount,
    totalA: m,
    totalB: n,
    lcsLength,
  }
}

export const computeCharDiffCount = (textA, textB) => {
  const charsA = splitIntoChars(textA)
  const charsB = splitIntoChars(textB)
  return computeDiffCount(charsA, charsB)
}

export const computeWordDiffCount = (textA, textB) => {
  const wordsA = tokenizeWords(textA)
  const wordsB = tokenizeWords(textB)
  return computeDiffCount(wordsA, wordsB)
}

export const computeLineDiffCount = (textA, textB) => {
  const linesA = splitIntoLines(textA)
  const linesB = splitIntoLines(textB)
  return computeDiffCount(linesA, linesB)
}

export const computeSimilarity = (diffResult) => {
  if (!diffResult || typeof diffResult !== 'object') {
    return 0
  }
  const { diff, totalA, totalB } = diffResult
  const maxTotal = Math.max(totalA, totalB)
  if (maxTotal === 0) return 100
  return parseFloat(((1 - diff / maxTotal) * 100).toFixed(2))
}

export const computeCharSimilarity = (textA, textB) => {
  const result = computeCharDiffCount(textA, textB)
  return computeSimilarity(result)
}

export const computeWordSimilarity = (textA, textB) => {
  const result = computeWordDiffCount(textA, textB)
  return computeSimilarity(result)
}

export const computeLineSimilarity = (textA, textB) => {
  const result = computeLineDiffCount(textA, textB)
  return computeSimilarity(result)
}

export const computeAllDiffStats = (textA, textB) => {
  const charResult = computeCharDiffCount(textA, textB)
  const wordResult = computeWordDiffCount(textA, textB)
  const lineResult = computeLineDiffCount(textA, textB)

  return {
    char: {
      ...charResult,
      similarity: computeSimilarity(charResult),
    },
    word: {
      ...wordResult,
      similarity: computeSimilarity(wordResult),
    },
    line: {
      ...lineResult,
      similarity: computeSimilarity(lineResult),
    },
  }
}

export const computeWordFrequency = (text) => {
  const words = tokenizeWords(text)
  const freqMap = new Map()

  words.forEach((word) => {
    freqMap.set(word, (freqMap.get(word) || 0) + 1)
  })

  const totalWords = words.length

  const result = []
  freqMap.forEach((count, word) => {
    result.push({
      word,
      count,
      percentage: totalWords > 0 ? parseFloat(((count / totalWords) * 100).toFixed(2)) : 0,
    })
  })

  result.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))

  return result
}

export const computeCombinedWordFrequency = (textA, textB, topN = 20, onlyDiff = false) => {
  const freqA = computeWordFrequency(textA)
  const freqB = computeWordFrequency(textB)

  const mapA = new Map(freqA.map((item) => [item.word, item]))
  const mapB = new Map(freqB.map((item) => [item.word, item]))

  const allWords = new Set([...mapA.keys(), ...mapB.keys()])

  const combined = []
  allWords.forEach((word) => {
    const itemA = mapA.get(word)
    const itemB = mapB.get(word)
    const countA = itemA?.count ?? 0
    const countB = itemB?.count ?? 0
    const totalCount = countA + countB

    if (onlyDiff && countA === countB) {
      return
    }

    combined.push({
      word,
      countA,
      countB,
      totalCount,
      percentageA: itemA?.percentage ?? 0,
      percentageB: itemB?.percentage ?? 0,
    })
  })

  combined.sort((a, b) => b.totalCount - a.totalCount || a.word.localeCompare(b.word))

  return topN > 0 ? combined.slice(0, topN) : combined
}

export const getSimilarityColor = (similarity) => {
  const clampedSim = Math.max(0, Math.min(100, similarity))
  const ratio = clampedSim / 100

  const r = Math.round(255 * (1 - ratio))
  const g = Math.round(200 * ratio + 55)
  const b = Math.round(80 * (1 - ratio * 0.5))

  return `rgb(${r}, ${g}, ${b})`
}

export const buildLineDiffPairs = (textA, textB) => {
  const linesA = splitIntoLines(textA)
  const linesB = splitIntoLines(textB)
  const rawDiff = computeLineDiff(linesA, linesB)
  const lineDiff = mergeModifiedLines(rawDiff)

  const pairs = lineDiff.map((row) => {
    switch (row.type) {
      case DIFF_TYPE.EQUAL:
        return {
          type: 'equal',
          leftIndex: row.oldIndex,
          rightIndex: row.newIndex,
          leftContent: row.oldLine || '',
          rightContent: row.newLine || '',
        }
      case DIFF_TYPE.ADDED:
        return {
          type: 'added',
          leftIndex: null,
          rightIndex: row.newIndex,
          leftContent: '',
          rightContent: row.newLine || '',
        }
      case DIFF_TYPE.REMOVED:
        return {
          type: 'removed',
          leftIndex: row.oldIndex,
          rightIndex: null,
          leftContent: row.oldLine || '',
          rightContent: '',
        }
      case DIFF_TYPE.MODIFIED:
        return {
          type: 'modified',
          leftIndex: row.oldIndex,
          rightIndex: row.newIndex,
          leftContent: row.oldLine || '',
          rightContent: row.newLine || '',
        }
      default:
        return {
          type: 'equal',
          leftIndex: row.oldIndex ?? null,
          rightIndex: row.newIndex ?? null,
          leftContent: row.oldLine || '',
          rightContent: row.newLine || '',
        }
    }
  })

  return {
    pairs,
    leftLines: linesA,
    rightLines: linesB,
  }
}

export const computeCharDiffForLine = (lineA, lineB) => {
  const charDiff = computeCharDiffUtil(lineA, lineB)
  return charDiff.map((item) => {
    switch (item.type) {
      case DIFF_TYPE.EQUAL:
        return { type: 'equal', value: item.value }
      case DIFF_TYPE.ADDED:
        return { type: 'added', value: item.value }
      case DIFF_TYPE.REMOVED:
        return { type: 'removed', value: item.value }
      default:
        return { type: 'equal', value: item.value }
    }
  })
}
