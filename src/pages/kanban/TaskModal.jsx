import { useState } from 'react';
import { PRIORITIES, PRIORITY_LABELS, PRIORITY_ORDER, TAGS, STATUS_LABELS, STATUS_ORDER } from './constants.js';
import { validateTask } from './kanbanUtils.js';

export default function TaskModal({ isOpen, task, defaultStatus, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(task ? task.title || '' : '');
  const [description, setDescription] = useState(task ? task.description || '' : '');
  const [priority, setPriority] = useState(task ? task.priority || PRIORITIES.MEDIUM : PRIORITIES.MEDIUM);
  const [selectedTags, setSelectedTags] = useState(
    task && Array.isArray(task.tags) ? [...task.tags] : []
  );
  const [status, setStatus] = useState(task ? task.status || defaultStatus : defaultStatus);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { title, description, priority, tags: selectedTags, status };
    const { valid, errors: validationErrors } = validateTask(payload);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }
    onSave && onSave(payload);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('确定要删除这个任务吗？')) {
      onDelete();
    }
  };

  return (
    <div className="kanban-modal-overlay" onClick={onClose}>
      <div className="kanban-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kanban-modal-header">
          <h2>{task ? '编辑任务' : '新建任务'}</h2>
          <button type="button" className="kanban-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="kanban-modal-body" onSubmit={handleSubmit}>
          <div className="kanban-form-field">
            <label>标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              className={errors.title ? 'kanban-input-error' : ''}
            />
            {errors.title && <div className="kanban-error">{errors.title}</div>}
          </div>

          <div className="kanban-form-field">
            <label>描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入任务描述"
              rows={4}
            />
          </div>

          <div className="kanban-form-field">
            <label>优先级</label>
            <div className="kanban-radio-group">
              {PRIORITY_ORDER.map((p) => (
                <label key={p} className={`kanban-radio ${priority === p ? 'kanban-radio-active' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                  />
                  {PRIORITY_LABELS[p]}
                </label>
              ))}
            </div>
          </div>

          <div className="kanban-form-field">
            <label>标签（可多选）</label>
            <div className="kanban-tag-options">
              {TAGS.map((tag) => (
                <label
                  key={tag}
                  className={`kanban-tag-option ${selectedTags.includes(tag) ? 'kanban-tag-option-active' : ''}`}
                >
                  <input
                    type="checkbox"
                    value={tag}
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          {task && (
            <div className="kanban-form-field">
              <label>状态</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          )}

          <div className="kanban-modal-actions">
            {task && (
              <button type="button" className="kanban-btn kanban-btn-danger" onClick={handleDelete}>
                删除
              </button>
            )}
            <div className="kanban-modal-actions-right">
              <button type="button" className="kanban-btn kanban-btn-ghost" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="kanban-btn kanban-btn-primary">
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
