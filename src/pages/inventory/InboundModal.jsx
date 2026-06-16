import { useState } from 'react';

function InboundForm({ warehouses, skus, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    warehouseId: warehouses[0]?.id || '',
    skuId: skus[0]?.id || '',
    quantity: '',
    batchNo: '',
    productionDate: '',
    expiryDate: '',
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

  const validate = () => {
    const errs = {};
    if (!formData.warehouseId) errs.warehouseId = '请选择仓库';
    if (!formData.skuId) errs.skuId = '请选择SKU';
    const qty = Number(formData.quantity);
    if (!formData.quantity || qty <= 0 || isNaN(qty)) {
      errs.quantity = '请输入有效的入库数量';
    }
    if (!formData.batchNo.trim()) errs.batchNo = '请输入批次号';
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
          <h3 className="modal-title">入库单</h3>
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                入库数量 <span className="required">*</span>
              </label>
              <input
                type="number"
                className={`form-input ${errors.quantity ? 'error' : ''}`}
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="请输入入库数量"
                min="1"
              />
              {errors.quantity && (
                <div className="form-error">{errors.quantity}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                批次号 <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.batchNo ? 'error' : ''}`}
                value={formData.batchNo}
                onChange={(e) => handleChange('batchNo', e.target.value)}
                placeholder="请输入批次号"
              />
              {errors.batchNo && (
                <div className="form-error">{errors.batchNo}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">生产日期</label>
              <input
                type="date"
                className="form-input"
                value={formData.productionDate}
                onChange={(e) => handleChange('productionDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">有效期至</label>
              <input
                type="date"
                className="form-input"
                value={formData.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
              />
            </div>
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
            确认入库
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InboundModal({ isOpen, onClose, warehouses, skus, onSubmit }) {
  if (!isOpen) return null;
  return <InboundForm warehouses={warehouses} skus={skus} onClose={onClose} onSubmit={onSubmit} />;
}
