import {
  BACKUP_TYPES,
  FREQUENCY_TYPES,
  BACKUP_STATUS,
  TOTAL_STORAGE_BYTES,
  FAILURE_REASONS,
  FAILURE_PROBABILITY,
  FULL_BACKUP_MIN_MS,
  FULL_BACKUP_MAX_MS,
  INCREMENTAL_BACKUP_MIN_MS,
  INCREMENTAL_BACKUP_MAX_MS,
  STORAGE_WARNING_THRESHOLD,
  STORAGE_DANGER_THRESHOLD,
  STORAGE_CRITICAL_THRESHOLD,
} from './constants.js';

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function parseTimeString(timeStr) {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const parts = timeStr.split(':');
  return {
    hours: parseInt(parts[0], 10) || 0,
    minutes: parseInt(parts[1], 10) || 0,
  };
}

export function calculateNextBackupTime(plan, fromTime = Date.now()) {
  if (!plan || !plan.frequency) return null;

  const { frequency, frequencyConfig, backupTime } = plan;
  const { hours, minutes } = parseTimeString(backupTime);
  const now = new Date(fromTime);
  const next = new Date(fromTime);

  next.setHours(hours, minutes, 0, 0);

  if (frequency === FREQUENCY_TYPES.DAILY) {
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else if (frequency === FREQUENCY_TYPES.WEEKLY) {
    const targetDay = frequencyConfig?.weekDay ?? 1;
    const currentDay = next.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0 || (daysToAdd === 0 && next <= now)) {
      daysToAdd += 7;
    }
    next.setDate(next.getDate() + daysToAdd);
  } else if (frequency === FREQUENCY_TYPES.MONTHLY) {
    const targetDay = Math.max(1, Math.min(31, frequencyConfig?.monthDay ?? 1));
    const currentDay = next.getDate();
    const maxDayThisMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    const safeTargetDay = Math.min(targetDay, maxDayThisMonth);

    if (currentDay > safeTargetDay || (currentDay === safeTargetDay && next <= now)) {
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const maxDayNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(targetDay, maxDayNextMonth));
    } else {
      next.setDate(safeTargetDay);
    }
  }

  return next.getTime();
}

export function applyRetentionPolicy(records, planId, retentionCount) {
  if (!Array.isArray(records)) return { records: [], deleted: [] };
  const parsedCount = Number(retentionCount);
  const count = isNaN(parsedCount) ? 30 : Math.max(1, Math.min(30, parsedCount));

  const planRecords = records
    .filter((r) => r.planId === planId && r.status !== BACKUP_STATUS.RUNNING)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (planRecords.length <= count) {
    return { records, deleted: [] };
  }

  const toDelete = planRecords.slice(count);
  const toDeleteIds = new Set(toDelete.map((r) => r.id));
  const remainingRecords = records.filter((r) => !toDeleteIds.has(r.id));

  return {
    records: remainingRecords,
    deleted: toDelete,
  };
}

export function calculateStorageUsage(records) {
  if (!Array.isArray(records)) return 0;
  return records
    .filter((r) => r.status === BACKUP_STATUS.SUCCESS)
    .reduce((sum, r) => sum + (Number(r.dataSize) || 0), 0);
}

export function calculateStoragePercentage(usedBytes, totalBytes = TOTAL_STORAGE_BYTES) {
  const used = Number(usedBytes);
  const total = Number(totalBytes);
  if (isNaN(used) || isNaN(total) || total <= 0) return 0;
  return Math.min(1, Math.max(0, used / total));
}

export function getStorageStatus(percentage) {
  const p = Number(percentage) || 0;
  if (p >= STORAGE_DANGER_THRESHOLD) return 'danger';
  if (p >= STORAGE_WARNING_THRESHOLD) return 'warning';
  return 'normal';
}

export function isStorageCritical(percentage) {
  const p = Number(percentage) || 0;
  return p >= STORAGE_CRITICAL_THRESHOLD;
}

export function formatBytes(bytes) {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(2)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(seconds) {
  const s = Number(seconds) || 0;
  if (s < 60) return `${s}秒`;
  if (s < 3600) return `${Math.floor(s / 60)}分${s % 60}秒`;
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hours}小时${mins}分${secs}秒`;
}

export function simulateBackupDuration(backupType) {
  const type = backupType;
  let min, max;
  if (type === BACKUP_TYPES.FULL) {
    min = FULL_BACKUP_MIN_MS;
    max = FULL_BACKUP_MAX_MS;
  } else {
    min = INCREMENTAL_BACKUP_MIN_MS;
    max = INCREMENTAL_BACKUP_MAX_MS;
  }
  return Math.floor(Math.random() * (max - min)) + min;
}

export function simulateBackupFailure() {
  return Math.random() < FAILURE_PROBABILITY;
}

export function getRandomFailureReason() {
  const index = Math.floor(Math.random() * FAILURE_REASONS.length);
  return FAILURE_REASONS[index];
}

export function simulateDataSize(backupType, dataSources) {
  const baseSize = 50 * 1024 * 1024;
  const multiplier = backupType === BACKUP_TYPES.FULL ? 1 : 0.3;
  const sourceMultiplier = Array.isArray(dataSources) ? dataSources.length : 1;
  const randomFactor = 0.8 + Math.random() * 0.4;
  return Math.floor(baseSize * multiplier * sourceMultiplier * randomFactor);
}

export function generateMockDataFiles(dataSources) {
  const files = [];
  const sources = Array.isArray(dataSources) ? dataSources : [];

  if (sources.includes('database')) {
    const tableCounts = [12345, 2345, 8765, 15678, 3456];
    const tableNames = ['用户表', '订单表', '商品表', '日志表', '配置表'];
    for (let i = 0; i < tableNames.length; i++) {
      files.push({
        name: tableNames[i],
        records: Math.floor(tableCounts[i] * (0.9 + Math.random() * 0.2)),
        type: 'database',
      });
    }
  }

  if (sources.includes('file_system')) {
    const fileNames = ['用户上传文件', '系统日志文件', '临时缓存文件', '静态资源文件'];
    const fileSizes = [256, 128, 64, 512];
    for (let i = 0; i < fileNames.length; i++) {
      files.push({
        name: fileNames[i],
        size: `${fileSizes[i]} MB`,
        type: 'file',
      });
    }
  }

  if (sources.includes('config_file')) {
    files.push({ name: '系统配置文件', entries: 156, type: 'config' });
    files.push({ name: '环境变量配置', entries: 45, type: 'config' });
    files.push({ name: '路由配置文件', entries: 89, type: 'config' });
  }

  return files;
}

export function getPlanStatusCounts(plans) {
  if (!Array.isArray(plans)) return { active: 0, paused: 0, total: 0 };
  return plans.reduce(
    (acc, plan) => {
      acc.total++;
      if (plan.status === 'active') acc.active++;
      else if (plan.status === 'paused') acc.paused++;
      return acc;
    },
    { active: 0, paused: 0, total: 0 }
  );
}

export function getRunningTaskCount(records) {
  if (!Array.isArray(records)) return 0;
  return records.filter((r) => r.status === BACKUP_STATUS.RUNNING).length;
}

export function getLastBackupTime(records) {
  if (!Array.isArray(records) || records.length === 0) return null;
  const completed = records.filter(
    (r) => r.status === BACKUP_STATUS.SUCCESS || r.status === BACKUP_STATUS.FAILED
  );
  if (completed.length === 0) return null;
  return Math.max(...completed.map((r) => r.createdAt));
}

export function getNextScheduledBackup(plans, globalPaused = false) {
  if (globalPaused) return null;
  if (!Array.isArray(plans) || plans.length === 0) return null;
  const activePlans = plans.filter((p) => p.status === 'active' && p.nextBackupTime);
  if (activePlans.length === 0) return null;
  return Math.min(...activePlans.map((p) => p.nextBackupTime));
}

export function filterRecords(records, filters = {}) {
  if (!Array.isArray(records)) return [];
  let result = [...records];

  if (filters.planId) {
    result = result.filter((r) => r.planId === filters.planId);
  }

  if (filters.status) {
    result = result.filter((r) => r.status === filters.status);
  }

  return result.sort((a, b) => b.createdAt - a.createdAt);
}

export function groupRecordsByPlan(records) {
  if (!Array.isArray(records)) return {};
  return records.reduce((groups, record) => {
    const key = record.planId;
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {});
}

export function paginateList(items, page, pageSize) {
  if (!Array.isArray(items)) return { items: [], total: 0, totalPages: 1, currentPage: 1 };
  const total = items.length;
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Number(pageSize) || 20);
  const totalPages = Math.max(1, Math.ceil(total / safeSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    total,
    totalPages,
    currentPage,
    pageSize: safeSize,
  };
}

export function calculatePlanStorageUsage(records, planId) {
  if (!Array.isArray(records)) return 0;
  return records
    .filter((r) => r.planId === planId && r.status === BACKUP_STATUS.SUCCESS)
    .reduce((sum, r) => sum + (Number(r.dataSize) || 0), 0);
}

export function getMonthlyStorageTrend(records, months = 6) {
  if (!Array.isArray(records)) return [];
  const now = new Date();
  const trend = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
    const monthLabel = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const usage = records
      .filter(
        (r) =>
          r.status === BACKUP_STATUS.SUCCESS &&
          r.createdAt >= monthStart &&
          r.createdAt <= monthEnd
      )
      .reduce((sum, r) => sum + (Number(r.dataSize) || 0), 0);

    trend.push({
      month: monthLabel,
      usage,
    });
  }

  return trend;
}

export function validatePlanForm(data) {
  const errors = {};
  const { name, backupType, frequency, backupTime, retentionCount, dataSources } = data;

  if (!name || !name.trim()) {
    errors.name = '计划名称不能为空';
  }

  if (!backupType) {
    errors.backupType = '请选择备份类型';
  }

  if (!frequency) {
    errors.frequency = '请选择备份频率';
  }

  if (!backupTime) {
    errors.backupTime = '请选择备份时间';
  }

  const retention = Number(retentionCount);
  if (isNaN(retention) || retention < 1 || retention > 30) {
    errors.retentionCount = '保留份数必须在 1-30 之间';
  }

  if (!Array.isArray(dataSources) || dataSources.length === 0) {
    errors.dataSources = '请至少选择一个备份目标';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function parseFrequencyConfig(frequency, config) {
  if (frequency === FREQUENCY_TYPES.DAILY) {
    return { type: FREQUENCY_TYPES.DAILY };
  }
  if (frequency === FREQUENCY_TYPES.WEEKLY) {
    const weekDay = Number(config?.weekDay);
    return {
      type: FREQUENCY_TYPES.WEEKLY,
      weekDay: isNaN(weekDay) ? 1 : Math.max(0, Math.min(6, weekDay)),
    };
  }
  if (frequency === FREQUENCY_TYPES.MONTHLY) {
    return {
      type: FREQUENCY_TYPES.MONTHLY,
      monthDay: Math.max(1, Math.min(28, Number(config?.monthDay) ?? 1)),
    };
  }
  return {};
}

export function formatFrequencyDisplay(frequency, frequencyConfig) {
  if (!frequency) return '';
  if (frequency === FREQUENCY_TYPES.DAILY) return '每天';
  if (frequency === FREQUENCY_TYPES.WEEKLY) {
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const day = frequencyConfig?.weekDay ?? 1;
    return `每周${dayNames[day] || ''}`;
  }
  if (frequency === FREQUENCY_TYPES.MONTHLY) {
    const day = frequencyConfig?.monthDay ?? 1;
    return `每月${day}日`;
  }
  return '';
}
