import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateId,
  getDefaultData,
  getDefaultUIState,
  loadData,
  saveData,
  loadUIState,
  saveUIState,
  getNode,
  getChildren,
  getPathToNode,
  getPathString,
  collectDescendantIds,
  collectAllNotes,
  collectNotesInNotebook,
  findNoteByTitle,
  createNotebook,
  createFolder,
  createNote,
  renameNode,
  deleteNode,
  moveNode,
  toggleExpanded,
  updateNoteContent,
  addTagToNote,
  removeTagFromNote,
  getAllTags,
  filterNotesByTags,
  buildSearchIndex,
  searchNotes,
  highlightText,
  parseInternalLinks,
  escapeHtml,
  renderMarkdown,
  getBrokenLinks,
  updateLinksOnRename,
  markLinksBrokenOnDelete,
  importNote,
  exportNote,
  hasChildWithName,
  hasRootNotebookWithName,
} from '@/pages/markdown-notes/noteUtils.js'
import { NODE_TYPES, STORAGE_KEY, UI_STORAGE_KEY, DEFAULT_PANEL_RATIO } from '@/pages/markdown-notes/constants.js'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

function createSimpleTestData() {
  const data = {
    rootNotebooks: ['nb1'],
    nodes: {
      nb1: {
        id: 'nb1',
        type: NODE_TYPES.NOTEBOOK,
        name: '测试笔记本',
        children: ['folder1', 'note1'],
        expanded: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
      folder1: {
        id: 'folder1',
        type: NODE_TYPES.FOLDER,
        name: '文件夹1',
        parentId: 'nb1',
        children: ['note2'],
        expanded: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
      note1: {
        id: 'note1',
        type: NODE_TYPES.NOTE,
        title: '笔记1',
        parentId: 'nb1',
        content: '# 笔记1\n\n这是**笔记1**的内容。\n\n- 列表项1\n- 列表项2',
        tags: ['标签1', '标签2'],
        createdAt: 1000,
        updatedAt: 1000,
      },
      note2: {
        id: 'note2',
        type: NODE_TYPES.NOTE,
        title: '笔记2',
        parentId: 'folder1',
        content: '# 笔记2\n\n这是笔记2的内容。\n\n[[笔记1]]\n[[不存在的笔记]]',
        tags: ['标签1'],
        createdAt: 1000,
        updatedAt: 1000,
      },
    },
  }
  return data
}

describe('noteUtils', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique ids', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })

    it('should use prefix when provided', () => {
      const id = generateId('test')
      expect(id.startsWith('test-')).toBe(true)
    })
  })

  describe('getDefaultData', () => {
    it('should return valid default data structure', () => {
      const data = getDefaultData()
      expect(Array.isArray(data.rootNotebooks)).toBe(true)
      expect(data.rootNotebooks.length).toBeGreaterThan(0)
      expect(typeof data.nodes).toBe('object')
    })

    it('should contain notebooks, folders, and notes', () => {
      const data = getDefaultData()
      const types = new Set()
      for (const nodeId of Object.keys(data.nodes)) {
        types.add(data.nodes[nodeId].type)
      }
      expect(types.has(NODE_TYPES.NOTEBOOK)).toBe(true)
      expect(types.has(NODE_TYPES.FOLDER)).toBe(true)
      expect(types.has(NODE_TYPES.NOTE)).toBe(true)
    })
  })

  describe('getDefaultUIState', () => {
    it('should return default UI state', () => {
      const state = getDefaultUIState()
      expect(state.selectedNoteId).toBeNull()
      expect(state.panelRatio).toBe(DEFAULT_PANEL_RATIO)
      expect(typeof state.expandedNodes).toBe('object')
      expect(Array.isArray(state.activeTags)).toBe(true)
      expect(state.searchQuery).toBe('')
    })
  })

  describe('localStorage persistence', () => {
    let storage
    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadData should return default data and persist it when storage empty', () => {
      const data = loadData(storage)
      expect(Array.isArray(data.rootNotebooks)).toBe(true)
      expect(storage.getItem(STORAGE_KEY)).toBeTruthy()
    })

    it('saveData and loadData should round-trip correctly', () => {
      const original = createSimpleTestData()
      saveData(original, storage)
      const loaded = loadData(storage)
      expect(loaded.rootNotebooks).toEqual(original.rootNotebooks)
      expect(Object.keys(loaded.nodes)).toEqual(Object.keys(original.nodes))
    })

    it('loadData should handle corrupted JSON gracefully', () => {
      storage.setItem(STORAGE_KEY, '{invalid json')
      const data = loadData(storage)
      expect(Array.isArray(data.rootNotebooks)).toBe(true)
    })

    it('loadData should handle invalid data structure', () => {
      storage.setItem(STORAGE_KEY, JSON.stringify({ invalid: 'data' }))
      const data = loadData(storage)
      expect(Array.isArray(data.rootNotebooks)).toBe(true)
    })

    it('loadUIState should return default when storage empty', () => {
      const state = loadUIState(storage)
      expect(state.panelRatio).toBe(DEFAULT_PANEL_RATIO)
    })

    it('saveUIState and loadUIState should round-trip correctly', () => {
      const original = {
        selectedNoteId: 'test-note',
        panelRatio: 0.7,
        expandedNodes: { nb1: true },
        activeTags: ['标签1'],
        searchQuery: 'test',
      }
      saveUIState(original, storage)
      const loaded = loadUIState(storage)
      expect(loaded.selectedNoteId).toBe('test-note')
      expect(loaded.panelRatio).toBe(0.7)
      expect(loaded.activeTags).toEqual(['标签1'])
    })

    it('should not throw when storage is null', () => {
      expect(() => loadData(null)).not.toThrow()
      expect(() => saveData(createSimpleTestData(), null)).not.toThrow()
      expect(() => loadUIState(null)).not.toThrow()
      expect(() => saveUIState({}, null)).not.toThrow()
    })
  })

  describe('tree traversal', () => {
    let data
    beforeEach(() => {
      data = createSimpleTestData()
    })

    it('getNode should return correct node', () => {
      const node = getNode(data, 'note1')
      expect(node).toBeTruthy()
      expect(node.title).toBe('笔记1')
    })

    it('getNode should return null for non-existent id', () => {
      const node = getNode(data, 'non-existent')
      expect(node).toBeNull()
    })

    it('getChildren should return children nodes', () => {
      const children = getChildren(data, 'nb1')
      expect(children.length).toBe(2)
      expect(children[0].id).toBe('folder1')
      expect(children[1].id).toBe('note1')
    })

    it('getChildren should return empty array for note node', () => {
      const children = getChildren(data, 'note1')
      expect(children).toEqual([])
    })

    it('getPathToNode should return correct path', () => {
      const path = getPathToNode(data, 'note2')
      expect(path.length).toBe(3)
      expect(path[0].name).toBe('测试笔记本')
      expect(path[1].name).toBe('文件夹1')
      expect(path[2].name).toBe('笔记2')
    })

    it('getPathString should return formatted path', () => {
      const pathStr = getPathString(data, 'note2')
      expect(pathStr).toBe('测试笔记本 / 文件夹1 / 笔记2')
    })

    it('collectDescendantIds should collect all descendants', () => {
      const ids = collectDescendantIds(data, 'nb1')
      expect(ids).toContain('folder1')
      expect(ids).toContain('note1')
      expect(ids).toContain('note2')
      expect(ids.length).toBe(3)
    })

    it('collectAllNotes should return all notes', () => {
      const notes = collectAllNotes(data)
      expect(notes.length).toBe(2)
      const titles = notes.map((n) => n.title).sort()
      expect(titles).toEqual(['笔记1', '笔记2'])
    })

    it('collectNotesInNotebook should return notes in notebook', () => {
      const notes = collectNotesInNotebook(data, 'nb1')
      expect(notes.length).toBe(2)
    })

    it('findNoteByTitle should find note by title', () => {
      const note = findNoteByTitle(data, '笔记1')
      expect(note).toBeTruthy()
      expect(note.id).toBe('note1')
    })

    it('findNoteByTitle should return null for non-existent title', () => {
      const note = findNoteByTitle(data, '不存在')
      expect(note).toBeNull()
    })
  })

  describe('CRUD operations', () => {
    let data
    beforeEach(() => {
      data = createSimpleTestData()
    })

    it('createNotebook should add a new notebook', () => {
      const newData = createNotebook(data, '新笔记本')
      expect(newData.rootNotebooks.length).toBe(2)
      const newNotebookId = newData.rootNotebooks[1]
      const notebook = getNode(newData, newNotebookId)
      expect(notebook.name).toBe('新笔记本')
      expect(notebook.type).toBe(NODE_TYPES.NOTEBOOK)
    })

    it('createFolder should add a new folder', () => {
      const newData = createFolder(data, 'nb1', '新文件夹')
      const children = getChildren(newData, 'nb1')
      expect(children.length).toBe(3)
      const newFolder = children.find((c) => c.name === '新文件夹')
      expect(newFolder).toBeTruthy()
      expect(newFolder.type).toBe(NODE_TYPES.FOLDER)
    })

    it('createFolder should not create under note node', () => {
      const newData = createFolder(data, 'note1', '新文件夹')
      expect(newData).toBe(data)
    })

    it('createNote should add a new note', () => {
      const newData = createNote(data, 'nb1', '新笔记', '# 新笔记内容')
      const children = getChildren(newData, 'nb1')
      expect(children.length).toBe(3)
      const newNote = children.find((c) => c.title === '新笔记')
      expect(newNote).toBeTruthy()
      expect(newNote.content).toBe('# 新笔记内容')
      expect(Array.isArray(newNote.tags)).toBe(true)
    })

    it('createNote should not create under note node', () => {
      const newData = createNote(data, 'note1', '新笔记')
      expect(newData).toBe(data)
    })

    it('renameNode should rename notebook', () => {
      const newData = renameNode(data, 'nb1', '重命名笔记本')
      const notebook = getNode(newData, 'nb1')
      expect(notebook.name).toBe('重命名笔记本')
    })

    it('renameNode should rename note and update title', () => {
      const newData = renameNode(data, 'note1', '重命名笔记')
      const note = getNode(newData, 'note1')
      expect(note.title).toBe('重命名笔记')
    })

    it('renameNode should not mutate original data', () => {
      const frozen = JSON.stringify(data)
      renameNode(data, 'note1', '新标题')
      expect(JSON.stringify(data)).toBe(frozen)
    })

    it('deleteNode should remove node and its descendants', () => {
      const newData = deleteNode(data, 'folder1')
      const deletedFolder = getNode(newData, 'folder1')
      const deletedNote = getNode(newData, 'note2')
      expect(deletedFolder).toBeNull()
      expect(deletedNote).toBeNull()
      const children = getChildren(newData, 'nb1')
      expect(children.length).toBe(1)
    })

    it('deleteNode should remove root notebook', () => {
      const newData = deleteNode(data, 'nb1')
      expect(newData.rootNotebooks.length).toBe(0)
    })

    it('moveNode should move note to another folder', () => {
      const newData = moveNode(data, 'note2', 'nb1')
      const nb1Children = getChildren(newData, 'nb1')
      const folder1Children = getChildren(newData, 'folder1')
      expect(nb1Children.some((c) => c.id === 'note2')).toBe(true)
      expect(folder1Children.some((c) => c.id === 'note2')).toBe(false)
    })

    it('moveNode should not move notebook', () => {
      const newData = moveNode(data, 'nb1', 'folder1')
      expect(newData).toBe(data)
    })

    it('moveNode should not move into its own descendant', () => {
      const newData = moveNode(data, 'folder1', 'note2')
      expect(newData).toBe(data)
    })

    it('toggleExpanded should toggle expanded state', () => {
      const newData = toggleExpanded(data, 'nb1')
      expect(newData.nodes.nb1.expanded).toBe(false)
      const newData2 = toggleExpanded(newData, 'nb1')
      expect(newData2.nodes.nb1.expanded).toBe(true)
    })

    it('toggleExpanded should not affect note nodes', () => {
      const newData = toggleExpanded(data, 'note1')
      expect(newData).toBe(data)
    })

    it('updateNoteContent should update note content', () => {
      const newContent = '# 更新的内容'
      const newData = updateNoteContent(data, 'note1', newContent)
      const note = getNode(newData, 'note1')
      expect(note.content).toBe(newContent)
    })
  })

  describe('tag management', () => {
    let data
    beforeEach(() => {
      data = createSimpleTestData()
    })

    it('addTagToNote should add new tag', () => {
      const newData = addTagToNote(data, 'note1', '新标签')
      const note = getNode(newData, 'note1')
      expect(note.tags).toContain('新标签')
      expect(note.tags.length).toBe(3)
    })

    it('addTagToNote should not add duplicate tags', () => {
      const newData = addTagToNote(data, 'note1', '标签1')
      const note = getNode(newData, 'note1')
      expect(note.tags.filter((t) => t === '标签1').length).toBe(1)
    })

    it('addTagToNote should trim tag whitespace', () => {
      const newData = addTagToNote(data, 'note1', '  标签  ')
      const note = getNode(newData, 'note1')
      expect(note.tags).toContain('标签')
    })

    it('removeTagFromNote should remove tag', () => {
      const newData = removeTagFromNote(data, 'note1', '标签1')
      const note = getNode(newData, 'note1')
      expect(note.tags).toEqual(['标签2'])
    })

    it('getAllTags should return all tags with counts', () => {
      const tags = getAllTags(data)
      expect(tags.length).toBe(2)
      const tag1 = tags.find((t) => t.name === '标签1')
      const tag2 = tags.find((t) => t.name === '标签2')
      expect(tag1.count).toBe(2)
      expect(tag2.count).toBe(1)
    })

    it('filterNotesByTags should filter notes by single tag', () => {
      const notes = filterNotesByTags(data, ['标签2'])
      expect(notes.length).toBe(1)
      expect(notes[0].title).toBe('笔记1')
    })

    it('filterNotesByTags should filter by multiple tags (AND)', () => {
      const notes = filterNotesByTags(data, ['标签1', '标签2'])
      expect(notes.length).toBe(1)
      expect(notes[0].title).toBe('笔记1')
    })

    it('filterNotesByTags should return all notes when tags empty', () => {
      const notes = filterNotesByTags(data, [])
      expect(notes.length).toBe(2)
    })
  })

  describe('search functionality', () => {
    let data
    let index
    beforeEach(() => {
      data = createSimpleTestData()
      index = buildSearchIndex(data)
    })

    it('buildSearchIndex should create index for all notes', () => {
      expect(index.length).toBe(2)
      expect(index[0].title).toBeTruthy()
      expect(index[0].path).toBeTruthy()
    })

    it('searchNotes should find notes by title', () => {
      const results = searchNotes(index, '笔记1')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].matchesTitle).toBe(true)
    })

    it('searchNotes should find notes by content', () => {
      const results = searchNotes(index, '列表项')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].matchesContent).toBe(true)
    })

    it('searchNotes should be case-insensitive', () => {
      const results1 = searchNotes(index, '笔记')
      const results2 = searchNotes(index, '笔记')
      expect(results1.length).toBe(results2.length)
    })

    it('searchNotes should return empty array for empty query', () => {
      const results = searchNotes(index, '')
      expect(results).toEqual([])
    })

    it('searchNotes should return empty array for whitespace query', () => {
      const results = searchNotes(index, '   ')
      expect(results).toEqual([])
    })

    it('highlightText should wrap matches with markers', () => {
      const result = highlightText('Hello World', 'world')
      expect(result).toContain('{{{HIGHLIGHT}}}')
      expect(result).toContain('{{{/HIGHLIGHT}}}')
    })

    it('highlightText should handle special regex characters', () => {
      const result = highlightText('Hello (World)', '(world)')
      expect(result).toContain('{{{HIGHLIGHT}}}')
    })
  })

  describe('internal links', () => {
    let data
    beforeEach(() => {
      data = createSimpleTestData()
    })

    it('parseInternalLinks should extract all internal links', () => {
      const content = '[[笔记1]] and [[笔记2]]'
      const links = parseInternalLinks(content)
      expect(links.length).toBe(2)
      expect(links[0].title).toBe('笔记1')
      expect(links[1].title).toBe('笔记2')
    })

    it('parseInternalLinks should return empty array when no links', () => {
      const links = parseInternalLinks('普通文本')
      expect(links).toEqual([])
    })

    it('getBrokenLinks should find broken links', () => {
      const broken = getBrokenLinks(data)
      expect(broken.length).toBe(1)
      expect(broken[0].toNoteTitle).toBe('不存在的笔记')
    })

    it('updateLinksOnRename should update links when note renamed', () => {
      const newData = updateLinksOnRename(data, '笔记1', '重命名笔记')
      const note2 = getNode(newData, 'note2')
      expect(note2.content).toContain('[[重命名笔记]]')
      expect(note2.content).not.toContain('[[笔记1]]')
    })

    it('markLinksBrokenOnDelete should mark links as deleted', () => {
      const newData = markLinksBrokenOnDelete(data, '笔记1')
      const note2 = getNode(newData, 'note2')
      expect(note2.content).toContain('[[笔记1 (已删除)]]')
    })
  })

  describe('Markdown rendering', () => {
    let data
    beforeEach(() => {
      data = createSimpleTestData()
    })

    it('escapeHtml should escape HTML special characters', () => {
      const escaped = escapeHtml('<script>alert("xss")</script>')
      expect(escaped).not.toContain('<script>')
      expect(escaped).toContain('&lt;')
    })

    it('renderMarkdown should convert headers', () => {
      const html = renderMarkdown('# Header 1\n## Header 2', data)
      expect(html).toContain('<h1>Header 1</h1>')
      expect(html).toContain('<h2>Header 2</h2>')
    })

    it('renderMarkdown should convert bold and italic', () => {
      const html = renderMarkdown('**bold** *italic*', data)
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('<em>italic</em>')
    })

    it('renderMarkdown should convert unordered lists', () => {
      const html = renderMarkdown('- item 1\n- item 2', data)
      expect(html).toContain('<ul>')
      expect(html).toContain('<li>item 1</li>')
      expect(html).toContain('<li>item 2</li>')
      expect(html).toContain('</ul>')
    })

    it('renderMarkdown should convert ordered lists', () => {
      const html = renderMarkdown('1. first\n2. second', data)
      expect(html).toContain('<ol>')
      expect(html).toContain('<li>first</li>')
      expect(html).toContain('<li>second</li>')
      expect(html).toContain('</ol>')
    })

    it('renderMarkdown should convert code blocks', () => {
      const html = renderMarkdown('```\ncode here\n```', data)
      expect(html).toContain('<pre class="code-block">')
    })

    it('renderMarkdown should convert inline code', () => {
      const html = renderMarkdown('`code`', data)
      expect(html).toContain('<code class="inline-code">')
    })

    it('renderMarkdown should convert tables', () => {
      const md = '| 列1 | 列2 |\n|-----|-----|\n|  a  |  b  |'
      const html = renderMarkdown(md, data)
      expect(html).toContain('<table>')
      expect(html).toContain('<th>列1</th>')
      expect(html).toContain('<td>a</td>')
    })

    it('renderMarkdown should convert external links', () => {
      const html = renderMarkdown('[link](https://example.com)', data)
      expect(html).toContain('<a href="https://example.com"')
      expect(html).toContain('target="_blank"')
    })

    it('renderMarkdown should convert valid internal links', () => {
      const html = renderMarkdown('[[笔记1]]', data)
      expect(html).toContain('class="internal-link"')
      expect(html).toContain('data-note-id="note1"')
      expect(html).not.toContain('broken')
    })

    it('renderMarkdown should mark broken internal links', () => {
      const html = renderMarkdown('[[不存在]]', data)
      expect(html).toContain('class="internal-link broken"')
      expect(html).toContain('data-create-new="true"')
    })

    it('renderMarkdown should wrap paragraphs', () => {
      const html = renderMarkdown('普通文本行', data)
      expect(html).toContain('<p>普通文本行</p>')
    })
  })

  describe('import/export', () => {
    it('importNote should extract title from filename', () => {
      const result = importNote('# Content', 'test.md')
      expect(result.title).toBe('test')
      expect(result.content).toBe('# Content')
    })

    it('importNote should handle filename without .md extension', () => {
      const result = importNote('content', 'test')
      expect(result.title).toBe('test')
    })

    it('exportNote should create export object', () => {
      const note = { title: 'Test', content: '# Content' }
      const result = exportNote(note)
      expect(result.filename).toBe('Test.md')
      expect(result.content).toBe('# Content')
    })

    it('exportNote should handle untitled note', () => {
      const note = { content: 'content' }
      const result = exportNote(note)
      expect(result.filename).toBe('untitled.md')
    })
  })

  describe('name validation', () => {
    let data
    beforeEach(() => {
      data = createSimpleTestData()
    })

    it('hasChildWithName should detect duplicate names', () => {
      const hasDuplicate = hasChildWithName(data, 'nb1', '文件夹1')
      expect(hasDuplicate).toBe(true)
    })

    it('hasChildWithName should exclude the given id', () => {
      const hasDuplicate = hasChildWithName(data, 'nb1', '文件夹1', 'folder1')
      expect(hasDuplicate).toBe(false)
    })

    it('hasRootNotebookWithName should detect duplicate notebook names', () => {
      const hasDuplicate = hasRootNotebookWithName(data, '测试笔记本')
      expect(hasDuplicate).toBe(true)
    })

    it('hasRootNotebookWithName should exclude the given id', () => {
      const hasDuplicate = hasRootNotebookWithName(data, '测试笔记本', 'nb1')
      expect(hasDuplicate).toBe(false)
    })
  })

  describe('immutability', () => {
    it('createNotebook should not mutate original data', () => {
      const data = createSimpleTestData()
      const frozen = JSON.stringify(data)
      createNotebook(data, '新笔记本')
      expect(JSON.stringify(data)).toBe(frozen)
    })

    it('createFolder should not mutate original data', () => {
      const data = createSimpleTestData()
      const frozen = JSON.stringify(data)
      createFolder(data, 'nb1', '新文件夹')
      expect(JSON.stringify(data)).toBe(frozen)
    })

    it('createNote should not mutate original data', () => {
      const data = createSimpleTestData()
      const frozen = JSON.stringify(data)
      createNote(data, 'nb1', '新笔记')
      expect(JSON.stringify(data)).toBe(frozen)
    })

    it('deleteNode should not mutate original data', () => {
      const data = createSimpleTestData()
      const frozen = JSON.stringify(data)
      deleteNode(data, 'note1')
      expect(JSON.stringify(data)).toBe(frozen)
    })

    it('moveNode should not mutate original data', () => {
      const data = createSimpleTestData()
      const frozen = JSON.stringify(data)
      moveNode(data, 'note2', 'nb1')
      expect(JSON.stringify(data)).toBe(frozen)
    })
  })
})
