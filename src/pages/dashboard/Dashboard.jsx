import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

import DateRangeFilter from './components/DateRangeFilter'
import SummaryCard from './components/SummaryCard'
import LineChartCard from './components/LineChartCard'
import BarChartCard from './components/BarChartCard'
import PieChartCard from './components/PieChartCard'

import {
  DAILY_DATA,
  CATEGORIES,
  METRIC_KEYS,
  DEFAULT_LAYOUT,
  getDefaultDateRange,
} from './data/mockData'

import {
  filterDataByDateRange,
  getPreviousPeriod,
  buildSummaryMetrics,
  buildLineChartData,
  buildBarChartData,
  buildPieChartData,
  loadLayoutFromStorage,
  saveLayoutToStorage,
} from './utils/dataUtils'

import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const defaultRange = getDefaultDateRange()

  const [pendingStartDate, setPendingStartDate] = useState(defaultRange.startDate)
  const [pendingEndDate, setPendingEndDate] = useState(defaultRange.endDate)
  const [appliedRange, setAppliedRange] = useState(defaultRange)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [lineMetric, setLineMetric] = useState('totalSales')
  const [layout, setLayout] = useState(() => loadLayoutFromStorage() || DEFAULT_LAYOUT)

  useEffect(() => {
    saveLayoutToStorage(layout)
  }, [layout])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const filteredData = useMemo(
    () => filterDataByDateRange(DAILY_DATA, appliedRange.startDate, appliedRange.endDate),
    [appliedRange]
  )

  const previousPeriod = useMemo(
    () => getPreviousPeriod(appliedRange.startDate, appliedRange.endDate),
    [appliedRange]
  )

  const prevFilteredData = useMemo(
    () => filterDataByDateRange(DAILY_DATA, previousPeriod.startDate, previousPeriod.endDate),
    [previousPeriod]
  )

  const summaryMetrics = useMemo(
    () => buildSummaryMetrics(filteredData, prevFilteredData, METRIC_KEYS),
    [filteredData, prevFilteredData]
  )

  const lineData = useMemo(
    () => buildLineChartData(filteredData, lineMetric, selectedCategory),
    [filteredData, lineMetric, selectedCategory]
  )

  const barData = useMemo(
    () => buildBarChartData(filteredData, CATEGORIES, selectedCategory),
    [filteredData, selectedCategory]
  )

  const pieData = useMemo(
    () => buildPieChartData(filteredData, CATEGORIES, selectedCategory),
    [filteredData, selectedCategory]
  )

  const handleApplyDate = () => {
    setAppliedRange({ startDate: pendingStartDate, endDate: pendingEndDate })
    setSelectedCategory(null)
  }

  const handleResetDate = () => {
    const def = getDefaultDateRange()
    setPendingStartDate(def.startDate)
    setPendingEndDate(def.endDate)
    setAppliedRange(def)
    setSelectedCategory(null)
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory((prev) => (prev === category ? null : category))
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const renderItem = (item) => {
    if (item.type === 'summaryCard') {
      const metric = summaryMetrics.find((m) => m.key === item.metric)
      if (!metric) return null
      return (
        <div key={item.id} className="db-grid-item db-grid-item--summary">
          <SummaryCard
            id={item.id}
            metricKey={item.metric}
            value={metric.value}
            trend={metric.trend}
          />
        </div>
      )
    }
    if (item.type === 'chart') {
      if (item.chartType === 'line') {
        return (
          <div key={item.id} className="db-grid-item db-grid-item--chart">
            <LineChartCard
              id={item.id}
              data={lineData}
              selectedCategory={selectedCategory}
              metricKey={lineMetric}
              onMetricChange={setLineMetric}
            />
          </div>
        )
      }
      if (item.chartType === 'bar') {
        return (
          <div key={item.id} className="db-grid-item db-grid-item--chart">
            <BarChartCard
              id={item.id}
              data={barData}
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        )
      }
      if (item.chartType === 'pie') {
        return (
          <div key={item.id} className="db-grid-item db-grid-item--chart">
            <PieChartCard
              id={item.id}
              data={pieData}
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        )
      }
    }
    return null
  }

  return (
    <div className="db-page">
      <div className="db-header">
        <button className="db-back-btn" onClick={() => navigate('/')} aria-label="返回首页">
          ← 返回首页
        </button>
        <h1 className="db-title">可视化仪表盘</h1>
      </div>

      <DateRangeFilter
        startDate={pendingStartDate}
        endDate={pendingEndDate}
        onStartChange={setPendingStartDate}
        onEndChange={setPendingEndDate}
        onApply={handleApplyDate}
        onReset={handleResetDate}
      />

      {selectedCategory && (
        <div className="db-filter-chip">
          <span>已筛选：{selectedCategory}</span>
          <button onClick={() => setSelectedCategory(null)}>× 清除</button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout.map((i) => i.id)}>
          <div className="db-unified-grid">
            {layout.map(renderItem)}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default Dashboard
