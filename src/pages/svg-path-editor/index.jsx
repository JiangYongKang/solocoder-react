import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  parsePathCommands,
  serializePathCommands,
  toAbsoluteCommands,
  getControlPoints,
  updateCommandParam,
  insertNodeOnSegment,
  convertSegmentToLine,
  buildSvgString,
  screenToWorld,
  clampZoom,
  distance,
  findNearestPointOnCubic,
  findNearestPointOnQuadratic,
  findNearestPointOnLine,
  loadFromStorage,
  saveToStorage,
  getPathBounds,
  isValidHexColor,
} from './svgPathEditorCore.js'
import {
  ANCHOR_RADIUS,
  HANDLE_RADIUS,
  GRID_SIZE,
  PRESET_COLORS,
  LINECAP_OPTIONS,
  LINEJOIN_OPTIONS,
  FILL_TYPES,
  DASH_PRESETS,
  createDefaultPath,
  createDefaultPathStyle,
} from './constants.js'
import './svg-path-editor.css'

function SvgPathEditorPage() {
  const navigate = useNavigate()
  const svgRef = useRef(null)

  const [paths, setPaths] = useState(() => {
    const saved = loadFromStorage()
    if (saved && saved.paths && saved.paths.length > 0) return saved.paths
    return [createDefaultPath('路径 1')]
  })
  const [selectedPathIndex, setSelectedPathIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(null)
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(-1)
  const [mode, setMode] = useState('select')
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportAll, setExportAll] = useState(true)
  const [copied, setCopied] = useState(false)
  const [renamingIndex, setRenamingIndex] = useState(-1)
  const [renameValue, setRenameValue] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [svgSize, setSvgSize] = useState({ width: 800, height: 600 })
  const [dragPathIndex, setDragPathIndex] = useState(-1)

  const currentPath = paths[selectedPathIndex] || paths[0]
  const currentStyle = currentPath?.style || createDefaultPathStyle()

  const absCmds = useMemo(() => {
    if (!currentPath) return []
    return toAbsoluteCommands(parsePathCommands(currentPath.d))
  }, [currentPath])

  const controlPoints = useMemo(() => {
    return getControlPoints(absCmds)
  }, [absCmds])

  useEffect(() => {
    saveToStorage({ paths })
  }, [paths])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSvgSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  const updateCurrentPath = useCallback((updates) => {
    setPaths((prev) =>
      prev.map((p, i) => (i === selectedPathIndex ? { ...p, ...updates } : p))
    )
  }, [selectedPathIndex])

  const updateStyle = useCallback((key, value) => {
    setPaths((prev) =>
      prev.map((p, i) =>
        i === selectedPathIndex
          ? { ...p, style: { ...p.style, [key]: value } }
          : p
      )
    )
  }, [selectedPathIndex])

  const handleDeleteNode = useCallback(() => {
    if (selectedNodeIndex < 0 || !controlPoints[selectedNodeIndex]) return
    const pt = controlPoints[selectedNodeIndex]
    if (pt.type !== 'anchor') return

    let nodeCount = 0
    let targetNodeIdx = -1
    for (let i = 0; i < controlPoints.length; i++) {
      if (controlPoints[i].type === 'anchor') {
        if (i === selectedNodeIndex) {
          targetNodeIdx = nodeCount
          break
        }
        nodeCount++
      }
    }

    if (targetNodeIdx <= 0) return
    const absCmdsCopy = [...absCmds]
    const newCmds = []

    let anchorIdx = 0
    for (let i = 0; i < absCmdsCopy.length; i++) {
      const cmd = absCmdsCopy[i]
      if (cmd.type === 'M') {
        anchorIdx++
        if (anchorIdx - 1 === targetNodeIdx) continue
        if (anchorIdx - 1 === targetNodeIdx - 1 && i + 1 < absCmdsCopy.length) {
          const nextCmd = absCmdsCopy[i + 1]
          const endPoint = nextCmd.type === 'C'
            ? { x: nextCmd.params[4], y: nextCmd.params[5] }
            : nextCmd.type === 'Q'
            ? { x: nextCmd.params[2], y: nextCmd.params[3] }
            : nextCmd.type === 'A'
            ? { x: nextCmd.params[5], y: nextCmd.params[6] }
            : nextCmd.type === 'L'
            ? { x: nextCmd.params[0], y: nextCmd.params[1] }
            : null
          if (endPoint) {
            newCmds.push({ type: 'L', relative: false, params: [endPoint.x, endPoint.y] })
          }
          i++
          anchorIdx++
          continue
        }
        newCmds.push(cmd)
      } else if (cmd.type === 'Z') {
        newCmds.push(cmd)
      } else {
        anchorIdx++
        if (anchorIdx - 1 === targetNodeIdx) continue
        newCmds.push(cmd)
      }
    }

    const newD = serializePathCommands(newCmds)
    updateCurrentPath({ d: newD })
    setSelectedNodeIndex(-1)
  }, [selectedNodeIndex, controlPoints, absCmds, updateCurrentPath])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIndex >= 1 && mode === 'select') {
          handleDeleteNode()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeIndex, mode, handleDeleteNode])

  const getMousePos = useCallback((e) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    return screenToWorld(sx, sy, pan.x, pan.y, zoom)
  }, [pan, zoom])

  const handleMouseDown = useCallback((e) => {
    if (e.button === 1) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      return
    }

    const world = getMousePos(e)

    if (mode === 'add') {
      let bestSeg = -1
      let bestDist = Infinity
      let bestT = 0

      for (let i = 1; i < absCmds.length; i++) {
        const cmd = absCmds[i]
        if (cmd.type === 'Z' || cmd.type === 'M') continue

        let result = null
        const prev = getSegmentStart(absCmds, i)

        if (cmd.type === 'C') {
          result = findNearestPointOnCubic(
            prev, { x: cmd.params[0], y: cmd.params[1] },
            { x: cmd.params[2], y: cmd.params[3] },
            { x: cmd.params[4], y: cmd.params[5] },
            world.x, world.y
          )
        } else if (cmd.type === 'Q') {
          result = findNearestPointOnQuadratic(
            prev, { x: cmd.params[0], y: cmd.params[1] },
            { x: cmd.params[2], y: cmd.params[3] },
            world.x, world.y
          )
        } else if (cmd.type === 'L') {
          result = findNearestPointOnLine(prev.x, prev.y, cmd.params[0], cmd.params[1], world.x, world.y)
        }

        if (result && result.dist < bestDist) {
          bestDist = result.dist
          bestSeg = i
          bestT = result.t
        }
      }

      if (bestSeg >= 0 && bestDist < 20 / zoom) {
        const newCmds = insertNodeOnSegment(absCmds, bestSeg, bestT)
        const newD = serializePathCommands(newCmds)
        updateCurrentPath({ d: newD })
      }
      return
    }

    for (let i = controlPoints.length - 1; i >= 0; i--) {
      const pt = controlPoints[i]
      const d = distance(pt.x, pt.y, world.x, world.y)
      const hitR = pt.type === 'handle' ? HANDLE_RADIUS + 4 : ANCHOR_RADIUS + 4
      if (d < hitR / zoom + 5 / zoom) {
        setSelectedNodeIndex(i)
        setDragging({ pointIndex: i, type: pt.type, startX: world.x, startY: world.y })
        return
      }
    }

    setSelectedNodeIndex(-1)
  }, [mode, absCmds, controlPoints, getMousePos, zoom, pan, updateCurrentPath])

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
      return
    }

    const world = getMousePos(e)

    if (mode !== 'select') {
      setHoveredPoint(null)
      return
    }

    if (dragging) {
      const pt = controlPoints[dragging.pointIndex]
      if (!pt) return

      const dx = world.x - dragging.startX
      const dy = world.y - dragging.startY
      const newX = pt.x + dx
      const newY = pt.y + dy

      const newCmds = [...absCmds]

      if (pt.type === 'anchor') {
        const cmdIdx = pt.cmdIndex
        if (cmdIdx >= 0 && cmdIdx < newCmds.length) {
          const cmd = { ...newCmds[cmdIdx], params: [...newCmds[cmdIdx].params] }
          if (cmd.type === 'M') {
            cmd.params[0] = newX
            cmd.params[1] = newY
          } else if (cmd.type === 'L') {
            cmd.params[0] = newX
            cmd.params[1] = newY
          } else if (cmd.type === 'C') {
            const oldX = cmd.params[4]
            const oldY = cmd.params[5]
            cmd.params[2] += (newX - oldX)
            cmd.params[3] += (newY - oldY)
            cmd.params[4] = newX
            cmd.params[5] = newY
            if (pt.handleIn) {
              cmd.params[0] += (newX - oldX)
              cmd.params[1] += (newY - oldY)
            }
          } else if (cmd.type === 'Q') {
            const oldX = cmd.params[2]
            const oldY = cmd.params[3]
            cmd.params[0] += (newX - oldX)
            cmd.params[1] += (newY - oldY)
            cmd.params[2] = newX
            cmd.params[3] = newY
          } else if (cmd.type === 'A') {
            cmd.params[5] = newX
            cmd.params[6] = newY
          }
          newCmds[cmdIdx] = cmd
        }
      } else if (pt.type === 'handle') {
        const cmdIdx = pt.cmdIndex
        if (cmdIdx >= 0 && cmdIdx < newCmds.length) {
          const cmd = { ...newCmds[cmdIdx], params: [...newCmds[cmdIdx].params] }
          if (cmd.type === 'C') {
            if (pt.handleRole === 'in') {
              cmd.params[0] = newX
              cmd.params[1] = newY
            } else if (pt.handleRole === 'out') {
              cmd.params[2] = newX
              cmd.params[3] = newY
            }
          } else if (cmd.type === 'Q') {
            cmd.params[0] = newX
            cmd.params[1] = newY
          }
          newCmds[cmdIdx] = cmd
        }
      }

      const newD = serializePathCommands(newCmds)
      setPaths((prev) =>
        prev.map((p, i) => (i === selectedPathIndex ? { ...p, d: newD } : p))
      )
      setDragging((prev) => ({ ...prev, startX: world.x, startY: world.y }))
      return
    }

    let foundHover = null
    for (let i = controlPoints.length - 1; i >= 0; i--) {
      const pt = controlPoints[i]
      const d = distance(pt.x, pt.y, world.x, world.y)
      const hitR = pt.type === 'handle' ? HANDLE_RADIUS + 4 : ANCHOR_RADIUS + 4
      if (d < hitR / zoom + 5 / zoom) {
        foundHover = i
        break
      }
    }
    setHoveredPoint(foundHover)
  }, [dragging, isPanning, panStart, getMousePos, mode, controlPoints, absCmds, zoom, selectedPathIndex])

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      return
    }
    setDragging(null)
  }, [isPanning])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = clampZoom(zoom + delta)
    if (newZoom === zoom) return

    const worldX = (sx - pan.x) / zoom
    const worldY = (sy - pan.y) / zoom
    const newPanX = sx - worldX * newZoom
    const newPanY = sy - worldY * newZoom

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }, [zoom, pan])

  const handleConvertToLine = useCallback(() => {
    if (selectedNodeIndex < 0 || !controlPoints[selectedNodeIndex]) return
    const pt = controlPoints[selectedNodeIndex]
    if (pt.type !== 'anchor') return

    const cmdIdx = pt.cmdIndex
    if (cmdIdx < 0) return
    const cmd = absCmds[cmdIdx]
    if (!cmd || cmd.type === 'M' || cmd.type === 'L' || cmd.type === 'Z') return

    const newCmds = convertSegmentToLine(absCmds, cmdIdx)
    const newD = serializePathCommands(newCmds)
    updateCurrentPath({ d: newD })
  }, [selectedNodeIndex, controlPoints, absCmds, updateCurrentPath])

  const handleAddPath = useCallback(() => {
    const newPath = createDefaultPath(`路径 ${paths.length + 1}`)
    setPaths((prev) => [...prev, newPath])
    setSelectedPathIndex(paths.length)
  }, [paths.length])

  const handleCopyPath = useCallback((index) => {
    const original = paths[index]
    const copy = {
      ...original,
      id: `path_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: `${original.name} 副本`,
    }
    const newPaths = [...paths]
    newPaths.splice(index + 1, 0, copy)
    setPaths(newPaths)
    setSelectedPathIndex(index + 1)
  }, [paths])

  const handleDeletePath = useCallback((index) => {
    if (paths.length <= 1) return
    const newPaths = paths.filter((_, i) => i !== index)
    setPaths(newPaths)
    if (selectedPathIndex >= newPaths.length) {
      setSelectedPathIndex(newPaths.length - 1)
    } else if (selectedPathIndex > index) {
      setSelectedPathIndex(selectedPathIndex - 1)
    }
  }, [paths, selectedPathIndex])

  const handleToggleVisibility = useCallback((index) => {
    setPaths((prev) =>
      prev.map((p, i) => (i === index ? { ...p, visible: !p.visible } : p))
    )
  }, [])

  const handleRename = useCallback((index) => {
    setRenamingIndex(index)
    setRenameValue(paths[index].name)
  }, [paths])

  const handleRenameSubmit = useCallback(() => {
    if (renamingIndex >= 0 && renameValue.trim()) {
      setPaths((prev) =>
        prev.map((p, i) => (i === renamingIndex ? { ...p, name: renameValue.trim() } : p))
      )
    }
    setRenamingIndex(-1)
  }, [renamingIndex, renameValue])

  const handleMovePath = useCallback((fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= paths.length) return
    const newPaths = [...paths]
    const [moved] = newPaths.splice(fromIndex, 1)
    newPaths.splice(toIndex, 0, moved)
    setPaths(newPaths)
    if (selectedPathIndex === fromIndex) {
      setSelectedPathIndex(toIndex)
    }
  }, [paths, selectedPathIndex])

  const handleExport = useCallback(() => {
    setShowExportModal(true)
    setCopied(false)
  }, [])

  const handleCopyCode = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  const handleDownloadSvg = useCallback((code) => {
    const blob = new Blob([code], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'path-editor-export.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const buildFillAttr = useCallback((style) => {
    if (!style) return 'none'
    if (style.fillType === 'none') return 'none'
    if (style.fillType === 'solid') return style.fill || 'none'
    return 'none'
  }, [])

  const svgCode = useMemo(() => {
    return buildSvgString(paths, exportAll)
  }, [paths, exportAll])

  const highlightSvg = useCallback((code) => {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="spe-code-tag">$2</span>')
      .replace(/([\w-]+)(=)/g, '<span class="spe-code-attr">$1</span>$2')
      .replace(/"([^"]*)"/g, '"<span class="spe-code-string">$1</span>"')
  }, [])

  const renderPathOnCanvas = (path, index) => {
    if (!path.visible) return null
    const isSelected = index === selectedPathIndex
    const fill = buildFillAttr(path.style)

    return (
      <path
        key={path.id}
        d={path.d}
        fill={fill}
        stroke={path.style?.stroke || '#333'}
        strokeWidth={path.style?.strokeWidth || 2}
        strokeLinecap={path.style?.linecap || 'butt'}
        strokeLinejoin={path.style?.linejoin || 'miter'}
        strokeDasharray={path.style?.dasharray || 'none'}
        style={{ pointerEvents: isSelected ? 'none' : 'auto', opacity: isSelected ? 1 : 0.5 }}
        onClick={() => setSelectedPathIndex(index)}
      />
    )
  }

  const renderControlPoints = () => {
    if (selectedPathIndex < 0) return null
    const elements = []

    for (let i = 0; i < controlPoints.length; i++) {
      const pt = controlPoints[i]

      if (pt.type === 'handle') {
        let anchorPt = null
        for (let j = i - 1; j >= 0; j--) {
          if (controlPoints[j].type === 'anchor') {
            anchorPt = controlPoints[j]
            break
          }
        }
        for (let j = i + 1; j < controlPoints.length; j++) {
          if (controlPoints[j].type === 'anchor') {
            if (!anchorPt) anchorPt = controlPoints[j]
            break
          }
        }

        if (anchorPt) {
          elements.push(
            <line
              key={`hl-${i}`}
              x1={anchorPt.x}
              y1={anchorPt.y}
              x2={pt.x}
              y2={pt.y}
              stroke="#409eff"
              strokeWidth={1 / zoom}
              strokeDasharray={`${3 / zoom},${3 / zoom}`}
              style={{ pointerEvents: 'none' }}
            />
          )
        }

        elements.push(
          <circle
            key={`h-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={HANDLE_RADIUS / zoom}
            fill="#fff"
            stroke="#409eff"
            strokeWidth={1.5 / zoom}
            style={{
              cursor: 'grab',
              pointerEvents: 'all',
            }}
          />
        )
      } else if (pt.type === 'anchor') {
        const isHovered = hoveredPoint === i
        const isSelected = selectedNodeIndex === i
        elements.push(
          <circle
            key={`a-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={(isHovered || isSelected ? ANCHOR_RADIUS + 1 : ANCHOR_RADIUS) / zoom}
            fill={isSelected ? '#409eff' : '#fff'}
            stroke={isSelected ? '#2563eb' : '#409eff'}
            strokeWidth={1.5 / zoom}
            style={{
              cursor: 'grab',
              pointerEvents: 'all',
            }}
          />
        )
      }
    }

    return elements
  }

  const renderCommandPanel = () => {
    if (!absCmds || absCmds.length === 0) return null

    return (
      <div className="spe-panel-section">
        <div className="spe-panel-header">路径命令</div>
        <div className="spe-panel-body" style={{ maxHeight: 300, overflowY: 'auto', padding: '4px 8px' }}>
          {absCmds.map((cmd, i) => (
            <CommandRow
              key={i}
              cmd={cmd}
              cmdIndex={i}
              selected={selectedNodeIndex >= 0 && controlPoints[selectedNodeIndex]?.cmdIndex === i}
              onUpdate={(paramIdx, val) => {
                const newCmds = updateCommandParam(absCmds, i, paramIdx, val)
                const newD = serializePathCommands(newCmds)
                updateCurrentPath({ d: newD })
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  const renderStylePanel = () => (
    <div className="spe-panel-section">
      <div className="spe-panel-header">填充与描边样式</div>
      <div className="spe-panel-body">
        <div className="spe-style-row">
          <span className="spe-style-label">填充类型</span>
          <div className="spe-style-value">
            <select
              className="spe-select"
              value={currentStyle.fillType || 'none'}
              onChange={(e) => {
                const fillType = e.target.value
                updateStyle('fillType', fillType)
                if (fillType === 'none') updateStyle('fill', 'none')
                else if (fillType === 'solid') updateStyle('fill', currentStyle.fill || '#000000')
                else if (fillType === 'linearGradient' || fillType === 'radialGradient') {
                  updateStyle('fill', 'url(#gradient)')
                }
              }}
            >
              {FILL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {currentStyle.fillType === 'solid' && (
          <div className="spe-style-row">
            <span className="spe-style-label">填充颜色</span>
            <div className="spe-style-value">
              <div
                className="spe-color-swatch-btn"
                style={{ backgroundColor: currentStyle.fill || '#000' }}
                onClick={() => setShowColorPicker(showColorPicker === 'fill' ? null : 'fill')}
              />
              <input
                type="color"
                className="spe-color-input"
                value={currentStyle.fill || '#000000'}
                onChange={(e) => updateStyle('fill', e.target.value)}
              />
              <input
                className="spe-hex-input"
                value={currentStyle.fill || '#000000'}
                onChange={(e) => {
                  if (isValidHexColor(e.target.value)) updateStyle('fill', e.target.value)
                }}
              />
            </div>
          </div>
        )}

        {(currentStyle.fillType === 'linearGradient' || currentStyle.fillType === 'radialGradient') && (
          <>
            <div className="spe-gradient-row">
              <span style={{ fontSize: 11, color: '#999' }}>起始色</span>
              <input
                type="color"
                className="spe-color-input"
                value={currentStyle.fillGradientStart || '#ffffff'}
                onChange={(e) => updateStyle('fillGradientStart', e.target.value)}
              />
              <span style={{ fontSize: 11, color: '#999' }}>结束色</span>
              <input
                type="color"
                className="spe-color-input"
                value={currentStyle.fillGradientEnd || '#000000'}
                onChange={(e) => updateStyle('fillGradientEnd', e.target.value)}
              />
            </div>
            {currentStyle.fillType === 'linearGradient' && (
              <div className="spe-style-row">
                <span className="spe-style-label">渐变角度</span>
                <input
                  type="range"
                  className="spe-range"
                  min={0}
                  max={360}
                  value={currentStyle.fillGradientAngle || 0}
                  onChange={(e) => updateStyle('fillGradientAngle', Number(e.target.value))}
                />
                <span className="spe-stroke-width-val">{currentStyle.fillGradientAngle || 0}°</span>
              </div>
            )}
          </>
        )}

        {showColorPicker && (
          <div className="spe-color-presets">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className="spe-color-dot"
                style={{ backgroundColor: c }}
                onClick={() => {
                  if (showColorPicker === 'fill') updateStyle('fill', c)
                  else if (showColorPicker === 'stroke') updateStyle('stroke', c)
                  setShowColorPicker(null)
                }}
              />
            ))}
          </div>
        )}

        <div className="spe-style-row" style={{ marginTop: 8 }}>
          <span className="spe-style-label">描边颜色</span>
          <div className="spe-style-value">
            <div
              className="spe-color-swatch-btn"
              style={{ backgroundColor: currentStyle.stroke || '#333' }}
              onClick={() => setShowColorPicker(showColorPicker === 'stroke' ? null : 'stroke')}
            />
            <input
              type="color"
              className="spe-color-input"
              value={currentStyle.stroke || '#333333'}
              onChange={(e) => updateStyle('stroke', e.target.value)}
            />
            <input
              className="spe-hex-input"
              value={currentStyle.stroke || '#333333'}
              onChange={(e) => {
                if (isValidHexColor(e.target.value)) updateStyle('stroke', e.target.value)
              }}
            />
          </div>
        </div>

        <div className="spe-style-row">
          <span className="spe-style-label">描边线宽</span>
          <input
            type="range"
            className="spe-range"
            min={0}
            max={20}
            step={0.5}
            value={currentStyle.strokeWidth ?? 2}
            onChange={(e) => updateStyle('strokeWidth', Number(e.target.value))}
          />
          <span className="spe-stroke-width-val">{currentStyle.strokeWidth ?? 2}px</span>
        </div>

        <div className="spe-style-row">
          <span className="spe-style-label">端点样式</span>
          <select
            className="spe-select"
            value={currentStyle.linecap || 'butt'}
            onChange={(e) => updateStyle('linecap', e.target.value)}
          >
            {LINECAP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="spe-style-row">
          <span className="spe-style-label">连接样式</span>
          <select
            className="spe-select"
            value={currentStyle.linejoin || 'miter'}
            onChange={(e) => updateStyle('linejoin', e.target.value)}
          >
            {LINEJOIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="spe-style-row">
          <span className="spe-style-label">虚线样式</span>
          <div className="spe-style-value" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="spe-dash-presets">
              {DASH_PRESETS.map((p) => (
                <button
                  key={p.value}
                  className={`spe-dash-preset-btn ${currentStyle.dasharray === p.value ? 'active' : ''}`}
                  onClick={() => updateStyle('dasharray', p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              className="spe-dasharray-input"
              placeholder="自定义虚线数组，如 5,3,10,3"
              value={currentStyle.dasharray || ''}
              onChange={(e) => updateStyle('dasharray', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderPathList = () => (
    <div className="spe-sidebar">
      <div className="spe-sidebar-title">
        路径列表
        <button className="spe-icon-btn" onClick={handleAddPath} title="新增路径">+</button>
      </div>
      <div className="spe-path-list">
        {paths.map((p, i) => (
          <div
            key={p.id}
            className={`spe-path-item ${i === selectedPathIndex ? 'selected' : ''}`}
            onClick={() => setSelectedPathIndex(i)}
            draggable
            onDragStart={() => setDragPathIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragPathIndex >= 0 && dragPathIndex !== i) {
                handleMovePath(dragPathIndex, i)
              }
              setDragPathIndex(-1)
            }}
          >
            <svg className="spe-path-thumb" viewBox={getThumbViewBox(p.d)}>
              <path
                d={p.d}
                fill="none"
                stroke={p.style?.stroke || '#333'}
                strokeWidth={2}
              />
            </svg>
            {renamingIndex === i ? (
              <input
                className="spe-path-name-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit() }}
                autoFocus
              />
            ) : (
              <span
                className="spe-path-name"
                onDoubleClick={() => handleRename(i)}
              >
                {p.name}
              </span>
            )}
            <div className="spe-path-actions">
              <button
                className={`spe-icon-btn ${p.visible ? '' : 'eye-off'}`}
                onClick={(e) => { e.stopPropagation(); handleToggleVisibility(i) }}
                title={p.visible ? '隐藏' : '显示'}
              >
                {p.visible ? '👁' : '🚫'}
              </button>
              <button
                className="spe-icon-btn"
                onClick={(e) => { e.stopPropagation(); handleCopyPath(i) }}
                title="复制路径"
              >
                📋
              </button>
              <button
                className="spe-icon-btn"
                onClick={(e) => { e.stopPropagation(); handleDeletePath(i) }}
                title="删除路径"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="spe-add-path-btn" onClick={handleAddPath}>+ 新增路径</button>
    </div>
  )

  const renderExportModal = () => {
    if (!showExportModal) return null

    return (
      <div className="spe-modal-overlay" onClick={() => setShowExportModal(false)}>
        <div className="spe-modal" onClick={(e) => e.stopPropagation()}>
          <div className="spe-modal-header">
            <span className="spe-modal-title">导出 SVG 代码</span>
            <button className="spe-modal-close" onClick={() => setShowExportModal(false)}>✕</button>
          </div>
          <div className="spe-modal-body">
            <div className="spe-export-options">
              <label className="spe-export-option">
                <input
                  type="radio"
                  name="exportScope"
                  checked={exportAll}
                  onChange={() => setExportAll(true)}
                />
                全部路径
              </label>
              <label className="spe-export-option">
                <input
                  type="radio"
                  name="exportScope"
                  checked={!exportAll}
                  onChange={() => setExportAll(false)}
                />
                仅可见路径
              </label>
            </div>
            <div
              className="spe-code-block"
              dangerouslySetInnerHTML={{ __html: highlightSvg(svgCode) }}
            />
          </div>
          <div className="spe-modal-footer">
            <button className="spe-btn" onClick={() => handleDownloadSvg(svgCode)}>
              下载 SVG 文件
            </button>
            <button className="spe-btn spe-btn-primary" onClick={() => handleCopyCode(svgCode)}>
              {copied ? '已复制 ✓' : '复制代码'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fillDef = buildFillDef(currentStyle)

  return (
    <div className="spe-page">
      <div className="spe-header">
        <button className="spe-back-btn" onClick={() => navigate('/')}>← 返回首页</button>
        <h1 className="spe-title">SVG 路径编辑器</h1>
      </div>

      <div className="spe-toolbar">
        <button
          className={`spe-tool-btn ${mode === 'select' ? 'active' : ''}`}
          onClick={() => setMode('select')}
        >
          选择
        </button>
        <button
          className={`spe-tool-btn ${mode === 'add' ? 'active' : ''}`}
          onClick={() => setMode('add')}
        >
          添加节点
        </button>
        <div className="spe-separator" />
        <button
          className="spe-tool-btn danger"
          onClick={handleDeleteNode}
          disabled={selectedNodeIndex < 0}
        >
          删除节点
        </button>
        <button
          className="spe-tool-btn"
          onClick={handleConvertToLine}
          disabled={selectedNodeIndex < 0}
        >
          转为直线
        </button>
        <div className="spe-separator" />
        <button className="spe-tool-btn spe-btn-primary" onClick={handleExport}>
          导出 SVG
        </button>
      </div>

      <div className="spe-main">
        {renderPathList()}

        <div className="spe-canvas-area">
          <svg
            ref={svgRef}
            className="spe-canvas-svg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          >
            <defs>
              <pattern id="spe-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e8e8e8" strokeWidth={0.5} />
              </pattern>
              {fillDef}
            </defs>
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              <rect
                x={-pan.x / zoom}
                y={-pan.y / zoom}
                width={svgSize.width / zoom}
                height={svgSize.height / zoom}
                fill="url(#spe-grid)"
              />
              {paths.map((p, i) => renderPathOnCanvas(p, i))}
              {selectedPathIndex >= 0 && renderControlPoints()}
            </g>
          </svg>

          <div className="spe-zoom-controls">
            <button className="spe-zoom-btn" onClick={() => setZoom(clampZoom(zoom - 0.1))}>−</button>
            <span className="spe-zoom-info">{Math.round(zoom * 100)}%</span>
            <button className="spe-zoom-btn" onClick={() => setZoom(clampZoom(zoom + 0.1))}>+</button>
          </div>

          <div className="spe-hint">
            滚轮缩放 · 中键拖拽平移 · 双击路径名重命名 · Delete 删除节点
          </div>
        </div>

        <div className="spe-right-panel">
          {renderCommandPanel()}
          {renderStylePanel()}
        </div>
      </div>

      {renderExportModal()}
    </div>
  )
}

function CommandRow({ cmd, selected, onUpdate }) {
  if (cmd.type === 'Z') {
    return (
      <div className={`spe-cmd-row ${selected ? 'spe-cmd-selected' : ''}`}>
        <span className="spe-cmd-letter">Z</span>
        <span style={{ fontSize: 11, color: '#999' }}>闭合路径</span>
      </div>
    )
  }

  if (cmd.type === 'A') {
    const labels = ['rx', 'ry', '旋转', '大弧', '顺时针', 'x', 'y']
    return (
      <div className={`spe-cmd-row ${selected ? 'spe-cmd-selected' : ''}`}>
        <span className="spe-cmd-letter">A</span>
        <div className="spe-arc-group">
          {cmd.params.map((val, j) => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span className="spe-arc-label">{labels[j]}</span>
              <input
                className="spe-cmd-input arc-input"
                type="number"
                step={j <= 2 ? 1 : (j <= 4 ? 1 : 1)}
                value={Number.isInteger(val) ? val : Number(val).toFixed(1)}
                onChange={(e) => onUpdate(j, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const paramNames = {
    M: ['x', 'y'],
    L: ['x', 'y'],
    C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
    Q: ['x1', 'y1', 'x', 'y'],
  }
  const names = paramNames[cmd.type] || []

  return (
    <div className={`spe-cmd-row ${selected ? 'spe-cmd-selected' : ''}`}>
      <span className="spe-cmd-letter">{cmd.type}</span>
      {cmd.params.map((val, j) => (
        <input
          key={j}
          className="spe-cmd-input"
          type="number"
          step={1}
          value={Number.isInteger(val) ? val : Number(val).toFixed(1)}
          onChange={(e) => onUpdate(j, Number(e.target.value))}
          title={names[j] || ''}
        />
      ))}
    </div>
  )
}

function getSegmentStart(absCmds, segIndex) {
  let x = 0
  let y = 0
  for (let i = 0; i < segIndex; i++) {
    const cmd = absCmds[i]
    if (cmd.type === 'M') { x = cmd.params[0]; y = cmd.params[1] }
    else if (cmd.type === 'L') { x = cmd.params[0]; y = cmd.params[1] }
    else if (cmd.type === 'C') { x = cmd.params[4]; y = cmd.params[5] }
    else if (cmd.type === 'Q') { x = cmd.params[2]; y = cmd.params[3] }
    else if (cmd.type === 'A') { x = cmd.params[5]; y = cmd.params[6] }
  }
  return { x, y }
}

function getThumbViewBox(d) {
  if (!d) return '0 0 40 40'
  const bounds = getPathBounds(d)
  const pad = 5
  return `${bounds.minX - pad} ${bounds.minY - pad} ${Math.max(bounds.width + pad * 2, 10)} ${Math.max(bounds.height + pad * 2, 10)}`
}

function buildFillDef(style) {
  if (!style) return null
  if (style.fillType === 'linearGradient') {
    const angle = (style.fillGradientAngle || 0) * Math.PI / 180
    const x2 = 50 + Math.cos(angle) * 50
    const y2 = 50 + Math.sin(angle) * 50
    return (
      <linearGradient id="gradient" x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`}>
        <stop offset="0%" stopColor={style.fillGradientStart || '#fff'} />
        <stop offset="100%" stopColor={style.fillGradientEnd || '#000'} />
      </linearGradient>
    )
  }
  if (style.fillType === 'radialGradient') {
    return (
      <radialGradient id="gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={style.fillGradientStart || '#fff'} />
        <stop offset="100%" stopColor={style.fillGradientEnd || '#000'} />
      </radialGradient>
    )
  }
  return null
}

export default SvgPathEditorPage
