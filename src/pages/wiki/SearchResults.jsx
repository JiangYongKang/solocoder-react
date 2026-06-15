import { searchAllPages, highlightTextSafe } from './wikiUtils.js'

export default function SearchResults({
  isOpen,
  onClose,
  data,
  searchQuery,
  onSelectResult,
}) {
  if (!isOpen) return null

  const results = searchAllPages(data, searchQuery)

  const handleSelect = (result) => {
    onSelectResult?.(result)
    onClose?.()
  }

  return (
    <div className="wiki-search-results-overlay" onClick={onClose}>
      <div
        className="wiki-search-results"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wiki-search-results-header">
          <span className="wiki-version-title">
            搜索结果 ({results.length})
          </span>
          <button className="wiki-icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="wiki-search-results-list">
          {results.length === 0 ? (
            <div className="wiki-search-empty">
              未找到与「{searchQuery}」相关的内容
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={`${result.pageId}-${index}`}
                className="wiki-search-result-item"
                onClick={() => handleSelect(result)}
              >
                <div
                  className="wiki-search-result-title"
                  dangerouslySetInnerHTML={{
                    __html: highlightTextSafe(result.title, searchQuery),
                  }}
                />
                <div className="wiki-search-result-space">
                  📁 {result.spaceName}
                </div>
                <div
                  className="wiki-search-result-snippet"
                  dangerouslySetInnerHTML={{
                    __html: highlightTextSafe(result.snippet, searchQuery),
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
