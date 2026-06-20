import { useState, useEffect, useCallback } from 'react'
import './grid-generator.css'
import {
  createInitialConfig,
  resizeGrid,
  applySpanChange,
  updateCellProperty,
  setUniformRowMode,
  setUniformColMode,
  setUniformRowValues,
  setUniformColValues,
  clearAllCellColors,
  randomizeCellColors,
  clampSizeValue,
  serializeConfig,
} from './gridGeneratorCore.js'
import {
  loadLayouts,
  saveLayouts,
  persistLayout,
  loadLayoutById,
  deleteLayout,
  importLayoutFromJSON,
  exportLayoutToJSON,
} from './storage.js'
import ConfigPanel from './ConfigPanel.jsx'
import GridCanvas from './GridCanvas.jsx'
import PropertyPanel from './PropertyPanel.jsx'
import CodeOutput from './CodeOutput.jsx'
import StorageModal from './StorageModal.jsx'

function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [message, onDone])
  if (!message) return null
  return <div className="gg-toast">{message}</div>
}

export default function GridGeneratorPage() {
  const [config, setConfig] = useState(() => createInitialConfig())
  const [selectedCellId, setSelectedCellId] = useState(null)
  const [layouts, setLayouts] = useState(() => loadLayouts())
  const [modalMode, setModalMode] = useState(null)
  const [toast, setToast] = useState('')
  const [uniformRowValue, setUniformRowValue] = useState(1)
  const [uniformColValue, setUniformColValue] = useState(1)

  const showToast = useCallback((m) => setToast(m), [])

  const handleRowsChange = useCallback((rows) => {
    setConfig((prev) => resizeGrid(prev, rows, prev.cols))
    setSelectedCellId(null)
  }, [])

  const handleColsChange = useCallback((cols) => {
    setConfig((prev) => resizeGrid(prev, prev.rows, cols))
    setSelectedCellId(null)
  }, [])

  const handleRowSizesChange = useCallback((next) => {
    setConfig((prev) => ({ ...prev, rowSizes: next }))
  }, [])

  const handleColSizesChange = useCallback((next) => {
    setConfig((prev) => ({ ...prev, colSizes: next }))
  }, [])

  const handleUniformRowValue = useCallback((v) => {
    setUniformRowValue(v)
    setConfig((prev) => ({
      ...prev,
      rowSizes: setUniformRowValues(prev.rowSizes, v),
    }))
  }, [])

  const handleUniformColValue = useCallback((v) => {
    setUniformColValue(v)
    setConfig((prev) => ({
      ...prev,
      colSizes: setUniformColValues(prev.colSizes, v),
    }))
  }, [])

  const handleRowMode = useCallback((mode) => {
    setConfig((prev) => ({ ...prev, rowSizes: setUniformRowMode(prev.rowSizes, mode) }))
  }, [])

  const handleColMode = useCallback((mode) => {
    setConfig((prev) => ({ ...prev, colSizes: setUniformColMode(prev.colSizes, mode) }))
  }, [])

  const handleSpanChange = useCallback((cellId, colSpan, rowSpan) => {
    setConfig((prev) => ({
      ...prev,
      cells: applySpanChange(prev.cells, cellId, colSpan, rowSpan),
    }))
  }, [])

  const handlePropertyChange = useCallback((cellId, prop, value) => {
    setConfig((prev) => ({
      ...prev,
      cells: updateCellProperty(prev.cells, cellId, prop, value),
    }))
  }, [])

  const handleCellColorChange = useCallback((cellId, color) => {
    setConfig((prev) => ({
      ...prev,
      cells: updateCellProperty(prev.cells, cellId, 'backgroundColor', color),
    }))
  }, [])

  const handleClearAllColors = useCallback(() => {
    setConfig((prev) => ({ ...prev, cells: clearAllCellColors(prev.cells) }))
    showToast('已清除所有颜色')
  }, [showToast])

  const handleRandomizeColors = useCallback(() => {
    setConfig((prev) => ({ ...prev, cells: randomizeCellColors(prev.cells) }))
    showToast('已随机着色')
  }, [showToast])

  const handleSave = useCallback((name) => {
    const result = persistLayout(layouts, config, null, name)
    if (result.wasAdded) {
      setLayouts(result.layouts)
      showToast(`已保存：${name}`)
    }
  }, [layouts, config, showToast])

  const handleLoad = useCallback((id) => {
    const layout = loadLayoutById(layouts, id)
    if (layout) {
      setConfig(layout.config)
      setSelectedCellId(null)
      showToast(`已加载：${layout.name}`)
    }
  }, [layouts, showToast])

  const handleDelete = useCallback((id) => {
    const next = deleteLayout(layouts, id)
    setLayouts(next)
    saveLayouts(next)
    showToast('已删除')
  }, [layouts, showToast])

  const handleImport = useCallback((jsonString) => {
    const result = importLayoutFromJSON(jsonString)
    if (!result.success) {
      showToast('导入失败：' + result.error)
      return
    }
    const next = [result.entry, ...layouts]
    setLayouts(next)
    saveLayouts(next)
    setConfig(result.entry.config)
    setSelectedCellId(null)
    showToast(`已导入：${result.entry.name}`)
  }, [layouts, showToast])

  const handleExport = useCallback((entry) => {
    const json = exportLayoutToJSON(entry)
    if (!json) return
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entry.name || 'grid-layout'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`已导出：${entry.name}`)
  }, [showToast])

  const handleExportCurrent = useCallback(() => {
    const json = serializeConfig(config, '当前布局')
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grid-layout.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('已导出 JSON 文件')
  }, [config, showToast])

  const handleImportError = useCallback((msg) => {
    showToast(msg)
  }, [showToast])

  return (
    <div className="grid-generator-page">
      <div className="gg-header">
        <h1>🎨 CSS Grid 布局生成器</h1>
        <div className="gg-toolbar">
          <button className="gg-btn" onClick={() => setModalMode('save')}>
            💾 保存布局
          </button>
          <button className="gg-btn" onClick={() => setModalMode('load')}>
            📂 加载布局
          </button>
          <button className="gg-btn" onClick={() => setModalMode('import')}>
            ⬆ 导入 JSON
          </button>
          <button className="gg-btn gg-btn-primary" onClick={handleExportCurrent}>
            ⬇ 导出 JSON
          </button>
        </div>
      </div>

      <div className="gg-main">
        <ConfigPanel
          rows={config.rows}
          cols={config.cols}
          onRowsChange={handleRowsChange}
          onColsChange={handleColsChange}
          rowSizes={config.rowSizes}
          colSizes={config.colSizes}
          onRowSizesChange={handleRowSizesChange}
          onColSizesChange={handleColSizesChange}
          uniformRowValue={uniformRowValue}
          uniformColValue={uniformColValue}
          onUniformRowValue={handleUniformRowValue}
          onUniformColValue={handleUniformColValue}
          rowGap={config.rowGap}
          colGap={config.colGap}
          onRowGapChange={(v) => setConfig((p) => ({ ...p, rowGap: v }))}
          onColGapChange={(v) => setConfig((p) => ({ ...p, colGap: v }))}
          justifyContent={config.justifyContent}
          alignContent={config.alignContent}
          placeItems={config.placeItems}
          onJustifyContentChange={(v) => setConfig((p) => ({ ...p, justifyContent: v }))}
          onAlignContentChange={(v) => setConfig((p) => ({ ...p, alignContent: v }))}
          onPlaceItemsChange={(v) => setConfig((p) => ({ ...p, placeItems: v }))}
        />

        <GridCanvas
          config={config}
          selectedCellId={selectedCellId}
          onSelectCell={setSelectedCellId}
          onCellColorChange={handleCellColorChange}
          onClearAllColors={handleClearAllColors}
          onRandomizeColors={handleRandomizeColors}
        />

        <PropertyPanel
          config={config}
          selectedCellId={selectedCellId}
          onSpanChange={handleSpanChange}
          onPropertyChange={handlePropertyChange}
          onColorChange={handleCellColorChange}
        />

        <CodeOutput
          config={config}
          onCopySuccess={showToast}
        />
      </div>

      {modalMode && (
        <StorageModal
          mode={modalMode}
          layouts={layouts}
          currentConfig={config}
          onClose={() => setModalMode(null)}
          onSave={handleSave}
          onLoad={handleLoad}
          onDelete={handleDelete}
          onImport={handleImport}
          onExport={handleExport}
          onError={handleImportError}
        />
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
