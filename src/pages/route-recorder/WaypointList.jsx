import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MAX_WAYPOINTS } from './constants.js';

function SortableWaypointItem({ item, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="waypoint-item">
      <div className="waypoint-drag-handle" {...attributes} {...listeners}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </div>
      <div className="waypoint-index">{index + 1}</div>
      <div className="waypoint-coords">
        ({item.x.toFixed(0)}, {item.y.toFixed(0)})
      </div>
      <button
        type="button"
        className="waypoint-remove-btn"
        onClick={() => onRemove(item.id)}
        title="删除途经点"
      >
        ×
      </button>
    </div>
  );
}

function WaypointList({
  waypoints,
  onReorder,
  onRemove,
  onAddByCoord,
  canAdd,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = waypoints.findIndex((w) => w.id === active.id);
    const newIndex = waypoints.findIndex((w) => w.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newArr = arrayMove(waypoints, oldIndex, newIndex);
    onReorder(newArr, oldIndex, newIndex);
  };

  return (
    <div className="waypoint-list-section">
      <div className="section-header">
        <h3 className="section-title">途经点 <span className="count-badge">{waypoints.length}/{MAX_WAYPOINTS}</span></h3>
      </div>

      <div className="coord-input-row">
        <input
          type="text"
          className="coord-input"
          placeholder="输入 x, y 添加"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const input = e.target;
              const val = input.value.trim();
              if (val && canAdd) {
                const parts = val.split(/[,，\s]+/).filter(Boolean);
                if (parts.length >= 2) {
                  const x = parseFloat(parts[0]);
                  const y = parseFloat(parts[1]);
                  if (!Number.isNaN(x) && !Number.isNaN(y)) {
                    onAddByCoord({ x, y });
                    input.value = '';
                  }
                }
              }
            }
          }}
          disabled={!canAdd}
        />
      </div>

      <div className="waypoint-list-scroll">
        {waypoints.length === 0 ? (
          <div className="empty-hint">暂无途经点，在地图上点击或输入坐标添加</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={waypoints.map((w) => w.id)} strategy={verticalListSortingStrategy}>
              {waypoints.map((w, i) => (
                <SortableWaypointItem
                  key={w.id}
                  item={w}
                  index={i}
                  onRemove={onRemove}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

export default WaypointList;
