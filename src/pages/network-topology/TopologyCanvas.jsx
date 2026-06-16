import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import {
  DEVICE_TYPE_COLORS,
  DEVICE_TYPE_SHAPES,
  DEVICE_TYPE_ICONS,
  NODE_WIDTH,
  NODE_HEIGHT,
  PORT_RADIUS,
  LINE_STYLES,
} from './constants.js'
import {
  createDeviceNode,
  getNodePorts,
  getPortPosition,
  getLinkPath,
  getLinkMidpoint,
  buildBezierPath,
  clampZoom,
  screenToWorld,
  validateLinkCreation,
} from './networkTopologyCore.js'

const PORT_NAMES = ['top', 'right', 'bottom', 'left']

function NodeShape({ node, isSelected }) {
  const colors = DEVICE_TYPE_COLORS[node.type]
  const shape = DEVICE_TYPE_SHAPES[node.type]
  const half = NODE_WIDTH / 2
  const hHalf = NODE_HEIGHT / 2
  const cx = node.x + half
  const cy = node.y + hHalf

  const strokeColor = isSelected ? '#FBBF24' : colors.stroke
  const strokeWidth = isSelected ? 3 : 2

  switch (shape) {
    case 'rect':
      return (
        <rect
          x={node.x + 4}
          y={node.y + NODE_HEIGHT * 0.2}
          width={NODE_WIDTH - 8}
          height={NODE_HEIGHT * 0.6}
          rx={6}
          fill={colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )
    case 'circle': {
      const r = Math.min(half, hHalf) - 4
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )
    }
    case 'square':
      return (
        <rect
          x={node.x + 8}
          y={node.y + 8}
          width={NODE_WIDTH - 16}
          height={NODE_HEIGHT - 16}
          rx={6}
          fill={colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )
    case 'hexagon': {
      const rx = half - 6
      const ry = hHalf - 4
      const points = []
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const px = cx + rx * Math.cos(angle)
        const py = cy + ry * Math.sin(angle)
        points.push(`${px},${py}`)
      }
      return (
        <polygon
          points={points.join(' ')}
          fill={colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )
    }
    case 'diamond': {
      const rx = half - 4
      const ry = hHalf - 4
      const pts = `${cx},${cy - ry} ${cx + rx},${cy} ${cx},${cy + ry} ${cx - rx},${cy}`
      return (
        <polygon
          points={pts}
          fill={colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )
    }
    case 'cloud':
      return (
        <g>
          <ellipse
            cx={cx}
            cy={cy + 6}
            rx={half - 10}
            ry={hHalf - 18}
            fill={colors.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx - 16}
            cy={cy}
            r={hHalf - 12}
            fill={colors.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx + 10}
            cy={cy - 6}
            r={hHalf - 8}
            fill={colors.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </g>
      )
    default:
      return (
        <rect
          x={node.x}
          y={node.y}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={6}
          fill={colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )
  }
}

export default function TopologyCanvas({
  nodes,
  links,
  selectedNodeId,
  selectedLinkId,
  pan,
  zoom,
  onNodesChange,
  onLinksChange,
  onSelectNode,
  onSelectLink,
  onPanChange,
  onZoomChange,
  svgRef: externalSvgRef,
}) {
  const containerRef = useRef(null)
  const innerSvgRef = useRef(null)
  const svgRef = externalSvgRef || innerSvgRef

  const [draggingNode, setDraggingNode] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 })
  const [linkDraft, setLinkDraft] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const getSvgPoint = useCallback(
    (clientX, clientY) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return screenToWorld(clientX - rect.left, clientY - rect.top, pan.x, pan.y, zoom)
    },
    [pan, zoom]
  )

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault()
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const delta = -e.deltaY * 0.001
      const newZoom = clampZoom(zoom + delta)

      const worldX = (mouseX - pan.x) / zoom
      const worldY = (mouseY - pan.y) / zoom

      const newPanX = mouseX - worldX * newZoom
      const newPanY = mouseY - worldY * newZoom

      onZoomChange(newZoom)
      onPanChange({ x: newPanX, y: newPanY })
    },
    [zoom, pan, onZoomChange, onPanChange]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/network-device')
      if (!type) return

      const rect = containerRef.current.getBoundingClientRect()
      const worldX = (e.clientX - rect.left - pan.x) / zoom - NODE_WIDTH / 2
      const worldY = (e.clientY - rect.top - pan.y) / zoom - NODE_HEIGHT / 2

      const newNode = createDeviceNode(type, worldX, worldY)
      if (newNode) {
        onNodesChange([...nodes, newNode])
      }
    },
    [nodes, pan, zoom, onNodesChange]
  )

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleBackgroundMouseDown = useCallback(
    (e) => {
      if (e.target !== e.currentTarget && !e.target.classList.contains('nt-bg-grid')) return
      onSelectNode(null)
      onSelectLink(null)
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y })
    },
    [pan, onSelectNode, onSelectLink]
  )

  const handleNodeMouseDown = useCallback(
    (e, node) => {
      e.stopPropagation()
      onSelectNode(node.id)
      onSelectLink(null)
      const pt = getSvgPoint(e.clientX, e.clientY)
      setDraggingNode(node.id)
      setDragOffset({ x: pt.x - node.x, y: pt.y - node.y })
    },
    [getSvgPoint, onSelectNode, onSelectLink]
  )

  const handlePortMouseDown = useCallback(
    (e, node, portName) => {
      e.stopPropagation()
      onSelectNode(node.id)
      const port = getPortPosition(node, portName)
      setLinkDraft({
        fromNodeId: node.id,
        fromPort: portName,
        fromX: port.x,
        fromY: port.y,
      })
      const pt = getSvgPoint(e.clientX, e.clientY)
      setMousePos(pt)
    },
    [getSvgPoint, onSelectNode]
  )

  const handlePortMouseUp = useCallback(
    (e, node, portName) => {
      e.stopPropagation()
      if (!linkDraft) return
      if (linkDraft.fromNodeId === node.id) {
        setLinkDraft(null)
        return
      }

      const validation = validateLinkCreation(
        nodes,
        links,
        linkDraft.fromNodeId,
        linkDraft.fromPort,
        node.id,
        portName
      )

      if (validation.valid) {
        const newLink = {
          id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          fromNodeId: linkDraft.fromNodeId,
          fromPort: linkDraft.fromPort,
          toNodeId: node.id,
          toPort: portName,
          style: LINE_STYLES.SOLID,
          width: 2,
          label: '',
        }
        onLinksChange([...links, newLink])
      }
      setLinkDraft(null)
    },
    [linkDraft, nodes, links, onLinksChange]
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (draggingNode) {
        const pt = getSvgPoint(e.clientX, e.clientY)
        const newNodes = nodes.map((n) =>
          n.id === draggingNode
            ? { ...n, x: pt.x - dragOffset.x, y: pt.y - dragOffset.y }
            : n
        )
        onNodesChange(newNodes)
      } else if (isPanning) {
        const dx = e.clientX - panStart.x
        const dy = e.clientY - panStart.y
        onPanChange({ x: panStart.panX + dx, y: panStart.panY + dy })
      } else if (linkDraft) {
        const pt = getSvgPoint(e.clientX, e.clientY)
        setMousePos(pt)
      }
    },
    [draggingNode, dragOffset, isPanning, panStart, linkDraft, nodes, getSvgPoint, onNodesChange, onPanChange]
  )

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null)
    setIsPanning(false)
    if (linkDraft) {
      setLinkDraft(null)
    }
  }, [linkDraft])

  const handleLinkClick = useCallback(
    (e, linkId) => {
      e.stopPropagation()
      onSelectLink(linkId)
      onSelectNode(null)
    },
    [onSelectLink, onSelectNode]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const linkDraftPath = useMemo(() => {
    if (!linkDraft) return ''
    return buildBezierPath({ x: linkDraft.fromX, y: linkDraft.fromY }, mousePos)
  }, [linkDraft, mousePos])

  return (
    <div
      ref={containerRef}
      className="nt-canvas-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <svg
        ref={svgRef}
        className="nt-canvas-svg"
        width="100%"
        height="100%"
        onMouseDown={handleBackgroundMouseDown}
      >
        <defs>
          <pattern
            id="nt-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
          >
            <circle cx="1" cy="1" r="1" fill="#CBD5E1" />
          </pattern>
        </defs>

        <rect
          className="nt-bg-grid"
          width="100%"
          height="100%"
          fill="url(#nt-grid)"
        />

        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          <g className="nt-links-layer">
            {links.map((link) => {
              const path = getLinkPath(link, nodes)
              const mid = getLinkMidpoint(link, nodes)
              const isSelected = selectedLinkId === link.id
              const dashArray = link.style === LINE_STYLES.DASHED ? '8,4' : undefined

              return (
                <g key={link.id} className="nt-link-group">
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(link.width * 3, 12)}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleLinkClick(e, link.id)}
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke={isSelected ? '#F59E0B' : '#64748B'}
                    strokeWidth={link.width}
                    strokeDasharray={dashArray}
                    strokeLinecap="round"
                    pointerEvents="none"
                  />
                  {link.label && (
                    <g transform={`translate(${mid.x} ${mid.y})`} pointerEvents="none">
                      <rect
                        x={-link.label.length * 4 - 8}
                        y={-10}
                        width={link.label.length * 8 + 16}
                        height={20}
                        rx={4}
                        fill="white"
                        stroke={isSelected ? '#F59E0B' : '#94A3B8'}
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fontSize={12}
                        fill="#334155"
                        fontWeight={500}
                      >
                        {link.label}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}

            {linkDraft && (
              <path
                d={linkDraftPath}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="6,3"
                strokeLinecap="round"
              />
            )}
          </g>

          <g className="nt-nodes-layer">
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id
              const ports = getNodePorts(node)

              return (
                <g
                  key={node.id}
                  className={`nt-node-group ${isSelected ? 'selected' : ''}`}
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                >
                  <NodeShape node={node} isSelected={isSelected} />
                  <text
                    x={node.x + NODE_WIDTH / 2}
                    y={node.y + NODE_HEIGHT + 16}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#1E293B"
                    fontWeight={600}
                    pointerEvents="none"
                  >
                    {node.name}
                  </text>
                  <text
                    x={node.x + NODE_WIDTH / 2}
                    y={node.y + NODE_HEIGHT / 2 + 5}
                    textAnchor="middle"
                    fontSize={20}
                    pointerEvents="none"
                  >
                    {DEVICE_TYPE_ICONS[node.type]}
                  </text>

                  {isSelected &&
                    PORT_NAMES.map((portName) => {
                      const pos = ports[portName]
                      return (
                        <circle
                          key={portName}
                          cx={pos.x}
                          cy={pos.y}
                          r={PORT_RADIUS + 2}
                          fill="white"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          style={{ cursor: 'crosshair' }}
                          onMouseDown={(e) => handlePortMouseDown(e, node, portName)}
                          onMouseUp={(e) => handlePortMouseUp(e, node, portName)}
                        />
                      )
                    })}
                </g>
              )
            })}
          </g>
        </g>
      </svg>
    </div>
  )
}
