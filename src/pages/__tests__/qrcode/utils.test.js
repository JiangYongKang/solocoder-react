import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  truncateText,
  formatTimestamp,
  loadHistory,
  saveHistory,
  addHistoryItem,
  deleteHistoryItem,
  clearHistory,
  clamp,
  isValidHexColor,
} from '@/pages/qrcode/utils.js';
import { STORAGE_KEY } from '@/pages/qrcode/constants.js';

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

describe('QR Code Utils', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('truncateText', () => {
    it('should return original text when shorter than maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should truncate text longer than maxLength', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });

    it('should handle empty string', () => {
      expect(truncateText('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
    });

    it('should use default maxLength of 50', () => {
      const longText = 'a'.repeat(60);
      const result = truncateText(longText);
      expect(result.length).toBe(53);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const timestamp = new Date('2024-01-15T10:30:00').getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toBe('2024-01-15 10:30');
    });

    it('should pad single digits with leading zero', () => {
      const timestamp = new Date('2024-01-05T09:05:00').getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toBe('2024-01-05 09:05');
    });
  });

  describe('clamp', () => {
    it('should return value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp to min when value is below', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp to max when value is above', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle boundary values', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('isValidHexColor', () => {
    it('should accept 3-digit hex colors', () => {
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('#000')).toBe(true);
      expect(isValidHexColor('#abc')).toBe(true);
    });

    it('should accept 6-digit hex colors', () => {
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#a1b2c3')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isValidHexColor('#ABC')).toBe(true);
      expect(isValidHexColor('#ABCDEF')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidHexColor('fff')).toBe(false);
      expect(isValidHexColor('#ffff')).toBe(false);
      expect(isValidHexColor('#ggg')).toBe(false);
      expect(isValidHexColor('#12345g')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
      expect(isValidHexColor(null)).toBe(false);
    });
  });

  describe('History management', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    describe('loadHistory', () => {
      it('should return empty array when storage is empty', () => {
        const history = loadHistory(storage);
        expect(history).toEqual([]);
      });

      it('should return empty array when storage is null', () => {
        const history = loadHistory(null);
        expect(history).toEqual([]);
      });

      it('should parse and return valid history items', () => {
        const testHistory = [
          { id: '1', content: 'test1', type: 'generate', timestamp: Date.now() },
          { id: '2', content: 'test2', type: 'decode', timestamp: Date.now() },
        ];
        storage.setItem(STORAGE_KEY, JSON.stringify(testHistory));
        const history = loadHistory(storage);
        expect(history.length).toBe(2);
        expect(history[0].content).toBe('test1');
        expect(history[1].content).toBe('test2');
      });

      it('should handle corrupted JSON gracefully', () => {
        storage.setItem(STORAGE_KEY, '{invalid json');
        const history = loadHistory(storage);
        expect(history).toEqual([]);
      });

      it('should filter out invalid items', () => {
        const testHistory = [
          { id: '1', content: 'valid', type: 'generate', timestamp: Date.now() },
          null,
          { id: '2' },
          { content: 'no id' },
          'string',
        ];
        storage.setItem(STORAGE_KEY, JSON.stringify(testHistory));
        const history = loadHistory(storage);
        expect(history.length).toBe(1);
        expect(history[0].content).toBe('valid');
      });

      it('should not throw when storage is unavailable', () => {
        expect(() => loadHistory(null)).not.toThrow();
      });
    });

    describe('saveHistory', () => {
      it('should save history to storage', () => {
        const testHistory = [
          { id: '1', content: 'test', type: 'generate', timestamp: Date.now() },
        ];
        saveHistory(testHistory, storage);
        const saved = JSON.parse(storage.getItem(STORAGE_KEY));
        expect(saved.length).toBe(1);
        expect(saved[0].content).toBe('test');
      });

      it('should limit history to 50 items', () => {
        const longHistory = [];
        for (let i = 0; i < 100; i++) {
          longHistory.push({ id: String(i), content: `test${i}`, type: 'generate', timestamp: Date.now() });
        }
        saveHistory(longHistory, storage);
        const saved = JSON.parse(storage.getItem(STORAGE_KEY));
        expect(saved.length).toBe(50);
      });

      it('should not throw when storage is unavailable', () => {
        expect(() => saveHistory([], null)).not.toThrow();
      });
    });

    describe('addHistoryItem', () => {
      it('should add new item to the beginning', () => {
        const history = [{ id: '1', content: 'old', type: 'generate', timestamp: 1000 }];
        const newHistory = addHistoryItem(history, { content: 'new', type: 'generate' });
        expect(newHistory.length).toBe(2);
        expect(newHistory[0].content).toBe('new');
        expect(newHistory[1].content).toBe('old');
      });

      it('should generate id when not provided', () => {
        const newHistory = addHistoryItem([], { content: 'test', type: 'generate' });
        expect(newHistory[0].id).toBeTruthy();
      });

      it('should set timestamp when not provided', () => {
        const before = Date.now();
        const newHistory = addHistoryItem([], { content: 'test', type: 'generate' });
        const after = Date.now();
        expect(newHistory[0].timestamp).toBeGreaterThanOrEqual(before);
        expect(newHistory[0].timestamp).toBeLessThanOrEqual(after);
      });

      it('should default type to generate', () => {
        const newHistory = addHistoryItem([], { content: 'test' });
        expect(newHistory[0].type).toBe('generate');
      });

      it('should remove duplicates with same content', () => {
        const history = [
          { id: '1', content: 'same', type: 'generate', timestamp: 1000 },
          { id: '2', content: 'other', type: 'generate', timestamp: 999 },
        ];
        const newHistory = addHistoryItem(history, { content: 'same', type: 'decode' });
        expect(newHistory.length).toBe(2);
        expect(newHistory[0].content).toBe('same');
        expect(newHistory[1].content).toBe('other');
      });

      it('should limit to 50 items', () => {
        let history = [];
        for (let i = 0; i < 60; i++) {
          history = addHistoryItem(history, { content: `item${i}`, type: 'generate' });
        }
        expect(history.length).toBe(50);
        expect(history[0].content).toBe('item59');
        expect(history[49].content).toBe('item10');
      });

      it('should not mutate original array', () => {
        const history = [{ id: '1', content: 'old', type: 'generate', timestamp: 1000 }];
        const frozen = JSON.stringify(history);
        addHistoryItem(history, { content: 'new', type: 'generate' });
        expect(JSON.stringify(history)).toBe(frozen);
      });
    });

    describe('deleteHistoryItem', () => {
      it('should delete item by id', () => {
        const history = [
          { id: '1', content: 'a', type: 'generate', timestamp: 1000 },
          { id: '2', content: 'b', type: 'generate', timestamp: 999 },
        ];
        const newHistory = deleteHistoryItem(history, '1');
        expect(newHistory.length).toBe(1);
        expect(newHistory[0].id).toBe('2');
      });

      it('should return same array if id not found', () => {
        const history = [{ id: '1', content: 'a', type: 'generate', timestamp: 1000 }];
        const newHistory = deleteHistoryItem(history, 'nonexistent');
        expect(newHistory.length).toBe(1);
      });

      it('should not mutate original array', () => {
        const history = [{ id: '1', content: 'a', type: 'generate', timestamp: 1000 }];
        const frozen = JSON.stringify(history);
        deleteHistoryItem(history, '1');
        expect(JSON.stringify(history)).toBe(frozen);
      });
    });

    describe('clearHistory', () => {
      it('should return empty array', () => {
        expect(clearHistory()).toEqual([]);
      });
    });
  });
});
