import { useMemo } from 'react';
import {
  TIME_SLOTS,
  TOTAL_SLOTS,
  WEEK_DAYS,
  WEEKEND_INDICES,
  SUBJECT_COLORS,
  WEEK_TYPE_LABELS,
} from './constants.js';
import {
  isWeekend,
  getCurrentTimeSlotIndex,
  getCurrentDayIndex,
  findCourse,
} from './scheduleUtils.js';

export default function ScheduleGrid({
  state,
  draggingCourseId,
  dropPreview,
  invalidDropCells,
  onCourseClick,
  onCellDragOver,
  onCellDrop,
  onCellDragLeave,
}) {
  const currentSlot = useMemo(() => getCurrentTimeSlotIndex(), []);
  const currentDay = useMemo(() => getCurrentDayIndex(), []);

  const scheduledMap = useMemo(() => {
    const map = new Map();
    for (const course of state.courses) {
      if (!course.scheduled) continue;
      const { dayIndex, slotIndex } = course.scheduled;
      const key = `${dayIndex}-${slotIndex}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(course);
    }
    return map;
  }, [state.courses]);

  const isDropPreviewCell = (dayIdx, slotIdx) => {
    if (!dropPreview || !draggingCourseId) return false;
    if (dropPreview.dayIndex !== dayIdx) return false;
    const course = findCourse(state, draggingCourseId);
    if (!course) return false;
    return slotIdx >= dropPreview.slotIndex && slotIdx < dropPreview.slotIndex + course.duration;
  };

  const isInvalidCell = (dayIdx, slotIdx) => {
    return invalidDropCells?.some((c) => c.dayIndex === dayIdx && c.slotIndex === slotIdx) || false;
  };

  const buildGridElements = () => {
    const elements = [];

    elements.push(
      <div key="corner" className="schedule-corner-header" style={{ gridColumn: 1, gridRow: 1 }}>
        时间 \ 星期
      </div>
    );

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const classes = ['schedule-day-header'];
      if (WEEKEND_INDICES.includes(dayIdx)) classes.push('weekend');
      if (dayIdx === currentDay) classes.push('today');
      elements.push(
        <div
          key={`header-${dayIdx}`}
          className={classes.join(' ')}
          style={{ gridColumn: dayIdx + 2, gridRow: 1 }}
        >
          {WEEK_DAYS[dayIdx]}
        </div>
      );
    }

    for (let slotIdx = 0; slotIdx < TOTAL_SLOTS; slotIdx++) {
      const slot = TIME_SLOTS[slotIdx];
      const timeCellClasses = ['schedule-time-cell'];
      if (slotIdx === currentSlot) timeCellClasses.push('current');
      elements.push(
        <div
          key={`time-${slotIdx}`}
          className={timeCellClasses.join(' ')}
          style={{ gridColumn: 1, gridRow: slotIdx + 2 }}
        >
          <div className="schedule-time-slot">{slot.startTime}</div>
          <div className="schedule-time-index">第{slotIdx + 1}节</div>
          <div className="schedule-time-slot" style={{ color: '#94a3b8' }}>
            {slot.endTime}
          </div>
        </div>
      );
    }

    for (let slotIdx = 0; slotIdx < TOTAL_SLOTS; slotIdx++) {
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const key = `${dayIdx}-${slotIdx}`;
        const weekend = isWeekend(dayIdx);
        const isCurrentTime = slotIdx === currentSlot && dayIdx === currentDay;

        const cellClasses = ['schedule-grid-cell'];
        if (weekend) cellClasses.push('weekend');
        if (isCurrentTime) cellClasses.push('current');
        if (isDropPreviewCell(dayIdx, slotIdx)) cellClasses.push('drop-preview');
        if (isInvalidCell(dayIdx, slotIdx)) cellClasses.push('drop-invalid');

        const coursesHere = scheduledMap.get(key) || [];

        elements.push(
          <div
            key={`cell-${key}`}
            className={cellClasses.join(' ')}
            style={{ gridColumn: dayIdx + 2, gridRow: slotIdx + 2 }}
            onDragOver={(e) => {
              e.preventDefault();
              onCellDragOver?.(dayIdx, slotIdx);
            }}
            onDragLeave={() => onCellDragLeave?.(dayIdx, slotIdx)}
            onDrop={(e) => {
              e.preventDefault();
              onCellDrop?.(dayIdx, slotIdx);
            }}
          >
            {coursesHere.map((course) => {
              const colorCfg = SUBJECT_COLORS.find((c) => c.id === course.subjectColorId) || SUBJECT_COLORS[0];
              const spanDuration = Math.min(course.duration, TOTAL_SLOTS - slotIdx);
              const cellHeight = 56;
              const borderWidth = 1;
              const offset = 6;
              const totalHeight = spanDuration * cellHeight - (spanDuration - 1) * borderWidth - offset;

              return (
                <div
                  key={course.id}
                  className="schedule-scheduled-course"
                  style={{
                    background: colorCfg.bgColor,
                    borderLeft: `3px solid ${colorCfg.color}`,
                    gridRow: `span ${spanDuration}`,
                    height: `${totalHeight}px`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCourseClick?.(course);
                  }}
                >
                  {course.scheduled.weekType !== 'all' && (
                    <span className="schedule-scheduled-course-week-type">
                      {WEEK_TYPE_LABELS[course.scheduled.weekType]}
                    </span>
                  )}
                  <div className="schedule-scheduled-course-name" title={course.name}>
                    {course.name}
                  </div>
                  <div className="schedule-scheduled-course-info">
                    <div title={course.teacher}>👤 {course.teacher || '—'}</div>
                    <div title={course.classroom}>📍 {course.classroom || '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }

    return elements;
  };

  return (
    <div className="schedule-grid-container">
      <div className="schedule-grid-wrapper">
        <div
          className="schedule-grid"
          style={{
            gridTemplateColumns: '90px repeat(7, minmax(120px, 1fr))',
          }}
        >
          {buildGridElements()}
        </div>
      </div>
    </div>
  );
}
