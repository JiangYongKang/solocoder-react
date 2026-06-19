import { getDueCardCountForDeck, getCardsByDeckId } from './flashcardUtils'

export default function DeckTabs({
  decks,
  cards,
  selectedDeckId,
  onSelectDeck,
  onAddDeck,
  onRenameDeck,
  onDeleteDeck,
}) {
  return (
    <div className="fc-deck-tabs">
      {decks.map(deck => {
        const deckCards = getCardsByDeckId(cards, deck.id)
        const dueCount = getDueCardCountForDeck(cards, deck.id)
        const isActive = deck.id === selectedDeckId

        return (
          <div
            key={deck.id}
            className={`fc-deck-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectDeck(deck.id)}
          >
            <span className="fc-deck-tab-name">{deck.name}</span>
            <span className="fc-deck-tab-counts">
              <span className="fc-deck-tab-count">{deckCards.length}</span>
              {dueCount > 0 && (
                <span className="fc-deck-tab-count" style={{ background: isActive ? 'rgba(255,255,255,0.25)' : '#ef4444', color: isActive ? '#fff' : '#fff' }}>
                  {dueCount}
                </span>
              )}
            </span>
            <div className="fc-deck-tab-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="fc-deck-tab-action"
                onClick={() => onRenameDeck(deck)}
                title="重命名"
              >
                ✎
              </button>
              <button
                className="fc-deck-tab-action"
                onClick={() => onDeleteDeck(deck)}
                title="删除"
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
      <button className="fc-add-deck-btn" onClick={onAddDeck}>
        + 新建牌组
      </button>
    </div>
  )
}
