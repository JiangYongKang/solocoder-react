import { STATUS_FILTER_OPTIONS } from '../constants.js'

export default function FilterBar({ statusFilter, onStatusChange, onCreate }) {
  return (
    <div className="rm-filter-bar">
      <div className="rm-filter-left">
        <span className="rm-filter-label">状态筛选：</span>
        <div className="rm-filter-tabs">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`rm-filter-tab ${statusFilter === opt.value ? 'active' : ''}`}
              onClick={() => onStatusChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rm-filter-right">
        <button className="rm-btn rm-btn-primary" onClick={onCreate}>
          + 新建版本
        </button>
      </div>
    </div>
  )
}
