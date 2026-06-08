import { STORAGE_KEY, MILLISECONDS_PER_DAY, ZOOM_LEVELS, DAY_WIDTH } from './constants.js';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function diffDays(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return Math.round((e - s) / MILLISECONDS_PER_DAY);
}

export function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getMonthStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

export function getMonthEnd(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d;
}

export function getDefaultTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const t1 = formatDate(today);
  const t3 = formatDate(addDays(today, 3));
  const t5 = formatDate(addDays(today, 5));
  const t7 = formatDate(addDays(today, 7));
  const t10 = formatDate(addDays(today, 10));
  const t14 = formatDate(addDays(today, 14));

  const id1 = generateId();
  const id2 = generateId();
  const id3 = generateId();
  const id4 = generateId();
  const id5 = generateId();
  const id6 = generateId();
  const id7 = generateId();
  const id8 = generateId();
  const id9 = generateId();

  return {
    tasks: [
      {
        id: id1,
        name: '项目启动与规划',
        assignee: '张三',
        progress: 100,
        startDate: t1,
        endDate: t3,
        parentId: null,
        dependencies: [],
        expanded: true,
      },
      {
        id: id2,
        name: '需求调研',
        assignee: '李四',
        progress: 100,
        startDate: t1,
        endDate: t3,
        parentId: id1,
        dependencies: [],
        expanded: false,
      },
      {
        id: id3,
        name: '技术方案设计',
        assignee: '王五',
        progress: 60,
        startDate: t3,
        endDate: t7,
        parentId: null,
        dependencies: [id1],
        expanded: true,
      },
      {
        id: id4,
        name: '前端架构设计',
        assignee: '赵六',
        progress: 80,
        startDate: t3,
        endDate: t5,
        parentId: id3,
        dependencies: [],
        expanded: false,
      },
      {
        id: id5,
        name: '后端架构设计',
        assignee: '孙七',
        progress: 40,
        startDate: t5,
        endDate: t7,
        parentId: id3,
        dependencies: [id4],
        expanded: false,
      },
      {
        id: id6,
        name: '开发与测试',
        assignee: '周八',
        progress: 20,
        startDate: t7,
        endDate: t14,
        parentId: null,
        dependencies: [id3],
        expanded: true,
      },
      {
        id: id7,
        name: '前端开发',
        assignee: '赵六',
        progress: 30,
        startDate: t7,
        endDate: t10,
        parentId: id6,
        dependencies: [id4],
        expanded: false,
      },
      {
        id: id8,
        name: '后端开发',
        assignee: '孙七',
        progress: 15,
        startDate: t7,
        endDate: t10,
        parentId: id6,
        dependencies: [id5],
        expanded: false,
      },
      {
        id: id9,
        name: '集成测试',
        assignee: '李四',
        progress: 0,
        startDate: t10,
        endDate: t14,
        parentId: id6,
        dependencies: [id7, id8],
        expanded: false,
      },
    ],
  };
}

export function loadTasks(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return getDefaultTasks();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultTasks();
      saveTasks(defaults, storage);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tasks)) {
      return getDefaultTasks();
    }
    return parsed;
  } catch {
    return getDefaultTasks();
  }
}

export function saveTasks(data, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
}

export function addTask(state, task, parentId = null) {
  const newTask = {
    id: generateId(),
    name: task.name ?? '新任务',
    assignee: task.assignee ?? '',
    progress: task.progress ?? 0,
    startDate: task.startDate ?? formatDate(new Date()),
    endDate: task.endDate ?? formatDate(addDays(new Date(), 1)),
    parentId: parentId,
    dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
    expanded: task.expanded ?? false,
  };

  const tasks = [...state.tasks, newTask];
  return { ...state, tasks };
}

export function updateTask(state, taskId, updates) {
  const tasks = state.tasks.map((t) => {
    if (t.id === taskId) {
      const updated = { ...t, ...updates };
      if (updates.progress !== undefined) {
        updated.progress = Math.max(0, Math.min(100, Math.round(updates.progress)));
      }
      return updated;
    }
    return t;
  });
  return { ...state, tasks };
}

export function deleteTask(state, taskId) {
  const toDelete = new Set([taskId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of state.tasks) {
      if (toDelete.has(t.parentId) && !toDelete.has(t.id)) {
        toDelete.add(t.id);
        changed = true;
      }
    }
  }

  const tasks = state.tasks
    .filter((t) => !toDelete.has(t.id))
    .map((t) => ({
      ...t,
      dependencies: t.dependencies.filter((d) => !toDelete.has(d)),
    }));

  return { ...state, tasks };
}

export function getChildren(state, parentId) {
  return state.tasks.filter((t) => t.parentId === parentId);
}

export function getTask(state, taskId) {
  return state.tasks.find((t) => t.id === taskId) || null;
}

export function getVisibleTasks(state) {
  const visible = [];

  function collect(parentId, depth) {
    const children = getChildren(state, parentId).sort((a, b) =>
      state.tasks.indexOf(a) - state.tasks.indexOf(b)
    );
    for (const child of children) {
      visible.push({ ...child, depth });
      if (child.expanded) {
        collect(child.id, depth + 1);
      }
    }
  }

  collect(null, 0);
  return visible;
}

export function toggleExpanded(state, taskId) {
  return updateTask(state, taskId, { expanded: !getTask(state, taskId)?.expanded });
}

export function addDependency(state, taskId, dependencyId) {
  if (taskId === dependencyId) return state;
  const task = getTask(state, taskId);
  if (!task) return state;
  if (task.dependencies.includes(dependencyId)) return state;
  if (wouldCreateCycle(state, taskId, dependencyId)) return state;

  return updateTask(state, taskId, {
    dependencies: [...task.dependencies, dependencyId],
  });
}

export function removeDependency(state, taskId, dependencyId) {
  const task = getTask(state, taskId);
  if (!task) return state;
  return updateTask(state, taskId, {
    dependencies: task.dependencies.filter((d) => d !== dependencyId),
  });
}

export function wouldCreateCycle(state, taskId, dependencyId) {
  const visited = new Set();
  const stack = [dependencyId];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const currentTask = getTask(state, current);
    if (currentTask) {
      for (const dep of currentTask.dependencies) {
        stack.push(dep);
      }
    }
  }

  return false;
}

export function getTaskRowIndex(state, taskId) {
  const visible = getVisibleTasks(state);
  return visible.findIndex((t) => t.id === taskId);
}

export function getDateRange(state) {
  if (state.tasks.length === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { start: today, end: addDays(today, 14) };
  }

  let minDate = null;
  let maxDate = null;

  for (const task of state.tasks) {
    const s = parseDate(task.startDate);
    const e = parseDate(task.endDate);
    if (s && (!minDate || s < minDate)) minDate = s;
    if (e && (!maxDate || e > maxDate)) maxDate = e;
  }

  if (!minDate) minDate = new Date();
  if (!maxDate) maxDate = addDays(minDate, 14);

  minDate = addDays(minDate, -3);
  maxDate = addDays(maxDate, 3);
  minDate.setHours(0, 0, 0, 0);
  maxDate.setHours(0, 0, 0, 0);

  return { start: minDate, end: maxDate };
}

export function getTimelineDays(range) {
  const days = [];
  let current = new Date(range.start);
  while (current <= range.end) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
}

export function getWeekGroups(days) {
  const groups = [];
  let currentWeek = null;

  for (const day of days) {
    const weekStart = getWeekStart(day);
    const weekKey = formatDate(weekStart);
    if (!currentWeek || currentWeek.key !== weekKey) {
      currentWeek = { key: weekKey, start: weekStart, days: [] };
      groups.push(currentWeek);
    }
    currentWeek.days.push(day);
  }

  return groups;
}

export function getMonthGroups(days) {
  const groups = [];
  let currentMonth = null;

  for (const day of days) {
    const monthStart = getMonthStart(day);
    const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
    if (!currentMonth || currentMonth.key !== monthKey) {
      currentMonth = { key: monthKey, start: monthStart, days: [] };
      groups.push(currentMonth);
    }
    currentMonth.days.push(day);
  }

  return groups;
}

export function validateTask(task) {
  const errors = {};

  if (!task || typeof task !== 'object') {
    return { valid: false, errors: { task: 'invalid' } };
  }

  if (!task.name || typeof task.name !== 'string' || !task.name.trim()) {
    errors.name = '任务名称不能为空';
  }

  if (task.progress !== undefined) {
    const p = Number(task.progress);
    if (isNaN(p) || p < 0 || p > 100) {
      errors.progress = '进度必须是 0-100 之间的数字';
    }
  }

  if (task.startDate && !parseDate(task.startDate)) {
    errors.startDate = '开始日期格式无效';
  }

  if (task.endDate && !parseDate(task.endDate)) {
    errors.endDate = '结束日期格式无效';
  }

  if (task.startDate && task.endDate) {
    const s = parseDate(task.startDate);
    const e = parseDate(task.endDate);
    if (s && e && s > e) {
      errors.startDate = '开始日期不能晚于结束日期';
      errors.endDate = '结束日期不能早于开始日期';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function calculateBarPosition(task, rangeStart, zoomLevel) {
  const dayWidth = DAY_WIDTH[zoomLevel] || DAY_WIDTH[ZOOM_LEVELS.DAY];
  const start = parseDate(task.startDate);
  const end = parseDate(task.endDate);

  if (!start || !end) return { left: 0, width: 0 };

  const left = dateToPx(start, rangeStart, zoomLevel);
  const rightPx = dateToPx(addDays(end, 1), rangeStart, zoomLevel);

  return {
    left,
    width: Math.max(dayWidth, rightPx - left),
  };
}

export function pxToDate(px, rangeStart, zoomLevel) {
  const dayWidth = DAY_WIDTH[zoomLevel] || DAY_WIDTH[ZOOM_LEVELS.DAY];
  const days = Math.round(px / dayWidth);
  return addDays(rangeStart, days);
}

export function dateToPx(date, rangeStart, zoomLevel) {
  const dayWidth = DAY_WIDTH[zoomLevel] || DAY_WIDTH[ZOOM_LEVELS.DAY];
  const days = diffDays(rangeStart, date);
  return days * dayWidth;
}

export function getDependencyPath(fromTask, toTask, state, rangeStart, zoomLevel) {
  const fromIdx = getTaskRowIndex(state, fromTask.id);
  const toIdx = getTaskRowIndex(state, toTask.id);

  if (fromIdx === -1 || toIdx === -1) return null;

  const fromPos = calculateBarPosition(fromTask, rangeStart, zoomLevel);
  const toPos = calculateBarPosition(toTask, rangeStart, zoomLevel);

  const rowHeight = 48;
  const barOffset = 9;
  const barHeight = 30;

  const x1 = fromPos.left + fromPos.width;
  const y1 = fromIdx * rowHeight + barOffset + barHeight / 2;
  const x2 = toPos.left;
  const y2 = toIdx * rowHeight + barOffset + barHeight / 2;

  const midX = (x1 + x2) / 2;

  return {
    x1,
    y1,
    x2,
    y2,
    path: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
    arrowX: x2,
    arrowY: y2,
  };
}
