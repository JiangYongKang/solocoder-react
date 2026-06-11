import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  isValidDateString,
  compareEventsByDate,
  sortEvents,
  getDecade,
  getMonthKey,
  formatMonthLabel,
  formatDateLabel,
  formatDateRange,
  groupByDecade,
  groupByMonth,
  groupEvents,
  collectAllTags,
  collectAllTagsWithDefaults,
  filterByTags,
  filterBySearch,
  applyFilters,
  matchSearchHighlight,
  createEvent,
  addEvent,
  updateEvent,
  deleteEvent,
  findEvent,
  validateEvent,
  getDateRangeFromZoom,
  formatRangeLabel,
  getSortForCardView,
  loadEvents,
  saveEvents,
  loadPrefs,
  savePrefs,
  getYearFromDate,
  getMonthNumber,
  getDayNumber,
} from '@/pages/event-timeline/timelineUtils.js';
import {
  STORAGE_KEY,
  PREFS_KEY,
  GROUP_MODE,
  ZOOM_LEVEL,
  VIEW_MODE,
  DEFAULT_TAGS,
  DEFAULT_EVENTS,
} from '@/pages/event-timeline/constants.js';

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

const sampleEvents = [
  { id: 'e1', title: '2024事件', date: '2024-05-01', endDate: '2024-05-03', description: 'desc1', tags: ['工作'], icon: '💼' },
  { id: 'e2', title: '2023事件', date: '2023-11-20', endDate: null, description: 'desc2', tags: ['学习'], icon: '📚' },
  { id: 'e3', title: '2020事件', date: '2020-02-10', endDate: null, description: 'desc3', tags: ['个人', '旅行'], icon: '✈️' },
  { id: 'e4', title: '2024另一件', date: '2024-05-01', endDate: null, description: '另一个', tags: [], icon: '🎉' },
  { id: 'e5', title: '2015事件', date: '2015-06-01', endDate: null, description: 'old event', tags: ['个人'], icon: '📅' },
];

describe('timelineUtils', () => {
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

  describe('isValidDateString', () => {
    it('should accept valid YYYY-MM-DD dates', () => {
      expect(isValidDateString('2024-01-15')).toBe(true);
      expect(isValidDateString('2020-12-31')).toBe(true);
      expect(isValidDateString('1999-06-01')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidDateString('2024/01/15')).toBe(false);
      expect(isValidDateString('01-15-2024')).toBe(false);
      expect(isValidDateString('2024-1-15')).toBe(false);
      expect(isValidDateString('2024-13-01')).toBe(false);
      expect(isValidDateString('2024-02-30')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString(undefined)).toBe(false);
      expect(isValidDateString(123)).toBe(false);
      expect(isValidDateString({})).toBe(false);
    });
  });

  describe('compareEventsByDate', () => {
    it('should compare primary by date ascending', () => {
      const a = { date: '2024-01-01' };
      const b = { date: '2023-01-01' };
      expect(compareEventsByDate(a, b)).toBeGreaterThan(0);
      expect(compareEventsByDate(b, a)).toBeLessThan(0);
    });

    it('should compare by endDate descending when dates equal', () => {
      const a = { date: '2024-01-01', endDate: '2024-01-10' };
      const b = { date: '2024-01-01', endDate: null };
      expect(compareEventsByDate(a, b)).toBeLessThan(0);
      expect(compareEventsByDate(b, a)).toBeGreaterThan(0);
    });
  });

  describe('sortEvents', () => {
    it('should sort events by date (oldest first)', () => {
      const sorted = sortEvents(sampleEvents);
      expect(sorted.map((e) => e.id)).toEqual(['e5', 'e3', 'e2', 'e1', 'e4']);
    });

    it('should not mutate original array', () => {
      const original = [...sampleEvents];
      sortEvents(sampleEvents);
      expect(sampleEvents).toEqual(original);
    });
  });

  describe('getDecade', () => {
    it('should return correct decade info', () => {
      expect(getDecade('2024-05-01')).toEqual({ start: 2020, end: 2029, year: 2024 });
      expect(getDecade('1995-01-01')).toEqual({ start: 1990, end: 1999, year: 1995 });
      expect(getDecade('2030-12-31')).toEqual({ start: 2030, end: 2039, year: 2030 });
    });
  });

  describe('getMonthKey', () => {
    it('should extract YYYY-MM from date string', () => {
      expect(getMonthKey('2024-05-01')).toBe('2024-05');
      expect(getMonthKey('2023-12-31')).toBe('2023-12');
    });
  });

  describe('formatMonthLabel', () => {
    it('should format month key to Chinese label', () => {
      expect(formatMonthLabel('2024-05')).toBe('2024年5月');
      expect(formatMonthLabel('2023-12')).toBe('2023年12月');
      expect(formatMonthLabel('2024-01')).toBe('2024年1月');
    });
  });

  describe('formatDateLabel', () => {
    it('should format date to Chinese label', () => {
      expect(formatDateLabel('2024-05-01')).toBe('2024年5月1日');
      expect(formatDateLabel('2023-12-31')).toBe('2023年12月31日');
      expect(formatDateLabel('')).toBe('');
    });
  });

  describe('formatDateRange', () => {
    it('should show single date when endDate missing or same', () => {
      expect(formatDateRange('2024-05-01', null)).toBe('2024年5月1日');
      expect(formatDateRange('2024-05-01', '2024-05-01')).toBe('2024年5月1日');
    });

    it('should show range when endDate different', () => {
      expect(formatDateRange('2024-05-01', '2024-05-07')).toBe('2024年5月1日 ~ 2024年5月7日');
    });
  });

  describe('groupByDecade', () => {
    it('should group events by decade descending', () => {
      const groups = groupByDecade(sampleEvents);
      expect(groups.length).toBe(2);
      expect(groups[0].label).toBe('2020-2029');
      expect(groups[0].events.length).toBe(4);
      expect(Object.keys(groups[0].yearGroups).sort()).toEqual(['2020', '2023', '2024']);
      expect(groups[0].yearGroups['2020'].length).toBe(1);
      expect(groups[0].yearGroups['2024'].length).toBe(2);
      expect(groups[1].label).toBe('2010-2019');
      expect(groups[1].events.length).toBe(1);
    });
  });

  describe('groupByMonth', () => {
    it('should group events by month descending', () => {
      const groups = groupByMonth(sampleEvents);
      expect(groups[0].label).toBe('2024年5月');
      expect(groups[0].events.length).toBe(2);
      expect(Object.keys(groups[0].dayGroups)).toContain('01');
    });
  });

  describe('groupEvents', () => {
    it('should call correct grouping function based on mode', () => {
      const decadeGroups = groupEvents(sampleEvents, GROUP_MODE.DECADE);
      const monthGroups = groupEvents(sampleEvents, GROUP_MODE.MONTH);
      expect(decadeGroups[0].label).toContain('-');
      expect(monthGroups[0].label).toContain('年');
    });
  });

  describe('collectAllTags', () => {
    it('should collect unique tags sorted', () => {
      const tags = collectAllTags(sampleEvents);
      expect(tags).toEqual(['个人', '学习', '工作', '旅行']);
    });

    it('should return empty array for no events', () => {
      expect(collectAllTags([])).toEqual([]);
    });

    it('should skip events with non-array tags', () => {
      const evts = [{ id: '1', tags: null }, { id: '2', tags: 'notarray' }, { id: '3', tags: ['ok'] }];
      expect(collectAllTags(evts)).toEqual(['ok']);
    });
  });

  describe('collectAllTagsWithDefaults', () => {
    it('should merge defaults with collected tags', () => {
      const result = collectAllTagsWithDefaults([{ id: '1', tags: ['新增'] }], ['默认1']);
      expect(result).toContain('默认1');
      expect(result).toContain('新增');
    });

    it('should use DEFAULT_TAGS when defaults not provided', () => {
      const result = collectAllTagsWithDefaults([]);
      expect(result).toEqual([...DEFAULT_TAGS].sort());
    });
  });

  describe('filterByTags', () => {
    it('should return all when no selected tags', () => {
      expect(filterByTags(sampleEvents, [])).toHaveLength(sampleEvents.length);
      expect(filterByTags(sampleEvents, null)).toHaveLength(sampleEvents.length);
    });

    it('should filter events with any of selected tags (OR)', () => {
      const filtered = filterByTags(sampleEvents, ['工作', '学习']);
      const ids = filtered.map((e) => e.id);
      expect(ids).toContain('e1');
      expect(ids).toContain('e2');
      expect(ids).not.toContain('e3');
      expect(ids).not.toContain('e4');
    });

    it('should exclude events with empty tags', () => {
      const filtered = filterByTags(sampleEvents, ['工作']);
      expect(filtered.map((e) => e.id)).toEqual(['e1']);
    });
  });

  describe('filterBySearch', () => {
    it('should return all when query empty', () => {
      expect(filterBySearch(sampleEvents, '')).toHaveLength(sampleEvents.length);
      expect(filterBySearch(sampleEvents, '   ')).toHaveLength(sampleEvents.length);
      expect(filterBySearch(sampleEvents, null)).toHaveLength(sampleEvents.length);
    });

    it('should do case-insensitive search in title and description', () => {
      const byTitle = filterBySearch(sampleEvents, '2024');
      expect(byTitle.length).toBe(2);

      const byDesc = filterBySearch(sampleEvents, '另一个');
      expect(byDesc.map((e) => e.id)).toEqual(['e4']);

      const caseInsensitive = filterBySearch(sampleEvents, 'DESC');
      expect(caseInsensitive.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('applyFilters', () => {
    it('should combine search and tag filters', () => {
      const result = applyFilters(sampleEvents, { selectedTags: ['工作'], searchQuery: '2024' });
      expect(result.map((e) => e.id)).toEqual(['e1']);
    });
  });

  describe('matchSearchHighlight', () => {
    it('should return true when query matches', () => {
      expect(matchSearchHighlight(sampleEvents[0], '2024')).toBe(true);
      expect(matchSearchHighlight(sampleEvents[0], 'DESC')).toBe(true);
    });

    it('should return false when no match or empty query', () => {
      expect(matchSearchHighlight(sampleEvents[0], '')).toBe(false);
      expect(matchSearchHighlight(sampleEvents[0], '不存在')).toBe(false);
    });
  });

  describe('createEvent', () => {
    it('should create event with generated id and defaults', () => {
      const evt = createEvent({ title: '  测试  ', date: '2024-01-01' });
      expect(evt.id).toBeTruthy();
      expect(evt.title).toBe('测试');
      expect(evt.date).toBe('2024-01-01');
      expect(evt.endDate).toBeNull();
      expect(evt.description).toBe('');
      expect(evt.tags).toEqual([]);
      expect(evt.icon).toBe('📅');
    });

    it('should copy all provided fields', () => {
      const evt = createEvent({
        title: '完整',
        date: '2024-06-01',
        endDate: '2024-06-07',
        description: ' 描述文本 ',
        tags: ['工作'],
        icon: '🎉',
      });
      expect(evt.title).toBe('完整');
      expect(evt.endDate).toBe('2024-06-07');
      expect(evt.description).toBe('描述文本');
      expect(evt.tags).toEqual(['工作']);
      expect(evt.icon).toBe('🎉');
    });
  });

  describe('addEvent', () => {
    it('should append event with generated id', () => {
      const result = addEvent([], { title: '新增', date: '2024-01-01' });
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('新增');
      expect(result[0].id).toBeTruthy();
    });

    it('should not mutate original array', () => {
      const original = [...sampleEvents];
      addEvent(sampleEvents, { title: '新', date: '2024-01-01' });
      expect(sampleEvents).toEqual(original);
    });
  });

  describe('updateEvent', () => {
    it('should update specific event by id', () => {
      const updated = updateEvent(sampleEvents, 'e1', { title: '新标题', description: '新描述' });
      const e1 = updated.find((e) => e.id === 'e1');
      expect(e1.title).toBe('新标题');
      expect(e1.description).toBe('新描述');
      expect(e1.date).toBe('2024-05-01');
    });

    it('should not affect other events', () => {
      const updated = updateEvent(sampleEvents, 'e1', { title: '改了' });
      expect(updated.find((e) => e.id === 'e2').title).toBe('2023事件');
    });

    it('should return array with same order when event not found', () => {
      const updated = updateEvent(sampleEvents, 'nonexistent', { title: 'x' });
      expect(updated).toEqual(sampleEvents);
    });
  });

  describe('deleteEvent', () => {
    it('should remove event by id', () => {
      const result = deleteEvent(sampleEvents, 'e1');
      expect(result.length).toBe(sampleEvents.length - 1);
      expect(result.find((e) => e.id === 'e1')).toBeUndefined();
    });

    it('should do nothing for non-existent id', () => {
      const result = deleteEvent(sampleEvents, 'nope');
      expect(result.length).toBe(sampleEvents.length);
    });
  });

  describe('findEvent', () => {
    it('should find event by id', () => {
      const evt = findEvent(sampleEvents, 'e2');
      expect(evt).toBeTruthy();
      expect(evt.title).toBe('2023事件');
    });

    it('should return null for not found', () => {
      expect(findEvent(sampleEvents, 'nope')).toBeNull();
    });
  });

  describe('validateEvent', () => {
    it('should mark empty title as invalid', () => {
      expect(validateEvent({ title: '', date: '2024-01-01' }).valid).toBe(false);
      expect(validateEvent({ title: '   ', date: '2024-01-01' }).valid).toBe(false);
    });

    it('should mark missing/invalid date as invalid', () => {
      expect(validateEvent({ title: 'ok', date: '' }).valid).toBe(false);
      expect(validateEvent({ title: 'ok', date: '2024/01/01' }).valid).toBe(false);
    });

    it('should mark endDate earlier than startDate as invalid', () => {
      const r = validateEvent({ title: 'ok', date: '2024-05-01', endDate: '2024-04-01' });
      expect(r.valid).toBe(false);
      expect(r.errors.endDate).toBeTruthy();
    });

    it('should accept valid event', () => {
      expect(validateEvent({ title: '有效', date: '2024-01-01' }).valid).toBe(true);
      expect(validateEvent({
        title: '有结束', date: '2024-01-01', endDate: '2024-01-10',
        tags: ['ok'],
      }).valid).toBe(true);
    });

    it('should reject non-object/null payload', () => {
      expect(validateEvent(null).valid).toBe(false);
      expect(validateEvent(undefined).valid).toBe(false);
    });
  });

  describe('getDateRangeFromZoom', () => {
    it('should return current year range when no events', () => {
      const range = getDateRangeFromZoom([], ZOOM_LEVEL.YEAR);
      expect(range.startDate).toMatch(/^\d{4}-01-01$/);
      expect(range.endDate).toMatch(/^\d{4}-12-31$/);
    });

    it('should pad range based on zoom level', () => {
      const evts = [{ id: '1', date: '2024-06-01', endDate: '2024-06-10' }];
      const yearRange = getDateRangeFromZoom(evts, ZOOM_LEVEL.YEAR);
      expect(yearRange.startDate).toBe('2023-06-01');
      expect(yearRange.endDate).toBe('2025-06-10');

      const weekRange = getDateRangeFromZoom(evts, ZOOM_LEVEL.WEEK);
      expect(weekRange.startDate).toBe('2024-05-25');
      expect(weekRange.endDate).toBe('2024-06-17');
    });
  });

  describe('formatRangeLabel', () => {
    it('should format range with tilde', () => {
      const label = formatRangeLabel({ startDate: '2024-01-01', endDate: '2024-12-31' });
      expect(label).toContain(' ~ ');
      expect(label).toContain('2024年1月1日');
    });
  });

  describe('getSortForCardView', () => {
    it('should sort by date descending (newest first)', () => {
      const sorted = getSortForCardView(sampleEvents);
      const first = sorted[0].date;
      const last = sorted[sorted.length - 1].date;
      expect(first.localeCompare(last)).toBeGreaterThan(0);
    });
  });

  describe('localStorage event persistence', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('loadEvents should return defaults and save them when storage empty', () => {
      const events = loadEvents(storage);
      expect(events.length).toBe(DEFAULT_EVENTS.length);
      expect(storage.getItem(STORAGE_KEY)).toBeTruthy();
    });

    it('saveEvents and loadEvents should round-trip correctly', () => {
      const testData = [{ id: 't1', title: '持久化测试', date: '2024-01-01' }];
      saveEvents(testData, storage);
      const loaded = loadEvents(storage);
      expect(loaded.length).toBe(1);
      expect(loaded[0].title).toBe('持久化测试');
    });

    it('loadEvents should handle corrupted JSON gracefully', () => {
      storage.setItem(STORAGE_KEY, '{bad json');
      const events = loadEvents(storage);
      expect(Array.isArray(events)).toBe(true);
    });

    it('loadEvents should filter out invalid items', () => {
      storage.setItem(STORAGE_KEY, JSON.stringify([
        { id: 'ok', title: 'ok', date: '2024-01-01' },
        null,
        'not object',
        { notId: 'missing' },
      ]));
      const events = loadEvents(storage);
      expect(events.length).toBe(1);
    });

    it('should not throw when storage unavailable', () => {
      expect(() => loadEvents(null)).not.toThrow();
      expect(() => saveEvents([], null)).not.toThrow();
    });
  });

  describe('localStorage preferences persistence', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('loadPrefs should return defaults when storage empty', () => {
      const prefs = loadPrefs(storage);
      expect(prefs.viewMode).toBe(VIEW_MODE.TIMELINE);
      expect(prefs.groupMode).toBe(GROUP_MODE.DECADE);
      expect(prefs.zoomLevel).toBe(ZOOM_LEVEL.MONTH);
    });

    it('savePrefs and loadPrefs should round-trip', () => {
      const testPrefs = {
        viewMode: VIEW_MODE.CARD,
        groupMode: GROUP_MODE.MONTH,
        zoomLevel: ZOOM_LEVEL.WEEK,
      };
      savePrefs(testPrefs, storage);
      const loaded = loadPrefs(storage);
      expect(loaded).toEqual(testPrefs);
    });

    it('loadPrefs should ignore invalid values and keep defaults', () => {
      storage.setItem(PREFS_KEY, JSON.stringify({
        viewMode: 'invalid',
        groupMode: 123,
        zoomLevel: null,
      }));
      const prefs = loadPrefs(storage);
      expect(prefs.viewMode).toBe(VIEW_MODE.TIMELINE);
      expect(prefs.groupMode).toBe(GROUP_MODE.DECADE);
      expect(prefs.zoomLevel).toBe(ZOOM_LEVEL.MONTH);
    });

    it('should not throw when storage unavailable', () => {
      expect(() => loadPrefs(null)).not.toThrow();
      expect(() => savePrefs({}, null)).not.toThrow();
    });
  });

  describe('date parts extraction', () => {
    it('getYearFromDate', () => {
      expect(getYearFromDate('2024-05-01')).toBe(2024);
    });

    it('getMonthNumber', () => {
      expect(getMonthNumber('2024-05-01')).toBe(5);
      expect(getMonthNumber('2024-12-31')).toBe(12);
    });

    it('getDayNumber', () => {
      expect(getDayNumber('2024-05-01')).toBe(1);
      expect(getDayNumber('2024-05-31')).toBe(31);
    });
  });
});
