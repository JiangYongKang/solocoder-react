import {
  calculateStreakDays,
  getStudyDatesFromStats,
  buildHeatmapData,
  getHeatmapCellColor,
  calculateTotalStats,
  calculateDailyProgress,
} from './flashcardUtils'

export default function StatsPanel({ cards, stats, settings, onSettingsChange }) {
  const studyDates = getStudyDatesFromStats(stats)
  const streak = calculateStreakDays(studyDates)
  const heatmap = buildHeatmapData(stats, 30)
  const totalStats = calculateTotalStats(cards)
  const dailyProgress = calculateDailyProgress(cards, stats, settings.dailyGoal)

  return (
    <div className="fc-sidebar">
      <div className="fc-panel">
        <div className="fc-streak-display">
          <div>
            <div className="fc-streak-num">{streak}</div>
            <div className="fc-streak-label">连续打卡天数</div>
          </div>
        </div>

        <div className="fc-progress-wrap">
          <div className="fc-progress-label">
            <span>今日学习</span>
            <span>{dailyProgress.completed} / {dailyProgress.goal}</span>
          </div>
          <div className="fc-progress-bar">
            <div
              className="fc-progress-fill"
              style={{ width: `${dailyProgress.rate}%` }}
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <label className="fc-form-label" style={{ fontSize: 12 }}>
              每日目标卡片数：
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={settings.dailyGoal}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (val > 0 && val <= 200) {
                  onSettingsChange({ ...settings, dailyGoal: val })
                }
              }}
              className="fc-form-input"
              style={{ padding: '4px 8px', fontSize: 12, width: 80 }}
            />
          </div>
        </div>
      </div>

      <div className="fc-panel">
        <h3 className="fc-panel-title" style={{ marginBottom: 16 }}>累计统计</h3>
        <div className="fc-stats-grid">
          <div className="fc-stat-item">
            <div className="fc-stat-value">{totalStats.totalCards}</div>
            <div className="fc-stat-label">总卡片数</div>
          </div>
          <div className="fc-stat-item">
            <div className="fc-stat-value">{totalStats.masteredCards}</div>
            <div className="fc-stat-label">已掌握</div>
          </div>
          <div className="fc-stat-item">
            <div className="fc-stat-value">{totalStats.totalReviews}</div>
            <div className="fc-stat-label">学习总次数</div>
          </div>
          <div className="fc-stat-item">
            <div className="fc-stat-value">
              {totalStats.totalReviews > 0
                ? `${Math.round((totalStats.totalCorrect / totalStats.totalReviews) * 100)}%`
                : '-'}
            </div>
            <div className="fc-stat-label">总正确率</div>
          </div>
        </div>
      </div>

      <div className="fc-panel">
        <h3 className="fc-panel-title" style={{ marginBottom: 16 }}>最近30天</h3>
        <div className="fc-heatmap-wrap">
          <div className="fc-heatmap-grid">
            {heatmap.map((cell, idx) => (
              <div
                key={idx}
                className="fc-heatmap-cell"
                title={`${cell.date}${cell.studied ? ` (${cell.count}张)` : ''}`}
                style={{
                  background: getHeatmapCellColor(cell.studied, cell.count),
                }}
              />
            ))}
          </div>
          <div className="fc-heatmap-labels">
            <span>30天前</span>
            <span>今天</span>
          </div>
        </div>
      </div>
    </div>
  )
}
