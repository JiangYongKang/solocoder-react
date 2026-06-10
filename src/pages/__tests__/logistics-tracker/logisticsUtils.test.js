import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadQueryHistory,
  saveQueryHistory,
  addQueryRecord,
  clearQueryHistory,
  parseLogisticsData,
  parseSfOrder,
  parseYtOrder,
  parseZtOrder,
  parseYdOrder,
  parseJdOrder,
  parseEmsOrder,
  queryLogistics,
  isLatestNodeException,
  extractRoutePoints,
  extractCityName,
  getCurrentPositionIndex,
  sortNodesDesc,
} from '@/pages/logistics-tracker/logisticsUtils.js'
import { STORAGE_KEY, STATUS_TYPES } from '@/pages/logistics-tracker/constants.js'
import { getMockDataByCompany } from '@/pages/logistics-tracker/mockData.js'

function createMockStorage() {
  const store = {}
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k])
    }),
    _store: store,
  }
}

function mockWindowLocalStorage() {
  const storage = createMockStorage()
  const originalLocalStorage = (typeof window !== 'undefined') ? window.localStorage : undefined
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: storage },
    writable: true,
    configurable: true,
  })
  return { storage, restore: () => {
    if (originalLocalStorage !== undefined) {
      Object.defineProperty(globalThis, 'window', {
        value: { localStorage: originalLocalStorage },
        writable: true,
        configurable: true,
      })
    } else {
      delete globalThis.window
    }
  } }
}

describe('logisticsUtils - localStorage', () => {
  let mockResult
  let storage

  beforeEach(() => {
    mockResult = mockWindowLocalStorage()
    storage = mockResult.storage
  })

  afterEach(() => {
    mockResult.restore()
  })

  describe('loadQueryHistory', () => {
    it('should return empty array when storage is empty', () => {
      expect(loadQueryHistory()).toEqual([])
    })

    it('should return empty array when storage has invalid JSON', () => {
      storage._store[STORAGE_KEY] = 'invalid-json'
      expect(loadQueryHistory()).toEqual([])
    })

    it('should return empty array when storage data is not an array', () => {
      storage._store[STORAGE_KEY] = JSON.stringify({ foo: 'bar' })
      expect(loadQueryHistory()).toEqual([])
    })

    it('should filter out invalid items', () => {
      const validItem = { trackingNo: 'SF123', companyId: 'sf', queryTime: 123456 }
      const invalidItem1 = { trackingNo: 123, companyId: 'sf' }
      const invalidItem2 = { trackingNo: 'SF123', companyId: 123 }
      storage._store[STORAGE_KEY] = JSON.stringify([validItem, invalidItem1, invalidItem2, null])
      const result = loadQueryHistory()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(validItem)
    })

    it('should correctly load valid history', () => {
      const history = [
        { trackingNo: 'SF123', companyId: 'sf', companyName: '顺丰速运', queryTime: 1 },
        { trackingNo: 'YT456', companyId: 'yt', companyName: '圆通速递', queryTime: 2 },
      ]
      storage._store[STORAGE_KEY] = JSON.stringify(history)
      expect(loadQueryHistory()).toEqual(history)
    })
  })

  describe('saveQueryHistory', () => {
    it('should save history to storage', () => {
      const history = [{ trackingNo: 'SF123', companyId: 'sf', queryTime: 1 }]
      saveQueryHistory(history)
      expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(history))
      expect(JSON.parse(storage._store[STORAGE_KEY])).toEqual(history)
    })

    it('should not save more than MAX_HISTORY items', () => {
      const history = Array.from({ length: 20 }, (_, i) => ({
        trackingNo: `SF${i}`,
        companyId: 'sf',
        queryTime: i,
      }))
      saveQueryHistory(history)
      const saved = JSON.parse(storage._store[STORAGE_KEY])
      expect(saved.length).toBeLessThanOrEqual(10)
    })

    it('should save empty array for invalid input', () => {
      saveQueryHistory(null)
      expect(JSON.parse(storage._store[STORAGE_KEY])).toEqual([])
    })
  })

  describe('addQueryRecord', () => {
    it('should return null for empty trackingNo', () => {
      expect(addQueryRecord('', 'sf')).toBeNull()
      expect(addQueryRecord('   ', 'sf')).toBeNull()
    })

    it('should return null for empty companyId', () => {
      expect(addQueryRecord('SF123', '')).toBeNull()
    })

    it('should add record and move it to front', () => {
      storage._store[STORAGE_KEY] = JSON.stringify([
        { trackingNo: 'YT456', companyId: 'yt', queryTime: 1 },
      ])

      const result = addQueryRecord('SF123', 'sf', '顺丰速运')
      expect(result).not.toBeNull()
      expect(result.trackingNo).toBe('SF123')
      expect(result.companyId).toBe('sf')

      const history = loadQueryHistory()
      expect(history[0].trackingNo).toBe('SF123')
    })

    it('should trim trackingNo', () => {
      const result = addQueryRecord('  SF123  ', 'sf', '顺丰速运')
      expect(result.trackingNo).toBe('SF123')
    })
  })

  describe('clearQueryHistory', () => {
    it('should clear storage', () => {
      storage._store[STORAGE_KEY] = JSON.stringify([{ a: 1 }])
      clearQueryHistory()
      expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
      expect(storage._store[STORAGE_KEY]).toBeUndefined()
    })
  })
})

describe('logisticsUtils - data parsing signer extraction', () => {
  describe('parseSfOrder', () => {
    it('should return null for null input', () => {
      expect(parseSfOrder(null)).toBeNull()
    })

    it('should return null for order without routes', () => {
      expect(parseSfOrder({})).toBeNull()
    })

    it('should correctly parse a signed SF order with signer', () => {
      const sfData = getMockDataByCompany('sf')
      const order = sfData.orders['SF1234567890']
      const result = parseSfOrder(order)

      expect(result).not.toBeNull()
      expect(result.trackingNo).toBe('SF1234567890')
      expect(result.company).toBe('sf')
      expect(result.isSigned).toBe(true)
      expect(result.signer).toBe('张三')
      expect(result.signTime).toBe('2026-06-08 15:30:00')
      expect(result.origin).toBe('深圳')
      expect(result.destination).toBe('北京')
      expect(result.nodes.length).toBe(6)
      expect(result.nodes[0].isLatest).toBe(true)
      expect(result.nodes[0].status).toBe(STATUS_TYPES.SIGNED)
    })

    it('should correctly parse an exception SF order using hasException field not text', () => {
      const sfData = getMockDataByCompany('sf')
      const order = sfData.orders['SF9998887776']
      const result = parseSfOrder(order)

      expect(result).not.toBeNull()
      expect(result.hasException).toBe(true)
      expect(result.nodes[0].isException).toBe(true)
      expect(result.nodes[0].status).toBe(STATUS_TYPES.EXCEPTION)
      expect(result.nodes[0].exceptionReason).not.toBeNull()
    })

    it('should rely on opcode and hasException flag, not remark text content', () => {
      const order = {
        trackingNo: 'TEST001',
        isSigned: false,
        hasException: true,
        exceptionCode: 'LOST',
        origin: '北京',
        destination: '上海',
        routes: [
          {
            acceptTime: '2026-06-09 10:00:00',
            acceptAddress: '北京市朝阳区',
            remark: '快件正在运输中',
            opcode: '99',
          },
          {
            acceptTime: '2026-06-09 08:00:00',
            acceptAddress: '北京转运中心',
            remark: '快件已揽收，一切正常',
            opcode: '10',
          },
        ],
      }
      const result = parseSfOrder(order)
      expect(result.hasException).toBe(true)
      expect(result.nodes[0].status).toBe(STATUS_TYPES.EXCEPTION)
      expect(result.nodes[0].isException).toBe(true)
      expect(result.nodes[1].status).toBe(STATUS_TYPES.PICKED_UP)
    })

    it('should map non-standard opcode to EXCEPTION when order hasException=true (default branch coverage)', () => {
      const order = {
        trackingNo: 'TEST002',
        isSigned: false,
        hasException: true,
        exceptionCode: 'DELAYED',
        origin: '广州',
        destination: '深圳',
        routes: [
          {
            acceptTime: '2026-06-09 10:00:00',
            acceptAddress: '广州市天河区',
            remark: '正常运输描述，无异常字样',
            opcode: '999',
          },
          {
            acceptTime: '2026-06-09 08:00:00',
            acceptAddress: '广州转运中心',
            remark: '快件已揽收',
            opcode: '10',
          },
        ],
      }
      const result = parseSfOrder(order)
      expect(result.hasException).toBe(true)
      expect(result.nodes[0].status).toBe(STATUS_TYPES.EXCEPTION)
      expect(result.nodes[0].isException).toBe(true)
      expect(result.nodes[0].exceptionReason).not.toBeNull()
    })

    it('should map non-standard opcode to IN_TRANSIT when order hasException=false (default branch)', () => {
      const order = {
        trackingNo: 'TEST003',
        isSigned: false,
        hasException: false,
        origin: '广州',
        destination: '深圳',
        routes: [
          {
            acceptTime: '2026-06-09 10:00:00',
            acceptAddress: '广州市天河区',
            remark: '异常（但标志位为false，应判定为运输中）',
            opcode: '999',
          },
        ],
      }
      const result = parseSfOrder(order)
      expect(result.hasException).toBe(false)
      expect(result.nodes[0].status).toBe(STATUS_TYPES.IN_TRANSIT)
      expect(result.nodes[0].isException).toBe(false)
    })
  })

  describe('parseYtOrder', () => {
    it('should correctly extract signer and signTime from YT order', () => {
      const ytData = getMockDataByCompany('yt')
      const order = ytData.orders['YT1234567890123']
      const result = parseYtOrder(order)

      expect(result).not.toBeNull()
      expect(result.trackingNo).toBe('YT1234567890123')
      expect(result.isSigned).toBe(true)
      expect(result.signer).toBe('前台代收')
      expect(result.signTime).toBe('2026-06-07 14:20:00')
    })

    it('should return null signer when YT order statusCode is not SIGNED (unsigned boundary)', () => {
      const unsignedOrder = {
        number: 'YT9999999999999',
        status: '运输中',
        statusCode: 'IN_TRANSIT',
        senderCity: '广州',
        receiverCity: '杭州',
        data: [
          {
            time: '2026-06-07 06:30:00',
            location: '杭州转运中心',
            status: '到达',
            details: '快件已到达杭州转运中心',
          },
          {
            time: '2026-06-06 10:00:00',
            location: '广州市天河区营业点',
            status: '揽收',
            details: '圆通速递已揽收',
          },
        ],
      }
      const result = parseYtOrder(unsignedOrder)
      expect(result).not.toBeNull()
      expect(result.isSigned).toBe(false)
      expect(result.signer).toBeNull()
      expect(result.signTime).toBeNull()
    })
  })

  describe('parseZtOrder', () => {
    it('should return null for signedName when order not signed', () => {
      const ztData = getMockDataByCompany('zt')
      const order = ztData.orders['ZT777888999000']
      const result = parseZtOrder(order)

      expect(result).not.toBeNull()
      expect(result.trackingNo).toBe('ZT777888999000')
      expect(result.isSigned).toBe(false)
      expect(result.signer).toBeNull()
      expect(result.signTime).toBeNull()
    })

    it('should correctly extract signer and signTime for signed ZT order', () => {
      const ztData = getMockDataByCompany('zt')
      const order = ztData.orders['ZT111222333444']
      const result = parseZtOrder(order)

      expect(result).not.toBeNull()
      expect(result.isSigned).toBe(true)
      expect(result.signer).toBe('李女士')
      expect(result.signTime).toBe('2026-06-06 16:00:00')
    })
  })

  describe('parseYdOrder', () => {
    it('should correctly extract signer and signTime from YD order', () => {
      const ydData = getMockDataByCompany('yd')
      const order = ydData.orders['YD5556667778']
      const result = parseYdOrder(order)

      expect(result).not.toBeNull()
      expect(result.trackingNo).toBe('YD5556667778')
      expect(result.isSigned).toBe(true)
      expect(result.signer).toBe('本人')
      expect(result.signTime).toBe('2026-06-05 16:00:00')
    })

    it('should return null signer when YD order signStatus is not 1 (unsigned boundary)', () => {
      const unsignedOrder = {
        mailNo: 'YD0000000000',
        signStatus: '0',
        originationName: '厦门',
        destinationName: '沈阳',
        result: [
          {
            time: '2026-06-05 03:00:00',
            location: '沈阳转运中心',
            context: '到达沈阳转运中心',
            state: '到达',
          },
          {
            time: '2026-06-03 10:00:00',
            location: '厦门市思明区网点',
            context: '韵达快递 已揽收',
            state: '揽收',
          },
        ],
      }
      const result = parseYdOrder(unsignedOrder)
      expect(result).not.toBeNull()
      expect(result.isSigned).toBe(false)
      expect(result.signer).toBeNull()
      expect(result.signTime).toBeNull()
    })
  })

  describe('parseJdOrder', () => {
    it('should correctly extract signer and signTime from JD order', () => {
      const jdData = getMockDataByCompany('jd')
      const order = jdData.orders['JD000111222333']
      const result = parseJdOrder(order)

      expect(result).not.toBeNull()
      expect(result.trackingNo).toBe('JD000111222333')
      expect(result.isSigned).toBe(true)
      expect(result.signer).toBe('本人')
      expect(result.signTime).toBe('2026-06-04 11:00:00')
    })

    it('should return null signer when JD order finished=false (unsigned boundary)', () => {
      const unsignedOrder = {
        waybillCode: 'JD999999999999',
        finished: false,
        startProvince: '天津',
        endProvince: '重庆',
        detailList: [
          {
            operatorTime: '2026-06-04 02:00:00',
            operatorContact: '重庆分拨中心',
            content: '货物已到达重庆分拨中心',
            statusCode: 30,
          },
          {
            operatorTime: '2026-06-03 08:00:00',
            operatorContact: '天津市和平区营业部',
            content: '京东快递已收取快件',
            statusCode: 10,
          },
        ],
      }
      const result = parseJdOrder(unsignedOrder)
      expect(result).not.toBeNull()
      expect(result.isSigned).toBe(false)
      expect(result.signer).toBeNull()
      expect(result.signTime).toBeNull()
    })
  })

  describe('parseEmsOrder', () => {
    it('should correctly extract signer and signTime from normal EMS order', () => {
      const emsData = getMockDataByCompany('ems')
      const order = emsData.orders['EMS3334445556']
      const result = parseEmsOrder(order)

      expect(result).not.toBeNull()
      expect(result.trackingNo).toBe('EMS3334445556')
      expect(result.isSigned).toBe(true)
      expect(result.signer).toBe('本人')
      expect(result.signTime).toBe('2026-06-06 15:45:00')
    })

    it('should correctly parse exception EMS order', () => {
      const emsData = getMockDataByCompany('ems')
      const order = emsData.orders['EMS1112223334']
      const result = parseEmsOrder(order)

      expect(result).not.toBeNull()
      expect(result.hasException).toBe(true)
      expect(result.nodes[0].isException).toBe(true)
      expect(result.nodes[0].status).toBe(STATUS_TYPES.EXCEPTION)
    })

    it('should return null signer when EMS deliveryStatus is not delivered (unsigned boundary)', () => {
      const unsignedOrder = {
        trackingNumber: 'EMS7777777777',
        deliveryStatus: 'in_transit',
        originCity: '郑州',
        destCity: '长沙',
        steps: [
          {
            occurTime: '2026-06-06 05:00:00',
            city: '长沙邮区中心局',
            orignist: 'EMS',
            description: '到达长沙邮区中心局邮件处理中心',
            type: 'arrival',
          },
          {
            occurTime: '2026-06-05 11:00:00',
            city: '郑州市二七区',
            orignist: 'EMS',
            description: 'EMS已揽收',
            type: 'pickup',
          },
        ],
      }
      const result = parseEmsOrder(unsignedOrder)
      expect(result).not.toBeNull()
      expect(result.isSigned).toBe(false)
      expect(result.hasException).toBe(false)
      expect(result.signer).toBeNull()
      expect(result.signTime).toBeNull()
    })
  })

  describe('parseLogisticsData', () => {
    it('should return null for invalid companyId', () => {
      expect(parseLogisticsData('invalid', {})).toBeNull()
    })

    it('should return null for null rawOrder', () => {
      expect(parseLogisticsData('sf', null)).toBeNull()
    })
  })
})

describe('logisticsUtils - query and helpers', () => {
  describe('queryLogistics', () => {
    it('should fail with empty trackingNo', () => {
      const result = queryLogistics('', 'sf')
      expect(result.success).toBe(false)
      expect(result.error).toContain('请输入')
    })

    it('should fail with empty companyId', () => {
      const result = queryLogistics('SF123', '')
      expect(result.success).toBe(false)
    })

    it('should fail with invalid companyId', () => {
      const result = queryLogistics('SF123', 'invalid')
      expect(result.success).toBe(false)
    })

    it('should fail with nonexistent tracking number', () => {
      const result = queryLogistics('NONEXISTENT999', 'sf')
      expect(result.success).toBe(false)
      expect(result.error).toBe('暂无物流信息')
    })

    it('should successfully query SF tracking number', () => {
      const result = queryLogistics('SF1234567890', 'sf')
      expect(result.success).toBe(true)
      expect(result.data.trackingNo).toBe('SF1234567890')
      expect(result.data.isSigned).toBe(true)
    })

    it('should successfully query with whitespace-trimmed tracking number', () => {
      const result = queryLogistics('  SF1234567890  ', 'sf')
      expect(result.success).toBe(true)
      expect(result.data.trackingNo).toBe('SF1234567890')
    })
  })

  describe('isLatestNodeException', () => {
    it('should return false for null data', () => {
      expect(isLatestNodeException(null)).toBe(false)
    })

    it('should return false for empty nodes', () => {
      expect(isLatestNodeException({ nodes: [] })).toBe(false)
    })

    it('should return true when latest node is exception', () => {
      const data = {
        nodes: [
          { status: STATUS_TYPES.EXCEPTION },
          { status: STATUS_TYPES.IN_TRANSIT },
        ],
      }
      expect(isLatestNodeException(data)).toBe(true)
    })

    it('should return false when latest node is not exception', () => {
      const data = {
        nodes: [
          { status: STATUS_TYPES.SIGNED },
          { status: STATUS_TYPES.DELIVERING },
        ],
      }
      expect(isLatestNodeException(data)).toBe(false)
    })
  })

  describe('extractCityName', () => {
    it('should return null for null input', () => {
      expect(extractCityName(null)).toBeNull()
    })

    it('should return null for non-string input', () => {
      expect(extractCityName(123)).toBeNull()
    })

    it('should return null when no city found', () => {
      expect(extractCityName('某个不存在的地方')).toBeNull()
    })

    it('should extract city from location string', () => {
      expect(extractCityName('北京市朝阳区营业点')).toBe('北京')
      expect(extractCityName('上海市浦东新区网点')).toBe('上海')
      expect(extractCityName('广州转运中心')).toBe('广州')
      expect(extractCityName('深圳南山')).toBe('深圳')
    })
  })

  describe('extractRoutePoints', () => {
    it('should return empty array for null input', () => {
      expect(extractRoutePoints(null)).toEqual([])
    })

    it('should extract origin and destination points with correct types', () => {
      const data = {
        origin: '深圳',
        destination: '北京',
        nodes: [],
      }
      const points = extractRoutePoints(data)
      expect(points.length).toBe(2)
      expect(points[0].city).toBe('深圳')
      expect(points[0].type).toBe('origin')
      expect(points[1].city).toBe('北京')
      expect(points[1].type).toBe('destination')
    })

    it('should produce both origin and destination points when same city to avoid type override', () => {
      const data = {
        origin: '北京',
        destination: '北京',
        nodes: [],
      }
      const points = extractRoutePoints(data)
      expect(points.length).toBe(2)
      expect(points[0].city).toBe('北京')
      expect(points[0].type).toBe('origin')
      expect(points[1].city).toBe('北京')
      expect(points[1].type).toBe('destination')
    })

    it('should preserve both origin and destination types for same city even with nodes', () => {
      const data = {
        origin: '北京',
        destination: '北京',
        nodes: [
          { location: '北京市朝阳区营业点', time: '2026-06-08 15:30:00' },
        ],
      }
      const points = extractRoutePoints(data)
      const originPoint = points.find(p => p.type === 'origin')
      const destPoint = points.find(p => p.type === 'destination')
      expect(originPoint).not.toBeUndefined()
      expect(originPoint.city).toBe('北京')
      expect(destPoint).not.toBeUndefined()
      expect(destPoint.city).toBe('北京')
    })

    it('should extract intermediate cities from nodes', () => {
      const data = {
        origin: '深圳',
        destination: '北京',
        nodes: [
          { location: '北京市朝阳区营业点', time: '2026-06-08 15:30:00' },
          { location: '北京转运中心', time: '2026-06-08 06:00:00' },
          { location: '武汉转运中心', time: '2026-06-07 22:30:00' },
          { location: '深圳转运中心', time: '2026-06-07 14:20:00' },
          { location: '深圳市南山区营业点', time: '2026-06-07 10:05:00' },
        ].reverse(),
      }
      const points = extractRoutePoints(data)
      const cities = points.map(p => p.city)
      expect(cities).toContain('武汉')
    })

    it('should ensure destination keeps destination type even when city appears in nodes', () => {
      const data = {
        origin: '深圳',
        destination: '北京',
        nodes: [
          { location: '北京市朝阳区营业点', time: '2026-06-08 15:30:00' },
          { location: '北京转运中心', time: '2026-06-08 06:00:00' },
          { location: '深圳转运中心', time: '2026-06-07 14:20:00' },
        ].reverse(),
      }
      const points = extractRoutePoints(data)
      const destPoint = points.find(p => p.city === '北京')
      expect(destPoint).not.toBeUndefined()
      expect(destPoint.type).toBe('destination')
    })

    it('should place destination point at the end of the list', () => {
      const data = {
        origin: '深圳',
        destination: '北京',
        nodes: [
          { location: '武汉转运中心', time: '2026-06-07 22:30:00' },
        ],
      }
      const points = extractRoutePoints(data)
      expect(points.length).toBeGreaterThanOrEqual(2)
      expect(points[points.length - 1].city).toBe('北京')
      expect(points[points.length - 1].type).toBe('destination')
    })
  })

  describe('getCurrentPositionIndex', () => {
    it('should return 0 for empty points', () => {
      expect(getCurrentPositionIndex([], null)).toBe(0)
    })

    it('should return last index when signed', () => {
      const points = [{ x: 0 }, { x: 1 }, { x: 2 }]
      expect(getCurrentPositionIndex(points, { isSigned: true })).toBe(2)
    })

    it('should return second-to-last index when not signed', () => {
      const points = [{ x: 0 }, { x: 1 }, { x: 2 }]
      expect(getCurrentPositionIndex(points, { isSigned: false })).toBe(1)
    })

    it('should return 0 when only one point and not signed', () => {
      const points = [{ x: 0 }]
      expect(getCurrentPositionIndex(points, { isSigned: false })).toBe(0)
    })
  })

  describe('sortNodesDesc', () => {
    it('should return empty array for non-array input', () => {
      expect(sortNodesDesc(null)).toEqual([])
      expect(sortNodesDesc('not-array')).toEqual([])
    })

    it('should sort nodes by time descending', () => {
      const nodes = [
        { time: '2026-06-07 10:00:00', status: STATUS_TYPES.PICKED_UP },
        { time: '2026-06-08 15:30:00', status: STATUS_TYPES.SIGNED },
        { time: '2026-06-08 09:00:00', status: STATUS_TYPES.DELIVERING },
      ]
      const sorted = sortNodesDesc(nodes)
      expect(sorted[0].status).toBe(STATUS_TYPES.SIGNED)
      expect(sorted[1].status).toBe(STATUS_TYPES.DELIVERING)
      expect(sorted[2].status).toBe(STATUS_TYPES.PICKED_UP)
    })

    it('should not mutate original array', () => {
      const nodes = [
        { time: '2026-06-07 10:00:00' },
        { time: '2026-06-08 15:30:00' },
      ]
      const originalTimes = nodes.map(n => n.time)
      sortNodesDesc(nodes)
      expect(nodes.map(n => n.time)).toEqual(originalTimes)
    })
  })
})
