import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble.jsx'
import ChatInput from './ChatInput.jsx'
import ImageViewer from './ImageViewer.jsx'
import { CONTACTS } from './data.js'
import {
  ensureMessagesForContact,
  saveMessagesForContact,
  createImageMessage,
  createFileMessage,
  createRandomReply,
  createTextMessage,
  clearUnread,
  getRandomInterval,
} from './utils.js'

export default function ChatWindow({ contactId, onDataChange, onBackToList }) {
  const [messages, setMessages] = useState(() => {
    if (!contactId) return []
    return ensureMessagesForContact(contactId)
  })
  const [viewingImage, setViewingImage] = useState(null)
  const scrollRef = useRef(null)
  const timerRef = useRef(null)
  const isActiveRef = useRef(true)
  const contact = CONTACTS.find((c) => c.id === contactId)

  useEffect(() => {
    isActiveRef.current = true
    return () => {
      isActiveRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!contactId) return
    clearUnread(contactId)
    onDataChange?.()
  }, [contactId, onDataChange])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (!contactId) return

    const scheduleNext = () => {
      const interval = getRandomInterval()
      timerRef.current = setTimeout(() => {
        if (!isActiveRef.current) return
        const reply = createRandomReply(contactId)
        setMessages((prev) => {
          const replyWithRead = { ...reply, read: true }
          const next = [...prev, replyWithRead]
          saveMessagesForContact(contactId, next)
          return next
        })
        onDataChange?.()
        scheduleNext()
      }, interval)
    }

    scheduleNext()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [contactId, onDataChange])

  const handleSend = (payload) => {
    let msg
    if (payload.type === 'text') {
      msg = createTextMessage(payload.content)
    } else if (payload.type === 'image') {
      msg = createImageMessage(payload.content, payload.fileName)
    } else if (payload.type === 'file') {
      msg = createFileMessage(payload.content, payload.fileName, payload.fileSize)
    }
    if (!msg) return
    setMessages((prev) => {
      const next = [...prev, msg]
      saveMessagesForContact(contactId, next)
      return next
    })
    onDataChange?.()
  }

  if (!contact) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-inner">
          <div className="chat-empty-icon">💬</div>
          <p className="chat-empty-text">选择一个联系人开始聊天</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        {onBackToList && (
          <button className="chat-header-back" onClick={onBackToList} aria-label="返回">
            ←
          </button>
        )}
        <img className="chat-header-avatar" src={contact.avatar} alt={contact.name} />
        <div className="chat-header-info">
          <div className="chat-header-name">{contact.name}</div>
          <div className="chat-header-status">在线</div>
        </div>
      </div>
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            contact={contact}
            onImageClick={setViewingImage}
          />
        ))}
      </div>
      <ChatInput onSend={handleSend} />
      <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  )
}
