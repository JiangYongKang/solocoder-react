import { SUBJECT_COLORS } from './constants.js';

export default function CoursePool({
  unscheduledCourses,
  draggingCourseId,
  onDragStart,
  onDragEnd,
  onAddCourse,
  onEditCourse,
}) {
  return (
    <div className="schedule-course-pool">
      <div className="schedule-course-pool-header">
        <h2>未排课程</h2>
        <span className="schedule-course-pool-count">{unscheduledCourses.length}</span>
      </div>
      <div className="schedule-course-pool-list">
        <button
          type="button"
          className="schedule-add-course-btn"
          onClick={onAddCourse}
        >
          + 新建课程
        </button>

        {unscheduledCourses.length === 0 ? (
          <div className="schedule-empty-state">
            <div className="schedule-empty-state-icon">📚</div>
            <div className="schedule-empty-state-text">
              所有课程已排课<br />点击上方按钮添加新课程
            </div>
          </div>
        ) : (
          unscheduledCourses.map((course) => {
            const colorCfg = SUBJECT_COLORS.find((c) => c.id === course.subjectColorId) || SUBJECT_COLORS[0];
            const isDragging = draggingCourseId === course.id;

            return (
              <div
                key={course.id}
                className={`schedule-course-card ${isDragging ? 'dragging' : ''}`}
                style={{
                  background: colorCfg.bgColor,
                  borderColor: colorCfg.color,
                }}
                draggable
                onDragStart={(e) => {
                  onDragStart?.(e, course);
                }}
                onDragEnd={(e) => {
                  onDragEnd?.(e, course);
                }}
                onDoubleClick={() => onEditCourse?.(course)}
                title="双击编辑，拖拽到课表安排"
              >
                <div className="schedule-course-card-name">{course.name}</div>
                <div className="schedule-course-card-meta">
                  <div>👤 {course.teacher || '—'}</div>
                  <div>📍 {course.classroom || '—'}</div>
                </div>
                <span className="schedule-course-card-duration">{course.duration} 节</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
