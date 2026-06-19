import { useState, useMemo } from 'react'
import { generateResources, paginateList } from './utils.js'
import { PAGE_SIZE } from './constants.js'

export default function ResourceList({ tag }) {
  const [currentPage, setCurrentPage] = useState(1)

  const resources = useMemo(() => {
    if (!tag) return []
    return generateResources(tag.id, tag.resourceCount || 0)
  }, [tag])

  const pagination = useMemo(() => {
    return paginateList(resources, currentPage, PAGE_SIZE)
  }, [resources, currentPage])

  if (!tag) {
    return (
      <div className="resource-empty">
        <div className="empty-icon">🏷️</div>
        <div className="empty-text">请选择一个标签查看关联资源</div>
      </div>
    )
  }

  const typeColors = {
    文章: '#3b82f6',
    视频: '#ef4444',
    图片: '#22c55e',
    文档: '#f59e0b',
    音频: '#8b5cf6',
    代码: '#ec4899',
  }

  const typeIcons = {
    文章: '📄',
    视频: '🎬',
    图片: '🖼️',
    文档: '📑',
    音频: '🎵',
    代码: '💻',
  }

  return (
    <div className="resource-list">
      <div className="resource-header">
        <h3 className="resource-title" style={{ color: tag.color }}>
          {tag.name} 的关联资源
        </h3>
        <span className="resource-count">共 {tag.resourceCount || 0} 个</span>
      </div>

      {pagination.items.length > 0 ? (
        <>
          <div className="resource-grid">
            {pagination.items.map((resource) => (
              <div key={resource.id} className="resource-card">
                <div
                  className="resource-type-badge"
                  style={{ backgroundColor: typeColors[resource.type] + '20', color: typeColors[resource.type] }}
                >
                  {typeIcons[resource.type]} {resource.type}
                </div>
                <div className="resource-name">{resource.name}</div>
              </div>
            ))}
          </div>

          {pagination.totalPage > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(1)}
                disabled={pagination.currentPage === 1}
              >
                首页
              </button>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                上一页
              </button>
              <span className="page-info">
                {pagination.currentPage} / {pagination.totalPage}
              </span>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPage}
              >
                下一页
              </button>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(pagination.totalPage)}
                disabled={pagination.currentPage === pagination.totalPage}
              >
                末页
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="resource-empty">
          <div className="empty-icon">📭</div>
          <div className="empty-text">该标签暂无关联资源</div>
        </div>
      )}
    </div>
  )
}
