import { useState, useCallback, useEffect } from 'react'
import { useFileSystem } from './useFileSystem'
import FolderTree from './FolderTree'
import Breadcrumb from './Breadcrumb'
import Toolbar from './Toolbar'
import FileList from './FileList'
import ContextMenu from './ContextMenu'
import { InputDialog, ConfirmDialog } from './Dialogs'
import './FileManager.css'

function FileManager({ onBack }) {
  const fs = useFileSystem()
  const [selectedId, setSelectedId] = useState(null)
  const [contextMenu, setContextMenu] = useState({ visible: false, position: { x: 0, y: 0 }, target: null })
  const [inputDialog, setInputDialog] = useState({ visible: false, mode: null, target: null })
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, target: null })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleItemClick = useCallback((item) => {
    setSelectedId(item.id)
    if (item.type === 'folder') {
      fs.selectFolder(item.id)
    }
  }, [fs])

  const handleItemContextMenu = useCallback((e, item) => {
    e.preventDefault()
    setSelectedId(item.id)
    const x = Math.min(e.clientX, window.innerWidth - 180)
    const y = Math.min(e.clientY, window.innerHeight - 180)
    setContextMenu({
      visible: true,
      position: { x, y },
      target: item,
    })
  }, [])

  const handleContentContextMenu = useCallback((e) => {
    e.preventDefault()
    setSelectedId(null)
    const x = Math.min(e.clientX, window.innerWidth - 180)
    const y = Math.min(e.clientY, window.innerHeight - 180)
    setContextMenu({
      visible: true,
      position: { x, y },
      target: null,
    })
  }, [])

  const handleMenuAction = useCallback((action, targetNode) => {
    switch (action) {
      case 'newFolder':
        setInputDialog({ visible: true, mode: 'newFolder', target: targetNode })
        break
      case 'newFile':
        setInputDialog({ visible: true, mode: 'newFile', target: targetNode })
        break
      case 'rename':
        if (targetNode) {
          setInputDialog({ visible: true, mode: 'rename', target: targetNode })
        }
        break
      case 'delete':
        if (targetNode) {
          setConfirmDialog({ visible: true, target: targetNode })
        }
        break
      default:
        break
    }
  }, [])

  const handleInputConfirm = useCallback((value) => {
    const { mode, target } = inputDialog
    const parentId = target ? target.id : fs.currentFolderId
    let result
    switch (mode) {
      case 'newFolder':
        result = fs.handleCreateFolder(parentId, value)
        break
      case 'newFile':
        result = fs.handleCreateFile(parentId, value)
        break
      case 'rename':
        if (target) {
          result = fs.handleRename(target.id, value)
        }
        break
      default:
        break
    }
    if (result && !result.success) {
      showToast(result.error || '操作失败')
    }
    setInputDialog({ visible: false, mode: null, target: null })
  }, [inputDialog, fs, showToast])

  const handleDeleteConfirm = useCallback(() => {
    if (confirmDialog.target) {
      const result = fs.handleDelete(confirmDialog.target.id)
      if (!result.success) {
        showToast(result.error || '删除失败')
      }
      if (selectedId === confirmDialog.target.id) {
        setSelectedId(null)
      }
    }
    setConfirmDialog({ visible: false, target: null })
  }, [confirmDialog, fs, selectedId, showToast])

  const handleSort = useCallback((key) => {
    fs.setSort(key)
  }, [fs])

  const items = fs.getCurrentChildren()
  const path = fs.getCurrentPath()

  return (
    <div className="fm-page">
      <header className="fm-header">
        <button type="button" className="fm-back-btn" onClick={onBack} aria-label="返回首页">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>返回</span>
        </button>
        <h1 className="fm-title">文件管理器</h1>
      </header>

      <div className="fm-body">
        {sidebarOpen && (
          <FolderTree fs={fs} onToggleSidebar={handleToggleSidebar} />
        )}

        <div className="fm-main" onContextMenu={handleContentContextMenu}>
          <Toolbar
            viewMode={fs.viewMode}
            setViewMode={fs.setViewMode}
            sortBy={fs.sortBy}
            sortOrder={fs.sortOrder}
            onSort={handleSort}
            onCreateFolder={() => setInputDialog({ visible: true, mode: 'newFolder', target: null })}
            onCreateFile={() => setInputDialog({ visible: true, mode: 'newFile', target: null })}
            onToggleSidebar={handleToggleSidebar}
          />
          <Breadcrumb path={path} onNavigate={(id) => fs.selectFolder(id)} />
          <div className="fm-content">
            <FileList
              viewMode={fs.viewMode}
              items={items}
              onItemClick={handleItemClick}
              onItemContextMenu={handleItemContextMenu}
              selectedId={selectedId}
              sortBy={fs.sortBy}
              sortOrder={fs.sortOrder}
              onSort={handleSort}
            />
          </div>
        </div>
      </div>

      <ContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        targetNode={contextMenu.target}
        onClose={() => setContextMenu({ visible: false, position: { x: 0, y: 0 }, target: null })}
        onAction={handleMenuAction}
      />

      <InputDialog
        key={`${inputDialog.mode}-${inputDialog.target?.id || 'none'}-${inputDialog.visible}`}
        visible={inputDialog.visible}
        title={
          inputDialog.mode === 'newFolder' ? '新建文件夹'
            : inputDialog.mode === 'newFile' ? '新建文件'
            : inputDialog.mode === 'rename' ? '重命名' : ''
        }
        initialValue={inputDialog.mode === 'rename' ? inputDialog.target?.name : ''}
        placeholder={
          inputDialog.mode === 'newFolder' ? '请输入文件夹名称'
            : inputDialog.mode === 'newFile' ? '请输入文件名称（含后缀）'
            : inputDialog.mode === 'rename' ? '请输入新名称' : ''
        }
        confirmText={inputDialog.mode === 'rename' ? '保存' : '创建'}
        onCancel={() => setInputDialog({ visible: false, mode: null, target: null })}
        onConfirm={handleInputConfirm}
      />

      <ConfirmDialog
        visible={confirmDialog.visible}
        title="确认删除"
        message={confirmDialog.target ? `确定要删除「${confirmDialog.target.name}」吗？此操作不可撤销。` : ''}
        confirmText="删除"
        onCancel={() => setConfirmDialog({ visible: false, target: null })}
        onConfirm={handleDeleteConfirm}
      />

      {toast && (
        <div className={`fm-toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  )
}

export default FileManager
