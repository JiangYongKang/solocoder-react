import { useState } from 'react'
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
import { TEMPLATE_INFO, MODULE_ICONS } from './constants'
import { getModuleLabel, canDeleteModule } from './resumeCore'

function SortableModuleItem({
  module,
  isActive,
  onSelect,
  onToggleVisibility,
  onDelete,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`re-module-item ${isActive ? 're-module-item-active' : ''} ${
        isDragging ? 're-module-item-dragging' : ''
      } ${module.visible ? '' : 're-module-hide'}`}
      onClick={() => onSelect(module.id)}
    >
      <span className="re-module-icon">{MODULE_ICONS[module.type] || '📝'}</span>
      <span className="re-module-name">{getModuleLabel(module)}</span>
      <span className="re-module-drag" {...attributes} {...listeners}>
        ⋮⋮
      </span>
      <label className="re-module-toggle" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={module.visible}
          onChange={() => onToggleVisibility(module.id)}
        />
        <span className="re-module-toggle-slider" />
      </label>
      <button
        type="button"
        className="re-module-delete"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(module.id)
        }}
        disabled={!canDeleteModule(module)}
        title={canDeleteModule(module) ? '删除模块' : '基本信息模块不可删除'}
      >
        ×
      </button>
    </div>
  )
}

function TemplateSelector({ templateId, onTemplateChange }) {
  return (
    <div>
      <h3 className="re-panel-title">选择模板</h3>
      <div className="re-template-list">
        {Object.values(TEMPLATE_INFO).map((tpl) => (
          <div
            key={tpl.id}
            className={`re-template-card ${
              templateId === tpl.id ? 're-template-card-active' : ''
            }`}
            onClick={() => onTemplateChange(tpl.id)}
          >
            <div
              className="re-template-preview"
              style={{ background: tpl.primaryColor }}
            >
              {tpl.name}
            </div>
            <div className="re-template-name">{tpl.name}</div>
            <div className="re-template-desc">{tpl.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ModulePanel({
  modules,
  selectedModuleId,
  onSelectModule,
  onReorderModules,
  onToggleVisibility,
  onDeleteModule,
  onAddCustomModule,
  templateId,
  onTemplateChange,
}) {
  const [customName, setCustomName] = useState('')
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
    onReorderModules(arrayMove(modules, oldIndex, newIndex))
  }

  const handleAddCustom = () => {
    const name = customName.trim()
    if (!name) return
    onAddCustomModule(name)
    setCustomName('')
  }

  return (
    <div className="re-panel">
      <TemplateSelector templateId={templateId} onTemplateChange={onTemplateChange} />

      <h3 className="re-panel-title">模块管理</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={modules.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="re-module-list">
            {modules.map((mod) => (
              <SortableModuleItem
                key={mod.id}
                module={mod}
                isActive={selectedModuleId === mod.id}
                onSelect={onSelectModule}
                onToggleVisibility={onToggleVisibility}
                onDelete={onDeleteModule}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <h3 className="re-panel-title" style={{ marginTop: 16 }}>
        添加自定义模块
      </h3>
      <div className="re-add-custom">
        <input
          type="text"
          placeholder="输入模块名称"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddCustom()
          }}
        />
        <button
          type="button"
          className="re-btn re-btn-small re-btn-primary"
          onClick={handleAddCustom}
        >
          添加
        </button>
      </div>
    </div>
  )
}

export default ModulePanel
