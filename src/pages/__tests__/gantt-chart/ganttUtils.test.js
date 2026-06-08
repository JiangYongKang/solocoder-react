import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  formatDate,
  parseDate,
  addDays,
  diffDays,
  isWeekend,
  isSameDay,
  getWeekStart,
  getMonthStart,
  getMonthEnd,
  loadTasks,
  saveTasks,
  addTask,
  updateTask,
  deleteTask,
  getChildren,
  getTask,
  getVisibleTasks,
  toggleExpanded,
  addDependency,
  removeDependency,
  wouldCreateCycle,
  getDateRange,
  getTimelineDays,
  getWeekGroups,
  getMonthGroups,
  validateTask,
  calculateBarPosition,
  pxToDate,
  dateToPx,
  getDependencyPath,
  getTaskRowIndex,
} from '@/pages/gantt-chart/ganttUtils.js';
import { STORAGE_KEY, ZOOM_LEVELS, DAY_WIDTH } from '@/pages/gantt-chart/constants.js';

function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    _store: store,
  };
}

function createSimpleState() {
  return {
    tasks: [
      {
        id: 't1',
        name: '任务1',
        assignee: '张三',
        progress: 50,
        startDate: '2025-01-06',
        endDate: '2025-01-10',
        parentId: null,
        dependencies: [],
        expanded: true,
      },
      {
        id: 't2',
        name: '任务2',
        assignee: '李四',
        progress: 30,
        startDate: '2025-01-13',
        endDate: '2025-01-17',
        parentId: null,
        dependencies: ['t1'],
        expanded: false,
      },
      {
        id: 't3',
        name: '子任务',
        assignee: '王五',
        progress: 0,
        startDate: '2025-01-07',
        endDate: '2025-01-08',
        parentId: 't1',
        dependencies: [],
        expanded: false,
      },
    ],
  };
}

describe('ganttUtils - ID generation', () => {
  it('generateId should return non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generateId should produce unique values', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('ganttUtils - Date utilities', () => {
  it('formatDate should output YYYY-MM-DD', () => {
    const d = new Date(2025, 0, 15);
    expect(formatDate(d)).toBe('2025-01-15');
  });

  it('formatDate handles null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('parseDate should parse YYYY-MM-DD', () => {
    const d = parseDate('2025-01-15');
    expect(d).toBeTruthy();
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it('parseDate returns null for invalid', () => {
    expect(parseDate('not-a-date')).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate(null)).toBeNull();
  });

  it('addDays should add N days', () => {
    const d = new Date(2025, 0, 10);
    const result = addDays(d, 5);
    expect(result.getDate()).toBe(15);
  });

  it('addDays should handle negative values', () => {
    const d = new Date(2025, 0, 10);
    const result = addDays(d, -3);
    expect(result.getDate()).toBe(7);
  });

  it('diffDays should count days between dates', () => {
    const a = new Date(2025, 0, 1);
    const b = new Date(2025, 0, 10);
    expect(diffDays(a, b)).toBe(9);
  });

  it('diffDays should handle same day', () => {
    const a = new Date(2025, 0, 1);
    expect(diffDays(a, a)).toBe(0);
  });

  it('isWeekend should detect Saturday and Sunday', () => {
    const saturday = new Date(2025, 0, 4);
    const sunday = new Date(2025, 0, 5);
    const monday = new Date(2025, 0, 6);
    expect(isWeekend(saturday)).toBe(true);
    expect(isWeekend(sunday)).toBe(true);
    expect(isWeekend(monday)).toBe(false);
  });

  it('isSameDay should compare day equality', () => {
    const a = new Date(2025, 0, 10, 10, 30);
    const b = new Date(2025, 0, 10, 18, 0);
    const c = new Date(2025, 0, 11);
    expect(isSameDay(a, b)).toBe(true);
    expect(isSameDay(a, c)).toBe(false);
  });

  it('getWeekStart returns Monday of the week', () => {
    const wednesday = new Date(2025, 0, 8);
    const start = getWeekStart(wednesday);
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(6);
  });

  it('getMonthStart returns first day of month', () => {
    const d = new Date(2025, 0, 15);
    const start = getMonthStart(d);
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(0);
  });

  it('getMonthEnd returns last day of month', () => {
    const d = new Date(2025, 0, 15);
    const end = getMonthEnd(d);
    expect(end.getMonth()).toBe(0);
    expect(end.getDate()).toBe(31);
  });

  it('getMonthEnd handles February leap year', () => {
    const d = new Date(2024, 1, 10);
    const end = getMonthEnd(d);
    expect(end.getDate()).toBe(29);
  });
});

describe('ganttUtils - localStorage persistence', () => {
  let storage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('loadTasks should return defaults when empty and persist them', () => {
    const data = loadTasks(storage);
    expect(Array.isArray(data.tasks)).toBe(true);
    expect(data.tasks.length).toBeGreaterThan(0);
    expect(storage.getItem(STORAGE_KEY)).toBeTruthy();
  });

  it('saveTasks and loadTasks should round-trip', () => {
    const state = { tasks: [{ id: 'x', name: 'Test' }] };
    saveTasks(state, storage);
    const loaded = loadTasks(storage);
    expect(loaded.tasks.length).toBe(1);
    expect(loaded.tasks[0].name).toBe('Test');
  });

  it('loadTasks should handle corrupted JSON', () => {
    storage.setItem(STORAGE_KEY, '{broken json');
    const data = loadTasks(storage);
    expect(Array.isArray(data.tasks)).toBe(true);
  });

  it('loadTasks should handle missing tasks array', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    const data = loadTasks(storage);
    expect(Array.isArray(data.tasks)).toBe(true);
  });

  it('should not throw when storage is null', () => {
    expect(() => loadTasks(null)).not.toThrow();
    expect(() => saveTasks({ tasks: [] }, null)).not.toThrow();
  });
});

describe('ganttUtils - Task CRUD', () => {
  it('addTask should add a new task with defaults', () => {
    const state = { tasks: [] };
    const result = addTask(state, { name: '新任务' });
    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].name).toBe('新任务');
    expect(result.tasks[0].id).toBeTruthy();
    expect(result.tasks[0].progress).toBe(0);
  });

  it('addTask should not mutate original state', () => {
    const state = { tasks: [] };
    const frozen = JSON.stringify(state);
    addTask(state, { name: 'Test' });
    expect(JSON.stringify(state)).toBe(frozen);
  });

  it('addTask with parentId sets parent correctly', () => {
    const state = { tasks: [] };
    const result = addTask(state, { name: '子任务' }, 'parent-1');
    expect(result.tasks[0].parentId).toBe('parent-1');
  });

  it('updateTask should update specific fields', () => {
    const state = createSimpleState();
    const result = updateTask(state, 't1', { name: '更新后的任务', progress: 80 });
    const updated = result.tasks.find((t) => t.id === 't1');
    expect(updated.name).toBe('更新后的任务');
    expect(updated.progress).toBe(80);
  });

  it('updateTask should clamp progress to 0-100', () => {
    const state = createSimpleState();
    const result = updateTask(state, 't1', { progress: 150 });
    expect(result.tasks.find((t) => t.id === 't1').progress).toBe(100);
    const result2 = updateTask(state, 't1', { progress: -10 });
    expect(result2.tasks.find((t) => t.id === 't1').progress).toBe(0);
  });

  it('updateTask should not mutate original state', () => {
    const state = createSimpleState();
    const frozen = JSON.stringify(state);
    updateTask(state, 't1', { name: 'Changed' });
    expect(JSON.stringify(state)).toBe(frozen);
  });

  it('deleteTask should remove task and its children recursively', () => {
    const state = createSimpleState();
    const result = deleteTask(state, 't1');
    const ids = result.tasks.map((t) => t.id);
    expect(ids).not.toContain('t1');
    expect(ids).not.toContain('t3');
    expect(ids).toContain('t2');
  });

  it('deleteTask should clean up dependencies referencing deleted tasks', () => {
    const state = createSimpleState();
    const result = deleteTask(state, 't1');
    const t2 = result.tasks.find((t) => t.id === 't2');
    expect(t2.dependencies).not.toContain('t1');
  });

  it('getTask should find by id or return null', () => {
    const state = createSimpleState();
    expect(getTask(state, 't1').name).toBe('任务1');
    expect(getTask(state, 'nonexistent')).toBeNull();
  });

  it('getChildren should find direct children', () => {
    const state = createSimpleState();
    const children = getChildren(state, 't1');
    expect(children.length).toBe(1);
    expect(children[0].id).toBe('t3');
    expect(getChildren(state, null).length).toBe(2);
  });
});

describe('ganttUtils - Task visibility and expansion', () => {
  it('getVisibleTasks should return flat list respecting expanded state', () => {
    const state = createSimpleState();
    const visible = getVisibleTasks(state);
    expect(visible.length).toBe(3);
    expect(visible[0].id).toBe('t1');
    expect(visible[0].depth).toBe(0);
    expect(visible[1].id).toBe('t3');
    expect(visible[1].depth).toBe(1);
    expect(visible[2].id).toBe('t2');
    expect(visible[2].depth).toBe(0);
  });

  it('getVisibleTasks should hide children when parent collapsed', () => {
    const state = createSimpleState();
    state.tasks[0].expanded = false;
    const visible = getVisibleTasks(state);
    expect(visible.length).toBe(2);
    expect(visible.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('toggleExpanded should flip expanded flag', () => {
    const state = createSimpleState();
    const result = toggleExpanded(state, 't2');
    expect(result.tasks.find((t) => t.id === 't2').expanded).toBe(true);
    const result2 = toggleExpanded(result, 't2');
    expect(result2.tasks.find((t) => t.id === 't2').expanded).toBe(false);
  });

  it('getTaskRowIndex returns correct index in visible list', () => {
    const state = createSimpleState();
    expect(getTaskRowIndex(state, 't1')).toBe(0);
    expect(getTaskRowIndex(state, 't3')).toBe(1);
    expect(getTaskRowIndex(state, 't2')).toBe(2);
  });

  it('getTaskRowIndex returns -1 for non-existent or hidden', () => {
    const state = createSimpleState();
    state.tasks[0].expanded = false;
    expect(getTaskRowIndex(state, 't3')).toBe(-1);
    expect(getTaskRowIndex(state, 'nonexistent')).toBe(-1);
  });
});

describe('ganttUtils - Dependencies', () => {
  it('addDependency should add a dependency', () => {
    const state = createSimpleState();
    const result = addDependency(state, 't3', 't1');
    const t3 = result.tasks.find((t) => t.id === 't3');
    expect(t3.dependencies).toContain('t1');
  });

  it('addDependency should not add self-dependency', () => {
    const state = createSimpleState();
    const result = addDependency(state, 't1', 't1');
    expect(result.tasks.find((t) => t.id === 't1').dependencies).not.toContain('t1');
  });

  it('addDependency should not duplicate', () => {
    const state = createSimpleState();
    const result = addDependency(state, 't2', 't1');
    expect(result.tasks.find((t) => t.id === 't2').dependencies.filter((d) => d === 't1').length).toBe(1);
  });

  it('addDependency should prevent cycles', () => {
    const state = createSimpleState();
    const result = addDependency(state, 't1', 't2');
    expect(result.tasks.find((t) => t.id === 't1').dependencies).not.toContain('t2');
  });

  it('wouldCreateCycle detects direct cycle', () => {
    const state = createSimpleState();
    expect(wouldCreateCycle(state, 't1', 't2')).toBe(true);
  });

  it('wouldCreateCycle allows valid dependency', () => {
    const state = createSimpleState();
    expect(wouldCreateCycle(state, 't3', 't2')).toBe(false);
  });

  it('removeDependency should remove specified dependency', () => {
    const state = createSimpleState();
    const result = removeDependency(state, 't2', 't1');
    expect(result.tasks.find((t) => t.id === 't2').dependencies).not.toContain('t1');
  });
});

describe('ganttUtils - Timeline range and grouping', () => {
  it('getDateRange should return min/max with padding', () => {
    const state = createSimpleState();
    const { start, end } = getDateRange(state);
    const expectedStart = parseDate('2025-01-03');
    const expectedEnd = parseDate('2025-01-20');
    expect(isSameDay(start, expectedStart)).toBe(true);
    expect(isSameDay(end, expectedEnd)).toBe(true);
  });

  it('getDateRange should handle empty task list', () => {
    const state = { tasks: [] };
    const { start, end } = getDateRange(state);
    expect(start).toBeTruthy();
    expect(end).toBeTruthy();
    expect(diffDays(start, end)).toBeGreaterThan(0);
  });

  it('getTimelineDays should produce consecutive dates', () => {
    const range = { start: new Date(2025, 0, 1), end: new Date(2025, 0, 5) };
    const days = getTimelineDays(range);
    expect(days.length).toBe(5);
    expect(isSameDay(days[0], new Date(2025, 0, 1))).toBe(true);
    expect(isSameDay(days[4], new Date(2025, 0, 5))).toBe(true);
  });

  it('getWeekGroups should group days by week', () => {
    const range = { start: new Date(2025, 0, 6), end: new Date(2025, 0, 19) };
    const days = getTimelineDays(range);
    const groups = getWeekGroups(days);
    expect(groups.length).toBe(2);
    expect(groups[0].days.length).toBe(7);
    expect(groups[1].days.length).toBe(7);
  });

  it('getMonthGroups should group days by month', () => {
    const range = { start: new Date(2025, 0, 28), end: new Date(2025, 1, 3) };
    const days = getTimelineDays(range);
    const groups = getMonthGroups(days);
    expect(groups.length).toBe(2);
    expect(groups[0].start.getMonth()).toBe(0);
    expect(groups[1].start.getMonth()).toBe(1);
  });
});

describe('ganttUtils - Validation', () => {
  it('validateTask should accept valid task', () => {
    const result = validateTask({
      name: 'Valid Task',
      progress: 50,
      startDate: '2025-01-01',
      endDate: '2025-01-10',
    });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('validateTask should reject empty name', () => {
    expect(validateTask({ name: '' }).valid).toBe(false);
    expect(validateTask({ name: '   ' }).valid).toBe(false);
  });

  it('validateTask should reject out-of-range progress', () => {
    expect(validateTask({ name: 'OK', progress: 150 }).valid).toBe(false);
    expect(validateTask({ name: 'OK', progress: -5 }).valid).toBe(false);
    expect(validateTask({ name: 'OK', progress: 'notanumber' }).valid).toBe(false);
  });

  it('validateTask should reject invalid dates', () => {
    expect(validateTask({ name: 'OK', startDate: 'invalid' }).valid).toBe(false);
    expect(validateTask({ name: 'OK', endDate: 'invalid' }).valid).toBe(false);
  });

  it('validateTask should reject end before start', () => {
    const result = validateTask({
      name: 'OK',
      startDate: '2025-01-10',
      endDate: '2025-01-05',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.endDate).toBeTruthy();
  });

  it('validateTask should handle null/undefined', () => {
    expect(validateTask(null).valid).toBe(false);
    expect(validateTask(undefined).valid).toBe(false);
  });
});

describe('ganttUtils - Position calculations', () => {
  const rangeStart = new Date(2025, 0, 1);

  it('calculateBarPosition computes left and width', () => {
    const task = { startDate: '2025-01-05', endDate: '2025-01-09' };
    const pos = calculateBarPosition(task, rangeStart, ZOOM_LEVELS.DAY);
    const dayWidth = DAY_WIDTH[ZOOM_LEVELS.DAY];
    expect(pos.left).toBe(4 * dayWidth);
    expect(pos.width).toBe(5 * dayWidth);
  });

  it('dateToPx converts date to pixels', () => {
    const px = dateToPx(new Date(2025, 0, 3), rangeStart, ZOOM_LEVELS.DAY);
    expect(px).toBe(2 * DAY_WIDTH[ZOOM_LEVELS.DAY]);
  });

  it('pxToDate converts pixels to date', () => {
    const dayWidth = DAY_WIDTH[ZOOM_LEVELS.DAY];
    const d = pxToDate(5 * dayWidth, rangeStart, ZOOM_LEVELS.DAY);
    expect(isSameDay(d, new Date(2025, 0, 6))).toBe(true);
  });

  it('getDependencyPath computes SVG path', () => {
    const state = createSimpleState();
    const t1 = getTask(state, 't1');
    const t2 = getTask(state, 't2');
    const path = getDependencyPath(t1, t2, state, rangeStart, ZOOM_LEVELS.DAY);
    expect(path).toBeTruthy();
    expect(path.path).toContain('M');
    expect(path.path).toContain('C');
    expect(path.x2).toBeGreaterThan(path.x1);
  });

  it('getDependencyPath returns null for non-visible tasks', () => {
    const state = createSimpleState();
    state.tasks[0].expanded = false;
    const t1 = getTask(state, 't1');
    const t3 = getTask(state, 't3');
    const path = getDependencyPath(t1, t3, state, rangeStart, ZOOM_LEVELS.DAY);
    expect(path).toBeNull();
  });
});
