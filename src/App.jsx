import '@/App.css'
import { Route, Routes, useNavigate } from 'react-router-dom'

import AuthPage from '@/pages/auth/index.jsx'
import CalendarPage from '@/pages/calendar/index.jsx'
import ChatPage from '@/pages/chat/index.jsx'
import Dashboard from '@/pages/dashboard/Dashboard.jsx'
import FileManager from '@/pages/file-manager/FileManager.jsx'
import FormBuilder from '@/pages/form-builder/FormBuilder.jsx'
import InfiniteListPage from '@/pages/infinite-list/index.jsx'
import KanbanPage from '@/pages/kanban/KanbanPage.jsx'
import OrdersPage from '@/pages/orders/index.jsx'
import ProductsPage from '@/pages/products/index.jsx'
import ThemeEditorPage from '@/pages/theme-editor/index.jsx'
import Wizard from '@/pages/wizard/Wizard.jsx'
import SurveyPage from '@/pages/survey/index.jsx'
import MediaGallery from '@/pages/media-gallery/index.jsx'
import NotificationsPage from '@/pages/notifications/index.jsx'
import PermissionsPage from '@/pages/permissions/index.jsx'
import WorkflowPage from '@/pages/workflow/index.jsx'
import FinancePage from '@/pages/finance/index.jsx'
import MapAreaPage from '@/pages/map-area/index.jsx'
import RichEditorPage from '@/pages/rich-editor/index.jsx'

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
    { id: 11, title: '问卷调查系统', route: 'survey', description: '完整问卷创建、发布、作答、统计全链路，支持多种题型与数据可视化，基于 localStorage 存储。' },
    { id: 12, title: '日程日历', route: 'calendar', description: '日/周/月三种视图切换，事件拖拽调整，搜索高亮与冲突检测，数据本地持久化。' },
    { id: 13, title: '权限管理系统', route: 'permissions', description: '基于 RBAC 模型的用户-角色-权限三级管理，支持权限树父子联动、按钮级权限控制。' },
    { id: 14, title: '媒体资源库', route: 'media-gallery', description: '瀑布流布局的本地相册管理，支持懒加载缩略图、灯箱预览、标签/日期/类型筛选、批量收藏删除、本地上传。' },
    { id: 15, title: '电商订单系统', route: 'orders', description: '商品浏览、购物车、下单支付、订单追踪的完整电商订单闭环，基于 localStorage 持久化。' },
    { id: 16, title: '流程编排器', route: 'workflow', description: '可视化流程图编辑器，支持节点拖拽、连线、属性配置、模拟执行，数据本地持久化。' },
    { id: 17, title: '通知中心', route: 'notifications', description: '系统通知、私信消息、任务提醒一站式消息盒子，支持已读管理、偏好设置、自动归档与实时推送。' },
    { id: 18, title: '个人财务管理', route: 'finance', description: '完整的个人财务管理，支持记账、预算管理、统计图表、月度收支分析，基于 localStorage 持久化。' },
    { id: 19, title: '交互式地图', route: 'map-area', description: '自绘 SVG 地图画布，支持拖拽平移、滚轮缩放、标记点增删改查、自动聚合与路线规划。' },
    { id: 20, title: '富文本编辑器', route: 'rich-editor', description: 'Markdown 富文本编辑器，支持左右分栏实时预览、工具栏格式化、撤销重做、图片与链接插入、自动保存与文件导出。' },
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
            <Route path="/survey" element={<SurveyPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/permissions" element={<PermissionsPage />} />
            <Route path="/media-gallery" element={<MediaGallery />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/map-area" element={<MapAreaPage />} />
            <Route path="/rich-editor" element={<RichEditorPage />} />
        </Routes>
    )
}

export default App
