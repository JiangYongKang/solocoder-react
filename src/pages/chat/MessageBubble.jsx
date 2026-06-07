import { formatTime, formatFileSize } from './utils.js'

export default function MessageBubble({ message, contact, onImageClick }) {
  const isMine = message.senderId === 'me'
  const avatar = isMine ? null : contact?.avatar

  return (
    <div className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
      {!isMine && avatar && (
        <img className="message-avatar" src={avatar} alt="" />
      )}
      <div className="message-col">
        <div className={`bubble bubble-${message.type} ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
          {message.type === 'text' && <span className="bubble-text">{message.content}</span>}
          {message.type === 'image' && (
            <img
              className="bubble-image"
              src={message.content}
              alt={message.fileName || '图片'}
              onClick={() => onImageClick?.(message.content)}
            />
          )}
          {message.type === 'file' && (
            <div className="bubble-file">
              <div className="bubble-file-icon">📄</div>
              <div className="bubble-file-info">
                <div className="bubble-file-name">{message.fileName}</div>
                <div className="bubble-file-size">{formatFileSize(message.fileSize)}</div>
              </div>
              <a
                className="bubble-file-download"
                href={message.content}
                download={message.fileName}
                onClick={(e) => e.stopPropagation()}
              >
                ⬇
              </a>
            </div>
          )}
        </div>
        <div className={`message-meta ${isMine ? 'meta-right' : 'meta-left'}`}>
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {isMine && (
            <span className={`message-status ${message.read ? 'status-read' : 'status-unread'}`}>
              {message.read ? '已读' : '未读'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
