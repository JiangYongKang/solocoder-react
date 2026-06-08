import { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
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
  dateToPx,
} from './ganttUtils.js';

const Timeline = forwardRef(function Timeline(
  {
    state,
    zoomLevel,
    onUpdateTask,
    selectedTaskId,
    onSelectTask,
    onContextMenu,
  },
  ref
) {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragTooltip, setDragTooltip] = useState(null);
  const [editingProgressId, setEditingProgressId] = useState(null);
  const dayWidth = DAY_WIDTH[zoomLevel];

  useImperativeHandle(ref, () => ({
    getScrollElement: () => scrollRef.current,
    setScrollTop: (top) => {
      if (scrollRef.current) scrollRef.current.scrollTop = top;
    },
  }));

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

    if (mode === 'progress') return;

    const startX = e.clientX;
    const originalStart = parseDate(task.startDate);
    const originalEnd = parseDate(task.endDate);
    const originalDuration = diffDays(originalStart, originalEnd) + 1;
    const scrollLeft = scrollRef.current?.scrollLeft || 0;
    const containerRect = scrollRef.current?.getBoundingClientRect();
    const offsetX = containerRect ? containerRect.left : 0;
    const relativeStartX = startX - offsetX + scrollLeft;
    const grabDate = pxToDate(relativeStartX, range.start, zoomLevel);
    const grabOffsetDays = diffDays(originalStart, grabDate);

    setDragging({
      taskId: task.id,
      mode,
      startX,
      originalStart,
      originalEnd,
      originalDuration,
      scrollLeft,
      offsetX,
      grabOffsetDays,
      currentX: startX,
    });
  };

  const handleProgressMouseDown = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectTask(task.id);

    const barEl = e.currentTarget.closest('.gantt-task-bar');
    if (!barEl) return;

    const barRect = barEl.getBoundingClientRect();

    const handleProgressMove = (ev) => {
      const relativeX = ev.clientX - barRect.left;
      const newProgress = Math.max(0, Math.min(100, Math.round((relativeX / barRect.width) * 100)));
      onUpdateTask(task.id, { progress: newProgress });
    };

    const handleProgressUp = () => {
      document.removeEventListener('mousemove', handleProgressMove);
      document.removeEventListener('mouseup', handleProgressUp);
    };

    document.addEventListener('mousemove', handleProgressMove);
    document.addEventListener('mouseup', handleProgressUp);
  };

  useEffect(() => {
    if (!dragging) return;

    const computeNewDates = (clientX) => {
      const relativeX = clientX - dragging.offsetX + dragging.scrollLeft;
      const dateAtMouse = pxToDate(relativeX, range.start, zoomLevel);
      const snapDate = (d) => {
        d.setHours(0, 0, 0, 0);
        return d;
      };

      let newStart = new Date(dragging.originalStart);
      let newEnd = new Date(dragging.originalEnd);

      if (dragging.mode === 'move') {
        const snappedMouseDate = snapDate(new Date(dateAtMouse));
        newStart = addDays(snappedMouseDate, -dragging.grabOffsetDays);
        newEnd = addDays(newStart, dragging.originalDuration - 1);
      } else if (dragging.mode === 'resize-left') {
        newStart = snapDate(new Date(dateAtMouse));
        if (newStart > newEnd) newStart = new Date(newEnd);
      } else if (dragging.mode === 'resize-right') {
        newEnd = snapDate(new Date(dateAtMouse));
        if (newEnd < newStart) newEnd = new Date(newStart);
      }

      return { newStart, newEnd };
    };

    const handleMouseMove = (e) => {
      const { newStart, newEnd } = computeNewDates(e.clientX);

      setDragging((prev) => ({ ...prev, currentX: e.clientX }));
      setDragTooltip({
        x: e.clientX,
        y: e.clientY - 40,
        start: formatDate(newStart),
        end: formatDate(newEnd),
      });
    };

    const handleMouseUp = (e) => {
      const { newStart, newEnd } = computeNewDates(e.clientX);

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
  }, [dragging, range.start, zoomLevel, onUpdateTask]);

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
        style={{ left: Math.max(0, dateToPx(today, range.start, zoomLevel)) + dayWidth / 2 }}
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
      const progressWidth = Math.max(0, Math.min(100, task.progress || 0));

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
              style={{ width: `${progressWidth}%`, cursor: 'ew-resize' }}
              onMouseDown={(e) => handleProgressMouseDown(e, task)}
              title={`${task.progress || 0}% - 拖拽调整进度`}
            />
            <div
              style={{
                position: 'absolute',
                left: `${progressWidth}%`,
                top: 0,
                bottom: 0,
                width: 4,
                transform: 'translateX(-50%)',
                cursor: 'ew-resize',
                zIndex: 5,
                background: progressWidth > 0 ? 'var(--accent)' : 'transparent',
                borderRadius: 2,
              }}
              onMouseDown={(e) => handleProgressMouseDown(e, task)}
            />
            <span className="gantt-task-bar-label">
              {task.name} ({task.progress || 0}%)
            </span>
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
    <div className="gantt-right-panel" ref={scrollRef}>
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
});

export default Timeline;
