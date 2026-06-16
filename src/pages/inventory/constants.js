export const STORAGE_KEYS = {
  WAREHOUSES: 'inventory_warehouses',
  SKUS: 'inventory_skus',
  BATCHES: 'inventory_batches',
  DOCUMENTS: 'inventory_documents',
  TRANSFERS: 'inventory_transfers',
  STOCKTAKES: 'inventory_stocktakes',
  FLOW_LOGS: 'inventory_flow_logs',
  STOCK_HISTORY: 'inventory_stock_history',
};

export const DOCUMENT_TYPES = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
};

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.INBOUND]: '入库',
  [DOCUMENT_TYPES.OUTBOUND]: '出库',
};

export const STOCK_STATUS = {
  SUFFICIENT: 'sufficient',
  WARNING: 'warning',
  DANGER: 'danger',
};

export const STOCK_STATUS_LABELS = {
  [STOCK_STATUS.SUFFICIENT]: '库存充足',
  [STOCK_STATUS.WARNING]: '库存预警',
  [STOCK_STATUS.DANGER]: '库存不足',
};

export const BATCH_STATUS = {
  NORMAL: 'normal',
  EXPIRING: 'expiring',
  EXPIRED: 'expired',
};

export const BATCH_STATUS_LABELS = {
  [BATCH_STATUS.NORMAL]: '正常',
  [BATCH_STATUS.EXPIRING]: '临期',
  [BATCH_STATUS.EXPIRED]: '已过期',
};

export const EXPIRING_DAYS = 30;

export const WARNING_MULTIPLIER = 1.5;

export const DEFAULT_WAREHOUSES = [
  { id: 'wh_001', name: '北京仓库', code: 'BJ', address: '北京市朝阳区', createdAt: Date.now() - 86400000 * 30 },
  { id: 'wh_002', name: '上海仓库', code: 'SH', address: '上海市浦东新区', createdAt: Date.now() - 86400000 * 25 },
  { id: 'wh_003', name: '广州仓库', code: 'GZ', address: '广州市天河区', createdAt: Date.now() - 86400000 * 20 },
];

export const DEFAULT_SKUS = [
  { id: 'sku_001', name: '无线蓝牙耳机', code: 'SKU-BT-001', category: '电子产品', unit: '个', safetyStock: 50, createdAt: Date.now() - 86400000 * 60 },
  { id: 'sku_002', name: '机械键盘', code: 'SKU-KB-002', category: '电子产品', unit: '个', safetyStock: 30, createdAt: Date.now() - 86400000 * 55 },
  { id: 'sku_003', name: '256GB U盘', code: 'SKU-USB-003', category: '存储设备', unit: '个', safetyStock: 100, createdAt: Date.now() - 86400000 * 50 },
  { id: 'sku_004', name: '笔记本电脑支架', code: 'SKU-ST-004', category: '配件', unit: '个', safetyStock: 20, createdAt: Date.now() - 86400000 * 45 },
  { id: 'sku_005', name: 'USB-C 数据线', code: 'SKU-CB-005', category: '配件', unit: '条', safetyStock: 200, createdAt: Date.now() - 86400000 * 40 },
];

export const DEFAULT_BATCHES = [
  { id: 'batch_001', skuId: 'sku_001', warehouseId: 'wh_001', batchNo: 'B20240101', quantity: 120, productionDate: '2024-01-01', expiryDate: '2026-12-31', createdAt: Date.now() - 86400000 * 30 },
  { id: 'batch_002', skuId: 'sku_001', warehouseId: 'wh_002', batchNo: 'B20240215', quantity: 80, productionDate: '2024-02-15', expiryDate: '2027-02-15', createdAt: Date.now() - 86400000 * 20 },
  { id: 'batch_003', skuId: 'sku_002', warehouseId: 'wh_001', batchNo: 'B20240301', quantity: 45, productionDate: '2024-03-01', expiryDate: '2028-03-01', createdAt: Date.now() - 86400000 * 15 },
  { id: 'batch_004', skuId: 'sku_002', warehouseId: 'wh_003', batchNo: 'B20240320', quantity: 60, productionDate: '2024-03-20', expiryDate: '2028-03-20', createdAt: Date.now() - 86400000 * 10 },
  { id: 'batch_005', skuId: 'sku_003', warehouseId: 'wh_002', batchNo: 'B20240401', quantity: 250, productionDate: '2024-04-01', expiryDate: '2029-04-01', createdAt: Date.now() - 86400000 * 5 },
  { id: 'batch_006', skuId: 'sku_004', warehouseId: 'wh_001', batchNo: 'B20240501', quantity: 15, productionDate: '2024-05-01', expiryDate: '2025-06-15', createdAt: Date.now() - 86400000 * 3 },
  { id: 'batch_007', skuId: 'sku_005', warehouseId: 'wh_003', batchNo: 'B20240601', quantity: 300, productionDate: '2024-06-01', expiryDate: '2027-06-01', createdAt: Date.now() - 86400000 * 2 },
];

export const FLOW_LOG_TYPES = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  STOCKTAKE: 'stocktake',
};

export const FLOW_LOG_TYPE_LABELS = {
  [FLOW_LOG_TYPES.INBOUND]: '入库',
  [FLOW_LOG_TYPES.OUTBOUND]: '出库',
  [FLOW_LOG_TYPES.TRANSFER_IN]: '调拨入库',
  [FLOW_LOG_TYPES.TRANSFER_OUT]: '调拨出库',
  [FLOW_LOG_TYPES.STOCKTAKE]: '盘点调整',
};

export const PAGE_SIZE = 20;

export const CHART_DAYS = 30;
