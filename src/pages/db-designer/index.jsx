import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './db-designer.css'
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  TABLE_TEMPLATES,
  TABLE_WIDTH,
  TABLE_HEADER_HEIGHT,
  FIELD_ROW_HEIGHT,
  createTable,
  createTableFromTemplate,
  updateTable,
  deleteTable,
  getTableById,
  addField,
  updateField,
  deleteField,
  reorderFields,
  createRelation,
  deleteRelation,
  deleteRelationsByTableId,
  deleteRelationsByFieldId,
  validateRelation,
  clampZoom,
  screenToWorld,
  getFieldAnchor,
  buildBezierPath,
  generateFullDDL,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  downloadJson,
  importFromJson,
  autoLayout,
  fitToView,
  adjustContextMenuPosition,
  DEFAULT_CONTEXT_MENU_WIDTH,
  DEFAULT_CONTEXT_MENU_HEIGHT,
} from './dbDesignerCore'

function DBFieldRow({ table, field, fieldIndex, onUpdate, onDelete, onReorder, onStartDragRelation }) {
  const [dragOver, setDragOver] = useState(false)

  const handleDragStart = (e) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-db-field', JSON.stringify({ tableId: table.id, fieldIndex }))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const data = e.dataTransfer.getData('application/x-db-field')
    if (!data) return
    try {
      const parsed = JSON.parse(data)
      if (parsed.tableId === table.id && parsed.fieldIndex !== fieldIndex) {
        onReorder(parsed.fieldIndex, fieldIndex)
      }
    } catch (err) {
      console.warn('字段拖拽数据解析失败:', err)
    }
  }

  const handleStartRelation = (e, side) => {
    e.stopPropagation()
    e.preventDefault()
    onStartDragRelation(table.id, field.id, side)
  }

  return (
    <div
      className={`dbd-field-row ${dragOver ? 'dbd-field-drag-over' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span
        className="dbd-field-drag"
        title="拖动排序"
      >
        ⋮⋮
      </span>
      {field.primaryKey ? (
        <span className="dbd-field-pk-icon" title="主键">🔑</span>
      ) : (
        <span className="dbd-field-pk-placeholder" />
      )}
      <input
        className="dbd-field-name"
        value={field.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="字段名"
      />
      <select
        className="dbd-field-type"
        value={field.type}
        onChange={(e) => onUpdate({ type: e.target.value })}
        onClick={(e) => e.stopPropagation()}
      >
        {Object.values(FIELD_TYPES).map((t) => (
          <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
        ))}
      </select>
      <div className="dbd-field-checks">
        <input
          type="checkbox"
          className="dbd-field-checkbox"
          checked={field.primaryKey}
          onChange={(e) => onUpdate({ primaryKey: e.target.checked })}
          onClick={(e) => e.stopPropagation()}
          title="主键"
        />
        <input
          type="checkbox"
          className="dbd-field-checkbox"
          checked={field.nullable}
          disabled={field.primaryKey}
          onChange={(e) => onUpdate({ nullable: e.target.checked })}
          onClick={(e) => e.stopPropagation()}
          title="允许 NULL"
        />
      </div>
      <input
        className="dbd-field-default"
        value={field.defaultValue}
        onChange={(e) => onUpdate({ defaultValue: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="默认值"
      />
      <button
        className="dbd-field-delete"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="删除字段"
      >
        ×
      </button>
      <div
        className={`dbd-field-anchor dbd-field-anchor-left ${field.primaryKey ? 'dbd-field-anchor-pk' : ''}`}
        onMouseDown={(e) => handleStartRelation(e, 'left')}
        title={field.primaryKey ? '拖到其他表字段建立外键（目标端）' : '拖到其他表主键建立外键'}
      />
      <div
        className={`dbd-field-anchor dbd-field-anchor-right ${field.primaryKey ? 'dbd-field-anchor-pk' : ''}`}
        onMouseDown={(e) => handleStartRelation(e, 'right')}
        title={field.primaryKey ? '拖到其他表字段建立外键（目标端）' : '拖到其他表主键建立外键'}
      />
    </div>
  )
}

function DBTable({ table, selected, onSelect, onUpdate, onDelete, onAddField, onUpdateField, onDeleteField, onReorderFields, onStartDragRelation, onStartDragTable }) {
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const handleMouseDownHeader = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return
    e.preventDefault()
    dragOffsetRef.current = {
      x: e.clientX,
      y: e.clientY,
    }
    onSelect()

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragOffsetRef.current.x
      const dy = moveEvent.clientY - dragOffsetRef.current.y
      dragOffsetRef.current = {
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      }
      onStartDragTable(table.id, dx, dy)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleNameChange = (e) => {
    onUpdate({ name: e.target.value })
  }

  return (
    <div
      className={`dbd-table ${selected ? 'dbd-table-selected' : ''}`}
      style={{
        left: table.x,
        top: table.y,
        width: TABLE_WIDTH,
      }}
      onMouseDown={(e) => { e.stopPropagation(); onSelect() }}
    >
      <div
        className="dbd-table-header"
        onMouseDown={handleMouseDownHeader}
      >
        <input
          className="dbd-table-name"
          value={table.name}
          onChange={handleNameChange}
          onClick={(e) => e.stopPropagation()}
          placeholder="表名"
        />
        <button
          className="dbd-table-delete"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="删除表"
        >
          ×
        </button>
      </div>
      <div className="dbd-fields">
        {table.fields.map((field, idx) => (
          <DBFieldRow
            key={field.id}
            table={table}
            field={field}
            fieldIndex={idx}
            onUpdate={(updates) => onUpdateField(field.id, updates)}
            onDelete={() => onDeleteField(field.id)}
            onReorder={(from, to) => onReorderFields(from, to)}
            onStartDragRelation={onStartDragRelation}
          />
        ))}
        <button
          className="dbd-add-field-btn"
          onClick={(e) => { e.stopPropagation(); onAddField() }}
        >
          + 添加字段
        </button>
      </div>
    </div>
  )
}

function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null)
  const [position, setPosition] = useState(() => adjustContextMenuPosition(
    x, y,
    DEFAULT_CONTEXT_MENU_WIDTH,
    Math.max(items.length * 40 + 16, DEFAULT_CONTEXT_MENU_HEIGHT),
    typeof window !== 'undefined' ? window.innerWidth : 1024,
    typeof window !== 'undefined' ? window.innerHeight : 768
  ))

  useEffect(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768
    const menuEl = menuRef.current
    const mw = menuEl?.offsetWidth || DEFAULT_CONTEXT_MENU_WIDTH
    const mh = menuEl?.offsetHeight || Math.max(items.length * 40 + 16, DEFAULT_CONTEXT_MENU_HEIGHT)
    setPosition(adjustContextMenuPosition(x, y, mw, mh, vw, vh))
  }, [x, y, items.length])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="dbd-context-menu"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`dbd-context-menu-item ${item.danger ? 'dbd-context-menu-item-danger' : ''}`}
          onClick={() => {
            item.onClick?.()
            onClose()
          }}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function DDLModal({ tables, relations, initialTableId, onClose }) {
  const [mode, setMode] = useState(initialTableId ? 'single' : 'all')
  const [selectedTableId, setSelectedTableId] = useState(initialTableId || (tables[0]?.id ?? null))
  const [copySuccess, setCopySuccess] = useState(false)

  const selectedTable = tables.find((t) => t.id === selectedTableId)

  const ddl = mode === 'all'
    ? generateFullDDL(tables, relations)
    : (selectedTable ? generateFullDDL([selectedTable], relations.filter((r) => r.fromTableId === selectedTable.id || r.toTableId === selectedTable.id)) : '')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ddl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      alert('复制失败: ' + (err?.message || '请手动复制'))
    }
  }

  return (
    <div className="dbd-modal-overlay" onClick={onClose}>
      <div className="dbd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dbd-modal-header">
          <h3 className="dbd-modal-title">导出 DDL</h3>
          <button className="dbd-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="dbd-modal-body">
          <div className="dbd-modal-tabs">
            <button
              className={`dbd-modal-tab ${mode === 'all' ? 'dbd-modal-tab-active' : ''}`}
              onClick={() => setMode('all')}
            >
              全部表
            </button>
            <button
              className={`dbd-modal-tab ${mode === 'single' ? 'dbd-modal-tab-active' : ''}`}
              onClick={() => setMode('single')}
            >
              单表
            </button>
          </div>
          {mode === 'single' && tables.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <select
                className="dbd-field-type"
                style={{ width: 'auto', minWidth: 200 }}
                value={selectedTableId || ''}
                onChange={(e) => setSelectedTableId(e.target.value)}
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          <pre className="dbd-ddl-content">{ddl || '暂无内容'}</pre>
        </div>
        <div className="dbd-modal-footer">
          {copySuccess && <span className="dbd-copy-success">✓ 已复制到剪贴板</span>}
          <button className="dbd-btn" onClick={onClose}>关闭</button>
          <button className="dbd-btn dbd-btn-primary" onClick={handleCopy} disabled={!ddl}>
            复制到剪贴板
          </button>
        </div>
      </div>
    </div>
  )
}

function DBDesignerPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const innerRef = useRef(null)

  const [tables, setTables] = useState(() => {
    const saved = loadFromStorage()
    return saved.tables || []
  })
  const [relations, setRelations] = useState(() => {
    const saved = loadFromStorage()
    return saved.relations || []
  })
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const [relationDraft, setRelationDraft] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [ddlModal, setDdlModal] = useState({ open: false, tableId: null })

  const latestRef = useRef({ tables: [], relations: [], pan: { x: 0, y: 0 }, zoom: 1, relationDraft: null })

  useEffect(() => {
    latestRef.current.tables = tables
  }, [tables])

  useEffect(() => {
    latestRef.current.relations = relations
  }, [relations])

  useEffect(() => {
    latestRef.current.pan = pan
  }, [pan])

  useEffect(() => {
    latestRef.current.zoom = zoom
  }, [zoom])

  useEffect(() => {
    latestRef.current.relationDraft = relationDraft
  }, [relationDraft])

  useEffect(() => {
    const saved = loadFromStorage()
    if (saved.error) {
      alert('读取本地存储失败: ' + saved.error)
    }
  }, [])

  useEffect(() => {
    const result = saveToStorage({ tables, relations })
    if (!result.success) {
      console.warn('保存本地存储失败:', result.error)
    }
  }, [tables, relations])

  const handleWheel = useCallback((e) => {
    if (!canvasRef.current) return
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = clampZoom(zoom * delta)

    const worldBefore = screenToWorld(mouseX, mouseY, pan.x, pan.y, zoom)
    const newPanX = mouseX - worldBefore.x * newZoom
    const newPanY = mouseY - worldBefore.y * newZoom

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }, [zoom, pan])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleCanvasMouseDown = (e) => {
    if (e.target !== canvasRef.current && e.target !== innerRef.current) return
    e.preventDefault()
    setSelectedTableId(null)
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
  }

  useEffect(() => {
    if (!isPanning) return

    const handleMouseMove = (e) => {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      })
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning])

  const handleStartDragRelation = (tableId, fieldId, side) => {
    const table = getTableById(tables, tableId)
    if (!table) return
    const anchor = getFieldAnchor(table, fieldId, side)
    setRelationDraft({
      fromTableId: tableId,
      fromFieldId: fieldId,
      fromSide: side,
      startX: anchor.x,
      startY: anchor.y,
      currentX: anchor.x,
      currentY: anchor.y,
    })
  }

  useEffect(() => {
    if (!relationDraft) return

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const { pan: curPan, zoom: curZoom } = latestRef.current
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, curPan.x, curPan.y, curZoom)
      setRelationDraft((prev) => prev ? { ...prev, currentX: world.x, currentY: world.y } : null)
    }

    const handleMouseUp = (e) => {
      const draft = latestRef.current.relationDraft
      setRelationDraft(null)
      if (!draft) return

      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const { pan: curPan, zoom: curZoom, tables: curTables, relations: curRelations } = latestRef.current
      const worldX = (e.clientX - rect.left - curPan.x) / curZoom
      const worldY = (e.clientY - rect.top - curPan.y) / curZoom

      for (const table of curTables) {
        if (table.id === draft.fromTableId) continue
        if (worldX < table.x || worldX > table.x + TABLE_WIDTH) continue
        const fieldAreaTop = table.y + TABLE_HEADER_HEIGHT
        if (worldY < fieldAreaTop) continue
        const fieldIdx = Math.floor((worldY - fieldAreaTop) / FIELD_ROW_HEIGHT)
        if (fieldIdx < 0 || fieldIdx >= table.fields.length) continue
        const targetField = table.fields[fieldIdx]
        if (!targetField.primaryKey) {
          continue
        }

        const result = validateRelation(
          curTables,
          curRelations,
          draft.fromTableId,
          draft.fromFieldId,
          table.id,
          targetField.id
        )
        if (result.valid) {
          const newRel = createRelation(
            draft.fromTableId,
            draft.fromFieldId,
            table.id,
            targetField.id
          )
          setRelations((prev) => [...prev, newRel])
        }
        return
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [relationDraft])

  const handleDragTable = (tableId, dx, dy) => {
    setTables((prev) => updateTable(prev, tableId, {
      x: (prev.find((t) => t.id === tableId)?.x || 0) + dx / zoom,
      y: (prev.find((t) => t.id === tableId)?.y || 0) + dy / zoom,
    }))
  }

  const handleAddTable = (template = null) => {
    const newTable = template
      ? createTableFromTemplate(template, 150 + tables.length * 30, 150 + tables.length * 30)
      : createTable('new_table', 150 + tables.length * 30, 150 + tables.length * 30)
    setTables((prev) => [...prev, newTable])
    setSelectedTableId(newTable.id)
  }

  const handleDeleteTable = (tableId) => {
    setTables((prev) => deleteTable(prev, tableId))
    setRelations((prev) => deleteRelationsByTableId(prev, tableId))
    if (selectedTableId === tableId) setSelectedTableId(null)
  }

  const handleUpdateTableName = (tableId, updates) => {
    setTables((prev) => updateTable(prev, tableId, updates))
  }

  const handleAddField = (tableId) => {
    setTables((prev) => prev.map((t) => t.id === tableId ? addField(t) : t))
  }

  const handleUpdateField = (tableId, fieldId, updates) => {
    setTables((prev) => {
      return prev.map((t) => {
        if (t.id !== tableId) return t
        return updateField(t, fieldId, updates)
      })
    })
  }

  const handleDeleteField = (tableId, fieldId) => {
    setTables((prev) => prev.map((t) => t.id === tableId ? deleteField(t, fieldId) : t))
    setRelations((prev) => deleteRelationsByFieldId(prev, fieldId))
  }

  const handleReorderFields = (tableId, fromIndex, toIndex) => {
    setTables((prev) => prev.map((t) => t.id === tableId ? reorderFields(t, fromIndex, toIndex) : t))
  }

  const handleRelationContextMenu = (e, relationId) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '删除外键关系', icon: '🗑️', danger: true, onClick: () => {
          setRelations((prev) => deleteRelation(prev, relationId))
        }},
      ],
    })
  }

  const handleZoomIn = () => setZoom((z) => clampZoom(z * 1.2))
  const handleZoomOut = () => setZoom((z) => clampZoom(z / 1.2))
  const handleZoomReset = () => {
    setZoom(1)
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const { panX, panY } = fitToView(tables, rect.width, rect.height, 80)
      setPan({ x: panX, y: panY })
    }
  }

  const handleAutoLayout = () => {
    setTables((prev) => autoLayout(prev, relations, 100, 100))
  }

  const handleExportJson = () => {
    const result = downloadJson({ tables, relations })
    if (!result.success) {
      alert('导出 JSON 失败: ' + result.error)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const result = importFromJson(json)
      if (result.valid) {
        setTables(result.data.tables)
        setRelations(result.data.relations)
      } else {
        alert('导入失败: ' + result.error)
      }
    } catch (err) {
      alert('导入失败: ' + (err?.message || '无法解析 JSON 文件'))
    }
    e.target.value = ''
  }

  const handleExportDDL = (tableId = null) => {
    setDdlModal({ open: true, tableId })
  }

  const handleClearAll = () => {
    if (confirm('确定要清空所有设计吗？')) {
      setTables([])
      setRelations([])
      const result = clearStorage()
      if (!result.success) {
        console.warn('清除本地存储失败:', result.error)
      }
    }
  }

  const handleTemplateDragStart = (e, template) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/x-db-template', template.id)
  }

  const handleCanvasDragOver = (e) => {
    e.preventDefault()
  }

  const handleCanvasDrop = (e) => {
    e.preventDefault()
    const templateId = e.dataTransfer.getData('application/x-db-template')
    if (!templateId || !canvasRef.current) return
    const template = TABLE_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    const rect = canvasRef.current.getBoundingClientRect()
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, pan.x, pan.y, zoom)
    const newTable = createTableFromTemplate(template, world.x - TABLE_WIDTH / 2, world.y - 30)
    setTables((prev) => [...prev, newTable])
    setSelectedTableId(newTable.id)
  }

  return (
    <div className="dbd-page">
      <div className="dbd-header">
        <div className="dbd-header-left">
          <button className="dbd-btn dbd-btn-back" onClick={() => navigate('/')}>
            ← 返回
          </button>
          <h1 className="dbd-title">数据库表设计器</h1>
        </div>
        <div className="dbd-header-actions">
          <button className="dbd-btn" onClick={handleAutoLayout}>
            📐 自动布局
          </button>
          <button className="dbd-btn" onClick={() => handleExportDDL(null)}>
            📄 导出 DDL
          </button>
          <button className="dbd-btn" onClick={handleExportJson}>
            ⬇️ 导出 JSON
          </button>
          <button className="dbd-btn" onClick={handleImportClick}>
            ⬆️ 导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="dbd-file-input"
            onChange={handleImportFile}
          />
          <button className="dbd-btn dbd-btn-danger" onClick={handleClearAll}>
            🗑️ 清空
          </button>
        </div>
      </div>

      <div className="dbd-main">
        <div className="dbd-sidebar">
          <h2 className="dbd-sidebar-title">工具栏</h2>

          <div className="dbd-sidebar-section">
            <button
              className="dbd-btn dbd-btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => handleAddTable(null)}
            >
              ➕ 新建表
            </button>
          </div>

          <div className="dbd-sidebar-section">
            <h3 className="dbd-sidebar-section-title">表模板</h3>
            <div className="dbd-template-list">
              {TABLE_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="dbd-template-item"
                  draggable
                  onDragStart={(e) => handleTemplateDragStart(e, tpl)}
                  onClick={() => handleAddTable(tpl)}
                >
                  <span className="dbd-template-icon">📋</span>
                  <span className="dbd-template-label">{tpl.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dbd-sidebar-section">
            <h3 className="dbd-sidebar-section-title">使用说明</h3>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8 }}>
              <div>• 点击或拖拽模板到画布新建表</div>
              <div>• 从字段圆点拖到另一表主键建外键</div>
              <div>• 右键连线可删除外键关系</div>
              <div>• 滚轮缩放，拖拽空白区域平移</div>
              <div>• 拖拽字段行可调整顺序</div>
            </div>
          </div>
        </div>

        <div
          className="dbd-canvas-wrap"
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
        >
          <div className="dbd-canvas-toolbar">
            <button className="dbd-zoom-btn" onClick={handleZoomOut} title="缩小">−</button>
            <span className="dbd-zoom-info">{Math.round(zoom * 100)}%</span>
            <button className="dbd-zoom-btn" onClick={handleZoomIn} title="放大">+</button>
            <button className="dbd-zoom-btn" onClick={handleZoomReset} title="适应视图">⤢</button>
          </div>

          <div
            ref={canvasRef}
            className="dbd-canvas"
            onMouseDown={handleCanvasMouseDown}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null) }}
          >
            <div
              ref={innerRef}
              className="dbd-canvas-inner"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              {tables.length === 0 && (
                <div className="dbd-empty-canvas" style={{ transform: `translate(${-pan.x/zoom}px, ${-pan.y/zoom}px) scale(${1/zoom})` }}>
                  点击左侧「新建表」或拖拽模板开始设计
                </div>
              )}

              <svg className="dbd-canvas-svg dbd-canvas-svg-interactive">
                <defs>
                  <marker
                    id="dbd-arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" className="dbd-relation-arrow" />
                  </marker>
                </defs>
                {relations.map((rel) => {
                  const fromTable = getTableById(tables, rel.fromTableId)
                  const toTable = getTableById(tables, rel.toTableId)
                  if (!fromTable || !toTable) return null
                  const from = getFieldAnchor(fromTable, rel.fromFieldId, 'right')
                  const to = getFieldAnchor(toTable, rel.toFieldId, 'left')
                  return (
                    <path
                      key={rel.id}
                      className="dbd-relation"
                      d={buildBezierPath(from, to)}
                      markerEnd="url(#dbd-arrowhead)"
                      onContextMenu={(e) => handleRelationContextMenu(e, rel.id)}
                    />
                  )
                })}
                {relationDraft && (
                  <path
                    className="dbd-temp-relation"
                    d={buildBezierPath(
                      { x: relationDraft.startX, y: relationDraft.startY },
                      { x: relationDraft.currentX, y: relationDraft.currentY }
                    )}
                  />
                )}
              </svg>

              {tables.map((table) => (
                <DBTable
                  key={table.id}
                  table={table}
                  selected={table.id === selectedTableId}
                  onSelect={() => setSelectedTableId(table.id)}
                  onUpdate={(updates) => handleUpdateTableName(table.id, updates)}
                  onDelete={() => handleDeleteTable(table.id)}
                  onAddField={() => handleAddField(table.id)}
                  onUpdateField={(fieldId, updates) => handleUpdateField(table.id, fieldId, updates)}
                  onDeleteField={(fieldId) => handleDeleteField(table.id, fieldId)}
                  onReorderFields={(from, to) => handleReorderFields(table.id, from, to)}
                  onStartDragTable={handleDragTable}
                  onStartDragRelation={handleStartDragRelation}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {ddlModal.open && (
        <DDLModal
          tables={tables}
          relations={relations}
          initialTableId={ddlModal.tableId}
          onClose={() => setDdlModal({ open: false, tableId: null })}
        />
      )}
    </div>
  )
}

export default DBDesignerPage
