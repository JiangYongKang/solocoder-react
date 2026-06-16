import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './stock-dashboard.css'

import Watchlist from './Watchlist'
import StockDetailHeader from './StockDetailHeader'
import KLineChart from './KLineChart'
import TimeShareChart from './TimeShareChart'
import MarketList from './MarketList'
import AlertModal from './AlertModal'
import AlertPanel from './AlertPanel'
import Notification from './Notification'

import {
  initializeStockData,
  updateStockPrice,
  generateKLineData,
  generateTimeShareData,
  generateNextPrice,
  createAlert,
  checkAlertTrigger,
  updateAlertStatus,
  deleteAlert,
  formatDate,
  generateId,
} from './stockUtils'

import {
  DEFAULT_STOCKS,
  PRICE_UPDATE_INTERVAL,
  TIMESHARE_UPDATE_INTERVAL,
  CHART_TYPE_KLINE,
  CHART_TYPE_TIMESHARE,
  ALERT_STATUS_ENABLED,
  ALERT_STATUS_TRIGGERED,
  ALERT_STATUS_DISABLED,
} from './constants'

import {
  loadWatchlist,
  saveWatchlist,
  loadAlerts,
  saveAlerts,
} from './storage'

const StockDashboardPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('watchlist')
  const [watchlist, setWatchlist] = useState(() => {
    const saved = loadWatchlist()
    if (saved.length > 0) return saved
    return [
      { code: 'AAPL', name: '苹果公司' },
      { code: 'GOOGL', name: '谷歌' },
      { code: 'TSLA', name: '特斯拉' },
    ]
  })
  const [alerts, setAlerts] = useState(() => loadAlerts())
  const [stocks, setStocks] = useState([])
  const [selectedCode, setSelectedCode] = useState(null)
  const [klineData, setKlineData] = useState({})
  const [timeShareData, setTimeShareData] = useState({})
  const [chartType, setChartType] = useState(CHART_TYPE_KLINE)
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [alertModalStock, setAlertModalStock] = useState(null)
  const [notifications, setNotifications] = useState([])

  const triggeredAlertsRef = useRef(new Set())
  const stocksRef = useRef([])

  useEffect(() => {
    stocksRef.current = stocks
  }, [stocks])

  useEffect(() => {
    saveWatchlist(watchlist)
  }, [watchlist])

  useEffect(() => {
    saveAlerts(alerts)
  }, [alerts])

  useEffect(() => {
    const allStockCodes = [
      ...watchlist.map((s) => s.code),
      ...DEFAULT_STOCKS.map((s) => s.code),
    ]
    const uniqueCodes = [...new Set(allStockCodes)]

    const initialStocks = uniqueCodes.map((code) => {
      const stockInfo = DEFAULT_STOCKS.find((s) => s.code === code) ||
        watchlist.find((s) => s.code === code) ||
        { code, name: code }
      return initializeStockData(stockInfo)
    })

    setStocks(initialStocks)

    const klineMap = {}
    const timeShareMap = {}
    initialStocks.forEach((stock) => {
      klineMap[stock.code] = generateKLineData(stock.prevClose)
      timeShareMap[stock.code] = generateTimeShareData(stock.prevClose)
    })
    setKlineData(klineMap)
    setTimeShareData(timeShareMap)

    if (watchlist.length > 0) {
      setSelectedCode(watchlist[0].code)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setStocks((prev) => prev.map((stock) => updateStockPrice(stock)))
    }, PRICE_UPDATE_INTERVAL)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeShareData((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((code) => {
          const stock = stocksRef.current.find((s) => s.code === code)
          if (!stock || !updated[code] || updated[code].length === 0) return

          const lastData = updated[code][updated[code].length - 1]
          const newPrice = generateNextPrice(lastData.price, 0.002)

          const lastMinute = lastData.minute
          const newMinute = Math.min(lastMinute + 1, 390)
          const startTime = 9 * 60 + 30
          const totalMin = startTime + newMinute
          const hour = Math.floor(totalMin / 60)
          const minute = totalMin % 60
          const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

          if (newMinute > lastMinute) {
            updated[code] = [
              ...updated[code],
              { time, price: Number(newPrice.toFixed(2)), minute: newMinute },
            ]
          } else {
            const newData = [...updated[code]]
            newData[newData.length - 1] = {
              ...newData[newData.length - 1],
              price: Number(newPrice.toFixed(2)),
            }
            updated[code] = newData
          }
        })
        return updated
      })
    }, TIMESHARE_UPDATE_INTERVAL)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    alerts.forEach((alert) => {
      if (alert.status !== ALERT_STATUS_ENABLED) return
      if (triggeredAlertsRef.current.has(alert.id)) return

      const stock = stocks.find((s) => s.code === alert.stockCode)
      if (!stock) return

      if (checkAlertTrigger(alert, stock.price)) {
        triggeredAlertsRef.current.add(alert.id)

        setAlerts((prev) =>
          updateAlertStatus(prev, alert.id, ALERT_STATUS_TRIGGERED)
        )

        if (alert.notify) {
          const notifId = generateId()
          setNotifications((prev) => [
            ...prev,
            {
              id: notifId,
              message: `${alert.stockName}（${alert.stockCode}）价格已达到 ${stock.price.toFixed(2)} 元，触发预警`,
            },
          ])
        }
      }
    })
  }, [stocks, alerts])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleAddStock = (stock) => {
    setWatchlist((prev) => [...prev, stock])

    const newStock = initializeStockData(stock)

    setStocks((prev) => {
      if (prev.some((s) => s.code === stock.code)) return prev
      return [...prev, newStock]
    })

    setKlineData((prev) => {
      if (prev[stock.code]) return prev
      return { ...prev, [stock.code]: generateKLineData(newStock.prevClose) }
    })

    setTimeShareData((prev) => {
      if (prev[stock.code]) return prev
      return { ...prev, [stock.code]: generateTimeShareData(newStock.prevClose) }
    })
  }

  const handleDeleteStock = (code) => {
    setWatchlist((prev) => prev.filter((s) => s.code !== code))
    if (selectedCode === code) {
      const remaining = watchlist.filter((s) => s.code !== code)
      setSelectedCode(remaining.length > 0 ? remaining[0].code : null)
    }
  }

  const handleReorderWatchlist = (newList) => {
    setWatchlist(newList)
  }

  const handleSelectStock = (code) => {
    setSelectedCode(code)
  }

  const handleSetAlert = (code) => {
    const stock = stocks.find((s) => s.code === code)
    const watchItem = watchlist.find((s) => s.code === code)
    setAlertModalStock({
      code,
      name: stock?.name || watchItem?.name || code,
      currentPrice: stock?.price || 0,
    })
    setAlertModalOpen(true)
  }

  const handleSaveAlert = (data) => {
    if (!alertModalStock) return
    const newAlert = createAlert(
      alertModalStock.code,
      alertModalStock.name,
      data.type,
      data.targetPrice,
      data.notify
    )
    setAlerts((prev) => [...prev, newAlert])
  }

  const handleEnableAlert = (alertId) => {
    setAlerts((prev) => updateAlertStatus(prev, alertId, ALERT_STATUS_ENABLED))
    triggeredAlertsRef.current.delete(alertId)
  }

  const handleDisableAlert = (alertId) => {
    setAlerts((prev) => updateAlertStatus(prev, alertId, ALERT_STATUS_DISABLED))
  }

  const handleDeleteAlert = (alertId) => {
    setAlerts((prev) => deleteAlert(prev, alertId))
    triggeredAlertsRef.current.delete(alertId)
  }

  const selectedStock = useMemo(() => {
    return stocks.find((s) => s.code === selectedCode) || null
  }, [stocks, selectedCode])

  const selectedKlineData = useMemo(() => {
    return klineData[selectedCode] || []
  }, [klineData, selectedCode])

  const selectedTimeShareData = useMemo(() => {
    return timeShareData[selectedCode] || []
  }, [timeShareData, selectedCode])

  const today = formatDate(new Date())

  return (
    <div className="stock-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <button className="dashboard-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="dashboard-title">股票行情看板</h1>
        </div>
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
          >
            自选行情
          </button>
          <button
            className={`tab-btn ${activeTab === 'market' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
          >
            行情列表
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        {activeTab === 'watchlist' && (
          <>
            <div className="sidebar">
              <Watchlist
                watchlist={watchlist}
                stocks={stocks}
                selectedCode={selectedCode}
                alerts={alerts}
                onSelect={handleSelectStock}
                onAddStock={handleAddStock}
                onDeleteStock={handleDeleteStock}
                onReorder={handleReorderWatchlist}
                onSetAlert={handleSetAlert}
              />
              <AlertPanel
                alerts={alerts}
                onEnable={handleEnableAlert}
                onDisable={handleDisableAlert}
                onDelete={handleDeleteAlert}
              />
            </div>

            <div className="main-content">
              <StockDetailHeader stock={selectedStock} />

              <div className="chart-container">
                <div className="chart-header">
                  <h3 className="chart-title">
                    {chartType === CHART_TYPE_KLINE ? '日K线' : `分时走势 - ${today}`}
                  </h3>
                  <div className="chart-type-toggle">
                    <button
                      className={`chart-type-btn ${chartType === CHART_TYPE_KLINE ? 'active' : ''}`}
                      onClick={() => setChartType(CHART_TYPE_KLINE)}
                    >
                      K线图
                    </button>
                    <button
                      className={`chart-type-btn ${chartType === CHART_TYPE_TIMESHARE ? 'active' : ''}`}
                      onClick={() => setChartType(CHART_TYPE_TIMESHARE)}
                    >
                      分时图
                    </button>
                  </div>
                </div>

                {chartType === CHART_TYPE_KLINE ? (
                  <KLineChart data={selectedKlineData} />
                ) : (
                  <TimeShareChart
                    data={selectedTimeShareData}
                    prevClose={selectedStock?.prevClose || 0}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'market' && (
          <div style={{ flex: 1, padding: '20px', display: 'flex' }}>
            <MarketList
              stocks={stocks}
              onSelectStock={(code) => {
                setSelectedCode(code)
                setActiveTab('watchlist')
              }}
            />
          </div>
        )}
      </div>

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onSave={handleSaveAlert}
        stock={alertModalStock}
        currentPrice={alertModalStock?.currentPrice}
      />

      <Notification
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}

export default StockDashboardPage
