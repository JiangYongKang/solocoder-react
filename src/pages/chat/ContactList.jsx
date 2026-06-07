import { CONTACTS } from './data.js'
import { loadMessagesForContact, getUnreadCount, getLastMessagePreview, formatTime } from './utils.js'

export default function ContactList({ selectedId, onSelect }) {
  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <h2>消息</h2>
      </div>
      <div className="contact-list-items">
        {CONTACTS.map((contact) => {
          const messages = loadMessagesForContact(contact.id)
          const lastMsg = messages[messages.length - 1]
          const unread = getUnreadCount(contact.id)
          return (
            <div
              key={contact.id}
              className={`contact-item ${selectedId === contact.id ? 'active' : ''}`}
              onClick={() => onSelect(contact.id)}
            >
              <img className="contact-avatar" src={contact.avatar} alt={contact.name} />
              <div className="contact-info">
                <div className="contact-name-row">
                  <span className="contact-name">{contact.name}</span>
                  {lastMsg && <span className="contact-time">{formatTime(lastMsg.timestamp)}</span>}
                </div>
                <div className="contact-preview-row">
                  <span className="contact-preview">{getLastMessagePreview(messages)}</span>
                  {unread > 0 && <span className="contact-unread">{unread > 99 ? '99+' : unread}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
