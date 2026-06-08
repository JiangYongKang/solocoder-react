import { useState, useRef, useEffect } from 'react';
import { getVisibleTasks, getChildren, formatDate } from './ganttUtils.js';

function EditableCell({ value, onSave, type = 'text', placeholder = '' }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'number') {
        inputRef.current.select();
      }
    }
  }, [editing, type]);

  const handleStartEdit = () => {
    setEditing(true);
  };

  const handleCommit = () => {
    setEditing(false);
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setLocalValue(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!editing) {
    return (
      <div
        className="gantt-task-cell"
        onClick={handleStartEdit}
        title={placeholder || String(value || '')}
        style={{ cursor: 'pointer' }}
      >
        {value || <span style={{ opacity: 0.5 }}>{placeholder}</span>}
      </div>
    );
  }

  if (type === 'date') {
    return (
      <input
        ref={inputRef}
        type="date"
        className="gantt-task-input"
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  if (type === 'number') {
    return (
      <input
        ref={inputRef}
        type="number"
        className="gantt-task-input"
        value={localValue ?? 0}
        min={0}
        max={100}
        onChange={(e) => setLocalValue(Number(e.target.value))}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      className="gantt-task-input"
      value={localValue || ''}
      placeholder={placeholder}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleCommit}
      onKeyDown={handleKeyDown}
    />
  );
}

export default function TaskList({ state, onToggleExpand, onUpdateTask, selectedTaskId, onSelectTask }) {
  const visibleTasks = getVisibleTasks(state);

  if (visibleTasks.length === 0) {
    return (
      <div className="gantt-left-panel">
        <div className="gantt-left-header">
          <span></span>
          <span>任务名称</span>
          <span>负责人</span>
          <span>进度</span>
          <span>开始 / 结束</span>
        </div>
        <div className="gantt-empty-row">暂无任务，点击上方按钮添加</div>
      </div>
    );
  }

  return (
    <div className="gantt-left-panel">
      <div className="gantt-left-header">
        <span></span>
        <span>任务名称</span>
        <span>负责人</span>
        <span>进度</span>
        <span>开始 / 结束</span>
      </div>
      <div className="gantt-task-list">
        {visibleTasks.map((task) => {
          const hasChildren = getChildren(state, task.id).length > 0;
          const isSelected = task.id === selectedTaskId;

          return (
            <div
              key={task.id}
              className={`gantt-task-row ${isSelected ? 'gantt-task-row-selected' : ''}`}
              onClick={() => onSelectTask(task.id)}
            >
              <div style={{ paddingLeft: `${task.depth * 16}px` }}>
                {hasChildren ? (
                  <button
                    className="gantt-expand-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand(task.id);
                    }}
                  >
                    {task.expanded ? '▾' : '▸'}
                  </button>
                ) : (
                  <div className="gantt-expand-btn-placeholder" />
                )}
              </div>

              <div className="gantt-task-name" onClick={(e) => e.stopPropagation()}>
                <EditableCell
                  value={task.name}
                  placeholder="任务名称"
                  onSave={(val) => onUpdateTask(task.id, { name: val })}
                />
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <EditableCell
                  value={task.assignee}
                  placeholder="负责人"
                  onSave={(val) => onUpdateTask(task.id, { assignee: val })}
                />
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div className="gantt-progress-bar" style={{ width: '90%' }}>
                    <div
                      className="gantt-progress-fill"
                      style={{ width: `${Math.max(0, Math.min(100, task.progress || 0))}%` }}
                    />
                  </div>
                  <EditableCell
                    value={task.progress}
                    type="number"
                    placeholder="0%"
                    onSave={(val) => onUpdateTask(task.id, { progress: val })}
                  />
                </div>
              </div>

              <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <EditableCell
                  value={task.startDate}
                  type="date"
                  placeholder="开始日期"
                  onSave={(val) => onUpdateTask(task.id, { startDate: val })}
                />
                <EditableCell
                  value={task.endDate}
                  type="date"
                  placeholder="结束日期"
                  onSave={(val) => onUpdateTask(task.id, { endDate: val })}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
