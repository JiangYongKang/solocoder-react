import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getModuleLabel, getModuleIcon } from './resumeTemplatesCore'

function SortableModuleCard({
  module,
  onToggleVisibility,
  onToggleExpanded,
  onContentChange,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleToggleVisibility = (e) => {
    e.stopPropagation()
    onToggleVisibility && onToggleVisibility(module.id)
  }

  const handleToggleExpanded = (e) => {
    e.stopPropagation()
    onToggleExpanded && onToggleExpanded(module.id)
  }

  const handleContentChange = (e) => {
    onContentChange && onContentChange(module.id, e.target.value)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rt-module-card${isDragging ? ' dragging' : ''}${module.visible ? '' : ' hidden'}`}
    >
      <div className="rt-module-card-header" onClick={handleToggleExpanded}>
        <span className="rt-drag-handle" {...attributes} {...listeners}>
          ⋮⋮
        </span>
        <span className="rt-module-icon">{getModuleIcon(module)}</span>
        <span className="rt-module-name">{getModuleLabel(module)}</span>
        <div
          className={`rt-module-toggle${module.visible ? ' active' : ''}`}
          onClick={handleToggleVisibility}
          title={module.visible ? '点击隐藏' : '点击显示'}
        />
        <button
          className={`rt-expand-btn${module.expanded ? ' expanded' : ''}`}
          onClick={handleToggleExpanded}
        >
          ▼
        </button>
      </div>
      {module.expanded && (
        <div className="rt-module-editor">
          <textarea
            className="rt-module-textarea"
            value={module.content}
            onChange={handleContentChange}
            placeholder="在此输入 Markdown 内容..."
          />
        </div>
      )}
    </div>
  )
}

export default function ModuleEditor({
  modules,
  onReorderModules,
  onToggleVisibility,
  onToggleExpanded,
  onContentChange,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = modules.findIndex((m) => m.id === active.id)
    const newIndex = modules.findIndex((m) => m.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onReorderModules && onReorderModules(arrayMove(modules, oldIndex, newIndex))
  }

  return (
    <div className="rt-left-panel">
      <div className="rt-panel-header">
        <div className="rt-panel-title">模块编辑器</div>
        <div className="rt-panel-subtitle">拖拽调整顺序，点击展开编辑</div>
      </div>
      <div className="rt-module-list">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={modules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {modules.map((mod) => (
              <SortableModuleCard
                key={mod.id}
                module={mod}
                onToggleVisibility={onToggleVisibility}
                onToggleExpanded={onToggleExpanded}
                onContentChange={onContentChange}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
