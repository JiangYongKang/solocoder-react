import {
  STORAGE_KEYS,
  DEFAULT_CONFIG,
  DEFAULT_RETENTION_HOURS,
} from './constants.js';

import { createCells } from './utils.js';

function safeParse(jsonStr, fallback) {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function loadConfig(storage = getStorage()) {
  if (!storage) return { ...DEFAULT_CONFIG };
  const data = storage.getItem(STORAGE_KEYS.LOCKER_CONFIG);
  if (data === null) return { ...DEFAULT_CONFIG };
  return safeParse(data, { ...DEFAULT_CONFIG });
}

export function saveConfig(config, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.LOCKER_CONFIG, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function loadCells(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.LOCKER_CELLS);
  if (data === null) {
    const config = loadConfig(storage);
    return createCells(config);
  }
  return safeParse(data, []);
}

export function saveCells(cells, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.LOCKER_CELLS, JSON.stringify(cells));
  } catch {
    // ignore
  }
}

export function loadPackages(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.PACKAGES);
  if (data === null) return [];
  return safeParse(data, []);
}

export function savePackages(packages, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  } catch {
    // ignore
  }
}

export function loadPickupRecords(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.PICKUP_RECORDS);
  if (data === null) return [];
  return safeParse(data, []);
}

export function savePickupRecords(records, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.PICKUP_RECORDS, JSON.stringify(records));
  } catch {
    // ignore
  }
}

export function loadDeliveryRecords(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.DELIVERY_RECORDS);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveDeliveryRecords(records, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.DELIVERY_RECORDS, JSON.stringify(records));
  } catch {
    // ignore
  }
}

export function loadRetentionHours(storage = getStorage()) {
  if (!storage) return DEFAULT_RETENTION_HOURS;
  const data = storage.getItem(STORAGE_KEYS.RETENTION_HOURS);
  if (data === null) return DEFAULT_RETENTION_HOURS;
  const parsed = parseInt(data, 10);
  return isNaN(parsed) ? DEFAULT_RETENTION_HOURS : parsed;
}

export function saveRetentionHours(hours, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.RETENTION_HOURS, String(hours));
  } catch {
    // ignore
  }
}

export function loadAllLockerData(storage = getStorage()) {
  return {
    config: loadConfig(storage),
    cells: loadCells(storage),
    packages: loadPackages(storage),
    pickupRecords: loadPickupRecords(storage),
    deliveryRecords: loadDeliveryRecords(storage),
    retentionHours: loadRetentionHours(storage),
  };
}

export function saveAllLockerData(data, storage = getStorage()) {
  if (!data) return;
  if (data.config) saveConfig(data.config, storage);
  if (data.cells) saveCells(data.cells, storage);
  if (data.packages) savePackages(data.packages, storage);
  if (data.pickupRecords) savePickupRecords(data.pickupRecords, storage);
  if (data.deliveryRecords) saveDeliveryRecords(data.deliveryRecords, storage);
  if (data.retentionHours !== undefined) saveRetentionHours(data.retentionHours, storage);
}

export function clearLockerData(storage = getStorage()) {
  if (!storage) return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
  } catch {
    // ignore
  }
}
