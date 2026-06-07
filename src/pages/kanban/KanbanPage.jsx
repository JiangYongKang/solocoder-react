import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import KanbanColumn from './KanbanColumn.jsx';
import TaskModal from './TaskModal.jsx';
import FilterBar from './FilterBar.jsx';
import { STATUS_ORDER, TASK_STATUSES } from './constants.js';
import {
  loadTasks,
  saveTasks,
  addTask,
  updateTask,
  deleteTask,
  moveTask,
  reorderTask,
  applyFilters,
  findTask,
} from './kanbanUtils.js';
import './kanban.css';

export default function KanbanPage() {
  const [board, setBoard] = useState(() => loadTasks());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterValue, setFilterValue] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskStatus, setNewTaskStatus] = useState(TASK_STATUSES.TODO);
  const [modalKey, setModalKey] = useState(0);

  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [draggingFromStatus, setDraggingFromStatus] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);

  useEffect(() => {
    saveTasks(board);
  }, [board]);

  const handleFilterChange = (type, value) => {
    if (value === null) {
      setActiveFilter(null);
      setFilterValue(null);
    } else {
      setActiveFilter(type);
      setFilterValue(value);
    }
  };

  const filteredBoard = applyFilters(board, {
    query: searchQuery,
    tag: activeFilter === 'tag' ? filterValue : null,
    priority: activeFilter === 'priority' ? filterValue : null,
  });

  const handleAddClick = (status) => {
    setEditingTask(null);
    setNewTaskStatus(status);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleCardClick = (task) => {
    const fullTask = findTask(board, task.id);
    setEditingTask(fullTask || task);
    setNewTaskStatus(task.status);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleSave = (payload) => {
    if (editingTask) {
      setBoard((prev) => updateTask(prev, editingTask.id, payload));
    } else {
      setBoard((prev) => addTask(prev, { ...payload, status: newTaskStatus }));
    }
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = () => {
    if (editingTask) {
      setBoard((prev) => deleteTask(prev, editingTask.id));
      setModalOpen(false);
      setEditingTask(null);
    }
  };

  const handleDragStart = (e, task) => {
    setDraggingTaskId(task.id);
    setDraggingFromStatus(task.status);
    try {
      e.dataTransfer.setData('text/plain', task.id);
    } catch {
      // ignore setData errors (some browsers restrict)
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDraggingFromStatus(null);
    setDropIndicator(null);
  };

  const getDropIndex = (columnBodyEl, clientY) => {
    const children = columnBodyEl.children;
    let cardCount = 0;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.dataset || child.dataset.index === undefined) continue;
      const rect = child.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (clientY < midpoint) return cardCount;
      cardCount++;
    }
    return cardCount;
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    if (!draggingTaskId) return;
    const columnEl = e.currentTarget;
    const columnBodyEl = columnEl.querySelector('[data-role="column-body"]');
    if (!columnBodyEl) return;
    const targetIndex = getDropIndex(columnBodyEl, e.clientY);
    setDropIndicator({ status, index: targetIndex });
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = draggingTaskId;
    const fromStatus = draggingFromStatus;
    if (!taskId) {
      handleDragEnd();
      return;
    }

    const columnEl = e.currentTarget;
    const columnBodyEl = columnEl.querySelector('[data-role="column-body"]');
    const targetIndex = columnBodyEl ? getDropIndex(columnBodyEl, e.clientY) : 0;

    const localTaskId = taskId;
    const localFromStatus = fromStatus;
    const localTargetIndex = targetIndex;
    const localTargetStatus = targetStatus;

    if (localFromStatus === localTargetStatus) {
      setBoard((prev) => {
        const fromList = prev[localTargetStatus] || [];
        const fromIndex = fromList.findIndex((t) => t.id === localTaskId);
        if (fromIndex === -1) return prev;
        if (fromIndex === localTargetIndex || fromIndex + 1 === localTargetIndex) {
          return prev;
        }
        return reorderTask(prev, localTargetStatus, fromIndex, localTargetIndex);
      });
    } else {
      setBoard((prev) => moveTask(prev, localTaskId, localTargetStatus, localTargetIndex));
    }
    handleDragEnd();
  };

  return (
    <div className="kanban-page">
      <div className="kanban-header">
        <div className="kanban-header-left">
          <Link to="/" className="kanban-back-link">← 返回首页</Link>
          <h1 className="kanban-title">任务看板</h1>
        </div>
      </div>

      <FilterBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        activeFilter={activeFilter}
        filterValue={filterValue}
        onFilterChange={handleFilterChange}
      />

      <div className="kanban-board">
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={filteredBoard[status] || []}
            onAddClick={handleAddClick}
            onCardClick={handleCardClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggingTaskId={draggingTaskId}
            dropIndicator={dropIndicator}
          />
        ))}
      </div>

      <TaskModal
        key={modalKey}
        isOpen={modalOpen}
        task={editingTask}
        defaultStatus={newTaskStatus}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
        onDelete={editingTask ? handleDelete : null}
      />
    </div>
  );
}
