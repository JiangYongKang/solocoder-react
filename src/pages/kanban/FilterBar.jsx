import { TAGS, PRIORITY_ORDER, PRIORITY_LABELS } from './constants.js';

export default function FilterBar({ query, onQueryChange, activeFilter, filterValue, onFilterChange }) {
  const handleTagClick = (tag) => {
    if (activeFilter === 'tag' && filterValue === tag) {
      onFilterChange('tag', null);
    } else {
      onFilterChange('tag', tag);
    }
  };

  const handlePriorityClick = (priority) => {
    if (activeFilter === 'priority' && filterValue === priority) {
      onFilterChange('priority', null);
    } else {
      onFilterChange('priority', priority);
    }
  };

  return (
    <div className="kanban-filter-bar">
      <div className="kanban-search">
        <input
          type="text"
          placeholder="按标题搜索..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="kanban-search-input"
        />
      </div>
      <div className="kanban-filter-groups">
        <div className="kanban-filter-group">
          <span className="kanban-filter-label">标签：</span>
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`kanban-filter-chip ${
                activeFilter === 'tag' && filterValue === tag ? 'kanban-filter-chip-active' : ''
              } ${activeFilter === 'priority' ? 'kanban-filter-chip-disabled' : ''}`}
              onClick={() => handleTagClick(tag)}
              disabled={activeFilter === 'priority'}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="kanban-filter-group">
          <span className="kanban-filter-label">优先级：</span>
          {PRIORITY_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              className={`kanban-filter-chip ${
                activeFilter === 'priority' && filterValue === p ? 'kanban-filter-chip-active' : ''
              } ${activeFilter === 'tag' ? 'kanban-filter-chip-disabled' : ''}`}
              onClick={() => handlePriorityClick(p)}
              disabled={activeFilter === 'tag'}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
