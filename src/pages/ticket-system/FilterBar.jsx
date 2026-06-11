import {
  TICKET_STATUSES,
  STATUS_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
} from './constants'

const STATUS_OPTIONS = Object.values(TICKET_STATUSES)
const CATEGORY_OPTIONS = Object.values(CATEGORIES)
const PRIORITY_OPTIONS = Object.values(PRIORITIES)

export default function FilterBar({ filters, onChange }) {
  const {
    statuses = [],
    categories = [],
    priorities = [],
    dateFrom = '',
    dateTo = '',
    keyword = '',
  } = filters

  function update(partial) {
    onChange({ ...filters, ...partial })
  }

  function toggleStatus(status) {
    const next = statuses.includes(status)
      ? statuses.filter((s) => s !== status)
      : [...statuses, status]
    update({ statuses: next })
  }

  function toggleCategory(cat) {
    const next = categories.includes(cat)
      ? categories.filter((c) => c !== cat)
      : [...categories, cat]
    update({ categories: next })
  }

  function togglePriority(pri) {
    const next = priorities.includes(pri)
      ? priorities.filter((p) => p !== pri)
      : [...priorities, pri]
    update({ priorities: next })
  }

  const tags = []

  statuses.forEach((s) => {
    tags.push({ key: `status-${s}`, label: STATUS_LABELS[s], remove: () => toggleStatus(s) })
  })
  categories.forEach((c) => {
    tags.push({ key: `category-${c}`, label: CATEGORY_LABELS[c], remove: () => toggleCategory(c) })
  })
  priorities.forEach((p) => {
    tags.push({ key: `priority-${p}`, label: PRIORITY_LABELS[p], remove: () => togglePriority(p) })
  })
  if (dateFrom) {
    tags.push({ key: 'dateFrom', label: `从 ${dateFrom}`, remove: () => update({ dateFrom: '' }) })
  }
  if (dateTo) {
    tags.push({ key: 'dateTo', label: `至 ${dateTo}`, remove: () => update({ dateTo: '' }) })
  }
  if (keyword.trim()) {
    tags.push({ key: 'keyword', label: `关键词: ${keyword}`, remove: () => update({ keyword: '' }) })
  }

  return (
    <div>
      <div className="ts-filter-bar">
        <div className="ts-filter-item">
          <label>状态</label>
          <div className="ts-checkbox-group">
            {STATUS_OPTIONS.map((s) => (
              <label key={s} className="ts-checkbox-item">
                <input
                  type="checkbox"
                  checked={statuses.includes(s)}
                  onChange={() => toggleStatus(s)}
                />
                {STATUS_LABELS[s]}
              </label>
            ))}
          </div>
        </div>

        <div className="ts-filter-item">
          <label>分类</label>
          <select
            className="ts-filter-select"
            multiple
            value={categories}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value)
              update({ categories: selected })
            }}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        <div className="ts-filter-item">
          <label>优先级</label>
          <select
            className="ts-filter-select"
            multiple
            value={priorities}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value)
              update({ priorities: selected })
            }}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </div>

        <div className="ts-filter-item">
          <label>起始日期</label>
          <input
            type="date"
            className="ts-filter-input"
            value={dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
          />
        </div>

        <div className="ts-filter-item">
          <label>截止日期</label>
          <input
            type="date"
            className="ts-filter-input"
            value={dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
          />
        </div>

        <div className="ts-filter-item">
          <label>关键词</label>
          <input
            type="text"
            className="ts-filter-input"
            placeholder="搜索标题或描述"
            value={keyword}
            onChange={(e) => update({ keyword: e.target.value })}
          />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="ts-filter-tags">
          {tags.map((tag) => (
            <span key={tag.key} className="ts-filter-tag">
              {tag.label}
              <span className="ts-filter-tag-close" onClick={tag.remove}>×</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
