import { useState, useRef } from 'react'
import { EMOJIS } from './data.js'
import { insertEmojiAtCursor } from './utils.js'

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const inputRef = useRef(null)
  const [cursorPos, setCursorPos] = useState(0)
  const fileInputRef = useRef(null)

  const handleSelectChange = (e) => {
    setText(e.target.value)
    setCursorPos(e.target.selectionStart)
  }

  const handleInsertEmoji = (emoji) => {
    const { text: newText, pos } = insertEmojiAtCursor(text, cursorPos, emoji)
    setText(newText)
    setCursorPos(pos)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.setSelectionRange(pos, pos)
      }
    }, 0)
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend({ type: 'text', content: trimmed })
    setText('')
    setCursorPos(0)
    setShowEmoji(false)
  }

  const syncCursorFromInput = () => {
    if (inputRef.current) {
      setCursorPos(inputRef.current.selectionStart)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
      return
    }
    const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']
    if (navKeys.includes(e.key)) {
      setTimeout(syncCursorFromInput, 0)
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      if (file.type.startsWith('image/')) {
        onSend({ type: 'image', content: dataUrl, fileName: file.name })
      } else {
        onSend({ type: 'file', content: dataUrl, fileName: file.name, fileSize: file.size })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="chat-input-wrapper">
      {showEmoji && (
        <div className="emoji-panel">
          {EMOJIS.map((emoji, idx) => (
            <button key={idx} className="emoji-btn" onClick={() => handleInsertEmoji(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
      <div className="chat-input">
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <button
          className="chat-input-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          title="发送文件/图片"
        >
          📎
        </button>
        <button
          className="chat-input-icon-btn"
          onClick={() => setShowEmoji((v) => !v)}
          title="表情"
        >
          😊
        </button>
        <input
          ref={inputRef}
          className="chat-input-text"
          type="text"
          placeholder="输入消息..."
          value={text}
          onChange={handleSelectChange}
          onKeyDown={handleKeyDown}
          onSelect={(e) => setCursorPos(e.target.selectionStart)}
          onFocus={(e) => setCursorPos(e.target.selectionStart)}
          onClick={(e) => setCursorPos(e.target.selectionStart)}
        />
        <button
          className="chat-input-send"
          onClick={handleSend}
          disabled={!text.trim()}
        >
          发送
        </button>
      </div>
    </div>
  )
}
