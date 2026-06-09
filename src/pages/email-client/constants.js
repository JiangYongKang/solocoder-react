export const STORAGE_KEY = 'email-client-data'

export const PAGE_SIZE = 20

export const FOLDERS = {
  INBOX: 'inbox',
  SENT: 'sent',
  DRAFTS: 'drafts',
  STARRED: 'starred',
  TRASH: 'trash',
}

export const FOLDER_META = {
  [FOLDERS.INBOX]: { name: '收件箱', icon: 'inbox' },
  [FOLDERS.SENT]: { name: '已发送', icon: 'sent' },
  [FOLDERS.DRAFTS]: { name: '草稿箱', icon: 'drafts' },
  [FOLDERS.STARRED]: { name: '星标邮件', icon: 'starred' },
  [FOLDERS.TRASH]: { name: '垃圾箱', icon: 'trash' },
}

export const ALLOWED_HTML_TAGS = ['b', 'strong', 'i', 'em', 'u', 'a', 'ul', 'ol', 'li', 'p', 'br', 'img', 'div', 'span']
