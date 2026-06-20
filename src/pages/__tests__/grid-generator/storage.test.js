import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  STORAGE_KEY,
  DEFAULT_ROWS,
} from '@/pages/grid-generator/constants.js'
import {
  createInitialConfig,
  serializeConfig,
} from '@/pages/grid-generator/gridGeneratorCore.js'
import {
  loadLayouts,
  saveLayouts,
  saveNewLayout,
  updateExistingLayout,
  deleteLayout,
  renameLayout,
  persistLayout,
  loadLayoutById,
  importLayoutFromJSON,
  exportLayoutToJSON,
  clearAllLayouts,
} from '@/pages/grid-generator/storage.js'

function createMockStorage() {
  const store = new Map()
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}

describe('storage wrapper (no store)', () => {
  it('returns empty array for null storage', () => {
    expect(loadLayouts(null)).toEqual([])
  })
})

describe('Load & save basics', () => {
  let storage

  beforeEach(() => {
    storage = createMockStorage()
    storage.clear()
  })

  it('should return empty array when nothing stored', () => {
    expect(loadLayouts(storage)).toEqual([])
  })

  it('save/load roundtrip', () => {
    const layouts = [{ id: 'a', name: 'test', config: {}, timestamp: 1 }]
    const result = saveLayouts(layouts, storage)
    expect(result).toBe(true)
    const loaded = loadLayouts(storage)
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('a')
  })

  it('should filter invalid items when loading', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify([
      { id: 'a', name: 'valid', config: {}, timestamp: 1 },
      null,
      'string',
      { id: 'b', name: 'no config' },
      {},
    ]))
    const loaded = loadLayouts(storage)
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('a')
  })

  it('should handle malformed JSON gracefully', () => {
    storage.setItem(STORAGE_KEY, 'not json')
    expect(loadLayouts(storage)).toEqual([])
  })

  it('should handle non-array data', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }))
    expect(loadLayouts(storage)).toEqual([])
  })

  it('saveLayouts should fail gracefully on bad storage', () => {
    expect(saveLayouts([], { setItem: () => { throw new Error('fail') } })).toBe(false)
  })
})

describe('saveNewLayout', () => {
  it('should create a new entry prepended to list', () => {
    const config = createInitialConfig()
    const result = saveNewLayout([], config, 'My Layout')
    expect(result.wasAdded).toBe(true)
    expect(result.layouts).toHaveLength(1)
    expect(result.entry.name).toBe('My Layout')
    expect(result.entry.config).toBe(config)
    expect(result.entry.id).toBeDefined()
    expect(typeof result.entry.timestamp).toBe('number')
  })

  it('should use default name when empty', () => {
    const r = saveNewLayout([], createInitialConfig(), '')
    expect(r.entry.name).toMatch(/布局/)
  })

  it('should fail without config', () => {
    const r = saveNewLayout([], null, 'name')
    expect(r.wasAdded).toBe(false)
  })

  it('should prepend to existing layouts', () => {
    const existing = [{ id: 'old', name: 'Old', config: {}, timestamp: 1 }]
    const r = saveNewLayout(existing, createInitialConfig(), 'New')
    expect(r.layouts).toHaveLength(2)
    expect(r.layouts[0].name).toBe('New')
    expect(r.layouts[1].id).toBe('old')
  })
})

describe('Update, delete, rename', () => {
  const base = [
    { id: 'a', name: 'A', config: {}, timestamp: 1 },
    { id: 'b', name: 'B', config: {}, timestamp: 2 },
  ]

  it('updateExistingLayout should update name/config and timestamp', () => {
    const updated = updateExistingLayout(base, 'a', { name: 'New Name' })
    expect(updated[0].name).toBe('New Name')
    expect(updated[1].name).toBe('B')
    expect(updated[0].timestamp).toBeGreaterThanOrEqual(1)
  })

  it('should ignore unknown id', () => {
    const updated = updateExistingLayout(base, 'no-id', { name: 'X' })
    expect(updated).toBe(base)
  })

  it('deleteLayout should filter by id', () => {
    const result = deleteLayout(base, 'a')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b')
  })

  it('renameLayout should update name', () => {
    const result = renameLayout(base, 'a', 'Renamed')
    expect(result[0].name).toBe('Renamed')
  })
})

describe('persistLayout', () => {
  it('should save to storage', () => {
    const storage = createMockStorage()
    const result = persistLayout([], createInitialConfig(), storage, 'Persisted')
    expect(result.wasAdded).toBe(true)
    const raw = storage.getItem(STORAGE_KEY)
    expect(raw).toBeDefined()
    const parsed = JSON.parse(raw)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('Persisted')
  })
})

describe('loadLayoutById', () => {
  const layouts = [
    { id: 'x', name: 'Target', config: { rows: 5 }, timestamp: 1 },
  ]
  it('should return layout data', () => {
    const result = loadLayoutById(layouts, 'x')
    expect(result).not.toBeNull()
    expect(result.name).toBe('Target')
    expect(result.config.rows).toBe(5)
  })
  it('should return null for missing', () => {
    expect(loadLayoutById(layouts, 'missing')).toBeNull()
  })
})

describe('Import/Export JSON', () => {
  it('importLayoutFromJSON valid config', () => {
    const cfg = createInitialConfig()
    cfg.cells[0].colSpan = 2
    const json = serializeConfig(cfg, 'Imported')
    const result = importLayoutFromJSON(json)
    expect(result.success).toBe(true)
    expect(result.entry.name).toBe('Imported')
    expect(result.entry.config.cells[0].colSpan).toBe(2)
    expect(result.entry.id).toBeDefined()
  })

  it('should fail for invalid JSON', () => {
    const r = importLayoutFromJSON('garbage')
    expect(r.success).toBe(false)
    expect(r.error).toBeDefined()
  })

  it('exportLayoutToJSON should produce valid JSON', () => {
    const cfg = createInitialConfig()
    const entry = { id: 'x', name: 'Export', config: cfg, timestamp: 1 }
    const json = exportLayoutToJSON(entry)
    expect(json).toBeDefined()
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('Export')
    expect(parsed.config.rows).toBe(DEFAULT_ROWS)
  })

  it('exportLayoutToJSON should return null for bad entry', () => {
    expect(exportLayoutToJSON(null)).toBeNull()
  })
})

describe('clearAllLayouts', () => {
  it('should remove storage key', () => {
    const storage = createMockStorage()
    storage.setItem(STORAGE_KEY, '[]')
    const result = clearAllLayouts(storage)
    expect(result).toBe(true)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('should fail gracefully', () => {
    expect(clearAllLayouts(null)).toBe(false)
    expect(clearAllLayouts({ removeItem: () => { throw new Error('fail') } })).toBe(false)
  })
})
