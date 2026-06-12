import { useState } from 'react';
import { ORDER_STATUSES, STATUS_LABELS } from './constants.js';
import { formatPrice, formatDateTime, filterOrdersByStatus } from './utils.js';

const FILTER_TABS = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'delivered' },
  { label: '已取消', value: 'cancelled' },
];

function getStatusBadgeClass(status) {
  switch (status) {
    case ORDER_STATUSES.PLACED:
    case ORDER_STATUSES.ACCEPTED:
      return 'fo-status-pending';
    case ORDER_STATUSES.PICKED_UP:
      return 'fo-status-processing';
    case ORDER_STATUSES.DELIVERING:
      return 'fo-status-delivering';
    case ORDER_STATUSES.DELIVERED:
      return 'fo-status-completed';
    case ORDER_STATUSES.CANCELLED:
      return 'fo-status-cancelled';
    default:
      return '';
  }
}

export default function OrderHistory({ orders, onViewOrder, onBack }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = filterOrdersByStatus(orders, activeFilter);

  return (
    <div className="fo-history">
      <button className="fo-back-link" onClick={onBack}>← 返回</button>
      <h2 className="fo-title">我的订单</h2>

      <div className="fo-history-tabs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`fo-history-tab ${activeFilter === tab.value ? 'fo-history-tab-active' : ''}`}
            onClick={() => setActiveFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="fo-history-list">暂无相关订单</div>
      ) : (
        <div className="fo-history-list">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="fo-history-item"
              onClick={() => onViewOrder(order)}
            >
              <div className="fo-history-item-top">
                <span className="fo-history-item-shop">{order.shopName}</span>
                <span className="fo-history-item-time">{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="fo-history-item-bottom">
                <span className={`fo-status-badge ${getStatusBadgeClass(order.status)}`}>
                  {STATUS_LABELS[order.status]}
                </span>
                <span className="fo-history-item-amount">{formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
