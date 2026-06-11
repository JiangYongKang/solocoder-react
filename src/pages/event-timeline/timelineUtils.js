import {
  STORAGE_KEY,
  PREFS_KEY,
  DEFAULT_EVENTS,
  DEFAULT_TAGS,
  GROUP_MODE,
  ZOOM_LEVEL,
  ZOOM_LEVEL_ORDER,
  VIEW_MODE,
} from './constants.js';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

export function compareEventsByDate(a, b) {
  if (a.date === b.date) {
    return (b.endDate || '').localeCompare(a.endDate || '');
  }
  return a.date.localeCompare(b.date);
}

export function sortEvents(events) {
  return [...events].sort(compareEventsByDate);
}

export function getDecade(dateStr) {
  const year = parseInt(dateStr.slice(0, 4), 10);
  const start = Math.floor(year / 10) * 10;
  return { start, end: start + 9, year };
}

export function getMonthKey(dateStr) {
  return dateStr.slice(0, 7);
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  return `${year}年${parseInt(month, 10)}月`;
}

export function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

export function formatDateRange(dateStr, endDateStr) {
  if (!endDateStr || endDateStr === dateStr) {
    return formatDateLabel(dateStr);
  }
  return `${formatDateLabel(dateStr)} ~ ${formatDateLabel(endDateStr)}`;
}

export function groupByDecade(events) {
  const sorted = sortEvents(events);
  const groups = {};

  for (const evt of sorted) {
    const { start, end } = getDecade(evt.date);
    const key = `${start}-${end}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        label: `${start}-${end}`,
        startYear: start,
        endYear: end,
        events: [],
        yearGroups: {},
      };
    }
    const year = evt.date.slice(0, 4);
    if (!groups[key].yearGroups[year]) {
      groups[key].yearGroups[year] = [];
    }
    groups[key].yearGroups[year].push(evt);
    groups[key].events.push(evt);
  }

  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  return keys.map((k) => groups[k]);
}

export function groupByMonth(events) {
  const sorted = sortEvents(events);
  const groups = {};

  for (const evt of sorted) {
    const monthKey = getMonthKey(evt.date);
    if (!groups[monthKey]) {
      groups[monthKey] = {
        key: monthKey,
        label: formatMonthLabel(monthKey),
        events: [],
        dayGroups: {},
      };
    }
    const day = evt.date.slice(8, 10);
    if (!groups[monthKey].dayGroups[day]) {
      groups[monthKey].dayGroups[day] = [];
    }
    groups[monthKey].dayGroups[day].push(evt);
    groups[monthKey].events.push(evt);
  }

  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  return keys.map((k) => groups[k]);
}

export function groupEvents(events, mode) {
  if (mode === GROUP_MODE.DECADE) {
    return groupByDecade(events);
  }
  return groupByMonth(events);
}

export function collectAllTags(events) {
  const set = new Set();
  for (const evt of events) {
    if (Array.isArray(evt.tags)) {
      for (const t of evt.tags) {
        set.add(t);
      }
    }
  }
  const all = [...set];
  all.sort();
  return all;
}

export function collectAllTagsWithDefaults(events, defaults = DEFAULT_TAGS) {
  const collected = collectAllTags(events);
  const merged = new Set([...defaults, ...collected]);
  return [...merged].sort();
}

export function filterByTags(events, selectedTags) {
  if (!selectedTags || selectedTags.length === 0) return events;
  return events.filter((evt) => {
    if (!Array.isArray(evt.tags) || evt.tags.length === 0) return false;
    return selectedTags.some((t) => evt.tags.includes(t));
  });
}

export function filterBySearch(events, query) {
  if (!query) return events;
  const lower = query.trim().toLowerCase();
  if (!lower) return events;
  return events.filter((evt) => {
    const title = (evt.title || '').toLowerCase();
    const desc = (evt.description || '').toLowerCase();
    return title.includes(lower) || desc.includes(lower);
  });
}

export function applyFilters(events, { selectedTags = [], searchQuery = '' } = {}) {
  let result = filterBySearch(events, searchQuery);
  result = filterByTags(result, selectedTags);
  return result;
}

export function matchSearchHighlight(event, query) {
  if (!query) return false;
  const lower = query.trim().toLowerCase();
  if (!lower) return false;
  const title = (event.title || '').toLowerCase();
  const desc = (event.description || '').toLowerCase();
  return title.includes(lower) || desc.includes(lower);
}

export function createEvent(payload) {
  return {
    id: generateId(),
    title: (payload.title || '').trim(),
    date: payload.date || '',
    endDate: payload.endDate || null,
    description: (payload.description || '').trim(),
    tags: Array.isArray(payload.tags) ? [...payload.tags] : [],
    icon: payload.icon || '📅',
  };
}

export function addEvent(events, payload) {
  const newEvent = createEvent(payload);
  return [...events, newEvent];
}

export function updateEvent(events, eventId, updates) {
  return events.map((evt) => {
    if (evt.id !== eventId) return evt;
    const next = { ...evt };
    if ('title' in updates) next.title = (updates.title || '').trim();
    if ('date' in updates) next.date = updates.date || '';
    if ('endDate' in updates) next.endDate = updates.endDate || null;
    if ('description' in updates) next.description = (updates.description || '').trim();
    if ('tags' in updates) next.tags = Array.isArray(updates.tags) ? [...updates.tags] : [];
    if ('icon' in updates) next.icon = updates.icon || '📅';
    return next;
  });
}

export function deleteEvent(events, eventId) {
  return events.filter((evt) => evt.id !== eventId);
}

export function findEvent(events, eventId) {
  return events.find((evt) => evt.id === eventId) || null;
}

export function validateEvent(payload) {
  const errors = {};
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: { payload: 'invalid' } };
  }
  if (!payload.title || typeof payload.title !== 'string' || !payload.title.trim()) {
    errors.title = '标题不能为空';
  }
  if (!payload.date || !isValidDateString(payload.date)) {
    errors.date = '请选择有效的日期';
  }
  if (payload.endDate && !isValidDateString(payload.endDate)) {
    errors.endDate = '结束日期格式无效';
  }
  if (payload.endDate && payload.date && isValidDateString(payload.date) && isValidDateString(payload.endDate)) {
    if (payload.endDate < payload.date) {
      errors.endDate = '结束日期不能早于开始日期';
    }
  }
  if (payload.tags && !Array.isArray(payload.tags)) {
    errors.tags = '标签格式无效';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function getDateRangeFromZoom(events, zoomLevel) {
  if (!events || events.length === 0) {
    const today = new Date();
    const y = today.getFullYear();
    return {
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`,
    };
  }
  const sorted = sortEvents(events);
  let min = sorted[0].date;
  let max = sorted[sorted.length - 1].date;
  for (const evt of sorted) {
    if (evt.endDate && evt.endDate > max) max = evt.endDate;
  }

  const pad = (str, amount, unit) => {
    const d = new Date(str);
    if (unit === 'year') d.setFullYear(d.getFullYear() + amount);
    if (unit === 'month') d.setMonth(d.getMonth() + amount);
    if (unit === 'day') d.setDate(d.getDate() + amount);
    return d.toISOString().slice(0, 10);
  };

  let startStr = min;
  let endStr = max;

  if (zoomLevel === ZOOM_LEVEL.YEAR) {
    startStr = pad(min, -1, 'year');
    endStr = pad(max, 1, 'year');
  } else if (zoomLevel === ZOOM_LEVEL.QUARTER) {
    startStr = pad(min, -3, 'month');
    endStr = pad(max, 3, 'month');
  } else if (zoomLevel === ZOOM_LEVEL.MONTH) {
    startStr = pad(min, -1, 'month');
    endStr = pad(max, 1, 'month');
  } else if (zoomLevel === ZOOM_LEVEL.WEEK) {
    startStr = pad(min, -7, 'day');
    endStr = pad(max, 7, 'day');
  }

  return { startDate: startStr, endDate: endStr };
}

export function formatRangeLabel(range) {
  if (!range) return '';
  return `${formatDateLabel(range.startDate)} ~ ${formatDateLabel(range.endDate)}`;
}

export function getSortForCardView(events) {
  return [...events].sort((a, b) => b.date.localeCompare(a.date));
}

export function loadEvents(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return [...DEFAULT_EVENTS];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = [...DEFAULT_EVENTS];
      saveEvents(defaults, storage);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_EVENTS];
    return parsed.filter((evt) => evt && typeof evt === 'object' && evt.id);
  } catch {
    return [...DEFAULT_EVENTS];
  }
}

export function saveEvents(events, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore storage errors
  }
}

const DEFAULT_PREFS = {
  viewMode: VIEW_MODE.TIMELINE,
  groupMode: GROUP_MODE.DECADE,
  zoomLevel: ZOOM_LEVEL.MONTH,
};

export function loadPrefs(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { ...DEFAULT_PREFS };
  try {
    const raw = storage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    const result = { ...DEFAULT_PREFS };
    if (parsed.viewMode && Object.values(VIEW_MODE).includes(parsed.viewMode)) {
      result.viewMode = parsed.viewMode;
    }
    if (parsed.groupMode && Object.values(GROUP_MODE).includes(parsed.groupMode)) {
      result.groupMode = parsed.groupMode;
    }
    if (parsed.zoomLevel && Object.values(ZOOM_LEVEL).includes(parsed.zoomLevel)) {
      result.zoomLevel = parsed.zoomLevel;
    }
    return result;
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function getYearFromDate(dateStr) {
  return parseInt(dateStr.slice(0, 4), 10);
}

export function getMonthNumber(dateStr) {
  return parseInt(dateStr.slice(5, 7), 10);
}

export function getDayNumber(dateStr) {
  return parseInt(dateStr.slice(8, 10), 10);
}

export function getQuarter(dateStr) {
  const month = getMonthNumber(dateStr);
  return Math.ceil(month / 3);
}

export function getZoomIndex(zoomLevel, order = ZOOM_LEVEL_ORDER) {
  const idx = order.indexOf(zoomLevel);
  return idx === -1 ? 2 : idx;
}

export function getZoomLevelFromIndex(index, order = ZOOM_LEVEL_ORDER) {
  const safeIndex = Math.max(0, Math.min(index, order.length - 1));
  return order[safeIndex];
}

export function formatDayLabelWithMonth(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

export function groupByQuarter(events) {
  const sorted = sortEvents(events);
  const groups = {};

  for (const evt of sorted) {
    const year = evt.date.slice(0, 4);
    const quarter = getQuarter(evt.date);
    const key = `${year}-Q${quarter}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        label: `${year}年 Q${quarter}`,
        year: parseInt(year, 10),
        quarter,
        events: [],
        monthGroups: {},
      };
    }
    const month = evt.date.slice(5, 7);
    if (!groups[key].monthGroups[month]) {
      groups[key].monthGroups[month] = [];
    }
    groups[key].monthGroups[month].push(evt);
    groups[key].events.push(evt);
  }

  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  return keys.map((k) => groups[k]);
}

export function groupByWeek(events) {
  const sorted = sortEvents(events);
  const groups = {};

  for (const evt of sorted) {
    const d = new Date(evt.date.slice(0, 4), parseInt(evt.date.slice(5, 7), 10) - 1, parseInt(evt.date.slice(8, 10), 10));
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const weekStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!groups[weekStart]) {
      groups[weekStart] = {
        key: weekStart,
        label: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周`,
        weekStart,
        events: [],
        dayGroups: {},
      };
    }
    const dayKey = evt.date.slice(8, 10);
    if (!groups[weekStart].dayGroups[dayKey]) {
      groups[weekStart].dayGroups[dayKey] = [];
    }
    groups[weekStart].dayGroups[dayKey].push(evt);
    groups[weekStart].events.push(evt);
  }

  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  return keys.map((k) => groups[k]);
}

export function getGroupingForZoom(groupMode, zoomLevel) {
  if (groupMode === GROUP_MODE.DECADE) {
    if (zoomLevel === ZOOM_LEVEL.YEAR) return 'decade';
    if (zoomLevel === ZOOM_LEVEL.QUARTER) return 'decade';
    if (zoomLevel === ZOOM_LEVEL.MONTH) return 'decade';
    return 'decade';
  }
  if (zoomLevel === ZOOM_LEVEL.YEAR) return 'year';
  if (zoomLevel === ZOOM_LEVEL.QUARTER) return 'quarter';
  if (zoomLevel === ZOOM_LEVEL.MONTH) return 'month';
  return 'week';
}

export function groupEventsByZoom(events, groupMode, zoomLevel) {
  const grouping = getGroupingForZoom(groupMode, zoomLevel);

  if (grouping === 'decade') {
    return groupByDecade(events).map((g) => ({
      ...g,
      level: 'decade',
      subLevel: 'year',
    }));
  }

  if (grouping === 'year') {
    const yearGroups = {};
    const sorted = sortEvents(events);
    for (const evt of sorted) {
      const year = evt.date.slice(0, 4);
      if (!yearGroups[year]) {
        yearGroups[year] = {
          key: year,
          label: `${year}年`,
          year: parseInt(year, 10),
          events: [],
          monthGroups: {},
          level: 'year',
          subLevel: 'month',
        };
      }
      const month = evt.date.slice(5, 7);
      if (!yearGroups[year].monthGroups[month]) {
        yearGroups[year].monthGroups[month] = [];
      }
      yearGroups[year].monthGroups[month].push(evt);
      yearGroups[year].events.push(evt);
    }
    return Object.keys(yearGroups).sort((a, b) => b.localeCompare(a)).map((k) => yearGroups[k]);
  }

  if (grouping === 'quarter') {
    return groupByQuarter(events).map((g) => ({
      ...g,
      level: 'quarter',
      subLevel: 'month',
    }));
  }

  if (grouping === 'week') {
    return groupByWeek(events).map((g) => ({
      ...g,
      level: 'week',
      subLevel: 'day',
    }));
  }

  return groupByMonth(events).map((g) => ({
    ...g,
    level: 'month',
    subLevel: 'day',
  }));
}

export function getZoomDensity(zoomLevel) {
  const densities = {
    [ZOOM_LEVEL.YEAR]: { spacing: 'compact', detail: 'low', yearGap: 8, dayGap: 4 },
    [ZOOM_LEVEL.QUARTER]: { spacing: 'semi-compact', detail: 'medium-low', yearGap: 16, dayGap: 8 },
    [ZOOM_LEVEL.MONTH]: { spacing: 'normal', detail: 'medium', yearGap: 28, dayGap: 14 },
    [ZOOM_LEVEL.WEEK]: { spacing: 'expanded', detail: 'high', yearGap: 48, dayGap: 24 },
  };
  return densities[zoomLevel] || densities[ZOOM_LEVEL.MONTH];
}
