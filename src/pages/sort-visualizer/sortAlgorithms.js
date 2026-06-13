import {
  OPERATION_TYPES,
  MIN_BAR_COUNT,
  MAX_BAR_COUNT,
  MIN_VALUE,
  MAX_VALUE,
  DEFAULT_BAR_COUNT,
  DEFAULT_MIN_VALUE,
  DEFAULT_MAX_VALUE,
  ALGORITHMS,
  ALGORITHM_NAMES,
} from './constants.js'

export function generateRandomArray(
  count = DEFAULT_BAR_COUNT,
  min = DEFAULT_MIN_VALUE,
  max = DEFAULT_MAX_VALUE
) {
  const n = Math.max(MIN_BAR_COUNT, Math.min(MAX_BAR_COUNT, count))
  const result = []
  for (let i = 0; i < n; i++) {
    result.push(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return result
}

export function parseCustomInput(input) {
  if (typeof input !== 'string') {
    throw new Error('输入必须是字符串')
  }
  const parts = input.split(',').map((s) => s.trim())
  const result = []
  for (const part of parts) {
    if (part === '') {
      throw new Error('存在空项')
    }
    const num = Number(part)
    if (!Number.isInteger(num)) {
      throw new Error(`"${part}" 不是有效的整数`)
    }
    result.push(num)
  }
  return result
}

export function validateCustomInput(input) {
  if (input === null || input === undefined) {
    return { valid: false, error: '输入不能为空' }
  }
  if (typeof input !== 'string') {
    return { valid: false, error: '输入必须是字符串' }
  }
  if (input.trim() === '') {
    return { valid: false, error: '输入不能为空' }
  }

  const parts = input.split(',').map((s) => s.trim())

  for (const part of parts) {
    if (part === '') {
      return { valid: false, error: '存在空项，请检查输入格式' }
    }
  }

  if (parts.length < MIN_BAR_COUNT) {
    return { valid: false, error: `至少需要 ${MIN_BAR_COUNT} 个数字，当前 ${parts.length} 个` }
  }
  if (parts.length > MAX_BAR_COUNT) {
    return { valid: false, error: `最多支持 ${MAX_BAR_COUNT} 个数字，当前 ${parts.length} 个` }
  }

  const result = []
  for (const part of parts) {
    const num = Number(part)
    if (!Number.isInteger(num)) {
      return { valid: false, error: `"${part}" 不是有效的整数` }
    }
    if (num < MIN_VALUE || num > MAX_VALUE) {
      return { valid: false, error: `数字必须在 ${MIN_VALUE}-${MAX_VALUE} 之间，当前 ${num}` }
    }
    result.push(num)
  }

  return { valid: true, data: result }
}

export function formatTime(ms) {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

export function getOperationMessage(step, algorithmName = '') {
  const { type, indices, array } = step
  switch (type) {
    case OPERATION_TYPES.COMPARE: {
      const [i, j] = indices
      return `比较 ${array[i]} 和 ${array[j]}`
    }
    case OPERATION_TYPES.SWAP: {
      const [i, j] = indices
      return `交换 ${array[j]} 和 ${array[i]}`
    }
    case OPERATION_TYPES.SORTED: {
      if (indices.length === 1) {
        return `${array[indices[0]]} 已排序到正确位置`
      }
      return `标记 ${indices.length} 个元素为已排序`
    }
    case OPERATION_TYPES.PIVOT: {
      const [i] = indices
      return `选择 Pivot: ${array[i]}`
    }
    case OPERATION_TYPES.COMPLETE: {
      return `${algorithmName} 完成！`
    }
    default:
      return ''
  }
}

export function* bubbleSort(arr) {
  const array = [...arr]
  const n = array.length
  let compareCount = 0
  let swapCount = 0

  if (n <= 1) {
    if (n === 1) {
      yield {
        type: OPERATION_TYPES.SORTED,
        indices: [0],
        array: [...array],
        compareCount,
        swapCount,
      }
    }
    yield {
      type: OPERATION_TYPES.COMPLETE,
      indices: [],
      array: [...array],
      compareCount,
      swapCount,
    }
    return
  }

  for (let i = 0; i < n - 1; i++) {
    let swapped = false
    for (let j = 0; j < n - 1 - i; j++) {
      compareCount++
      yield {
        type: OPERATION_TYPES.COMPARE,
        indices: [j, j + 1],
        array: [...array],
        compareCount,
        swapCount,
      }

      if (array[j] > array[j + 1]) {
        swapCount++
        const temp = array[j]
        array[j] = array[j + 1]
        array[j + 1] = temp
        swapped = true
        yield {
          type: OPERATION_TYPES.SWAP,
          indices: [j, j + 1],
          array: [...array],
          compareCount,
          swapCount,
        }
      }
    }

    yield {
      type: OPERATION_TYPES.SORTED,
      indices: [n - 1 - i],
      array: [...array],
      compareCount,
      swapCount,
    }

    if (!swapped) {
      const remaining = []
      for (let k = 0; k < n - 1 - i; k++) {
        remaining.push(k)
      }
      if (remaining.length > 0) {
        yield {
          type: OPERATION_TYPES.SORTED,
          indices: remaining,
          array: [...array],
          compareCount,
          swapCount,
        }
      }
      break
    }
  }

  if (n >= 2) {
    yield {
      type: OPERATION_TYPES.SORTED,
      indices: [0],
      array: [...array],
      compareCount,
      swapCount,
    }
  }

  yield {
    type: OPERATION_TYPES.COMPLETE,
    indices: [],
    array: [...array],
    compareCount,
    swapCount,
  }
}

export function* selectionSort(arr) {
  const array = [...arr]
  const n = array.length
  let compareCount = 0
  let swapCount = 0

  if (n <= 1) {
    if (n === 1) {
      yield {
        type: OPERATION_TYPES.SORTED,
        indices: [0],
        array: [...array],
        compareCount,
        swapCount,
      }
    }
    yield {
      type: OPERATION_TYPES.COMPLETE,
      indices: [],
      array: [...array],
      compareCount,
      swapCount,
    }
    return
  }

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    for (let j = i + 1; j < n; j++) {
      compareCount++
      yield {
        type: OPERATION_TYPES.COMPARE,
        indices: [minIdx, j],
        array: [...array],
        compareCount,
        swapCount,
      }
      if (array[j] < array[minIdx]) {
        minIdx = j
      }
    }

    if (minIdx !== i) {
      swapCount++
      const temp = array[i]
      array[i] = array[minIdx]
      array[minIdx] = temp
      yield {
        type: OPERATION_TYPES.SWAP,
        indices: [i, minIdx],
        array: [...array],
        compareCount,
        swapCount,
      }
    }

    yield {
      type: OPERATION_TYPES.SORTED,
      indices: [i],
      array: [...array],
      compareCount,
      swapCount,
    }
  }

  yield {
    type: OPERATION_TYPES.SORTED,
    indices: [n - 1],
    array: [...array],
    compareCount,
    swapCount,
  }

  yield {
    type: OPERATION_TYPES.COMPLETE,
    indices: [],
    array: [...array],
    compareCount,
    swapCount,
  }
}

export function* insertionSort(arr) {
  const array = [...arr]
  const n = array.length
  let compareCount = 0
  let swapCount = 0

  if (n <= 1) {
    if (n === 1) {
      yield {
        type: OPERATION_TYPES.SORTED,
        indices: [0],
        array: [...array],
        compareCount,
        swapCount,
      }
    }
    yield {
      type: OPERATION_TYPES.COMPLETE,
      indices: [],
      array: [...array],
      compareCount,
      swapCount,
    }
    return
  }

  yield {
    type: OPERATION_TYPES.SORTED,
    indices: [0],
    array: [...array],
    compareCount,
    swapCount,
  }

  for (let i = 1; i < n; i++) {
    let j = i
    while (j > 0) {
      compareCount++
      yield {
        type: OPERATION_TYPES.COMPARE,
        indices: [j - 1, j],
        array: [...array],
        compareCount,
        swapCount,
      }

      if (array[j - 1] > array[j]) {
        swapCount++
        const temp = array[j - 1]
        array[j - 1] = array[j]
        array[j] = temp
        j--
        yield {
          type: OPERATION_TYPES.SWAP,
          indices: [j, j + 1],
          array: [...array],
          compareCount,
          swapCount,
        }
      } else {
        break
      }
    }

    yield {
      type: OPERATION_TYPES.SORTED,
      indices: [i],
      array: [...array],
      compareCount,
      swapCount,
    }
  }

  const allSorted = []
  for (let i = 0; i < n; i++) allSorted.push(i)

  yield {
    type: OPERATION_TYPES.COMPLETE,
    indices: [],
    array: [...array],
    compareCount,
    swapCount,
  }
}

export function* quickSort(arr) {
  const array = [...arr]
  const n = array.length
  let compareCount = 0
  let swapCount = 0

  if (n <= 1) {
    if (n === 1) {
      yield {
        type: OPERATION_TYPES.SORTED,
        indices: [0],
        array: [...array],
        compareCount,
        swapCount,
      }
    }
    yield {
      type: OPERATION_TYPES.COMPLETE,
      indices: [],
      array: [...array],
      compareCount,
      swapCount,
    }
    return
  }

  const sortedIndices = new Set()

  function* partition(low, high) {
    const pivotIndex = high
    yield {
      type: OPERATION_TYPES.PIVOT,
      indices: [pivotIndex],
      array: [...array],
      compareCount,
      swapCount,
    }

    const pivot = array[pivotIndex]
    let i = low - 1

    for (let j = low; j < high; j++) {
      compareCount++
      yield {
        type: OPERATION_TYPES.COMPARE,
        indices: [j, pivotIndex],
        array: [...array],
        compareCount,
        swapCount,
      }

      if (array[j] <= pivot) {
        i++
        if (i !== j) {
          swapCount++
          const temp = array[i]
          array[i] = array[j]
          array[j] = temp
          yield {
            type: OPERATION_TYPES.SWAP,
            indices: [i, j],
            array: [...array],
            compareCount,
            swapCount,
          }
        }
      }
    }

    const pivotFinalIndex = i + 1
    if (pivotFinalIndex !== pivotIndex) {
      swapCount++
      const temp = array[pivotFinalIndex]
      array[pivotFinalIndex] = array[pivotIndex]
      array[pivotIndex] = temp
      yield {
        type: OPERATION_TYPES.SWAP,
        indices: [pivotFinalIndex, pivotIndex],
        array: [...array],
        compareCount,
        swapCount,
      }
    }

    sortedIndices.add(pivotFinalIndex)
    yield {
      type: OPERATION_TYPES.SORTED,
      indices: [pivotFinalIndex],
      array: [...array],
      compareCount,
      swapCount,
    }

    return pivotFinalIndex
  }

  function* quickSortHelper(low, high) {
    if (low > high) return
    if (low === high) {
      sortedIndices.add(low)
      yield {
        type: OPERATION_TYPES.SORTED,
        indices: [low],
        array: [...array],
        compareCount,
        swapCount,
      }
      return
    }

    const pi = yield* partition(low, high)
    yield* quickSortHelper(low, pi - 1)
    yield* quickSortHelper(pi + 1, high)
  }

  yield* quickSortHelper(0, n - 1)

  yield {
    type: OPERATION_TYPES.COMPLETE,
    indices: [],
    array: [...array],
    compareCount,
    swapCount,
  }
}

export function getSortGenerator(algorithm, array) {
  switch (algorithm) {
    case ALGORITHMS.BUBBLE:
      return bubbleSort(array)
    case ALGORITHMS.SELECTION:
      return selectionSort(array)
    case ALGORITHMS.INSERTION:
      return insertionSort(array)
    case ALGORITHMS.QUICK:
      return quickSort(array)
    default:
      return bubbleSort(array)
  }
}

export { ALGORITHMS, ALGORITHM_NAMES }
