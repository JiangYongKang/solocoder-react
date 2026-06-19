import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  loadFromStorage,
  saveToStorage,
  findNodeById,
  findParentNode,
  countDescendants,
  addChildNode,
  addSiblingNode,
  updateNode,
  deleteNode,
  moveNode,
  isDescendant,
  calculateLayout,
  getLayoutBounds,
  fitToView,
  clampZoom,
  changeNodeType,
  exportToJson,
  importFromJson,
  downloadJson,
  countNodesByType,
  cloneTree,
} from './orgChartCore.js'
import {
  NODE_TYPES,
  NODE_TYPE_LABELS,
  NODE_TYPE_ICONS,
  NODE_TYPE_COLORS,
  LAYOUT_DIRECTIONS,
  LAYOUT_LABELS,
  NODE_WIDTH,
  NODE_HEIGHT,
  DEFAULT_ZOOM,
  ZOOM_STEP,
  MIN_ZOOM,
  MAX_ZOOM,
} from './constants.js'
import './org-chart.css'

const TemplatePanel = ({ onDragStart }) => {
  const templates = [
    { type: NODE_TYPES.DEPARTMENT, className: 'org-template-department' },
    { type: NODE_TYPES.POSITION, className: 'org-template-position' },
    { type: NODE_TYPES.PERSON, className: 'org-template-person' },
  ]

  return (
    <div className="org-template-panel">
      <h3 className="org-template-title">节点模板</h3>
      <div className="org-template-list">
        {templates.map((tpl) => (
          <div
            key={tpl.type}
            className={`org-template-item ${tpl.className}`}
            draggable
            onDragStart={(e) => onDragStart(e, tpl.type)}
          >
            <span className="org-template-icon">{NODE_TYPE_ICONS[tpl.type]}</span>
            <div className="org-template-info">
              <span className="org-template-label">{NODE_TYPE_LABELS[tpl.type]}</span>
              <span className="org-template-hint">拖拽添加</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3 className="org-template-title">操作提示</h3>
        <div style={{ fontSize: '12px', color: '#909399', lineHeight: 1.8 }}>
          <p>• 从左侧拖节点到画布</p>
          <p>• 拖拽画布平移</p>
          <p>• 滚轮缩放画布</p>
          <p>• 右键节点更多操作</p>
        </div>
      </div>
    </div>
  )
}

const Toolbar = ({
  layoutDirection,
  onLayoutChange,
  onImportClick,
  onExportJson,
  onExportPng,
  onFitView,
}) => {
  return (
    <div className="org-chart-toolbar">
      <div className="org-toolbar-left">
        <button
          className={`org-btn ${layoutDirection === LAYOUT_DIRECTIONS.VERTICAL ? 'org-btn-active' : ''}`}
          onClick={() => onLayoutChange(LAYOUT_DIRECTIONS.VERTICAL)}
        >
          ↕️ {LAYOUT_LABELS[LAYOUT_DIRECTIONS.VERTICAL]}
        </button>
        <button
          className={`org-btn ${layoutDirection === LAYOUT_DIRECTIONS.HORIZONTAL ? 'org-btn-active' : ''}`}
          onClick={() => onLayoutChange(LAYOUT_DIRECTIONS.HORIZONTAL)}
        >
          ↔️ {LAYOUT_LABELS[LAYOUT_DIRECTIONS.HORIZONTAL]}
        </button>
        <div style={{ width: 1, height: 24, background: '#ebeef5', margin: '0 8px' }} />
        <button className="org-btn" onClick={onFitView} title="适应画布">
          ⤢ 适应画布
        </button>
      </div>
      <div className="org-toolbar-right">
        <button className="org-btn" onClick={onImportClick} title="从 JSON 文件导入">
          📥 导入 JSON
        </button>
        <button className="org-btn" onClick={onExportJson} title="导出为 JSON 文件">
          📤 导出 JSON
        </button>
        <button className="org-btn org-btn-primary" onClick={onExportPng} title="导出为 PNG 图片">
          🖼️ 导出 PNG
        </button>
      </div>
    </div>
  )
}

const ContextMenu = ({ x, y, node, onClose, onEdit, onDelete, onAddChild, onAddSibling }) => {
  return (
    <div
      className="org-context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="org-context-menu-item" onClick={() => { onAddChild(); onClose() }}>
        <span>➕</span>
        <span>添加子节点</span>
      </div>
      <div className="org-context-menu-item" onClick={() => { onAddSibling(); onClose() }}>
        <span>↔️</span>
        <span>添加同级节点</span>
      </div>
      <div className="org-context-menu-divider" />
      <div className="org-context-menu-item" onClick={() => { onEdit(); onClose() }}>
        <span>✏️</span>
        <span>编辑属性</span>
      </div>
      <div className="org-context-menu-divider" />
      <div className="org-context-menu-item org-context-menu-item-danger" onClick={() => { onDelete(); onClose() }}>
        <span>🗑️</span>
        <span>删除节点</span>
      </div>
    </div>
  )
}

const PropertyPanel = ({ node, onUpdate, onClose, onDelete, rootId }) => {
  if (!node) return null

  const handleChange = (field, value) => {
    onUpdate(node.id, { [field]: value })
  }

  const handleTypeChange = (newType) => {
    onUpdate(node.id, { type: newType })
  }

  return (
    <div className="org-property-panel" onClick={(e) => e.stopPropagation()}>
      <div className="org-property-header">
        <h2 className="org-property-title">属性编辑</h2>
        <button className="org-property-close" onClick={onClose}>✕</button>
      </div>

      <div className="org-property-section">
        <label className="org-property-label">节点名称</label>
        <input
          className="org-property-input"
          type="text"
          value={node.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div className="org-property-section">
        <label className="org-property-label">节点类型</label>
        <div className="org-property-type-badges">
          {Object.entries(NODE_TYPES).map(([key, value]) => (
            <button
              key={key}
              className={`org-property-type-badge ${node.type === value ? 'active' : ''}`}
              onClick={() => handleTypeChange(value)}
            >
              {NODE_TYPE_ICONS[value]}
              <span>{NODE_TYPE_LABELS[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {node.type === NODE_TYPES.PERSON && (
        <>
          <div className="org-property-section">
            <label className="org-property-label">邮箱</label>
            <input
              className="org-property-input"
              type="email"
              value={node.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="example@company.com"
            />
          </div>
          <div className="org-property-section">
            <label className="org-property-label">手机号</label>
            <input
              className="org-property-input"
              type="tel"
              value={node.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="13800000000"
            />
          </div>
        </>
      )}

      <div className="org-property-section" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #ebeef5' }}>
        <label className="org-property-label">节点信息</label>
        <div style={{ fontSize: '12px', color: '#909399', lineHeight: 1.8 }}>
          <div>ID: {node.id}</div>
          <div>子节点数: {node.children?.length || 0}</div>
          <div>后代总数: {countDescendants(node)}</div>
        </div>
      </div>

      {node.id !== rootId && (
        <button
          className="org-btn org-btn-danger"
          onClick={() => onDelete(node.id)}
          style={{ marginTop: 8 }}
        >
          🗑️ 删除此节点
        </button>
      )}
    </div>
  )
}

const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="org-confirm-dialog-overlay" onClick={onCancel}>
      <div className="org-confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="org-confirm-title">{title}</h3>
        <p className="org-confirm-message">{message}</p>
        <div className="org-confirm-actions">
          <button className="org-btn" onClick={onCancel}>取消</button>
          <button className="org-btn org-btn-danger" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  )
}

const getNodeAnchor = (pos, direction) => {
  if (direction === LAYOUT_DIRECTIONS.HORIZONTAL) {
    return {
      sourceX: pos.x + pos.width,
      sourceY: pos.y + pos.height / 2,
      targetX: pos.x,
      targetY: pos.y + pos.height / 2,
    }
  }
  return {
    sourceX: pos.x + pos.width / 2,
    sourceY: pos.y + pos.height,
    targetX: pos.x + pos.width / 2,
    targetY: pos.y,
  }
}

const renderConnection = (parentPos, childPos, direction) => {
  const parentAnchor = getNodeAnchor(parentPos, direction)
  const childAnchor = getNodeAnchor(childPos, direction)

  if (direction === LAYOUT_DIRECTIONS.HORIZONTAL) {
    const midX = (parentAnchor.sourceX + childAnchor.targetX) / 2
    const d = `M ${parentAnchor.sourceX} ${parentAnchor.sourceY} C ${midX} ${parentAnchor.sourceY}, ${midX} ${childAnchor.targetY}, ${childAnchor.targetX} ${childAnchor.targetY}`
    return d
  }
  const midY = (parentAnchor.sourceY + childAnchor.targetY) / 2
  const d = `M ${parentAnchor.sourceX} ${parentAnchor.sourceY} C ${parentAnchor.sourceX} ${midY}, ${childAnchor.targetX} ${midY}, ${childAnchor.targetX} ${childAnchor.targetY}`
  return d
}

function OrgChartPage() {
  const navigate = useNavigate()
  const data = loadFromStorage()
  const [tree, setTree] = useState(() => data.root)
  const [selectedId, setSelectedId] = useState(() => data.root?.id || null)
  const [layoutDirection, setLayoutDirection] = useState(LAYOUT_DIRECTIONS.VERTICAL)
  const [pan, setPan] = useState({ x: 100, y: 100 })
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [contextMenu, setContextMenu] = useState(null)
  const [propertyPanelNode, setPropertyPanelNode] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToView()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    saveToStorage({ root: tree, version: 1 })
  }, [tree])

  const positions = useMemo(() => calculateLayout(tree, layoutDirection), [tree, layoutDirection])

  const bounds = useMemo(() => getLayoutBounds(positions), [positions])

  const stats = useMemo(() => countNodesByType(tree), [tree])

  const selectedNode = useMemo(
    () => (selectedId ? findNodeById(tree, selectedId) : null),
    [tree, selectedId]
  )

  const handleFitToView = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const { panX, panY, zoom: newZoom } = fitToView(positions, rect.width, rect.height, 100)
    setPan({ x: panX, y: panY })
    setZoom(newZoom)
  }, [positions])

  const handleSelectNode = useCallback((id) => {
    setSelectedId(id)
    setContextMenu(null)
    const node = findNodeById(tree, id)
    setPropertyPanelNode(node)
  }, [tree])

  const handleAddChild = useCallback(() => {
    if (!selectedId) return
    setTree((prev) => {
      const { tree: newTree, newNodeId } = addChildNode(prev, selectedId, NODE_TYPES.POSITION)
      setSelectedId(newNodeId)
      const newNode = findNodeById(newTree, newNodeId)
      setPropertyPanelNode(newNode)
      return newTree
    })
  }, [selectedId])

  const handleAddSibling = useCallback(() => {
    if (!selectedId || !tree) return
    if (selectedId === tree.id) {
      handleAddChild()
      return
    }
    setTree((prev) => {
      const { tree: newTree, newNodeId } = addSiblingNode(prev, selectedId, NODE_TYPES.POSITION)
      setSelectedId(newNodeId)
      const newNode = findNodeById(newTree, newNodeId)
      setPropertyPanelNode(newNode)
      return newTree
    })
  }, [selectedId, tree, handleAddChild])

  const handleDeleteNode = useCallback((nodeId = selectedId) => {
    if (!nodeId || !tree) return
    if (nodeId === tree.id) return

    const node = findNodeById(tree, nodeId)
    const descendantCount = countDescendants(node)

    if (descendantCount > 0) {
      setConfirmDialog({
        title: '确认删除',
        message: `该部门下包含 ${descendantCount} 个子节点，确认删除？`,
        onConfirm: () => {
          setTree((prev) => deleteNode(prev, nodeId))
          setSelectedId(tree?.id || null)
          setPropertyPanelNode(null)
          setConfirmDialog(null)
        },
      })
    } else {
      setTree((prev) => deleteNode(prev, nodeId))
      setSelectedId(tree?.id || null)
      setPropertyPanelNode(null)
    }
  }, [selectedId, tree])

  const handleUpdateNode = useCallback((nodeId, updates) => {
    setTree((prev) => {
      const newTree = updateNode(prev, nodeId, updates)
      const updatedNode = findNodeById(newTree, nodeId)
      if (propertyPanelNode?.id === nodeId) {
        setPropertyPanelNode(updatedNode)
      }
      return newTree
    })
  }, [propertyPanelNode])

  const handleChangeNodeType = useCallback((nodeId, newType) => {
    setTree((prev) => {
      const newTree = changeNodeType(prev, nodeId, newType)
      const updatedNode = findNodeById(newTree, nodeId)
      if (propertyPanelNode?.id === nodeId) {
        setPropertyPanelNode(updatedNode)
      }
      return newTree
    })
  }, [propertyPanelNode])

  const handleZoomIn = useCallback(() => {
    setZoom((z) => clampZoom(z + ZOOM_STEP))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => clampZoom(z - ZOOM_STEP))
  }, [])

  const handleExportJson = useCallback(() => {
    const data = exportToJson(tree)
    downloadJson(data, `org-chart-${Date.now()}.json`)
  }, [tree])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const result = importFromJson(json)
      if (result.valid) {
        setTree(result.data.root)
        setSelectedId(result.data.root.id)
        setPropertyPanelNode(null)
        setTimeout(() => handleFitToView(), 50)
      } else {
        alert(`导入失败: ${result.error}`)
      }
    } catch {
      alert('导入失败：无效的 JSON 文件')
    }
    e.target.value = ''
  }, [handleFitToView])

  const handleExportPng = useCallback(() => {
    const svg = svgRef.current
    if (!svg || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    positions.forEach((pos) => {
      minX = Math.min(minX, pos.x - 40)
      minY = Math.min(minY, pos.y - 40)
      maxX = Math.max(maxX, pos.x + pos.width + 40)
      maxY = Math.max(maxY, pos.y + pos.height + 40)
    })

    const width = maxX - minX
    const height = maxY - minY

    const clonedSvg = svg.cloneNode(true)
    const mainGroup = clonedSvg.querySelector('.org-canvas-g')
    if (mainGroup) {
      mainGroup.setAttribute('transform', `translate(${-minX}, ${-minY})`)
    }
    clonedSvg.setAttribute('width', width)
    clonedSvg.setAttribute('height', height)
    clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    clonedSvg.style.background = '#ffffff'

    const svgData = new XMLSerializer().serializeToString(clonedSvg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      canvas.toBlob((blob) => {
        if (!blob) return
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `org-chart-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      alert('导出 PNG 失败')
    }
    img.src = url
  }, [positions])

  const handleTemplateDragStart = useCallback((e, nodeType) => {
    e.dataTransfer.setData('nodeType', nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const handleNodeDragOver = useCallback((e, nodeId) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('nodeType') || e.dataTransfer.types.includes('nodeId')) {
      setDropTargetId(nodeId)
    }
  }, [])

  const handleNodeDragLeave = useCallback((e, nodeId) => {
    if (dropTargetId === nodeId) {
      setDropTargetId(null)
    }
  }, [dropTargetId])

  const handleNodeDrop = useCallback((e, targetNodeId) => {
    e.preventDefault()
    e.stopPropagation()
    setDropTargetId(null)

    const newNodeType = e.dataTransfer.getData('nodeType')
    const draggedNodeId = e.dataTransfer.getData('nodeId')

    if (newNodeType) {
      setTree((prev) => {
        const { tree: newTree, newNodeId } = addChildNode(prev, targetNodeId, newNodeType)
        setSelectedId(newNodeId)
        const newNode = findNodeById(newTree, newNodeId)
        setPropertyPanelNode(newNode)
        return newTree
      })
    } else if (draggedNodeId && draggedNodeId !== targetNodeId) {
      if (isDescendant(tree, draggedNodeId, targetNodeId)) {
        return
      }
      setTree((prev) => moveNode(prev, draggedNodeId, targetNodeId, 'child'))
    }
  }, [tree])

  const handleNodeDragStart = useCallback((e, nodeId) => {
    if (nodeId === tree.id) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('nodeId', nodeId)
    e.dataTransfer.effectAllowed = 'move'
  }, [tree.id])

  const handleCanvasDragOver = useCallback((e) => {
    e.preventDefault()
    setDropTargetId(null)
  }, [])

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.target !== e.currentTarget && !e.target.classList.contains('org-canvas')) {
      return
    }
    if (e.button !== 0) return
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    setPropertyPanelNode(null)
    setContextMenu(null)
    setSelectedId(null)
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return
    const dx = e.clientX - panStartRef.current.x
    const dy = e.clientY - panStartRef.current.y
    setPan({
      x: panStartRef.current.panX + dx,
      y: panStartRef.current.panY + dy,
    })
  }, [isPanning])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoom((z) => clampZoom(z + delta))
  }, [])

  const handleContextMenu = useCallback((e, nodeId) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedId(nodeId)
    const node = findNodeById(tree, nodeId)
    setPropertyPanelNode(node)
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    })
  }, [tree])

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && tree && selectedId !== tree.id) {
          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
            return
          }
          e.preventDefault()
          handleDeleteNode(selectedId)
        }
      }
      if (e.key === 'Escape') {
        setPropertyPanelNode(null)
        setContextMenu(null)
      }
    }
    window.addEventListener('click', handleGlobalClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', handleGlobalClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedId, tree, handleDeleteNode])

  const renderConnections = () => {
    const lines = []
    const traverse = (node) => {
      if (!node.children || node.children.length === 0) return
      const parentPos = positions.get(node.id)
      if (!parentPos) return
      for (const child of node.children) {
        const childPos = positions.get(child.id)
        if (!childPos) continue
        const d = renderConnection(parentPos, childPos, layoutDirection)
        lines.push(
          <path
            key={`conn-${node.id}-${child.id}`}
            d={d}
            className="org-connection-line"
          />
        )
        traverse(child)
      }
    }
    if (tree) traverse(tree)
    return lines
  }

  const renderNodes = () => {
    const nodes = []
    const traverse = (node) => {
      const pos = positions.get(node.id)
      if (!pos) return

      const colors = NODE_TYPE_COLORS[node.type]
      const isSelected = selectedId === node.id
      const isDropTarget = dropTargetId === node.id

      nodes.push(
        <g
          key={node.id}
          className={`org-node ${isSelected ? 'org-node-selected' : ''} ${isDropTarget ? 'org-node-drop-target' : ''}`}
          transform={`translate(${pos.x}, ${pos.y})`}
          draggable
          onDragStart={(e) => handleNodeDragStart(e, node.id)}
          onDragOver={(e) => handleNodeDragOver(e, node.id)}
          onDragLeave={(e) => handleNodeDragLeave(e, node.id)}
          onDrop={(e) => handleNodeDrop(e, node.id)}
          onContextMenu={(e) => handleContextMenu(e, node.id)}
          onClick={(e) => {
            e.stopPropagation()
            handleSelectNode(node.id)
          }}
        >
          <rect
            className="org-node-rect"
            x={0}
            y={0}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx={node.type === NODE_TYPES.DEPARTMENT ? 6 : node.type === NODE_TYPES.POSITION ? 0 : NODE_HEIGHT / 2}
            ry={node.type === NODE_TYPES.DEPARTMENT ? 6 : node.type === NODE_TYPES.POSITION ? 0 : NODE_HEIGHT / 2}
            fill={colors.bg}
            stroke={colors.border}
            strokeWidth={2}
          />
          {node.type === NODE_TYPES.POSITION && (
            <polygon
              points={`0,0 12,0 6,12`}
              fill={colors.border}
              transform={`translate(${NODE_WIDTH - 12}, -0)`}
            />
          )}
          <text
            className="org-node-text"
            x={node.type === NODE_TYPES.PERSON ? 36 : 14}
            y={26}
            fill={colors.text}
          >
            <tspan className="org-node-icon">{NODE_TYPE_ICONS[node.type]}</tspan>
            <tspan className="org-node-name" x={node.type === NODE_TYPES.PERSON ? 36 + 26 : 14 + 28}>
              {node.name.length > 8 ? node.name.slice(0, 8) + '…' : node.name}
            </tspan>
          </text>
          <text
            className="org-node-text org-node-type"
            x={node.type === NODE_TYPES.PERSON ? 36 : 14}
            y={46}
            fill={colors.text}
          >
            {NODE_TYPE_LABELS[node.type]}
          </text>
          {node.type === NODE_TYPES.PERSON && node.email && (
            <text
              className="org-node-text org-node-extra"
              x={36}
              y={62}
              fill={colors.text}
            >
              {node.email.length > 14 ? node.email.slice(0, 14) + '…' : node.email}
            </text>
          )}
          {node.children && node.children.length > 0 && (
            <circle
              cx={layoutDirection === LAYOUT_DIRECTIONS.HORIZONTAL ? NODE_WIDTH : NODE_WIDTH / 2}
              cy={layoutDirection === LAYOUT_DIRECTIONS.HORIZONTAL ? NODE_HEIGHT / 2 : NODE_HEIGHT}
              r={7}
              fill="#fff"
              stroke={colors.border}
              strokeWidth={2}
            />
          )}
        </g>
      )

      if (node.children) {
        for (const child of node.children) {
          traverse(child)
        }
      }
    }
    if (tree) traverse(tree)
    return nodes
  }

  return (
    <div className="org-chart-page">
      <div className="org-chart-header">
        <div className="org-chart-header-left">
          <Link to="/" className="org-back-link">← 返回首页</Link>
          <h1 className="org-chart-title">组织架构图编辑器</h1>
        </div>
      </div>

      <Toolbar
        layoutDirection={layoutDirection}
        onLayoutChange={setLayoutDirection}
        onImportClick={handleImportClick}
        onExportJson={handleExportJson}
        onExportPng={handleExportPng}
        onFitView={handleFitToView}
      />

      <div className="org-main-content">
        <TemplatePanel onDragStart={handleTemplateDragStart} />

        <div
          ref={containerRef}
          className="org-canvas-wrapper"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDragOver={handleCanvasDragOver}
        >
          <svg
            ref={svgRef}
            className="org-canvas"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
              </filter>
            </defs>
            <g
              className="org-canvas-g"
              transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
            >
              {renderConnections()}
              {renderNodes()}
            </g>
          </svg>

          <div className="org-stats">
            <div className="org-stat-item">
              <span className="org-stat-icon">🏢</span>
              <span className="org-stat-value">{stats[NODE_TYPES.DEPARTMENT]}</span>
              <span>部门</span>
            </div>
            <div className="org-stat-item">
              <span className="org-stat-icon">💼</span>
              <span className="org-stat-value">{stats[NODE_TYPES.POSITION]}</span>
              <span>职位</span>
            </div>
            <div className="org-stat-item">
              <span className="org-stat-icon">👤</span>
              <span className="org-stat-value">{stats[NODE_TYPES.PERSON]}</span>
              <span>人员</span>
            </div>
          </div>

          <div className="org-zoom-controls">
            <button className="org-zoom-btn" onClick={handleZoomOut} title="缩小">−</button>
            <div className="org-zoom-info">{(zoom * 100).toFixed(0)}%</div>
            <button className="org-zoom-btn" onClick={handleZoomIn} title="放大">+</button>
            <button className="org-zoom-btn" onClick={handleFitToView} title="适应画布" style={{ fontSize: '14px' }}>
              ⤢
            </button>
          </div>

          {propertyPanelNode && (
            <PropertyPanel
              node={propertyPanelNode}
              onUpdate={handleUpdateNode}
              onClose={() => setPropertyPanelNode(null)}
              onDelete={handleDeleteNode}
              rootId={tree?.id}
            />
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="org-hidden-file-input"
        onChange={handleImportFile}
      />

      {contextMenu && selectedNode && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={selectedNode}
          onClose={() => setContextMenu(null)}
          onEdit={() => setPropertyPanelNode(selectedNode)}
          onDelete={() => handleDeleteNode(selectedId)}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
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

export default OrgChartPage
