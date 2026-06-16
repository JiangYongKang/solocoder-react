import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableWaypointItem({ waypoint, index, totalCount, isSelected, onSelect, onUpdate, onRemove, onMoveUp, onMoveDown }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: waypoint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isFirst = index === 0;
  const isLast = index === totalCount - 1;
  const canRemove = !isFirst && !isLast;
  const canMoveUp = !isFirst && index > 1;
  const canMoveDown = !isLast && index < totalCount - 2;

  const label = isFirst ? '起点' : (isLast ? '终点' : `途经点${index}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`waypoint-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect && onSelect(waypoint.id)}
    >
      <div className="waypoint-drag-handle" {...attributes} {...listeners} title="拖拽排序">
        ⋮⋮
      </div>
      <div className={`waypoint-index ${isFirst ? 'start' : ''} ${isLast ? 'end' : ''}`}>
        {isFirst ? '起' : (isLast ? '终' : String(index))}
      </div>
      <div className="waypoint-info">
        <div className="waypoint-label">{label}</div>
        <input
          type="text"
          className="waypoint-name-input"
          value={waypoint.name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate && onUpdate(waypoint.id, { name: e.target.value })}
          placeholder="地点名称"
        />
        <div className="waypoint-coords">
          ({waypoint.x.toFixed(1)}, {waypoint.y.toFixed(1)})
        </div>
      </div>
      <div className="waypoint-actions">
        <button
          className="waypoint-action-btn"
          onClick={(e) => { e.stopPropagation(); onMoveUp && onMoveUp(index); }}
          disabled={!canMoveUp}
          title="上移"
        >
          ↑
        </button>
        <button
          className="waypoint-action-btn"
          onClick={(e) => { e.stopPropagation(); onMoveDown && onMoveDown(index); }}
          disabled={!canMoveDown}
          title="下移"
        >
          ↓
        </button>
        <button
          className="waypoint-action-btn remove"
          onClick={(e) => { e.stopPropagation(); onRemove && onRemove(waypoint.id); }}
          disabled={!canRemove}
          title={canRemove ? '删除' : '起点和终点不可删除'}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function WaypointList({
  waypoints,
  selectedWaypointId,
  onWaypointSelect,
  onWaypointUpdate,
  onWaypointRemove,
  onWaypointReorder,
  onWaypointMoveUp,
  onWaypointMoveDown,
  onAddWaypoint,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = waypoints.findIndex((w) => w.id === active.id);
      const newIndex = waypoints.findIndex((w) => w.id === over.id);
      if (oldIndex > 0 && oldIndex < waypoints.length - 1 && newIndex > 0 && newIndex < waypoints.length - 1) {
        onWaypointReorder && onWaypointReorder(waypoints, oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="waypoint-list-container">
      <div className="waypoint-list-header">
        <h3>途经点 ({waypoints.length})</h3>
        <button
          className="add-waypoint-btn"
          onClick={onAddWaypoint}
          disabled={waypoints.length < 2}
        >
          + 添加途经点
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={waypoints.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="waypoint-list">
            {waypoints.map((wp, idx) => (
              <SortableWaypointItem
                key={wp.id}
                waypoint={wp}
                index={idx}
                totalCount={waypoints.length}
                isSelected={wp.id === selectedWaypointId}
                onSelect={onWaypointSelect}
                onUpdate={onWaypointUpdate}
                onRemove={onWaypointRemove}
                onMoveUp={onWaypointMoveUp}
                onMoveDown={onWaypointMoveDown}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="waypoint-hint">
        💡 提示：在地图上点击可添加途经点，拖拽图钉可移动位置
      </div>
    </div>
  );
}
