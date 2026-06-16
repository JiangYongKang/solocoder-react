import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfigPanel from './ConfigPanel'
import ModalPreview from './ModalPreview'
import {
  createDefaultConfig,
  createConfigByType,
} from './modalGeneratorCore'
import './modal-generator.css'

function ModalGenerator() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(createDefaultConfig())
  const [animationKey, setAnimationKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(true)

  const handleConfigChange = useCallback((updates) => {
    setConfig((prev) => {
      if (updates.type && updates.type !== prev.type) {
        const newConfig = createConfigByType(updates.type)
        return {
          ...newConfig,
          width: prev.width,
          maskOpacity: prev.maskOpacity,
          closeOnMaskClick: prev.closeOnMaskClick,
          showCloseButton: prev.showCloseButton,
          animation: prev.animation,
          animationDuration: prev.animationDuration,
          confirmColor: prev.confirmColor,
          cancelColor: prev.cancelColor,
        }
      }
      return { ...prev, ...updates }
    })
  }, [])

  const handlePreviewAnimation = useCallback(() => {
    setIsModalVisible(false)
    setTimeout(() => {
      setAnimationKey((prev) => prev + 1)
      setIsModalVisible(true)
    }, 50)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false)
  }, [])

  const handleOpenModal = useCallback(() => {
    setAnimationKey((prev) => prev + 1)
    setIsModalVisible(true)
  }, [])

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  return (
    <div className="mg-page">
      <header className="mg-header">
        <div className="mg-header-left">
          <button type="button" className="mg-btn mg-btn-back" onClick={handleBack}>
            ← 返回
          </button>
          <h1 className="mg-title">弹窗生成器</h1>
        </div>
        <div className="mg-header-actions">
          <button type="button" className="mg-btn" onClick={handlePreviewAnimation}>
            重播动画
          </button>
          <button type="button" className="mg-btn mg-btn-primary" onClick={handleFullscreenToggle}>
            {isFullscreen ? '退出全屏' : '全屏预览'}
          </button>
        </div>
      </header>

      <div className="mg-main">
        <div className="mg-config-wrapper">
          <ConfigPanel
            config={config}
            onConfigChange={handleConfigChange}
            onPreviewAnimation={handlePreviewAnimation}
            generatedCode={generatedCode}
            onGeneratedCodeChange={setGeneratedCode}
          />
        </div>

        <div className="mg-preview-wrapper">
          <div className="mg-preview-container">
            <div className="mg-preview-bg">
              <div className="mg-preview-bg-header">
                <div className="mg-preview-bg-dots">
                  <span className="mg-dot mg-dot-red" />
                  <span className="mg-dot mg-dot-yellow" />
                  <span className="mg-dot mg-dot-green" />
                </div>
              </div>
              <div className="mg-preview-bg-content">
                <div className="mg-preview-bg-card" />
                <div className="mg-preview-bg-card" />
                <div className="mg-preview-bg-card" />
              </div>
              {isModalVisible && (
                <ModalPreview
                  config={config}
                  animationKey={animationKey}
                  onClose={handleCloseModal}
                />
              )}
              {!isModalVisible && (
                <button
                  type="button"
                  className="mg-btn mg-btn-primary mg-show-modal-btn"
                  onClick={handleOpenModal}
                >
                  显示弹窗
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="mg-fullscreen-overlay">
          <div className="mg-fullscreen-bg">
            {isModalVisible && (
              <ModalPreview
                config={config}
                animationKey={animationKey}
                onClose={handleFullscreenToggle}
              />
            )}
            {!isModalVisible && (
              <button
                type="button"
                className="mg-btn mg-btn-primary mg-show-modal-btn"
                onClick={handleOpenModal}
              >
                显示弹窗
              </button>
            )}
          </div>
          <div className="mg-fullscreen-hint">
            按 Esc 键退出全屏
          </div>
        </div>
      )}
    </div>
  )
}

export default ModalGenerator
