import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  TIMEOUT_HOURS,
  VISITOR_STATUS,
  DEFAULT_PAGE_SIZE,
  RECENT_HOST_LIMIT,
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_RECENT,
} from '../../visitor-registration/constants'
import {
  generateId,
  formatDateTime,
  maskPhone,
  maskIdCard,
  getVisitorStatus,
  sortRecords,
  filterRecords,
  paginateRecords,
  exportRecordsToCsv,
  updateRecentHosts,
  searchHosts,
  checkOutRecord,
  batchCheckOutRecords,
} from '../../visitor-registration/utils'
import {
  loadRecords,
  saveRecords,
  loadRecentHosts,
  saveRecentHosts,
} from '../../visitor-registration/storage'

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

describe('generateId', () => {
  it('生成的ID以 vr_ 开头', () => {
    expect(generateId()).toMatch(/^vr_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为 yyyy-MM-dd HH:mm:ss', () => {
    const ts = new Date(2025, 5, 15, 10, 30, 45).getTime()
    expect(formatDateTime(ts)).toBe('2025-06-15 10:30:45')
  })

  it('空值返回空字符串', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime('')).toBe('')
  })

  it('无效日期返回空字符串', () => {
    expect(formatDateTime('invalid')).toBe('')
  })

  it('补零正确', () => {
    const ts = new Date(2025, 0, 5, 3, 7, 9).getTime()
    expect(formatDateTime(ts)).toBe('2025-01-05 03:07:09')
  })

  it('支持Date对象', () => {
    const d = new Date(2025, 5, 15, 10, 30, 45)
    expect(formatDateTime(d)).toBe('2025-06-15 10:30:45')
  })
})

describe('maskPhone', () => {
  it('掩码11位手机号', () => {
    expect(maskPhone('13812345678')).toBe('138****5678')
    expect(maskPhone('13900001111')).toBe('139****1111')
  })

  it('非11位手机号原样返回', () => {
    expect(maskPhone('123456')).toBe('123456')
    expect(maskPhone('123456789012345')).toBe('123456789012345')
  })

  it('空值返回空字符串', () => {
    expect(maskPhone('')).toBe('')
    expect(maskPhone(null)).toBe('')
    expect(maskPhone(undefined)).toBe('')
  })
})

describe('maskIdCard', () => {
  it('掩码18位身份证号', () => {
    expect(maskIdCard('110101199001011234')).toBe('110101********1234')
    expect(maskIdCard('310101198512154321')).toBe('310101********4321')
  })

  it('支持末位X', () => {
    expect(maskIdCard('11010119900101123X')).toBe('110101********123X')
  })

  it('非18位身份证号原样返回', () => {
    expect(maskIdCard('123456')).toBe('123456')
    expect(maskIdCard('12345678901234567890')).toBe('12345678901234567890')
  })

  it('空值返回空字符串', () => {
    expect(maskIdCard('')).toBe('')
    expect(maskIdCard(null)).toBe('')
    expect(maskIdCard(undefined)).toBe('')
  })
})

describe('getVisitorStatus', () => {
  const now = Date.now()
  const baseRecord = {
    id: '1',
    registerTime: now,
    checkOutTime: null,
  }

  it('已签退记录返回已签退状态', () => {
    const record = { ...baseRecord, checkOutTime: now }
    expect(getVisitorStatus(record, now)).toBe(VISITOR_STATUS.CHECKED_OUT)
  })

  it('刚登记记录返回访问中状态', () => {
    expect(getVisitorStatus(baseRecord, now)).toBe(VISITOR_STATUS.VISITING)
  })

  it('7小时59分未签退返回访问中状态', () => {
    const registerTime = now - (TIMEOUT_HOURS * 60 * 60 * 1000 - 1000)
    const record = { ...baseRecord, registerTime }
    expect(getVisitorStatus(record, now)).toBe(VISITOR_STATUS.VISITING)
  })

  it('超过8小时未签退返回超时状态', () => {
    const registerTime = now - (TIMEOUT_HOURS * 60 * 60 * 1000 + 1000)
    const record = { ...baseRecord, registerTime }
    expect(getVisitorStatus(record, now)).toBe(VISITOR_STATUS.OVERDUE)
  })

  it('恰好8小时未签退返回访问中状态', () => {
    const registerTime = now - TIMEOUT_HOURS * 60 * 60 * 1000
    const record = { ...baseRecord, registerTime }
    expect(getVisitorStatus(record, now)).toBe(VISITOR_STATUS.VISITING)
  })
})

describe('sortRecords', () => {
  const now = Date.now()

  const makeRecord = (id, overrides = {}) => ({
    id,
    name: '访客' + id,
    phone: '13800000000',
    idCard: '110101199001011234',
    reason: '测试',
    host: null,
    registerTime: now,
    checkOutTime: null,
    ...overrides,
  })

  it('超时记录置顶', () => {
    const overdue = makeRecord('1', {
      registerTime: now - (TIMEOUT_HOURS + 1) * 60 * 60 * 1000,
    })
    const visiting = makeRecord('2')
    const checkedOut = makeRecord('3', { checkOutTime: now })
    const sorted = sortRecords([visiting, checkedOut, overdue], now)
    expect(sorted[0].id).toBe('1')
  })

  it('同时按登记时间降序', () => {
    const r1 = makeRecord('1', { registerTime: now - 1000 })
    const r2 = makeRecord('2', { registerTime: now - 2000 })
    const r3 = makeRecord('3', { registerTime: now })
    const sorted = sortRecords([r1, r2, r3], now)
    expect(sorted.map((r) => r.id)).toEqual(['3', '1', '2'])
  })

  it('超时和正常记录分开排序', () => {
    const o1 = makeRecord('o1', {
      registerTime: now - (TIMEOUT_HOURS + 2) * 60 * 60 * 1000,
    })
    const o2 = makeRecord('o2', {
      registerTime: now - (TIMEOUT_HOURS + 1) * 60 * 60 * 1000,
    })
    const v1 = makeRecord('v1', { registerTime: now - 1000 })
    const v2 = makeRecord('v2', { registerTime: now })
    const sorted = sortRecords([v1, o1, v2, o2], now)
    expect(sorted.map((r) => r.id)).toEqual(['o2', 'o1', 'v2', 'v1'])
  })

  it('空数组返回空数组', () => {
    expect(sortRecords([])).toEqual([])
  })
})

describe('filterRecords', () => {
  const now = Date.now()
  const makeRecord = (id, overrides = {}) => ({
    id,
    name: '访客' + id,
    phone: '1380000000' + id,
    idCard: '11010119900101123' + id,
    reason: '测试事由' + id,
    host: null,
    registerTime: now,
    checkOutTime: null,
    ...overrides,
  })

  const records = [
    makeRecord('1', { name: '张三', phone: '13811112222' }),
    makeRecord('2', { name: '李四', phone: '13933334444' }),
    makeRecord('3', {
      name: '王五',
      phone: '13655556666',
      registerTime: now - (TIMEOUT_HOURS + 1) * 60 * 60 * 1000,
    }),
    makeRecord('4', {
      name: '赵六',
      phone: '13777778888',
      checkOutTime: now - 1000,
    }),
  ]

  it('无筛选条件返回全部', () => {
    expect(filterRecords(records, {}).length).toBe(4)
  })

  it('按姓名关键词筛选', () => {
    expect(filterRecords(records, { keyword: '张' }).length).toBe(1)
    expect(filterRecords(records, { keyword: '张' })[0].name).toBe('张三')
  })

  it('按手机号筛选', () => {
    expect(filterRecords(records, { keyword: '13811112222' }).length).toBe(1)
    expect(filterRecords(records, { keyword: '11112222' }).length).toBe(1)
  })

  it('空关键词不筛选', () => {
    expect(filterRecords(records, { keyword: '   ' }).length).toBe(4)
  })

  it('按状态筛选-访问中', () => {
    const result = filterRecords(records, { status: VISITOR_STATUS.VISITING }, now)
    expect(result.length).toBe(2)
  })

  it('按状态筛选-已签退', () => {
    const result = filterRecords(records, { status: VISITOR_STATUS.CHECKED_OUT }, now)
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('赵六')
  })

  it('按状态筛选-超时', () => {
    const result = filterRecords(records, { status: VISITOR_STATUS.OVERDUE }, now)
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('王五')
  })

  it('按起始日期筛选', () => {
    const tomorrow = new Date(now + 24 * 60 * 60 * 1000)
    const startDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
    const result = filterRecords(records, { startDate })
    expect(result.length).toBe(0)

    const yesterday = new Date(now - 24 * 60 * 60 * 1000)
    const startDate2 = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    const result2 = filterRecords(records, { startDate: startDate2 })
    expect(result2.length).toBe(4)
  })

  it('按结束日期筛选', () => {
    const yesterday = new Date(now - 24 * 60 * 60 * 1000)
    const endDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    const result = filterRecords(records, { endDate })
    expect(result.length).toBe(0)
  })

  it('组合筛选', () => {
    const result = filterRecords(
      records,
      { keyword: '张', status: VISITOR_STATUS.VISITING },
      now
    )
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('张三')
  })

  it('空数组返回空数组', () => {
    expect(filterRecords([], { keyword: 'test' })).toEqual([])
  })
})

describe('paginateRecords', () => {
  const records = Array.from({ length: 55 }, (_, i) => ({ id: String(i + 1) }))

  it('第一页正确', () => {
    const result = paginateRecords(records, 1, 20)
    expect(result.items.length).toBe(20)
    expect(result.items[0].id).toBe('1')
    expect(result.items[19].id).toBe('20')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(55)
  })

  it('最后一页正确', () => {
    const result = paginateRecords(records, 3, 20)
    expect(result.items.length).toBe(15)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateRecords(records, 100, 20)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于1时修正', () => {
    const result = paginateRecords(records, 0, 20)
    expect(result.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateRecords([], 1, 20)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })

  it('使用默认每页条数', () => {
    const result = paginateRecords(records, 1)
    expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE)
  })

  it('自定义每页条数', () => {
    const result = paginateRecords(records, 1, 50)
    expect(result.items.length).toBe(50)
    expect(result.totalPage).toBe(2)
  })
})

describe('exportRecordsToCsv', () => {
  const now = new Date(2025, 5, 15, 10, 30, 0).getTime()
  const records = [
    {
      id: '1',
      name: '张三',
      phone: '13812345678',
      idCard: '110101199001011234',
      reason: '商务洽谈',
      host: { name: '李经理', department: '市场部', position: '经理' },
      registerTime: now,
      checkOutTime: now + 60 * 60 * 1000,
    },
  ]

  it('生成 CSV 字符串', () => {
    const csv = exportRecordsToCsv(records)
    const lines = csv.split('\n')
    expect(lines.length).toBe(2)
    expect(lines[0]).toContain('姓名')
    expect(lines[0]).toContain('手机号')
    expect(lines[0]).toContain('身份证号')
    expect(lines[0]).toContain('访问事由')
    expect(lines[0]).toContain('被访人')
    expect(lines[0]).toContain('登记时间')
    expect(lines[0]).toContain('签退时间')
    expect(lines[0]).toContain('状态')
    expect(lines[1]).toContain('张三')
    expect(lines[1]).toContain('13812345678')
    expect(lines[1]).toContain('商务洽谈')
    expect(lines[1]).toContain('李经理')
    expect(lines[1]).toContain('市场部')
    expect(lines[1]).toContain('已签退')
  })

  it('空列表只返回表头', () => {
    const csv = exportRecordsToCsv([])
    const lines = csv.split('\n')
    expect(lines.length).toBe(1)
    expect(lines[0]).toContain('姓名')
  })

  it('处理包含双引号的数据', () => {
    const r = [{ ...records[0], name: '测试"用户', reason: '包含"引号"的事由' }]
    const csv = exportRecordsToCsv(r)
    expect(csv).toContain('测试""用户')
    expect(csv).toContain('包含""引号""的事由')
  })

  it('无被访人数据显示为空', () => {
    const r = [{ ...records[0], host: null }]
    const csv = exportRecordsToCsv(r)
    const lines = csv.split('\n')
    expect(lines[1]).toContain(',""')
  })
})

describe('updateRecentHosts', () => {
  const h1 = { id: 'H001', name: '张三', department: '技术部' }
  const h2 = { id: 'H002', name: '李四', department: '产品部' }
  const h3 = { id: 'H003', name: '王五', department: '设计部' }
  const h4 = { id: 'H004', name: '赵六', department: '市场部' }

  it('空列表添加新被访人', () => {
    const result = updateRecentHosts([], h1)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('H001')
  })

  it('已存在的被访人移到最前', () => {
    const result = updateRecentHosts([h1, h2, h3], h2)
    expect(result.length).toBe(3)
    expect(result[0].id).toBe('H002')
    expect(result[1].id).toBe('H001')
    expect(result[2].id).toBe('H003')
  })

  it('超过限制数量时删除最旧的', () => {
    const result = updateRecentHosts([h1, h2, h3], h4)
    expect(result.length).toBe(RECENT_HOST_LIMIT)
    expect(result[0].id).toBe('H004')
    expect(result.map((h) => h.id)).toEqual(['H004', 'H001', 'H002'])
    expect(result.map((h) => h.id)).not.toContain('H003')
  })

  it('null host 返回原列表', () => {
    const result = updateRecentHosts([h1, h2], null)
    expect(result.length).toBe(2)
    expect(result[0].id).toBe('H001')
  })

  it('自定义限制数量', () => {
    const result = updateRecentHosts([h1, h2], h3, 5)
    expect(result.length).toBe(3)
  })
})

describe('searchHosts', () => {
  const hosts = [
    { id: 'H001', name: '张伟', department: '技术部', position: '前端工程师' },
    { id: 'H002', name: '李娜', department: '产品部', position: '产品经理' },
    { id: 'H003', name: '王强', department: '技术部', position: '后端工程师' },
    { id: 'H004', name: '刘洋', department: '设计部', position: 'UI设计师' },
  ]

  it('空关键词返回全部', () => {
    expect(searchHosts(hosts, '').length).toBe(4)
    expect(searchHosts(hosts, '   ').length).toBe(4)
  })

  it('按姓名模糊搜索', () => {
    expect(searchHosts(hosts, '张').length).toBe(1)
    expect(searchHosts(hosts, '张')[0].name).toBe('张伟')
    expect(searchHosts(hosts, '伟').length).toBe(1)
  })

  it('不区分大小写', () => {
    expect(searchHosts(hosts, 'zhang').length).toBe(0)
    expect(searchHosts(hosts, '张').length).toBe(1)
  })

  it('无匹配返回空数组', () => {
    expect(searchHosts(hosts, '不存在的名字').length).toBe(0)
  })

  it('空列表返回空数组', () => {
    expect(searchHosts([], '张')).toEqual([])
  })
})

describe('checkOutRecord', () => {
  it('设置签退时间', () => {
    const record = { id: '1', name: '张三', checkOutTime: null, registerTime: Date.now() }
    const checkOutTime = Date.now()
    const result = checkOutRecord(record, checkOutTime)
    expect(result.checkOutTime).toBe(checkOutTime)
  })

  it('不修改原记录', () => {
    const record = { id: '1', name: '张三', checkOutTime: null, registerTime: Date.now() }
    const result = checkOutRecord(record, Date.now())
    expect(result).not.toBe(record)
  })

  it('默认使用当前时间', () => {
    const record = { id: '1', name: '张三', checkOutTime: null, registerTime: Date.now() }
    const before = Date.now()
    const result = checkOutRecord(record)
    const after = Date.now()
    expect(result.checkOutTime).toBeGreaterThanOrEqual(before)
    expect(result.checkOutTime).toBeLessThanOrEqual(after)
  })
})

describe('batchCheckOutRecords', () => {
  const makeRecord = (id, checkedOut = false) => ({
    id,
    name: '访客' + id,
    registerTime: Date.now(),
    checkOutTime: checkedOut ? Date.now() : null,
  })

  it('批量签退指定记录', () => {
    const records = [makeRecord('1'), makeRecord('2'), makeRecord('3')]
    const checkOutTime = Date.now()
    const result = batchCheckOutRecords(records, ['1', '3'], checkOutTime)
    expect(result.find((r) => r.id === '1').checkOutTime).toBe(checkOutTime)
    expect(result.find((r) => r.id === '2').checkOutTime).toBeNull()
    expect(result.find((r) => r.id === '3').checkOutTime).toBe(checkOutTime)
  })

  it('不修改已签退记录', () => {
    const originalCheckOutTime = Date.now() - 1000
    const records = [
      makeRecord('1'),
      { ...makeRecord('2'), checkOutTime: originalCheckOutTime },
    ]
    const result = batchCheckOutRecords(records, ['1', '2'])
    expect(result.find((r) => r.id === '1').checkOutTime).not.toBeNull()
    expect(result.find((r) => r.id === '2').checkOutTime).toBe(originalCheckOutTime)
  })

  it('空ID列表不修改任何记录', () => {
    const records = [makeRecord('1'), makeRecord('2')]
    const result = batchCheckOutRecords(records, [])
    expect(result.every((r) => r.checkOutTime === null)).toBe(true)
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveRecords 保存到 localStorage', () => {
    const records = [{ id: '1', name: '张三' }]
    const result = saveRecords(records)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_RECORDS)).toBe(JSON.stringify(records))
  })

  it('loadRecords 从 localStorage 读取', () => {
    const records = [{ id: '1', name: '张三' }]
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
    expect(loadRecords()).toEqual(records)
  })

  it('loadRecords localStorage 为空时返回空数组', () => {
    expect(loadRecords()).toEqual([])
  })

  it('loadRecords 数据损坏时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_RECORDS, 'invalid-json')
    expect(loadRecords()).toEqual([])
  })

  it('loadRecords 数据非数组时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify({ not: 'array' }))
    expect(loadRecords()).toEqual([])
  })

  it('saveRecentHosts 保存到 localStorage', () => {
    const hosts = [{ id: 'H001', name: '张三' }]
    const result = saveRecentHosts(hosts)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_RECENT)).toBe(JSON.stringify(hosts))
  })

  it('loadRecentHosts 从 localStorage 读取', () => {
    const hosts = [{ id: 'H001', name: '张三' }]
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(hosts))
    expect(loadRecentHosts()).toEqual(hosts)
  })

  it('loadRecentHosts 为空时返回空数组', () => {
    expect(loadRecentHosts()).toEqual([])
  })

  it('loadRecentHosts 数据损坏时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_RECENT, 'invalid')
    expect(loadRecentHosts()).toEqual([])
  })

  it('loadRecentHosts 数据非数组时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify({ not: 'array' }))
    expect(loadRecentHosts()).toEqual([])
  })
})
