import {
  STORAGE_KEY,
  PAGE_SIZE,
  RELEASE_STATUS,
  APPROVAL_ACTION,
  CURRENT_USER,
  MOCK_RELEASES,
} from './constants.js'

export const DIFF_TYPE_INTERNAL = {
  EQUAL: 'equal',
  ADDED: 'added',
  REMOVED: 'removed',
  MODIFIED: 'modified',
}

export function generateId(prefix = 'rel') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function loadReleases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  return [...MOCK_RELEASES]
}

export function saveReleases(releases) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(releases))
    return true
  } catch {
    return false
  }
}

export function isValidSemanticVersion(version) {
  if (typeof version !== 'string') return false
  const trimmed = version.trim().replace(/^v/, '')
  const regex = /^\d+\.\d+\.\d+$/
  return regex.test(trimmed)
}

export function parseSemanticVersion(version) {
  if (!isValidSemanticVersion(version)) return null
  const trimmed = version.trim().replace(/^v/, '')
  const parts = trimmed.split('.').map(Number)
  return { major: parts[0], minor: parts[1], patch: parts[2], raw: version.trim() }
}

export function formatSemanticVersion(major, minor, patch) {
  if (
    !Number.isInteger(major) ||
    !Number.isInteger(minor) ||
    !Number.isInteger(patch) ||
    major < 0 ||
    minor < 0 ||
    patch < 0
  ) {
    return null
  }
  return `v${major}.${minor}.${patch}`
}

export function compareSemanticVersions(a, b) {
  const pa = parseSemanticVersion(a)
  const pb = parseSemanticVersion(b)
  if (!pa && !pb) return 0
  if (!pa) return -1
  if (!pb) return 1
  if (pa.major !== pb.major) return pa.major - pb.major
  if (pa.minor !== pb.minor) return pa.minor - pb.minor
  return pa.patch - pb.patch
}

export function sortReleasesByVersion(releases, desc = true) {
  if (!Array.isArray(releases)) return []
  const order = desc ? -1 : 1
  return [...releases].sort((a, b) => {
    const cmp = compareSemanticVersions(a?.version, b?.version)
    if (cmp !== 0) return cmp * order
    return (b?.createdAt || 0) - (a?.createdAt || 0)
  })
}

export function validateReleaseForm(data, existingReleases = [], excludeId = null) {
  const errors = {}

  if (!data || typeof data !== 'object') {
    return { version: '表单数据无效' }
  }

  if (!data.version || typeof data.version !== 'string' || data.version.trim().length === 0) {
    errors.version = '版本号不能为空'
  } else if (!isValidSemanticVersion(data.version)) {
    errors.version = '版本号格式应为 major.minor.patch，如 v1.2.3 或 1.2.3'
  } else {
    const version = data.version.trim().startsWith('v') ? data.version.trim() : 'v' + data.version.trim()
    const duplicate = existingReleases.find(
      (r) => r.id !== excludeId && (r.version === version || r.version === version.replace(/^v/, ''))
    )
    if (duplicate) {
      errors.version = '该版本号已存在'
    }
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = '发布标题不能为空'
  } else if (data.title.trim().length > 100) {
    errors.title = '发布标题不能超过 100 个字符'
  }

  if (data.releaseDate && typeof data.releaseDate === 'string' && data.releaseDate.trim().length > 0) {
    const d = new Date(data.releaseDate)
    if (Number.isNaN(d.getTime())) {
      errors.releaseDate = '发布日期格式无效'
    }
  }

  return errors
}

export function normalizeVersion(version) {
  if (!version) return ''
  const trimmed = version.trim()
  if (trimmed.startsWith('v')) return trimmed
  return 'v' + trimmed
}

export function createRelease(releases, formData, operator = CURRENT_USER) {
  const errors = validateReleaseForm(formData, releases, null)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  const now = Date.now()
  const newRelease = {
    id: generateId('rel'),
    version: normalizeVersion(formData.version),
    title: formData.title.trim(),
    changelog: formData.changelog ? String(formData.changelog) : '',
    releaseDate: formData.releaseDate ? String(formData.releaseDate) : '',
    publisher: operator?.name || CURRENT_USER.name,
    status: RELEASE_STATUS.DRAFT,
    createdAt: now,
    updatedAt: now,
    approvalRecords: [],
  }

  const updated = [newRelease, ...releases]
  return { success: true, release: newRelease, releases: updated }
}

export function updateRelease(releases, id, formData) {
  const index = releases.findIndex((r) => r.id === id)
  if (index === -1) {
    return { success: false, errors: { id: '版本不存在' } }
  }

  const existing = releases[index]
  if (existing.status !== RELEASE_STATUS.DRAFT) {
    return { success: false, errors: { status: '仅草稿状态可编辑' } }
  }

  const errors = validateReleaseForm(formData, releases, id)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  const updated = [...releases]
  updated[index] = {
    ...existing,
    version: normalizeVersion(formData.version),
    title: formData.title.trim(),
    changelog: formData.changelog ? String(formData.changelog) : '',
    releaseDate: formData.releaseDate ? String(formData.releaseDate) : '',
    updatedAt: Date.now(),
  }

  return { success: true, release: updated[index], releases: updated }
}

export function isReleaseEditable(release) {
  if (!release) return false
  return release.status === RELEASE_STATUS.DRAFT
}

export function getStatusActions(release) {
  if (!release) return []
  const actions = []
  switch (release.status) {
    case RELEASE_STATUS.DRAFT:
      actions.push(APPROVAL_ACTION.SUBMIT)
      break
    case RELEASE_STATUS.PENDING:
      actions.push(APPROVAL_ACTION.APPROVE)
      actions.push(APPROVAL_ACTION.REJECT)
      break
    case RELEASE_STATUS.PUBLISHED:
      actions.push(APPROVAL_ACTION.ROLLBACK)
      break
    default:
      break
  }
  return actions
}

export function getNextStatus(action) {
  const map = {
    [APPROVAL_ACTION.SUBMIT]: RELEASE_STATUS.PENDING,
    [APPROVAL_ACTION.APPROVE]: RELEASE_STATUS.PUBLISHED,
    [APPROVAL_ACTION.REJECT]: RELEASE_STATUS.DRAFT,
    [APPROVAL_ACTION.ROLLBACK]: RELEASE_STATUS.ROLLED_BACK,
  }
  return map[action] || null
}

export function actionRequiresRemark(action) {
  return action === APPROVAL_ACTION.REJECT || action === APPROVAL_ACTION.ROLLBACK
}

export function performApprovalAction(releases, id, action, remark = '', operator = CURRENT_USER) {
  const index = releases.findIndex((r) => r.id === id)
  if (index === -1) {
    return { success: false, error: '版本不存在' }
  }

  const release = releases[index]
  const allowedActions = getStatusActions(release)
  if (!allowedActions.includes(action)) {
    return { success: false, error: '当前状态不允许该操作' }
  }

  if (actionRequiresRemark(action) && (!remark || typeof remark !== 'string' || remark.trim().length === 0)) {
    return {
      success: false,
      error: action === APPROVAL_ACTION.REJECT ? '请填写驳回原因' : '请填写回滚原因',
    }
  }

  const fromStatus = release.status
  const toStatus = getNextStatus(action)
  const now = Date.now()

  const record = {
    id: generateId('ar'),
    action,
    fromStatus,
    toStatus,
    operator: operator?.name || CURRENT_USER.name,
    operatorId: operator?.id || CURRENT_USER.id,
    timestamp: now,
    remark: remark ? remark.trim() : '',
  }

  const updated = [...releases]
  updated[index] = {
    ...release,
    status: toStatus,
    approvalRecords: [...release.approvalRecords, record],
    updatedAt: now,
  }

  return { success: true, release: updated[index], releases: updated, record }
}

export function filterReleasesByStatus(releases, status) {
  if (!Array.isArray(releases)) return []
  if (!status || status === 'all') return releases
  return releases.filter((r) => r.status === status)
}

export function paginateReleases(releases, page, pageSize = PAGE_SIZE) {
  if (!Array.isArray(releases)) {
    return { items: [], total: 0, totalPage: 1, currentPage: 1, pageSize }
  }
  const total = releases.length
  const totalPage = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: releases.slice(start, end),
    total,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function getReleaseList(releases, options = {}) {
  if (!Array.isArray(releases)) {
    return paginateReleases([], 1, options.pageSize)
  }
  let result = [...releases]
  result = filterReleasesByStatus(result, options.status)
  result = sortReleasesByVersion(result, true)
  return paginateReleases(result, options.page || 1, options.pageSize || PAGE_SIZE)
}

export function getReleaseStats(releases) {
  const stats = {
    total: 0,
    draft: 0,
    pending: 0,
    published: 0,
    rolled_back: 0,
  }
  if (!Array.isArray(releases)) return stats
  stats.total = releases.length
  releases.forEach((r) => {
    if (r && r.status && stats[r.status] !== undefined) {
      stats[r.status]++
    }
  })
  return stats
}

export function getApprovalTimeline(release) {
  if (!release || !Array.isArray(release.approvalRecords)) return []
  return [...release.approvalRecords].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

export function splitLines(text) {
  if (typeof text !== 'string') return []
  if (text === '') return []
  return text.split('\n')
}

export function computeLCSMatrix(arr1, arr2) {
  const m = arr1.length
  const n = arr2.length
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  return dp
}

export function computeLineDiff(oldLines, newLines) {
  const oldArr = Array.isArray(oldLines) ? oldLines : splitLines(oldLines)
  const newArr = Array.isArray(newLines) ? newLines : splitLines(newLines)
  const dp = computeLCSMatrix(oldArr, newArr)

  const result = []
  let i = oldArr.length
  let j = newArr.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldArr[i - 1] === newArr[j - 1]) {
      result.unshift({
        type: DIFF_TYPE_INTERNAL.EQUAL,
        oldLine: oldArr[i - 1],
        newLine: newArr[j - 1],
        oldIndex: i - 1,
        newIndex: j - 1,
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: DIFF_TYPE_INTERNAL.ADDED,
        oldLine: null,
        newLine: newArr[j - 1],
        oldIndex: null,
        newIndex: j - 1,
      })
      j--
    } else {
      result.unshift({
        type: DIFF_TYPE_INTERNAL.REMOVED,
        oldLine: oldArr[i - 1],
        newLine: null,
        oldIndex: i - 1,
        newIndex: null,
      })
      i--
    }
  }

  return result
}

export function mergeModifiedLines(lineDiff) {
  if (!Array.isArray(lineDiff)) return []
  const merged = []
  let i = 0

  while (i < lineDiff.length) {
    const current = lineDiff[i]

    if (
      current.type === DIFF_TYPE_INTERNAL.REMOVED &&
      i + 1 < lineDiff.length &&
      lineDiff[i + 1].type === DIFF_TYPE_INTERNAL.ADDED
    ) {
      merged.push({
        type: DIFF_TYPE_INTERNAL.MODIFIED,
        oldLine: current.oldLine,
        newLine: lineDiff[i + 1].newLine,
        oldIndex: current.oldIndex,
        newIndex: lineDiff[i + 1].newIndex,
      })
      i += 2
    } else {
      merged.push(current)
      i++
    }
  }

  return merged
}

export function buildReleaseDiff(oldText, newText) {
  const oldLines = splitLines(oldText)
  const newLines = splitLines(newText)
  const rawDiff = computeLineDiff(oldLines, newLines)
  const lineDiff = mergeModifiedLines(rawDiff)

  const leftRows = []
  const rightRows = []

  let leftLineNum = 1
  let rightLineNum = 1

  lineDiff.forEach((row) => {
    if (row.type === DIFF_TYPE_INTERNAL.EQUAL) {
      leftRows.push({
        lineNum: leftLineNum,
        type: DIFF_TYPE_INTERNAL.EQUAL,
        content: row.oldLine,
      })
      rightRows.push({
        lineNum: rightLineNum,
        type: DIFF_TYPE_INTERNAL.EQUAL,
        content: row.newLine,
      })
      leftLineNum++
      rightLineNum++
    } else if (row.type === DIFF_TYPE_INTERNAL.ADDED) {
      leftRows.push({
        lineNum: null,
        type: DIFF_TYPE_INTERNAL.EQUAL,
        content: '',
        empty: true,
      })
      rightRows.push({
        lineNum: rightLineNum,
        type: DIFF_TYPE_INTERNAL.ADDED,
        content: row.newLine,
      })
      rightLineNum++
    } else if (row.type === DIFF_TYPE_INTERNAL.REMOVED) {
      leftRows.push({
        lineNum: leftLineNum,
        type: DIFF_TYPE_INTERNAL.REMOVED,
        content: row.oldLine,
      })
      rightRows.push({
        lineNum: null,
        type: DIFF_TYPE_INTERNAL.EQUAL,
        content: '',
        empty: true,
      })
      leftLineNum++
    } else if (row.type === DIFF_TYPE_INTERNAL.MODIFIED) {
      leftRows.push({
        lineNum: leftLineNum,
        type: DIFF_TYPE_INTERNAL.MODIFIED,
        content: row.oldLine,
      })
      rightRows.push({
        lineNum: rightLineNum,
        type: DIFF_TYPE_INTERNAL.MODIFIED,
        content: row.newLine,
      })
      leftLineNum++
      rightLineNum++
    }
  })

  return { leftRows, rightRows, lineDiff }
}

export function getDiffStats(lineDiff) {
  let added = 0
  let removed = 0
  let modified = 0
  let equal = 0

  if (!Array.isArray(lineDiff)) return { added, removed, modified, equal }

  lineDiff.forEach((row) => {
    switch (row.type) {
      case DIFF_TYPE_INTERNAL.ADDED:
        added++
        break
      case DIFF_TYPE_INTERNAL.REMOVED:
        removed++
        break
      case DIFF_TYPE_INTERNAL.MODIFIED:
        modified++
        break
      case DIFF_TYPE_INTERNAL.EQUAL:
        equal++
        break
      default:
        break
    }
  })

  return { added, removed, modified, equal }
}

export function formatDate(timestamp) {
  if (timestamp == null || timestamp === '') return ''
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function formatDateOnly(timestamp) {
  if (timestamp == null || timestamp === '') return ''
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getTimelineColor(toStatus, action) {
  if (action === APPROVAL_ACTION.REJECT) return '#ef4444'
  if (toStatus === RELEASE_STATUS.PUBLISHED) return '#10b981'
  if (toStatus === RELEASE_STATUS.ROLLED_BACK) return '#f97316'
  if (toStatus === RELEASE_STATUS.DRAFT && action === APPROVAL_ACTION.REJECT) return '#ef4444'
  return '#6b7280'
}

export function simpleMarkdownToHtml(md) {
  if (typeof md !== 'string' || md.length === 0) return ''
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>')

  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  html = html.replace(/^- (.*)$/gm, '<li>$1</li>')
  html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>')

  html = html.replace(/\n\n/g, '</p><p>')
  html = html.replace(/\n/g, '<br>')
  html = '<p>' + html + '</p>'

  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
  html = html.replace(/<\/ul>\s*<ul>/g, '')

  return html
}
