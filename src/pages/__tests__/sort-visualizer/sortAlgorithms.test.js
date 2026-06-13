import { describe, it, expect, vi } from 'vitest'
import {
  generateRandomArray,
  validateCustomInput,
  parseCustomInput,
  bubbleSort,
  selectionSort,
  insertionSort,
  quickSort,
  getSortGenerator,
  formatTime,
  getOperationMessage,
} from '../../sort-visualizer/sortAlgorithms.js'
import {
  OPERATION_TYPES,
  MIN_BAR_COUNT,
  MAX_BAR_COUNT,
  MIN_VALUE,
  MAX_VALUE,
  speedToDelay,
  SPEED_CONFIG,
} from '../../sort-visualizer/constants.js'

describe('工具函数', () => {
  describe('generateRandomArray', () => {
    it('应生成指定长度的数组', () => {
      const arr = generateRandomArray(10)
      expect(arr.length).toBe(10)
    })

    it('默认应生成30个元素', () => {
      const arr = generateRandomArray()
      expect(arr.length).toBe(30)
    })

    it('所有元素应在指定范围内', () => {
      const min = 5
      const max = 20
      const arr = generateRandomArray(100, min, max)
      arr.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(min)
        expect(val).toBeLessThanOrEqual(max)
      })
    })

    it('元素应为整数', () => {
      const arr = generateRandomArray(10)
      arr.forEach((val) => {
        expect(Number.isInteger(val)).toBe(true)
      })
    })

    it('数组长度应限制在 MIN_BAR_COUNT 和 MAX_BAR_COUNT 之间', () => {
      const arr1 = generateRandomArray(1)
      expect(arr1.length).toBe(MIN_BAR_COUNT)

      const arr2 = generateRandomArray(100)
      expect(arr2.length).toBe(MAX_BAR_COUNT)
    })
  })

  describe('validateCustomInput', () => {
    it('应正确验证有效的输入', () => {
      const result = validateCustomInput('5,3,8,1,9,2')
      expect(result.valid).toBe(true)
      expect(result.data).toEqual([5, 3, 8, 1, 9, 2])
    })

    it('应处理带空格的输入', () => {
      const result = validateCustomInput(' 5 , 3 , 8, 1 ,9, 2 ')
      expect(result.valid).toBe(true)
      expect(result.data).toEqual([5, 3, 8, 1, 9, 2])
    })

    it('空输入应返回无效', () => {
      const result = validateCustomInput('')
      expect(result.valid).toBe(false)
    })

    it('null 输入应返回无效', () => {
      const result = validateCustomInput(null)
      expect(result.valid).toBe(false)
    })

    it('数字太少应返回无效', () => {
      const result = validateCustomInput('5,3')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('至少需要')
    })

    it('数字太多应返回无效', () => {
      const nums = Array.from({ length: 51 }, (_, i) => i + 1).join(',')
      const result = validateCustomInput(nums)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('最多支持')
    })

    it('非数字字符应返回无效', () => {
      const result = validateCustomInput('5,abc,8')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('不是有效的整数')
    })

    it('小数应返回无效', () => {
      const result = validateCustomInput('5,3.5,8')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('不是有效的整数')
    })

    it('数字小于最小值应返回无效', () => {
      const result = validateCustomInput(`0,3,8,1,9,2`)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('数字必须在')
    })

    it('数字大于最大值应返回无效', () => {
      const result = validateCustomInput(`5,3,1000,1,9,2`)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('数字必须在')
    })

    it('边界值应有效', () => {
      const result = validateCustomInput(`${MIN_VALUE},${MAX_VALUE},5`)
      expect(result.valid).toBe(true)
      expect(result.data).toEqual([MIN_VALUE, MAX_VALUE, 5])
    })

    it('空字符串项应被过滤', () => {
      const result = validateCustomInput('5,,3,,8')
      expect(result.valid).toBe(false)
    })
  })

  describe('parseCustomInput', () => {
    it('有效输入应返回数字数组', () => {
      const result = parseCustomInput('5,3,8,1,9,2')
      expect(result).toEqual([5, 3, 8, 1, 9, 2])
    })

    it('无效输入应抛出错误', () => {
      expect(() => parseCustomInput('5,abc,8')).toThrow()
    })
  })

  describe('formatTime', () => {
    it('小于1000ms应显示ms', () => {
      expect(formatTime(500)).toBe('500ms')
      expect(formatTime(999)).toBe('999ms')
    })

    it('大于等于1000ms应转换为秒', () => {
      expect(formatTime(1000)).toBe('1.00s')
      expect(formatTime(1500)).toBe('1.50s')
      expect(formatTime(2345)).toBe('2.35s')
    })
  })

  describe('speedToDelay', () => {
    it('速度1对应最大延迟', () => {
      expect(speedToDelay(1)).toBe(SPEED_CONFIG.MAX_DELAY)
    })

    it('速度10对应最小延迟', () => {
      expect(speedToDelay(10)).toBe(SPEED_CONFIG.MIN_DELAY)
    })

    it('速度5应对应默认延迟', () => {
      expect(speedToDelay(5)).toBe(SPEED_CONFIG.DEFAULT_DELAY)
    })

    it('应处理超出范围的值', () => {
      expect(speedToDelay(0)).toBe(SPEED_CONFIG.MAX_DELAY)
      expect(speedToDelay(11)).toBe(SPEED_CONFIG.MIN_DELAY)
    })

    it('速度与延迟应线性相关', () => {
      const delay5 = speedToDelay(5)
      const delay7 = speedToDelay(7)
      const delay9 = speedToDelay(9)
      expect(delay5).toBeGreaterThan(delay7)
      expect(delay7).toBeGreaterThan(delay9)
    })
  })

  describe('getOperationMessage', () => {
    const baseStep = {
      indices: [0, 1],
      array: [5, 3, 8],
      compareCount: 1,
      swapCount: 0,
    }

    it('应返回比较操作的消息', () => {
      const step = { ...baseStep, type: OPERATION_TYPES.COMPARE }
      const msg = getOperationMessage(step, '冒泡排序')
      expect(msg).toContain('比较')
      expect(msg).toContain('5')
      expect(msg).toContain('3')
    })

    it('应返回交换操作的消息', () => {
      const step = { ...baseStep, type: OPERATION_TYPES.SWAP }
      const msg = getOperationMessage(step, '冒泡排序')
      expect(msg).toContain('交换')
      expect(msg).toContain('5')
      expect(msg).toContain('3')
    })

    it('应返回已排序操作的消息', () => {
      const step = { ...baseStep, type: OPERATION_TYPES.SORTED, indices: [0] }
      const msg = getOperationMessage(step, '冒泡排序')
      expect(msg).toContain('已排序')
      expect(msg).toContain('5')
    })

    it('应返回Pivot操作的消息', () => {
      const step = { ...baseStep, type: OPERATION_TYPES.PIVOT, indices: [2] }
      const msg = getOperationMessage(step, '快速排序')
      expect(msg).toContain('Pivot')
      expect(msg).toContain('8')
    })

    it('应返回完成操作的消息', () => {
      const step = { ...baseStep, type: OPERATION_TYPES.COMPLETE, indices: [] }
      const msg = getOperationMessage(step, '冒泡排序')
      expect(msg).toContain('冒泡排序')
      expect(msg).toContain('完成')
    })
  })

  describe('getSortGenerator', () => {
    it('应返回冒泡排序生成器', () => {
      const gen = getSortGenerator('bubble', [3, 1, 2])
      expect(gen.next).toBeDefined()
      const step = gen.next()
      expect(step.value.type).toBe(OPERATION_TYPES.COMPARE)
    })

    it('应返回选择排序生成器', () => {
      const gen = getSortGenerator('selection', [3, 1, 2])
      expect(gen.next).toBeDefined()
    })

    it('应返回插入排序生成器', () => {
      const gen = getSortGenerator('insertion', [3, 1, 2])
      expect(gen.next).toBeDefined()
    })

    it('应返回快速排序生成器', () => {
      const gen = getSortGenerator('quick', [3, 1, 2])
      expect(gen.next).toBeDefined()
    })

    it('未知算法应默认返回冒泡排序', () => {
      const gen = getSortGenerator('unknown', [3, 1, 2])
      expect(gen.next).toBeDefined()
    })
  })
})

describe('排序算法', () => {
  const isSorted = (arr) => {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] > arr[i + 1]) return false
    }
    return true
  }

  const runSort = (generator) => {
    let lastStep
    let step
    while (!(step = generator.next()).done) {
      lastStep = step.value
    }
    return lastStep
  }

  describe('冒泡排序', () => {
    it('应对数组进行正确排序', () => {
      const input = [64, 34, 25, 12, 22, 11, 90]
      const gen = bubbleSort([...input])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual([11, 12, 22, 25, 34, 64, 90])
      expect(isSorted(finalStep.array)).toBe(true)
    })

    it('应对空数组处理', () => {
      const gen = bubbleSort([])
      const step = gen.next()
      expect(step.value.type).toBe(OPERATION_TYPES.COMPLETE)
      expect(step.value.array).toEqual([])
    })

    it('应对单元素数组处理', () => {
      const gen = bubbleSort([5])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual([5])
    })

    it('应对已排序数组进行优化', () => {
      const gen = bubbleSort([1, 2, 3, 4, 5])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual([1, 2, 3, 4, 5])
    })

    it('应统计正确的比较和交换次数', () => {
      const gen = bubbleSort([3, 2, 1])
      const finalStep = runSort(gen)
      expect(finalStep.compareCount).toBeGreaterThan(0)
      expect(finalStep.swapCount).toBeGreaterThan(0)
    })

    it('应产生 COMPARE 步骤', () => {
      const gen = bubbleSort([3, 1, 2])
      const step = gen.next()
      expect(step.value.type).toBe(OPERATION_TYPES.COMPARE)
      expect(step.value.indices).toHaveLength(2)
    })

    it('应产生 SWAP 步骤当需要交换时', () => {
      const gen = bubbleSort([3, 1, 2])
      gen.next()
      const step = gen.next()
      expect(step.value.type).toBe(OPERATION_TYPES.SWAP)
    })

    it('应产生 SORTED 步骤', () => {
      const gen = bubbleSort([3, 1, 2])
      let foundSorted = false
      let step
      while (!(step = gen.next()).done) {
        if (step.value.type === OPERATION_TYPES.SORTED) {
          foundSorted = true
          break
        }
      }
      expect(foundSorted).toBe(true)
    })

    it('最后一步应为 COMPLETE', () => {
      const gen = bubbleSort([3, 1, 2])
      const steps = []
      let step
      while (!(step = gen.next()).done) {
        steps.push(step.value)
      }
      expect(steps[steps.length - 1].type).toBe(OPERATION_TYPES.COMPLETE)
    })
  })

  describe('选择排序', () => {
    it('应对数组进行正确排序', () => {
      const input = [64, 34, 25, 12, 22, 11, 90]
      const gen = selectionSort([...input])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual([11, 12, 22, 25, 34, 64, 90])
      expect(isSorted(finalStep.array)).toBe(true)
    })

    it('应对空数组处理', () => {
      const gen = selectionSort([])
      const step = gen.next()
      expect(step.value.type).toBe(OPERATION_TYPES.COMPLETE)
    })

    it('应对单元素数组处理', () => {
      const gen = selectionSort([5])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual([5])
    })

    it('应统计正确的比较和交换次数', () => {
      const gen = selectionSort([3, 2, 1])
      const finalStep = runSort(gen)
      expect(finalStep.compareCount).toBe(3)
      expect(finalStep.swapCount).toBe(1)
    })

    it('交换次数应少于冒泡排序', () => {
      const input = [5, 4, 3, 2, 1]
      const bubbleGen = bubbleSort([...input])
      const selectionGen = selectionSort([...input])
      const bubbleFinal = runSort(bubbleGen)
      const selectionFinal = runSort(selectionGen)
      expect(selectionFinal.swapCount).toBeLessThan(bubbleFinal.swapCount)
    })
  })

  describe('插入排序', () => {
    it('应对数组进行正确排序', () => {
      const input = [64, 34, 25, 12, 22, 11, 90]
      const gen = insertionSort([...input])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual([11, 12, 22, 25, 34, 64, 90])
      expect(isSorted(finalStep.array)).toBe(true)
    })

    it('应对空数组处理', () => {
      const gen = insertionSort([])
      const step = gen.next()
      expect(step.value.type).toBe(OPERATION_TYPES.COMPLETE)
    })

    it('应对单元素数组处理', () => {
      const gen = insertionSort([5])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual([5])
    })

    it('第一个元素应立即标记为已排序', () => {
      const gen = insertionSort([3, 1, 2])
      const firstStep = gen.next()
      expect(firstStep.value.type).toBe(OPERATION_TYPES.SORTED)
      expect(firstStep.value.indices).toEqual([0])
    })

    it('对已排序数组应只需要比较', () => {
      const gen = insertionSort([1, 2, 3, 4, 5])
      const finalStep = runSort(gen)
      expect(finalStep.swapCount).toBe(0)
      expect(finalStep.compareCount).toBe(4)
    })
  })

  describe('快速排序', () => {
    it('应对数组进行正确排序', () => {
      const input = [64, 34, 25, 12, 22, 11, 90]
      const gen = quickSort([...input])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual([11, 12, 22, 25, 34, 64, 90])
      expect(isSorted(finalStep.array)).toBe(true)
    })

    it('应对空数组处理', () => {
      const gen = quickSort([])
      const step = gen.next()
      expect(step.value.type).toBe(OPERATION_TYPES.COMPLETE)
    })

    it('应对单元素数组处理', () => {
      const gen = quickSort([5])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual([5])
    })

    it('应产生 PIVOT 步骤', () => {
      const gen = quickSort([3, 1, 2])
      let foundPivot = false
      let step
      while (!(step = gen.next()).done) {
        if (step.value.type === OPERATION_TYPES.PIVOT) {
          foundPivot = true
          break
        }
      }
      expect(foundPivot).toBe(true)
    })

    it('随机数组排序结果应正确', () => {
      const input = generateRandomArray(20)
      const expected = [...input].sort((a, b) => a - b)
      const gen = quickSort([...input])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual(expected)
    })

    it('对已排序数组应正确处理', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const gen = quickSort([...input])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual(input)
      expect(isSorted(finalStep.array)).toBe(true)
    })

    it('对逆序数组应正确处理', () => {
      const input = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
      const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const gen = quickSort([...input])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual(expected)
    })

    it('对重复元素数组应正确处理', () => {
      const input = [5, 3, 5, 1, 5, 2, 5, 4]
      const expected = [...input].sort((a, b) => a - b)
      const gen = quickSort([...input])
      const finalStep = runSort(gen)
      expect(finalStep.array).toEqual(expected)
    })
  })

  describe('所有排序算法对比', () => {
    it('所有算法应对同一数组产生相同的排序结果', () => {
      const input = [64, 34, 25, 12, 22, 11, 90, 45, 33, 77]
      const expected = [...input].sort((a, b) => a - b)

      const bubbleResult = runSort(bubbleSort([...input])).array
      const selectionResult = runSort(selectionSort([...input])).array
      const insertionResult = runSort(insertionSort([...input])).array
      const quickResult = runSort(quickSort([...input])).array

      expect(bubbleResult).toEqual(expected)
      expect(selectionResult).toEqual(expected)
      expect(insertionResult).toEqual(expected)
      expect(quickResult).toEqual(expected)
    })

    it('所有算法最终都应产生 COMPLETE 步骤', () => {
      const input = [3, 1, 2]
      const algorithms = [bubbleSort, selectionSort, insertionSort, quickSort]

      algorithms.forEach((algo) => {
        const gen = algo([...input])
        const steps = []
        let step
        while (!(step = gen.next()).done) {
          steps.push(step.value)
        }
        expect(steps[steps.length - 1].type).toBe(OPERATION_TYPES.COMPLETE)
      })
    })
  })
})

describe('步骤结构验证', () => {
  it('每个步骤应包含必要的字段', () => {
    const gen = bubbleSort([3, 1, 2])
    const step = gen.next().value

    expect(step).toHaveProperty('type')
    expect(step).toHaveProperty('indices')
    expect(step).toHaveProperty('array')
    expect(step).toHaveProperty('compareCount')
    expect(step).toHaveProperty('swapCount')

    expect(Array.isArray(step.indices)).toBe(true)
    expect(Array.isArray(step.array)).toBe(true)
    expect(typeof step.compareCount).toBe('number')
    expect(typeof step.swapCount).toBe('number')
  })

  it('比较和交换计数应单调递增', () => {
    const gen = quickSort([5, 2, 8, 1, 9, 3, 7, 4, 6])
    let prevCompare = -1
    let prevSwap = -1
    let step

    while (!(step = gen.next()).done) {
      expect(step.value.compareCount).toBeGreaterThanOrEqual(prevCompare)
      expect(step.value.swapCount).toBeGreaterThanOrEqual(prevSwap)
      prevCompare = step.value.compareCount
      prevSwap = step.value.swapCount
    }
  })

  it('每一步的数组长度应保持不变', () => {
    const input = [5, 2, 8, 1, 9]
    const gen = quickSort([...input])
    let step

    while (!(step = gen.next()).done) {
      expect(step.value.array.length).toBe(input.length)
    }
  })
})
