import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  NODE_WIDTH,
  NODE_HEIGHT,
} from './constants.js'
import {
  calculateLayoutBalanced,
  getConnectionPath,
  getVisibleChildren,
  getIconEmoji,
  screenToWorld,
  findNodeById,
  isDescendant,
  clampZoom,
} from './mindMapCore.js'

function MindMapCanvas({
  tree,
  selectedId,
  onSelectNode,
  onAddChild,
  onToggleCollapse,
  onEditNode,
  onMoveNode,
  onNodeContextMenu,
  pan,
  zoom,
  onPanChange,
  onZoomChange,
  editingId,
  onEditingChange,
  onEditText,
}) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const [draggingNodeId, setDraggingNodeId] = useState(null)
  const [dragOverNodeId, setDragOverNodeId] = useState(null)
  const [dropPosition, setDropPosition] = useState(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const dragPosRef = useRef({ x: 0, y: 0 })
  const editInputRef = useRef(null)
  const [editInputStyle, setEditInputStyle] = useState({})

  const positions = useMemo(() => {
    if (!tree) return new Map()
    return calculateLayoutBalanced(tree, 0, 0)
  }, [tree])

  const connections = useMemo(() => {
    if (!tree) return []
    const conns = []
    const traverse = (node) => {
      const visibleChildren = getVisibleChildren(node)
      for (const child of visibleChildren) {
        const fromPos = positions.get(node.id)
        const toPos = positions.get(child.id)
        if (fromPos && toPos) {
          conns.push({
            id: `${node.id}-${child.id}`,
            fromPos,
            toPos,
            color: child.color || '#6366f1',
          })
        }
        traverse(child)
      }
    }
    traverse(tree)
    return conns
  }, [tree, positions])

  const allNodes = useMemo(() => {
    if (!tree) return []
    const result = []
    const traverse = (node) => {
      result.push(node)
      const visibleChildren = getVisibleChildren(node)
      for (const child of visibleChildren) {
        traverse(child)
      }
    }
    traverse(tree)
    return result
  }, [tree])

  useEffect(() => {
    if (editingId && positions.has(editingId) && svgRef.current) {
      const pos = positions.get(editingId)
      const rect = svgRef.current.getBoundingClientRect()
      const screenX = rect.left + pos.x * zoom + pan.x
      const screenY = rect.top + pos.y * zoom + pan.y
      const width = pos.width * zoom
      const height = pos.height * zoom

      setEditInputStyle({
        left: screenX + 4,
        top: screenY + 4,
        width: width - 8,
        height: height - 8,
        fontSize: Math.max(12, 14 * zoom),
      })

      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus()
          editInputRef.current.select()
        }
      }, 0)
    }
  }, [editingId, positions, zoom, pan])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const delta = -e.deltaY * 0.001
    const newZoom = clampZoom(zoom + delta)

    const worldBefore = screenToWorld(mouseX, mouseY, pan.x, pan.y, zoom)
    const newPanX = mouseX - worldBefore.x * newZoom
    const newPanY = mouseY - worldBefore.y * newZoom

    onZoomChange(newZoom)
    onPanChange({ x: newPanX, y: newPanY })
  }, [zoom, pan, onZoomChange, onPanChange])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.mind-node-group') || e.target.closest('.mind-collapse-btn')) return
    if (e.button !== 0) return
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    onSelectNode(null)
  }, [pan, onSelectNode])

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      onPanChange({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      })
    }

    if (draggingNodeId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      dragPosRef.current = screenToWorld(screenX, screenY, pan.x, pan.y, zoom)

      const worldPos = dragPosRef.current
      let foundNode = null
      for (const node of allNodes) {
        if (node.id === draggingNodeId) continue
        const pos = positions.get(node.id)
        if (!pos) continue
        if (
          worldPos.x >= pos.x &&
          worldPos.x <= pos.x + pos.width &&
          worldPos.y >= pos.y &&
          worldPos.y <= pos.y + pos.height
        ) {
          foundNode = node
          break
        }
      }

      if (foundNode && !isDescendant(tree, draggingNodeId, foundNode.id)) {
        setDragOverNodeId(foundNode.id)
        const pos = positions.get(foundNode.id)
        if (worldPos.y < pos.y + pos.height / 3) {
          setDropPosition('before')
        } else if (worldPos.y > pos.y + (pos.height * 2) / 3) {
          setDropPosition('after')
        } else {
          setDropPosition('child')
        }
      } else {
        setDragOverNodeId(null)
        setDropPosition(null)
      }
    }
  }, [isPanning, draggingNodeId, pan, zoom, onPanChange, tree, allNodes, positions])

  const handleMouseUp = useCallback((e) => {
    if (isPanning) {
      setIsPanning(false)
    }

    if (draggingNodeId && dragOverNodeId && dropPosition) {
      onMoveNode(draggingNodeId, dragOverNodeId, dropPosition)
    }

    setDraggingNodeId(null)
    setDragOverNodeId(null)
    setDropPosition(null)
  }, [isPanning, draggingNodeId, dragOverNodeId, dropPosition, onMoveNode])

  useEffect(() => {
    if (isPanning || draggingNodeId) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isPanning, draggingNodeId, handleMouseMove, handleMouseUp])

  const handleNodeMouseDown = useCallback((e, node) => {
    if (e.button !== 0) return
    e.stopPropagation()
    onSelectNode(node.id)

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const worldPos = screenToWorld(screenX, screenY, pan.x, pan.y, zoom)
      const pos = positions.get(node.id)
      if (pos) {
        dragOffsetRef.current = {
          x: worldPos.x - pos.x,
          y: worldPos.y - pos.y,
        }
      }
    }
    setDraggingNodeId(node.id)
  }, [onSelectNode, pan, zoom, positions])

  const handleNodeDoubleClick = useCallback((e, node) => {
    e.stopPropagation()
    onEditNode(node.id)
  }, [onEditNode])

  const renderNode = (node) => {
    const pos = positions.get(node.id)
    if (!pos) return null

    const isSelected = selectedId === node.id
    const isRoot = !tree || node.id === tree.id
    const iconEmoji = getIconEmoji(node.icon)
    const hasVisibleChildren = getVisibleChildren(node).length > 0
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    const isDragging = draggingNodeId === node.id
    const isDragOver = dragOverNodeId === node.id

    const showIcon = !!iconEmoji
    const textX = pos.x + pos.width / 2 + (showIcon ? 8 : 0)
    const iconX = pos.x + (showIcon ? 22 : pos.width / 2)

    return (
      <g key={node.id}>
        {isDragOver && dropPosition && (() => {
          const targetPos = positions.get(dragOverNodeId)
          if (!targetPos) return null
          if (dropPosition === 'child') {
            return (
              <rect
                className="mind-drop-indicator"
                x={targetPos.x - 4}
                y={targetPos.y - 4}
                width={targetPos.width + 8}
                height={targetPos.height + 8}
              />
            )
          }
          const lineY = dropPosition === 'before' ? targetPos.y : targetPos.y + targetPos.height
          return (
            <rect
              className="mind-drop-indicator"
              x={targetPos.x - 20}
              y={lineY - 4}
              width={targetPos.width + 40}
              height={8}
              rx={4}
              ry={4}
            />
          )
        })()}

        <g
          className={`mind-node-group ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
          transform={`translate(${pos.x}, ${pos.y})`}
          onMouseDown={(e) => handleNodeMouseDown(e, node)}
          onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelectNode(node.id)
            if (onNodeContextMenu) {
              onNodeContextMenu(node.id, e.clientX, e.clientY)
            }
          }}
        >
          <rect
            className="mind-node-rect"
            x={0}
            y={0}
            width={pos.width}
            height={pos.height}
            fill={node.color || '#6366f1'}
            stroke={node.color || '#6366f1'}
          />
          {showIcon && (
            <text
              className="mind-node-icon"
              x={22}
              y={pos.height / 2}
            >
              {iconEmoji}
            </text>
          )}
          <text
            className="mind-node-text"
            x={showIcon ? (pos.width / 2 + 10) : pos.width / 2}
            y={pos.height / 2}
          >
            {node.text?.length > 16 ? node.text.slice(0, 16) + '…' : node.text || ''}
          </text>
        </g>

        {hasChildren && (
          <g
            className="mind-collapse-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(node.id)
            }}
          >
            {(() => {
              const btnSize = 20
              const btnX = pos.direction === 'left'
                ? pos.x - btnSize / 2
                : pos.direction === 'right'
                  ? pos.x + pos.width - btnSize / 2
                  : pos.x + pos.width / 2 - btnSize / 2
              const btnY = pos.y + pos.height - btnSize / 2

              return (
                <>
                  <rect
                    className="mind-collapse-rect"
                    x={btnX}
                    y={btnY}
                    width={btnSize}
                    height={btnSize}
                  />
                  <text
                    className="mind-collapse-text"
                    x={btnX + btnSize / 2}
                    y={btnY + btnSize / 2}
                  >
                    {node.collapsed ? '+' : '−'}
                  </text>
                </>
              )
            })()}
          </g>
        )}
      </g>
    )
  }

  return (
    <div ref={containerRef} className="mind-canvas-wrapper">
      <svg
        ref={svgRef}
        className={`mind-svg ${isPanning ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {connections.map((conn) => (
            <path
              key={conn.id}
              className="mind-connection"
              d={getConnectionPath(conn.fromPos, conn.toPos)}
              stroke={conn.color}
              strokeOpacity={0.5}
            />
          ))}

          {allNodes.map(renderNode)}
        </g>
      </svg>

      {editingId && (
        <input
          ref={editInputRef}
          className="mind-edit-input"
          style={editInputStyle}
          defaultValue={findNodeById(tree, editingId)?.text || ''}
          onBlur={(e) => {
            onEditText(editingId, e.target.value)
            onEditingChange(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onEditText(editingId, e.target.value)
              onEditingChange(null)
            } else if (e.key === 'Escape') {
              onEditingChange(null)
            }
          }}
        />
      )}
    </div>
  )
}

export default MindMapCanvas
