import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateId,
  formatDate,
  loadData,
  saveData,
  getCollaboratorById,
  getOnlineCollaborators,
  getOnlineCount,
  setCollaboratorOnline,
  updateCursorPosition,
  getCursorByUser,
  moveRandomCursor,
  getParagraphById,
  isParagraphLocked,
  canEditParagraph,
  getParagraphLocker,
  lockParagraph,
  unlockParagraph,
  toggleParagraphLock,
  lockAllMyParagraphs,
  getMyModifiedParagraphs,
  updateParagraphContent,
  addRevision,
  getRevisionsByParagraph,
  acceptRevision,
  rejectRevision,
  acceptAllRevisions,
  rejectAllRevisions,
  getPendingRevisions,
  createVersion,
  getVersionById,
  restoreToVersion,
  getSortedVersions,
  computeParagraphDiff,
  computeVersionDiff,
  createComment,
  replyToComment,
  resolveComment,
  unresolveComment,
  toggleCommentResolved,
  getCommentsByParagraph,
  getSortedComments,
  getUnresolvedComments,
  toggleRevisionMode,
  setRevisionMode,
  updateTitle,
  clearNotifications,
  removeNotification,
  getNotificationMessage,
  simulateCollaboratorEdit,
  detectContentChanges,
  processContentChangeWithRevision,
  addFormatRevision,
  applyFormatToSelection,
  renderContentWithRevisions,
  formatTextWithTags,
  applyFormatToContent,
  FORMAT_TYPE,
} from '../../collaborative-doc/utils.js'
import { STORAGE_KEY, getDefaultData, CURRENT_USER, REVISION_TYPE } from '../../collaborative-doc/constants.js'

describe('基础工具函数', () => {
  describe('generateId', () => {
    it('应该生成带前缀的唯一 ID', () => {
      const id1 = generateId('para')
      const id2 = generateId('comment')
      expect(id1.startsWith('para-')).toBe(true)
      expect(id2.startsWith('comment-')).toBe(true)
      expect(id1).not.toBe(id2)
    })

    it('不传入前缀时应该使用默认前缀', () => {
      const id = generateId()
      expect(id.startsWith('id-')).toBe(true)
    })

    it('连续调用应该生成不同的 ID', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('formatDate', () => {
    it('应该正确格式化时间戳', () => {
      const result = formatDate(1700000000000)
      expect(typeof result).toBe('string')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })

    it('null 或 NaN 应该返回 "-"', () => {
      expect(formatDate(null)).toBe('-')
      expect(formatDate(undefined)).toBe('-')
      expect(formatDate(NaN)).toBe('-')
    })
  })
})

describe('localStorage 持久化', () => {
  let store = {}

  beforeEach(() => {
    store = {}
  })

  describe('saveData', () => {
    it('应该成功保存数据到 localStorage', () => {
      const mockStorage = {
        getItem: vi.fn((key) => (key in store ? store[key] : null)),
        setItem: vi.fn((key, value) => {
          store[key] = String(value)
        }),
      }
      const data = getDefaultData()
      const result = saveData(data, mockStorage)
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(data))
    })

    it('localStorage 抛错时应该返回 false', () => {
      const mockStorage = {
        setItem: vi.fn(() => {
          throw new Error('storage full')
        }),
      }
      expect(saveData({}, mockStorage)).toBe(false)
    })
  })

  describe('loadData', () => {
    it('localStorage 为空时应该返回初始状态', () => {
      const mockStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      }
      const data = loadData(mockStorage)
      const defaults = getDefaultData()
      expect(data.paragraphs.length).toBe(defaults.paragraphs.length)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('应该正确加载已保存的数据', () => {
      const custom = {
        ...getDefaultData(),
        title: '自定义标题',
      }
      const mockStorage = {
        getItem: vi.fn((key) => (key === STORAGE_KEY ? JSON.stringify(custom) : null)),
        setItem: vi.fn(),
      }
      const data = loadData(mockStorage)
      expect(data.title).toBe('自定义标题')
    })

    it('损坏的数据应该回退到初始状态', () => {
      const mockStorage = {
        getItem: vi.fn((key) => (key === STORAGE_KEY ? 'invalid json' : null)),
        setItem: vi.fn(),
      }
      const data = loadData(mockStorage)
      const defaults = getDefaultData()
      expect(data.paragraphs.length).toBe(defaults.paragraphs.length)
    })

    it('缺失必要字段的数据应该回退到初始状态', () => {
      const mockStorage = {
        getItem: vi.fn((key) => (key === STORAGE_KEY ? JSON.stringify({ foo: 'bar' }) : null)),
        setItem: vi.fn(),
      }
      const data = loadData(mockStorage)
      const defaults = getDefaultData()
      expect(data.paragraphs.length).toBe(defaults.paragraphs.length)
    })
  })
})

describe('协作者在线状态管理', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('getCollaboratorById', () => {
    it('应该正确获取协作者信息', () => {
      const collab = getCollaboratorById(testData, 'user-1')
      expect(collab).not.toBeNull()
      expect(collab.name).toBe('张三')
      expect(collab.color).toBeTruthy()
    })

    it('应该正确获取当前用户', () => {
      const user = getCollaboratorById(testData, CURRENT_USER.id)
      expect(user).not.toBeNull()
      expect(user.name).toBe('我')
    })

    it('找不到时应该返回 null', () => {
      expect(getCollaboratorById(testData, 'not-exist')).toBeNull()
    })
  })

  describe('getOnlineCollaborators', () => {
    it('应该返回所有在线协作者', () => {
      const online = getOnlineCollaborators(testData)
      expect(online.length).toBeGreaterThan(0)
      online.forEach((c) => expect(c.online).toBe(true))
    })
  })

  describe('getOnlineCount', () => {
    it('应该返回正确的在线人数', () => {
      const count = getOnlineCount(testData)
      const online = getOnlineCollaborators(testData)
      expect(count).toBe(online.length)
    })
  })

  describe('setCollaboratorOnline', () => {
    it('应该设置协作者上线并添加通知', () => {
      const result = setCollaboratorOnline(testData, 'user-4', true)
      const collab = result.collaborators.find((c) => c.id === 'user-4')
      expect(collab.online).toBe(true)
      expect(result.notifications.length).toBeGreaterThan(testData.notifications.length)
      expect(result.cursors.find((c) => c.userId === 'user-4')).toBeTruthy()
    })

    it('应该设置协作者下线', () => {
      const result = setCollaboratorOnline(testData, 'user-1', false)
      const collab = result.collaborators.find((c) => c.id === 'user-1')
      expect(collab.online).toBe(false)
      expect(collab.status).toBe('离线')
      expect(result.cursors.find((c) => c.userId === 'user-1')).toBeFalsy()
    })
  })

  describe('光标位置管理', () => {
    it('updateCursorPosition 应该更新光标位置', () => {
      const result = updateCursorPosition(testData, 'user-1', 'p-2', 10)
      const cursor = getCursorByUser(result, 'user-1')
      expect(cursor.paragraphId).toBe('p-2')
      expect(cursor.offset).toBe(10)
    })

    it('moveRandomCursor 应该随机移动光标', () => {
      const result = moveRandomCursor(testData, 'user-1')
      const cursor = getCursorByUser(result, 'user-1')
      expect(cursor).not.toBeNull()
      expect(result.paragraphs.find((p) => p.id === cursor.paragraphId)).toBeTruthy()
    })

    it('moveRandomCursor 应该更新协作者状态', () => {
      const result = moveRandomCursor(testData, 'user-1')
      const collab = result.collaborators.find((c) => c.id === 'user-1')
      expect(collab.status).toMatch(/正在编辑第/)
    })
  })
})

describe('段落锁定与权限校验', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('getParagraphById', () => {
    it('应该根据 ID 正确查找段落', () => {
      const para = getParagraphById(testData, testData.paragraphs[0].id)
      expect(para).not.toBeNull()
      expect(para.id).toBe(testData.paragraphs[0].id)
    })

    it('找不到时应该返回 null', () => {
      expect(getParagraphById(testData, 'not-exist')).toBeNull()
    })
  })

  describe('isParagraphLocked', () => {
    it('应该正确判断段落是否锁定', () => {
      expect(isParagraphLocked(testData, 'p-5')).toBe(true)
      expect(isParagraphLocked(testData, 'p-1')).toBe(false)
    })
  })

  describe('canEditParagraph', () => {
    it('未锁定的段落所有人都可以编辑', () => {
      expect(canEditParagraph(testData, 'p-1', 'any-user')).toBe(true)
    })

    it('锁定的段落只有锁定者可以编辑', () => {
      expect(canEditParagraph(testData, 'p-5', 'user-3')).toBe(true)
      expect(canEditParagraph(testData, 'p-5', 'user-1')).toBe(false)
      expect(canEditParagraph(testData, 'p-5', CURRENT_USER.id)).toBe(false)
    })

    it('不存在的段落应该返回 false', () => {
      expect(canEditParagraph(testData, 'not-exist', 'user-1')).toBe(false)
    })
  })

  describe('getParagraphLocker', () => {
    it('应该正确获取锁定者信息', () => {
      const locker = getParagraphLocker(testData, 'p-5')
      expect(locker).not.toBeNull()
      expect(locker.name).toBe('王五')
    })

    it('未锁定的段落应该返回 null', () => {
      expect(getParagraphLocker(testData, 'p-1')).toBeNull()
    })
  })

  describe('lockParagraph', () => {
    it('应该锁定未锁定的段落', () => {
      const result = lockParagraph(testData, 'p-1', CURRENT_USER.id)
      const para = getParagraphById(result, 'p-1')
      expect(para.lockedBy).toBe(CURRENT_USER.id)
    })

    it('不应该覆盖他人的锁定', () => {
      const result = lockParagraph(testData, 'p-5', CURRENT_USER.id)
      const para = getParagraphById(result, 'p-5')
      expect(para.lockedBy).toBe('user-3')
    })

    it('自己锁定的段落可以重新锁定', () => {
      const result = lockParagraph(testData, 'p-5', 'user-3')
      const para = getParagraphById(result, 'p-5')
      expect(para.lockedBy).toBe('user-3')
    })
  })

  describe('unlockParagraph', () => {
    it('锁定者应该可以解锁', () => {
      const result = unlockParagraph(testData, 'p-5', 'user-3')
      const para = getParagraphById(result, 'p-5')
      expect(para.lockedBy).toBeNull()
    })

    it('非锁定者不应该解锁', () => {
      const result = unlockParagraph(testData, 'p-5', CURRENT_USER.id)
      const para = getParagraphById(result, 'p-5')
      expect(para.lockedBy).toBe('user-3')
    })
  })

  describe('toggleParagraphLock', () => {
    it('未锁定时应该锁定', () => {
      const result = toggleParagraphLock(testData, 'p-1', CURRENT_USER.id)
      const para = getParagraphById(result, 'p-1')
      expect(para.lockedBy).toBe(CURRENT_USER.id)
    })

    it('已锁定时应该解锁', () => {
      const result = toggleParagraphLock(testData, 'p-5', 'user-3')
      const para = getParagraphById(result, 'p-5')
      expect(para.lockedBy).toBeNull()
    })

    it('他人锁定时不应该改变状态', () => {
      const result = toggleParagraphLock(testData, 'p-5', CURRENT_USER.id)
      const para = getParagraphById(result, 'p-5')
      expect(para.lockedBy).toBe('user-3')
    })
  })

  describe('lockAllMyParagraphs', () => {
    it('应该锁定所有我修改过的段落', () => {
      const result = lockAllMyParagraphs(testData, CURRENT_USER.id)
      const myParas = getMyModifiedParagraphs(result, CURRENT_USER.id)
      myParas.forEach((p) => {
        expect(p.lockedBy).toBe(CURRENT_USER.id)
      })
    })

    it('不应该影响他人锁定的段落', () => {
      const result = lockAllMyParagraphs(testData, CURRENT_USER.id)
      const para = getParagraphById(result, 'p-5')
      expect(para.lockedBy).toBe('user-3')
    })
  })

  describe('updateParagraphContent', () => {
    it('有编辑权限时应该更新内容', () => {
      const result = updateParagraphContent(testData, 'p-1', '新内容', CURRENT_USER.id)
      const para = getParagraphById(result, 'p-1')
      expect(para.content).toBe('新内容')
      expect(para.modifiedBy).toBe(CURRENT_USER.id)
    })

    it('无编辑权限时不应该更新内容', () => {
      const result = updateParagraphContent(testData, 'p-5', '新内容', CURRENT_USER.id)
      const para = getParagraphById(result, 'p-5')
      expect(para.content).not.toBe('新内容')
    })
  })

  describe('simulateCollaboratorEdit', () => {
    it('应该模拟协作者编辑内容', () => {
      const beforeContent = testData.paragraphs.find((p) => p.id === 'p-1').content
      const result = simulateCollaboratorEdit(testData, 'user-1')
      const afterContent = result.paragraphs.find((p) => p.id === 'p-1').content
      expect(typeof afterContent).toBe('string')
    })
  })
})

describe('修订痕迹增删改标记逻辑', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('addRevision', () => {
    it('应该添加新增类型的修订', () => {
      const result = addRevision(testData, 'p-1', REVISION_TYPE.ADD, '新增文字', 0, 4, 'user-1')
      expect(result.revisions.length).toBe(testData.revisions.length + 1)
      const rev = result.revisions[result.revisions.length - 1]
      expect(rev.type).toBe(REVISION_TYPE.ADD)
      expect(rev.text).toBe('新增文字')
      expect(rev.userId).toBe('user-1')
      expect(rev.accepted).toBe(false)
      expect(rev.rejected).toBe(false)
    })

    it('应该添加删除类型的修订', () => {
      const result = addRevision(testData, 'p-1', REVISION_TYPE.DELETE, '删除文字', 0, 4, 'user-1')
      const rev = result.revisions[result.revisions.length - 1]
      expect(rev.type).toBe(REVISION_TYPE.DELETE)
    })

    it('应该添加格式修改类型的修订', () => {
      const result = addRevision(testData, 'p-1', REVISION_TYPE.FORMAT, '格式修改', 0, 4, 'user-1')
      const rev = result.revisions[result.revisions.length - 1]
      expect(rev.type).toBe(REVISION_TYPE.FORMAT)
    })
  })

  describe('getRevisionsByParagraph', () => {
    it('应该返回指定段落的待处理修订', () => {
      let data = addRevision(testData, 'p-1', REVISION_TYPE.ADD, 'test', 0, 4, 'user-1')
      data = addRevision(data, 'p-2', REVISION_TYPE.DELETE, 'test', 0, 4, 'user-1')
      const revs = getRevisionsByParagraph(data, 'p-1')
      expect(revs.length).toBe(1)
      expect(revs[0].paragraphId).toBe('p-1')
    })

    it('不应该返回已接受或已拒绝的修订', () => {
      let data = addRevision(testData, 'p-1', REVISION_TYPE.ADD, 'test', 0, 4, 'user-1')
      const revId = data.revisions[0].id
      data = acceptRevision(data, revId)
      const revs = getRevisionsByParagraph(data, 'p-1')
      expect(revs.length).toBe(0)
    })
  })

  describe('acceptRevision', () => {
    it('应该将修订标记为已接受', () => {
      let data = addRevision(testData, 'p-1', REVISION_TYPE.ADD, 'test', 0, 4, 'user-1')
      const revId = data.revisions[0].id
      const result = acceptRevision(data, revId)
      const rev = result.revisions.find((r) => r.id === revId)
      expect(rev.accepted).toBe(true)
    })
  })

  describe('rejectRevision', () => {
    it('应该将修订标记为已拒绝', () => {
      let data = addRevision(testData, 'p-1', REVISION_TYPE.ADD, 'test', 0, 4, 'user-1')
      const revId = data.revisions[0].id
      const result = rejectRevision(data, revId)
      const rev = result.revisions.find((r) => r.id === revId)
      expect(rev.rejected).toBe(true)
    })
  })

  describe('acceptAllRevisions', () => {
    it('应该将所有修订标记为已接受', () => {
      let data = addRevision(testData, 'p-1', REVISION_TYPE.ADD, 'test1', 0, 4, 'user-1')
      data = addRevision(data, 'p-2', REVISION_TYPE.DELETE, 'test2', 0, 4, 'user-2')
      const result = acceptAllRevisions(data)
      result.revisions.forEach((r) => expect(r.accepted).toBe(true))
    })
  })

  describe('rejectAllRevisions', () => {
    it('应该将所有修订标记为已拒绝', () => {
      let data = addRevision(testData, 'p-1', REVISION_TYPE.ADD, 'test1', 0, 4, 'user-1')
      data = addRevision(data, 'p-2', REVISION_TYPE.DELETE, 'test2', 0, 4, 'user-2')
      const result = rejectAllRevisions(data)
      result.revisions.forEach((r) => expect(r.rejected).toBe(true))
    })
  })

  describe('getPendingRevisions', () => {
    it('应该只返回未处理的修订', () => {
      let data = addRevision(testData, 'p-1', REVISION_TYPE.ADD, 'test1', 0, 4, 'user-1')
      data = addRevision(data, 'p-2', REVISION_TYPE.DELETE, 'test2', 0, 4, 'user-2')
      const revId = data.revisions[0].id
      data = acceptRevision(data, revId)
      const pending = getPendingRevisions(data)
      expect(pending.length).toBe(1)
      expect(pending[0].id).toBe(data.revisions[1].id)
    })
  })

  describe('toggleRevisionMode', () => {
    it('应该切换修订模式', () => {
      const result1 = toggleRevisionMode(testData)
      expect(result1.revisionMode).toBe(true)
      const result2 = toggleRevisionMode(result1)
      expect(result2.revisionMode).toBe(false)
    })
  })

  describe('setRevisionMode', () => {
    it('应该设置修订模式', () => {
      const result = setRevisionMode(testData, true)
      expect(result.revisionMode).toBe(true)
    })
  })
})

describe('版本对比差异计算', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('createVersion', () => {
    it('应该创建新版本', () => {
      const oldVersionCount = testData.versions.length
      const result = createVersion(testData, '新版本')
      expect(result.versions.length).toBe(oldVersionCount + 1)
      const latest = result.versions[result.versions.length - 1]
      expect(latest.version).toBe(oldVersionCount + 1)
      expect(latest.title).toBe('新版本')
    })

    it('应该保存当前段落快照', () => {
      const result = createVersion(testData)
      const latest = result.versions[result.versions.length - 1]
      expect(latest.paragraphs.length).toBe(testData.paragraphs.length)
      expect(latest.paragraphs[0].content).toBe(testData.paragraphs[0].content)
    })
  })

  describe('getVersionById', () => {
    it('应该根据 ID 正确查找版本', () => {
      const v = getVersionById(testData, testData.versions[0].id)
      expect(v).not.toBeNull()
      expect(v.id).toBe(testData.versions[0].id)
    })

    it('找不到时应该返回 null', () => {
      expect(getVersionById(testData, 'not-exist')).toBeNull()
    })
  })

  describe('restoreToVersion', () => {
    it('应该恢复到指定版本', () => {
      let data = updateParagraphContent(testData, 'p-1', '修改后的内容', CURRENT_USER.id)
      const originalVersionId = testData.versions[0].id
      const result = restoreToVersion(data, originalVersionId)
      const para = getParagraphById(result, 'p-1')
      expect(para.content).toBe(testData.paragraphs[0].content)
    })

    it('不存在的版本应该返回原数据', () => {
      const result = restoreToVersion(testData, 'not-exist')
      expect(result).toEqual(testData)
    })
  })

  describe('getSortedVersions', () => {
    it('应该按时间倒序排列版本', () => {
      let data = createVersion(testData, 'v2')
      data = createVersion(data, 'v3')
      const sorted = getSortedVersions(data)
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].createdAt).toBeGreaterThanOrEqual(sorted[i + 1].createdAt)
      }
    })
  })

  describe('computeParagraphDiff', () => {
    it('相同内容应该只返回 equal 段', () => {
      const result = computeParagraphDiff({ content: 'Hello' }, { content: 'Hello' })
      expect(result.segments.length).toBe(1)
      expect(result.segments[0].type).toBe('equal')
      expect(result.segments[0].value).toBe('Hello')
    })

    it('应该正确标记新增内容', () => {
      const result = computeParagraphDiff({ content: 'Hello' }, { content: 'Hello World' })
      const hasAdded = result.segments.some((s) => s.type === 'added')
      expect(hasAdded).toBe(true)
    })

    it('应该正确标记删除内容', () => {
      const result = computeParagraphDiff({ content: 'Hello World' }, { content: 'Hello' })
      const hasRemoved = result.segments.some((s) => s.type === 'removed')
      expect(hasRemoved).toBe(true)
    })

    it('空内容应该也能处理', () => {
      const result = computeParagraphDiff({ content: '' }, { content: '' })
      expect(result.segments.length).toBe(1)
      expect(result.segments[0].type).toBe('equal')
    })
  })

  describe('computeVersionDiff', () => {
    it('应该比较两个版本的所有段落', () => {
      const v1 = testData.versions[0]
      let modified = { ...testData }
      modified = updateParagraphContent(modified, 'p-1', '新内容', CURRENT_USER.id)
      const v2 = { paragraphs: modified.paragraphs }
      const diffs = computeVersionDiff(v1, v2)
      expect(diffs.length).toBe(testData.paragraphs.length)
      const hasModified = diffs.some((d) => d.type === 'modified')
      expect(hasModified).toBe(true)
    })

    it('应该处理段落数量变化', () => {
      const v1 = { paragraphs: testData.paragraphs.slice(0, 3) }
      const v2 = { paragraphs: testData.paragraphs.slice(0, 5) }
      const diffs = computeVersionDiff(v1, v2)
      expect(diffs.some((d) => d.type === 'added')).toBe(true)
    })
  })
})

describe('批注讨论串数据结构', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('createComment', () => {
    it('应该创建新批注', () => {
      const result = createComment(testData, 'p-1', '引用文字', '批注内容', CURRENT_USER.id)
      expect(result.comments.length).toBe(testData.comments.length + 1)
      const comment = result.comments[result.comments.length - 1]
      expect(comment.paragraphId).toBe('p-1')
      expect(comment.text).toBe('引用文字')
      expect(comment.content).toBe('批注内容')
      expect(comment.authorId).toBe(CURRENT_USER.id)
      expect(comment.resolved).toBe(false)
      expect(Array.isArray(comment.replies)).toBe(true)
      expect(comment.replies.length).toBe(0)
    })
  })

  describe('replyToComment', () => {
    it('应该在批注下添加回复', () => {
      const commentId = testData.comments[0].id
      const oldReplyCount = testData.comments[0].replies.length
      const result = replyToComment(testData, commentId, '回复内容', 'user-2')
      const comment = result.comments.find((c) => c.id === commentId)
      expect(comment.replies.length).toBe(oldReplyCount + 1)
      const reply = comment.replies[comment.replies.length - 1]
      expect(reply.content).toBe('回复内容')
      expect(reply.authorId).toBe('user-2')
    })
  })

  describe('resolveComment', () => {
    it('应该将批注标记为已解决', () => {
      const commentId = testData.comments[0].id
      const result = resolveComment(testData, commentId)
      const comment = result.comments.find((c) => c.id === commentId)
      expect(comment.resolved).toBe(true)
    })
  })

  describe('unresolveComment', () => {
    it('应该将批注标记为未解决', () => {
      const commentId = testData.comments[1].id
      const result = unresolveComment(testData, commentId)
      const comment = result.comments.find((c) => c.id === commentId)
      expect(comment.resolved).toBe(false)
    })
  })

  describe('toggleCommentResolved', () => {
    it('应该切换解决状态', () => {
      const commentId = testData.comments[0].id
      const result1 = toggleCommentResolved(testData, commentId)
      expect(result1.comments.find((c) => c.id === commentId).resolved).toBe(true)
      const result2 = toggleCommentResolved(result1, commentId)
      expect(result2.comments.find((c) => c.id === commentId).resolved).toBe(false)
    })

    it('不存在的批注应该返回原数据', () => {
      const result = toggleCommentResolved(testData, 'not-exist')
      expect(result).toEqual(testData)
    })
  })

  describe('getCommentsByParagraph', () => {
    it('应该返回指定段落的所有批注', () => {
      const comments = getCommentsByParagraph(testData, 'p-2')
      expect(comments.length).toBeGreaterThan(0)
      comments.forEach((c) => expect(c.paragraphId).toBe('p-2'))
    })
  })

  describe('getSortedComments', () => {
    it('应该按段落顺序排序批注', () => {
      const sorted = getSortedComments(testData)
      const paraOrder = testData.paragraphs.map((p) => p.id)
      for (let i = 0; i < sorted.length - 1; i++) {
        const idx1 = paraOrder.indexOf(sorted[i].paragraphId)
        const idx2 = paraOrder.indexOf(sorted[i + 1].paragraphId)
        expect(idx1).toBeLessThanOrEqual(idx2)
      }
    })
  })

  describe('getUnresolvedComments', () => {
    it('应该只返回未解决的批注', () => {
      const unresolved = getUnresolvedComments(testData)
      unresolved.forEach((c) => expect(c.resolved).toBe(false))
      expect(unresolved.length).toBeLessThanOrEqual(testData.comments.length)
    })
  })
})

describe('其他功能', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('updateTitle', () => {
    it('应该更新文档标题', () => {
      const result = updateTitle(testData, '新标题')
      expect(result.title).toBe('新标题')
    })
  })

  describe('clearNotifications', () => {
    it('应该清空所有通知', () => {
      const result = clearNotifications(testData)
      expect(result.notifications).toEqual([])
    })
  })

  describe('removeNotification', () => {
    it('应该移除指定通知', () => {
      let data = { ...testData, notifications: [{ id: 'n-1', type: 'join', userId: 'user-1' }] }
      const result = removeNotification(data, 'n-1')
      expect(result.notifications.length).toBe(0)
    })
  })

  describe('getNotificationMessage', () => {
    it('应该返回加入文档的提示', () => {
      const msg = getNotificationMessage(testData, { id: 'n-1', type: 'join', userId: 'user-1' })
      expect(msg).toContain('加入了文档')
      expect(msg).toContain('张三')
    })

    it('应该返回离开文档的提示', () => {
      const msg = getNotificationMessage(testData, { id: 'n-1', type: 'leave', userId: 'user-1' })
      expect(msg).toContain('离开了文档')
    })

    it('未知用户应该返回空字符串', () => {
      const msg = getNotificationMessage(testData, { id: 'n-1', type: 'join', userId: 'not-exist' })
      expect(msg).toBe('')
    })
  })
})

describe('精确 Diff 算法', () => {
  describe('detectContentChanges', () => {
    it('相同内容应该返回空数组', () => {
      const changes = detectContentChanges('Hello', 'Hello')
      expect(changes.length).toBe(0)
    })

    it('应该精确识别中间删除的内容', () => {
      const changes = detectContentChanges('Hello World', 'Hello')
      expect(changes.length).toBeGreaterThan(0)
      const hasDelete = changes.some((c) => c.type === 'delete')
      expect(hasDelete).toBe(true)
      const delChange = changes.find((c) => c.type === 'delete')
      expect(delChange.start).toBe(5)
      expect(delChange.text).toContain(' World')
    })

    it('应该精确识别中间新增的内容', () => {
      const changes = detectContentChanges('Hello', 'Hello World')
      expect(changes.length).toBeGreaterThan(0)
      const hasAdd = changes.some((c) => c.type === 'add')
      expect(hasAdd).toBe(true)
      const addChange = changes.find((c) => c.type === 'add')
      expect(addChange.start).toBe(5)
      expect(addChange.text).toBe(' World')
    })

    it('应该精确识别段落中间的删除', () => {
      const oldText = '这是一个测试段落，用于验证删除功能'
      const newText = '这是一个测试段落，用于验证功能'
      const changes = detectContentChanges(oldText, newText)
      expect(changes.length).toBeGreaterThan(0)
      const delChange = changes.find((c) => c.type === 'delete')
      expect(delChange).toBeTruthy()
      expect(delChange.text).toBe('删除')
      expect(delChange.start).toBe(13)
    })

    it('应该精确识别段落中间的新增', () => {
      const oldText = '这是一个段落，用于测试功能'
      const newText = '这是一个重要的段落，用于测试功能'
      const changes = detectContentChanges(oldText, newText)
      expect(changes.length).toBeGreaterThan(0)
      const addChange = changes.find((c) => c.type === 'add')
      expect(addChange).toBeTruthy()
      expect(addChange.text).toBe('重要的')
      expect(addChange.start).toBe(4)
    })

    it('应该识别连续的多个变化', () => {
      const oldText = 'ABCDEF'
      const newText = 'ABXYDEF'
      const changes = detectContentChanges(oldText, newText)
      expect(changes.length).toBe(2)
      expect(changes[0].type).toBe('delete')
      expect(changes[0].text).toBe('C')
      expect(changes[1].type).toBe('add')
      expect(changes[1].text).toBe('XY')
    })
  })

  describe('processContentChangeWithRevision', () => {
    let testData

    beforeEach(() => {
      testData = {
        ...getDefaultData(),
        revisionMode: true,
      }
    })

    it('非修订模式下应该只更新内容', () => {
      const data = { ...testData, revisionMode: false }
      const result = processContentChangeWithRevision(data, 'p-1', '旧内容', '新内容', CURRENT_USER.id)
      expect(result.revisions.length).toBe(0)
      expect(getParagraphById(result, 'p-1').content).toBe('新内容')
    })

    it('修订模式下删除内容应该生成精确位置的删除修订', () => {
      const paraId = 'p-1'
      const oldContent = '这是一个测试段落'
      const newContent = '这是一个段落'
      const result = processContentChangeWithRevision(testData, paraId, oldContent, newContent, CURRENT_USER.id)
      expect(result.revisions.length).toBeGreaterThan(0)
      const delRev = result.revisions.find((r) => r.type === REVISION_TYPE.DELETE)
      expect(delRev).toBeTruthy()
      expect(delRev.text).toBe('测试')
      expect(delRev.start).toBe(4)
      expect(delRev.end).toBe(6)
    })

    it('修订模式下新增内容应该生成精确位置的新增修订', () => {
      const paraId = 'p-1'
      const oldContent = '这是一个段落'
      const newContent = '这是一个重要的段落'
      const result = processContentChangeWithRevision(testData, paraId, oldContent, newContent, CURRENT_USER.id)
      expect(result.revisions.length).toBeGreaterThan(0)
      const addRev = result.revisions.find((r) => r.type === REVISION_TYPE.ADD)
      expect(addRev).toBeTruthy()
      expect(addRev.text).toBe('重要的')
      expect(addRev.start).toBe(4)
      expect(addRev.end).toBe(7)
    })

    it('段落末尾删除内容应该生成正确的修订', () => {
      const paraId = 'p-1'
      const oldContent = 'Hello World'
      const newContent = 'Hello'
      const result = processContentChangeWithRevision(testData, paraId, oldContent, newContent, CURRENT_USER.id)
      const delRev = result.revisions.find((r) => r.type === REVISION_TYPE.DELETE)
      expect(delRev).toBeTruthy()
      expect(delRev.text).toBe(' World')
      expect(delRev.start).toBe(5)
    })

    it('段落开头新增内容应该生成正确的修订', () => {
      const paraId = 'p-1'
      const oldContent = 'Hello'
      const newContent = 'New Hello'
      const result = processContentChangeWithRevision(testData, paraId, oldContent, newContent, CURRENT_USER.id)
      const addRev = result.revisions.find((r) => r.type === REVISION_TYPE.ADD)
      expect(addRev).toBeTruthy()
      expect(addRev.text).toBe('New ')
      expect(addRev.start).toBe(0)
    })
  })
})

describe('格式修改功能', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('addFormatRevision', () => {
    it('应该添加格式修订记录', () => {
      const result = addFormatRevision(testData, 'p-1', '测试文字', 2, 6, FORMAT_TYPE.BOLD, CURRENT_USER.id)
      expect(result.revisions.length).toBe(testData.revisions.length + 1)
      const rev = result.revisions[result.revisions.length - 1]
      expect(rev.type).toBe(REVISION_TYPE.FORMAT)
      expect(rev.format).toBe(FORMAT_TYPE.BOLD)
      expect(rev.text).toBe('测试文字')
      expect(rev.start).toBe(2)
      expect(rev.end).toBe(6)
    })

    it('格式修订应该包含 format 字段', () => {
      const result = addFormatRevision(testData, 'p-1', '文字', 0, 2, FORMAT_TYPE.ITALIC, 'user-1')
      const rev = result.revisions[result.revisions.length - 1]
      expect(rev).toHaveProperty('format')
      expect(rev.format).toBe(FORMAT_TYPE.ITALIC)
    })
  })

  describe('applyFormatToSelection', () => {
    it('应该应用格式到选中文字', () => {
      const result = applyFormatToSelection(testData, 'p-1', '测试', 0, 2, FORMAT_TYPE.BOLD, CURRENT_USER.id)
      expect(result.revisions.length).toBeGreaterThan(0)
      const rev = result.revisions.find((r) => r.type === REVISION_TYPE.FORMAT)
      expect(rev).toBeTruthy()
      expect(rev.format).toBe(FORMAT_TYPE.BOLD)
    })
  })

  describe('formatTextWithTags', () => {
    it('应该正确添加加粗标记', () => {
      expect(formatTextWithTags('文字', FORMAT_TYPE.BOLD)).toBe('**文字**')
    })

    it('应该正确添加斜体标记', () => {
      expect(formatTextWithTags('文字', FORMAT_TYPE.ITALIC)).toBe('*文字*')
    })

    it('应该正确添加下划线标记', () => {
      expect(formatTextWithTags('文字', FORMAT_TYPE.UNDERLINE)).toBe('<u>文字</u>')
    })

    it('应该正确添加删除线标记', () => {
      expect(formatTextWithTags('文字', FORMAT_TYPE.STRIKETHROUGH)).toBe('~~文字~~')
    })

    it('未知格式应该返回原文字', () => {
      expect(formatTextWithTags('文字', 'unknown')).toBe('文字')
    })
  })

  describe('applyFormatToContent', () => {
    it('应该在正确位置应用格式', () => {
      const content = '这是一个测试'
      const result = applyFormatToContent(content, 4, 6, FORMAT_TYPE.BOLD)
      expect(result).toBe('这是一个**测试**')
    })

    it('边界情况：start < 0 应该返回原内容', () => {
      const content = '测试'
      const result = applyFormatToContent(content, -1, 1, FORMAT_TYPE.BOLD)
      expect(result).toBe('测试')
    })

    it('边界情况：start >= end 应该返回原内容', () => {
      const content = '测试'
      const result = applyFormatToContent(content, 2, 1, FORMAT_TYPE.BOLD)
      expect(result).toBe('测试')
    })

    it('边界情况：end 超出长度应该返回原内容', () => {
      const content = '测试'
      const result = applyFormatToContent(content, 0, 10, FORMAT_TYPE.BOLD)
      expect(result).toBe('测试')
    })

    it('应该正确在段落中间应用格式', () => {
      const content = 'ABCDEF'
      const result = applyFormatToContent(content, 2, 4, FORMAT_TYPE.ITALIC)
      expect(result).toBe('AB*CD*EF')
    })
  })
})

describe('修订渲染逻辑', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('renderContentWithRevisions', () => {
    it('没有修订时应该返回单一 text 段', () => {
      const content = 'Hello World'
      const segments = renderContentWithRevisions(content, [], testData)
      expect(segments.length).toBe(1)
      expect(segments[0].type).toBe('text')
      expect(segments[0].value).toBe('Hello World')
    })

    it('有修订时应该正确分段', () => {
      const content = 'Hello World'
      const revisions = [
        {
          id: 'rev-1',
          type: REVISION_TYPE.ADD,
          text: ' World',
          start: 5,
          end: 11,
          userId: 'user-1',
          createdAt: Date.now(),
          accepted: false,
          rejected: false,
        },
      ]
      const segments = renderContentWithRevisions(content, revisions, testData)
      expect(segments.length).toBe(2)
      expect(segments[0].type).toBe('text')
      expect(segments[0].value).toBe('Hello')
      expect(segments[1].type).toBe('revision')
      expect(segments[1].value).toBe(' World')
    })

    it('删除类型修订应该显示被删除的文字', () => {
      const content = 'Hello'
      const revisions = [
        {
          id: 'rev-1',
          type: REVISION_TYPE.DELETE,
          text: ' World',
          start: 5,
          end: 11,
          userId: 'user-1',
          createdAt: Date.now(),
          accepted: false,
          rejected: false,
        },
      ]
      const segments = renderContentWithRevisions(content, revisions, testData)
      expect(segments.length).toBe(2)
      expect(segments[1].value).toBe(' World')
    })

    it('修订段应该包含作者信息', () => {
      const content = 'Hello'
      const revisions = [
        {
          id: 'rev-1',
          type: REVISION_TYPE.ADD,
          text: '!',
          start: 5,
          end: 6,
          userId: 'user-1',
          createdAt: Date.now(),
          accepted: false,
          rejected: false,
        },
      ]
      const segments = renderContentWithRevisions(content, revisions, testData)
      expect(segments[1].author).toBeTruthy()
      expect(segments[1].author.id).toBe('user-1')
    })

    it('格式修订应该正确分段', () => {
      const content = 'Hello World'
      const revisions = [
        {
          id: 'rev-1',
          type: REVISION_TYPE.FORMAT,
          text: 'World',
          start: 6,
          end: 11,
          userId: 'user-1',
          createdAt: Date.now(),
          accepted: false,
          rejected: false,
          format: FORMAT_TYPE.BOLD,
        },
      ]
      const segments = renderContentWithRevisions(content, revisions, testData)
      expect(segments.length).toBe(2)
      expect(segments[0].type).toBe('text')
      expect(segments[0].value).toBe('Hello ')
      expect(segments[1].type).toBe('revision')
      expect(segments[1].revision.format).toBe(FORMAT_TYPE.BOLD)
      expect(segments[1].value).toBe('World')
    })
  })

  describe('addRevision', () => {
    it('创建的修订应该包含 format 字段默认为 null', () => {
      const result = addRevision(testData, 'p-1', REVISION_TYPE.ADD, 'text', 0, 4, 'user-1')
      const rev = result.revisions[result.revisions.length - 1]
      expect(rev).toHaveProperty('format')
      expect(rev.format).toBeNull()
    })
  })
})

