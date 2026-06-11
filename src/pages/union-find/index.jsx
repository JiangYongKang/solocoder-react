import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import './union-find.css'
import {
  createInitialState,
  addNode,
  union,
  find,
  findNoCompression,
  cloneState,
  isRoot,
  getChildren,
  getNodeById,
  getAllNodeIds,
  getNodeCount,
  getSetCount,
  calculateForestLayout,
  clampZoom,
  screenToWorld,
  createOperationLog,
  randomDuration,
  formatTimestamp,
  exportLogsToJson,
  downloadJson,
  getSetMembers,
} from './unionFindCore.js'
import {
  NODE_RADIUS,
  COLORS,
  OPERATION_TYPE,
  OPERATION_TYPE_LABEL,
  ANIMATION_DURATION,
} from './constants.js'

function UnionFindCanvas({
  state,
  highlighting,
  findPath,
  pathCompressEdges,
  animatingEdge,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  onNodeDrag,
  onNodeDragStart,
  onNodeDragEnd,
}) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [isPanning, setIsPanning] = useState(false)
  const isPanningRef = useRef(false)
  const didMoveRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const [draggingNode, setDraggingNode] = useState(null)
  const draggingNodeRef = useRef(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setSize({ width: rect.width, height: rect.height })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.uf-node')) return
    setIsPanning(true)
    isPanningRef.current = true
    didMoveRef.current = false
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    if (draggingNodeRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const world = screenToWorld(mouseX, mouseY, pan.x, pan.y, zoom)

      const newX = world.x - dragOffsetRef.current.x
      const newY = world.y - dragOffsetRef.current.y

      const nodeId = draggingNodeRef.current
      const isNodeRoot = isRoot(state, nodeId)

      if (isNodeRoot) {
        const currentPos = state.positions.get(nodeId)
        const dx = newX - currentPos.x
        const dy = newY - currentPos.y
        const members = getSetMembers(state, nodeId)
        const newPositions = new Map(state.positions)

        members.forEach((mid) => {
          const mpos = state.positions.get(mid)
          newPositions.set(mid, { x: mpos.x + dx, y: mpos.y + dy })
        })

        onNodeDrag(nodeId, newPositions)
      } else {
        const currentPos = state.positions.get(nodeId)
        const dx = newX - currentPos.x
        const dy = newY - currentPos.y
        const newPositions = new Map(state.positions)

        const moveSubtree = (nid, visited = new Set()) => {
          if (visited.has(nid)) return
          visited.add(nid)
          const pos = state.positions.get(nid)
          newPositions.set(nid, { x: pos.x + dx, y: pos.y + dy })
          const children = getChildren(state, nid)
          children.forEach((cid) => moveSubtree(cid, visited))
        }

        moveSubtree(nodeId)
        onNodeDrag(nodeId, newPositions)
      }
      return
    }

    if (!isPanningRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      didMoveRef.current = true
    }
    onPanChange({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    })
  }, [pan, zoom, state, onNodeDrag, onPanChange])

  const handleMouseUp = useCallback(() => {
    if (draggingNodeRef.current) {
      onNodeDragEnd(draggingNodeRef.current)
      draggingNodeRef.current = null
      setDraggingNode(null)
    }
    setIsPanning(false)
    isPanningRef.current = false
  }, [onNodeDragEnd])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = clampZoom(zoom * delta)

    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const worldBefore = screenToWorld(mouseX, mouseY, pan.x, pan.y, zoom)
    const worldAfter = screenToWorld(mouseX, mouseY, pan.x, pan.y, newZoom)

    const newPan = {
      x: pan.x + (worldBefore.x - worldAfter.x) * newZoom,
      y: pan.y + (worldBefore.y - worldAfter.y) * newZoom,
    }

    onZoomChange(newZoom)
    onPanChange(newPan)
  }, [zoom, pan, onZoomChange, onPanChange])

  const handleNodeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation()
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const world = screenToWorld(mouseX, mouseY, pan.x, pan.y, zoom)
    const nodePos = state.positions.get(nodeId)

    dragOffsetRef.current = {
      x: world.x - nodePos.x,
      y: world.y - nodePos.y,
    }
    draggingNodeRef.current = nodeId
    setDraggingNode(nodeId)
    onNodeDragStart(nodeId)
  }, [pan, zoom, state, onNodeDragStart])

  const nodeIds = getAllNodeIds(state)
  const edges = []
  const edgeMap = new Map()

  nodeIds.forEach((id) => {
    if (!isRoot(state, id)) {
      const parentId = state.parent.get(id)
      const key = `${id}-${parentId}`
      if (!edgeMap.has(key)) {
        edges.push({ from: id, to: parentId })
        edgeMap.set(key, true)
      }
    }
  })

  if (animatingEdge && !edgeMap.has(`${animatingEdge.from}-${animatingEdge.to}`)) {
    edges.push({ from: animatingEdge.from, to: animatingEdge.to, isOverlay: true })
    edgeMap.set(`${animatingEdge.from}-${animatingEdge.to}`, true)
  }

  const highlightSet = useMemo(() => {
    const result = new Set()
    if (highlighting?.size > 0) {
      highlighting.forEach((id) => result.add(id))
    }
    return result
  }, [highlighting])

  const findPathSet = useMemo(() => new Set(findPath || []), [findPath])
  const pathCompressSet = useMemo(() => new Set(pathCompressEdges || []), [pathCompressEdges])

  const renderEdge = (edge, idx) => {
    const fromPos = state.positions.get(edge.from)
    const toPos = state.positions.get(edge.to)
    if (!fromPos || !toPos) return null

    const x1 = fromPos.x + NODE_RADIUS
    const y1 = fromPos.y + NODE_RADIUS
    const x2 = toPos.x + NODE_RADIUS
    const y2 = toPos.y + NODE_RADIUS

    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) return null

    const nx = dx / len
    const ny = dy / len
    const sx = x1 + nx * NODE_RADIUS
    const sy = y1 + ny * NODE_RADIUS
    const ex = x2 - nx * (NODE_RADIUS + 6)
    const ey = y2 - ny * (NODE_RADIUS + 6)

    const isFindPath = findPathSet.has(edge.from) && findPathSet.has(edge.to)
    const isCompress = pathCompressSet.has(`${edge.from}-${edge.to}`)
    const isAnimating = animatingEdge && animatingEdge.from === edge.from && animatingEdge.to === edge.to
    const isOverlay = edge.isOverlay

    let edgeClass = 'uf-edge'
    let arrowClass = 'uf-arrow'
    let strokeColor = COLORS.edge
    let arrowFill = COLORS.edge

    if (isFindPath) {
      edgeClass += ' highlight'
      arrowClass += ' highlight'
      strokeColor = COLORS.findPath
      arrowFill = COLORS.findPath
    }
    if (isCompress) {
      edgeClass += ' compress'
      arrowClass += ' compress'
      strokeColor = COLORS.pathCompress
      arrowFill = COLORS.pathCompress
    }
    if (isOverlay || isAnimating) {
      edgeClass += ' uf-edge-animate'
    }

    const arrowSize = 8
    const angle = Math.atan2(ey - sy, ex - sx)
    const arrowX = ex
    const arrowY = ey
    const arrowP1 = `${arrowX - arrowSize * Math.cos(angle - Math.PI / 6)},${arrowY - arrowSize * Math.sin(angle - Math.PI / 6)}`
    const arrowP2 = `${arrowX - arrowSize * Math.cos(angle + Math.PI / 6)},${arrowY - arrowSize * Math.sin(angle + Math.PI / 6)}`

    return (
      <g key={`edge-${idx}`}>
        <line
          className={edgeClass}
          x1={sx}
          y1={sy}
          x2={ex}
          y2={ey}
          style={{ stroke: strokeColor }}
        />
        <polygon
          className={arrowClass}
          points={`${arrowX},${arrowY} ${arrowP1} ${arrowP2}`}
          style={{ fill: arrowFill }}
        />
      </g>
    )
  }

  const renderNode = (nodeId) => {
    const node = getNodeById(state, nodeId)
    const pos = state.positions.get(nodeId)
    if (!node || !pos) return null

    const nodeIsRoot = isRoot(state, nodeId)
    const isHighlight = highlightSet.has(nodeId)
    const isInFindPath = findPathSet.has(nodeId)
    const isDragging = draggingNode === nodeId

    let fill = nodeIsRoot ? COLORS.root : COLORS.node
    let stroke = nodeIsRoot ? COLORS.rootStroke : COLORS.nodeStroke

    if (isInFindPath) {
      fill = COLORS.findPath
      stroke = '#2563eb'
    }
    if (isHighlight) {
      fill = COLORS.highlight
      stroke = COLORS.highlightStroke
    }

    return (
      <g
        key={nodeId}
        className={`uf-node ${isHighlight ? 'highlight' : ''} ${isDragging ? 'dragging' : ''}`}
        transform={`translate(${pos.x}, ${pos.y})`}
        onMouseDown={(e) => handleNodeMouseDown(e, nodeId)}
      >
        <circle
          cx={NODE_RADIUS}
          cy={NODE_RADIUS}
          r={NODE_RADIUS - 2}
          fill={fill}
          stroke={stroke}
        />
        <text x={NODE_RADIUS} y={NODE_RADIUS}>
          {node.name}
        </text>
      </g>
    )
  }

  return (
    <div ref={containerRef} className="uf-canvas-wrapper">
      <div className="uf-legend">
        <div className="uf-legend-title">图例</div>
        <div className="uf-legend-item">
          <span className="uf-legend-color" style={{ background: COLORS.root, borderColor: COLORS.rootStroke }} />
          <span>根节点 (集合代表)</span>
        </div>
        <div className="uf-legend-item">
          <span className="uf-legend-color" style={{ background: COLORS.node, borderColor: COLORS.nodeStroke }} />
          <span>普通节点</span>
        </div>
        <div className="uf-legend-item">
          <span className="uf-legend-color" style={{ background: COLORS.highlight, borderColor: COLORS.highlightStroke }} />
          <span>高亮集合</span>
        </div>
        <div className="uf-legend-item">
          <span className="uf-legend-color" style={{ background: COLORS.findPath, borderColor: '#2563eb' }} />
          <span>查找路径</span>
        </div>
        <div className="uf-legend-item">
          <span className="uf-legend-color" style={{ background: COLORS.pathCompress, borderColor: '#16a34a' }} />
          <span>路径压缩连线</span>
        </div>
      </div>

      <svg
        ref={svgRef}
        className={`uf-canvas ${isPanning ? 'panning' : ''}`}
        width={size.width}
        height={size.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <clipPath id="canvas-clip">
            <rect width={size.width} height={size.height} />
          </clipPath>
        </defs>
        <g clipPath="url(#canvas-clip)" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {edges.map(renderEdge)}
          {nodeIds.map(renderNode)}
        </g>
      </svg>

      <div className="uf-zoom-controls">
        <button
          className="uf-zoom-btn"
          onClick={() => onZoomChange(clampZoom(zoom * 1.2))}
          title="放大"
        >
          +
        </button>
        <div className="uf-zoom-info">{Math.round(zoom * 100)}%</div>
        <button
          className="uf-zoom-btn"
          onClick={() => onZoomChange(clampZoom(zoom / 1.2))}
          title="缩小"
        >
          −
        </button>
        <button
          className="uf-zoom-btn"
          onClick={() => {
            onZoomChange(1)
            onPanChange({ x: 0, y: 0 })
          }}
          title="重置视图"
        >
          ⟳
        </button>
      </div>
    </div>
  )
}

export default function UnionFindPage() {
  const [ufState, setUfState] = useState(() => createInitialState())
  const [history, setHistory] = useState([])
  const [historyStates, setHistoryStates] = useState([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [logs, setLogs] = useState([])
  const [newNodeName, setNewNodeName] = useState('')
  const [unionNode1, setUnionNode1] = useState('')
  const [unionNode2, setUnionNode2] = useState('')
  const [findNode, setFindNode] = useState('')
  const [enablePathCompression, setEnablePathCompression] = useState(true)
  const [message, setMessage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [highlighting, setHighlighting] = useState(new Set())
  const [findPath, setFindPath] = useState([])
  const [pathCompressEdges, setPathCompressEdges] = useState([])
  const [animatingEdge, setAnimatingEdge] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isReplaying, setIsReplaying] = useState(false)
  const isDraggingNodeRef = useRef(false)

  const showMessage = useCallback((text, type = 'info', duration = 3000) => {
    setMessage({ text, type })
    if (duration > 0) {
      setTimeout(() => setMessage(null), duration)
    }
  }, [])

  const commitState = useCallback((newState, operation, logEntry, skipLayout = false) => {
    const finalState = skipLayout ? newState : calculateForestLayout(newState)

    setHistory((prev) => [...prev.slice(0, currentStep + 1), operation])
    setHistoryStates((prev) => [...prev.slice(0, currentStep + 1), cloneState(finalState)])
    setCurrentStep((prev) => prev + 1)
    setLogs((prev) => [...prev.slice(0, currentStep + 1), logEntry])
    setUfState(finalState)
  }, [currentStep])

  const handleAddNode = useCallback(() => {
    if (isAnimating || isReplaying) return

    const name = newNodeName.trim()
    const result = addNode(ufState, name || null)
    const duration = randomDuration()
    const log = createOperationLog(
      OPERATION_TYPE.ADD_NODE,
      { name: result.nodeName },
      `添加节点 ${result.nodeName}`,
      duration
    )
    const operation = {
      id: log.id,
      type: OPERATION_TYPE.ADD_NODE,
      params: { name: result.nodeName, nodeId: result.nodeId },
      description: `Add(${result.nodeName})`,
      timestamp: log.timestamp,
    }

    commitState(result.state, operation, log)
    setNewNodeName('')
    showMessage(`节点 ${result.nodeName} 已添加`, 'success')
  }, [ufState, newNodeName, isAnimating, isReplaying, commitState, showMessage])

  const handleUnion = useCallback(async () => {
    if (isAnimating || isReplaying) return
    if (!unionNode1 || !unionNode2) {
      showMessage('请选择两个节点', 'warning')
      return
    }
    if (unionNode1 === unionNode2) {
      showMessage('不能合并同一个节点', 'warning')
      return
    }

    setIsAnimating(true)

    const n1 = getNodeById(ufState, unionNode1)
    const n2 = getNodeById(ufState, unionNode2)

    const set1 = getSetMembers(ufState, findNoCompression(ufState, unionNode1).root)
    const set2 = getSetMembers(ufState, findNoCompression(ufState, unionNode2).root)
    const allMembers = new Set([...set1, ...set2])

    setHighlighting(allMembers)
    await new Promise((r) => setTimeout(r, ANIMATION_DURATION.highlight * 2))

    const result = union(ufState, unionNode1, unionNode2)

    if (!result.success) {
      setHighlighting(new Set())
      setIsAnimating(false)
      const duration = randomDuration()
      const log = createOperationLog(
        OPERATION_TYPE.UNION,
        { node1: n1.name, node2: n2.name },
        result.message,
        duration
      )
      const operation = {
        id: log.id,
        type: OPERATION_TYPE.UNION,
        params: { node1: n1.name, node2: n2.name, nodeId1: unionNode1, nodeId2: unionNode2 },
        description: `Union(${n1.name}, ${n2.name})`,
        timestamp: log.timestamp,
      }
      commitState(result.state, operation, log)
      showMessage(result.message, 'warning')
      return
    }

    const laidOutState = calculateForestLayout(result.state)
    setUfState(laidOutState)

    setAnimatingEdge({ from: result.childRoot, to: result.parentRoot })
    await new Promise((r) => setTimeout(r, ANIMATION_DURATION.union))

    const duration = randomDuration()
    const log = createOperationLog(
      OPERATION_TYPE.UNION,
      { node1: n1.name, node2: n2.name },
      result.message,
      duration
    )
    const operation = {
      id: log.id,
      type: OPERATION_TYPE.UNION,
      params: { node1: n1.name, node2: n2.name, nodeId1: unionNode1, nodeId2: unionNode2 },
      description: `Union(${n1.name}, ${n2.name})`,
      timestamp: log.timestamp,
    }

    commitState(laidOutState, operation, log, true)
    setHighlighting(new Set())
    setAnimatingEdge(null)
    setIsAnimating(false)
    showMessage(`合并成功：${result.message}`, 'success')
  }, [ufState, unionNode1, unionNode2, isAnimating, isReplaying, commitState, showMessage])

  const handleFind = useCallback(async () => {
    if (isAnimating || isReplaying) return
    if (!findNode) {
      showMessage('请选择一个节点', 'warning')
      return
    }

    setIsAnimating(true)

    const node = getNodeById(ufState, findNode)
    const pathResult = findNoCompression(ufState, findNode)
    const path = pathResult.path

    for (let i = 0; i < path.length; i++) {
      setFindPath(path.slice(0, i + 1))
      await new Promise((r) => setTimeout(r, ANIMATION_DURATION.findStep))
    }

    await new Promise((r) => setTimeout(r, 300))

    let finalState = ufState
    let compressedNodes = []
    const compressEdges = []

    if (enablePathCompression && path.length > 2) {
      const compressResult = find(ufState, findNode, true)
      finalState = compressResult.state
      compressedNodes = compressResult.compressedNodes

      for (const nodeId of compressedNodes) {
        const edgeKey = `${nodeId}-${compressResult.root}`
        compressEdges.push(edgeKey)
        setPathCompressEdges([...compressEdges])
        await new Promise((r) => setTimeout(r, ANIMATION_DURATION.pathCompress / compressedNodes.length))
      }
    }

    const rootNode = getNodeById(finalState, path[path.length - 1])
    const duration = randomDuration()

    let resultMsg = `找到根节点 ${rootNode.name}`
    if (compressedNodes.length > 0) {
      const compressedNames = compressedNodes.map((id) => getNodeById(finalState, id).name).join('、')
      resultMsg += `，路径压缩了 ${compressedNames}`
    }

    const log = createOperationLog(
      OPERATION_TYPE.FIND,
      { node: node.name, pathCompression: enablePathCompression },
      resultMsg,
      duration
    )
    const operation = {
      id: log.id,
      type: OPERATION_TYPE.FIND,
      params: { node: node.name, nodeId: findNode, pathCompression: enablePathCompression },
      description: `Find(${node.name})`,
      timestamp: log.timestamp,
    }

    commitState(finalState, operation, log, true)

    setTimeout(() => {
      setFindPath([])
      setPathCompressEdges([])
    }, 800)

    setIsAnimating(false)
    showMessage(resultMsg, 'info', 4000)
  }, [ufState, findNode, enablePathCompression, isAnimating, isReplaying, commitState, showMessage])

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex < -1 || stepIndex >= historyStates.length) return
    setIsReplaying(true)

    setCurrentStep(stepIndex)
    if (stepIndex === -1) {
      setUfState(createInitialState())
    } else {
      setUfState(cloneState(historyStates[stepIndex]))
    }

    setHighlighting(new Set())
    setFindPath([])
    setPathCompressEdges([])
    setAnimatingEdge(null)

    setTimeout(() => {
      setIsReplaying(false)
    }, 100)
  }, [historyStates])

  const handlePrevStep = useCallback(() => {
    goToStep(currentStep - 1)
  }, [currentStep, goToStep])

  const handleNextStep = useCallback(() => {
    if (currentStep >= historyStates.length - 1) return
    goToStep(currentStep + 1)
  }, [currentStep, historyStates.length, goToStep])

  const handleJumpToStart = useCallback(() => {
    goToStep(-1)
  }, [goToStep])

  const handleJumpToEnd = useCallback(() => {
    goToStep(historyStates.length - 1)
  }, [historyStates.length, goToStep])

  const handleClearAll = useCallback(() => {
    setUfState(createInitialState())
    setHistory([])
    setHistoryStates([])
    setCurrentStep(-1)
    setLogs([])
    setUnionNode1('')
    setUnionNode2('')
    setFindNode('')
    setHighlighting(new Set())
    setFindPath([])
    setPathCompressEdges([])
    setMessage(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    showMessage('已清空所有数据', 'success')
  }, [showMessage])

  const handleExportLogs = useCallback(() => {
    const data = exportLogsToJson(logs)
    downloadJson(data, `union-find-logs-${Date.now()}.json`)
  }, [logs])

  const handleNodeDrag = useCallback((nodeId, newPositions) => {
    if (isReplaying) return
    isDraggingNodeRef.current = true
    setUfState((prev) => {
      const next = cloneState(prev)
      next.positions = newPositions
      return next
    })
  }, [isReplaying])

  const handleNodeDragStart = useCallback(() => {
    isDraggingNodeRef.current = true
  }, [])

  const handleNodeDragEnd = useCallback(() => {
    isDraggingNodeRef.current = false
  }, [])

  const nodeOptions = useMemo(() => {
    return getAllNodeIds(ufState).map((id) => {
      const node = getNodeById(ufState, id)
      return { id, name: node.name }
    })
  }, [ufState])

  const nodeCount = getNodeCount(ufState)
  const setCount = getSetCount(ufState)

  return (
    <div className="union-find-page">
      <div className="uf-header">
        <h1>并查集 (Union-Find) 算法可视化</h1>
        <div className="uf-stats">
          <div className="uf-stat">
            <span className="uf-stat-label">节点数</span>
            <span className="uf-stat-value">{nodeCount}</span>
          </div>
          <div className="uf-stat">
            <span className="uf-stat-label">集合数</span>
            <span className="uf-stat-value">{setCount}</span>
          </div>
          <div className="uf-stat">
            <span className="uf-stat-label">操作数</span>
            <span className="uf-stat-value">{logs.length}</span>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          <div className={`uf-message ${message.type}`}>{message.text}</div>
        </div>
      )}

      <div className="uf-timeline">
        <div className="uf-timeline-header">
          <div className="uf-timeline-title">
            操作步骤 {currentStep >= 0 ? `(${currentStep + 1} / ${history.length})` : ''}
          </div>
          <div className="uf-timeline-controls">
            <button
              className="uf-timeline-btn"
              onClick={handleJumpToStart}
              disabled={currentStep <= -1 || isAnimating}
            >
              ⏮ 开始
            </button>
            <button
              className="uf-timeline-btn"
              onClick={handlePrevStep}
              disabled={currentStep <= -1 || isAnimating}
            >
              ◀ 上一步
            </button>
            <button
              className="uf-timeline-btn"
              onClick={handleNextStep}
              disabled={currentStep >= historyStates.length - 1 || isAnimating}
            >
              下一步 ▶
            </button>
            <button
              className="uf-timeline-btn"
              onClick={handleJumpToEnd}
              disabled={currentStep >= historyStates.length - 1 || isAnimating}
            >
              结束 ⏭
            </button>
          </div>
        </div>
        <div className="uf-timeline-steps">
          {history.length === 0 && (
            <div style={{ color: '#94a3b8', fontSize: '12px', padding: '8px 12px' }}>
              暂无操作记录，请在左侧控制面板开始操作
            </div>
          )}
          {history.map((op, idx) => (
            <div
              key={op.id}
              className={`uf-step ${idx === currentStep ? 'active' : ''}`}
              onClick={() => !isAnimating && goToStep(idx)}
              style={{ opacity: idx > currentStep ? 0.6 : 1 }}
            >
              <div className="uf-step-index">#{idx + 1} · {formatTimestamp(op.timestamp)}</div>
              <div className="uf-step-type">{op.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="uf-main">
        <div className="uf-control-panel">
          <div className="uf-section">
            <h3 className="uf-section-title">添加节点</h3>
            <div className="uf-form-group">
              <label className="uf-label">节点名称 (可选)</label>
              <input
                type="text"
                className="uf-input"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder="留空自动生成 A、B、C..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
                disabled={isAnimating || isReplaying}
              />
            </div>
            <button
              className="uf-btn uf-btn-primary"
              onClick={handleAddNode}
              disabled={isAnimating || isReplaying}
            >
              + 添加节点
            </button>
          </div>

          <div className="uf-section">
            <h3 className="uf-section-title">合并操作 (Union)</h3>
            <div className="uf-form-group">
              <label className="uf-label">节点 1</label>
              <select
                className="uf-select"
                value={unionNode1}
                onChange={(e) => setUnionNode1(e.target.value)}
                disabled={nodeOptions.length < 2 || isAnimating || isReplaying}
              >
                <option value="">请选择节点</option>
                {nodeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div className="uf-form-group">
              <label className="uf-label">节点 2</label>
              <select
                className="uf-select"
                value={unionNode2}
                onChange={(e) => setUnionNode2(e.target.value)}
                disabled={nodeOptions.length < 2 || isAnimating || isReplaying}
              >
                <option value="">请选择节点</option>
                {nodeOptions
                  .filter((opt) => opt.id !== unionNode1)
                  .map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
              </select>
            </div>
            <button
              className="uf-btn uf-btn-success"
              onClick={handleUnion}
              disabled={!unionNode1 || !unionNode2 || isAnimating || isReplaying}
            >
              🔗 合并 (Union)
            </button>
          </div>

          <div className="uf-section">
            <h3 className="uf-section-title">查找根节点 (Find)</h3>
            <div className="uf-form-group">
              <label className="uf-label">节点</label>
              <select
                className="uf-select"
                value={findNode}
                onChange={(e) => setFindNode(e.target.value)}
                disabled={nodeOptions.length < 1 || isAnimating || isReplaying}
              >
                <option value="">请选择节点</option>
                {nodeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div className="uf-toggle">
              <span className="uf-toggle-label">路径压缩</span>
              <div
                className={`uf-switch ${enablePathCompression ? 'active' : ''}`}
                onClick={() => !isAnimating && setEnablePathCompression((v) => !v)}
              />
            </div>
            <button
              className="uf-btn uf-btn-warning"
              onClick={handleFind}
              disabled={!findNode || isAnimating || isReplaying}
            >
              🔍 查找根节点
            </button>
          </div>

          <div className="uf-section">
            <h3 className="uf-section-title">视图控制</h3>
            <div className="uf-btn-group">
              <button
                className="uf-btn uf-btn-secondary"
                onClick={() => {
                  const laidOut = calculateForestLayout(ufState)
                  setUfState(laidOut)
                }}
                disabled={isAnimating || nodeCount === 0}
              >
                自动布局
              </button>
              <button
                className="uf-btn uf-btn-secondary"
                onClick={() => {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                }}
              >
                重置视图
              </button>
            </div>
          </div>
        </div>

        <UnionFindCanvas
          state={ufState}
          highlighting={highlighting}
          findPath={findPath}
          pathCompressEdges={pathCompressEdges}
          animatingEdge={animatingEdge}
          zoom={zoom}
          pan={pan}
          onZoomChange={setZoom}
          onPanChange={setPan}
          onNodeDrag={handleNodeDrag}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragEnd={handleNodeDragEnd}
        />
      </div>

      <div className="uf-log-panel">
        <div className="uf-log-header">
          <div className="uf-log-title">操作日志 ({logs.length})</div>
          <div className="uf-log-actions">
            <button
              className="uf-btn uf-btn-secondary"
              onClick={handleExportLogs}
              disabled={logs.length === 0}
            >
              📥 导出 JSON
            </button>
            <button
              className="uf-btn uf-btn-secondary"
              onClick={handleClearAll}
              disabled={isAnimating}
            >
              🗑 清空全部
            </button>
          </div>
        </div>
        <div className="uf-log-table-wrapper">
          {logs.length === 0 ? (
            <div className="uf-empty">
              <div className="uf-empty-icon">📋</div>
              <div className="uf-empty-text">暂无日志记录</div>
            </div>
          ) : (
            <table className="uf-log-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>序号</th>
                  <th style={{ width: 100 }}>操作类型</th>
                  <th>参数</th>
                  <th>结果</th>
                  <th style={{ width: 100 }}>耗时</th>
                  <th style={{ width: 100 }}>时间</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const typeCls = log.type === OPERATION_TYPE.ADD_NODE ? 'add'
                    : log.type === OPERATION_TYPE.UNION ? 'union' : 'find'
                  let paramsStr = ''
                  if (log.type === OPERATION_TYPE.ADD_NODE) {
                    paramsStr = `name: ${log.params.name}`
                  } else if (log.type === OPERATION_TYPE.UNION) {
                    paramsStr = `(${log.params.node1}, ${log.params.node2})`
                  } else if (log.type === OPERATION_TYPE.FIND) {
                    paramsStr = `${log.params.node}${log.params.pathCompression ? ' (压缩)' : ''}`
                  }
                  return (
                    <tr
                      key={log.id}
                      className={idx === currentStep ? 'active-row' : ''}
                      onClick={() => !isAnimating && goToStep(idx)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{idx + 1}</td>
                      <td>
                        <span className={`uf-op-badge ${typeCls}`}>
                          {OPERATION_TYPE_LABEL[log.type]}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{paramsStr}</td>
                      <td>{log.result}</td>
                      <td className="uf-duration">{log.duration} ms</td>
                      <td className="uf-time">{formatTimestamp(log.timestamp)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
