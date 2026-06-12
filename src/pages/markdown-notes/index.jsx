import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './markdown-notes.css'
import TreeView from './TreeView.jsx'
import ContextMenu from './ContextMenu.jsx'
import Editor from './Editor.jsx'
import Preview from './Preview.jsx'
import TagBar from './TagBar.jsx'
import TagList from './TagList.jsx'
import SearchBar from './SearchBar.jsx'
import Toolbar from './Toolbar.jsx'
import { NODE_TYPES, AUTOSAVE_DELAY } from './constants.js'
import {
  loadData,
  saveData,
  loadUIState,
  saveUIState,
  getNode,
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
  buildSearchIndex,
  searchNotes,
  findNoteByTitle,
  updateLinksOnRename,
  markLinksBrokenOnDelete,
  importNote,
  exportNote,
  exportNotebook,
  hasChildWithName,
  hasRootNotebookWithName,
} from './noteUtils.js'

export default function MarkdownNotes() {
  const [data, setData] = useState(() => loadData())
  const [uiState, setUiState] = useState(() => loadUIState())
  const [searchQuery, setSearchQuery] = useState('')
  const [contextMenu, setContextMenu] = useState({ x: null, y: null, node: null })
  const [isResizing, setIsResizing] = useState(false)
  const saveTimeoutRef = useRef(null)
  const containerRef = useRef(null)
  const currentDataVersionRef = useRef(0)
  const latestDataRef = useRef(data)

  const searchIndex = useMemo(() => buildSearchIndex(data), [data])
  const searchResults = useMemo(() => searchNotes(searchIndex, searchQuery), [searchIndex, searchQuery])
  const allTags = useMemo(() => getAllTags(data), [data])
  const selectedNote = uiState.selectedNoteId ? getNode(data, uiState.selectedNoteId) : null

  const selectedNotebookId = useMemo(() => {
    if (!uiState.selectedNoteId) return null
    let current = getNode(data, uiState.selectedNoteId)
    while (current && current.parentId) {
      current = getNode(data, current.parentId)
    }
    return current?.id || null
  }, [data, uiState.selectedNoteId])

  const currentParentId = useMemo(() => {
    if (uiState.selectedNoteId) {
      const note = getNode(data, uiState.selectedNoteId)
      if (note && note.parentId) return note.parentId
    }
    if (data.rootNotebooks.length > 0) return data.rootNotebooks[0]
    return null
  }, [data, uiState.selectedNoteId])

  useEffect(() => {
    latestDataRef.current = data
  }, [data])

  useEffect(() => {
    saveUIState(uiState)
  }, [uiState])

  const commitData = useCallback((newData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    latestDataRef.current = newData
    currentDataVersionRef.current += 1
    saveData(newData)
    return newData
  }, [])

  const updateData = useCallback((updater) => {
    let result
    setData((prev) => {
      result = updater(prev)
      commitData(result)
      return result
    })
  }, [commitData])

  const flushPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
      saveData(latestDataRef.current)
    }
  }, [])

  const debouncedSave = useCallback((newData) => {
    latestDataRef.current = newData
    currentDataVersionRef.current += 1
    const saveVersion = currentDataVersionRef.current

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (saveVersion === currentDataVersionRef.current) {
        saveData(latestDataRef.current)
      }
      saveTimeoutRef.current = null
    }, AUTOSAVE_DELAY)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  function handleSelectNote(noteId) {
    flushPendingSave()
    setUiState((prev) => ({ ...prev, selectedNoteId: noteId }))
    setSearchQuery('')
  }

  function handleToggleNode(nodeId) {
    updateData((prev) => toggleExpanded(prev, nodeId))
  }

  function handleContextMenu(e, node) {
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }

  function closeContextMenu() {
    setContextMenu({ x: null, y: null, node: null })
  }

  function getContextMenuItems() {
    if (!contextMenu.node) return []
    const node = contextMenu.node
    const items = []

    if (node.type === NODE_TYPES.NOTEBOOK) {
      items.push(
        { label: '新建文件夹', onClick: () => handleCreateFolder(node.id) },
        { label: '新建笔记', onClick: () => handleCreateNote(node.id) }
      )
    } else if (node.type === NODE_TYPES.FOLDER) {
      items.push(
        { label: '新建文件夹', onClick: () => handleCreateFolder(node.id) },
        { label: '新建笔记', onClick: () => handleCreateNote(node.id) }
      )
    }

    items.push({ divider: true })
    items.push({ label: '重命名', onClick: () => handleStartRename(node.id) })

    if (node.type === NODE_TYPES.NOTE) {
      items.push({ label: '导出笔记', onClick: () => handleExportNote(node.id) })
    } else if (node.type === NODE_TYPES.NOTEBOOK) {
      items.push({ label: '导出笔记本', onClick: () => handleExportNotebook(node.id) })
    }

    items.push({ divider: true })
    items.push({ label: '删除', danger: true, onClick: () => handleDelete(node.id) })

    return items
  }

  function handleCreateNotebook() {
    const name = prompt('输入笔记本名称:', '新笔记本')
    if (!name?.trim()) return
    if (hasRootNotebookWithName(data, name.trim())) {
      alert('已存在同名笔记本')
      return
    }
    updateData((prev) => createNotebook(prev, name.trim()))
  }

  function handleCreateFolder(parentId) {
    if (!parentId) return
    const name = prompt('输入文件夹名称:', '新文件夹')
    if (!name?.trim()) return
    if (hasChildWithName(data, parentId, name.trim())) {
      alert('该文件夹下已存在同名项目')
      return
    }
    updateData((prev) => createFolder(prev, parentId, name.trim()))
  }

  function handleCreateNote(parentId, title = '新笔记', content = '') {
    if (!parentId) return
    let noteTitle = title
    let counter = 1
    while (hasChildWithName(data, parentId, noteTitle)) {
      noteTitle = `${title} ${counter++}`
    }
    let capturedNoteId = null
    updateData((prev) => {
      const newData = createNote(prev, parentId, noteTitle, content)
      capturedNoteId = Object.keys(newData.nodes).find(
        (id) => !prev.nodes[id] && newData.nodes[id].type === NODE_TYPES.NOTE
      )
      return newData
    })
    if (capturedNoteId) {
      setUiState((uiPrev) => ({ ...uiPrev, selectedNoteId: capturedNoteId }))
    }
  }

  function handleStartRename(nodeId) {
    const node = getNode(data, nodeId)
    if (!node) return
    const currentName = node.type === NODE_TYPES.NOTE ? node.title : node.name
    const newName = prompt('输入新名称:', currentName)
    if (!newName?.trim() || newName.trim() === currentName) return

    const parentId = node.parentId
    if (parentId && hasChildWithName(data, parentId, newName.trim(), nodeId)) {
      alert('该文件夹下已存在同名项目')
      return
    }
    if (!parentId && node.type === NODE_TYPES.NOTEBOOK && hasRootNotebookWithName(data, newName.trim(), nodeId)) {
      alert('已存在同名笔记本')
      return
    }

    updateData((prev) => {
      let newData = renameNode(prev, nodeId, newName.trim())
      if (node.type === NODE_TYPES.NOTE) {
        newData = updateLinksOnRename(newData, currentName, newName.trim())
      }
      return newData
    })
  }

  function handleDelete(nodeId) {
    const node = getNode(data, nodeId)
    if (!node) return
    const nodeName = node.type === NODE_TYPES.NOTE ? node.title : node.name
    const confirmMsg = node.type === NODE_TYPES.NOTEBOOK
      ? `确定要删除笔记本 "${nodeName}" 及其所有内容吗？`
      : node.type === NODE_TYPES.FOLDER
        ? `确定要删除文件夹 "${nodeName}" 及其所有内容吗？`
        : `确定要删除笔记 "${nodeName}" 吗？`

    if (!confirm(confirmMsg)) return

    updateData((prev) => {
      let newData = prev
      if (node.type === NODE_TYPES.NOTE) {
        newData = markLinksBrokenOnDelete(prev, node.title)
      }
      newData = deleteNode(newData, nodeId)
      return newData
    })

    if (uiState.selectedNoteId === nodeId) {
      setUiState((prev) => ({ ...prev, selectedNoteId: null }))
    }
  }

  function handleRenameNode(nodeId, newName) {
    const node = getNode(data, nodeId)
    if (!node) return
    const currentName = node.type === NODE_TYPES.NOTE ? node.title : node.name
    if (!newName?.trim() || newName.trim() === currentName) return

    const parentId = node.parentId
    if (parentId && hasChildWithName(data, parentId, newName.trim(), nodeId)) {
      alert('该文件夹下已存在同名项目')
      return
    }
    if (!parentId && node.type === NODE_TYPES.NOTEBOOK && hasRootNotebookWithName(data, newName.trim(), nodeId)) {
      alert('已存在同名笔记本')
      return
    }

    updateData((prev) => {
      let newData = renameNode(prev, nodeId, newName.trim())
      if (node.type === NODE_TYPES.NOTE) {
        newData = updateLinksOnRename(newData, currentName, newName.trim())
      }
      return newData
    })
  }

  function handleMoveNode(draggedId, targetId) {
    updateData((prev) => moveNode(prev, draggedId, targetId))
  }

  function handleNoteContentChange(content) {
    if (!uiState.selectedNoteId) return
    setData((prev) => {
      const newData = updateNoteContent(prev, uiState.selectedNoteId, content)
      debouncedSave(newData)
      return newData
    })
  }

  function handleAddTag(tag) {
    if (!uiState.selectedNoteId) return
    updateData((prev) => addTagToNote(prev, uiState.selectedNoteId, tag))
  }

  function handleRemoveTag(tag) {
    if (!uiState.selectedNoteId) return
    updateData((prev) => removeTagFromNote(prev, uiState.selectedNoteId, tag))
  }

  function handleTagClick(tagName) {
    setUiState((prev) => {
      const activeTags = prev.activeTags.includes(tagName)
        ? prev.activeTags.filter((t) => t !== tagName)
        : [...prev.activeTags, tagName]
      return { ...prev, activeTags }
    })
  }

  function handleNoteLinkClick({ noteId, noteTitle, createNew }) {
    if (createNew) {
      if (confirm(`笔记 "${noteTitle}" 不存在，是否创建？`)) {
        handleCreateNote(currentParentId, noteTitle, `# ${noteTitle}\n\n`)
      }
    } else if (noteId) {
      handleSelectNote(noteId)
    } else {
      const existing = findNoteByTitle(data, noteTitle)
      if (existing) {
        handleSelectNote(existing.id)
      }
    }
  }

  function handleSearchChange(query) {
    setSearchQuery(query)
    setUiState((prev) => ({ ...prev, searchQuery: query }))
  }

  function handleSearchResultClick(result) {
    handleSelectNote(result.id)
  }

  function handleImport(content, filename) {
    if (!currentParentId) {
      alert('请先选择一个笔记本或文件夹')
      return
    }
    const imported = importNote(content, filename)
    handleCreateNote(currentParentId, imported.title, imported.content)
  }

  function handleExportNote(noteId = uiState.selectedNoteId) {
    const note = noteId ? getNode(data, noteId) : selectedNote
    if (!note) return
    const exported = exportNote(note)
    downloadBlob(exported.blob, exported.filename)
  }

  function handleExportNotebook(notebookId) {
    if (!notebookId) return
    const exported = exportNotebook(data, notebookId)
    downloadBlob(exported.blob, exported.filename)
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleResizeStart() {
    setIsResizing(true)
  }

  useEffect(() => {
    if (!isResizing) return

    function handleMouseMove(e) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const containerWidth = rect.width - 4
      const ratio = Math.min(Math.max((e.clientX - rect.left) / containerWidth, 0.2), 0.8)
      setUiState((prev) => ({ ...prev, panelRatio: ratio }))
    }

    function handleMouseUp() {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  return (
    <div className="markdown-notes" ref={containerRef}>
      <header className="markdown-notes-header">
        <h1>📝 Markdown 笔记</h1>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          onResultClick={handleSearchResultClick}
          results={searchResults}
        />
        <Toolbar
          onImport={handleImport}
          onExportNote={handleExportNote}
          onExportNotebook={handleExportNotebook}
          selectedNote={selectedNote}
          selectedNotebookId={selectedNotebookId}
          onCreateNotebook={handleCreateNotebook}
          onCreateFolder={handleCreateFolder}
          onCreateNote={handleCreateNote}
          currentParentId={currentParentId}
        />
      </header>

      <div className="markdown-notes-body">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>目录</h3>
            <div className="sidebar-actions">
              <button
                className="icon-btn"
                onClick={handleCreateNotebook}
                title="新建笔记本"
              >
                📒
              </button>
              <button
                className="icon-btn"
                onClick={() => handleCreateFolder(currentParentId)}
                title="新建文件夹"
              >
                📁
              </button>
              <button
                className="icon-btn"
                onClick={() => handleCreateNote(currentParentId)}
                title="新建笔记"
              >
                ➕
              </button>
            </div>
          </div>
          <TreeView
            data={data}
            selectedNoteId={uiState.selectedNoteId}
            onSelectNote={handleSelectNote}
            onToggleNode={handleToggleNode}
            onContextMenu={handleContextMenu}
            onRenameNode={handleRenameNode}
            onMoveNode={handleMoveNode}
          />
          <TagList
            tags={allTags}
            activeTags={uiState.activeTags}
            onTagClick={handleTagClick}
          />
        </aside>

        <main className="main-area">
          {selectedNote ? (
            <div className="editor-container">
              <div
                className="editor-panel"
                style={{ flex: uiState.panelRatio }}
              >
                <div className="panel-header">
                  <input
                    className="note-title-input"
                    value={selectedNote.title}
                    onChange={(e) => handleRenameNode(selectedNote.id, e.target.value)}
                    placeholder="笔记标题"
                  />
                </div>
                <TagBar
                  tags={selectedNote.tags || []}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                />
                <Editor
                  content={selectedNote.content}
                  onChange={handleNoteContentChange}
                />
              </div>
              <div
                className={`resize-handle ${isResizing ? 'active' : ''}`}
                onMouseDown={handleResizeStart}
              />
              <div
                className="editor-panel"
                style={{ flex: 1 - uiState.panelRatio }}
              >
                <div className="panel-header">
                  <span style={{ fontSize: '13px', color: '#888' }}>
                    预览
                  </span>
                </div>
                <Preview
                  content={selectedNote.content}
                  data={data}
                  searchQuery={searchQuery}
                  onNoteLinkClick={handleNoteLinkClick}
                />
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <div className="empty-state-text">
                选择一篇笔记开始编辑，或创建新笔记
              </div>
            </div>
          )}
        </main>
      </div>

      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        items={getContextMenuItems()}
        onClose={closeContextMenu}
      />
    </div>
  )
}
