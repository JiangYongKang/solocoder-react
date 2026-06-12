import { RELEASE_STATUS } from '../constants.js'

export default function StatsCards({ stats, onFilterClick, activeFilter }) {
  const cards = [
    {
      key: 'all',
      label: '总版本数',
      value: stats.total,
      color: '#3b82f6',
      bgLight: 'rgba(59, 130, 246, 0.1)',
    },
    {
      key: RELEASE_STATUS.PUBLISHED,
      label: '已发布',
      value: stats.published,
      color: '#10b981',
      bgLight: 'rgba(16, 185, 129, 0.1)',
    },
    {
      key: RELEASE_STATUS.PENDING,
      label: '待审核',
      value: stats.pending,
      color: '#f59e0b',
      bgLight: 'rgba(245, 158, 11, 0.1)',
    },
    {
      key: RELEASE_STATUS.DRAFT,
      label: '草稿',
      value: stats.draft,
      color: '#6b7280',
      bgLight: 'rgba(107, 114, 128, 0.1)',
    },
  ]

  return (
    <div className="rm-stats-cards">
      {cards.map((card) => {
        const isActive = activeFilter === card.key
        return (
          <div
            key={card.key}
            className={`rm-stats-card ${isActive ? 'active' : ''}`}
            style={{
              borderColor: isActive ? card.color : 'transparent',
              background: isActive ? card.bgLight : '#fff',
            }}
            onClick={() => onFilterClick(card.key)}
          >
            <div className="rm-stats-label" style={{ color: card.color }}>
              {card.label}
            </div>
            <div className="rm-stats-value">{card.value}</div>
          </div>
        )
      })}
    </div>
  )
}
