import { describe, it, expect } from 'vitest'
import { FOLDERS } from '@/pages/email-client/constants'
import {
  generateId,
  formatDateTime,
  formatFullDateTime,
  getPreview,
  filterEmailsByFolder,
  sortEmails,
  paginateEmails,
  getTotalPages,
  getUnreadCount,
  countAllUnreadCounts,
  markEmailRead,
  toggleEmailRead,
  toggleEmailStarred,
  markAsSpam,
  moveToTrash,
  deletePermanently,
  restoreFromTrash,
  emptyTrash,
  sendEmail,
  saveDraft,
  validateEmailInput,
  createReplyEmail,
  createForwardEmail,
} from '@/pages/email-client/emailUtils'

function makeTestEmails() {
  const now = 1700000000000
  return [
    {
      id: 'email-1',
      from: '张三 <zhangsan@example.com>',
      to: 'me@example.com',
      subject: '第一封邮件',
      body: '<p>这是第一封邮件的正文内容。</p>',
      folder: FOLDERS.INBOX,
      originalFolder: FOLDERS.INBOX,
      isRead: false,
      isStarred: true,
      isSpam: false,
      sentAt: now - 3600000,
    },
    {
      id: 'email-2',
      from: '李四 <lisi@example.com>',
      to: 'me@example.com',
      subject: '第二封邮件',
      body: '<p>这是第二封邮件的正文内容，稍微长一点的内容用来测试预览功能是否正常工作。</p>',
      folder: FOLDERS.INBOX,
      originalFolder: FOLDERS.INBOX,
      isRead: true,
      isStarred: false,
      isSpam: false,
      sentAt: now - 7200000,
    },
    {
      id: 'email-3',
      from: 'me@example.com',
      to: 'wangwu@example.com',
      subject: '已发送的邮件',
      body: '<p>这是已发送的邮件内容。</p>',
      folder: FOLDERS.SENT,
      isRead: true,
      isStarred: false,
      isSpam: false,
      sentAt: now - 86400000,
    },
    {
      id: 'email-4',
      from: 'me@example.com',
      to: '',
      subject: '(无主题)',
      body: '',
      folder: FOLDERS.DRAFTS,
      isRead: true,
      isStarred: false,
      isSpam: false,
      sentAt: now - 172800000,
    },
    {
      id: 'email-5',
      from: 'spam@example.com',
      to: 'me@example.com',
      subject: '垃圾邮件',
      body: '<p>这是垃圾邮件。</p>',
      folder: FOLDERS.TRASH,
      originalFolder: FOLDERS.INBOX,
      isRead: true,
      isStarred: false,
      isSpam: true,
      sentAt: now - 259200000,
    },
    {
      id: 'email-6',
      from: '赵六 <zhaoliu@example.com>',
      to: 'me@example.com',
      subject: '星标邮件',
      body: '<p>这是星标邮件的内容。</p>',
      folder: FOLDERS.INBOX,
      originalFolder: FOLDERS.INBOX,
      isRead: false,
      isStarred: true,
      isSpam: false,
      sentAt: now - 1800000,
    },
  ]
}

describe('generateId', () => {
  it('生成非空字符串 ID', () => {
    const id = generateId('email')
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(id.startsWith('email-')).toBe(true)
  })

  it('生成的 ID 不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为日期字符串', () => {
    const result = formatDateTime(1700000000000)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('无效时间戳返回空字符串', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime(NaN)).toBe('')
  })
})

describe('formatFullDateTime', () => {
  it('格式化完整日期时间', () => {
    const result = formatFullDateTime(1700000000000)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('无效时间戳返回空字符串', () => {
    expect(formatFullDateTime(null)).toBe('')
    expect(formatFullDateTime(undefined)).toBe('')
    expect(formatFullDateTime(NaN)).toBe('')
  })
})

describe('getPreview', () => {
  it('去除 HTML 标签并截取指定长度', () => {
    const result = getPreview('<p>Hello World</p>', 8)
    expect(result).toBe('Hello Wo...')
  })

  it('内容不足时不添加省略号', () => {
    const result = getPreview('<p>Hi</p>', 80)
    expect(result).toBe('Hi')
    expect(result.endsWith('...')).toBe(false)
  })

  it('空内容返回空字符串', () => {
    expect(getPreview('')).toBe('')
    expect(getPreview(null)).toBe('')
    expect(getPreview(undefined)).toBe('')
  })

  it('压缩多余空白字符', () => {
    const result = getPreview('<p>Hello   World</p>')
    expect(result).toBe('Hello World')
  })
})

describe('filterEmailsByFolder', () => {
  it('过滤收件箱邮件（排除垃圾邮件）', () => {
    const emails = makeTestEmails()
    const result = filterEmailsByFolder(emails, FOLDERS.INBOX)
    expect(result).toHaveLength(3)
    expect(result.every((e) => e.folder === FOLDERS.INBOX && !e.isSpam)).toBe(true)
  })

  it('过滤已发送邮件', () => {
    const emails = makeTestEmails()
    const result = filterEmailsByFolder(emails, FOLDERS.SENT)
    expect(result).toHaveLength(1)
    expect(result[0].folder).toBe(FOLDERS.SENT)
  })

  it('过滤草稿箱邮件', () => {
    const emails = makeTestEmails()
    const result = filterEmailsByFolder(emails, FOLDERS.DRAFTS)
    expect(result).toHaveLength(1)
    expect(result[0].folder).toBe(FOLDERS.DRAFTS)
  })

  it('过滤星标邮件（排除垃圾箱中的）', () => {
    const emails = makeTestEmails()
    const result = filterEmailsByFolder(emails, FOLDERS.STARRED)
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.isStarred && e.folder !== FOLDERS.TRASH)).toBe(true)
  })

  it('过滤垃圾箱邮件', () => {
    const emails = makeTestEmails()
    const result = filterEmailsByFolder(emails, FOLDERS.TRASH)
    expect(result).toHaveLength(1)
    expect(result[0].folder).toBe(FOLDERS.TRASH)
  })

  it('空数组返回空数组', () => {
    expect(filterEmailsByFolder([], FOLDERS.INBOX)).toEqual([])
  })

  it('非数组返回空数组', () => {
    expect(filterEmailsByFolder(null, FOLDERS.INBOX)).toEqual([])
    expect(filterEmailsByFolder(undefined, FOLDERS.INBOX)).toEqual([])
  })
})

describe('sortEmails', () => {
  it('按发送时间降序排序', () => {
    const emails = makeTestEmails()
    const sorted = sortEmails(emails)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].sentAt).toBeGreaterThanOrEqual(sorted[i].sentAt)
    }
  })

  it('不修改原始数组', () => {
    const emails = makeTestEmails()
    const originalOrder = emails.map((e) => e.id)
    sortEmails(emails)
    expect(emails.map((e) => e.id)).toEqual(originalOrder)
  })

  it('空数组返回空数组', () => {
    expect(sortEmails([])).toEqual([])
  })
})

describe('paginateEmails', () => {
  it('正确分页', () => {
    const emails = makeTestEmails()
    const page1 = paginateEmails(emails, 1, 2)
    const page2 = paginateEmails(emails, 2, 2)
    expect(page1).toHaveLength(2)
    expect(page2).toHaveLength(2)
    expect(page1[0].id).toBe(emails[0].id)
    expect(page2[0].id).toBe(emails[2].id)
  })

  it('最后一页不足页大小返回剩余', () => {
    const emails = makeTestEmails()
    const page3 = paginateEmails(emails, 3, 2)
    expect(page3).toHaveLength(2)
    const page4 = paginateEmails(emails, 4, 2)
    expect(page4).toHaveLength(0)
  })

  it('空数组返回空数组', () => {
    expect(paginateEmails([], 1, 20)).toEqual([])
  })
})

describe('getTotalPages', () => {
  it('计算总页数', () => {
    expect(getTotalPages(25, 20)).toBe(2)
    expect(getTotalPages(20, 20)).toBe(1)
    expect(getTotalPages(0, 20)).toBe(0)
    expect(getTotalPages(1, 20)).toBe(1)
  })
})

describe('getUnreadCount', () => {
  it('统计收件箱未读邮件数', () => {
    const emails = makeTestEmails()
    const count = getUnreadCount(emails, FOLDERS.INBOX)
    expect(count).toBe(2)
  })

  it('已发送箱未读数为 0', () => {
    const emails = makeTestEmails()
    const count = getUnreadCount(emails, FOLDERS.SENT)
    expect(count).toBe(0)
  })
})

describe('countAllUnreadCounts', () => {
  it('统计所有文件夹的未读数', () => {
    const emails = makeTestEmails()
    const counts = countAllUnreadCounts(emails)
    expect(counts[FOLDERS.INBOX]).toBe(2)
    expect(counts[FOLDERS.SENT]).toBe(0)
    expect(counts[FOLDERS.DRAFTS]).toBe(0)
    expect(counts[FOLDERS.STARRED]).toBe(0)
    expect(counts[FOLDERS.TRASH]).toBe(0)
  })
})

describe('markEmailRead', () => {
  it('标记邮件为已读', () => {
    const emails = makeTestEmails()
    const result = markEmailRead(emails, 'email-1')
    expect(result.find((e) => e.id === 'email-1').isRead).toBe(true)
  })

  it('不修改其他邮件', () => {
    const emails = makeTestEmails()
    const result = markEmailRead(emails, 'email-1')
    expect(result.find((e) => e.id === 'email-6').isRead).toBe(false)
  })

  it('不修改原始数组', () => {
    const emails = makeTestEmails()
    markEmailRead(emails, 'email-1')
    expect(emails.find((e) => e.id === 'email-1').isRead).toBe(false)
  })
})

describe('toggleEmailRead', () => {
  it('切换已读状态', () => {
    const emails = makeTestEmails()
    const result1 = toggleEmailRead(emails, 'email-1')
    expect(result1.find((e) => e.id === 'email-1').isRead).toBe(true)
    const result2 = toggleEmailRead(result1, 'email-1')
    expect(result2.find((e) => e.id === 'email-1').isRead).toBe(false)
  })
})

describe('toggleEmailStarred', () => {
  it('切换星标状态', () => {
    const emails = makeTestEmails()
    const result1 = toggleEmailStarred(emails, 'email-1')
    expect(result1.find((e) => e.id === 'email-1').isStarred).toBe(false)
    const result2 = toggleEmailStarred(result1, 'email-1')
    expect(result2.find((e) => e.id === 'email-1').isStarred).toBe(true)
  })
})

describe('markAsSpam', () => {
  it('批量标记为垃圾邮件并移入垃圾箱', () => {
    const emails = makeTestEmails()
    const result = markAsSpam(emails, ['email-1', 'email-2'])
    expect(result.find((e) => e.id === 'email-1').isSpam).toBe(true)
    expect(result.find((e) => e.id === 'email-1').folder).toBe(FOLDERS.TRASH)
    expect(result.find((e) => e.id === 'email-2').isSpam).toBe(true)
    expect(result.find((e) => e.id === 'email-2').folder).toBe(FOLDERS.TRASH)
  })
})

describe('moveToTrash', () => {
  it('批量移入垃圾箱', () => {
    const emails = makeTestEmails()
    const result = moveToTrash(emails, ['email-1', 'email-2'])
    expect(result.find((e) => e.id === 'email-1').folder).toBe(FOLDERS.TRASH)
    expect(result.find((e) => e.id === 'email-2').folder).toBe(FOLDERS.TRASH)
  })

  it('垃圾箱中的邮件不重复移动', () => {
    const emails = makeTestEmails()
    const result = moveToTrash(emails, ['email-5'])
    expect(result.find((e) => e.id === 'email-5').folder).toBe(FOLDERS.TRASH)
  })
})

describe('deletePermanently', () => {
  it('彻底删除邮件', () => {
    const emails = makeTestEmails()
    const result = deletePermanently(emails, ['email-1', 'email-5'])
    expect(result.find((e) => e.id === 'email-1')).toBeUndefined()
    expect(result.find((e) => e.id === 'email-5')).toBeUndefined()
    expect(result).toHaveLength(emails.length - 2)
  })
})

describe('restoreFromTrash', () => {
  it('从垃圾箱恢复邮件到原文件夹', () => {
    const emails = makeTestEmails()
    const result = restoreFromTrash(emails, ['email-5'])
    expect(result.find((e) => e.id === 'email-5').folder).toBe(FOLDERS.INBOX)
    expect(result.find((e) => e.id === 'email-5').isSpam).toBe(false)
  })
})

describe('emptyTrash', () => {
  it('清空垃圾箱', () => {
    const emails = makeTestEmails()
    const result = emptyTrash(emails)
    expect(result.filter((e) => e.folder === FOLDERS.TRASH)).toHaveLength(0)
    expect(result).toHaveLength(emails.length - 1)
  })
})

describe('sendEmail', () => {
  it('发送邮件并添加到已发送文件夹', () => {
    const emails = makeTestEmails()
    const result = sendEmail(emails, {
      to: 'test@example.com',
      subject: '测试邮件',
      body: '<p>测试内容</p>',
      cc: '',
      bcc: '',
    })
    expect(result[0].folder).toBe(FOLDERS.SENT)
    expect(result[0].to).toBe('test@example.com')
    expect(result[0].subject).toBe('测试邮件')
    expect(result[0].isRead).toBe(true)
    expect(result.length).toBe(emails.length + 1)
  })
})

describe('saveDraft', () => {
  it('保存新草稿', () => {
    const emails = makeTestEmails()
    const result = saveDraft(emails, {
      to: 'draft@example.com',
      subject: '草稿主题',
      body: '<p>草稿内容</p>',
    })
    expect(result[0].folder).toBe(FOLDERS.DRAFTS)
    expect(result.length).toBe(emails.length + 1)
  })

  it('更新已有草稿', () => {
    const emails = makeTestEmails()
    const result = saveDraft(emails, {
      id: 'email-4',
      to: 'updated@example.com',
      subject: '更新后的主题',
      body: '<p>更新后的内容</p>',
    })
    const updated = result.find((e) => e.id === 'email-4')
    expect(updated.to).toBe('updated@example.com')
    expect(updated.subject).toBe('更新后的主题')
    expect(result.length).toBe(emails.length)
  })
})

describe('validateEmailInput', () => {
  it('验证有效的输入', () => {
    const errors = validateEmailInput({
      to: 'test@example.com',
      subject: 'Test Subject',
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('验证空收件人', () => {
    const errors = validateEmailInput({ to: '', subject: 'Test' })
    expect(errors.to).toBeTruthy()
  })

  it('验证无效邮箱格式', () => {
    const errors = validateEmailInput({ to: 'invalid-email', subject: 'Test' })
    expect(errors.to).toBeTruthy()
  })

  it('验证多个有效邮箱', () => {
    const errors = validateEmailInput({
      to: 'a@example.com, b@example.com',
      subject: 'Test',
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('验证空主题', () => {
    const errors = validateEmailInput({ to: 'test@example.com', subject: '' })
    expect(errors.subject).toBeTruthy()
  })

  it('验证空字符串（含空格）主题', () => {
    const errors = validateEmailInput({ to: 'test@example.com', subject: '   ' })
    expect(errors.subject).toBeTruthy()
  })
})

describe('createReplyEmail', () => {
  it('创建回复邮件', () => {
    const email = makeTestEmails()[0]
    const reply = createReplyEmail(email)
    expect(reply.subject).toMatch(/^Re:/)
    expect(reply.to).toBe(email.from)
    expect(reply.body).toContain(email.subject)
    expect(reply.body).toContain(email.from)
  })
})

describe('createForwardEmail', () => {
  it('创建转发邮件', () => {
    const email = makeTestEmails()[0]
    const forward = createForwardEmail(email)
    expect(forward.subject).toMatch(/^Fwd:/)
    expect(forward.to).toBe('')
    expect(forward.body).toContain(email.subject)
    expect(forward.body).toContain(email.from)
  })
})
