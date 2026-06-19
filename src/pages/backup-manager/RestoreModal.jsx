import { useState } from 'react';
import { useBackup } from './BackupContext.jsx';
import {
  BACKUP_TYPE_LABELS,
  RESTORE_TARGETS,
  RESTORE_TARGET_LABELS,
} from './constants.js';
import { formatDateTime, formatBytes } from './utils.js';

export default function RestoreModal({ isOpen, onClose, record }) {
  const { startRestore } = useBackup();
  const [restoreTarget, setRestoreTarget] = useState(RESTORE_TARGETS.ORIGINAL);
  const [newPath, setNewPath] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [restoreComplete, setRestoreComplete] = useState(false);

  const handleStartRestore = async () => {
    if (restoreTarget === RESTORE_TARGETS.NEW_LOCATION && !newPath.trim()) {
      alert('请输入新路径');
      return;
    }

    setRestoring(true);
    setProgress(0);
    setRestoreComplete(false);

    const { duration, promise } = startRestore();
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(newProgress);
      if (newProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 50);

    await promise;

    clearInterval(progressInterval);
    setProgress(100);
    setRestoring(false);
    setRestoreComplete(true);
  };

  const handleClose = () => {
    if (!restoring) {
      setRestoreTarget(RESTORE_TARGETS.ORIGINAL);
      setNewPath('');
      setProgress(0);
      setRestoreComplete(false);
      onClose();
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal restore-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">恢复确认</h3>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={restoring}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="restore-summary">
            <h4>备份详情</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">备份计划：</span>
                <span className="summary-value">{record.planName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">备份时间：</span>
                <span className="summary-value">
                  {formatDateTime(record.createdAt)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">备份类型：</span>
                <span
                  className={`type-tag ${record.backupType === 'full' ? 'full-tag' : 'incremental-tag'}`}
                >
                  {BACKUP_TYPE_LABELS[record.backupType]}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">数据大小：</span>
                <span className="summary-value">{formatBytes(record.dataSize)}</span>
              </div>
            </div>
          </div>

          <div className="restore-files">
            <h4>包含的数据文件</h4>
            <div className="files-list">
              {record.dataFiles?.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-icon">
                    {file.type === 'database' ? '📊' : file.type === 'file' ? '📁' : '⚙️'}
                  </span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-info">
                    {file.records ? `${file.records.toLocaleString()} 条记录` : file.size ? file.size : `${file.entries} 项`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!restoreComplete && (
            <div className="restore-target">
              <h4>选择恢复目标</h4>
              <div className="radio-group">
                {Object.entries(RESTORE_TARGET_LABELS).map(([value, label]) => (
                  <label key={value} className="radio-item">
                    <input
                      type="radio"
                      name="restoreTarget"
                      value={value}
                      checked={restoreTarget === value}
                      onChange={(e) => setRestoreTarget(e.target.value)}
                      disabled={restoring}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              {restoreTarget === RESTORE_TARGETS.NEW_LOCATION && (
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="请输入恢复路径，如 /data/restore_20240101/"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    disabled={restoring}
                  />
                </div>
              )}
            </div>
          )}

          {restoring && (
            <div className="restore-progress">
              <div className="progress-header">
                <span>恢复进度</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="progress-text">正在恢复数据，请稍候...</p>
            </div>
          )}

          {restoreComplete && (
            <div className="restore-success">
              <div className="success-icon">✓</div>
              <h4>恢复成功</h4>
              <p>
                数据已成功恢复到
                {restoreTarget === RESTORE_TARGETS.ORIGINAL
                  ? '原始位置'
                  : `新位置：${newPath}`}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!restoreComplete && (
            <>
              <button
                type="button"
                className="btn"
                onClick={handleClose}
                disabled={restoring}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartRestore}
                disabled={restoring}
              >
                {restoring ? '恢复中...' : '确认恢复'}
              </button>
            </>
          )}
          {restoreComplete && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleClose}
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
