import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getProvinces,
  getCities,
  getDistricts,
  getStreets,
  getAddressPath,
  getDistrictCoordinate,
  fuzzyMatchAddresses,
  loadHistory,
  saveHistory,
  addToHistory,
  removeFromHistory,
  lngLatToMapXY,
  CHINA_OUTLINE,
} from './addressUtils.js'
import { HOT_CITIES } from './addressData.js'
import './address-cascade.css'

function ChinaMap({ coordinate }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const w = container.clientWidth
    const h = Math.round(w * 0.65)
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    ctx.beginPath()
    CHINA_OUTLINE.forEach(([lng, lat], i) => {
      const { x, y } = lngLatToMapXY(lng, lat, w, h)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = 'rgba(170, 59, 255, 0.08)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(170, 59, 255, 0.35)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    if (coordinate) {
      const { x, y } = lngLatToMapXY(coordinate.lng, coordinate.lat, w, h)

      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(170, 59, 255, 0.18)'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(170, 59, 255, 0.4)'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#aa3bff'
      ctx.fill()
    }
  }, [coordinate])

  return (
    <div className="ac-map-container" ref={containerRef}>
      <canvas className="ac-map-canvas" ref={canvasRef} />
      <div className="ac-map-label">简版中国地图</div>
    </div>
  )
}

export default function AddressCascadePage() {
  const navigate = useNavigate()

  const [provinceCode, setProvinceCode] = useState('')
  const [cityCode, setCityCode] = useState('')
  const [districtCode, setDistrictCode] = useState('')
  const [streetCode, setStreetCode] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const [history, setHistory] = useState(() => loadHistory())

  const searchRef = useRef(null)

  const provinces = useMemo(() => getProvinces(), [])
  const cities = useMemo(() => getCities(provinceCode), [provinceCode])
  const districts = useMemo(() => getDistricts(provinceCode, cityCode), [provinceCode, cityCode])
  const streets = useMemo(() => getStreets(provinceCode, cityCode, districtCode), [provinceCode, cityCode, districtCode])

  const addressPath = useMemo(
    () => getAddressPath(provinceCode, cityCode, districtCode, streetCode),
    [provinceCode, cityCode, districtCode, streetCode]
  )

  const coordinate = useMemo(
    () => getDistrictCoordinate(provinceCode, cityCode, districtCode),
    [provinceCode, cityCode, districtCode]
  )

  useEffect(() => {
    saveHistory(history)
  }, [history])

  const searchResults = useMemo(() => {
    if (!searchKeyword.trim()) return []
    return fuzzyMatchAddresses(searchKeyword)
  }, [searchKeyword])

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleProvinceChange = useCallback((e) => {
    setProvinceCode(e.target.value)
    setCityCode('')
    setDistrictCode('')
    setStreetCode('')
  }, [])

  const handleCityChange = useCallback((e) => {
    setCityCode(e.target.value)
    setDistrictCode('')
    setStreetCode('')
  }, [])

  const handleDistrictChange = useCallback((e) => {
    setDistrictCode(e.target.value)
    setStreetCode('')
  }, [])

  const handleStreetChange = useCallback((e) => {
    setStreetCode(e.target.value)
  }, [])

  const commitSelection = useCallback((pCode, cCode, dCode, sCode) => {
    setProvinceCode(pCode)
    setCityCode(cCode)
    setDistrictCode(dCode)
    setStreetCode(sCode || '')

    const path = getAddressPath(pCode, cCode, dCode, sCode)
    if (path) {
      setHistory((prev) =>
        addToHistory(prev, {
          provinceCode: pCode,
          cityCode: cCode,
          districtCode: dCode,
          streetCode: sCode || '',
          label: path,
        })
      )
    }
  }, [])

  const handleSearchSelect = useCallback((item) => {
    commitSelection(item.provinceCode, item.cityCode, item.districtCode, item.streetCode || '')
    setSearchKeyword('')
    setShowSearch(false)
  }, [commitSelection])

  const handleHotCity = useCallback((city) => {
    const defaultStreets = getStreets(city.provinceCode, city.cityCode, city.districtCode)
    const streetCode = defaultStreets.length > 0 ? defaultStreets[0].code : ''
    commitSelection(city.provinceCode, city.cityCode, city.districtCode, streetCode)
  }, [commitSelection])

  const handleHistoryClick = useCallback((item) => {
    setProvinceCode(item.provinceCode)
    setCityCode(item.cityCode)
    setDistrictCode(item.districtCode)
    setStreetCode(item.streetCode || '')
  }, [])

  const handleHistoryDelete = useCallback((item) => {
    setHistory((prev) => removeFromHistory(prev, item))
  }, [])

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return (
    <div className="ac-page">
      <div className="ac-header">
        <button className="ac-back-link" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="ac-title">地址级联选择器</h1>
      </div>

      <div className="ac-body">
        <div className="ac-left">
          <div className="ac-search-box" ref={searchRef}>
            <div className="ac-search-wrap">
              <input
                className="ac-search-input"
                type="text"
                placeholder="搜索地址关键词（如「朝阳」）"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onFocus={() => searchKeyword.trim() && setShowSearch(true)}
              />
              {showSearch && searchResults.length > 0 && (
                <div className="ac-search-results">
                  {searchResults.map((item, i) => (
                    <div
                      key={i}
                      className="ac-search-item"
                      onClick={() => handleSearchSelect(item)}
                    >
                      <div className="ac-search-item-label">{item.label.split(' / ').pop()}</div>
                      <div className="ac-search-item-path">{item.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {showSearch && searchKeyword.trim() && searchResults.length === 0 && (
                <div className="ac-search-results">
                  <div className="ac-empty">无匹配结果</div>
                </div>
              )}
            </div>
          </div>

          <div className="ac-cascade">
            <div>
              <div className="ac-cascade-label">省份</div>
              <select
                className="ac-cascade-select"
                value={provinceCode}
                onChange={handleProvinceChange}
              >
                <option value="">请选择省份</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="ac-cascade-label">城市</div>
              <select
                className="ac-cascade-select"
                value={cityCode}
                onChange={handleCityChange}
                disabled={!provinceCode}
              >
                <option value="">请选择城市</option>
                {cities.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="ac-cascade-label">区县</div>
              <select
                className="ac-cascade-select"
                value={districtCode}
                onChange={handleDistrictChange}
                disabled={!cityCode}
              >
                <option value="">请选择区县</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="ac-cascade-label">街道</div>
              <select
                className="ac-cascade-select"
                value={streetCode}
                onChange={handleStreetChange}
                disabled={!districtCode}
              >
                <option value="">请选择街道</option>
                {streets.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ac-hot-cities">
            <h3 className="ac-section-title">热门城市</h3>
            <div className="ac-hot-grid">
              {HOT_CITIES.map((city) => (
                <span
                  key={city.name}
                  className="ac-hot-tag"
                  onClick={() => handleHotCity(city)}
                >
                  {city.name}
                </span>
              ))}
            </div>
          </div>

          <div className="ac-history">
            <h3 className="ac-section-title">最近使用</h3>
            {history.length === 0 ? (
              <div className="ac-empty">暂无历史记录</div>
            ) : (
              <div className="ac-history-list">
                {history.map((item, i) => (
                  <div
                    key={`${item.provinceCode}-${item.cityCode}-${item.districtCode}-${item.streetCode}-${i}`}
                    className="ac-history-item"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <span className="ac-history-item-text">{item.label}</span>
                    <span className="ac-history-item-time">{formatTime(item.timestamp)}</span>
                    <span
                      className="ac-history-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleHistoryDelete(item)
                      }}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ac-main">
          {addressPath && (
            <div className="ac-result-card">
              <div className="ac-result-label">已选地址</div>
              <div className="ac-result-value">{addressPath}</div>
            </div>
          )}

          <ChinaMap coordinate={districtCode ? coordinate : null} />
        </div>
      </div>
    </div>
  )
}
