import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import DevicePanel from './DevicePanel.jsx'
import TopologyCanvas from './TopologyCanvas.jsx'
import PropertyPanel from './PropertyPanel.jsx'
import {
  loadFromStorage,
  saveToStorage,
  updateNode,
  deleteNode,
  deleteLinksByNodeId,
  updateLink,
  deleteLink,
  autoLayout,
  forceDirectedLayout,
  fitToView,
  downloadJson,
  importFromJson,
  getNodesBoundingBox,
  clampZoom,
} from './networkTopologyCore.js'
import {
  DEFAULT_ZOOM,
  LAYOUT_DIRECTION,
  LAYOUT_DIRECTION_LABELS,
} from './constants.js'
import './network-topology.css'

export default function NetworkTopologyPage() {
  const [state, setState] = useState(() => {
    const stored = loadFromStorage()
    return {
      nodes: stored.nodes || [],
      links: stored.links || [],
    }
  })
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedLinkId, setSelectedLinkId] = useState(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [layoutDirection, setLayoutDirection] = useState(LAYOUT_DIRECTION.VERTICAL)
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)

  const fileInputRef = useRef(null)
  const svgRef = useRef(null)
  const containerRef = useRef(null)

  const handleNodesChange = useCallback((newNodes) => {
    setState((s) => ({ ...s, nodes: newNodes }))
  }, [])

  const handleLinksChange = useCallback((newLinks) => {
    setState((s) => ({ ...s, links: newLinks }))
  }, [])

  const handleUpdateNode = useCallback((nodeId, updates) => {
    setState((s) => ({ ...s, nodes: updateNode(s.nodes, nodeId, updates) }))
  }, [])

  const handleDeleteNode = useCallback((nodeId) => {
    setState((s) => ({
      nodes: deleteNode(s.nodes, nodeId),
      links: deleteLinksByNodeId(s.links, nodeId),
    }))
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
  }, [selectedNodeId])

  const handleUpdateLink = useCallback((linkId, updates) => {
    setState((s) => ({ ...s, links: updateLink(s.links, linkId, updates) }))
  }, [])

  const handleDeleteLink = useCallback((linkId) => {
    setState((s) => ({ ...s, links: deleteLink(s.links, linkId) }))
    if (selectedLinkId === linkId) setSelectedLinkId(null)
  }, [selectedLinkId])

  const handleZoomIn = useCallback(() => {
    setZoom((z) => clampZoom(z + 0.1))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => clampZoom(z - 0.1))
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleFitToView = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || state.nodes.length === 0) return
    const { panX, panY, zoom: newZoom } = fitToView(state.nodes, rect.width, rect.height, 100)
    setPan({ x: panX, y: panY })
    setZoom(newZoom)
  }, [state.nodes])

  useEffect(() => {
    const result = saveToStorage(state)
    if (!result.success && result.error) {
      console.warn('保存失败:', result.error)
    }
  }, [state])

  useEffect(() => {
    if (state.nodes.length > 0) {
      const timer = setTimeout(() => {
        handleFitToView()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [handleFitToView, state.nodes.length])

  const handleAutoLayout = useCallback(
    (direction = layoutDirection) => {
      const bbox = getNodesBoundingBox(state.nodes)
      const startX = bbox.width > 0 ? -bbox.minX + 100 : 100
      const startY = bbox.height > 0 ? -bbox.minY + 100 : 100
      const laid = autoLayout(state.nodes, state.links, direction, startX, startY)
      setState((s) => ({ ...s, nodes: laid }))
      setLayoutDirection(direction)
      setShowLayoutMenu(false)
      setTimeout(() => handleFitToView(), 50)
    },
    [state.nodes, state.links, layoutDirection, handleFitToView]
  )

  const handleForceLayout = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    const width = rect?.width || 800
    const height = rect?.height || 600
    const laid = forceDirectedLayout(state.nodes, state.links, 150, width, height)
    setState((s) => ({ ...s, nodes: laid }))
    setShowLayoutMenu(false)
    setTimeout(() => handleFitToView(), 50)
  }, [state.nodes, state.links, handleFitToView])

  const handleExportJson = useCallback(() => {
    downloadJson(state, `network-topology-${Date.now()}.json`)
  }, [state])

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
        setState({
          nodes: result.data.nodes,
          links: result.data.links,
        })
        setSelectedNodeId(null)
        setSelectedLinkId(null)
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
    if (!svg) {
      alert('导出失败：画布未准备好')
      return
    }

    if (state.nodes.length === 0) {
      alert('画布为空，无法导出')
      return
    }

    try {
      const bbox = getNodesBoundingBox(state.nodes)
      const padding = 40
      const width = bbox.width + padding * 2
      const height = bbox.height + padding * 2

      const clonedSvg = svg.cloneNode(true)
      const transformGroup = clonedSvg.querySelector('.nt-canvas-content')
      if (transformGroup) {
        transformGroup.setAttribute(
          'transform',
          `translate(${padding - bbox.minX}, ${padding - bbox.minY})`
        )
      }

      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bgRect.setAttribute('x', '0')
      bgRect.setAttribute('y', '0')
      bgRect.setAttribute('width', width)
      bgRect.setAttribute('height', height)
      bgRect.setAttribute('fill', '#ffffff')
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild)

      const gridRect = clonedSvg.querySelector('.nt-bg-grid')
      if (gridRect) gridRect.remove()
      const defs = clonedSvg.querySelector('defs')
      if (defs) defs.remove()

      clonedSvg.setAttribute('width', width)
      clonedSvg.setAttribute('height', height)
      clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`)

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
          if (!blob) {
            alert('导出 PNG 失败')
            return
          }
          const downloadUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = `network-topology-${Date.now()}.png`
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
    } catch (e) {
      alert('导出 PNG 失败：' + (e?.message || '未知错误'))
    }
  }, [state.nodes])

  const handleClearAll = useCallback(() => {
    if (state.nodes.length === 0 && state.links.length === 0) return
    if (confirm('确定要清空画布吗？此操作不可撤销。')) {
      setState({ nodes: [], links: [] })
      setSelectedNodeId(null)
      setSelectedLinkId(null)
    }
  }, [state.nodes, state.links])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLinkId) {
        e.preventDefault()
        handleDeleteLink(selectedLinkId)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault()
        handleDeleteNode(selectedNodeId)
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        handleZoomIn()
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        handleFitToView()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleExportJson()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, selectedLinkId, handleDeleteNode, handleDeleteLink, handleZoomIn, handleZoomOut, handleFitToView, handleExportJson])

  return (
    <div className="nt-page">
      <div className="nt-header">
        <div className="nt-header-left">
          <Link to="/" className="nt-back-link">← 返回首页</Link>
          <h1 className="nt-title">网络拓扑图编辑器</h1>
        </div>
        <div className="nt-header-right">
          <span className="nt-stats">
            节点: {state.nodes.length} · 连线: {state.links.length}
          </span>
        </div>
      </div>

      <div className="nt-toolbar">
        <div className="nt-toolbar-group">
          <div className="nt-dropdown">
            <button
              className="nt-btn"
              onClick={() => setShowLayoutMenu((v) => !v)}
            >
              🧩 自动布局 ▾
            </button>
            {showLayoutMenu && (
              <div className="nt-dropdown-menu">
                <button
                  className="nt-dropdown-item"
                  onClick={() => handleAutoLayout(LAYOUT_DIRECTION.VERTICAL)}
                >
                  ↓ {LAYOUT_DIRECTION_LABELS[LAYOUT_DIRECTION.VERTICAL]}
                </button>
                <button
                  className="nt-dropdown-item"
                  onClick={() => handleAutoLayout(LAYOUT_DIRECTION.HORIZONTAL)}
                >
                  → {LAYOUT_DIRECTION_LABELS[LAYOUT_DIRECTION.HORIZONTAL]}
                </button>
                <div className="nt-dropdown-divider" />
                <button
                  className="nt-dropdown-item"
                  onClick={handleForceLayout}
                >
                  ⚛️ 力导向布局
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="nt-toolbar-spacer" />

        <div className="nt-toolbar-group">
          <button className="nt-btn" onClick={handleImportClick} title="加载 JSON 文件 (Ctrl+O)">
            📥 加载
          </button>
          <button className="nt-btn" onClick={handleExportJson} title="保存 JSON 文件 (Ctrl+S)">
            💾 保存
          </button>
          <button className="nt-btn nt-btn-primary" onClick={handleExportPng} title="导出为 PNG 图片">
            🖼️ 导出 PNG
          </button>
          <button className="nt-btn nt-btn-danger" onClick={handleClearAll} title="清空画布">
            🗑️ 清空
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="nt-hidden-input"
          onChange={handleImportFile}
        />
      </div>

      <div className="nt-body">
        <DevicePanel />

        <div className="nt-main" ref={containerRef}>
          <TopologyCanvas
            nodes={state.nodes}
            links={state.links}
            selectedNodeId={selectedNodeId}
            selectedLinkId={selectedLinkId}
            pan={pan}
            zoom={zoom}
            onNodesChange={handleNodesChange}
            onLinksChange={handleLinksChange}
            onSelectNode={setSelectedNodeId}
            onSelectLink={setSelectedLinkId}
            onPanChange={setPan}
            onZoomChange={setZoom}
            svgRef={svgRef}
          />

          <div className="nt-zoom-controls">
            <button className="nt-zoom-btn" onClick={handleZoomOut} title="缩小 (Ctrl+-)">
              −
            </button>
            <div className="nt-zoom-info">{(zoom * 100).toFixed(0)}%</div>
            <button className="nt-zoom-btn" onClick={handleZoomIn} title="放大 (Ctrl++)">
              +
            </button>
            <button
              className="nt-zoom-btn"
              onClick={handleResetZoom}
              title="重置缩放"
              style={{ fontSize: '12px' }}
            >
              ⟲
            </button>
            <button
              className="nt-zoom-btn"
              onClick={handleFitToView}
              title="适应画布 (Ctrl+0)"
              style={{ fontSize: '12px' }}
            >
              ⤢
            </button>
          </div>

          <div className="nt-hints">
            <span>滚轮缩放 · 拖拽画布平移 · 拖拽端口连线</span>
            <span>
              <kbd>Del</kbd> 删除 · <kbd>Ctrl+S</kbd> 保存
            </span>
          </div>
        </div>

        <PropertyPanel
          selectedNodeId={selectedNodeId}
          selectedLinkId={selectedLinkId}
          nodes={state.nodes}
          links={state.links}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onUpdateLink={handleUpdateLink}
          onDeleteLink={handleDeleteLink}
        />
      </div>

      {showLayoutMenu && (
        <div
          className="nt-dropdown-backdrop"
          onClick={() => setShowLayoutMenu(false)}
        />
      )}
    </div>
  )
}
