import {
  MIN_ROWS, MAX_ROWS, MIN_COLS, MAX_COLS,
  MIN_GAP, MAX_GAP, SIZE_MODES,
  JUSTIFY_CONTENT_OPTIONS, ALIGN_CONTENT_OPTIONS, PLACE_ITEMS_OPTIONS,
} from './constants.js'
import { clampRows, clampCols, clampGap, clampSizeValue } from './gridGeneratorCore.js'

function NumberStepper({ value, onChange, min, max, label }) {
  const handleInc = () => onChange(Math.min(max, value + 1))
  const handleDec = () => onChange(Math.max(min, value - 1))
  const handleInput = (e) => {
    const v = Number(e.target.value)
    if (!Number.isNaN(v)) onChange(v)
  }
  return (
    <div className="gg-field">
      <div className="gg-field-label">{label}</div>
      <div className="gg-number-input">
        <button onClick={handleDec} disabled={value <= min}>−</button>
        <input type="number" value={value} min={min} max={max} onChange={handleInput} />
        <button onClick={handleInc} disabled={value >= max}>+</button>
      </div>
    </div>
  )
}

function SizeList({ title, sizes, modes, onModeChange, onValueChange, uniformValue, onUniformValueChange }) {
  const handleIndividualMode = (idx, mode) => {
    const next = [...sizes]
    const oldMode = next[idx].mode
    let newValue = next[idx].value
    if (oldMode !== mode) {
      if (mode === SIZE_MODES.PIXEL) newValue = 80
      else if (mode === SIZE_MODES.PERCENT) newValue = 100 / sizes.length
      else newValue = 1
    }
    next[idx] = { mode, value: clampSizeValue(newValue, mode) }
    onModeChange(idx, next)
  }
  const handleIndividualValue = (idx, raw) => {
    const next = [...sizes]
    next[idx] = { ...next[idx], value: clampSizeValue(raw, next[idx].mode) }
    onValueChange(idx, next)
  }
  const modeLabels = [SIZE_MODES.FR, SIZE_MODES.PIXEL, SIZE_MODES.PERCENT]
  return (
    <div>
      <h3 className="gg-section-title">{title}</h3>
      <div className="gg-uniform">
        <input
          type="number"
          className="gg-size-input"
          style={{ width: 90 }}
          value={uniformValue}
          step={modes === 'col' ? '' : ''}
          onChange={(e) => onUniformValueChange(Number(e.target.value))}
        />
        <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>统一设置</span>
      </div>
      <div style={{ maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
        {sizes.map((sz, idx) => (
          <div key={idx} className="gg-size-row">
            <span className="gg-size-index">#{idx + 1}</span>
            <input
              type="number"
              className="gg-size-input"
              value={sz.value}
              step={sz.mode === SIZE_MODES.FR ? 0.1 : 1}
              onChange={(e) => handleIndividualValue(idx, e.target.value)}
            />
            <div className="gg-size-mode" style={{ marginBottom: 0, gap: 2 }}>
              {modeLabels.map((m) => (
                <button
                  key={m}
                  className={`gg-mode-btn gg-btn-sm ${sz.mode === m ? 'active' : ''}`}
                  style={{ padding: '3px 4px', fontSize: 10 }}
                  onClick={() => handleIndividualMode(idx, m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AlignSelect({ label, icon, value, options, onChange }) {
  return (
    <div className="gg-field">
      <div className="gg-field-label">
        <span className="gg-icon">{icon}</span>
        {label}
      </div>
      <select className="gg-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.icon} {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function GapSlider({ label, value, onChange }) {
  return (
    <div className="gg-field">
      <div className="gg-slider">
        <span className="gg-field-label" style={{ flex: 0, minWidth: 60 }}>{label}</span>
        <input
          type="range"
          min={MIN_GAP}
          max={MAX_GAP}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="gg-slider-value">{clampGap(value)}px</span>
      </div>
    </div>
  )
}

export default function ConfigPanel({
  rows, cols,
  onRowsChange, onColsChange,
  rowSizes, colSizes,
  onRowSizesChange, onColSizesChange,
  uniformRowValue, uniformColValue,
  onUniformRowValue, onUniformColValue,
  rowGap, colGap,
  onRowGapChange, onColGapChange,
  justifyContent, alignContent, placeItems,
  onJustifyContentChange, onAlignContentChange, onPlaceItemsChange,
}) {
  const handleRows = (v) => onRowsChange(clampRows(v))
  const handleCols = (v) => onColsChange(clampCols(v))
  return (
    <div className="gg-config-panel">
      <div>
        <h3 className="gg-section-title">网格尺寸</h3>
        <NumberStepper value={rows} onChange={handleRows} min={MIN_ROWS} max={MAX_ROWS} label="行数 (Rows)" />
        <NumberStepper value={cols} onChange={handleCols} min={MIN_COLS} max={MAX_COLS} label="列数 (Cols)" />
      </div>
      <div>
        <h3 className="gg-section-title">间距 Gaps</h3>
        <GapSlider label="行间距" value={rowGap} onChange={(v) => onRowGapChange(clampGap(v))} />
        <GapSlider label="列间距" value={colGap} onChange={(v) => onColGapChange(clampGap(v))} />
      </div>
      <SizeList
        title="列宽 Columns"
        sizes={colSizes}
        modes="col"
        uniformValue={uniformColValue}
        onUniformValueChange={onUniformColValue}
        onModeChange={(_, next) => onColSizesChange(next)}
        onValueChange={(_, next) => onColSizesChange(next)}
      />
      <SizeList
        title="行高 Rows"
        sizes={rowSizes}
        modes="row"
        uniformValue={uniformRowValue}
        onUniformValueChange={onUniformRowValue}
        onModeChange={(_, next) => onRowSizesChange(next)}
        onValueChange={(_, next) => onRowSizesChange(next)}
      />
      <div>
        <h3 className="gg-section-title">对齐方式 Alignment</h3>
        <AlignSelect
          label="主轴 justify-content"
          icon="⬌"
          value={justifyContent}
          options={JUSTIFY_CONTENT_OPTIONS}
          onChange={onJustifyContentChange}
        />
        <AlignSelect
          label="交叉轴 align-content"
          icon="≓"
          value={alignContent}
          options={ALIGN_CONTENT_OPTIONS}
          onChange={onAlignContentChange}
        />
        <AlignSelect
          label="单元格 place-items"
          icon="▣"
          value={placeItems}
          options={PLACE_ITEMS_OPTIONS}
          onChange={onPlaceItemsChange}
        />
      </div>
    </div>
  )
}
