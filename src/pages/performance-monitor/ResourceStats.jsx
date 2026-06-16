import { useMemo, useState } from 'react'
import { RESOURCE_TYPE_LABELS } from './constants'
import {
  aggregateResourceByType,
  calculateTreemapLayout,
  formatFileSize,
  sortResources,
} from './utils'

const TREEMAP_SIZE = { width: 700, height: 280 }

function ResourceStats({ resources }) {
  const [sortBy, setSortBy] = useState('size')
  const [sortOrder, setSortOrder] = useState('desc')

  const aggregated = useMemo(() => aggregateResourceByType(resources), [resources])
  const totalSize = aggregated.totalSize || 0

  const treemapLayout = useMemo(
    () => calculateTreemapLayout(aggregated, TREEMAP_SIZE.width, TREEMAP_SIZE.height),
    [aggregated]
  )

  const sortedResources = useMemo(
    () => sortResources(resources, sortBy, sortOrder),
    [resources, sortBy, sortOrder]
  )

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const renderSortIcon = (field) => {
    if (sortBy !== field) return '↕'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="resource-stats">
      <div className="resource-stats-header">
        <h3 className="resource-stats-title">资源大小统计</h3>
        <div className="resource-stats-summary">
          总资源：<strong>{resources.length}</strong> 个，
          总大小：<strong className="total-size">{formatFileSize(totalSize)}</strong>
        </div>
      </div>

      <div className="resource-treemap-wrapper">
        <div className="resource-treemap-title">各类型资源占比</div>
        <div
          className="resource-treemap"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: TREEMAP_SIZE.width,
            aspectRatio: `${TREEMAP_SIZE.width} / ${TREEMAP_SIZE.height}`,
            margin: '0 auto',
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${TREEMAP_SIZE.width} ${TREEMAP_SIZE.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {treemapLayout.length === 0 && (
              <text
                x={TREEMAP_SIZE.width / 2}
                y={TREEMAP_SIZE.height / 2}
                textAnchor="middle"
                fill="#999"
                fontSize="14"
              >
                暂无数据
              </text>
            )}
            {treemapLayout.map((item) => {
              const pct = totalSize > 0 ? ((item.totalSize / totalSize) * 100).toFixed(1) : 0
              const rectW = item.width
              const rectH = item.height
              const cx = item.x + rectW / 2
              const cy = item.y + rectH / 2
              const showText = rectW > 50 && rectH > 40
              const showSubText = rectW > 60 && rectH > 60

              return (
                <g key={item.type}>
                  <rect
                    x={item.x}
                    y={item.y}
                    width={Math.max(0, rectW - 2)}
                    height={Math.max(0, rectH - 2)}
                    rx={4}
                    ry={4}
                    fill={item.color}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={1.5}
                    style={{
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      filter: 'brightness(1.05)',
                    }}
                  />
                  {showText && (
                    <>
                      <text
                        x={cx}
                        y={cy - (showSubText ? 10 : 0)}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={Math.min(16, Math.max(10, rectW / 6))}
                        fontWeight="600"
                        style={{
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          pointerEvents: 'none',
                        }}
                      >
                        {RESOURCE_TYPE_LABELS[item.type]}
                      </text>
                      {showSubText && (
                        <>
                          <text
                            x={cx}
                            y={cy + 10}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={Math.min(12, Math.max(9, rectW / 9))}
                            style={{
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                              pointerEvents: 'none',
                            }}
                          >
                            {formatFileSize(item.totalSize)}
                          </text>
                          <text
                            x={cx}
                            y={cy + 26}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.9)"
                            fontSize={Math.min(10, Math.max(8, rectW / 11))}
                            style={{
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                              pointerEvents: 'none',
                            }}
                          >
                            {pct}%
                          </text>
                        </>
                      )}
                    </>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className="resource-type-summary-row">
        {aggregated.map((item) => (
          <div key={item.type} className="resource-type-card">
            <span
              className="resource-type-dot"
              style={{ backgroundColor: item.color }}
            />
            <span className="resource-type-label">
              {RESOURCE_TYPE_LABELS[item.type]}
            </span>
            <span className="resource-type-count">{item.count}个</span>
            <span className="resource-type-size">
              {formatFileSize(item.totalSize)}
            </span>
          </div>
        ))}
      </div>

      <div className="resource-table-container">
        <div className="resource-table-title">资源明细列表</div>
        <div className="resource-table-wrapper">
          <table className="resource-table">
            <thead>
              <tr>
                <th style={{ width: '50%' }} onClick={() => handleSort('path')}>
                  文件名 / 路径 {renderSortIcon('path')}
                </th>
                <th style={{ width: '12%' }} onClick={() => handleSort('type')}>
                  类型 {renderSortIcon('type')}
                </th>
                <th
                  style={{ width: '18%', cursor: 'pointer' }}
                  onClick={() => handleSort('size')}
                >
                  大小 {renderSortIcon('size')}
                </th>
                <th
                  style={{ width: '20%', cursor: 'pointer' }}
                  onClick={() => handleSort('loadTime')}
                >
                  加载时间 {renderSortIcon('loadTime')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="resource-empty">
                    暂无资源数据
                  </td>
                </tr>
              ) : (
                sortedResources.map((res) => (
                  <tr key={res.id}>
                    <td className="resource-path">
                      <code>{res.path}</code>
                    </td>
                    <td>
                      <span className={`resource-type-badge resource-type-${res.type}`}>
                        {RESOURCE_TYPE_LABELS[res.type] || res.type}
                      </span>
                    </td>
                    <td className="resource-size">{formatFileSize(res.size)}</td>
                    <td className="resource-time">{res.loadTime}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ResourceStats
