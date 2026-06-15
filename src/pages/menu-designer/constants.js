export const STORAGE_KEY = 'menu-designer-state'

export const MENU_TYPES = {
  LINK: 'link',
  GROUP: 'group',
  DIVIDER: 'divider',
}

export const LAYOUT_TYPES = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  COLLAPSIBLE: 'collapsible',
}

export const TARGET_TYPES = {
  SELF: '_self',
  BLANK: '_blank',
}

export const PRESET_ICONS = [
  { id: 'home', emoji: '🏠', label: '首页' },
  { id: 'user', emoji: '👤', label: '用户' },
  { id: 'settings', emoji: '⚙️', label: '设置' },
  { id: 'mail', emoji: '📧', label: '邮件' },
  { id: 'bell', emoji: '🔔', label: '通知' },
  { id: 'folder', emoji: '📁', label: '文件夹' },
  { id: 'file', emoji: '📄', label: '文件' },
  { id: 'search', emoji: '🔍', label: '搜索' },
  { id: 'star', emoji: '⭐', label: '收藏' },
  { id: 'heart', emoji: '❤️', label: '喜欢' },
  { id: 'gear', emoji: '🔧', label: '工具' },
  { id: 'dashboard', emoji: '📊', label: '仪表盘' },
  { id: 'chart', emoji: '📈', label: '图表' },
  { id: 'lock', emoji: '🔒', label: '权限' },
  { id: 'logout', emoji: '🚪', label: '退出' },
  { id: 'help', emoji: '❓', label: '帮助' },
]

export const DEFAULT_TITLE = '后台管理系统'

export const DEFAULT_MENU = [
  {
    id: 'root',
    name: '首页',
    type: 'link',
    icon: 'home',
    link: '#/dashboard',
    target: '_self',
    permission: '',
    children: [],
  },
  {
    id: 'system',
    name: '系统管理',
    type: 'group',
    icon: 'gear',
    link: '',
    target: '_self',
    permission: 'admin',
    children: [
      {
        id: 'user-mgr',
        name: '用户管理',
        type: 'link',
        icon: 'user',
        link: '#/users',
        target: '_self',
        permission: 'admin',
        children: [],
      },
      {
        id: 'role-mgr',
        name: '角色管理',
        type: 'link',
        icon: 'lock',
        link: '#/roles',
        target: '_self',
        permission: 'admin',
        children: [],
      },
      {
        id: 'divider-1',
        name: '---',
        type: 'divider',
        icon: '',
        link: '',
        target: '_self',
        permission: '',
        children: [],
      },
      {
        id: 'settings-mgr',
        name: '系统设置',
        type: 'group',
        icon: 'settings',
        link: '',
        target: '_self',
        permission: 'admin',
        children: [
          {
            id: 'basic-settings',
            name: '基础设置',
            type: 'link',
            icon: 'gear',
            link: '#/settings/basic',
            target: '_self',
            permission: 'admin',
            children: [],
          },
          {
            id: 'security-settings',
            name: '安全设置',
            type: 'link',
            icon: 'lock',
            link: '#/settings/security',
            target: '_blank',
            permission: 'admin',
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 'content',
    name: '内容管理',
    type: 'group',
    icon: 'folder',
    link: '',
    target: '_self',
    permission: '',
    children: [
      {
        id: 'articles',
        name: '文章列表',
        type: 'link',
        icon: 'file',
        link: '#/articles',
        target: '_self',
        permission: '',
        children: [],
      },
      {
        id: 'categories',
        name: '分类管理',
        type: 'link',
        icon: 'folder',
        link: '#/categories',
        target: '_self',
        permission: '',
        children: [],
      },
    ],
  },
  {
    id: 'notifications',
    name: '通知中心',
    type: 'link',
    icon: 'bell',
    link: '#/notifications',
    target: '_self',
    permission: '',
    children: [],
  },
]

export const DEFAULT_STATE = {
  title: DEFAULT_TITLE,
  layout: LAYOUT_TYPES.VERTICAL,
  menu: DEFAULT_MENU,
}
