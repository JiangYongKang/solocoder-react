export const STORAGE_KEYS = {
  PLANS: 'backup_plans',
  RECORDS: 'backup_records',
  GLOBAL_STATE: 'backup_global_state',
};

export const BACKUP_TYPES = {
  FULL: 'full',
  INCREMENTAL: 'incremental',
};

export const BACKUP_TYPE_LABELS = {
  [BACKUP_TYPES.FULL]: '全量备份',
  [BACKUP_TYPES.INCREMENTAL]: '增量备份',
};

export const FREQUENCY_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const FREQUENCY_LABELS = {
  [FREQUENCY_TYPES.DAILY]: '每天',
  [FREQUENCY_TYPES.WEEKLY]: '每周',
  [FREQUENCY_TYPES.MONTHLY]: '每月',
};

export const WEEKDAYS = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
];

export const BACKUP_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
};

export const BACKUP_STATUS_LABELS = {
  [BACKUP_STATUS.PENDING]: '等待中',
  [BACKUP_STATUS.RUNNING]: '执行中',
  [BACKUP_STATUS.SUCCESS]: '成功',
  [BACKUP_STATUS.FAILED]: '失败',
};

export const DATA_SOURCES = {
  DATABASE: 'database',
  FILE_SYSTEM: 'file_system',
  CONFIG_FILE: 'config_file',
};

export const DATA_SOURCE_LABELS = {
  [DATA_SOURCES.DATABASE]: '数据库',
  [DATA_SOURCES.FILE_SYSTEM]: '文件系统',
  [DATA_SOURCES.CONFIG_FILE]: '配置文件',
};

export const RESTORE_TARGETS = {
  ORIGINAL: 'original',
  NEW_LOCATION: 'new_location',
};

export const RESTORE_TARGET_LABELS = {
  [RESTORE_TARGETS.ORIGINAL]: '恢复到原始位置',
  [RESTORE_TARGETS.NEW_LOCATION]: '恢复到新位置',
};

export const FAILURE_REASONS = [
  '磁盘空间不足',
  '网络连接超时',
  '数据源不可用',
  '权限不足',
  '数据校验失败',
  '备份文件损坏',
];

export const TOTAL_STORAGE_BYTES = 100 * 1024 * 1024 * 1024;

export const SCHEDULER_INTERVAL_MS = 30 * 1000;
export const SIMULATED_HOUR_MS = SCHEDULER_INTERVAL_MS;

export const FULL_BACKUP_MIN_MS = 3000;
export const FULL_BACKUP_MAX_MS = 5000;
export const INCREMENTAL_BACKUP_MIN_MS = 1000;
export const INCREMENTAL_BACKUP_MAX_MS = 3000;

export const FAILURE_PROBABILITY = 0.1;

export const PAGE_SIZE = 20;

export const STORAGE_WARNING_THRESHOLD = 0.5;
export const STORAGE_DANGER_THRESHOLD = 0.8;
export const STORAGE_CRITICAL_THRESHOLD = 0.9;

export const PLAN_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
};

export const PLAN_STATUS_LABELS = {
  [PLAN_STATUS.ACTIVE]: '运行中',
  [PLAN_STATUS.PAUSED]: '已暂停',
};

export const TIMELINE_VIEWS = {
  ALL: 'all',
  GROUPED: 'grouped',
};

export const TIMELINE_VIEW_LABELS = {
  [TIMELINE_VIEWS.ALL]: '全部',
  [TIMELINE_VIEWS.GROUPED]: '按计划分组',
};
