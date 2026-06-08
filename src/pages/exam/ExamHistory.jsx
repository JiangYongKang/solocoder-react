import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  loadExamHistory,
  formatDuration,
  formatDate,
  gradeExam,
} from './examCore'

export default function ExamHistory({ onViewDetail }) {
  const history = useMemo(
    () => loadExamHistory().sort((a, b) => b.date - a.date),
    []
  )

  const gradedMap = useMemo(() => {
    const map = new Map()
    history.forEach((record) => {
      map.set(record.id, gradeExam({ questions: record.questions }, record.answers))
    })
    return map
  }, [history])

  const chartData = useMemo(() => {
    const sorted = [...history].sort((a, b) => a.date - b.date)
    return sorted.map((record, idx) => {
      const graded = gradedMap.get(record.id) || { totalScore: 0, maxScore: 0 }
      const percentage =
        graded.maxScore > 0
          ? Math.round((graded.totalScore / graded.maxScore) * 100)
          : 0
      return {
        name: `第${idx + 1}次`,
        shortDate: formatDate(record.date).slice(5, 16),
        score: graded.totalScore,
        percentage,
        examName: record.examName,
      }
    })
  }, [history, gradedMap])

  const stats = useMemo(() => {
    if (history.length === 0) {
      return { total: 0, avgScore: 0, avgPercentage: 0, best: 0 }
    }
    let totalScore = 0
    let totalMax = 0
    let bestPct = 0
    history.forEach((r) => {
      const graded = gradedMap.get(r.id) || { totalScore: 0, maxScore: 0 }
      totalScore += graded.totalScore
      totalMax += graded.maxScore
      const pct = graded.maxScore > 0 ? graded.totalScore / graded.maxScore : 0
      if (pct > bestPct) bestPct = pct
    })
    const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
    return {
      total: history.length,
      avgScore: (totalScore / history.length).toFixed(1),
      avgPercentage: avgPct,
      best: Math.round(bestPct * 100),
    }
  }, [history, gradedMap])

  return (
    <div>
      <div className="history-summary">
        <div className="history-summary-item">
          <div className="number">{stats.total}</div>
          <div className="label">考试次数</div>
        </div>
        <div className="history-summary-item">
          <div className="number">{stats.avgPercentage}%</div>
          <div className="label">平均正确率</div>
        </div>
        <div className="history-summary-item">
          <div className="number">{stats.avgScore}</div>
          <div className="label">平均得分</div>
        </div>
        <div className="history-summary-item">
          <div className="number">{stats.best}%</div>
          <div className="label">最佳成绩</div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="history-chart">
          <h3>成绩趋势</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(value) => [`${value}%`, '正确率']}
                  labelFormatter={(label, items) => {
                    const d = items?.[0]?.payload
                    return d ? `${d.examName}（${d.shortDate}）` : label
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="exam-empty">暂无考试记录，快去组卷考试吧！</div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>考试名称</th>
                <th>得分</th>
                <th>用时</th>
                <th>日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => {
                const graded = gradedMap.get(record.id) || {
                  totalScore: 0,
                  maxScore: 0,
                }
                const pct = graded.maxScore > 0 ? graded.totalScore / graded.maxScore : 0
                let scoreClass = ''
                if (pct >= 0.8) scoreClass = 'history-score-high'
                else if (pct >= 0.6) scoreClass = 'history-score-mid'
                else if (graded.maxScore > 0) scoreClass = 'history-score-low'
                return (
                  <tr key={record.id}>
                    <td>{record.examName}</td>
                    <td className={scoreClass}>
                      {graded.totalScore} / {graded.maxScore}
                      <span style={{ fontSize: 12, marginLeft: 4, opacity: 0.7 }}>
                        (
                        {graded.maxScore > 0
                          ? Math.round((graded.totalScore / graded.maxScore) * 100)
                          : 0}
                        %)
                      </span>
                    </td>
                    <td>{formatDuration(record.timeUsed)}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <button
                        className="exam-btn exam-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => onViewDetail && onViewDetail(record)}
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
