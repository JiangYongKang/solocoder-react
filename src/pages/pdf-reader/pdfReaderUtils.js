import {
  STORAGE_KEY_STATE,
  STORAGE_KEY_BOOKMARKS,
  STORAGE_KEY_ZOOM,
  STORAGE_KEY_CUSTOM_DOC,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  LINES_PER_PAGE,
  DEFAULT_PAGE_WIDTH,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_MARGIN,
  CHAPTER_TITLE_REGEX,
} from './constants'
import { generateMockPages } from './mockDocument'

export function clampZoom(zoom) {
  if (zoom === null || zoom === undefined) return DEFAULT_ZOOM
  const z = Number(zoom)
  if (!isFinite(z)) return DEFAULT_ZOOM
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))
}

export function validatePageNumber(page, totalPages) {
  const p = Number(page)
  if (!isFinite(p) || !Number.isInteger(p)) return null
  if (p < 1 || p > totalPages) return null
  return p
}

export function saveCurrentPage(page) {
  try {
    const p = Number(page)
    if (isFinite(p) && p > 0) {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({ currentPage: Math.floor(p), savedAt: Date.now() }))
      return true
    }
  } catch {}
  return false
}

export function loadCurrentPage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATE)
    if (!raw) return 1
    const parsed = JSON.parse(raw)
    const p = Number(parsed?.currentPage)
    return isFinite(p) && p > 0 ? Math.floor(p) : 1
  } catch {
    return 1
  }
}

export function saveZoom(zoom) {
  try {
    localStorage.setItem(STORAGE_KEY_ZOOM, String(clampZoom(zoom)))
    return true
  } catch {
    return false
  }
}

export function loadZoom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ZOOM)
    if (!raw) return DEFAULT_ZOOM
    return clampZoom(Number(raw))
  } catch {
    return DEFAULT_ZOOM
  }
}

export function generateBookmarkId() {
  return 'bm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function createBookmark(page, title) {
  return {
    id: generateBookmarkId(),
    page: Number(page),
    title: (title || '').trim() || `第${page}页`,
    createdAt: Date.now(),
  }
}

export function saveBookmarks(bookmarks) {
  try {
    const valid = Array.isArray(bookmarks)
      ? bookmarks.filter(
          (b) =>
            b &&
            typeof b.id === 'string' &&
            isFinite(Number(b.page)) &&
            typeof b.title === 'string'
        )
      : []
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(valid))
    return true
  } catch {
    return false
  }
}

export function loadBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (b) =>
          b &&
          typeof b.id === 'string' &&
          isFinite(Number(b.page)) &&
          typeof b.title === 'string'
      )
      .map((b) => ({ ...b, page: Number(b.page) }))
  } catch {
    return []
  }
}

export function addBookmark(bookmarks, bookmark) {
  if (!Array.isArray(bookmarks)) bookmarks = []
  if (!bookmark || typeof bookmark !== 'object') return bookmarks
  return [...bookmarks, bookmark]
}

export function removeBookmark(bookmarks, bookmarkId) {
  if (!Array.isArray(bookmarks)) return []
  return bookmarks.filter((b) => b.id !== bookmarkId)
}

export function findBookmarkByPage(bookmarks, page) {
  if (!Array.isArray(bookmarks)) return null
  return bookmarks.find((b) => b.page === Number(page)) || null
}

export function isChapterTitle(line) {
  if (!line || typeof line !== 'string') return false
  const trimmed = line.trim()
  return CHAPTER_TITLE_REGEX.test(trimmed)
}

export function extractTableOfContents(pages) {
  if (!Array.isArray(pages)) return []
  const toc = []
  const seenTitles = new Set()
  pages.forEach((page, pageIndex) => {
    if (page?.isChapterStart && page?.chapterTitle && typeof page.chapterTitle === 'string') {
      const trimmed = page.chapterTitle.trim()
      if (trimmed && !seenTitles.has(trimmed)) {
        toc.push({
          title: trimmed,
          page: pageIndex + 1,
        })
        seenTitles.add(trimmed)
        return
      }
    }
    const content = page?.content || ''
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      if (isChapterTitle(line)) {
        const trimmed = line.trim()
        if (trimmed && !seenTitles.has(trimmed)) {
          toc.push({
            title: trimmed,
            page: pageIndex + 1,
          })
          seenTitles.add(trimmed)
        }
        break
      }
    }
  })
  return toc
}

export function splitTextToLines(text, maxWidth, fontSize) {
  if (!text || typeof text !== 'string') return []
  const lines = []
  const paragraphs = text.split(/\r?\n/)
  for (const para of paragraphs) {
    if (para === '') {
      lines.push('')
      continue
    }
    let currentLine = ''
    let currentWidth = 0
    for (const char of para) {
      const charWidth = /[\u4e00-\u9fa5]/.test(char) ? fontSize : fontSize * 0.5
      if (currentWidth + charWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine)
        currentLine = char
        currentWidth = charWidth
      } else {
        currentLine += char
        currentWidth += charWidth
      }
    }
    if (currentLine !== '') {
      lines.push(currentLine)
    }
  }
  return lines
}

export function paginatePlainText(text, linesPerPage = LINES_PER_PAGE) {
  if (typeof text !== 'string') return []
  const rawLines = text.split(/\r?\n/)
  const lines = rawLines.map((l) => l || '')
  const pages = []
  for (let i = 0; i < lines.length; i += linesPerPage) {
    const pageLines = lines.slice(i, i + linesPerPage)
    pages.push({
      content: pageLines.join('\n'),
      chapterTitle: '',
      chapterPageIndex: pages.length,
      isChapterStart: isChapterTitle(pageLines[0] || ''),
    })
  }
  if (pages.length === 0) {
    pages.push({
      content: '',
      chapterTitle: '',
      chapterPageIndex: 0,
      isChapterStart: false,
    })
  }
  return pages
}

export function searchTextInPages(pages, keyword) {
  if (!Array.isArray(pages) || !keyword || typeof keyword !== 'string') return []
  const kw = keyword.trim()
  if (!kw) return []
  const results = []
  const lowerKw = kw.toLowerCase()
  pages.forEach((page, pageIndex) => {
    const content = page?.content || ''
    const lowerContent = content.toLowerCase()
    let startIndex = 0
    while (true) {
      const idx = lowerContent.indexOf(lowerKw, startIndex)
      if (idx === -1) break
      results.push({
        page: pageIndex + 1,
        index: idx,
        length: kw.length,
      })
      startIndex = idx + kw.length
    }
  })
  return results
}

export function getSearchMatchesOnPage(pages, keyword, pageNumber) {
  const all = searchTextInPages(pages, keyword)
  return all.filter((r) => r.page === pageNumber)
}

export function getTotalSearchCount(results) {
  return Array.isArray(results) ? results.length : 0
}

export function getCurrentMatchIndex(results, currentPage, matchPosition = 0) {
  if (!Array.isArray(results) || results.length === 0) return -1
  return results.findIndex((r) => r.page === currentPage) + matchPosition
}

export function findNextMatch(results, currentIndex) {
  if (!Array.isArray(results) || results.length === 0) return null
  if (currentIndex < 0 || currentIndex >= results.length - 1) return results[0]
  return results[currentIndex + 1]
}

export function findPrevMatch(results, currentIndex) {
  if (!Array.isArray(results) || results.length === 0) return null
  if (currentIndex <= 0) return results[results.length - 1]
  return results[currentIndex - 1]
}

export function findFirstMatchFromPage(results, startPage) {
  if (!Array.isArray(results) || results.length === 0) return -1
  const page = Number(startPage)
  if (!isFinite(page) || page < 1) return 0
  const idx = results.findIndex((r) => r.page >= page)
  return idx === -1 ? 0 : idx
}

export function calculateFitWidthZoom(containerWidth, pageWidth = DEFAULT_PAGE_WIDTH) {
  const cw = Number(containerWidth)
  const pw = Number(pageWidth)
  if (!isFinite(cw) || !isFinite(pw) || pw <= 0 || cw <= 0) return DEFAULT_ZOOM
  return clampZoom(Math.floor((cw / pw) * 100))
}

export function calculateFitPageZoom(containerWidth, containerHeight, pageWidth = DEFAULT_PAGE_WIDTH, pageHeight = DEFAULT_PAGE_HEIGHT) {
  const cw = Number(containerWidth)
  const ch = Number(containerHeight)
  const pw = Number(pageWidth)
  const ph = Number(pageHeight)
  if (!isFinite(cw) || !isFinite(ch) || !isFinite(pw) || !isFinite(ph)) return DEFAULT_ZOOM
  if (pw <= 0 || ph <= 0 || cw <= 0 || ch <= 0) return DEFAULT_ZOOM
  const zoomW = (cw / pw) * 100
  const zoomH = (ch / ph) * 100
  return clampZoom(Math.floor(Math.min(zoomW, zoomH)))
}

export function saveCustomDocument(text) {
  try {
    if (typeof text === 'string') {
      localStorage.setItem(STORAGE_KEY_CUSTOM_DOC, text)
      return true
    }
  } catch {}
  return false
}

export function loadCustomDocument() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_DOC)
    return typeof raw === 'string' ? raw : ''
  } catch {
    return ''
  }
}

export function clearCustomDocument() {
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_DOC)
    return true
  } catch {
    return false
  }
}

export function initializePages() {
  const custom = loadCustomDocument()
  if (custom && custom.trim()) {
    return paginatePlainText(custom)
  }
  return generateMockPages()
}

export function measureTextLines(text, canvasWidth, fontSize = DEFAULT_FONT_SIZE, margin = DEFAULT_MARGIN) {
  const maxWidth = canvasWidth - margin * 2
  return splitTextToLines(text, maxWidth, fontSize)
}

export function getLineYPosition(lineIndex, fontSize = DEFAULT_FONT_SIZE, lineHeight = DEFAULT_LINE_HEIGHT, margin = DEFAULT_MARGIN) {
  return margin + fontSize + lineIndex * lineHeight
}

export function calculateRenderPageSize(zoom, pageWidth = DEFAULT_PAGE_WIDTH, pageHeight = DEFAULT_PAGE_HEIGHT) {
  const z = clampZoom(zoom) / 100
  return {
    width: Math.floor(pageWidth * z),
    height: Math.floor(pageHeight * z),
  }
}
