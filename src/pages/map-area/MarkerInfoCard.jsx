import { useState } from 'react';

function MarkerInfoCard({ marker, onClose, onEdit, onDelete, onToggleRoute }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(marker?.name || '');
  const [editedDesc, setEditedDesc] = useState(marker?.description || '');

  if (!marker) return null;

  const handleSave = () => {
    if (editedName.trim()) {
      onEdit({ name: editedName.trim(), description: editedDesc.trim() });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(marker.name);
    setEditedDesc(marker.description);
    setIsEditing(false);
  };

  return (
    <div className="marker-info-card">
      <div className="marker-info-header">
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="marker-info-input"
            autoFocus
          />
        ) : (
          <h3 className="marker-info-title">{marker.name}</h3>
        )}
        <button className="marker-info-close" onClick={onClose}>×</button>
      </div>

      <div className="marker-info-body">
        {isEditing ? (
          <textarea
            value={editedDesc}
            onChange={(e) => setEditedDesc(e.target.value)}
            className="marker-info-textarea"
            placeholder="描述..."
            rows={3}
          />
        ) : (
          <p className="marker-info-desc">{marker.description || '暂无描述'}</p>
        )}

        <div className="marker-info-coords">
          <span className="marker-info-coord-label">坐标：</span>
          <code>X: {marker.x.toFixed(1)}, Y: {marker.y.toFixed(1)}</code>
        </div>
      </div>

      <div className="marker-info-actions">
        {isEditing ? (
          <>
            <button className="map-btn map-btn-primary" onClick={handleSave}>保存</button>
            <button className="map-btn" onClick={handleCancel}>取消</button>
          </>
        ) : (
          <>
            <button className="map-btn map-btn-primary" onClick={onToggleRoute}>
              路线规划
            </button>
            <button className="map-btn" onClick={() => setIsEditing(true)}>编辑</button>
            <button className="map-btn map-btn-danger" onClick={onDelete}>删除</button>
          </>
        )}
      </div>
    </div>
  );
}

export default MarkerInfoCard;
