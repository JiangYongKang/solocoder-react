import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  VOTE_TYPES,
  VOTE_TYPE_LABELS,
  VOTE_STATUS,
  VOTE_STATUS_LABELS,
  getOptionColor,
  generateId,
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
  formatDateTimeLocal,
  simulateViewerCount,
} from '../../voting-app/votingCore'

describe('VOTE_TYPES', () => {
  it('should contain single and multiple types', () => {
    expect(VOTE_TYPES.SINGLE).toBe('single')
    expect(VOTE_TYPES.MULTIPLE).toBe('multiple')
    expect(Object.keys(VOTE_TYPES)).toHaveLength(2)
  })
})

describe('VOTE_TYPE_LABELS', () => {
  it('should map types to Chinese labels', () => {
    expect(VOTE_TYPE_LABELS[VOTE_TYPES.SINGLE]).toBe('单选')
    expect(VOTE_TYPE_LABELS[VOTE_TYPES.MULTIPLE]).toBe('多选')
  })
})

describe('VOTE_STATUS', () => {
  it('should contain active and ended status', () => {
    expect(VOTE_STATUS.ACTIVE).toBe('active')
    expect(VOTE_STATUS.ENDED).toBe('ended')
  })
})

describe('VOTE_STATUS_LABELS', () => {
  it('should map status to Chinese labels', () => {
    expect(VOTE_STATUS_LABELS[VOTE_STATUS.ACTIVE]).toBe('进行中')
    expect(VOTE_STATUS_LABELS[VOTE_STATUS.ENDED]).toBe('已结束')
  })
})

describe('getOptionColor', () => {
  it('should return color based on index', () => {
    expect(typeof getOptionColor(0)).toBe('string')
    expect(getOptionColor(0)).toMatch(/^#/)
  })

  it('should cycle through colors', () => {
    const color0 = getOptionColor(0)
    const color10 = getOptionColor(10)
    expect(color0).toBe(color10)
  })
})

describe('generateId', () => {
  it('should generate string ids with prefix', () => {
    const id = generateId('vote')
    expect(typeof id).toBe('string')
    expect(id.startsWith('vote_')).toBe(true)
  })

  it('should generate unique ids', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i += 1) {
      ids.add(generateId('vote'))
    }
    expect(ids.size).toBe(100)
  })

  it('should use default prefix "vote"', () => {
    const id = generateId()
    expect(id.startsWith('vote_')).toBe(true)
  })
})

describe('createVote', () => {
  it('should create a vote with default values', () => {
    const options = [{ text: '选项1' }, { text: '选项2' }]
    const vote = createVote({
      title: '测试投票',
      description: '测试描述',
      type: VOTE_TYPES.SINGLE,
      options,
    })

    expect(vote.id).toBeDefined()
    expect(vote.title).toBe('测试投票')
    expect(vote.description).toBe('测试描述')
    expect(vote.type).toBe(VOTE_TYPES.SINGLE)
    expect(vote.options).toHaveLength(2)
    expect(vote.options[0].text).toBe('选项1')
    expect(vote.options[0].votes).toBe(0)
    expect(vote.options[0].id).toBeDefined()
    expect(vote.totalVotes).toBe(0)
    expect(vote.deadline).toBe(null)
    expect(vote.showResultsBeforeVote).toBe(true)
    expect(typeof vote.createdAt).toBe('number')
  })

  it('should create vote with string options', () => {
    const vote = createVote({
      title: '测试',
      options: ['选项A', '选项B'],
    })
    expect(vote.options).toHaveLength(2)
    expect(vote.options[0].text).toBe('选项A')
  })

  it('should handle empty options', () => {
    const vote = createVote({ title: '测试', options: [] })
    expect(vote.options).toHaveLength(0)
  })

  it('should default to single type', () => {
    const vote = createVote({ title: '测试', options: ['a', 'b'] })
    expect(vote.type).toBe(VOTE_TYPES.SINGLE)
  })

  it('should set deadline when provided', () => {
    const deadline = new Date(Date.now() + 86400000).toISOString()
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline,
    })
    expect(vote.deadline).toBe(deadline)
  })

  it('should respect showResultsBeforeVote setting', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      showResultsBeforeVote: false,
    })
    expect(vote.showResultsBeforeVote).toBe(false)
  })
})

describe('validateVoteCreation', () => {
  it('should pass for valid vote data', () => {
    const data = {
      title: '测试投票',
      type: VOTE_TYPES.SINGLE,
      options: [{ text: '选项1' }, { text: '选项2' }],
    }
    const result = validateVoteCreation(data)
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('should fail when title is empty', () => {
    const data = {
      title: '',
      type: VOTE_TYPES.SINGLE,
      options: [{ text: '选项1' }, { text: '选项2' }],
    }
    const result = validateVoteCreation(data)
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeDefined()
  })

  it('should fail when title is only whitespace', () => {
    const data = {
      title: '   ',
      type: VOTE_TYPES.SINGLE,
      options: [{ text: '选项1' }, { text: '选项2' }],
    }
    const result = validateVoteCreation(data)
    expect(result.valid).toBe(false)
  })

  it('should fail with fewer than 2 options', () => {
    const data = {
      title: '测试',
      type: VOTE_TYPES.SINGLE,
      options: [{ text: '选项1' }],
    }
    const result = validateVoteCreation(data)
    expect(result.valid).toBe(false)
    expect(result.errors.options).toBeDefined()
  })

  it('should fail with more than 10 options', () => {
    const options = Array.from({ length: 11 }, (_, i) => ({ text: `选项${i}` }))
    const data = {
      title: '测试',
      type: VOTE_TYPES.SINGLE,
      options,
    }
    const result = validateVoteCreation(data)
    expect(result.valid).toBe(false)
    expect(result.errors.options).toBeDefined()
  })

  it('should fail when option text is empty', () => {
    const data = {
      title: '测试',
      type: VOTE_TYPES.SINGLE,
      options: [{ text: '选项1' }, { text: '' }],
    }
    const result = validateVoteCreation(data)
    expect(result.valid).toBe(false)
    expect(result.errors.options).toBeDefined()
  })

  it('should fail for invalid vote type', () => {
    const data = {
      title: '测试',
      type: 'invalid',
      options: [{ text: '选项1' }, { text: '选项2' }],
    }
    const result = validateVoteCreation(data)
    expect(result.valid).toBe(false)
    expect(result.errors.type).toBeDefined()
  })

  it('should fail when deadline is in the past', () => {
    const data = {
      title: '测试',
      type: VOTE_TYPES.SINGLE,
      options: [{ text: '选项1' }, { text: '选项2' }],
      deadline: new Date(Date.now() - 10000).toISOString(),
    }
    const result = validateVoteCreation(data)
    expect(result.valid).toBe(false)
    expect(result.errors.deadline).toBeDefined()
  })

  it('should pass when deadline is in the future', () => {
    const data = {
      title: '测试',
      type: VOTE_TYPES.SINGLE,
      options: [{ text: '选项1' }, { text: '选项2' }],
      deadline: new Date(Date.now() + 86400000).toISOString(),
    }
    const result = validateVoteCreation(data)
    expect(result.valid).toBe(true)
  })
})

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    clear: () => { store.clear() },
  }
}

describe('vote localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadVotes should return empty array when nothing stored', () => {
    expect(loadVotes()).toEqual([])
  })

  it('saveVotes and loadVotes should work correctly', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
    })
    const saved = saveVotes([vote])
    expect(saved).toBe(true)
    const loaded = loadVotes()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(vote.id)
  })

  it('loadVotes should return empty for invalid JSON', () => {
    mockStorage.setItem('voting_app_votes', 'not-json')
    expect(loadVotes()).toEqual([])
  })

  it('loadVotes should return empty for non-array data', () => {
    mockStorage.setItem('voting_app_votes', JSON.stringify({ foo: 'bar' }))
    expect(loadVotes()).toEqual([])
  })

  it('should handle localStorage throws gracefully', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => { throw new Error('fail') },
        setItem: () => { throw new Error('fail') },
        removeItem: () => { throw new Error('fail') },
      },
    })
    expect(loadVotes()).toEqual([])
    expect(saveVotes([])).toBe(false)
  })
})

describe('vote CRUD operations', () => {
  let vote1, vote2

  beforeEach(() => {
    vote1 = createVote({ title: '投票1', options: ['a', 'b'] })
    vote2 = createVote({ title: '投票2', options: ['c', 'd'] })
  })

  it('getVoteById should find vote by id', () => {
    const votes = [vote1, vote2]
    expect(getVoteById(votes, vote1.id)?.id).toBe(vote1.id)
    expect(getVoteById(votes, vote2.id)?.title).toBe('投票2')
  })

  it('getVoteById should return null for non-existent id', () => {
    expect(getVoteById([vote1], 'nonexistent')).toBe(null)
    expect(getVoteById(null, 'x')).toBe(null)
    expect(getVoteById([], 'x')).toBe(null)
  })

  it('addVote should add vote to array', () => {
    let votes = []
    votes = addVote(votes, vote1)
    expect(votes).toHaveLength(1)
    votes = addVote(votes, vote2)
    expect(votes).toHaveLength(2)
  })

  it('addVote should handle non-array input', () => {
    const result = addVote(null, vote1)
    expect(result).toHaveLength(1)
  })

  it('updateVote should update vote by id', () => {
    const votes = [vote1]
    const updated = updateVote(votes, vote1.id, { title: '新标题' })
    expect(updated[0].title).toBe('新标题')
  })

  it('updateVote should handle invalid inputs', () => {
    expect(updateVote(null, 'x', {})).toBe(null)
    expect(updateVote([], 'x', {})).toEqual([])
  })

  it('deleteVote should remove vote by id', () => {
    const votes = [vote1, vote2]
    const result = deleteVote(votes, vote1.id)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(vote2.id)
  })

  it('deleteVote should handle invalid inputs', () => {
    expect(deleteVote(null, 'x')).toBe(null)
    expect(deleteVote([], 'x')).toEqual([])
  })
})

describe('user vote tracking', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('hasUserVoted should return false initially', () => {
    expect(hasUserVoted('vote1')).toBe(false)
  })

  it('recordUserVote and hasUserVoted should work correctly', () => {
    const recorded = recordUserVote('vote1', ['opt1', 'opt2'])
    expect(recorded).toBe(true)
    expect(hasUserVoted('vote1')).toBe(true)
    expect(hasUserVoted('vote2')).toBe(false)
  })

  it('getUserVotedOptions should return voted options', () => {
    recordUserVote('vote1', ['opt1', 'opt2'])
    const options = getUserVotedOptions('vote1')
    expect(options).toEqual(['opt1', 'opt2'])
  })

  it('getUserVotedOptions should return empty array for non-voted', () => {
    expect(getUserVotedOptions('nonexistent')).toEqual([])
  })

  it('recordUserVote should accept single option id', () => {
    recordUserVote('vote1', 'opt1')
    const options = getUserVotedOptions('vote1')
    expect(options).toEqual(['opt1'])
  })

  it('should handle localStorage throws gracefully', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => { throw new Error('fail') },
        setItem: () => { throw new Error('fail') },
        removeItem: () => { throw new Error('fail') },
      },
    })
    expect(hasUserVoted('x')).toBe(false)
    expect(getUserVotedOptions('x')).toEqual([])
    expect(recordUserVote('x', [])).toBe(false)
  })
})

describe('submitVote', () => {
  let vote

  beforeEach(() => {
    vote = createVote({
      title: '测试投票',
      type: VOTE_TYPES.SINGLE,
      options: ['选项A', '选项B', '选项C'],
    })
  })

  it('should increment vote count for selected option', () => {
    const optId = vote.options[0].id
    const result = submitVote(vote, optId)
    expect(result.options[0].votes).toBe(1)
    expect(result.options[1].votes).toBe(0)
    expect(result.totalVotes).toBe(1)
  })

  it('should handle array with single option id', () => {
    const optIds = [vote.options[0].id]
    const result = submitVote(vote, optIds)
    expect(result.options[0].votes).toBe(1)
    expect(result.options[1].votes).toBe(0)
    expect(result.totalVotes).toBe(1)
  })

  it('should not vote for single type with multiple options', () => {
    const optIds = [vote.options[0].id, vote.options[1].id]
    const result = submitVote(vote, optIds)
    expect(result.totalVotes).toBe(0)
    expect(result.options[0].votes).toBe(0)
  })

  it('should work for multiple type with multiple options', () => {
    const multiVote = { ...vote, type: VOTE_TYPES.MULTIPLE }
    const optIds = [vote.options[0].id, vote.options[1].id]
    const result = submitVote(multiVote, optIds)
    expect(result.options[0].votes).toBe(1)
    expect(result.options[1].votes).toBe(1)
    expect(result.totalVotes).toBe(1)
  })

  it('should return vote unchanged when no options selected', () => {
    const result = submitVote(vote, [])
    expect(result).toBe(vote)
  })

  it('should return vote unchanged for null vote', () => {
    expect(submitVote(null, ['opt1'])).toBe(null)
  })
})

describe('calculatePercentages', () => {
  it('should return zero percentages when no votes', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
    })
    const result = calculatePercentages(vote)
    expect(result[0].percentage).toBe(0)
    expect(result[1].percentage).toBe(0)
  })

  it('should calculate correct percentages', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b', 'c'],
    })
    vote.options[0].votes = 5
    vote.options[1].votes = 3
    vote.options[2].votes = 2
    vote.totalVotes = 10

    const result = calculatePercentages(vote)
    expect(result[0].percentage).toBe(50)
    expect(result[1].percentage).toBe(30)
    expect(result[2].percentage).toBe(20)
  })

  it('should handle null vote', () => {
    expect(calculatePercentages(null)).toEqual([])
  })
})

describe('isVoteEnded', () => {
  it('should return false for vote without deadline', () => {
    const vote = createVote({ title: '测试', options: ['a', 'b'] })
    expect(isVoteEnded(vote)).toBe(false)
  })

  it('should return false for vote with future deadline', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(isVoteEnded(vote)).toBe(false)
  })

  it('should return true for vote with past deadline', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline: new Date(Date.now() - 10000).toISOString(),
    })
    expect(isVoteEnded(vote)).toBe(true)
  })

  it('should return false for null vote', () => {
    expect(isVoteEnded(null)).toBe(false)
  })
})

describe('getVoteStatus', () => {
  it('should return active for ongoing vote', () => {
    const vote = createVote({ title: '测试', options: ['a', 'b'] })
    expect(getVoteStatus(vote)).toBe(VOTE_STATUS.ACTIVE)
  })

  it('should return ended for expired vote', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline: new Date(Date.now() - 10000).toISOString(),
    })
    expect(getVoteStatus(vote)).toBe(VOTE_STATUS.ENDED)
  })

  it('should return null for null vote', () => {
    expect(getVoteStatus(null)).toBe(null)
  })
})

describe('getRemainingTime', () => {
  it('should return null for vote without deadline', () => {
    const vote = createVote({ title: '测试', options: ['a', 'b'] })
    expect(getRemainingTime(vote)).toBe(null)
  })

  it('should return remaining time for future deadline', () => {
    const deadline = new Date(Date.now() + 86400000 + 3600000 + 120000 + 5000).toISOString()
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline,
    })
    const result = getRemainingTime(vote)
    expect(result).not.toBe(null)
    expect(result.days).toBe(1)
    expect(result.hours).toBe(1)
    expect(result.minutes).toBe(2)
    expect(result.seconds).toBeGreaterThanOrEqual(4)
    expect(result.isEnded).toBe(false)
  })

  it('should return zero for expired deadline', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline: new Date(Date.now() - 10000).toISOString(),
    })
    const result = getRemainingTime(vote)
    expect(result.isEnded).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('should return null for null vote', () => {
    expect(getRemainingTime(null)).toBe(null)
  })
})

describe('getTimeWarningLevel', () => {
  it('should return normal for vote without deadline', () => {
    const vote = createVote({ title: '测试', options: ['a', 'b'] })
    expect(getTimeWarningLevel(vote)).toBe('normal')
  })

  it('should return normal for vote with far future deadline', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(getTimeWarningLevel(vote)).toBe('normal')
  })

  it('should return warning for last hour', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
    expect(getTimeWarningLevel(vote)).toBe('warning')
  })

  it('should return critical for last 10 minutes', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
    expect(getTimeWarningLevel(vote)).toBe('critical')
  })

  it('should return ended for expired vote', () => {
    const vote = createVote({
      title: '测试',
      options: ['a', 'b'],
      deadline: new Date(Date.now() - 1000).toISOString(),
    })
    expect(getTimeWarningLevel(vote)).toBe('ended')
  })
})

describe('filterVotesByStatus', () => {
  let activeVote, endedVote

  beforeEach(() => {
    activeVote = createVote({ title: '进行中', options: ['a', 'b'] })
    endedVote = createVote({
      title: '已结束',
      options: ['c', 'd'],
      deadline: new Date(Date.now() - 10000).toISOString(),
    })
  })

  it('should return all votes for "all" filter', () => {
    const votes = [activeVote, endedVote]
    const result = filterVotesByStatus(votes, 'all')
    expect(result).toHaveLength(2)
  })

  it('should filter active votes', () => {
    const votes = [activeVote, endedVote]
    const result = filterVotesByStatus(votes, VOTE_STATUS.ACTIVE)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('进行中')
  })

  it('should filter ended votes', () => {
    const votes = [activeVote, endedVote]
    const result = filterVotesByStatus(votes, VOTE_STATUS.ENDED)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('已结束')
  })

  it('should return empty array for null input', () => {
    expect(filterVotesByStatus(null, 'all')).toEqual([])
  })
})

describe('sortVotesByCreatedAt', () => {
  it('should sort votes by createdAt descending by default', () => {
    const vote1 = { ...createVote({ title: '旧的', options: ['a', 'b'] }), createdAt: 1000 }
    const vote2 = { ...createVote({ title: '新的', options: ['c', 'd'] }), createdAt: 2000 }
    const votes = [vote1, vote2]
    const sorted = sortVotesByCreatedAt(votes)
    expect(sorted[0].title).toBe('新的')
    expect(sorted[1].title).toBe('旧的')
  })

  it('should sort ascending when specified', () => {
    const vote1 = { ...createVote({ title: '旧的', options: ['a', 'b'] }), createdAt: 1000 }
    const vote2 = { ...createVote({ title: '新的', options: ['c', 'd'] }), createdAt: 2000 }
    const votes = [vote1, vote2]
    const sorted = sortVotesByCreatedAt(votes, false)
    expect(sorted[0].title).toBe('旧的')
    expect(sorted[1].title).toBe('新的')
  })

  it('should not mutate original array', () => {
    const vote1 = { ...createVote({ title: '1', options: ['a'] }), createdAt: 1000 }
    const vote2 = { ...createVote({ title: '2', options: ['b'] }), createdAt: 2000 }
    const votes = [vote1, vote2]
    const sorted = sortVotesByCreatedAt(votes)
    expect(votes[0].title).toBe('1')
    expect(sorted[0].title).toBe('2')
  })

  it('should return empty array for null input', () => {
    expect(sortVotesByCreatedAt(null)).toEqual([])
  })
})

describe('getRandomOption', () => {
  it('should return an option from the vote', () => {
    const vote = createVote({
      title: '测试',
      options: ['选项A', '选项B', '选项C'],
    })
    const option = getRandomOption(vote)
    expect(option).not.toBe(null)
    expect(vote.options.some((o) => o.id === option.id)).toBe(true)
  })

  it('should return null for null vote', () => {
    expect(getRandomOption(null)).toBe(null)
  })

  it('should return null for vote with no options', () => {
    const vote = createVote({ title: '测试', options: [] })
    expect(getRandomOption(vote)).toBe(null)
  })
})

describe('getRandomInterval', () => {
  it('should return value in milliseconds', () => {
    const interval = getRandomInterval(3, 8)
    expect(interval).toBeGreaterThanOrEqual(3000)
    expect(interval).toBeLessThanOrEqual(8000)
    expect(interval % 1000).toBe(0)
  })

  it('should handle min > max by using min', () => {
    const interval = getRandomInterval(8, 3)
    expect(interval).toBe(8000)
  })

  it('should ensure minimum of 1 second', () => {
    const interval = getRandomInterval(-5, 0)
    expect(interval).toBeGreaterThanOrEqual(1000)
  })
})

describe('generateShareUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:5173',
        pathname: '/',
        hash: '#/voting-app',
      },
    })
  })

  it('should generate share url with vote id', () => {
    const url = generateShareUrl('vote_abc123')
    expect(url).toContain('vote_abc123')
    expect(url).toContain('vote=')
  })

  it('should return empty string for empty id', () => {
    expect(generateShareUrl('')).toBe('')
    expect(generateShareUrl(null)).toBe('')
  })

  it('should preserve current hash path when present', () => {
    const url = generateShareUrl('vote_test')
    expect(url).toBe('http://localhost:5173/#/voting-app?vote=vote_test')
  })

  it('should extract path from current location when hash is empty but pathname has content', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'https://example.com',
        pathname: '/app/',
        hash: '',
      },
    })
    const url = generateShareUrl('vote_xyz')
    expect(url).toContain('https://example.com/app/')
    expect(url).toContain('vote=vote_xyz')
    expect(url).toContain('#')
  })

  it('should return empty string when hash is empty and pathname is root', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:5173',
        pathname: '/',
        hash: '',
      },
    })
    const url = generateShareUrl('vote_test')
    expect(url).toBe('')
  })

  it('should return empty string when hash is only # and pathname is root', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:5173',
        pathname: '/',
        hash: '#',
      },
    })
    const url = generateShareUrl('vote_test')
    expect(url).toBe('')
  })

  it('should handle hash with existing query params', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:5173',
        pathname: '/',
        hash: '#/voting-app?foo=bar',
      },
    })
    const url = generateShareUrl('vote_abc')
    expect(url).toContain('#/voting-app?')
    expect(url).toContain('vote=vote_abc')
    expect(url).toContain('foo=bar')
  })
})

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', undefined)
    vi.stubGlobal('document', undefined)
  })

  it('should return false when window is undefined', async () => {
    const originalWindow = globalThis.window
    delete globalThis.window
    const result = await copyToClipboard('test')
    globalThis.window = originalWindow
    expect(result).toBe(false)
  })

  it('should return true when navigator.clipboard.writeText succeeds', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    })
    vi.stubGlobal('document', undefined)
    const result = await copyToClipboard('hello world')
    expect(mockWriteText).toHaveBeenCalledWith('hello world')
    expect(result).toBe(true)
  })

  it('should fall back to execCommand when clipboard API fails', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('fail'))
    const mockExecCommand = vi.fn().mockReturnValue(true)
    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()
    const mockSelect = vi.fn()

    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    })
    vi.stubGlobal('document', {
      createElement: () => ({
        value: '',
        style: {},
        select: mockSelect,
      }),
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
      execCommand: mockExecCommand,
    })

    const result = await copyToClipboard('fallback test')
    expect(mockWriteText).toHaveBeenCalled()
    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(result).toBe(true)
  })

  it('should return false when both methods fail', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('fail'))
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    })
    vi.stubGlobal('document', {
      createElement: () => { throw new Error('fail') },
    })

    const result = await copyToClipboard('test')
    expect(result).toBe(false)
  })

  it('should use execCommand fallback when clipboard API is unavailable', async () => {
    const mockExecCommand = vi.fn().mockReturnValue(true)
    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()
    const mockSelect = vi.fn()
    const mockTextarea = {
      value: '',
      style: {},
      select: mockSelect,
    }

    vi.stubGlobal('navigator', {})
    vi.stubGlobal('document', {
      createElement: () => mockTextarea,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
      execCommand: mockExecCommand,
    })

    const result = await copyToClipboard('no clipboard api')
    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(result).toBe(true)
  })
})

describe('getUrlVoteParam', () => {
  it('should return null when window is undefined', () => {
    const originalWindow = globalThis.window
    delete globalThis.window
    const result = getUrlVoteParam()
    globalThis.window = originalWindow
    expect(result).toBe(null)
  })

  it('should extract vote param from URL search', () => {
    vi.stubGlobal('window', {
      location: {
        search: '?vote=vote_search_123',
        hash: '',
      },
    })
    expect(getUrlVoteParam()).toBe('vote_search_123')
  })

  it('should extract vote param from hash when search is empty', () => {
    vi.stubGlobal('window', {
      location: {
        search: '',
        hash: '#/voting-app?vote=vote_hash_456',
      },
    })
    expect(getUrlVoteParam()).toBe('vote_hash_456')
  })

  it('should prefer search param over hash param', () => {
    vi.stubGlobal('window', {
      location: {
        search: '?vote=vote_from_search',
        hash: '#/voting-app?vote=vote_from_hash',
      },
    })
    expect(getUrlVoteParam()).toBe('vote_from_search')
  })

  it('should return null when no vote param exists', () => {
    vi.stubGlobal('window', {
      location: {
        search: '?other=value',
        hash: '#/voting-app',
      },
    })
    expect(getUrlVoteParam()).toBe(null)
  })

  it('should handle hash without query string', () => {
    vi.stubGlobal('window', {
      location: {
        search: '',
        hash: '#/voting-app',
      },
    })
    expect(getUrlVoteParam()).toBe(null)
  })

  it('should handle empty search and hash', () => {
    vi.stubGlobal('window', {
      location: {
        search: '',
        hash: '',
      },
    })
    expect(getUrlVoteParam()).toBe(null)
  })
})

describe('formatDate', () => {
  it('should format timestamp to readable date', () => {
    const timestamp = new Date('2025-01-15T10:30:00').getTime()
    const formatted = formatDate(timestamp)
    expect(formatted).toContain('2025')
    expect(formatted).toContain('01')
    expect(formatted).toContain('15')
    expect(formatted).toContain('10:30')
  })

  it('should return empty string for falsy input', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(0)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
})

describe('formatDateTimeLocal', () => {
  it('should format timestamp to datetime-local format', () => {
    const timestamp = new Date('2025-06-15T14:30:00').getTime()
    const formatted = formatDateTimeLocal(timestamp)
    expect(formatted).toBe('2025-06-15T14:30')
  })

  it('should pad single digit month, day, hour, minute with zero', () => {
    const timestamp = new Date('2025-01-05T09:05:00').getTime()
    const formatted = formatDateTimeLocal(timestamp)
    expect(formatted).toBe('2025-01-05T09:05')
  })

  it('should return empty string for falsy input', () => {
    expect(formatDateTimeLocal(null)).toBe('')
    expect(formatDateTimeLocal(0)).toBe('')
    expect(formatDateTimeLocal(undefined)).toBe('')
  })
})

describe('simulateViewerCount', () => {
  it('should return a number', () => {
    const count = simulateViewerCount(5)
    expect(typeof count).toBe('number')
    expect(Number.isInteger(count)).toBe(true)
  })

  it('should always be at least 1', () => {
    for (let i = 0; i < 100; i += 1) {
      expect(simulateViewerCount(1)).toBeGreaterThanOrEqual(1)
    }
  })

  it('should vary around the base count', () => {
    const counts = new Set()
    for (let i = 0; i < 50; i += 1) {
      counts.add(simulateViewerCount(10))
    }
    expect(counts.size).toBeGreaterThan(1)
  })
})
