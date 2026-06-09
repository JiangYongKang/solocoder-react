import { ELEMENT_TYPES, PRESET_COLORS, MIN_FONT_SIZE, MAX_FONT_SIZE, DEFAULT_BORDER_WIDTH } from './constants.js'

function ColorPicker({ value, onChange, label }) {
  return (
    <div>
      {label && <label className="se-properties-label">{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="se-color-picker"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="se-properties-input"
          style={{ flex: 1 }}
        />
      </div>
      <div className="se-preset-colors">
        {PRESET_COLORS.map((color) => (
          <div
            key={color}
            className="se-preset-color"
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  )
}

export default function PropertyPanel({ selectedElement, onUpdateElement, onDeleteElement }) {
  if (!selectedElement) {
    return (
      <div className="se-properties">
        <div className="se-properties-header">
          <h3 className="se-properties-title">属性面板</h3>
        </div>
        <div className="se-empty-state">
          选择画布上的元素查看属性
        </div>
      </div>
    )
  }

  return (
    <div className="se-properties">
      <div className="se-properties-header">
        <h3 className="se-properties-title">
          {selectedElement.type === ELEMENT_TYPES.TEXT && '文本属性'}
          {selectedElement.type === ELEMENT_TYPES.IMAGE && '图片属性'}
          {selectedElement.type === ELEMENT_TYPES.SHAPE && '形状属性'}
        </h3>
      </div>

      <div className="se-properties-section">
        <div className="se-properties-row">
          <label className="se-properties-label" style={{ margin: 0, width: 40 }}>X</label>
          <input
            type="number"
            className="se-properties-input"
            value={Math.round(selectedElement.x)}
            onChange={(e) => onUpdateElement({ x: Number(e.target.value) })}
          />
        </div>
        <div className="se-properties-row">
          <label className="se-properties-label" style={{ margin: 0, width: 40 }}>Y</label>
          <input
            type="number"
            className="se-properties-input"
            value={Math.round(selectedElement.y)}
            onChange={(e) => onUpdateElement({ y: Number(e.target.value) })}
          />
        </div>
        <div className="se-properties-row">
          <label className="se-properties-label" style={{ margin: 0, width: 40 }}>宽</label>
          <input
            type="number"
            className="se-properties-input"
            value={Math.round(selectedElement.width)}
            onChange={(e) => onUpdateElement({ width: Number(e.target.value) })}
          />
        </div>
        <div className="se-properties-row">
          <label className="se-properties-label" style={{ margin: 0, width: 40 }}>高</label>
          <input
            type="number"
            className="se-properties-input"
            value={Math.round(selectedElement.height)}
            onChange={(e) => onUpdateElement({ height: Number(e.target.value) })}
          />
        </div>
      </div>

      {selectedElement.type === ELEMENT_TYPES.TEXT && (
        <>
          <div className="se-properties-section">
            <label className="se-properties-label">文字内容</label>
            <textarea
              className="se-properties-textarea"
              value={selectedElement.content}
              onChange={(e) => onUpdateElement({ content: e.target.value })}
              rows={4}
            />
          </div>

          <div className="se-properties-section">
            <div className="se-properties-row">
              <label className="se-properties-label" style={{ margin: 0 }}>字号</label>
              <input
                type="range"
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                value={selectedElement.fontSize}
                onChange={(e) => onUpdateElement({ fontSize: Number(e.target.value) })}
              />
              <span style={{ fontSize: 12, color: '#6b7280', width: 36 }}>{selectedElement.fontSize}</span>
            </div>
            <div className="se-properties-row">
              <button
                className={`se-toggle-btn ${selectedElement.bold ? 'active' : ''}`}
                onClick={() => onUpdateElement({ bold: !selectedElement.bold })}
                style={{ fontWeight: 'bold' }}
              >
                B
              </button>
              <button
                className={`se-toggle-btn ${selectedElement.italic ? 'active' : ''}`}
                onClick={() => onUpdateElement({ italic: !selectedElement.italic })}
                style={{ fontStyle: 'italic' }}
              >
                I
              </button>
            </div>
          </div>

          <div className="se-properties-section">
            <ColorPicker
              value={selectedElement.color}
              onChange={(color) => onUpdateElement({ color })}
              label="文字颜色"
            />
          </div>
        </>
      )}

      {selectedElement.type === ELEMENT_TYPES.IMAGE && (
        <div className="se-properties-section">
          <label className="se-properties-label">替换图片</label>
          <label className="se-btn" style={{ width: '100%', justifyContent: 'center' }}>
            📁 选择图片
            <input
              type="file"
              accept="image/*"
              className="se-hidden-input"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    onUpdateElement({ src: ev.target.result })
                  }
                  reader.readAsDataURL(file)
                }
                e.target.value = ''
              }}
            />
          </label>
        </div>
      )}

      {selectedElement.type === ELEMENT_TYPES.SHAPE && (
        <>
          <div className="se-properties-section">
            <ColorPicker
              value={selectedElement.fillColor}
              onChange={(color) => onUpdateElement({ fillColor: color })}
              label="填充色"
            />
          </div>
          <div className="se-properties-section">
            <ColorPicker
              value={selectedElement.borderColor}
              onChange={(color) => onUpdateElement({ borderColor: color })}
              label="边框色"
            />
          </div>
          <div className="se-properties-section">
            <div className="se-properties-row">
              <label className="se-properties-label" style={{ margin: 0 }}>边框宽</label>
              <input
                type="range"
                min={0}
                max={20}
                value={selectedElement.borderWidth}
                onChange={(e) => onUpdateElement({ borderWidth: Number(e.target.value) })}
              />
              <span style={{ fontSize: 12, color: '#6b7280', width: 24 }}>{selectedElement.borderWidth}</span>
            </div>
          </div>
        </>
      )}

      <div className="se-properties-section">
        <button
          className="se-btn se-btn-danger"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onDeleteElement}
        >
          🗑️ 删除元素
        </button>
      </div>
    </div>
  )
}
