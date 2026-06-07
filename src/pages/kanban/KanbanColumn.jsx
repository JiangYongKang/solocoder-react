import KanbanCard from './KanbanCard.jsx';
import { STATUS_LABELS } from './constants.js';

export default function KanbanColumn({
  status,
  tasks,
  onAddClick,
  onCardClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  draggingTaskId,
  dropIndicator,
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
    onDragOver && onDragOver(e, status);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onDrop && onDrop(e, status);
  };

  const showIndicator = dropIndicator && dropIndicator.status === status;
  const indicatorIndex = showIndicator ? dropIndicator.index : -1;

  const cards = [];
  tasks.forEach((task, idx) => {
    if (indicatorIndex === idx) {
      cards.push(<div key={`indicator-${idx}`} className="kanban-drop-indicator" aria-hidden="true" />);
    }
    cards.push(
      <div
        key={task.id}
        data-index={idx}
        className="kanban-card-slot"
      >
        <KanbanCard
          task={task}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onClick={onCardClick}
          isDragging={draggingTaskId === task.id}
        />
      </div>
    );
  });
  if (indicatorIndex >= tasks.length) {
    cards.push(<div key="indicator-end" className="kanban-drop-indicator" aria-hidden="true" />);
  }

  return (
    <div
      className={`kanban-column ${showIndicator ? 'kanban-column-drop-active' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-status={status}
    >
      <div className="kanban-column-header">
        <h2 className="kanban-column-title">
          {STATUS_LABELS[status] || status}
          <span className="kanban-column-count">{tasks.length}</span>
        </h2>
        <button
          type="button"
          className="kanban-add-btn"
          onClick={() => onAddClick && onAddClick(status)}
        >
          + 新建
        </button>
      </div>
      <div className="kanban-column-body" data-role="column-body">
        {cards.length > 0 ? cards : (
          <>
            {showIndicator && <div className="kanban-drop-indicator" aria-hidden="true" />}
            <div className="kanban-empty">暂无任务，点击上方「新建」添加</div>
          </>
        )}
      </div>
    </div>
  );
}
