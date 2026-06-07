const isDateInRange = (dateStr, startDate, endDate) => {
  if (!dateStr || !startDate || !endDate) return false
  return dateStr >= startDate && dateStr <= endDate
}

const filterDataByDateRange = (data, startDate, endDate) => {
  if (!Array.isArray(data)) return []
  return data.filter((item) => isDateInRange(item.date, startDate, endDate))
}

const getPreviousPeriod = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1

  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - (days - 1))

  return {
    startDate: prevStart.toISOString().slice(0, 10),
    endDate: prevEnd.toISOString().slice(0, 10),
  }
}

const sumMetric = (data, metricKey) => {
  if (!Array.isArray(data) || data.length === 0) return 0
  return data.reduce((sum, item) => sum + (Number(item[metricKey]) || 0), 0)
}

const avgMetric = (data, metricKey) => {
  if (!Array.isArray(data) || data.length === 0) return 0
  return sumMetric(data, metricKey) / data.length
}

const calculateMetricValue = (data, metricKey) => {
  if (metricKey === 'conversionRate') {
    const totalOrders = sumMetric(data, 'orderCount')
    const totalUsers = sumMetric(data, 'userCount')
    return totalUsers > 0 ? +((totalOrders / totalUsers) * 100).toFixed(2) : 0
  }
  if (metricKey === 'totalSales' || metricKey === 'orderCount' || metricKey === 'userCount') {
    return sumMetric(data, metricKey)
  }
  return 0
}

const calculateTrend = (currentValue, previousValue) => {
  const curr = Number(currentValue)
  const prev = Number(previousValue)

  if (isNaN(curr) || isNaN(prev)) {
    return { direction: 'flat', percent: 0 }
  }

  if (prev === 0) {
    if (curr > 0) return { direction: 'up', percent: 100 }
    if (curr < 0) return { direction: 'down', percent: 100 }
    return { direction: 'flat', percent: 0 }
  }

  const diff = curr - prev
  const percentRaw = (diff / Math.abs(prev)) * 100
  const percent = +percentRaw.toFixed(2)

  if (percent > 0.01) return { direction: 'up', percent }
  if (percent < -0.01) return { direction: 'down', percent: Math.abs(percent) }
  return { direction: 'flat', percent: 0 }
}

const buildSummaryMetrics = (data, prevData, metricKeys) => {
  return metricKeys.map((key) => {
    const currentValue = calculateMetricValue(data, key)
    const previousValue = calculateMetricValue(prevData, key)
    const trend = calculateTrend(currentValue, previousValue)
    return { key, value: currentValue, previousValue, trend }
  })
}

const buildLineChartData = (data, metricKey = 'totalSales', selectedCategory = null) => {
  if (!Array.isArray(data)) return []
  return data.map((item) => {
    let value
    if (selectedCategory && item.byCategory) {
      const catData = item.byCategory[selectedCategory]
      if (catData) {
        if (metricKey === 'totalSales') value = catData.sales
        else if (metricKey === 'orderCount') value = catData.orders
        else if (metricKey === 'userCount') value = catData.users
        else if (metricKey === 'conversionRate') {
          value = catData.users > 0 ? +((catData.orders / catData.users) * 100).toFixed(2) : 0
        } else {
          value = 0
        }
      } else {
        value = 0
      }
    } else {
      value = item[metricKey] || 0
    }
    return {
      date: item.date,
      value,
    }
  })
}

const buildBarChartData = (data, categories, selectedCategory = null) => {
  if (!Array.isArray(data)) return []

  if (selectedCategory) {
    const subMetrics = [
      { key: 'sales', label: '销售额' },
      { key: 'orders', label: '订单数' },
      { key: 'users', label: '用户数' },
    ]
    return subMetrics.map((sm) => {
      const value = data.reduce((sum, item) => {
        if (item.byCategory && item.byCategory[selectedCategory]) {
          return sum + (item.byCategory[selectedCategory][sm.key] || 0)
        }
        return sum
      }, 0)
      return { category: sm.label, value, metric: sm.key }
    })
  }

  return categories.map((cat) => {
    const sales = data.reduce((sum, item) => {
      if (item.byCategory && item.byCategory[cat]) {
        return sum + (item.byCategory[cat].sales || 0)
      }
      return sum
    }, 0)
    return { category: cat, value: sales, metric: 'sales' }
  })
}

const buildPieChartData = (data, categories, selectedCategory = null) => {
  if (!Array.isArray(data)) return []

  if (selectedCategory) {
    const subMetrics = [
      { key: 'sales', label: '销售额' },
      { key: 'orders', label: '订单数' },
      { key: 'users', label: '用户数' },
    ]
    return subMetrics.map((sm) => {
      const value = data.reduce((sum, item) => {
        if (item.byCategory && item.byCategory[selectedCategory]) {
          return sum + (item.byCategory[selectedCategory][sm.key] || 0)
        }
        return sum
      }, 0)
      return { name: sm.label, value, metric: sm.key }
    })
  }

  return categories.map((cat) => {
    const sales = data.reduce((sum, item) => {
      if (item.byCategory && item.byCategory[cat]) {
        return sum + (item.byCategory[cat].sales || 0)
      }
      return sum
    }, 0)
    return { name: cat, value: sales, metric: 'sales' }
  })
}

const formatNumber = (num, format = 'number') => {
  if (num === null || num === undefined || isNaN(num)) return '0'
  if (format === 'currency') {
    if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿'
    if (num >= 10000) return (num / 10000).toFixed(2) + '万'
    return '¥' + num.toLocaleString('zh-CN')
  }
  if (format === 'percent') {
    return num.toFixed(2) + '%'
  }
  if (num >= 10000) return (num / 10000).toFixed(2) + '万'
  return num.toLocaleString('zh-CN')
}

const LAYOUT_STORAGE_KEY = 'dashboard_layout_v1'

const loadLayoutFromStorage = () => {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const saveLayoutToStorage = (layout) => {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout))
    return true
  } catch {
    return false
  }
}

const clearLayoutStorage = () => {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

const reorderLayout = (layout, fromIndex, toIndex) => {
  if (!Array.isArray(layout)) return []
  const result = [...layout]
  const [removed] = result.splice(fromIndex, 1)
  if (removed !== undefined) {
    result.splice(toIndex, 0, removed)
  }
  return result
}

const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false
  return startDate <= endDate
}

export {
  isDateInRange,
  filterDataByDateRange,
  getPreviousPeriod,
  sumMetric,
  avgMetric,
  calculateMetricValue,
  calculateTrend,
  buildSummaryMetrics,
  buildLineChartData,
  buildBarChartData,
  buildPieChartData,
  formatNumber,
  LAYOUT_STORAGE_KEY,
  loadLayoutFromStorage,
  saveLayoutToStorage,
  clearLayoutStorage,
  reorderLayout,
  validateDateRange,
}
