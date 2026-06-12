import { useState, useEffect, useRef, useCallback } from 'react'
import './css-animation.css'
import AnimationList from './AnimationList.jsx'
import PreviewPanel from './PreviewPanel.jsx'
import Timeline from './Timeline.jsx'
import PropertyPanel from './PropertyPanel.jsx'
import CodeOutput from './CodeOutput.jsx'
import BezierEditor from './BezierEditor.jsx'
import {
  createAnimation,
  addPropertyTrack,
  removePropertyTrack,
  toggleTrackVisibility,
  addKeyframe,
  removeKeyframe,
  updateKeyframeValue,
  moveKeyframe,
  updateEasing,
  updateAnimationSettings,
  saveAnimations,
  loadAnimations,
  saveAnimationToList,
  deleteAnimationFromList,
  renameAnimationInList,
  exportAnimationJSON,
  validateAnimationJSON,
  downloadJSON,
} from './cssAnimationCore.js'

export default function CSSAnimationPage() {
  const [animations, setAnimations] = useState([])
  const [currentAnimation, setCurrentAnimation] = useState(null)
  const [selectedKeyframe, setSelectedKeyframe] = useState(null)
  const [bezierEditor, setBezierEditor] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const saved = loadAnimations()
    setAnimations(saved)
    if (saved.length > 0) {
      setCurrentAnimation(saved[0])
    } else {
      const newAnim = createAnimation()
      setCurrentAnimation(newAnim)
    }
  }, [])

  useEffect(() => {
    if (animations.length > 0) {
      saveAnimations(animations)
    }
  }, [animations])

  const showError = useCallback((message) => {
    setError(message)
    setTimeout(() => setError(null), 3000)
  }, [])

  const handleNewAnimation = () => {
    const newAnim = createAnimation()
    setCurrentAnimation(newAnim)
    setSelectedKeyframe(null)
    const newList = saveAnimationToList(animations, newAnim)
    setAnimations(newList)
  }

  const handleSelectAnimation = (animation) => {
    setCurrentAnimation(animation)
    setSelectedKeyframe(null)
  }

  const handleRenameAnimation = (animationId, newName) => {
    const newList = renameAnimationInList(animations, animationId, newName)
    setAnimations(newList)
    if (currentAnimation?.id === animationId) {
      setCurrentAnimation((prev) => prev ? { ...prev, name: newName } : null)
    }
  }

  const handleDeleteAnimation = (animationId) => {
    const newList = deleteAnimationFromList(animations, animationId)
    setAnimations(newList)
    if (currentAnimation?.id === animationId) {
      setCurrentAnimation(newList.length > 0 ? newList[0] : createAnimation())
    }
    setSelectedKeyframe(null)
  }

  const handleUpdateAnimation = (updatedAnimation) => {
    setCurrentAnimation(updatedAnimation)
    const newList = saveAnimationToList(animations, updatedAnimation)
    setAnimations(newList)
  }

  const handleAddTrack = (propertyName) => {
    if (currentAnimation) {
      const updated = addPropertyTrack(currentAnimation, propertyName)
      handleUpdateAnimation(updated)
    }
  }

  const handleRemoveTrack = (trackId) => {
    if (currentAnimation) {
      const updated = removePropertyTrack(currentAnimation, trackId)
      handleUpdateAnimation(updated)
      if (selectedKeyframe?.trackId === trackId) {
        setSelectedKeyframe(null)
      }
    }
  }

  const handleToggleVisibility = (trackId) => {
    if (currentAnimation) {
      const updated = toggleTrackVisibility(currentAnimation, trackId)
      handleUpdateAnimation(updated)
    }
  }

  const handleAddKeyframe = (trackId, time) => {
    if (currentAnimation) {
      const updated = addKeyframe(currentAnimation, trackId, time)
      handleUpdateAnimation(updated)
    }
  }

  const handleRemoveKeyframe = (trackId, keyframeId) => {
    if (currentAnimation) {
      const updated = removeKeyframe(currentAnimation, trackId, keyframeId)
      handleUpdateAnimation(updated)
      if (selectedKeyframe?.keyframeId === keyframeId) {
        setSelectedKeyframe(null)
      }
    }
  }

  const handleUpdateKeyframeValue = (trackId, keyframeId, value) => {
    if (currentAnimation) {
      const updated = updateKeyframeValue(currentAnimation, trackId, keyframeId, value)
      handleUpdateAnimation(updated)
    }
  }

  const handleUpdateKeyframeUnit = (trackId, newUnit) => {
    if (currentAnimation) {
      const updated = {
        ...currentAnimation,
        tracks: currentAnimation.tracks.map((t) =>
          t.id === trackId ? { ...t, unit: newUnit } : t
        ),
        updatedAt: Date.now(),
      }
      handleUpdateAnimation(updated)
    }
  }

  const handleMoveKeyframe = (trackId, keyframeId, newTime) => {
    if (currentAnimation) {
      const updated = moveKeyframe(currentAnimation, trackId, keyframeId, newTime)
      handleUpdateAnimation(updated)
    }
  }

  const handleEditEasing = (trackId, fromKeyframeId, currentEasing) => {
    setBezierEditor({
      trackId,
      fromKeyframeId,
      initialEasing: currentEasing,
    })
  }

  const handleSaveEasing = (easing) => {
    if (bezierEditor && currentAnimation) {
      const updated = updateEasing(
        currentAnimation,
        bezierEditor.trackId,
        bezierEditor.fromKeyframeId,
        easing
      )
      handleUpdateAnimation(updated)
    }
    setBezierEditor(null)
  }

  const handleUpdateSettings = (settings) => {
    if (currentAnimation) {
      const updated = updateAnimationSettings(currentAnimation, settings)
      handleUpdateAnimation(updated)
    }
  }

  const handleExportJSON = () => {
    if (!currentAnimation) return
    const json = exportAnimationJSON(currentAnimation)
    const filename = `${currentAnimation.name.replace(/[<>:"/\\|?*]/g, '_')}.json`
    downloadJSON(json, filename)
  }

  const handleImportJSON = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result
        if (typeof content !== 'string') {
          showError('文件内容无效')
          return
        }

        const validation = validateAnimationJSON(content)
        if (!validation.valid) {
          showError(validation.error || 'JSON 格式无效')
          return
        }

        const importedAnim = {
          ...validation.data,
          id: currentAnimation?.id || validation.data.id,
          createdAt: currentAnimation?.createdAt || validation.data.createdAt || Date.now(),
          updatedAt: Date.now(),
        }

        setCurrentAnimation(importedAnim)
        const newList = saveAnimationToList(animations, importedAnim)
        setAnimations(newList)
        setSelectedKeyframe(null)
        showError('动画导入成功！')
      } catch (err) {
        showError('文件读取失败: ' + err.message)
      }
    }
    reader.onerror = () => {
      showError('文件读取失败')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (!currentAnimation) {
    return (
      <div className="css-animation-page">
        <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div className="empty-state-icon">🎬</div>
            <div className="empty-state-text">加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="css-animation-page">
      <AnimationList
        animations={animations}
        currentAnimationId={currentAnimation.id}
        onSelectAnimation={handleSelectAnimation}
        onNewAnimation={handleNewAnimation}
        onRenameAnimation={handleRenameAnimation}
        onDeleteAnimation={handleDeleteAnimation}
      />

      <div className="main-content">
        <div className="toolbar">
          <button className="toolbar-btn primary" onClick={() => handleUpdateAnimation(currentAnimation)}>
            💾 保存
          </button>
          <button className="toolbar-btn" onClick={handleExportJSON}>
            📤 导出 JSON
          </button>
          <button className="toolbar-btn" onClick={handleImportJSON}>
            📥 导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13, color: '#8892b0' }}>
            当前: <span style={{ color: '#e94560', fontWeight: 600 }}>{currentAnimation.name}</span>
          </div>
        </div>

        <div className="content-area">
          <div className="editor-area">
            <PreviewPanel
              animation={currentAnimation}
              onUpdateSettings={handleUpdateSettings}
            />

            <Timeline
              animation={currentAnimation}
              selectedKeyframe={selectedKeyframe}
              onSelectKeyframe={setSelectedKeyframe}
              onAddKeyframe={handleAddKeyframe}
              onRemoveKeyframe={handleRemoveKeyframe}
              onMoveKeyframe={handleMoveKeyframe}
              onUpdateKeyframeValue={handleUpdateKeyframeValue}
              onToggleVisibility={handleToggleVisibility}
              onRemoveTrack={handleRemoveTrack}
              onAddTrack={handleAddTrack}
              onEditEasing={handleEditEasing}
            />

            <CodeOutput animation={currentAnimation} />
          </div>

          <PropertyPanel
            animation={currentAnimation}
            selectedKeyframe={selectedKeyframe}
            onUpdateKeyframeValue={handleUpdateKeyframeValue}
            onUpdateKeyframeUnit={handleUpdateKeyframeUnit}
          />
        </div>
      </div>

      {bezierEditor && (
        <BezierEditor
          initialEasing={bezierEditor.initialEasing}
          onClose={() => setBezierEditor(null)}
          onSave={handleSaveEasing}
        />
      )}

      {error && (
        <div className="error-toast">{error}</div>
      )}
    </div>
  )
}
