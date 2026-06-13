import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  VIEWS,
  loadGradeData,
  saveGradeData,
  loadPreviousData,
  addStudent,
  removeStudent,
  addSubject,
  removeSubject,
  updateScore,
  getStudentTotal,
  getStudentAverage,
  getAllSubjectStats,
  getSubjectScores,
  getScoreDistribution,
  calculateRankings,
  calculateRankChanges,
  parsePastedData,
  exportToCSV,
  downloadCSV,
  validateScore,
} from './gradeCore'
import './grade-manager.css'

const TABS = [
  { key: VIEWS.STUDENT, label: '学生视图' },
  { key: VIEWS.SUBJECT, label: '科目视图' },
]

function ScoreCell({ value, onChange, onBlur }) {
  const [editingValue, setEditingValue] = useState(value ?? '')
  const [isInvalid, setIsInvalid] = useState(false)

  useEffect(() => {
    setEditingValue(value ?? '')
  }, [value])

  const handleChange = (e) => {
    const val = e.target.value
    setEditingValue(val)
    if (val === '' || val === null || val === undefined) {
      setIsInvalid(false)
    } else {
      const validation = validateScore(val)
      setIsInvalid(!validation.valid)
    }
  }

  const handleBlur = () => {
    if (editingValue === '' || editingValue === null || editingValue === undefined) {
      onChange(null)
      onBlur()
      return
    }
    const validation = validateScore(editingValue)
    if (validation.valid) {
      onChange(validation.value)
      setIsInvalid(false)
    } else {
      setIsInvalid(true)
    }
    onBlur()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBlur()
      e.target.blur()
    }
    if (e.key === 'Escape') {
      setEditingValue(value ?? '')
      setIsInvalid(false)
      e.target.blur()
    }
  }

  return (
    <input
      type="text"
      className={`grade-cell-input ${isInvalid ? 'invalid' : ''}`}
      value={editingValue}
      placeholder={value === null || value === undefined ? '-' : ''}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  )
}

function GradeTable({ data, view, onUpdateScore, onRemoveStudent, onRemoveSubject }) {
  const [editingCell, setEditingCell] = useState(null)

  if (view === VIEWS.STUDENT) {
    return (
      <div className="grade-table-container">
        <table className="grade-table">
          <thead>
            <tr>
              <th>姓名</th>
              {data.subjects.map((subject) => (
                <th key={subject}>
                  {subject}
                  {data.subjects.length > 1 && (
                    <button
                      className="grade-delete-btn"
                      onClick={() => onRemoveSubject(subject)}
                      title="删除科目"
                    >
                      ×
                    </button>
                  )}
                </th>
              ))}
              <th>总分</th>
              <th>平均分</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((student) => (
              <tr key={student}>
                <td>
                  {student}
                  <button
                    className="grade-delete-btn"
                    onClick={() => onRemoveStudent(student)}
                    title="删除学生"
                  >
                    ×
                  </button>
                </td>
                {data.subjects.map((subject) => (
                  <td key={`${student}-${subject}`}>
                    <ScoreCell
                      value={data.scores[student]?.[subject]}
                      onChange={(score) => onUpdateScore(student, subject, score)}
                      onBlur={() => setEditingCell(null)}
                    />
                  </td>
                ))}
                <td>
                  <span className="grade-badge grade-badge-total">
                    {getStudentTotal(data, student)}
                  </span>
                </td>
                <td>
                  <span className="grade-badge grade-badge-avg">
                    {getStudentAverage(data, student).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="grade-table-container">
      <table className="grade-table">
        <thead>
          <tr>
            <th>科目</th>
            {data.students.map((student) => (
              <th key={student}>
                {student}
                {data.students.length > 1 && (
                  <button
                    className="grade-delete-btn"
                    onClick={() => onRemoveStudent(student)}
                    title="删除学生"
                  >
                    ×
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.subjects.map((subject) => (
            <tr key={subject}>
              <td>
                {subject}
                <button
                  className="grade-delete-btn"
                  onClick={() => onRemoveSubject(subject)}
                  title="删除科目"
                >
                  ×
                </button>
              </td>
              {data.students.map((student) => (
                <td key={`${subject}-${student}`}>
                  <ScoreCell
                    value={data.scores[student]?.[subject]}
                    onChange={(score) => onUpdateScore(student, subject, score)}
                    onBlur={() => setEditingCell(null)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatsPanel({ data }) {
  const stats = getAllSubjectStats(data)

  return (
    <div className="grade-section">
      <h3 className="grade-section-title">统计分析</h3>
      <div className="grade-table-container">
        <table className="grade-stats-table">
          <thead>
            <tr>
              <th>科目</th>
              <th>均分</th>
              <th>最高分</th>
              <th>最低分</th>
              <th>中位数</th>
              <th>标准差</th>
              <th>有效人数</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.subject}>
                <td>{stat.subject}</td>
                <td>{stat.mean}</td>
                <td>{stat.max}</td>
                <td>{stat.min}</td>
                <td>{stat.median}</td>
                <td>{stat.stdDev}</td>
                <td>{stat.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Histogram({ data }) {
  const [selectedSubject, setSelectedSubject] = useState(data.subjects[0] || '')

  useEffect(() => {
    if (!data.subjects.includes(selectedSubject) && data.subjects.length > 0) {
      setSelectedSubject(data.subjects[0])
    }
  }, [data.subjects, selectedSubject])

  const scores = getSubjectScores(data, selectedSubject)
  const distribution = getScoreDistribution(scores)
  const maxCount = Math.max(...distribution.map((d) => d.count), 1)

  return (
    <div className="grade-section">
      <h3 className="grade-section-title">成绩分布直方图</h3>
      <select
        className="grade-histogram-select"
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
        disabled={data.subjects.length === 0}
      >
        {data.subjects.map((subject) => (
          <option key={subject} value={subject}>
            {subject}
          </option>
        ))}
      </select>

      <div className="grade-histogram-chart">
        {distribution.map((range, index) => {
          const heightPercent = maxCount > 0 ? (range.count / maxCount) * 80 : 0
          return (
            <div key={index} className="grade-histogram-bar">
              <div
                className="grade-histogram-bar-fill"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: range.color,
                }}
              >
                {range.count > 0 && (
                  <span className="grade-histogram-bar-count">{range.count}</span>
                )}
              </div>
              <div className="grade-histogram-bar-label">
                <div>{range.label}</div>
                <div style={{ fontSize: '10px', color: '#999' }}>
                  {range.min}-{range.max}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grade-legend">
        {distribution.map((range, index) => (
          <div key={index} className="grade-legend-item">
            <span
              className="grade-legend-color"
              style={{ backgroundColor: range.color }}
            />
            <span>
              {range.label} ({range.min}-{range.max})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RankingPanel({ data, previousData }) {
  const [sortBy, setSortBy] = useState('total')
  const rankings = calculateRankings(data, sortBy)
  const rankingsWithChanges = calculateRankChanges(rankings, previousData)

  const getRankChangeDisplay = (change) => {
    if (change === null || change === undefined) {
      return <span className="grade-rank-change new">新</span>
    }
    if (change > 0) {
      return (
        <span className="grade-rank-change up">
          ↑{change}
        </span>
      )
    }
    if (change < 0) {
      return (
        <span className="grade-rank-change down">
          ↓{Math.abs(change)}
        </span>
      )
    }
    return <span className="grade-rank-change same">-</span>
  }

  const getRowClass = (rank) => {
    if (rank === 1) return 'grade-rank-1'
    if (rank === 2) return 'grade-rank-2'
    if (rank === 3) return 'grade-rank-3'
    return ''
  }

  return (
    <div className="grade-section">
      <h3 className="grade-section-title">排名</h3>
      <div className="grade-table-container">
        <table className="grade-ranking-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>变化</th>
              <th>姓名</th>
              {data.subjects.map((subject) => (
                <th key={subject} onClick={() => setSortBy(subject)}>
                  {subject} {sortBy === subject ? '↓' : ''}
                </th>
              ))}
              <th onClick={() => setSortBy('total')}>
                总分 {sortBy === 'total' ? '↓' : ''}
              </th>
              <th>平均分</th>
            </tr>
          </thead>
          <tbody>
            {rankingsWithChanges.map((student, index) => (
              <tr key={student.name} className={getRowClass(student.rank)}>
                <td>{student.rank}</td>
                <td>{getRankChangeDisplay(student.change)}</td>
                <td>{student.name}</td>
                {data.subjects.map((subject) => (
                  <td key={subject}>
                    {student.scores[subject] !== null &&
                    student.scores[subject] !== undefined
                      ? student.scores[subject]
                      : '-'}
                  </td>
                ))}
                <td>
                  <span className="grade-badge grade-badge-total">{student.total}</span>
                </td>
                <td>{student.average.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PasteArea({ data, onParse }) {
  const [text, setText] = useState('')
  const [errors, setErrors] = useState([])

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text')
    setText(pastedText)
  }

  const handleApply = () => {
    if (!text.trim()) return
    const result = parsePastedData(text, data)
    if (result.errors.length > 0) {
      setErrors(result.errors)
      return
    }
    setErrors([])
    onParse(result)
    setText('')
  }

  const handleClear = () => {
    setText('')
    setErrors([])
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div className="grade-paste-hint">
        提示：粘贴制表符（Tab）或逗号分隔的数据，格式：姓名 科目1 科目2 ...
      </div>
      <textarea
        className="grade-paste-area"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={handlePaste}
        placeholder="张三&#9;85&#9;92&#9;78&#10;李四&#9;76&#9;88&#9;90"
      />
      {errors.length > 0 && (
        <ul className="grade-error-list">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
      <div className="grade-toolbar" style={{ marginBottom: 0 }}>
        <button className="grade-btn" onClick={handleApply} disabled={!text.trim()}>
          应用数据
        </button>
        <button
          className="grade-btn"
          style={{ background: '#8c8c8c' }}
          onClick={handleClear}
          disabled={!text.trim()}
        >
          清空
        </button>
      </div>
    </div>
  )
}

export default function GradeManagerPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(() => loadGradeData())
  const [view, setView] = useState(VIEWS.STUDENT)
  const [newStudent, setNewStudent] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [error, setError] = useState('')
  const [previousData, setPreviousData] = useState(null)

  useEffect(() => {
    setPreviousData(loadPreviousData())
  }, [])

  useEffect(() => {
    saveGradeData(data)
  }, [data])

  const handleAddStudent = useCallback(() => {
    const result = addStudent(data, newStudent)
    if (result.error) {
      setError(result.error)
      return
    }
    setData(result)
    setNewStudent('')
    setError('')
  }, [data, newStudent])

  const handleRemoveStudent = useCallback(
    (studentName) => {
      if (window.confirm(`确定要删除学生「${studentName}」吗？`)) {
        setData(removeStudent(data, studentName))
      }
    },
    [data]
  )

  const handleAddSubject = useCallback(() => {
    const result = addSubject(data, newSubject)
    if (result.error) {
      setError(result.error)
      return
    }
    setData(result)
    setNewSubject('')
    setError('')
  }, [data, newSubject])

  const handleRemoveSubject = useCallback(
    (subjectName) => {
      if (window.confirm(`确定要删除科目「${subjectName}」吗？`)) {
        setData(removeSubject(data, subjectName))
      }
    },
    [data]
  )

  const handleUpdateScore = useCallback(
    (studentName, subjectName, score) => {
      const result = updateScore(data, studentName, subjectName, score)
      if (result.error) {
        setError(result.error)
        return
      }
      setData(result)
      setError('')
    },
    [data]
  )

  const handleParsePastedData = useCallback((parsedData) => {
    setData({
      students: parsedData.students,
      subjects: parsedData.subjects,
      scores: parsedData.scores,
    })
    setPreviousData(loadGradeData())
  }, [])

  const handleExportCSV = useCallback(() => {
    const { csvContent, filename } = exportToCSV(data)
    downloadCSV(csvContent, filename)
  }, [data])

  const handleReset = useCallback(() => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      setData({
        students: [],
        subjects: ['语文', '数学', '英语', '物理', '化学'],
        scores: {},
      })
      setPreviousData(null)
      setError('')
    }
  }, [])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  return (
    <div className="grade-manager-page">
      <div className="grade-header">
        <button className="grade-back-btn" onClick={handleBack}>
          ← 返回首页
        </button>
        <h1 className="grade-title">成绩管理系统</h1>
        <div className="grade-header-actions">
          <button className="grade-btn" onClick={handleExportCSV}>
            导出 CSV
          </button>
          <button className="grade-btn grade-btn-danger" onClick={handleReset}>
            重置
          </button>
        </div>
      </div>

      <div className="grade-nav-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`grade-nav-tab ${view === tab.key ? 'active' : ''}`}
            onClick={() => setView(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grade-section">
        <h3 className="grade-section-title">成绩录入</h3>

        <PasteArea data={data} onParse={handleParsePastedData} />

        {error && <div className="grade-error">{error}</div>}

        <GradeTable
          data={data}
          view={view}
          onUpdateScore={handleUpdateScore}
          onRemoveStudent={handleRemoveStudent}
          onRemoveSubject={handleRemoveSubject}
        />

        <div className="grade-add-row">
          <input
            type="text"
            className="grade-input"
            placeholder="输入学生姓名"
            value={newStudent}
            onChange={(e) => setNewStudent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
          />
          <button className="grade-btn" onClick={handleAddStudent}>
            添加学生
          </button>

          <input
            type="text"
            className="grade-input"
            placeholder="输入科目名称"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
          />
          <button className="grade-btn" onClick={handleAddSubject}>
            添加科目
          </button>
        </div>
      </div>

      <StatsPanel data={data} />

      <Histogram data={data} />

      <RankingPanel data={data} previousData={previousData} />
    </div>
  )
}
