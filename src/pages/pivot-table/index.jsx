import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { generateMockData } from './mockData.js'
import {
  FIELD_LABELS,
  NUMERIC_FIELDS,
  ALL_FIELDS,
} from './constants.js'
import {
  AGGREGATIONS,
  AGGREGATION_LABELS,
  buildPivotTable,
  formatValue,
  pivotTableToCSV,
  exportCSV,
  generateExportFilename,
  getDefaultConfig,
  saveConfig,
  loadConfig,
  clearConfig,
  getUniqueValues,
} from './pivotCore.js'

import './pivot-table.css'

const DRAG_TYPE_FIELD = 'application/x-pivot-field'

function PivotTablePage() {
  const navigate = useNavigate()
  const [data] = useState(() => generateMockData(500))
  const [config, setConfig] = useState(() => loadConfig() || getDefaultConfig())
  const [expandedFilters, setExpandedFilters] = useState({})
  const [filterSearch, setFilterSearch] = useState({})
  const [dragOverZone, setDragOverZone] = useState(null)

  useEffect(() => {
    saveConfig(config)
  }, [config])

  const pivotResult = useMemo(() => buildPivotTable(data, config), [data, config])

  const usedFields = useMemo(() => {
    const used = new Set()
    config.rowFields.forEach((f) => used.add(f))
    config.colFields.forEach((f) => used.add(f))
    config.valueFields.forEach((v) => used.add(v.field))
    return used
  }, [config])

  const availableFields = useMemo(
    () => ALL_FIELDS.filter((f) => !usedFields.has(f)),
    [usedFields]
  )

  const handleDragStart = (e, field, source) => {
    e.dataTransfer.setData(DRAG_TYPE_FIELD, JSON.stringify({ field, source }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, zone) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverZone(zone)
  }

  const handleDragLeave = () => {
    setDragOverZone(null)
  }

  const handleDrop = (e, zone) => {
    e.preventDefault()
    setDragOverZone(null)
    try {
      const raw = e.dataTransfer.getData(DRAG_TYPE_FIELD)
      if (!raw) return
      const { field, source } = JSON.parse(raw)
      if (!field) return

      setConfig((prev) => {
        const next = {
          ...prev,
          rowFields: [...prev.rowFields],
          colFields: [...prev.colFields],
          valueFields: [...prev.valueFields],
          filters: { ...prev.filters },
        }

        if (source === 'rows') {
          next.rowFields = next.rowFields.filter((f) => f !== field)
        } else if (source === 'cols') {
          next.colFields = next.colFields.filter((f) => f !== field)
        } else if (source === 'values') {
          next.valueFields = next.valueFields.filter((v) => v.field !== field)
        }

        if (zone === 'rows') {
          if (!next.rowFields.includes(field)) {
            next.rowFields.push(field)
            if (!next.filters[field]) {
              next.filters[field] = [...getUniqueValues(data, field)]
            }
          }
        } else if (zone === 'cols') {
          if (!next.colFields.includes(field)) {
            next.colFields.push(field)
            if (!next.filters[field]) {
              next.filters[field] = [...getUniqueValues(data, field)]
            }
          }
        } else if (zone === 'values') {
          if (!next.valueFields.find((v) => v.field === field)) {
            const defaultAgg = NUMERIC_FIELDS.includes(field)
              ? AGGREGATIONS.SUM
              : AGGREGATIONS.COUNT
            next.valueFields.push({ field, aggregation: defaultAgg })
          }
        }

        return next
      })
    } catch {
      // ignore
    }
  }

  const handleAddField = useCallback((field, zone) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        rowFields: [...prev.rowFields],
        colFields: [...prev.colFields],
        valueFields: [...prev.valueFields],
        filters: { ...prev.filters },
      }

      if (zone === 'rows') {
        if (!next.rowFields.includes(field)) {
          next.rowFields.push(field)
          if (!next.filters[field]) {
            next.filters[field] = [...getUniqueValues(data, field)]
          }
        }
      } else if (zone === 'cols') {
        if (!next.colFields.includes(field)) {
          next.colFields.push(field)
          if (!next.filters[field]) {
            next.filters[field] = [...getUniqueValues(data, field)]
          }
        }
      } else if (zone === 'values') {
        if (!next.valueFields.find((v) => v.field === field)) {
          const defaultAgg = NUMERIC_FIELDS.includes(field)
            ? AGGREGATIONS.SUM
            : AGGREGATIONS.COUNT
          next.valueFields.push({ field, aggregation: defaultAgg })
        }
      }

      return next
    })
  }, [data])

  const handleRemoveRowField = useCallback((field) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        rowFields: prev.rowFields.filter((f) => f !== field),
        filters: { ...prev.filters },
      }
      delete next.filters[field]
      return next
    })
  }, [])

  const handleRemoveColField = useCallback((field) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        colFields: prev.colFields.filter((f) => f !== field),
        filters: { ...prev.filters },
      }
      delete next.filters[field]
      return next
    })
  }, [])

  const handleRemoveValueField = useCallback((field) => {
    setConfig((prev) => ({
      ...prev,
      valueFields: prev.valueFields.filter((v) => v.field !== field),
    }))
  }, [])

  const handleAggregationChange = useCallback((field, aggregation) => {
    setConfig((prev) => ({
      ...prev,
      valueFields: prev.valueFields.map((v) =>
        v.field === field ? { ...v, aggregation } : v
      ),
    }))
  }, [])

  const toggleFilter = useCallback((field) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }, [])

  const handleFilterValueToggle = useCallback((field, value) => {
    setConfig((prev) => {
      const current = prev.filters[field] || []
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return {
        ...prev,
        filters: { ...prev.filters, [field]: next },
      }
    })
  }, [])

  const handleFilterSelectAll = useCallback((field) => {
    setConfig((prev) => ({
      ...prev,
      filters: { ...prev.filters, [field]: [...getUniqueValues(data, field)] },
    }))
  }, [data])

  const handleFilterClear = useCallback((field) => {
    setConfig((prev) => ({
      ...prev,
      filters: { ...prev.filters, [field]: [] },
    }))
  }, [])

  const handleFilterSearchChange = useCallback((field, value) => {
    setFilterSearch((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleExportCSV = useCallback(() => {
    const csv = pivotTableToCSV(pivotResult, FIELD_LABELS)
    const filename = generateExportFilename()
    exportCSV(csv, filename)
  }, [pivotResult])

  const handleReset = useCallback(() => {
    clearConfig()
    setConfig(getDefaultConfig())
    setExpandedFilters({})
    setFilterSearch({})
  }, [])

  return (
    <div className="pt-page">
      <header className="pt-header">
        <div className="pt-header-left">
          <button
            type="button"
            className="pt-back-link"
            onClick={() => navigate('/')}
          >
            ← 返回首页
          </button>
          <h1 className="pt-title">数据透视表</h1>
        </div>
        <div className="pt-header-right">
          <span className="pt-data-info">共 {data.length} 条数据</span>
          <button type="button" className="pt-btn" onClick={handleReset}>
            重置配置
          </button>
          <button
            type="button"
            className="pt-btn pt-btn--primary"
            onClick={handleExportCSV}
            disabled={config.valueFields.length === 0}
          >
            导出 CSV
          </button>
        </div>
      </header>

      <div className="pt-main">
        <aside className="pt-config-panel">
          <div className="pt-config-section">
            <h3 className="pt-config-title">可用字段</h3>
            <div className="pt-field-list">
              {availableFields.map((field) => (
                <div
                  key={field}
                  className="pt-field-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, field, 'available')}
                >
                  <span className="pt-field-name">{FIELD_LABELS[field] || field}</span>
                  <div className="pt-field-add">
                    <button
                      type="button"
                      className="pt-field-add-btn"
                      title="添加到行"
                      onClick={() => handleAddField(field, 'rows')}
                    >
                      行
                    </button>
                    <button
                      type="button"
                      className="pt-field-add-btn"
                      title="添加到列"
                      onClick={() => handleAddField(field, 'cols')}
                    >
                      列
                    </button>
                    <button
                      type="button"
                      className="pt-field-add-btn"
                      title="添加到值"
                      onClick={() => handleAddField(field, 'values')}
                    >
                      Σ
                    </button>
                  </div>
                </div>
              ))}
              {availableFields.length === 0 && (
                <div style={{ color: 'var(--text)', fontSize: '13px' }}>
                  所有字段已配置
                </div>
              )}
            </div>
          </div>

          <div className="pt-config-section">
            <h3 className="pt-config-title">行字段</h3>
            <div
              className={`pt-drop-zone ${dragOverZone === 'rows' ? 'drag-over' : ''} ${config.rowFields.length === 0 ? 'pt-drop-zone--empty' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'rows')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'rows')}
            >
              {config.rowFields.length === 0 && '拖拽字段到此处'}
              {config.rowFields.map((field) => (
                <FieldWithFilter
                  key={field}
                  field={field}
                  source="rows"
                  onDragStart={handleDragStart}
                  onRemove={handleRemoveRowField}
                  isExpanded={!!expandedFilters[field]}
                  onToggleFilter={() => toggleFilter(field)}
                  allValues={getUniqueValues(data, field)}
                  selectedValues={config.filters[field] || []}
                  onValueToggle={(v) => handleFilterValueToggle(field, v)}
                  onSelectAll={() => handleFilterSelectAll(field)}
                  onClear={() => handleFilterClear(field)}
                  searchValue={filterSearch[field] || ''}
                  onSearchChange={(v) => handleFilterSearchChange(field, v)}
                />
              ))}
            </div>
          </div>

          <div className="pt-config-section">
            <h3 className="pt-config-title">列字段</h3>
            <div
              className={`pt-drop-zone ${dragOverZone === 'cols' ? 'drag-over' : ''} ${config.colFields.length === 0 ? 'pt-drop-zone--empty' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'cols')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'cols')}
            >
              {config.colFields.length === 0 && '拖拽字段到此处'}
              {config.colFields.map((field) => (
                <FieldWithFilter
                  key={field}
                  field={field}
                  source="cols"
                  onDragStart={handleDragStart}
                  onRemove={handleRemoveColField}
                  isExpanded={!!expandedFilters[field]}
                  onToggleFilter={() => toggleFilter(field)}
                  allValues={getUniqueValues(data, field)}
                  selectedValues={config.filters[field] || []}
                  onValueToggle={(v) => handleFilterValueToggle(field, v)}
                  onSelectAll={() => handleFilterSelectAll(field)}
                  onClear={() => handleFilterClear(field)}
                  searchValue={filterSearch[field] || ''}
                  onSearchChange={(v) => handleFilterSearchChange(field, v)}
                />
              ))}
            </div>
          </div>

          <div className="pt-config-section">
            <h3 className="pt-config-title">值字段</h3>
            <div
              className={`pt-drop-zone ${dragOverZone === 'values' ? 'drag-over' : ''} ${config.valueFields.length === 0 ? 'pt-drop-zone--empty' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'values')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'values')}
            >
              {config.valueFields.length === 0 && '拖拽字段到此处'}
              {config.valueFields.map((vf) => (
                <div
                  key={vf.field}
                  className="pt-configured-field"
                  draggable
                  onDragStart={(e) => handleDragStart(e, vf.field, 'values')}
                >
                  <span className="pt-configured-field-name">
                    {FIELD_LABELS[vf.field] || vf.field}
                  </span>
                  <select
                    className="pt-agg-select"
                    value={vf.aggregation}
                    onChange={(e) => handleAggregationChange(vf.field, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.values(AGGREGATIONS).map((agg) => (
                      <option key={agg} value={agg}>
                        {AGGREGATION_LABELS[agg]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="pt-remove-btn"
                    title="移除"
                    onClick={() => handleRemoveValueField(vf.field)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="pt-result-panel">
          {config.valueFields.length === 0 ? (
            <div className="pt-empty-state">
              <div className="pt-empty-state-icon">📊</div>
              <div className="pt-empty-state-text">请拖拽字段开始配置透视表</div>
              <div className="pt-empty-state-hint">
                将字段拖入行、列、值区域，即可动态生成交叉汇总表
              </div>
            </div>
          ) : (
            <div className="pt-table-wrapper">
              <PivotTableView result={pivotResult} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function FieldWithFilter({
  field,
  source,
  onDragStart,
  onRemove,
  isExpanded,
  onToggleFilter,
  allValues,
  selectedValues,
  onValueToggle,
  onSelectAll,
  onClear,
  searchValue,
  onSearchChange,
}) {
  const filteredValues = allValues.filter((v) =>
    String(v).toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div>
      <div
        className="pt-configured-field"
        draggable
        onDragStart={(e) => onDragStart(e, field, source)}
      >
        <span className="pt-configured-field-name">
          {FIELD_LABELS[field] || field}
        </span>
        <button
          type="button"
          className={`pt-filter-toggle ${isExpanded ? 'active' : ''}`}
          title="筛选"
          onClick={onToggleFilter}
        >
          🔍
        </button>
        <button
          type="button"
          className="pt-remove-btn"
          title="移除"
          onClick={() => onRemove(field)}
        >
          ×
        </button>
      </div>
      {isExpanded && (
        <div className="pt-filter-panel">
          <input
            type="text"
            className="pt-filter-search"
            placeholder="搜索..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="pt-filter-list">
            {filteredValues.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text)', padding: '4px' }}>
                无匹配结果
              </div>
            )}
            {filteredValues.map((v) => (
              <div key={String(v)} className="pt-filter-item">
                <input
                  type="checkbox"
                  id={`filter-${field}-${v}`}
                  checked={selectedValues.includes(v)}
                  onChange={() => onValueToggle(v)}
                />
                <label htmlFor={`filter-${field}-${v}`}>{String(v)}</label>
              </div>
            ))}
          </div>
          <div className="pt-filter-actions">
            <button
              type="button"
              className="pt-filter-action-btn"
              onClick={onSelectAll}
            >
              全选
            </button>
            <button
              type="button"
              className="pt-filter-action-btn"
              onClick={onClear}
            >
              清空
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PivotTableView({ result }) {
  const {
    rowFields,
    colFields,
    valueFields,
    rowKeys,
    colKeys,
    rowHeaders,
    values,
    rowTotals,
    colTotals,
    grandTotal,
  } = result

  const hasRowFields = rowFields.length > 0
  const hasColFields = colFields.length > 0

  const colHeaderRows = hasColFields ? colFields.length : 1

  const renderColHeaders = () => {
    const rows = []

    if (hasColFields) {
      for (let ci = 0; ci < colFields.length; ci++) {
        const cells = []
        for (let ri = 0; ri < rowFields.length; ri++) {
          cells.push(
            <th key={`rh-${ri}`} className="pt-row-header" rowSpan={colHeaderRows}>
              {FIELD_LABELS[rowFields[ri]] || rowFields[ri]}
            </th>
          )
        }

        const seen = new Set()
        for (let chi = 0; chi < colKeys.length; chi++) {
          const ch = result.colHeaders[chi]
          const key = ch.slice(0, ci + 1).join('|||')
          if (seen.has(key)) continue
          seen.add(key)

          let spanCount = 0
          for (let chj = chi; chj < colKeys.length; chj++) {
            const ch2 = result.colHeaders[chj]
            if (ch2.slice(0, ci + 1).join('|||') === key) {
              spanCount++
            } else {
              break
            }
          }

          const totalCols = valueFields.length
          cells.push(
            <th
              key={`ch-${ci}-${chi}`}
              colSpan={spanCount * totalCols}
              style={{ textAlign: 'center' }}
            >
              {FIELD_LABELS[colFields[ci]] || colFields[ci]}: {ch[ci]}
            </th>
          )
        }

        cells.push(
          <th
            key={`ch-total-${ci}`}
            className="pt-total-cell"
            colSpan={valueFields.length}
            rowSpan={ci === colFields.length - 1 ? 1 : colHeaderRows - ci}
            style={{ textAlign: 'center' }}
          >
            合计
          </th>
        )

        rows.push(<tr key={`ch-row-${ci}`}>{cells}</tr>)
      }

      const subCells = []
      for (let chi = 0; chi < colKeys.length; chi++) {
        for (const vf of valueFields) {
          const label = valueFields.length > 1
            ? `${FIELD_LABELS[vf.field] || vf.field}(${AGGREGATION_LABELS[vf.aggregation]})`
            : AGGREGATION_LABELS[vf.aggregation]
          subCells.push(
            <th key={`sub-${chi}-${vf.field}`} style={{ fontWeight: 500 }}>
              {label}
            </th>
          )
        }
      }
      for (const vf of valueFields) {
        const label = valueFields.length > 1
          ? `${FIELD_LABELS[vf.field] || vf.field}(${AGGREGATION_LABELS[vf.aggregation]})`
          : AGGREGATION_LABELS[vf.aggregation]
        subCells.push(
          <th key={`sub-total-${vf.field}`} className="pt-total-cell" style={{ fontWeight: 500 }}>
            {label}
          </th>
        )
      }
      rows.push(<tr key={`ch-row-sub`}>{subCells}</tr>)
    } else {
      const cells = []
      for (const rf of rowFields) {
        cells.push(
          <th key={`rh-${rf}`} className="pt-row-header">
            {FIELD_LABELS[rf] || rf}
          </th>
        )
      }
      for (const vf of valueFields) {
        cells.push(
          <th key={`vh-${vf.field}`}>
            {FIELD_LABELS[vf.field] || vf.field} ({AGGREGATION_LABELS[vf.aggregation]})
          </th>
        )
      }
      cells.push(
        <th key="vh-total" className="pt-total-cell">
          合计
        </th>
      )
      rows.push(<tr key="ch-row-single">{cells}</tr>)
    }

    return rows
  }

  const renderDataRows = () => {
    return rowKeys.map((rk, ri) => {
      const rh = rowHeaders[ri]
      const cells = []

      for (let rfi = 0; rfi < rowFields.length; rfi++) {
        let showValue = true
        if (rfi > 0) {
          const prevRh = rowHeaders[ri - 1]
          if (prevRh && rh.slice(0, rfi).join('|||') === prevRh.slice(0, rfi).join('|||')) {
            showValue = false
          }
        }
        if (showValue) {
          let rowSpan = 1
          for (let rj = ri + 1; rj < rowKeys.length; rj++) {
            const rh2 = rowHeaders[rj]
            if (rh2.slice(0, rfi + 1).join('|||') === rh.slice(0, rfi + 1).join('|||')) {
              rowSpan++
            } else {
              break
            }
          }
          cells.push(
            <td
              key={`row-${rk}-${rfi}`}
              className="pt-row-header"
              rowSpan={rowSpan}
            >
              {rh[rfi]}
            </td>
          )
        }
      }

      const actualColKeys = hasColFields ? colKeys : ['__all__']
      for (const ck of actualColKeys) {
        const key = `${rk}__${ck}`
        for (const vf of valueFields) {
          cells.push(
            <td key={`cell-${key}-${vf.field}`} className="pt-num-cell">
              {formatValue(values[key]?.[vf.field], vf.aggregation)}
            </td>
          )
        }
      }

      for (const vf of valueFields) {
        cells.push(
          <td key={`row-total-${rk}-${vf.field}`} className="pt-num-cell pt-total-cell">
            {formatValue(rowTotals[rk]?.[vf.field], vf.aggregation)}
          </td>
        )
      }

      return <tr key={`row-${rk}`}>{cells}</tr>
    })
  }

  const renderTotalRow = () => {
    const cells = []
    for (let rfi = 0; rfi < rowFields.length; rfi++) {
      cells.push(
        <td
          key={`total-rh-${rfi}`}
          className={`pt-row-header pt-total-cell ${rfi === rowFields.length - 1 ? '' : ''}`}
        >
          {rfi === rowFields.length - 1 ? '合计' : ''}
        </td>
      )
    }

    const actualColKeys = hasColFields ? colKeys : ['__all__']
    for (const ck of actualColKeys) {
      for (const vf of valueFields) {
        cells.push(
          <td key={`col-total-${ck}-${vf.field}`} className="pt-num-cell pt-total-cell">
            {formatValue(colTotals[ck]?.[vf.field], vf.aggregation)}
          </td>
        )
      }
    }

    for (const vf of valueFields) {
      cells.push(
        <td key={`grand-total-${vf.field}`} className="pt-num-cell pt-total-cell">
          {formatValue(grandTotal[vf.field], vf.aggregation)}
        </td>
      )
    }

    return <tr className="pt-total-row">{cells}</tr>
  }

  return (
    <table className="pt-table">
      <thead>{renderColHeaders()}</thead>
      <tbody>
        {renderDataRows()}
        {renderTotalRow()}
      </tbody>
    </table>
  )
}

export default PivotTablePage
