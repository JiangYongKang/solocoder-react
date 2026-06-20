import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './locker.css';

import {
  CELL_SIZE,
  CELL_SIZE_LABELS,
  CELL_STATUS,
  RETENTION_OPTIONS,
  PACKAGE_STATUS,
  CELL_GRID_ROWS,
  MAX_PICKUP_ATTEMPTS,
} from './constants.js';

import {
  loadConfig,
  saveConfig,
  loadCells,
  saveCells,
  loadPackages,
  savePackages,
  loadPickupRecords,
  savePickupRecords,
  loadDeliveryRecords,
  saveDeliveryRecords,
  loadRetentionHours,
  saveRetentionHours,
} from './storage.js';

import {
  createCells,
  findAvailableCell,
  allocateCell,
  releaseCell,
  generatePickupCode,
  getOverdueHours,
  updateCellStatuses,
  validatePickupCode,
  maskPhone,
  getLastFourChars,
  formatDateTime,
  checkPickupAttempts,
  recordFailedPickupAttempt,
  resetPickupAttempts,
  getStatistics,
  getDailyTrend,
  findPackageByPickupCode,
  regeneratePickupCode,
  validateDeliveryForm,
  createPackage,
  createDeliveryRecord,
  pickupPackage,
  markOverdueAsProcessed,
  arrangeCellsInGrid,
  getOverduePackages as getOverduePkgs,
} from './utils.js';

export default function LockerManagementPage() {
  const navigate = useNavigate();

  const [config, setConfig] = useState(() => loadConfig());
  const [cells, setCells] = useState(() => loadCells());
  const [packages, setPackages] = useState(() => loadPackages());
  const [pickupRecords, setPickupRecords] = useState(() => loadPickupRecords());
  const [deliveryRecords, setDeliveryRecords] = useState(() => loadDeliveryRecords());
  const [retentionHours, setRetentionHours] = useState(() => loadRetentionHours());

  const [configLarge, setConfigLarge] = useState(config.largeCount);
  const [configMedium, setConfigMedium] = useState(config.mediumCount);
  const [configSmall, setConfigSmall] = useState(config.smallCount);
  const [configRetention, setConfigRetention] = useState(retentionHours);

  const [deliveryForm, setDeliveryForm] = useState({
    phone: '',
    size: CELL_SIZE.MEDIUM,
    trackingNo: '',
    remark: '',
  });
  const [deliveryErrors, setDeliveryErrors] = useState({});

  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [pickupAttempts, setPickupAttempts] = useState(resetPickupAttempts());
  const [lockSeconds, setLockSeconds] = useState(0);

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveredPackage, setDeliveredPackage] = useState(null);
  const [showCellDetail, setShowCellDetail] = useState(null);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    saveCells(cells);
  }, [cells]);

  useEffect(() => {
    savePackages(packages);
  }, [packages]);

  useEffect(() => {
    savePickupRecords(pickupRecords);
  }, [pickupRecords]);

  useEffect(() => {
    saveDeliveryRecords(deliveryRecords);
  }, [deliveryRecords]);

  useEffect(() => {
    saveRetentionHours(retentionHours);
  }, [retentionHours]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (lockSeconds > 0) {
      const timer = setInterval(() => {
        setLockSeconds((s) => Math.max(0, s - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockSeconds]);

  const updatedCells = useMemo(() => {
    return updateCellStatuses(cells, packages, now, retentionHours);
  }, [cells, packages, now, retentionHours]);

  const overduePackages = useMemo(() => {
    return getOverduePkgs(packages, now, retentionHours);
  }, [packages, now, retentionHours]);

  const statistics = useMemo(() => {
    return getStatistics(packages, updatedCells, pickupRecords, deliveryRecords, now);
  }, [packages, updatedCells, pickupRecords, deliveryRecords, now]);

  const dailyTrend = useMemo(() => {
    return getDailyTrend(pickupRecords, deliveryRecords, 7, now);
  }, [pickupRecords, deliveryRecords, now]);

  const earliestOverdue = useMemo(() => {
    if (overduePackages.length === 0) return null;
    const earliest = overduePackages.reduce((min, p) => 
      p.deliveredAt < min.deliveredAt ? p : min
    , overduePackages[0]);
    return getOverdueHours(earliest.deliveredAt, now, retentionHours);
  }, [overduePackages, now, retentionHours]);

  const cellGrid = useMemo(() => {
    return arrangeCellsInGrid(updatedCells, CELL_GRID_ROWS);
  }, [updatedCells]);

  const showAlert = useCallback((message, type = 'info') => {
    setAlertMessage({ message, type });
    setTimeout(() => setAlertMessage(null), 3000);
  }, []);

  const handleConfigChange = () => {
    const total = configLarge + configMedium + configSmall;
    if (total > 40) {
      showAlert('总格口数不能超过40', 'error');
      return;
    }
    if (total < 1) {
      showAlert('至少需要1个格口', 'error');
      return;
    }

    const newConfig = {
      largeCount: configLarge,
      mediumCount: configMedium,
      smallCount: configSmall,
    };
    setConfig(newConfig);
    setRetentionHours(configRetention);

    const newCells = createCells(newConfig);
    setCells(newCells);
    setPackages([]);
    setDeliveryRecords([]);
    setPickupRecords([]);
    
    showAlert('格口配置已更新', 'success');
  };

  const handleDeliveryInputChange = (field, value) => {
    setDeliveryForm((prev) => ({ ...prev, [field]: value }));
    if (deliveryErrors[field]) {
      setDeliveryErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleDeliverySubmit = () => {
    const validation = validateDeliveryForm(deliveryForm);
    if (!validation.valid) {
      setDeliveryErrors(validation.errors);
      return;
    }

    const availableCell = findAvailableCell(updatedCells, deliveryForm.size, packages);
    if (!availableCell) {
      showAlert(`无可用${CELL_SIZE_LABELS[deliveryForm.size]}格口，请联系管理员`, 'error');
      return;
    }

    const existingCodes = packages
      .filter((p) => p.status === PACKAGE_STATUS.PENDING)
      .map((p) => p.pickupCode);

    const pickupCode = generatePickupCode(existingCodes);
    if (!pickupCode) {
      showAlert('无法生成取件码，请稍后重试', 'error');
      return;
    }

    const newPackage = createPackage(deliveryForm, pickupCode, availableCell.id);
    const newCells = allocateCell(updatedCells, packages, availableCell.id, newPackage.id);
    const newRecord = createDeliveryRecord(newPackage);

    setPackages((prev) => [...prev, newPackage]);
    setCells(newCells);
    setDeliveryRecords((prev) => [newRecord, ...prev]);

    setDeliveredPackage(newPackage);
    setShowDeliveryModal(true);

    setDeliveryForm({
      phone: '',
      size: CELL_SIZE.MEDIUM,
      trackingNo: '',
      remark: '',
    });
    setDeliveryErrors({});
  };

  const handlePickupSubmit = () => {
    const attemptCheck = checkPickupAttempts(pickupAttempts);
    if (!attemptCheck.allowed) {
      setLockSeconds(attemptCheck.remainingSeconds);
      showAlert(`取件已锁定，请${attemptCheck.remainingSeconds}秒后重试`, 'error');
      return;
    }

    if (!validatePickupCode(pickupCodeInput)) {
      showAlert('请输入6位数字取件码', 'error');
      return;
    }

    const pkg = findPackageByPickupCode(packages, pickupCodeInput);
    if (!pkg) {
      const allPackages = packages.find((p) => p.pickupCode === pickupCodeInput);
      if (allPackages) {
        showAlert('该包裹已被取走', 'error');
      } else {
        showAlert('取件码错误，请核实', 'error');
      }
      
      const newAttempts = recordFailedPickupAttempt(pickupAttempts);
      setPickupAttempts(newAttempts);
      
      if (newAttempts.lockedUntil > now) {
        setLockSeconds(Math.ceil((newAttempts.lockedUntil - now) / 1000));
      }
      return;
    }

    const cell = updatedCells.find((c) => c.id === pkg.cellId);
    const result = pickupPackage(packages, pkg.id, 'user');
    
    if (result.success) {
      setPackages(result.updatedPackages);
      setPickupRecords((prev) => [result.record, ...prev]);
      setCells(releaseCell(updatedCells, result.cellId));
      setPickupCodeInput('');
      setPickupAttempts(resetPickupAttempts());
      showAlert(`取件成功，格口 ${cell?.code || ''} 已释放`, 'success');
    }
  };

  const handleCellClick = (cell) => {
    if (cell.packageId) {
      setShowCellDetail(cell);
    }
  };

  const handleAdminPickup = (cell) => {
    const pkg = packages.find((p) => p.id === cell.packageId);
    if (!pkg) return;

    if (!window.confirm('确定要强制取件吗？此操作将清空格口并记录为管理员取件。')) {
      return;
    }

    const result = pickupPackage(packages, pkg.id, 'admin');
    if (result.success) {
      setPackages(result.updatedPackages);
      setPickupRecords((prev) => [result.record, ...prev]);
      setCells(releaseCell(updatedCells, result.cellId));
      setShowCellDetail(null);
      showAlert(`已强制取件，格口 ${cell.code} 已释放`, 'success');
    }
  };

  const handleRegenerateCode = (cell) => {
    const pkg = packages.find((p) => p.id === cell.packageId);
    if (!pkg) return;

    const result = regeneratePickupCode(packages, pkg.id);
    if (result.success) {
      setPackages(result.updatedPackages);
      showAlert(`取件码已重新生成：${result.newCode}`, 'success');
    } else {
      showAlert(result.error, 'error');
    }
  };

  const handleMarkProcessed = (packageIds) => {
    setPackages(markOverdueAsProcessed(packages, packageIds));
    showAlert('已标记为已处理', 'success');
  };

  const handleMarkAllProcessed = () => {
    const unprocessedOverdue = overduePackages
      .filter((p) => !p.processed)
      .map((p) => p.id);
    
    if (unprocessedOverdue.length === 0) {
      showAlert('没有未处理的滞留包裹', 'info');
      return;
    }

    handleMarkProcessed(unprocessedOverdue);
  };

  const getCellPackage = (cell) => {
    if (!cell.packageId) return null;
    return packages.find((p) => p.id === cell.packageId) || null;
  };

  function renderCell(cell) {
    const pkg = getCellPackage(cell);
    const isOccupied = cell.status === CELL_STATUS.OCCUPIED;
    const cellOverdue = cell.status === CELL_STATUS.OVERDUE;

    return (
      <div
        key={cell.id}
        className={`locker-cell ${cell.size} ${isOccupied ? 'occupied' : ''} ${cellOverdue ? 'overdue' : ''}`}
        onClick={() => handleCellClick(cell)}
      >
        <div className={`cell-status ${cell.status}`} />
        <div className="cell-code">{cell.code}</div>
        {pkg && (
          <div className="cell-content">
            {getLastFourChars(pkg.trackingNo)}
          </div>
        )}
        {pkg && (
          <div className="cell-tooltip">
            <div className="tooltip-row">
              <span className="tooltip-label">格口号:</span>
              <span className="tooltip-value">{cell.code}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">快递单号:</span>
              <span className="tooltip-value">{pkg.trackingNo}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">取件人:</span>
              <span className="tooltip-value">{maskPhone(pkg.phone)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">投递时间:</span>
              <span className="tooltip-value">{formatDateTime(pkg.deliveredAt)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">状态:</span>
              <span className="tooltip-value" style={{ color: cellOverdue ? '#fecaca' : '#86efac' }}>
                {cellOverdue ? '滞留超时' : '已投递'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="locker-page">
      <div className="locker-header">
        <div className="locker-header-left">
          <button className="btn-link back-link" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="page-title">快递柜管理系统</h1>
        </div>
      </div>

      {alertMessage && (
        <div className={`alert alert-${alertMessage.type}`}>
          {alertMessage.message}
        </div>
      )}

      {overduePackages.length > 0 && (
        <div className="overdue-banner">
          <div className="overdue-banner-content">
            <span className="overdue-icon">⚠️</span>
            <span>
              当前有 {overduePackages.length} 个包裹滞留超时，最早滞留包裹已超时 {earliestOverdue} 小时
            </span>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setShowOverdueModal(true)}>
            查看详情
          </button>
        </div>
      )}

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-card-title">今日投递数</div>
          <div className="stat-card-value positive">{statistics.todayDeliveries}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">今日取件数</div>
          <div className="stat-card-value positive">{statistics.todayPickups}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">当前占用格口</div>
          <div className="stat-card-value">{statistics.occupiedCells}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">当前空闲格口</div>
          <div className="stat-card-value">{statistics.availableCells}</div>
        </div>
      </div>

      <div className="locker-main-layout">
        <div className="sidebar-left">
          <div className="sidebar-panel">
            <h3 className="panel-title">包裹投递</h3>
            <div className="form-group">
              <label className="form-label">取件人手机号 *</label>
              <input
                type="text"
                className={`form-input ${deliveryErrors.phone ? 'error' : ''}`}
                placeholder="请输入11位手机号"
                value={deliveryForm.phone}
                onChange={(e) => handleDeliveryInputChange('phone', e.target.value)}
                maxLength={11}
              />
              {deliveryErrors.phone && (
                <div className="error-text">{deliveryErrors.phone}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">包裹尺寸 *</label>
              <select
                className="form-select"
                value={deliveryForm.size}
                onChange={(e) => handleDeliveryInputChange('size', e.target.value)}
              >
                <option value={CELL_SIZE.LARGE}>大号</option>
                <option value={CELL_SIZE.MEDIUM}>中号</option>
                <option value={CELL_SIZE.SMALL}>小号</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">快递单号 *</label>
              <input
                type="text"
                className={`form-input ${deliveryErrors.trackingNo ? 'error' : ''}`}
                placeholder="请输入快递单号"
                value={deliveryForm.trackingNo}
                onChange={(e) => handleDeliveryInputChange('trackingNo', e.target.value)}
              />
              {deliveryErrors.trackingNo && (
                <div className="error-text">{deliveryErrors.trackingNo}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">备注</label>
              <input
                type="text"
                className="form-input"
                placeholder="选填"
                value={deliveryForm.remark}
                onChange={(e) => handleDeliveryInputChange('remark', e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={handleDeliverySubmit}
            >
              投递包裹
            </button>
          </div>

          <div className="sidebar-panel" style={{ marginTop: 20 }}>
            <h3 className="panel-title">取件</h3>
            <div className="form-group">
              <label className="form-label">取件码</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入6位取件码"
                value={pickupCodeInput}
                onChange={(e) => setPickupCodeInput(e.target.value)}
                maxLength={6}
                disabled={lockSeconds > 0}
              />
            </div>
            {lockSeconds > 0 && (
              <div className="lock-message">
                取件已锁定，请 {lockSeconds} 秒后重试
              </div>
            )}
            {pickupAttempts.count > 0 && lockSeconds === 0 && (
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                已错误 {pickupAttempts.count} 次，还可尝试 {MAX_PICKUP_ATTEMPTS - pickupAttempts.count} 次
              </div>
            )}
            <button
              className="btn btn-success btn-block"
              onClick={handlePickupSubmit}
              disabled={lockSeconds > 0}
            >
              取件
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="locker-container">
            <h3 className="panel-title" style={{ marginTop: 0 }}>快递柜状态</h3>
            <div className="locker-grid-wrapper">
              <div
                className="locker-grid"
                style={{
                  gridTemplateColumns: `repeat(${cellGrid[0]?.length || 10}, 1fr)`,
                }}
              >
                {cellGrid.map((row) =>
                  row.map((cell) => renderCell(cell))
                )}
              </div>
            </div>
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color available" />
                <span>空闲</span>
              </div>
              <div className="legend-item">
                <span className="legend-color occupied" />
                <span>已占用</span>
              </div>
              <div className="legend-item">
                <span className="legend-color overdue" />
                <span>滞留超时</span>
              </div>
              <div className="legend-item">
                <span className="size-indicator large" />
                <span>大号格口 (A)</span>
              </div>
              <div className="legend-item">
                <span className="size-indicator medium" />
                <span>中号格口 (B)</span>
              </div>
              <div className="legend-item">
                <span className="size-indicator small" />
                <span>小号格口 (C)</span>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <h3 className="chart-title">最近7天投递/取件趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="deliveries"
                  name="投递"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="pickups"
                  name="取件"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sidebar-right">
          <div className="sidebar-panel">
            <h3 className="panel-title">格口配置</h3>
            <div className="config-panel">
              <div className="config-row">
                <label className="config-label">
                  <span className="size-indicator large" />
                  大号格口
                </label>
                <input
                  type="number"
                  className="config-input"
                  min="0"
                  max="40"
                  value={configLarge}
                  onChange={(e) => setConfigLarge(Math.max(0, Math.min(40, parseInt(e.target.value) || 0)))}
                />
              </div>
              <div className="config-row">
                <label className="config-label">
                  <span className="size-indicator medium" />
                  中号格口
                </label>
                <input
                  type="number"
                  className="config-input"
                  min="0"
                  max="40"
                  value={configMedium}
                  onChange={(e) => setConfigMedium(Math.max(0, Math.min(40, parseInt(e.target.value) || 0)))}
                />
              </div>
              <div className="config-row">
                <label className="config-label">
                  <span className="size-indicator small" />
                  小号格口
                </label>
                <input
                  type="number"
                  className="config-input"
                  min="0"
                  max="40"
                  value={configSmall}
                  onChange={(e) => setConfigSmall(Math.max(0, Math.min(40, parseInt(e.target.value) || 0)))}
                />
              </div>
              <div className="config-row">
                <label className="config-label">滞留时限 (小时)</label>
                <select
                  className="form-select"
                  style={{ width: 80 }}
                  value={configRetention}
                  onChange={(e) => setConfigRetention(parseInt(e.target.value))}
                >
                  {RETENTION_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                总格口: {configLarge + configMedium + configSmall}/40
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={handleConfigChange}
              >
                应用配置
              </button>
            </div>
          </div>

          <div className="sidebar-panel" style={{ marginTop: 20 }}>
            <h3 className="panel-title">格口使用率</h3>
            <div className="size-usage-panel">
              {Object.values(CELL_SIZE).map((size) => {
                const usage = statistics.sizeUsage[size];
                const percent = usage.total > 0 ? (usage.used / usage.total) * 100 : 0;
                return (
                  <div key={size} className="size-usage-item">
                    <div className="size-usage-label">
                      <span>
                        <span className={`size-indicator ${size}`} />
                        {CELL_SIZE_LABELS[size]}
                      </span>
                      <span>
                        {usage.used}/{usage.total}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-bar-fill ${size}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showDeliveryModal && deliveredPackage && (
        <div className="modal-overlay" onClick={() => setShowDeliveryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">投递成功</h3>
              <button className="modal-close" onClick={() => setShowDeliveryModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="pickup-code-display">
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  取件码
                </div>
                <div className="pickup-code-big">
                  {deliveredPackage.pickupCode}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  格口号：<strong>{updatedCells.find((c) => c.id === deliveredPackage.cellId)?.code}</strong>
                </div>
              </div>
              <div className="package-info">
                <div className="package-info-row">
                  <span className="info-label">取件人</span>
                  <span className="info-value">{maskPhone(deliveredPackage.phone)}</span>
                </div>
                <div className="package-info-row">
                  <span className="info-label">包裹尺寸</span>
                  <span className="info-value">{CELL_SIZE_LABELS[deliveredPackage.size]}</span>
                </div>
                <div className="package-info-row">
                  <span className="info-label">快递单号</span>
                  <span className="info-value">{deliveredPackage.trackingNo}</span>
                </div>
                <div className="package-info-row">
                  <span className="info-label">投递时间</span>
                  <span className="info-value">{formatDateTime(deliveredPackage.deliveredAt)}</span>
                </div>
                {deliveredPackage.remark && (
                  <div className="package-info-row">
                    <span className="info-label">备注</span>
                    <span className="info-value">{deliveredPackage.remark}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowDeliveryModal(false)}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {showCellDetail && showCellDetail.packageId && (
        <div className="modal-overlay" onClick={() => setShowCellDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">格口 {showCellDetail.code} 详情</h3>
              <button className="modal-close" onClick={() => setShowCellDetail(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {(() => {
                const pkg = getCellPackage(showCellDetail);
                if (!pkg) return null;
                const overdueStatus = getOverdueHours(pkg.deliveredAt, now, retentionHours) > 0;
                return (
                  <>
                    <div className="package-info">
                      <div className="package-info-row">
                        <span className="info-label">格口号</span>
                        <span className="info-value">{showCellDetail.code}</span>
                      </div>
                      <div className="package-info-row">
                        <span className="info-label">快递单号</span>
                        <span className="info-value">{pkg.trackingNo}</span>
                      </div>
                      <div className="package-info-row">
                        <span className="info-label">取件人</span>
                        <span className="info-value">{maskPhone(pkg.phone)}</span>
                      </div>
                      <div className="package-info-row">
                        <span className="info-label">包裹尺寸</span>
                        <span className="info-value">{CELL_SIZE_LABELS[pkg.size]}</span>
                      </div>
                      <div className="package-info-row">
                        <span className="info-label">投递时间</span>
                        <span className="info-value">{formatDateTime(pkg.deliveredAt)}</span>
                      </div>
                      <div className="package-info-row">
                        <span className="info-label">状态</span>
                        <span
                          className="info-value"
                          style={{ color: overdueStatus ? '#ef4444' : '#22c55e', fontWeight: 600 }}
                        >
                          {overdueStatus ? `滞留超时 (${getOverdueHours(pkg.deliveredAt, now, retentionHours)}小时)` : '正常'}
                        </span>
                      </div>
                      <div className="package-info-row">
                        <span className="info-label">取件码</span>
                        <span className="info-value" style={{ fontFamily: 'monospace' }}>
                          {pkg.pickupCode}
                        </span>
                      </div>
                      {pkg.remark && (
                        <div className="package-info-row">
                          <span className="info-label">备注</span>
                          <span className="info-value">{pkg.remark}</span>
                        </div>
                      )}
                    </div>
                    <div className="cell-actions" style={{ marginTop: 16 }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleAdminPickup(showCellDetail)}
                      >
                        强制取件（管理员清空格口）
                      </button>
                      <button
                        className="btn btn-warning"
                        onClick={() => handleRegenerateCode(showCellDetail)}
                      >
                        重新生成取件码
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowCellDetail(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverdueModal && (
        <div className="modal-overlay" onClick={() => setShowOverdueModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">滞留超时包裹</h3>
              <button className="modal-close" onClick={() => setShowOverdueModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#666' }}>
                  共 {overduePackages.length} 个滞留包裹
                </span>
                <button className="btn btn-primary btn-sm" onClick={handleMarkAllProcessed}>
                  一键标记为已处理
                </button>
              </div>
              {overduePackages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <p>暂无滞留包裹</p>
                </div>
              ) : (
                <div className="overdue-list">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>格口号</th>
                        <th>快递单号</th>
                        <th>取件人</th>
                        <th>投递时间</th>
                        <th>超时时长</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overduePackages.map((pkg) => {
                        const cell = updatedCells.find((c) => c.id === pkg.cellId);
                        const overdueHrs = getOverdueHours(pkg.deliveredAt, now, retentionHours);
                        return (
                          <tr key={pkg.id}>
                            <td>{cell?.code || '-'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                              {pkg.trackingNo}
                            </td>
                            <td>{maskPhone(pkg.phone)}</td>
                            <td>{formatDateTime(pkg.deliveredAt)}</td>
                            <td style={{ color: '#ef4444', fontWeight: 500 }}>
                              {overdueHrs}小时
                            </td>
                            <td>
                              {pkg.processed ? (
                                <span style={{ color: '#22c55e' }}>已处理</span>
                              ) : (
                                <span style={{ color: '#ef4444' }}>待处理</span>
                              )}
                            </td>
                            <td>
                              {!pkg.processed && (
                                <button
                                  className="btn-link"
                                  onClick={() => handleMarkProcessed([pkg.id])}
                                >
                                  标记已处理
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowOverdueModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
