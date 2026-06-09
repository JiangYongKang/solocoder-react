export const AGGREGATIONS = {
  COUNT: 'count',
  SUM: 'sum',
  AVG: 'avg',
  MAX: 'max',
  MIN: 'min',
}

export const AGGREGATION_LABELS = {
  [AGGREGATIONS.COUNT]: '计数',
  [AGGREGATIONS.SUM]: '求和',
  [AGGREGATIONS.AVG]: '平均值',
  [AGGREGATIONS.MAX]: '最大值',
  [AGGREGATIONS.MIN]: '最小值',
}

export const STORAGE_KEY = 'pivot_table_config_v1'

const toNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return val
  const n = parseFloat(String(val))
  return isNaN(n) ? 0 : n
}

export const aggregate = (values, aggregation) => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0
  }

  switch (aggregation) {
    case AGGREGATIONS.COUNT:
      return values.length
    case AGGREGATIONS.SUM:
      return values.reduce((sum, v) => sum + toNumber(v), 0)
    case AGGREGATIONS.AVG: {
      const nums = values.filter((v) => v !== '' && v !== null && v !== undefined && !isNaN(parseFloat(v)))
      if (nums.length === 0) return 0
      return nums.reduce((sum, v) => sum + toNumber(v), 0) / nums.length
    }
    case AGGREGATIONS.MAX: {
      const nums = values.map(toNumber)
      if (nums.length === 0) return 0
      return Math.max(...nums)
    }
    case AGGREGATIONS.MIN: {
      const nums = values.map(toNumber)
      if (nums.length === 0) return 0
      return Math.min(...nums)
    }
    default:
      return null
  }
}

export const getUniqueValues = (data, field) => {
  if (!Array.isArray(data) || !field) return []
  const set = new Set()
  for (const row of data) {
    if (row && field in row) {
      set.add(row[field])
    }
  }
  return [...set].sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b
    return String(a).localeCompare(String(b), 'zh-CN')
  })
}

export const getFields = (data) => {
  if (!Array.isArray(data) || data.length === 0) return []
  const firstRow = data[0]
  return Object.keys(firstRow)
}

export const filterData = (data, filters) => {
  if (!Array.isArray(data)) return []
  if (!filters || Object.keys(filters).length === 0) return [...data]

  return data.filter((row) => {
    for (const [field, selectedValues] of Object.entries(filters)) {
      if (!selectedValues) continue
      if (!Array.isArray(selectedValues)) continue
      if (selectedValues.length === 0) continue
      if (!selectedValues.includes(row[field])) {
        return false
      }
    }
    return true
  })
}

const getRowKey = (row, rowFields) => {
  return rowFields.map((f) => (row[f] === undefined ? '' : String(row[f]))).join('|||')
}

const getColKey = (row, colFields) => {
  return colFields.map((f) => (row[f] === undefined ? '' : String(row[f]))).join('|||')
}

const getAllKeys = (data, fields) => {
  if (!fields || fields.length === 0) return ['__all__']
  const set = new Set()
  for (const row of data) {
    set.add(getRowKey(row, fields))
  }
  return [...set].sort()
}

export const parseKey = (key) => {
  if (key === '__all__') return []
  return key.split('|||')
}

export const buildPivotTable = (data, config) => {
  const { rowFields = [], colFields = [], valueFields = [], filters = {} } = config

  const filteredData = filterData(data, filters)

  const rowKeys = getAllKeys(filteredData, rowFields)
  const colKeys = getAllKeys(filteredData, colFields)

  const cells = {}

  for (const row of filteredData) {
    const rk = rowFields.length > 0 ? getRowKey(row, rowFields) : '__all__'
    const ck = colFields.length > 0 ? getColKey(row, colFields) : '__all__'

    const key = `${rk}__${ck}`
    if (!cells[key]) {
      cells[key] = {}
      for (const vf of valueFields) {
        cells[key][vf.field] = []
      }
    }

    for (const vf of valueFields) {
      cells[key][vf.field].push(row[vf.field])
    }
  }

  const result = {
    rowFields,
    colFields,
    valueFields,
    rowKeys,
    colKeys,
    rowHeaders: rowKeys.map((k) => parseKey(k)),
    colHeaders: colKeys.map((k) => parseKey(k)),
    values: {},
    rowTotals: {},
    colTotals: {},
    grandTotal: {},
  }

  for (const rk of rowKeys) {
    for (const ck of colKeys) {
      const key = `${rk}__${ck}`
      result.values[`${rk}__${ck}`] = {}
      for (const vf of valueFields) {
        const vals = cells[key]?.[vf.field] || []
        result.values[`${rk}__${ck}`][vf.field] = aggregate(vals, vf.aggregation)
      }
    }
  }

  for (const rk of rowKeys) {
    result.rowTotals[rk] = {}
    for (const vf of valueFields) {
      const allVals = []
      for (const ck of colKeys) {
        const key = `${rk}__${ck}`
        const vals = cells[key]?.[vf.field] || []
        allVals.push(...vals)
      }
      result.rowTotals[rk][vf.field] = aggregate(allVals, vf.aggregation)
    }
  }

  for (const ck of colKeys) {
    result.colTotals[ck] = {}
    for (const vf of valueFields) {
      const allVals = []
      for (const rk of rowKeys) {
        const key = `${rk}__${ck}`
        const vals = cells[key]?.[vf.field] || []
        allVals.push(...vals)
      }
      result.colTotals[ck][vf.field] = aggregate(allVals, vf.aggregation)
    }
  }

  for (const vf of valueFields) {
    const allVals = []
    for (const rk of rowKeys) {
      for (const ck of colKeys) {
        const key = `${rk}__${ck}`
        const vals = cells[key]?.[vf.field] || []
        allVals.push(...vals)
      }
    }
    result.grandTotal[vf.field] = aggregate(allVals, vf.aggregation)
  }

  return result
}

export const formatValue = (value, aggregation) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    if (aggregation === AGGREGATIONS.AVG) {
      return value.toFixed(2)
    }
    if (Number.isInteger(value)) {
      return value.toLocaleString('zh-CN')
    }
    return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }
  return String(value)
}

const escapeCSVField = (field) => {
  const str = String(field ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export const pivotTableToCSV = (pivotResult, fieldLabels = {}) => {
  if (!pivotResult) return ''

  const { rowFields, colFields, valueFields, rowKeys, colKeys, rowHeaders, colHeaders, values, rowTotals, colTotals, grandTotal } = pivotResult

  const lines = []

  const hasRowFields = rowFields.length > 0
  const hasColFields = colFields.length > 0
  const hasValueFields = valueFields.length > 0

  if (hasColFields) {
    let header1 = []
    if (hasRowFields) {
      for (let i = 0; i < rowFields.length; i++) header1.push('')
    }

    for (let ci = 0; ci < colFields.length; ci++) {
      const cf = colFields[ci]
      for (const ch of colHeaders) {
        header1.push(fieldLabels[cf] || cf)
        if (hasValueFields && ci === colFields.length - 1) {
          for (let vi = 1; vi < valueFields.length; vi++) {
            header1.push('')
          }
        }
      }
    }
    if (hasValueFields) {
      header1.push('合计')
      for (let vi = 1; vi < valueFields.length; vi++) {
        header1.push('')
      }
    }
    lines.push(header1.map(escapeCSVField).join(','))

    let header2 = []
    if (hasRowFields) {
      for (let i = 0; i < rowFields.length; i++) header2.push('')
    }
    for (const ch of colHeaders) {
      for (const vf of valueFields) {
        const colLabel = ch.length > 0 ? ch[ch.length - 1] : '全部'
        const vfLabel = fieldLabels[vf.field] || vf.field
        const aggLabel = AGGREGATION_LABELS[vf.aggregation] || vf.aggregation
        if (valueFields.length === 1) {
          header2.push(colLabel)
        } else {
          header2.push(`${colLabel}-${vfLabel}(${aggLabel})`)
        }
      }
    }
    if (hasValueFields) {
      for (const vf of valueFields) {
        const vfLabel = fieldLabels[vf.field] || vf.field
        const aggLabel = AGGREGATION_LABELS[vf.aggregation] || vf.aggregation
        if (valueFields.length === 1) {
          header2.push('合计')
        } else {
          header2.push(`合计-${vfLabel}(${aggLabel})`)
        }
      }
    }
    lines.push(header2.map(escapeCSVField).join(','))
  } else {
    let header = []
    if (hasRowFields) {
      for (const rf of rowFields) {
        header.push(fieldLabels[rf] || rf)
      }
    }
    if (hasValueFields) {
      for (const vf of valueFields) {
        const vfLabel = fieldLabels[vf.field] || vf.field
        const aggLabel = AGGREGATION_LABELS[vf.aggregation] || vf.aggregation
        header.push(`${vfLabel}(${aggLabel})`)
      }
    }
    lines.push(header.map(escapeCSVField).join(','))
  }

  for (let ri = 0; ri < rowKeys.length; ri++) {
    const rk = rowKeys[ri]
    const rh = rowHeaders[ri]
    const row = []

    if (hasRowFields) {
      for (const v of rh) row.push(v)
    }

    if (hasColFields) {
      for (const ck of colKeys) {
        const key = `${rk}__${ck}`
        for (const vf of valueFields) {
          row.push(formatValue(values[key]?.[vf.field], vf.aggregation))
        }
      }
      if (hasValueFields) {
        for (const vf of valueFields) {
          row.push(formatValue(rowTotals[rk]?.[vf.field], vf.aggregation))
        }
      }
    } else {
      if (hasValueFields) {
        for (const vf of valueFields) {
          row.push(formatValue(rowTotals[rk]?.[vf.field], vf.aggregation))
        }
      }
    }

    lines.push(row.map(escapeCSVField).join(','))
  }

  if (hasColFields || hasValueFields) {
    const totalRow = []
    if (hasRowFields) {
      for (let i = 0; i < rowFields.length - 1; i++) totalRow.push('')
      totalRow.push('合计')
    }

    if (hasColFields) {
      for (const ck of colKeys) {
        for (const vf of valueFields) {
          totalRow.push(formatValue(colTotals[ck]?.[vf.field], vf.aggregation))
        }
      }
      if (hasValueFields) {
        for (const vf of valueFields) {
          totalRow.push(formatValue(grandTotal[vf.field], vf.aggregation))
        }
      }
    } else {
      if (hasValueFields) {
        for (const vf of valueFields) {
          totalRow.push(formatValue(grandTotal[vf.field], vf.aggregation))
        }
      }
    }

    lines.push(totalRow.map(escapeCSVField).join(','))
  }

  return lines.join('\n')
}

export const exportCSV = (csvContent, filename) => {
  if (typeof document === 'undefined' || typeof Blob === 'undefined') return false
  try {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export const generateExportFilename = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `pivot_table_${ts}.csv`
}

export const getDefaultConfig = () => ({
  rowFields: [],
  colFields: [],
  valueFields: [],
  filters: {},
})

export const saveConfig = (config, storage) => {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  if (!store) return false
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

export const loadConfig = (storage) => {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  if (!store) return null
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const def = getDefaultConfig()
    return {
      rowFields: Array.isArray(parsed.rowFields) ? parsed.rowFields : def.rowFields,
      colFields: Array.isArray(parsed.colFields) ? parsed.colFields : def.colFields,
      valueFields: Array.isArray(parsed.valueFields) ? parsed.valueFields : def.valueFields,
      filters: parsed.filters && typeof parsed.filters === 'object' ? parsed.filters : def.filters,
    }
  } catch {
    return null
  }
}

export const clearConfig = (storage) => {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  if (!store) return false
  try {
    store.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export const isSameArray = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}
