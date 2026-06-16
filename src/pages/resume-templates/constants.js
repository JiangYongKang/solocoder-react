export const STORAGE_KEY = 'resume-templates-state'
export const FAVORITES_STORAGE_KEY = 'resume-templates-favorites'
export const RATINGS_STORAGE_KEY = 'resume-templates-ratings'

export const TEMPLATE_IDS = {
  CLASSIC: 'classic',
  MODERN: 'modern',
  MINIMAL: 'minimal',
  CREATIVE: 'creative',
  TWO_COLUMN: 'two-column',
  DARK: 'dark',
}

export const TEMPLATES = [
  {
    id: TEMPLATE_IDS.CLASSIC,
    name: '经典黑白',
    description: '传统专业风格，层次分明，适合正式场合',
    primaryColor: '#1a1a1a',
    accentColor: '#333333',
    bgColor: '#ffffff',
    textColor: '#1a1a1a',
    layout: 'single',
  },
  {
    id: TEMPLATE_IDS.MODERN,
    name: '现代蓝白',
    description: '清爽现代风格，蓝色调点缀，科技感十足',
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    bgColor: '#ffffff',
    textColor: '#1f2937',
    layout: 'single',
  },
  {
    id: TEMPLATE_IDS.MINIMAL,
    name: '极简线条',
    description: '极简主义设计，大量留白，突出内容',
    primaryColor: '#374151',
    accentColor: '#6b7280',
    bgColor: '#ffffff',
    textColor: '#111827',
    layout: 'single',
  },
  {
    id: TEMPLATE_IDS.CREATIVE,
    name: '创意卡片',
    description: '卡片式布局，活泼有创意，适合设计岗位',
    primaryColor: '#7c3aed',
    accentColor: '#a78bfa',
    bgColor: '#faf5ff',
    textColor: '#1f2937',
    layout: 'card',
  },
  {
    id: TEMPLATE_IDS.TWO_COLUMN,
    name: '双栏布局',
    description: '左右双栏结构，信息密度高，条理清晰',
    primaryColor: '#0891b2',
    accentColor: '#06b6d4',
    bgColor: '#ffffff',
    textColor: '#1f2937',
    layout: 'two-column',
  },
  {
    id: TEMPLATE_IDS.DARK,
    name: '深色主题',
    description: '深色背景，亮色文字，现代感强烈',
    primaryColor: '#e5e7eb',
    accentColor: '#60a5fa',
    bgColor: '#111827',
    textColor: '#f3f4f6',
    layout: 'single',
  },
]

export const MODULE_TYPES = {
  PERSONAL_INFO: 'personal_info',
  EDUCATION: 'education',
  WORK_EXPERIENCE: 'work_experience',
  PROJECTS: 'projects',
  SKILLS: 'skills',
  SELF_EVALUATION: 'self_evaluation',
}

export const MODULE_LABELS = {
  [MODULE_TYPES.PERSONAL_INFO]: '个人信息',
  [MODULE_TYPES.EDUCATION]: '教育经历',
  [MODULE_TYPES.WORK_EXPERIENCE]: '工作经历',
  [MODULE_TYPES.PROJECTS]: '项目经验',
  [MODULE_TYPES.SKILLS]: '技能标签',
  [MODULE_TYPES.SELF_EVALUATION]: '自我评价',
}

export const MODULE_ICONS = {
  [MODULE_TYPES.PERSONAL_INFO]: '👤',
  [MODULE_TYPES.EDUCATION]: '🎓',
  [MODULE_TYPES.WORK_EXPERIENCE]: '💼',
  [MODULE_TYPES.PROJECTS]: '🚀',
  [MODULE_TYPES.SKILLS]: '⚡',
  [MODULE_TYPES.SELF_EVALUATION]: '✨',
}

export const DEFAULT_MODULE_CONTENT = {
  [MODULE_TYPES.PERSONAL_INFO]: `# 张三

**前端开发工程师**

📱 138-0000-0000 | 📧 zhangsan@example.com

📍 北京市 | 🔗 github.com/zhangsan`,

  [MODULE_TYPES.EDUCATION]: `## 教育经历

**北京大学** | 计算机科学与技术 | 本科
*2018.09 - 2022.06*

- 主修课程：数据结构、算法设计、操作系统、计算机网络
- GPA: 3.8/4.0，获得校级一等奖学金
- 校级优秀毕业生`,

  [MODULE_TYPES.WORK_EXPERIENCE]: `## 工作经历

**高级前端工程师** | ABC 科技有限公司
*2022.07 - 至今*

- 负责公司核心产品的前端架构设计与开发，用户量达 100 万+
- 主导前端性能优化项目，页面加载速度提升 40%
- 搭建组件库和开发规范，提升团队开发效率 30%
- 带领 5 人小组完成多个重点项目交付

**前端开发实习生** | XYZ 互联网公司
*2021.06 - 2021.09*

- 参与电商平台前端开发，负责商品详情页和购物车模块
- 使用 React + TypeScript 开发，保证代码质量和可维护性`,

  [MODULE_TYPES.PROJECTS]: `## 项目经验

**企业级后台管理系统**
*技术栈：React + TypeScript + Ant Design*

- 从零搭建企业级中后台系统，包含权限管理、数据可视化等模块
- 设计并实现可复用的业务组件 20+，被多个项目采用
- 优化打包配置，构建时间减少 50%

**在线协作文档**
*技术栈：Vue3 + WebSocket + Canvas*

- 实现多人实时协作编辑功能，支持富文本和表格
- 使用 CRDT 算法解决冲突，保证数据一致性
- 项目获公司年度最佳创新项目奖`,

  [MODULE_TYPES.SKILLS]: `## 技能标签

**前端技术**
- React / Vue3 / TypeScript
- HTML5 / CSS3 / Sass / Less
- Webpack / Vite / Rollup

**其他技能**
- Node.js / Express
- Git / CI/CD
- 性能优化 / 工程化
- 英语 CET-6，可读写技术文档`,

  [MODULE_TYPES.SELF_EVALUATION]: `## 自我评价

- 5年前端开发经验，熟悉主流前端框架和工程化实践
- 具备良好的代码审美和架构设计能力，追求代码质量
- 热爱技术，持续学习新技术，有技术博客和开源项目
- 良好的沟通协作能力，有团队管理经验
- 工作认真负责，能承受压力，具备快速学习能力`,
}

export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297
export const A4_ASPECT_RATIO = A4_HEIGHT_MM / A4_WIDTH_MM
