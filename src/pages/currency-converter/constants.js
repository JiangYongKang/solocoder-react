export const FAVORITES_STORAGE_KEY = 'currency_converter_favorites'

export const TIME_RANGES = [
  { label: '7天', days: 7 },
  { label: '30天', days: 30 },
  { label: '90天', days: 90 },
]

export const CURRENCIES = [
  { code: 'USD', name: '美元', nameEn: 'US Dollar', flag: '🇺🇸', country: '美国', countryEn: 'United States' },
  { code: 'EUR', name: '欧元', nameEn: 'Euro', flag: '🇪🇺', country: '欧盟', countryEn: 'European Union' },
  { code: 'GBP', name: '英镑', nameEn: 'British Pound', flag: '🇬🇧', country: '英国', countryEn: 'United Kingdom' },
  { code: 'JPY', name: '日元', nameEn: 'Japanese Yen', flag: '🇯🇵', country: '日本', countryEn: 'Japan' },
  { code: 'CNY', name: '人民币', nameEn: 'Chinese Yuan', flag: '🇨🇳', country: '中国', countryEn: 'China' },
  { code: 'AUD', name: '澳元', nameEn: 'Australian Dollar', flag: '🇦🇺', country: '澳大利亚', countryEn: 'Australia' },
  { code: 'CAD', name: '加元', nameEn: 'Canadian Dollar', flag: '🇨🇦', country: '加拿大', countryEn: 'Canada' },
  { code: 'CHF', name: '瑞士法郎', nameEn: 'Swiss Franc', flag: '🇨🇭', country: '瑞士', countryEn: 'Switzerland' },
  { code: 'HKD', name: '港币', nameEn: 'Hong Kong Dollar', flag: '🇭🇰', country: '中国香港', countryEn: 'Hong Kong' },
  { code: 'SGD', name: '新加坡元', nameEn: 'Singapore Dollar', flag: '🇸🇬', country: '新加坡', countryEn: 'Singapore' },
  { code: 'NZD', name: '新西兰元', nameEn: 'New Zealand Dollar', flag: '🇳🇿', country: '新西兰', countryEn: 'New Zealand' },
  { code: 'KRW', name: '韩元', nameEn: 'South Korean Won', flag: '🇰🇷', country: '韩国', countryEn: 'South Korea' },
  { code: 'INR', name: '印度卢比', nameEn: 'Indian Rupee', flag: '🇮🇳', country: '印度', countryEn: 'India' },
  { code: 'THB', name: '泰铢', nameEn: 'Thai Baht', flag: '🇹🇭', country: '泰国', countryEn: 'Thailand' },
  { code: 'RUB', name: '俄罗斯卢布', nameEn: 'Russian Ruble', flag: '🇷🇺', country: '俄罗斯', countryEn: 'Russia' },
]

export const BASE_RATES_USD = {
  USD: 1,
  EUR: 0.9215,
  GBP: 0.7893,
  JPY: 149.52,
  CNY: 7.2456,
  AUD: 1.5321,
  CAD: 1.3654,
  CHF: 0.8802,
  HKD: 7.8123,
  SGD: 1.3412,
  NZD: 1.6234,
  KRW: 1345.67,
  INR: 83.1245,
  THB: 35.6234,
  RUB: 92.4567,
}
