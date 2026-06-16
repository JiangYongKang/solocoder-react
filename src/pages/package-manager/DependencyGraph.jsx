import { useRef, useState, useEffect, useMemo } from 'react'
import { buildGraphNodes, getRelatedNodes } from './packageUtils.js'

function layoutNodes(nodes) {
  const directNodes = nodes.filter((n) => n.isDirect)
  const indirectNodes = nodes.filter((n) => !n.isDirect)

  const layout = []
  const nodeWidth = 140
  const nodeHeight = 60
  const hGap = 60
  const vGap = 40
  const cols = 4

  directNodes.forEach((node, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    layout.push({
      ...node,
      x: 100 + col * (nodeWidth + hGap),
      y: 80 + row * (nodeHeight + vGap + 40),
    })
  })

  const startY = directNodes.length > 0
    ? 80 + (Math.ceil(directNodes.length / cols)) * (nodeHeight + vGap + 40) + 40
    : 80

  indirectNodes.forEach((node, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    layout.push({
      ...node,
      x: 100 + col * (nodeWidth + hGap),
      y: startY + row * (nodeHeight + vGap),
    })
  })

  return layout
}

export default function DependencyGraph({ dependencies, selectedPackage, onSelectPackage }) {
  const svgRef = useRef(null)
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 })

  const { nodes, edges } = useMemo(() => {
    return buildGraphNodes(dependencies)
  }, [dependencies])

  const laidOutNodes = useMemo(() => layoutNodes(nodes), [nodes])

  const relatedNodes = useMemo(() => {
    if (!selectedPackage) return new Set()
    return getRelatedNodes(selectedPackage, edges)
  }, [selectedPackage, edges])

  const canvasWidth = useMemo(() => {
    if (laidOutNodes.length === 0) return 800
    return Math.max(...laidOutNodes.map((n) => n.x + 200))
  }, [laidOutNodes])

  const canvasHeight = useMemo(() => {
    if (laidOutNodes.length === 0) return 500
    return Math.max(...laidOutNodes.map((n) => n.y + 120))
  }, [laidOutNodes])

  const handleZoom = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setViewport((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.3), 3),
    }))
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('.pm-graph-node')) return
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      vx: viewport.x,
      vy: viewport.y,
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setViewport((prev) => ({
      ...prev,
      x: dragStart.current.vx + (e.clientX - dragStart.current.x),
      y: dragStart.current.vy + (e.clientY - dragStart.current.y),
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div className="pm-graph-container">
      <div className="pm-graph-toolbar">
        <span className="pm-graph-hint">拖拽平移 · 滚轮缩放</span>
        <span className="pm-graph-zoom">缩放: {(viewport.scale * 100).toFixed(0)}%</span>
        <button
          type="button"
          className="pm-btn pm-btn-xs"
          onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
        >
          重置视图
        </button>
      </div>
      <div className="pm-graph-canvas-wrapper" ref={svgRef}>
        <svg
          width={canvasWidth}
          height={canvasHeight}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: '0 0',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onWheel={handleZoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
            <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
          </defs>

          {edges.map((edge, idx) => {
            const source = laidOutNodes.find((n) => n.id === edge.source)
            const target = laidOutNodes.find((n) => n.id === edge.target)
            if (!source || !target) return null

            const x1 = source.x + 70
            const y1 = source.y + 30
            const x2 = target.x + 70
            const y2 = target.y + 30

            const dx = x2 - x1
            const dy = y2 - y1
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            const offsetX = (dx / len) * 80
            const offsetY = (dy / len) * 40

            const isHighlighted = selectedPackage &&
              (edge.source === selectedPackage || edge.target === selectedPackage)

            return (
              <line
                key={idx}
                x1={x1 + offsetX * 0.4}
                y1={y1 + offsetY * 0.4}
                x2={x2 - offsetX * 0.6}
                y2={y2 - offsetY * 0.6}
                stroke={isHighlighted ? '#3b82f6' : '#cbd5e1'}
                strokeWidth={isHighlighted ? 2 : 1}
                markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
              />
            )
          })}

          {laidOutNodes.map((node) => {
            const isSelected = selectedPackage === node.id
            const isRelated = relatedNodes.has(node.id)
            const dimmed = selectedPackage && !isSelected && !isRelated

            return (
              <g
                key={node.id}
                className={`pm-graph-node ${isSelected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`}
                onClick={() => onSelectPackage(isSelected ? null : node.id)}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width="140"
                  height="60"
                  rx="8"
                  ry="8"
                  fill={isSelected ? '#eff6ff' : node.isDirect ? '#fef3c7' : '#f8fafc'}
                  stroke={isSelected ? '#3b82f6' : node.isDirect ? '#f59e0b' : '#94a3b8'}
                  strokeWidth={node.isDirect ? 2.5 : 1.5}
                />
                <text
                  x={node.x + 70}
                  y={node.y + 26}
                  textAnchor="middle"
                  fontSize={node.isDirect ? '13' : '11'}
                  fontWeight={node.isDirect ? 'bold' : 'normal'}
                  fill={dimmed ? '#cbd5e1' : '#1e293b'}
                >
                  {node.name.length > 16 ? node.name.slice(0, 16) + '...' : node.name}
                </text>
                <text
                  x={node.x + 70}
                  y={node.y + 46}
                  textAnchor="middle"
                  fontSize="10"
                  fill={dimmed ? '#cbd5e1' : '#64748b'}
                >
                  v{node.version}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
