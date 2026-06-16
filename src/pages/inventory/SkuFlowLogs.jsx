import { useState, useMemo } from 'react';
import {
  getSkuFlowLogs,
  getSkuTotalStock,
  getStockStatus,
  formatDateTime,
} from './utils.js';
import { STOCK_STATUS_LABELS, FLOW_LOG_TYPE_LABELS } from './constants.js';

export default function SkuFlowLogs({
  isOpen,
  onClose,
  sku,
  flowLogs,
  warehouses,
  batches,
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const totalStock = useMemo(
    () => getSkuTotalStock(batches, sku.id),
    [batches, sku.id]
  );

  const stockStatus = useMemo(
    () => getStockStatus(totalStock, sku.safetyStock),
    [totalStock, sku.safetyStock]
  );

  const filteredLogs = useMemo(() => {
    const options = {};
    if (startDate) {
      options.startTime = new Date(startDate).setHours(0, 0, 0, 0);
    }
    if (endDate) {
      options.endTime = new Date(endDate).setHours(23, 59, 59, 999);
    }
    return getSkuFlowLogs(flowLogs, sku.id, options);
  }, [flowLogs, sku.id, startDate, endDate]);

  const getWarehouseName = (id) => warehouses.find((w) => w.id === id)?.name || id;

  const getFlowIconClass = (type) => {
    if (type === 'inbound') return 'inbound';
    if (type === 'outbound') return 'outbound';
    if (type === 'transfer_in' || type === 'transfer_out') return 'transfer';
    if (type === 'stocktake') return 'stocktake';
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width: 720, maxWidth: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">SKU库存流水</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="sku-detail-header" style={{ margin: 0, borderRadius: 0, borderBottom: '1px solid #f0f0f0' }}>
          <h3 className="sku-detail-title">{sku.name}</h3>
          <div className="sku-detail-meta">
            <span>编码: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>{sku.code}</code></span>
            <span>分类: {sku.category || '-'}</span>
            <span>单位: {sku.unit || '-'}</span>
          </div>
          <div className="sku-detail-stock">
            <div className="stock-item">
              <div className="stock-item-label">当前库存</div>
              <div className="stock-item-value" style={{
                color: stockStatus === 'danger' ? '#ff4d4f' : stockStatus === 'warning' ? '#faad14' : '#52c41a'
              }}>
                {totalStock}
              </div>
            </div>
            <div className="stock-item">
              <div className="stock-item-label">安全库存</div>
              <div className="stock-item-value" style={{ fontSize: 16, color: '#666' }}>
                {sku.safetyStock}
              </div>
            </div>
            <div className="stock-item">
              <div className="stock-item-label">库存状态</div>
              <div className="stock-item-value" style={{ fontSize: 14 }}>
                <span className={`stock-tag ${stockStatus}`}>
                  {STOCK_STATUS_LABELS[stockStatus]}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="filter-bar" style={{ padding: '12px 24px', margin: 0 }}>
          <div className="filter-item">
            <label>开始日期:</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: 150 }}
            />
          </div>
          <div className="filter-item">
            <label>结束日期:</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: 150 }}
            />
          </div>
          <div className="filter-item">
            <span style={{ fontSize: 13, color: '#666' }}>
              共 {filteredLogs.length} 条记录
            </span>
          </div>
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '0 24px 24px' }}>
          {filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>暂无流水记录</p>
            </div>
          ) : (
            <div className="flow-timeline" style={{ padding: 0, boxShadow: 'none' }}>
              {filteredLogs.map((log) => (
                <div key={log.id} className="flow-item">
                  <div className={`flow-icon ${getFlowIconClass(log.type)}`}>
                    {log.type === 'inbound' || log.type === 'transfer_in' ? '+' : log.type === 'outbound' || log.type === 'transfer_out' ? '-' : '='}
                  </div>
                  <div className="flow-content">
                    <div className="flow-header">
                      <span className="flow-type">
                        {FLOW_LOG_TYPE_LABELS[log.type] || log.type}
                      </span>
                      <span className="flow-time">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <div className="flow-detail">
                      仓库: {getWarehouseName(log.warehouseId)}
                      {log.batchNo && ` · 批次: ${log.batchNo}`}
                      {log.remark && ` · ${log.remark}`}
                      {log.refId && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#999', fontFamily: 'monospace' }}>
                          #{log.refId.slice(0, 12)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flow-quantity">
                    <div
                      className={`flow-quantity-change ${
                        log.quantityChange > 0 ? 'positive' : 'negative'
                      }`}
                    >
                      {log.quantityChange > 0 ? '+' : ''}
                      {log.quantityChange}
                    </div>
                    <div className="flow-quantity-balance">
                      余额: {log.balanceAfter}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
