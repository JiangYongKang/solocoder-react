import { useState, useMemo } from 'react'
import { generateFullCSS, generateFullHTML, generateCompositionCSS, generateCompositionHTML } from './loadingAnimationCore.js'

function highlightCSS(css) {
  if (!css) return ''

  let highlighted = css
    .replace(/\/\*[\s\S]*?\*\//g, '<span class="code-comment">$&</span>')
    .replace(/<!--[\s\S]*?-->/g, '<span class="code-comment">$&</span>')
    .replace(/(@keyframes\s+)([\w-]+)/g, '$1<span class="code-keyword">$2</span>')
    .replace(/(@\w+)/g, '<span class="code-atrule">$1</span>')
    .replace(/([.#][\w-]+)/g, '<span class="code-selector">$1</span>')
    .replace(/(\b\w[\w-]*)(?=\s*:)/g, '<span class="code-property">$1</span>')
    .replace(/:\s*([^;{}]+);/g, ': <span class="code-value">$1</span>;')
    .replace(/(#[0-9a-fA-F]{3,8})/g, '<span class="code-color">$1</span>')
    .replace(/(\d+(\.\d+)?(px|s|%|deg|ms))/g, '<span class="code-number">$1</span>')
    .replace(/\n/g, '<br/>')
    .replace(/ {2}/g, '&nbsp;&nbsp;')

  return highlighted
}

function CodeBlock({ code, language }) {
  const highlighted = useMemo(() => highlightCSS(code), [code])

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">{language}</span>
      </div>
      <pre className="code-content">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  )
}

export default function CodeOutput({
  animationType,
  config,
  mode,
  compositionElements,
}) {
  const [copiedCSS, setCopiedCSS] = useState(false)
  const [copiedHTML, setCopiedHTML] = useState(false)

  const cssCode = useMemo(() => {
    if (mode === 'composition') {
      return generateCompositionCSS(compositionElements)
    }
    return generateFullCSS(animationType, config)
  }, [animationType, config, mode, compositionElements])

  const htmlCode = useMemo(() => {
    if (mode === 'composition') {
      return generateCompositionHTML(compositionElements)
    }
    return generateFullHTML(animationType, config)
  }, [animationType, config, mode, compositionElements])

  const copyToClipboard = async (text, setCopied) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  if (!cssCode && !htmlCode) {
    return (
      <div className="code-output empty">
        <p>选择动画类型后显示代码</p>
      </div>
    )
  }

  return (
    <div className="code-output">
      <h3 className="panel-title">代码输出</h3>

      <div className="code-actions">
        <button
          className={`copy-btn ${copiedCSS ? 'copied' : ''}`}
          onClick={() => copyToClipboard(cssCode, setCopiedCSS)}
        >
          {copiedCSS ? '✓ 已复制' : '📋 复制 CSS'}
        </button>
        <button
          className={`copy-btn ${copiedHTML ? 'copied' : ''}`}
          onClick={() => copyToClipboard(htmlCode, setCopiedHTML)}
        >
          {copiedHTML ? '✓ 已复制' : '📋 复制 HTML'}
        </button>
      </div>

      <div className="code-sections">
        <CodeBlock code={cssCode} language="CSS" />
        <CodeBlock code={htmlCode} language="HTML" />
      </div>
    </div>
  )
}
