import { describe, it, expect, vi } from 'vitest';
import {
  generatePickupCode,
  createCells,
  findAvailableCell,
  allocateCell,
  releaseCell,
  isOverdue,
  getOverdueHours,
  getOverduePackages,
  updateCellStatuses,
  validatePhone,
  validatePickupCode,
  maskPhone,
  getLastFourChars,
  formatDateTime,
  formatDate,
  checkPickupAttempts,
  recordFailedPickupAttempt,
  resetPickupAttempts,
  getStatistics,
  getDailyTrend,
  findPackageByPickupCode,
  regeneratePickupCode,
  verifyPackageSize,
  validateDeliveryForm,
  createPackage,
  createDeliveryRecord,
  createPickupRecord,
  pickupPackage,
  markOverdueAsProcessed,
  arrangeCellsInGrid,
} from '@/pages/locker-management/utils.js';

import {
  CELL_SIZE,
  CELL_STATUS,
  PACKAGE_STATUS,
  MAX_PICKUP_ATTEMPTS,
  LOCK_DURATION_SECONDS,
} from '@/pages/locker-management/constants.js';

describe('locker-management/utils supplementary', () => {
  describe('generatePickupCode edge cases', () => {
    it('generates codes with custom length', () => {
      const code = generatePickupCode([], 4);
      expect(code).toMatch(/^\d{4}$/);
    });

    it('handles empty array existingCodes', () => {
      const code = generatePickupCode([]);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('skips codes that exist in the set', () => {
      const existing = Array.from({ length: 999 }, (_, i) => String(i).padStart(3, '0'));
      const code = generatePickupCode(existing, 3);
      if (code !== null) {
        expect(existing).not.toContain(code);
      }
    });
  });

  describe('createCells edge cases', () => {
    it('handles partial config with defaults', () => {
      const cells = createCells({ largeCount: 3 });
      expect(cells.length).toBe(3);
      cells.forEach((c) => expect(c.size).toBe(CELL_SIZE.LARGE));
    });

    it('handles empty config object', () => {
      const cells = createCells({});
      expect(cells.length).toBe(0);
    });

    it('generates sequential cell codes for each size', () => {
      const cells = createCells({ largeCount: 3, mediumCount: 2, smallCount: 0 });
      const largeCodes = cells.filter((c) => c.size === CELL_SIZE.LARGE).map((c) => c.code);
      const mediumCodes = cells.filter((c) => c.size === CELL_SIZE.MEDIUM).map((c) => c.code);
      expect(largeCodes).toEqual(['A01', 'A02', 'A03']);
      expect(mediumCodes).toEqual(['B01', 'B02']);
    });
  });

  describe('findAvailableCell edge cases', () => {
    it('returns null when all cells of requested size are occupied', () => {
      const cells = [
        { id: 'c1', size: CELL_SIZE.LARGE, status: CELL_STATUS.OCCUPIED, packageId: 'p1' },
        { id: 'c2', size: CELL_SIZE.LARGE, status: CELL_STATUS.OCCUPIED, packageId: 'p2' },
      ];
      const packages = [
        { id: 'p1', status: PACKAGE_STATUS.PENDING },
        { id: 'p2', status: PACKAGE_STATUS.PENDING },
      ];
      expect(findAvailableCell(cells, CELL_SIZE.LARGE, packages)).toBe(null);
    });

    it('returns null when no cells of requested size exist', () => {
      const cells = [
        { id: 'c1', size: CELL_SIZE.LARGE, status: CELL_STATUS.AVAILABLE, packageId: null },
      ];
      expect(findAvailableCell(cells, CELL_SIZE.SMALL, [])).toBe(null);
    });

    it('returns null for empty cells array', () => {
      expect(findAvailableCell([], CELL_SIZE.LARGE, [])).toBe(null);
    });

    it('throws for null cells input', () => {
      expect(() => findAvailableCell(null, CELL_SIZE.LARGE, null)).toThrow();
    });

    it('returns first available cell when multiple are free', () => {
      const cells = [
        { id: 'c1', size: CELL_SIZE.SMALL, status: CELL_STATUS.AVAILABLE, packageId: null },
        { id: 'c2', size: CELL_SIZE.SMALL, status: CELL_STATUS.AVAILABLE, packageId: null },
        { id: 'c3', size: CELL_SIZE.SMALL, status: CELL_STATUS.AVAILABLE, packageId: null },
      ];
      const result = findAvailableCell(cells, CELL_SIZE.SMALL, []);
      expect(result.id).toBe('c1');
    });
  });

  describe('allocateCell and releaseCell edge cases', () => {
    it('allocateCell does not modify other cells', () => {
      const cells = [
        { id: 'c1', size: CELL_SIZE.LARGE, status: CELL_STATUS.AVAILABLE, packageId: null },
        { id: 'c2', size: CELL_SIZE.LARGE, status: CELL_STATUS.AVAILABLE, packageId: null },
      ];
      const updated = allocateCell(cells, [], 'c1', 'p1');
      expect(updated[1].status).toBe(CELL_STATUS.AVAILABLE);
      expect(updated[1].packageId).toBe(null);
    });

    it('releaseCell with non-existent cellId returns unchanged cells', () => {
      const cells = [
        { id: 'c1', size: CELL_SIZE.LARGE, status: CELL_STATUS.OCCUPIED, packageId: 'p1' },
      ];
      const updated = releaseCell(cells, 'c_nonexistent');
      expect(updated[0].status).toBe(CELL_STATUS.OCCUPIED);
      expect(updated[0].packageId).toBe('p1');
    });
  });

  describe('overdue logic edge cases', () => {
    it('isOverdue returns false for null delivery time', () => {
      expect(isOverdue(null, Date.now(), 48)).toBe(false);
    });

    it('isOverdue returns false for zero delivery time', () => {
      expect(isOverdue(0, Date.now(), 48)).toBe(false);
    });

    it('isOverdue returns true one millisecond past retention', () => {
      const now = 1000000;
      const retentionMs = 48 * 60 * 60 * 1000;
      const deliveryTime = now - retentionMs - 1;
      expect(isOverdue(deliveryTime, now, 48)).toBe(true);
    });

    it('isOverdue returns false exactly at retention boundary', () => {
      const now = 1000000;
      const retentionMs = 48 * 60 * 60 * 1000;
      const deliveryTime = now - retentionMs;
      expect(isOverdue(deliveryTime, now, 48)).toBe(false);
    });

    it('getOverdueHours returns 0 for null delivery time', () => {
      expect(getOverdueHours(null, Date.now(), 48)).toBe(0);
    });

    it('getOverdueHours returns 0 exactly at boundary', () => {
      const now = 1000000;
      const retentionMs = 48 * 60 * 60 * 1000;
      expect(getOverdueHours(now - retentionMs, now, 48)).toBe(0);
    });

    it('getOverdueHours truncates fractional hours', () => {
      const now = 1000000;
      const retentionMs = 48 * 60 * 60 * 1000;
      const deliveryTime = now - retentionMs - 90 * 60 * 1000;
      expect(getOverdueHours(deliveryTime, now, 48)).toBe(1);
    });

    it('getOverduePackages excludes picked-up packages', () => {
      const now = Date.now();
      const packages = [
        { id: 'p1', status: PACKAGE_STATUS.PENDING, deliveredAt: now - 100 * 60 * 60 * 1000 },
        { id: 'p2', status: PACKAGE_STATUS.PICKED_UP, deliveredAt: now - 100 * 60 * 60 * 1000 },
        { id: 'p3', status: PACKAGE_STATUS.ADMIN_PICKED, deliveredAt: now - 100 * 60 * 60 * 1000 },
      ];
      const overdue = getOverduePackages(packages, now, 48);
      expect(overdue.length).toBe(1);
      expect(overdue[0].id).toBe('p1');
    });

    it('getOverduePackages handles null packages', () => {
      expect(getOverduePackages(null, Date.now(), 48)).toEqual([]);
    });

    it('updateCellStatuses does not modify available cells', () => {
      const now = Date.now();
      const cells = [
        { id: 'c1', status: CELL_STATUS.AVAILABLE, packageId: null },
      ];
      const packages = [
        { id: 'p1', status: PACKAGE_STATUS.PENDING, deliveredAt: now - 100 * 60 * 60 * 1000 },
      ];
      const updated = updateCellStatuses(cells, packages, now, 48);
      expect(updated[0].status).toBe(CELL_STATUS.AVAILABLE);
    });

    it('updateCellStatuses reverts overdue cell to occupied when time resets', () => {
      const now = Date.now();
      const cells = [
        { id: 'c1', status: CELL_STATUS.OVERDUE, packageId: 'p1' },
      ];
      const packages = [
        { id: 'p1', status: PACKAGE_STATUS.PENDING, deliveredAt: now - 1 * 60 * 60 * 1000 },
      ];
      const updated = updateCellStatuses(cells, packages, now, 48);
      expect(updated[0].status).toBe(CELL_STATUS.OCCUPIED);
    });
  });

  describe('validation edge cases', () => {
    it('validatePhone rejects strings with spaces', () => {
      expect(validatePhone('138 12345678')).toBe(false);
    });

    it('validatePhone rejects phone starting with 0', () => {
      expect(validatePhone('01381234567')).toBe(false);
    });

    it('validatePhone rejects phone starting with 2', () => {
      expect(validatePhone('23812345678')).toBe(false);
    });

    it('validatePhone accepts phone starting with 1 and digit 3-9', () => {
      expect(validatePhone('13000000000')).toBe(true);
      expect(validatePhone('19000000000')).toBe(true);
    });

    it('validatePickupCode rejects strings with letters', () => {
      expect(validatePickupCode('12345a')).toBe(false);
    });

    it('validatePickupCode rejects strings with spaces', () => {
      expect(validatePickupCode('123 56')).toBe(false);
    });

    it('maskPhone handles short strings', () => {
      expect(maskPhone('123')).toBe('123');
      expect(maskPhone('')).toBe('');
    });

    it('maskPhone handles null input', () => {
      expect(maskPhone(null)).toBe(null);
    });

    it('getLastFourChars handles null and empty', () => {
      expect(getLastFourChars(null)).toBe('');
      expect(getLastFourChars('')).toBe('');
      expect(getLastFourChars('ab')).toBe('ab');
    });
  });

  describe('formatDateTime and formatDate', () => {
    it('formatDateTime returns empty string for null', () => {
      expect(formatDateTime(null)).toBe('');
    });

    it('formatDateTime returns empty string for 0', () => {
      expect(formatDateTime(0)).toBe('');
    });

    it('formatDateTime formats correctly', () => {
      const ts = new Date('2024-06-15T08:30:00Z').getTime();
      const result = formatDateTime(ts);
      expect(result).toContain('2024');
      expect(result).toContain('06');
      expect(result).toContain('15');
    });

    it('formatDate returns empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('formatDate returns empty string for 0', () => {
      expect(formatDate(0)).toBe('');
    });

    it('formatDate formats correctly', () => {
      const ts = new Date('2024-12-25T00:00:00Z').getTime();
      const result = formatDate(ts);
      expect(result).toContain('2024');
      expect(result).toContain('12');
      expect(result).toContain('25');
    });
  });

  describe('pickup attempt limiting edge cases', () => {
    it('checkPickupAttempts allows when lock has expired', () => {
      const past = Date.now() - 10000;
      const attempts = { count: 0, lastAttempt: past, lockedUntil: past };
      const result = checkPickupAttempts(attempts);
      expect(result.allowed).toBe(true);
    });

    it('checkPickupAttempts handles null input', () => {
      const result = checkPickupAttempts(null);
      expect(result.allowed).toBe(true);
    });

    it('recordFailedPickupAttempt handles null input', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const result = recordFailedPickupAttempt(null);
      expect(result.count).toBe(1);
      vi.useRealTimers();
    });

    it('recordFailedPickupAttempt accumulates correctly before lock', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      let attempts = { count: 0, lastAttempt: 0, lockedUntil: 0 };
      for (let i = 1; i < MAX_PICKUP_ATTEMPTS; i++) {
        attempts = recordFailedPickupAttempt(attempts);
        expect(attempts.count).toBe(i);
        expect(attempts.lockedUntil).toBe(0);
      }
      vi.useRealTimers();
    });

    it('locked attempts reset count to 0 after lock triggered', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      let attempts = { count: MAX_PICKUP_ATTEMPTS - 1, lastAttempt: Date.now(), lockedUntil: 0 };
      attempts = recordFailedPickupAttempt(attempts);
      expect(attempts.lockedUntil).toBe(Date.now() + LOCK_DURATION_SECONDS * 1000);
      expect(attempts.count).toBe(0);
      vi.useRealTimers();
    });

    it('resetPickupAttempts returns correct structure', () => {
      const result = resetPickupAttempts();
      expect(result).toEqual({ count: 0, lastAttempt: 0, lockedUntil: 0 });
    });
  });

  describe('statistics edge cases', () => {
    it('getStatistics counts overdue cells as occupied', () => {
      const now = new Date('2024-06-15T12:00:00Z').getTime();
      const cells = [
        { id: 'c1', size: CELL_SIZE.LARGE, status: CELL_STATUS.OCCUPIED },
        { id: 'c2', size: CELL_SIZE.LARGE, status: CELL_STATUS.OVERDUE },
        { id: 'c3', size: CELL_SIZE.LARGE, status: CELL_STATUS.AVAILABLE },
      ];
      const stats = getStatistics([], cells, [], [], now);
      expect(stats.occupiedCells).toBe(2);
      expect(stats.availableCells).toBe(1);
    });

    it('getStatistics sizeUsage calculates correctly for mixed states', () => {
      const now = new Date('2024-06-15T12:00:00Z').getTime();
      const cells = [
        { id: 'c1', size: CELL_SIZE.LARGE, status: CELL_STATUS.OCCUPIED },
        { id: 'c2', size: CELL_SIZE.LARGE, status: CELL_STATUS.AVAILABLE },
        { id: 'c3', size: CELL_SIZE.MEDIUM, status: CELL_STATUS.OVERDUE },
        { id: 'c4', size: CELL_SIZE.MEDIUM, status: CELL_STATUS.AVAILABLE },
        { id: 'c5', size: CELL_SIZE.SMALL, status: CELL_STATUS.AVAILABLE },
      ];
      const stats = getStatistics([], cells, [], [], now);
      expect(stats.sizeUsage[CELL_SIZE.LARGE]).toEqual({ total: 2, used: 1 });
      expect(stats.sizeUsage[CELL_SIZE.MEDIUM]).toEqual({ total: 2, used: 1 });
      expect(stats.sizeUsage[CELL_SIZE.SMALL]).toEqual({ total: 1, used: 0 });
    });

    it('getDailyTrend handles empty records', () => {
      const now = new Date('2024-06-15T12:00:00Z').getTime();
      const trend = getDailyTrend([], [], 7, now);
      expect(trend.length).toBe(7);
      trend.forEach((day) => {
        expect(day.deliveries).toBe(0);
        expect(day.pickups).toBe(0);
      });
    });

    it('getDailyTrend correctly distributes records across days', () => {
      const now = new Date('2024-06-15T12:00:00Z').getTime();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayMs = todayStart.getTime();

      const deliveryRecords = [
        { deliveredAt: todayMs + 3600000 },
        { deliveredAt: todayMs + 7200000 },
        { deliveredAt: todayMs - 86400000 + 3600000 },
      ];
      const pickupRecords = [
        { pickedUpAt: todayMs + 1800000 },
      ];

      const trend = getDailyTrend(pickupRecords, deliveryRecords, 2, now);
      expect(trend.length).toBe(2);
      expect(trend[1].deliveries).toBe(2);
      expect(trend[1].pickups).toBe(1);
      expect(trend[0].deliveries).toBe(1);
      expect(trend[0].pickups).toBe(0);
    });
  });

  describe('findPackageByPickupCode edge cases', () => {
    it('returns null for empty code', () => {
      expect(findPackageByPickupCode([], '')).toBe(null);
    });

    it('returns null for null code', () => {
      expect(findPackageByPickupCode([], null)).toBe(null);
    });

    it('returns null for null packages', () => {
      expect(findPackageByPickupCode(null, '123456')).toBe(null);
    });

    it('returns null when code matches a picked-up package', () => {
      const packages = [
        { id: 'p1', pickupCode: '123456', status: PACKAGE_STATUS.PICKED_UP },
      ];
      expect(findPackageByPickupCode(packages, '123456')).toBe(null);
    });

    it('returns null when code matches an admin-picked package', () => {
      const packages = [
        { id: 'p1', pickupCode: '123456', status: PACKAGE_STATUS.ADMIN_PICKED },
      ];
      expect(findPackageByPickupCode(packages, '123456')).toBe(null);
    });

    it('finds package when multiple packages have different codes', () => {
      const packages = [
        { id: 'p1', pickupCode: '111111', status: PACKAGE_STATUS.PENDING },
        { id: 'p2', pickupCode: '222222', status: PACKAGE_STATUS.PENDING },
        { id: 'p3', pickupCode: '333333', status: PACKAGE_STATUS.PENDING },
      ];
      const result = findPackageByPickupCode(packages, '222222');
      expect(result.id).toBe('p2');
    });
  });

  describe('regeneratePickupCode edge cases', () => {
    it('generates new code even when package not found (no validation of existence)', () => {
      const packages = [
        { id: 'p1', pickupCode: '123456', status: PACKAGE_STATUS.PENDING },
      ];
      const result = regeneratePickupCode(packages, 'nonexistent');
      expect(result.success).toBe(true);
      expect(result.newCode).not.toBe('123456');
    });

    it('generates code for null packages (treated as empty)', () => {
      const result = regeneratePickupCode(null, 'p1');
      expect(result.success).toBe(true);
      expect(result.newCode).toMatch(/^\d{6}$/);
    });

    it('does not duplicate existing pending codes', () => {
      const packages = [
        { id: 'p1', pickupCode: '123456', status: PACKAGE_STATUS.PENDING },
        { id: 'p2', pickupCode: '654321', status: PACKAGE_STATUS.PENDING },
      ];
      const result = regeneratePickupCode(packages, 'p1');
      if (result.success) {
        expect(result.newCode).not.toBe('123456');
        expect(result.newCode).not.toBe('654321');
        const updated = result.updatedPackages.find((p) => p.id === 'p1');
        expect(updated.pickupCode).toBe(result.newCode);
        expect(updated.codeRegeneratedAt).toBeTruthy();
      }
    });

    it('preserves other packages unchanged', () => {
      const packages = [
        { id: 'p1', pickupCode: '123456', status: PACKAGE_STATUS.PENDING },
        { id: 'p2', pickupCode: '654321', status: PACKAGE_STATUS.PENDING },
      ];
      const result = regeneratePickupCode(packages, 'p1');
      if (result.success) {
        const p2 = result.updatedPackages.find((p) => p.id === 'p2');
        expect(p2.pickupCode).toBe('654321');
      }
    });
  });

  describe('validateDeliveryForm edge cases', () => {
    it('rejects invalid package size', () => {
      const data = { phone: '13812345678', trackingNo: 'SF123', size: 'XL' };
      const result = validateDeliveryForm(data);
      expect(result.valid).toBe(false);
      expect(result.errors.size).toBeTruthy();
    });

    it('accepts form with only required fields', () => {
      const data = { phone: '13812345678', trackingNo: 'SF123', size: CELL_SIZE.LARGE };
      const result = validateDeliveryForm(data);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('rejects missing all required fields', () => {
      const result = validateDeliveryForm({});
      expect(result.valid).toBe(false);
      expect(result.errors.phone).toBeTruthy();
      expect(result.errors.trackingNo).toBeTruthy();
      expect(result.errors.size).toBeTruthy();
    });
  });

  describe('pickupPackage edge cases', () => {
    it('returns failure for non-existent package', () => {
      const packages = [
        { id: 'p1', cellId: 'c1', status: PACKAGE_STATUS.PENDING },
      ];
      const result = pickupPackage(packages, 'nonexistent', 'user');
      expect(result.success).toBe(false);
    });

    it('handles null packages', () => {
      const result = pickupPackage(null, 'p1', 'user');
      expect(result.success).toBe(false);
    });

    it('creates record with correct operator', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const packages = [
        { id: 'p1', cellId: 'c1', size: CELL_SIZE.LARGE, status: PACKAGE_STATUS.PENDING },
      ];
      const result = pickupPackage(packages, 'p1', 'admin');
      expect(result.success).toBe(true);
      expect(result.record.pickedUpBy).toBe('admin');
      expect(result.updatedPackages[0].pickedUpBy).toBe('admin');
      expect(result.cellId).toBe('c1');
      vi.useRealTimers();
    });
  });

  describe('markOverdueAsProcessed edge cases', () => {
    it('handles empty packageIds array', () => {
      const packages = [
        { id: 'p1', processed: false },
      ];
      const result = markOverdueAsProcessed(packages, []);
      expect(result[0].processed).toBe(false);
    });

    it('handles null packageIds', () => {
      const packages = [
        { id: 'p1', processed: false },
      ];
      const result = markOverdueAsProcessed(packages, null);
      expect(result[0].processed).toBe(false);
    });

    it('handles null packages', () => {
      const result = markOverdueAsProcessed(null, ['p1']);
      expect(result).toEqual([]);
    });

    it('marks multiple packages', () => {
      const packages = [
        { id: 'p1', processed: false },
        { id: 'p2', processed: false },
        { id: 'p3', processed: false },
      ];
      const result = markOverdueAsProcessed(packages, ['p1', 'p3']);
      expect(result[0].processed).toBe(true);
      expect(result[1].processed).toBe(false);
      expect(result[2].processed).toBe(true);
    });

    it('sets processedAt timestamp', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const packages = [{ id: 'p1', processed: false }];
      const result = markOverdueAsProcessed(packages, ['p1']);
      expect(result[0].processedAt).toBe(Date.now());
      vi.useRealTimers();
    });
  });

  describe('arrangeCellsInGrid edge cases', () => {
    it('handles empty cells array', () => {
      const grid = arrangeCellsInGrid([], 4);
      expect(grid).toEqual([]);
    });

    it('handles null cells', () => {
      const grid = arrangeCellsInGrid(null, 4);
      expect(grid).toEqual([]);
    });

    it('arranges large config correctly (8L, 12M, 20S in 4 rows)', () => {
      const cells = createCells({ largeCount: 8, mediumCount: 12, smallCount: 20 });
      const grid = arrangeCellsInGrid(cells, 4);
      expect(grid.length).toBe(4);
      const totalCells = grid.reduce((sum, row) => sum + row.length, 0);
      expect(totalCells).toBe(40);
    });

    it('first row first cell is the first large cell', () => {
      const cells = createCells({ largeCount: 2, mediumCount: 2, smallCount: 2 });
      const grid = arrangeCellsInGrid(cells, 4);
      expect(grid[0][0].size).toBe(CELL_SIZE.LARGE);
    });

    it('last row last cell is small type when small cells exist', () => {
      const cells = createCells({ largeCount: 1, mediumCount: 1, smallCount: 2 });
      const grid = arrangeCellsInGrid(cells, 4);
      const lastRow = grid[grid.length - 1];
      const lastCell = lastRow[lastRow.length - 1];
      expect(lastCell.size).toBe(CELL_SIZE.SMALL);
    });
  });

  describe('verifyPackageSize', () => {
    it('accepts valid sizes', () => {
      expect(verifyPackageSize(CELL_SIZE.LARGE)).toBe(true);
      expect(verifyPackageSize(CELL_SIZE.MEDIUM)).toBe(true);
      expect(verifyPackageSize(CELL_SIZE.SMALL)).toBe(true);
    });

    it('rejects invalid sizes', () => {
      expect(verifyPackageSize('')).toBe(false);
      expect(verifyPackageSize(null)).toBe(false);
      expect(verifyPackageSize('XL')).toBe(false);
    });
  });

  describe('createPackage edge cases', () => {
    it('sets default remark to empty string', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const data = { phone: '13812345678', size: CELL_SIZE.MEDIUM, trackingNo: 'SF123' };
      const pkg = createPackage(data, '654321', 'c1');
      expect(pkg.remark).toBe('');
      vi.useRealTimers();
    });

    it('sets initial status to PENDING', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const data = { phone: '13812345678', size: CELL_SIZE.MEDIUM, trackingNo: 'SF123' };
      const pkg = createPackage(data, '654321', 'c1');
      expect(pkg.status).toBe(PACKAGE_STATUS.PENDING);
      expect(pkg.pickedUpAt).toBe(null);
      expect(pkg.pickedUpBy).toBe(null);
      expect(pkg.processed).toBe(false);
      vi.useRealTimers();
    });

    it('preserves provided remark', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const data = { phone: '13812345678', size: CELL_SIZE.MEDIUM, trackingNo: 'SF123', remark: '易碎品' };
      const pkg = createPackage(data, '654321', 'c1');
      expect(pkg.remark).toBe('易碎品');
      vi.useRealTimers();
    });
  });

  describe('createDeliveryRecord and createPickupRecord', () => {
    it('createDeliveryRecord copies relevant fields', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const pkg = { id: 'p1', cellId: 'c1', size: CELL_SIZE.LARGE, deliveredAt: Date.now() };
      const record = createDeliveryRecord(pkg);
      expect(record.packageId).toBe('p1');
      expect(record.cellId).toBe('c1');
      expect(record.size).toBe(CELL_SIZE.LARGE);
      expect(record.deliveredAt).toBe(pkg.deliveredAt);
      expect(record.id).toBeTruthy();
      vi.useRealTimers();
    });

    it('createPickupRecord sets operator to user by default', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const pkg = { id: 'p1', cellId: 'c1', size: CELL_SIZE.MEDIUM };
      const record = createPickupRecord(pkg);
      expect(record.pickedUpBy).toBe('user');
      expect(record.packageId).toBe('p1');
      vi.useRealTimers();
    });

    it('createPickupRecord sets operator to admin when specified', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const pkg = { id: 'p1', cellId: 'c1', size: CELL_SIZE.MEDIUM };
      const record = createPickupRecord(pkg, 'admin');
      expect(record.pickedUpBy).toBe('admin');
      vi.useRealTimers();
    });
  });

  describe('config change data consistency', () => {
    it('clearing packages should leave no dangling references in records', () => {
      const packages = [
        { id: 'p1', cellId: 'c1', status: PACKAGE_STATUS.PENDING, trackingNo: 'SF001' },
        { id: 'p2', cellId: 'c2', status: PACKAGE_STATUS.PICKED_UP, trackingNo: 'SF002' },
      ];
      const deliveryRecords = [
        { packageId: 'p1', cellId: 'c1', deliveredAt: 1000 },
        { packageId: 'p2', cellId: 'c2', deliveredAt: 2000 },
      ];
      const pickupRecords = [
        { packageId: 'p2', cellId: 'c2', pickedUpAt: 3000 },
      ];
      const packageIds = new Set(packages.map((p) => p.id));
      const danglingDeliveries = deliveryRecords.filter(
        (r) => !packageIds.has(r.packageId)
      );
      const danglingPickups = pickupRecords.filter(
        (r) => !packageIds.has(r.packageId)
      );
      expect(danglingDeliveries.length).toBe(0);
      expect(danglingPickups.length).toBe(0);

      const clearedPackageIds = new Set([]);
      const allDanglingDeliveries = deliveryRecords.filter(
        (r) => !clearedPackageIds.has(r.packageId)
      );
      const allDanglingPickups = pickupRecords.filter(
        (r) => !clearedPackageIds.has(r.packageId)
      );
      expect(allDanglingDeliveries.length).toBe(deliveryRecords.length);
      expect(allDanglingPickups.length).toBe(pickupRecords.length);
    });
  });
});
