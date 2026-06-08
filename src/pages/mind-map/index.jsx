import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MindMapCanvas from './MindMapCanvas.jsx'
import ContextMenu from './ContextMenu.jsx'
import {
  loadFromStorage,
  saveToStorage,
  updateNode,
  addChildNode,
  addSiblingNode,
  deleteNode,
  toggleCollapse,
  moveNode,
  findNodeById,
  findParentNode,
  getPrevSibling,
  getNextSibling,
  clampZoom,
  downloadJson,
  importFromJson,
  calculateLayoutBalanced,
  fitToView,
  exportToJson,
} from './mindMapCore.js'
import { DEFAULT_ZOOM } from './constants.js'
import './mind-map.css'

function MindMapPage() {
  const navigate = useNavigate()
  const [tree, setTree] = useState(() => loadFromStorage())
  const [selectedId, setSelectedId] = useState(() => tree?.id || null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [editingId, setEditingId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    saveToStorage(tree)
  }, [tree])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToView()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleFitToView = useCallback(() => {
    if (!containerRef.current || !tree) return
    const rect = containerRef.current.getBoundingClientRect()
    const positions = calculateLayoutBalanced(tree, 0, 0)
    const { panX, panY, zoom: newZoom } = fitToView(positions, rect.width, rect.height, 100)
    setPan({ x: panX, y: panY })
    setZoom(newZoom)
  }, [tree])

  const handleSelectNode = useCallback((id) => {
    setSelectedId(id)
    setContextMenu(null)
  }, [])

  const handleToggleCollapse = useCallback((nodeId) => {
    setTree((prev) => toggleCollapse(prev, nodeId))
  }, [])

  const handleAddChild = useCallback(() => {
    if (!selectedId) return
    setTree((prev) => {
      const { tree: newTree, newNodeId } = addChildNode(prev, selectedId)
      setSelectedId(newNodeId)
      setEditingId(newNodeId)
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
      const { tree: newTree, newNodeId } = addSiblingNode(prev, selectedId)
      setSelectedId(newNodeId)
      setEditingId(newNodeId)
      return newTree
    })
  }, [selectedId, tree, handleAddChild])

  const handleDeleteNode = useCallback(() => {
    if (!selectedId || !tree) return
    if (selectedId === tree.id) return
    setTree((prev) => deleteNode(prev, selectedId))
    setSelectedId(tree?.id || null)
  }, [selectedId, tree])

  const handleEditText = useCallback((nodeId, text) => {
    setTree((prev) => updateNode(prev, nodeId, { text: text?.trim() || '未命名' }))
  }, [])

  const handleEditNode = useCallback((nodeId) => {
    setEditingId(nodeId)
    setSelectedId(nodeId)
  }, [])

  const handleColorChange = useCallback((color) => {
    if (!selectedId) return
    setTree((prev) => updateNode(prev, selectedId, { color }))
  }, [selectedId])

  const handleIconChange = useCallback((icon) => {
    if (!selectedId) return
    setTree((prev) => updateNode(prev, selectedId, { icon }))
  }, [selectedId])

  const handleMoveNode = useCallback((sourceId, targetId, position) => {
    setTree((prev) => moveNode(prev, sourceId, targetId, position))
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoom((z) => clampZoom(z + 0.1))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => clampZoom(z - 0.1))
  }, [])

  const handleExportJson = useCallback(() => {
    downloadJson(tree, `mindmap-${Date.now()}.json`)
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
        setTree(result.data)
        setSelectedId(result.data.id)
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
    const svg = document.querySelector('.mind-svg')
    if (!svg || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const positions = calculateLayoutBalanced(tree, 0, 0)

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
    const mainGroup = clonedSvg.querySelector('g')
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
        a.download = `mindmap-${Date.now()}.png`
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
  }, [tree])

  const handleNodeContextMenu = useCallback((nodeId, clientX, clientY) => {
    setSelectedId(nodeId)
    setContextMenu({
      x: clientX,
      y: clientY,
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === 'Tab') {
        e.preventDefault()
        handleAddChild()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleAddSibling()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && tree && selectedId !== tree.id) {
          e.preventDefault()
          handleDeleteNode()
        }
      } else if (e.key === 'F2') {
        e.preventDefault()
        if (selectedId) {
          handleEditNode(selectedId)
        }
      } else if (e.key === 'ArrowUp' && selectedId) {
        e.preventDefault()
        const prev = getPrevSibling(tree, selectedId)
        if (prev) setSelectedId(prev)
      } else if (e.key === 'ArrowDown' && selectedId) {
        e.preventDefault()
        const next = getNextSibling(tree, selectedId)
        if (next) setSelectedId(next)
      } else if (e.key === 'ArrowLeft' && selectedId) {
        e.preventDefault()
        const parent = findParentNode(tree, selectedId)
        if (parent) setSelectedId(parent.id)
      } else if ((e.ctrlKey || e.metaKey) && e.key === '=' || e.key === '+') {
        e.preventDefault()
        handleZoomIn()
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        handleFitToView()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    editingId,
    selectedId,
    tree,
    handleAddChild,
    handleAddSibling,
    handleDeleteNode,
    handleEditNode,
    handleZoomIn,
    handleZoomOut,
    handleFitToView,
  ])

  const selectedNode = useMemo(
    () => (selectedId ? findNodeById(tree, selectedId) : null),
    [tree, selectedId]
  )

  return (
    <div className="mind-map-page">
      <div className="mind-map-header">
        <div className="mind-map-header-left">
          <Link to="/" className="mind-back-link">← 返回首页</Link>
          <h1 className="mind-map-title">思维导图编辑器</h1>
        </div>
      </div>

      <div className="mind-map-toolbar">
        <div className="mind-toolbar-left">
          <button
            className="mind-btn"
            onClick={handleAddChild}
            disabled={!selectedId}
            title="添加子节点 (Tab)"
          >
            ➕ 子节点
          </button>
          <button
            className="mind-btn"
            onClick={handleAddSibling}
            disabled={!selectedId}
            title="添加同级节点 (Enter)"
          >
            ↔ 同级
          </button>
          <button
            className="mind-btn"
            onClick={() => selectedId && handleEditNode(selectedId)}
            disabled={!selectedId}
            title="编辑节点文字 (F2)"
          >
            ✏️ 编辑
          </button>
          <button
            className="mind-btn"
            onClick={handleDeleteNode}
            disabled={!selectedId || !tree || selectedId === tree.id}
            title="删除节点 (Delete)"
          >
            🗑️ 删除
          </button>
        </div>
        <div className="mind-toolbar-right">
          <button className="mind-btn" onClick={handleImportClick} title="从 JSON 文件导入">
            📥 导入 JSON
          </button>
          <button className="mind-btn" onClick={handleExportJson} title="导出为 JSON 文件">
            📤 导出 JSON
          </button>
          <button className="mind-btn mind-btn-primary" onClick={handleExportPng} title="导出为 PNG 图片">
            🖼️ 导出 PNG
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="mind-hidden-file-input"
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div ref={containerRef}>
        <MindMapCanvas
          tree={tree}
          selectedId={selectedId}
          onSelectNode={handleSelectNode}
          onAddChild={handleAddChild}
          onToggleCollapse={handleToggleCollapse}
          onEditNode={handleEditNode}
          onMoveNode={handleMoveNode}
          onNodeContextMenu={handleNodeContextMenu}
          pan={pan}
          zoom={zoom}
          onPanChange={setPan}
          onZoomChange={setZoom}
          editingId={editingId}
          onEditingChange={setEditingId}
          onEditText={handleEditText}
        />
      </div>

      <div className="mind-hint">
        <div>
          <kbd>Tab</kbd> 添加子节点 <kbd>Enter</kbd> 添加同级
        </div>
        <div>
          <kbd>F2</kbd> 编辑 <kbd>Del</kbd> 删除 <kbd>↑↓</kbd> 切换同级 <kbd>←</kbd> 返回父节点
        </div>
        <div>滚轮缩放 · 拖拽画布平移 · 拖拽节点调整位置 · 右键更多选项</div>
      </div>

      <div className="mind-zoom-controls">
        <button className="mind-zoom-btn" onClick={handleZoomOut} title="缩小">−</button>
        <div className="mind-zoom-info">{(zoom * 100).toFixed(0)}%</div>
        <button className="mind-zoom-btn" onClick={handleZoomIn} title="放大">+</button>
        <button className="mind-zoom-btn" onClick={handleFitToView} title="适应画布" style={{ fontSize: '12px' }}>
          ⤢
        </button>
      </div>

      {contextMenu && selectedNode && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={selectedNode}
          onClose={() => setContextMenu(null)}
          onColorChange={handleColorChange}
          onIconChange={handleIconChange}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onEdit={() => handleEditNode(selectedId)}
          onDelete={handleDeleteNode}
        />
      )}
    </div>
  )
}

export default MindMapPage
