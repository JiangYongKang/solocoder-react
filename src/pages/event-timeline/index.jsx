import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EventCard from './EventCard.jsx';
import EventFormModal from './EventFormModal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import {
  GROUP_MODE,
  GROUP_MODE_LABELS,
  ZOOM_LEVEL,
  ZOOM_LEVEL_LABELS,
  ZOOM_LEVEL_ORDER,
  VIEW_MODE,
  VIEW_MODE_LABELS,
  DEFAULT_TAGS,
} from './constants.js';
import {
  loadEvents,
  saveEvents,
  loadPrefs,
  savePrefs,
  addEvent,
  updateEvent,
  deleteEvent,
  applyFilters,
  groupEvents,
  collectAllTagsWithDefaults,
  getSortForCardView,
  sortEvents,
  matchSearchHighlight,
  getDateRangeFromZoom,
  formatRangeLabel,
} from './timelineUtils.js';
import './timeline.css';

export default function EventTimelinePage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState(() => loadEvents());
  const prefsInitial = loadPrefs();
  const [viewMode, setViewMode] = useState(prefsInitial.viewMode);
  const [groupMode, setGroupMode] = useState(prefsInitial.groupMode);
  const [zoomLevel, setZoomLevel] = useState(prefsInitial.zoomLevel);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    savePrefs({ viewMode, groupMode, zoomLevel });
  }, [viewMode, groupMode, zoomLevel]);

  const allTags = useMemo(
    () => collectAllTagsWithDefaults(events, DEFAULT_TAGS),
    [events],
  );

  const filteredEvents = useMemo(
    () => applyFilters(events, { selectedTags, searchQuery }),
    [events, selectedTags, searchQuery],
  );

  const timelineGroups = useMemo(
    () => groupEvents(filteredEvents, groupMode),
    [filteredEvents, groupMode],
  );

  const cardViewEvents = useMemo(
    () => getSortForCardView(filteredEvents),
    [filteredEvents],
  );

  const listViewEvents = useMemo(
    () => sortEvents(filteredEvents).reverse(),
    [filteredEvents],
  );

  const visibleRangeLabel = useMemo(
    () => formatRangeLabel(getDateRangeFromZoom(events, zoomLevel)),
    [events, zoomLevel],
  );

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    ));
  };

  const clearTagFilters = () => setSelectedTags([]);

  const handleAddClick = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const handleFormSubmit = (payload) => {
    if (editingEvent) {
      setEvents((prev) => updateEvent(prev, editingEvent.id, payload));
    } else {
      setEvents((prev) => addEvent(prev, payload));
    }
    setFormOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteClick = (event) => {
    setPendingDelete(event);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDelete) {
      setEvents((prev) => deleteEvent(prev, pendingDelete.id));
      if (expandedId === pendingDelete.id) setExpandedId(null);
    }
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const handleToggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleWheel = (e) => {
    if (!timelineRef.current) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const idx = ZOOM_LEVEL_ORDER.indexOf(zoomLevel);
      const next = e.deltaY < 0
        ? ZOOM_LEVEL_ORDER[Math.min(idx + 1, ZOOM_LEVEL_ORDER.length - 1)]
        : ZOOM_LEVEL_ORDER[Math.max(idx - 1, 0)];
      setZoomLevel(next);
    }
  };

  const handleMouseDown = (e) => {
    if (!timelineRef.current) return;
    if (e.button !== 0) return;
    if (e.target.closest('.et-card') || e.target.closest('button') || e.target.closest('input')) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollTop: timelineRef.current.scrollTop,
      scrollLeft: timelineRef.current.scrollLeft || 0,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !timelineRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    timelineRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
    if (timelineRef.current.scrollLeft !== undefined) {
      timelineRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderTimelineView = () => (
    <div
      ref={timelineRef}
      className={`et-timeline-scroll ${isDragging ? 'et-dragging' : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="et-timeline-inner" data-zoom={zoomLevel}>
        {timelineGroups.map((group) => (
          <div key={group.key} className="et-group">
            <div className="et-group-header">
              <h2 className="et-group-title">
                <span className="et-group-label">{group.label}</span>
                <span className="et-group-count">{group.events.length} 个事件</span>
              </h2>
            </div>
            <div className="et-timeline-track">
              <div className="et-timeline-line" aria-hidden="true" />
              {groupMode === GROUP_MODE.DECADE ? (
                Object.keys(group.yearGroups || {}).sort().reverse().map((year) => (
                  <div key={year} className="et-year-block">
                    <div className="et-year-marker">
                      <div className="et-year-label">{year}</div>
                      <div className="et-year-tick" />
                    </div>
                    <div className="et-year-events">
                      {group.yearGroups[year].map((evt) => (
                        <div key={evt.id} className="et-timeline-node">
                          <div className="et-node-dot" aria-hidden="true" />
                          <div className="et-node-card">
                            <EventCard
                              event={evt}
                              isExpanded={expandedId === evt.id}
                              isHighlighted={searchQuery && matchSearchHighlight(evt, searchQuery)}
                              isDimmed={!!(searchQuery && !matchSearchHighlight(evt, searchQuery))}
                              onToggleExpand={handleToggleExpand}
                              onEdit={handleEditClick}
                              onDelete={handleDeleteClick}
                              viewMode="timeline"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                Object.keys(group.dayGroups || {}).sort().reverse().map((day) => (
                  <div key={day} className="et-day-block">
                    <div className="et-day-marker">
                      <div className="et-day-label">{parseInt(day, 10)}日</div>
                      <div className="et-day-tick" />
                    </div>
                    <div className="et-day-events">
                      {group.dayGroups[day].map((evt) => (
                        <div key={evt.id} className="et-timeline-node">
                          <div className="et-node-dot" aria-hidden="true" />
                          <div className="et-node-card">
                            <EventCard
                              event={evt}
                              isExpanded={expandedId === evt.id}
                              isHighlighted={searchQuery && matchSearchHighlight(evt, searchQuery)}
                              isDimmed={!!(searchQuery && !matchSearchHighlight(evt, searchQuery))}
                              onToggleExpand={handleToggleExpand}
                              onEdit={handleEditClick}
                              onDelete={handleDeleteClick}
                              viewMode="timeline"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCardView = () => (
    <div className="et-card-grid">
      {cardViewEvents.map((evt) => (
        <EventCard
          key={evt.id}
          event={evt}
          isExpanded={expandedId === evt.id}
          isHighlighted={searchQuery && matchSearchHighlight(evt, searchQuery)}
          isDimmed={!!(searchQuery && !matchSearchHighlight(evt, searchQuery))}
          onToggleExpand={handleToggleExpand}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          viewMode="card"
        />
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="et-list-view">
      {listViewEvents.map((evt) => (
        <EventCard
          key={evt.id}
          event={evt}
          isExpanded={expandedId === evt.id}
          isHighlighted={searchQuery && matchSearchHighlight(evt, searchQuery)}
          isDimmed={!!(searchQuery && !matchSearchHighlight(evt, searchQuery))}
          onToggleExpand={handleToggleExpand}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          viewMode="list"
        />
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="et-empty">
      <div className="et-empty-icon" aria-hidden="true">📅</div>
      <h2 className="et-empty-title">还没有事件</h2>
      <p className="et-empty-desc">点击下方按钮添加第一个事件吧</p>
      <button type="button" className="et-btn et-btn-primary et-empty-btn" onClick={handleAddClick}>
        + 添加事件
      </button>
    </div>
  );

  const hasEvents = events.length > 0;
  const hasFilteredEvents = filteredEvents.length > 0;

  return (
    <div className="et-page">
      <div className="et-header">
        <div className="et-header-top">
          <button
            type="button"
            className="et-back-btn"
            onClick={() => navigate('/')}
            aria-label="返回首页"
          >
            ← 返回首页
          </button>
          <h1 className="et-title">事件时间线</h1>
          <button
            type="button"
            className="et-btn et-btn-primary et-add-btn"
            onClick={handleAddClick}
          >
            + 添加事件
          </button>
        </div>
      </div>

      <div className="et-toolbar">
        <div className="et-toolbar-row">
          <div className="et-view-toggle" role="tablist" aria-label="视图切换">
            {Object.values(VIEW_MODE).map((mode) => (
              <button
                key={mode}
                role="tab"
                aria-selected={viewMode === mode}
                type="button"
                className={`et-view-btn ${viewMode === mode ? 'et-view-btn-active' : ''}`}
                onClick={() => { setViewMode(mode); setExpandedId(null); }}
              >
                {VIEW_MODE_LABELS[mode]}
              </button>
            ))}
          </div>

          {viewMode === VIEW_MODE.TIMELINE && (
            <div className="et-group-toggle" role="tablist" aria-label="分组模式">
              {Object.values(GROUP_MODE).map((mode) => (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={groupMode === mode}
                  type="button"
                  className={`et-group-btn ${groupMode === mode ? 'et-group-btn-active' : ''}`}
                  onClick={() => { setGroupMode(mode); setExpandedId(null); }}
                >
                  {GROUP_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          )}

          {viewMode === VIEW_MODE.TIMELINE && (
            <div className="et-zoom-control">
              <label htmlFor="et-zoom" className="et-zoom-label">缩放：</label>
              <select
                id="et-zoom"
                className="et-zoom-select"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(e.target.value)}
              >
                {ZOOM_LEVEL_ORDER.map((level) => (
                  <option key={level} value={level}>{ZOOM_LEVEL_LABELS[level]}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="et-toolbar-row">
          <div className="et-search-wrap">
            <input
              type="text"
              className="et-search-input"
              placeholder="搜索事件标题或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="搜索事件"
            />
          </div>

          <div className="et-tag-filter" role="group" aria-label="标签筛选">
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  className={`et-tag-chip ${active ? 'et-tag-chip-active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button
                type="button"
                className="et-tag-clear"
                onClick={clearTagFilters}
              >
                清除筛选
              </button>
            )}
          </div>
        </div>

        {viewMode === VIEW_MODE.TIMELINE && (
          <div className="et-range-info">
            <span>当前可视范围：{visibleRangeLabel}</span>
            <span className="et-range-hint">（Ctrl+滚轮 可调节缩放）</span>
          </div>
        )}

        {(searchQuery || selectedTags.length > 0) && (
          <div className="et-filter-info">
            <span>
              共找到 <strong>{filteredEvents.length}</strong> 个事件
              {searchQuery && <span>（搜索："{searchQuery}"）</span>}
              {selectedTags.length > 0 && <span>（标签：{selectedTags.join(' / ')}）</span>}
            </span>
          </div>
        )}
      </div>

      <div className="et-content">
        {!hasEvents && renderEmpty()}

        {hasEvents && !hasFilteredEvents && (
          <div className="et-empty et-empty-filtered">
            <div className="et-empty-icon" aria-hidden="true">🔍</div>
            <h2 className="et-empty-title">没有匹配的事件</h2>
            <p className="et-empty-desc">尝试调整搜索关键词或标签筛选条件</p>
            <button
              type="button"
              className="et-btn et-btn-ghost"
              onClick={() => { setSearchQuery(''); setSelectedTags([]); }}
            >
              清除所有筛选
            </button>
          </div>
        )}

        {hasEvents && hasFilteredEvents && viewMode === VIEW_MODE.TIMELINE && renderTimelineView()}
        {hasEvents && hasFilteredEvents && viewMode === VIEW_MODE.CARD && renderCardView()}
        {hasEvents && hasFilteredEvents && viewMode === VIEW_MODE.LIST && renderListView()}
      </div>

      <EventFormModal
        isOpen={formOpen}
        initialData={editingEvent}
        availableTags={allTags}
        onClose={() => { setFormOpen(false); setEditingEvent(null); }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="删除事件"
        message={pendingDelete ? `确定要删除「${pendingDelete.title}」吗？此操作无法撤销。` : ''}
        confirmText="删除"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </div>
  );
}
