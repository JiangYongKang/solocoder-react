import { useState, useMemo } from 'react'
import {
  getCardsByDeckId,
  sortCardsByCorrectRate,
  filterCardsByTags,
  getUniqueTags,
  getAccuracyColorForCard,
  calculateCorrectRate,
  truncateText,
} from './flashcardUtils'

export default function CardList({
  cards,
  deckId,
  onAddCard,
  onEditCard,
  onDeleteCard,
}) {
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedTags, setSelectedTags] = useState([])

  const deckCards = useMemo(() => getCardsByDeckId(cards, deckId), [cards, deckId])
  const allTags = useMemo(() => getUniqueTags(deckCards), [deckCards])

  const sortedCards = useMemo(() => {
    let result = deckCards
    if (selectedTags.length > 0) {
      result = filterCardsByTags(result, selectedTags)
    }
    return sortCardsByCorrectRate(result, sortOrder === 'asc')
  }, [deckCards, selectedTags, sortOrder])

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="fc-panel">
      <div className="fc-panel-header">
        <h3 className="fc-panel-title">卡片列表 ({sortedCards.length})</h3>
        <button className="fc-btn fc-btn-primary" onClick={onAddCard}>
          + 添加卡片
        </button>
      </div>

      {deckCards.length > 0 && (
        <div className="fc-filter-bar">
          <select
            className="fc-filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">答对率从高到低</option>
            <option value="asc">答对率从低到高</option>
          </select>

          {allTags.length > 0 && (
            <div className="fc-tag-filter">
              {allTags.map(tag => (
                <span
                  key={tag}
                  className={`fc-tag-filter-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {sortedCards.length > 0 ? (
        <div className="fc-card-list">
          {sortedCards.map(card => {
            const correctRate = calculateCorrectRate(card)
            const color = getAccuracyColorForCard(card)
            return (
              <div key={card.id} className="fc-card-item">
                <div className="fc-card-info">
                  <div className="fc-card-front">
                    <span
                      className="fc-card-accuracy-dot"
                      style={{ background: color }}
                      title={`答对率: ${Math.round(correctRate * 100)}%`}
                    />
                    {truncateText(card.front, 80)}
                  </div>
                  <div className="fc-card-meta">
                    <span>复习: {card.reviewCount}</span>
                    <span>答对: {card.correctCount}</span>
                    <span>答错: {card.wrongCount}</span>
                    {card.nextReview && <span>下次: {card.nextReview}</span>}
                  </div>
                  {card.tags && card.tags.length > 0 && (
                    <div className="fc-card-tags">
                      {card.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="fc-card-tag"
                          style={{ background: '#6b7280' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="fc-card-actions">
                  <button
                    className="fc-btn fc-btn-sm"
                    onClick={() => onEditCard(card)}
                  >
                    编辑
                  </button>
                  <button
                    className="fc-btn fc-btn-sm fc-btn-danger"
                    onClick={() => onDeleteCard(card)}
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="fc-empty">
          {deckCards.length === 0 ? '暂无卡片，点击「添加卡片」开始创建' : '没有符合筛选条件的卡片'}
        </div>
      )}
    </div>
  )
}
