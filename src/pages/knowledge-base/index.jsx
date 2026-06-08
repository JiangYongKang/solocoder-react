import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './knowledge-base.css'
import {
  loadData,
  saveData,
  getCategoryPath,
  getArticlesByCategory,
  createCategory,
  renameCategory,
  deleteCategory,
  toggleCategoryExpand,
  moveCategory,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleFavorite,
  addRecent,
  searchArticles,
  sortArticles,
  findArticleById,
  formatDate,
} from './kbUtils'
import CategoryTree from './CategoryTree'
import ArticleList from './ArticleList'
import ArticleEditor from './ArticleEditor'
import Breadcrumb from './Breadcrumb'

const SIDEBAR_TABS = {
  CATEGORIES: 'categories',
  FAVORITES: 'favorites',
  RECENT: 'recent',
}

export default function KnowledgeBasePage() {
  const [data, setData] = useState(() => loadData())
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat-root')
  const [selectedArticleId, setSelectedArticleId] = useState(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortBy, setSortBy] = useState('time')
  const [sortOrder, setSortOrder] = useState('desc')
  const [sidebarTab, setSidebarTab] = useState(SIDEBAR_TABS.CATEGORIES)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [articleListOpen, setArticleListOpen] = useState(false)
  const [dialog, setDialog] = useState(null)

  useEffect(() => {
    saveData(data)
  }, [data])

  const categoryPath = useMemo(
    () => getCategoryPath(data.categories, selectedCategoryId),
    [data.categories, selectedCategoryId]
  )

  const displayedArticles = useMemo(() => {
    let articles
    if (searchKeyword) {
      articles = searchArticles(data.articles, searchKeyword)
    } else if (sidebarTab === SIDEBAR_TABS.FAVORITES) {
      articles = data.articles.filter((a) => data.favorites.includes(a.id))
    } else if (sidebarTab === SIDEBAR_TABS.RECENT) {
      articles = data.recent
        .map((id) => findArticleById(data.articles, id))
        .filter(Boolean)
    } else {
      articles = getArticlesByCategory(data.articles, selectedCategoryId)
    }
    return sortArticles(articles, sortBy, sortOrder, data.categories)
  }, [data.articles, data.favorites, data.recent, data.categories, selectedCategoryId, searchKeyword, sidebarTab, sortBy, sortOrder])

  const selectedArticle = useMemo(
    () => (selectedArticleId ? findArticleById(data.articles, selectedArticleId) : null),
    [data.articles, selectedArticleId]
  )

  const favoriteArticles = useMemo(
    () => data.favorites.map((id) => findArticleById(data.articles, id)).filter(Boolean),
    [data.articles, data.favorites]
  )

  const recentArticles = useMemo(
    () => data.recent.map((id) => findArticleById(data.articles, id)).filter(Boolean),
    [data.articles, data.recent]
  )

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedArticleId(null)
    setSidebarTab(SIDEBAR_TABS.CATEGORIES)
    setSidebarOpen(false)
  }

  const handleSelectArticle = (articleId) => {
    setSelectedArticleId(articleId)
    setData((prev) => addRecent(prev, articleId))
    setArticleListOpen(false)
  }

  const handleToggleExpand = (categoryId) => {
    setData((prev) => toggleCategoryExpand(prev, categoryId))
  }

  const handleAddCategory = (parentId) => {
    setDialog({
      type: 'create-category',
      parentId,
      name: '',
    })
  }

  const handleRenameCategory = (categoryId, newName) => {
    setData((prev) => renameCategory(prev, categoryId, newName))
  }

  const handleDeleteCategory = (categoryId) => {
    setDialog({
      type: 'confirm-delete-category',
      categoryId,
    })
  }

  const handleMoveCategory = (sourceId, targetId, position) => {
    setData((prev) => moveCategory(prev, sourceId, targetId, position))
  }

  const handleCreateArticle = () => {
    const categoryId = sidebarTab === SIDEBAR_TABS.CATEGORIES ? selectedCategoryId : 'cat-root'
    setData((prev) => {
      const newData = createArticle(prev, categoryId, '未命名文章')
      const newArticle = newData.articles[newData.articles.length - 1]
      setSelectedArticleId(newArticle.id)
      return newData
    })
  }

  const handleUpdateArticle = (updates) => {
    if (!selectedArticleId) return
    setData((prev) => updateArticle(prev, selectedArticleId, updates))
  }

  const handleToggleFavorite = (articleId) => {
    setData((prev) => toggleFavorite(prev, articleId))
  }

  const handleDeleteArticle = (articleId) => {
    setDialog({
      type: 'confirm-delete-article',
      articleId,
    })
  }

  const confirmDialog = () => {
    if (!dialog) return

    switch (dialog.type) {
      case 'create-category': {
        const name = dialog.name.trim()
        if (name) {
          setData((prev) => createCategory(prev, dialog.parentId, name))
        }
        break
      }
      case 'confirm-delete-category': {
        setData((prev) => {
          const newData = deleteCategory(prev, dialog.categoryId)
          if (selectedCategoryId === dialog.categoryId) {
            setSelectedCategoryId('cat-root')
          }
          return newData
        })
        break
      }
      case 'confirm-delete-article': {
        setData((prev) => deleteArticle(prev, dialog.articleId))
        if (selectedArticleId === dialog.articleId) {
          setSelectedArticleId(null)
        }
        break
      }
      default:
        break
    }
    setDialog(null)
  }

  return (
    <div className="kb-page">
      <header className="kb-header">
        <button
          type="button"
          className="kb-sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="打开侧边栏"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link to="/" className="kb-back-link">← 返回</Link>
        <h1 className="kb-title">知识库系统</h1>
        <div className="kb-search-wrap">
          <span className="kb-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="kb-search-input"
            placeholder="搜索文章标题或内容..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
        <select
          className="kb-sort-select"
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-')
            setSortBy(by)
            setSortOrder(order)
          }}
        >
          <option value="time-desc">最新更新</option>
          <option value="time-asc">最早更新</option>
          <option value="title-asc">标题 A-Z</option>
          <option value="title-desc">标题 Z-A</option>
          <option value="category-asc">分类正序</option>
          <option value="category-desc">分类倒序</option>
        </select>
      </header>

      <Breadcrumb path={categoryPath} onNavigate={handleSelectCategory} />

      <div className="kb-body">
        <aside className={`kb-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="kb-sidebar-tabs">
            <button
              type="button"
              className={`kb-sidebar-tab ${sidebarTab === SIDEBAR_TABS.CATEGORIES ? 'active' : ''}`}
              onClick={() => setSidebarTab(SIDEBAR_TABS.CATEGORIES)}
            >
              分类
            </button>
            <button
              type="button"
              className={`kb-sidebar-tab ${sidebarTab === SIDEBAR_TABS.FAVORITES ? 'active' : ''}`}
              onClick={() => {
                setSidebarTab(SIDEBAR_TABS.FAVORITES)
                setSelectedArticleId(null)
              }}
            >
              收藏 ({favoriteArticles.length})
            </button>
            <button
              type="button"
              className={`kb-sidebar-tab ${sidebarTab === SIDEBAR_TABS.RECENT ? 'active' : ''}`}
              onClick={() => {
                setSidebarTab(SIDEBAR_TABS.RECENT)
                setSelectedArticleId(null)
              }}
            >
              最近
            </button>
          </div>
          <div className="kb-sidebar-content">
            {sidebarTab === SIDEBAR_TABS.CATEGORIES && (
              <CategoryTree
                categories={data.categories}
                selectedId={selectedCategoryId}
                onSelect={handleSelectCategory}
                onToggleExpand={handleToggleExpand}
                onAddRoot={() => handleAddCategory('cat-root')}
                onAddChild={handleAddCategory}
                onRename={handleRenameCategory}
                onDelete={handleDeleteCategory}
                onMove={handleMoveCategory}
              />
            )}
            {sidebarTab === SIDEBAR_TABS.FAVORITES && (
              favoriteArticles.length === 0 ? (
                <div className="kb-empty">暂无收藏的文章</div>
              ) : (
                favoriteArticles.map((article) => (
                  <div
                    key={article.id}
                    className={`kb-favorite-item ${selectedArticleId === article.id ? 'active' : ''}`}
                    onClick={() => handleSelectArticle(article.id)}
                  >
                    <span className="kb-fav-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </span>
                    <span className="kb-item-title">{article.title}</span>
                    <span className="kb-item-time">{formatDate(article.updatedAt)}</span>
                  </div>
                ))
              )
            )}
            {sidebarTab === SIDEBAR_TABS.RECENT && (
              recentArticles.length === 0 ? (
                <div className="kb-empty">暂无浏览记录</div>
              ) : (
                recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className={`kb-recent-item ${selectedArticleId === article.id ? 'active' : ''}`}
                    onClick={() => handleSelectArticle(article.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="kb-item-title">{article.title}</span>
                    <span className="kb-item-time">{formatDate(article.updatedAt)}</span>
                  </div>
                ))
              )
            )}
          </div>
        </aside>

        {sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 40,
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="kb-main">
          <div className="kb-content">
            {!selectedArticleId ? (
              <>
                {articleListOpen && (
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(0,0,0,0.3)',
                      zIndex: 35,
                    }}
                    onClick={() => setArticleListOpen(false)}
                  />
                )}
                <ArticleList
                  articles={displayedArticles}
                  selectedArticleId={selectedArticleId}
                  searchKeyword={searchKeyword}
                  categories={data.categories}
                  onSelect={handleSelectArticle}
                  onCreate={handleCreateArticle}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteArticle}
                  emptyText={
                    searchKeyword
                      ? '未找到匹配的文章'
                      : sidebarTab === SIDEBAR_TABS.FAVORITES
                      ? '暂无收藏的文章'
                      : sidebarTab === SIDEBAR_TABS.RECENT
                      ? '暂无浏览记录'
                      : '该分类下暂无文章，点击右上角「新建」开始创建'
                  }
                  title={
                    searchKeyword
                      ? '搜索结果'
                      : sidebarTab === SIDEBAR_TABS.FAVORITES
                      ? '收藏夹'
                      : sidebarTab === SIDEBAR_TABS.RECENT
                      ? '最近浏览'
                      : '文章列表'
                  }
                />
                <div className="kb-editor">
                  <div className="kb-editor-empty">
                    <div className="kb-editor-empty-icon">📝</div>
                    <div className="kb-editor-empty-text">
                      {searchKeyword
                        ? '请输入关键词搜索文章'
                        : '选择左侧文章开始阅读，或点击「新建」创建一篇新文章'}
                    </div>
                    <button type="button" className="kb-btn kb-btn-primary" onClick={handleCreateArticle}>
                      新建文章
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="kb-article-list-toggle"
                  onClick={() => setArticleListOpen(true)}
                  aria-label="文章列表"
                  style={{ display: 'none' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
                <div className={`kb-article-list ${articleListOpen ? 'open' : ''}`}>
                  <ArticleList
                    articles={displayedArticles}
                    selectedArticleId={selectedArticleId}
                    searchKeyword={searchKeyword}
                    categories={data.categories}
                    onSelect={handleSelectArticle}
                    onCreate={handleCreateArticle}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteArticle}
                    emptyText={
                      searchKeyword
                        ? '未找到匹配的文章'
                        : sidebarTab === SIDEBAR_TABS.FAVORITES
                        ? '暂无收藏的文章'
                        : sidebarTab === SIDEBAR_TABS.RECENT
                        ? '暂无浏览记录'
                        : '该分类下暂无文章'
                    }
                    title={
                      searchKeyword
                        ? '搜索结果'
                        : sidebarTab === SIDEBAR_TABS.FAVORITES
                        ? '收藏夹'
                        : sidebarTab === SIDEBAR_TABS.RECENT
                        ? '最近浏览'
                        : '文章列表'
                    }
                  />
                </div>
                <ArticleEditor
                  article={selectedArticle}
                  onUpdate={handleUpdateArticle}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteArticle}
                  onBackToList={() => setSelectedArticleId(null)}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {dialog && (
        <div className="kb-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="kb-dialog" onClick={(e) => e.stopPropagation()}>
            {dialog.type === 'create-category' && (
              <>
                <h3 className="kb-dialog-title">新建分类</h3>
                <div className="kb-dialog-field">
                  <label className="kb-dialog-label">分类名称</label>
                  <input
                    type="text"
                    className="kb-dialog-input"
                    autoFocus
                    value={dialog.name}
                    onChange={(e) => setDialog({ ...dialog, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmDialog()
                    }}
                    placeholder="请输入分类名称"
                  />
                </div>
                <div className="kb-dialog-actions">
                  <button type="button" className="kb-btn" onClick={() => setDialog(null)}>取消</button>
                  <button
                    type="button"
                    className="kb-btn kb-btn-primary"
                    onClick={confirmDialog}
                    disabled={!dialog.name.trim()}
                  >
                    创建
                  </button>
                </div>
              </>
            )}
            {dialog.type === 'confirm-delete-category' && (
              <>
                <h3 className="kb-dialog-title">确认删除</h3>
                <p className="kb-dialog-desc">
                  删除此分类将同时删除其所有子分类和分类下的所有文章，此操作不可撤销，确认删除吗？
                </p>
                <div className="kb-dialog-actions">
                  <button type="button" className="kb-btn" onClick={() => setDialog(null)}>取消</button>
                  <button type="button" className="kb-btn kb-btn-danger" onClick={confirmDialog}>确认删除</button>
                </div>
              </>
            )}
            {dialog.type === 'confirm-delete-article' && (
              <>
                <h3 className="kb-dialog-title">确认删除</h3>
                <p className="kb-dialog-desc">
                  删除文章后将无法恢复，确认删除这篇文章吗？
                </p>
                <div className="kb-dialog-actions">
                  <button type="button" className="kb-btn" onClick={() => setDialog(null)}>取消</button>
                  <button type="button" className="kb-btn kb-btn-danger" onClick={confirmDialog}>确认删除</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
