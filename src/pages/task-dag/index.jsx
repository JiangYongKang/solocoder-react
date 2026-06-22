import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './task-dag.css'
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  createNode,
  updateNode,
  deleteNode,
  getNodeById,
  createEdge,
  deleteEdge,
  validateEdge,
  topologicalSort,
  criticalPath,
  autoLayout,
  clampZoom,
  screenToWorld,
  getNodePort,
  buildBezierPath,
  fitToView,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  downloadJson,
  importFromJson,
} from './taskDagCore.js'

let _initStorageCache = null
let _initStorageError = null

function _getInitStorage() {
  if (!_initStorageCache) {
    _initStorageCache = loadFromStorage()
    if (_initStorageCache?.error) {
      _initStorageError = _initStorageCache.error
    }
  }
  return _initStorageCache
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`task-dag-toast ${type === 'error' ? 'error' : ''}`}>
      {message}
    </div>
  )
}

function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null)
  const position = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768
    const mw = 160
    const mh = Math.max(items.length * 40 + 8, 100)
    let posX = x
    let posY = y
    if (posX + mw > vw) posX = vw - mw - 10
    if (posY + mh > vh) posY = vh - mh - 10
    return { x: posX, y: posY }
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
      className="task-dag-context-menu"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`task-dag-context-menu-item ${item.danger ? 'danger' : ''}`}
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

function TopoModal({ nodes, edges, onClose }) {
  const sorted = useMemo(() => topologicalSort(nodes, edges), [nodes, edges])

  return (
    <div className="task-dag-modal-overlay" onClick={onClose}>
      <div className="task-dag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-dag-modal-header">
          <h3 className="task-dag-modal-title">拓扑排序结果</h3>
          <button className="task-dag-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="task-dag-modal-body">
          {sorted.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              无法进行拓扑排序（图中可能存在环路）
            </div>
          ) : (
            <div className="task-dag-topo-list">
              {sorted.map((node, idx) => (
                <div key={node.id} className="task-dag-topo-item">
                  <span className="task-dag-topo-order">{idx + 1}</span>
                  <span className="task-dag-topo-name">{node.name}</span>
                  {idx < sorted.length - 1 && <span className="task-dag-topo-arrow">→</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="task-dag-modal-footer">
          <button className="task-dag-btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}

function TaskNode({
  node,
  selected,
  critical,
  editing,
  onSelect,
  onStartDrag,
  onStartDragEdge,
  onDoubleClick,
  onEditName,
  onEditingChange,
  onContextMenu,
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT') return
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    dragOffsetRef.current = {
      x: e.clientX,
      y: e.clientY,
    }

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragOffsetRef.current.x
      const dy = moveEvent.clientY - dragOffsetRef.current.y
      dragOffsetRef.current = {
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      }
      onStartDrag(node.id, dx, dy)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handlePortMouseDown = (e, port) => {
    e.preventDefault()
    e.stopPropagation()
    onStartDragEdge(node.id, port)
  }

  const handleInputBlur = () => {
    onEditingChange(null)
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      onEditingChange(null)
    } else if (e.key === 'Escape') {
      onEditingChange(null)
    }
  }

  const nodeClasses = [
    'task-dag-node',
    selected ? 'selected' : '',
    critical ? 'critical' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={nodeClasses}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick(node.id)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu(node.id, e.clientX, e.clientY)
      }}
    >
      <div
        className={`task-dag-port task-dag-port-input ${critical ? 'critical' : ''}`}
        onMouseDown={(e) => handlePortMouseDown(e, 'input')}
        title="输入端口（拖出连线建立依赖）"
      />
      {editing ? (
        <input
          ref={inputRef}
          className="task-dag-node-input"
          value={node.name}
          onChange={(e) => onEditName(node.id, e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="task-dag-node-name" title={node.name}>
          {node.name}
        </span>
      )}
      <div
        className={`task-dag-port task-dag-port-output ${critical ? 'critical' : ''}`}
        onMouseDown={(e) => handlePortMouseDown(e, 'output')}
        title="输出端口（拖出连线建立依赖）"
      />
    </div>
  )
}

function TaskDAGPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const innerRef = useRef(null)
  const lastSaveAlertRef = useRef(0)

  const [nodes, setNodes] = useState(() => {
    const saved = _getInitStorage()
    return saved.nodes || []
  })
  const [edges, setEdges] = useState(() => {
    const saved = _getInitStorage()
    return saved.edges || []
  })
  const [toast, setToast] = useState(() => {
    if (_initStorageError) {
      const err = _initStorageError
      _initStorageError = null
      return { message: '读取本地存储失败: ' + err, type: 'error' }
    }
    return null
  })
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const [edgeDraft, setEdgeDraft] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [topoModal, setTopoModal] = useState(false)
  const [criticalPathSet, setCriticalPathSet] = useState({ nodes: new Set(), edges: new Set() })

  const latestRef = useRef({ nodes: [], edges: [], pan: { x: 0, y: 0 }, zoom: 1, edgeDraft: null })

  useEffect(() => {
    latestRef.current.nodes = nodes
  }, [nodes])

  useEffect(() => {
    latestRef.current.edges = edges
  }, [edges])

  useEffect(() => {
    latestRef.current.pan = pan
  }, [pan])

  useEffect(() => {
    latestRef.current.zoom = zoom
  }, [zoom])

  useEffect(() => {
    latestRef.current.edgeDraft = edgeDraft
  }, [edgeDraft])

  const handleFitToView = useCallback(() => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const { panX, panY, zoom: newZoom } = fitToView(nodes, rect.width, rect.height, 100)
    setPan({ x: panX, y: panY })
    setZoom(newZoom)
  }, [nodes])

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    const result = saveToStorage(nodes, edges)
    if (!result) {
      const now = Date.now()
      if (now - lastSaveAlertRef.current >= 5000) {
        lastSaveAlertRef.current = now
        showToast('保存本地存储失败，数据可能丢失', 'error')
      }
    }
  }, [nodes, edges, showToast])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToView()
    }, 100)
    return () => clearTimeout(timer)
  }, [handleFitToView])

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
    setSelectedNodeId(null)
    setContextMenu(null)
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
  }

  const handleCanvasDoubleClick = (e) => {
    if (e.target !== canvasRef.current && e.target !== innerRef.current) return
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const world = screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top,
      pan.x,
      pan.y,
      zoom
    )
    const newNode = createNode('新任务', world.x - NODE_WIDTH / 2, world.y - NODE_HEIGHT / 2)
    setNodes((prev) => [...prev, newNode])
    setSelectedNodeId(newNode.id)
    setEditingId(newNode.id)
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

  const handleStartDragNode = useCallback((nodeId, dx, dy) => {
    setNodes((prev) => updateNode(prev, nodeId, {
      x: (prev.find((n) => n.id === nodeId)?.x || 0) + dx / zoom,
      y: (prev.find((n) => n.id === nodeId)?.y || 0) + dy / zoom,
    }))
  }, [zoom])

  const handleStartDragEdge = useCallback((nodeId, port) => {
    const node = getNodeById(nodes, nodeId)
    if (!node) return
    const anchor = getNodePort(node, port)
    setEdgeDraft({
      fromNodeId: nodeId,
      fromPort: port,
      startX: anchor.x,
      startY: anchor.y,
      currentX: anchor.x,
      currentY: anchor.y,
    })
  }, [nodes])

  useEffect(() => {
    if (!edgeDraft) return

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const { pan: curPan, zoom: curZoom } = latestRef.current
      const world = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
        curPan.x,
        curPan.y,
        curZoom
      )
      setEdgeDraft((prev) => prev ? { ...prev, currentX: world.x, currentY: world.y } : null)
    }

    const handleMouseUp = (e) => {
      const draft = latestRef.current.edgeDraft
      setEdgeDraft(null)
      if (!draft) return

      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const { pan: curPan, zoom: curZoom, nodes: curNodes, edges: curEdges } = latestRef.current
      const worldX = (e.clientX - rect.left - curPan.x) / curZoom
      const worldY = (e.clientY - rect.top - curPan.y) / curZoom

      for (const node of curNodes) {
        if (node.id === draft.fromNodeId) continue
        if (worldX < node.x || worldX > node.x + NODE_WIDTH) continue
        if (worldY < node.y || worldY > node.y + NODE_HEIGHT) continue

        let from, to
        if (draft.fromPort === 'output') {
          from = draft.fromNodeId
          to = node.id
        } else {
          from = node.id
          to = draft.fromNodeId
        }

        const result = validateEdge(curNodes, curEdges, from, to)
        if (result.valid) {
          const newEdge = createEdge(from, to)
          setEdges((prev) => [...prev, newEdge])
          showToast('依赖关系已建立')
        } else {
          showToast(result.error, 'error')
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
  }, [edgeDraft, showToast])

  const handleSelectNode = useCallback((nodeId) => {
    setSelectedNodeId(nodeId)
    setContextMenu(null)
  }, [])

  const handleDoubleClickNode = useCallback((nodeId) => {
    setEditingId(nodeId)
    setSelectedNodeId(nodeId)
  }, [])

  const handleEditName = useCallback((nodeId, name) => {
    setNodes((prev) => updateNode(prev, nodeId, { name: name }))
  }, [])

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((prev) => {
      const result = deleteNode(prev, edges, nodeId)
      setEdges(result.edges)
      return result.nodes
    })
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
    setCriticalPathSet({ nodes: new Set(), edges: new Set() })
  }, [edges, selectedNodeId])

  const handleDeleteEdge = useCallback((edgeId) => {
    setEdges((prev) => deleteEdge(prev, edgeId))
    setCriticalPathSet({ nodes: new Set(), edges: new Set() })
  }, [])

  const handleAddNode = useCallback(() => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const centerX = (rect.width / 2 - pan.x) / zoom
    const centerY = (rect.height / 2 - pan.y) / zoom
    const offset = nodes.length * 30
    const newNode = createNode(
      '新任务',
      centerX - NODE_WIDTH / 2 + offset,
      centerY - NODE_HEIGHT / 2 + offset
    )
    setNodes((prev) => [...prev, newNode])
    setSelectedNodeId(newNode.id)
    setEditingId(newNode.id)
  }, [pan, zoom, nodes.length])

  const handleTopologicalSort = useCallback(() => {
    const sorted = topologicalSort(nodes, edges)
    if (sorted.length === 0) {
      showToast('无法进行拓扑排序（图中可能存在环路）', 'error')
      return
    }
    setTopoModal(true)
  }, [nodes, edges, showToast])

  const handleCriticalPath = useCallback(() => {
    const cp = criticalPath(nodes, edges)
    if (cp.nodes.length === 0) {
      showToast('无法计算关键路径', 'error')
      return
    }
    setCriticalPathSet({
      nodes: new Set(cp.nodes),
      edges: new Set(cp.edges),
    })
    showToast(`关键路径长度：${cp.length} 个任务`)
  }, [nodes, edges, showToast])

  const handleClearCriticalPath = useCallback(() => {
    setCriticalPathSet({ nodes: new Set(), edges: new Set() })
  }, [])

  const handleAutoLayout = useCallback(() => {
    const layoutNodes = autoLayout(nodes, edges)
    setNodes(layoutNodes)
    setCriticalPathSet({ nodes: new Set(), edges: new Set() })
    setTimeout(() => handleFitToView(), 50)
  }, [nodes, edges, handleFitToView])

  const handleZoomIn = useCallback(() => setZoom((z) => clampZoom(z * 1.2)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => clampZoom(z / 1.2)), [])

  const handleExportJson = useCallback(() => {
    const result = downloadJson(nodes, edges)
    if (!result.success) {
      showToast('导出 JSON 失败: ' + result.error, 'error')
    } else {
      showToast('JSON 已导出')
    }
  }, [nodes, edges, showToast])

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
        setNodes(result.data.nodes)
        setEdges(result.data.edges)
        setCriticalPathSet({ nodes: new Set(), edges: new Set() })
        showToast('导入成功')
        setTimeout(() => handleFitToView(), 50)
      } else {
        showToast('导入失败: ' + result.error, 'error')
      }
    } catch (err) {
      showToast('导入失败: ' + (err?.message || '无法解析 JSON 文件'), 'error')
    }
    e.target.value = ''
  }, [handleFitToView, showToast])

  const handleClearAll = useCallback(() => {
    if (confirm('确定要清空所有任务和依赖关系吗？')) {
      setNodes([])
      setEdges([])
      setSelectedNodeId(null)
      setCriticalPathSet({ nodes: new Set(), edges: new Set() })
      const result = clearStorage()
      if (!result.success) {
        console.warn('清除本地存储失败:', result.error)
      }
    }
  }, [])

  const handleNodeContextMenu = useCallback((nodeId, clientX, clientY) => {
    setSelectedNodeId(nodeId)
    setContextMenu({
      x: clientX,
      y: clientY,
      items: [
        { icon: '✏️', label: '编辑名称', onClick: () => setEditingId(nodeId) },
        { icon: '🗑️', label: '删除节点', danger: true, onClick: () => handleDeleteNode(nodeId) },
      ],
    })
  }, [handleDeleteNode])

  const handleEdgeContextMenu = useCallback((e, edgeId) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { icon: '🗑️', label: '删除连线', danger: true, onClick: () => handleDeleteEdge(edgeId) },
      ],
    })
  }, [handleDeleteEdge])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && e.key === '=' || e.key === '+') {
        e.preventDefault()
        handleZoomIn()
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        handleFitToView()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault()
          handleDeleteNode(selectedNodeId)
        }
      } else if (e.key === 'F2') {
        e.preventDefault()
        if (selectedNodeId) {
          setEditingId(selectedNodeId)
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null)
        setEditingId(null)
        setContextMenu(null)
        handleClearCriticalPath()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    editingId,
    selectedNodeId,
    handleZoomIn,
    handleZoomOut,
    handleFitToView,
    handleDeleteNode,
    handleClearCriticalPath,
  ])

  return (
    <div className="task-dag-page">
      <div className="task-dag-header">
        <div className="task-dag-header-left">
          <button className="task-dag-btn task-dag-btn-back" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="task-dag-title">任务依赖图</h1>
        </div>
        <div className="task-dag-header-actions">
          <button className="task-dag-btn" onClick={handleAutoLayout}>
            📐 自动布局
          </button>
          <button className="task-dag-btn" onClick={handleTopologicalSort}>
            📊 拓扑排序
          </button>
          <button
            className={`task-dag-btn ${criticalPathSet.nodes.size > 0 ? 'task-dag-btn-danger' : ''}`}
            onClick={criticalPathSet.nodes.size > 0 ? handleClearCriticalPath : handleCriticalPath}
          >
            {criticalPathSet.nodes.size > 0 ? '🔴 清除高亮' : '🔥 关键路径'}
          </button>
          <button className="task-dag-btn" onClick={handleExportJson}>
            ⬇️ 导出 JSON
          </button>
          <button className="task-dag-btn" onClick={handleImportClick}>
            ⬆️ 导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="task-dag-file-input"
            onChange={handleImportFile}
          />
          <button className="task-dag-btn task-dag-btn-danger" onClick={handleClearAll}>
            🗑️ 清空
          </button>
        </div>
      </div>

      <div className="task-dag-main">
        <div className="task-dag-toolbar">
          <div className="task-dag-toolbar-left">
            <button
              className="task-dag-btn task-dag-btn-primary"
              onClick={handleAddNode}
            >
              ➕ 添加节点
            </button>
          </div>
          <div className="task-dag-toolbar-right">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              节点: {nodes.length} | 连线: {edges.length}
            </span>
          </div>
        </div>

        <div className="task-dag-canvas-wrap">
          <div
            ref={canvasRef}
            className={`task-dag-canvas ${isPanning ? 'panning' : ''}`}
            onMouseDown={handleCanvasMouseDown}
            onDoubleClick={handleCanvasDoubleClick}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null) }}
          >
            <div
              ref={innerRef}
              className="task-dag-canvas-inner"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <div className="task-dag-grid" />

              <svg className="task-dag-canvas-svg task-dag-canvas-svg-interactive">
                <defs>
                  <marker
                    id="task-dag-arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" className="task-dag-arrowhead" />
                  </marker>
                  <marker
                    id="task-dag-arrowhead-critical"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" className="task-dag-arrowhead-critical" />
                  </marker>
                </defs>

                {edges.map((edge) => {
                  const fromNode = getNodeById(nodes, edge.from)
                  const toNode = getNodeById(nodes, edge.to)
                  if (!fromNode || !toNode) return null
                  const from = getNodePort(fromNode, 'output')
                  const to = getNodePort(toNode, 'input')
                  const isCritical = criticalPathSet.edges.has(edge.id)
                  return (
                    <path
                      key={edge.id}
                      className={`task-dag-edge ${isCritical ? 'task-dag-edge-critical' : ''}`}
                      d={buildBezierPath(from, to)}
                      markerEnd={isCritical ? 'url(#task-dag-arrowhead-critical)' : 'url(#task-dag-arrowhead)'}
                      onContextMenu={(e) => handleEdgeContextMenu(e, edge.id)}
                    />
                  )
                })}
                {edgeDraft && (
                  <path
                    className="task-dag-temp-edge"
                    d={buildBezierPath(
                      { x: edgeDraft.startX, y: edgeDraft.startY },
                      { x: edgeDraft.currentX, y: edgeDraft.currentY }
                    )}
                  />
                )}
              </svg>

              {nodes.length === 0 && (
                <div
                  className="task-dag-empty-canvas"
                  style={{ transform: `translate(${-pan.x / zoom}px, ${-pan.y / zoom}px) scale(${1 / zoom})` }}
                >
                  双击画布空白区域或点击「添加节点」开始创建任务
                </div>
              )}

              {nodes.map((node) => (
                <TaskNode
                  key={node.id}
                  node={node}
                  selected={node.id === selectedNodeId}
                  critical={criticalPathSet.nodes.has(node.id)}
                  editing={node.id === editingId}
                  onSelect={() => handleSelectNode(node.id)}
                  onStartDrag={handleStartDragNode}
                  onStartDragEdge={handleStartDragEdge}
                  onDoubleClick={handleDoubleClickNode}
                  onEditName={handleEditName}
                  onEditingChange={setEditingId}
                  onContextMenu={handleNodeContextMenu}
                />
              ))}
            </div>

            <div className="task-dag-zoom-controls">
              <button className="task-dag-zoom-btn" onClick={handleZoomOut} title="缩小">−</button>
              <div className="task-dag-zoom-info">{Math.round(zoom * 100)}%</div>
              <button className="task-dag-zoom-btn" onClick={handleZoomIn} title="放大">+</button>
              <button className="task-dag-zoom-btn" onClick={handleFitToView} title="适应画布" style={{ fontSize: '12px' }}>
                ⤢
              </button>
            </div>
          </div>
        </div>

        <div className="task-dag-hint">
          <div>
            <kbd>双击</kbd> 画布/节点 添加/编辑
            <kbd>Del</kbd> 删除
            <kbd>F2</kbd> 重命名
          </div>
          <div>
            <kbd>滚轮</kbd> 缩放
            <kbd>拖拽空白</kbd> 平移
            <kbd>拖拽节点</kbd> 移动位置
          </div>
          <div>
            <kbd>拖拽端口</kbd> 建立依赖
            <kbd>右键</kbd> 更多操作
            <kbd>Esc</kbd> 取消选择
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

      {topoModal && (
        <TopoModal
          nodes={nodes}
          edges={edges}
          onClose={() => setTopoModal(false)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default TaskDAGPage
