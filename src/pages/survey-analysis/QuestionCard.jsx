import { useRef } from 'react'
import PieChart from './PieChart.jsx'
import HorizontalBarChart from './HorizontalBarChart.jsx'
import VerticalBarChart from './VerticalBarChart.jsx'
import WordCloud from './WordCloud.jsx'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  CHART_COLORS,
} from './constants.js'
import { statsToCSV, downloadCSV } from './surveyAnalysisCore.js'

const TYPE_TAG_CLASS = {
  [QUESTION_TYPES.SINGLE]: 'sa-tag-single',
  [QUESTION_TYPES.MULTIPLE]: 'sa-tag-multiple',
  [QUESTION_TYPES.TEXT]: 'sa-tag-text',
  [QUESTION_TYPES.RATING]: 'sa-tag-rating',
}

function downloadPNGFromRef(ref, filename) {
  let dataUrl = ''
  if (ref?.current?.toDataURL) {
    dataUrl = ref.current.toDataURL()
  }
  if (!dataUrl) return false
  try {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  } catch {
    return false
  }
}

function QuestionCard({ question, stats }) {
  const pieRef = useRef(null)
  const barRef = useRef(null)
  const vbarRef = useRef(null)
  const wordRef = useRef(null)
  const durRef = useRef(null)

  const typeLabel = QUESTION_TYPE_LABELS[question.type] || question.type
  const tagClass = TYPE_TAG_CLASS[question.type] || ''

  const safeTitle = (question.title || 'question').replace(/[\\/:*?"<>|]/g, '_')

  const handleExportPNG = () => {
    let ref = null
    if (question.type === QUESTION_TYPES.SINGLE) ref = pieRef
    else if (question.type === QUESTION_TYPES.MULTIPLE) ref = barRef
    else if (question.type === QUESTION_TYPES.RATING) ref = vbarRef
    else if (question.type === QUESTION_TYPES.TEXT) ref = wordRef
    else ref = durRef
    downloadPNGFromRef(ref, `${safeTitle}-chart.png`)
  }

  const handleExportCSV = () => {
    const csv = statsToCSV(question, stats)
    downloadCSV(csv, `${safeTitle}-stats.csv`)
  }

  return (
    <div className="sa-question-card">
      <div className="sa-question-card-header">
        <div className="sa-question-title-wrap">
          <span className={`sa-question-type-tag ${tagClass}`}>{typeLabel}</span>
          <h4 className="sa-question-title">{question.title}</h4>
        </div>
        <div className="sa-card-actions">
          <button
            className="sa-icon-btn"
            title="导出 PNG"
            onClick={handleExportPNG}
          >
            📷
          </button>
          <button
            className="sa-icon-btn"
            title="导出 CSV"
            onClick={handleExportCSV}
          >
            📄
          </button>
        </div>
      </div>
      <div className="sa-question-card-body">
        {question.type === QUESTION_TYPES.SINGLE && stats && (
          <SingleChoiceContent stats={stats} pieRef={pieRef} />
        )}
        {question.type === QUESTION_TYPES.MULTIPLE && stats && (
          <MultipleChoiceContent stats={stats} barRef={barRef} />
        )}
        {question.type === QUESTION_TYPES.RATING && stats && (
          <RatingContent question={question} stats={stats} vbarRef={vbarRef} />
        )}
        {question.type === QUESTION_TYPES.TEXT && stats && (
          <TextContent stats={stats} wordRef={wordRef} />
        )}
      </div>
    </div>
  )
}

function SingleChoiceContent({ stats, pieRef }) {
  return (
    <div className="sa-chart-wrap">
      <div className="sa-pie-wrap">
        <PieChart ref={pieRef} data={stats.data} size={220} />
      </div>
      <div className="sa-legend-list">
        {stats.data.map((d, idx) => (
          <div key={idx} className="sa-legend-item">
            <span
              className="sa-legend-color"
              style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
            />
            <span className="sa-legend-label">{d.label}</span>
            <span className="sa-legend-count">{d.count}人</span>
            <span className="sa-legend-ratio">{d.ratio.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MultipleChoiceContent({ stats, barRef }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <HorizontalBarChart ref={barRef} data={stats.data} width={560} />
    </div>
  )
}

function RatingContent({ question, stats, vbarRef }) {
  const max = question.maxRating || 5
  const fullStars = Math.floor(stats.average)
  const hasHalf = stats.average - fullStars >= 0.5
  const stars = []
  for (let i = 0; i < max; i++) {
    if (i < fullStars) stars.push('★')
    else if (i === fullStars && hasHalf) stars.push('⯨')
    else stars.push('☆')
  }

  return (
    <>
      <div className="sa-rating-summary">
        <div className="sa-rating-avg">
          <span className="sa-rating-avg-num">{stats.average}</span>
          <span className="sa-rating-avg-label">平均分</span>
        </div>
        <div className="sa-rating-stars">{stars.join('')}</div>
        <div className="sa-rating-median">
          中位数：<strong>{stats.median}</strong>
        </div>
      </div>
      <VerticalBarChart
        ref={vbarRef}
        data={stats.data}
        xLabels={stats.data.map((d) => `${d.rating}星`)}
        width={480}
        height={200}
        color="#ec4899"
      />
    </>
  )
}

function TextContent({ stats, wordRef }) {
  const maxCount = Math.max(1, ...stats.frequentWords.map((w) => w.count))
  return (
    <>
      <WordCloud ref={wordRef} data={stats.frequentWords} />
      {stats.frequentWords.length > 0 && (
        <div className="sa-freq-list">
          <div className="sa-freq-title">高频词 TOP {stats.frequentWords.length}</div>
          {stats.frequentWords.map((w, idx) => (
            <div key={idx} className="sa-freq-item">
              <span className="sa-freq-rank">{idx + 1}</span>
              <span className="sa-freq-word">{w.word}</span>
              <div className="sa-freq-bar-wrap">
                <div
                  className="sa-freq-bar"
                  style={{ width: `${(w.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="sa-freq-count">{w.count}次</span>
            </div>
          ))}
        </div>
      )}
      {stats.sampleAnswers.length > 0 && (
        <div className="sa-sample-answers">
          <div className="sa-sample-title">典型回答示例</div>
          <div className="sa-sample-list">
            {stats.sampleAnswers.map((a, idx) => (
              <div key={idx} className="sa-sample-item">{a}</div>
            ))}
          </div>
        </div>
      )}
      <div className="sa-answered-count">
        有效回答：<strong>{stats.answeredCount}</strong> / 总答卷 {stats.total}
      </div>
    </>
  )
}

export default QuestionCard
