import { STORAGE_KEYS } from './constants.js';

export function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function loadRaw(key, storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveRaw(key, value, storage) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

export function loadCart(storage = getStorage()) {
  const raw = loadRaw(STORAGE_KEYS.CART, storage);
  return Array.isArray(raw) ? raw : [];
}

export function saveCart(cart, storage = getStorage()) {
  saveRaw(STORAGE_KEYS.CART, Array.isArray(cart) ? cart : [], storage);
}

export function loadAddresses(storage = getStorage()) {
  const raw = loadRaw(STORAGE_KEYS.ADDRESSES, storage);
  return Array.isArray(raw) ? raw : [];
}

export function saveAddresses(addresses, storage = getStorage()) {
  saveRaw(STORAGE_KEYS.ADDRESSES, Array.isArray(addresses) ? addresses : [], storage);
}

export function loadOrders(storage = getStorage()) {
  const raw = loadRaw(STORAGE_KEYS.ORDERS, storage);
  return Array.isArray(raw) ? raw : [];
}

export function saveOrders(orders, storage = getStorage()) {
  saveRaw(STORAGE_KEYS.ORDERS, Array.isArray(orders) ? orders : [], storage);
}
