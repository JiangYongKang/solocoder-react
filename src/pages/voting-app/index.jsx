import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  VOTE_TYPES,
  VOTE_TYPE_LABELS,
  VOTE_STATUS,
  VOTE_STATUS_LABELS,
  getOptionColor,
  createVote,
  validateVoteCreation,
  loadVotes,
  saveVotes,
  getVoteById,
  addVote,
  updateVote,
  deleteVote,
  hasUserVoted,
  getUserVotedOptions,
  recordUserVote,
  submitVote,
  calculatePercentages,
  isVoteEnded,
  getVoteStatus,
  getRemainingTime,
  getTimeWarningLevel,
  filterVotesByStatus,
  sortVotesByCreatedAt,
  getRandomOption,
  getRandomInterval,
  generateShareUrl,
  copyToClipboard,
  getUrlVoteParam,
  formatDate,
  simulateViewerCount,
} from './votingCore'

import './voting.css'

const TABS = {
  DETAIL: 'detail',
  LIST: 'list',
}

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: VOTE_STATUS.ACTIVE, label: '进行中' },
  { key: VOTE_STATUS.ENDED, label: '已结束' },
]

function CreateVoteModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState(VOTE_TYPES.SINGLE)
  const [options, setOptions] = useState(['', ''])
  const [deadline, setDeadline] = useState('')
  const [showResultsBeforeVote, setShowResultsBeforeVote] = useState(true)
  const [errors, setErrors] = useState({})

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
    }
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = () => {
    const data = {
      title,
      description,
      type,
      options: options.map((text) => ({ text })),
      deadline: deadline || null,
      showResultsBeforeVote,
    }

    const validation = validateVoteCreation(data)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    const newVote = createVote(data)
    onCreate(newVote)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="vt-modal-overlay" onClick={onClose}>
      <div className="vt-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="vt-modal-header">
          <h3>创建投票</h3>
          <button className="vt-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="vt-modal-body">
          <div className="vt-form-group">
            <label>投票标题 <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              className="vt-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入投票标题"
            />
            {errors.title && <div className="vt-error-text">{errors.title}</div>}
          </div>

          <div className="vt-form-group">
            <label>投票描述</label>
            <textarea
              className="vt-input vt-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入投票描述（可选）"
              rows={2}
            />
          </div>

          <div className="vt-form-group">
            <label>投票类型</label>
            <div className="vt-radio-group">
              <label className="vt-radio-label">
                <input
                  type="radio"
                  name="voteType"
                  value={VOTE_TYPES.SINGLE}
                  checked={type === VOTE_TYPES.SINGLE}
                  onChange={() => setType(VOTE_TYPES.SINGLE)}
                />
                <span>{VOTE_TYPE_LABELS[VOTE_TYPES.SINGLE]}</span>
              </label>
              <label className="vt-radio-label">
                <input
                  type="radio"
                  name="voteType"
                  value={VOTE_TYPES.MULTIPLE}
                  checked={type === VOTE_TYPES.MULTIPLE}
                  onChange={() => setType(VOTE_TYPES.MULTIPLE)}
                />
                <span>{VOTE_TYPE_LABELS[VOTE_TYPES.MULTIPLE]}</span>
              </label>
            </div>
          </div>

          <div className="vt-form-group">
            <label>选项列表 <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="vt-option-list">
              {options.map((opt, idx) => (
                <div key={idx} className="vt-option-row">
                  <input
                    type="text"
                    className="vt-input"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`选项 ${idx + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      className="vt-delete-option-btn"
                      onClick={() => handleRemoveOption(idx)}
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button className="vt-add-option-btn" onClick={handleAddOption}>
                + 添加选项
              </button>
            )}
            {errors.options && <div className="vt-error-text">{errors.options}</div>}
          </div>

          <div className="vt-form-group">
            <label>截止时间</label>
            <input
              type="datetime-local"
              className="vt-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <span style={{ fontSize: '12px', color: 'var(--text)' }}>
              不设置则投票永久有效
            </span>
            {errors.deadline && <div className="vt-error-text">{errors.deadline}</div>}
          </div>

          <div className="vt-form-group">
            <label className="vt-checkbox-label">
              <input
                type="checkbox"
                checked={showResultsBeforeVote}
                onChange={(e) => setShowResultsBeforeVote(e.target.checked)}
              />
              <span>允许未投票的人查看实时结果</span>
            </label>
          </div>
        </div>
        <div className="vt-modal-footer">
          <button className="vt-btn vt-btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="vt-btn vt-btn-primary" onClick={handleSubmit}>
            创建
          </button>
        </div>
      </div>
    </div>
  )
}

function Countdown({ vote, isEnded }) {
  const [remaining, setRemaining] = useState(() => getRemainingTime(vote))

  useEffect(() => {
    if (!vote?.deadline) return
    if (isEnded) return

    const timer = setInterval(() => {
      setRemaining(getRemainingTime(vote))
    }, 1000)

    return () => clearInterval(timer)
  }, [vote, isEnded])

  if (!vote?.deadline) {
    return (
      <span className={`vt-badge vt-badge-active`}>
        ● 进行中
      </span>
    )
  }

  const warningLevel = getTimeWarningLevel(vote)

  if (isEnded) {
    return (
      <span className="vt-badge vt-badge-ended">
        已结束
      </span>
    )
  }

  const countdownClass = `vt-countdown vt-countdown-${warningLevel}`

  return (
    <div className={countdownClass}>
      <span>⏱</span>
      {remaining?.days > 0 && (
        <>
          <span className="vt-countdown-digit">{remaining.days}</span>
          <span className="vt-countdown-label">天</span>
        </>
      )}
      <span className="vt-countdown-digit">
        {String(remaining?.hours || 0).padStart(2, '0')}
      </span>
      <span className="vt-countdown-label">时</span>
      <span className="vt-countdown-digit">
        {String(remaining?.minutes || 0).padStart(2, '0')}
      </span>
      <span className="vt-countdown-label">分</span>
      <span className="vt-countdown-digit">
        {String(remaining?.seconds || 0).padStart(2, '0')}
      </span>
      <span className="vt-countdown-label">秒</span>
    </div>
  )
}

function VoteDetail({ vote, onVoteSubmit, viewerCount }) {
  const [selectedOptions, setSelectedOptions] = useState([])
  const [hasVoted, setHasVoted] = useState(() => hasUserVoted(vote.id))
  const [votedOptions, setVotedOptions] = useState(() => getUserVotedOptions(vote.id))
  const [copied, setCopied] = useState(false)
  const [simulatedVote, setSimulatedVote] = useState(null)
  const [isEndedState, setIsEndedState] = useState(() => isVoteEnded(vote))
  const simulationTimerRef = useRef(null)
  const endCheckTimerRef = useRef(null)

  const isEnded = vote?.deadline ? isEndedState : false

  const optionsWithPercent = useMemo(
    () => calculatePercentages(vote),
    [vote]
  )

  useEffect(() => {
    if (!vote?.deadline) {
      return undefined
    }

    endCheckTimerRef.current = setInterval(() => {
      const ended = isVoteEnded(vote)
      setIsEndedState((prev) => {
        if (prev !== ended) {
          return ended
        }
        return prev
      })
      if (ended && endCheckTimerRef.current) {
        clearInterval(endCheckTimerRef.current)
      }
    }, 1000)

    return () => {
      if (endCheckTimerRef.current) {
        clearInterval(endCheckTimerRef.current)
      }
    }
  }, [vote])

  useEffect(() => {
    if (isEnded || hasVoted || !vote.showResultsBeforeVote) {
      return
    }

    const runSimulation = () => {
      if (isVoteEnded(vote)) {
        return
      }

      const randomOption = getRandomOption(vote)
      if (randomOption) {
        setSimulatedVote(randomOption.id)
        onVoteSubmit(vote.id, [randomOption.id])

        setTimeout(() => {
          setSimulatedVote(null)
        }, 500)
      }

      const nextInterval = getRandomInterval(3, 8)
      simulationTimerRef.current = setTimeout(runSimulation, nextInterval)
    }

    const initialDelay = getRandomInterval(2, 5)
    simulationTimerRef.current = setTimeout(runSimulation, initialDelay)

    return () => {
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current)
      }
    }
  }, [vote.id, isEnded, hasVoted, vote.showResultsBeforeVote, vote, onVoteSubmit])

  useEffect(() => {
    const simRef = simulationTimerRef
    const endRef = endCheckTimerRef
    return () => {
      if (simRef.current) {
        clearTimeout(simRef.current)
      }
      if (endRef.current) {
        clearInterval(endRef.current)
      }
    }
  }, [])

  const handleOptionSelect = (optionId) => {
    if (hasVoted || isEnded) return

    if (vote.type === VOTE_TYPES.SINGLE) {
      setSelectedOptions([optionId])
    } else {
      setSelectedOptions((prev) => {
        if (prev.includes(optionId)) {
          return prev.filter((id) => id !== optionId)
        }
        return [...prev, optionId]
      })
    }
  }

  const handleSubmitVote = () => {
    if (selectedOptions.length === 0) return
    if (hasVoted || isEnded) return

    onVoteSubmit(vote.id, selectedOptions)
    recordUserVote(vote.id, selectedOptions)
    setHasVoted(true)
    setVotedOptions(selectedOptions)
  }

  const handleCopyLink = async () => {
    const shareUrl = generateShareUrl(vote.id)
    const success = await copyToClipboard(shareUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareUrl = generateShareUrl(vote.id)

  const showResults = hasVoted || isEnded || vote.showResultsBeforeVote

  return (
    <div>
      <div className="vt-share-section">
        <h3 className="vt-share-title">🔗 分享链接</h3>
        <div className="vt-share-link-box">
          <div className="vt-share-input">{shareUrl}</div>
          <button
            className={`vt-copy-btn ${copied ? 'vt-copied' : ''}`}
            onClick={handleCopyLink}
          >
            {copied ? '✓ 已复制' : '复制链接'}
          </button>
        </div>
      </div>

      <div className="vt-detail-card">
        <div className="vt-detail-header">
          <h2 className="vt-detail-title">{vote.title}</h2>
          {vote.description && (
            <p className="vt-detail-desc">{vote.description}</p>
          )}
          <div className="vt-detail-info">
            <span className={`vt-type-badge vt-badge-${vote.type}`}>
              {VOTE_TYPE_LABELS[vote.type]}
            </span>
            <Countdown vote={vote} />
            <span className="vt-viewers-badge">
              <span className="vt-viewers-dot"></span>
              {viewerCount} 人正在浏览
            </span>
            <span className="vt-total-votes">
              总票数：{vote.totalVotes}
            </span>
          </div>
        </div>

        {isEnded && (
          <div className="vt-ended-banner">
            🔒 投票已结束
          </div>
        )}

        <div className="vt-options-list">
          {optionsWithPercent.map((option, idx) => {
            const isSelected = selectedOptions.includes(option.id)
            const isVoted = votedOptions.includes(option.id)
            const color = getOptionColor(idx)
            const isDisabled = hasVoted || isEnded
            const isJustVoted = simulatedVote === option.id

            return (
              <div
                key={option.id}
                className={`vt-option-card 
                  ${isSelected ? 'vt-option-selected' : ''} 
                  ${isDisabled ? 'vt-option-disabled' : ''}
                  ${isVoted ? 'vt-option-voted' : ''}
                  ${isJustVoted ? 'vt-option-new-vote' : ''}`}
                onClick={() => handleOptionSelect(option.id)}
              >
                {showResults && (
                  <div
                    className="vt-progress-bar"
                    style={{
                      width: `${option.percentage}%`,
                      backgroundColor: `${color}20`,
                    }}
                  />
                )}
                <div className="vt-option-content">
                  {vote.type === VOTE_TYPES.SINGLE ? (
                    <input
                      type="radio"
                      className="vt-option-input"
                      checked={isVoted || isSelected}
                      onChange={() => {}}
                      disabled={isDisabled}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <input
                      type="checkbox"
                      className="vt-option-input"
                      checked={isVoted || isSelected}
                      onChange={() => {}}
                      disabled={isDisabled}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <span className="vt-option-text">{option.text}</span>
                  {showResults && (
                    <span className="vt-option-result">
                      {option.votes} 票 ({option.percentage.toFixed(1)}%)
                    </span>
                  )}
                </div>
                {isVoted && (
                  <span className="vt-option-rank" style={{ color: '#10b981' }}>
                    ✓ 已选
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {!hasVoted && !isEnded && (
          <div className="vt-submit-area">
            <button
              className="vt-btn vt-btn-primary"
              onClick={handleSubmitVote}
              disabled={selectedOptions.length === 0}
            >
              提交投票
            </button>
          </div>
        )}

        {hasVoted && !isEnded && (
          <div className="vt-submit-area" style={{ justifyContent: 'center' }}>
            <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 500 }}>
              ✓ 您已成功投票
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function VoteList({ votes, onSelectVote, onDeleteVote, onViewResult }) {
  const [filter, setFilter] = useState('all')

  const filteredVotes = useMemo(() => {
    const filtered = filterVotesByStatus(votes, filter)
    return sortVotesByCreatedAt(filtered)
  }, [votes, filter])

  const handleDelete = (e, voteId) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这个投票吗？')) {
      onDeleteVote(voteId)
    }
  }

  if (votes.length === 0) {
    return (
      <div className="vt-empty-state">
        <p>暂无投票，点击上方「创建投票」按钮创建第一个投票</p>
      </div>
    )
  }

  return (
    <div>
      <div className="vt-filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`vt-filter-btn ${filter === f.key ? 'vt-filter-btn-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredVotes.length === 0 ? (
        <div className="vt-empty-state">
          <p>没有符合条件的投票</p>
        </div>
      ) : (
        <div className="vt-vote-list">
          {filteredVotes.map((vote) => {
            const status = getVoteStatus(vote)
            const isEnded = status === VOTE_STATUS.ENDED

            return (
              <div
                key={vote.id}
                className="vt-vote-card"
                onClick={() => onSelectVote(vote.id)}
              >
                <div className="vt-vote-card-header">
                  <h3 className="vt-vote-title">{vote.title}</h3>
                  <span className={`vt-badge ${isEnded ? 'vt-badge-ended' : 'vt-badge-active'}`}>
                    {VOTE_STATUS_LABELS[status]}
                  </span>
                </div>
                {vote.description && (
                  <p className="vt-vote-desc">{vote.description}</p>
                )}
                <div className="vt-vote-meta">
                  <span>{VOTE_TYPE_LABELS[vote.type]}</span>
                  <span>总票数：{vote.totalVotes}</span>
                  <span>选项数：{vote.options.length}</span>
                </div>
                <div className="vt-vote-meta">
                  <span>创建时间：{formatDate(vote.createdAt)}</span>
                </div>
                {vote.deadline && (
                  <div className="vt-vote-meta">
                    <span>截止时间：{formatDate(new Date(vote.deadline).getTime())}</span>
                  </div>
                )}
                <div className="vt-vote-actions">
                  <button
                    className="vt-btn vt-btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewResult(vote.id)
                    }}
                  >
                    查看结果
                  </button>
                  <button
                    className="vt-btn vt-btn-danger"
                    onClick={(e) => handleDelete(e, vote.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function VotingApp() {
  const navigate = useNavigate()
  const [votes, setVotes] = useState(() => loadVotes())
  const [activeTab, setActiveTab] = useState(() => {
    const voteId = getUrlVoteParam()
    if (voteId) {
      const initialVotes = loadVotes()
      if (getVoteById(initialVotes, voteId)) {
        return TABS.DETAIL
      }
    }
    return TABS.DETAIL
  })
  const [currentVoteId, setCurrentVoteId] = useState(() => {
    const voteId = getUrlVoteParam()
    if (voteId) {
      const initialVotes = loadVotes()
      if (getVoteById(initialVotes, voteId)) {
        return voteId
      }
    }
    return null
  })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createModalKey, setCreateModalKey] = useState(0)
  const [viewerCount, setViewerCount] = useState(5)

  useEffect(() => {
    saveVotes(votes)
  }, [votes])

  useEffect(() => {
    const timer = setInterval(() => {
      setViewerCount(simulateViewerCount(8))
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  const currentVote = useMemo(
    () => getVoteById(votes, currentVoteId),
    [votes, currentVoteId]
  )

  const handleOpenCreateModal = useCallback(() => {
    setCreateModalKey((k) => k + 1)
    setIsCreateModalOpen(true)
  }, [])

  const handleCreateVote = useCallback((newVote) => {
    setVotes((prev) => addVote(prev, newVote))
    setCurrentVoteId(newVote.id)
    setActiveTab(TABS.DETAIL)
  }, [])

  const handleVoteSubmit = useCallback((voteId, optionIds) => {
    setVotes((prev) => {
      const vote = getVoteById(prev, voteId)
      if (!vote) return prev

      const updatedVote = submitVote(vote, optionIds)
      return updateVote(prev, voteId, updatedVote)
    })
  }, [])

  const handleSelectVote = useCallback((voteId) => {
    setCurrentVoteId(voteId)
    setActiveTab(TABS.DETAIL)
  }, [])

  const handleViewResult = useCallback((voteId) => {
    setCurrentVoteId(voteId)
    setActiveTab(TABS.DETAIL)
  }, [])

  const handleDeleteVote = useCallback((voteId) => {
    setVotes((prev) => deleteVote(prev, voteId))
    if (currentVoteId === voteId) {
      setCurrentVoteId(null)
    }
  }, [currentVoteId])

  const handleBackToList = useCallback(() => {
    setActiveTab(TABS.LIST)
    setCurrentVoteId(null)
  }, [])

  return (
    <div className="vt-page">
      <div className="vt-header">
        <button className="vt-back-btn" onClick={() => navigate('/')} aria-label="返回首页">
          ← 返回首页
        </button>
        <h1 className="vt-title">多人实时投票</h1>
      </div>

      <div className="vt-content">
        <div className="vt-tabs">
          <button
            className={`vt-tab ${activeTab === TABS.DETAIL ? 'vt-tab-active' : ''}`}
            onClick={() => setActiveTab(TABS.DETAIL)}
          >
            投票详情
          </button>
          <button
            className={`vt-tab ${activeTab === TABS.LIST ? 'vt-tab-active' : ''}`}
            onClick={() => setActiveTab(TABS.LIST)}
          >
            投票列表
          </button>
        </div>

        <div className="vt-toolbar">
          <div>
            {activeTab === TABS.DETAIL && currentVote && (
              <button className="vt-btn vt-btn-secondary" onClick={handleBackToList}>
                ← 返回列表
              </button>
            )}
          </div>
          <button
            className="vt-btn vt-btn-primary"
            onClick={handleOpenCreateModal}
          >
            + 创建投票
          </button>
        </div>

        {activeTab === TABS.DETAIL && (
          <>
            {currentVote ? (
              <VoteDetail
                vote={currentVote}
                onVoteSubmit={handleVoteSubmit}
                viewerCount={viewerCount}
              />
            ) : (
              <div className="vt-empty-state">
                <p>请选择一个投票或创建新投票</p>
                <p style={{ marginTop: '12px' }}>
                  <button
                    className="vt-btn vt-btn-primary"
                    onClick={handleOpenCreateModal}
                  >
                    + 创建投票
                  </button>
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === TABS.LIST && (
          <VoteList
            votes={votes}
            onSelectVote={handleSelectVote}
            onDeleteVote={handleDeleteVote}
            onViewResult={handleViewResult}
          />
        )}
      </div>

      <CreateVoteModal
        key={createModalKey}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateVote}
      />
    </div>
  )
}
