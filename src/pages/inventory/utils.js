import {
  DOCUMENT_TYPES,
  STOCK_STATUS,
  WARNING_MULTIPLIER,
  BATCH_STATUS,
  EXPIRING_DAYS,
  FLOW_LOG_TYPES,
  CHART_DAYS,
} from './constants.js';

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getSkuStockInWarehouse(batches, skuId, warehouseId) {
  if (!Array.isArray(batches) || !skuId || !warehouseId) return 0;
  return batches
    .filter((b) => b.skuId === skuId && b.warehouseId === warehouseId)
    .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
}

export function getSkuTotalStock(batches, skuId) {
  if (!Array.isArray(batches) || !skuId) return 0;
  return batches
    .filter((b) => b.skuId === skuId)
    .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
}

export function getStockStatus(totalStock, safetyStock) {
  const stock = Number(totalStock) || 0;
  const safety = Number(safetyStock) || 0;
  if (safety <= 0) return STOCK_STATUS.SUFFICIENT;
  if (stock < safety) return STOCK_STATUS.DANGER;
  if (stock < safety * WARNING_MULTIPLIER) return STOCK_STATUS.WARNING;
  return STOCK_STATUS.SUFFICIENT;
}

export function getDaysUntilExpiry(expiryDate, now = Date.now()) {
  if (!expiryDate) return Infinity;
  const expiry = new Date(expiryDate).getTime();
  if (isNaN(expiry)) return Infinity;
  const diffMs = expiry - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getBatchStatus(batch, now = Date.now()) {
  if (!batch || !batch.expiryDate) return BATCH_STATUS.NORMAL;
  const days = getDaysUntilExpiry(batch.expiryDate, now);
  if (days < 0) return BATCH_STATUS.EXPIRED;
  if (days <= EXPIRING_DAYS) return BATCH_STATUS.EXPIRING;
  return BATCH_STATUS.NORMAL;
}

export function isBatchExpired(batch, now = Date.now()) {
  return getBatchStatus(batch, now) === BATCH_STATUS.EXPIRED;
}

export function sortBatchesByFifo(batches, skuId, warehouseId, now = Date.now()) {
  if (!Array.isArray(batches)) return [];
  const filtered = batches.filter(
    (b) => b.skuId === skuId && b.warehouseId === warehouseId && !isBatchExpired(b, now) && b.quantity > 0
  );
  return filtered.sort((a, b) => {
    const dateA = new Date(a.expiryDate || 0).getTime();
    const dateB = new Date(b.expiryDate || 0).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

export function allocateStockByFifo(batches, skuId, warehouseId, quantity, now = Date.now()) {
  const qty = Number(quantity) || 0;
  if (qty <= 0) return { success: false, error: '出库数量必须大于0', allocations: [], updatedBatches: null };
  const available = getSkuStockInWarehouse(batches, skuId, warehouseId);
  if (qty > available) {
    return { success: false, error: '出库数量不能超过当前库存量', allocations: [], updatedBatches: null };
  }
  const sortedBatches = sortBatchesByFifo(batches, skuId, warehouseId, now);
  const allocations = [];
  let remaining = qty;
  const batchUpdates = new Map();
  for (const batch of sortedBatches) {
    if (remaining <= 0) break;
    const takeQty = Math.min(remaining, batch.quantity);
    allocations.push({ batchId: batch.id, batchNo: batch.batchNo, quantity: takeQty });
    batchUpdates.set(batch.id, { ...batch, quantity: batch.quantity - takeQty });
    remaining -= takeQty;
  }
  if (remaining > 0) {
    return { success: false, error: '可用库存不足', allocations: [], updatedBatches: null };
  }
  const updatedBatches = batches.map((b) => (batchUpdates.has(b.id) ? batchUpdates.get(b.id) : b));
  return { success: true, allocations, updatedBatches };
}

export function createInboundBatch(batches, data) {
  const { skuId, warehouseId, quantity, batchNo, productionDate, expiryDate, operator, remark } = data;
  if (!skuId || !warehouseId || !batchNo) {
    return { success: false, error: '缺少必要信息', batch: null, document: null };
  }
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    return { success: false, error: '入库数量必须大于0', batch: null, document: null };
  }
  const existingBatch = batches.find(
    (b) => b.skuId === skuId && b.warehouseId === warehouseId && b.batchNo === batchNo
  );
  let newBatch;
  let updatedBatches;
  if (existingBatch) {
    newBatch = { ...existingBatch, quantity: existingBatch.quantity + qty };
    updatedBatches = batches.map((b) => (b.id === existingBatch.id ? newBatch : b));
  } else {
    newBatch = {
      id: generateId('batch_'),
      skuId,
      warehouseId,
      batchNo,
      quantity: qty,
      productionDate: productionDate || null,
      expiryDate: expiryDate || null,
      createdAt: Date.now(),
    };
    updatedBatches = [...batches, newBatch];
  }
  const document = {
    id: generateId('doc_'),
    type: DOCUMENT_TYPES.INBOUND,
    warehouseId,
    skuId,
    quantity: qty,
    batchNo,
    productionDate: productionDate || null,
    expiryDate: expiryDate || null,
    operator: operator || '系统',
    remark: remark || '',
    createdAt: Date.now(),
  };
  return { success: true, batch: newBatch, updatedBatches, document };
}

export function createOutboundDocument(batches, data) {
  const { skuId, warehouseId, quantity, operator, remark } = data;
  if (!skuId || !warehouseId) {
    return { success: false, error: '缺少必要信息', document: null, updatedBatches: null, allocations: [] };
  }
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    return { success: false, error: '出库数量必须大于0', document: null, updatedBatches: null, allocations: [] };
  }
  const allocationResult = allocateStockByFifo(batches, skuId, warehouseId, qty);
  if (!allocationResult.success) {
    return { success: false, error: allocationResult.error, document: null, updatedBatches: null, allocations: [] };
  }
  const document = {
    id: generateId('doc_'),
    type: DOCUMENT_TYPES.OUTBOUND,
    warehouseId,
    skuId,
    quantity: qty,
    allocations: allocationResult.allocations,
    operator: operator || '系统',
    remark: remark || '',
    createdAt: Date.now(),
  };
  return {
    success: true,
    document,
    updatedBatches: allocationResult.updatedBatches,
    allocations: allocationResult.allocations,
  };
}

export function createTransfer(batches, data) {
  const { sourceWarehouseId, targetWarehouseId, skuId, quantity, operator, remark } = data;
  if (!sourceWarehouseId || !targetWarehouseId || !skuId) {
    return { success: false, error: '缺少必要信息', transfer: null, updatedBatches: null };
  }
  if (sourceWarehouseId === targetWarehouseId) {
    return { success: false, error: '源仓库和目标仓库不能相同', transfer: null, updatedBatches: null };
  }
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    return { success: false, error: '调拨数量必须大于0', transfer: null, updatedBatches: null };
  }
  const sourceStock = getSkuStockInWarehouse(batches, skuId, sourceWarehouseId);
  if (qty > sourceStock) {
    return { success: false, error: '源仓库库存不足', transfer: null, updatedBatches: null };
  }
  const outboundResult = allocateStockByFifo(batches, skuId, sourceWarehouseId, qty);
  if (!outboundResult.success) {
    return { success: false, error: outboundResult.error, transfer: null, updatedBatches: null };
  }
  let intermediateBatches = outboundResult.updatedBatches;
  const newBatchNo = `T${Date.now().toString(36).toUpperCase()}`;
  const transferBatch = {
    id: generateId('batch_'),
    skuId,
    warehouseId: targetWarehouseId,
    batchNo: newBatchNo,
    quantity: qty,
    productionDate: null,
    expiryDate: null,
    createdAt: Date.now(),
    sourceTransfer: true,
  };
  const finalBatches = [...intermediateBatches, transferBatch];
  const transfer = {
    id: generateId('tf_'),
    sourceWarehouseId,
    targetWarehouseId,
    skuId,
    quantity: qty,
    allocations: outboundResult.allocations,
    targetBatchId: transferBatch.id,
    operator: operator || '系统',
    remark: remark || '',
    createdAt: Date.now(),
  };
  return { success: true, transfer, updatedBatches: finalBatches };
}

export function validateTransfer(data, batches) {
  const { sourceWarehouseId, targetWarehouseId, skuId, quantity } = data;
  const errors = {};
  if (!sourceWarehouseId) errors.sourceWarehouseId = '请选择源仓库';
  if (!targetWarehouseId) errors.targetWarehouseId = '请选择目标仓库';
  if (sourceWarehouseId && targetWarehouseId && sourceWarehouseId === targetWarehouseId) {
    errors.targetWarehouseId = '目标仓库不能与源仓库相同';
  }
  if (!skuId) errors.skuId = '请选择SKU';
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    errors.quantity = '调拨数量必须大于0';
  } else if (sourceWarehouseId && skuId) {
    const sourceStock = getSkuStockInWarehouse(batches, skuId, sourceWarehouseId);
    if (qty > sourceStock) {
      errors.quantity = '源仓库库存不足';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function createStocktake(warehouseId, skuItems, operator) {
  const differences = [];
  for (const item of skuItems) {
    const diff = (Number(item.actualQty) || 0) - (Number(item.systemQty) || 0);
    if (diff !== 0) {
      differences.push({
        skuId: item.skuId,
        skuName: item.skuName || '',
        systemQty: Number(item.systemQty) || 0,
        actualQty: Number(item.actualQty) || 0,
        difference: diff,
        remark: item.remark || '',
      });
    }
  }
  const stocktake = {
    id: generateId('stk_'),
    warehouseId,
    totalItems: skuItems.length,
    diffCount: differences.length,
    differences,
    operator: operator || '系统',
    status: 'completed',
    createdAt: Date.now(),
  };
  return { stocktake, differences };
}

export function applyStocktake(batches, warehouseId, differences) {
  if (!Array.isArray(differences) || differences.length === 0) {
    return { success: true, updatedBatches: batches, flowLogs: [] };
  }
  let updatedBatches = [...batches];
  const flowLogs = [];
  for (const diff of differences) {
    const currentQty = getSkuStockInWarehouse(updatedBatches, diff.skuId, warehouseId);
    const targetQty = diff.actualQty;
    const changeQty = targetQty - currentQty;
    if (changeQty > 0) {
      const newBatch = {
        id: generateId('batch_'),
        skuId: diff.skuId,
        warehouseId,
        batchNo: `ADJ${Date.now().toString(36).toUpperCase()}`,
        quantity: changeQty,
        productionDate: null,
        expiryDate: null,
        createdAt: Date.now(),
        stocktakeAdjust: true,
      };
      updatedBatches = [...updatedBatches, newBatch];
    } else if (changeQty < 0) {
      const allocResult = allocateStockByFifo(updatedBatches, diff.skuId, warehouseId, Math.abs(changeQty));
      if (allocResult.success) {
        updatedBatches = allocResult.updatedBatches;
      }
    }
    flowLogs.push({
      id: generateId('fl_'),
      skuId: diff.skuId,
      warehouseId,
      type: FLOW_LOG_TYPES.STOCKTAKE,
      quantityChange: changeQty,
      balanceAfter: targetQty,
      refId: '',
      refType: 'stocktake',
      remark: diff.remark || '盘点调整',
      operator: '系统',
      createdAt: Date.now(),
    });
  }
  return { success: true, updatedBatches, flowLogs };
}

export function calculateStocktakeDiff(systemQty, actualQty) {
  const sys = Number(systemQty) || 0;
  const act = Number(actualQty) || 0;
  return act - sys;
}

export function createFlowLog(data) {
  return {
    id: generateId('fl_'),
    skuId: data.skuId,
    warehouseId: data.warehouseId,
    type: data.type,
    quantityChange: data.quantityChange || 0,
    balanceAfter: data.balanceAfter || 0,
    refId: data.refId || '',
    refType: data.refType || '',
    batchNo: data.batchNo || '',
    remark: data.remark || '',
    operator: data.operator || '系统',
    createdAt: data.createdAt || Date.now(),
  };
}

export function getSkuFlowLogs(flowLogs, skuId, options = {}) {
  if (!Array.isArray(flowLogs) || !skuId) return [];
  let filtered = flowLogs.filter((log) => log.skuId === skuId);
  if (options.startTime) {
    filtered = filtered.filter((log) => log.createdAt >= options.startTime);
  }
  if (options.endTime) {
    filtered = filtered.filter((log) => log.createdAt <= options.endTime);
  }
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}

export function getWarningSkus(skus, batches) {
  if (!Array.isArray(skus) || !Array.isArray(batches)) return [];
  return skus.filter((sku) => {
    const totalStock = getSkuTotalStock(batches, sku.id);
    const status = getStockStatus(totalStock, sku.safetyStock);
    return status === STOCK_STATUS.DANGER;
  });
}

export function buildStockHistory(flowLogs, skus, days = CHART_DAYS) {
  const history = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const dayStart = date.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
    const dayLogs = flowLogs.filter((log) => log.createdAt >= dayStart && log.createdAt <= dayEnd);
    const inboundTotal = dayLogs
      .filter((l) => l.type === FLOW_LOG_TYPES.INBOUND || l.type === FLOW_LOG_TYPES.TRANSFER_IN)
      .reduce((sum, l) => sum + (l.quantityChange || 0), 0);
    const outboundTotal = Math.abs(
      dayLogs
        .filter((l) => l.type === FLOW_LOG_TYPES.OUTBOUND || l.type === FLOW_LOG_TYPES.TRANSFER_OUT)
        .reduce((sum, l) => sum + (l.quantityChange || 0), 0)
    );
    let totalStock = 0;
    if (skus && skus.length > 0) {
      const dayFlowLogs = flowLogs.filter((l) => l.createdAt <= dayEnd);
      for (const sku of skus) {
        const skuLogs = dayFlowLogs.filter((l) => l.skuId === sku.id);
        if (skuLogs.length > 0) {
          const lastLog = skuLogs[skuLogs.length - 1];
          totalStock += lastLog.balanceAfter || 0;
        }
      }
    }
    history.push({
      date: dateStr,
      timestamp: dayStart,
      inbound: inboundTotal,
      outbound: outboundTotal,
      totalStock,
    });
  }
  return history;
}

export function getStockByWarehouse(batches, warehouses) {
  if (!Array.isArray(batches) || !Array.isArray(warehouses)) return [];
  return warehouses.map((wh) => ({
    warehouseId: wh.id,
    warehouseName: wh.name,
    totalStock: batches
      .filter((b) => b.warehouseId === wh.id)
      .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0),
  }));
}

export function getStatistics(batches, flowLogs, skus, now = Date.now()) {
  const totalSkus = Array.isArray(skus) ? skus.length : 0;
  const totalStock = Array.isArray(batches)
    ? batches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0)
    : 0;
  const currentMonthStart = new Date(now);
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const monthStart = currentMonthStart.getTime();
  const monthLogs = Array.isArray(flowLogs)
    ? flowLogs.filter((l) => l.createdAt >= monthStart)
    : [];
  const monthInbound = monthLogs
    .filter((l) => l.type === FLOW_LOG_TYPES.INBOUND || l.type === FLOW_LOG_TYPES.TRANSFER_IN)
    .reduce((sum, l) => sum + Math.max(0, l.quantityChange || 0), 0);
  const monthOutbound = monthLogs
    .filter((l) => l.type === FLOW_LOG_TYPES.OUTBOUND || l.type === FLOW_LOG_TYPES.TRANSFER_OUT)
    .reduce((sum, l) => sum + Math.abs(l.quantityChange || 0), 0);
  return {
    totalSkus,
    totalStock,
    monthInbound,
    monthOutbound,
  };
}

export function getSkuBatches(batches, skuId, warehouseId = null) {
  if (!Array.isArray(batches) || !skuId) return [];
  let filtered = batches.filter((b) => b.skuId === skuId);
  if (warehouseId) {
    filtered = filtered.filter((b) => b.warehouseId === warehouseId);
  }
  return filtered.sort((a, b) => {
    const dateA = new Date(a.expiryDate || 0).getTime();
    const dateB = new Date(b.expiryDate || 0).getTime();
    return dateA - dateB;
  });
}

export function filterSkus(skus, keyword, showWarningOnly, batches) {
  if (!Array.isArray(skus)) return [];
  let result = [...skus];
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        s.code.toLowerCase().includes(kw) ||
        (s.category && s.category.toLowerCase().includes(kw))
    );
  }
  if (showWarningOnly) {
    result = result.filter((sku) => {
      const total = getSkuTotalStock(batches, sku.id);
      return getStockStatus(total, sku.safetyStock) === STOCK_STATUS.DANGER;
    });
  }
  return result;
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
