import { TASK_STATUSES, STATUS_ORDER, STORAGE_KEY, TAGS, PRIORITIES } from './constants.js';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createEmptyBoard() {
  return {
    [TASK_STATUSES.TODO]: [],
    [TASK_STATUSES.IN_PROGRESS]: [],
    [TASK_STATUSES.DONE]: [],
  };
}

export function getDefaultTasks() {
  const board = createEmptyBoard();
  board[TASK_STATUSES.TODO] = [
    {
      id: generateId(),
      title: '修复登录页面样式错位',
      description: '在移动端登录表单的按钮和输入框没有对齐，需要修复。',
      priority: PRIORITIES.HIGH,
      tags: ['Bug', '紧急'],
      status: TASK_STATUSES.TODO,
    },
    {
      id: generateId(),
      title: '用户头像上传功能',
      description: '支持用户上传自定义头像，限制 2MB 以内。',
      priority: PRIORITIES.MEDIUM,
      tags: ['功能'],
      status: TASK_STATUSES.TODO,
    },
  ];
  board[TASK_STATUSES.IN_PROGRESS] = [
    {
      id: generateId(),
      title: '优化列表加载速度',
      description: '当前列表数据量大时卡顿，尝试用虚拟滚动或分页优化。',
      priority: PRIORITIES.MEDIUM,
      tags: ['优化'],
      status: TASK_STATUSES.IN_PROGRESS,
    },
  ];
  board[TASK_STATUSES.DONE] = [
    {
      id: generateId(),
      title: '接入用户认证模块',
      description: '基于 JWT 的登录、登出、刷新 token 逻辑。',
      priority: PRIORITIES.HIGH,
      tags: ['功能'],
      status: TASK_STATUSES.DONE,
    },
  ];
  return board;
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
    const board = createEmptyBoard();
    STATUS_ORDER.forEach((status) => {
      if (Array.isArray(parsed[status])) {
        board[status] = parsed[status];
      }
    });
    return board;
  } catch {
    return getDefaultTasks();
  }
}

export function saveTasks(board, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {
    // ignore storage errors (quota, disabled, etc.)
  }
}

export function addTask(board, task) {
  const newTask = {
    id: generateId(),
    title: task.title ?? '',
    description: task.description ?? '',
    priority: task.priority ?? PRIORITIES.MEDIUM,
    tags: Array.isArray(task.tags) ? task.tags.filter((t) => TAGS.includes(t)) : [],
    status: task.status ?? TASK_STATUSES.TODO,
  };
  const newBoard = { ...board };
  newBoard[newTask.status] = [...(board[newTask.status] || []), newTask];
  return newBoard;
}

export function updateTask(board, taskId, updates) {
  const newBoard = { ...board };

  for (const status of STATUS_ORDER) {
    const idx = newBoard[status].findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const updated = { ...newBoard[status][idx], ...updates };
      if (updates.status && updates.status !== status) {
        newBoard[status] = [...newBoard[status].slice(0, idx), ...newBoard[status].slice(idx + 1)];
        newBoard[updates.status] = [...(newBoard[updates.status] || []), updated];
      } else {
        newBoard[status] = [...newBoard[status]];
        newBoard[status][idx] = updated;
      }
      break;
    }
  }
  return newBoard;
}

export function deleteTask(board, taskId) {
  const newBoard = { ...board };
  for (const status of STATUS_ORDER) {
    const idx = newBoard[status].findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      newBoard[status] = [...newBoard[status].slice(0, idx), ...newBoard[status].slice(idx + 1)];
      break;
    }
  }
  return newBoard;
}

export function moveTask(board, taskId, targetStatus, targetIndex) {
  const newBoard = { ...board };
  let task = null;

  for (const status of STATUS_ORDER) {
    const idx = newBoard[status].findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      task = newBoard[status][idx];
      newBoard[status] = [...newBoard[status].slice(0, idx), ...newBoard[status].slice(idx + 1)];
      break;
    }
  }

  if (!task) return board;

  const updatedTask = { ...task, status: targetStatus };
  const targetList = [...(newBoard[targetStatus] || [])];
  const safeIndex = Math.max(0, Math.min(targetIndex, targetList.length));
  targetList.splice(safeIndex, 0, updatedTask);
  newBoard[targetStatus] = targetList;

  return newBoard;
}

export function reorderTask(board, status, fromIndex, toIndex) {
  const list = [...board[status]];
  const [removed] = list.splice(fromIndex, 1);
  const safeIndex = Math.max(0, Math.min(toIndex, list.length));
  list.splice(safeIndex, 0, removed);
  return { ...board, [status]: list };
}

export function filterByTag(board, tag) {
  if (!tag) return board;
  const newBoard = createEmptyBoard();
  for (const status of STATUS_ORDER) {
    newBoard[status] = board[status].filter((task) => task.tags?.includes(tag));
  }
  return newBoard;
}

export function filterByPriority(board, priority) {
  if (!priority) return board;
  const newBoard = createEmptyBoard();
  for (const status of STATUS_ORDER) {
    newBoard[status] = board[status].filter((task) => task.priority === priority);
  }
  return newBoard;
}

export function searchByTitle(board, query) {
  if (!query) return board;
  const lower = query.trim().toLowerCase();
  if (!lower) return board;
  const newBoard = createEmptyBoard();
  for (const status of STATUS_ORDER) {
    newBoard[status] = board[status].filter((task) => task.title?.toLowerCase().includes(lower));
  }
  return newBoard;
}

export function applyFilters(board, { tag, priority, query }) {
  let result = board;
  if (query) {
    result = searchByTitle(result, query);
  }
  if (tag) {
    result = filterByTag(result, tag);
  } else if (priority) {
    result = filterByPriority(result, priority);
  }
  return result;
}

export function findTask(board, taskId) {
  for (const status of STATUS_ORDER) {
    const task = board[status].find((t) => t.id === taskId);
    if (task) return task;
  }
  return null;
}

export function validateTask(task) {
  const errors = {};
  if (!task || typeof task !== 'object') return { valid: false, errors: { task: 'invalid' } };
  if (!task.title || typeof task.title !== 'string' || !task.title.trim()) {
    errors.title = '标题不能为空';
  }
  if (task.priority && !Object.values(PRIORITIES).includes(task.priority)) {
    errors.priority = '优先级无效';
  }
  if (task.tags) {
    if (!Array.isArray(task.tags)) {
      errors.tags = '标签格式无效';
    } else {
      const invalid = task.tags.filter((t) => !TAGS.includes(t));
      if (invalid.length > 0) errors.tags = '包含无效标签';
    }
  }
  if (task.status && !Object.values(TASK_STATUSES).includes(task.status)) {
    errors.status = '状态无效';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
