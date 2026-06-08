import { WHITE_NOISE_OPTIONS } from './constants'

const WhiteNoiseSelector = ({ selectedId, onSelect }) => {
  return (
    <div className="white-noise-grid">
      {WHITE_NOISE_OPTIONS.map((opt) => (
        <div
          key={opt.id}
          className={`white-noise-item ${selectedId === opt.id ? 'active' : ''}`}
          onClick={() => onSelect(opt.id)}
        >
          <span className="white-noise-icon">{opt.icon}</span>
          <span className="white-noise-name">{opt.label}</span>
          {selectedId === opt.id && opt.id !== 'silent' && (
            <span className="white-noise-status">播放中</span>
          )}
          {selectedId === opt.id && opt.id === 'silent' && (
            <span className="white-noise-status">已选中</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default WhiteNoiseSelector
