export const STORAGE_KEY_RECORDS = 'visitor_registration_records'
export const STORAGE_KEY_RECENT = 'visitor_registration_recent_hosts'

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50]

export const TIMEOUT_HOURS = 8

export const VISITOR_STATUS = {
  VISITING: 'visiting',
  CHECKED_OUT: 'checked_out',
  OVERDUE: 'overdue',
}

export const VISITOR_STATUS_LABELS = {
  [VISITOR_STATUS.VISITING]: '访问中',
  [VISITOR_STATUS.CHECKED_OUT]: '已签退',
  [VISITOR_STATUS.OVERDUE]: '超时未签退',
}

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: VISITOR_STATUS.VISITING, label: '访问中' },
  { value: VISITOR_STATUS.CHECKED_OUT, label: '已签退' },
  { value: VISITOR_STATUS.OVERDUE, label: '超时未签退' },
]

export const HOST_LIST = [
  { id: 'H001', name: '张伟', department: '技术部', position: '前端工程师' },
  { id: 'H002', name: '李娜', department: '产品部', position: '产品经理' },
  { id: 'H003', name: '王强', department: '技术部', position: '后端工程师' },
  { id: 'H004', name: '刘洋', department: '设计部', position: 'UI设计师' },
  { id: 'H005', name: '陈静', department: '人事部', position: 'HR主管' },
  { id: 'H006', name: '杨帆', department: '市场部', position: '市场总监' },
  { id: 'H007', name: '赵敏', department: '财务部', position: '财务经理' },
  { id: 'H008', name: '周磊', department: '技术部', position: '测试工程师' },
  { id: 'H009', name: '吴婷', department: '行政部', position: '行政主管' },
  { id: 'H010', name: '郑浩', department: '运营部', position: '运营专员' },
  { id: 'H011', name: '孙丽', department: '产品部', position: '产品助理' },
  { id: 'H012', name: '马超', department: '技术部', position: '运维工程师' },
]

export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 20
export const REASON_MAX_LENGTH = 200
export const RECENT_HOST_LIMIT = 3
