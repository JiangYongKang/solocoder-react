import { useState, useMemo } from 'react';
import { useBackup } from './BackupContext.jsx';
import {
  formatDateTime,
  getLastBackupTime,
  getNextScheduledBackup,
  calculateStorageUsage,
  calculateStoragePercentage,
  isStorageCritical,
} from './utils.js';
import { TOTAL_STORAGE_BYTES } from './constants.js';

export default function StatusBar() {
  const {
    plans,
    records,
    globalState,
    runningTaskCount,
    toggleGlobalPause,
    triggerManualBackup,
  } = useBackup();

  const [showManualBackup, setShowManualBackup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const stats = useMemo(() => {
    const lastBackup = getLastBackupTime(records);
    const nextBackup = getNextScheduledBackup(plans, globalState.paused);
    const usedStorage = calculateStorageUsage(records);
    const storagePercent = calculateStoragePercentage(usedStorage, TOTAL_STORAGE_BYTES);
    const storageCritical = isStorageCritical(storagePercent);

    return {
      lastBackup,
      nextBackup,
      usedStorage,
      storagePercent,
      storageCritical,
    };
  }, [plans, records, globalState.paused]);

  const handleManualBackup = async () => {
    if (!selectedPlan) {
      alert('请选择备份计划');
      return;
    }
    setShowManualBackup(false);
    const result = await triggerManualBackup(selectedPlan);
    setSelectedPlan('');
    if (!result.success && result.error) {
      alert(`备份失败：${result.error}`);
    }
  };

  return (
    <div className="status-bar">
      <div className="status-left">
        <div className="status-item">
          <span className="status-label">当前执行任务</span>
          <span className={`status-badge ${runningTaskCount > 0 ? 'running' : 'idle'}`}>
            {runningTaskCount} 个
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">最近备份时间</span>
          <span className="status-value">
            {stats.lastBackup ? formatDateTime(stats.lastBackup) : '暂无'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">下次计划备份</span>
          <span className="status-value">
            {globalState.paused
              ? '已暂停'
              : stats.nextBackup
                ? formatDateTime(stats.nextBackup)
                : '暂无计划'}
          </span>
        </div>
        {stats.storageCritical && (
          <div className="status-item warning-item">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">存储空间不足 10%</span>
          </div>
        )}
      </div>

      <div className="status-right">
        <button
          className={`btn ${globalState.paused ? 'btn-success' : 'btn-warning'}`}
          onClick={toggleGlobalPause}
        >
          {globalState.paused ? '▶ 启动备份' : '⏸ 暂停备份'}
        </button>

        <div className="manual-backup-container">
          <button
            className="btn btn-primary"
            onClick={() => setShowManualBackup(!showManualBackup)}
          >
            ⚡ 手动执行
          </button>

          {showManualBackup && (
            <div className="manual-backup-dropdown">
              <select
                className="form-select"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="">选择备份计划...</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={handleManualBackup}
                disabled={runningTaskCount > 0}
              >
                立即执行
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
