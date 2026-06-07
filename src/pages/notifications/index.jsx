import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  NOTIFICATION_TYPES,
  TYPE_LABELS,
  TYPE_ICONS,
  DEFAULT_PREFS,
} from './constants.js'

import {
  loadNotifications,
  saveNotifications,
  loadPrefs,
  savePrefs,
  markAsRead,
  markAllAsRead,
  markAllOfTypeAsRead,
  addNotification,
  groupByType,
  getUnreadCount,
  getUnreadCountByType,
  formatTime,
  createNotification,
  pickRandomEnabledType,
  updatePref,
  formatBadgeCount,
} from './notificationsUtils.js'

import './notifications.css'

const ALL_TABS = [
  { key: 'all', label: '全部通知' },
  { key: NOTIFICATION_TYPES.SYSTEM, label: TYPE_LABELS[NOTIFICATION_TYPES.SYSTEM] },
  { key: NOTIFICATION_TYPES.MESSAGE, label: TYPE_LABELS[NOTIFICATION_TYPES.MESSAGE] },
  { key: NOTIFICATION_TYPES.TASK, label: TYPE_LABELS[NOTIFICATION_TYPES.TASK] },
  { key: 'archived', label: '历史通知' },
]

function NotificationCard({ notification, isNew, onMarkRead, onToggleExpand, expanded }) {
  const isRead = notification.read

  return (
    <div className={`notif-card ${isRead ? 'notif-card-read' : ''} ${isNew ? 'notif-card-new' : ''}`}>
      <div className={`notif-dot ${isRead ? 'notif-dot-read' : ''}`} />
      <div className="notif-icon">{TYPE_ICONS[notification.type]}</div>
      <div className="notif-body">
        <div className="notif-card-header">
          <h4 className="notif-title-sm">{notification.title}</h4>
          <span className="notif-time">{formatTime(notification.createdAt)}</span>
        </div>
        <p className="notif-summary">{notification.summary}</p>
        {expanded && (
          <p className="notif-content">{notification.content}</p>
        )}
        <div className="notif-card-actions">
          {!isRead && (
            <button
              className="notif-link-btn"
              onClick={() => onMarkRead(notification.id)}
            >
              标为已读
            </button>
          )}
          <button
            className="notif-link-btn"
            onClick={() => onToggleExpand(notification.id)}
          >
            {expanded ? '收起详情' : '查看详情'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PrefsPanel({ prefs, onClose, onTogglePref }) {
  return (
    <>
      <div className="notif-overlay" onClick={onClose} />
      <aside className="notif-prefs-panel" role="dialog" aria-label="通知偏好设置">
        <div className="notif-prefs-header">
          <h2>通知偏好设置</h2>
          <button className="notif-prefs-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="notif-prefs-body">
          <p className="notif-prefs-desc">
            选择您希望接收哪些类型的通知推送。关闭的类型将不再生成模拟通知。
          </p>
          {Object.entries(DEFAULT_PREFS).map(([type]) => (
            <div className="notif-pref-item" key={type}>
              <div className="notif-pref-info">
                <div className="notif-pref-icon">{TYPE_ICONS[type]}</div>
                <div className="notif-pref-text">
                  <div className="notif-pref-label">{TYPE_LABELS[type]}</div>
                  <div className="notif-pref-sub">
                    {prefs[type] ? '已开启推送' : '已关闭推送'}
                  </div>
                </div>
              </div>
              <button
                className={`notif-toggle ${prefs[type] ? 'notif-toggle-on' : ''}`}
                onClick={() => onTogglePref(type, !prefs[type])}
                aria-label={`切换${TYPE_LABELS[type]}推送`}
              />
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}

function NotificationsPage() {
  const navigate = useNavigate()
  const timerRef = useRef(null)
  const prefsRef = useRef(null)
  const originalFaviconRef = useRef(null)
  const faviconLinkRef = useRef(null)

  const [state, setState] = useState(() => loadNotifications())
  const [prefs, setPrefs] = useState(() => loadPrefs())
  const [activeTab, setActiveTab] = useState('all')
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [showPrefs, setShowPrefs] = useState(false)
  const [newIds, setNewIds] = useState(() => new Set())

  const totalUnread = useMemo(
    () => getUnreadCount(state.active),
    [state.active]
  )

  useEffect(() => {
    const prevTitle = document.title
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) 通知中心 - Solocoder React`
    } else {
      document.title = '通知中心 - Solocoder React'
    }

    if (!faviconLinkRef.current) {
      let link = document.querySelector('link[rel="icon"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      faviconLinkRef.current = link
      originalFaviconRef.current = link.href
    }

    const linkEl = faviconLinkRef.current
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')

    if (totalUnread <= 0) {
      if (originalFaviconRef.current) {
        linkEl.href = originalFaviconRef.current
      }
    } else {
      ctx.fillStyle = '#1677ff'
      ctx.fillRect(0, 0, 32, 32)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const text = formatBadgeCount(totalUnread)
      ctx.fillText(text, 16, 17)

      linkEl.href = canvas.toDataURL('image/png')
    }

    return () => {
      document.title = prevTitle
      if (faviconLinkRef.current && originalFaviconRef.current) {
        faviconLinkRef.current.href = originalFaviconRef.current
      }
    }
  }, [totalUnread])

  useEffect(() => {
    saveNotifications(state)
  }, [state])

  useEffect(() => {
    savePrefs(prefs)
    prefsRef.current = prefs
  }, [prefs])

  useEffect(() => {
    let cancelled = false
    if (!prefsRef.current) {
      prefsRef.current = loadPrefs()
    }

    const scheduleNext = () => {
      const delay = 10000 + Math.random() * 20000
      timerRef.current = setTimeout(() => {
        if (cancelled) return
        const type = pickRandomEnabledType(prefsRef.current || loadPrefs())
        if (type) {
          const notification = createNotification(type)
          setState((prev) => addNotification(prev, notification))
          setNewIds((prev) => {
            const next = new Set(prev)
            next.add(notification.id)
            return next
          })
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev)
              next.delete(notification.id)
              return next
            })
          }, 600)
        }
        scheduleNext()
      }, delay)
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleMarkRead = useCallback((id) => {
    setState((prev) => markAsRead(prev, id))
  }, [])

  const handleMarkAllRead = useCallback(() => {
    setState((prev) => markAllAsRead(prev))
  }, [])

  const handleMarkTypeRead = useCallback((type) => {
    setState((prev) => markAllOfTypeAsRead(prev, type))
  }, [])

  const handleToggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleTogglePref = useCallback((type, enabled) => {
    setPrefs((prev) => updatePref(prev, type, enabled))
  }, [])

  const activeGroups = useMemo(() => groupByType(state.active), [state.active])

  const displayedNotifications = useMemo(() => {
    if (activeTab === 'all') {
      return state.active
    }
    if (activeTab === 'archived') {
      return state.archived
    }
    return activeGroups[activeTab] || []
  }, [activeTab, state.active, state.archived, activeGroups])

  const getTabCount = useCallback((tabKey) => {
    if (tabKey === 'all') {
      return state.active.length
    }
    if (tabKey === 'archived') {
      return state.archived.length
    }
    return (activeGroups[tabKey] || []).length
  }, [state.active, state.archived, activeGroups])

  const getTabUnread = useCallback((tabKey) => {
    if (tabKey === 'all') {
      return totalUnread
    }
    if (tabKey === 'archived') {
      return 0
    }
    return getUnreadCountByType(state.active, tabKey)
  }, [state.active, totalUnread])

  return (
    <div className="notif-page">
      <header className="notif-header">
        <div className="notif-header-left">
          <button className="notif-back-link" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <div className="notif-title-row">
            <h1 className="notif-title">
              通知中心
              <span className={`notif-badge ${totalUnread === 0 ? 'notif-badge-hidden' : ''}`}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            </h1>
          </div>
        </div>
        <div className="notif-header-right">
          <button
            className="notif-btn"
            onClick={handleMarkAllRead}
            disabled={totalUnread === 0}
          >
            ✓ 全部已读
          </button>
          <button
            className="notif-btn notif-btn-primary"
            onClick={() => setShowPrefs(true)}
          >
            ⚙ 偏好设置
          </button>
        </div>
      </header>

      <nav className="notif-tabs" role="tablist">
        {ALL_TABS.map((tab) => {
          const count = getTabCount(tab.key)
          const unread = getTabUnread(tab.key)
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              className={`notif-tab ${isActive ? 'notif-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className={`notif-tab-count ${count === 0 ? 'notif-tab-count-zero' : ''}`}>
                {tab.key !== 'archived' && unread > 0 ? unread : count}
              </span>
            </button>
          )
        })}
      </nav>

      {activeTab !== 'all' && activeTab !== 'archived' && displayedNotifications.length > 0 && (
        <div className="notif-section-title">
          <h3>
            {TYPE_LABELS[activeTab]}
            <span className="notif-tab-count">{displayedNotifications.length}</span>
          </h3>
          {getUnreadCountByType(state.active, activeTab) > 0 && (
            <button
              className="notif-link-btn"
              onClick={() => handleMarkTypeRead(activeTab)}
            >
              标记本组已读
            </button>
          )}
        </div>
      )}

      {activeTab === 'all' ? (
        Object.entries(activeGroups).map(([type, items]) => {
          if (items.length === 0) return null
          return (
            <div key={type}>
              <div className="notif-section-title">
                <h3>
                  {TYPE_ICONS[type]} {TYPE_LABELS[type]}
                  <span className="notif-tab-count">{items.length}</span>
                </h3>
                {getUnreadCountByType(state.active, type) > 0 && (
                  <button
                    className="notif-link-btn"
                    onClick={() => handleMarkTypeRead(type)}
                  >
                    标记本组已读
                  </button>
                )}
              </div>
              <div className="notif-list">
                {items.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    isNew={newIds.has(n.id)}
                    onMarkRead={handleMarkRead}
                    onToggleExpand={handleToggleExpand}
                    expanded={expandedIds.has(n.id)}
                  />
                ))}
              </div>
            </div>
          )
        })
      ) : displayedNotifications.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">
            {activeTab === 'archived' ? '📁' : '📭'}
          </div>
          <p>{activeTab === 'archived' ? '暂无历史通知' : '暂无通知'}</p>
        </div>
      ) : (
        <div className="notif-list">
          {displayedNotifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              isNew={newIds.has(n.id)}
              onMarkRead={handleMarkRead}
              onToggleExpand={handleToggleExpand}
              expanded={expandedIds.has(n.id)}
            />
          ))}
        </div>
      )}

      {showPrefs && (
        <PrefsPanel
          prefs={prefs}
          onClose={() => setShowPrefs(false)}
          onTogglePref={handleTogglePref}
        />
      )}
    </div>
  )
}

export default NotificationsPage
