import {
  ORDER_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_NEXT_LABEL,
  PAGE_SIZE,
} from './constants.js';
import {
  formatPrice,
  formatDateTime,
  buildLogisticsTimeline,
  paginateOrders,
  filterOrdersByStatus,
  handleImageFallback,
} from './utils.js';
import { useState, useMemo } from 'react';

const TABS = [
  { key: '', label: '全部' },
  { key: ORDER_STATUSES.PENDING_PAYMENT, label: STATUS_LABELS[ORDER_STATUSES.PENDING_PAYMENT] },
  { key: ORDER_STATUSES.PAID, label: STATUS_LABELS[ORDER_STATUSES.PAID] },
  { key: ORDER_STATUSES.SHIPPED, label: STATUS_LABELS[ORDER_STATUSES.SHIPPED] },
  { key: ORDER_STATUSES.COMPLETED, label: STATUS_LABELS[ORDER_STATUSES.COMPLETED] },
  { key: ORDER_STATUSES.CANCELLED, label: STATUS_LABELS[ORDER_STATUSES.CANCELLED] },
];

export default function OrderList({ orders, onAdvance, onCancel }) {
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState({});

  const filtered = useMemo(() => filterOrdersByStatus(orders, activeTab), [orders, activeTab]);
  const pagination = useMemo(() => paginateOrders(filtered, page, PAGE_SIZE), [filtered, page]);
  const pagedOrders = pagination.items;

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  return (
    <div className="orders-list">
      <div className="orders-tabs">
        {TABS.map((tab) => {
          const count = tab.key
            ? filterOrdersByStatus(orders, tab.key).length
            : orders.length;
          return (
            <button
              key={tab.key}
              type="button"
              className={`orders-tab ${activeTab === tab.key ? 'orders-tab-active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
              <span className="orders-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {pagedOrders.length === 0 ? (
        <div className="orders-empty orders-empty-center">暂无订单</div>
      ) : (
        <div className="orders-items">
          {pagedOrders.map((order) => {
            const isExpanded = expandedIds[order.id];
            const timeline = buildLogisticsTimeline(order);
            return (
              <div key={order.id} className="orders-item">
                <div className="orders-item-header" onClick={() => toggleExpand(order.id)}>
                  <div className="orders-item-header-left">
                    <span className="orders-item-id">订单号: {order.id}</span>
                    <span className="orders-item-time">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="orders-item-header-right">
                    <span
                      className="orders-status-badge"
                      style={{ color: STATUS_COLORS[order.status], background: `${STATUS_COLORS[order.status]}1a` }}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="orders-item-expand">{isExpanded ? '收起 ▲' : '展开 ▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="orders-item-body">
                    <div className="orders-item-section">
                      <div className="orders-section-title">商品信息</div>
                      <div className="orders-item-products">
                        {order.items.map((item) => (
                          <div key={item.productId} className="orders-item-product">
                            <div className="orders-item-product-image">
                              <img src={item.image} alt={item.name} onError={handleImageFallback} />
                            </div>
                            <div className="orders-item-product-info">
                              <div className="orders-item-product-name">{item.name}</div>
                              <div className="orders-item-product-price">{formatPrice(item.price)} × {item.quantity}</div>
                            </div>
                            <div className="orders-item-product-subtotal">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="orders-item-total">
                        订单金额: <span className="orders-item-total-amount">{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    <div className="orders-item-section">
                      <div className="orders-section-title">收货信息</div>
                      <div className="orders-item-address">
                        <div>
                          <strong>{order.address.receiver}</strong>
                          <span className="orders-item-address-phone">{order.address.phone}</span>
                        </div>
                        <div className="orders-item-address-detail">
                          {order.address.province} {order.address.city} {order.address.district} {order.address.detail}
                        </div>
                      </div>
                    </div>

                    {order.status === ORDER_STATUSES.COMPLETED && timeline.length > 0 && (
                      <div className="orders-item-section">
                        <div className="orders-section-title">物流轨迹</div>
                        <div className="orders-logistics">
                          {timeline.map((entry, idx) => (
                            <div
                              key={idx}
                              className={`orders-logistics-item ${entry.isLatest ? 'orders-logistics-item-latest' : ''}`}
                            >
                              <div className="orders-logistics-dot" />
                              <div className="orders-logistics-line" />
                              <div className="orders-logistics-content">
                                <div className="orders-logistics-label">{entry.label}</div>
                                <div className="orders-logistics-time">{formatDateTime(entry.time)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="orders-item-section">
                      <div className="orders-section-title">状态流转</div>
                      <div className="orders-history">
                        {[...(order.history || [])].reverse().map((h, idx) => (
                          <div key={idx} className="orders-history-item">
                            <span
                              className="orders-status-badge orders-status-badge-sm"
                              style={{ color: STATUS_COLORS[h.status], background: `${STATUS_COLORS[h.status]}1a` }}
                            >
                              {STATUS_LABELS[h.status]}
                            </span>
                            <span className="orders-history-note">{h.note}</span>
                            <span className="orders-history-time">{formatDateTime(h.time)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="orders-item-actions">
                      {order.status !== ORDER_STATUSES.COMPLETED &&
                        order.status !== ORDER_STATUSES.CANCELLED &&
                        STATUS_NEXT_LABEL[order.status] && (
                          <button
                            type="button"
                            className="orders-btn orders-btn-primary"
                            onClick={() => onAdvance(order.id)}
                          >
                            {STATUS_NEXT_LABEL[order.status]}
                          </button>
                        )}
                      {order.status === ORDER_STATUSES.PENDING_PAYMENT && (
                        <button
                          type="button"
                          className="orders-btn orders-btn-danger"
                          onClick={() => onCancel(order.id)}
                        >
                          取消订单
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="orders-pagination">
          <button
            type="button"
            className="orders-btn orders-btn-ghost orders-btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.currentPage <= 1}
          >
            上一页
          </button>
          <span className="orders-pagination-info">
            第 {pagination.currentPage} / {pagination.totalPages} 页
          </span>
          <button
            type="button"
            className="orders-btn orders-btn-ghost orders-btn-sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
