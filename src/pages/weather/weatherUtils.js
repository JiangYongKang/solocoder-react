import {
  CITIES,
  FAVORITES_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ITEMS,
  WEATHER_TYPES,
  WEEKDAY_NAMES,
  WEATHER_ICONS,
  WEATHER_LABELS,
} from './constants.js'

export function searchCities(keyword) {
  if (!keyword || typeof keyword !== 'string') return []
  const lower = keyword.trim().toLowerCase()
  if (!lower) return []
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.province.toLowerCase().includes(lower)
  )
}

export function getCityById(id) {
  return CITIES.find((c) => c.id === id) || null
}

export function getCityByName(name) {
  return CITIES.find((c) => c.name === name) || null
}

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

function pickWeatherType(rand, month) {
  if (month <= 1 || month >= 11) {
    if (rand() < 0.3) return WEATHER_TYPES.SNOWY
    if (rand() < 0.4) return WEATHER_TYPES.RAINY
    if (rand() < 0.7) return WEATHER_TYPES.CLOUDY
    return WEATHER_TYPES.SUNNY
  }
  if (month >= 5 && month <= 8) {
    if (rand() < 0.4) return WEATHER_TYPES.RAINY
    if (rand() < 0.55) return WEATHER_TYPES.CLOUDY
    return WEATHER_TYPES.SUNNY
  }
  if (rand() < 0.25) return WEATHER_TYPES.RAINY
  if (rand() < 0.55) return WEATHER_TYPES.CLOUDY
  return WEATHER_TYPES.SUNNY
}

export function generateWeatherData(city) {
  if (!city) return null
  const today = new Date()
  const month = today.getMonth() + 1
  const rand = seededRandom(city.id + '-' + today.getFullYear() + '-' + month + '-' + today.getDate())

  const baseTemp =
    month <= 2 ? 2 : month <= 5 ? 15 : month <= 8 ? 28 : month <= 10 ? 18 : 5

  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const weatherType = pickWeatherType(rand, month)
    const variation = Math.floor(rand() * 10) - 5
    const high = baseTemp + variation + Math.floor(rand() * 6)
    const low = high - Math.floor(rand() * 8) - 3
    const humidity = Math.floor(rand() * 40) + 40
    days.push({
      date: date.toISOString().slice(0, 10),
      weekday: WEEKDAY_NAMES[date.getDay()],
      isToday: i === 0,
      weatherType,
      icon: WEATHER_ICONS[weatherType],
      label: WEATHER_LABELS[weatherType],
      high,
      low,
      humidity,
    })
  }

  const todayData = days[0]
  const currentTemp = todayData.low + Math.floor((todayData.high - todayData.low) * (today.getHours() / 24))
  const feelsLike = currentTemp + Math.floor(rand() * 5) - 2
  const windSpeed = Math.floor(rand() * 30) + 2
  const visibility = Math.floor(rand() * 20) + 5

  return {
    city,
    current: {
      temperature: currentTemp,
      feelsLike,
      humidity: todayData.humidity,
      windSpeed,
      visibility,
      weatherType: todayData.weatherType,
      icon: todayData.icon,
      label: todayData.label,
      updateTime: today.toISOString(),
    },
    forecast: days,
  }
}

export function loadFavorites(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((c) => c && c.id && c.name)
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

export function addFavorite(favorites, city) {
  if (!city || !city.id) return favorites
  if (favorites.some((c) => c.id === city.id)) return favorites
  return [...favorites, { id: city.id, name: city.name, province: city.province }]
}

export function removeFavorite(favorites, cityId) {
  return favorites.filter((c) => c.id !== cityId)
}

export function isFavorite(favorites, cityId) {
  return favorites.some((c) => c.id === cityId)
}

export function loadHistory(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((c) => c && c.id && c.name)
  } catch {
    return []
  }
}

export function saveHistory(history, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch {
    // ignore
  }
}

export function addToHistory(history, city) {
  if (!city || !city.id) return history
  const filtered = history.filter((c) => c.id !== city.id)
  const newHistory = [{ id: city.id, name: city.name, province: city.province }, ...filtered]
  return newHistory.slice(0, MAX_HISTORY_ITEMS)
}

export function removeFromHistory(history, cityId) {
  return history.filter((c) => c.id !== cityId)
}

export function clearHistory() {
  return []
}

export function formatWeekday(dateStr) {
  const date = new Date(dateStr)
  return WEEKDAY_NAMES[date.getDay()]
}

export function formatDateShort(dateStr) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function niceNumber(range, round) {
  const exponent = Math.floor(Math.log10(Math.abs(range) || 1))
  const fraction = range / Math.pow(10, exponent)
  let niceFraction
  if (round) {
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10
  } else {
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10
  }
  return niceFraction * Math.pow(10, exponent)
}

export function niceScale(min, max, tickCount = 5) {
  if (min === max) {
    const step = Math.max(Math.abs(min) * 0.1, 1)
    return { min: min - step, max: max + step, ticks: [min - step, min, min + step] }
  }
  const range = niceNumber(max - min, false)
  const step = niceNumber(range / (tickCount - 1), true)
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const ticks = []
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10)
  }
  return { min: niceMin, max: niceMax, step, ticks }
}

export function linearScale(domain, range) {
  const [domainMin, domainMax] = domain
  const [rangeMin, rangeMax] = range
  const domainRange = domainMax - domainMin
  if (domainRange === 0) return () => (rangeMin + rangeMax) / 2
  return (value) => {
    const normalized = (value - domainMin) / domainRange
    return rangeMin + normalized * (rangeMax - rangeMin)
  }
}

export function calculateTemperatureChartLayout(forecast, options = {}) {
  const {
    width = 600,
    height = 260,
    paddingTop = 30,
    paddingRight = 30,
    paddingBottom = 40,
    paddingLeft = 45,
  } = options

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const allTemps = forecast.reduce((acc, d) => [...acc, d.high, d.low], [])
  const dataMin = Math.min(...allTemps)
  const dataMax = Math.max(...allTemps)

  const { min: scaleMin, max: scaleMax, ticks: yTicks } = niceScale(dataMin, dataMax, 5)
  const yScale = linearScale([scaleMin, scaleMax], [chartHeight, 0])

  const xStep = forecast.length > 1 ? chartWidth / (forecast.length - 1) : 0

  const highPoints = forecast.map((d, i) => ({
    x: paddingLeft + i * xStep,
    y: paddingTop + yScale(d.high),
    value: d.high,
    data: d,
    index: i,
  }))

  const lowPoints = forecast.map((d, i) => ({
    x: paddingLeft + i * xStep,
    y: paddingTop + yScale(d.low),
    value: d.low,
    data: d,
    index: i,
  }))

  const pathFor = (points) =>
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ')

  const xTicks = forecast.map((d, i) => ({
    x: paddingLeft + i * xStep,
    y: paddingTop + chartHeight,
    label: d.isToday ? '今天' : d.weekday,
    date: d.date,
    index: i,
  }))

  const yTicksFormatted = yTicks.map((v) => ({
    x: paddingLeft,
    y: paddingTop + yScale(v),
    value: v,
    label: `${v}°C`,
  }))

  const gridLines = yTicks.map((v) => ({
    x1: paddingLeft,
    y1: paddingTop + yScale(v),
    x2: paddingLeft + chartWidth,
    y2: paddingTop + yScale(v),
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
    highPoints,
    lowPoints,
    highPathD: pathFor(highPoints),
    lowPathD: pathFor(lowPoints),
    xTicks,
    yTicks: yTicksFormatted,
    gridLines,
    yScale,
    xScale: (i) => paddingLeft + i * xStep,
  }
}
