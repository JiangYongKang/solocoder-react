import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import TaskList from './TaskList.jsx';
import Timeline from './Timeline.jsx';
import ContextMenu from './ContextMenu.jsx';
import { ZOOM_LEVELS } from './constants.js';
import {
  loadTasks,
  saveTasks,
  addTask,
  updateTask,
  deleteTask,
  toggleExpanded,
  addDependency,
  removeDependency,
  getTask,
} from './ganttUtils.js';
import './gantt-chart.css';

export default function GanttChartPage() {
  const [state, setState] = useState(() => loadTasks());
  const [zoomLevel, setZoomLevel] = useState(ZOOM_LEVELS.WEEK);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const taskListRef = useRef(null);
  const timelineRef = useRef(null);
  const isSyncingScroll = useRef(false);

  useEffect(() => {
    saveTasks(state);
  }, [state]);

  useEffect(() => {
    const taskListEl = taskListRef.current?.getScrollElement();
    const timelineEl = timelineRef.current?.getScrollElement();
    if (!taskListEl || !timelineEl) return;

    const handleTaskListScroll = () => {
      if (isSyncingScroll.current) return;
      isSyncingScroll.current = true;
      timelineRef.current?.setScrollTop(taskListEl.scrollTop);
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    };

    const handleTimelineScroll = () => {
      if (isSyncingScroll.current) return;
      isSyncingScroll.current = true;
      taskListRef.current?.setScrollTop(timelineEl.scrollTop);
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    };

    taskListEl.addEventListener('scroll', handleTaskListScroll);
    timelineEl.addEventListener('scroll', handleTimelineScroll);

    return () => {
      taskListEl.removeEventListener('scroll', handleTaskListScroll);
      timelineEl.removeEventListener('scroll', handleTimelineScroll);
    };
  }, []);

  const handleToggleExpand = (taskId) => {
    setState((prev) => toggleExpanded(prev, taskId));
  };

  const handleUpdateTask = (taskId, updates) => {
    setState((prev) => updateTask(prev, taskId, updates));
  };

  const handleAddTask = () => {
    setState((prev) => addTask(prev, {}));
  };

  const handleAddSubtask = (parentId) => {
    setState((prev) => addTask(prev, {}, parentId));
    setState((prev) => toggleExpanded(prev, parentId));
  };

  const handleDeleteTask = (taskId) => {
    setState((prev) => deleteTask(prev, taskId));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  const handleAddDependency = (taskId, dependencyId) => {
    setState((prev) => addDependency(prev, taskId, dependencyId));
  };

  const handleRemoveDependency = (taskId, dependencyId) => {
    setState((prev) => removeDependency(prev, taskId, dependencyId));
  };

  const handleContextMenu = (e, task) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <div className="gantt-page">
      <div className="gantt-header">
        <div className="gantt-header-left">
          <Link to="/" className="gantt-back-link">← 返回首页</Link>
          <h1 className="gantt-title">项目甘特图</h1>
        </div>
        <div className="gantt-toolbar">
          <div className="gantt-zoom-group">
            <button
              className={`gantt-zoom-btn ${zoomLevel === ZOOM_LEVELS.DAY ? 'gantt-zoom-btn-active' : ''}`}
              onClick={() => setZoomLevel(ZOOM_LEVELS.DAY)}
            >
              日
            </button>
            <button
              className={`gantt-zoom-btn ${zoomLevel === ZOOM_LEVELS.WEEK ? 'gantt-zoom-btn-active' : ''}`}
              onClick={() => setZoomLevel(ZOOM_LEVELS.WEEK)}
            >
              周
            </button>
            <button
              className={`gantt-zoom-btn ${zoomLevel === ZOOM_LEVELS.MONTH ? 'gantt-zoom-btn-active' : ''}`}
              onClick={() => setZoomLevel(ZOOM_LEVELS.MONTH)}
            >
              月
            </button>
          </div>
          <button className="gantt-add-btn" onClick={handleAddTask}>
            + 添加任务
          </button>
        </div>
      </div>

      <div className="gantt-container">
        <TaskList
          ref={taskListRef}
          state={state}
          onToggleExpand={handleToggleExpand}
          onUpdateTask={handleUpdateTask}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
        />
        <Timeline
          ref={timelineRef}
          state={state}
          zoomLevel={zoomLevel}
          onUpdateTask={handleUpdateTask}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onContextMenu={handleContextMenu}
        />
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          task={contextMenu.task}
          allTasks={state.tasks}
          onAddDependency={handleAddDependency}
          onRemoveDependency={handleRemoveDependency}
          onAddSubtask={handleAddSubtask}
          onDeleteTask={handleDeleteTask}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
}
