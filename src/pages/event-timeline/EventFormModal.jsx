import { useState } from 'react';
import { EMOJI_OPTIONS } from './constants.js';
import { validateEvent } from './timelineUtils.js';

export default function EventFormModal({
  initialData,
  availableTags,
  onClose,
  onSubmit,
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        title: initialData.title || '',
        date: initialData.date || '',
        endDate: initialData.endDate || '',
        description: initialData.description || '',
        tags: [...(initialData.tags || [])],
        icon: initialData.icon || '📅',
        customTag: '',
      };
    }
    return {
      title: '',
      date: today,
      endDate: '',
      description: '',
      tags: [],
      icon: '📅',
      customTag: '',
    };
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleTag = (tag) => {
    setForm((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag],
      };
    });
  };

  const addCustomTag = () => {
    const tag = form.customTag.trim();
    if (!tag) return;
    if (!form.tags.includes(tag)) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
        customTag: '',
      }));
    } else {
      setForm((prev) => ({ ...prev, customTag: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      date: form.date,
      endDate: form.endDate || null,
      description: form.description,
      tags: form.tags,
      icon: form.icon,
    };
    const validation = validateEvent(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    onSubmit(payload);
  };

  return (
    <div className="et-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="et-modal" onClick={(e) => e.stopPropagation()}>
        <div className="et-modal-header">
          <h2>{initialData ? '编辑事件' : '添加事件'}</h2>
          <button type="button" className="et-modal-close" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <form className="et-modal-body" onSubmit={handleSubmit}>
          <div className="et-form-field">
            <label htmlFor="et-title">事件标题 <span className="et-required">*</span></label>
            <input
              id="et-title"
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`et-form-input ${errors.title ? 'et-input-error' : ''}`}
              placeholder="请输入事件标题"
            />
            {errors.title && <div className="et-error">{errors.title}</div>}
          </div>

          <div className="et-form-row">
            <div className="et-form-field">
              <label htmlFor="et-date">开始日期 <span className="et-required">*</span></label>
              <input
                id="et-date"
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`et-form-input ${errors.date ? 'et-input-error' : ''}`}
              />
              {errors.date && <div className="et-error">{errors.date}</div>}
            </div>
            <div className="et-form-field">
              <label htmlFor="et-enddate">结束日期（选填）</label>
              <input
                id="et-enddate"
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className={`et-form-input ${errors.endDate ? 'et-input-error' : ''}`}
              />
              {errors.endDate && <div className="et-error">{errors.endDate}</div>}
            </div>
          </div>

          <div className="et-form-field">
            <label>事件图标</label>
            <div className="et-emoji-grid" role="radiogroup" aria-label="选择图标">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  role="radio"
                  aria-checked={form.icon === emoji}
                  className={`et-emoji-btn ${form.icon === emoji ? 'et-emoji-active' : ''}`}
                  onClick={() => handleChange('icon', emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="et-form-field">
            <label>标签</label>
            <div className="et-tag-options">
              {availableTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`et-tag-option ${form.tags.includes(tag) ? 'et-tag-option-active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {form.tags.includes(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
            </div>
            <div className="et-tag-add">
              <input
                type="text"
                value={form.customTag}
                onChange={(e) => handleChange('customTag', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                className="et-form-input et-tag-input"
                placeholder="输入自定义标签名"
              />
              <button
                type="button"
                className="et-btn et-btn-ghost"
                onClick={addCustomTag}
              >
                添加
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="et-selected-tags">
                已选：{form.tags.map((t) => (
                  <span key={t} className="et-tag et-tag-removable" onClick={() => toggleTag(t)}>
                    {t} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="et-form-field">
            <label htmlFor="et-desc">描述</label>
            <textarea
              id="et-desc"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="et-form-input et-form-textarea"
              placeholder="请输入事件描述..."
              rows={4}
            />
          </div>

          <div className="et-modal-actions">
            <button type="button" className="et-btn et-btn-ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="et-btn et-btn-primary">
              {initialData ? '保存修改' : '添加事件'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
