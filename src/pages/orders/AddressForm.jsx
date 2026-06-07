import { useState } from 'react';
import { CHINA_PROVINCES } from './constants.js';
import { validateAddress } from './utils.js';

export default function AddressForm({ isOpen, onClose, onSave, existingAddresses, onSelectAddress, selectedAddressId }) {
  const [form, setForm] = useState({
    receiver: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    const result = validateAddress(form);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    onSave(form);
    setForm({ receiver: '', phone: '', province: '', city: '', district: '', detail: '' });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="orders-modal-overlay" onClick={onClose} />
      <div className="orders-modal orders-modal-lg">
        <div className="orders-modal-header">
          <h2>收货地址</h2>
          <button type="button" className="orders-modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="orders-modal-body">
          {existingAddresses && existingAddresses.length > 0 && (
            <div className="orders-address-list">
              <div className="orders-section-title">已保存地址</div>
              <div className="orders-saved-addresses">
                {existingAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`orders-saved-address ${selectedAddressId === addr.id ? 'orders-saved-address-active' : ''}`}
                    onClick={() => onSelectAddress(addr)}
                  >
                    <div className="orders-saved-address-top">
                      <span className="orders-saved-address-receiver">{addr.receiver}</span>
                      <span className="orders-saved-address-phone">{addr.phone}</span>
                    </div>
                    <div className="orders-saved-address-detail">
                      {addr.province} {addr.city} {addr.district} {addr.detail}
                    </div>
                    {selectedAddressId === addr.id && (
                      <span className="orders-saved-address-tag">当前使用</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="orders-section-title">新增地址</div>
          <div className="orders-form-grid">
            <div className="orders-form-field">
              <label>收货人</label>
              <input
                type="text"
                value={form.receiver}
                onChange={(e) => handleChange('receiver', e.target.value)}
                placeholder="请输入收货人姓名"
                className={errors.receiver ? 'orders-input-error' : ''}
              />
              {errors.receiver && <div className="orders-error">{errors.receiver}</div>}
            </div>
            <div className="orders-form-field">
              <label>手机号</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="请输入11位手机号"
                className={errors.phone ? 'orders-input-error' : ''}
              />
              {errors.phone && <div className="orders-error">{errors.phone}</div>}
            </div>
            <div className="orders-form-field">
              <label>省份</label>
              <select
                value={form.province}
                onChange={(e) => handleChange('province', e.target.value)}
                className={errors.province ? 'orders-input-error' : ''}
              >
                <option value="">请选择省份</option>
                {CHINA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.province && <div className="orders-error">{errors.province}</div>}
            </div>
            <div className="orders-form-field">
              <label>城市</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="请输入城市"
                className={errors.city ? 'orders-input-error' : ''}
              />
              {errors.city && <div className="orders-error">{errors.city}</div>}
            </div>
            <div className="orders-form-field">
              <label>区/县</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => handleChange('district', e.target.value)}
                placeholder="请输入区/县"
                className={errors.district ? 'orders-input-error' : ''}
              />
              {errors.district && <div className="orders-error">{errors.district}</div>}
            </div>
            <div className="orders-form-field orders-form-field-full">
              <label>详细地址</label>
              <input
                type="text"
                value={form.detail}
                onChange={(e) => handleChange('detail', e.target.value)}
                placeholder="请输入详细地址（街道、门牌号等）"
                className={errors.detail ? 'orders-input-error' : ''}
              />
              {errors.detail && <div className="orders-error">{errors.detail}</div>}
            </div>
          </div>
        </div>
        <div className="orders-modal-footer">
          <button type="button" className="orders-btn orders-btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="orders-btn orders-btn-primary" onClick={handleSubmit}>
            保存并使用
          </button>
        </div>
      </div>
    </>
  );
}
