import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './theme-editor.css'
import ControlPanel from './ControlPanel'
import PreviewArea from './PreviewArea'
import { useThemeEditor } from './useThemeEditor'

const ThemeEditorPage = () => {
  const containerRef = useRef(null)
  const {
    config,
    setMode,
    toggleMode,
    setColor,
    setTypography,
    resetToDefaults,
    exportConfig,
    importConfig,
  } = useThemeEditor(containerRef)

  const [importError, setImportError] = useState('')

  const handleImport = async (file) => {
    try {
      setImportError('')
      await importConfig(file)
    } catch (e) {
      setImportError(e.message)
    }
  }

  return (
    <div className="te-page" ref={containerRef} data-theme-mode={config.mode}>
      <div className="te-container">
        <header className="te-header">
          <Link to="/" className="te-back-link">← 返回首页</Link>
          <h1>主题定制系统</h1>
          <div style={{ width: 80 }} />
        </header>

        {importError && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: 16,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--te-error)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: 14,
            }}
          >
            导入失败：{importError}
          </div>
        )}

        <div className="te-layout">
          <ControlPanel
            config={config}
            onModeChange={setMode}
            onToggleMode={toggleMode}
            onColorChange={setColor}
            onTypographyChange={setTypography}
            onReset={resetToDefaults}
            onExport={exportConfig}
            onImport={handleImport}
          />
          <PreviewArea />
        </div>
      </div>
    </div>
  )
}

export default ThemeEditorPage
