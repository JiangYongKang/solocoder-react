import { useRef, useEffect } from 'react'
import { drawCharacter, PREVIEW_W, PREVIEW_H } from './utils'

export default function CharacterPreview({ appearance }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawCharacter(ctx, appearance)
  }, [appearance])

  return (
    <div className="rpg-preview-canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="rpg-preview-canvas"
        width={PREVIEW_W}
        height={PREVIEW_H}
      />
    </div>
  )
}
