import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SnippetCard from './SnippetCard'
import SnippetModal from './SnippetModal'
import {
  LANGUAGE_LABELS,
  loadSnippets,
  saveSnippets,
  createSnippet,
  addSnippet,
  updateSnippet,
  deleteSnippet,
  toggleFavorite,
  getAllLanguages,
  filterSnippets,
  sortSnippets,
  snippetsToJson,
  jsonToSnippets,
  mergeSnippets,
  downloadJsonFile,
} from './snippetsUtils'
import './snippets.css'

function ConfirmDialog({ visible, title, message, confirmText, onCancel, onConfirm }) {
  if (!visible) return null
  return (
    <div className="sn-dialog-mask" onClick={onCancel}>
      <div className="sn-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="sn-dialog-title">{title}</h3>
        <p className="sn-dialog-message">{message}</p>
        <div className="sn-dialog-actions">
          <button type="button" className="sn-btn" onClick={onCancel}>取消</button>
          <button type="button" className="sn-btn sn-btn-danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

function ImportDialog({ visible, onCancel, onImport }) {
  const [mode, setMode] = useState('merge')
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  if (!visible) return null

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = jsonToSnippets(text)
      onImport(parsed, mode === 'overwrite')
      onCancel()
    } catch {
      setError('导入失败：JSON 格式不正确')
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  return (
    <div className="sn-dialog-mask" onClick={handleOverlayClick}>
      <div className="sn-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="sn-dialog-title">导入代码片段</h3>
        <p className="sn-dialog-message">选择要导入的 JSON 文件，并选择导入方式：</p>

        <div className="sn-radio-group">
          <label className="sn-radio-item">
            <input
              type="radio"
              name="import-mode"
              checked={mode === 'merge'}
              onChange={() => setMode('merge')}
            />
            <span>合并导入（保留现有数据，跳过重复 ID）</span>
          </label>
          <label className="sn-radio-item">
            <input
              type="radio"
              name="import-mode"
              checked={mode === 'overwrite'}
              onChange={() => setMode('overwrite')}
            />
            <span>覆盖导入（替换所有现有数据）</span>
          </label>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="sn-file-input"
        />

        {error && <p className="sn-form-error">{error}</p>}

        <div className="sn-dialog-actions">
          <button type="button" className="sn-btn" onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  )
}

function SnippetsPage() {
  const navigate = useNavigate()
  const [snippets, setSnippets] = useState(() => loadSnippets())
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [viewMode, setViewMode] = useState('card')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, title: '', message: '', onConfirm: null })
  const [importDialogVisible, setImportDialogVisible] = useState(false)

  useEffect(() => {
    saveSnippets(snippets)
  }, [snippets])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 1500)
  }, [])

  const allLanguages = useMemo(() => getAllLanguages(snippets), [snippets])

  const filteredSnippets = useMemo(() => {
    const filtered = filterSnippets(snippets, {
      language: selectedLanguage,
      searchTerm,
      favoriteOnly,
    })
    return sortSnippets(filtered, sortBy, sortOrder)
  }, [snippets, selectedLanguage, searchTerm, favoriteOnly, sortBy, sortOrder])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleNewSnippet = useCallback(() => {
    setEditingSnippet(null)
    setModalVisible(true)
  }, [])

  const handleEditSnippet = useCallback((snippet) => {
    setEditingSnippet(snippet)
    setModalVisible(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalVisible(false)
    setEditingSnippet(null)
  }, [])

  const handleSaveSnippet = useCallback((data) => {
    if (editingSnippet) {
      setSnippets((prev) => updateSnippet(prev, editingSnippet.id, data))
      showToast('已保存修改')
    } else {
      const newSnippet = createSnippet(data)
      setSnippets((prev) => addSnippet(prev, newSnippet))
      showToast('已创建新片段')
    }
    handleCloseModal()
  }, [editingSnippet, handleCloseModal, showToast])

  const handleToggleFavorite = useCallback((id) => {
    setSnippets((prev) => toggleFavorite(prev, id))
  }, [])

  const handleCopy = useCallback(() => {
    showToast('已复制')
  }, [showToast])

  const handleDelete = useCallback((id) => {
    setConfirmDialog({
      visible: true,
      title: '确认删除',
      message: '确定要删除这个代码片段吗？此操作不可撤销。',
      onConfirm: () => {
        setSnippets((prev) => deleteSnippet(prev, id))
        showToast('已删除')
        setConfirmDialog({ visible: false, title: '', message: '', onConfirm: null })
      },
    })
  }, [showToast])

  const handleExport = useCallback(() => {
    const json = snippetsToJson(snippets)
    const filename = `code-snippets-${new Date().toISOString().slice(0, 10)}.json`
    downloadJsonFile(json, filename)
    showToast('已导出')
  }, [snippets, showToast])

  const handleImport = useCallback((importedSnippets, overwrite) => {
    setSnippets((prev) => mergeSnippets(prev, importedSnippets, overwrite))
    showToast(overwrite ? '已覆盖导入' : '已合并导入')
  }, [showToast])

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
  }, [])

  return (
    <div className="sn-page">
      <div className="sn-header">
        <button className="sn-back-btn" onClick={handleBack} aria-label="返回首页">
          ← 返回首页
        </button>
        <h1 className="sn-title">代码片段管理器</h1>
      </div>

      <div className="sn-toolbar">
        <div className="sn-toolbar-left">
          <div className="sn-search">
            <input
              type="text"
              className="sn-search-input"
              placeholder="搜索标题或代码内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="sn-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">按创建时间</option>
            <option value="title">按名称</option>
          </select>
          <button className="sn-btn sn-btn-sm" onClick={handleSortOrderToggle}>
            {sortOrder === 'desc' ? '↓ 降序' : '↑ 升序'}
          </button>
        </div>
        <div className="sn-toolbar-right">
          <button
            className={`sn-btn sn-btn-sm ${favoriteOnly ? 'sn-btn-primary' : ''}`}
            onClick={() => setFavoriteOnly((prev) => !prev)}
          >
            {favoriteOnly ? '★ 仅收藏' : '☆ 收藏筛选'}
          </button>
          <div className="sn-view-toggle">
            <button
              className={`sn-btn sn-btn-sm ${viewMode === 'card' ? 'sn-btn-primary' : ''}`}
              onClick={() => setViewMode('card')}
            >
              卡片
            </button>
            <button
              className={`sn-btn sn-btn-sm ${viewMode === 'list' ? 'sn-btn-primary' : ''}`}
              onClick={() => setViewMode('list')}
            >
              列表
            </button>
          </div>
          <button className="sn-btn sn-btn-sm" onClick={handleExport}>导出 JSON</button>
          <button className="sn-btn sn-btn-sm" onClick={() => setImportDialogVisible(true)}>导入 JSON</button>
          <button className="sn-btn sn-btn-primary sn-btn-sm" onClick={handleNewSnippet}>
            + 新建片段
          </button>
        </div>
      </div>

      <div className="sn-lang-bar">
        <button
          className={`sn-lang-btn ${selectedLanguage === null ? 'is-active' : ''}`}
          onClick={() => setSelectedLanguage(null)}
        >
          全部 ({snippets.length})
        </button>
        {allLanguages.map((lang) => {
          const count = snippets.filter((s) => s.language === lang).length
          return (
            <button
              key={lang}
              className={`sn-lang-btn sn-lang-btn-${lang} ${selectedLanguage === lang ? 'is-active' : ''}`}
              onClick={() => setSelectedLanguage(lang)}
            >
              {LANGUAGE_LABELS[lang] || lang} ({count})
            </button>
          )
        })}
      </div>

      <div className="sn-content">
        {filteredSnippets.length === 0 ? (
          <div className="sn-empty">
            <div className="sn-empty-icon">{'</>'}</div>
            <p>暂无代码片段</p>
            <span>点击右上角「新建片段」添加你的第一个代码片段</span>
            <button className="sn-btn sn-btn-primary" onClick={handleNewSnippet}>
              + 新建片段
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="sn-list">
            {filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                viewMode="list"
                searchTerm={searchTerm}
                onToggleFavorite={handleToggleFavorite}
                onCopy={handleCopy}
                onEdit={handleEditSnippet}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="sn-grid">
            {filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                viewMode="card"
                searchTerm={searchTerm}
                onToggleFavorite={handleToggleFavorite}
                onCopy={handleCopy}
                onEdit={handleEditSnippet}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <SnippetModal
        key={`${modalVisible}-${editingSnippet?.id || 'new'}`}
        visible={modalVisible}
        snippet={editingSnippet}
        onClose={handleCloseModal}
        onSave={handleSaveSnippet}
      />

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="删除"
        onCancel={() => setConfirmDialog({ visible: false, title: '', message: '', onConfirm: null })}
        onConfirm={() => {
          confirmDialog.onConfirm?.()
        }}
      />

      <ImportDialog
        key={importDialogVisible}
        visible={importDialogVisible}
        onCancel={() => setImportDialogVisible(false)}
        onImport={handleImport}
      />

      {toast && <div className={`sn-toast sn-toast-${toast.type}`}>{toast.message}</div>}
    </div>
  )
}

export default SnippetsPage
