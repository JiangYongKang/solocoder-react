export const STORAGE_KEY = 'solocoder_crm_customers'
export const FOLLOWUP_STORAGE_KEY = 'solocoder_crm_followups'
export const CURRENT_USER_KEY = 'solocoder_crm_current_user'

export const CUSTOMER_SOURCES = ['官网', '推荐', '展会', '电话营销', '其他']

export const CUSTOMER_STATUS = {
  NEW: 'new',
  INTENTION: 'intention',
  NEGOTIATION: 'negotiation',
  CLOSED: 'closed',
}

export const CUSTOMER_STATUS_LABEL = {
  [CUSTOMER_STATUS.NEW]: '新客户',
  [CUSTOMER_STATUS.INTENTION]: '意向',
  [CUSTOMER_STATUS.NEGOTIATION]: '洽谈',
  [CUSTOMER_STATUS.CLOSED]: '成交',
}

export const CUSTOMER_STATUS_COLOR = {
  [CUSTOMER_STATUS.NEW]: '#6b7280',
  [CUSTOMER_STATUS.INTENTION]: '#3b82f6',
  [CUSTOMER_STATUS.NEGOTIATION]: '#f59e0b',
  [CUSTOMER_STATUS.CLOSED]: '#10b981',
}

export const FOLLOWUP_METHODS = ['电话', '拜访', '邮件', '其他']

export const SORT_FIELDS = {
  NAME: 'name',
  COMPANY: 'company',
  PHONE: 'phone',
  EMAIL: 'email',
  SOURCE: 'source',
  STATUS: 'status',
  CREATED_AT: 'createdAt',
}

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
}

export const PAGE_SIZE = 10

export const USERS = [
  { id: 'u_001', name: '张三', avatar: '张' },
  { id: 'u_002', name: '李四', avatar: '李' },
  { id: 'u_003', name: '王五', avatar: '王' },
  { id: 'u_004', name: '赵六', avatar: '赵' },
]

export const DEFAULT_CURRENT_USER_ID = 'u_001'

const FIXED_BASE_TIME = 1700000000000
const DAY_MS = 86400000

export const MOCK_CUSTOMERS = [
  {
    id: 'c_001',
    name: '陈总',
    company: '北京科技有限公司',
    phone: '13800138001',
    email: 'chen@example.com',
    source: '官网',
    status: CUSTOMER_STATUS.NEW,
    ownerId: 'u_001',
    remark: '对企业管理系统有初步兴趣',
    createdAt: FIXED_BASE_TIME - DAY_MS * 30,
  },
  {
    id: 'c_002',
    name: '刘经理',
    company: '上海贸易集团',
    phone: '13800138002',
    email: 'liu@example.com',
    source: '推荐',
    status: CUSTOMER_STATUS.INTENTION,
    ownerId: 'u_002',
    remark: '王总推荐的，已发送方案',
    createdAt: FIXED_BASE_TIME - DAY_MS * 25,
  },
  {
    id: 'c_003',
    name: '周先生',
    company: '深圳创新科技',
    phone: '13800138003',
    email: 'zhou@example.com',
    source: '展会',
    status: CUSTOMER_STATUS.NEGOTIATION,
    ownerId: 'u_001',
    remark: '展会现场沟通，正在谈价格',
    createdAt: FIXED_BASE_TIME - DAY_MS * 20,
  },
  {
    id: 'c_004',
    name: '吴女士',
    company: '广州电商平台',
    phone: '13800138004',
    email: 'wu@example.com',
    source: '电话营销',
    status: CUSTOMER_STATUS.CLOSED,
    ownerId: 'u_003',
    remark: '已签约，年服务费12万',
    createdAt: FIXED_BASE_TIME - DAY_MS * 15,
  },
  {
    id: 'c_005',
    name: '郑总',
    company: '杭州互联网公司',
    phone: '13800138005',
    email: 'zheng@example.com',
    source: '官网',
    status: CUSTOMER_STATUS.NEW,
    ownerId: null,
    remark: '',
    createdAt: FIXED_BASE_TIME - DAY_MS * 10,
  },
  {
    id: 'c_006',
    name: '孙经理',
    company: '成都软件公司',
    phone: '13800138006',
    email: 'sun@example.com',
    source: '推荐',
    status: CUSTOMER_STATUS.INTENTION,
    ownerId: null,
    remark: '朋友推荐，正在了解产品',
    createdAt: FIXED_BASE_TIME - DAY_MS * 8,
  },
  {
    id: 'c_007',
    name: '马先生',
    company: '武汉制造业集团',
    phone: '13800138007',
    email: 'ma@example.com',
    source: '展会',
    status: CUSTOMER_STATUS.NEW,
    ownerId: 'u_004',
    remark: '展会交换名片，待跟进',
    createdAt: FIXED_BASE_TIME - DAY_MS * 5,
  },
  {
    id: 'c_008',
    name: '黄女士',
    company: '南京教育机构',
    phone: '13800138008',
    email: 'huang@example.com',
    source: '其他',
    status: CUSTOMER_STATUS.NEGOTIATION,
    ownerId: 'u_002',
    remark: '老客户转介绍，已上门演示',
    createdAt: FIXED_BASE_TIME - DAY_MS * 3,
  },
]

export const MOCK_FOLLOWUPS = [
  {
    id: 'f_001',
    customerId: 'c_002',
    method: '电话',
    content: '初次电话沟通，客户对产品表示兴趣，已发送产品介绍邮件',
    result: '有意向',
    createdAt: FIXED_BASE_TIME - DAY_MS * 23,
  },
  {
    id: 'f_002',
    customerId: 'c_002',
    method: '邮件',
    content: '发送详细方案报价单',
    result: '客户正在评估',
    createdAt: FIXED_BASE_TIME - DAY_MS * 18,
  },
  {
    id: 'f_003',
    customerId: 'c_003',
    method: '拜访',
    content: '展会后上门拜访，演示产品功能',
    result: '客户认可产品，进入价格谈判',
    createdAt: FIXED_BASE_TIME - DAY_MS * 17,
  },
  {
    id: 'f_004',
    customerId: 'c_003',
    method: '电话',
    content: '价格沟通，客户希望获得更多折扣',
    result: '正在申请特殊折扣',
    createdAt: FIXED_BASE_TIME - DAY_MS * 12,
  },
  {
    id: 'f_005',
    customerId: 'c_004',
    method: '拜访',
    content: '上门拜访，完成签约',
    result: '成功签约，合同金额12万/年',
    createdAt: FIXED_BASE_TIME - DAY_MS * 14,
  },
  {
    id: 'f_006',
    customerId: 'c_008',
    method: '电话',
    content: '初次沟通，了解客户需求',
    result: '客户有兴趣，约定上门演示',
    createdAt: FIXED_BASE_TIME - DAY_MS * 5,
  },
  {
    id: 'f_007',
    customerId: 'c_008',
    method: '拜访',
    content: '上门演示产品核心功能',
    result: '客户反馈很好，进入商务谈判',
    createdAt: FIXED_BASE_TIME - DAY_MS * 2,
  },
]
