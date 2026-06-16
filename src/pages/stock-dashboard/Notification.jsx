import { useEffect, useState } from 'react'

const Notification = ({ notifications, onRemove }) => {
  return (
    <div className="notification-container">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

const NotificationItem = ({ notification, onRemove }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        onRemove(notification.id)
      }, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [notification.id, onRemove])

  if (!visible) return null

  return (
    <div className="notification">
      <h4 className="notification-title">⚠️ 价格预警</h4>
      <p className="notification-message">{notification.message}</p>
    </div>
  )
}

export default Notification
