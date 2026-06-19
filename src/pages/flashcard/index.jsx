import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './flashcard.css'

import DeckTabs from './DeckTabs'
import CardList from './CardList'
import StudyMode from './StudyMode'
import StatsPanel from './StatsPanel'
import CardEditModal from './CardEditModal'

import {
  loadDecks,
  saveDecks,
  loadCards,
  saveCards,
  loadStats,
  saveStats,
  loadSettings,
  saveSettings,
  addDeck,
  updateDeck,
  deleteDeck,
  addCard,
  updateCard,
  deleteCard,
  deleteCardsByDeckId,
  recordStudySession,
} from './storage'

import {
  createDeck,
  createCard,
  validateDeckName,
  getDueCardCountForDeck,
  getCardsByDeckId,
} from './flashcardUtils'

export default function FlashcardSystemPage() {
  const navigate = useNavigate()

  const [decks, setDecks] = useState(() => loadDecks())
  const [cards, setCards] = useState(() => loadCards())
  const [stats, setStats] = useState(() => loadStats())
  const [settings, setSettings] = useState(() => loadSettings())

  const initialDecks = loadDecks()
  const [selectedDeckId, setSelectedDeckId] = useState(() =>
    initialDecks.length > 0 ? initialDecks[0].id : null
  )
  const [mode, setMode] = useState('manage')

  const [showCreateDeck, setShowCreateDeck] = useState(false)
  const [showRenameDeck, setShowRenameDeck] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [showCardEditor, setShowCardEditor] = useState(false)

  const [newDeckName, setNewDeckName] = useState('')
  const [renameDeckName, setRenameDeckName] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => { saveDecks(decks) }, [decks])
  useEffect(() => { saveCards(cards) }, [cards])
  useEffect(() => { saveStats(stats) }, [stats])
  useEffect(() => { saveSettings(settings) }, [settings])

  const handleAddDeck = useCallback(() => {
    setNewDeckName('')
    setFormError('')
    setShowCreateDeck(true)
  }, [])

  const handleCreateDeck = useCallback(() => {
    const existingNames = decks.map(d => d.name)
    const validation = validateDeckName(newDeckName, existingNames)
    if (!validation.valid) {
      setFormError(validation.error)
      return
    }
    const deck = createDeck(newDeckName)
    setDecks(prev => addDeck(prev, deck))
    setSelectedDeckId(deck.id)
    setShowCreateDeck(false)
  }, [decks, newDeckName])

  const handleRenameDeck = useCallback((deck) => {
    setShowRenameDeck(deck)
    setRenameDeckName(deck.name)
    setFormError('')
  }, [])

  const handleConfirmRename = useCallback(() => {
    if (!showRenameDeck) return
    const existingNames = decks
      .filter(d => d.id !== showRenameDeck.id)
      .map(d => d.name)
    const validation = validateDeckName(renameDeckName, existingNames)
    if (!validation.valid) {
      setFormError(validation.error)
      return
    }
    setDecks(prev => updateDeck(prev, showRenameDeck.id, { name: renameDeckName.trim() }))
    setShowRenameDeck(null)
  }, [decks, renameDeckName, showRenameDeck])

  const handleDeleteDeck = useCallback((deck) => {
    setShowDeleteConfirm(deck)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!showDeleteConfirm) return
    const newDecks = deleteDeck(decks, showDeleteConfirm.id)
    setDecks(newDecks)
    setCards(prev => deleteCardsByDeckId(prev, showDeleteConfirm.id))
    if (selectedDeckId === showDeleteConfirm.id) {
      setSelectedDeckId(newDecks.length > 0 ? newDecks[0].id : null)
    }
    setShowDeleteConfirm(null)
  }, [decks, showDeleteConfirm, selectedDeckId])

  const handleSelectDeck = useCallback((deckId) => {
    setSelectedDeckId(deckId)
    setMode('manage')
  }, [])

  const handleStartStudy = useCallback(() => {
    if (!selectedDeckId) return
    setMode('study')
  }, [selectedDeckId])

  const handleExitStudy = useCallback((results) => {
    if (results.length > 0) {
      setStats(prev => recordStudySession(prev, results))
    }
    setMode('manage')
  }, [])

  const handleCardReviewed = useCallback((updatedCard) => {
    setCards(prev => updateCard(prev, updatedCard.id, updatedCard))
  }, [])

  const handleAddCard = useCallback(() => {
    setEditingCard(null)
    setShowCardEditor(true)
  }, [])

  const handleEditCard = useCallback((card) => {
    setEditingCard(card)
    setShowCardEditor(true)
  }, [])

  const handleSaveCard = useCallback((data) => {
    if (editingCard) {
      setCards(prev => updateCard(prev, editingCard.id, {
        front: data.front,
        back: data.back,
        tags: data.tags,
      }))
    } else if (selectedDeckId) {
      const card = createCard(selectedDeckId, data.front, data.back, data.tags)
      setCards(prev => addCard(prev, card))
    }
    setShowCardEditor(false)
    setEditingCard(null)
  }, [editingCard, selectedDeckId])

  const handleDeleteCard = useCallback((card) => {
    if (window.confirm(`确定删除这张卡片吗？`)) {
      setCards(prev => deleteCard(prev, card.id))
    }
  }, [])

  const selectedDeck = decks.find(d => d.id === selectedDeckId) || null
  const dueCount = selectedDeckId ? getDueCardCountForDeck(cards, selectedDeckId) : 0
  const deckCardCount = selectedDeckId ? getCardsByDeckId(cards, selectedDeckId).length : 0

  return (
    <div className="fc-page">
      <div className="fc-header">
        <button className="fc-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="fc-title">记忆卡片学习系统</h1>
      </div>

      <DeckTabs
        decks={decks}
        cards={cards}
        selectedDeckId={selectedDeckId}
        onSelectDeck={handleSelectDeck}
        onAddDeck={handleAddDeck}
        onRenameDeck={handleRenameDeck}
        onDeleteDeck={handleDeleteDeck}
      />

      {decks.length === 0 ? (
        <div className="fc-panel" style={{ width: '100%', maxWidth: 1100 }}>
          <div className="fc-empty">
            还没有牌组，点击「新建牌组」开始创建你的第一个记忆卡片牌组吧！
          </div>
        </div>
      ) : (
        <div className="fc-main-layout">
          <div className="fc-content-panel">
            {selectedDeck && mode === 'manage' && (
              <>
                <div className="fc-deck-study-btn-wrap">
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-h)' }}>
                      {selectedDeck.name}
                    </h2>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                      共 {deckCardCount} 张卡片，{dueCount} 张待复习
                    </div>
                  </div>
                  <button
                    className="fc-btn fc-btn-primary"
                    onClick={handleStartStudy}
                    disabled={deckCardCount === 0}
                    style={deckCardCount === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    开始学习
                  </button>
                </div>

                <CardList
                  cards={cards}
                  deckId={selectedDeckId}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                />
              </>
            )}

            {selectedDeck && mode === 'study' && (
              <StudyMode
                cards={cards}
                deckId={selectedDeckId}
                onFinish={handleExitStudy}
                onCardReviewed={handleCardReviewed}
              />
            )}
          </div>

          <StatsPanel
            cards={cards}
            stats={stats}
            settings={settings}
            onSettingsChange={setSettings}
          />
        </div>
      )}

      {showCreateDeck && (
        <div className="fc-modal-overlay" onClick={() => setShowCreateDeck(false)}>
          <div className="fc-modal" onClick={e => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h3 className="fc-modal-title">新建牌组</h3>
              <button className="fc-modal-close" onClick={() => setShowCreateDeck(false)}>×</button>
            </div>
            <div className="fc-form-group">
              <label className="fc-form-label">牌组名称</label>
              <input
                type="text"
                className="fc-form-input"
                placeholder="如：英语单词"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                autoFocus
              />
              {formError && <div className="fc-form-error">{formError}</div>}
            </div>
            <div className="fc-form-actions">
              <button className="fc-btn" onClick={() => setShowCreateDeck(false)}>取消</button>
              <button className="fc-btn fc-btn-primary" onClick={handleCreateDeck}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showRenameDeck && (
        <div className="fc-modal-overlay" onClick={() => setShowRenameDeck(null)}>
          <div className="fc-modal" onClick={e => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h3 className="fc-modal-title">重命名牌组</h3>
              <button className="fc-modal-close" onClick={() => setShowRenameDeck(null)}>×</button>
            </div>
            <div className="fc-form-group">
              <label className="fc-form-label">牌组名称</label>
              <input
                type="text"
                className="fc-form-input"
                value={renameDeckName}
                onChange={e => setRenameDeckName(e.target.value)}
                autoFocus
              />
              {formError && <div className="fc-form-error">{formError}</div>}
            </div>
            <div className="fc-form-actions">
              <button className="fc-btn" onClick={() => setShowRenameDeck(null)}>取消</button>
              <button className="fc-btn fc-btn-primary" onClick={handleConfirmRename}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fc-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="fc-modal" onClick={e => e.stopPropagation()}>
            <div className="fc-modal-header">
              <h3 className="fc-modal-title">确认删除</h3>
              <button className="fc-modal-close" onClick={() => setShowDeleteConfirm(null)}>×</button>
            </div>
            <p style={{ color: 'var(--text)', marginBottom: 20 }}>
              确定删除牌组「<strong>{showDeleteConfirm.name}</strong>」吗？该牌组下的所有卡片将被一并删除，此操作无法撤销。
            </p>
            <div className="fc-form-actions">
              <button className="fc-btn" onClick={() => setShowDeleteConfirm(null)}>取消</button>
              <button className="fc-btn fc-btn-danger" onClick={handleConfirmDelete}>删除</button>
            </div>
          </div>
        </div>
      )}

      {showCardEditor && (
        <CardEditModal
          key={editingCard?.id || 'new'}
          card={editingCard}
          onClose={() => {
            setShowCardEditor(false)
            setEditingCard(null)
          }}
          onSave={handleSaveCard}
        />
      )}
    </div>
  )
}
