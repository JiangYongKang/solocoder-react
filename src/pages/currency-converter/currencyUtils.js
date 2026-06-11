import { CURRENCIES, BASE_RATES_USD, FAVORITES_STORAGE_KEY } from './constants.js'

export function seededRandom(seed) {
  let s = 0
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0
  }
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

export function getCurrencyByCode(code) {
  return CURRENCIES.find((c) => c.code === code) || null
}

export function getRate(baseCode, targetCode) {
  if (baseCode === targetCode) return 1
  const baseInUsd = BASE_RATES_USD[baseCode]
  const targetInUsd = BASE_RATES_USD[targetCode]
  if (!baseInUsd || !targetInUsd) return null
  return targetInUsd / baseInUsd
}

export function convertCurrency(amount, baseCode, targetCode) {
  const rate = getRate(baseCode, targetCode)
  if (rate === null) return null
  return round4(amount * rate)
}

export function round4(num) {
  return Math.round(num * 10000) / 10000
}

export function searchCurrencies(keyword) {
  if (!keyword || typeof keyword !== 'string') return []
  const lower = keyword.trim().toLowerCase()
  if (!lower) return []

  return CURRENCIES.map((c) => {
    let score = 0
    const codeLower = c.code.toLowerCase()
    const nameLower = c.name.toLowerCase()
    const nameEnLower = c.nameEn.toLowerCase()
    const countryLower = c.country.toLowerCase()
    const countryEnLower = c.countryEn.toLowerCase()

    if (codeLower === lower) score = 100
    else if (codeLower.startsWith(lower)) score = 90
    else if (codeLower.includes(lower)) score = 80
    else if (nameLower === lower) score = 70
    else if (nameLower.startsWith(lower)) score = 60
    else if (nameEnLower === lower) score = 55
    else if (nameEnLower.startsWith(lower)) score = 50
    else if (countryLower === lower) score = 45
    else if (countryLower.startsWith(lower)) score = 40
    else if (countryEnLower === lower) score = 35
    else if (countryEnLower.startsWith(lower)) score = 30
    else if (nameLower.includes(lower)) score = 20
    else if (nameEnLower.includes(lower)) score = 15
    else if (countryLower.includes(lower)) score = 10
    else if (countryEnLower.includes(lower)) score = 5

    return { ...c, score }
  })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function generateDailyChanges(baseCode) {
  const rand = seededRandom(baseCode + '-changes-' + new Date().toISOString().slice(0, 10))
  const result = {}
  CURRENCIES.forEach((c) => {
    if (c.code === baseCode) return
    result[c.code] = round4((rand() - 0.5) * 2)
  })
  return result
}

export function generateRateTable(baseCode) {
  const changes = generateDailyChanges(baseCode)
  return CURRENCIES.filter((c) => c.code !== baseCode).map((c) => {
    const rate = getRate(baseCode, c.code)
    const change = changes[c.code] || 0
    return {
      code: c.code,
      name: c.name,
      nameEn: c.nameEn,
      flag: c.flag,
      rate: rate !== null ? round4(rate) : null,
      change,
    }
  })
}

export function generateTrendData(baseCode, targetCode, days) {
  const rate = getRate(baseCode, targetCode)
  if (rate === null) return []

  const data = []
  const today = new Date()
  const rand = seededRandom(baseCode + '-' + targetCode + '-' + days)

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const volatility = rate * 0.005
    const fluctuation = (rand() - 0.5) * 2 * volatility
    const value = round4(rate + fluctuation * (days - i) / days)
    data.push({
      date: date.toISOString().slice(0, 10),
      value,
    })
  }

  return data
}

export function calculateTrendChartLayout(data, options = {}) {
  const {
    width = 700,
    height = 300,
    paddingTop = 30,
    paddingRight = 30,
    paddingBottom = 40,
    paddingLeft = 55,
  } = options

  if (!data || data.length === 0) {
    return { width, height, points: [], pathD: '', xTicks: [], yTicks: [], gridLines: [], hoverAreas: [] }
  }

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const values = data.map((d) => d.value)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const range = dataMax - dataMin || 1
  const scaleMin = dataMin - range * 0.1
  const scaleMax = dataMax + range * 0.1
  const scaleRange = scaleMax - scaleMin

  const yScale = (v) => paddingTop + chartHeight * (1 - (v - scaleMin) / scaleRange)
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0

  const points = data.map((d, i) => ({
    x: paddingLeft + i * xStep,
    y: yScale(d.value),
    value: d.value,
    date: d.date,
    index: i,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  const tickCount = 5
  const yTicks = []
  for (let i = 0; i <= tickCount; i++) {
    const v = scaleMin + (scaleRange * i) / tickCount
    yTicks.push({
      x: paddingLeft,
      y: yScale(v),
      value: round4(v),
      label: round4(v).toFixed(4),
    })
  }

  const gridLines = yTicks.map((t) => ({
    x1: paddingLeft,
    y1: t.y,
    x2: paddingLeft + chartWidth,
    y2: t.y,
  }))

  const xTickCount = Math.min(data.length, 7)
  const xTickStep = Math.max(1, Math.floor(data.length / xTickCount))
  const xTicks = []
  for (let i = 0; i < data.length; i += xTickStep) {
    const d = data[i]
    xTicks.push({
      x: paddingLeft + i * xStep,
      y: paddingTop + chartHeight,
      label: formatDateTick(d.date, data.length),
      date: d.date,
      index: i,
    })
  }
  if (data.length > 0 && xTicks[xTicks.length - 1].index !== data.length - 1) {
    const lastIdx = data.length - 1
    xTicks.push({
      x: paddingLeft + lastIdx * xStep,
      y: paddingTop + chartHeight,
      label: formatDateTick(data[lastIdx].date, data.length),
      date: data[lastIdx].date,
      index: lastIdx,
    })
  }

  const hoverAreas = points.map((p) => ({
    x: p.x - xStep / 2,
    y: paddingTop,
    width: xStep,
    height: chartHeight,
    point: p,
  }))

  return {
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    chartWidth,
    chartHeight,
    points,
    pathD,
    xTicks,
    yTicks,
    gridLines,
    hoverAreas,
    yScale,
    xScale: (i) => paddingLeft + i * xStep,
    scaleMin,
    scaleMax,
  }
}

function formatDateTick(dateStr, totalDays) {
  const d = new Date(dateStr)
  if (totalDays <= 7) {
    return `${d.getMonth() + 1}/${d.getDate()}`
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function loadFavorites(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && item.base && item.target)
  } catch {
    return []
  }
}

export function saveFavorites(favorites, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  } catch {
    // ignore
  }
}

export function addFavorite(favorites, base, target) {
  if (!base || !target) return favorites
  if (favorites.some((f) => f.base === base && f.target === target)) return favorites
  return [...favorites, { base, target }]
}

export function removeFavorite(favorites, base, target) {
  return favorites.filter((f) => !(f.base === base && f.target === target))
}

export function isFavorite(favorites, base, target) {
  return favorites.some((f) => f.base === base && f.target === target)
}

export function formatRate(rate) {
  if (rate === null || rate === undefined) return '--'
  if (Math.abs(rate) >= 100) return rate.toFixed(2)
  if (Math.abs(rate) >= 1) return rate.toFixed(4)
  return rate.toFixed(6)
}

export function formatChange(change) {
  const sign = change > 0 ? '+' : ''
  return sign + change.toFixed(2) + '%'
}
