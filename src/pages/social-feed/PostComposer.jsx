import { useState, useRef } from 'react'
import { MAX_IMAGES, MAX_TEXT_LENGTH, CURRENT_USER } from './constants'
import { validatePostContent, validateImages, fileToDataURL, extractTopics } from './utils'

export default function PostComposer({ onPublish }) {
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const charCount = content.length
  const isOverLimit = charCount > MAX_TEXT_LENGTH

  const handleContentChange = (e) => {
    setContent(e.target.value)
    setError('')
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = MAX_IMAGES - images.length
    const filesToProcess = files.slice(0, remainingSlots)

    try {
      const newImages = []
      for (const file of filesToProcess) {
        if (file.type && file.type.startsWith('image/')) {
          const dataUrl = await fileToDataURL(file)
          newImages.push(dataUrl)
        }
      }
      setImages((prev) => [...prev, ...newImages])
    } catch {
      setError('图片上传失败')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const contentValidation = validatePostContent(content)
    if (!contentValidation.valid) {
      setError(contentValidation.error)
      return
    }
    const imagesValidation = validateImages(images)
    if (!imagesValidation.valid) {
      setError(imagesValidation.error)
      return
    }

    onPublish?.({ content: content.trim(), images: [...images] })
    setContent('')
    setImages([])
    setError('')
  }

  const topics = extractTopics(content)

  return (
    <div className="sf-composer">
      <div className="sf-composer-header">
        <img src={CURRENT_USER.avatar} alt="" className="sf-avatar" />
        <textarea
          placeholder="分享新鲜事..."
          value={content}
          onChange={handleContentChange}
          maxLength={MAX_TEXT_LENGTH + 100}
        />
      </div>

      {topics.length > 0 && (
        <div className="sf-topic-tags">
          {topics.map((topic, i) => (
            <span key={`${topic}_${i}`} className="sf-topic-tag">
              #{topic}
            </span>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="sf-image-preview">
          {images.map((img, index) => (
            <div key={index} className="sf-image-item">
              <img src={img} alt="" />
              <button
                type="button"
                className="sf-image-remove"
                onClick={() => handleRemoveImage(index)}
                aria-label="移除图片"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="sf-error-msg" style={{ paddingLeft: 52 }}>{error}</div>}

      <div className="sf-composer-footer">
        <div className="sf-composer-tools">
          <label className="sf-tool-btn" title="添加图片">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>图片</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={images.length >= MAX_IMAGES}
            />
          </label>
          <span className="sf-tool-btn" title="添加话题">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="9" x2="20" y2="9" />
              <line x1="4" y1="15" x2="20" y2="15" />
              <line x1="10" y1="3" x2="8" y2="21" />
              <line x1="16" y1="3" x2="14" y2="21" />
            </svg>
            <span>#话题</span>
          </span>
        </div>
        <div>
          <span className={`sf-char-count ${isOverLimit ? 'sf-char-over' : ''}`}>
            {charCount}/{MAX_TEXT_LENGTH}
          </span>
          <button
            type="button"
            className="sf-submit-btn"
            onClick={handleSubmit}
            disabled={isOverLimit || content.trim().length === 0}
          >
            发布
          </button>
        </div>
      </div>
    </div>
  )
}
