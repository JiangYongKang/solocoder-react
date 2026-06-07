import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './rich-editor.css'
import {
  canRedo,
  canUndo,
  createHistory,
  exportAsHtml,
  exportAsMarkdown,
  fileToBase64,
  insertImage,
  insertLink,
  isValidUrl,
  loadFromStorage,
  markdownToHtml,
  pushHistory,
  redoHistory,
  saveToStorage,
  undoHistory,
  wrapCodeBlock,
  wrapLinePrefix,
  wrapText,
} from './editorUtils'

const TOOLBAR_GROUPS = [
  {
    name: 'history',
    items: [
      { id: 'undo', label: '撤销', icon: '↶', title: '撤销 (Ctrl+Z)' },
      { id: 'redo', label: '重做', icon: '↷', title: '重做 (Ctrl+Y)' },
    ],
  },
  {
    name: 'inline',
    items: [
      { id: 'bold', label: '加粗', icon: 'B', title: '加粗 (Ctrl+B)', style: 'font-weight: 700' },
      { id: 'italic', label: '斜体', icon: 'I', title: '斜体 (Ctrl+I)', style: 'font-style: italic' },
      { id: 'underline', label: '下划线', icon: 'U', title: '下划线 (Ctrl+U)', style: 'text-decoration: underline' },
      { id: 'strike', label: '删除线', icon: 'S', title: '删除线', style: 'text-decoration: line-through' },
    ],
  },
  {
    name: 'heading',
    items: [
      { id: 'h1', label: 'H1', title: '标题 1' },
      { id: 'h2', label: 'H2', title: '标题 2' },
      { id: 'h3', label: 'H3', title: '标题 3' },
    ],
  },
  {
    name: 'block',
    items: [
      { id: 'quote', label: '引用', icon: '❝', title: '引用' },
      { id: 'ol', label: '有序', icon: '1.', title: '有序列表' },
      { id: 'ul', label: '无序', icon: '•', title: '无序列表' },
      { id: 'code', label: '代码块', icon: '</>', title: '代码块' },
    ],
  },
  {
    name: 'insert',
    items: [
      { id: 'link', label: '链接', icon: '🔗', title: '插入超链接' },
      { id: 'image', label: '图片', icon: '🖼️', title: '插入图片' },
    ],
  },
  {
    name: 'export',
    items: [
      { id: 'export-md', label: '导出 MD', icon: '📄', title: '导出 Markdown 文件' },
      { id: 'export-html', label: '导出 HTML', icon: '🌐', title: '导出 HTML 文件' },
    ],
  },
]

const RichEditorPage = () => {
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const [history, setHistory] = useState(() => {
    const saved = loadFromStorage()
    return {
      ...createHistory(),
      present: saved,
    }
  })
  const [savedIndicator, setSavedIndicator] = useState('已保存')
  const [dialog, setDialog] = useState(null)
  const [dialogError, setDialogError] = useState('')
  const [savedAt, setSavedAt] = useState(null)

  const content = history.present
  const previewHtml = useMemo(() => markdownToHtml(content), [content])

  useEffect(() => {
    const timer = setTimeout(() => {
      const ok = saveToStorage(content)
      if (ok) {
        setSavedIndicator('已保存')
        setSavedAt(new Date())
      } else {
        setSavedIndicator('保存失败')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [content])

  const getSelection = () => {
    const el = textareaRef.current
    if (!el) return { start: 0, end: 0 }
    return { start: el.selectionStart, end: el.selectionEnd }
  }

  const setSelection = (start, end) => {
    const el = textareaRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start, end)
    })
  }

  const applyChange = (result) => {
    if (!result || result.text === content) return
    setSavedIndicator('保存中...')
    setHistory((h) => pushHistory(h, result.text))
    setSelection(result.start, result.end)
  }

  const handleUndo = () => {
    setHistory((h) => {
      const next = undoHistory(h)
      setSavedIndicator('保存中...')
      return next
    })
  }

  const handleRedo = () => {
    setHistory((h) => {
      const next = redoHistory(h)
      setSavedIndicator('保存中...')
      return next
    })
  }

  const handleTextareaChange = (e) => {
    const newText = e.target.value
    if (newText === content) return
    setSavedIndicator('保存中...')
    setHistory((h) => pushHistory(h, newText))
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      handleUndo()
      return
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault()
      handleRedo()
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      applyInline('bold')
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault()
      applyInline('italic')
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault()
      applyInline('underline')
      return
    }
  }

  const applyInline = (type) => {
    const { start, end } = getSelection()
    let result
    switch (type) {
      case 'bold':
        result = wrapText(content, start, end, '**')
        break
      case 'italic':
        result = wrapText(content, start, end, '*')
        break
      case 'underline':
        result = wrapText(content, start, end, '<u>', '</u>')
        break
      case 'strike':
        result = wrapText(content, start, end, '~~')
        break
      default:
        return
    }
    applyChange(result)
  }

  const applyHeading = (level) => {
    const { start, end } = getSelection()
    const prefix = '#'.repeat(level) + ' '
    const result = wrapLinePrefix(content, start, end, prefix)
    applyChange(result)
  }

  const applyBlock = (type) => {
    const { start, end } = getSelection()
    let prefix
    switch (type) {
      case 'quote':
        prefix = '> '
        break
      case 'ol':
        prefix = '1. '
        break
      case 'ul':
        prefix = '- '
        break
      case 'code': {
        const result = wrapCodeBlock(content, start, end)
        applyChange(result)
        return
      }
      default:
        return
    }
    const result = wrapLinePrefix(content, start, end, prefix)
    applyChange(result)
  }

  const openLinkDialog = () => {
    const { start, end } = getSelection()
    const selected = content.slice(start, end)
    setDialog({
      type: 'link',
      url: '',
      text: selected,
      start,
      end,
    })
    setDialogError('')
  }

  const openImageDialog = () => {
    const { start, end } = getSelection()
    setDialog({
      type: 'image',
      url: '',
      alt: '',
      start,
      end,
      mode: 'url',
    })
    setDialogError('')
  }

  const handleDialogChange = (key, value) => {
    setDialog((d) => (d ? { ...d, [key]: value } : d))
  }

  const confirmDialog = () => {
    if (!dialog) return
    setDialogError('')

    if (dialog.type === 'link') {
      if (!isValidUrl(dialog.url)) {
        setDialogError('请输入有效的 URL')
        return
      }
      const result = insertLink(content, dialog.start, dialog.end, dialog.url, dialog.text)
      applyChange(result)
      setDialog(null)
    } else if (dialog.type === 'image') {
      if (dialog.mode === 'url') {
        if (!isValidUrl(dialog.url)) {
          setDialogError('请输入有效的图片 URL')
          return
        }
        const result = insertImage(content, dialog.start, dialog.end, dialog.url, dialog.alt)
        applyChange(result)
        setDialog(null)
      } else {
        fileInputRef.current?.click()
      }
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !dialog) return

    if (!file.type.startsWith('image/')) {
      setDialogError('请选择图片文件')
      return
    }

    try {
      const base64 = await fileToBase64(file)
      const result = insertImage(content, dialog.start, dialog.end, base64, dialog.alt || file.name)
      applyChange(result)
      setDialog(null)
    } catch {
      setDialogError('图片读取失败')
    } finally {
      e.target.value = ''
    }
  }

  const handleToolbarClick = (itemId) => {
    switch (itemId) {
      case 'undo':
        handleUndo()
        break
      case 'redo':
        handleRedo()
        break
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
        applyInline(itemId)
        break
      case 'h1':
        applyHeading(1)
        break
      case 'h2':
        applyHeading(2)
        break
      case 'h3':
        applyHeading(3)
        break
      case 'quote':
      case 'ol':
      case 'ul':
      case 'code':
        applyBlock(itemId)
        break
      case 'link':
        openLinkDialog()
        break
      case 'image':
        openImageDialog()
        break
      case 'export-md':
        exportAsMarkdown(content)
        break
      case 'export-html':
        exportAsHtml(content)
        break
    }
  }

  const savedTimeStr = savedAt
    ? savedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : ''

  return (
    <div className="re-page">
      <div className="re-container">
        <header className="re-header">
          <Link to="/" className="re-back-link">← 返回首页</Link>
          <h1 className="re-title">富文本编辑器</h1>
          <div className="re-saved-info">
            <span className={`re-saved-dot ${savedIndicator === '保存中...' ? 'saving' : ''}`} />
            <span className="re-saved-text">
              {savedIndicator}
              {savedIndicator === '已保存' && savedTimeStr && ` · ${savedTimeStr}`}
            </span>
          </div>
        </header>

        <div className="re-toolbar">
          {TOOLBAR_GROUPS.map((group) => (
            <div key={group.name} className="re-toolbar-group">
              {group.items.map((item) => {
                let disabled = false
                if (item.id === 'undo') disabled = !canUndo(history)
                if (item.id === 'redo') disabled = !canRedo(history)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`re-toolbar-btn ${disabled ? 'disabled' : ''}`}
                    onClick={() => handleToolbarClick(item.id)}
                    title={item.title}
                    style={item.style}
                    disabled={disabled}
                  >
                    {item.icon || item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="re-editor">
          <div className="re-editor-pane">
            <div className="re-pane-header">
              <span className="re-pane-title">Markdown 编辑</span>
              <span className="re-pane-count">{content.length} 字符</span>
            </div>
            <textarea
              ref={textareaRef}
              className="re-textarea"
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              placeholder="在此输入 Markdown 内容..."
            />
          </div>
          <div className="re-preview-pane">
            <div className="re-pane-header">
              <span className="re-pane-title">实时预览</span>
            </div>
            <div
              className="re-preview-content"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {dialog && (
          <div className="re-dialog-overlay" onClick={() => setDialog(null)}>
            <div className="re-dialog" onClick={(e) => e.stopPropagation()}>
              <h3 className="re-dialog-title">
                {dialog.type === 'link' ? '插入超链接' : '插入图片'}
              </h3>

              {dialog.type === 'link' ? (
                <>
                  <div className="re-dialog-field">
                    <label className="re-dialog-label">链接文本</label>
                    <input
                      type="text"
                      className="re-dialog-input"
                      value={dialog.text}
                      placeholder="显示的文字"
                      onChange={(e) => handleDialogChange('text', e.target.value)}
                    />
                  </div>
                  <div className="re-dialog-field">
                    <label className="re-dialog-label">链接 URL *</label>
                    <input
                      type="text"
                      className="re-dialog-input"
                      value={dialog.url}
                      placeholder="https://example.com"
                      onChange={(e) => handleDialogChange('url', e.target.value)}
                      autoFocus
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="re-dialog-field">
                    <label className="re-dialog-label">插入方式</label>
                    <div className="re-radio-group">
                      <label className="re-radio">
                        <input
                          type="radio"
                          checked={dialog.mode === 'url'}
                          onChange={() => handleDialogChange('mode', 'url')}
                        />
                        粘贴 URL
                      </label>
                      <label className="re-radio">
                        <input
                          type="radio"
                          checked={dialog.mode === 'file'}
                          onChange={() => handleDialogChange('mode', 'file')}
                        />
                        上传本地图片
                      </label>
                    </div>
                  </div>
                  {dialog.mode === 'url' && (
                    <>
                      <div className="re-dialog-field">
                        <label className="re-dialog-label">图片 URL *</label>
                        <input
                          type="text"
                          className="re-dialog-input"
                          value={dialog.url}
                          placeholder="https://example.com/image.png"
                          onChange={(e) => handleDialogChange('url', e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="re-dialog-field">
                        <label className="re-dialog-label">替代文本 (alt)</label>
                        <input
                          type="text"
                          className="re-dialog-input"
                          value={dialog.alt}
                          placeholder="图片描述"
                          onChange={(e) => handleDialogChange('alt', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  {dialog.mode === 'file' && (
                    <div className="re-dialog-field">
                      <label className="re-dialog-label">替代文本 (alt)</label>
                      <input
                        type="text"
                        className="re-dialog-input"
                        value={dialog.alt}
                        placeholder="图片描述"
                        onChange={(e) => handleDialogChange('alt', e.target.value)}
                      />
                      <button
                        type="button"
                        className="re-dialog-btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ marginTop: 8 }}
                      >
                        选择图片文件
                      </button>
                    </div>
                  )}
                </>
              )}

              {dialogError && (
                <div className="re-dialog-error">{dialogError}</div>
              )}

              <div className="re-dialog-actions">
                <button
                  type="button"
                  className="re-dialog-btn-secondary"
                  onClick={() => setDialog(null)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="re-dialog-btn-primary"
                  onClick={confirmDialog}
                >
                  {dialog.type === 'image' && dialog.mode === 'file' ? '选择文件' : '确认插入'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RichEditorPage
