import { useEffect, useRef } from 'react'

export default function Editor({ content, onChange }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0
    }
  }, [content])

  function handleChange(e) {
    onChange(e.target.value)
  }

  return (
    <textarea
      ref={textareaRef}
      className="textarea-editor"
      value={content || ''}
      onChange={handleChange}
      placeholder="开始编写 Markdown..."
      spellCheck={false}
    />
  )
}
