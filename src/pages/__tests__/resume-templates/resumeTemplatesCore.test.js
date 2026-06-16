import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MODULE_TYPES,
  TEMPLATES,
} from '../../resume-templates/constants'
import {
  generateId,
  escapeHtml,
  markdownToHtml,
  createModule,
  createDefaultModules,
  createDefaultResumeState,
  reorderModules,
  toggleModuleVisibility,
  toggleModuleExpanded,
  updateModuleContent,
  getVisibleModules,
  getModuleLabel,
  getModuleIcon,
  getTemplateById,
  filterTemplates,
  toggleFavorite,
  isFavorite,
  setRating,
  getRating,
  getAverageRating,
  generateResumeMarkdown,
  validateTemplate,
  validateModule,
} from '../../resume-templates/resumeTemplatesCore'

describe('generateId', () => {
  it('should generate string IDs', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('should generate unique IDs', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('should include the prefix', () => {
    const id = generateId('test')
    expect(id.startsWith('test_')).toBe(true)
  })
})

describe('escapeHtml', () => {
  it('should escape special HTML characters', () => {
    const input = '<div class="test">Hello & "world"</div>'
    const result = escapeHtml(input)
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).toContain('&amp;')
    expect(result).toContain('&quot;')
  })

  it('should return empty string for non-string input', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(123)).toBe('')
  })
})

describe('markdownToHtml', () => {
  it('should return empty string for non-string input', () => {
    expect(markdownToHtml(null)).toBe('')
    expect(markdownToHtml(undefined)).toBe('')
    expect(markdownToHtml(123)).toBe('')
  })

  it('should convert headings', () => {
    expect(markdownToHtml('# Heading 1')).toContain('<h1')
    expect(markdownToHtml('## Heading 2')).toContain('<h2')
    expect(markdownToHtml('### Heading 3')).toContain('<h3')
  })

  it('should convert bold text', () => {
    const result = markdownToHtml('**bold text**')
    expect(result).toContain('<strong>')
    expect(result).toContain('bold text')
  })

  it('should convert italic text', () => {
    const result = markdownToHtml('*italic text*')
    expect(result).toContain('<em>')
    expect(result).toContain('italic text')
  })

  it('should convert inline code', () => {
    const result = markdownToHtml('`code`')
    expect(result).toContain('<code')
    expect(result).toContain('code')
  })

  it('should convert code blocks', () => {
    const markdown = '```\nconst x = 1;\n```'
    const result = markdownToHtml(markdown)
    expect(result).toContain('<pre')
    expect(result).toContain('<code')
    expect(result).toContain('const x = 1;')
  })

  it('should convert unordered lists', () => {
    const markdown = '- item 1\n- item 2\n- item 3'
    const result = markdownToHtml(markdown)
    expect(result).toContain('<ul')
    expect(result).toContain('<li')
    expect(result).toContain('item 1')
    expect(result).toContain('item 2')
  })

  it('should convert ordered lists', () => {
    const markdown = '1. first\n2. second\n3. third'
    const result = markdownToHtml(markdown)
    expect(result).toContain('<ol')
    expect(result).toContain('<li')
    expect(result).toContain('first')
    expect(result).toContain('second')
  })

  it('should convert links', () => {
    const result = markdownToHtml('[link text](http://example.com)')
    expect(result).toContain('<a')
    expect(result).toContain('href="http://example.com"')
    expect(result).toContain('link text')
  })

  it('should convert images', () => {
    const result = markdownToHtml('![alt text](http://example.com/img.png)')
    expect(result).toContain('<img')
    expect(result).toContain('src="http://example.com/img.png"')
    expect(result).toContain('alt="alt text"')
  })

  it('should convert blockquotes', () => {
    const result = markdownToHtml('> quoted text')
    expect(result).toContain('<blockquote')
    expect(result).toContain('quoted text')
  })

  it('should convert horizontal rules', () => {
    expect(markdownToHtml('---')).toContain('<hr')
    expect(markdownToHtml('***')).toContain('<hr')
  })

  it('should convert paragraphs', () => {
    const result = markdownToHtml('Hello world')
    expect(result).toContain('<p')
    expect(result).toContain('Hello world')
  })

  it('should handle mixed content correctly', () => {
    const markdown = `# Title

Some **bold** and *italic* text.

## List Section

- item 1
- item 2
- item 3

\`\`\`
code block
\`\`\`

> quote

End.`
    const result = markdownToHtml(markdown)
    expect(result).toContain('<h1')
    expect(result).toContain('<h2')
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
    expect(result).toContain('<ul')
    expect(result).toContain('<pre')
    expect(result).toContain('<blockquote')
  })
})

describe('Module creation functions', () => {
  it('createModule should create a module with correct structure', () => {
    const mod = createModule(MODULE_TYPES.PERSONAL_INFO, '# Test')
    expect(mod.id).toBeDefined()
    expect(mod.type).toBe(MODULE_TYPES.PERSONAL_INFO)
    expect(mod.visible).toBe(true)
    expect(mod.expanded).toBe(false)
    expect(mod.content).toBe('# Test')
  })

  it('createModule should use default content when not provided', () => {
    const mod = createModule(MODULE_TYPES.PERSONAL_INFO)
    expect(mod.content).toBeDefined()
    expect(mod.content.length).toBeGreaterThan(0)
  })

  it('createDefaultModules should create all module types', () => {
    const modules = createDefaultModules()
    expect(Array.isArray(modules)).toBe(true)
    expect(modules.length).toBe(Object.keys(MODULE_TYPES).length)

    const types = modules.map((m) => m.type)
    Object.values(MODULE_TYPES).forEach((type) => {
      expect(types).toContain(type)
    })
  })

  it('createDefaultResumeState should return correct structure', () => {
    const state = createDefaultResumeState()
    expect(state.selectedTemplateId).toBe(TEMPLATES[0].id)
    expect(Array.isArray(state.modules)).toBe(true)
    expect(state.filterMode).toBe('all')
  })
})

describe('reorderModules', () => {
  it('should return empty array for non-array input', () => {
    expect(reorderModules(null, 0, 1)).toEqual([])
    expect(reorderModules(undefined, 0, 1)).toEqual([])
  })

  it('should return same array for invalid indices', () => {
    const mods = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(reorderModules(mods, -1, 1)).toEqual(mods)
    expect(reorderModules(mods, 0, 99)).toEqual(mods)
    expect(reorderModules(mods, 99, 0)).toEqual(mods)
  })

  it('should return same array when from and to are same', () => {
    const mods = [{ id: 'a' }, { id: 'b' }]
    expect(reorderModules(mods, 1, 1)).toEqual(mods)
  })

  it('should reorder moving forward', () => {
    const mods = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = reorderModules(mods, 0, 2)
    expect(result.map((m) => m.id)).toEqual(['b', 'c', 'a'])
  })

  it('should reorder moving backward', () => {
    const mods = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = reorderModules(mods, 2, 0)
    expect(result.map((m) => m.id)).toEqual(['c', 'a', 'b'])
  })

  it('should not mutate original array', () => {
    const mods = [{ id: 'a' }, { id: 'b' }]
    const originalIds = mods.map((m) => m.id)
    reorderModules(mods, 0, 1)
    expect(mods.map((m) => m.id)).toEqual(originalIds)
  })
})

describe('toggleModuleVisibility', () => {
  it('should return empty array for non-array input', () => {
    expect(toggleModuleVisibility(null, 'x')).toEqual([])
  })

  it('should toggle visibility of matching module', () => {
    const mods = [
      { id: 'a', visible: true },
      { id: 'b', visible: true },
    ]
    const result = toggleModuleVisibility(mods, 'a')
    expect(result[0].visible).toBe(false)
    expect(result[1].visible).toBe(true)
  })

  it('should not mutate original array', () => {
    const mods = [{ id: 'a', visible: true }]
    toggleModuleVisibility(mods, 'a')
    expect(mods[0].visible).toBe(true)
  })
})

describe('toggleModuleExpanded', () => {
  it('should return empty array for non-array input', () => {
    expect(toggleModuleExpanded(null, 'x')).toEqual([])
  })

  it('should toggle expanded state of matching module', () => {
    const mods = [
      { id: 'a', expanded: false },
      { id: 'b', expanded: false },
    ]
    const result = toggleModuleExpanded(mods, 'a')
    expect(result[0].expanded).toBe(true)
    expect(result[1].expanded).toBe(false)
  })
})

describe('updateModuleContent', () => {
  it('should return empty array for non-array input', () => {
    expect(updateModuleContent(null, 'x', '')).toEqual([])
  })

  it('should update content of matching module', () => {
    const mods = [
      { id: 'a', content: 'old' },
      { id: 'b', content: 'old' },
    ]
    const result = updateModuleContent(mods, 'a', 'new content')
    expect(result[0].content).toBe('new content')
    expect(result[1].content).toBe('old')
  })
})

describe('getVisibleModules', () => {
  it('should return empty array for non-array', () => {
    expect(getVisibleModules(null)).toEqual([])
    expect(getVisibleModules(undefined)).toEqual([])
  })

  it('should filter to only visible modules', () => {
    const mods = [
      { id: 'a', visible: true },
      { id: 'b', visible: false },
      { id: 'c', visible: true },
    ]
    const result = getVisibleModules(mods)
    expect(result.map((m) => m.id)).toEqual(['a', 'c'])
  })

  it('should filter out null/undefined entries', () => {
    const mods = [{ id: 'a', visible: true }, null, undefined]
    const result = getVisibleModules(mods)
    expect(result).toHaveLength(1)
  })
})

describe('getModuleLabel', () => {
  it('should return empty string for null', () => {
    expect(getModuleLabel(null)).toBe('')
  })

  it('should return correct label for known types', () => {
    expect(getModuleLabel({ type: MODULE_TYPES.PERSONAL_INFO })).toContain('个人信息')
    expect(getModuleLabel({ type: MODULE_TYPES.EDUCATION })).toContain('教育')
  })
})

describe('getModuleIcon', () => {
  it('should return empty string for null', () => {
    expect(getModuleIcon(null)).toBe('')
  })

  it('should return correct icon for known types', () => {
    expect(getModuleIcon({ type: MODULE_TYPES.PERSONAL_INFO })).toBe('👤')
    expect(getModuleIcon({ type: MODULE_TYPES.EDUCATION })).toBe('🎓')
  })

  it('should return default icon for unknown types', () => {
    expect(getModuleIcon({ type: 'unknown' })).toBe('📄')
  })
})

describe('getTemplateById', () => {
  it('should return correct template by id', () => {
    const template = getTemplateById(TEMPLATES[0].id)
    expect(template.id).toBe(TEMPLATES[0].id)
  })

  it('should return first template for invalid id', () => {
    const template = getTemplateById('invalid-id')
    expect(template.id).toBe(TEMPLATES[0].id)
  })
})

describe('filterTemplates', () => {
  it('should return empty array for non-array input', () => {
    expect(filterTemplates(null, 'all', {})).toEqual([])
  })

  it('should return all templates in "all" mode', () => {
    const result = filterTemplates(TEMPLATES, 'all', {})
    expect(result.length).toBe(TEMPLATES.length)
  })

  it('should return only favorite templates in "favorites" mode', () => {
    const favorites = { [TEMPLATES[0].id]: true, [TEMPLATES[2].id]: true }
    const result = filterTemplates(TEMPLATES, 'favorites', favorites)
    expect(result.length).toBe(2)
    expect(result.map((t) => t.id)).toContain(TEMPLATES[0].id)
    expect(result.map((t) => t.id)).toContain(TEMPLATES[2].id)
  })

  it('should return empty array when no favorites', () => {
    const result = filterTemplates(TEMPLATES, 'favorites', {})
    expect(result.length).toBe(0)
  })
})

describe('toggleFavorite', () => {
  it('should add favorite when not present', () => {
    const result = toggleFavorite({}, 'tpl1')
    expect(result.tpl1).toBe(true)
  })

  it('should remove favorite when present', () => {
    const result = toggleFavorite({ tpl1: true }, 'tpl1')
    expect(result.tpl1).toBeUndefined()
  })

  it('should not mutate original object', () => {
    const original = { tpl1: true }
    toggleFavorite(original, 'tpl2')
    expect(original.tpl2).toBeUndefined()
  })

  it('should handle null/undefined input', () => {
    expect(toggleFavorite(null, 'tpl1')).toEqual({ tpl1: true })
    expect(toggleFavorite(undefined, 'tpl1')).toEqual({ tpl1: true })
  })
})

describe('isFavorite', () => {
  it('should return false for null/undefined favorites', () => {
    expect(isFavorite(null, 'tpl1')).toBe(false)
    expect(isFavorite(undefined, 'tpl1')).toBe(false)
  })

  it('should return true for favorited template', () => {
    expect(isFavorite({ tpl1: true }, 'tpl1')).toBe(true)
  })

  it('should return false for non-favorited template', () => {
    expect(isFavorite({ tpl1: true }, 'tpl2')).toBe(false)
  })
})

describe('setRating', () => {
  it('should set rating for template', () => {
    const result = setRating({}, 'tpl1', 4)
    expect(result.tpl1).toBe(4)
  })

  it('should clamp rating between 1 and 5', () => {
    const result1 = setRating({}, 'tpl1', 0)
    expect(result1.tpl1).toBe(1)

    const result2 = setRating({}, 'tpl1', 10)
    expect(result2.tpl1).toBe(5)
  })

  it('should not mutate original object', () => {
    const original = { tpl1: 3 }
    setRating(original, 'tpl2', 4)
    expect(original.tpl2).toBeUndefined()
  })

  it('should handle null/undefined input', () => {
    const result = setRating(null, 'tpl1', 3)
    expect(result.tpl1).toBe(3)
  })
})

describe('getRating', () => {
  it('should return 0 for null/undefined ratings', () => {
    expect(getRating(null, 'tpl1')).toBe(0)
    expect(getRating(undefined, 'tpl1')).toBe(0)
  })

  it('should return rating for rated template', () => {
    expect(getRating({ tpl1: 4 }, 'tpl1')).toBe(4)
  })

  it('should return 0 for unrated template', () => {
    expect(getRating({ tpl1: 4 }, 'tpl2')).toBe(0)
  })
})

describe('getAverageRating', () => {
  it('should return 0 for null/undefined ratings', () => {
    expect(getAverageRating(null)).toBe(0)
    expect(getAverageRating(undefined)).toBe(0)
  })

  it('should return 0 when no ratings', () => {
    expect(getAverageRating({})).toBe(0)
  })

  it('should calculate average correctly', () => {
    const ratings = { tpl1: 4, tpl2: 5, tpl3: 3 }
    expect(getAverageRating(ratings)).toBe(4)
  })

  it('should ignore non-numeric and zero ratings', () => {
    const ratings = { tpl1: 4, tpl2: 0, tpl3: 'bad' }
    expect(getAverageRating(ratings)).toBe(4)
  })
})

describe('generateResumeMarkdown', () => {
  it('should generate markdown from visible modules', () => {
    const modules = [
      { id: 'a', type: MODULE_TYPES.PERSONAL_INFO, visible: true, content: '# Module A' },
      { id: 'b', type: MODULE_TYPES.EDUCATION, visible: false, content: '# Module B' },
      { id: 'c', type: MODULE_TYPES.WORK_EXPERIENCE, visible: true, content: '# Module C' },
    ]
    const result = generateResumeMarkdown(modules)
    expect(result).toContain('# Module A')
    expect(result).not.toContain('# Module B')
    expect(result).toContain('# Module C')
    expect(result).toContain('---')
  })
})

describe('validateTemplate', () => {
  it('should reject null/undefined/non-object', () => {
    expect(validateTemplate(null).valid).toBe(false)
    expect(validateTemplate(undefined).valid).toBe(false)
    expect(validateTemplate('string').valid).toBe(false)
  })

  it('should reject template without id', () => {
    expect(validateTemplate({ name: 'Test', primaryColor: '#000' }).valid).toBe(false)
  })

  it('should reject template without name', () => {
    expect(validateTemplate({ id: 'test', primaryColor: '#000' }).valid).toBe(false)
  })

  it('should reject template without primaryColor', () => {
    expect(validateTemplate({ id: 'test', name: 'Test' }).valid).toBe(false)
  })

  it('should accept valid template', () => {
    const valid = {
      id: 'test',
      name: 'Test Template',
      primaryColor: '#ff0000',
    }
    expect(validateTemplate(valid).valid).toBe(true)
  })
})

describe('validateModule', () => {
  it('should reject null/undefined/non-object', () => {
    expect(validateModule(null).valid).toBe(false)
    expect(validateModule(undefined).valid).toBe(false)
    expect(validateModule('string').valid).toBe(false)
  })

  it('should reject module without id', () => {
    expect(validateModule({ type: 'test', visible: true, content: '' }).valid).toBe(false)
  })

  it('should reject module without type', () => {
    expect(validateModule({ id: 'test', visible: true, content: '' }).valid).toBe(false)
  })

  it('should reject module with non-boolean visible', () => {
    expect(validateModule({ id: 'test', type: 'test', visible: 'yes', content: '' }).valid).toBe(false)
  })

  it('should reject module with non-string content', () => {
    expect(validateModule({ id: 'test', type: 'test', visible: true, content: 123 }).valid).toBe(false)
  })

  it('should accept valid module', () => {
    const valid = {
      id: 'mod_123',
      type: MODULE_TYPES.PERSONAL_INFO,
      visible: true,
      content: '# Test',
    }
    expect(validateModule(valid).valid).toBe(true)
  })
})
