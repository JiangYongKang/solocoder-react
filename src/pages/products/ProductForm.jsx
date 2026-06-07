import { useState, useRef } from 'react'
import { CATEGORIES, PRODUCT_STATUS, PRODUCT_STATUS_LABEL } from './constants'
import { validateProduct, fileToDataURL } from './utils'

export default function ProductForm({ initialData, externalErrors, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    price: initialData?.price ?? '',
    category: initialData?.category || '',
    stock: initialData?.stock ?? '',
    status: initialData?.status || PRODUCT_STATUS.ON_SHELF,
    image: initialData?.image || '',
  }))
  const [errors, setErrors] = useState(externalErrors || {})
  const [previewError, setPreviewError] = useState('')
  const fileInputRef = useRef(null)

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewError('')
    try {
      const dataUrl = await fileToDataURL(file)
      handleChange('image', dataUrl)
    } catch (err) {
      setPreviewError(err.message)
    }
  }

  function handleRemoveImage() {
    handleChange('image', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateProduct(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    const result = onSubmit(formData)
    if (result && result.success === false && result.errors) {
      setErrors(result.errors)
    }
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="form-label">
          商品名称 <span className="required">*</span>
        </label>
        <input
          className={`form-input ${errors.name ? 'has-error' : ''}`}
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="请输入商品名称"
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-grid">
        <div className="form-row">
          <label className="form-label">
            价格（元） <span className="required">*</span>
          </label>
          <input
            className={`form-input ${errors.price ? 'has-error' : ''}`}
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            placeholder="0.00"
          />
          {errors.price && <span className="form-error">{errors.price}</span>}
        </div>

        <div className="form-row">
          <label className="form-label">
            库存数量 <span className="required">*</span>
          </label>
          <input
            className={`form-input ${errors.stock ? 'has-error' : ''}`}
            type="number"
            step="1"
            min="0"
            value={formData.stock}
            onChange={(e) => handleChange('stock', e.target.value)}
            placeholder="0"
          />
          {errors.stock && <span className="form-error">{errors.stock}</span>}
        </div>
      </div>

      <div className="form-grid">
        <div className="form-row">
          <label className="form-label">
            分类 <span className="required">*</span>
          </label>
          <select
            className={`form-input ${errors.category ? 'has-error' : ''}`}
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">请选择分类</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="form-error">{errors.category}</span>
          )}
        </div>

        <div className="form-row">
          <label className="form-label">
            上下架状态 <span className="required">*</span>
          </label>
          <select
            className={`form-input ${errors.status ? 'has-error' : ''}`}
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            {Object.entries(PRODUCT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.status && (
            <span className="form-error">{errors.status}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">商品图片</label>
        <div className="image-upload">
          {formData.image ? (
            <div className="image-preview-wrap">
              <img
                className="image-preview"
                src={formData.image}
                alt="预览"
              />
              <button
                type="button"
                className="btn-remove-image"
                onClick={handleRemoveImage}
              >
                移除图片
              </button>
            </div>
          ) : (
            <label className="image-upload-label">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
              <div className="image-upload-placeholder">
                <span className="upload-icon">+</span>
                <span>点击上传图片</span>
              </div>
            </label>
          )}
        </div>
        {previewError && <span className="form-error">{previewError}</span>}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          确定
        </button>
      </div>
    </form>
  )
}
