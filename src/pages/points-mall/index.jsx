import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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

const CHART_WIDTH = 700
const CHART_HEIGHT = 300
const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 60 }
const CHART_INNER_W = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
const CHART_INNER_H = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

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
                {(tx.type === TRANSACTION_TYPES.EARN || (tx.type === TRANSACTION_TYPES.ADJUST && tx.amount > 0)) ? '+' : '-'}
                {tx.type === TRANSACTION_TYPES.ADJUST ? Math.abs(tx.amount) : tx.amount}
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
  const [hoverIndex, setHoverIndex] = useState(null)

  const { yMin, yMax, yTicks, xStep } = useMemo(() => {
    const balances = trendData.map((d) => d.balance)
    const min = Math.min(...balances)
    const max = Math.max(...balances)
    const range = max - min || 100
    const niceMax = Math.ceil((max + range * 0.1) / 100) * 100
    const niceMin = Math.max(0, Math.floor((min - range * 0.1) / 100) * 100)
    const step = Math.ceil((niceMax - niceMin) / 5 / 100) * 100 || 100
    const ticks = []
    for (let v = niceMin; v <= niceMax; v += step) {
      ticks.push(v)
    }
    return { yMin: niceMin, yMax: niceMax, yTicks: ticks, xStep: CHART_INNER_W / (trendData.length - 1) }
  }, [trendData])

  const yRange = yMax - yMin || 1
  const getX = (i) => CHART_PADDING.left + i * xStep
  const getY = (balance) => CHART_PADDING.top + CHART_INNER_H - ((balance - yMin) / yRange) * CHART_INNER_H

  const linePath = useMemo(() => {
    const range = yMax - yMin || 1
    return trendData.map((d, i) => {
      const x = CHART_PADDING.left + i * xStep
      const y = CHART_PADDING.top + CHART_INNER_H - ((d.balance - yMin) / range) * CHART_INNER_H
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }, [trendData, yMin, yMax, xStep])

  const areaPath = useMemo(() => {
    const range = yMax - yMin || 1
    const line = trendData.map((d, i) => {
      const x = CHART_PADDING.left + i * xStep
      const y = CHART_PADDING.top + CHART_INNER_H - ((d.balance - yMin) / range) * CHART_INNER_H
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
    const lastX = CHART_PADDING.left + (trendData.length - 1) * xStep
    return `${line} L ${lastX} ${CHART_PADDING.top + CHART_INNER_H} L ${CHART_PADDING.left} ${CHART_PADDING.top + CHART_INNER_H} Z`
  }, [trendData, yMin, yMax, xStep])

  const xLabelIndices = useMemo(() => {
    const indices = [0]
    const step = Math.ceil(trendData.length / 6)
    for (let i = step; i < trendData.length - 1; i += step) {
      indices.push(i)
    }
    indices.push(trendData.length - 1)
    return indices
  }, [trendData.length])

  const handleMouseMove = useCallback((e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = CHART_WIDTH / rect.width
    const x = (e.clientX - rect.left) * scaleX
    const idx = Math.round((x - CHART_PADDING.left) / xStep)
    if (idx >= 0 && idx < trendData.length) {
      setHoverIndex(idx)
    }
  }, [trendData.length, xStep])

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null)
  }, [])

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
        <div style={{ width: '100%', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            style={{ width: '100%', height: 300 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={CHART_PADDING.left}
                  y1={getY(tick)}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y2={getY(tick)}
                  stroke="#e5e7eb"
                  strokeDasharray="3 3"
                />
                <text
                  x={CHART_PADDING.left - 8}
                  y={getY(tick) + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {tick}
                </text>
              </g>
            ))}
            {xLabelIndices.map((idx) => (
              <text
                key={idx}
                x={getX(idx)}
                y={CHART_HEIGHT - CHART_PADDING.bottom + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {trendData[idx].label}
              </text>
            ))}
            <path d={areaPath} fill="url(#lineGradient)" />
            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {trendData.map((d, i) => (
              <circle
                key={i}
                cx={getX(i)}
                cy={getY(d.balance)}
                r={hoverIndex === i ? 6 : 0}
                fill="#6366f1"
              />
            ))}
            {hoverIndex !== null && (
              <line
                x1={getX(hoverIndex)}
                y1={CHART_PADDING.top}
                x2={getX(hoverIndex)}
                y2={CHART_HEIGHT - CHART_PADDING.bottom}
                stroke="#6366f1"
                strokeDasharray="4 4"
                strokeOpacity="0.5"
              />
            )}
          </svg>
          {hoverIndex !== null && (
            <div
              className="pm-chart-tooltip"
              style={{
                left: `${(getX(hoverIndex) / CHART_WIDTH) * 100}%`,
                top: `${(getY(trendData[hoverIndex].balance) / CHART_HEIGHT) * 100}%`,
              }}
            >
              <div>日期: {trendData[hoverIndex].date}</div>
              <div>余额: {trendData[hoverIndex].balance} 积分</div>
            </div>
          )}
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
