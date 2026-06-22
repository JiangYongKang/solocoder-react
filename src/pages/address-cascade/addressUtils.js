import { ADDRESS_DATA, STORAGE_KEY, MAX_HISTORY } from './addressData.js'

export function getProvinces() {
  return Object.entries(ADDRESS_DATA)
    .filter(([, v]) => v && typeof v === 'object' && v.name)
    .map(([code, v]) => ({ code, name: v.name, lng: v.lng, lat: v.lat }))
}

export function getCities(provinceCode) {
  const province = ADDRESS_DATA[provinceCode]
  if (!province || !province.children) return []
  return Object.entries(province.children)
    .map(([code, v]) => ({ code, name: v.name, lng: v.lng, lat: v.lat }))
}

export function getDistricts(provinceCode, cityCode) {
  const province = ADDRESS_DATA[provinceCode]
  if (!province || !province.children) return []
  const city = province.children[cityCode]
  if (!city || !city.children) return []
  return Object.entries(city.children)
    .map(([code, v]) => ({ code, name: v.name, lng: v.lng, lat: v.lat }))
}

export function getStreets(provinceCode, cityCode, districtCode) {
  const province = ADDRESS_DATA[provinceCode]
  if (!province || !province.children) return []
  const city = province.children[cityCode]
  if (!city || !city.children) return []
  const district = city.children[districtCode]
  if (!district || !district.children) return []
  return Object.entries(district.children)
    .map(([code, v]) => ({ code, name: v.name }))
}

export function getAddressPath(provinceCode, cityCode, districtCode, streetCode) {
  const parts = []
  const province = ADDRESS_DATA[provinceCode]
  if (province) {
    parts.push(province.name)
    if (cityCode && province.children) {
      const city = province.children[cityCode]
      if (city) {
        parts.push(city.name)
        if (districtCode && city.children) {
          const district = city.children[districtCode]
          if (district) {
            parts.push(district.name)
            if (streetCode && district.children) {
              const street = district.children[streetCode]
              if (street) parts.push(street.name)
            }
          }
        }
      }
    }
  }
  return parts.join(' / ')
}

export function getDistrictCoordinate(provinceCode, cityCode, districtCode) {
  const province = ADDRESS_DATA[provinceCode]
  if (!province || !province.children) return null
  const city = province.children[cityCode]
  if (!city) return null
  if (districtCode && city.children) {
    const district = city.children[districtCode]
    if (district && district.lng != null && district.lat != null) {
      return { lng: district.lng, lat: district.lat }
    }
  }
  if (city.lng != null && city.lat != null) {
    return { lng: city.lng, lat: city.lat }
  }
  if (province.lng != null && province.lat != null) {
    return { lng: province.lng, lat: province.lat }
  }
  return null
}

export function fuzzyMatchAddresses(keyword) {
  if (!keyword || !keyword.trim()) return []
  const lower = keyword.trim().toLowerCase()
  const results = []

  Object.entries(ADDRESS_DATA).forEach(([provinceCode, province]) => {
    if (!province || !province.children) return
    const pName = province.name.toLowerCase()
    const pMatch = pName.includes(lower)

    Object.entries(province.children).forEach(([cityCode, city]) => {
      if (!city.children) return
      const cName = city.name.toLowerCase()
      const cMatch = cName.includes(lower)

      Object.entries(city.children).forEach(([districtCode, district]) => {
        const dName = district.name.toLowerCase()
        const dMatch = dName.includes(lower)

        if (district.children) {
          Object.entries(district.children).forEach(([streetCode, street]) => {
            const sName = street.name.toLowerCase()
            const sMatch = sName.includes(lower)

            if (pMatch || cMatch || dMatch || sMatch) {
              results.push({
                provinceCode,
                cityCode,
                districtCode,
                streetCode,
                label: `${province.name} / ${city.name} / ${district.name} / ${street.name}`,
                matchLevel: sMatch ? 'street' : dMatch ? 'district' : cMatch ? 'city' : 'province',
              })
            }
          })
        }
      })
    })
  })

  results.sort((a, b) => {
    const levelOrder = { street: 0, district: 1, city: 2, province: 3 }
    return levelOrder[a.matchLevel] - levelOrder[b.matchLevel]
  })

  return results.slice(0, 50)
}

export function loadHistory(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) => item && item.provinceCode && item.cityCode && item.districtCode
    ).slice(0, MAX_HISTORY)
  } catch {
    return []
  }
}

export function saveHistory(history, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {
    // ignore storage errors
  }
}

export function addToHistory(history, entry) {
  if (!entry || !entry.provinceCode || !entry.cityCode || !entry.districtCode) return history
  const filtered = history.filter(
    (h) =>
      !(
        h.provinceCode === entry.provinceCode &&
        h.cityCode === entry.cityCode &&
        h.districtCode === entry.districtCode &&
        h.streetCode === entry.streetCode
      )
  )
  const newEntry = { ...entry, timestamp: Date.now() }
  return [newEntry, ...filtered].slice(0, MAX_HISTORY)
}

export function removeFromHistory(history, entry) {
  return history.filter(
    (h) =>
      !(
        h.provinceCode === entry.provinceCode &&
        h.cityCode === entry.cityCode &&
        h.districtCode === entry.districtCode &&
        h.streetCode === entry.streetCode
      )
  )
}

export function lngLatToMapXY(lng, lat, width, height) {
  const minLng = 73
  const maxLng = 136
  const minLat = 3
  const maxLat = 54
  const x = ((lng - minLng) / (maxLng - minLng)) * width
  const y = ((maxLat - lat) / (maxLat - minLat)) * height
  return { x, y }
}

export const CHINA_OUTLINE = [
  [73.5, 39.4], [75, 40.2], [76, 40.6], [78, 41], [80, 42],
  [80.5, 44], [82, 45], [83, 47], [85, 47.5], [87, 48],
  [88, 48.5], [90, 46], [91, 46], [93, 45], [95, 44],
  [96, 43], [98, 42], [100, 42.5], [102, 42], [104, 42],
  [106, 42], [108, 42], [110, 43.5], [112, 44], [114, 44.5],
  [116, 43.5], [118, 42], [119.5, 42], [121, 42], [123, 44],
  [125, 44.5], [127, 48], [129, 48], [130, 47], [131, 47],
  [133, 48], [134.5, 48.5], [135, 49], [134, 49.5], [131, 48],
  [130, 49], [128, 49.5], [127, 50], [125, 51], [122, 53],
  [120, 52], [117, 50], [116, 49.5], [114, 48], [112, 47],
  [111, 46], [112, 45], [114, 44.5], [115, 44], [117, 43.5],
  [119, 42], [121, 41], [122, 40.5], [122.5, 40], [122, 39],
  [121, 38], [121.5, 37], [122.5, 37], [122, 36], [121, 35],
  [120, 34], [121, 32], [121.5, 31], [122, 30.5], [122, 29.5],
  [121, 28.5], [120, 27], [119.5, 26], [118.5, 25], [118, 24.5],
  [117, 23.5], [116, 23], [115, 22.5], [114, 22.5], [113, 22],
  [112, 21.5], [111, 21], [110.5, 20], [110, 18.5], [109, 18],
  [108.5, 19], [108, 21], [107, 21.5], [106, 22.5], [105, 22.5],
  [104, 22.5], [103, 22.5], [102, 22.5], [101, 22], [100, 21.5],
  [99, 22], [98, 23.5], [97, 24], [97.5, 25], [98, 26],
  [98.5, 28], [97.5, 28.5], [96, 28.5], [94, 29], [92, 28],
  [90, 28], [88, 27.5], [87, 28], [85, 28], [84, 28.5],
  [82, 29], [81, 30], [79, 31], [78, 32], [77, 33],
  [76, 34], [75, 35], [74, 36], [73.5, 37], [73.5, 39.4],
]
