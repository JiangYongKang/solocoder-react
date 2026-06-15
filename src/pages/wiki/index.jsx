import { useCallback, useEffect, useRef, useState } from 'react'
import { DEBOUNCE_DELAY } from './constants.js'
import MarkdownEditor from './MarkdownEditor.jsx'
import MemberPanel from './MemberPanel.jsx'
import PageTree from './PageTree.jsx'
import SearchResults from './SearchResults.jsx'
import SpaceSidebar from './SpaceSidebar.jsx'
import TagCloud from './TagCloud.jsx'
import VersionSidebar from './VersionSidebar.jsx'
import './wiki.css'
import {
    addTagToPage,
    createPage,
    createSpace,
    deletePage,
    deleteSpace,
    getCurrentUser,
    getPageById,
    getPagePath,
    loadData,
    removeTagFromPage,
    saveData,
    savePageVersion,
    updatePage,
    updateSpace,
} from './wikiUtils.js'

export default function WikiPage() {
  const [data, setData] = useState(() => loadData())
  const [selectedSpaceId, setSelectedSpaceId] = useState(() => data.spaces[0]?.id || null)
  const [selectedPageId, setSelectedPageId] = useState(() => {
    const spacePages = data.pages.filter((p) => p.spaceId === data.spaces[0]?.id)
    return spacePages[0]?.id || null
  })

  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState({})
  const [selectedTag, setSelectedTag] = useState(null)
  const [showVersionSidebar, setShowVersionSidebar] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showMemberPanel, setShowMemberPanel] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')

  const saveTimeoutRef = useRef(null)
  const versionTimeoutRef = useRef(null)
  const [activeSearchKeyword, setActiveSearchKeyword] = useState('')

  const selectedPage = getPageById(data, selectedPageId)
  const currentUser = getCurrentUser(data)
  const pagePath = selectedPage ? getPagePath(data, selectedPageId) : []

  const debouncedSaveData = useCallback((dataToSave) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveData(dataToSave)
    }, DEBOUNCE_DELAY)
  }, [])

  useEffect(() => {
    debouncedSaveData(data)
  }, [data, debouncedSaveData])

  const debouncedSaveVersion = useCallback((pageId) => {
    if (versionTimeoutRef.current) {
      clearTimeout(versionTimeoutRef.current)
    }
    versionTimeoutRef.current = setTimeout(() => {
      setData((prevData) => savePageVersion(prevData, pageId))
    }, DEBOUNCE_DELAY)
  }, [])

  useEffect(() => {
    const saveRef = saveTimeoutRef
    const verRef = versionTimeoutRef
    return () => {
      if (saveRef.current) clearTimeout(saveRef.current)
      if (verRef.current) clearTimeout(verRef.current)
    }
  }, [])

  const handleSelectSpace = (spaceId) => {
    setSelectedSpaceId(spaceId)
    setSelectedTag(null)
    const spacePages = data.pages.filter((p) => p.spaceId === spaceId)
    const firstPageId = spacePages.find((p) => !p.parentId)?.id || spacePages[0]?.id || null
    setSelectedPageId(firstPageId)
  }

  const handleCreateSpace = (name, description) => {
    const newData = createSpace(data, name, description)
    setData(newData)
    const newSpace = newData.spaces.find((s) => s.name === name)
    if (newSpace) {
      setSelectedSpaceId(newSpace.id)
      setSelectedPageId(null)
    }
  }

  const handleUpdateSpace = (spaceId, updates) => {
    setData(updateSpace(data, spaceId, updates))
  }

  const handleDeleteSpace = (spaceId) => {
    const newData = deleteSpace(data, spaceId)
    setData(newData)
    if (selectedSpaceId === spaceId) {
      const firstSpaceId = newData.spaces[0]?.id || null
      setSelectedSpaceId(firstSpaceId)
      const firstPageId = firstSpaceId
        ? newData.pages.find((p) => p.spaceId === firstSpaceId)?.id || null
        : null
      setSelectedPageId(firstPageId)
    }
  }

  const handleCreateRootPage = (title) => {
    const newData = createPage(data, selectedSpaceId, null, title)
    setData(newData)
    const newPage = newData.pages.find((p) => p.title === title && p.parentId === null && p.spaceId === selectedSpaceId)
    if (newPage) {
      setSelectedPageId(newPage.id)
    }
  }

  const handleCreateChildPage = (parentId, title) => {
    const newData = createPage(data, selectedSpaceId, parentId, title)
    setData(newData)
    setExpandedNodes((prev) => ({ ...prev, [parentId]: true }))
    const newPage = newData.pages.find((p) => p.title === title && p.parentId === parentId)
    if (newPage) {
      setSelectedPageId(newPage.id)
    }
  }

  const handleDeletePage = (pageId) => {
    const pageToDelete = getPageById(data, pageId)
    const newData = deletePage(data, pageId)
    setData(newData)
    if (selectedPageId === pageId) {
      const spacePages = newData.pages.filter((p) => p.spaceId === pageToDelete.spaceId)
      const firstPageId = spacePages.find((p) => !p.parentId)?.id || spacePages[0]?.id || null
      setSelectedPageId(firstPageId)
    }
  }

  const handleTitleChange = (title) => {
    if (!selectedPageId) return
    setData(updatePage(data, selectedPageId, { title }))
    debouncedSaveVersion(selectedPageId)
  }

  const handleContentChange = (content) => {
    if (!selectedPageId) return
    setData(updatePage(data, selectedPageId, { content }))
    debouncedSaveVersion(selectedPageId)
  }

  const handleToggleExpand = (pageId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }))
  }

  const handleSelectSearchResult = (result) => {
    setSelectedSpaceId(result.spaceId)
    setSelectedPageId(result.pageId)
    setActiveSearchKeyword(result.matchedKeyword || '')
    setShowSearchResults(false)
  }

  const handleAddTag = () => {
    if (!selectedPageId || !newTagInput.trim()) return
    setData(addTagToPage(data, selectedPageId, newTagInput.trim()))
    setNewTagInput('')
  }

  const handleRemoveTag = (tag) => {
    if (!selectedPageId) return
    setData(removeTagFromPage(data, selectedPageId, tag))
  }

  const handleUpdateData = (newData) => {
    setData(newData)
  }

  return (
    <div className="wiki-container">
      <SpaceSidebar
        data={data}
        selectedSpaceId={selectedSpaceId}
        onSelectSpace={handleSelectSpace}
        onCreateSpace={handleCreateSpace}
        onUpdateSpace={handleUpdateSpace}
        onDeleteSpace={handleDeleteSpace}
        globalSearchQuery={globalSearchQuery}
        onGlobalSearch={setGlobalSearchQuery}
        onOpenSearch={() => setShowSearchResults(true)}
      />

      <div className="wiki-main">
        <div className="wiki-main-header">
          <div className="wiki-breadcrumb">
            <span
              className="wiki-breadcrumb-item wiki-breadcrumb-space"
              onClick={() => setShowMemberPanel(true)}
              title="查看空间成员"
            >
              📁 {data.spaces.find((s) => s.id === selectedSpaceId)?.name || '未选择空间'}
            </span>
            {pagePath.map((item, index) => (
              <span key={item.id}>
                <span className="wiki-breadcrumb-separator">/</span>
                <span
                  className={`wiki-breadcrumb-item ${index === pagePath.length - 1 ? 'active' : ''}`}
                  onClick={() => setSelectedPageId(item.id)}
                >
                  {item.title}
                </span>
              </span>
            ))}
          </div>
          <div className="wiki-header-actions">
            {currentUser && (
              <div className="wiki-user-info">
                <img src={currentUser.avatar} alt={currentUser.name} className="wiki-user-avatar" />
                <span className="wiki-user-name">{currentUser.name}</span>
              </div>
            )}
            {selectedPage && (
              <button
                className="wiki-btn wiki-btn-secondary wiki-btn-sm"
                onClick={() => setShowVersionSidebar(true)}
              >
                📜 历史版本 ({selectedPage.versions?.length || 0})
              </button>
            )}
          </div>
        </div>

        <div className="wiki-content">
          {selectedSpaceId && (
            <>
              <div className="wiki-left-panel">
                <PageTree
                  data={data}
                  spaceId={selectedSpaceId}
                  selectedPageId={selectedPageId}
                  selectedTag={selectedTag}
                  expandedNodes={expandedNodes}
                  onSelectPage={setSelectedPageId}
                  onToggleExpand={handleToggleExpand}
                  onCreateRoot={handleCreateRootPage}
                  onCreateChild={handleCreateChildPage}
                  onDeletePage={handleDeletePage}
                />
                <TagCloud
                  data={data}
                  spaceId={selectedSpaceId}
                  selectedTag={selectedTag}
                  onSelectTag={setSelectedTag}
                />
              </div>

              <div className="wiki-right-panel">
                {selectedPage ? (
                  <>
                    <MarkdownEditor
                      title={selectedPage.title}
                      content={selectedPage.content}
                      onTitleChange={handleTitleChange}
                      onContentChange={handleContentChange}
                      searchKeyword={activeSearchKeyword}
                    />
                    <div className="wiki-tags-section">
                      <div className="wiki-tags-title">标签</div>
                      <div className="wiki-tags-list">
                        {selectedPage.tags?.map((tag) => (
                          <span key={tag} className="wiki-tag wiki-tag-active">
                            {tag}
                            <button
                              className="wiki-tag-close"
                              onClick={() => handleRemoveTag(tag)}
                              title="删除标签"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <div className="wiki-tag-input-wrapper">
                          <input
                            type="text"
                            className="wiki-tag-input"
                            placeholder="添加标签..."
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddTag()
                            }}
                          />
                          {newTagInput.trim() && (
                            <button
                              className="wiki-tag-add-btn"
                              onClick={handleAddTag}
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="wiki-empty-state">
                    <div className="wiki-empty-icon">📝</div>
                    <div className="wiki-empty-text">
                      {selectedSpaceId
                        ? '该空间暂无页面，点击左侧 + 按钮创建第一个页面'
                        : '请先选择或创建一个空间'}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedSpaceId && (
            <div className="wiki-empty-state">
              <div className="wiki-empty-icon">🏠</div>
              <div className="wiki-empty-text">请选择或创建一个空间开始使用</div>
            </div>
          )}
        </div>
      </div>

      <VersionSidebar
        isOpen={showVersionSidebar}
        onClose={() => setShowVersionSidebar(false)}
        page={selectedPage}
        data={data}
        onUpdateData={handleUpdateData}
      />

      <SearchResults
        isOpen={showSearchResults}
        onClose={() => setShowSearchResults(false)}
        data={data}
        searchQuery={globalSearchQuery}
        onSelectResult={handleSelectSearchResult}
      />

      <MemberPanel
        isOpen={showMemberPanel}
        onClose={() => setShowMemberPanel(false)}
        data={data}
        spaceId={selectedSpaceId}
      />
    </div>
  )
}
