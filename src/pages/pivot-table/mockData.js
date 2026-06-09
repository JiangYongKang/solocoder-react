import { REGIONS, CATEGORIES, SALES_PEOPLE } from './constants.js'

const seededRandom = (seed) => {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const pickRandom = (arr, rng) => arr[Math.floor(rng() * arr.length)]

const randomInt = (min, max, rng) => Math.floor(rng() * (max - min + 1)) + min

const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const generateRandomDate = (rng) => {
  const start = new Date(2024, 0, 1)
  const end = new Date(2025, 5, 30)
  const startTs = start.getTime()
  const endTs = end.getTime()
  const ts = startTs + rng() * (endTs - startTs)
  return formatDate(new Date(ts))
}

export const generateMockData = (count = 500, seed = 42) => {
  const rng = seededRandom(seed)
  const data = []

  for (let i = 0; i < count; i++) {
    data.push({
      date: generateRandomDate(rng),
      region: pickRandom(REGIONS, rng),
      category: pickRandom(CATEGORIES, rng),
      salesPerson: pickRandom(SALES_PEOPLE, rng),
      salesAmount: randomInt(100, 10000, rng),
      quantity: randomInt(1, 50, rng),
    })
  }

  return data
}
