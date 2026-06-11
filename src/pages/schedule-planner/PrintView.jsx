import { useMemo } from 'react';
import {
  TIME_SLOTS,
  TOTAL_SLOTS,
  WEEK_DAYS,
  WEEKEND_INDICES,
  SUBJECT_COLORS,
  WEEK_TYPE_LABELS,
} from './constants.js';
import { getScheduledCourses, getCurrentDayIndex } from './scheduleUtils.js';

export default function PrintView({ state, onBack }) {
  const scheduled = useMemo(() => getScheduledCourses(state), [state]);
  const currentDay = useMemo(() => getCurrentDayIndex(), []);

  const { courseStarts, skipSet } = useMemo(() => {
    const starts = Array.from({ length: 7 }, () => Array.from({ length: TOTAL_SLOTS }, () => []));
    const skip = new Set();
    for (const course of scheduled) {
      const { dayIndex, slotIndex } = course.scheduled;
      if (slotIndex >= TOTAL_SLOTS) continue;
      starts[dayIndex][slotIndex].push(course);
      const spanDuration = Math.min(course.duration, TOTAL_SLOTS - slotIndex);
      for (let i = 1; i < spanDuration; i++) {
        skip.add(`${dayIndex}-${slotIndex + i}`);
      }
    }
    return { courseStarts: starts, skipSet: skip };
  }, [scheduled]);

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="schedule-print-view">
      <div className="schedule-print-header">
        <h1>📅 课程表</h1>
        <div className="schedule-print-actions">
          <button type="button" className="schedule-toolbar-btn" onClick={onBack}>
            返回编辑
          </button>
          <button type="button" className="schedule-toolbar-btn primary" onClick={handlePrint}>
            打印 / 导出 PDF
          </button>
        </div>
      </div>

      <table className="schedule-print-grid">
        <thead>
          <tr>
            <th style={{ width: '90px' }}>时间 \ 星期</th>
            {WEEK_DAYS.map((day, idx) => (
              <th
                key={idx}
                className={WEEKEND_INDICES.includes(idx) ? 'weekend' : ''}
                style={idx === currentDay ? { background: '#eff6ff', color: '#2563eb' } : undefined}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot, slotIdx) => (
            <tr key={slotIdx}>
              <td style={{ textAlign: 'center', background: '#f8fafc', fontWeight: 500 }}>
                <div style={{ fontSize: 10, color: '#1e293b' }}>{slot.startTime}</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>第{slotIdx + 1}节</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{slot.endTime}</div>
              </td>
              {WEEK_DAYS.map((_, dayIdx) => {
                const key = `${dayIdx}-${slotIdx}`;
                if (skipSet.has(key)) return null;
                const courses = courseStarts[dayIdx][slotIdx];
                const weekend = WEEKEND_INDICES.includes(dayIdx);
                const firstCourse = courses[0];
                const spanDuration = firstCourse
                  ? Math.min(firstCourse.duration, TOTAL_SLOTS - slotIdx)
                  : 1;
                const hasRowSpan = courses.length > 0 && spanDuration > 1;
                return (
                  <td
                    key={dayIdx}
                    className={weekend ? 'weekend' : ''}
                    style={{ minHeight: 40 }}
                    rowSpan={hasRowSpan ? spanDuration : undefined}
                  >
                    {courses.map((course) => {
                      const colorCfg =
                        SUBJECT_COLORS.find((c) => c.id === course.subjectColorId) || SUBJECT_COLORS[0];
                      return (
                        <div
                          key={course.id}
                          className="schedule-print-course"
                          style={{
                            borderLeft: `3px solid ${colorCfg.color}`,
                            background: colorCfg.bgColor,
                          }}
                        >
                          {course.scheduled.weekType !== 'all' && (
                            <div style={{ fontSize: 8, color: '#64748b', marginBottom: 1 }}>
                              {WEEK_TYPE_LABELS[course.scheduled.weekType]}
                            </div>
                          )}
                          <div className="schedule-print-course-name">{course.name}</div>
                          <div className="schedule-print-course-info">
                            {course.teacher && <div>👤 {course.teacher}</div>}
                            {course.classroom && <div>📍 {course.classroom}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
