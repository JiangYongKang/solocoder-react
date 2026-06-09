import { STORAGE_KEY, MAX_HISTORY, STATUS_TYPES, CITY_COORDINATES } from './constants.js'
import { getMockDataByCompany, getExceptionReason } from './mockData.js'

export function loadQueryHistory(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(item => item && typeof item.trackingNo === 'string' && typeof item.companyId === 'string')
  } catch {
    return []
  }
}

export function saveQueryHistory(history, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    const trimmed = Array.isArray(history) ? history.slice(0, MAX_HISTORY) : []
    storage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    void e
  }
}

export function addQueryRecord(trackingNo, companyId, companyName, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!trackingNo || !companyId) return null
  const trimmedNo = String(trackingNo).trim()
  if (!trimmedNo) return null

  const history = loadQueryHistory(storage)
  const filtered = history.filter(item => !(item.trackingNo === trimmedNo && item.companyId === companyId))
  const newRecord = {
    trackingNo: trimmedNo,
    companyId,
    companyName: companyName || '',
    queryTime: Date.now(),
  }
  const newHistory = [newRecord, ...filtered]
  saveQueryHistory(newHistory, storage)
  return newRecord
}

export function clearQueryHistory(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEY)
  } catch (e) {
    void e
  }
}

function mapSfOpcode(opcode, remark) {
  switch (opcode) {
    case '10': return STATUS_TYPES.PICKED_UP
    case '30': return STATUS_TYPES.IN_TRANSIT
    case '40': return STATUS_TYPES.ARRIVED
    case '70': return STATUS_TYPES.DELIVERING
    case '80': return STATUS_TYPES.SIGNED
    case '99': return STATUS_TYPES.EXCEPTION
    default:
      if (remark && remark.includes('异常')) return STATUS_TYPES.EXCEPTION
      return STATUS_TYPES.IN_TRANSIT
  }
}

function mapYtStatus(status) {
  switch (status) {
    case '揽收': return STATUS_TYPES.PICKED_UP
    case '发出':
    case '运输中': return STATUS_TYPES.IN_TRANSIT
    case '到达': return STATUS_TYPES.ARRIVED
    case '派送中': return STATUS_TYPES.DELIVERING
    case '已签收': return STATUS_TYPES.SIGNED
    default: return STATUS_TYPES.IN_TRANSIT
  }
}

function mapZtScanType(scanType) {
  switch (scanType) {
    case '已揽收': return STATUS_TYPES.PICKED_UP
    case '发出': return STATUS_TYPES.IN_TRANSIT
    case '到达': return STATUS_TYPES.ARRIVED
    case '派送中': return STATUS_TYPES.DELIVERING
    case '已签收': return STATUS_TYPES.SIGNED
    default: return STATUS_TYPES.IN_TRANSIT
  }
}

function mapYdState(state) {
  switch (state) {
    case '揽收': return STATUS_TYPES.PICKED_UP
    case '运输中': return STATUS_TYPES.IN_TRANSIT
    case '到达': return STATUS_TYPES.ARRIVED
    case '派送中': return STATUS_TYPES.DELIVERING
    case '签收': return STATUS_TYPES.SIGNED
    default: return STATUS_TYPES.IN_TRANSIT
  }
}

function mapJdStatusCode(code) {
  switch (code) {
    case 10: return STATUS_TYPES.PICKED_UP
    case 20: return STATUS_TYPES.IN_TRANSIT
    case 30: return STATUS_TYPES.ARRIVED
    case 40: return STATUS_TYPES.DELIVERING
    case 50: return STATUS_TYPES.SIGNED
    default: return STATUS_TYPES.IN_TRANSIT
  }
}

function mapEmsType(type) {
  switch (type) {
    case 'pickup': return STATUS_TYPES.PICKED_UP
    case 'departure': return STATUS_TYPES.IN_TRANSIT
    case 'arrival': return STATUS_TYPES.ARRIVED
    case 'delivering': return STATUS_TYPES.DELIVERING
    case 'delivered': return STATUS_TYPES.SIGNED
    case 'exception': return STATUS_TYPES.EXCEPTION
    default: return STATUS_TYPES.IN_TRANSIT
  }
}

export function parseSfOrder(order) {
  if (!order || !order.routes) return null
  const nodes = order.routes.map((route, index) => {
    const status = mapSfOpcode(route.opcode, route.remark)
    const isException = status === STATUS_TYPES.EXCEPTION
    const isLatest = index === 0
    return {
      time: route.acceptTime,
      location: route.acceptAddress,
      description: route.remark,
      status,
      isException,
      exceptionReason: isException ? getExceptionReason(order.exceptionCode) : null,
      isLatest,
    }
  })
  return {
    trackingNo: order.trackingNo,
    company: 'sf',
    isSigned: !!order.isSigned,
    signer: order.signer || null,
    signTime: order.signTime || null,
    origin: order.origin,
    destination: order.destination,
    hasException: !!order.hasException,
    nodes,
  }
}

export function parseYtOrder(order) {
  if (!order || !order.data) return null
  const nodes = order.data.map((item, index) => {
    const status = mapYtStatus(item.status)
    const isException = status === STATUS_TYPES.EXCEPTION
    const isLatest = index === 0
    return {
      time: item.time,
      location: item.location,
      description: item.details,
      status,
      isException,
      exceptionReason: null,
      isLatest,
    }
  })
  return {
    trackingNo: order.number,
    company: 'yt',
    isSigned: order.statusCode === 'SIGNED',
    signer: null,
    signTime: null,
    origin: order.senderCity,
    destination: order.receiverCity,
    hasException: false,
    nodes,
  }
}

export function parseZtOrder(order) {
  if (!order || !order.traces) return null
  const nodes = order.traces.map((trace, index) => {
    const status = mapZtScanType(trace.scanType)
    const isException = status === STATUS_TYPES.EXCEPTION
    const isLatest = index === 0
    return {
      time: trace.scanDate,
      location: trace.scanLocation,
      description: trace.desc,
      status,
      isException,
      exceptionReason: null,
      isLatest,
    }
  })
  return {
    trackingNo: order.billCode,
    company: 'zt',
    isSigned: !!order.signed,
    signer: order.signedName || null,
    signTime: null,
    origin: order.from,
    destination: order.to,
    hasException: false,
    nodes,
  }
}

export function parseYdOrder(order) {
  if (!order || !order.result) return null
  const nodes = order.result.map((item, index) => {
    const status = mapYdState(item.state)
    const isException = status === STATUS_TYPES.EXCEPTION
    const isLatest = index === 0
    return {
      time: item.time,
      location: item.location,
      description: item.context,
      status,
      isException,
      exceptionReason: null,
      isLatest,
    }
  })
  return {
    trackingNo: order.mailNo,
    company: 'yd',
    isSigned: order.signStatus === '1',
    signer: null,
    signTime: null,
    origin: order.originationName,
    destination: order.destinationName,
    hasException: false,
    nodes,
  }
}

export function parseJdOrder(order) {
  if (!order || !order.detailList) return null
  const nodes = order.detailList.map((item, index) => {
    const status = mapJdStatusCode(item.statusCode)
    const isException = status === STATUS_TYPES.EXCEPTION
    const isLatest = index === 0
    return {
      time: item.operatorTime,
      location: item.operatorContact,
      description: item.content,
      status,
      isException,
      exceptionReason: null,
      isLatest,
    }
  })
  return {
    trackingNo: order.waybillCode,
    company: 'jd',
    isSigned: !!order.finished,
    signer: null,
    signTime: null,
    origin: order.startProvince,
    destination: order.endProvince,
    hasException: false,
    nodes,
  }
}

export function parseEmsOrder(order) {
  if (!order || !order.steps) return null
  const hasException = order.deliveryStatus === 'exception'
  const nodes = order.steps.map((step, index) => {
    const status = mapEmsType(step.type)
    const isException = status === STATUS_TYPES.EXCEPTION
    const isLatest = index === 0
    return {
      time: step.occurTime,
      location: step.city,
      description: step.description,
      status,
      isException,
      exceptionReason: isException ? getExceptionReason(order.exceptionType) : null,
      isLatest,
    }
  })
  return {
    trackingNo: order.trackingNumber,
    company: 'ems',
    isSigned: order.deliveryStatus === 'delivered',
    signer: null,
    signTime: null,
    origin: order.originCity,
    destination: order.destCity,
    hasException,
    nodes,
  }
}

export function parseLogisticsData(companyId, rawOrder) {
  if (!companyId || !rawOrder) return null
  switch (companyId) {
    case 'sf': return parseSfOrder(rawOrder)
    case 'yt': return parseYtOrder(rawOrder)
    case 'zt': return parseZtOrder(rawOrder)
    case 'yd': return parseYdOrder(rawOrder)
    case 'jd': return parseJdOrder(rawOrder)
    case 'ems': return parseEmsOrder(rawOrder)
    default: return null
  }
}

export function queryLogistics(trackingNo, companyId) {
  const trimmedNo = String(trackingNo || '').trim()
  if (!trimmedNo || !companyId) {
    return { success: false, error: '请输入快递单号并选择快递公司' }
  }

  const companyData = getMockDataByCompany(companyId)
  if (!companyData) {
    return { success: false, error: '不支持的快递公司' }
  }

  let rawOrder = null
  const orders = companyData.orders
  for (const key in orders) {
    if (Object.prototype.hasOwnProperty.call(orders, key)) {
      if (key === trimmedNo) {
        rawOrder = orders[key]
        break
      }
    }
  }

  if (!rawOrder) {
    return { success: false, error: '暂无物流信息' }
  }

  const parsed = parseLogisticsData(companyId, rawOrder)
  if (!parsed) {
    return { success: false, error: '暂无物流信息' }
  }

  return { success: true, data: parsed }
}

export function isLatestNodeException(parsedData) {
  if (!parsedData || !parsedData.nodes || parsedData.nodes.length === 0) return false
  return parsedData.nodes[0].status === STATUS_TYPES.EXCEPTION
}

export function extractRoutePoints(parsedData) {
  if (!parsedData) return []
  const points = []
  const added = new Set()

  if (parsedData.origin) {
    const coord = CITY_COORDINATES[parsedData.origin]
    if (coord && !added.has(parsedData.origin)) {
      points.push({ city: parsedData.origin, x: coord.x, y: coord.y, type: 'origin' })
      added.add(parsedData.origin)
    }
  }

  const routeCities = []
  if (parsedData.nodes && parsedData.nodes.length > 0) {
    for (let i = parsedData.nodes.length - 1; i >= 0; i--) {
      const node = parsedData.nodes[i]
      const city = extractCityName(node.location)
      if (city && !added.has(city)) {
        const coord = CITY_COORDINATES[city]
        if (coord) {
          routeCities.push({ city, x: coord.x, y: coord.y, type: 'route' })
          added.add(city)
        }
      }
    }
  }

  if (parsedData.destination) {
    const coord = CITY_COORDINATES[parsedData.destination]
    if (coord && !added.has(parsedData.destination)) {
      routeCities.push({ city: parsedData.destination, x: coord.x, y: coord.y, type: 'destination' })
      added.add(parsedData.destination)
    }
  }

  return [...points, ...routeCities]
}

export function extractCityName(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return null
  const trimmed = locationStr.trim()
  for (const city of Object.keys(CITY_COORDINATES)) {
    if (trimmed.includes(city)) {
      return city
    }
  }
  return null
}

export function getCurrentPositionIndex(points, parsedData) {
  if (!points || points.length === 0) return 0
  if (!parsedData || !parsedData.isSigned) {
    return Math.max(0, points.length - 2)
  }
  return points.length - 1
}

export function sortNodesDesc(nodes) {
  if (!Array.isArray(nodes)) return []
  return [...nodes].sort((a, b) => {
    const timeA = new Date(a.time).getTime()
    const timeB = new Date(b.time).getTime()
    return timeB - timeA
  })
}
