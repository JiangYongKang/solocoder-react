import { useState } from 'react'
import { Link } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import ForgotPassword from './ForgotPassword'
import ChangePassword from './ChangePassword'
import { getUser, isLoggedIn, clearAuth } from './authStorage'
import './auth.css'

const GUEST_TABS = [
  { key: 'login', label: '登录' },
  { key: 'register', label: '注册' },
  { key: 'forgot', label: '找回密码' },
]

const LOGGED_TABS = [
  { key: 'change', label: '修改密码' },
]

export default function AuthPage() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [user, setUser] = useState(getUser())
  const [guestTab, setGuestTab] = useState('login')

  const activeTab = loggedIn ? 'change' : guestTab
  const tabs = loggedIn ? LOGGED_TABS : GUEST_TABS

  const handleLoginSuccess = () => {
    setLoggedIn(true)
    setUser(getUser())
  }

  const handleLogout = () => {
    clearAuth()
    setLoggedIn(false)
    setUser(null)
    setGuestTab('login')
  }

  const handlePasswordChanged = () => {
    clearAuth()
    setLoggedIn(false)
    setUser(null)
    setGuestTab('login')
  }

  const handleBackToLogin = () => {
    setGuestTab('login')
  }

  const handleTabClick = (key) => {
    if (!loggedIn) {
      setGuestTab(key)
    }
  }

  const renderContent = () => {
    if (loggedIn) {
      if (activeTab === 'change') {
        return <ChangePassword onPasswordChanged={handlePasswordChanged} />
      }
      return null
    }
    switch (activeTab) {
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />
      case 'register':
        return <Register onRegisterSuccess={handleLoginSuccess} />
      case 'forgot':
        return <ForgotPassword onBackToLogin={handleBackToLogin} />
      default:
        return null
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">← 返回首页</Link>
      <h1 className="auth-page-title">用户认证系统</h1>

      {loggedIn && user && (
        <div className="auth-user-card">
          <div className="auth-user-avatar">{(user.nickname || user.email || 'U').charAt(0).toUpperCase()}</div>
          <div className="auth-user-info">
            <div className="auth-user-name">{user.nickname || '用户'}</div>
            <div className="auth-user-email">{user.email}</div>
          </div>
          <button className="auth-logout-btn" onClick={handleLogout}>退出登录</button>
        </div>
      )}

      <div className="auth-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`auth-tab ${activeTab === tab.key ? 'auth-tab-active' : ''}`}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="auth-content">
        {renderContent()}
      </div>
    </div>
  )
}
