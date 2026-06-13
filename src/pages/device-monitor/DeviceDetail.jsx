import { useRef, useEffect, useState, useMemo } from 'react'
import {
  DEVICE_TYPE_LABELS,
  METRIC_LABELS,
  METRIC_UNITS,
  ALERT_LEVEL_COLORS,
} from './constants.js'
import {
  formatMetricValue,
  formatDateTime,
  isValueNormal,
  isNumericMetric,
  evaluateDeviceAlerts,
} from './deviceUtils.js'
import {
  calculateLineChartLayout,
  drawLineChart,
  drawTooltip,
  findNearestPoint,
} from './chartUtils.js'

const DeviceDetail = ({ device, alertRules }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [hoverInfo, setHoverInfo] = useState(null)
  const [chartWidth, setChartWidth] = useState(600)

  const alertInfo = useMemo(
    () => evaluateDeviceAlerts(device, alertRules),
    [device, alertRules]
  )

  useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.clientWidth - 32)
      }
    }
    updateWidth()
    const ro = new ResizeObserver(updateWidth)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const threshold = useMemo(() => {
    if (alertInfo.triggeredRules.length > 0) {
      return alertInfo.triggeredRules[0].threshold
    }
    const applicableRules = alertRules.filter(
      (r) => r.enabled && r.deviceType === device?.type && r.metricType === device?.metricType
    )
    if (applicableRules.length > 0) {
      return applicableRules[0].threshold
    }
    return null
  }, [device, alertRules, alertInfo.triggeredRules])

  const chartLayout = useMemo(() => {
    if (!device || !Array.isArray(device.dataPoints)) return null
    const width = chartWidth > 0 ? chartWidth : 600
    const height = 280

    return calculateLineChartLayout(device.dataPoints, {
      width,
      height,
      valueKey: 'value',
      paddingTop: 20,
      paddingRight: 20,
      paddingBottom: 40,
      paddingLeft: 55,
      yTickCount: 5,
      xMaxTicks: 6,
      threshold,
    })
  }, [device, threshold, chartWidth])

  useEffect(() => {
    if (!canvasRef.current || !chartLayout) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const lineColor = alertInfo.isAlerting ? ALERT_LEVEL_COLORS[alertInfo.alertLevel] || '#f5222d' : '#1890ff'
    const dotColor = lineColor
    const areaColor = alertInfo.isAlerting
      ? 'rgba(245, 34, 45, 0.1)'
      : 'rgba(24, 144, 255, 0.1)'

    drawLineChart(ctx, chartLayout, {
      lineColor,
      lineWidth: 2,
      dotColor,
      dotRadius: 2,
      showDots: false,
      showArea: true,
      areaColor,
    })

    if (hoverInfo && hoverInfo.point) {
      const p = hoverInfo.point
      ctx.fillStyle = dotColor
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      const lines = [
        `时间: ${formatDateTime(p.data.timestamp)}`,
        `数值: ${formatMetricValue(device?.metricType, p.value)}`,
      ]
      drawTooltip(ctx, p.x, p.y, lines, {
        fontSize: 12,
        paddingX: 10,
        paddingY: 6,
      })
    }
  }, [chartLayout, hoverInfo, alertInfo, device])

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current || !chartLayout) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const nearest = findNearestPoint(chartLayout.points, x, y)
    if (nearest && nearest.distance < 30) {
      setHoverInfo({ point: nearest })
    } else {
      setHoverInfo(null)
    }
  }

  const handleCanvasMouseLeave = () => {
    setHoverInfo(null)
  }

  if (!device) {
    return (
      <div className="device-detail-panel">
        <div className="empty-detail">
          <div className="empty-icon">📱</div>
          <div className="empty-text">请选择一个设备查看详情</div>
        </div>
      </div>
    )
  }

  const isNormal = isValueNormal(device)
  const numericMetric = isNumericMetric(device.metricType)

  return (
    <div className="device-detail-panel">
      <div className="detail-header">
        <h2 className="panel-title">设备详情</h2>
        <div className={`status-badge ${device.status}`}>
          {device.isAlerting ? '告警中' : device.status === 'online' ? '在线' : '离线'}
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">基本信息</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">设备名称</span>
            <span className="info-value">{device.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">设备ID</span>
            <span className="info-value mono">{device.id}</span>
          </div>
          <div className="info-item">
            <span className="info-label">设备类型</span>
            <span className="info-value">{DEVICE_TYPE_LABELS[device.type] || '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">MAC地址</span>
            <span className="info-value mono">{device.mac}</span>
          </div>
          <div className="info-item">
            <span className="info-label">安装位置</span>
            <span className="info-value">{device.location}</span>
          </div>
          <div className="info-item">
            <span className="info-label">固件版本</span>
            <span className="info-value">{device.firmwareVersion}</span>
          </div>
          <div className="info-item full-width">
            <span className="info-label">最后在线时间</span>
            <span className="info-value">{formatDateTime(device.lastOnline)}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">实时数据</h3>
        <div className="realtime-data">
          <div className="current-value">
            <span className="value-number">
              {numericMetric ? device.currentValue?.toFixed(2) : formatMetricValue(device.metricType, device.currentValue)}
            </span>
            {numericMetric && (
              <span className="value-unit">{METRIC_UNITS[device.metricType]}</span>
            )}
          </div>
          <div className={`value-status ${isNormal ? 'normal' : 'abnormal'}`}>
            {alertInfo.isAlerting ? '告警' : isNormal ? '正常' : '异常'}
          </div>
        </div>
        {alertInfo.isAlerting && alertInfo.triggeredRules.length > 0 && (
          <div className="alert-tips">
            {alertInfo.triggeredRules.map((rule) => (
              <div
                key={rule.id}
                className="alert-tip"
                style={{ borderLeftColor: ALERT_LEVEL_COLORS[rule.level] }}
              >
                ⚠️ {METRIC_LABELS[rule.metricType]} {rule.condition === 'gt' ? '大于' : rule.condition === 'lt' ? '小于' : '等于'} {rule.threshold}{METRIC_UNITS[rule.metricType]}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="detail-section" ref={containerRef}>
        <h3 className="section-title">数据趋势（近5分钟）</h3>
        {chartLayout && (
          <div className="chart-container">
            <canvas
              ref={canvasRef}
              width={chartLayout.width}
              height={chartLayout.height}
              className="line-chart"
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
            />
            {threshold !== null && (
              <div className="threshold-legend">
                <span className="threshold-line" />
                <span className="threshold-label">告警阈值: {threshold}{METRIC_UNITS[device.metricType]}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeviceDetail
