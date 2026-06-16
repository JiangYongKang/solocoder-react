import {
  STORAGE_KEYS,
  DEFAULT_WAREHOUSES,
  DEFAULT_SKUS,
  DEFAULT_BATCHES,
} from './constants.js';

function safeParse(jsonStr, fallback) {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch {
    // 解析失败时返回默认值
    return fallback;
  }
}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function loadWarehouses(storage = getStorage()) {
  if (!storage) return [...DEFAULT_WAREHOUSES];
  const data = storage.getItem(STORAGE_KEYS.WAREHOUSES);
  if (data === null) return [...DEFAULT_WAREHOUSES];
  return safeParse(data, [...DEFAULT_WAREHOUSES]);
}

export function saveWarehouses(warehouses, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  } catch {
    // 存储失败时静默处理
  }
}

export function loadSkus(storage = getStorage()) {
  if (!storage) return [...DEFAULT_SKUS];
  const data = storage.getItem(STORAGE_KEYS.SKUS);
  if (data === null) return [...DEFAULT_SKUS];
  return safeParse(data, [...DEFAULT_SKUS]);
}

export function saveSkus(skus, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.SKUS, JSON.stringify(skus));
  } catch {
    // 存储失败时静默处理
  }
}

export function loadBatches(storage = getStorage()) {
  if (!storage) return [...DEFAULT_BATCHES];
  const data = storage.getItem(STORAGE_KEYS.BATCHES);
  if (data === null) return [...DEFAULT_BATCHES];
  return safeParse(data, [...DEFAULT_BATCHES]);
}

export function saveBatches(batches, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  } catch {
    // 存储失败时静默处理
  }
}

export function loadDocuments(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.DOCUMENTS);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveDocuments(documents, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  } catch {
    // 存储失败时静默处理
  }
}

export function loadTransfers(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.TRANSFERS);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveTransfers(transfers, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  } catch {
    // 存储失败时静默处理
  }
}

export function loadStocktakes(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.STOCKTAKES);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveStocktakes(stocktakes, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.STOCKTAKES, JSON.stringify(stocktakes));
  } catch {
    // 存储失败时静默处理
  }
}

export function loadFlowLogs(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.FLOW_LOGS);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveFlowLogs(flowLogs, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.FLOW_LOGS, JSON.stringify(flowLogs));
  } catch {
    // 存储失败时静默处理
  }
}

export function loadAllInventoryData(storage = getStorage()) {
  return {
    warehouses: loadWarehouses(storage),
    skus: loadSkus(storage),
    batches: loadBatches(storage),
    documents: loadDocuments(storage),
    transfers: loadTransfers(storage),
    stocktakes: loadStocktakes(storage),
    flowLogs: loadFlowLogs(storage),
  };
}

export function saveAllInventoryData(data, storage = getStorage()) {
  if (!data) return;
  if (data.warehouses) saveWarehouses(data.warehouses, storage);
  if (data.skus) saveSkus(data.skus, storage);
  if (data.batches) saveBatches(data.batches, storage);
  if (data.documents) saveDocuments(data.documents, storage);
  if (data.transfers) saveTransfers(data.transfers, storage);
  if (data.stocktakes) saveStocktakes(data.stocktakes, storage);
  if (data.flowLogs) saveFlowLogs(data.flowLogs, storage);
}

export function clearInventoryData(storage = getStorage()) {
  if (!storage) return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
  } catch {
    // 存储失败时静默处理
  }
}
