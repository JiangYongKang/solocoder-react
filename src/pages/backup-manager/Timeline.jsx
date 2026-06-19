import { useState, useMemo } from 'react';
import { useBackup } from './BackupContext.jsx';
import {
  BACKUP_STATUS,
  BACKUP_STATUS_LABELS,
  BACKUP_TYPE_LABELS,
  PAGE_SIZE,
  TIMELINE_VIEWS,
  TIMELINE_VIEW_LABELS,
} from './constants.js';
import {
  formatDateTime,
  formatBytes,
  formatDuration,
  filterRecords,
  groupRecordsByPlan,
  paginateList,
} from './utils.js';

function StatusIcon({ status }) {
  if (status === BACKUP_STATUS.RUNNING) {
    return (
      <span className="status-icon running">
        <span className="spinner small"></span>
      </span>
    );
  }
  if (status === BACKUP_STATUS.SUCCESS) {
    return <span className="status-icon success">✓</span>;
  }
  if (status === BACKUP_STATUS.FAILED) {
    return <span className="status-icon failed">✕</span>;
  }
  return <span className="status-icon pending">○</span>;
}

function TimelineItem({ record, onRestore, restoreDisabled }) {
  const canRestore = record.status === BACKUP_STATUS.SUCCESS;

  return (
    <div className={`timeline-item ${record.status}`}>
      <div className="timeline-marker">
        <StatusIcon status={record.status} />
      </div>
      <div className="timeline-content">
        <div className="timeline-header">
          <div className="timeline-time">{formatDateTime(record.createdAt)}</div>
          <div className="timeline-actions">
            {record.manual && <span className="manual-tag">手动</span>}
            {canRestore && (
              <button
                className="btn btn-link restore-btn"
                disabled={restoreDisabled}
                onClick={() => onRestore(record)}
              >
                恢复
              </button>
            )}
          </div>
        </div>
        <div className="timeline-body">
          <div className="timeline-plan-name">{record.planName}</div>
          <div className="timeline-tags">
            <span
              className={`type-tag ${record.backupType === 'full' ? 'full-tag' : 'incremental-tag'}`}
            >
              {BACKUP_TYPE_LABELS[record.backupType]}
            </span>
            <span className={`status-tag ${record.status}`}>
              {BACKUP_STATUS_LABELS[record.status]}
            </span>
          </div>
          <div className="timeline-details">
            {record.status === BACKUP_STATUS.SUCCESS && (
              <>
                <span className="detail-item">
                  <strong>数据大小：</strong>
                  {formatBytes(record.dataSize)}
                </span>
                <span className="detail-item">
                  <strong>耗时：</strong>
                  {formatDuration(record.duration)}
                </span>
              </>
            )}
            {record.status === BACKUP_STATUS.FAILED && (
              <span className="detail-item error">
                <strong>失败原因：</strong>
                {record.errorMessage}
              </span>
            )}
            {record.status === BACKUP_STATUS.RUNNING && (
              <span className="detail-item running">备份执行中...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Timeline({ onRestore }) {
  const { records, plans, restoring, runningTaskCount } = useBackup();

  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState(TIMELINE_VIEWS.ALL);
  const [page, setPage] = useState(1);

  const filteredRecords = useMemo(() => {
    const filters = {};
    if (filterPlan !== 'all') filters.planId = filterPlan;
    if (filterStatus !== 'all') filters.status = filterStatus;
    return filterRecords(records, filters);
  }, [records, filterPlan, filterStatus]);

  const groupedRecords = useMemo(() => {
    return groupRecordsByPlan(filteredRecords);
  }, [filteredRecords]);

  const pagination = useMemo(() => {
    return paginateList(filteredRecords, page, PAGE_SIZE);
  }, [filteredRecords, page]);

  const restoreDisabled = restoring || runningTaskCount > 0;

  function renderAllView() {
    return (
      <>
        <div className="timeline-list">
          {pagination.items.map((record) => (
            <TimelineItem
              key={record.id}
              record={record}
              onRestore={onRestore}
              restoreDisabled={restoreDisabled}
            />
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <p>暂无备份记录</p>
          </div>
        )}

        {filteredRecords.length > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              共 {pagination.total} 条，每页 {pagination.pageSize} 条
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={pagination.currentPage === 1}
                onClick={() => setPage(pagination.currentPage - 1)}
              >
                上一页
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === pagination.currentPage ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => setPage(pagination.currentPage + 1)}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderGroupedView() {
    const planIds = Object.keys(groupedRecords);
    if (planIds.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📜</div>
          <p>暂无备份记录</p>
        </div>
      );
    }

    return (
      <div className="timeline-groups">
        {planIds.map((planId) => {
          const plan = plans.find((p) => p.id === planId);
          const planRecords = groupedRecords[planId];
          return (
            <div key={planId} className="timeline-group">
              <div className="timeline-group-header">
                <h3>{plan?.name || planId}</h3>
                <span className="group-count">{planRecords.length} 条记录</span>
              </div>
              <div className="timeline-list">
                {planRecords.slice(0, 5).map((record) => (
                  <TimelineItem
                    key={record.id}
                    record={record}
                    onRestore={onRestore}
                    restoreDisabled={restoreDisabled}
                  />
                ))}
                {planRecords.length > 5 && (
                  <div className="timeline-group-more">
                    <button
                      className="btn btn-link"
                      onClick={() => {
                        setFilterPlan(planId);
                        setViewMode(TIMELINE_VIEWS.ALL);
                      }}
                    >
                      查看全部 {planRecords.length} 条记录 →
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="timeline-section">
      <div className="section-header">
        <h2 className="section-title">备份时间线</h2>
        <div className="view-toggle">
          {Object.entries(TIMELINE_VIEW_LABELS).map(([value, label]) => (
            <button
              key={value}
              className={`view-toggle-btn ${viewMode === value ? 'active' : ''}`}
              onClick={() => {
                setViewMode(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="timeline-filters">
        <div className="filter-item">
          <label>备份计划：</label>
          <select
            className="form-select filter-select"
            value={filterPlan}
            onChange={(e) => {
              setFilterPlan(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">全部计划</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label>备份状态：</label>
          <select
            className="form-select filter-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">全部状态</option>
            {Object.entries(BACKUP_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === TIMELINE_VIEWS.ALL ? renderAllView() : renderGroupedView()}
    </div>
  );
}
