import {
  CHARSETS,
  LOCK_THRESHOLD,
  LOCK_DURATION_MS,
  STRENGTH_LEVELS,
  PASSWORD_MASK,
  MASTER_PASSWORD_MIN_LENGTH,
} from './constants'

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function encodeBase64(str) {
  if (!str || typeof str !== 'string') return ''
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch {
    return ''
  }
}

export function decodeBase64(encoded) {
  if (!encoded || typeof encoded !== 'string') return ''
  try {
    return decodeURIComponent(escape(atob(encoded)))
  } catch {
    return ''
  }
}

export function evaluatePasswordStrength(password, charsetFlags) {
  if (!password || !charsetFlags) return STRENGTH_LEVELS.weak

  const activeCharsets = Object.entries(charsetFlags)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)

  const charsetCount = activeCharsets.length

  if (charsetCount <= 1) return STRENGTH_LEVELS.weak
  if (charsetCount === 2) return STRENGTH_LEVELS.medium
  if (charsetCount >= 3 && password.length >= 12) return STRENGTH_LEVELS.strong
  return STRENGTH_LEVELS.medium
}

export function buildCharsetString(charsetFlags) {
  let chars = ''
  if (charsetFlags.uppercase) chars += CHARSETS.uppercase
  if (charsetFlags.lowercase) chars += CHARSETS.lowercase
  if (charsetFlags.digits) chars += CHARSETS.digits
  if (charsetFlags.symbols) chars += CHARSETS.symbols
  return chars
}

export function generatePassword(length, charsetFlags) {
  const chars = buildCharsetString(charsetFlags)
  if (!chars) return ''

  const guaranteed = []
  const activeKeys = Object.entries(charsetFlags)
    .filter(([, v]) => v)
    .map(([k]) => k)

  for (const key of activeKeys) {
    const set = CHARSETS[key]
    guaranteed.push(set[Math.floor(Math.random() * set.length)])
  }

  const result = [...guaranteed]
  for (let i = result.length; i < length; i += 1) {
    result.push(chars[Math.floor(Math.random() * chars.length)])
  }

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result.join('')
}

export function hasAtLeastOneCharset(charsetFlags) {
  return Object.values(charsetFlags).some(Boolean)
}

export function maskAccount(account) {
  if (!account) return ''
  const atIndex = account.indexOf('@')
  if (atIndex === -1) {
    if (account.length <= 3) return account
    return account.slice(0, 3) + '***'
  }
  const local = account.slice(0, atIndex)
  const domain = account.slice(atIndex)
  if (local.length <= 3) return local + '***' + domain
  return local.slice(0, 3) + '***' + domain
}

export function getMaskedPassword() {
  return PASSWORD_MASK
}

export function validateMasterPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '请输入主密码' }
  }
  if (password.length < MASTER_PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `主密码长度不能少于${MASTER_PASSWORD_MIN_LENGTH}位` }
  }
  return { valid: true, error: '' }
}

export function verifyMasterPassword(input, storedEncoded) {
  if (!input || !storedEncoded) return false
  return encodeBase64(input) === storedEncoded
}

export function createLockState() {
  return { attempts: 0, lockedUntil: null }
}

export function checkLock(lockState) {
  if (!lockState) return { locked: false, remainingMs: 0 }
  if (lockState.lockedUntil && Date.now() < lockState.lockedUntil) {
    return { locked: true, remainingMs: lockState.lockedUntil - Date.now() }
  }
  return { locked: false, remainingMs: 0 }
}

export function recordFailedAttempt(lockState) {
  const attempts = (lockState?.attempts || 0) + 1
  if (attempts >= LOCK_THRESHOLD) {
    return { attempts, lockedUntil: Date.now() + LOCK_DURATION_MS }
  }
  return { attempts, lockedUntil: null }
}

export function resetLockState() {
  return createLockState()
}

export function isDuplicateEntry(entry, existingEntries) {
  if (!entry || !Array.isArray(existingEntries)) return false
  return existingEntries.some(
    (e) => e.title === entry.title && e.account === entry.account
  )
}

export function filterEntriesByGroup(entries, groupId) {
  if (!groupId || groupId === 'all') return entries
  return entries.filter((e) => e.groupId === groupId)
}

export function searchEntries(entries, keyword) {
  if (!keyword || !keyword.trim()) return entries
  const lower = keyword.toLowerCase().trim()
  return entries.filter(
    (e) =>
      (e.title && e.title.toLowerCase().includes(lower)) ||
      (e.account && e.account.toLowerCase().includes(lower))
  )
}

export function getGroupEntryCount(entries, groupId) {
  if (groupId === 'all') return entries.length
  return entries.filter((e) => e.groupId === groupId).length
}

export function formatTimestamp(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function exportData(entries, groups) {
  const exportEntries = entries.map((e) => ({
    ...e,
    password: encodeBase64(e.password),
  }))
  return {
    version: 1,
    exportedAt: Date.now(),
    warning: '数据仅经 Base64 编码，非真正加密',
    groups: groups.filter((g) => g.id !== 'all'),
    entries: exportEntries,
  }
}

export function importData(jsonData, existingEntries, existingGroups) {
  if (!jsonData || !jsonData.entries) {
    return { entries: existingEntries, groups: existingGroups, imported: 0, skipped: 0 }
  }

  let imported = 0
  let skipped = 0
  const newEntries = [...existingEntries]
  const newGroups = [...existingGroups]
  const existingGroupIds = new Set(newGroups.map((g) => g.id))

  const importedGroupIds = new Set()
  for (const g of jsonData.groups || []) {
    if (!existingGroupIds.has(g.id)) {
      newGroups.push(g)
      existingGroupIds.add(g.id)
    }
    importedGroupIds.add(g.id)
  }

  for (const entry of jsonData.entries) {
    const decodedEntry = {
      ...entry,
      password: decodeBase64(entry.password),
    }
    if (isDuplicateEntry(decodedEntry, newEntries)) {
      skipped += 1
    } else {
      newEntries.push(decodedEntry)
      imported += 1
    }
  }

  return { entries: newEntries, groups: newGroups, imported, skipped }
}
