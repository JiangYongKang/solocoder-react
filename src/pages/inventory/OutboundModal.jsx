import { useState, useMemo } from 'react';
import { getSkuStockInWarehouse, getSkuBatches, getBatchStatus } from './utils.js';
import { BATCH_STATUS_LABELS } from './constants.js';

function OutboundForm({ warehouses, skus, batches, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    warehouseId: warehouses[0]?.id || '',
    skuId: skus[0]?.id || '',
    quantity: '',
    operator: '',
    remark: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const currentStock = useMemo(() => {
    if (!formData.warehouseId || !formData.skuId) return 0;
    return getSkuStockInWarehouse(batches, formData.skuId, formData.warehouseId);
  }, [formData.warehouseId, formData.skuId, batches]);

  const skuBatches = useMemo(() => {
    if (!formData.warehouseId || !formData.skuId) return [];
    return getSkuBatches(batches, formData.skuId, formData.warehouseId);
  }, [formData.warehouseId, formData.skuId, batches]);

  const validate = () => {
    const errs = {};
    if (!formData.warehouseId) errs.warehouseId = '请选择仓库';
    if (!formData.skuId) errs.skuId = '请选择SKU';
    const qty = Number(formData.quantity);
    if (!formData.quantity || qty <= 0 || isNaN(qty)) {
      errs.quantity = '请输入有效的出库数量';
    } else if (qty > currentStock) {
      errs.quantity = `出库数量不能超过当前库存量(${currentStock})`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const success = onSubmit({
      ...formData,
      quantity: Number(formData.quantity),
    });
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">出库单</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                仓库 <span className="required">*</span>
              </label>
              <select
                className={`form-select ${errors.warehouseId ? 'error' : ''}`}
                value={formData.warehouseId}
                onChange={(e) => handleChange('warehouseId', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: errors.warehouseId ? '1px solid #ff4d4f' : '1px solid #d9d9d9', borderRadius: 4 }}
              >
                <option value="">请选择仓库</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.warehouseId && (
                <div className="form-error">{errors.warehouseId}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                SKU <span className="required">*</span>
              </label>
              <select
                className={`form-select ${errors.skuId ? 'error' : ''}`}
                value={formData.skuId}
                onChange={(e) => handleChange('skuId', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: errors.skuId ? '1px solid #ff4d4f' : '1px solid #d9d9d9', borderRadius: 4 }}
              >
                <option value="">请选择SKU</option>
                {skus.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              {errors.skuId && <div className="form-error">{errors.skuId}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              出库数量 <span className="required">*</span>
            </label>
            <input
              type="number"
              className={`form-input ${errors.quantity ? 'error' : ''}`}
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder={`当前库存: ${currentStock}`}
              min="1"
              max={currentStock}
            />
            {errors.quantity && (
              <div className="form-error">{errors.quantity}</div>
            )}
          </div>

          {skuBatches.length > 0 && (
            <div className="form-group">
              <label className="form-label">可用批次 (按先进先出自动分配)</label>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>批次号</th>
                    <th>数量</th>
                    <th>有效期</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {skuBatches.map((b) => {
                    const status = getBatchStatus(b);
                    return (
                      <tr key={b.id}>
                        <td>{b.batchNo}</td>
                        <td>{b.quantity}</td>
                        <td>{b.expiryDate || '-'}</td>
                        <td>
                          <span className={`batch-tag ${status}`}>
                            {BATCH_STATUS_LABELS[status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">操作人</label>
            <input
              type="text"
              className="form-input"
              value={formData.operator}
              onChange={(e) => handleChange('operator', e.target.value)}
              placeholder="请输入操作人姓名"
            />
          </div>

          <div className="form-group">
            <label className="form-label">备注</label>
            <textarea
              className="form-textarea"
              value={formData.remark}
              onChange={(e) => handleChange('remark', e.target.value)}
              placeholder="请输入备注信息"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-warning" onClick={handleSubmit}>
            确认出库
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OutboundModal({ isOpen, onClose, warehouses, skus, batches, onSubmit }) {
  if (!isOpen) return null;
  return <OutboundForm warehouses={warehouses} skus={skus} batches={batches} onClose={onClose} onSubmit={onSubmit} />;
}
