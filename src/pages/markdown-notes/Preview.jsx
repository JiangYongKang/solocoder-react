import { useEffect, useRef } from 'react'
import { renderMarkdown } from './noteUtils.js'

export default function Preview({ content, data, searchQuery, onNoteLinkClick }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    let html = renderMarkdown(content, data, onNoteLinkClick)

    if (searchQuery && searchQuery.trim()) {
      html = html.replace(
        /\{\{\{HIGHLIGHT\}\}([\s\S]*?)\{\{\{\/HIGHLIGHT\}\}/g,
        '<span class="highlight">$1</span>'
      )
    }

    containerRef.current.innerHTML = html

    const links = containerRef.current.querySelectorAll('a.internal-link')
    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const noteId = link.dataset.noteId
        const noteTitle = link.dataset.noteTitle
        const createNew = link.dataset.createNew === 'true'
        if (onNoteLinkClick) {
          onNoteLinkClick({ noteId, noteTitle, createNew })
        }
      })
    })
  }, [content, data, searchQuery, onNoteLinkClick])

  return <div ref={containerRef} className="preview-panel" />
}
