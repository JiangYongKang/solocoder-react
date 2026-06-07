import { PRIORITIES, PRIORITY_LABELS } from './constants.js';

const priorityClass = {
  [PRIORITIES.HIGH]: 'kanban-priority-high',
  [PRIORITIES.MEDIUM]: 'kanban-priority-medium',
  [PRIORITIES.LOW]: 'kanban-priority-low',
};

export default function KanbanCard({ task, onDragStart, onDragEnd, onClick, isDragging }) {
  return (
    <div
      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      onDragEnd={(e) => onDragEnd && onDragEnd(e, task)}
      onClick={() => onClick && onClick(task)}
    >
      <div className="kanban-card-header">
        <h3 className="kanban-card-title">{task.title}</h3>
        <span className={`kanban-priority ${priorityClass[task.priority] || ''}`}>
          {PRIORITY_LABELS[task.priority] || task.priority}
        </span>
      </div>
      {task.description && (
        <p className="kanban-card-desc">{task.description}</p>
      )}
      {task.tags && task.tags.length > 0 && (
        <div className="kanban-tags">
          {task.tags.map((tag) => (
            <span key={tag} className="kanban-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
