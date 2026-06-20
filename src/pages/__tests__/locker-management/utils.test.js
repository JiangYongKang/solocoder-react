import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateId,
  generatePickupCode,
  generateCellCode,
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

function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    _store: store,
  };
}

describe('locker-management/utils', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) ids.add(generateId());
      expect(ids.size).toBe(100);
    });

    it('should include prefix when provided', () => {
      const id = generateId('test_');
      expect(id.startsWith('test_')).toBe(true);
    });
  });

  describe('generatePickupCode', () => {
    it('should generate 6-digit numeric code', () => {
      const code = generatePickupCode([]);
      expect(code).toMatch(/^\d{6}$/);
      expect(code?.length).toBe(6);
    });

    it('should generate unique code not in existingCodes', () => {
      const existing = ['123456', '654321', '111111'];
      const code = generatePickupCode(existing);
      expect(existing).not.toContain(code);
    });

    it('should return null when all possible codes are used', () => {
      const allCodes = Array.from({ length: 1000 }, (_, i) => String(i).padStart(3, '0'));
      const code = generatePickupCode(allCodes, 3);
      expect(code).toBe(null);
    });

    it('should handle non-array existingCodes', () => {
      const code = generatePickupCode(null);
      expect(code).toMatch(/^\d{6}$/);
    });
  });

  describe('generateCellCode', () => {
    it('generates correct large cell code', () => {
      expect(generateCellCode(CELL_SIZE.LARGE, 0)).toBe('A01');
      expect(generateCellCode(CELL_SIZE.LARGE, 7)).toBe('A08');
    });

    it('generates correct medium cell code', () => {
      expect(generateCellCode(CELL_SIZE.MEDIUM, 0)).toBe('B01');
      expect(generateCellCode(CELL_SIZE.MEDIUM, 11)).toBe('B12');
    });

    it('generates correct small cell code', () => {
      expect(generateCellCode(CELL_SIZE.SMALL, 0)).toBe('C01');
      expect(generateCellCode(CELL_SIZE.SMALL, 19)).toBe('C20');
    });
  });

  describe('createCells', () => {
    it('creates correct number of cells with default config', () => {
      const config = { largeCount: 8, mediumCount: 12, smallCount: 20 };
      const cells = createCells(config);
      expect(cells.length).toBe(40);
      
      const largeCells = cells.filter((c) => c.size === CELL_SIZE.LARGE);
      const mediumCells = cells.filter((c) => c.size === CELL_SIZE.MEDIUM);
      const smallCells = cells.filter((c) => c.size === CELL_SIZE.SMALL);
      
      expect(largeCells.length).toBe(8);
      expect(mediumCells.length).toBe(12);
      expect(smallCells.length).toBe(20);
    });

    it('creates cells with correct initial status', () => {
      const config = { largeCount: 2, mediumCount: 0, smallCount: 0 };
      const cells = createCells(config);
      cells.forEach((cell) => {
        expect(cell.status).toBe(CELL_STATUS.AVAILABLE);
        expect(cell.packageId).toBe(null);
        expect(cell.id).toBeTruthy();
        expect(cell.code).toBeTruthy();
      });
    });

    it('handles zero counts', () => {
      const config = { largeCount: 0, mediumCount: 0, smallCount: 0 };
      const cells = createCells(config);
      expect(cells.length).toBe(0);
    });
  });

  describe('cell allocation', () => {
    const createTestCells = () => [
      { id: 'c1', code: 'A01', size: CELL_SIZE.LARGE, status: CELL_STATUS.AVAILABLE, packageId: null },
      { id: 'c2', code: 'A02', size: CELL_SIZE.LARGE, status: CELL_STATUS.AVAILABLE, packageId: null },
      { id: 'c3', code: 'B01', size: CELL_SIZE.MEDIUM, status: CELL_STATUS.OCCUPIED, packageId: 'pkg1' },
      { id: 'c4', code: 'C01', size: CELL_SIZE.SMALL, status: CELL_STATUS.AVAILABLE, packageId: null },
    ];

    const createTestPackages = () => [
      { id: 'pkg1', status: PACKAGE_STATUS.PENDING },
      { id: 'pkg2', status: PACKAGE_STATUS.PICKED_UP },
    ];

    it('findAvailableCell finds first available cell of correct size', () => {
      const cells = createTestCells();
      const packages = createTestPackages();
      const cell = findAvailableCell(cells, CELL_SIZE.LARGE, packages);
      expect(cell).toBeTruthy();
      expect(cell.size).toBe(CELL_SIZE.LARGE);
      expect(cell.status).toBe(CELL_STATUS.AVAILABLE);
    });

    it('findAvailableCell returns null when no cells available', () => {
      const cells = createTestCells();
      const packages = createTestPackages();
      const cell = findAvailableCell(cells, CELL_SIZE.MEDIUM, packages);
      expect(cell).toBe(null);
    });

    it('allocateCell marks cell as occupied', () => {
      const cells = createTestCells();
      const packages = createTestPackages();
      const updated = allocateCell(cells, packages, 'c1', 'pkg_new');
      const c1 = updated.find((c) => c.id === 'c1');
      expect(c1.status).toBe(CELL_STATUS.OCCUPIED);
      expect(c1.packageId).toBe('pkg_new');
    });

    it('releaseCell marks cell as available', () => {
      const cells = createTestCells();
      const updated = releaseCell(cells, 'c3');
      const c3 = updated.find((c) => c.id === 'c3');
      expect(c3.status).toBe(CELL_STATUS.AVAILABLE);
      expect(c3.packageId).toBe(null);
    });

    it('does not mutate original arrays', () => {
      const cells = createTestCells();
      const originalC1Status = cells[0].status;
      allocateCell(cells, [], 'c1', 'pkg_new');
      expect(cells[0].status).toBe(originalC1Status);
    });
  });

  describe('overdue logic', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    const retentionHours = 48;

    it('isOverdue returns false for recent delivery', () => {
      const recent = now - 24 * 60 * 60 * 1000;
      expect(isOverdue(recent, now, retentionHours)).toBe(false);
    });

    it('isOverdue returns true for old delivery', () => {
      const old = now - 50 * 60 * 60 * 1000;
      expect(isOverdue(old, now, retentionHours)).toBe(true);
    });

    it('isOverdue returns false exactly at retention boundary', () => {
      const boundary = now - retentionHours * 60 * 60 * 1000;
      expect(isOverdue(boundary, now, retentionHours)).toBe(false);
    });

    it('getOverdueHours returns 0 for recent delivery', () => {
      const recent = now - 24 * 60 * 60 * 1000;
      expect(getOverdueHours(recent, now, retentionHours)).toBe(0);
    });

    it('getOverdueHours returns correct hours', () => {
      const deliveryTime = now - (retentionHours + 5) * 60 * 60 * 1000;
      expect(getOverdueHours(deliveryTime, now, retentionHours)).toBe(5);
    });

    it('getOverduePackages filters correctly', () => {
      const packages = [
        { id: 'p1', status: PACKAGE_STATUS.PENDING, deliveredAt: now - 100 * 60 * 60 * 1000 },
        { id: 'p2', status: PACKAGE_STATUS.PENDING, deliveredAt: now - 24 * 60 * 60 * 1000 },
        { id: 'p3', status: PACKAGE_STATUS.PICKED_UP, deliveredAt: now - 100 * 60 * 60 * 1000 },
      ];
      const overdue = getOverduePackages(packages, now, retentionHours);
      expect(overdue.length).toBe(1);
      expect(overdue[0].id).toBe('p1');
    });

    it('updateCellStatuses marks overdue cells', () => {
      const cells = [
        { id: 'c1', status: CELL_STATUS.OCCUPIED, packageId: 'p1' },
        { id: 'c2', status: CELL_STATUS.OCCUPIED, packageId: 'p2' },
      ];
      const packages = [
        { id: 'p1', status: PACKAGE_STATUS.PENDING, deliveredAt: now - 100 * 60 * 60 * 1000 },
        { id: 'p2', status: PACKAGE_STATUS.PENDING, deliveredAt: now - 24 * 60 * 60 * 1000 },
      ];
      const updated = updateCellStatuses(cells, packages, now, retentionHours);
      expect(updated[0].status).toBe(CELL_STATUS.OVERDUE);
      expect(updated[1].status).toBe(CELL_STATUS.OCCUPIED);
    });
  });

  describe('validation functions', () => {
    it('validatePhone accepts valid phone numbers', () => {
      expect(validatePhone('13812345678')).toBe(true);
      expect(validatePhone('15912345678')).toBe(true);
      expect(validatePhone('18612345678')).toBe(true);
    });

    it('validatePhone rejects invalid phone numbers', () => {
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('12345678901')).toBe(false);
      expect(validatePhone('1381234567')).toBe(false);
      expect(validatePhone('138123456789')).toBe(false);
      expect(validatePhone('23812345678')).toBe(false);
    });

    it('validatePickupCode validates 6-digit code', () => {
      expect(validatePickupCode('123456')).toBe(true);
      expect(validatePickupCode('000000')).toBe(true);
      expect(validatePickupCode('12345')).toBe(false);
      expect(validatePickupCode('1234567')).toBe(false);
      expect(validatePickupCode('abcdef')).toBe(false);
      expect(validatePickupCode('')).toBe(false);
    });

    it('maskPhone masks middle 4 digits', () => {
      expect(maskPhone('13812345678')).toBe('138****5678');
      expect(maskPhone('138****5678')).toBe('138****5678');
    });

    it('getLastFourChars returns last 4 characters', () => {
      expect(getLastFourChars('SF1234567890')).toBe('7890');
      expect(getLastFourChars('1234')).toBe('1234');
      expect(getLastFourChars('12')).toBe('12');
    });
  });

  describe('pickup attempt limiting', () => {
    it('checkPickupAttempts allows when not locked', () => {
      const attempts = { count: 0, lastAttempt: 0, lockedUntil: 0 };
      const result = checkPickupAttempts(attempts);
      expect(result.allowed).toBe(true);
    });

    it('checkPickupAttempts blocks when locked', () => {
      const now = Date.now();
      const attempts = { count: 0, lastAttempt: 0, lockedUntil: now + 10000 };
      const result = checkPickupAttempts(attempts);
      expect(result.allowed).toBe(false);
      expect(result.remainingSeconds).toBeGreaterThan(0);
    });

    it('recordFailedPickupAttempt increments count', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const attempts = { count: 0, lastAttempt: 0, lockedUntil: 0 };
      const result = recordFailedPickupAttempt(attempts);
      expect(result.count).toBe(1);
      expect(result.lockedUntil).toBe(0);
      vi.useRealTimers();
    });

    it('recordFailedPickupAttempt locks after max attempts', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const now = Date.now();
      let attempts = { count: 0, lastAttempt: 0, lockedUntil: 0 };
      
      for (let i = 0; i < MAX_PICKUP_ATTEMPTS - 1; i++) {
        attempts = recordFailedPickupAttempt(attempts);
      }
      expect(attempts.count).toBe(MAX_PICKUP_ATTEMPTS - 1);
      
      attempts = recordFailedPickupAttempt(attempts);
      expect(attempts.lockedUntil).toBe(now + LOCK_DURATION_SECONDS * 1000);
      expect(attempts.count).toBe(0);
      vi.useRealTimers();
    });

    it('resetPickupAttempts resets state', () => {
      const result = resetPickupAttempts();
      expect(result.count).toBe(0);
      expect(result.lockedUntil).toBe(0);
    });
  });

  describe('statistics', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const cells = [
      { id: 'c1', size: CELL_SIZE.LARGE, status: CELL_STATUS.OCCUPIED },
      { id: 'c2', size: CELL_SIZE.LARGE, status: CELL_STATUS.AVAILABLE },
      { id: 'c3', size: CELL_SIZE.MEDIUM, status: CELL_STATUS.OCCUPIED },
      { id: 'c4', size: CELL_SIZE.SMALL, status: CELL_STATUS.OVERDUE },
    ];

    const deliveryRecords = [
      { deliveredAt: todayStart.getTime() + 3600000 },
      { deliveredAt: todayStart.getTime() + 7200000 },
      { deliveredAt: todayStart.getTime() - 86400000 },
    ];

    const pickupRecords = [
      { pickedUpAt: todayStart.getTime() + 3600000 },
      { pickedUpAt: todayStart.getTime() - 86400000 },
    ];

    it('getStatistics calculates correctly', () => {
      const stats = getStatistics([], cells, pickupRecords, deliveryRecords, now);
      expect(stats.todayDeliveries).toBe(2);
      expect(stats.todayPickups).toBe(1);
      expect(stats.occupiedCells).toBe(3);
      expect(stats.availableCells).toBe(1);
      expect(stats.sizeUsage[CELL_SIZE.LARGE].used).toBe(1);
      expect(stats.sizeUsage[CELL_SIZE.LARGE].total).toBe(2);
    });

    it('getDailyTrend returns correct days', () => {
      const trend = getDailyTrend(pickupRecords, deliveryRecords, 3, now);
      expect(trend.length).toBe(3);
      expect(trend[2].deliveries).toBe(2);
      expect(trend[2].pickups).toBe(1);
    });

    it('handles empty inputs', () => {
      const stats = getStatistics(null, null, null, null, now);
      expect(stats.todayDeliveries).toBe(0);
      expect(stats.todayPickups).toBe(0);
      expect(stats.occupiedCells).toBe(0);
      expect(stats.availableCells).toBe(0);
    });
  });

  describe('package operations', () => {
    it('findPackageByPickupCode finds pending package', () => {
      const packages = [
        { id: 'p1', pickupCode: '123456', status: PACKAGE_STATUS.PENDING },
        { id: 'p2', pickupCode: '654321', status: PACKAGE_STATUS.PICKED_UP },
      ];
      const found = findPackageByPickupCode(packages, '123456');
      expect(found).toBeTruthy();
      expect(found.id).toBe('p1');
      
      const notFound = findPackageByPickupCode(packages, '654321');
      expect(notFound).toBe(null);
    });

    it('regeneratePickupCode generates unique code', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const packages = [
        { id: 'p1', pickupCode: '123456', status: PACKAGE_STATUS.PENDING },
        { id: 'p2', pickupCode: '654321', status: PACKAGE_STATUS.PENDING },
      ];
      const result = regeneratePickupCode(packages, 'p1');
      expect(result.success).toBe(true);
      expect(result.newCode).not.toBe('123456');
      expect(result.newCode).not.toBe('654321');
      vi.useRealTimers();
    });

    it('pickupPackage updates status', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const packages = [
        { id: 'p1', cellId: 'c1', status: PACKAGE_STATUS.PENDING },
      ];
      const result = pickupPackage(packages, 'p1', 'user');
      expect(result.success).toBe(true);
      expect(result.updatedPackages[0].status).toBe(PACKAGE_STATUS.PICKED_UP);
      expect(result.record).toBeTruthy();
      vi.useRealTimers();
    });

    it('pickupPackage with admin operator marks as admin picked', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const packages = [
        { id: 'p1', cellId: 'c1', status: PACKAGE_STATUS.PENDING },
      ];
      const result = pickupPackage(packages, 'p1', 'admin');
      expect(result.updatedPackages[0].status).toBe(PACKAGE_STATUS.ADMIN_PICKED);
      vi.useRealTimers();
    });

    it('markOverdueAsProcessed marks packages', () => {
      const packages = [
        { id: 'p1', processed: false },
        { id: 'p2', processed: false },
      ];
      const updated = markOverdueAsProcessed(packages, ['p1']);
      expect(updated[0].processed).toBe(true);
      expect(updated[1].processed).toBe(false);
    });
  });

  describe('form validation', () => {
    it('verifyPackageSize validates size', () => {
      expect(verifyPackageSize(CELL_SIZE.LARGE)).toBe(true);
      expect(verifyPackageSize(CELL_SIZE.MEDIUM)).toBe(true);
      expect(verifyPackageSize(CELL_SIZE.SMALL)).toBe(true);
      expect(verifyPackageSize('invalid')).toBe(false);
    });

    it('validateDeliveryForm validates required fields', () => {
      const validData = {
        phone: '13812345678',
        trackingNo: 'SF1234567890',
        size: CELL_SIZE.MEDIUM,
      };
      expect(validateDeliveryForm(validData).valid).toBe(true);

      const invalidPhone = { ...validData, phone: 'invalid' };
      expect(validateDeliveryForm(invalidPhone).valid).toBe(false);

      const noTracking = { ...validData, trackingNo: '' };
      expect(validateDeliveryForm(noTracking).valid).toBe(false);

      const noSize = { ...validData, size: '' };
      expect(validateDeliveryForm(noSize).valid).toBe(false);
    });
  });

  describe('grid arrangement', () => {
    it('arrangeCellsInGrid sorts by size and arranges in rows', () => {
      const cells = [
        { id: 'c1', code: 'C01', size: CELL_SIZE.SMALL },
        { id: 'c2', code: 'A01', size: CELL_SIZE.LARGE },
        { id: 'c3', code: 'B01', size: CELL_SIZE.MEDIUM },
        { id: 'c4', code: 'A02', size: CELL_SIZE.LARGE },
      ];
      const grid = arrangeCellsInGrid(cells, 2);
      expect(grid.length).toBe(2);
      expect(grid[0][0].size).toBe(CELL_SIZE.LARGE);
      expect(grid[0][0].code).toBe('A01');
    });
  });

  describe('createPackage', () => {
    it('creates package with correct fields', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const data = {
        phone: '13812345678',
        size: CELL_SIZE.MEDIUM,
        trackingNo: 'SF1234567890',
        remark: '测试包裹',
      };
      const pkg = createPackage(data, '123456', 'c1');
      expect(pkg.phone).toBe('13812345678');
      expect(pkg.pickupCode).toBe('123456');
      expect(pkg.cellId).toBe('c1');
      expect(pkg.status).toBe(PACKAGE_STATUS.PENDING);
      expect(pkg.deliveredAt).toBeTruthy();
      vi.useRealTimers();
    });
  });

  describe('createDeliveryRecord', () => {
    it('creates delivery record from package', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const pkg = { id: 'p1', cellId: 'c1', size: CELL_SIZE.MEDIUM, deliveredAt: Date.now() };
      const record = createDeliveryRecord(pkg);
      expect(record.packageId).toBe('p1');
      expect(record.cellId).toBe('c1');
      vi.useRealTimers();
    });
  });

  describe('createPickupRecord', () => {
    it('creates pickup record from package', () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-06-15'));
      const pkg = { id: 'p1', cellId: 'c1', size: CELL_SIZE.MEDIUM };
      const record = createPickupRecord(pkg, 'user');
      expect(record.packageId).toBe('p1');
      expect(record.pickedUpBy).toBe('user');
      vi.useRealTimers();
    });
  });
});

describe('locker-management/storage', () => {
  let storage;
  beforeEach(() => {
    storage = createMockStorage();
  });

  it('loadConfig returns defaults when empty', async () => {
    const { loadConfig } = await import('@/pages/locker-management/storage.js');
    const config = loadConfig(storage);
    expect(config.largeCount).toBe(8);
    expect(config.mediumCount).toBe(12);
    expect(config.smallCount).toBe(20);
  });

  it('saveConfig and loadConfig round-trip', async () => {
    const { saveConfig, loadConfig } = await import('@/pages/locker-management/storage.js');
    const testConfig = { largeCount: 4, mediumCount: 6, smallCount: 10 };
    saveConfig(testConfig, storage);
    expect(loadConfig(storage)).toEqual(testConfig);
  });

  it('loadCells creates default cells when empty', async () => {
    const { loadCells } = await import('@/pages/locker-management/storage.js');
    const cells = loadCells(storage);
    expect(Array.isArray(cells)).toBe(true);
    expect(cells.length).toBeGreaterThan(0);
  });

  it('saveCells and loadCells round-trip', async () => {
    const { saveCells, loadCells } = await import('@/pages/locker-management/storage.js');
    const testCells = [{ id: 'test', code: 'A01', size: CELL_SIZE.LARGE, status: CELL_STATUS.AVAILABLE, packageId: null }];
    saveCells(testCells, storage);
    expect(loadCells(storage)).toEqual(testCells);
  });

  it('loadPackages returns empty array when empty', async () => {
    const { loadPackages } = await import('@/pages/locker-management/storage.js');
    expect(loadPackages(storage)).toEqual([]);
  });

  it('handles corrupted JSON', async () => {
    const { loadConfig } = await import('@/pages/locker-management/storage.js');
    storage.setItem('locker_config', '{bad json');
    const result = loadConfig(storage);
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
    expect('largeCount' in result).toBe(true);
    expect('mediumCount' in result).toBe(true);
    expect('smallCount' in result).toBe(true);
  });

  it('does not throw when storage is null', async () => {
    const { saveConfig, loadConfig, clearLockerData } = await import('@/pages/locker-management/storage.js');
    expect(() => saveConfig([], null)).not.toThrow();
    expect(() => loadConfig(null)).not.toThrow();
    expect(() => clearLockerData(null)).not.toThrow();
  });
});
