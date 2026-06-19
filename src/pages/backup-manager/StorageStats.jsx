import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useBackup } from './BackupContext.jsx';
import {
  TOTAL_STORAGE_BYTES,
  BACKUP_STATUS,
} from './constants.js';
import {
  calculateStorageUsage,
  calculateStoragePercentage,
  getStorageStatus,
  formatBytes,
  calculatePlanStorageUsage,
  getMonthlyStorageTrend,
} from './utils.js';

export default function StorageStats() {
  const { records, plans } = useBackup();

  const stats = useMemo(() => {
    const usedBytes = calculateStorageUsage(records);
    const percentage = calculateStoragePercentage(usedBytes, TOTAL_STORAGE_BYTES);
    const status = getStorageStatus(percentage);

    const planStorage = plans.map((plan) => ({
      name: plan.name.length > 8 ? plan.name.slice(0, 8) + '...' : plan.name,
      fullName: plan.name,
      usage: calculatePlanStorageUsage(records, plan.id),
    }));

    const monthlyTrend = getMonthlyStorageTrend(records, 6);

    return {
      usedBytes,
      percentage,
      status,
      planStorage,
      monthlyTrend,
    };
  }, [records, plans]);

  const progressColor = useMemo(() => {
    if (stats.status === 'danger') return '#e74c3c';
    if (stats.status === 'warning') return '#f39c12';
    return '#27ae60';
  }, [stats.status]);

  const barTooltipFormatter = (value) => [formatBytes(value), '存储空间'];
  const lineTooltipFormatter = (value) => [formatBytes(value), '存储空间'];

  return (
    <div className="storage-stats-section">
      <div className="section-header">
        <h2 className="section-title">存储空间统计</h2>
      </div>

      <div className="storage-overview">
        <div className="storage-info">
          <div className="storage-info-row">
            <span className="storage-info-label">总存储空间</span>
            <span className="storage-info-value">{formatBytes(TOTAL_STORAGE_BYTES)}</span>
          </div>
          <div className="storage-info-row">
            <span className="storage-info-label">已用空间</span>
            <span className="storage-info-value" style={{ color: progressColor }}>
              {formatBytes(stats.usedBytes)}
            </span>
          </div>
          <div className="storage-info-row">
            <span className="storage-info-label">剩余空间</span>
            <span className="storage-info-value">
              {formatBytes(TOTAL_STORAGE_BYTES - stats.usedBytes)}
            </span>
          </div>
          <div className="storage-info-row">
            <span className="storage-info-label">使用率</span>
            <span className="storage-info-value" style={{ color: progressColor }}>
              {(stats.percentage * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="storage-progress-container">
          <div className="storage-progress-bar">
            <div
              className="storage-progress-fill"
              style={{
                width: `${stats.percentage * 100}%`,
                backgroundColor: progressColor,
              }}
            ></div>
          </div>
          <div className="storage-progress-labels">
            <span>0%</span>
            <span style={{ left: '50%' }}>50%</span>
            <span style={{ left: '80%' }}>80%</span>
            <span>100%</span>
          </div>
          <div className="storage-progress-thresholds">
            <span className="threshold-marker warning" style={{ left: '50%' }}>|</span>
            <span className="threshold-marker danger" style={{ left: '80%' }}>|</span>
          </div>
        </div>
      </div>

      <div className="storage-charts">
        <div className="chart-card">
          <h3 className="chart-title">各备份计划空间占用</h3>
          <div className="chart-container">
            {stats.planStorage.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.planStorage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => formatBytes(v)} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip
                    formatter={barTooltipFormatter}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.fullName || label
                    }
                  />
                  <Bar dataKey="usage" fill="#3498db" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state small">
                <p>暂无数据</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">月度空间使用趋势</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => formatBytes(v)} />
                <Tooltip formatter={lineTooltipFormatter} />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="#2ecc71"
                  strokeWidth={2}
                  dot={{ fill: '#27ae60' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
