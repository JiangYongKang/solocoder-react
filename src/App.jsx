import '@/App.css'
import { Route, Routes, useNavigate } from 'react-router-dom'

import ApiDebuggerPage from '@/pages/api-debugger/index.jsx'
import AuditLogPage from '@/pages/audit-log/index.jsx'
import AuthPage from '@/pages/auth/index.jsx'
import BudgetTrackerPage from '@/pages/budget-tracker/index.jsx'
import CalendarPage from '@/pages/calendar/index.jsx'
import ChatPage from '@/pages/chat/index.jsx'
import CodeSandboxPage from '@/pages/code-sandbox/index.jsx'
import CollaborativeDocPage from '@/pages/collaborative-doc/index.jsx'
import CouponPage from '@/pages/coupon/index.jsx'
import CSSAnimationPage from '@/pages/css-animation/index.jsx'
import CurrencyConverterPage from '@/pages/currency-converter/index.jsx'
import DanmakuPlayerPage from '@/pages/danmaku-player/index.jsx'
import Dashboard from '@/pages/dashboard/Dashboard.jsx'
import DataImporterPage from '@/pages/data-importer/index.jsx'
import DataMaskPage from '@/pages/data-mask/index.jsx'
import DBDesignerPage from '@/pages/db-designer/index.jsx'
import EventTimelinePage from '@/pages/event-timeline/index.jsx'
import ExamPage from '@/pages/exam/index.jsx'
import FileManager from '@/pages/file-manager/FileManager.jsx'
import FinancePage from '@/pages/finance/index.jsx'
import FitnessTrackerPage from '@/pages/fitness-tracker/index.jsx'
import FlashSalePage from '@/pages/flash-sale/index.jsx'
import FoodOrderPage from '@/pages/food-order/index.jsx'
import FormBuilder from '@/pages/form-builder/FormBuilder.jsx'
import FunnelAnalysisPage from '@/pages/funnel-analysis/index.jsx'
import GanttChartPage from '@/pages/gantt-chart/index.jsx'
import GeometryBoardPage from '@/pages/geometry-board/index.jsx'
import GitBrowserPage from '@/pages/git-browser/index.jsx'
import GradeManagerPage from '@/pages/grade-manager/index.jsx'
import HabitTrackerPage from '@/pages/habit-tracker/index.jsx'
import I18nManagerPage from '@/pages/i18n-manager/index.jsx'
import InfiniteListPage from '@/pages/infinite-list/index.jsx'
import JsonToTsPage from '@/pages/json-to-ts/index.jsx'
import UrlToolPage from '@/pages/url-tool/index.jsx'
import KanbanPage from '@/pages/kanban/KanbanPage.jsx'
import KnowledgeBasePage from '@/pages/knowledge-base/index.jsx'
import MapAreaPage from '@/pages/map-area/index.jsx'
import MediaGallery from '@/pages/media-gallery/index.jsx'
import MediaPlayerPage from '@/pages/media-player/index.jsx'
import MeetingRoomPage from '@/pages/meeting-room/index.jsx'
import MindMapPage from '@/pages/mind-map/index.jsx'
import MinesweeperPage from '@/pages/minesweeper/index.jsx'
import NotificationsPage from '@/pages/notifications/index.jsx'
import OrdersPage from '@/pages/orders/index.jsx'
import PermissionsPage from '@/pages/permissions/index.jsx'
import PomodoroPage from '@/pages/pomodoro/index.jsx'
import ProductReviewPage from '@/pages/product-review/index.jsx'
import ProductsPage from '@/pages/products/index.jsx'
import QRCodePage from '@/pages/qrcode/index.jsx'
import RegexTesterPage from '@/pages/regex-tester/index.jsx'
import ReleaseManagerPage from '@/pages/release-manager/index.jsx'
import RichEditorPage from '@/pages/rich-editor/index.jsx'
import RouteRecorderPage from '@/pages/route-recorder/index.jsx'
import RpgCreatorPage from '@/pages/rpg-creator/index.jsx'
import SchedulePlannerPage from '@/pages/schedule-planner/index.jsx'
import SkuSelectorPage from '@/pages/sku-selector/index.jsx'
import SnippetsPage from '@/pages/snippets/index.jsx'
import SocialFeedPage from '@/pages/social-feed/index.jsx'
import SpreadsheetPage from '@/pages/spreadsheet/index.jsx'
import SudokuPage from '@/pages/sudoku/index.jsx'
import SnakeBattlePage from '@/pages/snake-battle/index.jsx'
import SurveyPage from '@/pages/survey/index.jsx'
import TetrisPage from '@/pages/tetris/index.jsx'
import TextDiffPage from '@/pages/text-diff/index.jsx'
import TodoListPage from '@/pages/todo-list/index.jsx'
import ThemeEditorPage from '@/pages/theme-editor/index.jsx'
import TicketSystemPage from '@/pages/ticket-system/index.jsx'
import UnionFindPage from '@/pages/union-find/index.jsx'
import VotingApp from '@/pages/voting-app/index.jsx'
import WeatherPage from '@/pages/weather/index.jsx'
import WsDebuggerPage from '@/pages/websocket-debugger/index.jsx'
import WhiteboardPage from '@/pages/whiteboard/index.jsx'
import Wizard from '@/pages/wizard/Wizard.jsx'
import WorkflowPage from '@/pages/workflow/index.jsx'
import VideoMeetingPage from '@/pages/video-meeting/index.jsx'
import ScreenshotAnnotatorPage from '@/pages/screenshot-annotator/index.jsx'
import MenuDesignerPage from '@/pages/menu-designer/index.jsx'
import EventDebuggerPage from '@/pages/event-debugger/index.jsx'
import LinkGamePage from '@/pages/link-game/index.jsx'
import TimeTrackerPage from '@/pages/time-tracker/index.jsx'
import PerformanceMonitorPage from '@/pages/performance-monitor/index.jsx'
import TicTacToePage from '@/pages/tic-tac-toe/index.jsx'
import SvgPathEditorPage from '@/pages/svg-path-editor/index.jsx'
import InventoryPage from '@/pages/inventory/index.jsx'
import IdiomChainPage from '@/pages/idiom-chain/index.jsx'
import ExamGradingPage from '@/pages/exam-grading/index.jsx'
import PackageManagerPage from '@/pages/package-manager/index.jsx'
import StockDashboardPage from '@/pages/stock-dashboard/index.jsx'
import RoutePlannerPage from '@/pages/route-planner/index.jsx'
import ModalGenerator from '@/pages/modal-generator/index.jsx'
import PuzzleGamePage from '@/pages/puzzle-game/index.jsx'
import MessageQueuePage from '@/pages/message-queue/index.jsx'
import StickyNotesPage from '@/pages/sticky-notes/index.jsx'

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
    { id: 21, title: '文本差异对比工具', route: 'text-diff', description: '逐行逐字符级文本比对，左右分栏与统一 diff 双视图切换，文件上传/剪贴板粘贴，变更块快速导航。' },
    { id: 22, title: '在线考试系统', route: 'exam', description: '题库管理、随机组卷、限时作答、自动判分和成绩趋势分析的完整在线考试系统，基于 localStorage 持久化。' },
    { id: 23, title: '会议室预约系统', route: 'meeting-room', description: '内部会议室预定系统，按时间段预约、冲突检测、预约管理、到期自动释放，基于 localStorage 持久化。' },
    { id: 24, title: '番茄钟计时器', route: 'pomodoro', description: '专注工作计时器，番茄工作法管理时间，支持自定义时长、白噪音、桌面通知、统计图表，基于 localStorage 持久化。' },
    { id: 25, title: '商品评价评分系统', route: 'product-review', description: '商品评价完整评分互动体系，支持星级评分、图片上传、投票互动、追评时间线、商家回复、评分统计，基于 localStorage 持久化。' },
    { id: 26, title: '轻量级电子表格', route: 'spreadsheet', description: '浏览器中运行的网格型电子表格，支持单元格编辑、公式计算(SUM/AVG/MAX/MIN/COUNT)、行列操作、样式设置、复制粘贴、CSV导入导出。' },
    { id: 27, title: '甘特图', route: 'gantt-chart', description: '项目管理甘特图，任务层级分解、拖拽调整时间、依赖关系连线、日/周/月视图缩放、进度可视化，数据本地持久化。' },
    { id: 28, title: '代码片段管理器', route: 'snippets', description: '代码片段收藏管理工具，支持语法高亮、标签分类、搜索过滤、快速复制、导入导出，基于 localStorage 持久化。' },
    { id: 29, title: '思维导图', route: 'mind-map', description: '可视化思维导图编辑器，支持节点增删改、拖拽布局、父子层级展开收起、导出图片/JSON，数据本地持久化。' },
    { id: 30, title: '知识库系统', route: 'knowledge-base', description: '多级分类树形目录 + Markdown 文章编辑，支持全文搜索高亮、TOC 目录大纲、收藏夹、最近浏览，数据本地持久化。' },
    { id: 31, title: '音视频播放器', route: 'media-player', description: '浏览器内的媒体播放器，支持音视频播放、播放列表管理、LRC歌词同步滚动、断点续播，基于 localStorage 持久化。' },
    { id: 32, title: 'API 调试工具', route: 'api-debugger', description: '类似 Postman 的前端 API 调试工具，支持 HTTP 请求构造、发送、响应查看，历史记录和环境变量管理。' },
    { id: 33, title: '正则测试器', route: 'regex-tester', description: '正则表达式在线测试工具，实时匹配高亮、捕获组解析、替换预览、常用正则速查、历史记录持久化。' },
    { id: 34, title: '健身运动追踪', route: 'fitness-tracker', description: '记录和追踪日常运动，汇总统计数据，设定健身目标，趋势图表可视化，基于 localStorage 持久化。' },
    { id: 35, title: 'Git 仓库浏览器', route: 'git-browser', description: '模拟 Git 仓库可视化管理工具，文件树、Diff 对比、提交历史时间线、分支切换、Stage/Unstage 暂存面板。' },
    { id: 36, title: '数据库表设计器', route: 'db-designer', description: '可视化数据库表结构设计工具，支持表/字段拖拽编辑、外键关系连线、自动布局、DDL导出、JSON导入导出。' },
    { id: 37, title: '优惠券管理系统', route: 'coupon', description: '模拟电商平台优惠券全生命周期管理，支持商家发券、用户领券、下单用券的完整闭环，基于 localStorage 持久化。' },
    { id: 38, title: '二维码工具', route: 'qrcode', description: '二维码生成和解析工具，支持自定义尺寸、颜色、Logo 嵌入、PNG 下载、图片解析、历史记录，基于 localStorage 持久化。' },
    { id: 39, title: '社交动态流', route: 'social-feed', description: '模拟社交平台动态信息流，支持发布内容、图片上传、话题标签、点赞评论转发、嵌套回复、关注、排序筛选、无限滚动，基于 localStorage 持久化。' },
    { id: 40, title: '协作白板', route: 'whiteboard', description: '在线协作白板画布，支持画笔/形状/文本/橡皮擦绘图工具、撤销重做、缩放平移、JSON 导入导出、PNG 导出。' },
    { id: 41, title: 'SKU 规格选择器', route: 'sku-selector', description: '电商商品规格选择组件，支持动态配置规格组、SKU 列表生成管理、规格选择交互联动禁用、库存价格实时计算与图片联动切换。' },
    { id: 42, title: '俄罗斯方块', route: 'tetris', description: '经典俄罗斯方块游戏，基于 Canvas 绘制，支持键盘控制、消行计分、等级递增、暂停重开、最高分 localStorage 持久化。' },
    { id: 43, title: '秒杀抢购页面', route: 'flash-sale', description: '模拟电商秒杀抢购场景，包含活动倒计时、库存展示进度条、抢购交互与防重复点击、模拟延迟与概率性抢购结果。' },
    { id: 44, title: '几何画板', route: 'geometry-board', description: '交互式几何图形绘制工具，在坐标系网格上绘制点、线、圆，支持图形编辑、角度与长度测量、SVG 导出。' },
    { id: 45, title: '多语言国际化管理', route: 'i18n-manager', description: '管理应用多语言翻译键值对的工具，支持多语言并行编辑、嵌套 key 树形视图、翻译对比、导入导出和覆盖率统计。' },
    { id: 48, title: '天气查询应用', route: 'weather', description: '城市天气查询工具，支持搜索、收藏、历史记录、一周预报、温度趋势图和天气主题背景，基于 localStorage 持久化。' },
    { id: 49, title: '记账预算管理', route: 'budget-tracker', description: '个人月度预算管理工具，设置分类预算并追踪消费进度，消费进度可视化、分类明细、剩余日均额度、环比增减、调整记录时间线，基于 localStorage 持久化。' },
    { id: 50, title: '扫雷游戏', route: 'minesweeper', description: '经典 Windows 扫雷游戏复刻，支持三种难度和自定义难度，左键翻开/右键插旗、泛洪自动展开、计时与雷数计数、胜负判定、localStorage 排行榜持久化。' },
    { id: 54, title: '物流轨迹追踪', route: 'logistics-tracker', description: '快递物流轨迹查询工具，输入快递单号查看包裹运输轨迹、物流节点时间线和Canvas地图轨迹动画。' },
    { id: 54, title: '便签墙', route: 'sticky-wall', description: '自由排列的数字便签墙，支持彩色便签创建、自由拖拽定位、层级管理、富文本编辑、归档与删除、画布缩放与网格吸附，数据本地持久化。' },
    { id: 55, title: '习惯养成追踪', route: 'habit-tracker', description: '个人习惯养成追踪工具，创建习惯、每日打卡、热力图和统计图表可视化追踪进度，支持连胜记录、打卡提醒和归档管理，基于 localStorage 持久化。' },
    { id: 51, title: '积分商城', route: 'points-mall', description: '用户积分兑换商城，积分规则展示、商品兑换、积分流水管理、过期倒计时、订单查询、积分趋势图，基于 localStorage 持久化。' },
    { id: 55, title: 'WebSocket 调试工具', route: 'websocket-debugger', description: 'WebSocket 协议联调和测试工具，支持连接管理、JSON 消息收发、实时日志、心跳检测、自动重连，基于 localStorage 持久化。' },
    { id: 55, title: '实时汇率换算器', route: 'currency-converter', description: '多货币汇率换算工具，支持双向联动换算、汇率走势图、汇率表格排序、收藏货币对，基于模拟汇率数据和 localStorage 持久化。' },
    { id: 56, title: '数独游戏', route: 'sudoku', description: '完整数独益智游戏，四难度题库生成、笔记辅助推理、冲突高亮、计时暂停、撤销重做、提示功能，基于 localStorage 保存进度。' },
    { id: 57, title: '客服工单系统', route: 'ticket-system', description: '客服团队工单管理系统，支持创建工单、状态流转、多维筛选、SLA超时警示、处理时间线和统计仪表盘，基于 localStorage 持久化。' },
    { id: 58, title: '多人实时投票', route: 'voting-app', description: '实时投票系统，支持创建投票、分享链接、单选/多选投票、实时进度条、倒计时、模拟多人投票、历史投票列表与筛选，基于 localStorage 持久化。' },
    { id: 59, title: '课程表排课', route: 'schedule-planner', description: '高校课程表制作工具，周视图网格排课、拖拽课程到时间格、教室/教师冲突检测、JSON导入导出、打印友好视图，基于 localStorage 持久化。' },
    { id: 60, title: '事件时间线', route: 'event-timeline', description: '时间线可视化工具，事件按时间排列，年代/月份分组浏览，增删改查与缩放滚动，搜索标签筛选，多视图切换，localStorage 持久化。' },
    { id: 61, title: '数据导入向导', route: 'data-importer', description: '多步骤数据导入向导，支持 CSV/Excel 文件解析、字段映射自动匹配、数据校验修正、逐行导入进度追踪、失败原因分析与CSV导出。' },
    { id: 62, title: '漏斗分析', route: 'funnel-analysis', description: '用户行为漏斗分析工具，多步骤漏斗配置、转化率横向条形图、日期范围筛选、步骤间流失标注、多组 A/B 对比、数据编辑与 CSV 导出，基于 localStorage 持久化。' },
    { id: 63, title: '版本发布管理', route: 'release-manager', description: '软件版本发布全生命周期管理，版本分页列表、新增编辑、Diff 对比、审批流程模拟（提交→审核→发布→回滚），基于 localStorage 持久化。' },
    { id: 64, title: 'Markdown 笔记应用', route: 'markdown-notes', description: '完整的 Markdown 笔记应用，多笔记本树形目录、Markdown 编辑与实时预览、标签分类、全文搜索高亮、笔记间内部链接跳转、.md 文件导入导出，基于 localStorage 持久化。' },
    { id: 68, title: 'JSON 转 TypeScript 类型生成器', route: 'json-to-ts', description: '开发者工具，粘贴 JSON 自动生成 TypeScript 接口/类型，支持递归类型推导、可选字段识别、类型名自定义、一键复制和历史记录，基于 localStorage 持久化。' },
    { id: 76, title: 'URL 解析编解码工具', route: 'url-tool', description: '开发者常用的 URL 解析与编解码工具箱，支持 URL 各部分拆解展示、查询参数表格编辑、URL 编解码、Base64 转换、JSON 互转、批量 URL 解析与 CSV 导出，所有状态仅在当前会话内维护。' },
    { id: 66, title: '外卖点餐', route: 'food-order', description: '完整外卖点餐流程，店铺列表与品类筛选、商品分组与规格选择加购、购物车管理、地址备注填写、订单状态实时跟踪、历史订单查看，基于 localStorage 持久化。' },
    { id: 65, title: 'RPG 角色创建器', route: 'rpg-creator', description: '可视化RPG角色创建工具，CSS/Canvas绘制角色形象、外观定制、30点属性分配、树形技能解锁、角色保存加载与卡片导出，基于 localStorage 持久化。' },
    { id: 67, title: '路线记录器', route: 'route-recorder', description: 'Canvas自绘地图路线规划工具，标记起终点和途经点、拖拽排序、距离时间计算、海拔剖面图、收藏与分享路线，基于 localStorage 持久化。' },
    { id: 69, title: '成绩管理系统', route: 'grade-manager', description: '教学场景成绩管理工具，支持学生/科目双视图切换、批量粘贴录入、统计分析与直方图、排名展示、CSV导出，基于 localStorage 持久化。' },
    { id: 72, title: '代码执行沙箱', route: 'code-sandbox', description: '在线代码运行环境，支持 JavaScript 和 Python（前端模拟）代码编写与执行、语法高亮、输出控制台、代码片段保存加载、执行历史记录，基于 localStorage 持久化。' },
    { id: 73, title: '视频会议模拟', route: 'video-meeting', description: 'Canvas 模拟视频会议界面，画廊/演讲者双视图切换，静音/摄像头/屏幕共享/举手控制，聊天面板和参会人列表，所有状态前端维护。' },
    { id: 70, title: '审计日志系统', route: 'audit-log', description: '企业级操作审计日志管理，支持分页列表、多维度筛选、JSON 详情、CSV 导出、保留策略配置、操作趋势图与异常标记，基于 localStorage 持久化。' },
    { id: 71, title: '弹幕播放器', route: 'danmaku-player', description: 'Canvas 弹幕渲染的视频播放器模拟，支持弹幕发送（位置/颜色/字号）、滚动/固定弹幕渲染、弹幕开关与透明度、弹幕列表与防重叠密度调节。' },
    { id: 75, title: '连连看游戏', route: 'link-game', description: '经典连连看消除游戏，多难度网格配置、两拐弯BFS路径判定、消除动画连线、计时步数、提示与重排功能、localStorage排行榜持久化。' },
    { id: 74, title: '工时统计', route: 'time-tracker', description: '团队/个人工时记录与统计工具，支持计时器追踪、手动登记、按项目日期汇总、柱状图统计、预算进度对比、CSV导出，基于 localStorage 持久化。' },
    { id: 74, title: '待办清单', route: 'todo-list', description: '个人待办任务管理工具，支持任务分组、子任务层级管理、拖拽排序、多维筛选、过期提醒和连续打卡统计，基于 localStorage 持久化。' },
    { id: 79, title: '性能监控面板', route: 'performance-monitor', description: '前端性能监控仪表盘，实时FPS/内存/CPU仪表盘、页面加载瀑布图、资源大小树图、告警规则配置与告警历史，所有数据会话内模拟不持久化。' },
    { id: 80, title: 'SVG 路径编辑器', route: 'svg-path-editor', description: '可视化 SVG 路径编辑工具，支持贝塞尔曲线控制点拖拽、路径命令面板编辑、节点增删、填充描边样式设置、多路径管理与 SVG 代码导出。' },
    { id: 81, title: '仓库库存管理', route: 'inventory', description: '多仓库 SKU 出入库管理、库存预警、批次效期追踪、仓库调拨、盘点核对与库存趋势可视化，基于 localStorage 持久化。' },
    { id: 82, title: '成语接龙游戏', route: 'idiom-chain', description: '人机对战的成语接龙游戏，内置500+条成语词库，三难度选择、AI智能回应、计时计分、提示功能、连胜纪录持久化，所有状态前端维护。' },
    { id: 83, title: '考试阅卷系统', route: 'exam-grading', description: '在线考试阅卷工具，逐题评阅学生答卷，支持选择题自动判分、简答题手动评分与评语、阅卷进度追踪、复查抽查标记、成绩批量导出CSV。' },
    { id: 84, title: '拼图游戏', route: 'puzzle-game', description: '完整拼图益智游戏，上传图片切分网格拼块、拖拽交换完成拼图、计时计步、多难度选择、完成庆祝动画、排行榜 localStorage 持久化。' },
    { id: 85, title: '消息队列模拟', route: 'message-queue', description: '消息队列系统管理界面，主题管理、消息发布与延迟送达、消费者组订阅与消费位点、积压监控折线图、死信队列与重试配置，基于 localStorage 持久化。' },
    { id: 86, title: '便签提醒应用', route: 'sticky-notes', description: '带定时提醒功能的便签管理工具，支持多彩便签、设置提醒闹钟、分类标签管理、网格/列表视图切换、拖拽排序、归档回收站、过期自动清理，所有数据基于 localStorage 持久化。' },
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
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/file-manager" element={<FileManager onBack={() => window.history.back()} />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/css-animation" element={<CSSAnimationPage />} />
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
            <Route path="/exam" element={<ExamPage />} />
            <Route path="/pomodoro" element={<PomodoroPage />} />
            <Route path="/meeting-room" element={<MeetingRoomPage />} />
            <Route path="/product-review" element={<ProductReviewPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/text-diff" element={<TextDiffPage />} />
            <Route path="/todo-list" element={<TodoListPage />} />
            <Route path="/spreadsheet" element={<SpreadsheetPage />} />
            <Route path="/gantt-chart" element={<GanttChartPage />} />
            <Route path="/snippets" element={<SnippetsPage />} />
            <Route path="/mind-map" element={<MindMapPage />} />
            <Route path="/media-player" element={<MediaPlayerPage />} />
            <Route path="/api-debugger" element={<ApiDebuggerPage />} />
            <Route path="/danmaku-player" element={<DanmakuPlayerPage />} />
            <Route path="/regex-tester" element={<RegexTesterPage />} />
            <Route path="/db-designer" element={<DBDesignerPage />} />
            <Route path="/coupon" element={<CouponPage />} />
            <Route path="/currency-converter" element={<CurrencyConverterPage />} />
            <Route path="/fitness-tracker" element={<FitnessTrackerPage />} />
            <Route path="/qrcode" element={<QRCodePage />} />
            <Route path="/git-browser" element={<GitBrowserPage />} />
            <Route path="/whiteboard" element={<WhiteboardPage />} />
            <Route path="/social-feed" element={<SocialFeedPage />} />
            <Route path="/sku-selector" element={<SkuSelectorPage />} />
            <Route path="/tetris" element={<TetrisPage />} />
            <Route path="/minesweeper" element={<MinesweeperPage />} />
            <Route path="/geometry-board" element={<GeometryBoardPage />} />
            <Route path="/flash-sale" element={<FlashSalePage />} />
            <Route path="/funnel-analysis" element={<FunnelAnalysisPage />} />
            <Route path="/i18n-manager" element={<I18nManagerPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/budget-tracker" element={<BudgetTrackerPage />} />
            <Route path="/habit-tracker" element={<HabitTrackerPage />} />
            <Route path="/ticket-system" element={<TicketSystemPage />} />
            <Route path="/sudoku" element={<SudokuPage />} />
            <Route path="/snake-battle" element={<SnakeBattlePage />} />
            <Route path="/union-find" element={<UnionFindPage />} />
            <Route path="/voting-app" element={<VotingApp />} />
            <Route path="/websocket-debugger" element={<WsDebuggerPage />} />
            <Route path="/schedule-planner" element={<SchedulePlannerPage />} />
            <Route path="/event-timeline" element={<EventTimelinePage />} />
            <Route path="/data-importer" element={<DataImporterPage />} />
            <Route path="/data-mask" element={<DataMaskPage />} />
            <Route path="/json-to-ts" element={<JsonToTsPage />} />
            <Route path="/url-tool" element={<UrlToolPage />} />
            <Route path="/release-manager" element={<ReleaseManagerPage />} />
            <Route path="/food-order" element={<FoodOrderPage />} />
            <Route path="/rpg-creator" element={<RpgCreatorPage />} />
            <Route path="/route-recorder" element={<RouteRecorderPage />} />
            <Route path="/grade-manager" element={<GradeManagerPage />} />
            <Route path="/code-sandbox" element={<CodeSandboxPage />} />
            <Route path="/collaborative-doc" element={<CollaborativeDocPage />} />
            <Route path="/video-meeting" element={<VideoMeetingPage />} />
            <Route path="/screenshot-annotator" element={<ScreenshotAnnotatorPage />} />
            <Route path="/menu-designer" element={<MenuDesignerPage />} />
            <Route path="/event-debugger" element={<EventDebuggerPage />} />
            <Route path="/link-game" element={<LinkGamePage />} />
            <Route path="/time-tracker" element={<TimeTrackerPage />} />
            <Route path="/performance-monitor" element={<PerformanceMonitorPage />} />
            <Route path="/tic-tac-toe" element={<TicTacToePage />} />
            <Route path="/svg-path-editor" element={<SvgPathEditorPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/idiom-chain" element={<IdiomChainPage />} />
            <Route path="/exam-grading" element={<ExamGradingPage />} />
            <Route path="/stock-dashboard" element={<StockDashboardPage />} />
            <Route path="/package-manager" element={<PackageManagerPage />} />
            <Route path="/sticky-notes" element={<StickyNotesPage />} />
        </Routes>
    )
}

export default App
