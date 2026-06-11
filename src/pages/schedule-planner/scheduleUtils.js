import {
  STORAGE_KEY,
  SUBJECT_COLORS,
  TIME_SLOTS,
  TOTAL_SLOTS,
  WEEK_DAYS,
  WEEKDAY_INDICES,
  WEEKEND_INDICES,
  WEEK_TYPE,
  WEEK_TYPE_LABELS,
} from './constants.js';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getColorByIndex(index) {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

export function getColorBySubjectId(subjectId) {
  return SUBJECT_COLORS.find((c) => c.id === subjectId) || SUBJECT_COLORS[0];
}

export function getDefaultCourses() {
  return [
    {
      id: generateId(),
      name: '高等数学',
      teacher: '张教授',
      classroom: '教学楼A-301',
      duration: 2,
      credits: 4,
      subjectColorId: 'math',
      notes: '每周两节课，期末考试闭卷',
      scheduled: null,
    },
    {
      id: generateId(),
      name: '大学英语',
      teacher: '李老师',
      classroom: '外语楼B-202',
      duration: 2,
      credits: 3,
      subjectColorId: 'english',
      notes: '注重听说能力训练',
      scheduled: null,
    },
    {
      id: generateId(),
      name: '大学物理',
      teacher: '王教授',
      classroom: '理学楼C-101',
      duration: 2,
      credits: 4,
      subjectColorId: 'physics',
      notes: '包含实验课程',
      scheduled: null,
    },
    {
      id: generateId(),
      name: '线性代数',
      teacher: '陈教授',
      classroom: '教学楼A-205',
      duration: 2,
      credits: 3,
      subjectColorId: 'math',
      notes: '',
      scheduled: null,
    },
    {
      id: generateId(),
      name: '计算机基础',
      teacher: '刘老师',
      classroom: '信息楼D-401',
      duration: 2,
      credits: 3,
      subjectColorId: 'custom1',
      notes: '上机实践为主',
      scheduled: null,
    },
    {
      id: generateId(),
      name: '思想政治',
      teacher: '赵老师',
      classroom: '教学楼A-101',
      duration: 2,
      credits: 2,
      subjectColorId: 'politics',
      notes: '',
      scheduled: null,
    },
    {
      id: generateId(),
      name: '体育',
      teacher: '孙教练',
      classroom: '体育馆',
      duration: 2,
      credits: 1,
      subjectColorId: 'pe',
      notes: '室外课，注意天气',
      scheduled: null,
    },
    {
      id: generateId(),
      name: '数据结构',
      teacher: '周教授',
      classroom: '信息楼D-305',
      duration: 2,
      credits: 4,
      subjectColorId: 'custom2',
      notes: '编程实践课',
      scheduled: null,
    },
  ];
}

export function getDefaultClassrooms() {
  return [
    '教学楼A-101',
    '教学楼A-205',
    '教学楼A-301',
    '外语楼B-202',
    '理学楼C-101',
    '信息楼D-305',
    '信息楼D-401',
    '体育馆',
  ];
}

export function getDefaultTeachers() {
  return [
    '张教授',
    '李老师',
    '王教授',
    '陈教授',
    '刘老师',
    '赵老师',
    '孙教练',
    '周教授',
  ];
}

export function createDefaultState() {
  return {
    courses: getDefaultCourses(),
    classrooms: getDefaultClassrooms(),
    teachers: getDefaultTeachers(),
  };
}

export function loadState(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return createDefaultState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = createDefaultState();
      saveState(defaults, storage);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    return validateAndNormalizeState(parsed);
  } catch {
    return createDefaultState();
  }
}

export function saveState(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function validateAndNormalizeState(raw) {
  const defaults = createDefaultState();

  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const courses = Array.isArray(raw.courses)
    ? raw.courses.map(normalizeCourse).filter(Boolean)
    : defaults.courses;

  const classrooms = Array.isArray(raw.classrooms)
    ? raw.classrooms.filter((c) => typeof c === 'string' && c.trim())
    : defaults.classrooms;

  const teachers = Array.isArray(raw.teachers)
    ? raw.teachers.filter((t) => typeof t === 'string' && t.trim())
    : defaults.teachers;

  return { courses, classrooms, teachers };
}

export function normalizeCourse(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;

  const scheduled = normalizeScheduled(raw.scheduled);

  return {
    id: raw.id,
    name: String(raw.name).trim(),
    teacher: typeof raw.teacher === 'string' ? raw.teacher.trim() : '',
    classroom: typeof raw.classroom === 'string' ? raw.classroom.trim() : '',
    duration: typeof raw.duration === 'number' ? Math.max(1, Math.min(TOTAL_SLOTS, Math.floor(raw.duration))) : 1,
    credits: typeof raw.credits === 'number' ? raw.credits : 0,
    subjectColorId:
      typeof raw.subjectColorId === 'string' && SUBJECT_COLORS.some((c) => c.id === raw.subjectColorId)
        ? raw.subjectColorId
        : SUBJECT_COLORS[0].id,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    scheduled,
  };
}

export function normalizeScheduled(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.dayIndex !== 'number') return null;
  if (typeof raw.slotIndex !== 'number') return null;

  const dayIndex = Math.max(0, Math.min(6, Math.floor(raw.dayIndex)));
  const slotIndex = Math.max(0, Math.min(TOTAL_SLOTS - 1, Math.floor(raw.slotIndex)));
  const weekType = Object.values(WEEK_TYPE).includes(raw.weekType) ? raw.weekType : WEEK_TYPE.ALL;

  return { dayIndex, slotIndex, weekType };
}

export function addCourse(state, courseData) {
  const existingIds = new Set(state.courses.map((c) => c.id));
  let newId = courseData.id;
  if (!newId || existingIds.has(newId)) {
    newId = generateId();
  }

  const normalized = normalizeCourse({
    ...courseData,
    id: newId,
  });

  if (!normalized) return state;

  return {
    ...state,
    courses: [...state.courses, normalized],
  };
}

export function updateCourse(state, courseId, updates) {
  const courseIndex = state.courses.findIndex((c) => c.id === courseId);
  if (courseIndex === -1) return state;

  const original = state.courses[courseIndex];
  const updated = normalizeCourse({
    ...original,
    ...updates,
    id: original.id,
  });

  if (!updated) return state;

  const newCourses = [...state.courses];
  newCourses[courseIndex] = updated;

  return { ...state, courses: newCourses };
}

export function deleteCourse(state, courseId) {
  const exists = state.courses.some((c) => c.id === courseId);
  if (!exists) return state;

  return {
    ...state,
    courses: state.courses.filter((c) => c.id !== courseId),
  };
}

export function scheduleCourse(state, courseId, placement) {
  return updateCourse(state, courseId, { scheduled: placement });
}

export function unscheduleCourse(state, courseId) {
  return updateCourse(state, courseId, { scheduled: null });
}

export function findCourse(state, courseId) {
  return state.courses.find((c) => c.id === courseId) || null;
}

export function getUnscheduledCourses(state) {
  return state.courses.filter((c) => !c.scheduled);
}

export function getScheduledCourses(state) {
  return state.courses.filter((c) => c.scheduled);
}

export function getOccupiedSlots(course) {
  if (!course.scheduled) return [];
  const { dayIndex, slotIndex } = course.scheduled;
  const slots = [];
  for (let i = 0; i < course.duration; i++) {
    if (slotIndex + i < TOTAL_SLOTS) {
      slots.push({ dayIndex, slotIndex: slotIndex + i });
    }
  }
  return slots;
}

export function isWeekTypeCompatible(aType, bType) {
  if (aType === WEEK_TYPE.ALL || bType === WEEK_TYPE.ALL) return true;
  return aType === bType;
}

export function checkPlacementConflict(state, courseId, placement) {
  const course = findCourse(state, courseId);
  if (!course) return { valid: false, conflicts: [{ type: 'course', message: '课程不存在' }] };

  const { dayIndex, slotIndex, weekType } = placement;
  if (dayIndex < 0 || dayIndex > 6) {
    return { valid: false, conflicts: [{ type: 'placement', message: '星期索引无效' }] };
  }
  if (slotIndex < 0 || slotIndex + course.duration > TOTAL_SLOTS) {
    return { valid: false, conflicts: [{ type: 'placement', message: '时间段超出范围' }] };
  }

  const conflicts = [];
  const targetSlots = [];
  for (let i = 0; i < course.duration; i++) {
    targetSlots.push(slotIndex + i);
  }

  for (const other of state.courses) {
    if (other.id === courseId) continue;
    if (!other.scheduled) continue;
    if (other.scheduled.dayIndex !== dayIndex) continue;
    if (!isWeekTypeCompatible(weekType, other.scheduled.weekType)) continue;

    const otherSlots = [];
    for (let i = 0; i < other.duration; i++) {
      otherSlots.push(other.scheduled.slotIndex + i);
    }

    const overlap = targetSlots.some((ts) => otherSlots.includes(ts));
    if (!overlap) continue;

    const timeLabel = getOverlapTimeLabel(targetSlots, otherSlots);

    if (course.classroom && other.classroom && course.classroom === other.classroom) {
      conflicts.push({
        type: 'classroom',
        message: `教室 ${course.classroom} 在 ${timeLabel} 已被 ${other.name} 占用`,
        courseA: course.name,
        courseB: other.name,
        classroom: course.classroom,
        time: timeLabel,
        dayIndex,
      });
    }

    if (course.teacher && other.teacher && course.teacher === other.teacher) {
      conflicts.push({
        type: 'teacher',
        message: `教师 ${course.teacher} 在 ${timeLabel} 已有 ${other.name} 课程`,
        courseA: course.name,
        courseB: other.name,
        teacher: course.teacher,
        time: timeLabel,
        dayIndex,
      });
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

function getOverlapTimeLabel(slotsA, slotsB) {
  const overlapSet = slotsA.filter((s) => slotsB.includes(s));
  if (overlapSet.length === 0) return '未知时间段';

  const minSlot = Math.min(...overlapSet);
  const maxSlot = Math.max(...overlapSet);
  const startSlot = TIME_SLOTS[minSlot];
  const endSlot = TIME_SLOTS[Math.min(maxSlot, TOTAL_SLOTS - 1)];

  if (!startSlot || !endSlot) return '未知时间段';
  if (minSlot === maxSlot) return startSlot.label;
  return `${startSlot.startTime}-${endSlot.endTime}`;
}

export function detectAllConflicts(state) {
  const allConflicts = [];

  const scheduled = getScheduledCourses(state);

  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i];
      const b = scheduled[j];

      if (a.scheduled.dayIndex !== b.scheduled.dayIndex) continue;
      if (!isWeekTypeCompatible(a.scheduled.weekType, b.scheduled.weekType)) continue;

      const aSlots = new Set(getOccupiedSlots(a).map((s) => s.slotIndex));
      const bSlots = getOccupiedSlots(b).map((s) => s.slotIndex);
      const overlap = bSlots.filter((s) => aSlots.has(s));

      if (overlap.length === 0) continue;

      const timeLabel = getConflictTimeLabel(overlap);
      const dayLabel = WEEK_DAYS[a.scheduled.dayIndex];
      const fullTimeLabel = `${dayLabel} ${timeLabel}`;

      if (a.classroom && b.classroom && a.classroom === b.classroom) {
        allConflicts.push({
          type: 'classroom',
          courseA: a.id,
          courseB: b.id,
          courseAName: a.name,
          courseBName: b.name,
          resource: a.classroom,
          time: fullTimeLabel,
          message: `教室冲突：${a.name} 与 ${b.name} 在 ${fullTimeLabel} 共用教室 ${a.classroom}`,
        });
      }

      if (a.teacher && b.teacher && a.teacher === b.teacher) {
        allConflicts.push({
          type: 'teacher',
          courseA: a.id,
          courseB: b.id,
          courseAName: a.name,
          courseBName: b.name,
          resource: a.teacher,
          time: fullTimeLabel,
          message: `教师冲突：${a.name} 与 ${b.name} 在 ${fullTimeLabel} 共用教师 ${a.teacher}`,
        });
      }
    }
  }

  return allConflicts;
}

function getConflictTimeLabel(overlapSlots) {
  if (overlapSlots.length === 0) return '未知时间段';

  const minSlot = Math.min(...overlapSlots);
  const maxSlot = Math.max(...overlapSlots);
  const startSlot = TIME_SLOTS[minSlot];
  const endSlot = TIME_SLOTS[Math.min(maxSlot, TOTAL_SLOTS - 1)];

  if (!startSlot || !endSlot) return '未知时间段';
  if (minSlot === maxSlot) return startSlot.label;
  return `${startSlot.startTime}-${endSlot.endTime}`;
}

export function buildScheduleGrid(state) {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: TOTAL_SLOTS }, () => []));

  for (const course of state.courses) {
    if (!course.scheduled) continue;
    const { dayIndex, slotIndex } = course.scheduled;

    if (slotIndex < TOTAL_SLOTS) {
      grid[dayIndex][slotIndex].push(course);
    }
  }

  return grid;
}

export function canPlaceCourseAt(state, courseId, dayIndex, slotIndex) {
  const course = findCourse(state, courseId);
  if (!course) return { canPlace: false, reason: '课程不存在' };

  if (dayIndex < 0 || dayIndex > 6) return { canPlace: false, reason: '星期索引无效' };
  if (slotIndex < 0) return { canPlace: false, reason: '时间段索引无效' };
  if (slotIndex + course.duration > TOTAL_SLOTS) return { canPlace: false, reason: '课程时长超出课表范围' };

  const placement = {
    dayIndex,
    slotIndex,
    weekType: course.scheduled?.weekType || WEEK_TYPE.ALL,
  };

  const conflictResult = checkPlacementConflict(state, courseId, placement);
  if (!conflictResult.valid) {
    return { canPlace: false, reason: conflictResult.conflicts[0]?.message || '存在冲突', conflicts: conflictResult.conflicts };
  }

  return { canPlace: true, placement };
}

export function getCurrentTimeSlotIndex(currentDate = new Date()) {
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const slot = TIME_SLOTS[i];
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    const startTotal = sh * 60 + sm;
    const endTotal = eh * 60 + em;

    if (totalMinutes >= startTotal && totalMinutes < endTotal) {
      return i;
    }
  }

  if (totalMinutes < 8 * 60) return 0;
  return -1;
}

export function getCurrentDayIndex(currentDate = new Date()) {
  const day = currentDate.getDay();
  return day === 0 ? 6 : day - 1;
}

export function exportToJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importFromJSON(jsonString) {
  const errors = [];

  if (typeof jsonString !== 'string') {
    return { valid: false, errors: ['输入不是有效的字符串'] };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { valid: false, errors: [`JSON 解析失败：${e.message}`] };
  }

  if (!parsed || typeof parsed !== 'object') {
    errors.push('根节点必须是对象');
    return { valid: false, errors };
  }

  if (!Array.isArray(parsed.courses)) {
    errors.push('缺少必要字段 courses（必须是数组）');
  } else {
    parsed.courses.forEach((c, idx) => {
      if (!c || typeof c !== 'object') {
        errors.push(`courses[${idx}]: 必须是对象`);
        return;
      }
      if (typeof c.id !== 'string' || !c.id.trim()) {
        errors.push(`courses[${idx}]: 缺少有效 id 字段`);
      }
      if (typeof c.name !== 'string' || !c.name.trim()) {
        errors.push(`courses[${idx}]: 缺少有效 name 字段`);
      }
      if (typeof c.duration !== 'number' || c.duration < 1) {
        errors.push(`courses[${idx}]: duration 必须是 ≥1 的数字`);
      }
    });
  }

  if (parsed.classrooms !== undefined && !Array.isArray(parsed.classrooms)) {
    errors.push('classrooms 字段必须是数组');
  }

  if (parsed.teachers !== undefined && !Array.isArray(parsed.teachers)) {
    errors.push('teachers 字段必须是数组');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalized = validateAndNormalizeState(parsed);
  return { valid: true, state: normalized };
}

export function addClassroom(state, classroomName) {
  if (typeof classroomName !== 'string' || !classroomName.trim()) return state;
  const trimmed = classroomName.trim();
  if (state.classrooms.includes(trimmed)) return state;
  return { ...state, classrooms: [...state.classrooms, trimmed] };
}

export function addTeacher(state, teacherName) {
  if (typeof teacherName !== 'string' || !teacherName.trim()) return state;
  const trimmed = teacherName.trim();
  if (state.teachers.includes(trimmed)) return state;
  return { ...state, teachers: [...state.teachers, trimmed] };
}

export function validateCourse(courseData) {
  const errors = {};

  if (!courseData || typeof courseData !== 'object') {
    return { valid: false, errors: { course: '无效的课程数据' } };
  }

  if (typeof courseData.name !== 'string' || !courseData.name.trim()) {
    errors.name = '课程名称不能为空';
  }

  if (typeof courseData.duration !== 'number' || courseData.duration < 1 || courseData.duration > TOTAL_SLOTS) {
    errors.duration = `课程时长必须在 1 到 ${TOTAL_SLOTS} 之间`;
  }

  if (
    courseData.subjectColorId &&
    !SUBJECT_COLORS.some((c) => c.id === courseData.subjectColorId)
  ) {
    errors.subjectColorId = '无效的颜色标记';
  }

  if (courseData.scheduled) {
    const normalized = normalizeScheduled(courseData.scheduled);
    if (!normalized) {
      errors.scheduled = '无效的排课信息';
    } else if (typeof courseData.duration === 'number' && normalized.slotIndex + courseData.duration > TOTAL_SLOTS) {
      errors.scheduled = '排课时间段超出课表范围';
    }
  }

  if (courseData.weekType && !Object.values(WEEK_TYPE).includes(courseData.weekType)) {
    errors.weekType = '无效的周次类型';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function formatScheduleRange(course) {
  if (!course.scheduled) return '未排课';
  const { dayIndex, slotIndex, weekType } = course.scheduled;
  const dayLabel = WEEK_DAYS[dayIndex];
  const startSlot = TIME_SLOTS[slotIndex];
  const endSlot = TIME_SLOTS[Math.min(slotIndex + course.duration - 1, TOTAL_SLOTS - 1)];

  if (!startSlot || !endSlot) return '未知时间';

  const timeLabel = slotIndex + course.duration - 1 === slotIndex
    ? startSlot.label
    : `${startSlot.startTime}-${endSlot.endTime}`;

  const weekLabel = weekType === WEEK_TYPE.ALL ? '' : `(${WEEK_TYPE_LABELS[weekType]})`;

  return `${dayLabel} ${timeLabel}${weekLabel}`;
}

export function isWeekend(dayIndex) {
  return WEEKEND_INDICES.includes(dayIndex);
}

export { WEEK_DAYS, WEEKDAY_INDICES, WEEKEND_INDICES, TIME_SLOTS, TOTAL_SLOTS, SUBJECT_COLORS, WEEK_TYPE, WEEK_TYPE_LABELS };
