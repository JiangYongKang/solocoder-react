import { useState, useMemo } from 'react';
import { getSkuStockInWarehouse, validateTransfer } from './utils.js';

function TransferForm({ warehouses, skus, batches, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    sourceWarehouseId: warehouses[0]?.id || '',
    targetWarehouseId: warehouses[1]?.id || warehouses[0]?.id || '',
    skuId: skus[0]?.id || '',
    quantity: '',
    operator: '',
    remark: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const sourceStock = useMemo(() => {
    if (!formData.sourceWarehouseId || !formData.skuId) return 0;
    return getSkuStockInWarehouse(batches, formData.skuId, formData.sourceWarehouseId);
  }, [formData.sourceWarehouseId, formData.skuId, batches]);

  const validate = () => {
    const result = validateTransfer(formData, batches);
    setErrors(result.errors);
    return result.valid;
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
          <h3 className="modal-title">仓库调拨</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                源仓库 <span className="required">*</span>
              </label>
              <select
                className={`form-select ${errors.sourceWarehouseId ? 'error' : ''}`}
                value={formData.sourceWarehouseId}
                onChange={(e) => handleChange('sourceWarehouseId', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: errors.sourceWarehouseId ? '1px solid #ff4d4f' : '1px solid #d9d9d9', borderRadius: 4 }}
              >
                <option value="">请选择源仓库</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.sourceWarehouseId && (
                <div className="form-error">{errors.sourceWarehouseId}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                目标仓库 <span className="required">*</span>
              </label>
              <select
                className={`form-select ${errors.targetWarehouseId ? 'error' : ''}`}
                value={formData.targetWarehouseId}
                onChange={(e) => handleChange('targetWarehouseId', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: errors.targetWarehouseId ? '1px solid #ff4d4f' : '1px solid #d9d9d9', borderRadius: 4 }}
              >
                <option value="">请选择目标仓库</option>
                {warehouses
                  .filter((w) => w.id !== formData.sourceWarehouseId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </select>
              {errors.targetWarehouseId && (
                <div className="form-error">{errors.targetWarehouseId}</div>
              )}
            </div>
          </div>

          <div className="form-row">
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
            <div className="form-group">
              <label className="form-label">
                调拨数量 <span className="required">*</span>
              </label>
              <input
                type="number"
                className={`form-input ${errors.quantity ? 'error' : ''}`}
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder={`源仓库库存: ${sourceStock}`}
                min="1"
              />
              {errors.quantity && (
                <div className="form-error">{errors.quantity}</div>
              )}
            </div>
          </div>

          <div style={{
            padding: '10px 12px',
            background: '#f5f5f5',
            borderRadius: 4,
            fontSize: 13,
            color: '#666',
            marginBottom: 16,
          }}>
            源仓库当前库存: <strong style={{ color: '#333' }}>{sourceStock}</strong>
          </div>

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
          <button className="btn btn-primary" onClick={handleSubmit}>
            确认调拨
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransferModal({ isOpen, onClose, warehouses, skus, batches, onSubmit }) {
  if (!isOpen) return null;
  return <TransferForm warehouses={warehouses} skus={skus} batches={batches} onClose={onClose} onSubmit={onSubmit} />;
}
