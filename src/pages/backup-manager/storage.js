import { STORAGE_KEYS, BACKUP_TYPES, FREQUENCY_TYPES, PLAN_STATUS } from './constants.js';
import { generateId, calculateNextBackupTime } from './utils.js';

function safeParse(jsonStr, defaultValue) {
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (e) {
    return defaultValue;
  }
}

export function loadPlans(storage = globalThis.localStorage) {
  try {
    if (!storage) return getDefaultPlans();
    const data = storage.getItem(STORAGE_KEYS.PLANS);
    if (!data) return getDefaultPlans();
    const plans = safeParse(data, null);
    if (!Array.isArray(plans)) return getDefaultPlans();
    return plans;
  } catch (e) {
    return getDefaultPlans();
  }
}

export function savePlans(plans, storage = globalThis.localStorage) {
  try {
    if (!storage) return;
    storage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  } catch (e) {
    // ignore
  }
}

export function loadRecords(storage = globalThis.localStorage) {
  try {
    if (!storage) return [];
    const data = storage.getItem(STORAGE_KEYS.RECORDS);
    if (!data) return getDefaultRecords();
    const records = safeParse(data, null);
    if (!Array.isArray(records)) return getDefaultRecords();
    return records;
  } catch (e) {
    return [];
  }
}

export function saveRecords(records, storage = globalThis.localStorage) {
  try {
    if (!storage) return;
    storage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    // ignore
  }
}

export function loadGlobalState(storage = globalThis.localStorage) {
  try {
    if (!storage) return { paused: false };
    const data = storage.getItem(STORAGE_KEYS.GLOBAL_STATE);
    if (!data) return { paused: false };
    const state = safeParse(data, null);
    return { paused: false, ...state };
  } catch (e) {
    return { paused: false };
  }
}

export function saveGlobalState(state, storage = globalThis.localStorage) {
  try {
    if (!storage) return;
    storage.setItem(STORAGE_KEYS.GLOBAL_STATE, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

export function createPlan(plans, planData) {
  const now = Date.now();
  const frequencyConfig = planData.frequencyConfig || {};

  const newPlan = {
    id: generateId('plan_'),
    name: planData.name.trim(),
    backupType: planData.backupType,
    frequency: planData.frequency,
    frequencyConfig,
    backupTime: planData.backupTime,
    retentionCount: Number(planData.retentionCount) || 7,
    dataSources: planData.dataSources || [],
    status: PLAN_STATUS.ACTIVE,
    lastRunTime: null,
    nextBackupTime: null,
    createdAt: now,
    updatedAt: now,
  };

  newPlan.nextBackupTime = calculateNextBackupTime(newPlan, now);

  return {
    success: true,
    plan: newPlan,
    plans: [...plans, newPlan],
  };
}

export function updatePlan(plans, planId, updates) {
  const planIndex = plans.findIndex((p) => p.id === planId);
  if (planIndex === -1) {
    return { success: false, error: '计划不存在', plans };
  }

  const existingPlan = plans[planIndex];
  const updatedPlan = {
    ...existingPlan,
    ...updates,
    updatedAt: Date.now(),
  };

  if (updates.frequency || updates.frequencyConfig || updates.backupTime) {
    updatedPlan.nextBackupTime = calculateNextBackupTime(updatedPlan, Date.now());
  }

  const newPlans = [...plans];
  newPlans[planIndex] = updatedPlan;

  return {
    success: true,
    plan: updatedPlan,
    plans: newPlans,
  };
}

export function deletePlan(plans, planId) {
  const planExists = plans.some((p) => p.id === planId);
  if (!planExists) {
    return { success: false, error: '计划不存在', plans };
  }

  return {
    success: true,
    plans: plans.filter((p) => p.id !== planId),
  };
}

export function createBackupRecord(plan, manual = false) {
  const now = Date.now();
  return {
    id: generateId('record_'),
    planId: plan.id,
    planName: plan.name,
    backupType: plan.backupType,
    dataSources: plan.dataSources,
    status: 'running',
    createdAt: now,
    startedAt: now,
    completedAt: null,
    dataSize: 0,
    duration: 0,
    errorMessage: null,
    dataFiles: [],
    manual,
  };
}

export function updateRecordStatus(records, recordId, updates) {
  const index = records.findIndex((r) => r.id === recordId);
  if (index === -1) return records;

  const newRecords = [...records];
  newRecords[index] = { ...newRecords[index], ...updates };
  return newRecords;
}

export function clearBackupData(storage = globalThis.localStorage) {
  try {
    if (!storage) return;
    storage.removeItem(STORAGE_KEYS.PLANS);
    storage.removeItem(STORAGE_KEYS.RECORDS);
    storage.removeItem(STORAGE_KEYS.GLOBAL_STATE);
  } catch (e) {
    // ignore
  }
}

function getDefaultPlans() {
  const now = Date.now();
  return [
    {
      id: 'plan_default_1',
      name: '生产数据库每日备份',
      backupType: BACKUP_TYPES.FULL,
      frequency: FREQUENCY_TYPES.DAILY,
      frequencyConfig: {},
      backupTime: '02:00',
      retentionCount: 7,
      dataSources: ['database', 'config_file'],
      status: PLAN_STATUS.ACTIVE,
      lastRunTime: now - 86400000,
      nextBackupTime: calculateNextBackupTime(
        {
          frequency: FREQUENCY_TYPES.DAILY,
          frequencyConfig: {},
          backupTime: '02:00',
        },
        now
      ),
      createdAt: now - 86400000 * 7,
      updatedAt: now,
    },
    {
      id: 'plan_default_2',
      name: '文件系统增量备份',
      backupType: BACKUP_TYPES.INCREMENTAL,
      frequency: FREQUENCY_TYPES.WEEKLY,
      frequencyConfig: { weekDay: 1 },
      backupTime: '03:00',
      retentionCount: 4,
      dataSources: ['file_system'],
      status: PLAN_STATUS.ACTIVE,
      lastRunTime: now - 86400000 * 3,
      nextBackupTime: calculateNextBackupTime(
        {
          frequency: FREQUENCY_TYPES.WEEKLY,
          frequencyConfig: { weekDay: 1 },
          backupTime: '03:00',
        },
        now
      ),
      createdAt: now - 86400000 * 14,
      updatedAt: now,
    },
  ];
}

function getDefaultRecords() {
  const now = Date.now();
  const records = [];

  const plan1Records = [
    {
      id: 'record_hist_1',
      planId: 'plan_default_1',
      planName: '生产数据库每日备份',
      backupType: BACKUP_TYPES.FULL,
      dataSources: ['database', 'config_file'],
      status: 'success',
      createdAt: now - 86400000 * 6,
      startedAt: now - 86400000 * 6,
      completedAt: now - 86400000 * 6 + 4000,
      dataSize: 256 * 1024 * 1024,
      duration: 4,
      errorMessage: null,
      dataFiles: [
        { name: '用户表', records: 12345, type: 'database' },
        { name: '订单表', records: 2345, type: 'database' },
        { name: '系统配置文件', entries: 156, type: 'config' },
      ],
      manual: false,
    },
    {
      id: 'record_hist_2',
      planId: 'plan_default_1',
      planName: '生产数据库每日备份',
      backupType: BACKUP_TYPES.FULL,
      dataSources: ['database', 'config_file'],
      status: 'success',
      createdAt: now - 86400000 * 5,
      startedAt: now - 86400000 * 5,
      completedAt: now - 86400000 * 5 + 3500,
      dataSize: 260 * 1024 * 1024,
      duration: 3.5,
      errorMessage: null,
      dataFiles: [
        { name: '用户表', records: 12450, type: 'database' },
        { name: '订单表', records: 2450, type: 'database' },
        { name: '系统配置文件', entries: 156, type: 'config' },
      ],
      manual: false,
    },
    {
      id: 'record_hist_3',
      planId: 'plan_default_1',
      planName: '生产数据库每日备份',
      backupType: BACKUP_TYPES.FULL,
      dataSources: ['database', 'config_file'],
      status: 'failed',
      createdAt: now - 86400000 * 4,
      startedAt: now - 86400000 * 4,
      completedAt: now - 86400000 * 4 + 2000,
      dataSize: 0,
      duration: 2,
      errorMessage: '网络连接超时',
      dataFiles: [],
      manual: false,
    },
    {
      id: 'record_hist_4',
      planId: 'plan_default_1',
      planName: '生产数据库每日备份',
      backupType: BACKUP_TYPES.FULL,
      dataSources: ['database', 'config_file'],
      status: 'success',
      createdAt: now - 86400000 * 3,
      startedAt: now - 86400000 * 3,
      completedAt: now - 86400000 * 3 + 3800,
      dataSize: 258 * 1024 * 1024,
      duration: 3.8,
      errorMessage: null,
      dataFiles: [
        { name: '用户表', records: 12380, type: 'database' },
        { name: '订单表', records: 2390, type: 'database' },
        { name: '系统配置文件', entries: 158, type: 'config' },
      ],
      manual: false,
    },
    {
      id: 'record_hist_5',
      planId: 'plan_default_1',
      planName: '生产数据库每日备份',
      backupType: BACKUP_TYPES.FULL,
      dataSources: ['database', 'config_file'],
      status: 'success',
      createdAt: now - 86400000 * 2,
      startedAt: now - 86400000 * 2,
      completedAt: now - 86400000 * 2 + 4200,
      dataSize: 262 * 1024 * 1024,
      duration: 4.2,
      errorMessage: null,
      dataFiles: [
        { name: '用户表', records: 12500, type: 'database' },
        { name: '订单表', records: 2500, type: 'database' },
        { name: '系统配置文件', entries: 160, type: 'config' },
      ],
      manual: false,
    },
    {
      id: 'record_hist_6',
      planId: 'plan_default_1',
      planName: '生产数据库每日备份',
      backupType: BACKUP_TYPES.FULL,
      dataSources: ['database', 'config_file'],
      status: 'success',
      createdAt: now - 86400000,
      startedAt: now - 86400000,
      completedAt: now - 86400000 + 3600,
      dataSize: 255 * 1024 * 1024,
      duration: 3.6,
      errorMessage: null,
      dataFiles: [
        { name: '用户表', records: 12420, type: 'database' },
        { name: '订单表', records: 2420, type: 'database' },
        { name: '系统配置文件', entries: 159, type: 'config' },
      ],
      manual: false,
    },
  ];

  const plan2Records = [
    {
      id: 'record_hist_7',
      planId: 'plan_default_2',
      planName: '文件系统增量备份',
      backupType: BACKUP_TYPES.INCREMENTAL,
      dataSources: ['file_system'],
      status: 'success',
      createdAt: now - 86400000 * 10,
      startedAt: now - 86400000 * 10,
      completedAt: now - 86400000 * 10 + 2000,
      dataSize: 80 * 1024 * 1024,
      duration: 2,
      errorMessage: null,
      dataFiles: [
        { name: '用户上传文件', size: '256 MB', type: 'file' },
        { name: '系统日志文件', size: '128 MB', type: 'file' },
      ],
      manual: false,
    },
    {
      id: 'record_hist_8',
      planId: 'plan_default_2',
      planName: '文件系统增量备份',
      backupType: BACKUP_TYPES.INCREMENTAL,
      dataSources: ['file_system'],
      status: 'success',
      createdAt: now - 86400000 * 3,
      startedAt: now - 86400000 * 3,
      completedAt: now - 86400000 * 3 + 1800,
      dataSize: 75 * 1024 * 1024,
      duration: 1.8,
      errorMessage: null,
      dataFiles: [
        { name: '用户上传文件', size: '245 MB', type: 'file' },
        { name: '系统日志文件', size: '130 MB', type: 'file' },
      ],
      manual: false,
    },
  ];

  records.push(...plan1Records, ...plan2Records);
  return records.sort((a, b) => b.createdAt - a.createdAt);
}
