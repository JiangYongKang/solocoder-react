import { describe, it, expect, beforeEach } from 'vitest';
import {
  NOTIFICATION_TYPES,
  DEFAULT_PREFS,
  STORAGE_KEY,
  PREFS_STORAGE_KEY,
  MAX_ACTIVE_NOTIFICATIONS,
} from '@/pages/notifications/constants.js';
import {
  generateId,
  getDefaultNotifications,
  createNotification,
  loadNotifications,
  saveNotifications,
  loadPrefs,
  savePrefs,
  markAsRead,
  markAllAsRead,
  markAllOfTypeAsRead,
  addNotification,
  groupByType,
  getUnreadCount,
  getUnreadCountByType,
  formatTime,
  getEnabledTypes,
  pickRandomEnabledType,
  updatePref,
} from '@/pages/notifications/notificationsUtils.js';

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

function createState(active = [], archived = []) {
  return { active, archived };
}

function makeNotification(overrides = {}) {
  return {
    id: generateId(),
    type: NOTIFICATION_TYPES.SYSTEM,
    title: 'Test',
    summary: 'Test summary',
    content: 'Test content',
    read: false,
    createdAt: Date.now(),
    archived: false,
    ...overrides,
  };
}

describe('notificationsUtils', () => {
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

  describe('getDefaultNotifications', () => {
    it('should return an array of notifications', () => {
      const defaults = getDefaultNotifications();
      expect(Array.isArray(defaults)).toBe(true);
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('each notification should have required fields', () => {
      const defaults = getDefaultNotifications();
      defaults.forEach((n) => {
        expect(n).toHaveProperty('id');
        expect(n).toHaveProperty('type');
        expect(n).toHaveProperty('title');
        expect(n).toHaveProperty('summary');
        expect(n).toHaveProperty('content');
        expect(n).toHaveProperty('read');
        expect(n).toHaveProperty('createdAt');
        expect(n).toHaveProperty('archived');
      });
    });
  });

  describe('createNotification', () => {
    it('should create a notification of the given type', () => {
      const n = createNotification(NOTIFICATION_TYPES.SYSTEM);
      expect(n.type).toBe(NOTIFICATION_TYPES.SYSTEM);
      expect(n.id).toBeTruthy();
      expect(n.read).toBe(false);
      expect(n.archived).toBe(false);
      expect(typeof n.title).toBe('string');
      expect(typeof n.content).toBe('string');
    });

    it('should create message type notifications', () => {
      const n = createNotification(NOTIFICATION_TYPES.MESSAGE);
      expect(n.type).toBe(NOTIFICATION_TYPES.MESSAGE);
    });

    it('should create task type notifications', () => {
      const n = createNotification(NOTIFICATION_TYPES.TASK);
      expect(n.type).toBe(NOTIFICATION_TYPES.TASK);
    });

    it('should accept custom data overrides', () => {
      const n = createNotification(NOTIFICATION_TYPES.SYSTEM, {
        title: 'Custom Title',
        read: true,
        content: 'Custom content',
      });
      expect(n.title).toBe('Custom Title');
      expect(n.read).toBe(true);
      expect(n.content).toBe('Custom content');
    });

    it('should throw on invalid type', () => {
      expect(() => createNotification('invalid-type')).toThrow();
    });

    it('should not mutate the original state', () => {
      const state = createState([makeNotification()]);
      const frozen = JSON.stringify(state);
      addNotification(state, makeNotification());
      expect(JSON.stringify(state)).toBe(frozen);
    });
  });

  describe('localStorage persistence', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('loadNotifications should persist defaults when storage empty', () => {
      const state = loadNotifications(storage);
      expect(Array.isArray(state.active)).toBe(true);
      expect(Array.isArray(state.archived)).toBe(true);
      expect(state.active.length).toBeGreaterThan(0);
      expect(storage.getItem(STORAGE_KEY)).toBeTruthy();
    });

    it('saveNotifications and loadNotifications should round-trip correctly', () => {
      const n = makeNotification({ title: 'Persisted' });
      const state = createState([n]);
      saveNotifications(state, storage);
      const loaded = loadNotifications(storage);
      expect(loaded.active.length).toBe(1);
      expect(loaded.active[0].title).toBe('Persisted');
    });

    it('loadNotifications should gracefully handle corrupted JSON', () => {
      storage.setItem(STORAGE_KEY, '{invalid json');
      const state = loadNotifications(storage);
      expect(Array.isArray(state.active)).toBe(true);
      expect(Array.isArray(state.archived)).toBe(true);
    });

    it('should not throw when storage is unavailable (null)', () => {
      expect(() => loadNotifications(null)).not.toThrow();
      expect(() => saveNotifications(createState(), null)).not.toThrow();
    });

    it('loadPrefs should save and return defaults when empty', () => {
      const prefs = loadPrefs(storage);
      expect(prefs).toEqual(DEFAULT_PREFS);
      expect(storage.getItem(PREFS_STORAGE_KEY)).toBeTruthy();
    });

    it('savePrefs and loadPrefs should round-trip', () => {
      const custom = { ...DEFAULT_PREFS, [NOTIFICATION_TYPES.SYSTEM]: false };
      savePrefs(custom, storage);
      const loaded = loadPrefs(storage);
      expect(loaded[NOTIFICATION_TYPES.SYSTEM]).toBe(false);
      expect(loaded[NOTIFICATION_TYPES.MESSAGE]).toBe(true);
    });

    it('loadPrefs should handle corrupted JSON', () => {
      storage.setItem(PREFS_STORAGE_KEY, 'not json');
      const prefs = loadPrefs(storage);
      expect(prefs).toEqual(DEFAULT_PREFS);
    });

    it('loadPrefs should merge with defaults (missing keys)', () => {
      storage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ system: false }));
      const prefs = loadPrefs(storage);
      expect(prefs[NOTIFICATION_TYPES.SYSTEM]).toBe(false);
      expect(prefs[NOTIFICATION_TYPES.MESSAGE]).toBe(true);
      expect(prefs[NOTIFICATION_TYPES.TASK]).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark a single notification as read', () => {
      const n1 = makeNotification({ id: 'a' });
      const n2 = makeNotification({ id: 'b' });
      const state = createState([n1, n2]);
      const updated = markAsRead(state, 'a');
      expect(updated.active.find((x) => x.id === 'a').read).toBe(true);
      expect(updated.active.find((x) => x.id === 'b').read).toBe(false);
    });

    it('should mark archived notifications as read too', () => {
      const n = makeNotification({ id: 'arc1' });
      const state = createState([], [n]);
      const updated = markAsRead(state, 'arc1');
      expect(updated.archived[0].read).toBe(true);
    });

    it('should not affect other notifications', () => {
      const state = createState([makeNotification({ id: 'a' }), makeNotification({ id: 'b', read: true })]);
      const updated = markAsRead(state, 'nonexistent');
      expect(updated.active.find((x) => x.id === 'a').read).toBe(false);
      expect(updated.active.find((x) => x.id === 'b').read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all active and archived as read', () => {
      const a1 = makeNotification({ id: 'a1' });
      const a2 = makeNotification({ id: 'a2' });
      const ar1 = makeNotification({ id: 'ar1' });
      const state = createState([a1, a2], [ar1]);
      const updated = markAllAsRead(state);
      updated.active.forEach((n) => expect(n.read).toBe(true));
      updated.archived.forEach((n) => expect(n.read).toBe(true));
    });

    it('should return empty arrays unchanged', () => {
      const state = createState();
      const updated = markAllAsRead(state);
      expect(updated.active).toEqual([]);
      expect(updated.archived).toEqual([]);
    });
  });

  describe('markAllOfTypeAsRead', () => {
    it('should mark only notifications of given type as read', () => {
      const s = makeNotification({ id: 's1', type: NOTIFICATION_TYPES.SYSTEM });
      const m = makeNotification({ id: 'm1', type: NOTIFICATION_TYPES.MESSAGE });
      const state = createState([s, m]);
      const updated = markAllOfTypeAsRead(state, NOTIFICATION_TYPES.SYSTEM);
      expect(updated.active.find((x) => x.id === 's1').read).toBe(true);
      expect(updated.active.find((x) => x.id === 'm1').read).toBe(false);
    });

    it('should not affect archived notifications', () => {
      const ar = makeNotification({ id: 'ar1', type: NOTIFICATION_TYPES.SYSTEM });
      const ac = makeNotification({ id: 'ac1', type: NOTIFICATION_TYPES.SYSTEM });
      const state = createState([ac], [ar]);
      const updated = markAllOfTypeAsRead(state, NOTIFICATION_TYPES.SYSTEM);
      expect(updated.active[0].read).toBe(true);
      expect(updated.archived[0].read).toBe(false);
    });
  });

  describe('addNotification', () => {
    it('should add notification at the beginning of active list', () => {
      const existing = makeNotification({ id: 'old' });
      const state = createState([existing]);
      const newN = makeNotification({ id: 'new' });
      const updated = addNotification(state, newN);
      expect(updated.active[0].id).toBe('new');
      expect(updated.active[1].id).toBe('old');
    });

    it('should archive oldest when exceeding max active', () => {
      const max = 3;
      const state = createState([
        makeNotification({ id: 'newest' }),
        makeNotification({ id: 'middle' }),
        makeNotification({ id: 'oldest' }),
      ]);
      const newN = makeNotification({ id: 'brand-new' });
      const updated = addNotification(state, newN, max);
      expect(updated.active.length).toBe(3);
      expect(updated.active[0].id).toBe('brand-new');
      expect(updated.active.map(n => n.id)).toEqual(['brand-new', 'newest', 'middle']);
      expect(updated.archived.length).toBe(1);
      expect(updated.archived[0].id).toBe('oldest');
      expect(updated.archived[0].archived).toBe(true);
    });

    it('should archive multiple when far over limit', () => {
      const max = 2;
      const state = createState([
        makeNotification({ id: 'a' }),
        makeNotification({ id: 'b' }),
        makeNotification({ id: 'c' }),
        makeNotification({ id: 'd' }),
      ]);
      const newN = makeNotification({ id: 'e' });
      const updated = addNotification(state, newN, max);
      expect(updated.active.length).toBe(2);
      expect(updated.active.map(n => n.id)).toEqual(['e', 'a']);
      expect(updated.archived.length).toBe(3);
      expect(updated.archived.map(n => n.id)).toEqual(['b', 'c', 'd']);
    });

    it('should use MAX_ACTIVE_NOTIFICATIONS by default', () => {
      const many = [];
      for (let i = 0; i < MAX_ACTIVE_NOTIFICATIONS; i++) {
        many.push(makeNotification({ id: String(i) }));
      }
      const state = createState(many);
      const newN = makeNotification({ id: 'new-one' });
      const updated = addNotification(state, newN);
      expect(updated.active.length).toBe(MAX_ACTIVE_NOTIFICATIONS);
      expect(updated.archived.length).toBe(1);
    });
  });

  describe('groupByType', () => {
    it('should group notifications by type', () => {
      const s = makeNotification({ type: NOTIFICATION_TYPES.SYSTEM });
      const m = makeNotification({ type: NOTIFICATION_TYPES.MESSAGE });
      const t = makeNotification({ type: NOTIFICATION_TYPES.TASK });
      const groups = groupByType([s, m, t]);
      expect(groups[NOTIFICATION_TYPES.SYSTEM].length).toBe(1);
      expect(groups[NOTIFICATION_TYPES.MESSAGE].length).toBe(1);
      expect(groups[NOTIFICATION_TYPES.TASK].length).toBe(1);
    });

    it('should return empty arrays for missing types', () => {
      const groups = groupByType([]);
      expect(groups[NOTIFICATION_TYPES.SYSTEM]).toEqual([]);
      expect(groups[NOTIFICATION_TYPES.MESSAGE]).toEqual([]);
      expect(groups[NOTIFICATION_TYPES.TASK]).toEqual([]);
    });

    it('should ignore unknown types', () => {
      const unknown = makeNotification({ type: 'unknown-type' });
      const groups = groupByType([unknown]);
      const total = Object.values(groups).reduce((a, b) => a + b.length, 0);
      expect(total).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should count unread notifications', () => {
      const list = [
        makeNotification({ read: false }),
        makeNotification({ read: false }),
        makeNotification({ read: true }),
      ];
      expect(getUnreadCount(list)).toBe(2);
    });

    it('should return 0 for empty list', () => {
      expect(getUnreadCount([])).toBe(0);
    });
  });

  describe('getUnreadCountByType', () => {
    it('should count unread of specific type', () => {
      const list = [
        makeNotification({ type: NOTIFICATION_TYPES.SYSTEM, read: false }),
        makeNotification({ type: NOTIFICATION_TYPES.MESSAGE, read: false }),
        makeNotification({ type: NOTIFICATION_TYPES.SYSTEM, read: true }),
      ];
      expect(getUnreadCountByType(list, NOTIFICATION_TYPES.SYSTEM)).toBe(1);
      expect(getUnreadCountByType(list, NOTIFICATION_TYPES.MESSAGE)).toBe(1);
    });
  });

  describe('formatTime', () => {
    it('should show "刚刚" for recent timestamps', () => {
      const now = Date.now();
      expect(formatTime(now - 30_000)).toBe('刚刚');
    });

    it('should show minutes for under an hour', () => {
      const now = Date.now();
      expect(formatTime(now - 5 * 60_000)).toBe('5 分钟前');
      expect(formatTime(now - 30 * 60_000)).toBe('30 分钟前');
    });

    it('should show hours for under a day', () => {
      const now = Date.now();
      expect(formatTime(now - 3 * 3600_000)).toBe('3 小时前');
    });

    it('should show days for under a week', () => {
      const now = Date.now();
      expect(formatTime(now - 2 * 86400_000)).toBe('2 天前');
    });

    it('should show date for older than a week', () => {
      const old = new Date('2024-01-15T10:00:00Z').getTime();
      const result = formatTime(old);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('preferences helpers', () => {
    it('getEnabledTypes should return enabled type keys', () => {
      const prefs = {
        [NOTIFICATION_TYPES.SYSTEM]: true,
        [NOTIFICATION_TYPES.MESSAGE]: false,
        [NOTIFICATION_TYPES.TASK]: true,
      };
      const enabled = getEnabledTypes(prefs);
      expect(enabled).toContain(NOTIFICATION_TYPES.SYSTEM);
      expect(enabled).toContain(NOTIFICATION_TYPES.TASK);
      expect(enabled).not.toContain(NOTIFICATION_TYPES.MESSAGE);
    });

    it('pickRandomEnabledType should return null if none enabled', () => {
      const prefs = {
        [NOTIFICATION_TYPES.SYSTEM]: false,
        [NOTIFICATION_TYPES.MESSAGE]: false,
        [NOTIFICATION_TYPES.TASK]: false,
      };
      expect(pickRandomEnabledType(prefs)).toBeNull();
    });

    it('pickRandomEnabledType should return an enabled type', () => {
      const prefs = {
        [NOTIFICATION_TYPES.SYSTEM]: true,
        [NOTIFICATION_TYPES.MESSAGE]: false,
        [NOTIFICATION_TYPES.TASK]: false,
      };
      for (let i = 0; i < 10; i++) {
        expect(pickRandomEnabledType(prefs)).toBe(NOTIFICATION_TYPES.SYSTEM);
      }
    });

    it('pickRandomEnabledType should distribute across multiple enabled types', () => {
      const prefs = {
        [NOTIFICATION_TYPES.SYSTEM]: true,
        [NOTIFICATION_TYPES.MESSAGE]: true,
        [NOTIFICATION_TYPES.TASK]: true,
      };
      const seen = new Set();
      for (let i = 0; i < 100; i++) {
        seen.add(pickRandomEnabledType(prefs));
      }
      expect(seen.size).toBe(3);
    });

    it('updatePref should return new object with updated value', () => {
      const prefs = { ...DEFAULT_PREFS };
      const updated = updatePref(prefs, NOTIFICATION_TYPES.SYSTEM, false);
      expect(updated[NOTIFICATION_TYPES.SYSTEM]).toBe(false);
      expect(updated[NOTIFICATION_TYPES.MESSAGE]).toBe(true);
      expect(prefs[NOTIFICATION_TYPES.SYSTEM]).toBe(true);
    });
  });
});
