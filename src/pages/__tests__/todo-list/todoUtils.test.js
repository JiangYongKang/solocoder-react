import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  formatDate,
  getTodayKey,
  parseDate,
  addDays,
  createGroup,
  renameGroup,
  deleteGroup,
  createTask,
  updateTask,
  deleteTask,
  deleteTasksByGroup,
  findTaskById,
  findParentTask,
  addSubtask,
  calculateProgress,
  recalculateParentCompletion,
  toggleTaskCompletion,
  reorderTasks,
  reorderSubtasks,
  reorderGroupRootTasks,
  isOverdue,
  isDueToday,
  isDueTomorrow,
  isDueThisWeek,
  getDueDateLabel,
  flattenTasks,
  countIncompleteTasks,
  countGroupIncomplete,
  countFilteredGroupIncomplete,
  countFilteredAllIncomplete,
  filterTasks,
  getOverdueCount,
  sortTasksWithOverdueFirst,
  recordCheckin,
  calculateStreak,
  calculateMaxStreak,
  shouldAutoCheckin,
  buildHeatmapData,
  getHeatmapColor,
  loadGroups,
  saveGroups,
  loadTasks,
  saveTasks,
  loadCheckins,
  saveCheckins,
} from '@/pages/todo-list/todoUtils'
import {
  PRIORITIES,
  FILTER_PRIORITY_ALL,
  FILTER_STATUS_ALL,
  FILTER_STATUS_PENDING,
  FILTER_STATUS_DONE,
  FILTER_DUE_ALL,
  FILTER_DUE_TODAY,
  FILTER_DUE_OVERDUE,
  ALL_TASKS_VIEW,
  STORAGE_KEY_GROUPS,
  STORAGE_KEY_TASKS,
  STORAGE_KEY_CHECKINS,
} from '@/pages/todo-list/constants'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    _store: store,
  }
}

function makeTask(overrides = {}) {
  return {
    id: generateId(),
    groupId: 'grp_work',
    parentId: null,
    title: 'Test task',
    completed: false,
    priority: PRIORITIES.MEDIUM,
    dueDate: null,
    subtasks: [],
    order: 0,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('todoUtils', () => {
  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should start with td_ prefix', () => {
      expect(generateId().startsWith('td_')).toBe(true)
    })
  })

  describe('formatDate', () => {
    it('should format Date object', () => {
      expect(formatDate(new Date(2024, 0, 15))).toBe('2024-01-15')
    })

    it('should format string date', () => {
      expect(formatDate('2024-03-05')).toBe('2024-03-05')
    })

    it('should return empty string for null', () => {
      expect(formatDate(null)).toBe('')
    })
  })

  describe('parseDate', () => {
    it('should parse date string to Date', () => {
      const d = parseDate('2024-06-15')
      expect(d.getFullYear()).toBe(2024)
      expect(d.getMonth()).toBe(5)
      expect(d.getDate()).toBe(15)
    })
  })

  describe('addDays', () => {
    it('should add days correctly', () => {
      expect(addDays('2024-06-15', 1)).toBe('2024-06-16')
    })

    it('should subtract days correctly', () => {
      expect(addDays('2024-06-15', -1)).toBe('2024-06-14')
    })

    it('should handle month boundaries', () => {
      expect(addDays('2024-06-30', 1)).toBe('2024-07-01')
    })
  })

  describe('group operations', () => {
    it('createGroup should add new group', () => {
      const groups = [{ id: 'g1', name: 'Work', color: '#3b82f6' }]
      const result = createGroup(groups, 'Personal', '#10b981')
      expect(result).toHaveLength(2)
      expect(result[1].name).toBe('Personal')
      expect(result[1].color).toBe('#10b981')
    })

    it('createGroup should trim name', () => {
      const result = createGroup([], '  Test  ', '#3b82f6')
      expect(result[0].name).toBe('Test')
    })

    it('renameGroup should update name', () => {
      const groups = [{ id: 'g1', name: 'Work', color: '#3b82f6' }]
      const result = renameGroup(groups, 'g1', 'New Name')
      expect(result[0].name).toBe('New Name')
    })

    it('deleteGroup should remove group', () => {
      const groups = [{ id: 'g1', name: 'Work', color: '#3b82f6' }, { id: 'g2', name: 'Personal', color: '#10b981' }]
      const result = deleteGroup(groups, 'g1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('g2')
    })
  })

  describe('task CRUD', () => {
    it('createTask should add new task', () => {
      const tasks = []
      const result = createTask(tasks, { groupId: 'g1', title: 'My task', priority: PRIORITIES.HIGH, dueDate: '2024-12-31' })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('My task')
      expect(result[0].priority).toBe(PRIORITIES.HIGH)
      expect(result[0].dueDate).toBe('2024-12-31')
      expect(result[0].groupId).toBe('g1')
      expect(result[0].completed).toBe(false)
    })

    it('createTask should default priority to medium', () => {
      const result = createTask([], { groupId: 'g1', title: 'Task' })
      expect(result[0].priority).toBe(PRIORITIES.MEDIUM)
    })

    it('updateTask should update flat task', () => {
      const task = makeTask({ id: 't1' })
      const result = updateTask([task], 't1', { title: 'Updated' })
      expect(result[0].title).toBe('Updated')
    })

    it('updateTask should update nested subtask', () => {
      const task = makeTask({ id: 't1', subtasks: [makeTask({ id: 't2', parentId: 't1', title: 'Sub' })] })
      const result = updateTask([task], 't2', { title: 'Updated Sub' })
      expect(result[0].subtasks[0].title).toBe('Updated Sub')
    })

    it('deleteTask should remove task', () => {
      const t1 = makeTask({ id: 't1' })
      const t2 = makeTask({ id: 't2' })
      const result = deleteTask([t1, t2], 't1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t2')
    })

    it('deleteTask should remove nested subtask', () => {
      const task = makeTask({ id: 't1', subtasks: [makeTask({ id: 't2', parentId: 't1' }), makeTask({ id: 't3', parentId: 't1' })] })
      const result = deleteTask([task], 't2')
      expect(result[0].subtasks).toHaveLength(1)
      expect(result[0].subtasks[0].id).toBe('t3')
    })

    it('deleteTasksByGroup should remove all tasks of group', () => {
      const tasks = [makeTask({ id: 't1', groupId: 'g1' }), makeTask({ id: 't2', groupId: 'g2' }), makeTask({ id: 't3', groupId: 'g1' })]
      const result = deleteTasksByGroup(tasks, 'g1')
      expect(result).toHaveLength(1)
      expect(result[0].groupId).toBe('g2')
    })
  })

  describe('findTaskById', () => {
    it('should find top-level task', () => {
      const task = makeTask({ id: 't1' })
      expect(findTaskById([task], 't1')).toBe(task)
    })

    it('should find nested subtask', () => {
      const sub = makeTask({ id: 'sub1', parentId: 't1' })
      const task = makeTask({ id: 't1', subtasks: [sub] })
      expect(findTaskById([task], 'sub1')).toEqual(sub)
    })

    it('should find deeply nested subtask', () => {
      const deepSub = makeTask({ id: 'deep1', parentId: 'sub1' })
      const sub = makeTask({ id: 'sub1', parentId: 't1', subtasks: [deepSub] })
      const task = makeTask({ id: 't1', subtasks: [sub] })
      expect(findTaskById([task], 'deep1')).toEqual(deepSub)
    })

    it('should return null for non-existent id', () => {
      expect(findTaskById([], 'missing')).toBeNull()
    })
  })

  describe('findParentTask', () => {
    it('should find parent of subtask', () => {
      const sub = makeTask({ id: 'sub1', parentId: 't1' })
      const task = makeTask({ id: 't1', subtasks: [sub] })
      expect(findParentTask([task], 'sub1')).toEqual(task)
    })

    it('should return null for top-level task', () => {
      const task = makeTask({ id: 't1' })
      expect(findParentTask([task], 't1')).toBeNull()
    })
  })

  describe('addSubtask', () => {
    it('should add subtask to task', () => {
      const task = makeTask({ id: 't1', subtasks: [] })
      const result = addSubtask([task], 't1', { title: 'New sub', priority: PRIORITIES.LOW, dueDate: null })
      expect(result[0].subtasks).toHaveLength(1)
      expect(result[0].subtasks[0].title).toBe('New sub')
      expect(result[0].subtasks[0].parentId).toBe('t1')
    })

    it('should add subtask to nested subtask', () => {
      const sub = makeTask({ id: 'sub1', parentId: 't1', subtasks: [] })
      const task = makeTask({ id: 't1', subtasks: [sub] })
      const result = addSubtask([task], 'sub1', { title: 'Deep sub', priority: PRIORITIES.MEDIUM, dueDate: null })
      expect(result[0].subtasks[0].subtasks).toHaveLength(1)
      expect(result[0].subtasks[0].subtasks[0].title).toBe('Deep sub')
    })
  })

  describe('calculateProgress', () => {
    it('should return 0% for incomplete task without subtasks', () => {
      const task = makeTask({ completed: false, subtasks: [] })
      const progress = calculateProgress(task)
      expect(progress).toEqual({ completed: 0, total: 1, percentage: 0 })
    })

    it('should return 100% for completed task without subtasks', () => {
      const task = makeTask({ completed: true, subtasks: [] })
      const progress = calculateProgress(task)
      expect(progress).toEqual({ completed: 1, total: 1, percentage: 100 })
    })

    it('should calculate progress from subtasks', () => {
      const task = makeTask({
        subtasks: [
          makeTask({ completed: true }),
          makeTask({ completed: false }),
          makeTask({ completed: true }),
          makeTask({ completed: false }),
          makeTask({ completed: false }),
        ],
      })
      const progress = calculateProgress(task)
      expect(progress).toEqual({ completed: 2, total: 5, percentage: 40 })
    })

    it('should handle all subtasks completed', () => {
      const task = makeTask({
        subtasks: [makeTask({ completed: true }), makeTask({ completed: true })],
      })
      expect(calculateProgress(task).percentage).toBe(100)
    })
  })

  describe('recalculateParentCompletion', () => {
    it('should auto-complete parent when all subtasks done', () => {
      const task = makeTask({
        id: 't1',
        completed: false,
        subtasks: [makeTask({ completed: true }), makeTask({ completed: true })],
      })
      const result = recalculateParentCompletion([task])
      expect(result[0].completed).toBe(true)
    })

    it('should uncomplete parent when any subtask undone', () => {
      const task = makeTask({
        id: 't1',
        completed: true,
        subtasks: [makeTask({ completed: true }), makeTask({ completed: false })],
      })
      const result = recalculateParentCompletion([task])
      expect(result[0].completed).toBe(false)
    })

    it('should handle nested recalculation', () => {
      const innerSub = makeTask({ id: 's1', completed: true, subtasks: [] })
      const outerSub = makeTask({ id: 's2', completed: false, subtasks: [innerSub] })
      const task = makeTask({ id: 't1', completed: false, subtasks: [outerSub] })
      const result = recalculateParentCompletion([task])
      expect(result[0].subtasks[0].completed).toBe(true)
      expect(result[0].completed).toBe(true)
    })
  })

  describe('toggleTaskCompletion', () => {
    it('should toggle incomplete to complete', () => {
      const task = makeTask({ id: 't1', completed: false })
      const result = toggleTaskCompletion([task], 't1')
      expect(result[0].completed).toBe(true)
    })

    it('should toggle complete to incomplete', () => {
      const task = makeTask({ id: 't1', completed: true })
      const result = toggleTaskCompletion([task], 't1')
      expect(result[0].completed).toBe(false)
    })

    it('should complete all subtasks when parent completed', () => {
      const task = makeTask({
        id: 't1',
        completed: false,
        subtasks: [makeTask({ id: 's1', completed: false }), makeTask({ id: 's2', completed: false })],
      })
      const result = toggleTaskCompletion([task], 't1')
      expect(result[0].completed).toBe(true)
      expect(result[0].subtasks[0].completed).toBe(true)
      expect(result[0].subtasks[1].completed).toBe(true)
    })

    it('should recalculate parent when subtask toggled', () => {
      const task = makeTask({
        id: 't1',
        completed: false,
        subtasks: [makeTask({ id: 's1', completed: true }), makeTask({ id: 's2', completed: false })],
      })
      const result = toggleTaskCompletion([task], 's2')
      expect(result[0].completed).toBe(true)
    })
  })

  describe('reorderTasks', () => {
    it('should reorder tasks and update order property', () => {
      const tasks = [makeTask({ id: 't1', order: 0 }), makeTask({ id: 't2', order: 1 }), makeTask({ id: 't3', order: 2 })]
      const result = reorderTasks(tasks, 0, 2)
      expect(result.map(t => t.id)).toEqual(['t2', 't3', 't1'])
      expect(result.map(t => t.order)).toEqual([0, 1, 2])
    })
  })

  describe('reorderSubtasks', () => {
    it('should reorder subtasks within parent', () => {
      const task = makeTask({
        id: 't1',
        subtasks: [makeTask({ id: 's1', order: 0 }), makeTask({ id: 's2', order: 1 })],
      })
      const result = reorderSubtasks([task], 't1', 0, 1)
      expect(result[0].subtasks.map(s => s.id)).toEqual(['s2', 's1'])
    })
  })

  describe('reorderGroupRootTasks', () => {
    it('should reorder root tasks within a specific group', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', order: 0 }),
        makeTask({ id: 't2', groupId: 'g2', order: 0 }),
        makeTask({ id: 't3', groupId: 'g1', order: 1 }),
        makeTask({ id: 't4', groupId: 'g1', order: 2 }),
      ]
      const result = reorderGroupRootTasks(tasks, 'g1', 't1', 2)
      const g1Tasks = result.filter(t => t.groupId === 'g1' && !t.parentId)
      expect(g1Tasks.map(t => t.id)).toEqual(['t3', 't4', 't1'])
      expect(g1Tasks.map(t => t.order)).toEqual([0, 1, 2])
    })

    it('should move task from middle to beginning', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', order: 0 }),
        makeTask({ id: 't2', groupId: 'g1', order: 1 }),
        makeTask({ id: 't3', groupId: 'g1', order: 2 }),
      ]
      const result = reorderGroupRootTasks(tasks, 'g1', 't2', 0)
      const g1Tasks = result.filter(t => t.groupId === 'g1')
      expect(g1Tasks.map(t => t.id)).toEqual(['t2', 't1', 't3'])
      expect(g1Tasks.map(t => t.order)).toEqual([0, 1, 2])
    })

    it('should handle ALL_TASKS_VIEW', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', order: 0 }),
        makeTask({ id: 't2', groupId: 'g2', order: 0 }),
        makeTask({ id: 't3', groupId: 'g1', order: 1 }),
      ]
      const result = reorderGroupRootTasks(tasks, ALL_TASKS_VIEW, 't1', 2)
      const rootTasks = result.filter(t => !t.parentId)
      expect(rootTasks.map(t => t.id)).toEqual(['t2', 't3', 't1'])
      expect(rootTasks.map(t => t.order)).toEqual([0, 1, 2])
    })

    it('should preserve other group tasks and their order', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', order: 0 }),
        makeTask({ id: 't2', groupId: 'g2', order: 0 }),
        makeTask({ id: 't3', groupId: 'g1', order: 1 }),
        makeTask({ id: 't4', groupId: 'g2', order: 1 }),
      ]
      const result = reorderGroupRootTasks(tasks, 'g1', 't1', 1)
      const g1Tasks = result.filter(t => t.groupId === 'g1')
      const g2Tasks = result.filter(t => t.groupId === 'g2')
      expect(g1Tasks.map(t => t.id)).toEqual(['t3', 't1'])
      expect(g2Tasks.map(t => t.id)).toEqual(['t2', 't4'])
      expect(g2Tasks.map(t => t.order)).toEqual([0, 1])
    })

    it('should preserve subtasks in the result', () => {
      const sub = makeTask({ id: 's1', parentId: 't1' })
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', order: 0, subtasks: [sub] }),
        sub,
        makeTask({ id: 't2', groupId: 'g1', order: 1 }),
      ]
      const result = reorderGroupRootTasks(tasks, 'g1', 't1', 1)
      const subtaskInResult = result.find(t => t.id === 's1')
      expect(subtaskInResult).toBeDefined()
      const rootTasks = result.filter(t => !t.parentId)
      expect(rootTasks[0].id).toBe('t2')
      expect(rootTasks[1].id).toBe('t1')
    })

    it('should return original tasks if task not found', () => {
      const tasks = [makeTask({ id: 't1', groupId: 'g1', order: 0 })]
      const result = reorderGroupRootTasks(tasks, 'g1', 'non-existent', 0)
      expect(result).toBe(tasks)
    })
  })

  describe('due date helpers', () => {
    const today = getTodayKey()
    const tomorrow = addDays(today, 1)
    const yesterday = addDays(today, -1)

    it('isOverdue should return true for past dates', () => {
      expect(isOverdue(yesterday)).toBe(true)
    })

    it('isOverdue should return false for today', () => {
      expect(isOverdue(today)).toBe(false)
    })

    it('isOverdue should return false for null', () => {
      expect(isOverdue(null)).toBe(false)
    })

    it('isDueToday should work', () => {
      expect(isDueToday(today)).toBe(true)
      expect(isDueToday(tomorrow)).toBe(false)
    })

    it('isDueTomorrow should work', () => {
      expect(isDueTomorrow(tomorrow)).toBe(true)
      expect(isDueTomorrow(today)).toBe(false)
    })

    it('getDueDateLabel should return correct labels', () => {
      const overdueLabel = getDueDateLabel(yesterday)
      expect(overdueLabel.text).toBe('已过期')
      expect(overdueLabel.type).toBe('overdue')

      const todayLabel = getDueDateLabel(today)
      expect(todayLabel.text).toBe('今天到期')
      expect(todayLabel.type).toBe('today')

      const tomorrowLabel = getDueDateLabel(tomorrow)
      expect(tomorrowLabel.text).toBe('明天到期')
      expect(tomorrowLabel.type).toBe('tomorrow')
    })

    it('getDueDateLabel should return null for no due date', () => {
      expect(getDueDateLabel(null)).toBeNull()
    })

    it('getDueDateLabel should return null for future date', () => {
      expect(getDueDateLabel(addDays(today, 5))).toBeNull()
    })
  })

  describe('isDueThisWeek', () => {
    it('should return true for today', () => {
      expect(isDueThisWeek(getTodayKey())).toBe(true)
    })

    it('should return false for null', () => {
      expect(isDueThisWeek(null)).toBe(false)
    })

    it('should return true for a date within this week', () => {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(today)
      monday.setDate(today.getDate() + mondayOffset)
      expect(isDueThisWeek(formatDate(monday))).toBe(true)
    })

    it('should return false for a date outside this week', () => {
      const today = new Date()
      const pastDate = new Date(today)
      pastDate.setDate(today.getDate() - 10)
      expect(isDueThisWeek(formatDate(pastDate))).toBe(false)
    })
  })

  describe('flattenTasks', () => {
    it('should flatten nested tasks', () => {
      const tasks = [
        makeTask({ id: 't1', subtasks: [makeTask({ id: 's1', parentId: 't1' }), makeTask({ id: 's2', parentId: 't1' })] }),
        makeTask({ id: 't2' }),
      ]
      const flat = flattenTasks(tasks)
      expect(flat.map(t => t.id)).toEqual(['t1', 's1', 's2', 't2'])
    })
  })

  describe('countIncompleteTasks', () => {
    it('should count incomplete tasks', () => {
      const tasks = [
        makeTask({ id: 't1', completed: false }),
        makeTask({ id: 't2', completed: true }),
        makeTask({ id: 't3', completed: false }),
      ]
      expect(countIncompleteTasks(tasks)).toBe(2)
    })

    it('should count incomplete subtasks', () => {
      const tasks = [
        makeTask({ id: 't1', completed: false, subtasks: [makeTask({ id: 's1', completed: false }), makeTask({ id: 's2', completed: true })] }),
      ]
      expect(countIncompleteTasks(tasks)).toBe(2)
    })
  })

  describe('countGroupIncomplete', () => {
    it('should count incomplete tasks for specific group', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', completed: false }),
        makeTask({ id: 't2', groupId: 'g2', completed: false }),
        makeTask({ id: 't3', groupId: 'g1', completed: true }),
      ]
      expect(countGroupIncomplete(tasks, 'g1')).toBe(1)
    })
  })

  describe('countFilteredGroupIncomplete', () => {
    it('should count incomplete tasks with no filters', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', completed: false }),
        makeTask({ id: 't2', groupId: 'g2', completed: false }),
        makeTask({ id: 't3', groupId: 'g1', completed: true }),
      ]
      expect(countFilteredGroupIncomplete(tasks, 'g1', {
        priority: FILTER_PRIORITY_ALL,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_ALL,
      })).toBe(1)
    })

    it('should count incomplete tasks with priority filter', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', completed: false, priority: PRIORITIES.HIGH }),
        makeTask({ id: 't2', groupId: 'g1', completed: false, priority: PRIORITIES.LOW }),
        makeTask({ id: 't3', groupId: 'g1', completed: true, priority: PRIORITIES.HIGH }),
      ]
      expect(countFilteredGroupIncomplete(tasks, 'g1', {
        priority: PRIORITIES.HIGH,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_ALL,
      })).toBe(1)
    })

    it('should count incomplete tasks with status filter', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', completed: false }),
        makeTask({ id: 't2', groupId: 'g1', completed: true }),
        makeTask({ id: 't3', groupId: 'g1', completed: false }),
      ]
      expect(countFilteredGroupIncomplete(tasks, 'g1', {
        priority: FILTER_PRIORITY_ALL,
        status: FILTER_STATUS_DONE,
        dueDate: FILTER_DUE_ALL,
      })).toBe(0)
    })

    it('should count incomplete tasks with due date filter', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', completed: false, dueDate: today }),
        makeTask({ id: 't2', groupId: 'g1', completed: false, dueDate: yesterday }),
        makeTask({ id: 't3', groupId: 'g1', completed: false, dueDate: null }),
      ]
      expect(countFilteredGroupIncomplete(tasks, 'g1', {
        priority: FILTER_PRIORITY_ALL,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_OVERDUE,
      })).toBe(1)
    })

    it('should handle null filters (no filtering)', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', completed: false }),
        makeTask({ id: 't2', groupId: 'g1', completed: true }),
      ]
      expect(countFilteredGroupIncomplete(tasks, 'g1', null)).toBe(1)
    })

    it('should not count subtask when parent root task does not pass filter', () => {
      const sub = makeTask({ id: 's1', groupId: 'g1', completed: false, priority: PRIORITIES.HIGH })
      const task = makeTask({ id: 't1', groupId: 'g1', completed: false, priority: PRIORITIES.LOW, subtasks: [sub] })
      expect(countFilteredGroupIncomplete([task], 'g1', {
        priority: PRIORITIES.HIGH,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_ALL,
      })).toBe(0)
    })

    it('should count subtasks when parent root task passes filter', () => {
      const sub = makeTask({ id: 's1', groupId: 'g1', completed: false, priority: PRIORITIES.LOW })
      const task = makeTask({ id: 't1', groupId: 'g1', completed: false, priority: PRIORITIES.HIGH, subtasks: [sub] })
      expect(countFilteredGroupIncomplete([task], 'g1', {
        priority: PRIORITIES.HIGH,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_ALL,
      })).toBe(2)
    })

    it('should use same filter strategy as getGroupTasks (root-first)', () => {
      const subHigh = makeTask({ id: 's1', groupId: 'g1', completed: false, priority: PRIORITIES.HIGH })
      const parentLow = makeTask({ id: 't1', groupId: 'g1', completed: false, priority: PRIORITIES.LOW, subtasks: [subHigh] })
      const parentHigh = makeTask({ id: 't2', groupId: 'g1', completed: false, priority: PRIORITIES.HIGH })

      const tasks = [parentLow, parentHigh]
      const filters = { priority: PRIORITIES.HIGH, status: FILTER_STATUS_ALL, dueDate: FILTER_DUE_ALL }

      const rootTasks = tasks.filter(t => t.groupId === 'g1' && !t.parentId)
      const filteredRoot = filterTasks(rootTasks, filters)

      expect(filteredRoot.map(t => t.id)).toEqual(['t2'])
      expect(countFilteredGroupIncomplete(tasks, 'g1', filters)).toBe(1)
    })

    it('should handle ALL_TASKS_VIEW group id', () => {
      const tasks = [
        makeTask({ id: 't1', groupId: 'g1', completed: false }),
        makeTask({ id: 't2', groupId: 'g2', completed: false }),
      ]
      expect(countFilteredGroupIncomplete(tasks, ALL_TASKS_VIEW, {
        priority: FILTER_PRIORITY_ALL,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_ALL,
      })).toBe(2)
    })
  })

  describe('countFilteredAllIncomplete', () => {
    it('should count all incomplete root tasks with no filters', () => {
      const tasks = [
        makeTask({ id: 't1', completed: false }),
        makeTask({ id: 't2', completed: true }),
        makeTask({ id: 't3', completed: false }),
      ]
      expect(countFilteredAllIncomplete(tasks, {
        priority: FILTER_PRIORITY_ALL,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_ALL,
      })).toBe(2)
    })

    it('should count with priority filter', () => {
      const tasks = [
        makeTask({ id: 't1', completed: false, priority: PRIORITIES.HIGH }),
        makeTask({ id: 't2', completed: false, priority: PRIORITIES.LOW }),
      ]
      expect(countFilteredAllIncomplete(tasks, {
        priority: PRIORITIES.HIGH,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_ALL,
      })).toBe(1)
    })

    it('should handle null filters', () => {
      const tasks = [
        makeTask({ id: 't1', completed: false }),
        makeTask({ id: 't2', completed: true }),
      ]
      expect(countFilteredAllIncomplete(tasks, null)).toBe(1)
    })

    it('should include subtasks in incomplete count (matching original behavior)', () => {
      const sub = makeTask({ id: 's1', completed: false, parentId: 't1' })
      const task = makeTask({ id: 't1', completed: false, subtasks: [sub] })
      expect(countFilteredAllIncomplete([task], {
        priority: FILTER_PRIORITY_ALL,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_ALL,
      })).toBe(2)
    })

    it('should not count subtask when parent root task does not pass filter', () => {
      const sub = makeTask({ id: 's1', completed: false, priority: PRIORITIES.HIGH, parentId: 't1' })
      const task = makeTask({ id: 't1', completed: false, priority: PRIORITIES.LOW, subtasks: [sub] })
      expect(countFilteredAllIncomplete([task], {
        priority: PRIORITIES.HIGH,
        status: FILTER_STATUS_ALL,
        dueDate: FILTER_DUE_ALL,
      })).toBe(0)
    })

    it('should use same filter strategy as countFilteredGroupIncomplete', () => {
      const subHigh = makeTask({ id: 's1', groupId: 'g1', completed: false, priority: PRIORITIES.HIGH, parentId: 't1' })
      const parentLow = makeTask({ id: 't1', groupId: 'g1', completed: false, priority: PRIORITIES.LOW, subtasks: [subHigh] })
      const parentHigh = makeTask({ id: 't2', groupId: 'g1', completed: false, priority: PRIORITIES.HIGH })

      const tasks = [parentLow, parentHigh]
      const filters = { priority: PRIORITIES.HIGH, status: FILTER_STATUS_ALL, dueDate: FILTER_DUE_ALL }

      const groupCount = countFilteredGroupIncomplete(tasks, ALL_TASKS_VIEW, filters)
      const allCount = countFilteredAllIncomplete(tasks, filters)

      expect(groupCount).toBe(1)
      expect(allCount).toBe(1)
      expect(groupCount).toBe(allCount)
    })
  })

  describe('filtering', () => {
    const today = getTodayKey()
    const yesterday = addDays(today, -1)
    const tomorrow = addDays(today, 1)

    it('should filter by priority', () => {
      const tasks = [
        makeTask({ id: 't1', priority: PRIORITIES.HIGH }),
        makeTask({ id: 't2', priority: PRIORITIES.LOW }),
      ]
      const result = filterTasks(tasks, { priority: PRIORITIES.HIGH })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t1')
    })

    it('should filter by status pending', () => {
      const tasks = [
        makeTask({ id: 't1', completed: false }),
        makeTask({ id: 't2', completed: true }),
      ]
      const result = filterTasks(tasks, { status: FILTER_STATUS_PENDING })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t1')
    })

    it('should filter by status done', () => {
      const tasks = [
        makeTask({ id: 't1', completed: false }),
        makeTask({ id: 't2', completed: true }),
      ]
      const result = filterTasks(tasks, { status: FILTER_STATUS_DONE })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t2')
    })

    it('should filter by due today', () => {
      const tasks = [
        makeTask({ id: 't1', dueDate: today }),
        makeTask({ id: 't2', dueDate: tomorrow }),
      ]
      const result = filterTasks(tasks, { dueDate: FILTER_DUE_TODAY })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t1')
    })

    it('should filter by overdue', () => {
      const tasks = [
        makeTask({ id: 't1', dueDate: yesterday }),
        makeTask({ id: 't2', dueDate: today }),
      ]
      const result = filterTasks(tasks, { dueDate: FILTER_DUE_OVERDUE })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t1')
    })

    it('should apply multiple filters with AND logic', () => {
      const tasks = [
        makeTask({ id: 't1', priority: PRIORITIES.HIGH, completed: false, dueDate: yesterday }),
        makeTask({ id: 't2', priority: PRIORITIES.HIGH, completed: true, dueDate: yesterday }),
        makeTask({ id: 't3', priority: PRIORITIES.LOW, completed: false, dueDate: yesterday }),
      ]
      const result = filterTasks(tasks, { priority: PRIORITIES.HIGH, status: FILTER_STATUS_PENDING, dueDate: FILTER_DUE_OVERDUE })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t1')
    })

    it('should return all tasks when no filters active', () => {
      const tasks = [makeTask({ id: 't1' }), makeTask({ id: 't2' })]
      const result = filterTasks(tasks, { priority: FILTER_PRIORITY_ALL, status: FILTER_STATUS_ALL, dueDate: FILTER_DUE_ALL })
      expect(result).toHaveLength(2)
    })
  })

  describe('getOverdueCount', () => {
    it('should count overdue incomplete tasks', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const tasks = [
        makeTask({ id: 't1', dueDate: yesterday, completed: false }),
        makeTask({ id: 't2', dueDate: yesterday, completed: true }),
        makeTask({ id: 't3', dueDate: today, completed: false }),
      ]
      expect(getOverdueCount(tasks)).toBe(1)
    })
  })

  describe('sortTasksWithOverdueFirst', () => {
    it('should put overdue incomplete tasks first', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const tasks = [
        makeTask({ id: 't1', dueDate: today, completed: false }),
        makeTask({ id: 't2', dueDate: yesterday, completed: false }),
        makeTask({ id: 't3', dueDate: null, completed: false }),
      ]
      const result = sortTasksWithOverdueFirst(tasks)
      expect(result[0].id).toBe('t2')
    })
  })

  describe('streak and checkin', () => {
    it('recordCheckin should add today to checkins', () => {
      const today = getTodayKey()
      const result = recordCheckin([])
      expect(result).toContain(today)
    })

    it('recordCheckin should not duplicate today', () => {
      const today = getTodayKey()
      const result = recordCheckin([today])
      expect(result).toHaveLength(1)
    })

    it('calculateStreak should return 0 for empty checkins', () => {
      expect(calculateStreak([])).toBe(0)
      expect(calculateStreak(null)).toBe(0)
    })

    it('calculateStreak should count consecutive days from today', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const dayBefore = addDays(today, -2)
      expect(calculateStreak([today, yesterday, dayBefore])).toBe(3)
    })

    it('calculateStreak should count from yesterday if today not checked in', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const dayBefore = addDays(today, -2)
      expect(calculateStreak([yesterday, dayBefore])).toBe(2)
    })

    it('calculateStreak should return 0 if streak is broken', () => {
      const today = getTodayKey()
      const threeDaysAgo = addDays(today, -3)
      expect(calculateStreak([threeDaysAgo])).toBe(0)
    })

    it('calculateMaxStreak should find longest streak', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const dayBefore = addDays(today, -2)
      const fiveDaysAgo = addDays(today, -5)
      const sixDaysAgo = addDays(today, -6)
      expect(calculateMaxStreak([sixDaysAgo, fiveDaysAgo, dayBefore, yesterday, today])).toBe(3)
    })

    it('calculateMaxStreak should return 0 for empty', () => {
      expect(calculateMaxStreak([])).toBe(0)
      expect(calculateMaxStreak(null)).toBe(0)
    })

    it('calculateMaxStreak should handle single day', () => {
      expect(calculateMaxStreak([getTodayKey()])).toBe(1)
    })

    it('shouldAutoCheckin should return false when already checked in', () => {
      const today = getTodayKey()
      expect(shouldAutoCheckin([makeTask({ completed: true })], [today])).toBe(false)
    })

    it('shouldAutoCheckin should return true when tasks completed and not checked in', () => {
      expect(shouldAutoCheckin([makeTask({ completed: true })], [])).toBe(true)
    })

    it('shouldAutoCheckin should return false when no completed tasks', () => {
      expect(shouldAutoCheckin([makeTask({ completed: false })], [])).toBe(false)
    })
  })

  describe('buildHeatmapData', () => {
    it('should return correct number of days', () => {
      const result = buildHeatmapData([], 7)
      expect(result).toHaveLength(7)
    })

    it('should mark checkin days', () => {
      const today = getTodayKey()
      const result = buildHeatmapData([today], 7)
      const todayEntry = result.find(d => d.date === today)
      expect(todayEntry.count).toBe(1)
    })

    it('should mark non-checkin days with 0', () => {
      const result = buildHeatmapData([], 7)
      result.forEach(d => {
        expect(d.count).toBe(0)
      })
    })
  })

  describe('getHeatmapColor', () => {
    it('should return correct colors for counts', () => {
      expect(getHeatmapColor(0)).toBe('#ebedf0')
      expect(getHeatmapColor(1)).toBe('#9be9a8')
      expect(getHeatmapColor(2)).toBe('#40c463')
      expect(getHeatmapColor(3)).toBe('#30a14e')
      expect(getHeatmapColor(5)).toBe('#216e39')
    })
  })

  describe('localStorage persistence', () => {
    let storage
    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadGroups should return defaults when empty', () => {
      const groups = loadGroups(storage)
      expect(groups).toHaveLength(3)
      expect(groups[0].name).toBe('工作')
    })

    it('loadGroups and saveGroups should round-trip', () => {
      const groups = [{ id: 'g1', name: 'Test', color: '#3b82f6' }]
      saveGroups(groups, storage)
      const loaded = loadGroups(storage)
      expect(loaded).toEqual(groups)
    })

    it('loadTasks should return empty array when empty', () => {
      expect(loadTasks(storage)).toEqual([])
    })

    it('loadTasks and saveTasks should round-trip', () => {
      const tasks = [makeTask({ id: 't1' })]
      saveTasks(tasks, storage)
      const loaded = loadTasks(storage)
      expect(loaded[0].id).toBe('t1')
    })

    it('loadCheckins should return empty array when empty', () => {
      expect(loadCheckins(storage)).toEqual([])
    })

    it('loadCheckins and saveCheckins should round-trip', () => {
      const checkins = ['2024-06-15']
      saveCheckins(checkins, storage)
      expect(loadCheckins(storage)).toEqual(checkins)
    })

    it('should handle invalid JSON gracefully', () => {
      storage.setItem(STORAGE_KEY_GROUPS, 'invalid')
      expect(loadGroups(storage)).toHaveLength(3)
      storage.setItem(STORAGE_KEY_TASKS, 'invalid')
      expect(loadTasks(storage)).toEqual([])
      storage.setItem(STORAGE_KEY_CHECKINS, 'invalid')
      expect(loadCheckins(storage)).toEqual([])
    })

    it('should not throw when storage is null', () => {
      expect(() => loadGroups(null)).not.toThrow()
      expect(() => saveGroups([], null)).not.toThrow()
      expect(() => loadTasks(null)).not.toThrow()
      expect(() => saveTasks([], null)).not.toThrow()
      expect(() => loadCheckins(null)).not.toThrow()
      expect(() => saveCheckins([], null)).not.toThrow()
    })
  })
})
