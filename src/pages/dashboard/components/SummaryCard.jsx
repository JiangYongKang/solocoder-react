
import { formatNumber } from '../utils/dataUtils'
import { METRIC_CONFIG } from '../data/mockData'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SummaryCard = ({ id, metricKey, value, trend }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const config = METRIC_CONFIG[metricKey] || { label: metricKey, unit: '', format: 'number' }
  const trendIcon = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'
  const trendClass = trend.direction === 'up'
    ? 'trend-up'
    : trend.direction === 'down'
      ? 'trend-down'
      : 'trend-flat'

  const shouldAppendUnit = config.format === 'number'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="db-summary-card"
    >
      <div className="db-card-header">
        <span className="db-card-title">{config.label}</span>
        <span className={`db-card-trend ${trendClass}`}>
          {trendIcon} {trend.percent.toFixed(2)}%
        </span>
      </div>
      <div className="db-card-value">
        {formatNumber(value, config.format)}
        {shouldAppendUnit && <span className="db-card-unit">{config.unit}</span>}
      </div>
      <div className="db-card-subtitle">较上期变化</div>
    </div>
  )
}

export default SummaryCard
