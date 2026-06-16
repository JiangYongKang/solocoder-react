import { useMemo } from 'react'
import {
  DEVICE_TYPE_LABELS,
  DEVICE_TYPE_ICONS,
  LINE_STYLE_LABELS,
  MIN_LINE_WIDTH,
  MAX_LINE_WIDTH,
  DEFAULT_LINE_WIDTH,
} from './constants.js'

export default function PropertyPanel({
  selectedNodeId,
  selectedLinkId,
  nodes,
  links,
  onUpdateNode,
  onDeleteNode,
  onUpdateLink,
  onDeleteLink,
}) {
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  )

  const selectedLink = useMemo(
    () => links.find((l) => l.id === selectedLinkId) || null,
    [links, selectedLinkId]
  )

  if (!selectedNode && !selectedLink) {
    return (
      <div className="nt-property-panel">
        <div className="nt-panel-header">
          <span className="nt-panel-title">属性面板</span>
        </div>
        <div className="nt-empty-prop">
          <div className="nt-empty-icon">📋</div>
          <p>请选中节点或连线</p>
          <p className="nt-hint-text">选中后可编辑属性</p>
        </div>
      </div>
    )
  }

  if (selectedNode) {
    return (
      <div className="nt-property-panel">
        <div className="nt-panel-header">
          <span className="nt-panel-title">节点属性</span>
        </div>
        <div className="nt-prop-content">
          <div className="nt-prop-section">
            <div className="nt-prop-label">类型</div>
            <div className="nt-prop-value nt-node-type">
              <span className="nt-type-icon">{DEVICE_TYPE_ICONS[selectedNode.type]}</span>
              {DEVICE_TYPE_LABELS[selectedNode.type]}
            </div>
          </div>

          <div className="nt-prop-section">
            <label className="nt-prop-label">名称</label>
            <input
              type="text"
              className="nt-prop-input"
              value={selectedNode.name}
              onChange={(e) => onUpdateNode(selectedNode.id, { name: e.target.value })}
            />
          </div>

          <div className="nt-prop-section">
            <div className="nt-prop-label">ID</div>
            <div className="nt-prop-value nt-mono">{selectedNode.id}</div>
          </div>

          <div className="nt-prop-grid">
            <div className="nt-prop-section">
              <label className="nt-prop-label">X 坐标</label>
              <input
                type="number"
                className="nt-prop-input"
                value={Math.round(selectedNode.x)}
                onChange={(e) => onUpdateNode(selectedNode.id, { x: Number(e.target.value) })}
              />
            </div>
            <div className="nt-prop-section">
              <label className="nt-prop-label">Y 坐标</label>
              <input
                type="number"
                className="nt-prop-input"
                value={Math.round(selectedNode.y)}
                onChange={(e) => onUpdateNode(selectedNode.id, { y: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="nt-prop-actions">
            <button
              className="nt-btn nt-btn-danger"
              onClick={() => onDeleteNode(selectedNode.id)}
            >
              🗑️ 删除节点
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedLink) {
    return (
      <div className="nt-property-panel">
        <div className="nt-panel-header">
          <span className="nt-panel-title">连线属性</span>
        </div>
        <div className="nt-prop-content">
          <div className="nt-prop-section">
            <div className="nt-prop-label">ID</div>
            <div className="nt-prop-value nt-mono">{selectedLink.id}</div>
          </div>

          <div className="nt-prop-section">
            <label className="nt-prop-label">标签</label>
            <input
              type="text"
              className="nt-prop-input"
              value={selectedLink.label || ''}
              placeholder="如：千兆光纤、VPN 隧道"
              onChange={(e) => onUpdateLink(selectedLink.id, { label: e.target.value })}
            />
          </div>

          <div className="nt-prop-section">
            <label className="nt-prop-label">线型</label>
            <div className="nt-style-options">
              {Object.entries(LINE_STYLE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  className={`nt-style-btn ${selectedLink.style === value ? 'active' : ''}`}
                  onClick={() => onUpdateLink(selectedLink.id, { style: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="nt-prop-section">
            <label className="nt-prop-label">
              线宽: {selectedLink.width || DEFAULT_LINE_WIDTH}px
            </label>
            <input
              type="range"
              min={MIN_LINE_WIDTH}
              max={MAX_LINE_WIDTH}
              value={selectedLink.width || DEFAULT_LINE_WIDTH}
              onChange={(e) => onUpdateLink(selectedLink.id, { width: Number(e.target.value) })}
              className="nt-range-input"
            />
            <div className="nt-range-labels">
              <span>{MIN_LINE_WIDTH}px</span>
              <span>{MAX_LINE_WIDTH}px</span>
            </div>
          </div>

          <div className="nt-prop-actions">
            <button
              className="nt-btn nt-btn-danger"
              onClick={() => onDeleteLink(selectedLink.id)}
            >
              🗑️ 删除连线 (Delete)
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
