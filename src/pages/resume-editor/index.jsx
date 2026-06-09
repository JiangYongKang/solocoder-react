import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ModulePanel from './ModulePanel'
import FormEditor from './FormEditor'
import ResumePreview from './ResumePreview'
import {
  loadFromStorage,
  saveToStorage,
  createDefaultResumeState,
  createCustomModule,
  deleteModule,
  toggleModuleVisibility,
  updateModuleData,
  updateModuleTitle,
  addModule,
  addListItem,
  deleteListItem,
  updateListItem,
  exportToJson,
  downloadJson,
  parseJsonImport,
  clearStorage,
} from './resumeCore'
import './resume-editor.css'

function ResumeEditor() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [state, setState] = useState(() => loadFromStorage())
  const [selectedModuleId, setSelectedModuleId] = useState(() => {
    const initial = loadFromStorage()
    return initial.modules && initial.modules.length > 0 ? initial.modules[0].id : null
  })
  const [importError, setImportError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage(state)
    }, 100)
    return () => clearTimeout(timer)
  }, [state])

  const handleTemplateChange = useCallback((templateId) => {
    setState((prev) => ({ ...prev, templateId }))
  }, [])

  const handleSelectModule = useCallback((moduleId) => {
    setSelectedModuleId(moduleId)
  }, [])

  const handleReorderModules = useCallback((newModules) => {
    setState((prev) => ({ ...prev, modules: newModules }))
  }, [])

  const handleToggleVisibility = useCallback((moduleId) => {
    setState((prev) => ({
      ...prev,
      modules: toggleModuleVisibility(prev.modules, moduleId),
    }))
  }, [])

  const handleDeleteModule = useCallback((moduleId) => {
    setState((prev) => ({
      ...prev,
      modules: deleteModule(prev.modules, moduleId),
    }))
    setSelectedModuleId((prev) => (prev === moduleId ? null : prev))
  }, [])

  const handleAddCustomModule = useCallback((name) => {
    const newMod = createCustomModule(name)
    setState((prev) => ({
      ...prev,
      modules: addModule(prev.modules, newMod),
    }))
    setSelectedModuleId(newMod.id)
  }, [])

  const handleModuleDataChange = useCallback((moduleId, dataUpdates) => {
    setState((prev) => ({
      ...prev,
      modules: updateModuleData(prev.modules, moduleId, dataUpdates),
    }))
  }, [])

  const handleModuleTitleChange = useCallback((moduleId, title) => {
    setState((prev) => ({
      ...prev,
      modules: updateModuleTitle(prev.modules, moduleId, title),
    }))
  }, [])

  const handleAddListItem = useCallback((moduleId) => {
    setState((prev) => ({
      ...prev,
      modules: addListItem(prev.modules, moduleId),
    }))
  }, [])

  const handleDeleteListItem = useCallback((moduleId, itemId) => {
    setState((prev) => ({
      ...prev,
      modules: deleteListItem(prev.modules, moduleId, itemId),
    }))
  }, [])

  const handleUpdateListItem = useCallback((moduleId, itemId, updates) => {
    setState((prev) => ({
      ...prev,
      modules: updateListItem(prev.modules, moduleId, itemId, updates),
    }))
  }, [])

  const handleExportJson = useCallback(() => {
    const jsonStr = exportToJson(state)
    downloadJson(jsonStr, `resume-${Date.now()}.json`)
  }, [state])

  const handleImportClick = useCallback(() => {
    setImportError('')
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text !== 'string') {
        setImportError('无法读取文件内容')
        return
      }
      const result = parseJsonImport(text)
      if (!result.success) {
        setImportError(result.message)
        return
      }
      setState(result.data)
      setImportError('')
      if (result.data.modules && result.data.modules.length > 0) {
        setSelectedModuleId(result.data.modules[0].id)
      }
    }
    reader.onerror = () => {
      setImportError('文件读取失败')
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('无法打开打印窗口，请检查浏览器弹窗设置')
      return
    }

    const stylesheets = []
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      stylesheets.push(link.outerHTML)
    })
    const styleEls = []
    document.querySelectorAll('style').forEach((style) => {
      styleEls.push(style.outerHTML)
    })

    const previewHtml = document.querySelector('.re-a4-page')
    if (!previewHtml) {
      printWindow.close()
      return
    }

    const clone = previewHtml.cloneNode(true)
    const a4Style = 'width: 210mm; min-height: 297mm; background: #fff; padding: 15mm; box-sizing: border-box; font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11pt; line-height: 1.6; color: #1f2937; margin: 0 auto; page-break-after: always;'

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>简历导出</title>
        ${stylesheets.join('')}
        ${styleEls.join('')}
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .re-a4-page {
            ${a4Style}
            box-shadow: none !important;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            .re-a4-page,
            .re-a4-page * {
              visibility: visible;
            }
          }
        </style>
      </head>
      <body>
        ${clone.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print()
              window.close()
            }, 300)
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }, [])

  const handleReset = useCallback(() => {
    if (!window.confirm('确定要重置简历吗？所有内容将清空。')) return
    const defaultState = createDefaultResumeState()
    setState(defaultState)
    clearStorage()
    setSelectedModuleId(
      defaultState.modules && defaultState.modules.length > 0
        ? defaultState.modules[0].id
        : null
    )
  }, [])

  const selectedModule = state.modules.find((m) => m.id === selectedModuleId) || null

  return (
    <div className="re-page">
      <header className="re-header">
        <div className="re-header-left">
          <button
            type="button"
            className="re-btn re-btn-back"
            onClick={() => navigate('/')}
          >
            ← 返回
          </button>
          <h1 className="re-title">在线简历编辑器</h1>
        </div>
        <div className="re-header-actions">
          <button type="button" className="re-btn" onClick={handleReset}>
            🔄 重置
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button type="button" className="re-btn" onClick={handleImportClick}>
            📥 导入 JSON
          </button>
          <button type="button" className="re-btn" onClick={handleExportJson}>
            📤 导出 JSON
          </button>
          <button
            type="button"
            className="re-btn re-btn-primary"
            onClick={handlePrint}
          >
            🖨 导出 PDF
          </button>
        </div>
      </header>

      {importError && (
        <div style={{ padding: '8px 24px', background: '#fee2e2' }}>
          <div className="re-json-import-error" style={{ margin: 0 }}>
            导入失败：{importError}
          </div>
        </div>
      )}

      <div className="re-main">
        <ModulePanel
          modules={state.modules}
          selectedModuleId={selectedModuleId}
          onSelectModule={handleSelectModule}
          onReorderModules={handleReorderModules}
          onToggleVisibility={handleToggleVisibility}
          onDeleteModule={handleDeleteModule}
          onAddCustomModule={handleAddCustomModule}
          templateId={state.templateId}
          onTemplateChange={handleTemplateChange}
        />

        <div className="re-panel">
          <FormEditor
            selectedModule={selectedModule}
            onModuleDataChange={handleModuleDataChange}
            onModuleTitleChange={handleModuleTitleChange}
            onAddListItem={handleAddListItem}
            onDeleteListItem={handleDeleteListItem}
            onUpdateListItem={handleUpdateListItem}
          />
        </div>

        <div className="re-preview-wrapper">
          <ResumePreview
            templateId={state.templateId}
            modules={state.modules}
          />
        </div>
      </div>
    </div>
  )
}

export default ResumeEditor
