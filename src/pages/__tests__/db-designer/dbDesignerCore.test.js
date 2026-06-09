import { describe, it, expect, beforeEach } from 'vitest'
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  TABLE_TEMPLATES,
  MIN_ZOOM,
  MAX_ZOOM,
  TABLE_WIDTH,
  TABLE_HEADER_HEIGHT,
  FIELD_ROW_HEIGHT,
  generateId,
  createField,
  createTable,
  createTableFromTemplate,
  updateTable,
  deleteTable,
  getTableById,
  addField,
  updateField,
  deleteField,
  reorderFields,
  getFieldById,
  getPrimaryKeys,
  isPrimaryKeyField,
  createRelation,
  updateRelation,
  deleteRelation,
  deleteRelationsByTableId,
  deleteRelationsByFieldId,
  getRelationsByTableId,
  getRelationById,
  validateRelation,
  clampZoom,
  screenToWorld,
  worldToScreen,
  getTableHeight,
  getFieldAnchor,
  buildBezierPath,
  generateTableDDL,
  generateFullDDL,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  exportToJson,
  downloadJson,
  importFromJson,
  autoLayout,
  fitToView,
  adjustContextMenuPosition,
  DEFAULT_CONTEXT_MENU_WIDTH,
  DEFAULT_CONTEXT_MENU_HEIGHT,
} from '../../db-designer/dbDesignerCore'

describe('FIELD_TYPES', () => {
  it('should contain all 7 field types', () => {
    expect(Object.keys(FIELD_TYPES)).toHaveLength(7)
    expect(FIELD_TYPES.INT).toBe('INT')
    expect(FIELD_TYPES.VARCHAR).toBe('VARCHAR')
    expect(FIELD_TYPES.TEXT).toBe('TEXT')
    expect(FIELD_TYPES.BOOLEAN).toBe('BOOLEAN')
    expect(FIELD_TYPES.DATE).toBe('DATE')
    expect(FIELD_TYPES.FLOAT).toBe('FLOAT')
    expect(FIELD_TYPES.DECIMAL).toBe('DECIMAL')
  })
})

describe('FIELD_TYPE_LABELS', () => {
  it('should map all types to labels', () => {
    Object.values(FIELD_TYPES).forEach((type) => {
      expect(FIELD_TYPE_LABELS[type]).toBe(type)
    })
  })
})

describe('TABLE_TEMPLATES', () => {
  it('should have 3 templates', () => {
    expect(TABLE_TEMPLATES).toHaveLength(3)
  })

  it('each template should have id, name, and fields', () => {
    TABLE_TEMPLATES.forEach((tpl) => {
      expect(tpl).toHaveProperty('id')
      expect(tpl).toHaveProperty('name')
      expect(Array.isArray(tpl.fields)).toBe(true)
    })
  })
})

describe('constants', () => {
  it('should export correct constants', () => {
    expect(MIN_ZOOM).toBe(0.5)
    expect(MAX_ZOOM).toBe(2.0)
    expect(typeof TABLE_WIDTH).toBe('number')
    expect(TABLE_WIDTH).toBeGreaterThan(0)
    expect(typeof TABLE_HEADER_HEIGHT).toBe('number')
    expect(TABLE_HEADER_HEIGHT).toBeGreaterThan(0)
    expect(typeof FIELD_ROW_HEIGHT).toBe('number')
    expect(FIELD_ROW_HEIGHT).toBeGreaterThan(0)
  })
})

describe('generateId', () => {
  it('should generate unique string IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(typeof id1).toBe('string')
    expect(id1).not.toBe(id2)
  })

  it('should use prefix', () => {
    const id = generateId('table')
    expect(id.startsWith('table_')).toBe(true)
  })
})

describe('createField', () => {
  it('should create field with default values', () => {
    const field = createField()
    expect(field).toHaveProperty('id')
    expect(typeof field.id).toBe('string')
    expect(field.name).toBe('new_field')
    expect(field.type).toBe(FIELD_TYPES.INT)
    expect(field.primaryKey).toBe(false)
    expect(field.nullable).toBe(true)
    expect(field.defaultValue).toBe('')
  })

  it('should create field with overrides', () => {
    const field = createField({
      name: 'username',
      type: FIELD_TYPES.VARCHAR,
      nullable: false,
      defaultValue: 'test',
    })
    expect(field.name).toBe('username')
    expect(field.type).toBe(FIELD_TYPES.VARCHAR)
    expect(field.nullable).toBe(false)
    expect(field.defaultValue).toBe('test')
  })

  it('should force nullable to false when primaryKey is true', () => {
    const field = createField({ primaryKey: true, nullable: true })
    expect(field.primaryKey).toBe(true)
    expect(field.nullable).toBe(false)
  })
})

describe('createTable', () => {
  it('should create table with default values', () => {
    const table = createTable()
    expect(table).toHaveProperty('id')
    expect(typeof table.id).toBe('string')
    expect(table.name).toBe('new_table')
    expect(typeof table.x).toBe('number')
    expect(typeof table.y).toBe('number')
    expect(Array.isArray(table.fields)).toBe(true)
    expect(table.fields).toHaveLength(1)
    expect(table.fields[0].name).toBe('id')
    expect(table.fields[0].primaryKey).toBe(true)
  })

  it('should create table with custom name and position', () => {
    const table = createTable('users', 200, 300)
    expect(table.name).toBe('users')
    expect(table.x).toBe(200)
    expect(table.y).toBe(300)
  })
})

describe('createTableFromTemplate', () => {
  it('should create table from template with id field plus template fields', () => {
    const template = TABLE_TEMPLATES[0]
    const table = createTableFromTemplate(template)
    expect(table.name).toBe(template.name)
    expect(table.fields.length).toBe(template.fields.length + 1)
    expect(table.fields[0].name).toBe('id')
    expect(table.fields[0].primaryKey).toBe(true)
  })

  it('should handle template with no fields', () => {
    const table = createTableFromTemplate({ id: 'empty', name: 'empty', fields: [] })
    expect(table.fields).toHaveLength(1)
  })
})

describe('updateTable', () => {
  it('should return empty array for non-array input', () => {
    expect(updateTable(null, 'x', {})).toEqual([])
    expect(updateTable(undefined, 'x', {})).toEqual([])
  })

  it('should update a table by id', () => {
    const tables = [
      { id: 'a', name: 'Old', x: 0 },
      { id: 'b', name: 'B', x: 0 },
    ]
    const result = updateTable(tables, 'a', { name: 'New', x: 100 })
    expect(result[0].name).toBe('New')
    expect(result[0].x).toBe(100)
    expect(result[1].name).toBe('B')
  })

  it('should not mutate original array', () => {
    const tables = [{ id: 'a', name: 'Old' }]
    updateTable(tables, 'a', { name: 'New' })
    expect(tables[0].name).toBe('Old')
  })
})

describe('deleteTable', () => {
  it('should return empty array for non-array input', () => {
    expect(deleteTable(null, 'x')).toEqual([])
  })

  it('should delete table by id', () => {
    const tables = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = deleteTable(tables, 'b')
    expect(result.map((t) => t.id)).toEqual(['a', 'c'])
  })
})

describe('getTableById', () => {
  it('should return null for invalid input', () => {
    expect(getTableById(null, 'x')).toBe(null)
    expect(getTableById([], 'x')).toBe(null)
  })

  it('should find table by id', () => {
    const tables = [{ id: 'a' }, { id: 'b' }]
    expect(getTableById(tables, 'a')).toEqual({ id: 'a' })
    expect(getTableById(tables, 'b')).toEqual({ id: 'b' })
  })
})

describe('addField', () => {
  it('should return table unchanged for null input', () => {
    expect(addField(null)).toBe(null)
  })

  it('should add a new field to table', () => {
    const table = createTable('test')
    const fieldCount = table.fields.length
    const result = addField(table)
    expect(result.fields.length).toBe(fieldCount + 1)
  })

  it('should add field with custom data', () => {
    const table = createTable('test')
    const result = addField(table, { name: 'custom_field', type: FIELD_TYPES.VARCHAR })
    const lastField = result.fields[result.fields.length - 1]
    expect(lastField.name).toBe('custom_field')
    expect(lastField.type).toBe(FIELD_TYPES.VARCHAR)
  })
})

describe('updateField', () => {
  it('should return table unchanged for invalid input', () => {
    expect(updateField(null, 'x', {})).toBe(null)
    const table = { id: 'a' }
    expect(updateField(table, 'x', {})).toBe(table)
  })

  it('should update a field by id', () => {
    const table = createTable('test')
    const fieldId = table.fields[0].id
    const result = updateField(table, fieldId, { name: 'new_name' })
    expect(result.fields[0].name).toBe('new_name')
  })

  it('should force nullable false when setting primaryKey true', () => {
    const table = createTable('test')
    const result = addField(table)
    const fieldId = result.fields[1].id
    const updated = updateField(result, fieldId, { primaryKey: true, nullable: true })
    expect(updated.fields[1].primaryKey).toBe(true)
    expect(updated.fields[1].nullable).toBe(false)
  })
})

describe('deleteField', () => {
  it('should return table unchanged for invalid input', () => {
    expect(deleteField(null, 'x')).toBe(null)
    const table = { id: 'a' }
    expect(deleteField(table, 'x')).toBe(table)
  })

  it('should delete field by id', () => {
    const table = createTable('test')
    const withExtra = addField(table)
    const fieldToDelete = withExtra.fields[1].id
    const result = deleteField(withExtra, fieldToDelete)
    expect(result.fields.length).toBe(1)
    expect(result.fields.find((f) => f.id === fieldToDelete)).toBeUndefined()
  })
})

describe('reorderFields', () => {
  it('should return table unchanged for invalid input', () => {
    expect(reorderFields(null, 0, 1)).toBe(null)
  })

  it('should reorder fields', () => {
    const table = createTable('test')
    let t = addField(table, { name: 'second' })
    t = addField(t, { name: 'third' })
    const result = reorderFields(t, 2, 0)
    expect(result.fields[0].name).toBe('third')
    expect(result.fields[1].name).toBe('id')
    expect(result.fields[2].name).toBe('second')
  })

  it('should handle invalid indices', () => {
    const table = createTable('test')
    const t = addField(table)
    expect(reorderFields(t, -1, 0)).toBe(t)
    expect(reorderFields(t, 0, 100)).toBe(t)
    expect(reorderFields(t, 0, 0)).toBe(t)
  })
})

describe('getFieldById', () => {
  it('should return null for invalid input', () => {
    expect(getFieldById(null, 'x')).toBe(null)
    expect(getFieldById({ id: 'a' }, 'x')).toBe(null)
  })

  it('should find field by id', () => {
    const table = createTable('test')
    const field = table.fields[0]
    expect(getFieldById(table, field.id)).toBe(field)
  })
})

describe('getPrimaryKeys', () => {
  it('should return empty array for invalid input', () => {
    expect(getPrimaryKeys(null)).toEqual([])
  })

  it('should return only primary key fields', () => {
    const table = createTable('test')
    const withExtra = addField(table)
    const pks = getPrimaryKeys(withExtra)
    expect(pks).toHaveLength(1)
    expect(pks[0].primaryKey).toBe(true)
  })
})

describe('isPrimaryKeyField', () => {
  it('should return false for invalid input', () => {
    expect(isPrimaryKeyField(null, 'x')).toBe(false)
  })

  it('should correctly identify primary key fields', () => {
    const table = createTable('test')
    const pkId = table.fields[0].id
    expect(isPrimaryKeyField(table, pkId)).toBe(true)
  })
})

describe('createRelation', () => {
  it('should create relation with source and target', () => {
    const rel = createRelation('t1', 'f1', 't2', 'f2')
    expect(rel).toHaveProperty('id')
    expect(typeof rel.id).toBe('string')
    expect(rel.fromTableId).toBe('t1')
    expect(rel.fromFieldId).toBe('f1')
    expect(rel.toTableId).toBe('t2')
    expect(rel.toFieldId).toBe('f2')
  })
})

describe('updateRelation', () => {
  it('should return empty array for non-array input', () => {
    expect(updateRelation(null, 'x', {})).toEqual([])
  })

  it('should update a relation by id', () => {
    const rels = [{ id: 'r1', fromTableId: 'a' }]
    const result = updateRelation(rels, 'r1', { fromTableId: 'b' })
    expect(result[0].fromTableId).toBe('b')
  })
})

describe('deleteRelation', () => {
  it('should return empty array for non-array input', () => {
    expect(deleteRelation(null, 'x')).toEqual([])
  })

  it('should delete relation by id', () => {
    const rels = [{ id: 'r1' }, { id: 'r2' }]
    const result = deleteRelation(rels, 'r1')
    expect(result.map((r) => r.id)).toEqual(['r2'])
  })
})

describe('deleteRelationsByTableId', () => {
  it('should return empty array for non-array input', () => {
    expect(deleteRelationsByTableId(null, 'x')).toEqual([])
  })

  it('should delete relations connected to table', () => {
    const rels = [
      { id: 'e1', fromTableId: 'a', toTableId: 'b' },
      { id: 'e2', fromTableId: 'b', toTableId: 'c' },
      { id: 'e3', fromTableId: 'c', toTableId: 'd' },
    ]
    const result = deleteRelationsByTableId(rels, 'b')
    expect(result.map((r) => r.id)).toEqual(['e3'])
  })
})

describe('deleteRelationsByFieldId', () => {
  it('should return empty array for non-array input', () => {
    expect(deleteRelationsByFieldId(null, 'x')).toEqual([])
  })

  it('should delete relations connected to field', () => {
    const rels = [
      { id: 'e1', fromFieldId: 'f1', toFieldId: 'f2' },
      { id: 'e2', fromFieldId: 'f2', toFieldId: 'f3' },
      { id: 'e3', fromFieldId: 'f4', toFieldId: 'f5' },
    ]
    const result = deleteRelationsByFieldId(rels, 'f2')
    expect(result.map((r) => r.id)).toEqual(['e3'])
  })
})

describe('getRelationsByTableId', () => {
  it('should return empty array for non-array input', () => {
    expect(getRelationsByTableId(null, 'x')).toEqual([])
  })

  it('should find relations involving table', () => {
    const rels = [
      { id: 'e1', fromTableId: 'a', toTableId: 'b' },
      { id: 'e2', fromTableId: 'c', toTableId: 'd' },
    ]
    const result = getRelationsByTableId(rels, 'b')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('e1')
  })
})

describe('getRelationById', () => {
  it('should return null for invalid input', () => {
    expect(getRelationById(null, 'x')).toBe(null)
  })

  it('should find relation by id', () => {
    const rels = [{ id: 'r1' }, { id: 'r2' }]
    expect(getRelationById(rels, 'r1')).toEqual({ id: 'r1' })
  })
})

describe('validateRelation', () => {
  const buildTestTables = () => {
    const t1 = createTable('table1', 0, 0)
    const t2 = createTable('table2', 300, 0)
    return [t1, t2]
  }

  it('should reject missing parameters', () => {
    const tables = buildTestTables()
    expect(validateRelation(tables, [], null, 'f1', 't2', 'f2').valid).toBe(false)
    expect(validateRelation(tables, [], 't1', null, 't2', 'f2').valid).toBe(false)
  })

  it('should reject self-referencing same table', () => {
    const tables = buildTestTables()
    const result = validateRelation(tables, [], 't1', 'f1', 't1', 'f2')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('同一表')
  })

  it('should reject when target field is not primary key', () => {
    const tables = buildTestTables()
    const t1 = tables[0]
    let t2 = tables[1]
    t2 = addField(t2, { name: 'non_pk', primaryKey: false })
    const nonPkField = t2.fields.find((f) => !f.primaryKey)
    const result = validateRelation(
      [t1, t2],
      [],
      t1.id,
      t1.fields[0].id,
      t2.id,
      nonPkField.id
    )
    expect(result.valid).toBe(false)
    expect(result.error).toContain('主键')
  })

  it('should reject duplicate relations', () => {
    const tables = buildTestTables()
    const t1 = tables[0]
    const t2 = tables[1]
    const t1pk = t1.fields[0].id
    const t2pk = t2.fields[0].id
    const existing = [{ id: 'r1', fromTableId: t1.id, fromFieldId: t1pk, toTableId: t2.id, toFieldId: t2pk }]
    const result = validateRelation(tables, existing, t1.id, t1pk, t2.id, t2pk)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('已存在')
  })

  it('should accept valid relation', () => {
    const tables = buildTestTables()
    const t1 = tables[0]
    const t2 = tables[1]
    let t1WithFk = addField(t1, { name: 't2_id' })
    const fkField = t1WithFk.fields[t1WithFk.fields.length - 1]
    const t2pk = t2.fields[0].id
    const result = validateRelation(
      [t1WithFk, t2],
      [],
      t1WithFk.id,
      fkField.id,
      t2.id,
      t2pk
    )
    expect(result.valid).toBe(true)
  })
})

describe('clampZoom', () => {
  it('should clamp zoom within range', () => {
    expect(clampZoom(0.1)).toBe(MIN_ZOOM)
    expect(clampZoom(3.0)).toBe(MAX_ZOOM)
    expect(clampZoom(1.0)).toBe(1.0)
  })
})

describe('screenToWorld / worldToScreen', () => {
  it('should convert screen to world coordinates', () => {
    const world = screenToWorld(150, 250, 50, 50, 2)
    expect(world.x).toBe(50)
    expect(world.y).toBe(100)
  })

  it('should convert world to screen coordinates', () => {
    const screen = worldToScreen(50, 100, 50, 50, 2)
    expect(screen.x).toBe(150)
    expect(screen.y).toBe(250)
  })

  it('should be inverse operations', () => {
    const panX = 20, panY = 30, zoom = 1.5
    const world = { x: 100, y: 200 }
    const screen = worldToScreen(world.x, world.y, panX, panY, zoom)
    const back = screenToWorld(screen.x, screen.y, panX, panY, zoom)
    expect(back.x).toBeCloseTo(world.x)
    expect(back.y).toBeCloseTo(world.y)
  })
})

describe('getTableHeight', () => {
  it('should return header height for invalid input', () => {
    expect(getTableHeight(null)).toBe(TABLE_HEADER_HEIGHT)
  })

  it('should calculate height based on field count', () => {
    const table = createTable()
    expect(getTableHeight(table)).toBe(TABLE_HEADER_HEIGHT + table.fields.length * FIELD_ROW_HEIGHT)
  })
})

describe('getFieldAnchor', () => {
  it('should return origin for invalid input', () => {
    expect(getFieldAnchor(null, 'x')).toEqual({ x: 0, y: 0 })
  })

  it('should calculate anchor position for right side', () => {
    const table = createTable('test', 100, 200)
    const fieldId = table.fields[0].id
    const anchor = getFieldAnchor(table, fieldId, 'right')
    expect(anchor.x).toBe(100 + TABLE_WIDTH)
    expect(anchor.y).toBe(200 + TABLE_HEADER_HEIGHT + FIELD_ROW_HEIGHT / 2)
  })

  it('should calculate anchor position for left side', () => {
    const table = createTable('test', 100, 200)
    const fieldId = table.fields[0].id
    const anchor = getFieldAnchor(table, fieldId, 'left')
    expect(anchor.x).toBe(100)
    expect(anchor.y).toBe(200 + TABLE_HEADER_HEIGHT + FIELD_ROW_HEIGHT / 2)
  })
})

describe('buildBezierPath', () => {
  it('should return valid SVG path string', () => {
    const from = { x: 0, y: 0 }
    const to = { x: 100, y: 50 }
    const path = buildBezierPath(from, to)
    expect(typeof path).toBe('string')
    expect(path.startsWith('M ')).toBe(true)
    expect(path.includes(' C ')).toBe(true)
  })
})

describe('DDL generation', () => {
  it('generateTableDDL should return empty string for null', () => {
    expect(generateTableDDL(null)).toBe('')
  })

  it('generateTableDDL should generate CREATE TABLE statement', () => {
    const table = createTable('users')
    const ddl = generateTableDDL(table)
    expect(ddl).toContain('CREATE TABLE')
    expect(ddl).toContain('"users"')
    expect(ddl).toContain('"id"')
    expect(ddl).toContain('PRIMARY KEY')
  })

  it('generateFullDDL should return empty for no tables', () => {
    expect(generateFullDDL([], [])).toBe('')
  })

  it('generateFullDDL should generate multiple tables with foreign keys', () => {
    const users = createTable('users')
    let posts = createTable('posts', 400, 0)
    posts = addField(posts, { name: 'user_id', type: FIELD_TYPES.INT })
    const userFkField = posts.fields.find((f) => f.name === 'user_id')
    const userPk = users.fields[0]
    const relations = [createRelation(posts.id, userFkField.id, users.id, userPk.id)]

    const ddl = generateFullDDL([users, posts], relations)
    expect(ddl).toContain('CREATE TABLE "users"')
    expect(ddl).toContain('CREATE TABLE "posts"')
    expect(ddl).toContain('FOREIGN KEY')
    expect(ddl).toContain('REFERENCES "users"')
  })
})

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    clear: () => { store.clear() },
  }
}

describe('storage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    mockStorage.clear()
  })

  it('loadFromStorage should return default state when nothing stored', () => {
    const result = loadFromStorage(mockStorage)
    expect(result.tables).toEqual([])
    expect(result.relations).toEqual([])
    expect(result.error).toBeNull()
  })

  it('saveToStorage and loadFromStorage should work together', () => {
    const testState = { tables: [{ id: 'a', name: 'test', x: 0, y: 0, fields: [] }], relations: [] }
    const saved = saveToStorage(testState, mockStorage)
    expect(saved.success).toBe(true)
    expect(saved.error).toBeNull()
    const loaded = loadFromStorage(mockStorage)
    expect(loaded.tables).toEqual(testState.tables)
    expect(loaded.relations).toEqual(testState.relations)
    expect(loaded.error).toBeNull()
  })

  it('loadFromStorage should return default for invalid JSON', () => {
    mockStorage.setItem('db-designer-state', 'invalid-json')
    const result = loadFromStorage(mockStorage)
    expect(result.tables).toEqual([])
    expect(result.relations).toEqual([])
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })

  it('loadFromStorage should return error for malformed data structure', () => {
    mockStorage.setItem('db-designer-state', JSON.stringify({ notTables: 'bad' }))
    const result = loadFromStorage(mockStorage)
    expect(result.tables).toEqual([])
    expect(result.relations).toEqual([])
    expect(result.error).toBeDefined()
    expect(result.error).toContain('格式损坏')
  })

  it('clearStorage should work', () => {
    saveToStorage({ tables: [{ id: 'a' }], relations: [] }, mockStorage)
    const cleared = clearStorage(mockStorage)
    expect(cleared.success).toBe(true)
    expect(cleared.error).toBeNull()
    const loaded = loadFromStorage(mockStorage)
    expect(loaded.tables).toEqual([])
    expect(loaded.relations).toEqual([])
  })

  it('should handle storage throws gracefully and return error info', () => {
    const badStorage = {
      getItem: () => { throw new Error('read fail') },
      setItem: () => { throw new Error('write fail') },
      removeItem: () => { throw new Error('remove fail') },
    }
    const loadResult = loadFromStorage(badStorage)
    expect(loadResult.tables).toEqual([])
    expect(loadResult.relations).toEqual([])
    expect(loadResult.error).toContain('读取存储数据失败')

    const saveResult = saveToStorage({ tables: [], relations: [] }, badStorage)
    expect(saveResult.success).toBe(false)
    expect(saveResult.error).toContain('保存数据失败')

    const clearResult = clearStorage(badStorage)
    expect(clearResult.success).toBe(false)
    expect(clearResult.error).toContain('清除存储失败')
  })

  it('should handle no storage and return error info', () => {
    const loadResult = loadFromStorage(null)
    expect(loadResult.tables).toEqual([])
    expect(loadResult.relations).toEqual([])
    expect(loadResult.error).toContain('localStorage 不可用')

    const saveResult = saveToStorage({ tables: [], relations: [] }, null)
    expect(saveResult.success).toBe(false)
    expect(saveResult.error).toContain('localStorage 不可用')

    const clearResult = clearStorage(null)
    expect(clearResult.success).toBe(false)
    expect(clearResult.error).toContain('localStorage 不可用')
  })
})

describe('exportToJson', () => {
  it('should export with version and timestamps', () => {
    const state = { tables: [{ id: 'a' }], relations: [{ id: 'r1' }] }
    const result = exportToJson(state)
    expect(result.version).toBe('1.0')
    expect(result.tables).toEqual(state.tables)
    expect(result.relations).toEqual(state.relations)
    expect(result.exportedAt).toBeDefined()
  })
})

describe('importFromJson', () => {
  const buildValidData = () => {
    const t1 = createTable('users')
    const t2 = createTable('posts')
    return { tables: [t1, t2], relations: [] }
  }

  it('should reject non-object input', () => {
    expect(importFromJson(null).valid).toBe(false)
    expect(importFromJson('string').valid).toBe(false)
  })

  it('should reject missing tables array', () => {
    const result = importFromJson({ relations: [] })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('tables')
  })

  it('should reject missing relations array', () => {
    const result = importFromJson({ tables: [] })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('relations')
  })

  it('should reject invalid field type', () => {
    const data = {
      tables: [{
        id: 't1', name: 'test', x: 0, y: 0,
        fields: [{ id: 'f1', name: 'bad', type: 'INVALID_TYPE', primaryKey: false, nullable: true, defaultValue: '' }],
      }],
      relations: [],
    }
    const result = importFromJson(data)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('类型无效')
  })

  it('should reject relation referencing non-existent table', () => {
    const t1 = createTable('t1')
    const data = {
      tables: [t1],
      relations: [{ id: 'r1', fromTableId: t1.id, fromFieldId: t1.fields[0].id, toTableId: 'missing', toFieldId: 'missing' }],
    }
    const result = importFromJson(data)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('不存在')
  })

  it('should accept valid data', () => {
    const data = buildValidData()
    const result = importFromJson(data)
    expect(result.valid).toBe(true)
    expect(result.data).toEqual(data)
  })
})

describe('autoLayout', () => {
  it('should return input for empty tables', () => {
    expect(autoLayout([], [])).toEqual([])
  })

  it('should layout tables without cycles', () => {
    const t1 = createTable('users', 999, 999)
    const t2 = createTable('posts', 999, 999)
    const tables = [t1, t2]
    const result = autoLayout(tables, [])
    expect(result).toHaveLength(2)
    result.forEach((t) => {
      expect(typeof t.x).toBe('number')
      expect(typeof t.y).toBe('number')
      expect(t.x).not.toBe(999)
    })
  })

  it('should layout tables respecting dependencies', () => {
    const t1 = createTable('users')
    let t2 = createTable('posts')
    t2 = addField(t2, { name: 'user_id' })
    const tables = [t1, t2]
    const rel = createRelation(t2.id, t2.fields[1].id, t1.id, t1.fields[0].id)
    const result = autoLayout(tables, [rel])
    const users = result.find((t) => t.name === 'users')
    const posts = result.find((t) => t.name === 'posts')
    expect(users.x).toBeLessThan(posts.x)
  })
})

describe('fitToView', () => {
  it('should return default for empty tables', () => {
    const result = fitToView([], 800, 600)
    expect(result).toHaveProperty('panX')
    expect(result).toHaveProperty('panY')
    expect(result.zoom).toBe(1)
  })

  it('should calculate pan and zoom to fit content', () => {
    const t1 = createTable('users', 0, 0)
    const t2 = createTable('posts', 500, 0)
    const result = fitToView([t1, t2], 1000, 800)
    expect(result.zoom).toBeGreaterThan(0)
    expect(result.zoom).toBeLessThanOrEqual(MAX_ZOOM)
    expect(result.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
    expect(typeof result.panX).toBe('number')
    expect(typeof result.panY).toBe('number')
  })
})

describe('generateTableDDL with foreign keys', () => {
  it('should generate single table DDL with foreign key constraints', () => {
    const users = createTable('users')
    let posts = createTable('posts')
    posts = addField(posts, { name: 'user_id', type: FIELD_TYPES.INT })
    const userFkField = posts.fields.find((f) => f.name === 'user_id')
    const userPk = users.fields[0]
    const relations = [createRelation(posts.id, userFkField.id, users.id, userPk.id)]

    const ddl = generateTableDDL(posts, [users, posts], relations)
    expect(ddl).toContain('CREATE TABLE "posts"')
    expect(ddl).toContain('FOREIGN KEY')
    expect(ddl).toContain('REFERENCES "users"')
    expect(ddl).toContain(`"${userFkField.name}"`)
    expect(ddl).toContain(`"${userPk.name}"`)
  })

  it('should generate DDL without FK when allTables is empty', () => {
    const posts = createTable('posts')
    const ddl = generateTableDDL(posts, [], [])
    expect(ddl).toContain('CREATE TABLE "posts"')
    expect(ddl).not.toContain('FOREIGN KEY')
  })

  it('should generate DDL and skip invalid FK references', () => {
    const posts = createTable('posts')
    const fakeRel = { id: 'r1', fromTableId: posts.id, fromFieldId: 'nonexistent', toTableId: 'ghost', toFieldId: 'ghost' }
    const ddl = generateTableDDL(posts, [posts], [fakeRel])
    expect(ddl).toContain('CREATE TABLE "posts"')
    expect(ddl).not.toContain('FOREIGN KEY')
  })
})

describe('downloadJson', () => {
  it('should return error when window/document is not available', () => {
    const result = downloadJson({ tables: [], relations: [] })
    expect(typeof result).toBe('object')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })
})

describe('context menu constants', () => {
  it('should export default context menu dimensions', () => {
    expect(typeof DEFAULT_CONTEXT_MENU_WIDTH).toBe('number')
    expect(DEFAULT_CONTEXT_MENU_WIDTH).toBeGreaterThan(0)
    expect(typeof DEFAULT_CONTEXT_MENU_HEIGHT).toBe('number')
    expect(DEFAULT_CONTEXT_MENU_HEIGHT).toBeGreaterThan(0)
  })
})

describe('adjustContextMenuPosition', () => {
  it('should return original position when menu fits in viewport', () => {
    const result = adjustContextMenuPosition(100, 100, 150, 100, 1024, 768, 8)
    expect(result.x).toBe(100)
    expect(result.y).toBe(100)
  })

  it('should clamp x when menu exceeds right edge of viewport', () => {
    const result = adjustContextMenuPosition(950, 100, 150, 100, 1024, 768, 8)
    expect(result.x + 150 + 8).toBeLessThanOrEqual(1024)
    expect(result.x).toBeGreaterThanOrEqual(8)
  })

  it('should clamp x when menu exceeds left edge of viewport', () => {
    const result = adjustContextMenuPosition(-50, 100, 150, 100, 1024, 768, 8)
    expect(result.x).toBe(8)
  })

  it('should clamp y when menu exceeds bottom edge of viewport', () => {
    const result = adjustContextMenuPosition(100, 700, 150, 100, 1024, 768, 8)
    expect(result.y + 100 + 8).toBeLessThanOrEqual(768)
    expect(result.y).toBeGreaterThanOrEqual(8)
  })

  it('should clamp y when menu exceeds top edge of viewport', () => {
    const result = adjustContextMenuPosition(100, -30, 150, 100, 1024, 768, 8)
    expect(result.y).toBe(8)
  })

  it('should clamp both axes when menu exceeds both edges', () => {
    const result = adjustContextMenuPosition(1000, 800, 200, 150, 1024, 768, 8)
    expect(result.x + 200 + 8).toBeLessThanOrEqual(1024)
    expect(result.y + 150 + 8).toBeLessThanOrEqual(768)
    expect(result.x).toBeGreaterThanOrEqual(8)
    expect(result.y).toBeGreaterThanOrEqual(8)
  })

  it('should handle invalid/non-number input gracefully with defaults', () => {
    const result = adjustContextMenuPosition(null, undefined, 'bad', NaN, null, undefined, -1)
    expect(typeof result.x).toBe('number')
    expect(typeof result.y).toBe('number')
    expect(result.x).toBeGreaterThanOrEqual(0)
    expect(result.y).toBeGreaterThanOrEqual(0)
  })

  it('should use default padding when padding is invalid', () => {
    const result = adjustContextMenuPosition(100, 100, 150, 100, 1024, 768, -5)
    expect(result.x).toBe(100)
    expect(result.y).toBe(100)
  })

  it('should handle small viewport gracefully', () => {
    const result = adjustContextMenuPosition(100, 100, 500, 500, 200, 200, 8)
    expect(typeof result.x).toBe('number')
    expect(typeof result.y).toBe('number')
    expect(result.x).toBeGreaterThanOrEqual(8)
    expect(result.y).toBeGreaterThanOrEqual(8)
  })
})
