import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
} from 'vitest';
import {
  formatDateTime,
  formatDate,
  formatTime,
  parseTimeString,
  calculateNextBackupTime,
  applyRetentionPolicy,
  calculateStorageUsage,
  calculateStoragePercentage,
  getStorageStatus,
  isStorageCritical,
  formatBytes,
  formatDuration,
  simulateBackupDuration,
  simulateBackupFailure,
  getRandomFailureReason,
  simulateDataSize,
  generateMockDataFiles,
  getPlanStatusCounts,
  getRunningTaskCount,
  getLastBackupTime,
  getNextScheduledBackup,
  filterRecords,
  groupRecordsByPlan,
  paginateList,
  calculatePlanStorageUsage,
  getMonthlyStorageTrend,
  validatePlanForm,
  parseFrequencyConfig,
  formatFrequencyDisplay,
} from '../../backup-manager/utils.js';
import {
  BACKUP_TYPES,
  FREQUENCY_TYPES,
  BACKUP_STATUS,
  TOTAL_STORAGE_BYTES,
  FAILURE_REASONS,
  FULL_BACKUP_MIN_MS,
  FULL_BACKUP_MAX_MS,
  INCREMENTAL_BACKUP_MIN_MS,
  INCREMENTAL_BACKUP_MAX_MS,
} from '../../backup-manager/constants.js';

describe('备份管理工具函数 - 日期时间格式化', () => {
  describe('formatDateTime', () => {
    it('应该正确格式化时间戳为 YYYY-MM-DD HH:mm:ss', () => {
      const timestamp = new Date(2024, 0, 15, 14, 30, 45).getTime();
      expect(formatDateTime(timestamp)).toBe('2024-01-15 14:30:45');
    });

    it('应该对单数字月日时分秒补零', () => {
      const timestamp = new Date(2024, 0, 5, 8, 5, 3).getTime();
      expect(formatDateTime(timestamp)).toBe('2024-01-05 08:05:03');
    });

    it('空值或无效值应该返回空字符串', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
      expect(formatDateTime('invalid')).toBe('');
    });
  });

  describe('formatDate', () => {
    it('应该正确格式化日期', () => {
      const timestamp = new Date(2024, 5, 20).getTime();
      expect(formatDate(timestamp)).toBe('2024-06-20');
    });

    it('空值应该返回空字符串', () => {
      expect(formatDate(null)).toBe('');
    });
  });

  describe('formatTime', () => {
    it('应该正确格式化时间', () => {
      const timestamp = new Date(2024, 0, 1, 9, 15, 30).getTime();
      expect(formatTime(timestamp)).toBe('09:15:30');
    });

    it('空值应该返回空字符串', () => {
      expect(formatTime(null)).toBe('');
    });
  });

  describe('parseTimeString', () => {
    it('应该正确解析 HH:mm 格式', () => {
      expect(parseTimeString('08:30')).toEqual({ hours: 8, minutes: 30 });
      expect(parseTimeString('14:05')).toEqual({ hours: 14, minutes: 5 });
    });

    it('空值应该返回 00:00', () => {
      expect(parseTimeString('')).toEqual({ hours: 0, minutes: 0 });
      expect(parseTimeString(null)).toEqual({ hours: 0, minutes: 0 });
    });

    it('无效格式应该容错返回 0', () => {
      expect(parseTimeString('invalid')).toEqual({ hours: 0, minutes: 0 });
      expect(parseTimeString('25:70')).toEqual({ hours: 25, minutes: 70 });
    });
  });
});

describe('备份管理工具函数 - 下次备份时间计算', () => {
  describe('calculateNextBackupTime', () => {
    it('无效计划应该返回 null', () => {
      expect(calculateNextBackupTime(null)).toBeNull();
      expect(calculateNextBackupTime({})).toBeNull();
    });

    it('每日备份：当前时间早于备份时间，应该返回今天的备份时间', () => {
      const fromTime = new Date(2024, 0, 15, 8, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '10:00',
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 0, 15, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('每日备份：当前时间晚于备份时间，应该返回明天的备份时间', () => {
      const fromTime = new Date(2024, 0, 15, 14, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '10:00',
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 0, 16, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('每日备份：当前时间等于备份时间，应该返回明天的备份时间', () => {
      const fromTime = new Date(2024, 0, 15, 10, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '10:00',
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 0, 16, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('每周备份：目标周几在当前周且时间未过，应该返回本周', () => {
      const fromTime = new Date(2024, 0, 15, 8, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.WEEKLY,
        backupTime: '10:00',
        frequencyConfig: { weekDay: 3 },
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 0, 17, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('每周备份：目标周几在当前周但时间已过，应该返回下周', () => {
      const fromTime = new Date(2024, 0, 17, 14, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.WEEKLY,
        backupTime: '10:00',
        frequencyConfig: { weekDay: 3 },
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 0, 24, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('每周备份：目标周几已过当前周，应该返回下周', () => {
      const fromTime = new Date(2024, 0, 18, 8, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.WEEKLY,
        backupTime: '10:00',
        frequencyConfig: { weekDay: 1 },
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 0, 22, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('每月备份：目标日期在当月且时间未过，应该返回当月', () => {
      const fromTime = new Date(2024, 0, 10, 8, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.MONTHLY,
        backupTime: '10:00',
        frequencyConfig: { monthDay: 15 },
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 0, 15, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('每月备份：目标日期在当月但时间已过，应该返回下月', () => {
      const fromTime = new Date(2024, 0, 15, 14, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.MONTHLY,
        backupTime: '10:00',
        frequencyConfig: { monthDay: 15 },
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 1, 15, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('每月备份：目标日期已过当月，应该返回下月', () => {
      const fromTime = new Date(2024, 0, 20, 8, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.MONTHLY,
        backupTime: '10:00',
        frequencyConfig: { monthDay: 15 },
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 1, 15, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('每月备份：月底日期应该考虑当月最大天数', () => {
      const fromTime = new Date(2024, 0, 31, 14, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.MONTHLY,
        backupTime: '10:00',
        frequencyConfig: { monthDay: 31 },
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 1, 29, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('跨月跨年应该正确处理', () => {
      const fromTime = new Date(2023, 11, 31, 14, 0, 0).getTime();
      const plan = {
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '10:00',
      };
      const result = calculateNextBackupTime(plan, fromTime);
      const expected = new Date(2024, 0, 1, 10, 0, 0).getTime();
      expect(result).toBe(expected);
    });
  });
});

describe('备份管理工具函数 - 保留策略', () => {
  const createMockRecords = (planId, count, status = BACKUP_STATUS.SUCCESS) => {
    const records = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      records.push({
        id: `rec-${planId}-${i}`,
        planId,
        status,
        createdAt: now - i * 3600000,
        dataSize: 100 * 1024 * 1024,
      });
    }
    return records;
  };

  describe('applyRetentionPolicy', () => {
    it('记录数少于保留份数，不删除', () => {
      const records = createMockRecords('plan1', 3);
      const result = applyRetentionPolicy(records, 'plan1', 5);
      expect(result.records.length).toBe(3);
      expect(result.deleted.length).toBe(0);
    });

    it('记录数等于保留份数，不删除', () => {
      const records = createMockRecords('plan1', 5);
      const result = applyRetentionPolicy(records, 'plan1', 5);
      expect(result.records.length).toBe(5);
      expect(result.deleted.length).toBe(0);
    });

    it('记录数超过保留份数，删除最早的超出部分', () => {
      const records = createMockRecords('plan1', 8);
      const result = applyRetentionPolicy(records, 'plan1', 5);
      expect(result.records.length).toBe(5);
      expect(result.deleted.length).toBe(3);
      expect(result.deleted.map((r) => r.id)).toEqual([
        'rec-plan1-5',
        'rec-plan1-6',
        'rec-plan1-7',
      ]);
    });

    it('执行中的备份不参与淘汰', () => {
      const records = [
        ...createMockRecords('plan1', 5),
        {
          id: 'rec-plan1-running',
          planId: 'plan1',
          status: BACKUP_STATUS.RUNNING,
          createdAt: Date.now(),
          dataSize: 0,
        },
      ];
      const result = applyRetentionPolicy(records, 'plan1', 3);
      expect(result.records.length).toBe(4);
      expect(result.deleted.length).toBe(2);
      expect(result.records.find((r) => r.status === BACKUP_STATUS.RUNNING)).toBeDefined();
    });

    it('只删除指定计划的记录，不影响其他计划', () => {
      const records = [
        ...createMockRecords('plan1', 6),
        ...createMockRecords('plan2', 4),
      ];
      const result = applyRetentionPolicy(records, 'plan1', 3);
      expect(result.records.filter((r) => r.planId === 'plan1').length).toBe(3);
      expect(result.records.filter((r) => r.planId === 'plan2').length).toBe(4);
      expect(result.deleted.every((r) => r.planId === 'plan1')).toBe(true);
    });

    it('保留份数应该在 1-30 范围内', () => {
      const records = createMockRecords('plan1', 10);
      expect(applyRetentionPolicy(records, 'plan1', 0).deleted.length).toBe(9);
      expect(applyRetentionPolicy(records, 'plan1', 50).deleted.length).toBe(0);
      expect(applyRetentionPolicy(records, 'plan1', 'invalid').deleted.length).toBe(0);
    });

    it('非数组输入应该返回空删除列表', () => {
      const result = applyRetentionPolicy(null, 'plan1', 5);
      expect(result.records).toEqual([]);
      expect(result.deleted).toEqual([]);
    });
  });
});

describe('备份管理工具函数 - 存储计算', () => {
  describe('calculateStorageUsage', () => {
    it('应该只统计成功备份的大小', () => {
      const records = [
        { id: '1', status: BACKUP_STATUS.SUCCESS, dataSize: 100 * 1024 * 1024 },
        { id: '2', status: BACKUP_STATUS.SUCCESS, dataSize: 200 * 1024 * 1024 },
        { id: '3', status: BACKUP_STATUS.FAILED, dataSize: 50 * 1024 * 1024 },
        { id: '4', status: BACKUP_STATUS.RUNNING, dataSize: 0 },
      ];
      expect(calculateStorageUsage(records)).toBe(300 * 1024 * 1024);
    });

    it('空数组应该返回 0', () => {
      expect(calculateStorageUsage([])).toBe(0);
      expect(calculateStorageUsage(null)).toBe(0);
    });

    it('无效 dataSize 应该被视为 0', () => {
      const records = [
        { id: '1', status: BACKUP_STATUS.SUCCESS, dataSize: 'invalid' },
        { id: '2', status: BACKUP_STATUS.SUCCESS },
      ];
      expect(calculateStorageUsage(records)).toBe(0);
    });
  });

  describe('calculateStoragePercentage', () => {
    it('应该正确计算百分比', () => {
      expect(calculateStoragePercentage(50 * 1024 * 1024 * 1024, TOTAL_STORAGE_BYTES)).toBe(0.5);
      expect(calculateStoragePercentage(0, TOTAL_STORAGE_BYTES)).toBe(0);
    });

    it('应该限制百分比最大为 1', () => {
      expect(calculateStoragePercentage(200 * 1024 * 1024 * 1024, TOTAL_STORAGE_BYTES)).toBe(1);
    });

    it('总量为 0 或负数应该返回 0', () => {
      expect(calculateStoragePercentage(50, 0)).toBe(0);
      expect(calculateStoragePercentage(50, -100)).toBe(0);
    });

    it('无效数值应该返回 0', () => {
      expect(calculateStoragePercentage('invalid', 100)).toBe(0);
      expect(calculateStoragePercentage(50, 'invalid')).toBe(0);
    });
  });

  describe('getStorageStatus', () => {
    it('使用率低于 50% 应该返回 normal', () => {
      expect(getStorageStatus(0.3)).toBe('normal');
      expect(getStorageStatus(0.49)).toBe('normal');
    });

    it('使用率 50%-80% 应该返回 warning', () => {
      expect(getStorageStatus(0.5)).toBe('warning');
      expect(getStorageStatus(0.7)).toBe('warning');
      expect(getStorageStatus(0.79)).toBe('warning');
    });

    it('使用率 80% 以上应该返回 danger', () => {
      expect(getStorageStatus(0.8)).toBe('danger');
      expect(getStorageStatus(0.95)).toBe('danger');
    });

    it('无效数值应该返回 normal', () => {
      expect(getStorageStatus('invalid')).toBe('normal');
      expect(getStorageStatus(null)).toBe('normal');
    });
  });

  describe('isStorageCritical', () => {
    it('使用率 90% 以上应该返回 true', () => {
      expect(isStorageCritical(0.9)).toBe(true);
      expect(isStorageCritical(0.95)).toBe(true);
    });

    it('使用率低于 90% 应该返回 false', () => {
      expect(isStorageCritical(0.89)).toBe(false);
      expect(isStorageCritical(0.5)).toBe(false);
    });
  });

  describe('calculatePlanStorageUsage', () => {
    it('应该只统计指定计划的成功备份', () => {
      const records = [
        { id: '1', planId: 'p1', status: BACKUP_STATUS.SUCCESS, dataSize: 100 },
        { id: '2', planId: 'p1', status: BACKUP_STATUS.SUCCESS, dataSize: 200 },
        { id: '3', planId: 'p2', status: BACKUP_STATUS.SUCCESS, dataSize: 300 },
        { id: '4', planId: 'p1', status: BACKUP_STATUS.FAILED, dataSize: 50 },
      ];
      expect(calculatePlanStorageUsage(records, 'p1')).toBe(300);
      expect(calculatePlanStorageUsage(records, 'p2')).toBe(300);
      expect(calculatePlanStorageUsage(records, 'p3')).toBe(0);
    });
  });
});

describe('备份管理工具函数 - 格式化函数', () => {
  describe('formatBytes', () => {
    it('应该正确格式化字节单位', () => {
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(2 * 1024)).toBe('2.00 KB');
      expect(formatBytes(2 * 1024 * 1024)).toBe('2.00 MB');
      expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.00 GB');
    });

    it('应该保留两位小数', () => {
      expect(formatBytes(1536)).toBe('1.50 KB');
      expect(formatBytes(1572864)).toBe('1.50 MB');
    });

    it('0 或无效值应该返回 0 B', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes('invalid')).toBe('0 B');
      expect(formatBytes(null)).toBe('0 B');
    });
  });

  describe('formatDuration', () => {
    it('应该正确格式化秒数', () => {
      expect(formatDuration(30)).toBe('30秒');
      expect(formatDuration(90)).toBe('1分30秒');
      expect(formatDuration(3600)).toBe('1小时0分0秒');
      expect(formatDuration(3665)).toBe('1小时1分5秒');
    });

    it('0 或无效值应该返回 0秒', () => {
      expect(formatDuration(0)).toBe('0秒');
      expect(formatDuration('invalid')).toBe('0秒');
    });
  });
});

describe('备份管理工具函数 - 模拟函数', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });

  describe('simulateBackupDuration', () => {
    it('全量备份应该在 3000-5000ms 之间', () => {
      Math.random.mockReturnValue(0);
      expect(simulateBackupDuration(BACKUP_TYPES.FULL)).toBe(FULL_BACKUP_MIN_MS);
      Math.random.mockReturnValue(1);
      expect(simulateBackupDuration(BACKUP_TYPES.FULL)).toBe(FULL_BACKUP_MAX_MS);
    });

    it('增量备份应该在 1000-3000ms 之间', () => {
      Math.random.mockReturnValue(0);
      expect(simulateBackupDuration(BACKUP_TYPES.INCREMENTAL)).toBe(INCREMENTAL_BACKUP_MIN_MS);
      Math.random.mockReturnValue(1);
      expect(simulateBackupDuration(BACKUP_TYPES.INCREMENTAL)).toBe(INCREMENTAL_BACKUP_MAX_MS);
    });

    it('未知类型应该默认使用增量备份范围', () => {
      Math.random.mockReturnValue(0.5);
      const duration = simulateBackupDuration('unknown');
      expect(duration).toBeGreaterThanOrEqual(INCREMENTAL_BACKUP_MIN_MS);
      expect(duration).toBeLessThanOrEqual(INCREMENTAL_BACKUP_MAX_MS);
    });
  });

  describe('simulateBackupFailure', () => {
    it('随机值小于 0.1 应该返回 true', () => {
      Math.random.mockReturnValue(0.05);
      expect(simulateBackupFailure()).toBe(true);
    });

    it('随机值大于等于 0.1 应该返回 false', () => {
      Math.random.mockReturnValue(0.1);
      expect(simulateBackupFailure()).toBe(false);
      Math.random.mockReturnValue(0.5);
      expect(simulateBackupFailure()).toBe(false);
    });
  });

  describe('getRandomFailureReason', () => {
    it('应该返回预定义的失败原因之一', () => {
      for (let i = 0; i < FAILURE_REASONS.length; i++) {
        Math.random.mockReturnValue(i / FAILURE_REASONS.length);
        expect(FAILURE_REASONS).toContain(getRandomFailureReason());
      }
    });
  });

  describe('simulateDataSize', () => {
    it('全量备份应该比增量备份大', () => {
      Math.random.mockReturnValue(0.5);
      const fullSize = simulateDataSize(BACKUP_TYPES.FULL, ['database']);
      const incrementalSize = simulateDataSize(BACKUP_TYPES.INCREMENTAL, ['database']);
      expect(fullSize).toBeGreaterThan(incrementalSize);
    });

    it('多数据源应该比单数据源大', () => {
      Math.random.mockReturnValue(0.5);
      const singleSource = simulateDataSize(BACKUP_TYPES.FULL, ['database']);
      const multiSource = simulateDataSize(BACKUP_TYPES.FULL, ['database', 'file_system']);
      expect(multiSource).toBeGreaterThan(singleSource);
    });
  });

  describe('generateMockDataFiles', () => {
    it('database 数据源应该生成数据表文件', () => {
      const files = generateMockDataFiles(['database']);
      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f.type === 'database')).toBe(true);
      expect(files[0].records).toBeDefined();
    });

    it('file_system 数据源应该生成文件列表', () => {
      const files = generateMockDataFiles(['file_system']);
      expect(files.some((f) => f.type === 'file')).toBe(true);
      expect(files[0].size).toBeDefined();
    });

    it('config_file 数据源应该生成配置文件', () => {
      const files = generateMockDataFiles(['config_file']);
      expect(files.some((f) => f.type === 'config')).toBe(true);
      expect(files[0].entries).toBeDefined();
    });

    it('空数据源应该返回空数组', () => {
      expect(generateMockDataFiles([])).toEqual([]);
      expect(generateMockDataFiles(null)).toEqual([]);
    });
  });
});

describe('备份管理工具函数 - 状态统计', () => {
  describe('getPlanStatusCounts', () => {
    it('应该正确统计各状态数量', () => {
      const plans = [
        { id: '1', status: 'active' },
        { id: '2', status: 'active' },
        { id: '3', status: 'paused' },
      ];
      expect(getPlanStatusCounts(plans)).toEqual({ active: 2, paused: 1, total: 3 });
    });

    it('空数组应该返回全 0', () => {
      expect(getPlanStatusCounts([])).toEqual({ active: 0, paused: 0, total: 0 });
      expect(getPlanStatusCounts(null)).toEqual({ active: 0, paused: 0, total: 0 });
    });
  });

  describe('getRunningTaskCount', () => {
    it('应该统计运行中的任务数', () => {
      const records = [
        { id: '1', status: BACKUP_STATUS.RUNNING },
        { id: '2', status: BACKUP_STATUS.RUNNING },
        { id: '3', status: BACKUP_STATUS.SUCCESS },
      ];
      expect(getRunningTaskCount(records)).toBe(2);
    });

    it('空数组应该返回 0', () => {
      expect(getRunningTaskCount([])).toBe(0);
      expect(getRunningTaskCount(null)).toBe(0);
    });
  });

  describe('getLastBackupTime', () => {
    it('应该返回最近的备份时间', () => {
      const now = Date.now();
      const records = [
        { id: '1', status: BACKUP_STATUS.SUCCESS, createdAt: now - 3600000 },
        { id: '2', status: BACKUP_STATUS.FAILED, createdAt: now - 1800000 },
        { id: '3', status: BACKUP_STATUS.RUNNING, createdAt: now },
      ];
      expect(getLastBackupTime(records)).toBe(now - 1800000);
    });

    it('没有完成的备份应该返回 null', () => {
      const records = [{ id: '1', status: BACKUP_STATUS.RUNNING, createdAt: Date.now() }];
      expect(getLastBackupTime(records)).toBeNull();
      expect(getLastBackupTime([])).toBeNull();
      expect(getLastBackupTime(null)).toBeNull();
    });
  });

  describe('getNextScheduledBackup', () => {
    it('全局暂停应该返回 null', () => {
      expect(getNextScheduledBackup([], true)).toBeNull();
    });

    it('应该返回最早的下次备份时间', () => {
      const now = Date.now();
      const plans = [
        { id: '1', status: 'active', nextBackupTime: now + 3600000 },
        { id: '2', status: 'active', nextBackupTime: now + 1800000 },
        { id: '3', status: 'paused', nextBackupTime: now + 900000 },
      ];
      expect(getNextScheduledBackup(plans, false)).toBe(now + 1800000);
    });

    it('没有活动计划应该返回 null', () => {
      const plans = [{ id: '1', status: 'paused', nextBackupTime: Date.now() }];
      expect(getNextScheduledBackup(plans, false)).toBeNull();
      expect(getNextScheduledBackup([], false)).toBeNull();
      expect(getNextScheduledBackup(null, false)).toBeNull();
    });
  });
});

describe('备份管理工具函数 - 过滤和分组', () => {
  const mockRecords = [
    { id: '1', planId: 'p1', status: BACKUP_STATUS.SUCCESS, createdAt: 1000 },
    { id: '2', planId: 'p1', status: BACKUP_STATUS.FAILED, createdAt: 2000 },
    { id: '3', planId: 'p2', status: BACKUP_STATUS.SUCCESS, createdAt: 3000 },
    { id: '4', planId: 'p2', status: BACKUP_STATUS.RUNNING, createdAt: 4000 },
  ];

  describe('filterRecords', () => {
    it('应该按计划 ID 过滤', () => {
      const result = filterRecords(mockRecords, { planId: 'p1' });
      expect(result.length).toBe(2);
      expect(result.every((r) => r.planId === 'p1')).toBe(true);
    });

    it('应该按状态过滤', () => {
      const result = filterRecords(mockRecords, { status: BACKUP_STATUS.SUCCESS });
      expect(result.length).toBe(2);
      expect(result.every((r) => r.status === BACKUP_STATUS.SUCCESS)).toBe(true);
    });

    it('应该同时按计划和状态过滤', () => {
      const result = filterRecords(mockRecords, { planId: 'p1', status: BACKUP_STATUS.SUCCESS });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('结果应该按时间倒序排列', () => {
      const result = filterRecords(mockRecords, {});
      expect(result.map((r) => r.createdAt)).toEqual([4000, 3000, 2000, 1000]);
    });

    it('空数组应该返回空数组', () => {
      expect(filterRecords(null, {})).toEqual([]);
    });
  });

  describe('groupRecordsByPlan', () => {
    it('应该按计划 ID 分组', () => {
      const result = groupRecordsByPlan(mockRecords);
      expect(Object.keys(result)).toEqual(['p1', 'p2']);
      expect(result.p1.length).toBe(2);
      expect(result.p2.length).toBe(2);
    });

    it('空数组应该返回空对象', () => {
      expect(groupRecordsByPlan([])).toEqual({});
      expect(groupRecordsByPlan(null)).toEqual({});
    });
  });

  describe('paginateList', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));

    it('应该正确分页', () => {
      const result = paginateList(items, 1, 20);
      expect(result.items.length).toBe(20);
      expect(result.items[0].id).toBe(1);
      expect(result.items[19].id).toBe(20);
      expect(result.total).toBe(50);
      expect(result.totalPages).toBe(3);
      expect(result.currentPage).toBe(1);
    });

    it('第二页应该返回正确范围', () => {
      const result = paginateList(items, 2, 20);
      expect(result.items[0].id).toBe(21);
      expect(result.items[19].id).toBe(40);
      expect(result.currentPage).toBe(2);
    });

    it('最后一页应该返回剩余项', () => {
      const result = paginateList(items, 3, 20);
      expect(result.items.length).toBe(10);
      expect(result.items[0].id).toBe(41);
      expect(result.items[9].id).toBe(50);
    });

    it('页码超出范围应该返回最后一页', () => {
      const result = paginateList(items, 100, 20);
      expect(result.currentPage).toBe(3);
      expect(result.items.length).toBe(10);
    });

    it('页码小于 1 应该返回第一页', () => {
      const result = paginateList(items, 0, 20);
      expect(result.currentPage).toBe(1);
    });

    it('空数组应该返回默认分页信息', () => {
      const result = paginateList([], 1, 20);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
    });

    it('非数组输入应该返回默认分页信息', () => {
      const result = paginateList(null, 1, 20);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});

describe('备份管理工具函数 - 月度趋势', () => {
  describe('getMonthlyStorageTrend', () => {
    it('应该返回指定月数的趋势数据', () => {
      const now = new Date();
      const records = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        records.push({
          id: `r${i}`,
          status: BACKUP_STATUS.SUCCESS,
          createdAt: d.getTime(),
          dataSize: 100 * 1024 * 1024,
        });
      }
      const trend = getMonthlyStorageTrend(records, 6);
      expect(trend.length).toBe(6);
      expect(trend[0].usage).toBe(100 * 1024 * 1024);
    });

    it('空记录应该返回 0 使用量', () => {
      const trend = getMonthlyStorageTrend([], 3);
      expect(trend.length).toBe(3);
      expect(trend.every((t) => t.usage === 0)).toBe(true);
    });

    it('应该只统计成功的备份', () => {
      const now = new Date();
      const records = [
        {
          id: '1',
          status: BACKUP_STATUS.SUCCESS,
          createdAt: now.getTime(),
          dataSize: 100,
        },
        {
          id: '2',
          status: BACKUP_STATUS.FAILED,
          createdAt: now.getTime(),
          dataSize: 200,
        },
      ];
      const trend = getMonthlyStorageTrend(records, 1);
      expect(trend[0].usage).toBe(100);
    });
  });
});

describe('备份管理工具函数 - 表单验证', () => {
  describe('validatePlanForm', () => {
    it('有效表单应该验证通过', () => {
      const data = {
        name: '测试计划',
        backupType: BACKUP_TYPES.FULL,
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '02:00',
        retentionCount: 7,
        dataSources: ['database'],
      };
      const result = validatePlanForm(data);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('计划名称不能为空', () => {
      const data = {
        name: '',
        backupType: BACKUP_TYPES.FULL,
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '02:00',
        retentionCount: 7,
        dataSources: ['database'],
      };
      const result = validatePlanForm(data);
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('备份类型必填', () => {
      const data = {
        name: '测试',
        backupType: '',
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '02:00',
        retentionCount: 7,
        dataSources: ['database'],
      };
      const result = validatePlanForm(data);
      expect(result.valid).toBe(false);
      expect(result.errors.backupType).toBeDefined();
    });

    it('备份频率必填', () => {
      const data = {
        name: '测试',
        backupType: BACKUP_TYPES.FULL,
        frequency: '',
        backupTime: '02:00',
        retentionCount: 7,
        dataSources: ['database'],
      };
      const result = validatePlanForm(data);
      expect(result.valid).toBe(false);
      expect(result.errors.frequency).toBeDefined();
    });

    it('备份时间必填', () => {
      const data = {
        name: '测试',
        backupType: BACKUP_TYPES.FULL,
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '',
        retentionCount: 7,
        dataSources: ['database'],
      };
      const result = validatePlanForm(data);
      expect(result.valid).toBe(false);
      expect(result.errors.backupTime).toBeDefined();
    });

    it('保留份数必须在 1-30 之间', () => {
      const data = {
        name: '测试',
        backupType: BACKUP_TYPES.FULL,
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '02:00',
        retentionCount: 0,
        dataSources: ['database'],
      };
      expect(validatePlanForm(data).valid).toBe(false);
      expect(validatePlanForm({ ...data, retentionCount: 31 }).valid).toBe(false);
      expect(validatePlanForm({ ...data, retentionCount: 'invalid' }).valid).toBe(false);
      expect(validatePlanForm({ ...data, retentionCount: 1 }).valid).toBe(true);
      expect(validatePlanForm({ ...data, retentionCount: 30 }).valid).toBe(true);
    });

    it('备份目标至少选一个', () => {
      const data = {
        name: '测试',
        backupType: BACKUP_TYPES.FULL,
        frequency: FREQUENCY_TYPES.DAILY,
        backupTime: '02:00',
        retentionCount: 7,
        dataSources: [],
      };
      const result = validatePlanForm(data);
      expect(result.valid).toBe(false);
      expect(result.errors.dataSources).toBeDefined();
    });
  });
});

describe('备份管理工具函数 - 频率配置', () => {
  describe('parseFrequencyConfig', () => {
    it('每日频率应该返回简单配置', () => {
      expect(parseFrequencyConfig(FREQUENCY_TYPES.DAILY, {})).toEqual({
        type: FREQUENCY_TYPES.DAILY,
      });
    });

    it('每周频率应该包含周几', () => {
      expect(parseFrequencyConfig(FREQUENCY_TYPES.WEEKLY, { weekDay: 3 })).toEqual({
        type: FREQUENCY_TYPES.WEEKLY,
        weekDay: 3,
      });
    });

    it('每周频率默认周几为 1', () => {
      expect(parseFrequencyConfig(FREQUENCY_TYPES.WEEKLY, {})).toEqual({
        type: FREQUENCY_TYPES.WEEKLY,
        weekDay: 1,
      });
    });

    it('每月频率应该包含日期', () => {
      expect(parseFrequencyConfig(FREQUENCY_TYPES.MONTHLY, { monthDay: 15 })).toEqual({
        type: FREQUENCY_TYPES.MONTHLY,
        monthDay: 15,
      });
    });

    it('每月日期应该限制在 1-28', () => {
      expect(parseFrequencyConfig(FREQUENCY_TYPES.MONTHLY, { monthDay: 0 }).monthDay).toBe(1);
      expect(parseFrequencyConfig(FREQUENCY_TYPES.MONTHLY, { monthDay: 31 }).monthDay).toBe(28);
    });

    it('无效频率应该返回空对象', () => {
      expect(parseFrequencyConfig('invalid', {})).toEqual({});
    });
  });

  describe('formatFrequencyDisplay', () => {
    it('每日应该显示「每天」', () => {
      expect(formatFrequencyDisplay(FREQUENCY_TYPES.DAILY, {})).toBe('每天');
    });

    it('每周应该显示周几', () => {
      expect(formatFrequencyDisplay(FREQUENCY_TYPES.WEEKLY, { weekDay: 1 })).toBe('每周一');
      expect(formatFrequencyDisplay(FREQUENCY_TYPES.WEEKLY, { weekDay: 0 })).toBe('每周日');
      expect(formatFrequencyDisplay(FREQUENCY_TYPES.WEEKLY, { weekDay: 6 })).toBe('每周六');
    });

    it('每月应该显示日期', () => {
      expect(formatFrequencyDisplay(FREQUENCY_TYPES.MONTHLY, { monthDay: 15 })).toBe('每月15日');
      expect(formatFrequencyDisplay(FREQUENCY_TYPES.MONTHLY, { monthDay: 1 })).toBe('每月1日');
    });

    it('空频率应该返回空字符串', () => {
      expect(formatFrequencyDisplay('', {})).toBe('');
    });
  });
});
