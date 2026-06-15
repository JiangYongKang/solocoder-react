import {
  STORAGE_KEY_GROUPS,
  STORAGE_KEY_TASKS,
  STORAGE_KEY_CHECKINS,
  DEFAULT_GROUPS,
  PRIORITIES,
  ALL_TASKS_VIEW,
  FILTER_PRIORITY_ALL,
  FILTER_STATUS_PENDING,
  FILTER_STATUS_DONE,
  FILTER_DUE_ALL,
  FILTER_DUE_TODAY,
  FILTER_DUE_WEEK,
  FILTER_DUE_OVERDUE,
} from './constants'

export function generateId() {
  return 'td_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getTodayKey() {
  return formatDate(new Date())
}

export function parseDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(dateKey, days) {
  const d = parseDate(dateKey)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

export function loadGroups(storage) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return structuredClone(DEFAULT_GROUPS)
  try {
    const raw = s.getItem(STORAGE_KEY_GROUPS)
    if (!raw) {
      const defaults = structuredClone(DEFAULT_GROUPS)
      saveGroups(defaults, s)
      return defaults
    }
    return JSON.parse(raw)
  } catch {
    return structuredClone(DEFAULT_GROUPS)
  }
}

export function saveGroups(groups, storage) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return
  try {
    s.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups))
  } catch { /* ignore */ }
}

export function loadTasks(storage) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return []
  try {
    const raw = s.getItem(STORAGE_KEY_TASKS)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveTasks(tasks, storage) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return
  try {
    s.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks))
  } catch { /* ignore */ }
}

export function loadCheckins(storage) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return []
  try {
    const raw = s.getItem(STORAGE_KEY_CHECKINS)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveCheckins(checkins, storage) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return
  try {
    s.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(checkins))
  } catch { /* ignore */ }
}

export function createGroup(groups, name, color) {
  const newGroup = {
    id: generateId(),
    name: name.trim(),
    color,
  }
  return [...groups, newGroup]
}

export function renameGroup(groups, groupId, newName) {
  return groups.map(g =>
    g.id === groupId ? { ...g, name: newName.trim() } : g
  )
}

export function deleteGroup(groups, groupId) {
  return groups.filter(g => g.id !== groupId)
}

export function createTask(tasks, { groupId, parentId, title, priority, dueDate }) {
  const newTask = {
    id: generateId(),
    groupId,
    parentId: parentId || null,
    title: title.trim(),
    completed: false,
    priority: priority || PRIORITIES.MEDIUM,
    dueDate: dueDate || null,
    subtasks: [],
    order: tasks.filter(t => t.groupId === groupId && !t.parentId).length,
    createdAt: Date.now(),
  }
  return [...tasks, newTask]
}

export function updateTask(tasks, taskId, updates) {
  return tasks.map(t => {
    if (t.id === taskId) return { ...t, ...updates }
    if (t.subtasks && t.subtasks.length > 0) {
      const updatedSubtasks = updateTask(t.subtasks, taskId, updates)
      if (updatedSubtasks !== t.subtasks) {
        return { ...t, subtasks: updatedSubtasks }
      }
    }
    return t
  })
}

export function deleteTask(tasks, taskId) {
  return tasks
    .filter(t => t.id !== taskId)
    .map(t => {
      if (t.subtasks && t.subtasks.length > 0) {
        const updatedSubtasks = deleteTask(t.subtasks, taskId)
        if (updatedSubtasks !== t.subtasks) {
          return { ...t, subtasks: updatedSubtasks }
        }
      }
      return t
    })
}

export function deleteTasksByGroup(tasks, groupId) {
  return tasks.filter(t => t.groupId !== groupId)
}

export function findTaskById(tasks, taskId) {
  for (const t of tasks) {
    if (t.id === taskId) return t
    if (t.subtasks && t.subtasks.length > 0) {
      const found = findTaskById(t.subtasks, taskId)
      if (found) return found
    }
  }
  return null
}

export function findParentTask(tasks, childId) {
  for (const t of tasks) {
    if (t.subtasks && t.subtasks.some(s => s.id === childId)) return t
    if (t.subtasks && t.subtasks.length > 0) {
      const found = findParentTask(t.subtasks, childId)
      if (found) return found
    }
  }
  return null
}

export function addSubtask(tasks, parentId, subtaskData) {
  return tasks.map(t => {
    if (t.id === parentId) {
      const newSub = {
        id: generateId(),
        groupId: t.groupId,
        parentId,
        title: subtaskData.title.trim(),
        completed: false,
        priority: subtaskData.priority || PRIORITIES.MEDIUM,
        dueDate: subtaskData.dueDate || null,
        subtasks: [],
        order: t.subtasks.length,
        createdAt: Date.now(),
      }
      return { ...t, subtasks: [...t.subtasks, newSub] }
    }
    if (t.subtasks && t.subtasks.length > 0) {
      const updatedSubtasks = addSubtask(t.subtasks, parentId, subtaskData)
      if (updatedSubtasks !== t.subtasks) {
        return { ...t, subtasks: updatedSubtasks }
      }
    }
    return t
  })
}

export function calculateProgress(task) {
  if (!task.subtasks || task.subtasks.length === 0) {
    return { completed: task.completed ? 1 : 0, total: 1, percentage: task.completed ? 100 : 0 }
  }
  const completed = task.subtasks.filter(s => s.completed).length
  const total = task.subtasks.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percentage }
}

export function recalculateParentCompletion(tasks) {
  return tasks.map(t => {
    let updated = t
    if (updated.subtasks && updated.subtasks.length > 0) {
      const recalculatedSubs = recalculateParentCompletion(updated.subtasks)
      updated = { ...updated, subtasks: recalculatedSubs }
      const allDone = updated.subtasks.every(s => s.completed)
      const anyUndone = updated.subtasks.some(s => !s.completed)
      if (allDone && !updated.completed) {
        updated = { ...updated, completed: true }
      } else if (anyUndone && updated.completed) {
        updated = { ...updated, completed: false }
      }
    }
    return updated
  })
}

export function toggleTaskCompletion(tasks, taskId) {
  const task = findTaskById(tasks, taskId)
  if (!task) return tasks

  const newCompleted = !task.completed
  let updated = setTaskCompletion(tasks, taskId, newCompleted)

  if (newCompleted && task.subtasks && task.subtasks.length > 0) {
    updated = setAllSubtasksCompletion(updated, taskId, true)
  }

  updated = recalculateParentCompletion(updated)
  return updated
}

export function setTaskCompletion(tasks, taskId, completed) {
  return tasks.map(t => {
    if (t.id === taskId) return { ...t, completed }
    if (t.subtasks && t.subtasks.length > 0) {
      const updatedSubtasks = setTaskCompletion(t.subtasks, taskId, completed)
      if (updatedSubtasks !== t.subtasks) {
        return { ...t, subtasks: updatedSubtasks }
      }
    }
    return t
  })
}

export function setAllSubtasksCompletion(tasks, parentId, completed) {
  return tasks.map(t => {
    if (t.id === parentId && t.subtasks && t.subtasks.length > 0) {
      const updatedSubs = t.subtasks.map(s => ({
        ...s,
        completed,
        subtasks: s.subtasks ? setAllSubtasksCompletionRecursive(s.subtasks, completed) : [],
      }))
      return { ...t, subtasks: updatedSubs }
    }
    if (t.subtasks && t.subtasks.length > 0) {
      const updatedSubtasks = setAllSubtasksCompletion(t.subtasks, parentId, completed)
      if (updatedSubtasks !== t.subtasks) {
        return { ...t, subtasks: updatedSubtasks }
      }
    }
    return t
  })
}

function setAllSubtasksCompletionRecursive(tasks, completed) {
  return tasks.map(t => ({
    ...t,
    completed,
    subtasks: t.subtasks ? setAllSubtasksCompletionRecursive(t.subtasks, completed) : [],
  }))
}

export function reorderTasks(tasks, fromIndex, toIndex) {
  const list = [...tasks]
  const [removed] = list.splice(fromIndex, 1)
  const safeIndex = Math.max(0, Math.min(toIndex, list.length))
  list.splice(safeIndex, 0, removed)
  return list.map((t, i) => ({ ...t, order: i }))
}

export function reorderSubtasks(tasks, parentId, fromIndex, toIndex) {
  return tasks.map(t => {
    if (t.id === parentId) {
      const reordered = reorderTasks(t.subtasks, fromIndex, toIndex)
      return { ...t, subtasks: reordered }
    }
    if (t.subtasks && t.subtasks.length > 0) {
      const updatedSubtasks = reorderSubtasks(t.subtasks, parentId, fromIndex, toIndex)
      if (updatedSubtasks !== t.subtasks) {
        return { ...t, subtasks: updatedSubtasks }
      }
    }
    return t
  })
}

export function reorderGroupRootTasks(tasks, groupId, fromId, toIndex) {
  const rootTasks = tasks.filter(t => !t.parentId)
  const groupRootTasks = groupId === ALL_TASKS_VIEW
    ? [...rootTasks]
    : rootTasks.filter(t => t.groupId === groupId)
  const otherRootTasks = groupId === ALL_TASKS_VIEW
    ? []
    : rootTasks.filter(t => t.groupId !== groupId)

  const fromIndex = groupRootTasks.findIndex(t => t.id === fromId)
  if (fromIndex === -1) return tasks

  const [removed] = groupRootTasks.splice(fromIndex, 1)
  const safeIndex = Math.max(0, Math.min(toIndex, groupRootTasks.length))
  groupRootTasks.splice(safeIndex, 0, removed)

  const reorderedGroupTasks = groupRootTasks.map((t, i) => ({ ...t, order: i }))
  const subtaskTasks = tasks.filter(t => t.parentId)

  if (groupId === ALL_TASKS_VIEW) {
    return [...reorderedGroupTasks, ...subtaskTasks]
  }

  return [...reorderedGroupTasks, ...otherRootTasks, ...subtaskTasks]
}

export function isOverdue(dueDate) {
  if (!dueDate) return false
  const today = getTodayKey()
  return dueDate < today
}

export function isDueToday(dueDate) {
  if (!dueDate) return false
  return dueDate === getTodayKey()
}

export function isDueTomorrow(dueDate) {
  if (!dueDate) return false
  const tomorrow = addDays(getTodayKey(), 1)
  return dueDate === tomorrow
}

export function isDueThisWeek(dueDate) {
  if (!dueDate) return false
  const today = parseDate(getTodayKey())
  const due = parseDate(dueDate)
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return due >= monday && due <= sunday
}

export function getDueDateLabel(dueDate) {
  if (!dueDate) return null
  if (isOverdue(dueDate)) return { text: '已过期', color: '#ef4444', type: 'overdue' }
  if (isDueToday(dueDate)) return { text: '今天到期', color: '#f59e0b', type: 'today' }
  if (isDueTomorrow(dueDate)) return { text: '明天到期', color: '#3b82f6', type: 'tomorrow' }
  return null
}

export function flattenTasks(tasks) {
  const result = []
  for (const t of tasks) {
    result.push(t)
    if (t.subtasks && t.subtasks.length > 0) {
      result.push(...flattenTasks(t.subtasks))
    }
  }
  return result
}

export function countIncompleteTasks(tasks) {
  let count = 0
  for (const t of tasks) {
    if (!t.completed) count++
    if (t.subtasks && t.subtasks.length > 0) {
      count += countIncompleteTasks(t.subtasks)
    }
  }
  return count
}

export function countGroupIncomplete(tasks, groupId) {
  const groupTasks = tasks.filter(t => t.groupId === groupId)
  return countIncompleteTasks(groupTasks)
}

export function countAllIncomplete(tasks) {
  return countIncompleteTasks(tasks.filter(t => !t.parentId))
}

export function countFilteredGroupIncomplete(tasks, groupId, filters) {
  let rootTasks = groupId === ALL_TASKS_VIEW
    ? tasks.filter(t => !t.parentId)
    : tasks.filter(t => t.groupId === groupId && !t.parentId)
  if (filters) {
    rootTasks = filterTasks(rootTasks, filters)
  }
  return countIncompleteTasks(rootTasks)
}

export function countFilteredAllIncomplete(tasks, filters) {
  let rootTasks = tasks.filter(t => !t.parentId)
  if (filters) {
    rootTasks = filterTasks(rootTasks, filters)
  }
  return countIncompleteTasks(rootTasks)
}

export function applyFiltersToTask(task, filters) {
  if (filters.priority && filters.priority !== FILTER_PRIORITY_ALL) {
    if (task.priority !== filters.priority) return false
  }
  if (filters.status === FILTER_STATUS_PENDING && task.completed) return false
  if (filters.status === FILTER_STATUS_DONE && !task.completed) return false

  if (filters.dueDate && filters.dueDate !== FILTER_DUE_ALL) {
    if (!task.dueDate) return false
    switch (filters.dueDate) {
      case FILTER_DUE_TODAY:
        if (!isDueToday(task.dueDate)) return false
        break
      case FILTER_DUE_WEEK:
        if (!isDueThisWeek(task.dueDate)) return false
        break
      case FILTER_DUE_OVERDUE:
        if (!isOverdue(task.dueDate)) return false
        break
    }
  }
  return true
}

export function filterTasks(tasks, filters) {
  return tasks.filter(t => applyFiltersToTask(t, filters))
}

export function getOverdueCount(tasks) {
  return tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length
}

export function sortTasksWithOverdueFirst(tasks) {
  const overdue = tasks.filter(t => !t.completed && isOverdue(t.dueDate))
  const rest = tasks.filter(t => !(!t.completed && isOverdue(t.dueDate)))
  return [...overdue, ...rest]
}

export function recordCheckin(checkins) {
  const today = getTodayKey()
  if (checkins.includes(today)) return checkins
  return [...checkins, today]
}

export function calculateStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0
  const sorted = [...checkins].sort().reverse()
  const today = getTodayKey()
  const yesterday = addDays(today, -1)

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let streak = 0
  let expected = sorted[0] === today ? today : yesterday

  for (const date of sorted) {
    if (date === expected) {
      streak++
      expected = addDays(expected, -1)
    } else if (date < expected) {
      break
    }
  }
  return streak
}

export function calculateMaxStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0
  const sorted = [...checkins].sort()
  let maxStreak = 1
  let currentStreak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseDate(sorted[i - 1])
    const curr = parseDate(sorted[i])
    const diffDays = Math.round((curr - prev) / 86400000)
    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else if (diffDays > 1) {
      currentStreak = 1
    }
  }
  return maxStreak
}

export function shouldAutoCheckin(tasks, checkins) {
  const today = getTodayKey()
  if (checkins.includes(today)) return false
  return tasks.some(t => t.completed)
}

export function buildHeatmapData(checkins, days = 91) {
  const today = parseDate(getTodayKey())
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = formatDate(d)
    result.push({
      date: key,
      count: checkins.includes(key) ? 1 : 0,
    })
  }
  return result
}

export function getHeatmapColor(count) {
  if (count === 0) return '#ebedf0'
  if (count === 1) return '#9be9a8'
  if (count === 2) return '#40c463'
  if (count === 3) return '#30a14e'
  return '#216e39'
}
