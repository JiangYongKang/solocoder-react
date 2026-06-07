import '@/App.css'
import { Route, Routes, useNavigate } from 'react-router-dom'

import AuthPage from '@/pages/auth/index.jsx'
import ChatPage from '@/pages/chat/index.jsx'
import Dashboard from '@/pages/dashboard/Dashboard.jsx'
import FileManager from '@/pages/file-manager/FileManager.jsx'
import FormBuilder from '@/pages/form-builder/FormBuilder.jsx'
import InfiniteListPage from '@/pages/infinite-list/index.jsx'
import KanbanPage from '@/pages/kanban/KanbanPage.jsx'
import ProductsPage from '@/pages/products/index.jsx'
import ThemeEditorPage from '@/pages/theme-editor/index.jsx'
import Wizard from '@/pages/wizard/Wizard.jsx'

const TASKS = [
    { id: 1, title: '用户认证系统', route: 'auth', description: '登录、注册、找回密码、修改密码完整的认证流程，基于 localStorage 存储。' },
    { id: 2, title: '商品管理后台', route: 'products', description: '商品信息的增删改查，支持分页、搜索、排序、批量操作，数据持久化存储。' },
    { id: 3, title: '任务看板', route: 'kanban', description: '拖拽式看板，多列状态流转，任务筛选与编辑，数据本地持久化。' },
    { id: 4, title: '可视化仪表盘', route: 'dashboard', description: '基于 Recharts 的多图表数据可视化，支持日期范围和维度筛选。' },
    { id: 5, title: '文件管理器', route: 'file-manager', description: '树形目录 + 网格/列表双视图，支持右键菜单、面包屑导航、排序、数据本地持久化。' },
    { id: 6, title: '实时聊天', route: 'chat', description: '模拟实时聊天界面，支持联系人列表、消息收发、表情与图片预览。' },
    { id: 7, title: '表单构建器', route: 'form-builder', description: '拖拽式表单构建器，支持添加/配置/排序表单字段，实时预览并导出 JSON 配置。' },
    { id: 8, title: '无限滚动列表', route: 'infinite-list', description: '虚拟滚动 + 无限加载长列表，支持搜索、排序、编辑与批量删除。' },
    { id: 9, title: '多步骤向导', route: 'wizard', description: '分步表单向导，支持上一步/下一步、步骤跳转、各步骤数据汇总提交。' },
    { id: 10, title: '主题定制系统', route: 'theme-editor', description: '实时可视化主题编辑器，支持颜色、字体、间距等令牌的实时预览与导出。' },
]

function HomePage() {
    const navigate = useNavigate()

    return (
        <div className="page">
            <h1 className="page-title">欢迎使用 Solocoder React</h1>
            <div className="task-grid">
                {[...TASKS].reverse().map((task) => (
                    <a
                        key={task.id}
                        className="task"
                        href={`#/${task.route}`}
                        onClick={(e) => {
                            e.preventDefault()
                            navigate(`/${task.route}`)
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <h2 className="task-title">{task.id}: {task.title}</h2>
                        <p className="task-desc">{task.description}</p>
                        <span className="task-link">点击进入 →</span>
                    </a>
                ))}
            </div>
        </div>
    )
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/file-manager" element={<FileManager onBack={() => window.history.back()} />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/form-builder" element={<FormBuilder />} />
            <Route path="/infinite-list" element={<InfiniteListPage />} />
            <Route path="/wizard" element={<Wizard />} />
            <Route path="/theme-editor" element={<ThemeEditorPage />} />
        </Routes>
    )
}

export default App
