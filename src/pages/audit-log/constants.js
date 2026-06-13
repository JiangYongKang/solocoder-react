export const STORAGE_KEY_LOGS = 'audit_log_data'
export const STORAGE_KEY_CONFIG = 'audit_log_config'

export const OPERATION_TYPES = ['登录', '登出', '新增', '修改', '删除', '导出', '权限变更']

export const OPERATION_RESULTS = {
  SUCCESS: '成功',
  FAILURE: '失败',
}

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export const DEFAULT_RETENTION_DAYS = 90
export const MIN_RETENTION_DAYS = 7
export const MAX_RETENTION_DAYS = 365

export const OPERATORS = ['张伟', '李娜', '王芳', '刘强', '陈明', '杨洋', '赵敏', '黄磊', '周杰', '吴婷', 'admin', 'root']
export const RESOURCE_PREFIXES = ['订单', '用户', '角色', '配置', '报表', '权限', '商品', '部门']
export const IP_PREFIXES = ['192.168.1.', '10.0.0.', '172.16.0.', '203.0.113.']
