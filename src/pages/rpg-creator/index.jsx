import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './rpg-creator.css'
import { GENDERS } from './constants'
import {
  createDefaultCharacter,
  validateName,
  loadCharacters,
  saveCharacter,
  deleteCharacter,
  charactersEqual,
  getAttributeSummary,
  formatDateTime,
  getOutfitName,
} from './utils'
import CharacterPreview from './CharacterPreview'
import AppearancePanel from './AppearancePanel'
import AttributePanel from './AttributePanel'
import SkillTreePanel from './SkillTree'
import CharacterCard from './CharacterCard'

export default function RpgCreatorPage() {
  const navigate = useNavigate()

  const [character, setCharacter] = useState(() => createDefaultCharacter())
  const [savedList, setSavedList] = useState(() => loadCharacters())
  const [nameError, setNameError] = useState('')
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showCardPreview, setShowCardPreview] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
  }, [])

  const updateCharacter = useCallback((updates) => {
    setCharacter(prev => ({ ...prev, ...updates }))
  }, [])

  const handleNameChange = useCallback((e) => {
    const val = e.target.value
    updateCharacter({ name: val })
    const err = validateName(val)
    setNameError(val.trim().length > 0 ? (err || '') : '')
  }, [updateCharacter])

  const handleDescriptionChange = useCallback((e) => {
    updateCharacter({ description: e.target.value })
  }, [updateCharacter])

  const handleGenderChange = useCallback((gender) => {
    updateCharacter({ gender })
  }, [updateCharacter])

  const handleAppearanceChange = useCallback((appearance) => {
    updateCharacter({ appearance })
  }, [updateCharacter])

  const handleAttributesChange = useCallback((attributes) => {
    updateCharacter({ attributes })
  }, [updateCharacter])

  const handleSkillUnlock = useCallback((unlockedSkills, skillPoints) => {
    updateCharacter({ unlockedSkills, skillPoints })
  }, [updateCharacter])

  const handleSave = useCallback(() => {
    const nameErr = validateName(character.name)
    if (nameErr) {
      setNameError(nameErr)
      showToast(nameErr, 'error')
      return
    }
    setNameError('')
    const result = saveCharacter(savedList, character)
    if (result.success) {
      setSavedList(result.characters)
      setCharacter(result.character)
      showToast('角色保存成功！')
    } else {
      showToast(result.error, 'error')
    }
  }, [character, savedList, showToast])

  const handleLoad = useCallback((savedChar) => {
    const hasUnsavedChanges = !charactersEqual(character, savedChar)
    if (hasUnsavedChanges) {
      if (!window.confirm('当前有未保存的修改，确定要加载其他角色吗？')) {
        return
      }
    }
    setCharacter({ ...savedChar })
    setShowLoadModal(false)
    showToast('角色加载成功！')
  }, [character, showToast])

  const handleDelete = useCallback((id) => {
    if (!window.confirm('确定要删除这个角色吗？此操作不可撤销。')) return
    const result = deleteCharacter(savedList, id)
    setSavedList(result.characters)
    showToast('角色已删除')
  }, [savedList, showToast])

  const handleNewCharacter = useCallback(() => {
    const hasContent = character.name || character.unlockedSkills.length > 0 ||
      Object.values(character.attributes).some(v => v !== 5)
    if (hasContent) {
      if (!window.confirm('当前角色有数据，确定要创建新角色吗？')) return
    }
    setCharacter(createDefaultCharacter())
    setNameError('')
    showToast('已创建新角色')
  }, [character, showToast])

  const handleExportCard = useCallback(() => {
    const nameErr = validateName(character.name)
    if (nameErr) {
      showToast('请先填写角色名称并保存', 'error')
      return
    }
    const isSaved = savedList.some(c => c.id === character.id)
    if (!isSaved) {
      showToast('请先保存角色再导出卡片', 'error')
      return
    }
    setShowCardPreview(true)
  }, [character, savedList, showToast])

  return (
    <div className="rpg-page">
      <div className="rpg-header">
        <button className="rpg-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="rpg-title">⚔️ RPG 角色创建器</h1>
      </div>

      <div className="rpg-info-section">
        <div className="rpg-info-field name-field">
          <label className="rpg-info-label">角色名称 *</label>
          <input
            className={`rpg-info-input ${nameError ? 'error' : ''}`}
            type="text"
            value={character.name}
            onChange={handleNameChange}
            placeholder="2-20 字符"
            maxLength={20}
          />
          {nameError && <div className="rpg-error-msg">{nameError}</div>}
        </div>

        <div className="rpg-info-field">
          <label className="rpg-info-label">性别</label>
          <div className="rpg-gender-group">
            {GENDERS.map((g) => (
              <button
                key={g.key}
                className={`rpg-gender-btn ${character.gender === g.key ? 'active' : ''}`}
                onClick={() => handleGenderChange(g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rpg-info-field desc-field">
          <label className="rpg-info-label">背景故事</label>
          <textarea
            className="rpg-info-textarea"
            value={character.description}
            onChange={handleDescriptionChange}
            placeholder="角色背景故事（选填）"
            maxLength={500}
          />
        </div>
      </div>

      <div className="rpg-main-layout">
        <div className="rpg-left-panel">
          <div className="rpg-card">
            <h3 className="rpg-card-title">👤 角色预览</h3>
            <CharacterPreview appearance={character.appearance} />
          </div>
          <AppearancePanel
            appearance={character.appearance}
            onChange={handleAppearanceChange}
          />
        </div>

        <div className="rpg-right-panel">
          <AttributePanel
            attributes={character.attributes}
            onChange={handleAttributesChange}
          />
          <SkillTreePanel
            outfit={character.appearance.outfit}
            attributes={character.attributes}
            unlockedSkills={character.unlockedSkills}
            skillPoints={character.skillPoints}
            onUnlock={handleSkillUnlock}
          />
        </div>
      </div>

      <div className="rpg-actions-bar">
        <button className="rpg-action-btn primary" onClick={handleSave}>
          💾 保存角色
        </button>
        <button className="rpg-action-btn secondary" onClick={() => setShowLoadModal(true)}>
          📂 加载角色
        </button>
        <button className="rpg-action-btn secondary" onClick={handleNewCharacter}>
          ✨ 新建角色
        </button>
        <button className="rpg-action-btn secondary" onClick={handleExportCard}>
          🎴 导出卡片
        </button>
      </div>

      {showLoadModal && (
        <div className="rpg-modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="rpg-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="rpg-modal-title">📂 加载角色</h3>
            {savedList.length === 0 ? (
              <div className="rpg-empty-list">暂无已保存的角色</div>
            ) : (
              <div className="rpg-char-list">
                {savedList.map((c) => (
                  <div key={c.id} className="rpg-char-list-item">
                    <div className="rpg-char-item-info" onClick={() => handleLoad(c)}>
                      <div className="rpg-char-item-name">{c.name}</div>
                      <div className="rpg-char-item-meta">
                        {getOutfitName(c.appearance.outfit)} · Lv.{c.level} · {getAttributeSummary(c.attributes)} · {formatDateTime(c.createdAt)}
                      </div>
                    </div>
                    <div className="rpg-char-item-actions">
                      <button
                        className="rpg-char-item-btn delete-btn"
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="rpg-action-btn secondary" onClick={() => setShowLoadModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showCardPreview && (
        <CharacterCard
          character={character}
          onClose={() => setShowCardPreview(false)}
          onExport={() => showToast('卡片已导出')}
        />
      )}

      {toast && (
        <div className={`rpg-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
