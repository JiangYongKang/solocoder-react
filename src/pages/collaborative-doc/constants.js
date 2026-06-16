export const STORAGE_KEY = 'collaborative-doc-data'

export const COLLABORATOR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#FF8C42',
  '#6C5CE7',
  '#A8E6CF',
  '#FFD93D',
]

export const DEFAULT_COLLABORATORS = [
  { id: 'user-1', name: '张三', initials: '张', online: true, status: '正在编辑文档标题' },
  { id: 'user-2', name: '李四', initials: '李', online: true, status: '正在编辑第 2 段' },
  { id: 'user-3', name: '王五', initials: '王', online: true, status: '正在编辑第 3 段' },
  { id: 'user-4', name: '赵六', initials: '赵', online: false, status: '离线' },
  { id: 'user-5', name: '陈七', initials: '陈', online: true, status: '正在查看文档' },
]

export const CURRENT_USER = {
  id: 'current-user',
  name: '我',
  initials: '我',
}

export const REVISION_TYPE = {
  ADD: 'add',
  DELETE: 'delete',
  FORMAT: 'format',
}

export const DEFAULT_PARAGRAPHS = [
  {
    id: 'p-1',
    content: '项目概述',
    lockedBy: null,
    modifiedBy: 'current-user',
  },
  {
    id: 'p-2',
    content: '这是一个多人协作文档编辑系统的演示页面，模拟类似 Google Docs 的实时协同编辑体验。系统支持多用户同时编辑文档，每个用户的光标位置会实时显示，并以不同颜色标记。',
    lockedBy: null,
    modifiedBy: 'user-1',
  },
  {
    id: 'p-3',
    content: '核心功能特性包括：多人光标实时显示、段落级别锁定保护、修订痕迹追踪、版本历史管理、评论批注功能以及在线协作者状态展示。',
    lockedBy: null,
    modifiedBy: 'user-2',
  },
  {
    id: 'p-4',
    content: '段落锁定功能',
    lockedBy: null,
    modifiedBy: 'current-user',
  },
  {
    id: 'p-5',
    content: '点击段落左侧的锁图标可以锁定或解锁段落。被锁定的段落会显示灰色半透明背景，内容不可编辑。只有锁定该段落的用户本人才能解锁。虚拟协作者也会随机锁定某些段落，模拟真实协作场景。',
    lockedBy: 'user-3',
    modifiedBy: 'user-3',
  },
  {
    id: 'p-6',
    content: '修订痕迹功能',
    lockedBy: null,
    modifiedBy: 'current-user',
  },
  {
    id: 'p-7',
    content: '开启修订模式后，所有的增删改操作都会留下痕迹。新增的文字以绿色背景和下划线标记，删除的文字以红色背景和删除线标记，格式修改以蓝色虚线边框标记。可以逐条或批量接受/拒绝修订。',
    lockedBy: null,
    modifiedBy: 'user-2',
  },
]

export const DEFAULT_COMMENTS = [
  {
    id: 'c-1',
    paragraphId: 'p-2',
    text: '这是一个多人协作文档编辑系统的演示页面',
    authorId: 'user-1',
    content: '这里的描述可以更详细一些，建议补充技术架构说明。',
    createdAt: Date.now() - 3600000,
    resolved: false,
    replies: [
      {
        id: 'r-1',
        authorId: 'user-2',
        content: '同意，后续会补充技术选型和架构图。',
        createdAt: Date.now() - 1800000,
      },
    ],
  },
  {
    id: 'c-2',
    paragraphId: 'p-5',
    text: '点击段落左侧的锁图标可以锁定或解锁段落',
    authorId: 'user-3',
    content: '锁定时是否需要添加锁定原因说明？',
    createdAt: Date.now() - 7200000,
    resolved: true,
    replies: [],
  },
]

export const DEFAULT_REVISIONS = []

export const DEFAULT_VERSIONS = [
  {
    id: 'v-1',
    version: 1,
    title: '初始版本',
    paragraphs: DEFAULT_PARAGRAPHS,
    createdAt: Date.now() - 86400000,
  },
]

export const getDefaultData = () => ({
  title: '多人协作文档',
  paragraphs: DEFAULT_PARAGRAPHS,
  comments: DEFAULT_COMMENTS,
  revisions: DEFAULT_REVISIONS,
  versions: DEFAULT_VERSIONS,
  collaborators: DEFAULT_COLLABORATORS,
  cursors: DEFAULT_COLLABORATORS.filter((c) => c.online).map((c, idx) => ({
    userId: c.id,
    paragraphId: DEFAULT_PARAGRAPHS[idx % DEFAULT_PARAGRAPHS.length].id,
    offset: 0,
  })),
  revisionMode: false,
  currentUserId: CURRENT_USER.id,
  notifications: [],
})
