import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { EXPRESS_COMPANIES } from './constants.js'
import {
  queryLogistics,
  loadQueryHistory,
  addQueryRecord,
  extractRoutePoints,
  getCurrentPositionIndex,
  isLatestNodeException,
  sortNodesDesc,
} from './logisticsUtils.js'
import LogisticsMap from './LogisticsMap.jsx'
import Timeline from './Timeline.jsx'
import './logistics-tracker.css'

function LogisticsTrackerPage() {
  const navigate = useNavigate()

  const [trackingNo, setTrackingNo] = useState('')
  const [companyId, setCompanyId] = useState(EXPRESS_COMPANIES[0].id)
  const [logisticsData, setLogisticsData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [history, setHistory] = useState(() => loadQueryHistory())
  const [mapKey, setMapKey] = useState(0)

  const routePoints = useMemo(() => extractRoutePoints(logisticsData), [logisticsData])
  const currentPositionIndex = useMemo(
    () => getCurrentPositionIndex(routePoints, logisticsData),
    [routePoints, logisticsData]
  )
  const latestIsException = useMemo(() => isLatestNodeException(logisticsData), [logisticsData])
  const sortedNodes = useMemo(
    () => (logisticsData ? sortNodesDesc(logisticsData.nodes) : []),
    [logisticsData]
  )

  const handleQuery = () => {
    const trimmedNo = trackingNo.trim()
    if (!trimmedNo) {
      setErrorMsg('请输入快递单号')
      return
    }

    setIsQuerying(true)
    setErrorMsg('')
    setLogisticsData(null)

    setTimeout(() => {
      const result = queryLogistics(trimmedNo, companyId)
      setIsQuerying(false)

      if (result.success) {
        setLogisticsData(result.data)
        setErrorMsg('')
        const company = EXPRESS_COMPANIES.find(c => c.id === companyId)
        addQueryRecord(trimmedNo, companyId, company?.name || '')
        setHistory(loadQueryHistory())
        setMapKey(k => k + 1)
      } else {
        setErrorMsg(result.error)
        setLogisticsData(null)
      }
    }, 300)
  }

  const handleHistoryClick = (item) => {
    setTrackingNo(item.trackingNo)
    setCompanyId(item.companyId)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleQuery()
    }
  }

  return (
    <div className="logistics-tracker-page">
      <div className="logistics-tracker-header">
        <div className="logistics-tracker-header-left">
          <button className="logistics-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="logistics-tracker-title">物流轨迹追踪</h1>
        </div>
      </div>

      <div className="logistics-tracker-query-card">
        <div className="logistics-query-row">
          <select
            className="logistics-company-select"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            {EXPRESS_COMPANIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="logistics-tracking-input"
            placeholder="请输入快递单号"
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className="logistics-query-btn"
            onClick={handleQuery}
            disabled={isQuerying}
          >
            {isQuerying ? '查询中...' : '查询'}
          </button>
        </div>

        {history.length > 0 && (
          <div className="logistics-history-row">
            <span className="logistics-history-label">历史查询：</span>
            <div className="logistics-history-chips">
              {history.slice(0, 5).map((item, idx) => (
                <button
                  key={idx}
                  className="logistics-history-chip"
                  onClick={() => handleHistoryClick(item)}
                >
                  <span className="logistics-history-company">{item.companyName}</span>
                  <span className="logistics-history-no">{item.trackingNo}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {latestIsException && (
        <div className="logistics-warning-bar">
          ⚠️ 当前包裹存在异常状态，请及时联系快递公司处理
        </div>
      )}

      {errorMsg && !logisticsData && (
        <div className="logistics-error-card">
          <span className="logistics-error-icon">📭</span>
          <span className="logistics-error-text">{errorMsg}</span>
        </div>
      )}

      {logisticsData && (
        <div className="logistics-result-container">
          <div className="logistics-info-summary">
            <div className="logistics-info-item">
              <span className="logistics-info-label">运单号</span>
              <span className="logistics-info-value">{logisticsData.trackingNo}</span>
            </div>
            <div className="logistics-info-item">
              <span className="logistics-info-label">快递公司</span>
              <span className="logistics-info-value">
                {EXPRESS_COMPANIES.find(c => c.id === logisticsData.company)?.name || ''}
              </span>
            </div>
            {logisticsData.origin && (
              <div className="logistics-info-item">
                <span className="logistics-info-label">发货地</span>
                <span className="logistics-info-value">{logisticsData.origin}</span>
              </div>
            )}
            {logisticsData.destination && (
              <div className="logistics-info-item">
                <span className="logistics-info-label">收货地</span>
                <span className="logistics-info-value">{logisticsData.destination}</span>
              </div>
            )}
            <div className="logistics-info-item">
              <span className="logistics-info-label">状态</span>
              <span className={`logistics-info-value logistics-status-value ${logisticsData.isSigned ? 'is-signed' : ''} ${logisticsData.hasException ? 'is-exception' : ''}`}>
                {logisticsData.hasException ? '异常' : (logisticsData.isSigned ? '已签收' : '运输中')}
              </span>
            </div>
          </div>

          {routePoints.length > 0 && (
            <div className="logistics-map-container">
              <div className="logistics-map-title">
                <span>🗺️ 物流轨迹地图</span>
              </div>
              <div className="logistics-map-wrapper">
                <LogisticsMap
                  key={mapKey}
                  points={routePoints}
                  currentIndex={currentPositionIndex}
                  isSigned={logisticsData.isSigned}
                  hasException={logisticsData.hasException}
                />
              </div>
            </div>
          )}

          <div className="logistics-timeline-container">
            <div className="logistics-timeline-title">
              <span>📋 物流节点时间线</span>
            </div>
            <Timeline
              nodes={sortedNodes}
              isSigned={logisticsData.isSigned}
              signer={logisticsData.signer}
              signTime={logisticsData.signTime}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default LogisticsTrackerPage
