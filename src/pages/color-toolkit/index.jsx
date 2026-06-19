import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadImageAndExtractColors } from './brandColorExtractor.js'
import './color-toolkit.css'
import { simulateColorBlindness } from './colorBlindness.js'
import {
    getContrastColor,
    parseColorInput,
} from './colorUtils.js'
import {
    CLIPBOARD_DELAY,
    DEFAULT_BASE_COLOR,
    DEFAULT_COLORBLIND_COLOR,
    DEFAULT_GRADIENT_END,
    DEFAULT_GRADIENT_START,
    PALETTE_TYPES,
    TOOL_SOURCES,
    TOOL_TABS,
} from './constants.js'
import {
  generateGradientCSS,
  generateFullGradientCSS,
  GRADIENT_TYPES,
  LINEAR_DIRECTIONS,
  isValidDirection,
} from './gradientGenerator.js'
import { generateAllPalettes } from './paletteGenerator.js'
import {
    addFavorite,
    clearFavorites,
    copyAllHex,
    deleteFavorite,
    downloadFavorites,
    formatDate,
    isFavorite,
    loadFavorites,
    reorderFavorites,
    saveFavorites,
} from './storage.js'

const SortableFavoriteItem = ({ item, onDelete, onCopy, isFav, onToggleFavorite }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="ct-favorite-item"
    >
      <div
        className="ct-favorite-drag-handle"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </div>
      <div
        className="ct-favorite-color"
        style={{ backgroundColor: item.hex }}
      />
      <div className="ct-favorite-info">
        <div className="ct-favorite-hex">{item.hex}</div>
        <div className="ct-favorite-meta">
          <span className="ct-favorite-source">{item.source}</span>
          <span className="ct-favorite-date">{formatDate(item.createdAt)}</span>
        </div>
      </div>
      <div className="ct-favorite-actions">
        <button
          className={`ct-btn ct-btn-sm ${isFav ? 'ct-btn-favorited' : ''}`}
          onClick={() => onToggleFavorite(item.hex, item.source)}
          title={isFav ? '取消收藏' : '收藏'}
        >
          {isFav ? '★' : '☆'}
        </button>
        <button
          className="ct-btn ct-btn-sm"
          onClick={() => onCopy(item.hex)}
          title="复制 HEX"
        >
          📋
        </button>
        <button
          className="ct-btn ct-btn-sm ct-btn-danger"
          onClick={() => onDelete(item.id)}
          title="删除"
        >
          ×
        </button>
      </div>
    </div>
  )
}

const ColorToolkitPage = () => {
  const [activeTab, setActiveTab] = useState('palette')
  const [favorites, setFavorites] = useState(() => loadFavorites())
  const [copiedHex, setCopiedHex] = useState(null)

  const [baseColor, setBaseColor] = useState(DEFAULT_BASE_COLOR)
  const [paletteType, setPaletteType] = useState('complementary')

  const [converterInput, setConverterInput] = useState(DEFAULT_BASE_COLOR)

  const [colorblindColor, setColorblindColor] = useState(DEFAULT_COLORBLIND_COLOR)
  const colorblindCanvasRef = useRef(null)

  const [gradientStart, setGradientStart] = useState(DEFAULT_GRADIENT_START)
  const [gradientEnd, setGradientEnd] = useState(DEFAULT_GRADIENT_END)
  const [gradientType, setGradientType] = useState(GRADIENT_TYPES.LINEAR)
  const [gradientDirection, setGradientDirection] = useState('to right')
  const [gradientCopied, setGradientCopied] = useState(false)

  const [brandColors, setBrandColors] = useState([])
  const [brandExtracting, setBrandExtracting] = useState(false)
  const [brandError, setBrandError] = useState('')
  const brandFileInputRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  const palettes = useMemo(() => {
    return generateAllPalettes(baseColor)
  }, [baseColor])

  const converterResult = useMemo(() => {
    return parseColorInput(converterInput)
  }, [converterInput])

  const colorblindResult = useMemo(() => {
    return simulateColorBlindness(colorblindColor)
  }, [colorblindColor])

  useEffect(() => {
    if (!colorblindCanvasRef.current || !colorblindResult) return

    const canvas = colorblindCanvasRef.current
    const ctx = canvas.getContext('2d')
    const blockWidth = canvas.width / 4
    const blockHeight = canvas.height

    ctx.fillStyle = colorblindResult.original.hex
    ctx.fillRect(0, 0, blockWidth, blockHeight)

    const types = ['protanopia', 'deuteranopia', 'tritanopia']
    types.forEach((type, index) => {
      ctx.fillStyle = colorblindResult[type].hex
      ctx.fillRect((index + 1) * blockWidth, 0, blockWidth, blockHeight)
    })
  }, [colorblindResult])

  const gradientCSS = useMemo(() => {
    return generateGradientCSS(gradientStart, gradientEnd, gradientType, gradientDirection)
  }, [gradientStart, gradientEnd, gradientType, gradientDirection])

  const gradientFullCSS = useMemo(() => {
    return generateFullGradientCSS(gradientStart, gradientEnd, gradientType, gradientDirection)
  }, [gradientStart, gradientEnd, gradientType, gradientDirection])

  const gradientDirectionWarning = useMemo(() => {
    if (gradientType !== GRADIENT_TYPES.LINEAR) return false
    return !isValidDirection(gradientDirection)
  }, [gradientType, gradientDirection])

  const handleCopyToClipboard = useCallback(async (hex) => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopiedHex(hex)
      setTimeout(() => setCopiedHex(null), CLIPBOARD_DELAY)
    } catch {
      // no-op
    }
  }, [])

  const handleToggleFavorite = useCallback((hex, source) => {
    if (isFavorite(hex, favorites)) {
      const fav = favorites.find((f) => f.hex.toUpperCase() === hex.toUpperCase())
      if (fav) {
        setFavorites(deleteFavorite(fav.id, favorites))
      }
    } else {
      const result = addFavorite(hex, source, favorites)
      if (result.added) {
        setFavorites(result.favorites)
      }
    }
  }, [favorites])

  const handleDeleteFavorite = useCallback((id) => {
    setFavorites(deleteFavorite(id, favorites))
  }, [favorites])

  const handleClearFavorites = useCallback(() => {
    setFavorites(clearFavorites())
  }, [])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = favorites.findIndex((f) => f.id === active.id)
    const newIndex = favorites.findIndex((f) => f.id === over.id)
    setFavorites(reorderFavorites(favorites, oldIndex, newIndex))
  }, [favorites])

  const handleExportFavorites = useCallback(() => {
    downloadFavorites(favorites)
  }, [favorites])

  const handleCopyAllHex = useCallback(async () => {
    const hexes = copyAllHex(favorites)
    try {
      await navigator.clipboard.writeText(hexes)
      setCopiedHex('__all__')
      setTimeout(() => setCopiedHex(null), CLIPBOARD_DELAY)
    } catch {
      // no-op
    }
  }, [favorites])

  const handleCopyGradientCSS = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(gradientFullCSS)
      setGradientCopied(true)
      setTimeout(() => setGradientCopied(false), CLIPBOARD_DELAY)
    } catch {
      // no-op
    }
  }, [gradientFullCSS])

  const handleBrandFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBrandError('')
    setBrandExtracting(true)

    try {
      const colors = await loadImageAndExtractColors(file, 5)
      setBrandColors(colors)
    } catch (err) {
      setBrandError(err.message || '品牌色提取失败')
      setBrandColors([])
    } finally {
      setBrandExtracting(false)
    }

    if (brandFileInputRef.current) {
      brandFileInputRef.current.value = ''
    }
  }, [])

  const renderColorSwatch = (hex, source, showFavorite = true) => {
    const contrastColor = getContrastColor(hex)
    const fav = isFavorite(hex, favorites)

    return (
      <div
        key={hex}
        className="ct-swatch"
        style={{ backgroundColor: hex }}
        onClick={() => handleCopyToClipboard(hex)}
      >
        <span className="ct-swatch-hex" style={{ color: contrastColor }}>
          {copiedHex === hex ? '已复制 ✓' : hex}
        </span>
        {showFavorite && (
          <button
            className={`ct-swatch-fav ${fav ? 'active' : ''}`}
            style={{ color: contrastColor }}
            onClick={(e) => {
              e.stopPropagation()
              handleToggleFavorite(hex, source)
            }}
          >
            {fav ? '★' : '☆'}
          </button>
        )}
      </div>
    )
  }

  const renderPaletteGenerator = () => (
    <div className="ct-section">
      <div className="ct-section-header">
        <h3 className="ct-section-title">调色板生成</h3>
        <div className="ct-color-input-group">
          <label className="ct-label">基准色：</label>
          <input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value.toUpperCase())}
            className="ct-color-picker"
          />
          <input
            type="text"
            value={baseColor}
            onChange={(e) => {
              const val = e.target.value.trim().toUpperCase()
              if (val.startsWith('#') || val.length === 0) {
                setBaseColor(val)
              }
            }}
            className="ct-input"
            placeholder="#FF5733"
          />
        </div>
      </div>

      <div className="ct-tab-row">
        {PALETTE_TYPES.map((type) => (
          <button
            key={type.key}
            className={`ct-tab-btn ${paletteType === type.key ? 'active' : ''}`}
            onClick={() => setPaletteType(type.key)}
          >
            {type.name}
          </button>
        ))}
      </div>

      {PALETTE_TYPES.map((type) => (
        paletteType === type.key && (
          <div key={type.key} className="ct-palette-section">
            <p className="ct-palette-desc">{type.description}</p>
            <div className="ct-swatch-row">
              {palettes[type.key].map((color, idx) => (
                renderColorSwatch(color.hex, TOOL_SOURCES.PALETTE)
              ))}
            </div>
          </div>
        )
      ))}

      <div className="ct-all-palettes">
        <h4 className="ct-subtitle">全部调色板预览</h4>
        {PALETTE_TYPES.map((type) => (
          <div key={type.key} className="ct-mini-palette">
            <span className="ct-mini-palette-label">{type.name}</span>
            <div className="ct-mini-swatches">
              {palettes[type.key].map((color) => (
                <div
                  key={color.hex}
                  className="ct-mini-swatch"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderConverter = () => (
    <div className="ct-section">
      <div className="ct-section-header">
        <h3 className="ct-section-title">HEX / RGB / HSL 互转</h3>
      </div>

      <div className="ct-converter-input">
        <label className="ct-label">输入颜色值：</label>
        <input
          type="text"
          value={converterInput}
          onChange={(e) => setConverterInput(e.target.value)}
          className={`ct-input ct-input-lg ${!converterResult.valid && converterInput ? 'ct-input-error' : ''}`}
          placeholder="#FF5733 或 rgb(255, 87, 51) 或 hsl(9, 100%, 60%)"
        />
        {!converterResult.valid && converterInput && (
          <div className="ct-error-msg">{converterResult.error}</div>
        )}
        <div className="ct-format-hint">
          <span>HEX: #FF5733 或 #F53</span>
          <span>RGB: rgb(255, 87, 51)</span>
          <span>HSL: hsl(9, 100%, 60%)</span>
        </div>
      </div>

      {converterResult.valid && (
        <div className="ct-converter-result">
          <div
            className="ct-converter-preview"
            style={{ backgroundColor: converterResult.hex }}
          >
            <span style={{ color: getContrastColor(converterResult.hex) }}>
              {converterResult.hex}
            </span>
          </div>

          <div className="ct-converter-formats">
            <div className="ct-format-row">
              <span className="ct-format-label">HEX</span>
              <code className="ct-format-value">{converterResult.hex}</code>
              <button
                className="ct-btn ct-btn-sm"
                onClick={() => handleCopyToClipboard(converterResult.hex)}
              >
                {copiedHex === converterResult.hex ? '已复制 ✓' : '复制'}
              </button>
              <button
                className={`ct-btn ct-btn-sm ${isFavorite(converterResult.hex, favorites) ? 'ct-btn-favorited' : ''}`}
                onClick={() => handleToggleFavorite(converterResult.hex, TOOL_SOURCES.CONVERTER)}
              >
                {isFavorite(converterResult.hex, favorites) ? '★' : '☆'}
              </button>
            </div>

            <div className="ct-format-row">
              <span className="ct-format-label">RGB</span>
              <code className="ct-format-value">{converterResult.rgbString}</code>
              <button
                className="ct-btn ct-btn-sm"
                onClick={() => handleCopyToClipboard(converterResult.rgbString)}
              >
                {copiedHex === converterResult.rgbString ? '已复制 ✓' : '复制'}
              </button>
            </div>

            <div className="ct-format-row">
              <span className="ct-format-label">HSL</span>
              <code className="ct-format-value">{converterResult.hslString}</code>
              <button
                className="ct-btn ct-btn-sm"
                onClick={() => handleCopyToClipboard(converterResult.hslString)}
              >
                {copiedHex === converterResult.hslString ? '已复制 ✓' : '复制'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderColorblind = () => (
    <div className="ct-section">
      <div className="ct-section-header">
        <h3 className="ct-section-title">色盲模拟预览</h3>
        <div className="ct-color-input-group">
          <label className="ct-label">选择颜色：</label>
          <input
            type="color"
            value={colorblindColor}
            onChange={(e) => setColorblindColor(e.target.value.toUpperCase())}
            className="ct-color-picker"
          />
          <input
            type="text"
            value={colorblindColor}
            onChange={(e) => {
              const val = e.target.value.trim().toUpperCase()
              if (val.startsWith('#') || val.length === 0) {
                setColorblindColor(val)
              }
            }}
            className="ct-input"
            placeholder="#FF5733"
          />
        </div>
      </div>

      {colorblindResult && (
        <div className="ct-colorblind-container">
          <canvas
            ref={colorblindCanvasRef}
            width={400}
            height={200}
            className="ct-colorblind-canvas"
          />

          <div className="ct-colorblind-legend">
            <div className="ct-colorblind-item">
              <div
                className="ct-colorblind-swatch"
                style={{ backgroundColor: colorblindResult.original.hex }}
              />
              <div className="ct-colorblind-info">
                <div className="ct-colorblind-name">原色</div>
                <div className="ct-colorblind-hex">{colorblindResult.original.hex}</div>
              </div>
              <button
                className={`ct-btn ct-btn-sm ${isFavorite(colorblindResult.original.hex, favorites) ? 'ct-btn-favorited' : ''}`}
                onClick={() => handleToggleFavorite(colorblindResult.original.hex, TOOL_SOURCES.COLORBLIND)}
              >
                {isFavorite(colorblindResult.original.hex, favorites) ? '★' : '☆'}
              </button>
            </div>

            {['protanopia', 'deuteranopia', 'tritanopia'].map((type) => (
              <div key={type} className="ct-colorblind-item">
                <div
                  className="ct-colorblind-swatch"
                  style={{ backgroundColor: colorblindResult[type].hex }}
                />
                <div className="ct-colorblind-info">
                  <div className="ct-colorblind-name">{colorblindResult[type].name}</div>
                  <div className="ct-colorblind-hex">{colorblindResult[type].hex}</div>
                </div>
                <button
                  className={`ct-btn ct-btn-sm ${isFavorite(colorblindResult[type].hex, favorites) ? 'ct-btn-favorited' : ''}`}
                  onClick={() => handleToggleFavorite(colorblindResult[type].hex, TOOL_SOURCES.COLORBLIND)}
                >
                  {isFavorite(colorblindResult[type].hex, favorites) ? '★' : '☆'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderGradient = () => (
    <div className="ct-section">
      <div className="ct-section-header">
        <h3 className="ct-section-title">渐变色生成 CSS 代码</h3>
      </div>

      <div className="ct-gradient-controls">
        <div className="ct-gradient-colors">
          <div className="ct-color-input-group">
            <label className="ct-label">起始色：</label>
            <input
              type="color"
              value={gradientStart}
              onChange={(e) => setGradientStart(e.target.value.toUpperCase())}
              className="ct-color-picker"
            />
            <input
              type="text"
              value={gradientStart}
              onChange={(e) => {
                const val = e.target.value.trim().toUpperCase()
                if (val.startsWith('#') || val.length === 0) {
                  setGradientStart(val)
                }
              }}
              className="ct-input"
              placeholder="#FF5733"
            />
          </div>

          <div className="ct-color-input-group">
            <label className="ct-label">结束色：</label>
            <input
              type="color"
              value={gradientEnd}
              onChange={(e) => setGradientEnd(e.target.value.toUpperCase())}
              className="ct-color-picker"
            />
            <input
              type="text"
              value={gradientEnd}
              onChange={(e) => {
                const val = e.target.value.trim().toUpperCase()
                if (val.startsWith('#') || val.length === 0) {
                  setGradientEnd(val)
                }
              }}
              className="ct-input"
              placeholder="#33FF57"
            />
          </div>
        </div>

        <div className="ct-gradient-type">
          <span className="ct-label">渐变类型：</span>
          <button
            className={`ct-tab-btn ${gradientType === GRADIENT_TYPES.LINEAR ? 'active' : ''}`}
            onClick={() => setGradientType(GRADIENT_TYPES.LINEAR)}
          >
            线性渐变
          </button>
          <button
            className={`ct-tab-btn ${gradientType === GRADIENT_TYPES.RADIAL ? 'active' : ''}`}
            onClick={() => setGradientType(GRADIENT_TYPES.RADIAL)}
          >
            径向渐变
          </button>
        </div>

        {gradientType === GRADIENT_TYPES.LINEAR && (
          <div className="ct-gradient-directions">
            <span className="ct-label">方向：</span>
            <div className="ct-direction-grid">
              {LINEAR_DIRECTIONS.map((dir) => (
                <button
                  key={dir.key}
                  className={`ct-direction-btn ${gradientDirection === dir.key ? 'active' : ''}`}
                  onClick={() => setGradientDirection(dir.key)}
                >
                  {dir.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {gradientDirectionWarning && (
        <div className="ct-warning-msg">
          方向参数无效，已回退到默认方向「向右」
        </div>
      )}

      <div
        className="ct-gradient-preview"
        style={{ background: gradientCSS }}
      />

      <div className="ct-gradient-output">
        <code className="ct-gradient-code">{gradientFullCSS}</code>
        <div className="ct-gradient-actions">
          <button
            className="ct-btn ct-btn-primary"
            onClick={handleCopyGradientCSS}
          >
            {gradientCopied ? '已复制 ✓' : '复制 CSS'}
          </button>
          <button
            className={`ct-btn ${isFavorite(gradientStart, favorites) ? 'ct-btn-favorited' : ''}`}
            onClick={() => handleToggleFavorite(gradientStart, TOOL_SOURCES.GRADIENT)}
          >
            收藏起始色 {isFavorite(gradientStart, favorites) ? '★' : '☆'}
          </button>
          <button
            className={`ct-btn ${isFavorite(gradientEnd, favorites) ? 'ct-btn-favorited' : ''}`}
            onClick={() => handleToggleFavorite(gradientEnd, TOOL_SOURCES.GRADIENT)}
          >
            收藏结束色 {isFavorite(gradientEnd, favorites) ? '★' : '☆'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderBrandExtractor = () => (
    <div className="ct-section">
      <div className="ct-section-header">
        <h3 className="ct-section-title">品牌色提取</h3>
      </div>

      <div className="ct-brand-upload">
        <input
          ref={brandFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleBrandFileUpload}
          style={{ display: 'none' }}
        />
        <button
          className="ct-btn ct-btn-primary ct-btn-lg"
          onClick={() => brandFileInputRef.current?.click()}
          disabled={brandExtracting}
        >
          {brandExtracting ? '提取中...' : '上传 Logo / 图片'}
        </button>
        <p className="ct-brand-hint">支持 png、jpg、webp 格式</p>
        {brandError && <div className="ct-error-msg">{brandError}</div>}
      </div>

      {brandColors.length > 0 && (
        <div className="ct-brand-result">
          <h4 className="ct-subtitle">提取的品牌色</h4>
          <div className="ct-brand-colors">
            {brandColors.map((color, index) => (
              <div key={color.hex} className="ct-brand-color">
                <div
                  className="ct-brand-swatch"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleCopyToClipboard(color.hex)}
                >
                  <span style={{ color: getContrastColor(color.hex) }}>
                    {copiedHex === color.hex ? '已复制 ✓' : color.hex}
                  </span>
                </div>
                <div className="ct-brand-info">
                  <div className="ct-brand-percentage">{color.percentage}%</div>
                </div>
                <button
                  className={`ct-btn ct-btn-sm ${isFavorite(color.hex, favorites) ? 'ct-btn-favorited' : ''}`}
                  onClick={() => handleToggleFavorite(color.hex, TOOL_SOURCES.BRAND)}
                >
                  {isFavorite(color.hex, favorites) ? '★' : '☆'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderFavorites = () => (
    <div className="ct-section">
      <div className="ct-section-header">
        <h3 className="ct-section-title">收藏管理</h3>
        <div className="ct-favorites-actions">
          <button
            className="ct-btn"
            onClick={handleExportFavorites}
            disabled={favorites.length === 0}
          >
            导出收藏 📥
          </button>
          <button
            className="ct-btn"
            onClick={handleCopyAllHex}
            disabled={favorites.length === 0}
          >
            {copiedHex === '__all__' ? '已复制 ✓' : '复制全部 HEX'}
          </button>
          <button
            className="ct-btn ct-btn-danger"
            onClick={handleClearFavorites}
            disabled={favorites.length === 0}
          >
            一键清空
          </button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="ct-empty">
          <p>暂无收藏的颜色</p>
          <p className="ct-empty-hint">点击色块旁的 ☆ 按钮添加收藏</p>
        </div>
      ) : (
        <div className="ct-favorites-list">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={favorites.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {favorites.map((item) => (
                <SortableFavoriteItem
                  key={item.id}
                  item={item}
                  onDelete={handleDeleteFavorite}
                  onCopy={handleCopyToClipboard}
                  isFav={isFavorite(item.hex, favorites)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )

  return (
    <div className="ct-page">
      <div className="ct-container">
        <header className="ct-header">
          <Link to="/" className="ct-back-link">← 返回首页</Link>
          <h1 className="ct-title">颜色工具集</h1>
          <div className="ct-stats">
            <span className="ct-stat-badge">
              已收藏 {favorites.length} 个颜色
            </span>
          </div>
        </header>

        <div className="ct-tool-tabs">
          {TOOL_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ct-tool-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="ct-tab-icon">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="ct-content">
          {activeTab === 'palette' && renderPaletteGenerator()}
          {activeTab === 'converter' && renderConverter()}
          {activeTab === 'colorblind' && renderColorblind()}
          {activeTab === 'gradient' && renderGradient()}
          {activeTab === 'brand' && renderBrandExtractor()}
          {activeTab === 'favorites' && renderFavorites()}
        </div>
      </div>
    </div>
  )
}

export default ColorToolkitPage
