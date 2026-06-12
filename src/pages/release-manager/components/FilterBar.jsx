import { AVAILABLE_USERS, STATUS_FILTER_OPTIONS } from '../constants.js'

export default function FilterBar({
  statusFilter,
  onStatusChange,
  onCreate,
  currentUser,
  onUserChange,
}) {
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
        <div className="rm-user-selector">
          <span className="rm-filter-label">当前用户：</span>
          <select
            className="rm-input rm-user-select"
            value={currentUser?.id || ''}
            onChange={(e) => onUserChange && onUserChange(e.target.value)}
          >
            {AVAILABLE_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
        <button className="rm-btn rm-btn-primary" onClick={onCreate}>
          + 新建版本
        </button>
      </div>
    </div>
  )
}
