const CATEGORIES = ['电子产品', '服装', '食品', '家居', '图书']

const METRIC_KEYS = ['totalSales', 'orderCount', 'userCount', 'conversionRate']

const METRIC_CONFIG = {
  totalSales: { label: '总销售额', unit: '¥', format: 'currency' },
  orderCount: { label: '订单数', unit: '单', format: 'number' },
  userCount: { label: '活跃用户', unit: '人', format: 'number' },
  conversionRate: { label: '转化率', unit: '%', format: 'percent' },
}

const DEFAULT_LAYOUT = [
  { id: 'card-totalSales', type: 'summaryCard', metric: 'totalSales' },
  { id: 'card-orderCount', type: 'summaryCard', metric: 'orderCount' },
  { id: 'card-userCount', type: 'summaryCard', metric: 'userCount' },
  { id: 'card-conversionRate', type: 'summaryCard', metric: 'conversionRate' },
  { id: 'chart-line', type: 'chart', chartType: 'line' },
  { id: 'chart-bar', type: 'chart', chartType: 'bar' },
  { id: 'chart-pie', type: 'chart', chartType: 'pie' },
]

const generateDailyData = (startDate, days) => {
  const data = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().slice(0, 10)

    const byCategory = {}
    CATEGORIES.forEach((cat) => {
      const baseVal = {
        电子产品: 28000,
        服装: 18000,
        食品: 12000,
        家居: 9000,
        图书: 4000,
      }[cat]
      const randomFactor = 0.7 + Math.random() * 0.6
      const weeklyFactor = (i % 7 === 5 || i % 7 === 6) ? 1.3 : 1
      const sales = Math.round(baseVal * randomFactor * weeklyFactor)
      const orders = Math.round(sales / (80 + Math.random() * 120))
      const users = Math.round(orders * (2.5 + Math.random() * 2))
      byCategory[cat] = { sales, orders, users }
    })

    const totalSales = Object.values(byCategory).reduce((s, v) => s + v.sales, 0)
    const totalOrders = Object.values(byCategory).reduce((s, v) => s + v.orders, 0)
    const totalUsers = Object.values(byCategory).reduce((s, v) => s + v.users, 0)
    const conversionRate = totalUsers > 0 ? +((totalOrders / totalUsers) * 100).toFixed(2) : 0

    data.push({
      date: dateStr,
      totalSales,
      orderCount: totalOrders,
      userCount: totalUsers,
      conversionRate,
      byCategory,
    })
  }
  return data
}

const today = new Date()
today.setHours(0, 0, 0, 0)
const dataStartDate = new Date(today)
dataStartDate.setDate(dataStartDate.getDate() - 89)

const DAILY_DATA = generateDailyData(dataStartDate.toISOString().slice(0, 10), 90)

const getDefaultDateRange = () => {
  const end = new Date(today)
  end.setDate(end.getDate() - 1)
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

export {
  CATEGORIES,
  METRIC_KEYS,
  METRIC_CONFIG,
  DEFAULT_LAYOUT,
  DAILY_DATA,
  getDefaultDateRange,
}
