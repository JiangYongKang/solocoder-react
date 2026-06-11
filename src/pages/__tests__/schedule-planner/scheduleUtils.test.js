import {
    addClassroom,
    addCourse,
    addTeacher,
    buildScheduleGrid,
    canPlaceCourseAt,
    checkPlacementConflict,
    createDefaultState,
    deleteCourse,
    detectAllConflicts,
    exportToJSON,
    findCourse,
    formatScheduleRange,
    generateId,
    getColorByIndex,
    getColorBySubjectId,
    getCurrentDayIndex,
    getCurrentTimeSlotIndex,
    getDefaultClassrooms,
    getDefaultCourses,
    getDefaultTeachers,
    getOccupiedSlots,
    getScheduledCourses,
    getUnscheduledCourses,
    importFromJSON,
    isWeekend,
    isWeekTypeCompatible,
    loadState,
    normalizeCourse,
    normalizeScheduled,
    saveState,
    scheduleCourse,
    SUBJECT_COLORS,
    TIME_SLOTS,
    TOTAL_SLOTS,
    unscheduleCourse,
    updateCourse,
    validateAndNormalizeState,
    validateCourse,
    WEEK_DAYS,
    WEEKEND_INDICES
} from '@/pages/schedule-planner/scheduleUtils.js';
import { beforeEach, describe, expect, it } from 'vitest';

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

function createTestState() {
  return {
    courses: [
      {
        id: 'course-1',
        name: '测试数学',
        teacher: '张老师',
        classroom: '教室A',
        duration: 2,
        credits: 4,
        subjectColorId: 'math',
        notes: '测试备注',
        scheduled: null,
      },
      {
        id: 'course-2',
        name: '测试英语',
        teacher: '李老师',
        classroom: '教室B',
        duration: 2,
        credits: 3,
        subjectColorId: 'english',
        notes: '',
        scheduled: null,
      },
      {
        id: 'course-3',
        name: '测试物理',
        teacher: '王老师',
        classroom: '教室A',
        duration: 2,
        credits: 4,
        subjectColorId: 'physics',
        notes: '',
        scheduled: { dayIndex: 0, slotIndex: 0, weekType: 'all' },
      },
    ],
    classrooms: ['教室A', '教室B', '教室C'],
    teachers: ['张老师', '李老师', '王老师'],
  };
}

describe('scheduleUtils', () => {
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

  describe('color functions', () => {
    it('getColorByIndex should cycle through colors', () => {
      const c0 = getColorByIndex(0);
      const c1 = getColorByIndex(1);
      expect(c0).toBe(SUBJECT_COLORS[0]);
      expect(c1).toBe(SUBJECT_COLORS[1]);
      expect(getColorByIndex(SUBJECT_COLORS.length)).toBe(SUBJECT_COLORS[0]);
    });

    it('getColorBySubjectId should find matching color', () => {
      expect(getColorBySubjectId('math')).toBe(SUBJECT_COLORS[0]);
      expect(getColorBySubjectId('nonexistent')).toBe(SUBJECT_COLORS[0]);
    });
  });

  describe('default data factories', () => {
    it('getDefaultCourses should return array with courses', () => {
      const courses = getDefaultCourses();
      expect(Array.isArray(courses)).toBe(true);
      expect(courses.length).toBeGreaterThan(0);
      courses.forEach((c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.duration).toBeGreaterThan(0);
      });
    });

    it('getDefaultClassrooms should return non-empty array', () => {
      expect(Array.isArray(getDefaultClassrooms())).toBe(true);
      expect(getDefaultClassrooms().length).toBeGreaterThan(0);
    });

    it('getDefaultTeachers should return non-empty array', () => {
      expect(Array.isArray(getDefaultTeachers())).toBe(true);
      expect(getDefaultTeachers().length).toBeGreaterThan(0);
    });

    it('createDefaultState should return valid state object', () => {
      const state = createDefaultState();
      expect(state).toHaveProperty('courses');
      expect(state).toHaveProperty('classrooms');
      expect(state).toHaveProperty('teachers');
    });
  });

  describe('localStorage persistence', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('loadState should return defaults and persist when storage empty', () => {
      const state = loadState(storage);
      expect(state.courses.length).toBeGreaterThan(0);
      expect(storage.getItem('schedule_planner_data')).toBeTruthy();
    });

    it('saveState and loadState should round-trip', () => {
      const state = createTestState();
      saveState(state, storage);
      const loaded = loadState(storage);
      expect(loaded.courses.length).toBe(state.courses.length);
      expect(loaded.courses[0].name).toBe('测试数学');
    });

    it('loadState should handle corrupted JSON', () => {
      storage.setItem('schedule_planner_data', '{invalid');
      const state = loadState(storage);
      expect(Array.isArray(state.courses)).toBe(true);
    });

    it('should not throw when storage unavailable', () => {
      expect(() => loadState(null)).not.toThrow();
      expect(() => saveState(createTestState(), null)).not.toThrow();
    });
  });

  describe('normalize functions', () => {
    it('normalizeScheduled should handle valid data', () => {
      expect(normalizeScheduled({ dayIndex: 1, slotIndex: 2, weekType: 'odd' })).toEqual({
        dayIndex: 1,
        slotIndex: 2,
        weekType: 'odd',
      });
    });

    it('normalizeScheduled should clamp out of range values', () => {
      const r = normalizeScheduled({ dayIndex: -1, slotIndex: 999 });
      expect(r.dayIndex).toBe(0);
      expect(r.slotIndex).toBe(TOTAL_SLOTS - 1);
      expect(r.weekType).toBe('all');
    });

    it('normalizeScheduled should return null for invalid', () => {
      expect(normalizeScheduled(null)).toBeNull();
      expect(normalizeScheduled({})).toBeNull();
      expect(normalizeScheduled({ dayIndex: 0 })).toBeNull();
    });

    it('normalizeCourse should handle valid course', () => {
      const c = normalizeCourse({
        id: 'test-1',
        name: '  物理  ',
        teacher: '王老师',
        classroom: '101教室',
        duration: 2,
        credits: 3,
        subjectColorId: 'physics',
        notes: 'note',
        scheduled: { dayIndex: 1, slotIndex: 2 },
      });
      expect(c.id).toBe('test-1');
      expect(c.name).toBe('物理');
      expect(c.teacher).toBe('王老师');
      expect(c.duration).toBe(2);
      expect(c.credits).toBe(3);
      expect(c.scheduled).toEqual({ dayIndex: 1, slotIndex: 2, weekType: 'all' });
    });

    it('normalizeCourse should return null for invalid', () => {
      expect(normalizeCourse(null)).toBeNull();
      expect(normalizeCourse({})).toBeNull();
      expect(normalizeCourse({ id: '', name: 'ok' })).toBeNull();
      expect(normalizeCourse({ id: 'x', name: '' })).toBeNull();
    });

    it('normalizeCourse should clamp duration', () => {
      const c = normalizeCourse({ id: 'x', name: 'n', duration: -5 });
      expect(c.duration).toBe(1);
      const c2 = normalizeCourse({ id: 'x', name: 'n', duration: 999 });
      expect(c2.duration).toBe(TOTAL_SLOTS);
    });

    it('validateAndNormalizeState should handle invalid input', () => {
      const defaults = validateAndNormalizeState(null);
      expect(defaults.courses.length).toBeGreaterThan(0);

      const partial = validateAndNormalizeState({ courses: 'not-array' });
      expect(Array.isArray(partial.courses)).toBe(true);
    });

    it('validateAndNormalizeState should filter invalid courses', () => {
      const result = validateAndNormalizeState({
        courses: [
          { id: 'a', name: 'ok', duration: 1 },
          null,
          { id: '', name: 'no-id' },
          { id: 'b', name: '  ', duration: 1 },
        ],
        classrooms: ['r1', '', 'r2'],
        teachers: ['t1', null, 't2'],
      });
      expect(result.courses.length).toBe(1);
      expect(result.courses[0].id).toBe('a');
      expect(result.classrooms).toEqual(['r1', 'r2']);
      expect(result.teachers).toEqual(['t1', 't2']);
    });
  });

  describe('CRUD operations', () => {
    let state;
    beforeEach(() => {
      state = createTestState();
    });

    it('addCourse should add course with new id', () => {
      const newState = addCourse(state, { name: '新课程', duration: 2 });
      expect(newState.courses.length).toBe(state.courses.length + 1);
      expect(newState.courses[newState.courses.length - 1].name).toBe('新课程');
      expect(state.courses.length).toBe(3);
    });

    it('addCourse should not mutate original state', () => {
      const frozen = JSON.stringify(state);
      addCourse(state, { name: 'x' });
      expect(JSON.stringify(state)).toBe(frozen);
    });

    it('addCourse should handle duplicate id', () => {
      const s = addCourse(state, { id: 'course-1', name: 'dup' });
      const names = s.courses.map((c) => c.name);
      expect(names.filter((n) => n === 'dup').length).toBe(1);
      expect(s.courses.length).toBe(4);
    });

    it('updateCourse should update fields', () => {
      const s = updateCourse(state, 'course-1', { name: '新名字', credits: 5 });
      const c = s.courses.find((x) => x.id === 'course-1');
      expect(c.name).toBe('新名字');
      expect(c.credits).toBe(5);
    });

    it('updateCourse should ignore non-existent', () => {
      const s = updateCourse(state, 'nope', { name: 'x' });
      expect(s).toBe(state);
    });

    it('deleteCourse should remove course', () => {
      const s = deleteCourse(state, 'course-1');
      expect(s.courses.length).toBe(2);
      expect(s.courses.find((c) => c.id === 'course-1')).toBeUndefined();
    });

    it('deleteCourse should ignore non-existent', () => {
      const s = deleteCourse(state, 'nope');
      expect(s.courses.length).toBe(3);
    });

    it('scheduleCourse should set scheduled', () => {
      const placement = { dayIndex: 2, slotIndex: 4, weekType: 'odd' };
      const s = scheduleCourse(state, 'course-1', placement);
      const c = findCourse(s, 'course-1');
      expect(c.scheduled).toEqual(placement);
    });

    it('unscheduleCourse should clear scheduled', () => {
      const s = unscheduleCourse(state, 'course-3');
      const c = findCourse(s, 'course-3');
      expect(c.scheduled).toBeNull();
      expect(state.courses.find((c) => c.id === 'course-3').scheduled).not.toBeNull();
    });

    it('findCourse should find across all courses', () => {
      expect(findCourse(state, 'course-2').name).toBe('测试英语');
      expect(findCourse(state, 'nope')).toBeNull();
    });

    it('getUnscheduledCourses and getScheduledCourses', () => {
      expect(getUnscheduledCourses(state).length).toBe(2);
      expect(getScheduledCourses(state).length).toBe(1);
    });
  });

  describe('getOccupiedSlots', () => {
    it('should return slots for scheduled course', () => {
      const course = { id: 'x', duration: 3, scheduled: { dayIndex: 2, slotIndex: 5 } };
      const slots = getOccupiedSlots(course);
      expect(slots).toEqual([
        { dayIndex: 2, slotIndex: 5 },
        { dayIndex: 2, slotIndex: 6 },
        { dayIndex: 2, slotIndex: 7 },
      ]);
    });

    it('should return empty for unscheduled', () => {
      expect(getOccupiedSlots({ scheduled: null })).toEqual([]);
    });

    it('should not exceed TOTAL_SLOTS', () => {
      const course = { id: 'x', duration: 100, scheduled: { dayIndex: 0, slotIndex: TOTAL_SLOTS - 2 } };
      const slots = getOccupiedSlots(course);
      expect(slots.length).toBe(2);
    });
  });

  describe('isWeekTypeCompatible', () => {
    it('all is compatible with everything', () => {
      expect(isWeekTypeCompatible('all', 'odd')).toBe(true);
      expect(isWeekTypeCompatible('even', 'all')).toBe(true);
      expect(isWeekTypeCompatible('all', 'all')).toBe(true);
    });

    it('same types are compatible', () => {
      expect(isWeekTypeCompatible('odd', 'odd')).toBe(true);
      expect(isWeekTypeCompatible('even', 'even')).toBe(true);
    });

    it('different non-all types are incompatible', () => {
      expect(isWeekTypeCompatible('odd', 'even')).toBe(false);
    });
  });

  describe('conflict detection', () => {
    it('checkPlacementConflict should detect classroom conflict', () => {
      let state = createTestState();
      state = scheduleCourse(state, 'course-1', {
        dayIndex: 0, slotIndex: 0, weekType: 'all' });
      const result = checkPlacementConflict(state, 'course-3', { dayIndex: 0, slotIndex: 0, weekType: 'all' });
      expect(result.valid).toBe(false);
      expect(result.conflicts.some((c) => c.type === 'classroom')).toBe(true);
      expect(result.conflicts.some((c) => c.message.includes('教室A'))).toBe(true);
    });

    it('checkPlacementConflict should detect teacher conflict', () => {
      let state = createTestState();
      state = updateCourse(state, 'course-3', { teacher: '张老师' });
      state = scheduleCourse(state, 'course-1', {
        dayIndex: 1, slotIndex: 0, weekType: 'all' });
      state = updateCourse(state, 'course-3', { teacher: '张老师', scheduled: { dayIndex: 1, slotIndex: 0, weekType: 'all' } });
      const result = checkPlacementConflict(state, 'course-1', { dayIndex: 1, slotIndex: 0, weekType: 'all' });
      expect(result.valid).toBe(false);
      expect(result.conflicts.some((c) => c.type === 'teacher')).toBe(true);
    });

    it('checkPlacementConflict should allow different rooms', () => {
      let state = createTestState();
      state = scheduleCourse(state, 'course-1', { dayIndex: 1, slotIndex: 0, weekType: 'all' });
      const result = checkPlacementConflict(state, 'course-2', { dayIndex: 1, slotIndex: 0, weekType: 'all' });
      expect(result.valid).toBe(true);
      expect(result.conflicts.length).toBe(0);
    });

    it('checkPlacementConflict should respect week type', () => {
      let state = createTestState();
      state = scheduleCourse(state, 'course-1', { dayIndex: 1, slotIndex: 0, weekType: 'odd' });
      const r1 = checkPlacementConflict(state, 'course-3', { dayIndex: 1, slotIndex: 0, weekType: 'even' });
      expect(r1.valid).toBe(true);
      const r2 = checkPlacementConflict(state, 'course-3', { dayIndex: 1, slotIndex: 0, weekType: 'odd' });
      expect(r2.valid).toBe(false);
    });

    it('checkPlacementConflict should validate placement params', () => {
      const state = createTestState();
      const r1 = checkPlacementConflict(state, 'course-1', { dayIndex: 99, slotIndex: 0, weekType: 'all' });
      expect(r1.valid).toBe(false);
      const r2 = checkPlacementConflict(state, 'course-1', { dayIndex: 0, slotIndex: -1, weekType: 'all' });
      expect(r2.valid).toBe(false);
      const r3 = checkPlacementConflict(state, 'nope', { dayIndex: 0, slotIndex: 0, weekType: 'all' });
      expect(r3.valid).toBe(false);
    });

    it('detectAllConflicts should find all pairwise conflicts', () => {
      let state = createTestState();
      state = updateCourse(state, 'course-3', { teacher: '张老师' });
      state = scheduleCourse(state, 'course-1', { dayIndex: 1, slotIndex: 0, weekType: 'all' });
      state = updateCourse(state, 'course-2', { teacher: '张老师', classroom: '教室A' });
      state = updateCourse(state, 'course-2', { scheduled: { dayIndex: 1, slotIndex: 0, weekType: 'all' } });
      const conflicts = detectAllConflicts(state);
      expect(conflicts.length).toBe(2);
      expect(conflicts.some((c) => c.type === 'classroom')).toBe(true);
      expect(conflicts.some((c) => c.type === 'teacher')).toBe(true);
    });
  });

  describe('canPlaceCourseAt', () => {
    let state;
    beforeEach(() => {
      state = createTestState();
    });

    it('should allow valid placement', () => {
      const r = canPlaceCourseAt(state, 'course-1', 2, 3);
      expect(r.canPlace).toBe(true);
    });

    it('should reject out of range', () => {
      expect(canPlaceCourseAt(state, 'course-1', -1, 0).canPlace).toBe(false);
      expect(canPlaceCourseAt(state, 'course-1', 0, TOTAL_SLOTS).canPlace).toBe(false);
      expect(canPlaceCourseAt(state, 'course-1', 0, TOTAL_SLOTS - 1).canPlace).toBe(false);
    });

    it('should detect conflict', () => {
      const r = canPlaceCourseAt(state, 'course-1', 0, 0);
      expect(r.canPlace).toBe(false);
      expect(r.reason).toContain('教室A');
    });
  });

  describe('buildScheduleGrid', () => {
    it('should build grid with courses at start positions', () => {
      const state = createTestState();
      const grid = buildScheduleGrid(state);
      expect(grid.length).toBe(7);
      expect(grid[0].length).toBe(TOTAL_SLOTS);
      expect(grid[0][0].length).toBe(1);
      expect(grid[0][0][0].id).toBe('course-3');
      expect(grid[1][0].length).toBe(0);
    });
  });

  describe('time slot helpers', () => {
    it('getCurrentTimeSlotIndex should match morning', () => {
      const d = new Date(2025, 0, 1, 8, 30);
      const idx = getCurrentTimeSlotIndex(d);
      expect(idx).toBe(0);
    });

    it('getCurrentTimeSlotIndex should handle before 8:00', () => {
      const d = new Date(2025, 0, 1, 7, 0);
      expect(getCurrentTimeSlotIndex(d)).toBe(0);
    });

    it('getCurrentTimeSlotIndex should handle after hours', () => {
      const d = new Date(2025, 0, 1, 23, 0);
      expect(getCurrentTimeSlotIndex(d)).toBe(-1);
    });

    it('getCurrentDayIndex monday', () => {
      const monday = new Date(2025, 5, 9);
      expect(getCurrentDayIndex(monday)).toBe(0);
    });

    it('getCurrentDayIndex sunday', () => {
      const sunday = new Date(2025, 5, 15);
      expect(getCurrentDayIndex(sunday)).toBe(6);
    });
  });

  describe('JSON import/export', () => {
    it('exportToJSON should produce valid JSON', () => {
      const state = createTestState();
      const json = exportToJSON(state);
      const parsed = JSON.parse(json);
      expect(parsed.courses.length).toBe(3);
    });

    it('importFromJSON should validate and normalize', () => {
      const state = createTestState();
      const json = exportToJSON(state);
      const result = importFromJSON(json);
      expect(result.valid).toBe(true);
      expect(result.state.courses.length).toBe(3);
    });

    it('importFromJSON should detect missing courses field', () => {
      const result = importFromJSON('{}');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.join('')).toContain('courses');
    });

    it('importFromJSON detect malformed JSON', () => {
      const result = importFromJSON('{not json');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('解析');
    });

    it('importFromJSON detect invalid courses', () => {
      const data = {
        courses: [{ id: 'x' }, { name: 'no-id' }, null],
      };
      const result = importFromJSON(JSON.stringify(data));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('id'))).toBe(true);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('importFromJSON detect invalid classrooms/teachers', () => {
      const data = { courses: [], classrooms: 'nope', teachers: 123 };
      const result = importFromJSON(JSON.stringify(data));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('classrooms'))).toBe(true);
      expect(result.errors.some((e) => e.includes('teachers'))).toBe(true);
    });

    it('importFromJSON reject non-string input', () => {
      expect(importFromJSON(123)).toEqual({ valid: false, errors: ['输入不是有效的字符串'] });
    });
  });

  describe('addClassroom and addTeacher', () => {
    it('addClassroom should add new ones', () => {
      const state = createTestState();
      const s = addClassroom(state, '  新教室  ');
      expect(s.classrooms).toContain('新教室');
      expect(s.classrooms.length).toBe(4);
    });

    it('addClassroom should dedupe', () => {
      const state = createTestState();
      const s = addClassroom(state, '教室A');
      expect(s.classrooms.length).toBe(3);
    });

    it('addClassroom should ignore empty', () => {
      const state = createTestState();
      const s = addClassroom(state, '   ');
      expect(s.classrooms.length).toBe(3);
    });

    it('addTeacher should work similarly', () => {
      const state = createTestState();
      let s = addTeacher(state, '新老师');
      expect(s.teachers.length).toBe(4);
      s = addTeacher(s, '张老师');
      expect(s.teachers.length).toBe(4);
      s = addTeacher(s, '');
      expect(s.teachers.length).toBe(4);
    });
  });

  describe('validateCourse', () => {
    it('should accept valid course', () => {
      const r = validateCourse({
        name: '数学',
        duration: 2,
        subjectColorId: 'math',
      });
      expect(r.valid).toBe(true);
    });

    it('should reject empty name', () => {
      const r = validateCourse({ name: '', duration: 1 });
      expect(r.valid).toBe(false);
      expect(r.errors.name).toBeTruthy();
    });

    it('should reject invalid duration', () => {
      const r = validateCourse({ name: 'ok', duration: 0 });
      expect(r.valid).toBe(false);
      expect(r.errors.duration).toBeTruthy();
    });

    it('should reject invalid color', () => {
      const r = validateCourse({ name: 'ok', duration: 1, subjectColorId: 'nonexistent' });
      expect(r.valid).toBe(false);
      expect(r.errors.subjectColorId).toBeTruthy();
    });

    it('should validate scheduled', () => {
      const r = validateCourse({ name: 'ok', duration: 1, scheduled: 'invalid' });
      expect(r.valid).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(validateCourse(null).valid).toBe(false);
      expect(validateCourse(undefined).valid).toBe(false);
    });
  });

  describe('formatScheduleRange', () => {
    it('should format unscheduled', () => {
      expect(formatScheduleRange({ scheduled: null })).toBe('未排课');
    });

    it('should format scheduled course', () => {
      const s = formatScheduleRange({
        duration: 2, scheduled: { dayIndex: 1, slotIndex: 0, weekType: 'all' } });
      expect(s).toContain('周二');
      expect(s).toContain(TIME_SLOTS[0].startTime);
    });

    it('should include week type label', () => {
      const s = formatScheduleRange({
        duration: 1, scheduled: { dayIndex: 3, slotIndex: 2, weekType: 'odd' } });
      expect(s).toContain('周四');
      expect(s).toContain('单周');
    });
  });

  describe('isWeekend', () => {
    it('should correctly identify weekend days', () => {
      WEEKEND_INDICES.forEach((idx) => expect(isWeekend(idx)).toBe(true));
      [0, 1, 2, 3, 4].forEach((idx) => expect(isWeekend(idx)).toBe(false));
    });
  });

  describe('constants exports', () => {
    it('TIME_SLOTS should have expected structure', () => {
      expect(Array.isArray(TIME_SLOTS)).toBe(true);
      expect(TIME_SLOTS.length).toBe(TOTAL_SLOTS);
      TIME_SLOTS.forEach((slot) => {
        expect(slot).toHaveProperty('index');
        expect(slot).toHaveProperty('startTime');
        expect(slot).toHaveProperty('endTime');
        expect(slot).toHaveProperty('label');
      });
    });

    it('first slot should start at 08:00', () => {
      expect(TIME_SLOTS[0].startTime).toBe('08:00');
    });

    it('WEEK_DAYS should have 7 days', () => {
      expect(WEEK_DAYS.length).toBe(7);
      expect(WEEK_DAYS[0]).toBe('周一');
      expect(WEEK_DAYS[6]).toBe('周日');
    });
  });
});
