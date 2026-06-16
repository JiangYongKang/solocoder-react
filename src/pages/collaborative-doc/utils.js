import { STORAGE_KEY, getDefaultData, COLLABORATOR_COLORS, CURRENT_USER, REVISION_TYPE } from './constants.js'

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatDate(timestamp) {
  if (timestamp == null || Number.isNaN(timestamp)) return '-'
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function loadData(storage) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return getDefaultData()
  try {
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = getDefaultData()
      saveData(defaults, s)
      return defaults
    }
    const parsed = JSON.parse(raw)
    if (!parsed.paragraphs || !Array.isArray(parsed.paragraphs)) {
      return getDefaultData()
    }
    return parsed
  } catch {
    return getDefaultData()
  }
}

export function saveData(data, storage) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return false
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function getCollaboratorById(data, userId) {
  if (userId === CURRENT_USER.id) {
    return { ...CURRENT_USER, color: COLLABORATOR_COLORS[0] }
  }
  const idx = data.collaborators.findIndex((c) => c.id === userId)
  const collab = data.collaborators.find((c) => c.id === userId)
  if (!collab) return null
  return { ...collab, color: COLLABORATOR_COLORS[(idx + 1) % COLLABORATOR_COLORS.length] }
}

export function getOnlineCollaborators(data) {
  return data.collaborators.filter((c) => c.online)
}

export function getOnlineCount(data) {
  return getOnlineCollaborators(data).length
}

export function setCollaboratorOnline(data, userId, online) {
  const collaborators = data.collaborators.map((c) =>
    c.id === userId
      ? { ...c, online, status: online ? c.status || '正在查看文档' : '离线' }
      : c
  )
  let cursors = data.cursors
  if (online) {
    if (!cursors.find((cur) => cur.userId === userId)) {
      cursors = [
        ...cursors,
        {
          userId,
          paragraphId: data.paragraphs[0]?.id || null,
          offset: 0,
        },
      ]
    }
  } else {
    cursors = cursors.filter((cur) => cur.userId !== userId)
  }
  const notifications = online
    ? [
        ...data.notifications,
        {
          id: generateId('notif'),
          type: 'join',
          userId,
          createdAt: Date.now(),
        },
      ]
    : data.notifications
  return { ...data, collaborators, cursors, notifications }
}

export function updateCursorPosition(data, userId, paragraphId, offset) {
  const cursors = data.cursors.map((cur) =>
    cur.userId === userId ? { ...cur, paragraphId, offset } : cur
  )
  return { ...data, cursors }
}

export function getCursorByUser(data, userId) {
  return data.cursors.find((cur) => cur.userId === userId) || null
}

export function moveRandomCursor(data, userId) {
  const availableParagraphs = data.paragraphs.filter((p) => !p.lockedBy || p.lockedBy === userId)
  if (availableParagraphs.length === 0) return data
  const paragraph = availableParagraphs[Math.floor(Math.random() * availableParagraphs.length)]
  const offset = Math.floor(Math.random() * Math.max(1, paragraph.content.length))
  const collaborators = data.collaborators.map((c) => {
    if (c.id === userId) {
      const paraIdx = data.paragraphs.findIndex((p) => p.id === paragraph.id)
      return { ...c, status: `正在编辑第 ${paraIdx + 1} 段` }
    }
    return c
  })
  return { ...updateCursorPosition(data, userId, paragraph.id, offset), collaborators }
}

export function getParagraphById(data, paragraphId) {
  return data.paragraphs.find((p) => p.id === paragraphId) || null
}

export function isParagraphLocked(data, paragraphId) {
  const para = getParagraphById(data, paragraphId)
  return !!para?.lockedBy
}

export function canEditParagraph(data, paragraphId, userId) {
  const para = getParagraphById(data, paragraphId)
  if (!para) return false
  if (!para.lockedBy) return true
  return para.lockedBy === userId
}

export function getParagraphLocker(data, paragraphId) {
  const para = getParagraphById(data, paragraphId)
  if (!para?.lockedBy) return null
  return getCollaboratorById(data, para.lockedBy)
}

export function lockParagraph(data, paragraphId, userId) {
  const para = getParagraphById(data, paragraphId)
  if (!para) return data
  if (para.lockedBy && para.lockedBy !== userId) return data
  const paragraphs = data.paragraphs.map((p) =>
    p.id === paragraphId ? { ...p, lockedBy: userId } : p
  )
  return { ...data, paragraphs }
}

export function unlockParagraph(data, paragraphId, userId) {
  const para = getParagraphById(data, paragraphId)
  if (!para) return data
  if (para.lockedBy !== userId) return data
  const paragraphs = data.paragraphs.map((p) =>
    p.id === paragraphId ? { ...p, lockedBy: null } : p
  )
  return { ...data, paragraphs }
}

export function toggleParagraphLock(data, paragraphId, userId) {
  const para = getParagraphById(data, paragraphId)
  if (!para) return data
  if (para.lockedBy) {
    return unlockParagraph(data, paragraphId, userId)
  }
  return lockParagraph(data, paragraphId, userId)
}

export function lockAllMyParagraphs(data, userId) {
  const paragraphs = data.paragraphs.map((p) => {
    if (p.modifiedBy === userId && !p.lockedBy) {
      return { ...p, lockedBy: userId }
    }
    return p
  })
  return { ...data, paragraphs }
}

export function getMyModifiedParagraphs(data, userId) {
  return data.paragraphs.filter((p) => p.modifiedBy === userId)
}

export function updateParagraphContent(data, paragraphId, content, userId) {
  if (!canEditParagraph(data, paragraphId, userId)) return data
  const paragraphs = data.paragraphs.map((p) =>
    p.id === paragraphId ? { ...p, content, modifiedBy: userId } : p
  )
  return { ...data, paragraphs }
}

export function addRevision(data, paragraphId, type, text, start, end, userId) {
  const revision = {
    id: generateId('rev'),
    paragraphId,
    type,
    text,
    start,
    end,
    userId,
    createdAt: Date.now(),
    accepted: false,
    rejected: false,
  }
  return { ...data, revisions: [...data.revisions, revision] }
}

export function getRevisionsByParagraph(data, paragraphId) {
  return data.revisions.filter(
    (r) => r.paragraphId === paragraphId && !r.accepted && !r.rejected
  )
}

export function acceptRevision(data, revisionId) {
  const revisions = data.revisions.map((r) =>
    r.id === revisionId ? { ...r, accepted: true } : r
  )
  return { ...data, revisions }
}

export function rejectRevision(data, revisionId) {
  const revisions = data.revisions.map((r) =>
    r.id === revisionId ? { ...r, rejected: true } : r
  )
  return { ...data, revisions }
}

export function acceptAllRevisions(data) {
  const revisions = data.revisions.map((r) => ({ ...r, accepted: true }))
  return { ...data, revisions }
}

export function rejectAllRevisions(data) {
  const revisions = data.revisions.map((r) => ({ ...r, rejected: true }))
  return { ...data, revisions }
}

export function getPendingRevisions(data) {
  return data.revisions.filter((r) => !r.accepted && !r.rejected)
}

export function createVersion(data, title) {
  const now = Date.now()
  const newVersion = {
    id: generateId('v'),
    version: (data.versions?.length || 0) + 1,
    title: title || `版本 ${(data.versions?.length || 0) + 1}`,
    paragraphs: JSON.parse(JSON.stringify(data.paragraphs)),
    createdAt: now,
  }
  return { ...data, versions: [...(data.versions || []), newVersion] }
}

export function getVersionById(data, versionId) {
  return data.versions?.find((v) => v.id === versionId) || null
}

export function restoreToVersion(data, versionId) {
  const version = getVersionById(data, versionId)
  if (!version) return data
  const paragraphs = JSON.parse(JSON.stringify(version.paragraphs))
  return { ...data, paragraphs }
}

export function getSortedVersions(data) {
  return [...(data.versions || [])].sort((a, b) => b.createdAt - a.createdAt)
}

export function computeParagraphDiff(oldPara, newPara) {
  const oldText = oldPara?.content || ''
  const newText = newPara?.content || ''
  if (oldText === newText) {
    return { segments: [{ type: 'equal', value: oldText }] }
  }
  const segments = []
  const maxLen = Math.max(oldText.length, newText.length)
  let i = 0
  while (i < maxLen) {
    if (i >= oldText.length) {
      segments.push({ type: 'added', value: newText.slice(i) })
      break
    }
    if (i >= newText.length) {
      segments.push({ type: 'removed', value: oldText.slice(i) })
      break
    }
    if (oldText[i] === newText[i]) {
      let j = i
      while (j < maxLen && oldText[j] === newText[j]) {
        j++
      }
      segments.push({ type: 'equal', value: oldText.slice(i, j) })
      i = j
    } else {
      let j = i
      let foundMatch = false
      while (j < Math.min(oldText.length, newText.length) + 5) {
        if (oldText.slice(i, j + 1) === newText.slice(i, j + 1)) {
          j++
          continue
        }
        const nextOldMatch = newText.indexOf(oldText[j], i)
        const nextNewMatch = oldText.indexOf(newText[j], i)
        if (nextOldMatch !== -1 && (nextNewMatch === -1 || nextOldMatch <= nextNewMatch)) {
          segments.push({ type: 'added', value: newText.slice(i, nextOldMatch) })
          i = nextOldMatch
          foundMatch = true
          break
        } else if (nextNewMatch !== -1) {
          segments.push({ type: 'removed', value: oldText.slice(i, nextNewMatch) })
          i = nextNewMatch
          foundMatch = true
          break
        }
        j++
      }
      if (!foundMatch) {
        if (oldText.length > newText.length) {
          segments.push({ type: 'removed', value: oldText.slice(i) })
        } else if (newText.length > oldText.length) {
          segments.push({ type: 'added', value: newText.slice(i) })
        } else {
          segments.push({ type: 'modified', oldValue: oldText.slice(i), newValue: newText.slice(i) })
        }
        break
      }
    }
  }
  return { segments }
}

export function computeVersionDiff(oldVersion, newVersion) {
  const oldParas = oldVersion?.paragraphs || []
  const newParas = newVersion?.paragraphs || []
  const maxLen = Math.max(oldParas.length, newParas.length)
  const paragraphDiffs = []
  for (let i = 0; i < maxLen; i++) {
    const oldPara = oldParas[i]
    const newPara = newParas[i]
    if (!oldPara && newPara) {
      paragraphDiffs.push({ paragraphId: newPara.id, type: 'added', diff: computeParagraphDiff(null, newPara) })
    } else if (oldPara && !newPara) {
      paragraphDiffs.push({ paragraphId: oldPara.id, type: 'removed', diff: computeParagraphDiff(oldPara, null) })
    } else if (oldPara.content === newPara.content) {
      paragraphDiffs.push({ paragraphId: oldPara.id, type: 'equal', diff: computeParagraphDiff(oldPara, newPara) })
    } else {
      paragraphDiffs.push({ paragraphId: oldPara.id, type: 'modified', diff: computeParagraphDiff(oldPara, newPara) })
    }
  }
  return paragraphDiffs
}

export function createComment(data, paragraphId, text, content, userId) {
  const comment = {
    id: generateId('c'),
    paragraphId,
    text,
    authorId: userId,
    content,
    createdAt: Date.now(),
    resolved: false,
    replies: [],
  }
  return { ...data, comments: [...data.comments, comment] }
}

export function replyToComment(data, commentId, content, userId) {
  const reply = {
    id: generateId('r'),
    authorId: userId,
    content,
    createdAt: Date.now(),
  }
  const comments = data.comments.map((c) =>
    c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
  )
  return { ...data, comments }
}

export function resolveComment(data, commentId) {
  const comments = data.comments.map((c) =>
    c.id === commentId ? { ...c, resolved: true } : c
  )
  return { ...data, comments }
}

export function unresolveComment(data, commentId) {
  const comments = data.comments.map((c) =>
    c.id === commentId ? { ...c, resolved: false } : c
  )
  return { ...data, comments }
}

export function toggleCommentResolved(data, commentId) {
  const comment = data.comments.find((c) => c.id === commentId)
  if (!comment) return data
  if (comment.resolved) {
    return unresolveComment(data, commentId)
  }
  return resolveComment(data, commentId)
}

export function getCommentsByParagraph(data, paragraphId) {
  return data.comments.filter((c) => c.paragraphId === paragraphId)
}

export function getSortedComments(data) {
  const paraOrder = data.paragraphs.map((p) => p.id)
  return [...data.comments].sort((a, b) => {
    const aIdx = paraOrder.indexOf(a.paragraphId)
    const bIdx = paraOrder.indexOf(b.paragraphId)
    if (aIdx !== bIdx) return aIdx - bIdx
    return a.createdAt - b.createdAt
  })
}

export function getUnresolvedComments(data) {
  return data.comments.filter((c) => !c.resolved)
}

export function getCommentAuthor(data, comment) {
  return getCollaboratorById(data, comment.authorId)
}

export function getReplyAuthor(data, reply) {
  return getCollaboratorById(data, reply.authorId)
}

export function toggleRevisionMode(data) {
  return { ...data, revisionMode: !data.revisionMode }
}

export function setRevisionMode(data, enabled) {
  return { ...data, revisionMode: enabled }
}

export function updateTitle(data, title) {
  return { ...data, title }
}

export function clearNotifications(data) {
  return { ...data, notifications: [] }
}

export function removeNotification(data, notificationId) {
  return { ...data, notifications: data.notifications.filter((n) => n.id !== notificationId) }
}

export function getNotificationMessage(data, notification) {
  const collab = getCollaboratorById(data, notification.userId)
  if (!collab) return ''
  if (notification.type === 'join') {
    return `${collab.name} 加入了文档`
  }
  if (notification.type === 'leave') {
    return `${collab.name} 离开了文档`
  }
  return ''
}

export function simulateCollaboratorEdit(data, userId) {
  const availableParagraphs = data.paragraphs.filter((p) => canEditParagraph(data, p.id, userId))
  if (availableParagraphs.length === 0) return data
  const paragraph = availableParagraphs[Math.floor(Math.random() * availableParagraphs.length)]
  const insertions = ['非常重要', '值得注意', '请查看', '建议补充', '已确认']
  const randomText = insertions[Math.floor(Math.random() * insertions.length)]
  const position = Math.floor(Math.random() * paragraph.content.length)
  let newContent
  if (Math.random() > 0.5 && paragraph.content.length > 5) {
    const delStart = Math.max(0, position - 3)
    const delEnd = Math.min(paragraph.content.length, position + 3)
    newContent = paragraph.content.slice(0, delStart) + paragraph.content.slice(delEnd)
  } else {
    newContent = paragraph.content.slice(0, position) + randomText + paragraph.content.slice(position)
  }
  return updateParagraphContent(data, paragraph.id, newContent, userId)
}
