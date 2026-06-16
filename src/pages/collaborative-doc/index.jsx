import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './collaborative-doc.css'
import {
  loadData,
  saveData,
  getCollaboratorById,
  getOnlineCollaborators,
  getOnlineCount,
  setCollaboratorOnline,
  moveRandomCursor,
  getParagraphById,
  isParagraphLocked,
  canEditParagraph,
  getParagraphLocker,
  toggleParagraphLock,
  lockAllMyParagraphs,
  processContentChangeWithRevision,
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
  computeVersionDiff,
  createComment,
  replyToComment,
  toggleCommentResolved,
  getSortedComments,
  getCommentAuthor,
  getReplyAuthor,
  toggleRevisionMode,
  updateTitle,
  removeNotification,
  getNotificationMessage,
  simulateCollaboratorEdit,
  formatDate,
  generateId,
  lockParagraph,
  getCharOffsetPosition,
  getSelectionFromDocument,
  renderContentWithRevisions,
} from './utils.js'
import { CURRENT_USER, REVISION_TYPE } from './constants.js'

const SIDEBAR_TAB = {
  REVISIONS: 'revisions',
  VERSIONS: 'versions',
  COMMENTS: 'comments',
}

export default function CollaborativeDocPage() {
  const [data, setData] = useState(() => loadData())
  const [activeTab, setActiveTab] = useState(SIDEBAR_TAB.COMMENTS)
  const [selectedVersionId, setSelectedVersionId] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [activeCommentId, setActiveCommentId] = useState(null)
  const [replyInputs, setReplyInputs] = useState({})
  const [newComment, setNewComment] = useState({ paragraphId: null, text: '', content: '', start: 0, end: 0 })
  const [selectedText, setSelectedText] = useState(null)
  const [cursorPositions, setCursorPositions] = useState({})
  const editorRef = useRef(null)
  const paragraphRefs = useRef({})
  const cursorOverlayRef = useRef(null)
  const paragraphContents = useRef({})

  const saveTimeoutRef = useRef(null)
  const cursorTimerRef = useRef(null)
  const presenceTimerRef = useRef(null)
  const editTimerRef = useRef(null)
  const lockTimerRef = useRef(null)
  const notificationTimersRef = useRef({})
  const positionUpdateRef = useRef(null)

  const debouncedSave = useCallback((dataToSave) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveData(dataToSave)
    }, 500)
  }, [])

  useEffect(() => {
    debouncedSave(data)
  }, [data, debouncedSave])

  const scheduleRandomCursorMove = useCallback(() => {
    const delay = 3000 + Math.random() * 5000
    cursorTimerRef.current = setTimeout(() => {
      setData((prev) => {
        const online = getOnlineCollaborators(prev).filter((c) => c.id !== CURRENT_USER.id)
        if (online.length === 0) return prev
        const randomUser = online[Math.floor(Math.random() * online.length)]
        return moveRandomCursor(prev, randomUser.id)
      })
      scheduleRandomCursorMove()
    }, delay)
  }, [])

  useEffect(() => {
    scheduleRandomCursorMove()

    presenceTimerRef.current = setInterval(() => {
      setData((prev) => {
        const collaborators = prev.collaborators
        const onlineCount = getOnlineCount(prev)
        const shouldChange = Math.random() > 0.6
        if (!shouldChange) return prev

        const targetOnline = Math.min(8, Math.max(2, onlineCount + (Math.random() > 0.5 ? 1 : -1)))
        let result = prev
        if (targetOnline > onlineCount) {
          const offlineUsers = collaborators.filter((c) => !c.online)
          if (offlineUsers.length > 0) {
            const user = offlineUsers[Math.floor(Math.random() * offlineUsers.length)]
            result = setCollaboratorOnline(result, user.id, true)
          }
        } else if (targetOnline < onlineCount) {
          const onlineUsers = collaborators.filter((c) => c.online && c.id !== CURRENT_USER.id)
          if (onlineUsers.length > 0) {
            const user = onlineUsers[Math.floor(Math.random() * onlineUsers.length)]
            result = {
              ...setCollaboratorOnline(result, user.id, false),
              notifications: [
                ...result.notifications,
                {
                  id: generateId('notif'),
                  type: 'leave',
                  userId: user.id,
                  createdAt: Date.now(),
                },
              ],
            }
          }
        }
        return result
      })
    }, 8000)

    editTimerRef.current = setInterval(() => {
      setData((prev) => {
        if (Math.random() > 0.4) return prev
        const online = getOnlineCollaborators(prev).filter((c) => c.id !== CURRENT_USER.id)
        if (online.length === 0) return prev
        const randomUser = online[Math.floor(Math.random() * online.length)]
        return simulateCollaboratorEdit(prev, randomUser.id)
      })
    }, 10000)

    lockTimerRef.current = setInterval(() => {
      setData((prev) => {
        if (Math.random() > 0.7) return prev
        const online = getOnlineCollaborators(prev).filter((c) => c.id !== CURRENT_USER.id)
        if (online.length === 0) return prev
        const randomUser = online[Math.floor(Math.random() * online.length)]
        const unlockedParas = prev.paragraphs.filter((p) => !p.lockedBy)
        if (unlockedParas.length === 0) return prev
        const randomPara = unlockedParas[Math.floor(Math.random() * unlockedParas.length)]
        return lockParagraph(prev, randomPara.id, randomUser.id)
      })
    }, 15000)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current)
      if (presenceTimerRef.current) clearInterval(presenceTimerRef.current)
      if (editTimerRef.current) clearInterval(editTimerRef.current)
      if (lockTimerRef.current) clearInterval(lockTimerRef.current)
      if (positionUpdateRef.current) clearInterval(positionUpdateRef.current)
      Object.values(notificationTimersRef.current).forEach((t) => clearTimeout(t))
    }
  }, [scheduleRandomCursorMove])

  useEffect(() => {
    const updateCursorPositions = () => {
      if (!editorRef.current) return

      const positions = {}
      for (const cursor of data.cursors) {
        const paraEl = paragraphRefs.current[cursor.paragraphId]
        if (paraEl) {
          const pos = getCharOffsetPosition(paraEl, cursor.offset)
          const paraRect = paraEl.getBoundingClientRect()
          const editorRect = editorRef.current.getBoundingClientRect()
          positions[cursor.userId] = {
            x: pos.x + (paraRect.left - editorRect.left),
            y: pos.y + (paraRect.top - editorRect.top),
            paragraphId: cursor.paragraphId,
          }
        }
      }
      setCursorPositions(positions)
    }

    updateCursorPositions()
    positionUpdateRef.current = setInterval(updateCursorPositions, 500)

    return () => {
      if (positionUpdateRef.current) clearInterval(positionUpdateRef.current)
    }
  }, [data.cursors, data.paragraphs])

  useEffect(() => {
    data.notifications.forEach((notif) => {
      if (!notificationTimersRef.current[notif.id]) {
        notificationTimersRef.current[notif.id] = setTimeout(() => {
          setData((prev) => removeNotification(prev, notif.id))
          delete notificationTimersRef.current[notif.id]
        }, 4000)
      }
    })
  }, [data.notifications])

  useEffect(() => {
    const handleSelectionChange = () => {
      if (!editorRef.current) return
      const selection = getSelectionFromDocument(editorRef.current)
      if (selection) {
        setSelectedText(selection)
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  const onlineCollaborators = useMemo(() => getOnlineCollaborators(data), [data])
  const onlineCount = useMemo(() => getOnlineCount(data), [data])
  const pendingRevisions = useMemo(() => getPendingRevisions(data), [data])
  const sortedVersions = useMemo(() => getSortedVersions(data), [data])
  const sortedComments = useMemo(() => getSortedComments(data), [data])

  const handleToggleLock = useCallback((paragraphId) => {
    setData((prev) => toggleParagraphLock(prev, paragraphId, CURRENT_USER.id))
  }, [])

  const handleLockAllMine = useCallback(() => {
    setData((prev) => lockAllMyParagraphs(prev, CURRENT_USER.id))
  }, [])

  const handleParagraphFocus = useCallback((paragraphId) => {
    const para = getParagraphById(data, paragraphId)
    if (para) {
      paragraphContents.current[paragraphId] = para.content
    }
  }, [data])

  const handleParagraphBlur = useCallback((paragraphId, newContent) => {
    const oldContent = paragraphContents.current[paragraphId]
    if (oldContent === newContent) return

    setData((prev) => {
      if (!canEditParagraph(prev, paragraphId, CURRENT_USER.id)) {
        const locker = getParagraphLocker(prev, paragraphId)
        if (locker) {
          alert(`此段落已被 ${locker.name} 锁定`)
        }
        return prev
      }
      return processContentChangeWithRevision(prev, paragraphId, oldContent || '', newContent, CURRENT_USER.id)
    })

    paragraphContents.current[paragraphId] = newContent
  }, [])

  const handleTitleChange = useCallback((e) => {
    setData((prev) => updateTitle(prev, e.target.value))
  }, [])

  const handleToggleRevisionMode = useCallback(() => {
    setData((prev) => toggleRevisionMode(prev))
  }, [])

  const handleAcceptRevision = useCallback((revisionId) => {
    setData((prev) => acceptRevision(prev, revisionId))
  }, [])

  const handleRejectRevision = useCallback((revisionId) => {
    setData((prev) => rejectRevision(prev, revisionId))
  }, [])

  const handleAcceptAll = useCallback(() => {
    setData((prev) => acceptAllRevisions(prev))
  }, [])

  const handleRejectAll = useCallback(() => {
    setData((prev) => rejectAllRevisions(prev))
  }, [])

  const handleSaveVersion = useCallback(() => {
    setData((prev) => createVersion(prev))
  }, [])

  const handleSelectVersion = useCallback((versionId) => {
    setSelectedVersionId(versionId)
    setCompareMode(true)
  }, [])

  const handleExitCompare = useCallback(() => {
    setCompareMode(false)
    setSelectedVersionId(null)
  }, [])

  const handleRestoreVersion = useCallback(() => {
    if (!selectedVersionId) return
    setData((prev) => restoreToVersion(prev, selectedVersionId))
    setCompareMode(false)
    setSelectedVersionId(null)
  }, [selectedVersionId])

  const handleAddComment = useCallback(() => {
    if (!newComment.content.trim()) return

    const paragraphId = newComment.paragraphId || selectedText?.paragraphId
    const text = newComment.text || selectedText?.text || ''

    if (!paragraphId) {
      alert('请先在文档中选中要批注的文字')
      return
    }

    setData((prev) =>
      createComment(
        prev,
        paragraphId,
        text,
        newComment.content.trim(),
        CURRENT_USER.id
      )
    )
    setNewComment({ paragraphId: null, text: '', content: '', start: 0, end: 0 })
    setSelectedText(null)
    if (window.getSelection()) {
      window.getSelection().removeAllRanges()
    }
  }, [newComment, selectedText])

  const handleQuickComment = useCallback(() => {
    if (!selectedText) {
      alert('请先在文档中选中要批注的文字')
      return
    }
    setNewComment({
      paragraphId: selectedText.paragraphId,
      text: selectedText.text,
      content: '',
      start: selectedText.start,
      end: selectedText.end,
    })
  }, [selectedText])

  const handleReply = useCallback((commentId) => {
    const content = replyInputs[commentId]
    if (!content?.trim()) return
    setData((prev) => replyToComment(prev, commentId, content.trim(), CURRENT_USER.id))
    setReplyInputs((prev) => ({ ...prev, [commentId]: '' }))
  }, [replyInputs])

  const handleToggleResolved = useCallback((commentId) => {
    setData((prev) => toggleCommentResolved(prev, commentId))
  }, [])

  const handleClickComment = useCallback((commentId, paragraphId) => {
    setActiveCommentId(commentId)
    const paraEl = paragraphRefs.current[paragraphId]
    if (paraEl) {
      paraEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const versionDiff = useMemo(() => {
    if (!compareMode || !selectedVersionId) return null
    const oldVersion = getVersionById(data, selectedVersionId)
    const currentVersion = { paragraphs: data.paragraphs }
    return computeVersionDiff(oldVersion, currentVersion)
  }, [compareMode, selectedVersionId, data.paragraphs])

  const renderDiffContent = (segments, side) => {
    return segments.map((seg, idx) => {
      if (seg.type === 'equal') {
        return <span key={idx}>{seg.value}</span>
      }
      if (seg.type === 'added') {
        return side === 'new' ? (
          <span key={idx} className="cd-diff-added">{seg.value}</span>
        ) : null
      }
      if (seg.type === 'removed') {
        return side === 'old' ? (
          <span key={idx} className="cd-diff-removed">{seg.value}</span>
        ) : null
      }
      if (seg.type === 'modified') {
        return side === 'old' ? (
          <span key={idx} className="cd-diff-removed">{seg.oldValue}</span>
        ) : (
          <span key={idx} className="cd-diff-modified">{seg.newValue}</span>
        )
      }
      return null
    })
  }

  const renderContentSegments = (paragraph, revisions) => {
    const segments = renderContentWithRevisions(paragraph.content, revisions, data)

    return segments.map((seg, idx) => {
      const baseKey = `${paragraph.id}-seg-${idx}`
      if (seg.type === 'text') {
        return <span key={baseKey}>{seg.value}</span>
      }

      const rev = seg.revision
      const author = seg.author
      const time = formatDate(rev.createdAt)

      let className = ''
      if (rev.type === REVISION_TYPE.ADD) {
        className = 'cd-revision-add'
      } else if (rev.type === REVISION_TYPE.DELETE) {
        className = 'cd-revision-delete'
      } else if (rev.type === REVISION_TYPE.FORMAT) {
        className = 'cd-revision-format'
      }

      const tooltip = rev.type === REVISION_TYPE.ADD
        ? `添加: ${author?.name || '未知'} · ${time}`
        : rev.type === REVISION_TYPE.DELETE
          ? `删除: ${author?.name || '未知'} · ${time}`
          : `格式(${rev.format}): ${author?.name || '未知'} · ${time}`

      return (
        <span key={baseKey} className={className.trim()} title={tooltip}>
          {seg.value}
          <span className="cd-revision-tooltip">{tooltip}</span>
        </span>
      )
    })
  }

  const renderParagraph = (paragraph, idx) => {
    const revisions = data.revisionMode ? getRevisionsByParagraph(data, paragraph.id) : []
    const paragraphComments = sortedComments.filter((c) => c.paragraphId === paragraph.id && !c.resolved)
    const locker = getParagraphLocker(data, paragraph.id)
    const locked = isParagraphLocked(data, paragraph.id)
    const canEdit = canEditParagraph(data, paragraph.id, CURRENT_USER.id)

    const paraStyle = idx === 0
      ? { fontWeight: 600, fontSize: 18 }
      : idx === 3 || idx === 5
        ? { fontWeight: 600, fontSize: 16, marginTop: 20 }
        : {}

    const shouldRenderSegments = revisions.length > 0 || formatRanges.length > 0

    return (
      <div
        key={paragraph.id}
        className="cd-paragraph-wrapper"
      >
        <button
          className="cd-paragraph-lock-btn"
          onClick={() => handleToggleLock(paragraph.id)}
          title={locked ? (locker ? `已被 ${locker.name} 锁定` : '已锁定') : '点击锁定此段落'}
        >
          {locked ? '🔒' : '🔓'}
        </button>

        <div
          ref={(el) => (paragraphRefs.current[paragraph.id] = el)}
          data-paragraph-id={paragraph.id}
          className={`cd-paragraph ${locked ? 'locked' : ''}`}
          contentEditable={canEdit}
          suppressContentEditableWarning
          onFocus={() => handleParagraphFocus(paragraph.id)}
          onBlur={(e) => handleParagraphBlur(paragraph.id, e.target.innerText)}
          style={paraStyle}
        >
          {shouldRenderSegments ? renderContentSegments(paragraph, revisions) : paragraph.content}
        </div>

        {locked && locker && (
          <div className="cd-lock-info">
            🔒 此段落已被 <strong style={{ color: locker.color }}>{locker.name}</strong> 锁定
          </div>
        )}

        {paragraphComments.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {paragraphComments.map((c) => (
              <span
                key={c.id}
                className={`cd-comment-highlight ${activeCommentId === c.id ? 'active' : ''}`}
                style={{ fontSize: 11, padding: '2px 6px', borderRadius: 3 }}
                onClick={() => handleClickComment(c.id, paragraph.id)}
              >
                💬 {c.replies.length + 1} 条讨论
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderCursors = () => {
    return data.cursors.map((cursor) => {
      const collab = getCollaboratorById(data, cursor.userId)
      const pos = cursorPositions[cursor.userId]
      if (!collab || !pos) return null

      return (
        <div
          key={cursor.userId}
          className="cd-cursor"
          style={{
            position: 'absolute',
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            background: collab.color,
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          <span className="cd-cursor-label" style={{ background: collab.color }}>
            {collab.name}
          </span>
        </div>
      )
    })
  }

  return (
    <div className="cd-container">
      <div className="cd-header">
        <div className="cd-header-left">
          <input
            type="text"
            className="cd-title-input"
            value={data.title}
            onChange={handleTitleChange}
          />
        </div>
        <div className="cd-header-right">
          <div className="cd-online-status">
            <span className="cd-online-dot"></span>
            <span>{onlineCount} 人在线</span>
          </div>
          <div className="cd-avatars">
            {onlineCollaborators.slice(0, 5).map((c) => {
              const collab = getCollaboratorById(data, c.id)
              return (
                <div
                  key={c.id}
                  className="cd-avatar"
                  style={{ background: collab?.color || '#ccc' }}
                  title={c.name}
                >
                  {c.initials}
                </div>
              )
            })}
            {onlineCollaborators.length > 5 && (
              <div className="cd-avatar" style={{ background: '#999' }}>
                +{onlineCollaborators.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cd-toolbar">
        <button
          className={`cd-toolbar-btn ${data.revisionMode ? 'active' : ''}`}
          onClick={handleToggleRevisionMode}
        >
          {data.revisionMode ? '✓ 修订模式开' : '修订模式'}
        </button>
        <button className="cd-toolbar-btn" onClick={handleLockAllMine}>
          🔒 锁定所有我的段落
        </button>
        <div className="cd-toolbar-separator" />
        <button className="cd-toolbar-btn" onClick={handleSaveVersion}>
          💾 保存版本
        </button>
        {data.revisionMode && pendingRevisions.length > 0 && (
          <>
            <button className="cd-toolbar-btn" onClick={handleAcceptAll}>
              ✓ 接受全部 ({pendingRevisions.length})
            </button>
            <button className="cd-toolbar-btn" onClick={handleRejectAll}>
              ✗ 拒绝全部
            </button>
          </>
        )}
        <div style={{ flex: 1 }} />
        {selectedText && (
          <span style={{ fontSize: 12, color: '#666', marginRight: 8 }}>
            已选中: "{selectedText.text.slice(0, 15)}{selectedText.text.length > 15 ? '...' : ''}"
          </span>
        )}
        <button
          className="cd-add-comment-btn"
          onClick={handleQuickComment}
        >
          💬 添加批注
        </button>
      </div>

      {newComment.content !== '' || newComment.paragraphId ? (
        <div style={{ padding: '8px 24px', background: '#fffde7', borderBottom: '1px solid #fbc02d', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>
            批注原文: "{newComment.text?.slice(0, 20) || selectedText?.text?.slice(0, 20) || ''}..."
          </span>
          <input
            type="text"
            placeholder="输入批注内容..."
            value={newComment.content}
            onChange={(e) => setNewComment((p) => ({ ...p, content: e.target.value }))}
            style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4 }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            autoFocus
          />
          <button
            onClick={handleAddComment}
            style={{ padding: '6px 14px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            添加
          </button>
          <button
            onClick={() => {
              setNewComment({ paragraphId: null, text: '', content: '', start: 0, end: 0 })
              setSelectedText(null)
            }}
            style={{ padding: '6px 10px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
          >
            取消
          </button>
        </div>
      ) : null}

      <div className="cd-main">
        <div className="cd-sidebar-left">
          <div className="cd-sidebar-title">协作者 ({onlineCollaborators.length})</div>
          <div className="cd-collaborator-list">
            {onlineCollaborators.map((c) => {
              const collab = getCollaboratorById(data, c.id)
              return (
                <div key={c.id} className="cd-collaborator-item">
                  <div
                    className="cd-avatar"
                    style={{ background: collab?.color || '#ccc', marginLeft: 0 }}
                  >
                    {c.initials}
                  </div>
                  <div className="cd-collaborator-info">
                    <div className="cd-collaborator-name">{c.name}</div>
                    <div className="cd-collaborator-status">{c.status}</div>
                  </div>
                  <span className="cd-online-badge" />
                </div>
              )
            })}
            {data.collaborators.filter((c) => !c.online).map((c) => {
              const collab = getCollaboratorById(data, c.id)
              return (
                <div key={c.id} className="cd-collaborator-item" style={{ opacity: 0.5 }}>
                  <div
                    className="cd-avatar"
                    style={{ background: collab?.color || '#ccc', marginLeft: 0, filter: 'grayscale(100%)' }}
                  >
                    {c.initials}
                  </div>
                  <div className="cd-collaborator-info">
                    <div className="cd-collaborator-name">{c.name}</div>
                    <div className="cd-collaborator-status">离线</div>
                  </div>
                  <span className="cd-offline-badge">离线</span>
                </div>
              )
            })}
          </div>
        </div>

        {compareMode && versionDiff ? (
          <div className="cd-diff-view">
            <div className="cd-diff-pane">
              <div className="cd-diff-pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>历史版本: {getVersionById(data, selectedVersionId)?.title || ''}</span>
                <button className="cd-back-btn" onClick={handleExitCompare}>← 退出对比</button>
              </div>
              {versionDiff.map((pd, idx) => (
                <div key={idx} style={{ marginBottom: 16, lineHeight: 1.8 }}>
                  {pd.diff.segments.map((seg, i) => renderDiffContent([seg], 'old'))}
                </div>
              ))}
            </div>
            <div className="cd-diff-pane">
              <div className="cd-diff-pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>当前版本</span>
                <button className="cd-restore-btn" onClick={handleRestoreVersion}>恢复到此版本</button>
              </div>
              {versionDiff.map((pd, idx) => (
                <div key={idx} style={{ marginBottom: 16, lineHeight: 1.8 }}>
                  {pd.diff.segments.map((seg, i) => renderDiffContent([seg], 'new'))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="cd-editor-container" ref={editorRef}>
            <div className="cd-document">
              {data.paragraphs.map((p, idx) => renderParagraph(p, idx))}
            </div>
            <div ref={cursorOverlayRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
              {renderCursors()}
            </div>
          </div>
        )}

        <div className="cd-sidebar-right">
          <div className="cd-sidebar-tabs">
            <button
              className={`cd-sidebar-tab ${activeTab === SIDEBAR_TAB.COMMENTS ? 'active' : ''}`}
              onClick={() => setActiveTab(SIDEBAR_TAB.COMMENTS)}
            >
              💬 批注 ({sortedComments.filter((c) => !c.resolved).length})
            </button>
            <button
              className={`cd-sidebar-tab ${activeTab === SIDEBAR_TAB.REVISIONS ? 'active' : ''}`}
              onClick={() => setActiveTab(SIDEBAR_TAB.REVISIONS)}
            >
              ✏️ 修订 ({pendingRevisions.length})
            </button>
            <button
              className={`cd-sidebar-tab ${activeTab === SIDEBAR_TAB.VERSIONS ? 'active' : ''}`}
              onClick={() => setActiveTab(SIDEBAR_TAB.VERSIONS)}
            >
              📜 版本 ({sortedVersions.length})
            </button>
          </div>

          {activeTab === SIDEBAR_TAB.COMMENTS && (
            <div className="cd-comment-list">
              {sortedComments.length === 0 && (
                <div className="cd-empty-state">暂无批注，在文档中选中文字后点击"添加批注"</div>
              )}
              {sortedComments.map((comment) => {
                const author = getCommentAuthor(data, comment)
                const isActive = activeCommentId === comment.id
                return (
                  <div
                    key={comment.id}
                    className={`cd-comment-item ${isActive ? 'active' : ''} ${comment.resolved ? 'resolved' : ''}`}
                    onClick={() => handleClickComment(comment.id, comment.paragraphId)}
                  >
                    <div className="cd-comment-header">
                      <div
                        className="cd-avatar"
                        style={{ background: author?.color || '#ccc', marginLeft: 0, width: 24, height: 24, fontSize: 10 }}
                      >
                        {author?.initials || '?'}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{author?.name || '未知用户'}</span>
                      <span className="cd-comment-time">{formatDate(comment.createdAt)}</span>
                      <button
                        className={`cd-resolve-btn ${comment.resolved ? 'resolved' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleResolved(comment.id)
                        }}
                      >
                        {comment.resolved ? '✓ 已解决' : '标记解决'}
                      </button>
                    </div>
                    {!comment.resolved && (
                      <>
                        <div className="cd-comment-text">"{comment.text}"</div>
                        <div className="cd-comment-content">{comment.content}</div>
                        {comment.replies.length > 0 && (
                          <div className="cd-comment-replies">
                            {comment.replies.map((reply) => {
                              const replyAuthor = getReplyAuthor(data, reply)
                              return (
                                <div key={reply.id} className="cd-reply-item">
                                  <div style={{ fontSize: 11, color: '#666' }}>
                                    <strong style={{ color: replyAuthor?.color }}>{replyAuthor?.name}</strong> · {formatDate(reply.createdAt)}
                                  </div>
                                  <div className="cd-reply-content">{reply.content}</div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <div className="cd-comment-input" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="回复..."
                            value={replyInputs[comment.id] || ''}
                            onChange={(e) => setReplyInputs((p) => ({ ...p, [comment.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleReply(comment.id)
                            }}
                          />
                          <button onClick={() => handleReply(comment.id)}>回复</button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === SIDEBAR_TAB.REVISIONS && (
            <div className="cd-revision-list">
              {pendingRevisions.length === 0 && (
                <div className="cd-empty-state">暂无待处理的修订</div>
              )}
              {pendingRevisions.map((rev) => {
                const author = getCollaboratorById(data, rev.userId)
                const para = getParagraphById(data, rev.paragraphId)
                return (
                  <div key={rev.id} className="cd-revision-item">
                    <div>
                      <span className={`cd-revision-type-badge ${rev.type}`}>
                        {rev.type === REVISION_TYPE.ADD ? '+ 新增' : rev.type === REVISION_TYPE.DELETE ? '- 删除' : `~ 格式(${rev.format})`}
                      </span>
                      <span style={{ fontSize: 12, color: '#666' }}>
                        {author?.name} · {formatDate(rev.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>
                      段落: {para?.content.slice(0, 20)}...
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, padding: '4px 6px', background: '#f5f5f5', borderRadius: 3 }}>
                      "{rev.text}"
                    </div>
                    <div className="cd-revision-actions">
                      <button className="accept" onClick={() => handleAcceptRevision(rev.id)}>接受</button>
                      <button className="reject" onClick={() => handleRejectRevision(rev.id)}>拒绝</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === SIDEBAR_TAB.VERSIONS && (
            <div className="cd-version-list">
              {sortedVersions.map((v) => (
                <div
                  key={v.id}
                  className={`cd-version-item ${selectedVersionId === v.id ? 'active' : ''}`}
                  onClick={() => handleSelectVersion(v.id)}
                >
                  <div className="cd-version-title">{v.title}</div>
                  <div className="cd-version-time">{formatDate(v.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.notifications.map((notif) => (
        <div key={notif.id} className="cd-notification">
          {getNotificationMessage(data, notif)}
        </div>
      ))}
    </div>
  )
}
