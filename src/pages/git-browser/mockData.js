import { FILE_CHANGE_STATUS, FILE_TYPE, AUTHORS } from './constants'

const genId = () => Math.random().toString(36).slice(2, 10)

const FILE_CONTENTS = {
  'package.json': `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A sample project",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "jest",
    "build": "webpack --mode production",
    "lint": "eslint src/**/*.js"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "jest": "^29.6.0",
    "webpack": "^5.88.0",
    "eslint": "^8.45.0"
  }
}`,
  'README.md': `# My Project

## Overview
This is a sample project for demonstration purposes.

## Features
- Feature A: Core functionality
- Feature B: User interface
- Feature C: Data management

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`

## License
MIT License`,
  '.gitignore': `node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
coverage/
npm-debug.log*`,
  'src/index.js': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/main.css'

const root = ReactDOM.createRoot(
  document.getElementById('root')
)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

console.log('Application initialized')`,
  'src/App.js': `import { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import UserProfile from './pages/UserProfile'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'settings':
        return <Settings user={user} onUpdate={setUser} />
      case 'profile':
        return <UserProfile user={user} />
      default:
        return <Dashboard user={user} />
    }
  }

  return (
    <div className="app">
      <Header
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      <main className="app-content">
        {renderPage()}
      </main>
      <Footer />
    </div>
  )
}

export default App`,
  'src/utils/helpers.js': `export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const formatDateTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const debounce = (func, wait = 300) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ')
}`,
  'src/utils/api.js': `const BASE_URL = '/api/v1'

const request = async (endpoint, options = {}) => {
  const response = await fetch(\`\${BASE_URL}\${endpoint}\`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`)
  }

  return response.json()
}

export const api = {
  get: (endpoint, options) =>
    request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, data, options) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: (endpoint, data, options) =>
    request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (endpoint, options) =>
    request(endpoint, { ...options, method: 'DELETE' }),
}

export default api`,
  'src/components/Header.jsx': `import { useState } from 'react'

function Header({ user, currentPage, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { id: 'dashboard', label: '仪表盘' },
    { id: 'profile', label: '个人中心' },
    { id: 'settings', label: '设置' },
  ]

  return (
    <header className="header">
      <div className="header-brand">
        <h1 className="logo">MyApp</h1>
      </div>

      <nav className="header-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={\`nav-item \${currentPage === item.id ? 'active' : ''}\`}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="header-user">
        {user ? (
          <div className="user-menu">
            <button
              className="user-avatar"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {user.name?.charAt(0) || 'U'}
            </button>
            {menuOpen && (
              <div className="dropdown-menu">
                <div className="user-info">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <button className="menu-item">个人资料</button>
                <button className="menu-item">退出登录</button>
              </div>
            )}
          </div>
        ) : (
          <button className="login-btn">登录</button>
        )}
      </div>
    </header>
  )
}

export default Header`,
  'src/components/Footer.jsx': `function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>关于我们</h4>
          <p>构建优质的 Web 应用体验</p>
        </div>

        <div className="footer-section">
          <h4>快速链接</h4>
          <ul>
            <li><a href="#docs">文档</a></li>
            <li><a href="#api">API 参考</a></li>
            <li><a href="#support">支持</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>联系方式</h4>
          <p>Email: support@example.com</p>
          <p>电话: 400-123-4567</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} MyApp. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer`,
  'src/pages/Dashboard.jsx': `import { useState, useEffect } from 'react'
import { formatDate } from '../utils/helpers'

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    revenue: 0,
    orders: 0,
  })
  const [activities, setActivities] = useState([])

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalUsers: 1234,
        activeUsers: 856,
        revenue: 98765,
        orders: 432,
      })
      setActivities([
        { id: 1, user: 'Alice', action: '创建了新订单', time: Date.now() - 3600000 },
        { id: 2, user: 'Bob', action: '更新了个人资料', time: Date.now() - 7200000 },
        { id: 3, user: 'Charlie', action: '完成了付款', time: Date.now() - 10800000 },
      ])
    }, 500)
  }, [])

  const statCards = [
    { label: '总用户数', value: stats.totalUsers, color: 'blue' },
    { label: '活跃用户', value: stats.activeUsers, color: 'green' },
    { label: '总收入', value: '¥' + stats.revenue, color: 'purple' },
    { label: '订单数', value: stats.orders, color: 'orange' },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>欢迎回来, {user?.name || '访客'}</h2>
        <p className="subtitle">今天是 {formatDate(new Date())}</p>
      </div>

      <div className="stat-grid">
        {statCards.map((card) => (
          <div key={card.label} className={\`stat-card \${card.color}\`}>
            <span className="stat-label">{card.label}</span>
            <span className="stat-value">{card.value}</span>
          </div>
        ))}
      </div>

      <div className="activity-section">
        <h3>最近动态</h3>
        <ul className="activity-list">
          {activities.map((activity) => (
            <li key={activity.id} className="activity-item">
              <strong>{activity.user}</strong> {activity.action}
              <span className="activity-time">{formatDate(activity.time)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Dashboard`,
  'src/pages/Settings.jsx': `import { useState } from 'react'

function Settings({ user, onUpdate }) {
  const [settings, setSettings] = useState({
    notifications: user?.settings?.notifications ?? true,
    darkMode: user?.settings?.darkMode ?? false,
    language: user?.settings?.language ?? 'zh-CN',
    emailDigest: user?.settings?.emailDigest ?? true,
  })

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    if (onUpdate) {
      onUpdate({ ...user, settings: newSettings })
    }
  }

  return (
    <div className="settings">
      <h2>设置</h2>

      <section className="settings-section">
        <h3>通知设置</h3>
        <label className="setting-item">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => handleChange('notifications', e.target.checked)}
          />
          <span>启用推送通知</span>
        </label>
        <label className="setting-item">
          <input
            type="checkbox"
            checked={settings.emailDigest}
            onChange={(e) => handleChange('emailDigest', e.target.checked)}
          />
          <span>接收每日摘要邮件</span>
        </label>
      </section>

      <section className="settings-section">
        <h3>外观</h3>
        <label className="setting-item">
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={(e) => handleChange('darkMode', e.target.checked)}
          />
          <span>深色模式</span>
        </label>
      </section>

      <section className="settings-section">
        <h3>语言</h3>
        <select
          value={settings.language}
          onChange={(e) => handleChange('language', e.target.value)}
        >
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
          <option value="ja-JP">日本語</option>
        </select>
      </section>
    </div>
  )
}

export default Settings`,
  'src/pages/UserProfile.jsx': `import { useState } from 'react'

function UserProfile({ user }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
  })

  const handleSave = () => {
    setIsEditing(false)
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="avatar-large">
          {profile.name?.charAt(0) || 'U'}
        </div>
        <div className="profile-info">
          <h2>{profile.name || '未命名用户'}</h2>
          <p className="profile-email">{profile.email}</p>
          <button
            className="edit-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '取消' : '编辑资料'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="profile-form">
          <div className="form-group">
            <label>姓名</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>电话</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>个人简介</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
            />
          </div>
          <button className="save-btn" onClick={handleSave}>
            保存修改
          </button>
        </div>
      ) : (
        <div className="profile-details">
          <p><strong>电话:</strong> {profile.phone || '未设置'}</p>
          <p><strong>简介:</strong> {profile.bio || '这个人很懒,什么都没写'}</p>
        </div>
      )}
    </div>
  )
}

export default UserProfile`,
  'src/styles/main.css': `:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --bg-light: #f9fafb;
  --bg-dark: #1f2937;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-light);
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
}

.header-nav {
  display: flex;
  gap: 8px;
}

.nav-item {
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--bg-light);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary-color);
  color: #fff;
}

.footer {
  background: var(--bg-dark);
  color: #fff;
  padding: 32px;
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.footer h4 {
  margin-bottom: 12px;
}

.footer ul {
  list-style: none;
}

.footer a {
  color: #9ca3af;
  text-decoration: none;
}

.footer a:hover {
  color: #fff;
}

.footer-bottom {
  text-align: center;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #374151;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--border-color);
}

.stat-label {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
}`,
  'tests/setup.js': `import '@testing-library/jest-dom'

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.matchMedia = global.matchMedia || function () {
  return {
    matches: false,
    addListener() {},
    removeListener() {},
  }
}`,
  'config/webpack.config.js': `const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
  module: {
    rules: [
      {
        test: /\\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\\.(png|jpg|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
}`,
}

const buildFileTree = (branch) => {
  const statusMap = {
    main: {
      'package.json': FILE_CHANGE_STATUS.UNCHANGED,
      'README.md': FILE_CHANGE_STATUS.MODIFIED,
      '.gitignore': FILE_CHANGE_STATUS.UNCHANGED,
      'src/index.js': FILE_CHANGE_STATUS.MODIFIED,
      'src/App.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/utils/helpers.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/utils/api.js': FILE_CHANGE_STATUS.MODIFIED,
      'src/components/Header.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/components/Footer.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/Dashboard.jsx': FILE_CHANGE_STATUS.MODIFIED,
      'src/pages/Settings.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/UserProfile.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/styles/main.css': FILE_CHANGE_STATUS.UNCHANGED,
      'tests/setup.js': FILE_CHANGE_STATUS.UNCHANGED,
      'config/webpack.config.js': FILE_CHANGE_STATUS.UNCHANGED,
    },
    develop: {
      'package.json': FILE_CHANGE_STATUS.MODIFIED,
      'README.md': FILE_CHANGE_STATUS.UNCHANGED,
      '.gitignore': FILE_CHANGE_STATUS.UNCHANGED,
      'src/index.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/App.js': FILE_CHANGE_STATUS.MODIFIED,
      'src/utils/helpers.js': FILE_CHANGE_STATUS.ADDED,
      'src/utils/api.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/components/Header.jsx': FILE_CHANGE_STATUS.MODIFIED,
      'src/components/Footer.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/Dashboard.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/Settings.jsx': FILE_CHANGE_STATUS.ADDED,
      'src/pages/UserProfile.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/styles/main.css': FILE_CHANGE_STATUS.MODIFIED,
      'tests/setup.js': FILE_CHANGE_STATUS.ADDED,
      'config/webpack.config.js': FILE_CHANGE_STATUS.UNCHANGED,
    },
    'feature/login': {
      'package.json': FILE_CHANGE_STATUS.UNCHANGED,
      'README.md': FILE_CHANGE_STATUS.UNCHANGED,
      '.gitignore': FILE_CHANGE_STATUS.UNCHANGED,
      'src/index.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/App.js': FILE_CHANGE_STATUS.MODIFIED,
      'src/utils/helpers.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/utils/api.js': FILE_CHANGE_STATUS.MODIFIED,
      'src/components/Header.jsx': FILE_CHANGE_STATUS.ADDED,
      'src/components/Footer.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/Dashboard.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/Settings.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/UserProfile.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/Login.jsx': FILE_CHANGE_STATUS.ADDED,
      'src/styles/main.css': FILE_CHANGE_STATUS.UNCHANGED,
      'src/styles/login.css': FILE_CHANGE_STATUS.ADDED,
      'tests/setup.js': FILE_CHANGE_STATUS.UNCHANGED,
      'config/webpack.config.js': FILE_CHANGE_STATUS.UNCHANGED,
    },
    'bugfix/header': {
      'package.json': FILE_CHANGE_STATUS.UNCHANGED,
      'README.md': FILE_CHANGE_STATUS.UNCHANGED,
      '.gitignore': FILE_CHANGE_STATUS.UNCHANGED,
      'src/index.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/App.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/utils/helpers.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/utils/api.js': FILE_CHANGE_STATUS.UNCHANGED,
      'src/components/Header.jsx': FILE_CHANGE_STATUS.MODIFIED,
      'src/components/Footer.jsx': FILE_CHANGE_STATUS.DELETED,
      'src/pages/Dashboard.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/Settings.jsx': FILE_CHANGE_STATUS.UNCHANGED,
      'src/pages/UserProfile.jsx': FILE_CHANGE_STATUS.MODIFIED,
      'src/styles/main.css': FILE_CHANGE_STATUS.MODIFIED,
      'tests/setup.js': FILE_CHANGE_STATUS.UNCHANGED,
      'config/webpack.config.js': FILE_CHANGE_STATUS.UNCHANGED,
    },
  }

  const currentStatus = statusMap[branch] || statusMap.main
  const tree = {
    id: 'root',
    name: 'my-project',
    type: FILE_TYPE.FOLDER,
    status: FILE_CHANGE_STATUS.UNCHANGED,
    children: [],
  }

  const addFileToTree = (filePath, status) => {
    const parts = filePath.split('/')
    let current = tree
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        current.children.push({
          id: genId(),
          name: part,
          type: FILE_TYPE.FILE,
          path: filePath,
          status,
          content: FILE_CONTENTS[filePath] || `// ${part}\n// This is the content of ${filePath}`,
        })
      } else {
        let existing = current.children.find((c) => c.name === part && c.type === FILE_TYPE.FOLDER)
        if (!existing) {
          existing = {
            id: genId(),
            name: part,
            type: FILE_TYPE.FOLDER,
            status: FILE_CHANGE_STATUS.UNCHANGED,
            children: [],
          }
          current.children.push(existing)
        }
        current = existing
      }
    }
  }

  Object.keys(currentStatus).forEach((filePath) => {
    addFileToTree(filePath, currentStatus[filePath])
  })

  return tree
}

const generateCommitHistory = (branch) => {
  const baseTime = Date.now()
  const history = {
    main: [
      {
        hash: 'a1b2c3d',
        author: AUTHORS[0],
        message: 'feat: 初始化项目结构',
        timestamp: baseTime - 86400000 * 7,
        files: ['package.json', 'README.md', '.gitignore'],
      },
      {
        hash: 'e4f5g6h',
        author: AUTHORS[1],
        message: 'feat: 添加核心页面组件',
        timestamp: baseTime - 86400000 * 6,
        files: ['src/App.js', 'src/index.js', 'src/components/Header.jsx'],
      },
      {
        hash: 'i7j8k9l',
        author: AUTHORS[0],
        message: 'style: 添加主样式文件',
        timestamp: baseTime - 86400000 * 5,
        files: ['src/styles/main.css'],
      },
      {
        hash: 'm0n1o2p',
        author: AUTHORS[2],
        message: 'feat: 实现仪表盘页面',
        timestamp: baseTime - 86400000 * 4,
        files: ['src/pages/Dashboard.jsx', 'src/utils/helpers.js'],
      },
      {
        hash: 'q3r4s5t',
        author: AUTHORS[1],
        message: 'fix: 修复导航栏显示问题',
        timestamp: baseTime - 86400000 * 3,
        files: ['src/components/Header.jsx'],
      },
      {
        hash: 'u6v7w8x',
        author: AUTHORS[3],
        message: 'chore: 配置 webpack 构建',
        timestamp: baseTime - 86400000 * 2,
        files: ['config/webpack.config.js', 'package.json'],
      },
    ],
    develop: [
      {
        hash: 'a1b2c3d',
        author: AUTHORS[0],
        message: 'feat: 初始化项目结构',
        timestamp: baseTime - 86400000 * 7,
        files: ['package.json', 'README.md', '.gitignore'],
      },
      {
        hash: 'e4f5g6h',
        author: AUTHORS[1],
        message: 'feat: 添加核心页面组件',
        timestamp: baseTime - 86400000 * 6,
        files: ['src/App.js', 'src/index.js', 'src/components/Header.jsx'],
      },
      {
        hash: 'dev1234',
        author: AUTHORS[2],
        message: 'feat: 添加工具函数模块',
        timestamp: baseTime - 86400000 * 5,
        files: ['src/utils/helpers.js'],
      },
      {
        hash: 'dev5678',
        author: AUTHORS[0],
        message: 'feat: 实现设置页面',
        timestamp: baseTime - 86400000 * 4,
        files: ['src/pages/Settings.jsx'],
      },
      {
        hash: 'dev9012',
        author: AUTHORS[3],
        message: 'test: 添加测试配置',
        timestamp: baseTime - 86400000 * 3,
        files: ['tests/setup.js'],
      },
      {
        hash: 'dev3456',
        author: AUTHORS[1],
        message: 'refactor: 优化样式系统',
        timestamp: baseTime - 86400000 * 2,
        files: ['src/styles/main.css', 'src/components/Header.jsx'],
      },
      {
        hash: 'dev7890',
        author: AUTHORS[2],
        message: 'WIP: 重构 App 组件',
        timestamp: baseTime - 86400000,
        files: ['src/App.js', 'package.json'],
      },
    ],
    'feature/login': [
      {
        hash: 'a1b2c3d',
        author: AUTHORS[0],
        message: 'feat: 初始化项目结构',
        timestamp: baseTime - 86400000 * 7,
        files: ['package.json', 'README.md', '.gitignore'],
      },
      {
        hash: 'e4f5g6h',
        author: AUTHORS[1],
        message: 'feat: 添加核心页面组件',
        timestamp: baseTime - 86400000 * 6,
        files: ['src/App.js', 'src/index.js'],
      },
      {
        hash: 'login123',
        author: AUTHORS[3],
        message: 'feat: 实现登录页面 UI',
        timestamp: baseTime - 86400000 * 5,
        files: ['src/pages/Login.jsx', 'src/components/Header.jsx'],
      },
      {
        hash: 'login456',
        author: AUTHORS[3],
        message: 'feat: 添加登录表单样式',
        timestamp: baseTime - 86400000 * 4,
        files: ['src/styles/login.css'],
      },
      {
        hash: 'login789',
        author: AUTHORS[0],
        message: 'feat: 集成登录 API',
        timestamp: baseTime - 86400000 * 3,
        files: ['src/utils/api.js', 'src/App.js'],
      },
      {
        hash: 'login012',
        author: AUTHORS[3],
        message: 'fix: 修复登录状态持久化',
        timestamp: baseTime - 86400000 * 2,
        files: ['src/utils/api.js', 'src/App.js'],
      },
    ],
    'bugfix/header': [
      {
        hash: 'a1b2c3d',
        author: AUTHORS[0],
        message: 'feat: 初始化项目结构',
        timestamp: baseTime - 86400000 * 7,
        files: ['package.json', 'README.md', '.gitignore'],
      },
      {
        hash: 'e4f5g6h',
        author: AUTHORS[1],
        message: 'feat: 添加核心页面组件',
        timestamp: baseTime - 86400000 * 6,
        files: ['src/App.js', 'src/index.js', 'src/components/Header.jsx'],
      },
      {
        hash: 'fix1234',
        author: AUTHORS[2],
        message: 'fix: 修复 Header 响应式布局',
        timestamp: baseTime - 86400000 * 4,
        files: ['src/components/Header.jsx', 'src/styles/main.css'],
      },
      {
        hash: 'fix5678',
        author: AUTHORS[1],
        message: 'fix: 修复用户资料页面滚动',
        timestamp: baseTime - 86400000 * 3,
        files: ['src/pages/UserProfile.jsx'],
      },
      {
        hash: 'fix9012',
        author: AUTHORS[2],
        message: 'fix: 移除废弃的 Footer 组件',
        timestamp: baseTime - 86400000 * 2,
        files: ['src/components/Footer.jsx', 'src/styles/main.css'],
      },
    ],
  }

  return history[branch] || history.main
}

export const getFileTreeForBranch = (branch) => buildFileTree(branch)
export const getCommitHistoryForBranch = (branch) => generateCommitHistory(branch)
export const getFileContent = (path) => FILE_CONTENTS[path] || `// Content for ${path}`
