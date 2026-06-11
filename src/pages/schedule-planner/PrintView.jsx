import { useMemo } from 'react';
import {
  TIME_SLOTS,
  TOTAL_SLOTS,
  WEEK_DAYS,
  WEEKEND_INDICES,
} from './constants.js';
import { getScheduledCourses, getCurrentDayIndex } from './scheduleUtils.js';

export default function PrintView({ state, onBack }) {
  const scheduled = useMemo(() => getScheduledCourses(state), [state]);
  const currentDay = useMemo(() => getCurrentDayIndex(), []);

  const courseGrid = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array.from({ length: TOTAL_SLOTS }, () => []));
    for (const course of scheduled) {
      const { dayIndex, slotIndex } = course.scheduled;
      if (slotIndex < TOTAL_SLOTS) {
        grid[dayIndex][slotIndex].push(course);
      }
    }
    return grid;
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
                const courses = courseGrid[dayIdx][slotIdx];
                const weekend = WEEKEND_INDICES.includes(dayIdx);
                return (
                  <td
                    key={dayIdx}
                    className={weekend ? 'weekend' : ''}
                    style={{ minHeight: 40 }}
                  >
                    {courses.map((course) => {
                      const spanDuration = Math.min(course.duration, TOTAL_SLOTS - slotIdx);
                      return (
                        <div
                          key={course.id}
                          className="schedule-print-course"
                          style={{
                            rowSpan: spanDuration,
                            display: spanDuration > 1 ? 'block' : undefined,
                          }}
                        >
                          <div className="schedule-print-course-name">{course.name}</div>
                          <div className="schedule-print-course-info">
                            {course.teacher && <div>{course.teacher}</div>}
                            {course.classroom && <div>{course.classroom}</div>}
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

      <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 12px 0' }}>
          课程列表（共 {state.courses.length} 门）
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {state.courses.map((course) => (
            <div
              key={course.id}
              style={{
                padding: 8,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 11,
              }}
            >
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>
                {course.name}
                {course.scheduled?.weekType && course.scheduled.weekType !== 'all' && (
                  <span style={{ fontSize: 9, color: '#64748b', marginLeft: 6 }}>
                    ({course.scheduled.weekType === 'odd' ? '单周' : '双周'})
                  </span>
                )}
              </div>
              <div style={{ color: '#475569' }}>
                {course.teacher || '-'} · {course.classroom || '-'} · {course.duration}节 · {course.credits}学分
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
