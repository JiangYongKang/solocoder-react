import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { WEATHER_THEMES, CITIES } from './constants.js'
import {
  searchCities,
  generateWeatherData,
  loadFavorites,
  saveFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  loadHistory,
  saveHistory,
  addToHistory,
  removeFromHistory,
  clearHistory,
  formatDateShort,
} from './weatherUtils.js'
import TemperatureChart from './TemperatureChart.jsx'

import './weather.css'

const WeatherPage = () => {
  const navigate = useNavigate()
  const wrapRef = useRef(null)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCity, setSelectedCity] = useState(CITIES[0])
  const [weatherData, setWeatherData] = useState(() => generateWeatherData(CITIES[0]))
  const [favorites, setFavorites] = useState(() => loadFavorites())
  const [history, setHistory] = useState(() => loadHistory())

  const suggestions = useMemo(() => searchCities(searchKeyword), [searchKeyword])

  const currentTheme = weatherData
    ? WEATHER_THEMES[weatherData.current.weatherType]
    : WEATHER_THEMES.sunny

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--weather-bg-from', currentTheme.from)
    root.style.setProperty('--weather-bg-via', currentTheme.via)
    root.style.setProperty('--weather-bg-to', currentTheme.to)
    root.style.setProperty('--weather-text', currentTheme.text)
    root.style.setProperty('--weather-card-bg', currentTheme.cardBg)
  }, [currentTheme])

  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  useEffect(() => {
    saveHistory(history)
  }, [history])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectCity = (city) => {
    setSelectedCity(city)
    setWeatherData(generateWeatherData(city))
    setSearchKeyword('')
    setShowSuggestions(false)
    setHistory((prev) => addToHistory(prev, city))
  }

  const toggleFavorite = () => {
    if (!selectedCity) return
    if (isFavorite(favorites, selectedCity.id)) {
      setFavorites((prev) => removeFavorite(prev, selectedCity.id))
    } else {
      setFavorites((prev) => addFavorite(prev, selectedCity))
    }
  }

  const removeFavoriteItem = (e, cityId) => {
    e.stopPropagation()
    setFavorites((prev) => removeFavorite(prev, cityId))
  }

  const removeHistoryItem = (e, cityId) => {
    e.stopPropagation()
    setHistory((prev) => removeFromHistory(prev, cityId))
  }

  const handleClearHistory = () => {
    setHistory(clearHistory())
  }

  const favorited = selectedCity ? isFavorite(favorites, selectedCity.id) : false

  return (
    <div className="weather-page">
      <div className="weather-container">
        <div className="weather-header">
          <button className="weather-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="weather-title">天气查询</h1>
        </div>

        <div className="weather-main">
          <aside className="weather-sidebar">
            <div className="weather-card">
              <div className="weather-card-title">
                <span>⭐ 收藏城市</span>
              </div>
              {favorites.length === 0 ? (
                <div className="weather-empty">暂无收藏城市</div>
              ) : (
                <div className="weather-fav-list">
                  {favorites.map((city) => (
                    <div
                      key={city.id}
                      className={`weather-fav-item ${selectedCity?.id === city.id ? 'active' : ''}`}
                      onClick={() => selectCity(city)}
                    >
                      <span className="weather-fav-name">{city.name}</span>
                      <span className="weather-fav-province">{city.province}</span>
                      <button
                        className="weather-remove-btn"
                        onClick={(e) => removeFavoriteItem(e, city.id)}
                        title="取消收藏"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="weather-card">
              <div className="weather-card-title">
                <span>🕘 搜索历史</span>
                {history.length > 0 && (
                  <button className="weather-clear-btn" onClick={handleClearHistory}>
                    清空
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="weather-empty">暂无搜索记录</div>
              ) : (
                <div className="weather-history-list">
                  {history.map((city) => (
                    <div
                      key={city.id}
                      className={`weather-history-item ${selectedCity?.id === city.id ? 'active' : ''}`}
                      onClick={() => selectCity(city)}
                    >
                      <span className="weather-history-name">{city.name}</span>
                      <span className="weather-history-province">{city.province}</span>
                      <button
                        className="weather-remove-btn"
                        onClick={(e) => removeHistoryItem(e, city.id)}
                        title="删除记录"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <main className="weather-content">
            <div className="weather-search-wrap" ref={wrapRef}>
              <input
                className="weather-search-input"
                type="text"
                placeholder="搜索城市名称或省份..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && searchKeyword.trim() && (
                <div className="weather-suggestions">
                  {suggestions.length === 0 ? (
                    <div className="weather-suggestion-empty">未找到匹配的城市</div>
                  ) : (
                    suggestions.map((city) => (
                      <div
                        key={city.id}
                        className="weather-suggestion-item"
                        onClick={() => selectCity(city)}
                      >
                        <span className="weather-suggestion-name">{city.name}</span>
                        <span className="weather-suggestion-province">{city.province}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {weatherData && (
              <>
                <div className="weather-card">
                  <div className="weather-current">
                    <div className="weather-current-info">
                      <div className="weather-city-row">
                        <h2 className="weather-city-name">{weatherData.city.name}</h2>
                        <button
                          className={`weather-fav-toggle ${favorited ? 'favorited' : ''}`}
                          onClick={toggleFavorite}
                        >
                          {favorited ? '★ 已收藏' : '☆ 收藏'}
                        </button>
                      </div>
                      <div className="weather-temp-row">
                        <span className="weather-icon-big">{weatherData.current.icon}</span>
                        <span>
                          <span className="weather-temp-big">{weatherData.current.temperature}</span>
                          <span className="weather-temp-unit">°C</span>
                        </span>
                      </div>
                      <div className="weather-desc">{weatherData.current.label}</div>
                      <div className="weather-update-time">
                        更新于 {new Date(weatherData.current.updateTime).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="weather-current-details">
                      <div className="weather-detail-item">
                        <div className="weather-detail-label">体感温度</div>
                        <div className="weather-detail-value">{weatherData.current.feelsLike}°C</div>
                      </div>
                      <div className="weather-detail-item">
                        <div className="weather-detail-label">湿度</div>
                        <div className="weather-detail-value">{weatherData.current.humidity}%</div>
                      </div>
                      <div className="weather-detail-item">
                        <div className="weather-detail-label">风速</div>
                        <div className="weather-detail-value">{weatherData.current.windSpeed} km/h</div>
                      </div>
                      <div className="weather-detail-item">
                        <div className="weather-detail-label">能见度</div>
                        <div className="weather-detail-value">{weatherData.current.visibility} km</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="weather-card">
                  <div className="weather-card-title">📅 一周预报</div>
                  <div className="weather-forecast-list">
                    {weatherData.forecast.map((day) => (
                      <div
                        key={day.date}
                        className={`weather-forecast-item ${day.isToday ? 'today' : ''}`}
                      >
                        <div className="weather-forecast-weekday">
                          {day.isToday ? '今天' : day.weekday}
                        </div>
                        <div className="weather-forecast-date">{formatDateShort(day.date)}</div>
                        <div className="weather-forecast-icon">{day.icon}</div>
                        <div>
                          <span className="weather-forecast-hi">{day.high}°C</span>
                          <span className="weather-forecast-lo">{day.low}°C</span>
                        </div>
                        <div className="weather-forecast-humidity">💧 {day.humidity}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="weather-card">
                  <div className="weather-card-title">📈 温度趋势</div>
                  <TemperatureChart forecast={weatherData.forecast} />
                  <div className="weather-chart-legend">
                    <div className="weather-legend-item">
                      <span className="weather-legend-dot high"></span>
                      最高温度
                    </div>
                    <div className="weather-legend-item">
                      <span className="weather-legend-dot low"></span>
                      最低温度
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default WeatherPage
