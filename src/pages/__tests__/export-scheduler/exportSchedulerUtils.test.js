import {
  calculateNextExecutionTime,
  taskStatusTransition,
  retryStateMachine,
  shouldTriggerExecution,
  shouldSimulateFailure,
  generateExportData,
  formatToCSV,
  formatToJSON,
  formatExportContent,
  buildFileName,
  estimateFileSize,
  formatFileSize,
  formatDateTime,
  getFrequencyDescription,
  getStatusLabel,
  getRecordStatusLabel,
  createTask,
  validateTaskForm,
  paginateRecords,
  filterRecordsByTaskName,
  sortRecordsByTime,
  generateId,
  selectRandomFailureReason,
} from '@/pages/export-scheduler/utils.js'
import {
  TASK_STATUS_RUNNING,
  TASK_STATUS_PAUSED,
  TASK_STATUS_COMPLETED,
  RECORD_STATUS_SUCCESS,
  RECORD_STATUS_FAILED,
  RECORD_STATUS_EXECUTING,
  RECORD_STATUS_RETRYING,
  FREQUENCY_ONCE,
  FREQUENCY_DAILY,
  FREQUENCY_WEEKLY,
  FREQUENCY_MONTHLY,
  MAX_RETRY_COUNT,
  FAILURE_REASONS,
  DATA_SOURCE_FIELDS,
} from '@/pages/export-scheduler/constants.js'
import { describe, expect, it } from 'vitest'

describe('exportScheduler utils', () => {
  describe('generateId', () => {
    it('should generate non-empty unique ids', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique ids across calls', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) ids.add(generateId())
      expect(ids.size).toBe(100)
    })
  })

  describe('calculateNextExecutionTime', () => {
    it('should calculate next daily execution after current time', () => {
      const now = new Date(2025, 0, 15, 10, 0, 0)
      const result = calculateNextExecutionTime(FREQUENCY_DAILY, '14:00', [], 1, now)
      const next = new Date(result)
      expect(next.getDate()).toBe(15)
      expect(next.getHours()).toBe(14)
      expect(next.getMinutes()).toBe(0)
    })

    it('should advance to next day if time already passed', () => {
      const now = new Date(2025, 0, 15, 16, 0, 0)
      const result = calculateNextExecutionTime(FREQUENCY_DAILY, '08:00', [], 1, now)
      const next = new Date(result)
      expect(next.getDate()).toBe(16)
      expect(next.getHours()).toBe(8)
    })

    it('should calculate next weekly execution', () => {
      const now = new Date(2025, 0, 13, 10, 0, 0)
      const result = calculateNextExecutionTime(FREQUENCY_WEEKLY, '14:00', [1, 3, 5], 1, now)
      expect(result).toBeTruthy()
      const next = new Date(result)
      expect([1, 3, 5]).toContain(next.getDay())
    })

    it('should use same day for weekly if time not yet passed', () => {
      const monday = new Date(2025, 0, 13, 8, 0, 0)
      const result = calculateNextExecutionTime(FREQUENCY_WEEKLY, '14:00', [1], 1, monday)
      const next = new Date(result)
      expect(next.getDay()).toBe(1)
      expect(next.getDate()).toBe(13)
    })

    it('should return null for weekly with no days selected', () => {
      const now = new Date(2025, 0, 15, 10, 0, 0)
      const result = calculateNextExecutionTime(FREQUENCY_WEEKLY, '14:00', [], 1, now)
      expect(result).toBeNull()
    })

    it('should calculate next monthly execution', () => {
      const now = new Date(2025, 0, 15, 10, 0, 0)
      const result = calculateNextExecutionTime(FREQUENCY_MONTHLY, '14:00', [], 10, now)
      const next = new Date(result)
      expect(next.getDate()).toBe(10)
      expect(next.getMonth()).toBe(1)
    })

    it('should use current month for monthly if day not yet passed', () => {
      const now = new Date(2025, 0, 5, 10, 0, 0)
      const result = calculateNextExecutionTime(FREQUENCY_MONTHLY, '14:00', [], 10, now)
      const next = new Date(result)
      expect(next.getDate()).toBe(10)
      expect(next.getMonth()).toBe(0)
    })

    it('should calculate once frequency as next day if time passed', () => {
      const now = new Date(2025, 0, 15, 16, 0, 0)
      const result = calculateNextExecutionTime(FREQUENCY_ONCE, '08:00', [], 1, now)
      const next = new Date(result)
      expect(next.getDate()).toBe(16)
      expect(next.getHours()).toBe(8)
    })

    it('should clamp monthDay to 1-28', () => {
      const now = new Date(2025, 0, 15, 10, 0, 0)
      const result = calculateNextExecutionTime(FREQUENCY_MONTHLY, '14:00', [], 0, now)
      const next = new Date(result)
      expect(next.getDate()).toBe(1)
    })
  })

  describe('taskStatusTransition', () => {
    it('should transition running -> paused on pause', () => {
      expect(taskStatusTransition(TASK_STATUS_RUNNING, 'pause')).toBe(TASK_STATUS_PAUSED)
    })

    it('should transition paused -> running on resume', () => {
      expect(taskStatusTransition(TASK_STATUS_PAUSED, 'resume')).toBe(TASK_STATUS_RUNNING)
    })

    it('should transition running -> completed on complete', () => {
      expect(taskStatusTransition(TASK_STATUS_RUNNING, 'complete')).toBe(TASK_STATUS_COMPLETED)
    })

    it('should transition running -> paused on retry_exhausted', () => {
      expect(taskStatusTransition(TASK_STATUS_RUNNING, 'retry_exhausted')).toBe(TASK_STATUS_PAUSED)
    })

    it('should transition paused -> running on manual_resume', () => {
      expect(taskStatusTransition(TASK_STATUS_PAUSED, 'manual_resume')).toBe(TASK_STATUS_RUNNING)
    })

    it('should not change on invalid transitions', () => {
      expect(taskStatusTransition(TASK_STATUS_PAUSED, 'pause')).toBe(TASK_STATUS_PAUSED)
      expect(taskStatusTransition(TASK_STATUS_COMPLETED, 'pause')).toBe(TASK_STATUS_COMPLETED)
      expect(taskStatusTransition(TASK_STATUS_RUNNING, 'resume')).toBe(TASK_STATUS_RUNNING)
    })

    it('should return same status for unknown action', () => {
      expect(taskStatusTransition(TASK_STATUS_RUNNING, 'unknown')).toBe(TASK_STATUS_RUNNING)
    })
  })

  describe('retryStateMachine', () => {
    it('should initialize to default state', () => {
      const result = retryStateMachine(null, 'execute')
      expect(result).toEqual({ retryCount: 0, isRetrying: false, failed: false })
    })

    it('should set isRetrying on fail', () => {
      const state = { retryCount: 0, isRetrying: false, failed: false }
      const result = retryStateMachine(state, 'fail')
      expect(result.isRetrying).toBe(true)
      expect(result.failed).toBe(false)
    })

    it('should increment retryCount on retry', () => {
      const state = { retryCount: 0, isRetrying: true, failed: false }
      const result = retryStateMachine(state, 'retry')
      expect(result.retryCount).toBe(1)
      expect(result.isRetrying).toBe(true)
    })

    it('should mark failed after max retries exhausted', () => {
      const state = { retryCount: MAX_RETRY_COUNT, isRetrying: false, failed: false }
      const result = retryStateMachine(state, 'fail')
      expect(result.failed).toBe(true)
      expect(result.isRetrying).toBe(false)
    })

    it('should handle retry_fail correctly at boundary', () => {
      const state = { retryCount: MAX_RETRY_COUNT - 1, isRetrying: true, failed: false }
      const result = retryStateMachine(state, 'retry_fail')
      expect(result.retryCount).toBe(MAX_RETRY_COUNT)
      expect(result.failed).toBe(true)
    })

    it('should continue retrying before max', () => {
      const state = { retryCount: 1, isRetrying: true, failed: false }
      const result = retryStateMachine(state, 'retry_fail')
      expect(result.retryCount).toBe(2)
      expect(result.isRetrying).toBe(true)
      expect(result.failed).toBe(false)
    })

    it('should reset on retry_success', () => {
      const state = { retryCount: 2, isRetrying: true, failed: false }
      const result = retryStateMachine(state, 'retry_success')
      expect(result).toEqual({ retryCount: 0, isRetrying: false, failed: false })
    })

    it('should reset on reset action', () => {
      const state = { retryCount: 3, isRetrying: false, failed: true }
      const result = retryStateMachine(state, 'reset')
      expect(result).toEqual({ retryCount: 0, isRetrying: false, failed: false })
    })

    it('should handle full retry lifecycle', () => {
      let state = retryStateMachine(null, 'execute')
      expect(state).toEqual({ retryCount: 0, isRetrying: false, failed: false })

      state = retryStateMachine(state, 'fail')
      expect(state.isRetrying).toBe(true)

      state = retryStateMachine(state, 'retry')
      expect(state.retryCount).toBe(1)

      state = retryStateMachine(state, 'retry_fail')
      expect(state.retryCount).toBe(2)
      expect(state.isRetrying).toBe(true)

      state = retryStateMachine(state, 'retry_fail')
      expect(state.retryCount).toBe(3)
      expect(state.failed).toBe(true)
      expect(state.isRetrying).toBe(false)
    })

    it('should not retry if not in retrying state', () => {
      const state = { retryCount: 0, isRetrying: false, failed: false }
      const result = retryStateMachine(state, 'retry')
      expect(result.retryCount).toBe(0)
    })
  })

  describe('shouldTriggerExecution', () => {
    it('should trigger for running task past execution time', () => {
      const task = {
        status: TASK_STATUS_RUNNING,
        nextExecutionTime: Date.now() - 1000,
        retryState: { retryCount: 0, isRetrying: false, failed: false },
      }
      expect(shouldTriggerExecution(task, Date.now())).toBe(true)
    })

    it('should not trigger for paused task', () => {
      const task = {
        status: TASK_STATUS_PAUSED,
        nextExecutionTime: Date.now() - 1000,
        retryState: { retryCount: 0, isRetrying: false, failed: false },
      }
      expect(shouldTriggerExecution(task, Date.now())).toBe(false)
    })

    it('should not trigger for future execution time', () => {
      const task = {
        status: TASK_STATUS_RUNNING,
        nextExecutionTime: Date.now() + 60000,
        retryState: { retryCount: 0, isRetrying: false, failed: false },
      }
      expect(shouldTriggerExecution(task, Date.now())).toBe(false)
    })

    it('should not trigger if retrying', () => {
      const task = {
        status: TASK_STATUS_RUNNING,
        nextExecutionTime: Date.now() - 1000,
        retryState: { retryCount: 1, isRetrying: true, failed: false },
      }
      expect(shouldTriggerExecution(task, Date.now())).toBe(false)
    })

    it('should not trigger if no nextExecutionTime', () => {
      const task = {
        status: TASK_STATUS_RUNNING,
        nextExecutionTime: null,
        retryState: { retryCount: 0, isRetrying: false, failed: false },
      }
      expect(shouldTriggerExecution(task, Date.now())).toBe(false)
    })
  })

  describe('generateExportData', () => {
    it('should generate rows with correct fields', () => {
      const fields = ['orderNo', 'amount']
      const result = generateExportData('orders', fields)
      expect(result.rows.length).toBeGreaterThanOrEqual(50)
      expect(result.rows.length).toBeLessThanOrEqual(500)
      expect(result.count).toBe(result.rows.length)
      result.rows.forEach((row) => {
        expect(row).toHaveProperty('orderNo')
        expect(row).toHaveProperty('amount')
      })
    })

    it('should generate data for all data sources', () => {
      Object.keys(DATA_SOURCE_FIELDS).forEach((ds) => {
        const fields = DATA_SOURCE_FIELDS[ds].map((f) => f.id)
        const result = generateExportData(ds, fields)
        expect(result.rows.length).toBeGreaterThan(0)
      })
    })
  })

  describe('formatToCSV', () => {
    it('should format with headers and rows', () => {
      const data = {
        dataSource: 'orders',
        rows: [
          { orderNo: 'ORD-001', amount: '100.00' },
          { orderNo: 'ORD-002', amount: '200.00' },
        ],
      }
      const result = formatToCSV(data, ['orderNo', 'amount'])
      const lines = result.split('\n')
      expect(lines.length).toBe(3)
      expect(lines[0]).toContain('订单号')
      expect(lines[0]).toContain('金额')
    })

    it('should escape commas and quotes', () => {
      const data = {
        dataSource: 'orders',
        rows: [
          { orderNo: 'ORD,1', amount: '100' },
        ],
      }
      const result = formatToCSV(data, ['orderNo', 'amount'])
      expect(result).toContain('"ORD,1"')
    })
  })

  describe('formatToJSON', () => {
    it('should format as JSON array', () => {
      const data = {
        rows: [
          { orderNo: 'ORD-001', amount: '100.00' },
        ],
      }
      const result = formatToJSON(data, ['orderNo', 'amount'])
      const parsed = JSON.parse(result)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBe(1)
      expect(parsed[0].orderNo).toBe('ORD-001')
    })
  })

  describe('formatExportContent', () => {
    it('should format CSV for csv format', () => {
      const data = { dataSource: 'orders', rows: [{ orderNo: 'X', amount: '1' }] }
      const result = formatExportContent(data, 'csv', ['orderNo', 'amount'])
      expect(result).toContain('订单号')
    })

    it('should format JSON for json format', () => {
      const data = { dataSource: 'orders', rows: [{ orderNo: 'X', amount: '1' }] }
      const result = formatExportContent(data, 'json', ['orderNo', 'amount'])
      const parsed = JSON.parse(result)
      expect(Array.isArray(parsed)).toBe(true)
    })

    it('should format CSV for excel format', () => {
      const data = { dataSource: 'orders', rows: [{ orderNo: 'X', amount: '1' }] }
      const result = formatExportContent(data, 'excel', ['orderNo', 'amount'])
      expect(result).toContain('订单号')
    })
  })

  describe('buildFileName', () => {
    it('should build file name with correct format', () => {
      const name = buildFileName('orders', '测试任务', 'csv')
      expect(name).toContain('订单数据')
      expect(name).toContain('测试任务')
      expect(name).toMatch(/\.csv$/)
    })

    it('should use .xlsx extension for excel', () => {
      const name = buildFileName('orders', 'test', 'excel')
      expect(name).toMatch(/\.xlsx$/)
    })

    it('should use .json extension for json', () => {
      const name = buildFileName('orders', 'test', 'json')
      expect(name).toMatch(/\.json$/)
    })

    it('should sanitize special characters', () => {
      const name = buildFileName('orders', 'test/file:name', 'csv')
      expect(name).not.toContain('/')
      expect(name).not.toContain(':')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1572864)).toBe('1.50 MB')
    })
  })

  describe('formatDateTime', () => {
    it('should format timestamp to readable string', () => {
      const ts = new Date(2025, 0, 15, 14, 30, 45).getTime()
      const result = formatDateTime(ts)
      expect(result).toBe('2025-01-15 14:30:45')
    })

    it('should handle empty input', () => {
      expect(formatDateTime(null)).toBe('')
      expect(formatDateTime(undefined)).toBe('')
    })
  })

  describe('getFrequencyDescription', () => {
    it('should describe once frequency', () => {
      const task = { frequency: FREQUENCY_ONCE, executionTime: '08:00' }
      expect(getFrequencyDescription(task)).toBe('一次性 08:00')
    })

    it('should describe daily frequency', () => {
      const task = { frequency: FREQUENCY_DAILY, executionTime: '14:00' }
      expect(getFrequencyDescription(task)).toBe('每天 14:00')
    })

    it('should describe weekly frequency', () => {
      const task = { frequency: FREQUENCY_WEEKLY, executionTime: '09:00', weekDays: [1, 3] }
      const desc = getFrequencyDescription(task)
      expect(desc).toContain('每周')
      expect(desc).toContain('周一')
      expect(desc).toContain('周三')
    })

    it('should describe monthly frequency', () => {
      const task = { frequency: FREQUENCY_MONTHLY, executionTime: '10:00', monthDay: 15 }
      expect(getFrequencyDescription(task)).toBe('每月 15 日 10:00')
    })
  })

  describe('getStatusLabel', () => {
    it('should return correct labels', () => {
      expect(getStatusLabel(TASK_STATUS_RUNNING)).toBe('运行中')
      expect(getStatusLabel(TASK_STATUS_PAUSED)).toBe('已暂停')
      expect(getStatusLabel(TASK_STATUS_COMPLETED)).toBe('已完成')
    })
  })

  describe('getRecordStatusLabel', () => {
    it('should return correct labels', () => {
      expect(getRecordStatusLabel(RECORD_STATUS_SUCCESS)).toBe('成功')
      expect(getRecordStatusLabel(RECORD_STATUS_FAILED)).toBe('失败')
      expect(getRecordStatusLabel(RECORD_STATUS_EXECUTING)).toBe('执行中')
      expect(getRecordStatusLabel(RECORD_STATUS_RETRYING)).toBe('重试中')
    })
  })

  describe('createTask', () => {
    it('should create a task with running status', () => {
      const task = createTask({
        name: '测试任务',
        dataSource: 'orders',
        fields: ['orderNo', 'amount'],
        format: 'csv',
        frequency: FREQUENCY_DAILY,
        executionTime: '08:00',
      })
      expect(task.name).toBe('测试任务')
      expect(task.status).toBe(TASK_STATUS_RUNNING)
      expect(task.dataSource).toBe('orders')
      expect(task.fields).toEqual(['orderNo', 'amount'])
      expect(task.nextExecutionTime).toBeTruthy()
      expect(task.retryState).toEqual({ retryCount: 0, isRetrying: false, failed: false })
    })

    it('should calculate nextExecutionTime', () => {
      const task = createTask({
        name: 'Daily task',
        dataSource: 'orders',
        fields: ['orderNo'],
        format: 'csv',
        frequency: FREQUENCY_DAILY,
        executionTime: '23:59',
      })
      expect(task.nextExecutionTime).toBeGreaterThan(0)
    })
  })

  describe('validateTaskForm', () => {
    it('should validate required fields', () => {
      const result = validateTaskForm({})
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBeTruthy()
      expect(result.errors.dataSource).toBeTruthy()
      expect(result.errors.fields).toBeTruthy()
      expect(result.errors.format).toBeTruthy()
      expect(result.errors.frequency).toBeTruthy()
      expect(result.errors.executionTime).toBeTruthy()
    })

    it('should validate name length', () => {
      const result = validateTaskForm({ name: 'a'.repeat(51), dataSource: 'orders', fields: ['orderNo'], format: 'csv', frequency: 'daily', executionTime: '08:00' })
      expect(result.errors.name).toBeTruthy()
    })

    it('should validate weekly needs weekDays', () => {
      const result = validateTaskForm({
        name: 'test', dataSource: 'orders', fields: ['orderNo'], format: 'csv',
        frequency: FREQUENCY_WEEKLY, executionTime: '08:00', weekDays: [],
      })
      expect(result.errors.weekDays).toBeTruthy()
    })

    it('should validate monthly needs monthDay 1-28', () => {
      const result = validateTaskForm({
        name: 'test', dataSource: 'orders', fields: ['orderNo'], format: 'csv',
        frequency: FREQUENCY_MONTHLY, executionTime: '08:00', monthDay: 0,
      })
      expect(result.errors.monthDay).toBeTruthy()
    })

    it('should pass for valid form', () => {
      const result = validateTaskForm({
        name: 'test', dataSource: 'orders', fields: ['orderNo'], format: 'csv',
        frequency: FREQUENCY_DAILY, executionTime: '08:00',
      })
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })
  })

  describe('paginateRecords', () => {
    const records = Array.from({ length: 50 }, (_, i) => ({ id: i }))

    it('should return first page', () => {
      const result = paginateRecords(records, 1, 20)
      expect(result.length).toBe(20)
      expect(result[0].id).toBe(0)
    })

    it('should return partial last page', () => {
      const result = paginateRecords(records, 3, 20)
      expect(result.length).toBe(10)
    })

    it('should return empty for page beyond data', () => {
      const result = paginateRecords(records, 4, 20)
      expect(result.length).toBe(0)
    })
  })

  describe('filterRecordsByTaskName', () => {
    const records = [
      { id: 1, taskName: '每日订单导出' },
      { id: 2, taskName: '每周用户导出' },
      { id: 3, taskName: '订单月报' },
    ]

    it('should return all records if no filter', () => {
      expect(filterRecordsByTaskName(records, '').length).toBe(3)
    })

    it('should filter by partial name match', () => {
      expect(filterRecordsByTaskName(records, '订单').length).toBe(2)
    })

    it('should return empty for no match', () => {
      expect(filterRecordsByTaskName(records, '不存在').length).toBe(0)
    })
  })

  describe('sortRecordsByTime', () => {
    it('should sort in descending order', () => {
      const records = [
        { id: 1, executedAt: 1000 },
        { id: 2, executedAt: 3000 },
        { id: 3, executedAt: 2000 },
      ]
      const sorted = sortRecordsByTime(records)
      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(3)
      expect(sorted[2].id).toBe(1)
    })

    it('should not mutate original', () => {
      const records = [
        { id: 1, executedAt: 1000 },
        { id: 2, executedAt: 3000 },
      ]
      const sorted = sortRecordsByTime(records)
      expect(records[0].id).toBe(1)
      expect(sorted[0].id).toBe(2)
    })
  })

  describe('selectRandomFailureReason', () => {
    it('should return a valid failure reason', () => {
      const reason = selectRandomFailureReason()
      expect(FAILURE_REASONS).toContain(reason)
    })
  })

  describe('shouldSimulateFailure', () => {
    it('should return false when probability is 0', () => {
      expect(shouldSimulateFailure(0)).toBe(false)
    })

    it('should return true when probability is 1', () => {
      expect(shouldSimulateFailure(1)).toBe(true)
    })
  })

  describe('estimateFileSize', () => {
    it('should estimate file size from string content', () => {
      const content = 'hello world'
      const size = estimateFileSize(content)
      expect(size).toBe(11)
    })
  })
})
