import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import {
  generateCustomerId,
  generateFollowupId,
  loadCustomers,
  saveCustomers,
  loadFollowups,
  saveFollowups,
  loadCurrentUser,
  saveCurrentUser,
  validatePhone,
  validateEmail,
  validateCustomer,
  validateFollowup,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  claimCustomer,
  releaseCustomer,
  transferCustomer,
  searchCustomers,
  filterBySource,
  filterByOwner,
  filterByDateRange,
  sortCustomers,
  paginateCustomers,
  getCustomerList,
  getFollowupsByCustomer,
  addFollowup,
  deleteFollowupsByCustomer,
  getFunnelData,
  getUserName,
  formatDate,
  formatDateOnly,
  customersToCSV,
  parseCSV,
  validateImportData,
  batchCreateCustomers,
} from '../../crm/utils.js'
import {
  STORAGE_KEY,
  FOLLOWUP_STORAGE_KEY,
  CURRENT_USER_KEY,
  CUSTOMER_STATUS,
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_SOURCES,
  SORT_ORDERS,
  PAGE_SIZE,
  USERS,
  DEFAULT_CURRENT_USER_ID,
} from '../../crm/constants.js'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

const makeValidCustomerData = (overrides = {}) => ({
  name: '测试客户',
  company: '测试公司',
  phone: '13800138000',
  email: 'test@example.com',
  source: '官网',
  remark: '测试备注',
  ...overrides,
})

const makeCustomer = (overrides = {}) => {
  const base = makeValidCustomerData()
  return {
    id: generateCustomerId(),
    ...base,
    status: CUSTOMER_STATUS.NEW,
    ownerId: null,
    createdAt: Date.now(),
    ...overrides,
  }
}

const makeFollowup = (overrides = {}) => ({
  id: generateFollowupId(),
  customerId: 'c_test',
  method: '电话',
  content: '测试跟进内容',
  result: '测试结果',
  createdAt: Date.now(),
  ...overrides,
})

describe('generateCustomerId', () => {
  it('生成的ID以 c_ 开头', () => {
    expect(generateCustomerId()).toMatch(/^c_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateCustomerId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('generateFollowupId', () => {
  it('生成的ID以 f_ 开头', () => {
    expect(generateFollowupId()).toMatch(/^f_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateFollowupId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveCustomers 保存到 localStorage', () => {
    const customers = [{ id: '1', name: '测试' }]
    const result = saveCustomers(customers)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(customers))
  })

  it('loadCustomers 从 localStorage 读取', () => {
    const customers = [{ id: '1', name: '测试' }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
    const result = loadCustomers()
    expect(result).toEqual(customers)
  })

  it('loadCustomers localStorage 为空时返回 mock 数据', () => {
    const result = loadCustomers()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('loadCustomers localStorage 数据损坏时返回 mock 数据', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json')
    const result = loadCustomers()
    expect(Array.isArray(result)).toBe(true)
  })

  it('saveFollowups 保存到 localStorage', () => {
    const followups = [{ id: '1', customerId: 'c1' }]
    const result = saveFollowups(followups)
    expect(result).toBe(true)
    expect(localStorage.getItem(FOLLOWUP_STORAGE_KEY)).toBe(JSON.stringify(followups))
  })

  it('loadFollowups 从 localStorage 读取', () => {
    const followups = [{ id: '1', customerId: 'c1' }]
    localStorage.setItem(FOLLOWUP_STORAGE_KEY, JSON.stringify(followups))
    const result = loadFollowups()
    expect(result).toEqual(followups)
  })

  it('loadFollowups localStorage 为空时返回 mock 数据', () => {
    const result = loadFollowups()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('saveCurrentUser 保存当前用户', () => {
    const result = saveCurrentUser('u_002')
    expect(result).toBe(true)
    expect(localStorage.getItem(CURRENT_USER_KEY)).toBe('u_002')
  })

  it('loadCurrentUser 读取当前用户', () => {
    localStorage.setItem(CURRENT_USER_KEY, 'u_003')
    expect(loadCurrentUser()).toBe('u_003')
  })

  it('loadCurrentUser localStorage 为空时返回默认用户', () => {
    expect(loadCurrentUser()).toBe(DEFAULT_CURRENT_USER_ID)
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

  it('格式不正确的手机号返回 false', () => {
    expect(validatePhone('12345678901')).toBe(false)
    expect(validatePhone('1380013800')).toBe(false)
    expect(validatePhone('138001380001')).toBe(false)
    expect(validatePhone('23800138000')).toBe(false)
    expect(validatePhone('abcdefghijk')).toBe(false)
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
  })

  it('格式不正确的邮箱返回 false', () => {
    expect(validateEmail('notanemail')).toBe(false)
    expect(validateEmail('missing@domain')).toBe(false)
    expect(validateEmail('@nodomain.com')).toBe(false)
    expect(validateEmail('noat.com')).toBe(false)
  })
})

describe('validateCustomer', () => {
  it('有效的客户数据返回空对象', () => {
    const errors = validateCustomer(makeValidCustomerData())
    expect(Object.keys(errors).length).toBe(0)
  })

  it('客户名称为空时报错', () => {
    expect(validateCustomer(makeValidCustomerData({ name: '' })).name).toBeTruthy()
    expect(validateCustomer(makeValidCustomerData({ name: '   ' })).name).toBeTruthy()
  })

  it('客户名称超过50字符时报错', () => {
    expect(validateCustomer(makeValidCustomerData({ name: 'a'.repeat(51) })).name).toBeTruthy()
  })

  it('联系电话为空时报错', () => {
    expect(validateCustomer(makeValidCustomerData({ phone: '' })).phone).toBeTruthy()
  })

  it('联系电话格式不正确时报错', () => {
    expect(validateCustomer(makeValidCustomerData({ phone: '12345' })).phone).toBeTruthy()
  })

  it('邮箱格式不正确时报错（邮箱非空时）', () => {
    expect(validateCustomer(makeValidCustomerData({ email: 'invalid' })).email).toBeTruthy()
  })

  it('邮箱为空时不报错', () => {
    expect(validateCustomer(makeValidCustomerData({ email: '' })).email).toBeFalsy()
  })

  it('无效的客户来源报错', () => {
    expect(validateCustomer(makeValidCustomerData({ source: '无效来源' })).source).toBeTruthy()
  })
})

describe('validateFollowup', () => {
  it('有效的跟进数据返回空对象', () => {
    const errors = validateFollowup({ method: '电话', content: '测试内容' })
    expect(Object.keys(errors).length).toBe(0)
  })

  it('跟进方式为空时报错', () => {
    expect(validateFollowup({ method: '', content: '测试' }).method).toBeTruthy()
  })

  it('跟进内容为空时报错', () => {
    expect(validateFollowup({ method: '电话', content: '' }).content).toBeTruthy()
    expect(validateFollowup({ method: '电话', content: '   ' }).content).toBeTruthy()
  })
})

describe('createCustomer', () => {
  it('数据无效时返回失败', () => {
    const result = createCustomer([], { name: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建客户并返回新列表', () => {
    const data = makeValidCustomerData()
    const result = createCustomer([], data)
    expect(result.success).toBe(true)
    expect(result.customer.id).toBeTruthy()
    expect(result.customer.name).toBe('测试客户')
    expect(result.customer.createdAt).toBeTruthy()
    expect(result.customers.length).toBe(1)
    expect(result.customers[0]).toBe(result.customer)
  })

  it('新客户放在列表最前面', () => {
    const existing = [{ id: 'old', name: '旧客户' }]
    const result = createCustomer(existing, makeValidCustomerData())
    expect(result.customers[0].id).toBe(result.customer.id)
    expect(result.customers[1].id).toBe('old')
  })

  it('设置正确的默认值', () => {
    const data = { name: '测试', phone: '13800138000' }
    const result = createCustomer([], data)
    expect(result.success).toBe(true)
    expect(result.customer.status).toBe(CUSTOMER_STATUS.NEW)
    expect(result.customer.source).toBeTruthy()
  })
})

describe('updateCustomer', () => {
  it('数据无效时返回失败', () => {
    const customer = makeCustomer()
    const result = updateCustomer([customer], customer.id, { name: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('客户不存在时返回失败', () => {
    const result = updateCustomer([], 'not-exist', makeValidCustomerData())
    expect(result.success).toBe(false)
    expect(result.errors.id).toBeTruthy()
  })

  it('成功更新客户', () => {
    const customer = makeCustomer({ name: '原名称' })
    const result = updateCustomer([customer], customer.id, {
      ...makeValidCustomerData(),
      name: '新名称',
    })
    expect(result.success).toBe(true)
    expect(result.customer.name).toBe('新名称')
    expect(result.customers[0].name).toBe('新名称')
  })

  it('不修改其他客户', () => {
    const c1 = makeCustomer({ id: 'c1', name: '客户1' })
    const c2 = makeCustomer({ id: 'c2', name: '客户2' })
    const result = updateCustomer([c1, c2], 'c1', {
      ...makeValidCustomerData(),
      name: '客户1修改',
    })
    expect(result.customers.find((c) => c.id === 'c2').name).toBe('客户2')
  })
})

describe('deleteCustomer', () => {
  it('id为空时返回失败', () => {
    const result = deleteCustomer([{ id: '1' }], '')
    expect(result.success).toBe(false)
  })

  it('客户不存在时返回失败', () => {
    const result = deleteCustomer([], 'not-exist')
    expect(result.success).toBe(false)
  })

  it('成功删除客户', () => {
    const existing = [
      { id: '1', name: '客户1' },
      { id: '2', name: '客户2' },
    ]
    const result = deleteCustomer(existing, '1')
    expect(result.success).toBe(true)
    expect(result.customers.length).toBe(1)
    expect(result.customers[0].id).toBe('2')
  })
})

describe('claimCustomer', () => {
  it('客户不存在时返回失败', () => {
    const result = claimCustomer([], 'not-exist', 'u_001')
    expect(result.success).toBe(false)
  })

  it('客户已有归属人时返回失败', () => {
    const customer = makeCustomer({ ownerId: 'u_002' })
    const result = claimCustomer([customer], customer.id, 'u_001')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('成功领取客户', () => {
    const customer = makeCustomer({ ownerId: null })
    const result = claimCustomer([customer], customer.id, 'u_001')
    expect(result.success).toBe(true)
    expect(result.customer.ownerId).toBe('u_001')
    expect(result.customers[0].ownerId).toBe('u_001')
  })
})

describe('releaseCustomer', () => {
  it('客户不存在时返回失败', () => {
    const result = releaseCustomer([], 'not-exist')
    expect(result.success).toBe(false)
  })

  it('成功释放客户到公海', () => {
    const customer = makeCustomer({ ownerId: 'u_001' })
    const result = releaseCustomer([customer], customer.id)
    expect(result.success).toBe(true)
    expect(result.customer.ownerId).toBe(null)
  })
})

describe('transferCustomer', () => {
  it('客户不存在时返回失败', () => {
    const result = transferCustomer([], 'not-exist', 'u_002')
    expect(result.success).toBe(false)
  })

  it('目标用户不存在时返回失败', () => {
    const customer = makeCustomer({ ownerId: 'u_001' })
    const result = transferCustomer([customer], customer.id, 'invalid-user')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('成功转移客户', () => {
    const customer = makeCustomer({ ownerId: 'u_001' })
    const result = transferCustomer([customer], customer.id, 'u_002')
    expect(result.success).toBe(true)
    expect(result.customer.ownerId).toBe('u_002')
  })
})

describe('searchCustomers', () => {
  const customers = [
    { name: '张三', company: '阿里巴巴' },
    { name: '李四', company: '腾讯科技' },
    { name: '王五', company: '阿里巴巴集团' },
  ]

  it('非数组输入返回空数组', () => {
    expect(searchCustomers(null, '张')).toEqual([])
  })

  it('空关键词返回全部', () => {
    expect(searchCustomers(customers, '')).toEqual(customers)
    expect(searchCustomers(customers, '   ')).toEqual(customers)
  })

  it('按客户名称模糊搜索', () => {
    const result = searchCustomers(customers, '张')
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('张三')
  })

  it('按公司名称模糊搜索', () => {
    const result = searchCustomers(customers, '阿里')
    expect(result.length).toBe(2)
  })

  it('搜索不区分大小写', () => {
    const result = searchCustomers(
      [{ name: 'ABC', company: 'XYZ' }],
      'abc'
    )
    expect(result.length).toBe(1)
  })
})

describe('filterBySource', () => {
  const customers = [
    { id: '1', source: '官网' },
    { id: '2', source: '推荐' },
    { id: '3', source: '展会' },
  ]

  it('非数组输入返回空数组', () => {
    expect(filterBySource(null, '官网')).toEqual([])
  })

  it('all或空值返回全部', () => {
    expect(filterBySource(customers, 'all').length).toBe(3)
    expect(filterBySource(customers, '').length).toBe(3)
  })

  it('按来源筛选', () => {
    const result = filterBySource(customers, '官网')
    expect(result.length).toBe(1)
    expect(result[0].source).toBe('官网')
  })
})

describe('filterByOwner', () => {
  const customers = [
    { id: '1', ownerId: 'u_001' },
    { id: '2', ownerId: 'u_002' },
    { id: '3', ownerId: null },
  ]

  it('非数组输入返回空数组', () => {
    expect(filterByOwner(null, 'mine', 'u_001')).toEqual([])
  })

  it('筛选我的客户', () => {
    const result = filterByOwner(customers, 'mine', 'u_001')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('筛选公海客户', () => {
    const result = filterByOwner(customers, 'pool', 'u_001')
    expect(result.length).toBe(1)
    expect(result[0].ownerId).toBe(null)
  })

  it('非mine/pool返回全部', () => {
    expect(filterByOwner(customers, 'all', 'u_001').length).toBe(3)
  })
})

describe('filterByDateRange', () => {
  const baseTime = new Date('2024-01-15').getTime()
  const customers = [
    { id: '1', createdAt: new Date('2024-01-10').getTime() },
    { id: '2', createdAt: new Date('2024-01-15').getTime() },
    { id: '3', createdAt: new Date('2024-01-20').getTime() },
  ]

  it('非数组输入返回空数组', () => {
    expect(filterByDateRange(null, '2024-01-01', '2024-01-31')).toEqual([])
  })

  it('无日期限制返回全部', () => {
    expect(filterByDateRange(customers, '', '').length).toBe(3)
  })

  it('按开始日期筛选', () => {
    const result = filterByDateRange(customers, '2024-01-15', '')
    expect(result.length).toBe(2)
    expect(result.every((c) => c.id !== '1')).toBe(true)
  })

  it('按结束日期筛选', () => {
    const result = filterByDateRange(customers, '', '2024-01-15')
    expect(result.length).toBe(2)
    expect(result.every((c) => c.id !== '3')).toBe(true)
  })

  it('按日期范围筛选', () => {
    const result = filterByDateRange(customers, '2024-01-10', '2024-01-20')
    expect(result.length).toBe(3)
  })
})

describe('sortCustomers', () => {
  it('非数组输入返回空数组', () => {
    expect(sortCustomers(null, 'name', 'asc')).toEqual([])
  })

  it('无排序字段返回原数组', () => {
    const customers = [{ name: 'b' }, { name: 'a' }]
    const result = sortCustomers(customers, null, 'asc')
    expect(result).toEqual(customers)
  })

  it('按名称升序排序', () => {
    const customers = [
      { name: '李四' },
      { name: '张三' },
      { name: '王五' },
    ]
    const result = sortCustomers(customers, 'name', SORT_ORDERS.ASC)
    expect(result[0].name).toBe('李四')
    expect(result[2].name).toBe('张三')
  })

  it('按创建时间降序排序', () => {
    const customers = [
      { id: '1', createdAt: 100 },
      { id: '2', createdAt: 300 },
      { id: '3', createdAt: 200 },
    ]
    const result = sortCustomers(customers, 'createdAt', SORT_ORDERS.DESC)
    expect(result[0].id).toBe('2')
    expect(result[2].id).toBe('1')
  })

  it('不修改原数组', () => {
    const customers = [{ name: 'b' }, { name: 'a' }]
    const origCopy = [...customers]
    sortCustomers(customers, 'name', 'asc')
    expect(customers).toEqual(origCopy)
  })
})

describe('paginateCustomers', () => {
  const customers = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('非数组返回空分页结果', () => {
    const result = paginateCustomers(null, 1, 10)
    expect(result.items).toEqual([])
    expect(result.totalPage).toBe(1)
    expect(result.currentPage).toBe(1)
  })

  it('第一页正确', () => {
    const result = paginateCustomers(customers, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.items[9].id).toBe('10')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(25)
  })

  it('最后一页正确', () => {
    const result = paginateCustomers(customers, 3, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateCustomers(customers, 100, 10)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于1时修正', () => {
    const result = paginateCustomers(customers, 0, 10)
    expect(result.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateCustomers([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })

  it('默认使用PAGE_SIZE常量', () => {
    const many = Array.from({ length: PAGE_SIZE * 2 + 5 }, (_, i) => ({ id: i }))
    const result = paginateCustomers(many, 1)
    expect(result.pageSize).toBe(PAGE_SIZE)
    expect(result.items.length).toBe(PAGE_SIZE)
  })
})

describe('getCustomerList', () => {
  it('非数组返回空分页结果', () => {
    const result = getCustomerList(null, {})
    expect(result.items).toEqual([])
  })

  it('组合搜索、来源筛选和排序', () => {
    const customers = [
      { id: '1', name: '张三', company: 'A公司', source: '官网', createdAt: 200, ownerId: 'u_001' },
      { id: '2', name: '李四', company: 'B公司', source: '推荐', createdAt: 100, ownerId: 'u_001' },
      { id: '3', name: '王五', company: 'A科技', source: '官网', createdAt: 300, ownerId: null },
    ]
    const result = getCustomerList(customers, {
      keyword: 'A',
      source: '官网',
      sortField: 'createdAt',
      sortOrder: SORT_ORDERS.DESC,
      page: 1,
      pageSize: 10,
    })
    expect(result.items.length).toBe(2)
    expect(result.items[0].id).toBe('3')
  })

  it('按 ownerType 筛选', () => {
    const customers = [
      { id: '1', ownerId: 'u_001' },
      { id: '2', ownerId: null },
    ]
    const result = getCustomerList(customers, {
      ownerType: 'pool',
      currentUserId: 'u_001',
    })
    expect(result.items.length).toBe(1)
    expect(result.items[0].id).toBe('2')
  })
})

describe('getFollowupsByCustomer', () => {
  it('非数组返回空数组', () => {
    expect(getFollowupsByCustomer(null, 'c1')).toEqual([])
  })

  it('只返回指定客户的跟进记录', () => {
    const followups = [
      { id: 'f1', customerId: 'c1', createdAt: 100 },
      { id: 'f2', customerId: 'c2', createdAt: 200 },
      { id: 'f3', customerId: 'c1', createdAt: 300 },
    ]
    const result = getFollowupsByCustomer(followups, 'c1')
    expect(result.length).toBe(2)
    expect(result[0].id).toBe('f3')
    expect(result[1].id).toBe('f1')
  })

  it('按时间倒序排列', () => {
    const followups = [
      { id: 'f1', customerId: 'c1', createdAt: 100 },
      { id: 'f2', customerId: 'c1', createdAt: 300 },
      { id: 'f3', customerId: 'c1', createdAt: 200 },
    ]
    const result = getFollowupsByCustomer(followups, 'c1')
    expect(result[0].createdAt).toBeGreaterThan(result[1].createdAt)
    expect(result[1].createdAt).toBeGreaterThan(result[2].createdAt)
  })
})

describe('addFollowup', () => {
  it('数据无效时返回失败', () => {
    const result = addFollowup([], 'c1', { method: '', content: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功添加跟进记录', () => {
    const result = addFollowup([], 'c1', {
      method: '电话',
      content: '测试内容',
      result: '测试结果',
    })
    expect(result.success).toBe(true)
    expect(result.followup.id).toBeTruthy()
    expect(result.followup.customerId).toBe('c1')
    expect(result.followup.createdAt).toBeTruthy()
    expect(result.followups.length).toBe(1)
  })

  it('新记录放在列表最前面', () => {
    const existing = [{ id: 'old', customerId: 'c1', createdAt: 100 }]
    const result = addFollowup(existing, 'c1', {
      method: '电话',
      content: '新内容',
    })
    expect(result.followups[0].id).toBe(result.followup.id)
    expect(result.followups[1].id).toBe('old')
  })
})

describe('deleteFollowupsByCustomer', () => {
  it('非数组返回空数组', () => {
    expect(deleteFollowupsByCustomer(null, 'c1')).toEqual([])
  })

  it('删除指定客户的所有跟进记录', () => {
    const followups = [
      { id: 'f1', customerId: 'c1' },
      { id: 'f2', customerId: 'c2' },
      { id: 'f3', customerId: 'c1' },
    ]
    const result = deleteFollowupsByCustomer(followups, 'c1')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('f2')
  })
})

describe('getFunnelData', () => {
  it('非数组返回空数据', () => {
    const result = getFunnelData(null)
    expect(result.stages).toEqual([])
    expect(result.total).toBe(0)
  })

  it('正确统计各阶段数量', () => {
    const customers = [
      { status: CUSTOMER_STATUS.NEW },
      { status: CUSTOMER_STATUS.NEW },
      { status: CUSTOMER_STATUS.INTENTION },
      { status: CUSTOMER_STATUS.NEGOTIATION },
      { status: CUSTOMER_STATUS.CLOSED },
    ]
    const result = getFunnelData(customers)
    expect(result.total).toBe(5)
    expect(result.stages.find((s) => s.key === CUSTOMER_STATUS.NEW).count).toBe(2)
    expect(result.stages.find((s) => s.key === CUSTOMER_STATUS.INTENTION).count).toBe(1)
    expect(result.stages.find((s) => s.key === CUSTOMER_STATUS.NEGOTIATION).count).toBe(1)
    expect(result.stages.find((s) => s.key === CUSTOMER_STATUS.CLOSED).count).toBe(1)
  })

  it('正确计算转化率', () => {
    const customers = [
      { status: CUSTOMER_STATUS.NEW },
      { status: CUSTOMER_STATUS.NEW },
      { status: CUSTOMER_STATUS.INTENTION },
      { status: CUSTOMER_STATUS.CLOSED },
    ]
    const result = getFunnelData(customers)
    const newStage = result.stages.find((s) => s.key === CUSTOMER_STATUS.NEW)
    const intentionStage = result.stages.find((s) => s.key === CUSTOMER_STATUS.INTENTION)
    expect(newStage.conversionRate).toBe(50)
    expect(intentionStage.conversionRate).toBe(50)
  })

  it('包含4个阶段', () => {
    const result = getFunnelData([])
    expect(result.stages.length).toBe(4)
    expect(result.stages[0].label).toBe(CUSTOMER_STATUS_LABEL[CUSTOMER_STATUS.NEW])
  })
})

describe('getUserName', () => {
  it('null返回公海', () => {
    expect(getUserName(null)).toBe('公海')
  })

  it('已知用户返回正确名称', () => {
    expect(getUserName('u_001')).toBe(USERS[0].name)
  })

  it('未知用户返回未知', () => {
    expect(getUserName('invalid')).toBe('未知')
  })
})

describe('formatDate', () => {
  it('空值返回空字符串', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('timestamp=0（Unix纪元）正常格式化', () => {
    const result = formatDate(0)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('1970')
  })

  it('格式化时间戳为YYYY-MM-DD HH:mm', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
  })
})

describe('formatDateOnly', () => {
  it('空值返回空字符串', () => {
    expect(formatDateOnly(null)).toBe('')
    expect(formatDateOnly(undefined)).toBe('')
  })

  it('timestamp=0（Unix纪元）正常格式化', () => {
    const result = formatDateOnly(0)
    expect(result).toContain('1970')
  })

  it('格式化时间戳为YYYY-MM-DD', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDateOnly(ts)
    expect(result).toBe('2024-01-15')
  })
})

describe('customersToCSV', () => {
  it('空数组返回空字符串', () => {
    expect(customersToCSV([])).toBe('')
  })

  it('非数组返回空字符串', () => {
    expect(customersToCSV(null)).toBe('')
  })

  it('正确生成CSV内容', () => {
    const customers = [
      makeCustomer({
        name: '测试客户',
        company: '测试公司',
        phone: '13800138000',
        email: 'test@example.com',
        source: '官网',
      }),
    ]
    const csv = customersToCSV(customers)
    expect(csv).toContain('客户名称')
    expect(csv).toContain('测试客户')
    expect(csv).toContain('测试公司')
    expect(csv).toContain('13800138000')
  })

  it('包含逗号和引号的值被正确转义', () => {
    const customers = [
      makeCustomer({
        name: '客户,带逗号',
        company: '公司"带引号"',
      }),
    ]
    const csv = customersToCSV(customers)
    expect(csv).toContain('"客户,带逗号"')
    expect(csv).toContain('"公司""带引号"""')
  })
})

describe('parseCSV', () => {
  it('空内容返回失败', () => {
    const result = parseCSV('')
    expect(result.success).toBe(false)
  })

  it('正确解析简单CSV', () => {
    const csv = '客户名称,联系电话\n测试客户,13800138000'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(1)
    expect(result.data[0].name).toBe('测试客户')
    expect(result.data[0].phone).toBe('13800138000')
  })

  it('正确处理带引号的字段', () => {
    const csv = '客户名称,联系电话\n"客户,名称",13800138000'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.data[0].name).toBe('客户,名称')
  })

  it('正确处理带转义引号的字段', () => {
    const csv = '客户名称,联系电话\n"客户""名称",13800138000'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.data[0].name).toBe('客户"名称')
  })

  it('处理BOM头', () => {
    const csv = '\uFEFF客户名称,联系电话\n测试,13800138000'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(1)
  })

  it('跳过空行', () => {
    const csv = '客户名称,联系电话\n\n测试,13800138000\n\n'
    const result = parseCSV(csv)
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(1)
  })
})

describe('validateImportData', () => {
  it('非数组返回空结果', () => {
    const result = validateImportData(null)
    expect(result.valid).toEqual([])
    expect(result.invalid).toEqual([])
  })

  it('正确识别有效数据', () => {
    const rows = [
      { name: '有效客户', phone: '13800138000' },
    ]
    const result = validateImportData(rows)
    expect(result.valid.length).toBe(1)
    expect(result.invalid.length).toBe(0)
  })

  it('正确识别无效数据', () => {
    const rows = [
      { name: '', phone: '' },
      { name: '客户', phone: '12345' },
    ]
    const result = validateImportData(rows)
    expect(result.valid.length).toBe(0)
    expect(result.invalid.length).toBe(2)
    expect(result.errors.length).toBe(2)
  })

  it('混合有效和无效数据', () => {
    const rows = [
      { name: '有效客户', phone: '13800138000' },
      { name: '', phone: '' },
    ]
    const result = validateImportData(rows)
    expect(result.valid.length).toBe(1)
    expect(result.invalid.length).toBe(1)
  })

  it('无效来源使用默认值"其他"', () => {
    const rows = [
      { name: '客户', phone: '13800138000', source: '无效来源' },
    ]
    const result = validateImportData(rows)
    expect(result.valid[0].source).toBe('其他')
  })

  it('有效来源保留原值', () => {
    const rows = [
      { name: '客户', phone: '13800138000', source: '官网' },
    ]
    const result = validateImportData(rows)
    expect(result.valid[0].source).toBe('官网')
  })
})

describe('batchCreateCustomers', () => {
  it('空数组返回原数据', () => {
    const original = [{ id: 'old' }]
    const result = batchCreateCustomers(original, [], null)
    expect(result.customers).toBe(original)
    expect(result.created).toBe(0)
  })

  it('成功批量创建客户', () => {
    const validRows = [
      { name: '客户1', company: '公司1', phone: '13800138001', email: 'a@b.com', source: '官网', remark: '' },
      { name: '客户2', company: '公司2', phone: '13800138002', email: 'c@d.com', source: '推荐', remark: '' },
    ]
    const result = batchCreateCustomers([], validRows, 'u_001')
    expect(result.created).toBe(2)
    expect(result.customers.length).toBe(2)
    expect(result.customers[0].ownerId).toBe('u_001')
    expect(result.customers[0].status).toBe(CUSTOMER_STATUS.NEW)
    expect(result.customers[0].id).toBeTruthy()
  })

  it('新客户放在列表前面', () => {
    const existing = [{ id: 'old', name: '旧客户' }]
    const validRows = [
      { name: '新客户', phone: '13800138000', company: '', email: '', source: '官网', remark: '' },
    ]
    const result = batchCreateCustomers(existing, validRows, null)
    expect(result.customers[0].name).toBe('新客户')
    expect(result.customers[1].id).toBe('old')
  })
})
