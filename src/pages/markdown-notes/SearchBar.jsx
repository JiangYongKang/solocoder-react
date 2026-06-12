import { useEffect, useRef, useState } from 'react'
import { highlightTextSafe } from './noteUtils.js'

export default function SearchBar({ value, onChange, onResultClick, results }) {
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleFocus() {
    if (value && value.trim()) {
      setShowResults(true)
    }
  }

  function handleChange(e) {
    const newValue = e.target.value
    onChange(newValue)
    setShowResults(newValue.trim().length > 0)
  }

  function handleResultClick(result) {
    onResultClick(result)
    setShowResults(false)
  }

  return (
    <div ref={containerRef} className="search-bar">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="搜索笔记标题和内容..."
      />
      {showResults && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">未找到匹配的笔记</div>
          ) : (
            results.map((result) => (
              <div
                key={result.id}
                className="search-result-item"
                onClick={() => handleResultClick(result)}
              >
                <div className="search-result-title">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightTextSafe(result.title, value),
                    }}
                  />
                </div>
                <div className="search-result-path">{result.path}</div>
                <div className="search-result-snippet">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightTextSafe(result.snippet, value),
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
