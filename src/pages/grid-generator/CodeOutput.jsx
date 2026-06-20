import { useState, useMemo } from 'react'
import {
  generateContainerCSS,
  generateFullCSS,
  generateHTML,
  generateFullCode,
} from './gridGeneratorCore.js'

function highlightCSS(code) {
  if (!code) return ''
  const lines = code.split('\n')
  return lines.map((line, i) => {
    let l = line
    l = l.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="gg-code-comment">$1</span>')
    l = l.replace(/^(\s*)([.#][^{]+)(\s*\{)/g, (_, s1, sel, s2) =>
      `${s1}<span class="gg-code-selector">${sel}</span>${s2}`
    )
    l = l.replace(/([a-z-]+)(\s*:)/g, (_, p, c) =>
      `<span class="gg-code-property">${p}</span>${c}`
    )
    l = l.replace(/:\s*(#([0-9a-fA-F]{3,8}))/g, ': <span class="gg-code-string">$1</span>')
    l = l.replace(/:\s*(\d+(?:\.\d+)?(?:px|%|fr|s|ms|em|rem|vh|vw)?)/g, ': <span class="gg-code-number">$1</span>')
    l = l.replace(/:\s+(start|center|end|stretch|space-(?:between|around|evenly))/g, ': <span class="gg-code-value">$1</span>')
    return <div key={i} dangerouslySetInnerHTML={{ __html: l || '&nbsp;' }} />
  })
}

function highlightHTML(code) {
  if (!code) return ''
  const lines = code.split('\n')
  return lines.map((line, i) => {
    let l = line
    l = l.replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9-]*)/g, '<span class="gg-code-keyword">$1</span>')
    l = l.replace(/(\s[a-zA-Z-]+)(=)/g, '<span class="gg-code-property">$1</span>$2')
    l = l.replace(/="([^"]*)"/g, '=<span class="gg-code-string">"$1"</span>')
    l = l.replace(/(class)/g, '<span class="gg-code-property">$1</span>')
    return <div key={i} dangerouslySetInnerHTML={{ __html: l || '&nbsp;' }} />
  })
}

export default function CodeOutput({
  config,
  onCopySuccess,
}) {
  const [tab, setTab] = useState('css')
  const [copyMode, setCopyMode] = useState('full')

  const htmlStr = useMemo(() => generateHTML(config), [config])
  const cssContainer = useMemo(() => generateContainerCSS(config), [config])
  const cssFull = useMemo(() => generateFullCSS(config), [config])
  const cssContainerOnly = useMemo(() => generateFullCSS(config, { containerOnly: true }), [config])
  const fullCode = useMemo(() => generateFullCode(config), [config])

  const displayContent = useMemo(() => {
    if (tab === 'css') {
      return copyMode === 'container' ? cssContainerOnly : cssFull
    }
    if (tab === 'html') return htmlStr
    if (tab === 'full') return fullCode
    return ''
  }, [tab, copyMode, cssContainerOnly, cssFull, htmlStr, fullCode])

  const handleCopy = async () => {
    let text = ''
    if (tab === 'css') {
      text = copyMode === 'container' ? cssContainerOnly : cssFull
    } else if (tab === 'html') {
      text = htmlStr
    } else {
      text = fullCode
    }
    try {
      await navigator.clipboard.writeText(text)
      onCopySuccess?.(`已复制 ${tab === 'css' ? (copyMode === 'container' ? '容器 CSS' : '完整 CSS') : tab === 'html' ? 'HTML' : '完整代码'}`)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      onCopySuccess?.('已复制到剪贴板')
    }
  }

  const renderedCode = useMemo(() => {
    if (tab === 'html' || tab === 'full') {
      const escaped = displayContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return highlightHTML(escaped)
    }
    return highlightCSS(displayContent)
  }, [tab, displayContent])

  return (
    <div className="gg-code-panel">
      <div className="gg-code-header">
        <div className="gg-code-tabs">
          <button
            className={`gg-code-tab ${tab === 'css' ? 'active' : ''}`}
            onClick={() => setTab('css')}
          >
            CSS
          </button>
          <button
            className={`gg-code-tab ${tab === 'html' ? 'active' : ''}`}
            onClick={() => setTab('html')}
          >
            HTML
          </button>
          <button
            className={`gg-code-tab ${tab === 'full' ? 'active' : ''}`}
            onClick={() => setTab('full')}
          >
            完整代码
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {tab === 'css' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <select
                className="gg-select"
                style={{ minWidth: 130 }}
                value={copyMode}
                onChange={(e) => setCopyMode(e.target.value)}
              >
                <option value="full">复制全部（含子项）</option>
                <option value="container">仅容器样式</option>
              </select>
            </label>
          )}
          <div className="gg-code-actions">
            <button className="gg-btn gg-btn-sm gg-btn-primary" onClick={handleCopy}>
              📋 复制
            </button>
          </div>
        </div>
      </div>
      <div className="gg-code-output">
        {renderedCode}
      </div>
    </div>
  )
}
