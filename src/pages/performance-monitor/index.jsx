import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './performance-monitor.css'
import {
  DATA_INTERVAL_MS,
  METRIC_TYPES,
  METRIC_RANGES,
  SMOOTHING_FACTOR,
} from './constants'
import {
  addAlertRecord,
  createAlertRecord,
  evaluateAlerts,
  generateMockResourceList,
  generateSimulatedTargetValue,
  generateWaterfallData,
  getRuleDescription,
  resolveAlertRecords,
  smoothValue,
  updateRuleLastTriggered,
} from './utils'
import GaugeChart from './GaugeChart'
import WaterfallChart from './WaterfallChart'
import ResourceStats from './ResourceStats'
import AlertRulePanel from './AlertRulePanel'
import AlertHistoryPanel from './AlertHistoryPanel'

const PerformanceMonitorPage = () => {
  const navigate = useNavigate()
  const dataTimerRef = useRef(null)
  const alertingRulesRef = useRef({})
  const alertRulesRef = useRef([])
  const prevTriggeredRef = useRef([])
  const displayMetricsRef = useRef({
    [METRIC_TYPES.FPS]: 45,
    [METRIC_TYPES.MEMORY]: 300,
    [METRIC_TYPES.CPU]: 30,
  })

  const [displayMetrics, setDisplayMetrics] = useState({
    [METRIC_TYPES.FPS]: 45,
    [METRIC_TYPES.MEMORY]: 300,
    [METRIC_TYPES.CPU]: 30,
  })
  const targetMetricsRef = useRef({
    [METRIC_TYPES.FPS]: 45,
    [METRIC_TYPES.MEMORY]: 300,
    [METRIC_TYPES.CPU]: 30,
  })
  const [alertRules, setAlertRules] = useState([])
  const [alertRecords, setAlertRecords] = useState([])
  const [waterfallData, setWaterfallData] = useState(() => generateWaterfallData())
  const [resources] = useState(() => generateMockResourceList())
  const [triggeredRuleIds, setTriggeredRuleIds] = useState([])
  const [activeAlerts, setActiveAlerts] = useState([])

  const processAlerts = useCallback((metrics) => {
    const currentRules = alertRulesRef.current
    const alertResult = evaluateAlerts(metrics, currentRules)
    const newTriggeredIds = alertResult.triggeredRules.map((r) => r.id)
    const prevIds = prevTriggeredRef.current

    setTriggeredRuleIds(newTriggeredIds)

    if (newTriggeredIds.length > 0) {
      setActiveAlerts(
        alertResult.triggeredRules.map((r) => ({
          id: r.id,
          description: getRuleDescription(r),
          value: metrics[r.metricType],
        }))
      )

      const now = Date.now()
      let recordsToAdd = []
      let newlyTriggeredIds = []

      for (const rule of alertResult.triggeredRules) {
        const wasAlerting = !!alertingRulesRef.current[rule.id]
        if (!wasAlerting) {
          alertingRulesRef.current[rule.id] = now
          newlyTriggeredIds.push(rule.id)
          const record = createAlertRecord(rule, metrics[rule.metricType], now)
          recordsToAdd.push(record)
        }
      }

      const inactiveRuleIds = Object.keys(alertingRulesRef.current).filter(
        (id) => !newTriggeredIds.includes(id)
      )
      if (inactiveRuleIds.length > 0) {
        for (const id of inactiveRuleIds) {
          delete alertingRulesRef.current[id]
        }
        setAlertRecords((prevRecords) =>
          resolveAlertRecords(prevRecords, inactiveRuleIds, now)
        )
      }

      if (newlyTriggeredIds.length > 0) {
        setAlertRules((prevRules) =>
          updateRuleLastTriggered(prevRules, newlyTriggeredIds, now)
        )
      }

      if (recordsToAdd.length > 0) {
        setAlertRecords((prevRecords) => {
          let result = prevRecords
          for (const rec of recordsToAdd) {
            result = addAlertRecord(result, rec)
          }
          return result
        })
      }
    } else {
      if (prevIds.length > 0) {
        const now = Date.now()
        const resolvedRuleIds = prevIds.filter((id) => !newTriggeredIds.includes(id))
        if (resolvedRuleIds.length > 0) {
          setAlertRecords((prevRecords) =>
            resolveAlertRecords(prevRecords, resolvedRuleIds, now)
          )
        }
        setActiveAlerts([])
      }
      alertingRulesRef.current = {}
    }

    prevTriggeredRef.current = newTriggeredIds
  }, [])

  const updateMetrics = useCallback(() => {
    const prev = displayMetricsRef.current
    const next = { ...prev }
    for (const type of Object.values(METRIC_TYPES)) {
      if (Math.random() < 0.3) {
        targetMetricsRef.current[type] = generateSimulatedTargetValue(type)
      }
      const range = METRIC_RANGES[type]
      const target = targetMetricsRef.current[type]
      const smoothed = smoothValue(prev[type], target, SMOOTHING_FACTOR)
      next[type] = Math.max(range.min, Math.min(range.max, smoothed))
    }

    displayMetricsRef.current = next
    setDisplayMetrics(next)
    processAlerts(next)
  }, [processAlerts])

  useEffect(() => {
    alertRulesRef.current = alertRules
  }, [alertRules])

  useEffect(() => {
    dataTimerRef.current = setInterval(updateMetrics, DATA_INTERVAL_MS)
    return () => {
      if (dataTimerRef.current) {
        clearInterval(dataTimerRef.current)
      }
    }
  }, [updateMetrics])

  const handleRefreshWaterfall = useCallback(() => {
    setWaterfallData(generateWaterfallData())
  }, [])

  const handleRulesChange = useCallback((newRules) => {
    setAlertRules(newRules)
  }, [])

  const handleRecordsChange = useCallback((newRecords) => {
    setAlertRecords(newRecords)
  }, [])

  const showAlertBanner = activeAlerts.length > 0

  return (
    <div className="perf-page">
      <div className="perf-header">
        <button className="perf-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="perf-title">性能监控面板</h1>
      </div>

      {showAlertBanner && (
        <div className="alert-banner">
          <div className="alert-banner-content">
            <strong>⚠ 检测到性能告警：</strong>
            {activeAlerts.map((a) => (
              <span key={a.id} className="alert-banner-item">
                {a.description}
                {' '}（当前：{Number(a.value).toFixed(1)}）
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="section-card">
        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20 }}>实时性能指标</h2>
        <div className="gauges-row">
          <GaugeChart
            metricType={METRIC_TYPES.FPS}
            value={displayMetrics[METRIC_TYPES.FPS]}
          />
          <GaugeChart
            metricType={METRIC_TYPES.MEMORY}
            value={displayMetrics[METRIC_TYPES.MEMORY]}
          />
          <GaugeChart
            metricType={METRIC_TYPES.CPU}
            value={displayMetrics[METRIC_TYPES.CPU]}
          />
        </div>
      </div>

      <div className="section-card">
        <WaterfallChart data={waterfallData} onRefresh={handleRefreshWaterfall} />
      </div>

      <div className="section-card">
        <ResourceStats resources={resources} />
      </div>

      <div className="section-card">
        <AlertRulePanel
          alertRules={alertRules}
          onRulesChange={handleRulesChange}
          currentlyTriggeredIds={triggeredRuleIds}
        />
      </div>

      <div className="section-card">
        <AlertHistoryPanel
          alertRecords={alertRecords}
          onRecordsChange={handleRecordsChange}
        />
      </div>
    </div>
  )
}

export default PerformanceMonitorPage
