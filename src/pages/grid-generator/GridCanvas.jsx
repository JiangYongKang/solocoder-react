import { useState, useRef, useEffect } from 'react'
import {
  getCellAtPosition, isCellOrigin, buildTemplateColumns, buildTemplateRows,
  clearAllCellColors, randomizeCellColors, getGridLineNumbers,
  DEFAULT_CELL_COLOR, PRESET_COLORS,
} from './gridGeneratorCore.js'

function ColorPickerPopup({ position, currentColor, onPick, onClose }) {
  const ref = useRef(null)
  const [customColor, setCustomColor] = useState(currentColor || '#3b82f6')

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!position) return null

  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
  }

  return (
    <div className="gg-color-picker-popup" ref={ref} style={style}>
      <div className="gg-color-popup-header">
        <span className="gg-color-popup-title">选择颜色</span>
        <button className="gg-color-popup-close" onClick={onClose}>×</button>
      </div>
      <div className="gg-preset-colors">
        {PRESET_COLORS.map((c) => (
          <div
            key={c}
            className="gg-preset-color"
            style={{ background: c }}
            onClick={() => onPick(c)}
            title={c}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button className="gg-btn gg-btn-sm" style={{ flex: 1 }} onClick={() => onPick('')}>
          清除颜色
        </button>
      </div>
      <div className="gg-custom-color">
        <input
          type="color"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
        />
        <input
          type="text"
          value={customColor}
          onChange={(e) => {
            const v = e.target.value
            setCustomColor(v)
          }}
        />
        <button className="gg-btn gg-btn-sm gg-btn-primary" onClick={() => onPick(customColor)}>
          确定
        </button>
      </div>
    </div>
  )
}

export default function GridCanvas({
  config,
  selectedCellId,
  onSelectCell,
  onCellColorChange,
  onClearAllColors,
  onRandomizeColors,
}) {
  const { rows, cols, rowSizes, colSizes, rowGap, colGap, justifyContent, alignContent, placeItems, cells } = config
  const [colorPopup, setColorPopup] = useState(null)
  const canvasRef = useRef(null)

  const gridStyle = {
    gridTemplateColumns: buildTemplateColumns(colSizes),
    gridTemplateRows: buildTemplateRows(rowSizes),
    rowGap: `${rowGap}px`,
    columnGap: `${colGap}px`,
    justifyContent,
    alignContent,
    placeItems,
  }

  const colLines = getGridLineNumbers(cols)
  const rowLines = getGridLineNumbers(rows)

  const handleCellClick = (e, cell) => {
    if (colorPopup) {
      setColorPopup(null)
      return
    }
    if (isCellOrigin(cell, cell.col, cell.row)) {
      onSelectCell(cell.id)
    } else {
      const origin = cells.find((c) => c.id === cell.id)
      if (origin) onSelectCell(origin.id)
    }
  }

  const handleCellContextMenu = (e, cell) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setColorPopup({
      cellId: cell.id,
      x: e.clientX - rect.left + (canvasRef.current?.scrollLeft || 0),
      y: e.clientY - rect.top + (canvasRef.current?.scrollTop || 0),
    })
  }

  const handleColorPick = (color) => {
    if (colorPopup) {
      onCellColorChange(colorPopup.cellId, color)
      setColorPopup(null)
    }
  }

  const renderedCells = []
  const visited = new Set()
  for (let r = 1; r <= rows; r += 1) {
    for (let c = 1; c <= cols; c += 1) {
      const cell = getCellAtPosition(cells, c, r)
      if (!cell) continue
      if (visited.has(cell.id)) continue
      if (isCellOrigin(cell, c, r)) {
        visited.add(cell.id)
        renderedCells.push({ cell, c, r })
      }
    }
  }

  return (
    <div className="gg-grid-canvas-wrapper">
      <div className="gg-canvas-toolbar">
        <button className="gg-btn gg-btn-sm" onClick={onRandomizeColors}>
          🎨 随机着色
        </button>
        <button className="gg-btn gg-btn-sm gg-btn-danger" onClick={onClearAllColors}>
          🗑 清除颜色
        </button>
        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', alignSelf: 'center' }}>
          提示：左键选中，右键设置颜色
        </span>
      </div>
      <div className="gg-grid-wrapper" ref={canvasRef} style={{ position: 'relative' }}>
        <div className="gg-col-line-numbers" style={{
          display: 'grid',
          gridTemplateColumns: `24px ${buildTemplateColumns(colSizes)}`,
          gap: `0 ${colGap}px`,
        }}>
          <div />
          {colLines.map((n, i) => (
            <div key={n} className="gg-line-number" style={{ gridColumn: i + 2 }}>
              {n}
            </div>
          ))}
        </div>

        <div
          className="gg-grid-container"
          style={{
            ...gridStyle,
            marginLeft: 24,
            marginTop: 24,
          }}
        >
          {renderedCells.map(({ cell }) => {
            const isSelected = cell.id === selectedCellId
            const isMerged = cell.colSpan > 1 || cell.rowSpan > 1
            const bg = cell.backgroundColor || DEFAULT_CELL_COLOR
            return (
              <div
                key={cell.id}
                className={`gg-cell ${isSelected ? 'selected' : ''} ${isMerged ? 'merged' : ''}`}
                style={{
                  gridColumn: `${cell.col} / span ${cell.colSpan}`,
                  gridRow: `${cell.row} / span ${cell.rowSpan}`,
                  background: bg,
                  color: cell.backgroundColor ? '#1e293b' : undefined,
                }}
                onClick={(e) => handleCellClick(e, cell)}
                onContextMenu={(e) => handleCellContextMenu(e, cell)}
              >
                <span className="gg-cell-label">
                  {isMerged ? `${cell.colSpan}×${cell.rowSpan}` : `${cell.col},${cell.row}`}
                </span>
              </div>
            )
          })}
        </div>

        {rowLines.map((n, i) => (
          <div
            key={`row-${n}`}
            className="gg-line-number"
            style={{
              position: 'absolute',
              left: 0,
              top: i === 0 ? 24 : undefined,
              ...(i > 0 ? { marginTop: `${(i - 1) * 0}px` } : {}),
              width: 24,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              gridRow: i + 1,
            }}
          >
          </div>
        ))}

        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 24,
            display: 'grid',
            gridTemplateRows: buildTemplateRows(rowSizes),
            gap: `${rowGap}px 0`,
            width: 24,
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="gg-line-number" style={{ alignSelf: 'center' }}>
              {i + 1}
            </div>
          ))}
        </div>

        {colorPopup && (
          <ColorPickerPopup
            position={{ x: colorPopup.x, y: colorPopup.y }}
            currentColor={cells.find((c) => c.id === colorPopup.cellId)?.backgroundColor}
            onPick={handleColorPick}
            onClose={() => setColorPopup(null)}
          />
        )}
      </div>
    </div>
  )
}
