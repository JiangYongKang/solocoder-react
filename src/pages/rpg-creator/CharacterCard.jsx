import { useRef, useEffect, useCallback } from 'react'
import { drawCardCanvas } from './utils'

const CARD_W = 440
const CARD_H = 600

export default function CharacterCard({ character, onClose, onExport }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawCardCanvas(ctx, character)
  }, [character])

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${character.name || '角色'}_卡片.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    if (onExport) onExport()
  }, [character, onExport])

  return (
    <div className="rpg-modal-overlay" onClick={onClose}>
      <div className="rpg-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="rpg-modal-title">🎴 角色卡片预览</h3>
        <div className="rpg-card-preview-wrapper">
          <canvas
            ref={canvasRef}
            className="rpg-card-canvas"
            width={CARD_W}
            height={CARD_H}
          />
        </div>
        <div className="rpg-card-actions">
          <button className="rpg-action-btn primary" onClick={handleExport}>
            📥 导出 PNG
          </button>
          <button className="rpg-action-btn secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
