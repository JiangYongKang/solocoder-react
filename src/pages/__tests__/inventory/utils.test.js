import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  formatDateTime,
  formatDate,
  getSkuStockInWarehouse,
  getSkuTotalStock,
  getStockStatus,
  getDaysUntilExpiry,
  getBatchStatus,
  isBatchExpired,
  sortBatchesByFifo,
  allocateStockByFifo,
  createInboundBatch,
  createOutboundDocument,
  createTransfer,
  validateTransfer,
  createStocktake,
  applyStocktake,
  calculateStocktakeDiff,
  createFlowLog,
  getSkuFlowLogs,
  getWarningSkus,
  getSkuBatches,
  filterSkus,
  paginateList,
  getStatistics,
  getStockByWarehouse,
  buildStockHistory,
  buildStockHistoryByWarehouse,
  buildStockHistoryBySku,
} from '@/pages/inventory/utils.js';
import {
  STOCK_STATUS,
  BATCH_STATUS,
  FLOW_LOG_TYPES,
  EXPIRING_DAYS,
} from '@/pages/inventory/constants.js';

function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    _store: store,
  };
}

describe('inventory/utils', () => {
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

  describe('formatDateTime', () => {
    it('formats timestamp to readable string', () => {
      const s = formatDateTime(1700000000000);
      expect(s).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('handles falsy values', () => {
      expect(formatDateTime(0)).toBe('');
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats date string to YYYY-MM-DD', () => {
      expect(formatDate('2024-01-15')).toBe('2024-01-15');
    });

    it('handles invalid/falsy input', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('stock calculation', () => {
    const batches = [
      { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 100, batchNo: 'B001', expiryDate: '2028-01-01' },
      { id: 'b2', skuId: 'sku1', warehouseId: 'wh1', quantity: 50, batchNo: 'B002', expiryDate: '2028-06-01' },
      { id: 'b3', skuId: 'sku1', warehouseId: 'wh2', quantity: 30, batchNo: 'B003', expiryDate: '2028-03-01' },
      { id: 'b4', skuId: 'sku2', warehouseId: 'wh1', quantity: 200, batchNo: 'B004', expiryDate: '2029-01-01' },
    ];

    it('getSkuStockInWarehouse calculates correct stock', () => {
      expect(getSkuStockInWarehouse(batches, 'sku1', 'wh1')).toBe(150);
      expect(getSkuStockInWarehouse(batches, 'sku1', 'wh2')).toBe(30);
      expect(getSkuStockInWarehouse(batches, 'sku2', 'wh1')).toBe(200);
      expect(getSkuStockInWarehouse(batches, 'sku2', 'wh2')).toBe(0);
    });

    it('getSkuStockInWarehouse handles invalid inputs', () => {
      expect(getSkuStockInWarehouse(null, 'sku1', 'wh1')).toBe(0);
      expect(getSkuStockInWarehouse(batches, '', 'wh1')).toBe(0);
      expect(getSkuStockInWarehouse(batches, 'sku1', '')).toBe(0);
    });

    it('getSkuTotalStock calculates total across warehouses', () => {
      expect(getSkuTotalStock(batches, 'sku1')).toBe(180);
      expect(getSkuTotalStock(batches, 'sku2')).toBe(200);
      expect(getSkuTotalStock(batches, 'sku3')).toBe(0);
    });

    it('getSkuTotalStock handles invalid inputs', () => {
      expect(getSkuTotalStock(null, 'sku1')).toBe(0);
      expect(getSkuTotalStock(batches, '')).toBe(0);
    });
  });

  describe('stock status / safety stock warning', () => {
    it('returns DANGER when stock below safety stock', () => {
      expect(getStockStatus(10, 50)).toBe(STOCK_STATUS.DANGER);
      expect(getStockStatus(0, 100)).toBe(STOCK_STATUS.DANGER);
    });

    it('returns WARNING when stock between safety and 1.5x safety', () => {
      expect(getStockStatus(60, 50)).toBe(STOCK_STATUS.WARNING);
      expect(getStockStatus(74, 50)).toBe(STOCK_STATUS.WARNING);
    });

    it('returns SUFFICIENT when stock >= 1.5x safety', () => {
      expect(getStockStatus(75, 50)).toBe(STOCK_STATUS.SUFFICIENT);
      expect(getStockStatus(100, 50)).toBe(STOCK_STATUS.SUFFICIENT);
    });

    it('returns SUFFICIENT when safety stock is 0 or negative', () => {
      expect(getStockStatus(0, 0)).toBe(STOCK_STATUS.SUFFICIENT);
      expect(getStockStatus(10, -5)).toBe(STOCK_STATUS.SUFFICIENT);
    });

    it('handles string and non-number inputs gracefully', () => {
      expect(getStockStatus('abc', 50)).toBe(STOCK_STATUS.DANGER);
      expect(getStockStatus(null, 50)).toBe(STOCK_STATUS.DANGER);
    });
  });

  describe('batch expiry status', () => {
    const now = new Date('2024-06-15').getTime();

    it('getDaysUntilExpiry calculates correctly', () => {
      expect(getDaysUntilExpiry('2024-07-15', now)).toBe(30);
      expect(getDaysUntilExpiry('2024-06-16', now)).toBe(1);
      expect(getDaysUntilExpiry('2024-06-14', now)).toBe(-1);
    });

    it('getDaysUntilExpiry handles invalid inputs', () => {
      expect(getDaysUntilExpiry('', now)).toBe(Infinity);
      expect(getDaysUntilExpiry(null, now)).toBe(Infinity);
    });

    it('getBatchStatus returns NORMAL for far-future expiry', () => {
      const batch = { expiryDate: '2028-01-01' };
      expect(getBatchStatus(batch, now)).toBe(BATCH_STATUS.NORMAL);
    });

    it('getBatchStatus returns EXPIRING when <= EXPIRING_DAYS days left', () => {
      const expiringDate = new Date(now + (EXPIRING_DAYS - 1) * 86400000);
      const batch = { expiryDate: expiringDate.toISOString().split('T')[0] };
      expect(getBatchStatus(batch, now)).toBe(BATCH_STATUS.EXPIRING);
    });

    it('getBatchStatus returns EXPIRED when past expiry', () => {
      const batch = { expiryDate: '2024-01-01' };
      expect(getBatchStatus(batch, now)).toBe(BATCH_STATUS.EXPIRED);
    });

    it('getBatchStatus handles batch without expiryDate', () => {
      expect(getBatchStatus({}, now)).toBe(BATCH_STATUS.NORMAL);
      expect(getBatchStatus(null, now)).toBe(BATCH_STATUS.NORMAL);
    });

    it('isBatchExpired returns true for expired batches', () => {
      expect(isBatchExpired({ expiryDate: '2024-01-01' }, now)).toBe(true);
      expect(isBatchExpired({ expiryDate: '2028-01-01' }, now)).toBe(false);
    });
  });

  describe('FIFO batch allocation', () => {
    const now = new Date('2024-06-01').getTime();
    const batches = [
      { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 50, batchNo: 'B001', expiryDate: '2025-01-01', createdAt: 1000 },
      { id: 'b2', skuId: 'sku1', warehouseId: 'wh1', quantity: 30, batchNo: 'B002', expiryDate: '2025-06-01', createdAt: 2000 },
      { id: 'b3', skuId: 'sku1', warehouseId: 'wh1', quantity: 20, batchNo: 'B003', expiryDate: '2025-03-01', createdAt: 1500 },
      { id: 'b4', skuId: 'sku1', warehouseId: 'wh2', quantity: 100, batchNo: 'B004', expiryDate: '2024-01-01', createdAt: 500 },
      { id: 'b5', skuId: 'sku2', warehouseId: 'wh1', quantity: 200, batchNo: 'B005', expiryDate: '2028-01-01', createdAt: 3000 },
    ];

    it('sortBatchesByFifo sorts by expiry date ascending', () => {
      const sorted = sortBatchesByFifo(batches, 'sku1', 'wh1', now);
      expect(sorted.length).toBe(3);
      expect(sorted[0].batchNo).toBe('B001');
      expect(sorted[1].batchNo).toBe('B003');
      expect(sorted[2].batchNo).toBe('B002');
    });

    it('sortBatchesByFifo filters out expired batches', () => {
      const testNow = new Date('2025-02-01').getTime();
      const sorted = sortBatchesByFifo(batches, 'sku1', 'wh1', testNow);
      expect(sorted.every((b) => b.warehouseId === 'wh1')).toBe(true);
      expect(sorted.length).toBe(2);
      expect(sorted.find((b) => b.batchNo === 'B001')).toBeUndefined();
    });

    it('allocateStockByFifo allocates from earliest expiry first', () => {
      const result = allocateStockByFifo(batches, 'sku1', 'wh1', 60, now);
      expect(result.success).toBe(true);
      expect(result.allocations.length).toBeGreaterThan(0);
      expect(result.allocations[0].batchNo).toBe('B001');
      expect(result.allocations[0].quantity).toBe(50);
      const totalAllocated = result.allocations.reduce((sum, a) => sum + a.quantity, 0);
      expect(totalAllocated).toBe(60);
    });

    it('allocateStockByFifo returns error when quantity > available stock', () => {
      const result = allocateStockByFifo(batches, 'sku1', 'wh1', 500, now);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.allocations).toEqual([]);
    });

    it('allocateStockByFifo rejects zero or negative quantity', () => {
      expect(allocateStockByFifo(batches, 'sku1', 'wh1', 0, now).success).toBe(false);
      expect(allocateStockByFifo(batches, 'sku1', 'wh1', -10, now).success).toBe(false);
    });

    it('allocateStockByFifo updates batch quantities correctly', () => {
      const result = allocateStockByFifo(batches, 'sku1', 'wh1', 60, now);
      expect(result.success).toBe(true);
      const b1 = result.updatedBatches.find((b) => b.id === 'b1');
      const b3 = result.updatedBatches.find((b) => b.id === 'b3');
      expect(b1.quantity).toBe(0);
      expect(b3.quantity).toBe(10);
    });

    it('allocateStockByFifo does not mutate original batches array', () => {
      const originalQty = batches[0].quantity;
      allocateStockByFifo(batches, 'sku1', 'wh1', 10, now);
      expect(batches[0].quantity).toBe(originalQty);
    });
  });

  describe('inbound and outbound operations', () => {
    const baseBatches = [
      { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 100, batchNo: 'B001', expiryDate: '2028-01-01' },
    ];

    it('createInboundBatch creates new batch when batchNo is new', () => {
      const result = createInboundBatch(baseBatches, {
        skuId: 'sku1',
        warehouseId: 'wh1',
        quantity: 50,
        batchNo: 'B002',
        productionDate: '2024-01-01',
        expiryDate: '2029-01-01',
        operator: '张三',
        remark: '新批次入库',
      });
      expect(result.success).toBe(true);
      expect(result.updatedBatches.length).toBe(2);
      expect(result.document).toBeTruthy();
      expect(result.document.type).toBe('inbound');
      expect(result.document.quantity).toBe(50);
    });

    it('createInboundBatch adds to existing batch when batchNo matches', () => {
      const result = createInboundBatch(baseBatches, {
        skuId: 'sku1',
        warehouseId: 'wh1',
        quantity: 30,
        batchNo: 'B001',
      });
      expect(result.success).toBe(true);
      expect(result.updatedBatches.length).toBe(1);
      expect(result.batch.quantity).toBe(130);
    });

    it('createInboundBatch rejects invalid input', () => {
      expect(createInboundBatch(baseBatches, { skuId: '', warehouseId: 'wh1', quantity: 10, batchNo: 'X' }).success).toBe(false);
      expect(createInboundBatch(baseBatches, { skuId: 'sku1', warehouseId: '', quantity: 10, batchNo: 'X' }).success).toBe(false);
      expect(createInboundBatch(baseBatches, { skuId: 'sku1', warehouseId: 'wh1', quantity: 0, batchNo: 'X' }).success).toBe(false);
      expect(createInboundBatch(baseBatches, { skuId: 'sku1', warehouseId: 'wh1', quantity: -5, batchNo: 'X' }).success).toBe(false);
    });

    it('createOutboundDocument creates outbound with FIFO allocation', () => {
      const batches = [
        { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 100, batchNo: 'B001', expiryDate: '2028-01-01' },
      ];
      const result = createOutboundDocument(batches, {
        skuId: 'sku1',
        warehouseId: 'wh1',
        quantity: 30,
        operator: '李四',
        remark: '销售出库',
      });
      expect(result.success).toBe(true);
      expect(result.document).toBeTruthy();
      expect(result.document.type).toBe('outbound');
      expect(result.document.quantity).toBe(30);
      expect(result.allocations.length).toBeGreaterThan(0);
      const remainingBatch = result.updatedBatches.find((b) => b.id === 'b1');
      expect(remainingBatch.quantity).toBe(70);
    });

    it('createOutboundDocument rejects over-quantity', () => {
      const batches = [
        { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 10, batchNo: 'B001', expiryDate: '2028-01-01' },
      ];
      const result = createOutboundDocument(batches, {
        skuId: 'sku1',
        warehouseId: 'wh1',
        quantity: 50,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('超过');
    });
  });

  describe('warehouse transfer', () => {
    const batches = [
      { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 100, batchNo: 'B001', expiryDate: '2028-01-01', createdAt: 1000 },
      { id: 'b2', skuId: 'sku1', warehouseId: 'wh2', quantity: 50, batchNo: 'B002', expiryDate: '2028-06-01', createdAt: 2000 },
    ];

    it('createTransfer moves stock between warehouses', () => {
      const result = createTransfer(batches, {
        sourceWarehouseId: 'wh1',
        targetWarehouseId: 'wh3',
        skuId: 'sku1',
        quantity: 40,
        operator: '王五',
        remark: '调货',
      });
      expect(result.success).toBe(true);
      expect(result.transfer).toBeTruthy();
      const sourceAfter = getSkuStockInWarehouse(result.updatedBatches, 'sku1', 'wh1');
      const targetAfter = getSkuStockInWarehouse(result.updatedBatches, 'sku1', 'wh3');
      expect(sourceAfter).toBe(60);
      expect(targetAfter).toBe(40);
    });

    it('createTransfer rejects same source and target', () => {
      const result = createTransfer(batches, {
        sourceWarehouseId: 'wh1',
        targetWarehouseId: 'wh1',
        skuId: 'sku1',
        quantity: 10,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('相同');
    });

    it('createTransfer rejects insufficient source stock', () => {
      const result = createTransfer(batches, {
        sourceWarehouseId: 'wh1',
        targetWarehouseId: 'wh2',
        skuId: 'sku1',
        quantity: 500,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('不足');
    });

    it('validateTransfer validates transfer form', () => {
      const validResult = validateTransfer(
        { sourceWarehouseId: 'wh1', targetWarehouseId: 'wh2', skuId: 'sku1', quantity: 50 },
        batches
      );
      expect(validResult.valid).toBe(true);

      const sameWarehouse = validateTransfer(
        { sourceWarehouseId: 'wh1', targetWarehouseId: 'wh1', skuId: 'sku1', quantity: 10 },
        batches
      );
      expect(sameWarehouse.valid).toBe(false);
      expect(sameWarehouse.errors.targetWarehouseId).toBeTruthy();

      const noSku = validateTransfer(
        { sourceWarehouseId: 'wh1', targetWarehouseId: 'wh2', skuId: '', quantity: 10 },
        batches
      );
      expect(noSku.valid).toBe(false);
      expect(noSku.errors.skuId).toBeTruthy();

      const negativeQty = validateTransfer(
        { sourceWarehouseId: 'wh1', targetWarehouseId: 'wh2', skuId: 'sku1', quantity: -5 },
        batches
      );
      expect(negativeQty.valid).toBe(false);
      expect(negativeQty.errors.quantity).toBeTruthy();

      const overStock = validateTransfer(
        { sourceWarehouseId: 'wh1', targetWarehouseId: 'wh2', skuId: 'sku1', quantity: 9999 },
        batches
      );
      expect(overStock.valid).toBe(false);
      expect(overStock.errors.quantity).toBeTruthy();
    });
  });

  describe('stocktake / inventory check', () => {
    it('calculateStocktakeDiff computes actual - system', () => {
      expect(calculateStocktakeDiff(100, 105)).toBe(5);
      expect(calculateStocktakeDiff(100, 95)).toBe(-5);
      expect(calculateStocktakeDiff(100, 100)).toBe(0);
    });

    it('calculateStocktakeDiff handles invalid inputs', () => {
      expect(calculateStocktakeDiff(null, 100)).toBe(100);
      expect(calculateStocktakeDiff(100, 'abc')).toBe(-100);
    });

    it('createStocktake generates stocktake report with differences', () => {
      const items = [
        { skuId: 'sku1', skuName: '商品A', systemQty: 100, actualQty: 105, remark: '盘盈' },
        { skuId: 'sku2', skuName: '商品B', systemQty: 50, actualQty: 50 },
        { skuId: 'sku3', skuName: '商品C', systemQty: 30, actualQty: 25, remark: '盘亏' },
      ];
      const { stocktake, differences } = createStocktake('wh1', items, '盘点员');
      expect(stocktake.id).toBeTruthy();
      expect(stocktake.totalItems).toBe(3);
      expect(stocktake.diffCount).toBe(2);
      expect(differences.length).toBe(2);
      expect(differences[0].difference).toBe(5);
      expect(differences[1].difference).toBe(-5);
    });

    it('applyStocktake adjusts batches to match actual counts', () => {
      const batches = [
        { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 100, batchNo: 'B001', expiryDate: '2028-01-01' },
      ];
      const differences = [
        { skuId: 'sku1', actualQty: 120, remark: '盘盈', skuName: '商品A', systemQty: 100, difference: 20 },
      ];
      const result = applyStocktake(batches, 'wh1', differences);
      expect(result.success).toBe(true);
      const newStock = getSkuStockInWarehouse(result.updatedBatches, 'sku1', 'wh1');
      expect(newStock).toBe(120);
      expect(result.flowLogs.length).toBe(1);
      expect(result.flowLogs[0].quantityChange).toBe(20);
    });

    it('applyStocktake handles negative differences (stock decrease)', () => {
      const batches = [
        { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 100, batchNo: 'B001', expiryDate: '2028-01-01', createdAt: 1000 },
      ];
      const differences = [
        { skuId: 'sku1', actualQty: 80, remark: '盘亏', skuName: '商品A', systemQty: 100, difference: -20 },
      ];
      const result = applyStocktake(batches, 'wh1', differences);
      expect(result.success).toBe(true);
      const newStock = getSkuStockInWarehouse(result.updatedBatches, 'sku1', 'wh1');
      expect(newStock).toBe(80);
    });

    it('applyStocktake returns unchanged when no differences', () => {
      const batches = [{ id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 100, batchNo: 'B1' }];
      const result = applyStocktake(batches, 'wh1', []);
      expect(result.updatedBatches).toBe(batches);
      expect(result.flowLogs).toEqual([]);
    });
  });

  describe('flow logs', () => {
    const flowLogs = [
      { id: 'fl1', skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 100, balanceAfter: 100, createdAt: 10000 },
      { id: 'fl2', skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.OUTBOUND, quantityChange: -30, balanceAfter: 70, createdAt: 20000 },
      { id: 'fl3', skuId: 'sku2', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 50, balanceAfter: 50, createdAt: 15000 },
      { id: 'fl4', skuId: 'sku1', warehouseId: 'wh2', type: FLOW_LOG_TYPES.TRANSFER_IN, quantityChange: 20, balanceAfter: 20, createdAt: 25000 },
    ];

    it('createFlowLog creates flow log entry', () => {
      const log = createFlowLog({
        skuId: 'sku1',
        warehouseId: 'wh1',
        type: FLOW_LOG_TYPES.INBOUND,
        quantityChange: 50,
        balanceAfter: 150,
        refId: 'doc123',
        refType: 'document',
        batchNo: 'B001',
        remark: '测试入库',
        operator: '测试员',
        createdAt: 12345,
      });
      expect(log.id).toBeTruthy();
      expect(log.skuId).toBe('sku1');
      expect(log.type).toBe(FLOW_LOG_TYPES.INBOUND);
      expect(log.quantityChange).toBe(50);
      expect(log.balanceAfter).toBe(150);
      expect(log.createdAt).toBe(12345);
    });

    it('getSkuFlowLogs returns logs for specific SKU sorted by time desc', () => {
      const sku1Logs = getSkuFlowLogs(flowLogs, 'sku1');
      expect(sku1Logs.length).toBe(3);
      expect(sku1Logs[0].createdAt).toBeGreaterThan(sku1Logs[1].createdAt);
    });

    it('getSkuFlowLogs filters by time range', () => {
      const filtered = getSkuFlowLogs(flowLogs, 'sku1', {
        startTime: 12000,
        endTime: 22000,
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('fl2');
    });

    it('getSkuFlowLogs handles empty/invalid inputs', () => {
      expect(getSkuFlowLogs(null, 'sku1')).toEqual([]);
      expect(getSkuFlowLogs(flowLogs, '')).toEqual([]);
    });
  });

  describe('warning SKU detection', () => {
    const skus = [
      { id: 'sku1', name: '商品1', safetyStock: 50 },
      { id: 'sku2', name: '商品2', safetyStock: 20 },
      { id: 'sku3', name: '商品3', safetyStock: 100 },
    ];
    const batches = [
      { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 30 },
      { id: 'b2', skuId: 'sku2', warehouseId: 'wh1', quantity: 25 },
      { id: 'b3', skuId: 'sku3', warehouseId: 'wh1', quantity: 200 },
    ];

    it('getWarningSkus returns SKUs below safety stock', () => {
      const warnings = getWarningSkus(skus, batches);
      expect(warnings.length).toBe(1);
      expect(warnings[0].id).toBe('sku1');
    });

    it('getWarningSkus handles empty inputs', () => {
      expect(getWarningSkus([], batches)).toEqual([]);
      expect(getWarningSkus(skus, [])).toHaveLength(3);
      expect(getWarningSkus(null, null)).toEqual([]);
    });
  });

  describe('batch listing and filtering', () => {
    const batches = [
      { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 50, batchNo: 'B001', expiryDate: '2025-06-01' },
      { id: 'b2', skuId: 'sku1', warehouseId: 'wh1', quantity: 30, batchNo: 'B002', expiryDate: '2025-01-01' },
      { id: 'b3', skuId: 'sku1', warehouseId: 'wh2', quantity: 20, batchNo: 'B003', expiryDate: '2025-03-01' },
    ];

    it('getSkuBatches returns batches sorted by expiry date', () => {
      const skuBatches = getSkuBatches(batches, 'sku1');
      expect(skuBatches.length).toBe(3);
      expect(skuBatches[0].batchNo).toBe('B002');
      expect(skuBatches[1].batchNo).toBe('B003');
      expect(skuBatches[2].batchNo).toBe('B001');
    });

    it('getSkuBatches filters by warehouse', () => {
      const wh1Batches = getSkuBatches(batches, 'sku1', 'wh1');
      expect(wh1Batches.length).toBe(2);
      expect(wh1Batches.every((b) => b.warehouseId === 'wh1')).toBe(true);
    });
  });

  describe('SKU filtering', () => {
    const skus = [
      { id: 's1', name: '无线蓝牙耳机', code: 'SKU-BT-001', category: '电子产品' },
      { id: 's2', name: '机械键盘', code: 'SKU-KB-002', category: '电子产品' },
      { id: 's3', name: 'USB数据线', code: 'SKU-CB-003', category: '配件' },
    ];
    const batches = [
      { id: 'b1', skuId: 's1', warehouseId: 'wh1', quantity: 10 },
      { id: 'b2', skuId: 's2', warehouseId: 'wh1', quantity: 100 },
      { id: 'b3', skuId: 's3', warehouseId: 'wh1', quantity: 200 },
    ];

    it('filterSkus filters by keyword', () => {
      const result = filterSkus(skus, '耳机', false, batches);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('s1');
    });

    it('filterSkus filters by code', () => {
      const result = filterSkus(skus, 'KB-002', false, batches);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('s2');
    });

    it('filterSkus shows only warning SKUs when flag is set', () => {
      const skusWithSafety = skus.map((s) => ({ ...s, safetyStock: 50 }));
      const result = filterSkus(skusWithSafety, '', true, batches);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('s1');
    });
  });

  describe('pagination', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: `item${i}` }));

    it('paginateList returns correct page', () => {
      const p1 = paginateList(items, 1, 10);
      expect(p1.items.length).toBe(10);
      expect(p1.items[0].id).toBe('item0');
      expect(p1.total).toBe(25);
      expect(p1.totalPages).toBe(3);
      expect(p1.currentPage).toBe(1);

      const p2 = paginateList(items, 2, 10);
      expect(p2.items[0].id).toBe('item10');

      const p3 = paginateList(items, 3, 10);
      expect(p3.items.length).toBe(5);
      expect(p3.items[0].id).toBe('item20');
    });

    it('paginateList clamps page number', () => {
      const p = paginateList(items, 99, 10);
      expect(p.currentPage).toBe(3);
    });

    it('paginateList handles empty/invalid inputs', () => {
      const r = paginateList(null, 1, 10);
      expect(r.items).toEqual([]);
      expect(r.total).toBe(0);
    });
  });

  describe('stock history (retrograde algorithm)', () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayMs = now.getTime();
    const DAY = 86400000;

    const batches = [
      { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 100 },
      { id: 'b2', skuId: 'sku1', warehouseId: 'wh2', quantity: 30 },
      { id: 'b3', skuId: 'sku2', warehouseId: 'wh1', quantity: 50 },
    ];

    describe('buildStockHistory', () => {
      it('returns current stock for each day when flowLogs is empty', () => {
        const history = buildStockHistory([], batches, 5);
        expect(history.length).toBe(5);
        history.forEach((day) => {
          expect(day.totalStock).toBe(180);
          expect(day.inbound).toBe(0);
          expect(day.outbound).toBe(0);
        });
      });

      it('returns current stock for each day when flowLogs is null', () => {
        const history = buildStockHistory(null, batches, 3);
        expect(history.length).toBe(3);
        history.forEach((day) => {
          expect(day.totalStock).toBe(180);
        });
      });

      it('returns 0 stock when batches is empty', () => {
        const history = buildStockHistory([], [], 3);
        expect(history.length).toBe(3);
        history.forEach((day) => {
          expect(day.totalStock).toBe(0);
        });
      });

      it('computes single-day inbound correctly', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 20, createdAt: todayMs + 3600000 },
        ];
        const history = buildStockHistory(flowLogs, batches, 3);
        expect(history.length).toBe(3);
        const today = history[2];
        expect(today.inbound).toBe(20);
        expect(today.outbound).toBe(0);
        expect(today.totalStock).toBe(180);
        const yesterday = history[1];
        expect(yesterday.totalStock).toBe(160);
      });

      it('computes single-day outbound correctly', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.OUTBOUND, quantityChange: -30, createdAt: todayMs + 3600000 },
        ];
        const history = buildStockHistory(flowLogs, batches, 3);
        const today = history[2];
        expect(today.outbound).toBe(30);
        expect(today.totalStock).toBe(180);
        const yesterday = history[1];
        expect(yesterday.totalStock).toBe(210);
      });

      it('retrogrades multi-day flow correctly', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 50, createdAt: todayMs - DAY * 3 + 3600000 },
          { skuId: 'sku2', warehouseId: 'wh1', type: FLOW_LOG_TYPES.OUTBOUND, quantityChange: -20, createdAt: todayMs - DAY + 3600000 },
          { skuId: 'sku1', warehouseId: 'wh2', type: FLOW_LOG_TYPES.TRANSFER_IN, quantityChange: 10, createdAt: todayMs - DAY * 2 + 3600000 },
        ];
        const history = buildStockHistory(flowLogs, batches, 5);
        expect(history.length).toBe(5);
        const day0 = history[0];
        expect(day0.totalStock).toBe(140);
        const day4 = history[4];
        expect(day4.totalStock).toBe(180);
      });

      it('includes stocktake adjustments in net change', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.STOCKTAKE, quantityChange: 5, createdAt: todayMs + 3600000 },
          { skuId: 'sku2', warehouseId: 'wh1', type: FLOW_LOG_TYPES.STOCKTAKE, quantityChange: -10, createdAt: todayMs + 7200000 },
        ];
        const history = buildStockHistory(flowLogs, batches, 3);
        const today = history[2];
        expect(today.totalStock).toBe(180);
        const yesterday = history[1];
        expect(yesterday.totalStock).toBe(185);
      });

      it('clamps negative stock to 0 during retrograde', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 200, createdAt: todayMs - DAY + 3600000 },
        ];
        const smallBatches = [
          { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 10 },
        ];
        const history = buildStockHistory(flowLogs, smallBatches, 3);
        expect(history[2].totalStock).toBe(10);
        expect(history[1].totalStock).toBe(10);
        expect(history[0].totalStock).toBe(0);
      });
    });

    describe('buildStockHistoryByWarehouse', () => {
      it('returns current warehouse stock when flowLogs is empty', () => {
        const history = buildStockHistoryByWarehouse([], 'wh1', batches, 3);
        expect(history.length).toBe(3);
        history.forEach((day) => {
          expect(day.totalStock).toBe(150);
        });
      });

      it('filters flow logs by warehouse', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 30, createdAt: todayMs + 3600000 },
          { skuId: 'sku1', warehouseId: 'wh2', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 50, createdAt: todayMs + 3600000 },
        ];
        const history = buildStockHistoryByWarehouse(flowLogs, 'wh1', batches, 3);
        const today = history[2];
        expect(today.inbound).toBe(30);
        expect(today.totalStock).toBe(150);
        const yesterday = history[1];
        expect(yesterday.totalStock).toBe(120);
      });

      it('retrogrades multi-day for warehouse correctly', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.OUTBOUND, quantityChange: -40, createdAt: todayMs - DAY + 3600000 },
          { skuId: 'sku2', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 20, createdAt: todayMs - DAY * 2 + 3600000 },
        ];
        const history = buildStockHistoryByWarehouse(flowLogs, 'wh1', batches, 4);
        expect(history.length).toBe(4);
        expect(history[3].totalStock).toBe(150);
        expect(history[2].totalStock).toBe(150);
        expect(history[1].totalStock).toBe(190);
        expect(history[0].totalStock).toBe(170);
      });

      it('ignores flow logs from other warehouses', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh2', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 999, createdAt: todayMs + 3600000 },
        ];
        const history = buildStockHistoryByWarehouse(flowLogs, 'wh1', batches, 3);
        history.forEach((day) => {
          expect(day.inbound).toBe(0);
        });
      });
    });

    describe('buildStockHistoryBySku', () => {
      it('returns current SKU stock when flowLogs is empty', () => {
        const history = buildStockHistoryBySku([], 'sku1', batches, 3);
        expect(history.length).toBe(3);
        history.forEach((day) => {
          expect(day.totalStock).toBe(130);
        });
      });

      it('filters flow logs by skuId', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 30, createdAt: todayMs + 3600000 },
          { skuId: 'sku2', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 50, createdAt: todayMs + 3600000 },
        ];
        const history = buildStockHistoryBySku(flowLogs, 'sku1', batches, 3);
        const today = history[2];
        expect(today.inbound).toBe(30);
        expect(today.totalStock).toBe(130);
        const yesterday = history[1];
        expect(yesterday.totalStock).toBe(100);
      });

      it('retrogrades multi-day for SKU correctly', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.OUTBOUND, quantityChange: -20, createdAt: todayMs - DAY + 3600000 },
          { skuId: 'sku1', warehouseId: 'wh2', type: FLOW_LOG_TYPES.TRANSFER_IN, quantityChange: 15, createdAt: todayMs - DAY * 2 + 3600000 },
        ];
        const history = buildStockHistoryBySku(flowLogs, 'sku1', batches, 4);
        expect(history[3].totalStock).toBe(130);
        expect(history[2].totalStock).toBe(130);
        expect(history[1].totalStock).toBe(150);
        expect(history[0].totalStock).toBe(135);
      });

      it('ignores flow logs from other SKUs', () => {
        const flowLogs = [
          { skuId: 'sku2', warehouseId: 'wh1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 999, createdAt: todayMs + 3600000 },
        ];
        const history = buildStockHistoryBySku(flowLogs, 'sku1', batches, 3);
        history.forEach((day) => {
          expect(day.inbound).toBe(0);
        });
      });

      it('handles transfer operations correctly', () => {
        const flowLogs = [
          { skuId: 'sku1', warehouseId: 'wh1', type: FLOW_LOG_TYPES.TRANSFER_OUT, quantityChange: -25, createdAt: todayMs + 3600000 },
          { skuId: 'sku1', warehouseId: 'wh2', type: FLOW_LOG_TYPES.TRANSFER_IN, quantityChange: 25, createdAt: todayMs + 7200000 },
        ];
        const history = buildStockHistoryBySku(flowLogs, 'sku1', batches, 3);
        const today = history[2];
        expect(today.outbound).toBe(25);
        expect(today.inbound).toBe(25);
        expect(today.totalStock).toBe(130);
      });
    });
  });

  describe('statistics and warehouse stock', () => {
    const batches = [
      { id: 'b1', skuId: 'sku1', warehouseId: 'wh1', quantity: 100 },
      { id: 'b2', skuId: 'sku2', warehouseId: 'wh1', quantity: 50 },
      { id: 'b3', skuId: 'sku1', warehouseId: 'wh2', quantity: 30 },
    ];
    const warehouses = [
      { id: 'wh1', name: '北京仓库' },
      { id: 'wh2', name: '上海仓库' },
    ];
    const skus = [
      { id: 'sku1', name: '商品1' },
      { id: 'sku2', name: '商品2' },
    ];

    it('getStockByWarehouse groups stock by warehouse', () => {
      const result = getStockByWarehouse(batches, warehouses);
      expect(result.length).toBe(2);
      expect(result.find((r) => r.warehouseId === 'wh1').totalStock).toBe(150);
      expect(result.find((r) => r.warehouseId === 'wh2').totalStock).toBe(30);
    });

    it('getStatistics computes summary stats', () => {
      const now = new Date('2024-06-15').getTime();
      const flowLogs = [
        { skuId: 'sku1', type: FLOW_LOG_TYPES.INBOUND, quantityChange: 100, createdAt: now - 86400000 * 5 },
        { skuId: 'sku1', type: FLOW_LOG_TYPES.OUTBOUND, quantityChange: -30, createdAt: now - 86400000 * 3 },
      ];
      const stats = getStatistics(batches, flowLogs, skus, now);
      expect(stats.totalSkus).toBe(2);
      expect(stats.totalStock).toBe(180);
    });
  });
});

describe('inventory/storage', () => {
  let storage;
  beforeEach(() => {
    storage = createMockStorage();
  });

  it('loadWarehouses returns defaults when empty', async () => {
    const { loadWarehouses } = await import('@/pages/inventory/storage.js');
    const warehouses = loadWarehouses(storage);
    expect(Array.isArray(warehouses)).toBe(true);
    expect(warehouses.length).toBeGreaterThan(0);
  });

  it('saveWarehouses and loadWarehouses round-trip', async () => {
    const { saveWarehouses, loadWarehouses } = await import('@/pages/inventory/storage.js');
    const testData = [{ id: 'test', name: '测试仓库' }];
    saveWarehouses(testData, storage);
    const loaded = loadWarehouses(storage);
    expect(loaded).toEqual(testData);
  });

  it('loadSkus returns defaults when empty', async () => {
    const { loadSkus } = await import('@/pages/inventory/storage.js');
    const skus = loadSkus(storage);
    expect(Array.isArray(skus)).toBe(true);
    expect(skus.length).toBeGreaterThan(0);
  });

  it('saveSkus and loadSkus round-trip', async () => {
    const { saveSkus, loadSkus } = await import('@/pages/inventory/storage.js');
    const testData = [{ id: 'test', name: '测试SKU' }];
    saveSkus(testData, storage);
    expect(loadSkus(storage)).toEqual(testData);
  });

  it('loadBatches returns defaults when empty', async () => {
    const { loadBatches } = await import('@/pages/inventory/storage.js');
    const batches = loadBatches(storage);
    expect(Array.isArray(batches)).toBe(true);
    expect(batches.length).toBeGreaterThan(0);
  });

  it('saveBatches and loadBatches round-trip', async () => {
    const { saveBatches, loadBatches } = await import('@/pages/inventory/storage.js');
    const testData = [{ id: 'test', skuId: 's1', quantity: 10 }];
    saveBatches(testData, storage);
    expect(loadBatches(storage)).toEqual(testData);
  });

  it('loadDocuments returns empty array when empty', async () => {
    const { loadDocuments } = await import('@/pages/inventory/storage.js');
    expect(loadDocuments(storage)).toEqual([]);
  });

  it('saveDocuments and loadDocuments round-trip', async () => {
    const { saveDocuments, loadDocuments } = await import('@/pages/inventory/storage.js');
    const testData = [{ id: 'd1', type: 'inbound' }];
    saveDocuments(testData, storage);
    expect(loadDocuments(storage)).toEqual(testData);
  });

  it('loadFlowLogs returns empty array when empty', async () => {
    const { loadFlowLogs } = await import('@/pages/inventory/storage.js');
    expect(loadFlowLogs(storage)).toEqual([]);
  });

  it('handles corrupted JSON gracefully', async () => {
    const { loadWarehouses } = await import('@/pages/inventory/storage.js');
    storage.setItem('inventory_warehouses', '{bad json');
    const result = loadWarehouses(storage);
    expect(Array.isArray(result)).toBe(true);
  });

  it('does not throw when storage is null', async () => {
    const { saveWarehouses, loadWarehouses, saveSkus, loadSkus, clearInventoryData } = await import('@/pages/inventory/storage.js');
    expect(() => saveWarehouses([], null)).not.toThrow();
    expect(() => loadWarehouses(null)).not.toThrow();
    expect(() => saveSkus([], null)).not.toThrow();
    expect(() => loadSkus(null)).not.toThrow();
    expect(() => clearInventoryData(null)).not.toThrow();
  });

  it('clearInventoryData removes all inventory keys', async () => {
    const { saveWarehouses, saveSkus, clearInventoryData, loadWarehouses, loadSkus } = await import('@/pages/inventory/storage.js');
    saveWarehouses([{ id: 'x' }], storage);
    saveSkus([{ id: 'y' }], storage);
    clearInventoryData(storage);
    expect(loadWarehouses(storage).length).toBeGreaterThan(0);
    expect(loadSkus(storage).length).toBeGreaterThan(0);
  });
});
