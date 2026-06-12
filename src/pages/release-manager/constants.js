export const STORAGE_KEY = 'solocoder_release_manager_data'

export const PAGE_SIZE = 10

export const RELEASE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  ROLLED_BACK: 'rolled_back',
}

export const RELEASE_STATUS_LABEL = {
  [RELEASE_STATUS.DRAFT]: '草稿',
  [RELEASE_STATUS.PENDING]: '待审核',
  [RELEASE_STATUS.PUBLISHED]: '已发布',
  [RELEASE_STATUS.ROLLED_BACK]: '已回滚',
}

export const RELEASE_STATUS_COLOR = {
  [RELEASE_STATUS.DRAFT]: '#6b7280',
  [RELEASE_STATUS.PENDING]: '#f59e0b',
  [RELEASE_STATUS.PUBLISHED]: '#10b981',
  [RELEASE_STATUS.ROLLED_BACK]: '#ef4444',
}

export const APPROVAL_ACTION = {
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REJECT: 'reject',
  ROLLBACK: 'rollback',
}

export const APPROVAL_ACTION_LABEL = {
  [APPROVAL_ACTION.SUBMIT]: '提交审核',
  [APPROVAL_ACTION.APPROVE]: '审核通过',
  [APPROVAL_ACTION.REJECT]: '审核驳回',
  [APPROVAL_ACTION.ROLLBACK]: '回滚',
}

export const TIMELINE_COLOR = {
  [RELEASE_STATUS.PUBLISHED]: '#10b981',
  [RELEASE_STATUS.DRAFT]: '#ef4444',
  [RELEASE_STATUS.ROLLED_BACK]: '#f97316',
  DEFAULT: '#6b7280',
}

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: RELEASE_STATUS.DRAFT, label: RELEASE_STATUS_LABEL[RELEASE_STATUS.DRAFT] },
  { value: RELEASE_STATUS.PENDING, label: RELEASE_STATUS_LABEL[RELEASE_STATUS.PENDING] },
  { value: RELEASE_STATUS.PUBLISHED, label: RELEASE_STATUS_LABEL[RELEASE_STATUS.PUBLISHED] },
  { value: RELEASE_STATUS.ROLLED_BACK, label: RELEASE_STATUS_LABEL[RELEASE_STATUS.ROLLED_BACK] },
]

export const CURRENT_USER = {
  id: 'u_001',
  name: '当前用户',
}

const FIXED_BASE_TIME = 1700000000000
const DAY_MS = 86400000

export const MOCK_RELEASES = [
  {
    id: 'rel_001',
    version: 'v2.1.0',
    title: '用户体验大版本升级',
    changelog: '# v2.1.0 更新日志\n\n## 新增功能\n- 新增暗色主题支持\n- 新增数据导出功能\n- 新增快捷键操作指南\n\n## 优化改进\n- 优化首页加载速度 30%\n- 优化移动端适配\n- 优化表格滚动性能\n\n## Bug 修复\n- 修复登录页面偶尔白屏的问题\n- 修复日期选择器闰年显示异常',
    releaseDate: new Date(FIXED_BASE_TIME - DAY_MS * 2).toISOString().slice(0, 10),
    publisher: '张三',
    status: RELEASE_STATUS.PUBLISHED,
    createdAt: FIXED_BASE_TIME - DAY_MS * 10,
    updatedAt: FIXED_BASE_TIME - DAY_MS * 2,
    approvalRecords: [
      {
        id: 'ar_001_1',
        action: APPROVAL_ACTION.SUBMIT,
        fromStatus: RELEASE_STATUS.DRAFT,
        toStatus: RELEASE_STATUS.PENDING,
        operator: '张三',
        operatorId: 'u_001',
        timestamp: FIXED_BASE_TIME - DAY_MS * 5,
        remark: '完成全部功能开发，提交审核',
      },
      {
        id: 'ar_001_2',
        action: APPROVAL_ACTION.APPROVE,
        fromStatus: RELEASE_STATUS.PENDING,
        toStatus: RELEASE_STATUS.PUBLISHED,
        operator: '李四',
        operatorId: 'u_002',
        timestamp: FIXED_BASE_TIME - DAY_MS * 2,
        remark: '测试全部通过，同意发布',
      },
    ],
  },
  {
    id: 'rel_002',
    version: 'v2.0.3',
    title: '紧急安全补丁',
    changelog: '# v2.0.3 安全更新\n\n## 安全修复\n- 修复 XSS 注入漏洞\n- 修复 CSRF 令牌校验问题\n- 升级依赖库到安全版本\n\n## 其他\n- 增加敏感操作日志记录',
    releaseDate: new Date(FIXED_BASE_TIME - DAY_MS * 8).toISOString().slice(0, 10),
    publisher: '李四',
    status: RELEASE_STATUS.PUBLISHED,
    createdAt: FIXED_BASE_TIME - DAY_MS * 15,
    updatedAt: FIXED_BASE_TIME - DAY_MS * 8,
    approvalRecords: [
      {
        id: 'ar_002_1',
        action: APPROVAL_ACTION.SUBMIT,
        fromStatus: RELEASE_STATUS.DRAFT,
        toStatus: RELEASE_STATUS.PENDING,
        operator: '李四',
        operatorId: 'u_002',
        timestamp: FIXED_BASE_TIME - DAY_MS * 10,
        remark: '紧急安全修复，申请加急审核',
      },
      {
        id: 'ar_002_2',
        action: APPROVAL_ACTION.APPROVE,
        fromStatus: RELEASE_STATUS.PENDING,
        toStatus: RELEASE_STATUS.PUBLISHED,
        operator: '王五',
        operatorId: 'u_003',
        timestamp: FIXED_BASE_TIME - DAY_MS * 8,
        remark: '加急处理，已验证安全修复有效',
      },
    ],
  },
  {
    id: 'rel_003',
    version: 'v2.0.2',
    title: '性能优化版本',
    changelog: '# v2.0.2 性能优化\n\n## 性能优化\n- 首页渲染性能提升 40%\n- 接口响应时间平均减少 200ms\n- 减少内存占用约 15%\n\n## Bug 修复\n- 修复分页组件偶发跳页问题',
    releaseDate: new Date(FIXED_BASE_TIME - DAY_MS * 12).toISOString().slice(0, 10),
    publisher: '王五',
    status: RELEASE_STATUS.PUBLISHED,
    createdAt: FIXED_BASE_TIME - DAY_MS * 20,
    updatedAt: FIXED_BASE_TIME - DAY_MS * 12,
    approvalRecords: [
      {
        id: 'ar_003_1',
        action: APPROVAL_ACTION.SUBMIT,
        fromStatus: RELEASE_STATUS.DRAFT,
        toStatus: RELEASE_STATUS.PENDING,
        operator: '王五',
        operatorId: 'u_003',
        timestamp: FIXED_BASE_TIME - DAY_MS * 14,
        remark: '性能优化完成，压测达标',
      },
      {
        id: 'ar_003_2',
        action: APPROVAL_ACTION.APPROVE,
        fromStatus: RELEASE_STATUS.PENDING,
        toStatus: RELEASE_STATUS.PUBLISHED,
        operator: '张三',
        operatorId: 'u_001',
        timestamp: FIXED_BASE_TIME - DAY_MS * 12,
        remark: '压测报告达标，同意发布',
      },
    ],
  },
  {
    id: 'rel_004',
    version: 'v2.0.1',
    title: '已回滚的版本',
    changelog: '# v2.0.1\n\n- 新增订单批量导出\n- 新增消息通知设置',
    releaseDate: new Date(FIXED_BASE_TIME - DAY_MS * 18).toISOString().slice(0, 10),
    publisher: '赵六',
    status: RELEASE_STATUS.ROLLED_BACK,
    createdAt: FIXED_BASE_TIME - DAY_MS * 25,
    updatedAt: FIXED_BASE_TIME - DAY_MS * 17,
    approvalRecords: [
      {
        id: 'ar_004_1',
        action: APPROVAL_ACTION.SUBMIT,
        fromStatus: RELEASE_STATUS.DRAFT,
        toStatus: RELEASE_STATUS.PENDING,
        operator: '赵六',
        operatorId: 'u_004',
        timestamp: FIXED_BASE_TIME - DAY_MS * 20,
        remark: '功能开发完成，提交审核',
      },
      {
        id: 'ar_004_2',
        action: APPROVAL_ACTION.APPROVE,
        fromStatus: RELEASE_STATUS.PENDING,
        toStatus: RELEASE_STATUS.PUBLISHED,
        operator: '张三',
        operatorId: 'u_001',
        timestamp: FIXED_BASE_TIME - DAY_MS * 18,
        remark: '同意发布',
      },
      {
        id: 'ar_004_3',
        action: APPROVAL_ACTION.ROLLBACK,
        fromStatus: RELEASE_STATUS.PUBLISHED,
        toStatus: RELEASE_STATUS.ROLLED_BACK,
        operator: '张三',
        operatorId: 'u_001',
        timestamp: FIXED_BASE_TIME - DAY_MS * 17,
        remark: '线上出现订单数据不一致问题，紧急回滚',
      },
    ],
  },
  {
    id: 'rel_005',
    version: 'v2.0.0',
    title: '2.0 架构重构版本',
    changelog: '# v2.0.0 重大版本\n\n## 架构升级\n- 全面升级到 React 18\n- 引入微前端架构\n- 后端服务全面容器化\n\n## 功能重构\n- 重构用户权限系统\n- 重构数据层 ORM\n- 重构缓存层策略\n\n## 破坏性变更\n- 旧版 API 废弃，请迁移到 v2 接口\n- 部分配置项格式变更',
    releaseDate: new Date(FIXED_BASE_TIME - DAY_MS * 30).toISOString().slice(0, 10),
    publisher: '张三',
    status: RELEASE_STATUS.PUBLISHED,
    createdAt: FIXED_BASE_TIME - DAY_MS * 45,
    updatedAt: FIXED_BASE_TIME - DAY_MS * 30,
    approvalRecords: [
      {
        id: 'ar_005_1',
        action: APPROVAL_ACTION.SUBMIT,
        fromStatus: RELEASE_STATUS.DRAFT,
        toStatus: RELEASE_STATUS.PENDING,
        operator: '张三',
        operatorId: 'u_001',
        timestamp: FIXED_BASE_TIME - DAY_MS * 35,
        remark: '架构重构完成，全量回归测试通过',
      },
      {
        id: 'ar_005_2',
        action: APPROVAL_ACTION.APPROVE,
        fromStatus: RELEASE_STATUS.PENDING,
        toStatus: RELEASE_STATUS.PUBLISHED,
        operator: '王五',
        operatorId: 'u_003',
        timestamp: FIXED_BASE_TIME - DAY_MS * 30,
        remark: '里程碑版本，审批通过',
      },
    ],
  },
  {
    id: 'rel_006',
    version: 'v1.9.5',
    title: '审核中的版本',
    changelog: '# v1.9.5\n\n## 新增\n- 报表支持自定义列\n- 支持自定义主题色\n\n## 修复\n- 修复 IE11 兼容性问题',
    releaseDate: new Date(FIXED_BASE_TIME + DAY_MS * 1).toISOString().slice(0, 10),
    publisher: '李四',
    status: RELEASE_STATUS.PENDING,
    createdAt: FIXED_BASE_TIME - DAY_MS * 3,
    updatedAt: FIXED_BASE_TIME - DAY_MS * 1,
    approvalRecords: [
      {
        id: 'ar_006_1',
        action: APPROVAL_ACTION.SUBMIT,
        fromStatus: RELEASE_STATUS.DRAFT,
        toStatus: RELEASE_STATUS.PENDING,
        operator: '李四',
        operatorId: 'u_002',
        timestamp: FIXED_BASE_TIME - DAY_MS * 1,
        remark: '功能完成，待审核',
      },
    ],
  },
  {
    id: 'rel_007',
    version: 'v1.9.4',
    title: '被驳回的草稿',
    changelog: '# v1.9.4\n\n- 尝试新增数据导入功能',
    releaseDate: '',
    publisher: '王五',
    status: RELEASE_STATUS.DRAFT,
    createdAt: FIXED_BASE_TIME - DAY_MS * 4,
    updatedAt: FIXED_BASE_TIME,
    approvalRecords: [
      {
        id: 'ar_007_1',
        action: APPROVAL_ACTION.SUBMIT,
        fromStatus: RELEASE_STATUS.DRAFT,
        toStatus: RELEASE_STATUS.PENDING,
        operator: '王五',
        operatorId: 'u_003',
        timestamp: FIXED_BASE_TIME - DAY_MS * 2,
        remark: '提交审核',
      },
      {
        id: 'ar_007_2',
        action: APPROVAL_ACTION.REJECT,
        fromStatus: RELEASE_STATUS.PENDING,
        toStatus: RELEASE_STATUS.DRAFT,
        operator: '张三',
        operatorId: 'u_001',
        timestamp: FIXED_BASE_TIME,
        remark: '变更日志过于简单，请补充每个功能的详细说明，并补充测试用例链接',
      },
    ],
  },
  {
    id: 'rel_008',
    version: 'v1.9.3',
    title: '草稿：即将开发的新功能',
    changelog: '',
    releaseDate: '',
    publisher: '赵六',
    status: RELEASE_STATUS.DRAFT,
    createdAt: FIXED_BASE_TIME - DAY_MS * 1,
    updatedAt: FIXED_BASE_TIME - DAY_MS * 1,
    approvalRecords: [],
  },
]
