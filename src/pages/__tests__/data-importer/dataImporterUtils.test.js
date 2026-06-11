import { describe, it, expect } from 'vitest'
import {
  parseCSVLine,
  parseCSV,
  parseExcelData,
  validateEmail,
  validatePhone,
  validateDate,
  calculateStringSimilarity,
  autoMapFields,
  validateMapping,
  applyMapping,
  validateRow,
  findDuplicateRows,
  validateAllRows,
  getRowFailureReasons,
  generateImportDelay,
  shouldSkipRow,
  getImportResult,
  exportFailedRowsToCSV,
  buildRowDisplayText,
} from '../../data-importer/utils.js'
import {
  TARGET_FIELDS,
  VALIDATION_STATUS,
  VALIDATION_MESSAGES,
  FAILURE_REASONS,
  IMPORT_DELAY_MIN,
  IMPORT_DELAY_MAX,
} from '../../data-importer/constants.js'

describe('parseCSVLine', () => {
  it('正确解析简单逗号分隔的行', () => {
    const result = parseCSVLine('张三,zhangsan@test.com,13800138000')
    expect(result).toEqual(['张三', 'zhangsan@test.com', '13800138000'])
  })

  it('正确解析带引号包裹的字段', () => {
    const result = parseCSVLine('"张三,经理","zhangsan@test.com","13800138000"')
    expect(result).toEqual(['张三,经理', 'zhangsan@test.com', '13800138000'])
  })

  it('正确解析带转义双引号的字段', () => {
    const result = parseCSVLine('"张三""经理",value2')
    expect(result).toEqual(['张三"经理', 'value2'])
  })

  it('空字段处理正确', () => {
    const result = parseCSVLine('a,,c')
    expect(result).toEqual(['a', '', 'c'])
  })

  it('返回值数组长度正确', () => {
    const result = parseCSVLine('a,b,c,d,e')
    expect(result.length).toBe(5)
  })
})

describe('parseCSV', () => {
  it('空内容返回失败', () => {
    const result = parseCSV('')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('null/undefined 返回失败', () => {
    expect(parseCSV(null).success).toBe(false)
    expect(parseCSV(undefined).success).toBe(false)
  })

  it('正确解析简单 CSV', () => {
    const csv = '姓名,邮箱,电话\n张三,test@test.com,13800138000\n李四,lisi@test.com,13900139000'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.headers).toEqual(['姓名', '邮箱', '电话'])
    expect(result.data.length).toBe(2)
    expect(result.data[0].姓名).toBe('张三')
    expect(result.data[1].邮箱).toBe('lisi@test.com')
  })

  it('正确处理 UTF-8 BOM 头', () => {
    const csv = '\uFEFF姓名,邮箱\n张三,test@test.com'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.headers).toEqual(['姓名', '邮箱'])
  })

  it('正确处理 \r\n 换行符', () => {
    const csv = 'a,b\r\n1,2\r\n3,4'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(2)
  })

  it('跳过空行', () => {
    const csv = 'a,b\n\n1,2\n\n\n3,4\n'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(2)
  })

  it('只有表头没有数据行时正确返回', () => {
    const csv = 'a,b,c'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(0)
  })

  it('正确处理带引号的字段', () => {
    const csv = '姓名,备注\n"张三","测试,数据"\n"李四","""引号"""数据"'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.data[0].姓名).toBe('张三')
    expect(result.data[0].备注).toBe('测试,数据')
    expect(result.data[1].备注).toBe('"引号"数据')
  })

  it('空表头返回失败', () => {
    const csv = ',,'
    const result = parseCSV(csv)
    expect(result.success).toBe(false)
  })

  it('字符串值自动 trim', () => {
    const csv = '  姓名  ,  邮箱  \n  张三  ,  test@test.com  '
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.headers).toEqual(['姓名', '邮箱'])
    expect(result.data[0].姓名).toBe('张三')
  })
})

describe('parseExcelData', () => {
  it('null/undefined/空数组返回失败', () => {
    expect(parseExcelData(null).success).toBe(false)
    expect(parseExcelData(undefined).success).toBe(false)
    expect(parseExcelData([]).success).toBe(false)
  })

  it('正确解析简单对象数组', () => {
    const data = [
      { 姓名: '张三', 邮箱: 'test@test.com', 电话: '13800138000' },
      { 姓名: '李四', 邮箱: 'lisi@test.com', 电话: '13900139000' },
    ]
    const result = parseExcelData(data)
    expect(result.success).toBe(true)
    expect(result.headers).toEqual(['姓名', '邮箱', '电话'])
    expect(result.data.length).toBe(2)
    expect(result.data[0].姓名).toBe('张三')
  })

  it('排除 __rowNum__ 字段', () => {
    const data = [
      { __rowNum__: 1, 姓名: '张三', 邮箱: 'test@test.com' },
    ]
    const result = parseExcelData(data)
    expect(result.success).toBe(true)
    expect(result.headers).not.toContain('__rowNum__')
    expect(result.headers).toEqual(['姓名', '邮箱'])
  })

  it('非字符串值转为字符串', () => {
    const data = [
      { 年龄: 25, 入职: 12345, 值: null, 空: undefined },
    ]
    const result = parseExcelData(data)
    expect(result.success).toBe(true)
    expect(result.data[0].年龄).toBe('25')
    expect(result.data[0].入职).toBe('12345')
    expect(result.data[0].值).toBe('')
    expect(result.data[0].空).toBe('')
  })

  it('非对象输入返回失败', () => {
    const result = parseExcelData(['a', 'b', 'c'])
    expect(result.success).toBe(false)
  })
})

describe('validateEmail', () => {
  it('正确格式的邮箱返回 true', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.co.uk')).toBe(true)
    expect(validateEmail('a@b.cc')).toBe(true)
  })

  it('空值或非字符串返回 false', () => {
    expect(validateEmail(null)).toBe(false)
    expect(validateEmail(undefined)).toBe(false)
    expect(validateEmail('')).toBe(false)
    expect(validateEmail(123)).toBe(false)
  })

  it('格式不正确返回 false', () => {
    expect(validateEmail('notanemail')).toBe(false)
    expect(validateEmail('missing@domain')).toBe(false)
    expect(validateEmail('@nodomain.com')).toBe(false)
    expect(validateEmail('noat.com')).toBe(false)
    expect(validateEmail('test@test@com')).toBe(false)
  })

  it('自动 trim 后校验', () => {
    expect(validateEmail('  test@test.com  ')).toBe(true)
  })
})

describe('validatePhone', () => {
  it('正确格式的手机号返回 true', () => {
    expect(validatePhone('13800138000')).toBe(true)
    expect(validatePhone('15912345678')).toBe(true)
    expect(validatePhone('18600001111')).toBe(true)
  })

  it('空值或非字符串返回 false', () => {
    expect(validatePhone(null)).toBe(false)
    expect(validatePhone(undefined)).toBe(false)
    expect(validatePhone('')).toBe(false)
    expect(validatePhone(13800138000)).toBe(false)
  })

  it('格式不正确返回 false', () => {
    expect(validatePhone('12345678901')).toBe(false)
    expect(validatePhone('1380013800')).toBe(false)
    expect(validatePhone('138001380001')).toBe(false)
    expect(validatePhone('23800138000')).toBe(false)
    expect(validatePhone('abcdefghijk')).toBe(false)
  })

  it('带空格 trim 后校验', () => {
    expect(validatePhone('  13800138000  ')).toBe(true)
  })
})

describe('validateDate', () => {
  it('YYYY-MM-DD 格式返回 true', () => {
    expect(validateDate('2024-01-15')).toBe(true)
    expect(validateDate('2023-12-31')).toBe(true)
  })

  it('YYYY/MM/DD 格式返回 true', () => {
    expect(validateDate('2024/01/15')).toBe(true)
  })

  it('YYYYMMDD 8位数字格式返回 true', () => {
    expect(validateDate('20240115')).toBe(true)
  })

  it('空值或非字符串返回 false', () => {
    expect(validateDate(null)).toBe(false)
    expect(validateDate(undefined)).toBe(false)
    expect(validateDate('')).toBe(false)
  })

  it('无效日期返回 false', () => {
    expect(validateDate('2024-13-01')).toBe(false)
    expect(validateDate('2024-02-30')).toBe(false)
    expect(validateDate('not-a-date')).toBe(false)
    expect(validateDate('12345')).toBe(false)
  })

  it('非字符串类型返回 false', () => {
    expect(validateDate(20240115)).toBe(false)
  })
})

describe('calculateStringSimilarity', () => {
  it('完全相同返回 1', () => {
    expect(calculateStringSimilarity('email', 'email')).toBe(1)
  })

  it('完全为空返回 0', () => {
    expect(calculateStringSimilarity('', '')).toBe(0)
    expect(calculateStringSimilarity(null, 'email')).toBe(0)
    expect(calculateStringSimilarity('email', undefined)).toBe(0)
  })

  it('包含关系返回 0.8', () => {
    expect(calculateStringSimilarity('email', 'emailAddress')).toBe(0.8)
    expect(calculateStringSimilarity('员工邮箱', '邮箱')).toBe(0.8)
  })

  it('不区分大小写', () => {
    const score1 = calculateStringSimilarity('Email', 'EMAIL')
    const score2 = calculateStringSimilarity('email', 'email')
    expect(score1).toBe(score2)
  })

  it('返回值在 0-1 之间', () => {
    const result = calculateStringSimilarity('abc', 'xyz')
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })
})

describe('autoMapFields', () => {
  it('根据别名自动匹配', () => {
    const headers = ['姓名', '邮箱地址', '手机号码', '部门名称']
    const mapping = autoMapFields(headers, TARGET_FIELDS)
    expect(mapping.name).toBe('姓名')
    expect(mapping.email).toBe('邮箱地址')
    expect(mapping.phone).toBe('手机号码')
  })

  it('根据标签名相似度匹配', () => {
    const headers = ['Employee Name', 'Email', 'Phone']
    const mapping = autoMapFields(headers, TARGET_FIELDS)
    expect(mapping.name).toBe('Employee Name')
    expect(mapping.email).toBe('Email')
    expect(mapping.phone).toBe('Phone')
  })

  it('一个源字段只映射到一个目标', () => {
    const headers = ['name']
    const mapping = autoMapFields(headers, TARGET_FIELDS)
    const mappedSources = Object.values(mapping)
    expect(new Set(mappedSources).size).toBe(mappedSources.length)
  })

  it('无可匹配时返回空对象', () => {
    const headers = ['随便一列', '另一列']
    const mapping = autoMapFields(headers, TARGET_FIELDS)
    expect(Object.keys(mapping).length).toBe(0)
  })

  it('空的 headers 返回空对象', () => {
    const mapping = autoMapFields([], TARGET_FIELDS)
    expect(Object.keys(mapping).length).toBe(0)
  })
})

describe('validateMapping', () => {
  it('必填字段都有映射且无重复源时 valid=true', () => {
    const mapping = {
      name: '姓名',
      email: '邮箱',
      phone: '电话',
      department: '部门',
    }
    const result = validateMapping(mapping, TARGET_FIELDS)
    expect(result.valid).toBe(true)
    expect(result.missingRequired.length).toBe(0)
    expect(result.duplicateSources.length).toBe(0)
  })

  it('必填字段缺失时 valid=false', () => {
    const mapping = {
      name: '姓名',
    }
    const result = validateMapping(mapping, TARGET_FIELDS)
    expect(result.valid).toBe(false)
    expect(result.missingRequired.length).toBeGreaterThan(0)
    expect(result.missingRequired.some((f) => f.key === 'email')).toBe(true)
    expect(result.missingRequired.some((f) => f.key === 'phone')).toBe(true)
  })

  it('重复映射源字段时 valid=false', () => {
    const mapping = {
      name: 'col1',
      email: 'col1',
      phone: 'col2',
    }
    const result = validateMapping(mapping, TARGET_FIELDS)
    expect(result.valid).toBe(false)
    expect(result.duplicateSources).toContain('col1')
  })

  it('可选字段缺失不影响', () => {
    const mapping = {
      name: '姓名',
      email: '邮箱',
      phone: '电话',
    }
    const result = validateMapping(mapping, TARGET_FIELDS)
    expect(result.valid).toBe(true)
    expect(result.missingRequired.length).toBe(0)
  })
})

describe('applyMapping', () => {
  it('正确根据映射转换数据', () => {
    const rawData = [
      { 姓名列: '张三', 邮箱列: 'z@t.com', 电话列: '13800138000', 部门列: '技术部' },
      { 姓名列: '李四', 邮箱列: 'l@t.com', 电话列: '13900139000', 部门列: '市场部' },
    ]
    const mapping = {
      name: '姓名列',
      email: '邮箱列',
      phone: '电话列',
      department: '部门列',
    }
    const result = applyMapping(rawData, mapping, TARGET_FIELDS)
    expect(result.length).toBe(2)
    expect(result[0].name).toBe('张三')
    expect(result[0].email).toBe('z@t.com')
    expect(result[0].department).toBe('技术部')
    expect(result[1].position).toBe('')
  })

  it('未映射字段值为空字符串', () => {
    const rawData = [{ 姓名: '张三', 邮箱: 'z@t.com', 电话: '13800138000' }]
    const mapping = { name: '姓名', email: '邮箱', phone: '电话' }
    const result = applyMapping(rawData, mapping, TARGET_FIELDS)
    expect(result[0].position).toBe('')
    expect(result[0].hireDate).toBe('')
  })

  it('源字段不存在时空字符串', () => {
    const rawData = [{ a: '1', b: '2' }]
    const mapping = { name: 'not_exist', email: 'a', phone: 'b' }
    const result = applyMapping(rawData, mapping, TARGET_FIELDS)
    expect(result[0].name).toBe('')
    expect(result[0].email).toBe('1')
  })

  it('非数组输入返回空数组', () => {
    expect(applyMapping(null, {}, TARGET_FIELDS)).toEqual([])
    expect(applyMapping(undefined, {}, TARGET_FIELDS)).toEqual([])
  })
})

describe('validateRow', () => {
  it('完全有效数据返回 valid 状态', () => {
    const row = {
      name: '张三',
      email: 'zhang@test.com',
      phone: '13800138000',
      department: '技术部',
      position: '工程师',
      hireDate: '2024-01-15',
    }
    const result = validateRow(row, TARGET_FIELDS)
    expect(result.status).toBe(VALIDATION_STATUS.VALID)
    expect(result.issues.length).toBe(0)
  })

  it('必填字段为空返回 error 状态', () => {
    const row = { name: '', email: '', phone: '' }
    const result = validateRow(row, TARGET_FIELDS)
    expect(result.status).toBe(VALIDATION_STATUS.ERROR)
    expect(result.issues.some((i) => i.message === VALIDATION_MESSAGES.REQUIRED_EMPTY)).toBe(true)
  })

  it('邮箱格式不正确返回 warning 状态', () => {
    const row = { name: '张三', email: 'invalid-email', phone: '13800138000' }
    const result = validateRow(row, TARGET_FIELDS)
    expect(result.status).toBe(VALIDATION_STATUS.WARNING)
    expect(result.issues.some((i) => i.message === VALIDATION_MESSAGES.INVALID_EMAIL)).toBe(true)
  })

  it('手机格式不正确返回 warning 状态', () => {
    const row = { name: '张三', email: 'test@test.com', phone: '12345' }
    const result = validateRow(row, TARGET_FIELDS)
    expect(result.status).toBe(VALIDATION_STATUS.WARNING)
    expect(result.issues.some((i) => i.message === VALIDATION_MESSAGES.INVALID_PHONE)).toBe(true)
  })

  it('日期格式不正确返回 warning 状态', () => {
    const row = {
      name: '张三',
      email: 'test@test.com',
      phone: '13800138000',
      hireDate: 'not-a-date',
    }
    const result = validateRow(row, TARGET_FIELDS)
    expect(result.status).toBe(VALIDATION_STATUS.WARNING)
    expect(result.issues.some((i) => i.message === VALIDATION_MESSAGES.INVALID_DATE)).toBe(true)
  })

  it('error 优先级高于 warning', () => {
    const row = { name: '', email: 'bad-email', phone: '13800138000' }
    const result = validateRow(row, TARGET_FIELDS)
    expect(result.status).toBe(VALIDATION_STATUS.ERROR)
    expect(result.issues.length).toBeGreaterThanOrEqual(2)
  })

  it('可选字段为空不报错', () => {
    const row = {
      name: '张三',
      email: 'test@test.com',
      phone: '13800138000',
      department: '',
      position: '',
      hireDate: '',
    }
    const result = validateRow(row, TARGET_FIELDS)
    expect(result.status).toBe(VALIDATION_STATUS.VALID)
  })

  it('空白字符视为空', () => {
    const row = { name: '   ', email: '   ', phone: '13800138000' }
    const result = validateRow(row, TARGET_FIELDS)
    expect(result.status).toBe(VALIDATION_STATUS.ERROR)
  })
})

describe('findDuplicateRows', () => {
  it('重复行返回正确的索引集合', () => {
    const rows = [
      { name: '张三', email: 'a@b.com', phone: '13800138000' },
      { name: '李四', email: 'c@d.com', phone: '13900139000' },
      { name: '张三', email: 'a@b.com', phone: '13800138000' },
    ]
    const result = findDuplicateRows(rows, TARGET_FIELDS)
    expect(result.has(0)).toBe(true)
    expect(result.has(2)).toBe(true)
    expect(result.has(1)).toBe(false)
  })

  it('没有重复行返回空集合', () => {
    const rows = [
      { name: '张三', email: 'a@b.com', phone: '13800138000' },
      { name: '李四', email: 'c@d.com', phone: '13900139000' },
    ]
    const result = findDuplicateRows(rows, TARGET_FIELDS)
    expect(result.size).toBe(0)
  })

  it('空数组返回空集合', () => {
    const result = findDuplicateRows([], TARGET_FIELDS)
    expect(result.size).toBe(0)
  })

  it('部分字段不同不视为重复', () => {
    const rows = [
      { name: '张三', email: 'a@b.com', phone: '13800138000', department: '技术部' },
      { name: '张三', email: 'a@b.com', phone: '13800138000', department: '市场部' },
    ]
    const result = findDuplicateRows(rows, TARGET_FIELDS)
    expect(result.size).toBe(0)
  })
})

describe('validateAllRows', () => {
  it('正确统计各类行数', () => {
    const mappedData = [
      { name: '张三', email: 'z@t.com', phone: '13800138000' },
      { name: '', email: 'l@t.com', phone: '13900139000' },
      { name: '王五', email: 'bad-email', phone: '13700137000' },
      { name: '张三', email: 'z@t.com', phone: '13800138000' },
    ]
    const result = validateAllRows(mappedData, TARGET_FIELDS)
    expect(result.stats.total).toBe(4)
    expect(result.stats.error).toBeGreaterThanOrEqual(1)
    expect(result.stats.warning).toBeGreaterThanOrEqual(1)
    expect(result.stats.duplicate).toBeGreaterThanOrEqual(2)
  })

  it('非数组输入返回空结果', () => {
    const result = validateAllRows(null, TARGET_FIELDS)
    expect(result.rows).toEqual([])
    expect(result.stats.total).toBe(0)
    expect(result.stats.valid).toBe(0)
  })

  it('空数组返回正确统计', () => {
    const result = validateAllRows([], TARGET_FIELDS)
    expect(result.stats.total).toBe(0)
    expect(result.rows.length).toBe(0)
  })

  it('每一行都有 index、data、status、issues', () => {
    const data = [{ name: '张三', email: 'z@t.com', phone: '13800138000' }]
    const result = validateAllRows(data, TARGET_FIELDS)
    expect(result.rows[0]).toHaveProperty('index')
    expect(result.rows[0]).toHaveProperty('data')
    expect(result.rows[0]).toHaveProperty('status')
    expect(result.rows[0]).toHaveProperty('issues')
    expect(typeof result.rows[0].index).toBe('number')
  })

  it('重复行 status 为 DUPLICATE', () => {
    const rows = [
      { name: '张三', email: 'a@b.com', phone: '13800138000' },
      { name: '张三', email: 'a@b.com', phone: '13800138000' },
    ]
    const result = validateAllRows(rows, TARGET_FIELDS)
    expect(result.rows[0].status).toBe(VALIDATION_STATUS.DUPLICATE)
    expect(result.rows[1].status).toBe(VALIDATION_STATUS.DUPLICATE)
    expect(result.rows[0].issues.some((i) => i.message === VALIDATION_MESSAGES.DUPLICATE_ROW)).toBe(true)
  })
})

describe('getRowFailureReasons', () => {
  it('必填缺失行返回 REQUIRED_MISSING', () => {
    const rowResult = {
      status: VALIDATION_STATUS.ERROR,
      issues: [
        { field: 'name', message: VALIDATION_MESSAGES.REQUIRED_EMPTY, type: VALIDATION_STATUS.ERROR },
      ],
    }
    const reasons = getRowFailureReasons(rowResult)
    expect(reasons).toContain(FAILURE_REASONS.REQUIRED_MISSING)
  })

  it('警告行返回 FORMAT_ERROR', () => {
    const rowResult = {
      status: VALIDATION_STATUS.WARNING,
      issues: [
        { field: 'email', message: VALIDATION_MESSAGES.INVALID_EMAIL, type: VALIDATION_STATUS.WARNING },
      ],
    }
    const reasons = getRowFailureReasons(rowResult)
    expect(reasons).toContain(FAILURE_REASONS.FORMAT_ERROR)
  })

  it('重复行返回 DUPLICATE_ROW', () => {
    const rowResult = {
      status: VALIDATION_STATUS.DUPLICATE,
      issues: [
        { field: null, message: VALIDATION_MESSAGES.DUPLICATE_ROW, type: VALIDATION_STATUS.DUPLICATE },
      ],
    }
    const reasons = getRowFailureReasons(rowResult)
    expect(reasons).toContain(FAILURE_REASONS.DUPLICATE_ROW)
  })

  it('valid 状态返回空数组', () => {
    const rowResult = { status: VALIDATION_STATUS.VALID, issues: [] }
    const reasons = getRowFailureReasons(rowResult)
    expect(reasons).toEqual([])
  })

  it('原因去重', () => {
    const rowResult = {
      status: VALIDATION_STATUS.ERROR,
      issues: [
        { field: 'name', message: VALIDATION_MESSAGES.REQUIRED_EMPTY, type: VALIDATION_STATUS.ERROR },
        { field: 'email', message: VALIDATION_MESSAGES.REQUIRED_EMPTY, type: VALIDATION_STATUS.ERROR },
      ],
    }
    const reasons = getRowFailureReasons(rowResult)
    expect(reasons.filter((r) => r === FAILURE_REASONS.REQUIRED_MISSING).length).toBe(1)
  })
})

describe('generateImportDelay', () => {
  it('返回值在指定范围内', () => {
    for (let i = 0; i < 100; i++) {
      const delay = generateImportDelay()
      expect(delay).toBeGreaterThanOrEqual(IMPORT_DELAY_MIN)
      expect(delay).toBeLessThanOrEqual(IMPORT_DELAY_MAX)
    }
  })

  it('返回整数', () => {
    const delay = generateImportDelay()
    expect(Number.isInteger(delay)).toBe(true)
  })
})

describe('shouldSkipRow', () => {
  it('ERROR 状态返回 true', () => {
    expect(shouldSkipRow({ status: VALIDATION_STATUS.ERROR })).toBe(true)
  })

  it('DUPLICATE 状态返回 true', () => {
    expect(shouldSkipRow({ status: VALIDATION_STATUS.DUPLICATE })).toBe(true)
  })

  it('VALID 状态返回 false', () => {
    expect(shouldSkipRow({ status: VALIDATION_STATUS.VALID })).toBe(false)
  })

  it('WARNING 状态返回 false', () => {
    expect(shouldSkipRow({ status: VALIDATION_STATUS.WARNING })).toBe(false)
  })
})

describe('getImportResult', () => {
  it('正确分类成功和跳过的行', () => {
    const validatedRows = [
      { index: 0, status: VALIDATION_STATUS.VALID, data: {} },
      { index: 1, status: VALIDATION_STATUS.ERROR, data: {}, issues: [] },
      { index: 2, status: VALIDATION_STATUS.WARNING, data: {}, issues: [] },
      { index: 3, status: VALIDATION_STATUS.DUPLICATE, data: {}, issues: [] },
    ]
    const result = getImportResult(validatedRows)
    expect(result.successRows.length).toBe(2)
    expect(result.skippedRows.length).toBe(2)
  })

  it('跳过的行包含原因', () => {
    const validatedRows = [
      {
        index: 0,
        status: VALIDATION_STATUS.ERROR,
        data: {},
        issues: [{ field: 'name', message: VALIDATION_MESSAGES.REQUIRED_EMPTY, type: VALIDATION_STATUS.ERROR }],
      },
    ]
    const result = getImportResult(validatedRows)
    expect(result.skippedRows[0]).toHaveProperty('reasons')
    expect(Array.isArray(result.skippedRows[0].reasons)).toBe(true)
  })
})

describe('exportFailedRowsToCSV', () => {
  it('空数组返回空字符串', () => {
    expect(exportFailedRowsToCSV([], TARGET_FIELDS)).toBe('')
    expect(exportFailedRowsToCSV(null, TARGET_FIELDS)).toBe('')
  })

  it('CSV 包含表头行', () => {
    const failedRows = [{ index: 0, data: { name: '张三' }, reasons: ['必填缺失'] }]
    const csv = exportFailedRowsToCSV(failedRows, TARGET_FIELDS)
    const lines = csv.split('\n').filter((l) => l.length > 0)
    expect(lines.length).toBeGreaterThanOrEqual(2)
    expect(lines[0]).toContain('行号')
    expect(lines[0]).toContain('姓名')
    expect(lines[0]).toContain('失败原因')
  })

  it('包含正确的数据行', () => {
    const failedRows = [
      { index: 0, data: { name: '张三', email: 'a@b.com', phone: '13800138000' }, reasons: ['格式错误'] },
    ]
    const csv = exportFailedRowsToCSV(failedRows, TARGET_FIELDS)
    expect(csv).toContain('张三')
    expect(csv).toContain('a@b.com')
    expect(csv).toContain('格式错误')
  })

  it('多个原因用分号分隔', () => {
    const failedRows = [
      { index: 0, data: {}, reasons: ['必填缺失', '重复行'] },
    ]
    const csv = exportFailedRowsToCSV(failedRows, TARGET_FIELDS)
    expect(csv).toContain('必填缺失; 重复行')
  })

  it('行号为 index + 1', () => {
    const failedRows = [
      { index: 5, data: { name: '测试' }, reasons: ['必填缺失'] },
    ]
    const csv = exportFailedRowsToCSV(failedRows, TARGET_FIELDS)
    const lines = csv.split('\n')
    expect(lines[1].startsWith('6')).toBe(true)
  })

  it('特殊字符被正确转义', () => {
    const failedRows = [
      { index: 0, data: { name: '张三,逗号"引号' }, reasons: ['格式错误'] },
    ]
    const csv = exportFailedRowsToCSV(failedRows, TARGET_FIELDS)
    expect(csv).toContain('"张三,逗号""引号"')
  })
})

describe('buildRowDisplayText', () => {
  it('正确拼接字段值', () => {
    const row = { data: { name: '张三', email: 'z@t.com', phone: '13800138000' } }
    const text = buildRowDisplayText(row, TARGET_FIELDS)
    expect(text).toContain('张三')
    expect(text).toContain('z@t.com')
    expect(text).toContain('13800138000')
  })

  it('跳过空值字段', () => {
    const row = { data: { name: '张三', email: '', phone: '13800138000', department: '' } }
    const text = buildRowDisplayText(row, TARGET_FIELDS)
    expect(text).toContain('张三')
    expect(text).not.toMatch(/\|\s*\|/)
  })

  it('全为空值返回空字符串', () => {
    const row = { data: { name: '', email: '', phone: '', department: '', position: '', hireDate: '' } }
    const text = buildRowDisplayText(row, TARGET_FIELDS)
    expect(text).toBe('')
  })

  it('使用竖线分隔', () => {
    const row = { data: { name: '张三', email: 'a@b.com', phone: '13800138000' } }
    const text = buildRowDisplayText(row, TARGET_FIELDS)
    expect(text).toContain('|')
  })
})
