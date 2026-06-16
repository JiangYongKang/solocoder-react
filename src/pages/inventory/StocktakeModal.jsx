import { useState, useMemo } from 'react';
import { getSkuStockInWarehouse, calculateStocktakeDiff } from './utils.js';

function StocktakeForm({ warehouses, skus, batches, onClose, onSubmit }) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [stocktakeItems, setStocktakeItems] = useState([]);
  const [operator, setOperator] = useState('');
  const [step, setStep] = useState('select');

  const warehouseSkus = useMemo(() => {
    if (!warehouseId) return [];
    const result = [];
    for (const sku of skus) {
      const stock = getSkuStockInWarehouse(batches, sku.id, warehouseId);
      if (stock > 0) {
        result.push({ ...sku, stock });
      }
    }
    return result;
  }, [warehouseId, skus, batches]);

  const handleStartStocktake = () => {
    if (!warehouseId) {
      alert('请选择仓库');
      return;
    }
    if (warehouseSkus.length === 0) {
      alert('该仓库暂无库存');
      return;
    }
    const items = warehouseSkus.map((sku) => ({
      skuId: sku.id,
      skuName: sku.name,
      skuCode: sku.code,
      systemQty: sku.stock,
      actualQty: sku.stock,
      remark: '',
    }));
    setStocktakeItems(items);
    setStep('input');
  };

  const handleActualQtyChange = (skuId, value) => {
    setStocktakeItems((prev) =>
      prev.map((item) =>
        item.skuId === skuId
          ? { ...item, actualQty: Number(value) || 0 }
          : item
      )
    );
  };

  const handleRemarkChange = (skuId, value) => {
    setStocktakeItems((prev) =>
      prev.map((item) =>
        item.skuId === skuId ? { ...item, remark: value } : item
      )
    );
  };

  const diffItems = useMemo(() => {
    return stocktakeItems.filter(
      (item) => calculateStocktakeDiff(item.systemQty, item.actualQty) !== 0
    );
  }, [stocktakeItems]);

  const handleSubmit = () => {
    if (stocktakeItems.length === 0) return;
    const confirmed = window.confirm(
      `确认提交盘点？共 ${stocktakeItems.length} 项，其中差异 ${diffItems.length} 项。`
    );
    if (!confirmed) return;
    const success = onSubmit(warehouseId, stocktakeItems, operator || '系统');
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width: 700, maxWidth: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {step === 'select' ? '选择仓库' : '库存盘点'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {step === 'select' ? (
            <div>
              <div className="form-group">
                <label className="form-label">
                  选择仓库 <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 4 }}
                >
                  <option value="">请选择仓库</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">操作人</label>
                <input
                  type="text"
                  className="form-input"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="请输入操作人姓名"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="stocktake-summary">
                <div className="stocktake-summary-item">
                  <span className="stocktake-summary-label">仓库:</span>
                  <span className="stocktake-summary-value">
                    {warehouses.find((w) => w.id === warehouseId)?.name}
                  </span>
                </div>
                <div className="stocktake-summary-item">
                  <span className="stocktake-summary-label">总项数:</span>
                  <span className="stocktake-summary-value">
                    {stocktakeItems.length}
                  </span>
                </div>
                <div className="stocktake-summary-item">
                  <span className="stocktake-summary-label">差异数:</span>
                  <span
                    className={`stocktake-summary-value ${diffItems.length > 0 ? 'diff-negative' : ''}`}
                  >
                    {diffItems.length}
                  </span>
                </div>
              </div>

              <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
                <table className="data-table">
                  <thead style={{ position: 'sticky', top: 0 }}>
                    <tr>
                      <th>SKU名称</th>
                      <th>系统库存</th>
                      <th>实盘数量</th>
                      <th>差异</th>
                      <th>差异原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocktakeItems.map((item) => {
                      const diff = calculateStocktakeDiff(item.systemQty, item.actualQty);
                      const hasDiff = diff !== 0;
                      return (
                        <tr key={item.skuId} className={hasDiff ? 'row-warning' : ''}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{item.skuName}</div>
                            <div style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>
                              {item.skuCode}
                            </div>
                          </td>
                          <td style={{ color: '#666' }}>{item.systemQty}</td>
                          <td style={{ width: 100 }}>
                            <input
                              type="number"
                              className="form-input"
                              value={item.actualQty}
                              onChange={(e) =>
                                handleActualQtyChange(item.skuId, e.target.value)
                              }
                              min="0"
                              style={{ padding: '4px 8px', fontSize: 13 }}
                            />
                          </td>
                          <td
                            className={
                              diff > 0
                                ? 'diff-positive'
                                : diff < 0
                                ? 'diff-negative'
                                : ''
                            }
                            style={{ fontWeight: 500, width: 60, textAlign: 'center' }}
                          >
                            {diff > 0 ? '+' : ''}
                            {diff}
                          </td>
                          <td style={{ width: 160 }}>
                            <input
                              type="text"
                              className="form-input"
                              value={item.remark}
                              onChange={(e) =>
                                handleRemarkChange(item.skuId, e.target.value)
                              }
                              placeholder="差异原因"
                              style={{ padding: '4px 8px', fontSize: 13 }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {step === 'select' ? (
            <>
              <button className="btn" onClick={onClose}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleStartStocktake}>
                开始盘点
              </button>
            </>
          ) : (
            <>
              <button
                className="btn"
                onClick={() => setStep('select')}
              >
                返回
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                提交盘点
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StocktakeModal({ isOpen, onClose, warehouses, skus, batches, onSubmit }) {
  if (!isOpen) return null;
  return <StocktakeForm warehouses={warehouses} skus={skus} batches={batches} onClose={onClose} onSubmit={onSubmit} />;
}
