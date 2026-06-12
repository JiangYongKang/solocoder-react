import { useState, useEffect, useRef } from 'react';
import { ORDER_STATUSES, STATUS_LABELS } from './constants.js';
import { formatPrice, formatDateTime, buildOrderTimeline, advanceOrderStatus, getAdvancementDelay } from './utils.js';

export default function OrderTracking({ order, onBack, onOrderUpdate }) {
  const timerRef = useRef(null);

  const isTerminal = order.status === ORDER_STATUSES.DELIVERED || order.status === ORDER_STATUSES.CANCELLED;
  const timeline = buildOrderTimeline(order);

  const clearOrderTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    clearOrderTimer();

    if (isTerminal) return;

    const checkAndAdvance = () => {
      const advanced = advanceOrderStatus(order);
      if (advanced && advanced.status !== order.status) {
        onOrderUpdate(advanced);
      }
    };

    const initialDelay = getAdvancementDelay(order.status);
    if (initialDelay == null) return;

    let elapsed = 0;
    const checkInterval = 1000;

    timerRef.current = setInterval(() => {
      elapsed += checkInterval;
      if (elapsed >= initialDelay) {
        clearOrderTimer();
        checkAndAdvance();
      }
    }, checkInterval);

    return clearOrderTimer;
  }, [order, isTerminal, onOrderUpdate]);

  useEffect(() => {
    return clearOrderTimer;
  }, []);

  return (
    <div className="fo-tracking">
      <button className="fo-back-link" onClick={onBack}>← 返回订单列表</button>

      <div className="fo-tracking-order-info">
        <div className="fo-tracking-order-id">订单号：{order.id}</div>
        <div className="fo-tracking-order-status">{STATUS_LABELS[order.status]}</div>
        <div className="fo-tracking-order-time">下单时间：{formatDateTime(order.createdAt)}</div>
        <div className="fo-tracking-order-time">预计送达：{formatDateTime(order.estimatedDelivery)}</div>
        <div className="fo-tracking-order-time">订单总额：{formatPrice(order.total)}</div>
        <div className="fo-tracking-order-time">商家：{order.shopName}</div>
      </div>

      {!isTerminal && (
        <div className="fo-tracking-progression">
          <div className="fo-tracking-progression-spinner" />
          自动推进中...
        </div>
      )}

      <div className="fo-timeline">
        {timeline.map((item, idx) => {
          const itemClass = [
            'fo-timeline-item',
            item.completed ? 'fo-timeline-item-completed' : '',
            item.isCurrent ? 'fo-timeline-item-current' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={item.status} className={itemClass}>
              <div className="fo-timeline-dot" />
              {idx < timeline.length - 1 && <div className="fo-timeline-line" />}
              <div className="fo-timeline-content">
                <div className="fo-timeline-label">{item.label}</div>
                {item.time && (
                  <div className="fo-timeline-time">{formatDateTime(item.time)}</div>
                )}
                {item.note && (
                  <div className="fo-timeline-time">{item.note}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fo-checkout-section">
        <div className="fo-checkout-section-title">订单商品</div>
        <div className="fo-checkout-products">
          {order.items.map((item) => (
            <div key={item.cartItemId} className="fo-checkout-product">
              <div className="fo-checkout-product-name">
                {item.name}
                {item.specKey && <span className="fo-checkout-product-spec"> ({item.specKey})</span>}
              </div>
              <div className="fo-checkout-product-qty">×{item.quantity}</div>
              <div className="fo-checkout-product-price">{formatPrice(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>
        <div className="fo-checkout-total-row">
          <span>合计</span>
          <span className="fo-checkout-total-amount">{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
