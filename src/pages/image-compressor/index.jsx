import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './image-compressor.css'
import {
  OUTPUT_FORMATS,
  FORMAT_NAMES,
  COMPRESSION_PRESETS,
  DEFAULT_PARAMS,
  PARAM_RANGES,
  MAX_HISTORY_ITEMS,
  PROCESSING_STATUS,
} from './constants.js'
import {
  formatFileSize,
  calculateSavingsPercent,
  calculateTotalSavings,
  calculateScaledDimensions,
  calculateAspectRatioDimensions,
  generateCompressedFileName,
  validateImageType,
  validateParams,
  fileToDataUrl,
  loadImage,
  createImageItem,
  compressImage,
  downloadBlob,
  applyPreset,
  generateId,
} from './compressorUtils.js'
import {
  getHistory,
  addToHistory,
  addBatchToHistory,
  clearHistory,
  formatHistoryItemDisplay,
} from './storage.js'

function ImageCompressorPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const compareSliderRef = useRef(null)

  const [images, setImages] = useState([])
  const [selectedImageId, setSelectedImageId] = useState(null)
  const [params, setParams] = useState({ ...DEFAULT_PARAMS })
  const [activePreset, setActivePreset] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [history, setHistory] = useState([])
  const [compareMode, setCompareMode] = useState('side-by-side')
  const [dividerPosition, setDividerPosition] = useState(50)
  const [isDraggingDivider, setIsDraggingDivider] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const selectedImage = images.find((img) => img.id === selectedImageId)
  const isBatchMode = images.length > 1

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleFiles = useCallback(async (files) => {
    const validFiles = Array.from(files).filter(validateImageType)
    if (validFiles.length === 0) {
      alert('请选择 JPG、PNG 或 WebP 格式的图片')
      return
    }

    const newImages = []
    for (const file of validFiles) {
      try {
        const dataUrl = await fileToDataUrl(file)
        const img = await loadImage(dataUrl)
        const imageItem = createImageItem(file, dataUrl, img.width, img.height)
        newImages.push(imageItem)
      } catch (err) {
        console.error('加载图片失败:', err)
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages])
      if (!selectedImageId || images.length === 0) {
        setSelectedImageId(newImages[0].id)
      }
    }
  }, [selectedImageId, images.length])

  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    e.target.value = ''
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDeleteImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
    if (selectedImageId === id) {
      const remaining = images.filter((img) => img.id !== id)
      setSelectedImageId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleParamChange = (key, value) => {
    setActivePreset(null)
    setParams((prev) => {
      const newParams = { ...prev, [key]: value }
      if (key === 'width' && prev.maintainAspectRatio && selectedImage) {
        const dims = calculateAspectRatioDimensions(
          selectedImage.originalWidth,
          selectedImage.originalHeight,
          value,
          true
        )
        newParams.height = dims.height
      }
      if (key === 'height' && prev.maintainAspectRatio && selectedImage) {
        const dims = calculateAspectRatioDimensions(
          selectedImage.originalWidth,
          selectedImage.originalHeight,
          value,
          false
        )
        newParams.width = dims.width
      }
      return validateParams(newParams)
    })
  }

  const handlePresetClick = (presetKey) => {
    const presetParams = applyPreset(presetKey, params.format)
    if (presetParams) {
      setActivePreset(presetKey)
      setParams(presetParams)
    }
  }

  const handleCompressSingle = useCallback(async () => {
    if (!selectedImage) return

    try {
      setIsProcessing(true)
      setImages((prev) =>
        prev.map((img) =>
          img.id === selectedImageId
            ? { ...img, status: PROCESSING_STATUS.PROCESSING, progress: 0 }
            : img
        )
      )

      const img = await loadImage(selectedImage.dataUrl)
      const result = await compressImage(img, params)

      const updatedImage = {
        ...selectedImage,
        ...result,
        status: PROCESSING_STATUS.COMPLETED,
        progress: 100,
      }

      setImages((prev) =>
        prev.map((img) => (img.id === selectedImageId ? updatedImage : img))
      )

      const historyItem = {
        id: generateId('history'),
        name: selectedImage.name,
        quality: params.quality,
        scale: params.scale,
        format: params.format,
        originalSize: selectedImage.originalSize,
        compressedSize: result.compressedSize,
        originalWidth: selectedImage.originalWidth,
        originalHeight: selectedImage.originalHeight,
        compressedWidth: result.compressedWidth,
        compressedHeight: result.compressedHeight,
        compressedAt: new Date().toISOString(),
      }

      const newHistory = addToHistory(historyItem)
      setHistory(newHistory)
    } catch (err) {
      console.error('压缩失败:', err)
      setImages((prev) =>
        prev.map((img) =>
          img.id === selectedImageId
            ? { ...img, status: PROCESSING_STATUS.FAILED, error: err.message }
            : img
        )
      )
      alert('压缩失败: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedImage, selectedImageId, params])

  const handleCompressBatch = useCallback(async () => {
    if (images.length === 0) return

    setIsProcessing(true)
    const results = []
    const compressedItems = []

    for (let i = 0; i < images.length; i++) {
      const imageItem = images[i]
      try {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageItem.id
              ? { ...img, status: PROCESSING_STATUS.PROCESSING, progress: 0 }
              : img
          )
        )

        const img = await loadImage(imageItem.dataUrl)
        const result = await compressImage(img, params)

        const updatedImage = {
          ...imageItem,
          ...result,
          status: PROCESSING_STATUS.COMPLETED,
          progress: 100,
        }

        setImages((prev) =>
          prev.map((img) => (img.id === imageItem.id ? updatedImage : img))
        )

        results.push(updatedImage)
        compressedItems.push({
          id: generateId('history'),
          name: imageItem.name,
          quality: params.quality,
          scale: params.scale,
          format: params.format,
          originalSize: imageItem.originalSize,
          compressedSize: result.compressedSize,
          originalWidth: imageItem.originalWidth,
          originalHeight: imageItem.originalHeight,
          compressedWidth: result.compressedWidth,
          compressedHeight: result.compressedHeight,
          compressedAt: new Date().toISOString(),
        })
      } catch (err) {
        console.error('压缩失败:', err)
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageItem.id
              ? { ...img, status: PROCESSING_STATUS.FAILED, error: err.message }
              : img
          )
        )
      }
    }

    if (compressedItems.length > 0) {
      const newHistory = addBatchToHistory(compressedItems)
      setHistory(newHistory)
    }

    setIsProcessing(false)
  }, [images, params])

  const handleDownload = useCallback((imageItem) => {
    if (!imageItem?.blob) return
    const filename = generateCompressedFileName(imageItem.name, params.format)
    downloadBlob(imageItem.blob, filename)
  }, [params.format])

  const handleDownloadAll = useCallback(async () => {
    const completedImages = images.filter(
      (img) => img.status === PROCESSING_STATUS.COMPLETED && img.blob
    )
    for (const img of completedImages) {
      const filename = generateCompressedFileName(img.name, params.format)
      downloadBlob(img.blob, filename)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }, [images, params.format])

  const handleDividerMouseDown = (e) => {
    e.preventDefault()
    setIsDraggingDivider(true)
  }

  const handleDividerMouseMove = useCallback((e) => {
    if (!isDraggingDivider || !compareSliderRef.current) return
    const rect = compareSliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setDividerPosition(percent)
  }, [isDraggingDivider])

  const handleDividerMouseUp = useCallback(() => {
    setIsDraggingDivider(false)
  }, [])

  useEffect(() => {
    if (isDraggingDivider) {
      window.addEventListener('mousemove', handleDividerMouseMove)
      window.addEventListener('mouseup', handleDividerMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleDividerMouseMove)
        window.removeEventListener('mouseup', handleDividerMouseUp)
      }
    }
  }, [isDraggingDivider, handleDividerMouseMove, handleDividerMouseUp])

  const handleClearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      const newHistory = clearHistory()
      setHistory(newHistory)
    }
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const batchSummary = calculateTotalSavings(
    images.filter((img) => img.status === PROCESSING_STATUS.COMPLETED)
  )

  return (
    <div className="ic-page">
      <div className="ic-header">
        <button className="ic-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="ic-title">图片压缩工具</h1>
      </div>

      <div className="ic-main">
        <div className="ic-section">
          <h2 className="ic-section-title">上传图片</h2>
          <div
            className={`ic-upload-zone ${isDragOver ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="ic-upload-icon">📤</div>
            <div className="ic-upload-text">拖拽图片到此处，或点击选择文件</div>
            <div className="ic-upload-hint">支持 JPG、PNG、WebP 格式，可多选</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="ic-hidden-input"
            onChange={handleFileInputChange}
          />

          {images.length > 0 && (
            <div className="ic-thumb-grid">
              {images.map((img) => (
                <div key={img.id} className="ic-thumb-item">
                  <img src={img.dataUrl} alt={img.name} className="ic-thumb-image" />
                  <button
                    className="ic-thumb-delete"
                    onClick={() => handleDeleteImage(img.id)}
                    title="删除"
                  >
                    ×
                  </button>
                  <div className="ic-thumb-info">
                    <div className="ic-thumb-name" title={img.name}>
                      {img.name}
                    </div>
                    <div className="ic-thumb-size">{formatFileSize(img.originalSize)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {images.length === 1 && selectedImage && (
          <div className="ic-section">
            <h2 className="ic-section-title">单图压缩</h2>
            <div className="ic-editor-container">
              <div className="ic-preview-panel">
                <div className="ic-preview-title">原图</div>
                <div className="ic-preview-image-wrapper">
                  <img
                    src={selectedImage.dataUrl}
                    alt="原图"
                    className="ic-preview-image"
                  />
                </div>
                <div className="ic-preview-info">
                  <div className="ic-info-row">
                    <span className="ic-info-label">文件名</span>
                    <span className="ic-info-value">{selectedImage.name}</span>
                  </div>
                  <div className="ic-info-row">
                    <span className="ic-info-label">格式</span>
                    <span className="ic-info-value">
                      {selectedImage.file?.type?.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="ic-info-row">
                    <span className="ic-info-label">尺寸</span>
                    <span className="ic-info-value">
                      {selectedImage.originalWidth} × {selectedImage.originalHeight}
                    </span>
                  </div>
                  <div className="ic-info-row">
                    <span className="ic-info-label">大小</span>
                    <span className="ic-info-value">
                      {formatFileSize(selectedImage.originalSize)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ic-params-panel">
                <div className="ic-slider-row">
                  <div className="ic-slider-label">
                    <span>压缩预设</span>
                  </div>
                  <div className="ic-preset-group">
                    {Object.entries(COMPRESSION_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        className={`ic-preset-btn ${activePreset === key ? 'active' : ''}`}
                        onClick={() => handlePresetClick(key)}
                      >
                        <span className="ic-preset-name">{preset.name}</span>
                        <span className="ic-preset-desc">{preset.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ic-slider-row">
                  <div className="ic-slider-label">
                    <span>压缩质量</span>
                    <span className="ic-slider-value">{params.quality}%</span>
                  </div>
                  <input
                    type="range"
                    min={PARAM_RANGES.quality.min}
                    max={PARAM_RANGES.quality.max}
                    step={PARAM_RANGES.quality.step}
                    value={params.quality}
                    onChange={(e) => handleParamChange('quality', Number(e.target.value))}
                    className="ic-slider"
                  />
                </div>

                <div className="ic-slider-row">
                  <div className="ic-slider-label">
                    <span>尺寸缩放</span>
                    <span className="ic-slider-value">{params.scale}%</span>
                  </div>
                  <input
                    type="range"
                    min={PARAM_RANGES.scale.min}
                    max={PARAM_RANGES.scale.max}
                    step={PARAM_RANGES.scale.step}
                    value={params.scale}
                    onChange={(e) => handleParamChange('scale', Number(e.target.value))}
                    className="ic-slider"
                  />
                </div>

                <div className="ic-dimension-group">
                  <div className="ic-dimension-item">
                    <label className="ic-dimension-label">宽度 (px)</label>
                    <input
                      type="number"
                      className="ic-dimension-input"
                      value={params.width || ''}
                      placeholder={selectedImage.originalWidth}
                      onChange={(e) => handleParamChange('width', e.target.value)}
                    />
                  </div>
                  <div className="ic-dimension-item">
                    <label className="ic-dimension-label">高度 (px)</label>
                    <input
                      type="number"
                      className="ic-dimension-input"
                      value={params.height || ''}
                      placeholder={selectedImage.originalHeight}
                      onChange={(e) => handleParamChange('height', e.target.value)}
                    />
                  </div>
                </div>

                <label className="ic-checkbox-row">
                  <input
                    type="checkbox"
                    className="ic-checkbox"
                    checked={params.maintainAspectRatio}
                    onChange={(e) => handleParamChange('maintainAspectRatio', e.target.checked)}
                  />
                  保持宽高比
                </label>

                <div className="ic-format-group">
                  <label className="ic-format-label">输出格式</label>
                  <div className="ic-format-buttons">
                    {Object.entries(OUTPUT_FORMATS).map(([key, format]) => (
                      <button
                        key={key}
                        className={`ic-format-btn ${params.format === format ? 'active' : ''}`}
                        onClick={() => handleParamChange('format', format)}
                      >
                        {FORMAT_NAMES[format]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ic-action-buttons">
                  <button
                    className="ic-btn ic-btn-primary"
                    onClick={handleCompressSingle}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '压缩中...' : '开始压缩'}
                  </button>
                  {selectedImage.status === PROCESSING_STATUS.COMPLETED && (
                    <button
                      className="ic-btn ic-btn-success"
                      onClick={() => handleDownload(selectedImage)}
                    >
                      下载
                    </button>
                  )}
                </div>
              </div>

              <div className="ic-preview-panel">
                <div className="ic-preview-title">压缩后</div>
                <div className="ic-preview-image-wrapper">
                  {selectedImage.compressedDataUrl ? (
                    <img
                      src={selectedImage.compressedDataUrl}
                      alt="压缩后"
                      className="ic-preview-image"
                    />
                  ) : (
                    <div className="ic-empty">
                      <div className="ic-empty-icon">🖼️</div>
                      <div>压缩后预览</div>
                    </div>
                  )}
                </div>
                <div className="ic-preview-info">
                  <div className="ic-info-row">
                    <span className="ic-info-label">预估大小</span>
                    <span className="ic-info-value highlight">
                      {selectedImage.compressedSize
                        ? formatFileSize(selectedImage.compressedSize)
                        : '-'}
                    </span>
                  </div>
                  <div className="ic-info-row">
                    <span className="ic-info-label">预计尺寸</span>
                    <span className="ic-info-value">
                      {(() => {
                        const dims = calculateScaledDimensions(
                          selectedImage.originalWidth,
                          selectedImage.originalHeight,
                          params.scale,
                          params.width,
                          params.height,
                          params.maintainAspectRatio
                        )
                        return `${dims.width} × ${dims.height}`
                      })()}
                    </span>
                  </div>
                  <div className="ic-info-row">
                    <span className="ic-info-label">节省空间</span>
                    <span className="ic-info-value highlight">
                      {selectedImage.compressedSize
                        ? `${calculateSavingsPercent(
                            selectedImage.originalSize,
                            selectedImage.compressedSize
                          )}%`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedImage && selectedImage.compressedDataUrl && (
          <div className="ic-section">
            <div className="ic-compare-header">
              <h2 className="ic-section-title" style={{ marginBottom: 0 }}>
                压缩对比
              </h2>
              <div className="ic-compare-tabs">
                <button
                  className={`ic-compare-tab ${compareMode === 'side-by-side' ? 'active' : ''}`}
                  onClick={() => setCompareMode('side-by-side')}
                >
                  并排对比
                </button>
                <button
                  className={`ic-compare-tab ${compareMode === 'slider' ? 'active' : ''}`}
                  onClick={() => setCompareMode('slider')}
                >
                  滑动对比
                </button>
                <button
                  className={`ic-compare-tab ${compareMode === 'original' ? 'active' : ''}`}
                  onClick={() => setCompareMode('original')}
                >
                  仅原图
                </button>
                <button
                  className={`ic-compare-tab ${compareMode === 'compressed' ? 'active' : ''}`}
                  onClick={() => setCompareMode('compressed')}
                >
                  仅压缩图
                </button>
              </div>
            </div>

            {compareMode === 'side-by-side' && (
              <div className="ic-compare-content">
                <div className="ic-preview-panel" style={{ minHeight: 'auto' }}>
                  <div className="ic-preview-image-wrapper">
                    <img
                      src={selectedImage.dataUrl}
                      alt="原图"
                      className="ic-preview-image"
                    />
                  </div>
                </div>
                <div className="ic-preview-panel" style={{ minHeight: 'auto' }}>
                  <div className="ic-preview-image-wrapper">
                    <img
                      src={selectedImage.compressedDataUrl}
                      alt="压缩后"
                      className="ic-preview-image"
                    />
                  </div>
                </div>
                <div className="ic-compare-info-grid">
                  <div className="ic-compare-info">
                    <div className="ic-info-row">
                      <span className="ic-info-label">格式</span>
                      <span className="ic-info-value">
                        {selectedImage.file?.type?.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="ic-info-row">
                      <span className="ic-info-label">尺寸</span>
                      <span className="ic-info-value">
                        {selectedImage.originalWidth} × {selectedImage.originalHeight}
                      </span>
                    </div>
                    <div className="ic-info-row">
                      <span className="ic-info-label">大小</span>
                      <span className="ic-info-value">
                        {formatFileSize(selectedImage.originalSize)}
                      </span>
                    </div>
                  </div>
                  <div className="ic-compare-info">
                    <div className="ic-info-row">
                      <span className="ic-info-label">格式</span>
                      <span className="ic-info-value">{FORMAT_NAMES[params.format]}</span>
                    </div>
                    <div className="ic-info-row">
                      <span className="ic-info-label">尺寸</span>
                      <span className="ic-info-value">
                        {selectedImage.compressedWidth} × {selectedImage.compressedHeight}
                      </span>
                    </div>
                    <div className="ic-info-row">
                      <span className="ic-info-label">大小</span>
                      <span className="ic-info-value highlight">
                        {formatFileSize(selectedImage.compressedSize)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {compareMode === 'slider' && (
              <div
                className="ic-slider-compare"
                ref={compareSliderRef}
              >
                <div className="ic-slider-compare-wrapper">
                  <img src={selectedImage.dataUrl} alt="原图" />
                  <img
                    src={selectedImage.compressedDataUrl}
                    alt="压缩后"
                    className="ic-compressed-img"
                    style={{ clipPath: `inset(0 0 0 ${dividerPosition}%)` }}
                  />
                  <div
                    className="ic-compare-divider"
                    style={{ left: `${dividerPosition}%` }}
                    onMouseDown={handleDividerMouseDown}
                  />
                </div>
              </div>
            )}

            {compareMode === 'original' && (
              <div className="ic-preview-image-wrapper" style={{ minHeight: '350px' }}>
                <img
                  src={selectedImage.dataUrl}
                  alt="原图"
                  className="ic-preview-image"
                />
              </div>
            )}

            {compareMode === 'compressed' && (
              <div className="ic-preview-image-wrapper" style={{ minHeight: '350px' }}>
                <img
                  src={selectedImage.compressedDataUrl}
                  alt="压缩后"
                  className="ic-preview-image"
                />
              </div>
            )}
          </div>
        )}

        {isBatchMode && (
          <div className="ic-section">
            <h2 className="ic-section-title">批量压缩 ({images.length} 张图片)</h2>

            <div className="ic-batch-params">
              <div className="ic-slider-row" style={{ marginBottom: 0 }}>
                <div className="ic-slider-label">
                  <span>压缩预设</span>
                </div>
                <div className="ic-preset-group">
                  {Object.entries(COMPRESSION_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      className={`ic-preset-btn ${activePreset === key ? 'active' : ''}`}
                      onClick={() => handlePresetClick(key)}
                    >
                      <span className="ic-preset-name">{preset.name}</span>
                      <span className="ic-preset-desc">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ic-slider-row" style={{ marginBottom: 0 }}>
                <div className="ic-slider-label">
                  <span>压缩质量</span>
                  <span className="ic-slider-value">{params.quality}%</span>
                </div>
                <input
                  type="range"
                  min={PARAM_RANGES.quality.min}
                  max={PARAM_RANGES.quality.max}
                  step={PARAM_RANGES.quality.step}
                  value={params.quality}
                  onChange={(e) => handleParamChange('quality', Number(e.target.value))}
                  className="ic-slider"
                />
              </div>

              <div className="ic-slider-row" style={{ marginBottom: 0 }}>
                <div className="ic-slider-label">
                  <span>尺寸缩放</span>
                  <span className="ic-slider-value">{params.scale}%</span>
                </div>
                <input
                  type="range"
                  min={PARAM_RANGES.scale.min}
                  max={PARAM_RANGES.scale.max}
                  step={PARAM_RANGES.scale.step}
                  value={params.scale}
                  onChange={(e) => handleParamChange('scale', Number(e.target.value))}
                  className="ic-slider"
                />
              </div>

              <div className="ic-format-group" style={{ marginBottom: 0 }}>
                <label className="ic-format-label">输出格式</label>
                <div className="ic-format-buttons">
                  {Object.entries(OUTPUT_FORMATS).map(([key, format]) => (
                    <button
                      key={key}
                      className={`ic-format-btn ${params.format === format ? 'active' : ''}`}
                      onClick={() => handleParamChange('format', format)}
                    >
                      {FORMAT_NAMES[format]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ic-action-buttons" style={{ marginBottom: 20 }}>
              <button
                className="ic-btn ic-btn-primary"
                onClick={handleCompressBatch}
                disabled={isProcessing}
              >
                {isProcessing ? '处理中...' : '全部压缩'}
              </button>
              {batchSummary.totalCompressed > 0 && (
                <button
                  className="ic-btn ic-btn-success"
                  onClick={handleDownloadAll}
                >
                  打包下载全部
                </button>
              )}
            </div>

            {batchSummary.totalCompressed > 0 && (
              <div className="ic-batch-summary">
                <div className="ic-summary-item">
                  <div className="ic-summary-value">
                    {formatFileSize(batchSummary.totalOriginal)}
                  </div>
                  <div className="ic-summary-label">原始总大小</div>
                </div>
                <div className="ic-summary-item">
                  <div className="ic-summary-value">
                    {formatFileSize(batchSummary.totalCompressed)}
                  </div>
                  <div className="ic-summary-label">压缩后总大小</div>
                </div>
                <div className="ic-summary-item">
                  <div className="ic-summary-value">
                    {formatFileSize(batchSummary.totalSavings)}
                  </div>
                  <div className="ic-summary-label">已节省空间</div>
                </div>
                <div className="ic-summary-item">
                  <div className="ic-summary-value">{batchSummary.savingsPercent}%</div>
                  <div className="ic-summary-label">压缩率</div>
                </div>
              </div>
            )}

            <div className="ic-batch-list">
              {images.map((img) => (
                <div key={img.id} className="ic-batch-item">
                  <img src={img.dataUrl} alt={img.name} className="ic-batch-thumb" />
                  <div className="ic-batch-info">
                    <div className="ic-batch-name">{img.name}</div>
                    <div className="ic-batch-size">
                      原始: {formatFileSize(img.originalSize)}
                      {img.compressedSize > 0 && (
                        <>
                          {' → '}
                          <span style={{ color: '#67c23a' }}>
                            {formatFileSize(img.compressedSize)}
                          </span>
                          <span style={{ color: '#999', marginLeft: 8 }}>
                            (节省 {calculateSavingsPercent(img.originalSize, img.compressedSize)}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ic-batch-progress">
                    {img.status === PROCESSING_STATUS.PROCESSING && (
                      <>
                        <div className="ic-progress-bar">
                          <div className="ic-progress-fill" style={{ width: `${img.progress}%` }} />
                        </div>
                        <div className="ic-progress-text">处理中...</div>
                      </>
                    )}
                    {img.status === PROCESSING_STATUS.COMPLETED && (
                      <div className="ic-progress-text" style={{ color: '#67c23a' }}>
                        ✓ 已完成
                      </div>
                    )}
                    {img.status === PROCESSING_STATUS.FAILED && (
                      <div className="ic-progress-text" style={{ color: '#f56c6c' }}>
                        ✗ 失败: {img.error}
                      </div>
                    )}
                    {img.status === PROCESSING_STATUS.PENDING && (
                      <div className="ic-progress-text">等待处理</div>
                    )}
                  </div>
                  <button
                    className="ic-batch-download"
                    disabled={img.status !== PROCESSING_STATUS.COMPLETED || !img.blob}
                    onClick={() => handleDownload(img)}
                  >
                    下载
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ic-section">
          <div className="ic-history-header">
            <h2 className="ic-section-title" style={{ marginBottom: 0 }}>
              压缩历史 ({history.length}/{MAX_HISTORY_ITEMS})
            </h2>
            {history.length > 0 && (
              <button className="ic-history-clear" onClick={handleClearHistory}>
                清空历史
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="ic-empty">
              <div className="ic-empty-icon">📋</div>
              <div>暂无压缩记录</div>
            </div>
          ) : (
            <div className="ic-history-list">
              {history.map((item) => {
                const displayItem = formatHistoryItemDisplay(item)
                return (
                  <div key={item.id} className="ic-history-item">
                    <div className="ic-history-name" title={item.name}>
                      {item.name}
                    </div>
                    <div className="ic-history-params">
                      质量 {item.quality}% · 尺寸 {item.scale}% · {displayItem?.formatName}
                    </div>
                    <div className="ic-history-savings">
                      -{displayItem?.savingsPercent || 0}%
                    </div>
                    <div className="ic-history-date">
                      {formatDate(item.compressedAt)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageCompressorPage
