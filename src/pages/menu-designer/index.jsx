import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import TreeEditor from './TreeEditor.jsx'
import PropertyPanel from './PropertyPanel.jsx'
import MenuPreview from './MenuPreview.jsx'
import {
  loadFromStorage,
  saveToStorage,
  createMenuItem,
  findMenuItemById,
  addChildMenuItem,
  addSiblingMenuItem,
  deleteMenuItem,
  updateMenuItem,
  moveMenuItem,
  toggleCollapse,
  collectDescendantIds,
  downloadJson,
  importFromJson,
  parseJsonString,
  countMenuItems,
  getMenuDepth,
} from './menuDesignerCore.js'
import { LAYOUT_TYPES, MENU_TYPES } from './constants.js'
import './menu-designer.css'

export default function MenuDesignerPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [state, setState] = useState(() => loadFromStorage())
  const { title, layout, menu } = state
  const [rawSelectedId, setSelectedId] = useState(null)
  const [importError, setImportError] = useState(null)

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const selectedId = useMemo(() => {
    if (rawSelectedId && findMenuItemById(menu, rawSelectedId)) {
      return rawSelectedId
    }
    return menu.length > 0 ? menu[0].id : null
  }, [rawSelectedId, menu])

  const selectedItem = selectedId ? findMenuItemById(menu, selectedId) : null

  const handleSetTitle = useCallback((newTitle) => {
    setState((prev) => ({ ...prev, title: newTitle }))
  }, [])

  const handleSetLayout = useCallback((newLayout) => {
    setState((prev) => ({ ...prev, layout: newLayout }))
  }, [])

  const handleSelect = useCallback((id) => {
    setSelectedId(id)
  }, [])

  const handleUpdateItem = useCallback((id, updates) => {
    setState((prev) => ({
      ...prev,
      menu: updateMenuItem(prev.menu, id, updates),
    }))
  }, [])

  const handleAddRoot = useCallback(
    (type = MENU_TYPES.LINK) => {
      const newItem = createMenuItem(type, type === MENU_TYPES.DIVIDER ? '---' : '新菜单')
      setState((prev) => ({
        ...prev,
        menu: [...prev.menu, newItem],
      }))
      setSelectedId(newItem.id)
    },
    []
  )

  const handleAddChild = useCallback((parentId) => {
    setState((prev) => {
      const { menu: newMenu, newItemId } = addChildMenuItem(prev.menu, parentId)
      setSelectedId(newItemId)
      return { ...prev, menu: newMenu }
    })
  }, [])

  const handleAddBefore = useCallback((siblingId) => {
    setState((prev) => {
      const { menu: newMenu, newItemId } = addSiblingMenuItem(prev.menu, siblingId, 'before')
      setSelectedId(newItemId)
      return { ...prev, menu: newMenu }
    })
  }, [])

  const handleAddAfter = useCallback((siblingId) => {
    setState((prev) => {
      const { menu: newMenu, newItemId } = addSiblingMenuItem(prev.menu, siblingId, 'after')
      setSelectedId(newItemId)
      return { ...prev, menu: newMenu }
    })
  }, [])

  const handleDelete = useCallback((id) => {
    const descendants = collectDescendantIds(menu, id)
    const count = descendants.length
    const message =
      count > 1
        ? `确定删除该菜单项吗？其下 ${count - 1} 个子菜单项将一并删除。`
        : '确定删除该菜单项吗？'
    if (!window.confirm(message)) return
    setState((prev) => ({
      ...prev,
      menu: deleteMenuItem(prev.menu, id),
    }))
    setSelectedId(null)
  }, [menu])

  const handleMove = useCallback((sourceId, targetId, position) => {
    setState((prev) => ({
      ...prev,
      menu: moveMenuItem(prev.menu, sourceId, targetId, position),
    }))
  }, [])

  const handleToggleCollapse = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      menu: toggleCollapse(prev.menu, id),
    }))
  }, [])

  const handleExport = useCallback(() => {
    downloadJson(state, `menu-config-${Date.now()}.json`)
  }, [state])

  const handleImportClick = useCallback(() => {
    setImportError(null)
    fileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target?.result
          if (typeof content !== 'string') {
            setImportError('文件读取失败')
            return
          }
          const parsed = parseJsonString(content)
          if (!parsed.success) {
            setImportError(`JSON 解析错误: ${parsed.error}`)
            return
          }
          const result = importFromJson(parsed.data)
          if (!result.valid) {
            setImportError(`导入失败: ${result.errors.join('; ')}`)
            return
          }
          setState(result.data)
          setSelectedId(null)
          setImportError(null)
        } catch {
          setImportError('导入失败，文件格式错误')
        } finally {
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }
      reader.readAsText(file)
    },
    []
  )

  const handleReset = useCallback(() => {
    if (!window.confirm('确定重置为默认菜单吗？当前所有更改将丢失。')) return
    setState(loadFromStorage({ getItem: () => null, setItem: () => {}, removeItem: () => {} }))
    setSelectedId(null)
  }, [])

  const layoutOptions = [
    { value: LAYOUT_TYPES.HORIZONTAL, label: '横向', icon: '↔️' },
    { value: LAYOUT_TYPES.VERTICAL, label: '纵向', icon: '↕️' },
    { value: LAYOUT_TYPES.COLLAPSIBLE, label: '折叠', icon: '📁' },
  ]

  const totalItems = countMenuItems(menu)
  const maxDepth = getMenuDepth(menu) + 1

  return (
    <div className="menu-designer-page">
      <div className="md-toolbar">
        <div className="md-toolbar-left">
          <button className="md-btn md-btn-ghost" onClick={() => navigate('/')}>
            ← 返回
          </button>
          <h1 className="md-title">导航菜单设计器</h1>
        </div>
        <div className="md-toolbar-right">
          <div className="md-toolbar-stats">
            <span>共 {totalItems} 项 / {maxDepth} 级</span>
          </div>
          <button className="md-btn md-btn-ghost" onClick={handleReset}>
            🔄 重置
          </button>
          <button className="md-btn md-btn-ghost" onClick={handleImportClick}>
            📥 导入 JSON
          </button>
          <button className="md-btn md-btn-primary" onClick={handleExport}>
            📤 导出 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div className="md-subtoolbar">
        <div className="md-subtoolbar-left">
          <span className="md-sub-label">布局方案:</span>
          <div className="md-layout-tabs">
            {layoutOptions.map((opt) => (
              <button
                key={opt.value}
                className={`md-layout-tab ${layout === opt.value ? 'active' : ''}`}
                onClick={() => handleSetLayout(opt.value)}
              >
                <span className="md-layout-icon">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="md-subtoolbar-right">
          <span className="md-sub-label">导航标题:</span>
          <input
            type="text"
            className="md-title-input"
            value={title}
            onChange={(e) => handleSetTitle(e.target.value)}
            placeholder="请输入导航标题"
          />
        </div>
      </div>

      {importError && (
        <div className="md-error-bar">
          <span>❌ {importError}</span>
          <button className="md-error-close" onClick={() => setImportError(null)}>
            ✕
          </button>
        </div>
      )}

      <div className="md-main">
        <div className="md-panel md-tree-panel">
          <div className="md-panel-header">
            <span className="md-panel-title">🌳 菜单结构</span>
            <div className="md-panel-actions">
              <button
                className="md-btn md-btn-sm md-btn-ghost"
                onClick={() => handleAddRoot(MENU_TYPES.LINK)}
                title="添加链接菜单"
              >
                + 链接
              </button>
              <button
                className="md-btn md-btn-sm md-btn-ghost"
                onClick={() => handleAddRoot(MENU_TYPES.GROUP)}
                title="添加菜单组"
              >
                + 分组
              </button>
              <button
                className="md-btn md-btn-sm md-btn-ghost"
                onClick={() => handleAddRoot(MENU_TYPES.DIVIDER)}
                title="添加分割线"
              >
                + 分割线
              </button>
            </div>
          </div>
          <TreeEditor
            menu={menu}
            selectedId={selectedId}
            onSelect={handleSelect}
            onAddChild={handleAddChild}
            onAddBefore={handleAddBefore}
            onAddAfter={handleAddAfter}
            onDelete={handleDelete}
            onMove={handleMove}
            onToggleCollapse={handleToggleCollapse}
          />
          <div className="md-tree-tips">
            💡 提示：右键菜单可快速操作，拖拽节点可调整顺序或嵌套层级
          </div>
        </div>

        <div className="md-panel md-property-panel">
          <div className="md-panel-header">
            <span className="md-panel-title">⚙️ 属性编辑</span>
          </div>
          <PropertyPanel item={selectedItem} onUpdate={handleUpdateItem} />
        </div>

        <div className="md-panel md-preview-panel">
          <div className="md-panel-header">
            <span className="md-panel-title">👁️ 实时预览</span>
            <span className="md-preview-badge">
              {layout === LAYOUT_TYPES.HORIZONTAL ? '800px' : '250px'}
            </span>
          </div>
          <div className="md-preview-container">
            <MenuPreview title={title} layout={layout} menu={menu} />
          </div>
        </div>
      </div>
    </div>
  )
}
