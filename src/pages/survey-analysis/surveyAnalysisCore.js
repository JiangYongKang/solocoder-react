import { QUESTION_TYPES, DURATION_BUCKETS, PAGE_SIZE } from './constants.js'

export function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '-'
  const s = Math.max(0, Math.floor(seconds))
  if (s < 60) return `${s}秒`
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m < 60) return rem > 0 ? `${m}分${rem}秒` : `${m}分钟`
  const h = Math.floor(m / 60)
  const remM = m % 60
  return remM > 0 ? `${h}小时${remM}分` : `${h}小时`
}

export function formatDate(timestamp) {
  if (timestamp == null) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function formatDateOnly(timestamp) {
  if (timestamp == null) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function filterResponses(responses, filters = {}) {
  if (!Array.isArray(responses)) return []
  const { startDate, endDate, minDuration, maxDuration } = filters
  let result = responses
  if (startDate) {
    const startTs = new Date(startDate).getTime()
    result = result.filter((r) => r.submittedAt >= startTs)
  }
  if (endDate) {
    const endTs = new Date(endDate).getTime() + 86400000 - 1
    result = result.filter((r) => r.submittedAt <= endTs)
  }
  if (minDuration !== undefined && minDuration !== null && minDuration !== '') {
    const min = Number(minDuration)
    if (!isNaN(min)) {
      result = result.filter((r) => r.duration >= min)
    }
  }
  if (maxDuration !== undefined && maxDuration !== null && maxDuration !== '') {
    const max = Number(maxDuration)
    if (!isNaN(max)) {
      result = result.filter((r) => r.duration <= max)
    }
  }
  return result
}

export function countQuestionsByType(questions) {
  const counts = {
    [QUESTION_TYPES.SINGLE]: 0,
    [QUESTION_TYPES.MULTIPLE]: 0,
    [QUESTION_TYPES.TEXT]: 0,
    [QUESTION_TYPES.RATING]: 0,
  }
  if (!Array.isArray(questions)) return counts
  questions.forEach((q) => {
    if (counts[q.type] !== undefined) {
      counts[q.type] += 1
    }
  })
  return counts
}

export function calculateSingleChoiceStats(question, responses) {
  const options = question?.options || []
  const total = Array.isArray(responses) ? responses.length : 0
  const counts = new Map()
  options.forEach((opt) => counts.set(opt.value, 0))
  if (Array.isArray(responses)) {
    responses.forEach((r) => {
      const val = r.answers?.[question.id]
      if (val !== undefined && val !== null && val !== '') {
        if (counts.has(val)) {
          counts.set(val, counts.get(val) + 1)
        }
      }
    })
  }
  const data = options.map((opt) => {
    const count = counts.get(opt.value) || 0
    const ratio = total > 0 ? (count / total) * 100 : 0
    return {
      label: opt.label,
      value: opt.value,
      count,
      ratio,
    }
  })
  return { type: QUESTION_TYPES.SINGLE, total, data }
}

export function calculateMultipleChoiceStats(question, responses) {
  const options = question?.options || []
  const total = Array.isArray(responses) ? responses.length : 0
  const counts = new Map()
  options.forEach((opt) => counts.set(opt.value, 0))
  if (Array.isArray(responses)) {
    responses.forEach((r) => {
      const val = r.answers?.[question.id]
      if (Array.isArray(val)) {
        val.forEach((v) => {
          if (counts.has(v)) {
            counts.set(v, counts.get(v) + 1)
          }
        })
      }
    })
  }
  const data = options.map((opt) => {
    const count = counts.get(opt.value) || 0
    const ratio = total > 0 ? (count / total) * 100 : 0
    return {
      label: opt.label,
      value: opt.value,
      count,
      ratio,
    }
  })
  return { type: QUESTION_TYPES.MULTIPLE, total, data }
}

export function calculateRatingStats(question, responses) {
  const maxRating = question?.maxRating || 5
  const total = Array.isArray(responses) ? responses.length : 0
  const counts = new Map()
  for (let i = 1; i <= maxRating; i++) counts.set(i, 0)
  let sum = 0
  let ratedCount = 0
  if (Array.isArray(responses)) {
    responses.forEach((r) => {
      const val = r.answers?.[question.id]
      const rating = Number(val)
      if (!isNaN(rating) && rating >= 1 && rating <= maxRating) {
        counts.set(rating, (counts.get(rating) || 0) + 1)
        sum += rating
        ratedCount += 1
      }
    })
  }
  const data = []
  for (let i = 1; i <= maxRating; i++) {
    const count = counts.get(i) || 0
    const ratio = total > 0 ? (count / total) * 100 : 0
    data.push({ rating: i, count, ratio })
  }
  const average = ratedCount > 0 ? Number((sum / ratedCount).toFixed(2)) : 0
  const sortedRatings = []
  if (Array.isArray(responses)) {
    responses.forEach((r) => {
      const val = r.answers?.[question.id]
      const rating = Number(val)
      if (!isNaN(rating) && rating >= 1 && rating <= maxRating) {
        sortedRatings.push(rating)
      }
    })
  }
  sortedRatings.sort((a, b) => a - b)
  let median = 0
  if (sortedRatings.length > 0) {
    const mid = Math.floor(sortedRatings.length / 2)
    median =
      sortedRatings.length % 2 === 0
        ? (sortedRatings[mid - 1] + sortedRatings[mid]) / 2
        : sortedRatings[mid]
  }
  return { type: QUESTION_TYPES.RATING, total, data, average, median }
}

export function calculateTextStats(question, responses, topN = 10) {
  const total = Array.isArray(responses) ? responses.length : 0
  const wordFreq = new Map()
  const validAnswers = []
  if (Array.isArray(responses)) {
    responses.forEach((r) => {
      const val = r.answers?.[question.id]
      if (typeof val === 'string' && val.trim() !== '') {
        const text = val.trim()
        validAnswers.push(text)
        const tokens = tokenizeText(text)
        tokens.forEach((token) => {
          if (token.length >= 2) {
            wordFreq.set(token, (wordFreq.get(token) || 0) + 1)
          }
        })
      }
    })
  }
  const wordList = Array.from(wordFreq.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
  return {
    type: QUESTION_TYPES.TEXT,
    total,
    answeredCount: validAnswers.length,
    frequentWords: wordList,
    sampleAnswers: validAnswers.slice(0, Math.min(5, validAnswers.length)),
  }
}

function tokenizeText(text) {
  if (!text) return []
  const result = []
  const chineseRegex = /[\u4e00-\u9fa5]{2,}/g
  let match
  while ((match = chineseRegex.exec(text)) !== null) {
    result.push(match[0])
  }
  const cleanText = text.replace(/[\u4e00-\u9fa5]/g, ' ')
  const words = cleanText.split(/[\s，。！？、；：""''（）【】,.!?;:()\[\]"'<>]+/).filter(Boolean)
  words.forEach((w) => {
    if (w.length >= 2) result.push(w.toLowerCase())
  })
  return result
}

export function calculateAllStats(questions, responses) {
  const stats = {}
  if (!Array.isArray(questions)) return stats
  questions.forEach((q) => {
    switch (q.type) {
      case QUESTION_TYPES.SINGLE:
        stats[q.id] = calculateSingleChoiceStats(q, responses)
        break
      case QUESTION_TYPES.MULTIPLE:
        stats[q.id] = calculateMultipleChoiceStats(q, responses)
        break
      case QUESTION_TYPES.RATING:
        stats[q.id] = calculateRatingStats(q, responses)
        break
      case QUESTION_TYPES.TEXT:
        stats[q.id] = calculateTextStats(q, responses)
        break
      default:
        break
    }
  })
  return stats
}

export function median(sortedValues) {
  const n = sortedValues.length
  if (n === 0) return 0
  const mid = Math.floor(n / 2)
  if (n % 2 === 0) {
    return (sortedValues[mid - 1] + sortedValues[mid]) / 2
  }
  return sortedValues[mid]
}

export function calculateDurationDistribution(responses) {
  const total = Array.isArray(responses) ? responses.length : 0
  const bucketCounts = DURATION_BUCKETS.map(() => 0)
  if (Array.isArray(responses)) {
    responses.forEach((r) => {
      const dur = Number(r.duration) || 0
      for (let i = 0; i < DURATION_BUCKETS.length; i++) {
        const bucket = DURATION_BUCKETS[i]
        if (dur >= bucket.min && dur < bucket.max) {
          bucketCounts[i] += 1
          break
        }
      }
    })
  }
  const data = DURATION_BUCKETS.map((bucket, i) => ({
    label: bucket.label,
    count: bucketCounts[i],
    ratio: total > 0 ? (bucketCounts[i] / total) * 100 : 0,
  }))
  const durations = Array.isArray(responses)
    ? responses.map((r) => Number(r.duration) || 0).filter((d) => d > 0)
    : []
  durations.sort((a, b) => a - b)
  const n = durations.length
  let minDur = 0
  let maxDur = 0
  let avgDur = 0
  let medianDur = 0
  if (n > 0) {
    minDur = durations[0]
    maxDur = durations[n - 1]
    avgDur = durations.reduce((a, b) => a + b, 0) / n
    medianDur = median(durations)
  }
  return {
    total,
    data,
    statistics: {
      min: Math.round(minDur),
      max: Math.round(maxDur),
      average: Math.round(avgDur),
      median: Math.round(medianDur),
    },
  }
}

export function buildCrossAnalysisMatrix(rowQuestion, colQuestion, responses) {
  if (!rowQuestion || !colQuestion) return null
  if (rowQuestion.type !== QUESTION_TYPES.MULTIPLE || colQuestion.type !== QUESTION_TYPES.MULTIPLE) {
    return null
  }
  const rowOptions = rowQuestion.options || []
  const colOptions = colQuestion.options || []
  const total = Array.isArray(responses) ? responses.length : 0
  const matrix = []
  const rowTotals = rowOptions.map(() => 0)
  const colTotals = colOptions.map(() => 0)

  const rowId = rowQuestion.id
  const colId = colQuestion.id

  if (Array.isArray(responses) && total > 0) {
    const rowOptValues = rowOptions.map((o) => o.value)
    const colOptValues = colOptions.map((o) => o.value)

    responses.forEach((r) => {
      const rowAns = r.answers?.[rowId]
      const colAns = r.answers?.[colId]
      const rowSet = Array.isArray(rowAns) ? new Set(rowAns) : null
      const colSet = Array.isArray(colAns) ? new Set(colAns) : null

      rowOptValues.forEach((rowVal, ri) => {
        const hasRow = rowSet ? rowSet.has(rowVal) : false
        colOptValues.forEach((colVal, ci) => {
          const hasCol = colSet ? colSet.has(colVal) : false
          if (hasRow && hasCol) {
            if (!matrix[ri]) matrix[ri] = []
            if (!matrix[ri][ci]) matrix[ri][ci] = 0
            matrix[ri][ci] += 1
            rowTotals[ri] += 1
            colTotals[ci] += 1
          }
        })
      })
    })
  }

  rowOptions.forEach((_, ri) => {
    if (!matrix[ri]) matrix[ri] = []
    colOptions.forEach((_, ci) => {
      if (!matrix[ri][ci]) matrix[ri][ci] = 0
      matrix[ri][ci] = {
        count: matrix[ri][ci],
        ratio: total > 0 ? (matrix[ri][ci] / total) * 100 : 0,
      }
    })
  })

  const grandTotal = rowTotals.reduce((a, b) => a + b, 0)
  return {
    rowQuestion,
    colQuestion,
    rowLabels: rowOptions.map((o) => o.label),
    colLabels: colOptions.map((o) => o.label),
    matrix,
    rowTotals: rowTotals.map((c) => ({
      count: c,
      ratio: total > 0 ? (c / total) * 100 : 0,
    })),
    colTotals: colTotals.map((c) => ({
      count: c,
      ratio: total > 0 ? (c / total) * 100 : 0,
    })),
    grandTotal: {
      count: grandTotal,
      ratio: total > 0 ? (grandTotal / total) * 100 : 0,
    },
    totalResponses: total,
  }
}

export function paginateResponses(responses, page, pageSize = PAGE_SIZE) {
  if (!Array.isArray(responses)) {
    return { items: [], total: 0, totalPage: 1, currentPage: 1, pageSize }
  }
  const total = responses.length
  const totalPage = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: responses.slice(start, end),
    total,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function sortResponses(responses, field, order) {
  if (!Array.isArray(responses)) return []
  const sorted = [...responses]
  const dir = order === 'desc' ? -1 : 1
  sorted.sort((a, b) => {
    let va = a[field]
    let vb = b[field]
    if (va === null || va === undefined) va = 0
    if (vb === null || vb === undefined) vb = 0
    if (typeof va === 'string' && typeof vb === 'string') {
      return va.localeCompare(vb, 'zh-CN') * dir
    }
    return (va - vb) * dir
  })
  return sorted
}

export function formatAnswerForDisplay(question, answer) {
  if (question === null || question === undefined) return '-'
  if (answer === null || answer === undefined || answer === '') return '-'
  switch (question.type) {
    case QUESTION_TYPES.SINGLE: {
      const opt = (question.options || []).find((o) => o.value === answer)
      return opt ? opt.label : String(answer)
    }
    case QUESTION_TYPES.MULTIPLE: {
      if (!Array.isArray(answer)) return '-'
      const labels = answer
        .map((v) => {
          const opt = (question.options || []).find((o) => o.value === v)
          return opt ? opt.label : null
        })
        .filter(Boolean)
      return labels.length > 0 ? labels.join('、') : '-'
    }
    case QUESTION_TYPES.RATING: {
      return `${Number(answer)}星`
    }
    case QUESTION_TYPES.TEXT: {
      const str = String(answer)
      return str.length > 50 ? str.slice(0, 50) + '...' : str
    }
    default:
      return String(answer)
  }
}

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function statsToCSV(question, stats) {
  if (!question || !stats) return ''
  const lines = []
  lines.push(csvEscape(question.title))
  switch (question.type) {
    case QUESTION_TYPES.SINGLE:
    case QUESTION_TYPES.MULTIPLE: {
      lines.push('选项,人数,占比')
      stats.data.forEach((d) => {
        lines.push(
          `${csvEscape(d.label)},${d.count},${d.ratio.toFixed(2)}%`
        )
      })
      break
    }
    case QUESTION_TYPES.RATING: {
      lines.push('分值,人数,占比')
      stats.data.forEach((d) => {
        lines.push(
          `${d.rating}星,${d.count},${d.ratio.toFixed(2)}%`
        )
      })
      lines.push(`,平均分,${stats.average}`)
      lines.push(`,中位数,${stats.median}`)
      break
    }
    case QUESTION_TYPES.TEXT: {
      lines.push('高频词,出现次数')
      stats.frequentWords.forEach((w) => {
        lines.push(`${csvEscape(w.word)},${w.count}`)
      })
      break
    }
    default:
      break
  }
  return lines.join('\n')
}

export function responsesToCSV(questions, responses) {
  if (!Array.isArray(questions) || !Array.isArray(responses)) return ''
  const headers = ['答卷编号', '提交时间', '填写时长(秒)', ...questions.map((q) => q.title)]
  const rows = responses.map((r) => {
    const row = [
      r.id,
      formatDate(r.submittedAt),
      r.duration ?? '',
    ]
    questions.forEach((q) => {
      row.push(formatAnswerForRawCSV(q, r.answers?.[q.id]))
    })
    return row
  })
  const allRows = [headers, ...rows]
  return allRows.map((row) => row.map(csvEscape).join(',')).join('\n')
}

function formatAnswerForRawCSV(question, answer) {
  if (question === null || question === undefined) return ''
  if (answer === null || answer === undefined || answer === '') return ''
  switch (question.type) {
    case QUESTION_TYPES.SINGLE: {
      const opt = (question.options || []).find((o) => o.value === answer)
      return opt ? opt.label : String(answer)
    }
    case QUESTION_TYPES.MULTIPLE: {
      if (!Array.isArray(answer)) return ''
      const labels = answer
        .map((v) => {
          const opt = (question.options || []).find((o) => o.value === v)
          return opt ? opt.label : null
        })
        .filter(Boolean)
      return labels.join('、')
    }
    case QUESTION_TYPES.RATING: {
      return `${Number(answer)}星`
    }
    case QUESTION_TYPES.TEXT: {
      return String(answer)
    }
    default:
      return String(answer)
  }
}

export function downloadCSV(content, filename = 'data.csv') {
  if (typeof window === 'undefined' || !window.Blob || !window.document) return false
  try {
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}
