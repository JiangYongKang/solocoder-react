export default function ConflictPanel({ conflicts }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="schedule-conflict-panel">
      <div className="schedule-conflict-panel-header">
        <h3>⚠️ 检测到冲突</h3>
        <span className="schedule-conflict-count">{conflicts.length} 项</span>
      </div>
      <div className="schedule-conflict-list">
        {conflicts.map((conflict, idx) => (
          <div
            key={idx}
            className={`schedule-conflict-item ${conflict.type === 'teacher' ? 'teacher-conflict' : ''}`}
          >
            <span className="schedule-conflict-type">
              {conflict.type === 'classroom' ? '教室' : '教师'}
            </span>
            <span>{conflict.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
