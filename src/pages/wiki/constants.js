export const STORAGE_KEY = 'wiki-data'

export const ROLE_TYPES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
}

export const ROLE_LABELS = {
  [ROLE_TYPES.ADMIN]: '管理员',
  [ROLE_TYPES.EDITOR]: '编辑者',
  [ROLE_TYPES.VIEWER]: '阅读者',
}

export const DEFAULT_MEMBERS = [
  {
    id: 'member-1',
    name: '张三',
    role: ROLE_TYPES.ADMIN,
    joinedAt: Date.now() - 86400000 * 30,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
  },
  {
    id: 'member-2',
    name: '李四',
    role: ROLE_TYPES.EDITOR,
    joinedAt: Date.now() - 86400000 * 20,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
  },
  {
    id: 'member-3',
    name: '王五',
    role: ROLE_TYPES.VIEWER,
    joinedAt: Date.now() - 86400000 * 10,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
  },
]

export const getDefaultData = () => {
  const now = Date.now()

  const space1Id = 'space-tech'
  const space2Id = 'space-product'
  const space3Id = 'space-design'

  const page1Id = 'page-1'
  const page2Id = 'page-2'
  const page3Id = 'page-3'
  const page4Id = 'page-4'
  const page5Id = 'page-5'
  const page6Id = 'page-6'

  return {
    spaces: [
      {
        id: space1Id,
        name: '技术文档',
        description: '团队技术规范、架构设计、API 文档等',
        createdAt: now - 86400000 * 60,
        updatedAt: now - 86400000 * 2,
        members: ['member-1', 'member-2', 'member-3'],
      },
      {
        id: space2Id,
        name: '产品需求',
        description: '产品需求文档、原型说明、迭代计划等',
        createdAt: now - 86400000 * 45,
        updatedAt: now - 86400000 * 5,
        members: ['member-1', 'member-2'],
      },
      {
        id: space3Id,
        name: '设计规范',
        description: 'UI 设计规范、组件库、交互指南等',
        createdAt: now - 86400000 * 30,
        updatedAt: now - 86400000 * 1,
        members: ['member-1', 'member-3'],
      },
    ],
    pages: [
      {
        id: page1Id,
        spaceId: space1Id,
        parentId: null,
        title: 'React 开发规范',
        content: `# React 开发规范

## 1. 组件命名

- 使用 PascalCase 命名组件
- 使用 camelCase 命名属性和方法

## 2. 目录结构

\`\`\`
src/
  components/
    Button/
      index.jsx
      Button.css
  pages/
    Home/
      index.jsx
\`\`\`

## 3. 状态管理

- 优先使用 React Hooks
- 复杂状态考虑使用 Context 或第三方库

## 代码示例

| 功能 | 推荐方式 | 不推荐 |
|------|---------|--------|
| 状态 | useState | this.state |
| 副作用 | useEffect | componentDidMount |
| 上下文 | useContext | Consumer |

**注意**: 保持组件简洁，职责单一。
`,
        tags: ['前端', 'React', '规范'],
        children: [page2Id, page3Id],
        createdAt: now - 86400000 * 30,
        updatedAt: now - 86400000 * 2,
        versions: [
          {
            id: 'v1',
            version: 1,
            title: 'React 开发规范',
            content: '# React 开发规范\n\n初始版本',
            createdAt: now - 86400000 * 30,
          },
          {
            id: 'v2',
            version: 2,
            title: 'React 开发规范',
            content: '# React 开发规范\n\n## 1. 组件命名\n\n更新版本',
            createdAt: now - 86400000 * 15,
          },
          {
            id: 'v3',
            version: 3,
            title: 'React 开发规范',
            content: '# React 开发规范\n\n## 1. 组件命名\n\n## 2. 目录结构\n\n当前版本',
            createdAt: now - 86400000 * 2,
          },
        ],
      },
      {
        id: page2Id,
        spaceId: space1Id,
        parentId: page1Id,
        title: 'Hooks 使用指南',
        content: `# Hooks 使用指南

## useState

\`\`\`js
const [count, setCount] = useState(0)
\`\`\`

## useEffect

用于处理副作用，如数据获取、订阅等。

**标签**: React, Hooks
`,
        tags: ['React', 'Hooks', '入门指南'],
        children: [],
        createdAt: now - 86400000 * 20,
        updatedAt: now - 86400000 * 3,
        versions: [
          {
            id: 'v1',
            version: 1,
            title: 'Hooks 使用指南',
            content: '# Hooks 使用指南\n\n初始版本',
            createdAt: now - 86400000 * 20,
          },
        ],
      },
      {
        id: page3Id,
        spaceId: space1Id,
        parentId: page1Id,
        title: '性能优化技巧',
        content: `# 性能优化技巧

## 使用 memo 优化渲染

\`\`\`js
const MemoizedComponent = React.memo(MyComponent)
\`\`\`

## 使用 useMemo 和 useCallback

避免不必要的计算和函数重建。
`,
        tags: ['性能优化', 'React'],
        children: [],
        createdAt: now - 86400000 * 10,
        updatedAt: now - 86400000 * 1,
        versions: [
          {
            id: 'v1',
            version: 1,
            title: '性能优化技巧',
            content: '# 性能优化技巧\n\n初始版本',
            createdAt: now - 86400000 * 10,
          },
        ],
      },
      {
        id: page4Id,
        spaceId: space2Id,
        parentId: null,
        title: '产品需求文档模板',
        content: `# 产品需求文档模板

## 1. 项目背景

描述项目的背景和目标。

## 2. 用户画像

描述目标用户群体。

## 3. 功能需求

详细描述功能需求。

## 4. 非功能需求

性能、安全、兼容性等。
`,
        tags: ['产品', 'PRD', '模板'],
        children: [page5Id],
        createdAt: now - 86400000 * 25,
        updatedAt: now - 86400000 * 5,
        versions: [
          {
            id: 'v1',
            version: 1,
            title: '产品需求文档模板',
            content: '# 产品需求文档模板\n\n初始版本',
            createdAt: now - 86400000 * 25,
          },
        ],
      },
      {
        id: page5Id,
        spaceId: space2Id,
        parentId: page4Id,
        title: '用户故事编写规范',
        content: `# 用户故事编写规范

## 格式

作为 [角色]，我想要 [功能]，以便 [价值]。

## 示例

作为 **普通用户**，我想要 **重置密码**，以便 **忘记密码时可以重新登录**。
`,
        tags: ['产品', '方法论', '入门指南'],
        children: [],
        createdAt: now - 86400000 * 15,
        updatedAt: now - 86400000 * 4,
        versions: [
          {
            id: 'v1',
            version: 1,
            title: '用户故事编写规范',
            content: '# 用户故事编写规范\n\n初始版本',
            createdAt: now - 86400000 * 15,
          },
        ],
      },
      {
        id: page6Id,
        spaceId: space3Id,
        parentId: null,
        title: '设计系统概览',
        content: `# 设计系统概览

## 色彩规范

- 主色: #1677ff
- 成功色: #52c41a
- 警告色: #faad14
- 错误色: #ff4d4f

## 字体规范

- 标题: 16px - 24px
- 正文: 14px
- 辅助文字: 12px
`,
        tags: ['设计', 'UI', '规范'],
        children: [],
        createdAt: now - 86400000 * 20,
        updatedAt: now - 86400000 * 1,
        versions: [
          {
            id: 'v1',
            version: 1,
            title: '设计系统概览',
            content: '# 设计系统概览\n\n初始版本',
            createdAt: now - 86400000 * 20,
          },
        ],
      },
    ],
    members: DEFAULT_MEMBERS,
    currentUserId: 'member-1',
  }
}

export const DEBOUNCE_DELAY = 2000
