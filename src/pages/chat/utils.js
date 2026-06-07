import { CONTACTS, PRESET_REPLIES, STORAGE_KEY_MESSAGES, STORAGE_KEY_UNREAD } from './data.js'

export function generateId() {
  return 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
}

export function formatTime(timestamp) {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function safeGetItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadAllMessages() {
  return safeGetItem(STORAGE_KEY_MESSAGES, {})
}

export function saveAllMessages(messages) {
  return safeSetItem(STORAGE_KEY_MESSAGES, messages)
}

export function loadMessagesForContact(contactId) {
  const all = loadAllMessages()
  if (all[contactId] && all[contactId].length > 0) {
    return all[contactId]
  }
  return createInitialMessages(contactId)
}

export function ensureMessagesForContact(contactId) {
  const all = loadAllMessages()
  if (all[contactId] && all[contactId].length > 0) {
    return all[contactId]
  }
  const initial = createInitialMessages(contactId)
  all[contactId] = initial
  saveAllMessages(all)
  return initial
}

export function saveMessagesForContact(contactId, messages) {
  const all = loadAllMessages()
  all[contactId] = messages
  return saveAllMessages(all)
}

export function createInitialMessages(contactId) {
  const contact = CONTACTS.find((c) => c.id === contactId)
  if (!contact) return []
  const now = Date.now()
  return [
    {
      id: generateId(),
      type: 'text',
      senderId: contactId,
      content: '你好！很高兴认识你 👋',
      timestamp: now - 3600 * 1000,
      read: true,
    },
    {
      id: generateId(),
      type: 'text',
      senderId: 'me',
      content: '你好呀，最近忙吗？',
      timestamp: now - 3500 * 1000,
      read: true,
    },
    {
      id: generateId(),
      type: 'text',
      senderId: contactId,
      content: '还行，你呢？有空一起聊聊～',
      timestamp: now - 3400 * 1000,
      read: true,
    },
  ]
}

export function loadAllUnread() {
  return safeGetItem(STORAGE_KEY_UNREAD, {})
}

export function saveAllUnread(unreadMap) {
  return safeSetItem(STORAGE_KEY_UNREAD, unreadMap)
}

export function getUnreadCount(contactId) {
  const unread = loadAllUnread()
  return unread[contactId] || 0
}

export function incrementUnread(contactId) {
  const unread = loadAllUnread()
  unread[contactId] = (unread[contactId] || 0) + 1
  saveAllUnread(unread)
  return unread[contactId]
}

export function clearUnread(contactId) {
  const unread = loadAllUnread()
  unread[contactId] = 0
  saveAllUnread(unread)
  return 0
}

export function getLastMessagePreview(messages) {
  if (!messages || messages.length === 0) return '暂无消息'
  const last = messages[messages.length - 1]
  const prefix = last.senderId === 'me' ? '我: ' : ''
  if (last.type === 'text') {
    const text = last.content || ''
    return prefix + (text.length > 30 ? text.slice(0, 30) + '...' : text)
  }
  if (last.type === 'image') return prefix + '[图片]'
  if (last.type === 'file') return prefix + '[文件]'
  return prefix + '[消息]'
}

export function createTextMessage(content, senderId = 'me') {
  return {
    id: generateId(),
    type: 'text',
    senderId,
    content,
    timestamp: Date.now(),
    read: senderId === 'me',
  }
}

export function createImageMessage(dataUrl, fileName, senderId = 'me') {
  return {
    id: generateId(),
    type: 'image',
    senderId,
    content: dataUrl,
    fileName,
    timestamp: Date.now(),
    read: senderId === 'me',
  }
}

export function createFileMessage(dataUrl, fileName, fileSize, senderId = 'me') {
  return {
    id: generateId(),
    type: 'file',
    senderId,
    content: dataUrl,
    fileName,
    fileSize,
    timestamp: Date.now(),
    read: senderId === 'me',
  }
}

export function createRandomReply(senderId) {
  const idx = Math.floor(Math.random() * PRESET_REPLIES.length)
  return createTextMessage(PRESET_REPLIES[idx], senderId)
}

export function markAllRead(messages) {
  return messages.map((m) => ({ ...m, read: true }))
}

export function insertEmojiAtCursor(text, cursorPos, emoji) {
  if (cursorPos === null || cursorPos === undefined) {
    return { text: text + emoji, pos: (text || '').length + emoji.length }
  }
  const before = (text || '').slice(0, cursorPos)
  const after = (text || '').slice(cursorPos)
  const newText = before + emoji + after
  return { text: newText, pos: before.length + emoji.length }
}

export function getRandomInterval() {
  return Math.floor(Math.random() * 5000) + 5000
}
