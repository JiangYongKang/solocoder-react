export const STORAGE_KEY = 'resume-editor-state'

export const TEMPLATES = {
  CLASSIC: 'classic',
  MODERN: 'modern',
  MINIMAL: 'minimal',
}

export const TEMPLATE_INFO = {
  [TEMPLATES.CLASSIC]: {
    id: TEMPLATES.CLASSIC,
    name: '经典',
    description: '传统专业风格，层次分明',
    primaryColor: '#1e3a5f',
    accentColor: '#c9a227',
  },
  [TEMPLATES.MODERN]: {
    id: TEMPLATES.MODERN,
    name: '现代',
    description: '双栏布局，时尚简洁',
    primaryColor: '#2563eb',
    accentColor: '#10b981',
  },
  [TEMPLATES.MINIMAL]: {
    id: TEMPLATES.MINIMAL,
    name: '简约',
    description: '留白充足，清爽干净',
    primaryColor: '#374151',
    accentColor: '#6b7280',
  },
}

export const MODULE_TYPES = {
  BASIC_INFO: 'basic_info',
  JOB_INTENTION: 'job_intention',
  EDUCATION: 'education',
  WORK_EXPERIENCE: 'work_experience',
  PROJECT_EXPERIENCE: 'project_experience',
  SKILLS: 'skills',
  SELF_EVALUATION: 'self_evaluation',
  CUSTOM: 'custom',
}

export const MODULE_LABELS = {
  [MODULE_TYPES.BASIC_INFO]: '基本信息',
  [MODULE_TYPES.JOB_INTENTION]: '求职意向',
  [MODULE_TYPES.EDUCATION]: '教育经历',
  [MODULE_TYPES.WORK_EXPERIENCE]: '工作经历',
  [MODULE_TYPES.PROJECT_EXPERIENCE]: '项目经历',
  [MODULE_TYPES.SKILLS]: '技能特长',
  [MODULE_TYPES.SELF_EVALUATION]: '自我评价',
  [MODULE_TYPES.CUSTOM]: '自定义模块',
}

export const MODULE_ICONS = {
  [MODULE_TYPES.BASIC_INFO]: '👤',
  [MODULE_TYPES.JOB_INTENTION]: '🎯',
  [MODULE_TYPES.EDUCATION]: '🎓',
  [MODULE_TYPES.WORK_EXPERIENCE]: '💼',
  [MODULE_TYPES.PROJECT_EXPERIENCE]: '🚀',
  [MODULE_TYPES.SKILLS]: '⚡',
  [MODULE_TYPES.SELF_EVALUATION]: '✨',
  [MODULE_TYPES.CUSTOM]: '📝',
}

export const NON_DELETABLE_MODULES = [MODULE_TYPES.BASIC_INFO]

export const LIST_MODULE_TYPES = [
  MODULE_TYPES.EDUCATION,
  MODULE_TYPES.WORK_EXPERIENCE,
  MODULE_TYPES.PROJECT_EXPERIENCE,
]

export const BASIC_INFO_FIELDS = [
  { key: 'name', label: '姓名', type: 'text', placeholder: '请输入姓名' },
  { key: 'phone', label: '联系电话', type: 'tel', placeholder: '请输入手机号' },
  { key: 'email', label: '邮箱', type: 'email', placeholder: '请输入邮箱' },
  { key: 'location', label: '所在地', type: 'text', placeholder: '请输入所在城市' },
  { key: 'homepage', label: '个人主页', type: 'url', placeholder: 'https://' },
]

export const JOB_INTENTION_FIELDS = [
  { key: 'position', label: '期望职位', type: 'text', placeholder: '请输入期望职位' },
  { key: 'salary', label: '期望薪资', type: 'text', placeholder: '例如：15k-25k' },
  { key: 'city', label: '期望城市', type: 'text', placeholder: '请输入期望工作城市' },
  { key: 'status', label: '求职状态', type: 'text', placeholder: '例如：在职，考虑机会' },
]

export const LIST_ITEM_FIELDS = {
  [MODULE_TYPES.EDUCATION]: [
    { key: 'startDate', label: '开始时间', type: 'text', placeholder: '如：2018.09' },
    { key: 'endDate', label: '结束时间', type: 'text', placeholder: '如：2022.06' },
    { key: 'school', label: '学校名称', type: 'text', placeholder: '请输入学校名称' },
    { key: 'major', label: '专业', type: 'text', placeholder: '请输入专业名称' },
    { key: 'degree', label: '学历', type: 'text', placeholder: '如：本科' },
    { key: 'description', label: '描述', type: 'textarea', placeholder: '主修课程、获奖情况等' },
  ],
  [MODULE_TYPES.WORK_EXPERIENCE]: [
    { key: 'startDate', label: '开始时间', type: 'text', placeholder: '如：2022.07' },
    { key: 'endDate', label: '结束时间', type: 'text', placeholder: '如：至今' },
    { key: 'company', label: '公司名称', type: 'text', placeholder: '请输入公司名称' },
    { key: 'position', label: '职位', type: 'text', placeholder: '请输入职位名称' },
    { key: 'description', label: '工作描述', type: 'textarea', placeholder: '工作职责、业绩成果等' },
  ],
  [MODULE_TYPES.PROJECT_EXPERIENCE]: [
    { key: 'startDate', label: '开始时间', type: 'text', placeholder: '如：2023.01' },
    { key: 'endDate', label: '结束时间', type: 'text', placeholder: '如：2023.06' },
    { key: 'name', label: '项目名称', type: 'text', placeholder: '请输入项目名称' },
    { key: 'role', label: '担任角色', type: 'text', placeholder: '如：前端开发' },
    { key: 'description', label: '项目描述', type: 'textarea', placeholder: '项目背景、技术栈、个人贡献等' },
  ],
}

export const PHONE_REGEX = /^1[3-9]\d{9}$/
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297
