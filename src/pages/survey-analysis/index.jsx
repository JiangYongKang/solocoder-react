import { useState, useMemo, useRef, useEffect } from 'react'
import './survey-analysis.css'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_FILTERS,
  VIEW_MODES,
} from './constants.js'
import {
  loadSurveyData,
  saveSurveyData,
  regenerateMockData,
} from './storage.js'
import {
  calculateAllStats,
  calculateDurationDistribution,
  buildCrossAnalysisMatrix,
  countQuestionsByType,
  filterResponses,
  formatDuration,
  formatDateOnly,
} from './surveyAnalysisCore.js'
import QuestionCard from './QuestionCard.jsx'
import RawDataTable from './RawDataTable.jsx'
import VerticalBarChart from './VerticalBarChart.jsx'

export default function SurveyAnalysisPage() {
  const [surveyData, setSurveyData] = useState(() => loadSurveyData())
  const [viewMode, setViewMode] = useState(VIEW_MODES.ANALYSIS)
  const [typeFilter, setTypeFilter] = useState('all')
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minDuration: '',
    maxDuration: '',
  })
  const [rowQId, setRowQId] = useState('')
  const [colQId, setColQId] = useState('')
  const durChartRef = useRef(null)

  const { survey, responses } = surveyData
  const questions = survey?.questions || []
  const totalResponses = responses.length

  const dateRange = useMemo(() => {
    if (responses.length === 0) return { min: '', max: '' }
    const times = responses.map((r) => r.submittedAt)
    return {
      min: formatDateOnly(Math.min(...times)),
      max: formatDateOnly(Math.max(...times)),
    }
  }, [responses])

  const filteredResponses = useMemo(() => {
    return filterResponses(responses, filters)
  }, [responses, filters])

  const allStats = useMemo(() => {
    return calculateAllStats(questions, filteredResponses)
  }, [questions, filteredResponses])

  const typeCounts = useMemo(() => countQuestionsByType(questions), [questions])

  const filteredQuestions = useMemo(() => {
    if (typeFilter === 'all') return questions
    return questions.filter((q) => q.type === typeFilter)
  }, [questions, typeFilter])

  const durationDist = useMemo(() => {
    return calculateDurationDistribution(filteredResponses)
  }, [filteredResponses])

  const multipleChoiceQuestions = useMemo(
    () => questions.filter((q) => q.type === QUESTION_TYPES.MULTIPLE),
    [questions]
  )

  useEffect(() => {
    if (multipleChoiceQuestions.length >= 2) {
      if (!rowQId) setRowQId(multipleChoiceQuestions[0].id)
      if (!colQId) setColQId(multipleChoiceQuestions[1].id)
    } else if (multipleChoiceQuestions.length === 1) {
      if (!rowQId) setRowQId(multipleChoiceQuestions[0].id)
    }
  }, [multipleChoiceQuestions, rowQId, colQId])

  const crossMatrix = useMemo(() => {
    if (!rowQId || !colQId) return null
    const rowQ = questions.find((q) => q.id === rowQId)
    const colQ = questions.find((q) => q.id === colQId)
    return buildCrossAnalysisMatrix(rowQ, colQ, filteredResponses)
  }, [rowQId, colQId, questions, filteredResponses])

  const crossError = rowQId && colQId && rowQId === colQId && multipleChoiceQuestions.length >= 2

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minDuration: '',
      maxDuration: '',
    })
  }

  const handleRegenerate = () => {
    const newData = regenerateMockData()
    setSurveyData(newData)
    setRowQId('')
    setColQId('')
    setFilters({
      startDate: '',
      endDate: '',
      minDuration: '',
      maxDuration: '',
    })
  }

  const handleExportDurationPNG = () => {
    if (durChartRef.current?.toDataURL) {
      const dataUrl = durChartRef.current.toDataURL()
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = '填写时长分布.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handlePersist = () => {
    saveSurveyData(surveyData)
    alert('数据已保存到 localStorage')
  }

  return (
    <div className="sa-page">
      <div className="sa-header">
        <div className="sa-title-group">
          <h1 className="sa-title">{survey?.title || '问卷结果分析'}</h1>
          {survey?.description && (
            <p className="sa-subtitle">{survey.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="sa-btn sa-btn-secondary" onClick={handlePersist}>
            💾 保存数据
          </button>
          <button className="sa-btn sa-btn-secondary" onClick={handleRegenerate}>
            🔄 重新生成
          </button>
          <div className="sa-view-toggle">
            <button
              className={`sa-view-btn ${viewMode === VIEW_MODES.ANALYSIS ? 'sa-view-btn-active' : ''}`}
              onClick={() => setViewMode(VIEW_MODES.ANALYSIS)}
            >
              📊 分析视图
            </button>
            <button
              className={`sa-view-btn ${viewMode === VIEW_MODES.RAW ? 'sa-view-btn-active' : ''}`}
              onClick={() => setViewMode(VIEW_MODES.RAW)}
            >
              📋 原始数据
            </button>
          </div>
        </div>
      </div>

      <div className="sa-summary-row">
        <div className="sa-summary-card">
          <div className="sa-summary-label">问卷题目总数</div>
          <div className="sa-summary-value">{questions.length}</div>
        </div>
        <div className="sa-summary-card">
          <div className="sa-summary-label">总答卷数量</div>
          <div className="sa-summary-value">{totalResponses}</div>
        </div>
        <div className="sa-summary-card">
          <div className="sa-summary-label">当前有效答卷</div>
          <div className="sa-summary-value sa-summary-value-highlight">
            {filteredResponses.length}
          </div>
        </div>
        <div className="sa-summary-card">
          <div className="sa-summary-label">平均填写时长</div>
          <div className="sa-summary-value">
            {formatDuration(durationDist.statistics.average)}
          </div>
        </div>
      </div>

      {viewMode === VIEW_MODES.ANALYSIS ? (
        <>
          <div className="sa-section">
            <div className="sa-section-header">
              <h3 className="sa-section-title">🔍 数据过滤条件</h3>
            </div>
            <div className="sa-filter-row">
              <div className="sa-filter-group">
                <span className="sa-filter-label">提交时间：</span>
                <input
                  type="date"
                  className="sa-filter-input"
                  value={filters.startDate}
                  min={dateRange.min}
                  max={dateRange.max || filters.endDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
                <span className="sa-filter-label">至</span>
                <input
                  type="date"
                  className="sa-filter-input"
                  value={filters.endDate}
                  min={filters.startDate || dateRange.min}
                  max={dateRange.max}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="sa-filter-group">
                <span className="sa-filter-label">填写时长(秒)：</span>
                <input
                  type="number"
                  className="sa-filter-input sa-filter-num"
                  placeholder="最短"
                  min="0"
                  value={filters.minDuration}
                  onChange={(e) => handleFilterChange('minDuration', e.target.value)}
                />
                <span className="sa-filter-label">至</span>
                <input
                  type="number"
                  className="sa-filter-input sa-filter-num"
                  placeholder="最长"
                  min="0"
                  value={filters.maxDuration}
                  onChange={(e) => handleFilterChange('maxDuration', e.target.value)}
                />
              </div>
              <div className="sa-filter-info">
                <div className="sa-filter-count">
                  有效答卷：<strong>{filteredResponses.length}</strong> / {totalResponses}
                </div>
                <button className="sa-btn sa-btn-secondary" onClick={handleResetFilters}>
                  ↺ 重置过滤
                </button>
              </div>
            </div>
          </div>

          <div className="sa-section">
            <div className="sa-section-header">
              <h3 className="sa-section-title">⏱️ 填写时长分布</h3>
              <button className="sa-export-btn" onClick={handleExportDurationPNG}>
                📷 导出 PNG
              </button>
            </div>
            <div className="sa-duration-chart-wrap">
              <VerticalBarChart
                ref={durChartRef}
                data={durationDist.data}
                xLabels={durationDist.data.map((d) => d.label)}
                width={720}
                height={240}
                color="#6366f1"
              />
            </div>
            <div className="sa-duration-stats">
              <div className="sa-duration-stat">
                <div className="sa-duration-stat-label">最短时长</div>
                <div className="sa-duration-stat-value">
                  {formatDuration(durationDist.statistics.min)}
                </div>
              </div>
              <div className="sa-duration-stat">
                <div className="sa-duration-stat-label">最长时长</div>
                <div className="sa-duration-stat-value">
                  {formatDuration(durationDist.statistics.max)}
                </div>
              </div>
              <div className="sa-duration-stat">
                <div className="sa-duration-stat-label">平均时长</div>
                <div className="sa-duration-stat-value">
                  {formatDuration(durationDist.statistics.average)}
                </div>
              </div>
              <div className="sa-duration-stat">
                <div className="sa-duration-stat-label">中位数时长</div>
                <div className="sa-duration-stat-value">
                  {formatDuration(durationDist.statistics.median)}
                </div>
              </div>
            </div>
          </div>

          {multipleChoiceQuestions.length >= 2 && (
            <div className="sa-section">
              <div className="sa-section-header">
                <h3 className="sa-section-title">🔗 多选交叉分析矩阵</h3>
              </div>
              <div className="sa-cross-row">
                <div className="sa-filter-group">
                  <span className="sa-filter-label">行维度：</span>
                  <select
                    className="sa-cross-select"
                    value={rowQId}
                    onChange={(e) => setRowQId(e.target.value)}
                  >
                    {multipleChoiceQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sa-filter-group">
                  <span className="sa-filter-label">列维度：</span>
                  <select
                    className="sa-cross-select"
                    value={colQId}
                    onChange={(e) => setColQId(e.target.value)}
                  >
                    {multipleChoiceQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {crossError && (
                <div className="sa-cross-error">
                  ⚠️ 您选择了同一题目进行交叉分析（对角线为该选项的被选中次数）
                </div>
              )}
              {crossMatrix && <CrossMatrix matrix={crossMatrix} />}
            </div>
          )}

          <div className="sa-section" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <div className="sa-type-tabs">
              {QUESTION_TYPE_FILTERS.map((f) => {
                const count =
                  f.key === 'all'
                    ? questions.length
                    : typeCounts[f.key] || 0
                return (
                  <button
                    key={f.key}
                    className={`sa-type-tab ${typeFilter === f.key ? 'sa-type-tab-active' : ''}`}
                    onClick={() => setTypeFilter(f.key)}
                  >
                    {f.label}
                    <span className="sa-type-tab-count">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {filteredQuestions.length > 0 ? (
            <div className="sa-question-grid">
              {filteredQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  stats={allStats[q.id]}
                />
              ))}
            </div>
          ) : (
            <div className="sa-empty-state">
              暂无该类型的题目
            </div>
          )}
        </>
      ) : (
        <div className="sa-section">
          <div className="sa-section-header">
            <h3 className="sa-section-title">📋 原始答卷数据</h3>
          </div>
          <RawDataTable
            questions={questions}
            responses={responses}
            filteredResponses={filteredResponses}
          />
        </div>
      )}
    </div>
  )
}

function CrossMatrix({ matrix }) {
  return (
    <div className="sa-cross-table-wrap">
      <table className="sa-cross-table">
        <thead>
          <tr>
            <th className="sa-cross-corner">
              行 ↓ / 列 →
            </th>
            {matrix.colLabels.map((l, i) => (
              <th key={i}>{l}</th>
            ))}
            <th className="sa-cross-total">行总计</th>
          </tr>
        </thead>
        <tbody>
          {matrix.rowLabels.map((rowLabel, ri) => (
            <tr key={ri}>
              <td className="sa-cross-row-label">{rowLabel}</td>
              {matrix.matrix[ri].map((cell, ci) => (
                <td key={ci}>
                  <div className="sa-cross-cell-count">{cell.count}</div>
                  <div className="sa-cross-cell-ratio">{cell.ratio.toFixed(1)}%</div>
                </td>
              ))}
              <td className="sa-cross-total">
                <div className="sa-cross-cell-count">
                  {matrix.rowTotals[ri].count}
                </div>
                <div className="sa-cross-cell-ratio">
                  {matrix.rowTotals[ri].ratio.toFixed(1)}%
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <td className="sa-cross-total sa-cross-row-label">列总计</td>
            {matrix.colTotals.map((t, i) => (
              <td key={i} className="sa-cross-total">
                <div className="sa-cross-cell-count">{t.count}</div>
                <div className="sa-cross-cell-ratio">{t.ratio.toFixed(1)}%</div>
              </td>
            ))}
            <td className="sa-cross-grand">
              <div>{matrix.grandTotal.count}</div>
              <div style={{ fontSize: 11 }}>
                {matrix.grandTotal.ratio.toFixed(1)}%
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text)' }}>
        * 单元格百分比 = 同时选择两项的答卷数 / 总答卷数 ({matrix.totalResponses})
      </div>
    </div>
  )
}
