export const STEPS = [
  { id: 0, title: '文件上传', description: '上传 CSV 或 Excel 文件' },
  { id: 1, title: '字段映射', description: '将源字段映射到目标字段' },
  { id: 2, title: '数据校验', description: '预览并校验数据' },
  { id: 3, title: '执行导入', description: '逐行导入并查看结果' },
]

export const TARGET_FIELDS = [
  { key: 'name', label: '姓名', type: 'text', required: true, aliases: ['name', '姓名', '客户姓名', '员工姓名', '用户名'] },
  { key: 'email', label: '邮箱', type: 'email', required: true, aliases: ['email', '邮箱', '电子邮箱', 'e-mail', 'mail'] },
  { key: 'phone', label: '电话', type: 'phone', required: true, aliases: ['phone', '电话', '手机号', '手机', '联系电话', 'mobile', 'tel'] },
  { key: 'department', label: '部门', type: 'text', required: false, aliases: ['department', '部门', '所属部门'] },
  { key: 'position', label: '职位', type: 'text', required: false, aliases: ['position', '职位', '岗位', '职务'] },
  { key: 'hireDate', label: '入职日期', type: 'date', required: false, aliases: ['hireDate', '入职日期', '入职时间', '加入日期', 'date'] },
]

export const VALIDATION_STATUS = {
  VALID: 'valid',
  WARNING: 'warning',
  ERROR: 'error',
  DUPLICATE: 'duplicate',
}

export const VALIDATION_MESSAGES = {
  REQUIRED_EMPTY: '必填字段为空',
  INVALID_EMAIL: '邮箱格式不正确',
  INVALID_PHONE: '手机号格式不正确',
  INVALID_DATE: '日期格式不正确',
  DUPLICATE_ROW: '重复数据行',
}

export const FAILURE_REASONS = {
  REQUIRED_MISSING: '必填缺失',
  FORMAT_ERROR: '格式错误',
  DUPLICATE_ROW: '重复行',
}

export const IMPORT_DELAY_MIN = 50
export const IMPORT_DELAY_MAX = 200

export const PREVIEW_ROW_COUNT = 10
