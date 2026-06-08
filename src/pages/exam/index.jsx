import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionBank from './QuestionBank'
import ExamCreate from './ExamCreate'
import ExamTake from './ExamTake'
import ExamResult from './ExamResult'
import ExamHistory from './ExamHistory'
import { loadExamHistory } from './examCore'
import './exam.css'

const VIEWS = {
  BANK: 'bank',
  CREATE: 'create',
  TAKE: 'take',
  RESULT: 'result',
  HISTORY: 'history',
}

const TABS = [
  { key: VIEWS.BANK, label: '题库管理' },
  { key: VIEWS.CREATE, label: '组卷考试' },
  { key: VIEWS.HISTORY, label: '成绩记录' },
]

export default function ExamPage() {
  const navigate = useNavigate()
  const initial = useMemo(() => {
    if (typeof window === 'undefined') {
      return { view: VIEWS.BANK, record: null }
    }
    const params = new URLSearchParams(window.location.search)
    const recordId = params.get('record')
    if (recordId) {
      const history = loadExamHistory()
      const r = history.find((x) => x.id === recordId)
      if (r) {
        return { view: VIEWS.RESULT, record: r }
      }
    }
    return { view: VIEWS.BANK, record: null }
  }, [])
  const [view, setView] = useState(initial.view)
  const [currentExam, setCurrentExam] = useState(null)
  const [currentRecord, setCurrentRecord] = useState(initial.record)
  const [takeAnswers, setTakeAnswers] = useState({})
  const [takeStartedAt, setTakeStartedAt] = useState(null)

  const handleStartExam = (exam) => {
    setCurrentExam(exam)
    setTakeAnswers({})
    setTakeStartedAt(Date.now())
    setView(VIEWS.TAKE)
  }

  const handleFinishExam = (record) => {
    setCurrentRecord(record)
    setCurrentExam(null)
    setTakeAnswers({})
    setTakeStartedAt(null)
    setView(VIEWS.RESULT)
  }

  const handleRetryExam = () => {
    setView(VIEWS.CREATE)
  }

  const handleViewRecordDetail = (record) => {
    setCurrentRecord(record)
    setView(VIEWS.RESULT)
  }

  const handleBackToHome = () => {
    if (view === VIEWS.TAKE) {
      if (!window.confirm('正在考试中，确定要离开吗？进度已自动保存。')) {
        return
      }
    }
    navigate('/')
  }

  const showTabs = view !== VIEWS.TAKE

  return (
    <div className="exam-page">
      <div className="exam-header">
        <button className="exam-back-btn" onClick={handleBackToHome}>
          ← 返回首页
        </button>
        <h1 className="exam-title">在线考试系统</h1>
      </div>

      {showTabs && (
        <div className="exam-nav-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`exam-nav-tab ${view === tab.key ? 'active' : ''}`}
              onClick={() => setView(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="exam-content">
        {view === VIEWS.BANK && <QuestionBank />}

        {view === VIEWS.CREATE && <ExamCreate onStartExam={handleStartExam} />}

        {view === VIEWS.TAKE && currentExam && (
          <ExamTake
            exam={currentExam}
            initialAnswers={takeAnswers}
            initialStartedAt={takeStartedAt}
            onFinish={handleFinishExam}
          />
        )}

        {view === VIEWS.RESULT && currentRecord && (
          <ExamResult
            record={currentRecord}
            onBack={() => setView(VIEWS.HISTORY)}
            onRetry={handleRetryExam}
          />
        )}

        {view === VIEWS.HISTORY && (
          <ExamHistory onViewDetail={handleViewRecordDetail} />
        )}
      </div>
    </div>
  )
}
