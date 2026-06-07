import { useRef, useState, useCallback, useEffect } from 'react'
import {
  NODE_TYPES,
  NODE_TYPE_ICONS,
  NODE_WIDTH,
  NODE_HEIGHT,
  createNode,
  createEdge,
  getOutputAnchor,
  getInputAnchor,
  buildBezierPath,
  getNodeById,
  deleteEdge,
} from './workflowCore'

function WorkflowCanvas({
  nodes,
  edges,
  selectedNodeId,
  activeNodeIds,
  activeEdgeIds,
  onNodesChange,
  onEdgesChange,
  onSelectNode,
  isSimulating,
}) {
  const canvasWrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

  const [draggingNodeId, setDraggingNodeId] = useState(null)
  const dragNodeStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 })

  const [connecting, setConnecting] = useState(null)

  const [hoverEdgeId, setHoverEdgeId] = useState(null)

  const screenToCanvas = useCallback((screenX, screenY) => {
    if (!canvasWrapRef.current) return { x: 0, y: 0 }
    const rect = canvasWrapRef.current.getBoundingClientRect()
    return {
      x: (screenX - rect.left - offset.x) / scale,
      y: (screenY - rect.top - offset.y) / scale,
    }
  }, [offset, scale])

  const handleCanvasWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.min(Math.max(prev * delta, 0.25), 3))
  }, [])

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.target !== canvasRef.current) return
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    }
  }, [offset])

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setOffset({
        x: panStartRef.current.offsetX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.offsetY + (e.clientY - panStartRef.current.y),
      })
      return
    }

    if (draggingNodeId) {
      const dx = (e.clientX - dragNodeStartRef.current.x) / scale
      const dy = (e.clientY - dragNodeStartRef.current.y) / scale
      onNodesChange((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, x: dragNodeStartRef.current.nodeX + dx, y: dragNodeStartRef.current.nodeY + dy }
            : n
        )
      )
      return
    }

    if (connecting) {
      const pos = screenToCanvas(e.clientX, e.clientY)
      setConnecting((prev) => (prev ? { ...prev, mouseX: pos.x, mouseY: pos.y } : prev))
    }
  }, [isPanning, draggingNodeId, connecting, scale, onNodesChange, screenToCanvas])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setDraggingNodeId(null)
    setConnecting(null)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/workflow-node-type')
    if (!type) return
    const pos = screenToCanvas(e.clientX, e.clientY)
    const newNode = createNode(type, pos.x - NODE_WIDTH / 2, pos.y - NODE_HEIGHT / 2)
    onNodesChange((prev) => [...prev, newNode])
    onSelectNode(newNode.id)
  }, [screenToCanvas, onNodesChange, onSelectNode])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleNodeMouseDown = useCallback((e, node) => {
    if (isSimulating) return
    e.stopPropagation()
    onSelectNode(node.id)
    setDraggingNodeId(node.id)
    dragNodeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    }
  }, [onSelectNode, isSimulating])

  const handleOutputAnchorMouseDown = useCallback((e, node) => {
    if (isSimulating) return
    e.stopPropagation()
    e.preventDefault()
    const anchor = getOutputAnchor(node)
    setConnecting({
      sourceId: node.id,
      startX: anchor.x,
      startY: anchor.y,
      mouseX: anchor.x,
      mouseY: anchor.y,
    })
  }, [isSimulating])

  const handleInputAnchorMouseUp = useCallback((e, node) => {
    if (!connecting) return
    e.stopPropagation()
    const sourceId = connecting.sourceId
    if (!sourceId || sourceId === node.id) {
      setConnecting(null)
      return
    }
    const alreadyExists = edges.some((ed) => ed.source === sourceId && ed.target === node.id)
    if (!alreadyExists) {
      const newEdge = createEdge(sourceId, node.id)
      onEdgesChange((prev) => [...prev, newEdge])
    }
    setConnecting(null)
  }, [connecting, edges, onEdgesChange])

  const handleEdgeClick = useCallback((e, edgeId) => {
    if (isSimulating) return
    e.stopPropagation()
    onEdgesChange((prev) => deleteEdge(prev, edgeId))
  }, [isSimulating, onEdgesChange])

  const handleDeleteNode = useCallback((e, nodeId) => {
    e.stopPropagation()
    onNodesChange((prev) => prev.filter((n) => n.id !== nodeId))
    onEdgesChange((prev) => prev.filter((ed) => ed.source !== nodeId && ed.target !== nodeId))
    if (selectedNodeId === nodeId) {
      onSelectNode(null)
    }
  }, [selectedNodeId, onNodesChange, onEdgesChange, onSelectNode])

  const handleCanvasClick = useCallback(() => {
    onSelectNode(null)
  }, [onSelectNode])

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.2, 3))
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.2, 0.25))
  const handleZoomReset = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const getEdgePath = (edge) => {
    const source = getNodeById(nodes, edge.source)
    const target = getNodeById(nodes, edge.target)
    if (!source || !target) return ''
    const from = getOutputAnchor(source)
    const to = getInputAnchor(target)
    return buildBezierPath(from, to)
  }

  const renderArrowMarkers = () => (
    <defs>
      <marker
        id="wf-arrow-default"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="wf-edge-arrow" />
      </marker>
      <marker
        id="wf-arrow-active"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="wf-edge-arrow-active" />
      </marker>
    </defs>
  )

  return (
    <div
      className="wf-canvas-wrap"
      ref={canvasWrapRef}
      onWheel={handleCanvasWheel}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="wf-canvas-toolbar">
        <button type="button" className="wf-zoom-btn" onClick={handleZoomOut} title="缩小">−</button>
        <span className="wf-zoom-info">{Math.round(scale * 100)}%</span>
        <button type="button" className="wf-zoom-btn" onClick={handleZoomIn} title="放大">+</button>
        <button type="button" className="wf-zoom-btn" onClick={handleZoomReset} title="重置">⟲</button>
      </div>

      <svg className="wf-canvas-svg wf-canvas-svg-interactive">
        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          {renderArrowMarkers()}
          {edges.map((edge) => {
            const d = getEdgePath(edge)
            if (!d) return null
            const isActive = activeEdgeIds.includes(edge.id)
            const isHover = hoverEdgeId === edge.id
            return (
              <g key={edge.id}>
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="14"
                  style={{ cursor: isSimulating ? 'default' : 'pointer', pointerEvents: 'stroke' }}
                  onClick={(e) => handleEdgeClick(e, edge.id)}
                  onMouseEnter={() => setHoverEdgeId(edge.id)}
                  onMouseLeave={() => setHoverEdgeId(null)}
                />
                <path
                  d={d}
                  className={`wf-edge ${isActive ? 'wf-edge-active' : ''}`}
                  style={{ pointerEvents: 'none', strokeDasharray: isHover && !isSimulating ? '5,3' : 'none' }}
                  markerEnd={isActive ? 'url(#wf-arrow-active)' : 'url(#wf-arrow-default)'}
                />
              </g>
            )
          })}

          {connecting && connecting.sourceId && (() => {
            const from = { x: connecting.startX, y: connecting.startY }
            const to = { x: connecting.mouseX, y: connecting.mouseY }
            const d = buildBezierPath(from, to)
            return <path d={d} className="wf-temp-edge" />
          })()}
        </g>
      </svg>

      <div
        ref={canvasRef}
        className="wf-canvas"
        onMouseDown={handleCanvasMouseDown}
        onClick={handleCanvasClick}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId
            const isActive = activeNodeIds.includes(node.id)
            const typeClass = `wf-node-${node.type}`
            return (
              <div
                key={node.id}
                className={`wf-canvas-node ${typeClass} ${isSelected ? 'wf-canvas-node-selected' : ''} ${isActive ? 'wf-canvas-node-active' : ''}`}
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                  pointerEvents: 'auto',
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
              >
                <span>{NODE_TYPE_ICONS[node.type]}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {node.label}
                </span>

                {node.type !== NODE_TYPES.START && (
                  <div
                    className="wf-node-anchor wf-node-anchor-input"
                    onMouseUp={(e) => handleInputAnchorMouseUp(e, node)}
                  />
                )}

                {node.type !== NODE_TYPES.END && (
                  <div
                    className="wf-node-anchor wf-node-anchor-output"
                    onMouseDown={(e) => handleOutputAnchorMouseDown(e, node)}
                  />
                )}

                {node.type !== NODE_TYPES.START && node.type !== NODE_TYPES.END && !isSimulating && (
                  <button
                    type="button"
                    className="wf-node-delete"
                    onClick={(e) => handleDeleteNode(e, node.id)}
                    title="删除节点"
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {nodes.length === 0 && (
        <div className="wf-empty-canvas">
          从左侧拖拽节点到这里<br />开始搭建你的流程
        </div>
      )}
    </div>
  )
}

export default WorkflowCanvas
