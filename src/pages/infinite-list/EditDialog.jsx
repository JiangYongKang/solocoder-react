import { useState, useEffect, useRef } from 'react';

export default function EditDialog({ open, initialTitle, onClose, onSubmit }) {
  const [value, setValue] = useState(initialTitle || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => {
        setValue(initialTitle || '');
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(id);
    }
  }, [open, initialTitle]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div className="dlg-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="dlg-title">编辑标题</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="dlg-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="请输入新标题"
          />
          <div className="dlg-actions">
            <button type="button" className="dlg-btn dlg-btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="dlg-btn dlg-btn-ok" disabled={!value.trim()}>
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
