import { useRef, useEffect } from 'react'
import { markdownToHtml } from './wikiUtils.js'

function ToolbarButton({ onClick, title, children }) {
  return (
    <button
      type="button"
      className="wiki-editor-btn"
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

export default function MarkdownEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  searchKeyword,
  highlightTextSafe,
}) {
  const editorRef = useRef(null)
  const previewRef = useRef(null)

  const insertMarkdown = (before, after = '') => {
    const textarea = editorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end)

    onContentChange?.(newContent)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const insertBold = () => insertMarkdown('**', '**')
  const insertItalic = () => insertMarkdown('*', '*')
  const insertHeading = () => insertMarkdown('## ')
  const insertLink = () => {
    const url = prompt('请输入链接地址:', 'https://')
    if (url) {
      insertMarkdown('[', `](${url})`)
    }
  }
  const insertImage = () => {
    const url = prompt('请输入图片地址:', 'https://')
    if (url) {
      insertMarkdown('![', `](${url})`)
    }
  }
  const insertCodeBlock = () => insertMarkdown('```js\n', '\n```')
  const insertInlineCode = () => insertMarkdown('`', '`')
  const insertList = () => insertMarkdown('- ')
  const insertTable = () => {
    const table = `\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n`
    insertMarkdown(table)
  }
  const insertQuote = () => insertMarkdown('> ')

  useEffect(() => {
    if (searchKeyword && previewRef.current) {
      const firstMatch = previewRef.current.querySelector('.highlight')
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [searchKeyword, content])

  const renderContent = searchKeyword
    ? highlightTextSafe(content, searchKeyword)
    : markdownToHtml(content)

  return (
    <div className="wiki-editor-container">
      <div className="wiki-editor-panel">
        <div className="wiki-editor-toolbar">
          <ToolbarButton onClick={insertBold} title="加粗 (Ctrl+B)">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={insertItalic} title="斜体 (Ctrl+I)">
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton onClick={insertHeading} title="标题">
            H2
          </ToolbarButton>
          <ToolbarButton onClick={insertList} title="无序列表">
            • 列表
          </ToolbarButton>
          <ToolbarButton onClick={insertLink} title="链接">
            🔗 链接
          </ToolbarButton>
          <ToolbarButton onClick={insertImage} title="图片">
            🖼️ 图片
          </ToolbarButton>
          <ToolbarButton onClick={insertInlineCode} title="行内代码">
            &lt;/&gt;
          </ToolbarButton>
          <ToolbarButton onClick={insertCodeBlock} title="代码块">
            ```
          </ToolbarButton>
          <ToolbarButton onClick={insertTable} title="表格">
            ⊞ 表格
          </ToolbarButton>
          <ToolbarButton onClick={insertQuote} title="引用">
            " 引用
          </ToolbarButton>
        </div>

        <input
          type="text"
          className="wiki-title-input"
          placeholder="页面标题"
          value={title || ''}
          onChange={(e) => onTitleChange?.(e.target.value)}
        />

        <textarea
          ref={editorRef}
          className="wiki-markdown-editor"
          placeholder="在此输入 Markdown 内容..."
          value={content || ''}
          onChange={(e) => onContentChange?.(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div
        className="wiki-preview-panel"
        ref={previewRef}
        dangerouslySetInnerHTML={{
          __html: searchKeyword
            ? renderContent
            : markdownToHtml(content),
        }}
      />
    </div>
  )
}
