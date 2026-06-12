import { useState, useMemo } from 'react'
import { generateFullCSS } from './cssAnimationCore.js'

function highlightCSS(css) {
  if (!css) return ''

  let highlighted = css

  highlighted = highlighted.replace(
    /(@keyframes\s+)([\w-]+)/g,
    '<span class="code-keyword">$1</span><span class="code-selector">$2</span>'
  )

  highlighted = highlighted.replace(
    /(\.[\w-]+)(?=\s*\{)/g,
    '<span class="code-selector">$1</span>'
  )

  highlighted = highlighted.replace(
    /([a-z-]+)(?=\s*:)/gi,
    '<span class="code-property">$1</span>'
  )

  highlighted = highlighted.replace(
    /:\s*([^;{}]+)(?=;|})/g,
    (match, value) => {
      const trimmed = value.trim()
      if (/^-?\d+(\.\d+)?(px|%|s|deg|em|rem|vh|vw)?$/.test(trimmed)) {
        return `: <span class="code-number">${value}</span>`
      }
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) || /^(rgb|rgba|hsl|hsla)\(/.test(trimmed)) {
        return `: <span class="code-value">${value}</span>`
      }
      if (/^(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier|infinite|normal|alternate|forwards|backwards|both|none)$/.test(trimmed)) {
        return `: <span class="code-value">${value}</span>`
      }
      return `: <span class="code-value">${value}</span>`
    }
  )

  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>')
  highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')

  return highlighted
}

export default function CodeOutput({ animation }) {
  const [animationName, setAnimationName] = useState(animation.name || 'myAnimation')
  const [copied, setCopied] = useState(false)

  const cssCode = useMemo(() => {
    return generateFullCSS(animation, animationName)
  }, [animation, animationName])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className="code-section">
      <h3 className="section-title">@keyframes 代码</h3>
      <div className="code-header">
        <input
          type="text"
          value={animationName}
          onChange={(e) => setAnimationName(e.target.value)}
          placeholder="动画名称"
        />
        <button
          className={`copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? '✓ 已复制' : '📋 复制代码'}
        </button>
      </div>
      <pre
        className="code-output"
        dangerouslySetInnerHTML={{ __html: highlightCSS(cssCode) }}
      />
    </div>
  )
}
