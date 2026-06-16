import {
  ERROR_TYPE_LIST,
  ERROR_MESSAGES,
  STACK_FILES,
  STACK_FUNCTIONS,
} from './constants.js'

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const randomChoice = (arr) => {
  return arr[randomInt(0, arr.length - 1)]
}

const generateCallStack = (depth = 6) => {
  const stack = []
  const usedFiles = new Set()

  for (let i = 0; i < depth; i++) {
    let file
    do {
      file = randomChoice(STACK_FILES)
    } while (usedFiles.has(file) && usedFiles.size < STACK_FILES.length)
    usedFiles.add(file)

    const functions = STACK_FUNCTIONS[file] || ['anonymous']
    const funcName = randomChoice(functions)
    const line = randomInt(1, 200)
    const col = randomInt(1, 80)

    stack.push({
      function: funcName,
      file,
      line,
      column: col,
    })
  }

  return stack
}

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const generateMockErrors = (count = 100, daysBack = 30) => {
  const errors = []
  const now = new Date()
  const msPerDay = 24 * 60 * 60 * 1000

  for (let i = 0; i < count; i++) {
    const type = randomChoice(ERROR_TYPE_LIST)
    const messages = ERROR_MESSAGES[type] || ['Unknown error']
    const message = randomChoice(messages)

    const randomMs = randomInt(0, daysBack * msPerDay)
    const occurredAt = new Date(now.getTime() - randomMs)
    const dateKey = formatDateKey(occurredAt)

    const occurrenceCount = randomInt(1, 50)
    const isResolved = Math.random() < 0.3

    const callStack = generateCallStack(randomInt(4, 8))

    errors.push({
      id: `err_${i + 1}_${Date.now()}`,
      type,
      message,
      occurredAt: occurredAt.getTime(),
      occurredAtFormatted: formatDateTime(occurredAt),
      dateKey,
      count: occurrenceCount,
      resolved: isResolved,
      resolvedAt: isResolved ? new Date(occurredAt.getTime() + randomInt(3600000, 86400000 * 3)).getTime() : null,
      callStack,
    })
  }

  return errors.sort((a, b) => b.occurredAt - a.occurredAt)
}

const generateDailySummaries = (errors, daysBack = 30) => {
  const summaries = {}
  const now = new Date()
  const msPerDay = 24 * 60 * 60 * 1000

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(now.getTime() - i * msPerDay)
    const dateKey = formatDateKey(date)
    summaries[dateKey] = {
      date: dateKey,
      total: 0,
      resolved: 0,
      unresolved: 0,
      newTypes: new Set(),
      errors: [],
    }
  }

  errors.forEach((err) => {
    if (summaries[err.dateKey]) {
      summaries[err.dateKey].total += err.count
      summaries[err.dateKey].errors.push(err.id)
      if (err.resolved) {
        summaries[err.dateKey].resolved += err.count
      } else {
        summaries[err.dateKey].unresolved += err.count
      }
      summaries[err.dateKey].newTypes.add(err.type)
    }
  })

  const result = Object.values(summaries)
    .map((s) => ({
      ...s,
      newTypes: s.newTypes.size,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return result
}

export {
  randomInt,
  randomChoice,
  generateCallStack,
  generateMockErrors,
  generateDailySummaries,
  formatDateKey,
  formatDateTime,
}
