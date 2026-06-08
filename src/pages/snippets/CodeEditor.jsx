import { useMemo } from 'react'
import { highlightCode } from './snippetsUtils'

function CodeEditor({ value, onChange, language, placeholder }) {
  const lines = useMemo(() => {
    return (value || '').split('\n')
  }, [value])

  const highlightedHtml = useMemo(() => {
    return highlightCode(value || '', language)
  }, [value, language])

  const handleScroll = (e) => {
    const lineNumbers = e.currentTarget.parentElement.querySelector('.sn-editor-lines')
    if (lineNumbers) {
      lineNumbers.scrollTop = e.currentTarget.scrollTop
    }
    const preview = e.currentTarget.parentElement.querySelector('.sn-editor-preview')
    if (preview) {
      preview.scrollTop = e.currentTarget.scrollTop
      preview.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2
      })
    }
  }

  return (
    <div className="sn-editor">
      <div className="sn-editor-lines" aria-hidden="true">
        {lines.map((_, i) => (
          <div key={i} className="sn-editor-line-num">
            {i + 1}
          </div>
        ))}
      </div>
      <pre
        className="sn-editor-preview"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: highlightedHtml || '&nbsp;' }}
      />
      <textarea
        className="sn-editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  )
}

export default CodeEditor
