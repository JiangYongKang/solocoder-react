import { formatDateRange, formatDateLabel } from './timelineUtils.js';

export default function EventCard({
  event,
  isExpanded,
  isHighlighted,
  isDimmed,
  onToggleExpand,
  onEdit,
  onDelete,
  viewMode = 'timeline',
}) {
  const handleCardClick = (e) => {
    if (e.target.closest('.et-card-btn')) return;
    onToggleExpand(event.id);
  };

  const truncatedDesc = event.description?.length > 80
    ? event.description.slice(0, 80) + '...'
    : event.description;

  const dateLabel = viewMode === 'list'
    ? formatDateLabel(event.date)
    : formatDateRange(event.date, event.endDate);

  const baseClass = `et-card ${isExpanded ? 'et-card-expanded' : ''} ${isHighlighted ? 'et-card-highlighted' : ''} ${isDimmed ? 'et-card-dimmed' : ''} et-card-${viewMode}`;

  return (
    <div className={baseClass} onClick={handleCardClick}>
      <div className="et-card-header">
        <div className="et-card-icon" aria-hidden="true">
          {event.icon || '📅'}
        </div>
        <div className="et-card-main">
          <div className="et-card-top">
            <h3 className="et-card-title">{event.title}</h3>
            <div className="et-card-actions">
              <button
                type="button"
                className="et-card-btn et-card-btn-edit"
                onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                aria-label="编辑事件"
              >
                ✏️
              </button>
              <button
                type="button"
                className="et-card-btn et-card-btn-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(event); }}
                aria-label="删除事件"
              >
                🗑️
              </button>
            </div>
          </div>
          <div className="et-card-date">{dateLabel}</div>
        </div>
      </div>

      {event.tags && event.tags.length > 0 && (
        <div className="et-card-tags">
          {event.tags.map((tag) => (
            <span key={tag} className="et-tag">{tag}</span>
          ))}
        </div>
      )}

      {!isExpanded && event.description && (
        <div className="et-card-desc">{truncatedDesc}</div>
      )}

      {isExpanded && (
        <div className="et-card-expand">
          {event.description && (
            <div className="et-card-desc-full">{event.description}</div>
          )}
          <div className="et-card-meta">
            <span className="et-card-meta-item">
              <strong>开始日期：</strong>{formatDateLabel(event.date)}
            </span>
            {event.endDate && (
              <span className="et-card-meta-item">
                <strong>结束日期：</strong>{formatDateLabel(event.endDate)}
              </span>
            )}
          </div>
          <button
            type="button"
            className="et-card-close"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(null); }}
            aria-label="关闭详情"
          >
            收起 ×
          </button>
        </div>
      )}
    </div>
  );
}
