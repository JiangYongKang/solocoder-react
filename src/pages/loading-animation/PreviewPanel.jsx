import { useMemo } from 'react'
import { buildHTML, generateFullCSS } from './loadingAnimationCore.js'
import { BACKGROUND_THEMES, PREVIEW_SIZES, ANIMATION_TYPES } from './constants.js'

function AnimationRenderer({ animationType, config, isPlaying }) {
  const html = useMemo(() => buildHTML(animationType, config), [animationType, config])
  const css = useMemo(() => generateFullCSS(animationType, config, 'preview'), [animationType, config])

  if (!animationType) {
    return <div className="preview-empty">选择左侧动画类型开始预览</div>
  }

  return (
    <div className={`preview-renderer ${!isPlaying ? 'paused' : ''}`}>
      <style>{css}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

function CompositionRenderer({ elements, isPlaying }) {
  if (!elements || elements.length === 0) {
    return <div className="preview-empty">从左侧拖拽动画元素到画布</div>
  }

  return (
    <div className={`composition-preview ${!isPlaying ? 'paused' : ''}`}>
      {elements.map((elem) => (
        <div
          key={elem.compositionId}
          className="composition-element"
          style={{
            position: 'absolute',
            left: `${elem.position.x}%`,
            top: `${elem.position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <AnimationRenderer
            animationType={elem.animationType}
            config={elem.config}
            isPlaying={isPlaying}
          />
        </div>
      ))}
    </div>
  )
}

export default function PreviewPanel({
  animationType,
  config,
  isPlaying,
  onTogglePlay,
  previewSize,
  onPreviewSizeChange,
  backgroundTheme,
  onBackgroundChange,
  mode,
  compositionElements,
}) {
  const size = PREVIEW_SIZES[previewSize]
  const theme = BACKGROUND_THEMES[backgroundTheme]
  const animType = ANIMATION_TYPES[animationType]

  const gridStyle = {
    backgroundImage: `
      linear-gradient(${theme.grid} 1px, transparent 1px),
      linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
  }

  return (
    <div className="preview-panel">
      <div className="preview-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">预览尺寸:</span>
          {Object.entries(PREVIEW_SIZES).map(([key, value]) => (
            <button
              key={key}
              className={`toolbar-btn ${previewSize === key ? 'active' : ''}`}
              onClick={() => onPreviewSizeChange(key)}
            >
              {value.label}
            </button>
          ))}
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">背景:</span>
          {Object.entries(BACKGROUND_THEMES).map(([key, value]) => (
            <button
              key={key}
              className={`toolbar-btn ${backgroundTheme === key ? 'active' : ''}`}
              onClick={() => onBackgroundChange(key)}
            >
              {value.label}
            </button>
          ))}
        </div>

        <div className="toolbar-group">
          <button
            className="toolbar-btn play-btn"
            onClick={onTogglePlay}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
        </div>
      </div>

      <div
        className="preview-container"
        style={{
          width: size.width,
          height: size.height,
          backgroundColor: theme.bg,
          ...gridStyle,
        }}
      >
        {mode === 'composition' ? (
          <CompositionRenderer
            elements={compositionElements}
            isPlaying={isPlaying}
          />
        ) : (
          <AnimationRenderer
            animationType={animationType}
            config={config}
            isPlaying={isPlaying}
          />
        )}
      </div>

      {animationType && mode === 'single' && (
        <div className="preview-info">
          <span className="preview-type">{animType?.name}</span>
        </div>
      )}
    </div>
  )
}
