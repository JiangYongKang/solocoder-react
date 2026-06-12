import { useRef } from 'react'

export default function Toolbar({
  onImport,
  onExportNote,
  onExportNotebook,
  selectedNote,
  selectedNotebookId,
  onCreateNotebook,
  onCreateFolder,
  onCreateNote,
  currentParentId,
}) {
  const fileInputRef = useRef(null)

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target.result
        onImport(content, file.name)
      }
      reader.readAsText(file)
    }
    e.target.value = ''
  }

  return (
    <>
      <div className="sidebar-actions">
        <button
          className="icon-btn"
          onClick={onCreateNotebook}
          title="新建笔记本"
        >
          📒
        </button>
        <button
          className="icon-btn"
          onClick={() => onCreateFolder(currentParentId)}
          title="新建文件夹"
        >
          📁
        </button>
        <button
          className="icon-btn"
          onClick={() => onCreateNote(currentParentId)}
          title="新建笔记"
        >
          ➕
        </button>
      </div>
      <div className="markdown-notes-toolbar">
        <button
          className="toolbar-btn"
          onClick={handleImportClick}
          title="导入 .md 文件"
        >
          导入
        </button>
        <button
          className="toolbar-btn"
          onClick={onExportNote}
          disabled={!selectedNote}
          title="导出当前笔记为 .md 文件"
        >
          导出笔记
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onExportNotebook(selectedNotebookId)}
          disabled={!selectedNotebookId}
          title="导出整个笔记本"
        >
          导出笔记本
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,text/markdown"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  )
}
