import { FOLDERS } from './constants'
import { createInitialEmails } from './initialData'
import { STORAGE_KEY } from './constants'

export function generateId(prefix = 'email') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadEmails() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  const initial = createInitialEmails()
  saveEmails(initial)
  return initial
}

export function saveEmails(emails) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails))
  } catch {
    // ignore
  }
}

export function formatDateTime(timestamp) {
  if (timestamp == null || Number.isNaN(timestamp)) return ''
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  const now = new Date()
  const sameDay = d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
  if (sameDay) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatFullDateTime(timestamp) {
  if (timestamp == null || Number.isNaN(timestamp)) return ''
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function getPreview(text, length = 80) {
  if (!text) return ''
  const stripped = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return stripped.length > length ? stripped.slice(0, length) + '...' : stripped
}

export function filterEmailsByFolder(emails, folder) {
  if (!Array.isArray(emails)) return []
  switch (folder) {
    case FOLDERS.INBOX:
      return emails.filter((e) => e.folder === FOLDERS.INBOX && !e.isSpam)
    case FOLDERS.SENT:
      return emails.filter((e) => e.folder === FOLDERS.SENT)
    case FOLDERS.DRAFTS:
      return emails.filter((e) => e.folder === FOLDERS.DRAFTS)
    case FOLDERS.STARRED:
      return emails.filter((e) => e.isStarred && e.folder !== FOLDERS.TRASH)
    case FOLDERS.TRASH:
      return emails.filter((e) => e.folder === FOLDERS.TRASH)
    default:
      return []
  }
}

export function sortEmails(emails) {
  if (!Array.isArray(emails)) return []
  return [...emails].sort((a, b) => b.sentAt - a.sentAt)
}

export function paginateEmails(emails, page, pageSize) {
  if (!Array.isArray(emails)) return []
  const start = (page - 1) * pageSize
  return emails.slice(start, start + pageSize)
}

export function getTotalPages(total, pageSize) {
  return Math.ceil(total / pageSize)
}

export function getUnreadCount(emails, folder) {
  const folderEmails = filterEmailsByFolder(emails, folder)
  return folderEmails.filter((e) => !e.isRead).length
}

export function countAllUnreadCounts(emails) {
  return {
    [FOLDERS.INBOX]: getUnreadCount(emails, FOLDERS.INBOX),
    [FOLDERS.SENT]: 0,
    [FOLDERS.DRAFTS]: 0,
    [FOLDERS.STARRED]: 0,
    [FOLDERS.TRASH]: 0,
  }
}

export function markEmailRead(emails, emailId) {
  return emails.map((e) =>
    e.id === emailId ? { ...e, isRead: true } : e
  )
}

export function toggleEmailRead(emails, emailId) {
  return emails.map((e) =>
    e.id === emailId ? { ...e, isRead: !e.isRead } : e
  )
}

export function toggleEmailStarred(emails, emailId) {
  return emails.map((e) =>
    e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
  )
}

export function markAsSpam(emails, emailIds) {
  return emails.map((e) =>
    emailIds.includes(e.id) ? { ...e, isSpam: true, folder: FOLDERS.TRASH } : e
  )
}

export function moveToTrash(emails, emailIds) {
  return emails.map((e) =>
    emailIds.includes(e.id) && e.folder !== FOLDERS.TRASH
      ? { ...e, folder: FOLDERS.TRASH }
      : e
  )
}

export function deletePermanently(emails, emailIds) {
  return emails.filter((e) => !emailIds.includes(e.id))
}

export function restoreFromTrash(emails, emailIds) {
  return emails.map((e) =>
    emailIds.includes(e.id) && e.folder === FOLDERS.TRASH
      ? { ...e, folder: e.originalFolder || FOLDERS.INBOX, isSpam: false }
      : e
  )
}

export function emptyTrash(emails) {
  return emails.filter((e) => e.folder !== FOLDERS.TRASH)
}

export function sendEmail(emails, { to, subject, body, cc, bcc }) {
  const newEmail = {
    id: generateId(),
    from: 'me@example.com',
    to,
    cc: cc || '',
    bcc: bcc || '',
    subject,
    body,
    folder: FOLDERS.SENT,
    isRead: true,
    isStarred: false,
    isSpam: false,
    sentAt: Date.now(),
  }
  return [newEmail, ...emails]
}

export function saveDraft(emails, { to, subject, body, id }) {
  if (id) {
    return emails.map((e) =>
      e.id === id
        ? { ...e, to, subject, body, sentAt: Date.now() }
        : e
    )
  }
  const draftEmail = {
    id: generateId('draft'),
    from: 'me@example.com',
    to: to || '',
    cc: '',
    bcc: '',
    subject: subject || '(无主题)',
    body: body || '',
    folder: FOLDERS.DRAFTS,
    isRead: true,
    isStarred: false,
    isSpam: false,
    sentAt: Date.now(),
  }
  return [draftEmail, ...emails]
}

export function validateEmailInput({ to, subject }) {
  const errors = {}
  if (!to || !to.trim()) {
    errors.to = '请输入收件人'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const recipients = to.split(',').map((s) => s.trim()).filter(Boolean)
    const allValid = recipients.every((r) => emailRegex.test(r))
    if (!allValid) {
      errors.to = '请输入有效的邮箱地址'
    }
  }
  if (!subject || !subject.trim()) {
    errors.subject = '请输入主题'
  }
  return errors
}

export function sanitizeHtml(html) {
  if (!html) return ''
  const div = typeof document !== 'undefined'
    ? document.createElement('div')
    : null
  if (!div) return html
  div.innerHTML = html
  return div.innerHTML
}

export function createReplyEmail(email) {
  return {
    to: email.from,
    subject: `Re: ${email.subject}`,
    body: `<br><br>---------- 原始邮件 ----------<br>
发件人: ${email.from}<br>
发送时间: ${formatFullDateTime(email.sentAt)}<br>
收件人: ${email.to}<br>
主题: ${email.subject}<br><br>
${email.body}`,
  }
}

export function createForwardEmail(email) {
  return {
    to: '',
    subject: `Fwd: ${email.subject}`,
    body: `<br><br>---------- 转发邮件 ----------<br>
发件人: ${email.from}<br>
发送时间: ${formatFullDateTime(email.sentAt)}<br>
收件人: ${email.to}<br>
主题: ${email.subject}<br><br>
${email.body}`,
  }
}
