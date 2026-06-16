export const STORAGE_KEY_WATCHLIST = 'stock_dashboard_watchlist'
export const STORAGE_KEY_ALERTS = 'stock_dashboard_alerts'

export const DEFAULT_STOCKS = [
  { code: 'AAPL', name: '苹果公司' },
  { code: 'GOOGL', name: '谷歌' },
  { code: 'TSLA', name: '特斯拉' },
  { code: 'MSFT', name: '微软' },
  { code: 'AMZN', name: '亚马逊' },
  { code: 'META', name: 'Meta' },
  { code: 'NVDA', name: '英伟达' },
  { code: '000001', name: '平安银行' },
  { code: '600519', name: '贵州茅台' },
  { code: '000858', name: '五粮液' },
  { code: '601318', name: '中国平安' },
  { code: '000333', name: '美的集团' },
  { code: '600036', name: '招商银行' },
  { code: '002594', name: '比亚迪' },
  { code: '601899', name: '紫金矿业' },
  { code: '002415', name: '海康威视' },
  { code: '601398', name: '工商银行' },
  { code: '000002', name: '万科A' },
  { code: '600030', name: '中信证券' },
  { code: '000651', name: '格力电器' },
  { code: '601288', name: '农业银行' },
  { code: '002304', name: '洋河股份' },
  { code: '600900', name: '长江电力' },
  { code: '002475', name: '立讯精密' },
  { code: '601888', name: '中国中免' },
]

export const PRICE_MIN = 50
export const PRICE_MAX = 300
export const PRICE_FLUCTUATION_RATE = 0.02

export const KLINE_DAYS = 60
export const TIMESHARE_MINUTES = 390
export const TIMESHARE_UPDATE_INTERVAL = 10000
export const PRICE_UPDATE_INTERVAL = 1000

export const ALERT_TYPE_UPPER = 'upper'
export const ALERT_TYPE_LOWER = 'lower'

export const ALERT_STATUS_ENABLED = 'enabled'
export const ALERT_STATUS_TRIGGERED = 'triggered'
export const ALERT_STATUS_DISABLED = 'disabled'

export const CHART_TYPE_KLINE = 'kline'
export const CHART_TYPE_TIMESHARE = 'timeshare'

export const SORT_TYPE_CHANGE = 'change'
export const SORT_TYPE_AMOUNT = 'amount'
export const SORT_ORDER_ASC = 'asc'
export const SORT_ORDER_DESC = 'desc'
export const LIST_TYPE_ALL = 'all'
export const LIST_TYPE_GAINERS = 'gainers'
export const LIST_TYPE_LOSERS = 'losers'
