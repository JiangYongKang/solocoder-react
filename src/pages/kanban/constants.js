export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

export const STATUS_LABELS = {
  [TASK_STATUSES.TODO]: '待处理',
  [TASK_STATUSES.IN_PROGRESS]: '进行中',
  [TASK_STATUSES.DONE]: '已完成',
};

export const PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const PRIORITY_LABELS = {
  [PRIORITIES.HIGH]: '高',
  [PRIORITIES.MEDIUM]: '中',
  [PRIORITIES.LOW]: '低',
};

export const PRIORITY_ORDER = [PRIORITIES.HIGH, PRIORITIES.MEDIUM, PRIORITIES.LOW];

export const TAGS = ['Bug', '功能', '优化', '紧急'];

export const STORAGE_KEY = 'kanban_tasks';

export const STATUS_ORDER = [TASK_STATUSES.TODO, TASK_STATUSES.IN_PROGRESS, TASK_STATUSES.DONE];
