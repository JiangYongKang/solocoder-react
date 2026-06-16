import { STORAGE_KEYS } from './constants.js';

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

export function loadTopics(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.TOPICS);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveTopics(topics, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  } catch {
    // storage write failed silently
  }
}

export function loadMessages(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.MESSAGES);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveMessages(messages, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  } catch {
    // storage write failed silently
  }
}

export function loadConsumerGroups(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.CONSUMER_GROUPS);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveConsumerGroups(consumerGroups, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.CONSUMER_GROUPS, JSON.stringify(consumerGroups));
  } catch {
    // storage write failed silently
  }
}

export function loadDeadLetters(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.DEAD_LETTERS);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveDeadLetters(deadLetters, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.DEAD_LETTERS, JSON.stringify(deadLetters));
  } catch {
    // storage write failed silently
  }
}

export function loadBacklogHistory(storage = getStorage()) {
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEYS.BACKLOG_HISTORY);
  if (data === null) return [];
  return safeParse(data, []);
}

export function saveBacklogHistory(history, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.BACKLOG_HISTORY, JSON.stringify(history));
  } catch {
    // storage write failed silently
  }
}

export function clearAllData(storage = getStorage()) {
  if (!storage) return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
  } catch {
    // storage clear failed silently
  }
}
