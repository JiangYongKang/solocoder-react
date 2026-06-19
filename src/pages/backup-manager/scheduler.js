import { BACKUP_STATUS, SCHEDULER_INTERVAL_MS, PLAN_STATUS } from './constants.js';
import {
  calculateNextBackupTime,
  applyRetentionPolicy,
  simulateBackupDuration,
  simulateBackupFailure,
  getRandomFailureReason,
  simulateDataSize,
  generateMockDataFiles,
} from './utils.js';
import { createBackupRecord, updateRecordStatus } from './storage.js';

export class BackupScheduler {
  constructor(options = {}) {
    this.plans = options.plans || [];
    this.records = options.records || [];
    this.globalPaused = options.globalPaused || false;
    this.onPlansUpdate = options.onPlansUpdate || (() => {});
    this.onRecordsUpdate = options.onRecordsUpdate || (() => {});
    this.intervalId = null;
    this.runningTasks = new Map();
    this.onRunningTasksChange = options.onRunningTasksChange || (() => {});
  }

  setPlans(plans) {
    this.plans = plans;
  }

  setRecords(records) {
    this.records = records;
  }

  setGlobalPaused(paused) {
    this.globalPaused = paused;
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), SCHEDULER_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick() {
    if (this.globalPaused) return;

    const now = Date.now();
    const plansToRun = this.plans.filter(
      (plan) =>
        plan.status === PLAN_STATUS.ACTIVE &&
        plan.nextBackupTime &&
        plan.nextBackupTime <= now
    );

    plansToRun.forEach((plan) => {
      if (!this.runningTasks.has(plan.id)) {
        this.executeBackup(plan);
      }
    });
  }

  async executeBackup(plan, manual = false) {
    if (this.runningTasks.has(plan.id)) {
      return { success: false, error: '该计划已有备份任务执行中' };
    }

    const record = createBackupRecord(plan, manual);
    this.records = [record, ...this.records];
    this.onRecordsUpdate(this.records);

    this.runningTasks.set(plan.id, record.id);
    this.onRunningTasksChange(this.getRunningTaskCount());

    const durationMs = simulateBackupDuration(plan.backupType);

    return new Promise((resolve) => {
      setTimeout(() => {
        const isFailed = simulateBackupFailure();
        const now = Date.now();
        const durationSeconds = Math.round(durationMs / 100) / 10;

        let updates;
        if (isFailed) {
          updates = {
            status: BACKUP_STATUS.FAILED,
            completedAt: now,
            duration: durationSeconds,
            errorMessage: getRandomFailureReason(),
            dataSize: 0,
            dataFiles: [],
          };
        } else {
          const dataSize = simulateDataSize(plan.backupType, plan.dataSources);
          const dataFiles = generateMockDataFiles(plan.dataSources);
          updates = {
            status: BACKUP_STATUS.SUCCESS,
            completedAt: now,
            duration: durationSeconds,
            dataSize,
            dataFiles,
            errorMessage: null,
          };
        }

        this.records = updateRecordStatus(this.records, record.id, updates);

        const planIndex = this.plans.findIndex((p) => p.id === plan.id);
        if (planIndex !== -1) {
          const updatedPlan = {
            ...this.plans[planIndex],
            lastRunTime: now,
            nextBackupTime: calculateNextBackupTime(this.plans[planIndex], now),
            updatedAt: now,
          };
          this.plans = [...this.plans];
          this.plans[planIndex] = updatedPlan;
          this.onPlansUpdate(this.plans);

          if (!isFailed) {
            const retentionResult = applyRetentionPolicy(
              this.records,
              plan.id,
              plan.retentionCount
            );
            if (retentionResult.deleted.length > 0) {
              this.records = retentionResult.records;
            }
          }
        }

        this.onRecordsUpdate(this.records);
        this.runningTasks.delete(plan.id);
        this.onRunningTasksChange(this.getRunningTaskCount());

        resolve({
          success: !isFailed,
          record: { ...record, ...updates },
          error: isFailed ? updates.errorMessage : null,
        });
      }, durationMs);
    });
  }

  triggerManualBackup(planId) {
    const plan = this.plans.find((p) => p.id === planId);
    if (!plan) {
      return Promise.resolve({ success: false, error: '计划不存在' });
    }
    return this.executeBackup(plan, true);
  }

  getRunningTaskCount() {
    return this.runningTasks.size;
  }

  isTaskRunning(planId) {
    return this.runningTasks.has(planId);
  }

  isAnyTaskRunning() {
    return this.runningTasks.size > 0;
  }
}

export function createScheduler(options = {}) {
  return new BackupScheduler(options);
}
