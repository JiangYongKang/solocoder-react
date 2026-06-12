import { useState } from 'react';
import { formatPrice, calcCartTotal, validateAddress, addAddress } from './utils.js';
import { QUICK_REMARKS, CHINA_PROVINCES, MAX_ADDRESSES } from './constants.js';

const EMPTY_FORM = { receiver: '', phone: '', province: '', city: '', district: '', detail: '' };

export default function CheckoutPage({
  cart,
  addresses,
  selectedAddress,
  onSubmit,
  onBack,
  onSelectAddress,
  onAddNewAddress,
}) {
  const [customRemark, setCustomRemark] = useState('');
  const [selectedQuickRemarks, setSelectedQuickRemarks] = useState(new Set());
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({ ...EMPTY_FORM });
  const [addressErrors, setAddressErrors] = useState({});

  const toggleQuickRemark = (remark) => {
    setSelectedQuickRemarks((prev) => {
      const next = new Set(prev);
      if (next.has(remark)) {
        next.delete(remark);
      } else {
        next.add(remark);
      }
      return next;
    });
  };

  const openAddressForm = () => {
    setAddressForm({ ...EMPTY_FORM });
    setAddressErrors({});
    setAddressFormOpen(true);
  };

  const closeAddressForm = () => {
    setAddressFormOpen(false);
    setAddressErrors({});
  };

  const handleFormChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    if (addressErrors[field]) {
      setAddressErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSaveAddress = () => {
    const { valid, errors } = validateAddress(addressForm);
    if (!valid) {
      setAddressErrors(errors);
      return;
    }
    onAddNewAddress(addressForm);
    closeAddressForm();
  };

  const handleSubmit = () => {
    if (!selectedAddress) {
      alert('请先选择收货地址');
      return;
    }
    const remark = [...selectedQuickRemarks, customRemark].filter(Boolean).join('，');
    onSubmit({ address: selectedAddress, remark });
  };

  return (
    <div className="fo-checkout">
      <button className="fo-back-link" onClick={onBack}>← 返回</button>

      <div className="fo-checkout-section">
        <div className="fo-checkout-section-title">收货地址</div>
        {selectedAddress ? (
          <div className="fo-checkout-address-card">
            <div className="fo-checkout-address-top">
              <span className="fo-checkout-address-name">{selectedAddress.receiver}</span>
              <span className="fo-checkout-address-phone">{selectedAddress.phone}</span>
            </div>
            <div className="fo-checkout-address-detail">
              {selectedAddress.province}{selectedAddress.city}{selectedAddress.district}{selectedAddress.detail}
            </div>
          </div>
        ) : (
          <div className="fo-checkout-address-empty">
            <span>请选择收货地址</span>
            <button onClick={openAddressForm}>新增地址</button>
          </div>
        )}
        {addresses.length > 0 && (
          <div>
            {addresses.slice(0, MAX_ADDRESSES).map((addr) => (
              <div
                key={addr.id}
                className="fo-checkout-address-card"
                style={selectedAddress && selectedAddress.id === addr.id ? { border: '2px solid #1890ff' } : {}}
                onClick={() => onSelectAddress(addr)}
              >
                <div className="fo-checkout-address-top">
                  <span className="fo-checkout-address-name">{addr.receiver}</span>
                  <span className="fo-checkout-address-phone">{addr.phone}</span>
                </div>
                <div className="fo-checkout-address-detail">
                  {addr.province}{addr.city}{addr.district}{addr.detail}
                </div>
              </div>
            ))}
            <button onClick={openAddressForm}>新增地址</button>
          </div>
        )}
      </div>

      <div className="fo-checkout-section fo-remark-section">
        <div className="fo-checkout-section-title">备注</div>
        <div className="fo-remark-tags">
          {QUICK_REMARKS.map((remark) => (
            <span
              key={remark}
              className={`fo-remark-tag${selectedQuickRemarks.has(remark) ? ' fo-remark-tag-active' : ''}`}
              onClick={() => toggleQuickRemark(remark)}
            >
              {remark}
            </span>
          ))}
        </div>
        <textarea
          className="fo-remark-input"
          maxLength={200}
          value={customRemark}
          onChange={(e) => setCustomRemark(e.target.value)}
          placeholder="备注信息（选填）"
        />
      </div>

      <div className="fo-checkout-section">
        <div className="fo-checkout-section-title">订单详情</div>
        <div className="fo-checkout-products">
          {cart.map((item) => (
            <div key={item.cartItemId} className="fo-checkout-product">
              <span className="fo-checkout-product-name">{item.name}</span>
              {item.specKey && <span className="fo-checkout-product-spec">({item.specKey})</span>}
              <span className="fo-checkout-product-qty">{formatPrice(item.price)} × {item.quantity}</span>
              <span className="fo-checkout-product-price">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="fo-checkout-total-row">
          <span>合计</span>
          <span className="fo-checkout-total-amount">{formatPrice(calcCartTotal(cart))}</span>
        </div>
      </div>

      <button className="fo-checkout-submit" onClick={handleSubmit}>提交订单</button>

      {addressFormOpen && (
        <div className="fo-address-modal" onClick={closeAddressForm}>
          <div className="fo-address-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fo-address-modal-header">
              <span>新增收货地址</span>
              <button className="fo-address-modal-close" onClick={closeAddressForm}>✕</button>
            </div>
            <div className="fo-address-modal-body">
              <div className="fo-address-field-row">
                <div className="fo-address-field">
                  <input
                    placeholder="收货人"
                    value={addressForm.receiver}
                    onChange={(e) => handleFormChange('receiver', e.target.value)}
                  />
                  {addressErrors.receiver && <span>{addressErrors.receiver}</span>}
                </div>
                <div className="fo-address-field">
                  <input
                    placeholder="手机号"
                    value={addressForm.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                  {addressErrors.phone && <span>{addressErrors.phone}</span>}
                </div>
              </div>
              <div className="fo-address-field-row">
                <div className="fo-address-field">
                  <select
                    value={addressForm.province}
                    onChange={(e) => handleFormChange('province', e.target.value)}
                  >
                    <option value="">选择省份</option>
                    {CHINA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {addressErrors.province && <span>{addressErrors.province}</span>}
                </div>
                <div className="fo-address-field">
                  <input
                    placeholder="城市"
                    value={addressForm.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                  />
                  {addressErrors.city && <span>{addressErrors.city}</span>}
                </div>
              </div>
              <div className="fo-address-field-row">
                <div className="fo-address-field">
                  <input
                    placeholder="区/县"
                    value={addressForm.district}
                    onChange={(e) => handleFormChange('district', e.target.value)}
                  />
                  {addressErrors.district && <span>{addressErrors.district}</span>}
                </div>
              </div>
              <div className="fo-address-field-row">
                <div className="fo-address-field">
                  <input
                    placeholder="详细地址"
                    value={addressForm.detail}
                    onChange={(e) => handleFormChange('detail', e.target.value)}
                  />
                  {addressErrors.detail && <span>{addressErrors.detail}</span>}
                </div>
              </div>
            </div>
            <div className="fo-address-modal-footer">
              <button className="fo-address-btn fo-address-btn-ghost" onClick={closeAddressForm}>取消</button>
              <button className="fo-address-btn fo-address-btn-primary" onClick={handleSaveAddress}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
