export default function ImageViewer({ src, onClose }) {
  if (!src) return null
  return (
    <div className="image-viewer-mask" onClick={onClose}>
      <img className="image-viewer-img" src={src} alt="preview" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}
