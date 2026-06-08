export const FIELD_TYPES = {
  INT: 'INT',
  VARCHAR: 'VARCHAR',
  TEXT: 'TEXT',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  FLOAT: 'FLOAT',
  DECIMAL: 'DECIMAL',
}

export const FIELD_TYPE_LABELS = {
  [FIELD_TYPES.INT]: 'INT',
  [FIELD_TYPES.VARCHAR]: 'VARCHAR',
  [FIELD_TYPES.TEXT]: 'TEXT',
  [FIELD_TYPES.BOOLEAN]: 'BOOLEAN',
  [FIELD_TYPES.DATE]: 'DATE',
  [FIELD_TYPES.FLOAT]: 'FLOAT',
  [FIELD_TYPES.DECIMAL]: 'DECIMAL',
}

export const TABLE_TEMPLATES = [
  {
    id: 'user',
    name: '用户表',
    fields: [
      { name: 'username', type: FIELD_TYPES.VARCHAR, primaryKey: false, nullable: false, defaultValue: '' },
      { name: 'email', type: FIELD_TYPES.VARCHAR, primaryKey: false, nullable: false, defaultValue: '' },
      { name: 'password_hash', type: FIELD_TYPES.VARCHAR, primaryKey: false, nullable: false, defaultValue: '' },
      { name: 'created_at', type: FIELD_TYPES.DATE, primaryKey: false, nullable: true, defaultValue: '' },
    ],
  },
  {
    id: 'product',
    name: '商品表',
    fields: [
      { name: 'name', type: FIELD_TYPES.VARCHAR, primaryKey: false, nullable: false, defaultValue: '' },
      { name: 'price', type: FIELD_TYPES.DECIMAL, primaryKey: false, nullable: false, defaultValue: '0.00' },
      { name: 'stock', type: FIELD_TYPES.INT, primaryKey: false, nullable: false, defaultValue: '0' },
      { name: 'description', type: FIELD_TYPES.TEXT, primaryKey: false, nullable: true, defaultValue: '' },
    ],
  },
  {
    id: 'order',
    name: '订单表',
    fields: [
      { name: 'order_no', type: FIELD_TYPES.VARCHAR, primaryKey: false, nullable: false, defaultValue: '' },
      { name: 'total_amount', type: FIELD_TYPES.DECIMAL, primaryKey: false, nullable: false, defaultValue: '0.00' },
      { name: 'status', type: FIELD_TYPES.INT, primaryKey: false, nullable: false, defaultValue: '0' },
      { name: 'created_at', type: FIELD_TYPES.DATE, primaryKey: false, nullable: true, defaultValue: '' },
    ],
  },
]

export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 2.0

export const TABLE_WIDTH = 260
export const TABLE_HEADER_HEIGHT = 44
export const FIELD_ROW_HEIGHT = 36

const STORAGE_KEY = 'db-designer-state'
let idCounter = 0

export function generateId(prefix = 'id') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createField(overrides = {}) {
  return {
    id: generateId('field'),
    name: overrides.name || 'new_field',
    type: overrides.type || FIELD_TYPES.INT,
    primaryKey: overrides.primaryKey || false,
    nullable: overrides.primaryKey ? false : (overrides.nullable ?? true),
    defaultValue: overrides.defaultValue || '',
  }
}

export function createTable(name = 'new_table', x = 100, y = 100) {
  return {
    id: generateId('table'),
    name,
    x,
    y,
    fields: [
      {
        ...createField({ name: 'id', type: FIELD_TYPES.INT, primaryKey: true, nullable: false, defaultValue: '' }),
      },
    ],
  }
}

export function createTableFromTemplate(template, x = 100, y = 100) {
  const table = createTable(template.name || 'new_table', x, y)
  const extraFields = (template.fields || []).map((f) => createField(f))
  return {
    ...table,
    fields: [...table.fields, ...extraFields],
  }
}

export function updateTable(tables, tableId, updates) {
  if (!Array.isArray(tables)) return []
  return tables.map((t) => (t.id === tableId ? { ...t, ...updates } : t))
}

export function deleteTable(tables, tableId) {
  if (!Array.isArray(tables)) return []
  return tables.filter((t) => t.id !== tableId)
}

export function getTableById(tables, tableId) {
  if (!Array.isArray(tables)) return null
  return tables.find((t) => t.id === tableId) || null
}

export function addField(table, fieldData = {}) {
  if (!table) return table
  const newField = createField(fieldData)
  return {
    ...table,
    fields: [...(table.fields || []), newField],
  }
}

export function updateField(table, fieldId, updates) {
  if (!table || !Array.isArray(table.fields)) return table
  const newFields = table.fields.map((f) => {
    if (f.id !== fieldId) return f
    const merged = { ...f, ...updates }
    if (merged.primaryKey) {
      merged.nullable = false
    }
    return merged
  })
  return { ...table, fields: newFields }
}

export function deleteField(table, fieldId) {
  if (!table || !Array.isArray(table.fields)) return table
  return {
    ...table,
    fields: table.fields.filter((f) => f.id !== fieldId),
  }
}

export function reorderFields(table, fromIndex, toIndex) {
  if (!table || !Array.isArray(table.fields)) return table
  if (fromIndex < 0 || fromIndex >= table.fields.length) return table
  if (toIndex < 0 || toIndex >= table.fields.length) return table
  if (fromIndex === toIndex) return table

  const result = [...table.fields]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return { ...table, fields: result }
}

export function getFieldById(table, fieldId) {
  if (!table || !Array.isArray(table.fields)) return null
  return table.fields.find((f) => f.id === fieldId) || null
}

export function getPrimaryKeys(table) {
  if (!table || !Array.isArray(table.fields)) return []
  return table.fields.filter((f) => f.primaryKey)
}

export function isPrimaryKeyField(table, fieldId) {
  const field = getFieldById(table, fieldId)
  return field ? field.primaryKey : false
}

export function createRelation(fromTableId, fromFieldId, toTableId, toFieldId) {
  return {
    id: generateId('rel'),
    fromTableId,
    fromFieldId,
    toTableId,
    toFieldId,
  }
}

export function updateRelation(relations, relationId, updates) {
  if (!Array.isArray(relations)) return []
  return relations.map((r) => (r.id === relationId ? { ...r, ...updates } : r))
}

export function deleteRelation(relations, relationId) {
  if (!Array.isArray(relations)) return []
  return relations.filter((r) => r.id !== relationId)
}

export function deleteRelationsByTableId(relations, tableId) {
  if (!Array.isArray(relations)) return []
  return relations.filter((r) => r.fromTableId !== tableId && r.toTableId !== tableId)
}

export function deleteRelationsByFieldId(relations, fieldId) {
  if (!Array.isArray(relations)) return []
  return relations.filter((r) => r.fromFieldId !== fieldId && r.toFieldId !== fieldId)
}

export function getRelationsByTableId(relations, tableId) {
  if (!Array.isArray(relations)) return []
  return relations.filter((r) => r.fromTableId === tableId || r.toTableId === tableId)
}

export function getRelationById(relations, relationId) {
  if (!Array.isArray(relations)) return null
  return relations.find((r) => r.id === relationId) || null
}

export function validateRelation(tables, relations, fromTableId, fromFieldId, toTableId, toFieldId) {
  if (!fromTableId || !fromFieldId || !toTableId || !toFieldId) {
    return { valid: false, error: '缺少必要的连线参数' }
  }
  if (fromTableId === toTableId) {
    return { valid: false, error: '不能连接同一表的字段' }
  }
  const fromTable = getTableById(tables, fromTableId)
  const toTable = getTableById(tables, toTableId)
  if (!fromTable || !toTable) {
    return { valid: false, error: '表不存在' }
  }
  const fromField = getFieldById(fromTable, fromFieldId)
  const toField = getFieldById(toTable, toFieldId)
  if (!fromField || !toField) {
    return { valid: false, error: '字段不存在' }
  }
  if (!toField.primaryKey) {
    return { valid: false, error: '目标字段必须是主键' }
  }
  const exists = relations.some(
    (r) =>
      r.fromTableId === fromTableId &&
      r.fromFieldId === fromFieldId &&
      r.toTableId === toTableId &&
      r.toFieldId === toFieldId
  )
  if (exists) {
    return { valid: false, error: '关系已存在' }
  }
  return { valid: true }
}

export function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
}

export function screenToWorld(screenX, screenY, panX, panY, zoom) {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  }
}

export function worldToScreen(worldX, worldY, panX, panY, zoom) {
  return {
    x: worldX * zoom + panX,
    y: worldY * zoom + panY,
  }
}

export function getTableHeight(table) {
  if (!table || !Array.isArray(table.fields)) return TABLE_HEADER_HEIGHT
  return TABLE_HEADER_HEIGHT + table.fields.length * FIELD_ROW_HEIGHT
}

export function getFieldAnchor(table, fieldId, side = 'right') {
  if (!table || !Array.isArray(table.fields)) return { x: 0, y: 0 }
  const idx = table.fields.findIndex((f) => f.id === fieldId)
  if (idx === -1) return { x: 0, y: 0 }
  const y = table.y + TABLE_HEADER_HEIGHT + idx * FIELD_ROW_HEIGHT + FIELD_ROW_HEIGHT / 2
  const x = side === 'right' ? table.x + TABLE_WIDTH : table.x
  return { x, y }
}

export function buildBezierPath(from, to) {
  const dx = Math.max(Math.abs(to.x - from.x) * 0.5, 60)
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
}

function escapeSqlIdentifier(name) {
  if (!name) return ''
  return String(name).replace(/"/g, '""')
}

function escapeSqlValue(value) {
  if (value === null || value === undefined || value === '') return ''
  return String(value).replace(/'/g, "''")
}

function fieldToSql(field) {
  if (!field) return ''
  const parts = [`"${escapeSqlIdentifier(field.name)}"`, field.type]
  if (field.primaryKey) {
    parts.push('PRIMARY KEY')
  }
  if (!field.nullable && !field.primaryKey) {
    parts.push('NOT NULL')
  }
  if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '') {
    parts.push(`DEFAULT '${escapeSqlValue(field.defaultValue)}'`)
  }
  return parts.join(' ')
}

export function generateTableDDL(table, allTables = [], relations = []) {
  if (!table) return ''
  const lines = [`CREATE TABLE "${escapeSqlIdentifier(table.name)}" (`]
  const fieldLines = (table.fields || []).map((f) => `  ${fieldToSql(f)}`)

  const tableMap = new Map()
  allTables.forEach((t) => tableMap.set(t.id, t))

  const tableRelations = relations.filter((r) => r.fromTableId === table.id)
  const fkLines = tableRelations
    .map((r) => {
      const fromField = getFieldById(table, r.fromFieldId)
      const toTable = tableMap.get(r.toTableId)
      const toField = toTable ? getFieldById(toTable, r.toFieldId) : null
      if (!fromField || !toTable || !toField) return null
      return `  FOREIGN KEY ("${escapeSqlIdentifier(fromField.name)}") REFERENCES "${escapeSqlIdentifier(toTable.name)}" ("${escapeSqlIdentifier(toField.name)}")`
    })
    .filter(Boolean)

  const allLines = [...fieldLines, ...fkLines]
  lines.push(allLines.join(',\n'))
  lines.push(');')
  return lines.join('\n')
}

export function generateFullDDL(tables, relations) {
  if (!Array.isArray(tables) || tables.length === 0) return ''

  const processed = new Set()
  const result = []
  const tableMap = new Map()
  tables.forEach((t) => tableMap.set(t.id, t))

  const renderTable = (table) => {
    if (processed.has(table.id)) return
    processed.add(table.id)

    const lines = [`CREATE TABLE "${escapeSqlIdentifier(table.name)}" (`]
    const fieldLines = (table.fields || []).map((f) => `  ${fieldToSql(f)}`)

    const tableRelations = relations.filter((r) => r.fromTableId === table.id)
    const fkLines = tableRelations
      .map((r) => {
        const fromField = getFieldById(table, r.fromFieldId)
        const toTable = tableMap.get(r.toTableId)
        const toField = toTable ? getFieldById(toTable, r.toFieldId) : null
        if (!fromField || !toTable || !toField) return null
        return `  FOREIGN KEY ("${escapeSqlIdentifier(fromField.name)}") REFERENCES "${escapeSqlIdentifier(toTable.name)}" ("${escapeSqlIdentifier(toField.name)}")`
      })
      .filter(Boolean)

    const allLines = [...fieldLines, ...fkLines]
    lines.push(allLines.join(',\n'))
    lines.push(');')
    result.push(lines.join('\n'))
  }

  const visited = new Set()
  const visit = (tableId) => {
    if (visited.has(tableId)) return
    visited.add(tableId)
    const deps = relations
      .filter((r) => r.fromTableId === tableId)
      .map((r) => r.toTableId)
    deps.forEach(visit)
    const table = tableMap.get(tableId)
    if (table) renderTable(table)
  }

  tables.forEach((t) => visit(t.id))
  return result.join('\n\n')
}

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { tables: [], relations: [] }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { tables: [], relations: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.tables) || !Array.isArray(parsed.relations)) {
      return { tables: [], relations: [] }
    }
    return parsed
  } catch {
    return { tables: [], relations: [] }
  }
}

export function saveToStorage(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    const toSave = {
      tables: state.tables || [],
      relations: state.relations || [],
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    return true
  } catch {
    return false
  }
}

export function clearStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function exportToJson(state) {
  return {
    version: '1.0',
    tables: state.tables || [],
    relations: state.relations || [],
    exportedAt: new Date().toISOString(),
  }
}

export function downloadJson(state, filename = 'db-design.json') {
  if (typeof window === 'undefined' || !window.document) return false
  try {
    const data = exportToJson(state)
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export function importFromJson(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    return { valid: false, error: '无效的 JSON 数据' }
  }
  if (!Array.isArray(jsonData.tables)) {
    return { valid: false, error: '缺少 tables 数组' }
  }
  if (!Array.isArray(jsonData.relations)) {
    return { valid: false, error: '缺少 relations 数组' }
  }

  const validTypes = Object.values(FIELD_TYPES)

  for (const table of jsonData.tables) {
    if (!table || typeof table !== 'object') {
      return { valid: false, error: '存在无效的表' }
    }
    if (!table.id || typeof table.id !== 'string') {
      return { valid: false, error: '表缺少有效的 id' }
    }
    if (!table.name || typeof table.name !== 'string') {
      return { valid: false, error: `表 ${table.id} 缺少有效的 name` }
    }
    if (typeof table.x !== 'number' || typeof table.y !== 'number') {
      return { valid: false, error: `表 ${table.id} 缺少坐标` }
    }
    if (!Array.isArray(table.fields)) {
      return { valid: false, error: `表 ${table.id} 缺少 fields 数组` }
    }
    for (const field of table.fields) {
      if (!field || typeof field !== 'object') {
        return { valid: false, error: `表 ${table.id} 存在无效字段` }
      }
      if (!field.id || typeof field.id !== 'string') {
        return { valid: false, error: `表 ${table.id} 字段缺少有效的 id` }
      }
      if (!field.name || typeof field.name !== 'string') {
        return { valid: false, error: `表 ${table.id} 字段缺少有效的 name` }
      }
      if (!validTypes.includes(field.type)) {
        return { valid: false, error: `表 ${table.id} 字段 ${field.name} 类型无效: ${field.type}` }
      }
    }
  }

  const tableIds = new Set(jsonData.tables.map((t) => t.id))
  const fieldIds = new Set()
  jsonData.tables.forEach((t) => (t.fields || []).forEach((f) => fieldIds.add(f.id)))

  for (const rel of jsonData.relations) {
    if (!rel || typeof rel !== 'object') {
      return { valid: false, error: '存在无效的关系' }
    }
    if (!rel.id || typeof rel.id !== 'string') {
      return { valid: false, error: '关系缺少有效的 id' }
    }
    if (!tableIds.has(rel.fromTableId)) {
      return { valid: false, error: `关系 ${rel.id} 引用了不存在的源表: ${rel.fromTableId}` }
    }
    if (!tableIds.has(rel.toTableId)) {
      return { valid: false, error: `关系 ${rel.id} 引用了不存在的目标表: ${rel.toTableId}` }
    }
    if (!fieldIds.has(rel.fromFieldId)) {
      return { valid: false, error: `关系 ${rel.id} 引用了不存在的源字段: ${rel.fromFieldId}` }
    }
    if (!fieldIds.has(rel.toFieldId)) {
      return { valid: false, error: `关系 ${rel.id} 引用了不存在的目标字段: ${rel.toFieldId}` }
    }
  }

  return {
    valid: true,
    data: {
      tables: jsonData.tables,
      relations: jsonData.relations,
    },
  }
}

export function autoLayout(tables, relations, startX = 100, startY = 100) {
  if (!Array.isArray(tables) || tables.length === 0) return tables

  const inDegree = new Map()
  const graph = new Map()
  tables.forEach((t) => {
    inDegree.set(t.id, 0)
    graph.set(t.id, [])
  })

  relations.forEach((r) => {
    if (graph.has(r.toTableId) && inDegree.has(r.fromTableId)) {
      graph.get(r.toTableId).push(r.fromTableId)
      inDegree.set(r.fromTableId, (inDegree.get(r.fromTableId) || 0) + 1)
    }
  })

  const levels = []
  const visited = new Set()
  let remaining = new Set(tables.map((t) => t.id))

  while (remaining.size > 0) {
    const currentLevel = []
    remaining.forEach((id) => {
      if ((inDegree.get(id) || 0) === 0) {
        currentLevel.push(id)
      }
    })

    if (currentLevel.length === 0) {
      currentLevel.push(...remaining)
    }

    levels.push(currentLevel)
    currentLevel.forEach((id) => {
      visited.add(id)
      remaining.delete(id)
      const outs = graph.get(id) || []
      outs.forEach((outId) => {
        if (inDegree.has(outId)) {
          inDegree.set(outId, (inDegree.get(outId) || 0) - 1)
        }
      })
    })
  }

  const gapX = 80
  const gapY = 60
  const newTables = tables.map((t) => ({ ...t }))
  const tableMap = new Map()
  newTables.forEach((t) => tableMap.set(t.id, t))

  let currentX = startX

  levels.forEach((level) => {
    let currentY = startY
    level.forEach((tableId) => {
      const table = tableMap.get(tableId)
      if (table) {
        table.x = currentX
        table.y = currentY
        currentY += getTableHeight(table) + gapY
      }
    })
    currentX += TABLE_WIDTH + gapX
  })

  return newTables
}

export function fitToView(tables, containerWidth, containerHeight, padding = 80) {
  if (!Array.isArray(tables) || tables.length === 0) {
    return { panX: containerWidth / 2, panY: containerHeight / 2, zoom: 1 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  tables.forEach((t) => {
    minX = Math.min(minX, t.x)
    minY = Math.min(minY, t.y)
    maxX = Math.max(maxX, t.x + TABLE_WIDTH)
    maxY = Math.max(maxY, t.y + getTableHeight(t))
  })

  const contentWidth = maxX - minX
  const contentHeight = maxY - minY
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const availableWidth = containerWidth - padding * 2
  const availableHeight = containerHeight - padding * 2

  const zoom = clampZoom(
    Math.min(
      availableWidth / (contentWidth || 1),
      availableHeight / (contentHeight || 1)
    )
  )

  const panX = containerWidth / 2 - centerX * zoom
  const panY = containerHeight / 2 - centerY * zoom

  return { panX, panY, zoom }
}
