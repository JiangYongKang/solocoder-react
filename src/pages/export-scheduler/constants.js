export const STORAGE_KEY_TASKS = 'export_scheduler_tasks'
export const STORAGE_KEY_RECORDS = 'export_scheduler_records'
export const STORAGE_KEY_SETTINGS = 'export_scheduler_settings'
export const STORAGE_KEY_ENGINE = 'export_scheduler_engine'

export const TASK_STATUS_RUNNING = 'running'
export const TASK_STATUS_PAUSED = 'paused'
export const TASK_STATUS_COMPLETED = 'completed'

export const ALL_TASK_STATUSES = [TASK_STATUS_RUNNING, TASK_STATUS_PAUSED, TASK_STATUS_COMPLETED]

export const RECORD_STATUS_SUCCESS = 'success'
export const RECORD_STATUS_FAILED = 'failed'
export const RECORD_STATUS_EXECUTING = 'executing'
export const RECORD_STATUS_RETRYING = 'retrying'

export const FREQUENCY_ONCE = 'once'
export const FREQUENCY_DAILY = 'daily'
export const FREQUENCY_WEEKLY = 'weekly'
export const FREQUENCY_MONTHLY = 'monthly'

export const ALL_FREQUENCIES = [FREQUENCY_ONCE, FREQUENCY_DAILY, FREQUENCY_WEEKLY, FREQUENCY_MONTHLY]

export const FREQUENCY_LABELS = {
  [FREQUENCY_ONCE]: '一次性',
  [FREQUENCY_DAILY]: '每天',
  [FREQUENCY_WEEKLY]: '每周',
  [FREQUENCY_MONTHLY]: '每月',
}

export const DATA_SOURCES = [
  { id: 'orders', label: '订单数据' },
  { id: 'users', label: '用户数据' },
  { id: 'products', label: '商品数据' },
  { id: 'logs', label: '日志数据' },
  { id: 'custom', label: '自定义数据' },
]

export const DATA_SOURCE_FIELDS = {
  orders: [
    { id: 'orderNo', label: '订单号' },
    { id: 'customerName', label: '客户名' },
    { id: 'amount', label: '金额' },
    { id: 'status', label: '状态' },
    { id: 'createdAt', label: '创建时间' },
  ],
  users: [
    { id: 'userId', label: '用户ID' },
    { id: 'username', label: '用户名' },
    { id: 'email', label: '邮箱' },
    { id: 'phone', label: '手机号' },
    { id: 'registeredAt', label: '注册时间' },
  ],
  products: [
    { id: 'productId', label: '商品ID' },
    { id: 'productName', label: '商品名' },
    { id: 'price', label: '价格' },
    { id: 'stock', label: '库存' },
    { id: 'category', label: '分类' },
  ],
  logs: [
    { id: 'logId', label: '日志ID' },
    { id: 'level', label: '级别' },
    { id: 'message', label: '消息' },
    { id: 'source', label: '来源' },
    { id: 'timestamp', label: '时间戳' },
  ],
  custom: [
    { id: 'id', label: 'ID' },
    { id: 'name', label: '名称' },
    { id: 'value', label: '值' },
    { id: 'type', label: '类型' },
    { id: 'updatedAt', label: '更新时间' },
  ],
}

export const DATA_SOURCE_LABEL_MAP = Object.fromEntries(
  DATA_SOURCES.map((ds) => [ds.id, ds.label])
)

export const EXPORT_FORMAT_CSV = 'csv'
export const EXPORT_FORMAT_JSON = 'json'
export const EXPORT_FORMAT_EXCEL = 'excel'

export const ALL_EXPORT_FORMATS = [EXPORT_FORMAT_CSV, EXPORT_FORMAT_JSON, EXPORT_FORMAT_EXCEL]

export const EXPORT_FORMAT_LABELS = {
  [EXPORT_FORMAT_CSV]: 'CSV',
  [EXPORT_FORMAT_JSON]: 'JSON',
  [EXPORT_FORMAT_EXCEL]: 'Excel',
}

export const EXPORT_FORMAT_EXTENSIONS = {
  [EXPORT_FORMAT_CSV]: '.csv',
  [EXPORT_FORMAT_JSON]: '.json',
  [EXPORT_FORMAT_EXCEL]: '.xlsx',
}

export const FAILURE_REASONS = [
  '网络超时',
  '数据源连接失败',
  '磁盘空间不足',
  '权限不足',
  '数据格式异常',
  '导出超时',
  '内存溢出',
]

export const WEEK_DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export const MAX_RETRY_COUNT = 3
export const RETRY_INTERVAL_MS = 10000
export const FAILURE_PROBABILITY = 0.15
export const EXPORT_MIN_DURATION_MS = 1000
export const EXPORT_MAX_DURATION_MS = 3000
export const MOCK_MIN_ROWS = 50
export const MOCK_MAX_ROWS = 500
export const TIMELINE_PAGE_SIZE = 20

export const NOTIFICATION_DURATION_OPTIONS = [3, 5, 10]

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  onlyFailure: false,
  duration: 3,
}
