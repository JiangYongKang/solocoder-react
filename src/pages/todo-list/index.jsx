import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import './todo-list.css'
import {
  PRIORITIES,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_BG_COLORS,
  GROUP_COLORS,
  FILTER_PRIORITY_ALL,
  FILTER_STATUS_ALL,
  FILTER_STATUS_PENDING,
  FILTER_STATUS_DONE,
  FILTER_DUE_ALL,
  FILTER_DUE_TODAY,
  FILTER_DUE_WEEK,
  FILTER_DUE_OVERDUE,
  ALL_TASKS_VIEW,
} from './constants'
import {
  loadGroups,
  saveGroups,
  loadTasks,
  saveTasks,
  loadCheckins,
  saveCheckins,
  createGroup,
  renameGroup,
  deleteGroup,
  createTask,
  updateTask,
  deleteTask,
  deleteTasksByGroup,
  findTaskById,
  addSubtask,
  calculateProgress,
  toggleTaskCompletion,
  reorderTasks,
  reorderSubtasks,
  isOverdue,
  getDueDateLabel,
  countGroupIncomplete,
  countAllIncomplete,
  filterTasks,
  getOverdueCount,
  sortTasksWithOverdueFirst,
  recordCheckin,
  calculateStreak,
  calculateMaxStreak,
  buildHeatmapData,
  getHeatmapColor,
} from './todoUtils'

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="tdl-confirm-overlay" onClick={onCancel}>
      <div className="tdl-confirm-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="tdl-confirm-title">{title}</h3>
        <p className="tdl-confirm-message">{message}</p>
        <div className="tdl-confirm-actions">
          <button className="tdl-btn tdl-btn-ghost" onClick={onCancel}>取消</button>
          <button className="tdl-btn tdl-btn-danger" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  )
}

function GroupModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(GROUP_COLORS[0])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name, color })
  }

  return (
    <div className="tdl-modal-overlay" onClick={onClose}>
      <div className="tdl-modal" onClick={e => e.stopPropagation()}>
        <div className="tdl-modal-header">
          <h2>新建分组</h2>
          <button className="tdl-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="tdl-modal-body">
          <div className="tdl-form-field">
            <label>分组名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="输入分组名称" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>
          <div className="tdl-form-field">
            <label>颜色标识</label>
            <div className="tdl-color-options">
              {GROUP_COLORS.map(c => (
                <div key={c} className={`tdl-color-option ${color === c ? 'tdl-color-option-active' : ''}`}
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className="tdl-modal-actions">
            <div />
            <div className="tdl-modal-actions-right">
              <button className="tdl-btn tdl-btn-ghost" onClick={onClose}>取消</button>
              <button className="tdl-btn tdl-btn-primary" onClick={handleSave} disabled={!name.trim()}>创建</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskModal({ groupId, task, onClose, onSave, onDelete }) {
  const isEdit = !!task
  const [title, setTitle] = useState(task?.title || '')
  const [priority, setPriority] = useState(task?.priority || PRIORITIES.MEDIUM)
  const [dueDate, setDueDate] = useState(task?.dueDate || '')

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title, priority, dueDate: dueDate || null, groupId })
  }

  return (
    <div className="tdl-modal-overlay" onClick={onClose}>
      <div className="tdl-modal" onClick={e => e.stopPropagation()}>
        <div className="tdl-modal-header">
          <h2>{isEdit ? '编辑任务' : '新建任务'}</h2>
          <button className="tdl-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="tdl-modal-body">
          <div className="tdl-form-field">
            <label>任务标题</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="输入任务标题" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>
          <div className="tdl-form-field">
            <label>优先级</label>
            <div className="tdl-priority-options">
              {Object.values(PRIORITIES).map(p => (
                <div key={p}
                  className={`tdl-priority-option ${priority === p ? 'tdl-priority-option-active' : ''}`}
                  onClick={() => setPriority(p)}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[p] }} />
                  {PRIORITY_LABELS[p]}
                </div>
              ))}
            </div>
          </div>
          <div className="tdl-form-field">
            <label>截止日期</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="tdl-modal-actions">
            {isEdit && onDelete ? (
              <button className="tdl-btn tdl-btn-danger" onClick={onDelete}>删除任务</button>
            ) : <div />}
            <div className="tdl-modal-actions-right">
              <button className="tdl-btn tdl-btn-ghost" onClick={onClose}>取消</button>
              <button className="tdl-btn tdl-btn-primary" onClick={handleSave} disabled={!title.trim()}>
                {isEdit ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubtaskInput({ parentId, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && title.trim()) {
      onSave(parentId, { title, priority: PRIORITIES.MEDIUM, dueDate: null })
      setTitle('')
    }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div style={{ paddingLeft: 28, marginTop: 4 }}>
      <input className="tdl-inline-input" ref={inputRef}
        value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown} placeholder="输入子任务标题" />
    </div>
  )
}

function SubtaskItem({ subtask, onToggle, onDelete, onAddSubtask, expandedIds, setExpandedIds, onDragStart, onDragEnd, draggingTaskId, dropIndicator, onDragOver, onDrop, subtaskDepth = 1 }) {
  const isExpanded = expandedIds.has(subtask.id)
  const dueLabel = getDueDateLabel(subtask.dueDate)
  const progress = calculateProgress(subtask)
  const hasSubtasks = subtask.subtasks && subtask.subtasks.length > 0
  const isDragging = draggingTaskId === subtask.id
  const indent = subtaskDepth * 28

  return (
    <>
      <div className={`tdl-subtask-item ${subtask.completed ? 'tdl-subtask-completed' : ''}`}
        draggable onDragStart={e => onDragStart(e, subtask)} onDragEnd={onDragEnd}
        style={{ opacity: isDragging ? 0.4 : 1, paddingLeft: indent - 28 }}>
        <button className={`tdl-subtask-checkbox ${subtask.completed ? 'tdl-subtask-checkbox-checked' : ''}`}
          onClick={() => onToggle(subtask.id)}>
          {subtask.completed && '✓'}
        </button>
        <span className="tdl-subtask-title">{subtask.title}</span>
        {dueLabel && (
          <span className="tdl-due-badge" style={{ background: `${dueLabel.color}20`, color: dueLabel.color, fontSize: 10 }}>
            {dueLabel.text}
          </span>
        )}
        {hasSubtasks && (
          <button className="tdl-subtask-toggle" onClick={() => {
            setExpandedIds(prev => {
              const next = new Set(prev)
              next.has(subtask.id) ? next.delete(subtask.id) : next.add(subtask.id)
              return next
            })
          }}>
            {isExpanded ? '▼' : '▶'} {subtask.subtasks.length}
          </button>
        )}
        <div className="tdl-subtask-actions">
          <button className="tdl-task-action-btn" onClick={() => onAddSubtask(subtask.id)} title="添加子任务">+</button>
          <button className="tdl-task-action-btn tdl-task-action-btn-danger" onClick={() => onDelete(subtask.id)} title="删除">✕</button>
        </div>
      </div>
      {isExpanded && hasSubtasks && (
        <div onDragOver={e => onDragOver(e, subtask.id)} onDrop={e => onDrop(e, subtask.id)}>
          {subtask.subtasks.map((s, i) => (
            <div key={s.id} data-index={i}>
              {dropIndicator && dropIndicator.parentId === subtask.id && dropIndicator.index === i && (
                <div className="tdl-drop-indicator" />
              )}
              <SubtaskItem subtask={s} onToggle={onToggle} onDelete={onDelete}
                onAddSubtask={onAddSubtask} expandedIds={expandedIds} setExpandedIds={setExpandedIds}
                onDragStart={onDragStart} onDragEnd={onDragEnd} draggingTaskId={draggingTaskId}
                dropIndicator={dropIndicator} onDragOver={onDragOver} onDrop={onDrop}
                subtaskDepth={subtaskDepth + 1} />
            </div>
          ))}
          {dropIndicator && dropIndicator.parentId === subtask.id && dropIndicator.index === subtask.subtasks.length && (
            <div className="tdl-drop-indicator" />
          )}
        </div>
      )}
      {hasSubtasks && progress.total > 0 && (
        <div className="tdl-progress-bar-container" style={{ paddingLeft: indent }}>
          <div className="tdl-progress-bar">
            <div className="tdl-progress-bar-fill" style={{ width: `${progress.percentage}%` }} />
          </div>
          <span className="tdl-progress-text">{progress.completed}/{progress.total}</span>
        </div>
      )}
    </>
  )
}

function TaskCard({ task, onToggle, onDelete, onEdit, onAddSubtask, expandedIds, setExpandedIds, onDragStart, onDragEnd, draggingTaskId, dropIndicator, onDragOver, onDrop, index }) {
  const isExpanded = expandedIds.has(task.id)
  const dueLabel = getDueDateLabel(task.dueDate)
  const progress = calculateProgress(task)
  const hasSubtasks = task.subtasks && task.subtasks.length > 0
  const isDragging = draggingTaskId === task.id
  const overdue = !task.completed && isOverdue(task.dueDate)

  return (
    <div className={`tdl-task-card ${task.completed ? 'tdl-task-card-completed' : ''} ${overdue ? 'tdl-task-card-overdue' : ''} ${isDragging ? 'tdl-task-card-dragging' : ''}`}
      draggable onDragStart={e => onDragStart(e, task)} onDragEnd={onDragEnd}
      data-index={index}>
      <div className="tdl-task-main">
        <button className={`tdl-task-checkbox ${task.completed ? 'tdl-task-checkbox-checked' : ''}`}
          onClick={() => onToggle(task.id)}>
          {task.completed && '✓'}
        </button>
        <div className="tdl-task-content">
          <div className="tdl-task-title-row">
            <span className="tdl-task-title">{task.title}</span>
            <span className="tdl-priority-badge"
              style={{ background: PRIORITY_BG_COLORS[task.priority], color: PRIORITY_COLORS[task.priority] }}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            {dueLabel && (
              <span className="tdl-due-badge" style={{ background: `${dueLabel.color}20`, color: dueLabel.color }}>
                {dueLabel.text}
              </span>
            )}
            {task.dueDate && !dueLabel && (
              <span className="tdl-due-date-text">{task.dueDate}</span>
            )}
          </div>
          {hasSubtasks && progress.total > 0 && (
            <div className="tdl-progress-bar-container">
              <div className="tdl-progress-bar">
                <div className="tdl-progress-bar-fill" style={{ width: `${progress.percentage}%` }} />
              </div>
              <span className="tdl-progress-text">{progress.completed}/{progress.total} · {progress.percentage}%</span>
            </div>
          )}
        </div>
        <div className="tdl-task-actions">
          {hasSubtasks && (
            <button className="tdl-subtask-toggle" onClick={() => {
              setExpandedIds(prev => {
                const next = new Set(prev)
                next.has(task.id) ? next.delete(task.id) : next.add(task.id)
                return next
              })
            }}>
              {isExpanded ? '▼' : '▶'} {task.subtasks.length}
            </button>
          )}
          <button className="tdl-task-action-btn" onClick={() => onAddSubtask(task.id)} title="添加子任务">+</button>
          <button className="tdl-task-action-btn" onClick={() => onEdit(task)} title="编辑">✎</button>
          <button className="tdl-task-action-btn tdl-task-action-btn-danger" onClick={() => onDelete(task.id)} title="删除">✕</button>
        </div>
      </div>
      {isExpanded && hasSubtasks && (
        <div className="tdl-subtask-list"
          onDragOver={e => onDragOver(e, task.id)} onDrop={e => onDrop(e, task.id)}>
          {task.subtasks.map((s, i) => (
            <div key={s.id} data-index={i}>
              {dropIndicator && dropIndicator.parentId === task.id && dropIndicator.index === i && (
                <div className="tdl-drop-indicator" />
              )}
              <SubtaskItem subtask={s} onToggle={onToggle} onDelete={onDelete}
                onAddSubtask={onAddSubtask} expandedIds={expandedIds} setExpandedIds={setExpandedIds}
                onDragStart={onDragStart} onDragEnd={onDragEnd} draggingTaskId={draggingTaskId}
                dropIndicator={dropIndicator} onDragOver={onDragOver} onDrop={onDrop} />
            </div>
          ))}
          {dropIndicator && dropIndicator.parentId === task.id && dropIndicator.index === task.subtasks.length && (
            <div className="tdl-drop-indicator" />
          )}
        </div>
      )}
    </div>
  )
}

export default function TodoListPage() {
  const [groups, setGroups] = useState(() => loadGroups())
  const [tasks, setTasks] = useState(() => loadTasks())
  const [checkins, setCheckins] = useState(() => loadCheckins())
  const [selectedGroup, setSelectedGroup] = useState(ALL_TASKS_VIEW)
  const [filters, setFilters] = useState({
    priority: FILTER_PRIORITY_ALL,
    status: FILTER_STATUS_ALL,
    dueDate: FILTER_DUE_ALL,
  })
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [newTaskGroupId, setNewTaskGroupId] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [renamingGroupId, setRenamingGroupId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null)
  const [draggingTaskId, setDraggingTaskId] = useState(null)
  const [dropIndicator, setDropIndicator] = useState(null)

  useEffect(() => { saveGroups(groups) }, [groups])
  useEffect(() => { saveTasks(tasks) }, [tasks])
  useEffect(() => { saveCheckins(checkins) }, [checkins])

  const getGroupTasks = useCallback((groupId) => {
    let groupTasks = groupId === ALL_TASKS_VIEW
      ? tasks.filter(t => !t.parentId)
      : tasks.filter(t => t.groupId === groupId && !t.parentId)

    groupTasks = filterTasks(groupTasks, filters)
    groupTasks = sortTasksWithOverdueFirst(groupTasks)
    return groupTasks
  }, [tasks, filters])

  const overdueCount = getOverdueCount(tasks.filter(t => !t.parentId))

  const handleToggle = useCallback((taskId) => {
    setTasks(prev => {
      const updated = toggleTaskCompletion(prev, taskId)
      return updated
    })
    setCheckins(prev => recordCheckin(prev))
  }, [])

  const handleDeleteTask = useCallback((taskId) => {
    setTasks(prev => deleteTask(prev, taskId))
  }, [])

  const handleEditTask = useCallback((task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }, [])

  const handleSaveTask = useCallback((data) => {
    if (editingTask) {
      setTasks(prev => updateTask(prev, editingTask.id, {
        title: data.title,
        priority: data.priority,
        dueDate: data.dueDate,
      }))
    } else {
      const gid = data.groupId || newTaskGroupId || (selectedGroup !== ALL_TASKS_VIEW ? selectedGroup : groups[0]?.id)
      if (!gid) return
      setTasks(prev => createTask(prev, { ...data, groupId: gid }))
    }
    setShowTaskModal(false)
    setEditingTask(null)
  }, [editingTask, newTaskGroupId, selectedGroup, groups])

  const handleAddSubtask = useCallback((parentId, data) => {
    setTasks(prev => addSubtask(prev, parentId, data))
    setExpandedIds(prev => new Set([...prev, parentId]))
  }, [])

  const handleAddGroup = useCallback(({ name, color }) => {
    setGroups(prev => createGroup(prev, name, color))
    setShowGroupModal(false)
  }, [])

  const handleRenameGroup = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    setRenamingGroupId(groupId)
    setRenameValue(group.name)
  }, [groups])

  const handleRenameSubmit = useCallback((groupId) => {
    if (!renameValue.trim()) {
      setRenamingGroupId(null)
      return
    }
    setGroups(prev => renameGroup(prev, groupId, renameValue))
    setRenamingGroupId(null)
  }, [renameValue])

  const handleDeleteGroup = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    setConfirmDialog({
      title: '删除分组',
      message: `确定要删除分组「${group.name}」吗？该分组下的所有任务也将被删除。`,
      onConfirm: () => {
        setGroups(prev => deleteGroup(prev, groupId))
        setTasks(prev => deleteTasksByGroup(prev, groupId))
        if (selectedGroup === groupId) setSelectedGroup(ALL_TASKS_VIEW)
        setConfirmDialog(null)
      },
    })
  }, [groups, selectedGroup])

  const handleDragStart = useCallback((e, task) => {
    setDraggingTaskId(task.id)
    try {
      e.dataTransfer.setData('text/plain', task.id)
    } catch { /* ignore */ }
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null)
    setDropIndicator(null)
  }, [])

  const getDropIndex = (containerEl, clientY) => {
    const children = containerEl.children
    let cardCount = 0
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child.dataset || child.dataset.index === undefined) continue
      const rect = child.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      if (clientY < midpoint) return cardCount
      cardCount++
    }
    return cardCount
  }

  const handleDragOverTaskList = useCallback((e, parentId) => {
    e.preventDefault()
    if (!draggingTaskId) return
    const container = e.currentTarget
    const targetIndex = getDropIndex(container, e.clientY)
    setDropIndicator({ parentId, index: targetIndex })
  }, [draggingTaskId])

  const handleDropTaskList = useCallback((e, parentId) => {
    e.preventDefault()
    const taskId = draggingTaskId
    if (!taskId) {
      setDraggingTaskId(null)
      setDropIndicator(null)
      return
    }

    const container = e.currentTarget
    const targetIndex = getDropIndex(container, e.clientY)

    if (parentId === null) {
      const currentTasks = selectedGroup === ALL_TASKS_VIEW
        ? tasks.filter(t => !t.parentId)
        : tasks.filter(t => t.groupId === selectedGroup && !t.parentId)
      const fromIndex = currentTasks.findIndex(t => t.id === taskId)
      if (fromIndex !== -1) {
        setTasks(prev => {
          const reordered = reorderTasks(
            prev.filter(t => !t.parentId),
            fromIndex,
            targetIndex
          )
          const otherTasks = prev.filter(t => t.parentId)
          return [...reordered, ...otherTasks]
        })
      }
    } else {
      const parentTask = findTaskById(tasks, parentId)
      if (parentTask) {
        const fromIndex = parentTask.subtasks.findIndex(s => s.id === taskId)
        if (fromIndex !== -1) {
          setTasks(prev => reorderSubtasks(prev, parentId, fromIndex, targetIndex))
        }
      }
    }
    setDraggingTaskId(null)
    setDropIndicator(null)
  }, [draggingTaskId, tasks, selectedGroup])

  const handleOverdueClick = useCallback(() => {
    setFilters(prev => ({ ...prev, dueDate: FILTER_DUE_OVERDUE }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({ priority: FILTER_PRIORITY_ALL, status: FILTER_STATUS_ALL, dueDate: FILTER_DUE_ALL })
  }, [])

  const hasActiveFilters = filters.priority !== FILTER_PRIORITY_ALL || filters.status !== FILTER_STATUS_ALL || filters.dueDate !== FILTER_DUE_ALL

  const streak = calculateStreak(checkins)
  const maxStreak = calculateMaxStreak(checkins)
  const heatmapData = buildHeatmapData(checkins)

  const currentGroupTasks = getGroupTasks(selectedGroup)

  return (
    <div className="tdl-page">
      <div className="tdl-header">
        <div className="tdl-header-left">
          <Link to="/" className="tdl-back-link">← 返回首页</Link>
          <h1 className="tdl-title">待办清单</h1>
        </div>
      </div>

      <div className="tdl-streak-bar">
        <div className="tdl-streak-item">
          <span>🔥</span>
          <span className="tdl-streak-number">{streak}</span>
          <span className="tdl-streak-label">已连续打卡天</span>
        </div>
        <div className="tdl-streak-item">
          <span>🏆</span>
          <span className="tdl-streak-number">{maxStreak}</span>
          <span className="tdl-streak-label">最长连续打卡</span>
        </div>
        <div className="tdl-heatmap">
          {heatmapData.map(d => (
            <div key={d.date} className="tdl-heatmap-cell"
              style={{ background: getHeatmapColor(d.count) }}
              title={`${d.date}${d.count > 0 ? ' ✓' : ''}`} />
          ))}
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="tdl-overdue-banner" onClick={handleOverdueClick}>
          ⚠️ {overdueCount} 个任务已过期
          <span style={{ fontSize: 12, opacity: 0.8 }}>（点击筛选查看）</span>
        </div>
      )}

      <div className="tdl-layout">
        <div className="tdl-sidebar">
          <div className="tdl-sidebar-title">分组</div>

          <div className={`tdl-group-item ${selectedGroup === ALL_TASKS_VIEW ? 'tdl-group-item-active' : ''}`}
            onClick={() => setSelectedGroup(ALL_TASKS_VIEW)}>
            <div className="tdl-group-color" style={{ background: 'var(--accent)' }} />
            <span className="tdl-group-name">所有任务</span>
            <span className="tdl-group-badge">{countAllIncomplete(tasks)}</span>
          </div>

          {groups.map(g => (
            <div key={g.id} className={`tdl-group-item ${selectedGroup === g.id ? 'tdl-group-item-active' : ''}`}
              onClick={() => {
                if (renamingGroupId === g.id) return
                setSelectedGroup(g.id)
              }}>
              <div className="tdl-group-color" style={{ background: g.color }} />
              {renamingGroupId === g.id ? (
                <input className="tdl-inline-input" value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(g.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameSubmit(g.id)
                    if (e.key === 'Escape') setRenamingGroupId(null)
                  }}
                  onClick={e => e.stopPropagation()}
                  autoFocus />
              ) : (
                <span className="tdl-group-name">{g.name}</span>
              )}
              <span className="tdl-group-badge">{countGroupIncomplete(tasks, g.id)}</span>
              <div className="tdl-group-actions">
                <button className="tdl-group-action-btn" onClick={e => { e.stopPropagation(); handleRenameGroup(g.id) }} title="重命名">✎</button>
                <button className="tdl-group-action-btn tdl-group-action-btn-danger" onClick={e => { e.stopPropagation(); handleDeleteGroup(g.id) }} title="删除">✕</button>
              </div>
            </div>
          ))}

          <button className="tdl-add-group-btn" onClick={() => setShowGroupModal(true)}>+ 新建分组</button>
        </div>

        <div className="tdl-main">
          <div className="tdl-filter-bar">
            <div className="tdl-filter-row">
              <span className="tdl-filter-label">优先级</span>
              {[{ val: FILTER_PRIORITY_ALL, label: '全部' }, ...Object.values(PRIORITIES).map(p => ({ val: p, label: PRIORITY_LABELS[p] }))].map(opt => (
                <button key={opt.val}
                  className={`tdl-filter-chip ${filters.priority === opt.val ? 'tdl-filter-chip-active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, priority: opt.val }))}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="tdl-filter-row">
              <span className="tdl-filter-label">状态</span>
              {[
                { val: FILTER_STATUS_ALL, label: '全部' },
                { val: FILTER_STATUS_PENDING, label: '未完成' },
                { val: FILTER_STATUS_DONE, label: '已完成' },
              ].map(opt => (
                <button key={opt.val}
                  className={`tdl-filter-chip ${filters.status === opt.val ? 'tdl-filter-chip-active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, status: opt.val }))}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="tdl-filter-row">
              <span className="tdl-filter-label">截止日期</span>
              <select className="tdl-filter-select" value={filters.dueDate}
                onChange={e => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}>
                <option value={FILTER_DUE_ALL}>全部</option>
                <option value={FILTER_DUE_TODAY}>今天</option>
                <option value={FILTER_DUE_WEEK}>本周</option>
                <option value={FILTER_DUE_OVERDUE}>已过期</option>
              </select>
              {hasActiveFilters && (
                <button className="tdl-clear-filter-btn" onClick={clearFilters}>清除筛选</button>
              )}
            </div>
          </div>

          <div className="tdl-task-list"
            onDragOver={e => handleDragOverTaskList(e, null)}
            onDrop={e => handleDropTaskList(e, null)}>
            {currentGroupTasks.map((task, i) => (
              <div key={task.id} data-index={i}>
                {dropIndicator && dropIndicator.parentId === null && dropIndicator.index === i && (
                  <div className="tdl-drop-indicator" />
                )}
                <TaskCard task={task} onToggle={handleToggle} onDelete={handleDeleteTask}
                  onEdit={handleEditTask} onAddSubtask={(pid) => setAddingSubtaskFor(pid)}
                  expandedIds={expandedIds} setExpandedIds={setExpandedIds}
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                  draggingTaskId={draggingTaskId} dropIndicator={dropIndicator}
                  onDragOver={handleDragOverTaskList} onDrop={handleDropTaskList}
                  index={i} parentId={null} />
                {addingSubtaskFor === task.id && (
                  <SubtaskInput parentId={task.id} onSave={handleAddSubtask}
                    onCancel={() => setAddingSubtaskFor(null)} />
                )}
              </div>
            ))}
            {dropIndicator && dropIndicator.parentId === null && dropIndicator.index === currentGroupTasks.length && (
              <div className="tdl-drop-indicator" />
            )}
          </div>

          {currentGroupTasks.length === 0 && (
            <div className="tdl-empty">
              {hasActiveFilters ? '没有符合筛选条件的任务' : '暂无任务，点击下方按钮创建'}
            </div>
          )}

          <button className="tdl-add-task-btn" onClick={() => {
            setEditingTask(null)
            const gid = selectedGroup !== ALL_TASKS_VIEW ? selectedGroup : groups[0]?.id
            setNewTaskGroupId(gid)
            setShowTaskModal(true)
          }}>
            + 新建任务
          </button>
        </div>
      </div>

      {showGroupModal && (
        <GroupModal onClose={() => setShowGroupModal(false)} onSave={handleAddGroup} />
      )}

      {showTaskModal && (
        <TaskModal
          groupId={newTaskGroupId || (selectedGroup !== ALL_TASKS_VIEW ? selectedGroup : groups[0]?.id)}
          task={editingTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null) }}
          onSave={handleSaveTask}
          onDelete={editingTask ? () => {
            handleDeleteTask(editingTask.id)
            setShowTaskModal(false)
            setEditingTask(null)
          } : null}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
