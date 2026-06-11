import { useState, useEffect, useRef, useMemo } from 'react'
import { searchCurrencies } from './currencyUtils.js'

const CurrencySelector = ({ value, onChange, label }) => {
  const [keyword, setKeyword] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const filtered = useMemo(() => searchCurrencies(keyword), [keyword])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (currency) => {
    onChange(currency.code)
    setKeyword('')
    setShowDropdown(false)
  }

  const handleInputChange = (e) => {
    setKeyword(e.target.value)
    setShowDropdown(true)
  }

  const handleFocus = () => {
    setKeyword('')
    setShowDropdown(true)
    if (inputRef.current) {
      inputRef.current.select()
    }
  }

  const displayCurrency = value ? (() => {
    const found = searchCurrencies(value).find((c) => c.code === value) ||
      { code: value, flag: '🏳️', name: value, nameEn: '' }
    return found
  })() : null

  return (
    <div className="cc-selector" ref={wrapRef}>
      <div className="cc-selector-label">{label}</div>
      <div
        className="cc-selector-trigger"
        onClick={() => {
          setShowDropdown(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
      >
        <span className="cc-selector-flag">{displayCurrency?.flag}</span>
        <div className="cc-selector-info">
          <span className="cc-selector-code">{value}</span>
          <span className="cc-selector-name">{displayCurrency?.name}</span>
        </div>
        <span className="cc-selector-arrow">▾</span>
      </div>
      {showDropdown && (
        <div className="cc-selector-dropdown">
          <input
            ref={inputRef}
            className="cc-selector-search"
            type="text"
            placeholder="搜索货币代码或国家..."
            value={keyword}
            onChange={handleInputChange}
            onFocus={handleFocus}
            autoFocus
          />
          <div className="cc-selector-list">
            {(keyword.trim() ? filtered : searchCurrencies('')).length === 0 ? (
              <div className="cc-selector-empty">未找到匹配货币</div>
            ) : (
              (keyword.trim() ? filtered : searchCurrencies('')).map((c) => (
                <div
                  key={c.code}
                  className={`cc-selector-item ${c.code === value ? 'active' : ''}`}
                  onClick={() => handleSelect(c)}
                >
                  <span className="cc-selector-item-flag">{c.flag}</span>
                  <span className="cc-selector-item-code">{c.code}</span>
                  <span className="cc-selector-item-name">{c.name}</span>
                  <span className="cc-selector-item-name-en">{c.nameEn}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CurrencySelector
