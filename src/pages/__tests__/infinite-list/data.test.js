import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import {
  generateId,
  generateItem,
  generateItems,
  filterItems,
  updateItemTitle,
  deleteItem,
  prependItems,
  appendItems,
  formatDate,
  ensureInitialData,
  saveItems,
  clearStorage,
} from '../../infinite-list/data.js';

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = new LocalStorageMock();
  }
});

const STORAGE_KEY = 'infinite-list-data';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('generateId', () => {
  it('should generate a string id', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(id.startsWith('item-')).toBe(true);
  });

  it('should generate unique ids', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });
});

describe('generateItem', () => {
  it('should generate a valid item with all required fields', () => {
    const item = generateItem();
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('description');
    expect(item).toHaveProperty('createdAt');
    expect(typeof item.id).toBe('string');
    expect(typeof item.title).toBe('string');
    expect(typeof item.description).toBe('string');
    expect(typeof item.createdAt).toBe('number');
    expect(item.createdAt).toBeGreaterThan(0);
    expect(item.title.length).toBeGreaterThan(0);
    expect(item.description.length).toBeGreaterThan(0);
  });

  it('should use provided id override', () => {
    const customId = 'custom-id-123';
    const item = generateItem(customId);
    expect(item.id).toBe(customId);
  });
});

describe('generateItems', () => {
  it('should generate specified count of items', () => {
    const count = 25;
    const items = generateItems(count);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(count);
    items.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('createdAt');
    });
  });

  it('should default to 100 items', () => {
    const items = generateItems();
    expect(items.length).toBe(100);
  });

  it('should generate items with unique ids', () => {
    const items = generateItems(100);
    const ids = items.map((i) => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(100);
  });
});

describe('filterItems', () => {
  const items = [
    { id: '1', title: 'React 组件设计', description: '关于前端组件架构的讨论', createdAt: 1 },
    { id: '2', title: 'Vue 响应式原理', description: '深入理解数据绑定', createdAt: 2 },
    { id: '3', title: '性能优化', description: '前端性能调优实践', createdAt: 3 },
    { id: '4', title: 'Node.js 后端', description: '服务端开发指南', createdAt: 4 },
  ];

  it('should return all items when keyword is empty', () => {
    expect(filterItems(items, '')).toHaveLength(4);
    expect(filterItems(items, null)).toHaveLength(4);
    expect(filterItems(items, undefined)).toHaveLength(4);
  });

  it('should return all items when keyword is only whitespace', () => {
    expect(filterItems(items, '   ')).toHaveLength(4);
  });

  it('should filter by title (case-insensitive)', () => {
    const result = filterItems(items, 'react');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('should filter by description (case-insensitive)', () => {
    const result = filterItems(items, '前端');
    expect(result.length).toBe(2);
    expect(result.map((i) => i.id)).toEqual(['1', '3']);
  });

  it('should filter matching either title or description', () => {
    const result = filterItems(items, '性能');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('3');
  });

  it('should return empty array when no matches', () => {
    const result = filterItems(items, '不存在的关键词');
    expect(result).toEqual([]);
  });
});

describe('updateItemTitle', () => {
  const items = [
    { id: '1', title: '原始标题', description: 'desc1', createdAt: 1 },
    { id: '2', title: '另一个标题', description: 'desc2', createdAt: 2 },
  ];

  it('should update title for matching id', () => {
    const result = updateItemTitle(items, '1', '新标题');
    expect(result[0].title).toBe('新标题');
    expect(result[1].title).toBe('另一个标题');
  });

  it('should not mutate original array', () => {
    const result = updateItemTitle(items, '1', '新标题');
    expect(items[0].title).toBe('原始标题');
    expect(result).not.toBe(items);
  });

  it('should return same items when id not found', () => {
    const result = updateItemTitle(items, '999', '新标题');
    expect(result).toEqual(items);
  });

  it('should ignore empty title', () => {
    const result1 = updateItemTitle(items, '1', '');
    const result2 = updateItemTitle(items, '1', '   ');
    expect(result1).toBe(items);
    expect(result2).toBe(items);
  });

  it('should trim whitespace from title', () => {
    const result = updateItemTitle(items, '1', '  修剪后的标题  ');
    expect(result[0].title).toBe('修剪后的标题');
  });
});

describe('deleteItem', () => {
  const items = [
    { id: '1', title: 'a', description: 'd', createdAt: 1 },
    { id: '2', title: 'b', description: 'd', createdAt: 2 },
    { id: '3', title: 'c', description: 'd', createdAt: 3 },
  ];

  it('should remove item by id', () => {
    const result = deleteItem(items, '2');
    expect(result.length).toBe(2);
    expect(result.map((i) => i.id)).toEqual(['1', '3']);
  });

  it('should not mutate original array', () => {
    const result = deleteItem(items, '1');
    expect(items.length).toBe(3);
    expect(result).not.toBe(items);
  });

  it('should return same items when id not found', () => {
    const result = deleteItem(items, '999');
    expect(result).toEqual(items);
  });
});

describe('prependItems', () => {
  it('should add items to the beginning', () => {
    const original = [{ id: '3' }, { id: '4' }];
    const prepended = [{ id: '1' }, { id: '2' }];
    const result = prependItems(original, prepended);
    expect(result.map((i) => i.id)).toEqual(['1', '2', '3', '4']);
  });

  it('should not mutate original arrays', () => {
    const original = [{ id: '1' }];
    const prepended = [{ id: '2' }];
    const result = prependItems(original, prepended);
    expect(original.length).toBe(1);
    expect(prepended.length).toBe(1);
    expect(result).not.toBe(original);
  });
});

describe('appendItems', () => {
  it('should add items to the end', () => {
    const original = [{ id: '1' }, { id: '2' }];
    const appended = [{ id: '3' }, { id: '4' }];
    const result = appendItems(original, appended);
    expect(result.map((i) => i.id)).toEqual(['1', '2', '3', '4']);
  });

  it('should not mutate original arrays', () => {
    const original = [{ id: '1' }];
    const appended = [{ id: '2' }];
    const result = appendItems(original, appended);
    expect(original.length).toBe(1);
    expect(appended.length).toBe(1);
    expect(result).not.toBe(original);
  });
});

describe('formatDate', () => {
  it('should format timestamp to YYYY-MM-DD HH:mm', () => {
    const date = new Date(2024, 0, 5, 9, 30);
    const result = formatDate(date.getTime());
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(result).toBe('2024-01-05 09:30');
  });

  it('should pad single-digit values with zero', () => {
    const date = new Date(2024, 0, 1, 0, 5);
    const result = formatDate(date.getTime());
    expect(result).toBe('2024-01-01 00:05');
  });
});

describe('localStorage persistence', () => {
  it('should save and load from localStorage', () => {
    const items = [
      { id: '1', title: 't1', description: 'd1', createdAt: 1 },
      { id: '2', title: 't2', description: 'd2', createdAt: 2 },
    ];
    saveItems(items);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored);
    expect(parsed).toEqual(items);
  });

  it('ensureInitialData should generate 10000 items when storage is empty', () => {
    const result = ensureInitialData(10000);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(10000);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
  });

  it('ensureInitialData should load from storage when data exists', () => {
    const seed = [{ id: 's1', title: 'seed', description: 'd', createdAt: 1 }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    const result = ensureInitialData(10000);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('s1');
  });

  it('ensureInitialData should handle corrupted storage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    const result = ensureInitialData(50);
    expect(result.length).toBe(50);
  });

  it('clearStorage should remove data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: '1' }]));
    clearStorage();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
