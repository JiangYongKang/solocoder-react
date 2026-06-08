import { useRef, useState, useEffect, useMemo } from 'react';
import {
  ZOOM_LEVELS,
  DAY_WIDTH,
  ROW_HEIGHT,
  BAR_HEIGHT,
  BAR_VERTICAL_OFFSET,
} from './constants.js';
import {
  getVisibleTasks,
  getDateRange,
  getTimelineDays,
  getWeekGroups,
  getMonthGroups,
  isWeekend,
  isSameDay,
  formatDate,
  parseDate,
  calculateBarPosition,
  pxToDate,
  diffDays,
  addDays,
  getTask,
  getDependencyPath,
} from './ganttUtils.js';

export default function Timeline({
  state,
  zoomLevel,
  onUpdateTask,
  selectedTaskId,
  onSelectTask,
  onContextMenu,
}) {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragTooltip, setDragTooltip] = useState(null);
  const dayWidth = DAY_WIDTH[zoomLevel];

  const range = useMemo(() => getDateRange(state), [state]);
  const days = useMemo(() => getTimelineDays(range), [range]);
  const weekGroups = useMemo(() => getWeekGroups(days), [days]);
  const monthGroups = useMemo(() => getMonthGroups(days), [days]);
  const visibleTasks = useMemo(() => getVisibleTasks(state), [state]);

  const totalWidth = days.length * dayWidth;
  const totalHeight = visibleTasks.length * ROW_HEIGHT;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleMouseDown = (e, task, mode) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectTask(task.id);

    const startX = e.clientX;
    const originalStart = parseDate(task.startDate);
    const originalEnd = parseDate(task.endDate);

    setDragging({
      taskId: task.id,
      mode,
      startX,
      originalStart,
      originalEnd,
      currentX: startX,
    });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e) => {
      const deltaPx = e.clientX - dragging.startX;
      const deltaDays = Math.round(deltaPx / dayWidth);

      let newStart = new Date(dragging.originalStart);
      let newEnd = new Date(dragging.originalEnd);

      if (dragging.mode === 'move') {
        newStart = addDays(dragging.originalStart, deltaDays);
        newEnd = addDays(dragging.originalEnd, deltaDays);
      } else if (dragging.mode === 'resize-left') {
        newStart = addDays(dragging.originalStart, deltaDays);
        if (newStart > newEnd) newStart = new Date(newEnd);
      } else if (dragging.mode === 'resize-right') {
        newEnd = addDays(dragging.originalEnd, deltaDays);
        if (newEnd < newStart) newEnd = new Date(newStart);
      }

      setDragging((prev) => ({ ...prev, currentX: e.clientX }));
      setDragTooltip({
        x: e.clientX,
        y: e.clientY - 40,
        start: formatDate(newStart),
        end: formatDate(newEnd),
      });
    };

    const handleMouseUp = (e) => {
      const deltaPx = e.clientX - dragging.startX;
      const deltaDays = Math.round(deltaPx / dayWidth);

      let newStart = new Date(dragging.originalStart);
      let newEnd = new Date(dragging.originalEnd);

      if (dragging.mode === 'move') {
        newStart = addDays(dragging.originalStart, deltaDays);
        newEnd = addDays(dragging.originalEnd, deltaDays);
      } else if (dragging.mode === 'resize-left') {
        newStart = addDays(dragging.originalStart, deltaDays);
        if (newStart > newEnd) newStart = new Date(newEnd);
      } else if (dragging.mode === 'resize-right') {
        newEnd = addDays(dragging.originalEnd, deltaDays);
        if (newEnd < newStart) newEnd = new Date(newStart);
      }

      onUpdateTask(dragging.taskId, {
        startDate: formatDate(newStart),
        endDate: formatDate(newEnd),
      });

      setDragging(null);
      setDragTooltip(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dayWidth, onUpdateTask]);

  const isDraggingTask = (taskId) => dragging?.taskId === taskId;

  const renderHeader = () => {
    let primaryLabels = [];
    let secondaryLabels = [];

    if (zoomLevel === ZOOM_LEVELS.DAY) {
      primaryLabels = days.map((d, i) => ({
        key: `day-${i}`,
        left: i * dayWidth,
        width: dayWidth,
        label: d.getDate(),
        isWeekend: isWeekend(d),
        isToday: isSameDay(d, today),
      }));
      secondaryLabels = weekGroups.map((wg) => ({
        key: wg.key,
        left: days.indexOf(wg.days[0]) * dayWidth,
        width: wg.days.length * dayWidth,
        label: `${wg.start.getMonth() + 1}月 第${Math.ceil((wg.start.getDate()) / 7) + 1}周`,
      }));
    } else if (zoomLevel === ZOOM_LEVELS.WEEK) {
      primaryLabels = weekGroups.map((wg) => ({
        key: wg.key,
        left: days.indexOf(wg.days[0]) * dayWidth,
        width: wg.days.length * dayWidth,
        label: `${wg.start.getMonth() + 1}/${wg.start.getDate()}`,
      }));
      secondaryLabels = monthGroups.map((mg) => ({
        key: mg.key,
        left: days.indexOf(mg.days[0]) * dayWidth,
        width: mg.days.length * dayWidth,
        label: `${mg.start.getFullYear()}年${mg.start.getMonth() + 1}月`,
      }));
    } else {
      primaryLabels = monthGroups.map((mg) => ({
        key: mg.key,
        left: days.indexOf(mg.days[0]) * dayWidth,
        width: mg.days.length * dayWidth,
        label: `${mg.start.getFullYear()}/${mg.start.getMonth() + 1}`,
      }));
      const yearGroups = [];
      let currentYear = null;
      for (const mg of monthGroups) {
        const y = mg.start.getFullYear();
        if (!currentYear || currentYear.year !== y) {
          currentYear = { year: y, startMonthIndex: monthGroups.indexOf(mg), months: [mg] };
          yearGroups.push(currentYear);
        } else {
          currentYear.months.push(mg);
        }
      }
      secondaryLabels = yearGroups.map((yg) => {
        const firstDay = yg.months[0].days[0];
        const totalDays = yg.months.reduce((sum, m) => sum + m.days.length, 0);
        return {
          key: `year-${yg.year}`,
          left: days.indexOf(firstDay) * dayWidth,
          width: totalDays * dayWidth,
          label: `${yg.year}年`,
        };
      });
    }

    return (
      <div className="gantt-timeline-header" style={{ width: totalWidth }}>
        <div className="gantt-timeline-secondary">
          {secondaryLabels.map((lbl) => (
            <div
              key={lbl.key}
              className="gantt-timeline-label gantt-timeline-label-primary"
              style={{
                width: lbl.width,
                marginLeft: secondaryLabels.indexOf(lbl) === 0 ? lbl.left : 0,
              }}
            >
              {lbl.label}
            </div>
          ))}
        </div>
        <div className="gantt-timeline-primary">
          {primaryLabels.map((lbl) => (
            <div
              key={lbl.key}
              className={`gantt-timeline-label ${lbl.isWeekend ? 'gantt-timeline-label-weekend' : ''} ${lbl.isToday ? 'gantt-timeline-label-today' : ''}`}
              style={{
                width: lbl.width,
                marginLeft: primaryLabels.indexOf(lbl) === 0 ? lbl.left : 0,
              }}
            >
              {lbl.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGrid = () => (
    <div className="gantt-timeline-grid" style={{ width: totalWidth, height: totalHeight }}>
      {days.map((d, i) => (
        <div
          key={`grid-${i}`}
          className={`gantt-grid-line ${isWeekend(d) ? 'gantt-grid-line-weekend' : ''}`}
          style={{ left: i * dayWidth, width: dayWidth }}
        />
      ))}
      <div
        className="gantt-today-line"
        style={{ left: Math.max(0, diffDays(range.start, today)) * dayWidth + dayWidth / 2 }}
      />
    </div>
  );

  const renderRows = () =>
    visibleTasks.map((_, i) => (
      <div key={`row-${i}`} className="gantt-row-bg" style={{ top: i * ROW_HEIGHT }} />
    ));

  const renderTaskBars = () =>
    visibleTasks.map((task, i) => {
      const pos = calculateBarPosition(task, range.start, zoomLevel);
      const isDragging = isDraggingTask(task.id);
      const isSelected = task.id === selectedTaskId;

      return (
        <div
          key={task.id}
          className="gantt-task-bar-container"
          style={{ top: i * ROW_HEIGHT, width: totalWidth }}
        >
          <div
            className={`gantt-task-bar ${isDragging ? 'gantt-task-bar-dragging' : ''}`}
            style={{
              left: pos.left,
              width: Math.max(dayWidth, pos.width),
              top: BAR_VERTICAL_OFFSET,
              height: BAR_HEIGHT,
              boxShadow: isSelected ? '0 0 0 2px var(--accent)' : undefined,
            }}
            onMouseDown={(e) => handleMouseDown(e, task, 'move')}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(e, task);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectTask(task.id);
            }}
          >
            <div
              className="gantt-task-bar-progress"
              style={{ width: `${Math.max(0, Math.min(100, task.progress || 0))}%` }}
            />
            <span className="gantt-task-bar-label">{task.name}</span>
            <div
              className="gantt-task-bar-handle gantt-task-bar-handle-left"
              onMouseDown={(e) => handleMouseDown(e, task, 'resize-left')}
            />
            <div
              className="gantt-task-bar-handle gantt-task-bar-handle-right"
              onMouseDown={(e) => handleMouseDown(e, task, 'resize-right')}
            />
          </div>
        </div>
      );
    });

  const renderDependencies = () => {
    const paths = [];
    for (const task of visibleTasks) {
      for (const depId of task.dependencies) {
        const fromTask = getTask(state, depId);
        if (!fromTask) continue;
        const pathInfo = getDependencyPath(fromTask, task, state, range.start, zoomLevel);
        if (pathInfo) {
          paths.push({ id: `${depId}-${task.id}`, ...pathInfo });
        }
      }
    }

    if (paths.length === 0) return null;

    return (
      <svg
        className="gantt-dependency-layer"
        width={totalWidth}
        height={totalHeight}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon className="gantt-dependency-arrow" points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>
        {paths.map((p) => (
          <path
            key={p.id}
            className="gantt-dependency-line"
            d={p.path}
            markerEnd="url(#arrowhead)"
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="gantt-right-panel" ref={containerRef}>
      {renderHeader()}
      <div
        style={{
          position: 'relative',
          width: totalWidth,
          height: Math.max(totalHeight, 200),
          minWidth: '100%',
        }}
        onClick={() => onSelectTask(null)}
      >
        {renderGrid()}
        {renderRows()}
        {renderDependencies()}
        {renderTaskBars()}
      </div>

      {dragTooltip && (
        <div className="gantt-drag-tooltip" style={{ left: dragTooltip.x, top: dragTooltip.y }}>
          {dragTooltip.start} ~ {dragTooltip.end}
        </div>
      )}
    </div>
  );
}
