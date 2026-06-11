export const VOTE_TYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
}

export const VOTE_TYPE_LABELS = {
  [VOTE_TYPES.SINGLE]: '单选',
  [VOTE_TYPES.MULTIPLE]: '多选',
}

export const VOTE_STATUS = {
  ACTIVE: 'active',
  ENDED: 'ended',
}

export const VOTE_STATUS_LABELS = {
  [VOTE_STATUS.ACTIVE]: '进行中',
  [VOTE_STATUS.ENDED]: '已结束',
}

const VOTES_STORAGE_KEY = 'voting_app_votes'
const VOTED_STORAGE_PREFIX = 'voting_app_voted_'

const OPTION_COLORS = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#84cc16',
]

export function getOptionColor(index) {
  return OPTION_COLORS[index % OPTION_COLORS.length]
}

let idCounter = 0

export function generateId(prefix = 'vote') {
  idCounter += 1
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${random}${idCounter}`
}

export function createVote({ title, description, type, options, deadline, showResultsBeforeVote = true }) {
  const voteOptions = (options || []).map((opt, idx) => ({
    id: `opt_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    text: opt.text || opt,
    votes: 0,
  }))

  return {
    id: generateId('vote'),
    title: title || '',
    description: description || '',
    type: type || VOTE_TYPES.SINGLE,
    options: voteOptions,
    deadline: deadline || null,
    showResultsBeforeVote,
    totalVotes: 0,
    createdAt: Date.now(),
  }
}

export function validateVoteCreation(data) {
  const errors = {}

  if (!data.title || !data.title.trim()) {
    errors.title = '请输入投票标题'
  }

  if (!data.options || !Array.isArray(data.options) || data.options.length < 2) {
    errors.options = '至少需要 2 个选项'
  } else if (data.options.length > 10) {
    errors.options = '最多支持 10 个选项'
  } else {
    const emptyOptions = data.options.filter((opt) => {
      const text = typeof opt === 'string' ? opt : opt.text
      return !text || !text.trim()
    })
    if (emptyOptions.length > 0) {
      errors.options = '选项内容不能为空'
    }
  }

  if (data.type !== VOTE_TYPES.SINGLE && data.type !== VOTE_TYPES.MULTIPLE) {
    errors.type = '无效的投票类型'
  }

  if (data.deadline) {
    const deadlineTime = new Date(data.deadline).getTime()
    if (Number.isNaN(deadlineTime) || deadlineTime <= Date.now()) {
      errors.deadline = '截止时间必须晚于当前时间'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function loadVotes() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(VOTES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveVotes(votes) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes))
    return true
  } catch {
    return false
  }
}

export function getVoteById(votes, voteId) {
  if (!Array.isArray(votes) || !voteId) return null
  return votes.find((v) => v.id === voteId) || null
}

export function addVote(votes, vote) {
  if (!Array.isArray(votes)) return [vote]
  return [...votes, vote]
}

export function updateVote(votes, voteId, updates) {
  if (!Array.isArray(votes) || !voteId) return votes
  return votes.map((v) => (v.id === voteId ? { ...v, ...updates } : v))
}

export function deleteVote(votes, voteId) {
  if (!Array.isArray(votes) || !voteId) return votes
  return votes.filter((v) => v.id !== voteId)
}

export function hasUserVoted(voteId) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    const key = VOTED_STORAGE_PREFIX + voteId
    const record = window.localStorage.getItem(key)
    return record !== null
  } catch {
    return false
  }
}

export function getUserVotedOptions(voteId) {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const key = VOTED_STORAGE_PREFIX + voteId
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function recordUserVote(voteId, optionIds) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    const key = VOTED_STORAGE_PREFIX + voteId
    const options = Array.isArray(optionIds) ? optionIds : [optionIds]
    window.localStorage.setItem(key, JSON.stringify(options))
    return true
  } catch {
    return false
  }
}

export function submitVote(vote, optionIds) {
  if (!vote || !Array.isArray(vote.options)) return vote
  const selectedIds = Array.isArray(optionIds) ? optionIds : [optionIds]

  if (selectedIds.length === 0) return vote

  if (vote.type === VOTE_TYPES.SINGLE && selectedIds.length > 1) {
    return vote
  }

  const updatedOptions = vote.options.map((opt) => {
    if (selectedIds.includes(opt.id)) {
      return { ...opt, votes: opt.votes + 1 }
    }
    return opt
  })

  const newTotalVotes = vote.type === VOTE_TYPES.SINGLE
    ? vote.totalVotes + 1
    : vote.totalVotes + 1

  return {
    ...vote,
    options: updatedOptions,
    totalVotes: newTotalVotes,
  }
}

export function calculatePercentages(vote) {
  if (!vote || !Array.isArray(vote.options) || vote.totalVotes === 0) {
    return (vote?.options || []).map((opt) => ({ ...opt, percentage: 0 }))
  }

  return vote.options.map((opt) => ({
    ...opt,
    percentage: (opt.votes / vote.totalVotes) * 100,
  }))
}

export function isVoteEnded(vote) {
  if (!vote || !vote.deadline) return false
  return Date.now() >= new Date(vote.deadline).getTime()
}

export function getVoteStatus(vote) {
  if (!vote) return null
  return isVoteEnded(vote) ? VOTE_STATUS.ENDED : VOTE_STATUS.ACTIVE
}

export function getRemainingTime(vote) {
  if (!vote || !vote.deadline) return null

  const now = Date.now()
  const deadline = new Date(vote.deadline).getTime()
  const remaining = Math.max(0, deadline - now)

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  return {
    remaining,
    days,
    hours,
    minutes,
    seconds,
    isEnded: remaining <= 0,
  }
}

export function getTimeWarningLevel(vote) {
  if (!vote || !vote.deadline) return 'normal'

  const { remaining } = getRemainingTime(vote)
  const oneHour = 60 * 60 * 1000
  const tenMinutes = 10 * 60 * 1000

  if (remaining <= 0) return 'ended'
  if (remaining <= tenMinutes) return 'critical'
  if (remaining <= oneHour) return 'warning'
  return 'normal'
}

export function filterVotesByStatus(votes, status) {
  if (!Array.isArray(votes)) return []
  if (status === 'all') return votes

  return votes.filter((v) => {
    const voteStatus = getVoteStatus(v)
    return voteStatus === status
  })
}

export function sortVotesByCreatedAt(votes, descending = true) {
  if (!Array.isArray(votes)) return []
  return [...votes].sort((a, b) => {
    if (descending) return b.createdAt - a.createdAt
    return a.createdAt - b.createdAt
  })
}

export function getRandomOption(vote) {
  if (!vote || !Array.isArray(vote.options) || vote.options.length === 0) {
    return null
  }
  const randomIndex = Math.floor(Math.random() * vote.options.length)
  return vote.options[randomIndex]
}

export function getRandomInterval(minSeconds = 3, maxSeconds = 8) {
  const min = Math.max(1, minSeconds)
  const max = Math.max(min, maxSeconds)
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000
}

export function generateShareUrl(voteId) {
  if (!voteId) return ''
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const separator = hash ? '' : '#/'
  return `${baseUrl}${separator}voting-app?vote=${voteId}`
}

export function copyToClipboard(text) {
  if (typeof window === 'undefined' || !navigator?.clipboard) {
    return false
  }
  try {
    navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function getUrlVoteParam() {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const voteFromSearch = params.get('vote')
  if (voteFromSearch) return voteFromSearch

  if (window.location.hash && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1]
    const hashParams = new URLSearchParams(hashQuery)
    return hashParams.get('vote')
  }

  return null
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function formatDateTimeLocal(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function simulateViewerCount(baseCount = 5) {
  const variation = Math.floor(Math.random() * 10) - 5
  return Math.max(1, baseCount + variation)
}
