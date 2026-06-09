import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import './points-mall.css'
import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPE_COLORS,
  TRANSACTION_TYPE_ICONS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  POINTS_RULES,
} from './constants.js'
import {
  loadPoints,
  savePoints,
  loadHistory,
  saveHistory,
  loadOrders,
  saveOrders,
  loadProducts,
  saveProducts,
  loadUserProductLimits,
  saveUserProductLimits,
  exchangeProduct,
  canExchange,
  checkPurchaseLimit,
  adjustPoints,
  processExpiredPoints,
  getExpiringWarning,
  filterHistory,
  sortHistory,
  filterOrders,
  formatDateTime,
  buildTrendData,
  calculateMonthlyStats,
} from './pointsMallUtils.js'

const TAB_MALL = 'mall'
const TAB_HISTORY = 'history'
const TAB_ORDERS = 'orders'
const TAB_TREND = 'trend'

function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 2500)
      return () => clearTimeout(timer)
    }
  }, [message, onClose])

  if (!message) return null

  return (
    <div className={`pm-toast ${type}`}>
      {message}
    </div>
  )
}

function RulesModal({ onClose, onAdjustPoints }) {
  const [adjustAmount, setAdjustAmount] = useState('')

  const handleEarn = () => {
    const amount = Number(adjustAmount)
    if (amount > 0) {
      onAdjustPoints(amount, '手动增加积分')
      setAdjustAmount('')
    }
  }

  const handleDeduct = () => {
    const amount = Number(adjustAmount)
    if (amount > 0) {
      onAdjustPoints(-amount, '手动扣减积分')
      setAdjustAmount('')
    }
  }

  return (
    <div className="pm-modal-backdrop" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2 className="pm-modal-title">积分规则</h2>
          <button className="pm-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="pm-modal-body">
          <ul className="pm-rules-list">
            {POINTS_RULES.map((rule) => (
              <li key={rule.id} className="pm-rule-item">
                <div className="pm-rule-info">
                  <p className="pm-rule-name">{rule.name}</p>
                  <p className="pm-rule-desc">{rule.desc}</p>
                </div>
                <div className="pm-rule-points">+{rule.points}</div>
              </li>
            ))}
          </ul>
          <div className="pm-adjust-section">
            <p className="pm-adjust-title">手动调整积分（测试用）</p>
            <div className="pm-adjust-row">
              <input
                type="number"
                className="pm-adjust-input"
                placeholder="输入积分数量"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                min="1"
              />
              <button className="pm-adjust-btn earn" onClick={handleEarn}>
                增加
              </button>
              <button className="pm-adjust-btn deduct" onClick={handleDeduct}>
                扣减
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExchangeConfirmModal({ product, onClose, onConfirm }) {
  if (!product) return null

  return (
    <div className="pm-modal-backdrop" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2 className="pm-modal-title">确认兑换</h2>
          <button className="pm-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="pm-modal-body pm-confirm-dialog">
          <div className="pm-confirm-emoji">{product.emoji}</div>
          <p className="pm-confirm-product">{product.name}</p>
          <p className="pm-confirm-points">{product.points} 积分</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: 0 }}>
            {product.description}
          </p>
        </div>
        <div className="pm-modal-actions">
          <button className="pm-btn pm-btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="pm-btn pm-btn-primary" onClick={onConfirm}>
            确认兑换
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderDetailModal({ order, onClose }) {
  if (!order) return null

  return (
    <div className="pm-modal-backdrop" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2 className="pm-modal-title">订单详情</h2>
          <button className="pm-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="pm-modal-body">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 64 }}>{order.productEmoji}</div>
            <p style={{ fontSize: 18, fontWeight: 600, margin: '8px 0' }}>
              {order.productName}
            </p>
          </div>
          <div className="pm-order-detail">
            <div className="pm-detail-row">
              <span className="pm-detail-label">订单编号</span>
              <span className="pm-detail-value">{order.id}</span>
            </div>
            <div className="pm-detail-row">
              <span className="pm-detail-label">商品名称</span>
              <span className="pm-detail-value">{order.productName}</span>
            </div>
            <div className="pm-detail-row">
              <span className="pm-detail-label">消耗积分</span>
              <span className="pm-detail-value" style={{ color: '#6366f1', fontWeight: 700 }}>
                {order.points} 积分
              </span>
            </div>
            <div className="pm-detail-row">
              <span className="pm-detail-label">订单状态</span>
              <span
                className="pm-detail-value"
                style={{
                  background: ORDER_STATUS_COLORS[order.status],
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="pm-detail-row">
              <span className="pm-detail-label">兑换时间</span>
              <span className="pm-detail-value">{formatDateTime(order.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="pm-modal-actions">
          <button className="pm-btn pm-btn-primary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductGrid({ products, points, limits, onExchange }) {
  return (
    <div className="pm-product-grid">
      {products.map((product) => {
        const exchangeCheck = canExchange(points, product)
        const limitCheck = checkPurchaseLimit(limits, product)
        const isSoldOut = product.stock <= 0
        const isLimitReached = limitCheck.reached
        const isDisabled = isSoldOut || isLimitReached

        return (
          <div
            key={product.id}
            className={`pm-product-card ${isDisabled ? 'disabled' : ''}`}
          >
            <div className="pm-product-emoji">{product.emoji}</div>
            {isSoldOut && <div className="pm-sold-out-mask">已兑完</div>}
            {!isSoldOut && isLimitReached && (
              <div className="pm-limit-badge">已达上限</div>
            )}
            <div className="pm-product-info">
              <p className="pm-product-name">{product.name}</p>
              <p className="pm-product-desc">{product.description}</p>
              <div className="pm-product-meta">
                <div className="pm-product-points">
                  {product.points} <span>积分</span>
                </div>
                <div className="pm-product-stock">
                  库存 {product.stock}
                </div>
              </div>
              <button
                className="pm-exchange-btn"
                disabled={isDisabled || !exchangeCheck.can}
                onClick={() => onExchange(product)}
              >
                {isSoldOut ? '已兑完' : isLimitReached ? '已达上限' : !exchangeCheck.can ? `差${exchangeCheck.diff}积分` : '立即兑换'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PointsHistory({ history }) {
  const [filterType, setFilterType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredHistory = useMemo(() => {
    const filtered = filterHistory(history, { type: filterType, startDate, endDate })
    return sortHistory(filtered, 'createdAt', 'desc')
  }, [history, filterType, startDate, endDate])

  return (
    <div>
      <div className="pm-filter-bar">
        <select
          className="pm-filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">全部类型</option>
          {Object.values(TRANSACTION_TYPES).map((type) => (
            <option key={type} value={type}>
              {TRANSACTION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="pm-filter-date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="开始日期"
        />
        <input
          type="date"
          className="pm-filter-date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="结束日期"
        />
      </div>
      {filteredHistory.length === 0 ? (
        <div className="pm-empty">暂无积分记录</div>
      ) : (
        <div className="pm-history-list">
          {filteredHistory.map((tx) => (
            <div key={tx.id} className="pm-history-item">
              <div
                className="pm-history-icon"
                style={{ background: `${TRANSACTION_TYPE_COLORS[tx.type]}20` }}
              >
                {TRANSACTION_TYPE_ICONS[tx.type]}
              </div>
              <div className="pm-history-content">
                <p className="pm-history-desc">{tx.description || TRANSACTION_TYPE_LABELS[tx.type]}</p>
                <p className="pm-history-time">{formatDateTime(tx.createdAt)}</p>
              </div>
              <div className={`pm-history-amount ${tx.type}`}>
                {(tx.type === TRANSACTION_TYPES.EARN || (tx.type === TRANSACTION_TYPES.ADJUST && tx.balanceAfter > 0)) ? '+' : '-'}
                {tx.amount}
              </div>
              <div className="pm-history-balance">
                余额: {tx.balanceAfter !== undefined ? tx.balanceAfter : '-'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrdersList({ orders }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const filteredOrders = useMemo(() => filterOrders(orders, filterStatus), [orders, filterStatus])

  return (
    <div>
      <div className="pm-filter-bar">
        <select
          className="pm-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">全部状态</option>
          {Object.values(ORDER_STATUS).map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      {filteredOrders.length === 0 ? (
        <div className="pm-empty">暂无订单记录</div>
      ) : (
        filteredOrders.map((order) => (
          <div
            key={order.id}
            className="pm-order-item"
            onClick={() => setSelectedOrder(order)}
          >
            <div className="pm-order-header">
              <span className="pm-order-id">{order.id}</span>
              <span
                className="pm-order-status"
                style={{ background: ORDER_STATUS_COLORS[order.status] }}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="pm-order-body">
              <div className="pm-order-emoji">{order.productEmoji}</div>
              <div className="pm-order-info">
                <p className="pm-order-name">{order.productName}</p>
                <p className="pm-order-time">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="pm-order-points">-{order.points}</div>
            </div>
          </div>
        ))
      )}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}

function TrendChart({ history }) {
  const trendData = useMemo(() => buildTrendData(history, 30), [history])
  const monthlyStats = useMemo(() => calculateMonthlyStats(history), [history])

  return (
    <div>
      <div className="pm-chart-summary">
        <div className="pm-summary-card">
          <div className="pm-summary-label">本月获取积分</div>
          <div className="pm-summary-value earn">+{monthlyStats.earned}</div>
        </div>
        <div className="pm-summary-card">
          <div className="pm-summary-label">本月消费积分</div>
          <div className="pm-summary-value spend">-{monthlyStats.spent}</div>
        </div>
        <div className="pm-summary-card">
          <div className="pm-summary-label">本月净增减</div>
          <div className={`pm-summary-value ${monthlyStats.net >= 0 ? 'earn' : 'spend'}`}>
            {monthlyStats.net >= 0 ? '+' : ''}{monthlyStats.net}
          </div>
        </div>
      </div>
      <div className="pm-chart-container">
        <h3 className="pm-chart-title">近30天积分趋势</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                width={60}
              />
              <Tooltip
                formatter={(value) => [value + ' 积分', '余额']}
                labelFormatter={(label) => `日期: ${label}`}
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: '#6366f1' }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function PointsMallPage() {
  const navigate = useNavigate()

  const initialHistory = loadHistory()
  const initialPoints = loadPoints()
  const expiredResult = processExpiredPoints(initialPoints, initialHistory)

  const [points, setPoints] = useState(expiredResult.expired > 0 ? expiredResult.points : initialPoints)
  const [history, setHistory] = useState(expiredResult.expired > 0 ? expiredResult.history : initialHistory)
  const [orders, setOrders] = useState(() => loadOrders())
  const [products, setProducts] = useState(() => loadProducts())
  const [limits, setLimits] = useState(() => loadUserProductLimits())
  const [activeTab, setActiveTab] = useState(TAB_MALL)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [confirmProduct, setConfirmProduct] = useState(null)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const expiringWarning = useMemo(() => getExpiringWarning(history), [history])

  useEffect(() => { savePoints(points) }, [points])
  useEffect(() => { saveHistory(history) }, [history])
  useEffect(() => { saveOrders(orders) }, [orders])
  useEffect(() => { saveProducts(products) }, [products])
  useEffect(() => { saveUserProductLimits(limits) }, [limits])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const handleAdjustPoints = useCallback((amount, description) => {
    const result = adjustPoints(points, history, amount, description)
    if (result.success) {
      setPoints(result.points)
      setHistory(result.history)
      showToast(amount > 0 ? `成功增加 ${amount} 积分` : `成功扣减 ${Math.abs(amount)} 积分`)
    } else {
      showToast(result.error || '操作失败', 'error')
    }
  }, [points, history, showToast])

  const handleExchange = useCallback((product) => {
    const checkResult = canExchange(points, product)
    if (!checkResult.can) {
      if (checkResult.reason === '积分不足') {
        showToast(`积分不足，还差 ${checkResult.diff} 积分`, 'error')
      } else {
        showToast(checkResult.reason, 'error')
      }
      return
    }
    const limitCheck = checkPurchaseLimit(limits, product)
    if (limitCheck.reached) {
      showToast('已达限购数量', 'error')
      return
    }
    setConfirmProduct(product)
  }, [points, limits, showToast])

  const handleConfirmExchange = useCallback(() => {
    if (!confirmProduct) return
    const result = exchangeProduct(points, products, history, orders, limits, confirmProduct.id)
    if (result.success) {
      setPoints(result.points)
      setProducts(result.products)
      setHistory(result.history)
      setOrders(result.orders)
      setLimits(result.limits)
      showToast(`成功兑换 ${confirmProduct.name}！`)
    } else {
      showToast(result.error || '兑换失败', 'error')
    }
    setConfirmProduct(null)
  }, [points, products, history, orders, limits, confirmProduct, showToast])

  return (
    <div className="points-mall-page">
      <button
        className="pm-back-btn"
        onClick={() => navigate('/')}
      >
        ← 返回首页
      </button>
      <h1 className="pm-page-title">积分商城</h1>
      <p className="pm-page-desc">通过完成任务赚取积分，兑换精选好礼</p>

      {expiringWarning.hasWarning && (
        <div className="pm-expire-warning">
          ⚠️ {expiringWarning.expiringPoints} 积分将在 {expiringWarning.daysLeft} 天后过期
        </div>
      )}

      <div className="pm-header-card">
        <div className="pm-points-info">
          <span className="pm-points-label">我的积分</span>
          <span>
            <span className="pm-points-value">{points}</span>
            <span className="pm-points-unit">积分</span>
          </span>
        </div>
        <button
          className="pm-rules-btn"
          onClick={() => setShowRulesModal(true)}
        >
          📋 积分规则
        </button>
      </div>

      <div className="pm-tabs">
        <button
          className={`pm-tab ${activeTab === TAB_MALL ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_MALL)}
        >
          🎁 兑换商城
        </button>
        <button
          className={`pm-tab ${activeTab === TAB_HISTORY ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_HISTORY)}
        >
          📊 积分明细
        </button>
        <button
          className={`pm-tab ${activeTab === TAB_ORDERS ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_ORDERS)}
        >
          📦 我的订单
        </button>
        <button
          className={`pm-tab ${activeTab === TAB_TREND ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_TREND)}
        >
          📈 积分趋势
        </button>
      </div>

      {activeTab === TAB_MALL && (
        <ProductGrid
          products={products}
          points={points}
          limits={limits}
          onExchange={handleExchange}
        />
      )}
      {activeTab === TAB_HISTORY && <PointsHistory history={history} />}
      {activeTab === TAB_ORDERS && <OrdersList orders={orders} />}
      {activeTab === TAB_TREND && <TrendChart history={history} />}

      {showRulesModal && (
        <RulesModal
          onClose={() => setShowRulesModal(false)}
          onAdjustPoints={handleAdjustPoints}
        />
      )}

      {confirmProduct && (
        <ExchangeConfirmModal
          product={confirmProduct}
          onClose={() => setConfirmProduct(null)}
          onConfirm={handleConfirmExchange}
        />
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  )
}
