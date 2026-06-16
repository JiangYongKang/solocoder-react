import { useState, useEffect, useCallback, useRef } from 'react'
import './resume-templates.css'
import { TEMPLATES } from './constants'
import {
  createDefaultResumeState,
  toggleModuleVisibility,
  toggleModuleExpanded,
  updateModuleContent,
  toggleFavorite,
  setRating,
} from './resumeTemplatesCore'
import {
  loadResumeState,
  saveResumeState,
  loadFavorites,
  saveFavorites,
  loadRatings,
  saveRatings,
} from './storage'
import TemplateSelector from './TemplateSelector'
import ModuleEditor from './ModuleEditor'
import ResumePreview from './ResumePreview'

export default function ResumeTemplatesPage() {
  const [resumeState, setResumeState] = useState(() => loadResumeState())
  const [favorites, setFavorites] = useState(() => loadFavorites())
  const [ratings, setRatings] = useState(() => loadRatings())
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimerRef = useRef(null)
  const innerTimerRef = useRef(null)

  useEffect(() => {
    saveResumeState(resumeState)
  }, [resumeState])

  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  useEffect(() => {
    saveRatings(ratings)
  }, [ratings])

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
      if (innerTimerRef.current) {
        clearTimeout(innerTimerRef.current)
      }
    }
  }, [])

  const handleSelectTemplate = useCallback((templateId) => {
    if (templateId === resumeState.selectedTemplateId) return

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
    }
    if (innerTimerRef.current) {
      clearTimeout(innerTimerRef.current)
    }

    setIsTransitioning(true)
    transitionTimerRef.current = setTimeout(() => {
      setResumeState((prev) => ({ ...prev, selectedTemplateId: templateId }))
      innerTimerRef.current = setTimeout(() => setIsTransitioning(false), 100)
    }, 150)
  }, [resumeState.selectedTemplateId])

  const handleReorderModules = useCallback((newModules) => {
    setResumeState((prev) => ({ ...prev, modules: newModules }))
  }, [])

  const handleToggleVisibility = useCallback((moduleId) => {
    setResumeState((prev) => ({
      ...prev,
      modules: toggleModuleVisibility(prev.modules, moduleId),
    }))
  }, [])

  const handleToggleExpanded = useCallback((moduleId) => {
    setResumeState((prev) => ({
      ...prev,
      modules: toggleModuleExpanded(prev.modules, moduleId),
    }))
  }, [])

  const handleContentChange = useCallback((moduleId, content) => {
    setResumeState((prev) => ({
      ...prev,
      modules: updateModuleContent(prev.modules, moduleId, content),
    }))
  }, [])

  const handleFilterChange = useCallback((filterMode) => {
    setResumeState((prev) => ({ ...prev, filterMode }))
  }, [])

  const handleToggleFavorite = useCallback((templateId) => {
    setFavorites((prev) => toggleFavorite(prev, templateId))
  }, [])

  const handleRateTemplate = useCallback((templateId, rating) => {
    setRatings((prev) => setRating(prev, templateId, rating))
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleTogglePrintPreview = useCallback(() => {
    setIsPrintMode((prev) => !prev)
  }, [])

  const handleReset = useCallback(() => {
    if (window.confirm('确定要重置所有内容吗？这将恢复到默认状态。')) {
      setResumeState(createDefaultResumeState())
    }
  }, [])

  if (isPrintMode) {
    return (
      <div className="rt-print-mode">
        <div className="rt-print-header">
          <h2>打印预览</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="rt-btn" onClick={handlePrint}>
              🖨️ 打印 / 导出 PDF
            </button>
            <button className="rt-btn rt-btn-primary" onClick={handleTogglePrintPreview}>
              关闭预览
            </button>
          </div>
        </div>
        <div className="rt-print-content">
          <ResumePreview
            modules={resumeState.modules}
            templateId={resumeState.selectedTemplateId}
            isPrintMode={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="resume-templates-page">
      <div className="rt-header">
        <h1>📄 Markdown 简历模板市场</h1>
        <div className="rt-header-actions">
          <button className="rt-btn" onClick={handleReset}>
            重置
          </button>
          <button className="rt-btn" onClick={handleTogglePrintPreview}>
            👁️ 打印预览
          </button>
          <button className="rt-btn rt-btn-primary" onClick={handlePrint}>
            🖨️ 打印 / PDF
          </button>
        </div>
      </div>

      <TemplateSelector
        templates={TEMPLATES}
        selectedTemplateId={resumeState.selectedTemplateId}
        filterMode={resumeState.filterMode}
        favorites={favorites}
        ratings={ratings}
        onSelectTemplate={handleSelectTemplate}
        onToggleFavorite={handleToggleFavorite}
        onRateTemplate={handleRateTemplate}
        onFilterChange={handleFilterChange}
      />

      <div className="rt-main">
        <ModuleEditor
          modules={resumeState.modules}
          onReorderModules={handleReorderModules}
          onToggleVisibility={handleToggleVisibility}
          onToggleExpanded={handleToggleExpanded}
          onContentChange={handleContentChange}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: isTransitioning ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
          <ResumePreview
            modules={resumeState.modules}
            templateId={resumeState.selectedTemplateId}
          />
        </div>
      </div>
    </div>
  )
}
