export const STORAGE_KEY = 'tag_manager_data'
export const TREND_DATA_KEY = 'tag_manager_trend_data'

export const DEFAULT_COLOR = '#3b82f6'

export const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
]

export const RESOURCE_TYPES = ['文章', '视频', '图片', '文档', '音频', '代码']

export const RESOURCE_NAMES = [
  '前端开发指南',
  'React 最佳实践',
  'Vue3 入门教程',
  'TypeScript 高级特性',
  'Node.js 性能优化',
  '微服务架构设计',
  '数据库优化实战',
  'Docker 容器化部署',
  'Kubernetes 集群管理',
  'GraphQL 接口设计',
  'RESTful API 规范',
  'Webpack 配置详解',
  'Vite 构建工具',
  'CSS Grid 布局',
  'Flexbox 完全指南',
  '响应式设计模式',
  'JavaScript 设计模式',
  '算法与数据结构',
  '计算机网络基础',
  '操作系统原理',
]

export const PAGE_SIZE = 10
export const TREND_DAYS = 7
export const TOP_TREND_TAGS = 5

export const MOCK_TAGS = [
  {
    id: 'tag_frontend',
    name: '前端',
    parentId: null,
    color: '#3b82f6',
    resourceCount: 12,
    order: 0,
  },
  {
    id: 'tag_backend',
    name: '后端',
    parentId: null,
    color: '#22c55e',
    resourceCount: 8,
    order: 1,
  },
  {
    id: 'tag_react',
    name: 'React',
    parentId: 'tag_frontend',
    color: '#0ea5e9',
    resourceCount: 6,
    order: 0,
  },
  {
    id: 'tag_vue',
    name: 'Vue',
    parentId: 'tag_frontend',
    color: '#10b981',
    resourceCount: 4,
    order: 1,
  },
  {
    id: 'tag_hooks',
    name: 'Hooks',
    parentId: 'tag_react',
    color: '#6366f1',
    resourceCount: 3,
    order: 0,
  },
  {
    id: 'tag_node',
    name: 'Node.js',
    parentId: 'tag_backend',
    color: '#84cc16',
    resourceCount: 5,
    order: 0,
  },
  {
    id: 'tag_database',
    name: '数据库',
    parentId: 'tag_backend',
    color: '#f59e0b',
    resourceCount: 3,
    order: 1,
  },
  {
    id: 'tag_devops',
    name: 'DevOps',
    parentId: null,
    color: '#a855f7',
    resourceCount: 7,
    order: 2,
  },
  {
    id: 'tag_docker',
    name: 'Docker',
    parentId: 'tag_devops',
    color: '#06b6d4',
    resourceCount: 4,
    order: 0,
  },
]
