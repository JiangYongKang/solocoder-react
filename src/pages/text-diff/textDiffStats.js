
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

export const splitIntoLines = (text) => {
  if (typeof text !== 'string') return []
  if (text === '') return []
  return text.split('\n')
}

export const computeDiffCount = (arrA, arrB) => {
  if (!Array.isArray(arrA) || !Array.isArray(arrB)) {
    return { diff: 0, totalA: 0, totalB: 0 }
  }

  const m = arrA.length
  const n = arrB.length

  if (m === 0 && n === 0) {
    return { diff: 0, totalA: 0, totalB: 0 }
  }

  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arrA[i - 1] === arrB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const lcsLength = dp[m][n]
  const diffCount = m + n - 2 * lcsLength

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
  const { totalA, totalB } = diffResult
  const maxTotal = Math.max(totalA, totalB)
  if (maxTotal === 0) return 100
  const lcsLength = diffResult.lcsLength ?? 0
  return parseFloat(((lcsLength / maxTotal) * 100).toFixed(2))
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

  const m = linesA.length
  const n = linesB.length
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const pairs = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      pairs.unshift({
        type: 'equal',
        leftIndex: i - 1,
        rightIndex: j - 1,
        leftContent: linesA[i - 1],
        rightContent: linesB[j - 1],
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      pairs.unshift({
        type: 'added',
        leftIndex: null,
        rightIndex: j - 1,
        leftContent: '',
        rightContent: linesB[j - 1],
      })
      j--
    } else {
      pairs.unshift({
        type: 'removed',
        leftIndex: i - 1,
        rightIndex: null,
        leftContent: linesA[i - 1],
        rightContent: '',
      })
      i--
    }
  }

  return {
    pairs,
    leftLines: linesA,
    rightLines: linesB,
  }
}

export const computeCharDiffForLine = (lineA, lineB) => {
  if (typeof lineA !== 'string') lineA = ''
  if (typeof lineB !== 'string') lineB = ''

  if (lineA === lineB) {
    return [{ type: 'equal', value: lineA }]
  }

  const charsA = lineA.split('')
  const charsB = lineB.split('')
  const m = charsA.length
  const n = charsB.length

  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (charsA[i - 1] === charsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const result = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && charsA[i - 1] === charsB[j - 1]) {
      result.unshift({ type: 'equal', value: charsA[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: charsB[j - 1] })
      j--
    } else {
      result.unshift({ type: 'removed', value: charsA[i - 1] })
      i--
    }
  }

  const merged = []
  for (let k = 0; k < result.length; k++) {
    const item = result[k]
    if (merged.length > 0 && merged[merged.length - 1].type === item.type) {
      merged[merged.length - 1].value += item.value
    } else {
      merged.push({ ...item })
    }
  }

  return merged
}
