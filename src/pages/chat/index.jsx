import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ContactList from './ContactList.jsx'
import ChatWindow from './ChatWindow.jsx'
import './chat.css'

export default function ChatPage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(null)
  const [, setListVersion] = useState(0)

  const refreshList = useCallback(() => {
    setListVersion((v) => v + 1)
  }, [])

  const handleSelect = (id) => {
    setSelectedId(id)
  }

  const handleBackToList = () => {
    setSelectedId(null)
    refreshList()
  }

  return (
    <div className="chat-page">
      <div className="chat-back-bar">
        <button className="chat-back-btn" onClick={() => navigate('/')}>← 返回首页</button>
      </div>
      <div className="chat-layout">
        <div className={`chat-sidebar ${selectedId ? 'chat-sidebar-hidden' : ''}`}>
          <ContactList selectedId={selectedId} onSelect={handleSelect} />
        </div>
        <div className={`chat-main ${selectedId ? 'chat-main-visible' : ''}`}>
          <ChatWindow
            key={selectedId || 'empty'}
            contactId={selectedId}
            onDataChange={refreshList}
            onBackToList={selectedId ? handleBackToList : null}
          />
        </div>
      </div>
    </div>
  )
}
