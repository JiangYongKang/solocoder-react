import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './chatbot.css'
import {
  generateBotReply,
  createMessage,
  truncatePreview,
  createNewSession,
  createContextCache,
  matchFAQ,
  exportChatToTxt,
  downloadTxtFile,
  generateId,
  formatTimestamp,
  DEFAULT_QUICK_OPTIONS,
} from './chatbotCore.js'
import {
  loadSessions,
  saveSessions,
  loadCurrentSessionId,
  saveCurrentSessionId,
  loadQuickOptions,
  saveQuickOptions,
  getSessionById,
  updateSessionMessages,
  updateSessionHumanFlag,
  addSession,
  removeSession,
} from './storage.js'

function QuickOptionsModal({ options, onClose, onSave }) {
  const [localOptions, setLocalOptions] = useState(
    options.map((o) => ({ ...o, _id: o._id || generateId('qo') }))
  )

  const updateOption = (id, field, value) => {
    setLocalOptions((prev) =>
      prev.map((o) => (o._id === id ? { ...o, [field]: value } : o))
    )
  }

  const deleteOption = (id) => {
    setLocalOptions((prev) => prev.filter((o) => o._id !== id))
  }

  const addOption = () => {
    setLocalOptions((prev) => [
      ...prev,
      { _id: generateId('qo'), id: generateId('opt'), label: '', question: '' },
    ])
  }

  const handleSave = () => {
    const valid = localOptions
      .filter((o) => o.label.trim() && o.question.trim())
      .map((o) => ({ id: o.id, label: o.label.trim(), question: o.question.trim() }))
    onSave(valid.length > 0 ? valid : DEFAULT_QUICK_OPTIONS)
    onClose()
  }

  return (
    <div className="chatbot-modal-mask" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="chatbot-modal">
        <div className="chatbot-modal-header">
          <h3 className="chatbot-modal-title">编辑快捷选项</h3>
          <button className="chatbot-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="chatbot-modal-body">
          {localOptions.map((opt) => (
            <div className="quick-option-edit-row" key={opt._id}>
              <input
                className="quick-option-edit-input"
                placeholder="按钮文字"
                value={opt.label}
                onChange={(e) => updateOption(opt._id, 'label', e.target.value)}
              />
              <input
                className="quick-option-edit-input"
                placeholder="对应问题文本"
                value={opt.question}
                onChange={(e) => updateOption(opt._id, 'question', e.target.value)}
              />
              <button className="quick-option-delete-btn" onClick={() => deleteOption(opt._id)} title="删除">
                ×
              </button>
            </div>
          ))}
          <button className="quick-option-add-btn" onClick={addOption}>
            + 添加快捷选项
          </button>
        </div>
        <div className="chatbot-modal-footer">
          <button className="chatbot-modal-btn" onClick={onClose}>取消</button>
          <button className="chatbot-modal-btn primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}

export default function ChatbotPage() {
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [quickOptions, setQuickOptions] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [showQuickModal, setShowQuickModal] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)

  const messagesEndRef = useRef(null)
  const contextCachesRef = useRef({})

  useEffect(() => {
    const initialSessions = loadSessions()
    const savedCurrentId = loadCurrentSessionId()
    const savedOptions = loadQuickOptions()
    setSessions(initialSessions)
    setQuickOptions(savedOptions)
    const validCurrent = initialSessions.find((s) => s.id === savedCurrentId)
    const currentId = validCurrent ? savedCurrentId : (initialSessions[0]?.id || null)
    setCurrentSessionId(currentId)
  }, [])

  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions)
    }
  }, [sessions])

  useEffect(() => {
    if (currentSessionId) {
      saveCurrentSessionId(currentSessionId)
    }
  }, [currentSessionId])

  useEffect(() => {
    saveQuickOptions(quickOptions)
  }, [quickOptions])

  const getContextCache = useCallback((sessionId) => {
    if (!contextCachesRef.current[sessionId]) {
      const cache = createContextCache(5)
      const session = getSessionById(sessions, sessionId)
      if (session) {
        const msgs = session.messages
        for (let i = 0; i < msgs.length - 1; i += 1) {
          if (msgs[i].sender === 'user' && msgs[i + 1] && msgs[i + 1].sender === 'bot') {
            const botMsg = msgs[i + 1]
            const matched = matchFAQ(msgs[i].content)
            cache.add(msgs[i].content, botMsg.content, matched?.category || botMsg.category || null)
          }
        }
      }
      contextCachesRef.current[sessionId] = cache
    }
    return contextCachesRef.current[sessionId]
  }, [sessions])

  const currentSession = useMemo(
    () => getSessionById(sessions, currentSessionId),
    [sessions, currentSessionId]
  )

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentSession?.messages?.length])

  const handleSend = useCallback(
    (textOverride) => {
      const text = (textOverride !== undefined ? textOverride : inputValue).trim()
      if (!text || !currentSessionId) return
      if (currentSession?.isHuman) return

      const userMsg = createMessage(text, 'user')
      const currentMsgs = currentSession.messages
      const newUserMessages = [...currentMsgs, userMsg]

      const humanMatch = matchFAQ(text)
      if (humanMatch && humanMatch.category === 'human') {
        setSessions((prev) => updateSessionMessages(prev, currentSessionId, newUserMessages))
        setInputValue('')
        handleTransferToHuman()
        return
      }

      const contextCache = getContextCache(currentSessionId)
      const botReply = generateBotReply(text, contextCache)

      setTimeout(() => {
        const botMsg = createMessage(botReply.answer, 'bot')
        botMsg.category = botReply.category

        const finalMessages = [...newUserMessages, botMsg]
        setSessions((prev) => updateSessionMessages(prev, currentSessionId, finalMessages))

        if (botReply.type !== 'context') {
          contextCache.add(text, botReply.answer, botReply.category)
        }
      }, 400)

      setSessions((prev) => updateSessionMessages(prev, currentSessionId, newUserMessages))
      setInputValue('')
    },
    [inputValue, currentSession, currentSessionId, getContextCache]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickOptionClick = (option) => {
    setInputValue(option.question)
    setTimeout(() => handleSend(option.question), 50)
  }

  const handleTransferToHuman = useCallback(() => {
    if (!currentSessionId || currentSession?.isHuman || isTransferring) return
    setIsTransferring(true)

    const waitingMsg = createMessage('正在为您转接人工客服...', 'bot')
    const currentMsgs = currentSession?.messages || []
    const withWaiting = [...currentMsgs, waitingMsg]
    setSessions((prev) => updateSessionMessages(prev, currentSessionId, withWaiting))

    setTimeout(() => {
      const connectedMsg = createMessage('已为您转接人工客服，请稍候', 'bot')
      const finalMsgs = [...withWaiting, connectedMsg]
      setSessions((prev) => {
        const updated = updateSessionMessages(prev, currentSessionId, finalMsgs)
        return updateSessionHumanFlag(updated, currentSessionId, true)
      })
      setIsTransferring(false)
    }, 2500)
  }, [currentSessionId, currentSession, isTransferring])

  const handleEndHuman = () => {
    if (!currentSessionId) return
    const endMsg = createMessage('人工服务已结束，机器人服务已恢复。请问还有什么可以帮您的？', 'bot')
    setSessions((prev) => {
      const session = getSessionById(prev, currentSessionId)
      const msgs = session ? [...session.messages, endMsg] : [endMsg]
      const updated = updateSessionMessages(prev, currentSessionId, msgs)
      return updateSessionHumanFlag(updated, currentSessionId, false)
    })
  }

  const handleNewSession = () => {
    const count = sessions.length + 1
    const newSession = createNewSession(`会话 ${count}`)
    setSessions((prev) => addSession(prev, newSession))
    setCurrentSessionId(newSession.id)
    contextCachesRef.current[newSession.id] = createContextCache(5)
  }

  const handleDeleteSession = () => {
    if (!currentSessionId || sessions.length <= 1) return
    const confirmed = window.confirm('确定要删除当前会话吗？')
    if (!confirmed) return
    const nextSessions = removeSession(sessions, currentSessionId)
    setSessions(nextSessions)
    setCurrentSessionId(nextSessions[0]?.id || null)
    delete contextCachesRef.current[currentSessionId]
  }

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId)
  }

  const handleExportChat = () => {
    if (!currentSession) return
    const txt = exportChatToTxt(currentSession.messages, currentSession.name)
    const safeName = (currentSession.name || 'chat').replace(/[\\/:*?"<>|]/g, '_')
    const filename = `${safeName}_${formatTimestamp(Date.now()).replace(/[: ]/g, '-')}.txt`
    downloadTxtFile(txt, filename)
  }

  const handleSaveQuickOptions = (options) => {
    setQuickOptions(options)
  }

  const getLastPreview = (session) => {
    if (!session?.messages || session.messages.length === 0) return '暂无消息'
    const last = session.messages[session.messages.length - 1]
    const prefix = last.sender === 'user' ? '我: ' : ''
    return prefix + truncatePreview(last.content, 30)
  }

  return (
    <div className="chatbot-page">
      <div className="chatbot-back-bar">
        <button className="chatbot-back-btn" onClick={() => navigate('/')}>← 返回首页</button>
      </div>

      <div className="chatbot-layout">
        <div className="chatbot-sidebar">
          <div className="chatbot-sidebar-header">
            <h2 className="chatbot-sidebar-title">对话列表</h2>
            <button className="chatbot-new-btn" onClick={handleNewSession}>+ 新建</button>
          </div>
          <div className="chatbot-session-list">
            {sessions.length === 0 ? (
              <div className="chatbot-session-empty">暂无会话</div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`chatbot-session-item ${session.id === currentSessionId ? 'active' : ''}`}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="chatbot-session-name">
                    {session.name}
                    {session.isHuman && <span style={{ color: '#f59e0b', marginLeft: 6, fontSize: 12 }}>👤人工</span>}
                  </div>
                  <div className="chatbot-session-preview">{getLastPreview(session)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chatbot-main">
          {!currentSession ? (
            <div className="chatbot-empty">
              <div className="chatbot-empty-inner">
                <div className="chatbot-empty-icon">💬</div>
                <div className="chatbot-empty-text">请选择或创建一个会话</div>
              </div>
            </div>
          ) : (
            <>
              <div className="chatbot-header">
                <div className="chatbot-header-left">
                  <div className="chatbot-header-avatar">{currentSession.isHuman ? '👤' : '🤖'}</div>
                  <div className="chatbot-header-info">
                    <div className="chatbot-header-name">{currentSession.name}</div>
                    <div className={`chatbot-header-status ${currentSession.isHuman ? 'human' : ''}`}>
                      {currentSession.isHuman ? '● 人工服务中' : '● 在线服务中'}
                    </div>
                  </div>
                </div>
                <div className="chatbot-header-actions">
                  <button className="chatbot-action-btn" onClick={handleExportChat} title="导出聊天记录">
                    导出记录
                  </button>
                  <button className="chatbot-action-btn" onClick={handleNewSession} title="新建会话">
                    新建会话
                  </button>
                  <button
                    className="chatbot-action-btn danger"
                    onClick={handleDeleteSession}
                    title="删除当前会话"
                    disabled={sessions.length <= 1}
                  >
                    删除会话
                  </button>
                </div>
              </div>

              <div className="chatbot-quick-bar">
                {quickOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className="chatbot-quick-btn"
                    onClick={() => handleQuickOptionClick(opt)}
                    disabled={currentSession.isHuman || isTransferring}
                  >
                    {opt.label}
                  </button>
                ))}
                <button className="chatbot-quick-edit-btn" onClick={() => setShowQuickModal(true)}>
                  ⚙ 编辑
                </button>
              </div>

              <div className="chatbot-messages">
                {currentSession.messages.map((msg) => (
                  <div key={msg.id} className={`chatbot-msg-row ${msg.sender}`}>
                    <div className={`chatbot-msg-avatar ${msg.sender}`}>
                      {msg.sender === 'user' ? '我' : (currentSession.isHuman ? '人' : '机')}
                    </div>
                    <div className="chatbot-msg-content">
                      <div className={`chatbot-msg-bubble ${msg.sender}`}>{msg.content}</div>
                      <div className="chatbot-msg-time">{formatTimestamp(msg.timestamp).slice(5, 16)}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chatbot-input-wrapper">
                {currentSession.isHuman && (
                  <div className="chatbot-human-bar">
                    <span className="chatbot-human-text">⚡ 人工服务中，请耐心等待客服回复</span>
                    <button className="chatbot-end-human-btn" onClick={handleEndHuman}>结束人工</button>
                  </div>
                )}
                <div className="chatbot-input">
                  <button
                    className="chatbot-transfer-btn"
                    onClick={handleTransferToHuman}
                    disabled={currentSession.isHuman || isTransferring}
                    title="转接人工客服"
                  >
                    {isTransferring ? '转接中...' : '转接人工'}
                  </button>
                  <textarea
                    className="chatbot-input-textarea"
                    placeholder={
                      currentSession.isHuman
                        ? '人工服务中，输入已禁用'
                        : '请输入您的问题，按回车发送...'
                    }
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={currentSession.isHuman || isTransferring}
                  />
                  <button
                    className="chatbot-send-btn"
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim() || currentSession.isHuman || isTransferring}
                  >
                    发送
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showQuickModal && (
        <QuickOptionsModal
          options={quickOptions}
          onClose={() => setShowQuickModal(false)}
          onSave={handleSaveQuickOptions}
        />
      )}
    </div>
  )
}
