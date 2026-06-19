import { useState, useCallback } from 'react'
import './loading-animation.css'
import {
  ANIMATION_TYPES,
  MODE,
  MAX_SAVED_ANIMATIONS,
  generateId,
} from './constants.js'
import {
  createCompositionElement,
  mergeWithDefaults,
} from './loadingAnimationCore.js'
import {
  loadSavedAnimations,
  addToSaved,
  removeFromSaved,
} from './storage.js'
import AnimationTypeSelector from './AnimationTypeSelector.jsx'
import ControlPanel from './ControlPanel.jsx'
import PreviewPanel from './PreviewPanel.jsx'
import CodeOutput from './CodeOutput.jsx'
import CompositionEditor from './CompositionEditor.jsx'
import SavedAnimations from './SavedAnimations.jsx'

export default function LoadingAnimationPage() {
  const [mode, setMode] = useState(MODE.SINGLE)
  const [selectedType, setSelectedType] = useState('spinner')
  const [config, setConfig] = useState(() => ({
    ...ANIMATION_TYPES.spinner.defaultConfig,
  }))
  const [isPlaying, setIsPlaying] = useState(true)
  const [previewSize, setPreviewSize] = useState('medium')
  const [backgroundTheme, setBackgroundTheme] = useState('light')
  const [savedAnimations, setSavedAnimations] = useState(() => loadSavedAnimations())
  const [compositionElements, setCompositionElements] = useState([])
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')

  const handleTypeSelect = useCallback((type) => {
    setSelectedType(type)
    const animType = ANIMATION_TYPES[type]
    if (animType) {
      setConfig({ ...animType.defaultConfig })
    }
  }, [])

  const handleConfigChange = useCallback((newConfig) => {
    const merged = mergeWithDefaults(selectedType, newConfig)
    if (merged) {
      setConfig(merged)
    }
  }, [selectedType])

  const handleDragStart = useCallback((e, animationType) => {
    e.dataTransfer.setData('animationType', animationType)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const handleCompositionDrop = useCallback((e, position) => {
    const animationType = e.dataTransfer.getData('animationType')
    if (!animationType) return

    const element = createCompositionElement(
      animationType,
      ANIMATION_TYPES[animationType].defaultConfig,
      position
    )
    if (element) {
      setCompositionElements(prev => [...prev, element])
    }
  }, [])

  const handleSave = useCallback(() => {
    if (mode === MODE.SINGLE && !selectedType) {
      setSaveStatus('请先选择动画类型')
      return
    }
    if (mode === MODE.COMPOSITION && compositionElements.length === 0) {
      setSaveStatus('画布为空')
      return
    }

    const animData = {
      id: generateId(),
      name: mode === MODE.SINGLE
        ? ANIMATION_TYPES[selectedType]?.name
        : `组合动画 ${savedAnimations.length + 1}`,
      animationType: selectedType,
      mode,
      config,
      compositionElements: mode === MODE.COMPOSITION ? compositionElements : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const newList = addToSaved(savedAnimations, animData)
    setSavedAnimations(newList)
    setSaveStatus('保存成功')
    setTimeout(() => setSaveStatus(''), 2000)
  }, [mode, selectedType, config, compositionElements, savedAnimations])

  const handleLoadSaved = useCallback((item) => {
    if (item.mode === MODE.COMPOSITION && item.compositionElements) {
      setMode(MODE.COMPOSITION)
      setCompositionElements(item.compositionElements)
    } else {
      setMode(MODE.SINGLE)
      if (item.animationType) {
        handleTypeSelect(item.animationType)
        if (item.config) {
          setConfig(item.config)
        }
      }
    }
    setSelectedElementId(null)
  }, [handleTypeSelect])

  const handleDeleteSaved = useCallback((id) => {
    const newList = removeFromSaved(savedAnimations, id)
    setSavedAnimations(newList)
  }, [savedAnimations])

  return (
    <div className="loading-animation-page">
      <div className="page-header">
        <h1>加载动画生成器</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === MODE.SINGLE ? 'active' : ''}`}
              onClick={() => setMode(MODE.SINGLE)}
            >
              单个动画
            </button>
            <button
              className={`mode-tab ${mode === MODE.COMPOSITION ? 'active' : ''}`}
              onClick={() => setMode(MODE.COMPOSITION)}
            >
              组合动画
            </button>
          </div>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saveStatus !== ''}
          >
            {saveStatus || '💾 保存'}
          </button>
        </div>
      </div>

      <div className="main-layout">
        <AnimationTypeSelector
          selectedType={selectedType}
          onSelect={handleTypeSelect}
          onDragStart={handleDragStart}
        />

        {mode === MODE.SINGLE ? (
          <>
            <PreviewPanel
              animationType={selectedType}
              config={config}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(p => !p)}
              previewSize={previewSize}
              onPreviewSizeChange={setPreviewSize}
              backgroundTheme={backgroundTheme}
              onBackgroundChange={setBackgroundTheme}
              mode={mode}
            />

            <ControlPanel
              animationType={selectedType}
              config={config}
              onChange={handleConfigChange}
            />
          </>
        ) : (
          <CompositionEditor
            elements={compositionElements}
            onElementsChange={setCompositionElements}
            onDrop={handleCompositionDrop}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            backgroundTheme={backgroundTheme}
          />
        )}

        {mode === MODE.SINGLE ? (
          <SavedAnimations
            savedAnimations={savedAnimations}
            onLoad={handleLoadSaved}
            onDelete={handleDeleteSaved}
            maxCount={MAX_SAVED_ANIMATIONS}
          />
        ) : (
          <PreviewPanel
            mode={mode}
            compositionElements={compositionElements}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(p => !p)}
            previewSize={previewSize}
            onPreviewSizeChange={setPreviewSize}
            backgroundTheme={backgroundTheme}
            onBackgroundChange={setBackgroundTheme}
          />
        )}

        <CodeOutput
          animationType={selectedType}
          config={config}
          mode={mode}
          compositionElements={compositionElements}
        />
      </div>
    </div>
  )
}
