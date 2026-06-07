import { useState } from 'react';

function AddMarkerModal({ position, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      x: position.x,
      y: position.y,
    });
  };

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h3>添加标记点</h3>
          <button className="marker-info-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="map-modal-body">
            <div className="map-form-group">
              <label>名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="marker-info-input"
                placeholder="请输入名称"
                autoFocus
              />
            </div>
            <div className="map-form-group">
              <label>描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="marker-info-textarea"
                placeholder="请输入描述（可选）"
                rows={3}
              />
            </div>
            <div className="map-form-group">
              <label>坐标</label>
              <code>X: {position.x.toFixed(1)}, Y: {position.y.toFixed(1)}</code>
            </div>
          </div>
          <div className="map-modal-footer">
            <button type="button" className="map-btn" onClick={onClose}>取消</button>
            <button type="submit" className="map-btn map-btn-primary" disabled={!name.trim()}>添加</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMarkerModal;
