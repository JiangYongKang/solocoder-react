import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './password-manager.css'
import {
  PASSWORD_DEFAULT_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  SHOW_PASSWORD_DURATION_MS,
  COPIED_FEEDBACK_DURATION_MS,
} from './constants'
import {
  generateId,
  evaluatePasswordStrength,
  generatePassword,
  hasAtLeastOneCharset,
  maskAccount,
  getMaskedPassword,
  validateMasterPassword,
  verifyMasterPassword,
  checkLock,
  recordFailedAttempt,
  resetLockState,
  isDuplicateEntry,
  filterEntriesByGroup,
  searchEntries,
  getGroupEntryCount,
  formatTimestamp,
  exportData,
  importData,
} from './utils'
import {
  loadEntries,
  saveEntries,
  loadGroups,
  saveGroups,
  addGroup,
  renameGroup,
  deleteGroup,
  isGroupNameDuplicate,
  isGroupEmpty,
  loadMasterPassword,
  saveMasterPassword,
  hasMasterPassword,
  loadLockState,
  saveLockState,
  addEntry,
  updateEntry,
  deleteEntry,
} from './storage'

function LockScreen({ onUnlock }) {
  const [isSetup] = useState(() => !hasMasterPassword())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [lockState, setLockState] = useState(() => loadLockState())
  const [remainingMs, setRemainingMs] = useState(() => {
    const info = checkLock(loadLockState())
    return info.locked ? info.remainingMs : 0
  })
  const timerRef = useRef(null)

  const lockInfo = useMemo(() => checkLock(lockState), [lockState])

  useEffect(() => {
    if (lockInfo.locked) {
      timerRef.current = setInterval(() => {
        const info = checkLock(lockState)
        if (!info.locked) {
          clearInterval(timerRef.current)
          setLockState(resetLockState())
          saveLockState(resetLockState())
          setRemainingMs(0)
        } else {
          setRemainingMs(info.remainingMs)
        }
      }, 500)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lockState, lockInfo.locked])

  const handleSetup = useCallback(() => {
    const validation = validateMasterPassword(password)
    if (!validation.valid) {
      setError(validation.error)
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    saveMasterPassword(password)
    const newLock = resetLockState()
    setLockState(newLock)
    saveLockState(newLock)
    onUnlock()
  }, [password, confirmPassword, onUnlock])

  const handleUnlock = useCallback(() => {
    if (lockInfo.locked) return
    const stored = loadMasterPassword()
    if (verifyMasterPassword(password, stored)) {
      const newLock = resetLockState()
      setLockState(newLock)
      saveLockState(newLock)
      onUnlock()
    } else {
      const newLock = recordFailedAttempt(lockState)
      setLockState(newLock)
      saveLockState(newLock)
      setError('主密码错误，请重试')
    }
  }, [password, lockState, lockInfo.locked, onUnlock])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      if (isSetup) handleSetup()
      else handleUnlock()
    }
  }, [isSetup, handleSetup, handleUnlock])

  const formatRemaining = (ms) => {
    const sec = Math.ceil(ms / 1000)
    return `${sec}秒`
  }

  return (
    <div className="pm-lock-screen">
      <div className="pm-lock-container">
        <div className="pm-lock-icon">{isSetup ? '🔐' : '🔒'}</div>
        <h1 className="pm-lock-title">{isSetup ? '设置主密码' : '解锁密码管理器'}</h1>
        <p className="pm-lock-desc">
          {isSetup ? '首次使用，请设置主密码以保护您的数据' : '请输入主密码以解锁应用'}
        </p>
        <input
          className="pm-lock-input"
          type="password"
          placeholder={isSetup ? '设置主密码（至少6位）' : '输入主密码'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {isSetup && (
          <input
            className="pm-lock-input"
            type="password"
            placeholder="确认主密码"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
          />
        )}
        <div className="pm-lock-error">{error}</div>
        {lockInfo.locked && !isSetup && (
          <div className="pm-lock-timer">
            已锁定，请等待 {formatRemaining(remainingMs)} 后重试
          </div>
        )}
        <button
          className="pm-btn pm-btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          onClick={isSetup ? handleSetup : handleUnlock}
          disabled={lockInfo.locked && !isSetup}
        >
          {isSetup ? '设置主密码' : '解锁'}
        </button>
      </div>
    </div>
  )
}

function PasswordGenerator({ onUse, initialLength }) {
  const [length, setLength] = useState(initialLength || PASSWORD_DEFAULT_LENGTH)
  const [charsetFlags, setCharsetFlags] = useState({
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: false,
  })
  const [manualPreview, setManualPreview] = useState(null)

  const preview = useMemo(() => {
    if (manualPreview) return manualPreview
    if (hasAtLeastOneCharset(charsetFlags)) {
      return generatePassword(length, charsetFlags)
    }
    return ''
  }, [length, charsetFlags, manualPreview])

  const strength = useMemo(
    () => evaluatePasswordStrength(preview, charsetFlags),
    [preview, charsetFlags]
  )

  const handleRefresh = useCallback(() => {
    if (hasAtLeastOneCharset(charsetFlags)) {
      setManualPreview(generatePassword(length, charsetFlags))
    }
  }, [length, charsetFlags])

  const toggleCharset = useCallback((key) => {
    setManualPreview(null)
    setCharsetFlags((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (!hasAtLeastOneCharset(next)) return prev
      return next
    })
  }, [])

  return (
    <div className="pm-generator-panel">
      <div className="pm-generator-header">
        <h4 className="pm-generator-title">密码生成器</h4>
      </div>
      <div className="pm-slider-row">
        <label>长度</label>
        <input
          className="pm-slider"
          type="range"
          min={PASSWORD_MIN_LENGTH}
          max={PASSWORD_MAX_LENGTH}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
        />
        <span className="pm-slider-value">{length}</span>
      </div>
      <div className="pm-charset-row">
        {[
          { key: 'uppercase', label: '大写字母' },
          { key: 'lowercase', label: '小写字母' },
          { key: 'digits', label: '数字' },
          { key: 'symbols', label: '特殊符号' },
        ].map(({ key, label }) => (
          <label className="pm-charset-label" key={key}>
            <input
              type="checkbox"
              checked={charsetFlags[key]}
              onChange={() => toggleCharset(key)}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="pm-strength-bar">
        <div className="pm-strength-indicator" style={{ background: strength.color }} />
        <span className="pm-strength-label" style={{ color: strength.color }}>
          密码强度：{strength.label}
        </span>
      </div>
      <div className="pm-generator-preview">{preview}</div>
      <div className="pm-generator-actions">
        <button className="pm-btn pm-btn-sm" onClick={handleRefresh}>🔄 刷新生成</button>
        <button className="pm-btn pm-btn-primary pm-btn-sm" onClick={() => onUse(preview)}>
          ✅ 使用此密码
        </button>
      </div>
    </div>
  )
}

function EntryForm({ entry, groups, onSave, onCancel }) {
  const isEdit = !!entry
  const currentGroupId = entry?.groupId || groups[0]?.id || ''
  const [title, setTitle] = useState(entry?.title || '')
  const [account, setAccount] = useState(entry?.account || '')
  const [password, setPassword] = useState(entry?.password || '')
  const [note, setNote] = useState(entry?.note || '')
  const [url, setUrl] = useState(entry?.url || '')
  const [groupId, setGroupId] = useState(currentGroupId)
  const [showGenerator, setShowGenerator] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSave = useCallback(() => {
    const newErrors = {}
    if (!title.trim()) newErrors.title = '标题不能为空'
    if (!account.trim()) newErrors.account = '账号不能为空'
    if (!password.trim()) newErrors.password = '密码不能为空'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const now = Date.now()
    const newEntry = {
      id: entry?.id || generateId('entry'),
      title: title.trim(),
      account: account.trim(),
      password: password.trim(),
      note: note.trim(),
      url: url.trim(),
      groupId,
      createdAt: entry?.createdAt || now,
      updatedAt: now,
    }
    onSave(newEntry)
  }, [entry, title, account, password, note, url, groupId, onSave])

  const handleUsePassword = useCallback((pwd) => {
    setPassword(pwd)
    setShowGenerator(false)
  }, [])

  return (
    <div className="pm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pm-modal">
        <h3 className="pm-modal-title">{isEdit ? '编辑条目' : '添加条目'}</h3>
        <div className="pm-form-group">
          <label className="pm-form-label">
            标题 <span className="pm-required">*</span>
          </label>
          <input
            className="pm-input"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })) }}
            placeholder="如：微信、Gmail"
          />
          {errors.title && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{errors.title}</div>}
        </div>
        <div className="pm-form-group">
          <label className="pm-form-label">
            账号 <span className="pm-required">*</span>
          </label>
          <input
            className="pm-input"
            value={account}
            onChange={(e) => { setAccount(e.target.value); setErrors((p) => ({ ...p, account: '' })) }}
            placeholder="如：user@example.com"
          />
          {errors.account && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{errors.account}</div>}
        </div>
        <div className="pm-form-group">
          <label className="pm-form-label">
            密码 <span className="pm-required">*</span>
          </label>
          <div className="pm-password-row">
            <input
              className="pm-input"
              type="text"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })) }}
              placeholder="输入或生成密码"
              style={{ fontFamily: 'var(--mono)' }}
            />
            <button
              className="pm-btn pm-btn-sm"
              onClick={() => setShowGenerator(!showGenerator)}
            >
              {showGenerator ? '收起' : '🔑 生成密码'}
            </button>
          </div>
          {errors.password && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{errors.password}</div>}
          {showGenerator && <PasswordGenerator onUse={handleUsePassword} />}
        </div>
        <div className="pm-form-group">
          <label className="pm-form-label">备注</label>
          <textarea
            className="pm-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="可选备注信息"
          />
        </div>
        <div className="pm-form-group">
          <label className="pm-form-label">URL</label>
          <input
            className="pm-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div className="pm-form-group">
          <label className="pm-form-label">分组</label>
          <select
            className="pm-select"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            {groups
              .filter((g) => g.id !== 'all')
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
          </select>
        </div>
        <div className="pm-form-actions">
          <button className="pm-btn" onClick={onCancel}>取消</button>
          <button className="pm-btn pm-btn-primary" onClick={handleSave}>
            {isEdit ? '保存修改' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = '确认', confirmDanger = true }) {
  return (
    <div className="pm-confirm-overlay">
      <div className="pm-confirm-dialog">
        <p className="pm-confirm-message">{message}</p>
        <div className="pm-confirm-actions">
          <button className="pm-btn" onClick={onCancel}>取消</button>
          <button
            className={`pm-btn ${confirmDanger ? 'pm-btn-danger' : 'pm-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function EntryCard({ entry, group, onEdit, onDelete }) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedPwd, setCopiedPwd] = useState(false)
  const [copiedAcct, setCopiedAcct] = useState(false)
  const showPwdTimerRef = useRef(null)
  const copyPwdTimerRef = useRef(null)
  const acctTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (showPwdTimerRef.current) clearTimeout(showPwdTimerRef.current)
      if (copyPwdTimerRef.current) clearTimeout(copyPwdTimerRef.current)
      if (acctTimerRef.current) clearTimeout(acctTimerRef.current)
    }
  }, [])

  const handleShowPassword = useCallback(() => {
    setShowPassword(true)
    if (showPwdTimerRef.current) clearTimeout(showPwdTimerRef.current)
    showPwdTimerRef.current = setTimeout(() => setShowPassword(false), SHOW_PASSWORD_DURATION_MS)
  }, [])

  const handleCopyPassword = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(entry.password)
      setCopiedPwd(true)
      if (copyPwdTimerRef.current) clearTimeout(copyPwdTimerRef.current)
      copyPwdTimerRef.current = setTimeout(() => setCopiedPwd(false), COPIED_FEEDBACK_DURATION_MS)
    } catch { /* no-op */ }
  }, [entry.password])

  const handleCopyAccount = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(entry.account)
      setCopiedAcct(true)
      if (acctTimerRef.current) clearTimeout(acctTimerRef.current)
      acctTimerRef.current = setTimeout(() => setCopiedAcct(false), COPIED_FEEDBACK_DURATION_MS)
    } catch { /* no-op */ }
  }, [entry.account])

  return (
    <div className="pm-entry-card" onClick={() => onEdit(entry)}>
      <div>
        <h3 className="pm-entry-title">{entry.title}</h3>
        <div className="pm-entry-row">
          <span className="pm-entry-label">账号</span>
          <span className="pm-entry-value">{maskAccount(entry.account)}</span>
          <button
            className={`pm-icon-btn ${copiedAcct ? 'copied' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleCopyAccount() }}
            title="复制账号"
          >
            {copiedAcct ? '已复制' : '📋'}
          </button>
        </div>
        <div className="pm-entry-row">
          <span className="pm-entry-label">密码</span>
          <span className="pm-entry-value">
            {showPassword ? entry.password : getMaskedPassword()}
          </span>
          <button
            className="pm-icon-btn"
            onClick={(e) => { e.stopPropagation(); handleShowPassword() }}
            title={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
          <button
            className={`pm-icon-btn ${copiedPwd ? 'copied' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleCopyPassword() }}
            title="复制密码"
          >
            {copiedPwd ? '已复制' : '📋'}
          </button>
        </div>
        <div className="pm-entry-meta">
          {group && <span className="pm-entry-group-tag">{group.name}</span>}
          <span>{formatTimestamp(entry.updatedAt)}</span>
          {entry.url && (
            <a
              className="pm-url-link"
              href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={entry.url}
            >
              🔗
            </a>
          )}
        </div>
      </div>
      <div className="pm-entry-actions">
        <button
          className="pm-icon-btn"
          onClick={(e) => { e.stopPropagation(); onEdit(entry) }}
          title="编辑"
        >
          ✏️
        </button>
        <button
          className="pm-icon-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(entry) }}
          title="删除"
          style={{ color: '#ef4444' }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}

export default function PasswordManagerPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [entries, setEntries] = useState(() => loadEntries())
  const [groups, setGroups] = useState(() => loadGroups())
  const [activeGroupId, setActiveGroupId] = useState('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [renamingGroupId, setRenamingGroupId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroupInput, setShowNewGroupInput] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [deleteGroupTarget, setDeleteGroupTarget] = useState(null)
  const fileInputRef = useRef(null)

  const persistEntries = useCallback((next) => {
    setEntries(next)
    saveEntries(next)
  }, [])

  const persistGroups = useCallback((next) => {
    setGroups(next)
    saveGroups(next)
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setUnlocked(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const filteredEntries = useMemo(() => {
    let result = filterEntriesByGroup(entries, activeGroupId)
    result = searchEntries(result, searchKeyword)
    return result.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [entries, activeGroupId, searchKeyword])

  const getGroupById = useCallback(
    (gid) => groups.find((g) => g.id === gid),
    [groups]
  )

  const handleAddEntry = useCallback(() => {
    setEditingEntry(null)
    setShowEntryForm(true)
  }, [])

  const handleEditEntry = useCallback((entry) => {
    setEditingEntry(entry)
    setShowEntryForm(true)
  }, [])

  const handleSaveEntry = useCallback((entry) => {
    if (editingEntry) {
      const next = updateEntry(entries, entry.id, entry)
      persistEntries(next)
    } else {
      if (isDuplicateEntry(entry, entries)) {
        setConfirmDialog({
          message: '已存在相同标题和账号的条目',
          confirmLabel: '确定',
          confirmDanger: false,
          onConfirm: () => setConfirmDialog(null),
        })
        return
      }
      const next = addEntry(entries, entry)
      persistEntries(next)
    }
    setShowEntryForm(false)
    setEditingEntry(null)
  }, [editingEntry, entries, persistEntries])

  const handleDeleteRequest = useCallback((entry) => {
    setDeleteTarget(entry)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      const next = deleteEntry(entries, deleteTarget.id)
      persistEntries(next)
    }
    setDeleteTarget(null)
  }, [deleteTarget, entries, persistEntries])

  const handleAddGroup = useCallback(() => {
    const name = newGroupName.trim()
    if (!name) return
    if (isGroupNameDuplicate(groups, name, null)) return
    const next = addGroup(groups, name)
    persistGroups(next)
    setNewGroupName('')
    setShowNewGroupInput(false)
  }, [newGroupName, groups, persistGroups])

  const handleStartRename = useCallback((group) => {
    setRenamingGroupId(group.id)
    setRenameValue(group.name)
  }, [])

  const handleConfirmRename = useCallback(() => {
    const name = renameValue.trim()
    if (!name || isGroupNameDuplicate(groups, name, renamingGroupId)) return
    const next = renameGroup(groups, renamingGroupId, name)
    persistGroups(next)
    setRenamingGroupId(null)
    setRenameValue('')
  }, [renameValue, groups, renamingGroupId, persistGroups])

  const handleDeleteGroupRequest = useCallback((group) => {
    if (group.id === 'all') return
    if (!isGroupEmpty(entries, group.id)) {
      setConfirmDialog({
        message: `分组「${group.name}」中仍有条目，请先迁移或删除条目后再删除分组。`,
        confirmLabel: '确定',
        confirmDanger: false,
        onConfirm: () => setConfirmDialog(null),
      })
      return
    }
    setDeleteGroupTarget(group)
  }, [entries])

  const handleDeleteGroupConfirm = useCallback(() => {
    if (deleteGroupTarget) {
      const next = deleteGroup(groups, deleteGroupTarget.id)
      persistGroups(next)
      if (activeGroupId === deleteGroupTarget.id) setActiveGroupId('all')
    }
    setDeleteGroupTarget(null)
  }, [deleteGroupTarget, groups, activeGroupId, persistGroups])

  const doExport = useCallback(() => {
    const data = exportData(entries, groups)
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `password-manager-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [entries, groups])

  const handleExport = useCallback(() => {
    setConfirmDialog({
      message: '⚠️ 数据仅经 Base64 编码，非真正加密。请妥善保管导出文件，避免泄露。确认导出？',
      confirmLabel: '确认导出',
      confirmDanger: false,
      onConfirm: () => {
        setConfirmDialog(null)
        doExport()
      },
    })
  }, [doExport])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const jsonData = JSON.parse(ev.target.result)
        const result = importData(jsonData, entries, groups)
        persistEntries(result.entries)
        persistGroups(result.groups)
        setConfirmDialog({
          message: `导入完成：新增 ${result.imported} 条，跳过 ${result.skipped} 条重复条目。`,
          confirmLabel: '确定',
          confirmDanger: false,
          onConfirm: () => setConfirmDialog(null),
        })
      } catch {
        setConfirmDialog({
          message: '导入失败：文件格式无效',
          confirmLabel: '确定',
          confirmDanger: false,
          onConfirm: () => setConfirmDialog(null),
        })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [entries, groups, persistEntries, persistGroups])

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />
  }

  return (
    <div className="pm-page">
      <header className="pm-header">
        <Link to="/" className="pm-back-link">← 返回首页</Link>
        <h1 className="pm-title">🔐 密码管理器</h1>
        <div className="pm-header-actions">
          <button className="pm-btn" onClick={handleImport}>📥 导入</button>
          <button className="pm-btn" onClick={handleExport}>📤 导出</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </header>

      <div className="pm-layout">
        <aside className="pm-sidebar">
          <div className="pm-sidebar-title">分组</div>
          <ul className="pm-group-list">
            {groups.map((group) => {
              const count = getGroupEntryCount(entries, group.id)
              const isRenaming = renamingGroupId === group.id
              return (
                <li
                  key={group.id}
                  className={`pm-group-item ${activeGroupId === group.id ? 'active' : ''}`}
                  onClick={() => {
                    if (!isRenaming) setActiveGroupId(group.id)
                  }}
                >
                  {isRenaming ? (
                    <div className="pm-rename-inline" onClick={(e) => e.stopPropagation()}>
                      <input
                        className="pm-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename() }}
                        autoFocus
                      />
                      <button className="pm-group-action-btn" onClick={handleConfirmRename}>✓</button>
                      <button className="pm-group-action-btn" onClick={() => setRenamingGroupId(null)}>✕</button>
                    </div>
                  ) : (
                    <>
                      <span className="pm-group-name">{group.name}</span>
                      <span className="pm-group-badge">{count}</span>
                      {!group.isPreset && group.id !== 'all' && (
                        <div className="pm-group-actions">
                          <button
                            className="pm-group-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleStartRename(group) }}
                            title="重命名"
                          >
                            ✏️
                          </button>
                          <button
                            className="pm-group-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleDeleteGroupRequest(group) }}
                            title="删除"
                          >
                            🗑
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="pm-sidebar-footer">
            {showNewGroupInput ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  className="pm-input"
                  placeholder="分组名称"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddGroup() }}
                  autoFocus
                />
                <button className="pm-btn pm-btn-sm pm-btn-primary" onClick={handleAddGroup}>✓</button>
                <button className="pm-btn pm-btn-sm" onClick={() => { setShowNewGroupInput(false); setNewGroupName('') }}>✕</button>
              </div>
            ) : (
              <button
                className="pm-btn pm-btn-sm"
                style={{ width: '100%' }}
                onClick={() => setShowNewGroupInput(true)}
              >
                + 新建分组
              </button>
            )}
          </div>
        </aside>

        <main className="pm-main">
          <div className="pm-toolbar">
            <input
              className="pm-search"
              placeholder="搜索标题或账号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button className="pm-btn pm-btn-primary" onClick={handleAddEntry}>
              + 添加条目
            </button>
          </div>

          <div className="pm-entries">
            {filteredEntries.length === 0 ? (
              <div className="pm-empty">
                {searchKeyword ? '没有找到匹配的条目' : '暂无密码条目，点击「添加条目」开始'}
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  group={getGroupById(entry.groupId)}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteRequest}
                />
              ))
            )}
          </div>
        </main>
      </div>

      {showEntryForm && (
        <EntryForm
          entry={editingEntry}
          groups={groups}
          onSave={handleSaveEntry}
          onCancel={() => { setShowEntryForm(false); setEditingEntry(null) }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`确定删除条目「${deleteTarget.title}」？此操作不可撤销。`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteGroupTarget && (
        <ConfirmDialog
          message={`确定删除分组「${deleteGroupTarget.name}」？`}
          onConfirm={handleDeleteGroupConfirm}
          onCancel={() => setDeleteGroupTarget(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmLabel={confirmDialog.confirmLabel}
          confirmDanger={confirmDialog.confirmDanger}
        />
      )}
    </div>
  )
}
