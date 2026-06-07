
import { validateDateRange } from '../utils/dataUtils'

const DateRangeFilter = ({ startDate, endDate, onStartChange, onEndChange, onApply, onReset }) => {
  const isValid = validateDateRange(startDate, endDate)

  return (
    <div className="db-date-filter">
      <div className="db-date-filter-label">日期范围：</div>
      <div className="db-date-inputs">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="db-date-input"
          aria-label="开始日期"
        />
        <span className="db-date-separator">至</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="db-date-input"
          aria-label="结束日期"
        />
      </div>
      <div className="db-date-actions">
        <button
          className="db-btn db-btn-primary"
          onClick={onApply}
          disabled={!isValid}
        >
          应用
        </button>
        <button className="db-btn db-btn-secondary" onClick={onReset}>
          重置
        </button>
      </div>
      {!isValid && (
        <div className="db-date-error">开始日期不能晚于结束日期</div>
      )}
    </div>
  )
}

export default DateRangeFilter
