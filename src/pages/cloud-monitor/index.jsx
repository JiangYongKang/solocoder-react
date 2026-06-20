import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './cloud-monitor.css'

import RegionCards from './RegionCards'
import GaugePanel from './GaugePanel'
import AlertList from './AlertList'
import TrendChart from './TrendChart'
import HealthScore from './HealthScore'

import {
  DATA_REFRESH_INTERVAL,
  CARD_REFRESH_INTERVAL,
  METRIC_LABELS,
  METRIC_COLORS,
  REGIONS,
} from './constants'

import {
  generateRegionData,
  fluctuateRegionData,
  generateAllRegionMetrics,
  fluctuateAllRegionMetrics,
  selectRegionMetrics,
  generateAllRegionTrendData,
  appendTrendPointToMap,
  selectRegionTrendData,
  generateAlert,
  addAlertToList,
  calculateHealthScore,
  loadAutoRefreshState,
  saveAutoRefreshState,
  clamp,
  randomInRange,
} from './utils'

const CloudMonitorPage = () => {
  const navigate = useNavigate()

  const [autoRefresh, setAutoRefresh] = useState(() => loadAutoRefreshState())
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [regionData, setRegionData] = useState(() => generateRegionData())
  const [allMetrics, setAllMetrics] = useState(() => generateAllRegionMetrics())
  const [alerts, setAlerts] = useState([])
  const [allTrendData, setAllTrendData] = useState(() => generateAllRegionTrendData())
  const [healthScore, setHealthScore] = useState(() => calculateHealthScore(selectRegionMetrics(generateAllRegionMetrics(), 'all')))
  const [prevHealthScore, setPrevHealthScore] = useState(null)
  const [silenced, setSilenced] = useState(false)
  const [visibleMetrics, setVisibleMetrics] = useState({
    cpu: true,
    memory: true,
    disk: true,
  })

  const allMetricsRef = useRef(allMetrics)
  useEffect(() => { allMetricsRef.current = allMetrics }, [allMetrics])

  const selectedRegionRef = useRef(selectedRegion)
  useEffect(() => { selectedRegionRef.current = selectedRegion }, [selectedRegion])

  const currentMetrics = useMemo(() => selectRegionMetrics(allMetrics, selectedRegion), [allMetrics, selectedRegion])
  const currentTrendData = useMemo(() => selectRegionTrendData(allTrendData, selectedRegion), [allTrendData, selectedRegion])

  const serverName = selectedRegion === 'all'
    ? '全部地域'
    : REGIONS.find((r) => r.id === selectedRegion)?.server || 'unknown'

  useEffect(() => {
    saveAutoRefreshState(autoRefresh)
  }, [autoRefresh])

  const refreshAll = useCallback(() => {
    const newAllMetrics = fluctuateAllRegionMetrics(allMetricsRef.current)
    setAllMetrics(newAllMetrics)
    allMetricsRef.current = newAllMetrics

    const regionId = selectedRegionRef.current
    const currentMetrics = selectRegionMetrics(newAllMetrics, regionId)
    const newScore = calculateHealthScore(currentMetrics)
    setHealthScore(newScore)

    if (!silenced) {
      if (Math.random() < 0.3) {
        const newAlert = generateAlert()
        setAlerts((prev) => addAlertToList(prev, newAlert))
      }
    }

    const now = Date.now()
    const newPoint = {
      time: now,
      cpu: clamp(currentMetrics.cpu + randomInRange(-3, 3), 0, 100),
      memory: clamp(currentMetrics.memory + randomInRange(-2, 2), 0, 100),
      disk: clamp(currentMetrics.disk + randomInRange(-1, 1), 0, 100),
    }
    setAllTrendData((prev) => appendTrendPointToMap(prev, regionId, newPoint))
  }, [silenced])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(refreshAll, DATA_REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [autoRefresh, refreshAll])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => {
      setRegionData((prev) => fluctuateRegionData(prev))
    }, CARD_REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [autoRefresh])

  const handleToggleAutoRefresh = () => {
    setAutoRefresh((prev) => !prev)
  }

  const handleManualRefresh = () => {
    refreshAll()
    setRegionData((prev) => fluctuateRegionData(prev))
  }

  const handleSilenceChange = (isSilenced) => {
    setSilenced(isSilenced)
  }

  const handleToggleMetric = (metric) => {
    setVisibleMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }))
  }

  const handleSelectRegion = (regionId) => {
    setSelectedRegion(regionId)
    const metrics = selectRegionMetrics(allMetrics, regionId)
    const score = calculateHealthScore(metrics)
    setPrevHealthScore(healthScore)
    setHealthScore(score)
  }

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div className="cm-header-left">
          <button className="cm-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="cm-title">云资源监控大屏</h1>
        </div>
        <div className="cm-toolbar">
          <div className="cm-toolbar-item">
            自动刷新
            <button
              className={`cm-switch${autoRefresh ? ' active' : ''}`}
              onClick={handleToggleAutoRefresh}
            />
          </div>
          {!autoRefresh && (
            <span className="cm-paused-hint">数据已停止自动刷新</span>
          )}
          <button className="cm-btn" onClick={handleManualRefresh}>
            手动刷新
          </button>
        </div>
      </div>

      <div className="cm-body">
        <div className="cm-left">
          <div className="cm-section">
            <RegionCards
              regionData={regionData}
              selectedRegion={selectedRegion}
              onSelectRegion={handleSelectRegion}
            />
          </div>

          <div className="cm-section">
            <h3 className="cm-section-title">资源使用率仪表盘</h3>
            <GaugePanel metrics={currentMetrics} serverName={serverName} />
          </div>

          <div className="cm-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <h3 className="cm-section-title" style={{ margin: 0 }}>资源用量趋势</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {Object.entries(METRIC_LABELS).map(([key, label]) => (
                  <label key={key} className="cm-trend-checkbox">
                    <input
                      type="checkbox"
                      checked={visibleMetrics[key]}
                      onChange={() => handleToggleMetric(key)}
                    />
                    <span style={{ color: METRIC_COLORS[key] }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <TrendChart trendData={currentTrendData} visibleMetrics={visibleMetrics} />
          </div>
        </div>

        <div className="cm-right">
          <div className="cm-section">
            <HealthScore score={healthScore} prevScore={prevHealthScore} />
          </div>

          <div className="cm-section" style={{ flex: 1 }}>
            <AlertList alerts={alerts} onSilenceChange={handleSilenceChange} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CloudMonitorPage
