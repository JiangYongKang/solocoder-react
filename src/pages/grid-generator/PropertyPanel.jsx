import {
  getMaxColSpanForCell, getMaxRowSpanForCell, validateSpanChange,
  getCellGridLines,
} from './gridGeneratorCore.js'
import { PRESET_COLORS } from './constants.js'

export default function PropertyPanel({
  config,
  selectedCellId,
  onSpanChange,
  onPropertyChange,
  onColorChange,
}) {
  const cell = selectedCellId ? config.cells.find((c) => c.id === selectedCellId) : null

  if (!cell) {
    return (
      <div className="gg-property-panel">
        <h3 className="gg-section-title">单元格属性</h3>
        <div className="gg-no-selection">
          <div style={{ fontSize: 36, marginBottom: 10 }}>◧</div>
          <div>在左侧网格画布中</div>
          <div>点击任意单元格以查看属性</div>
        </div>
      </div>
    )
  }

  const maxColSpan = getMaxColSpanForCell(config.cells, cell, config.cols)
  const maxRowSpan = getMaxRowSpanForCell(config.cells, cell, config.rows)
  const lines = getCellGridLines(cell)

  const handleColSpan = (v) => {
    const num = Math.max(1, Math.floor(Number(v) || 1))
    const valid = validateSpanChange(config.cells, cell.id, num, cell.rowSpan, config.rows, config.cols)
    if (valid.valid) {
      onSpanChange(cell.id, num, cell.rowSpan)
    }
  }

  const handleRowSpan = (v) => {
    const num = Math.max(1, Math.floor(Number(v) || 1))
    const valid = validateSpanChange(config.cells, cell.id, cell.colSpan, num, config.rows, config.cols)
    if (valid.valid) {
      onSpanChange(cell.id, cell.colSpan, num)
    }
  }

  return (
    <div className="gg-property-panel">
      <div>
        <h3 className="gg-section-title">单元格属性</h3>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
          位置: <span style={{ fontFamily: 'Courier New, monospace', color: '#0f172a', fontWeight: 600 }}>
            ({cell.col}, {cell.row})
          </span>
        </div>
      </div>

      <div>
        <h3 className="gg-section-title">跨行列设置</h3>
        <div className="gg-field">
          <div className="gg-field-label">跨列数 (Column Span)</div>
          <select
            className="gg-select"
            value={cell.colSpan}
            onChange={(e) => handleColSpan(e.target.value)}
          >
            {Array.from({ length: maxColSpan }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? '列' : '列（合并）'}</option>
            ))}
          </select>
        </div>
        <div className="gg-field">
          <div className="gg-field-label">跨行数 (Row Span)</div>
          <select
            className="gg-select"
            value={cell.rowSpan}
            onChange={(e) => handleRowSpan(e.target.value)}
          >
            {Array.from({ length: maxRowSpan }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? '行' : '行（合并）'}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="gg-section-title">区域名称</h3>
        <div className="gg-field">
          <input
            type="text"
            className="gg-text-input"
            placeholder="例如: header, sidebar..."
            value={cell.areaName}
            onChange={(e) => onPropertyChange(cell.id, 'areaName', e.target.value)}
          />
        </div>
      </div>

      <div>
        <h3 className="gg-section-title">背景颜色</h3>
        <div className="gg-field">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {PRESET_COLORS.slice(0, 8).map((c) => (
              <button
                key={c}
                className="gg-preset-color"
                style={{
                  width: '100%',
                  height: 32,
                  border: cell.backgroundColor === c ? '2px solid #0f172a' : '2px solid transparent',
                  borderRadius: 4,
                  background: c,
                  cursor: 'pointer',
                  padding: 0,
                }}
                onClick={() => onColorChange(cell.id, c)}
                title={c}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
            <input
              type="color"
              value={cell.backgroundColor || '#e5e7eb'}
              onChange={(e) => onColorChange(cell.id, e.target.value)}
              style={{ width: 40, height: 28, padding: 0, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}
            />
            <input
              type="text"
              className="gg-text-input"
              placeholder="HEX 颜色"
              value={cell.backgroundColor}
              onChange={(e) => onColorChange(cell.id, e.target.value)}
              style={{ flex: 1, fontFamily: 'Courier New, monospace', fontSize: 12 }}
            />
            <button
              className="gg-btn gg-btn-sm"
              onClick={() => onColorChange(cell.id, '')}
              title="清除颜色"
            >
              清除
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="gg-section-title">网格线位置</h3>
        <div className="gg-property-grid">
          <div className="gg-property-card">
            <div className="gg-property-label">起始行线</div>
            <div className="gg-property-value">{lines.rowStart}</div>
          </div>
          <div className="gg-property-card">
            <div className="gg-property-label">结束行线</div>
            <div className="gg-property-value">{lines.rowEnd}</div>
          </div>
          <div className="gg-property-card">
            <div className="gg-property-label">起始列线</div>
            <div className="gg-property-value">{lines.colStart}</div>
          </div>
          <div className="gg-property-card">
            <div className="gg-property-label">结束列线</div>
            <div className="gg-property-value">{lines.colEnd}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
