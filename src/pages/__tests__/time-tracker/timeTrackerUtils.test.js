import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  formatTimerDisplay,
  formatDate,
  formatTimeHHMM,
  getDateKey,
  getProjectLabel,
  getProjectColor,
  calculateDurationMs,
  msToHours,
  msToFormattedHours,
  calculateDurationHours,
  validateManualEntry,
  createRecord,
  createTimerRecord,
  createTimerRecordWithPause,
  updateRecord,
  deleteRecord,
  loadRecords,
  saveRecords,
  loadBudgets,
  saveBudgets,
  loadTimerState,
  saveTimerState,
  clearTimerState,
  getDateRange,
  filterRecordsByDateRange,
  filterRecordsByProject,
  groupRecordsByDate,
  groupRecordsByProject,
  calculateProjectSubtotals,
  calculateProjectHours,
  buildBarChartData,
  getBudgetProgress,
  setBudget,
  recordToFormData,
  generateCSV,
  getCSVFilename,
} from '@/pages/time-tracker/utils.js'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

function makeRecord(overrides = {}) {
  const start = new Date('2026-06-15T09:00:00')
  const end = new Date('2026-06-15T17:00:00')
  return {
    id: generateId(),
    project: 'frontend',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMs: end.getTime() - start.getTime(),
    note: '',
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('timeTrackerUtils', () => {
  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should start with tt_ prefix', () => {
      expect(generateId().startsWith('tt_')).toBe(true)
    })
  })

  describe('formatTimerDisplay', () => {
    it('should format 0 seconds as 00:00:00', () => {
      expect(formatTimerDisplay(0)).toBe('00:00:00')
    })

    it('should format seconds only', () => {
      expect(formatTimerDisplay(45)).toBe('00:00:45')
    })

    it('should format minutes and seconds', () => {
      expect(formatTimerDisplay(125)).toBe('00:02:05')
    })

    it('should format hours, minutes and seconds', () => {
      expect(formatTimerDisplay(3661)).toBe('01:01:01')
    })

    it('should pad single digits', () => {
      expect(formatTimerDisplay(9)).toBe('00:00:09')
      expect(formatTimerDisplay(60)).toBe('00:01:00')
      expect(formatTimerDisplay(3600)).toBe('01:00:00')
    })

    it('should handle negative values as 0', () => {
      expect(formatTimerDisplay(-5)).toBe('00:00:00')
    })
  })

  describe('formatDate', () => {
    it('should format ISO string to YYYY-MM-DD', () => {
      expect(formatDate('2026-06-15T09:00:00.000Z')).toBe('2026-06-15')
    })

    it('should return empty string for falsy input', () => {
      expect(formatDate('')).toBe('')
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
    })
  })

  describe('formatTimeHHMM', () => {
    it('should format date to HH:MM', () => {
      const d = new Date('2026-06-15T09:30:00')
      expect(formatTimeHHMM(d)).toBe('09:30')
    })

    it('should pad single digits', () => {
      const d = new Date('2026-06-15T08:05:00')
      expect(formatTimeHHMM(d)).toBe('08:05')
    })
  })

  describe('getDateKey', () => {
    it('should return date string from ISO', () => {
      expect(getDateKey('2026-06-15T09:00:00.000Z')).toBe('2026-06-15')
    })
  })

  describe('getProjectLabel', () => {
    it('should return label for known project key', () => {
      expect(getProjectLabel('frontend')).toBe('前端开发')
    })

    it('should return key for unknown project', () => {
      expect(getProjectLabel('unknown')).toBe('unknown')
    })
  })

  describe('getProjectColor', () => {
    it('should return color for known project', () => {
      expect(getProjectColor('frontend')).toBe('#3b82f6')
    })

    it('should return default color for unknown project', () => {
      expect(getProjectColor('unknown')).toBe('#6b7280')
    })
  })

  describe('calculateDurationMs', () => {
    it('should calculate duration between two times', () => {
      const start = '2026-06-15T09:00:00'
      const end = '2026-06-15T17:00:00'
      expect(calculateDurationMs(start, end)).toBe(8 * 3600000)
    })
  })

  describe('msToHours', () => {
    it('should convert ms to hours', () => {
      expect(msToHours(3600000)).toBe(1)
      expect(msToHours(7200000)).toBe(2)
    })

    it('should return 0 for 0 ms', () => {
      expect(msToHours(0)).toBe(0)
    })
  })

  describe('msToFormattedHours', () => {
    it('should format ms as hours with 2 decimals', () => {
      expect(msToFormattedHours(3600000)).toBe('1.00')
      expect(msToFormattedHours(5400000)).toBe('1.50')
    })
  })

  describe('calculateDurationHours', () => {
    it('should calculate duration for same day', () => {
      const hours = calculateDurationHours('2026-06-15', '09:00', '17:00')
      expect(hours).toBe(8)
    })

    it('should calculate overnight duration when end < start', () => {
      const hours = calculateDurationHours('2026-06-15', '22:00', '06:00')
      expect(hours).toBe(8)
    })

    it('should handle exactly 24 hours when start and end are same', () => {
      const hours = calculateDurationHours('2026-06-15', '00:00', '00:00')
      expect(hours).toBe(24)
    })

    it('should calculate 23 hours 59 minutes for 00:01 to 00:00', () => {
      const hours = calculateDurationHours('2026-06-15', '00:01', '00:00')
      expect(hours).toBeCloseTo(23 + 59 / 60, 4)
    })

    it('should handle 1 minute duration', () => {
      const hours = calculateDurationHours('2026-06-15', '09:00', '09:01')
      expect(hours).toBeCloseTo(1 / 60, 4)
    })
  })

  describe('validateManualEntry', () => {
    it('should pass for valid data', () => {
      const errors = validateManualEntry({
        project: 'frontend',
        date: '2026-06-15',
        startTime: '09:00',
        endTime: '17:00',
      })
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should require project', () => {
      const errors = validateManualEntry({
        project: '',
        date: '2026-06-15',
        startTime: '09:00',
        endTime: '17:00',
      })
      expect(errors.project).toBe('请选择项目')
    })

    it('should require date', () => {
      const errors = validateManualEntry({
        project: 'frontend',
        date: '',
        startTime: '09:00',
        endTime: '17:00',
      })
      expect(errors.date).toBe('请选择日期')
    })

    it('should require start time', () => {
      const errors = validateManualEntry({
        project: 'frontend',
        date: '2026-06-15',
        startTime: '',
        endTime: '17:00',
      })
      expect(errors.startTime).toBe('请输入开始时间')
    })

    it('should require end time', () => {
      const errors = validateManualEntry({
        project: 'frontend',
        date: '2026-06-15',
        startTime: '09:00',
        endTime: '',
      })
      expect(errors.endTime).toBe('请输入结束时间')
    })

    it('should handle overnight duration correctly', () => {
      const errors = validateManualEntry({
        project: 'frontend',
        date: '2026-06-15',
        startTime: '22:00',
        endTime: '06:00',
      })
      expect(errors.endTime).toBeUndefined()
    })

    it('should reject duration over 24 hours', () => {
      const errors = validateManualEntry({
        project: 'frontend',
        date: '2026-06-15',
        startTime: '00:00',
        endTime: '00:00',
      })
      expect(errors.endTime).toBe('时长不能超过24小时')
    })

    it('should accept 23 hours 59 minutes (just under 24 hours)', () => {
      const errors = validateManualEntry({
        project: 'frontend',
        date: '2026-06-15',
        startTime: '00:00',
        endTime: '23:59',
      })
      expect(errors.endTime).toBeUndefined()
    })
  })

  describe('createRecord', () => {
    it('should create a record with correct fields', () => {
      const data = {
        project: 'frontend',
        date: '2026-06-15',
        startTime: '09:00',
        endTime: '17:00',
        note: 'test note',
      }
      const record = createRecord(data)
      expect(record.project).toBe('frontend')
      expect(record.durationMs).toBe(8 * 3600000)
      expect(record.note).toBe('test note')
      expect(record.id).toBeTruthy()
    })

    it('should handle overnight record when end < start', () => {
      const data = {
        project: 'frontend',
        date: '2026-06-15',
        startTime: '22:00',
        endTime: '06:00',
        note: 'night shift',
      }
      const record = createRecord(data)
      expect(record.durationMs).toBe(8 * 3600000)
      const startDate = new Date(record.startTime).getDate()
      const endDate = new Date(record.endTime).getDate()
      expect(endDate).toBe(startDate + 1)
    })
  })

  describe('createTimerRecord', () => {
    it('should create a timer record', () => {
      const start = '2026-06-15T09:00:00'
      const end = '2026-06-15T17:00:00'
      const record = createTimerRecord('frontend', start, end)
      expect(record.project).toBe('frontend')
      expect(record.durationMs).toBe(8 * 3600000)
      expect(record.note).toBe('')
    })
  })

  describe('createTimerRecordWithPause', () => {
    it('should create record with correct duration from elapsed seconds', () => {
      const end = new Date('2026-06-15T17:00:00')
      const elapsedSeconds = 7200
      const record = createTimerRecordWithPause('frontend', end.toISOString(), elapsedSeconds)
      expect(record.project).toBe('frontend')
      expect(record.durationMs).toBe(7200 * 1000)
      expect(record.endTime).toBe(end.toISOString())
      const expectedStart = new Date(end.getTime() - 7200 * 1000)
      expect(record.startTime).toBe(expectedStart.toISOString())
    })

    it('should handle pause → continue → stop scenario', () => {
      const end = new Date('2026-06-15T18:00:00')
      const pausedSeconds = 3600
      const continuedSeconds = 7200
      const totalSeconds = pausedSeconds + continuedSeconds
      const record = createTimerRecordWithPause('frontend', end.toISOString(), totalSeconds)
      expect(record.durationMs).toBe(totalSeconds * 1000)
      expect(record.durationMs / 3600000).toBe(3)
    })

    it('should handle zero elapsed seconds', () => {
      const end = new Date('2026-06-15T17:00:00')
      const record = createTimerRecordWithPause('frontend', end.toISOString(), 0)
      expect(record.durationMs).toBe(0)
      expect(record.startTime).toBe(record.endTime)
    })
  })

  describe('updateRecord', () => {
    it('should update existing record', () => {
      const original = makeRecord({ id: 'test-1' })
      const records = [original]
      const updated = updateRecord(records, 'test-1', {
        project: 'backend',
        date: '2026-06-15',
        startTime: '10:00',
        endTime: '18:00',
        note: 'updated',
      })
      expect(updated[0].project).toBe('backend')
      expect(updated[0].note).toBe('updated')
    })

    it('should return unchanged array if id not found', () => {
      const original = makeRecord({ id: 'test-1' })
      const records = [original]
      const updated = updateRecord(records, 'nonexistent', {
        project: 'backend',
        date: '2026-06-15',
        startTime: '10:00',
        endTime: '18:00',
        note: '',
      })
      expect(updated).toBe(records)
    })

    it('should handle overnight update when end < start', () => {
      const original = makeRecord({ id: 'test-1' })
      const records = [original]
      const updated = updateRecord(records, 'test-1', {
        project: 'frontend',
        date: '2026-06-15',
        startTime: '22:00',
        endTime: '06:00',
        note: 'overnight update',
      })
      expect(updated[0].durationMs).toBe(8 * 3600000)
      const startDate = new Date(updated[0].startTime).getDate()
      const endDate = new Date(updated[0].endTime).getDate()
      expect(endDate).toBe(startDate + 1)
    })
  })

  describe('deleteRecord', () => {
    it('should remove record by id', () => {
      const r1 = makeRecord({ id: 'test-1' })
      const r2 = makeRecord({ id: 'test-2' })
      const result = deleteRecord([r1, r2], 'test-1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('test-2')
    })
  })

  describe('filterRecordsByDateRange', () => {
    it('should filter records within range', () => {
      const r1 = makeRecord({ startTime: '2026-06-14T09:00:00', endTime: '2026-06-14T17:00:00' })
      const r2 = makeRecord({ startTime: '2026-06-15T09:00:00', endTime: '2026-06-15T17:00:00' })
      const r3 = makeRecord({ startTime: '2026-06-16T09:00:00', endTime: '2026-06-16T17:00:00' })
      const range = {
        start: new Date('2026-06-15T00:00:00'),
        end: new Date('2026-06-15T23:59:59'),
      }
      const result = filterRecordsByDateRange([r1, r2, r3], range)
      expect(result).toHaveLength(1)
      expect(result[0].startTime).toBe(r2.startTime)
    })

    it('should return all records if no range', () => {
      const r1 = makeRecord()
      const result = filterRecordsByDateRange([r1], null)
      expect(result).toHaveLength(1)
    })
  })

  describe('filterRecordsByProject', () => {
    it('should filter records by project key', () => {
      const r1 = makeRecord({ project: 'frontend' })
      const r2 = makeRecord({ project: 'backend' })
      const result = filterRecordsByProject([r1, r2], 'frontend')
      expect(result).toHaveLength(1)
      expect(result[0].project).toBe('frontend')
    })

    it('should return all records if no project filter', () => {
      const r1 = makeRecord({ project: 'frontend' })
      const r2 = makeRecord({ project: 'backend' })
      const result = filterRecordsByProject([r1, r2], null)
      expect(result).toHaveLength(2)
    })
  })

  describe('groupRecordsByDate', () => {
    it('should group records by date descending', () => {
      const r1 = makeRecord({ startTime: '2026-06-14T09:00:00', endTime: '2026-06-14T17:00:00' })
      const r2 = makeRecord({ startTime: '2026-06-15T09:00:00', endTime: '2026-06-15T17:00:00' })
      const r3 = makeRecord({ startTime: '2026-06-15T10:00:00', endTime: '2026-06-15T18:00:00' })
      const groups = groupRecordsByDate([r1, r2, r3])
      expect(groups).toHaveLength(2)
      expect(groups[0].date).toBe('2026-06-15')
      expect(groups[0].records).toHaveLength(2)
      expect(groups[1].date).toBe('2026-06-14')
      expect(groups[1].records).toHaveLength(1)
    })

    it('should sort records within each date by start time descending', () => {
      const r1 = makeRecord({ startTime: '2026-06-15T09:00:00', endTime: '2026-06-15T17:00:00' })
      const r2 = makeRecord({ startTime: '2026-06-15T14:00:00', endTime: '2026-06-15T18:00:00' })
      const groups = groupRecordsByDate([r1, r2])
      expect(groups[0].records[0].startTime).toBe(r2.startTime)
    })

    it('should return empty array for empty input', () => {
      expect(groupRecordsByDate([])).toEqual([])
    })
  })

  describe('groupRecordsByProject', () => {
    it('should group records by project', () => {
      const r1 = makeRecord({ project: 'frontend' })
      const r2 = makeRecord({ project: 'backend' })
      const r3 = makeRecord({ project: 'frontend' })
      const groups = groupRecordsByProject([r1, r2, r3])
      expect(Object.keys(groups)).toHaveLength(2)
      expect(groups.frontend).toHaveLength(2)
      expect(groups.backend).toHaveLength(1)
    })
  })

  describe('calculateProjectSubtotals', () => {
    it('should calculate total duration per project in ms', () => {
      const r1 = makeRecord({ project: 'frontend', durationMs: 3600000 })
      const r2 = makeRecord({ project: 'frontend', durationMs: 7200000 })
      const r3 = makeRecord({ project: 'backend', durationMs: 5400000 })
      const totals = calculateProjectSubtotals([r1, r2, r3])
      expect(totals.frontend).toBe(10800000)
      expect(totals.backend).toBe(5400000)
    })
  })

  describe('calculateProjectHours', () => {
    it('should calculate total hours per project', () => {
      const r1 = makeRecord({ project: 'frontend', durationMs: 3600000 })
      const r2 = makeRecord({ project: 'frontend', durationMs: 7200000 })
      const hours = calculateProjectHours([r1, r2])
      expect(hours.frontend).toBe(3)
    })
  })

  describe('buildBarChartData', () => {
    it('should return bar chart data for projects with hours in date range', () => {
      const r1 = makeRecord({ project: 'frontend', startTime: '2026-06-15T09:00:00', endTime: '2026-06-15T17:00:00' })
      const range = {
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
      }
      const data = buildBarChartData([r1], range)
      expect(data).toHaveLength(1)
      expect(data[0].projectKey).toBe('frontend')
      expect(data[0].hours).toBe(8)
    })

    it('should filter out projects with zero hours', () => {
      const r1 = makeRecord({ project: 'frontend', startTime: '2026-06-15T09:00:00', endTime: '2026-06-15T17:00:00' })
      const range = {
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
      }
      const data = buildBarChartData([r1], range)
      const backendData = data.find((d) => d.projectKey === 'backend')
      expect(backendData).toBeUndefined()
    })
  })

  describe('getBudgetProgress', () => {
    it('should calculate budget progress for current month', () => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const r1 = makeRecord({
        project: 'frontend',
        startTime: new Date(now.getFullYear(), now.getMonth(), 15, 9).toISOString(),
        endTime: new Date(now.getFullYear(), now.getMonth(), 15, 17).toISOString(),
        durationMs: 8 * 3600000,
      })
      const testBudgets = { [monthKey]: { frontend: 10 } }
      const progress = getBudgetProgress([r1], testBudgets)
      const frontendProgress = progress.find((p) => p.projectKey === 'frontend')
      expect(frontendProgress).toBeDefined()
      expect(frontendProgress.used).toBe(8)
      expect(frontendProgress.budget).toBe(10)
      expect(frontendProgress.percent).toBe(80)
      expect(frontendProgress.status).toBe('warning')
    })

    it('should mark status as over when over 100%', () => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const r1 = makeRecord({
        project: 'frontend',
        startTime: new Date(now.getFullYear(), now.getMonth(), 15, 9).toISOString(),
        endTime: new Date(now.getFullYear(), now.getMonth(), 15, 17).toISOString(),
        durationMs: 12 * 3600000,
      })
      const testBudgets = { [monthKey]: { frontend: 10 } }
      const progress = getBudgetProgress([r1], testBudgets)
      const frontendProgress = progress.find((p) => p.projectKey === 'frontend')
      expect(frontendProgress.status).toBe('over')
    })

    it('should filter out projects with no budget', () => {
      const progress = getBudgetProgress([], {})
      expect(progress).toHaveLength(0)
    })

    it('should mark status as normal when under 80%', () => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const r1 = makeRecord({
        project: 'frontend',
        startTime: new Date(now.getFullYear(), now.getMonth(), 15, 9).toISOString(),
        endTime: new Date(now.getFullYear(), now.getMonth(), 15, 17).toISOString(),
        durationMs: 5 * 3600000,
      })
      const testBudgets = { [monthKey]: { frontend: 10 } }
      const progress = getBudgetProgress([r1], testBudgets)
      const frontendProgress = progress.find((p) => p.projectKey === 'frontend')
      expect(frontendProgress.status).toBe('normal')
    })

    it('should mark status as warning when exactly 80% (boundary condition)', () => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const r1 = makeRecord({
        project: 'frontend',
        startTime: new Date(now.getFullYear(), now.getMonth(), 15, 9).toISOString(),
        endTime: new Date(now.getFullYear(), now.getMonth(), 15, 17).toISOString(),
        durationMs: 8 * 3600000,
      })
      const testBudgets = { [monthKey]: { frontend: 10 } }
      const progress = getBudgetProgress([r1], testBudgets)
      const frontendProgress = progress.find((p) => p.projectKey === 'frontend')
      expect(frontendProgress.percent).toBe(80)
      expect(frontendProgress.status).toBe('warning')
    })

    it('should mark status as warning when over 80% but under 100%', () => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const r1 = makeRecord({
        project: 'frontend',
        startTime: new Date(now.getFullYear(), now.getMonth(), 15, 9).toISOString(),
        endTime: new Date(now.getFullYear(), now.getMonth(), 15, 17).toISOString(),
        durationMs: 9 * 3600000,
      })
      const testBudgets = { [monthKey]: { frontend: 10 } }
      const progress = getBudgetProgress([r1], testBudgets)
      const frontendProgress = progress.find((p) => p.projectKey === 'frontend')
      expect(frontendProgress.percent).toBe(90)
      expect(frontendProgress.status).toBe('warning')
    })

    it('should mark status as over when exactly 100% (boundary condition)', () => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const r1 = makeRecord({
        project: 'frontend',
        startTime: new Date(now.getFullYear(), now.getMonth(), 15, 9).toISOString(),
        endTime: new Date(now.getFullYear(), now.getMonth(), 15, 17).toISOString(),
        durationMs: 10 * 3600000,
      })
      const testBudgets = { [monthKey]: { frontend: 10 } }
      const progress = getBudgetProgress([r1], testBudgets)
      const frontendProgress = progress.find((p) => p.projectKey === 'frontend')
      expect(frontendProgress.percent).toBe(100)
      expect(frontendProgress.status).toBe('over')
    })

    it('should mark status as over when over 100%', () => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const r1 = makeRecord({
        project: 'frontend',
        startTime: new Date(now.getFullYear(), now.getMonth(), 15, 9).toISOString(),
        endTime: new Date(now.getFullYear(), now.getMonth(), 15, 17).toISOString(),
        durationMs: 12 * 3600000,
      })
      const testBudgets = { [monthKey]: { frontend: 10 } }
      const progress = getBudgetProgress([r1], testBudgets)
      const frontendProgress = progress.find((p) => p.projectKey === 'frontend')
      expect(frontendProgress.status).toBe('over')
    })
  })

  describe('setBudget', () => {
    it('should set a budget for a project', () => {
      const result = setBudget({}, 'frontend', 10)
      expect(result.success).toBe(true)
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      expect(result.budgets[monthKey].frontend).toBe(10)
    })

    it('should reject negative budget', () => {
      const result = setBudget({}, 'frontend', -5)
      expect(result.success).toBe(false)
    })

    it('should remove budget when set to 0', () => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const existing = { [monthKey]: { frontend: 10 } }
      const result = setBudget(existing, 'frontend', 0)
      expect(result.success).toBe(true)
      expect(result.budgets[monthKey]?.frontend).toBeUndefined()
    })
  })

  describe('recordToFormData', () => {
    it('should convert record to form data', () => {
      const record = makeRecord()
      const formData = recordToFormData(record)
      expect(formData.project).toBe('frontend')
      expect(formData.date).toBeTruthy()
      expect(formData.startTime).toBeTruthy()
      expect(formData.endTime).toBeTruthy()
      expect(formData.note).toBe('')
    })
  })

  describe('generateCSV', () => {
    it('should generate CSV with header and rows', () => {
      const r1 = makeRecord({ project: 'frontend' })
      const r2 = makeRecord({ project: 'backend' })
      const range = {
        start: new Date('2026-01-01'),
        end: new Date('2026-12-31'),
      }
      const csv = generateCSV([r1, r2], null, range)
      const lines = csv.split('\n')
      expect(lines[0]).toBe('项目名称,日期,开始时间,结束时间,持续时长（小时）,备注')
      expect(lines).toHaveLength(3)
    })

    it('should filter by project', () => {
      const r1 = makeRecord({ project: 'frontend' })
      const r2 = makeRecord({ project: 'backend' })
      const range = {
        start: new Date('2026-01-01'),
        end: new Date('2026-12-31'),
      }
      const csv = generateCSV([r1, r2], 'frontend', range)
      const lines = csv.split('\n')
      expect(lines).toHaveLength(2)
      expect(lines[1]).toContain('前端开发')
    })

    it('should escape double quotes in notes', () => {
      const r1 = makeRecord({ note: 'He said "hello"' })
      const range = {
        start: new Date('2026-01-01'),
        end: new Date('2026-12-31'),
      }
      const csv = generateCSV([r1], null, range)
      expect(csv).toContain('He said ""hello""')
    })
  })

  describe('getCSVFilename', () => {
    it('should include date range in filename', () => {
      const range = {
        start: new Date('2026-06-01'),
        end: new Date('2026-06-30'),
      }
      const filename = getCSVFilename(range)
      expect(filename).toContain('工时记录_')
      expect(filename).toContain('2026-06-01')
      expect(filename).toContain('2026-06-30')
      expect(filename).toContain('.csv')
    })
  })

  describe('localStorage persistence', () => {
    let storage
    beforeEach(() => {
      storage = createMockStorage()
    })

    describe('loadRecords / saveRecords', () => {
      it('should return empty array when no records', () => {
        expect(loadRecords(storage)).toEqual([])
      })

      it('should round-trip records', () => {
        const records = [makeRecord()]
        saveRecords(records, storage)
        const loaded = loadRecords(storage)
        expect(loaded).toHaveLength(1)
        expect(loaded[0].project).toBe('frontend')
      })
    })

    describe('loadBudgets / saveBudgets', () => {
      it('should return empty object when no budgets', () => {
        expect(loadBudgets(storage)).toEqual({})
      })

      it('should round-trip budgets', () => {
        const budgets = { '2026-06': { frontend: 10 } }
        saveBudgets(budgets, storage)
        const loaded = loadBudgets(storage)
        expect(loaded['2026-06'].frontend).toBe(10)
      })
    })

    describe('loadTimerState / saveTimerState / clearTimerState', () => {
      it('should return null when no timer state', () => {
        expect(loadTimerState(storage)).toBeNull()
      })

      it('should round-trip timer state', () => {
        const state = {
          project: 'frontend',
          startTime: new Date().toISOString(),
          elapsedBeforePause: 120,
          paused: false,
        }
        saveTimerState(state, storage)
        const loaded = loadTimerState(storage)
        expect(loaded.project).toBe('frontend')
        expect(loaded.elapsedBeforePause).toBe(120)
      })

      it('should clear timer state', () => {
        saveTimerState({ project: 'frontend' }, storage)
        clearTimerState(storage)
        expect(loadTimerState(storage)).toBeNull()
      })
    })
  })

  describe('getDateRange', () => {
    it('should return this_month range', () => {
      const range = getDateRange('this_month')
      const now = new Date()
      expect(range.start.getMonth()).toBe(now.getMonth())
      expect(range.start.getDate()).toBe(1)
    })

    it('should return last_month range', () => {
      const range = getDateRange('last_month')
      const now = new Date()
      const expectedMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      expect(range.start.getMonth()).toBe(expectedMonth)
    })

    it('should return custom range', () => {
      const range = getDateRange('custom', '2026-06-01', '2026-06-30')
      expect(range.start.getFullYear()).toBe(2026)
      expect(range.end.getFullYear()).toBe(2026)
    })

    it('should default to full range for unknown preset', () => {
      const range = getDateRange('unknown')
      expect(range.start.getTime()).toBeLessThan(range.end.getTime())
    })
  })
})
