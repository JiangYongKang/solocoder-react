import { useBackup } from './BackupContext.jsx';
import {
  BACKUP_TYPE_LABELS,
  PLAN_STATUS_LABELS,
  PLAN_STATUS,
  DATA_SOURCE_LABELS,
} from './constants.js';
import {
  formatDateTime,
  formatFrequencyDisplay,
} from './utils.js';

export default function PlanList({ onEdit, onUpdatePlan, onDelete, onManualRun, onCreate }) {
  const { plans, isTaskRunning, runningTaskCount } = useBackup();

  const handleTogglePlanStatus = (plan) => {
    const newStatus = plan.status === PLAN_STATUS.ACTIVE ? PLAN_STATUS.PAUSED : PLAN_STATUS.ACTIVE;
    onUpdatePlan(plan.id, { status: newStatus });
  };

  return (
    <div className="plan-list-section">
      <div className="section-header">
        <h2 className="section-title">备份计划</h2>
        <button className="btn btn-primary" onClick={onCreate}>
          + 创建计划
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>暂无备份计划，点击上方按钮创建第一个计划</p>
        </div>
      ) : (
        <div className="plan-cards">
          {plans.map((plan) => {
            const isRunning = isTaskRunning(plan.id);
            return (
              <div key={plan.id} className={`plan-card ${isRunning ? 'running' : ''}`}>
                <div className="plan-card-header">
                  <div className="plan-card-title">
                    <h3>{plan.name}</h3>
                    {isRunning && (
                      <span className="running-indicator">
                        <span className="spinner"></span>
                        执行中
                      </span>
                    )}
                  </div>
                  <span
                    className={`plan-status-badge ${plan.status}`}
                  >
                    {PLAN_STATUS_LABELS[plan.status]}
                  </span>
                </div>

                <div className="plan-card-body">
                  <div className="plan-info-row">
                    <span className="info-label">备份类型：</span>
                    <span
                      className={`type-tag ${plan.backupType === 'full' ? 'full-tag' : 'incremental-tag'}`}
                    >
                      {BACKUP_TYPE_LABELS[plan.backupType]}
                    </span>
                  </div>
                  <div className="plan-info-row">
                    <span className="info-label">执行频率：</span>
                    <span className="info-value">
                      {formatFrequencyDisplay(plan.frequency, plan.frequencyConfig)}{' '}
                      {plan.backupTime}
                    </span>
                  </div>
                  <div className="plan-info-row">
                    <span className="info-label">保留份数：</span>
                    <span className="info-value">{plan.retentionCount} 份</span>
                  </div>
                  <div className="plan-info-row">
                    <span className="info-label">备份目标：</span>
                    <span className="info-value">
                      {plan.dataSources?.map((s) => DATA_SOURCE_LABELS[s] || s).join(', ')}
                    </span>
                  </div>
                  <div className="plan-info-row">
                    <span className="info-label">最近执行：</span>
                    <span className="info-value">
                      {plan.lastRunTime ? formatDateTime(plan.lastRunTime) : '从未执行'}
                    </span>
                  </div>
                </div>

                <div className="plan-card-footer">
                  <button
                    className="btn btn-link"
                    disabled={runningTaskCount > 0}
                    onClick={() => onManualRun(plan.id)}
                  >
                    立即执行
                  </button>
                  <button
                    className="btn btn-link"
                    onClick={() => handleTogglePlanStatus(plan)}
                  >
                    {plan.status === PLAN_STATUS.ACTIVE ? '暂停' : '启动'}
                  </button>
                  <button
                    className="btn btn-link"
                    onClick={() => onEdit(plan)}
                  >
                    编辑
                  </button>
                  <button
                    className="btn btn-link danger"
                    onClick={() => onDelete(plan)}
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
