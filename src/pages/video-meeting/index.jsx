import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    CHAT_SIMULATE_INTERVAL_MAX,
    CHAT_SIMULATE_INTERVAL_MIN,
    SIMULATED_CHAT_MESSAGES,
    VIEW_MODES,
} from './constants.js'
import './video-meeting.css'
import {
    calculateGridLayout,
    createChatMessage,
    drawParticipantCanvas,
    filterParticipants,
    formatTimestamp,
    generateAvatarColor,
    generateInitialParticipants,
    generateRandomChatMessage,
    getInitials,
    getMentionSuggestions,
    getRandomChatInterval,
    insertMention,
    sortParticipantsSelfFirst,
    toggleParticipantProperty,
} from './videoMeetingCore.js'

function ParticipantCanvas({ participant, animFrame, onClick }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    drawParticipantCanvas(ctx, rect.width, rect.height, participant, animFrame)
  }, [participant, animFrame])

  return (
    <canvas
      ref={canvasRef}
      className="vm-participant-canvas"
      onClick={onClick}
    />
  )
}

function ChatPanel({ messages, onSend, participants, chatInputRef }) {
  const [inputText, setInputText] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleInputChange = (e) => {
    const text = e.target.value
    setInputText(text)
    if (chatInputRef) chatInputRef.current = e.target
    const cursorPos = e.target.selectionStart
    const suggestions = getMentionSuggestions(text, cursorPos, participants)
    if (suggestions.length > 0) {
      setMentionSuggestions(suggestions)
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  const handleSelectMention = (person) => {
    const textarea = chatInputRef?.current
    if (!textarea) return
    const cursorPos = textarea.selectionStart
    const result = insertMention(inputText, cursorPos, person.name)
    setInputText(result.text)
    setShowMentions(false)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(result.cursorPosition, result.cursorPosition)
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const text = inputText.trim()
    if (!text) return
    onSend(text)
    setInputText('')
    setShowMentions(false)
  }

  return (
    <div className="vm-chat-panel">
      <div className="vm-chat-messages">
        {messages.length === 0 && (
          <div className="vm-chat-empty">暂无消息，发送第一条吧</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="vm-chat-msg">
            <div
              className="vm-chat-avatar"
              style={{ background: generateAvatarColor(msg.senderName) }}
            >
              {getInitials(msg.senderName)}
            </div>
            <div className="vm-chat-msg-body">
              <div className="vm-chat-msg-header">
                <span className="vm-chat-msg-name">{msg.senderName}</span>
                <span className="vm-chat-msg-time">{formatTimestamp(msg.timestamp)}</span>
              </div>
              <div className="vm-chat-msg-text">{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="vm-chat-input-area">
        <div className="vm-chat-input-wrapper">
          {showMentions && (
            <div className="vm-mention-popup">
              {mentionSuggestions.map((p) => (
                <div
                  key={p.id}
                  className="vm-mention-item"
                  onClick={() => handleSelectMention(p)}
                >
                  <div
                    className="vm-mention-item-avatar"
                    style={{ background: generateAvatarColor(p.name) }}
                  >
                    {getInitials(p.name)}
                  </div>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          )}
          <textarea
            className="vm-chat-input"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... @ 提及参会人"
            rows={1}
          />
          <button
            className="vm-chat-send-btn"
            onClick={handleSend}
            disabled={!inputText.trim()}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

function ParticipantsPanel({ participants, selfId }) {
  const [searchTerm, setSearchTerm] = useState('')
  const sorted = sortParticipantsSelfFirst(participants)
  const filtered = filterParticipants(sorted, searchTerm)

  return (
    <div className="vm-participants-panel">
      <div className="vm-participants-search">
        <input
          className="vm-participants-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索参会人..."
        />
      </div>
      <div className="vm-participants-count">
        参会人 ({participants.length})
      </div>
      <div className="vm-participants-list">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`vm-participant-item ${p.id === selfId ? 'is-self' : ''} ${p.isHandRaised ? 'hand-raised' : ''}`}
          >
            <div
              className="vm-participant-avatar"
              style={{ background: generateAvatarColor(p.name) }}
            >
              {getInitials(p.name)}
            </div>
            <div className="vm-participant-info">
              <div className={`vm-participant-name ${p.id === selfId ? 'vm-participant-name-you' : ''}`}>
                {p.name}{p.id === selfId ? ' (你)' : ''}
              </div>
            </div>
            <div className="vm-participant-status-icons">
              {p.isMuted && (
                <span className="vm-status-icon muted" title="已静音">🎤</span>
              )}
              {p.isVideoOff && (
                <span className="vm-status-icon video-off" title="摄像头关闭">📹</span>
              )}
              {p.isHandRaised && (
                <span className="vm-status-icon hand-raised" title="举手">✋</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VideoMeetingPage() {
  const navigate = useNavigate()
  const [participants, setParticipants] = useState(() => generateInitialParticipants())
  const [viewMode, setViewMode] = useState(VIEW_MODES.GALLERY)
  const [speakerId, setSpeakerId] = useState('p1')
  const [meetingEnded, setMeetingEnded] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [sidePanelTab, setSidePanelTab] = useState('chat')
  const [unreadCount, setUnreadCount] = useState(0)
  const [animFrame, setAnimFrame] = useState(0)
  const [meetingDuration, setMeetingDuration] = useState(0)
  const chatInputRef = useRef(null)
  const sidePanelOpenRef = useRef(false)
  const sidePanelTabRef = useRef('chat')

  const selfParticipant = participants.find((p) => p.isSelf)

  useEffect(() => {
    sidePanelOpenRef.current = sidePanelOpen
    sidePanelTabRef.current = sidePanelTab
  }, [sidePanelOpen, sidePanelTab])

  useEffect(() => {
    if (meetingEnded) return
    const interval = setInterval(() => {
      setMeetingDuration((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [meetingEnded])

  useEffect(() => {
    if (meetingEnded) return
    let rafId
    const animate = () => {
      setAnimFrame((prev) => prev + 1)
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [meetingEnded])

  useEffect(() => {
    if (meetingEnded) return
    const scheduleNext = () => {
      const delay = getRandomChatInterval(CHAT_SIMULATE_INTERVAL_MIN, CHAT_SIMULATE_INTERVAL_MAX)
      return setTimeout(() => {
        const msg = generateRandomChatMessage(participants, null, SIMULATED_CHAT_MESSAGES)
        if (msg) {
          setChatMessages((prev) => [...prev, msg])
          if (!sidePanelOpenRef.current || sidePanelTabRef.current !== 'chat') {
            setUnreadCount((prev) => prev + 1)
          }
        }
        timerRef = scheduleNext()
      }, delay)
    }
    let timerRef = scheduleNext()
    return () => clearTimeout(timerRef)
  }, [meetingEnded, participants])

  const handleToggleMute = useCallback(() => {
    setParticipants((prev) => toggleParticipantProperty(prev, 'self', 'isMuted'))
  }, [])

  const handleToggleVideo = useCallback(() => {
    setParticipants((prev) => toggleParticipantProperty(prev, 'self', 'isVideoOff'))
  }, [])

  const handleToggleScreenShare = useCallback(() => {
    setParticipants((prev) => toggleParticipantProperty(prev, 'self', 'isScreenSharing'))
  }, [])

  const handleToggleHand = useCallback(() => {
    setParticipants((prev) => toggleParticipantProperty(prev, 'self', 'isHandRaised'))
  }, [])

  const handleHangup = useCallback(() => {
    setMeetingEnded(true)
  }, [])

  const handleRejoin = useCallback(() => {
    setMeetingEnded(false)
    setParticipants(generateInitialParticipants())
    setChatMessages([])
    setMeetingDuration(0)
    setUnreadCount(0)
    setViewMode(VIEW_MODES.GALLERY)
    setSpeakerId('p1')
  }, [])

  const handleSendChat = useCallback((text) => {
    const msg = createChatMessage('self', '我', text)
    setChatMessages((prev) => [...prev, msg])
  }, [])

  const handleOpenChat = useCallback(() => {
    if (sidePanelOpen && sidePanelTab === 'chat') {
      setSidePanelOpen(false)
    } else {
      setSidePanelOpen(true)
      setSidePanelTab('chat')
      setUnreadCount(0)
    }
  }, [sidePanelOpen, sidePanelTab])

  const handleOpenParticipants = useCallback(() => {
    if (sidePanelOpen && sidePanelTab === 'participants') {
      setSidePanelOpen(false)
    } else {
      setSidePanelOpen(true)
      setSidePanelTab('participants')
    }
  }, [sidePanelOpen, sidePanelTab])

  const handleCloseSidePanel = useCallback(() => {
    setSidePanelOpen(false)
  }, [])

  const handleSelectSpeaker = useCallback((id) => {
    setSpeakerId(id)
  }, [])

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  if (meetingEnded) {
    return (
      <div className="vm-page">
        <div className="vm-ended-overlay">
          <div className="vm-ended-icon">📞</div>
          <div className="vm-ended-text">会议已结束</div>
          <div className="vm-ended-sub">会议时长: {formatDuration(meetingDuration)}</div>
          <button className="vm-ended-rejoin-btn" onClick={handleRejoin}>
            重新加入
          </button>
          <button className="vm-back-btn" onClick={() => navigate('/')} style={{ marginTop: 8 }}>
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const { cols } = calculateGridLayout(participants.length)

  const renderGalleryView = () => (
    <div
      className="vm-gallery-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${Math.ceil(participants.length / cols)}, 1fr)`,
      }}
    >
      {participants.map((p) => (
        <div
          key={p.id}
          className={`vm-participant-cell ${p.isSelf ? 'is-self' : ''}`}
        >
          <ParticipantCanvas
            participant={p}
            animFrame={animFrame}
            isSelf={p.isSelf}
          />
        </div>
      ))}
    </div>
  )

  const renderSpeakerView = () => {
    const speaker = participants.find((p) => p.id === speakerId) || participants[0]
    const others = participants.filter((p) => p.id !== speaker?.id)

    return (
      <div className="vm-speaker-layout">
        <div className="vm-speaker-main">
          {speaker && (
            <ParticipantCanvas
              participant={speaker}
              animFrame={animFrame}
              isSelf={speaker.isSelf}
            />
          )}
        </div>
        <div className="vm-speaker-thumbnails">
          {others.map((p) => (
            <div
              key={p.id}
              className={`vm-speaker-thumb ${p.isSelf ? 'is-self' : ''}`}
              onClick={() => handleSelectSpeaker(p.id)}
            >
              <ParticipantCanvas
                participant={p}
                animFrame={animFrame}
                isSelf={p.isSelf}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="vm-page">
      <div className="vm-header">
        <div className="vm-header-left">
          <button className="vm-back-btn" onClick={() => navigate('/')}>← 返回</button>
          <h1 className="vm-meeting-title">视频会议</h1>
          <span className="vm-meeting-timer">{formatDuration(meetingDuration)}</span>
        </div>
        <div className="vm-header-right">
          <button
            className={`vm-view-btn ${viewMode === VIEW_MODES.GALLERY ? 'active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.GALLERY)}
          >
            🖼 画廊
          </button>
          <button
            className={`vm-view-btn ${viewMode === VIEW_MODES.SPEAKER ? 'active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.SPEAKER)}
          >
            🎤 演讲者
          </button>
          <button className="vm-toggle-panel-btn" onClick={handleOpenParticipants}>
            👥 参会人
          </button>
          <button className="vm-toggle-panel-btn" onClick={handleOpenChat}>
            💬 聊天
            {unreadCount > 0 && (
              <span className="vm-unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="vm-main">
        <div className="vm-content">
          {viewMode === VIEW_MODES.GALLERY ? renderGalleryView() : renderSpeakerView()}
        </div>

        <div className={`vm-side-panel ${sidePanelOpen ? '' : 'collapsed'}`}>
          {sidePanelOpen && (
            <>
              <div className="vm-panel-tabs">
                <button
                  className={`vm-panel-tab ${sidePanelTab === 'chat' ? 'active' : ''}`}
                  onClick={() => { setSidePanelTab('chat'); setUnreadCount(0) }}
                >
                  💬 聊天
                  {sidePanelTab !== 'chat' && unreadCount > 0 && (
                    <span className="vm-unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>
                <button
                  className={`vm-panel-tab ${sidePanelTab === 'participants' ? 'active' : ''}`}
                  onClick={() => setSidePanelTab('participants')}
                >
                  👥 参会人
                </button>
                <button
                  className="vm-panel-tab"
                  onClick={handleCloseSidePanel}
                  style={{ flex: '0 0 40px' }}
                >
                  ✕
                </button>
              </div>
              <div className="vm-panel-content">
                {sidePanelTab === 'chat' && (
                  <ChatPanel
                    messages={chatMessages}
                    onSend={handleSendChat}
                    participants={participants}
                    chatInputRef={chatInputRef}
                  />
                )}
                {sidePanelTab === 'participants' && (
                  <ParticipantsPanel
                    participants={participants}
                    selfId="self"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="vm-control-bar">
        <button
          className={`vm-control-btn ${selfParticipant?.isMuted ? 'muted-active' : ''}`}
          onClick={handleToggleMute}
          title={selfParticipant?.isMuted ? '取消静音' : '静音'}
        >
          <span className="vm-control-icon">{selfParticipant?.isMuted ? '🔇' : '🎤'}</span>
          <span className="vm-control-label">{selfParticipant?.isMuted ? '已静音' : '静音'}</span>
        </button>
        <button
          className={`vm-control-btn ${selfParticipant?.isVideoOff ? 'video-off-active' : ''}`}
          onClick={handleToggleVideo}
          title={selfParticipant?.isVideoOff ? '开启摄像头' : '关闭摄像头'}
        >
          <span className="vm-control-icon">{selfParticipant?.isVideoOff ? '📹' : '📹'}</span>
          <span className="vm-control-label">{selfParticipant?.isVideoOff ? '已关闭' : '摄像头'}</span>
        </button>
        <button
          className={`vm-control-btn ${selfParticipant?.isScreenSharing ? 'screen-active' : ''}`}
          onClick={handleToggleScreenShare}
          title={selfParticipant?.isScreenSharing ? '停止共享' : '屏幕共享'}
        >
          <span className="vm-control-icon">🖥️</span>
          <span className="vm-control-label">{selfParticipant?.isScreenSharing ? '共享中' : '共享'}</span>
        </button>
        <button
          className={`vm-control-btn ${selfParticipant?.isHandRaised ? 'hand-active' : ''}`}
          onClick={handleToggleHand}
          title={selfParticipant?.isHandRaised ? '放下手' : '举手'}
        >
          <span className="vm-control-icon">✋</span>
          <span className="vm-control-label">{selfParticipant?.isHandRaised ? '已举手' : '举手'}</span>
        </button>
        <button
          className="vm-control-btn hangup"
          onClick={handleHangup}
          title="挂断"
        >
          <span className="vm-control-icon">📞</span>
          <span className="vm-control-label">挂断</span>
        </button>
      </div>
    </div>
  )
}

export default VideoMeetingPage
