export const DIFF_TYPE = {
  EQUAL: 'equal',
  ADDED: 'added',
  REMOVED: 'removed',
  MODIFIED: 'modified',
}

export const splitLines = (text) => {
  if (typeof text !== 'string') return []
  if (text === '') return []
  return text.split('\n')
}

export const computeLCSMatrix = (arr1, arr2) => {
  const m = arr1.length
  const n = arr2.length
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  return dp
}

export const computeLineDiff = (oldLines, newLines) => {
  const oldArr = Array.isArray(oldLines) ? oldLines : splitLines(oldLines)
  const newArr = Array.isArray(newLines) ? newLines : splitLines(newLines)
  const dp = computeLCSMatrix(oldArr, newArr)

  const result = []
  let i = oldArr.length
  let j = newArr.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldArr[i - 1] === newArr[j - 1]) {
      result.unshift({
        type: DIFF_TYPE.EQUAL,
        oldLine: oldArr[i - 1],
        newLine: newArr[j - 1],
        oldIndex: i - 1,
        newIndex: j - 1,
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: DIFF_TYPE.ADDED,
        oldLine: null,
        newLine: newArr[j - 1],
        oldIndex: null,
        newIndex: j - 1,
      })
      j--
    } else {
      result.unshift({
        type: DIFF_TYPE.REMOVED,
        oldLine: oldArr[i - 1],
        newLine: null,
        oldIndex: i - 1,
        newIndex: null,
      })
      i--
    }
  }

  return result
}

export const mergeModifiedLines = (lineDiff) => {
  if (!Array.isArray(lineDiff)) return []
  const merged = []
  let i = 0

  while (i < lineDiff.length) {
    const current = lineDiff[i]

    if (
      current.type === DIFF_TYPE.REMOVED &&
      i + 1 < lineDiff.length &&
      lineDiff[i + 1].type === DIFF_TYPE.ADDED
    ) {
      merged.push({
        type: DIFF_TYPE.MODIFIED,
        oldLine: current.oldLine,
        newLine: lineDiff[i + 1].newLine,
        oldIndex: current.oldIndex,
        newIndex: lineDiff[i + 1].newIndex,
      })
      i += 2
    } else {
      merged.push(current)
      i++
    }
  }

  return merged
}

export const computeCharDiff = (oldStr, newStr) => {
  const oldText = typeof oldStr === 'string' ? oldStr : ''
  const newText = typeof newStr === 'string' ? newStr : ''

  if (oldText === newText) {
    return [{ type: DIFF_TYPE.EQUAL, value: oldText }]
  }

  const dp = computeLCSMatrix(oldText.split(''), newText.split(''))
  const result = []
  let i = oldText.length
  let j = newText.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldText[i - 1] === newText[j - 1]) {
      result.unshift({ type: DIFF_TYPE.EQUAL, value: oldText[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: DIFF_TYPE.ADDED, value: newText[j - 1] })
      j--
    } else {
      result.unshift({ type: DIFF_TYPE.REMOVED, value: oldText[i - 1] })
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

export const buildSideBySideDiff = (oldText, newText) => {
  const oldLines = splitLines(oldText)
  const newLines = splitLines(newText)
  const rawDiff = computeLineDiff(oldLines, newLines)
  const lineDiff = mergeModifiedLines(rawDiff)

  const leftRows = []
  const rightRows = []
  const unifiedRows = []

  let leftLineNum = 1
  let rightLineNum = 1

  lineDiff.forEach((row) => {
    if (row.type === DIFF_TYPE.EQUAL) {
      leftRows.push({
        lineNum: leftLineNum,
        type: DIFF_TYPE.EQUAL,
        content: row.oldLine,
        charDiff: null,
      })
      rightRows.push({
        lineNum: rightLineNum,
        type: DIFF_TYPE.EQUAL,
        content: row.newLine,
        charDiff: null,
      })
      unifiedRows.push({
        leftLineNum: leftLineNum,
        rightLineNum: rightLineNum,
        type: DIFF_TYPE.EQUAL,
        content: row.oldLine,
        charDiff: null,
        prefix: ' ',
      })
      leftLineNum++
      rightLineNum++
    } else if (row.type === DIFF_TYPE.ADDED) {
      leftRows.push({
        lineNum: null,
        type: DIFF_TYPE.EQUAL,
        content: '',
        charDiff: null,
        empty: true,
      })
      rightRows.push({
        lineNum: rightLineNum,
        type: DIFF_TYPE.ADDED,
        content: row.newLine,
        charDiff: null,
      })
      unifiedRows.push({
        leftLineNum: null,
        rightLineNum: rightLineNum,
        type: DIFF_TYPE.ADDED,
        content: row.newLine,
        charDiff: null,
        prefix: '+',
      })
      rightLineNum++
    } else if (row.type === DIFF_TYPE.REMOVED) {
      leftRows.push({
        lineNum: leftLineNum,
        type: DIFF_TYPE.REMOVED,
        content: row.oldLine,
        charDiff: null,
      })
      rightRows.push({
        lineNum: null,
        type: DIFF_TYPE.EQUAL,
        content: '',
        charDiff: null,
        empty: true,
      })
      unifiedRows.push({
        leftLineNum: leftLineNum,
        rightLineNum: null,
        type: DIFF_TYPE.REMOVED,
        content: row.oldLine,
        charDiff: null,
        prefix: '-',
      })
      leftLineNum++
    } else if (row.type === DIFF_TYPE.MODIFIED) {
      const charDiff = computeCharDiff(row.oldLine, row.newLine)
      leftRows.push({
        lineNum: leftLineNum,
        type: DIFF_TYPE.MODIFIED,
        content: row.oldLine,
        charDiff: charDiff.filter(
          (c) => c.type === DIFF_TYPE.EQUAL || c.type === DIFF_TYPE.REMOVED
        ),
      })
      rightRows.push({
        lineNum: rightLineNum,
        type: DIFF_TYPE.MODIFIED,
        content: row.newLine,
        charDiff: charDiff.filter(
          (c) => c.type === DIFF_TYPE.EQUAL || c.type === DIFF_TYPE.ADDED
        ),
      })
      unifiedRows.push({
        leftLineNum: leftLineNum,
        rightLineNum: null,
        type: DIFF_TYPE.MODIFIED,
        content: row.oldLine,
        charDiff: charDiff.filter(
          (c) => c.type === DIFF_TYPE.EQUAL || c.type === DIFF_TYPE.REMOVED
        ),
        prefix: '-',
      })
      unifiedRows.push({
        leftLineNum: null,
        rightLineNum: rightLineNum,
        type: DIFF_TYPE.MODIFIED,
        content: row.newLine,
        charDiff: charDiff.filter(
          (c) => c.type === DIFF_TYPE.EQUAL || c.type === DIFF_TYPE.ADDED
        ),
        prefix: '+',
      })
      leftLineNum++
      rightLineNum++
    }
  })

  return {
    leftRows,
    rightRows,
    unifiedRows,
    lineDiff,
  }
}

export const getDiffStats = (lineDiff) => {
  let added = 0
  let removed = 0
  let modified = 0
  let equal = 0

  if (!Array.isArray(lineDiff)) return { added, removed, modified, equal }

  lineDiff.forEach((row) => {
    switch (row.type) {
      case DIFF_TYPE.ADDED:
        added++
        break
      case DIFF_TYPE.REMOVED:
        removed++
        break
      case DIFF_TYPE.MODIFIED:
        modified++
        break
      case DIFF_TYPE.EQUAL:
        equal++
        break
      default:
        break
    }
  })

  return { added, removed, modified, equal }
}
