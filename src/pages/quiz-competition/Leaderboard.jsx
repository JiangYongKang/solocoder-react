import { useState, useMemo } from 'react'
import {
  loadRanking,
  sortRanking,
  paginateRanking,
  formatDate,
  formatAccuracy,
} from './quizCore'

const PAGE_SIZE = 10

export default function Leaderboard() {
  const [ranking] = useState(() => loadRanking())
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('totalScore')

  const sortedRanking = useMemo(() => sortRanking(ranking, sortBy), [ranking, sortBy])

  const paginated = useMemo(
    () => paginateRanking(sortedRanking, page, PAGE_SIZE),
    [sortedRanking, page]
  )

  const handleSortChange = (value) => {
    setSortBy(value)
    setPage(1)
  }

  const getRankBadge = (index) => {
    if (index === 0) return <span className="rank-badge gold">🥇</span>
    if (index === 1) return <span className="rank-badge silver">🥈</span>
    if (index === 2) return <span className="rank-badge bronze">🥉</span>
    return <span className="rank-badge">{index + 1}</span>
  }

  return (
    <div className="quiz-leaderboard">
      <div className="quiz-leaderboard-header">
        <h2>排行榜</h2>
        <div className="quiz-leaderboard-controls">
          <label className="quiz-sort-label">排序：</label>
          <select
            className="quiz-select"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="totalScore">总分</option>
            <option value="score">单轮最高分</option>
            <option value="accuracy">正确率</option>
            <option value="rounds">总轮数</option>
            <option value="createdAt">最近时间</option>
          </select>
        </div>
      </div>

      <div className="quiz-leaderboard-stats">
        <span>共 {paginated.total} 条记录</span>
      </div>

      {paginated.items.length === 0 ? (
        <div className="quiz-empty">暂无排行记录，快去答题吧！</div>
      ) : (
        <>
          <div className="quiz-leaderboard-list">
            {paginated.items.map((record, idx) => (
            <div key={record.id} className="quiz-leaderboard-item">
              <div className="quiz-leaderboard-rank">
                {getRankBadge((page - 1) * PAGE_SIZE + idx)}
              </div>
              <div className="quiz-leaderboard-info">
                <div className="quiz-leaderboard-nickname">{record.nickname}</div>
                <div className="quiz-leaderboard-meta">
                  <span>{formatDate(record.createdAt)}</span>
                  <span>·</span>
                  <span>{record.rounds} 轮</span>
                  <span>·</span>
                  <span>正确率 {formatAccuracy(record.accuracy)}</span>
                </div>
              </div>
              <div className="quiz-leaderboard-score">
                <span className="quiz-leaderboard-score-value">{record.totalScore}</span>
                <span className="quiz-leaderboard-score-label">总分</span>
              </div>
            </div>
          ))}
          </div>

          {paginated.totalPages > 1 && (
            <div className="quiz-pagination">
              <button
                className="quiz-btn quiz-btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </button>
              <span className="quiz-page-info">
                第 {page} / {paginated.totalPages} 页
              </span>
              <button
                className="quiz-btn quiz-btn-sm"
                onClick={() => setPage((p) => Math.min(paginated.totalPages, p + 1))}
                disabled={page === paginated.totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
